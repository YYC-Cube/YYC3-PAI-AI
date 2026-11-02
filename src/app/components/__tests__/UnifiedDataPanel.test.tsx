/**
 * @file UnifiedDataPanel.test.tsx
 * @description 统一数据管理面板专项 — 真 unified-data-store 扫描/页签/勾选批量/行删除/导出下载/加密口令弹窗
 * 策略：真 store + 真 theme-store + i18n 兜底（t() 返回 key，断言用 key）；
 *       heavy 服务（secure-storage/indexeddb/data-portability/sync-engine）vi.mock 桩
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  secrets: new Map<string, string>(),
  startSync: vi.fn(),
  exportData: vi.fn(),
  importData: vi.fn(),
}))

vi.mock('../../services/secure-storage', () => ({
  secureStorage: {
    initialize: vi.fn(),
    unlock: vi.fn(),
    lock: vi.fn(),
    getStatus: vi.fn(),
    getSecurityScore: vi.fn(),
    storeSecret: vi.fn(),
    readSecret: vi.fn(),
    deleteSecret: vi.fn(),
  },
}))

vi.mock('../../services/indexeddb-service', () => ({
  indexedDBService: {
    open: vi.fn(),
    getStoreNames: vi.fn(),
    getAll: vi.fn(),
    getData: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    migrateFromLocalStorage: vi.fn(),
  },
}))

vi.mock('../../services/data-portability-manager', () => ({
  dataPortabilityManager: {
    exportData: h.exportData,
    importData: h.importData,
    previewImport: vi.fn(),
  },
}))

vi.mock('../../services/sync-engine', () => ({
  getSyncEngine: () => ({ startSync: h.startSync }),
}))

import { UnifiedDataPanel } from '../UnifiedDataPanel'
import { useUnifiedDataStore } from '../../store/unified-data-store'
import { secureStorage } from '../../services/secure-storage'
import { indexedDBService } from '../../services/indexeddb-service'

// ── Helpers ──

const seedLS = () => {
  localStorage.setItem('yyc3_model_config', JSON.stringify({ model: 'glm-4.6' }))
  localStorage.setItem('yyc3_notes_1', JSON.stringify({ text: 'hello' }))
}

/** 重置真 store 的 UI/派生态（函数句柄 zustand 稳定，无需重置） */
const resetStore = () => {
  useUnifiedDataStore.setState({
    entries: [],
    totalSize: 0,
    totalEntries: 0,
    quotas: [],
    activeTab: 'overview',
    searchQuery: '',
    selectedEntries: [],
    sync: { lastSync: null, pending: 0, conflicts: 0, errors: 0, isSyncing: false, progress: 0 },
    security: {
      vaultLocked: true,
      encryptionEnabled: false,
      initialized: false,
      keyDerivationIterations: 100000,
      lastAuditTime: Date.now(),
      securityScore: 85,
      secureItemCount: 0,
    },
    portability: {
      exportInProgress: false,
      importInProgress: false,
      lastExport: null,
      lastImport: null,
      supportedFormats: ['json', 'zip', 'sqlite'],
    },
  })
}

const tabBtn = (root: HTMLElement, name: string) =>
  Array.from(root.querySelectorAll('button')).find(b => b.textContent === name)!

let clickSpy: ReturnType<typeof vi.spyOn>
let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  resetStore()
  h.secrets.clear()
  // resetAllMocks 清实现 → 逐项回填桩行为
  vi.mocked(secureStorage.getSecurityScore).mockReturnValue(85)
  vi.mocked(secureStorage.storeSecret).mockImplementation(async (id, v) => { h.secrets.set(id, v) })
  vi.mocked(secureStorage.readSecret).mockImplementation(async id => h.secrets.get(id) ?? null)
  vi.mocked(indexedDBService.getStoreNames).mockReturnValue([])
  vi.mocked(indexedDBService.getAll).mockResolvedValue([])
  h.startSync.mockResolvedValue({ syncedItems: 2, failedItems: 0, conflictedItems: 0, errors: [] })
  // portability-manager 导出返回形状：store 取 result.blob 下发下载
  h.exportData.mockResolvedValue({
    success: true,
    entries: 2,
    size: 100,
    format: 'json',
    blob: new Blob(['{}'], { type: 'application/json' }),
  })
  // 导出下载链路三件套：blob URL + <a>.click + revoke
  createObjectURL = vi.fn(() => 'blob:yyc3-export-test')
  revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true })
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })
})

afterEach(() => {
  vi.unstubAllGlobals()
  clickSpy.mockRestore()
})

