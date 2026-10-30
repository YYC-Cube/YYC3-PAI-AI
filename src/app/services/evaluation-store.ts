/**
 * @file evaluation-store.ts
 * @description E1-2 评估基线 — AI 回复质量追踪 + 用户满意度 + 自动评估指标
 *
 * 对标：Langfuse datasets/experiments + OpenHands 评估（本地版）
 *
 * 三层评估：
 *   1. 用户显式反馈（👍/👎 + 可选文字）
 *   2. 自动质量指标（延迟/长度/信息密度/代码块数/错误率）
 *   3. 时间窗口聚合（按天/周出趋势）
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags evaluation,baseline,quality,score,phase-e1
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('evaluation-store')
const LS_KEY = 'yyc3_eval_records'
const MAX_RECORDS = 1000

// ===== Types =====

export type UserFeedback = 'positive' | 'negative' | null

export interface EvaluationRecord {
  id: string
  traceId?: string
  timestamp: number
  /** 用户消息前 100 字符 */
  promptPreview: string
  /** AI 回复前 500 字符 */
  completionPreview: string
  /** 用户显式反馈 */
  feedback: UserFeedback
  /** 可选：用户文字反馈 */
  feedbackComment?: string
  /** 自动指标 */
  metrics: {
    responseLength: number
    codeBlockCount: number
    hasError: boolean
    latencyMs: number
    firstTokenMs: number
    /** 信息密度 = 非空白字符 / 总字符 */
    informationDensity: number
    /** 是否包含结构化输出（JSON/表格/列表） */
    hasStructuredOutput: boolean
  }
  /** 模型信息 */
  model: string
  provider: string
}

export interface EvaluationSummary {
  total: number
  positiveRate: number
  avgLatencyMs: number
  avgResponseLength: number
  avgCodeBlocks: number
  avgInformationDensity: number
  structuredOutputRate: number
  errorRate: number
  /** 按天趋势 */
  dailyTrend: Array<{ date: string; count: number; positiveRate: number; avgLatencyMs: number }>
}

// ===== Storage (localStorage — 轻量，评估记录不大) =====

function load(): EvaluationRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(records: EvaluationRecord[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(records.slice(-MAX_RECORDS)))
  } catch { /* quota exceeded */ }
}

// ===== 自动指标计算 =====

/**
 * 从 AI 回复文本自动计算质量指标
 */
export function computeMetrics(completion: string, latencyMs: number, firstTokenMs: number): EvaluationRecord['metrics'] {
  const total = completion.length
  const nonWhitespace = completion.replace(/\s/g, '').length
  const codeBlocks = (completion.match(/```[\s\S]*?```/g) || []).length
  const hasError = /\b(error|failed|cannot|unable)\b/i.test(completion)
  const hasStructured = /\{[\s\S]*\}/.test(completion) || /\|.*\|/.test(completion) || /^\s*[-*]\s/gm.test(completion)

  return {
    responseLength: total,
    codeBlockCount: codeBlocks,
    hasError,
    latencyMs,
    firstTokenMs,
    informationDensity: total > 0 ? nonWhitespace / total : 0,
    hasStructuredOutput: hasStructured,
  }
}

/**
 * 自动质量评分（0-100，基于多指标加权）
 */
export function autoScore(metrics: EvaluationRecord['metrics']): number {
  let score = 50 // 基础分

  // 延迟（低延迟加分）
  if (metrics.latencyMs < 1000) score += 15
  else if (metrics.latencyMs < 3000) score += 10
  else if (metrics.latencyMs > 10000) score -= 10

  // 信息密度（内容充实加分）
  if (metrics.informationDensity > 0.5) score += 10
  else if (metrics.informationDensity < 0.2) score -= 5

  // 代码块（技术回复加分）
  if (metrics.codeBlockCount > 0) score += 10

  // 结构化输出（清晰回复加分）
  if (metrics.hasStructuredOutput) score += 5

  // 错误标记（扣分）
  if (metrics.hasError) score -= 15

  // 长度适中（过短扣分，过长也扣）
  if (metrics.responseLength < 10) score -= 20
  else if (metrics.responseLength > 5000) score -= 5

  return Math.max(0, Math.min(100, score))
}

