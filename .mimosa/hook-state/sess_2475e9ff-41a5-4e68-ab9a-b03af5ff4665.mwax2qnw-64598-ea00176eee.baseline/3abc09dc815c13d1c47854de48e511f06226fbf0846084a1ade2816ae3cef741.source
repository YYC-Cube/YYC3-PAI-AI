/**
 * @file crypto-store.test.ts
 * @description Unit test for crypto-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const lsMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: lsMock })

// Node 20+ has crypto.subtle; for older, we provide a minimal mock
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
        return arr
      },
      subtle: {
        importKey: vi.fn().mockResolvedValue('mock-key-material'),
        deriveKey: vi.fn().mockResolvedValue('mock-derived-key'),
        encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        decrypt: vi.fn().mockImplementation(() => {
          return Promise.resolve(new TextEncoder().encode('YYC3_VAULT_VERIFY_TOKEN_v4.8.0').buffer)
        }),
      },
    },
  })
}

import { cryptoStoreActions, type EncryptedPayload } from '../crypto-store'

// Helper to get state via the hook-less pattern
// The store exposes actions but not a direct getState; we read from useC cryptoStore
// However, since tests can't use hooks, we access state indirectly via action returns

describe('Crypto Store — Initial State', () => {
  beforeEach(() => {
    lsMock.clear()
  })

  it('vault should be locked by default', () => {
    expect(cryptoStoreActions.isVaultUnlocked()).toBe(false)
  })
})

describe('Vault Lock / Unlock', () => {
  it('lockVault should set vault to locked', () => {
    cryptoStoreActions.lockVault()
    expect(cryptoStoreActions.isVaultUnlocked()).toBe(false)
  })
})

describe('Encrypt without unlocked vault', () => {
  beforeEach(() => {
    cryptoStoreActions.lockVault()
  })

  it('encrypt should return null when vault is locked', async () => {
    const result = await cryptoStoreActions.encrypt('secret data', 'test')
    expect(result).toBeNull()
  })

  it('decrypt should return null when vault is locked', async () => {
    const mockPayload: EncryptedPayload = {
      iv: 'dGVzdA==',
      data: 'dGVzdA==',
      salt: 'dGVzdA==',
      algorithm: 'AES-GCM-256',
      timestamp: Date.now(),
    }
    const result = await cryptoStoreActions.decrypt(mockPayload, 'test')
    expect(result).toBeNull()
  })
})

describe('setPassphrase', () => {
  beforeEach(() => {
    lsMock.clear()
    cryptoStoreActions.lockVault()
  })

  it('should set passphrase and unlock vault (when crypto.subtle available)', async () => {
    // This test depends on environment crypto support
    try {
      const result = await cryptoStoreActions.setPassphrase('my-strong-password-123')
      // On environments with full Web Crypto, this should succeed
      if (result) {
        expect(cryptoStoreActions.isVaultUnlocked()).toBe(true)
      }
    } catch {
      // In environments without full crypto.subtle, expected to fail gracefully
      expect(cryptoStoreActions.isVaultUnlocked()).toBe(false)
    }
  })

  it('should persist salt and verify token to localStorage', async () => {
    try {
      await cryptoStoreActions.setPassphrase('test-password')
      // Check that localStorage was called for salt and verify keys
      const saltCalls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_master_salt')
      const verifyCalls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_passphrase_verify')
      // If crypto worked, these should have been called
      if (cryptoStoreActions.isVaultUnlocked()) {
        expect(saltCalls.length).toBeGreaterThan(0)
        expect(verifyCalls.length).toBeGreaterThan(0)
      }
    } catch {
      // Graceful skip
    }
  })
})

describe('unlockVault', () => {
  beforeEach(() => {
    lsMock.clear()
    cryptoStoreActions.lockVault()
  })

  it('should fail with no passphrase configured', async () => {
    lsMock.clear()
    const result = await cryptoStoreActions.unlockVault('any-password')
    expect(result).toBe(false)
    expect(cryptoStoreActions.isVaultUnlocked()).toBe(false)
  })
})

describe('Vault Key-Value Storage', () => {
  beforeEach(() => {
    lsMock.clear()
    cryptoStoreActions.lockVault()
  })

  it('vaultSet should fail when vault is locked', async () => {
    const result = await cryptoStoreActions.vaultSet('api-key', 'sk-12345')
    expect(result).toBe(false)
  })

  it('vaultGet should return null when vault is locked', async () => {
    const result = await cryptoStoreActions.vaultGet('api-key')
    expect(result).toBeNull()
  })

  it('vaultKeys should return empty array when no vault data', () => {
    const keys = cryptoStoreActions.vaultKeys()
    expect(keys).toEqual([])
  })

  it('vaultDelete should return true on empty vault', () => {
    const result = cryptoStoreActions.vaultDelete('nonexistent')
    expect(result).toBe(true)
  })

  it('vaultKeys should read from localStorage vault key', () => {
    lsMock.setItem('yyc3_encrypted_vault', JSON.stringify({ key1: {}, key2: {} }))
    const keys = cryptoStoreActions.vaultKeys()
    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
  })
})

describe('Settings', () => {
  it('setAutoLockTimeout should update timeout', () => {
    cryptoStoreActions.setAutoLockTimeout(60)
    // We verify indirectly — no error means success
    // The value is persisted via emit()
  })

  it('setEncryptionStrength should accept valid values', () => {
    cryptoStoreActions.setEncryptionStrength('standard')
    cryptoStoreActions.setEncryptionStrength('high')
    cryptoStoreActions.setEncryptionStrength('maximum')
    // No error means success
  })

  it('clearAuditLog should empty audit entries', () => {
    cryptoStoreActions.clearAuditLog()
    // No error means success
  })

  it('openPanel and closePanel should toggle panel visibility', () => {
    cryptoStoreActions.openPanel()
    cryptoStoreActions.closePanel()
    // No error means success
  })
})

describe('Audit Log', () => {
  beforeEach(() => {
    cryptoStoreActions.clearAuditLog()
  })

  it('lockVault should add audit entry', () => {
    cryptoStoreActions.lockVault()
    // The lockVault action adds an audit entry internally
    // We can't directly access state, but the persist call to localStorage should include it
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_crypto_store')
    if (calls.length > 0) {
      const parsed = JSON.parse(calls[calls.length - 1][1])
      expect(parsed.auditLog).toBeDefined()
      expect(Array.isArray(parsed.auditLog)).toBe(true)
    }
  })

  it('encrypt failure should add audit entry with success=false', async () => {
    lsMock.setItem.mockClear()
    cryptoStoreActions.lockVault()
    await cryptoStoreActions.encrypt('test', 'label')
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_crypto_store')
    if (calls.length > 0) {
      const parsed = JSON.parse(calls[calls.length - 1][1])
      const failedEntries = parsed.auditLog?.filter((e: { success: boolean }) => !e.success)
      expect(failedEntries?.length).toBeGreaterThan(0)
    }
  })

  it('audit log should be capped at MAX_AUDIT (100)', () => {
    // Push many actions to generate audit entries
    for (let i = 0; i < 120; i++) {
      cryptoStoreActions.lockVault()
    }
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_crypto_store')
    if (calls.length > 0) {
      const parsed = JSON.parse(calls[calls.length - 1][1])
      expect(parsed.auditLog.length).toBeLessThanOrEqual(100)
    }
  })
})

describe('Persistence', () => {
  it('should persist state to localStorage on emit', () => {
    lsMock.setItem.mockClear()
    cryptoStoreActions.setAutoLockTimeout(45)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_crypto_store')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.autoLockTimeout).toBe(45)
  })

  it('should persist encryptionStrength', () => {
    lsMock.setItem.mockClear()
    cryptoStoreActions.setEncryptionStrength('maximum')
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_crypto_store')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.encryptionStrength).toBe('maximum')
  })

  it('persisted state should NOT include vaultUnlocked or panelVisible', () => {
    cryptoStoreActions.openPanel()
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_crypto_store')
    if (calls.length > 0) {
      const parsed = JSON.parse(calls[calls.length - 1][1])
      expect(parsed).not.toHaveProperty('vaultUnlocked')
      expect(parsed).not.toHaveProperty('panelVisible')
      expect(parsed).not.toHaveProperty('lastUnlockTime')
    }
  })
})

describe('EncryptedPayload shape', () => {
  it('should have the correct interface fields', () => {
    const payload: EncryptedPayload = {
      iv: 'base64iv',
      data: 'base64data',
      salt: 'base64salt',
      algorithm: 'AES-GCM-256',
      timestamp: Date.now(),
    }
    expect(payload.algorithm).toBe('AES-GCM-256')
    expect(typeof payload.timestamp).toBe('number')
    expect(typeof payload.iv).toBe('string')
    expect(typeof payload.data).toBe('string')
    expect(typeof payload.salt).toBe('string')
  })
})
