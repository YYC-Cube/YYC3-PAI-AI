/**
 * @file MCPPanel.deep.test.tsx
 * @description MCP 服务器管理面板深化 — 真 settings-model 持久化直驱（loadJ/saveJ + localStorage）：
 * 增删改/启停/导出导入 JSON 三态/HTTP 端点型服务器/持久化断言
 * （theme-store mock 供 tokens；t 以 prop 注入返回 section.key；无旧测试，全新覆盖）
 */

import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TranslationSection } from '../../i18n/context'

// ===== theme-store mock（getCyInputStyle 走 themeStore.getTokens()，useThemeStore 走 hook） =====
const tokens = {
  background: '#0a0a0e',
  backgroundAlt: '#101016',
  foreground: '#f5f5f5',
  foregroundMuted: '#9ca3af',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  error: '#ef4444',
  border: '#26262e',
  borderDim: '#1b1b22',
  cardBg: '#14141a',
  cardBorder: '#26262e',
  inputBg: '#12121a',
  inputBorder: '#2a2a34',
  borderRadius: '12px',
  fontMono: 'monospace',
}

vi.mock('../../store/theme-store', () => ({
  useThemeStore: () => ({ tokens, isCyberpunk: false }),
  themeStore: { getTokens: () => tokens },
}))

// t 桩：返回 section.key（项目铁律 i18n t() 返回 key）
const t = (section: TranslationSection, key: string): string => `${section}.${key}`

import { MCPPanel } from '../MCPPanel'
import { DEFAULT_MCP_SERVERS, SK, type MCPServerConfig } from '../settings-model'

const lsJson = <T,>(key: string): T | null => {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : null
}

const btnByText = (text: string) =>
  Array.from(document.querySelectorAll('button')).find(b => b.textContent!.includes(text)) as HTMLElement

const btnByTitle = (titlePart: string) =>
  Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('title') || '').includes(titlePart)) as HTMLElement

const inputByPlaceholder = (ph: string) =>
  document.querySelector(`input[placeholder="${ph}"]`) as HTMLInputElement

const textarea = () => document.querySelector('textarea') as HTMLTextAreaElement

// clipboard 桩引用（CopyBtn 走 navigator.clipboard.writeText(...).catch）
const writeText = vi.fn()

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText }, configurable: true,
  })
})

/** 渲染面板并等待首帧 useEffect 持久化落盘 */
const renderPanel = () => {
  const r = render(<MCPPanel t={t} />)
  return r
}

describe('MCPPanel 列表渲染与真持久化', () => {
  it('初始渲染：真 loadJ 回退 DEFAULT_MCP_SERVERS 三条目，徽标计数 2/3，且首帧即持久化落盘', () => {
    renderPanel()
    expect(document.body.textContent).toContain('modelSettings.mcpTitle')
    expect(document.body.textContent).toContain('2/3')
    for (const name of ['Filesystem', 'Fetch', 'PostgreSQL']) {
      expect(document.body.textContent).toContain(name)
    }
    const saved = lsJson<MCPServerConfig[]>(SK.mcp)
    expect(saved).not.toBeNull()
    expect(saved!.length).toBe(DEFAULT_MCP_SERVERS.length)
    expect(saved![0].name).toBe('Filesystem')
    expect(saved![2].enabled).toBe(false)
  })

  it('预置 localStorage 直驱：真 loadJ 读取已存服务器列表渲染对应条目', () => {
    const preset: MCPServerConfig[] = [{
      id: 'mcp-x', name: 'RedisTool', description: '缓存诊断', command: 'npx',
      args: ['-y', 'mcp-redis'], env: { REDIS_URL: 'redis://localhost' }, enabled: true,
    }]
    localStorage.setItem(SK.mcp, JSON.stringify(preset))
    renderPanel()
    expect(document.body.textContent).toContain('RedisTool')
    expect(document.body.textContent).toContain('缓存诊断')
    expect(document.body.textContent).toContain('1/1')
    expect(document.body.textContent).not.toContain('Filesystem')
  })

  it('localStorage 存量损坏 JSON：真 loadJ catch 分支回退 DEFAULT_MCP_SERVERS 不崩溃', () => {
    localStorage.setItem(SK.mcp, '{not-valid-json!!')
    renderPanel()
    expect(document.body.textContent).toContain('Filesystem')
    expect(document.body.textContent).toContain('2/3')
  })

  it('启停开关：点击切换 enabled 并即时 saveJ 持久化（enabled 计数徽标同步）', () => {
    renderPanel()
    expect(document.body.textContent).toContain('2/3')
    // PostgreSQL 默认 disabled → aria-label 为 enable
    const toggleBtn = btnByTitle('modelSettings.enable PostgreSQL')
    expect(toggleBtn).toBeTruthy()
    fireEvent.click(toggleBtn)
    expect(document.body.textContent).toContain('3/3')
    const saved = lsJson<MCPServerConfig[]>(SK.mcp)
    expect(saved!.find(s => s.name === 'PostgreSQL')!.enabled).toBe(true)
    // 再关掉 Fetch → 2/3
    fireEvent.click(btnByTitle('modelSettings.disable Fetch'))
    expect(document.body.textContent).toContain('2/3')
    expect(lsJson<MCPServerConfig[]>(SK.mcp)!.find(s => s.name === 'Fetch')!.enabled).toBe(false)
  })
})