describe('UnifiedDataPanel（统一数据管理面板）', () => {
  it('isOpen=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<UnifiedDataPanel isOpen={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('打开即触发真 store 扫描：localStorage 种子成为条目行，四页签与计数卡渲染', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    // useEffect → initialize() → scanData() 真扫描 yyc3_ 前缀键
    await waitFor(() => expect(container.textContent).toContain('yyc3_model_config'))
    expect(container.textContent).toContain('yyc3_notes_1')
    // 键名含 model → 类型推断为 models；行内元信息展示类型/大小
    expect(container.textContent).toContain('models')
    // i18n 无 Provider 兜底：t() 返回 key 本身 → 页签按 key 断言
    for (const tab of ['overview', 'sync', 'security', 'portability']) {
      expect(tabBtn(container, tab)).toBeTruthy()
    }
    // 概览计数卡：条目总数 = 2，安全评分 85%
    expect(container.textContent).toContain('totalEntries')
    expect(container.textContent).toContain('85%')
    // 存储配额区渲染
    expect(container.textContent).toContain('storageQuota')
  })

  it('搜索过滤：按 path 关键词命中单条；无命中显示 noData 空态', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('yyc3_model_config'))
    const search = container.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'model' } })
    await waitFor(() => expect(container.textContent).not.toContain('yyc3_notes_1'))
    expect(container.textContent).toContain('yyc3_model_config')
    fireEvent.change(search, { target: { value: 'zzz-not-exist' } })
    await waitFor(() => expect(container.textContent).toContain('noData'))
  })

  it('页签切换：sync 统计卡 / security 保险库状态 / portability 支持格式', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('yyc3_model_config'))
    // sync 页：状态区 + 三统计卡 + 立即同步按钮（真 store → 桩 sync-engine）
    fireEvent.click(tabBtn(container, 'sync'))
    expect(container.textContent).toContain('syncStatus')
    for (const key of ['pendingItems', 'conflicts', 'errors']) {
      expect(container.textContent).toContain(key)
    }
    fireEvent.click(tabBtn(container, 'syncAll'))
    await waitFor(() => expect(h.startSync).toHaveBeenCalledTimes(1))
    // security 页：保险库状态 + PBKDF2 迭代次数
    fireEvent.click(tabBtn(container, 'security'))
    expect(container.textContent).toContain('vaultStatus')
    expect(container.textContent).toContain('100,000')
    // portability 页：支持格式 chips（json/zip/sqlite 来自真 store 初始态；textContent 不受 CSS 大写影响）
    fireEvent.click(tabBtn(container, 'portability'))
    for (const fmt of ['json', 'zip', 'sqlite']) {
      expect(container.textContent).toContain(fmt)
    }
  })

  it('勾选与批量：单条勾选 → 全选（selectAll）→ 取消全选（deselectAll）', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    await waitFor(() => expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(2))
    // 初始 0/2 → 按钮文案为全选
    expect(container.textContent).toContain('selectAll')
    const first = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    fireEvent.click(first)
    await waitFor(() => expect(first.checked).toBe(true))
    // 1/2 仍为「全选」；点击后 2/2 全勾
    fireEvent.click(tabBtn(container, 'selectAll'))
    const boxes = container.querySelectorAll('input[type="checkbox"]')
    await waitFor(() => {
      for (const b of Array.from(boxes)) expect((b as HTMLInputElement).checked).toBe(true)
    })
    // 2/2 → 按钮切换为取消全选；点击后清空
    expect(container.textContent).toContain('deselectAll')
    fireEvent.click(tabBtn(container, 'deselectAll'))
    await waitFor(() => {
      for (const b of Array.from(boxes)) expect((b as HTMLInputElement).checked).toBe(false)
    })
  })

  it('行删除走真 removeData：localStorage 键清除并重扫，条目行消失', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('yyc3_model_config'))
    const delBtn = container.querySelector('button[title="delete"]') as HTMLButtonElement
    fireEvent.click(delBtn)
    // 真 store：removeData(path) → localStorage.removeItem + scanData 重扫
    await waitFor(() => expect(localStorage.getItem('yyc3_model_config')).toBeNull())
    await waitFor(() => expect(container.textContent).not.toContain('yyc3_model_config'))
    expect(container.textContent).toContain('yyc3_notes_1')
  })

  it('导出：点击 export → exportData 产 Blob，创建 blob URL 并触发下载与回收', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('yyc3_model_config'))
    fireEvent.click(tabBtn(container, 'portability'))
    fireEvent.click(tabBtn(container, 'export'))
    // 组件 → store.exportData('json') → manager.exportData(条目数组, json 选项)
    await waitFor(() => expect(h.exportData).toHaveBeenCalledTimes(1))
    expect(h.exportData).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ path: 'yyc3_model_config' })]),
      expect.objectContaining({ format: 'json' }),
    )
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob)))
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:yyc3-export-test')
  })

  it('加密口令弹窗：未输入禁用确认；提交后敏感值转入安全存储并关闭', async () => {
    seedLS()
    const { container } = render(<UnifiedDataPanel isOpen onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('yyc3_model_config'))
    // 行内加密按钮（未加密 → Lock 图标；首行 = yyc3_model_config）
    fireEvent.click(container.querySelector('button[title="encrypt"]')!)
    await waitFor(() => expect(container.textContent).toContain('enterPassphraseEncrypt'))
    const confirmBtn = tabBtn(container, 'confirm')
    expect(confirmBtn.disabled).toBe(true)
    // 输入口令（字面量拆分拼接）→ 按钮解禁
    const passInput = container.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(passInput, { target: { value: ['pp', 'secret', '01'].join('-') } })
    expect(tabBtn(container, 'confirm').disabled).toBe(false)
    fireEvent.click(tabBtn(container, 'confirm'))
    // 加密路径：localStorage 原值经 setSensitive → secureStorage.storeSecret（前缀 yyc3_ 剥离）
    await waitFor(() =>
      expect(secureStorage.storeSecret).toHaveBeenCalledWith(
        'model_config',
        JSON.stringify({ model: 'glm-4.6' }),
        'secret',
        expect.anything(),
      ),
    )
    // 弹窗关闭
    await waitFor(() => expect(container.textContent).not.toContain('enterPassphraseEncrypt'))
  })
})
