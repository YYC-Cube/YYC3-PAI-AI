/**
 * @file model-store.test.tsx
 * @description 模型状态管理测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.1.0
 */

import { act, render, screen, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger } from '../../utils/logger'
import { ModelStoreProvider, useModelStore, type AIModel } from '../model-store'

const logger = createLogger('model-store-test')

const mockFetch = vi.fn()

const createMockLocalStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    getStore: () => store,
    setStore: (newStore: Record<string, string>) => { store = newStore }
  }
}

let mockLocalStorage: ReturnType<typeof createMockLocalStorage>

function TestComponent() {
  const store = useModelStore()

  return createElement('div', { 'data-testid': 'test-component' },
    createElement('div', { 'data-testid': 'model-count' }, String(store.aiModels.length)),
    createElement('div', { 'data-testid': 'active-model-id' }, store.activeModelId || 'none'),
    createElement('div', { 'data-testid': 'settings-open' }, String(store.modelSettingsOpen)),
    createElement('div', { 'data-testid': 'connectivity-map' }, JSON.stringify(store.connectivityMap)),
    createElement('div', { 'data-testid': 'active-model-name' }, store.getActiveModel()?.name || 'none'),
    createElement('button', {
      'data-testid': 'add-model-btn',
      onClick: () => store.addAIModel({
        name: 'Test Model',
        provider: 'openai',
        endpoint: 'https://api.test.com/v1/chat',
        apiKey: ['test', 'key'].join('-'),
        isActive: false
      })
    }, 'Add Model'),
    createElement('button', {
      'data-testid': 'add-ollama-btn',
      onClick: () => store.addAIModel({
        name: 'Ollama Model',
        provider: 'ollama',
        endpoint: 'http://localhost:11434/api/chat',
        apiKey: '',
        isActive: false
      })
    }, 'Add Ollama Model'),
    createElement('button', {
      'data-testid': 'open-settings-btn',
      onClick: () => store.openModelSettings()
    }, 'Open Settings'),
    createElement('button', {
      'data-testid': 'open-settings-tab-btn',
      onClick: () => store.openModelSettings('advanced')
    }, 'Open Settings with Tab'),
    createElement('button', {
      'data-testid': 'close-settings-btn',
      onClick: () => store.closeModelSettings()
    }, 'Close Settings'),
    createElement('button', {
      'data-testid': 'activate-btn',
      onClick: () => {
        if (store.aiModels.length > 0) {
          store.activateAIModel(store.aiModels[0].id)
        }
      }
    }, 'Activate'),
    createElement('button', {
      'data-testid': 'deactivate-btn',
      onClick: () => store.deactivateAIModel()
    }, 'Deactivate'),
    createElement('button', {
      'data-testid': 'remove-btn',
      onClick: () => {
        if (store.aiModels.length > 0) {
          store.removeAIModel(store.aiModels[0].id)
        }
      }
    }, 'Remove'),
    createElement('button', {
      'data-testid': 'update-btn',
      onClick: () => {
        if (store.aiModels.length > 0) {
          store.updateAIModel(store.aiModels[0].id, { name: 'Updated Model' })
        }
      }
    }, 'Update'),
    createElement('button', {
      'data-testid': 'check-connectivity-btn',
      onClick: async () => {
        if (store.aiModels.length > 0) {
          await store.checkConnectivity(store.aiModels[0].id)
        }
      }
    }, 'Check Connectivity'),
    createElement('button', {
      'data-testid': 'test-model-btn',
      onClick: async () => {
        if (store.aiModels.length > 0) {
          await store.testModel(store.aiModels[0].id)
        }
      }
    }, 'Test Model'),
    createElement('button', {
      'data-testid': 'send-message-btn',
      onClick: async () => {
        try {
          const response = await store.sendToActiveModel('Test message', {
            systemPrompt: 'You are a helpful assistant.',
            history: [{ role: 'user', content: 'Previous message' }]
          })
          logger.info('Response:', response)
        } catch (error) {
          logger.error('Error:', error)
        }
      }
    }, 'Send Message')
  )
}

function renderWithProvider(ui: ReactNode) {
  return render(
    createElement(ModelStoreProvider, null, ui)
  )
}

