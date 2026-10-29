/**
 * @file AIResponseFormatter.tsx
 * @description AI回复文档排版格式优化 + 上下文衔接记忆系统 + 多元化交互框架
 * @version v1.0.0
 */

import {
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  FileText,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Zap
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useThemeStore } from '../../store/theme-store'
import { createLogger } from '../../utils/logger'

/** react-markdown 组件映射的最小 props 形状 */
interface MDCompProps {
  inline?: boolean
  className?: string
  href?: string
  children?: React.ReactNode
  [key: string]: unknown
}

const logger = createLogger('AIResponseFormatter')

// ── 类型定义 ──
export interface ContextMemory {
  id: string
  timestamp: number
  role: 'user' | 'ai' | 'system'
  content: string
  summary?: string
  keywords: string[]
  category: string
}

export interface ConversationContext {
  sessionId: string
  topic: string
  messages: ContextMemory[]
  contextWindow: number
  lastUpdated: number
}

export interface FormattedSection {
  type: 'text' | 'code' | 'table' | 'list' | 'warning' | 'tip' | 'example' | 'reference'
  content: string
  language?: string
  title?: string
}

// ── 上下文记忆管理器 ──
class ContextMemoryManager {
  private storageKey = 'yyc3-ai-context-memory'
  private maxContexts = 10
  private maxMessagesPerContext = 50

  saveContext(context: ConversationContext): void {
    try {
      const contexts = this.getAllContexts()
      const existingIndex = contexts.findIndex(c => c.sessionId === context.sessionId)

      if (existingIndex >= 0) {
        contexts[existingIndex] = context
      } else {
        contexts.unshift(context)
        if (contexts.length > this.maxContexts) {
          contexts.pop()
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify(contexts))
    } catch (error) {
      logger.error('[AI Context] ❌ 保存上下文失败:', error)
    }
  }

  getContext(sessionId: string): ConversationContext | null {
    try {
      const contexts = this.getAllContexts()
      return contexts.find(c => c.sessionId === sessionId) || null
    } catch (error) {
      logger.error('[AI Context] ❌ 获取上下文失败:', error)
      return null
    }
  }

  getAllContexts(): ConversationContext[] {
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  addMessage(sessionId: string, message: ContextMemory): void {
    const context = this.getContext(sessionId) || {
      sessionId,
      topic: message.content.slice(0, 50),
      messages: [],
      contextWindow: 10,
      lastUpdated: Date.now(),
    }

    context.messages.push(message)

    // 保持消息数量在限制内
    if (context.messages.length > this.maxMessagesPerContext) {
      context.messages = context.messages.slice(-this.maxMessagesPerContext)
    }

    context.lastUpdated = Date.now()
    this.saveContext(context)
  }

  getRecentContext(sessionId: string, count: number = 5): ContextMemory[] {
    const context = this.getContext(sessionId)
    if (!context) return []
    return context.messages.slice(-count)
  }

  generateSummary(messages: ContextMemory[]): string {
    const recentMessages = messages.slice(-10)
    const userMessages = recentMessages.filter(m => m.role === 'user')

    if (userMessages.length === 0) return ''

    const topics = userMessages.map(m => m.content.slice(0, 30)).join(' | ')
    return `对话主题：${topics}`
  }

  clearSession(sessionId: string): void {
    try {
      const contexts = this.getAllContexts().filter(c => c.sessionId !== sessionId)
      localStorage.setItem(this.storageKey, JSON.stringify(contexts))
    } catch (error) {
      logger.error('[AI Context] ❌ 清除会话失败:', error)
    }
  }

  clearAll(): void {
    localStorage.removeItem(this.storageKey)
  }
}

// eslint-disable-next-line react-refresh/only-export-components -- 单例导出（非 UI 组件，热更新豁免）
export const contextManager = new ContextMemoryManager()

// ── 文档排版格式化器 ──
// eslint-disable-next-line react-refresh/only-export-components -- 纯工具函数（非 UI 组件，热更新豁免）
export function formatAIContent(rawContent: string): FormattedSection[] {
  const sections: FormattedSection[] = []

  // 分割代码块、表格、列表等
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(rawContent)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = rawContent.slice(lastIndex, match.index).trim()
      if (textBefore) {
        sections.push({ type: 'text', content: textBefore })
      }
    }

    sections.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] || 'text',
    })

    lastIndex = match.index + match[0].length
  }

  // 处理剩余文本
  const remainingText = rawContent.slice(lastIndex).trim()
  if (remainingText) {
    sections.push({ type: 'text', content: remainingText })
  }

  return sections
}

