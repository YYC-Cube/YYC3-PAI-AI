/**
 * @file offline-store.ts
 * @description 离线状态管理模块，管理离线同步和队列
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags offline,sync,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== Type Definitions =====

/** 缓存条目 */
export interface CacheEntry {
  key: string
  category: 'ui-asset' | 'file-version' | 'db-profile' | 'ai-response' | 'plugin-data' | 'user-pref'
  sizeBytes: number
  timestamp: number
  ttl: number
  hits: number
  lastAccessed: number
}

/** 同步队列项 */
export interface SyncQueueItem {
  id: string
  action: 'create' | 'update' | 'delete' | 'sync'
  resource: string
  data: unknown
  timestamp: number
  retries: number
  maxRetries: number
  status: 'pending' | 'syncing' | 'failed' | 'completed'
  error?: string
}

/** 网络状态 */
export type NetworkStatus = 'online' | 'offline' | 'slow' | 'checking'

/** 缓存策略 */
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only'

/** 缓存策略配置 */
export interface CacheStrategyConfig {
  /** UI 资源策略 */
  uiAssets: CacheStrategy
  /** 文件版本策略 */
  fileVersions: CacheStrategy
  /** DB 连接配置策略 */
  dbProfiles: CacheStrategy
  /** AI 响应策略 */
  aiResponses: CacheStrategy
  /** 插件数据策略 */
  pluginData: CacheStrategy
}

// ===== State =====
interface OfflineStoreState {
  /** 网络状态 */
  networkStatus: NetworkStatus
  /** 是否处于离线模式 */
  isOffline: boolean
  /** 缓存条目 */
  cacheEntries: CacheEntry[]
  /** 缓存总大小 */
  totalCacheSize: number
  /** 缓存上限 */
  maxCacheSize: number
  /** 同步队列 */
  syncQueue: SyncQueueItem[]
  /** 上次同步时间 */
  lastSyncTime: number | null
  /** 是否正在同步 */
  isSyncing: boolean
  /** 缓存策略配置 */
  strategies: CacheStrategyConfig
  /** 面板可见 */
  panelVisible: boolean
  /** Service Worker 状态 */
  swStatus: 'active' | 'installing' | 'waiting' | 'inactive'
  /** 上次连通性检查 */
  lastConnectivityCheck: number | null
  /** 网络延迟 (ms) */
  networkLatency: number | null
}

// ===== Persistence =====
const LS_KEY = 'yyc3_offline_store'
const MAX_SYNC_QUEUE = 100

function loadState(): Partial<OfflineStoreState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(s: OfflineStoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      cacheEntries: s.cacheEntries,
      syncQueue: s.syncQueue.filter(q => q.status !== 'completed'),
      lastSyncTime: s.lastSyncTime,
      strategies: s.strategies,
      maxCacheSize: s.maxCacheSize,
    }))
  } catch { /* ignore */ }
}

// ===== Initial Mock Cache Entries =====
const INITIAL_CACHE: CacheEntry[] = [
  { key: 'ui/index.html', category: 'ui-asset', sizeBytes: 4096, timestamp: Date.now() - 86400000, ttl: 604800000, hits: 128, lastAccessed: Date.now() - 3600000 },
  { key: 'ui/main.js', category: 'ui-asset', sizeBytes: 524288, timestamp: Date.now() - 86400000, ttl: 604800000, hits: 128, lastAccessed: Date.now() - 3600000 },
  { key: 'ui/styles.css', category: 'ui-asset', sizeBytes: 131072, timestamp: Date.now() - 86400000, ttl: 604800000, hits: 128, lastAccessed: Date.now() - 3600000 },
  { key: 'ui/fonts/mono.woff2', category: 'ui-asset', sizeBytes: 65536, timestamp: Date.now() - 172800000, ttl: 2592000000, hits: 64, lastAccessed: Date.now() - 7200000 },
  { key: 'files/app.tsx/v3', category: 'file-version', sizeBytes: 8192, timestamp: Date.now() - 3600000, ttl: 86400000 * 30, hits: 5, lastAccessed: Date.now() - 1800000 },
  { key: 'files/store.ts/v7', category: 'file-version', sizeBytes: 12288, timestamp: Date.now() - 7200000, ttl: 86400000 * 30, hits: 3, lastAccessed: Date.now() - 3600000 },
  { key: 'db/profile/local-pg', category: 'db-profile', sizeBytes: 512, timestamp: Date.now() - 43200000, ttl: 86400000 * 365, hits: 12, lastAccessed: Date.now() - 600000 },
  { key: 'ai/cache/gpt4-q1', category: 'ai-response', sizeBytes: 2048, timestamp: Date.now() - 1800000, ttl: 3600000, hits: 1, lastAccessed: Date.now() - 1800000 },
]

