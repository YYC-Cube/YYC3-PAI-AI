/**
 * @file AIServiceTabs.tsx
 * @author YanYuCloudCube Team <admin@0379.email>
 * @description Settings sub-tabs for AI & Services: Agents, MCP, Models, Context, Conversation, Rules & Skills
 * @version v4.8.2
 */

import { useState } from 'react'
import {
  Bot, Plug, Cpu, BookOpen, Shield, Zap,
  ChevronDown, Plus, Trash2, X, RefreshCw,
  ExternalLink, Play, Pause, Terminal, Volume2,
} from 'lucide-react'
import { useI18n } from '../../i18n/context'
import { useSettingsStore, settingsActions, type AgentConfig } from '../../store/settings-store'
import { useMCPStore, mcpStoreActions } from '../../store/mcp-store'
import type { SettingsTabProps } from './SettingsShared'
import { ToggleRow } from './SettingsShared'

// ===== Agents Tab =====
export function AgentsTab({ tk }: SettingsTabProps) {
  const { t } = useI18n()
  const settings = useSettingsStore()
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const builtIn = settings.agents.filter(a => a.isBuiltIn)
  const custom = settings.agents.filter(a => a.isCustom)

  const handleAdd = () => {
    if (!newName.trim()) return
    settingsActions.addAgent({
      name: newName.trim(),
      description: '',
      systemPrompt: newPrompt.trim() || 'You are a helpful assistant.',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4096,
      isBuiltIn: false,
      isCustom: true,
      enabled: true,
    })
    setNewName('')
    setNewPrompt('')
    setAddMode(false)
  }

  function AgentCard({ agent }: { agent: AgentConfig }) {
    const expanded = expandedId === agent.id
    return (
      <div
        className="rounded-lg overflow-hidden transition-all"
        style={{ border: `1px solid ${agent.enabled ? tk.primary + '40' : tk.borderDim}`, background: expanded ? tk.primaryGlow : 'transparent' }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer" onClick={() => setExpandedId(expanded ? null : agent.id)}>
          <div className="flex items-center gap-2">
            <Bot size={14} color={agent.enabled ? tk.primary : tk.foregroundMuted} />
            <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: agent.enabled ? tk.foreground : tk.foregroundMuted }}>
              {agent.name}
            </span>
            {agent.isBuiltIn && (
              <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.primary}30` }}>
                {t('settings', 'builtIn')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); settingsActions.toggleAgent(agent.id) }}>
              <div className="w-8 h-4 rounded-full transition-all" style={{ background: agent.enabled ? tk.primary : tk.inputBorder }}>
                <div className="w-3 h-3 rounded-full transition-all" style={{ background: tk.background, transform: `translateX(${agent.enabled ? 17 : 2}px) translateY(2px)` }} />
              </div>
            </button>
            {agent.isCustom && (
              <button
                onClick={(e) => { e.stopPropagation(); settingsActions.removeAgent(agent.id) }}
                className="p-0.5 rounded hover:opacity-80"
                style={{ color: tk.foregroundMuted }}
              >
                <Trash2 size={11} />
              </button>
            )}
            <ChevronDown size={12} color={tk.foregroundMuted} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>
        {expanded && (
          <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: tk.borderDim }}>
            {agent.description && (
              <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 8 }}>
                {agent.description}
              </p>
            )}
            <div className="flex gap-4 mt-2">
              <div>
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{t('settings', 'agentModel')}</span>
                <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>{agent.model}</p>
              </div>
              <div>
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{t('settings', 'agentTemp')}</span>
                <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>{agent.temperature}</p>
              </div>
              <div>
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{t('settings', 'agentMaxTokens')}</span>
                <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>{agent.maxTokens}</p>
              </div>
            </div>
            {agent.isCustom && (
              <div className="mt-2">
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{t('settings', 'agentSystemPrompt')}</span>
                <textarea
                  value={agent.systemPrompt}
                  onChange={(e) => settingsActions.updateAgent(agent.id, { systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-2 py-1.5 rounded outline-none resize-none"
                  style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '10px' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
          {t('settings', 'agentsTitle')}
        </label>
        <button
          onClick={() => setAddMode(!addMode)}
          className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
          style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}44` }}
        >
          <Plus size={10} /> {t('settings', 'agentAdd')}
        </button>
      </div>

      {addMode && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: tk.primaryGlow, border: `1px solid ${tk.primary}40` }}>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('settings', 'agentNamePlaceholder')} className="w-full px-3 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} />
          <textarea value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder={t('settings', 'systemPromptPlaceholder')} rows={3} className="w-full px-3 py-1.5 rounded outline-none resize-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1 rounded" style={{ background: tk.primary, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px' }}>{t('settings', 'create')}</button>
            <button onClick={() => setAddMode(false)} className="px-3 py-1 rounded" style={{ border: `1px solid ${tk.borderDim}`, color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '10px' }}>{t('settings', 'cancel')}</button>
          </div>
        </div>
      )}

      <div>
        <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: 6 }}>{t('settings', 'agentsBuiltIn')} ({builtIn.length})</p>
        <div className="space-y-2">
          {builtIn.map(a => <AgentCard key={a.id} agent={a} />)}
        </div>
      </div>

      <div>
        <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: 6 }}>{t('settings', 'agentsCustom')} ({custom.length})</p>
        {custom.length === 0 ? (
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{t('settings', 'agentEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {custom.map(a => <AgentCard key={a.id} agent={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== MCP Tab =====
export function MCPTab({ tk }: SettingsTabProps) {
  const { t, locale } = useI18n()
  const isZh = locale === 'zh'
  const mcpState = useMCPStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusColors: Record<string, string> = { online: tk.success, checking: tk.warning, offline: tk.foregroundMuted, error: tk.error, unknown: tk.foregroundMuted }
  const statusLabels: Record<string, { zh: string; en: string }> = { online: { zh: '在线', en: 'Online' }, checking: { zh: '检测中', en: 'Checking' }, offline: { zh: '离线', en: 'Offline' }, error: { zh: '错误', en: 'Error' }, unknown: { zh: '未知', en: 'Unknown' } }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'mcpTitle')}</label>
        <button onClick={() => mcpStoreActions.toggleGlobal()} className="flex items-center gap-1.5 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: mcpState.globalEnabled ? tk.success : tk.foregroundMuted, border: `1px solid ${mcpState.globalEnabled ? tk.success + '44' : tk.borderDim}` }}>
          {mcpState.globalEnabled ? <Play size={9} /> : <Pause size={9} />}
          {t('settings', 'mcpGlobalEnable')}
        </button>
      </div>
      <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{t('settings', 'mcpGlobalEnableDesc')}</p>

      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'mcpServers')} ({mcpState.servers.length})</label>
        <div className="mt-2 space-y-2">
          {mcpState.servers.length === 0 ? (
            <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{t('settings', 'mcpEmpty')}</p>
          ) : (
            mcpState.servers.map(server => {
              const expanded = expandedId === server.id
              return (
                <div key={server.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${server.enabled ? (server.color || tk.primary) + '40' : tk.borderDim}` }}>
                  <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer" onClick={() => setExpandedId(expanded ? null : server.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: statusColors[server.status] || tk.foregroundMuted }} />
                      <Plug size={12} color={server.color || tk.primary} />
                      <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{server.name}</span>
                      <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{server.transport}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: statusColors[server.status] }}>{isZh ? statusLabels[server.status]?.zh : statusLabels[server.status]?.en}</span>
                      <button onClick={(e) => { e.stopPropagation(); mcpStoreActions.toggleServer(server.id) }}>
                        <div className="w-8 h-4 rounded-full transition-all" style={{ background: server.enabled ? tk.primary : tk.inputBorder }}>
                          <div className="w-3 h-3 rounded-full transition-all" style={{ background: tk.background, transform: `translateX(${server.enabled ? 17 : 2}px) translateY(2px)` }} />
                        </div>
                      </button>
                      <ChevronDown size={12} color={tk.foregroundMuted} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                  {expanded && (
                    <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: tk.borderDim }}>
                      <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 8 }}>{server.description}</p>
                      {server.tools.length > 0 && (
                        <div>
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary }}>{t('settings', 'mcpTools')} ({server.tools.length})</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {server.tools.map(tool => (
                              <span key={tool.name} className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: server.color || tk.primary, background: (server.color || tk.primary) + '15', border: `1px solid ${(server.color || tk.primary)}30` }}>{tool.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {server.tags.length > 0 && (
                        <div className="flex gap-1">
                          {server.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => mcpStoreActions.checkServer(server.id)} className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}44` }}>
                          <RefreshCw size={9} /> {t('settings', 'mcpHealthCheck')}
                        </button>
                        <button onClick={() => mcpStoreActions.removeServer(server.id)} className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error, border: `1px solid ${tk.error}44` }}>
                          <Trash2 size={9} /> {t('settings', 'remove')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Models Tab =====
export function ModelsTab({ tk, openModelSettings, aiModels }: SettingsTabProps & { openModelSettings: (tab?: string) => void; aiModels: Array<{ id: string; name: string; provider: string; isActive: boolean }> }) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'modelsTitle')}</label>
        <button onClick={() => openModelSettings()} className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: '#fff', background: tk.primary }}>
          <ExternalLink size={11} /> {t('settings', 'modelsOpenManager')}
        </button>
      </div>
      <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{t('settings', 'modelsManageHint')}</p>
      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'modelsConfigured')} ({aiModels.length})</label>
        {aiModels.length === 0 ? (
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 8 }}>{t('settings', 'modelsEmpty')}</p>
        ) : (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
            {aiModels.map((model: { id: string; name: string; provider: string; isActive: boolean }, i: number) => (
              <div key={model.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < aiModels.length - 1 ? `1px solid ${tk.borderDim}` : 'none', background: i % 2 === 0 ? 'transparent' : tk.primaryGlow }}>
                <div className="flex items-center gap-2">
                  <Cpu size={12} color={model.isActive ? tk.primary : tk.foregroundMuted} />
                  <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{model.name}</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{model.provider}</span>
                </div>
                <div className="flex items-center gap-2">
                  {model.isActive && (
                    <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.success, background: `${tk.success}15`, border: `1px solid ${tk.success}30` }}>{t('settings', 'active')}</span>
                  )}
                  <div className="w-2 h-2 rounded-full" style={{ background: model.isActive ? tk.success : tk.foregroundMuted }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Context Tab =====
export function ContextTab({ tk }: SettingsTabProps) {
  const { t } = useI18n()
  const settings = useSettingsStore()
  const ctx = settings.context
  const [newIgnore, setNewIgnore] = useState('')
  const [newDocName, setNewDocName] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')

  const statusStyle: Record<string, { color: string; label: string }> = {
    idle: { color: tk.foregroundMuted, label: t('settings', 'contextStatusIdle') },
    indexing: { color: tk.warning, label: t('settings', 'contextStatusIndexing') },
    completed: { color: tk.success, label: t('settings', 'contextStatusCompleted') },
    error: { color: tk.error, label: t('settings', 'contextStatusError') },
  }

  return (
    <div className="space-y-5">
      <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'contextTitle')}</label>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: statusStyle[ctx.indexStatus]?.color }} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>{t('settings', 'contextIndex')}: {statusStyle[ctx.indexStatus]?.label}</span>
        </div>
        <button onClick={() => settingsActions.updateContext({ indexStatus: 'indexing' })} className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}44` }}>
          <RefreshCw size={9} /> {t('settings', 'contextReindex')}
        </button>
      </div>

      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'contextIgnoreRules')}</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ctx.ignoreRules.map(rule => (
            <span key={rule} className="flex items-center gap-1 px-2 py-1 rounded" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
              {rule}
              <button onClick={() => settingsActions.removeIgnoreRule(rule)} className="hover:opacity-80"><X size={8} color={tk.foregroundMuted} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input type="text" value={newIgnore} onChange={(e) => setNewIgnore(e.target.value)} placeholder={t('settings', 'ignoreRulePlaceholder')} className="flex-1 px-3 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} onKeyDown={(e) => { if (e.key === 'Enter' && newIgnore.trim()) { settingsActions.addIgnoreRule(newIgnore.trim()); setNewIgnore('') } }} />
          <button onClick={() => { if (newIgnore.trim()) { settingsActions.addIgnoreRule(newIgnore.trim()); setNewIgnore('') } }} className="px-3 py-1.5 rounded" style={{ background: tk.primary, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px', opacity: newIgnore.trim() ? 1 : 0.5 }}><Plus size={10} /></button>
        </div>
      </div>

      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'contextDocs')}</label>
        {ctx.documentSets.length === 0 ? (
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 8 }}>{t('settings', 'contextDocsEmpty')}</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {ctx.documentSets.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-3 py-2 rounded" style={{ border: `1px solid ${tk.borderDim}` }}>
                <div className="flex items-center gap-2">
                  <BookOpen size={11} color={doc.enabled ? tk.primary : tk.foregroundMuted} />
                  <span style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foreground }}>{doc.name}</span>
                  <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{doc.source}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => settingsActions.toggleDocumentSet(doc.id)}>
                    <div className="w-7 h-3.5 rounded-full" style={{ background: doc.enabled ? tk.primary : tk.inputBorder }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: tk.background, transform: `translateX(${doc.enabled ? 14 : 2}px) translateY(2px)` }} />
                    </div>
                  </button>
                  <button onClick={() => settingsActions.removeDocumentSet(doc.id)} className="hover:opacity-80"><Trash2 size={10} color={tk.foregroundMuted} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder={t('settings', 'docNamePlaceholder')} className="flex-1 px-2 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '10px' }} />
          <input type="text" value={newDocUrl} onChange={(e) => setNewDocUrl(e.target.value)} placeholder="URL" className="flex-1 px-2 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '10px' }} />
          <button onClick={() => { if (newDocName.trim()) { settingsActions.addDocumentSet({ name: newDocName.trim(), source: newDocUrl.trim() ? 'url' : 'local', url: newDocUrl.trim() || undefined, enabled: true }); setNewDocName(''); setNewDocUrl('') } }} className="px-2 py-1.5 rounded" style={{ background: tk.primary, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px' }}><Plus size={10} /></button>
        </div>
      </div>
    </div>
  )
}

// ===== Conversation Tab =====
export function ConversationTab({ tk }: SettingsTabProps) {
  const { t } = useI18n()
  const settings = useSettingsStore()
  const conv = settings.conversation
  const [newCmd, setNewCmd] = useState('')

  return (
    <div className="space-y-4">
      <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'convTitle')}</label>

      <ToggleRow label={t('settings', 'convTodoList')} desc={t('settings', 'convTodoListDesc')} value={conv.useTodoList} onChange={(v) => settingsActions.updateConversation({ useTodoList: v })} tk={tk} />
      <ToggleRow label={t('settings', 'convAutoCollapse')} value={conv.autoCollapseNodes} onChange={(v) => settingsActions.updateConversation({ autoCollapseNodes: v })} tk={tk} />
      <ToggleRow label={t('settings', 'convAutoFix')} desc={t('settings', 'convAutoFixDesc')} value={conv.autoFixCodeIssues} onChange={(v) => settingsActions.updateConversation({ autoFixCodeIssues: v })} tk={tk} />
      <ToggleRow label={t('settings', 'convProactiveQ')} desc={t('settings', 'convProactiveQDesc')} value={conv.agentProactiveQuestion} onChange={(v) => settingsActions.updateConversation({ agentProactiveQuestion: v })} tk={tk} />

      <div className="border-t pt-3" style={{ borderColor: tk.border }}>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'convCodeReview')}</label>
        <div className="flex gap-2 mt-2">
          {([
            { v: 'none' as const, label: t('settings', 'convReviewNone') },
            { v: 'all' as const, label: t('settings', 'convReviewAll') },
            { v: 'changed' as const, label: t('settings', 'convReviewChanged') },
          ]).map(({ v, label }) => (
            <button key={v} onClick={() => settingsActions.updateConversation({ codeReviewScope: v })} className="px-3 py-1.5 rounded-lg transition-all" style={{ background: conv.codeReviewScope === v ? tk.primaryGlow : 'transparent', border: `1px solid ${conv.codeReviewScope === v ? tk.primary : tk.border}`, color: conv.codeReviewScope === v ? tk.primary : tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '11px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <ToggleRow label={t('settings', 'convJumpAfterReview')} value={conv.jumpAfterReview} onChange={(v) => settingsActions.updateConversation({ jumpAfterReview: v })} tk={tk} />
      <ToggleRow label={t('settings', 'convAutoRunMCP')} desc={t('settings', 'convAutoRunMCPDesc')} value={conv.autoRunMCP} onChange={(v) => settingsActions.updateConversation({ autoRunMCP: v })} tk={tk} />

      <div className="border-t pt-3" style={{ borderColor: tk.border }}>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'convCmdMode')}</label>
        <div className="flex gap-2 mt-2">
          {([
            { v: 'sandbox' as const, label: t('settings', 'convCmdSandbox'), icon: Shield },
            { v: 'direct' as const, label: t('settings', 'convCmdDirect'), icon: Terminal },
          ]).map(({ v, label, icon: Icon }) => (
            <button key={v} onClick={() => settingsActions.updateConversation({ commandRunMode: v })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" style={{ background: conv.commandRunMode === v ? tk.primaryGlow : 'transparent', border: `1px solid ${conv.commandRunMode === v ? tk.primary : tk.border}`, color: conv.commandRunMode === v ? tk.primary : tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '11px' }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'convWhitelist')}</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {conv.whitelistCommands.map(cmd => (
            <span key={cmd} className="flex items-center gap-1 px-2 py-1 rounded" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
              <code>{cmd}</code>
              <button onClick={() => settingsActions.removeWhitelistCommand(cmd)} className="hover:opacity-80"><X size={8} color={tk.foregroundMuted} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input type="text" value={newCmd} onChange={(e) => setNewCmd(e.target.value)} placeholder={t('settings', 'cmdPlaceholder')} className="flex-1 px-3 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} onKeyDown={(e) => { if (e.key === 'Enter' && newCmd.trim()) { settingsActions.addWhitelistCommand(newCmd.trim()); setNewCmd('') } }} />
          <button onClick={() => { if (newCmd.trim()) { settingsActions.addWhitelistCommand(newCmd.trim()); setNewCmd('') } }} className="px-3 py-1.5 rounded" style={{ background: tk.primary, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px' }}><Plus size={10} /></button>
        </div>
      </div>

      <div className="border-t pt-3" style={{ borderColor: tk.border }}>
        <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'convVolume')}</label>
        <div className="flex items-center gap-3 mt-2">
          <Volume2 size={14} color={tk.foregroundMuted} />
          <input type="range" min={0} max={100} step={5} value={conv.volume} onChange={(e) => settingsActions.updateConversation({ volume: Number(e.target.value) })} className="flex-1" style={{ accentColor: tk.primary }} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, minWidth: 32, textAlign: 'right' }}>{conv.volume}%</span>
        </div>
      </div>
    </div>
  )
}

// ===== Rules & Skills Tab =====
export function RulesSkillsTab({ tk }: SettingsTabProps) {
  const { t } = useI18n()
  const settings = useSettingsStore()
  const [activeSection, setActiveSection] = useState<'rules' | 'skills'>('rules')
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newScope, setNewScope] = useState<'personal' | 'project' | 'global'>('personal')

  const handleAddRule = () => {
    if (!newName.trim()) return
    settingsActions.addRule({ name: newName.trim(), content: newContent.trim(), scope: newScope as 'personal' | 'project', enabled: true })
    setNewName(''); setNewContent(''); setAddMode(false)
  }

  const handleAddSkill = () => {
    if (!newName.trim()) return
    settingsActions.addSkill({ name: newName.trim(), content: newContent.trim(), scope: newScope as 'global' | 'project', enabled: true })
    setNewName(''); setNewContent(''); setAddMode(false)
  }

  return (
    <div className="space-y-5">
      <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>{t('settings', 'rsTitle')}</label>

      <div className="flex gap-2">
        {(['rules', 'skills'] as const).map(section => (
          <button key={section} onClick={() => { setActiveSection(section); setAddMode(false) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" style={{ background: activeSection === section ? tk.primaryGlow : 'transparent', border: `1px solid ${activeSection === section ? tk.primary : tk.border}`, color: activeSection === section ? tk.primary : tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '11px' }}>
            {section === 'rules' ? <Shield size={12} /> : <Zap size={12} />}
            {t('settings', section === 'rules' ? 'rsRules' : 'rsSkills')}
            <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', background: tk.primaryGlow }}>{section === 'rules' ? settings.rules.length : settings.skills.length}</span>
          </button>
        ))}
      </div>

      <button onClick={() => setAddMode(!addMode)} className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}44` }}>
        <Plus size={10} /> {t('settings', activeSection === 'rules' ? 'rsAddRule' : 'rsAddSkill')}
      </button>

      {addMode && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: tk.primaryGlow, border: `1px solid ${tk.primary}40` }}>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('settings', 'namePlaceholder')} className="w-full px-3 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} />
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={t('settings', 'contentPlaceholder')} rows={3} className="w-full px-3 py-1.5 rounded outline-none resize-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} />
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{t('settings', 'scope')}:</span>
            {(activeSection === 'rules' ? ['personal', 'project'] : ['global', 'project']).map(s => (
              <button key={s} onClick={() => setNewScope(s as 'personal' | 'project' | 'global')} className="px-2 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '9px', background: newScope === s ? tk.primary : 'transparent', color: newScope === s ? '#fff' : tk.foregroundMuted, border: `1px solid ${newScope === s ? tk.primary : tk.borderDim}` }}>
                {t('settings', `rsScope${s.charAt(0).toUpperCase() + s.slice(1)}` as string)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={activeSection === 'rules' ? handleAddRule : handleAddSkill} className="px-3 py-1 rounded" style={{ background: tk.primary, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px' }}>{t('settings', 'create')}</button>
            <button onClick={() => setAddMode(false)} className="px-3 py-1 rounded" style={{ border: `1px solid ${tk.borderDim}`, color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '10px' }}>{t('settings', 'cancel')}</button>
          </div>
        </div>
      )}

      {activeSection === 'rules' ? (
        settings.rules.length === 0 ? (
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{t('settings', 'rsEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {settings.rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${rule.enabled ? tk.primary + '40' : tk.borderDim}` }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Shield size={12} color={rule.enabled ? tk.primary : tk.foregroundMuted} />
                  <div className="min-w-0">
                    <p style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{rule.name}</p>
                    <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }} className="truncate">{rule.content.slice(0, 60)}</p>
                  </div>
                  <span className="px-1 py-0.5 rounded shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{rule.scope}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => settingsActions.toggleRule(rule.id)}>
                    <div className="w-8 h-4 rounded-full" style={{ background: rule.enabled ? tk.primary : tk.inputBorder }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: tk.background, transform: `translateX(${rule.enabled ? 17 : 2}px) translateY(2px)` }} />
                    </div>
                  </button>
                  <button onClick={() => settingsActions.removeRule(rule.id)} className="hover:opacity-80"><Trash2 size={10} color={tk.foregroundMuted} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        settings.skills.length === 0 ? (
          <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{t('settings', 'rsEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {settings.skills.map(skill => (
              <div key={skill.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${skill.enabled ? tk.primary + '40' : tk.borderDim}` }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Zap size={12} color={skill.enabled ? tk.primary : tk.foregroundMuted} />
                  <div className="min-w-0">
                    <p style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{skill.name}</p>
                    <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }} className="truncate">{skill.content.slice(0, 60)}</p>
                  </div>
                  <span className="px-1 py-0.5 rounded shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{skill.scope}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => settingsActions.toggleSkill(skill.id)}>
                    <div className="w-8 h-4 rounded-full" style={{ background: skill.enabled ? tk.primary : tk.inputBorder }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: tk.background, transform: `translateX(${skill.enabled ? 17 : 2}px) translateY(2px)` }} />
                    </div>
                  </button>
                  <button onClick={() => settingsActions.removeSkill(skill.id)} className="hover:opacity-80"><Trash2 size={10} color={tk.foregroundMuted} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}