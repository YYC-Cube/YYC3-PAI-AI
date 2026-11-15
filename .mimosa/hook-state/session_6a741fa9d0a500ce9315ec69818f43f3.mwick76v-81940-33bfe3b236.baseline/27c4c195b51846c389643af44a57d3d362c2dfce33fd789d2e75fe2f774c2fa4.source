/**
 * @file logger.ts
 * @description 统一日志系统 - 替代console.log，支持日志级别、格式化和持久化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-05
 * @updated 2026-04-05
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utility,logging,debug
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface LoggerConfig {
  level: LogLevel
  prefix: string
  showTimestamp: boolean
  showLevel: boolean
  persistToStorage: boolean
  maxStoredLogs: number
  enableInProduction: boolean
}

export interface LogEntry {
  timestamp: number
  level: LogLevel
  module: string
  message: string
  data?: unknown[]
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: import.meta.env.DEV ? 'debug' : 'warn',
  prefix: '[YYC3]',
  showTimestamp: true,
  showLevel: true,
  persistToStorage: false,
  maxStoredLogs: 1000,
  enableInProduction: false,
}

export class Logger {
  private config: LoggerConfig
  private storedLogs: LogEntry[] = []
  private module: string

  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.loadFromStorage()
  }

  private shouldLog(level: LogLevel): boolean {
    if (!import.meta.env.DEV && !this.config.enableInProduction) {
      return level === 'error' || level === 'warn'
    }
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level]
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = []
    
    if (this.config.prefix) {
      parts.push(this.config.prefix)
    }
    
    if (this.config.showTimestamp) {
      parts.push(new Date().toISOString().split('T')[1].slice(0, 12))
    }
    
    if (this.config.showLevel) {
      parts.push(`[${level.toUpperCase()}]`)
    }
    
    parts.push(`[${this.module}]`)
    parts.push(message)
    
    return parts.join(' ')
  }

  private createEntry(level: LogLevel, message: string, data?: unknown[]): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      module: this.module,
      message,
      data,
    }
  }

  private storeLog(entry: LogEntry): void {
    if (!this.config.persistToStorage) return
    
    this.storedLogs.push(entry)
    
    if (this.storedLogs.length > this.config.maxStoredLogs) {
      this.storedLogs = this.storedLogs.slice(-this.config.maxStoredLogs)
    }
    
    this.saveToStorage()
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('yyc3-logs', JSON.stringify(this.storedLogs.slice(-100)))
    } catch {
      // Storage full or unavailable
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('yyc3-logs')
      if (stored) {
        this.storedLogs = JSON.parse(stored)
      }
    } catch {
      this.storedLogs = []
    }
  }

   
  debug(message: string, ...data: unknown[]): void {
    if (!this.shouldLog('debug')) return
    
    const entry = this.createEntry('debug', message, data)
    this.storeLog(entry)
    
    console.debug(this.formatMessage('debug', message), ...data)
  }

   
  info(message: string, ...data: unknown[]): void {
    if (!this.shouldLog('info')) return
    
    const entry = this.createEntry('info', message, data)
    this.storeLog(entry)
    
    console.info(this.formatMessage('info', message), ...data)
  }

   
  warn(message: string, ...data: unknown[]): void {
    if (!this.shouldLog('warn')) return
    
    const entry = this.createEntry('warn', message, data)
    this.storeLog(entry)
    
    console.warn(this.formatMessage('warn', message), ...data)
  }

   
  error(message: string, ...data: unknown[]): void {
    if (!this.shouldLog('error')) return
    
    const entry = this.createEntry('error', message, data)
    this.storeLog(entry)
    
    console.error(this.formatMessage('error', message), ...data)
  }

  log(message: string, ...data: unknown[]): void {
    this.info(message, ...data)
  }

   
  time(label: string): void {
    if (!this.shouldLog('debug')) return
    console.time(this.formatMessage('debug', label))
  }

   
  timeEnd(label: string): void {
    if (!this.shouldLog('debug')) return
    console.timeEnd(this.formatMessage('debug', label))
  }

   
  group(label: string): void {
    if (!this.shouldLog('debug')) return
    console.group(this.formatMessage('debug', label))
  }

   
  groupEnd(): void {
    if (!this.shouldLog('debug')) return
    console.groupEnd()
  }

  getStoredLogs(): LogEntry[] {
    return [...this.storedLogs]
  }

  clearStoredLogs(): void {
    this.storedLogs = []
    localStorage.removeItem('yyc3-logs')
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  getLevel(): LogLevel {
    return this.config.level
  }
}

const loggers = new Map<string, Logger>()

export function createLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  if (loggers.has(module)) {
    return loggers.get(module)!
  }
  
  const logger = new Logger(module, config)
  loggers.set(module, logger)
  return logger
}

export function getLogger(module: string): Logger {
  return loggers.get(module) || createLogger(module)
}

export const rootLogger = createLogger('app')

export default Logger
