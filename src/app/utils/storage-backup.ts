/**
 * @file storage-backup.ts
 * @description 存储备份和恢复工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,backup,restore
 */

import { createLogger } from './logger'

const logger = createLogger('storage-backup')

export interface BackupData {
  version: string
  timestamp: number
  data: {
    localStorage: Record<string, string>
    indexedDB: Record<string, unknown>
  }
  checksum: string
}

export interface BackupInfo {
  id: string
  timestamp: number
  size: number
  version: string
}

export interface RestoreResult {
  success: boolean
  restored: number
  errors: string[]
}

export class BackupManager {
  private static instance: BackupManager
  private backupInterval: ReturnType<typeof setInterval> | null = null
  private readonly BACKUP_KEY_PREFIX = 'yyc3_backup_'
  private readonly MAX_BACKUPS = 10

  private constructor() { }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager()
    }
    return BackupManager.instance
  }

  async createBackup(): Promise<BackupData> {
    const backup: BackupData = {
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        localStorage: {},
        indexedDB: {},
      },
      checksum: '',
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('yyc3_') && !key.startsWith(this.BACKUP_KEY_PREFIX)) {
          const value = localStorage.getItem(key)
          if (value) {
            backup.data.localStorage[key] = value
          }
        }
      }

      const dataString = JSON.stringify(backup.data)
      const encoder = new TextEncoder()
      const data = encoder.encode(dataString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      backup.checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      await this.saveBackup(backup)

      logger.info(`[BackupManager] Created backup with ${Object.keys(backup.data.localStorage).length} items`)
    } catch (error) {
      logger.error('[BackupManager] Failed to create backup', error)
      throw error
    }

    return backup
  }

  private async saveBackup(backup: BackupData): Promise<void> {
    const backupKey = `${this.BACKUP_KEY_PREFIX}${backup.timestamp}`
    const backupString = JSON.stringify(backup)

    try {
      localStorage.setItem(backupKey, backupString)

      const backups = await this.listBackups()
      if (backups.length > this.MAX_BACKUPS) {
        const toRemove = backups.slice(this.MAX_BACKUPS)
        for (const old of toRemove) {
          localStorage.removeItem(`${this.BACKUP_KEY_PREFIX}${old.timestamp}`)
        }
        logger.info(`[BackupManager] Removed ${toRemove.length} old backups`)
      }
    } catch (error) {
      logger.error('[BackupManager] Failed to save backup', error)
      throw error
    }
  }

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const result: RestoreResult = { success: false, restored: 0, errors: [] }

    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}${backupId}`
      const backupString = localStorage.getItem(backupKey)

      if (!backupString) {
        result.errors.push(`Backup ${backupId} not found`)
        return result
      }

      const backup: BackupData = JSON.parse(backupString)

      const dataString = JSON.stringify(backup.data)
      const encoder = new TextEncoder()
      const data = encoder.encode(dataString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      if (checksum !== backup.checksum) {
        result.errors.push('Backup checksum mismatch')
        return result
      }

      for (const [key, value] of Object.entries(backup.data.localStorage)) {
        try {
          localStorage.setItem(key, value)
          result.restored++
        } catch (error) {
          result.errors.push(`Failed to restore ${key}: ${error}`)
        }
      }

      result.success = true
      logger.info(`[BackupManager] Restored backup ${backupId} with ${result.restored} items`)
    } catch (error) {
      result.errors.push(`Failed to restore backup: ${error}`)
      logger.error('[BackupManager] Failed to restore backup', error)
    }

    return result
  }

  async listBackups(): Promise<BackupInfo[]> {
    const backups: BackupInfo[] = []

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.BACKUP_KEY_PREFIX)) {
          try {
            const backupString = localStorage.getItem(key)
            if (backupString) {
              const backup: BackupData = JSON.parse(backupString)
              backups.push({
                id: key.replace(this.BACKUP_KEY_PREFIX, ''),
                timestamp: backup.timestamp,
                size: backupString.length,
                version: backup.version,
              })
            }
          } catch (error) {
            logger.error(`[BackupManager] Failed to parse backup ${key}`, error)
          }
        }
      }

      backups.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      logger.error('[BackupManager] Failed to list backups', error)
    }

    return backups
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}${backupId}`
      localStorage.removeItem(backupKey)
      logger.info(`[BackupManager] Deleted backup ${backupId}`)
    } catch (error) {
      logger.error('[BackupManager] Failed to delete backup', error)
      throw error
    }
  }

  async exportBackup(backupId: string): Promise<string> {
    try {
      const backupKey = `${this.BACKUP_KEY_PREFIX}${backupId}`
      const backupString = localStorage.getItem(backupKey)

      if (!backupString) {
        throw new Error(`Backup ${backupId} not found`)
      }

      return backupString
    } catch (error) {
      logger.error('[BackupManager] Failed to export backup', error)
      throw error
    }
  }

  async importBackup(backupString: string): Promise<RestoreResult> {
    const result: RestoreResult = { success: false, restored: 0, errors: [] }

    try {
      const backup: BackupData = JSON.parse(backupString)

      if (!backup.version || !backup.timestamp || !backup.data || !backup.checksum) {
        result.errors.push('Invalid backup format')
        return result
      }

      await this.saveBackup(backup)

      result.success = true
      result.restored = 1
      logger.info(`[BackupManager] Imported backup from ${new Date(backup.timestamp).toISOString()}`)
    } catch (error) {
      result.errors.push(`Failed to import backup: ${error}`)
      logger.error('[BackupManager] Failed to import backup', error)
    }

    return result
  }

  scheduleAutoBackup(interval: number): void {
    if (this.backupInterval) {
      this.cancelAutoBackup()
    }

    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup()
      } catch (error) {
        logger.error('[BackupManager] Auto backup failed', error)
      }
    }, interval)

    logger.info(`[BackupManager] Scheduled auto backup with ${interval}ms interval`)
  }

  cancelAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
      logger.info('[BackupManager] Cancelled auto backup')
    }
  }
}

export const backupManager = BackupManager.getInstance()
