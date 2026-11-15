/**
 * @file unified-data-store.ts
 * @description 统一数据管理Store - 一人一端数据主权核心
 *              Tier 1: Zustand + localStorage (配置/会话/模型)
 *              Tier 2: IndexedDB (大容量: 文件/历史/大模型数据)
 *              安全层: Web Crypto API (敏感字段自动加密)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-04-08
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags unified,data,sovereignty,privacy,local-first,security
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { dataPortabilityManager, type ExportOptions, type ImportOptions, type ImportPreview } from '../services/data-portability-manager'
import { indexedDBService } from '../services/indexeddb-service'
import { secureStorage } from '../services/secure-storage'
import type { BackendConnectionConfig, BackendType } from '../services/sync-backend-adapter'
import { getSyncEngine } from '../services/sync-engine'
import { createLogger } from '../utils/logger'

const logger = createLogger('unified-data')

// ============================================================================
// 类型定义
// ============================================================================

/** 数据存储位置 */
export type DataLocation = 'local' | 'indexeddb' | 'filesystem' | 'cloud' | 'external'

/** 数据类型 */
export type DataType =
  | 'settings'
  | 'models'
  | 'files'
  | 'notes'
  | 'projects'
  | 'chat-history'
  | 'sync-records'
  | 'backups'
  | 'keys'
  | 'cache'
  | 'secure'
  | 'templates'
  | 'workspace'
  | 'misc'

/** 数据状态 */
export type DataStatus = 'synced' | 'pending' | 'conflict' | 'error' | 'encrypted'

/** 数据条目 */
export interface DataEntry {
  id: string
  type: DataType
  location: DataLocation
  status: DataStatus
  size: number
  lastModified: number
  encrypted: boolean
  synced: boolean
  checksum?: string
  path?: string
  provider?: string
}

/** 存储配额 */
export interface StorageQuota {
  location: DataLocation
  used: number
  total: number
  available: number
  percentage: number
}

/** 同步状态 */
export interface SyncStatus {
  lastSync: number | null
  pending: number
  conflicts: number
  errors: number
  isSyncing: boolean
  progress: number
}

/** 安全状态 */
export interface SecurityStatus {
  vaultLocked: boolean
  encryptionEnabled: boolean
  initialized: boolean
  keyDerivationIterations: number
  lastAuditTime: number
  securityScore: number
  secureItemCount: number
}

/** 数据可移植性状态 */
export interface PortabilityStatus {
  exportInProgress: boolean
  importInProgress: boolean
  lastExport: number | null
  lastImport: number | null
  supportedFormats: string[]
}

/** 统一数据状态 */
export interface UnifiedDataState {
  // 数据概览
  entries: DataEntry[]
  totalSize: number
  totalEntries: number

  // 存储配额
  quotas: StorageQuota[]

  // 同步状态
  sync: SyncStatus

  // 安全状态
  security: SecurityStatus

  // 可移植性
  portability: PortabilityStatus

  // UI状态
  activeTab: 'overview' | 'sync' | 'security' | 'portability' | 'advanced'
  searchQuery: string
  selectedEntries: string[]

  // ======================================================================
  // 统一数据操作 API
  // ======================================================================

  // 初始化
  initialize: (vaultPassphrase?: string) => Promise<void>

  // 数据扫描
  scanData: () => Promise<void>

  // ---------- 通用数据操作 ----------
  /** 存储数据（自动路由: 小数据→localStorage, 大数据→IndexedDB） */
  setData: (key: string, value: unknown, options?: SetDataOptions) => Promise<void>
  /** 读取数据 */
  getData: <T = unknown>(key: string) => Promise<T | null>
  /** 删除数据 */
  removeData: (key: string) => Promise<void>
  /** 检查数据是否存在 */
  hasData: (key: string) => Promise<boolean>

  // ---------- 敏感数据操作（自动加密） ----------
  /** 存储敏感数据（自动加密） */
  setSensitive: (key: string, value: string, options?: SensitiveOptions) => Promise<void>
  /** 读取敏感数据（自动解密） */
  getSensitive: (key: string) => Promise<string | null>
  /** 删除敏感数据 */
  removeSensitive: (key: string) => Promise<void>

