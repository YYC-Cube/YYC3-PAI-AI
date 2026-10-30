/**
 * @file AuthCallback.tsx
 * @description #2 认证回调页 — OAuth PKCE code→token 交换 + 状态展示
 *
 * 路由：/auth/callback?code=xxx&state=yyy
 * 功能：从 URL 提取授权码 → handleCallback 交换 token → 重定向到主应用
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags auth,callback,oauth,login,phase-3
 */

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Loader2, LogIn } from 'lucide-react'
import { handleCallback, getDefaultAuthConfig, isAuthenticated, logout } from '../services/auth-client'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

type CallbackStatus = 'processing' | 'success' | 'error'

export function AuthCallback() {
  const { tokens: tk } = useThemeStore()
  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [message, setMessage] = useState('正在处理授权回调...')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    let cancelled = false

    const process = async () => {
      try {
        const config = getDefaultAuthConfig()
        const url = new URL(window.location.href)
        const result = await handleCallback(config, url)

        if (cancelled) return

        if (result.success) {
          setStatus('success')
          setMessage('登录成功！正在跳转...')
        } else {
          setStatus('error')
          setMessage(result.error || '授权失败')
        }
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setMessage(`处理回调时出错：${e instanceof Error ? e.message : String(e)}`)
      }
    }

    process()
    return () => { cancelled = true }
  }, [])

  // 成功后倒计时跳转
  useEffect(() => {
    if (status !== 'success') return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [status])

  const handleRetry = useCallback(() => {
    logout()
    window.location.href = '/'
  }, [])

  const handleManualLogin = useCallback(() => {
    window.location.href = '/'
  }, [])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.overlay, background: tk.overlayBg, backdropFilter: BLUR.md }}
    >
      <div
        className="w-[90vw] max-w-[420px] rounded-2xl p-8 text-center"
        style={{
          background: tk.panelBg,
          border: `1px solid ${status === 'error' ? tk.error + '40' : tk.border}`,
          boxShadow: tk.shadowHover,
        }}
      >
        {/* 图标 */}
        <div className="mb-4 flex justify-center">
          {status === 'processing' && <Loader2 size={40} className="animate-spin" color={tk.primary} />}
          {status === 'success' && <CheckCircle2 size={40} color={tk.success} />}
          {status === 'error' && <XCircle size={40} color={tk.error} />}
        </div>

        {/* 标题 */}
        <h2
          className="mb-2"
          style={{
            fontFamily: tk.fontDisplay,
            fontSize: '18px',
            color: status === 'error' ? tk.error : status === 'success' ? tk.success : tk.foreground,
            letterSpacing: '1px',
          }}
        >
          {status === 'processing' && '正在登录'}
          {status === 'success' && '登录成功'}
          {status === 'error' && '登录失败'}
        </h2>

        {/* 消息 */}
        <p
          className="mb-6"
          style={{
            fontFamily: tk.fontMono,
            fontSize: '12px',
            color: tk.foregroundMuted,
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {message}
          {status === 'success' && countdown > 0 && (
            <span style={{ color: tk.primary }}> ({countdown}s 后自动跳转)</span>
          )}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3 justify-center">
          {status === 'error' && (
            <>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{
                  fontFamily: tk.fontMono, fontSize: '12px',
                  color: tk.background, background: tk.primary,
                }}
              >
                <LogIn size={14} /> 重新登录
              </button>
              <button
                onClick={handleManualLogin}
                className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{
                  fontFamily: tk.fontMono, fontSize: '12px',
                  color: tk.foregroundMuted, border: `1px solid ${tk.border}`,
                }}
              >
                返回首页
              </button>
            </>
          )}
          {status === 'success' && (
            <button
              onClick={() => { window.location.href = '/' }}
              className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{
                fontFamily: tk.fontMono, fontSize: '12px',
                color: tk.background, background: tk.success,
              }}
            >
              立即进入
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 登录按钮组件（可嵌入任意面板）
 */
export function LoginButton({ onLogin }: { onLogin?: () => void }) {
  const { tokens: tk } = useThemeStore()

  const handleClick = useCallback(async () => {
    const { initiateLogin, getDefaultAuthConfig } = await import('../services/auth-client')
    const config = getDefaultAuthConfig()
    await initiateLogin(config)
    onLogin?.()
  }, [onLogin])

  if (isAuthenticated()) return null

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
      style={{
        fontFamily: tk.fontMono, fontSize: '11px',
        color: tk.background, background: tk.primary,
        border: `1px solid ${tk.primary}44`,
      }}
    >
      <LogIn size={12} />
      登录
    </button>
  )
}

/**
 * 用户信息卡（登录后显示）
 */
export function UserBadge() {
  const { tokens: tk } = useThemeStore()
  const [user, setUser] = useState<{ username: string; displayName?: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      import('../services/auth-client').then(({ getUser }) => {
        const u = getUser()
        if (u) setUser({ username: u.username, displayName: u.displayName })
      })
    }
  }, [])

  if (!user) return null

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-lg"
      style={{
        fontFamily: tk.fontMono, fontSize: '11px',
        color: tk.foreground, background: tk.cardBg,
        border: `1px solid ${tk.border}`,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{ background: tk.primaryGlow, color: tk.primary }}
      >
        {user.username.charAt(0).toUpperCase()}
      </div>
      <span>{user.displayName || user.username}</span>
    </div>
  )
}
