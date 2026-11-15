/**
 * @file performance-store.ts
 * @description 性能监控Store，管理Core Web Vitals和组件性能数据
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,performance,monitoring,web-vitals
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * Core Web Vitals指标
 */
export interface CoreWebVitals {
  /** 累积布局偏移 (CLS) - 布局稳定性 */
  cls?: number
  /** 首次输入延迟 (FID) - 交互性 */
  fid?: number
  /** 与下一次绘制交互 (INP) - 交互响应性 */
  inp?: number
  /** 最大内容绘制 (LCP) - 加载性能 */
  lcp?: number
  /** 首次内容绘制 (FCP) - 首次渲染 */
  fcp?: number
  /** 首次字节时间 (TTFB) - 服务器响应 */
  ttfb?: number
}

/**
 * 组件性能指标
 */
export interface ComponentMetrics {
  /** 组件名称 */
  name: string
  /** 渲染时间 (ms) */
  renderTime: number
  /** 记录时间 */
  timestamp: number
  /** 渲染次数 */
  renderCount: number
}

/**
 * 性能优化建议
 */
export interface OptimizationSuggestion {
  /** 建议类型 */
  type: 'lazy-load' | 'memo' | 'virtualize' | 'code-split' | 'image-optimize' | 'reduce-bundle'
  /** 严重程度 */
  severity: 'critical' | 'warning' | 'info'
  /** 建议标题 */
  title: string
  /** 建议描述 */
  description: string
  /** 影响的组件/页面 */
  target: string
  /** 预期改善 */
  expectedImprovement?: string
  /** 是否已处理 */
  handled?: boolean
}

/**
 * API性能指标
 */
export interface APIMetrics {
  /** API端点 */
  endpoint: string
  /** 平均响应时间 (ms) */
  avg: number
  /** P95响应时间 (ms) */
  p95: number
  /** P99响应时间 (ms) */
  p99: number
  /** 调用次数 */
  calls: number
  /** 错误次数 */
  errors: number
  /** 最后更新时间 */
  lastUpdate: number
}

/**
 * 系统资源指标
 */
export interface SystemMetrics {
  /** CPU使用率 (%) */
  cpu: number
  /** 内存使用率 (%) */
  memory: number
  /** 网络延迟 (ms) */
  latency: number
  /** 网络速度 (MB/s) */
  networkSpeed: number
  /** 最后更新时间 */
  timestamp: number
}

/**
 * 性能监控Store状态
 */
interface PerformanceStoreState {
  /** Core Web Vitals数据 */
  webVitals: CoreWebVitals
  /** 组件性能历史记录 */
  componentMetrics: ComponentMetrics[]
  /** 性能优化建议列表 */
  suggestions: OptimizationSuggestion[]
  /** API性能指标 */
  apiMetrics: Map<string, APIMetrics>
  /** 系统资源历史记录 */
  systemMetricsHistory: SystemMetrics[]
  /** 是否正在监控 */
  isMonitoring: boolean
  /** 性能评分 (0-100) */
  performanceScore: number
}

/**
 * 性能监控Store操作
 */
interface PerformanceStoreActions {
  /** 更新Web Vitals指标 */
  updateWebVital: (metric: keyof CoreWebVitals, value: number) => void
  /** 记录组件渲染性能 */
  recordComponentRender: (name: string, renderTime: number) => void
  /** 清除组件性能记录 */
  clearComponentMetrics: () => void
  /** 添加性能优化建议 */
  addSuggestion: (suggestion: Omit<OptimizationSuggestion, 'handled'>) => void
  /** 标记建议已处理 */
  markSuggestionHandled: (target: string) => void
  /** 清除所有建议 */
  clearSuggestions: () => void
  /** 更新API指标 */
  updateAPIMetrics: (endpoint: string, responseTime: number, error?: boolean) => void
  /** 清除API指标 */
  clearAPIMetrics: () => void
  /** 记录系统指标 */
  recordSystemMetrics: (metrics: Omit<SystemMetrics, 'timestamp'>) => void
  /** 清除系统指标历史 */
  clearSystemMetrics: () => void
  /** 开始监控 */
  startMonitoring: () => void
  /** 停止监控 */
  stopMonitoring: () => void
  /** 计算性能评分 */
  calculatePerformanceScore: () => number
  /** 获取慢组件列表 (渲染时间 > 16ms) */
  getSlowComponents: () => ComponentMetrics[]
  /** 获取性能趋势 (最近N次记录) */
  getPerformanceTrend: (limit?: number) => SystemMetrics[]
}

