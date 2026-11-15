/**
 * @file IDEChatPanel.test.tsx
 * @description 自治 AI 聊天面板 — 初始化欢迎语/发送流（无模型守卫+真 SSE 增量）/工具栏/MCP 指示/项目卡片
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({
  createMCPClient: vi.fn(),
  openModelSettings: vi.fn(),
  getActiveModel: vi.fn<() => unknown>(() => null),
  sendToActiveModelStream: vi.fn(),
  getActiveRulesAsSystemPrompt: vi.fn(() => ''),
}))

vi.mock('../../../services/mcp-client', () => ({ createMCPClient: m.createMCPClient }))
vi.mock('../../../store/model-store', () => ({
  useModelStore: () => ({
    openModelSettings: m.openModelSettings,
    getActiveModel: m.getActiveModel,
    sendToActiveModelStream: m.sendToActiveModelStream,
    activeModelId: 'm-1',
    connectivityMap: {},
  }),
}))
vi.mock('../../../store/project-store', () => ({
  useProjectStore: () => ({ projects: [] }),
}))
vi.mock('../../../store/settings-store', () => ({
  settingsActions: { getActiveRulesAsSystemPrompt: m.getActiveRulesAsSystemPrompt },
}))

import { IDEChatPanel } from '../IDEChatPanel'

const sonnerLog = (globalThis as unknown as { __sonnerLog?: string[] }).__sonnerLog ?? []

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  m.getActiveRulesAsSystemPrompt.mockReturnValue('')
})

const getTextarea = (container: HTMLElement) => container.querySelector('textarea')! as HTMLTextAreaElement
const findAriaButton = (container: HTMLElement, label: string) =>
  container.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null

describe('IDEChatPanel（AI 聊天面板）', () => {
  it('挂载即渲染初始化欢迎消息（AI 标签 + 时间戳）与默认演示项目卡片', () => {
    const { container } = render(<IDEChatPanel />)
    expect(container.textContent).toContain('initMessage')
    expect(container.textContent).toContain('YYC3-AI-Code')
    expect(container.textContent).toContain('Dashboard-v2')
    expect(container.textContent).toContain('recentProjects')
  })

  it('模型指示按钮：未激活模型时显示占位文案，点击打开模型设置', () => {
    const { container } = render(<IDEChatPanel />)
    const btn = findAriaButton(container, 'modelConfig')
    expect(btn).not.toBeNull()
    expect(btn!.textContent).toContain('noActiveModel')
    fireEvent.click(btn!)
    expect(m.openModelSettings).toHaveBeenCalledTimes(1)
  })

  it('空输入回车不发送；有输入回车后出现用户消息与未激活模型提示，输入框清空', async () => {
    const { container } = render(<IDEChatPanel />)
    const textarea = getTextarea(container)
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(container.textContent).not.toContain('未激活模型')
    fireEvent.change(textarea, { target: { value: '帮我做个侧边栏' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    await waitFor(() => expect(container.textContent).toContain('未激活模型'))
    expect(container.textContent).toContain('帮我做个侧边栏')
    expect(textarea.value).toBe('')
    expect(m.sendToActiveModelStream).not.toHaveBeenCalled()
  })

  it('有激活模型：sendToActiveModelStream 带 systemPrompt 与历史调用，增量回调写入 AI 消息', async () => {
    m.getActiveModel.mockReturnValue({ id: 'm-1', name: '测试模型' })
    m.sendToActiveModelStream.mockImplementation(
      (_msg: string, _opts: unknown, onChunk: (d: string, full: string) => void) => {
        onChunk('你好', '你好')
        onChunk('呀', '你好呀')
        return Promise.resolve()
      },
    )
    const { container } = render(<IDEChatPanel />)
    // 模型指示按钮显示激活模型名
    expect(findAriaButton(container, 'modelConfig')!.textContent).toContain('测试模型')
    const textarea = getTextarea(container)
    fireEvent.change(textarea, { target: { value: '打招呼' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('你好呀'))
    expect(m.sendToActiveModelStream).toHaveBeenCalledTimes(1)
    const [msg, opts] = m.sendToActiveModelStream.mock.calls[0]
    expect(msg).toBe('打招呼')
    const sysPrompt = (opts as { systemPrompt: string }).systemPrompt
    expect(sysPrompt).toContain('Respond in Chinese')
    expect((opts as { history: unknown[] }).history.length).toBeGreaterThanOrEqual(1)
  })

  it('规则注入：设置规则存在时拼入 systemPrompt', async () => {
    m.getActiveModel.mockReturnValue({ id: 'm-1', name: '测试模型' })
    m.getActiveRulesAsSystemPrompt.mockReturnValue(' ALWAYS_OBEY_RULES ')
    m.sendToActiveModelStream.mockResolvedValue(undefined)
    const { container } = render(<IDEChatPanel />)
    fireEvent.change(getTextarea(container), { target: { value: '带规则发送' } })
    fireEvent.keyDown(getTextarea(container), { key: 'Enter' })
    await waitFor(() => expect(m.sendToActiveModelStream).toHaveBeenCalledTimes(1))
    expect((m.sendToActiveModelStream.mock.calls[0][1] as { systemPrompt: string }).systemPrompt)
      .toContain('ALWAYS_OBEY_RULES')
  })

  it('SSE 流抛错：AI 占位消息写入错误详情并复位 loading', async () => {
    m.getActiveModel.mockReturnValue({ id: 'm-1', name: '测试模型' })
    m.sendToActiveModelStream.mockRejectedValue(new Error('网络炸了'))
    const { container } = render(<IDEChatPanel />)
    fireEvent.change(getTextarea(container), { target: { value: '触发失败' } })
    fireEvent.keyDown(getTextarea(container), { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('网络炸了'))
    expect(container.textContent).toContain('modelError')
  })

  it('工具栏 Plus 展开 6 个附件入口；点击入口触发 cyberToast（sonner 桩记录）', () => {
    const { container } = render(<IDEChatPanel />)
    expect(container.textContent).not.toContain('imageUpload')
    fireEvent.click(findAriaButton(container, 'expandMenu')!)
    for (const key of ['imageUpload', 'fileImport', 'githubLink', 'figmaFile', 'codeSnippet', 'clipboard']) {
      expect(findAriaButton(container, key)).not.toBeNull()
    }
    fireEvent.click(findAriaButton(container, 'imageUpload')!)
    expect(sonnerLog).toContain('imageUpload')
  })

  it('localStorage 配置 MCP 服务器 → 指示条渲染启用项；点击徽标打开 mcp 页签', () => {
    localStorage.setItem('yyc3-mcp-servers', JSON.stringify([
      { id: 'm1', name: 'fs-server', enabled: true, endpoint: 'https://mcp.example.com' },
      { id: 'm2', name: 'disabled-server', enabled: false },
    ]))
    const { container } = render(<IDEChatPanel />)
    expect(container.textContent).toContain('MCP')
    expect(container.textContent).toContain('fs-server')
    expect(container.textContent).not.toContain('disabled-server')
    const mcpBadge = Array.from(container.querySelectorAll('span')).find(s => s.textContent === 'fs-server')!
    fireEvent.click(mcpBadge)
    expect(m.openModelSettings).toHaveBeenCalledWith('mcp')
  })

  it('MCP 配置脏数据（非法 JSON）时静默降级不崩溃', () => {
    localStorage.setItem('yyc3-mcp-servers', '{broken!')
    expect(() => render(<IDEChatPanel />)).not.toThrow()
  })

  it('点击项目卡片 → cyberToast（sonner 桩记录 projectOpened）', () => {
    const { container } = render(<IDEChatPanel />)
    const card = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('YYC3-AI-Code'))!
    fireEvent.click(card)
    expect(sonnerLog.some(l => l.includes('projectOpened'))).toBe(true)
  })

  it('Shift+Enter 换行不发送', () => {
    const { container } = render(<IDEChatPanel />)
    const textarea = getTextarea(container)
    fireEvent.change(textarea, { target: { value: '第一行' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(container.textContent).not.toContain('未激活模型')
    expect(textarea.value).toBe('第一行')
  })
})
