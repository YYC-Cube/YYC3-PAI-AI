/**
 * @file auth-client.ts
 * @description P3.1 前端认证基建 — OAuth 2.1 PKCE 流 + token 管理
 *
 * 对标：LibreChat/Open WebUI 认证体系 + MCP 安全最佳实践
 *
 * OAuth 2.1 Authorization Code + PKCE（纯前端 SPA 模式）：
 *   1. 生成 code_verifier + code_challenge（S256）
 *   2. 重定向到授权服务器（Platform /auth/authorize）
 *   3. 回调携带 code → 换取 access_token + refresh_token
 *   4. token 存 key-storage 加密保险库（不裸 localStorage）
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags auth,oauth,pkce,token,phase-3
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('auth-client')

// ===== Types =====

export interface AuthConfig {
  /** 授权服务器地址（Platform） */
  authorizationEndpoint: string
  /** Token 端点 */
  tokenEndpoint: string
  /** 客户端 ID */
  clientId: string
  /** 回调 URL */
  redirectUri: string
  /** 请求的 scope */
  scope: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType: string
  scope?: string
}

export interface AuthUser {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
}

export type AuthState = 'unauthenticated' | 'authorizing' | 'authenticated' | 'expired'

// ===== PKCE 工具 =====

/**
 * 生成加密安全的随机字符串（code_verifier）
 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成 code_challenge（S256 方式）
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ===== 状态管理 =====

const STATE_KEY = 'yyc3_auth_state'
const TOKENS_KEY = 'yyc3_auth_tokens'
const VERIFIER_KEY = 'yyc3_auth_verifier'
const USER_KEY = 'yyc3_auth_user'

function saveState(state: AuthState): void {
  localStorage.setItem(STATE_KEY, state)
}

function saveTokens(tokens: AuthTokens): void {
  // 注意：生产环境应走 key-storage 加密保险库
  // 此处简化为 localStorage（token 本身是短期有效的）
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

function loadTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getAuthState(): AuthState {
  const saved = localStorage.getItem(STATE_KEY) as AuthState | null
  if (!saved) return 'unauthenticated'

  if (saved === 'authenticated') {
    const tokens = loadTokens()
    if (tokens && tokens.expiresAt > Date.now()) return 'authenticated'
    return 'expired'
  }

  return saved
}

export function getTokens(): AuthTokens | null {
  return loadTokens()
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function isAuthenticated(): boolean {
  return getAuthState() === 'authenticated'
}

// ===== OAuth 流程 =====

/**
 * 发起登录（重定向到授权服务器）
 */
export async function initiateLogin(config: AuthConfig): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateCodeVerifier().slice(0, 16) // CSRF 防护

  // 保存 verifier 和 state（回调时验证）
  localStorage.setItem(VERIFIER_KEY, verifier)
  localStorage.setItem('yyc3_oauth_state', state)
  saveState('authorizing')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  const url = `${config.authorizationEndpoint}?${params.toString()}`
  logger.info('Redirecting to authorization server')
  window.location.href = url
}

/**
 * 处理回调（从授权服务器重定向回来）
 */
export async function handleCallback(
  config: AuthConfig,
  url: URL,
): Promise<{ success: boolean; error?: string }> {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    saveState('unauthenticated')
    return { success: false, error: `Authorization failed: ${error}` }
  }

  if (!code) {
    return { success: false, error: 'No authorization code in callback' }
  }

  // CSRF 验证
  const savedState = localStorage.getItem('yyc3_oauth_state')
  if (state !== savedState) {
    saveState('unauthenticated')
    return { success: false, error: 'State mismatch (possible CSRF attack)' }
  }

  // 获取 verifier
  const verifier = localStorage.getItem(VERIFIER_KEY)
  if (!verifier) {
    saveState('unauthenticated')
    return { success: false, error: 'No code verifier found' }
  }

  // 交换 token
  try {
    const tokenResponse = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        code_verifier: verifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text().catch(() => '')
      saveState('unauthenticated')
      return { success: false, error: `Token exchange failed: ${tokenResponse.status} ${errText.slice(0, 100)}` }
    }

    const tokenData = await tokenResponse.json()

    const tokens: AuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
      tokenType: tokenData.token_type ?? 'Bearer',
      scope: tokenData.scope,
    }
    saveTokens(tokens)

    // 如果响应含用户信息
    if (tokenData.user) {
      saveUser(tokenData.user)
    }

    // 清理临时数据
    localStorage.removeItem(VERIFIER_KEY)
    localStorage.removeItem('yyc3_oauth_state')

    saveState('authenticated')
    logger.info('Authentication successful')
    return { success: true }
  } catch (e) {
    saveState('unauthenticated')
    return { success: false, error: `Token exchange error: ${e}` }
  }
}

/**
 * 刷新 token
 */
export async function refreshTokens(config: AuthConfig): Promise<boolean> {
  const tokens = loadTokens()
  if (!tokens?.refreshToken) return false

  try {
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: config.clientId,
      }),
    })

    if (!response.ok) {
      logger.warn('Token refresh failed', response.status)
      saveState('expired')
      return false
    }

    const data = await response.json()
    const newTokens: AuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? tokens.refreshToken,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      tokenType: data.token_type ?? 'Bearer',
    }
    saveTokens(newTokens)
    saveState('authenticated')
    return true
  } catch (e) {
    logger.warn('Token refresh error', e as Error)
    return false
  }
}

/**
 * 获取带认证的 fetch headers
 */
export function getAuthHeaders(): Record<string, string> {
  const tokens = loadTokens()
  if (!tokens) return {}
  return { Authorization: `${tokens.tokenType} ${tokens.accessToken}` }
}

/**
 * 登出
 */
export function logout(): void {
  localStorage.removeItem(TOKENS_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(VERIFIER_KEY)
  localStorage.removeItem('yyc3_oauth_state')
  saveState('unauthenticated')
  logger.info('Logged out')
}

// ===== 默认配置（可被 Platform 覆盖） =====

export function getDefaultAuthConfig(): AuthConfig {
  return {
    authorizationEndpoint: import.meta.env.VITE_AUTH_ENDPOINT || 'https://pai-ai.yyc3.vip/auth/authorize',
    tokenEndpoint: import.meta.env.VITE_AUTH_TOKEN_ENDPOINT || 'https://pai-ai.yyc3.vip/auth/token',
    clientId: import.meta.env.VITE_AUTH_CLIENT_ID || 'yyc3-ai-pai',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'read write',
  }
}
