/**
 * @file AiMessageRender.tsx
 * @description AI 消息渲染组件 — 富文本渲染 + 折叠/展开 + 引用/重新生成操作栏
 * 适配 YYC³ AI-PAI 项目主题系统（useThemeStore tokens）
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { codeBlockPlugin } from './CodeBlockWrap'
import { useThemeStore } from '../../app/store/theme-store'
import type { ChatMessage } from '../../types/chat'

interface AiMessageRenderProps {
  message: ChatMessage
  onInsertEditor?: (code: string) => void
  onRegenerate: (msgId: string) => void
  onQuote: (content: string) => void
}

export default function AiMessageRender({
  message,
  onInsertEditor,
  onRegenerate,
  onQuote,
}: AiMessageRenderProps) {
  const { tokens } = useThemeStore()
  const { id, content, folded } = message
  const [isFolded, setIsFolded] = useState(folded)

  // 自动判断是否需要折叠：内容超长或包含代码块
  const needFold = content.length > 800 || content.includes('```')

  const handleToggleFold = useCallback(() => {
    setIsFolded((prev) => !prev)
  }, [])

  const handleQuote = useCallback(() => {
    onQuote(content)
  }, [content, onQuote])

  const handleRegenerate = useCallback(() => {
    onRegenerate(id)
  }, [id, onRegenerate])

  // Markdown 组件覆盖 — 使用项目 tokens
  const components = useMemo(
    () => ({
      // 代码块由 CodeBlockWrap 插件处理，此处无需额外覆盖
      p({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLParagraphElement>) {
        return (
          <p
            className="my-1"
            style={{
              color: tokens.foreground,
              fontFamily: tokens.fontBody,
              fontSize: '12px',
              lineHeight: '1.7',
              wordBreak: 'break-word',
            }}
            {...props}
          >
            {children}
          </p>
        )
      },
      a({ href, children, ...props }: { href?: string; children?: ReactNode } & React.HTMLAttributes<HTMLAnchorElement>) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{ color: tokens.primary, textDecoration: 'underline', textUnderlineOffset: '2px' }}
            {...props}
          >
            {children}
          </a>
        )
      },
      table({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLTableElement>) {
        return (
          <div className="overflow-x-auto my-2" style={{ maxWidth: '100%' }}>
            <table
              className="border-collapse w-full"
              style={{
                fontSize: '11px',
                border: `1px solid ${tokens.borderDim}`,
                borderRadius: '6px',
                overflow: 'hidden',
              }}
              {...props}
            >
              {children}
            </table>
          </div>
        )
      },
      th({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLTableCellElement>) {
        return (
          <th
            className="px-2.5 py-1.5 text-left font-semibold"
            style={{
              background: tokens.primaryGlow,
              color: tokens.primary,
              borderBottom: `2px solid ${tokens.primary}33`,
              fontFamily: tokens.fontMono,
              fontSize: '10px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
            {...props}
          >
            {children}
          </th>
        )
      },
      td({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLTableCellElement>) {
        return (
          <td
            className="px-2.5 py-1.5"
            style={{
              borderBottom: `1px solid ${tokens.borderDim}`,
              color: tokens.foreground,
              fontSize: '11px',
              lineHeight: '1.5',
              wordBreak: 'break-word',
            }}
            {...props}
          >
            {children}
          </td>
        )
      },
      blockquote({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
        return (
          <blockquote
            className="my-2 pl-3 py-1 border-l-2"
            style={{
              borderColor: tokens.primary,
              background: `${tokens.primary}08`,
              color: tokens.foregroundMuted,
              fontStyle: 'italic',
              borderRadius: '0 6px 6px 0',
            }}
            {...props}
          >
            {children}
          </blockquote>
        )
      },
      h1({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h1
            className="font-bold mt-4 mb-2 pb-1 border-b"
            style={{
              color: tokens.primary,
              fontFamily: tokens.fontDisplay,
              fontSize: '16px',
              borderColor: tokens.borderDim,
              letterSpacing: '1px',
            }}
            {...props}
          >
            {children}
          </h1>
        )
      },
      h2({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h2
            className="font-bold mt-3 mb-1.5"
            style={{
              color: tokens.foreground,
              fontFamily: tokens.fontDisplay,
              fontSize: '14px',
              letterSpacing: '0.5px',
            }}
            {...props}
          >
            {children}
          </h2>
        )
      },
      h3({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) {
        return (
          <h3
            className="font-semibold mt-2 mb-1"
            style={{
              color: tokens.foreground,
              fontFamily: tokens.fontBody,
              fontSize: '13px',
            }}
            {...props}
          >
            {children}
          </h3>
        )
      },
      ul({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLUListElement>) {
        return (
          <ul className="my-1.5 pl-4 space-y-0.5 list-disc" style={{ color: tokens.foreground }} {...props}>
            {children}
          </ul>
        )
      },
      ol({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLOListElement>) {
        return (
          <ol className="my-1.5 pl-4 space-y-0.5 list-decimal" style={{ color: tokens.foreground }} {...props}>
            {children}
          </ol>
        )
      },
      li({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLLIElement>) {
        return <li style={{ lineHeight: '1.55', fontSize: '12px' }} {...props}>{children}</li>
      },
      hr() {
        return <hr className="my-3 border-0" style={{ borderTop: `1px solid ${tokens.borderDim}` }} />
      },
      strong({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
        return <strong style={{ color: tokens.foreground, fontWeight: 600 }} {...props}>{children}</strong>
      },
      em({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
        return <em style={{ color: tokens.primaryDim, fontStyle: 'italic' }} {...props}>{children}</em>
      },
      img({ src, alt, ...props }: { src?: string; alt?: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
        const safeSrc = (src || '').startsWith('data:') || (src || '').startsWith('http') ? src : undefined
        return (
          <img
            src={safeSrc}
            alt={alt || ''}
            className="my-2 rounded-lg"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer"
            {...props}
          />
        )
      },
    }),
    [tokens]
  )

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{
        background: tokens.primaryGlow,
        border: `1px solid ${tokens.cardBorder}`,
      }}
    >
      {/* 操作工具栏 — 固定右上 */}
      <div
        className="absolute top-2 right-2 flex gap-1.5 z-10 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: 0.5 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
      >
        {/* 折叠/展开 */}
        {needFold && (
          <button
            onClick={handleToggleFold}
            className="px-2 py-0.5 rounded transition-all hover:opacity-80"
            style={{
              background: tokens.primary,
              color: tokens.background,
              fontFamily: tokens.fontMono,
              fontSize: '9px',
            }}
          >
            {isFolded ? '展开' : '折叠'}
          </button>
        )}
        {/* 引用追问 */}
        <button
          onClick={handleQuote}
          className="px-2 py-0.5 rounded transition-all hover:opacity-80"
          style={{
            background: tokens.secondary || tokens.primary,
            color: tokens.background,
            fontFamily: tokens.fontMono,
            fontSize: '9px',
          }}
        >
          引用
        </button>
        {/* 重新生成 */}
        <button
          onClick={handleRegenerate}
          className="px-2 py-0.5 rounded transition-all hover:opacity-80"
          style={{
            background: tokens.success,
            color: tokens.background,
            fontFamily: tokens.fontMono,
            fontSize: '9px',
          }}
        >
          重新生成
        </button>
      </div>

      {/* 富文本内容（折叠控制） */}
      <div
        className={`prose dark:prose-invert max-w-none break-words p-3 ${
          isFolded ? 'max-h-[200px] overflow-hidden relative' : ''
        }`}
        style={{ minHeight: '24px' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeKatex,
            [codeBlockPlugin, { onInsertEditor }],
          ]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* 折叠遮罩提示 */}
      {isFolded && needFold && (
        <div
          className="absolute bottom-0 left-0 right-0 h-14 flex justify-center items-end pb-2"
          style={{
            background: `linear-gradient(to top, ${tokens.cardBg || tokens.background}, transparent)`,
          }}
        >
          <button
            onClick={handleToggleFold}
            className="px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-80"
            style={{ color: tokens.primary }}
          >
            点击展开完整内容 ↓
          </button>
        </div>
      )}

      <style>{`
        .ai-msg-operations button:hover { filter: brightness(1.15); }
        .ai-msg-operations button:active { transform: scale(0.95); }
      `}</style>
    </div>
  )
}