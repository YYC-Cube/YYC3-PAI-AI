/**
 * @file SnippetManager.tsx
 * @description 代码片段管理器组件，提供代码片段管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags snippet,manager,ui,component
 */

import { useState, useMemo } from 'react'
import {
  X, Plus, Copy, Trash2, Edit3, Tag, Search, Code2, FileInput,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { activityBus } from '../store/activity-store'
import { cyberToast } from './CyberToast'

interface SnippetManagerProps {
  visible: boolean
  onClose: () => void
  /** Callback to insert snippet code into the active editor at cursor position */
  onInsertSnippet?: (code: string) => void
}

export interface Snippet {
  id: string
  name: string
  language: string
  tags: string[]
  code: string
  createdAt: number
}

const LS_KEY = 'yyc3_snippets'

const PRESET_SNIPPETS: Snippet[] = [
  {
    id: 's1', name: 'React useState Hook', language: 'typescript',
    tags: ['react', 'hook'],
    code: `const [value, setValue] = useState<string>('')`,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 's2', name: 'Fetch API Template', language: 'typescript',
    tags: ['api', 'async'],
    code: `async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  return res.json()
}`,
    createdAt: Date.now() - 72000000,
  },
  {
    id: 's3', name: 'Tailwind Card', language: 'html',
    tags: ['ui', 'tailwind'],
    code: `<div class="rounded-xl border bg-card p-6 shadow-sm">
  <h3 class="text-lg font-semibold">Title</h3>
  <p class="text-muted-foreground mt-2">Description</p>
</div>`,
    createdAt: Date.now() - 50000000,
  },
  {
    id: 's4', name: 'Zustand Store', language: 'typescript',
    tags: ['state', 'zustand'],
    code: `import { create } from 'zustand'

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
}

export const useCounter = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
}))`,
    createdAt: Date.now() - 30000000,
  },
  {
    id: 's5', name: 'CSS Grid Layout', language: 'css',
    tags: ['ui', 'layout'],
    code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}`,
    createdAt: Date.now() - 20000000,
  },
]

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (Array.isArray(p) && p.length > 0) return p
    }
  } catch { /* ignore */ }
  return [...PRESET_SNIPPETS]
}

function persistSnippets(snippets: Snippet[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(snippets)) } catch { /* */ }
}

export function SnippetManager({ visible, onClose, onInsertSnippet }: SnippetManagerProps) {
  const { t, locale } = useI18n()
  const { tokens: tk } = useThemeStore()
  const isZh = locale === 'zh'

  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', language: 'typescript', tags: '', code: '' })

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    snippets.forEach((s: Snippet) => s.tags.forEach((tag: string) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [snippets])

  const filtered = useMemo(() => {
    let list = snippets
    if (activeTag !== 'all') {
      list = list.filter((s: Snippet) => s.tags.includes(activeTag))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s: Snippet) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some((tag: string) => tag.toLowerCase().includes(q))
      )
    }
    return list
  }, [snippets, activeTag, searchQuery])

  if (!visible) return null

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      cyberToast(t('snippet', 'copied'))
      activityBus.push('file', 'Snippet copied to clipboard', '代码片段已复制到剪贴板')
    }).catch(() => { /* fallback */ })
  }

  const handleInsert = (snippet: Snippet) => {
    if (onInsertSnippet) {
      onInsertSnippet(snippet.code)
      cyberToast(isZh ? `已插入: ${snippet.name}` : `Inserted: ${snippet.name}`)
      activityBus.push('file', `Snippet inserted: ${snippet.name}`, `插入代码片段: ${snippet.name}`, snippet.language)
    } else {
      // Fallback to copy if no insert callback
      handleCopy(snippet.code)
    }
  }

  const handleDelete = (id: string) => {
    const snippet = snippets.find((s: Snippet) => s.id === id)
    const next = snippets.filter((s: Snippet) => s.id !== id)
    setSnippets(next)
    persistSnippets(next)
    if (snippet) activityBus.push('file', `Snippet deleted: ${snippet.name}`, `删除代码片段: ${snippet.name}`)
  }

  const startEdit = (s: Snippet) => {
    setEditingId(s.id)
    setEditForm({ name: s.name, language: s.language, tags: s.tags.join(', '), code: s.code })
  }

  const startCreate = () => {
    setEditingId('__new__')
    setEditForm({ name: '', language: 'typescript', tags: '', code: '' })
  }

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.code.trim()) return
    const tags = editForm.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    if (editingId === '__new__') {
      const newSnippet: Snippet = {
        id: `s_${Date.now()}`,
        name: editForm.name,
        language: editForm.language,
        tags,
        code: editForm.code,
        createdAt: Date.now(),
      }
      const next = [newSnippet, ...snippets]
      setSnippets(next)
      persistSnippets(next)
      activityBus.push('file', `Snippet created: ${editForm.name}`, `创建代码片段: ${editForm.name}`, editForm.language)
    } else {
      const next = snippets.map((s: Snippet) => s.id === editingId ? { ...s, name: editForm.name, language: editForm.language, tags, code: editForm.code } : s)
      setSnippets(next)
      persistSnippets(next)
      activityBus.push('file', `Snippet updated: ${editForm.name}`, `更新代码片段: ${editForm.name}`, editForm.language)
    }
    setEditingId(null)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: Z_INDEX.assistPanel,
      background: tk.overlayBg, backdropFilter: BLUR.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: 800, maxHeight: '85vh',
          background: tk.panelBg, border: `1px solid ${tk.border}`,
          borderRadius: tk.borderRadius, boxShadow: tk.shadow,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          backdropFilter: BLUR.lg,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${tk.borderDim}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={16} color={tk.primary} />
              <span style={{ fontFamily: tk.fontDisplay, fontSize: '14px', color: tk.primary, letterSpacing: '1px' }}>
                {t('snippet', 'title')}
              </span>
            </div>
            <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 2, letterSpacing: '0.5px' }}>
              {t('snippet', 'subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={startCreate} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: tk.borderRadius,
              background: tk.primary, color: tk.background,
              fontFamily: tk.fontMono, fontSize: '10px', border: 'none', cursor: 'pointer',
            }}>
              <Plus size={12} /> {t('snippet', 'add')}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tk.foregroundMuted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search + Tags */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${tk.borderDim}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: tk.inputBg, border: `1px solid ${tk.inputBorder}`,
            borderRadius: tk.borderRadius, padding: '6px 10px',
          }}>
            <Search size={13} color={tk.foregroundMuted} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('snippet', 'search')}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground, flex: 1,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <button
              onClick={() => setActiveTag('all')}
              style={{
                padding: '2px 8px', borderRadius: '99px', cursor: 'pointer',
                fontFamily: tk.fontMono, fontSize: '10px', border: `1px solid ${tk.border}`,
                background: activeTag === 'all' ? tk.primary : 'transparent',
                color: activeTag === 'all' ? tk.background : tk.foregroundMuted,
              }}
            >{t('snippet', 'tagAll')}</button>
            {allTags.map((tag: string) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  padding: '2px 8px', borderRadius: '99px', cursor: 'pointer',
                  fontFamily: tk.fontMono, fontSize: '10px', border: `1px solid ${tk.border}`,
                  background: activeTag === tag ? tk.primary : 'transparent',
                  color: activeTag === tag ? tk.background : tk.foregroundMuted,
                }}
              >{tag}</button>
            ))}
          </div>
        </div>

        {/* Edit form (if active) */}
        {editingId && (
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${tk.borderDim}`, background: tk.cardBg }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, marginBottom: 8 }}>
              <input
                value={editForm.name}
                onChange={e => setEditForm((f: { name: string; language: string; tags: string; code: string }) => ({ ...f, name: e.target.value }))}
                placeholder={t('snippet', 'nameLabel')}
                style={{
                  background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.borderRadius,
                  padding: '6px 10px', fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, outline: 'none',
                }}
              />
              <select
                value={editForm.language}
                onChange={e => setEditForm((f: { name: string; language: string; tags: string; code: string }) => ({ ...f, language: e.target.value }))}
                style={{
                  background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.borderRadius,
                  padding: '6px 10px', fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, outline: 'none',
                }}
              >
                {['typescript', 'javascript', 'html', 'css', 'python', 'rust', 'go', 'json', 'yaml', 'sql'].map((l: string) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <input
              value={editForm.tags}
              onChange={e => setEditForm((f: { name: string; language: string; tags: string; code: string }) => ({ ...f, tags: e.target.value }))}
              placeholder={`${t('snippet', 'tagsLabel')} (comma separated)`}
              style={{
                width: '100%', background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.borderRadius,
                padding: '6px 10px', fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, outline: 'none', marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={editForm.code}
              onChange={e => setEditForm((f: { name: string; language: string; tags: string; code: string }) => ({ ...f, code: e.target.value }))}
              placeholder={t('snippet', 'codeLabel')}
              rows={5}
              style={{
                width: '100%', background: tk.codeBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.borderRadius,
                padding: '8px 10px', fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, outline: 'none',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingId(null)} style={{
                padding: '4px 12px', borderRadius: tk.borderRadius, border: `1px solid ${tk.border}`,
                background: 'transparent', color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
              }}>{t('snippet', 'cancel')}</button>
              <button onClick={saveEdit} style={{
                padding: '4px 12px', borderRadius: tk.borderRadius, border: 'none',
                background: tk.primary, color: tk.background, fontFamily: tk.fontMono, fontSize: '10px', cursor: 'pointer',
              }}>{t('snippet', 'save')}</button>
            </div>
          </div>
        )}

        {/* Snippet list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Code2 size={32} color={tk.foregroundMuted} style={{ opacity: 0.3, margin: '0 auto' }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foregroundMuted, marginTop: 12 }}>
                {t('snippet', 'noResults')}
              </p>
            </div>
          ) : (
            filtered.map((snippet: Snippet) => (
              <div key={snippet.id} style={{
                padding: '12px 14px', marginBottom: 8,
                background: tk.cardBg, border: `1px solid ${tk.cardBorder}`,
                borderRadius: tk.borderRadius, transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>{snippet.name}</span>
                    <span style={{
                      padding: '1px 6px', borderRadius: '99px', fontSize: '9px',
                      fontFamily: tk.fontMono, background: tk.primaryGlow, color: tk.primary,
                      border: `1px solid ${tk.border}`,
                    }}>{snippet.language}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleCopy(snippet.code)} title="Copy" style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: tk.primary, padding: 2,
                    }}><Copy size={13} /></button>
                    <button onClick={() => handleInsert(snippet)} title="Insert into editor" style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: tk.success, padding: 2,
                    }}><FileInput size={13} /></button>
                    <button onClick={() => startEdit(snippet)} title="Edit" style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: tk.foregroundMuted, padding: 2,
                    }}><Edit3 size={13} /></button>
                    <button onClick={() => handleDelete(snippet.id)} title="Delete" style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: tk.error, padding: 2,
                    }}><Trash2 size={13} /></button>
                  </div>
                </div>
                {snippet.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {snippet.tags.map((tag: string) => (
                      <span key={tag} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        padding: '0 5px', borderRadius: '99px', fontSize: '9px',
                        fontFamily: tk.fontMono, color: tk.foregroundMuted,
                        border: `1px solid ${tk.borderDim}`,
                      }}>
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                  </div>
                )}
                <pre style={{
                  margin: 0, padding: '8px 10px',
                  background: tk.codeBg, borderRadius: tk.borderRadius,
                  fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground,
                  overflow: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap',
                  border: `1px solid ${tk.borderDim}`,
                }}>{snippet.code}</pre>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 20px', borderTop: `1px solid ${tk.borderDim}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
            {filtered.length} / {snippets.length} {isZh ? '个片段' : 'snippets'}
          </span>
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.5 }}>
            YYC&#179; v4.8.0
          </span>
        </div>
      </div>
    </div>
  )
}
