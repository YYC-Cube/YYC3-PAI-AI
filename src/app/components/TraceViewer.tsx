/**
 * @file TraceViewer.tsx
 * @description 请求级追踪查看面板 — 消费 trace-store（对标 Langfuse trace 视图本地版）
 *
 * 展示：单次 AI 请求完整链路（prompt→model→latency→tokens→cost→tool_calls→output）
 * 操作：查看详情 / 导出 OTel JSON / 清空
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags trace,viewer,observability,audit,phase-3
 */

import { useEffect, useState, useCallback } from 'react'
import { Activity, Download, Trash2, Clock, DollarSign, Wrench, X } from 'lucide-react'
import { getRecentTraces, getTraceSummary, clearTraces, type TraceRecord, type TraceSummary } from '../services/trace-store'
import { downloadOtelExport } from '../services/otel-adapter'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

export function TraceViewer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tokens: tk } = useThemeStore()
  const [traces, setTraces] = useState<TraceRecord[]>([])
  const [summary, setSummary] = useState<TraceSummary | null>(null)
  const [selected, setSelected] = useState<TraceRecord | null>(null)

  const refresh = useCallback(async () => {
    const [t, s] = await Promise.all([getRecentTraces(30), getTraceSummary()])
    setTraces(t)
    setSummary(s)
  }, [])

  useEffect(() => {
    if (visible) refresh()
  }, [visible, refresh])

  if (!visible) return null

  const handleExport = () => {
    if (traces.length) downloadOtelExport(traces)
  }

  const handleClear = async () => {
    await clearTraces()
    refresh()
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
          width: 520, background: tk.panelBg, borderLeft: `1px solid ${tk.cardBorder}`,
          backdropFilter: BLUR.lg,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2">
            <Activity size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1.5px' }}>
              请求追踪
            </span>
            {summary && (
              <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, background: tk.cardBg }}>
                {summary.totalTraces} 条 · 成功率 {(summary.successRate * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="p-1.5 rounded transition-all hover:opacity-70" style={{ color: tk.secondary }} title="导出 OTel JSON">
              <Download size={14} />
            </button>
            <button onClick={handleClear} className="p-1.5 rounded transition-all hover:opacity-70" style={{ color: tk.error }} title="清空">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-2 px-4 py-3 shrink-0">
            {[
              { label: '平均延迟', value: `${summary.avgFirstTokenMs}ms`, icon: Clock, color: tk.warning },
              { label: '工具调用', value: String(summary.toolCallCount), icon: Wrench, color: tk.secondary },
              { label: '总成本', value: `$${summary.totalCostUsd.toFixed(4)}`, icon: DollarSign, color: tk.success },
              { label: '成功率', value: `${(summary.successRate * 100).toFixed(0)}%`, icon: Activity, color: tk.primary },
            ].map(card => (
              <div key={card.label} className="p-2 rounded-lg text-center" style={{ background: tk.cardBg, border: `1px solid ${tk.borderDim}` }}>
                <card.icon size={12} color={card.color} className="mx-auto mb-1" />
                <div style={{ fontFamily: tk.fontMono, fontSize: '12px', color: card.color }}>{card.value}</div>
                <div style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trace list */}
        <div className="flex-1 overflow-y-auto">
          {traces.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center py-12">
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
                暂无追踪记录。发送 AI 消息后自动生成。
              </p>
            </div>
          ) : (
            traces.map(trace => (
              <div
                key={trace.id}
                onClick={() => setSelected(trace)}
                className="px-4 py-2.5 cursor-pointer transition-all border-b"
                style={{
                  borderBottom: `1px solid ${tk.borderDim}`,
                  background: selected?.id === trace.id ? tk.primaryGlow : 'transparent',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: trace.success ? tk.success : tk.error }}
                  />
                  <span className="flex-1 truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
                    {trace.promptPreview}
                  </span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                    {trace.totalMs}ms
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                  <span>{trace.model}</span>
                  <span>↑{trace.inputTokens} ↓{trace.outputTokens}</span>
                  {trace.toolCalls.length > 0 && (
                    <span style={{ color: tk.secondary }}>🔧 {trace.toolCalls.length} tools</span>
                  )}
                  <span className="ml-auto">{new Date(trace.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail view */}
        {selected && (
          <div
            className="border-t shrink-0 max-h-[40%] overflow-y-auto px-4 py-3"
            style={{ borderColor: tk.border, background: tk.backgroundAlt }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.primary }}>链路详情</span>
              <button onClick={() => setSelected(null)} className="p-1 rounded" style={{ color: tk.foregroundMuted }}>
                <X size={12} />
              </button>
            </div>
            <div className="space-y-1.5" style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>Prompt</span>
                <span style={{ color: tk.foreground, maxWidth: 300 }} className="truncate">{selected.promptPreview}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>Model</span>
                <span style={{ color: tk.foreground }}>{selected.provider}/{selected.model}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>首 Token</span>
                <span style={{ color: tk.warning }}>{selected.firstTokenMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>总耗时</span>
                <span style={{ color: tk.warning }}>{selected.totalMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>Tokens</span>
                <span style={{ color: tk.foreground }}>↑{selected.inputTokens} ↓{selected.outputTokens}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>成本</span>
                <span style={{ color: tk.success }}>${selected.costUsd.toFixed(5)}</span>
              </div>
              {selected.toolCalls.length > 0 && (
                <div>
                  <span style={{ color: tk.foregroundMuted }}>工具调用 ({selected.toolCalls.length})</span>
                  {selected.toolCalls.map((tc, i) => (
                    <div key={i} className="flex gap-2 mt-1 pl-2" style={{ borderLeft: `2px solid ${tc.isError ? tk.error : tk.secondary}` }}>
                      <span style={{ color: tc.isError ? tk.error : tk.secondary }}>{tc.tool}</span>
                      <span style={{ color: tk.foregroundMuted }}>{tc.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
                <span style={{ color: tk.foregroundMuted }}>Output</span>
                <p className="mt-1" style={{ color: tk.foreground, whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'hidden' }}>
                  {selected.completion.slice(0, 200)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
