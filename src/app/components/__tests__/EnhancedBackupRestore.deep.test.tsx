/**
 * @file EnhancedBackupRestore.deep.test.tsx
 * @description 增强备份恢复面板二轮深化 — mock 备份服务/db-store/toast：备份三态 + 进度条/列表三状态与体积格式化/
 *              预览弹窗（警告/取消）/恢复三态/预览失败/选项面板/英文文案分支
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { BackupRecord } from '../../store/db-store'
import type { RestorePreview } from '../../services/database-backup-service'

const h = vi.hoisted(() => ({
  db: {
    activeConnId: null as string | null,
    backups: [] as unknown[],
    profiles: [] as Array<{ id: string; name: string; color: string }>,
  },
  removeBackup: vi.fn(),
  svc: {
    executeBackup: vi.fn(),
    getRestorePreview: vi.fn(),
    executeRestore: vi.fn(),
  },
  toast: vi.fn(),
}))

vi.mock('../../services/database-backup-service', () => ({
  getDatabaseBackupService: () => h.svc,
}))

vi.mock('../../store/db-store', () => ({
  useDBStore: () => h.db,
  dbStoreActions: { removeBackup: h.removeBackup },
}))

vi.mock('../CyberToast', () => ({
  cyberToast: h.toast,
}))

vi.mock('../CyberTooltip', () => ({
  CyberTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import { EnhancedBackupRestorePanel } from '../EnhancedBackupRestorePanel'
import { themeStore } from '../../store/theme-store'

const tk = themeStore.getTokens()

const MB = 1024 * 1024

const mkBackup = (over: Partial<BackupRecord> = {}): BackupRecord => ({
  id: 'b1',
  connId: 'c1',
  connName: 'prod-pg',
  type: 'postgres',
  filename: 'prod_2026.sql.gz',
  sizeBytes: 1.5 * MB,
  timestamp: Date.UTC(2026, 0, 2),
  status: 'completed',
  ...over,
})

const mkPreview = (over: Partial<RestorePreview> = {}): RestorePreview => ({
  backupId: 'b1',
  fileName: 'prod_2026.sql.gz',
  tableCount: 12,
  estimatedRecords: 34567,
  sizeBytes: 1.5 * MB,
  willDropExisting: true,
  affectedTables: ['users', 'orders'],
  warnings: ['版本差异：源 PG15 → 目标 PG14'],
  ...over,
})

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  h.db.activeConnId = 'c1'
  h.db.backups = []
  h.db.profiles = [{ id: 'c1', name: 'prod-pg', color: '#336791' }]
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const renderZh = () => render(<EnhancedBackupRestorePanel tk={tk} isZh />)

const body = () => document.body.textContent!

const btnIncluding = (text: string) =>
  Array.from(document.querySelectorAll('button')).find(b => b.textContent!.includes(text)) as HTMLButtonElement

const btnsWithIcon = (iconClass: string) =>
  Array.from(document.querySelectorAll('button')).filter(b => b.querySelector(`svg.${iconClass}`)) as HTMLButtonElement[]

const lastToast = () => String(h.toast.mock.calls[h.toast.mock.calls.length - 1]?.[0])

/** 打开预览弹窗（点击列表首个 ChevronRight 按钮并等待弹窗） */
const openPreview = async (preview = mkPreview()) => {
  h.svc.getRestorePreview.mockResolvedValue(preview)
  fireEvent.click(btnsWithIcon('lucide-chevron-right')[0])
  await waitFor(() => expect(body()).toContain('恢复确认'))
}

