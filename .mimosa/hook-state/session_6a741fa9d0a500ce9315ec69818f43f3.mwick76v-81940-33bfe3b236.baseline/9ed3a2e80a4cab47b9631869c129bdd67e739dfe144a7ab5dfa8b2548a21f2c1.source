/**
 * @file model-performance-tracker.test.ts
 * @description 模型性能追踪器测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  trackModelSwitch,
  trackOllamaDetection,
  trackModelTest,
  trackModelImport,
  getPerformanceStats,
  getOllamaDetectionDistribution,
  getRecentEvents,
  clearPerformanceEvents,
  exportPerformanceData,
} from '../model-performance-tracker'
import { aiMetricsStore } from '../../store/ai-metrics-store'

vi.mock('../../store/ai-metrics-store', () => ({
  aiMetricsStore: {
    recordSuccess: vi.fn(),
    recordError: vi.fn(),
  },
}))

describe('model-performance-tracker', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('trackModelSwitch', () => {
    it('should save model switch event to localStorage', () => {
      trackModelSwitch({
        fromModel: null,
        toModel: 'gpt-4',
        toProvider: 'openai',
        switchTimeMs: 150,
        success: true,
      })

      const events = JSON.parse(localStorage.getItem('yyc3_model_performance_events')!)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('model_switch')
      expect(events[0].metadata.toModel).toBe('gpt-4')
      expect(events[0].metadata.toProvider).toBe('openai')
      expect(events[0].durationMs).toBe(150)
    })

    it('should record success to aiMetricsStore on success', () => {
      trackModelSwitch({
        fromModel: 'gpt-3.5',
        toModel: 'gpt-4',
        toProvider: 'openai',
        switchTimeMs: 200,
        success: true,
      })

      expect(aiMetricsStore.recordSuccess).toHaveBeenCalledWith({
        providerId: 'openai',
        modelId: 'gpt-4',
        modelName: 'gpt-4',
        latencyMs: 200,
        inputTokens: 0,
        outputTokens: 0,
      })
    })

    it('should record error to aiMetricsStore on failure', () => {
      trackModelSwitch({
        fromModel: null,
        toModel: 'gpt-4',
        toProvider: 'openai',
        switchTimeMs: 5000,
        success: false,
      })

      expect(aiMetricsStore.recordError).toHaveBeenCalledWith({
        providerId: 'openai',
        providerName: 'openai',
        modelId: 'gpt-4',
        modelName: 'gpt-4',
        latencyMs: 5000,
        errorMessage: 'Model switch failed',
      })
    })
  })

  describe('trackOllamaDetection', () => {
    it('should save ollama detection event', () => {
      trackOllamaDetection({
        host: 'localhost:11434',
        modelCount: 5,
        detectTimeMs: 300,
        success: true,
      })

      const events = JSON.parse(localStorage.getItem('yyc3_model_performance_events')!)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('ollama_detect')
      expect(events[0].metadata.host).toBe('localhost:11434')
      expect(events[0].metadata.modelCount).toBe(5)
    })

    it('should include error info when detection fails', () => {
      trackOllamaDetection({
        host: '192.168.1.100:11434',
        modelCount: 0,
        detectTimeMs: 5000,
        success: false,
        error: 'Connection timeout',
      })

      const events = JSON.parse(localStorage.getItem('yyc3_model_performance_events')!)
      expect(events[0].metadata.error).toBe('Connection timeout')
    })
  })

  describe('trackModelTest', () => {
    it('should save model test event', () => {
      trackModelTest('ollama', 'llama2', 'Llama 2', 1200, true)

      const events = JSON.parse(localStorage.getItem('yyc3_model_performance_events')!)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('model_test')
      expect(events[0].metadata.providerId).toBe('ollama')
      expect(events[0].metadata.modelId).toBe('llama2')
      expect(events[0].durationMs).toBe(1200)
    })
  })

  describe('trackModelImport', () => {
    it('should save model import event', () => {
      trackModelImport('codellama-13b', 30000, true)

      const events = JSON.parse(localStorage.getItem('yyc3_model_performance_events')!)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('model_import')
      expect(events[0].metadata.modelName).toBe('codellama-13b')
      expect(events[0].durationMs).toBe(30000)
    })
  })

  describe('getPerformanceStats', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        trackModelSwitch({
          fromModel: null,
          toModel: `model-${i}`,
          toProvider: 'test',
          switchTimeMs: 100 + i * 50,
          success: i % 5 !== 2,
        })
      }
    })

    it('should return stats for all types when no type specified', () => {
      const stats = getPerformanceStats()
      expect(stats.count).toBe(5)
      expect(stats.avgDurationMs).toBeGreaterThan(0)
      expect(stats.minDurationMs).toBeLessThanOrEqual(stats.maxDurationMs)
    })

    it('should return stats filtered by type', () => {
      trackOllamaDetection({ host: 'local', modelCount: 3, detectTimeMs: 500, success: true })

      const stats = getPerformanceStats('ollama_detect')
      expect(stats.count).toBe(1)
      expect(stats.avgDurationMs).toBe(500)
    })

    it('should return empty stats when no events', () => {
      clearPerformanceEvents()
      const stats = getPerformanceStats()
      expect(stats.count).toBe(0)
      expect(stats.avgDurationMs).toBe(0)
    })

    it('should calculate success rate correctly', () => {
      const stats = getPerformanceStats('model_switch')
      expect(stats.successRate).toBeCloseTo(0.8)
    })

    it('should calculate p95 duration', () => {
      const stats = getPerformanceStats('model_switch')
      expect(stats.p95DurationMs).toBeGreaterThanOrEqual(stats.minDurationMs)
      expect(stats.p95DurationMs).toBeLessThanOrEqual(stats.maxDurationMs + 1)
    })
  })

  describe('getOllamaDetectionDistribution', () => {
    it('should categorize fast detections (<500ms)', () => {
      trackOllamaDetection({ host: 'a', modelCount: 1, detectTimeMs: 200, success: true })
      trackOllamaDetection({ host: 'b', modelCount: 2, detectTimeMs: 400, success: true })

      const dist = getOllamaDetectionDistribution()
      expect(dist.fast).toBe(2)
      expect(dist.normal).toBe(0)
      expect(dist.slow).toBe(0)
    })

    it('should categorize normal detections (500ms-2s)', () => {
      trackOllamaDetection({ host: 'a', modelCount: 1, detectTimeMs: 800, success: true })
      trackOllamaDetection({ host: 'b', modelCount: 2, detectTimeMs: 1500, success: true })

      const dist = getOllamaDetectionDistribution()
      expect(dist.normal).toBe(2)
    })

    it('should categorize slow detections (>2s)', () => {
      trackOllamaDetection({ host: 'a', modelCount: 1, detectTimeMs: 2500, success: true })
      trackOllamaDetection({ host: 'b', modelCount: 2, detectTimeMs: 5000, success: true })

      const dist = getOllamaDetectionDistribution()
      expect(dist.slow).toBe(2)
    })

    it('should count errors separately', () => {
      trackOllamaDetection({ host: 'a', modelCount: 0, detectTimeMs: 5000, success: false, error: 'fail' })

      const dist = getOllamaDetectionDistribution()
      expect(dist.errors).toBe(1)
    })

    it('should return zeros when no ollama events', () => {
      clearPerformanceEvents()
      const dist = getOllamaDetectionDistribution()
      expect(dist).toEqual({ fast: 0, normal: 0, slow: 0, errors: 0 })
    })
  })

  describe('getRecentEvents', () => {
    it('should return recent events in reverse order', () => {
      for (let i = 0; i < 10; i++) {
        trackModelSwitch({ fromModel: null, toModel: `m${i}`, toProvider: 'p', switchTimeMs: i * 10, success: true })
      }

      const recent = getRecentEvents(5)
      expect(recent).toHaveLength(5)
      expect(recent[0].metadata.toModel).toBe('m9')
      expect(recent[4].metadata.toModel).toBe('m5')
    })

    it('should use default limit of 20', () => {
      for (let i = 0; i < 25; i++) {
        trackModelImport(`m${i}`, 100, true)
      }

      const recent = getRecentEvents()
      expect(recent.length).toBeLessThanOrEqual(20)
    })
  })

  describe('clearPerformanceEvents', () => {
    it('should remove all events from localStorage', () => {
      trackModelSwitch({ fromModel: null, toModel: 'x', toProvider: 'y', switchTimeMs: 50, success: true })
      expect(localStorage.getItem('yyc3_model_performance_events')).toBeTruthy()

      clearPerformanceEvents()
      expect(localStorage.getItem('yyc3_model_performance_events')).toBeNull()
    })
  })

  describe('exportPerformanceData', () => {
    it('should export performance data as JSON string', () => {
      trackModelSwitch({ fromModel: null, toModel: 'gpt-4', toProvider: 'openai', switchTimeMs: 150, success: true })
      trackOllamaDetection({ host: 'local', modelCount: 3, detectTimeMs: 300, success: true })

      const exported = exportPerformanceData()
      const data = JSON.parse(exported)

      expect(data.exportTime).toBeTruthy()
      expect(data.totalEvents).toBe(2)
      expect(data.byType.model_switch.count).toBe(1)
      expect(data.byType.ollama_detect.count).toBe(1)
      expect(data.ollamaDistribution).toBeDefined()
      expect(data.recentEvents).toBeDefined()
    })

    it('should return valid empty data when no events', () => {
      clearPerformanceEvents()
      const exported = exportPerformanceData()
      const data = JSON.parse(exported)
      expect(data.totalEvents).toBe(0)
    })
  })

  describe('event storage limits', () => {
    it('should not exceed MAX_EVENTS (100) in storage', () => {
      for (let i = 0; i < 110; i++) {
        trackModelImport(`model-${i}`, 100, true)
      }

      const events = JSON.parse(localStorage.getItem('yyc3_model_performance_events')!)
      expect(events.length).toBeLessThanOrEqual(100)
    })
  })
})
