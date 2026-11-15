/**
 * @file AIAssistPanel.tsx
 * @description AI助手面板组件，提供AI助手功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,ai,assist,ui,component
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Sparkles, X, Check, RefreshCw, ChevronDown, ChevronRight,
  Lightbulb, Code2, Bug, FileText, Zap, Copy,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { CyberTooltip } from './CyberTooltip'
import { cyberToast } from './CyberToast'
import { useThemeStore, type ThemeTokens, Z_INDEX, BLUR } from '../store/theme-store'
import { useModelStore } from '../store/model-store'

// ===== AI Suggestion Types =====
export type SuggestionType = 'code' | 'fix' | 'optimize' | 'doc' | 'refactor'

export interface AISuggestion {
  id: string
  type: SuggestionType
  title: { zh: string; en: string }
  description: { zh: string; en: string }
  codeSnippet?: string
  confidence: number // 0-100
  status: 'pending' | 'accepted' | 'rejected'
}

export interface AIContext {
  selectedFile: string
  currentCode: string
  designJsonSummary: string
  recentActions: string[]
  /** 对齐 Guidelines: Intelligent Assistance — 光标行号(1-based) */
  cursorLine?: number
  /** 对齐 Guidelines: Intelligent Assistance — 光标列号(1-based) */
  cursorColumn?: number
  /** 对齐 Guidelines: Intelligent Assistance — 选中的代码片段 */
  selectedText?: string
  /** 对齐 Guidelines: Intelligent Assistance — 当前文件语言 */
  language?: string
}

// ===== Suggestion type metadata — theme-aware via function =====
function getSuggestionMeta(tk: ThemeTokens) {
  return {
    code: { icon: Code2, label: { zh: '代码生成', en: 'CODE GEN' }, color: tk.primary },
    fix: { icon: Bug, label: { zh: '错误修复', en: 'BUG FIX' }, color: tk.error },
    optimize: { icon: Zap, label: { zh: '性能优化', en: 'OPTIMIZE' }, color: tk.success },
    doc: { icon: FileText, label: { zh: '文档生成', en: 'DOC GEN' }, color: tk.warning },
    refactor: { icon: RefreshCw, label: { zh: '代码重构', en: 'REFACTOR' }, color: tk.secondary },
  } as const
}

/**（历史 mock 建议生成器已删：无模型时诚实指引）*/

// ===== Component Props =====
interface AIAssistPanelProps {
  visible: boolean
  onClose: () => void
  context: AIContext
  onApplyCode?: (code: string, suggestionTitle: string) => void
}

