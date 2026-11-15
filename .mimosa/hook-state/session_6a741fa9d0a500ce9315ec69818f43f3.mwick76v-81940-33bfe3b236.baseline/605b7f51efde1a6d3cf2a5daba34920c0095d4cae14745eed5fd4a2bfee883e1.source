/**
 * @file local-model-client.test.ts
 * @description 本地模型统一调用层测试 — 对话/流式/嵌入/重排序/视觉（mock model-router + fetch）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { RouteResult } from '../model-router'

const { mockRouteTask } = vi.hoisted(() => ({ mockRouteTask: vi.fn() }))

vi.mock('../model-router', () => ({ routeTask: mockRouteTask }))

import {
  buildMessages,
  quickChat,
  chat,
  chatStream,
  embed,
  rerank,
  vision,
} from '../local-model-client'
import { routeTask } from '../model-router'

const fetchMock = vi.fn()

const ROUTE: RouteResult = {
  endpoint: 'http://localhost:11434/v1/chat/completions',
  modelName: 'qwen3.6-27b',
  nodeId: 'mac-local',
  capabilities: ['chat', 'reasoning'],
}

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

const chatResponse = (content: string): Response =>
  jsonResponse({ choices: [{ message: { content } }], usage: { total_tokens: 64 } })

/** 构造带可观察 reader 的流式响应桩 */
function streamResponse(sseText: string): { resp: Response; reader: { releaseLock: ReturnType<typeof vi.fn> } } {
  const enc = new TextEncoder()
  const reader = {
    read: vi.fn()
      .mockResolvedValueOnce({ done: false, value: enc.encode(sseText) })
      .mockResolvedValueOnce({ done: true }),
    releaseLock: vi.fn(),
  }
  const resp = { ok: true, body: { getReader: () => reader } } as unknown as Response
  return { resp, reader }
}

/** 取第 n 次 fetch 调用的请求体 */
const bodyOf = (n: number): Record<string, unknown> =>
  JSON.parse(String(fetchMock.mock.calls[n][1].body))

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  mockRouteTask.mockResolvedValue(ROUTE)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('local-model-client 消息构建', () => {
  it('buildMessages：无系统提示时仅含 user 消息', () => {
    expect(buildMessages('你好')).toEqual([{ role: 'user', content: '你好' }])
  })

  it('buildMessages：有系统提示时 system 在前、user 在后', () => {
    const msgs = buildMessages('你好', '你是助手')
    expect(msgs).toEqual([
      { role: 'system', content: '你是助手' },
      { role: 'user', content: '你好' },
    ])
  })

  it('quickChat：组合构建消息并返回对话内容，系统提示进入请求体', async () => {
    fetchMock.mockResolvedValue(chatResponse('回答内容'))
    const out = await quickChat('问题', 'chat', '你是助手')
    expect(out).toBe('回答内容')
    expect(bodyOf(0).messages).toEqual([
      { role: 'system', content: '你是助手' },
      { role: 'user', content: '问题' },
    ])
  })
})

describe('local-model-client 对话（非流式）', () => {
  it('chat：默认参数请求体与完整结果字段', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      choices: [{ message: { content: '你好，世界' } }],
      usage: { total_tokens: 128 },
    }))
    const r = await chat([{ role: 'user', content: 'hi' }])
    expect(r).toMatchObject({
      content: '你好，世界',
      modelName: 'qwen3.6-27b',
      nodeId: 'mac-local',
      tokensUsed: 128,
    })
    expect(r.latencyMs).toBeGreaterThanOrEqual(0)
    expect(fetchMock.mock.calls[0][0]).toBe(ROUTE.endpoint)
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' })
    expect(bodyOf(0)).toMatchObject({
      model: 'qwen3.6-27b',
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    })
  })

  it('chat：options 覆盖 temperature/maxTokens', async () => {
    fetchMock.mockResolvedValue(chatResponse('ok'))
    await chat([{ role: 'user', content: 'x' }], 'chat', { temperature: 0.2, maxTokens: 64 })
    expect(bodyOf(0)).toMatchObject({ temperature: 0.2, max_tokens: 64 })
  })

  it('chat：无可用路由抛出包含任务类型的错误', async () => {
    mockRouteTask.mockResolvedValue(null)
    await expect(chat([{ role: 'user', content: 'x' }], 'writing')).rejects.toThrow(
      '没有可用的本地模型处理任务: writing',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('chat：HTTP 错误状态抛错，错误文本截断至 200 字符', async () => {
    fetchMock.mockResolvedValue(new Response('x'.repeat(300), { status: 500 }))
    const err = (await chat([{ role: 'user', content: 'x' }]).catch(e => e)) as Error
    expect(err.message).toContain('[500]')
    expect(err.message).toContain('x'.repeat(200))
    expect(err.message).not.toContain('x'.repeat(201))
  })

  it('chat：响应缺 choices/usage 时 content 为空串且 tokensUsed 为 undefined', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))
    const r = await chat([{ role: 'user', content: 'x' }])
    expect(r.content).toBe('')
    expect(r.tokensUsed).toBeUndefined()
  })
})

