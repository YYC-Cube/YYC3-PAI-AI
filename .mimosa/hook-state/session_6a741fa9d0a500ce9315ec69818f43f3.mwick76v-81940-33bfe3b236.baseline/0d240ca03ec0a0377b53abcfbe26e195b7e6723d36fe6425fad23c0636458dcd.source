/**
 * @file ai-metrics-store.ts
 * @description AI指标状态管理模块，管理AI性能指标
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,metrics,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== Performance Metrics =====
/** 单次请求性能记录 */
export interface PerformanceRecord {
  id: string
  providerId: string
  modelId: string
  modelName: string
  timestamp: number
  latencyMs: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  success: boolean
  errorType?: ErrorType
}

/** 聚合性能指标（按 provider:model 聚合） */
export interface AggregatedMetrics {
  providerId: string
  modelId: string
  modelName: string
  avgLatencyMs: number
  minLatencyMs: number
  maxLatencyMs: number
  p95LatencyMs: number
  throughput: number          // tokens/second
  successRate: number         // 0-1
  totalRequests: number
  errorCount: number
  lastRequestTime: number
}

// ===== Error Analysis =====
export type ErrorType = 'network' | 'api' | 'rate_limit' | 'authentication' | 'timeout' | 'unknown'

/** 错误分析记录 */
export interface ErrorRecord {
  id: string
  providerId: string
  providerName: string
  modelId: string
  modelName: string
  errorType: ErrorType
  errorMessage: string
  timestamp: number
  httpStatus?: number
  suggestions: string[]
}

/** 错误统计（按类型聚合） */
export interface ErrorStats {
  errorType: ErrorType
  count: number
  lastOccurrence: number
  affectedProviders: string[]
  affectedModels: string[]
  topSuggestion: string
}

// ===== Cost Tracking =====
/** 成本记录 */
export interface CostRecord {
  providerId: string
  providerName: string
  modelId: string
  modelName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number                // 折算 USD
  currency: string
  timestamp: number
}

/** 成本汇总（按 provider 聚合） */
export interface CostSummary {
  providerId: string
  providerName: string
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  currency: string
  requestCount: number
  models: {
    modelId: string
    modelName: string
    inputTokens: number
    outputTokens: number
    cost: number
  }[]
}

// ===== Provider Pricing =====
const PROVIDER_PRICING: Record<string, { input: number; output: number; currency: string }> = {
  'openai:gpt-4o': { input: 2.5, output: 10, currency: 'USD' },
  'openai:gpt-4o-mini': { input: 0.15, output: 0.6, currency: 'USD' },
  'openai:o3-mini': { input: 1.1, output: 4.4, currency: 'USD' },
  'openai:o4-mini': { input: 1.1, output: 4.4, currency: 'USD' },
  'claude:claude-sonnet-4-20250514': { input: 3, output: 15, currency: 'USD' },
  'claude:claude-3-5-haiku-20241022': { input: 0.8, output: 4, currency: 'USD' },
  'zhipu:glm-5': { input: 0.5, output: 0.5, currency: 'CNY' },
  'zhipu:glm-4.5': { input: 0.5, output: 0.5, currency: 'CNY' },
  'zhipu:glm-4.5-air': { input: 0.0, output: 0.0, currency: 'CNY' },
  'qwen:qwen3-max': { input: 0.5, output: 2, currency: 'CNY' },
  'qwen:qwen-plus': { input: 0.3, output: 1.2, currency: 'CNY' },
  'qwen:qwen3-coder-plus': { input: 0.3, output: 1.2, currency: 'CNY' },
  'deepseek:deepseek-chat': { input: 0.27, output: 1.1, currency: 'USD' },
  'deepseek:deepseek-reasoner': { input: 0.55, output: 2.19, currency: 'USD' },
}

