/**
 * @file ActivityLog.tsx
 * @description 活动日志组件，提供活动记录
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags activity,log,ui,component
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  X, Clock, FileText, GitBranch, Bot, Settings,
  Trash2, ChevronRight, Calendar, Filter, Download, Upload,
  RotateCcw,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { useActivityStore, type ActivityCategory, type ActivityEntry } from '../store/activity-store'

interface ActivityLogProps {
  visible: boolean
  onClose: () => void
}

type ActivityTab = 'all' | ActivityCategory

/** Preset date range options */
type DateRangePreset = 'all' | '1h' | '24h' | '7d' | 'custom'

const CATEGORY_ICON: Record<ActivityCategory, React.ElementType> = {
  file: FileText,
  git: GitBranch,
  ai: Bot,
  system: Settings,
}

/** Format timestamps as relative human-readable strings */
function formatRelativeTime(ts: number, isZh: boolean): string {
  const diff = Date.now() - ts
  if (diff < 60000) return isZh ? '刚刚' : 'Just now'
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000)
    return isZh ? `${m} 分钟前` : `${m}m ago`
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000)
    return isZh ? `${h} 小时前` : `${h}h ago`
  }
  const d = Math.floor(diff / 86400000)
  return isZh ? `${d} 天前` : `${d}d ago`
}

