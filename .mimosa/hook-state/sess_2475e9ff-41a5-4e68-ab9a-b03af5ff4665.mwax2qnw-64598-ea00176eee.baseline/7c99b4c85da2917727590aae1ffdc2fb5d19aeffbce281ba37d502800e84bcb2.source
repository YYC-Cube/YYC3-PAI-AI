/**
 * @file crypto-store.ts
 * @description 加密状态管理模块，管理加密和解密操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags crypto,security,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== Type Definitions (对齐 Guidelines: AES-GCM, key derived from passphrase) =====

/** 加密数据包 */
export interface EncryptedPayload {
  /** Base64 编码的 IV */
  iv: string
  /** Base64 编码的密文 */
  data: string
  /** Base64 编码的盐 */
  salt: string
  /** 算法标识 */
  algorithm: 'AES-GCM-256'
  /** 创建时间 */
  timestamp: number
}

/** 安全审计日志 */
export interface SecurityAuditEntry {
  id: string
  action: 'encrypt' | 'decrypt' | 'key_derive' | 'passphrase_set' | 'passphrase_verify' | 'vault_lock' | 'vault_unlock'
  target: string
  success: boolean
  timestamp: number
  details?: string
}

/** 安全状态 */
interface CryptoStoreState {
  /** 是否已设置主密码 */
  passphraseSet: boolean
  /** 保险库是否已解锁 */
  vaultUnlocked: boolean
  /** 加密数据计数 */
  encryptedItemCount: number
  /** 审计日志 */
  auditLog: SecurityAuditEntry[]
  /** 安全面板可见 */
  panelVisible: boolean
  /** 上次解锁时间 */
  lastUnlockTime: number | null
  /** 自动锁定超时（分钟） */
  autoLockTimeout: number
  /** 加密强度 */
  encryptionStrength: 'standard' | 'high' | 'maximum'
}

// ===== Constants =====
const LS_KEY = 'yyc3_crypto_store'
const LS_SALT_KEY = 'yyc3_master_salt'
const LS_VERIFY_KEY = 'yyc3_passphrase_verify'
const LS_VAULT_KEY = 'yyc3_encrypted_vault'
const MAX_AUDIT = 100
const PBKDF2_ITERATIONS: Record<string, number> = { standard: 100000, high: 250000, maximum: 600000 }

// ===== Persistence =====
function loadState(): Partial<CryptoStoreState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(s: CryptoStoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      passphraseSet: s.passphraseSet,
      encryptedItemCount: s.encryptedItemCount,
      autoLockTimeout: s.autoLockTimeout,
      encryptionStrength: s.encryptionStrength,
      auditLog: s.auditLog.slice(0, MAX_AUDIT),
    }))
  } catch { /* ignore */ }
}

// ===== Module Store =====
const persisted = loadState()
let state: CryptoStoreState = {
  passphraseSet: persisted.passphraseSet ?? !!localStorage.getItem(LS_VERIFY_KEY),
  vaultUnlocked: false,
  encryptedItemCount: persisted.encryptedItemCount ?? 0,
  auditLog: persisted.auditLog ?? [],
  panelVisible: false,
  lastUnlockTime: null,
  autoLockTimeout: persisted.autoLockTimeout ?? 30,
  encryptionStrength: persisted.encryptionStrength ?? 'standard',
}

const listeners = new Set<() => void>()
function emit() { saveState(state); listeners.forEach(fn => fn()) }
function genId() { return 'sec_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) }

// ===== Internal Crypto Key Cache =====
let _derivedKey: CryptoKey | null = null

function addAudit(action: SecurityAuditEntry['action'], target: string, success: boolean, details?: string) {
  const entry: SecurityAuditEntry = { id: genId(), action, target, success, timestamp: Date.now(), details }
  state = { ...state, auditLog: [entry, ...state.auditLog].slice(0, MAX_AUDIT) }
}

// ===== Low-level Crypto Helpers (对齐 Guidelines: AES-GCM + PBKDF2) =====

/** 将 ArrayBuffer 转 Base64 */
function bufToBase64(buf: ArrayBufferLike): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)))
}

/** 将 Base64 转 ArrayBuffer */
function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