// ===== Error Suggestions =====
const ERROR_SUGGESTIONS: Record<ErrorType, { zh: string[]; en: string[] }> = {
  network: {
    zh: ['检查网络连接是否正常', '确认 API 服务是否正常运行', '尝试使用 VPN 或代理', '检查防火墙设置'],
    en: ['Check network connection', 'Verify API service is running', 'Try using VPN or proxy', 'Check firewall settings'],
  },
  api: {
    zh: ['检查请求参数是否正确', '确认模型名称是否有效', '查看 API 文档了解最新变更', '验证请求格式'],
    en: ['Check request parameters', 'Verify model name is valid', 'Check API docs for changes', 'Validate request format'],
  },
  rate_limit: {
    zh: ['降低请求频率', '考虑升级 API 计划', '增加请求间隔时间', '使用多个 API 密钥负载均衡'],
    en: ['Reduce request frequency', 'Consider upgrading API plan', 'Increase request interval', 'Use multiple API keys for load balancing'],
  },
  authentication: {
    zh: ['检查 API 密钥是否正确', '确认 API 密钥是否已激活', '尝试重新生成 API 密钥', '检查密钥权限设置'],
    en: ['Check if API key is correct', 'Confirm API key is activated', 'Try regenerating API key', 'Check key permissions'],
  },
  timeout: {
    zh: ['检查网络延迟', '尝试选择低延迟的模型', '增加超时时间限制', '检查服务端是否过载'],
    en: ['Check network latency', 'Try a lower-latency model', 'Increase timeout limit', 'Check if service is overloaded'],
  },
  unknown: {
    zh: ['查看完整错误日志', '联系服务商技术支持', '尝试重启应用程序', '检查系统日志'],
    en: ['Check full error log', 'Contact provider support', 'Try restarting the application', 'Check system logs'],
  },
}

// ===== Store State =====
interface MetricsState {
  performanceRecords: PerformanceRecord[]
  errorRecords: ErrorRecord[]
  costRecords: CostRecord[]
}

const LS_METRICS = 'yyc3_ai_metrics'
const MAX_RECORDS = 500

function loadState(): MetricsState {
  try {
    const raw = localStorage.getItem(LS_METRICS)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        performanceRecords: parsed.performanceRecords || [],
        errorRecords: parsed.errorRecords || [],
        costRecords: parsed.costRecords || [],
      }
    }
  } catch { /* ignore */ }
  return { performanceRecords: [], errorRecords: [], costRecords: [] }
}

function saveState(state: MetricsState) {
  try {
    localStorage.setItem(LS_METRICS, JSON.stringify(state))
  } catch { /* ignore */ }
}

// ===== External Store (useSyncExternalStore) =====
let state: MetricsState = loadState()
const listeners = new Set<() => void>()

function emit() {
  saveState(state)
  listeners.forEach(fn => fn())
}

