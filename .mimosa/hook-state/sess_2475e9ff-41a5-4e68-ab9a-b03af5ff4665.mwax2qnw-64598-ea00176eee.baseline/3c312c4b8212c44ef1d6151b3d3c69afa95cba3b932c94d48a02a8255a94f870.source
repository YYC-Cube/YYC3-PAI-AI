/**
 * @file file-store.ts
 * @description 文件状态管理模块，管理文件系统和操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags file,storage,state-management
 */

import { useSyncExternalStore } from 'react'

// ===== File Version Types (对齐 Guidelines: Full file version control) =====
/** 文件版本快照 */
export interface FileVersion {
  /** 版本唯一标识 */
  id: string
  /** 文件名 */
  filename: string
  /** 文件名（filename的别名） */
  name?: string
  /** 版本内容 */
  content: string
  /** 创建时间 */
  timestamp: number
  /** 版本标签（自动/手动） */
  label: 'auto' | 'manual'
  /** 版本来源描述 */
  description: string
  /** 内容长度 */
  size: number
}

/** 最近文件记录 */
export interface RecentFile {
  /** 文件名 */
  filename: string
  /** 文件名（filename的别名） */
  name?: string
  /** 最后访问时间 */
  lastAccessed: number
  /** 文件扩展名 */
  ext: string
  /** 是否已修改 */
  isModified: boolean
}

/** 文件操作日志 */
export interface FileOperation {
  id: string
  type: 'create' | 'rename' | 'delete' | 'move' | 'edit'
  filename: string
  /** 文件名（filename的别名） */
  name?: string
  oldName?: string
  timestamp: number
  description: string
}

// ===== State Shape =====
interface FileStoreState {
  /** 所有版本快照 (按文件分组) */
  versions: Record<string, FileVersion[]>
  /** 最近文件列表 */
  recentFiles: RecentFile[]
  /** 文件操作日志 */
  operations: FileOperation[]
  /** 版本面板是否可见 */
  versionPanelVisible: boolean
  /** 版本面板当前查看的文件 */
  versionPanelFile: string | null
  /** 最近文件面板是否可见 */
  recentPanelVisible: boolean
  /** 当前查看的版本 diff 对比 ID */
  diffVersionId: string | null
}

// ===== Persistence =====
const LS_KEY = 'yyc3_file_store'
const MAX_VERSIONS_PER_FILE = 50
const MAX_RECENT_FILES = 15
const MAX_OPERATIONS = 100

function loadState(): Partial<FileStoreState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(s: FileStoreState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      versions: s.versions,
      recentFiles: s.recentFiles,
      operations: s.operations,
    }))
  } catch { /* ignore */ }
}

// ===== Module Store =====
const persisted = loadState()
let state: FileStoreState = {
  versions: persisted.versions || {},
  recentFiles: persisted.recentFiles || [],
  operations: persisted.operations || [],
  versionPanelVisible: false,
  versionPanelFile: null,
  recentPanelVisible: false,
  diffVersionId: null,
}

const listeners = new Set<() => void>()
function emit() {
  saveState(state)
  listeners.forEach(fn => fn())
}
function genId() {
  return 'fv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}
function getExt(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot + 1) : ''
}

