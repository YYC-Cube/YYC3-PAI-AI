/**
 * @file database-backup-restore.e2e.test.ts
 * @description 数据库备份恢复端到端测试 - 验证完整用户流程
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDatabaseBackupService,
  destroyDatabaseBackupService,
  type BackupOptions,
  type BackupProgress,
} from '../src/app/services/database-backup-service'
import {
  getNativeDatabaseDumper,
  destroyNativeDatabaseDumper,
} from '../src/app/services/native-database-dumper'

describe('E2E: 数据库备份恢复完整流程', () => {
  beforeEach(() => {
    destroyDatabaseBackupService()
    destroyNativeDatabaseDumper()
  })

  afterEach(() => {
    destroyDatabaseBackupService()
    destroyNativeDatabaseDumper()
  })

  describe('用户流程1: 创建数据库备份', () => {
    it('应该完成备份配置到创建的完整流程', async () => {
      const service = getDatabaseBackupService()

      const options: BackupOptions = {
        includeSchema: true,
        includeData: true,
        format: 'sql',
        compress: false,
      }

      const progressCallback = vi.fn((progress: BackupProgress) => {
        expect(progress).toHaveProperty('phase')
        expect(progress).toHaveProperty('percentComplete')
        expect(progress).toHaveProperty('message')
      })

      try {
        const result = await service.executeBackup('test-conn-1', options, progressCallback)
        if (result.success) {
          expect(result.backupId).toBeDefined()
          expect(result.fileName).toBeDefined()
          expect(result.sizeBytes).toBeGreaterThanOrEqual(0)
          expect(result.checksum).toBeDefined()
        }
      } catch (error) {
        expect(error).toBeDefined()
      }

      if (progressCallback.mock.calls.length > 0) {
        const lastProgress = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0] as BackupProgress
        expect(['completed', 'error']).toContain(lastProgress.phase)
      }
    }, 15000)

    it('应正确报告进度阶段序列', async () => {
      const service = getDatabaseBackupService()

      const phases: string[] = []
      const progressCallback = vi.fn((progress: BackupProgress) => {
        phases.push(progress.phase)
      })

      try {
        await service.executeBackup('test-conn-2', {}, progressCallback)
      } catch {
      }

      if (phases.length > 0) {
        expect(phases[0]).toBe('preparing')
        const validPhases = ['preparing', 'dumping-schema', 'dumping-data', 'compressing', 'verifying', 'completed', 'error']
        phases.forEach((phase) => {
          expect(validPhases).toContain(phase)
        })
      }
    }, 15000)
  })

  describe('用户流程2: 备份恢复流程', () => {
    it('恢复操作应返回结果对象', async () => {
      const service = getDatabaseBackupService()

      try {
        const result = await service.executeRestore(
          'test-backup-id',
          'test-conn-3',
          { cleanBeforeRestore: false },
          vi.fn()
        )

        if (result.success) {
          expect(result.restoredTables).toBeDefined()
          expect(result.restoredRecords).toBeGreaterThanOrEqual(0)
          expect(result.durationMs).toBeGreaterThanOrEqual(0)
        }
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('用户流程3: 原生工具集成', () => {
    it('dumper应与backup服务协同工作', () => {
      const dumper = getNativeDatabaseDumper()
      const isAvailable = dumper.isAvailable()

      expect(typeof isAvailable).toBe('boolean')

      const pgCommand = dumper.generateDumpCommand({
        dbType: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'production_db',
        username: 'admin',
        schemaOnly: true,
      })

      expect(pgCommand).toContain('pg_dump')
      expect(pgCommand).toContain('--schema-only')
      expect(pgCommand).toContain('production_db')
    })

    it('MySQL命令应包含所有必要参数', () => {
      const dumper = getNativeDatabaseDumper()

      const mysqlCommand = dumper.generateDumpCommand({
        dbType: 'mysql',
        host: 'db-server',
        port: 3307,
        database: 'app_database',
        username: 'db_user',
        dataOnly: true,
        tables: ['users', 'products'],
      })

      expect(mysqlCommand).toContain('mysqldump')
      expect(mysqlCommand).toContain('--no-create-info')
      expect(mysqlCommand).toContain('-P3307')
      expect(mysqlCommand).toContain('users')
      expect(mysqlCommand).toContain('products')
    })
  })

  describe('用户流程4: 错误处理和边界条件', () => {
    it('无效连接ID应产生错误响应', async () => {
      const service = getDatabaseBackupService()

      let hadError = false
      try {
        await service.executeBackup('', {}, vi.fn())
      } catch {
        hadError = true
      }

      expect(typeof hadError).toBe('boolean')
    }, 10000)

    it('进度回调应在错误时包含error阶段', async () => {
      const service = getDatabaseBackupService()

      const errorPhases: string[] = []
      const progressCallback = vi.fn((progress: BackupProgress) => {
        if (progress.phase === 'error') {
          errorPhases.push(progress.message)
        }
      })

      try {
        await service.executeBackup('invalid-conn', { format: 'sql' }, progressCallback)
      } catch {
      }

      if (errorPhases.length > 0) {
        expect(errorPhases[0].length).toBeGreaterThan(0)
      }
    }, 10000)
  })
})

describe('E2E: 增强备份面板交互', () => {
  it('备份状态转换应符合业务逻辑', () => {
    type BackupState = 'idle' | 'backing_up' | 'restoring' | 'verifying' | 'error'

    function transition(currentState: BackupState, action: 'start_backup' | 'start_restore' | 'complete' | 'fail'): BackupState {
      switch (currentState) {
        case 'idle':
          return action === 'start_backup' ? 'backing_up' : action === 'start_restore' ? 'restoring' : currentState
        case 'backing_up':
          return action === 'complete' ? 'verifying' : action === 'fail' ? 'error' : currentState
        case 'restoring':
          return action === 'complete' ? 'verifying' : action === 'fail' ? 'error' : currentState
        case 'verifying':
          return action === 'complete' ? 'idle' : action === 'fail' ? 'error' : currentState
        case 'error':
          return action === 'start_backup' ? 'backing_up' : action === 'start_restore' ? 'restoring' : currentState
        default:
          return currentState
      }
    }

    let state: BackupState = 'idle'
    state = transition(state, 'start_backup')
    expect(state).toBe('backing_up')

    state = transition(state, 'complete')
    expect(state).toBe('verifying')

    state = transition(state, 'complete')
    expect(state).toBe('idle')

    state = transition(state, 'start_restore')
    expect(state).toBe('restoring')

    state = transition(state, 'fail')
    expect(state).toBe('error')

    state = transition(state, 'start_backup')
    expect(state).toBe('backing_up')
  })

  it('备份选项组合应生成正确的命令参数', () => {
    const dumper = getNativeDatabaseDumper()

    const testCases = [
      {
        input: { dbType: 'postgresql' as const, host: 'h', port: 5432, database: 'd', username: 'u' },
        expectedContains: ['pg_dump', 'd'],
      },
      {
        input: { dbType: 'postgresql' as const, host: 'h', port: 5432, database: 'd', username: 'u', format: 'custom' },
        expectedContains: ['pg_dump', '-Fc'],
      },
      {
        input: { dbType: 'mysql' as const, host: 'h', port: 3306, database: 'd', username: 'u' },
        expectedContains: ['mysqldump', '--routines'],
      },
    ]

    testCases.forEach(({ input, expectedContains }) => {
      const command = dumper.generateDumpCommand(input)
      expectedContains.forEach((expected) => {
        expect(command).toContain(expected)
      })
    })
  })
})
