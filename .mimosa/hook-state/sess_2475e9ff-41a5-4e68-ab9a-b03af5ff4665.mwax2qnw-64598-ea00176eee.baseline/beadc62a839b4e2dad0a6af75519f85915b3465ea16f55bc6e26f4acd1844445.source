/**
 * @file AIWritingPanel.tsx
 * @description Phase 2.2: AI写作助手面板 — 标题生成/大纲/Session管理/SEO优化
 * 直接复用: useAI hook + model-store 双通道AI能力 + stream-manager 流式管理
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status active
 * @tags [self-media],[ai-writing],[phase2]
 */

'use client'

import {
  BookOpen, Check, Clock, Copy, Cpu,
  Eye, Image as ImageIcon, Lightbulb, ListTree, Loader2, MessageSquare, Plus, RefreshCw, Send, Sparkles, Target, Trash2, X, Zap
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useModelStore } from '../store/model-store'
import { useSelfMediaStore } from '../store/self-media-store'
import { BLUR, Z_INDEX, useThemeStore } from '../store/theme-store'
import { buildMessages, chat as localChat } from '../utils/local-model-client'

// ── Types ──

export interface AIWritingPanelProps {
  visible: boolean
  onClose: () => void
  /** 当前编辑器内容（可选），用于基于内容的写作辅助 */
  currentContent?: string
  /** 将生成的文本插入编辑器 */
  onInsertContent?: (content: string) => void
}

export type WritingMode = 'title' | 'outline' | 'seo' | 'expand' | 'summary' | 'rewrite'

export interface WritingSession {
  id: string
  mode: WritingMode
  topic: string
  result: string
  createdAt: number
}

// ── Constants ──

const WRITING_MODES: { value: WritingMode; label: string; icon: typeof Sparkles; description: string }[] = [
  { value: 'title', label: '标题生成', icon: Lightbulb, description: '基于主题生成吸引人的标题方案' },
  { value: 'outline', label: '大纲规划', icon: ListTree, description: '生成结构化文章大纲' },
  { value: 'seo', label: 'SEO优化', icon: Target, description: '关键词分析与搜索优化建议' },
  { value: 'expand', label: '内容扩写', icon: Plus, description: '基于要点扩充详细内容' },
  { value: 'summary', label: '智能摘要', icon: BookOpen, description: '生成文章摘要/导语' },
  { value: 'rewrite', label: '风格改写', icon: MessageSquare, description: '调整语气风格/受众适配' },
]

const WRITING_PROMPTS: Record<WritingMode, string> = {
  title: '你是一位专业的新媒体标题创作专家。请基于以下主题/内容，生成10个吸引人的标题方案（中英文混合），涵盖不同风格：悬念型、干货型、情感型、热点型。每个标题用一行表示，不要序号。\n\n主题/内容：',
  outline: '你是一位经验丰富的内容策划。请为以下主题生成详细的文章大纲，包含引言、正文分段（每段包含核心要点）、结尾和行动号召。使用Markdown格式。\n\n主题/内容：',
  seo: '你是一位SEO内容策略专家。请对以下内容进行SEO分析，包括：1）核心关键词（3-5个）2）长尾关键词（5-8个）3）标题优化建议 4）Meta描述建议 5）内容结构优化建议。\n\n内容：',
  expand: '你是一位专业写手。请将以下要点扩写为流畅、丰富、有深度的完整段落。保持原文风格，增加细节、案例和数据支撑。\n\n要点：',
  summary: '你是一位内容编辑。请为以下内容生成：1）一句话摘要（20字内）2）简短摘要（50字内）3）详细摘要（150字内）4）3个核心关键词标签。\n\n内容：',
  rewrite: '你是一位文案润色专家。请根据用户要求改写以下内容。可以调整：语气风格（正式/轻松/幽默/专业）、受众定位（新手/专家/大众）、篇幅（精简/扩充）。请说明你的改写策略。\n\n内容：',
}

const TONE_OPTIONS = [
  { value: 'formal', label: '正式专业' },
  { value: 'casual', label: '轻松口语' },
  { value: 'humorous', label: '幽默风趣' },
  { value: 'authoritative', label: '权威严谨' },
  { value: 'warm', label: '温暖感性' },
]