// ── 增强的Markdown组件 ──
interface EnhancedMarkdownProps {
  content: string
  isStreaming?: boolean
  onCopyCode?: (code: string, language: string) => void
  onFeedback?: (type: 'positive' | 'negative', section: string) => void
}

export function EnhancedMarkdown({
  content,
  isStreaming = false,
  onCopyCode,
  onFeedback
}: EnhancedMarkdownProps) {
  const { tokens } = useThemeStore()
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const handleCopy = useCallback(async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSections(prev => new Set([...prev, sectionId]))
      setTimeout(() => {
        setCopiedSections(prev => {
          const next = new Set(prev)
          next.delete(sectionId)
          return next
        })
      }, 2000)

      onCopyCode?.(text, 'markdown')
    } catch (error) {
      logger.error('[EnhancedMD] 复制失败:', error)
    }
  }, [onCopyCode])

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }, [])

  const components = useMemo(() => ({
    // react-markdown 组件映射的最小 props 形状（历史 any ×18 全部收敛）

    code({ inline, className: cls, children, ...props }: MDCompProps) {
      const lang = (cls || '').replace(/language-/, '')
      const childStr = typeof children === 'string' ? children : ''
      const sectionId = `code-${Math.random().toString(36).slice(2, 9)}`

      if (!inline && (lang || childStr.includes('\n'))) {
        return (
          <div className="enhanced-code-block my-3 rounded-lg overflow-hidden" style={{
            background: tokens.codeBg,
            border: `1px solid ${tokens.borderDim}`,
          }}>
            <div className="flex items-center justify-between px-3 py-1.5" style={{
              background: `${tokens.primary}08`,
              borderBottom: `1px solid ${tokens.borderDim}`,
            }}>
              <div className="flex items-center gap-2">
                <Code size={12} style={{ color: tokens.primary }} />
                <span style={{
                  fontFamily: tokens.fontMono,
                  fontSize: '9px',
                  color: tokens.foregroundMuted,
                  letterSpacing: '1px',
                }}>
                  {lang.toUpperCase() || 'CODE'}
                </span>
              </div>

              <button
                onClick={() => handleCopy(childStr, sectionId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded transition-all hover:bg-white/10"
                style={{ color: copiedSections.has(sectionId) ? tokens.success : tokens.primaryDim }}
              >
                {copiedSections.has(sectionId) ? (
                  <>
                    <Check size={11} />
                    <span style={{ fontSize: '8px' }}>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span style={{ fontSize: '8px' }}>COPY</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 overflow-x-auto" style={{
              fontFamily: tokens.fontMono,
              fontSize: '12px',
              lineHeight: '1.7',
              color: tokens.foreground,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }} {...props}>
              <code>{children}</code>
            </pre>

            {/* 代码块反馈按钮 */}
            <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-t" style={{
              borderColor: tokens.borderDim,
              background: `${tokens.primary}04`,
            }}>
              <button
                onClick={() => onFeedback?.('positive', childStr)}
                className="p-1 rounded hover:bg-white/10 transition-all"
                title="这段代码有帮助"
              >
                <ThumbsUp size={12} style={{ color: tokens.success }} />
              </button>
              <button
                onClick={() => onFeedback?.('negative', childStr)}
                className="p-1 rounded hover:bg-white/10 transition-all"
                title="这段代码有问题"
              >
                <ThumbsDown size={12} style={{ color: tokens.error }} />
              </button>
            </div>
          </div>
        )
      }

      return (
        <code className="inline-code px-1.5 py-0.5 rounded" style={{
          background: `${tokens.primary}15`,
          border: `1px solid ${tokens.primary}25`,
          color: tokens.primary,
          fontFamily: tokens.fontMono,
          fontSize: '0.85em',
        }} {...props}>
          {children}
        </code>
      )
    },

    h1({ children, ...props }: MDCompProps) {
      const sectionId = `h1-${Math.random().toString(36).slice(2, 9)}`
      const isExpanded = expandedSections.has(sectionId)

      return (
        <div className="my-4 border-l-4 pl-3" style={{
          borderColor: tokens.primary,
          background: `${tokens.primary}08`,
        }}>
          <h1 className="text-lg font-bold flex items-center gap-2 cursor-pointer" style={{
            color: tokens.foreground,
            fontFamily: tokens.fontDisplay,
          }}
            onClick={() => toggleSection(sectionId)}
            {...props}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <BookOpen size={18} style={{ color: tokens.primary }} />
            {children}
          </h1>

          {isExpanded && (
            <div className="mt-2 text-sm" style={{ color: tokens.foregroundMuted }}>
              点击收起此章节内容
            </div>
          )}
        </div>
      )
    },

    h2({ children, ...props }: MDCompProps) {
      return (
        <h2 className="text-base font-semibold mt-6 mb-2 pb-2 border-b flex items-center gap-2" style={{
          color: tokens.primary,
          borderColor: tokens.borderDim,
          fontFamily: tokens.fontDisplay,
        }} {...props}>
          <FileText size={16} style={{ color: tokens.accent }} />
          {children}
        </h2>
      )
    },

    h3({ children, ...props }: MDCompProps) {
      return (
        <h3 className="text-sm font-semibold mt-4 mb-1 flex items-center gap-2" style={{
          color: tokens.foreground,
          fontFamily: tokens.fontDisplay,
        }} {...props}>
          <Zap size={14} style={{ color: tokens.warning }} />
          {children}
        </h3>
      )
    },

    blockquote({ children, ...props }: MDCompProps) {
      return (
        <blockquote className="my-3 p-3 rounded-lg border-l-4" style={{
          background: `${tokens.warning}10`,
          borderColor: tokens.warning,
          fontStyle: 'italic',
          color: tokens.foregroundMuted,
        }} {...props}>
          <Lightbulb size={16} className="inline mr-2 mb-1" style={{ color: tokens.warning }} />
          {children}
        </blockquote>
      )
    },

    ul({ children, ...props }: MDCompProps) {
      return (
        <ul className="my-2 ml-4 space-y-1 list-disc" style={{
          color: tokens.foreground,
          listStyleType: 'none',
          paddingLeft: '1rem',
        }} {...props}>
          {React.Children.map(children, (child, index) => (
            <li key={index} className="flex items-start gap-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{
                background: tokens.primary,
              }} />
              <span>{child}</span>
            </li>
          ))}
        </ul>
      )
    },

    ol({ children, ...props }: MDCompProps) {
      return (
        <ol className="my-2 ml-4 space-y-1" style={{
          color: tokens.foreground,
          counterReset: 'item',
          listStyle: 'none',
        }} {...props}>
          {React.Children.map(children, (child, index) => (
            <li key={index} className="flex items-start gap-2 py-1">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono mt-0.5 flex-shrink-0" style={{
                background: tokens.primary,
                color: '#fff',
              }}>
                {index + 1}
              </span>
              <span>{child}</span>
            </li>
          ))}
        </ol>
      )
    },

    table({ children, ...props }: MDCompProps) {
      return (
        <div className="overflow-x-auto my-3 rounded-lg" style={{
          border: `1px solid ${tokens.borderDim}`,
        }}>
          <table className="w-full text-xs" style={{
            borderCollapse: 'collapse',
          }} {...props}>
            {children}
          </table>
        </div>
      )
    },

    th({ children, ...props }: MDCompProps) {
      return (
        <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{
          background: tokens.primaryGlow,
          color: tokens.primary,
          borderBottom: `2px solid ${tokens.primary}33`,
          fontFamily: tokens.fontMono,
          fontSize: '10px',
        }} {...props}>
          {children}
        </th>
      )
    },

    td({ children, ...props }: MDCompProps) {
      return (
        <td className="px-3 py-2 border-t" style={{
          borderColor: tokens.borderDim,
          color: tokens.foreground,
        }} {...props}>
          {children}
        </td>
      )
    },

    a({ href, children, ...props }: MDCompProps) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 underline hover:no-underline"
          style={{
            color: tokens.primary,
            textUnderlineOffset: '2px',
          }}
          {...props}
        >
          {children}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      )
    },

    strong({ children, ...props }: MDCompProps) {
      return (
        <strong className="font-bold" style={{ color: tokens.foreground }} {...props}>
          {children}
        </strong>
      )
    },

    em({ children, ...props }: MDCompProps) {
      return (
        <em className="italic" style={{ color: tokens.accent }} {...props}>
          {children}
        </em>
      )
    },

    hr() {
      return (
        <hr className="my-6 border-none" style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${tokens.primary}, transparent)`,
        }} />
      )
    },

    p({ children, ...props }: MDCompProps) {
      return (
        <p className="my-2 leading-relaxed" style={{
          color: tokens.foreground,
          lineHeight: '1.8',
          fontSize: '13px',
        }} {...props}>
          {children}
        </p>
      )
    },
  }), [tokens, copiedSections, expandedSections, handleCopy, toggleSection, onFeedback])

  return (
    <div className="enhanced-markdown-container">
      <style>{`
        .enhanced-code-block pre::-webkit-scrollbar {
          height: 8px;
        }

        .enhanced-code-block pre::-webkit-scrollbar-track {
          background: ${tokens.codeBg};
        }

        .enhanced-code-block pre::-webkit-scrollbar-thumb {
          background: ${tokens.borderDim};
          border-radius: 4px;
        }

        .enhanced-code-block pre::-webkit-scrollbar-thumb:hover {
          background: ${tokens.primary};
        }
      `}</style>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // react-markdown v10 components 联合签名极宽，映射对象按其类型收窄
        components={components as unknown as React.ComponentProps<typeof ReactMarkdown>['components']}
      >
        {content}
      </ReactMarkdown>

      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{
          background: tokens.primary,
          animation: 'blink 1s infinite',
        }} />
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── 上下文摘要组件 ──
interface ContextSummaryProps {
  sessionId: string
  onRestore?: (context: ConversationContext) => void
}

export function ContextSummary({ sessionId, onRestore }: ContextSummaryProps) {
  const { tokens } = useThemeStore()
  const [context, setContext] = useState<ConversationContext | null>(null)

  useEffect(() => {
    const ctx = contextManager.getContext(sessionId)
    setContext(ctx)
  }, [sessionId])

  if (!context || context.messages.length === 0) return null

  const summary = contextManager.generateSummary(context.messages)
  const recentMessages = context.messages.slice(-3)

  return (
    <div className="context-summary p-3 rounded-lg mb-3" style={{
      background: `${tokens.primary}06`,
      border: `1px solid ${tokens.primary}22`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain size={14} style={{ color: tokens.primary }} />
          <span className="text-xs font-semibold" style={{ color: tokens.primary }}>
            上下文记忆
          </span>
        </div>

        {onRestore && (
          <button
            onClick={() => onRestore(context)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:bg-white/10"
            style={{ color: tokens.primary }}
          >
            <RefreshCw size={10} />
            恢复上下文
          </button>
        )}
      </div>

      <p className="text-xs mb-2" style={{ color: tokens.foregroundMuted }}>
        {summary}
      </p>

      <div className="space-y-1">
        {recentMessages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2 text-xs">
            <MessageSquare
              size={10}
              className="mt-0.5 flex-shrink-0"
              style={{
                color: msg.role === 'user' ? tokens.success : tokens.primary
              }}
            />
            <span style={{ color: tokens.foregroundMuted }}>
              {msg.content.slice(0, 80)}{msg.content.length > 80 ? '...' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t text-xs" style={{
        borderColor: tokens.borderDim,
        color: tokens.foregroundMuted,
      }}>
        共 {context.messages.length} 条消息 · 最后更新于{' '}
        {new Date(context.lastUpdated).toLocaleTimeString('zh-CN')}
      </div>
    </div>
  )
}

export default EnhancedMarkdown