function genId() {
  return 'mr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

/**
 * 对错误消息进行分类
 */
export function classifyError(error: string, httpStatus?: number): ErrorType {
  const msg = error.toLowerCase()
  if (httpStatus === 401 || msg.includes('unauthorized') || msg.includes('authentication') || msg.includes('api key')) {
    return 'authentication'
  }
  if (httpStatus === 429 || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('rate_limit')) {
    return 'rate_limit'
  }
  if (msg.includes('timeout') || msg.includes('aborterror') || msg.includes('aborted')) {
    return 'timeout'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('econnrefused') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return 'network'
  }
  if (httpStatus && httpStatus >= 400) {
    return 'api'
  }
  return 'unknown'
}

/**
 * 获取错误类型的中文标签
 */
export function getErrorTypeLabel(type: ErrorType, locale: 'zh' | 'en' = 'zh'): string {
  const labels: Record<ErrorType, { zh: string; en: string }> = {
    network: { zh: '网络错误', en: 'Network Error' },
    api: { zh: 'API 错误', en: 'API Error' },
    rate_limit: { zh: '速率限制', en: 'Rate Limit' },
    authentication: { zh: '认证失败', en: 'Auth Error' },
    timeout: { zh: '请求超时', en: 'Timeout' },
    unknown: { zh: '未知错误', en: 'Unknown' },
  }
  return labels[type]?.[locale] || labels.unknown[locale]
}

// ===== Public API =====
export const aiMetricsStore = {
  /** 记录一次成功的 API 请求 */
  recordSuccess(params: {
    providerId: string
    modelId: string
    modelName: string
    latencyMs: number
    inputTokens?: number
    outputTokens?: number
  }) {
    const { providerId, modelId, modelName, latencyMs, inputTokens = 0, outputTokens = 0 } = params
    const totalTokens = inputTokens + outputTokens

    // Performance record
    const perfRecord: PerformanceRecord = {
      id: genId(),
      providerId,
      modelId,
      modelName,
      timestamp: Date.now(),
      latencyMs,
      inputTokens,
      outputTokens,
      totalTokens,
      success: true,
    }

    // Cost record
    const priceKey = `${providerId}:${modelId}`
    const pricing = PROVIDER_PRICING[priceKey]
    const costRecord: CostRecord = {
      providerId,
      providerName: providerId,
      modelId,
      modelName,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: pricing
        ? (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
        : 0,
      currency: pricing?.currency || 'USD',
      timestamp: Date.now(),
    }

    state = {
      ...state,
      performanceRecords: [...state.performanceRecords, perfRecord].slice(-MAX_RECORDS),
      costRecords: [...state.costRecords, costRecord].slice(-MAX_RECORDS),
    }
    emit()
  },

  /** 记录一次失败的 API 请求 */
  recordError(params: {
    providerId: string
    providerName: string
    modelId: string
    modelName: string
    latencyMs: number
    errorMessage: string
    httpStatus?: number
  }) {
    const { providerId, providerName, modelId, modelName, latencyMs, errorMessage, httpStatus } = params
    const errorType = classifyError(errorMessage, httpStatus)
    // store 层无 React 上下文：读 I18nProvider 持久化的 locale（缺省 zh）
    const locale = localStorage.getItem('yyc3-locale') === 'en' ? 'en' : 'zh'

    // Performance record
    const perfRecord: PerformanceRecord = {
      id: genId(),
      providerId,
      modelId,
      modelName,
      timestamp: Date.now(),
      latencyMs,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      success: false,
      errorType,
    }

    // Error record
    const errRecord: ErrorRecord = {
      id: genId(),
      providerId,
      providerName,
      modelId,
      modelName,
      errorType,
      errorMessage: errorMessage.slice(0, 500),
      timestamp: Date.now(),
      httpStatus,
      suggestions: ERROR_SUGGESTIONS[errorType]?.[locale] || ERROR_SUGGESTIONS.unknown[locale],
    }

    state = {
      ...state,
      performanceRecords: [...state.performanceRecords, perfRecord].slice(-MAX_RECORDS),
      errorRecords: [...state.errorRecords, errRecord].slice(-MAX_RECORDS),
    }
    emit()
  },

  /** 获取聚合性能指标 */
  getAggregatedMetrics(): AggregatedMetrics[] {
    const groups = new Map<string, PerformanceRecord[]>()
    for (const r of state.performanceRecords) {
      const key = `${r.providerId}:${r.modelId}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }

    const result: AggregatedMetrics[] = []
    for (const [, records] of groups) {
      const first = records[0]
      const latencies = records.filter(r => r.success).map(r => r.latencyMs).sort((a, b) => a - b)
      const successCount = records.filter(r => r.success).length
      const totalTokens = records.reduce((s, r) => s + r.totalTokens, 0)
      const totalLatency = latencies.reduce((s, l) => s + l, 0)

      result.push({
        providerId: first.providerId,
        modelId: first.modelId,
        modelName: first.modelName,
        avgLatencyMs: latencies.length ? Math.round(totalLatency / latencies.length) : 0,
        minLatencyMs: latencies.length ? latencies[0] : 0,
        maxLatencyMs: latencies.length ? latencies[latencies.length - 1] : 0,
        p95LatencyMs: latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0,
        throughput: totalLatency > 0 ? Math.round((totalTokens / (totalLatency / 1000)) * 100) / 100 : 0,
        successRate: records.length > 0 ? successCount / records.length : 0,
        totalRequests: records.length,
        errorCount: records.length - successCount,
        lastRequestTime: Math.max(...records.map(r => r.timestamp)),
      })
    }
    return result.sort((a, b) => b.lastRequestTime - a.lastRequestTime)
  },

  /** 获取错误统计 */
  getErrorStats(): ErrorStats[] {
    const groups = new Map<ErrorType, ErrorRecord[]>()
    for (const r of state.errorRecords) {
      if (!groups.has(r.errorType)) groups.set(r.errorType, [])
      groups.get(r.errorType)!.push(r)
    }

    const result: ErrorStats[] = []
    for (const [type, records] of groups) {
      result.push({
        errorType: type,
        count: records.length,
        lastOccurrence: Math.max(...records.map(r => r.timestamp)),
        affectedProviders: [...new Set(records.map(r => r.providerName))],
        affectedModels: [...new Set(records.map(r => r.modelName))],
        topSuggestion: records[records.length - 1]?.suggestions[0] || '',
      })
    }
    return result.sort((a, b) => b.count - a.count)
  },

  /** 获取成本汇总 */
  getCostSummaries(): CostSummary[] {
    const groups = new Map<string, CostRecord[]>()
    for (const r of state.costRecords) {
      if (!groups.has(r.providerId)) groups.set(r.providerId, [])
      groups.get(r.providerId)!.push(r)
    }

    const result: CostSummary[] = []
    for (const [providerId, records] of groups) {
      const modelGroups = new Map<string, CostRecord[]>()
      for (const r of records) {
        if (!modelGroups.has(r.modelId)) modelGroups.set(r.modelId, [])
        modelGroups.get(r.modelId)!.push(r)
      }

      const models = Array.from(modelGroups.entries()).map(([modelId, mrs]) => ({
        modelId,
        modelName: mrs[0].modelName,
        inputTokens: mrs.reduce((s, r) => s + r.inputTokens, 0),
        outputTokens: mrs.reduce((s, r) => s + r.outputTokens, 0),
        cost: mrs.reduce((s, r) => s + r.cost, 0),
      }))

      result.push({
        providerId,
        providerName: records[0].providerName,
        totalInputTokens: records.reduce((s, r) => s + r.inputTokens, 0),
        totalOutputTokens: records.reduce((s, r) => s + r.outputTokens, 0),
        totalCost: records.reduce((s, r) => s + r.cost, 0),
        currency: records[0].currency,
        requestCount: records.length,
        models,
      })
    }
    return result.sort((a, b) => b.totalCost - a.totalCost)
  },

  /** 获取最近的错误记录 */
  getRecentErrors(limit = 20): ErrorRecord[] {
    return state.errorRecords.slice(-limit).reverse()
  },

  /** 获取最近 N 小时的性能记录 */
  getRecentPerformance(hours = 1): PerformanceRecord[] {
    const since = Date.now() - hours * 60 * 60 * 1000
    return state.performanceRecords.filter(r => r.timestamp >= since)
  },

  /** 获取总成本 */
  getTotalCost(): { usd: number; cny: number } {
    let usd = 0
    let cny = 0
    for (const r of state.costRecords) {
      if (r.currency === 'CNY') cny += r.cost
      else usd += r.cost
    }
    return { usd, cny }
  },

  /** 清除所有指标数据 */
  clearAll() {
    state = { performanceRecords: [], errorRecords: [], costRecords: [] }
    emit()
  },

  /** 获取智能推荐的最佳 provider */
  getBestProvider(): { providerId: string; modelId: string; score: number } | null {
    const metrics = this.getAggregatedMetrics()
    if (metrics.length === 0) return null

    let best: AggregatedMetrics | null = null
    let bestScore = -Infinity

    for (const m of metrics) {
      if (m.totalRequests < 1) continue
      // 综合评分：成功率 (40%) + 吞吐量归一化 (30%) + 延迟归一化 (30%)
      const latencyScore = m.avgLatencyMs > 0 ? Math.max(0, 1 - m.avgLatencyMs / 10000) : 0.5
      const score = m.successRate * 0.4 + (m.throughput / 100) * 0.3 + latencyScore * 0.3
      if (score > bestScore) {
        bestScore = score
        best = m
      }
    }

    return best ? { providerId: best.providerId, modelId: best.modelId, score: bestScore } : null
  },

  /** 订阅状态变化 */
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },

  /** 获取快照（用于 useSyncExternalStore） */
  getSnapshot(): MetricsState {
    return state
  },
}

/** React Hook — 获取 AI 指标数据 */
export function useAIMetrics() {
  const snapshot = useSyncExternalStore(
    aiMetricsStore.subscribe,
    aiMetricsStore.getSnapshot
  )

  return {
    /** 原始数据 */
    performanceRecords: snapshot.performanceRecords,
    errorRecords: snapshot.errorRecords,
    costRecords: snapshot.costRecords,

    /** 聚合指标 */
    getAggregatedMetrics: aiMetricsStore.getAggregatedMetrics.bind(aiMetricsStore),
    getErrorStats: aiMetricsStore.getErrorStats.bind(aiMetricsStore),
    getCostSummaries: aiMetricsStore.getCostSummaries.bind(aiMetricsStore),
    getRecentErrors: aiMetricsStore.getRecentErrors.bind(aiMetricsStore),
    getRecentPerformance: aiMetricsStore.getRecentPerformance.bind(aiMetricsStore),
    getTotalCost: aiMetricsStore.getTotalCost.bind(aiMetricsStore),
    getBestProvider: aiMetricsStore.getBestProvider.bind(aiMetricsStore),
    clearAll: aiMetricsStore.clearAll.bind(aiMetricsStore),

    /** 记录 API */
    recordSuccess: aiMetricsStore.recordSuccess.bind(aiMetricsStore),
    recordError: aiMetricsStore.recordError.bind(aiMetricsStore),
  }
}
