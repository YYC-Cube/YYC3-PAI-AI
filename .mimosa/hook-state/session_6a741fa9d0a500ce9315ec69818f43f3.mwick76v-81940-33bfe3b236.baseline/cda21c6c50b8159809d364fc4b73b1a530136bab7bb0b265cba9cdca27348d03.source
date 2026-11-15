/**
 * @file storage-cleaner.ts
 * @description 存储清理工具 v2.0.0 - 策略引擎（按年龄/大小/类型），IndexedDB 清理支持
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-04-07
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 */

import { indexedDBService, type StoreRecord } from '../services/indexeddb-service'
import { createLogger } from './logger'
import { StorageMonitor } from './storage-monitor'

const logger = createLogger('storage-cleaner')

// ============================================================================
// 类型定义
// ============================================================================

export type CleanPolicyType = 'age' | 'size' | 'type' | 'priority'

export type DataPriority = 'critical' | 'high' | 'normal' | 'low' | 'cache'

/** 清理策略 */
export interface CleanPolicy {
  id: string
  type: CleanPolicyType
  enabled: boolean
  maxAgeDays?: number
  maxSizeBytes?: number
  targetTypes?: string[]
  minPriority?: DataPriority
  targetStorage?: 'localStorage' | 'indexeddb' | 'both'
  keepLatest?: number
}

/** 清理结果 */
export interface CleanResult {
  cleaned: number
  freedBytes: number
  errors: string[]
  details: Array<{ key: string; size: number; reason: string }>
}

/** 清理计划 */
export interface CleanSchedule {
  intervalMs: number
  enabled: boolean
  policies: string[]
  lastRun: number | null
  nextRun: number | null
}

// ============================================================================
// 默认策略
// ============================================================================

export const DEFAULT_POLICIES: CleanPolicy[] = [
  {
    id: 'cache-expiry',
    type: 'age',
    enabled: true,
    maxAgeDays: 7,
    targetTypes: ['cache'],
    targetStorage: 'both',
  },
  {
    id: 'old-sync-records',
    type: 'age',
    enabled: true,
    maxAgeDays: 30,
    targetTypes: ['sync-records', 'activity_log'],
    keepLatest: 100,
  },
  {
    id: 'low-priority-clean',
    type: 'priority',
    enabled: true,
    minPriority: 'low',
    targetStorage: 'both',
  },
  {
    id: 'size-threshold',
    type: 'size',
    enabled: false,
    maxSizeBytes: 4 * 1024 * 1024,
    targetStorage: 'localStorage',
  },
]

// ============================================================================
// 存储清理器
// ============================================================================

export class StorageCleaner {
  private static instance: StorageCleaner
  private policies: CleanPolicy[] = [...DEFAULT_POLICIES]
  private schedule: CleanSchedule = {
    intervalMs: 300000,
    enabled: false,
    policies: DEFAULT_POLICIES.map(p => p.id),
    lastRun: null,
    nextRun: null,
  }
  private scheduleTimer: ReturnType<typeof setInterval> | null = null
  private monitor: StorageMonitor

  private constructor() {
    this.monitor = StorageMonitor.getInstance()
    this.loadPolicies()
  }

  static getInstance(): StorageCleaner {
    if (!StorageCleaner.instance) {
      StorageCleaner.instance = new StorageCleaner()
    }
    return StorageCleaner.instance
  }

  // ==========================================================================
  // 策略管理
  // ==========================================================================

  getPolicies(): CleanPolicy[] {
    return [...this.policies]
  }

  updatePolicy(policyId: string, updates: Partial<CleanPolicy>): void {
    const index = this.policies.findIndex(p => p.id === policyId)
    if (index >= 0) {
      this.policies[index] = { ...this.policies[index], ...updates }
      this.savePolicies()
      logger.info(`[StorageCleaner] Policy updated: ${policyId}`)
    }
  }

  addPolicy(policy: CleanPolicy): void {
    this.policies.push(policy)
    this.savePolicies()
    logger.info(`[StorageCleaner] Policy added: ${policy.id}`)
  }

  removePolicy(policyId: string): void {
    this.policies = this.policies.filter(p => p.id !== policyId)
    this.savePolicies()
  }

