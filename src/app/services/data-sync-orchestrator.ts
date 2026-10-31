/**
 * @file data-sync-orchestrator.ts
 * @description 端到端数据同步编排器 - 协调所有存储位置的同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @updated 2026-04-08
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags sync,orchestrator,unified,data
 */

const uuidv4 = () => crypto.randomUUID()
import type { DataEntry, DataLocation, DataType } from '../store/unified-data-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('data-sync-orchestrator')

// ============================================================================
// 类型定义
// ============================================================================

export interface SyncJob {
  id: string
  type: 'full' | 'incremental' | 'single'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  totalItems: number
  processedItems: number
  startTime?: number
  endTime?: number
  errors: SyncError[]
  conflicts: SyncConflict[]
  source: DataLocation
  target: DataLocation
  entries: DataEntry[]
}

export interface SyncError {
  entryId: string
  error: string
  timestamp: number
  retryCount: number
}

export interface SyncConflict {
  id: string
  entryId: string
  type: 'content' | 'metadata' | 'delete'
  localVersion: DataEntry
  remoteVersion: DataEntry
  resolution?: 'local' | 'remote' | 'merge' | 'skip'
  resolvedAt?: number
}

export interface SyncConfig {
  autoSync: boolean
  syncInterval: number
  conflictResolution: 'local' | 'remote' | 'manual' | 'newer'
  retryAttempts: number
  retryDelay: number
  batchSize: number
  enableEncryption: boolean
  excludePatterns: string[]
}

export interface SyncEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'conflict' | 'cancel'
  jobId: string
  data?: unknown
  timestamp: number
}

export type SyncEventListener = (event: SyncEvent) => void

// ============================================================================
// 存储适配器接口
// ============================================================================

interface StorageAdapter {
  location: DataLocation
  read: (id: string) => Promise<DataEntry | null>
  write: (entry: DataEntry) => Promise<void>
  delete: (id: string) => Promise<void>
  list: (type?: DataType) => Promise<DataEntry[]>
  exists: (id: string) => Promise<boolean>
  getMetadata: (id: string) => Promise<{ size: number; lastModified: number } | null>
}

// ============================================================================
// 数据同步编排器
// ============================================================================

