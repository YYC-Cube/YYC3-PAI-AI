/**
 * @file ChatInputBox.tsx
 * @description 双模输入框组件 — Markdown 快捷输入 / Tiptap 富文本切换
 * 支持引用追问自动填充、代码块/表格/图片快捷插入
 * 适配 YYC³ AI-PAI 项目主题系统（useThemeStore tokens）
 */

import { Image as ImageExt } from '@tiptap/extension-image'
import { Table, TableCell, TableRow, TableHeader } from '@tiptap/extension-table'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { useCallback, useEffect, useState } from 'react'
import { useThemeStore } from '../../app/store/theme-store'

interface ChatInputBoxProps {
  onSend: (mdText: string) => void
  quoteContent?: string
  placeholder?: string
}

export default function ChatInputBox({
  onSend,
  quoteContent,
  placeholder = '输入消息，支持 Markdown / 富文本...',
}: ChatInputBoxProps) {
  const { tokens } = useThemeStore()
  const [mode, setMode] = useState<'md' | 'rich'>('md')
  const [mdVal, setMdVal] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // ── 引用追问自动填充 ──
  useEffect(() => {
    if (quoteContent) {
      const quotedText = `> ${quoteContent.replace(/\n/g, '\n> ')}\n\n`
      setMdVal(quotedText)
      if (mode === 'rich') setMode('md') // 引用内容强制切回 MD 模式以保留格式
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteContent])

  // ── Tiptap 编辑器 ──
  const editor = useEditor({
    extensions: [StarterKit, Table, TableRow, TableCell, TableHeader, ImageExt],
    content: '',
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] p-2 rounded focus:outline-none',
      },
    },
  })

  // ── 获取当前内容（MD 或 HTML） ──
  const getContent = useCallback((): string => {
    if (mode === 'md') return mdVal
    return editor?.getHTML() || ''
  }, [mode, mdVal, editor])

  // ── 发送 ──
  const handleSend = useCallback(() => {
    const text = getContent().trim()
    if (!text) return
    onSend(text)
    setMdVal('')
    editor?.commands.clearContent()
  }, [getContent, onSend, editor])

  // ── 快捷键发送 ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // ── MD 快捷插入 ──
  const insertMd = useCallback((s: string) => {
    setMdVal((prev) => prev + s)
  }, [])

  // ── 模式切换 ──
  const switchMode = useCallback(
    (m: 'md' | 'rich') => {
      if (m === mode) return
      if (m === 'md' && editor) {
        // 从富文本切换到 MD：丢弃 HTML 内容，保留纯文本参考
        setMdVal(editor.getText())
      }
      setMode(m)
    },
    [mode, editor]
  )

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        border: `1px solid ${isFocused ? tokens.primary : tokens.borderDim}`,
        background: tokens.cardBg || tokens.background,
        boxShadow: isFocused
          ? `0 0 0 1px ${tokens.primary}22, 0 4px 12px ${tokens.primary}0d`
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── 顶部工具栏 ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ borderColor: tokens.borderDim }}
      >
        {/* 模式切换 */}
        <div className="flex gap-0.5">
          {(['md', 'rich'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="px-2 py-0.5 rounded text-xs transition-all"
              style={{
                background: mode === m ? tokens.primary : 'transparent',
                color: mode === m ? tokens.background : tokens.foregroundMuted,
                border: `1px solid ${mode === m ? tokens.primary : tokens.borderDim}`,
                fontFamily: tokens.fontMono,
                fontSize: '9px',
              }}
            >
              {m === 'md' ? 'Markdown' : '富文本'}
            </button>
          ))}
        </div>

        {/* MD 快捷插入按钮 */}
        {mode === 'md' && (
          <div className="flex gap-0.5">
            {[
              { label: 'B', insert: '**粗体**', title: '粗体' },
              { label: 'Code', insert: '`行内代码`', title: '行内代码' },
              { label: '块', insert: '\n```ts\n\n```\n', title: '代码块' },
              { label: '表', insert: '\n| a | b |\n|---|---|\n| 1 | 2 |\n', title: '表格' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => insertMd(item.insert)}
                className="px-1.5 py-0.5 rounded text-xs transition-all hover:opacity-70"
                style={{
                  color: tokens.primary,
                  border: `1px solid ${tokens.borderDim}`,
                  fontFamily: tokens.fontMono,
                  fontSize: '9px',
                }}
                title={item.title}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 编辑区域 ── */}
      <div onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
        {mode === 'md' ? (
          <textarea
            className="w-full min-h-[120px] p-3 bg-transparent resize-y focus:outline-none"
            value={mdVal}
            onChange={(e) => setMdVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={quoteContent ? '引用消息已自动填充，可直接编辑...' : placeholder}
            style={{
              fontFamily: tokens.fontMono,
              fontSize: '11px',
              color: tokens.foreground,
              lineHeight: '1.6',
              caretColor: tokens.primary,
            }}
          />
        ) : (
          <div className="p-2">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {/* ── 底部操作栏 ── */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t"
        style={{ borderColor: tokens.borderDim }}
      >
        <span
          style={{
            fontFamily: tokens.fontMono,
            fontSize: '8px',
            color: tokens.foregroundMuted,
          }}
        >
          {mode === 'md' ? '⌘+⏎ 发送' : '支持表格 / 图片 / 粘贴'}
        </span>
        <button
          onClick={handleSend}
          className="px-4 py-1 rounded text-xs font-medium transition-all hover:opacity-85 active:scale-[0.97]"
          style={{
            background: tokens.primary,
            color: tokens.background,
            fontFamily: tokens.fontMono,
            fontSize: '10px',
            letterSpacing: '0.5px',
          }}
        >
          发送
        </button>
      </div>
    </div>
  )
}