describe('MCPPanel 新增服务器表单', () => {
  const openForm = () => {
    renderPanel()
    fireEvent.click(btnByText('modelSettings.mcpAdd'))
    expect(inputByPlaceholder('Name')).toBeTruthy()
  }

  it('必填校验：缺 name 或 command 时保存按钮 disabled', () => {
    openForm()
    const saveBtn = btnByText('modelSettings.addModelBtn') as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)
    fireEvent.change(inputByPlaceholder('Name'), { target: { value: 'OnlyName' } })
    expect(saveBtn.disabled).toBe(true)
    fireEvent.change(inputByPlaceholder('Name'), { target: { value: '' } })
    fireEvent.change(inputByPlaceholder('Command (e.g. npx)'), { target: { value: 'node' } })
    expect(saveBtn.disabled).toBe(true)
  })

  it('新增 stdio 服务器：args 按空白拆分为数组、description 回退同名，保存后列表+持久化同步且表单关闭', async () => {
    openForm()
    fireEvent.change(inputByPlaceholder('Name'), { target: { value: 'GitTool' } })
    fireEvent.change(inputByPlaceholder('Command (e.g. npx)'), { target: { value: 'npx' } })
    fireEvent.change(inputByPlaceholder('Args (space-separated)'), { target: { value: '-y  mcp-server-git   /repo' } })
    fireEvent.click(btnByText('modelSettings.addModelBtn'))
    await waitFor(() => expect(document.body.textContent).toContain('GitTool'))
    expect(document.body.textContent).toContain('3/4')
    const saved = lsJson<MCPServerConfig[]>(SK.mcp)!
    const git = saved.find(s => s.name === 'GitTool')!
    expect(git.command).toBe('npx')
    expect(git.args).toEqual(['-y', 'mcp-server-git', '/repo'])
    expect(git.description).toBe('GitTool')
    expect(git.env).toEqual({})
    expect(git.enabled).toBe(true)
    expect(git.endpoint).toBeUndefined()
    expect(git.id).toMatch(/^mcp-\d+$/)
    // 表单关闭回到列表态
    expect(btnByText('modelSettings.addModelBtn')).toBeUndefined()
  })

  it('新增 HTTP 端点型服务器：endpoint/token 可选字段落盘并在条目上显示 HTTP 徽标', async () => {
    openForm()
    fireEvent.change(inputByPlaceholder('Name'), { target: { value: 'HttpMcp' } })
    fireEvent.change(inputByPlaceholder('Command (e.g. npx)'), { target: { value: 'remote' } })
    const inputs = document.querySelectorAll('input')
    fireEvent.change(inputs[3] as HTMLInputElement, { target: { value: 'https://mcp.example.dev/stream' } })
    fireEvent.change(inputs[4] as HTMLInputElement, { target: { value: 'bearer-tk-9' } })
    fireEvent.click(btnByText('modelSettings.addModelBtn'))
    await waitFor(() => expect(document.body.textContent).toContain('HTTP'))
    const saved = lsJson<MCPServerConfig[]>(SK.mcp)!
    const http = saved.find(s => s.name === 'HttpMcp')!
    expect(http.endpoint).toBe('https://mcp.example.dev/stream')
    expect(http.token).toBe('bearer-tk-9')
  })

  it('取消按钮：收起表单回到列表态且不新增条目', () => {
    openForm()
    fireEvent.change(inputByPlaceholder('Name'), { target: { value: 'Draft' } })
    fireEvent.click(btnByText('modelSettings.cancel'))
    expect(btnByText('modelSettings.addModelBtn')).toBeUndefined()
    expect(lsJson<MCPServerConfig[]>(SK.mcp)!.find(s => s.name === 'Draft')).toBeUndefined()
  })
})

