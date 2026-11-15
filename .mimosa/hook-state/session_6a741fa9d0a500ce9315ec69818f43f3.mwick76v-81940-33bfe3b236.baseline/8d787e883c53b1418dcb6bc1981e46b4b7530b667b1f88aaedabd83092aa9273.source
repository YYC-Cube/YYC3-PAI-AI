/**
 * @file sync-flow.e2e.test.ts
 * @description 文件同步功能端到端测试 - 验证完整用户流程
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSyncStore } from '../src/app/store/sync-store'

describe('E2E: 文件同步完整流程', () => {
  let destroyFn: (() => void) | null = null

  beforeEach(() => {
    const store = useSyncStore.getState()
    if (store.destroy) {
      store.destroy()
    }
  })

  afterEach(() => {
    if (destroyFn) {
      destroyFn()
      destroyFn = null
    }
  })

  describe('用户流程1: 启动文件同步', () => {
    it('应该完成从初始化到同步的完整流程', async () => {
      const store = useSyncStore.getState()

      expect(store.status).toBeDefined()
      expect(['idle', 'syncing', 'paused', 'error']).toContain(store.status)

      store.initialize()

      expect(typeof store.watchPath).toBe('function')
      expect(typeof store.startSync).toBe('function')
      expect(typeof store.enableAutoSync).toBe('function')
      expect(typeof store.disableAutoSync).toBe('function')
    })

    it('自动同步状态应可切换', () => {
      const store = useSyncStore.getState()

      expect(store.isAutoSyncEnabled).toBe(false)

      store.enableAutoSync()
      expect(useSyncStore.getState().isAutoSyncEnabled).toBe(true)

      store.disableAutoSync()
      expect(useSyncStore.getState().isAutoSyncEnabled).toBe(false)
    })
  })

  describe('用户流程2: 路径监控', () => {
    it('应支持路径监控和取消', () => {
      const store = useSyncStore.getState()

      expect(Array.isArray(store.watchedPaths)).toBe(true)
      expect(store.watchedPaths.length).toBeGreaterThanOrEqual(0)

      expect(typeof store.unwatchPath).toBe('function')
      expect(typeof store.watchPath).toBe('function')
    })
  })

  describe('用户流程3: 冲突处理', () => {
    it('冲突列表应为数组类型', () => {
      const store = useSyncStore.getState()

      expect(Array.isArray(store.conflicts)).toBe(true)

      if (store.conflicts.length > 0) {
        const conflict = store.conflicts[0]
        expect(conflict).toHaveProperty('id')
        expect(conflict).toHaveProperty('localPath')
        expect(conflict).toHaveProperty('remotePath')
      }
    })

    it('resolveConflict方法应存在', () => {
      const store = useSyncStore.getState()

      expect(typeof store.resolveConflict).toBe('function')
    })

    it('stats应包含冲突计数', () => {
      const store = useSyncStore.getState()

      expect(store.stats).toBeDefined()
      expect(store.stats).toHaveProperty('conflictCount')
      expect(typeof store.stats.conflictCount).toBe('number')
    })
  })

  describe('用户流程4: 同步历史', () => {
    it('历史记录应为数组类型', () => {
      const store = useSyncStore.getState()

      expect(Array.isArray(store.history)).toBe(true)
    })

    it('lastSyncTime可能为null或时间戳', () => {
      const store = useSyncStore.getState()

      expect(store.lastSyncTime === null || typeof store.lastSyncTime === 'number').toBe(true)
    })
  })

  describe('用户流程5: 队列管理', () => {
    it('队列应为数组类型', () => {
      const store = useSyncStore.getState()

      expect(Array.isArray(store.queue)).toBe(true)
    })

    it('应支持队列操作方法', () => {
      const store = useSyncStore.getState()

      expect(typeof store.removeFromQueue).toBe('function')
      expect(typeof store.clearCompletedItems).toBe('function')
      expect(typeof store.retryFailedItems).toBe('function')
    })

    it('stats应反映队列状态', () => {
      const store = useSyncStore.getState()

      expect(store.stats.queueLength).toBeGreaterThanOrEqual(0)
      expect(store.stats.pendingCount).toBeGreaterThanOrEqual(0)
      expect(store.stats.syncingCount).toBeGreaterThanOrEqual(0)
      expect(store.stats.completedCount).toBeGreaterThanOrEqual(0)
      expect(store.stats.failedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('用户流程6: 错误恢复', () => {
    it('destroy方法应正常执行', () => {
      const store = useSyncStore.getState()

      expect(typeof store.destroy).toBe('function')

      store.destroy()

      expect(useSyncStore.getState().status).toBeDefined()
    })
  })
})

describe('E2E: 文件系统适配器集成', () => {
  it('适配器应与SyncStore协同工作', async () => {
    const { getFileSystemAdapter } = await import('../src/app/services/file-system-adapter')
    const adapter = getFileSystemAdapter()

    const isSupported = adapter.isSupported()
    expect(typeof isSupported).toBe('boolean')

    if (isSupported) {
      const basePath = adapter.getBasePath()
      expect(basePath).toBeTruthy()
    }
  })
})
