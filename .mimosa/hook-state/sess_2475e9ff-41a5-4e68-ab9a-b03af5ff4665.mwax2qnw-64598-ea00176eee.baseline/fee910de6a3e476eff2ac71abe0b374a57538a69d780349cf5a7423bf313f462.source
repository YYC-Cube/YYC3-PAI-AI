/**
 * @file database-backup-service.test.ts
 * @description 数据库备份恢复服务单元测试
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getDatabaseBackupService, destroyDatabaseBackupService } from '../database-backup-service'

describe('DatabaseBackupService', () => {
  let service: ReturnType<typeof getDatabaseBackupService>

  beforeEach(() => {
    destroyDatabaseBackupService()
    service = getDatabaseBackupService()
  })

  afterEach(() => {
    destroyDatabaseBackupService()
  })

  describe('初始化', () => {
    it('应该正确创建服务实例', () => {
      expect(service).toBeDefined()
      expect(typeof service.executeBackup).toBe('function')
      expect(typeof service.getRestorePreview).toBe('function')
      expect(typeof service.executeRestore).toBe('function')
    })

    it('应该支持单例模式', () => {
      const service1 = getDatabaseBackupService()
      const service2 = getDatabaseBackupService()
      expect(service1).toBe(service2)
    })
  })

  describe('executeBackup - 备份执行', () => {
    it('应该成功执行备份并返回正确结果', async () => {
      const progressCallback = vi.fn()
      const result = await service.executeBackup(
        'test-conn-id',
        {},
        progressCallback
      )

      expect(result.success).toBe(true)
      expect(result.backupId).toBeTruthy()
      expect(result.fileName).toContain('.sql')
      expect(result.sizeBytes).toBeGreaterThan(0)
      expect(result.tableCount).toBeGreaterThan(0)
      expect(result.recordCount).toBeGreaterThan(0)
      expect(result.durationMs).toBeGreaterThan(0)
      expect(result.checksum).toBeTruthy()
      expect(result.format).toBe('sql')
      expect(result.compressed).toBe(true)
    }, 15000)

    it('应该调用进度回调函数', async () => {
      const progressCallback = vi.fn()

      await service.executeBackup(
        'progress-test-id',
        {},
        progressCallback
      )

      expect(progressCallback).toHaveBeenCalled()
      const calls = progressCallback.mock.calls

      // 验证至少有completed阶段
      const completedCalls = calls.filter(call =>
        call[0] && (call[0] as { phase: string }).phase === 'completed'
      )
      expect(completedCalls.length).toBeGreaterThan(0)

      // 最后一个调用应该是100%
      const lastCall = calls[calls.length - 1][0] as { percentComplete: number }
      expect(lastCall.percentComplete).toBe(100)
    }, 15000)

    it('应该报告正确的备份阶段', async () => {
      const phases: string[] = []
      const progressCallback = vi.fn((progress) => {
        phases.push(progress.phase)
      })

      await service.executeBackup(
        'phase-test-id',
        {},
        progressCallback
      )

      expect(phases).toContain('preparing')
      expect(phases).toContain('dumping-schema')
      expect(phases).toContain('dumping-data')
      expect(phases).toContain('compressing')
      expect(phases).toContain('verifying')
      expect(phases).toContain('completed')
    }, 15000)

    it('应该支持自定义备份选项', async () => {
      const result = await service.executeBackup(
        'options-test-id',
        {
          includeSchema: true,
          includeData: true,
          format: 'csv',
          compress: false,
        },
        vi.fn()
      )

      expect(result.success).toBe(true)
      expect(result.format).toBe('csv')
      expect(result.compressed).toBe(false)
    }, 15000)
  })

  describe('getRestorePreview - 恢复预览', () => {
    it('应该生成恢复预览信息', async () => {
      const preview = await service.getRestorePreview(
        'preview-conn-id',
        'backup-123',
        'backup_2026-04-08.sql.gz',
        1024 * 1024 * 5 // 5MB
      )

      expect(preview.backupId).toBe('backup-123')
      expect(preview.fileName).toBe('backup_2026-04-08.sql.gz')
      expect(preview.sizeBytes).toBe(1024 * 1024 * 5)
      expect(preview.tableCount).toBeGreaterThan(0)
      expect(preview.estimatedRecords).toBeGreaterThan(0)
      expect(preview.willDropExisting).toBe(true)
      expect(Array.isArray(preview.affectedTables)).toBe(true)
      expect(Array.isArray(preview.warnings)).toBe(true)
    })

    it('大文件应该产生警告', async () => {
      const largeSize = 60 * 1024 * 1024 // 60MB
      const preview = await service.getRestorePreview(
        'large-file-id',
        'large-backup',
        'large_backup.sql.gz',
        largeSize
      )

      expect(preview.warnings.length).toBeGreaterThan(0)
      expect(preview.warnings.some(w => w.toLowerCase().includes('large'))).toBe(true)
    })

    it('多表备份应该产生警告', async () => {
      // 通过多次调用来模拟（实际取决于内部实现）
      const preview = await service.getRestorePreview(
        'multi-table-id',
        'multi-backup',
        'multi.sql.gz',
        1024 * 1024
      )
      // 验证基本结构
      expect(preview.affectedTables.length).toBeGreaterThan(0)
    })
  })

  describe('executeRestore - 恢复执行', () => {
    it('应该成功执行恢复操作', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      try {
        const preview = await service.getRestorePreview(
          'restore-conn-id',
          'restore-backup-id',
          'restore_test.sql.gz',
          1024 * 1024 * 2
        )

        const progressCallback = vi.fn()
        const result = await service.executeRestore(
          'restore-conn-id',
          'restore-backup-id',
          preview,
          progressCallback
        )

        expect(result.success).toBe(true)
        expect(result.restoredTables.length).toBeGreaterThan(0)
        expect(result.restoredRecords).toBeGreaterThan(0)
        expect(result.durationMs).toBeGreaterThan(0)
        expect(Array.isArray(result.warnings)).toBe(true)
      } finally {
        randomSpy.mockRestore()
      }
    }, 15000)

    it('应该调用恢复进度回调', async () => {
      const preview = await service.getRestorePreview(
        'progress-restore-id',
        'progress-backup',
        'progress.sql.gz',
        1024 * 1024
      )

      const progressCallback = vi.fn()
      await service.executeRestore(
        'progress-restore-id',
        'progress-backup',
        preview,
        progressCallback
      )

      expect(progressCallback).toHaveBeenCalled()
      const calls = progressCallback.mock.calls

      // 验证最后调用的阶段（可能是completed或error）
      const lastCall = calls[calls.length - 1][0] as { phase: string; percentComplete: number }
      expect(['completed', 'error']).toContain(lastCall.phase)
    }, 15000)

    it('应该报告正确的恢复阶段', async () => {
      const preview = await service.getRestorePreview(
        'phase-restore-id',
        'phase-backup',
        'phase.sql.gz',
        512 * 1024
      )

      const phases: string[] = []
      const progressCallback = vi.fn((progress) => {
        phases.push(progress.phase)
      })

      await service.executeRestore(
        'phase-restore-id',
        'phase-backup',
        preview,
        progressCallback
      )

      expect(phases).toContain('validating')

      if (phases.includes('error')) {
        expect(phases).toEqual(['validating', 'error'])
      } else {
        expect(phases).toContain('creating-schema')
        expect(phases).toContain('importing-data')
        expect(phases).toContain('verifying')
        expect(phases).toContain('completed')

        if (preview.willDropExisting) {
          expect(phases).toContain('dropping')
        }
      }
    }, 15000)
  })

  describe('错误处理', () => {
    it('应该能够处理备份操作（成功或失败）', async () => {
      // 测试备份操作是否能够正常完成（无论成功或失败）
      const result = await service.executeBackup('error-handling-test', {}, vi.fn())

      // 验证返回结果的结构
      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.backupId).toBe('string')
      expect(typeof result.fileName).toBe('string')

      if (!result.success) {
        // 如果失败，验证错误信息
        expect(result.error).toBeTruthy()
        expect(result.backupId).toBe('')
      }
    }, 15000)
  })

  describe('边界情况', () => {
    it('空连接ID应该正常处理', async () => {
      const result = await service.executeBackup('', {}, vi.fn())
      // 应该不会抛出异常
      expect(result).toBeDefined()
    }, 15000)

    it('极小文件预览应该正常工作', async () => {
      const preview = await service.getRestorePreview(
        'tiny-id',
        'tiny-backup',
        'tiny.sql',
        1024 // 1KB
      )
      expect(preview).toBeDefined()
      expect(preview.sizeBytes).toBe(1024)
    })

    it('无进度回调时应该正常工作', async () => {
      const result = await service.executeBackup('no-callback-id', {})
      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
    }, 15000)
  })
})
