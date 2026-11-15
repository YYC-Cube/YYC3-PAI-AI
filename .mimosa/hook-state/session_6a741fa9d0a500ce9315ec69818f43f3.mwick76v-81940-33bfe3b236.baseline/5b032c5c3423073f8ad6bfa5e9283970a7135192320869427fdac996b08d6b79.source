/**
 * @file csrf.ts
 * @description CSRF Token防护机制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,csrf,protection
 */

/**
 * CSRF Token管理器
 */
export class CSRFTokenManager {
  private static readonly TOKEN_KEY = 'yyc3_csrf_token'
  private static readonly META_NAME = 'csrf-token'
  static readonly HEADER_NAME = 'X-CSRF-Token'
  private static readonly TOKEN_LENGTH = 32

  /**
   * 生成随机CSRF Token
   */
  private generateToken(): string {
    const array = new Uint8Array(CSRFTokenManager.TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 获取CSRF Token
   * 优先级: meta标签 > localStorage > 生成新token
   */
  getToken(): string {
    // 1. 尝试从meta标签获取（服务端渲染场景）
    const metaToken = document.querySelector(`meta[name="${CSRFTokenManager.META_NAME}"]`)?.getAttribute('content')
    if (metaToken) {
      return metaToken
    }

    // 2. 尝试从localStorage获取
    const storedToken = localStorage.getItem(CSRFTokenManager.TOKEN_KEY)
    if (storedToken) {
      return storedToken
    }

    // 3. 生成新token并存储
    const newToken = this.generateToken()
    localStorage.setItem(CSRFTokenManager.TOKEN_KEY, newToken)
    return newToken
  }

  /**
   * 刷新CSRF Token
   */
  refreshToken(): string {
    const newToken = this.generateToken()
    localStorage.setItem(CSRFTokenManager.TOKEN_KEY, newToken)
    
    // 更新meta标签（如果存在）
    const meta = document.querySelector(`meta[name="${CSRFTokenManager.META_NAME}"]`)
    if (meta) {
      meta.setAttribute('content', newToken)
    }
    
    return newToken
  }

  /**
   * 验证CSRF Token
   */
  validateToken(token: string): boolean {
    const expectedToken = this.getToken()
    return token === expectedToken && token.length === CSRFTokenManager.TOKEN_LENGTH * 2
  }

  /**
   * 获取请求头名称
   */
  getHeaderName(): string {
    return CSRFTokenManager.HEADER_NAME
  }

  /**
   * 创建带CSRF Token的请求头
   */
  createHeaders(existingHeaders?: HeadersInit): HeadersInit {
    const headers = new Headers(existingHeaders)
    headers.set(CSRFTokenManager.HEADER_NAME, this.getToken())
    return headers
  }
}

/**
 * 安全的fetch包装器
 * 自动添加CSRF Token到请求头
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfManager = new CSRFTokenManager()
  
  // 创建新的headers对象
  const headers = new Headers(options.headers)
  headers.set(CSRFTokenManager.HEADER_NAME, csrfManager.getToken())
  
  // 添加其他安全相关的headers
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  
  // 执行请求
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // 确保发送cookies
  })
  
  // 检查响应中的新CSRF Token（服务端可能会轮换token）
  const newToken = response.headers.get(CSRFTokenManager.HEADER_NAME)
  if (newToken) {
    localStorage.setItem('yyc3_csrf_token', newToken)
  }
  
  return response
}

/**
 * 创建安全的API客户端
 */
export function createSecureAPIClient(baseURL: string) {
  const csrfManager = new CSRFTokenManager()
  
  return {
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
      const response = await secureFetch(`${baseURL}${endpoint}`, {
        ...options,
        method: 'GET',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    
    async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
      const response = await secureFetch(`${baseURL}${endpoint}`, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    
    async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
      const response = await secureFetch(`${baseURL}${endpoint}`, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    
    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
      const response = await secureFetch(`${baseURL}${endpoint}`, {
        ...options,
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    
    refreshToken(): string {
      return csrfManager.refreshToken()
    },
    
    getToken(): string {
      return csrfManager.getToken()
    },
  }
}

/**
 * React Hook: 使用CSRF Token
 */
export function useCSRFToken() {
  const csrfManager = new CSRFTokenManager()
  
  return {
    getToken: () => csrfManager.getToken(),
    refreshToken: () => csrfManager.refreshToken(),
    validateToken: (token: string) => csrfManager.validateToken(token),
    createHeaders: (headers?: HeadersInit) => csrfManager.createHeaders(headers),
    secureFetch,
  }
}

/**
 * 导出单例实例
 */
export const csrfTokenManager = new CSRFTokenManager()