  // ---------- IndexedDB 大容量操作 ----------
  /** 存储大数据到 IndexedDB */
  setLarge: (storeName: string, id: string, data: unknown) => Promise<void>
  /** 从 IndexedDB 读取大数据 */
  getLarge: <T = unknown>(storeName: string, id: string) => Promise<T | null>
  /** 从 IndexedDB 查询数据 */
  queryLarge: <T = unknown>(storeName: string, query?: {
    index?: string
    range?: string | number | IDBKeyRange
    limit?: number
    offset?: number
  }) => Promise<T[]>

  // ---------- 存储管理 ----------
  /** 获取所有存储配额 */
  refreshQuotas: () => Promise<void>
  /** 迁移数据从 localStorage 到 IndexedDB */
  migrateToIndexedDB: (prefix?: string) => Promise<number>
  /** 触发存储清理（基于策略引擎） */
  cleanStorage: (dryRun?: boolean) => Promise<void>

  // ---------- 安全操作 ----------
  /** 解锁安全存储 */
  unlockVault: (passphrase: string) => Promise<boolean>
  /** 锁定安全存储 */
  lockVault: () => void
  /** 获取安全评分 */
  getSecurityScore: () => number

  // ---------- 同步操作 ----------
  syncAll: () => Promise<void>
  syncEntry: (id: string) => Promise<void>
  /** 设置远程同步后端 */
  setSyncBackend: (type: BackendType, config?: BackendConnectionConfig) => Promise<void>

  // ---------- 可移植性 ----------
  exportData: (format: 'json' | 'zip', options?: {
    entries?: string[]
    types?: DataType[]
    includeEncrypted?: boolean
    compress?: boolean
    includeIndexedDB?: boolean
    prettyPrint?: boolean
  }) => Promise<Blob>
  importData: (file: File, options?: {
    merge?: boolean
    overwrite?: boolean
    passphrase?: string
    validateChecksum?: boolean
    skipErrors?: boolean
    types?: DataType[]
  }) => Promise<void>
  /** 预览导入文件内容 */
  previewImport: (file: File) => Promise<ImportPreview>

  // ---------- 冲突解决 ----------
  resolveConflict: (id: string, resolution: 'local' | 'remote' | 'merge') => Promise<void>

  // ---------- UI操作 ----------
  setActiveTab: (tab: UnifiedDataState['activeTab']) => void
  setSearchQuery: (query: string) => void
  toggleEntrySelection: (id: string) => void
  selectAllEntries: () => void
  clearSelection: () => void
}

// ============================================================================
// 辅助类型
// ============================================================================

export interface SetDataOptions {
  /** 强制存储位置 */
  location?: DataLocation
  /** 数据类型 */
  type?: DataType
  /** 关联的 provider */
  provider?: string
  /** 是否同步标记 */
  markSynced?: boolean
}

export interface SensitiveOptions {
  type?: 'api-key' | 'token' | 'password' | 'secret' | 'private-key'
  provider?: string
  label?: string
}

// ============================================================================
// 常量
// ============================================================================

const STORAGE_LOCATIONS: DataLocation[] = ['local', 'indexeddb', 'filesystem']
const SUPPORTED_EXPORT_FORMATS = ['json', 'zip', 'sqlite']

/** localStorage 单条目大小阈值（超过此值建议存入 IndexedDB） */
const LOCALSTORAGE_SIZE_THRESHOLD = 100 * 1024 // 100KB

/** 前缀常量 */
const LS_PREFIX = 'yyc3_'
const YYC3_KEY_PATTERN = /^yyc3_/

// ============================================================================
// 辅助函数
// ============================================================================

function calculateLocalStorageUsage(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      if (value) {
        total += key.length + value.length
      }
    }
  }
  return total * 2 // UTF-16 编码
}

function getItemSize(value: unknown): number {
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  return str.length * 2 // UTF-16 编码
}

