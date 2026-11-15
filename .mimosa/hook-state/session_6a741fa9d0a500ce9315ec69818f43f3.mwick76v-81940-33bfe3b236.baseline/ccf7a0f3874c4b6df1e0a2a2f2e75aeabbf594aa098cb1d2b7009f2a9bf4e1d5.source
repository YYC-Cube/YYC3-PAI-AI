/**
 * @file AuthCallback.deep.test.tsx
 * @description 认证回调页一轮深化 — 受控桩三态（成功/失败/异常）+ URL 参数变体 + 倒计时跳转 + LoginButton/UserBadge
 * （旧 AuthCallback 无专项测试；auth-client 全 mock 受控桩，theme-store mock，securityVault 存储层不触碰）
 */

import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ===== 受控桩：auth-client 全 mock（同步顶层 import 与组件内动态 import 同源生效） =====
const h = vi.hoisted(() => ({
  handleCallback: vi.fn(),
  getDefaultAuthConfig: vi.fn(),
  isAuthenticated: vi.fn(),
  logout: vi.fn(),
  sanitizeText: vi.fn(),
  initiateLogin: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('../../services/auth-client', () => ({
  handleCallback: h.handleCallback,
  getDefaultAuthConfig: h.getDefaultAuthConfig,
  isAuthenticated: h.isAuthenticated,
  logout: h.logout,
  sanitizeText: h.sanitizeText,
  initiateLogin: h.initiateLogin,
  getUser: h.getUser,
}))

// ===== theme-store mock（含 AuthCallback 用到的 Z_INDEX/BLUR 常量导出） =====
const tokens = {
  overlayBg: 'rgba(0,0,0,0.75)',
  panelBg: '#101014',
  background: '#0a0a0e',
  foreground: '#f5f5f5',
  foregroundMuted: '#9ca3af',
  primary: '#3b82f6',
  primaryGlow: 'rgba(59,130,246,0.2)',
  success: '#10b981',
  error: '#ef4444',
  border: '#26262e',
  cardBg: '#14141a',
  shadowHover: '0 8px 30px rgba(0,0,0,0.5)',
  fontDisplay: 'serif',
  fontMono: 'monospace',
}

vi.mock('../../store/theme-store', () => ({
  useThemeStore: () => ({ tokens, isCyberpunk: false }),
  Z_INDEX: { overlay: 50 },
  BLUR: { md: 'blur(10px)' },
}))

import { AuthCallback, LoginButton, UserBadge } from '../AuthCallback'

// ===== jsdom location.href 不可直接赋值：替换为可写桩（同 services/__tests__/auth-client.test.ts 套路） =====
const origLocation = window.location
const setHref = (href: string) => {
  Object.defineProperty(window, 'location', {
    value: { href }, writable: true, configurable: true,
  })
}

const flush = () => act(async () => { await Promise.resolve() })

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  // resetAllMocks 后重挂关键受控实现（幂等保险）
  h.sanitizeText.mockImplementation((s: string) => ` sanitized:${s} `)
  h.getDefaultAuthConfig.mockReturnValue({ clientId: 'cid', redirectUri: 'https://app.test/auth/callback' })
  h.isAuthenticated.mockReturnValue(false)
  setHref('https://app.test/auth/callback?code=abc123&state=st-1')
})

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(window, 'location', { value: origLocation, writable: true, configurable: true })
  vi.unstubAllGlobals()
})

const body = () => document.body.textContent!

