/**
 * @file db-store.ts
 * @description 数据库状态管理模块，管理本地数据库操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags database,storage,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== Type Definitions (对齐 Guidelines: DbBridge + Service Layer) =====

/** 检测到的数据库引擎 */
export interface DetectedEngine {
  /** 引擎类型 */
  type: 'postgres' | 'mysql' | 'redis'
  /** 版本号 */
  version: string
  /** 默认端口 */
  defaultPort: number
  /** 运行状态 */
  status: 'running' | 'stopped' | 'unknown'
  /** 配置文件路径 */
  configPath?: string
}

/** 数据库连接配置（对齐 Guidelines: DBConnectionProfile） */
export interface DBConnectionProfile {
  /** 唯一 ID */
  id: string
  /** 连接名称 */
  name: string
  /** 数据库类型 */
  type: 'postgres' | 'mysql' | 'redis'
  /** 主机地址 */
  host: string
  /** 端口号 */
  port: number
  /** 用户名 */
  username: string
  /** 密码（加密存储） */
  password: string
  /** 是否启用 SSL */
  ssl: boolean
  /** 默认数据库 */
  defaultDB: string
  /** 连接状态 */
  status: 'connected' | 'disconnected' | 'testing' | 'error'
  /** 创建时间 */
  createdAt: number
  /** 最后连接时间 */
  lastConnected?: number
  /** 连接标签颜色 */
  color: string
}

/** 连接测试结果 */
export interface ConnectionTestResult {
  success: boolean
  message: string
  latency?: number
  serverVersion?: string
}

/** 表信息 */
export interface TableInfo {
  name: string
  schema: string
  type: 'table' | 'view'
  rowCount?: number
  sizeBytes?: number
}

/** 列信息 */
export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: string
  comment?: string
}

/** 查询结果（对齐 Guidelines: QueryResult） */
export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  affectedRows?: number
  error?: string
}

/** 查询历史记录 */
export interface QueryHistoryItem {
  id: string
  connId: string
  sql: string
  timestamp: number
  executionTime: number
  rowCount: number
  success: boolean
  error?: string
}

/** 备份记录 */
export interface BackupRecord {
  id: string
  connId: string
  connName: string
  type: 'postgres' | 'mysql' | 'redis'
  filename: string
  sizeBytes: number
  timestamp: number
  status: 'completed' | 'failed' | 'in-progress'
  error?: string
}

// ===== State Shape =====
interface DBStoreState {
  /** 检测到的引擎 */
  detectedEngines: DetectedEngine[]
  /** 连接配置列表 */
  profiles: DBConnectionProfile[]
  /** 当前活跃连接 ID */
  activeConnId: string | null
  /** 当前活跃 Schema */
  activeSchema: string | null
  /** 当前活跃表名 */
  activeTable: string | null
  /** Schema 列表缓存 */
  schemas: Record<string, string[]>
  /** 表列表缓存 */
  tables: Record<string, TableInfo[]>
  /** 列信息缓存 */
  columns: Record<string, ColumnInfo[]>
  /** 查询结果 */
  queryResult: QueryResult | null
  /** 查询历史 */
  queryHistory: QueryHistoryItem[]
  /** 备份记录 */
  backups: BackupRecord[]
  /** 面板可见性 */
  panelVisible: boolean
  /** 当前子面板 */
  activeTab: 'connections' | 'sql' | 'tables' | 'backup'
  /** 引擎发现状态 */
  detectStatus: 'idle' | 'detecting' | 'done'
  /** 正在执行查询 */
  queryRunning: boolean
}

// ===== Persistence =====
const LS_KEY = 'yyc3_db_store'
const MAX_QUERY_HISTORY = 50
const MAX_BACKUPS = 30

function loadState(): Partial<DBStoreState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(s: DBStoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      profiles: s.profiles,
      queryHistory: s.queryHistory,
      backups: s.backups,
      activeConnId: s.activeConnId,
    }))
  } catch { /* ignore */ }
}

// ===== Module Store =====
const persisted = loadState()
let state: DBStoreState = {
  detectedEngines: [],
  profiles: persisted.profiles || [],
  activeConnId: persisted.activeConnId || null,
  activeSchema: null,
  activeTable: null,
  schemas: {},
  tables: {},
  columns: {},
  queryResult: null,
  queryHistory: persisted.queryHistory || [],
  backups: persisted.backups || [],
  panelVisible: false,
  activeTab: 'connections',
  detectStatus: 'idle',
  queryRunning: false,
}

