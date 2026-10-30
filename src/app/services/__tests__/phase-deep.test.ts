/**
 * @file phase-deep.test.ts
 * @description 深化 Phase 1-3 service 覆盖率：agent-loop 深度 / evaluation 指标 / prompt A/B 全流程 / otel 边界
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseToolCall, isFinalResponse, runAgentLoop, disconnectAllMCPClients,
  type AgentLoopOptions,
} from '../agent-loop'
import {
  computeMetrics, autoScore, recordEvaluation, updateFeedback,
  getEvaluationSummary, getRecentEvaluations, clearEvaluations,
} from '../evaluation-store'
import {
  extractVariables, createTemplate, addVersion, rollbackTo,
  enableABTest, disableABTest, getActiveVersion, renderPrompt, recordUsage,
  getABTestResult, deleteTemplate, getTemplate,
} from '../prompt-manager'
import { traceToOtelSpan, exportTracesToOtel, GENAI_ATTRIBUTES } from '../otel-adapter'
import type { TraceRecord } from '../trace-store'

beforeEach(() => {
  localStorage.clear()
  clearEvaluations()
  disconnectAllMCPClients()
})

// ===== agent-loop 深度 =====

describe('parseToolCall 边界用例', () => {
  it('嵌入文本中的单个 tool_call JSON', () => {
    const text = 'I need to call a tool:\n{"tool": "fs_read", "arguments": {"path": "/src"}}\nPlease execute this.'
    const result = parseToolCall(text)
    expect(result?.tool).toBe('fs_read')
    expect(result?.arguments.path).toBe('/src')
  })

  it('tool 名包含特殊字符', () => {
    expect(parseToolCall('{"tool": "fs_read-file.v2", "arguments": {}}')?.tool).toBe('fs_read-file.v2')
  })

  it('arguments 为嵌套数组', () => {
    const result = parseToolCall('{"tool": "batch", "arguments": {"items": [1, 2, 3]}}')
    expect(result?.arguments.items).toEqual([1, 2, 3])
  })

  it('空字符串/null 安全', () => {
    expect(parseToolCall('')).toBeNull()
    expect(parseToolCall('{}')).toBeNull()
    expect(parseToolCall('{"no_tool": true}')).toBeNull()
    expect(parseToolCall('{"tool": "", "arguments": {}}')).toBeNull()
  })

  it('Markdown 代码块嵌套 JSON', () => {
    const text = 'Analysis:\n```json\n{"tool": "search", "arguments": {"query": "test"}}\n```\nDone.'
    expect(parseToolCall(text)?.tool).toBe('search')
  })

  it('isFinalResponse 边界', () => {
    expect(isFinalResponse('')).toBe(true)
    expect(isFinalResponse('{"tool": "x", "arguments": {}}')).toBe(false)
    expect(isFinalResponse('Here is the answer without tool calls.')).toBe(true)
  })
})

describe('runAgentLoop 多场景', () => {
  const baseOpts: AgentLoopOptions = { mcpServers: [], maxIterations: 3 }

  it('多轮循环（tool_call → 结果 → 纯文本回复）', async () => {
    let callCount = 0
    const sendFn = vi.fn(async () => {
      callCount++
      if (callCount === 1) return '{"tool": "read_file", "arguments": {"path": "/test"}}'
      return 'The file contains test data.'
    })

    const result = await runAgentLoop('read test', sendFn, baseOpts)
    expect(result.finalResponse).toBe('The file contains test data.')
    expect(result.iterations).toBe(2)
    expect(sendFn).toHaveBeenCalledTimes(2)
  })

  it('达到 maxIterations 停止', async () => {
    const sendFn = vi.fn(async () => '{"tool": "loop_forever", "arguments": {}}')
    const result = await runAgentLoop('loop', sendFn, { ...baseOpts, maxIterations: 2 })
    expect(result.iterations).toBeGreaterThanOrEqual(2)
    expect(result.finalResponse).toContain('maximum')
  })

  it('onEvent 收到完整事件流', async () => {
    const events: string[] = []
    const sendFn = vi.fn().mockResolvedValue('plain response')
    const result = await runAgentLoop('hi', sendFn, {
      ...baseOpts,
      onEvent: (e) => events.push(e.type),
    })
    expect(events).toContain('user_message')
    expect(events).toContain('ai_response')
    expect(events).toContain('done')
    expect(result.events.length).toBeGreaterThanOrEqual(3)
  })

  it('onChunk 透传到 sendFn', async () => {
    const onChunk = vi.fn()
    const sendFn = vi.fn().mockImplementation((_msg, _opts, chunk) => {
      chunk?.('hello', 'hello')
      return Promise.resolve('hello')
    })
    await runAgentLoop('hi', sendFn, { ...baseOpts, onChunk })
    expect(onChunk).toHaveBeenCalledWith('hello', 'hello')
  })
})

// ===== evaluation-store 深度 =====

describe('computeMetrics 边界', () => {
  it('纯代码回复 → codeBlockCount 高', () => {
    const code = '```python\nfor i in range(10):\n    print(i)\n```\n```js\nconsole.log(1)\n```'
    const m = computeMetrics(code, 100, 50)
    expect(m.codeBlockCount).toBe(2)
    expect(m.codeBlockCount).toBe(2)
  })

  it('高信息密度文本', () => {
    const dense = 'const x=1;let y=2;function f(){return x+y}'
    const m = computeMetrics(dense, 100, 50)
    expect(m.informationDensity).toBeGreaterThan(0.8)
  })

  it('低信息密度（大量空格/换行）', () => {
    const sparse = 'a   b\n\n\n   c   d\n\n'
    const m = computeMetrics(sparse, 100, 50)
    expect(m.informationDensity).toBeLessThan(0.3)
  })

  it('首 token 延迟独立于总延迟', () => {
    const m = computeMetrics('test', 5000, 200)
    expect(m.firstTokenMs).toBe(200)
    expect(m.latencyMs).toBe(5000)
  })
})

describe('autoScore 分段', () => {
  it('满分场景（快+密+代码+结构化+无错）', () => {
    const m = {
      responseLength: 500, codeBlockCount: 3, hasError: false,
      latencyMs: 500, firstTokenMs: 100,
      informationDensity: 0.8, hasStructuredOutput: true,
    }
    expect(autoScore(m)).toBeGreaterThanOrEqual(90)
  })

  it('零分场景（慢+稀+无码+错+极短）', () => {
    const m = {
      responseLength: 5, codeBlockCount: 0, hasError: true,
      latencyMs: 15000, firstTokenMs: 8000,
      informationDensity: 0.1, hasStructuredOutput: false,
    }
    expect(autoScore(m)).toBeLessThanOrEqual(10)
  })
})

describe('evaluation 全流程', () => {
  it('多次记录 + 反馈 + 摘要趋势', () => {
    // 模拟 3 天的数据
    for (let day = 0; day < 3; day++) {
      for (let i = 0; i < 5; i++) {
        const r = recordEvaluation({
          prompt: `Question ${day}-${i}`,
          completion: `Answer with code \`\`\`js\nconsole.log(${i})\n\`\`\``,
          latencyMs: 500 + day * 200,
          firstTokenMs: 100,
          model: 'test', provider: 'test',
        })
        if (i % 2 === 0) updateFeedback(r.id, 'positive')
        else if (i % 3 === 0) updateFeedback(r.id, 'negative')
      }
    }

    const summary = getEvaluationSummary()
    expect(summary.total).toBe(15)
    expect(summary.dailyTrend).toHaveLength(1) // 同一天（测试即时执行）
    expect(summary.avgCodeBlocks).toBeGreaterThan(0)
    expect(summary.positiveRate).toBeGreaterThan(0)

    const recent = getRecentEvaluations(5)
    expect(recent.length).toBe(5)
    expect(recent[0].feedback).toBeTruthy() // 有反馈数据
  })
})

// ===== prompt-manager 深度 =====

describe('prompt A/B 全流程', () => {
  it('完整生命周期：创建→版本→A/B→统计→决策', () => {
    // 创建模板
    const tpl = createTemplate('lifecycle-test', 'Original prompt {{topic}}')
    expect(tpl.versions).toHaveLength(1)

    // 添加改进版本
    const v2 = addVersion(tpl.id, 'Improved prompt for {{topic}}', 'v2 improvement')
    expect(v2?.version).toBe(2)

    // 启用 A/B
    expect(enableABTest(tpl.id, 1, 2)).toBe(true)

    // 模拟使用
    for (let i = 0; i < 6; i++) {
      const active = getActiveVersion(tpl.id)
      expect(active).toBeTruthy()
      recordUsage({
        templateId: tpl.id,
        version: active!.version.version,
        variant: active!.variant ?? undefined,
        latencyMs: 100 + i * 10,
        success: active!.variant === 'A' ? i < 5 : i < 3,
        feedback: active!.variant === 'A' ? 'positive' : 'negative',
      })
    }

    // 检查结果
    const result = getABTestResult(tpl.id)
    expect(result.variantA.calls).toBeGreaterThanOrEqual(2)
    expect(result.variantB.calls).toBeGreaterThanOrEqual(2)
    expect(result.winner).toBeTruthy()

    // 禁用 A/B → 回归单版本
    disableABTest(tpl.id)
    const after = getActiveVersion(tpl.id)
    expect(after?.variant).toBeNull()

    // 回滚到 v1
    expect(rollbackTo(tpl.id, 1)).toBe(true)
    const rolled = getTemplate(tpl.id)!
    expect(rolled.activeVersion).toBe(1)
  })

  it('renderPrompt 带变量', () => {
    const tpl = createTemplate('greet', 'Hello {{name}}, your role is {{role}} at {{company}}')
    const result = renderPrompt(tpl.id, { name: 'Alice', role: 'dev', company: 'YYC³' })
    expect(result?.content).toBe('Hello Alice, your role is dev at YYC³')
  })

  it('extractVariables 去重', () => {
    expect(extractVariables('{{a}} {{b}} {{a}} {{c}} {{b}}')).toEqual(['a', 'b', 'c'])
  })

  it('多模板共存', () => {
    const t1 = createTemplate('multi-1', 'Template 1')
    const t2 = createTemplate('multi-2', 'Template 2')
    const t3 = createTemplate('multi-3', 'Template 3')

    expect(deleteTemplate(t2.id)).toBe(true)
    expect(getTemplate(t2.id)).toBeNull()
    expect(getTemplate(t1.id)).toBeTruthy()
    expect(getTemplate(t3.id)).toBeTruthy()
  })
})

// ===== otel-adapter 深度 =====

describe('otel-adapter 边界', () => {
  const baseTrace: TraceRecord = {
    id: 'trace_test_001',
    timestamp: 1730300000000,
    provider: 'zhipu',
    model: 'glm-5',
    promptPreview: 'Test prompt',
    completion: 'Test completion',
    firstTokenMs: 100,
    totalMs: 1000,
    inputTokens: 50,
    outputTokens: 200,
    costUsd: 0.0005,
    success: true,
    toolCalls: [],
    iterations: 1,
  }

  it('空 toolCalls 生成干净的 span', () => {
    const span = traceToOtelSpan(baseTrace)
    expect(span.attributes[GENAI_ATTRIBUTES.TOTAL_TOKENS]).toBe(250)
    expect(span.attributes['yyc3.tool.call_count']).toBe(0)
  })

  it('多工具调用生成嵌套属性', () => {
    const trace: TraceRecord = {
      ...baseTrace,
      toolCalls: [
        { tool: 'fs_read', args: { path: '/' }, result: 'data', isError: false, durationMs: 50 },
        { tool: 'fs_write', args: { path: '/x' }, result: 'error', isError: true, durationMs: 100 },
        { tool: 'search', args: { q: 'test' }, result: 'found', isError: false, durationMs: 200 },
      ],
    }
    const span = traceToOtelSpan(trace)
    expect(span.attributes['yyc3.tool.0.name']).toBe('fs_read')
    expect(span.attributes['yyc3.tool.1.is_error']).toBe(true)
    expect(span.attributes['yyc3.tool.2.duration_ms']).toBe(200)
    expect(span.attributes['yyc3.tool.call_count']).toBe(3)
  })

  it('Agent 循环 iterations 属性', () => {
    const trace: TraceRecord = { ...baseTrace, iterations: 5 }
    const span = traceToOtelSpan(trace)
    expect(span.attributes['yyc3.agent.iterations']).toBe(5)
  })

  it('批量导出正确分组', () => {
    const traces = [
      { ...baseTrace, id: 't1' },
      { ...baseTrace, id: 't2', success: false, errorMessage: 'timeout' },
    ]
    const export_ = exportTracesToOtel(traces)
    expect(export_.resourceSpans[0].scopeSpans[0].spans).toHaveLength(2)
    expect(export_.resourceSpans[0].scopeSpans[0].spans[0].status.code).toBe('OK')
    expect(export_.resourceSpans[0].scopeSpans[0].spans[1].status.code).toBe('ERROR')
  })
})
