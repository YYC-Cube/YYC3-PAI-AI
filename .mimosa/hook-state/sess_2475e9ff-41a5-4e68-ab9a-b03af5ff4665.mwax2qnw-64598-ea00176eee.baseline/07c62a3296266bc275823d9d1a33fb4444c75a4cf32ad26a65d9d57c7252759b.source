/**
 * @file shortcut-store.ts
 * @description 快捷键状态管理模块，管理键盘快捷键
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags shortcut,keyboard,state-management
 */

import { useSyncExternalStore } from 'react'

/** A single shortcut definition */
export interface ShortcutDef {
  /** Human-readable internal format used by useKeyboardShortcuts, e.g. 'mod+shift+k' */
  internal: string
  /** Pretty display string shown in UI, e.g. '⌘ Shift K' */
  display: string
}

/** Default shortcut definitions keyed by unique id */
export const DEFAULT_SHORTCUTS: Record<string, ShortcutDef> = {
  commandPalette:  { internal: 'mod+k',       display: '⌘ K' },
  toggleTheme:     { internal: 'mod+shift+t',  display: '⌘ Shift T' },
  toggleLang:      { internal: 'mod+shift+l',  display: '⌘ Shift L' },
  openSettings:    { internal: 'mod+,',        display: '⌘ ,' },
  globalSearch:    { internal: 'mod+shift+f',  display: '⌘ Shift F' },
  newProject:      { internal: 'mod+shift+n',  display: '⌘ Shift N' },
  save:            { internal: 'mod+s',        display: '⌘ S' },
  undo:            { internal: 'mod+z',        display: '⌘ Z' },
  redo:            { internal: 'mod+shift+z',  display: '⌘ Shift Z' },
  find:            { internal: 'mod+f',        display: '⌘ F' },
  replace:         { internal: 'mod+h',        display: '⌘ H' },
  toggleTerminal:  { internal: 'mod+`',        display: '⌘ `' },
  togglePreview:   { internal: 'mod+1',        display: '⌘ 1' },
  closePanel:      { internal: 'escape',       display: 'Esc' },
  aiAssist:        { internal: 'mod+shift+a',  display: '⌘ Shift A' },
  codeGen:         { internal: 'mod+shift+g',  display: '⌘ Shift G' },
  modelSettings:   { internal: 'mod+shift+m',  display: '⌘ Shift M' },
  // Panel shortcuts (new)
  openSnippets:    { internal: 'mod+shift+s',  display: '⌘ Shift S' },
  openTaskBoard:   { internal: 'mod+shift+b',  display: '⌘ Shift B' },
  openGitPanel:    { internal: 'mod+shift+h',  display: '⌘ Shift H' },
  openPerformance: { internal: 'mod+shift+p',  display: '⌘ Shift P' },
  openDiagnostics: { internal: 'mod+shift+d',  display: '⌘ Shift D' },
  openActivityLog: { internal: 'mod+shift+j',  display: '⌘ Shift J' },
  shortcutCheatSheet: { internal: 'mod+/',     display: '⌘ /' },
}

const LS_KEY = 'yyc3_shortcut_overrides'

/** Serialised as Record<string, ShortcutDef> for overrides only */
function loadOverrides(): Record<string, ShortcutDef> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function persistOverrides(o: Record<string, ShortcutDef>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(o)) } catch { /* */ }
}

// ===== State =====
let overrides: Record<string, ShortcutDef> = loadOverrides()

/** Cached merged snapshot — only recomputed on emitChange */
let cachedSnapshot: Record<string, ShortcutDef> = { ...DEFAULT_SHORTCUTS, ...overrides }

type Listener = () => void
const listeners = new Set<Listener>()
function emitChange() {
  cachedSnapshot = { ...DEFAULT_SHORTCUTS, ...overrides }
  for (const l of listeners) l()
}
function subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l) }

/** Return cached merged map: defaults + overrides (referentially stable between changes) */
function getSnapshot(): Record<string, ShortcutDef> {
  return cachedSnapshot
}

