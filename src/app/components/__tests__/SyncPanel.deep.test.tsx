/**
 * @file SyncPanel.deep.test.tsx
 * @description 同步面板专项 — 状态徽标/统计栏/四页签（队列·冲突·历史·设置）/同步与取消/自动同步开关/队列项操作
 * 策略：真 sync-store + 真 theme-store（i18n 走无 Provider 中文兜底）；sync-engine 与 cyberToast 用 vi.mock 桩
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import type { SyncItem, SyncConflict } from '../../services/sync-engine'

const h = vi.hoisted(() => {
  /** 引擎快照：getters 读取、动作修改，模拟真实 SyncEngine 行为（类型经顶部 import type 注入，擦除后不影响提升） */
  const snap = {
    status: 'idle' as string,
    queue: [] as SyncItem[],
    conflicts: [] as SyncConflict[],
    lastSyncTime: null as number | null,
    stats: {
      queueLength: 0, pendingCount: 0, syncingCount: 0,
      completedCount: 0, failedCount: 0, conflictCount: 0, lastSyncAgo: null,
    },
  }
  const startSync = vi.fn()
  const abortSync = vi.fn()
  const enableAutoSync = vi.fn()
  const disableAutoSync = vi.fn()
  const resolveConflictManually = vi.fn()
  const retryFailedItems = vi.fn()
  const clearCompletedItems = vi.fn()
  const removeFromQueue = vi.fn()
  const destroySyncEngine = vi.fn()
  const engine = {
    getStatus: () => snap.status,
    getQueue: () => snap.queue,
    getConflicts: () => snap.conflicts,
    getLastSyncTime: () => snap.lastSyncTime,
    getStats: () => snap.stats,
    startSync, abortSync, enableAutoSync, disableAutoSync,
    resolveConflictManually, retryFailedItems, clearCompletedItems, removeFromQueue,
  }
  return {
    snap, startSync, abortSync, enableAutoSync, disableAutoSync,
    resolveConflictManually, retryFailedItems, clearCompletedItems, removeFromQueue,
    destroySyncEngine, engine,
  }
})

vi.mock('../../services/sync-engine', () => ({
  getSyncEngine: () => h.engine,
  destroySyncEngine: h.destroySyncEngine,
}))

vi.mock('../CyberToast', () => ({
  cyberToast: vi.fn(),
}))

import { SyncPanel } from '../SyncPanel'
import { cyberToast } from '../CyberToast'
import { useSyncStore } from '../../store/sync-store'

// ── Fixtures / Helpers ──

const item = (over: Partial<SyncItem> = {}): SyncItem => ({
  id: 'si_' + Math.random().toString(36).slice(2, 8),
  path: '/project/src/app.ts',
  type: 'modify',
  status: 'pending',
  localVersion: 1,
  remoteVersion: 1,
  timestamp: Date.now() - 1000,
  ...over,
} as SyncItem)

const conflict = (over: Partial<SyncConflict> = {}): SyncConflict => ({
  id: 'cf_' + Math.random().toString(36).slice(2, 8),
  path: '/project/README.md',
  localModified: Date.now() - 60_000,
  remoteModified: Date.now() - 30_000,
  ...over,
} as SyncConflict)

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const tabBtn = (root: HTMLElement, name: string) =>
  Array.from(root.querySelectorAll('button')).find(b =>
    (b.textContent || '').startsWith(name),
  ) as HTMLButtonElement

const resetStore = () =>
  act(() => {
    useSyncStore.setState({
      status: 'idle',
      queue: [],
      conflicts: [],
      history: [],
      lastSyncTime: null,
      isAutoSyncEnabled: false,
      watchedPaths: [],
      stats: {
        queueLength: 0, pendingCount: 0, syncingCount: 0,
        completedCount: 0, failedCount: 0, conflictCount: 0, lastSyncAgo: null,
      },
    })
  })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  // 快照复位
  h.snap.status = 'idle'
  h.snap.queue = []
  h.snap.conflicts = []
  h.snap.lastSyncTime = null
  h.snap.stats = {
    queueLength: 0, pendingCount: 0, syncingCount: 0,
    completedCount: 0, failedCount: 0, conflictCount: 0, lastSyncAgo: null,
  }
  // 引擎动作默认实现（resetAllMocks 后重挂）
  h.startSync.mockImplementation(async () => {
    h.snap.lastSyncTime = Date.now()
    return { success: true, syncedItems: 2, conflictedItems: 0, failedItems: 0, durationMs: 88, errors: [] }
  })
  h.abortSync.mockImplementation(() => { h.snap.status = 'idle' })
  h.removeFromQueue.mockImplementation((id: string) => {
    h.snap.queue = h.snap.queue.filter(i => i.id !== id)
  })
  h.resolveConflictManually.mockImplementation((id: string, res: 'local-win' | 'remote-win') => {
    h.snap.conflicts = h.snap.conflicts.map(c => (c.id === id ? { ...c, resolution: res } : c))
  })
  resetStore()
})

