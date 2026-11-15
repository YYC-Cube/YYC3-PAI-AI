
/**
 * @file settings-store.ts
 * @description 设置状态管理模块，管理用户设置和配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,configuration,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== Type Definitions =====

/** 用户信息 */
export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
}

/** 智能体配置 */
export interface AgentConfig {
  id: string
  name: string
  description?: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  isBuiltIn: boolean
  isCustom: boolean
  enabled: boolean
}

/** 上下文设置 */
export interface ContextSettings {
  indexStatus: 'idle' | 'indexing' | 'completed' | 'error'
  ignoreRules: string[]
  documentSets: DocumentSet[]
}

/** 文档集 */
export interface DocumentSet {
  id: string
  name: string
  source: 'url' | 'local'
  url?: string
  localPath?: string
  enabled: boolean
}

/** 代码审查范围 */
export type CodeReviewScope = 'none' | 'all' | 'changed'

/** 命令运行方式 */
export type CommandRunMode = 'sandbox' | 'direct'

/** 提示音类型 */
export type SoundType = 'complete' | 'waiting' | 'interrupt'

/** 通知类型 */
export type NotificationType = 'banner' | 'sound' | 'menu'

/** 对话流设置 */
export interface ConversationSettings {
  useTodoList: boolean
  autoCollapseNodes: boolean
  autoFixCodeIssues: boolean
  agentProactiveQuestion: boolean
  codeReviewScope: CodeReviewScope
  jumpAfterReview: boolean
  autoRunMCP: boolean
  commandRunMode: CommandRunMode
  whitelistCommands: string[]
  notificationTypes: NotificationType[]
  volume: number
  soundConfig: Record<SoundType, string>
}

/** 规则配置 */
export interface RuleConfig {
  id: string
  name: string
  content: string
  scope: 'personal' | 'project'
  enabled: boolean
}

/** 技能配置 */
export interface SkillConfig {
  id: string
  name: string
  description?: string
  content: string
  scope: 'global' | 'project'
  enabled: boolean
}

/** 导入设置 */
export interface ImportSettings {
  includeAgentsMD: boolean
  includeClaudeMD: boolean
}

/** 性能监控设置 */
export interface PerformanceSettings {
  enabled: boolean
  enableWebVitals: boolean
  enableSystemMonitoring: boolean
  enableMemoryMonitoring: boolean
  enableFPSMonitoring: boolean
  sampleInterval: number
  debugMode: boolean
}

// ===== State =====

interface SettingsStoreState {
  userProfile: UserProfile
  agents: AgentConfig[]
  context: ContextSettings
  conversation: ConversationSettings
  rules: RuleConfig[]
  skills: SkillConfig[]
  importSettings: ImportSettings
  performance: PerformanceSettings
  searchQuery: string
  revision: number
}

// ===== Defaults =====

const DEFAULT_USER_PROFILE: UserProfile = {
  id: crypto.randomUUID?.() ?? 'user-1',
  username: 'Operator',
  email: '',
  avatar: '',
  bio: '',
}

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-coder',
    name: 'Code Assistant',
    description: '代码编写与审查助手',
    systemPrompt: 'You are an expert code assistant. Help the user write clean, efficient, and well-documented code.',
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 4096,
    isBuiltIn: true,
    isCustom: false,
    enabled: true,
  },
  {
    id: 'agent-reviewer',
    name: 'Code Reviewer',
    description: '代码审查与优化建议',
    systemPrompt: 'You are a senior code reviewer. Analyze the code for bugs, performance issues, and best practices.',
    model: 'gpt-4-turbo-preview',
    temperature: 0.2,
    maxTokens: 4096,
    isBuiltIn: true,
    isCustom: false,
    enabled: true,
  },
  {
    id: 'agent-architect',
    name: 'System Architect',
    description: '系统架构设计顾问',
    systemPrompt: 'You are a system architect. Help design scalable, maintainable, and robust software architectures.',
    model: 'gpt-4-turbo-preview',
    temperature: 0.5,
    maxTokens: 8192,
    isBuiltIn: true,
    isCustom: false,
    enabled: true,
  },
]

const DEFAULT_CONVERSATION: ConversationSettings = {
  useTodoList: true,
  autoCollapseNodes: false,
  autoFixCodeIssues: true,
  agentProactiveQuestion: true,
  codeReviewScope: 'all',
  jumpAfterReview: true,
  autoRunMCP: false,
  commandRunMode: 'sandbox',
  whitelistCommands: ['npm test', 'npm run build', 'pnpm test', 'pnpm build'],
  notificationTypes: ['banner', 'sound'],
  volume: 80,
  soundConfig: { complete: 'default', waiting: 'default', interrupt: 'default' },
}

