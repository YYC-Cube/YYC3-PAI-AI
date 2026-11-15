/**
 * @file WorkspaceTabs.tsx
 * @author YanYuCloudCube Team <admin@0379.email>
 * @description Settings sub-tabs: Shortcuts, Layouts, Account
 * @version v4.8.2
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  User, AlertTriangle, RotateCcw, Check, Edit3,
  FolderOpen, Save, RefreshCw, Cloud,
  Trash2, Download, Link2, GitMerge,
} from 'lucide-react'
import { useI18n } from '../../i18n/context'
import { useSettingsStore, settingsActions } from '../../store/settings-store'
import { useShortcutStore, eventToShortcut, getShortcutConflicts } from '../../store/shortcut-store'
import { usePanelDnD } from '../../store/panel-dnd-store'
import type { SettingsTabProps } from './SettingsShared'
import type { ThemeTokens } from '../../store/theme-store'
import type { LayoutSnapshot, LayoutSyncConflict } from '../../store/panel-dnd-store'

// ===== Shortcut definitions =====
const SHORTCUT_GROUPS = [
  {
    catKey: 'catGeneral',
    items: [
      { key: 'commandPalette', shortcut: '⌘ K' },
      { key: 'toggleTheme', shortcut: '⌘ Shift T' },
      { key: 'toggleLang', shortcut: '⌘ Shift L' },
      { key: 'openSettings', shortcut: '⌘ ,' },
      { key: 'globalSearch', shortcut: '⌘ Shift F' },
      { key: 'newProject', shortcut: '⌘ Shift N' },
    ],
  },
  {
    catKey: 'catEditor',
    items: [
      { key: 'save', shortcut: '⌘ S' },
      { key: 'undo', shortcut: '⌘ Z' },
      { key: 'redo', shortcut: '⌘ Shift Z' },
      { key: 'find', shortcut: '⌘ F' },
      { key: 'replace', shortcut: '⌘ H' },
    ],
  },
  {
    catKey: 'catPanels',
    items: [
      { key: 'toggleTerminal', shortcut: '⌘ `' },
      { key: 'togglePreview', shortcut: '⌘ 1' },
      { key: 'closePanel', shortcut: 'Esc' },
      { key: 'openSnippets', shortcut: '⌘ Shift S' },
      { key: 'openTaskBoard', shortcut: '⌘ Shift B' },
      { key: 'openGitPanel', shortcut: '⌘ Shift H' },
      { key: 'openPerformance', shortcut: '⌘ Shift P' },
      { key: 'openDiagnostics', shortcut: '⌘ Shift D' },
      { key: 'openActivityLog', shortcut: '⌘ Shift J' },
      { key: 'shortcutCheatSheet', shortcut: '⌘ /' },
    ],
  },
  {
    catKey: 'catAI',
    items: [
      { key: 'aiAssist', shortcut: '⌘ Shift A' },
      { key: 'codeGen', shortcut: '⌘ Shift G' },
      { key: 'modelSettings', shortcut: '⌘ Shift M' },
    ],
  },
]

// ===== Shortcuts Tab =====
export function ShortcutsTab({ tk, shortcuts, setShortcut }: SettingsTabProps & { shortcuts: Record<string, { internal: string; display: string }>; setShortcut: (id: string, def: { internal: string; display: string }) => void }) {
  const { t } = useI18n()
  const [recordingKey, setRecordingKey] = useState<string | null>(null)
  const { reset: resetShortcut, isCustom, resetAll } = useShortcutStore()

  const conflicts = useMemo(() => getShortcutConflicts(shortcuts), [shortcuts])
  const totalConflicts = Object.keys(conflicts).length

  useEffect(() => {
    if (!recordingKey) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const def = eventToShortcut(e)
      if (!def) return
      setShortcut(recordingKey, def)
      setRecordingKey(null)
    }
    const cancelHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setRecordingKey(null) }
    }
    window.addEventListener('keydown', handler, true)
    window.addEventListener('keydown', cancelHandler, true)
    return () => {
      window.removeEventListener('keydown', handler, true)
      window.removeEventListener('keydown', cancelHandler, true)
    }
  }, [recordingKey, setShortcut])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, letterSpacing: '0.5px' }}>
          {t('shortcutRebind', 'editHint')}
        </p>
        <button onClick={resetAll} className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
          <RotateCcw size={9} /> {t('shortcutRebind', 'resetAll')}
        </button>
      </div>

      {totalConflicts > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${tk.error}10`, border: `1px solid ${tk.error}30` }}>
          <AlertTriangle size={12} color={tk.error} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.error }}>
            {t('shortcutRebind', 'conflictsFound').replace('{count}', String(Math.floor(totalConflicts / 2)))}
          </span>
        </div>
      )}

      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.catKey}>
          <h4 style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1.5px', marginBottom: 6, opacity: 0.7 }}>
            {t('shortcuts', group.catKey)}
          </h4>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
            {group.items.map((item, i) => {
              const isRecording = recordingKey === item.key
              const customized = isCustom(item.key)
              const currentDisplay = shortcuts[item.key]?.display ?? item.shortcut
              const itemConflicts = conflicts[item.key]

              return (
                <div key={item.key} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: i < group.items.length - 1 ? `1px solid ${tk.borderDim}` : 'none', background: isRecording ? `${tk.primary}15` : itemConflicts ? `${tk.error}08` : i % 2 === 0 ? 'transparent' : tk.primaryGlow }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{t('shortcuts', item.key)}</span>
                    {customized && !isRecording && (
                      <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.warning, background: `${tk.warning}15`, border: `1px solid ${tk.warning}30` }}>{t('shortcutRebind', 'customized')}</span>
                    )}
                    {itemConflicts && !isRecording && (
                      <span className="flex items-center gap-0.5 px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.error, background: `${tk.error}15`, border: `1px solid ${tk.error}30` }} title={itemConflicts.map((c: string) => t('shortcuts', c)).join(', ')}>
                        <AlertTriangle size={8} />
                        {t('shortcutRebind', 'conflictWith').replace('{name}', t('shortcuts', itemConflicts[0]))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isRecording ? (
                      <span className="px-2 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.warning, background: `${tk.warning}15`, border: `1px dashed ${tk.warning}`, animation: 'neon-pulse 1.5s ease-in-out infinite' }}>
                        {t('shortcutRebind', 'recording')}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => setRecordingKey(item.key)} className="px-2 py-0.5 rounded cursor-pointer transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }} title={t('shortcutRebind', 'editHint')}>
                          {currentDisplay}
                        </button>
                        {customized && (
                          <button onClick={() => resetShortcut(item.key)} className="p-0.5 rounded transition-all hover:opacity-80" style={{ color: tk.foregroundMuted }} title={t('shortcutRebind', 'reset')}>
                            <RotateCcw size={10} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ===== Account Tab =====
export function AccountTab({ tk }: SettingsTabProps) {
  const { t } = useI18n()
  const settings = useSettingsStore()
  const profile = settings.userProfile

  return (
    <div className="space-y-5">
      <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'accountTitle')}</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: tk.primaryGlow, border: `2px solid ${tk.primary}` }}>
          {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <User size={28} color={tk.primary} />}
        </div>
        <div>
          <p style={{ fontFamily: tk.fontBody, fontSize: '16px', color: tk.foreground }}>{profile.username || 'Operator'}</p>
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{profile.email || 'admin@0379.email'}</p>
        </div>
      </div>
      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'username')}</label>
        <input type="text" value={profile.username} onChange={(e) => settingsActions.updateUserProfile({ username: e.target.value })} className="w-full mt-1.5 px-3 py-2 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '12px' }} />
      </div>
      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'email')}</label>
        <input type="email" value={profile.email} onChange={(e) => settingsActions.updateUserProfile({ email: e.target.value })} className="w-full mt-1.5 px-3 py-2 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '12px' }} />
      </div>
      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'bio')}</label>
        <textarea value={profile.bio || ''} onChange={(e) => settingsActions.updateUserProfile({ bio: e.target.value })} rows={3} className="w-full mt-1.5 px-3 py-2 rounded outline-none resize-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '12px' }} />
      </div>
    </div>
  )
}

// ===== Layout Thumbnail =====
function LayoutThumbnail({ slots, tk, windowCount, posLabels }: { slots: { left: string; center: string; right: string }; tk: ThemeTokens; windowCount: number; posLabels?: [string, string, string] }) {
  const [hovered, setHovered] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const isZh = useI18n().locale === 'zh'
  const { t } = useI18n()

  const SLOT_STYLE: Record<string, { color: string; label: string; fullZh: string; fullEn: string }> = {
    'ai-chat': { color: '#8b5cf6', label: 'AI', fullZh: 'AI 助手', fullEn: 'AI Chat' },
    'file-explorer': { color: '#10b981', label: 'FS', fullZh: '文件浏览', fullEn: 'Files' },
    'code-editor': { color: '#3b82f6', label: 'ED', fullZh: '代码编辑', fullEn: 'Editor' },
    'terminal': { color: '#f59e0b', label: 'TM', fullZh: '终端', fullEn: 'Terminal' },
    'preview': { color: '#ec4899', label: 'PV', fullZh: '预览', fullEn: 'Preview' },
    'db-explorer': { color: '#ef4444', label: 'DB', fullZh: '数据库', fullEn: 'Database' },
    'git-panel': { color: '#f97316', label: 'GT', fullZh: 'Git', fullEn: 'Git' },
    'settings': { color: '#6b7280', label: 'ST', fullZh: '设置', fullEn: 'Settings' },
    'task-board': { color: '#14b8a6', label: 'TK', fullZh: '任务板', fullEn: 'Tasks' },
    'snippets': { color: '#a855f7', label: 'SN', fullZh: '片段', fullEn: 'Snippets' },
    'performance': { color: '#06b6d4', label: 'PF', fullZh: '性能', fullEn: 'Perf' },
    'diagnostics': { color: '#eab308', label: 'DG', fullZh: '诊断', fullEn: 'Diag' },
  }
  const getStyle = (type: string) => SLOT_STYLE[type] || { color: tk.foregroundMuted, label: type.slice(0, 2).toUpperCase(), fullZh: type, fullEn: type }
  const slotEntries = [
    { pos: posLabels?.[0] ?? (isZh ? '左' : 'L'), ...getStyle(slots.left) },
    { pos: posLabels?.[1] ?? (isZh ? '中' : 'C'), ...getStyle(slots.center) },
    { pos: posLabels?.[2] ?? (isZh ? '右' : 'R'), ...getStyle(slots.right) },
  ]

  return (
    <div ref={wrapRef} className="shrink-0 relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex gap-px rounded overflow-hidden cursor-pointer transition-all" style={{ width: 44, height: 28, background: tk.borderDim, boxShadow: hovered ? `0 0 8px ${tk.primary}40` : 'none', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}>
        {slotEntries.map((s, i) => (
          <div key={i} className="flex-1 flex items-center justify-center" style={{ background: s.color + '25' }}>
            <span style={{ fontFamily: tk.fontMono, fontSize: '5.5px', color: s.color, letterSpacing: '0.3px' }}>{s.label}</span>
          </div>
        ))}
      </div>
      {windowCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center rounded-full" style={{ width: 10, height: 10, background: tk.primary, fontSize: '6px', color: '#fff', fontFamily: tk.fontMono, zIndex: 2 }}>{windowCount}</div>
      )}
      {hovered && (
        <div className="absolute left-0 top-full mt-2 z-50 rounded-lg overflow-hidden" style={{ width: 180, background: tk.panelBg, border: `1px solid ${tk.cardBorder}`, boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 12px ${tk.primary}20`, animation: 'modalIn 0.15s ease-out' }}>
          <div className="flex gap-px" style={{ height: 60, background: tk.borderDim }}>
            {slotEntries.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1" style={{ background: s.color + '15' }}>
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: s.color + '30' }}>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: s.color }}>{s.label}</span>
                </div>
                <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: s.color, opacity: 0.8 }}>{isZh ? s.fullZh : s.fullEn}</span>
              </div>
            ))}
          </div>
          <div className="px-2.5 py-2 space-y-1">
            {slotEntries.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{s.pos}:</span>
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: s.color }}>{isZh ? s.fullZh : s.fullEn}</span>
              </div>
            ))}
            {windowCount > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5 border-t" style={{ borderColor: tk.borderDim }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tk.primary }} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{windowCount} {t('settings', 'layoutDetachedWindows')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Share Button =====
function ShareButton({ layoutId, tk, dnd }: { layoutId: string; tk: ThemeTokens; dnd: ReturnType<typeof usePanelDnD> }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const handleShare = async () => {
    const url = dnd.generateShareURL(layoutId)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = url; document.body.appendChild(input); input.select(); document.execCommand('copy'); document.body.removeChild(input)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <button onClick={handleShare} className="p-1 rounded transition-all hover:opacity-80" style={{ color: copied ? tk.success : tk.foregroundMuted }} title={copied ? t('settings', 'layoutShareCopied') : t('settings', 'layoutShareCopy')}>
      {copied ? <Check size={10} /> : <Link2 size={10} />}
    </button>
  )
}

// ===== Layouts Tab =====
export function LayoutsTab({ tk }: { tk: ThemeTokens }) {
  const { t } = useI18n()
  const isZh = useI18n().locale === 'zh'
  const dnd = usePanelDnD()
  const [newLayoutName, setNewLayoutName] = useState('')
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [importJSON, setImportJSON] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const savedLayouts = dnd.listLayouts().filter((l: LayoutSnapshot) => l.name !== '__autosave__')
  const syncState = dnd.getSyncState()
  const unresolvedConflicts = syncState.conflicts.filter((c: LayoutSyncConflict) => !c.resolved)

  const handleSave = () => { if (newLayoutName.trim()) { dnd.saveLayout(newLayoutName.trim()); setNewLayoutName('') } }
  const handleCloudSync = async () => { setCloudSyncing(true); await dnd.syncAllToCloud(); setCloudSyncing(false) }
  const handleRename = (id: string) => { if (renameValue.trim()) { dnd.renameLayout(id, renameValue.trim()); setRenamingId(null); setRenameValue('') } }

  const handleImport = () => {
    if (!importJSON.trim()) return
    setImportError(null); setImportSuccess(null)
    const singleResult = dnd.importLayoutJSON(importJSON)
    if (singleResult.success) { setImportJSON(''); setImportSuccess(isZh ? `已导入: ${singleResult.layout?.name}` : `Imported: ${singleResult.layout?.name}`); return }
    const batchResult = dnd.importAllLayoutsJSON(importJSON)
    if (batchResult.success && batchResult.imported > 0) { setImportJSON(''); setImportSuccess(isZh ? `已导入 ${batchResult.imported} 个布局` : `Imported ${batchResult.imported} layout(s)`); return }
    setImportError(singleResult.error || batchResult.error || t('settings', 'layoutImportFailed'))
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        setImportJSON(result)
        setTimeout(() => {
          setImportError(null); setImportSuccess(null)
          const singleResult = dnd.importLayoutJSON(result)
          if (singleResult.success) { setImportJSON(''); setImportSuccess(isZh ? `已导入: ${singleResult.layout?.name}` : `Imported: ${singleResult.layout?.name}`); return }
          const batchResult = dnd.importAllLayoutsJSON(result)
          if (batchResult.success && batchResult.imported > 0) { setImportJSON(''); setImportSuccess(isZh ? `已导入 ${batchResult.imported} 个布局` : `Imported ${batchResult.imported} layout(s)`); return }
          setImportError(singleResult.error || batchResult.error || t('settings', 'layoutImportFailed'))
        }, 50)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExportAll = () => {
    const json = dnd.exportAllLayoutsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `yyc3-layouts-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url)
  }

  const handleExportSingle = (layoutId: string) => {
    const json = dnd.exportLayoutJSON(layoutId)
    if (!json) return
    try {
      const parsed = JSON.parse(json)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `yyc3-layout-${(parsed.name || 'layout').replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'layoutManager')}</label>
        <div className="flex gap-2">
          <button onClick={handleCloudSync} disabled={cloudSyncing} className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}`, opacity: cloudSyncing ? 0.5 : 1 }}>
            <Cloud size={9} className={cloudSyncing ? 'animate-spin' : ''} /> {cloudSyncing ? t('ide', 'syncing') : t('ide', 'syncCloud')}
          </button>
          <button onClick={handleExportAll} disabled={savedLayouts.length === 0} className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}`, opacity: savedLayouts.length === 0 ? 0.4 : 1 }}>
            <Download size={9} /> {t('settings', 'layoutExportAll')}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input type="text" value={newLayoutName} onChange={(e) => setNewLayoutName(e.target.value)} placeholder={t('settings', 'layoutNamePlaceholder')} className="flex-1 px-3 py-1.5 rounded outline-none" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }} />
        <button onClick={handleSave} disabled={!newLayoutName.trim()} className="flex items-center gap-1 px-3 py-1.5 rounded transition-all" style={{ background: newLayoutName.trim() ? tk.primary : tk.borderDim, color: newLayoutName.trim() ? '#fff' : tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '10px', opacity: newLayoutName.trim() ? 1 : 0.5 }}>
          <Save size={10} /> {t('ide', 'save')}
        </button>
      </div>

      {syncState.lastCloudSyncTime && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
          <Cloud size={10} color={tk.primary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{t('settings', 'layoutLastSync')} {new Date(syncState.lastCloudSyncTime).toLocaleString()}</span>
        </div>
      )}

      {unresolvedConflicts.length > 0 && (
        <div>
          <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.error, letterSpacing: '1px' }}>
            <AlertTriangle size={10} style={{ display: 'inline', marginRight: 4 }} />
            {isZh ? `${unresolvedConflicts.length} 个同步冲突` : `${unresolvedConflicts.length} sync conflict(s)`}
          </label>
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.error}30` }}>
            {unresolvedConflicts.map((conflict: LayoutSyncConflict) => (
              <div key={conflict.layoutId} className="px-4 py-2.5" style={{ borderBottom: `1px solid ${tk.error}15`, background: `${tk.error}05` }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{conflict.localVersion.name}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => dnd.resolveConflict(conflict.layoutId, 'local')} className="px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}44` }}>{t('settings', 'layoutKeepLocal')}</button>
                    <button onClick={() => dnd.resolveConflict(conflict.layoutId, 'cloud')} className="px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.warning, border: `1px solid ${tk.warning}44` }}>{t('settings', 'layoutUseCloud')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'layoutSaved')} ({savedLayouts.length})</label>
        {savedLayouts.length === 0 ? (
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 8 }}>{t('ide', 'noSavedLayouts')}</p>
        ) : (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
            {savedLayouts.map((layout: LayoutSnapshot, i: number) => (
              <div key={layout.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < savedLayouts.length - 1 ? `1px solid ${tk.borderDim}` : 'none', background: i % 2 === 0 ? 'transparent' : tk.primaryGlow }}>
                <div className="flex-1 min-w-0">
                  {renamingId === layout.id ? (
                    <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRename(layout.id); if (e.key === 'Escape') setRenamingId(null) }} onBlur={() => handleRename(layout.id)} autoFocus className="w-full px-1 py-0.5 rounded outline-none" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.primary}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <LayoutThumbnail slots={layout.slots} tk={tk} windowCount={layout.windows.length} />
                      <div>
                        <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{layout.name}</span>
                        <div className="flex gap-2 mt-0.5">
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{t('settings', 'layoutSlots')} {layout.slots.left}/{layout.slots.center}/{layout.slots.right}</span>
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{new Date(layout.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button onClick={() => dnd.loadLayout(layout.id)} className="px-2 py-0.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
                    <FolderOpen size={9} style={{ display: 'inline', marginRight: 3 }} /> {t('settings', 'layoutLoad')}
                  </button>
                  <button onClick={() => { setRenamingId(layout.id); setRenameValue(layout.name) }} className="p-1 rounded hover:opacity-80" style={{ color: tk.foregroundMuted }}><Edit3 size={10} /></button>
                  <button onClick={() => dnd.overwriteLayout(layout.id)} className="p-1 rounded hover:opacity-80" style={{ color: tk.foregroundMuted }} title={t('settings', 'layoutOverwrite')}><RefreshCw size={10} /></button>
                  <button onClick={() => dnd.deleteLayout(layout.id)} className="p-1 rounded hover:opacity-80" style={{ color: tk.foregroundMuted }}><Trash2 size={10} /></button>
                  <button onClick={() => handleExportSingle(layout.id)} className="p-1 rounded hover:opacity-80" style={{ color: tk.foregroundMuted }}><Download size={10} /></button>
                  <ShareButton layoutId={layout.id} tk={tk} dnd={dnd} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'layoutImport')}</label>
        <div className="flex items-center gap-2">
          <input type="text" value={importJSON} onChange={(e) => setImportJSON(e.target.value)} placeholder={t('settings', 'layoutImportPlaceholder')} className="flex-1 px-3 py-1.5 rounded outline-none" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} />
          <button onClick={handleImport} disabled={!importJSON.trim()} className="flex items-center gap-1 px-3 py-1.5 rounded transition-all" style={{ background: importJSON.trim() ? tk.primary : tk.borderDim, color: importJSON.trim() ? '#fff' : tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '10px', opacity: importJSON.trim() ? 1 : 0.5 }}>
            <GitMerge size={10} /> {t('ide', 'import')}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 rounded transition-all" style={{ background: tk.primary, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px' }}>
            <FolderOpen size={10} /> {t('ide', 'importFile')}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
        </div>
        {importError && <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error, marginTop: 2 }}>{importError}</p>}
        {importSuccess && <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success, marginTop: 2 }}>{importSuccess}</p>}
      </div>
    </div>
  )
}