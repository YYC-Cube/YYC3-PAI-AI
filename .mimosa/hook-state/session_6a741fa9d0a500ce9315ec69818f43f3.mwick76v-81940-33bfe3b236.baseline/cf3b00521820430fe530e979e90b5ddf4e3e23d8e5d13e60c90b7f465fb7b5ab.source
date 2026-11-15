/**
 * @file indexeddb-service.ts
 * @description IndexedDB 存储服务 - 大容量数据本地存储引擎
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags indexeddb,storage,local-first,large-data
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('indexeddb-service')

// ============================================================================
// 类型定义
// ============================================================================

export interface IndexedDBConfig {
  dbName: string
  dbVersion: number
  stores: StoreSchema[]
}

export interface StoreSchema {
  name: string
  keyPath: string
  indices?: IndexSchema[]
  autoIncrement?: boolean
}

export interface IndexSchema {
  name: string
  keyPath: string | string[]
  unique?: boolean
  multiEntry?: boolean
}

export interface StoreRecord<T = unknown> {
  id?: string
  data: T
  createdAt: number
  updatedAt: number
  encrypted?: boolean
  type?: string
}

export interface IDBQuery {
  index?: string
  range?: IDBKeyRange | string | number
  direction?: IDBCursorDirection
  limit?: number
  offset?: number
}

export interface IDBUsage {
  used: number
  total: number
  percentage: number
  storeCounts: Record<string, number>
}

// ============================================================================
// 默认数据库配置
// ============================================================================

const DEFAULT_CONFIG: IndexedDBConfig = {
  dbName: 'yyc3-ai-pai',
  dbVersion: 1,
  stores: [
    {
      name: 'files',
      keyPath: 'id',
      indices: [
        { name: 'by-name', keyPath: 'data.name' },
        { name: 'by-type', keyPath: 'data.type' },
        { name: 'by-created', keyPath: 'createdAt' },
        { name: 'by-updated', keyPath: 'updatedAt' },
      ],
    },
    {
      name: 'chat-history',
      keyPath: 'id',
      indices: [
        { name: 'by-created', keyPath: 'createdAt' },
        { name: 'by-updated', keyPath: 'updatedAt' },
      ],
    },
    {
      name: 'large-data',
      keyPath: 'id',
      indices: [
        { name: 'by-type', keyPath: 'type' },
        { name: 'by-updated', keyPath: 'updatedAt' },
      ],
    },
    {
      name: 'backups',
      keyPath: 'id',
      indices: [
        { name: 'by-created', keyPath: 'createdAt' },
      ],
    },
    {
      name: 'secure-store',
      keyPath: 'id',
      indices: [
        { name: 'by-type', keyPath: 'type' },
        { name: 'by-updated', keyPath: 'updatedAt' },
      ],
    },
    {
      name: 'cache',
      keyPath: 'id',
      indices: [
        { name: 'by-created', keyPath: 'createdAt' },
        { name: 'by-type', keyPath: 'type' },
      ],
    },
  ],
}

// ============================================================================
// IndexedDB 服务
// ============================================================================

export class IndexedDBService {
  private db: IDBDatabase | null = null
  private config: IndexedDBConfig
  private openPromise: Promise<IDBDatabase> | null = null
  private isInitialized = false

  constructor(config?: Partial<IndexedDBConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      stores: config?.stores || DEFAULT_CONFIG.stores,
    }
  }

  // ==========================================================================
  // 连接管理
  // ==========================================================================

  /**
   * 打开数据库连接
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db

    if (this.openPromise) return this.openPromise

    this.openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

      request.onerror = () => {
        logger.error('[IDB] Failed to open database:', request.error)
        this.openPromise = null
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        logger.info(`[IDB] Database opened: ${this.config.dbName} v${this.config.dbVersion}`)

        this.db.onversionchange = () => {
          this.db?.close()
          this.db = null
          this.isInitialized = false
        }

        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = request.result
        this.createStores(db, event)
      }
    })

    return this.openPromise
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      this.openPromise = null
      logger.info('[IDB] Database closed')
    }
  }

  /**
   * 检查是否已初始化
   */
  get ready(): boolean {
    return this.isInitialized && this.db !== null
  }

  // ==========================================================================
  // 数据操作
  // ==========================================================================

  /**
   * 存储数据
   */
  async set<T>(storeName: string, id: string, data: T, options?: { encrypted?: boolean; type?: string }): Promise<void> {
    const db = await this.open()
    const record: StoreRecord<T> = {
      id,
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      encrypted: options?.encrypted || false,
      type: options?.type,
    }

    return new Promise<void>((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      const request = store.put(record)

      request.onerror = () => {
        logger.error(`[IDB] Failed to set ${storeName}:${id}:`, request.error)
        resolve() // 不抛出，仅记录错误
      }

      request.onsuccess = () => {
        logger.debug(`[IDB] Set ${storeName}:${id}`)
        resolve()
      }
    })
  }

  /**
   * 获取数据
   */
  async get<T>(storeName: string, id: string): Promise<StoreRecord<T> | null> {
    const db = await this.open()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onerror = () => {
        logger.error(`[IDB] Failed to get ${storeName}:${id}:`, request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  }

  /**
   * 获取数据值 (直接返回 data 字段)
   */
  async getData<T>(storeName: string, id: string): Promise<T | null> {
    const record = await this.get<T>(storeName, id)
    return record?.data ?? null
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.open()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => {
        logger.error(`[IDB] Failed to delete ${storeName}:${id}:`, request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        logger.debug(`[IDB] Deleted ${storeName}:${id}`)
        resolve()
      }
    })
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string, query?: IDBQuery): Promise<StoreRecord<T>[]> {
    const db = await this.open()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)

      let source: IDBRequest | IDBIndex
      if (query?.index) {
        source = store.index(query.index)
      } else {
        source = store as unknown as IDBIndex
      }

      const range = query?.range
        ? typeof query.range === 'string' || typeof query.range === 'number'
          ? IDBKeyRange.only(query.range)
          : query.range
        : undefined

      const direction = query?.direction || 'next'
      const cursorRequest = source.openCursor(range, direction)

      const results: StoreRecord<T>[] = []
      let skipped = 0

      cursorRequest.onerror = () => {
        logger.error(`[IDB] Failed to getAll from ${storeName}:`, cursorRequest.error)
        reject(cursorRequest.error)
      }

      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result

        if (cursor) {
          if (query?.offset && skipped < query.offset) {
            skipped++
            cursor.continue()
            return
          }

          if (query?.limit && results.length >= query.limit) {
            resolve(results)
            return
          }

          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  /**
   * 计数
   */
  async count(storeName: string): Promise<number> {
    const db = await this.open()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onerror = () => {
        logger.error(`[IDB] Failed to count ${storeName}:`, request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  }

  /**
   * 清空 store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.open()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => {
        logger.error(`[IDB] Failed to clear ${storeName}:`, request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        logger.info(`[IDB] Cleared ${storeName}`)
        resolve()
      }
    })
  }

  /**
   * 批量操作
   */
  async bulkSet<T>(storeName: string, items: { id: string; data: T; type?: string }[]): Promise<void> {
    const db = await this.open()
    const now = Date.now()

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      let completed = 0
      const total = items.length

      for (const item of items) {
        const record: StoreRecord<T> = {
          id: item.id,
          data: item.data,
          createdAt: now,
          updatedAt: now,
          type: item.type,
        }

        const request = store.put(record)

        request.onerror = () => {
          logger.error(`[IDB] Bulk set failed for ${storeName}:${item.id}:`, request.error)
        }

        request.onsuccess = () => {
          completed++
          if (completed >= total) {
            logger.debug(`[IDB] Bulk set ${total} items to ${storeName}`)
            resolve()
          }
        }
      }
    })
  }

  /**
   * 批量删除
   */
  async bulkDelete(storeName: string, ids: string[]): Promise<void> {
    const db = await this.open()

    return new Promise<void>((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      let completed = 0

      for (const id of ids) {
        const request = store.delete(id)

        request.onerror = () => {
          logger.error(`[IDB] Bulk delete failed for ${storeName}:${id}:`, request.error)
        }

        request.onsuccess = () => {
          completed++
          if (completed >= ids.length) {
            resolve()
          }
        }
      }
    })
  }

  // ==========================================================================
  // 配额与使用统计
  // ==========================================================================

  /**
   * 获取存储使用情况
   */
  async getUsage(): Promise<IDBUsage> {
    const usage: IDBUsage = {
      used: 0,
      total: 0,
      percentage: 0,
      storeCounts: {},
    }

    // 获取浏览器存储估算
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        usage.used = estimate.usage || 0
        usage.total = estimate.quota || 0
        usage.percentage = usage.total > 0 ? (usage.used / usage.total) * 100 : 0
      } catch {
        // 降级处理
      }
    }

    // 获取各 store 记录数
    for (const store of this.config.stores) {
      try {
        usage.storeCounts[store.name] = await this.count(store.name)
      } catch {
        usage.storeCounts[store.name] = 0
      }
    }

    return usage
  }

  /**
   * 获取所有 store 名称
   */
  getStoreNames(): string[] {
    return this.config.stores.map(s => s.name)
  }

  // ==========================================================================
  // 数据迁移
  // ==========================================================================

  /**
   * 从 localStorage 迁移数据到 IndexedDB
   */
  async migrateFromLocalStorage(prefix: string, storeName: string = 'large-data'): Promise<number> {
    let migrated = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const data = this.tryParseJSON(value)
            await this.set(storeName, key, data, { type: 'migrated' })
            migrated++
          }
        } catch (error) {
          logger.error(`[IDB] Migration failed for ${key}:`, error)
        }
      }
    }

    logger.info(`[IDB] Migrated ${migrated} items from localStorage to ${storeName}`)
    return migrated
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  private createStores(db: IDBDatabase, _event: IDBVersionChangeEvent): void {

    for (const storeSchema of this.config.stores) {
      if (!db.objectStoreNames.contains(storeSchema.name)) {
        const store = db.createObjectStore(storeSchema.name, {
          keyPath: storeSchema.keyPath,
          autoIncrement: storeSchema.autoIncrement ?? false,
        })

        for (const index of storeSchema.indices || []) {
          store.createIndex(index.name, index.keyPath, {
            unique: index.unique || false,
            multiEntry: index.multiEntry || false,
          })
        }

        logger.info(`[IDB] Created store: ${storeSchema.name}`)
      }
    }
  }

  private tryParseJSON(value: string): unknown {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
}

// ============================================================================
// 单例
// ============================================================================

export const indexedDBService = new IndexedDBService()
