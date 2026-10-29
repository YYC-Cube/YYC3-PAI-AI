/**
 * @file AIMessageRenderer.tsx
 * @description YYC³ AI-PAI A I Message Renderer.tsx component
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [component]
 */

import { Check, Copy } from 'lucide-react'
import React, { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useThemeStore } from '../../store/theme-store'

export interface AIMessageRendererProps {
  content: string
  isStreaming?: boolean
  className?: string
  maxCodeBlockHeight?: number
}

function CodeBlock({ children, language = 'text', maxHeight = 400, ...props }: { children?: ReactNode; language?: string; maxHeight?: number } & React.HTMLAttributes<HTMLElement>) {
  const { tokens } = useThemeStore()
  const [copied, setCopied] = useState(false)
  // react-markdown 代码块 children 常为文本节点数组——拼接提取纯文本（修复复制空串）
  const codeText = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
      : ''

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      navigator.clipboard.writeText(codeText).catch(() => {})
    }
  }, [codeText])

  return (
    <div
      className="ai-md-code-block rounded-lg overflow-hidden my-2"
      style={{
        background: tokens.codeBg,
        border: `1px solid ${tokens.borderDim}`,
        maxWidth: '100%',
      }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: tokens.borderDim }}>
        <span style={{ fontFamily: tokens.fontMono, fontSize: '9px', color: tokens.foregroundMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all hover:opacity-80"
          style={{ color: copied ? tokens.success : tokens.primaryDim }}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span style={{ fontFamily: tokens.fontMono, fontSize: '8px' }}>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
      <pre
        className="p-3 overflow-x-auto neon-scrollbar"
        style={{
          fontFamily: tokens.fontMono,
          fontSize: '11px',
          color: tokens.foreground,
          lineHeight: '1.65',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: `${maxHeight}px`,
          overflowY: 'auto',
        }}
        {...props}
      >
        <code>{children}</code>
      </pre>
    </div>
  )
}

function InlineCode({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { tokens } = useThemeStore()
  return (
    <code
      className="ai-md-inline-code px-1 py-0.5 rounded"
      style={{
        background: `${tokens.primary}12`,
        border: `1px solid ${tokens.primary}22`,
        color: tokens.primary,
        fontFamily: tokens.fontMono,
        fontSize: '0.85em',
      }}
      {...props}
    >
      {children}
    </code>
  )
}

export function AIMessageRenderer({ content, isStreaming = false, className = '', maxCodeBlockHeight: _maxCodeBlockHeight = 400 }: AIMessageRendererProps) {
  const { tokens } = useThemeStore()

  const components: Components = useMemo(
    () => ({
      code({ inline, className: cls, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
        const lang = (cls || '').replace(/language-/, '')
        const childStr = typeof children === 'string' ? children : ''
        if (!inline && (lang || childStr.includes('\n'))) {
          return <CodeBlock language={lang} maxHeight={_maxCodeBlockHeight}>{children}</CodeBlock>
        }
        return <InlineCode {...props}>{children}</InlineCode>
      },
      pre({ children }: { children?: ReactNode }) {
        return <>{children}</>
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
              className="ai-md-table border-collapse w-full"
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
              maxWidth: '300px',
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
        return (
          <li style={{ lineHeight: '1.55', fontSize: '12px' }} {...props}>
            {children}
          </li>
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
      hr() {
        return <hr className="my-3 border-0" style={{ borderTop: `1px solid ${tokens.borderDim}` }} />
      },
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
      strong({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
        return (
          <strong style={{ color: tokens.foreground, fontWeight: 600 }} {...props}>
            {children}
          </strong>
        )
      },
      em({ children, ...props }: { children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
        return (
          <em style={{ color: tokens.primaryDim, fontStyle: 'italic' }} {...props}>
            {children}
          </em>
        )
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
    [tokens, _maxCodeBlockHeight]
  )

  const displayContent = isStreaming && content.length > 0 ? content + '\u200B' : content

  if (!content || content.trim().length === 0) {
    return null
  }

  return (
    <div className={`ai-message-renderer ${className}`} style={{ width: '100%', maxWidth: '100%', overflowWrap: 'break-word', overflowX: 'hidden', overflowY: 'visible' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {displayContent}
      </ReactMarkdown>
      {isStreaming && (
        <span
          className="ai-streaming-cursor ml-0.5 inline-block"
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            background: tokens.primary,
            verticalAlign: 'text-bottom',
            animation: 'ai-cursor-blink 1s step-end infinite',
            boxShadow: tokens.enableGlow ? `0 0 6px ${tokens.primary}` : 'none',
          }}
        />
      )}
      <style>{`
        @keyframes ai-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .ai-md-code-block pre::-webkit-scrollbar { height: 6px; width: 6px; }
        .ai-md-code-block pre::-webkit-scrollbar-thumb { background: ${tokens.borderDim}; border-radius: 3px; }
        .ai-md-code-block pre::-webkit-scrollbar-track { background: transparent; }
        .ai-md-table th, .ai-md-table td { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ai-md-table td { white-space: normal !important; }
        .ai-message-renderer img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
        .ai-message-renderer > *:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  )
}

export default AIMessageRenderer
