/**
 * @file DatabasePanel.tsx
 * @description 数据库面板组件，提供数据库管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,database,ui,component
 */

import { useState, useEffect, useCallback } from 'react'
import {
  X, Database, Plus, RefreshCw, TestTube, Trash2, Edit3,
  ChevronRight, ChevronDown, Table2, Columns3, Play,
  History, Download, HardDrive, Server,
  Shield, ShieldCheck, Wifi, WifiOff,
  CheckCircle, XCircle,
  Loader2, Key, FolderDown, RotateCcw,
} from 'lucide-react'
import { useThemeStore, Z_INDEX, BLUR, type ThemeTokens } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { CyberTooltip } from './CyberTooltip'
import { cyberToast } from './CyberToast'
import {
  useDBStore, dbStoreActions,
  type DBConnectionProfile, type DetectedEngine,
} from '../store/db-store'

// ===== Connection Form =====
interface ConnFormData {
  name: string; type: 'postgres' | 'mysql' | 'redis'; host: string; port: number;
  username: string; password: string; ssl: boolean; defaultDB: string
}
const EMPTY_FORM: ConnFormData = { name: '', type: 'postgres', host: 'localhost', port: 5432, username: '', password: '', ssl: false, defaultDB: '' }
const TYPE_PORTS: Record<string, number> = { postgres: 5432, mysql: 3306, redis: 6379 }
const TYPE_LABELS: Record<string, string> = { postgres: 'PostgreSQL', mysql: 'MySQL', redis: 'Redis' }
const TYPE_COLORS: Record<string, string> = { postgres: '#336791', mysql: '#00758f', redis: '#dc382d' }

