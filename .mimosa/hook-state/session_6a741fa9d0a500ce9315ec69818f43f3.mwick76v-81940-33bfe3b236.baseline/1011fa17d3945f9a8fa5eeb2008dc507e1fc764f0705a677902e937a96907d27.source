/**
 * @file PerformanceDashboard.tsx
 * @description 性能仪表板组件，提供Core Web Vitals和组件性能监控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-19
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,performance,ui,component,web-vitals
 */

import { useMemo } from 'react'
import {
  X, Activity,
  BarChart3, Server, AlertTriangle,
  CheckCircle2, RefreshCw, Lightbulb, Layers,
  Target, Gauge,
} from 'lucide-react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import {
  usePerformanceStore,
} from '../store/performance-store'

interface PerformanceDashboardProps {
  visible: boolean
  onClose: () => void
}

export function PerformanceDashboard({ visible, onClose }: PerformanceDashboardProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()

  // 从store获取真实数据
  const webVitals = usePerformanceStore((state) => state.webVitals)
  const componentMetrics = usePerformanceStore((state) => state.componentMetrics)
  const suggestions = usePerformanceStore((state) => state.suggestions)
  const apiMetrics = usePerformanceStore((state) => state.apiMetrics)
  const systemMetricsHistory = usePerformanceStore((state) => state.systemMetricsHistory)
  const isMonitoring = usePerformanceStore((state) => state.isMonitoring)
  const performanceScore = usePerformanceStore((state) => state.performanceScore)

  const clearComponentMetrics = usePerformanceStore((state) => state.clearComponentMetrics)
  const clearSuggestions = usePerformanceStore((state) => state.clearSuggestions)
  const clearAPIMetrics = usePerformanceStore((state) => state.clearAPIMetrics)

  // 当前系统指标
  const currentSystemMetrics = systemMetricsHistory[systemMetricsHistory.length - 1]

  // 慢组件列表
  const slowComponents = useMemo(
    () => componentMetrics.filter((m) => m.renderTime > 16).sort((a, b) => b.renderTime - a.renderTime),
    [componentMetrics]
  )

  // 过滤未处理的建议
  const pendingSuggestions = suggestions.filter((s) => !s.handled)

  // 转换API metrics为数组
  const apiMetricsArray = useMemo(
    () => Array.from(apiMetrics.values()).sort((a, b) => b.avg - a.avg),
    [apiMetrics]
  )

  // 转换系统指标数据为图表格式
  const systemChartData = useMemo(() => {
    return systemMetricsHistory.slice(-30).map((m, i) => ({
      time: `${i}s`,
      cpu: m.cpu,
      memory: m.memory,
      latency: m.latency,
    }))
  }, [systemMetricsHistory])

  if (!visible) return null

  // Web Vitals评分
  const getVitalRating = (value: number | undefined, thresholds: { good: number; needsImprovement: number }) => {
    if (value === undefined) return { rating: 'unknown', color: tk.foregroundMuted }
    if (value <= thresholds.good) return { rating: 'good', color: tk.success }
    if (value <= thresholds.needsImprovement) return { rating: 'needs-improvement', color: tk.warning }
    return { rating: 'poor', color: tk.error }
  }

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${ms.toFixed(0)}ms`
  }

  // 处理建议
  const handleSuggestion = (target: string) => {
    const markSuggestionHandled = usePerformanceStore.getState().markSuggestionHandled
    markSuggestionHandled(target)
  }

  // 图表颜色
  const chartColors = {
    cpu: isCyberpunk ? '#00f0ff' : '#3b82f6',
    mem: isCyberpunk ? '#ff79c6' : '#8b5cf6',
    net: isCyberpunk ? '#00ff88' : '#10b981',
    lat: isCyberpunk ? '#ffaa00' : '#f59e0b',
    grid: isCyberpunk ? 'rgba(0,240,255,0.06)' : 'rgba(0,0,0,0.04)',
    axis: isCyberpunk ? 'rgba(0,240,255,0.3)' : 'rgba(0,0,0,0.2)',
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[5vh]"
      style={{ zIndex: Z_INDEX.topModal + 30, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 960, maxHeight: '90vh',
          background: tk.panelBg, border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <Activity size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '2px' }}>
              Performance Monitor
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: `${isMonitoring ? tk.success : tk.warning}15` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: isMonitoring ? tk.success : tk.warning, animation: isMonitoring ? 'neon-pulse 2s ease-in-out infinite' : 'none' }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: isMonitoring ? tk.success : tk.warning }}>
                {isMonitoring ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Performance Score */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${tk.primary}15` }}>
              <Gauge size={12} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.primary }}>
                {performanceScore.toFixed(0)}/100
              </span>
            </div>
            <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto neon-scrollbar p-5 space-y-5">
          {/* Core Web Vitals */}
          <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={12} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                CORE WEB VITALS
              </span>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {[
                { key: 'lcp' as const, label: 'LCP', desc: '最大内容绘制', thresholds: { good: 2500, needsImprovement: 4000 }, unit: 'ms' },
                { key: 'fid' as const, label: 'FID', desc: '首次输入延迟', thresholds: { good: 100, needsImprovement: 200 }, unit: 'ms' },
                { key: 'inp' as const, label: 'INP', desc: '交互响应性', thresholds: { good: 100, needsImprovement: 200 }, unit: 'ms' },
                { key: 'cls' as const, label: 'CLS', desc: '布局偏移', thresholds: { good: 0.1, needsImprovement: 0.25 }, unit: '' },
                { key: 'fcp' as const, label: 'FCP', desc: '首次内容绘制', thresholds: { good: 1800, needsImprovement: 3000 }, unit: 'ms' },
                { key: 'ttfb' as const, label: 'TTFB', desc: '首字节时间', thresholds: { good: 800, needsImprovement: 1600 }, unit: 'ms' },
              ].map((vital) => {
                const value = webVitals[vital.key]
                const rating = getVitalRating(value, vital.thresholds)
                const displayValue = value === undefined ? '--' : vital.key === 'cls' ? value.toFixed(3) : formatTime(value)
                return (
                  <div key={vital.key} className="flex flex-col items-center p-3 rounded-lg" style={{ background: `${rating.color}10`, border: `1px solid ${rating.color}30` }}>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '0.5px' }}>{vital.desc}</span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '18px', color: rating.color, fontWeight: 'bold', lineHeight: 1.3 }}>
                      {displayValue}{vital.unit && <span style={{ fontSize: '10px' }}>{vital.unit}</span>}
                    </span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: rating.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {vital.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* System Resources */}
          <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={12} color={tk.primary} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                  SYSTEM RESOURCES
                </span>
              </div>
              {currentSystemMetrics && (
                <div className="flex items-center gap-4" style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                  <span style={{ color: chartColors.cpu }}>CPU: {currentSystemMetrics.cpu.toFixed(1)}%</span>
                  <span style={{ color: chartColors.mem }}>MEM: {currentSystemMetrics.memory.toFixed(1)}%</span>
                  <span style={{ color: chartColors.lat }}>LAT: {currentSystemMetrics.latency.toFixed(0)}ms</span>
                </div>
              )}
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemChartData}>
                  <defs>
                    <linearGradient id="grad-cpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.cpu} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColors.cpu} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-mem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.mem} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColors.mem} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: chartColors.axis }} />
                  <YAxis tick={{ fontSize: 9, fill: chartColors.axis }} />
                  <Tooltip
                    contentStyle={{
                      background: tk.panelBg, border: `1px solid ${tk.cardBorder}`,
                      borderRadius: 6, fontFamily: tk.fontMono, fontSize: 10,
                    }}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU" stroke={chartColors.cpu} strokeWidth={2}
                    fill="url(#grad-cpu)" dot={false} isAnimationActive={false} />
                  <Area type="monotone" dataKey="memory" name="Memory" stroke={chartColors.mem} strokeWidth={2}
                    fill="url(#grad-mem)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Slow Components */}
          {slowComponents.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={12} color={tk.warning} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.warning, letterSpacing: '1px' }}>
                    SLOW COMPONENTS ({slowComponents.length})
                  </span>
                </div>
                <button onClick={clearComponentMetrics} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70" style={{ background: `${tk.warning}15`, color: tk.warning, fontFamily: tk.fontMono }}>
                  <RefreshCw size={10} />
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {slowComponents.slice(0, 5).map((component, i) => (
                  <div key={component.name} className="flex items-center justify-between p-2 rounded" style={{ background: `${tk.warning}10`, border: `1px solid ${tk.warning}30` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>#{i + 1}</span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{component.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{component.renderCount} renders</span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.warning, fontWeight: 'bold' }}>{component.renderTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {pendingSuggestions.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    OPTIMIZATION SUGGESTIONS ({pendingSuggestions.length})
                  </span>
                </div>
                <button onClick={clearSuggestions} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70" style={{ background: `${tk.primary}15`, color: tk.primary, fontFamily: tk.fontMono }}>
                  <RefreshCw size={10} />
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {pendingSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={`${suggestion.type}-${suggestion.target}`} className="p-3 rounded-lg" style={{ background: `${suggestion.severity === 'critical' ? tk.error : tk.warning}10`, border: `1px solid ${suggestion.severity === 'critical' ? tk.error : tk.warning}30` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={12} color={suggestion.severity === 'critical' ? tk.error : tk.warning} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: suggestion.severity === 'critical' ? tk.error : tk.warning, fontWeight: 'bold' }}>
                          {suggestion.title}
                        </span>
                      </div>
                      <button onClick={() => handleSuggestion(suggestion.target)} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70" style={{ background: `${tk.success}15`, color: tk.success, fontFamily: tk.fontMono }}>
                        <CheckCircle2 size={10} />
                        Done
                      </button>
                    </div>
                    <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, lineHeight: 1.4 }}>
                      {suggestion.description}
                    </p>
                    {suggestion.expectedImprovement && (
                      <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.success, marginTop: '4px' }}>
                        💡 {suggestion.expectedImprovement}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Performance */}
          {apiMetricsArray.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    API PERFORMANCE
                  </span>
                </div>
                <button onClick={clearAPIMetrics} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70" style={{ background: `${tk.primary}15`, color: tk.primary, fontFamily: tk.fontMono }}>
                  <RefreshCw size={10} />
                  Clear
                </button>
              </div>
              <table className="w-full" style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
                <thead>
                  <tr style={{ color: tk.foregroundMuted }}>
                    <th className="text-left py-1.5 px-2">Endpoint</th>
                    <th className="text-right py-1.5 px-2">Avg</th>
                    <th className="text-right py-1.5 px-2">P95</th>
                    <th className="text-right py-1.5 px-2">P99</th>
                    <th className="text-right py-1.5 px-2">Calls</th>
                    <th className="text-right py-1.5 px-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {apiMetricsArray.slice(0, 8).map((m, i) => (
                    <tr key={m.endpoint} style={{ borderBottom: `1px solid ${tk.borderDim}`, background: i % 2 === 0 ? 'transparent' : tk.primaryGlow }}>
                      <td className="py-1.5 px-2" style={{ color: tk.foreground }}>{m.endpoint}</td>
                      <td className="text-right py-1.5 px-2" style={{ color: m.avg < 1000 ? tk.success : m.avg < 2000 ? tk.warning : tk.error }}>{formatTime(m.avg)}</td>
                      <td className="text-right py-1.5 px-2" style={{ color: tk.foregroundMuted }}>{formatTime(m.p95)}</td>
                      <td className="text-right py-1.5 px-2" style={{ color: tk.foregroundMuted }}>{formatTime(m.p99)}</td>
                      <td className="text-right py-1.5 px-2" style={{ color: tk.primary }}>{m.calls}</td>
                      <td className="text-right py-1.5 px-2" style={{ color: m.errors > 0 ? tk.error : tk.foregroundMuted }}>{m.errors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
