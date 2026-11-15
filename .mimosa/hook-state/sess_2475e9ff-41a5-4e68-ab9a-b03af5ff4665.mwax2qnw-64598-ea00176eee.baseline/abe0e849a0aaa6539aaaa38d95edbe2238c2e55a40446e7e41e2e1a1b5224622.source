/**
 * @file SecurityAuditPanel.tsx
 * @description 安全审计日志面板组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,security,audit,ui
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Shield,
  X,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileText,
  Database,
  Settings,
  Key,
} from 'lucide-react'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { securityAudit, type AuditEvent, type AuditEventType, type AuditSeverity } from '../utils/security-audit'
import { useI18n } from '../i18n/context'

interface SecurityAuditPanelProps {
  visible: boolean
  onClose: () => void
}

const EVENT_TYPE_ICONS: Partial<Record<AuditEventType, React.ReactNode>> = {
  'auth.login': <User size={12} />,
  'auth.logout': <User size={12} />,
  'file.create': <FileText size={12} />,
  'file.read': <FileText size={12} />,
  'file.update': <FileText size={12} />,
  'file.delete': <FileText size={12} />,
  'database.connect': <Database size={12} />,
  'database.query': <Database size={12} />,
  'settings.change': <Settings size={12} />,
  'api.key_generate': <Key size={12} />,
  'api.key_revoke': <Key size={12} />,
}

export function SecurityAuditPanel({ visible, onClose }: SecurityAuditPanelProps) {
  const { locale } = useI18n()
  const { tokens: tk } = useThemeStore()
  const isZh = locale === 'zh'
  
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [filter, setFilter] = useState<{
    type?: AuditEventType
    severity?: AuditSeverity
    success?: boolean
  }>({})
  const [showFilters, setShowFilters] = useState(false)

  const refreshEvents = useCallback(() => {
    const filtered = securityAudit.getEvents(filter)
    setEvents(filtered)
  }, [filter])

  useEffect(() => {
    if (visible) {
      queueMicrotask(() => {
        refreshEvents()
      })
      
      const unsubscribe = securityAudit.subscribe(() => {
        refreshEvents()
      })
      
      return unsubscribe
    }
  }, [visible, refreshEvents])

  const stats = useMemo(() => {
    const allStats = securityAudit.getStats()
    return {
      total: allStats.total,
      critical: allStats.bySeverity.critical,
      high: allStats.bySeverity.high,
      medium: allStats.bySeverity.medium,
      low: allStats.bySeverity.low,
      successRate: allStats.successRate,
      recentFailures: allStats.recentFailures,
    }
  }, [])

  const handleExport = useCallback((format: 'json' | 'csv') => {
    const data = securityAudit.export(format)
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleClear = useCallback(() => {
    if (window.confirm(isZh ? '确定要清除所有审计日志吗？' : 'Are you sure you want to clear all audit logs?')) {
      securityAudit.clear()
      refreshEvents()
    }
  }, [isZh, refreshEvents])

  if (!visible) return null

  const severityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical': return tk.error
      case 'high': return '#ff6b6b'
      case 'medium': return tk.warning
      case 'low': return tk.success
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div
      className="fixed inset-0 flex items-stretch justify-end"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.sm }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col h-full"
        style={{
          width: 520,
          background: tk.panelBg,
          borderLeft: `1px solid ${tk.cardBorder}`,
          backdropFilter: BLUR.lg,
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2">
            <Shield size={16} color={stats.critical > 0 ? tk.error : tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1.5px' }}>
              {isZh ? '安全审计日志' : 'Security Audit Log'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 rounded hover:opacity-70"
              style={{ color: showFilters ? tk.primary : tk.foregroundMuted }}
              title={isZh ? '筛选' : 'Filter'}
            >
              <Filter size={12} />
            </button>
            <button onClick={refreshEvents} className="p-1 rounded hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <RefreshCw size={12} />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b shrink-0" style={{ borderColor: tk.borderDim }}>
          {([
            { label: isZh ? '总计' : 'Total', value: stats.total, color: tk.primary },
            { label: isZh ? '严重' : 'Critical', value: stats.critical, color: tk.error },
            { label: isZh ? '高' : 'High', value: stats.high, color: '#ff6b6b' },
            { label: isZh ? '中' : 'Medium', value: stats.medium, color: tk.warning },
            { label: isZh ? '低' : 'Low', value: stats.low, color: tk.success },
          ]).map(s => (
            <div key={s.label} className="flex flex-col items-center">
              <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: s.color }}>{s.value}</span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{s.label}</span>
            </div>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
              {isZh ? '成功率' : 'Success'}: {(stats.successRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0" style={{ borderColor: tk.borderDim }}>
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter(f => ({ ...f, type: e.target.value as AuditEventType || undefined }))}
              className="px-2 py-1 rounded text-xs"
              style={{
                background: tk.background,
                color: tk.foreground,
                border: `1px solid ${tk.border}`,
                fontFamily: tk.fontMono,
              }}
            >
              <option value="">{isZh ? '所有类型' : 'All types'}</option>
              <option value="auth.login">auth.login</option>
              <option value="auth.logout">auth.logout</option>
              <option value="file.read">file.read</option>
              <option value="file.write">file.write</option>
              <option value="file.delete">file.delete</option>
              <option value="database.query">database.query</option>
              <option value="api.request">api.request</option>
              <option value="security.alert">security.alert</option>
            </select>
            <select
              value={filter.severity || ''}
              onChange={(e) => setFilter(f => ({ ...f, severity: e.target.value as AuditSeverity || undefined }))}
              className="px-2 py-1 rounded text-xs"
              style={{
                background: tk.background,
                color: tk.foreground,
                border: `1px solid ${tk.border}`,
                fontFamily: tk.fontMono,
              }}
            >
              <option value="">{isZh ? '所有级别' : 'All severities'}</option>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
            <select
              value={filter.success === undefined ? '' : filter.success ? 'true' : 'false'}
              onChange={(e) => setFilter(f => ({ ...f, success: e.target.value === '' ? undefined : e.target.value === 'true' }))}
              className="px-2 py-1 rounded text-xs"
              style={{
                background: tk.background,
                color: tk.foreground,
                border: `1px solid ${tk.border}`,
                fontFamily: tk.fontMono,
              }}
            >
              <option value="">{isZh ? '所有状态' : 'All status'}</option>
              <option value="true">{isZh ? '成功' : 'Success'}</option>
              <option value="false">{isZh ? '失败' : 'Failed'}</option>
            </select>
          </div>
        )}

        {/* Event list */}
        <div className="flex-1 overflow-y-auto neon-scrollbar">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Shield size={32} color={tk.success} style={{ opacity: 0.3 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.success }}>
                {isZh ? '无审计日志' : 'No audit logs'}
              </p>
              <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                {isZh ? '系统安全运行中' : 'System is running securely'}
              </p>
            </div>
          ) : (
            events.map(event => (
              <div
                key={event.id}
                className="border-b transition-all"
                style={{
                  borderColor: tk.borderDim,
                  background: !event.success ? `${tk.error}08` : 'transparent',
                }}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="shrink-0 mt-0.5">
                    {EVENT_TYPE_ICONS[event.type] || <Activity size={12} color={severityColor(event.severity)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          fontFamily: tk.fontMono,
                          fontSize: '9px',
                          color: severityColor(event.severity),
                          background: `${severityColor(event.severity)}15`,
                        }}
                      >
                        {event.severity.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
                        {event.type}
                      </span>
                      {event.success ? (
                        <CheckCircle size={10} color={tk.success} />
                      ) : (
                        <AlertTriangle size={10} color={tk.error} />
                      )}
                    </div>
                    <p style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foreground, lineHeight: '16px' }}>
                      {event.action}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock size={10} color={tk.foregroundMuted} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      {event.userId && (
                        <div className="flex items-center gap-1">
                          <User size={10} color={tk.foregroundMuted} />
                          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                            {event.userId}
                          </span>
                        </div>
                      )}
                      {event.resource && (
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary }}>
                          {event.resource}
                        </span>
                      )}
                    </div>
                    {event.errorMessage && (
                      <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error, marginTop: '4px' }}>
                        {event.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t shrink-0" style={{ borderColor: tk.border, background: tk.primaryGlow }}>
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
            {isZh ? '实时监控 · 自动记录敏感操作' : 'Real-time monitoring · Auto-logging sensitive operations'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
              style={{ color: tk.foregroundMuted }}
            >
              <Download size={10} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>JSON</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
              style={{ color: tk.foregroundMuted }}
            >
              <Download size={10} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>CSV</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
              style={{ color: tk.error }}
            >
              <Trash2 size={10} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>{isZh ? '清除' : 'Clear'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
