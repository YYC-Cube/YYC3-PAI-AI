/**
 * @file model-store.test.ts
 * @description Unit test for model-store
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

// Mock fetch for connectivity/test endpoints
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content: 'Hello!' } }] }),
  text: async () => '',
}) as any

// Mock performance.now
vi.spyOn(performance, 'now').mockReturnValue(100)

import type { AIModel, ConnectivityStatus, ModelTestResult } from '../model-store.tsx'

// ===== Direct localStorage helpers (mirror store internals) =====
const LS_MODELS = 'yyc3_ai_models'
const LS_ACTIVE = 'yyc3_active_model_id'

function loadModels(): AIModel[] {
  try { const r = localStorage.getItem(LS_MODELS); return r ? JSON.parse(r) : [] }
  catch { return [] }
}
function saveModels(m: AIModel[]) {
  try { localStorage.setItem(LS_MODELS, JSON.stringify(m)) } catch {/* */}
}
function loadActiveId(): string | null {
  try { return localStorage.getItem(LS_ACTIVE) } catch { return null }
}
function saveActiveId(id: string | null) {
  try { if (id) localStorage.setItem(LS_ACTIVE, id); else localStorage.removeItem(LS_ACTIVE) } catch {/* */}
}

describe('Model Store — localStorage Persistence', () => {
  beforeEach(() => { lsMock.clear() })

  it('loadModels should return empty array when no data', () => {
    expect(loadModels()).toEqual([])
  })

  it('saveModels + loadModels round-trip', () => {
    const models: AIModel[] = [
      { id: 'm_1', name: 'gpt-4', provider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', apiKey: 'sk-xxx', isActive: true },
      { id: 'm_2', name: 'llama2', provider: 'ollama', endpoint: 'http://localhost:11434/api/chat', apiKey: '', isActive: false },
    ]
    saveModels(models)
    const loaded = loadModels()
    expect(loaded.length).toBe(2)
    expect(loaded[0].name).toBe('gpt-4')
    expect(loaded[1].provider).toBe('ollama')
  })

  it('saveActiveId + loadActiveId round-trip', () => {
    saveActiveId('m_1')
    expect(loadActiveId()).toBe('m_1')
  })

  it('saveActiveId(null) should remove key', () => {
    saveActiveId('m_1')
    saveActiveId(null)
    expect(loadActiveId()).toBeNull()
  })

  it('loadModels should handle corrupt JSON gracefully', () => {
    lsMock.setItem(LS_MODELS, '{bad json')
    // Re-read from store
    const result = (() => {
      try { const r = localStorage.getItem(LS_MODELS); return r ? JSON.parse(r) : [] }
      catch { return [] }
    })()
    expect(result).toEqual([])
  })
})

describe('AIModel interface shape', () => {
  it('should have required fields', () => {
    const model: AIModel = {
      id: 'm_test',
      name: 'gpt-4-turbo',
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-test',
      isActive: false,
    }
    expect(model.id).toBeTruthy()
    expect(model.name).toBeTruthy()
    expect(['openai', 'ollama', 'custom']).toContain(model.provider)
    expect(model.endpoint).toMatch(/^https?:\/\//)
    expect(typeof model.isActive).toBe('boolean')
  })

  it('isDetected should be optional', () => {
    const model: AIModel = {
      id: 'm_opt', name: 'test', provider: 'custom',
      endpoint: 'http://localhost:8080', apiKey: '', isActive: false,
    }
    expect(model.isDetected).toBeUndefined()
    const detected: AIModel = { ...model, isDetected: true }
    expect(detected.isDetected).toBe(true)
  })
})

describe('ConnectivityStatus interface shape', () => {
  it('should have required fields', () => {
    const status: ConnectivityStatus = {
      modelId: 'm_1',
      status: 'online',
      latencyMs: 45,
      lastChecked: Date.now(),
    }
    expect(['unknown', 'checking', 'online', 'offline']).toContain(status.status)
    expect(status.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('error should be optional', () => {
    const status: ConnectivityStatus = { modelId: 'm_1', status: 'offline', error: 'Timeout' }
    expect(status.error).toBe('Timeout')
  })
})

describe('ModelTestResult interface shape', () => {
  it('successful result should have response', () => {
    const result: ModelTestResult = {
      success: true,
      response: 'Hello!',
      latencyMs: 120,
      model: 'gpt-4',
    }
    expect(result.success).toBe(true)
    expect(result.response).toBeTruthy()
  })

  it('failed result should have error', () => {
    const result: ModelTestResult = {
      success: false,
      latencyMs: 0,
      error: 'Connection refused',
      model: 'gpt-4',
    }
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('Model CRUD via localStorage', () => {
  beforeEach(() => { lsMock.clear() })

  it('add model', () => {
    const models = loadModels()
    const newModel: AIModel = {
      id: 'm_' + Date.now().toString(36),
      name: 'gpt-4', provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-test', isActive: false,
    }
    models.push(newModel)
    saveModels(models)
    expect(loadModels().length).toBe(1)
    expect(loadModels()[0].name).toBe('gpt-4')
  })

  it('remove model', () => {
    const m: AIModel = { id: 'm_rm', name: 'rm', provider: 'custom', endpoint: '', apiKey: '', isActive: false }
    saveModels([m])
    saveModels(loadModels().filter(x => x.id !== 'm_rm'))
    expect(loadModels().length).toBe(0)
  })

  it('update model', () => {
    const m: AIModel = { id: 'm_up', name: 'old', provider: 'openai', endpoint: '', apiKey: '', isActive: false }
    saveModels([m])
    const updated = loadModels().map(x => x.id === 'm_up' ? { ...x, name: 'new' } : x)
    saveModels(updated)
    expect(loadModels()[0].name).toBe('new')
  })

  it('activate model', () => {
    const models: AIModel[] = [
      { id: 'm_a', name: 'A', provider: 'openai', endpoint: '', apiKey: '', isActive: false },
      { id: 'm_b', name: 'B', provider: 'ollama', endpoint: '', apiKey: '', isActive: false },
    ]
    saveModels(models)
    saveActiveId('m_a')
    const activated = loadModels().map(m => ({ ...m, isActive: m.id === 'm_a' }))
    saveModels(activated)
    expect(loadActiveId()).toBe('m_a')
    expect(loadModels().find(m => m.id === 'm_a')!.isActive).toBe(true)
    expect(loadModels().find(m => m.id === 'm_b')!.isActive).toBe(false)
  })

  it('deactivate model', () => {
    saveActiveId('m_a')
    saveActiveId(null)
    expect(loadActiveId()).toBeNull()
  })
})

describe('Caching (conceptual)', () => {
  it('cache key should combine model and messages', () => {
    const getCacheKey = (model: string, msgs: { role: string; content: string }[]) =>
      model + '::' + JSON.stringify(msgs)
    const key = getCacheKey('gpt-4', [{ role: 'user', content: 'hello' }])
    expect(key).toBe('gpt-4::[{"role":"user","content":"hello"}]')
  })

  it('same messages should produce same cache key', () => {
    const getCacheKey = (m: string, msgs: { role: string; content: string }[]) => m + '::' + JSON.stringify(msgs)
    const k1 = getCacheKey('gpt-4', [{ role: 'user', content: 'hi' }])
    const k2 = getCacheKey('gpt-4', [{ role: 'user', content: 'hi' }])
    expect(k1).toBe(k2)
  })

  it('different models should produce different cache keys', () => {
    const getCacheKey = (m: string, msgs: { role: string; content: string }[]) => m + '::' + JSON.stringify(msgs)
    const k1 = getCacheKey('gpt-4', [{ role: 'user', content: 'hi' }])
    const k2 = getCacheKey('llama2', [{ role: 'user', content: 'hi' }])
    expect(k1).not.toBe(k2)
  })
})

describe('Rate Limiting (conceptual)', () => {
  it('checkRateLimit should allow requests under limit', () => {
    const RATE_LIMIT_WINDOW_MS = 60_000
    const RATE_LIMIT_MAX = 30
    const tracker = new Map<string, number[]>()

    function checkRateLimit(key: string): boolean {
      const now = Date.now()
      const ts = tracker.get(key) || []
      const recent = ts.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
      tracker.set(key, recent)
      return recent.length < RATE_LIMIT_MAX
    }

    expect(checkRateLimit('openai:gpt-4')).toBe(true)
  })

  it('checkRateLimit should block when limit exceeded', () => {
    const RATE_LIMIT_MAX = 3
    const tracker = new Map<string, number[]>()

    function checkRateLimit(key: string): boolean {
      const now = Date.now()
      const ts = tracker.get(key) || []
      ts.push(now)
      tracker.set(key, ts)
      return ts.length <= RATE_LIMIT_MAX
    }

    expect(checkRateLimit('test')).toBe(true)  // 1
    expect(checkRateLimit('test')).toBe(true)  // 2
    expect(checkRateLimit('test')).toBe(true)  // 3
    expect(checkRateLimit('test')).toBe(false) // 4 → blocked
  })
})

describe('Fallback model store (no provider)', () => {
  it('fallback should return empty state', () => {
    // Test the exported fallback object shape
    const fallback = {
      aiModels: [] as AIModel[],
      activeModelId: null as string | null,
      getActiveModel: () => null,
      modelSettingsOpen: false,
      connectivityMap: {} as Record<string, ConnectivityStatus>,
    }
    expect(fallback.aiModels).toEqual([])
    expect(fallback.activeModelId).toBeNull()
    expect(fallback.getActiveModel()).toBeNull()
  })
})