/**
 * 性能监控Store
 */
export const usePerformanceStore = create<PerformanceStoreState & PerformanceStoreActions>()(
  immer((set, get) => ({
    // 初始状态
    webVitals: {},
    componentMetrics: [],
    suggestions: [],
    apiMetrics: new Map(),
    systemMetricsHistory: [],
    isMonitoring: false,
    performanceScore: 0,

    // 更新Web Vitals指标
    updateWebVital: (metric, value) => {
      set((state) => {
        state.webVitals[metric] = value
        state.performanceScore = calculatePerformanceScoreHelper(state.webVitals)
        analyzePerformanceAndSuggest(state)
      })
    },

    // 记录组件渲染性能
    recordComponentRender: (name, renderTime) => {
      set((state) => {
        const existingIndex = state.componentMetrics.findIndex((m) => m.name === name)
        if (existingIndex >= 0) {
          state.componentMetrics[existingIndex].renderTime = renderTime
          state.componentMetrics[existingIndex].timestamp = Date.now()
          state.componentMetrics[existingIndex].renderCount += 1
        } else {
          state.componentMetrics.push({
            name,
            renderTime,
            timestamp: Date.now(),
            renderCount: 1,
          })
        }

        // 慢组件检测（>16ms，即低于60fps）
        if (renderTime > 16) {
          const existingSuggestion = state.suggestions.find((s) => s.target === name && s.type === 'memo')
          if (!existingSuggestion) {
            state.suggestions.push({
              type: 'memo',
              severity: renderTime > 50 ? 'critical' : 'warning',
              title: `慢组件检测: ${name}`,
              description: `组件 ${name} 渲染耗时 ${renderTime.toFixed(2)}ms，超过16ms阈值，建议使用React.memo优化`,
              target: name,
              expectedImprovement: '渲染时间减少30-70%',
            })
          }
        }
      })
    },

    // 清除组件性能记录
    clearComponentMetrics: () => {
      set((state) => {
        state.componentMetrics = []
      })
    },

    // 添加性能优化建议
    addSuggestion: (suggestion) => {
      set((state) => {
        const exists = state.suggestions.some(
          (s) => s.target === suggestion.target && s.type === suggestion.type
        )
        if (!exists) {
          state.suggestions.push({ ...suggestion, handled: false })
        }
      })
    },

    // 标记建议已处理
    markSuggestionHandled: (target) => {
      set((state) => {
        const suggestion = state.suggestions.find((s) => s.target === target)
        if (suggestion) {
          suggestion.handled = true
        }
      })
    },

    // 清除所有建议
    clearSuggestions: () => {
      set((state) => {
        state.suggestions = []
      })
    },

    // 更新API指标
    updateAPIMetrics: (endpoint, responseTime, error = false) => {
      set((state) => {
        let metrics = state.apiMetrics.get(endpoint)
        if (!metrics) {
          metrics = {
            endpoint,
            avg: responseTime,
            p95: responseTime,
            p99: responseTime,
            calls: 0,
            errors: 0,
            lastUpdate: Date.now(),
          }
          state.apiMetrics.set(endpoint, metrics)
        }

        // 更新统计数据
        metrics.calls += 1
        if (error) metrics.errors += 1

        // 移动平均 (简单实现)
        metrics.avg = metrics.avg * 0.9 + responseTime * 0.1

        // P95/P99估算 (简化实现)
        if (responseTime > metrics.p99) metrics.p99 = responseTime
        else if (responseTime > metrics.p95) metrics.p95 = responseTime

        metrics.lastUpdate = Date.now()

        // 慢API检测
        if (metrics.avg > 2000) {
          const existingSuggestion = state.suggestions.find(
            (s) => s.target === endpoint && s.type === 'code-split'
          )
          if (!existingSuggestion) {
            state.suggestions.push({
              type: 'code-split',
              severity: metrics.avg > 5000 ? 'critical' : 'warning',
              title: `慢API检测: ${endpoint}`,
              description: `API ${endpoint} 平均响应时间 ${metrics.avg.toFixed(0)}ms，建议优化或使用缓存`,
              target: endpoint,
              expectedImprovement: '响应时间减少50-80%',
            })
          }
        }
      })
    },

    // 清除API指标
    clearAPIMetrics: () => {
      set((state) => {
        state.apiMetrics.clear()
      })
    },

    // 记录系统指标
    recordSystemMetrics: (metrics) => {
      set((state) => {
        const newMetrics: SystemMetrics = {
          ...metrics,
          timestamp: Date.now(),
        }
        state.systemMetricsHistory.push(newMetrics)

        // 保留最近100条记录
        if (state.systemMetricsHistory.length > 100) {
          state.systemMetricsHistory = state.systemMetricsHistory.slice(-100)
        }
      })
    },

    // 清除系统指标历史
    clearSystemMetrics: () => {
      set((state) => {
        state.systemMetricsHistory = []
      })
    },

    // 开始监控
    startMonitoring: () => {
      set((state) => {
        state.isMonitoring = true
      })
    },

    // 停止监控
    stopMonitoring: () => {
      set((state) => {
        state.isMonitoring = false
      })
    },

    // 计算性能评分
    calculatePerformanceScore: () => {
      return get().performanceScore
    },

    // 获取慢组件列表
    getSlowComponents: () => {
      return get()
        .componentMetrics.filter((m) => m.renderTime > 16)
        .sort((a, b) => b.renderTime - a.renderTime)
    },

    // 获取性能趋势
    getPerformanceTrend: (limit = 30) => {
      return get().systemMetricsHistory.slice(-limit)
    },
  }))
)

