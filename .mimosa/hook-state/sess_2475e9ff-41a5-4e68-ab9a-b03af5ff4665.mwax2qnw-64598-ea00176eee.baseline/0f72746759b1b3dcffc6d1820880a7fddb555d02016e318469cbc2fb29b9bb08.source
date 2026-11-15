/**
 * @file performance-monitor.ts
 * @description 性能监控告警系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @updated 2026-04-04
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,monitoring,alerting
 */

/**
 * 性能指标类型
 */
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent' | 'fps'
  timestamp: number
  category: 'rendering' | 'network' | 'memory' | 'cpu' | 'custom'
  threshold?: {
    warning: number
    critical: number
  }
}

/**
 * 性能告警级别
 */
export type AlertLevel = 'info' | 'warning' | 'critical'

/**
 * 性能告警
 */
export interface PerformanceAlert {
  id: string
  metric: string
  value: number
  threshold: number
  level: AlertLevel
  message: string
  timestamp: number
  acknowledged: boolean
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  enabled: boolean
  sampleInterval: number
  alertCallbacks: Array<(alert: PerformanceAlert) => void>
  thresholds: Record<string, { warning: number; critical: number }>
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private alerts: PerformanceAlert[] = []
  private observers: PerformanceObserver[] = []
  private intervalId: number | null = null
  private frameTimes: number[] = []
  private lastFrameTime: number = 0

  constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = {
      enabled: true,
      sampleInterval: 2000,
      alertCallbacks: [],
      thresholds: {
        'render-time': { warning: 16, critical: 33 },
        'fps': { warning: 30, critical: 20 },
        'memory-used': { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 },
        'api-response-time': { warning: 1000, critical: 3000 },
        'bundle-size': { warning: 5 * 1024 * 1024, critical: 10 * 1024 * 1024 },
        'long-task': { warning: 50, critical: 100 },
        ...config?.thresholds,
      },
      ...config,
    }
  }

  /**
   * 启动性能监控
   */
  start(): void {
    if (!this.config.enabled) return

    this.observePerformanceAPI()
    this.startFPSMonitor()
    this.startMemoryMonitor()
    this.startLongTaskMonitor()
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    if (this.intervalId !== null) {
      cancelAnimationFrame(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 记录自定义指标
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    }

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, [])
    }

    this.metrics.get(metric.name)!.push(fullMetric)

    // 检查阈值
    this.checkThreshold(fullMetric)
  }

  /**
   * 测量函数执行时间
   */
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      category: 'custom',
    })

    return result
  }

  /**
   * 测量异步函数执行时间
   */
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      category: 'custom',
    })

    return result
  }

  /**
   * 获取指标历史
   */
  getMetricHistory(name: string, limit?: number): PerformanceMetric[] {
    const history = this.metrics.get(name) || []
    return limit ? history.slice(-limit) : history
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics)
  }

  /**
   * 获取告警历史
   */
  getAlerts(acknowledged?: boolean): PerformanceAlert[] {
    if (acknowledged === undefined) {
      return [...this.alerts]
    }
    return this.alerts.filter(a => a.acknowledged === acknowledged)
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  /**
   * 清除已确认的告警
   */
  clearAcknowledgedAlerts(): void {
    this.alerts = this.alerts.filter(a => !a.acknowledged)
  }

  /**
   * 添加告警回调
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.config.alertCallbacks.push(callback)
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    summary: Record<string, { avg: number; min: number; max: number; count: number }>
    alerts: { total: number; unacknowledged: number; byLevel: Record<AlertLevel, number> }
    recommendations: string[]
  } {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {}

    for (const [name, metrics] of this.metrics) {
      const values = metrics.map(m => m.value)
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      }
    }

    const unacknowledgedAlerts = this.alerts.filter(a => !a.acknowledged)
    const byLevel: Record<AlertLevel, number> = { info: 0, warning: 0, critical: 0 }
    this.alerts.forEach(a => byLevel[a.level]++)

    const recommendations = this.generateRecommendations(summary)

    return {
      summary,
      alerts: {
        total: this.alerts.length,
        unacknowledged: unacknowledgedAlerts.length,
        byLevel,
      },
      recommendations,
    }
  }

  /**
   * 清除所有告警
   */
  clearAllAlerts(): void {
    this.alerts = []
  }

  /**
   * 观察Performance API
   */
  private observePerformanceAPI(): void {
    // 观察导航计时
    if (PerformanceObserver.supportedEntryTypes.includes('navigation')) {
      const navObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric({
              name: 'page-load-time',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: 'ms',
              category: 'network',
            })
            this.recordMetric({
              name: 'dom-content-loaded',
              value: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              unit: 'ms',
              category: 'rendering',
            })
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)
    }

    // 观察资源计时
    if (PerformanceObserver.supportedEntryTypes.includes('resource')) {
      const resourceObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
              this.recordMetric({
                name: 'api-response-time',
                value: resourceEntry.duration,
                unit: 'ms',
                category: 'network',
              })
            }
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    }
  }

  /**
   * 启动FPS监控
   */
  private startFPSMonitor(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime
        this.frameTimes.push(frameTime)

        // 保留最近60帧
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift()
        }

        // 每秒计算一次FPS
        if (this.frameTimes.length === 60) {
          const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
          const fps = 1000 / avgFrameTime

          this.recordMetric({
            name: 'fps',
            value: fps,
            unit: 'fps',
            category: 'rendering',
          })
        }
      }

      this.lastFrameTime = timestamp
      this.intervalId = requestAnimationFrame(measureFPS)
    }

    this.intervalId = requestAnimationFrame(measureFPS)
  }

  /**
   * 启动内存监控
   */
  private startMemoryMonitor(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
        this.recordMetric({
          name: 'memory-used',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: 'memory',
        })
        this.recordMetric({
          name: 'memory-total',
          value: memory.totalJSHeapSize,
          unit: 'bytes',
          category: 'memory',
        })
      }, this.config.sampleInterval)
    }
  }

  /**
   * 启动长任务监控
   */
  private startLongTaskMonitor(): void {
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      const longTaskObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              unit: 'ms',
              category: 'cpu',
            })
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    }
  }

  /**
   * 检查阈值
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.config.thresholds[metric.name]
    if (!threshold) return

    let level: AlertLevel | null = null
    if (metric.value >= threshold.critical) {
      level = 'critical'
    } else if (metric.value >= threshold.warning) {
      level = 'warning'
    }

    if (level) {
      const alert: PerformanceAlert = {
        id: `${metric.name}-${Date.now()}`,
        metric: metric.name,
        value: metric.value,
        threshold: level === 'critical' ? threshold.critical : threshold.warning,
        level,
        message: `${metric.name} exceeded ${level} threshold: ${metric.value} ${metric.unit}`,
        timestamp: Date.now(),
        acknowledged: false,
      }

      this.alerts.push(alert)
      this.config.alertCallbacks.forEach(cb => cb(alert))
    }
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(summary: Record<string, { avg: number; min: number; max: number; count: number }>): string[] {
    const recommendations: string[] = []

    if (summary['fps'] && summary['fps'].avg < 30) {
      recommendations.push('FPS低于30，建议优化渲染性能，检查是否有不必要的重渲染')
    }

    if (summary['memory-used'] && summary['memory-used'].avg > 100 * 1024 * 1024) {
      recommendations.push('内存使用超过100MB，建议检查是否有内存泄漏或优化数据结构')
    }

    if (summary['api-response-time'] && summary['api-response-time'].avg > 1000) {
      recommendations.push('API响应时间超过1秒，建议优化网络请求或添加缓存')
    }

    if (summary['long-task'] && summary['long-task'].count > 10) {
      recommendations.push('检测到多个长任务，建议使用Web Worker或代码分割优化')
    }

    if (summary['page-load-time'] && summary['page-load-time'].avg > 3000) {
      recommendations.push('页面加载时间超过3秒，建议优化资源加载和代码分割')
    }

    return recommendations
  }
}

/**
 * 默认性能监控器实例
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * React Hook: 使用性能监控
 */
