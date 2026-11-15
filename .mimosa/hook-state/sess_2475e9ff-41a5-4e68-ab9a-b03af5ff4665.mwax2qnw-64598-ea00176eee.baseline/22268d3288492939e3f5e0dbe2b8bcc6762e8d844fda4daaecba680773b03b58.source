/**
 * @file settings-store.test.ts
 * @description Unit test for settings-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { settingsActions } from '../settings-store'
import type { AgentConfig } from '../settings-store'

describe('settings-store', () => {
  beforeEach(() => {
    settingsActions.resetSettings()
  })

  // =============================================
  // 1. User Profile CRUD
  // =============================================
  describe('User Profile', () => {
    it('should update username', () => {
      settingsActions.updateUserProfile({ username: 'TestUser' })
      expect(settingsActions.exportConfig().userProfile.username).toBe('TestUser')
    })
    it('should update email', () => {
      settingsActions.updateUserProfile({ email: 'test@example.com' })
      expect(settingsActions.exportConfig().userProfile.email).toBe('test@example.com')
    })
    it('should update bio', () => {
      settingsActions.updateUserProfile({ bio: 'Hello world' })
      expect(settingsActions.exportConfig().userProfile.bio).toBe('Hello world')
    })
    it('should partially update profile without overwriting other fields', () => {
      settingsActions.updateUserProfile({ username: 'A', email: 'a@b.c' })
      settingsActions.updateUserProfile({ bio: 'Bio' })
      const p = settingsActions.exportConfig().userProfile
      expect(p.username).toBe('A')
      expect(p.bio).toBe('Bio')
    })
  })

  // =============================================
  // 2. Agent CRUD
  // =============================================
  describe('Agents', () => {
    it('should have 3 default built-in agents', () => {
      const agents = settingsActions.exportConfig().agents
      expect(agents.length).toBe(3)
      expect(agents.every((a: AgentConfig) => a.isBuiltIn)).toBe(true)
    })
    it('should add a custom agent', () => {
      const agent = settingsActions.addAgent({
        name: 'Custom', systemPrompt: 'Hello', model: 'gpt-4',
        temperature: 0.5, maxTokens: 2048, isBuiltIn: false, isCustom: true, enabled: true,
      })
      expect(settingsActions.exportConfig().agents.find((a: AgentConfig) => a.id === agent.id)).toBeTruthy()
    })
    it('should update an agent', () => {
      const agents = settingsActions.exportConfig().agents
      settingsActions.updateAgent(agents[0].id, { name: 'Updated' })
      expect(settingsActions.exportConfig().agents[0].name).toBe('Updated')
    })
    it('should remove an agent', () => {
      const agent = settingsActions.addAgent({
        name: 'ToRemove', systemPrompt: '', model: 'x',
        temperature: 0.7, maxTokens: 4096, isBuiltIn: false, isCustom: true, enabled: true,
      })
      settingsActions.removeAgent(agent.id)
      expect(settingsActions.exportConfig().agents.find((a: AgentConfig) => a.id === agent.id)).toBeUndefined()
    })
    it('should toggle agent enabled', () => {
      const id = settingsActions.exportConfig().agents[0].id
      const wasBefore = settingsActions.exportConfig().agents[0].enabled
      settingsActions.toggleAgent(id)
      expect(settingsActions.exportConfig().agents[0].enabled).toBe(!wasBefore)
    })
  })

  // =============================================
  // 3. Context Settings
  // =============================================
  describe('Context', () => {
    it('should have default ignore rules', () => {
      expect(settingsActions.exportConfig().context.ignoreRules).toContain('node_modules')
    })
    it('should add and not duplicate ignore rules', () => {
      settingsActions.addIgnoreRule('*.tmp')
      settingsActions.addIgnoreRule('*.tmp')
      expect(settingsActions.exportConfig().context.ignoreRules.filter((r: string) => r === '*.tmp').length).toBe(1)
    })
    it('should remove ignore rules', () => {
      settingsActions.removeIgnoreRule('node_modules')
      expect(settingsActions.exportConfig().context.ignoreRules).not.toContain('node_modules')
    })
    it('should CRUD document sets', () => {
      const doc = settingsActions.addDocumentSet({ name: 'MyDocs', source: 'url', url: 'https://x.com', enabled: true })
      expect(settingsActions.exportConfig().context.documentSets).toHaveLength(1)
      settingsActions.toggleDocumentSet(doc.id)
      expect(settingsActions.exportConfig().context.documentSets[0].enabled).toBe(false)
      settingsActions.removeDocumentSet(doc.id)
      expect(settingsActions.exportConfig().context.documentSets).toHaveLength(0)
    })
  })

  // =============================================
  // 4. Conversation Settings
  // =============================================
  describe('Conversation', () => {
    it('should update conversation toggles', () => {
      settingsActions.updateConversation({ useTodoList: false, autoRunMCP: true })
      const c = settingsActions.exportConfig().conversation
      expect(c.useTodoList).toBe(false)
      expect(c.autoRunMCP).toBe(true)
    })
    it('should manage whitelist commands', () => {
      settingsActions.addWhitelistCommand('git status')
      expect(settingsActions.exportConfig().conversation.whitelistCommands).toContain('git status')
      settingsActions.addWhitelistCommand('git status') // no duplicate
      expect(settingsActions.exportConfig().conversation.whitelistCommands.filter((c: string) => c === 'git status').length).toBe(1)
      settingsActions.removeWhitelistCommand('git status')
      expect(settingsActions.exportConfig().conversation.whitelistCommands).not.toContain('git status')
    })
    it('should update volume', () => {
      settingsActions.updateConversation({ volume: 42 })
      expect(settingsActions.exportConfig().conversation.volume).toBe(42)
    })
  })

  // =============================================
  // 5. Rules CRUD
  // =============================================
  describe('Rules', () => {
    it('should add / toggle / remove rules', () => {
      const r = settingsActions.addRule({ name: 'R1', content: 'Do X', scope: 'personal', enabled: true })
      expect(settingsActions.exportConfig().rules).toHaveLength(1)
      settingsActions.toggleRule(r.id)
      expect(settingsActions.exportConfig().rules[0].enabled).toBe(false)
      settingsActions.removeRule(r.id)
      expect(settingsActions.exportConfig().rules).toHaveLength(0)
    })
    it('should update rule content', () => {
      const r = settingsActions.addRule({ name: 'R2', content: 'old', scope: 'project', enabled: true })
      settingsActions.updateRule(r.id, { content: 'new content' })
      expect(settingsActions.exportConfig().rules[0].content).toBe('new content')
    })
  })

  // =============================================
  // 6. Skills CRUD
  // =============================================
  describe('Skills', () => {
    it('should add / toggle / remove skills', () => {
      const s = settingsActions.addSkill({ name: 'S1', content: 'Code', scope: 'global', enabled: true })
      expect(settingsActions.exportConfig().skills).toHaveLength(1)
      settingsActions.toggleSkill(s.id)
      expect(settingsActions.exportConfig().skills[0].enabled).toBe(false)
      settingsActions.removeSkill(s.id)
      expect(settingsActions.exportConfig().skills).toHaveLength(0)
    })
  })

  // =============================================
  // 7. Import / Export / Reset
  // =============================================
  describe('Import/Export/Reset', () => {
    it('should export config with all fields', () => {
      const cfg = settingsActions.exportConfig()
      expect(cfg).toHaveProperty('userProfile')
      expect(cfg).toHaveProperty('agents')
      expect(cfg).toHaveProperty('context')
      expect(cfg).toHaveProperty('conversation')
      expect(cfg).toHaveProperty('rules')
      expect(cfg).toHaveProperty('skills')
      expect(cfg).toHaveProperty('importSettings')
    })
    it('should import config partially', () => {
      settingsActions.importConfig({ userProfile: { id: 'x', username: 'Imported', email: 'i@m.p' } } as any)
      expect(settingsActions.exportConfig().userProfile.username).toBe('Imported')
    })
    it('should reset all settings to defaults', () => {
      settingsActions.updateUserProfile({ username: 'Changed' })
      settingsActions.addRule({ name: 'R', content: '', scope: 'personal', enabled: true })
      settingsActions.resetSettings()
      expect(settingsActions.exportConfig().userProfile.username).toBe('Operator')
      expect(settingsActions.exportConfig().rules).toHaveLength(0)
    })
  })

  // =============================================
  // 8. Deep Search (核心搜索功能)
  // =============================================
  describe('Deep Search', () => {
    it('should find agents by name', () => {
      const results = settingsActions.deepSearch('Code Assistant')
      expect(results.some(r => r.tab === 'agents' && r.field === 'name')).toBe(true)
    })
    it('should find agents by temperature value "0.3"', () => {
      const results = settingsActions.deepSearch('0.3')
      expect(results.some(r => r.tab === 'agents' && r.field === 'temp')).toBe(true)
    })
    it('should find agents by model name "gpt-4"', () => {
      const results = settingsActions.deepSearch('gpt-4')
      expect(results.some(r => r.tab === 'agents' && r.field === 'model')).toBe(true)
    })
    it('should find rules by content', () => {
      settingsActions.addRule({ name: 'Lint Rule', content: 'Always use semicolons', scope: 'personal', enabled: true })
      const results = settingsActions.deepSearch('semicolons')
      expect(results.some(r => r.tab === 'rules-skills' && r.field === 'content')).toBe(true)
    })
    it('should find skills by name', () => {
      settingsActions.addSkill({ name: 'TypeScript Expert', content: 'TS tips', scope: 'global', enabled: true })
      const results = settingsActions.deepSearch('typescript')
      expect(results.some(r => r.tab === 'rules-skills')).toBe(true)
    })
    it('should find whitelist commands', () => {
      const results = settingsActions.deepSearch('npm test')
      expect(results.some(r => r.tab === 'conversation' && r.field === 'cmd')).toBe(true)
    })
    it('should find ignore rules', () => {
      const results = settingsActions.deepSearch('node_modules')
      expect(results.some(r => r.tab === 'context' && r.field === 'ignore')).toBe(true)
    })
    it('should find user profile by username', () => {
      const results = settingsActions.deepSearch('Operator')
      expect(results.some(r => r.tab === 'account')).toBe(true)
    })
    it('should return empty for empty query', () => {
      expect(settingsActions.deepSearch('')).toHaveLength(0)
      expect(settingsActions.deepSearch('   ')).toHaveLength(0)
    })
    it('should find document sets', () => {
      settingsActions.addDocumentSet({ name: 'React Docs', source: 'url', url: 'https://react.dev', enabled: true })
      const results = settingsActions.deepSearch('react')
      expect(results.some(r => r.tab === 'context' && r.field === 'doc')).toBe(true)
    })
  })

  // =============================================
  // 9. Rules → System Prompt Injection (跨模块联动)
  // =============================================
  describe('System Prompt Injection', () => {
    it('should return empty prompt when no rules/skills', () => {
      expect(settingsActions.getActiveRulesAsSystemPrompt()).toBe('')
    })
    it('should inject enabled rules into system prompt', () => {
      settingsActions.addRule({ name: 'No-Eval', content: 'Never use eval()', scope: 'personal', enabled: true })
      settingsActions.addRule({ name: 'Disabled', content: 'Ignored', scope: 'project', enabled: false })
      const prompt = settingsActions.getActiveRulesAsSystemPrompt()
      expect(prompt).toContain('No-Eval')
      expect(prompt).toContain('Never use eval()')
      expect(prompt).not.toContain('Disabled')
    })
    it('should inject enabled skills into system prompt', () => {
      settingsActions.addSkill({ name: 'React Expert', description: 'React tips', content: 'Use hooks', scope: 'global', enabled: true })
      const prompt = settingsActions.getActiveRulesAsSystemPrompt()
      expect(prompt).toContain('React Expert')
      expect(prompt).toContain('Use hooks')
    })
    it('should merge agent prompt with rules for getAgentSystemPrompt', () => {
      settingsActions.addRule({ name: 'Rule1', content: 'Be concise', scope: 'personal', enabled: true })
      const agents = settingsActions.exportConfig().agents
      const merged = settingsActions.getAgentSystemPrompt(agents[0].id)
      expect(merged).toContain(agents[0].systemPrompt)
      expect(merged).toContain('Be concise')
    })
    it('should return plain agent prompt when no rules enabled', () => {
      const agents = settingsActions.exportConfig().agents
      const merged = settingsActions.getAgentSystemPrompt(agents[0].id)
      expect(merged).toBe(agents[0].systemPrompt)
    })
    it('should return empty for non-existent agent', () => {
      expect(settingsActions.getAgentSystemPrompt('no-such-id')).toBe('')
    })
  })

  // =============================================
  // 10. API Key Validation (Tauri bridge simulation)
  // =============================================
  describe('API Key Validation', () => {
    it('should reject short API keys', async () => {
      const result = await settingsActions.validateModelApiKey('openai', 'short')
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })
    it('should reject format-mismatched keys', async () => {
      const result = await settingsActions.validateModelApiKey('openai', 'not-a-valid-openai-key-format')
      expect(result.valid).toBe(false)
    })
    it('should always pass Ollama keys', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200 }))
      try {
        const result = await settingsActions.validateModelApiKey('ollama', 'any-local-key')
        expect(result.valid).toBe(true)
      } finally {
        mockFetch.mockRestore()
      }
    })
    it('should return latencyMs', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200 }))
      try {
        const result = await settingsActions.validateModelApiKey('ollama', 'test')
        expect(result.latencyMs).toBeGreaterThanOrEqual(0)
      } finally {
        mockFetch.mockRestore()
      }
    })
  })

  // =============================================
  // 11. MCP Connection Test (Tauri bridge simulation)
  // =============================================
  describe('MCP Connection Test', () => {
    it('should test stdio connection', async () => {
      const result = await settingsActions.testMCPConnection({ transport: 'stdio', command: 'npx', args: ['-y', 'mcp-server'] })
      expect(typeof result.connected).toBe('boolean')
      expect(result.latencyMs).toBeGreaterThan(0)
    })
    it('should test SSE connection', async () => {
      const result = await settingsActions.testMCPConnection({ transport: 'sse', url: 'http://localhost:3000' })
      expect(typeof result.connected).toBe('boolean')
    })
    it('should fail for invalid transport', async () => {
      const result = await settingsActions.testMCPConnection({ transport: 'unknown' })
      expect(result.connected).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  // =============================================
  // 12. getState snapshot
  // =============================================
  describe('getState', () => {
    it('should return current state snapshot', () => {
      const s = settingsActions.getState()
      expect(s).toHaveProperty('userProfile')
      expect(s).toHaveProperty('agents')
      expect(s).toHaveProperty('revision')
    })
  })
})
