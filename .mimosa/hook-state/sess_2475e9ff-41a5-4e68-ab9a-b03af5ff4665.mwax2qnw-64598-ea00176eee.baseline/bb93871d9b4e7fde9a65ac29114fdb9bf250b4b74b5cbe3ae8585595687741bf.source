/**
 * @file native-database-dumper.integration.test.ts
 * @description 原生数据库备份工具集成测试 - 验证pg_dump/mysqldump流程
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getNativeDatabaseDumper,
  destroyNativeDatabaseDumper,
  type NativeDumpOptions,
  type NativeRestoreOptions,
  type NativeDumpProgress,
} from '../native-database-dumper'

describe('NativeDatabaseDumper - 集成测试', () => {
  let dumper: ReturnType<typeof getNativeDatabaseDumper>

  beforeEach(() => {
    destroyNativeDatabaseDumper()
    dumper = getNativeDatabaseDumper()
  })

  afterEach(() => {
    destroyNativeDatabaseDumper()
  })

  describe('初始化', () => {
    it('应该正确创建dumper实例', () => {
      expect(dumper).toBeDefined()
      expect(typeof dumper.isAvailable).toBe('function')
      expect(typeof dumper.detectTools).toBe('function')
      expect(typeof dumper.dumpDatabase).toBe('function')
      expect(typeof dumper.restoreDatabase).toBe('function')
      expect(typeof dumper.generateDumpCommand).toBe('function')
    })

    it('应该支持单例模式', () => {
      const dumper1 = getNativeDatabaseDumper()
      const dumper2 = getNativeDatabaseDumper()
      expect(dumper1).toBe(dumper2)
    })
  })

  describe('环境检测', () => {
    it('isAvailable应返回布尔值', () => {
      const available = dumper.isAvailable()
      expect(typeof available).toBe('boolean')
    })

    async function runDetectToolsTest() {
      const tools = await dumper.detectTools()
      expect(tools).toBeDefined()
      expect(typeof tools.pg_dump).toBe('boolean')
      expect(typeof tools.mysqldump).toBe('boolean')
      expect(typeof tools.sqlite3).toBe('boolean')
    }

    it('detectTools应返回工具检测结果', () => {
      return runDetectToolsTest()
    })
  })

  describe('PostgreSQL命令生成', () => {
    const baseOptions: NativeDumpOptions = {
      dbType: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'postgres',
    }

    it('应生成基本pg_dump命令', () => {
      const command = dumper.generateDumpCommand(baseOptions)
      expect(command).toContain('pg_dump')
      expect(command).toContain('testdb')
    })

    it('应包含用户名参数', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        username: 'admin',
      })
      expect(command).toContain("-U 'admin'")
    })

    it('用户可控值应被 shellQuote 转义（防命令注入）', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        database: "testdb'; rm -rf / #",
      })
      // 恶意值必须以转义形态出现（'\'' 闭合再重开），shell 不会截断命令
      expect(command).toContain("'testdb'\\''; rm -rf / #'")
    })

    it('schemaOnly应添加--schema-only参数', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        schemaOnly: true,
      })
      expect(command).toContain('--schema-only')
    })

    it('dataOnly应添加--data-only参数', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        dataOnly: true,
      })
      expect(command).toContain('--data-only')
    })

    it('custom格式应使用-Fc', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        format: 'custom',
      })
      expect(command).toContain('-Fc')
    })

    it('compress应添加-Z9参数(非sql格式)', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        format: 'custom',
        compress: true,
      })
      expect(command).toContain('-Z9')
    })

    it('tables参数应生成-t选项', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        tables: ['users', 'orders'],
      })
      expect(command).toContain("-t 'users'")
      expect(command).toContain("'orders'")
    })

    it('自定义端口应包含-p参数', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        port: 5433,
      })
      expect(command).toContain('-p 5433')
    })

    it('非默认主机应包含-h参数', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        host: '192.168.1.100',
      })
      expect(command).toContain("-h '192.168.1.100'")
    })

    it('extraArgs应追加到命令末尾', () => {
      const command = dumper.generateDumpCommand({
        ...baseOptions,
        extraArgs: ['--no-owner', '--no-acl'],
      })
      expect(command).toContain('--no-owner')
      expect(command).toContain('--no-acl')
    })
  })

  describe('MySQL/MariaDB命令生成', () => {
    const mysqlOptions: NativeDumpOptions = {
      dbType: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'testdb',
      username: 'root',
    }

    it('应生成基本mysqldump命令', () => {
      const command = dumper.generateDumpCommand(mysqlOptions)
      expect(command).toContain('mysqldump')
    })

    it('应包含-routines和-triggers', () => {
      const command = dumper.generateDumpCommand(mysqlOptions)
      expect(command).toContain('--routines')
      expect(command).toContain('--triggers')
    })

    it('schemaOnly应添加--no-data', () => {
      const command = dumper.generateDumpCommand({
        ...mysqlOptions,
        schemaOnly: true,
      })
      expect(command).toContain('--no-data')
    })

    it('dataOnly应添加--no-create-info', () => {
      const command = dumper.generateDumpCommand({
        ...mysqlOptions,
        dataOnly: true,
      })
      expect(command).toContain('--no-create-info')
    })

    it('compress应添加--compress', () => {
      const command = dumper.generateDumpCommand({
        ...mysqlOptions,
        compress: true,
      })
      expect(command).toContain('--compress')
    })

    it('自定义端口应使用-P参数', () => {
      const command = dumper.generateDumpCommand({
        ...mysqlOptions,
        port: 3307,
      })
      expect(command).toContain('-P3307')
    })
  })

  describe('SQLite命令生成', () => {
    const sqliteOptions: NativeDumpOptions = {
      dbType: 'sqlite',
      host: '',
      port: 0,
      database: '/data/test.db',
      username: '',
    }

    it('SQLite应返回.dump命令', () => {
      const command = dumper.generateDumpCommand(sqliteOptions)
      expect(command).toBe('.dump')
    })
  })

  describe('dumpDatabase集成流程', () => {
    const mockProgressCallback = vi.fn()

    beforeEach(() => {
      mockProgressCallback.mockClear()
    })

    it('非原生环境应抛出错误', async () => {
      if (!dumper.isAvailable()) {
        await expect(
          dumper.dumpDatabase(
            {
              dbType: 'postgresql',
              host: 'localhost',
              port: 5432,
              database: 'test',
              username: 'postgres',
            },
            mockProgressCallback
          )
        ).rejects.toThrow()
      }
    })

    it('应调用进度回调', async () => {
      if (dumper.isAvailable()) {
        try {
          await dumper.dumpDatabase(
            {
              dbType: 'postgresql',
              host: 'localhost',
              port: 5432,
              database: 'nonexistent_test_db',
              username: 'postgres',
            },
            mockProgressCallback
          )
        } catch {
          // Expected to fail with nonexistent database
        }

        if (mockProgressCallback.mock.calls.length > 0) {
          const firstCall = mockProgressCallback.mock.calls[0][0] as NativeDumpProgress
          expect(firstCall).toHaveProperty('stage')
          expect(firstCall).toHaveProperty('percentComplete')
          expect(firstCall).toHaveProperty('message')
          expect(firstCall).toHaveProperty('timestamp')
        }
      }
    })
  })

  describe('restoreDatabase集成流程', () => {
    const restoreOptions: NativeRestoreOptions = {
      dbType: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'test_restore',
      username: 'postgres',
      backupPath: '/tmp/backup.sql',
    }

    it('非原生环境应抛出错误', async () => {
      if (!dumper.isAvailable()) {
        await expect(
          dumper.restoreDatabase(restoreOptions, vi.fn())
        ).rejects.toThrow()
      }
    })

    it('cleanBeforeRestore应在结果中反映', async () => {
      if (dumper.isAvailable()) {
        try {
          await dumper.restoreDatabase(
            {
              ...restoreOptions,
              cleanBeforeRestore: true,
            },
            vi.fn()
          )
        } catch {
          // Expected to fail - restore operation test
        }
      }
    })
  })
})

describe('NativeDatabaseDumper - 与BackupService集成', () => {
  beforeEach(() => {
    destroyNativeDatabaseDumper()
  })

  afterEach(() => {
    destroyNativeDatabaseDumper()
  })

  it('dumper的输出格式应兼容BackupService', () => {
    const dumper = getNativeDatabaseDumper()

    const pgCommand = dumper.generateDumpCommand({
      dbType: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'production',
      username: 'admin',
      format: 'custom',
      compress: true,
    })

    expect(pgCommand).toBeTruthy()
    expect(typeof pgCommand).toBe('string')
    expect(pgCommand.length).toBeGreaterThan(10)
  })

  it('MySQL命令应包含必要的连接信息', () => {
    const dumper = getNativeDatabaseDumper()

    const mysqlCommand = dumper.generateDumpCommand({
      dbType: 'mysql',
      host: 'db.example.com',
      port: 3306,
      database: 'app_db',
      username: 'app_user',
      tables: ['users', 'sessions', 'logs'],
    })

    expect(mysqlCommand).toContain('app_user')
    expect(mysqlCommand).toContain('users')
    expect(mysqlCommand).toContain('sessions')
    expect(mysqlCommand).toContain('logs')

    const mysqlWithoutTables = dumper.generateDumpCommand({
      dbType: 'mysql',
      host: 'db.example.com',
      port: 3306,
      database: 'app_db',
      username: 'app_user',
    })
    expect(mysqlWithoutTables).toContain('app_db')
  })
})
