/**
 * @file UnifiedDataPanel.tsx
 * @description 统一数据管理面板 - 一人一端数据主权核心UI
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @updated 2026-04-08
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags unified,data,panel,sovereignty,privacy
 */

import {
  Archive,
  Database,
  Download,
  Eye, EyeOff,
  FileText,
  FolderSync,
  HardDrive,
  Key,
  Lock,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Unlock,
  Upload,
  X, Zap
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n/context'
import { useThemeStore } from '../store/theme-store'
import { useUnifiedDataStore, type DataEntry, type DataType } from '../store/unified-data-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('UnifiedDataPanel')

// ============================================================================
// 子组件
// ============================================================================

/**
 * 数据概览卡片
 */
const DataOverviewCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  onClick?: () => void
}> = ({ title, value, subtitle, icon, color, onClick }) => {
  const { tokens } = useThemeStore()

  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '11px', color: tokens.foregroundMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: tokens.foreground }}>
            {value}
          </div>
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

/**
 * 存储配额条
 */
const StorageQuotaBar: React.FC<{
  used: number
  total: number
  label: string
  color: string
}> = ({ used, total, label, color }) => {
  const { tokens } = useThemeStore()
  const percentage = total > 0 ? (used / total) * 100 : 0
  const usedMB = (used / 1024 / 1024).toFixed(2)
  const totalMB = (total / 1024 / 1024).toFixed(2)

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: tokens.foreground }}>{label}</span>
        <span style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
          {usedMB} MB / {totalMB} MB
        </span>
      </div>
      <div style={{
        height: '6px',
        background: tokens.borderDim,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(percentage, 100)}%`,
          height: '100%',
          background: percentage > 80 ? tokens.error : color,
          borderRadius: '3px',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}

/**
 * 数据条目行
 */
const DataEntryRow: React.FC<{
  entry: DataEntry
  selected: boolean
  onToggleSelect: () => void
  onDelete: () => void
  onEncrypt: () => void
  onSync: () => void
}> = ({ entry, selected, onToggleSelect, onDelete, onEncrypt, onSync }) => {
  const { tokens } = useThemeStore()
  const { t } = useI18n()

  const getTypeIcon = (type: DataType) => {
    switch (type) {
      case 'settings': return <Settings size={14} />
      case 'models': return <Zap size={14} />
      case 'files': return <FileText size={14} />
      case 'keys': return <Key size={14} />
      case 'sync-records': return <FolderSync size={14} />
      case 'backups': return <Archive size={14} />
      default: return <Database size={14} />
    }
  }

  const getStatusColor = () => {
    switch (entry.status) {
      case 'synced': return tokens.success
      case 'pending': return tokens.warning
      case 'conflict': return tokens.error
      case 'error': return tokens.error
      case 'encrypted': return tokens.primary
      default: return tokens.foregroundMuted
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      background: selected ? `${tokens.primary}10` : 'transparent',
      border: `1px solid ${selected ? tokens.primary : 'transparent'}`,
      borderRadius: '8px',
      marginBottom: '4px',
      transition: 'all 0.15s',
    }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
      />

      <div style={{ color: tokens.foregroundMuted }}>
        {getTypeIcon(entry.type)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          color: tokens.foreground,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {entry.path || entry.id}
        </div>
        <div style={{
          fontSize: '11px',
          color: tokens.foregroundMuted,
          display: 'flex',
          gap: '8px',
          marginTop: '2px',
        }}>
          <span>{entry.type}</span>
          <span>•</span>
          <span>{formatSize(entry.size)}</span>
          <span>•</span>
          <span>{entry.location}</span>
          {entry.encrypted && (
            <>
              <span>•</span>
              <span style={{ color: tokens.primary }}>🔒 {t('unifiedData', 'encrypted')}</span>
            </>
          )}
        </div>
      </div>

      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: getStatusColor(),
      }} />

      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={onSync}
          title={t('unifiedData', 'sync')}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: tokens.foregroundMuted,
          }}
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={onEncrypt}
          title={entry.encrypted ? t('unifiedData', 'decrypt') : t('unifiedData', 'encrypt')}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: entry.encrypted ? tokens.success : tokens.foregroundMuted,
          }}
        >
          {entry.encrypted ? <Unlock size={14} /> : <Lock size={14} />}
        </button>
        <button
          onClick={onDelete}
          title={t('unifiedData', 'delete')}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: tokens.error,
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// 主组件
// ============================================================================

export const UnifiedDataPanel: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { tokens, isCyberpunk } = useThemeStore()
  const { t } = useI18n()
  const {
    entries, totalSize, totalEntries, quotas, sync, security, portability,
    activeTab, searchQuery, selectedEntries,
    initialize, scanData, syncAll, syncEntry,
    removeData, exportData, importData, setSensitive, getSensitive,
    setActiveTab, setSearchQuery, toggleEntrySelection, selectAllEntries, clearSelection,
  } = useUnifiedDataStore()

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [passphraseModal, setPassphraseModal] = useState<{ id: string; action: 'encrypt' | 'decrypt' } | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)

  useEffect(() => {
    if (isOpen) {
      initialize()
    }
  }, [isOpen, initialize])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const blob = await exportData('json', { entries: selectedEntries.length > 0 ? selectedEntries : undefined })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yyc3-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [exportData, selectedEntries])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      await importData(file)
      await scanData()
    } catch (error) {
      logger.error('Import failed:', error)
    } finally {
      setIsImporting(false)
    }
  }, [importData, scanData])

  const handlePassphraseSubmit = useCallback(async () => {
    if (!passphraseModal) return

    try {
      if (passphraseModal.action === 'encrypt') {
        // 加密操作：使用 setSensitive 存储加密数据
        const entry = entries.find(e => e.id === passphraseModal.id)
        if (entry?.path) {
          const value = localStorage.getItem(entry.path)
          if (value) {
            // 将敏感数据转存到安全存储
            await setSensitive(entry.path, value, { type: 'secret' })
          }
        }
      } else {
        // 解密操作：从安全存储移除，存回本地
        // （实际解密由 SecureStorage 透明处理）
        const entry = entries.find(e => e.id === passphraseModal.id)
        if (entry?.path) {
          const value = await getSensitive(entry.path)
          if (value !== null) {
            localStorage.setItem(entry.path, value)
          }
        }
      }
      setPassphraseModal(null)
      setPassphrase('')
    } catch (error) {
      logger.error('Passphrase operation failed:', error)
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 稳定引用/快照语义，入依赖改变重建行为
  }, [passphraseModal, passphrase, entries, setSensitive, getSensitive])

  const filteredEntries = entries.filter(e =>
    searchQuery === '' ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.path && e.path.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isCyberpunk ? `0 0 40px ${tokens.primary}30` : '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${tokens.borderDim}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: tokens.foreground,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Database size={22} style={{ color: tokens.primary }} />
              {t('unifiedData', 'title')}
            </h2>
            <p style={{
              fontSize: '12px',
              color: tokens.foregroundMuted,
              margin: '4px 0 0 0',
            }}>
              {t('unifiedData', 'subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tokens.foregroundMuted,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 24px',
          borderBottom: `1px solid ${tokens.borderDim}`,
        }}>
          {(['overview', 'sync', 'security', 'portability'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab ? `${tokens.primary}15` : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? tokens.primary : tokens.foregroundMuted,
                transition: 'all 0.15s',
              }}
            >
              {t('unifiedData', tab)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 24px',
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <DataOverviewCard
                  title={t('unifiedData', 'totalData')}
                  value={formatBytes(totalSize)}
                  icon={<Database size={18} style={{ color: tokens.primary }} />}
                  color={tokens.primary}
                />
                <DataOverviewCard
                  title={t('unifiedData', 'totalEntries')}
                  value={totalEntries}
                  icon={<FileText size={18} style={{ color: tokens.success }} />}
                  color={tokens.success}
                />
                <DataOverviewCard
                  title={t('unifiedData', 'pendingSync')}
                  value={sync.pending}
                  subtitle={sync.isSyncing ? t('unifiedData', 'syncing') : undefined}
                  icon={<RefreshCw size={18} style={{ color: tokens.warning }} />}
                  color={tokens.warning}
                  onClick={() => setActiveTab('sync')}
                />
                <DataOverviewCard
                  title={t('unifiedData', 'securityScore')}
                  value={`${security.securityScore}%`}
                  icon={<Shield size={18} style={{ color: security.securityScore > 80 ? tokens.success : tokens.warning }} />}
                  color={security.securityScore > 80 ? tokens.success : tokens.warning}
                  onClick={() => setActiveTab('security')}
                />
              </div>

              {/* Storage Quotas */}
              <div style={{
                background: tokens.cardBg,
                border: `1px solid ${tokens.cardBorder}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: tokens.foreground,
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <HardDrive size={16} />
                  {t('unifiedData', 'storageQuota')}
                </h3>
                {quotas.map(quota => (
                  <StorageQuotaBar
                    key={quota.location}
                    used={quota.used}
                    total={quota.total}
                    label={quota.location.toUpperCase()}
                    color={tokens.primary}
                  />
                ))}
              </div>

              {/* Data Entries */}
              <div style={{
                background: tokens.cardBg,
                border: `1px solid ${tokens.cardBorder}`,
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: tokens.foreground,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Database size={16} />
                    {t('unifiedData', 'dataEntries')}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <Search size={14} style={{
                        position: 'absolute',
                        left: '10px',
                        color: tokens.foregroundMuted,
                      }} />
                      <input
                        type="text"
                        placeholder={t('unifiedData', 'search')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                          padding: '6px 10px 6px 32px',
                          background: tokens.background,
                          border: `1px solid ${tokens.borderDim}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: tokens.foreground,
                          width: '200px',
                        }}
                      />
                    </div>
                    <button
                      onClick={selectedEntries.length === filteredEntries.length ? clearSelection : selectAllEntries}
                      style={{
                        padding: '6px 12px',
                        background: tokens.background,
                        border: `1px solid ${tokens.borderDim}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: tokens.foregroundMuted,
                        cursor: 'pointer',
                      }}
                    >
                      {selectedEntries.length === filteredEntries.length
                        ? t('unifiedData', 'deselectAll')
                        : t('unifiedData', 'selectAll')}
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {filteredEntries.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: tokens.foregroundMuted,
                    }}>
                      {t('unifiedData', 'noData')}
                    </div>
                  ) : (
                    filteredEntries.map(entry => (
                      <DataEntryRow
                        key={entry.id}
                        entry={entry}
                        selected={selectedEntries.includes(entry.id)}
                        onToggleSelect={() => toggleEntrySelection(entry.id)}
                        onDelete={() => removeData(entry.path || entry.id)}
                        onEncrypt={() => setPassphraseModal({ id: entry.id, action: entry.encrypted ? 'decrypt' : 'encrypt' })}
                        onSync={() => syncEntry(entry.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: tokens.foreground, margin: 0 }}>
                    {t('unifiedData', 'syncStatus')}
                  </h3>
                  <p style={{ fontSize: '12px', color: tokens.foregroundMuted, margin: '4px 0 0 0' }}>
                    {sync.lastSync
                      ? `${t('unifiedData', 'lastSync')}: ${new Date(sync.lastSync).toLocaleString()}`
                      : t('unifiedData', 'neverSynced')}
                  </p>
                </div>
                <button
                  onClick={syncAll}
                  disabled={sync.isSyncing}
                  style={{
                    padding: '10px 20px',
                    background: tokens.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: sync.isSyncing ? 'not-allowed' : 'pointer',
                    opacity: sync.isSyncing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RefreshCw size={16} className={sync.isSyncing ? 'animate-spin' : ''} />
                  {sync.isSyncing ? t('unifiedData', 'syncing') : t('unifiedData', 'syncAll')}
                </button>
              </div>

              {sync.isSyncing && (
                <div style={{
                  background: `${tokens.primary}10`,
                  border: `1px solid ${tokens.primary}30`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <RefreshCw size={18} style={{ color: tokens.primary }} className="animate-spin" />
                    <span style={{ fontSize: '14px', color: tokens.foreground }}>
                      {t('unifiedData', 'syncingProgress')}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: tokens.primary }}>
                      {Math.round(sync.progress)}%
                    </span>
                  </div>
                  <div style={{
                    height: '4px',
                    background: tokens.borderDim,
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${sync.progress}%`,
                      height: '100%',
                      background: tokens.primary,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: tokens.warning }}>
                    {sync.pending}
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.foregroundMuted, marginTop: '4px' }}>
                    {t('unifiedData', 'pendingItems')}
                  </div>
                </div>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: tokens.error }}>
                    {sync.conflicts}
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.foregroundMuted, marginTop: '4px' }}>
                    {t('unifiedData', 'conflicts')}
                  </div>
                </div>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: tokens.error }}>
                    {sync.errors}
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.foregroundMuted, marginTop: '4px' }}>
                    {t('unifiedData', 'errors')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <div style={{
                background: `${tokens.primary}10`,
                border: `1px solid ${tokens.primary}30`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}>
                  <Shield size={24} style={{ color: tokens.primary }} />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: tokens.foreground, margin: 0 }}>
                      {t('unifiedData', 'securityStatus')}
                    </h3>
                    <p style={{ fontSize: '12px', color: tokens.foregroundMuted, margin: '4px 0 0 0' }}>
                      {t('unifiedData', 'securityDescription')}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    background: tokens.borderDim,
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${security.securityScore}%`,
                      height: '100%',
                      background: security.securityScore > 80 ? tokens.success : tokens.warning,
                    }} />
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: security.securityScore > 80 ? tokens.success : tokens.warning,
                  }}>
                    {security.securityScore}%
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {security.vaultLocked ? <Lock size={16} style={{ color: tokens.warning }} /> : <Unlock size={16} style={{ color: tokens.success }} />}
                    <span style={{ fontSize: '14px', fontWeight: 500, color: tokens.foreground }}>
                      {t('unifiedData', 'vaultStatus')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.foregroundMuted }}>
                    {security.vaultLocked ? t('unifiedData', 'vaultLocked') : t('unifiedData', 'vaultUnlocked')}
                  </div>
                </div>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Key size={16} style={{ color: tokens.primary }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: tokens.foreground }}>
                      {t('unifiedData', 'keyDerivation')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.foregroundMuted }}>
                    {security.keyDerivationIterations.toLocaleString()} {t('unifiedData', 'iterations')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portability' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
              }}>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Download size={20} style={{ color: tokens.primary }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: tokens.foreground, margin: 0 }}>
                      {t('unifiedData', 'exportData')}
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: tokens.foregroundMuted, marginBottom: '16px' }}>
                    {t('unifiedData', 'exportDescription')}
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: tokens.primary,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      opacity: isExporting ? 0.7 : 1,
                    }}
                  >
                    {isExporting ? t('unifiedData', 'exporting') : t('unifiedData', 'export')}
                  </button>
                </div>
                <div style={{
                  background: tokens.cardBg,
                  border: `1px solid ${tokens.cardBorder}`,
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Upload size={20} style={{ color: tokens.success }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: tokens.foreground, margin: 0 }}>
                      {t('unifiedData', 'importData')}
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: tokens.foregroundMuted, marginBottom: '16px' }}>
                    {t('unifiedData', 'importDescription')}
                  </p>
                  <label style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    background: tokens.success,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'center',
                    cursor: isImporting ? 'not-allowed' : 'pointer',
                    opacity: isImporting ? 0.7 : 1,
                  }}>
                    {isImporting ? t('unifiedData', 'importing') : t('unifiedData', 'import')}
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      disabled={isImporting}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{
                background: tokens.cardBg,
                border: `1px solid ${tokens.cardBorder}`,
                borderRadius: '12px',
                padding: '16px',
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: tokens.foreground, margin: '0 0 12px 0' }}>
                  {t('unifiedData', 'supportedFormats')}
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {portability.supportedFormats.map(format => (
                    <span key={format} style={{
                      padding: '4px 12px',
                      background: tokens.background,
                      border: `1px solid ${tokens.borderDim}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: tokens.foregroundMuted,
                      textTransform: 'uppercase',
                    }}>
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${tokens.borderDim}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
            {t('unifiedData', 'footer')}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={scanData}
              style={{
                padding: '8px 16px',
                background: tokens.background,
                border: `1px solid ${tokens.borderDim}`,
                borderRadius: '6px',
                fontSize: '12px',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
              }}
            >
              {t('unifiedData', 'refresh')}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: tokens.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {t('common', 'close')}
            </button>
          </div>
        </div>
      </div>

      {/* Passphrase Modal */}
      {passphraseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
        }}>
          <div style={{
            background: tokens.cardBg,
            border: `1px solid ${tokens.cardBorder}`,
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: tokens.foreground, margin: '0 0 16px 0' }}>
              {passphraseModal.action === 'encrypt' ? t('unifiedData', 'enterPassphraseEncrypt') : t('unifiedData', 'enterPassphraseDecrypt')}
            </h3>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder={t('unifiedData', 'passphrasePlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  background: tokens.background,
                  border: `1px solid ${tokens.borderDim}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: tokens.foreground,
                }}
              />
              <button
                onClick={() => setShowPassphrase(!showPassphrase)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: tokens.foregroundMuted,
                }}
              >
                {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setPassphraseModal(null); setPassphrase('') }}
                style={{
                  padding: '8px 16px',
                  background: tokens.background,
                  border: `1px solid ${tokens.borderDim}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: tokens.foregroundMuted,
                  cursor: 'pointer',
                }}
              >
                {t('common', 'cancel')}
              </button>
              <button
                onClick={handlePassphraseSubmit}
                disabled={!passphrase}
                style={{
                  padding: '8px 16px',
                  background: tokens.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: passphrase ? 'pointer' : 'not-allowed',
                  opacity: passphrase ? 1 : 0.5,
                }}
              >
                {t('common', 'confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
