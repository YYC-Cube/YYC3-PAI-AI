/**
 * @file SyncPanel.tsx
 * @description 同步面板组件，提供同步状态展示和操作界面
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Pause, Play, Trash2, RotateCcw, Clock, FileText,
  Wifi, Settings, ArrowRight, ChevronDown, FolderOpen,
} from 'lucide-react'
import { useThemeStore, BLUR } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { useSyncStore } from '../store/sync-store'
import { cyberToast } from './CyberToast'
import type { SyncItem, SyncConflict } from '../services/sync-engine'

interface SyncPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SyncPanel({ isOpen, onClose }: SyncPanelProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk } = useThemeStore()
  const {
    status,
    queue,
    conflicts,
    history,
    lastSyncTime,
    isAutoSyncEnabled,
    watchedPaths,
    stats,
    startSync,
    abortSync,
    enableAutoSync,
    disableAutoSync,
    resolveConflict,
    retryFailedItems,
    clearCompletedItems,
    removeFromQueue,
    refreshStats,
  } = useSyncStore()

  const [activeTab, setActiveTab] = useState<'queue' | 'conflicts' | 'history' | 'settings'>('queue')
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null)

  useEffect(() => {
    if (isOpen) {
      refreshStats()
      const interval = setInterval(refreshStats, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen, refreshStats])

  const handleStartSync = useCallback(async () => {
    try {
      await startSync()
      cyberToast(isZh ? '✅ 同步完成' : '✅ Sync completed')
    } catch {
      cyberToast(isZh ? '❌ 同步失败' : '❌ Sync failed')
    }
  }, [startSync, isZh])

  const handleAbortSync = useCallback(() => {
    abortSync()
    cyberToast(isZh ? 'ℹ️ 已取消同步' : 'ℹ️ Sync cancelled')
  }, [abortSync, isZh])

  const handleToggleAutoSync = useCallback(() => {
    if (isAutoSyncEnabled) {
      disableAutoSync()
      cyberToast(isZh ? 'ℹ️ 已关闭自动同步' : 'ℹ️ Auto-sync disabled')
    } else {
      enableAutoSync()
      cyberToast(isZh ? '✅ 已开启自动同步' : '✅ Auto-sync enabled')
    }
  }, [isAutoSyncEnabled, enableAutoSync, disableAutoSync, isZh])

  const handleResolveConflict = useCallback((conflictId: string, resolution: 'local-win' | 'remote-win') => {
    resolveConflict(conflictId, resolution)
    setSelectedConflict(null)
    cyberToast(isZh ? '✅ 冲突已解决' : '✅ Conflict resolved')
  }, [resolveConflict, isZh])

  if (!isOpen) return null

  const statusColor = status === 'syncing' ? tk.warning :
    status === 'conflict' ? tk.error :
      status === 'error' ? tk.error : tk.success

  const StatusIcon = status === 'syncing' ? RefreshCw :
    status === 'conflict' ? AlertTriangle :
      status === 'error' ? XCircle : CheckCircle

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ background: `${tk.background}cc`, backdropFilter: BLUR.md }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: tk.background,
          border: `1px solid ${tk.border}`,
          boxShadow: `0 25px 50px -12px ${tk.backgroundAlt}`,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isZh ? '文件同步面板' : 'File Sync Panel'}
        aria-modal="true"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${tk.border}` }}
        >
          <div className="flex items-center gap-3">
            <Wifi size={20} color={statusColor} />
            <h2 style={{ fontFamily: tk.fontMono, fontSize: '16px', color: tk.foreground }}>
              {isZh ? '文件同步' : 'File Sync'}
            </h2>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{
                background: `${statusColor}15`,
                color: statusColor,
                border: `1px solid ${statusColor}33`,
              }}
            >
              {status === 'syncing' && <RefreshCw size={10} className="animate-spin" />}
              <StatusIcon size={12} />
              <span>{getStatusText(status, isZh)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Sync Toggle */}
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all`}
              style={{
                background: isAutoSyncEnabled ? `${tk.success}15` : `${tk.foregroundMuted}10`,
                color: isAutoSyncEnabled ? tk.success : tk.foregroundMuted,
                border: `1px solid ${isAutoSyncEnabled ? `${tk.success}33` : `${tk.borderDim}`}`,
              }}
              onClick={handleToggleAutoSync}
              aria-label={isZh ? '切换自动同步' : 'Toggle auto sync'}
            >
              {isAutoSyncEnabled ? <Pause size={11} /> : <Play size={11} />}
              {isAutoSyncEnabled ? (isZh ? '自动开' : 'Auto ON') : (isZh ? '自动关' : 'Auto OFF')}
            </button>

            {/* Action Buttons */}
            {status === 'idle' && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                style={{
                  background: `${tk.primary}15`,
                  color: tk.primary,
                  border: `1px solid ${tk.primary}33`,
                }}
                onClick={handleStartSync}
                aria-label={isZh ? '开始同步' : 'Start sync'}
              >
                <RefreshCw size={11} />
                {isZh ? '立即同步' : 'Sync Now'}
              </button>
            )}

            {status === 'syncing' && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                style={{
                  background: `${tk.error}15`,
                  color: tk.error,
                  border: `1px solid ${tk.error}33`,
                }}
                onClick={handleAbortSync}
                aria-label={isZh ? '取消同步' : 'Cancel sync'}
              >
                <Pause size={11} />
                {isZh ? '取消' : 'Cancel'}
              </button>
            )}

            <button
              className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
              onClick={onClose}
              aria-label={isZh ? '关闭' : 'Close'}
            >
              <XCircle size={16} color={tk.foregroundMuted} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ background: tk.backgroundAlt, borderBottom: `1px solid ${tk.borderDim}` }}
        >
          <div className="flex items-center gap-6 text-xs" style={{ fontFamily: tk.fontMono }}>
            <div className="flex items-center gap-1.5">
              <FileText size={11} color={tk.primary} />
              <span style={{ color: tk.foregroundMuted }}>{isZh ? '队列' : 'Queue'}:</span>
              <span style={{ color: tk.foreground, fontWeight: 600 }}>{stats.queueLength}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <AlertTriangle size={11} color={tk.error} />
              <span style={{ color: tk.foregroundMuted }}>{isZh ? '冲突' : 'Conflicts'}:</span>
              <span style={{ color: tk.error, fontWeight: 600 }}>{stats.conflictCount}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle size={11} color={tk.success} />
              <span style={{ color: tk.foregroundMuted }}>{isZh ? '已完成' : 'Done'}:</span>
              <span style={{ color: tk.success, fontWeight: 600 }}>{stats.completedCount}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <XCircle size={11} color={tk.warning} />
              <span style={{ color: tk.foregroundMuted }}>{isZh ? '失败' : 'Failed'}:</span>
              <span style={{ color: tk.warning, fontWeight: 600 }}>{stats.failedCount}</span>
            </div>
          </div>

          {lastSyncTime && (
            <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: tk.fontMono, color: tk.foregroundMuted }}>
              <Clock size={11} />
              {isZh ? '上次同步' : 'Last sync'}: {formatTimeAgo(lastSyncTime, isZh)}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex items-center px-6"
          style={{ borderBottom: `1px solid ${tk.borderDim}` }}
        >
          {[
            { id: 'queue', label: isZh ? '同步队列' : 'Sync Queue', count: stats.pendingCount + stats.syncingCount },
            { id: 'conflicts', label: isZh ? '冲突解决' : 'Conflicts', count: stats.conflictCount },
            { id: 'history', label: isZh ? '历史记录' : 'History', count: history.length },
            { id: 'settings', label: isZh ? '设置' : 'Settings', count: 0 },
          ].map(tab => (
            <button
              key={tab.id}
              className={`relative px-4 py-3 text-xs transition-all`}
              style={{
                color: activeTab === tab.id ? tk.primary : tk.foregroundMuted,
                borderBottom: activeTab === tab.id ? `2px solid ${tk.primary}` : '2px solid transparent',
                fontFamily: tk.fontMono,
              }}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]"
                  style={{
                    background: tab.count > 0 ? `${tk.primary}20` : 'transparent',
                    color: tab.count > 0 ? tk.primary : tk.foregroundMuted,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          {activeTab === 'queue' && (
            <SyncQueueContent
              queue={queue}
              onRemove={removeFromQueue}
              onRetry={retryFailedItems}
              onClearCompleted={clearCompletedItems}
              tk={tk}
              isZh={isZh}
            />
          )}

          {activeTab === 'conflicts' && (
            <ConflictsContent
              conflicts={conflicts}
              selectedConflict={selectedConflict}
              onSelectConflict={setSelectedConflict}
              onResolve={handleResolveConflict}
              tk={tk}
              isZh={isZh}
            />
          )}

          {activeTab === 'history' && (
            <HistoryContent history={history} tk={tk} isZh={isZh} />
          )}

          {activeTab === 'settings' && (
            <SettingsContent
              watchedPaths={watchedPaths}
              isAutoSyncEnabled={isAutoSyncEnabled}
              onToggleAutoSync={handleToggleAutoSync}
              tk={tk}
              isZh={isZh}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusText(status: string, isZh: boolean): string {
  const texts: Record<string, { zh: string; en: string }> = {
    idle: { zh: '空闲', en: 'Idle' },
    syncing: { zh: '同步中...', en: 'Syncing...' },
    conflict: { zh: '有冲突', en: 'Conflict' },
    error: { zh: '错误', en: 'Error' },
  }
  return isZh ? texts[status]?.zh || status : texts[status]?.en || status
}

function formatTimeAgo(timestamp: number, isZh: boolean): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return isZh ? `${seconds}秒前` : `${seconds}s ago`
  if (seconds < 3600) return isZh ? `${Math.floor(seconds / 60)}分钟前` : `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return isZh ? `${Math.floor(seconds / 3600)}小时前` : `${Math.floor(seconds / 3600)}h ago`
  return isZh ? `${Math.floor(seconds / 86400)}天前` : `${Math.floor(seconds / 86400)}d ago`
}