async function getStorageQuota(location: DataLocation): Promise<StorageQuota> {
  if (location === 'local') {
    const used = calculateLocalStorageUsage()
    const total = 5 * 1024 * 1024 // 5MB 典型限制
    return {
      location,
      used,
      total,
      available: total - used,
      percentage: (used / total) * 100,
    }
  }

  if (location === 'indexeddb') {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const total = estimate.quota || 0
      return {
        location,
        used,
        total,
        available: total - used,
        percentage: total > 0 ? (used / total) * 100 : 0,
      }
    }
  }

  return { location, used: 0, total: 0, available: 0, percentage: 0 }
}

function scanLocalStorage(): DataEntry[] {
  const entries: DataEntry[] = []
  const prefixPattern = YYC3_KEY_PATTERN
  const sensitivePattern = /encrypted|vault|secret|key|token/i

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && prefixPattern.test(key)) {
      const value = localStorage.getItem(key)
      if (value) {
        let type: DataType = 'settings'
        if (key.includes('model')) type = 'models'
        else if (key.includes('file')) type = 'files'
        else if (key.includes('sync')) type = 'sync-records'
        else if (key.includes('backup')) type = 'backups'
        else if (key.includes('cache')) type = 'cache'
        else if (key.includes('secure') || key.includes('vault')) type = 'secure'
        else if (key.includes('template')) type = 'templates'
        else if (key.includes('project')) type = 'projects'

        entries.push({
          id: `local:${key}`,
          type,
          location: 'local',
          status: 'synced',
          size: (key.length + value.length) * 2,
          lastModified: Date.now(),
          encrypted: sensitivePattern.test(key) || key.includes('vault'),
          synced: false,
          path: key,
        })
      }
    }
  }

  return entries
}

async function scanIndexedDB(): Promise<DataEntry[]> {
  const entries: DataEntry[] = []
  try {
    const storeNames = indexedDBService.getStoreNames()
    for (const storeName of storeNames) {
      const records = await indexedDBService.getAll<Record<string, unknown>>(storeName)
      for (const record of records) {
        const data = record.data || {}
        entries.push({
          id: `idb:${storeName}:${record.id}`,
          type: (data.type as DataType) || 'misc',
          location: 'indexeddb',
          status: data.encrypted ? 'encrypted' : 'synced',
          size: new Blob([JSON.stringify(record)]).size,
          lastModified: (record.updatedAt || record.createdAt || Date.now()) as number,
          encrypted: !!data.encrypted,
          synced: false,
          path: `${storeName}/${record.id}`,
          provider: data.provider as string | undefined,
        })
      }
    }
  } catch (error) {
    logger.error('[UnifiedData] Failed to scan IndexedDB:', error)
  }
  return entries
}

// ============================================================================
// Store 实现
// ============================================================================

