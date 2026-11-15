/**
 * @file storage-monitor.ts
 * @description 存储监控和管理工具 v2.0.0 - 统一配额监控，集成 IndexedDB 服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-04-07
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 */

import { indexedDBService } from '../services/indexeddb-service'
import { createLogger } from './logger'

const logger = createLogger('storage-monitor')

export type StorageType = 'localStorage' | 'indexedDB' | 'memoryCache'
export type AlertLevel = 'warning' | 'critical'

export interface StorageUsage {
  used: number
  total: number
  percentage: number
  items: number
}

export interface StorageAlert {
  type: StorageType
  level: AlertLevel
  message: string
  usage: StorageUsage
  timestamp: number
}

export interface StorageStats {
  localStorage: StorageUsage
  indexedDB: StorageUsage
  memoryCache: StorageUsage
  totalUsed: number
  totalAvailable: number
}

type AlertCallback = (alert: StorageAlert) => void

export class StorageMonitor {
  private static instance: StorageMonitor
  private alertCallbacks: Set<AlertCallback> = new Set()
  private thresholds: Map<StorageType, number> = new Map()
  private monitoringInterval: ReturnType<typeof setInterval> | null = null
  private memoryCacheSize: number = 0
  private memoryCacheItems: number = 0

  private constructor() {
    this.thresholds.set('localStorage', 0.8)
    this.thresholds.set('indexedDB', 0.8)
    this.thresholds.set('memoryCache', 0.9)
  }

  static getInstance(): StorageMonitor {
    if (!StorageMonitor.instance) {
      StorageMonitor.instance = new StorageMonitor()
    }
    return StorageMonitor.instance
  }

  getLocalStorageUsage(): StorageUsage {
    let used = 0
    let items = 0

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          used += key.length + value.length
          items++
        }
      }
      used *= 2
    } catch (error) {
      logger.error('[StorageMonitor] Failed to get localStorage usage', error)
    }

    const total = 5 * 1024 * 1024
    return {
      used,
      total,
      percentage: (used / total) * 100,
      items,
    }
  }

  async getIndexedDBUsage(): Promise<StorageUsage> {
    try {
      const storeNames = indexedDBService.getStoreNames()
      let totalItems = 0

      for (const storeName of storeNames) {
        try {
          const records = await indexedDBService.getAll(storeName)
          totalItems += records.length
        } catch {
          // store might not exist yet
        }
      }

      // 估算: 每条记录平均 ~2KB
      const estimatedBytes = totalItems * 2048
      return {
        used: estimatedBytes,
        total: 500 * 1024 * 1024,
        percentage: (estimatedBytes / (500 * 1024 * 1024)) * 100,
        items: totalItems,
      }
    } catch (error) {
      logger.error('[StorageMonitor] Failed to get IndexedDB usage', error)
      return { used: 0, total: 500 * 1024 * 1024, percentage: 0, items: 0 }
    }
  }

  getMemoryCacheUsage(): StorageUsage {
    const total = 100 * 1024 * 1024
    return {
      used: this.memoryCacheSize,
      total,
      percentage: (this.memoryCacheSize / total) * 100,
      items: this.memoryCacheItems,
    }
  }

  updateMemoryCacheStats(size: number, items: number): void {
    this.memoryCacheSize = size
    this.memoryCacheItems = items
  }

  async getStats(): Promise<StorageStats> {
    const localStorage = this.getLocalStorageUsage()
    const indexedDB = await this.getIndexedDBUsage()
    const memoryCache = this.getMemoryCacheUsage()

    return {
      localStorage,
      indexedDB,
      memoryCache,
      totalUsed: localStorage.used + indexedDB.used + memoryCache.used,
      totalAvailable: localStorage.total + indexedDB.total + memoryCache.total,
    }
  }

  setAlertThreshold(type: StorageType, threshold: number): void {
    this.thresholds.set(type, threshold)
    logger.info(`[StorageMonitor] Set alert threshold for ${type}: ${(threshold * 100).toFixed(0)}%`)
  }

  onAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback)
    return () => {
      this.alertCallbacks.delete(callback)
    }
  }

  private emitAlert(alert: StorageAlert): void {
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert)
      } catch (error) {
        logger.error('[StorageMonitor] Alert callback error', error)
      }
    })
  }

  private async checkThresholds(): Promise<void> {
    const stats = await this.getStats()

    if (stats.localStorage.percentage / 100 > (this.thresholds.get('localStorage') || 0.8)) {
      this.emitAlert({
        type: 'localStorage',
        level: stats.localStorage.percentage > 90 ? 'critical' : 'warning',
        message: `localStorage usage is ${stats.localStorage.percentage.toFixed(1)}%`,
        usage: stats.localStorage,
        timestamp: Date.now(),
      })
    }

    if (stats.indexedDB.percentage / 100 > (this.thresholds.get('indexedDB') || 0.8)) {
      this.emitAlert({
        type: 'indexedDB',
        level: stats.indexedDB.percentage > 90 ? 'critical' : 'warning',
        message: `IndexedDB usage is ${stats.indexedDB.percentage.toFixed(1)}%`,
        usage: stats.indexedDB,
        timestamp: Date.now(),
      })
    }

    if (stats.memoryCache.percentage / 100 > (this.thresholds.get('memoryCache') || 0.9)) {
      this.emitAlert({
        type: 'memoryCache',
        level: stats.memoryCache.percentage > 95 ? 'critical' : 'warning',
        message: `Memory cache usage is ${stats.memoryCache.percentage.toFixed(1)}%`,
        usage: stats.memoryCache,
        timestamp: Date.now(),
      })
    }
  }

  startMonitoring(interval: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring()
    }

    this.checkThresholds()

    this.monitoringInterval = setInterval(() => {
      this.checkThresholds()
    }, interval)

    logger.info(`[StorageMonitor] Started monitoring with ${interval}ms interval`)
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('[StorageMonitor] Stopped monitoring')
    }
  }
}

export const storageMonitor = StorageMonitor.getInstance()
