/**
 * @file EnhancedBackupRestorePanel.tsx
 * @description 增强版数据库备份恢复面板，集成完整备份恢复服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Download,
  Loader2,
  Play,
  RotateCcw,
  Settings,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  getDatabaseBackupService,
  type BackupOptions,
  type BackupProgress,
  type RestorePreview,
  type RestoreProgress,
} from '../services/database-backup-service'
import { dbStoreActions, useDBStore } from '../store/db-store'
import { type ThemeTokens } from '../store/theme-store'
import { createLogger } from '../utils/logger'
import { cyberToast } from './CyberToast'
import { CyberTooltip } from './CyberTooltip'

const logger = createLogger('EnhancedBackupRestorePanel')

const TYPE_COLORS: Record<string, string> = { postgres: '#336791', mysql: '#00758f', redis: '#dc382d' }
const TYPE_LABELS: Record<string, string> = { postgres: 'PostgreSQL', mysql: 'MySQL', redis: 'Redis' }

interface EnhancedBackupRestorePanelProps {
  tk: ThemeTokens
  isZh: boolean
}

export function EnhancedBackupRestorePanel({ tk, isZh }: EnhancedBackupRestorePanelProps) {
  const { activeConnId, backups, profiles } = useDBStore()
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null)
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<RestorePreview | null>(null)

  const activeProfile = profiles.find(p => p.id === activeConnId)

  const backupOptions: BackupOptions = useMemo(() => ({
    includeSchema: true,
    includeData: true,
    format: 'sql' as const,
    compress: true,
  }), [])

  const handleBackup = useCallback(async () => {
    if (!activeConnId) return

    setBackingUp(true)
    setBackupProgress(null)

    try {
      const service = getDatabaseBackupService()
      const result = await service.executeBackup(
        activeConnId,
        backupOptions,
        (progress) => {
          setBackupProgress(progress as BackupProgress)
        }
      )

      if (result.success) {
        cyberToast(
          isZh
            ? `✅ 备份完成: ${result.fileName} (${(result.sizeBytes / 1024 / 1024).toFixed(2)}MB)`
            : `✅ Backup completed: ${result.fileName} (${(result.sizeBytes / 1024 / 1024).toFixed(2)}MB)`
        )
      } else {
        cyberToast(isZh ? `❌ 备份失败: ${result.error}` : `❌ Backup failed: ${result.error}`)
      }
    } catch (error) {
      cyberToast(isZh ? `❌ 备份异常: ${(error as Error).message}` : `❌ Backup error: ${(error as Error).message}`)
    } finally {
      setBackingUp(false)
      setTimeout(() => setBackupProgress(null), 3000)
    }
  }, [activeConnId, backupOptions, isZh])

  const handleRestorePreview = useCallback(async (backupId: string) => {
    if (!activeConnId) return

    try {
      const service = getDatabaseBackupService()
      const backup = backups.find(b => b.id === backupId)
      if (!backup) return

      const preview = await service.getRestorePreview(activeConnId, backupId, backup.filename, backup.sizeBytes)
      setPreviewData(preview)
      setShowPreview(backupId)
    } catch {
      cyberToast(isZh ? `❌ 获取恢复预览失败` : `❌ Failed to get restore preview`)
    }
  }, [activeConnId, backups, isZh])

  const handleRestore = useCallback(async (backupId: string) => {
    if (!activeConnId || !previewData) return

    setRestoring(backupId)
    setRestoreProgress(null)

    try {
      const service = getDatabaseBackupService()
      const result = await service.executeRestore(
        activeConnId,
        backupId,
        previewData,
        (progress) => {
          setRestoreProgress(progress as RestoreProgress)
        }
      )

      if (result.success) {
        cyberToast(
          isZh
            ? `✅ 恢复完成: ${result.restoredTables.length} 个表, ${result.restoredRecords} 条记录`
            : `✅ Restore completed: ${result.restoredTables.length} tables, ${result.restoredRecords} records`
        )
        if (result.warnings.length > 0) {
          logger.warn('Restore warnings:', result.warnings)
        }
      } else {
        cyberToast(isZh ? `❌ 恢复失败: ${result.error}` : `❌ Restore failed: ${result.error}`)
      }
    } catch (error) {
      cyberToast(isZh ? `❌ 恢复异常: ${(error as Error).message}` : `❌ Restore error: ${(error as Error).message}`)
    } finally {
      setRestoring(null)
      setShowPreview(null)
      setPreviewData(null)
      setTimeout(() => setRestoreProgress(null), 3000)
    }
  }, [activeConnId, previewData, isZh])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Download size={11} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
          {isZh ? '备份与恢复' : 'Backup & Restore'}
        </span>
        {activeProfile && (
          <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: activeProfile.color, background: `${activeProfile.color}12` }}>
            {activeProfile.name}
          </span>
        )}

        <button
          className="ml-auto flex items-center gap-1 px-1 rounded transition-all hover:bg-white/10"
          onClick={() => setShowOptions(!showOptions)}
        >
          <Settings size={9} color={tk.foregroundMuted} />
        </button>

        <button
          className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
          style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success, background: `${tk.success}12`, border: `1px solid ${tk.success}33` }}
          onClick={handleBackup}
          disabled={backingUp || !activeConnId}
        >
          {backingUp ? <Loader2 size={9} className="animate-spin" /> : <Download size={9} />}
          {isZh ? '立即备份' : 'Backup Now'}
        </button>
      </div>

      {/* Progress Bar - Backup or Restore */}
      {(backupProgress || restoreProgress) && (
        <div className="px-3 py-2 shrink-0" style={{ background: `${tk.primary}08`, borderBottom: `1px solid ${tk.borderDim}` }}>
          <div className="flex items-center gap-2 mb-1">
            {backupProgress?.phase === 'error' || restoreProgress?.phase === 'error' ? (
              <XCircle size={10} color={tk.error} />
            ) : backupProgress?.phase === 'completed' || restoreProgress?.phase === 'completed' ? (
              <CheckCircle size={10} color={tk.success} />
            ) : (
              <Loader2 size={10} color={tk.primary} className="animate-spin" />
            )}
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foreground }}>
              {backupProgress?.message || restoreProgress?.message}
            </span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: `${tk.borderDim}33` }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${backupProgress?.percentComplete || restoreProgress?.percentComplete || 0}%`,
                background: tk.primary,
                boxShadow: `0 0 6px ${tk.primary}`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
              {backupProgress?.currentTable || restoreProgress?.currentTable || ''}
            </span>
            <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
              {backupProgress?.percentComplete || restoreProgress?.percentComplete || 0}%
            </span>
          </div>
        </div>
      )}

      {/* Options Panel */}
      {showOptions && (
        <div className="px-3 py-2 shrink-0" style={{ background: `${tk.background}99`, borderBottom: `1px solid ${tk.borderDim}` }}>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
            <label className="flex items-center gap-1">
              <input type="checkbox" defaultChecked disabled />
              <span>{isZh ? '包含Schema' : 'Include Schema'}</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" defaultChecked disabled />
              <span>{isZh ? '包含数据' : 'Include Data'}</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" defaultChecked disabled />
              <span>{isZh ? 'Gzip压缩' : 'Compress'}</span>
            </label>
            <div className="flex items-center gap-1">
              <span>Format:</span>
              <select disabled className="px-1 rounded" style={{ background: tk.background, border: `1px solid ${tk.borderDim}`, color: tk.foreground }}>
                <option value="sql">SQL</option>
                <option value="csv">CSV</option>
                <option value="binary">Binary</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Restore Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg mx-4 rounded-lg p-4" style={{ background: tk.background, border: `1px solid ${tk.primary}44`, boxShadow: `0 0 30px ${tk.primary}22` }}>
            <div className="flex items-center gap-2 mb-3" style={{ borderBottom: `1px solid ${tk.borderDim}`, paddingBottom: 8 }}>
              <AlertTriangle size={14} color={tk.warning} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 600 }}>
                {isZh ? '⚠️ 恢复确认' : '⚠️ Restore Confirmation'}
              </span>
            </div>

            <div className="space-y-2 mb-4" style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>{isZh ? '备份文件:' : 'File:'}</span>
                <span style={{ color: tk.foreground }}>{previewData.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>{isZh ? '表数量:' : 'Tables:'}</span>
                <span style={{ color: tk.foreground }}>{previewData.tableCount}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>{isZh ? '预估记录数:' : 'Est. Records:'}</span>
                <span style={{ color: tk.foreground }}>{previewData.estimatedRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: tk.foregroundMuted }}>{isZh ? '文件大小:' : 'Size:'}</span>
                <span style={{ color: tk.foreground }}>{formatSize(previewData.sizeBytes)}</span>
              </div>

              {previewData.willDropExisting && (
                <div className="p-2 rounded mt-2" style={{ background: `${tk.error}12`, border: `1px solid ${tk.error}33` }}>
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle size={10} color={tk.error} />
                    <span style={{ color: tk.error }}>{isZh ? '警告!' : 'Warning!'}</span>
                  </div>
                  <span style={{ color: tk.error, opacity: 0.8 }}>
                    {isZh ? '此操作将删除现有数据并替换为备份数据！' : 'This will DROP existing data and replace with backup!'}
                  </span>
                </div>
              )}

              {previewData.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {previewData.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-1 p-1.5 rounded" style={{ background: `${tk.warning}08`, borderLeft: `2px solid ${tk.warning}` }}>
                      <AlertTriangle size={8} color={tk.warning} className="shrink-0 mt-0.5" />
                      <span style={{ color: tk.warning, opacity: 0.8 }}>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded transition-all"
                style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, background: `${tk.borderDim}22`, border: `1px solid ${tk.borderDim}44` }}
                onClick={() => { setShowPreview(null); setPreviewData(null) }}
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded transition-all hover:opacity-80"
                style={{ fontFamily: tk.fontMono, fontSize: '9px', color: '#fff', background: tk.error, border: `1px solid ${tk.error}`, boxShadow: `0 0 10px ${tk.error}44` }}
                onClick={() => handleRestore(showPreview)}
                disabled={!!restoring}
              >
                {restoring ? <Loader2 size={9} className="animate-spin" /> : <Play size={9} />}
                {isZh ? '确认恢复' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup List */}
      <div className="flex-1 overflow-y-auto neon-scrollbar">
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Download size={24} color={tk.borderDim} className="mb-2" />
            <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
              {isZh ? '暂无备份记录' : 'No backup records'}
            </span>
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, opacity: 0.5, marginTop: 4 }}>
              {isZh ? '点击"立即备份"创建第一个备份' : 'Click "Backup Now" to create your first backup'}
            </span>
          </div>
        ) : backups.map(backup => (
          <div key={backup.id} className="flex items-center gap-3 px-3 py-2.5 border-b transition-all hover:bg-white/2" style={{ borderColor: `${tk.borderDim}08` }}>
            <div className="shrink-0">
              {backup.status === 'completed' ? <CheckCircle size={12} color={tk.success} /> :
                backup.status === 'failed' ? <XCircle size={12} color={tk.error} /> :
                  <Loader2 size={12} color={tk.warning} className="animate-spin" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{backup.filename}</span>
                <span className="px-1 py-0.5 rounded shrink-0" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: TYPE_COLORS[backup.type], background: `${TYPE_COLORS[backup.type]}12` }}>
                  {TYPE_LABELS[backup.type]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                  {new Date(backup.timestamp).toLocaleString()}
                </span>
                {backup.sizeBytes > 0 && (
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                    {formatSize(backup.sizeBytes)}
                  </span>
                )}
                {backup.error && (
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.error }}>{backup.error}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {backup.status === 'completed' && (
                <>
                  <CyberTooltip label={isZh ? '预览恢复' : 'Preview Restore'} position="left">
                    <button
                      className="p-1 rounded hover:bg-white/10 transition-all"
                      onClick={() => handleRestorePreview(backup.id)}
                      disabled={!activeConnId}
                    >
                      <ChevronRight size={10} color={tk.primary} />
                    </button>
                  </CyberTooltip>
                  <CyberTooltip label={isZh ? '直接恢复' : 'Quick Restore'} position="left">
                    <button
                      className="p-1 rounded hover:bg-white/10 transition-all"
                      onClick={() => handleRestorePreview(backup.id)}
                      disabled={restoring === backup.id || !activeConnId}
                    >
                      {restoring === backup.id ? <Loader2 size={10} color={tk.warning} className="animate-spin" /> : <RotateCcw size={10} color={tk.warning} />}
                    </button>
                  </CyberTooltip>
                </>
              )}
              <CyberTooltip label={isZh ? '删除' : 'Delete'} position="left">
                <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={() => dbStoreActions.removeBackup(backup.id)}>
                  <Trash2 size={10} color={tk.error} style={{ opacity: 0.5 }} />
                </button>
              </CyberTooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EnhancedBackupRestorePanel