export function AIAssistPanel({ visible, onClose, context, onApplyCode }: AIAssistPanelProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { getActiveModel, sendToActiveModel } = useModelStore()
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<SuggestionType | 'all'>('all')

  const SUGGESTION_META = useMemo(() => getSuggestionMeta(tk), [tk])

  /**
   * 对齐 Guidelines: Intelligent Assistance — 基于代码上下文的真实 AI 建议生成
   * 有活跃模型时调用真实 API；无模型时诚实指引（零 mock）
   */
  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setSuggestions([])

    const activeModel = getActiveModel()
    if (!activeModel) {
      // 无活跃模型：诚实指引（历史 mock 建议生成已随零 mock 决战移除）
      setLoading(false)
      cyberToast(isZh ? '未激活模型——请先在 设置 → 模型管理 激活后再生成建议' : 'No active model — activate one in Model Settings first')
      return
    }

    // 真实 API 调用
    try {
      const lang = isZh ? '中文' : 'English'
      const codePreview = context.currentCode.slice(0, 2000)
      const systemPrompt = `You are YYC³ AI Code Assistant. Analyze the provided code and return EXACTLY a JSON array of suggestions. Each suggestion object must have these fields:
- "type": one of "code", "fix", "optimize", "doc", "refactor"
- "title_zh": Chinese title (string)
- "title_en": English title (string)
- "desc_zh": Chinese description (string)
- "desc_en": English description (string)
- "code": code snippet suggestion (string, optional)
- "confidence": integer 0-100

Return ONLY the JSON array, no markdown fences, no explanation. Language preference: ${lang}.`

      const userPrompt = `File: ${context.selectedFile}${context.language ? ` (${context.language})` : ''}
Recent actions: ${context.recentActions.slice(0, 5).join(', ')}${context.cursorLine ? `\nCursor position: line ${context.cursorLine}, column ${context.cursorColumn || 1}` : ''}${context.selectedText ? `\nSelected code:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\`` : ''}

Code:
\`\`\`
${codePreview}
\`\`\`

Provide 3-5 actionable suggestions for this code.${context.selectedText ? ' Focus suggestions on the selected code region.' : ''}`

      const response = await sendToActiveModel(userPrompt, {
        systemPrompt,
        history: [],
      })

      // 解析 AI 响应
      let parsed: Array<Record<string, unknown>> = []
      try {
        // 尝试提取 JSON（可能被 markdown 包裹）
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      } catch {
        // 解析失败：诚实报错（零 mock——不再伪造默认建议）
        setLoading(false)
        cyberToast(isZh ? 'AI 响应解析失败——未生成建议' : 'AI response parse failed — no suggestions generated')
        return
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const aiSuggestions: AISuggestion[] = parsed.map((item, idx) => ({
          id: `ai-sug-${Date.now()}-${idx}`,
          type: (['code', 'fix', 'optimize', 'doc', 'refactor'].includes(item.type as string) ? item.type as SuggestionType : 'code'),
          title: {
            zh: (item.title_zh as string) || (item.title as string) || `建议 ${idx + 1}`,
            en: (item.title_en as string) || (item.title as string) || `Suggestion ${idx + 1}`,
          },
          description: {
            zh: (item.desc_zh as string) || (item.description as string) || '',
            en: (item.desc_en as string) || (item.description as string) || '',
          },
          codeSnippet: (item.code as string) || (item.codeSnippet as string) || undefined,
          confidence: typeof item.confidence === 'number' ? Math.min(100, Math.max(0, item.confidence)) : 80,
          status: 'pending' as const,
        }))
        setSuggestions(aiSuggestions)
        cyberToast(isZh ? `AI 已生成 ${aiSuggestions.length} 条智能建议` : `AI generated ${aiSuggestions.length} suggestions`)
      } else {
        cyberToast(isZh ? 'AI 未返回有效建议' : 'No valid AI suggestions returned')
      }
    } catch (err: Error | unknown) {
      // API 失败：诚实报错（零 mock）
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      cyberToast(isZh ? `AI 调用失败: ${errorMessage.slice(0, 60) || '未知错误'}` : `AI failed: ${errorMessage.slice(0, 60) || 'Unknown'}`)
    }
    setLoading(false)
  }, [context, isZh, getActiveModel, sendToActiveModel])

  const handleAccept = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'accepted' as const } : s))
    )
    cyberToast(isZh ? '建议已应用' : 'Suggestion applied')
    const suggestion = suggestions.find((s) => s.id === id)
    if (suggestion && suggestion.codeSnippet && onApplyCode) {
      onApplyCode(suggestion.codeSnippet, suggestion.title[locale])
    }
  }, [isZh, suggestions, onApplyCode, locale])

  const handleReject = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' as const } : s))
    )
  }, [])

  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      cyberToast(isZh ? '代码已复制到剪贴板' : 'Code copied to clipboard')
    }).catch(() => {
      cyberToast(isZh ? '复制失败' : 'Copy failed')
    })
  }, [isZh])

  const filteredSuggestions = useMemo(() => {
    if (filterType === 'all') return suggestions
    return suggestions.filter((s) => s.type === filterType)
  }, [suggestions, filterType])

  const stats = useMemo(() => ({
    total: suggestions.length,
    accepted: suggestions.filter((s) => s.status === 'accepted').length,
    rejected: suggestions.filter((s) => s.status === 'rejected').length,
    pending: suggestions.filter((s) => s.status === 'pending').length,
  }), [suggestions])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-xl overflow-hidden flex flex-col"
        style={{
          width: 620,
          maxHeight: '80vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}` : tk.shadowHover,
          borderRadius: tk.borderRadius,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
            >
              <Lightbulb size={14} color={tk.primary} />
            </div>
            <div>
              <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1px', margin: 0, lineHeight: 1.3 }}>
                {isZh ? 'AI 智能辅助' : 'AI ASSIST'}
              </h2>
              <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '2px', margin: 0 }}>
                {isZh ? '上下文感知 · 智能建议 · 一键应用' : 'CONTEXT-AWARE · SMART SUGGESTIONS · ONE-CLICK APPLY'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {suggestions.length > 0 && (
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success }}>
                  ✓ {stats.accepted}
                </span>
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                  ○ {stats.pending}
                </span>
              </div>
            )}
            <button onClick={onClose} className="p-1 rounded hover:opacity-80 transition-all">
              <X size={14} color={tk.primary} />
            </button>
          </div>
        </div>

        {/* Context bar */}
        <div className="px-5 py-2.5 border-b flex items-center gap-3" style={{ borderColor: tk.border, background: tk.primaryGlow }}>
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
            {isZh ? '当前上下文' : 'CONTEXT'}:
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ background: tk.inputBg, border: `1px solid ${tk.borderDim}` }}>
            <Code2 size={9} color={tk.primary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary }}>
              {context.selectedFile}
            </span>
          </div>
          {/* 对齐 Guidelines: Intelligent Assistance — 光标位置 + 选中区域指示 */}
          {context.cursorLine && (
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
              Ln {context.cursorLine}{context.cursorColumn ? `, Col ${context.cursorColumn}` : ''}
            </span>
          )}
          {context.selectedText && (
            <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.warning, background: `${tk.warning}15`, border: `1px solid ${tk.warning}33` }}>
              {isZh ? `已选 ${context.selectedText.split('\n').length} 行` : `${context.selectedText.split('\n').length} lines selected`}
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all"
            style={{
              fontFamily: tk.fontMono,
              fontSize: '10px',
              letterSpacing: '0.5px',
              color: loading ? tk.foregroundMuted : tk.background,
              background: loading ? tk.primaryGlow : tk.primary,
              border: `1px solid ${loading ? tk.border : tk.primary}`,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
            {loading ? (isZh ? '分析中...' : 'ANALYZING...') : (isZh ? '生成建议' : 'GENERATE')}
          </button>
        </div>

        {/* Filter tabs */}
        {suggestions.length > 0 && (
          <div className="px-5 py-2 border-b flex items-center gap-1.5" style={{ borderColor: tk.border }}>
            <button
              onClick={() => setFilterType('all')}
              className="px-2 py-0.5 rounded transition-all"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '9px',
                color: filterType === 'all' ? tk.background : tk.primaryDim,
                background: filterType === 'all' ? tk.primary : 'transparent',
                border: `1px solid ${filterType === 'all' ? tk.primary : tk.borderDim}`,
              }}
            >
              {isZh ? '全部' : 'ALL'} ({suggestions.length})
            </button>
            {(Object.entries(SUGGESTION_META) as [SuggestionType, typeof SUGGESTION_META[SuggestionType]][]).map(([type, meta]) => {
              const count = suggestions.filter((s) => s.type === type).length
              if (count === 0) return null
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className="px-2 py-0.5 rounded transition-all flex items-center gap-1"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '9px',
                    color: filterType === type ? tk.background : meta.color,
                    background: filterType === type ? meta.color : 'transparent',
                    border: `1px solid ${filterType === type ? meta.color : tk.borderDim}`,
                  }}
                >
                  <meta.icon size={8} />
                  {meta.label[locale]} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Suggestions list */}
        <div className="flex-1 overflow-y-auto neon-scrollbar p-4 space-y-2.5">
          {suggestions.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Lightbulb size={32} color={tk.primary} style={{ opacity: 0.15, marginBottom: 12 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
                {isZh ? '点击"生成建议"开始 AI 分析' : 'Click "GENERATE" to start AI analysis'}
              </p>
              <p style={{ fontFamily: tk.fontBody, fontSize: '10px', color: tk.foregroundMuted, opacity: 0.5, marginTop: 4 }}>
                {isZh ? 'AI 将基于当前选中文件与项目上下文提供智能建议' : 'AI will provide smart suggestions based on current file & project context'}
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${tk.borderDim}` }} />
                <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: tk.primary }} />
              </div>
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.primary, letterSpacing: '1px' }}>
                {isZh ? '正在收集上下文并分析...' : 'Collecting context & analyzing...'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {['selectedFile', 'codeAST', 'designJSON', 'patterns'].map((step, i) => (
                  <span
                    key={step}
                    className="px-1.5 py-0.5 rounded"
                    style={{
                      fontFamily: tk.fontMono,
                      fontSize: '8px',
                      color: tk.primaryDim,
                      background: tk.primaryGlow,
                      border: `1px solid ${tk.borderDim}`,
                      animation: `neon-pulse 1.5s ${i * 0.3}s ease-in-out infinite`,
                    }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {filteredSuggestions.map((suggestion) => {
            const meta = SUGGESTION_META[suggestion.type]
            const isExpanded = expandedId === suggestion.id
            const isAccepted = suggestion.status === 'accepted'
            const isRejected = suggestion.status === 'rejected'

            return (
              <div
                key={suggestion.id}
                className="rounded-lg overflow-hidden transition-all"
                style={{
                  border: `1px solid ${isAccepted ? tk.success + '44' : isRejected ? tk.error + '22' : tk.cardBorder}`,
                  background: isAccepted ? tk.success + '08' : isRejected ? tk.error + '05' : tk.cardBg,
                  opacity: isRejected ? 0.5 : 1,
                }}
              >
                {/* Suggestion header */}
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-all"
                  style={{ background: 'transparent' }}
                  onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                    style={{ background: meta.color + '15', border: `1px solid ${meta.color}33` }}
                  >
                    <meta.icon size={12} color={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: meta.color, letterSpacing: '1px' }}>
                        {meta.label[locale]}
                      </span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                        {suggestion.confidence}% {isZh ? '置信度' : 'confidence'}
                      </span>
                      {isAccepted && (
                        <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.success, background: tk.success + '15', border: `1px solid ${tk.success}33` }}>
                          {isZh ? '已应用' : 'APPLIED'}
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground, lineHeight: 1.3, margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                      {suggestion.title[locale]}
                    </p>
                  </div>
                  {isExpanded ? <ChevronDown size={12} color={tk.primary} style={{ opacity: 0.4 }} /> : <ChevronRight size={12} color={tk.primary} style={{ opacity: 0.4 }} />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t" style={{ borderColor: tk.borderDim }}>
                    <p style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foregroundMuted, lineHeight: 1.5, marginTop: 10, marginBottom: 10 }}>
                      {suggestion.description[locale]}
                    </p>

                    {/* Code snippet */}
                    {suggestion.codeSnippet && (
                      <div className="relative rounded-lg overflow-hidden mb-3" style={{ background: tk.codeBg, border: `1px solid ${tk.borderDim}` }}>
                        <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: tk.borderDim }}>
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
                            CODE SNIPPET
                          </span>
                          <CyberTooltip label={isZh ? '复制代码' : 'COPY CODE'} position="top">
                            <button
                              onClick={() => handleCopy(suggestion.codeSnippet!)}
                              className="p-1 rounded hover:opacity-80 transition-all"
                            >
                              <Copy size={9} color={tk.primary} style={{ opacity: 0.5 }} />
                            </button>
                          </CyberTooltip>
                        </div>
                        <pre className="p-3 overflow-x-auto neon-scrollbar" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, opacity: 0.7, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {suggestion.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Action buttons */}
                    {suggestion.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(suggestion.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '10px',
                            color: tk.contrastOnSuccess,
                            background: tk.success,
                            border: `1px solid ${tk.success}`,
                            letterSpacing: '0.5px',
                          }}
                        >
                          <Check size={10} />
                          {isZh ? '应用建议' : 'APPLY'}
                        </button>
                        <button
                          onClick={() => handleReject(suggestion.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '10px',
                            color: tk.error,
                            border: `1px solid ${tk.error}33`,
                            letterSpacing: '0.5px',
                          }}
                        >
                          <X size={10} />
                          {isZh ? '忽略' : 'DISMISS'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
