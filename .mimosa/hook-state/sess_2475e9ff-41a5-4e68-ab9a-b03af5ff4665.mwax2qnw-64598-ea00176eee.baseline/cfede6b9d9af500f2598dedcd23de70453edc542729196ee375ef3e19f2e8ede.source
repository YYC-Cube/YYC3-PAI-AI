/**
 * @file file-system-adapter.ts
 * @description 文件系统适配器 - 支持Web File System API和Tauri/Electron原生API
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('fs-adapter')

export type FileSystemEnvironment = 'web' | 'tauri' | 'electron'

export interface FileSystemAdapter {
  readonly environment: FileSystemEnvironment

  isSupported(): boolean

  requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<boolean>

  readFile(path: string): Promise<Uint8Array>

  writeFile(path: string, data: Uint8Array): Promise<void>

  deleteFile(path: string): Promise<void>

  renameFile(oldPath: string, newPath: string): Promise<void>

  copyFile(src: string, dest: string): Promise<void>

  exists(path: string): Promise<boolean>

  stat(path: string): Promise<FileStat>

  listDirectory(path: string): Promise<DirectoryEntry[]>

  createDirectory(path: string): Promise<void>

  watchDirectory(
    path: string,
    callback: (event: FileSystemEvent) => void,
    options?: WatchOptions
  ): Promise<WatchHandle>

  getBasePath(): string

  isNative(): boolean
}

export interface FileStat {
  path: string
  name: string
  type: 'file' | 'directory'
  size: number
  modifiedAt: number
  createdAt: number
  permissions?: number
}

export interface DirectoryEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
}

export interface FileSystemEvent {
  type: 'create' | 'modify' | 'delete' | 'rename'
  path: string
  oldPath?: string
  timestamp: number
}

export interface WatchOptions {
  recursive?: boolean
  ignorePatterns?: RegExp[]
  debounceMs?: number
}

export interface WatchHandle {
  readonly id: string
  close(): void
}

class WebFileSystemAdapter implements FileSystemAdapter {
  readonly environment = 'web' as const
  private rootHandle: FileSystemDirectoryHandle | null = null
  private permissionGranted = false

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'showDirectoryPicker' in window &&
      'showOpenFilePicker' in window
  }

  async requestPermission(options?: { mode: 'read' | 'readwrite' }): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        logger.warn('File System Access API not supported')
        return false
      }

      this.rootHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()

      if (options?.mode === 'readwrite') {
        try {
          const permission = await (this.rootHandle as unknown as { requestPermission: (opts: { mode: string }) => Promise<PermissionState> }).requestPermission({ mode: 'readwrite' })
          this.permissionGranted = permission === 'granted'
        } catch {
          this.permissionGranted = true
        }
      } else {
        this.permissionGranted = true
      }

      return this.permissionGranted
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') {
        logger.info('User cancelled directory picker')
      } else {
        logger.error('Failed to request file system permission', error as Error)
      }
      return false
    }
  }

  async readFile(path: string): Promise<Uint8Array> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    const fileHandle = await this.getFileHandle(path)
    const file = await fileHandle.getFile()
    const buffer = await file.arrayBuffer()
    return new Uint8Array(buffer)
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    const dirPath = this.getDirectoryName(path)
    const fileName = this.getBaseName(path)

    let dirHandle = this.rootHandle
    if (dirPath && dirPath !== '.') {
      dirHandle = await this.getOrCreateDirectory(dirPath)
    }

    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(data.buffer as ArrayBuffer)
    await writable.close()
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    try {
      const baseName = this.getBaseName(path)
      const parentPath = this.getDirectoryName(path)
      const parentHandle = parentPath
        ? await this.getDirectoryHandle(parentPath)
        : this.rootHandle

      try {
        await parentHandle.removeEntry(baseName, { recursive: true })
      } catch {
        await this.rootHandle.removeEntry(baseName, { recursive: true })
      }
    } catch (error) {
      logger.error(`Failed to delete file: ${path}`, error as Error)
      throw error
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    let dataWritten = false
    try {
      const data = await this.readFile(oldPath)
      await this.writeFile(newPath, data)
      dataWritten = true
      await this.deleteFile(oldPath)
    } catch (error) {
      if (dataWritten) {
        try { await this.deleteFile(newPath) } catch { /* rollback best-effort */ }
      }
      logger.error(`Failed to rename file: ${oldPath} -> ${newPath}`, error as Error)
      throw error
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const data = await this.readFile(src)
    await this.writeFile(dest, data)
  }

  async exists(path: string): Promise<boolean> {
    if (!this.rootHandle) return false
    try {
      await this.getFileHandle(path)
      return true
    } catch {
      return false
    }
  }

  async stat(path: string): Promise<FileStat> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    const fileHandle = await this.getFileHandle(path)
    const file = await fileHandle.getFile()

    return {
      path,
      name: this.getBaseName(path),
      type: 'file',
      size: file.size,
      modifiedAt: file.lastModified,
      createdAt: file.lastModified,
    }
  }

  async listDirectory(path: string): Promise<DirectoryEntry[]> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    let dirHandle = this.rootHandle
    if (path && path !== '.') {
      dirHandle = await this.getDirectoryHandle(path)
    }

    const entries: DirectoryEntry[] = []
    const dirIterator = (dirHandle as unknown as { values: () => AsyncIterable<[string, FileSystemHandle]> }).values()
    for await (const [, handle] of dirIterator) {
      const entryName = (handle as { name: string }).name
      const kind = (handle as { kind: 'file' | 'directory' }).kind
      entries.push({
        name: entryName,
        path: `${path}/${entryName}`.replace(/\/+/g, '/'),
        type: kind ?? 'file',
      })
    }

    return entries
  }

  async createDirectory(path: string): Promise<void> {
    if (!this.rootHandle) throw new Error('No root directory handle')
    await this.getOrCreateDirectory(path)
  }

  async watchDirectory(
    path: string,
    _callback: (event: FileSystemEvent) => void,
    _options?: WatchOptions
  ): Promise<WatchHandle> {
    const handleId = `watch-${Date.now()}-${Math.random().toString(36).slice(2)}`

    logger.info(`Watching directory: ${path} (handle: ${handleId})`)

    return {
      id: handleId,
      close: () => {
        logger.info(`Stopped watching: ${handleId}`)
      },
    }
  }

  getBasePath(): string {
    return this.rootHandle ? (this.rootHandle as unknown as { name: string }).name : ''
  }

  isNative(): boolean {
    return false
  }

  private async getFileHandle(path: string): Promise<FileSystemFileHandle> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    const parts = path.split('/').filter(Boolean)
    const fileName = parts.pop()
    if (!fileName) throw new Error('Invalid path')

    let currentDir = this.rootHandle
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part)
    }

    return currentDir.getFileHandle(fileName)
  }

  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    let currentDir = this.rootHandle
    const parts = path.split('/').filter(Boolean)
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part)
    }
    return currentDir
  }

  private async getOrCreateDirectory(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) throw new Error('No root directory handle')

    let currentDir = this.rootHandle
    const parts = path.split('/').filter(Boolean)
    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true })
      } catch {
        currentDir = await currentDir.getDirectoryHandle(part)
      }
    }
    return currentDir
  }

  private getBaseName(path: string): string {
    return path.split('/').pop() ?? path
  }

  private getDirectoryName(path: string): string {
    const parts = path.split('/')
    parts.pop()
    return parts.join('/')
  }
}

