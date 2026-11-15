/**
 * @file ide-store.ts
 * @description IDE状态管理模块，管理IDE布局和状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,editor,state-management,critical
 */

import { useSyncExternalStore } from 'react'
import {
  type LayoutMode,
  TERMINAL_HEIGHT_MIN,
  TERMINAL_HEIGHT_MAX,
  LEFT_WIDTH_MIN,
  LEFT_WIDTH_MAX,
  MIDDLE_RATIO_MIN,
  MIDDLE_RATIO_MAX,
  DEFAULT_LEFT_WIDTH,
  DEFAULT_MIDDLE_RATIO,
  DEFAULT_TERMINAL_HEIGHT,
} from '../types'

// ===== Tab Types (对齐 Guidelines: Tab System) =====
/** 编辑器 Tab 数据 */
export interface EditorTab {
  /** 文件名（唯一标识） */
  id: string
  /** 显示名称 */
  label: string
  /** 是否已修改（未保存） */
  isModified: boolean
  /** 是否固定（不可关闭） */
  isPinned: boolean
  /** 文件扩展名 */
  ext: string
}

/** 编辑器分屏方向 */
export type SplitDirection = 'none' | 'horizontal' | 'vertical'

/** 对齐 Guidelines: Panel Types — 面板类型 */
export type PanelType =
  | 'code-editor'
  | 'file-browser'
  | 'preview'
  | 'terminal'
  | 'ai-chat'
  | 'git'
  | 'search'
  | 'diagnostics'
  | 'performance'

/** 对齐 Guidelines: Layout Persistence — 布局预设 */
export interface LayoutPreset {
  id: string
  name: { zh: string; en: string }
  icon: string
  leftWidthPercent: number
  middleRatioPercent: number
  terminalVisible: boolean
  terminalHeight: number
  splitDirection: SplitDirection
  splitRatio: number
  /** 左侧面板要显示的面板类型 */
  leftPanel: PanelType
  /** 是否折叠左侧面板 */
  leftCollapsed: boolean
}

/** 对齐 Guidelines: Layout Persistence — 预设布局列表 */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: { zh: '标准三栏', en: 'Standard' },
    icon: 'Columns3',
    leftWidthPercent: 35,
    middleRatioPercent: 46,
    terminalVisible: false,
    terminalHeight: 220,
    splitDirection: 'none',
    splitRatio: 50,
    leftPanel: 'ai-chat',
    leftCollapsed: false,
  },
  {
    id: 'coding',
    name: { zh: '编码模式', en: 'Coding' },
    icon: 'Code2',
    leftWidthPercent: 25,
    middleRatioPercent: 40,
    terminalVisible: false,
    terminalHeight: 180,
    splitDirection: 'none',
    splitRatio: 50,
    leftPanel: 'ai-chat',
    leftCollapsed: false,
  },
  {
    id: 'focus',
    name: { zh: '专注模式', en: 'Focus' },
    icon: 'Maximize2',
    leftWidthPercent: 0,
    middleRatioPercent: 30,
    terminalVisible: false,
    terminalHeight: 180,
    splitDirection: 'none',
    splitRatio: 50,
    leftPanel: 'file-browser',
    leftCollapsed: true,
  },
  {
    id: 'debug',
    name: { zh: '调试模式', en: 'Debug' },
    icon: 'Bug',
    leftWidthPercent: 22,
    middleRatioPercent: 40,
    terminalVisible: true,
    terminalHeight: 240,
    splitDirection: 'horizontal',
    splitRatio: 50,
    leftPanel: 'diagnostics',
    leftCollapsed: false,
  },
  {
    id: 'fullstack',
    name: { zh: '全栈模式', en: 'Fullstack' },
    icon: 'Layers',
    leftWidthPercent: 30,
    middleRatioPercent: 46,
    terminalVisible: true,
    terminalHeight: 220,
    splitDirection: 'vertical',
    splitRatio: 55,
    leftPanel: 'ai-chat',
    leftCollapsed: false,
  },
  {
    id: 'collab',
    name: { zh: '协作模式', en: 'Collaboration' },
    icon: 'Users',
    leftWidthPercent: 35,
    middleRatioPercent: 46,
    terminalVisible: false,
    terminalHeight: 180,
    splitDirection: 'none',
    splitRatio: 50,
    leftPanel: 'ai-chat',
    leftCollapsed: false,
  },
]