describe('MCPPanel JSON 导出/导入与条目操作', () => {
  it('导出 JSON：textarea 展示 mcpServers 草稿且仅含 enabled 服务器；复制按钮走 clipboard；取消退出 JSON 模式', async () => {
    renderPanel()
    fireEvent.click(btnByText('modelSettings.mcpJsonMode'))
    const draft = textarea()
    expect(draft.getAttribute('aria-label')).toBe('modelSettings.mcpJsonMode')
    expect(draft.value).toContain('"mcpServers"')
    expect(draft.value).toContain('"filesystem"')
    expect(draft.value).toContain('"fetch"')
    expect(draft.value).not.toContain('"postgresql"')
    // 复制按钮（CopyBtn：JSON 模式下唯一无文本且无 title 的按钮）
    const copyBtn = Array.from(document.querySelectorAll('button'))
      .find(b => !b.textContent!.trim() && !b.getAttribute('title')) as HTMLElement
    fireEvent.click(copyBtn)
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(draft.value))
    // 取消回列表
    fireEvent.click(btnByText('modelSettings.cancel'))
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('导入合法 JSON：servers 全量替换并持久化，退出 JSON 模式', () => {
    renderPanel()
    fireEvent.click(btnByText('modelSettings.mcpJsonMode'))
    fireEvent.change(textarea(), {
      target: { value: JSON.stringify({ mcpServers: { kafka: { command: 'npx', args: ['-y', 'mcp-kafka'], env: { K: 'v' } } } }) },
    })
    fireEvent.click(btnByText('modelSettings.mcpImport'))
    expect(document.body.textContent).toContain('kafka')
    expect(document.body.textContent).not.toContain('Filesystem')
    const saved = lsJson<MCPServerConfig[]>(SK.mcp)!
    expect(saved.length).toBe(1)
    expect(saved[0].command).toBe('npx')
    expect(saved[0].args).toEqual(['-y', 'mcp-kafka'])
    expect(saved[0].env).toEqual({ K: 'v' })
    expect(saved[0].enabled).toBe(true)
    expect(saved[0].id).toContain('kafka')
  })

  it('导入顶层数组形态（无 mcpServers 包裹）：同样解析为服务器列表', () => {
    renderPanel()
    fireEvent.click(btnByText('modelSettings.mcpJsonMode'))
    fireEvent.change(textarea(), {
      target: { value: JSON.stringify({ websearch: { command: 'bun', args: ['x'] } }) },
    })
    fireEvent.click(btnByText('modelSettings.mcpImport'))
    expect(document.body.textContent).toContain('websearch')
    expect(lsJson<MCPServerConfig[]>(SK.mcp)![0].name).toBe('websearch')
  })

  it('导入非法 JSON：显示 JSON parse error 且不改动既有列表', () => {
    renderPanel()
    fireEvent.click(btnByText('modelSettings.mcpJsonMode'))
    fireEvent.change(textarea(), { target: { value: '{oops' } })
    fireEvent.click(btnByText('modelSettings.mcpImport'))
    expect(document.body.textContent).toContain('JSON parse error')
    // 修正草稿时错误提示即时清除
    fireEvent.change(textarea(), { target: { value: '{' } })
    expect(document.body.textContent).not.toContain('JSON parse error')
    expect(lsJson<MCPServerConfig[]>(SK.mcp)!.length).toBe(3)
  })

  it('条目删除与编辑详情：删除持久化；编辑展开 command/args/env 详情再收起', async () => {
    renderPanel()
    // 展开 PostgreSQL 详情（含非空 env）
    fireEvent.click(btnByTitle('modelSettings.edit PostgreSQL'))
    expect(document.body.textContent).toContain('command:')
    expect(document.body.textContent).toContain('npx')
    expect(document.body.textContent).toContain('DATABASE_URL')
    // 再点收起
    fireEvent.click(btnByTitle('modelSettings.edit PostgreSQL'))
    expect(document.body.textContent).not.toContain('DATABASE_URL')
    // 删除 Fetch
    fireEvent.click(btnByTitle('modelSettings.remove Fetch'))
    await waitFor(() => {
      const saved = lsJson<MCPServerConfig[]>(SK.mcp)!
      expect(saved.length).toBe(2)
      expect(saved.find(s => s.name === 'Fetch')).toBeUndefined()
    })
    expect(document.body.textContent).not.toContain('HTTP 请求工具')
  })
})
