/**
 * @file agent-loop.ts
 * @description MCP 工具调用闭环引擎 — AI 回复中的 tool_call JSON 解析 → 真实执行 → 结果回传 → AI 继续
 *
 * 对标：Cline 的 Plan/Act + 人机审批环（Phase 1.1）
 *
 * 循环模型：
 *   1. 用户消息 → sendToActiveModelStream（含 MCP 工具清单 systemPrompt）
 *   2. AI 回复含 {"tool": "<name>", "arguments": {...}} → 解析
 *   3. 人机审批（可选）→ mcpClient.callTool(name, args)
 *   4. 结果作为 tool_result 追加 history → 再次调用 AI
 *   5. 循环直到纯文本回复或达 maxIterations
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags mcp,agent,tool-call,loop,phase-1
 */

import { createMCPClient, type MCPClient } from './mcp-client'
import { createLogger } from '../utils/logger'

const logger = createLogger('agent-loop')

// ===== Types =====

export interface ToolCallRequest {
  tool: string
  arguments: Record<string, unknown>
}

export interface ToolCallResult {
  tool: string
  args: Record<string, unknown>
  result: string
  isError: boolean
  approved: boolean
  durationMs: number
}

export interface AgentLoopEvent {
  type: 'user_message' | 'ai_response' | 'tool_call' | 'tool_result' | 'done' | 'error' | 'approval_request'
  content?: string
  toolCall?: ToolCallRequest
  toolResult?: ToolCallResult
  timestamp: number
}

export interface AgentLoopOptions {
  /** MCP 服务器配置（endpoint + token） */
  mcpServers: Array<{ name: string; endpoint: string; token?: string }>
  /** 最大循环深度（安全限制，默认 5） */
  maxIterations?: number
  /** 人机审批回调：返回 true 允许执行，false 拒绝 */
  approvalCallback?: (toolCall: ToolCallRequest) => Promise<boolean>
  /** 事件回调（实时 UI 更新） */
  onEvent?: (event: AgentLoopEvent) => void
  /** 流式 onChunk（透传给 sendToActiveModelStream） */
  onChunk?: (delta: string, full: string) => void
}

export interface AgentLoopResult {
  finalResponse: string
  toolCalls: ToolCallResult[]
  iterations: number
  events: AgentLoopEvent[]
}

// ===== Tool Call JSON 解析 =====

/**
 * 从 AI 回复文本中提取 tool_call JSON。
 * 支持两种格式：
 *   1. 纯 JSON：{"tool": "name", "arguments": {...}}
 *   2. Markdown 代码块内嵌：```json\n{"tool": ...}\n```
 */
export function parseToolCall(text: string): ToolCallRequest | null {
  // 格式 0：全文是合法 JSON（最严格也最可靠）
  try {
    const trimmed = text.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed.tool === 'string' && parsed.tool) {
        return { tool: parsed.tool, arguments: parsed.arguments || {} }
      }
    }
  } catch { /* not whole-JSON */ }

  // 格式 1：嵌入在文本中的 JSON 对象（含 "tool" 字段）
  // 非贪婪匹配最外层 {} 且内含 "tool"
  const jsonMatch = text.match(/\{[^{}]*"tool"\s*:\s*"[^"]+"[\s\S]*?\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (typeof parsed.tool === 'string' && parsed.tool) {
        return { tool: parsed.tool, arguments: parsed.arguments || {} }
      }
    } catch { /* fallthrough */ }
  }

  // 格式 2：Markdown 代码块
  const codeBlock = text.match(/```(?:json)?\s*\n(\{[\s\S]*?"tool"[\s\S]*?\})\s*\n```/)
  if (codeBlock) {
    try {
      const parsed = JSON.parse(codeBlock[1])
      if (parsed.tool) {
        return { tool: parsed.tool, arguments: parsed.arguments || {} }
      }
    } catch { /* fallthrough */ }
  }

  return null
}

/** 判断 AI 回复是否为纯文本（无 tool_call） */
export function isFinalResponse(text: string): boolean {
  return parseToolCall(text) === null
}

// ===== MCP 服务器连接管理 =====

const activeClients = new Map<string, MCPClient>()

async function getMCPClient(serverName: string, servers: AgentLoopOptions['mcpServers']): Promise<MCPClient | null> {
  const config = servers.find(s => s.name === serverName)
  if (!config) return null

  // 缓存已连接的客户端
  const cacheKey = `${serverName}:${config.endpoint}`
  const cached = activeClients.get(cacheKey)
  if (cached) return cached

  const client = createMCPClient(config.endpoint, config.token)
  try {
    await client.connect()
    activeClients.set(cacheKey, client)
    return client
  } catch (e) {
    logger.warn(`MCP server ${serverName} connection failed`, e as Error)
    return null
  }
}

// ===== Agent 主循环 =====

/**
 * Agent 循环：AI 对话 + MCP 工具调用闭环
 *
 * @param message 用户消息
 * @param sendFn AI 调用函数（通常是 sendToActiveModelStream）
 * @param options Agent 循环配置
 * @returns 最终 AI 回复 + 所有工具调用记录
 */