const listeners = new Set<() => void>()
function emit() {
  saveState(state)
  listeners.forEach(fn => fn())
}
function genId() {
  return 'db_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

// ===== Mock Data (模拟 Tauri 桥接层数据) =====

const MOCK_ENGINES: DetectedEngine[] = [
  { type: 'postgres', version: '16.2', defaultPort: 5432, status: 'running', configPath: '/etc/postgresql/16/main/postgresql.conf' },
  { type: 'mysql', version: '8.0.36', defaultPort: 3306, status: 'running', configPath: '/etc/mysql/my.cnf' },
  { type: 'redis', version: '7.2.4', defaultPort: 6379, status: 'stopped', configPath: '/etc/redis/redis.conf' },
]

const MOCK_SCHEMAS: Record<string, string[]> = {
  postgres: ['public', 'pg_catalog', 'information_schema'],
  mysql: ['information_schema', 'mysql', 'performance_schema', 'sys'],
}

const MOCK_TABLES: TableInfo[] = [
  { name: 'users', schema: 'public', type: 'table', rowCount: 15234, sizeBytes: 2457600 },
  { name: 'projects', schema: 'public', type: 'table', rowCount: 3421, sizeBytes: 819200 },
  { name: 'ai_sessions', schema: 'public', type: 'table', rowCount: 87654, sizeBytes: 12582912 },
  { name: 'file_versions', schema: 'public', type: 'table', rowCount: 234567, sizeBytes: 52428800 },
  { name: 'settings', schema: 'public', type: 'table', rowCount: 42, sizeBytes: 8192 },
  { name: 'user_activity_view', schema: 'public', type: 'view', rowCount: 15234 },
]

const MOCK_COLUMNS: Record<string, ColumnInfo[]> = {
  users: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
    { name: 'username', type: 'varchar(255)', nullable: false, primaryKey: false, comment: 'Unique username' },
    { name: 'email', type: 'varchar(255)', nullable: false, primaryKey: false },
    { name: 'password_hash', type: 'text', nullable: false, primaryKey: false },
    { name: 'avatar_url', type: 'text', nullable: true, primaryKey: false },
    { name: 'role', type: 'varchar(50)', nullable: false, primaryKey: false, defaultValue: "'user'" },
    { name: 'created_at', type: 'timestamptz', nullable: false, primaryKey: false, defaultValue: 'now()' },
    { name: 'updated_at', type: 'timestamptz', nullable: false, primaryKey: false, defaultValue: 'now()' },
  ],
  projects: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
    { name: 'name', type: 'varchar(255)', nullable: false, primaryKey: false },
    { name: 'description', type: 'text', nullable: true, primaryKey: false },
    { name: 'owner_id', type: 'uuid', nullable: false, primaryKey: false, comment: 'FK -> users.id' },
    { name: 'is_public', type: 'boolean', nullable: false, primaryKey: false, defaultValue: 'false' },
    { name: 'created_at', type: 'timestamptz', nullable: false, primaryKey: false, defaultValue: 'now()' },
  ],
  ai_sessions: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'user_id', type: 'uuid', nullable: false, primaryKey: false },
    { name: 'provider', type: 'varchar(50)', nullable: false, primaryKey: false },
    { name: 'model', type: 'varchar(100)', nullable: false, primaryKey: false },
    { name: 'messages', type: 'jsonb', nullable: false, primaryKey: false },
    { name: 'tokens_used', type: 'integer', nullable: false, primaryKey: false, defaultValue: '0' },
    { name: 'created_at', type: 'timestamptz', nullable: false, primaryKey: false, defaultValue: 'now()' },
  ],
  settings: [
    { name: 'key', type: 'varchar(255)', nullable: false, primaryKey: true },
    { name: 'value', type: 'jsonb', nullable: false, primaryKey: false },
    { name: 'updated_at', type: 'timestamptz', nullable: false, primaryKey: false, defaultValue: 'now()' },
  ],
}

const MOCK_QUERY_ROWS: Record<string, unknown>[] = [
  { id: 'a1b2c3d4', username: 'admin', email: 'admin@yyc3.dev', role: 'admin', created_at: '2025-12-01T10:00:00Z' },
  { id: 'e5f6g7h8', username: 'developer', email: 'dev@yyc3.dev', role: 'user', created_at: '2025-12-15T14:30:00Z' },
  { id: 'i9j0k1l2', username: 'designer', email: 'design@yyc3.dev', role: 'user', created_at: '2026-01-05T09:15:00Z' },
  { id: 'm3n4o5p6', username: 'tester', email: 'test@yyc3.dev', role: 'user', created_at: '2026-01-20T16:45:00Z' },
  { id: 'q7r8s9t0', username: 'manager', email: 'pm@yyc3.dev', role: 'admin', created_at: '2026-02-10T11:00:00Z' },
]

const PROFILE_COLORS = ['#00f0ff', '#ff006e', '#39ff14', '#f5a623', '#bd10e0', '#4a90d9']

