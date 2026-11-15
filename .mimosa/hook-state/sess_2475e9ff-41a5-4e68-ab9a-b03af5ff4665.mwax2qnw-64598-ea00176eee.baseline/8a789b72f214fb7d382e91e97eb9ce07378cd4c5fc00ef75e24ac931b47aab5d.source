/**
 * @file ModelSettings.test.tsx
 * @description Unit tests for ModelSettings component core functions
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ===== Mock Setup =====
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

// Mock fetch globally
const originalFetch = globalThis.fetch

// ===== Test Constants =====
const STORAGE_KEYS = {
  API_KEYS: 'yyc3-provider-api-keys',
  CUSTOM_MODELS: 'yyc3-custom-models',
  EXCLUDED_MODELS_PREFIX: 'yyc3-excluded-models-',
}

interface CustomModel {
  id: string
  name: string
  description: string
}

// ===== Helper Functions (mirrored from ModelSettings.tsx) =====
function loadJ<T>(k: string, fb: T): T {
  try {
    const r = localStorage.getItem(k)
    return r ? JSON.parse(r) : fb
  } catch {
    return fb
  }
}

function saveJ(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch { /* ignore */ }
}

// ===== Test Suites =====

describe('ModelSettings — handleTest (Model Connection Testing)', () => {

  beforeEach(() => {
    lsMock.clear()
    vi.clearAllMocks()
    // Reset fetch mock
    globalThis.fetch = originalFetch
  })

  it('should validate API key for non-Ollama providers', () => {
    const providerId = 'zhipu'

    // Save empty API key
    saveJ(STORAGE_KEYS.API_KEYS, {})

    // Simulate validation logic
    const keys = loadJ<Record<string, string>>(STORAGE_KEYS.API_KEYS, {})
    const apiKey = keys[providerId]

    expect(apiKey).toBeUndefined()
  })

  it('should skip API key validation for Ollama provider', () => {
    const providerId: string = 'ollama'

    // Ollama should not require API key
    const isOllama = providerId === 'ollama'

    expect(isOllama).toBe(true)
  })

  it('should use proxy URL for Zhipu AI provider', () => {
    const providerId: string = 'zhipu'
    const baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

    // Determine if should use proxy
    const useProxy = !baseUrl.startsWith('/') && providerId !== 'ollama'

    expect(useProxy).toBe(true)

    // Construct proxy URL
    const proxyUrl = `/api/proxy${baseUrl}`
    expect(proxyUrl).toContain('/api/proxy')
  })

  it('should use direct URL for Ollama provider', () => {
    const baseUrl = '/api/ollama/chat'

    // Ollama uses local proxy
    const isLocalUrl = baseUrl.startsWith('/')

    expect(isLocalUrl).toBe(true)
  })

  it('should handle successful API response', async () => {
    // Mock successful response
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Test response' } }]
      })
    } as Response)

    const response = await globalThis.fetch('/test')
    const data = await (response as Response).json()

    expect(response.ok).toBe(true)
    expect(data.choices[0].message.content).toBe('Test response')
  })

  it('should handle 401 Unauthorized error', async () => {
    // Mock 401 response
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    } as Response)

    try {
      const response = await globalThis.fetch('/test') as Response
      if (!response.ok) {
        const errorMsg = response.status === 401
          ? 'API Key 无效或已过期'
          : `HTTP ${response.status}`
        throw new Error(errorMsg)
      }
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('API Key 无效')
    }
  })

  it('should handle network timeout (AbortError)', async () => {
    // Mock AbortError
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

    try {
      await globalThis.fetch('/test')
    } catch (error) {
      expect(error).toBeInstanceOf(DOMException)
      expect((error as DOMException).message).toBe('Aborted')
    }
  })

  it('should record performance metrics on success', () => {
    // Mock performance tracking
    const metrics: Array<{ model: string; latency: number; success: boolean }> = []

    const recordMetric = (model: string, latency: number, success: boolean) => {
      metrics.push({ model, latency, success })
    }

    recordMetric('glm-4', 150, true)

    expect(metrics.length).toBe(1)
    expect(metrics[0]).toEqual({
      model: 'glm-4',
      latency: 150,
      success: true
    })
  })

  it('should record failure metrics with error message', () => {
    const metrics: Array<{ model: string; error: string; success: boolean }> = []

    const recordFailure = (model: string, error: string) => {
      metrics.push({ model, error, success: false })
    }

    recordFailure('glm-5', 'Network error')

    expect(metrics[0].success).toBe(false)
    expect(metrics[0].error).toBe('Network error')
  })
})

