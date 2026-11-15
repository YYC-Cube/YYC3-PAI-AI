/**
 * @file key-manager.test.ts
 * @description 密钥管理工具测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KeyManager } from '../key-manager'

describe('KeyManager', () => {
  let km: KeyManager

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    const AnyKeyManager = KeyManager as unknown as { instance: KeyManager | null }
    AnyKeyManager.instance = null
    km = KeyManager.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const a = KeyManager.getInstance()
      const b = KeyManager.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('initialize', () => {
    it('should set master password on first init', async () => {
      const result = await km.initialize('test-password')
      expect(result).toBe(true)
      expect(km.isUnlocked()).toBe(true)
    })

    it('should accept same password on subsequent init', async () => {
      await km.initialize('test-password')
      km.lock()
      const result = await km.initialize('test-password')
      expect(result).toBe(true)
      expect(km.isUnlocked()).toBe(true)
    })

    it('should reject wrong password', async () => {
      await km.initialize('test-password')
      km.lock()
      const result = await km.initialize('wrong-password')
      expect(result).toBe(false)
      expect(km.isUnlocked()).toBe(false)
    })

    it('should store password hash in localStorage', async () => {
      await km.initialize('test-password')
      expect(localStorage.getItem('yyc3_master_key_hash')).toBeTruthy()
    })
  })

  describe('storeKey / getKey', () => {
    beforeEach(async () => {
      await km.initialize('test-password')
    })

    it('should store and retrieve a key', async () => {
      const id = await km.storeKey('openai', 'sk-test-api-key-1234567890')
      expect(id).toBeTruthy()

      const retrieved = await km.getKey('openai')
      expect(retrieved).toBe('sk-test-api-key-1234567890')
    })

    it('should throw if not unlocked', async () => {
      km.lock()
      await expect(km.storeKey('openai', 'sk-test')).rejects.toThrow('KeyManager is not unlocked')
    })

    it('should throw on getKey if not unlocked', async () => {
      km.lock()
      await expect(km.getKey('openai')).rejects.toThrow('KeyManager is not unlocked')
    })

    it('should return null for non-existent provider', async () => {
      const result = await km.getKey('nonexistent')
      expect(result).toBeNull()
    })

    it('should update existing key for same provider', async () => {
      await km.storeKey('openai', 'sk-old-key')
      await km.storeKey('openai', 'sk-new-key')

      const result = await km.getKey('openai')
      expect(result).toBe('sk-new-key')
    })

    it('should store metadata with key', async () => {
      await km.storeKey('openai', 'sk-test', {
        description: 'Production key',
        tags: ['prod', 'gpt-4'],
      })

      const keys = km.listKeys()
      expect(keys[0].metadata?.description).toBe('Production key')
      expect(keys[0].metadata?.tags).toEqual(['prod', 'gpt-4'])
    })

    it('should update lastUsed timestamp on getKey', async () => {
      await km.storeKey('openai', 'sk-test')
      const before = Date.now()
      await km.getKey('openai')
      const after = Date.now()

      const keys = km.listKeys()
      expect(keys[0].lastUsed).toBeGreaterThanOrEqual(before)
      expect(keys[0].lastUsed).toBeLessThanOrEqual(after)
    })
  })

  describe('deleteKey', () => {
    beforeEach(async () => {
      await km.initialize('test-password')
    })

    it('should delete a stored key', async () => {
      await km.storeKey('openai', 'sk-test')
      const result = await km.deleteKey('openai')
      expect(result).toBe(true)

      const retrieved = await km.getKey('openai')
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent key', async () => {
      const result = await km.deleteKey('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('listKeys', () => {
    beforeEach(async () => {
      await km.initialize('test-password')
    })

    it('should list all stored keys with previews', async () => {
      await km.storeKey('openai', 'sk-test-key-123')
      await km.storeKey('zhipu', 'zhipu-api-key-456')

      const keys = km.listKeys()
      expect(keys).toHaveLength(2)
      expect(keys[0].provider).toBe('openai')
      expect(keys[1].provider).toBe('zhipu')
      expect(keys[0].keyPreview).toContain('••••••••')
    })

    it('should return empty array when no keys stored', () => {
      const keys = km.listKeys()
      expect(keys).toHaveLength(0)
    })
  })

  describe('lock / unlock', () => {
    it('should lock and clear session', async () => {
      await km.initialize('test-password')
      expect(km.isUnlocked()).toBe(true)

      km.lock()
      expect(km.isUnlocked()).toBe(false)
    })

    it('should unlock with correct password', async () => {
      await km.initialize('test-password')
      km.lock()

      const result = await km.unlock('test-password')
      expect(result).toBe(true)
      expect(km.isUnlocked()).toBe(true)
    })

    it('should fail to unlock with wrong password', async () => {
      await km.initialize('test-password')
      km.lock()

      const result = await km.unlock('wrong-password')
      expect(result).toBe(false)
      expect(km.isUnlocked()).toBe(false)
    })
  })

  describe('changePassword', () => {
    it('should change password and re-encrypt keys', async () => {
      await km.initialize('old-password')
      await km.storeKey('openai', 'sk-test-key')

      const result = await km.changePassword('old-password', 'new-password')
      expect(result).toBe(true)

      km.lock()
      const unlockResult = await km.unlock('new-password')
      expect(unlockResult).toBe(true)

      const key = await km.getKey('openai')
      expect(key).toBe('sk-test-key')
    })

    it('should reject wrong old password', async () => {
      await km.initialize('old-password')
      const result = await km.changePassword('wrong-old', 'new-password')
      expect(result).toBe(false)
    })
  })

  describe('exportKeys / importKeys', () => {
    beforeEach(async () => {
      await km.initialize('test-password')
    })

    it('should export and import keys', async () => {
      await km.storeKey('openai', 'sk-export-test')
      await km.storeKey('zhipu', 'zhipu-export-test')

      const exported = await km.exportKeys('export-password')
      expect(exported).toBeTruthy()

      const parsed = JSON.parse(exported)
      expect(parsed.salt).toBeTruthy()
      expect(parsed.iv).toBeTruthy()
      expect(parsed.data).toBeTruthy()
    })

    it('should throw if not unlocked when exporting', async () => {
      km.lock()
      await expect(km.exportKeys('export-password')).rejects.toThrow('KeyManager is not unlocked')
    })

    it('should import keys from valid export', async () => {
      await km.storeKey('openai', 'sk-import-test')

      const exported = await km.exportKeys('import-password')
      await km.deleteKey('openai')

      const imported = await km.importKeys(exported, 'import-password')
      expect(imported).toBe(1)

      const key = await km.getKey('openai')
      expect(key).toBe('sk-import-test')
    })

    it('should reject import with wrong password', async () => {
      await km.storeKey('openai', 'sk-test')
      const exported = await km.exportKeys('correct-password')

      await expect(km.importKeys(exported, 'wrong-password')).rejects.toThrow()
    })
  })

  describe('setAutoLockDelay', () => {
    it('should set auto lock delay', async () => {
      await km.initialize('test-password')
      expect(() => km.setAutoLockDelay(60000)).not.toThrow()
    })
  })

  describe('encryption integrity', () => {
    it('should produce different ciphertext for same plaintext (different salt/iv)', async () => {
      await km.initialize('test-password')

      await km.storeKey('provider-a', 'same-key-value')
      const encryptedA = localStorage.getItem('yyc3_encrypted_keys')

      localStorage.removeItem('yyc3_encrypted_keys')
      await km.storeKey('provider-b', 'same-key-value')
      const encryptedB = localStorage.getItem('yyc3_encrypted_keys')

      expect(encryptedA).not.toBe(encryptedB)
    })
  })
})