// ===== Actions =====
export const dbStoreActions = {

  // ===== Engine Detection (对齐 Guidelines: Auto-discover installed local DB engines) =====

  /** 自动发现本地数据库引擎 */
  async detectEngines(): Promise<void> {
    state = { ...state, detectStatus: 'detecting' }
    emit()
    // 模拟异步探测 (实际: Tauri invoke -> probe default ports)
    await new Promise(r => setTimeout(r, 1500))
    state = { ...state, detectedEngines: MOCK_ENGINES, detectStatus: 'done' }
    emit()
  },

  // ===== Connection Management (对齐 Guidelines: Connection Manager UI) =====

  /** 添加连接配置 */
  addProfile(profile: Omit<DBConnectionProfile, 'id' | 'createdAt' | 'status' | 'color'>) {
    const newProfile: DBConnectionProfile = {
      ...profile,
      id: genId(),
      createdAt: Date.now(),
      status: 'disconnected',
      color: PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length],
    }
    state = { ...state, profiles: [...state.profiles, newProfile] }
    emit()
    return newProfile.id
  },

  /** 编辑连接配置 */
  editProfile(id: string, updates: Partial<DBConnectionProfile>) {
    state = {
      ...state,
      profiles: state.profiles.map(p => p.id === id ? { ...p, ...updates } : p),
    }
    emit()
  },

  /** 删除连接配置 */
  removeProfile(id: string) {
    state = {
      ...state,
      profiles: state.profiles.filter(p => p.id !== id),
      activeConnId: state.activeConnId === id ? null : state.activeConnId,
    }
    emit()
  },

  /** 测试连接（对齐 Guidelines: testConnection） */
  async testConnection(id: string): Promise<ConnectionTestResult> {
    const profile = state.profiles.find(p => p.id === id)
    if (!profile) return { success: false, message: 'Profile not found' }

    state = {
      ...state,
      profiles: state.profiles.map(p => p.id === id ? { ...p, status: 'testing' } : p),
    }
    emit()

    // 模拟异步测试 (实际: Tauri invoke -> test_connection)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700))

    const success = Math.random() > 0.15 // 85% success rate for demo
    const result: ConnectionTestResult = success
      ? { success: true, message: 'Connection successful', latency: Math.floor(12 + Math.random() * 50), serverVersion: profile.type === 'postgres' ? '16.2' : profile.type === 'mysql' ? '8.0.36' : '7.2.4' }
      : { success: false, message: `Connection refused: ${profile.host}:${profile.port}` }

    state = {
      ...state,
      profiles: state.profiles.map(p => p.id === id
        ? { ...p, status: success ? 'connected' : 'error', lastConnected: success ? Date.now() : p.lastConnected }
        : p
      ),
    }
    emit()
    return result
  },

  /** 设置活跃连接 */
  setActiveConnection(id: string | null) {
    state = { ...state, activeConnId: id, activeSchema: null, activeTable: null }
    emit()
  },

  /** 断开连接 */
  disconnectProfile(id: string) {
    state = {
      ...state,
      profiles: state.profiles.map(p => p.id === id ? { ...p, status: 'disconnected' } : p),
      activeConnId: state.activeConnId === id ? null : state.activeConnId,
    }
    emit()
  },

  // ===== Schema Browsing (对齐 Guidelines: listSchemas, listTables, getTableColumns) =====

  /** 加载 Schema 列表 */
  async loadSchemas(connId: string): Promise<string[]> {
    const profile = state.profiles.find(p => p.id === connId)
    if (!profile) return []
    await new Promise(r => setTimeout(r, 300))
    const schemas = MOCK_SCHEMAS[profile.type] || ['public']
    state = { ...state, schemas: { ...state.schemas, [connId]: schemas } }
    emit()
    return schemas
  },

  /** 加载表列表 */
  async loadTables(connId: string, schema: string): Promise<TableInfo[]> {
    await new Promise(r => setTimeout(r, 400))
    const tables = MOCK_TABLES.map(t => ({ ...t, schema }))
    const key = `${connId}:${schema}`
    state = {
      ...state,
      tables: { ...state.tables, [key]: tables },
      activeSchema: schema,
    }
    emit()
    return tables
  },

  /** 加载列信息 */
  async loadColumns(connId: string, schema: string, table: string): Promise<ColumnInfo[]> {
    await new Promise(r => setTimeout(r, 250))
    const cols = MOCK_COLUMNS[table] || [
      { name: 'id', type: 'integer', nullable: false, primaryKey: true },
      { name: 'data', type: 'jsonb', nullable: true, primaryKey: false },
    ]
    const key = `${connId}:${schema}:${table}`
    state = {
      ...state,
      columns: { ...state.columns, [key]: cols },
      activeTable: table,
    }
    emit()
    return cols
  },

  // ===== Query Execution (对齐 Guidelines: execQuery) =====

  /** 执行 SQL 查询 */
  async executeQuery(connId: string, sql: string): Promise<QueryResult> {
    state = { ...state, queryRunning: true, queryResult: null }
    emit()

    const startTime = Date.now()
    await new Promise(r => setTimeout(r, 200 + Math.random() * 500))

    const trimmedSql = sql.trim().toLowerCase()
    let result: QueryResult

    if (trimmedSql.startsWith('select')) {
      result = {
        columns: ['id', 'username', 'email', 'role', 'created_at'],
        rows: MOCK_QUERY_ROWS,
        rowCount: MOCK_QUERY_ROWS.length,
        executionTime: Date.now() - startTime,
      }
    } else if (trimmedSql.startsWith('insert')) {
      result = {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - startTime,
        affectedRows: 1,
      }
    } else if (trimmedSql.startsWith('update')) {
      result = {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - startTime,
        affectedRows: Math.floor(1 + Math.random() * 5),
      }
    } else if (trimmedSql.startsWith('delete')) {
      result = {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - startTime,
        affectedRows: Math.floor(1 + Math.random() * 3),
      }
    } else if (trimmedSql.startsWith('create') || trimmedSql.startsWith('alter') || trimmedSql.startsWith('drop')) {
      result = {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - startTime,
      }
    } else {
      result = {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - startTime,
        error: `Unrecognized SQL statement: ${sql.slice(0, 50)}`,
      }
    }

    // 记录查询历史
    const historyItem: QueryHistoryItem = {
      id: genId(),
      connId,
      sql,
      timestamp: Date.now(),
      executionTime: result.executionTime,
      rowCount: result.rowCount,
      success: !result.error,
      error: result.error,
    }

    state = {
      ...state,
      queryResult: result,
      queryRunning: false,
      queryHistory: [historyItem, ...state.queryHistory].slice(0, MAX_QUERY_HISTORY),
    }
    emit()
    return result
  },

  /** 清除查询结果 */
  clearQueryResult() {
    state = { ...state, queryResult: null }
    emit()
  },

  /** 清除查询历史 */
  clearQueryHistory() {
    state = { ...state, queryHistory: [] }
    emit()
  },

  // ===== Backup & Restore (对齐 Guidelines: one-click logical dump) =====

  /** 执行数据库备份 */
  async dumpDatabase(connId: string): Promise<BackupRecord> {
    const profile = state.profiles.find(p => p.id === connId)
    if (!profile) throw new Error('Profile not found')

    const record: BackupRecord = {
      id: genId(),
      connId,
      connName: profile.name,
      type: profile.type,
      filename: `${profile.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.${profile.type === 'redis' ? 'rdb' : 'sql'}`,
      sizeBytes: 0,
      timestamp: Date.now(),
      status: 'in-progress',
    }

    state = { ...state, backups: [record, ...state.backups].slice(0, MAX_BACKUPS) }
    emit()

    // 模拟备份过程
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000))

    const success = Math.random() > 0.1
    const updatedRecord: BackupRecord = {
      ...record,
      status: success ? 'completed' : 'failed',
      sizeBytes: success ? Math.floor(1024 * 1024 * (0.5 + Math.random() * 10)) : 0,
      error: success ? undefined : 'Backup failed: insufficient permissions',
    }

    state = {
      ...state,
      backups: state.backups.map(b => b.id === record.id ? updatedRecord : b),
    }
    emit()
    return updatedRecord
  },

  /** 恢复数据库 */
  async restoreDatabase(_connId: string, backupId: string): Promise<boolean> {
    const backup = state.backups.find(b => b.id === backupId)
    if (!backup) return false

    // 模拟恢复过程
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000))
    return Math.random() > 0.1
  },

  /** 删除备份记录 */
  removeBackup(id: string) {
    state = { ...state, backups: state.backups.filter(b => b.id !== id) }
    emit()
  },

  // ===== Panel Visibility =====

  /** 打开数据库面板 */
  openPanel() {
    state = { ...state, panelVisible: true }
    emit()
  },

  /** 关闭数据库面板 */
  closePanel() {
    state = { ...state, panelVisible: false }
    emit()
  },

  /** 切换子面板 */
  setActiveTab(tab: DBStoreState['activeTab']) {
    state = { ...state, activeTab: tab }
    emit()
  },

  /** 获取 Schemas 缓存 */
  getSchemas(connId: string): string[] {
    return state.schemas[connId] || []
  },

  /** 获取表缓存 */
  getTables(connId: string, schema: string): TableInfo[] {
    return state.tables[`${connId}:${schema}`] || []
  },

  /** 获取列缓存 */
  getColumns(connId: string, schema: string, table: string): ColumnInfo[] {
    return state.columns[`${connId}:${schema}:${table}`] || []
  },
}

// ===== React Hook =====
export function useDBStore() {
  const snapshot = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    () => state,
  )
  return { ...snapshot, ...dbStoreActions }
}

export { dbStoreActions as dbStore }