const DEFAULT_CONTEXT: ContextSettings = {
  indexStatus: 'idle',
  ignoreRules: ['node_modules', '.git', 'dist', 'build', '.next', '*.log'],
  documentSets: [],
}

const DEFAULT_IMPORT: ImportSettings = {
  includeAgentsMD: false,
  includeClaudeMD: false,
}

const DEFAULT_PERFORMANCE: PerformanceSettings = {
  enabled: true,
  enableWebVitals: true,
  enableSystemMonitoring: false,
  enableMemoryMonitoring: true,
  enableFPSMonitoring: true,
  sampleInterval: 2000,
  debugMode: false,
}

// ===== Persistence =====

const LS_KEY = 'yyc3_settings_store'

function loadState(): Partial<SettingsStoreState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(s: SettingsStoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      userProfile: s.userProfile,
      agents: s.agents,
      context: s.context,
      conversation: s.conversation,
      rules: s.rules,
      skills: s.skills,
      importSettings: s.importSettings,
      performance: s.performance,
    }))
  } catch { /* ignore */ }
}

// ===== Store Implementation =====

const persisted = loadState()
let state: SettingsStoreState = {
  userProfile: persisted.userProfile ?? DEFAULT_USER_PROFILE,
  agents: persisted.agents ?? DEFAULT_AGENTS,
  context: persisted.context ?? DEFAULT_CONTEXT,
  conversation: persisted.conversation ?? DEFAULT_CONVERSATION,
  rules: persisted.rules ?? [],
  skills: persisted.skills ?? [],
  importSettings: persisted.importSettings ?? DEFAULT_IMPORT,
  performance: persisted.performance ?? DEFAULT_PERFORMANCE,
  searchQuery: '',
  revision: 0,
}

const listeners = new Set<() => void>()

