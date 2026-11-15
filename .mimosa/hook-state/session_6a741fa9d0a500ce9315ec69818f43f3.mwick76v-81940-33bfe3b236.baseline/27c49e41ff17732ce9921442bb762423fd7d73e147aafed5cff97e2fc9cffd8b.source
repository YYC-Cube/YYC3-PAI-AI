/**
 * @file sync-engine.ts
 * @description 同步引擎核心 v2.0.0 - 实现双向同步、冲突检测、智能合并和远程后端
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-04-08
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'
import { getFileSystemWatcher, type FileChangeEvent } from './file-system-watcher'
import { indexedDBService } from './indexeddb-service'
import type { BackendConnectionConfig, BackendType, SyncDirection } from './sync-backend-adapter'
import { BackendManager } from './sync-backend-adapter'

const logger = createLogger('sync-engine')

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error'
export type ConflictResolution = 'local-win' | 'remote-win' | 'manual'

export interface SyncItem {
  id: string
  path: string
  type: 'create' | 'modify' | 'delete'
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict'
  localVersion: number
  remoteVersion?: number
  timestamp: number
  error?: string
  size?: number
}

export interface SyncConflict {
  id: string
  path: string
  localContent?: string
  remoteContent?: string
  localModified: number
  remoteModified: number
  resolution?: ConflictResolution
  resolvedBy?: string
}

export interface SyncResult {
  success: boolean
  syncedItems: number
  conflictedItems: number
  failedItems: number
  durationMs: number
  errors: string[]
}

export interface SyncEngineOptions {
  autoSync?: boolean
  syncIntervalMs?: number
  conflictStrategy?: ConflictResolution
  maxConcurrentSyncs?: number
  onStatusChange?: (status: SyncStatus) => void
  onProgress?: (progress: { current: number; total: number; item: SyncItem }) => void
  onComplete?: (result: SyncResult) => void
  onConflict?: (conflict: SyncConflict) => void
  // v2.0.0: 远程后端配置
  backendType?: BackendType
  backendConfig?: BackendConnectionConfig
  syncDirection?: SyncDirection
}

interface SyncState {
  status: SyncStatus
  queue: SyncItem[]
  conflicts: Map<string, SyncConflict>
  history: SyncResult[]
  lastSyncTime: number | null
  isAutoSyncEnabled: boolean
}

const DEFAULT_OPTIONS: Required<Omit<SyncEngineOptions, 'onStatusChange' | 'onProgress' | 'onComplete' | 'onConflict'>> = {
  autoSync: false,
  syncIntervalMs: 30000,
  conflictStrategy: 'local-win',
  maxConcurrentSyncs: 3,
  backendType: 'none' as BackendType,
  backendConfig: {} as BackendConnectionConfig,
  syncDirection: 'bidirectional' as SyncDirection,
}

class SyncEngine {
  private state: SyncState = {
    status: 'idle',
    queue: [],
    conflicts: new Map(),
    history: [],
    lastSyncTime: null,
    isAutoSyncEnabled: false,
  }

  private options: SyncEngineOptions & {
    autoSync: boolean
    syncIntervalMs: number
    conflictStrategy: ConflictResolution
    maxConcurrentSyncs: number
  }
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null
  private fileWatcher: ReturnType<typeof getFileSystemWatcher> | null = null
  private abortController: AbortController | null = null
  private backendManager: BackendManager

  constructor(options: SyncEngineOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.backendManager = BackendManager.getInstance()

    // 如果提供了后端配置，自动连接
    if (this.options.backendType && this.options.backendType !== 'none' && this.options.backendConfig) {
      this.backendManager.setActiveBackend(this.options.backendType, this.options.backendConfig)
      if (this.options.syncDirection) {
        this.backendManager.setSyncDirection(this.options.syncDirection)
      }
    }

    this.initializeFileWatcher()
  }

  private initializeFileWatcher(): void {
    this.fileWatcher = getFileSystemWatcher({
      debounceMs: 500,
      onChange: (events) => this.handleFileChanges(events),
    })
  }

  private handleFileChanges(events: FileChangeEvent[]): void {
    if (this.state.status === 'syncing') {
      logger.debug('Queueing file changes during active sync')
    }

    for (const event of events) {
      const syncItem: SyncItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        path: event.path,
        type: event.type === 'rename' ? 'modify' : event.type,
        status: 'pending',
        localVersion: Date.now(),
        timestamp: event.timestamp,
        size: event.size,
      }

      this.addToQueue(syncItem)
    }

    if (this.options.autoSync && this.state.status === 'idle') {
      this.startSync()
    }
  }

  private addToQueue(item: SyncItem): void {
    const existingIndex = this.state.queue.findIndex(i => i.path === item.path)

    if (existingIndex >= 0) {
      const existing = this.state.queue[existingIndex]
      if (item.type === 'delete') {
        this.state.queue[existingIndex] = item
      } else {
        existing.type = item.type
        existing.localVersion = item.localVersion
        existing.timestamp = item.timestamp
        existing.size = item.size
        // 历史缺陷：终态项（completed/failed）更新字段后不复位 pending——
        // startSync 只取 pending，首次同步后同路径的新变更被静默丢弃
        if (existing.status === 'completed' || existing.status === 'failed') {
          existing.status = 'pending'
          existing.error = undefined
        }
      }
    } else {
      this.state.queue.push(item)
    }

    logger.debug(`Added to sync queue: ${item.path} (${item.type})`)
  }

  async startSync(): Promise<SyncResult> {
    if (this.state.status === 'syncing') {
      logger.warn('Sync already in progress')
      return this.createEmptyResult()
    }

    this.setStatus('syncing')
    this.abortController = new AbortController()

    const startTime = performance.now()
    const pendingItems = this.state.queue.filter(i => i.status === 'pending')

    if (pendingItems.length === 0) {
      logger.info('No items to sync')
      this.setStatus('idle')
      this.state.lastSyncTime = Date.now()
      return this.createEmptyResult()
    }

    logger.info(`Starting sync of ${pendingItems.length} items`)

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      conflictedItems: 0,
      failedItems: 0,
      durationMs: 0,
      errors: [],
    }

    for (let i = 0; i < pendingItems.length; i++) {
      if (this.abortController.signal.aborted) {
        logger.info('Sync aborted')
        break
      }

      const item = pendingItems[i]
      item.status = 'syncing'

      if (this.options.onProgress) {
        this.options.onProgress({ current: i + 1, total: pendingItems.length, item })
      }

      try {
        const syncResult = await this.syncItem(item)

        switch (syncResult) {
          case 'completed':
            result.syncedItems++
            break
          case 'conflict':
            result.conflictedItems++
            break
          case 'failed':
            result.failedItems++
            break
        }
      } catch (error) {
        item.status = 'failed'
        item.error = (error as Error).message
        result.failedItems++
        result.errors.push(`${item.path}: ${(error as Error).message}`)
        logger.error(`Failed to sync ${item.path}`, error as Error)
      }
    }

    // v2.0.0: 如果是双向同步或拉取模式，从远程获取变更
    const direction = this.options.syncDirection || 'bidirectional'
    if ((direction === 'bidirectional' || direction === 'pull') && this.backendManager.getActiveType() !== 'none') {
      try {
        const remoteFiles = await this.backendManager.getActive().list()
        const pullResults = await this.pullFromRemote(remoteFiles)
        result.syncedItems += pullResults.pulled
        result.conflictedItems += pullResults.conflicts
        result.errors.push(...pullResults.errors)
      } catch (error) {
        logger.error('[SyncEngine] Failed to pull from remote:', error)
        result.errors.push(`Pull failed: ${(error as Error).message}`)
      }
    }

    result.durationMs = Math.round(performance.now() - startTime)
    this.state.lastSyncTime = Date.now()

    if (this.backendManager.getActiveType() !== 'none') {
      this.backendManager.updateLastSyncTime()
    }

    this.state.history.unshift(result)
    if (this.state.history.length > 50) {
      this.state.history = this.state.history.slice(0, 50)
    }

    if (result.failedItems > 0 || result.conflictedItems > 0) {
      this.setStatus(result.conflictedItems > 0 ? 'conflict' : 'error')
      result.success = false
    } else {
      this.setStatus('idle')
    }

    if (this.options.onComplete) {
      this.options.onComplete(result)
    }

    logger.info(
      `Sync completed: ${result.syncedItems} synced, ` +
      `${result.conflictedItems} conflicts, ${result.failedItems} failures`
    )

    return result
  }

  private async syncItem(item: SyncItem): Promise<'completed' | 'conflict' | 'failed'> {
    const hasConflict = await this.detectConflict(item)

    if (hasConflict) {
      const conflict = await this.createConflict(item)
      item.status = 'conflict'

      if (this.options.onConflict) {
        this.options.onConflict(conflict)
      }

      const resolution = await this.resolveConflict(conflict)
      if (resolution === 'manual') {
        return 'conflict'
      }

      await this.applyResolution(item, resolution)
    } else {
      await this.uploadItem(item)
    }

    item.status = 'completed'
    return 'completed'
  }

  private async detectConflict(item: SyncItem): Promise<boolean> {
    if (item.type === 'create') return false

    if (item.remoteVersion !== undefined && item.localVersion !== item.remoteVersion) {
      logger.warn(`Version mismatch for ${item.path}: local=${item.localVersion}, remote=${item.remoteVersion}`)
      return true
    }

    const existingConflict = this.state.conflicts.get(item.path)
    if (existingConflict && !existingConflict.resolution) {
      logger.warn(`Unresolved conflict exists for ${item.path}`)
      return true
    }

    return false
  }

  private async createConflict(item: SyncItem): Promise<SyncConflict> {
    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}`,
      path: item.path,
      localModified: item.localVersion,
      remoteModified: Date.now(),
    }

    this.state.conflicts.set(item.path, conflict)
    return conflict
  }

  private async resolveConflict(conflict: SyncConflict): Promise<ConflictResolution> {
    if (this.options.conflictStrategy !== 'manual') {
      conflict.resolution = this.options.conflictStrategy
      conflict.resolvedBy = 'auto'
      return this.options.conflictStrategy
    }

    return 'manual'
  }

  private async applyResolution(item: SyncItem, resolution: ConflictResolution): Promise<void> {
    logger.info(`Applying resolution: ${resolution} for ${item.path}`)

    try {
      // 根据冲突解决策略选择保留哪个版本
      if (resolution === 'local-win') {
        // 上传本地版本覆盖远程
        await this.uploadToBackend(item)
      } else if (resolution === 'remote-win') {
        // 下载远程版本覆盖本地
        const payload = await this.backendManager.getActive().download(item.path)
        if (payload) {
          await this.writeToLocal(item.path, payload.data)
        }
      }

      // 标记冲突已解决
      const conflict = this.state.conflicts.get(item.path)
      if (conflict) {
        conflict.resolution = resolution
        conflict.resolvedBy = 'system'
      }
    } catch (error) {
      logger.error(`Failed to apply resolution for ${item.path}:`, error)
      throw error
    }
  }

  private async uploadToBackend(item: SyncItem): Promise<void> {
    const data = await this.readFromLocal(item.path)
    if (data === null) {
      logger.warn(`No local data found for ${item.path}, skipping upload`)
      return
    }

    const checksum = await this.calculateChecksum(data)
    await this.backendManager.getActive().upload({
      path: item.path,
      data,
      checksum,
      timestamp: item.localVersion,
    })
  }

  private async uploadItem(item: SyncItem): Promise<void> {
    await this.uploadToBackend(item)
    item.status = 'completed'
  }

  /**
   * 从远程拉取变更并与本地合并
   */
  private async pullFromRemote(remoteFiles: import('./sync-backend-adapter').RemoteFileInfo[]): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
    const result = { pulled: 0, conflicts: 0, errors: [] as string[] }

    for (const remoteFile of remoteFiles) {
      try {
        // 检查本地是否已有此文件
        const localData = await this.readFromLocal(remoteFile.path)

        if (localData === null) {
          // 本地没有，直接下载远程版本
          const payload = await this.backendManager.getActive().download(remoteFile.path)
          if (payload) {
            await this.writeToLocal(remoteFile.path, payload.data)
            result.pulled++
          }
        } else {
          // 本地已有，检查是否存在冲突
          const localChecksum = await this.calculateChecksum(localData)
          const item: SyncItem = {
            id: `pull_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            path: remoteFile.path,
            type: 'modify',
            status: 'pending',
            localVersion: Date.now(),
            remoteVersion: remoteFile.lastModified,
            timestamp: Date.now(),
            size: remoteFile.size,
          }

          const hasConflict = localChecksum !== remoteFile.checksum && localChecksum !== ''
          if (hasConflict) {
            const conflict = await this.createConflict(item)
            if (this.options.onConflict) {
              this.options.onConflict(conflict)
            }
            result.conflicts++
          }
        }
      } catch (error) {
        result.errors.push(`Failed to pull ${remoteFile.path}: ${(error as Error).message}`)
      }
    }

    return result
  }

  /**
   * 从本地存储读取数据
   */
  private async readFromLocal(path: string): Promise<string | null> {
    // 先尝试 localStorage
    const lsValue = localStorage.getItem(path)
    if (lsValue !== null) return lsValue

    // 再尝试 IndexedDB
    try {
      const record = await indexedDBService.get('large-data', path)
      if (record?.data) {
        return typeof record.data === 'string' ? record.data : JSON.stringify(record.data)
      }
    } catch {
      // Ignore IndexedDB errors
    }

    return null
  }

  /**
   * 写入数据到本地存储
   */
  private async writeToLocal(path: string, data: string): Promise<void> {
    try {
      // 判断数据大小决定存储位置
      const size = new Blob([data]).size
      if (size < 100 * 1024) { // < 100KB -> localStorage
        localStorage.setItem(path, data)
      } else {
        // >= 100KB -> IndexedDB
        await indexedDBService.set('large-data', path, data, { type: 'sync-data' })
      }
    } catch (error) {
      logger.error(`Failed to write to local storage: ${path}`, error)
      throw error
    }
  }

  /**
   * 计算数据校验和
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const buffer = encoder.encode(data)
    const hash = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hash))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // ==========================================================================
  // v2.0.0: 后端配置管理
  // ==========================================================================

  /**
   * 配置并连接远程同步后端
   */
  async configureBackend(type: BackendType, config: BackendConnectionConfig): Promise<boolean> {
    const connected = await this.backendManager.setActiveBackend(type, config)
    if (connected) {
      this.options.backendType = type
      this.options.backendConfig = config
      logger.info(`[SyncEngine] Backend configured: ${type}`)
    }
    return connected
  }

  /** 断开后端连接 */
  async disconnectBackend(): Promise<void> {
    await this.backendManager.getActive().disconnect()
    this.options.backendType = 'none'
    logger.info('[SyncEngine] Backend disconnected')
  }

  /** 获取当前后端状态 */
  getBackendStatus() {
    return {
      type: this.backendManager.getActiveType(),
      status: this.backendManager.getActive().status,
    }
  }

  /** 获取后端管理器（用于 UI 展示配置） */
  getBackendManager(): BackendManager {
    return this.backendManager
  }

  /** 设置同步方向 */
  setSyncDirection(direction: SyncDirection): void {
    this.backendManager.setSyncDirection(direction)
    this.options.syncDirection = direction
  }

  /** 获取同步方向 */
  getSyncDirection(): SyncDirection {
    return this.options.syncDirection || 'bidirectional'
  }

  /** 健康检查当前后端 */
  async healthCheckBackend() {
    return this.backendManager.getActive().healthCheck()
  }

  setStatus(status: SyncStatus): void {
    this.state.status = status
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status)
    }
  }

  getStatus(): SyncStatus {
    return this.state.status
  }

  getQueue(): SyncItem[] {
    return [...this.state.queue]
  }

  getConflicts(): SyncConflict[] {
    return Array.from(this.state.conflicts.values())
  }

  getHistory(): SyncResult[] {
    return [...this.state.history]
  }

  getLastSyncTime(): number | null {
    return this.state.lastSyncTime
  }

  resolveConflictManually(conflictId: string, resolution: ConflictResolution, resolvedBy?: string): void {
    const conflict = Array.from(this.state.conflicts.values()).find(c => c.id === conflictId)
    if (!conflict) return

    conflict.resolution = resolution
    conflict.resolvedBy = resolvedBy || 'user'

    logger.info(`Conflict resolved manually: ${conflict.path} -> ${resolution}`)
  }

  retryFailedItems(): void {
    const failedItems = this.state.queue.filter(i => i.status === 'failed')
    failedItems.forEach(item => {
      item.status = 'pending'
      item.error = undefined
    })

    logger.info(`Retrying ${failedItems.length} failed items`)
  }

  clearCompletedItems(): void {
    this.state.queue = this.state.queue.filter(i =>
      i.status !== 'completed'
    )
    logger.info('Cleared completed items from queue')
  }

  removeFromQueue(itemId: string): void {
    this.state.queue = this.state.queue.filter(i => i.id !== itemId)
  }

  enableAutoSync(): void {
    this.options.autoSync = true
    this.state.isAutoSyncEnabled = true

    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
    }

    this.autoSyncTimer = setInterval(() => {
      if (this.state.status === 'idle' && this.state.queue.some(i => i.status === 'pending')) {
        this.startSync()
      }
    }, this.options.syncIntervalMs)

    logger.info(`Auto-sync enabled (interval: ${this.options.syncIntervalMs}ms)`)
  }

  disableAutoSync(): void {
    this.options.autoSync = false
    this.state.isAutoSyncEnabled = false

    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
      this.autoSyncTimer = null
    }

    logger.info('Auto-sync disabled')
  }

  isAutoSyncEnabled(): boolean {
    return this.state.isAutoSyncEnabled
  }

  abortSync(): void {
    if (this.abortController) {
      this.abortController.abort()
      logger.info('Sync aborted by user')
    }
  }

  watchPath(path: string): Promise<void> {
    if (this.fileWatcher) {
      return this.fileWatcher.watchPath(path)
    }
    return Promise.resolve()
  }

  unwatchPath(path: string): void {
    if (this.fileWatcher) {
      this.fileWatcher.unwatchPath(path)
    }
  }

  getStats(): {
    queueLength: number
    pendingCount: number
    syncingCount: number
    completedCount: number
    failedCount: number
    conflictCount: number
    lastSyncAgo: number | null
  } {
    return {
      queueLength: this.state.queue.length,
      pendingCount: this.state.queue.filter(i => i.status === 'pending').length,
      syncingCount: this.state.queue.filter(i => i.status === 'syncing').length,
      completedCount: this.state.queue.filter(i => i.status === 'completed').length,
      failedCount: this.state.queue.filter(i => i.status === 'failed').length,
      conflictCount: this.state.conflicts.size,
      lastSyncAgo: this.state.lastSyncTime ? Date.now() - this.state.lastSyncTime : null,
    }
  }

  private createEmptyResult(): SyncResult {
    return {
      success: true,
      syncedItems: 0,
      conflictedItems: 0,
      failedItems: 0,
      durationMs: 0,
      errors: [],
    }
  }

  destroy(): void {
    this.abortSync()
    this.disableAutoSync()

    if (this.fileWatcher) {
      this.fileWatcher.destroy()
      this.fileWatcher = null
    }

    this.state.queue = []
    this.state.conflicts.clear()
    this.state.history = []
    this.state.lastSyncTime = null

    logger.info('Sync engine destroyed')
  }
}

let instance: SyncEngine | null = null

export function getSyncEngine(options?: SyncEngineOptions): SyncEngine {
  if (!instance) {
    instance = new SyncEngine(options)
  }
  return instance
}

export function destroySyncEngine(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}

export default SyncEngine
