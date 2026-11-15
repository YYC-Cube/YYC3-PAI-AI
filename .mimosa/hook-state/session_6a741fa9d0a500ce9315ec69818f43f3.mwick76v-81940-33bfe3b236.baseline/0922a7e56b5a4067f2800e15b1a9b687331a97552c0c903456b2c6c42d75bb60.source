/**
 * @file shortcut-store.test.ts
 * @description Unit test for shortcut-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
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

// Mock navigator.platform for eventToShortcut
Object.defineProperty(globalThis, 'navigator', {
  value: { platform: 'MacIntel' },
  writable: true,
})

import {
  shortcutStore,
  DEFAULT_SHORTCUTS,
  getShortcutConflicts,
  eventToShortcut,
  type ShortcutDef,
} from '../shortcut-store'

function s() { return shortcutStore.getState() }

// ===== DEFAULT_SHORTCUTS =====
describe('DEFAULT_SHORTCUTS', () => {
  it('should have at least 20 shortcuts', () => {
    expect(Object.keys(DEFAULT_SHORTCUTS).length).toBeGreaterThanOrEqual(20)
  })

  it('each shortcut should have internal and display fields', () => {
    for (const [_id, def] of Object.entries(DEFAULT_SHORTCUTS)) {
      expect(def.internal).toBeTruthy()
      expect(typeof def.internal).toBe('string')
      expect(def.display).toBeTruthy()
      expect(typeof def.display).toBe('string')
    }
  })

  it('should include commandPalette (mod+k)', () => {
    expect(DEFAULT_SHORTCUTS.commandPalette).toBeDefined()
    expect(DEFAULT_SHORTCUTS.commandPalette.internal).toBe('mod+k')
  })

  it('should include toggleTheme (mod+shift+t)', () => {
    expect(DEFAULT_SHORTCUTS.toggleTheme.internal).toBe('mod+shift+t')
  })

  it('should include save (mod+s)', () => {
    expect(DEFAULT_SHORTCUTS.save.internal).toBe('mod+s')
  })

  it('should include undo/redo pair', () => {
    expect(DEFAULT_SHORTCUTS.undo.internal).toBe('mod+z')
    expect(DEFAULT_SHORTCUTS.redo.internal).toBe('mod+shift+z')
  })

  it('should include closePanel (escape)', () => {
    expect(DEFAULT_SHORTCUTS.closePanel.internal).toBe('escape')
  })

  it('should include shortcutCheatSheet (mod+/)', () => {
    expect(DEFAULT_SHORTCUTS.shortcutCheatSheet.internal).toBe('mod+/')
  })

  it('known shortcut IDs should be present', () => {
    const ids = Object.keys(DEFAULT_SHORTCUTS)
    const required = [
      'commandPalette', 'toggleTheme', 'toggleLang', 'openSettings',
      'globalSearch', 'newProject', 'save', 'undo', 'redo', 'find',
      'replace', 'toggleTerminal', 'togglePreview', 'closePanel',
      'aiAssist', 'codeGen', 'modelSettings',
    ]
    for (const id of required) {
      expect(ids).toContain(id)
    }
  })
})

// ===== Merged State =====
describe('Merged State (defaults + overrides)', () => {
  beforeEach(() => {
    lsMock.clear()
    shortcutStore.resetAll()
  })

  it('initial state should equal DEFAULT_SHORTCUTS', () => {
    const snapshot = s()
    for (const [id, def] of Object.entries(DEFAULT_SHORTCUTS)) {
      expect(snapshot[id]).toEqual(def)
    }
  })

  it('state should be a plain object with string keys', () => {
    const snapshot = s()
    expect(typeof snapshot).toBe('object')
    expect(snapshot).not.toBeNull()
  })
})

// ===== set() =====
describe('set(id, def)', () => {
  beforeEach(() => { shortcutStore.resetAll() })

  it('should override a shortcut', () => {
    const custom: ShortcutDef = { internal: 'mod+shift+k', display: '⌘ Shift K' }
    shortcutStore.set('commandPalette', custom)
    expect(s().commandPalette).toEqual(custom)
  })

  it('override should not affect other shortcuts', () => {
    shortcutStore.set('save', { internal: 'mod+shift+s', display: '⌘ Shift S' })
    expect(s().undo).toEqual(DEFAULT_SHORTCUTS.undo)
    expect(s().redo).toEqual(DEFAULT_SHORTCUTS.redo)
  })

  it('should be marked as custom after override', () => {
    expect(shortcutStore.isCustom('save')).toBe(false)
    shortcutStore.set('save', { internal: 'ctrl+s', display: 'Ctrl S' })
    expect(shortcutStore.isCustom('save')).toBe(true)
  })

  it('can add a completely new shortcut id', () => {
    shortcutStore.set('myCustomAction', { internal: 'mod+shift+x', display: '⌘ Shift X' })
    expect(s().myCustomAction).toBeDefined()
    expect(s().myCustomAction.internal).toBe('mod+shift+x')
  })
})

// ===== reset(id) =====
describe('reset(id)', () => {
  beforeEach(() => { shortcutStore.resetAll() })

  it('should restore a single shortcut to default', () => {
    shortcutStore.set('commandPalette', { internal: 'mod+p', display: '⌘ P' })
    expect(s().commandPalette.internal).toBe('mod+p')
    shortcutStore.reset('commandPalette')
    expect(s().commandPalette).toEqual(DEFAULT_SHORTCUTS.commandPalette)
  })

  it('reset should make isCustom return false', () => {
    shortcutStore.set('save', { internal: 'ctrl+s', display: 'Ctrl S' })
    expect(shortcutStore.isCustom('save')).toBe(true)
    shortcutStore.reset('save')
    expect(shortcutStore.isCustom('save')).toBe(false)
  })

  it('resetting a non-overridden shortcut should be no-op', () => {
    const before = s().undo
    shortcutStore.reset('undo')
    expect(s().undo).toEqual(before)
  })
})

// ===== resetAll() =====
describe('resetAll()', () => {
  it('should clear all overrides', () => {
    shortcutStore.set('save', { internal: 'ctrl+s', display: 'Ctrl S' })
    shortcutStore.set('undo', { internal: 'ctrl+z', display: 'Ctrl Z' })
    shortcutStore.set('redo', { internal: 'ctrl+y', display: 'Ctrl Y' })
    shortcutStore.resetAll()
    expect(s().save).toEqual(DEFAULT_SHORTCUTS.save)
    expect(s().undo).toEqual(DEFAULT_SHORTCUTS.undo)
    expect(s().redo).toEqual(DEFAULT_SHORTCUTS.redo)
  })

  it('no shortcut should be custom after resetAll', () => {
    shortcutStore.set('save', { internal: 'x', display: 'X' })
    shortcutStore.resetAll()
    expect(shortcutStore.isCustom('save')).toBe(false)
    expect(shortcutStore.isCustom('undo')).toBe(false)
  })
})

// ===== isCustom() =====
describe('isCustom(id)', () => {
  beforeEach(() => { shortcutStore.resetAll() })

  it('should return false for default shortcuts', () => {
    for (const id of Object.keys(DEFAULT_SHORTCUTS)) {
      expect(shortcutStore.isCustom(id)).toBe(false)
    }
  })

  it('should return true after override', () => {
    shortcutStore.set('find', { internal: 'ctrl+f', display: 'Ctrl F' })
    expect(shortcutStore.isCustom('find')).toBe(true)
  })

  it('should return false for unknown id', () => {
    expect(shortcutStore.isCustom('nonexistent')).toBe(false)
  })
})

// ===== getShortcutConflicts() =====
describe('getShortcutConflicts()', () => {
  it('default shortcuts should have no conflicts', () => {
    const conflicts = getShortcutConflicts(DEFAULT_SHORTCUTS)
    expect(Object.keys(conflicts).length).toBe(0)
  })

  it('should detect conflict when two shortcuts share same binding', () => {
    const shortcuts = {
      ...DEFAULT_SHORTCUTS,
      myAction: { internal: 'mod+s', display: '⌘ S' }, // conflicts with save
    }
    const conflicts = getShortcutConflicts(shortcuts)
    expect(conflicts['save']).toContain('myAction')
    expect(conflicts['myAction']).toContain('save')
  })

  it('escape should be excluded from conflict detection', () => {
    const shortcuts = {
      ...DEFAULT_SHORTCUTS,
      anotherEscape: { internal: 'escape', display: 'Esc' },
    }
    const conflicts = getShortcutConflicts(shortcuts)
    expect(conflicts['closePanel']).toBeUndefined()
    expect(conflicts['anotherEscape']).toBeUndefined()
  })

  it('three-way conflict should list all peers', () => {
    const shortcuts: Record<string, ShortcutDef> = {
      a: { internal: 'mod+x', display: '⌘ X' },
      b: { internal: 'mod+x', display: '⌘ X' },
      c: { internal: 'mod+x', display: '⌘ X' },
    }
    const conflicts = getShortcutConflicts(shortcuts)
    expect(conflicts['a']!.length).toBe(2)
    expect(conflicts['b']!.length).toBe(2)
    expect(conflicts['c']!.length).toBe(2)
  })

  it('case-insensitive: mod+S and mod+s should conflict', () => {
    const shortcuts: Record<string, ShortcutDef> = {
      upper: { internal: 'mod+S', display: '⌘ S' },
      lower: { internal: 'mod+s', display: '⌘ s' },
    }
    const conflicts = getShortcutConflicts(shortcuts)
    expect(conflicts['upper']).toContain('lower')
  })

  it('no conflict if bindings are different', () => {
    const shortcuts: Record<string, ShortcutDef> = {
      a: { internal: 'mod+a', display: '⌘ A' },
      b: { internal: 'mod+b', display: '⌘ B' },
    }
    const conflicts = getShortcutConflicts(shortcuts)
    expect(Object.keys(conflicts).length).toBe(0)
  })
})

// ===== eventToShortcut() =====
describe('eventToShortcut()', () => {
  function makeEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return {
      key: 'a',
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      ...overrides,
    } as KeyboardEvent
  }

  it('should return null for modifier-only key press', () => {
    expect(eventToShortcut(makeEvent({ key: 'Control' }))).toBeNull()
    expect(eventToShortcut(makeEvent({ key: 'Meta' }))).toBeNull()
    expect(eventToShortcut(makeEvent({ key: 'Shift' }))).toBeNull()
    expect(eventToShortcut(makeEvent({ key: 'Alt' }))).toBeNull()
  })

  it('should convert simple key press (no modifiers)', () => {
    const result = eventToShortcut(makeEvent({ key: 'a' }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('a')
  })

  it('should convert Cmd+K on Mac', () => {
    const result = eventToShortcut(makeEvent({ key: 'k', metaKey: true }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('mod+k')
    expect(result!.display).toContain('⌘')
    expect(result!.display).toContain('K')
  })

  it('should convert Cmd+Shift+T on Mac', () => {
    const result = eventToShortcut(makeEvent({ key: 't', metaKey: true, shiftKey: true }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('mod+shift+t')
    expect(result!.display).toContain('Shift')
  })

  it('should handle Escape key', () => {
    const result = eventToShortcut(makeEvent({ key: 'Escape' }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('escape')
    expect(result!.display).toBe('Esc')
  })

  it('should handle Enter key', () => {
    const result = eventToShortcut(makeEvent({ key: 'Enter' }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('enter')
    expect(result!.display).toBe('Enter')
  })

  it('should handle Space key', () => {
    const result = eventToShortcut(makeEvent({ key: ' ' }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('space')
    expect(result!.display).toBe('Space')
  })

  it('should handle backtick key', () => {
    const result = eventToShortcut(makeEvent({ key: '`', metaKey: true }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('mod+`')
  })

  it('should handle comma key', () => {
    const result = eventToShortcut(makeEvent({ key: ',', metaKey: true }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('mod+,')
  })

  it('should include Alt modifier', () => {
    const result = eventToShortcut(makeEvent({ key: 'a', altKey: true }))
    expect(result).not.toBeNull()
    expect(result!.internal).toContain('alt')
    expect(result!.display).toContain('Alt')
  })

  it('should handle Cmd+Shift+Alt+key', () => {
    const result = eventToShortcut(makeEvent({
      key: 'z',
      metaKey: true,
      shiftKey: true,
      altKey: true,
    }))
    expect(result).not.toBeNull()
    expect(result!.internal).toBe('mod+shift+alt+z')
  })
})

// ===== Persistence =====
describe('Persistence', () => {
  beforeEach(() => {
    lsMock.clear()
    lsMock.setItem.mockClear()
    shortcutStore.resetAll()
  })

  it('set() should persist overrides to localStorage', () => {
    lsMock.setItem.mockClear()
    shortcutStore.set('save', { internal: 'ctrl+s', display: 'Ctrl S' })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_shortcut_overrides')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.save).toBeDefined()
    expect(parsed.save.internal).toBe('ctrl+s')
  })

  it('resetAll() should persist empty overrides', () => {
    shortcutStore.set('save', { internal: 'ctrl+s', display: 'Ctrl S' })
    lsMock.setItem.mockClear()
    shortcutStore.resetAll()
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_shortcut_overrides')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(Object.keys(parsed).length).toBe(0)
  })

  it('reset(id) should remove only that override', () => {
    shortcutStore.set('save', { internal: 'ctrl+s', display: 'Ctrl S' })
    shortcutStore.set('undo', { internal: 'ctrl+z', display: 'Ctrl Z' })
    shortcutStore.reset('save')
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_shortcut_overrides')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.save).toBeUndefined()
    expect(parsed.undo).toBeDefined()
  })
})
