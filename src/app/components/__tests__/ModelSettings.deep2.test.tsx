/**
 * @file ModelSettings.deep2.test.tsx
 * @description 模型设置二轮深化 — 服务商启停/自定义服务商增删/端点编辑/模型增删/测试连接三态/Ollama 扫描导入流
 * （承接 ModelSettings.deep.test.tsx 的 mock 架构：model-store/key-storage 均已 mock，重型子面板 stub）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  store: {
    modelSettingsOpen: false,
    modelSettingsInitialTab: null as string | null,
    closeModelSettings: vi.fn(),
    aiModels: [] as Array<{ id: string; name: string; provider: string }>,
    addAIModel: vi.fn(),
    updateAIModel: vi.fn(),
    activateAIModel: vi.fn(),
    activeModelId: null as string | null,
    getActiveModel: () => null as { id: string } | null,
    sendToActiveModel: vi.fn(),
  },
  loadAllProviderKeys: vi.fn(),
  migrate: vi.fn(),
  saveProviderKey: vi.fn(),
  openPanel: vi.fn(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => h.store,
}))

vi.mock('../../utils/key-storage', () => ({
  loadAllProviderKeys: h.loadAllProviderKeys,
  migratePlaintextKeysToVault: h.migrate,
  saveProviderKey: h.saveProviderKey,
}))

// 重型子面板 stub（页签切换以 testid 断言）
vi.mock('../MCPPanel', () => ({
  MCPPanel: () => <div data-testid="mcp-stub" />,
}))
vi.mock('../PerformancePanel', () => ({
  PerformancePanel: () => <div data-testid="performance-stub" />,
}))
vi.mock('../ThemePreview', () => ({
  ThemePreview: () => <div data-testid="theme-stub" />,
}))

import { ModelSettings } from '../ModelSettings'
import { panelActions } from '../../store/panel-store'

type FetchMock = ReturnType<typeof vi.fn>

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  h.store.modelSettingsOpen = false
  h.store.modelSettingsInitialTab = null
  h.store.aiModels = []
  h.store.activeModelId = null
  h.loadAllProviderKeys.mockResolvedValue({ zhipu: 'sk-exist' })
  h.migrate.mockResolvedValue(0)
  vi.spyOn(panelActions, 'open').mockImplementation(h.openPanel)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const flush = () => act(async () => { await Promise.resolve() })

const renderOpen = async () => {
  h.store.modelSettingsOpen = true
  const r = render(<ModelSettings />)
  await flush()
  return r
}

const tabBtn = (label: string) =>
  Array.from(document.querySelectorAll('[role="tab"]')).find(b => b.textContent!.includes(label)) as HTMLElement

/** 精确文本匹配按钮（图标无文本，textContent 即 i18n key） */
const btnByText = (text: string) =>
  Array.from(document.querySelectorAll('button')).find(b => b.textContent === text) as HTMLElement

/** 服务商卡片头部按钮（含服务商名 + "N models" 计数） */
const cardHeader = (providerName: string) =>
  Array.from(document.querySelectorAll('button')).find(
    b => b.textContent!.includes(providerName) && b.textContent!.includes('models'),
  ) as HTMLElement

const lsJson = <T,>(key: string): T => JSON.parse(localStorage.getItem(key) || 'null') as T

const body = () => document.body.textContent!

describe('ModelSettings 页签内容切换与头部动作', () => {
  it('ollama/performance/theme 页签渲染对应面板，tabpanel id 随激活页变化；保险库按钮关面板并开 keyVault', async () => {
    await renderOpen()
    expect(document.querySelector('[id="tabpanel-providers"]')).toBeTruthy()

    fireEvent.click(tabBtn('tabOllama'))
    expect(document.querySelector('input[aria-label="ollamaEndpoint"]')).toBeTruthy()
    expect(document.querySelector('[id="tabpanel-ollama"]')).toBeTruthy()
    // 未扫描：空态提示 + 未连接
    expect(body()).toContain('noOllamaModels')
    expect(body()).toContain('disconnected')

    fireEvent.click(tabBtn('tabPerformance'))
    expect(document.querySelector('[data-testid="performance-stub"]')).toBeTruthy()

    fireEvent.click(tabBtn('tabTheme'))
    expect(document.querySelector('[data-testid="theme-stub"]')).toBeTruthy()
    expect(document.querySelector('[id="tabpanel-theme"]')).toBeTruthy()

    fireEvent.click(Array.from(document.querySelectorAll('button')).find(b => b.textContent!.includes('保险库'))!)
    expect(h.store.closeModelSettings).toHaveBeenCalledTimes(1)
    expect(h.openPanel).toHaveBeenCalledWith('keyVault')
  })
})

