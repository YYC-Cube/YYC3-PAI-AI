/**
 * @file StorageManager.deep.test.tsx
 * @description 存储管理面板专项深化 — 真 storage-monitor（localStorage 用量 + 阈值告警）+ 真 backup-manager
 *              （创建/导出下载/恢复/删除/导入，crypto.subtle 校验和）；storage-cleaner 与 indexeddb-service 受控桩：
 *              三类清理成功/带错误/异常文案、自动备份与自动清理启用、刷新重拉、监控启停随挂载
 * @note i18n 无 Provider → t() 返回 key，按 key 断言；导出走 URL.createObjectURL + <a>.click 桩；
 *       fetch 不涉及；vi.mock 工厂引用外部值经 vi.hoisted；afterEach unstubAllGlobals
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  getStoreNames: vi.fn(),
  getAll: vi.fn(),
  getPolicies: vi.fn(),
  runPolicy: vi.fn(),
  startAutoClean: vi.fn(),
}))

vi.mock('../../services/indexeddb-service', () => ({
  indexedDBService: { getStoreNames: h.getStoreNames, getAll: h.getAll },
}))

vi.mock('../../utils/storage-cleaner', () => ({
  storageCleaner: { getPolicies: h.getPolicies, runPolicy: h.runPolicy, startAutoClean: h.startAutoClean },
}))

import { StorageManager } from '../StorageManager'
import { storageMonitor } from '../../utils/storage-monitor'
import { backupManager } from '../../utils/storage-backup'

// ── Helpers ──

const POLICIES = [
  { id: 'cache-expiry', type: 'age', enabled: true },
  { id: 'old-sync-records', type: 'age', enabled: true },
  { id: 'low-priority-clean', type: 'priority', enabled: true },
]
const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.textContent?.trim() === text) as HTMLButtonElement
const btnByTitle = (c: HTMLElement, title: string) => c.querySelector(`button[title="${title}"]`) as HTMLButtonElement
/** 清理按钮：文本含 key（label + 描述 key） */
const cleanBtn = (c: HTMLElement, key: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.textContent?.includes(key)) as HTMLButtonElement
/** 创建备份按钮（Download 图标；在 backupRestore 区头部） */
const createBackupBtn = (c: HTMLElement) => c.querySelector('.lucide-download')!.closest('button') as HTMLButtonElement
const seed = () => {
  localStorage.setItem('yyc3_a', 'alpha')
  localStorage.setItem('yyc3_b', 'beta')
}
const mount = async () => {
  const utils = render(<StorageManager />)
  await waitFor(() => expect(utils.container.textContent).toContain('storageUsage'))
  return utils
}

let clickSpy: ReturnType<typeof vi.spyOn>
let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>
const downloads: string[] = []

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  downloads.length = 0
  h.getStoreNames.mockReturnValue([])
  h.getAll.mockResolvedValue([])
  h.getPolicies.mockReturnValue(POLICIES)
  h.runPolicy.mockResolvedValue({ cleaned: 3, freedBytes: 2048, errors: [], details: [] })
  storageMonitor.updateMemoryCacheStats(0, 0)
  vi.spyOn(backupManager, 'scheduleAutoBackup').mockImplementation(() => {})
  // 导出下载链路三件套：blob URL + <a>.click + revoke（按范本桩）
  createObjectURL = vi.fn(() => 'blob:yyc3-backup-test')
  revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true, configurable: true })
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download)
  })
})

afterEach(() => {
  storageMonitor.stopMonitoring()
  storageMonitor.updateMemoryCacheStats(0, 0)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('StorageManager 加载与监控', () => {
  it('挂载即拉取真 stats：三条用量条（localStorage 计数种子键）+ Total Used + 空备份态；监控随挂载启停', async () => {
    seed()
    const startSpy = vi.spyOn(storageMonitor, 'startMonitoring')
    const stopSpy = vi.spyOn(storageMonitor, 'stopMonitoring')
    const { container, unmount } = await mount()
    expect(container.textContent).toContain('storageManagement')
    for (const label of ['localStorage', 'IndexedDB', 'Memory Cache']) expect(container.textContent).toContain(label)
    expect(container.textContent).toContain('2 items')
    expect(container.textContent).toContain('0 items')
    expect(container.textContent).toContain('Total Used')
    expect(container.textContent).toContain('noBackups')
    for (const key of ['cleanExpired', 'cleanOld', 'cleanLowPriority', 'autoBackup', 'autoClean']) {
      expect(container.textContent).toContain(key)
    }
    expect(startSpy).toHaveBeenCalledWith(60000)
    expect(stopSpy).not.toHaveBeenCalled()
    unmount()
    expect(stopSpy).toHaveBeenCalled()
  })

  it('内存缓存越过 90% 阈值 → 监控首检推送 critical 告警条；用量条显示 96.0%', async () => {
    storageMonitor.updateMemoryCacheStats(96 * 1024 * 1024, 12)
    const { container } = await mount()
    await waitFor(() => expect(container.textContent).toContain('Memory cache usage is 96.0%'))
    expect(container.textContent).toContain('96.0%')
    expect(container.textContent).toContain('12 items')
  })

  it('刷新按钮重拉 stats（getStats 再次调用）', async () => {
    const { container } = await mount()
    const getStatsSpy = vi.spyOn(storageMonitor, 'getStats')
    fireEvent.click(container.querySelector('.lucide-refresh-cw')!.closest('button')!)
    await waitFor(() => expect(getStatsSpy).toHaveBeenCalledTimes(1))
  })
})

describe('清理策略（storage-cleaner 桩）', () => {
  it('三按钮分别以对应策略 id 调用 runPolicy，并回显各自成功文案；X 关闭消息', async () => {
    const { container } = await mount()
    fireEvent.click(cleanBtn(container, 'cleanExpired'))
    await waitFor(() => expect(container.textContent).toContain('Cleaned 3 items, freed 2.00 KB'))
    expect(h.runPolicy).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'cache-expiry' }))

    fireEvent.click(cleanBtn(container, 'cleanOld'))
    await waitFor(() => expect(container.textContent).toContain('Cleaned 3 items older than 30 days, freed 2.00 KB'))
    expect(h.runPolicy).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'old-sync-records' }))

    fireEvent.click(cleanBtn(container, 'cleanLowPriority'))
    await waitFor(() => expect(container.textContent).toContain('Cleaned 3 low priority items, freed 2.00 KB'))
    expect(h.runPolicy).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'low-priority-clean' }))

    const msgSpan = Array.from(container.querySelectorAll('span')).find(s => s.textContent?.startsWith('Cleaned 3 low'))!
    fireEvent.click(msgSpan.parentElement!.querySelector('button')!)
    expect(container.textContent).not.toContain('Cleaned 3 low priority')
  })

  it('带错误结果 → 错误文案；runPolicy 抛异常 → Failed to clean', async () => {
    const { container } = await mount()
    h.runPolicy.mockResolvedValueOnce({ cleaned: 1, freedBytes: 0, errors: ['x', 'y'], details: [] })
    fireEvent.click(cleanBtn(container, 'cleanExpired'))
    await waitFor(() => expect(container.textContent).toContain('Cleaned 1 items, but 2 errors occurred'))

    h.runPolicy.mockRejectedValueOnce(new Error('boom'))
    fireEvent.click(cleanBtn(container, 'cleanOld'))
    await waitFor(() => expect(container.textContent).toContain('Failed to clean: Error: boom'))
  })
})

