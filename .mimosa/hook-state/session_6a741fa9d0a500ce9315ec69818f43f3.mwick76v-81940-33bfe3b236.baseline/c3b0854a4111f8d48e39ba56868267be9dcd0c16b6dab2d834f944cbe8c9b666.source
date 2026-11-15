/**
 * @file settings-tabs.test.ts
 * @author YanYuCloudCube Team <admin@0379.email>
 * @description Smoke tests for SettingsPanel sub-component exports
 * @version v4.8.2
 */

import { describe, it, expect } from 'vitest'

describe('Settings Sub-Components Exports', () => {
  it('should export SettingsShared helpers', async () => {
    const mod = await import('../SettingsShared')
    expect(mod.ToggleRow).toBeDefined()
    expect(typeof mod.ToggleRow).toBe('function')
    expect(mod.SectionLabel).toBeDefined()
    expect(typeof mod.SectionLabel).toBe('function')
  })

  it('should export AIServiceTabs components', async () => {
    const mod = await import('../AIServiceTabs')
    expect(mod.AgentsTab).toBeDefined()
    expect(mod.MCPTab).toBeDefined()
    expect(mod.ModelsTab).toBeDefined()
    expect(mod.ContextTab).toBeDefined()
    expect(mod.ConversationTab).toBeDefined()
    expect(mod.RulesSkillsTab).toBeDefined()
  })

  it('should export WorkspaceTabs components', async () => {
    const mod = await import('../WorkspaceTabs')
    expect(mod.ShortcutsTab).toBeDefined()
    expect(mod.AccountTab).toBeDefined()
    expect(mod.LayoutsTab).toBeDefined()
  })

  it('should export all 6 AI service tabs as functions', async () => {
    const mod = await import('../AIServiceTabs')
    const exports = [mod.AgentsTab, mod.MCPTab, mod.ModelsTab, mod.ContextTab, mod.ConversationTab, mod.RulesSkillsTab]
    exports.forEach(fn => {
      expect(typeof fn).toBe('function')
    })
  })

  it('should export all 3 workspace tabs as functions', async () => {
    const mod = await import('../WorkspaceTabs')
    const exports = [mod.ShortcutsTab, mod.AccountTab, mod.LayoutsTab]
    exports.forEach(fn => {
      expect(typeof fn).toBe('function')
    })
  })
})

describe('SettingsPanel Main Export', () => {
  it('should export SettingsPanel from main file', async () => {
    const mod = await import('../../SettingsPanel')
    expect(mod.SettingsPanel).toBeDefined()
    expect(typeof mod.SettingsPanel).toBe('function')
  })
})
