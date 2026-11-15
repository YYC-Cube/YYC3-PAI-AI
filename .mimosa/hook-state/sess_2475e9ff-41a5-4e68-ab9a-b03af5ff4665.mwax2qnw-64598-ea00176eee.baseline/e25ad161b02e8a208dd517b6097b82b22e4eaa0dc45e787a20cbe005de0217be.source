/**
 * @file CommandPalette.tsx
 * @description 命令面板组件，提供命令执行
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,command,ui,component
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Search, Command, CornerDownLeft,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

// ===== Command Definition =====
export interface PaletteCommand {
  id: string
  labelKey: string
  categoryKey: string
  icon: React.ElementType
  shortcut?: string
  action: () => void
}

interface CommandPaletteProps {
  visible: boolean
  onClose: () => void
  commands: PaletteCommand[]
}

export function CommandPalette({ visible, onClose, commands }: CommandPaletteProps) {
  const { t } = useI18n()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (visible) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  // Fuzzy filter
  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((cmd) => {
      const label = t('commandPalette', cmd.labelKey).toLowerCase()
      const cat = t('commandPalette', cmd.categoryKey).toLowerCase()
      return label.includes(q) || cat.includes(q) || cmd.id.toLowerCase().includes(q)
    })
  }, [query, commands, t])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, PaletteCommand[]>()
    for (const cmd of filtered) {
      const key = cmd.categoryKey
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(cmd)
    }
    return map
  }, [filtered])

  // Flat list for keyboard nav
  const flatList = useMemo(() => filtered, [filtered])

  // Clamp index
  useEffect(() => {
    if (selectedIndex >= flatList.length) setSelectedIndex(Math.max(0, flatList.length - 1))
  }, [flatList.length, selectedIndex])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-idx="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const executeCommand = useCallback((cmd: PaletteCommand) => {
    onClose()
    // Defer to avoid stale closures
    requestAnimationFrame(() => cmd.action())
  }, [onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && flatList[selectedIndex]) {
        e.preventDefault()
        executeCommand(flatList[selectedIndex])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, flatList, selectedIndex, onClose, executeCommand])

  if (!visible) return null

  let globalIdx = -1

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh]"
      style={{ zIndex: Z_INDEX.topModal + 50, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 560,
          maxHeight: '55vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: tk.border }}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <Command size={14} color={tk.primary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, letterSpacing: '1px' }}>K</span>
          </div>
          <Search size={16} color={tk.foregroundMuted} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder={t('commandPalette', 'placeholder')}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: tk.fontBody,
              fontSize: '14px',
              color: tk.foreground,
            }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded"
            style={{
              fontFamily: tk.fontMono,
              fontSize: '9px',
              color: tk.foregroundMuted,
              background: tk.primaryGlow,
              border: `1px solid ${tk.borderDim}`,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="flex-1 overflow-y-auto neon-scrollbar py-1" style={{ maxHeight: '45vh' }}>
          {flatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Search size={24} color={tk.foregroundMuted} style={{ opacity: 0.3 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
                {t('commandPalette', 'noResults')}
              </p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([catKey, cmds]) => (
              <div key={catKey}>
                {/* Category header */}
                <div className="px-4 pt-2.5 pb-1">
                  <span style={{
                    fontFamily: tk.fontMono,
                    fontSize: '9px',
                    color: tk.primary,
                    letterSpacing: '1.5px',
                    opacity: 0.6,
                  }}>
                    {t('commandPalette', catKey).toUpperCase()}
                  </span>
                </div>
                {cmds.map((cmd) => {
                  globalIdx++
                  const idx = globalIdx
                  const isSelected = idx === selectedIndex
                  const Icon = cmd.icon
                  return (
                    <div
                      key={cmd.id}
                      data-cmd-idx={idx}
                      className="flex items-center gap-3 mx-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: isSelected
                          ? isCyberpunk ? tk.primaryGlow : tk.cardHover
                          : 'transparent',
                        border: isSelected
                          ? `1px solid ${tk.borderDim}`
                          : '1px solid transparent',
                      }}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected ? tk.primaryGlow : 'transparent',
                          border: `1px solid ${isSelected ? tk.border : 'transparent'}`,
                        }}
                      >
                        <Icon size={14} color={isSelected ? tk.primary : tk.foregroundMuted} />
                      </div>
                      <span
                        className="flex-1"
                        style={{
                          fontFamily: tk.fontBody,
                          fontSize: '13px',
                          color: isSelected ? tk.foreground : tk.foregroundMuted,
                        }}
                      >
                        {t('commandPalette', cmd.labelKey)}
                      </span>
                      {cmd.shortcut && (
                        <kbd
                          className="px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '9px',
                            color: tk.foregroundMuted,
                            background: tk.primaryGlow,
                            border: `1px solid ${tk.borderDim}`,
                          }}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <CornerDownLeft size={12} color={tk.primary} className="shrink-0" style={{ opacity: 0.5 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-center gap-3 px-4 py-2 border-t"
          style={{ borderColor: tk.border, background: tk.primaryGlow }}
        >
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '0.5px' }}>
            {t('commandPalette', 'hint')}
          </span>
        </div>
      </div>
    </div>
  )
}