describe('EnhancedBackupRestorePanel 骨架与门控', () => {
  it('无备份：空态文案；无活跃连接时备份按钮禁用（强制点击也不调服务），有连接启用并显示连接徽章', () => {
    h.db.activeConnId = null
    const { rerender } = renderZh()
    expect(body()).toContain('暂无备份记录')
    expect(body()).toContain('点击"立即备份"创建第一个备份')
    expect(btnIncluding('立即备份').disabled).toBe(true)
    expect(body()).not.toContain('prod-pg')
    // handleBackup 首行门控：无 activeConnId 直接返回
    btnIncluding('立即备份').disabled = false
    fireEvent.click(btnIncluding('立即备份'))
    expect(h.svc.executeBackup).not.toHaveBeenCalled()

    h.db.activeConnId = 'c1'
    rerender(<EnhancedBackupRestorePanel tk={tk} isZh />)
    expect(btnIncluding('立即备份').disabled).toBe(false)
    expect(body()).toContain('prod-pg')
  })

  it('英文文案分支：标题/空态/按钮与预览标签', async () => {
    h.db.backups = [mkBackup()]
    render(<EnhancedBackupRestorePanel tk={tk} isZh={false} />)
    expect(body()).toContain('Backup & Restore')
    expect(btnIncluding('Backup Now')).toBeTruthy()
    h.svc.getRestorePreview.mockResolvedValue(mkPreview())
    fireEvent.click(btnsWithIcon('lucide-chevron-right')[0])
    await waitFor(() => expect(body()).toContain('Restore Confirmation'))
    expect(body()).toContain('This will DROP existing data and replace with backup!')
    expect(btnIncluding('Confirm Restore')).toBeTruthy()
    fireEvent.click(btnIncluding('Cancel'))
    expect(body()).not.toContain('Restore Confirmation')
  })

  it('选项面板：齿轮切换显示（三勾选 + 禁用格式下拉），再点收起', () => {
    renderZh()
    expect(body()).not.toContain('包含Schema')
    fireEvent.click(btnsWithIcon('lucide-settings')[0])
    for (const txt of ['包含Schema', '包含数据', 'Gzip压缩', 'Format:']) expect(body()).toContain(txt)
    const select = document.querySelector('select') as HTMLSelectElement
    expect(select.disabled).toBe(true)
    expect(select.querySelectorAll('option')).toHaveLength(3)
    expect(document.querySelectorAll('input[type="checkbox"]:disabled')).toHaveLength(3)
    fireEvent.click(btnsWithIcon('lucide-settings')[0])
    expect(body()).not.toContain('包含Schema')
  })
})

describe('EnhancedBackupRestorePanel 备份流（handleBackup 三态）', () => {
  it('成功：传递固定选项 + 进度回调驱动进度条 → 完成 toast（文件名 + MB）', async () => {
    h.svc.executeBackup.mockImplementation(async (_id: string, _opts: unknown, onProgress: (p: unknown) => void) => {
      onProgress({ phase: 'dumping-data', currentTable: 'users', percentComplete: 40, message: '导出 users', tablesCompleted: 1, tablesTotal: 3, recordsProcessed: 10, recordsTotal: 30 })
      onProgress({ phase: 'completed', percentComplete: 100, message: '备份完成', tablesCompleted: 3, tablesTotal: 3, recordsProcessed: 30, recordsTotal: 30 })
      return { success: true, backupId: 'nb', fileName: 'prod.sql.gz', sizeBytes: 2 * MB, tableCount: 3, recordCount: 30, durationMs: 5, checksum: 'x', format: 'sql', compressed: true }
    })
    renderZh()
    fireEvent.click(btnIncluding('立即备份'))
    await waitFor(() => expect(h.toast).toHaveBeenCalledTimes(1))
    expect(lastToast()).toBe('✅ 备份完成: prod.sql.gz (2.00MB)')
    expect(h.svc.executeBackup).toHaveBeenCalledWith(
      'c1',
      { includeSchema: true, includeData: true, format: 'sql', compress: true },
      expect.any(Function),
    )
    // 进度条：最后一次回调（completed）落到 UI
    await waitFor(() => expect(body()).toContain('100%'))
    expect(body()).toContain('备份完成')
    expect(document.querySelector('svg[class*="circle-check"]')).toBeTruthy()
    await waitFor(() => expect(btnIncluding('立即备份').disabled).toBe(false))
  })

  it('失败（success=false）：错误 toast 携带 error', async () => {
    h.svc.executeBackup.mockResolvedValue({ success: false, error: 'pg_dump not found' })
    renderZh()
    fireEvent.click(btnIncluding('立即备份'))
    await waitFor(() => expect(h.toast).toHaveBeenCalledTimes(1))
    expect(lastToast()).toBe('❌ 备份失败: pg_dump not found')
  })

  it('异常（reject）：异常 toast，backingUp 复位后按钮可再次点击', async () => {
    h.svc.executeBackup.mockRejectedValue(new Error('socket hang up'))
    renderZh()
    fireEvent.click(btnIncluding('立即备份'))
    await waitFor(() => expect(lastToast()).toBe('❌ 备份异常: socket hang up'))
    await waitFor(() => expect(btnIncluding('立即备份').disabled).toBe(false))
    expect(btnIncluding('立即备份').querySelector('.animate-spin')).toBeNull()
    fireEvent.click(btnIncluding('立即备份'))
    await waitFor(() => expect(h.svc.executeBackup).toHaveBeenCalledTimes(2))
  })
})