function emit() {
  state = { ...state, revision: state.revision + 1 }
  saveState(state)
  listeners.forEach(fn => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function getSnapshot() { return state }

// ===== Actions =====

export const settingsActions = {
  // User Profile
  updateUserProfile(updates: Partial<UserProfile>) {
    state = { ...state, userProfile: { ...state.userProfile, ...updates } }
    emit()
  },

  // Agents
  addAgent(agent: Omit<AgentConfig, 'id'>) {
    const newAgent: AgentConfig = { ...agent, id: `agent-${Date.now()}` }
    state = { ...state, agents: [...state.agents, newAgent] }
    emit()
    return newAgent
  },
  updateAgent(id: string, updates: Partial<AgentConfig>) {
    state = { ...state, agents: state.agents.map(a => a.id === id ? { ...a, ...updates } : a) }
    emit()
  },
  removeAgent(id: string) {
    state = { ...state, agents: state.agents.filter(a => a.id !== id) }
    emit()
  },
  toggleAgent(id: string) {
    state = { ...state, agents: state.agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a) }
    emit()
  },

  // Context
  updateContext(updates: Partial<ContextSettings>) {
    state = { ...state, context: { ...state.context, ...updates } }
    emit()
  },
  addIgnoreRule(rule: string) {
    if (!state.context.ignoreRules.includes(rule)) {
      state = { ...state, context: { ...state.context, ignoreRules: [...state.context.ignoreRules, rule] } }
      emit()
    }
  },
  removeIgnoreRule(rule: string) {
    state = { ...state, context: { ...state.context, ignoreRules: state.context.ignoreRules.filter(r => r !== rule) } }
    emit()
  },
  addDocumentSet(doc: Omit<DocumentSet, 'id'>) {
    const newDoc: DocumentSet = { ...doc, id: `doc-${Date.now()}` }
    state = { ...state, context: { ...state.context, documentSets: [...state.context.documentSets, newDoc] } }
    emit()
    return newDoc
  },
  removeDocumentSet(id: string) {
    state = { ...state, context: { ...state.context, documentSets: state.context.documentSets.filter(d => d.id !== id) } }
    emit()
  },
  toggleDocumentSet(id: string) {
    state = {
      ...state,
      context: {
        ...state.context,
        documentSets: state.context.documentSets.map(d =>
          d.id === id ? { ...d, enabled: !d.enabled } : d
        ),
      },
    }
    emit()
  },

  // Conversation
  updateConversation(updates: Partial<ConversationSettings>) {
    state = { ...state, conversation: { ...state.conversation, ...updates } }
    emit()
  },
  addWhitelistCommand(cmd: string) {
    if (!state.conversation.whitelistCommands.includes(cmd)) {
      state = {
        ...state,
        conversation: {
          ...state.conversation,
          whitelistCommands: [...state.conversation.whitelistCommands, cmd],
        },
      }
      emit()
    }
  },
  removeWhitelistCommand(cmd: string) {
    state = {
      ...state,
      conversation: {
        ...state.conversation,
        whitelistCommands: state.conversation.whitelistCommands.filter(c => c !== cmd),
      },
    }
    emit()
  },

  // Rules
  addRule(rule: Omit<RuleConfig, 'id'>) {
    const newRule: RuleConfig = { ...rule, id: `rule-${Date.now()}` }
    state = { ...state, rules: [...state.rules, newRule] }
    emit()
    return newRule
  },
  updateRule(id: string, updates: Partial<RuleConfig>) {
    state = { ...state, rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r) }
    emit()
  },
  removeRule(id: string) {
    state = { ...state, rules: state.rules.filter(r => r.id !== id) }
    emit()
  },
  toggleRule(id: string) {
    state = { ...state, rules: state.rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) }
    emit()
  },

  // Skills
  addSkill(skill: Omit<SkillConfig, 'id'>) {
    const newSkill: SkillConfig = { ...skill, id: `skill-${Date.now()}` }
    state = { ...state, skills: [...state.skills, newSkill] }
    emit()
    return newSkill
  },
  updateSkill(id: string, updates: Partial<SkillConfig>) {
    state = { ...state, skills: state.skills.map(s => s.id === id ? { ...s, ...updates } : s) }
    emit()
  },
  removeSkill(id: string) {
    state = { ...state, skills: state.skills.filter(s => s.id !== id) }
    emit()
  },
  toggleSkill(id: string) {
    state = { ...state, skills: state.skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s) }
    emit()
  },

  // Import settings
  updateImportSettings(updates: Partial<ImportSettings>) {
    state = { ...state, importSettings: { ...state.importSettings, ...updates } }
    emit()
  },

  // Performance settings
  updatePerformanceSettings(updates: Partial<PerformanceSettings>) {
    state = { ...state, performance: { ...state.performance, ...updates } }
    emit()
  },
  togglePerformanceMonitoring() {
    state = { ...state, performance: { ...state.performance, enabled: !state.performance.enabled } }
    emit()
  },
  toggleWebVitalsMonitoring() {
    state = { ...state, performance: { ...state.performance, enableWebVitals: !state.performance.enableWebVitals } }
    emit()
  },
  toggleSystemMonitoring() {
    state = { ...state, performance: { ...state.performance, enableSystemMonitoring: !state.performance.enableSystemMonitoring } }
    emit()
  },
  setPerformanceSampleInterval(interval: number) {
    state = { ...state, performance: { ...state.performance, sampleInterval: interval } }
    emit()
  },

  // Search
  setSearchQuery(query: string) {
    state = { ...state, searchQuery: query }
    listeners.forEach(fn => fn())
  },

  // Import/Export
  exportConfig() {
    return {
      userProfile: state.userProfile,
      agents: state.agents,
      context: state.context,
      conversation: state.conversation,
      rules: state.rules,
      skills: state.skills,
      importSettings: state.importSettings,
    }
  },
  importConfig(config: Partial<SettingsStoreState>) {
    if (config.userProfile) state = { ...state, userProfile: { ...state.userProfile, ...config.userProfile } }
    if (config.agents) state = { ...state, agents: config.agents }
    if (config.context) state = { ...state, context: { ...DEFAULT_CONTEXT, ...config.context } }
    if (config.conversation) state = { ...state, conversation: { ...DEFAULT_CONVERSATION, ...config.conversation } }
    if (config.rules) state = { ...state, rules: config.rules }
    if (config.skills) state = { ...state, skills: config.skills }
    if (config.importSettings) state = { ...state, importSettings: { ...DEFAULT_IMPORT, ...config.importSettings } }
    if (config.performance) state = { ...state, performance: { ...DEFAULT_PERFORMANCE, ...config.performance } }
    emit()
  },

  // Reset
  resetSettings() {
    state = {
      ...state,
      userProfile: DEFAULT_USER_PROFILE,
      agents: DEFAULT_AGENTS,
      context: DEFAULT_CONTEXT,
      conversation: DEFAULT_CONVERSATION,
      rules: [],
      skills: [],
      importSettings: DEFAULT_IMPORT,
      performance: DEFAULT_PERFORMANCE,
    }
    emit()
  },

  // ===== Cross-Module Sync Bridge (对齐 Guidelines: 跨模块数据联动) =====

  /**
   * 将启用的规则 + 技能组装为 AI 系统提示词片段
   * 供 model-store / AI chat 使用
   */
  getActiveRulesAsSystemPrompt(): string {
    const parts: string[] = []
    const enabledRules = state.rules.filter(r => r.enabled)
    const enabledSkills = state.skills.filter(s => s.enabled)
    if (enabledRules.length > 0) {
      parts.push('## Active Rules')
      for (const r of enabledRules) parts.push(`### [${r.scope}] ${r.name}\n${r.content}`)
    }
    if (enabledSkills.length > 0) {
      parts.push('## Active Skills')
      for (const s of enabledSkills) parts.push(`### [${s.scope}] ${s.name}${s.description ? ` — ${s.description}` : ''}\n${s.content}`)
    }
    return parts.join('\n\n')
  },

  /**
   * 获取指定智能体的系统提示词（合并规则注入）
   */
  getAgentSystemPrompt(agentId: string): string {
    const agent = state.agents.find(a => a.id === agentId)
    if (!agent) return ''
    const rulesInjection = settingsActions.getActiveRulesAsSystemPrompt()
    return rulesInjection ? `${agent.systemPrompt}\n\n---\n\n${rulesInjection}` : agent.systemPrompt
  },

  /**
   * 模型 API Key 验证 — 先格式校验，再尝试真实 /models endpoint 探测
   * Tauri 环境下: invoke('validate_api_key', { provider, apiKey })
   * Web 环境下: 直接 fetch 验证（可能受 CORS 限制，fallback 到格式校验）
   */
  async validateModelApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string; latencyMs: number }> {
    const start = Date.now()
    if (!apiKey || apiKey.trim().length < 8)
      return { valid: false, error: 'API Key too short (min 8 chars)', latencyMs: Date.now() - start }

    // Provider-specific format patterns
    const formatChecks: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
      zhipuai: /^[a-zA-Z0-9_.-]{10,}$/,
      ollama: /^.+$/,
    }
    const pattern = formatChecks[provider]
    if (pattern && !pattern.test(apiKey.trim()))
      return { valid: false, error: `Format mismatch for ${provider}`, latencyMs: Date.now() - start }

    // Ollama (local) — no API key needed, just check if server is reachable
    if (provider === 'ollama') {
      const ollamaUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'
      try {
        const resp = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
        return { valid: resp.ok, latencyMs: Date.now() - start, error: resp.ok ? undefined : 'Ollama server not responding' }
      } catch {
        return { valid: false, error: `Cannot reach Ollama at ${ollamaUrl}`, latencyMs: Date.now() - start }
      }
    }

    // Real endpoint validation — try to hit /models or equivalent
    const endpoints: Record<string, { url: string; headers: Record<string, string> }> = {
      openai: { url: 'https://api.openai.com/v1/models', headers: { Authorization: `Bearer ${apiKey.trim()}` } },
      zhipuai: { url: 'https://open.bigmodel.cn/api/paas/v4/models', headers: { Authorization: `Bearer ${apiKey.trim()}` } },
      aliyun: { url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models', headers: { Authorization: `Bearer ${apiKey.trim()}` } },
      baidu: { url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro', headers: { Authorization: `Bearer ${apiKey.trim()}` } },
    }

    const endpointConfig = endpoints[provider]
    if (endpointConfig) {
      try {
        const resp = await fetch(endpointConfig.url, {
          method: 'GET',
          headers: { ...endpointConfig.headers, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        const latencyMs = Date.now() - start
        if (resp.ok || resp.status === 200) {
          return { valid: true, latencyMs }
        }
        if (resp.status === 401 || resp.status === 403) {
          return { valid: false, error: 'Authentication failed — invalid API Key', latencyMs }
        }
        if (resp.status === 429) {
          // Rate-limited but key is valid
          return { valid: true, latencyMs, error: 'Rate limited — key is valid but throttled' }
        }
        return { valid: false, error: `Server responded with HTTP ${resp.status}`, latencyMs }
      } catch {
        // CORS or network error — fallback to format-only validation
        const latencyMs = Date.now() - start
        const isFormatValid = apiKey.trim().length > 15
        return {
          valid: isFormatValid,
          error: isFormatValid
            ? 'Could not reach API (CORS/network) — validated by format only'
            : 'Validation failed — check API Key format and network',
          latencyMs,
        }
      }
    }

    // Unknown provider — format-only validation
    const isValid = apiKey.trim().length > 15
    return { valid: isValid, error: isValid ? undefined : 'Validation failed — check API Key', latencyMs: Date.now() - start }
  },

  /**
   * MCP 连接测试（Tauri 桥接模拟; 实际: invoke('mcp_test_connection', { ... })）
   */
  async testMCPConnection(config: { transport: string; command?: string; args?: string[]; url?: string }): Promise<{ connected: boolean; tools: number; latencyMs: number; error?: string }> {
    const start = Date.now()
    await new Promise(r => setTimeout(r, 400 + Math.random() * 800))
    if (config.transport === 'stdio' && config.command) {
      const ok = Math.random() > 0.2
      return { connected: ok, tools: ok ? Math.floor(Math.random() * 8) + 1 : 0, latencyMs: Date.now() - start, error: ok ? undefined : `Command "${config.command}" not found` }
    }
    if ((config.transport === 'sse' || config.transport === 'streamable-http') && config.url) {
      const ok = Math.random() > 0.3
      return { connected: ok, tools: ok ? Math.floor(Math.random() * 5) + 1 : 0, latencyMs: Date.now() - start, error: ok ? undefined : `Failed to connect to ${config.url}` }
    }
    return { connected: false, tools: 0, latencyMs: Date.now() - start, error: 'Invalid transport config' }
  },

  /**
   * 深度搜索 — 搜索所有设置字段，包括智能体温度/模型名、规则内容等
   */
  deepSearch(query: string): Array<{ tab: string; field: string; value: string; label: string }> {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results: Array<{ tab: string; field: string; value: string; label: string }> = []
    for (const a of state.agents) {
      if (a.name.toLowerCase().includes(q)) results.push({ tab: 'agents', field: 'name', value: a.name, label: `Agent: ${a.name}` })
      if (a.description?.toLowerCase().includes(q)) results.push({ tab: 'agents', field: 'desc', value: a.description!, label: `Agent desc: ${a.name}` })
      if (a.systemPrompt.toLowerCase().includes(q)) results.push({ tab: 'agents', field: 'prompt', value: a.systemPrompt.slice(0, 50), label: `Prompt: ${a.name}` })
      if (a.model.toLowerCase().includes(q)) results.push({ tab: 'agents', field: 'model', value: a.model, label: `Model: ${a.name}` })
      if (String(a.temperature).includes(q)) results.push({ tab: 'agents', field: 'temp', value: String(a.temperature), label: `Temp: ${a.name}` })
      if (String(a.maxTokens).includes(q)) results.push({ tab: 'agents', field: 'tokens', value: String(a.maxTokens), label: `MaxTokens: ${a.name}` })
    }
    for (const r of state.rules) {
      if (r.name.toLowerCase().includes(q)) results.push({ tab: 'rules-skills', field: 'name', value: r.name, label: `Rule: ${r.name}` })
      if (r.content.toLowerCase().includes(q)) results.push({ tab: 'rules-skills', field: 'content', value: r.content.slice(0, 50), label: `Rule content: ${r.name}` })
    }
    for (const s of state.skills) {
      if (s.name.toLowerCase().includes(q)) results.push({ tab: 'rules-skills', field: 'name', value: s.name, label: `Skill: ${s.name}` })
      if (s.content.toLowerCase().includes(q)) results.push({ tab: 'rules-skills', field: 'content', value: s.content.slice(0, 50), label: `Skill content: ${s.name}` })
    }
    for (const ir of state.context.ignoreRules) {
      if (ir.toLowerCase().includes(q)) results.push({ tab: 'context', field: 'ignore', value: ir, label: `Ignore: ${ir}` })
    }
    for (const d of state.context.documentSets) {
      if (d.name.toLowerCase().includes(q)) results.push({ tab: 'context', field: 'doc', value: d.name, label: `Doc: ${d.name}` })
    }
    for (const c of state.conversation.whitelistCommands) {
      if (c.toLowerCase().includes(q)) results.push({ tab: 'conversation', field: 'cmd', value: c, label: `Cmd: ${c}` })
    }
    if (state.userProfile.username.toLowerCase().includes(q)) results.push({ tab: 'account', field: 'user', value: state.userProfile.username, label: 'Username' })
    if (state.userProfile.email.toLowerCase().includes(q)) results.push({ tab: 'account', field: 'email', value: state.userProfile.email, label: 'Email' })
    return results
  },

  /** 获取当前状态快照 */
  getState: () => state,
}

/** Hook: 读取 settings store */
export function useSettingsStore() {
  const s = useSyncExternalStore(subscribe, getSnapshot)
  return s
}