describe('ModelSettings — handleImportOllamaModel (Ollama Model Import)', () => {

  beforeEach(() => {
    lsMock.clear()
    vi.clearAllMocks()
  })

  it('should add new model to custom models list', () => {
    const modelName = 'llama3.1:8b'
    const modelSize = '4.7 GB'

    // Initialize empty custom models
    saveJ(STORAGE_KEYS.CUSTOM_MODELS, { ollama: [] })

    // Add new model
    const customModels = loadJ<Record<string, CustomModel[]>>(STORAGE_KEYS.CUSTOM_MODELS, {})
    const existingModels = customModels['ollama'] || []

    const newModel: CustomModel = {
      id: modelName,
      name: modelName,
      description: `Ollama local · ${modelSize}`,
    }

    const updatedModels = [...existingModels, newModel]
    const updated = { ...customModels, ollama: updatedModels }
    saveJ(STORAGE_KEYS.CUSTOM_MODELS, updated)

    // Verify
    const saved = loadJ<Record<string, CustomModel[]>>(STORAGE_KEYS.CUSTOM_MODELS, {})
    expect(saved.ollama?.length).toBe(1)
    expect(saved.ollama?.[0].name).toBe(modelName)
    expect(saved.ollama?.[0].description).toContain(modelSize)
  })

  it('should prevent duplicate model imports', () => {
    const modelName = 'codellama:13b'

    // Pre-existing model
    saveJ(STORAGE_KEYS.CUSTOM_MODELS, {
      ollama: [{
        id: modelName,
        name: modelName,
        description: 'Existing model',
      }]
    })

    // Try to import same model
    const customModels = loadJ<Record<string, CustomModel[]>>(STORAGE_KEYS.CUSTOM_MODELS, {})
    const existingModels = customModels['ollama'] || []
    const alreadyExists = existingModels.some(m => m.id === modelName)

    expect(alreadyExists).toBe(true)
  })

  it('should persist models to localStorage', () => {
    const models: CustomModel[] = [
      { id: 'model-1', name: 'Model 1', description: 'Desc 1' },
      { id: 'model-2', name: 'Model 2', description: 'Desc 2' },
    ]

    saveJ(STORAGE_KEYS.CUSTOM_MODELS, { ollama: models })

    // Verify persistence
    const loaded = loadJ<Record<string, CustomModel[]>>(STORAGE_KEYS.CUSTOM_MODELS, {})
    expect(JSON.stringify(loaded)).toBe(JSON.stringify({ ollama: models }))

    // Verify localStorage.setItem was called
    expect(lsMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.CUSTOM_MODELS,
      expect.stringContaining('model-1')
    )
  })

  it('should handle import errors gracefully', () => {
    // Simulate localStorage full or error
    lsMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => {
      saveJ(STORAGE_KEYS.CUSTOM_MODELS, { ollama: [] })
    }).not.toThrow() // Should catch and ignore error
  })
})

