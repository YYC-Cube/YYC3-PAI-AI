/**
 * @file SettingsPanel.tsx
 * @description YYC3 unified settings panel — shell with sidebar + tab routing to sub-components
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-13
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 */

import {
  BookOpen,
  Bot,
  Check, Code2,
  Cpu,
  Download,
  ExternalLink,
  Globe,
  Info,
  Keyboard,
  LayoutGrid,
  MessageSquare,
  Monitor,
  Palette,
  Plug,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/context'
import { useEditorPrefs } from '../store/editor-prefs-store'
import { useMCPStore } from '../store/mcp-store'
import { useModelStore } from '../store/model-store'
import { settingsActions, useSettingsStore } from '../store/settings-store'
import { useShortcutStore } from '../store/shortcut-store'
import { BLUR, THEMES, type ThemeId, Z_INDEX, useThemeStore } from '../store/theme-store'
import logoImg from '/yyc3-icons/macOS/64.png'

// Sub-components
import { AudioPanel } from './audio/AudioPanel'
import { AgentsTab, ContextTab, ConversationTab, MCPTab, RulesSkillsTab } from './settings/AIServiceTabs'
import { SectionLabel, ToggleRow } from './settings/SettingsShared'
import { AccountTab, LayoutsTab, ShortcutsTab } from './settings/WorkspaceTabs'

type SettingsTab =
  | 'general' | 'editor' | 'appearance' | 'shortcuts' | 'layouts'
  | 'account' | 'agents' | 'mcp' | 'models' | 'context' | 'conversation' | 'rules-skills'
  | 'audio' | 'about'

interface SettingsPanelProps {
  visible: boolean
  onClose: () => void
}

// Tab groups for sidebar
const TAB_GROUPS = [
  {
    label: { zh: '基础设置', en: 'Basic' },
    tabs: [
      { key: 'general' as SettingsTab, icon: Settings, labelKey: 'tabGeneral' },
      { key: 'editor' as SettingsTab, icon: Code2, labelKey: 'tabEditor' },
      { key: 'appearance' as SettingsTab, icon: Palette, labelKey: 'tabAppearance' },
      { key: 'shortcuts' as SettingsTab, icon: Keyboard, labelKey: 'tabShortcuts' },
      { key: 'layouts' as SettingsTab, icon: LayoutGrid, labelKey: 'tabLayouts' },
    ],
  },
  {
    label: { zh: 'AI 服务', en: 'AI & Services' },
    tabs: [
      { key: 'agents' as SettingsTab, icon: Bot, labelKey: 'tabAgents' },
      { key: 'mcp' as SettingsTab, icon: Plug, labelKey: 'tabMCP' },
      { key: 'models' as SettingsTab, icon: Cpu, labelKey: 'tabModels' },
      { key: 'context' as SettingsTab, icon: BookOpen, labelKey: 'tabContext' },
      { key: 'conversation' as SettingsTab, icon: MessageSquare, labelKey: 'tabConversation' },
      { key: 'rules-skills' as SettingsTab, icon: Shield, labelKey: 'tabRulesSkills' },
    ],
  },
  {
    label: { zh: '扩展功能', en: 'Other' },
    tabs: [
      { key: 'audio' as SettingsTab, icon: Sparkles, labelKey: 'tabAudio' },
      { key: 'account' as SettingsTab, icon: User, labelKey: 'tabAccount' },
      { key: 'about' as SettingsTab, icon: Info, labelKey: 'tabAbout' },
    ],
  },
]

export function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  const { t, locale, setLocale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk, themeId, setTheme, autoDetect, setAutoDetect, setEffect, enableGlitch, enableScanlines, enableCRT, enableGlow } = useThemeStore()
  const [tab, setTab] = useState<SettingsTab>('general')
  const [searchQuery, setSearchQuery] = useState('')

  const { prefs: editorPrefs, set: setEditorPref } = useEditorPrefs()

  const { shortcuts, set: setShortcut } = useShortcutStore()

  useSettingsStore()

  useMCPStore()

  const { openModelSettings } = useModelStore()

  type SearchHit = { tab: SettingsTab; label: string; matchContext?: string }

  const searchResults = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const hits: SearchHit[] = []

    for (const g of TAB_GROUPS) for (const td of g.tabs) {
      if (t('settings', td.labelKey).toLowerCase().includes(q))
        hits.push({ tab: td.key, label: t('settings', td.labelKey) })
    }

    const items: { tab: SettingsTab; keys: string[] }[] = [
      { tab: 'general', keys: ['language', 'autoDetectTheme', 'defaultMode'] },
      { tab: 'editor', keys: ['fontSize', 'tabSize', 'wordWrap', 'minimap', 'lineNumbers', 'bracketPairs', 'autoSave'] },
      { tab: 'appearance', keys: ['themeLabel', 'effectsLabel', 'glitchEffect', 'scanlineEffect', 'crtEffect', 'glowEffect'] },
      { tab: 'agents', keys: ['agentsTitle', 'agentAdd', 'agentsBuiltIn', 'agentsCustom', 'agentSystemPrompt', 'agentTemp', 'agentMaxTokens', 'agentModel'] },
      { tab: 'mcp', keys: ['mcpTitle', 'mcpGlobalEnable', 'mcpServers', 'mcpTools', 'mcpHealthCheck'] },
      { tab: 'models', keys: ['modelsTitle', 'modelsOpenManager', 'modelsConfigured'] },
      { tab: 'context', keys: ['contextTitle', 'contextIndex', 'contextIgnoreRules', 'contextDocs'] },
      { tab: 'conversation', keys: ['convTitle', 'convTodoList', 'convAutoFix', 'convCodeReview', 'convAutoRunMCP', 'convCmdMode', 'convWhitelist', 'convVolume'] },
      { tab: 'rules-skills', keys: ['rsTitle', 'rsRules', 'rsSkills', 'rsAddRule', 'rsAddSkill'] },
      { tab: 'account', keys: ['accountTitle', 'username', 'email', 'bio'] },
      { tab: 'about', keys: ['version', 'team', 'license', 'brandSlogan', 'importExport', 'resetAll'] },
    ]
    for (const { tab: tk2, keys } of items) for (const key of keys) {
      const text = t('settings', key).toLowerCase()
      if (text.includes(q)) {
        const ctx = TAB_GROUPS.flatMap(g => g.tabs).find(td => td.key === tk2)?.labelKey
        hits.push({ tab: tk2, label: t('settings', key), matchContext: ctx ? t('settings', ctx) : tk2 })
      }
    }

    const deepHits = settingsActions.deepSearch(q)
    for (const dh of deepHits) hits.push({ tab: dh.tab as SettingsTab, label: dh.label, matchContext: dh.value })

    const seen = new Set<string>()
    return hits.filter(h => { const k = `${h.tab}:${h.label}`; if (seen.has(k)) return false; seen.add(k); return true })
  }, [searchQuery, t])

  const filteredTabs = searchQuery.trim()
    ? TAB_GROUPS.map(g => ({
      ...g,
      tabs: g.tabs.filter(td => {
        const label = t('settings', td.labelKey).toLowerCase()
        return label.includes(searchQuery.toLowerCase()) ||
          searchResults.some(sr => sr.tab === td.key)
      }),
    })).filter(g => g.tabs.length > 0)
    : TAB_GROUPS

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.topModal, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex overflow-hidden"
        style={{
          width: 860, height: 600,
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.25s ease-out',
        }}
      >
        {/* Sidebar tabs */}
        <div className="w-48 flex flex-col border-r shrink-0" style={{ borderColor: tk.border, background: isCyberpunk ? tk.primaryGlow : tk.backgroundAlt }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: tk.border }}>
            <div className="flex items-center gap-2">
              <Settings size={16} color={tk.primary} />
              <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1px', margin: 0 }}>{t('settings', 'title')}</h2>
            </div>
            <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px', marginTop: 4 }}>{t('settings', 'subtitle')}</p>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}` }}>
              <Search size={11} color={tk.foregroundMuted} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('settings', 'searchPlaceholder')} className="flex-1 bg-transparent outline-none" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }} />
              {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="hover:opacity-80"><X size={9} color={tk.foregroundMuted} /></button>}
            </div>
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="px-1 pb-1 max-h-32 overflow-y-auto neon-scrollbar">
                {searchResults.slice(0, 8).map((hit, i) => (
                  <button key={`${hit.tab}-${hit.label}-${i}`} onClick={() => { setTab(hit.tab); setSearchQuery('') }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all hover:opacity-80" style={{ background: tab === hit.tab ? tk.primaryGlow : 'transparent' }}>
                    <Search size={8} color={tk.foregroundMuted} />
                    <div className="min-w-0 flex-1">
                      <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }} className="truncate">{hit.label}</p>
                      {hit.matchContext && <p style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }} className="truncate">{hit.matchContext}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="px-3 pb-2"><p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{t('settings', 'searchNoResults')}</p></div>
            )}
          </div>

          {/* Tab list */}
          <div className="flex-1 overflow-y-auto neon-scrollbar py-1">
            {filteredTabs.map((group) => (
              <div key={group.label.en}>
                <div className="px-4 pt-2.5 pb-1">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{isZh ? group.label.zh : group.label.en}</span>
                </div>
                {group.tabs.map(({ key, icon: Icon, labelKey }) => {
                  const isActive = tab === key
                  if (key === 'models') {
                    return (
                      <button key={key} data-settings-tab={key} onClick={() => { openModelSettings(); onClose(); }} className="w-full flex items-center gap-2.5 px-4 py-2 transition-all text-left" style={{ background: isActive ? tk.primaryGlow : 'transparent', borderLeft: isActive ? `2px solid ${tk.primary}` : `2px solid transparent`, color: isActive ? tk.primary : tk.foregroundMuted }}>
                        <Icon size={13} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', letterSpacing: '0.5px' }}>{t('settings', labelKey)}</span>
                        <ExternalLink size={9} className="ml-auto opacity-50" />
                      </button>
                    )
                  }
                  return (
                    <button key={key} data-settings-tab={key} onClick={() => setTab(key)} className="w-full flex items-center gap-2.5 px-4 py-2 transition-all text-left" style={{ background: isActive ? tk.primaryGlow : 'transparent', borderLeft: isActive ? `2px solid ${tk.primary}` : `2px solid transparent`, color: isActive ? tk.primary : tk.foregroundMuted }}>
                      <Icon size={13} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', letterSpacing: '0.5px' }}>{t('settings', labelKey)}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t" style={{ borderColor: tk.border }}>
            <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px' }}>YYC3 AI Code v4.8.2</p>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-end px-4 py-2">
            <button onClick={onClose} aria-label="Close settings" className="p-1 rounded hover:opacity-80 transition-all"><X size={16} color={tk.foregroundMuted} /></button>
          </div>

          <div className="flex-1 overflow-y-auto neon-scrollbar px-6 pb-6">
            {/* === General === */}
            {tab === 'general' && (
              <div className="space-y-5">
                <div>
                  <SectionLabel text={t('settings', 'language')} tk={tk} />
                  <div className="flex gap-2 mt-2">
                    {(['zh', 'en'] as const).map((lang) => (
                      <button key={lang} onClick={() => setLocale(lang)} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: locale === lang ? tk.primaryGlow : 'transparent', border: `1px solid ${locale === lang ? tk.primary : tk.border}`, color: locale === lang ? tk.primary : tk.foregroundMuted, fontFamily: tk.fontBody, fontSize: '12px' }}>
                        <Globe size={12} />
                        {t('settings', lang === 'zh' ? 'langZh' : 'langEn')}
                        {locale === lang && <Check size={10} />}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow label={t('settings', 'autoDetectTheme')} desc={t('settings', 'autoDetectThemeDesc')} value={autoDetect} onChange={setAutoDetect} tk={tk} />
                <div>
                  <SectionLabel text={t('settings', 'defaultMode')} tk={tk} />
                  <div className="flex gap-2 mt-2">
                    {[
                      { id: 'fullscreen', icon: Monitor, label: t('settings', 'fullscreen') },
                      { id: 'ide', icon: Code2, label: 'IDE' },
                      { id: 'widget', icon: Sparkles, label: t('settings', 'widget') },
                    ].map(({ id, icon: Icon, label }) => (
                      <button key={id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all" style={{ background: 'transparent', border: `1px solid ${tk.border}`, color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '11px' }}>
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* === Editor === */}
            {tab === 'editor' && (
              <div className="space-y-4">
                <div>
                  <SectionLabel text={t('settings', 'fontSize')} tk={tk} />
                  <div className="flex items-center gap-3 mt-2">
                    <input type="range" min={10} max={24} step={1} value={editorPrefs.fontSize} onChange={(e) => setEditorPref('fontSize', Number(e.target.value))} aria-label={t('settings', 'fontSize')} className="flex-1" style={{ accentColor: tk.primary }} />
                    <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground, minWidth: 32, textAlign: 'right' }}>{editorPrefs.fontSize}px</span>
                  </div>
                </div>
                <div>
                  <SectionLabel text={t('settings', 'tabSize')} tk={tk} />
                  <div className="flex gap-2 mt-2">
                    {[2, 4, 8].map((size) => (
                      <button key={size} onClick={() => setEditorPref('tabSize', size)} className="px-3 py-1.5 rounded-lg transition-all" style={{ background: editorPrefs.tabSize === size ? tk.primaryGlow : 'transparent', border: `1px solid ${editorPrefs.tabSize === size ? tk.primary : tk.border}`, color: editorPrefs.tabSize === size ? tk.primary : tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '11px' }}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow label={t('settings', 'wordWrap')} value={editorPrefs.wordWrap} onChange={(v) => setEditorPref('wordWrap', v)} tk={tk} />
                <ToggleRow label={t('settings', 'minimap')} value={editorPrefs.minimap} onChange={(v) => setEditorPref('minimap', v)} tk={tk} />
                <ToggleRow label={t('settings', 'lineNumbers')} value={editorPrefs.lineNumbers} onChange={(v) => setEditorPref('lineNumbers', v)} tk={tk} />
                <ToggleRow label={t('settings', 'bracketPairs')} value={editorPrefs.bracketPairs} onChange={(v) => setEditorPref('bracketPairs', v)} tk={tk} />
                <ToggleRow label={t('settings', 'autoSave')} value={editorPrefs.autoSave} onChange={(v) => setEditorPref('autoSave', v)} tk={tk} />
              </div>
            )}

            {/* === Appearance === */}
            {tab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <SectionLabel text={t('settings', 'themeLabel')} tk={tk} />
                  <div className="flex gap-3 mt-2">
                    {(['cyberpunk', 'clean'] as ThemeId[]).map((id) => {
                      const theme = THEMES[id]
                      const isActive = themeId === id
                      return (
                        <button key={id} onClick={() => setTheme(id)} className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all" style={{ background: isActive ? tk.primaryGlow : 'transparent', border: `1.5px solid ${isActive ? tk.primary : tk.border}` }}>
                          <div className="flex flex-col gap-1">
                            <div className="w-5 h-5 rounded-full" style={{ background: theme.primary }} />
                            <div className="w-5 h-5 rounded-full" style={{ background: theme.background, border: `1px solid ${theme.border}` }} />
                          </div>
                          <div>
                            <p style={{ fontFamily: tk.fontBody, fontSize: '13px', color: isActive ? tk.primary : tk.foreground }}>{theme.name[locale]}</p>
                            <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{id === 'cyberpunk' ? 'Neon / Dark' : 'Light / Minimal'}</p>
                          </div>
                          {isActive && <Check size={14} color={tk.primary} className="ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <SectionLabel text={t('settings', 'effectsLabel')} tk={tk} />
                  <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginTop: 2, marginBottom: 8 }}>
                    {isCyberpunk ? t('settings', 'effectsCyberpunkCtrl') : t('settings', 'effectsCyberpunkOnly')}
                  </p>
                  <div style={{ opacity: isCyberpunk ? 1 : 0.4, pointerEvents: isCyberpunk ? 'auto' : 'none' }}>
                    <ToggleRow label={t('settings', 'glitchEffect')} value={enableGlitch} onChange={(v) => setEffect('enableGlitch', v)} tk={tk} />
                    <ToggleRow label={t('settings', 'scanlineEffect')} value={enableScanlines} onChange={(v) => setEffect('enableScanlines', v)} tk={tk} />
                    <ToggleRow label={t('settings', 'crtEffect')} value={enableCRT} onChange={(v) => setEffect('enableCRT', v)} tk={tk} />
                    <ToggleRow label={t('settings', 'glowEffect')} value={enableGlow} onChange={(v) => setEffect('enableGlow', v)} tk={tk} />
                  </div>
                </div>
              </div>
            )}

            {/* === Extracted sub-tabs === */}
            {tab === 'shortcuts' && <ShortcutsTab tk={tk} shortcuts={shortcuts} setShortcut={setShortcut} />}
            {tab === 'layouts' && <LayoutsTab tk={tk} />}
            {tab === 'account' && <AccountTab tk={tk} />}
            {tab === 'agents' && <AgentsTab tk={tk} />}
            {tab === 'mcp' && <MCPTab tk={tk} />}
            {tab === 'models' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'modelsTitle')}</label>
                  <button onClick={() => { openModelSettings(); onClose(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: '#fff', background: tk.primary }}>
                    <ExternalLink size={11} /> {t('settings', 'modelsOpenManager')}
                  </button>
                </div>
                <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{t('settings', 'modelsManageHint')}</p>
                <div className="rounded-lg p-8 text-center" style={{ border: `1px dashed ${tk.borderDim}`, background: tk.primaryGlow }}>
                  <Cpu size={32} color={tk.primary} className="mx-auto mb-3 opacity-50" />
                  <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>{t('settings', 'modelsFullManager')}</p>
                  <button onClick={() => { openModelSettings(); onClose(); }} className="mt-4 flex items-center gap-1.5 px-4 py-2 mx-auto rounded transition-all hover:opacity-90" style={{ fontFamily: tk.fontMono, fontSize: '11px', color: '#fff', background: tk.primary }}>
                    <ExternalLink size={12} /> {t('settings', 'modelsOpenManager')}
                  </button>
                </div>
              </div>
            )}
            {tab === 'context' && <ContextTab tk={tk} />}
            {tab === 'conversation' && <ConversationTab tk={tk} />}
            {tab === 'rules-skills' && <RulesSkillsTab tk={tk} />}

            {/* === Audio === */}
            {tab === 'audio' && <AudioPanel className="mt-4" />}

            {/* === About === */}
            {tab === 'about' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <img src={logoImg} alt="YYC3" className="w-14 h-14 rounded-xl" style={{ border: `1px solid ${tk.border}` }} />
                  <div>
                    <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '18px', color: tk.primary, letterSpacing: '2px', margin: 0 }}>YYC3 AI Code</h2>
                    <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 2 }}>{t('settings', 'brandSlogan')}</p>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
                  {[
                    { label: t('settings', 'version'), value: 'v4.8.2' },
                    { label: t('settings', 'team'), value: 'YanYuCloudCube Team' },
                    { label: t('settings', 'license'), value: 'MIT' },
                    { label: 'React', value: '18.x' },
                    { label: 'TypeScript', value: '5.x' },
                    { label: 'Tailwind CSS', value: '4.x' },
                    { label: 'Monaco Editor', value: '0.45.x' },
                    { label: 'Stores', value: '20' },
                  ].map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < 7 ? `1px solid ${tk.borderDim}` : 'none', background: i % 2 === 0 ? 'transparent' : tk.primaryGlow }}>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>{row.label}</span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.primary }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* 双站互通：姊妹产品深链（YYC3-Pai-Platform） */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ border: `1px dashed ${tk.secondary}44`, background: `${tk.secondary}0a` }}>
                  <div className="flex-1">
                    <div style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>YYC3-Pai Platform</div>
                    <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginTop: 2 }}>多用户 / 多 Agent 自托管平台（Python）· 姊妹仓 YYC3-Pai-Platform</div>
                  </div>
                  <a href="https://pai-ai.yyc3.vip" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.secondary, border: `1px solid ${tk.secondary}44`, textDecoration: 'none' }}>
                    <ExternalLink size={11} /> 控制台
                  </a>
                </div>
                <div className="border-t pt-4" style={{ borderColor: tk.border }}>
                  <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'importExport')}</label>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { const config = settingsActions.exportConfig(); const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `yyc3-settings-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, border: `1px solid ${tk.primary}44` }}>
                      <Download size={11} /> {t('settings', 'exportConfig')}
                    </button>
                    <button onClick={() => { if (confirm(t('settings', 'resetConfirm'))) { settingsActions.resetSettings() } }} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.error, border: `1px solid ${tk.error}44` }}>
                      <RotateCcw size={11} /> {t('settings', 'resetAll')}
                    </button>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <p style={{ fontFamily: tk.fontDisplay, fontSize: '10px', color: tk.primary, letterSpacing: '2px', opacity: 0.5 }}>YanYuCloudCube</p>
                  <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px', marginTop: 4 }}>
                    {isZh ? '言启象限 | 语枢未来' : 'Words Initiate Quadrants, Language Serves as Core for Future'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
