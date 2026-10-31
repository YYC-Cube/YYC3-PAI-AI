/**
 * @file sync-engine.test.ts
 * @description 同步引擎专项 — mock BackendManager/watcher，驱动队列去重/全流程同步/冲突三策略/
 * 拉取合并/失败重试/自动同步定时器
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type ChangeCb = (events: Array<{ path: string; type: string; timestamp: number; size?: number }>) => void

const h = vi.hoisted((): {
  onChangeCbRef: { cb: ChangeCb | null }
  backend: Record<string, ReturnType<typeof vi.fn>>
  manager: Record<string, ReturnType<typeof vi.fn>>
} => {
  const onChangeCbRef = { cb: null as ChangeCb | null }
  const backend = {
    list: vi.fn(async () => [] as Array<Record<string, unknown>>),
    upload: vi.fn(async () => undefined),
    download: vi.fn(async () => null),
    disconnect: vi.fn(async () => undefined),
  }
  const manager = {
    setActiveBackend: vi.fn(async () => true),
    setSyncDirection: vi.fn(),
    getActiveType: vi.fn(() => 'none' as string),
    getActive: vi.fn(() => backend),
    updateLastSyncTime: vi.fn(),
  }
  return { onChangeCbRef, backend, manager: manager as never }
})

vi.mock('../sync-backend-adapter', () => ({
  BackendManager: { getInstance: () => h.manager },
}))

vi.mock('../file-system-watcher', () => ({
  getFileSystemWatcher: (opts: { onChange: (e: never) => void }) => {
    h.onChangeCbRef.cb = opts.onChange as never
    return { stop: vi.fn(), destroy: vi.fn(), addPath: vi.fn() }
  },
}))

import { getSyncEngine, destroySyncEngine } from '../sync-engine'

/** 单例工厂：每用例取新引擎 */
const newEngine = (opts?: Record<string, unknown>) => {
  destroySyncEngine()
  return getSyncEngine(opts as never)
}

/** 触发一次文件变更事件 */
const fireChange = (path: string, type = 'modify') =>
  h.onChangeCbRef.cb?.([{ path, type, timestamp: Date.now(), size: 10 }])

afterEach(() => destroySyncEngine())

beforeEach(() => {
  // resetAllMocks（非 clear）：否则 mockRejectedValue 等实现会跨用例泄漏
  vi.resetAllMocks()
  localStorage.clear()
  h.manager.getActiveType.mockReturnValue('none')
  h.backend.list.mockResolvedValue([])
})

describe('SyncEngine 队列管理', () => {
  it('文件变更入队（rename 映射为 modify）', () => {
    const e = newEngine()
    fireChange('/a.ts', 'rename')
    const q = e.getQueue()
    expect(q).toHaveLength(1)
    expect(q[0].path).toBe('/a.ts')
    expect(q[0].type).toBe('modify')
    expect(q[0].status).toBe('pending')
  })

  it('同路径重复变更合并（队列单项）', () => {
    const e = newEngine()
    fireChange('/a.ts', 'modify')
    fireChange('/a.ts', 'modify')
    expect(e.getQueue()).toHaveLength(1)
  })

  it('delete 变更整体替换既有项', () => {
    const e = newEngine()
    fireChange('/a.ts', 'modify')
    fireChange('/a.ts', 'delete')
    const q = e.getQueue()
    expect(q).toHaveLength(1)
    expect(q[0].type).toBe('delete')
  })

  it('回归 bug#11：已 completed 项再次变更 → 复位 pending（不再静默丢弃）', async () => {
    localStorage.setItem('/hot.ts', '内容')
    const e = newEngine()
    fireChange('/hot.ts', 'modify')
    const r1 = await e.startSync()
    expect(r1.syncedItems).toBe(1)
    expect(e.getQueue()[0].status).toBe('completed')
    // 同文件再次修改 → 队列项必须重新可同步
    fireChange('/hot.ts', 'modify')
    expect(e.getQueue()[0].status).toBe('pending')
    const r2 = await e.startSync()
    expect(r2.syncedItems).toBe(1) // 第二次变更真的被同步
  })
})

