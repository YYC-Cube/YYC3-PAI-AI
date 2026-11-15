/**
 * @file e1-services.test.ts
 * @description E1 延伸三项测试：评估基线 / 缓存降级 / OTel 语义对齐
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  computeMetrics, autoScore, recordEvaluation, updateFeedback,
  getEvaluationSummary, getRecentEvaluations, clearEvaluations,
} from '../evaluation-store'
import {
  cacheResponse, sendWithCacheFallback, getCacheStats, clearAllCache,
} from '../cache-fallback'
import { traceToOtelSpan, exportTracesToOtel, GENAI_ATTRIBUTES } from '../otel-adapter'
import type { TraceRecord } from '../trace-store'

beforeEach(() => {
  localStorage.clear()
  clearAllCache()
  clearEvaluations()
})

// ===== E1-2 评估基线 =====

describe('computeMetrics（自动指标）', () => {
  it('空回复 → 信息密度 0，标记错误', () => {
    const m = computeMetrics('', 100, 50)
    expect(m.responseLength).toBe(0)
    expect(m.informationDensity).toBe(0)
    expect(m.hasError).toBe(false) // 空字符串不匹配 error
  })

  it('代码回复 → codeBlockCount 正确', () => {
    const text = 'Here is code:\n```ts\nconst x = 1\n```\nAnd another:\n```py\nprint(1)\n```'
    const m = computeMetrics(text, 200, 100)
    expect(m.codeBlockCount).toBe(2)
    expect(m.codeBlockCount).toBe(2) // 双代码块确认
  })

  it('含错误关键词 → hasError true', () => {
    const m = computeMetrics('Error: failed to connect', 100, 50)
    expect(m.hasError).toBe(true)
  })

  it('信息密度计算正确', () => {
    const m = computeMetrics('abcdef', 100, 50) // 6 非空白 / 6 总
    expect(m.informationDensity).toBeCloseTo(1.0)
  })
})

describe('autoScore（自动质量评分）', () => {
  it('低延迟 + 高密度 + 代码块 → 高分', () => {
    const m = computeMetrics('```ts\nconst answer = 42;\n```', 500, 200)
    const score = autoScore(m)
    expect(score).toBeGreaterThan(70)
  })

  it('极短回复 → 低分', () => {
    const m = computeMetrics('ok', 5000, 2000)
    const score = autoScore(m)
    expect(score).toBeLessThan(50)
  })

  it('错误回复 → 扣分', () => {
    const m = computeMetrics('Error: something failed and cannot continue', 5000, 3000)
    expect(autoScore(m)).toBeLessThan(50)
  })
})

describe('recordEvaluation + getEvaluationSummary', () => {
  it('记录 + 摘要闭环', () => {
    recordEvaluation({
      prompt: 'How to write a function?',
      completion: '```ts\nfunction greet() { return "hello" }\n```',
      latencyMs: 800, firstTokenMs: 200, model: 'glm-5', provider: 'zhipu',
    })
    recordEvaluation({
      prompt: 'What is 1+1?',
      completion: '2', latencyMs: 300, firstTokenMs: 100,
      model: 'glm-5', provider: 'zhipu', feedback: 'positive',
    })

    const summary = getEvaluationSummary()
    expect(summary.total).toBe(2)
    expect(summary.positiveRate).toBe(1.0) // 1 positive / 1 with feedback
    expect(summary.avgLatencyMs).toBe(550)
    expect(summary.dailyTrend).toHaveLength(1) // 同一天
  })

  it('用户反馈更新', () => {
    const r = recordEvaluation({
      prompt: 'test', completion: 'answer', latencyMs: 100, firstTokenMs: 50,
      model: 'm', provider: 'p',
    })
    expect(r.feedback).toBeNull()
    updateFeedback(r.id, 'positive', 'good answer')
    const records = getRecentEvaluations(1)
    expect(records[0].feedback).toBe('positive')
    expect(records[0].feedbackComment).toBe('good answer')
  })
})

// ===== E1-3 缓存降级 =====

describe('cache-fallback（网络故障降级）', () => {
  it('正常路径：成功后缓存，下次命中', async () => {
    const sendFn = vi.fn().mockResolvedValue('AI answer')
    const r1 = await sendWithCacheFallback('question', 'model-a', sendFn)
    expect(r1.isCached).toBe(false)
    expect(r1.content).toBe('AI answer')

    // 第二次网络失败但缓存命中
    const failFn = vi.fn().mockRejectedValue(new Error('network down'))
    const r2 = await sendWithCacheFallback('question', 'model-a', failFn)
    expect(r2.isCached).toBe(true)
    expect(r2.source).toBe('memory')
    expect(r2.content).toBe('AI answer')
  })

  it('不同 prompt 不同 model 不互相命中', async () => {
    cacheResponse('prompt-1', 'model-a', 'answer-1')
    const failFn = vi.fn().mockRejectedValue(new Error('fail'))
    // 不同 model
    await expect(sendWithCacheFallback('prompt-1', 'model-b', failFn)).rejects.toThrow('无缓存')
    // 不同 prompt
    await expect(sendWithCacheFallback('prompt-2', 'model-a', failFn)).rejects.toThrow('无缓存')
  })

  it('网络恢复后不使用缓存（isCached false）', async () => {
    cacheResponse('q', 'm', 'old answer')
    const okFn = vi.fn().mockResolvedValue('fresh answer')
    const r = await sendWithCacheFallback('q', 'm', okFn)
    expect(r.isCached).toBe(false)
    expect(r.content).toBe('fresh answer')
  })

  it('清空缓存后无降级可用', async () => {
    cacheResponse('q', 'm', 'cached')
    clearAllCache()
    const failFn = vi.fn().mockRejectedValue(new Error('network down'))
    await expect(sendWithCacheFallback('q', 'm', failFn)).rejects.toThrow('无缓存')
  })

  it('缓存统计正确', () => {
    expect(getCacheStats().memoryCount).toBe(0)
    cacheResponse('q1', 'm', 'a1')
    cacheResponse('q2', 'm', 'a2')
    const stats = getCacheStats()
    expect(stats.memoryCount).toBe(2)
    expect(stats.persistentCount).toBe(2)
  })
})

// ===== E1-4 OTel 语义对齐 =====

describe('otel-adapter（OTel GenAI 语义约定）', () => {
  const mockTrace: TraceRecord = {
    id: 'trace_123_abc',
    timestamp: 1730300000000,
    provider: 'zhipu',
    model: 'glm-5',
    promptPreview: 'How to write React hooks?',
    completion: 'Use useState for state management...',
    firstTokenMs: 200,
    totalMs: 1500,
    inputTokens: 25,
    outputTokens: 120,
    costUsd: 0.0002,
    success: true,
    toolCalls: [
      { tool: 'fs_read', args: { path: '/src' }, result: 'file contents', isError: false, durationMs: 50 },
    ],
    iterations: 2,
  }

  it('traceToOtelSpan 生成符合 GenAI 语义约定的 span', () => {
    const span = traceToOtelSpan(mockTrace)

    // 基础结构
    expect(span.name).toContain('gen_ai')
    expect(span.kind).toBe('CLIENT')
    expect(span.status.code).toBe('OK')

    // GenAI 语义约定字段
    expect(span.attributes[GENAI_ATTRIBUTES.OPERATION]).toBe('chat')
    expect(span.attributes[GENAI_ATTRIBUTES.SYSTEM]).toBe('zhipu')
    expect(span.attributes[GENAI_ATTRIBUTES.MODEL]).toBe('glm-5')
    expect(span.attributes[GENAI_ATTRIBUTES.INPUT_TOKENS]).toBe(25)
    expect(span.attributes[GENAI_ATTRIBUTES.OUTPUT_TOKENS]).toBe(120)
    expect(span.attributes[GENAI_ATTRIBUTES.TOTAL_TOKENS]).toBe(145)
    expect(span.attributes[GENAI_ATTRIBUTES.FIRST_TOKEN_LATENCY]).toBe(200)
    expect(span.attributes[GENAI_ATTRIBUTES.TOTAL_LATENCY]).toBe(1500)

    // 工具调用
    expect(span.attributes['yyc3.tool.0.name']).toBe('fs_read')
    expect(span.attributes['yyc3.tool.0.duration_ms']).toBe(50)
  })

  it('失败 trace → ERROR status', () => {
    const failTrace = { ...mockTrace, success: false, errorMessage: 'timeout' }
    const span = traceToOtelSpan(failTrace)
    expect(span.status.code).toBe('ERROR')
    expect(span.status.message).toBe('timeout')
  })

  it('exportTracesToOtel 输出 OTLP 格式', () => {
    const export_ = exportTracesToOtel([mockTrace])
    expect(export_.resourceSpans).toHaveLength(1)
    expect(export_.resourceSpans[0].scopeSpans).toHaveLength(1)
    expect(export_.resourceSpans[0].scopeSpans[0].spans).toHaveLength(1)
    expect(export_.resourceSpans[0].resource.attributes['service.name']).toBe('yyc3-ai-pai')
  })

  it('GENAI_ATTRIBUTES 常量不包含硬编码拼写错误', () => {
    // OTel GenAI 语义约定的标准前缀
    expect(GENAI_ATTRIBUTES.OPERATION).toBe('gen_ai.operation.name')
    expect(GENAI_ATTRIBUTES.INPUT_TOKENS).toBe('gen_ai.usage.input_tokens')
    expect(GENAI_ATTRIBUTES.MODEL).toBe('gen_ai.request.model')
  })
})
