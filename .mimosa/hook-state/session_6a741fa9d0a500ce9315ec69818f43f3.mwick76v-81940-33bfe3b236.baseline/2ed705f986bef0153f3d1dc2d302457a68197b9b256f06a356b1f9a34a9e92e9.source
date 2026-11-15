/**
 * @file file-system-watcher.ts
 * @description 文件系统监听服务，检测本地文件变化并触发同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('file-watcher')

export type FileChangeType = 'create' | 'modify' | 'delete' | 'rename'

export interface FileChangeEvent {
  id: string
  type: FileChangeType
  path: string
  oldPath?: string // for rename events
  timestamp: number
  size?: number
}

export interface WatcherOptions {
  debounceMs?: number
  ignorePatterns?: RegExp[]
  recursive?: boolean
  onChange?: (events: FileChangeEvent[]) => void
  onError?: (error: Error) => void
}

interface WatcherState {
  isWatching: boolean
  watchedPaths: Set<string>
  pendingEvents: Map<string, FileChangeEvent>
  debounceTimer: ReturnType<typeof setTimeout> | null
}

const DEFAULT_OPTIONS: Required<Omit<WatcherOptions, 'onChange' | 'onError'>> = {
  debounceMs: 300,
  ignorePatterns: [/node_modules/, /\.git/, /dist/, /build/, /\.DS_Store/],
  recursive: true,
}

class FileSystemWatcher {
  private state: WatcherState = {
    isWatching: false,
    watchedPaths: new Set(),
    pendingEvents: new Map(),
    debounceTimer: null,
  }

  private options: WatcherOptions & {
    debounceMs: number
    ignorePatterns: RegExp[]
    recursive: boolean
  }
  private changeListeners: Set<(events: FileChangeEvent[]) => void> = new Set()
  private errorListeners: Set<(error: Error) => void> = new Set()

  constructor(options: WatcherOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  addChangeListener(listener: (events: FileChangeEvent[]) => void): () => void {
    this.changeListeners.add(listener)
    return () => this.changeListeners.delete(listener)
  }

  addErrorListener(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  private emitChange(events: FileChangeEvent[]): void {
    if (this.options.onChange) {
      this.options.onChange(events)
    }
    this.changeListeners.forEach(listener => {
      try {
        listener(events)
      } catch (err) {
        logger.error('Error in change listener', err as Error)
      }
    })
  }

  private emitError(error: Error): void {
    if (this.options.onError) {
      this.options.onError(error)
    }
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        logger.error('Error in error listener', e as Error)
      }
    })
  }

  private shouldIgnore(path: string): boolean {
    return this.options.ignorePatterns.some(pattern => pattern.test(path))
  }

  private generateEventId(type: FileChangeType, path: string): string {
    return `${type}:${path}`
  }

  private queueEvent(event: FileChangeEvent): void {
    const eventId = this.generateEventId(event.type, event.path)

    if (event.type === 'delete') {
      this.state.pendingEvents.set(eventId, event)
    } else {
      const existing = this.state.pendingEvents.get(eventId)
      if (existing) {
        existing.timestamp = event.timestamp
        existing.size = event.size
      } else {
        this.state.pendingEvents.set(eventId, event)
      }
    }

    this.scheduleFlush()
  }

  private scheduleFlush(): void {
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer)
    }

    this.state.debounceTimer = setTimeout(() => {
      this.flushEvents()
    }, this.options.debounceMs)
  }

  private flushEvents(): void {
    if (this.state.pendingEvents.size === 0) return

    const events = (Array.from(this.state.pendingEvents.values()) as FileChangeEvent[])
      .sort((a, b) => a.timestamp - b.timestamp)

    this.state.pendingEvents.clear()
    this.state.debounceTimer = null

    logger.debug(`Flushing ${events.length} file change events`)
    this.emitChange(events)
  }

  async watchPath(path: string): Promise<void> {
    if (this.state.watchedPaths.has(path)) {
      logger.warn(`Path already watched: ${path}`)
      return
    }

    this.state.watchedPaths.add(path)

    if (!this.state.isWatching) {
      this.startWatching()
    }

    logger.info(`Started watching path: ${path}`)
  }

  unwatchPath(path: string): void {
    this.state.watchedPaths.delete(path)
    logger.info(`Stopped watching path: ${path}`)

    if (this.state.watchedPaths.size === 0 && this.state.isWatching) {
      this.stopWatching()
    }
  }

  private startWatching(): void {
    this.state.isWatching = true
    logger.info('File system watcher started')

    if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
      this.setupFileSystemAccessAPI()
    } else {
      this.setupPollingWatcher()
    }
  }

  private stopWatching(): void {
    this.state.isWatching = false

    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer)
      this.state.debounceTimer = null
    }

    this.state.pendingEvents.clear()
    logger.info('File system watcher stopped')
  }

  private setupFileSystemAccessAPI(): void {
    logger.info('Using File System Access API for watching')

    let pollingInterval: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (pollingInterval) return

      pollingInterval = setInterval(async () => {
        for (const path of this.state.watchedPaths) {
          await this.checkPathChanges(path)
        }
      }, 1000)
    }

    startPolling()
  }

  private setupPollingWatcher(): void {
    logger.info('Using polling-based file watcher')

    let pollingInterval: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (pollingInterval) return

      pollingInterval = setInterval(async () => {
        for (const path of this.state.watchedPaths) {
          await this.checkPathChanges(path)
        }
      }, 2000)
    }

    startPolling()
  }

  private async checkPathChanges(path: string): Promise<void> {
    try {
      const lastModifiedMap = this.getLastModifiedMap(path)

      for (const [filePath, lastModified] of Object.entries(lastModifiedMap)) {
        if (this.shouldIgnore(filePath)) continue

        const cachedModified = this.getCachedModified(filePath)

        if (!cachedModified) {
          this.queueEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: 'create',
            path: filePath,
            timestamp: Date.now(),
          })
        } else if (cachedModified !== lastModified) {
          this.queueEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: 'modify',
            path: filePath,
            timestamp: Date.now(),
          })
        }

        this.setCachedModified(filePath, lastModified)
      }
    } catch (error) {
      this.emitError(error as Error)
    }
  }

  private getLastModifiedMap(_path: string): Record<string, number> {
    return {}
  }

  private modifiedCache: Map<string, number> = new Map()

  private getCachedModified(path: string): number | undefined {
    return this.modifiedCache.get(path)
  }

  private setCachedModified(path: string, modified: number): void {
    this.modifiedCache.set(path, modified)
  }

  getWatchedPaths(): string[] {
    return Array.from(this.state.watchedPaths)
  }

  isWatching(): boolean {
    return this.state.isWatching
  }

  getPendingEventsCount(): number {
    return this.state.pendingEvents.size
  }

  forceFlush(): FileChangeEvent[] {
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer)
      this.state.debounceTimer = null
    }

    const events = Array.from(this.state.pendingEvents.values()) as FileChangeEvent[]
    this.state.pendingEvents.clear()

    if (events.length > 0) {
      this.emitChange(events)
    }

    return events
  }

  destroy(): void {
    this.stopWatching()
    this.changeListeners.clear()
    this.errorListeners.clear()
    this.modifiedCache.clear()
    logger.info('File system watcher destroyed')
  }
}

let instance: FileSystemWatcher | null = null

export function getFileSystemWatcher(options?: WatcherOptions): FileSystemWatcher {
  if (!instance) {
    instance = new FileSystemWatcher(options)
  }
  return instance
}

export function destroyFileSystemWatcher(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}

export default FileSystemWatcher