describe('EnhancedBackupRestorePanel 备份列表', () => {
  it('三状态渲染 + 类型标签 + 体积格式化（B/KB/MB）+ 错误文本；仅 completed 有恢复按钮', () => {
    h.db.backups = [
      mkBackup(),
      mkBackup({ id: 'b2', type: 'mysql', filename: 'shop.sql', sizeBytes: 2048, status: 'failed', error: 'disk full' }),
      mkBackup({ id: 'b3', type: 'redis', filename: 'cache.rdb', sizeBytes: 512, status: 'in-progress' }),
    ]
    renderZh()
    for (const txt of ['prod_2026.sql.gz', 'PostgreSQL', '1.5MB', 'shop.sql', 'MySQL', '2.0KB', 'disk full', 'cache.rdb', 'Redis', '512B']) {
      expect(body()).toContain(txt)
    }
    expect(btnsWithIcon('lucide-chevron-right')).toHaveLength(1)
    expect(btnsWithIcon('lucide-rotate-ccw')).toHaveLength(1)
    expect(btnsWithIcon('lucide-trash-2')).toHaveLength(3)
    expect(document.querySelectorAll('.animate-spin').length).toBeGreaterThanOrEqual(1)
    expect(body()).not.toContain('暂无备份记录')
  })

  it('删除按钮 → dbStoreActions.removeBackup(id)', () => {
    h.db.backups = [mkBackup(), mkBackup({ id: 'b2', filename: 'second.sql' })]
    renderZh()
    fireEvent.click(btnsWithIcon('lucide-trash-2')[1])
    expect(h.removeBackup).toHaveBeenCalledWith('b2')
    expect(h.removeBackup).toHaveBeenCalledTimes(1)
  })

  it('sizeBytes=0 不渲染体积；无活跃连接时恢复按钮禁用', () => {
    h.db.activeConnId = null
    h.db.backups = [mkBackup({ sizeBytes: 0 })]
    renderZh()
    expect(body()).not.toContain('0B')
    expect(btnsWithIcon('lucide-chevron-right')[0].disabled).toBe(true)
    expect(btnsWithIcon('lucide-rotate-ccw')[0].disabled).toBe(true)
  })
})

