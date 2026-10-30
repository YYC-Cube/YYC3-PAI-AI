/**
 * @file mcp-client.ts
 * @description MCP（Model Context Protocol）浏览器客户端 — Streamable HTTP 传输真实现
 *
 * 协议：JSON-RPC 2.0；单端点 POST，响应为 application/json 或 text/event-stream。
 * 生命周期：initialize 握手 → notifications/initialized → tools/list / tools/call。
 * 鉴权：Bearer token 或自定义 header（由服务端签发的 manifest 指定）。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags mcp,json-rpc,execution-layer,streamable-http
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('mcp-client')

export interface MCPToolDef {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export interface MCPToolResult {
  content: Array<{ type: string; text?: string } | Record<string, unknown>>
  isError?: boolean
}

export interface MCPServerInfo {
  name?: string
  version?: string
  protocolVersion?: string
  capabilities?: Record<string, unknown>
}

interface RPCRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: Record<string, unknown>
}

interface RPCNotification {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
}

interface RPCResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

export class MCPClient {
  private nextId = 1
  private sessionHeader: string | null = null
  private serverInfo: MCPServerInfo | null = null
  private protocolVersion = '2025-06-18'

  constructor(
    private endpoint: string,
    private headers: Record<string, string> = {},
  ) {}

  /** initialize 握手（含协议版本协商与能力交换） */
  async connect(clientName = 'yyc3-ai-pai'): Promise<MCPServerInfo> {
    const res = await this.rpc('initialize', {
      protocolVersion: this.protocolVersion,
      capabilities: { tools: {} },
      clientInfo: { name: clientName, version: '1.0.0' },
    })
    const info = (res ?? {}) as MCPServerInfo
    if (info.protocolVersion) this.protocolVersion = info.protocolVersion
    this.serverInfo = info
    // 会话 id 已在 post() 内从 initialize 响应头捕获（此处不可重置——
    // 历史残留的 sessionHeader = null 会抹掉会话，被契约测试逮出）
    await this.notify('notifications/initialized')
    logger.info('MCP connected', { endpoint: this.endpoint, server: info.name, protocol: this.protocolVersion })
    return info
  }

  /** 列出工具 */
  async listTools(): Promise<MCPToolDef[]> {
    const res = await this.rpc('tools/list', {})
    const tools = (res as { tools?: MCPToolDef[] })?.tools ?? []
    return tools
  }

  /** 调用工具 */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const res = await this.rpc('tools/call', { name, arguments: args })
    return (res ?? { content: [] }) as MCPToolResult
  }

  get info(): MCPServerInfo | null { return this.serverInfo }

  /** 注入 AI systemPrompt 的工具说明文本（IDEChatPanel 消费） */
  async toolsAsPromptText(): Promise<string> {
    const tools = await this.listTools()
    if (!tools.length) return ''
    return [
      'You can use the following MCP tools. To call one, reply with JSON:',
      '{"tool": "<name>", "arguments": {...}}',
      '',
      ...tools.map((t) => `- ${t.name}: ${t.description ?? ''}`),
    ].join('\n')
  }

  // ---- 传输层 ----

  private async rpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    const body: RPCRequest = { jsonrpc: '2.0', id: this.nextId++, method, params }
    const raw = await this.post(body)
    const parsed = await this.parsePayload(raw)
    if (parsed.error) throw new Error(`MCP ${method} 错误 ${parsed.error.code}: ${parsed.error.message}`)
    return parsed.result
  }

  private async notify(method: string): Promise<void> {
    const body: RPCNotification = { jsonrpc: '2.0', method }
    await this.post(body, true)
  }

  private async post(body: RPCRequest | RPCNotification, isNotification = false): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...this.headers,
    }
    if (this.sessionHeader) headers['Mcp-Session-Id'] = this.sessionHeader

    const resp = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // 服务端在 initialize 响应中下发会话 id
    const sid = resp.headers.get('Mcp-Session-Id')
    if (sid) this.sessionHeader = sid

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`MCP HTTP ${resp.status}: ${text.slice(0, 200)}`)
    }
    if (isNotification) return resp
    return resp
  }

  /** 响应体兼容两种形态：application/json（单响应）或 SSE（data: 行流） */
  private async parsePayload(resp: Response): Promise<RPCResponse> {
    try {
      return (await resp.clone().json()) as RPCResponse
    } catch {
      const text = await resp.text()
      for (const line of text.split('\n')) {
        const l = line.trim()
        if (l.startsWith('data:')) {
          try { return JSON.parse(l.slice(5).trim()) as RPCResponse } catch { /* 跳过心跳 */ }
        }
      }
      throw new Error(`MCP 无法解析响应: ${text.slice(0, 200)}`)
    }
  }
}

/** 便捷工厂：从 MCPPanel 配置生成客户端 */
export function createMCPClient(endpoint: string, token?: string): MCPClient {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return new MCPClient(endpoint, headers)
}