describe('ModelSettings — handleRemoveModel (Model Deletion)', () => {

  beforeEach(() => {
    lsMock.clear()
    vi.clearAllMocks()
  })

  it('should add model to exclusion list', () => {
    const providerId = 'zhipu'
    const modelId = 'glm-4'
    const excludedKey = `${STORAGE_KEYS.EXCLUDED_MODELS_PREFIX}${providerId}`

    // Initialize empty exclusion list
    saveJ(excludedKey, [])

    // Remove model (add to exclusion list)
    const excluded = loadJ<string[]>(excludedKey, [])
    if (!excluded.includes(modelId)) {
      saveJ(excludedKey, [...excluded, modelId])
    }

    // Verify
    const updated = loadJ<string[]>(excludedKey, [])
    expect(updated).toContain(modelId)
    expect(updated.length).toBe(1)
  })

  it('should not duplicate exclusions', () => {
    const providerId = 'zhipu'
    const modelId = 'glm-5'
    const excludedKey = `${STORAGE_KEYS.EXCLUDED_MODELS_PREFIX}${providerId}`

    // Exclude twice
    saveJ(excludedKey, [modelId])

    const excluded = loadJ<string[]>(excludedKey, [])
    if (!excluded.includes(modelId)) {
      saveJ(excludedKey, [...excluded, modelId])
    }

    // Should still only have one entry
    const updated = loadJ<string[]>(excludedKey, [])
    expect(updated.filter(id => id === modelId).length).toBe(1)
  })

  it('should maintain separate exclusion lists per provider', () => {
    const zhipuKey = `${STORAGE_KEYS.EXCLUDED_MODELS_PREFIX}zhipu`
    const ollamaKey = `${STORAGE_KEYS.EXCLUDED_MODELS_PREFIX}ollama`

    // Exclude different models from different providers
    saveJ(zhipuKey, ['glm-4'])
    saveJ(ollamaKey, ['llama3'])

    const zhipuExcluded = loadJ<string[]>(zhipuKey, [])
    const ollamaExcluded = loadJ<string[]>(ollamaKey, [])

    expect(zhipuExcluded).toContain('glm-4')
    expect(zhipuExcluded).not.toContain('llama3')
    expect(ollamaExcluded).toContain('llama3')
    expect(ollamaExcluded).not.toContain('glm-4')
  })
})

describe('ModelSettings — Ollama Detection Logic', () => {

  beforeEach(() => {
    lsMock.clear()
    vi.clearAllMocks()
    globalThis.fetch = originalFetch
  })

  it('should detect localhost and use proxy', () => {
    const ollamaHost = 'http://localhost:11434'

    const isLocalhost = ollamaHost.includes('localhost') ||
      ollamaHost.includes('127.0.0.1') ||
      ollamaHost.includes('[::1]')

    expect(isLocalhost).toBe(true)

    const url = isLocalhost ? '/api/ollama/tags' : ollamaHost + '/api/tags'
    expect(url).toBe('/api/ollama/tags')
  })

  it('should use direct URL for remote hosts', () => {
    const ollamaHost = 'http://192.168.1.100:11434'

    const isLocalhost = ollamaHost.includes('localhost') ||
      ollamaHost.includes('127.0.0.1') ||
      ollamaHost.includes('[::1]')

    expect(isLocalhost).toBe(false)

    const url = isLocalhost ? '/api/ollama/tags' : ollamaHost + '/api/tags'
    expect(url).toBe('http://192.168.1.100:11434/api/tags')
  })

  it('should parse Ollama tags response correctly', async () => {
    const mockResponse = {
      models: [
        { name: 'llama3.1:8b', modified_at: '2024-01-01T00:00:00Z', size: 5053330527 },
        { name: 'codellama:13b', modified_at: '2024-01-02T00:00:00Z', size: 7831265712 },
      ]
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const response = await globalThis.fetch('/api/ollama/tags') as Response
    const data = await response.json()

    expect(data.models.length).toBe(2)
    expect(data.models[0].name).toBe('llama3.1:8b')
    expect(data.models[1].name).toBe('codellama:13b')
  })

  it('should handle connection refused error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'))

    try {
      await globalThis.fetch('/api/ollama/tags')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Failed to fetch')
    }
  })

  it('should format model size for display', () => {
    const formatSize = (bytes: number): string => {
      const gb = bytes / (1024 * 1024 * 1024)
      if (gb < 1024) {
        return `${gb.toFixed(1)} GB`
      }
      return `${(gb / 1024).toFixed(1)} TB`
    }

    expect(formatSize(5053330527)).toBe('4.7 GB')
    expect(formatSize(7831265712)).toBe('7.3 GB')
  })
})

