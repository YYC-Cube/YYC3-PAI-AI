/**
 * @file MultiInstancePanel.tsx
 * @description YYC3 Multi-Instance Manager — Window, Workspace, Session management panel
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,multi-instance,ui
 */

import { useState } from 'react'
import {
  X, Monitor, Plus, Trash2, Play, Pause, Square,
  FolderOpen, Copy, ChevronDown, ChevronRight,
  Cpu, MessageSquare, Code2, Terminal,
  Eye, Settings, Bot, RefreshCw, Layers, Radio,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, type ThemeTokens, Z_INDEX, BLUR } from '../store/theme-store'
import {
  useMultiInstanceStore,
  multiInstanceActions,
  type WindowType,
  type WorkspaceType,
  type SessionType,
} from '../store/multi-instance-store'

interface MultiInstancePanelProps {
  visible: boolean
  onClose: () => void
}

type PanelTab = 'instances' | 'workspaces' | 'sessions' | 'resources' | 'ipc'

const WINDOW_TYPE_ICONS: Record<WindowType, typeof Monitor> = {
  main: Monitor,
  editor: Code2,
  preview: Eye,
  terminal: Terminal,
  'ai-chat': Bot,
  settings: Settings,
}

const SESSION_TYPE_ICONS: Record<SessionType, typeof MessageSquare> = {
  'ai-chat': MessageSquare,
  'code-edit': Code2,
  debug: Cpu,
  preview: Eye,
  terminal: Terminal,
}

