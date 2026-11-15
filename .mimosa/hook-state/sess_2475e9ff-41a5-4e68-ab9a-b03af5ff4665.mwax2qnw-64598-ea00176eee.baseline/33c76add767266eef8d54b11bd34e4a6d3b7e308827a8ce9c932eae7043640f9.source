/**
 * @file storage-backup.test.ts
 * @description 存储备份和恢复工具测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BackupManager } from '../storage-backup'

describe('BackupManager', () => {
  let bm: BackupManager

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    const AnyBM = BackupManager as unknown as { instance: BackupManager | null }
    AnyBM.instance = null
    bm = BackupManager.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const a = BackupManager.getInstance()
      const b = BackupManager.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('createBackup', () => {
    it('should create backup with yyc3_ prefixed items', async () => {
      localStorage.setItem('yyc3_settings', JSON.stringify({ theme: 'dark' }))
      localStorage.setItem('yyc3_user_prefs', JSON.stringify({ lang: 'zh' }))
      localStorage.setItem('other_key', 'should-be-ignored')

      const backup = await bm.createBackup()

      expect(backup.version).toBe('1.0.0')
      expect(backup.timestamp).toBeGreaterThan(0)
      expect(backup.checksum).toBeTruthy()
      expect(backup.data.localStorage['yyc3_settings']).toBeTruthy()
      expect(backup.data.localStorage['yyc3_user_prefs']).toBeTruthy()
      expect(backup.data.localStorage['other_key']).toBeUndefined()
    })

    it('should not include backup keys in backup data', async () => {
      localStorage.setItem('yyc3_backup_1234', '{"old":true}')
      localStorage.setItem('yyc3_settings', '{}')

      const backup = await bm.createBackup()
      expect(backup.data.localStorage['yyc3_backup_1234']).toBeUndefined()
      expect(backup.data.localStorage['yyc3_settings']).toBeTruthy()
    })

    it('should compute valid SHA-256 checksum', async () => {
      localStorage.setItem('yyc3_test', 'value')

      const backup = await bm.createBackup()

      const dataString = JSON.stringify(backup.data)
      const encoder = new TextEncoder()
      const data = encoder.encode(dataString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const expectedChecksum = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      expect(backup.checksum).toBe(expectedChecksum)
    })

    it('should save backup to localStorage', async () => {
      localStorage.setItem('yyc3_test', 'value')
      await bm.createBackup()

      let found = false
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('yyc3_backup_')) {
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    it('should create backup with empty localStorage', async () => {
      const backup = await bm.createBackup()
      expect(backup.data.localStorage).toEqual({})
      expect(backup.checksum).toBeTruthy()
    })
  })

  describe('restoreBackup', () => {
    it('should restore items from valid backup', async () => {
      localStorage.setItem('yyc3_settings', JSON.stringify({ theme: 'dark' }))

      const backup = await bm.createBackup()
      localStorage.removeItem('yyc3_settings')

      const backupId = String(backup.timestamp)
      const result = await bm.restoreBackup(backupId)

      expect(result.success).toBe(true)
      expect(result.restored).toBe(1)
      expect(localStorage.getItem('yyc3_settings')).toBeTruthy()
    })

    it('should fail for non-existent backup', async () => {
      const result = await bm.restoreBackup('nonexistent')
      expect(result.success).toBe(false)
      expect(result.errors).toContainEqual(expect.stringContaining('not found'))
    })

    it('should fail on checksum mismatch', async () => {
      localStorage.setItem('yyc3_test', 'value')
      const backup = await bm.createBackup()

      const backupKey = `yyc3_backup_${backup.timestamp}`
      const stored = JSON.parse(localStorage.getItem(backupKey)!)
      stored.checksum = 'tampered'
      localStorage.setItem(backupKey, JSON.stringify(stored))

      const result = await bm.restoreBackup(String(backup.timestamp))
      expect(result.success).toBe(false)
      expect(result.errors).toContainEqual(expect.stringContaining('checksum mismatch'))
    })
  })

  describe('listBackups', () => {
    it('should list all backups sorted by timestamp desc', async () => {
      localStorage.setItem('yyc3_test', 'value')

      await bm.createBackup()
      await new Promise((r) => setTimeout(r, 10))
      await bm.createBackup()

      const backups = await bm.listBackups()
      expect(backups.length).toBeGreaterThanOrEqual(2)
      expect(backups[0].timestamp).toBeGreaterThanOrEqual(backups[1].timestamp)
    })

    it('should return empty array when no backups', async () => {
      const backups = await bm.listBackups()
      expect(backups).toEqual([])
    })

    it('should include backup metadata', async () => {
      localStorage.setItem('yyc3_test', 'value')
      await bm.createBackup()

      const backups = await bm.listBackups()
      expect(backups[0].id).toBeTruthy()
      expect(backups[0].timestamp).toBeGreaterThan(0)
      expect(backups[0].size).toBeGreaterThan(0)
      expect(backups[0].version).toBe('1.0.0')
    })
  })

  describe('deleteBackup', () => {
    it('should delete a specific backup', async () => {
      localStorage.setItem('yyc3_test', 'value')
      const backup = await bm.createBackup()
      const backupId = String(backup.timestamp)

      await bm.deleteBackup(backupId)

      const backups = await bm.listBackups()
      expect(backups.find((b) => b.id === backupId)).toBeUndefined()
    })
  })

  describe('exportBackup / importBackup', () => {
    it('should export backup as string', async () => {
      localStorage.setItem('yyc3_test', 'value')
      const backup = await bm.createBackup()
      const backupId = String(backup.timestamp)

      const exported = await bm.exportBackup(backupId)
      expect(exported).toBeTruthy()

      const parsed = JSON.parse(exported)
      expect(parsed.version).toBe('1.0.0')
      expect(parsed.checksum).toBeTruthy()
    })

    it('should throw on export non-existent backup', async () => {
      await expect(bm.exportBackup('nonexistent')).rejects.toThrow()
    })

    it('should import a valid backup string', async () => {
      localStorage.setItem('yyc3_test', 'value')
      const backup = await bm.createBackup()
      const backupId = String(backup.timestamp)
      const exported = await bm.exportBackup(backupId)

      await bm.deleteBackup(backupId)

      const result = await bm.importBackup(exported)
      expect(result.success).toBe(true)
      expect(result.restored).toBe(1)
    })

    it('should reject invalid backup format', async () => {
      const result = await bm.importBackup('{"invalid": true}')
      expect(result.success).toBe(false)
      expect(result.errors).toContainEqual(expect.stringContaining('Invalid backup format'))
    })
  })

  describe('scheduleAutoBackup / cancelAutoBackup', () => {
    it('should schedule and cancel auto backup', () => {
      bm.scheduleAutoBackup(60000)
      bm.cancelAutoBackup()
    })

    it('should replace existing schedule', () => {
      bm.scheduleAutoBackup(60000)
      bm.scheduleAutoBackup(30000)
      bm.cancelAutoBackup()
    })
  })

  describe('MAX_BACKUPS enforcement', () => {
    it('should keep only MAX_BACKUPS (10) backups', async () => {
      localStorage.setItem('yyc3_test', 'value')

      for (let i = 0; i < 12; i++) {
        await bm.createBackup()
      }

      const backups = await bm.listBackups()
      expect(backups.length).toBeLessThanOrEqual(10)
    })
  })
})