  togglePolicy(policyId: string, enabled: boolean): void {
    const policy = this.policies.find(p => p.id === policyId)
    if (policy) {
      policy.enabled = enabled
      this.savePolicies()
      logger.info(`[StorageCleaner] Policy ${policyId} ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  // ==========================================================================
  // 清理执行
  // ==========================================================================

  async runAllPolicies(dryRun: boolean = false): Promise<CleanResult> {
    const total: CleanResult = { cleaned: 0, freedBytes: 0, errors: [], details: [] }

    for (const policy of this.policies) {
      if (!policy.enabled) continue

      try {
        const result = await this.runPolicy(policy, dryRun)
        total.cleaned += result.cleaned
        total.freedBytes += result.freedBytes
        total.errors.push(...result.errors)
        total.details.push(...result.details)
      } catch (error) {
        total.errors.push(`Policy ${policy.id} failed: ${error}`)
        logger.error(`[StorageCleaner] Policy ${policy.id} failed:`, error)
      }
    }

    this.schedule.lastRun = Date.now()
    this.schedule.nextRun = Date.now() + this.schedule.intervalMs

    logger.info(
      `[StorageCleaner] All policies done: ${total.cleaned} items, ` +
      `${(total.freedBytes / 1024).toFixed(1)}KB freed` +
      (dryRun ? ' (dry run)' : '')
    )

    return total
  }

  async runPolicy(policy: CleanPolicy, dryRun: boolean = false): Promise<CleanResult> {
    const result: CleanResult = { cleaned: 0, freedBytes: 0, errors: [], details: [] }

    try {
      switch (policy.type) {
        case 'age':
          if (policy.maxAgeDays) {
            await this.cleanByAge(policy, result, dryRun)
          }
          break
        case 'size':
          if (policy.maxSizeBytes) {
            await this.cleanBySize(policy, result, dryRun)
          }
          break
        case 'type':
          if (policy.targetTypes) {
            await this.cleanByType(policy, result, dryRun)
          }
          break
        case 'priority':
          if (policy.minPriority) {
            await this.cleanByPriority(policy, result, dryRun)
          }
          break
      }
    } catch (error) {
      result.errors.push(`Policy ${policy.id} error: ${error}`)
    }

    return result
  }

  private async cleanByAge(policy: CleanPolicy, result: CleanResult, dryRun: boolean): Promise<void> {
    const cutoff = Date.now() - (policy.maxAgeDays! * 86400000)
    const targets = policy.targetStorage || 'both'

    if (targets === 'both' || targets === 'localStorage') {
      this.cleanLocalStorageByCondition(
        (_key: string, value: string) => {
          try {
            const parsed = JSON.parse(value)
            const timestamp = parsed.timestamp || parsed.updatedAt || parsed.createdAt || 0
            return timestamp > 0 && timestamp < cutoff
          } catch { return false }
        },
        `age > ${policy.maxAgeDays}d`,
        result,
        dryRun,
        policy.keepLatest,
      )
    }

    if (targets === 'both' || targets === 'indexeddb') {
      await this.cleanIndexedDBByCondition(
        (record: StoreRecord) => {
          const timestamp = record.updatedAt || record.createdAt || 0
          return timestamp > 0 && timestamp < cutoff
        },
        `age > ${policy.maxAgeDays}d`,
        result,
        dryRun,
        policy.keepLatest,
      )
    }
  }

  private async cleanBySize(policy: CleanPolicy, result: CleanResult, dryRun: boolean): Promise<void> {
    const targets = policy.targetStorage || 'localStorage'

    if (targets === 'both' || targets === 'localStorage') {
      const usage = this.monitor.getLocalStorageUsage()
      if (usage.used > policy.maxSizeBytes!) {
        const targetSize = policy.maxSizeBytes! * 0.8
        const toFree = usage.used - targetSize

        const entries: Array<{ key: string; size: number; timestamp: number }> = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('yyc3_')) {
            const value = localStorage.getItem(key) || ''
            let timestamp = 0
            try {
              const parsed = JSON.parse(value)
              timestamp = parsed.timestamp || parsed.createdAt || 0
            } catch { /* ignore */ }
            entries.push({ key, size: value.length * 2, timestamp })
          }
        }

        entries.sort((a, b) => a.timestamp - b.timestamp)

        let freed = 0
        for (const entry of entries) {
          if (freed >= toFree) break
          freed += entry.size
          result.freedBytes += entry.size
          result.details.push({ key: entry.key, size: entry.size, reason: 'size-threshold' })
          if (!dryRun) {
            localStorage.removeItem(entry.key)
          }
          result.cleaned++
        }
      }
    }
  }

  private async cleanByType(policy: CleanPolicy, result: CleanResult, dryRun: boolean): Promise<void> {
    const types = (policy.targetTypes || []).filter((t): t is string => t !== undefined)
    const targets = policy.targetStorage || 'both'

    for (const type of types) {
      if (targets === 'both' || targets === 'localStorage') {
        this.cleanLocalStorageByCondition(
          (key: string) => key.includes(type),
          `type:${type}`,
          result,
          dryRun,
        )
      }

      if (targets === 'both' || targets === 'indexeddb') {
        try {
          const records = await indexedDBService.getAll(type)
          for (const record of records) {
            const recordKey = record.id ? `${type}/${record.id}` : type
            result.details.push({ key: recordKey, size: JSON.stringify(record).length * 2, reason: `type:${type}` })
            if (!dryRun && record.id) {
              await indexedDBService.delete(type, record.id)
            }
            result.cleaned++
          }
        } catch (error) {
          logger.debug(`[StorageCleaner] No IndexedDB store for type ${type}:`, error)
        }
      }
    }
  }

  private async cleanByPriority(policy: CleanPolicy, result: CleanResult, dryRun: boolean): Promise<void> {
    const targets = policy.targetStorage || 'both'

    const lowPriorityPatterns = [
      { key: 'cache', reason: 'priority:cache' },
      { key: 'activity_log', reason: 'priority:low' },
      { key: 'query_history', reason: 'priority:low' },
      { key: 'file_store', reason: 'priority:low' },
      { key: 'temp', reason: 'priority:low' },
    ]

    if (targets === 'both' || targets === 'localStorage') {
      for (const pattern of lowPriorityPatterns) {
        this.cleanLocalStorageByCondition(
          (key: string) => key.includes(pattern.key),
          pattern.reason,
          result,
          dryRun,
        )
      }
    }

    if (targets === 'both' || targets === 'indexeddb') {
      try {
        const records = await indexedDBService.getAll('cache')
        for (const record of records) {
          const recordKey = record.id ? `cache/${record.id}` : 'cache'
          result.details.push({ key: recordKey, size: JSON.stringify(record).length * 2, reason: 'priority:cache' })
          if (!dryRun && record.id) {
            await indexedDBService.delete('cache', record.id)
          }
          result.cleaned++
        }
      } catch { /* no cache store */ }
    }
  }

  // ==========================================================================
  // 通用清理辅助
  // ==========================================================================

  private cleanLocalStorageByCondition(
    condition: (key: string, value: string) => boolean,
    reason: string,
    result: CleanResult,
    dryRun: boolean,
    keepLatest?: number,
  ): void {
    const matches: Array<{ key: string; value: string; size: number; timestamp: number }> = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('yyc3_')) {
        const value = localStorage.getItem(key) || ''
        if (condition(key, value)) {
          let timestamp = 0
          try {
            const parsed = JSON.parse(value)
            timestamp = parsed.timestamp || parsed.createdAt || 0
          } catch { /* ignore */ }
          matches.push({ key, value, size: value.length * 2, timestamp })
        }
      }
    }

    let toDelete = matches
    if (keepLatest && keepLatest > 0 && matches.length > keepLatest) {
      matches.sort((a, b) => b.timestamp - a.timestamp)
      toDelete = matches.slice(keepLatest)
    }

    for (const match of toDelete) {
      result.cleaned++
      result.freedBytes += match.size
      result.details.push({ key: match.key, size: match.size, reason })
      if (!dryRun) {
        localStorage.removeItem(match.key)
      }
    }
  }

  private async cleanIndexedDBByCondition(
    condition: (record: StoreRecord) => boolean,
    reason: string,
    result: CleanResult,
    dryRun: boolean,
    keepLatest?: number,
  ): Promise<void> {
    try {
      const storeNames = indexedDBService.getStoreNames()
      for (const storeName of storeNames) {
        const records = await indexedDBService.getAll(storeName)

        const matches = records.filter(condition)

        let toDelete = matches
        if (keepLatest && keepLatest > 0 && matches.length > keepLatest) {
          matches.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
          toDelete = matches.slice(keepLatest)
        }

        for (const record of toDelete) {
          result.cleaned++
          const size = JSON.stringify(record).length * 2
          const recordKey = record.id ? `${storeName}/${record.id}` : storeName
          result.details.push({ key: recordKey, size, reason })
          if (!dryRun && record.id) {
            await indexedDBService.delete(storeName, record.id)
          }
        }
      }
    } catch (error) {
      result.errors.push(`IndexedDB clean failed: ${error}`)
    }
  }

  // ==========================================================================
  // 调度管理
  // ==========================================================================

  startAutoClean(intervalMs?: number): void {
    if (this.scheduleTimer) {
      this.stopAutoClean()
    }

    if (intervalMs) {
      this.schedule.intervalMs = intervalMs
    }

    this.schedule.enabled = true
    this.scheduleTimer = setInterval(async () => {
      await this.runAllPolicies()
    }, this.schedule.intervalMs)

    this.schedule.nextRun = Date.now() + this.schedule.intervalMs
    logger.info(`[StorageCleaner] Auto clean started (interval: ${this.schedule.intervalMs}ms)`)
  }

  stopAutoClean(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer)
      this.scheduleTimer = null
    }
    this.schedule.enabled = false
    this.schedule.nextRun = null
    logger.info('[StorageCleaner] Auto clean stopped')
  }

  getSchedule(): CleanSchedule {
    return { ...this.schedule }
  }

  setScheduleInterval(intervalMs: number): void {
    this.schedule.intervalMs = intervalMs
    if (this.schedule.enabled) {
      this.startAutoClean(intervalMs)
    }
  }

  // ==========================================================================
  // 持久化
  // ==========================================================================

  private savePolicies(): void {
    try {
      localStorage.setItem('yyc3_cleaner_policies', JSON.stringify(this.policies))
    } catch (error) {
      logger.error('[StorageCleaner] Failed to save policies:', error)
    }
  }

  private loadPolicies(): void {
    try {
      const saved = localStorage.getItem('yyc3_cleaner_policies')
      if (saved) {
        const parsed = JSON.parse(saved) as CleanPolicy[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.policies = parsed
        }
      }
    } catch (error) {
      logger.error('[StorageCleaner] Failed to load policies:', error)
    }
  }

  destroy(): void {
    this.stopAutoClean()
    this.policies = []
    this.monitor = null!
    logger.info('[StorageCleaner] Destroyed')
  }
}

export const storageCleaner = StorageCleaner.getInstance()
