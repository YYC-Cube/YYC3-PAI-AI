/**
 * @file secure-storage.ts
 * @description 安全存储服务 - 敏感字段自动加密/解密
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,encryption,vault,sensitive-data
 */

import { createLogger } from '../utils/logger'
import { securityVault, type EncryptedData } from './security-vault'
import { indexedDBService } from './indexeddb-service'

const logger = createLogger('secure-storage')

// ============================================================================
// 类型定义
// ============================================================================

/** 敏感数据类型 */
export type SensitiveDataType = 'api-key' | 'token' | 'password' | 'secret' | 'private-key' | 'custom'

/** 敏感数据条目 */
export interface SensitiveItem {
  id: string
  type: SensitiveDataType
  label: string
  /** 关联的 provider/服务名称 */
  provider?: string
  /** 创建时间 */
  createdAt: number
  /** 最后访问时间 */
  lastAccessed: number
  /** 元数据（不加密） */
  metadata: Record<string, string>
}

/** 加密存储的敏感数据 */
export interface EncryptedSensitiveData {
  item: SensitiveItem
  encryptedValue: string // base64 编码的加密数据
}

/** 安全存储状态 */
export interface SecureStorageStatus {
  initialized: boolean
  unlocked: boolean
  itemCount: number
  lastUnlockTime: number | null
}

/** 访问凭证 */
export interface VaultCredentials {
  passphrase: string
}

/** 密钥派生建议 */
export interface KeyDerivationSuggestion {
  algorithm: string
  iterations: number
  reason: string
}

// ============================================================================
// 敏感字段识别
// ============================================================================

/** 已知敏感字段模式 */
const SENSITIVE_FIELD_PATTERNS: Array<{ pattern: RegExp; type: SensitiveDataType; label: string }> = [
  { pattern: /api[_-]?key/i, type: 'api-key', label: 'API Key' },
  { pattern: /apikey/i, type: 'api-key', label: 'API Key' },
  { pattern: /access[_-]?token/i, type: 'token', label: 'Access Token' },
  { pattern: /secret[_-]?key/i, type: 'secret', label: 'Secret Key' },
  { pattern: /private[_-]?key/i, type: 'private-key', label: 'Private Key' },
  { pattern: /password/i, type: 'password', label: 'Password' },
  { pattern: /bearer/i, type: 'token', label: 'Bearer Token' },
  { pattern: /auth[_-]?token/i, type: 'token', label: 'Auth Token' },
  { pattern: /refresh[_-]?token/i, type: 'token', label: 'Refresh Token' },
  { pattern: /session[_-]?key/i, type: 'secret', label: 'Session Key' },
]

// ============================================================================
// 安全存储管理器
// ============================================================================

export class SecureStorageManager {
  private initialized = false
  private unlocked = false
  private itemCache: Map<string, EncryptedSensitiveData> = new Map()
  private lastUnlockTime: number | null = null
  private autoLockTimer: ReturnType<typeof setTimeout> | null = null
  private readonly AUTO_LOCK_MS = 5 * 60 * 1000 // 5分钟自动锁定
  private readonly STORE_NAME = 'secure-store'

  // ==========================================================================
  // 生命周期管理
  // ==========================================================================

  /**
   * 初始化安全存储
   */
  async initialize(passphrase: string): Promise<void> {
    if (!securityVault.isInitialized()) {
      await securityVault.initialize(passphrase)
    }

    const unlocked = await securityVault.unlock(passphrase)
    if (!unlocked) {
      throw new Error('Failed to unlock security vault')
    }

    this.initialized = true
    this.unlocked = true
    this.lastUnlockTime = Date.now()
    this.scheduleAutoLock()

    logger.info('[SecureStorage] Initialized and unlocked')
  }

  /**
   * 解锁安全存储
   */
  async unlock(credentials: VaultCredentials): Promise<boolean> {
    if (!this.initialized && securityVault.isInitialized()) {
      this.initialized = true
    }

    if (!this.initialized) {
      await this.initialize(credentials.passphrase)
      return true
    }

    const unlocked = await securityVault.unlock(credentials.passphrase)
    if (unlocked) {
      this.unlocked = true
      this.lastUnlockTime = Date.now()
      this.scheduleAutoLock()
      logger.info('[SecureStorage] Unlocked')
    }

    return unlocked
  }

