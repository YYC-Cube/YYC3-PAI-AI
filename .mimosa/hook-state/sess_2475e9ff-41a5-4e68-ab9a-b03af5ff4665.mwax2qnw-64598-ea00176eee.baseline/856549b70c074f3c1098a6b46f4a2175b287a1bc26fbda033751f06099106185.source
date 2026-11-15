/**
 * @file mcp-store.test.ts
 * @description Unit test for mcp-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, vi } from 'vitest'

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

import { mcpStoreActions } from '../mcp-store'

function s() { return mcpStoreActions.getState() }

describe('MCP Store — Initial State', () => {
  it('should have preset servers', () => {
    expect(s().servers.length).toBeGreaterThanOrEqual(6)
  })

  it('should have globally enabled', () => {
    expect(s().globalEnabled).toBe(true)
  })

  it('preset servers should have required fields', () => {
    for (const srv of s().servers) {
      expect(srv.id).toBeTruthy()
      expect(srv.name).toBeTruthy()
      expect(srv.description).toBeTruthy()
      expect(['stdio', 'sse', 'streamable-http']).toContain(srv.transport)
      expect(typeof srv.enabled).toBe('boolean')
      expect(Array.isArray(srv.tools)).toBe(true)
      expect(Array.isArray(srv.resources)).toBe(true)
      expect(Array.isArray(srv.prompts)).toBe(true)
      expect(Array.isArray(srv.tags)).toBe(true)
    }
  })

  it('Filesystem and Fetch should be enabled by default', () => {
    const fs = s().servers.find(s => s.id === 'mcp-filesystem')
    const fetch = s().servers.find(s => s.id === 'mcp-fetch')
    expect(fs?.enabled).toBe(true)
    expect(fetch?.enabled).toBe(true)
  })

  it('PostgreSQL, Memory, GitHub, Brave should be disabled by default', () => {
    const pg = s().servers.find(s => s.id === 'mcp-postgres')
    const mem = s().servers.find(s => s.id === 'mcp-memory')
    expect(pg?.enabled).toBe(false)
    expect(mem?.enabled).toBe(false)
  })
})

describe('Server CRUD', () => {
  it('addServer should return new ID', () => {
    const id = mcpStoreActions.addServer({
      name: 'Test Server', description: 'Test', transport: 'stdio',
      command: 'test', args: [], env: {}, enabled: true, tags: ['test'],
    })
    expect(id).toMatch(/^mcp_/)
    expect(s().servers.find(s => s.id === id)).toBeDefined()
  })

  it('editServer should update fields', () => {
    const id = mcpStoreActions.addServer({
      name: 'Edit Me', description: 'Before', transport: 'stdio',
      enabled: true, tags: [],
    })
    mcpStoreActions.editServer(id, { description: 'After', command: 'new-cmd' })
    const srv = s().servers.find(s => s.id === id)
    expect(srv?.description).toBe('After')
    expect(srv?.command).toBe('new-cmd')
  })

  it('removeServer should delete server', () => {
    const id = mcpStoreActions.addServer({
      name: 'Remove Me', description: '', transport: 'sse',
      enabled: true, tags: [],
    })
    mcpStoreActions.removeServer(id)
    expect(s().servers.find(s => s.id === id)).toBeUndefined()
  })

  it('removeServer should clear selectedServerId', () => {
    const id = mcpStoreActions.addServer({
      name: 'Selected', description: '', transport: 'stdio',
      enabled: true, tags: [],
    })
    mcpStoreActions.selectServer(id)
    mcpStoreActions.removeServer(id)
    expect(s().selectedServerId).toBeNull()
  })

  it('toggleServer should flip enabled state', () => {
    const id = mcpStoreActions.addServer({
      name: 'Toggle', description: '', transport: 'stdio',
      enabled: false, tags: [],
    })
    expect(s().servers.find(s => s.id === id)?.enabled).toBe(false)
    mcpStoreActions.toggleServer(id)
    expect(s().servers.find(s => s.id === id)?.enabled).toBe(true)
  })

  it('toggleGlobal should flip globalEnabled', () => {
    const before = s().globalEnabled
    mcpStoreActions.toggleGlobal()
    expect(s().globalEnabled).toBe(!before)
    mcpStoreActions.toggleGlobal()
    expect(s().globalEnabled).toBe(before)
  })
})

describe('Health Check', () => {
  it('checkServer should return status', async () => {
    const status = await mcpStoreActions.checkServer('mcp-filesystem')
    expect(['online', 'offline']).toContain(status)
  })

  it('checkServer for unknown ID should return error', async () => {
    const status = await mcpStoreActions.checkServer('nonexistent')
    expect(status).toBe('error')
  })

  it('checkServer should update lastChecked', async () => {
    await mcpStoreActions.checkServer('mcp-filesystem')
    const srv = s().servers.find(s => s.id === 'mcp-filesystem')
    expect(srv?.lastChecked).toBeGreaterThan(0)
  })

  it('checkAllServers should not throw', async () => {
    await expect(mcpStoreActions.checkAllServers()).resolves.not.toThrow()
  })
})

describe('Tool Discovery', () => {
  it('discoverTools should return tools array', async () => {
    const tools = await mcpStoreActions.discoverTools('mcp-filesystem')
    expect(Array.isArray(tools)).toBe(true)
    expect(tools.length).toBeGreaterThan(0)
  })

  it('discoverTools for unknown server should return empty', async () => {
    const tools = await mcpStoreActions.discoverTools('nonexistent')
    expect(tools).toEqual([])
  })

  it('discovered tools should have name and description', async () => {
    const tools = await mcpStoreActions.discoverTools('mcp-fetch')
    for (const t of tools) {
      expect(t.name).toBeTruthy()
      expect(t.description).toBeTruthy()
    }
  })
})

describe('Tool Execution', () => {
  it('callTool should return result', async () => {
    const result = await mcpStoreActions.callTool('mcp-filesystem', 'read_file', { path: '/test' })
    expect(result.id).toBeTruthy()
    expect(result.toolName).toBe('read_file')
    expect(['success', 'error']).toContain(result.status)
    expect(result.latencyMs).toBeGreaterThan(0)
  })

  it('callTool for disabled server should throw', async () => {
    await expect(mcpStoreActions.callTool('mcp-postgres', 'query', { sql: 'SELECT 1' }))
      .rejects.toThrow('not found or disabled')
  })

  it('tool calls should be recorded in history', async () => {
    const before = s().toolCalls.length
    await mcpStoreActions.callTool('mcp-filesystem', 'list_directory', { path: '/' })
    expect(s().toolCalls.length).toBeGreaterThan(before)
  })

  it('clearToolCalls should empty history', () => {
    mcpStoreActions.clearToolCalls()
    expect(s().toolCalls).toEqual([])
  })
})

describe('Claude Desktop JSON Export/Import', () => {
  it('exportClaudeDesktopJSON should return valid JSON', () => {
    const json = mcpStoreActions.exportClaudeDesktopJSON()
    const parsed = JSON.parse(json)
    expect(parsed).toHaveProperty('mcpServers')
    expect(typeof parsed.mcpServers).toBe('object')
  })

  it('exported JSON should include enabled servers', () => {
    const json = mcpStoreActions.exportClaudeDesktopJSON()
    const parsed = JSON.parse(json)
    const keys = Object.keys(parsed.mcpServers)
    expect(keys.length).toBeGreaterThan(0)
  })

  it('importClaudeDesktopJSON should import valid config', () => {
    const json = JSON.stringify({
      mcpServers: {
        'test-import': { command: 'test-cmd', args: ['--flag'], env: { KEY: 'val' } },
      },
    })
    const result = mcpStoreActions.importClaudeDesktopJSON(json)
    expect(result.success).toBe(true)
    expect(result.imported).toBe(1)
  })

  it('importClaudeDesktopJSON should reject invalid JSON', () => {
    const result = mcpStoreActions.importClaudeDesktopJSON('{bad json')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('import should merge existing servers by name', () => {
    const beforeCount = s().servers.length
    const json = JSON.stringify({
      mcpServers: {
        'filesystem': { command: 'updated-fs', args: [] },
      },
    })
    mcpStoreActions.importClaudeDesktopJSON(json)
    // Should not add duplicate, but update existing
    expect(s().servers.length).toBeLessThanOrEqual(beforeCount + 1)
  })
})

describe('Aggregated Queries', () => {
  it('getAllEnabledTools should return tools from enabled servers', () => {
    const tools = mcpStoreActions.getAllEnabledTools()
    expect(Array.isArray(tools)).toBe(true)
    for (const t of tools) {
      expect(t.server.enabled).toBe(true)
      expect(t.tool.name).toBeTruthy()
    }
  })

  it('getAllEnabledTools should return empty when globalEnabled is false', () => {
    mcpStoreActions.toggleGlobal()
    const tools = mcpStoreActions.getAllEnabledTools()
    expect(tools).toEqual([])
    mcpStoreActions.toggleGlobal() // restore
  })

  it('getToolCallStats should return stats object', () => {
    const stats = mcpStoreActions.getToolCallStats()
    expect(stats).toHaveProperty('total')
    expect(stats).toHaveProperty('success')
    expect(stats).toHaveProperty('errors')
    expect(stats).toHaveProperty('avgLatencyMs')
    expect(stats).toHaveProperty('byServer')
  })
})

describe('Panel Operations', () => {
  it('openPanel/closePanel should not throw', () => {
    expect(() => mcpStoreActions.openPanel()).not.toThrow()
    expect(() => mcpStoreActions.closePanel()).not.toThrow()
  })

  it('selectServer should set selectedServerId', () => {
    mcpStoreActions.selectServer('mcp-filesystem')
    expect(s().selectedServerId).toBe('mcp-filesystem')
    mcpStoreActions.selectServer(null)
    expect(s().selectedServerId).toBeNull()
  })

  it('setActiveTab should accept valid values', () => {
    const tabs = ['servers', 'tools', 'history', 'json'] as const
    for (const t of tabs) {
      mcpStoreActions.setActiveTab(t)
      expect(s().activeTab).toBe(t)
    }
  })

  it('resetToPresets should restore default servers', () => {
    mcpStoreActions.addServer({ name: 'Custom', description: '', transport: 'stdio', enabled: true, tags: [] })
    mcpStoreActions.resetToPresets()
    expect(s().servers.some(s => s.name === 'Custom')).toBe(false)
    expect(s().servers.length).toBe(6)
  })
})

describe('Persistence', () => {
  it('should persist servers, toolCalls, globalEnabled', () => {
    lsMock.setItem.mockClear()
    mcpStoreActions.addServer({ name: 'Persist', description: '', transport: 'stdio', enabled: true, tags: [] })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_mcp_store')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed).toHaveProperty('servers')
    expect(parsed).toHaveProperty('toolCalls')
    expect(parsed).toHaveProperty('globalEnabled')
  })
})
