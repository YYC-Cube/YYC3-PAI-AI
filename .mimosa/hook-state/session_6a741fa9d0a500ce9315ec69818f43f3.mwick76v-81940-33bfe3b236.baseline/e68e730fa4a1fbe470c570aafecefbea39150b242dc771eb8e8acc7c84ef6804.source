/**
 * file: indexed-db.ts
 * description: indexed-db module
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-01
 * updated: 2026-04-01
 * status: active
 * tags: [util],[storage]
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('indexed-db')

// ============================================================
// 类型定义
// ============================================================

export type StoreName = string;

export interface DBConfig {
  /** 数据库名称 */
  name: string;
  /** 数据库版本 */
  version: number;
  /** 存储定义 */
  stores: StoreDefinition[];
}

export interface StoreDefinition {
  /** 存储名称 */
  name: string;
  /** 主键路径 */
  keyPath?: string;
  /** 是否自增 */
  autoIncrement?: boolean;
}

export interface IDBConfig {
  /** 数据库名称 */
  name: string;
  /** 数据库版本 */
  version: number;
}

// ============================================================
// IndexedDB 封装类
// ============================================================

export class IndexedDB {
  private config: DBConfig;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor(config: DBConfig) {
    this.config = config;
  }

  /**
   * 初始化数据库
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        // 创建存储
        for (const storeDef of this.config.stores) {
          if (!database.objectStoreNames.contains(storeDef.name)) {
            database.createObjectStore(storeDef.name, {
              keyPath: storeDef.keyPath || 'id',
              autoIncrement: storeDef.autoIncrement || false,
            });
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 获取数据库实例
   */
  async getDatabase(): Promise<IDBDatabase> {
    return this.init();
  }

  /**
   * 向指定存储添加或更新数据
   */
  async put<T extends { id: string }>(
    storeName: StoreName,
    data: T
  ): Promise<void> {
    try {
      const database = await this.getDatabase();
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(data);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      logger.error(`IndexedDB put error (${storeName}):`, error);
      throw error;
    }
  }

  /**
   * 从指定存储获取单条数据
   */
  async get<T>(storeName: StoreName, key: string): Promise<T | undefined> {
    try {
      const database = await this.getDatabase();
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error(`IndexedDB get error (${storeName}):`, error);
      throw error;
    }
  }

  /**
   * 从指定存储获取所有数据
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const database = await this.getDatabase();
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error(`IndexedDB getAll error (${storeName}):`, error);
      throw error;
    }
  }

  /**
   * 删除指定存储中的单条数据
   */
  async delete(storeName: StoreName, key: string): Promise<void> {
    try {
      const database = await this.getDatabase();
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(key);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      logger.error(`IndexedDB delete error (${storeName}):`, error);
      throw error;
    }
  }

  /**
   * 清除指定存储的所有数据
   */
  async clear(storeName: StoreName): Promise<void> {
    try {
      const database = await this.getDatabase();
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      logger.error(`IndexedDB clear error (${storeName}):`, error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// ============================================================
// 快捷函数
// ============================================================

/**
 * 创建IndexedDB实例
 */
export function createIndexedDB(config: DBConfig): IndexedDB {
  return new IndexedDB(config);
}

/**
 * 简化的IndexedDB操作（使用默认配置）
 */
export class SimpleIndexedDB extends IndexedDB {
  constructor(name: string, stores: StoreName[], version = 1) {
    super({
      name,
      version,
      stores: stores.map((s) => ({ name: s })),
    });
  }
}