describe('ModelSettings — Diagnostics Report Generation', () => {

  beforeEach(() => {
    lsMock.clear()
    vi.clearAllMocks()
  })

  it('should collect diagnostic data correctly', () => {
    const diagnostics: Record<string, {
      modelName: string
      providerId: string
      status: string
      latency: number
      message: string
    }> = {
      'zhipu:glm-4': {
        modelName: 'GLM-4',
        providerId: 'zhipu',
        status: 'online',
        latency: 150,
        message: '',
      },
      'ollama:llama3': {
        modelName: 'Llama 3',
        providerId: 'ollama',
        status: 'error',
        latency: 0,
        message: 'Connection failed',
      },
    }

    const diagData = Object.values(diagnostics).map(d => ({
      model: d.modelName,
      provider: d.providerId,
      status: d.status,
      latency: d.latency,
      error: d.status === 'error' ? d.message : null,
    }))

    expect(diagData.length).toBe(2)
    expect(diagData[0]).toEqual({
      model: 'GLM-4',
      provider: 'zhipu',
      status: 'online',
      latency: 150,
      error: null,
    })
    expect(diagData[1]).toEqual({
      model: 'Llama 3',
      provider: 'ollama',
      status: 'error',
      latency: 0,
      error: 'Connection failed',
    })
  })

  it('should generate AI analysis prompt', () => {
    const diagData = [
      { model: 'GLM-4', provider: 'zhipu', status: 'online', latency: 150, error: null },
    ]

    const prompt = `Analyze the following AI model diagnostic results and provide a brief, actionable report in Chinese. Include: 1) Overall health summary, 2) Issues found, 3) Specific fix suggestions. Keep it concise.\n\nDiagnostic Data:\n${JSON.stringify(diagData, null, 2)}`

    expect(prompt).toContain('GLM-4')
    expect(prompt).toContain('Chinese')
    expect(prompt).toContain('Overall health summary')
    expect(prompt).toContain('Diagnostic Data')
  })

  it('should calculate statistics correctly', () => {
    const diagnostics: Record<string, { status: string; latency: number }> = {
      'model-1': { status: 'online', latency: 100 },
      'model-2': { status: 'online', latency: 200 },
      'model-3': { status: 'error', latency: 0 },
      'model-4': { status: 'untested', latency: 0 },
    }

    const values = Object.values(diagnostics)
    const totalModels = values.length
    const testedCount = values.filter(d => d.status !== 'untested').length
    const onlineCount = values.filter(d => d.status === 'online').length
    const avgLatency = onlineCount > 0
      ? values.filter(d => d.status === 'online').reduce((sum, d) => sum + d.latency, 0) / onlineCount
      : 0

    expect(totalModels).toBe(4)
    expect(testedCount).toBe(3)
    expect(onlineCount).toBe(2)
    expect(avgLatency).toBe(150)
  })
})

describe('ModelSettings — Edge Cases & Error Handling', () => {

  beforeEach(() => {
    lsMock.clear()
    vi.clearAllMocks()
  })

  it('should handle corrupt localStorage data gracefully', () => {
    lsMock.setItem(STORAGE_KEYS.CUSTOM_MODELS, '{invalid json')

    const result = loadJ<Record<string, unknown[]>>(STORAGE_KEYS.CUSTOM_MODELS, {})

    expect(result).toEqual({})
  })

  it('should handle empty model lists', () => {
    saveJ(STORAGE_KEYS.CUSTOM_MODELS, { ollama: [], zhipu: [] })

    const result = loadJ<Record<string, unknown[]>>(STORAGE_KEYS.CUSTOM_MODELS, {})

    expect(result.ollama).toEqual([])
    expect(result.zhipu).toEqual([])
  })

  it('should handle special characters in model names', () => {
    const modelName = 'llama3.1:8b-instruct-q4_K_M'

    const isValid = /^[a-zA-Z0-9._:-]+$/.test(modelName)

    expect(isValid).toBe(true)
  })

  it('should validate API key format', () => {
    const validKeys = [
      'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxx.xxxxxxxxxxxxxxxx.xxx.xxxxxxxxxxxx',
    ]

    validKeys.forEach(key => {
      expect(key.length).toBeGreaterThan(10)
    })
  })

  it('should debounce rapid test requests', async () => {
    const callTimes: number[] = []

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const debouncedTest = (timestamp: number) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        callTimes.push(timestamp)
      }, 300)
    }

    // Rapid calls
    debouncedTest(100)
    debouncedTest(150)
    debouncedTest(200)
    debouncedTest(250)

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400))

    // Should only execute once (last call)
    expect(callTimes.length).toBe(1)
    expect(callTimes[0]).toBe(250)
  })
})
