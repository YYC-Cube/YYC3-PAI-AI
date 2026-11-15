/**
 * @file useKeyboardShortcuts.ts
 * @description 键盘快捷键Hook，管理键盘快捷键
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hook,keyboard,shortcut,react
 */

import { useEffect, useRef } from 'react'

export interface ShortcutBinding {
  /** Human-readable key combo, e.g. 'mod+k' ('mod' = Cmd on Mac, Ctrl on Win/Linux) */
  keys: string
  /** Action to execute */
  action: () => void
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean
}

/** Parse a key string like 'mod+shift+k' into a checker */
function parseKeys(raw: string) {
  const parts = raw.toLowerCase().split('+').map((s) => s.trim())
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  return {
    mod: parts.includes('mod'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts.filter((p) => !['mod', 'ctrl', 'shift', 'alt'].includes(p))[0] || '',
    isMac,
  }
}

function matchesEvent(parsed: ReturnType<typeof parseKeys>, e: KeyboardEvent): boolean {
  const { mod, ctrl, shift, alt, key, isMac } = parsed

  // 'mod' = metaKey on Mac, ctrlKey on others
  const modPressed = mod ? (isMac ? e.metaKey : e.ctrlKey) : true
  const ctrlPressed = ctrl ? e.ctrlKey : !ctrl
  const shiftPressed = shift ? e.shiftKey : !e.shiftKey
  const altPressed = alt ? e.altKey : !e.altKey

  // Key comparison (handle special keys)
  const keyMatch = key === 'escape' ? e.key === 'Escape'
    : key === 'enter' ? e.key === 'Enter'
    : key === '`' ? e.key === '`'
    : key === ',' ? e.key === ','
    : key === '/' ? e.key === '/'
    : e.key.toLowerCase() === key

  // If mod is specified, don't also require ctrl/meta separately
  if (mod) {
    return modPressed && shiftPressed && altPressed && keyMatch
  }

  return ctrlPressed && shiftPressed && altPressed && keyMatch
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[]) {
  const bindingsRef = useRef(bindings)
  
  useEffect(() => {
    bindingsRef.current = bindings
  }, [bindings])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if focused in an input/textarea (unless it's Escape or our specific combos)
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      for (const binding of bindingsRef.current) {
        const parsed = parseKeys(binding.keys)
        if (matchesEvent(parsed, e)) {
          // Allow Escape even in inputs
          if (isInput && parsed.key !== 'escape' && !parsed.mod) continue
          if (binding.preventDefault !== false) e.preventDefault()
          binding.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
