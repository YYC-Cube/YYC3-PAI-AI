/**
 * @file AIMessageActions.tsx
 * @description YYC³ AI-PAI A I Message Actions.tsx component
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [component]
 */

import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useThemeStore } from '../../store/theme-store'

export interface AIMessageActionsProps {
  content: string
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export function AIMessageActions({ content, onRegenerate, isRegenerating = false }: AIMessageActionsProps) {
  const { tokens } = useThemeStore()
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
        copyTimerRef.current = null
      }
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
        copyTimerRef.current = null
      }, 1800)
    } catch {
      navigator.clipboard.writeText(content).catch(() => {})
    }
  }, [content])

  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    if (feedback === type) {
      setFeedback(null)
    } else {
      setFeedback(type)
    }
  }, [feedback])

  return (
    <div
      className="ai-msg-actions flex items-center gap-1 mt-1.5 pt-1.5 border-t opacity-0 hover:opacity-100 transition-opacity"
      style={{ borderColor: `${tokens.borderDim}44` }}
    >
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all"
        style={{ color: copied ? tokens.success : tokens.foregroundMuted }}
        title={copied ? 'Copied!' : 'Copy'}
        type="button"
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
        <span style={{ fontFamily: tokens.fontMono, fontSize: '7px', letterSpacing: '0.5px' }}>
          {copied ? 'COPIED' : 'COPY'}
        </span>
      </button>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all"
          style={{
            color: isRegenerating ? tokens.primary : tokens.foregroundMuted,
            opacity: isRegenerating ? 1 : undefined,
          }}
          title="Regenerate"
          type="button"
        >
          <RefreshCw size={10} className={isRegenerating ? 'animate-spin' : ''} />
          <span style={{ fontFamily: tokens.fontMono, fontSize: '7px', letterSpacing: '0.5px' }}>
            REGEN
          </span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-0.5">
        <button
          onClick={() => handleFeedback('positive')}
          className="p-0.5 rounded transition-all"
          style={{ color: feedback === 'positive' ? tokens.success : tokens.foregroundMuted }}
          title="Good response"
          type="button"
        >
          <ThumbsUp size={11} fill={feedback === 'positive' ? tokens.success : 'none'} />
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          className="p-0.5 rounded transition-all"
          style={{ color: feedback === 'negative' ? tokens.error : tokens.foregroundMuted }}
          title="Bad response"
          type="button"
        >
          <ThumbsDown size={11} fill={feedback === 'negative' ? tokens.error : 'none'} />
        </button>
      </div>

      <style>{`
        .ai-msg-actions button:hover { background: ${tokens.primaryGlow}; }
        .ai-msg-actions button:disabled { cursor: not-allowed; opacity: 0.4; }
      `}</style>
    </div>
  )
}

export default AIMessageActions