export function usePerformanceMonitor() {
  return {
    recordMetric: (metric: Omit<PerformanceMetric, 'timestamp'>) => performanceMonitor.recordMetric(metric),
    measureTime: <T,>(name: string, fn: () => T) => performanceMonitor.measureTime(name, fn),
    measureTimeAsync: <T,>(name: string, fn: () => Promise<T>) => performanceMonitor.measureTimeAsync(name, fn),
    getMetricHistory: (name: string, limit?: number) => performanceMonitor.getMetricHistory(name, limit),
    getAlerts: (acknowledged?: boolean) => performanceMonitor.getAlerts(acknowledged),
    acknowledgeAlert: (alertId: string) => performanceMonitor.acknowledgeAlert(alertId),
    generateReport: () => performanceMonitor.generateReport(),
    onAlert: (callback: (alert: PerformanceAlert) => void) => performanceMonitor.onAlert(callback),
  }
}

/**
 * 性能装饰器：自动测量函数执行时间
 */
export function measurePerformance(name?: string) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const metricName = name || `${String(propertyKey)}-execution-time`

    descriptor.value = function (...args: unknown[]) {
      const start = performance.now()
      const result = originalMethod.apply(this, args)

      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.recordMetric({
            name: metricName,
            value: performance.now() - start,
            unit: 'ms',
            category: 'custom',
          })
        })
      }

      performanceMonitor.recordMetric({
        name: metricName,
        value: performance.now() - start,
        unit: 'ms',
        category: 'custom',
      })

      return result
    }

    return descriptor
  }
}
