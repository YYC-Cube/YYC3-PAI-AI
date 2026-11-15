/**
 * @file StorageManager.tsx
 * @description 存储管理组件，提供存储监控、清理、备份和恢复功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,management,ui,component
 */

import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  HardDrive,
  Info,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useI18n, type TranslationSection } from '../i18n/context'
import { useThemeStore, type ThemeTokens } from '../store/theme-store'
import { createLogger } from '../utils/logger'
import { backupManager, type BackupInfo } from '../utils/storage-backup'
import { storageCleaner } from '../utils/storage-cleaner'
import { storageMonitor, type StorageAlert, type StorageStats } from '../utils/storage-monitor'

const logger = createLogger('StorageManager')

interface StorageUsageBarProps {
  label: string
  usage: { used: number; total: number; percentage: number; items: number }
  icon: typeof Database
  color: string
  tk: ThemeTokens
}

function StorageUsageBar({ label, usage, icon: Icon, color, tk }: StorageUsageBarProps) {
  const percentage = Math.min(usage.percentage, 100)
  const isWarning = percentage > 80
  const isCritical = percentage > 90

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color }} />
          <span className="text-xs font-medium" style={{ color: tk.foreground }}>
            {label}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: isCritical ? tk.error : isWarning ? tk.warning : tk.foregroundMuted }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: tk.inputBg }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: isCritical ? tk.error : isWarning ? tk.warning : color,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: tk.foregroundMuted }}>
          {(usage.used / 1024 / 1024).toFixed(2)} MB / {(usage.total / 1024 / 1024).toFixed(0)} MB
        </span>
        <span className="text-[10px]" style={{ color: tk.foregroundMuted }}>
          {usage.items} items
        </span>
      </div>
    </div>
  )
}

interface BackupItemProps {
  backup: BackupInfo
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  tk: ThemeTokens
  t: (section: TranslationSection, key: string) => string
}

function BackupItem({ backup, onRestore, onDelete, onExport, tk, t }: BackupItemProps) {
  const date = new Date(backup.timestamp)
  const sizeKB = (backup.size / 1024).toFixed(2)

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border transition-all hover:border-opacity-50"
      style={{
        background: tk.inputBg,
        borderColor: tk.inputBorder,
      }}
    >
      <div className="flex items-center gap-3">
        <Archive size={16} style={{ color: tk.primary }} />
        <div>
          <div className="text-xs font-medium" style={{ color: tk.foreground }}>
            {date.toLocaleString()}
          </div>
          <div className="text-[10px]" style={{ color: tk.foregroundMuted }}>
            {sizeKB} KB · v{backup.version}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onExport(backup.id)}
          className="p-1.5 rounded transition-all hover:opacity-80"
          style={{ background: tk.inputBg, color: tk.foregroundMuted }}
          title={t('settings', 'exportBackup')}
        >
          <Download size={12} />
        </button>
        <button
          onClick={() => onRestore(backup.id)}
          className="p-1.5 rounded transition-all hover:opacity-80"
          style={{ background: tk.inputBg, color: tk.primary }}
          title={t('settings', 'restoreBackup')}
        >
          <Upload size={12} />
        </button>
        <button
          onClick={() => onDelete(backup.id)}
          className="p-1.5 rounded transition-all hover:opacity-80"
          style={{ background: tk.inputBg, color: tk.error }}
          title={t('settings', 'deleteBackup')}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

