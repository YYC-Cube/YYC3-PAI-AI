/**
 * @file sync-store.test.ts
 * @description 同步状态管理Store测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSyncStore } from '../sync-store'
import { act } from '@testing-library/react'

vi.mock('../../services/sync-engine', () => {
  const mockEngine = {
    getStatus: vi.fn().mockReturnValue('idle'),
    getQueue: vi.fn().mockReturnValue([]),
    getConflicts: vi.fn().mockReturnValue([]),
    getLastSyncTime: vi.fn().mockReturnValue(null),
    getStats: vi.fn().mockReturnValue({
      queueLength: 0,
      pendingCount: 0,
      syncingCount: 0,
      completedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      lastSyncAgo: null,
    }),
    startSync: vi.fn().mockResolvedValue({
      synced: 0,
      failed: 0,
      conflicts: 0,
      duration: 0,
    }),
    abortSync: vi.fn(),
    enableAutoSync: vi.fn(),
    disableAutoSync: vi.fn(),
    watchPath: vi.fn().mockResolvedValue(undefined),
    unwatchPath: vi.fn(),
    resolveConflictManually: vi.fn(),
    retryFailedItems: vi.fn(),
    clearCompletedItems: vi.fn(),
    removeFromQueue: vi.fn(),
  }

  return {
    getSyncEngine: vi.fn().mockReturnValue(mockEngine),
    destroySyncEngine: vi.fn(),
  }
})

describe('useSyncStore', () => {
  beforeEach(() => {
    localStorage.clear()
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
          queueLength: 0,
          pendingCount: 0,
          syncingCount: 0,
          completedCount: 0,
          failedCount: 0,
          conflictCount: 0,
          lastSyncAgo: null,
        },
      })
    })
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useSyncStore.getState()
      expect(state.status).toBe('idle')
      expect(state.queue).toEqual([])
      expect(state.conflicts).toEqual([])
      expect(state.history).toEqual([])
      expect(state.lastSyncTime).toBeNull()
      expect(state.isAutoSyncEnabled).toBe(false)
      expect(state.watchedPaths).toEqual([])
    })
  })

  describe('initialize', () => {
    it('should initialize with default settings', () => {
      act(() => {
        useSyncStore.getState().initialize()
      })

      const state = useSyncStore.getState()
      expect(state.isAutoSyncEnabled).toBe(false)
    })

    it('should load settings from localStorage', () => {
      localStorage.setItem('yyc3_sync_settings', JSON.stringify({
        autoSync: true,
        syncIntervalMs: 60000,
        conflictStrategy: 'remote-win',
        watchedPaths: ['/path/to/watch'],
      }))

      act(() => {
        useSyncStore.getState().initialize()
      })

      const state = useSyncStore.getState()
      expect(state.isAutoSyncEnabled).toBe(true)
      expect(state.watchedPaths).toContain('/path/to/watch')
    })
  })

  describe('enableAutoSync / disableAutoSync', () => {
    it('should enable auto sync', () => {
      act(() => {
        useSyncStore.getState().enableAutoSync()
      })

      expect(useSyncStore.getState().isAutoSyncEnabled).toBe(true)
    })

    it('should disable auto sync', () => {
      act(() => {
        useSyncStore.getState().enableAutoSync()
      })
      act(() => {
        useSyncStore.getState().disableAutoSync()
      })

      expect(useSyncStore.getState().isAutoSyncEnabled).toBe(false)
    })

    it('should persist settings to localStorage', () => {
      act(() => {
        useSyncStore.getState().enableAutoSync()
      })

      const saved = JSON.parse(localStorage.getItem('yyc3_sync_settings')!)
      expect(saved.autoSync).toBe(true)
    })
  })

  describe('watchPath / unwatchPath', () => {
    it('should add a watched path', async () => {
      await act(async () => {
        await useSyncStore.getState().watchPath('/test/path')
      })

      expect(useSyncStore.getState().watchedPaths).toContain('/test/path')
    })

    it('should not add duplicate paths', async () => {
      await act(async () => {
        await useSyncStore.getState().watchPath('/test/path')
      })
      await act(async () => {
        await useSyncStore.getState().watchPath('/test/path')
      })

      const paths = useSyncStore.getState().watchedPaths.filter(p => p === '/test/path')
      expect(paths).toHaveLength(1)
    })

    it('should remove a watched path', async () => {
      await act(async () => {
        await useSyncStore.getState().watchPath('/test/path')
      })
      act(() => {
        useSyncStore.getState().unwatchPath('/test/path')
      })

      expect(useSyncStore.getState().watchedPaths).not.toContain('/test/path')
    })
  })

  describe('resolveConflict', () => {
    it('should resolve a conflict', () => {
      act(() => {
        useSyncStore.setState({
          conflicts: [{
            id: 'conflict-1',
            path: '/test/file.ts',
            localContent: 'local',
            remoteContent: 'remote',
            localModified: 1,
            remoteModified: 2,
          }],
        })
      })

      act(() => {
        useSyncStore.getState().resolveConflict('conflict-1', 'local-win')
      })

      const conflict = useSyncStore.getState().conflicts.find(c => c.id === 'conflict-1')
      expect(conflict?.resolution).toBe('local-win')
      expect(conflict?.resolvedBy).toBe('user')
    })
  })

  describe('destroy', () => {
    it('should reset all state', () => {
      act(() => {
        useSyncStore.getState().enableAutoSync()
      })
      act(() => {
        useSyncStore.getState().destroy()
      })

      const state = useSyncStore.getState()
      expect(state.status).toBe('idle')
      expect(state.queue).toEqual([])
      expect(state.conflicts).toEqual([])
      expect(state.isAutoSyncEnabled).toBe(false)
    })
  })
})