describe('local-model-client 流式对话', () => {
  const SSE =
    'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n' +
    'data: {"choices":[{"delta":{"content":"，世界"}}]}\n' +
    'event: ping\n' +
    'data: {"choices":[{"delta":{}}]}\n' +
    'data: [DONE]\n' +
    'data: {坏 JSON\n\n'

  it('chatStream：解析 SSE 增量，跳过非 data 行/[DONE]/坏 JSON/空增量', async () => {
    const { resp } = streamResponse(SSE)
    fetchMock.mockResolvedValue(resp)
    const { stream, route } = await chatStream([{ role: 'user', content: 'hi' }])
    expect(route).toEqual(ROUTE)
    const out: string[] = []
    for await (const chunk of stream) out.push(chunk)
    expect(out.join('')).toBe('Hello，世界')
  })

  it('chatStream：请求体 stream 为 true，读完释放 reader 锁', async () => {
    const { resp, reader } = streamResponse(SSE)
    fetchMock.mockResolvedValue(resp)
    const { stream } = await chatStream([{ role: 'user', content: 'hi' }])
    for await (const _ of stream) { /* 消费完毕 */ }
    expect(bodyOf(0)).toMatchObject({ model: 'qwen3.6-27b', stream: true })
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    expect(reader.releaseLock).toHaveBeenCalledTimes(1)
  })

  it('chatStream：无路由抛错；响应体不可读抛错', async () => {
    mockRouteTask.mockResolvedValue(null)
    await expect(chatStream([{ role: 'user', content: 'x' }])).rejects.toThrow(
      '没有可用的本地模型处理任务: chat',
    )
    mockRouteTask.mockResolvedValue(ROUTE)
    fetchMock.mockResolvedValue({ ok: true, body: undefined } as unknown as Response)
    await expect(chatStream([{ role: 'user', content: 'x' }])).rejects.toThrow('响应体不可读')
  })
})

describe('local-model-client 嵌入', () => {
  it('embed：请求专用 /embeddings 端点并解析向量', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ embedding: [0.1, 0.2, 0.3] }] }))
    const r = await embed('目标文本')
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:11434/v1/embeddings')
    expect(bodyOf(0)).toEqual({ model: 'qwen3.6-27b', input: '目标文本' })
    expect(r.embedding).toEqual([0.1, 0.2, 0.3])
    expect(r.modelName).toBe('qwen3.6-27b')
    expect(r.nodeId).toBe('mac-local')
    expect(r.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('embed：专用端点失败回退 chat/completions，解析回退文本中的向量（空向量 bug 已修）', async () => {
    fetchMock.mockImplementation(async (input: unknown) => {
      if (String(input).endsWith('/embeddings')) return new Response('no embeddings', { status: 503 })
      return chatResponse('[0.1, 0.25, -0.5]')
    })
    const r = await embed('回退文本')
    // 22号修复后：回退成功返回解析出的真实向量（旧缺陷：恒空数组却报成功）
    expect(r.embedding).toEqual([0.1, 0.25, -0.5])
    expect(r.modelName).toBe('qwen3.6-27b')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toBe(ROUTE.endpoint)
    const body = bodyOf(1)
    expect(body.max_tokens).toBe(256)
    expect(body.messages).toEqual([{ role: 'user', content: '嵌入以下文本: 回退文本' }])
  })

  it('embed：双端点失败抛错；无路由抛错', async () => {
    fetchMock.mockResolvedValue(new Response('down', { status: 503 }))
    await expect(embed('x')).rejects.toThrow('嵌入请求失败')
    mockRouteTask.mockResolvedValue(null)
    await expect(embed('x')).rejects.toThrow('没有可用的本地嵌入模型')
  })
})

describe('local-model-client 重排序', () => {
  it('rerank：请求专用 /rerank 端点并解析相关性分数', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      results: [{ relevance_score: 0.9 }, { relevance_score: 0.25 }],
    }))
    const r = await rerank('查询', ['文档A', '文档B'])
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:11434/v1/rerank')
    expect(bodyOf(0)).toEqual({ model: 'qwen3.6-27b', query: '查询', documents: ['文档A', '文档B'] })
    expect(r.scores).toEqual([0.9, 0.25])
    expect(r.modelName).toBe('qwen3.6-27b')
    expect(r.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('rerank：专用端点失败回退逐条对话评分（clamp 到 0-1，非法数字记 0.5）', async () => {
    const replies = ['0.8', '1.7', 'not-a-number']
    let i = 0
    fetchMock.mockImplementation(async (input: unknown) => {
      if (String(input).endsWith('/rerank')) return new Response('no rerank', { status: 503 })
      return chatResponse(replies[i++] ?? '0.5')
    })
    const r = await rerank('查询', ['甲', '乙', '丙'])
    expect(r.scores).toEqual([0.8, 1, 0.5])
    // 1 次 rerank 路由 + 3 次回退 chat 路由
    expect(vi.mocked(routeTask)).toHaveBeenCalledTimes(4)
  })
})

describe('local-model-client 视觉理解', () => {
  it('vision：构建 image_url 多模态消息（默认提示词）并返回描述', async () => {
    fetchMock.mockResolvedValue(chatResponse('一张猫的图片'))
    const r = await vision('http://img.example/cat.png')
    expect(fetchMock.mock.calls[0][0]).toBe(ROUTE.endpoint)
    const body = bodyOf(0)
    expect(body.max_tokens).toBe(1024)
    expect(body.messages).toEqual([{
      role: 'user',
      content: [
        { type: 'text', text: '请描述这张图片的内容' },
        { type: 'image_url', image_url: { url: 'http://img.example/cat.png' } },
      ],
    }])
    expect(r.description).toBe('一张猫的图片')
    expect(r.modelName).toBe('qwen3.6-27b')
    expect(r.nodeId).toBe('mac-local')
  })

  it('vision：自定义提示词透传；无路由抛错', async () => {
    fetchMock.mockResolvedValue(chatResponse('desc'))
    await vision('http://img', '图中有什么')
    const msgs = bodyOf(0).messages as Array<{ content: Array<{ type: string; text?: string }> }>
    expect(msgs[0].content[0].text).toBe('图中有什么')
    mockRouteTask.mockResolvedValue(null)
    await expect(vision('http://img')).rejects.toThrow('没有可用的本地视觉模型')
  })
})
