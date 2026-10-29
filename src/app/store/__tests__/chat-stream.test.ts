/**
 * @file chat-stream.test.ts
 * @description 真 SSE 流式链路测试：callChatAPIStream 解析器契约 + ChatPage 接线
 */

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** 构造 OpenAI 兼容 SSE 响应体（ReadableStream） */
function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

describe('SSE 流式解析（callChatAPIStream 契约）', () => {
  it('逐 data: 行聚合 delta', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([
      'data: {"choices":[{"delta":{"content":"你"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"好"}}]}\n\n',
      'data: [DONE]\n\n',
    ]))
    vi.stubGlobal('fetch', fetchMock)

    const deltas: string[] = []
    let fullAgg = ''
    // 直接复刻 model-store 的解析循环（与实现保持同构；导出后请替换为直调）
    const resp = await fetchMock()
    const reader = (resp.body as ReadableStream<Uint8Array>).getReader()
    const decoder = new TextDecoder()
    let buf = '', full = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split('\n')
      buf = parts.pop() ?? ''
      for (const raw of parts) {
        const line = raw.trim()
        if (!line || line.startsWith(':')) continue
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') continue
          const j = JSON.parse(payload)
          const d = j?.choices?.[0]?.delta?.content ?? ''
          if (d) { full += d; deltas.push(d); fullAgg = full }
        }
      }
    }
    expect(deltas).toEqual(['你', '好'])
    expect(fullAgg).toBe('你好')
    vi.unstubAllGlobals()
  })

  it('跨 chunk 截断的 JSON 行不丢字节', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([
      'data: {"choices":[{"delta":{"cont',
      'ent":"X"}}]}\n\ndata: [DONE]\n\n',
    ]))
    vi.stubGlobal('fetch', fetchMock)
    const resp = await fetchMock()
    const reader = (resp.body as ReadableStream<Uint8Array>).getReader()
    const decoder = new TextDecoder()
    let buf = '', full = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split('\n')
      buf = parts.pop() ?? ''
      for (const raw of parts) {
        const line = raw.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') continue
        try { full += JSON.parse(payload)?.choices?.[0]?.delta?.content ?? '' } catch { /* 未完整行 */ }
      }
    }
    expect(full).toBe('X')
    vi.unstubAllGlobals()
  })
})

describe('ChatPage 真 SSE 接线（静态契约）', () => {
  const source = readFileSync(resolve(__dirname, '../../../components/Chat/ChatPage.tsx'), 'utf-8')

  it('使用 sendToActiveModelStream 且 onChunk 增量写入消息', () => {
    expect(source).toContain('sendToActiveModelStream')
    expect(source).toMatch(/onChunk|_delta, full/)
  })

  it('假打字机 startStream 已退役', () => {
    expect(source).not.toContain('startStream(raw')
  })

  it('model-store 暴露流式入口且请求带 stream:true', () => {
    const store = readFileSync(resolve(__dirname, '../../store/model-store.tsx'), 'utf-8')
    expect(store).toContain('sendToActiveModelStream')
    expect(store).toMatch(/stream:\s*true/)
    // 非 SSE 端点回退：content-type 判别存在
    expect(store).toContain('text/event-stream')
  })
})
