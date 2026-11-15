/**
 * @file ai-metrics-store.test.ts
 * @description Unit test for ai-metrics-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const lsMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: lsMock })

import { aiMetricsStore, classifyError, getErrorTypeLabel } from '../ai-metrics-store'

describe('classifyError', () => {
  it('should classify 401 as authentication', () => {
    expect(classifyError('some error', 401)).toBe('authentication')
  })
  it('should classify "unauthorized" as authentication', () => {
    expect(classifyError('Unauthorized request')).toBe('authentication')
  })
  it('should classify 429 as rate_limit', () => {
    expect(classifyError('', 429)).toBe('rate_limit')
  })
  it('should classify "rate limit" in message', () => {
    expect(classifyError('Rate limit exceeded')).toBe('rate_limit')
  })
  it('should classify "timeout" as timeout', () => {
    expect(classifyError('Request timeout')).toBe('timeout')
  })
  it('should classify "AbortError" as timeout', () => {
    expect(classifyError('AbortError: signal aborted')).toBe('timeout')
  })
  it('should classify "network" as network', () => {
    expect(classifyError('NetworkError: Failed to fetch')).toBe('network')
  })
  it('should classify "ECONNREFUSED" as network', () => {
    expect(classifyError('ECONNREFUSED localhost')).toBe('network')
  })
  it('should classify HTTP 400 as api', () => {
    expect(classifyError('Bad Request', 400)).toBe('api')
  })
  it('should classify HTTP 500 as api', () => {
    expect(classifyError('Server Error', 500)).toBe('api')
  })
  it('should classify unknown errors', () => {
    expect(classifyError('something weird')).toBe('unknown')
  })
})

describe('getErrorTypeLabel', () => {
  it('should return Chinese labels', () => {
    expect(getErrorTypeLabel('network', 'zh')).toBe('网络错误')
    expect(getErrorTypeLabel('rate_limit', 'zh')).toBe('速率限制')
    expect(getErrorTypeLabel('authentication', 'zh')).toBe('认证失败')
  })
  it('should return English labels', () => {
    expect(getErrorTypeLabel('network', 'en')).toBe('Network Error')
    expect(getErrorTypeLabel('timeout', 'en')).toBe('Timeout')
    expect(getErrorTypeLabel('unknown', 'en')).toBe('Unknown')
  })
})

describe('recordSuccess', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should add a performance record', () => {
    aiMetricsStore.recordSuccess({
      providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o',
      latencyMs: 450, inputTokens: 100, outputTokens: 200,
    })
    const perf = aiMetricsStore.getRecentPerformance(24)
    expect(perf.length).toBe(1)
    expect(perf[0].success).toBe(true)
    expect(perf[0].latencyMs).toBe(450)
    expect(perf[0].totalTokens).toBe(300)
  })

  it('should track cost', () => {
    aiMetricsStore.recordSuccess({
      providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o',
      latencyMs: 300, inputTokens: 1000, outputTokens: 500,
    })
    const costs = aiMetricsStore.getCostSummaries()
    expect(costs.length).toBe(1)
    expect(costs[0].providerId).toBe('openai')
    expect(costs[0].totalCost).toBeGreaterThan(0)
  })

  it('should persist to localStorage', () => {
    lsMock.setItem.mockClear()
    aiMetricsStore.recordSuccess({
      providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o',
      latencyMs: 100, inputTokens: 10, outputTokens: 20,
    })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_ai_metrics')
    expect(calls.length).toBeGreaterThan(0)
  })
})

describe('recordError', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should add an error record', () => {
    aiMetricsStore.recordError({
      providerId: 'openai', providerName: 'OpenAI', modelId: 'gpt-4o', modelName: 'GPT-4o',
      latencyMs: 200, errorMessage: 'Rate limit exceeded', httpStatus: 429,
    })
    const errors = aiMetricsStore.getRecentErrors()
    expect(errors.length).toBe(1)
    expect(errors[0].errorType).toBe('rate_limit')
    expect(errors[0].suggestions.length).toBeGreaterThan(0)
  })

  it('should add a failed performance record', () => {
    aiMetricsStore.recordError({
      providerId: 'openai', providerName: 'OpenAI', modelId: 'gpt-4o', modelName: 'GPT-4o',
      latencyMs: 100, errorMessage: 'Network error',
    })
    const perf = aiMetricsStore.getRecentPerformance(24)
    expect(perf.some(r => !r.success)).toBe(true)
  })
})

describe('getAggregatedMetrics', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should aggregate by provider:model', () => {
    aiMetricsStore.recordSuccess({ providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o', latencyMs: 100, inputTokens: 50, outputTokens: 50 })
    aiMetricsStore.recordSuccess({ providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o', latencyMs: 200, inputTokens: 50, outputTokens: 50 })
    aiMetricsStore.recordSuccess({ providerId: 'zhipu', modelId: 'glm-5', modelName: 'GLM-5', latencyMs: 300, inputTokens: 50, outputTokens: 50 })
    const metrics = aiMetricsStore.getAggregatedMetrics()
    expect(metrics.length).toBe(2)
    const openai = metrics.find(m => m.providerId === 'openai')
    expect(openai!.totalRequests).toBe(2)
    expect(openai!.avgLatencyMs).toBe(150)
    expect(openai!.successRate).toBe(1)
  })
})

describe('getErrorStats', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should group errors by type', () => {
    aiMetricsStore.recordError({ providerId: 'a', providerName: 'A', modelId: 'm', modelName: 'M', latencyMs: 0, errorMessage: 'Rate limit' })
    aiMetricsStore.recordError({ providerId: 'a', providerName: 'A', modelId: 'm', modelName: 'M', latencyMs: 0, errorMessage: 'Rate limit again' })
    aiMetricsStore.recordError({ providerId: 'b', providerName: 'B', modelId: 'm', modelName: 'M', latencyMs: 0, errorMessage: 'Network error' })
    const stats = aiMetricsStore.getErrorStats()
    expect(stats.length).toBe(2) // rate_limit + network
    expect(stats.find(s => s.errorType === 'rate_limit')?.count).toBe(2)
  })
})

describe('getCostSummaries', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should group costs by provider', () => {
    aiMetricsStore.recordSuccess({ providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o', latencyMs: 100, inputTokens: 1000, outputTokens: 500 })
    aiMetricsStore.recordSuccess({ providerId: 'openai', modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', latencyMs: 50, inputTokens: 2000, outputTokens: 1000 })
    const summaries = aiMetricsStore.getCostSummaries()
    expect(summaries.length).toBe(1)
    expect(summaries[0].models.length).toBe(2)
    expect(summaries[0].requestCount).toBe(2)
  })
})

describe('getTotalCost', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should separate USD and CNY', () => {
    aiMetricsStore.recordSuccess({ providerId: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o', latencyMs: 100, inputTokens: 1000000, outputTokens: 500000 })
    aiMetricsStore.recordSuccess({ providerId: 'zhipu', modelId: 'glm-5', modelName: 'GLM-5', latencyMs: 100, inputTokens: 1000000, outputTokens: 500000 })
    const cost = aiMetricsStore.getTotalCost()
    expect(cost.usd).toBeGreaterThan(0)
    expect(cost.cny).toBeGreaterThan(0)
  })
})

describe('getBestProvider', () => {
  beforeEach(() => { aiMetricsStore.clearAll() })

  it('should return null with no data', () => {
    expect(aiMetricsStore.getBestProvider()).toBeNull()
  })

  it('should return best provider', () => {
    aiMetricsStore.recordSuccess({ providerId: 'fast', modelId: 'fast-m', modelName: 'Fast', latencyMs: 50, inputTokens: 100, outputTokens: 100 })
    aiMetricsStore.recordSuccess({ providerId: 'slow', modelId: 'slow-m', modelName: 'Slow', latencyMs: 5000, inputTokens: 100, outputTokens: 100 })
    const best = aiMetricsStore.getBestProvider()
    expect(best).not.toBeNull()
    expect(best!.providerId).toBe('fast')
  })
})

describe('clearAll', () => {
  it('should clear all records', () => {
    aiMetricsStore.recordSuccess({ providerId: 'x', modelId: 'y', modelName: 'Y', latencyMs: 100 })
    aiMetricsStore.clearAll()
    expect(aiMetricsStore.getRecentPerformance(24)).toEqual([])
    expect(aiMetricsStore.getRecentErrors()).toEqual([])
    expect(aiMetricsStore.getCostSummaries()).toEqual([])
  })
})