// ===== Actions =====
const actions = {
  /** Override a single shortcut by id */
  set(id: string, def: ShortcutDef) {
    overrides = { ...overrides, [id]: def }
    persistOverrides(overrides)
    emitChange()
  },
  /** Reset one shortcut to default */
  reset(id: string) {
    const { [id]: _, ...rest } = overrides
    overrides = rest
    persistOverrides(overrides)
    emitChange()
  },
  /** Reset all overrides */
  resetAll() {
    overrides = {}
    persistOverrides(overrides)
    emitChange()
  },
  /** Check if a shortcut has been customized */
  isCustom(id: string): boolean {
    return id in overrides
  },
}

// ===== Conflict Detection =====

/** Conflict entry: which shortcut ids share the same internal key binding */
export interface ShortcutConflict {
  /** The shortcut id that has a conflict */
  id: string
  /** Array of other shortcut ids sharing the same binding */
  conflictsWith: string[]
}

/**
 * Detect all shortcut conflicts in the current merged shortcuts map.
 * Returns a map of shortcutId → array of conflicting shortcut ids.
 * Only includes ids that actually have conflicts.
 */
export function getShortcutConflicts(shortcuts: Record<string, ShortcutDef>): Record<string, string[]> {
  // Build reverse map: internal binding → array of ids using it
  const bindingMap: Record<string, string[]> = {}
  for (const [id, def] of Object.entries(shortcuts)) {
    const key = def.internal.toLowerCase()
    if (!key || key === 'escape') continue // escape is shared by design
    if (!bindingMap[key]) bindingMap[key] = []
    bindingMap[key].push(id)
  }

  // Build conflict map: id → array of conflicting ids
  const conflicts: Record<string, string[]> = {}
  for (const ids of Object.values(bindingMap)) {
    if (ids.length > 1) {
      for (const id of ids) {
        conflicts[id] = ids.filter(other => other !== id)
      }
    }
  }
  return conflicts
}

// ===== React hook =====
export function useShortcutStore() {
  const shortcuts = useSyncExternalStore(subscribe, getSnapshot)
  return { shortcuts, ...actions }
}

/** Imperative access outside React */
export const shortcutStore = {
  getState: getSnapshot,
  ...actions,
}

// ===== Helpers: convert KeyboardEvent → ShortcutDef =====
const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

/** Detect if a key is a modifier key */
function isModifierKey(key: string): boolean {
  return ['Control', 'Meta', 'Shift', 'Alt'].includes(key)
}

/**
 * Convert a KeyboardEvent into a ShortcutDef.
 * Returns null if only modifier keys are pressed (no actual key).
 */
export function eventToShortcut(e: KeyboardEvent): ShortcutDef | null {
  if (isModifierKey(e.key)) return null

  const parts: string[] = []
  const displayParts: string[] = []

  // Mod (Cmd on Mac, Ctrl on Win/Linux)
  if (isMac ? e.metaKey : e.ctrlKey) {
    parts.push('mod')
    displayParts.push('⌘')
  }
  // Extra ctrl on Mac (if meta wasn't used)
  if (isMac && e.ctrlKey && !e.metaKey) {
    parts.push('ctrl')
    displayParts.push('Ctrl')
  }
  if (!isMac && e.metaKey && !e.ctrlKey) {
    parts.push('mod')
    displayParts.push('⌘')
  }
  if (e.shiftKey) {
    parts.push('shift')
    displayParts.push('Shift')
  }
  if (e.altKey) {
    parts.push('alt')
    displayParts.push('Alt')
  }

  // Actual key
  let keyName = e.key
  if (keyName === 'Escape') keyName = 'escape'
  else if (keyName === 'Enter') keyName = 'enter'
  else if (keyName === ' ') keyName = 'space'
  else keyName = keyName.toLowerCase()

  parts.push(keyName)

  // Display key — capitalize single chars
  const displayKey = keyName === 'escape' ? 'Esc'
    : keyName === 'enter' ? 'Enter'
    : keyName === 'space' ? 'Space'
    : keyName === '`' ? '`'
    : keyName === ',' ? ','
    : keyName.length === 1 ? keyName.toUpperCase()
    : keyName

  displayParts.push(displayKey)

  return {
    internal: parts.join('+'),
    display: displayParts.join(' '),
  }
}