export class DataSyncOrchestrator {
  private config: SyncConfig
  private jobs: Map<string, SyncJob> = new Map()
  private listeners: Set<SyncEventListener> = new Set()
  private adapters: Map<DataLocation, StorageAdapter> = new Map()
  private syncTimer?: ReturnType<typeof setInterval>
  private isRunning = false

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      autoSync: false,
      syncInterval: 30000,
      conflictResolution: 'newer',
      retryAttempts: 3,
      retryDelay: 1000,
      batchSize: 10,
      enableEncryption: true,
      excludePatterns: ['*.tmp', '*.log', '.DS_Store'],
      ...config,
    }
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 注册存储适配器
   */
  registerAdapter(adapter: StorageAdapter): void {
    this.adapters.set(adapter.location, adapter)
  }

  /**
   * 启动自动同步
   */
  startAutoSync(): void {
    if (this.syncTimer) return

    this.config.autoSync = true
    this.syncTimer = setInterval(() => {
      this.syncAll().catch((err: Error) => logger.error('Auto sync failed:', err))
    }, this.config.syncInterval)
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = undefined
    }
    this.config.autoSync = false
  }

  /**
   * 同步所有数据
   */
  async syncAll(): Promise<SyncJob> {
    const jobId = uuidv4()
    const job: SyncJob = {
      id: jobId,
      type: 'full',
      status: 'pending',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      errors: [],
      conflicts: [],
      source: 'indexeddb',
      target: 'local',
      entries: [],
    }

    this.jobs.set(jobId, job)
    this.emit({ type: 'start', jobId, timestamp: Date.now() })

    // 运行闸门：批处理循环以 isRunning 判取消——历史缺陷：从未置 true，
    // 导致任何有条目的 syncAll 首批即 cancelled（同步功能实际从未执行）
    this.isRunning = true
    try {
      job.status = 'running'
      job.startTime = Date.now()

      const allEntries: DataEntry[] = []
      for (const [location, adapter] of this.adapters) {
        const entries = await adapter.list()
        allEntries.push(...entries.map(e => ({ ...e, location })))
      }

      job.totalItems = allEntries.length
      job.entries = allEntries

      for (let i = 0; i < allEntries.length; i += this.config.batchSize) {
        if (!this.isRunning) {
          job.status = 'cancelled'
          break
        }

        const batch = allEntries.slice(i, i + this.config.batchSize)
        await this.processBatch(job, batch)

        job.processedItems = Math.min(i + this.config.batchSize, allEntries.length)
        job.progress = (job.processedItems / job.totalItems) * 100

        this.emit({
          type: 'progress',
          jobId,
          data: { progress: job.progress, processed: job.processedItems, total: job.totalItems },
          timestamp: Date.now()
        })
      }

      if (job.status !== 'cancelled') {
        job.status = job.errors.length > 0 ? 'failed' : 'completed'
      }
      job.endTime = Date.now()

      this.emit({
        type: job.status === 'completed' ? 'complete' : 'error',
        jobId,
        data: { errors: job.errors, conflicts: job.conflicts },
        timestamp: Date.now()
      })

    } catch (error) {
      job.status = 'failed'
      job.endTime = Date.now()
      job.errors.push({
        entryId: 'system',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        retryCount: 0,
      })

      this.emit({ type: 'error', jobId, data: { error }, timestamp: Date.now() })
    } finally {
      this.isRunning = false
    }

    return job
  }

  /**
   * 同步单个条目
   */
  async syncEntry(entryId: string, source: DataLocation, target: DataLocation): Promise<SyncJob> {
    const jobId = uuidv4()
    const job: SyncJob = {
      id: jobId,
      type: 'single',
      status: 'pending',
      progress: 0,
      totalItems: 1,
      processedItems: 0,
      errors: [],
      conflicts: [],
      source,
      target,
      entries: [],
    }

    this.jobs.set(jobId, job)
    this.emit({ type: 'start', jobId, timestamp: Date.now() })

    try {
      job.status = 'running'
      job.startTime = Date.now()
      // 运行闸门（同 syncAll：循环取消判定依赖 isRunning）
      this.isRunning = true

      const sourceAdapter = this.adapters.get(source)
      const targetAdapter = this.adapters.get(target)

      if (!sourceAdapter || !targetAdapter) {
        throw new Error(`Adapter not found for ${!sourceAdapter ? source : target}`)
      }

      const entry = await sourceAdapter.read(entryId)
      if (!entry) {
        throw new Error(`Entry not found: ${entryId}`)
      }

      job.entries = [entry]

      const existingEntry = await targetAdapter.read(entryId)
      if (existingEntry) {
        const conflict = await this.detectConflict(entry, existingEntry)
        if (conflict) {
          job.conflicts.push(conflict)
          this.emit({ type: 'conflict', jobId, data: { conflict }, timestamp: Date.now() })

          const resolution = await this.resolveConflict(conflict)
          if (resolution === 'skip') {
            job.processedItems = 1
            job.progress = 100
            job.status = 'completed'
            job.endTime = Date.now()
            return job
          }
        }
      }

      await this.retryOperation(() => targetAdapter.write(entry))

      job.processedItems = 1
      job.progress = 100
      job.status = 'completed'
      job.endTime = Date.now()

      this.emit({ type: 'complete', jobId, timestamp: Date.now() })

    } catch (error) {
      job.status = 'failed'
      job.endTime = Date.now()
      job.errors.push({
        entryId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        retryCount: 0,
      })

      this.emit({ type: 'error', jobId, data: { error }, timestamp: Date.now() })
    } finally {
      this.isRunning = false
    }

    return job
  }

  /**
   * 解决冲突
   */
  async resolveConflict(conflict: SyncConflict, resolution?: 'local' | 'remote' | 'merge' | 'skip'): Promise<'local' | 'remote' | 'merge' | 'skip'> {
    if (resolution) {
      conflict.resolution = resolution
      conflict.resolvedAt = Date.now()
      return resolution
    }

    switch (this.config.conflictResolution) {
      case 'local':
        conflict.resolution = 'local'
        break
      case 'remote':
        conflict.resolution = 'remote'
        break
      case 'newer':
        conflict.resolution = conflict.localVersion.lastModified > conflict.remoteVersion.lastModified ? 'local' : 'remote'
        break
      case 'manual':
        conflict.resolution = 'skip'
        break
    }

    conflict.resolvedAt = Date.now()
    return conflict.resolution
  }

  /**
   * 获取同步任务
   */
  getJob(jobId: string): SyncJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * 获取所有同步任务
   */
  getAllJobs(): SyncJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * 取消同步任务
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (job && job.status === 'running') {
      job.status = 'cancelled'
      job.endTime = Date.now()
      this.emit({ type: 'cancel', jobId, timestamp: Date.now() })
      return true
    }
    return false
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: SyncEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.autoSync !== undefined) {
      if (config.autoSync) {
        this.startAutoSync()
      } else {
        this.stopAutoSync()
      }
    }

    if (config.syncInterval !== undefined && this.syncTimer) {
      this.stopAutoSync()
      this.startAutoSync()
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): SyncConfig {
    return { ...this.config }
  }

  /**
   * 清理已完成的任务
   */
  cleanupJobs(maxAge = 3600000): void {
    const now = Date.now()
    for (const [id, job] of this.jobs) {
      if (job.endTime && now - job.endTime > maxAge) {
        this.jobs.delete(id)
      }
    }
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  private async processBatch(job: SyncJob, batch: DataEntry[]): Promise<void> {
    for (const entry of batch) {
      if (!this.isRunning) break

      if (this.shouldExclude(entry)) {
        continue
      }

      try {
        for (const [targetLocation, targetAdapter] of this.adapters) {
          if (targetLocation === entry.location) continue

          const existingEntry = await targetAdapter.read(entry.id)
          if (existingEntry) {
            const conflict = await this.detectConflict(entry, existingEntry)
            if (conflict) {
              job.conflicts.push(conflict)
              this.emit({ type: 'conflict', jobId: job.id, data: { conflict }, timestamp: Date.now() })

              const resolution = await this.resolveConflict(conflict)
              if (resolution === 'skip') continue
              if (resolution === 'remote') continue
            }
          }

          await this.retryOperation(() => targetAdapter.write({ ...entry, location: targetLocation }))
        }
      } catch (error) {
        job.errors.push({
          entryId: entry.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          retryCount: 0,
        })
      }
    }
  }

  private async detectConflict(local: DataEntry, remote: DataEntry): Promise<SyncConflict | null> {
    if (local.lastModified === remote.lastModified && local.size === remote.size) {
      return null
    }

    const conflict: SyncConflict = {
      id: uuidv4(),
      entryId: local.id,
      type: 'content',
      localVersion: local,
      remoteVersion: remote,
    }

    if (local.encrypted !== remote.encrypted) {
      conflict.type = 'metadata'
    }

    return conflict
  }

  private shouldExclude(entry: DataEntry): boolean {
    const path = entry.path || entry.id
    return this.config.excludePatterns.some(pattern => {
      if (pattern.startsWith('*.')) {
        return path.endsWith(pattern.slice(1))
      }
      return path.includes(pattern)
    })
  }

  private async retryOperation<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retryCount < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)))
        return this.retryOperation(operation, retryCount + 1)
      }
      throw error
    }
  }

  private emit(event: SyncEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        logger.error('Sync event listener error:', error)
      }
    }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

export const dataSyncOrchestrator = new DataSyncOrchestrator({
  autoSync: false,
  syncInterval: 60000,
  conflictResolution: 'newer',
  retryAttempts: 3,
  retryDelay: 1000,
  batchSize: 20,
  enableEncryption: true,
  excludePatterns: ['*.tmp', '*.log', '.DS_Store', 'node_modules'],
})