/** Format date for input[type=datetime-local] */
function toLocalDatetimeString(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ActivityLog({ visible, onClose }: ActivityLogProps) {
  const { t, locale } = useI18n()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const isZh = locale === 'zh'
  const { entries, clearAll, importEntries } = useActivityStore()

  const [tab, setTab] = useState<ActivityTab>('all')
  const [dateRange, setDateRange] = useState<DateRangePreset>('all')
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // ===== Tab order drag-to-reorder =====
  const TAB_ORDER_LS_KEY = 'yyc3_activity_tab_order'
  const DEFAULT_TAB_ORDER = useMemo<ActivityTab[]>(() => ['all', 'file', 'git', 'ai', 'system'], [])

  const loadTabOrder = useCallback((): ActivityTab[] => {
    try {
      const raw = localStorage.getItem(TAB_ORDER_LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_TAB_ORDER.length &&
          DEFAULT_TAB_ORDER.every(k => parsed.includes(k))) {
          return parsed as ActivityTab[]
        }
      }
    } catch { /* ignore */ }
    return [...DEFAULT_TAB_ORDER]
  }, [DEFAULT_TAB_ORDER])

  const [tabOrder, setTabOrder] = useState<ActivityTab[]>(loadTabOrder())
  const [draggingTab, setDraggingTab] = useState<ActivityTab | null>(null)

  const hasCustomTabOrder = useMemo(
    () => tabOrder.some((k, i) => k !== DEFAULT_TAB_ORDER[i]),
    [tabOrder, DEFAULT_TAB_ORDER],
  )

  const handleTabDragStart = useCallback((e: React.DragEvent, tabKey: ActivityTab) => {
    e.dataTransfer.setData('text/plain', `tab:${tabKey}`)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingTab(tabKey)
  }, [])

  const handleTabDragOver = useCallback((e: React.DragEvent, _tabKey: ActivityTab) => {
    if (!draggingTab) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [draggingTab])

  const handleTabDrop = useCallback((targetTab: ActivityTab) => {
    if (!draggingTab || draggingTab === targetTab) {
      setDraggingTab(null)
      return
    }
    setTabOrder(prev => {
      const newOrder = [...prev]
      const fromIdx = newOrder.indexOf(draggingTab)
      const toIdx = newOrder.indexOf(targetTab)
      newOrder.splice(fromIdx, 1)
      newOrder.splice(toIdx, 0, draggingTab)
      try { localStorage.setItem(TAB_ORDER_LS_KEY, JSON.stringify(newOrder)) } catch { /* */ }
      return newOrder
    })
    setDraggingTab(null)
  }, [draggingTab])

  const handleTabDragEnd = useCallback(() => {
    setDraggingTab(null)
  }, [])

  const handleResetTabOrder = useCallback(() => {
    const def = [...DEFAULT_TAB_ORDER]
    setTabOrder(def)
    try { localStorage.setItem(TAB_ORDER_LS_KEY, JSON.stringify(def)) } catch { /* */ }
  }, [DEFAULT_TAB_ORDER])

  /** Compute time bounds based on preset or custom range */
  const timeBounds = useMemo<{ from: number; to: number } | null>(() => {
    const now = currentTime
    switch (dateRange) {
      case '1h': return { from: now - 3600000, to: now }
      case '24h': return { from: now - 86400000, to: now }
      case '7d': return { from: now - 7 * 86400000, to: now }
      case 'custom': {
        const from = customFrom ? new Date(customFrom).getTime() : 0
        const to = customTo ? new Date(customTo).getTime() : now
        return (from || to !== now) ? { from, to } : null
      }
      default: return null
    }
  }, [dateRange, customFrom, customTo, currentTime])

  const filtered = useMemo(() => {
    let result = entries
    // Category filter
    if (tab !== 'all') {
      result = result.filter(a => a.category === tab)
    }
    // Date range filter
    if (timeBounds) {
      result = result.filter(a => a.timestamp >= timeBounds.from && a.timestamp <= timeBounds.to)
    }
    return result
  }, [entries, tab, timeBounds])

  const tabs: { key: ActivityTab; labelKey: string; icon: React.ElementType }[] = [
    { key: 'all', labelKey: 'tabAll', icon: Clock },
    { key: 'file', labelKey: 'tabFile', icon: FileText },
    { key: 'git', labelKey: 'tabGit', icon: GitBranch },
    { key: 'ai', labelKey: 'tabAI', icon: Bot },
    { key: 'system', labelKey: 'tabSystem', icon: Settings },
  ]

  const datePresets: { key: DateRangePreset; labelKey: string }[] = [
    { key: 'all', labelKey: 'rangeAll' },
    { key: '1h', labelKey: 'rangeLast1h' },
    { key: '24h', labelKey: 'rangeLast24h' },
    { key: '7d', labelKey: 'rangeLast7d' },
    { key: 'custom', labelKey: 'rangeCustom' },
  ]

  /** Show a temporary status message */
  const flashStatus = useCallback((msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(null), 3000)
  }, [])

  /** Export filtered entries as JSON */
  const handleExport = useCallback(() => {
    const data = JSON.stringify(filtered, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yyc3-activity-log-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    const msg = t('activity', 'exportSuccess').replace('{count}', String(filtered.length))
    flashStatus(msg)
  }, [filtered, t, flashStatus])

  /** Import entries from a JSON file */
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (!Array.isArray(parsed)) {
          flashStatus(t('activity', 'importFail'))
          return
        }
        // Validate entries have required fields
        const valid = parsed.filter(
          (entry: unknown): entry is ActivityEntry => {
            if (typeof entry !== 'object' || entry === null) return false
            const e = entry as Record<string, unknown>
            return typeof e.id === 'string' &&
              typeof e.category === 'string' &&
              typeof e.message === 'string' &&
              typeof e.timestamp === 'number'
          }
        ) as ActivityEntry[]
        if (valid.length === 0) {
          flashStatus(t('activity', 'importFail'))
          return
        }
        const imported = importEntries(valid)
        if (imported === 0) {
          flashStatus(t('activity', 'importNone'))
        } else {
          const msg = t('activity', 'importSuccess').replace('{count}', String(imported))
          flashStatus(msg)
        }
      } catch {
        flashStatus(t('activity', 'importFail'))
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be imported again
    e.target.value = ''
  }, [importEntries, t, flashStatus])

  // 面板门控：IDEOverlays 按 visible 契约控制挂载（历史缺陷：曾忽略该 prop 致全屏覆盖层常驻）
  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: Z_INDEX.assistPanel,
      background: tk.overlayBg, backdropFilter: BLUR.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: 700, maxHeight: '80vh',
          background: tk.panelBg, border: `1px solid ${tk.border}`,
          borderRadius: tk.borderRadius, boxShadow: tk.shadow,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          backdropFilter: BLUR.lg,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${tk.borderDim}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color={tk.primary} />
              <span style={{ fontFamily: tk.fontDisplay, fontSize: '14px', color: tk.primary, letterSpacing: '1px' }}>
                {t('activity', 'title')}
              </span>
            </div>
            <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 2 }}>
              {t('activity', 'subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Date filter toggle */}
            <button
              onClick={() => setShowDateFilter(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: tk.borderRadius,
                background: showDateFilter ? tk.primaryGlow : 'transparent',
                color: showDateFilter ? tk.primary : tk.foregroundMuted,
                border: `1px solid ${showDateFilter ? tk.primary : tk.borderDim}`,
                fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Filter size={11} /> {t('activity', 'dateRange')}
            </button>
            {/* Export */}
            <button
              onClick={handleExport}
              title={t('activity', 'exportLog')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: tk.borderRadius,
                background: 'transparent', color: tk.primary,
                border: `1px solid ${tk.borderDim}`,
                fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
              }}
            >
              <Download size={11} /> {t('activity', 'exportLog')}
            </button>
            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title={t('activity', 'importLog')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: tk.borderRadius,
                background: 'transparent', color: tk.secondary ?? tk.primary,
                border: `1px solid ${tk.borderDim}`,
                fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
              }}
            >
              <Upload size={11} /> {t('activity', 'importLog')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            {/* Clear all */}
            <button onClick={clearAll} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: tk.borderRadius,
              background: 'transparent', color: tk.error, border: `1px solid ${tk.error}`,
              fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer', opacity: 0.7,
            }}>
              <Trash2 size={11} /> {t('activity', 'clearAll')}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tk.foregroundMuted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status message banner */}
        {statusMessage && (
          <div style={{
            padding: '6px 20px',
            background: `${tk.success}15`,
            borderBottom: `1px solid ${tk.success}30`,
            fontFamily: tk.fontMono,
            fontSize: '10px',
            color: tk.success,
            textAlign: 'center',
            transition: 'all 0.3s',
          }}>
            {statusMessage}
          </div>
        )}

        {/* Date range filter row */}
        {showDateFilter && (
          <div style={{
            padding: '8px 20px', borderBottom: `1px solid ${tk.borderDim}`,
            display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          }}>
            <Calendar size={12} color={tk.foregroundMuted} />
            {datePresets.map(preset => {
              const active = dateRange === preset.key
              return (
                <button
                  key={preset.key}
                  onClick={() => setDateRange(preset.key)}
                  style={{
                    padding: '3px 8px', borderRadius: tk.borderRadius,
                    border: `1px solid ${active ? tk.primary : tk.borderDim}`,
                    background: active ? tk.primaryGlow : 'transparent',
                    color: active ? tk.primary : tk.foregroundMuted,
                    fontFamily: tk.fontMono, fontSize: '9px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {t('activity', preset.labelKey)}
                </button>
              )
            })}

            {/* Custom date inputs */}
            {dateRange === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                  {t('activity', 'rangeFrom')}
                </span>
                <input
                  type="datetime-local"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  max={customTo || toLocalDatetimeString(currentTime)}
                  style={{
                    fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground,
                    background: tk.inputBg, border: `1px solid ${tk.inputBorder}`,
                    borderRadius: tk.borderRadius, padding: '2px 6px',
                    colorScheme: isCyberpunk ? 'dark' : 'light',
                  }}
                />
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                  {t('activity', 'rangeTo')}
                </span>
                <input
                  type="datetime-local"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  min={customFrom}
                  max={toLocalDatetimeString(currentTime)}
                  style={{
                    fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground,
                    background: tk.inputBg, border: `1px solid ${tk.inputBorder}`,
                    borderRadius: tk.borderRadius, padding: '2px 6px',
                    colorScheme: isCyberpunk ? 'dark' : 'light',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '8px 20px', borderBottom: `1px solid ${tk.borderDim}` }}>
          {tabOrder.map(t2 => {
            const active = tab === t2
            const Icon = tabs.find(tabDef => tabDef.key === t2)?.icon ?? Clock
            return (
              <button
                key={t2}
                onClick={() => setTab(t2)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: tk.borderRadius,
                  border: `1px solid ${active ? tk.primary : tk.borderDim}`,
                  background: active ? tk.primaryGlow : 'transparent',
                  color: active ? tk.primary : tk.foregroundMuted,
                  fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                draggable
                onDragStart={e => handleTabDragStart(e, t2)}
                onDragOver={e => handleTabDragOver(e, t2)}
                onDrop={() => handleTabDrop(t2)}
                onDragEnd={handleTabDragEnd}
              >
                <Icon size={11} /> {t('activity', tabs.find(tabDef => tabDef.key === t2)?.labelKey ?? 'tabAll')}
              </button>
            )
          })}
          {hasCustomTabOrder && (
            <button
              onClick={handleResetTabOrder}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: tk.borderRadius,
                background: 'transparent', color: tk.primary,
                border: `1px solid ${tk.borderDim}`,
                fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
              }}
            >
              <RotateCcw size={11} /> {t('activity', 'resetTabOrder')}
            </button>
          )}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Clock size={32} color={tk.foregroundMuted} style={{ opacity: 0.3, margin: '0 auto' }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foregroundMuted, marginTop: 12 }}>
                {t('activity', 'empty')}
              </p>
            </div>
          ) : (
            filtered.map((entry, idx) => {
              const Icon = CATEGORY_ICON[entry.category]
              const catColor = entry.category === 'ai' ? tk.secondary
                : entry.category === 'git' ? tk.success
                  : entry.category === 'system' ? tk.warning
                    : tk.primary
              return (
                <div key={entry.id} style={{
                  display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12,
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${tk.borderDim}` : 'none',
                }}>
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: `${catColor}15`, border: `1px solid ${catColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={12} color={catColor} />
                    </div>
                    {idx < filtered.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: tk.borderDim, marginTop: 4 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
                        {isZh ? entry.messageZh : entry.message}
                      </span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {formatRelativeTime(entry.timestamp, isZh)}
                      </span>
                    </div>
                    {entry.detail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <ChevronRight size={10} color={tk.foregroundMuted} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
                          {entry.detail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 20px', borderTop: `1px solid ${tk.borderDim}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
            {filtered.length} / {entries.length} {isZh ? '条记录' : 'entries'}
            {dateRange !== 'all' && (
              <span style={{ marginLeft: 8, color: tk.primary }}>
                [{t('activity', datePresets.find(p => p.key === dateRange)?.labelKey ?? 'rangeAll')}]
              </span>
            )}
          </span>
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.5 }}>
            YYC&#179; v4.8.0
          </span>
        </div>
      </div>
    </div>
  )
}
