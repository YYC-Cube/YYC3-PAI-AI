/**
 * @file ChatMessageList.tsx
 * @description 消息列表组件 — 富文本渲染 + 折叠 + 引用 + 重新生成 + 历史锚定
 * 使用 useThemeStore 主题 tokens 与项目视觉一致
 */

import { useEffect, useRef, useCallback } from 'react'
import { useThemeStore } from '../../app/store/theme-store'
import type { ChatMessage } from '../../types/chat'
import AiMessageRender from './AiMessageRender'

interface ChatMessageListProps {
  messages: ChatMessage[]
  activeMsgId?: string
  onInsertEditor?: (code: string) => void
  onRegenerate: (msgId: string) => void
  onQuote: (content: string) => void
}

export default function ChatMessageList({
  messages,
  activeMsgId,
  onInsertEditor,
  onRegenerate,
  onQuote,
}: ChatMessageListProps) {
  const { tokens } = useThemeStore()
  const listRef = useRef<HTMLDivElement>(null)
  const msgRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setMsgRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      msgRefs.current.set(id, el)
    } else {
      msgRefs.current.delete(id)
    }
  }, [])

  // ── 历史消息锚定：滚动到目标消息 ──
  useEffect(() => {
    if (activeMsgId) {
      const target = msgRefs.current.get(activeMsgId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeMsgId, messages])

  if (messages.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 opacity-50"
        style={{ color: tokens.foregroundMuted }}
      >
        <span style={{ fontFamily: tokens.fontDisplay, fontSize: '24px', opacity: 0.2 }}>💬</span>
        <span
          style={{
            fontFamily: tokens.fontMono,
            fontSize: '11px',
            marginTop: '8px',
            letterSpacing: '1px',
          }}
        >
          暂无消息，开始对话吧
        </span>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="space-y-4 overflow-y-auto px-1"
      style={{ maxHeight: '100%', scrollBehavior: 'smooth' }}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          ref={setMsgRef(msg.id)}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {/* 用户消息 */}
          {msg.role === 'user' ? (
            <div
              className="max-w-[80%] rounded-lg px-3 py-2"
              style={{
                background: tokens.primary,
                color: tokens.background,
                border: `1px solid ${tokens.primary}`,
              }}
            >
              <div
                style={{
                  fontFamily: tokens.fontBody,
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            /* AI 消息 — 使用 AiMessageRender */
            <div className="max-w-[92%]" style={{ minWidth: 0 }}>
              <AiMessageRender
                message={msg}
                onInsertEditor={onInsertEditor}
                onRegenerate={onRegenerate}
                onQuote={onQuote}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}