describe('SyncPanel（同步面板）', () => {
  it('isOpen=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<SyncPanel isOpen={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('isOpen 渲染骨架：标题/空闲徽标/统计栏/四页签/自动关与立即同步按钮', () => {
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    expect(container.querySelector('[role="dialog"]')!.getAttribute('aria-label')).toBe('文件同步面板')
    expect(container.textContent).toContain('文件同步')
    expect(container.textContent).toContain('空闲')
    for (const label of ['队列:', '冲突:', '已完成:', '失败:']) {
      expect(container.textContent).toContain(label)
    }
    for (const tab of ['同步队列', '冲突解决', '历史记录', '设置']) {
      expect(tabBtn(container, tab)).toBeTruthy()
    }
    expect(btnByText(container, '自动关')).toBeTruthy()
    expect(btnByText(container, '立即同步')).toBeTruthy()
  })

  it('refreshStats 布线：引擎队列透出到 UI（路径/错误/计数/重试与清除按钮）', () => {
    h.snap.queue = [
      item({ id: 'si_a', path: '/project/src/a.ts', status: 'pending' }),
      item({ id: 'si_b', path: '/project/src/b.ts', status: 'failed', error: 'ETIMEDOUT 连接超时' }),
    ]
    h.snap.stats = {
      queueLength: 2, pendingCount: 1, syncingCount: 0,
      completedCount: 0, failedCount: 1, conflictCount: 0, lastSyncAgo: null,
    }
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    expect(container.textContent).toContain('/project/src/a.ts')
    expect(container.textContent).toContain('/project/src/b.ts')
    expect(container.textContent).toContain('ETIMEDOUT 连接超时')
    expect(container.textContent).toContain('2 个待处理项')
    expect(container.textContent).toContain('失败:')
    expect(btnByText(container, '重试失败项')).toBeTruthy()
    // 队列页签计数徽标 = pending + syncing = 1
    expect(tabBtn(container, '同步队列').textContent).toContain('1')
  })

  it('立即同步：成功 toast；startSync 抛错时失败 toast', async () => {
    h.startSync.mockRejectedValueOnce(new Error('network down'))
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    // 第一次：失败
    fireEvent.click(btnByText(container, '立即同步'))
    await waitFor(() => expect(cyberToast).toHaveBeenCalledWith('❌ 同步失败'))
    // 第二次：成功（默认实现）
    fireEvent.click(btnByText(container, '立即同步'))
    await waitFor(() => expect(cyberToast).toHaveBeenCalledWith('✅ 同步完成'))
    expect(h.startSync).toHaveBeenCalledTimes(2)
  })

  it('syncing 状态：徽标同步中... + 取消按钮；取消后引擎 abortSync 被调并回到立即同步', () => {
    h.snap.status = 'syncing'
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    expect(container.textContent).toContain('同步中...')
    expect(btnByText(container, '立即同步')).toBeUndefined()
    fireEvent.click(btnByText(container, '取消'))
    expect(h.abortSync).toHaveBeenCalledTimes(1)
    expect(cyberToast).toHaveBeenCalledWith('ℹ️ 已取消同步')
    // abortSync 桩置 status=idle → 面板回到立即同步
    expect(btnByText(container, '立即同步')).toBeTruthy()
  })

  it('队列操作：移除 pending 项（引擎 removeFromQueue + UI 消失）；重试失败/清除已完成布线', () => {
    h.snap.queue = [
      item({ id: 'si_a', path: '/project/src/a.ts', status: 'pending' }),
      item({ id: 'si_b', path: '/project/src/b.ts', status: 'failed' }),
      item({ id: 'si_c', path: '/project/src/c.ts', status: 'completed' }),
    ]
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    expect(container.textContent).toContain('3 个待处理项')
    fireEvent.click(btnByText(container, '重试失败项'))
    expect(h.retryFailedItems).toHaveBeenCalledTimes(1)
    fireEvent.click(btnByText(container, '清除已完成'))
    expect(h.clearCompletedItems).toHaveBeenCalledTimes(1)
    // 移除 pending 项 si_a
    fireEvent.click(container.querySelector('button[aria-label="移除"]')!)
    expect(h.removeFromQueue).toHaveBeenCalledWith('si_a')
    expect(container.textContent).not.toContain('/project/src/a.ts')
  })

  it('冲突页签：空态无冲突；选中后双版本按钮 → 本地/远程解决并标记已解决', () => {
    // 先看空态
    {
      const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
      fireEvent.click(tabBtn(container, '冲突解决'))
      expect(container.textContent).toContain('无冲突')
    }
    h.snap.conflicts = [
      conflict({ id: 'cf_1', path: '/project/README.md' }),
      conflict({ id: 'cf_2', path: '/project/pkg.json' }),
    ]
    h.snap.stats = { ...h.snap.stats, conflictCount: 2 }
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    expect(tabBtn(container, '冲突解决').textContent).toContain('2')
    fireEvent.click(tabBtn(container, '冲突解决'))
    expect(container.textContent).toContain('/project/README.md')
    // 点击冲突卡片展开版本选择
    fireEvent.click(Array.from(container.querySelectorAll('span')).find(s => s.textContent === '/project/README.md')!)
    expect(container.textContent).toContain('选择要保留的版本：')
    fireEvent.click(btnByText(container, '使用本地版本'))
    expect(h.resolveConflictManually).toHaveBeenCalledWith('cf_1', 'local-win', 'user')
    expect(cyberToast).toHaveBeenCalledWith('✅ 冲突已解决')
    expect(container.textContent).toContain('已解决')
    expect(container.textContent).toContain('local-win')
    // 第二条冲突走远程版本
    fireEvent.click(Array.from(container.querySelectorAll('span')).find(s => s.textContent === '/project/pkg.json')!)
    fireEvent.click(btnByText(container, '使用远程版本'))
    expect(h.resolveConflictManually).toHaveBeenCalledWith('cf_2', 'remote-win', 'user')
  })

  it('历史页签：空态暂无历史记录；种子记录渲染同步/冲突计数与耗时', () => {
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    fireEvent.click(tabBtn(container, '历史记录'))
    expect(container.textContent).toContain('暂无历史记录')
    // 注入历史（store 直写，模拟 onComplete 累积）
    act(() => {
      useSyncStore.setState({
        history: [{
          success: true, syncedItems: 3, conflictedItems: 1,
          failedItems: 0, durationMs: 120, errors: [],
        }],
      })
    })
    expect(container.textContent).toContain('3 已同步')
    expect(container.textContent).toContain('1 冲突')
    expect(container.textContent).toContain('耗时: 120ms')
    // 页签徽标随历史条数
    expect(tabBtn(container, '历史记录').textContent).toContain('1')
  })

  it('设置页签：自动同步开关（真 store 状态翻转 + 引擎调用）与监听路径列表', () => {
    act(() => {
      useSyncStore.setState({ watchedPaths: ['/Users/yyc/project'] })
    })
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    fireEvent.click(tabBtn(container, '设置'))
    expect(container.textContent).toContain('自动同步')
    expect(container.textContent).toContain('检测到文件变更时自动同步')
    expect(container.textContent).toContain('监听路径')
    expect(container.textContent).toContain('/Users/yyc/project')
    // 开关关闭 → 开启
    const sw = container.querySelector('[role="switch"]') as HTMLElement
    expect(sw.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(sw)
    expect(h.enableAutoSync).toHaveBeenCalledTimes(1)
    expect(cyberToast).toHaveBeenCalledWith('✅ 已开启自动同步')
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(btnByText(container, '自动开')).toBeTruthy()
    // 再关
    fireEvent.click(sw)
    expect(h.disableAutoSync).toHaveBeenCalledTimes(1)
    expect(cyberToast).toHaveBeenCalledWith('ℹ️ 已关闭自动同步')
  })

  it('设置页签：无监听路径时显示空态', () => {
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    fireEvent.click(tabBtn(container, '设置'))
    expect(container.textContent).toContain('尚未添加监听路径')
  })

  it('lastSyncTime 展示：引擎回传后显示「上次同步: N秒前」', () => {
    h.snap.lastSyncTime = Date.now() - 5000
    const { container } = render(<SyncPanel isOpen onClose={() => {}} />)
    expect(container.textContent).toContain('上次同步')
    expect(container.textContent).toMatch(/\d+秒前/)
  })

  it('关闭布线：遮罩点击与关闭按钮触发 onClose，面板内部点击不冒泡关闭', () => {
    const onClose = vi.fn()
    const { container } = render(<SyncPanel isOpen onClose={onClose} />)
    // 面板内部（dialog）点击不关闭
    fireEvent.click(container.querySelector('[role="dialog"]')!)
    expect(onClose).not.toHaveBeenCalled()
    // 遮罩（外层 fixed 容器）点击关闭
    fireEvent.click(container.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
    // 头部关闭按钮
    fireEvent.click(container.querySelector('button[aria-label="关闭"]')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
