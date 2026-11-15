/**
 * @file GlobalSearch.tsx
 * @description 全局搜索组件，提供全局搜索功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags search,global,ui,component
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Search, File, CornerDownLeft, FolderOpen,
  ArrowRight,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

/** A single search result */
interface SearchResult {
  /** File name key */
  fileName: string
  /** Matched line numbers (1-based) */
  matchedLines: { lineNumber: number; text: string; matchStart: number; matchEnd: number }[]
  /** Whether the file name itself matched (not just content) */
  nameMatch: boolean
}

interface GlobalSearchProps {
  visible: boolean
  onClose: () => void
  /** File content map from IDEMode — keys are file names, values are content strings */
  fileContentMap: Record<string, string>
  /** Called when user clicks a result to open a file */
  onSelectFile: (fileName: string, line?: number) => void
  /** 对齐 Guidelines: Host-File-System Manager — 替换回调 */
  onReplace?: (fileName: string, oldText: string, newText: string) => void
}

/** Max content matches shown per file */
const MAX_LINES_PER_FILE = 5
/** Max total results */
const MAX_RESULTS = 50

export function GlobalSearch({ visible, onClose, fileContentMap, onSelectFile, onReplace }: GlobalSearchProps) {
  const { t, locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const [query, setQuery] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [extFilter, setExtFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevVisibleRef = useRef(visible)

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      queueMicrotask(() => {
        setQuery('')
        setSelectedIndex(0)
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    prevVisibleRef.current = visible
  }, [visible])

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []
    const q = caseSensitive ? query : query.toLowerCase()

    let regex: RegExp | null = null
    if (useRegex) {
      try { regex = new RegExp(query, caseSensitive ? 'g' : 'gi') }
      catch { return [] }
    }

    const out: SearchResult[] = []
    let fileNames = Object.keys(fileContentMap)

    if (extFilter.trim()) {
      const exts = extFilter.split(',').map(e => e.trim().toLowerCase().replace(/^\./, ''))
      fileNames = fileNames.filter(f => {
        const dot = f.lastIndexOf('.')
        const ext = dot >= 0 ? f.slice(dot + 1).toLowerCase() : ''
        return exts.includes(ext)
      })
    }

    for (const fileName of fileNames) {
      if (out.length >= MAX_RESULTS) break
      const content = fileContentMap[fileName] ?? ''

      const nameLower = caseSensitive ? fileName : fileName.toLowerCase()
      const nameMatch = regex ? regex.test(fileName) : nameLower.includes(q)
      if (regex) regex.lastIndex = 0

      const lines = content.split('\n')
      const matchedLines: SearchResult['matchedLines'] = []

      for (let i = 0; i < lines.length && matchedLines.length < MAX_LINES_PER_FILE; i++) {
        const line = lines[i]
        const lineToSearch = caseSensitive ? line : line.toLowerCase()

        if (regex) {
          regex.lastIndex = 0
          const m = regex.exec(line)
          if (m) {
            matchedLines.push({
              lineNumber: i + 1,
              text: line,
              matchStart: m.index,
              matchEnd: m.index + m[0].length,
            })
          }
        } else {
          const idx = lineToSearch.indexOf(q)
          if (idx !== -1) {
            matchedLines.push({
              lineNumber: i + 1,
              text: line,
              matchStart: idx,
              matchEnd: idx + query.length,
            })
          }
        }
      }

      if (nameMatch || matchedLines.length > 0) {
        out.push({ fileName, matchedLines, nameMatch })
      }
    }

    return out
  }, [query, fileContentMap, caseSensitive, useRegex, extFilter])

  const totalCount = results.length
  useEffect(() => {
    if (selectedIndex >= totalCount) {
      queueMicrotask(() => setSelectedIndex(Math.max(0, totalCount - 1)))
    }
  }, [totalCount, selectedIndex])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-search-idx="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleSelect = useCallback((fileName: string, line?: number) => {
    onClose()
    requestAnimationFrame(() => onSelectFile(fileName, line))
  }, [onClose, onSelectFile])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, totalCount - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        const r = results[selectedIndex]
        handleSelect(r.fileName, r.matchedLines[0]?.lineNumber)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, totalCount, results, selectedIndex, onClose, handleSelect])

  const totalMatches = results.reduce((sum, r) => sum + r.matchedLines.length, 0)

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[12vh]"
      style={{ zIndex: Z_INDEX.topModal + 60, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 640,
          maxHeight: '62vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: tk.border }}>
          <Search size={16} color={tk.primary} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder={t('search', 'placeholder')}
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: tk.fontBody, fontSize: '14px', color: tk.foreground }}
          />

          {/* Toggle buttons */}
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className="px-1.5 py-0.5 rounded transition-all"
            style={{
              fontFamily: tk.fontMono,
              fontSize: '9px',
              color: caseSensitive ? tk.primary : tk.foregroundMuted,
              background: caseSensitive ? tk.primaryGlow : 'transparent',
              border: `1px solid ${caseSensitive ? tk.primary : tk.borderDim}`,
            }}
            title={t('search', 'caseSensitive')}
          >
            Aa
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className="px-1.5 py-0.5 rounded transition-all"
            style={{
              fontFamily: tk.fontMono,
              fontSize: '9px',
              color: useRegex ? tk.primary : tk.foregroundMuted,
              background: useRegex ? tk.primaryGlow : 'transparent',
              border: `1px solid ${useRegex ? tk.primary : tk.borderDim}`,
            }}
            title={t('search', 'regex')}
          >
            .*
          </button>
          {/* 对齐 Guidelines: Search Panel — 替换切换 */}
          <button
            onClick={() => setShowReplace(!showReplace)}
            className="px-1.5 py-0.5 rounded transition-all"
            style={{
              fontFamily: tk.fontMono, fontSize: '9px',
              color: showReplace ? tk.primary : tk.foregroundMuted,
              background: showReplace ? tk.primaryGlow : 'transparent',
              border: `1px solid ${showReplace ? tk.primary : tk.borderDim}`,
            }}
            title={isZh ? '替换' : 'Replace'}
          >
            R
          </button>
          <kbd
            className="px-1.5 py-0.5 rounded shrink-0"
            style={{
              fontFamily: tk.fontMono, fontSize: '9px',
              color: tk.foregroundMuted, background: tk.primaryGlow,
              border: `1px solid ${tk.borderDim}`,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Replace input row + Extension filter */}
        {showReplace && (
          <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: tk.borderDim }}>
            <ArrowRight size={13} color={tk.warning} className="shrink-0" style={{ opacity: 0.5 }} />
            <input
              ref={replaceRef}
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder={isZh ? '替换为...' : 'Replace with...'}
              className="flex-1 bg-transparent outline-none"
              style={{ fontFamily: tk.fontBody, fontSize: '13px', color: tk.foreground }}
            />
            <button
              className="px-2 py-0.5 rounded transition-all hover:opacity-80"
              style={{
                fontFamily: tk.fontMono, fontSize: '9px',
                color: tk.warning, background: `${tk.warning}15`,
                border: `1px solid ${tk.warning}33`,
              }}
              onClick={() => {
                if (!query.trim() || results.length === 0) return
                results.forEach(r => {
                  onReplace?.(r.fileName, query, replaceText)
                })
              }}
              title={isZh ? '全部替换' : 'Replace All'}
            >
              {isZh ? '全部替换' : 'All'}
            </button>
            <div style={{ width: 1, height: 16, background: tk.borderDim }} />
            <input
              type="text"
              value={extFilter}
              onChange={(e) => setExtFilter(e.target.value)}
              placeholder={isZh ? '类型过滤 (ts,tsx)' : 'Filter (ts,tsx)'}
              className="bg-transparent outline-none"
              style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, width: 100 }}
            />
          </div>
        )}

        {/* Stats bar */}
        {query.trim() && (
          <div className="flex items-center gap-3 px-4 py-1.5 border-b" style={{ borderColor: tk.borderDim }}>
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '0.5px' }}>
              {t('search', 'resultsCount').replace('{files}', String(results.length)).replace('{matches}', String(totalMatches))}
            </span>
          </div>
        )}

        {/* Results list */}
        <div ref={listRef} className="flex-1 overflow-y-auto neon-scrollbar py-1" style={{ maxHeight: '50vh' }}>
          {query.trim() && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Search size={24} color={tk.foregroundMuted} style={{ opacity: 0.3 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
                {t('search', 'noResults')}
              </p>
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <FolderOpen size={24} color={tk.foregroundMuted} style={{ opacity: 0.2 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
                {t('search', 'emptyHint')}
              </p>
              <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.5 }}>
                {t('search', 'emptyHint2')}
              </p>
            </div>
          ) : (
            results.map((result, rIdx) => {
              const isSelected = rIdx === selectedIndex
              return (
                <div
                  key={result.fileName}
                  data-search-idx={rIdx}
                  className="mx-2 mb-1 rounded-lg overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${isSelected ? tk.border : 'transparent'}`,
                    background: isSelected ? (isCyberpunk ? tk.primaryGlow : tk.cardHover) : 'transparent',
                  }}
                  onMouseEnter={() => setSelectedIndex(rIdx)}
                >
                  {/* File name row */}
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:opacity-80"
                    onClick={() => handleSelect(result.fileName, result.matchedLines[0]?.lineNumber)}
                  >
                    <File size={13} color={tk.primary} className="shrink-0" style={{ opacity: 0.7 }} />
                    <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground, flex: 1 }}>
                      {result.fileName}
                    </span>
                    {result.nameMatch && (
                      <span
                        className="px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          fontFamily: tk.fontMono, fontSize: '8px',
                          color: tk.primary, background: tk.primaryGlow,
                          border: `1px solid ${tk.borderDim}`,
                        }}
                      >
                        {t('search', 'nameMatch')}
                      </span>
                    )}
                    {result.matchedLines.length > 0 && (
                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                        {result.matchedLines.length} {t('search', 'matches')}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft size={11} color={tk.primary} className="shrink-0" style={{ opacity: 0.5 }} />
                    )}
                  </button>

                  {/* Matched content lines */}
                  {result.matchedLines.length > 0 && (
                    <div className="px-3 pb-2">
                      {result.matchedLines.map((ml) => (
                        <button
                          key={ml.lineNumber}
                          className="w-full flex items-start gap-2 px-2 py-1 rounded text-left transition-all hover:bg-white/5"
                          onClick={() => handleSelect(result.fileName, ml.lineNumber)}
                        >
                          <span
                            className="shrink-0 w-8 text-right"
                            style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.5, paddingTop: 2 }}
                          >
                            {ml.lineNumber}
                          </span>
                          <span
                            className="flex-1 break-all"
                            style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted, lineHeight: '18px' }}
                          >
                            {/* Render with highlight */}
                            {ml.text.slice(0, ml.matchStart)}
                            <span style={{
                              background: isCyberpunk ? `${tk.primary}33` : `${tk.primary}22`,
                              color: tk.primary,
                              borderRadius: 2,
                              padding: '0 1px',
                            }}>
                              {ml.text.slice(ml.matchStart, ml.matchEnd)}
                            </span>
                            {ml.text.slice(ml.matchEnd)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: tk.border, background: tk.primaryGlow }}
        >
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '0.5px' }}>
            {t('search', 'hint')}
          </span>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, opacity: 0.5 }}>
              {Object.keys(fileContentMap).length} {t('search', 'filesIndexed')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