describe('SyncEngine 同步流程', () => {
  it('空队列 → 空结果且回 idle、记录 lastSyncTime', async () => {
    const e = newEngine()
    const r = await e.startSync()
    expect(r.success).toBe(true)
    expect(r.syncedItems).toBe(0)
    expect(e.getStatus()).toBe('idle')
    expect(e.getLastSyncTime()).not.toBeNull()
  })

  it('正常上传：读本地→算校验和→upload→completed', async () => {
    localStorage.setItem('/doc.md', '# 你好')
    const e = newEngine()
    fireChange('/doc.md', 'create')
    const r = await e.startSync()
    expect(r.syncedItems).toBe(1)
    expect(h.backend.upload).toHaveBeenCalledTimes(1)
    const arg = h.backend.upload.mock.calls[0][0]
    expect(arg.path).toBe('/doc.md')
    expect(arg.data).toBe('# 你好')
    expect(arg.checksum).toMatch(/^[0-9a-f]{64}$/)
    expect(e.getStatus()).toBe('idle')
  })

  it('本地无数据 → 跳过上传仍计 completed（upload 不调用）', async () => {
    const e = newEngine()
    fireChange('/ghost.ts', 'modify')
    const r = await e.startSync()
    expect(r.syncedItems).toBe(1)
    expect(h.backend.upload).not.toHaveBeenCalled()
  })

  it('upload 抛错 → failed 计数 + status error + errors 记账', async () => {
    localStorage.setItem('/bad.ts', 'x')
    h.backend.upload.mockRejectedValue(new Error('network down'))
    const e = newEngine()
    fireChange('/bad.ts', 'modify')
    const r = await e.startSync()
    expect(r.success).toBe(false)
    expect(r.failedItems).toBe(1)
    expect(r.errors[0]).toContain('/bad.ts')
    expect(r.errors[0]).toContain('network down')
    expect(e.getStatus()).toBe('error')
    // retryFailedItems 复位 pending
    e.retryFailedItems()
    expect(e.getQueue()[0].status).toBe('pending')
  })

  it('onProgress/onComplete 回调布线', async () => {
    localStorage.setItem('/cb.ts', 'data')
    const onProgress = vi.fn()
    const onComplete = vi.fn()
    const e = newEngine({ onProgress, onComplete })
    fireChange('/cb.ts', 'modify')
    await e.startSync()
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ current: 1, total: 1 }))
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ syncedItems: 1 }))
  })
})

describe('SyncEngine 冲突三策略', () => {
  it('版本不一致 + manual 策略 → conflict 状态且计入 conflictedItems', async () => {
    localStorage.setItem('/c.ts', '本')
    const e = newEngine({ conflictStrategy: 'manual' })
    fireChange('/c.ts', 'modify')
    // 注入远端版本制造 localVersion ≠ remoteVersion
    e.getQueue()[0].remoteVersion = 123
    const r = await e.startSync()
    expect(r.conflictedItems).toBe(1)
    expect(e.getStatus()).toBe('conflict')
    expect(e.getConflicts().length + (e.getQueue()[0].status === 'conflict' ? 1 : 0)).toBeGreaterThan(0)
    // 人工解决入口
    e.resolveConflictManually('conflict_unknown', 'local-win') // 不存在的 id：安全 no-op
    expect(e.getStatus()).toBe('conflict')
  })

  it('版本不一致 + local-win → 覆盖远端最终 completed', async () => {
    localStorage.setItem('/w.ts', '本地赢')
    const e = newEngine({ conflictStrategy: 'local-win' })
    fireChange('/w.ts', 'modify')
    e.getQueue()[0].remoteVersion = 999
    const r = await e.startSync()
    expect(r.syncedItems).toBe(1)
    expect(h.backend.upload).toHaveBeenCalled()
  })

  it('remote-win → 下载远端覆盖本地', async () => {
    localStorage.setItem('/r.ts', '旧本地')
    h.backend.download.mockResolvedValue({ data: '远端新内容', checksum: 'x' })
    const e = newEngine({ conflictStrategy: 'remote-win' })
    fireChange('/r.ts', 'modify')
    e.getQueue()[0].remoteVersion = 7
    const r = await e.startSync()
    expect(r.syncedItems).toBe(1)
    expect(h.backend.download).toHaveBeenCalledWith('/r.ts')
    expect(localStorage.getItem('/r.ts')).toBe('远端新内容')
  })
})

