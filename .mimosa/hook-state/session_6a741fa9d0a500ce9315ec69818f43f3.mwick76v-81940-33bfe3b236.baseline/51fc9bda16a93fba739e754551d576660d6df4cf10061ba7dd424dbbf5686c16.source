/**
 * @file PluginManager.tsx
 * @description 插件管理面板 — 消费 plugin-system（注册/激活/停用/权限/卸载）
 *
 * 展示：已注册插件列表（名称/版本/状态/权限）
 * 操作：激活/停用/卸载/查看权限详情
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags plugin,manager,extension,permissions,phase-3
 */

import { useEffect, useState, useCallback } from 'react'
import { Puzzle, Play, Pause, Trash2, Shield, X, AlertTriangle } from 'lucide-react'
import {
  listPlugins, activatePlugin, deactivatePlugin, uninstallPlugin,
  getPluginStats, PERMISSION_LABELS, type PluginInstance, type PluginPermission,
} from '../services/plugin-system'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

type PluginState = PluginInstance['state']

const STATE_CONFIG: Record<PluginState, { color: string; label: string }> = {
  active: { color: 'var(--yyc3-success)', label: '运行中' },
  registered: { color: 'var(--yyc3-primary)', label: '已注册' },
  inactive: { color: 'var(--yyc3-fg-muted)', label: '已停用' },
  error: { color: 'var(--yyc3-error)', label: '错误' },
}

export function PluginManager({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tokens: tk } = useThemeStore()
  const [plugins, setPlugins] = useState<PluginInstance[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setPlugins(listPlugins())
  }, [])

  useEffect(() => {
    if (visible) refresh()
  }, [visible, refresh])

  if (!visible) return null

  const stats = getPluginStats()

  const handleActivate = async (id: string) => {
    await activatePlugin(id)
    refresh()
  }

  const handleDeactivate = (id: string) => {
    deactivatePlugin(id)
    refresh()
  }

  const handleUninstall = (id: string) => {
    uninstallPlugin(id)
    refresh()
  }

  return (
    <div
      className="fixed inset-0 flex items-stretch justify-end"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.sm }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col h-full"
        style={{
          width: 480, background: tk.panelBg, borderLeft: `1px solid ${tk.cardBorder}`,
          backdropFilter: BLUR.lg,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2">
            <Puzzle size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1.5px' }}>
              插件管理
            </span>
            <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, background: tk.cardBg }}>
              {stats.total} 个 · {stats.active} 运行中
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
            <X size={16} />
          </button>
        </div>

        {/* Plugin list */}
        <div className="flex-1 overflow-y-auto">
          {plugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <Puzzle size={28} style={{ color: tk.borderDim }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted, lineHeight: 1.8 }}>
                暂无已注册插件。<br />
                可通过 plugin-system API 注册第三方扩展。
              </p>
            </div>
          ) : (
            plugins.map(plugin => {
              const stateConf = STATE_CONFIG[plugin.state]
              const isExpanded = expandedId === plugin.manifest.id

              return (
                <div
                  key={plugin.manifest.id}
                  className="border-b"
                  style={{ borderBottom: `1px solid ${tk.borderDim}` }}
                >
                  {/* Plugin header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                    onClick={() => setExpandedId(isExpanded ? null : plugin.manifest.id)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
                    >
                      {plugin.manifest.icon || <Puzzle size={14} color={tk.primary} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
                          {plugin.manifest.name}
                        </span>
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                          v{plugin.manifest.version}
                        </span>
                        <span
                          className="px-1 py-0.5 rounded"
                          style={{
                            fontFamily: tk.fontMono, fontSize: '8px',
                            color: stateConf.color,
                            background: `${stateConf.color}15`,
                          }}
                        >
                          {stateConf.label}
                        </span>
                      </div>
                      <p className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                        {plugin.manifest.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {plugin.state === 'active' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeactivate(plugin.manifest.id) }}
                          className="p-1.5 rounded transition-all hover:opacity-70"
                          style={{ color: tk.warning }}
                          title="停用"
                        >
                          <Pause size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleActivate(plugin.manifest.id) }}
                          className="p-1.5 rounded transition-all hover:opacity-70"
                          style={{ color: tk.success }}
                          title="激活"
                        >
                          <Play size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUninstall(plugin.manifest.id) }}
                        className="p-1.5 rounded transition-all hover:opacity-70"
                        style={{ color: tk.error }}
                        title="卸载"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: permissions & error */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pl-[60px]">
                      {/* Error info */}
                      {plugin.lastError && (
                        <div className="flex items-start gap-2 mb-2 p-2 rounded" style={{ background: `${tk.error}08`, border: `1px solid ${tk.error}20` }}>
                          <AlertTriangle size={10} color={tk.error} className="shrink-0 mt-0.5" />
                          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error, wordBreak: 'break-word' }}>
                            {plugin.lastError}
                          </span>
                        </div>
                      )}

                      {/* Permissions */}
                      <div className="flex items-start gap-2">
                        <Shield size={10} color={tk.secondary} className="shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {plugin.manifest.permissions.map((perm: PluginPermission) => (
                            <span
                              key={perm}
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                fontFamily: tk.fontMono, fontSize: '8px',
                                color: tk.secondary,
                                background: `${tk.secondary}10`,
                                border: `1px solid ${tk.secondary}30`,
                              }}
                            >
                              {PERMISSION_LABELS[perm]}
                            </span>
                          ))}
                          {plugin.manifest.permissions.length === 0 && (
                            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                              无需特殊权限
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex gap-4 mt-2" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                        <span>注册: {new Date(plugin.installedAt).toLocaleDateString()}</span>
                        {plugin.activatedAt && (
                          <span>激活: {new Date(plugin.activatedAt).toLocaleDateString()}</span>
                        )}
                        {plugin.manifest.author && <span>作者: {plugin.manifest.author}</span>}
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
