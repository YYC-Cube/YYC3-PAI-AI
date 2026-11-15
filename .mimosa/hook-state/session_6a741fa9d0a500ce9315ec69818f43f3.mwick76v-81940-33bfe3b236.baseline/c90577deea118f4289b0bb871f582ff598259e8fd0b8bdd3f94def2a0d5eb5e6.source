/**
 * @file CollabPanel.tsx
 * @description 协作面板组件，提供协作功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,collaboration,ui,component
 */

import { useMemo } from 'react'
import {
  Users, Radio, GitMerge, Check, X, Clock, Shield,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useCollabStore, type OpType } from '../store/collab-store'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

export function CollabPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const collab = useCollabStore()
  const { tokens: tk, isCyberpunk } = useThemeStore()

  const recentOps = useMemo(() => [...collab.operations].reverse().slice(0, 15), [collab.operations])
  const pendingConflicts = useMemo(
    () => collab.conflicts.filter((c) => c.resolution === 'pending'),
    [collab.conflicts],
  )

  if (!visible) return null

  const syncColors: Record<string, string> = {
    synced: tk.success, syncing: tk.warning, conflict: tk.error, offline: tk.foregroundMuted,
  }
  const opColors: Record<OpType, string> = {
    insert: tk.success, delete: tk.error, replace: tk.warning, cursor_move: tk.foregroundMuted,
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.sm }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-xl overflow-hidden flex flex-col"
        style={{
          width: 520,
          maxHeight: '80vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}` : tk.shadowHover,
          borderRadius: tk.borderRadius,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
            >
              <Users size={14} color={tk.primary} />
            </div>
            <div>
              <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1px', margin: 0, lineHeight: 1.3 }}>
                {isZh ? '协同编辑' : 'COLLABORATIVE EDITING'}
              </h2>
              <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '2px', margin: 0 }}>
                CRDT · OT · {isZh ? '冲突解决' : 'CONFLICT RESOLUTION'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync status */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: syncColors[collab.syncStatus], boxShadow: isCyberpunk ? `0 0 4px ${syncColors[collab.syncStatus]}` : 'none' }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: syncColors[collab.syncStatus], letterSpacing: '1px' }}>
                {collab.syncStatus.toUpperCase()}
              </span>
            </div>
            <button
              onClick={collab.toggleCollab}
              className="px-2 py-0.5 rounded transition-all"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '8px',
                letterSpacing: '1px',
                color: collab.enabled ? tk.background : tk.foregroundMuted,
                background: collab.enabled ? tk.primary : 'transparent',
                border: `1px solid ${collab.enabled ? tk.primary : tk.border}`,
              }}
            >
              {collab.enabled ? (isZh ? '已启用' : 'ON') : (isZh ? '已关闭' : 'OFF')}
            </button>
            <button onClick={onClose} className="p-1 rounded hover:opacity-80 transition-all">
              <X size={14} color={tk.primary} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-2 border-b flex items-center gap-4" style={{ borderColor: tk.border, background: tk.primaryGlow }}>
          {[
            { label: isZh ? '用户' : 'USERS', value: collab.users.length, color: tk.primary },
            { label: isZh ? '操作数' : 'OPS', value: collab.opCount, color: tk.success },
            { label: isZh ? '延迟' : 'LATENCY', value: `${collab.latency}ms`, color: collab.latency > 60 ? tk.warning : tk.success },
            { label: isZh ? '冲突' : 'CONFLICTS', value: pendingConflicts.length, color: pendingConflicts.length > 0 ? tk.error : tk.success },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
                {stat.label}
              </span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
          {/* Vector clock mini */}
          <div className="ml-auto flex items-center gap-1">
            <Clock size={8} color={tk.primary} style={{ opacity: 0.3 }} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
              VC:[{Object.values(collab.vectorClock).join(',')}]
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto neon-scrollbar">
          {/* === Connected Users === */}
          <div className="px-5 py-3 border-b" style={{ borderColor: tk.border }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={10} color={tk.primary} style={{ opacity: 0.5 }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, letterSpacing: '1px', opacity: 0.7 }}>
                {isZh ? '已连接用户' : 'CONNECTED USERS'}
              </span>
            </div>
            <div className="space-y-1.5">
              {collab.users.map((user) => {
                const isLocal = user.id === collab.localUserId
                const statusColor = user.status === 'active' ? tk.success : user.status === 'idle' ? tk.warning : tk.foregroundMuted
                return (
                  <div key={user.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg" style={{ background: isLocal ? tk.primaryGlow : 'transparent', border: `1px solid ${isLocal ? tk.borderDim : 'transparent'}` }}>
                    {/* Avatar with color */}
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${user.color}20`, border: `1.5px solid ${user.color}` }}>
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: user.color }}>
                          {user.name[0]}
                        </span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: isCyberpunk ? `0 0 3px ${statusColor}` : 'none', border: `1px solid ${tk.background}` }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: user.color }}>
                          {user.name}
                        </span>
                        {isLocal && (
                          <span className="px-1 py-0 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                        L{user.cursor.line}:C{user.cursor.col}
                        {user.selection && ` [sel ${user.selection.startLine}-${user.selection.endLine}]`}
                      </span>
                    </div>
                    {/* Cursor indicator */}
                    <div className="w-3 h-4 rounded-sm" style={{ background: `${user.color}40`, borderLeft: `2px solid ${user.color}` }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* === Conflict Resolution === */}
          {collab.conflicts.length > 0 && (
            <div className="px-5 py-3 border-b" style={{ borderColor: tk.border }}>
              <div className="flex items-center gap-1.5 mb-2">
                <GitMerge size={10} color={tk.error} style={{ opacity: 0.7 }} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error, letterSpacing: '1px', opacity: 0.7 }}>
                  {isZh ? '冲突记录' : 'CONFLICT LOG'} ({collab.conflicts.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {collab.conflicts.slice(-5).reverse().map((conflict) => {
                  const userA = collab.users.find((u) => u.id === conflict.opA.userId)
                  const userB = collab.users.find((u) => u.id === conflict.opB.userId)
                  const resColor = conflict.resolution === 'auto_merge' ? tk.success : conflict.resolution === 'pending' ? tk.warning : tk.primary
                  return (
                    <div key={conflict.id} className="px-2.5 py-2 rounded-lg" style={{ background: tk.error + '08', border: `1px solid ${tk.error}18` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: userA?.color || tk.foregroundMuted }}>
                            {userA?.name || '?'}
                          </span>
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>vs</span>
                          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: userB?.color || tk.foregroundMuted }}>
                            {userB?.name || '?'}
                          </span>
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                            @ L{conflict.opA.position.line}
                          </span>
                        </div>
                        <span className="px-1.5 py-0 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: resColor, background: resColor + '15', border: `1px solid ${resColor}33` }}>
                          {conflict.resolution === 'auto_merge' ? 'AUTO-MERGED' : conflict.resolution === 'pending' ? 'PENDING' : conflict.resolution.toUpperCase()}
                        </span>
                      </div>
                      {conflict.resolution === 'pending' && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            onClick={() => collab.resolveConflict(conflict.id, 'accept_a')}
                            className="flex items-center gap-1 px-2 py-0.5 rounded transition-all"
                            style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.success, border: `1px solid ${tk.success}33` }}
                          >
                            <Check size={8} /> {isZh ? '取本地' : 'ACCEPT LOCAL'}
                          </button>
                          <button
                            onClick={() => collab.resolveConflict(conflict.id, 'accept_b')}
                            className="flex items-center gap-1 px-2 py-0.5 rounded transition-all"
                            style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.secondary, border: `1px solid ${tk.secondary}33` }}
                          >
                            <Shield size={8} /> {isZh ? '取远程' : 'ACCEPT REMOTE'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* === Operations Log === */}
          <div className="px-5 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Radio size={10} color={tk.primary} style={{ opacity: 0.5 }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, letterSpacing: '1px', opacity: 0.7 }}>
                {isZh ? '操作日志' : 'OPERATIONS LOG'} ({collab.operations.length})
              </span>
            </div>
            <div className="space-y-0.5">
              {recentOps.length === 0 && (
                <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, textAlign: 'center', padding: '12px 0' }}>
                  {isZh ? '等待操作...' : 'Waiting for operations...'}
                </p>
              )}
              {recentOps.map((op) => {
                const user = collab.users.find((u) => u.id === op.userId)
                const opIcons: Record<OpType, string> = { insert: '+', delete: '-', replace: '~', cursor_move: '>' }
                return (
                  <div key={op.id} className="flex items-center gap-2 py-0.5" style={{ opacity: op.type === 'cursor_move' ? 0.4 : 0.8 }}>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: opColors[op.type], width: 10, textAlign: 'center' }}>
                      {opIcons[op.type]}
                    </span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: user?.color || tk.foregroundMuted, width: 40 }}>
                      {user?.name || '?'}
                    </span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                      L{op.position.line}:C{op.position.col}
                    </span>
                    {op.content && (
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        "{op.content}"
                      </span>
                    )}
                    <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, opacity: 0.4 }}>
                      {new Date(op.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
