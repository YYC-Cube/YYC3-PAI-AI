/**
 * @file QuickActionsPanel.tsx
 * @description YYC3 AI Quick Actions Panel — 选区浮动工具栏，支持代码/文档/文本一键 AI 操作 + 剪贴板历史
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @tags panel,quick-actions,ai,ui
 *
 * 对齐 Guidelines: P1-AI-quick-actions — 浮动操作栏 + 上下文感知 + AI 辅助操作 + 剪贴板管理
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Copy, FileCode, Code2, RefreshCw, Zap, AlignLeft, BookOpen, Languages,
  PenLine, HelpCircle, Bug, MessageSquarePlus, X, ChevronDown, ChevronUp,
  Clipboard, Trash2, Clock, CheckCircle2, AlertCircle, Loader2,
  ArrowRightLeft, ListCollapse, Maximize2, SpellCheck, TestTube2,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, type ThemeTokens } from '../store/theme-store'
import { useModelStore } from '../store/model-store'
import {
  useQuickActionsStore,
  quickActionsStore,
  ACTION_REGISTRY,
  type ActionType,
  type ActionContext,
  type ActionConfig,
  type ActionResult,
} from '../store/quick-actions-store'

// ===== Icon Map =====
const ICON_MAP: Record<string, React.ElementType> = {
  Copy, FileCode, Code2, RefreshCw, Zap, AlignLeft, BookOpen, Languages,
  PenLine, HelpCircle, Bug, MessageSquarePlus, Replace: RefreshCw,
  ArrowRightLeft, ListCollapse, Maximize2, SpellCheck, TestTube2,
}

// ===== Props =====
export interface QuickActionsPanelProps {
  /** 当前选区上下文 */
  context: ActionContext | null
  /** 面板位置 (绝对定位) */
  position?: { x: number; y: number }
  /** 面板是否可见 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 将 AI 操作结果应用到编辑器的回调 */
  onApplyResult?: (result: string, action: ActionType) => void
  /** 显示剪贴板历史面板 */
  showClipboard?: boolean
}

