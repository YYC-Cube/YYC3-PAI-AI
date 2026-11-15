/**
 * @file editor-prefs-store.test.ts
 * @description Unit test for editor-prefs-store
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

import { editorPrefsStore } from '../editor-prefs-store'

function s() { return editorPrefsStore.getState() }

// ===== Defaults =====
describe('Editor Prefs — Defaults', () => {
  beforeEach(() => {
    lsMock.clear()
    editorPrefsStore.reset()
  })

  it('fontSize should default to 13', () => {
    expect(s().fontSize).toBe(13)
  })

  it('tabSize should default to 2', () => {
    expect(s().tabSize).toBe(2)
  })

  it('wordWrap should default to false', () => {
    expect(s().wordWrap).toBe(false)
  })

  it('minimap should default to true', () => {
    expect(s().minimap).toBe(true)
  })

  it('lineNumbers should default to true', () => {
    expect(s().lineNumbers).toBe(true)
  })

  it('bracketPairs should default to true', () => {
    expect(s().bracketPairs).toBe(true)
  })

  it('autoSave should default to true', () => {
    expect(s().autoSave).toBe(true)
  })

  it('state should have exactly 7 keys', () => {
    const keys = Object.keys(s())
    expect(keys.length).toBe(7)
    expect(keys).toContain('fontSize')
    expect(keys).toContain('tabSize')
    expect(keys).toContain('wordWrap')
    expect(keys).toContain('minimap')
    expect(keys).toContain('lineNumbers')
    expect(keys).toContain('bracketPairs')
    expect(keys).toContain('autoSave')
  })
})

// ===== set() =====
describe('set(key, value)', () => {
  beforeEach(() => { editorPrefsStore.reset() })

  it('should set fontSize', () => {
    editorPrefsStore.set('fontSize', 18)
    expect(s().fontSize).toBe(18)
  })

  it('should set tabSize', () => {
    editorPrefsStore.set('tabSize', 4)
    expect(s().tabSize).toBe(4)
  })

  it('should set wordWrap to true', () => {
    editorPrefsStore.set('wordWrap', true)
    expect(s().wordWrap).toBe(true)
  })

  it('should set minimap to false', () => {
    editorPrefsStore.set('minimap', false)
    expect(s().minimap).toBe(false)
  })

  it('should set lineNumbers to false', () => {
    editorPrefsStore.set('lineNumbers', false)
    expect(s().lineNumbers).toBe(false)
  })

  it('should set bracketPairs to false', () => {
    editorPrefsStore.set('bracketPairs', false)
    expect(s().bracketPairs).toBe(false)
  })

  it('should set autoSave to false', () => {
    editorPrefsStore.set('autoSave', false)
    expect(s().autoSave).toBe(false)
  })

  it('setting one key should not affect others', () => {
    editorPrefsStore.set('fontSize', 20)
    expect(s().tabSize).toBe(2)
    expect(s().minimap).toBe(true)
    expect(s().autoSave).toBe(true)
  })
})

// ===== update() =====
describe('update(patch)', () => {
  beforeEach(() => { editorPrefsStore.reset() })

  it('should update multiple keys at once', () => {
    editorPrefsStore.update({ fontSize: 16, tabSize: 4, wordWrap: true })
    expect(s().fontSize).toBe(16)
    expect(s().tabSize).toBe(4)
    expect(s().wordWrap).toBe(true)
  })

  it('should not affect unmentioned keys', () => {
    editorPrefsStore.update({ fontSize: 20 })
    expect(s().minimap).toBe(true)
    expect(s().lineNumbers).toBe(true)
  })

  it('empty patch should be no-op', () => {
    const before = { ...s() }
    editorPrefsStore.update({})
    expect(s()).toEqual(before)
  })

  it('should allow setting all keys simultaneously', () => {
    editorPrefsStore.update({
      fontSize: 10,
      tabSize: 8,
      wordWrap: true,
      minimap: false,
      lineNumbers: false,
      bracketPairs: false,
      autoSave: false,
    })
    expect(s().fontSize).toBe(10)
    expect(s().tabSize).toBe(8)
    expect(s().wordWrap).toBe(true)
    expect(s().minimap).toBe(false)
    expect(s().lineNumbers).toBe(false)
    expect(s().bracketPairs).toBe(false)
    expect(s().autoSave).toBe(false)
  })
})

// ===== reset() =====
describe('reset()', () => {
  it('should restore all defaults after modifications', () => {
    editorPrefsStore.update({
      fontSize: 99,
      tabSize: 8,
      wordWrap: true,
      minimap: false,
      lineNumbers: false,
      bracketPairs: false,
      autoSave: false,
    })
    editorPrefsStore.reset()
    expect(s().fontSize).toBe(13)
    expect(s().tabSize).toBe(2)
    expect(s().wordWrap).toBe(false)
    expect(s().minimap).toBe(true)
    expect(s().lineNumbers).toBe(true)
    expect(s().bracketPairs).toBe(true)
    expect(s().autoSave).toBe(true)
  })

  it('calling reset twice should be idempotent', () => {
    editorPrefsStore.reset()
    const first = { ...s() }
    editorPrefsStore.reset()
    expect(s()).toEqual(first)
  })
})

// ===== Persistence =====
describe('Persistence', () => {
  beforeEach(() => {
    lsMock.clear()
    lsMock.setItem.mockClear()
    editorPrefsStore.reset()
  })

  it('set() should persist to localStorage', () => {
    lsMock.setItem.mockClear()
    editorPrefsStore.set('fontSize', 22)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_editor_prefs')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.fontSize).toBe(22)
  })

  it('update() should persist to localStorage', () => {
    lsMock.setItem.mockClear()
    editorPrefsStore.update({ tabSize: 4, minimap: false })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_editor_prefs')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.tabSize).toBe(4)
    expect(parsed.minimap).toBe(false)
  })

  it('reset() should persist defaults to localStorage', () => {
    editorPrefsStore.set('fontSize', 50)
    lsMock.setItem.mockClear()
    editorPrefsStore.reset()
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_editor_prefs')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.fontSize).toBe(13)
  })

  it('persisted data should be valid JSON with all 7 keys', () => {
    editorPrefsStore.set('fontSize', 16)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_editor_prefs')
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(Object.keys(parsed).length).toBe(7)
  })
})
