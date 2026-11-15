/**
 * @file security-vault.test.ts
 * @description 安全保险库测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityVault } from '../../services/security-vault'

const isNodeEnv = typeof (globalThis as any)?.process?.versions?.node === 'string'

describe('SecurityVault', () => {
  let vault: SecurityVault

  beforeEach(() => {
    localStorage.clear()
    vault = new SecurityVault()
  })

  describe('constructor', () => {
    it('should start locked and uninitialized', () => {
      expect(vault.isLocked()).toBe(true)
      expect(vault.isInitialized()).toBe(false)
    })

    it('should accept custom config', () => {
      const custom = new SecurityVault({
        keyDerivationIterations: 50000,
        keyLength: 128,
      })
      expect(custom.isLocked()).toBe(true)
    })

    it('should detect existing initialization', () => {
      localStorage.setItem('yyc3-vault-key', 'test')
      localStorage.setItem('yyc3-vault-salt', 'test')
      const existing = new SecurityVault()
      expect(existing.isInitialized()).toBe(true)
    })
  })

  describe('initialize', () => {
    it('should initialize with a passphrase', async () => {
      await vault.initialize('my-passphrase')
      expect(vault.isInitialized()).toBe(true)
      expect(vault.isLocked()).toBe(false)
    })

    it('should store vault key and salt in localStorage', async () => {
      await vault.initialize('my-passphrase')
      expect(localStorage.getItem('yyc3-vault-key')).toBeTruthy()
      expect(localStorage.getItem('yyc3-vault-salt')).toBeTruthy()
    })

    it('should throw if already initialized', async () => {
      await vault.initialize('my-passphrase')
      await expect(vault.initialize('another')).rejects.toThrow('already initialized')
    })
  })

  describe('unlock', () => {
    it.skipIf(isNodeEnv)('should unlock with correct passphrase', async () => {
      await vault.initialize('my-passphrase')
      vault.lock()
      expect(vault.isLocked()).toBe(true)

      const result = await vault.unlock('my-passphrase')
      expect(result).toBe(true)
      expect(vault.isLocked()).toBe(false)
    })

    it('should fail with wrong passphrase', async () => {
      await vault.initialize('my-passphrase')
      vault.lock()

      const result = await vault.unlock('wrong')
      expect(result).toBe(false)
      expect(vault.isLocked()).toBe(true)
    })

    it('should throw if not initialized', async () => {
      await expect(vault.unlock('pass')).rejects.toThrow('not initialized')
    })

    it('should lock out after max failed attempts', async () => {
      await vault.initialize('my-passphrase')
      vault.lock()

      for (let i = 0; i < 5; i++) {
        await vault.unlock('wrong')
      }

      await expect(vault.unlock('wrong')).rejects.toThrow('locked')
    })

    it.skipIf(isNodeEnv)('should reset failed attempts on successful unlock', async () => {
      await vault.initialize('my-passphrase')
      vault.lock()

      await vault.unlock('wrong')
      const result = await vault.unlock('my-passphrase')

      expect(result).toBe(true)
      expect(vault.getStatus().failedAttempts).toBe(0)
    })
  })

  describe('lock', () => {
    it('should lock the vault', async () => {
      await vault.initialize('my-passphrase')
      vault.lock()
      expect(vault.isLocked()).toBe(true)
    })
  })

  describe('encrypt / decrypt', () => {
    beforeEach(async () => {
      await vault.initialize('my-passphrase')
    })

    it('should encrypt and decrypt data', async () => {
      const data = new TextEncoder().encode('Hello, World!')
      const encrypted = await vault.encrypt(data.buffer as ArrayBuffer)

      expect(encrypted.ciphertext).toBeTruthy()
      expect(encrypted.iv).toBeTruthy()
      expect(encrypted.salt).toBeTruthy()
      expect(encrypted.version).toBe(1)

      const decrypted = await vault.decrypt(encrypted)
      const text = new TextDecoder().decode(decrypted)
      expect(text).toBe('Hello, World!')
    })

    it('should throw if vault is locked', async () => {
      vault.lock()
      const data = new TextEncoder().encode('test')
      await expect(vault.encrypt(data.buffer as ArrayBuffer)).rejects.toThrow('locked')
    })

    it('should throw on decrypt when locked', async () => {
      const data = new TextEncoder().encode('test')
      const encrypted = await vault.encrypt(data.buffer as ArrayBuffer)
      vault.lock()
      await expect(vault.decrypt(encrypted)).rejects.toThrow('locked')
    })

    it('should produce different ciphertext for same plaintext', async () => {
      const data = new TextEncoder().encode('same data')
      const e1 = await vault.encrypt(data.buffer as ArrayBuffer)
      const e2 = await vault.encrypt(data.buffer as ArrayBuffer)

      expect(e1.iv).not.toEqual(e2.iv)
    })
  })

  describe('changePassphrase', () => {
    it.skipIf(isNodeEnv)('should change passphrase successfully', async () => {
      await vault.initialize('old-pass')
      const result = await vault.changePassphrase('old-pass', 'new-pass')
      expect(result).toBe(true)

      vault.lock()
      expect(await vault.unlock('new-pass')).toBe(true)
    })

    it('should fail with wrong old passphrase when locked', async () => {
      await vault.initialize('old-pass')
      vault.lock()
      const result = await vault.changePassphrase('wrong', 'new-pass')
      expect(result).toBe(false)
    })

    it('should throw if not initialized', async () => {
      await expect(vault.changePassphrase('old', 'new')).rejects.toThrow('not initialized')
    })
  })

  describe('getStatus', () => {
    it('should return vault status', () => {
      const status = vault.getStatus()
      expect(status.isLocked).toBe(true)
      expect(status.isInitialized).toBe(false)
      expect(status.failedAttempts).toBe(0)
    })
  })

  describe('getAuditLog', () => {
    it('should return empty log initially', () => {
      expect(vault.getAuditLog()).toEqual([])
    })

    it('should log actions', async () => {
      await vault.initialize('pass')
      const log = vault.getAuditLog()
      expect(log.length).toBeGreaterThan(0)
      expect(log[0].action).toBe('unlock')
      expect(log[0].success).toBe(true)
    })

    it('should limit log entries', async () => {
      await vault.initialize('pass')
      const log = vault.getAuditLog(1)
      expect(log.length).toBe(1)
    })
  })

  describe('clearAuditLog', () => {
    it('should clear all log entries', async () => {
      await vault.initialize('pass')
      vault.clearAuditLog()
      expect(vault.getAuditLog()).toEqual([])
    })
  })

  describe('getSecurityScore', () => {
    it('should return 0 if not initialized', () => {
      expect(vault.getSecurityScore()).toBe(0)
    })

    it('should return high score for secure config', async () => {
      await vault.initialize('pass')
      expect(vault.getSecurityScore()).toBeGreaterThanOrEqual(80)
    })

    it('should reduce score for weak config', () => {
      const weak = new SecurityVault({ keyLength: 128, keyDerivationIterations: 50000 })
      expect(weak.getSecurityScore()).toBe(0)
    })
  })

  describe('destroy', () => {
    it('should remove all vault data', async () => {
      await vault.initialize('pass')
      vault.destroy()

      expect(vault.isInitialized()).toBe(false)
      expect(vault.isLocked()).toBe(true)
      expect(localStorage.getItem('yyc3-vault-key')).toBeNull()
      expect(localStorage.getItem('yyc3-vault-salt')).toBeNull()
    })
  })
})
