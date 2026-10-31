/**
 * @file auth-client.test.ts
 * @description OAuth 2.1 PKCE 认证客户端专项 — PKCE 工具/状态机/回调全错误路径/刷新/默认配置
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// jsdom location.href 不可直接赋值：替换为可写桩
const origLocation = window.location
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { href: 'https://app.test/ide' }, writable: true, configurable: true,
  })
})
afterEach(() => {
  Object.defineProperty(window, 'location', { value: origLocation, writable: true, configurable: true })
  vi.unstubAllGlobals()
})

import {
  generateCodeVerifier, generateCodeChallenge,
  getAuthState, getTokens, getUser, isAuthenticated,
  initiateLogin, handleCallback, refreshTokens, getAuthHeaders, logout, getDefaultAuthConfig,
  type AuthConfig,
} from '../auth-client'

const CONFIG: AuthConfig = {
  authorizationEndpoint: 'https://platform.test/auth/authorize',
  tokenEndpoint: 'https://platform.test/auth/token',
  clientId: 'cid',
  redirectUri: 'https://app.test/auth/callback',
  scope: 'read write',
}

const callbackUrl = (params: Record<string, string>) => {
  const u = new URL('https://app.test/auth/callback')
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return u
}

/** 预置一次合法的授权会话（verifier + state），返回 state 值 */
async function primeSession(): Promise<string> {
  const verifier = generateCodeVerifier()
  const state = verifier.slice(0, 16)
  localStorage.setItem('yyc3_auth_verifier', verifier)
  localStorage.setItem('yyc3_oauth_state', state)
  localStorage.setItem('yyc3_auth_state', 'authorizing')
  return state
}

const okTokenResponse = (over: Record<string, unknown> = {}) => ({
  ok: true,
  json: async () => ({
    access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600, token_type: 'Bearer',
    user: { id: 'u1', username: 'yy', displayName: 'YYC³' },
    ...over,
  }),
  text: async () => '',
})

beforeEach(() => {
  localStorage.clear()
})

describe('auth-client PKCE 工具', () => {
  it('generateCodeVerifier：64 位 hex 且随机', () => {
    const v1 = generateCodeVerifier()
    expect(v1).toMatch(/^[0-9a-f]{64}$/)
    expect(generateCodeVerifier()).not.toBe(v1)
  })

  it('generateCodeChallenge：S256 摘要 64 hex', async () => {
    const c = await generateCodeChallenge('test-verifier')
    expect(c).toMatch(/^[0-9a-f]{64}$/)
    // 确定性
    expect(await generateCodeChallenge('test-verifier')).toBe(c)
    expect(await generateCodeChallenge('other')).not.toBe(c)
  })
})

describe('auth-client 状态机', () => {
  it('无记录 → unauthenticated', () => {
    expect(getAuthState()).toBe('unauthenticated')
    expect(isAuthenticated()).toBe(false)
    expect(getTokens()).toBeNull()
    expect(getUser()).toBeNull()
    expect(getAuthHeaders()).toEqual({})
  })

  it('authenticated + 未过期 → authenticated；过期 → expired', () => {
    localStorage.setItem('yyc3_auth_state', 'authenticated')
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({
      accessToken: 'at', expiresAt: Date.now() + 60_000, tokenType: 'Bearer',
    }))
    expect(getAuthState()).toBe('authenticated')
    expect(isAuthenticated()).toBe(true)
    expect(getAuthHeaders()).toEqual({ Authorization: 'Bearer at' })

    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({
      accessToken: 'at', expiresAt: Date.now() - 1, tokenType: 'Bearer',
    }))
    expect(getAuthState()).toBe('expired')
    expect(isAuthenticated()).toBe(false)
  })

  it('authorizing 状态透传；tokens 坏 JSON 容错', () => {
    localStorage.setItem('yyc3_auth_state', 'authorizing')
    expect(getAuthState()).toBe('authorizing')
    localStorage.setItem('yyc3_auth_state', 'authenticated')
    localStorage.setItem('yyc3_auth_tokens', '{bad json')
    // tokens 解析失败 → 无过期证明 → expired
    expect(getAuthState()).toBe('expired')
    expect(getTokens()).toBeNull()
  })

  it('getUser 解析持久化用户；坏 JSON → null', () => {
    localStorage.setItem('yyc3_auth_user', JSON.stringify({ id: 'u', username: 'n' }))
    expect(getUser()!.username).toBe('n')
    localStorage.setItem('yyc3_auth_user', '{oops')
    expect(getUser()).toBeNull()
  })
})

