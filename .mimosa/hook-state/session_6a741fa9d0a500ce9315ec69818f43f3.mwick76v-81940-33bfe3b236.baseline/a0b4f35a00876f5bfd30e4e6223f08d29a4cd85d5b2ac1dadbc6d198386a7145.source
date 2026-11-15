/**
 * @file model-performance-tracker.ts
 * @description Model switching and Ollama detection performance monitoring
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { aiMetricsStore } from '../store/ai-metrics-store'

// ===== Types =====
interface PerformanceEvent {
  id: string
  type: 'model_switch' | 'ollama_detect' | 'model_test' | 'model_import'
  timestamp: number
  durationMs: number
  metadata: Record<string, unknown>
}

interface ModelSwitchMetric {
  fromModel: string | null
  toModel: string
  toProvider: string
  switchTimeMs: number
  success: boolean
}

interface OllamaDetectMetric {
  host: string
  modelCount: number
  detectTimeMs: number
  success: boolean
  error?: string
}

// ===== Storage =====
const PERFORMANCE_KEY = 'yyc3_model_performance_events'
const MAX_EVENTS = 100

function loadEvents(): PerformanceEvent[] {
  try {
    const raw = localStorage.getItem(PERFORMANCE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEvents(events: PerformanceEvent[]) {
  try {
    // Keep only last MAX_EVENTS events
    const trimmed = events.slice(-MAX_EVENTS)
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(trimmed))
  } catch { /* ignore */ }
}

// ===== Core Functions =====

/**
 * Track model switching performance
 */
export function trackModelSwitch(metric: ModelSwitchMetric): void {
  const event: PerformanceEvent = {
    id: `switch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'model_switch',
    timestamp: Date.now(),
    durationMs: metric.switchTimeMs,
    metadata: {
      fromModel: metric.fromModel,
      toModel: metric.toModel,
      toProvider: metric.toProvider,
      success: metric.success,
    },
  }

  const events = loadEvents()
  events.push(event)
  saveEvents(events)

  // Also record to AI metrics store for aggregation
  if (metric.success) {
    aiMetricsStore.recordSuccess({
      providerId: metric.toProvider,
      modelId: metric.toModel,
      modelName: metric.toModel,
      latencyMs: metric.switchTimeMs,
      inputTokens: 0,
      outputTokens: 0,
    })
  } else {
    aiMetricsStore.recordError({
      providerId: metric.toProvider,
      providerName: metric.toProvider,
      modelId: metric.toModel,
      modelName: metric.toModel,
      latencyMs: metric.switchTimeMs,
      errorMessage: 'Model switch failed',
    })
  }
}

/**
 * Track Ollama model detection performance
 */
export function trackOllamaDetection(metric: OllamaDetectMetric): void {
  const event: PerformanceEvent = {
    id: `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'ollama_detect',
    timestamp: Date.now(),
    durationMs: metric.detectTimeMs,
    metadata: {
      host: metric.host,
      modelCount: metric.modelCount,
      success: metric.success,
      error: metric.error || null,
    },
  }

  const events = loadEvents()
  events.push(event)
  saveEvents(events)
}

/**
 * Track model testing performance
 */
export function trackModelTest(providerId: string, modelId: string, modelName: string, latencyMs: number, success: boolean): void {
  const event: PerformanceEvent = {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'model_test',
    timestamp: Date.now(),
    durationMs: latencyMs,
    metadata: {
      providerId,
      modelId,
      modelName,
      success,
    },
  }

  const events = loadEvents()
  events.push(event)
  saveEvents(events)
}

/**
 * Track Ollama model import performance
 */
export function trackModelImport(modelName: string, importTimeMs: number, success: boolean): void {
  const event: PerformanceEvent = {
    id: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'model_import',
    timestamp: Date.now(),
    durationMs: importTimeMs,
    metadata: {
      modelName,
      success,
    },
  }

  const events = loadEvents()
  events.push(event)
  saveEvents(events)
}

// ===== Analytics Functions =====

/**
 * Get performance statistics for a specific event type
 */
export function getPerformanceStats(type?: PerformanceEvent['type']): {
  count: number
  avgDurationMs: number
  minDurationMs: number
  maxDurationMs: number
  p95DurationMs: number
  successRate: number
} {
  const events = loadEvents()
  const filtered = type ? events.filter(e => e.type === type) : events

  if (filtered.length === 0) {
    return {
      count: 0,
      avgDurationMs: 0,
      minDurationMs: 0,
      maxDurationMs: 0,
      p95DurationMs: 0,
      successRate: 0,
    }
  }

  const durations = filtered.map(e => e.durationMs).sort((a, b) => a - b)
  const successes = filtered.filter(e => e.metadata.success as boolean).length

  return {
    count: filtered.length,
    avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    minDurationMs: durations[0],
    maxDurationMs: durations[durations.length - 1],
    p95DurationMs: durations[Math.ceil(durations.length * 0.95) - 1] || 0,
    successRate: successes / filtered.length,
  }
}

/**
 * Get Ollama detection time distribution
 */
export function getOllamaDetectionDistribution(): {
  fast: number   // < 500ms
  normal: number // 500ms - 2s
  slow: number   // > 2s
  errors: number
} {
  const events = loadEvents().filter(e => e.type === 'ollama_detect')

  const distribution = {
    fast: 0,    // < 500ms
    normal: 0,  // 500ms - 2s
    slow: 0,    // > 2s
    errors: 0,
  }

  for (const event of events) {
    if (!event.metadata.success) {
      distribution.errors++
    } else if (event.durationMs < 500) {
      distribution.fast++
    } else if (event.durationMs <= 2000) {
      distribution.normal++
    } else {
      distribution.slow++
    }
  }

  return distribution
}

/**
 * Get recent performance events (last N)
 */
export function getRecentEvents(limit = 20): PerformanceEvent[] {
  const events = loadEvents()
  return events.slice(-limit).reverse()
}

/**
 * Clear all performance events
 */
export function clearPerformanceEvents(): void {
  localStorage.removeItem(PERFORMANCE_KEY)
}

/**
 * Export performance data as JSON for analysis
 */
export function exportPerformanceData(): string {
  const events = loadEvents()
  const stats = {
    exportTime: new Date().toISOString(),
    totalEvents: events.length,
    byType: {
      model_switch: getPerformanceStats('model_switch'),
      ollama_detect: getPerformanceStats('ollama_detect'),
      model_test: getPerformanceStats('model_test'),
      model_import: getPerformanceStats('model_import'),
    },
    ollamaDistribution: getOllamaDetectionDistribution(),
    recentEvents: getRecentEvents(50),
  }

  return JSON.stringify(stats, null, 2)
}
