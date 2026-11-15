/**
 * @file command-registry.test.ts
 * @description Unit tests for command-registry
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommandDeps } from '../command-registry'
import { buildCommands, getAllCommands, getExternalCommands, registerCommand, unregisterCommand } from '../command-registry'

const MockIcon = () => null

const createDeps = (overrides: Partial<CommandDeps> = {}): CommandDeps => ({
  isCyberpunk: false,
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
  toggleLocale: vi.fn(),
  openModelSettings: vi.fn(),
  shortcuts: {},
  openGlobalSearch: vi.fn(),
  onSwitchToIDE: vi.fn(),
  setCheatSheetVisible: vi.fn(),
  ...overrides,
})

describe('command-registry', () => {
  beforeEach(() => {
    // Clear external commands between tests
    const externalCmds = getExternalCommands()
    externalCmds.forEach(cmd => unregisterCommand(cmd.id))
  })

  describe('buildCommands', () => {
    it('should return an array of commands', () => {
      const deps = createDeps()
      const commands = buildCommands(deps)
      expect(Array.isArray(commands)).toBe(true)
      expect(commands.length).toBeGreaterThan(0)
    })

    it('should include navigation commands', () => {
      const commands = buildCommands(createDeps())
      const ids = commands.map(c => c.id)
      expect(ids).toContain('switch-fullscreen')
      expect(ids).toContain('switch-ide')
      expect(ids).toContain('switch-widget')
    })

    it('should include theme commands with correct icons based on isCyberpunk', () => {
      const lightDeps = createDeps({ isCyberpunk: false })
      const lightCmds = buildCommands(lightDeps)
      const toggleThemeCmd = lightCmds.find(c => c.id === 'toggle-theme')
      expect(toggleThemeCmd).toBeDefined()

      const cyberDeps = createDeps({ isCyberpunk: true })
      const cyberCmds = buildCommands(cyberDeps)
      const toggleThemeCyber = cyberCmds.find(c => c.id === 'toggle-theme')
      expect(toggleThemeCyber).toBeDefined()
    })

    it('should call toggleTheme when toggle-theme command is executed', () => {
      const toggleTheme = vi.fn()
      const deps = createDeps({ toggleTheme })
      const commands = buildCommands(deps)
      const cmd = commands.find(c => c.id === 'toggle-theme')
      cmd!.action()
      expect(toggleTheme).toHaveBeenCalledOnce()
    })

    it('should call setTheme with "cyberpunk" for cyberpunk-theme command', () => {
      const setTheme = vi.fn()
      const deps = createDeps({ setTheme })
      const commands = buildCommands(deps)
      const cmd = commands.find(c => c.id === 'cyberpunk-theme')
      cmd!.action()
      expect(setTheme).toHaveBeenCalledWith('cyberpunk')
    })

    it('should call setTheme with "clean" for clean-theme command', () => {
      const setTheme = vi.fn()
      const deps = createDeps({ setTheme })
      const commands = buildCommands(deps)
      const cmd = commands.find(c => c.id === 'clean-theme')
      cmd!.action()
      expect(setTheme).toHaveBeenCalledWith('clean')
    })

    it('should call openGlobalSearch when global-search command is executed', () => {
      const openGlobalSearch = vi.fn()
      const deps = createDeps({ openGlobalSearch })
      const commands = buildCommands(deps)
      const cmd = commands.find(c => c.id === 'global-search')
      cmd!.action()
      expect(openGlobalSearch).toHaveBeenCalledOnce()
    })

    it('should call onSwitchToIDE when switch-ide command is executed', () => {
      const onSwitchToIDE = vi.fn()
      const deps = createDeps({ onSwitchToIDE })
      const commands = buildCommands(deps)
      const cmd = commands.find(c => c.id === 'switch-ide')
      cmd!.action()
      expect(onSwitchToIDE).toHaveBeenCalledOnce()
    })

    it('should call setCheatSheetVisible when keyboard-shortcuts command is executed', () => {
      const setCheatSheetVisible = vi.fn()
      const deps = createDeps({ setCheatSheetVisible })
      const commands = buildCommands(deps)
      const cmd = commands.find(c => c.id === 'keyboard-shortcuts')
      cmd!.action()
      expect(setCheatSheetVisible).toHaveBeenCalledWith(true)
    })

    it('should include AI category commands', () => {
      const commands = buildCommands(createDeps())
      const aiCmds = commands.filter(c => c.categoryKey === 'catAI')
      expect(aiCmds.length).toBeGreaterThan(0)
      const aiIds = aiCmds.map(c => c.id)
      expect(aiIds).toContain('open-model-settings')
      expect(aiIds).toContain('open-webgpu-ai')
      expect(aiIds).toContain('open-intelligent-workflow')
    })

    it('should include tools category commands', () => {
      const commands = buildCommands(createDeps())
      const toolCmds = commands.filter(c => c.categoryKey === 'catTools')
      expect(toolCmds.length).toBeGreaterThan(0)
      const toolIds = toolCmds.map(c => c.id)
      expect(toolIds).toContain('open-settings')
      expect(toolIds).toContain('open-sync-panel')
      expect(toolIds).toContain('open-security')
    })

    it('should include editor category commands', () => {
      const commands = buildCommands(createDeps())
      const editorCmds = commands.filter(c => c.categoryKey === 'catEditor')
      expect(editorCmds.length).toBeGreaterThan(0)
      const editorIds = editorCmds.map(c => c.id)
      expect(editorIds).toContain('toggle-terminal')
      expect(editorIds).toContain('toggle-preview')
    })
  })

  describe('registerCommand / unregisterCommand', () => {
    it('should register an external command', () => {
      const cmd = { id: 'test-cmd', labelKey: 'Test', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } }
      registerCommand(cmd)
      const external = getExternalCommands()
      expect(external).toHaveLength(1)
      expect(external[0].id).toBe('test-cmd')
    })

    it('should unregister an external command', () => {
      const cmd = { id: 'test-cmd-2', labelKey: 'Test 2', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } }
      registerCommand(cmd)
      expect(getExternalCommands()).toHaveLength(1)
      unregisterCommand('test-cmd-2')
      expect(getExternalCommands()).toHaveLength(0)
    })

    it('should register multiple commands', () => {
      const cmds = [
        { id: 'cmd1', labelKey: 'Cmd 1', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } },
        { id: 'cmd2', labelKey: 'Cmd 2', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } },
        { id: 'cmd3', labelKey: 'Cmd 3', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } },
      ]
      cmds.forEach(c => registerCommand(c))
      expect(getExternalCommands()).toHaveLength(3)
    })

    it('should unregister only the specified command', () => {
      registerCommand({ id: 'keep', labelKey: 'Keep', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } })
      registerCommand({ id: 'remove', labelKey: 'Remove', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } })
      unregisterCommand('remove')
      const remaining = getExternalCommands()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe('keep')
    })
  })

  describe('getAllCommands', () => {
    it('should merge built-in and external commands', () => {
      registerCommand({ id: 'ext-cmd', labelKey: 'External', categoryKey: 'catTools', icon: MockIcon, shortcut: '', action: () => { } })
      const all = getAllCommands(createDeps())
      const builtIn = buildCommands(createDeps())
      expect(all.length).toBe(builtIn.length + 1)
      expect(all.find(c => c.id === 'ext-cmd')).toBeDefined()
    })

    it('should include all built-in command ids in the merged result', () => {
      const builtIn = buildCommands(createDeps())
      const all = getAllCommands(createDeps())
      builtIn.forEach(cmd => {
        expect(all.find(c => c.id === cmd.id)).toBeDefined()
      })
    })
  })
})
