/**
 * @file mcp-store.ts
 * @description MCP状态管理模块，管理MCP协议和连接
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags mcp,ai,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== Type Definitions =====

/** MCP 传输协议 */
export type MCPTransport = 'stdio' | 'sse' | 'streamable-http'

/** MCP Server 连接状态 */
export type MCPServerStatus = 'unknown' | 'checking' | 'online' | 'offline' | 'error'

/** MCP 工具定义（从 server 发现） */
export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/** MCP 资源定义（从 server 发现） */
export interface MCPResource {
  uri: string
  name: string
  mimeType?: string
  description?: string
}

/** MCP Prompt 模板 */
export interface MCPPrompt {
  name: string
  description?: string
  arguments?: Array<{ name: string; description?: string; required?: boolean }>
}

/** MCP Server 配置 */
export interface MCPServerConfig {
  /** 唯一 ID */
  id: string
  /** 显示名称 */
  name: string
  /** 描述 */
  description: string
  /** 传输协议 */
  transport: MCPTransport
  /** 命令（stdio 模式） */
  command?: string
  /** 命令参数（stdio 模式） */
  args?: string[]
  /** 环境变量 */
  env?: Record<string, string>
  /** URL（sse/streamable-http 模式） */
  url?: string
  /** 启用状态 */
  enabled: boolean
  /** 连接状态 */
  status: MCPServerStatus
  /** 上次检测时间 */
  lastChecked?: number
  /** 错误信息 */
  error?: string
  /** 已发现的工具 */
  tools: MCPTool[]
  /** 已发现的资源 */
  resources: MCPResource[]
  /** 已发现的 Prompt 模板 */
  prompts: MCPPrompt[]
  /** 分类标签 */
  tags: string[]
  /** 创建时间 */
  createdAt: number
  /** 图标（Lucide name） */
  icon?: string
  /** 主题色 */
  color?: string
}

/** MCP 工具调用记录 */
export interface MCPToolCall {
  id: string
  serverId: string
  serverName: string
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  error?: string
  timestamp: number
  latencyMs: number
  status: 'pending' | 'success' | 'error'
}

// ===== State =====
interface MCPStoreState {
  /** MCP Server 列表 */
  servers: MCPServerConfig[]
  /** 工具调用记录 */
  toolCalls: MCPToolCall[]
  /** 面板可见 */
  panelVisible: boolean
  /** 当前选中 Server ID */
  selectedServerId: string | null
  /** 活跃子面板 */
  activeTab: 'servers' | 'tools' | 'history' | 'json'
  /** 全局启用 MCP */
  globalEnabled: boolean
  /** 版本号（用于依赖刷新） */
  revision: number
}

// ===== Persistence =====
const LS_KEY = 'yyc3_mcp_store'
const MAX_TOOL_CALLS = 100

function loadState(): Partial<MCPStoreState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(s: MCPStoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      servers: s.servers,
      toolCalls: s.toolCalls.slice(-MAX_TOOL_CALLS),
      globalEnabled: s.globalEnabled,
    }))
  } catch { /* ignore */ }
}

