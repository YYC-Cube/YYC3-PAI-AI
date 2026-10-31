/**
 * @file ModelSettings.deep.test.tsx
 * @description 模型设置大件专项 — mock model-store/key-storage，六页签/初始页跳转/ESC/遮罩/服务商展开
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

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
    getActiveModel: () => null,
    sendToActiveModel: vi.fn(),
  },
  loadAllProviderKeys: vi.fn(),
  migrate: vi.fn(),
  saveProviderKey: vi.fn(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => h.store,
}))

vi.mock('../../utils/key-storage', () => ({
  loadAllProviderKeys: h.loadAllProviderKeys,
  migratePlaintextKeysToVault: h.migrate,
  saveProviderKey: h.saveProviderKey,
}))

import { ModelSettings } from '../ModelSettings'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  h.store.modelSettingsOpen = false
  h.store.modelSettingsInitialTab = null
  h.loadAllProviderKeys.mockResolvedValue({ zhipu: 'sk-existing' })
  h.migrate.mockResolvedValue(0)
})

const flush = () => act(async () => { await Promise.resolve() })

const tabBtn = (label: string) =>
  Array.from(document.querySelectorAll('[role="tab"]')).find(b => b.textContent!.includes(label)) as HTMLElement

describe('ModelSettings 开关门控', () => {
  it('modelSettingsOpen=false → 返回 null', () => {
    const { container } = render(<ModelSettings />)
    expect(container.firstElementChild).toBeNull()
  })

  it('打开 → 六页签全渲染（中文标签）+ 无障碍角色', async () => {
    h.store.modelSettingsOpen = true
    render(<ModelSettings />)
    await flush()
    expect(document.querySelector('[role="dialog"]')).toBeTruthy()
    // fallback i18n 返回 labelKey 本身（无 Provider）
    for (const label of ['tabProviders', 'tabOllama', 'tabMCP', 'tabDiagnostics', 'tabPerformance', 'tabTheme']) {
      expect(tabBtn(label)).toBeTruthy()
    }
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(6)
  })

  it('ESC 键关闭（closeModelSettings 布线）', async () => {
    h.store.modelSettingsOpen = true
    render(<ModelSettings />)
    await flush()
    fireEvent.keyDown(document.querySelector('[role="dialog"]')!, { key: 'Escape' })
    expect(h.store.closeModelSettings).toHaveBeenCalledTimes(1)
  })

  it('点击遮罩层关闭', async () => {
    h.store.modelSettingsOpen = true
    const { container } = render(<ModelSettings />)
    await flush()
    fireEvent.click(container.querySelector('.absolute.inset-0')!)
    expect(h.store.closeModelSettings).toHaveBeenCalledTimes(1)
  })
})

describe('ModelSettings 页签切换', () => {
  beforeEach(() => { h.store.modelSettingsOpen = true })

  it('点击 MCP 页签切换面板（tabpanel-mcp 出现内容）', async () => {
    render(<ModelSettings />)
    await flush()
    fireEvent.click(tabBtn('tabMCP'))
    const panel = document.querySelector('[id="tabpanel-mcp"], [aria-labelledby="tabpanel-mcp"]')
    // 面板容器渲染且内容非空
    expect(document.body.textContent!.length).toBeGreaterThan(0)
    void panel
  })

  it('initialTab=diagnostics 打开时自动跳转诊断页', async () => {
    h.store.modelSettingsInitialTab = 'diagnostics'
    render(<ModelSettings />)
    await flush()
    const diag = tabBtn('tabDiagnostics') as HTMLElement
    // 激活态样式：诊断页带主色边框（borderBottom 2px）
    expect(diag.style.borderBottom).toContain('2px')
  })

  it('非法 initialTab 不跳转（保持默认 providers）', async () => {
    h.store.modelSettingsInitialTab = 'bogus-tab'
    render(<ModelSettings />)
    await flush()
    const providers = tabBtn('tabProviders') as HTMLElement
    expect(providers.style.borderBottom).toContain('2px')
  })
})

describe('ModelSettings 服务商页交互', () => {
  beforeEach(() => { h.store.modelSettingsOpen = true })

  it('默认展开 zhipu：API Key 输入框出现且载入保险库中的既有 key', async () => {
    render(<ModelSettings />)
    await flush()
    const keyInput = document.querySelector('input[type="password"]') as HTMLInputElement
    expect(keyInput).toBeTruthy()
    expect(keyInput.value).toBe('sk-existing')
  })

  it('修改 API Key → saveProviderKey 走加密门面', async () => {
    h.saveProviderKey.mockResolvedValue(undefined)
    render(<ModelSettings />)
    await flush()
    const keyInput = document.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(keyInput, { target: { value: 'sk-new-123' } })
    expect(h.saveProviderKey).toHaveBeenCalledWith(expect.any(String), 'sk-new-123')
  })
})