// ===== Module Store =====
const persisted = loadState()
let state: OfflineStoreState = {
  networkStatus: navigator.onLine ? 'online' : 'offline',
  isOffline: !navigator.onLine,
  cacheEntries: persisted.cacheEntries ?? INITIAL_CACHE,
  totalCacheSize: (persisted.cacheEntries ?? INITIAL_CACHE).reduce((s, e) => s + e.sizeBytes, 0),
  maxCacheSize: persisted.maxCacheSize ?? 50 * 1024 * 1024,
  syncQueue: persisted.syncQueue ?? [],
  lastSyncTime: persisted.lastSyncTime ?? null,
  isSyncing: false,
  strategies: persisted.strategies ?? {
    uiAssets: 'cache-first',
    fileVersions: 'cache-first',
    dbProfiles: 'cache-first',
    aiResponses: 'stale-while-revalidate',
    pluginData: 'network-first',
  },
  panelVisible: false,
  swStatus: 'active',
  lastConnectivityCheck: null,
  networkLatency: null,
}

const listeners = new Set<() => void>()
function emit() { saveState(state); listeners.forEach(fn => fn()) }
function genId() { return 'sync_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) }

// ===== Network Status Detection =====
function handleOnline() {
  state = { ...state, networkStatus: 'online', isOffline: false }
  emit()
  offlineStoreActions.processSyncQueue()
}
function handleOffline() {
  state = { ...state, networkStatus: 'offline', isOffline: true }
  emit()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

// ===== Actions =====
export const offlineStoreActions = {

  // ===== Connectivity =====

  /** 检测网络连通性和延迟 */
  async checkConnectivity(): Promise<NetworkStatus> {
    state = { ...state, networkStatus: 'checking' }
    emit()

    try {
      const start = Date.now()
      // 使用 HEAD 请求检测连通性（模拟）
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      const latency = Date.now() - start

      const status: NetworkStatus = !navigator.onLine ? 'offline' : latency > 2000 ? 'slow' : 'online'
      state = {
        ...state,
        networkStatus: status,
        isOffline: status === 'offline',
        lastConnectivityCheck: Date.now(),
        networkLatency: latency,
      }
      emit()
      return status
    } catch {
      state = { ...state, networkStatus: 'offline', isOffline: true, lastConnectivityCheck: Date.now() }
      emit()
      return 'offline'
    }
  },

  // ===== Cache Management =====

  /** 添加缓存条目 */
  addCacheEntry(entry: Omit<CacheEntry, 'hits' | 'lastAccessed'>) {
    const existing = state.cacheEntries.findIndex(e => e.key === entry.key)
    const newEntry: CacheEntry = { ...entry, hits: 0, lastAccessed: Date.now() }

    let entries: CacheEntry[]
    if (existing >= 0) {
      entries = state.cacheEntries.map((e, i) => i === existing ? { ...newEntry, hits: e.hits + 1 } : e)
    } else {
      entries = [...state.cacheEntries, newEntry]
    }

    // 检查缓存上限——LRU 淘汰
    let totalSize = entries.reduce((s, e) => s + e.sizeBytes, 0)
    while (totalSize > state.maxCacheSize && entries.length > 0) {
      const oldest = entries.reduce((min, e) => e.lastAccessed < min.lastAccessed ? e : min)
      entries = entries.filter(e => e.key !== oldest.key)
      totalSize -= oldest.sizeBytes
    }

    state = { ...state, cacheEntries: entries, totalCacheSize: totalSize }
    emit()
  },

  /** 访问缓存（更新 hits） */
  accessCache(key: string) {
    state = {
      ...state,
      cacheEntries: state.cacheEntries.map(e =>
        e.key === key ? { ...e, hits: e.hits + 1, lastAccessed: Date.now() } : e
      ),
    }
    emit()
  },

  /** 删除缓存条目 */
  removeCacheEntry(key: string) {
    const entry = state.cacheEntries.find(e => e.key === key)
    state = {
      ...state,
      cacheEntries: state.cacheEntries.filter(e => e.key !== key),
      totalCacheSize: state.totalCacheSize - (entry?.sizeBytes ?? 0),
    }
    emit()
  },

  /** 清理过期缓存 */
  cleanExpiredCache() {
    const now = Date.now()
    const valid = state.cacheEntries.filter(e => now - e.timestamp < e.ttl)
    state = {
      ...state,
      cacheEntries: valid,
      totalCacheSize: valid.reduce((s, e) => s + e.sizeBytes, 0),
    }
    emit()
  },

  /** 清除指定类别缓存 */
  clearCacheByCategory(category: CacheEntry['category']) {
    const remaining = state.cacheEntries.filter(e => e.category !== category)
    state = {
      ...state,
      cacheEntries: remaining,
      totalCacheSize: remaining.reduce((s, e) => s + e.sizeBytes, 0),
    }
    emit()
  },

  /** 清除全部缓存 */
  clearAllCache() {
    state = { ...state, cacheEntries: [], totalCacheSize: 0 }
    emit()
  },

  /** 设置缓存上限 */
  setMaxCacheSize(bytes: number) {
    state = { ...state, maxCacheSize: bytes }
    emit()
  },

  // ===== Sync Queue =====

  /** 添加同步队列项 */
  addToSyncQueue(action: SyncQueueItem['action'], resource: string, data: unknown) {
    const item: SyncQueueItem = {
      id: genId(), action, resource, data,
      timestamp: Date.now(), retries: 0, maxRetries: 3, status: 'pending',
    }
    state = { ...state, syncQueue: [...state.syncQueue, item].slice(-MAX_SYNC_QUEUE) }
    emit()

    // 如果在线则立即处理
    if (!state.isOffline) offlineStoreActions.processSyncQueue()
  },

  /** 处理同步队列 */
  async processSyncQueue() {
    if (state.isSyncing || state.isOffline) return

    const pending = state.syncQueue.filter(q => q.status === 'pending' || q.status === 'failed')
    if (pending.length === 0) return

    state = { ...state, isSyncing: true }
    emit()

    for (const item of pending) {
      // 更新状态为 syncing
      state = {
        ...state,
        syncQueue: state.syncQueue.map(q => q.id === item.id ? { ...q, status: 'syncing' as const } : q),
      }
      emit()

      // 模拟同步操作
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
      const success = Math.random() > 0.1

      state = {
        ...state,
        syncQueue: state.syncQueue.map(q => {
          if (q.id !== item.id) return q
          if (success) return { ...q, status: 'completed' as const }
          const newRetries = q.retries + 1
          return newRetries >= q.maxRetries
            ? { ...q, status: 'failed' as const, retries: newRetries, error: 'Max retries exceeded' }
            : { ...q, status: 'pending' as const, retries: newRetries }
        }),
      }
      emit()
    }

    state = { ...state, isSyncing: false, lastSyncTime: Date.now() }
    emit()
  },

  /** 重试失败的同步项 */
  retrySyncItem(id: string) {
    state = {
      ...state,
      syncQueue: state.syncQueue.map(q => q.id === id ? { ...q, status: 'pending' as const, retries: 0, error: undefined } : q),
    }
    emit()
    if (!state.isOffline) offlineStoreActions.processSyncQueue()
  },

  /** 清除已完成的同步项 */
  clearCompletedSync() {
    state = { ...state, syncQueue: state.syncQueue.filter(q => q.status !== 'completed') }
    emit()
  },

  /** 清除全部同步队列 */
  clearSyncQueue() {
    state = { ...state, syncQueue: [] }
    emit()
  },

  // ===== Strategy Configuration =====

  /** 设置缓存策略 */
  setStrategy(category: keyof CacheStrategyConfig, strategy: CacheStrategy) {
    state = { ...state, strategies: { ...state.strategies, [category]: strategy } }
    emit()
  },

  // ===== Panel =====
  openPanel() { state = { ...state, panelVisible: true }; emit() },
  closePanel() { state = { ...state, panelVisible: false }; emit() },
}

// ===== Periodic Cleanup (对齐 Guidelines: offline cache maintenance) =====
setInterval(() => { offlineStoreActions.cleanExpiredCache() }, 300000)

// ===== React Hook =====
export function useOfflineStore() {
  const snapshot = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    () => state,
  )
  return { ...snapshot, ...offlineStoreActions }
}