// ===== Preset Servers (对齐 Guidelines: MCP 工具集成) =====
const PRESET_SERVERS: MCPServerConfig[] = [
  {
    id: 'mcp-filesystem',
    name: 'Filesystem',
    description: '文件系统读写 — 安全沙箱模式',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/app/designs'],
    env: {},
    enabled: true,
    status: 'unknown',
    tools: [
      { name: 'read_file', description: '读取文件内容', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
      { name: 'write_file', description: '写入文件内容', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
      { name: 'list_directory', description: '列出目录内容', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    ],
    resources: [],
    prompts: [],
    tags: ['filesystem', 'core'],
    createdAt: Date.now(),
    icon: 'FolderOpen',
    color: '#10b981',
  },
  {
    id: 'mcp-fetch',
    name: 'Fetch',
    description: 'HTTP 请求工具 — 支持 GET/POST/PUT/DELETE',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    env: {},
    enabled: true,
    status: 'unknown',
    tools: [
      { name: 'fetch', description: '执行 HTTP 请求', inputSchema: { type: 'object', properties: { url: { type: 'string' }, method: { type: 'string' }, headers: { type: 'object' }, body: { type: 'string' } }, required: ['url'] } },
    ],
    resources: [],
    prompts: [],
    tags: ['http', 'network'],
    createdAt: Date.now(),
    icon: 'Globe',
    color: '#3b82f6',
  },
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL',
    description: '数据库查询工具 — 支持 SELECT/INSERT/UPDATE/DELETE',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: { DATABASE_URL: 'postgresql://user:password@localhost:5432/mydb' },
    enabled: false,
    status: 'unknown',
    tools: [
      { name: 'query', description: '执行 SQL 查询', inputSchema: { type: 'object', properties: { sql: { type: 'string' } }, required: ['sql'] } },
    ],
    resources: [],
    prompts: [],
    tags: ['database', 'sql'],
    createdAt: Date.now(),
    icon: 'Database',
    color: '#8b5cf6',
  },
  {
    id: 'mcp-memory',
    name: 'Memory',
    description: '知识图谱记忆 — 持久化键值存储',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
    enabled: false,
    status: 'unknown',
    tools: [
      { name: 'store', description: '存储键值对', inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
      { name: 'retrieve', description: '检索键值对', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
    ],
    resources: [],
    prompts: [],
    tags: ['memory', 'knowledge'],
    createdAt: Date.now(),
    icon: 'Brain',
    color: '#f59e0b',
  },
  {
    id: 'mcp-github',
    name: 'GitHub',
    description: 'GitHub API 集成 — Issue/PR/Repo 管理',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    enabled: false,
    status: 'unknown',
    tools: [
      { name: 'search_repositories', description: '搜索仓库', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'create_issue', description: '创建 Issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] } },
    ],
    resources: [],
    prompts: [],
    tags: ['git', 'integration'],
    createdAt: Date.now(),
    icon: 'Github',
    color: '#e2e8f0',
  },
  {
    id: 'mcp-brave-search',
    name: 'Brave Search',
    description: 'Web 搜索 — 通过 Brave Search API',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '' },
    enabled: false,
    status: 'unknown',
    tools: [
      { name: 'brave_web_search', description: '执行 Web 搜索', inputSchema: { type: 'object', properties: { query: { type: 'string' }, count: { type: 'number' } }, required: ['query'] } },
    ],
    resources: [],
    prompts: [],
    tags: ['search', 'web'],
    createdAt: Date.now(),
    icon: 'Search',
    color: '#ef4444',
  },
]

// ===== Module Store =====
const persisted = loadState()
let state: MCPStoreState = {
  servers: persisted.servers || [...PRESET_SERVERS],
  toolCalls: persisted.toolCalls || [],
  panelVisible: false,
  selectedServerId: null,
  activeTab: 'servers',
  globalEnabled: persisted.globalEnabled ?? true,
  revision: 0,
}

const listeners = new Set<() => void>()

function emit() {
  state = { ...state, revision: state.revision + 1 }
  saveState(state)
  listeners.forEach(fn => fn())
}

function genId() {
  return 'mcp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

// ===== Actions =====
export const mcpStoreActions = {
  /** 获取当前状态 */
  getState: () => state,

  // ===== Server CRUD =====

  /** 添加 MCP Server */
  addServer(config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'status' | 'tools' | 'resources' | 'prompts'>): string {
    const id = genId()
    const server: MCPServerConfig = {
      ...config,
      id,
      createdAt: Date.now(),
      status: 'unknown',
      tools: [],
      resources: [],
      prompts: [],
    }
    state = { ...state, servers: [...state.servers, server] }
    emit()
    return id
  },

  /** 编辑 MCP Server */
  editServer(id: string, updates: Partial<MCPServerConfig>) {
    state = {
      ...state,
      servers: state.servers.map(s => s.id === id ? { ...s, ...updates } : s),
    }
    emit()
  },

  /** 删除 MCP Server */
  removeServer(id: string) {
    state = {
      ...state,
      servers: state.servers.filter(s => s.id !== id),
      selectedServerId: state.selectedServerId === id ? null : state.selectedServerId,
    }
    emit()
  },

  /** 切换 Server 启用/禁用 */
  toggleServer(id: string) {
    state = {
      ...state,
      servers: state.servers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }
    emit()
  },

  /** 切换全局 MCP 启用 */
  toggleGlobal() {
    state = { ...state, globalEnabled: !state.globalEnabled }
    emit()
  },

  // ===== Health Check (对齐 Guidelines: Intelligent Detection) =====

  /** 检测单个 Server 健康状态 */
  async checkServer(id: string): Promise<MCPServerStatus> {
    const server = state.servers.find(s => s.id === id)
    if (!server) return 'error'

    state = {
      ...state,
      servers: state.servers.map(s => s.id === id ? { ...s, status: 'checking' } : s),
    }
    emit()

    // 模拟健康检测（实际: Tauri invoke → spawn MCP server process → list tools）
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000))

    const isOnline = server.enabled && Math.random() > 0.15
    const status: MCPServerStatus = isOnline ? 'online' : 'offline'

    state = {
      ...state,
      servers: state.servers.map(s => s.id === id
        ? { ...s, status, lastChecked: Date.now(), error: isOnline ? undefined : 'Connection refused or server not running' }
        : s
      ),
    }
    emit()
    return status
  },

  /** 批量检测所有启用的 Server */
  async checkAllServers(): Promise<void> {
    const enabled = state.servers.filter(s => s.enabled)
    await Promise.allSettled(enabled.map(s => mcpStoreActions.checkServer(s.id)))
  },

  // ===== Tool Discovery (对齐 Guidelines: MCP Tool Integration) =====

  /** 发现 Server 提供的工具 */
  async discoverTools(serverId: string): Promise<MCPTool[]> {
    const server = state.servers.find(s => s.id === serverId)
    if (!server) return []

    // 模拟工具发现（实际: Tauri invoke → tools/list RPC）
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500))

    // 返回预置的工具 + 模拟新发现
    const tools = [...server.tools]
    if (tools.length === 0) {
      tools.push({
        name: `${server.name.toLowerCase()}_default`,
        description: `Default tool for ${server.name}`,
        inputSchema: { type: 'object', properties: {} },
      })
    }

    state = {
      ...state,
      servers: state.servers.map(s => s.id === serverId ? { ...s, tools } : s),
    }
    emit()
    return tools
  },

  /** 发现 Server 提供的资源 */
  async discoverResources(serverId: string): Promise<MCPResource[]> {
    await new Promise(r => setTimeout(r, 200))
    return state.servers.find(s => s.id === serverId)?.resources || []
  },

  // ===== Tool Execution (模拟) =====

  /** 执行 MCP 工具调用 */
  async callTool(serverId: string, toolName: string, input: Record<string, unknown>): Promise<MCPToolCall> {
    const server = state.servers.find(s => s.id === serverId)
    if (!server || !server.enabled) {
      throw new Error(`Server ${serverId} not found or disabled`)
    }

    const call: MCPToolCall = {
      id: genId(),
      serverId,
      serverName: server.name,
      toolName,
      input,
      timestamp: Date.now(),
      latencyMs: 0,
      status: 'pending',
    }

    state = { ...state, toolCalls: [...state.toolCalls, call].slice(-MAX_TOOL_CALLS) }
    emit()

    // 模拟执行（实际: Tauri invoke → tools/call RPC）
    const startTime = Date.now()
    await new Promise(r => setTimeout(r, 200 + Math.random() * 800))
    const latencyMs = Date.now() - startTime

    const success = Math.random() > 0.1
    const updatedCall: MCPToolCall = {
      ...call,
      latencyMs,
      status: success ? 'success' : 'error',
      output: success ? { result: `Mock result from ${toolName}`, data: input } : undefined,
      error: success ? undefined : `Tool execution failed: ${toolName}`,
    }

    state = {
      ...state,
      toolCalls: state.toolCalls.map(c => c.id === call.id ? updatedCall : c),
    }
    emit()
    return updatedCall
  },

  // ===== Configuration Import/Export (兼容 Claude Desktop JSON) =====

  /** 导出为 Claude Desktop 兼容 JSON 格式 */
  exportClaudeDesktopJSON(): string {
    const config: Record<string, unknown> = { mcpServers: {} }
    const mcpServers: Record<string, unknown> = {}
    for (const s of state.servers) {
      const entry: Record<string, unknown> = {}
      if (s.transport === 'stdio') {
        entry.command = s.command || ''
        entry.args = s.args || []
        if (s.env && Object.keys(s.env).length > 0) entry.env = s.env
      } else {
        entry.url = s.url || ''
        entry.transport = s.transport
      }
      mcpServers[s.name.toLowerCase().replace(/\s+/g, '-')] = entry
    }
    config.mcpServers = mcpServers
    return JSON.stringify(config, null, 2)
  },

  /** 从 Claude Desktop 兼容 JSON 导入 */
  importClaudeDesktopJSON(json: string): { success: boolean; imported: number; error?: string } {
    try {
      const parsed = JSON.parse(json)
      const mcpServers = parsed.mcpServers || parsed
      if (typeof mcpServers !== 'object') {
        return { success: false, imported: 0, error: 'Invalid format: expected mcpServers object' }
      }

      const imported: MCPServerConfig[] = []
      for (const [name, conf] of Object.entries(mcpServers)) {
        const c = conf as Record<string, unknown>
        const server: MCPServerConfig = {
          id: genId(),
          name: String(name).charAt(0).toUpperCase() + String(name).slice(1),
          description: (c.description as string) || name,
          transport: (c.transport as MCPTransport) || (c.command ? 'stdio' : 'sse'),
          command: (c.command as string) || undefined,
          args: Array.isArray(c.args) ? c.args.map(String) : undefined,
          env: (c.env as Record<string, string>) || undefined,
          url: (c.url as string) || undefined,
          enabled: true,
          status: 'unknown',
          tools: [],
          resources: [],
          prompts: [],
          tags: ['imported'],
          createdAt: Date.now(),
        }
        imported.push(server)
      }

      // Merge: replace existing by name or add new
      const existingNames = new Set(state.servers.map(s => s.name.toLowerCase()))
      const newServers = [...state.servers]
      let importedCount = 0
      for (const imp of imported) {
        if (existingNames.has(imp.name.toLowerCase())) {
          // Update existing
          const idx = newServers.findIndex(s => s.name.toLowerCase() === imp.name.toLowerCase())
          if (idx !== -1) {
            newServers[idx] = { ...newServers[idx], ...imp, id: newServers[idx].id, createdAt: newServers[idx].createdAt }
          }
        } else {
          newServers.push(imp)
        }
        importedCount++
      }

      state = { ...state, servers: newServers }
      emit()
      return { success: true, imported: importedCount }
    } catch (err) {
      return { success: false, imported: 0, error: err instanceof Error ? err.message : 'Parse error' }
    }
  },

  // ===== Aggregated Queries =====

  /** 获取所有已启用 Server 的工具列表 */
  getAllEnabledTools(): Array<{ server: MCPServerConfig; tool: MCPTool }> {
    if (!state.globalEnabled) return []
    const result: Array<{ server: MCPServerConfig; tool: MCPTool }> = []
    for (const s of state.servers) {
      if (!s.enabled) continue
      for (const t of s.tools) {
        result.push({ server: s, tool: t })
      }
    }
    return result
  },

  /** 获取工具调用统计 */
  getToolCallStats(): {
    total: number
    success: number
    errors: number
    avgLatencyMs: number
    byServer: Record<string, { calls: number; errors: number }>
  } {
    const calls = state.toolCalls
    const success = calls.filter(c => c.status === 'success').length
    const errors = calls.filter(c => c.status === 'error').length
    const latencies = calls.filter(c => c.latencyMs > 0).map(c => c.latencyMs)
    const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0

    const byServer: Record<string, { calls: number; errors: number }> = {}
    for (const c of calls) {
      if (!byServer[c.serverName]) byServer[c.serverName] = { calls: 0, errors: 0 }
      byServer[c.serverName].calls++
      if (c.status === 'error') byServer[c.serverName].errors++
    }

    return { total: calls.length, success, errors, avgLatencyMs, byServer }
  },

  /** 清除工具调用记录 */
  clearToolCalls() {
    state = { ...state, toolCalls: [] }
    emit()
  },

  // ===== Panel State =====

  openPanel() { state = { ...state, panelVisible: true }; emit() },
  closePanel() { state = { ...state, panelVisible: false }; emit() },
  selectServer(id: string | null) { state = { ...state, selectedServerId: id }; emit() },
  setActiveTab(tab: MCPStoreState['activeTab']) { state = { ...state, activeTab: tab }; emit() },

  /** 恢复预置 Servers */
  resetToPresets() {
    state = { ...state, servers: [...PRESET_SERVERS] }
    emit()
  },
}

// ===== React Hook =====
export function useMCPStore() {
  const snapshot = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    () => state,
  )
  return { ...snapshot, ...mcpStoreActions }
}

export { mcpStoreActions as mcpStore }
