/**
 * @file csrf.test.ts
 * @description CSRF Token防护机制测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CSRFTokenManager,
  secureFetch,
  createSecureAPIClient,
  csrfTokenManager,
} from '../csrf'

describe('CSRFTokenManager', () => {
  let manager: CSRFTokenManager

  beforeEach(() => {
    manager = new CSRFTokenManager()
    localStorage.clear()
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getToken', () => {
    it('should generate a new token if none exists', () => {
      const token = manager.getToken()
      expect(token).toBeDefined()
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should return the same token on subsequent calls', () => {
      const token1 = manager.getToken()
      const token2 = manager.getToken()
      expect(token1).toBe(token2)
    })

    it('should return token from meta tag if present', () => {
      const metaToken = 'test-csrf-token-from-meta'
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', metaToken)
      document.head.appendChild(meta)

      const token = manager.getToken()
      expect(token).toBe(metaToken)
    })

    it('should return token from localStorage if no meta tag', () => {
      const storedToken = 'stored-csrf-token-12345678901234567890123456789012'
      localStorage.setItem('yyc3_csrf_token', storedToken)

      const token = manager.getToken()
      expect(token).toBe(storedToken)
    })

    it('should prioritize meta tag over localStorage', () => {
      const metaToken = 'meta-csrf-token-12345678901234567890123456789012'
      const storedToken = 'stored-csrf-token-12345678901234567890123456789012'
      
      localStorage.setItem('yyc3_csrf_token', storedToken)
      
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', metaToken)
      document.head.appendChild(meta)

      const token = manager.getToken()
      expect(token).toBe(metaToken)
    })
  })

  describe('refreshToken', () => {
    it('should generate a new token', () => {
      const oldToken = manager.getToken()
      const newToken = manager.refreshToken()
      
      expect(newToken).toBeDefined()
      expect(newToken).not.toBe(oldToken)
    })

    it('should store new token in localStorage', () => {
      const newToken = manager.refreshToken()
      const stored = localStorage.getItem('yyc3_csrf_token')
      expect(stored).toBe(newToken)
    })

    it('should update meta tag if exists', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', 'old-token')
      document.head.appendChild(meta)

      const newToken = manager.refreshToken()
      const updatedContent = meta.getAttribute('content')
      expect(updatedContent).toBe(newToken)
    })
  })

  describe('validateToken', () => {
    it('should return true for valid token', () => {
      const token = manager.getToken()
      expect(manager.validateToken(token)).toBe(true)
    })

    it('should return false for invalid token', () => {
      manager.getToken()
      expect(manager.validateToken('invalid-token')).toBe(false)
    })

    it('should return false for wrong length token', () => {
      manager.getToken()
      expect(manager.validateToken('short')).toBe(false)
    })
  })

  describe('getHeaderName', () => {
    it('should return the correct header name', () => {
      expect(manager.getHeaderName()).toBe('X-CSRF-Token')
    })
  })

  describe('createHeaders', () => {
    it('should create headers with CSRF token', () => {
      const token = manager.getToken()
      const headers = manager.createHeaders() as Headers
      
      expect(headers instanceof Headers).toBe(true)
      expect(headers.get('X-CSRF-Token')).toBe(token)
    })

    it('should preserve existing headers', () => {
      const existingHeaders = new Headers({
        'Content-Type': 'application/json',
      })
      const headers = manager.createHeaders(existingHeaders) as Headers
      
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('X-CSRF-Token')).toBeDefined()
    })
  })
})

describe('secureFetch', () => {
  const mockFetch = vi.fn()
  
  beforeEach(() => {
    localStorage.clear()
    document.head.innerHTML = ''
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers(),
      }))
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should add CSRF token to request headers', async () => {
    await secureFetch('/api/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.any(Headers),
        credentials: 'same-origin',
      })
    )

    const call = mockFetch.mock.calls[0]
    const headers = call[1].headers as Headers
    expect(headers.get('X-CSRF-Token')).toBeDefined()
  })

  it('should preserve existing headers', async () => {
    await secureFetch('/api/test', {
      headers: { 'Authorization': 'Bearer token' },
    })

    const call = mockFetch.mock.calls[0]
    const headers = call[1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token')
    expect(headers.get('X-CSRF-Token')).toBeDefined()
  })

  it('should update token from response header', async () => {
    const newToken = 'new-token-from-server-12345678901234567890123456'
    
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers({ 'X-CSRF-Token': newToken }),
      }))
    )

    await secureFetch('/api/test')

    expect(localStorage.getItem('yyc3_csrf_token')).toBe(newToken)
  })
})

describe('createSecureAPIClient', () => {
  let client: ReturnType<typeof createSecureAPIClient>
  const mockFetch = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    document.head.innerHTML = ''
    client = createSecureAPIClient('https://api.example.com')
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: new Headers(),
      }))
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('should make GET request with CSRF token', async () => {
      const result = await client.get('/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('post', () => {
    it('should make POST request with CSRF token and body', async () => {
      const result = await client.post('/users', { name: 'test' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('put', () => {
    it('should make PUT request with CSRF token and body', async () => {
      const result = await client.put('/users/1', { name: 'updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        })
      )
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('delete', () => {
    it('should make DELETE request with CSRF token', async () => {
      const result = await client.delete('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('refreshToken', () => {
    it('should refresh the CSRF token', () => {
      const newToken = client.refreshToken()
      expect(newToken).toBeDefined()
      expect(newToken.length).toBe(64)
    })
  })

  describe('getToken', () => {
    it('should return the current CSRF token', () => {
      const token = client.getToken()
      expect(token).toBeDefined()
      expect(token.length).toBe(64)
    })
  })

  describe('error handling', () => {
    it('should throw on non-OK response', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
        }))
      )

      await expect(client.get('/not-found')).rejects.toThrow('HTTP 404: Not Found')
    })
  })
})

describe('csrfTokenManager (singleton)', () => {
  it('should be an instance of CSRFTokenManager', () => {
    expect(csrfTokenManager).toBeInstanceOf(CSRFTokenManager)
  })

  it('should have all required methods', () => {
    expect(typeof csrfTokenManager.getToken).toBe('function')
    expect(typeof csrfTokenManager.refreshToken).toBe('function')
    expect(typeof csrfTokenManager.validateToken).toBe('function')
    expect(typeof csrfTokenManager.getHeaderName).toBe('function')
    expect(typeof csrfTokenManager.createHeaders).toBe('function')
  })
})
