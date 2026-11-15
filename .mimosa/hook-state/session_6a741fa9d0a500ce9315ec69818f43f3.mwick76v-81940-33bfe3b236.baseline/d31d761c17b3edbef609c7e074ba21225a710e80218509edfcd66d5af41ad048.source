/**
 * @file quick-actions-store.test.ts
 * @description Unit test for quick-actions-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */


import { describe, it, expect, beforeEach, vi } from 'vitest'
import { quickActionsStore, ACTION_REGISTRY, type ActionContext } from '../quick-actions-store'

// Mock clipboard API
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
Object.assign(navigator, { clipboard: mockClipboard })

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
})

describe('quick-actions-store', () => {
  beforeEach(() => {
    quickActionsStore.clearClipboardHistory()
    quickActionsStore.clearContext()
    quickActionsStore.resetStatus()
    mockClipboard.writeText.mockClear()
  })

  // ==========================================
  // 1. Action Registry
  // ==========================================
  describe('Action Registry', () => {
    it('should have all expected action types', () => {
      const ids = ACTION_REGISTRY.map(d => d.id)
      expect(ids).toContain('copy')
      expect(ids).toContain('refactor')
      expect(ids).toContain('optimize')
      expect(ids).toContain('translate')
      expect(ids).toContain('explain')
      expect(ids).toContain('find-issues')
      expect(ids).toContain('test-generate')
      expect(ids).toContain('add-comments')
    })

    it('should have unique action IDs', () => {
      const ids = ACTION_REGISTRY.map(d => d.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('each action should have labelKey and icon', () => {
      for (const def of ACTION_REGISTRY) {
        expect(def.labelKey).toBeTruthy()
        expect(def.icon).toBeTruthy()
        expect(def.target.length).toBeGreaterThan(0)
      }
    })
  })

  // ==========================================
  // 2. Context Analysis
  // ==========================================
  describe('Context Analysis', () => {
    it('should recommend code actions for TypeScript selection', () => {
      const ctx: ActionContext = {
        selection: 'const foo = () => { return 42; }',
        language: 'tsx',
      }
      quickActionsStore.updateContext(ctx)
      const state = quickActionsStore.getState()
      expect(state.recommendedActions).toContain('copy')
      expect(state.recommendedActions).toContain('refactor')
      expect(state.recommendedActions).toContain('explain')
    })

    it('should recommend text actions for plain text', () => {
      const ctx: ActionContext = {
        selection: 'This is a paragraph of natural language text about AI.',
        language: 'txt',
      }
      quickActionsStore.updateContext(ctx)
      const state = quickActionsStore.getState()
      expect(state.recommendedActions).toContain('translate')
      expect(state.recommendedActions).toContain('rewrite')
      expect(state.recommendedActions).toContain('correct')
    })

    it('should return empty for no selection', () => {
      const ctx: ActionContext = { selection: '' }
      quickActionsStore.updateContext(ctx)
      const state = quickActionsStore.getState()
      expect(state.recommendedActions).toHaveLength(0)
    })

    it('should detect code from heuristic (imports)', () => {
      const ctx: ActionContext = {
        selection: 'import React from "react";\nconst App = () => <div />',
      }
      quickActionsStore.updateContext(ctx)
      const state = quickActionsStore.getState()
      expect(state.recommendedActions).toContain('refactor')
    })

    it('clearContext should reset recommendations', () => {
      quickActionsStore.updateContext({ selection: 'test', language: 'ts' })
      expect(quickActionsStore.getState().recommendedActions.length).toBeGreaterThan(0)
      quickActionsStore.clearContext()
      expect(quickActionsStore.getState().recommendedActions).toHaveLength(0)
    })
  })

  // ==========================================
  // 3. Clipboard Operations
  // ==========================================
  describe('Clipboard Operations', () => {
    it('should copy text to clipboard and history', async () => {
      await quickActionsStore.copyToClipboard('hello world', { type: 'text' })
      expect(mockClipboard.writeText).toHaveBeenCalledWith('hello world')
      const state = quickActionsStore.getState()
      expect(state.clipboardHistory).toHaveLength(1)
      expect(state.clipboardHistory[0].content).toBe('hello world')
      expect(state.clipboardHistory[0].type).toBe('text')
    })

    it('should copy code as Markdown', async () => {
      await quickActionsStore.copyAsMarkdown('const x = 1', 'ts')
      expect(mockClipboard.writeText).toHaveBeenCalledWith('```ts\nconst x = 1\n```')
      const state = quickActionsStore.getState()
      expect(state.clipboardHistory[0].type).toBe('markdown')
    })

    it('should copy code as HTML', async () => {
      await quickActionsStore.copyAsHTML('<div>hi</div>', 'html')
      const call = mockClipboard.writeText.mock.calls[0][0]
      expect(call).toContain('&lt;div&gt;')
      expect(call).toContain('<pre><code')
    })

    it('should limit clipboard history to 50 items', async () => {
      for (let i = 0; i < 55; i++) {
        await quickActionsStore.copyToClipboard(`item ${i}`)
      }
      expect(quickActionsStore.getState().clipboardHistory.length).toBeLessThanOrEqual(50)
    })

    it('should remove single clipboard item', async () => {
      await quickActionsStore.copyToClipboard('first')
      await quickActionsStore.copyToClipboard('second')
      const id = quickActionsStore.getState().clipboardHistory[0].id
      quickActionsStore.removeClipboardItem(id)
      expect(quickActionsStore.getState().clipboardHistory).toHaveLength(1)
    })

    it('should clear all clipboard history', async () => {
      await quickActionsStore.copyToClipboard('a')
      await quickActionsStore.copyToClipboard('b')
      quickActionsStore.clearClipboardHistory()
      expect(quickActionsStore.getState().clipboardHistory).toHaveLength(0)
    })

    it('pasteFromHistory should return content', async () => {
      await quickActionsStore.copyToClipboard('paste me')
      const id = quickActionsStore.getState().clipboardHistory[0].id
      const content = await quickActionsStore.pasteFromHistory(id)
      expect(content).toBe('paste me')
    })

    it('pasteFromHistory should return null for unknown id', async () => {
      const content = await quickActionsStore.pasteFromHistory('nonexistent')
      expect(content).toBeNull()
    })
  })

  // ==========================================
  // 4. Action Execution — Local (copy)
  // ==========================================
  describe('Local Action Execution', () => {
    it('should execute copy action without AI', async () => {
      const ctx: ActionContext = { selection: 'test code', language: 'ts' }
      const mockSend = vi.fn()
      const result = await quickActionsStore.executeAction('copy', ctx, { type: 'copy' }, mockSend)
      expect(result.success).toBe(true)
      expect(result.output).toBe('test code')
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should execute copy-markdown without AI', async () => {
      const ctx: ActionContext = { selection: 'const x = 1', language: 'ts' }
      const mockSend = vi.fn()
      const result = await quickActionsStore.executeAction('copy-markdown', ctx, { type: 'copy-markdown' }, mockSend)
      expect(result.success).toBe(true)
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  // ==========================================
  // 5. Action Execution — AI
  // ==========================================
  describe('AI Action Execution', () => {
    it('should call sendFn for AI actions', async () => {
      const ctx: ActionContext = { selection: 'function add(a, b) { return a + b }', language: 'ts' }
      const mockSend = vi.fn().mockResolvedValue('// Refactored:\nconst add = (a: number, b: number): number => a + b;')
      const result = await quickActionsStore.executeAction('refactor', ctx, { type: 'refactor', useAI: true }, mockSend)
      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalled()
      expect(result.output).toContain('Refactored')
    })

    it('should handle AI errors gracefully', async () => {
      const ctx: ActionContext = { selection: 'buggy code', language: 'ts' }
      const mockSend = vi.fn().mockRejectedValue(new Error('Model unavailable'))
      const result = await quickActionsStore.executeAction('explain', ctx, { type: 'explain', useAI: true }, mockSend)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Model unavailable')
      expect(quickActionsStore.getState().status).toBe('error')
    })

    it('should set processing state during execution', async () => {
      const ctx: ActionContext = { selection: 'test', language: 'ts' }
      let capturedState = quickActionsStore.getState().status
      const mockSend = vi.fn().mockImplementation(async () => {
        capturedState = quickActionsStore.getState().status
        return 'result'
      })
      await quickActionsStore.executeAction('explain', ctx, { type: 'explain', useAI: true }, mockSend)
      expect(capturedState).toBe('processing')
    })

    it('should pass translate target language to prompt', async () => {
      const ctx: ActionContext = { selection: 'Hello world', language: 'txt' }
      let capturedMsg = ''
      const mockSend = vi.fn().mockImplementation(async (msg: string) => { capturedMsg = msg; return '你好世界' })
      await quickActionsStore.executeAction('translate', ctx, { type: 'translate', targetLang: 'zh' }, mockSend)
      expect(capturedMsg).toContain('zh')
    })
  })

  // ==========================================
  // 6. Action Definitions Lookup
  // ==========================================
  describe('Action Definition Lookup', () => {
    it('should return definition for known action', () => {
      const def = quickActionsStore.getActionDef('refactor')
      expect(def).toBeDefined()
      expect(def!.requiresAI).toBe(true)
      expect(def!.target).toContain('code')
    })

    it('should return undefined for unknown action', () => {
      const def = quickActionsStore.getActionDef('nonexistent' as any)
      expect(def).toBeUndefined()
    })
  })

  // ==========================================
  // 7. State Reset
  // ==========================================
  describe('State Management', () => {
    it('resetStatus should clear currentAction and status', async () => {
      const ctx: ActionContext = { selection: 'test', language: 'ts' }
      const mockSend = vi.fn().mockResolvedValue('done')
      await quickActionsStore.executeAction('explain', ctx, { type: 'explain', useAI: true }, mockSend)
      quickActionsStore.resetStatus()
      const state = quickActionsStore.getState()
      expect(state.status).toBe('idle')
      expect(state.currentAction).toBeNull()
    })
  })
})
