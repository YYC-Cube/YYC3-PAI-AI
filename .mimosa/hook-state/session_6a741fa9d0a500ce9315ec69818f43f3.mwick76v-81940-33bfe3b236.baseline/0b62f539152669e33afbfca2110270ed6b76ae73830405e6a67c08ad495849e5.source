/**
 * @file ShortcutCheatSheet.tsx
 * @description 快捷键提示组件，提供快捷键帮助
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags shortcut,help,ui,component
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { X, Keyboard, Search } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { useShortcutStore } from '../store/shortcut-store'

interface ShortcutCheatSheetProps {
  /** Whether the cheat sheet is visible */
  visible: boolean
  /** Close callback */
  onClose: () => void
}

/** Shortcut groups matching the SettingsPanel structure */
const CHEAT_GROUPS: {
  catKey: string
  items: { key: string; defaultDisplay: string }[]
}[] = [
  {
    catKey: 'catGeneral',
    items: [
      { key: 'commandPalette', defaultDisplay: '⌘ K' },
      { key: 'toggleTheme', defaultDisplay: '⌘ Shift T' },
      { key: 'toggleLang', defaultDisplay: '⌘ Shift L' },
      { key: 'openSettings', defaultDisplay: '⌘ ,' },
      { key: 'globalSearch', defaultDisplay: '⌘ Shift F' },
      { key: 'newProject', defaultDisplay: '⌘ Shift N' },
    ],
  },
  {
    catKey: 'catEditor',
    items: [
      { key: 'save', defaultDisplay: '⌘ S' },
      { key: 'undo', defaultDisplay: '⌘ Z' },
      { key: 'redo', defaultDisplay: '⌘ Shift Z' },
      { key: 'find', defaultDisplay: '⌘ F' },
      { key: 'replace', defaultDisplay: '⌘ H' },
    ],
  },
  {
    catKey: 'catPanels',
    items: [
      { key: 'toggleTerminal', defaultDisplay: '⌘ `' },
      { key: 'togglePreview', defaultDisplay: '⌘ 1' },
      { key: 'closePanel', defaultDisplay: 'Esc' },
      { key: 'openSnippets', defaultDisplay: '⌘ Shift S' },
      { key: 'openTaskBoard', defaultDisplay: '⌘ Shift B' },
      { key: 'openGitPanel', defaultDisplay: '⌘ Shift H' },
      { key: 'openPerformance', defaultDisplay: '⌘ Shift P' },
      { key: 'openDiagnostics', defaultDisplay: '⌘ Shift D' },
      { key: 'openActivityLog', defaultDisplay: '⌘ Shift J' },
      { key: 'shortcutCheatSheet', defaultDisplay: '⌘ /' },
    ],
  },
  {
    catKey: 'catAI',
    items: [
      { key: 'aiAssist', defaultDisplay: '⌘ Shift A' },
      { key: 'codeGen', defaultDisplay: '⌘ Shift G' },
      { key: 'modelSettings', defaultDisplay: '⌘ Shift M' },
    ],
  },
]

export function ShortcutCheatSheet({ visible, onClose }: ShortcutCheatSheetProps) {
  const { t } = useI18n()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { shortcuts } = useShortcutStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const prevVisibleRef = useRef(visible)

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      queueMicrotask(() => setQuery(''))
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    prevVisibleRef.current = visible
  }, [visible])

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return CHEAT_GROUPS
    const q = query.toLowerCase()
    return CHEAT_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const label = t('shortcuts', item.key).toLowerCase()
        const display = (shortcuts[item.key]?.display ?? item.defaultDisplay).toLowerCase()
        return label.includes(q) || display.includes(q) || item.key.toLowerCase().includes(q)
      }),
    })).filter(g => g.items.length > 0)
  }, [query, shortcuts, t])

  if (!visible) return null

  const totalShortcuts = CHEAT_GROUPS.reduce((sum, g) => sum + g.items.length, 0)
  const matchedCount = filteredGroups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: Z_INDEX.topModal + 30,
        background: tk.overlayBg,
        backdropFilter: BLUR.md,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="flex flex-col overflow-hidden"
        style={{
          width: 640,
          maxHeight: '80vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 60px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${tk.borderDim}` }}
        >
          <div className="flex items-center gap-2.5">
            <Keyboard size={16} color={tk.primary} />
            <span style={{
              fontFamily: tk.fontDisplay,
              fontSize: '13px',
              color: tk.primary,
              letterSpacing: '2px',
            }}>
              {t('cheatSheet', 'title')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{
              fontFamily: tk.fontMono,
              fontSize: '9px',
              color: tk.foregroundMuted,
            }}>
              {t('cheatSheet', 'subtitle')}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded hover:opacity-70"
              style={{ color: tk.foregroundMuted }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: tk.inputBg,
              border: `1px solid ${tk.inputBorder}`,
            }}
          >
            <Search size={13} color={tk.foregroundMuted} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('cheatSheet', 'searchPlaceholder')}
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '12px',
                color: tk.foreground,
                border: 'none',
              }}
            />
            {query && (
              <span style={{
                fontFamily: tk.fontMono,
                fontSize: '9px',
                color: tk.foregroundMuted,
              }}>
                {matchedCount}/{totalShortcuts}
              </span>
            )}
          </div>
        </div>

        {/* Shortcut grid — two-column layout */}
        <div className="flex-1 overflow-y-auto neon-scrollbar px-5 py-3">
          {filteredGroups.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span style={{
                fontFamily: tk.fontMono,
                fontSize: '12px',
                color: tk.foregroundMuted,
                opacity: 0.5,
              }}>
                {t('cheatSheet', 'noResults')}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {filteredGroups.map(group => (
                <div key={group.catKey} className="col-span-2 md:col-span-1" style={{ breakInside: 'avoid' }}>
                  {/* Category header */}
                  <div
                    className="flex items-center gap-1.5 mb-1.5"
                    style={{ borderBottom: `1px solid ${tk.borderDim}`, paddingBottom: 4 }}
                  >
                    <span style={{
                      fontFamily: tk.fontMono,
                      fontSize: '9px',
                      color: tk.primary,
                      letterSpacing: '1.5px',
                      opacity: 0.8,
                    }}>
                      {t('shortcuts', group.catKey)}
                    </span>
                    <span style={{
                      fontFamily: tk.fontMono,
                      fontSize: '8px',
                      color: tk.foregroundMuted,
                    }}>
                      ({group.items.length})
                    </span>
                  </div>

                  {/* Items */}
                  {group.items.map(item => {
                    const display = shortcuts[item.key]?.display ?? item.defaultDisplay
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-1.5 px-1 rounded transition-colors"
                        style={{
                          borderBottom: `1px solid ${tk.borderDim}20`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = `${tk.primary}08`
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        <span style={{
                          fontFamily: tk.fontBody,
                          fontSize: '12px',
                          color: tk.foreground,
                        }}>
                          {t('shortcuts', item.key)}
                        </span>
                        <kbd
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '10px',
                            color: tk.primary,
                            background: tk.primaryGlow,
                            border: `1px solid ${tk.borderDim}`,
                            boxShadow: isCyberpunk ? `0 0 4px ${tk.primaryGlow}` : 'none',
                          }}
                        >
                          {display}
                        </kbd>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center px-5 py-2.5 shrink-0"
          style={{ borderTop: `1px solid ${tk.borderDim}` }}
        >
          <span style={{
            fontFamily: tk.fontMono,
            fontSize: '9px',
            color: tk.foregroundMuted,
            opacity: 0.6,
          }}>
            {t('cheatSheet', 'footer')}
          </span>
        </div>
      </div>
    </div>
  )
}