// ===== State Shape =====
interface IDEState {
  layoutMode: LayoutMode
  fullscreenPreview: boolean
  leftWidthPercent: number
  middleRatioPercent: number
  terminalVisible: boolean
  terminalHeight: number
  /** 终端扩展模式：false=仅占右栏(35%)，true=占中栏+右栏(65%) */
  terminalExpanded: boolean
  selectedFile: string
  searchQuery: string
  chatToolbarOpen: boolean
  /** 对齐 Guidelines: Tab Management — 已打开的 Tab 列表 */
  openTabs: EditorTab[]
  /** 对齐 Guidelines: Tab States — 当前活跃 Tab ID */
  activeTabId: string
  /** 对齐 Guidelines: Panel Splitting — 编辑器分屏方向 */
  splitDirection: SplitDirection
  /** 分屏时第二个编辑器的活跃文件 */
  splitActiveFile: string | null
  /** 分屏比例 (0-100) */
  splitRatio: number
  /** 对齐 Guidelines: Panel Types — 当前活跃的左侧面板类型 */
  leftPanel: PanelType
  /** 对齐 Guidelines: Panel Management — 左侧面板是否折叠 */
  leftCollapsed: boolean
  /** 对齐 Guidelines: Layout Persistence — 当前激活的布局预设 ID */
  activePresetId: string
}

// ===== Persistence Keys =====
const STORAGE_KEY = 'yyc3-ide-layout'
const LAYOUT_VERSION = 2 // Bump to force re-init with new 35/30/35 defaults

/** 从 localStorage 加载布局 */
function loadPersistedLayout(): Partial<IDEState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // Version migration: if layout version is outdated, reset to new defaults
    if (parsed._layoutVersion !== LAYOUT_VERSION) return {}
    return parsed
  } catch {
    return {}
  }
}

/** 持久化布局到 localStorage */
function persistLayout() {
  try {
    const { layoutMode, fullscreenPreview, leftWidthPercent, middleRatioPercent,
      terminalVisible, terminalHeight, openTabs, activeTabId,
      splitDirection, splitActiveFile, splitRatio, leftPanel, leftCollapsed, activePresetId,
      terminalExpanded } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      _layoutVersion: LAYOUT_VERSION,
      layoutMode, fullscreenPreview, leftWidthPercent, middleRatioPercent,
      terminalVisible, terminalHeight, openTabs, activeTabId,
      splitDirection, splitActiveFile, splitRatio,
      leftPanel, leftCollapsed, activePresetId, terminalExpanded,
    }))
  } catch { /* ignore */ }
}

// ===== Default Tab =====
const DEFAULT_TAB: EditorTab = {
  id: 'IDEMode.tsx',
  label: 'IDEMode.tsx',
  isModified: false,
  isPinned: false,
  ext: 'tsx',
}

// ===== Module-level store =====
const persisted = loadPersistedLayout()
let state: IDEState = {
  layoutMode: (persisted.layoutMode as LayoutMode) || 'edit',
  fullscreenPreview: persisted.fullscreenPreview ?? false,
  leftWidthPercent: persisted.leftWidthPercent ?? DEFAULT_LEFT_WIDTH,
  middleRatioPercent: persisted.middleRatioPercent ?? DEFAULT_MIDDLE_RATIO,
  terminalVisible: persisted.terminalVisible ?? false,
  terminalHeight: persisted.terminalHeight ?? DEFAULT_TERMINAL_HEIGHT,
  terminalExpanded: persisted.terminalExpanded ?? false,
  selectedFile: persisted.activeTabId || 'IDEMode.tsx',
  searchQuery: '',
  chatToolbarOpen: false,
  openTabs: (persisted.openTabs && persisted.openTabs.length > 0) ? persisted.openTabs : [DEFAULT_TAB],
  activeTabId: persisted.activeTabId || 'IDEMode.tsx',
  splitDirection: persisted.splitDirection || 'none',
  splitActiveFile: persisted.splitActiveFile || null,
  splitRatio: persisted.splitRatio ?? 50,
  leftPanel: persisted.leftPanel || 'file-browser',
  leftCollapsed: persisted.leftCollapsed ?? false,
  activePresetId: persisted.activePresetId || 'coding',
}

type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
  // 自动持久化
  persistLayout()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let cachedState: IDEState | null = null
function getSnapshot() {
  if (!cachedState || cachedState !== state) {
    cachedState = state
  }
  return cachedState
}

// ===== Helper: extract ext from filename =====
function getExt(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot + 1) : ''
}