describe('ModelSettings 服务商启停与搜索过滤', () => {
  it('停用 zhipu：卡片消失并写入 yyc3-disabled-providers', async () => {
    await renderOpen()
    expect(body()).toContain('Z.ai 智谱')
    fireEvent.click(btnByText('disable'))
    await flush()
    expect(body()).not.toContain('Z.ai 智谱')
    expect(lsJson<string[]>('yyc3-disabled-providers')).toEqual(['zhipu'])
  })

  it('搜索 "coding" 只剩 Z.ai Coding 卡片；清空恢复', async () => {
    const { container } = await renderOpen()
    const search = container.querySelector('input[placeholder="Search..."]') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'coding' } })
    expect(body()).toContain('Z.ai Coding')
    expect(body()).not.toContain('Z.ai 智谱')
    fireEvent.change(search, { target: { value: '' } })
    expect(body()).toContain('Z.ai 智谱')
  })

  it('展开/收起：点击 zhipu 头部收起（API Key 输入框消失），再点展开', async () => {
    await renderOpen()
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
    fireEvent.click(cardHeader('Z.ai 智谱'))
    await flush()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    fireEvent.click(cardHeader('Z.ai 智谱'))
    await flush()
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
  })
})

describe('ModelSettings 自定义服务商与端点编辑', () => {
  it('添加自定义服务商：卡片出现 + 落盘 + 表单复位；自定义卡片可删除', async () => {
    await renderOpen()
    fireEvent.click(btnByText('addProvider'))
    const inputs = Array.from(document.querySelectorAll('input[placeholder]')) as HTMLInputElement[]
    const byPh = (ph: string) => inputs.find(i => i.placeholder === ph)!
    fireEvent.change(byPh('providerName'), { target: { value: 'MyHub' } })
    fireEvent.change(byPh('baseUrl'), { target: { value: 'https://api.myhub.cn/v1' } })
    fireEvent.click(btnByText('addProvider'))
    await flush()

    expect(body()).toContain('MyHub')
    expect(body()).toContain('Custom OpenAI-compatible')
    const saved = lsJson<Array<{ id: string; name: string; baseURL: string }>>('yyc3-custom-providers')
    expect(saved).toHaveLength(1)
    expect(saved[0].baseURL).toBe('https://api.myhub.cn/v1')
    // 表单关闭 → 重新出现「添加」入口按钮
    expect(btnByText('addProvider')).toBeTruthy()

    // isCustom → removeProvider 可见；删除后卡片消失并落盘为空
    fireEvent.click(btnByText('removeProvider'))
    await flush()
    expect(body()).not.toContain('MyHub')
    expect(lsJson<unknown[]>('yyc3-custom-providers')).toEqual([])
  })

  it('编辑端点 URL：确认后 customUrls 落盘并即时生效', async () => {
    await renderOpen()
    // 展开卡片中第一个文本为 edit 的按钮是「编辑端点」
    fireEvent.click(btnByText('edit'))
    const urlInput = document.querySelector('input[aria-label="apiEndpointLabel"]') as HTMLInputElement
    expect(urlInput.value).toContain('open.bigmodel.cn')
    fireEvent.change(urlInput, { target: { value: 'https://proxy.example.cn/v4' } })
    fireEvent.click(document.querySelector('button[aria-label="confirm"]')!)
    await flush()
    expect(lsJson<Record<string, string>>('yyc3-provider-urls')).toEqual({ zhipu: 'https://proxy.example.cn/v4' })
    expect(body()).toContain('https://proxy.example.cn/v4')
  })
})

describe('ModelSettings 模型级操作（自定义模型增删）', () => {
  it('添加自定义模型：双输入 + 确认 → customModels 落盘且列表可见', async () => {
    await renderOpen()
    fireEvent.click(btnByText('addModelBtn'))
    fireEvent.change(document.querySelector('input[aria-label="Model ID"]')!, { target: { value: 'gpt-x1' } })
    fireEvent.change(document.querySelector('input[aria-label="Display Name"]')!, { target: { value: 'GPT X1' } })
    fireEvent.click(document.querySelector('button[aria-label="confirm"]')!)
    await flush()
    expect(lsJson<Record<string, Array<{ id: string; name: string }>>>('yyc3-custom-models').zhipu[0].id).toBe('gpt-x1')
    expect(body()).toContain('GPT X1')
  })

  it('删除预设模型走排除清单：confirm 确认后 yyc3-excluded-models-zhipu 写入且模型消失', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    await renderOpen()
    expect(body()).toContain('GLM-5.1')
    fireEvent.click(document.querySelector('button[aria-label="remove GLM-5.1"]')!)
    await flush()
    expect(lsJson<string[]>('yyc3-excluded-models-zhipu')).toContain('glm-5.1')
    expect(body()).not.toContain('GLM-5.1')
  })
})