// ===== Actions =====
export const fileStoreActions = {
  // ===== Version Control (对齐 Guidelines: each edit creates a new immutable version) =====

  /** 创建版本快照 */
  createVersion(filename: string, content: string, label: 'auto' | 'manual' = 'auto', description = '') {
    const version: FileVersion = {
      id: genId(),
      filename,
      content,
      timestamp: Date.now(),
      label,
      description: description || (label === 'auto' ? 'Auto-save' : 'Manual save'),
      size: content.length,
    }
    const existing = state.versions[filename] || []
    // 去重：如果最新版本内容相同则跳过
    if (existing.length > 0 && existing[existing.length - 1].content === content) {
      return
    }
    state = {
      ...state,
      versions: {
        ...state.versions,
        [filename]: [...existing, version].slice(-MAX_VERSIONS_PER_FILE),
      },
    }
    emit()
  },

  /** 获取文件的所有版本 */
  getVersions(filename: string): FileVersion[] {
    return state.versions[filename] || []
  },

  /** 获取版本内容（用于回滚） */
  getVersionContent(versionId: string): string | null {
    for (const versions of Object.values(state.versions)) {
      const v = versions.find(v => v.id === versionId)
      if (v) return v.content
    }
    return null
  },

  /** 删除指定版本 */
  deleteVersion(filename: string, versionId: string) {
    const existing = state.versions[filename] || []
    state = {
      ...state,
      versions: {
        ...state.versions,
        [filename]: existing.filter(v => v.id !== versionId),
      },
    }
    emit()
  },

  /** 清除文件所有版本 */
  clearVersions(filename: string) {
    const { [filename]: _, ...rest } = state.versions
    state = { ...state, versions: rest }
    emit()
  },

  // ===== Recent Files (对齐 Guidelines: Recent Files pane) =====

  /** 记录文件访问 */
  recordAccess(filename: string, isModified = false) {
    const ext = getExt(filename)
    const existing = state.recentFiles.filter(f => f.filename !== filename)
    const entry: RecentFile = {
      filename,
      lastAccessed: Date.now(),
      ext,
      isModified,
    }
    state = {
      ...state,
      recentFiles: [entry, ...existing].slice(0, MAX_RECENT_FILES),
    }
    emit()
  },

  /** 从最近文件列表移除 */
  removeRecentFile(filename: string) {
    state = {
      ...state,
      recentFiles: state.recentFiles.filter(f => f.filename !== filename),
    }
    emit()
  },

  /** 清除所有最近文件 */
  clearRecentFiles() {
    state = { ...state, recentFiles: [] }
    emit()
  },

  // ===== File Operations (对齐 Guidelines: browse, create, rename, delete) =====

  /** 记录文件操作 */
  recordOperation(type: FileOperation['type'], filename: string, description: string, oldName?: string) {
    const op: FileOperation = {
      id: genId(),
      type,
      filename,
      oldName,
      timestamp: Date.now(),
      description,
    }
    state = {
      ...state,
      operations: [op, ...state.operations].slice(0, MAX_OPERATIONS),
    }
    emit()
  },

  /** 获取文件操作日志 */
  getOperations(limit = 20): FileOperation[] {
    return state.operations.slice(0, limit)
  },

  // ===== Panel Visibility =====

  /** 打开版本面板 */
  openVersionPanel(filename: string) {
    state = { ...state, versionPanelVisible: true, versionPanelFile: filename, diffVersionId: null }
    emit()
  },

  /** 关闭版本面板 */
  closeVersionPanel() {
    state = { ...state, versionPanelVisible: false, versionPanelFile: null, diffVersionId: null }
    emit()
  },

  /** 设置 diff 对比版本 */
  setDiffVersion(versionId: string | null) {
    state = { ...state, diffVersionId: versionId }
    emit()
  },

  /** 切换最近文件面板 */
  toggleRecentPanel() {
    state = { ...state, recentPanelVisible: !state.recentPanelVisible }
    emit()
  },

  /** 关闭最近文件面板 */
  closeRecentPanel() {
    state = { ...state, recentPanelVisible: false }
    emit()
  },

  // ===== Simple Diff Utility =====

  /** 简单行级 diff（用于版本对比显示） */
  computeLineDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const result: DiffLine[] = []
    const maxLen = Math.max(oldLines.length, newLines.length)

    for (let i = 0; i < maxLen; i++) {
      const oldLine = i < oldLines.length ? oldLines[i] : undefined
      const newLine = i < newLines.length ? newLines[i] : undefined

      if (oldLine === newLine) {
        result.push({ type: 'same', content: newLine!, lineNumber: i + 1 })
      } else if (oldLine === undefined) {
        result.push({ type: 'added', content: newLine!, lineNumber: i + 1 })
      } else if (newLine === undefined) {
        result.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
      } else {
        result.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
        result.push({ type: 'added', content: newLine, lineNumber: i + 1 })
      }
    }
    return result
  },
}

/** Diff 行类型 */
export interface DiffLine {
  type: 'same' | 'added' | 'removed'
  content: string
  lineNumber: number
}

// ===== React Hook =====
export function useFileStore() {
  const snapshot = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    () => state,
  )
  return { ...snapshot, ...fileStoreActions }
}

export { fileStoreActions as fileStore }