// ===== Actions =====
const actions = {
  setLayoutMode: (mode: LayoutMode) => {
    state = { ...state, layoutMode: mode }
    emitChange()
  },

  switchLayoutMode: () => {
    state = { ...state, layoutMode: state.layoutMode === 'edit' ? 'preview' : 'edit' }
    emitChange()
  },

  setFullscreenPreview: (val: boolean) => {
    state = { ...state, fullscreenPreview: val }
    emitChange()
  },

  toggleFullscreenPreview: () => {
    state = { ...state, fullscreenPreview: !state.fullscreenPreview }
    emitChange()
  },

  setLeftWidth: (percent: number) => {
    state = { ...state, leftWidthPercent: Math.max(LEFT_WIDTH_MIN, Math.min(LEFT_WIDTH_MAX, percent)) }
    emitChange()
  },

  setMiddleRatio: (percent: number) => {
    state = { ...state, middleRatioPercent: Math.max(MIDDLE_RATIO_MIN, Math.min(MIDDLE_RATIO_MAX, percent)) }
    emitChange()
  },

  toggleTerminal: () => {
    state = { ...state, terminalVisible: !state.terminalVisible }
    emitChange()
  },

  setTerminalVisible: (val: boolean) => {
    state = { ...state, terminalVisible: val }
    emitChange()
  },

  setTerminalHeight: (height: number) => {
    state = { ...state, terminalHeight: Math.max(TERMINAL_HEIGHT_MIN, Math.min(TERMINAL_HEIGHT_MAX, height)) }
    emitChange()
  },

  setTerminalExpanded: (val: boolean) => {
    state = { ...state, terminalExpanded: val }
    emitChange()
  },

  setSelectedFile: (file: string) => {
    state = { ...state, selectedFile: file, activeTabId: file }
    emitChange()
  },

  setSearchQuery: (query: string) => {
    state = { ...state, searchQuery: query }
    emitChange()
  },

  toggleChatToolbar: () => {
    state = { ...state, chatToolbarOpen: !state.chatToolbarOpen }
    emitChange()
  },

  setChatToolbarOpen: (val: boolean) => {
    state = { ...state, chatToolbarOpen: val }
    emitChange()
  },

  // Computed: terminal left position (relative to middle+right container)
  calculateTerminalLeft: (): string => {
    if (state.layoutMode === 'edit') {
      return `${state.middleRatioPercent}%`
    }
    return '0'
  },

  // ===== Tab Management (对齐 Guidelines: Tab System) =====

  /** 打开文件为 Tab（如果已存在则激活） */
  openTab: (filename: string) => {
    const existing = state.openTabs.find(t => t.id === filename)
    if (existing) {
      state = { ...state, activeTabId: filename, selectedFile: filename }
    } else {
      const newTab: EditorTab = {
        id: filename,
        label: filename,
        isModified: false,
        isPinned: false,
        ext: getExt(filename),
      }
      state = {
        ...state,
        openTabs: [...state.openTabs, newTab],
        activeTabId: filename,
        selectedFile: filename,
      }
    }
    emitChange()
  },

  /** 关闭 Tab（固定的 Tab 不可关闭，至少保留一个 Tab） */
  closeTab: (tabId: string) => {
    const tab = state.openTabs.find(t => t.id === tabId)
    if (!tab || tab.isPinned) return
    const remaining = state.openTabs.filter(t => t.id !== tabId)
    if (remaining.length === 0) return // 至少保留一个

    let newActiveId = state.activeTabId
    if (state.activeTabId === tabId) {
      // 激活相邻 tab
      const closedIdx = state.openTabs.findIndex(t => t.id === tabId)
      const nextIdx = Math.min(closedIdx, remaining.length - 1)
      newActiveId = remaining[nextIdx].id
    }
    state = {
      ...state,
      openTabs: remaining,
      activeTabId: newActiveId,
      selectedFile: newActiveId,
    }
    emitChange()
  },

  /** 切换 Tab 激活状态 */
  activateTab: (tabId: string) => {
    if (state.openTabs.find(t => t.id === tabId)) {
      state = { ...state, activeTabId: tabId, selectedFile: tabId }
      emitChange()
    }
  },

  /** 固定/取消固定 Tab */
  togglePinTab: (tabId: string) => {
    state = {
      ...state,
      openTabs: state.openTabs.map(t =>
        t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
      ),
    }
    emitChange()
  },

  /** 标记 Tab 为已修改 */
  markTabModified: (tabId: string, isModified: boolean) => {
    state = {
      ...state,
      openTabs: state.openTabs.map(t =>
        t.id === tabId ? { ...t, isModified } : t
      ),
    }
    emitChange()
  },

  /** 重排 Tab（拖拽排序） */
  reorderTabs: (fromIdx: number, toIdx: number) => {
    const tabs = [...state.openTabs]
    const [moved] = tabs.splice(fromIdx, 1)
    tabs.splice(toIdx, 0, moved)
    state = { ...state, openTabs: tabs }
    emitChange()
  },

  /** 关闭其他 Tab（保留当前激活和固定的） */
  closeOtherTabs: (keepTabId: string) => {
    const remaining = state.openTabs.filter(t => t.id === keepTabId || t.isPinned)
    if (remaining.length === 0) return
    state = { ...state, openTabs: remaining }
    if (!remaining.find(t => t.id === state.activeTabId)) {
      state = { ...state, activeTabId: keepTabId, selectedFile: keepTabId }
    }
    emitChange()
  },

  /** 关闭右侧 Tab */
  closeTabsToRight: (tabId: string) => {
    const idx = state.openTabs.findIndex(t => t.id === tabId)
    if (idx < 0) return
    const remaining = state.openTabs.filter((t, i) => i <= idx || t.isPinned)
    state = { ...state, openTabs: remaining }
    if (!remaining.find(t => t.id === state.activeTabId)) {
      state = { ...state, activeTabId: remaining[remaining.length - 1].id, selectedFile: remaining[remaining.length - 1].id }
    }
    emitChange()
  },

  // ===== Split View (对齐 Guidelines: Panel Splitting) =====

  /** 切换分屏方向 */
  toggleSplit: (direction?: SplitDirection) => {
    if (direction) {
      state = { ...state, splitDirection: direction }
    } else {
      // 循环: none → horizontal → vertical → none
      const next: SplitDirection =
        state.splitDirection === 'none' ? 'horizontal'
        : state.splitDirection === 'horizontal' ? 'vertical'
        : 'none'
      state = { ...state, splitDirection: next }
    }
    // 分屏时如果没有第二个文件，默认用当前文件
    if (state.splitDirection !== 'none' && !state.splitActiveFile) {
      state = { ...state, splitActiveFile: state.activeTabId }
    }
    emitChange()
  },

  /** 设置分屏第二文件 */
  setSplitFile: (filename: string | null) => {
    state = { ...state, splitActiveFile: filename }
    emitChange()
  },

  /** 设置分屏比例 */
  setSplitRatio: (ratio: number) => {
    state = { ...state, splitRatio: Math.max(20, Math.min(80, ratio)) }
    emitChange()
  },

  // ===== Layout Persistence (对齐 Guidelines: Layout Persistence) =====

  /** 对齐 Guidelines: Layout Persistence — 应用布局预设 */
  applyPreset: (presetId: string) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    state = {
      ...state,
      leftWidthPercent: preset.leftCollapsed ? 0 : preset.leftWidthPercent,
      middleRatioPercent: preset.middleRatioPercent,
      terminalVisible: preset.terminalVisible,
      terminalHeight: preset.terminalHeight,
      splitDirection: preset.splitDirection,
      splitRatio: preset.splitRatio,
      leftPanel: preset.leftPanel,
      leftCollapsed: preset.leftCollapsed,
      activePresetId: presetId,
    }
    if (state.splitDirection !== 'none' && !state.splitActiveFile) {
      state = { ...state, splitActiveFile: state.activeTabId }
    }
    emitChange()
  },

  /** 对齐 Guidelines: Panel Management — 切换左侧面板折叠 */
  toggleLeftCollapsed: () => {
    state = { ...state, leftCollapsed: !state.leftCollapsed }
    emitChange()
  },

  /** 对齐 Guidelines: Panel Types — 设置左侧面板类型 */
  setLeftPanel: (panel: PanelType) => {
    state = { ...state, leftPanel: panel, leftCollapsed: false }
    emitChange()
  },

  /** 重置布局到默认值 */
  resetLayout: () => {
    state = {
      layoutMode: 'edit',
      fullscreenPreview: false,
      leftWidthPercent: DEFAULT_LEFT_WIDTH,
      middleRatioPercent: DEFAULT_MIDDLE_RATIO,
      terminalVisible: true,
      terminalHeight: DEFAULT_TERMINAL_HEIGHT,
      terminalExpanded: false,
      selectedFile: 'IDEMode.tsx',
      searchQuery: '',
      chatToolbarOpen: false,
      openTabs: [DEFAULT_TAB],
      activeTabId: 'IDEMode.tsx',
      splitDirection: 'none',
      splitActiveFile: null,
      splitRatio: 50,
      leftPanel: 'file-browser',
      leftCollapsed: false,
      activePresetId: 'coding',
    }
    emitChange()
  },
}

// ===== React Hook =====
export function useIDEStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, ...actions }
}

// ===== Direct access for non-React contexts =====
export const ideStore = {
  getState: getSnapshot,
  ...actions,
}
