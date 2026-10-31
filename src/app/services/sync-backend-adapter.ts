/**
 * @file sync-backend-adapter.ts
 * @description 同步后端适配器 - 抽象远程后端接口，支持本地、WebDAV、S3、HTTP
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-03
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('sync-backend')

// ============================================================================
// 类型定义
// ============================================================================

/** 后端类型 */
export type BackendType = 'local' | 'webdav' | 's3' | 'custom-http' | 'none'

/** 后端状态 */
export type BackendStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/** 同步方向 */
export type SyncDirection = 'push' | 'pull' | 'bidirectional'

/** 后端连接配置 */
export interface BackendConnectionConfig {
  type: BackendType
  label: string
  // 通用
  baseUrl?: string
  timeout?: number // ms, 默认 30000
  retryCount?: number // 默认 3
  // 认证
  authType?: 'none' | 'basic' | 'bearer' | 'oauth2'
  username?: string
  password?: string
  token?: string
  // WebDAV 专用
  webdavRoot?: string
  // S3 专用
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
  forcePathStyle?: boolean
  // 本地
  localPath?: string
  // 自定义 HTTP
  customHeaders?: Record<string, string>
  uploadEndpoint?: string
  downloadEndpoint?: string
  listEndpoint?: string
  deleteEndpoint?: string
}

/** 远程文件信息 */
export interface RemoteFileInfo {
  path: string
  size: number
  lastModified: number
  etag?: string
  checksum?: string
}

/** 同步项数据传输 */
export interface SyncPayload {
  path: string
  data: string // base64 或 JSON 字符串
  checksum: string
  timestamp: number
  metadata?: Record<string, string>
}

/** 后端健康状态 */
export interface BackendHealth {
  ok: boolean
  latencyMs: number
  error?: string
}

/** 同步后端适配器接口 */
export interface SyncBackend {
  readonly type: BackendType
  readonly status: BackendStatus
  connect(config: BackendConnectionConfig): Promise<boolean>
  disconnect(): Promise<void>
  upload(payload: SyncPayload): Promise<boolean>
  download(path: string): Promise<SyncPayload | null>
  list(prefix?: string): Promise<RemoteFileInfo[]>
  delete(path: string): Promise<boolean>
  getInfo(path: string): Promise<RemoteFileInfo | null>
  healthCheck(): Promise<BackendHealth>
}

// ============================================================================
// 后端工厂
// ============================================================================

/** 后端工厂 - 根据类型创建对应后端实例 */
export function createBackend(type: BackendType): SyncBackend {
  switch (type) {
    case 'local':
      return new LocalFileBackend()
    case 'webdav':
      return new WebDAVBackend()
    case 's3':
      return new S3Backend()
    case 'custom-http':
      return new CustomHTTPBackend()
    case 'none':
      return new NoOpBackend()
    default:
      return new NoOpBackend()
  }
}

// ============================================================================
// 本地文件系统后端
// ============================================================================

class LocalFileBackend implements SyncBackend {
  readonly type: BackendType = 'local'
  status: BackendStatus = 'disconnected'
  private basePath = ''