describe('ModelSettings 测试连接（handleTest 三态）与选用', () => {
  it('成功：带 Bearer key 请求 → 显示时延与模型回包 YANYUCLOUD_OK', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'YANYUCLOUD_OK' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await renderOpen()
    fireEvent.click(document.querySelector('button[aria-label="testConnection GLM-5.1"]')!)
    await waitFor(() => {
      expect(body()).toContain('YANYUCLOUD_OK')
      expect(body()).toMatch(/\d+ms/)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('open.bigmodel.cn')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-exist')
    expect(String(init.body)).toContain('"model":"glm-5.1"')
  })

  it('401：错误详情入卡片 + 诊断页签出现建议块（API Key invalid or expired）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'bad key' } }),
    }))
    await renderOpen()
    fireEvent.click(document.querySelector('button[aria-label="testConnection GLM-5.1"]')!)
    await waitFor(() => expect(body()).toContain('API Key invalid (401)'))
    expect(body()).toContain('bad key')
    fireEvent.click(tabBtn('tabDiagnostics'))
    await flush()
    expect(body()).toContain('diagSuggestions')
    expect(body()).toContain('API Key invalid or expired')
  })

  it('无 API Key：卡片显示 apiKeyNotSet 警告；测试不发请求，直接落 noApiKey 错误', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    h.loadAllProviderKeys.mockResolvedValue({})
    await renderOpen()
    expect(body()).toContain('apiKeyNotSet')
    fireEvent.click(document.querySelector('button[aria-label="testConnection GLM-5.1"]')!)
    await waitFor(() => expect(body()).toContain('noApiKey'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('选用模型：addAIModel 带端点/key/provider=custom，toast 提示 switchedTo', async () => {
    await renderOpen()
    fireEvent.click(btnByText('use'))
    await flush()
    expect(h.store.addAIModel).toHaveBeenCalledWith(expect.objectContaining({
      name: 'glm-5.1',
      provider: 'custom',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      apiKey: 'sk-exist',
      isActive: false,
    }))
    const toast = document.querySelector('[role="status"]')!
    expect(toast.textContent).toContain('switchedTo')
    expect(toast.textContent).toContain('GLM-5.1')
  })
})

describe('ModelSettings Ollama 扫描与导入流', () => {
  let fetchMock: FetchMock

  beforeEach(async () => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await renderOpen()
    fireEvent.click(tabBtn('tabOllama'))
    await flush()
  })

  it('扫描成功：请求 /api/tags → 模型清单 + connected；导入 → addAIModel + 落盘 + 成功提示；重复导入提示已存在', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: 'llama3', size: 4.7e9, details: { quantization_level: 'Q4_0' } }],
      }),
    })
    fireEvent.click(document.querySelector('button[aria-label="ariaScanButton"]')!)
    await waitFor(() => expect(body()).toContain('llama3'))
    expect(body()).toContain('connected')
    expect(body()).toContain('4.7 GB')
    expect(body()).toContain('Q4_0')
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/tags')

    fireEvent.click(document.querySelector('button[aria-label="ariaImportButton: llama3"]')!)
    await waitFor(() => expect(document.querySelector('[role="alert"]')!.textContent).toContain('导入成功'))
    expect(h.store.addAIModel).toHaveBeenCalledWith(expect.objectContaining({ name: 'llama3', provider: 'ollama', isDetected: true }))
    expect(lsJson<Record<string, Array<{ id: string }>>>('yyc3-custom-models').ollama[0].id).toBe('llama3')

    fireEvent.click(document.querySelector('button[aria-label="ariaImportButton: llama3"]')!)
    await waitFor(() => expect(document.querySelector('[role="alert"]')!.textContent).toContain('已存在'))
  })

  it('连接失败：Failed to fetch → ollamaNotRunning；HTTP 503 → ollamaHttpError 带状态码', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    fireEvent.click(document.querySelector('button[aria-label="ariaScanButton"]')!)
    await waitFor(() => expect(body()).toContain('connectionError'))
    expect(body()).toContain('ollamaNotRunning')
    expect(body()).toContain('disconnected')

    fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' })
    fireEvent.click(document.querySelector('button[aria-label="ariaScanButton"]')!)
    await waitFor(() => expect(body()).toContain('ollamaHttpError'))
    expect(body()).toContain('HTTP 503')
  })
})
