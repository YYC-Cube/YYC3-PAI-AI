/**
 * @file sync-store.ts
 * @description 同步状态管理Store，提供React组件使用的同步状态和操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getSyncEngine, destroySyncEngine, type SyncStatus, type SyncItem, type SyncConflict, type SyncResult } from '../services/sync-engine'

export interface SyncState {
  status: SyncStatus
  queue: SyncItem[]
  conflicts: SyncConflict[]
  history: SyncResult[]
  lastSyncTime: number | null
  isAutoSyncEnabled: boolean
  watchedPaths: string[]
  stats: {
    queueLength: number
    pendingCount: number
    syncingCount: number
    completedCount: number
    failedCount: number
    conflictCount: number
    lastSyncAgo: number | null
  }
}

interface SyncActions {
  initialize: () => void
  startSync: () => Promise<SyncResult>
  abortSync: () => void
  enableAutoSync: () => void
  disableAutoSync: () => void
  watchPath: (path: string) => Promise<void>
  unwatchPath: (path: string) => void
  resolveConflict: (conflictId: string, resolution: 'local-win' | 'remote-win') => void
  retryFailedItems: () => void
  clearCompletedItems: () => void
  removeFromQueue: (itemId: string) => void
  refreshStats: () => void
  destroy: () => void
}

const LS_KEY = 'yyc3_sync_settings'

interface SyncSettings {
  autoSync: boolean
  syncIntervalMs: number
  conflictStrategy: 'local-win' | 'remote-win' | 'manual'
  watchedPaths: string[]
}

function loadSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {
    autoSync: false,
    syncIntervalMs: 30000,
    conflictStrategy: 'local-win',
    watchedPaths: [],
  }
}

function saveSettings(settings: SyncSettings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

export const useSyncStore = create<SyncState & SyncActions>()(
  immer((set, _get) => ({
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

    initialize: () => {
      const settings = loadSettings()
      const engine = getSyncEngine({
        autoSync: settings.autoSync,
        syncIntervalMs: settings.syncIntervalMs,
        conflictStrategy: settings.conflictStrategy,
        onStatusChange: (status) => {
          set((state) => { state.status = status })
        },
        onProgress: (progress) => {
          set((state) => {
            const itemIndex = state.queue.findIndex(i => i.id === progress.item.id)
            if (itemIndex >= 0) {
              state.queue[itemIndex] = progress.item
            }
          })
        },
        onComplete: (result) => {
          set((state) => {
            state.history.unshift(result)
            if (state.history.length > 50) {
              state.history = state.history.slice(0, 50)
            }
            state.lastSyncTime = Date.now()
            state.queue = state.queue.filter(i =>
              i.status !== 'completed'
            )
          })
        },
        onConflict: (conflict) => {
          set((state) => {
            const existingIndex = state.conflicts.findIndex(c => c.id === conflict.id)
            if (existingIndex >= 0) {
              state.conflicts[existingIndex] = conflict
            } else {
              state.conflicts.push(conflict)
            }
          })
        },
      })

      settings.watchedPaths.forEach(path => {
        engine.watchPath(path)
      })

      set((state) => {
        state.isAutoSyncEnabled = settings.autoSync
        state.watchedPaths = settings.watchedPaths
      })
    },

    startSync: async () => {
      const engine = getSyncEngine()
      const result = await engine.startSync()

      set((state) => {
        state.status = engine.getStatus()
        state.queue = engine.getQueue()
        state.conflicts = engine.getConflicts()
        state.lastSyncTime = engine.getLastSyncTime()
        state.stats = engine.getStats()
      })

      return result
    },

    abortSync: () => {
      const engine = getSyncEngine()
      engine.abortSync()

      set((state) => { state.status = 'idle' })
    },

    enableAutoSync: () => {
      const engine = getSyncEngine()
      engine.enableAutoSync()

      const settings = loadSettings()
      settings.autoSync = true
      saveSettings(settings)

      set((state) => { state.isAutoSyncEnabled = true })
    },

    disableAutoSync: () => {
      const engine = getSyncEngine()
      engine.disableAutoSync()

      const settings = loadSettings()
      settings.autoSync = false
      saveSettings(settings)

      set((state) => { state.isAutoSyncEnabled = false })
    },

    watchPath: async (path: string) => {
      const engine = getSyncEngine()
      await engine.watchPath(path)

      const settings = loadSettings()
      if (!settings.watchedPaths.includes(path)) {
        settings.watchedPaths.push(path)
        saveSettings(settings)
      }

      set((state) => {
        if (!state.watchedPaths.includes(path)) {
          state.watchedPaths.push(path)
        }
      })
    },

    unwatchPath: (path: string) => {
      const engine = getSyncEngine()
      engine.unwatchPath(path)

      const settings = loadSettings()
      settings.watchedPaths = settings.watchedPaths.filter(p => p !== path)
      saveSettings(settings)

      set((state) => {
        state.watchedPaths = state.watchedPaths.filter(p => p !== path)
      })
    },

    resolveConflict: (conflictId: string, resolution: 'local-win' | 'remote-win') => {
      const engine = getSyncEngine()
      engine.resolveConflictManually(conflictId, resolution, 'user')

      set((state) => {
        const conflict = state.conflicts.find(c => c.id === conflictId)
        if (conflict) {
          conflict.resolution = resolution
          conflict.resolvedBy = 'user'
        }

        state.queue = state.queue.map(item =>
          item.status === 'conflict' && state.conflicts.some(c =>
            c.path === item.path && c.id === conflictId
          )
            ? { ...item, status: 'pending' as const }
            : item
        )
      })
    },

    retryFailedItems: () => {
      const engine = getSyncEngine()
      engine.retryFailedItems()

      set((state) => {
        state.queue = engine.getQueue()
        state.stats = engine.getStats()
      })
    },

    clearCompletedItems: () => {
      const engine = getSyncEngine()
      engine.clearCompletedItems()

      set((state) => {
        state.queue = engine.getQueue()
        state.stats = engine.getStats()
      })
    },

    removeFromQueue: (itemId: string) => {
      const engine = getSyncEngine()
      engine.removeFromQueue(itemId)

      set((state) => {
        state.queue = engine.getQueue()
        state.stats = engine.getStats()
      })
    },

    refreshStats: () => {
      const engine = getSyncEngine()

      set((state) => {
        state.status = engine.getStatus()
        state.queue = engine.getQueue()
        state.conflicts = engine.getConflicts()
        state.lastSyncTime = engine.getLastSyncTime()
        state.stats = engine.getStats()
      })
    },

    destroy: () => {
      destroySyncEngine()

      set((state) => {
        state.status = 'idle'
        state.queue = []
        state.conflicts = []
        state.history = []
        state.lastSyncTime = null
        state.isAutoSyncEnabled = false
        state.watchedPaths = []
        state.stats = {
          queueLength: 0,
          pendingCount: 0,
          syncingCount: 0,
          completedCount: 0,
          failedCount: 0,
          conflictCount: 0,
          lastSyncAgo: null,
        }
      })
    },
  }))
)