export function MultiInstancePanel({ visible, onClose }: MultiInstancePanelProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk } = useThemeStore()
  const store = useMultiInstanceStore()
  const [tab, setTab] = useState<PanelTab>('instances')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const tabs: { key: PanelTab; label: string; icon: typeof Layers; count?: number }[] = [
    { key: 'instances', label: isZh ? '实例' : 'Instances', icon: Monitor, count: store.instances.length },
    { key: 'workspaces', label: isZh ? '工作区' : 'Workspaces', icon: FolderOpen, count: store.workspaces.length },
    { key: 'sessions', label: isZh ? '会话' : 'Sessions', icon: Layers, count: store.sessions.filter(s => s.status !== 'closed').length },
    { key: 'resources', label: isZh ? '资源' : 'Resources', icon: Cpu },
    { key: 'ipc', label: 'IPC', icon: Radio, count: store.ipcLog.length },
  ]

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.topModal, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 900, height: 620,
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: tk.shadowHover,
          animation: 'modalIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-3">
            <Layers size={16} color={tk.primary} />
            <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '14px', color: tk.primary, letterSpacing: '1px', margin: 0 }}>
              {isZh ? '多实例管理器' : 'Multi-Instance Manager'}
            </h2>
            <span className="px-2 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.primaryGlow }}>
              {store.instances.length} {isZh ? '实例' : 'instances'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-80"><X size={16} color={tk.foregroundMuted} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b" style={{ borderColor: tk.border }}>
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: tab === key ? tk.primaryGlow : 'transparent',
                border: `1px solid ${tab === key ? tk.primary : 'transparent'}`,
                color: tab === key ? tk.primary : tk.foregroundMuted,
                fontFamily: tk.fontMono, fontSize: '10px',
              }}
            >
              <Icon size={11} /> {label}
              {count !== undefined && (
                <span className="px-1 py-0.5 rounded" style={{ fontSize: '7px', background: tab === key ? `${tk.primary}30` : tk.primaryGlow }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto neon-scrollbar px-5 py-4">
          {/* Instances Tab */}
          {tab === 'instances' && (
            <InstancesView tk={tk} store={store} isZh={isZh} expandedId={expandedId} setExpandedId={setExpandedId} />
          )}

          {/* Workspaces Tab */}
          {tab === 'workspaces' && (
            <WorkspacesView tk={tk} store={store} isZh={isZh} />
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <SessionsView tk={tk} store={store} isZh={isZh} />
          )}

          {/* Resources Tab */}
          {tab === 'resources' && (
            <ResourcesView tk={tk} store={store} isZh={isZh} />
          )}

          {/* IPC Log */}
          {tab === 'ipc' && (
            <IPCView tk={tk} store={store} isZh={isZh} />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Sub Views =====

function InstancesView({ tk, store, isZh, expandedId, setExpandedId }: { tk: ThemeTokens; store: ReturnType<typeof useMultiInstanceStore>; isZh: boolean; expandedId: string | null; setExpandedId: (id: string | null) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
          {isZh ? '窗口实例' : 'WINDOW INSTANCES'}
        </span>
        <div className="flex gap-2">
          {(['editor', 'preview', 'terminal', 'ai-chat'] as WindowType[]).map(type => {
            const Icon = WINDOW_TYPE_ICONS[type]
            return (
              <button key={type} onClick={() => multiInstanceActions.createInstance(type)} className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary, border: `1px solid ${tk.primary}30` }}>
                <Plus size={8} /><Icon size={9} /> {type}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        {store.instances.map(inst => {
          const Icon = WINDOW_TYPE_ICONS[inst.windowType] || Monitor
          const expanded = expandedId === inst.id
          return (
            <div key={inst.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${inst.isMain ? tk.primary + '40' : tk.borderDim}` }}>
              <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer" onClick={() => setExpandedId(expanded ? null : inst.id)}>
                <div className="flex items-center gap-2">
                  <Icon size={14} color={inst.isMinimized ? tk.foregroundMuted : tk.primary} />
                  <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{inst.title}</span>
                  {inst.isMain && <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primary, background: tk.primaryGlow }}>MAIN</span>}
                  {inst.isMinimized && <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.warning, background: `${tk.warning}15` }}>MIN</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{inst.size.width}x{inst.size.height}</span>
                  {!inst.isMain && <button onClick={(e) => { e.stopPropagation(); multiInstanceActions.closeInstance(inst.id) }} className="p-0.5 hover:opacity-80"><Trash2 size={10} color={tk.error} /></button>}
                  {expanded ? <ChevronDown size={11} color={tk.foregroundMuted} /> : <ChevronRight size={11} color={tk.foregroundMuted} />}
                </div>
              </div>
              {expanded && (
                <div className="px-4 pb-3 border-t space-y-2" style={{ borderColor: tk.borderDim }}>
                  <div className="flex gap-4 mt-2">
                    {[
                      { l: 'Type', v: inst.windowType },
                      { l: 'Position', v: `${inst.position.x}, ${inst.position.y}` },
                      { l: 'Sessions', v: String(inst.sessionIds.length) },
                    ].map(({ l, v }) => (
                      <div key={l}>
                        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{l}</span>
                        <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => multiInstanceActions.activateInstance(inst.id)} className="px-2 py-1 rounded" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}30` }}>
                      <Play size={8} className="inline mr-1" />{isZh ? '激活' : 'Activate'}
                    </button>
                    <button onClick={() => multiInstanceActions.minimizeInstance(inst.id)} className="px-2 py-1 rounded" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
                      {isZh ? '最小化' : 'Minimize'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WorkspacesView({ tk, store, isZh }: { tk: ThemeTokens; store: ReturnType<typeof useMultiInstanceStore>; isZh: boolean }) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<WorkspaceType>('project')

  const handleCreate = () => {
    if (!newName.trim()) return
    multiInstanceActions.createWorkspace(newName.trim(), newType)
    setNewName('')
  }

  return (
    <div className="space-y-4">
      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
        {isZh ? '工作区' : 'WORKSPACES'}
      </span>

      {/* Create form */}
      <div className="flex gap-2">
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={isZh ? '工作区名称...' : 'Workspace name...'} className="flex-1 px-3 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '11px' }} onKeyDown={e => { if (e.key === 'Enter') handleCreate() }} />
        <select value={newType} onChange={e => setNewType(e.target.value as WorkspaceType)} className="px-2 py-1.5 rounded outline-none" style={{ background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, color: tk.foreground, fontFamily: tk.fontMono, fontSize: '10px' }}>
          <option value="project">Project</option>
          <option value="ai-session">AI Session</option>
          <option value="debug">Debug</option>
          <option value="custom">Custom</option>
        </select>
        <button onClick={handleCreate} disabled={!newName.trim()} className="px-3 py-1.5 rounded" style={{ background: newName.trim() ? tk.primary : tk.borderDim, color: '#fff', fontFamily: tk.fontMono, fontSize: '10px' }}>
          <Plus size={10} className="inline mr-1" />{isZh ? '创建' : 'Create'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {store.workspaces.map(ws => (
          <div key={ws.id} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ border: `1px solid ${ws.isActive ? tk.primary + '40' : tk.borderDim}`, background: ws.isActive ? tk.primaryGlow : 'transparent' }}>
            <div className="flex items-center gap-2">
              <FolderOpen size={14} color={ws.isActive ? tk.primary : tk.foregroundMuted} />
              <div>
                <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{ws.name}</span>
                <div className="flex gap-2 mt-0.5">
                  <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{ws.type}</span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{ws.sessionIds.length} sessions</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!ws.isActive && <button onClick={() => multiInstanceActions.activateWorkspace(ws.id)} className="px-2 py-1 rounded" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}30` }}>{isZh ? '激活' : 'Activate'}</button>}
              <button onClick={() => multiInstanceActions.duplicateWorkspace(ws.id)} className="p-1 rounded hover:opacity-80"><Copy size={10} color={tk.foregroundMuted} /></button>
              {store.workspaces.length > 1 && <button onClick={() => multiInstanceActions.deleteWorkspace(ws.id)} className="p-1 rounded hover:opacity-80"><Trash2 size={10} color={tk.error} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionsView({ tk, store, isZh }: { tk: ThemeTokens; store: ReturnType<typeof useMultiInstanceStore>; isZh: boolean }) {
  const activeSessions = store.sessions.filter(s => s.status !== 'closed')
  const closedSessions = store.sessions.filter(s => s.status === 'closed')

  return (
    <div className="space-y-4">
      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
        {isZh ? '活跃会话' : 'ACTIVE SESSIONS'} ({activeSessions.length})
      </span>

      <div className="space-y-1.5">
        {activeSessions.map(session => {
          const Icon = SESSION_TYPE_ICONS[session.type] || Layers
          const statusColors: Record<string, string> = { active: tk.success, idle: tk.foregroundMuted, suspended: tk.warning }
          return (
            <div key={session.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ border: `1px solid ${store.activeSessionId === session.id ? tk.primary + '40' : tk.borderDim}` }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: statusColors[session.status] || tk.foregroundMuted }} />
                <Icon size={12} color={tk.primary} />
                <span style={{ fontFamily: tk.fontBody, fontSize: '12px', color: tk.foreground }}>{session.name}</span>
                <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, background: tk.primaryGlow }}>{session.type}</span>
              </div>
              <div className="flex items-center gap-1">
                {session.status === 'suspended' ? (
                  <button onClick={() => multiInstanceActions.resumeSession(session.id)} className="p-1 rounded hover:opacity-80"><Play size={10} color={tk.success} /></button>
                ) : (
                  <button onClick={() => multiInstanceActions.suspendSession(session.id)} className="p-1 rounded hover:opacity-80"><Pause size={10} color={tk.warning} /></button>
                )}
                <button onClick={() => multiInstanceActions.closeSession(session.id)} className="p-1 rounded hover:opacity-80"><Square size={10} color={tk.error} /></button>
                <button onClick={() => multiInstanceActions.deleteSession(session.id)} className="p-1 rounded hover:opacity-80"><Trash2 size={10} color={tk.foregroundMuted} /></button>
              </div>
            </div>
          )
        })}
        {activeSessions.length === 0 && <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{isZh ? '暂无活跃会话' : 'No active sessions'}</p>}
      </div>

      {closedSessions.length > 0 && (
        <>
          <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
            {isZh ? '已关闭' : 'CLOSED'} ({closedSessions.length})
          </span>
          <div className="space-y-1">
            {closedSessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between px-4 py-1.5 rounded" style={{ opacity: 0.5 }}>
                <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{session.name} ({session.type})</span>
                <button onClick={() => multiInstanceActions.deleteSession(session.id)} className="p-0.5 hover:opacity-80"><Trash2 size={9} color={tk.foregroundMuted} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ResourcesView({ tk, store, isZh }: { tk: ThemeTokens; store: ReturnType<typeof useMultiInstanceStore>; isZh: boolean }) {
  const totalMem = multiInstanceActions.getTotalMemoryMB()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
          {isZh ? '资源监控' : 'RESOURCE MONITOR'}
        </span>
        <button onClick={() => multiInstanceActions.refreshResources()} className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.primary}30` }}>
          <RefreshCw size={9} /> {isZh ? '刷新' : 'Refresh'}
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        {[
          { label: isZh ? '总内存' : 'Total Memory', value: `${totalMem} MB`, color: totalMem > 500 ? tk.warning : tk.success },
          { label: isZh ? '实例数' : 'Instances', value: String(store.instances.length), color: tk.primary },
          { label: isZh ? '活跃会话' : 'Active Sessions', value: String(store.sessions.filter(s => s.status === 'active').length), color: tk.primary },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-1 px-4 py-3 rounded-lg" style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
            <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{label}</p>
            <p style={{ fontFamily: tk.fontDisplay, fontSize: '18px', color, letterSpacing: '1px', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-instance */}
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
        <div className="flex px-4 py-2" style={{ background: tk.primaryGlow }}>
          {[isZh ? '实例' : 'Instance', 'Memory', 'CPU', 'Tabs', 'Sessions'].map(h => (
            <span key={h} className="flex-1" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px' }}>{h}</span>
          ))}
        </div>
        {store.resources.map((r, i) => {
          const inst = store.instances.find(inst => inst.id === r.instanceId)
          return (
            <div key={r.instanceId} className="flex px-4 py-2" style={{ borderTop: `1px solid ${tk.borderDim}`, background: i % 2 === 0 ? 'transparent' : tk.primaryGlow }}>
              <span className="flex-1 truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{inst?.title || r.instanceId.slice(0, 8)}</span>
              <span className="flex-1" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: r.memoryMB > 200 ? tk.warning : tk.success }}>{r.memoryMB} MB</span>
              <span className="flex-1" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: r.cpuPercent > 10 ? tk.warning : tk.foreground }}>{r.cpuPercent}%</span>
              <span className="flex-1" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{r.tabCount}</span>
              <span className="flex-1" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{r.sessionCount}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IPCView({ tk, store, isZh }: { tk: ThemeTokens; store: ReturnType<typeof useMultiInstanceStore>; isZh: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
          IPC {isZh ? '消息日志' : 'MESSAGE LOG'} ({store.ipcLog.length})
        </span>
        <button onClick={() => multiInstanceActions.clearIPCLog()} className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
          <Trash2 size={9} /> {isZh ? '清空' : 'Clear'}
        </button>
      </div>

      {store.ipcLog.length === 0 ? (
        <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{isZh ? '暂无 IPC 消息' : 'No IPC messages'}</p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto neon-scrollbar">
          {[...store.ipcLog].reverse().map(msg => (
            <div key={msg.id} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
              <Radio size={9} color={tk.primary} />
              <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primary, background: `${tk.primary}15`, border: `1px solid ${tk.primary}30` }}>{msg.type}</span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }} className="truncate flex-1">
                {msg.senderId.slice(0, 8)}...{msg.receiverId ? ` -> ${msg.receiverId.slice(0, 8)}` : ' (broadcast)'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