export function StorageManager() {
  const { tokens: tk } = useThemeStore()
  const { t } = useI18n()
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [alerts, setAlerts] = useState<StorageAlert[]>([])
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [cleaning, setCleaning] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const stats = await storageMonitor.getStats()
      setStats(stats)
    } catch (error) {
      logger.error('[StorageManager] Failed to load stats', error)
    }
  }, [])

  const loadBackups = useCallback(async () => {
    try {
      const backups = await backupManager.listBackups()
      setBackups(backups)
    } catch (error) {
      logger.error('[StorageManager] Failed to load backups', error)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadBackups()

    const unsubscribe = storageMonitor.onAlert((alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 10))
    })

    storageMonitor.startMonitoring(60000)

    return () => {
      unsubscribe()
      storageMonitor.stopMonitoring()
    }
  }, [loadStats, loadBackups])

  const handleCleanExpiredCache = async () => {
    setCleaning(true)
    setMessage(null)
    try {
      const result = await storageCleaner.runPolicy(storageCleaner.getPolicies().find(p => p.id === 'cache-expiry')!)
      if (result.errors.length > 0) {
        setMessage({ type: 'error', text: `Cleaned ${result.cleaned} items, but ${result.errors.length} errors occurred` })
      } else {
        setMessage({ type: 'success', text: `Cleaned ${result.cleaned} items, freed ${(result.freedBytes / 1024).toFixed(2)} KB` })
      }
      await loadStats()
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to clean: ${error}` })
    } finally {
      setCleaning(false)
    }
  }

  const handleCleanOldData = async () => {
    setCleaning(true)
    setMessage(null)
    try {
      const result = await storageCleaner.runPolicy(storageCleaner.getPolicies().find(p => p.id === 'old-sync-records')!)
      if (result.errors.length > 0) {
        setMessage({ type: 'error', text: `Cleaned ${result.cleaned} items, but ${result.errors.length} errors occurred` })
      } else {
        setMessage({ type: 'success', text: `Cleaned ${result.cleaned} items older than 30 days, freed ${(result.freedBytes / 1024).toFixed(2)} KB` })
      }
      await loadStats()
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to clean: ${error}` })
    } finally {
      setCleaning(false)
    }
  }

  const handleCleanLowPriority = async () => {
    setCleaning(true)
    setMessage(null)
    try {
      const result = await storageCleaner.runPolicy(storageCleaner.getPolicies().find(p => p.id === 'low-priority-clean')!)
      if (result.errors.length > 0) {
        setMessage({ type: 'error', text: `Cleaned ${result.cleaned} items, but ${result.errors.length} errors occurred` })
      } else {
        setMessage({ type: 'success', text: `Cleaned ${result.cleaned} low priority items, freed ${(result.freedBytes / 1024).toFixed(2)} KB` })
      }
      await loadStats()
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to clean: ${error}` })
    } finally {
      setCleaning(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    setMessage(null)
    try {
      await backupManager.createBackup()
      setMessage({ type: 'success', text: 'Backup created successfully' })
      await loadBackups()
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to create backup: ${error}` })
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    setMessage(null)
    try {
      const result = await backupManager.restoreBackup(backupId)
      if (result.success) {
        setMessage({ type: 'success', text: `Restored ${result.restored} items successfully` })
        await loadStats()
      } else {
        setMessage({ type: 'error', text: `Restore failed: ${result.errors.join(', ')}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to restore backup: ${error}` })
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await backupManager.deleteBackup(backupId)
      setMessage({ type: 'success', text: 'Backup deleted successfully' })
      await loadBackups()
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to delete backup: ${error}` })
    }
  }

  const handleExportBackup = async (backupId: string) => {
    try {
      const backupString = await backupManager.exportBackup(backupId)
      const blob = new Blob([backupString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yyc3-backup-${backupId}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Backup exported successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to export backup: ${error}` })
    }
  }

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = await backupManager.importBackup(text)
      if (result.success) {
        setMessage({ type: 'success', text: 'Backup imported successfully' })
        await loadBackups()
      } else {
        setMessage({ type: 'error', text: `Import failed: ${result.errors.join(', ')}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to import backup: ${error}` })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: tk.background }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: tk.foreground }}>
            <Database size={20} style={{ color: tk.primary }} />
            {t('settings', 'storageManagement')}
          </h2>
          <button
            onClick={loadStats}
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: tk.inputBg, color: tk.foregroundMuted }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {message && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg border"
            style={{
              background: message.type === 'success' ? `${tk.success}10` : message.type === 'error' ? `${tk.error}10` : `${tk.primary}10`,
              borderColor: message.type === 'success' ? tk.success : message.type === 'error' ? tk.error : tk.primary,
              color: message.type === 'success' ? tk.success : message.type === 'error' ? tk.error : tk.primary,
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : message.type === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
            <span className="text-xs">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg border"
                style={{
                  background: alert.level === 'critical' ? `${tk.error}10` : `${tk.warning}10`,
                  borderColor: alert.level === 'critical' ? tk.error : tk.warning,
                  color: alert.level === 'critical' ? tk.error : tk.warning,
                }}
              >
                <AlertTriangle size={16} />
                <span className="text-xs">{alert.message}</span>
                <span className="text-[10px] ml-auto" style={{ color: tk.foregroundMuted }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div
            className="p-4 rounded-lg border"
            style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: tk.foreground }}>
              <Activity size={16} style={{ color: tk.primary }} />
              {t('settings', 'storageUsage')}
            </h3>

            <StorageUsageBar
              label="localStorage"
              usage={stats.localStorage}
              icon={HardDrive}
              color="#00f0ff"
              tk={tk}
            />

            <StorageUsageBar
              label="IndexedDB"
              usage={stats.indexedDB}
              icon={Database}
              color="#39ff14"
              tk={tk}
            />

            <StorageUsageBar
              label="Memory Cache"
              usage={stats.memoryCache}
              icon={FileText}
              color="#f5a623"
              tk={tk}
            />

            <div className="mt-4 pt-4 border-t" style={{ borderColor: tk.cardBorder }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: tk.foregroundMuted }}>Total Used</span>
                <span className="font-mono" style={{ color: tk.foreground }}>
                  {(stats.totalUsed / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          className="p-4 rounded-lg border"
          style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
        >
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: tk.foreground }}>
            <Trash2 size={16} style={{ color: tk.warning }} />
            {t('settings', 'storageCleanup')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleCleanExpiredCache}
              disabled={cleaning}
              className="p-3 rounded-lg border transition-all hover:border-opacity-50 disabled:opacity-50"
              style={{ background: tk.inputBg, borderColor: tk.inputBorder }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} style={{ color: tk.warning }} />
                <span className="text-xs font-medium" style={{ color: tk.foreground }}>
                  {t('settings', 'cleanExpired')}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: tk.foregroundMuted }}>
                {t('settings', 'cleanExpiredDesc')}
              </p>
            </button>

            <button
              onClick={handleCleanOldData}
              disabled={cleaning}
              className="p-3 rounded-lg border transition-all hover:border-opacity-50 disabled:opacity-50"
              style={{ background: tk.inputBg, borderColor: tk.inputBorder }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} style={{ color: tk.warning }} />
                <span className="text-xs font-medium" style={{ color: tk.foreground }}>
                  {t('settings', 'cleanOld')}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: tk.foregroundMuted }}>
                {t('settings', 'cleanOldDesc')}
              </p>
            </button>

            <button
              onClick={handleCleanLowPriority}
              disabled={cleaning}
              className="p-3 rounded-lg border transition-all hover:border-opacity-50 disabled:opacity-50"
              style={{ background: tk.inputBg, borderColor: tk.inputBorder }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Archive size={14} style={{ color: tk.warning }} />
                <span className="text-xs font-medium" style={{ color: tk.foreground }}>
                  {t('settings', 'cleanLowPriority')}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: tk.foregroundMuted }}>
                {t('settings', 'cleanLowPriorityDesc')}
              </p>
            </button>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: tk.foreground }}>
              <Shield size={16} style={{ color: tk.primary }} />
              {t('settings', 'backupRestore')}
            </h3>
            <div className="flex items-center gap-2">
              <label
                className="p-2 rounded-lg transition-all hover:opacity-80 cursor-pointer"
                style={{ background: tk.inputBg, color: tk.foregroundMuted }}
              >
                <Upload size={14} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: tk.primary, color: tk.background }}
              >
                {creatingBackup ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              </button>
            </div>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Archive size={32} style={{ color: tk.foregroundMuted }} className="mx-auto mb-2" />
              <p className="text-xs" style={{ color: tk.foregroundMuted }}>
                {t('settings', 'noBackups')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {backups.map((backup) => (
                <BackupItem
                  key={backup.id}
                  backup={backup}
                  onRestore={handleRestoreBackup}
                  onDelete={handleDeleteBackup}
                  onExport={handleExportBackup}
                  tk={tk}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
        >
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: tk.foreground }}>
            <Settings size={16} style={{ color: tk.primary }} />
            {t('settings', 'storageSettings')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium" style={{ color: tk.foreground }}>
                  {t('settings', 'autoBackup')}
                </div>
                <div className="text-[10px]" style={{ color: tk.foregroundMuted }}>
                  {t('settings', 'autoBackupDesc')}
                </div>
              </div>
              <button
                onClick={() => backupManager.scheduleAutoBackup(24 * 60 * 60 * 1000)}
                className="px-3 py-1 rounded text-[10px] transition-all hover:opacity-80"
                style={{ background: tk.primary, color: tk.background }}
              >
                {t('settings', 'enable')}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium" style={{ color: tk.foreground }}>
                  {t('settings', 'autoClean')}
                </div>
                <div className="text-[10px]" style={{ color: tk.foregroundMuted }}>
                  {t('settings', 'autoCleanDesc')}
                </div>
              </div>
              <button
                onClick={() => storageCleaner.startAutoClean(24 * 60 * 60 * 1000)}
                className="px-3 py-1 rounded text-[10px] transition-all hover:opacity-80"
                style={{ background: tk.primary, color: tk.background }}
              >
                {t('settings', 'enable')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