const LS_SESSIONS = 'yyc3_aiwriting_sessions'

function genId() { return 'aw_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8) }

// ── Component ──

export function AIWritingPanel({ visible, onClose, currentContent, onInsertContent }: AIWritingPanelProps) {
  const { tokens } = useThemeStore()
  const { getActiveModel, sendToActiveModel } = useModelStore()
  const { templateWritingTopic, templateWritingMode, clearTemplateTopic, panelActions, setWritingInsertCallback } = useSelfMediaStore()

  // State
  const [mode, setMode] = useState<WritingMode>('title')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<WritingSession[]>(() => {
    try {
      const raw = localStorage.getItem(LS_SESSIONS)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedTone, setSelectedTone] = useState('formal')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [useLocalModel, setUseLocalModel] = useState(true) // 默认优先使用本地模型
  const [localModelName, setLocalModelName] = useState<string | null>(null)
  const [localNodeName, setLocalNodeName] = useState<string | null>(null)

  const resultRef = useRef<HTMLDivElement>(null)

  // Auto-fill from currentContent when available
  useEffect(() => {
    if (currentContent && !input) {
      if (mode === 'seo' || mode === 'summary' || mode === 'rewrite') {
        setInput(currentContent.slice(0, 2000))
      }
    }
  }, [currentContent, mode, input])

  // Auto-fill from store's templateWritingTopic (模板→AI写作联动)
  useEffect(() => {
    if (templateWritingTopic && !input) {
      setInput(templateWritingTopic)
      if (templateWritingMode) {
        setMode(templateWritingMode)
      }
      clearTemplateTopic()
    }
  }, [templateWritingTopic, templateWritingMode, input, clearTemplateTopic])

  // Save sessions
  const saveSessions = useCallback((updated: WritingSession[]) => {
    setSessions(updated)
    try { localStorage.setItem(LS_SESSIONS, JSON.stringify(updated)) } catch { /* */ }
  }, [])

  // Generate
  const handleGenerate = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setIsGenerating(true)
    setError(null)
    setResult('')
    setLocalModelName(null)
    setLocalNodeName(null)

    try {
      let prompt = WRITING_PROMPTS[mode]

      // Mode-specific adjustments
      if (mode === 'title') {
        prompt += `\n\n当前时间：${new Date().toLocaleDateString('zh-CN')}\n目标平台：自媒体`
      } else if (mode === 'rewrite') {
        const toneLabel = TONE_OPTIONS.find(t => t.value === selectedTone)?.label || '正式专业'
        prompt += `\n\n目标风格/语气：${toneLabel}\n\n`
      }

      const fullPrompt = prompt + trimmed

      // ── 本地模型路径 ──
      if (useLocalModel) {
        const taskType =
          mode === 'title' ? 'writing-title' :
            mode === 'outline' ? 'writing-outline' :
              mode === 'summary' ? 'summary' :
                mode === 'rewrite' ? 'rewrite' :
                  'writing'

        const systemPrompt = mode === 'title'
          ? '你是一位自媒体标题专家。请生成吸引眼球但不过分夸张的标题，提供3-5个选项。直接输出标题列表，每个标题一行。'
          : mode === 'outline'
            ? '你是一位内容规划专家。请生成详细的内容大纲，包含引言、主体段落和结尾。使用markdown格式。'
            : mode === 'seo'
              ? '你是一位SEO优化专家。请优化以下内容，提升搜索引擎排名，同时保持可读性。'
              : mode === 'expand'
                ? '你是一位内容创作专家。请根据要点列表，扩展成完整的文章段落。保持逻辑连贯、内容丰富。'
                : mode === 'summary'
                  ? '你是一位内容分析专家。请提取核心要点，生成简洁但全面的摘要。'
                  : mode === 'rewrite'
                    ? `你是一位文字润色专家。请在保持原意的基础上优化表达，使语言更流畅、专业。目标语气：${TONE_OPTIONS.find(t => t.value === selectedTone)?.label || '正式专业'}`
                    : '你是一位专业的自媒体内容创作者。请根据用户需求创作高质量的内容，注意排版和可读性。'

        const messages = buildMessages(fullPrompt, systemPrompt)
        const result = await localChat(messages, taskType, { temperature: 0.7, maxTokens: 4096 })

        setLocalModelName(result.modelName)
        setLocalNodeName(result.nodeId)
        setResult(result.content)

        // Save session
        const session: WritingSession = {
          id: genId(),
          mode,
          topic: trimmed.slice(0, 100),
          result: result.content,
          createdAt: Date.now(),
        }
        saveSessions([session, ...sessions])
      } else {
        // ── 远端模型路径 ──
        const activeModel = getActiveModel()
        if (!activeModel) {
          setError('请先在模型设置中激活一个AI模型，或切换到本地模型模式')
          setIsGenerating(false)
          return
        }

        const response = await sendToActiveModel(fullPrompt, {
          systemPrompt: '你是一个专业的写作助手。请根据用户要求生成高质量内容。直接输出结果，不要额外说明。',
        })

        const cleanResult = response.trim()
        setResult(cleanResult)

        // Save session
        const session: WritingSession = {
          id: genId(),
          mode,
          topic: trimmed.slice(0, 100),
          result: cleanResult,
          createdAt: Date.now(),
        }
        saveSessions([session, ...sessions])
      }

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      // ── 容错：本地失败时尝试远端 ──
      if (useLocalModel) {
        try {
          const activeModel = getActiveModel()
          if (activeModel) {
            const response = await sendToActiveModel(prompt + input.trim(), {
              systemPrompt: '你是一个专业的写作助手。请根据用户要求生成高质量内容。直接输出结果，不要额外说明。',
            })
            const cleanResult = response.trim()
            setResult(cleanResult)

            const session: WritingSession = {
              id: genId(),
              mode,
              topic: trimmed.slice(0, 100),
              result: cleanResult,
              createdAt: Date.now(),
            }
            saveSessions([session, ...sessions])
            return
          }
        } catch { /* fallback also failed */ }
      }
      const msg = err instanceof Error ? err.message : '生成失败'
      setError(msg)
    } finally {
      setIsGenerating(false)
    }
  }, [input, mode, selectedTone, useLocalModel, getActiveModel, sendToActiveModel, sessions, saveSessions])

  // Copy result
  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* */ }
  }, [])

  // Insert into editor
  const handleInsert = useCallback((content: string) => {
    onInsertContent?.(content)
  }, [onInsertContent])

  // Delete session
  const handleDeleteSession = useCallback((id: string) => {
    saveSessions(sessions.filter(s => s.id !== id))
  }, [sessions, saveSessions])

  // Clear all sessions
  const handleClearSessions = useCallback(() => {
    saveSessions([])
  }, [saveSessions])

  // Use session result
  const handleUseSession = useCallback((session: WritingSession) => {
    setMode(session.mode)
    setInput(session.topic)
    setResult(session.result)
    setShowHistory(false)
  }, [])

  // Fill current content for relevant modes
  const handleUseCurrentContent = useCallback(() => {
    if (currentContent) {
      setInput(currentContent.slice(0, 2000))
    }
  }, [currentContent])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tokens.overlayBg,
          backdropFilter: BLUR.lg,
          WebkitBackdropFilter: BLUR.lg,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '720px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          background: tokens.panelBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${tokens.shadow}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: tokens.primary }} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: tokens.fontDisplay }}>
              AI 写作助手
            </span>
            {isGenerating && (
              <span style={{ fontSize: '11px', color: tokens.primary, marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={12} className="animate-spin" />
                生成中...
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* AI 来源切换 */}
            <button
              onClick={() => setUseLocalModel(v => !v)}
              title={useLocalModel ? '使用本地模型' : '使用远端模型'}
              style={{
                padding: '6px 10px',
                background: useLocalModel ? tokens.primaryDim : 'transparent',
                border: `1px solid ${useLocalModel ? tokens.primary : tokens.border}`,
                borderRadius: '6px',
                color: useLocalModel ? tokens.primary : tokens.foregroundMuted,
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: tokens.fontMono,
              }}
            >
              <Cpu size={12} />
              {useLocalModel ? '本地' : '远端'}
            </button>
            <button
              onClick={() => setShowHistory(v => !v)}
              style={{
                padding: '6px 10px',
                background: showHistory ? tokens.primaryDim : 'transparent',
                border: `1px solid ${tokens.border}`,
                borderRadius: '6px',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={12} />
              {showHistory ? '关闭历史' : `历史 (${sessions.length})`}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Mode Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '12px 16px 8px',
                borderBottom: `1px solid ${tokens.borderDim}`,
                overflowX: 'auto',
                flexShrink: 0,
              }}
            >
              {WRITING_MODES.map(m => {
                const Icon = m.icon
                const isActive = mode === m.value
                return (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode(m.value)
                      setResult('')
                      setError(null)
                    }}
                    title={m.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      background: isActive ? tokens.primaryDim : 'transparent',
                      border: `1px solid ${isActive ? tokens.primary : 'transparent'}`,
                      borderRadius: '6px',
                      color: isActive ? tokens.primary : tokens.foregroundMuted,
                      cursor: 'pointer',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={12} />
                    {m.label}
                  </button>
                )
              })}
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={
                      mode === 'title' ? '输入文章主题或关键词...' :
                        mode === 'outline' ? '输入文章主题或核心论点...' :
                          mode === 'seo' ? '输入要优化的内容...' :
                            mode === 'expand' ? '输入要点列表（每行一个）...' :
                              mode === 'summary' ? '输入要摘要的文章内容...' :
                                '输入需要改写的原文...'
                    }
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: tokens.inputBg,
                      border: `1px solid ${tokens.inputBorder}`,
                      borderRadius: '8px',
                      color: tokens.foreground,
                      fontSize: '13px',
                      fontFamily: tokens.fontBody,
                      resize: 'vertical',
                      outline: 'none',
                      lineHeight: '1.5',
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                  />
                  {/* Character count */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '10px',
                      fontSize: '10px',
                      color: tokens.foregroundMuted,
                      opacity: 0.5,
                    }}
                  >
                    {input.length}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {currentContent && (mode === 'seo' || mode === 'summary' || mode === 'rewrite') && (
                    <button
                      onClick={handleUseCurrentContent}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '5px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      使用当前内容
                    </button>
                  )}
                  {mode === 'rewrite' && (
                    <button
                      onClick={() => setShowAdvanced(v => !v)}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '5px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      语气设置 {showAdvanced ? '▲' : '▼'}
                    </button>
                  )}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !input.trim()}
                  style={{
                    padding: '8px 20px',
                    background: !input.trim() ? tokens.border : tokens.primary,
                    border: 'none',
                    borderRadius: '8px',
                    color: tokens.primaryForeground,
                    cursor: !input.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: !input.trim() ? 0.5 : 1,
                  }}
                >
                  {isGenerating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  生成 {isGenerating ? '中...' : ''}
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && mode === 'rewrite' && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: tokens.backgroundAlt,
                    borderRadius: '8px',
                    border: `1px solid ${tokens.borderDim}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: tokens.foregroundMuted }}>目标语气：</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {TONE_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setSelectedTone(t.value)}
                        style={{
                          padding: '3px 8px',
                          background: selectedTone === t.value ? tokens.primaryDim : 'transparent',
                          border: `1px solid ${selectedTone === t.value ? tokens.primary : tokens.border}`,
                          borderRadius: '4px',
                          color: selectedTone === t.value ? tokens.primary : tokens.foregroundMuted,
                          cursor: 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  margin: '0 16px 8px',
                  padding: '8px 12px',
                  background: tokens.error + '20',
                  border: `1px solid ${tokens.error}40`,
                  borderRadius: '6px',
                  color: tokens.error,
                  fontSize: '12px',
                }}
              >
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div ref={resultRef} style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                <div
                  style={{
                    padding: '16px',
                    background: tokens.backgroundAlt,
                    border: `1px solid ${tokens.borderDim}`,
                    borderRadius: '8px',
                    position: 'relative',
                  }}
                >
                  {/* Result actions */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <button
                      onClick={() => handleGenerate()}
                      title="重新生成"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '4px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <RefreshCw size={10} />
                      重新生成
                    </button>
                    <button
                      onClick={() => handleCopy(result, 'current')}
                      title="复制"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '4px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {copiedId === 'current' ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === 'current' ? '已复制' : '复制'}
                    </button>
                    {onInsertContent && (
                      <button
                        onClick={() => handleInsert(result)}
                        title="插入到编辑器"
                        style={{
                          padding: '4px 8px',
                          background: tokens.primaryDim,
                          border: `1px solid ${tokens.primary}`,
                          borderRadius: '4px',
                          color: tokens.primary,
                          cursor: 'pointer',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Plus size={10} />
                        插入
                      </button>
                    )}
                    <button
                      onClick={() => panelActions?.openContentPreview({ content: result, title: `AI写作 - ${input.slice(0, 30)}` })}
                      title="发送到预览"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '4px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye size={10} />
                      预览
                    </button>
                    <button
                      onClick={() => panelActions?.openPublishQueue({ content: result, title: `AI写作 - ${input.slice(0, 30)}` })}
                      title="发送到发布队列"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '4px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Send size={10} />
                      发布
                    </button>
                    <button
                      onClick={() => {
                        setWritingInsertCallback?.((text: string) => {
                          setInput(prev => prev + text)
                        })
                        panelActions?.openMaterialManager()
                      }}
                      title="打开素材管理器"
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '4px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <ImageIcon size={10} />
                      素材
                    </button>
                  </div>

                  {/* 本地模型信息 */}
                  {localModelName && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '12px',
                        padding: '6px 10px',
                        background: tokens.primaryDim + '40',
                        border: `1px solid ${tokens.primary}30`,
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontFamily: tokens.fontMono,
                        color: tokens.primary,
                      }}
                    >
                      <Cpu size={12} />
                      <span>本地模型: <strong>{localModelName}</strong></span>
                      <span style={{ opacity: 0.6 }}>·</span>
                      <span>节点: {localNodeName}</span>
                    </div>
                  )}

                  {/* Result content */}
                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: '1.7',
                      color: tokens.foreground,
                      whiteSpace: 'pre-wrap',
                      fontFamily: tokens.fontBody,
                      maxHeight: '400px',
                      overflowY: 'auto',
                      paddingRight: '180px',
                    }}
                  >
                    {result}
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && !isGenerating && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  opacity: 0.4,
                }}
              >
                <Sparkles size={32} style={{ color: tokens.foregroundMuted, marginBottom: '12px' }} />
                <p style={{ fontSize: '13px', color: tokens.foregroundMuted, textAlign: 'center' }}>
                  输入主题或内容，点击「生成」开始写作辅助
                </p>
                <p style={{ fontSize: '11px', color: tokens.foregroundMuted, marginTop: '4px' }}>
                  支持 ⌘+Enter 快捷键快速生成
                </p>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div
              style={{
                width: '240px',
                borderLeft: `1px solid ${tokens.border}`,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderBottom: `1px solid ${tokens.borderDim}`,
                }}
              >
                <span style={{ fontSize: '11px', color: tokens.foregroundMuted, fontWeight: 600 }}>
                  写作历史
                </span>
                {sessions.length > 0 && (
                  <button
                    onClick={handleClearSessions}
                    style={{
                      padding: '2px 6px',
                      background: 'transparent',
                      border: 'none',
                      color: tokens.error,
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    清空
                  </button>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {sessions.length === 0 ? (
                  <div
                    style={{
                      padding: '20px 12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: tokens.foregroundMuted,
                      opacity: 0.5,
                    }}
                  >
                    暂无记录
                  </div>
                ) : (
                  sessions.map(s => {
                    const modeInfo = WRITING_MODES.find(m => m.value === s.mode)
                    const Icon = modeInfo?.icon || Sparkles
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleUseSession(s)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${tokens.borderDim}`,
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = tokens.cardHover }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <Icon size={10} style={{ color: tokens.primary }} />
                          <span style={{ fontSize: '10px', color: tokens.primary }}>{modeInfo?.label}</span>
                          <span style={{ fontSize: '9px', color: tokens.foregroundMuted, marginLeft: 'auto' }}>
                            {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: tokens.foreground, lineHeight: '1.4', marginBottom: '4px' }}>
                          {s.topic}
                        </p>
                        <p style={{ fontSize: '10px', color: tokens.foregroundMuted, lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.result.slice(0, 80)}...
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteSession(s.id) }}
                          style={{
                            marginTop: '4px',
                            padding: '2px 6px',
                            background: 'transparent',
                            border: 'none',
                            color: tokens.foregroundMuted,
                            cursor: 'pointer',
                            fontSize: '9px',
                            opacity: 0.5,
                          }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