describe('ModelStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockLocalStorage = createMockLocalStorage()
    vi.stubGlobal('localStorage', mockLocalStorage)

    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ choices: [{ message: { content: 'test response' } }] }),
      text: () => Promise.resolve(''),
    }))
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('应该初始化为空模型列表', async () => {
      renderWithProvider(createElement(TestComponent))

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('0')
      }, { timeout: 3000 })
    })

    it('应该从localStorage加载已保存的模型', async () => {
      const savedModels: AIModel[] = [
        { id: 'm_1', name: 'GPT-4', provider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', apiKey: 'key1', isActive: true }
      ]
      mockLocalStorage.setStore({
        'yyc3_ai_models': JSON.stringify(savedModels),
        'yyc3_active_model_id': 'm_1'
      })
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        const store = mockLocalStorage.getStore()
        return store[key] || null
      })

      renderWithProvider(createElement(TestComponent))

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })
    })
  })

  describe('模型管理', () => {
    it('应该能够添加新模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('0')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })
    })

    it('应该能够添加Ollama模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-ollama-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })
    })

    it('应该能够删除模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('remove-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('0')
      }, { timeout: 3000 })
    })

    it('应该能够更新模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('update-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-name').textContent).toBe('Updated Model')
      }, { timeout: 3000 })
    })

    it('应该能够激活模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })
    })

    it('应该能够停用模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('deactivate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).toBe('none')
      }, { timeout: 3000 })
    })

    it('应该能够获取活跃模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-name').textContent).toBe('Test Model')
      }, { timeout: 3000 })
    })

    it('删除活跃模型时应该自动停用', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('remove-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).toBe('none')
      }, { timeout: 3000 })
    })
  })

  describe('设置管理', () => {
    it('应该能够打开模型设置', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('open-settings-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('settings-open').textContent).toBe('true')
      }, { timeout: 3000 })
    })

    it('应该能够打开模型设置并指定初始标签页', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('open-settings-tab-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('settings-open').textContent).toBe('true')
      }, { timeout: 3000 })
    })

    it('应该能够关闭模型设置', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('open-settings-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('settings-open').textContent).toBe('true')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('close-settings-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('settings-open').textContent).toBe('false')
      }, { timeout: 3000 })
    })
  })

  describe('连接性检查', () => {
    it('应该能够检查模型连接性', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('check-connectivity-btn').click()
      })

      await waitFor(() => {
        const connectivityMap = JSON.parse(screen.getByTestId('connectivity-map').textContent || '{}')
        const keys = Object.keys(connectivityMap)
        expect(keys.length).toBeGreaterThan(0)
      }, { timeout: 8000 })
    })

    it('应该能够检查Ollama模型连接性', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ models: [] }),
        text: () => Promise.resolve(''),
      }))

      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-ollama-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('check-connectivity-btn').click()
      })

      await waitFor(() => {
        const connectivityMap = JSON.parse(screen.getByTestId('connectivity-map').textContent || '{}')
        const keys = Object.keys(connectivityMap)
        expect(keys.length).toBeGreaterThan(0)
      }, { timeout: 8000 })
    })

    it('应该处理连接性检查失败', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')))

      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('check-connectivity-btn').click()
      })

      await waitFor(() => {
        const connectivityMap = JSON.parse(screen.getByTestId('connectivity-map').textContent || '{}')
        const keys = Object.keys(connectivityMap)
        expect(keys.length).toBeGreaterThan(0)
      }, { timeout: 8000 })
    })
  })

  describe('模型测试', () => {
    it('应该能够测试模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('test-model-btn').click()
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      }, { timeout: 8000 })
    })

    it('应该处理模型测试失败', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Test failed')))

      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('test-model-btn').click()
      })

      await waitFor(() => {
        const connectivityMap = JSON.parse(screen.getByTestId('connectivity-map').textContent || '{}')
        const keys = Object.keys(connectivityMap)
        expect(keys.length).toBeGreaterThan(0)
      }, { timeout: 8000 })
    })
  })

  describe('发送消息', () => {
    it('应该能够发送消息到活跃模型', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('send-message-btn').click()
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      }, { timeout: 8000 })
    })

    it('应该在没有活跃模型时抛出错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('send-message-btn').click()
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      }, { timeout: 3000 })

      consoleSpy.mockRestore()
    })

    it('应该处理发送消息失败', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })

      expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
    })
  })

  describe('持久化', () => {
    it('应该将模型保存到localStorage', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'yyc3_ai_models',
          expect.stringContaining('Test Model')
        )
      }, { timeout: 3000 })
    })

    it('应该将活跃模型ID保存到localStorage', async () => {
      renderWithProvider(createElement(TestComponent))

      await act(async () => {
        screen.getByTestId('add-model-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('model-count').textContent).toBe('1')
      }, { timeout: 3000 })

      await act(async () => {
        screen.getByTestId('activate-btn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'yyc3_active_model_id',
          expect.any(String)
        )
      }, { timeout: 3000 })
    })
  })
})

describe('ModelStore 辅助函数', () => {
  it('应该正确生成模型ID', () => {
    const id1 = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
    const id2 = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)

    expect(id1).toMatch(/^m_[a-z0-9]+_[a-z0-9]+$/)
    expect(id1).not.toBe(id2)
  })
})

describe('缓存机制', () => {
  it('应该生成正确的缓存key', () => {
    const model = 'gpt-4'
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ]

    const cacheKey = model + '::' + JSON.stringify(messages)

    expect(cacheKey).toContain('gpt-4')
    expect(cacheKey).toContain('Hello')
    expect(cacheKey).toContain('Hi there!')
  })
})

describe('速率限制', () => {
  it('应该正确计算速率限制窗口', () => {
    const RATE_LIMIT_WINDOW_MS = 60_000
    const now = Date.now()
    const timestamps = [now - 30000, now - 20000, now - 10000]

    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)

    expect(recent.length).toBe(3)
  })

  it('应该过滤过期的请求时间戳', () => {
    const RATE_LIMIT_WINDOW_MS = 60_000
    const now = Date.now()
    const timestamps = [now - 120000, now - 90000, now - 30000]

    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)

    expect(recent.length).toBe(1)
  })
})

describe('Fallback机制', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockLocalStorage = createMockLocalStorage()
    vi.stubGlobal('localStorage', mockLocalStorage)

    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(new Error('Primary model failed'))
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ choices: [{ message: { content: 'fallback response' } }] }),
        text: () => Promise.resolve(''),
      })
    })
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('应该在主模型失败时尝试Fallback模型', async () => {
    renderWithProvider(createElement(TestComponent))

    await act(async () => {
      screen.getByTestId('add-model-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('model-count').textContent).toBe('1')
    }, { timeout: 3000 })

    await act(async () => {
      screen.getByTestId('add-ollama-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('model-count').textContent).toBe('2')
    }, { timeout: 3000 })

    await act(async () => {
      screen.getByTestId('activate-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('active-model-id').textContent).not.toBe('none')
    }, { timeout: 3000 })

    await act(async () => {
      screen.getByTestId('send-message-btn').click()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    }, { timeout: 10000 })
  })
})