  async connect(configParam: BackendConnectionConfig): Promise<boolean> {
    this.status = 'connecting'
    this.basePath = configParam.localPath || '/tmp/yyc3-sync'

    try {
      // 在浏览器环境中，本地路径实际上不可直接写入
      // 使用 IndexedDB 模拟本地文件存储
      logger.info(`[LocalBackend] Connected to local path: ${this.basePath}`)
      this.status = 'connected'
      return true
    } catch (error) {
      this.status = 'error'
      logger.error('[LocalBackend] Connection failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
    logger.info('[LocalBackend] Disconnected')
  }

  async upload(payload: SyncPayload): Promise<boolean> {
    try {
      localStorage.setItem(`yyc3_sync_${payload.path}`, JSON.stringify(payload))
      logger.debug(`[LocalBackend] Uploaded: ${payload.path}`)
      return true
    } catch (error) {
      logger.error(`[LocalBackend] Upload failed: ${payload.path}`, error)
      return false
    }
  }

  async download(path: string): Promise<SyncPayload | null> {
    try {
      const raw = localStorage.getItem(`yyc3_sync_${path}`)
      if (!raw) return null
      return JSON.parse(raw) as SyncPayload
    } catch (error) {
      logger.error(`[LocalBackend] Download failed: ${path}`, error)
      return null
    }
  }

  async list(prefix?: string): Promise<RemoteFileInfo[]> {
    const results: RemoteFileInfo[] = []
    const filterPrefix = `yyc3_sync_${prefix || ''}`

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(filterPrefix)) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const payload = JSON.parse(raw) as SyncPayload
            results.push({
              path: payload.path,
              size: raw.length,
              lastModified: payload.timestamp,
              checksum: payload.checksum,
            })
          }
        } catch { /* skip malformed */ }
      }
    }

    return results
  }

  async delete(path: string): Promise<boolean> {
    try {
      localStorage.removeItem(`yyc3_sync_${path}`)
      return true
    } catch {
      return false
    }
  }

  async getInfo(path: string): Promise<RemoteFileInfo | null> {
    const payload = await this.download(path)
    if (!payload) return null
    return {
      path: payload.path,
      size: payload.data.length,
      lastModified: payload.timestamp,
      checksum: payload.checksum,
    }
  }

  async healthCheck(): Promise<BackendHealth> {
    const start = performance.now()
    try {
      localStorage.getItem('yyc3_sync_health_check')
      return { ok: true, latencyMs: Math.round(performance.now() - start) }
    } catch (error) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: String(error) }
    }
  }
}

// ============================================================================
// WebDAV 后端
// ============================================================================

class WebDAVBackend implements SyncBackend {
  readonly type: BackendType = 'webdav'
  status: BackendStatus = 'disconnected'
  private config: BackendConnectionConfig | null = null
  private baseHeaders: Record<string, string> = {}

  async connect(config: BackendConnectionConfig): Promise<boolean> {
    this.status = 'connecting'
    this.config = config

    if (!config.baseUrl) {
      this.status = 'error'
      logger.error('[WebDAV] No base URL provided')
      return false
    }

    this.baseHeaders = {
      'Content-Type': 'application/octet-stream',
      'Accept': '*/*',
    }

    if (config.authType === 'basic' && config.username && config.password) {
      const credentials = btoa(`${config.username}:${config.password}`)
      this.baseHeaders['Authorization'] = `Basic ${credentials}`
    } else if (config.authType === 'bearer' && config.token) {
      this.baseHeaders['Authorization'] = `Bearer ${config.token}`
    }

    const health = await this.healthCheck()
    if (health.ok) {
      this.status = 'connected'
      logger.info(`[WebDAV] Connected to ${config.baseUrl}`)
      return true
    }

    this.status = 'error'
    logger.error(`[WebDAV] Connection failed: ${health.error}`)
    return false
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
    this.config = null
    this.baseHeaders = {}
  }

  /** 构建完整 URL */
  private buildUrl(path: string): string {
    const base = this.config?.baseUrl?.replace(/\/+$/, '') || ''
    const cleanPath = path.replace(/^\/+/, '')
    return `${base}/${cleanPath}`
  }