// ===== Public API =====

/**
 * 记录一次 AI 交互的评估数据
 */
export function recordEvaluation(params: {
  traceId?: string
  prompt: string
  completion: string
  latencyMs: number
  firstTokenMs: number
  model: string
  provider: string
  feedback?: UserFeedback
}): EvaluationRecord {
  const metrics = computeMetrics(params.completion, params.latencyMs, params.firstTokenMs)
  const record: EvaluationRecord = {
    id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    traceId: params.traceId,
    timestamp: Date.now(),
    promptPreview: params.prompt.slice(0, 100),
    completionPreview: params.completion.slice(0, 500),
    feedback: params.feedback ?? null,
    metrics,
    model: params.model,
    provider: params.provider,
  }

  const records = load()
  records.push(record)
  save(records)

  logger.info('Evaluation recorded', { id: record.id, autoScore: autoScore(metrics) })
  return record
}

/**
 * 更新用户反馈（👍/👎）
 */
export function updateFeedback(recordId: string, feedback: UserFeedback, comment?: string): void {
  const records = load()
  const idx = records.findIndex(r => r.id === recordId)
  if (idx >= 0) {
    records[idx].feedback = feedback
    if (comment !== undefined) records[idx].feedbackComment = comment
    save(records)
  }
}

/**
 * 获取评估摘要（含按天趋势）
 */
export function getEvaluationSummary(): EvaluationSummary {
  const records = load()
  if (!records.length) {
    return { total: 0, positiveRate: 0, avgLatencyMs: 0, avgResponseLength: 0, avgCodeBlocks: 0, avgInformationDensity: 0, structuredOutputRate: 0, errorRate: 0, dailyTrend: [] }
  }

  const n = records.length
  const withFeedback = records.filter(r => r.feedback !== null)

  // 按天聚合
  const dayMap = new Map<string, EvaluationRecord[]>()
  for (const r of records) {
    const day = new Date(r.timestamp).toISOString().slice(0, 10)
    if (!dayMap.has(day)) dayMap.set(day, [])
    dayMap.get(day)!.push(r)
  }

  const dailyTrend = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRecords]) => {
      const dayFeedback = dayRecords.filter(r => r.feedback !== null)
      return {
        date,
        count: dayRecords.length,
        positiveRate: dayFeedback.length > 0
          ? dayFeedback.filter(r => r.feedback === 'positive').length / dayFeedback.length
          : 0,
        avgLatencyMs: Math.round(dayRecords.reduce((s, r) => s + r.metrics.latencyMs, 0) / dayRecords.length),
      }
    })

  return {
    total: n,
    positiveRate: withFeedback.length > 0
      ? withFeedback.filter(r => r.feedback === 'positive').length / withFeedback.length
      : 0,
    avgLatencyMs: Math.round(records.reduce((s, r) => s + r.metrics.latencyMs, 0) / n),
    avgResponseLength: Math.round(records.reduce((s, r) => s + r.metrics.responseLength, 0) / n),
    avgCodeBlocks: records.reduce((s, r) => s + r.metrics.codeBlockCount, 0) / n,
    avgInformationDensity: records.reduce((s, r) => s + r.metrics.informationDensity, 0) / n,
    structuredOutputRate: records.filter(r => r.metrics.hasStructuredOutput).length / n,
    errorRate: records.filter(r => r.metrics.hasError).length / n,
    dailyTrend,
  }
}

/**
 * 获取最近的评估记录
 */
export function getRecentEvaluations(limit = 20): EvaluationRecord[] {
  return load().slice(-limit).reverse()
}

/**
 * 清空评估记录
 */
export function clearEvaluations(): void {
  localStorage.removeItem(LS_KEY)
}
