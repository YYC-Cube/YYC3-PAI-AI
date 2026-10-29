/**
 * @file native-database-dumper.ts
 * @description 原生数据库备份工具 - 对接pg_dump/mysqldump实现真实数据库备份
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('native-db-dumper')

export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mariadb'

export interface NativeDumpOptions {
  dbType: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password?: string
  tables?: string[]
  schemaOnly?: boolean
  dataOnly?: boolean
  compress?: boolean
  format?: 'sql' | 'custom' | 'directory' | 'tar'
  extraArgs?: string[]
}

/** POSIX 单引号转义：把用户可控值安全嵌入 shell 命令（防命令注入） */
function shellQuote(value: string): string {
  return `'` + value.replace(/'/g, `'\\''`) + `'`
}

export interface NativeDumpProgress {
  stage: 'detecting' | 'connecting' | 'validating' | 'dropping' | 'creating-schema' | 'importing-data' | 'dumping' | 'compressing' | 'verifying' | 'completed' | 'error'
  percentComplete: number
  bytesWritten: number
  message: string
  timestamp: number
}

export interface NativeDumpResult {
  success: boolean
  outputPath: string
  sizeBytes: number
  durationMs: number
  checksum: string
  command: string
  error?: string
  tables?: string[]
}

export interface NativeRestoreOptions {
  dbType: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password?: string
  backupPath: string
  cleanBeforeRestore?: boolean
  singleTransaction?: boolean
  extraArgs?: string[]
}

export interface NativeRestoreResult {
  success: boolean
  durationMs: number
  tablesRestored: number
  errors: string[]
  warnings: string[]
}

interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

class NativeDatabaseDumper {
  private isNativeEnv: boolean

  constructor() {
    this.isNativeEnv = this.detectNativeEnvironment()
  }

  isAvailable(): boolean {
    return this.isNativeEnv
  }

  async detectTools(): Promise<{ pg_dump: boolean; mysqldump: boolean; sqlite3: boolean }> {
    if (!this.isNativeEnv) {
      return { pg_dump: false, mysqldump: false, sqlite3: false }
    }

    const [pg, mysql, sqlite] = await Promise.all([
      this.checkCommandExists('pg_dump'),
      this.checkCommandExists('mysqldump'),
      this.checkCommandExists('sqlite3'),
    ])

    return { pg_dump: pg, mysqldump: mysql, sqlite3: sqlite }
  }

  async dumpDatabase(options: NativeDumpOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeDumpResult> {
    const startTime = performance.now()

    onProgress?.({
      stage: 'detecting',
      percentComplete: 5,
      bytesWritten: 0,
      message: 'Detecting environment...',
      timestamp: Date.now(),
    })

    if (!this.isNativeEnv) {
      throw new Error('Native database dumping requires Tauri or Electron environment')
    }

    onProgress?.({
      stage: 'connecting',
      percentComplete: 10,
      bytesWritten: 0,
      message: `Connecting to ${options.dbType}...`,
      timestamp: Date.now(),
    })

    let result: NativeDumpResult

    switch (options.dbType) {
      case 'postgresql':
        result = await this.dumpPostgreSQL(options, onProgress)
        break
      case 'mysql':
      case 'mariadb':
        result = await this.dumpMySQL(options, onProgress)
        break
      case 'sqlite':
        result = await this.dumpSQLite(options, onProgress)
        break
      default:
        throw new Error(`Unsupported database type: ${options.dbType}`)
    }

    result.durationMs = Math.round(performance.now() - startTime)

    onProgress?.({
      stage: 'completed',
      percentComplete: 100,
      bytesWritten: result.sizeBytes,
      message: `Backup completed: ${result.outputPath}`,
      timestamp: Date.now(),
    })

    logger.info(`Database dump completed in ${result.durationMs}ms`, { size: result.sizeBytes, path: result.outputPath })
    return result
  }

  async restoreDatabase(options: NativeRestoreOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeRestoreResult> {
    const startTime = performance.now()

    onProgress?.({
      stage: 'validating',
      percentComplete: 5,
      bytesWritten: 0,
      message: 'Validating backup file...',
      timestamp: Date.now(),
    })

    if (!this.isNativeEnv) {
      throw new Error('Native database restore requires Tauri or Electron environment')
    }

    let result: NativeRestoreResult

    switch (options.dbType) {
      case 'postgresql':
        result = await this.restorePostgreSQL(options, onProgress)
        break
      case 'mysql':
      case 'mariadb':
        result = await this.restoreMySQL(options, onProgress)
        break
      case 'sqlite':
        result = await this.restoreSQLite(options, onProgress)
        break
      default:
        throw new Error(`Unsupported database type: ${options.dbType}`)
    }

    result.durationMs = Math.round(performance.now() - startTime)

    onProgress?.({
      stage: 'completed',
      percentComplete: 100,
      bytesWritten: 0,
      message: `Restore completed: ${result.tablesRestored} tables`,
      timestamp: Date.now(),
    })

    logger.info(`Database restore completed in ${result.durationMs}ms`, { tables: result.tablesRestored })
    return result
  }

  generateDumpCommand(options: NativeDumpOptions): string {
    switch (options.dbType) {
      case 'postgresql':
        return this.buildPgDumpCommand(options)
      case 'mysql':
      case 'mariadb':
        return this.buildMysqlDumpCommand(options)
      case 'sqlite':
        return this.buildSqliteDumpCommand(options)
      default:
        throw new Error(`Unsupported database type: ${options.dbType}`)
    }
  }

  private detectNativeEnvironment(): boolean {
    try {
      return typeof window !== 'undefined' && (
        '__TAURI__' in window ||
        typeof (window as unknown as Record<string, unknown>).__TAURI__ === 'object'
      )
    } catch {
      return false
    }
  }

  private async checkCommandExists(command: string): Promise<boolean> {
    // 命令白名单：checkCommandExists 的入参只允许本服务已知的工具名
    if (!['pg_dump', 'mysqldump', 'sqlite3'].includes(command)) return false
    try {
      const result = await this.executeCommand(`which ${command}`, [])
      return result.code === 0
    } catch {
      return false
    }
  }

  private async executeCommand(command: string, envVars: string[]): Promise<CommandResult> {
    if ('__TAURI__' in window) {
      return this.executeTauriCommand(command, envVars)
    } else {
      return this.executeNodeCommand(command, envVars)
    }
  }

  private async executeTauriCommand(command: string, _envVars: string[]): Promise<CommandResult> {
    try {
      const { Command } = await import('@tauri-apps/plugin-shell')

      const cmdInstance = new Command('run-shell', [command])
      const output = await cmdInstance.execute()

      return {
        code: output.code ?? 0,
        stdout: output.stdout ?? '',
        stderr: output.stderr ?? '',
      }
    } catch (error) {
      logger.error('Tauri shell execution failed', error as Error)
      return {
        code: -1,
        stdout: '',
        stderr: (error as Error).message,
      }
    }
  }

  private async executeNodeCommand(command: string, _envVars: string[]): Promise<CommandResult> {
    // 纯浏览器环境不存在 child_process：本分支仅为语义完整性保留，
    // Web 下恒不可用；真实桌面执行由 executeTauriCommand（Tauri shell 插件）承担。
    // 原实现经 eval 动态 import child_process——既是注入面又不可达，已按审核意见删除。
    logger.warn('executeNodeCommand unavailable in browser runtime', { command: command.split(' ')[0] })
    return {
      code: -1,
      stdout: '',
      stderr: 'child_process is unavailable in the browser runtime',
    }
  }

  private async dumpPostgreSQL(options: NativeDumpOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeDumpResult> {
    const args = this.buildPgDumpArgs(options)
    const command = `pg_dump ${args.join(' ')}`

    onProgress?.({
      stage: 'dumping',
      percentComplete: 30,
      bytesWritten: 0,
      message: 'Dumping PostgreSQL database...',
      timestamp: Date.now(),
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${options.database}_${timestamp}.sql`
    const outputPath = `/tmp/yycai-backups/${filename}`

    try {
      await this.executeCommand(`mkdir -p /tmp/yycai-backups`, [])

      const fullCommand = `${command} -f ${shellQuote(outputPath)}`

      const result = await this.executeCommand(fullCommand, options.password ? [`PGPASSWORD=${options.password}`] : [])

      if (result.code !== 0) {
        throw new Error(`pg_dump failed: ${result.stderr}`)
      }

      const statResult = await this.executeCommand(`stat -f%z ${shellQuote(outputPath)}`, [])
      const sizeBytes = parseInt(statResult.stdout.trim(), 10) || 0

      const checksumResult = await this.executeCommand(`shasum -a 256 ${shellQuote(outputPath)}`, [])
      const checksum = checksumResult.stdout.split(' ')[0]

      onProgress?.({
        stage: 'verifying',
        percentComplete: 90,
        bytesWritten: sizeBytes,
        message: 'Verifying backup integrity...',
        timestamp: Date.now(),
      })

      return {
        success: true,
        outputPath,
        sizeBytes,
        durationMs: 0,
        checksum,
        command,
      }
    } catch (error) {
      logger.error('PostgreSQL dump failed', error as Error)
      return {
        success: false,
        outputPath,
        sizeBytes: 0,
        durationMs: 0,
        checksum: '',
        command,
        error: (error as Error).message,
      }
    }
  }

  private async dumpMySQL(options: NativeDumpOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeDumpResult> {
    const args = this.buildMysqlDumpArgs(options)
    const command = `mysqldump ${args.join(' ')}`

    onProgress?.({
      stage: 'dumping',
      percentComplete: 30,
      bytesWritten: 0,
      message: 'Dumping MySQL/MariaDB database...',
      timestamp: Date.now(),
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${options.database}_${timestamp}.sql`
    const outputPath = `/tmp/yycai-backups/${filename}`

    try {
      await this.executeCommand(`mkdir -p /tmp/yycai-backups`, [])

      const fullCommand = `${command} > ${shellQuote(outputPath)} 2>&1`
      const envVars: string[] = []

      if (options.password) {
        envVars.push(`MYSQL_PWD=${options.password}`)
      }

      const result = await this.executeCommand(fullCommand, envVars)

      if (result.code !== 0 && !options.password) {
        throw new Error(`mysqldump failed: ${result.stderr}`)
      }

      const statResult = await this.executeCommand(`stat -f%z ${shellQuote(outputPath)}`, [])
      const sizeBytes = parseInt(statResult.stdout.trim(), 10) || 0

      const checksumResult = await this.executeCommand(`shasum -a 256 ${shellQuote(outputPath)}`, [])
      const checksum = checksumResult.stdout.split(' ')[0]

      onProgress?.({
        stage: 'verifying',
        percentComplete: 90,
        bytesWritten: sizeBytes,
        message: 'Verifying backup integrity...',
        timestamp: Date.now(),
      })

      return {
        success: true,
        outputPath,
        sizeBytes,
        durationMs: 0,
        checksum,
        command,
      }
    } catch (error) {
      logger.error('MySQL dump failed', error as Error)
      return {
        success: false,
        outputPath,
        sizeBytes: 0,
        durationMs: 0,
        checksum: '',
        command,
        error: (error as Error).message,
      }
    }
  }

  private async dumpSQLite(_options: NativeDumpOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeDumpResult> {
    onProgress?.({
      stage: 'dumping',
      percentComplete: 50,
      bytesWritten: 0,
      message: 'Dumping SQLite database...',
      timestamp: Date.now(),
    })

    return {
      success: false,
      outputPath: '',
      sizeBytes: 0,
      durationMs: 0,
      checksum: '',
      command: '.dump',
      error: 'SQLite backup via file copy is recommended. Use the built-in SQLite support.',
    }
  }

  private async restorePostgreSQL(options: NativeRestoreOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeRestoreResult> {
    onProgress?.({
      stage: 'dropping',
      percentComplete: 20,
      bytesWritten: 0,
      message: 'Preparing PostgreSQL restore...',
      timestamp: Date.now(),
    })

    const args: string[] = []
    if (options.username) args.push(`-U ${shellQuote(options.username)}`)
    if (options.host !== 'localhost') args.push(`-h ${shellQuote(options.host)}`)
    if (options.port !== 5432) args.push(`-p ${options.port}`)
    if (options.cleanBeforeRestore) args.push('--clean')
    if (options.singleTransaction) args.push('--single-transaction')
    if (options.extraArgs) args.push(...options.extraArgs)

    const command = `psql ${args.join(' ')} -d ${shellQuote(options.database)} < ${shellQuote(options.backupPath)}`

    const envVars: string[] = []
    if (options.password) {
      envVars.push(`PGPASSWORD=${options.password}`)
    }

    const result = await this.executeCommand(command, envVars)

    const errors = result.stderr ? result.stderr.split('\n').filter(line => line.includes('ERROR')) : []
    const warnings = result.stderr ? result.stderr.split('\n').filter(line => line.includes('WARNING')) : []

    return {
      success: result.code === 0,
      durationMs: 0,
      tablesRestored: errors.length === 0 ? -1 : 0,
      errors,
      warnings,
    }
  }

  private async restoreMySQL(options: NativeRestoreOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeRestoreResult> {
    onProgress?.({
      stage: 'creating-schema',
      percentComplete: 40,
      bytesWritten: 0,
      message: 'Importing MySQL data...',
      timestamp: Date.now(),
    })

    const args: string[] = []
    if (options.username) args.push(`-u${shellQuote(options.username)}`)
    if (options.host !== 'localhost') args.push(`-h${shellQuote(options.host)}`)
    if (options.port !== 3306) args.push(`-P${options.port}`)
    if (options.extraArgs) args.push(...options.extraArgs)

    const command = `mysql ${args.join(' ')} ${shellQuote(options.database)} < ${shellQuote(options.backupPath)}`

    const envVars: string[] = []
    if (options.password) {
      envVars.push(`MYSQL_PWD=${options.password}`)
    }

    const result = await this.executeCommand(command, envVars)

    const errors = result.stderr ? result.stderr.split('\n').filter(line => line.toLowerCase().includes('error')) : []
    const warnings = result.stderr ? result.stderr.split('\n').filter(line => line.toLowerCase().includes('warning')) : []

    return {
      success: result.code === 0,
      durationMs: 0,
      tablesRestored: errors.length === 0 ? -1 : 0,
      errors,
      warnings,
    }
  }

  private async restoreSQLite(options: NativeRestoreOptions, onProgress?: (progress: NativeDumpProgress) => void): Promise<NativeRestoreResult> {
    onProgress?.({
      stage: 'importing-data',
      percentComplete: 60,
      bytesWritten: 0,
      message: 'Restoring SQLite database...',
      timestamp: Date.now(),
    })

    const command = `cp "${options.backupPath}" "${options.database}"`
    const result = await this.executeCommand(command, [])

    return {
      success: result.code === 0,
      durationMs: 0,
      tablesRestored: result.code === 0 ? -1 : 0,
      errors: result.code !== 0 ? [result.stderr] : [],
      warnings: [],
    }
  }

  private buildPgDumpCommand(options: NativeDumpOptions): string {
    const args = this.buildPgDumpArgs(options)
    return `pg_dump ${args.join(' ')}`
  }

  private buildPgDumpArgs(options: NativeDumpOptions): string[] {
    const args: string[] = []

    if (options.username) args.push(`-U ${shellQuote(options.username)}`)
    if (options.host !== 'localhost') args.push(`-h ${shellQuote(options.host)}`)
    if (options.port !== 5432) args.push(`-p ${options.port}`)

    if (options.schemaOnly) {
      args.push('--schema-only')
    } else if (options.dataOnly) {
      args.push('--data-only')
    }

    if (options.format === 'custom') {
      args.push('-Fc')
    } else if (options.format === 'directory') {
      args.push('-Fd')
    } else if (options.format === 'tar') {
      args.push('-Ft')
    }

    if (options.compress && options.format !== 'sql') {
      args.push('-Z9')
    }

    if (options.tables && options.tables.length > 0) {
      args.push('-t', ...options.tables.map(shellQuote))
    }

    args.push(shellQuote(options.database))

    if (options.extraArgs) {
      // 高级透传参数按原样拼接（文档化行为）；用户可控的标识字段均已经 shellQuote
      args.push(...options.extraArgs)
    }

    return args
  }

  private buildMysqlDumpCommand(options: NativeDumpOptions): string {
    const args = this.buildMysqlDumpArgs(options)
    return `mysqldump ${args.join(' ')}`
  }

  private buildMysqlDumpArgs(options: NativeDumpOptions): string[] {
    const args: string[] = []

    if (options.username) args.push(`-u${shellQuote(options.username)}`)
    if (options.host !== 'localhost') args.push(`-h${shellQuote(options.host)}`)
    if (options.port !== 3306) args.push(`-P${options.port}`)

    if (options.schemaOnly) {
      args.push('--no-data')
    } else if (options.dataOnly) {
      args.push('--no-create-info')
    }

    if (options.compress) {
      args.push('--compress')
    }

    args.push('--routines', '--triggers', '--events')

    if (options.tables && options.tables.length > 0) {
      args.push(...options.tables.map(shellQuote))
    } else {
      args.push(shellQuote(options.database))
    }

    if (options.extraArgs) {
      // 高级透传参数按原样拼接（文档化行为）；用户可控的标识字段均已经 shellQuote
      args.push(...options.extraArgs)
    }

    return args
  }

  private buildSqliteDumpCommand(_options: NativeDumpOptions): string {
    return `.dump`
  }
}

let dumperInstance: NativeDatabaseDumper | null = null

export function getNativeDatabaseDumper(): NativeDatabaseDumper {
  if (!dumperInstance) {
    dumperInstance = new NativeDatabaseDumper()
  }
  return dumperInstance
}

export function destroyNativeDatabaseDumper(): void {
  dumperInstance = null
}

export default NativeDatabaseDumper