/**
 * 计算性能评分辅助函数
 */
function calculatePerformanceScoreHelper(vitals: CoreWebVitals): number {
  let score = 100

  // CLS评分 (最好<0.1, 良好<0.25)
  if (vitals.cls !== undefined) {
    if (vitals.cls <= 0.1) score -= 0
    else if (vitals.cls <= 0.25) score -= (vitals.cls - 0.1) * 200
    else score -= 30 + (vitals.cls - 0.25) * 100
  }

  // FID/INP评分 (最好<100ms, 良好<200ms)
  const inputDelay = vitals.inp ?? vitals.fid
  if (inputDelay !== undefined) {
    if (inputDelay <= 100) score -= 0
    else if (inputDelay <= 200) score -= (inputDelay - 100) * 0.2
    else score -= 20 + (inputDelay - 200) * 0.1
  }

  // LCP评分 (最好<2.5s, 良好<4s)
  if (vitals.lcp !== undefined) {
    if (vitals.lcp <= 2500) score -= 0
    else if (vitals.lcp <= 4000) score -= (vitals.lcp - 2500) * 0.02
    else score -= 30 + (vitals.lcp - 4000) * 0.01
  }

  // FCP评分 (最好<1.8s, 良好<3s)
  if (vitals.fcp !== undefined) {
    if (vitals.fcp <= 1800) score -= 0
    else if (vitals.fcp <= 3000) score -= (vitals.fcp - 1800) * 0.03
    else score -= 36 + (vitals.fcp - 3000) * 0.02
  }

  // TTFB评分 (最好<800ms, 良好<1600ms)
  if (vitals.ttfb !== undefined) {
    if (vitals.ttfb <= 800) score -= 0
    else if (vitals.ttfb <= 1600) score -= (vitals.ttfb - 800) * 0.05
    else score -= 40 + (vitals.ttfb - 1600) * 0.03
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * 分析性能并生成建议
 */
function analyzePerformanceAndSuggest(state: PerformanceStoreState & { suggestions: OptimizationSuggestion[] }) {
  const vitals = state.webVitals

  // CLS建议
  if (vitals.cls !== undefined && vitals.cls > 0.25) {
    const existing = state.suggestions.find((s) => s.type === 'lazy-load' && s.severity === 'critical')
    if (!existing) {
      state.suggestions.push({
        type: 'lazy-load',
        severity: 'critical',
        title: '布局偏移过高',
        description: `累积布局偏移(CLS)为${vitals.cls.toFixed(3)}，超过0.25阈值，建议为图片和动态内容添加尺寸属性`,
        target: 'global',
        expectedImprovement: 'CLS减少60-80%',
      })
    }
  }

  // LCP建议
  if (vitals.lcp !== undefined && vitals.lcp > 4000) {
    const existing = state.suggestions.find((s) => s.type === 'image-optimize' && s.severity === 'warning')
    if (!existing) {
      state.suggestions.push({
        type: 'image-optimize',
        severity: 'warning',
        title: '加载速度慢',
        description: `最大内容绘制(LCP)为${(vitals.lcp / 1000).toFixed(1)}s，建议优化图片格式和大小`,
        target: 'global',
        expectedImprovement: 'LCP减少30-50%',
      })
    }
  }
}