export async function runAgentLoop(
  message: string,
  sendFn: (msg: string, opts?: { systemPrompt?: string; history?: Array<{ role: string; content: string }> }, onChunk?: (d: string, full: string) => void) => Promise<string>,
  options: AgentLoopOptions,
): Promise<AgentLoopResult> {
  const maxIter = options.maxIterations ?? 5
  const events: AgentLoopEvent[] = []
  const toolCalls: ToolCallResult[] = []
  const history: Array<{ role: string; content: string }> = []

  const emit = (event: AgentLoopEvent) => {
    events.push(event)
    options.onEvent?.(event)
  }

  emit({ type: 'user_message', content: message, timestamp: Date.now() })

  // 获取可用工具清单（构建 systemPrompt）
  let toolsPrompt = ''
  for (const server of options.mcpServers) {
    const client = await getMCPClient(server.name, options.mcpServers)
    if (!client) continue
    try {
      const text = await client.toolsAsPromptText()
      if (text) toolsPrompt += `\n\n# MCP server: ${server.name}\n${text}`
    } catch { /* skip server */ }
  }

  const systemPrompt = toolsPrompt
    ? `You are YYC³ AI Code Assistant. You have access to MCP tools. To call a tool, respond with EXACTLY this JSON format (no markdown fences):\n{"tool": "<tool_name>", "arguments": {...}}\n\nAfter receiving the tool result, continue your response. If you have enough information, respond with plain text only.${toolsPrompt}`
    : undefined

  let currentMessage = message
  let iteration = 0

  while (iteration < maxIter) {
    iteration++

    try {
      // 调用 AI
      const response = await sendFn(currentMessage, {
        systemPrompt,
        history: iteration > 1 ? history : undefined,
      }, options.onChunk)

      // 检查是否含 tool_call
      const toolCall = parseToolCall(response)

      if (!toolCall) {
        // 纯文本回复 → 完成
        emit({ type: 'ai_response', content: response, timestamp: Date.now() })
        emit({ type: 'done', timestamp: Date.now() })
        return { finalResponse: response, toolCalls, iterations: iteration, events }
      }

      // AI 想调用工具
      emit({ type: 'ai_response', content: response, timestamp: Date.now() })
      emit({ type: 'tool_call', toolCall, timestamp: Date.now() })

      // 人机审批
      let approved = true
      if (options.approvalCallback) {
        emit({ type: 'approval_request', toolCall, timestamp: Date.now() })
        approved = await options.approvalCallback(toolCall)
      }

      if (!approved) {
        // 用户拒绝 → 告知 AI 工具被拒绝
        const rejectResult: ToolCallResult = {
          tool: toolCall.tool,
          args: toolCall.arguments,
          result: 'User rejected this tool call.',
          isError: false,
          approved: false,
          durationMs: 0,
        }
        toolCalls.push(rejectResult)
        history.push({ role: 'assistant', content: response })
        history.push({ role: 'user', content: `Tool "${toolCall.tool}" was rejected by user. Please respond with plain text.` })
        currentMessage = `Tool "${toolCall.tool}" was rejected. Please provide a direct answer.`
        continue
      }

      // 执行工具调用
      const startTime = performance.now()
      let resultText = ''
      let isError = false

      try {
        // 找到拥有此工具的服务器并调用
        let executed = false
        for (const server of options.mcpServers) {
          const client = await getMCPClient(server.name, options.mcpServers)
          if (!client) continue
          const tools = await client.listTools()
          if (tools.some(t => t.name === toolCall.tool)) {
            const result = await client.callTool(toolCall.tool, toolCall.arguments)
            resultText = result.content
              .map(c => ('text' in c ? c.text : JSON.stringify(c)))
              .join('\n')
            isError = result.isError ?? false
            executed = true
            break
          }
        }
        if (!executed) {
          resultText = `Tool "${toolCall.tool}" not found in any connected MCP server.`
          isError = true
        }
      } catch (e) {
        resultText = `Tool execution error: ${e instanceof Error ? e.message : String(e)}`
        isError = true
      }

      const duration = Math.round(performance.now() - startTime)
      const tcResult: ToolCallResult = {
        tool: toolCall.tool,
        args: toolCall.arguments,
        result: resultText,
        isError,
        approved: true,
        durationMs: duration,
      }
      toolCalls.push(tcResult)
      emit({ type: 'tool_result', toolResult: tcResult, timestamp: Date.now() })

      // 将结果回传给 AI
      history.push({ role: 'assistant', content: response })
      history.push({ role: 'user', content: `Tool "${toolCall.tool}" result:\n${resultText.slice(0, 4000)}\n\nPlease continue based on this result.` })
      currentMessage = `Tool "${toolCall.tool}" returned:\n${resultText.slice(0, 4000)}\n\nContinue your response.`

    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      emit({ type: 'error', content: errMsg, timestamp: Date.now() })
      return { finalResponse: `Agent loop error: ${errMsg}`, toolCalls, iterations: iteration, events }
    }
  }

  // 达到最大迭代
  const timeoutMsg = `Reached maximum ${maxIter} tool call iterations. Last response may be incomplete.`
  emit({ type: 'error', content: timeoutMsg, timestamp: Date.now() })
  return { finalResponse: timeoutMsg, toolCalls, iterations: iteration, events }
}

/** 清理缓存的 MCP 连接 */
export function disconnectAllMCPClients(): void {
  activeClients.clear()
}