describe('auth-client 登录发起与回调', () => {
  it('initiateLogin：重定向 URL 携带 PKCE 参数并落 verifier/state', async () => {
    await initiateLogin(CONFIG)
    expect(window.location.href).toContain('https://platform.test/auth/authorize?')
    const url = new URL(window.location.href)
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('cid')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toMatch(/^[0-9a-f]{64}$/)
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{16}$/)
    expect(localStorage.getItem('yyc3_auth_verifier')).toMatch(/^[0-9a-f]{64}$/)
    expect(getAuthState()).toBe('authorizing')
  })

  it('回调 error 参数 → 失败并复位', async () => {
    await primeSession()
    const r = await handleCallback(CONFIG, callbackUrl({ error: 'access_denied' }))
    expect(r.success).toBe(false)
    expect(r.error).toContain('access_denied')
    expect(getAuthState()).toBe('unauthenticated')
  })

  it('无 code → 失败', async () => {
    const r = await handleCallback(CONFIG, callbackUrl({}))
    expect(r).toEqual({ success: false, error: 'No authorization code in callback' })
  })

  it('state 不匹配 → CSRF 拦截', async () => {
    await primeSession()
    const r = await handleCallback(CONFIG, callbackUrl({ code: 'c1', state: 'tampered' }))
    expect(r.success).toBe(false)
    expect(r.error).toContain('CSRF')
    expect(getAuthState()).toBe('unauthenticated')
  })

  it('缺 verifier → 失败', async () => {
    const state = await primeSession()
    localStorage.removeItem('yyc3_auth_verifier')
    const r = await handleCallback(CONFIG, callbackUrl({ code: 'c1', state }))
    expect(r.success).toBe(false)
    expect(r.error).toContain('No code verifier')
  })

  it('成功交换：存 tokens/user、清理临时态、expiresAt 按 expires_in 推算', async () => {
    const state = await primeSession()
    const fetchMock = vi.fn().mockResolvedValue(okTokenResponse())
    vi.stubGlobal('fetch', fetchMock)
    const before = Date.now()
    const r = await handleCallback(CONFIG, callbackUrl({ code: 'c1', state }))
    expect(r.success).toBe(true)

    const tokens = getTokens()!
    expect(tokens.accessToken).toBe('at-1')
    expect(tokens.refreshToken).toBe('rt-1')
    expect(tokens.expiresAt).toBeGreaterThanOrEqual(before + 3600_000 - 5)
    expect(getUser()!.username).toBe('yy')
    expect(getAuthState()).toBe('authenticated')
    // 临时数据清理
    expect(localStorage.getItem('yyc3_auth_verifier')).toBeNull()
    expect(localStorage.getItem('yyc3_oauth_state')).toBeNull()
    // 请求体携带 verifier
    const body = (fetchMock.mock.calls[0][1] as RequestInit).body as URLSearchParams
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code_verifier')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('token 端点非 2xx → 失败含状态码', async () => {
    const state = await primeSession()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'invalid_grant' }))
    const r = await handleCallback(CONFIG, callbackUrl({ code: 'bad', state }))
    expect(r.success).toBe(false)
    expect(r.error).toContain('400')
    expect(getAuthState()).toBe('unauthenticated')
  })

  it('fetch 网络异常 → 失败复位', async () => {
    const state = await primeSession()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const r = await handleCallback(CONFIG, callbackUrl({ code: 'c1', state }))
    expect(r.success).toBe(false)
    expect(r.error).toContain('offline')
    expect(getAuthState()).toBe('unauthenticated')
  })
})

describe('auth-client 刷新与登出', () => {
  it('无 refresh_token → false', async () => {
    expect(await refreshTokens(CONFIG)).toBe(false)
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({
      accessToken: 'at', expiresAt: Date.now() + 1000, tokenType: 'Bearer',
    }))
    expect(await refreshTokens(CONFIG)).toBe(false)
  })

  it('刷新成功：新 token 落库，旧 refresh_token 兜底', async () => {
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({
      accessToken: 'old', refreshToken: 'rt-old', expiresAt: 1, tokenType: 'Bearer',
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-at', expires_in: 7200 }),
    }))
    expect(await refreshTokens(CONFIG)).toBe(true)
    const tokens = getTokens()!
    expect(tokens.accessToken).toBe('new-at')
    // 响应未带 refresh_token → 沿用旧值
    expect(tokens.refreshToken).toBe('rt-old')
    expect(getAuthState()).toBe('authenticated')
    const body = (vi.mocked(globalThis.fetch).mock.calls[0][1] as RequestInit).body as URLSearchParams
    expect(body.get('grant_type')).toBe('refresh_token')
  })

  it('刷新失败 → 状态 expired', async () => {
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({
      accessToken: 'at', refreshToken: 'rt', expiresAt: 1, tokenType: 'Bearer',
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    expect(await refreshTokens(CONFIG)).toBe(false)
    expect(getAuthState()).toBe('expired')
  })

  it('刷新网络异常 → false 不改状态档', async () => {
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({
      accessToken: 'at', refreshToken: 'rt', expiresAt: Date.now() + 1000, tokenType: 'Bearer',
    }))
    localStorage.setItem('yyc3_auth_state', 'authenticated')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    expect(await refreshTokens(CONFIG)).toBe(false)
    expect(getAuthState()).toBe('authenticated')
  })

  it('logout：清 tokens/user/临时数据并复位', async () => {
    await primeSession()
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({ accessToken: 'x', expiresAt: 9, tokenType: 'Bearer' }))
    localStorage.setItem('yyc3_auth_user', JSON.stringify({ id: 'u', username: 'n' }))
    localStorage.setItem('yyc3_auth_state', 'authenticated')
    logout()
    expect(getTokens()).toBeNull()
    expect(getUser()).toBeNull()
    expect(getAuthState()).toBe('unauthenticated')
    expect(localStorage.getItem('yyc3_auth_verifier')).toBeNull()
  })
})

describe('auth-client 默认配置', () => {
  it('Platform 端点 + 本源回调', () => {
    const cfg = getDefaultAuthConfig()
    expect(cfg.clientId).toBe('yyc3-ai-pai')
    expect(cfg.authorizationEndpoint).toContain('pai-ai.yyc3.vip')
    expect(cfg.tokenEndpoint).toContain('/auth/token')
    expect(cfg.redirectUri).toBe(`${window.location.origin}/auth/callback`)
    expect(cfg.scope).toBe('read write')
  })
})