export const useUnifiedDataStore = create<UnifiedDataState>()(
  immer((set, get) => ({
    // 初始状态
    entries: [],
    totalSize: 0,
    totalEntries: 0,
    quotas: [],
    sync: {
      lastSync: null,
      pending: 0,
      conflicts: 0,
      errors: 0,
      isSyncing: false,
      progress: 0,
    },
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
      supportedFormats: SUPPORTED_EXPORT_FORMATS,
    },
    activeTab: 'overview',
    searchQuery: '',
    selectedEntries: [],

    // ======================================================================
    // 初始化
    // ======================================================================

    initialize: async (vaultPassphrase?: string) => {
      logger.info('[UnifiedData] Initializing...')

      // 1. 初始化 IndexedDB
      try {
        await indexedDBService.open()
        logger.info('[UnifiedData] IndexedDB initialized')
      } catch (error) {
        logger.error('[UnifiedData] IndexedDB init failed:', error)
      }

      // 2. 初始化安全存储（如果提供了密码）
      if (vaultPassphrase) {
        try {
          await secureStorage.initialize(vaultPassphrase)
          set(state => {
            state.security.vaultLocked = false
            state.security.encryptionEnabled = true
            state.security.initialized = true
          })
          logger.info('[UnifiedData] Security vault initialized')
        } catch (error) {
          logger.warn('[UnifiedData] Vault init failed (will be prompted later):', error)
        }
      }

      // 3. 扫描数据
      await get().scanData()

      // 4. 获取存储配额
      const quotas: StorageQuota[] = []
      for (const location of STORAGE_LOCATIONS) {
        quotas.push(await getStorageQuota(location))
      }

      set(state => {
        state.quotas = quotas
        state.security.securityScore = secureStorage.getSecurityScore()
      })

      logger.info('[UnifiedData] Initialization complete')
    },

    // ======================================================================
    // 数据扫描
    // ======================================================================

    scanData: async () => {
      logger.info('[UnifiedData] Scanning data...')

      const entries: DataEntry[] = []

      // 扫描 localStorage
      entries.push(...scanLocalStorage())

      // 扫描 IndexedDB
      const idbEntries = await scanIndexedDB()
      entries.push(...idbEntries)

      // 计算总大小
      const totalSize = entries.reduce((sum, e) => sum + e.size, 0)

      // 计算同步状态
      const pending = entries.filter(e => e.status === 'pending').length
      const conflicts = entries.filter(e => e.status === 'conflict').length
      const errors = entries.filter(e => e.status === 'error').length
      const encrypted = entries.filter(e => e.encrypted).length

      set(state => {
        state.entries = entries
        state.totalSize = totalSize
        state.totalEntries = entries.length
        state.sync.pending = pending
        state.sync.conflicts = conflicts
        state.sync.errors = errors
        state.security.secureItemCount = encrypted
      })

      logger.info(`[UnifiedData] Scanned ${entries.length} entries, total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    },

    // ======================================================================
    // 通用数据操作（自动路由存储位置）
    // ======================================================================

    setData: async (key: string, value: unknown, options?: SetDataOptions) => {
      const lsKey = key.startsWith(LS_PREFIX) ? key : `${LS_PREFIX}${key}`
      const size = getItemSize(value)
      const targetLocation = options?.location || (size > LOCALSTORAGE_SIZE_THRESHOLD ? 'indexeddb' : 'local')

      if (targetLocation === 'indexeddb' || targetLocation === 'local' && size > LOCALSTORAGE_SIZE_THRESHOLD) {
        // 大容量数据 -> IndexedDB
        const storeName = options?.type || 'large-data'
        await indexedDBService.set(storeName, lsKey, {
          value,
          type: options?.type || 'misc',
          encrypted: false,
          provider: options?.provider,
        }, { type: options?.type })
        logger.debug(`[UnifiedData] Set ${lsKey} → IndexedDB.${storeName} (${(size / 1024).toFixed(1)}KB)`)
      } else {
        // 小数据 -> localStorage
        try {
          const serialized = JSON.stringify(value)
          localStorage.setItem(lsKey, serialized)
          logger.debug(`[UnifiedData] Set ${lsKey} → localStorage (${(size / 1024).toFixed(1)}KB)`)
        } catch (error) {
          logger.error(`[UnifiedData] localStorage set failed for ${lsKey}, falling back to IndexedDB:`, error)
          const storeName = options?.type || 'large-data'
          await indexedDBService.set(storeName, lsKey, {
            value,
            type: options?.type || 'misc',
            encrypted: false,
            provider: options?.provider,
          })
        }
      }

      // 更新状态
      if (options?.markSynced !== false) {
        await get().scanData()
      }
    },

    getData: async <T = unknown>(key: string): Promise<T | null> => {
      const lsKey = key.startsWith(LS_PREFIX) ? key : `${LS_PREFIX}${key}`

      // 先查 localStorage
      try {
        const localValue = localStorage.getItem(lsKey)
        if (localValue !== null) {
          try {
            return JSON.parse(localValue) as T
          } catch {
            return localValue as unknown as T
          }
        }
      } catch {
        // localStorage 不可用时忽略
      }

      // 再查 IndexedDB
      try {
        const storeNames = indexedDBService.getStoreNames()
        for (const storeName of storeNames) {
          const record = await indexedDBService.getData<{ value: T }>(storeName, lsKey)
          if (record?.value !== undefined && record?.value !== null) {
            return record.value as T
          }
        }
      } catch {
        // 忽略
      }

      return null
    },

    removeData: async (key: string) => {
      const lsKey = key.startsWith(LS_PREFIX) ? key : `${LS_PREFIX}${key}`

      // 从 localStorage 删除
      try {
        localStorage.removeItem(lsKey)
      } catch { /* 忽略 */ }

      // 从 IndexedDB 删除
      try {
        const storeNames = indexedDBService.getStoreNames()
        for (const storeName of storeNames) {
          await indexedDBService.delete(storeName, lsKey)
        }
      } catch { /* 忽略 */ }

      await get().scanData()
      logger.debug(`[UnifiedData] Removed ${lsKey}`)
    },

    hasData: async (key: string): Promise<boolean> => {
      const lsKey = key.startsWith(LS_PREFIX) ? key : `${LS_PREFIX}${key}`

      try {
        if (localStorage.getItem(lsKey) !== null) return true
      } catch { /* 忽略 */ }

      try {
        const storeNames = indexedDBService.getStoreNames()
        for (const storeName of storeNames) {
          const record = await indexedDBService.getData(storeName, lsKey)
          if (record !== null) return true
        }
      } catch { /* 忽略 */ }

      return false
    },

    // ======================================================================
    // 敏感数据操作（自动加密/解密）
    // ======================================================================

    setSensitive: async (key: string, value: string, options?: SensitiveOptions) => {
      const id = key.replace(LS_PREFIX, '')

      try {
        await secureStorage.storeSecret(id, value, options?.type || 'api-key', {
          label: options?.label,
          provider: options?.provider,
        })

        // 不在 localStorage 中存明文，只存一个标记
        localStorage.setItem(`${LS_PREFIX}secure_ref_${id}`, JSON.stringify({
          type: options?.type || 'api-key',
          provider: options?.provider,
          storedAt: Date.now(),
        }))

        await get().scanData()
        logger.info(`[UnifiedData] Stored sensitive: ${id}`)
      } catch (error) {
        logger.error(`[UnifiedData] Failed to store sensitive ${id}:`, error)
        throw error
      }
    },

    getSensitive: async (key: string): Promise<string | null> => {
      const id = key.replace(LS_PREFIX, '')

      try {
        return await secureStorage.readSecret(id)
      } catch (error) {
        logger.error(`[UnifiedData] Failed to read sensitive ${id}:`, error)
        return null
      }
    },

    removeSensitive: async (key: string) => {
      const id = key.replace(LS_PREFIX, '')

      try {
        await secureStorage.deleteSecret(id)
        localStorage.removeItem(`${LS_PREFIX}secure_ref_${id}`)
        await get().scanData()
        logger.info(`[UnifiedData] Removed sensitive: ${id}`)
      } catch (error) {
        logger.error(`[UnifiedData] Failed to remove sensitive ${id}:`, error)
      }
    },

    // ======================================================================
    // IndexedDB 大容量操作
    // ======================================================================

    setLarge: async (storeName: string, id: string, data: unknown) => {
      const fullId = `${LS_PREFIX}${id}`
      await indexedDBService.set(storeName, fullId, data, { type: storeName })
      await get().scanData()
    },

    getLarge: async <T = unknown>(storeName: string, id: string): Promise<T | null> => {
      const fullId = `${LS_PREFIX}${id}`
      return indexedDBService.getData<T>(storeName, fullId)
    },

    queryLarge: async <T = unknown>(storeName: string, query?: {
      index?: string
      range?: string | number | IDBKeyRange
      limit?: number
      offset?: number
    }): Promise<T[]> => {
      const records = await indexedDBService.getAll<T>(storeName, query)
      return records.map(r => r.data)
    },

    // ======================================================================
    // 存储管理
    // ======================================================================

    refreshQuotas: async () => {
      const quotas: StorageQuota[] = []
      for (const location of STORAGE_LOCATIONS) {
        quotas.push(await getStorageQuota(location))
      }

      set(state => {
        state.quotas = quotas
      })
    },

    migrateToIndexedDB: async (prefix: string = LS_PREFIX): Promise<number> => {
      const count = await indexedDBService.migrateFromLocalStorage(prefix)
      if (count > 0) {
        // 迁移成功后删除 localStorage 中的原始数据
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(prefix) && !key.includes('vault') && !key.includes('secure_ref')) {
            const value = localStorage.getItem(key)
            if (value && value.length * 2 > LOCALSTORAGE_SIZE_THRESHOLD) {
              localStorage.removeItem(key)
              logger.debug(`[UnifiedData] Removed ${key} from localStorage after migration`)
            }
          }
        }
        await get().scanData()
      }
      return count
    },

    cleanStorage: async (dryRun: boolean = false) => {
      logger.info(`[UnifiedData] Running storage cleanup (dryRun=${dryRun})...`)
      try {
        const { storageCleaner } = await import('../utils/storage-cleaner')
        const result = await storageCleaner.runAllPolicies(dryRun)
        if (!dryRun) {
          await get().scanData()
          await get().refreshQuotas()
        }
        logger.info(`[UnifiedData] Cleanup done: ${result.cleaned} items, ` +
          `${(result.freedBytes / 1024).toFixed(1)}KB freed`)
      } catch (error) {
        logger.error('[UnifiedData] Cleanup failed:', error)
        throw error
      }
    },

    // ======================================================================
    // 安全操作
    // ======================================================================

    unlockVault: async (passphrase: string): Promise<boolean> => {
      try {
        const unlocked = await secureStorage.unlock({ passphrase })
        if (unlocked) {
          const status = secureStorage.getStatus()
          set(state => {
            state.security.vaultLocked = false
            state.security.encryptionEnabled = true
            state.security.initialized = status.initialized
            state.security.securityScore = secureStorage.getSecurityScore()
          })
        }
        return unlocked
      } catch (error) {
        logger.error('[UnifiedData] Failed to unlock vault:', error)
        return false
      }
    },

    lockVault: () => {
      secureStorage.lock()
      set(state => {
        state.security.vaultLocked = true
      })
    },

    getSecurityScore: (): number => {
      return secureStorage.getSecurityScore()
    },

    // ======================================================================
    // 同步操作（集成 sync-engine + 远程后端）
    // ======================================================================

    syncAll: async () => {
      logger.info('[UnifiedData] Starting full sync via sync-engine...')

      set(state => {
        state.sync.isSyncing = true
        state.sync.progress = 0
      })

      try {
        const engine = getSyncEngine()
        const result = await engine.startSync()

        set(state => {
          state.sync.isSyncing = false
          state.sync.lastSync = Date.now()
          state.sync.progress = 100
          state.sync.pending = result.failedItems
          state.sync.conflicts = result.conflictedItems
          state.sync.errors = result.errors.length
        })

        logger.info(`[UnifiedData] Sync completed: ${result.syncedItems} synced, ` +
          `${result.conflictedItems} conflicts`)
      } catch (error) {
        logger.error('[UnifiedData] Sync failed:', error)
        set(state => {
          state.sync.isSyncing = false
          state.sync.errors++
        })
      }
    },

    syncEntry: async (_id: string) => {
      logger.debug(`[UnifiedData] SyncOne triggered - using full sync for entry: ${_id}`)
      try {
        const engine = getSyncEngine()
        await engine.startSync()
      } catch (error) {
        logger.error(`[UnifiedData] Sync entry ${_id} failed:`, error)
      }
    },

    setSyncBackend: async (type: BackendType, config?: BackendConnectionConfig) => {
      logger.info(`[UnifiedData] Setting sync backend: ${type}`)
      const engine = getSyncEngine()

      try {
        const fullConfig: BackendConnectionConfig = config || {
          type,
          label: `Sync Backend (${type})`,
        }
        await engine.configureBackend(type, fullConfig)
      } catch (error) {
        logger.error(`[UnifiedData] Failed to set backend ${type}:`, error)
        throw error
      }
    },

    // ======================================================================
    // 可移植性（集成 data-portability-manager v2）
    // ======================================================================

    exportData: async (format: 'json' | 'zip', options?: {
      entries?: string[]
      types?: DataType[]
      includeEncrypted?: boolean
      compress?: boolean
      includeIndexedDB?: boolean
      prettyPrint?: boolean
    }) => {
      logger.info(`[UnifiedData] Exporting data in ${format} format...`)

      set(state => { state.portability.exportInProgress = true })

      try {
        const targetEntries = options?.entries
          ? get().entries.filter(e => options.entries!.includes(e.id))
          : get().entries

        const exportOpts: ExportOptions = {
          format,
          includeEncrypted: options?.includeEncrypted ?? true,
          includeMetadata: true,
          compress: options?.compress ?? false,
          prettyPrint: options?.prettyPrint ?? true,
          types: options?.types,
          includeIndexedDB: options?.includeIndexedDB ?? true,
        }

        const result = await dataPortabilityManager.exportData(targetEntries, exportOpts)

        set(state => {
          state.portability.exportInProgress = false
          state.portability.lastExport = Date.now()
        })

        logger.info(`[UnifiedData] Export completed: ${result.entries} entries, ${(result.size / 1024).toFixed(1)}KB`)
        return result.blob
      } catch (error) {
        logger.error('[UnifiedData] Export failed:', error)
        set(state => { state.portability.exportInProgress = false })
        throw error
      }
    },

    importData: async (file: File, options?: {
      merge?: boolean
      overwrite?: boolean
      passphrase?: string
      validateChecksum?: boolean
      skipErrors?: boolean
      types?: DataType[]
    }) => {
      logger.info(`[UnifiedData] Importing data from ${file.name}...`)

      set(state => { state.portability.importInProgress = true })

      try {
        const importOpts: ImportOptions = {
          merge: options?.merge ?? true,
          overwrite: options?.overwrite ?? false,
          passphrase: options?.passphrase,
          validateChecksum: options?.validateChecksum ?? true,
          skipErrors: options?.skipErrors ?? false,
          types: options?.types,
        }

        const result = await dataPortabilityManager.importData(file, importOpts)

        await get().scanData()

        set(state => {
          state.portability.importInProgress = false
          state.portability.lastImport = Date.now()
        })

        if (result.errors.length > 0) {
          logger.warn(`[UnifiedData] Import completed with ${result.errors.length} errors`)
        } else {
          logger.info(`[UnifiedData] Import completed: ${result.entries} entries imported`)
        }
      } catch (error) {
        logger.error('[UnifiedData] Import failed:', error)
        set(state => { state.portability.importInProgress = false })
        throw error
      }
    },

    previewImport: async (file: File): Promise<ImportPreview> => {
      return dataPortabilityManager.previewImport(file)
    },

    // ======================================================================
    // 冲突解决
    // ======================================================================

    resolveConflict: async (id: string, resolution: 'local' | 'remote' | 'merge') => {
      logger.info(`[UnifiedData] Resolving conflict for ${id}: ${resolution}`)

      set(state => {
        const entry = state.entries.find(e => e.id === id)
        if (entry) {
          entry.status = 'synced'
          entry.synced = true
          state.sync.conflicts = Math.max(0, state.sync.conflicts - 1)
        }
      })
    },

    // ======================================================================
    // UI操作
    // ======================================================================

    setActiveTab: (tab) => set(state => { state.activeTab = tab }),
    setSearchQuery: (query) => set(state => { state.searchQuery = `${query ?? ''}` }),
    toggleEntrySelection: (id) => set(state => {
      const index = state.selectedEntries.indexOf(id)
      if (index >= 0) {
        state.selectedEntries.splice(index, 1)
      } else {
        state.selectedEntries.push(id)

        // 如果包含非serializable内容可能会报错
        // 用slice()创建副本以防止immer处理Proxy对象的问题
      }
    }),
    selectAllEntries: () => set(state => {
      state.selectedEntries = state.entries.map(e => e.id)
    }),
    clearSelection: () => set(state => {
      state.selectedEntries = []
    }),
  }))
)
