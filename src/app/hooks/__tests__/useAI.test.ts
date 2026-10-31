/**
 * @file useAI.test.ts
 * @description useAI hook 测试 — 配置加载/门面剥离/保存 + SSE 流解析 + 错误路径
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAI } from '../useAI'

const STORAGE_KEY = 'yyc3_ai_config'

const sseResponse = (chunks: string[]) => ({
  ok: true,
  statusText: 'OK',
  body: new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(new TextEncoder().encode(ch))
      c.close()
    },
  }),
})

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAI 配置管理', () => {
  it('无存储时使用默认配置且 loading 落定 false', async () => {
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.config.provider).toBe('ollama')
    expect(result.current.config.model).toBe('llama3')
  })

  it('有存储时合并配置，apiKey 剥离出配置体（门面改道）', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      provider: 'zhipu', model: 'glm-4.6', apiKey: 'sk-legacy-secret', temperature: 0.5,
    }))
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.config.provider).toBe('zhipu'))
    expect(result.current.config.model).toBe('glm-4.6')
    // 配置体内不再持有明文 key（已剥离进门面）
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(persisted.apiKey).toBeUndefined()
    // hook state 仍持有 key 供请求使用
    expect(result.current.config.apiKey).toBe('sk-legacy-secret')
  })

  it('saveConfig 持久化且 apiKey 不落配置体', async () => {
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => {
      result.current.saveConfig({
        provider: 'openai', apiKey: 'sk-new-key', baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o', temperature: 0.2, version: 1,
      })
    })
    expect(result.current.config.model).toBe('gpt-4o')
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(persisted.model).toBe('gpt-4o')
    expect(persisted.apiKey).toBeUndefined()
  })
})

describe('useAI chat（SSE 流式）', () => {
  it('解析 SSE data 行，拼接 delta.content，[DONE]/坏 JSON/空 delta 安全跳过', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(sseResponse([
      'data: {"choices":[{"delta":{"content":"He"}}]}\n',
      'data: {"choices":[{"delta":{"content":"llo"}}]}\n',
      'data: {"choices":[{"delta":{}}]}\n',       // 空 content → 忽略
      'data: {bad json}\n',                        // 坏 JSON → 忽略
      'data: [DONE]\n',
    ]))))
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const received: string[] = []
    await act(async () => {
      await result.current.chat(
        [{ role: 'user', content: 'hi' }],
        (chunk) => received.push(chunk),
      )
    })
    expect(received.join('')).toBe('Hello')
    expect(result.current.isStreaming).toBe(false)
    const fetchMock = vi.mocked(globalThis.fetch)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/chat/completions')
    expect((init as RequestInit).method).toBe('POST')
  })

  it('response.ok=false → [ERROR] 消息含状态信息', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, statusText: 'Internal Server Error' })))
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const received: string[] = []
    await act(async () => {
      await result.current.chat([{ role: 'user', content: 'hi' }], c => received.push(c))
    })
    expect(received.join('')).toContain('[ERROR] 请求失败')
    expect(received.join('')).toContain('Internal Server Error')
  })

  it('response.body 缺失 → [ERROR] No response body', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, statusText: 'OK', body: null })))
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const received: string[] = []
    await act(async () => {
      await result.current.chat([{ role: 'user', content: 'hi' }], c => received.push(c))
    })
    expect(received.join('')).toContain('No response body')
  })

  it('fetch 网络异常 → [ERROR] 提示含 Ollama 排查指引', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('connection refused'))))
    const { result } = renderHook(() => useAI())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const received: string[] = []
    await act(async () => {
      await result.current.chat([{ role: 'user', content: 'hi' }], c => received.push(c))
    })
    expect(received.join('')).toContain('connection refused')
    expect(received.join('')).toContain('ollama serve')
  })
})