describe('备份与恢复（真 backup-manager）', () => {
  it('创建备份 → 成功文案 + 列表行（v1.0.0 / KB）+ localStorage 落 yyc3_backup_ 键 → 导出下载三件套 → 删除回空态', async () => {
    seed()
    const { container } = await mount()
    fireEvent.click(createBackupBtn(container))
    await waitFor(() => expect(container.textContent).toContain('Backup created successfully'))
    expect(container.textContent).toContain('v1.0.0')
    expect(container.textContent).toContain('KB')
    const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('yyc3_backup_'))
    expect(backupKeys).toHaveLength(1)
    const id = backupKeys[0].replace('yyc3_backup_', '')

    fireEvent.click(btnByTitle(container, 'exportBackup'))
    await waitFor(() => expect(container.textContent).toContain('Backup exported successfully'))
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(downloads[0]).toBe(`yyc3-backup-${id}.json`)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:yyc3-backup-test')

    fireEvent.click(btnByTitle(container, 'deleteBackup'))
    await waitFor(() => expect(container.textContent).toContain('Backup deleted successfully'))
    expect(container.textContent).toContain('noBackups')
    expect(localStorage.getItem(backupKeys[0])).toBeNull()
  })

  it('恢复备份：篡改键值后 restore → 原值回写 + Restored 2 items', async () => {
    seed()
    const { container } = await mount()
    fireEvent.click(createBackupBtn(container))
    await waitFor(() => expect(btnByTitle(container, 'restoreBackup')).toBeTruthy())
    localStorage.setItem('yyc3_a', 'tampered')
    fireEvent.click(btnByTitle(container, 'restoreBackup'))
    await waitFor(() => expect(container.textContent).toContain('Restored 2 items successfully'))
    expect(localStorage.getItem('yyc3_a')).toBe('alpha')
  })

  it('导入：合法备份 JSON → 成功并入列表；缺字段 → Import failed: Invalid backup format', async () => {
    const { container } = await mount()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const good = JSON.stringify({ version: '1.0.0', timestamp: 1700000000000, data: { localStorage: { yyc3_k: 'v' }, indexedDB: {} }, checksum: 'abc' })
    fireEvent.change(input, { target: { files: [new File([good], 'good.json', { type: 'application/json' })] } })
    await waitFor(() => expect(container.textContent).toContain('Backup imported successfully'))
    expect(container.textContent).not.toContain('noBackups')
    expect(localStorage.getItem('yyc3_backup_1700000000000')).toContain('"checksum":"abc"')

    const bad = JSON.stringify({ version: '1.0.0' })
    fireEvent.change(input, { target: { files: [new File([bad], 'bad.json', { type: 'application/json' })] } })
    await waitFor(() => expect(container.textContent).toContain('Import failed: Invalid backup format'))
  })

  it('设置区：启用自动备份 → scheduleAutoBackup(24h)；启用自动清理 → startAutoClean(24h)', async () => {
    const { container } = await mount()
    const enableBtns = Array.from(container.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'enable')
    expect(enableBtns).toHaveLength(2)
    fireEvent.click(enableBtns[0])
    expect(backupManager.scheduleAutoBackup).toHaveBeenCalledWith(24 * 60 * 60 * 1000)
    fireEvent.click(enableBtns[1])
    expect(h.startAutoClean).toHaveBeenCalledWith(24 * 60 * 60 * 1000)
    expect(btnByText(container, 'enable')).toBeTruthy()
  })
})
