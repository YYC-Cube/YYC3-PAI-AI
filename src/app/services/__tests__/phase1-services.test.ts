/**
 * @file phase1-services.test.ts
 * @description Phase 1 三件套测试：agent-loop（工具调用闭环）/ trace-store（全链路追踪）/ code-indexer（RAG 检索）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseToolCall, isFinalResponse, runAgentLoop, type AgentLoopOptions } from '../agent-loop'
import { sanitizePrompt, newTraceId } from '../trace-store'
import { buildRagContext, searchCode, getIndexStats, clearIndex } from '../code-indexer'

// ===== Agent Loop =====

describe('parseToolCall（tool_call JSON 解析）', () => {
  it('解析直接 JSON 格式', () => {
    const result = parseToolCall('{"tool": "fs_read", "arguments": {"path": "/src/main.ts"}}')
    expect(result).toEqual({ tool: 'fs_read', arguments: { path: '/src/main.ts' } })
  })

  it('解析 Markdown 代码块格式', () => {
    const result = parseToolCall('I need to read a file.\n```json\n{"tool": "fs_read", "arguments": {"path": "x"}}\n```')
    expect(result).toEqual({ tool: 'fs_read', arguments: { path: 'x' } })
  })

  it('纯文本返回 null', () => {
    expect(parseToolCall('This is a plain text response.')).toBeNull()
    expect(parseToolCall('Hello world! How can I help?')).toBeNull()
  })

  it('缺少 arguments 默认空对象', () => {
    const result = parseToolCall('{"tool": "list_files"}')
    expect(result).toEqual({ tool: 'list_files', arguments: {} })
  })

  it('嵌套 arguments 正确解析', () => {
    const result = parseToolCall('{"tool": "search", "arguments": {"query": "test", "opts": {"limit": 10}}}')
    expect(result?.arguments).toEqual({ query: 'test', opts: { limit: 10 } })
  })
})

describe('isFinalResponse', () => {
  it('纯文本 → true（循环终止）', () => {
    expect(isFinalResponse('The answer is 42.')).toBe(true)
  })

  it('含 tool_call → false（继续循环）', () => {
    expect(isFinalResponse('{"tool": "read", "arguments": {}}')).toBe(false)
  })
})

describe('runAgentLoop（Agent 循环引擎）', () => {
  const mockOptions: AgentLoopOptions = {
    mcpServers: [{ name: 'test', endpoint: 'https://mcp.test/endpoint' }],
    maxIterations: 3,
  }

  it('纯文本回复直接返回（无工具调用）', async () => {
    const sendFn = vi.fn().mockResolvedValue('Hello! How can I help?')
    const result = await runAgentLoop('hi', sendFn, mockOptions)
    expect(result.finalResponse).toBe('Hello! How can I help?')
    expect(result.toolCalls).toHaveLength(0)
    expect(result.iterations).toBe(1)
    expect(sendFn).toHaveBeenCalledTimes(1)
  })

  it('无 MCP 服务器时不构建 systemPrompt', async () => {
    const sendFn = vi.fn().mockResolvedValue('ok')
    await runAgentLoop('hi', sendFn, { mcpServers: [], maxIterations: 1 })
    expect(sendFn).toHaveBeenCalledWith('hi', { systemPrompt: undefined, history: undefined }, undefined)
  })

  it('错误传播', async () => {
    const sendFn = vi.fn().mockRejectedValue(new Error('Network timeout'))
    const result = await runAgentLoop('hi', sendFn, mockOptions)
    expect(result.finalResponse).toContain('Network timeout')
    expect(result.events.some(e => e.type === 'error')).toBe(true)
  })
})

// ===== Trace Store =====

describe('trace-store（全链路追踪）', () => {
  it('newTraceId 格式正确且唯一', () => {
    const id1 = newTraceId()
    const id2 = newTraceId()
    expect(id1).toMatch(/^trace_\d+_[a-z0-9]+$/)
    expect(id1).not.toBe(id2)
  })

  it('sanitizePrompt 脱敏 API Key', () => {
    const input = 'My key is sk-abcdefghijklmnopqrstuvwxyz123 and Bearer token123'
    const output = sanitizePrompt(input)
    expect(output).toContain('[REDACTED]')
    expect(output).not.toContain('sk-abcdefghijklmnopqrstuvwxyz123')
    expect(output).not.toContain('token123')
  })

  it('sanitizePrompt 截断到 200 字符', () => {
    const long = 'a'.repeat(500)
    expect(sanitizePrompt(long).length).toBeLessThanOrEqual(200)
  })
})

// ===== Code Indexer (RAG) =====

describe('code-indexer（RAG 语义检索）', () => {
  beforeEach(async () => {
    await clearIndex()
  })

  it('空索引 searchCode 返回空数组', async () => {
    // 模型未加载时也返回空
    const results = await searchCode('anything')
    expect(results).toEqual([])
  })

  it('buildRagContext 模型未加载返回空字符串', async () => {
    const context = await buildRagContext('test query')
    expect(context).toBe('')
  })

  it('getIndexStats 空索引返回零', async () => {
    const stats = await getIndexStats()
    expect(stats.totalChunks).toBe(0)
    expect(stats.totalFiles).toBe(0)
    expect(stats.lastIndexed).toBe(0)
  })

  it('clearIndex 幂等', async () => {
    await clearIndex()
    await clearIndex()
    const stats = await getIndexStats()
    expect(stats.totalChunks).toBe(0)
  })
})
