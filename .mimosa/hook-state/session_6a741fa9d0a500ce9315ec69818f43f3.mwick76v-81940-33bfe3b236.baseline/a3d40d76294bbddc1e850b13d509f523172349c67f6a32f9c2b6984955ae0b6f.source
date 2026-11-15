/**
 * @file secure-storage.test.ts
 * @description Unit tests for SecureStorageManager
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @updated 2026-06-04
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ============================================================================
// Mock external dependencies - using vi.hoisted to avoid hoisting issues
// ============================================================================

const { mockEncrypt, mockDecrypt, mockVaultInitialize, mockVaultUnlock, mockVaultLock, mockIsInitialized, mockGetAuditLog, mockGetSecurityScore } = vi.hoisted(() => ({
  mockEncrypt: vi.fn(),
  mockDecrypt: vi.fn(),
  mockVaultInitialize: vi.fn(),
  mockVaultUnlock: vi.fn(),
  mockVaultLock: vi.fn(),
  mockIsInitialized: vi.fn(),
  mockGetAuditLog: vi.fn(),
  mockGetSecurityScore: vi.fn(),
}))

vi.mock('../security-vault', () => ({
  securityVault: {
    initialize: mockVaultInitialize,
    unlock: mockVaultUnlock,
    lock: mockVaultLock,
    isInitialized: mockIsInitialized,
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
    getAuditLog: mockGetAuditLog,
    getSecurityScore: mockGetSecurityScore,
  },
}))

const { mockSetItem, mockGetData, mockDeleteItem, mockGetAll } = vi.hoisted(() => ({
  mockSetItem: vi.fn(),
  mockGetData: vi.fn(),
  mockDeleteItem: vi.fn(),
  mockGetAll: vi.fn(),
}))

vi.mock('../indexeddb-service', () => ({
  indexedDBService: {
    set: mockSetItem,
    getData: mockGetData,
    delete: mockDeleteItem,
    getAll: mockGetAll,
  },
}))

// ============================================================================
// Import after mocks
// ============================================================================

import { secureStorage } from '../secure-storage'

// ============================================================================
// Helpers
// ============================================================================

const mockEncryptedData = (version = 1) => {
  const ciphertext = new Uint8Array([1, 2, 3, 4, 5]).buffer
  const iv = new Uint8Array([10, 11, 12, 13, 14, 15, 16])
  const salt = new Uint8Array([20, 21, 22, 23, 24])
  return {
    ciphertext,
    iv,
    salt,
    version,
    algorithm: 'aes-256-gcm',
  }
}

const mockDecryptedBuffer = new TextEncoder().encode('decrypted-value').buffer

describe('SecureStorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock behaviors
    mockVaultInitialize.mockResolvedValue(undefined)
    mockVaultUnlock.mockResolvedValue(true)
    mockVaultLock.mockReturnValue(undefined)
    mockIsInitialized.mockReturnValue(false)
    mockEncrypt.mockResolvedValue(mockEncryptedData())
    mockDecrypt.mockResolvedValue(mockDecryptedBuffer)
    mockGetSecurityScore.mockReturnValue(85)
    mockGetAuditLog.mockReturnValue([])
    mockSetItem.mockResolvedValue(undefined)
    mockGetData.mockResolvedValue(null)
    mockDeleteItem.mockResolvedValue(undefined)
    mockGetAll.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should initialize and unlock the vault with a passphrase', async () => {
      const key = 'test-passphrase-123'
      await secureStorage.initialize(key)

      expect(mockVaultInitialize).toHaveBeenCalledWith(key)
      expect(mockVaultUnlock).toHaveBeenCalledWith(key)
    })

    it('should not re-initialize if vault is already initialized', async () => {
      mockIsInitialized.mockReturnValue(true)

      await secureStorage.initialize('test-key')

      expect(mockVaultInitialize).not.toHaveBeenCalled()
      expect(mockVaultUnlock).toHaveBeenCalled()
    })

    it('should throw if vault unlock fails', async () => {
      mockVaultUnlock.mockResolvedValue(false)

      await expect(secureStorage.initialize('bad-key')).rejects.toThrow()
    })
  })

  describe('unlock / lock', () => {
    it('should unlock with valid credentials after initialization', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      vi.clearAllMocks()
      mockVaultUnlock.mockResolvedValue(true)

      const result = await secureStorage.unlock({ passphrase: 'key' })
      expect(result).toBe(true)
      expect(mockVaultUnlock).toHaveBeenCalledWith('key')
    })

    it('should lock the storage', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      secureStorage.lock()
      expect(mockVaultLock).toHaveBeenCalled()
    })
  })

  describe('getStatus', () => {
    it('should return proper status after initialization', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      const status = secureStorage.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.unlocked).toBe(true)
      expect(typeof status.itemCount).toBe('number')
    })
  })

  describe('storeSecret / readSecret', () => {
    it('should throw when trying to store before initialization', async () => {
      // Use a fresh instance that hasn't been initialized
      const freshStorage = new (secureStorage.constructor as any)()
      await expect(
        freshStorage.storeSecret('test-id', 'secret-value', 'api-key')
      ).rejects.toThrow('not initialized')
    })

    it('should store and retrieve a secret value', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      // Mock the encrypted data returned during store
      mockEncrypt.mockResolvedValue(mockEncryptedData())

      await secureStorage.storeSecret('my-api-key', 'sk-123456', 'api-key', {
        label: 'My API Key',
        provider: 'openai',
        metadata: { env: 'production' },
      })

      // Check that indexedDB was called to store
      expect(mockSetItem).toHaveBeenCalledWith(
        'secure-store',
        'secret:my-api-key',
        expect.objectContaining({
          item: expect.objectContaining({
            id: 'my-api-key',
            type: 'api-key',
            label: 'My API Key',
            provider: 'openai',
          }),
        }),
        expect.objectContaining({ encrypted: true, type: 'api-key' })
      )

      // Mock retrieval
      const storedRecord = {
        item: {
          id: 'my-api-key',
          type: 'api-key' as const,
          label: 'My API Key',
          provider: 'openai',
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          metadata: { env: 'production' },
        },
        encryptedValue: btoa(JSON.stringify({
          ciphertext: btoa(String.fromCharCode(...new Uint8Array([1, 2, 3, 4, 5]))),
          iv: btoa(String.fromCharCode(...new Uint8Array([10, 11, 12, 13, 14, 15, 16]))),
          salt: btoa(String.fromCharCode(...new Uint8Array([20, 21, 22, 23, 24]))),
          version: 1,
          algorithm: 'aes-256-gcm',
        })),
      }
      mockGetData.mockResolvedValue(storedRecord)

      const value = await secureStorage.readSecret('my-api-key')
      expect(value).toBe('decrypted-value')
      expect(mockDecrypt).toHaveBeenCalled()
    })

    it('should return null for non-existent secret', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      mockGetData.mockResolvedValue(null)

      const value = await secureStorage.readSecret('non-existent')
      expect(value).toBeNull()
    })
  })

  describe('deleteSecret', () => {
    it('should delete a secret from indexedDB and cache', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      await secureStorage.storeSecret('del-id', 'value', 'token')
      await secureStorage.deleteSecret('del-id')

      expect(mockDeleteItem).toHaveBeenCalledWith('secure-store', 'secret:del-id')
    })
  })

  describe('hasSecret', () => {
    it('should return true if secret exists in cache', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      await secureStorage.storeSecret('cached-id', 'value', 'password')
      const has = await secureStorage.hasSecret('cached-id')
      expect(has).toBe(true)
    })

    it('should check indexedDB if not in cache', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      mockGetData.mockResolvedValue({
        item: { id: 'db-id' },
        encryptedValue: 'mock',
      })

      const has = await secureStorage.hasSecret('db-id')
      expect(has).toBe(true)
      expect(mockGetData).toHaveBeenCalled()
    })
  })

  describe('listSecrets', () => {
    it('should return all secret items sorted by lastAccessed', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      mockGetAll.mockResolvedValue([
        {
          data: {
            item: { id: 'older', lastAccessed: 100, type: 'api-key' },
            encryptedValue: 'mock',
          },
        },
        {
          data: {
            item: { id: 'newer', lastAccessed: 200, type: 'token' },
            encryptedValue: 'mock',
          },
        },
      ])

      const items = await secureStorage.listSecrets()
      expect(items).toHaveLength(2)
      // Sorted by lastAccessed descending
      expect(items[0].id).toBe('newer')
      expect(items[1].id).toBe('older')
    })

    it('should filter by type', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      mockGetAll.mockResolvedValue([
        {
          data: {
            item: { id: 'api', lastAccessed: 100, type: 'api-key' },
            encryptedValue: 'mock',
          },
        },
        {
          data: {
            item: { id: 'tok', lastAccessed: 200, type: 'token' },
            encryptedValue: 'mock',
          },
        },
      ])

      const items = await secureStorage.listSecrets('token')
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('tok')
    })
  })

  describe('sensitive field detection', () => {
    it('should detect API key fields', () => {
      expect(secureStorage.isSensitiveField('apiKey')).toBe(true)
      expect(secureStorage.isSensitiveField('api_key')).toBe(true)
    })

    it('should detect access token fields', () => {
      expect(secureStorage.isSensitiveField('accessToken')).toBe(true)
      expect(secureStorage.isSensitiveField('access-token')).toBe(true)
    })

    it('should detect password fields', () => {
      expect(secureStorage.isSensitiveField('password')).toBe(true)
      expect(secureStorage.isSensitiveField('userPassword')).toBe(true)
    })

    it('should detect private key fields', () => {
      expect(secureStorage.isSensitiveField('privateKey')).toBe(true)
    })

    it('should not flag non-sensitive fields', () => {
      expect(secureStorage.isSensitiveField('username')).toBe(false)
      expect(secureStorage.isSensitiveField('email')).toBe(false)
      expect(secureStorage.isSensitiveField('displayName')).toBe(false)
    })
  })

  describe('storeIfSensitive', () => {
    it('should store value if field name matches a sensitive pattern', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      const result = await secureStorage.storeIfSensitive('cfg-1', 'apiKey', 'sk-test', { provider: 'test' })
      expect(result).toBe(true)
      expect(mockSetItem).toHaveBeenCalled()
    })

    it('should not store if field name is not sensitive', async () => {
      mockIsInitialized.mockReturnValue(true)
      await secureStorage.initialize('key')

      const result = await secureStorage.storeIfSensitive('cfg-2', 'username', 'john')
      expect(result).toBe(false)
      expect(mockSetItem).not.toHaveBeenCalled()
    })
  })

  describe('security audit', () => {
    it('should return audit log from vault', () => {
      mockGetAuditLog.mockReturnValue([{ action: 'unlock', timestamp: 100 }])
      const log = secureStorage.getAuditLog(10)
      expect(log).toHaveLength(1)
      expect(mockGetAuditLog).toHaveBeenCalledWith(10)
    })

    it('should return security score from vault', () => {
      mockGetSecurityScore.mockReturnValue(92)
      const score = secureStorage.getSecurityScore()
      expect(score).toBe(92)
    })
  })
})