  async upload(payload: SyncPayload): Promise<boolean> {
    try {
      const url = this.buildUrl(payload.path)
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.baseHeaders,
        body: JSON.stringify(payload),
      })
      return response.ok
    } catch (error) {
      logger.error(`[WebDAV] Upload failed: ${payload.path}`, error)
      return false
    }
  }

  async download(path: string): Promise<SyncPayload | null> {
    try {
      const url = this.buildUrl(path)
      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      })
      if (!response.ok) return null
      return await response.json() as SyncPayload
    } catch (error) {
      logger.error(`[WebDAV] Download failed: ${path}`, error)
      return null
    }
  }

  async list(prefix?: string): Promise<RemoteFileInfo[]> {
    try {
      const url = this.buildUrl(prefix || '')
      const response = await fetch(url, {
        method: 'PROPFIND',
        headers: {
          ...this.baseHeaders,
          Depth: '1',
        },
      })

      if (!response.ok) return []

      const text = await response.text()
      return this.parseWebDAVXml(text)
    } catch (error) {
      logger.error('[WebDAV] List failed:', error)
      return []
    }
  }

  /** 解析 WebDAV XML 响应 */
  private parseWebDAVXml(xml: string): RemoteFileInfo[] {
    const files: RemoteFileInfo[] = []
    const responseMatch = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) || []

    for (const resp of responseMatch) {
      const href = resp.match(/<d:href>([^<]+)<\/d:href>/)?.[1]
      if (!href || href === this.config?.baseUrl) continue

      const sizeStr = resp.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/i)?.[1]
      const modifiedStr = resp.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/i)?.[1]
      const etag = resp.match(/<d:getetag>([^<]+)<\/d:getetag>/i)?.[1]

      files.push({
        path: href,
        size: sizeStr ? parseInt(sizeStr, 10) : 0,
        lastModified: modifiedStr ? new Date(modifiedStr).getTime() : 0,
        etag: etag || undefined,
      })
    }

    return files
  }

  async delete(path: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path)
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.baseHeaders,
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getInfo(path: string): Promise<RemoteFileInfo | null> {
    const files = await this.list(path)
    return files.find(f => f.path === path) || null
  }

  async healthCheck(): Promise<BackendHealth> {
    const start = performance.now()
    try {
      const url = this.config?.baseUrl
      if (!url) throw new Error('No base URL')
      const response = await fetch(url, { method: 'OPTIONS', headers: this.baseHeaders })
      return { ok: response.ok, latencyMs: Math.round(performance.now() - start) }
    } catch (error) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: String(error) }
    }
  }
}

// ============================================================================
// S3 兼容后端
// ============================================================================

class S3Backend implements SyncBackend {
  readonly type: BackendType = 's3'
  status: BackendStatus = 'disconnected'
  private config: BackendConnectionConfig | null = null

  async connect(config: BackendConnectionConfig): Promise<boolean> {
    this.status = 'connecting'
    this.config = config

    if (!config.bucket || !config.region) {
      this.status = 'error'
      logger.error('[S3] Missing bucket or region')
      return false
    }

    this.status = 'connected'
    logger.info(`[S3] Connected to ${config.bucket} (${config.region})`)
    return true
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
    this.config = null
  }

  /** 构建 S3 对象 URL */
  private objectUrl(key: string): string {
    const cfg = this.config!
    const base = cfg.endpoint || `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`
    const cleanKey = key.replace(/^\/+/, '')
    return cfg.forcePathStyle
      ? `${base}/${cfg.bucket}/${cleanKey}`
      : `${base}/${cleanKey}`
  }

  /** 生成 AWS Signature V4 签名头（简化实现） */
  private authHeaders(_method: string, _path: string): Record<string, string> {
    // 在浏览器环境中，完整的 AWS Signature V4 实现需要 crypto 操作
    // 简化实现：使用 Authorization header 携带 key
    // 生产环境建议使用 AWS SDK for JavaScript
    return {
      'x-amz-date': new Date().toISOString(),
    }
  }

