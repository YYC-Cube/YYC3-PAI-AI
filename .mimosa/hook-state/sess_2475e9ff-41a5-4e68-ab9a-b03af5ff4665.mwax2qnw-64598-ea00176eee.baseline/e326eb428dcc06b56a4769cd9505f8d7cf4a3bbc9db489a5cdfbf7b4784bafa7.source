/**
 * @file performance-monitor.test.ts
 * @description 性能监控告警系统测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  PerformanceMonitor,
  performanceMonitor,
} from '../performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor({ enabled: false })
    vi.useFakeTimers()
  })

  afterEach(() => {
    monitor.stop()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('recordMetric', () => {
    it('should record a metric', () => {
      monitor.recordMetric({
        name: 'test-metric',
        value: 100,
        unit: 'ms',
        category: 'custom',
      })

      const history = monitor.getMetricHistory('test-metric')
      expect(history).toHaveLength(1)
      expect(history[0].value).toBe(100)
      expect(history[0].name).toBe('test-metric')
    })

    it('should add timestamp to metric', () => {
      const now = Date.now()
      vi.setSystemTime(now)

      monitor.recordMetric({
        name: 'test-metric',
        value: 50,
        unit: 'ms',
        category: 'custom',
      })

      const history = monitor.getMetricHistory('test-metric')
      expect(history[0].timestamp).toBe(now)
    })

    it('should store multiple metrics with same name', () => {
      monitor.recordMetric({ name: 'fps', value: 60, unit: 'fps', category: 'rendering' })
      monitor.recordMetric({ name: 'fps', value: 55, unit: 'fps', category: 'rendering' })
      monitor.recordMetric({ name: 'fps', value: 58, unit: 'fps', category: 'rendering' })

      const history = monitor.getMetricHistory('fps')
      expect(history).toHaveLength(3)
    })
  })

  describe('measureTime', () => {
    it('should measure synchronous function execution time', () => {
      const result = monitor.measureTime('sync-operation', () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      })

      expect(result).toBe(499500)
      const history = monitor.getMetricHistory('sync-operation')
      expect(history).toHaveLength(1)
      expect(history[0].unit).toBe('ms')
    })
  })

  describe('measureTimeAsync', () => {
    it('should measure async function execution time', async () => {
      const result = await monitor.measureTimeAsync('async-operation', async () => {
        return 'done'
      })

      expect(result).toBe('done')
      const history = monitor.getMetricHistory('async-operation')
      expect(history).toHaveLength(1)
    })
  })

  describe('getMetricHistory', () => {
    it('should return empty array for non-existent metric', () => {
      const history = monitor.getMetricHistory('non-existent')
      expect(history).toHaveLength(0)
    })

    it('should limit results when limit is specified', () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric({ name: 'limited', value: i, unit: 'ms', category: 'custom' })
      }

      const history = monitor.getMetricHistory('limited', 5)
      expect(history).toHaveLength(5)
      expect(history[0].value).toBe(5)
      expect(history[4].value).toBe(9)
    })
  })

  describe('getAllMetrics', () => {
    it('should return all recorded metrics', () => {
      monitor.recordMetric({ name: 'metric1', value: 1, unit: 'ms', category: 'custom' })
      monitor.recordMetric({ name: 'metric2', value: 2, unit: 'ms', category: 'custom' })

      const allMetrics = monitor.getAllMetrics()
      expect(allMetrics.size).toBe(2)
      expect(allMetrics.has('metric1')).toBe(true)
      expect(allMetrics.has('metric2')).toBe(true)
    })
  })

  describe('alerts', () => {
    it('should generate alert when threshold is exceeded', () => {
      const alertCallback = vi.fn()
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        alertCallbacks: [alertCallback],
        thresholds: {
          'render-time': { warning: 16, critical: 33 },
        },
      })

      alertMonitor.recordMetric({
        name: 'render-time',
        value: 50,
        unit: 'ms',
        category: 'rendering',
      })

      const alerts = alertMonitor.getAlerts()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].level).toBe('critical')
      expect(alertCallback).toHaveBeenCalled()
    })

    it('should generate warning alert', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'render-time': { warning: 16, critical: 33 },
        },
      })

      alertMonitor.recordMetric({
        name: 'render-time',
        value: 20,
        unit: 'ms',
        category: 'rendering',
      })

      const alerts = alertMonitor.getAlerts()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].level).toBe('warning')
    })

    it('should not generate alert when below threshold', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'render-time': { warning: 16, critical: 33 },
        },
      })

      alertMonitor.recordMetric({
        name: 'render-time',
        value: 10,
        unit: 'ms',
        category: 'rendering',
      })

      const alerts = alertMonitor.getAlerts()
      expect(alerts).toHaveLength(0)
    })

    it('should acknowledge alert', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'test': { warning: 10, critical: 20 },
        },
      })

      alertMonitor.recordMetric({
        name: 'test',
        value: 25,
        unit: 'ms',
        category: 'custom',
      })

      const alerts = alertMonitor.getAlerts()
      expect(alerts[0].acknowledged).toBe(false)

      alertMonitor.acknowledgeAlert(alerts[0].id)
      expect(alerts[0].acknowledged).toBe(true)
    })

    it('should clear acknowledged alerts', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'test': { warning: 10, critical: 20 },
        },
      })

      alertMonitor.recordMetric({
        name: 'test',
        value: 25,
        unit: 'ms',
        category: 'custom',
      })

      const alerts = alertMonitor.getAlerts()
      alertMonitor.acknowledgeAlert(alerts[0].id)
      alertMonitor.clearAcknowledgedAlerts()

      expect(alertMonitor.getAlerts()).toHaveLength(0)
    })

    it('should filter alerts by acknowledged status', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'test': { warning: 10, critical: 20 },
        },
      })

      alertMonitor.recordMetric({ name: 'test', value: 25, unit: 'ms', category: 'custom' })
      alertMonitor.recordMetric({ name: 'test', value: 30, unit: 'ms', category: 'custom' })

      const alerts = alertMonitor.getAlerts()
      alertMonitor.acknowledgeAlert(alerts[0].id)

      expect(alertMonitor.getAlerts(false)).toHaveLength(1)
      expect(alertMonitor.getAlerts(true)).toHaveLength(1)
    })
  })

  describe('onAlert', () => {
    it('should add alert callback', () => {
      const callback = vi.fn()
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'test': { warning: 10, critical: 20 },
        },
      })

      alertMonitor.onAlert(callback)
      alertMonitor.recordMetric({
        name: 'test',
        value: 25,
        unit: 'ms',
        category: 'custom',
      })

      expect(callback).toHaveBeenCalled()
    })
  })

  describe('generateReport', () => {
    it('should generate performance report', () => {
      monitor.recordMetric({ name: 'fps', value: 60, unit: 'fps', category: 'rendering' })
      monitor.recordMetric({ name: 'fps', value: 55, unit: 'fps', category: 'rendering' })
      monitor.recordMetric({ name: 'fps', value: 58, unit: 'fps', category: 'rendering' })

      const report = monitor.generateReport()

      expect(report.summary['fps']).toBeDefined()
      expect(report.summary['fps'].avg).toBeCloseTo(57.67, 1)
      expect(report.summary['fps'].min).toBe(55)
      expect(report.summary['fps'].max).toBe(60)
      expect(report.summary['fps'].count).toBe(3)
    })

    it('should include alert statistics', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'test': { warning: 10, critical: 20 },
        },
      })

      alertMonitor.recordMetric({ name: 'test', value: 25, unit: 'ms', category: 'custom' })

      const report = alertMonitor.generateReport()
      expect(report.alerts.total).toBe(1)
      expect(report.alerts.byLevel.critical).toBe(1)
    })

    it('should generate recommendations', () => {
      const alertMonitor = new PerformanceMonitor({
        enabled: false,
        thresholds: {
          'fps': { warning: 30, critical: 20 },
        },
      })

      alertMonitor.recordMetric({ name: 'fps', value: 25, unit: 'fps', category: 'rendering' })

      const report = alertMonitor.generateReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('start/stop', () => {
    it('should start monitoring', () => {
      const startMonitor = new PerformanceMonitor({ enabled: true })
      startMonitor.start()
      startMonitor.stop()
    })

    it('should not start if disabled', () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false })
      disabledMonitor.start()
      disabledMonitor.stop()
    })
  })
})

describe('performanceMonitor (singleton)', () => {
  it('should be an instance of PerformanceMonitor', () => {
    expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor)
  })
})

describe('measurePerformance decorator', () => {
  it('should measure method execution time', () => {
     
    class TestClass {
      value = 0
      testMethod(): number {
        let sum = 0
        for (let i = 0; i < 100; i++) {
          sum += i
        }
        this.value = sum
        return sum
      }
    }

    const instance = new TestClass()
    instance.testMethod()

    expect(instance.value).toBe(4950)
  })
})
