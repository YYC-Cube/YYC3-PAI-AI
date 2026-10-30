/**
 * @file trace-store.ts
 * @description 请求级全链路追踪 — 单次 AI 请求的完整生命周期记录
 *
 * 对标：Langfuse trace 视图（本地简化版，Phase 1.3）
 *
 * 每条 trace 记录：prompt（脱敏）→ model → latency → tokens → cost → tool_calls → output
 * 存储：IndexedDB（保留最近 500 条）
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags trace,observability,phase-1
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('trace-store')
const DB_NAME = 'yyc3_trace'
const STORE = 'traces'
const MAX_TRACES = 500

// ===== Types =====

export interface TraceToolCall {
  tool: string
  args: Record<string, unknown>
  result: string
  isError: boolean
  durationMs: number
}

export interface TraceRecord {
  id: string
  timestamp: number
  /** 模型信息 */
  provider: string
  model: string
  /** 用户消息（脱敏后，前 200 字符） */
  promptPreview: string
  /** AI 完整回复 */
  completion: string
  /** 性能指标 */
  firstTokenMs: number
  totalMs: number
  inputTokens: number
  outputTokens: number
  /** 成本（估算） */
  costUsd: number
  /** 是否成功 */
  success: boolean
  errorMessage?: string
  /** 工具调用链（Agent 循环时） */
  toolCalls: TraceToolCall[]
  /** 循环次数 */
  iterations: number
}

export interface TraceSummary {
  totalTraces: number
  avgFirstTokenMs: number
  avgTotalMs: number
  avgCostUsd: number
  totalCostUsd: number
  successRate: number
  toolCallCount: number
}

// ===== IndexedDB 操作 =====

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ===== Public API =====

/** 生成 traceId */
export function newTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 保存 trace 记录（自动淘汰最老的） */
export async function saveTrace(record: TraceRecord): Promise<void> {
  try {
    await withStore('readwrite', store => store.put(record) as IDBRequest<IDBValidKey>)
    // 淘汰超限记录
    const count = await withStore('readonly', store => store.count())
    if (count > MAX_TRACES) {
      const all = await getRecentTraces(count)
      const toDelete = all.slice(MAX_TRACES)
      for (const t of toDelete) {
        await withStore('readwrite', store => store.delete(t.id) as unknown as IDBRequest<undefined>)
      }
    }
  } catch (e) {
    logger.warn('Failed to save trace', e as Error)
  }
}

/** 获取最近 N 条 trace */
export async function getRecentTraces(limit = 50): Promise<TraceRecord[]> {
  try {
    const all = await withStore('readonly', store => store.getAll() as IDBRequest<TraceRecord[]>)
    return (all as TraceRecord[])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  } catch {
    return []
  }
}

/** 获取单条 trace */
export async function getTrace(id: string): Promise<TraceRecord | null> {
  try {
    const result = await withStore('readonly', store => store.get(id) as IDBRequest<TraceRecord>)
    return result ?? null
  } catch {
    return null
  }
}

/** 获取统计摘要 */
export async function getTraceSummary(): Promise<TraceSummary> {
  const traces = await getRecentTraces(MAX_TRACES)
  if (!traces.length) {
    return { totalTraces: 0, avgFirstTokenMs: 0, avgTotalMs: 0, avgCostUsd: 0, totalCostUsd: 0, successRate: 0, toolCallCount: 0 }
  }
  const n = traces.length
  return {
    totalTraces: n,
    avgFirstTokenMs: Math.round(traces.reduce((s, t) => s + t.firstTokenMs, 0) / n),
    avgTotalMs: Math.round(traces.reduce((s, t) => s + t.totalMs, 0) / n),
    avgCostUsd: traces.reduce((s, t) => s + t.costUsd, 0) / n,
    totalCostUsd: traces.reduce((s, t) => s + t.costUsd, 0),
    successRate: traces.filter(t => t.success).length / n,
    toolCallCount: traces.reduce((s, t) => s + t.toolCalls.length, 0),
  }
}

/** 清空所有 trace */
export async function clearTraces(): Promise<void> {
  try {
    await withStore('readwrite', store => store.clear() as unknown as IDBRequest<undefined>)
  } catch { /* ignore */ }
}

/** 脱敏用户消息（保留前 200 字符，替换 API Key 等敏感模式） */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-[REDACTED]')
    .replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]')
    .replace(/api[_-]?key\s*[:=]\s*\S+/gi, 'api_key=[REDACTED]')
    .slice(0, 200)
}
