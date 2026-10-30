/**
 * @file mcp-client.test.ts
 * @description MCP Streamable HTTP 客户端契约测试（JSON-RPC/SSE/鉴权/工具清单）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MCPClient, createMCPClient } from '../mcp-client'

/** 构造 SSE 流响应 */
function sseResponse(lines: string[], headers: Record<string, string> = {}): Response {
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(c) { lines.forEach(l => c.enqueue(enc.encode(l))); c.close() },
  })
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream', ...headers } })
}

describe('MCPClient（Streamable HTTP 真协议）', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('connect：initialize 握手 + 会话头透传 + initialized 通知', async () => {
    const calls: Array<{ body: unknown; headers: Record<string, string> }> = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      calls.push({ body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> })
      return sseResponse(
        ['data: {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","serverInfo":{"name":"srv","version":"1"}}}\n\n'],
        { 'Mcp-Session-Id': 'sess-42' },
      )
    }))

    const c = new MCPClient('https://mcp.example/mcp')
    const info = await c.connect()

    expect((info.serverInfo as { name?: string }).name).toBe('srv')
    expect(info.protocolVersion).toBe('2025-06-18')
    // 两次请求：initialize + notifications/initialized
    expect(calls).toHaveLength(2)
    expect((calls[0].body as { method: string }).method).toBe('initialize')
    expect((calls[1].body as { method: string }).method).toBe('notifications/initialized')
    // 会话头从第二次起携带
    expect(calls[1].headers['Mcp-Session-Id']).toBe('sess-42')
  })

  it('listTools：解析 tools 数组', async () => {
    let id = 0
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse(
      [`data: {"jsonrpc":"2.0","id":${++id},"result":{"tools":[{"name":"fetch","description":"HTTP fetch","inputSchema":{}}]}}\n\n`],
    )))
    const c = new MCPClient('https://mcp.example/mcp')
    await c.connect()
    const tools = await c.listTools()
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('fetch')
  })

  it('callTool：透传 name/arguments 并返回 content', async () => {
    let captured: unknown
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      captured = JSON.parse(String(init.body))
      return sseResponse(['data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"ok"}]}}\n\n'])
    }))
    const c = new MCPClient('https://mcp.example/mcp')
    await c.connect()
    const r = await c.callTool('fetch', { url: 'https://x' })
    expect((captured as { params: { name: string } }).params.name).toBe('fetch')
    expect(r.content[0]).toMatchObject({ type: 'text', text: 'ok' })
  })

  it('JSON 响应（非 SSE）同样可解析', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [{ name: 't1' }] } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )))
    const c = new MCPClient('https://mcp.example/mcp')
    await c.connect()
    expect((await c.listTools())[0].name).toBe('t1')
  })

  it('RPC 错误：抛出含 code/message 的可读错误', async () => {
    let call = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      call += 1
      // 首个调用（initialize）成功，后续（tools/list）返回错误
      const body = call === 1
        ? { jsonrpc: '2.0', id: call, result: { protocolVersion: '2025-06-18' } }
        : { jsonrpc: '2.0', id: call, error: { code: -32601, message: 'method not found' } }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    const c = new MCPClient('https://mcp.example/mcp')
    await c.connect()
    await expect(c.listTools()).rejects.toThrow('-32601')
  })

  it('HTTP 非 2xx：抛出状态码', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })))
    const c = new MCPClient('https://mcp.example/mcp')
    await expect(c.connect()).rejects.toThrow('503')
  })

  it('toolsAsPromptText：生成含调用约定的注入文本', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [{ name: 'fs_read', description: 'read file' }] } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )))
    const c = new MCPClient('https://mcp.example/mcp')
    await c.connect()
    const text = await c.toolsAsPromptText()
    expect(text).toContain('"tool"')
    expect(text).toContain('fs_read')
    expect(text).toContain('read file')
  })

  it('createMCPClient：token 注入 Bearer 头', async () => {
    let auth = ''
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      auth = (init.headers as Record<string, string>).Authorization
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }),
        { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    const c = createMCPClient('https://mcp.example/mcp', 'tok-1')
    await c.connect()
    expect(auth).toBe('Bearer tok-1')
  })
})
