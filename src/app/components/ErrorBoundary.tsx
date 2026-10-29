/**
 * @file ErrorBoundary.tsx
 * @description 全局错误边界组件，捕获React组件错误
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-19
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags error-boundary,ui,component
 */
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { themeStore } from '../store/theme-store'
import { AlertTriangle, RefreshCw, Bug, Copy, CheckCircle } from 'lucide-react'
import { createLogger } from '../utils/logger'

const logger = createLogger('error-boundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
  silent?: boolean
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  resetKeys?: unknown[]
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  copied: boolean
  /** 出错时的 resetKeys 快照（供变更检测） */
  resetKeysSnapshot?: unknown[] | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null, copied: false, resetKeysSnapshot: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  static getDerivedStateFromProps(props: Props, state: State): State {
    // resetKeys 语义：任一 key 与"出错时快照"不同 → 重置边界（历史实现误与
    // componentStack 逐位比较，导致重置永不生效）
    if (props.resetKeys && state.hasError) {
      const snapshot = state.resetKeysSnapshot ?? props.resetKeys
      const changed = props.resetKeys.some((key, i) => key !== snapshot[i])
      if (changed) {
        return { hasError: false, error: null, errorInfo: null, copied: false, resetKeysSnapshot: null }
      }
    }
    return state
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    logger.error('[YYC3 ErrorBoundary]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
    
    this.props.onError?.(error, errorInfo)
    
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo)
    }
  }

  private reportError(_error: Error, _errorInfo: ErrorInfo) {
    // 无监控服务接入——仅记录本地日志，不输出"已上报"假话术
    logger.info('[YYC3] Error captured locally (no monitoring service configured)')
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false })
  }

  handleCopyError = async () => {
    const { error, errorInfo } = this.state
    if (!error) return
    
    const errorText = `
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim()
    
    try {
      await navigator.clipboard.writeText(errorText)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    } catch (err) {
      logger.error('Failed to copy error:', err)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      if (this.props.silent) return null

      const tk = themeStore.getTokens()
      const { error, errorInfo, copied } = this.state
      const showDetails = this.props.showDetails ?? import.meta.env.DEV

      return (
        <div
          className="flex flex-col items-center justify-center gap-4 p-6 rounded-xl"
          style={{
            background: tk.cardBg,
            border: `1px solid ${tk.error}30`,
            color: tk.foreground,
            minHeight: 200,
            maxWidth: 600,
            margin: 'auto',
          }}
        >
          <AlertTriangle size={32} color={tk.error} />
          
          <div className="text-center">
            <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '16px', color: tk.error, marginBottom: '8px' }}>
              Something went wrong
            </h3>
            <p style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foregroundMuted }}>
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
          </div>

          {showDetails && error && (
            <div
              className="w-full overflow-auto"
              style={{
                background: tk.background,
                border: `1px solid ${tk.border}`,
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '200px',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bug size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>
                    Error Details
                  </span>
                </div>
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
                  style={{ background: tk.primaryGlow, color: tk.primary }}
                >
                  {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                  <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
              <pre
                style={{
                  fontFamily: tk.fontMono,
                  fontSize: '10px',
                  color: tk.error,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.message}
                {'\n\n'}
                {error.stack}
                {errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {errorInfo.componentStack}
                  </>
                )}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '11px',
                color: tk.background,
                background: tk.primary,
              }}
            >
              <RefreshCw size={12} />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '11px',
                color: tk.foreground,
                background: 'transparent',
                border: `1px solid ${tk.border}`,
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