  /**
   * 锁定安全存储
   */
  lock(): void {
    securityVault.lock()
    this.unlocked = false
    this.itemCache.clear()

    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer)
      this.autoLockTimer = null
    }

    logger.info('[SecureStorage] Locked')
  }

  /**
   * 获取状态
   */
  getStatus(): SecureStorageStatus {
    return {
      initialized: this.initialized,
      unlocked: this.unlocked,
      itemCount: this.itemCache.size,
      lastUnlockTime: this.lastUnlockTime,
    }
  }

  // ==========================================================================
  // 敏感数据存储
  // ==========================================================================

  /**
   * 存储敏感数据（自动加密）
   */
  async storeSecret(
    id: string,
    value: string,
    type: SensitiveDataType,
    options?: { label?: string; provider?: string; metadata?: Record<string, string> }
  ): Promise<void> {
    this.requireUnlocked()

    // 加密敏感值
    const encoded = new TextEncoder().encode(value)
    const encrypted = await securityVault.encrypt(encoded.buffer as ArrayBuffer)

    // 构建条目元数据
    const item: SensitiveItem = {
      id,
      type,
      label: options?.label || this.guessLabel(id),
      provider: options?.provider,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      metadata: options?.metadata || {},
    }

    // 序列化加密数据
    const encryptedValue = this.serializeEncryptedData(encrypted)

    const record: EncryptedSensitiveData = { item, encryptedValue }

    // 存入 IndexedDB
    await indexedDBService.set(this.STORE_NAME, `secret:${id}`, record, { encrypted: true, type })

    // 更新缓存
    this.itemCache.set(id, record)

    logger.info(`[SecureStorage] Stored secret: ${id} (${type})`)
  }

  /**
   * 读取敏感数据（自动解密）
   */
  async readSecret(id: string): Promise<string | null> {
    this.requireUnlocked()

    // 优先从缓存读取
    const cached = this.itemCache.get(id)
    let record: EncryptedSensitiveData | null = cached || null

    if (!record) {
      record = await indexedDBService.getData<EncryptedSensitiveData>(this.STORE_NAME, `secret:${id}`)
      if (record) {
        this.itemCache.set(id, record)
      }
    }

    if (!record) return null

    // 解密
    const encrypted = this.deserializeEncryptedData(record.encryptedValue)
    const decrypted = await securityVault.decrypt(encrypted)
    const value = new TextDecoder().decode(decrypted)

    // 更新访问时间
    record.item.lastAccessed = Date.now()
    await indexedDBService.set(this.STORE_NAME, `secret:${id}`, record, { encrypted: true, type: record.item.type })

    return value
  }

  /**
   * 删除敏感数据
   */
  async deleteSecret(id: string): Promise<void> {
    await indexedDBService.delete(this.STORE_NAME, `secret:${id}`)
    this.itemCache.delete(id)
    logger.info(`[SecureStorage] Deleted secret: ${id}`)
  }

  /**
   * 列出所有敏感数据条目（仅元数据，不含值）
   */
  async listSecrets(type?: SensitiveDataType): Promise<SensitiveItem[]> {
    const records = await indexedDBService.getAll<EncryptedSensitiveData>(this.STORE_NAME)
    const items = records.map(r => r.data.item)

    if (type) {
      return items.filter(i => i.type === type)
    }

    return items.sort((a, b) => b.lastAccessed - a.lastAccessed)
  }

  /**
   * 检查敏感数据是否存在
   */
  async hasSecret(id: string): Promise<boolean> {
    if (this.itemCache.has(id)) return true
    const record = await indexedDBService.getData<EncryptedSensitiveData>(this.STORE_NAME, `secret:${id}`)
    return record !== null
  }

  // ==========================================================================
  // 自动检测与存储
  // ==========================================================================

  /**
   * 检测字段名是否为敏感字段
   */
  isSensitiveField(fieldName: string): boolean {
    return SENSITIVE_FIELD_PATTERNS.some(p => p.pattern.test(fieldName))
  }

  /**
   * 检测并存储敏感值（如果字段名匹配敏感模式）
   */
  async storeIfSensitive(id: string, fieldName: string, value: string, options?: { provider?: string }): Promise<boolean> {
    for (const pattern of SENSITIVE_FIELD_PATTERNS) {
      if (pattern.pattern.test(fieldName)) {
        await this.storeSecret(id, value, pattern.type, {
          label: pattern.label,
          provider: options?.provider,
        })
        return true
      }
    }
    return false
  }

  // ==========================================================================
  // 安全审计
  // ==========================================================================

  /**
   * 获取审计日志
   */
  getAuditLog(limit?: number) {
    return securityVault.getAuditLog(limit)
  }

  /**
   * 获取安全评分
   */
  getSecurityScore(): number {
    return securityVault.getSecurityScore()
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  private requireUnlocked(): void {
    if (!this.initialized) {
      throw new Error('SecureStorage not initialized. Call initialize() first.')
    }
    if (!this.unlocked) {
      throw new Error('SecureStorage is locked. Call unlock() first.')
    }
  }

  private scheduleAutoLock(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer)
    }

    this.autoLockTimer = setTimeout(() => {
      this.lock()
      logger.info('[SecureStorage] Auto-locked due to inactivity')
    }, this.AUTO_LOCK_MS)
  }

  private serializeEncryptedData(data: EncryptedData): string {
    const obj = {
      ciphertext: this.arrayBufferToBase64(data.ciphertext),
      iv: this.arrayBufferToBase64(data.iv),
      salt: this.arrayBufferToBase64(data.salt),
      version: data.version,
      algorithm: data.algorithm,
    }
    return btoa(JSON.stringify(obj))
  }

  private deserializeEncryptedData(serialized: string): EncryptedData {
    const obj = JSON.parse(atob(serialized))
    return {
      ciphertext: this.base64ToArrayBuffer(obj.ciphertext),
      iv: new Uint8Array(this.base64ToArrayBuffer(obj.iv)),
      salt: new Uint8Array(this.base64ToArrayBuffer(obj.salt)),
      version: obj.version,
      algorithm: obj.algorithm,
    }
  }

  private guessLabel(id: string): string {
    // 从 ID 猜测标签名
    const parts = id.replace(/[_-]/g, ' ').split(/\s+/)
    return parts
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

// ============================================================================
// 单例
// ============================================================================

export const secureStorage = new SecureStorageManager()