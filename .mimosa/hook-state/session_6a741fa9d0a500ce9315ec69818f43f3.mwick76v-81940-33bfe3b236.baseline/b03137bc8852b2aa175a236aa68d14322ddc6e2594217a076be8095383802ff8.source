/**
 * @file SelfMediaEditor.tsx
 * @description 自媒体内容编辑器面板 — 封装 RichTextEditor 为全屏叠加层
 * 提供独立的内容创作空间，支持富文本编辑 + AI改写/扩写/翻译/续写
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [component],[editor],[self-media],[rich-text],[ai]
 */

import { Eye, FileDown, FileText, Send, Sparkles, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useSelfMediaStore } from '../store/self-media-store'
import { BLUR, useThemeStore } from '../store/theme-store'
import { RichTextEditor } from './RichTextEditor'

export interface SelfMediaEditorProps {
  visible: boolean
  onClose: () => void
}

export function SelfMediaEditor({ visible, onClose }: SelfMediaEditorProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { panelActions } = useSelfMediaStore()
  const [htmlContent, setHtmlContent] = useState('')
  const [saved, setSaved] = useState(false)
  const contentRef = useRef('')

  const handleChange = useCallback((html: string) => {
    contentRef.current = html
    setHtmlContent(html)
    setSaved(false)
  }, [])

  const handleExport = useCallback(() => {
    const html = contentRef.current
    if (!html.trim()) return

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yyc3-content-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: isCyberpunk ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
        backdropFilter: BLUR.md,
      }}
    >
      <div
        className="flex flex-col"
        style={{
          width: '90vw',
          maxWidth: '1200px',
          height: '85vh',
          borderRadius: '12px',
          border: `1px solid ${tk.borderDim}`,
          background: tk.background,
          boxShadow: `0 24px 80px ${isCyberpunk ? 'rgba(0,240,255,0.08)' : 'rgba(0,0,0,0.2)'}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${tk.borderDim}`,
            background: isCyberpunk ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            <FileText size={16} color={tk.primary} />
            <span
              style={{
                fontFamily: tk.fontDisplay,
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '1px',
                color: tk.foreground,
              }}
            >
              自媒体内容编辑器
            </span>
            <span
              style={{
                fontFamily: tk.fontMono,
                fontSize: '9px',
                color: tk.foregroundMuted,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isCyberpunk ? 'rgba(0,240,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              AI 富文本
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={!htmlContent.trim()}
              title="导出 HTML"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${tk.borderDim}`,
                background: saved ? 'rgba(0,200,100,0.1)' : 'transparent',
                color: saved ? '#00c864' : tk.foregroundMuted,
                fontSize: '10px',
                fontFamily: tk.fontMono,
                cursor: htmlContent.trim() ? 'pointer' : 'not-allowed',
                opacity: htmlContent.trim() ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (htmlContent.trim()) e.currentTarget.style.background = tk.borderDim }}
              onMouseLeave={e => { e.currentTarget.style.background = saved ? 'rgba(0,200,100,0.1)' : 'transparent' }}
            >
              <FileDown size={12} />
              {saved ? '已导出 ✓' : '导出 HTML'}
            </button>

            {/* Send to Preview */}
            <button
              onClick={() => {
                const content = contentRef.current
                if (content.trim()) {
                  panelActions?.openContentPreview({ content, title: '编辑器内容' })
                }
              }}
              disabled={!htmlContent.trim()}
              title="预览内容"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${tk.borderDim}`,
                background: 'transparent',
                color: tk.foregroundMuted,
                fontSize: '10px',
                fontFamily: tk.fontMono,
                cursor: htmlContent.trim() ? 'pointer' : 'not-allowed',
                opacity: htmlContent.trim() ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (htmlContent.trim()) e.currentTarget.style.background = tk.borderDim }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Eye size={12} />
              预览
            </button>

            {/* Send to Publish Queue */}
            <button
              onClick={() => {
                const content = contentRef.current
                if (content.trim()) {
                  panelActions?.openPublishQueue({ content, title: '编辑器内容' })
                }
              }}
              disabled={!htmlContent.trim()}
              title="发送到发布队列"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${tk.borderDim}`,
                background: 'transparent',
                color: tk.foregroundMuted,
                fontSize: '10px',
                fontFamily: tk.fontMono,
                cursor: htmlContent.trim() ? 'pointer' : 'not-allowed',
                opacity: htmlContent.trim() ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (htmlContent.trim()) e.currentTarget.style.background = tk.borderDim }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Send size={12} />
              发布
            </button>

            {/* Open AI Writing */}
            <button
              onClick={() => {
                panelActions?.openAIWriting({ topic: '继续当前编辑内容...' })
              }}
              title="AI写作助手"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${tk.primary}`,
                background: tk.primaryDim,
                color: tk.primary,
                fontSize: '10px',
                fontFamily: tk.fontMono,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = tk.borderDim }}
              onMouseLeave={e => { e.currentTarget.style.background = tk.primaryDim }}
            >
              <Sparkles size={12} />
              AI写作
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded transition-all hover:opacity-70"
              style={{ color: tk.foregroundMuted }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-hidden">
          <RichTextEditor
            onChange={handleChange}
            minHeight="100%"
            maxHeight="100%"
            enableAI={true}
          />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '8px 16px',
            borderTop: `1px solid ${tk.borderDim}`,
            fontSize: '9px',
            color: tk.foregroundMuted,
            fontFamily: tk.fontMono,
            background: isCyberpunk ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.03)',
          }}
        >
          <span>选中文本后使用 AI 改写 / 润色 / 翻译</span>
          <span>{htmlContent ? `${htmlContent.length} 字符` : '空文档'}</span>
        </div>
      </div>
    </div>
  )
}
