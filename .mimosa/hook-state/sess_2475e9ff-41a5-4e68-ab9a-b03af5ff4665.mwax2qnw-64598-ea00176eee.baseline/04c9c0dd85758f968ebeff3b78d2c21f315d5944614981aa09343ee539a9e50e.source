/**
 * @file security-audit.ts
 * @description 安全审计日志系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,audit,logging
 */

import { createLogger } from './logger'

const logger = createLogger('security-audit')

export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.token_refresh'
  | 'auth.password_change'
  | 'auth.mfa_enable'
  | 'auth.mfa_disable'
  | 'file.create'
  | 'file.read'
  | 'file.update'
  | 'file.delete'
  | 'file.download'
  | 'file.upload'
  | 'database.connect'
  | 'database.query'
  | 'database.export'
  | 'database.import'
  | 'database.backup'
  | 'database.restore'
  | 'settings.change'
  | 'api.key_generate'
  | 'api.key_revoke'
  | 'api.request'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'permission.grant'
  | 'permission.revoke'
  | 'security.alert'
  | 'security.vulnerability'

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AuditEvent {
  id: string
  type: AuditEventType
  severity: AuditSeverity
  timestamp: number
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  resource?: string
  action: string
  details: Record<string, unknown>
  success: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export interface AuditLogConfig {
  enabled: boolean
  maxEvents: number
  retentionDays: number
  logToConsole: boolean
  logToStorage: boolean
  alertThresholds: {
    failedAttempts: number
    timeWindowMs: number
  }
}

const DEFAULT_CONFIG: AuditLogConfig = {
  enabled: true,
  maxEvents: 10000,
  retentionDays: 30,
  logToConsole: import.meta.env.DEV,
  logToStorage: true,
  alertThresholds: {
    failedAttempts: 5,
    timeWindowMs: 5 * 60 * 1000,
  },
}

export class SecurityAuditLogger {
  private config: AuditLogConfig
  private events: AuditEvent[] = []
  private failedAttempts: Map<string, number[]> = new Map()
  private listeners: Set<(event: AuditEvent) => void> = new Set()

  constructor(config?: Partial<AuditLogConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.loadFromStorage()
  }

  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    if (!this.config.enabled) {
      return this.createEvent(event)
    }

    const fullEvent = this.createEvent(event)
    
    this.events.push(fullEvent)
    this.trimEvents()
    
    if (!event.success) {
      this.trackFailedAttempt(fullEvent)
    }
    
    if (this.config.logToConsole) {
      this.logToConsole(fullEvent)
    }
    
    if (this.config.logToStorage) {
      this.saveToStorage()
    }
    
    this.notifyListeners(fullEvent)
    
    return fullEvent
  }

  private createEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    return {
      ...event,
      id: this.generateId(),
      timestamp: Date.now(),
    }
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private trimEvents(): void {
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents)
    }
  }

  private trackFailedAttempt(event: AuditEvent): void {
    const key = event.userId || event.ip || 'anonymous'
    const now = Date.now()
    const attempts = this.failedAttempts.get(key) || []
    
    attempts.push(now)
    
    const recentAttempts = attempts.filter(
      t => now - t < this.config.alertThresholds.timeWindowMs
    )
    
    this.failedAttempts.set(key, recentAttempts)
    
    if (recentAttempts.length >= this.config.alertThresholds.failedAttempts) {
      this.triggerSecurityAlert(event, recentAttempts.length)
    }
  }

  private triggerSecurityAlert(event: AuditEvent, attemptCount: number): void {
    const alertEvent: AuditEvent = {
      id: this.generateId(),
      type: 'security.alert',
      severity: 'high',
      timestamp: Date.now(),
      userId: event.userId,
      ip: event.ip,
      action: 'security_alert',
      details: {
        reason: 'multiple_failed_attempts',
        attemptCount,
        originalEvent: event.type,
        timeWindow: this.config.alertThresholds.timeWindowMs,
      },
      success: false,
    }
    
    this.events.push(alertEvent)
    this.notifyListeners(alertEvent)
  }

  private logToConsole(event: AuditEvent): void {
    const prefix = `[Audit ${event.severity.toUpperCase()}]`
    const message = `${event.type}: ${event.action}`
    
    switch (event.severity) {
      case 'critical':
        logger.error(prefix, message, event)
        break
      case 'high':
        logger.error(prefix, message, event)
        break
      case 'medium':
        logger.warn(prefix, message, event)
        break
      default:
        logger.info(prefix, message, event)
    }
  }

  private saveToStorage(): void {
    try {
      const key = 'yyc3-security-audit-log'
      const data = {
        events: this.events.slice(-1000),
        lastSaved: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      logger.error('[Audit] Failed to save to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const key = 'yyc3-security-audit-log'
      const data = localStorage.getItem(key)
      
      if (data) {
        const parsed = JSON.parse(data)
        const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000
        
        this.events = (parsed.events || []).filter(
          (e: AuditEvent) => e.timestamp > cutoff
        )
      }
    } catch (error) {
      logger.error('[Audit] Failed to load from storage:', error)
    }
  }

  private notifyListeners(event: AuditEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        logger.error('[Audit] Listener error:', error)
      }
    })
  }

  subscribe(listener: (event: AuditEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getEvents(filter?: {
    type?: AuditEventType
    severity?: AuditSeverity
    userId?: string
    startTime?: number
    endTime?: number
    success?: boolean
  }): AuditEvent[] {
    let filtered = [...this.events]
    
    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(e => e.type === filter.type)
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity)
      }
      if (filter.userId) {
        filtered = filtered.filter(e => e.userId === filter.userId)
      }
      if (filter.startTime !== undefined) {
        filtered = filtered.filter(e => e.timestamp >= filter.startTime!)
      }
      if (filter.endTime !== undefined) {
        filtered = filtered.filter(e => e.timestamp <= filter.endTime!)
      }
      if (filter.success !== undefined) {
        filtered = filtered.filter(e => e.success === filter.success)
      }
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  getEventById(id: string): AuditEvent | undefined {
    return this.events.find(e => e.id === id)
  }

  getStats(): {
    total: number
    byType: Record<AuditEventType, number>
    bySeverity: Record<AuditSeverity, number>
    successRate: number
    recentFailures: number
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    let successCount = 0
    let recentFailures = 0
    
    for (const event of this.events) {
      byType[event.type] = (byType[event.type] || 0) + 1
      bySeverity[event.severity]++
      if (event.success) successCount++
      if (!event.success && event.timestamp > oneHourAgo) recentFailures++
    }
    
    return {
      total: this.events.length,
      byType: byType as Record<AuditEventType, number>,
      bySeverity: bySeverity as Record<AuditSeverity, number>,
      successRate: this.events.length > 0 ? successCount / this.events.length : 1,
      recentFailures,
    }
  }

  clear(): void {
    this.events = []
    this.failedAttempts.clear()
    this.saveToStorage()
  }

  export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2)
    }
    
    const headers = ['id', 'type', 'severity', 'timestamp', 'userId', 'action', 'success', 'errorMessage']
    const rows = this.events.map(e => 
      headers.map(h => {
        const value = e[h as keyof AuditEvent]
        return typeof value === 'string' ? `"${value}"` : String(value ?? '')
      }).join(',')
    )
    
    return [headers.join(','), ...rows].join('\n')
  }
}

export const securityAudit = new SecurityAuditLogger()

export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  return securityAudit.log(event)
}

export function useAuditLog() {
  return {
    log: logAuditEvent,
    getEvents: securityAudit.getEvents.bind(securityAudit),
    getStats: securityAudit.getStats.bind(securityAudit),
    subscribe: securityAudit.subscribe.bind(securityAudit),
  }
}