describe('EnhancedBackupRestorePanel 预览与恢复流', () => {
  beforeEach(() => {
    h.db.backups = [mkBackup()]
  })

  it('预览：按 (connId, backupId, filename, sizeBytes) 调用 → 弹窗展示字段/删除警告/warnings；取消关闭', async () => {
    renderZh()
    await openPreview()
    expect(h.svc.getRestorePreview).toHaveBeenCalledWith('c1', 'b1', 'prod_2026.sql.gz', 1.5 * MB)
    for (const txt of ['prod_2026.sql.gz', '12', (34567).toLocaleString(), '1.5MB', '此操作将删除现有数据并替换为备份数据！', '版本差异：源 PG15 → 目标 PG14']) {
      expect(body()).toContain(txt)
    }
    fireEvent.click(btnIncluding('取消'))
    expect(body()).not.toContain('恢复确认')
    expect(h.svc.executeRestore).not.toHaveBeenCalled()
  })

  it('willDropExisting=false 且无 warnings：不渲染警告块；45号已修——快速恢复直接执行不再弹预览确认', async () => {
    renderZh()
    h.svc.getRestorePreview.mockResolvedValue(mkPreview({ willDropExisting: false, warnings: [] }))
    h.svc.executeRestore.mockResolvedValue({ success: true, restoredTables: ['users'], restoredRecords: 10, durationMs: 5, warnings: [] })
    fireEvent.click(btnsWithIcon('lucide-rotate-ccw')[0])
    // 45号：Quick Restore 按需构建预览后立即执行（不再弹确认框）
    await waitFor(() => expect(h.svc.executeRestore).toHaveBeenCalledTimes(1))
    expect(body()).not.toContain('恢复确认')
    await waitFor(() => expect(lastToast()).toContain('恢复完成'))
  })

  it('预览失败（reject）→ 失败 toast 且不弹窗', async () => {
    h.svc.getRestorePreview.mockRejectedValue(new Error('偶发网络抖动'))
    renderZh()
    fireEvent.click(btnsWithIcon('lucide-chevron-right')[0])
    await waitFor(() => expect(lastToast()).toBe('❌ 获取恢复预览失败'))
    expect(body()).not.toContain('恢复确认')
  })

  it('确认恢复成功：进度回调入 UI → toast（表数/记录数）→ 弹窗关闭', async () => {
    const preview = mkPreview()
    h.svc.executeRestore.mockImplementation(async (_c: string, _b: string, _p: unknown, onProgress: (p: unknown) => void) => {
      onProgress({ phase: 'importing-data', currentTable: 'orders', percentComplete: 60, message: '导入 orders', tablesCompleted: 1, tablesTotal: 2, recordsProcessed: 20, recordsTotal: 42 })
      return { success: true, restoredTables: ['users', 'orders'], restoredRecords: 42, durationMs: 9, warnings: ['序列未重置'] }
    })
    renderZh()
    await openPreview(preview)
    fireEvent.click(btnIncluding('确认恢复'))
    await waitFor(() => expect(lastToast()).toBe('✅ 恢复完成: 2 个表, 42 条记录'))
    expect(h.svc.executeRestore).toHaveBeenCalledWith('c1', 'b1', preview, expect.any(Function))
    await waitFor(() => expect(body()).not.toContain('恢复确认'))
    await waitFor(() => expect(body()).toContain('60%'))
    expect(body()).toContain('导入 orders')
  })

  it('恢复失败（success=false）与异常（reject）分别产出对应 toast', async () => {
    h.svc.executeRestore.mockResolvedValue({ success: false, restoredTables: [], restoredRecords: 0, durationMs: 1, warnings: [], error: '外键约束冲突' })
    const { unmount } = renderZh()
    await openPreview()
    fireEvent.click(btnIncluding('确认恢复'))
    await waitFor(() => expect(lastToast()).toBe('❌ 恢复失败: 外键约束冲突'))
    unmount()

    h.svc.executeRestore.mockRejectedValue(new Error('timeout'))
    renderZh()
    await openPreview()
    fireEvent.click(btnIncluding('确认恢复'))
    await waitFor(() => expect(lastToast()).toBe('❌ 恢复异常: timeout'))
    await waitFor(() => expect(body()).not.toContain('恢复确认'))
  })
})