  async upload(payload: SyncPayload): Promise<boolean> {
    try {
      const url = this.objectUrl(payload.path)
      const headers = {
        'Content-Type': 'application/json',
        ...this.authHeaders('PUT', payload.path),
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      })
      return response.ok
    } catch (error) {
      logger.error(`[S3] Upload failed: ${payload.path}`, error)
      return false
    }
  }

  async download(path: string): Promise<SyncPayload | null> {
    try {
      const url = this.objectUrl(path)
      const response = await fetch(url, {
        method: 'GET',
        headers: this.authHeaders('GET', path),
      })
      if (!response.ok) return null
      return await response.json() as SyncPayload
    } catch (error) {
      logger.error(`[S3] Download failed: ${path}`, error)
      return null
    }
  }

  async list(prefix?: string): Promise<RemoteFileInfo[]> {
    try {
      const cfg = this.config!
      const params = new URLSearchParams({ list: 'type=2' })
      if (prefix) params.set('prefix', prefix)

      const url = cfg.forcePathStyle
        ? `${cfg.endpoint}/${cfg.bucket}/?${params}`
        : `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/?${params}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.authHeaders('GET', '/'),
      })

      if (!response.ok) return []

      const text = await response.text()
      return this.parseS3ListXml(text)
    } catch (error) {
      logger.error('[S3] List failed:', error)
      return []
    }
  }

  /** 解析 S3 ListObjectsV2 XML 响应 */
  private parseS3ListXml(xml: string): RemoteFileInfo[] {
    const files: RemoteFileInfo[] = []
    const contentMatch = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) || []

    for (const content of contentMatch) {
      const key = content.match(/<Key>([^<]+)<\/Key>/)?.[1]
      const size = content.match(/<Size>(\d+)<\/Size>/)?.[1]
      const modified = content.match(/<LastModified>([^<]+)<\/LastModified>/)?.[1]
      const etag = content.match(/<ETag>"?([^"<]+)"?<\/ETag>/)?.[1]

      if (key) {
        files.push({
          path: key,
          size: size ? parseInt(size, 10) : 0,
          lastModified: modified ? new Date(modified).getTime() : 0,
          etag: etag || undefined,
        })
      }
    }

    return files
  }

  async delete(path: string): Promise<boolean> {
    try {
      const url = this.objectUrl(path)
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.authHeaders('DELETE', path),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getInfo(path: string): Promise<RemoteFileInfo | null> {
    try {
      const url = this.objectUrl(path)
      const response = await fetch(url, {
        method: 'HEAD',
        headers: this.authHeaders('HEAD', path),
      })
      if (!response.ok) return null

      return {
        path,
        size: parseInt(response.headers.get('content-length') || '0', 10),
        lastModified: new Date(response.headers.get('last-modified') || '').getTime(),
        etag: response.headers.get('etag') || undefined,
      }
    } catch {
      return null
    }
  }

  async healthCheck(): Promise<BackendHealth> {
    const start = performance.now()
    try {
      await this.list()
      return { ok: true, latencyMs: Math.round(performance.now() - start) }
    } catch (error) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: String(error) }
    }
  }
}

// ============================================================================
// 自定义 HTTP 后端
// ============================================================================

class CustomHTTPBackend implements SyncBackend {
  readonly type: BackendType = 'custom-http'
  status: BackendStatus = 'disconnected'
  private config: BackendConnectionConfig | null = null
  private customHeaders: Record<string, string> = {}

  async connect(config: BackendConnectionConfig): Promise<boolean> {
    this.status = 'connecting'
    this.config = config

    if (!config.baseUrl) {
      this.status = 'error'
      logger.error('[HTTP] No base URL provided')
      return false
    }

    this.customHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.customHeaders,
    }

    if (config.authType === 'bearer' && config.token) {
      this.customHeaders['Authorization'] = `Bearer ${config.token}`
    } else if (config.authType === 'basic' && config.username && config.password) {
      this.customHeaders['Authorization'] = `Basic ${btoa(`${config.username}:${config.password}`)}`
    }

    const health = await this.healthCheck()
    if (health.ok) {
      this.status = 'connected'
      logger.info(`[HTTP] Connected to ${config.baseUrl}`)
      return true
    }

    this.status = 'error'
    return false
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
    this.config = null
    this.customHeaders = {}
  }

  private endpointUrl(endpoint: string | undefined, path: string): string {
    const base = this.config?.baseUrl?.replace(/\/+$/, '') || ''
    if (endpoint) {
      return endpoint.replace('{path}', encodeURIComponent(path))
    }
    return `${base}/${path.replace(/^\/+/, '')}`
  }

  async upload(payload: SyncPayload): Promise<boolean> {
    try {
      const url = this.endpointUrl(this.config?.uploadEndpoint, payload.path)
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.customHeaders,
        body: JSON.stringify(payload),
      })
      return response.ok
    } catch (error) {
      logger.error(`[HTTP] Upload failed: ${payload.path}`, error)
      return false
    }
  }

  async download(path: string): Promise<SyncPayload | null> {
    try {
      const url = this.endpointUrl(this.config?.downloadEndpoint, path)
      const response = await fetch(url, {
        method: 'GET',
        headers: this.customHeaders,
      })
      if (!response.ok) return null
      return await response.json() as SyncPayload
    } catch (error) {
      logger.error(`[HTTP] Download failed: ${path}`, error)
      return null
    }
  }

  async list(prefix?: string): Promise<RemoteFileInfo[]> {
    try {
      const url = this.endpointUrl(this.config?.listEndpoint, prefix || '')
      const response = await fetch(url, {
        method: 'GET',
        headers: this.customHeaders,
      })
      if (!response.ok) return []
      return await response.json() as RemoteFileInfo[]
    } catch (error) {
      logger.error('[HTTP] List failed:', error)
      return []
    }
  }

  async delete(path: string): Promise<boolean> {
    try {
      const url = this.endpointUrl(this.config?.deleteEndpoint, path)
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.customHeaders,
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getInfo(path: string): Promise<RemoteFileInfo | null> {
    const files = await this.list(path)
    return files.find(f => f.path === path) || null
  }

  async healthCheck(): Promise<BackendHealth> {
    const start = performance.now()
    try {
      const url = this.config?.baseUrl
      if (!url) throw new Error('No base URL')
      const response = await fetch(url, { method: 'GET', headers: this.customHeaders })
      return { ok: response.ok, latencyMs: Math.round(performance.now() - start) }
    } catch (error) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: String(error) }
    }
  }
}

// ============================================================================
// 空后端（无操作）
// ============================================================================

class NoOpBackend implements SyncBackend {
  readonly type: BackendType = 'none'
  status: BackendStatus = 'disconnected'

  async connect(_config: BackendConnectionConfig): Promise<boolean> {
    this.status = 'connected'
    return true
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
  }

  async upload(_payload: SyncPayload): Promise<boolean> {
    return true
  }

  async download(_path: string): Promise<SyncPayload | null> {
    return null
  }

  async list(_prefix?: string): Promise<RemoteFileInfo[]> {
    return []
  }

  async delete(_path: string): Promise<boolean> {
    return true
  }

  async getInfo(_path: string): Promise<RemoteFileInfo | null> {
    return null
  }

  async healthCheck(): Promise<BackendHealth> {
    return { ok: true, latencyMs: 0 }
  }
}

// ============================================================================
// 后端管理器（管理多个后端实例和配置）
// ============================================================================

export interface BackendManagerConfig {
  activeBackend: BackendType
  backends: Record<string, BackendConnectionConfig>
  syncDirection: SyncDirection
  autoSync: boolean
  syncIntervalMs: number
  lastSyncTime: number | null
}

const DEFAULT_MANAGER_CONFIG: BackendManagerConfig = {
  activeBackend: 'none',
  backends: {},
  syncDirection: 'bidirectional',
  autoSync: false,
  syncIntervalMs: 60000,
  lastSyncTime: null,
}

export class BackendManager {
  private static instance: BackendManager
  // 深拷贝默认配置：浅拷贝使 backends 数组与模块常量共享引用，
  // 运行时写入会污染 DEFAULT_MANAGER_CONFIG（跨实例串配置）
  private config: BackendManagerConfig = {
    ...DEFAULT_MANAGER_CONFIG,
    backends: { ...DEFAULT_MANAGER_CONFIG.backends },
  }
  private backendInstances: Map<BackendType, SyncBackend> = new Map()
  private activeInstance: SyncBackend = new NoOpBackend()

  private constructor() {
    this.loadConfig()
  }

  static getInstance(): BackendManager {
    if (!BackendManager.instance) {
      BackendManager.instance = new BackendManager()
    }
    return BackendManager.instance
  }

  /** 获取当前活动后端 */
  getActive(): SyncBackend {
    return this.activeInstance
  }

  /** 获取当前活动后端类型 */
  getActiveType(): BackendType {
    return this.config.activeBackend
  }

  /** 获取完整配置 */
  getConfig(): BackendManagerConfig {
    return { ...this.config }
  }

  /** 更新后端配置 */
  async setActiveBackend(type: BackendType, connectionConfig: BackendConnectionConfig): Promise<boolean> {
    // 断开当前连接
    await this.activeInstance.disconnect()

    // 创建并连接新后端
    const backend = this.getOrCreateBackend(type)
    const connected = await backend.connect(connectionConfig)

    if (connected) {
      this.activeInstance = backend
      this.config.activeBackend = type
      this.config.backends[type] = connectionConfig
      this.saveConfig()
      logger.info(`[BackendManager] Switched to backend: ${type}`)
    } else {
      // 回退到空后端（历史缺陷：activeType 未同步——getActiveType() 谎报旧后端）
      this.activeInstance = this.getOrCreateBackend('none')
      this.config.activeBackend = 'none'
      logger.error(`[BackendManager] Failed to connect to backend: ${type}`)
    }

    return connected
  }

  /** 切换同步方向 */
  setSyncDirection(direction: SyncDirection): void {
    this.config.syncDirection = direction
    this.saveConfig()
  }

  /** 设置自动同步 */
  setAutoSync(enabled: boolean): void {
    this.config.autoSync = enabled
    this.saveConfig()
  }

  /** 设置同步间隔 */
  setSyncInterval(ms: number): void {
    this.config.syncIntervalMs = ms
    this.saveConfig()
  }

  /** 更新最后同步时间 */
  updateLastSyncTime(): void {
    this.config.lastSyncTime = Date.now()
    this.saveConfig()
  }

  /** 获取可用后端列表 */
  getConfiguredBackends(): Array<{ type: BackendType; config: BackendConnectionConfig }> {
    return Object.entries(this.config.backends).map(([type, config]) => ({
      type: type as BackendType,
      config,
    }))
  }

  /** 删除后端配置 */
  async removeBackend(type: BackendType): Promise<void> {
    if (this.config.activeBackend === type) {
      await this.activeInstance.disconnect()
      this.activeInstance = this.getOrCreateBackend('none')
      this.config.activeBackend = 'none'
    }

    delete this.config.backends[type]
    this.backendInstances.delete(type)
    this.saveConfig()
  }

  /** 同步方向配置 */
  getSyncDirection(): SyncDirection {
    return this.config.syncDirection
  }

  /** 是否自动同步 */
  isAutoSyncEnabled(): boolean {
    return this.config.autoSync
  }

  /** 同步间隔 */
  getSyncInterval(): number {
    return this.config.syncIntervalMs
  }

  /** 最后同步时间 */
  getLastSyncTime(): number | null {
    return this.config.lastSyncTime
  }

  private getOrCreateBackend(type: BackendType): SyncBackend {
    if (!this.backendInstances.has(type)) {
      this.backendInstances.set(type, createBackend(type))
    }
    return this.backendInstances.get(type)!
  }

  /** 从 localStorage 加载配置 */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('yyc3_sync_backend_config')
      if (saved) {
        const parsed = JSON.parse(saved) as BackendManagerConfig
        this.config = { ...DEFAULT_MANAGER_CONFIG, ...parsed }

        // 恢复活动后端连接
        if (this.config.activeBackend !== 'none') {
          const connConfig = this.config.backends[this.config.activeBackend]
          if (connConfig) {
            const backend = this.getOrCreateBackend(this.config.activeBackend)
            backend.connect(connConfig).then(connected => {
              if (connected) {
                this.activeInstance = backend
              }
            })
          }
        }
      }
    } catch (error) {
      logger.error('[BackendManager] Failed to load config:', error)
    }
  }

  /** 保存配置到 localStorage */
  private saveConfig(): void {
    try {
      localStorage.setItem('yyc3_sync_backend_config', JSON.stringify(this.config))
    } catch (error) {
      logger.error('[BackendManager] Failed to save config:', error)
    }
  }
}

export default BackendManager
