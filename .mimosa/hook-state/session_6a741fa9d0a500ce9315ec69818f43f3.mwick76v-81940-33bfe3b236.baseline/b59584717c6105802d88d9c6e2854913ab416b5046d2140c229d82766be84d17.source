/**
 * @file PerformanceAlertPanel.tsx
 * @description 性能告警面板组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,performance,alert,ui
 */

import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  X,
  CheckCircle,
  Bell,
  BellOff,
  Trash2,
  RefreshCw,
  TrendingUp,
  Activity,
  Clock,
  Zap,
} from 'lucide-react'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { performanceMonitor, type PerformanceAlert } from '../utils/performance-monitor'
import { useI18n } from '../i18n/context'

type AlertLevel = 'info' | 'warning' | 'critical'

interface PerformanceAlertPanelProps {
  visible: boolean
  onClose: () => void
}

export function PerformanceAlertPanel({ visible, onClose }: PerformanceAlertPanelProps) {
  const { locale } = useI18n()
  const { tokens: tk } = useThemeStore()
  const isZh = locale === 'zh'
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(false)

  const refreshAlerts = useCallback(() => {
    const allAlerts = performanceMonitor.getAlerts()
    setAlerts(allAlerts)
  }, [])

  useEffect(() => {
    if (visible) {
      queueMicrotask(() => {
        refreshAlerts()
      })
      
      const unsubscribe = performanceMonitor.onAlert((alert) => {
        setAlerts(prev => [...prev, alert])
        if (soundEnabled && alert.level === 'critical') {
          try {
            const audioContext = new AudioContext()
            const oscillator = audioContext.createOscillator()
            oscillator.frequency.value = 800
            oscillator.connect(audioContext.destination)
            oscillator.start()
            setTimeout(() => oscillator.stop(), 100)
          } catch {
            // Ignore audio errors
          }
        }
      })

      return unsubscribe
    }
  }, [visible, refreshAlerts, soundEnabled])

  const handleAcknowledge = useCallback((alertId: string) => {
    performanceMonitor.acknowledgeAlert(alertId)
    refreshAlerts()
  }, [refreshAlerts])

  const handleClearAcknowledged = useCallback(() => {
    performanceMonitor.clearAcknowledgedAlerts()
    refreshAlerts()
  }, [refreshAlerts])

  const handleClearAll = useCallback(() => {
    setAlerts([])
    performanceMonitor.clearAcknowledgedAlerts()
  }, [])

  if (!visible) return null

  const levelColor = (level: AlertLevel) => {
    switch (level) {
      case 'critical': return tk.error
      case 'warning': return tk.warning
      case 'info': return tk.primary
    }
  }

  const levelIcon = (level: AlertLevel, size = 14) => {
    switch (level) {
      case 'critical': return <AlertTriangle size={size} color={tk.error} />
      case 'warning': return <AlertTriangle size={size} color={tk.warning} />
      case 'info': return <Activity size={size} color={tk.primary} />
    }
  }

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length
  const criticalCount = alerts.filter(a => a.level === 'critical' && !a.acknowledged).length

  return (
    <div
      className="fixed inset-0 flex items-stretch justify-end"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.sm }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col h-full"
        style={{
          width: 420,
          background: tk.panelBg,
          borderLeft: `1px solid ${tk.cardBorder}`,
          backdropFilter: BLUR.lg,
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2">
            <Bell size={16} color={criticalCount > 0 ? tk.error : tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1.5px' }}>
              {isZh ? '性能告警' : 'Performance Alerts'}
            </span>
            {unacknowledgedCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full"
                style={{
                  fontFamily: tk.fontMono,
                  fontSize: '10px',
                  color: tk.background,
                  background: criticalCount > 0 ? tk.error : tk.warning,
                }}
              >
                {unacknowledgedCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded hover:opacity-70"
              style={{ color: soundEnabled ? tk.primary : tk.foregroundMuted }}
              title={isZh ? '声音告警' : 'Sound alerts'}
            >
              {soundEnabled ? <Bell size={12} /> : <BellOff size={12} />}
            </button>
            <button onClick={refreshAlerts} className="p-1 rounded hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <RefreshCw size={12} />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0" style={{ borderColor: tk.borderDim }}>
          {([
            { level: 'critical' as const, count: alerts.filter(a => a.level === 'critical' && !a.acknowledged).length, color: tk.error },
            { level: 'warning' as const, count: alerts.filter(a => a.level === 'warning' && !a.acknowledged).length, color: tk.warning },
            { level: 'info' as const, count: alerts.filter(a => a.level === 'info' && !a.acknowledged).length, color: tk.primary },
          ]).map(s => (
            <div key={s.level} className="flex items-center gap-1">
              {levelIcon(s.level, 10)}
              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: s.color }}>{s.count}</span>
            </div>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleClearAcknowledged}
            className="flex items-center gap-1 px-2 py-0.5 rounded transition-all hover:opacity-80"
            style={{ color: tk.foregroundMuted }}
          >
            <Trash2 size={10} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>{isZh ? '清除已确认' : 'Clear acknowledged'}</span>
          </button>
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto neon-scrollbar">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle size={32} color={tk.success} style={{ opacity: 0.3 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.success }}>
                {isZh ? '无性能告警' : 'No performance alerts'}
              </p>
              <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                {isZh ? '系统运行正常' : 'System is running smoothly'}
              </p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className="border-b transition-all"
                style={{
                  borderColor: tk.borderDim,
                  background: alert.acknowledged ? 'transparent' : `${levelColor(alert.level)}08`,
                  opacity: alert.acknowledged ? 0.6 : 1,
                }}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="shrink-0 mt-0.5">{levelIcon(alert.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          fontFamily: tk.fontMono,
                          fontSize: '9px',
                          color: levelColor(alert.level),
                          background: `${levelColor(alert.level)}15`,
                        }}
                      >
                        {alert.level.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
                        {alert.metric}
                      </span>
                    </div>
                    <p style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foreground, lineHeight: '16px' }}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock size={10} color={tk.foregroundMuted} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={10} color={levelColor(alert.level)} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: levelColor(alert.level) }}>
                          {alert.value.toFixed(1)} {alert.level === 'critical' ? '⚠️' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap size={10} color={tk.foregroundMuted} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                          {'>'}{alert.threshold}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="shrink-0 px-2 py-1 rounded transition-all hover:opacity-80"
                      style={{
                        fontFamily: tk.fontMono,
                        fontSize: '9px',
                        color: tk.primary,
                        background: tk.primaryGlow,
                        border: `1px solid ${tk.border}`,
                      }}
                    >
                      <CheckCircle size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t shrink-0" style={{ borderColor: tk.border, background: tk.primaryGlow }}>
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
            {isZh ? '实时监控 · 点击确认处理告警' : 'Real-time monitoring · Click to acknowledge'}
          </span>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ color: tk.foregroundMuted }}
          >
            <Trash2 size={10} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>{isZh ? '清除全部' : 'Clear all'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