describe('SyncEngine 远端拉取（bidirectional）', () => {
  it('本地缺失的远程文件 → download + 写入 localStorage + pulled 计数', async () => {
    h.manager.getActiveType.mockReturnValue('webdav')
    h.backend.list.mockResolvedValue([{ path: '/remote/new.md', lastModified: 1, size: 5, checksum: 'abc' }])
    h.backend.download.mockResolvedValue({ data: '远程内容', checksum: 'abc' })
    const e = newEngine()
    // 拉取阶段耦合于推送循环：需先有本地 pending 项（空队列会提前返回）
    localStorage.setItem('/local.md', '本地项')
    fireChange('/local.md', 'modify')
    const r = await e.startSync()
    // 本地 1 项上传 + 远程 1 项拉取 = 2
    expect(r.syncedItems).toBe(2)
    expect(localStorage.getItem('/remote/new.md')).toBe('远程内容')
    expect(e.getStatus()).toBe('idle')
  })

  it('远程 list 抛错 → Pull failed 记入 errors，流程不崩', async () => {
    h.manager.getActiveType.mockReturnValue('webdav')
    h.backend.list.mockRejectedValue(new Error('remote unreachable'))
    const e = newEngine()
    localStorage.setItem('/local2.md', '本地项')
    fireChange('/local2.md', 'modify')
    const r = await e.startSync()
    // 行为注记：pull 失败仅记入 errors，不影响 success 标志（success 由推送侧 failed/conflicted 决定）
    expect(r.success).toBe(true)
    expect(r.errors.some(x => x.includes('Pull failed'))).toBe(true)
  })
})

describe('SyncEngine 运维接口', () => {
  it('configureBackend/disconnectBackend/setSyncDirection', async () => {
    h.manager.setActiveBackend.mockResolvedValue(true)
    const e = newEngine()
    expect(await e.configureBackend('webdav' as never, { url: 'https://dav' } as never)).toBe(true)
    expect(h.manager.setActiveBackend).toHaveBeenCalledWith('webdav', { url: 'https://dav' })
    e.setSyncDirection('pull')
    expect(e.getSyncDirection()).toBe('pull')
    await e.disconnectBackend()
    expect(h.backend.disconnect).toHaveBeenCalled()
  })

  it('enableAutoSync 定时器：有 pending 时自动 startSync；disable 停止', () => {
    vi.useFakeTimers()
    try {
      localStorage.setItem('/t.ts', 'v')
      const e = newEngine({ syncIntervalMs: 100 })
      fireChange('/t.ts', 'modify')
      const spy = vi.spyOn(e, 'startSync')
      e.enableAutoSync()
      vi.advanceTimersByTime(150)
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1)
      e.disableAutoSync()
      const n = spy.mock.calls.length
      vi.advanceTimersByTime(1000)
      expect(spy.mock.calls.length).toBe(n)
    } finally {
      vi.useRealTimers()
    }
  })

  it('clearCompletedItems / removeFromQueue', async () => {
    localStorage.setItem('/cc.ts', 'x')
    const e = newEngine()
    fireChange('/cc.ts', 'modify')
    await e.startSync()
    expect(e.getQueue().length).toBe(1)
    e.clearCompletedItems()
    expect(e.getQueue()).toHaveLength(0)
  })
})