describe('AuthCallback 回调三态与跳转', () => {
  it('成功回调：handleCallback 收到带 code/state 的 URL，页面进入 success 态并显示倒计时', async () => {
    h.handleCallback.mockResolvedValue({ success: true })
    render(<AuthCallback />)
    expect(body()).toContain('正在处理授权回调')
    await flush()
    expect(h.getDefaultAuthConfig).toHaveBeenCalledTimes(1)
    expect(h.handleCallback).toHaveBeenCalledTimes(1)
    const passedUrl = h.handleCallback.mock.calls[0][1] as URL
    expect(passedUrl).toBeInstanceOf(URL)
    expect(passedUrl.searchParams.get('code')).toBe('abc123')
    expect(passedUrl.searchParams.get('state')).toBe('st-1')
    expect(body()).toContain('登录成功')
    expect(body()).toContain('登录成功！正在跳转...')
    expect(body()).toContain('(3s 后自动跳转)')
    // 成功态无错误按钮
    expect(screen.queryByText('重新登录')).toBeNull()
  })

  it('失败回调：result.error 经 sanitizeText 清洗后展示，出现重新登录/返回首页双按钮', async () => {
    h.handleCallback.mockResolvedValue({ success: false, error: '<script>alert(1)</script>state 校验失败' })
    render(<AuthCallback />)
    await flush()
    expect(h.sanitizeText).toHaveBeenCalledWith('<script>alert(1)</script>state 校验失败')
    expect(body()).toContain('登录失败')
    expect(body()).toContain('sanitized:<script>alert(1)</script>state 校验失败')
    expect(screen.getByText('重新登录')).toBeTruthy()
    expect(screen.getByText('返回首页')).toBeTruthy()
  })

  it('失败回调无 error 字段：回退展示默认「授权失败」文案', async () => {
    h.handleCallback.mockResolvedValue({ success: false })
    render(<AuthCallback />)
    await flush()
    expect(h.sanitizeText).not.toHaveBeenCalled()
    expect(body()).toContain('授权失败')
    expect(body()).not.toContain('sanitized:')
  })

  it('handleCallback 抛 Error：进入 error 态并展示异常 message', async () => {
    h.handleCallback.mockRejectedValue(new Error('token 交换 401'))
    render(<AuthCallback />)
    await flush()
    expect(body()).toContain('处理回调时出错：token 交换 401')
    expect(body()).toContain('登录失败')
    expect(screen.getByText('重新登录')).toBeTruthy()
  })

  it('handleCallback 抛非 Error 值（字符串）：走 String(e) 分支展示原始值', async () => {
    h.handleCallback.mockRejectedValue('纯字符串异常')
    render(<AuthCallback />)
    await flush()
    expect(body()).toContain('处理回调时出错：纯字符串异常')
  })

  it('URL 参数变体：无参数回调页仍把当前 URL 原样交给 handleCallback 处理', async () => {
    setHref('https://app.test/auth/callback?error=access_denied&error_description=user+denied')
    h.handleCallback.mockResolvedValue({ success: false, error: 'user denied' })
    render(<AuthCallback />)
    await flush()
    const passedUrl = h.handleCallback.mock.calls[0][1] as URL
    expect(passedUrl.searchParams.get('error')).toBe('access_denied')
    expect(passedUrl.searchParams.get('error_description')).toBe('user denied')
    expect(body()).toContain('登录失败')
  })

  it('成功态「立即进入」按钮：点击即置 location.href 为首页', async () => {
    h.handleCallback.mockResolvedValue({ success: true })
    render(<AuthCallback />)
    await flush()
    fireEvent.click(screen.getByText('立即进入'))
    expect(window.location.href).toBe('/')
  })

  it('失败态「重新登录」：先 logout 清会话再回首页', async () => {
    h.handleCallback.mockResolvedValue({ success: false, error: 'expired' })
    render(<AuthCallback />)
    await flush()
    fireEvent.click(screen.getByText('重新登录'))
    expect(h.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/')
  })

  it('失败态「返回首页」：直接跳转且不触碰会话', async () => {
    h.handleCallback.mockResolvedValue({ success: false, error: 'expired' })
    render(<AuthCallback />)
    await flush()
    fireEvent.click(screen.getByText('返回首页'))
    expect(h.logout).not.toHaveBeenCalled()
    expect(window.location.href).toBe('/')
  })

  it('成功后倒计时逐秒递减，归零自动置 location.href 为首页（fake timers）', async () => {
    vi.useFakeTimers()
    h.handleCallback.mockResolvedValue({ success: true })
    render(<AuthCallback />)
    await act(async () => { await Promise.resolve() })
    expect(body()).toContain('(3s 后自动跳转)')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(body()).toContain('(2s 后自动跳转)')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(body()).toContain('(1s 后自动跳转)')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(body()).not.toContain('后自动跳转')
    expect(window.location.href).toBe('/')
  })
})

describe('LoginButton / UserBadge 附属组件', () => {
  it('LoginButton：未认证渲染登录按钮，点击动态加载 initiateLogin 并回调 onLogin', async () => {
    h.isAuthenticated.mockReturnValue(false)
    h.initiateLogin.mockResolvedValue(undefined)
    const onLogin = vi.fn()
    render(<LoginButton onLogin={onLogin} />)
    const btn = screen.getByText('登录')
    fireEvent.click(btn)
    await waitFor(() => expect(h.initiateLogin).toHaveBeenCalledTimes(1))
    expect(h.getDefaultAuthConfig).toHaveBeenCalledTimes(1)
    expect(onLogin).toHaveBeenCalledTimes(1)
  })

  it('LoginButton：已认证时渲染 null（不出现登录入口）', () => {
    h.isAuthenticated.mockReturnValue(true)
    const { container } = render(<LoginButton />)
    expect(container.textContent).toBe('')
    expect(screen.queryByText('登录')).toBeNull()
  })

  it('UserBadge：已认证且 getUser 有值 → 首字母头像 + displayName 展示', async () => {
    h.isAuthenticated.mockReturnValue(true)
    h.getUser.mockReturnValue({ username: 'yanyu', displayName: '焉与' })
    render(<UserBadge />)
    await flush()
    expect(body()).toContain('焉与')
    expect(body()).toContain('Y')
  })

  it('UserBadge：无 displayName 回退 username；getUser 空值不渲染', async () => {
    h.isAuthenticated.mockReturnValue(true)
    h.getUser.mockReturnValue({ username: 'cube' })
    const r1 = render(<UserBadge />)
    await flush()
    expect(body()).toContain('cube')
    expect(body()).toContain('C')
    r1.unmount()
    h.getUser.mockReturnValue(null)
    render(<UserBadge />)
    await flush()
    expect(body()).not.toContain('cube')
  })

  it('UserBadge：未认证时始终渲染 null', async () => {
    h.isAuthenticated.mockReturnValue(false)
    render(<UserBadge />)
    await flush()
    expect(h.getUser).not.toHaveBeenCalled()
    expect(body()).toBe('')
  })
})
