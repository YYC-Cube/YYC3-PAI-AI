/**
 * @file security-audit.test.ts
 * @description 安全审计日志系统测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecurityAuditLogger, logAuditEvent } from '../security-audit'

describe('SecurityAuditLogger', () => {
  let logger: SecurityAuditLogger

  beforeEach(() => {
    logger = new SecurityAuditLogger({
      enabled: true,
      logToConsole: false,
      logToStorage: false,
      maxEvents: 100,
    })
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('log', () => {
    it('should log an audit event', () => {
      const event = logger.log({
        type: 'auth.login',
        severity: 'low',
        userId: 'user-123',
        action: 'User logged in',
        details: { method: 'password' },
        success: true,
      })

      expect(event.id).toBeDefined()
      expect(event.timestamp).toBeDefined()
      expect(event.type).toBe('auth.login')
      expect(event.success).toBe(true)
    })

    it('should generate unique IDs', () => {
      const event1 = logger.log({
        type: 'file.read',
        severity: 'low',
        action: 'Read file',
        details: { path: '/test.txt' },
        success: true,
      })

      const event2 = logger.log({
        type: 'file.read',
        severity: 'low',
        action: 'Read file',
        details: { path: '/test2.txt' },
        success: true,
      })

      expect(event1.id).not.toBe(event2.id)
    })

    it('should not log when disabled', () => {
      const disabledLogger = new SecurityAuditLogger({
        enabled: false,
        logToConsole: false,
        logToStorage: false,
      })

      disabledLogger.log({
        type: 'auth.login',
        severity: 'low',
        action: 'Login',
        details: {},
        success: true,
      })

      const events = disabledLogger.getEvents()
      expect(events).toHaveLength(0)
    })

    it('should trim events when maxEvents is exceeded', () => {
      const smallLogger = new SecurityAuditLogger({
        enabled: true,
        logToConsole: false,
        logToStorage: false,
        maxEvents: 5,
      })

      for (let i = 0; i < 10; i++) {
        smallLogger.log({
          type: 'file.read',
          severity: 'low',
          action: `Read file ${i}`,
          details: {},
          success: true,
        })
      }

      const events = smallLogger.getEvents()
      expect(events).toHaveLength(5)
      expect(events.map((e: { action: string }) => e.action)).toContain('Read file 5')
      expect(events.map((e: { action: string }) => e.action)).toContain('Read file 9')
    })
  })

  describe('failed attempts tracking', () => {
    it('should track failed attempts', () => {
      for (let i = 0; i < 3; i++) {
        logger.log({
          type: 'auth.login',
          severity: 'medium',
          userId: 'user-123',
          action: 'Failed login',
          details: { reason: 'wrong_password' },
          success: false,
        })
      }

      const events = logger.getEvents({ type: 'auth.login', success: false })
      expect(events).toHaveLength(3)
    })

    it('should trigger security alert after threshold', () => {
      const alertLogger = new SecurityAuditLogger({
        enabled: true,
        logToConsole: false,
        logToStorage: false,
        alertThresholds: {
          failedAttempts: 3,
          timeWindowMs: 60000,
        },
      })

      for (let i = 0; i < 3; i++) {
        alertLogger.log({
          type: 'auth.login',
          severity: 'medium',
          userId: 'user-123',
          action: 'Failed login',
          details: {},
          success: false,
        })
      }

      const alerts = alertLogger.getEvents({ type: 'security.alert' })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('high')
    })
  })

  describe('getEvents', () => {
    beforeEach(() => {
      logger.log({
        type: 'auth.login',
        severity: 'low',
        userId: 'user-1',
        action: 'Login',
        details: {},
        success: true,
      })
      logger.log({
        type: 'auth.logout',
        severity: 'low',
        userId: 'user-1',
        action: 'Logout',
        details: {},
        success: true,
      })
      logger.log({
        type: 'file.delete',
        severity: 'high',
        userId: 'user-2',
        action: 'Delete file',
        details: {},
        success: false,
      })
    })

    it('should filter by type', () => {
      const events = logger.getEvents({ type: 'auth.login' })
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('auth.login')
    })

    it('should filter by severity', () => {
      const events = logger.getEvents({ severity: 'high' })
      expect(events).toHaveLength(1)
      expect(events[0].severity).toBe('high')
    })

    it('should filter by userId', () => {
      const events = logger.getEvents({ userId: 'user-1' })
      expect(events).toHaveLength(2)
    })

    it('should filter by success', () => {
      const events = logger.getEvents({ success: false })
      expect(events).toHaveLength(1)
    })

    it('should filter by time range', () => {
      const now = Date.now()
      const events = logger.getEvents({
        startTime: now - 1000,
        endTime: now + 1000,
      })
      expect(events.length).toBe(3)
    })

    it('should return events sorted by timestamp descending', () => {
      const events = logger.getEvents()
      expect(events[0].timestamp).toBeGreaterThanOrEqual(events[1].timestamp)
    })
  })

  describe('getStats', () => {
    beforeEach(() => {
      logger.log({
        type: 'auth.login',
        severity: 'low',
        action: 'Login',
        details: {},
        success: true,
      })
      logger.log({
        type: 'auth.login',
        severity: 'medium',
        action: 'Login failed',
        details: {},
        success: false,
      })
      logger.log({
        type: 'file.delete',
        severity: 'high',
        action: 'Delete',
        details: {},
        success: true,
      })
    })

    it('should return correct stats', () => {
      const stats = logger.getStats()

      expect(stats.total).toBe(3)
      expect(stats.byType['auth.login']).toBe(2)
      expect(stats.byType['file.delete']).toBe(1)
      expect(stats.bySeverity.low).toBe(1)
      expect(stats.bySeverity.medium).toBe(1)
      expect(stats.bySeverity.high).toBe(1)
      expect(stats.successRate).toBeCloseTo(2 / 3)
    })
  })

  describe('subscribe', () => {
    it('should notify listeners on new events', () => {
      const listener = vi.fn()
      logger.subscribe(listener)

      logger.log({
        type: 'auth.login',
        severity: 'low',
        action: 'Login',
        details: {},
        success: true,
      })

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = logger.subscribe(listener)

      logger.log({
        type: 'auth.login',
        severity: 'low',
        action: 'Login',
        details: {},
        success: true,
      })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      logger.log({
        type: 'auth.logout',
        severity: 'low',
        action: 'Logout',
        details: {},
        success: true,
      })
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('export', () => {
    beforeEach(() => {
      logger.log({
        type: 'auth.login',
        severity: 'low',
        userId: 'user-1',
        action: 'Login',
        details: {},
        success: true,
      })
    })

    it('should export to JSON', () => {
      const exported = logger.export('json')
      const parsed = JSON.parse(exported)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
    })

    it('should export to CSV', () => {
      const exported = logger.export('csv')
      const lines = exported.split('\n')

      expect(lines[0]).toContain('id,type,severity')
      expect(lines).toHaveLength(2)
    })
  })

  describe('clear', () => {
    it('should clear all events', () => {
      logger.log({
        type: 'auth.login',
        severity: 'low',
        action: 'Login',
        details: {},
        success: true,
      })

      expect(logger.getEvents()).toHaveLength(1)

      logger.clear()

      expect(logger.getEvents()).toHaveLength(0)
    })
  })
})

describe('logAuditEvent', () => {
  it('should log event using global logger', () => {
    const event = logAuditEvent({
      type: 'file.read',
      severity: 'low',
      action: 'Read file',
      details: { path: '/test.txt' },
      success: true,
    })

    expect(event.id).toBeDefined()
    expect(event.type).toBe('file.read')
  })
})