function SyncQueueContent({
  queue,
  onRemove,
  onRetry,
  onClearCompleted,
  tk,
  isZh,
}: {
  queue: SyncItem[]
  onRemove: (id: string) => void
  onRetry: () => void
  onClearCompleted: () => void
  tk: ReturnType<typeof useThemeStore>['tokens']
  isZh: boolean
}) {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: tk.foregroundMuted }}>
        <CheckCircle size={48} strokeWidth={1} opacity={0.3} />
        <p className="mt-4 text-sm">{isZh ? '同步队列为空' : 'Sync queue is empty'}</p>
        <p className="text-xs mt-1 opacity-60">{isZh ? '文件变更将自动添加到队列' : 'File changes will be added automatically'}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: tk.foregroundMuted, fontFamily: tk.fontMono }}>
          {queue.length} {isZh ? '个待处理项' : 'items'}
        </span>
        <div className="flex items-center gap-2">
          {queue.some(i => i.status === 'failed') && (
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:bg-white/5"
              style={{ color: tk.warning }}
              onClick={onRetry}
            >
              <RotateCcw size={10} />
              {isZh ? '重试失败项' : 'Retry failed'}
            </button>
          )}
          {queue.some(i => i.status === 'completed') && (
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:bg-white/5"
              style={{ color: tk.foregroundMuted }}
              onClick={onClearCompleted}
            >
              <Trash2 size={10} />
              {isZh ? '清除已完成' : 'Clear done'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {queue.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg group transition-all hover:bg-white/3"
            style={{ border: `1px solid ${tk.borderDim}` }}
          >
            <StatusIndicator status={item.status} tk={tk} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileTypeIcon type={item.type} tk={tk} />
                <span
                  className="truncate text-xs"
                  style={{ fontFamily: tk.fontMono, color: tk.foreground }}
                >
                  {item.path}
                </span>
              </div>
              {item.error && (
                <p className="text-[10px] mt-0.5" style={{ color: tk.error }}>
                  {item.error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {(item.status === 'pending' || item.status === 'failed') && (
                <button
                  className="p-1 rounded hover:bg-white/10 transition-all"
                  onClick={() => onRemove(item.id)}
                  aria-label={isZh ? '移除' : 'Remove'}
                >
                  <XCircle size={12} color={tk.foregroundMuted} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusIndicator({ status, tk }: { status: string; tk: ReturnType<typeof useThemeStore>['tokens'] }) {
  const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: tk.foregroundMuted, icon: Clock, label: 'pending' },
    syncing: { color: tk.primary, icon: RefreshCw, label: 'syncing' },
    completed: { color: tk.success, icon: CheckCircle, label: 'completed' },
    failed: { color: tk.error, icon: XCircle, label: 'failed' },
    conflict: { color: tk.warning, icon: AlertTriangle, label: 'conflict' },
  }

  const { color, icon: Icon, label } = config[status] || config.pending

  return (
    <div
      className="flex items-center justify-center w-6 h-6 rounded-full"
      style={{ background: `${color}15` }}
      title={label}
    >
      <Icon size={11} color={color} className={status === 'syncing' ? 'animate-spin' : ''} />
    </div>
  )
}

function FileTypeIcon({ type, tk }: { type: string; tk: ReturnType<typeof useThemeStore>['tokens'] }) {
  const config: Record<string, { color: string; icon: React.ElementType }> = {
    create: { color: tk.success, icon: FileText },
    modify: { color: tk.primary, icon: FileText },
    delete: { color: tk.error, icon: Trash2 },
  }

  const { color, icon: Icon } = config[type] || config.modify

  return <Icon size={11} color={color} />
}

function ConflictsContent({
  conflicts,
  selectedConflict,
  onSelectConflict,
  onResolve,
  tk,
  isZh,
}: {
  conflicts: SyncConflict[]
  selectedConflict: SyncConflict | null
  onSelectConflict: (c: SyncConflict | null) => void
  onResolve: (id: string, resolution: 'local-win' | 'remote-win') => void
  tk: ReturnType<typeof useThemeStore>['tokens']
  isZh: boolean
}) {
  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: tk.foregroundMuted }}>
        <CheckCircle size={48} strokeWidth={1} opacity={0.3} />
        <p className="mt-4 text-sm">{isZh ? '无冲突' : 'No conflicts'}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {conflicts.map(conflict => (
          <div
            key={conflict.id}
            className={`rounded-lg p-4 transition-all cursor-pointer ${selectedConflict?.id === conflict.id ? 'ring-2' : ''
              }`}
            style={{
              background: selectedConflict?.id === conflict.id ? `${tk.warning}08` : tk.backgroundAlt,
              borderColor: tk.borderDim,
              borderWidth: '1px',
              outline: selectedConflict?.id === conflict.id ? `2px solid ${tk.warning}` : 'none',
              outlineOffset: '-1px',
            }}
            onClick={() => onSelectConflict(conflict)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} color={tk.warning} />
                <span className="text-xs font-medium" style={{ color: tk.foreground, fontFamily: tk.fontMono }}>
                  {conflict.path}
                </span>
              </div>

              {!conflict.resolution && (
                <ChevronDown size={12} color={tk.foregroundMuted}
                  style={{
                    transform: selectedConflict?.id === conflict.id ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}
                />
              )}

              {conflict.resolution && (
                <CheckCircle size={12} color={tk.success} />
              )}
            </div>

            {selectedConflict?.id === conflict.id && !conflict.resolution && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
                <p className="text-xs mb-3" style={{ color: tk.foregroundMuted }}>
                  {isZh ? '选择要保留的版本：' : 'Choose which version to keep:'}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                    style={{
                      background: `${tk.success}10`,
                      color: tk.success,
                      border: `1px solid ${tk.success}30`,
                    }}
                    onClick={(e) => { e.stopPropagation(); onResolve(conflict.id, 'local-win') }}
                  >
                    <ArrowRight size={11} />
                    {isZh ? '使用本地版本' : 'Use Local'}
                  </button>

                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                    style={{
                      background: `${tk.primary}10`,
                      color: tk.primary,
                      border: `1px solid ${tk.primary}30`,
                    }}
                    onClick={(e) => { e.stopPropagation(); onResolve(conflict.id, 'remote-win') }}
                  >
                    <ArrowRight size={11} />
                    {isZh ? '使用远程版本' : 'Use Remote'}
                  </button>
                </div>
              </div>
            )}

            {conflict.resolution && (
              <div className="mt-2 text-xs" style={{ color: tk.success }}>
                ✓ {isZh ? '已解决' : 'Resolved'} ({conflict.resolution})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryContent({
  history,
  tk,
  isZh,
}: {
  history: Array<{ success: boolean; syncedItems: number; conflictedItems: number; failedItems: number; durationMs: number; errors: string[] }>
  tk: ReturnType<typeof useThemeStore>['tokens']
  isZh: boolean
}) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: tk.foregroundMuted }}>
        <Clock size={48} strokeWidth={1} opacity={0.3} />
        <p className="mt-4 text-sm">{isZh ? '暂无历史记录' : 'No history yet'}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2">
      {history.map((result, index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}` }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center`} style={{ background: result.success ? `${tk.success}15` : `${tk.error}15` }}>
            {result.success ? (
              <CheckCircle size={14} color={tk.success} />
            ) : (
              <XCircle size={14} color={tk.error} />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs" style={{ fontFamily: tk.fontMono }}>
              <span style={{ color: tk.foreground }}>
                {result.syncedItems} {isZh ? '已同步' : 'synced'}
              </span>
              {result.conflictedItems > 0 && (
                <span style={{ color: tk.warning }}>
                  {' · '}{result.conflictedItems} {isZh ? '冲突' : 'conflicts'}
                </span>
              )}
              {result.failedItems > 0 && (
                <span style={{ color: tk.error }}>
                  {' · '}{result.failedItems} {isZh ? '失败' : 'failed'}
                </span>
              )}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: tk.foregroundMuted }}>
              {isZh ? '耗时' : 'Duration'}: {result.durationMs}ms
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SettingsContent({
  watchedPaths,
  isAutoSyncEnabled,
  onToggleAutoSync,
  tk,
  isZh,
}: {
  watchedPaths: string[]
  isAutoSyncEnabled: boolean
  onToggleAutoSync: () => void
  tk: ReturnType<typeof useThemeStore>['tokens']
  isZh: boolean
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Auto Sync Setting */}
      <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}` }}>
        <div className="flex items-center gap-3">
          <Settings size={18} color={tk.primary} />
          <div>
            <p className="text-sm font-medium" style={{ color: tk.foreground }}>
              {isZh ? '自动同步' : 'Auto Sync'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: tk.foregroundMuted }}>
              {isZh ? '检测到文件变更时自动同步' : 'Automatically sync when file changes detected'}
            </p>
          </div>
        </div>

        <button
          className={`relative w-12 h-6 rounded-full transition-colors ${isAutoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'
            }`}
          onClick={onToggleAutoSync}
          role="switch"
          aria-checked={isAutoSyncEnabled}
          aria-label={isZh ? '切换自动同步' : 'Toggle auto sync'}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAutoSyncEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
          />
        </button>
      </div>

      {/* Watched Paths */}
      <div className="p-4 rounded-lg" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Wifi size={16} color={tk.primary} />
          <p className="text-sm font-medium" style={{ color: tk.foreground }}>
            {isZh ? '监听路径' : 'Watched Paths'}
          </p>
        </div>

        {watchedPaths.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: tk.foregroundMuted }}>
            {isZh ? '尚未添加监听路径' : 'No paths being watched'}
          </p>
        ) : (
          <div className="space-y-1">
            {watchedPaths.map((path, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                style={{ fontFamily: tk.fontMono, color: tk.foreground, background: tk.background }}
              >
                <FolderOpen size={11} color={tk.primary} />
                <span className="flex-1 truncate">{path}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
