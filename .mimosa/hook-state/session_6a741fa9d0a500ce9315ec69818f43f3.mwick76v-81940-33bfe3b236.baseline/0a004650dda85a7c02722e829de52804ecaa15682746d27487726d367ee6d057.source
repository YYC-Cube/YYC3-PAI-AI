/**
 * @file security-vault.ts
 * @description 安全保险库 - 端到端加密和安全密钥管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @updated 2026-04-08
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,vault,encryption,crypto
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface VaultConfig {
  keyDerivationIterations: number
  saltLength: number
  ivLength: number
  tagLength: number
  algorithm: 'AES-GCM' | 'AES-CBC'
  keyLength: 256 | 128
}

export interface VaultStatus {
  isLocked: boolean
  isInitialized: boolean
  lastAccess?: number
  failedAttempts: number
  lockedUntil?: number
}

export interface EncryptedData {
  ciphertext: ArrayBuffer
  iv: Uint8Array
  salt: Uint8Array
  tag?: ArrayBuffer
  version: number
  algorithm: string
}

export interface VaultAuditLog {
  id: string
  action: 'unlock' | 'lock' | 'encrypt' | 'decrypt' | 'change-passphrase' | 'failed-attempt'
  timestamp: number
  success: boolean
  details?: string
}

// ============================================================================
// 安全保险库
// ============================================================================

export class SecurityVault {
  private config: VaultConfig
  private status: VaultStatus
  private masterKey: CryptoKey | null = null
  private auditLog: VaultAuditLog[] = []
  private readonly VAULT_KEY = 'yyc3-vault-key'
  private readonly VAULT_SALT = 'yyc3-vault-salt'
  private readonly VAULT_IV = 'yyc3-vault-iv'
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 300000 // 5 minutes

  constructor(config?: Partial<VaultConfig>) {
    this.config = {
      keyDerivationIterations: 100000,
      saltLength: 16,
      ivLength: 12,
      tagLength: 128,
      algorithm: 'AES-GCM',
      keyLength: 256,
      ...config,
    }

    this.status = {
      isLocked: true,
      isInitialized: false,
      failedAttempts: 0,
    }

    this.checkInitialization()
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 初始化保险库
   */
  async initialize(passphrase: string): Promise<void> {
    if (this.status.isInitialized) {
      throw new Error('Vault is already initialized')
    }

    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength))
    const key = await this.deriveKey(passphrase, salt)

    const testData = new TextEncoder().encode('vault-test')
    const encrypted = await this.encryptWithKey(key, testData.slice().buffer as ArrayBuffer)

    localStorage.setItem(this.VAULT_KEY, this.arrayBufferToBase64(encrypted.ciphertext))
    localStorage.setItem(this.VAULT_SALT, this.arrayBufferToBase64(salt.slice().buffer as ArrayBuffer))
    localStorage.setItem(this.VAULT_IV, this.arrayBufferToBase64(encrypted.iv.slice().buffer as ArrayBuffer))

    this.status.isInitialized = true
    this.status.isLocked = false
    this.masterKey = key

    this.logAction('unlock', true, 'Vault initialized')
  }

  /**
   * 解锁保险库
   */
  async unlock(passphrase: string): Promise<boolean> {
    if (!this.status.isInitialized) {
      throw new Error('Vault is not initialized')
    }

    if (this.isLockedOut()) {
      const remaining = Math.ceil((this.status.lockedUntil! - Date.now()) / 1000)
      throw new Error(`Vault is locked. Try again in ${remaining} seconds`)
    }

    try {
      const saltBase64 = localStorage.getItem(this.VAULT_SALT)
      if (!saltBase64) throw new Error('Vault salt not found')

      const salt = this.base64ToArrayBuffer(saltBase64)
      const key = await this.deriveKey(passphrase, new Uint8Array(salt))

      const testDataBase64 = localStorage.getItem(this.VAULT_KEY)
      if (!testDataBase64) throw new Error('Vault key not found')

      const ivBase64 = localStorage.getItem(this.VAULT_IV)
      const iv = ivBase64
        ? new Uint8Array(this.base64ToArrayBuffer(ivBase64))
        : new Uint8Array(this.config.ivLength)

      const testData = this.base64ToArrayBuffer(testDataBase64)
      const decrypted = await this.decryptWithKey(key, {
        ciphertext: testData,
        iv,
        salt: new Uint8Array(salt),
        version: 1,
        algorithm: this.config.algorithm,
      })

      const expected = new TextEncoder().encode('vault-test')
      if (!this.arrayBuffersEqual(decrypted, expected.slice().buffer as ArrayBuffer)) {
        throw new Error('Invalid passphrase')
      }

      this.masterKey = key
      this.status.isLocked = false
      this.status.failedAttempts = 0
      this.status.lastAccess = Date.now()
      this.status.lockedUntil = undefined

      this.logAction('unlock', true)
      return true

    } catch {
      this.status.failedAttempts++

      if (this.status.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        this.status.lockedUntil = Date.now() + this.LOCKOUT_DURATION
        this.logAction('failed-attempt', false, 'Max attempts reached, vault locked')
      } else {
        this.logAction('failed-attempt', false, `Attempt ${this.status.failedAttempts}/${this.MAX_FAILED_ATTEMPTS}`)
      }

      return false
    }
  }

  /**
   * 锁定保险库
   */
  lock(): void {
    this.masterKey = null
    this.status.isLocked = true
    this.logAction('lock', true)
  }

  /**
   * 加密数据
   */
  async encrypt(data: ArrayBuffer): Promise<EncryptedData> {
    if (this.status.isLocked || !this.masterKey) {
      throw new Error('Vault is locked')
    }

    const encrypted = await this.encryptWithKey(this.masterKey, data)
    this.logAction('encrypt', true, `${data.byteLength} bytes`)
    return encrypted
  }

  /**
   * 解密数据
   */
  async decrypt(encrypted: EncryptedData): Promise<ArrayBuffer> {
    if (this.status.isLocked || !this.masterKey) {
      throw new Error('Vault is locked')
    }

    const decrypted = await this.decryptWithKey(this.masterKey, encrypted)
    this.logAction('decrypt', true, `${decrypted.byteLength} bytes`)
    return decrypted
  }

  /**
   * 更改密码
   */
  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<boolean> {
    if (!this.status.isInitialized) {
      throw new Error('Vault is not initialized')
    }

    const wasLocked = this.status.isLocked
    if (wasLocked) {
      const unlocked = await this.unlock(oldPassphrase)
      if (!unlocked) {
        this.logAction('change-passphrase', false, 'Invalid old passphrase')
        return false
      }
    }

    try {
      const newSalt = crypto.getRandomValues(new Uint8Array(this.config.saltLength))
      const newKey = await this.deriveKey(newPassphrase, newSalt)

      const testData = new TextEncoder().encode('vault-test')
      const encrypted = await this.encryptWithKey(newKey, testData.slice().buffer as ArrayBuffer)

      localStorage.setItem(this.VAULT_KEY, this.arrayBufferToBase64(encrypted.ciphertext))
      localStorage.setItem(this.VAULT_SALT, this.arrayBufferToBase64(newSalt.slice().buffer as ArrayBuffer))
      localStorage.setItem(this.VAULT_IV, this.arrayBufferToBase64(encrypted.iv.slice().buffer as ArrayBuffer))

      this.masterKey = newKey
      this.logAction('change-passphrase', true)

      if (wasLocked) {
        this.lock()
      }

      return true

    } catch (error) {
      this.logAction('change-passphrase', false, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  /**
   * 获取保险库状态
   */
  getStatus(): VaultStatus {
    return { ...this.status }
  }

  /**
   * 获取审计日志
   */
  getAuditLog(limit = 100): VaultAuditLog[] {
    return this.auditLog.slice(-limit)
  }

  /**
   * 清除审计日志
   */
  clearAuditLog(): void {
    this.auditLog = []
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.status.isInitialized
  }

  /**
   * 检查是否已锁定
   */
  isLocked(): boolean {
    return this.status.isLocked
  }

  /**
   * 获取安全评分
   */
  getSecurityScore(): number {
    let score = 100

    if (!this.status.isInitialized) return 0
    if (this.status.failedAttempts > 0) score -= 10
    if (this.status.failedAttempts >= 3) score -= 20
    if (this.config.keyDerivationIterations < 100000) score -= 10
    if (this.config.keyLength === 128) score -= 20
    if (this.config.algorithm === 'AES-CBC') score -= 10

    return Math.max(0, score)
  }

  /**
   * 销毁保险库
   */
  destroy(): void {
    localStorage.removeItem(this.VAULT_KEY)
    localStorage.removeItem(this.VAULT_SALT)
    localStorage.removeItem(this.VAULT_IV)
    this.masterKey = null
    this.status = {
      isLocked: true,
      isInitialized: false,
      failedAttempts: 0,
    }
    this.auditLog = []
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passphraseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: (salt as Uint8Array).slice() as unknown as BufferSource,
        iterations: this.config.keyDerivationIterations,
        hash: 'SHA-256',
      },
      passphraseKey,
      {
        name: this.config.algorithm,
        length: this.config.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private async encryptWithKey(key: CryptoKey, data: ArrayBuffer): Promise<EncryptedData> {
    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength))
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength))

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.config.algorithm,
        iv: iv.slice() as unknown as BufferSource,
        tagLength: this.config.tagLength,
      },
      key,
      data
    )

    return {
      ciphertext: encrypted,
      iv,
      salt,
      version: 1,
      algorithm: this.config.algorithm,
    }
  }

  private async decryptWithKey(key: CryptoKey, encrypted: EncryptedData): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
      {
        name: this.config.algorithm,
        iv: (encrypted.iv as Uint8Array).slice() as unknown as BufferSource,
        tagLength: this.config.tagLength,
      },
      key,
      encrypted.ciphertext
    )
  }

  private checkInitialization(): void {
    const hasKey = localStorage.getItem(this.VAULT_KEY) !== null
    const hasSalt = localStorage.getItem(this.VAULT_SALT) !== null
    this.status.isInitialized = hasKey && hasSalt
  }

  private isLockedOut(): boolean {
    if (!this.status.lockedUntil) return false
    if (Date.now() >= this.status.lockedUntil) {
      this.status.lockedUntil = undefined
      this.status.failedAttempts = 0
      return false
    }
    return true
  }

  private logAction(action: VaultAuditLog['action'], success: boolean, details?: string): void {
    this.auditLog.push({
      id: crypto.randomUUID(),
      action,
      timestamp: Date.now(),
      success,
      details,
    })

    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500)
    }
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

  private arrayBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) return false
    const viewA = new Uint8Array(a)
    const viewB = new Uint8Array(b)
    for (let i = 0; i < a.byteLength; i++) {
      if (viewA[i] !== viewB[i]) return false
    }
    return true
  }
}

// ============================================================================
// 单例实例
// ============================================================================

export const securityVault = new SecurityVault({
  keyDerivationIterations: 100000,
  saltLength: 16,
  ivLength: 12,
  tagLength: 128,
  algorithm: 'AES-GCM',
  keyLength: 256,
})
