/**
 * @file platform-collab.test.tsx
 * @description #1/#2 认证 UI 回调 + Platform MCP 桥接测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'

// Mock auth-client
vi.mock('../auth-client', () => ({
  handleCallback: vi.fn(),
  getDefaultAuthConfig: vi.fn(() => ({
    authorizationEndpoint: 'https://auth.test/authorize',
    tokenEndpoint: 'https://auth.test/token',
    clientId: 'test',
    redirectUri: 'http://localhost/auth/callback',
    scope: 'read',
  })),
  initiateLogin: vi.fn(),
  isAuthenticated: vi.fn(() => false),
  logout: vi.fn(),
  getUser: vi.fn(() => null),
}))

import { AuthCallback } from '../../components/AuthCallback'
import { handleCallback } from '../auth-client'

// Mock mcp-client for platform-bridge
vi.mock('../mcp-client', () => ({
  createMCPClient: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue({}),
    listTools: vi.fn().mockResolvedValue([
      { name: 'file_read', description: 'Read a file' },
      { name: 'file_write', description: 'Write a file' },
      { name: 'agent_run_task', description: 'Run an agent task' },
      { name: 'kb_search', description: 'Search knowledge base' },
      { name: 'code_execute', description: 'Execute code' },
    ]),
    callTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'result data' }] }),
  })),
}))

import { getPlatformBridge, connectPlatform, disconnectPlatform } from '../platform-bridge'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  disconnectPlatform()
})

// ===== #1 Auth Callback UI =====

describe('AuthCallback（认证回调页）', () => {
  it('渲染处理中状态', async () => {
    vi.mocked(handleCallback).mockImplementation(() => new Promise(() => { })) // 永不 resolve
    render(<AuthCallback />)
    expect(document.body.textContent).toContain('正在登录')
  })

  it('成功状态显示倒计时和跳转按钮', async () => {
    vi.mocked(handleCallback).mockResolvedValue({ success: true })
    render(<AuthCallback />)

    await waitFor(() => {
      expect(document.body.textContent).toContain('登录成功')
    })
    expect(document.body.textContent).toContain('跳转')
    const btn = Array.from(document.querySelectorAll('button')).find(b => /立即进入/.test(b.textContent || ''))
    expect(btn).toBeTruthy()
  })

  it('失败状态显示错误信息和重试按钮', async () => {
    vi.mocked(handleCallback).mockResolvedValue({ success: false, error: 'State mismatch' })
    render(<AuthCallback />)

    await waitFor(() => {
      expect(document.body.textContent).toContain('登录失败')
      expect(document.body.textContent).toContain('State mismatch')
    })
    const retry = Array.from(document.querySelectorAll('button')).find(b => /重新登录/.test(b.textContent || ''))
    expect(retry).toBeTruthy()
  })
})

// ===== #2 Platform Bridge =====

describe('PlatformBridge（Platform MCP 桥接）', () => {
  it('连接成功 → 获取工具列表 + 分类', async () => {
    const status = await connectPlatform('test-token')

    expect(status.connected).toBe(true)
    expect(status.toolCount).toBe(5)
    expect(status.categories.length).toBeGreaterThan(0)
    expect(status.categories).toContain('文件系统')
    expect(status.categories).toContain('Agent 任务')
  })

  it('getTools 返回带分类的工具', async () => {
    await connectPlatform()
    const bridge = getPlatformBridge()
    const tools = bridge.getTools()

    expect(tools).toHaveLength(5)
    expect(tools[0].category).toBe('文件系统') // file_read
    expect(tools[1].requiresConfirmation).toBe(true) // file_write
  })

  it('getToolsByCategory 按分类过滤', async () => {
    await connectPlatform()
    const bridge = getPlatformBridge()
    const fileTools = bridge.getToolsByCategory('文件系统')

    expect(fileTools.every(t => t.category === '文件系统')).toBe(true)
    expect(fileTools.some(t => t.name === 'file_read')).toBe(true)
  })

  it('callTool 调用 Platform 工具', async () => {
    await connectPlatform()
    const bridge = getPlatformBridge()
    const result = await bridge.callTool('file_read', { path: '/test' })

    expect(result).toBe('result data')
  })

  it('buildSystemPrompt 生成分类分组的工具清单', async () => {
    await connectPlatform()
    const bridge = getPlatformBridge()
    const prompt = await bridge.buildSystemPrompt()

    expect(prompt).toContain('file_read')
    expect(prompt).toContain('文件系统')
    expect(prompt).toContain('{"tool":')
  })

  it('disconnect 后工具清空', async () => {
    await connectPlatform()
    disconnectPlatform()

    const bridge = getPlatformBridge()
    expect(bridge.getStatus().connected).toBe(false)
    expect(bridge.getTools()).toHaveLength(0)
  })

  it('未连接时 callTool 报错', async () => {
    const bridge = getPlatformBridge()
    await expect(bridge.callTool('any', {})).rejects.toThrow('not connected')
  })
})
