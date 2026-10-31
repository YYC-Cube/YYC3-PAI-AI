/**
 * @file trace-store.test.ts
 * @description 全链路追踪存储专项 — 内存 IDB 驱动真实读写/淘汰/汇总路径
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMemoryIDB } from '../../../test/helpers/memory-idb'

const idb = createMemoryIDB()
// setup.ts 的全局桩 writable 但 non-configurable：defineProperty 直改值（vi.stubGlobal 不可用）
const setIDB = (impl: unknown) => {
  Object.defineProperty(globalThis, 'indexedDB', { value: impl, writable: true })
}
setIDB(idb.indexedDB)

import {
  newTraceId, saveTrace, getRecentTraces, getTrace,
  getTraceSummary, clearTraces, sanitizePrompt, type TraceRecord,
} from '../trace-store'

const trace = (over: Partial<TraceRecord> = {}): TraceRecord => ({
  id: newTraceId(),
  timestamp: Date.now(),
  provider: 'zhipu',
  model: 'glm-4.6',
  promptPreview: 'p',
  completion: 'c',
  firstTokenMs: 100,
  totalMs: 500,
  inputTokens: 10,
  outputTokens: 20,
  costUsd: 0.01,
  success: true,
  toolCalls: [],
  iterations: 1,
  ...over,
})

beforeEach(async () => {
  await clearTraces()
})

afterEach(() => {
  // 兜底：任何用例改坏全局 indexedDB 后都恢复内存实现
  setIDB(idb.indexedDB)
})

describe('trace-store IDB 全路径', () => {
  it('newTraceId 格式：trace_时间戳_6位随机', () => {
    const id = newTraceId()
    expect(id).toMatch(/^trace_\d+_[a-z0-9]{6}$/)
    expect(newTraceId()).not.toBe(newTraceId())
  })

  it('saveTrace/getTrace 读写往返', async () => {
    const rec = trace({ id: 't-roundtrip', promptPreview: '往返' })
    await saveTrace(rec)
    expect(await getTrace('t-roundtrip')).toEqual(rec)
    expect(await getTrace('不存在')).toBeNull()
  })

  it('getRecentTraces 按时间倒序 + limit 截断', async () => {
    await saveTrace(trace({ id: 'old', timestamp: 1000 }))
    await saveTrace(trace({ id: 'new', timestamp: 3000 }))
    await saveTrace(trace({ id: 'mid', timestamp: 2000 }))
    const top2 = await getRecentTraces(2)
    expect(top2.map(t => t.id)).toEqual(['new', 'mid'])
    expect((await getRecentTraces()).length).toBe(3)
  })

  it('saveTrace 幂等覆盖（put 语义）', async () => {
    await saveTrace(trace({ id: 'dup', completion: 'v1' }))
    await saveTrace(trace({ id: 'dup', completion: 'v2' }))
    expect((await getTrace('dup'))!.completion).toBe('v2')
  })

  it('MAX_TRACES=500 淘汰最老记录', async () => {
    // 基线 500 条 + 3 条新纪录 → 保留最新 500
    for (let i = 0; i < 503; i++) {
      await saveTrace(trace({ id: `evict-${i}`, timestamp: 10_000 + i }))
    }
    const remaining = await getRecentTraces(600)
    expect(remaining.length).toBe(500)
    expect(remaining.map(t => t.id)).not.toContain('evict-0')
    expect(remaining.map(t => t.id)).not.toContain('evict-2')
    expect(remaining.map(t => t.id)).toContain('evict-502')
  }, 30_000)

  it('getTraceSummary 空态全零', async () => {
    const s = await getTraceSummary()
    expect(s).toEqual({
      totalTraces: 0, avgFirstTokenMs: 0, avgTotalMs: 0,
      avgCostUsd: 0, totalCostUsd: 0, successRate: 0, toolCallCount: 0,
    })
  })

  it('getTraceSummary 聚合：均值取整/成本求和/成功率/工具计数', async () => {
    await saveTrace(trace({
      id: 'a', firstTokenMs: 100, totalMs: 400, costUsd: 0.02,
      success: true, toolCalls: [{ tool: 't1', args: {}, result: 'r', isError: false, durationMs: 5 }],
    }))
    await saveTrace(trace({
      id: 'b', firstTokenMs: 150, totalMs: 700, costUsd: 0.04, success: false,
    }))
    const s = await getTraceSummary()
    expect(s.totalTraces).toBe(2)
    expect(s.avgFirstTokenMs).toBe(125)
    expect(s.avgTotalMs).toBe(550)
    expect(s.avgCostUsd).toBeCloseTo(0.03)
    expect(s.totalCostUsd).toBeCloseTo(0.06)
    expect(s.successRate).toBe(0.5)
    expect(s.toolCallCount).toBe(1)
  })

  it('clearTraces 清空后读取为空', async () => {
    await saveTrace(trace({ id: 'x' }))
    await clearTraces()
    expect(await getRecentTraces()).toEqual([])
    expect(await getTrace('x')).toBeNull()
  })

  it('saveTrace 底层异常被吞（open onerror → reject → catch，不抛出）', async () => {
    const bad = {
      open: () => {
        const r = { onsuccess: null as (() => void) | null, onerror: null as (() => void) | null, onupgradeneeded: null }
        queueMicrotask(() => r.onerror?.())
        return r
      },
    }
    setIDB(bad)
    await expect(saveTrace(trace({ id: 'never' }))).resolves.toBeUndefined()
    // getRecentTraces 异常 → []
    await expect(getRecentTraces()).resolves.toEqual([])
  })
})

describe('sanitizePrompt 脱敏', () => {
  it('sk- 长密钥与 Bearer 头脱敏', () => {
    const out = sanitizePrompt('key sk-abcdefghijklmnopqrstuvwxyz1234 and Bearer abc.def.ghi')
    expect(out).toContain('sk-[REDACTED]')
    expect(out).toContain('Bearer [REDACTED]')
    expect(out).not.toContain('abcdefghijklmnopqrstuvwxyz1234')
  })

  it('api_key= 与 apiKey: 两种写法脱敏', () => {
    expect(sanitizePrompt('api_key=secretvalue123')).toBe('api_key=[REDACTED]')
    expect(sanitizePrompt('API-KEY: mysecret')).not.toContain('mysecret')
  })

  it('超长截断到 200 字符', () => {
    expect(sanitizePrompt('x'.repeat(500)).length).toBe(200)
  })
})