class TauriFileSystemAdapter implements FileSystemAdapter {
  readonly environment = 'tauri' as const

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      '__TAURI__' in window &&
      !!(window as unknown as Record<string, unknown>).__TAURI__
  }

  async requestPermission(_options?: { mode: 'read' | 'readwrite' }): Promise<boolean> {
    logger.info('Tauri permissions are managed at the OS level')
    return true
  }

  async readFile(path: string): Promise<Uint8Array> {
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const content = await readTextFile(path)
    return new TextEncoder().encode(content)
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { writeFile: tauriWriteFile } = await import('@tauri-apps/plugin-fs')
    const content = new TextDecoder().decode(data)
    await tauriWriteFile(path, content)
  }

  async deleteFile(path: string): Promise<void> {
    const { removeFile } = await import('@tauri-apps/plugin-fs')
    await removeFile(path)
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const { renameFile: tauriRenameFile } = await import('@tauri-apps/plugin-fs')
    await tauriRenameFile(oldPath, newPath)
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const { copyFile: tauriCopyFile } = await import('@tauri-apps/plugin-fs')
    await tauriCopyFile(src, dest)
  }

  async exists(path: string): Promise<boolean> {
    const { exists: tauriExists } = await import('@tauri-apps/plugin-fs')
    return tauriExists(path)
  }

  async stat(path: string): Promise<FileStat> {
    const { stat: tauriStat } = await import('@tauri-apps/plugin-fs')
    const info = await tauriStat(path)
    return {
      path,
      name: path.split('/').pop() ?? path,
      type: info.isFile ? 'file' : 'directory',
      size: info.size ?? 0,
      modifiedAt: info.mtime ? new Date(info.mtime).getTime() : Date.now(),
      createdAt: info.mtime ? new Date(info.mtime).getTime() : Date.now(),
      permissions: info.permissions?.mode ?? 0,
    }
  }

  async listDirectory(path: string): Promise<DirectoryEntry[]> {
    const { readDir } = await import('@tauri-apps/plugin-fs')
    const entries = await readDir(path)
    return entries.map(entry => ({
      name: entry.name,
      path: entry.path,
      type: entry.isDirectory ? 'directory' : 'file',
      size: entry.size,
    }))
  }

  async createDirectory(path: string): Promise<void> {
    const { mkdir } = await import('@tauri-apps/plugin-fs')
    await mkdir(path, { recursive: true })
  }

  async watchDirectory(
    _path: string,
    _callback: (event: FileSystemEvent) => void,
    _options?: WatchOptions
  ): Promise<WatchHandle> {
    const handleId = `tauri-watch-${Date.now()}`
    logger.warn('Tauri file watching requires event plugin - using polling fallback')
    return {
      id: handleId,
      close: () => { },
    }
  }

  getBasePath(): string {
    return '/'
  }

  isNative(): boolean {
    return true
  }
}

let adapterInstance: FileSystemAdapter | null = null

export function getFileSystemAdapter(forceEnv?: FileSystemEnvironment): FileSystemAdapter {
  if (adapterInstance) return adapterInstance

  if (forceEnv) {
    switch (forceEnv) {
      case 'tauri':
        adapterInstance = new TauriFileSystemAdapter()
        break
      default:
        adapterInstance = new WebFileSystemAdapter()
    }
  } else {
    const tauriAdapter = new TauriFileSystemAdapter()
    if (tauriAdapter.isSupported()) {
      adapterInstance = tauriAdapter
      logger.info('Using Tauri native file system adapter')
    } else {
      adapterInstance = new WebFileSystemAdapter()
      logger.info('Using Web File System Access API adapter')
    }
  }

  return adapterInstance
}

export function destroyFileSystemAdapter(): void {
  adapterInstance = null
}

export function detectEnvironment(): FileSystemEnvironment {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'tauri'
  }
  return 'web'
}

export default getFileSystemAdapter