// ===== Engine Status Badge =====
function EngineBadge({ engine, tk }: { engine: DetectedEngine; tk: ThemeTokens }) {
  const statusColor = engine.status === 'running' ? tk.success : engine.status === 'stopped' ? tk.error : tk.foregroundMuted
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${TYPE_COLORS[engine.type]}12`, border: `1px solid ${TYPE_COLORS[engine.type]}33` }}>
      <Server size={13} color={TYPE_COLORS[engine.type]} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{TYPE_LABELS[engine.type]}</span>
          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>v{engine.version}</span>
        </div>
        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{`:${engine.defaultPort}`}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: statusColor }}>
          {engine.status === 'running' ? 'ON' : engine.status === 'stopped' ? 'OFF' : '?'}
        </span>
      </div>
    </div>
  )
}

// ===== Connection Card =====
function ConnectionCard({ profile, isActive, tk, isCyberpunk, isZh, onSelect, onTest, onEdit, onDelete, onDisconnect }: {
  profile: DBConnectionProfile; isActive: boolean; tk: ThemeTokens; isCyberpunk: boolean; isZh: boolean
  onSelect: () => void; onTest: () => void; onEdit: () => void; onDelete: () => void; onDisconnect: () => void
}) {
  const statusIcon = profile.status === 'connected' ? <Wifi size={10} color={tk.success} /> :
    profile.status === 'testing' ? <Loader2 size={10} color={tk.warning} className="animate-spin" /> :
    profile.status === 'error' ? <WifiOff size={10} color={tk.error} /> :
    <WifiOff size={10} color={tk.foregroundMuted} />
  const statusText = profile.status === 'connected' ? (isZh ? '已连接' : 'Connected') :
    profile.status === 'testing' ? (isZh ? '测试中...' : 'Testing...') :
    profile.status === 'error' ? (isZh ? '连接失败' : 'Error') :
    (isZh ? '未连接' : 'Disconnected')

  return (
    <div
      className="rounded-lg p-3 cursor-pointer transition-all hover:bg-white/3 group"
      style={{
        background: isActive ? `${profile.color}08` : 'transparent',
        border: `1px solid ${isActive ? profile.color + '55' : tk.borderDim}`,
        boxShadow: isActive && isCyberpunk ? `0 0 12px ${profile.color}22` : 'none',
      }}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: profile.color }} />
        <Database size={12} color={TYPE_COLORS[profile.type]} />
        <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>{profile.name}</span>
        <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: TYPE_COLORS[profile.type], background: `${TYPE_COLORS[profile.type]}15`, border: `1px solid ${TYPE_COLORS[profile.type]}33` }}>
          {TYPE_LABELS[profile.type]}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>{profile.host}:{profile.port}</span>
        {profile.ssl && <Shield size={8} color={tk.success} />}
        <div className="flex items-center gap-1 ml-auto">
          {statusIcon}
          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: profile.status === 'connected' ? tk.success : profile.status === 'error' ? tk.error : tk.foregroundMuted }}>
            {statusText}
          </span>
        </div>
      </div>
      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CyberTooltip label={isZh ? '测试连接' : 'Test'} position="top">
          <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={(e) => { e.stopPropagation(); onTest() }}>
            <TestTube size={10} color={tk.primary} />
          </button>
        </CyberTooltip>
        <CyberTooltip label={isZh ? '编辑' : 'Edit'} position="top">
          <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={(e) => { e.stopPropagation(); onEdit() }}>
            <Edit3 size={10} color={tk.warning} />
          </button>
        </CyberTooltip>
        {profile.status === 'connected' && (
          <CyberTooltip label={isZh ? '断开' : 'Disconnect'} position="top">
            <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={(e) => { e.stopPropagation(); onDisconnect() }}>
              <WifiOff size={10} color={tk.warning} />
            </button>
          </CyberTooltip>
        )}
        <CyberTooltip label={isZh ? '删除' : 'Delete'} position="top">
          <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={(e) => { e.stopPropagation(); onDelete() }}>
            <Trash2 size={10} color={tk.error} />
          </button>
        </CyberTooltip>
      </div>
    </div>
  )
}

// ===== SQL Console Sub-panel =====
function SqlConsolePanel({ tk, isZh }: { tk: ThemeTokens; isZh: boolean }) {
  const { activeConnId, queryResult, queryRunning, queryHistory, profiles } = useDBStore()
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 10;')
  const [showHistory, setShowHistory] = useState(false)

  const activeProfile = profiles.find(p => p.id === activeConnId)

  const handleExecute = useCallback(async () => {
    if (!activeConnId || !sql.trim()) return
    await dbStoreActions.executeQuery(activeConnId, sql)
  }, [activeConnId, sql])

  return (
    <div className="flex flex-col h-full">
      {/* SQL Editor Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
          <Play size={11} color={tk.success} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
            {isZh ? 'SQL 控制台' : 'SQL Console'}
          </span>
          {activeProfile && (
            <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: activeProfile.color, background: `${activeProfile.color}12` }}>
              {activeProfile.name}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <CyberTooltip label={isZh ? '执行 (Ctrl+Enter)' : 'Execute (Ctrl+Enter)'} position="left">
              <button
                className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
                style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success, background: `${tk.success}15`, border: `1px solid ${tk.success}33` }}
                onClick={handleExecute}
                disabled={queryRunning || !activeConnId}
              >
                {queryRunning ? <Loader2 size={9} className="animate-spin" /> : <Play size={9} />}
                {isZh ? '执行' : 'Run'}
              </button>
            </CyberTooltip>
            <CyberTooltip label={isZh ? '查询历史' : 'History'} position="left">
              <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={() => setShowHistory(!showHistory)}>
                <History size={10} color={showHistory ? tk.primary : tk.foregroundMuted} />
              </button>
            </CyberTooltip>
          </div>
        </div>

        {/* Editor (simplified — Monaco would be used in real Tauri env) */}
        <div className="flex-1 relative min-h-[80px]">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="w-full h-full resize-none bg-transparent p-3 outline-none neon-scrollbar"
            style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground, lineHeight: '1.6' }}
            placeholder={isZh ? '输入 SQL 查询...' : 'Enter SQL query...'}
            onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleExecute() } }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Results Area */}
      <div className="shrink-0" style={{ borderTop: `1px solid ${tk.borderDim}`, maxHeight: '50%' }}>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: tk.backgroundAlt }}>
          <Table2 size={10} color={tk.primary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>
            {isZh ? '查询结果' : 'Results'}
          </span>
          {queryResult && !queryResult.error && (
            <>
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.success }}>
                {queryResult.rowCount} {isZh ? '行' : 'rows'}
              </span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                {queryResult.executionTime}ms
              </span>
              {queryResult.affectedRows !== undefined && (
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.warning }}>
                  {queryResult.affectedRows} {isZh ? '行受影响' : 'affected'}
                </span>
              )}
            </>
          )}
          {queryResult?.error && (
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.error }}>
              {queryResult.error}
            </span>
          )}
        </div>

        {/* Data Grid */}
        <div className="overflow-auto neon-scrollbar" style={{ maxHeight: 200 }}>
          {queryRunning ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 size={14} color={tk.primary} className="animate-spin" />
              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
                {isZh ? '执行中...' : 'Executing...'}
              </span>
            </div>
          ) : queryResult && queryResult.columns.length > 0 ? (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {queryResult.columns.map(col => (
                    <th key={col} className="text-left px-2 py-1 sticky top-0" style={{
                      fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, background: tk.panelBg,
                      borderBottom: `1px solid ${tk.borderDim}`,
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResult.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/3 transition-colors">
                    {queryResult.columns.map(col => (
                      <td key={col} className="px-2 py-1" style={{
                        fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground,
                        borderBottom: `1px solid ${tk.borderDim}08`,
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {String(row[col] ?? 'NULL')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : !queryResult ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Play size={20} color={tk.borderDim} className="mb-2" />
              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
                {isZh ? '执行查询查看结果' : 'Execute a query to see results'}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Query History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 flex flex-col" style={{ background: tk.panelBg, zIndex: 10 }}>
          <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
            <History size={12} color={tk.primary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{isZh ? '查询历史' : 'Query History'}</span>
            <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>
              {queryHistory.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button className="px-1.5 py-0.5 rounded hover:bg-white/5 transition-all" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.error }} onClick={() => dbStoreActions.clearQueryHistory()}>
                {isZh ? '清除' : 'Clear'}
              </button>
              <button className="p-1 rounded hover:bg-white/10" onClick={() => setShowHistory(false)}>
                <X size={12} color={tk.foregroundMuted} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto neon-scrollbar">
            {queryHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <History size={24} color={tk.borderDim} className="mb-2" />
                <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>{isZh ? '暂无查询历史' : 'No query history'}</span>
              </div>
            ) : queryHistory.map(item => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2 border-b transition-all hover:bg-white/3"
                style={{ borderColor: `${tk.borderDim}08` }}
                onClick={() => { setSql(item.sql); setShowHistory(false) }}
              >
                <div className="flex items-center gap-2">
                  {item.success ? <CheckCircle size={9} color={tk.success} /> : <XCircle size={9} color={tk.error} />}
                  <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{item.sql}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{item.executionTime}ms</span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{item.rowCount} rows</span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Table Explorer Sub-panel =====
function TableExplorerPanel({ tk, isZh }: { tk: ThemeTokens; isZh: boolean }) {
  const { activeConnId, activeTable, schemas, tables, columns, profiles } = useDBStore()
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['public']))
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [loadingTable, setLoadingTable] = useState(false)

  const activeProfile = profiles.find(p => p.id === activeConnId)
  const schemaList = activeConnId ? schemas[activeConnId] || [] : []

  const handleLoadSchemas = useCallback(async () => {
    if (!activeConnId) return
    setLoadingSchema(true)
    await dbStoreActions.loadSchemas(activeConnId)
    setLoadingSchema(false)
  }, [activeConnId])

  useEffect(() => {
    if (activeConnId && schemaList.length === 0) {
      void (async () => {
        setLoadingSchema(true)
        await dbStoreActions.loadSchemas(activeConnId)
        setLoadingSchema(false)
      })()
    }
  }, [activeConnId, schemaList.length])

  const toggleSchema = useCallback(async (schema: string) => {
    const next = new Set(expandedSchemas)
    if (next.has(schema)) { next.delete(schema) } else {
      next.add(schema)
      if (activeConnId) {
        setLoadingTable(true)
        await dbStoreActions.loadTables(activeConnId, schema)
        setLoadingTable(false)
      }
    }
    setExpandedSchemas(next)
  }, [expandedSchemas, activeConnId])

  const toggleTable = useCallback(async (table: string, schema: string) => {
    const next = new Set(expandedTables)
    if (next.has(table)) { next.delete(table) } else {
      next.add(table)
      if (activeConnId) await dbStoreActions.loadColumns(activeConnId, schema, table)
    }
    setExpandedTables(next)
  }, [expandedTables, activeConnId])

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Columns3 size={11} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
          {isZh ? '表浏览器' : 'Table Explorer'}
        </span>
        {activeProfile && (
          <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: activeProfile.color, background: `${activeProfile.color}12` }}>
            {activeProfile.name}
          </span>
        )}
        <button className="ml-auto p-1 rounded hover:bg-white/10 transition-all" onClick={handleLoadSchemas}>
          <RefreshCw size={10} color={tk.primaryDim} className={loadingSchema ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto neon-scrollbar py-1">
        {!activeConnId ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Database size={24} color={tk.borderDim} className="mb-2" />
            <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
              {isZh ? '请先选择一个连接' : 'Select a connection first'}
            </span>
          </div>
        ) : schemaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={16} color={tk.primary} className="animate-spin mb-2" />
            <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
              {isZh ? '加载中...' : 'Loading...'}
            </span>
          </div>
        ) : schemaList.map(schema => {
          const isExpanded = expandedSchemas.has(schema)
          const tableKey = `${activeConnId}:${schema}`
          const tableList = tables[tableKey] || []

          return (
            <div key={schema}>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all hover:bg-white/3"
                onClick={() => toggleSchema(schema)}
              >
                {isExpanded ? <ChevronDown size={10} color={tk.foregroundMuted} /> : <ChevronRight size={10} color={tk.foregroundMuted} />}
                <HardDrive size={10} color={tk.warning} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{schema}</span>
                {tableList.length > 0 && (
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{tableList.length}</span>
                )}
              </button>
              {isExpanded && tableList.map(table => {
                const isTableExpanded = expandedTables.has(table.name)
                const colKey = `${activeConnId}:${schema}:${table.name}`
                const colList = columns[colKey] || []

                return (
                  <div key={table.name}>
                    <button
                      className="w-full flex items-center gap-2 pl-8 pr-3 py-1 text-left transition-all hover:bg-white/3"
                      style={{ background: activeTable === table.name ? `${tk.primary}06` : 'transparent' }}
                      onClick={() => toggleTable(table.name, schema)}
                    >
                      {isTableExpanded ? <ChevronDown size={9} color={tk.foregroundMuted} /> : <ChevronRight size={9} color={tk.foregroundMuted} />}
                      <Table2 size={10} color={table.type === 'view' ? tk.secondary : tk.primary} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>{table.name}</span>
                      {table.type === 'view' && (
                        <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '6px', color: tk.secondary, background: `${tk.secondary}12` }}>VIEW</span>
                      )}
                      <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                        {table.rowCount?.toLocaleString()} {formatSize(table.sizeBytes)}
                      </span>
                    </button>
                    {isTableExpanded && colList.map(col => (
                      <div key={col.name} className="flex items-center gap-2 pl-14 pr-3 py-0.5 hover:bg-white/2 transition-colors">
                        {col.primaryKey ? <Key size={8} color={tk.warning} /> : <div className="w-2 h-2 rounded-full" style={{ background: tk.borderDim }} />}
                        <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: col.primaryKey ? tk.warning : tk.foreground }}>{col.name}</span>
                        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primaryDim }}>{col.type}</span>
                        {col.nullable && <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, opacity: 0.5 }}>NULL</span>}
                      </div>
                    ))}
                  </div>
                )
              })}
              {isExpanded && loadingTable && tableList.length === 0 && (
                <div className="pl-8 py-2"><Loader2 size={10} color={tk.primary} className="animate-spin" /></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== Backup & Restore Sub-panel =====
function BackupRestorePanel({ tk, isZh }: { tk: ThemeTokens; isZh: boolean }) {
  const { activeConnId, backups, profiles } = useDBStore()
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  const activeProfile = profiles.find(p => p.id === activeConnId)

  const handleBackup = useCallback(async () => {
    if (!activeConnId) return
    setBackingUp(true)
    try {
      const record = await dbStoreActions.dumpDatabase(activeConnId)
      cyberToast(record.status === 'completed'
        ? (isZh ? `备份完成: ${record.filename}` : `Backup completed: ${record.filename}`)
        : (isZh ? '备份失败' : 'Backup failed'))
    } finally {
      setBackingUp(false)
    }
  }, [activeConnId, isZh])

  const handleRestore = useCallback(async (backupId: string) => {
    if (!activeConnId) return
    setRestoring(backupId)
    try {
      const success = await dbStoreActions.restoreDatabase(activeConnId, backupId)
      cyberToast(success ? (isZh ? '恢复成功' : 'Restore completed') : (isZh ? '恢复失败' : 'Restore failed'))
    } finally {
      setRestoring(null)
    }
  }, [activeConnId, isZh])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <FolderDown size={11} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
          {isZh ? '备份与恢复' : 'Backup & Restore'}
        </span>
        {activeProfile && (
          <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: activeProfile.color, background: `${activeProfile.color}12` }}>
            {activeProfile.name}
          </span>
        )}
        <button
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80"
          style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success, background: `${tk.success}12`, border: `1px solid ${tk.success}33` }}
          onClick={handleBackup}
          disabled={backingUp || !activeConnId}
        >
          {backingUp ? <Loader2 size={9} className="animate-spin" /> : <Download size={9} />}
          {isZh ? '立即备份' : 'Backup Now'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto neon-scrollbar">
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderDown size={24} color={tk.borderDim} className="mb-2" />
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
                <CyberTooltip label={isZh ? '恢复' : 'Restore'} position="left">
                  <button
                    className="p-1 rounded hover:bg-white/10 transition-all"
                    onClick={() => handleRestore(backup.id)}
                    disabled={restoring === backup.id}
                  >
                    {restoring === backup.id ? <Loader2 size={10} color={tk.warning} className="animate-spin" /> : <RotateCcw size={10} color={tk.warning} />}
                  </button>
                </CyberTooltip>
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

// ===== Main DatabasePanel =====
export function DatabasePanel() {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const {
    panelVisible, activeTab, detectedEngines, detectStatus,
    profiles, activeConnId,
  } = useDBStore()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ConnFormData>(EMPTY_FORM)

  // 初次打开时自动发现引擎
  useEffect(() => {
    if (panelVisible && detectStatus === 'idle') {
      dbStoreActions.detectEngines()
    }
  }, [panelVisible, detectStatus])

  const handleSaveProfile = useCallback(() => {
    if (!form.name.trim()) { cyberToast(isZh ? '请输入连接名称' : 'Name is required'); return }
    if (editingId) {
      dbStoreActions.editProfile(editingId, form)
      cyberToast(isZh ? '连接已更新' : 'Connection updated')
    } else {
      dbStoreActions.addProfile(form)
      cyberToast(isZh ? '连接已添加' : 'Connection added')
    }
    setShowAddDialog(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }, [form, editingId, isZh])

  const openEditDialog = useCallback((profile: DBConnectionProfile) => {
    setForm({
      name: profile.name, type: profile.type, host: profile.host, port: profile.port,
      username: profile.username, password: profile.password, ssl: profile.ssl, defaultDB: profile.defaultDB,
    })
    setEditingId(profile.id)
    setShowAddDialog(true)
  }, [])

  const handleTestConnection = useCallback(async (id: string) => {
    const result = await dbStoreActions.testConnection(id)
    cyberToast(result.success
      ? (isZh ? `连接成功 (${result.latency}ms) — ${result.serverVersion}` : `Connected (${result.latency}ms) — ${result.serverVersion}`)
      : (isZh ? `连接失败: ${result.message}` : `Failed: ${result.message}`))
  }, [isZh])

  const TABS: { id: typeof activeTab; label: string; icon: typeof Database }[] = [
    { id: 'connections', label: isZh ? '连接' : 'Conn', icon: Database },
    { id: 'sql', label: 'SQL', icon: Play },
    { id: 'tables', label: isZh ? '表' : 'Tables', icon: Table2 },
    { id: 'backup', label: isZh ? '备份' : 'Backup', icon: FolderDown },
  ]

  if (!panelVisible) return null

  return (
    <div
      className="fixed right-0 top-0 h-full flex flex-col"
      style={{
        width: 440,
        zIndex: Z_INDEX.modal,
        background: tk.panelBg,
        borderLeft: `1px solid ${tk.cardBorder}`,
        backdropFilter: BLUR.lg,
        boxShadow: tk.shadowHover,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <Database size={14} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
          {isZh ? '数据库管理器' : 'Database Manager'}
        </span>
        <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>
          {profiles.length} {isZh ? '个连接' : 'connections'}
        </span>
        <button className="ml-auto p-1 rounded hover:bg-white/10 transition-all" onClick={() => dbStoreActions.closePanel()}>
          <X size={14} color={tk.foregroundMuted} />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all"
            style={{
              fontFamily: tk.fontMono, fontSize: '9px',
              color: activeTab === tab.id ? tk.primary : tk.foregroundMuted,
              background: activeTab === tab.id ? tk.primaryGlow : 'transparent',
              border: `1px solid ${activeTab === tab.id ? tk.primary + '44' : 'transparent'}`,
            }}
            onClick={() => dbStoreActions.setActiveTab(tab.id)}
          >
            <tab.icon size={10} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* === Connections Tab === */}
        {activeTab === 'connections' && (
          <div className="flex flex-col h-full">
            {/* Engine Discovery */}
            <div className="px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Server size={10} color={tk.primary} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary }}>
                  {isZh ? '本地引擎发现' : 'Engine Discovery'}
                </span>
                <button className="p-0.5 rounded hover:bg-white/10 transition-all" onClick={() => dbStoreActions.detectEngines()}>
                  <RefreshCw size={8} color={tk.primaryDim} className={detectStatus === 'detecting' ? 'animate-spin' : ''} />
                </button>
              </div>
              {detectStatus === 'detecting' ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={10} color={tk.primary} className="animate-spin" />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                    {isZh ? '探测中...' : 'Detecting...'}
                  </span>
                </div>
              ) : detectedEngines.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {detectedEngines.map(engine => (
                    <EngineBadge key={engine.type} engine={engine} tk={tk} />
                  ))}
                </div>
              ) : (
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                  {isZh ? '未检测到数据库引擎' : 'No engines detected'}
                </span>
              )}
            </div>

            {/* Connection List */}
            <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>{isZh ? '连接配置' : 'Connections'}</span>
              <button
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded transition-all hover:opacity-80"
                style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.primary}33` }}
                onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowAddDialog(true) }}
              >
                <Plus size={9} /> {isZh ? '新建' : 'New'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto neon-scrollbar p-2 flex flex-col gap-1.5">
              {profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Database size={28} color={tk.borderDim} className="mb-3" />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
                    {isZh ? '暂无连接配置' : 'No connections yet'}
                  </span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, opacity: 0.5, marginTop: 4 }}>
                    {isZh ? '点击"新建"添加数据库连接' : 'Click "New" to add a connection'}
                  </span>
                </div>
              ) : profiles.map(profile => (
                <ConnectionCard
                  key={profile.id}
                  profile={profile}
                  isActive={activeConnId === profile.id}
                  tk={tk}
                  isCyberpunk={isCyberpunk}
                  isZh={isZh}
                  onSelect={() => dbStoreActions.setActiveConnection(profile.id)}
                  onTest={() => handleTestConnection(profile.id)}
                  onEdit={() => openEditDialog(profile)}
                  onDelete={() => {
                    if (confirm(isZh ? `确定删除连接 "${profile.name}"？` : `Delete connection "${profile.name}"?`)) {
                      dbStoreActions.removeProfile(profile.id)
                      cyberToast(isZh ? '连接已删除' : 'Connection deleted')
                    }
                  }}
                  onDisconnect={() => dbStoreActions.disconnectProfile(profile.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* === SQL Console Tab === */}
        {activeTab === 'sql' && <SqlConsolePanel tk={tk} isZh={isZh} />}

        {/* === Tables Tab === */}
        {activeTab === 'tables' && <TableExplorerPanel tk={tk} isZh={isZh} />}

        {/* === Backup Tab === */}
        {activeTab === 'backup' && <BackupRestorePanel tk={tk} isZh={isZh} />}
      </div>

      {/* Add/Edit Connection Dialog */}
      {showAddDialog && (
        <>
          <div className="fixed inset-0" style={{ zIndex: Z_INDEX.topModal + 10, background: tk.overlayBg }} onClick={() => setShowAddDialog(false)} />
          <div
            className="fixed rounded-xl overflow-hidden flex flex-col"
            style={{
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 380, maxHeight: '70vh',
              zIndex: Z_INDEX.topModal + 11,
              background: tk.panelBg, border: `1px solid ${tk.cardBorder}`,
              boxShadow: isCyberpunk ? `0 0 30px ${tk.primaryGlow}` : tk.shadowHover,
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
              <Database size={13} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>
                {editingId ? (isZh ? '编辑连接' : 'Edit Connection') : (isZh ? '新建连接' : 'New Connection')}
              </span>
              <button className="ml-auto p-1 rounded hover:bg-white/10" onClick={() => setShowAddDialog(false)}>
                <X size={12} color={tk.foregroundMuted} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Type Selector */}
              <div>
                <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>
                  {isZh ? '数据库类型' : 'Database Type'}
                </label>
                <div className="flex gap-2">
                  {(['postgres', 'mysql', 'redis'] as const).map(type => (
                    <button
                      key={type}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all"
                      style={{
                        fontFamily: tk.fontMono, fontSize: '9px',
                        color: form.type === type ? TYPE_COLORS[type] : tk.foregroundMuted,
                        background: form.type === type ? `${TYPE_COLORS[type]}12` : 'transparent',
                        border: `1px solid ${form.type === type ? TYPE_COLORS[type] + '55' : tk.borderDim}`,
                      }}
                      onClick={() => setForm({ ...form, type, port: TYPE_PORTS[type] })}
                    >
                      <Database size={10} />
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>
                  {isZh ? '连接名称' : 'Connection Name'}
                </label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isZh ? '例如: 本地开发数据库' : 'e.g. Local Dev DB'}
                  className="w-full px-3 py-1.5 rounded bg-transparent outline-none"
                  style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                />
              </div>

              {/* Host + Port */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>Host</label>
                  <input
                    type="text" value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-transparent outline-none"
                    style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                  />
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>Port</label>
                  <input
                    type="number" value={form.port}
                    onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded bg-transparent outline-none"
                    style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                  />
                </div>
              </div>

              {/* Username + Password */}
              {form.type !== 'redis' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>
                      {isZh ? '用户名' : 'Username'}
                    </label>
                    <input
                      type="text" value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-transparent outline-none"
                      style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                    />
                  </div>
                  <div className="flex-1">
                    <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>
                      {isZh ? '密码' : 'Password'}
                    </label>
                    <input
                      type="password" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-transparent outline-none"
                      style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                    />
                  </div>
                </div>
              )}

              {/* Default DB */}
              {form.type !== 'redis' && (
                <div>
                  <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: 4 }}>
                    {isZh ? '默认数据库' : 'Default Database'}
                  </label>
                  <input
                    type="text" value={form.defaultDB}
                    onChange={(e) => setForm({ ...form, defaultDB: e.target.value })}
                    placeholder={form.type === 'postgres' ? 'postgres' : 'mysql'}
                    className="w-full px-3 py-1.5 rounded bg-transparent outline-none"
                    style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, border: `1px solid ${tk.borderDim}` }}
                  />
                </div>
              )}

              {/* SSL Toggle */}
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded transition-all"
                  style={{
                    fontFamily: tk.fontMono, fontSize: '10px',
                    color: form.ssl ? tk.success : tk.foregroundMuted,
                    background: form.ssl ? `${tk.success}12` : 'transparent',
                    border: `1px solid ${form.ssl ? tk.success + '44' : tk.borderDim}`,
                  }}
                  onClick={() => setForm({ ...form, ssl: !form.ssl })}
                >
                  {form.ssl ? <ShieldCheck size={11} /> : <Shield size={11} />}
                  SSL / TLS
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
              <button
                className="px-3 py-1.5 rounded transition-all hover:opacity-80"
                style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}
                onClick={() => setShowAddDialog(false)}
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                className="px-3 py-1.5 rounded transition-all hover:opacity-80"
                style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.primary}44` }}
                onClick={handleSaveProfile}
              >
                {editingId ? (isZh ? '保存' : 'Save') : (isZh ? '添加' : 'Add')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