export function QuickActionsPanel({
  context,
  position,
  visible,
  onClose,
  onApplyResult,
  showClipboard = false,
}: QuickActionsPanelProps) {
  const { t, locale } = useI18n()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { sendToActiveModel, getActiveModel } = useModelStore()
  const qaState = useQuickActionsStore()

  const [expanded, setExpanded] = useState(false)
  const [clipboardOpen, setClipboardOpen] = useState(showClipboard)
  const [activeResult, setActiveResult] = useState<ActionResult | null>(null)
  const [translateLang, setTranslateLang] = useState<string>(locale === 'zh' ? 'en' : 'zh')
  const panelRef = useRef<HTMLDivElement>(null)

  // Draggable panel position
  const [panelPos, setPanelPos] = useState({ x: position?.x ?? 100, y: position?.y ?? 100 })
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  // Sync position prop to state (only on first show / prop change)
  useEffect(() => {
    if (position && visible) {
      queueMicrotask(() => {
        setPanelPos((prev) => {
          if (prev.x !== position.x || prev.y !== position.y) {
            return { x: position.x, y: position.y }
          }
          return prev
        })
      })
    }
  }, [position, visible])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: panelPos.x, startPosY: panelPos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      setPanelPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.startPosX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.startPosY + dy)),
      })
    }
    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.userSelect = 'none'
  }, [panelPos])

  const isZh = locale === 'zh'
  const hasAI = !!getActiveModel()

  // Update context when it changes
  useEffect(() => {
    if (context && context.selection.trim()) {
      quickActionsStore.updateContext(context)
    } else {
      quickActionsStore.clearContext()
    }
  }, [context])

  // Recommended actions from context analysis
  const recommended = qaState.recommendedActions
  const primaryActions = useMemo(() => recommended.slice(0, expanded ? 20 : 6), [recommended, expanded])

  // Execute action handler
  const handleAction = useCallback(async (actionType: ActionType) => {
    if (!context || !context.selection.trim()) return

    const config: ActionConfig = {
      type: actionType,
      useAI: ACTION_REGISTRY.find(d => d.id === actionType)?.requiresAI ?? false,
      targetLang: actionType === 'translate' ? translateLang : undefined,
    }

    const result = await quickActionsStore.executeAction(
      actionType,
      context,
      config,
      sendToActiveModel,
    )

    setActiveResult(result)

    // Auto-apply for certain non-destructive actions
    if (result.success && result.output) {
      if (['copy', 'copy-markdown', 'copy-html'].includes(actionType)) {
        // Already copied, no editor change needed
      } else if (onApplyResult) {
        // Let parent decide whether to apply
      }
    }
  }, [context, sendToActiveModel, onApplyResult, translateLang])

  // Apply result to editor
  const handleApply = useCallback(() => {
    if (activeResult?.output && activeResult.success && qaState.currentAction && onApplyResult) {
      onApplyResult(activeResult.output, qaState.currentAction)
      setActiveResult(null)
      quickActionsStore.resetStatus()
    }
  }, [activeResult, qaState.currentAction, onApplyResult])

  // Copy result
  const handleCopyResult = useCallback(async () => {
    if (activeResult?.output) {
      await quickActionsStore.copyToClipboard(activeResult.output, { type: 'code', language: context?.language })
    }
  }, [activeResult, context])

  const isProcessing = qaState.status === 'processing'

  if (!visible) return null

  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] flex flex-col"
      style={{
        left: panelPos.x,
        top: panelPos.y,
        maxWidth: 420,
        minWidth: 280,
        background: tk.background,
        border: `1px solid ${isCyberpunk ? tk.primary + '40' : tk.borderDim}`,
        borderRadius: 10,
        boxShadow: isCyberpunk
          ? `0 4px 24px ${tk.primary}20, 0 0 1px ${tk.primary}40`
          : '0 4px 24px rgba(0,0,0,0.12)',
        fontFamily: tk.fontMono,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 rounded-t-[10px] cursor-move"
        style={{ background: isCyberpunk ? tk.primary + '08' : tk.backgroundAlt, borderBottom: `1px solid ${tk.borderDim}` }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-1.5">
          <Zap size={11} color={tk.primary} />
          <span style={{ fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
            {t('quickActions', 'title')}
          </span>
          {isProcessing && <Loader2 size={10} color={tk.warning} className="animate-spin" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setClipboardOpen(v => !v)}
            className="p-0.5 rounded transition-all hover:opacity-80"
            style={{ color: clipboardOpen ? tk.primary : tk.foregroundMuted }}
            title={t('quickActions', 'clipboardHistory')}
          >
            <Clipboard size={10} />
          </button>
          <button onClick={onClose} className="p-0.5 rounded transition-all hover:opacity-80" style={{ color: tk.foregroundMuted }}>
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Actions Grid */}
      {!clipboardOpen && (
        <div className="px-2 py-1.5">
          {primaryActions.length === 0 ? (
            <p style={{ fontSize: '9px', color: tk.foregroundMuted, textAlign: 'center', padding: '8px 0' }}>
              {t('quickActions', 'noSelection')}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1">
                {primaryActions.map(actionId => {
                  const def = ACTION_REGISTRY.find(d => d.id === actionId)
                  if (!def) return null
                  const Icon = ICON_MAP[def.icon] || Zap
                  const disabled = def.requiresAI && !hasAI
                  const isActive = qaState.currentAction === actionId && isProcessing

                  return (
                    <button
                      key={actionId}
                      onClick={() => !disabled && !isProcessing && handleAction(actionId)}
                      disabled={disabled || isProcessing}
                      className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
                      style={{
                        fontSize: '9px',
                        color: disabled ? tk.foregroundMuted + '60' : isActive ? tk.warning : tk.foreground,
                        background: isActive ? tk.warning + '15' : tk.backgroundAlt,
                        border: `1px solid ${isActive ? tk.warning + '40' : tk.borderDim}`,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                      }}
                      title={disabled ? (isZh ? '需要配置 AI 模型' : 'AI model required') : t('quickActions', def.labelKey)}
                    >
                      {isActive ? <Loader2 size={9} className="animate-spin" /> : <Icon size={9} />}
                      <span>{t('quickActions', def.labelKey)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Translate language selector */}
              {recommended.includes('translate') && (
                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                  <Languages size={9} color={tk.foregroundMuted} />
                  <span style={{ fontSize: '8px', color: tk.foregroundMuted }}>{t('quickActions', 'translateTo')}</span>
                  <select
                    value={translateLang}
                    onChange={e => setTranslateLang(e.target.value)}
                    style={{
                      fontSize: '8px',
                      color: tk.foreground,
                      background: tk.backgroundAlt,
                      border: `1px solid ${tk.borderDim}`,
                      borderRadius: 4,
                      padding: '1px 4px',
                      outline: 'none',
                      fontFamily: tk.fontMono,
                    }}
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              )}

              {/* Expand toggle */}
              {recommended.length > 6 && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="flex items-center justify-center gap-0.5 w-full mt-1 py-0.5 rounded transition-all hover:opacity-80"
                  style={{ fontSize: '8px', color: tk.foregroundMuted }}
                >
                  {expanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                  {expanded ? t('quickActions', 'showLess') : t('quickActions', 'showMore')}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Result Panel */}
      {activeResult && !clipboardOpen && (
        <div className="px-2 pb-2">
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: `1px solid ${activeResult.success ? tk.success + '30' : tk.error + '30'}`,
              background: activeResult.success ? tk.success + '08' : tk.error + '08',
            }}
          >
            {/* Result header */}
            <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
              <div className="flex items-center gap-1">
                {activeResult.success
                  ? <CheckCircle2 size={9} color={tk.success} />
                  : <AlertCircle size={9} color={tk.error} />
                }
                <span style={{ fontSize: '8px', color: activeResult.success ? tk.success : tk.error }}>
                  {activeResult.success ? t('quickActions', 'actionSuccess') : t('quickActions', 'actionError')}
                </span>
                <span style={{ fontSize: '7px', color: tk.foregroundMuted }}>
                  {activeResult.durationMs}ms
                </span>
              </div>
              <div className="flex items-center gap-1">
                {activeResult.success && activeResult.output && (
                  <>
                    <button
                      onClick={handleCopyResult}
                      className="px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                      style={{ fontSize: '8px', color: tk.primary, border: `1px solid ${tk.primary}30` }}
                    >
                      <Copy size={8} />
                    </button>
                    {onApplyResult && (
                      <button
                        onClick={handleApply}
                        className="px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                        style={{ fontSize: '8px', color: tk.success, background: tk.success + '15', border: `1px solid ${tk.success}30` }}
                      >
                        {t('quickActions', 'apply')}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => { setActiveResult(null); quickActionsStore.resetStatus() }}
                  className="p-0.5 rounded transition-all hover:opacity-80"
                  style={{ color: tk.foregroundMuted }}
                >
                  <X size={8} />
                </button>
              </div>
            </div>

            {/* Result content */}
            <div className="px-2 py-1.5 max-h-[200px] overflow-y-auto">
              {activeResult.success && activeResult.output ? (
                <pre style={{
                  fontSize: '9px',
                  color: tk.foreground,
                  fontFamily: tk.fontMono,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {activeResult.output.slice(0, 2000)}{activeResult.output.length > 2000 ? '...' : ''}
                </pre>
              ) : (
                <p style={{ fontSize: '9px', color: tk.error }}>{activeResult.error}</p>
              )}
              {activeResult.explanation && (
                <div className="mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
                  <p style={{ fontSize: '8px', color: tk.foregroundMuted, fontStyle: 'italic' }}>
                    {activeResult.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clipboard History Panel */}
      {clipboardOpen && (
        <ClipboardHistoryPanel tk={tk} />
      )}
    </div>
  )
}

// ===== Clipboard History Sub-Panel =====
function ClipboardHistoryPanel({ tk }: { tk: ThemeTokens }) {
  const { t } = useI18n()
  const qaState = useQuickActionsStore()
  const history = qaState.clipboardHistory

  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: '9px', color: tk.primary, letterSpacing: '0.5px' }}>
          {t('quickActions', 'clipboardHistory')} ({history.length})
        </span>
        {history.length > 0 && (
          <button
            onClick={() => quickActionsStore.clearClipboardHistory()}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-all hover:opacity-80"
            style={{ fontSize: '8px', color: tk.error, border: `1px solid ${tk.error}30` }}
          >
            <Trash2 size={7} /> {t('quickActions', 'clearAll')}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p style={{ fontSize: '9px', color: tk.foregroundMuted, textAlign: 'center', padding: '12px 0' }}>
          {t('quickActions', 'emptyClipboard')}
        </p>
      ) : (
        <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto">
          {history.slice(0, 20).map(item => (
            <div
              key={item.id}
              className="flex items-start gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-all hover:opacity-90"
              style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}` }}
              onClick={async () => {
                await quickActionsStore.pasteFromHistory(item.id)
              }}
            >
              <div className="flex-1 min-w-0">
                <pre style={{
                  fontSize: '8px',
                  color: tk.foreground,
                  fontFamily: tk.fontMono,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 40,
                  overflow: 'hidden',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  {item.content.slice(0, 120)}{item.content.length > 120 ? '...' : ''}
                </pre>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontSize: '7px', color: tk.foregroundMuted }}>
                    <Clock size={7} style={{ display: 'inline', marginRight: 2 }} />
                    {new Date(item.copiedAt).toLocaleTimeString()}
                  </span>
                  {item.language && (
                    <span style={{ fontSize: '7px', color: tk.primary + 'aa' }}>{item.language}</span>
                  )}
                  <span style={{ fontSize: '7px', color: tk.foregroundMuted }}>{item.size}B</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); quickActionsStore.removeClipboardItem(item.id) }}
                className="p-0.5 rounded shrink-0 transition-all hover:opacity-80"
                style={{ color: tk.foregroundMuted }}
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}