/**
 * @file CRDTCollabPanel.tsx
 * @description CRDT实时协作面板组件，提供协作管理和用户光标可视化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,crdt,yjs,collaboration,ui
 */

import { useState, useMemo } from 'react'
import {
  X, Users, Wifi, Radio, CheckCircle2, AlertCircle,
  Clock, Eye, User, GitBranch, Share2, Settings,
} from 'lucide-react'
import { useCRDTCollab } from '../hooks/useCRDTCollab'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

/**
 * CRDT协作面板属性
 */
export interface CRDTCollabPanelProps {
  /** 是否可见 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * CRDT协作面板组件
 *
 * 提供CRDT实时协作的完整管理界面，包括：
 * - 连接管理（WebSocket/WebRTC）
 * - 用户列表和在线状态
 * - 协作文档管理
 * - 实时光标同步
 *
 * @example
 * ```tsx
 * function App() {
 *   const [visible, setVisible] = useState(false)
 *
 *   return (
 *     <div>
 *       <button onClick={() => setVisible(true)}>
 *         打开协作面板
 *       </button>
 *       <CRDTCollabPanel
 *         visible={visible}
 *         onClose={() => setVisible(false)}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function CRDTCollabPanel({ visible, onClose }: CRDTCollabPanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()

  const {
    connectionType,
    connected,
    connectionStatus,
    error,
    userId,
    userName,
    userColor,
    users,
    documents,
    disconnect,
    createDocument,
    setUserInfo,
    setConnectionType,
  } = useCRDTCollab({
    autoInitialize: true,
  })

  const [activeTab, setActiveTab] = useState<'users' | 'documents' | 'settings'>('users')
  const [newDocName, setNewDocName] = useState('')

  const otherUsers = useMemo(
    () => users.filter((u) => u.id !== userId),
    [users, userId]
  )

  const onlineUsers = useMemo(
    () => users.filter((u) => u.online),
    [users]
  )

  if (!visible) return null

  // 连接状态颜色
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return tk.success
      case 'connecting':
        return tk.warning
      case 'error':
        return tk.error
      default:
        return tk.foregroundMuted
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[5vh]"
      style={{ zIndex: Z_INDEX.topModal + 40, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 800,
          maxHeight: '85vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <Users size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '2px' }}>
              CRDT COLLABORATION
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: `${getConnectionColor()}15` }}>
              {connected ? <Wifi size={10} color={getConnectionColor()} /> : <Radio size={10} color={getConnectionColor()} />}
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: getConnectionColor() }}>
                {connectionStatus.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
            <X size={14} />
          </button>
        </div>

        {/* Connection Status Bar */}
        {error && (
          <div className="px-5 py-2 border-b" style={{ borderColor: tk.border, background: `${tk.error}10` }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={12} color={tk.error} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error }}>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Current User Info */}
        <div className="px-5 py-3 border-b" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: userColor }}
            >
              <User size={14} color="#ffffff" />
            </div>
            <div className="flex-1">
              <div style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                {userName}
              </div>
              <div style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                ID: {userId.slice(0, 8)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${tk.success}15`, color: tk.success, fontFamily: tk.fontMono }}>
                {connectionType.toUpperCase()}
              </span>
              {connected ? (
                <button
                  onClick={disconnect}
                  className="px-2 py-1 rounded text-xs transition-all hover:opacity-70"
                  style={{ background: `${tk.warning}15`, color: tk.warning, fontFamily: tk.fontMono }}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setConnectionType('websocket')}
                  className="px-2 py-1 rounded text-xs transition-all hover:opacity-70"
                  style={{ background: `${tk.success}15`, color: tk.success, fontFamily: tk.fontMono }}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 border-b shrink-0" style={{ borderColor: tk.border }}>
          {(['users', 'documents', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded text-xs transition-all"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '10px',
                letterSpacing: '1px',
                background: activeTab === tab ? `${tk.primary}15` : 'transparent',
                color: activeTab === tab ? tk.primary : tk.foregroundMuted,
                border: activeTab === tab ? `1px solid ${tk.primary}30` : '1px solid transparent',
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto neon-scrollbar p-5">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                  ONLINE USERS ({onlineUsers.length})
                </h3>
                <div className="flex items-center gap-1" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                  <Eye size={10} />
                  <span>{onlineUsers.length} watching</span>
                </div>
              </div>

              <div className="space-y-2">
                {/* Current user */}
                <div
                  className="p-3 rounded-lg flex items-center gap-3"
                  style={{ background: `${tk.primary}10`, border: `1px solid ${tk.primary}30` }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: userColor }}
                  >
                    <User size={14} color="#ffffff" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                        {userName} (You)
                      </span>
                      <CheckCircle2 size={12} color={tk.success} />
                    </div>
                    <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                      {onlineUsers.length === 1 ? 'Only you online' : `${onlineUsers.length - 1} others online`}
                    </div>
                  </div>
                </div>

                {/* Other users */}
                {otherUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-lg flex items-center gap-3 transition-all hover:opacity-80"
                    style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center relative"
                      style={{ background: user.color }}
                    >
                      <User size={14} color="#ffffff" />
                      {user.online && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ background: tk.success, borderColor: tk.panelBg }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                          {user.name}
                        </span>
                        {!user.online && (
                          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                            • offline
                          </span>
                        )}
                      </div>
                      {user.cursor && (
                        <div className="flex items-center gap-2 mt-1" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                          <Clock size={10} />
                          <span>
                            {user.cursor.file}:{user.cursor.line}:{user.cursor.column}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {otherUsers.length === 0 && (
                  <div className="text-center py-8" style={{ color: tk.foregroundMuted }}>
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
                      No other users connected
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                  SHARED DOCUMENTS ({documents.size})
                </h3>
                <button
                  onClick={() => {
                    if (newDocName.trim()) {
                      createDocument(newDocName, newDocName)
                      setNewDocName('')
                    }
                  }}
                  disabled={!newDocName.trim() || !connected}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70 disabled:opacity-50"
                  style={{
                    fontFamily: tk.fontMono,
                    background: `${tk.primary}15`,
                    color: tk.primary,
                    border: `1px solid ${tk.primary}30`,
                  }}
                >
                  <Share2 size={10} />
                  New Document
                </button>
              </div>

              {/* Create document input */}
              <div>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Enter document name..."
                  disabled={!connected}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '11px',
                    background: tk.cardBg,
                    border: `1px solid ${tk.cardBorder}`,
                    color: tk.foreground,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Documents list */}
              <div className="space-y-2">
                {Array.from(documents.values()).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg flex items-center gap-3"
                    style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}
                  >
                    <GitBranch size={16} color={tk.primary} />
                    <div className="flex-1">
                      <div style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                        ID: {doc.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" style={{ fontFamily: tk.fontMono, fontSize: '8px' }}>
                      <CheckCircle2 size={10} color={doc.synced ? tk.success : tk.warning} />
                      <span style={{ color: doc.synced ? tk.success : tk.warning }}>
                        {doc.synced ? 'SYNCED' : 'SYNCING'}
                      </span>
                    </div>
                  </div>
                ))}

                {documents.size === 0 && (
                  <div className="text-center py-8" style={{ color: tk.foregroundMuted }}>
                    <Share2 size={32} className="mx-auto mb-2 opacity-50" />
                    <p style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
                      No shared documents yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                COLLABORATION SETTINGS
              </h3>

              <div className="p-4 rounded-lg" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    USER SETTINGS
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: '4px' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserInfo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                      style={{
                        fontFamily: tk.fontMono,
                        fontSize: '11px',
                        background: tk.cardBg,
                        border: `1px solid ${tk.cardBorder}`,
                        color: tk.foreground,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Connection type info */}
                  <div className="p-3 rounded" style={{ background: `${tk.primary}5`, border: `1px solid ${tk.primary}20` }}>
                    <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: '8px' }}>
                      Current Connection
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio size={14} color={tk.primary} />
                      <div>
                        <div style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
                          {connectionType.toUpperCase()} Provider
                        </div>
                        <div style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                          {connectionType === 'websocket' ? 'Server-based sync' : 'P2P direct connection'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offline support */}
                  <div className="p-3 rounded" style={{ background: `${tk.success}5`, border: `1px solid ${tk.success}20` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={12} color={tk.success} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.success }}>
                        Offline Support Enabled
                      </span>
                    </div>
                    <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                      Your changes are automatically saved to IndexedDB and will sync when you reconnect.
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection info */}
              <div className="p-4 rounded-lg" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Wifi size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    CONNECTION INFO
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2" style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>User ID:</span>
                    <span className="ml-2" style={{ color: tk.primary }}>
                      {userId.slice(0, 8)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>Status:</span>
                    <span className="ml-2" style={{ color: getConnectionColor() }}>
                      {connectionStatus.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>Documents:</span>
                    <span className="ml-2" style={{ color: tk.primary }}>
                      {documents.size}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>Users:</span>
                    <span className="ml-2" style={{ color: tk.primary }}>
                      {users.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
