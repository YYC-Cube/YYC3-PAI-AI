/**
 * @file logger.test.ts
 * @description 统一日志系统测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger, createLogger, getLogger, rootLogger } from '../logger'

describe('Logger', () => {
  let logger: Logger
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    logger = new Logger('test', {
      level: 'debug',
      persistToStorage: false,
      enableInProduction: true,
    })
    
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('test message')
      expect(consoleSpy.debug).toHaveBeenCalled()
    })

    it('should log info messages', () => {
      logger.info('test message')
      expect(consoleSpy.info).toHaveBeenCalled()
    })

    it('should log warn messages', () => {
      logger.warn('test message')
      expect(consoleSpy.warn).toHaveBeenCalled()
    })

    it('should log error messages', () => {
      logger.error('test message')
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should respect log level', () => {
      const warnLogger = new Logger('warn-test', {
        level: 'warn',
        persistToStorage: false,
        enableInProduction: true,
      })

      warnLogger.debug('should not appear')
      expect(consoleSpy.debug).not.toHaveBeenCalled()

      warnLogger.warn('should appear')
      expect(consoleSpy.warn).toHaveBeenCalled()
    })

    it('should log with silent level', () => {
      const silentLogger = new Logger('silent-test', {
        level: 'silent',
        persistToStorage: false,
        enableInProduction: true,
      })

      silentLogger.error('should not appear')
      expect(consoleSpy.error).not.toHaveBeenCalled()
    })
  })

  describe('message formatting', () => {
    it('should include prefix', () => {
      logger.info('test')
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toContain('[YYC3]')
    })

    it('should include timestamp', () => {
      logger.info('test')
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toMatch(/\d{2}:\d{2}:\d{2}/)
    })

    it('should include level', () => {
      logger.info('test')
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toContain('[INFO]')
    })

    it('should include module name', () => {
      logger.info('test')
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toContain('[test]')
    })

    it('should include message', () => {
      logger.info('hello world')
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toContain('hello world')
    })
  })

  describe('data logging', () => {
    it('should log additional data', () => {
      const data = { key: 'value' }
      logger.info('test', data)
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.any(String), data)
    })

    it('should log multiple data arguments', () => {
      logger.info('test', 'arg1', 'arg2', { key: 'value' })
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        'arg1',
        'arg2',
        { key: 'value' }
      )
    })
  })

  describe('log storage', () => {
    it('should store logs when enabled', () => {
      const storingLogger = new Logger('store-test', {
        level: 'debug',
        persistToStorage: true,
        maxStoredLogs: 100,
      })

      storingLogger.info('test message')
      const logs = storingLogger.getStoredLogs()
      
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('test message')
      expect(logs[0].level).toBe('info')
    })

    it('should limit stored logs', () => {
      const storingLogger = new Logger('limit-test', {
        level: 'debug',
        persistToStorage: true,
        maxStoredLogs: 5,
      })

      for (let i = 0; i < 10; i++) {
        storingLogger.info(`message ${i}`)
      }

      const logs = storingLogger.getStoredLogs()
      expect(logs.length).toBeLessThanOrEqual(5)
    })

    it('should clear stored logs', () => {
      const storingLogger = new Logger('clear-test', {
        level: 'debug',
        persistToStorage: true,
      })

      storingLogger.info('test')
      expect(storingLogger.getStoredLogs()).toHaveLength(1)

      storingLogger.clearStoredLogs()
      expect(storingLogger.getStoredLogs()).toHaveLength(0)
    })
  })

  describe('level management', () => {
    it('should set and get level', () => {
      logger.setLevel('error')
      expect(logger.getLevel()).toBe('error')
    })

    it('should affect logging after level change', () => {
      logger.setLevel('warn')
      
      logger.info('should not appear')
      expect(consoleSpy.info).not.toHaveBeenCalled()
      
      logger.warn('should appear')
      expect(consoleSpy.warn).toHaveBeenCalled()
    })
  })

  describe('time tracking', () => {
    it('should track time', () => {
      const timeSpy = vi.spyOn(console, 'time').mockImplementation(() => {})
      const timeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {})

      logger.time('operation')
      expect(timeSpy).toHaveBeenCalled()

      logger.timeEnd('operation')
      expect(timeEndSpy).toHaveBeenCalled()
    })
  })

  describe('grouping', () => {
    it('should create log groups', () => {
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      logger.group('test group')
      expect(groupSpy).toHaveBeenCalled()

      logger.groupEnd()
      expect(groupEndSpy).toHaveBeenCalled()
    })
  })
})

describe('createLogger', () => {
  it('should create a new logger', () => {
    const logger = createLogger('new-module')
    expect(logger).toBeInstanceOf(Logger)
  })

  it('should return existing logger for same module', () => {
    const logger1 = createLogger('shared-module')
    const logger2 = createLogger('shared-module')
    expect(logger1).toBe(logger2)
  })
})

describe('getLogger', () => {
  it('should return existing logger', () => {
    const created = createLogger('get-test')
    const retrieved = getLogger('get-test')
    expect(retrieved).toBe(created)
  })

  it('should create logger if not exists', () => {
    const logger = getLogger('auto-create')
    expect(logger).toBeInstanceOf(Logger)
  })
})

describe('rootLogger', () => {
  it('should be a Logger instance', () => {
    expect(rootLogger).toBeInstanceOf(Logger)
  })
})