/** 生成随机盐 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/** 生成随机 IV */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}

/** PBKDF2 派生 AES-GCM-256 密钥 */
async function deriveKey(passphrase: string, salt: Uint8Array, iterations?: number): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const iters = iterations ?? PBKDF2_ITERATIONS[state.encryptionStrength]
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: iters, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** AES-GCM 加密 */
async function aesEncrypt(key: CryptoKey, plaintext: string, salt: Uint8Array): Promise<EncryptedPayload> {
  const iv = generateIV()
  const enc = new TextEncoder()
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(plaintext))
  return {
    iv: bufToBase64(iv.buffer),
    data: bufToBase64(cipherBuf),
    salt: bufToBase64(salt.buffer),
    algorithm: 'AES-GCM-256',
    timestamp: Date.now(),
  }
}

/** AES-GCM 解密 */
async function aesDecrypt(key: CryptoKey, payload: EncryptedPayload): Promise<string> {
  const iv = new Uint8Array(base64ToBuf(payload.iv))
  const cipherBuf = base64ToBuf(payload.data)
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf)
  return new TextDecoder().decode(plainBuf)
}

// ===== Actions =====
export const cryptoStoreActions = {

  // ===== Passphrase Management =====

  /** 设置主密码（首次设置或更改） */
  async setPassphrase(passphrase: string): Promise<boolean> {
    try {
      const salt = generateSalt()
      const key = await deriveKey(passphrase, salt)

      // 生成验证令牌（加密已知字符串以验证密码）
      const verifyPayload = await aesEncrypt(key, 'YYC3_VAULT_VERIFY_TOKEN_v4.8.0', salt)

      // 存储盐和验证令牌
      localStorage.setItem(LS_SALT_KEY, bufToBase64(salt.buffer))
      localStorage.setItem(LS_VERIFY_KEY, JSON.stringify(verifyPayload))

      _derivedKey = key
      addAudit('passphrase_set', 'master_passphrase', true)
      state = { ...state, passphraseSet: true, vaultUnlocked: true, lastUnlockTime: Date.now() }
      emit()
      return true
    } catch (err) {
      addAudit('passphrase_set', 'master_passphrase', false, String(err))
      emit()
      return false
    }
  },

  /** 验证并解锁保险库 */
  async unlockVault(passphrase: string): Promise<boolean> {
    try {
      const saltB64 = localStorage.getItem(LS_SALT_KEY)
      const verifyRaw = localStorage.getItem(LS_VERIFY_KEY)
      if (!saltB64 || !verifyRaw) {
        addAudit('passphrase_verify', 'master_passphrase', false, 'No passphrase configured')
        emit()
        return false
      }

      const salt = new Uint8Array(base64ToBuf(saltB64))
      const key = await deriveKey(passphrase, salt)
      const verifyPayload: EncryptedPayload = JSON.parse(verifyRaw)

      const decrypted = await aesDecrypt(key, verifyPayload)
      if (decrypted !== 'YYC3_VAULT_VERIFY_TOKEN_v4.8.0') {
        addAudit('passphrase_verify', 'master_passphrase', false, 'Token mismatch')
        emit()
        return false
      }

      _derivedKey = key
      addAudit('vault_unlock', 'vault', true)
      state = { ...state, vaultUnlocked: true, lastUnlockTime: Date.now() }
      emit()
      return true
    } catch {
      addAudit('passphrase_verify', 'master_passphrase', false, 'Decryption failed')
      emit()
      return false
    }
  },

  /** 锁定保险库 */
  lockVault() {
    _derivedKey = null
    addAudit('vault_lock', 'vault', true)
    state = { ...state, vaultUnlocked: false }
    emit()
  },

  // ===== Encrypt / Decrypt Public API =====

  /** 加密字符串（需要保险库已解锁） */
  async encrypt(plaintext: string, label?: string): Promise<EncryptedPayload | null> {
    if (!_derivedKey) {
      addAudit('encrypt', label ?? 'unknown', false, 'Vault locked')
      emit()
      return null
    }
    try {
      const saltB64 = localStorage.getItem(LS_SALT_KEY)
      const salt = saltB64 ? new Uint8Array(base64ToBuf(saltB64)) : generateSalt()
      const payload = await aesEncrypt(_derivedKey, plaintext, salt)
      addAudit('encrypt', label ?? 'data', true)
      state = { ...state, encryptedItemCount: state.encryptedItemCount + 1 }
      emit()
      return payload
    } catch (err) {
      addAudit('encrypt', label ?? 'data', false, String(err))
      emit()
      return null
    }
  },

  /** 解密数据（需要保险库已解锁） */
  async decrypt(payload: EncryptedPayload, label?: string): Promise<string | null> {
    if (!_derivedKey) {
      addAudit('decrypt', label ?? 'unknown', false, 'Vault locked')
      emit()
      return null
    }
    try {
      const result = await aesDecrypt(_derivedKey, payload)
      addAudit('decrypt', label ?? 'data', true)
      emit()
      return result
    } catch (err) {
      addAudit('decrypt', label ?? 'data', false, String(err))
      emit()
      return null
    }
  },

  // ===== Vault Storage (加密键值存储) =====

  /** 安全存储键值对 */
  async vaultSet(key: string, value: string): Promise<boolean> {
    const encrypted = await cryptoStoreActions.encrypt(value, `vault:${key}`)
    if (!encrypted) return false
    try {
      const vault = JSON.parse(localStorage.getItem(LS_VAULT_KEY) ?? '{}')
      vault[key] = encrypted
      localStorage.setItem(LS_VAULT_KEY, JSON.stringify(vault))
      return true
    } catch { return false }
  },

  /** 安全读取键值对 */
  async vaultGet(key: string): Promise<string | null> {
    try {
      const vault = JSON.parse(localStorage.getItem(LS_VAULT_KEY) ?? '{}')
      const payload = vault[key]
      if (!payload) return null
      return await cryptoStoreActions.decrypt(payload as EncryptedPayload, `vault:${key}`)
    } catch { return null }
  },

  /** 删除保险库中的键 */
  vaultDelete(key: string): boolean {
    try {
      const vault = JSON.parse(localStorage.getItem(LS_VAULT_KEY) ?? '{}')
      delete vault[key]
      localStorage.setItem(LS_VAULT_KEY, JSON.stringify(vault))
      state = { ...state, encryptedItemCount: Math.max(0, state.encryptedItemCount - 1) }
      emit()
      return true
    } catch { return false }
  },

  /** 列出保险库键名 */
  vaultKeys(): string[] {
    try {
      const vault = JSON.parse(localStorage.getItem(LS_VAULT_KEY) ?? '{}')
      return Object.keys(vault)
    } catch { return [] }
  },

  // ===== Settings =====

  /** 设置自动锁定超时 */
  setAutoLockTimeout(minutes: number) {
    state = { ...state, autoLockTimeout: minutes }
    emit()
  },

  /** 设置加密强度 */
  setEncryptionStrength(strength: CryptoStoreState['encryptionStrength']) {
    state = { ...state, encryptionStrength: strength }
    emit()
  },

  /** 清除审计日志 */
  clearAuditLog() {
    state = { ...state, auditLog: [] }
    emit()
  },

  /** 打开安全面板 */
  openPanel() { state = { ...state, panelVisible: true }; emit() },

  /** 关闭安全面板 */
  closePanel() { state = { ...state, panelVisible: false }; emit() },

  /** 获取保险库是否已解锁 */
  isVaultUnlocked(): boolean { return state.vaultUnlocked },
}

// ===== Auto-lock Timer =====
let autoLockTimer: ReturnType<typeof setInterval> | null = null
function startAutoLockCheck() {
  if (autoLockTimer) clearInterval(autoLockTimer)
  autoLockTimer = setInterval(() => {
    if (state.vaultUnlocked && state.lastUnlockTime && state.autoLockTimeout > 0) {
      const elapsed = (Date.now() - state.lastUnlockTime) / 60000
      if (elapsed >= state.autoLockTimeout) {
        cryptoStoreActions.lockVault()
      }
    }
  }, 30000) // check every 30s
}
startAutoLockCheck()

// ===== React Hook =====
export function useCryptoStore() {
  const snapshot = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    () => state,
  )
  return { ...snapshot, ...cryptoStoreActions }
}
