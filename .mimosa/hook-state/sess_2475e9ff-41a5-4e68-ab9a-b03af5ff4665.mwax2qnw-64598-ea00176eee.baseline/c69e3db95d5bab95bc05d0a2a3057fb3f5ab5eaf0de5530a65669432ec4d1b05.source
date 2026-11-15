/**
 * @file preview-store.ts
 * @description 预览状态管理模块，管理实时预览状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,state-management,core
 */

import { useSyncExternalStore } from 'react'

// ===== Types =====

/** Preview update mode */
export type PreviewMode = 'realtime' | 'manual' | 'delayed' | 'smart'

/** Device preset */
export interface DevicePreset {
  id: string
  name: { zh: string; en: string }
  width: number
  height: number
  icon: 'monitor' | 'tablet' | 'smartphone'
}

/** Preview history snapshot */
export interface PreviewSnapshot {
  id: string
  code: string
  language: string
  timestamp: number
  label?: string
}

/** Console log entry */
export interface ConsoleEntry {
  id: string
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: number
}

/** Preview error */
export interface PreviewError {
  message: string
  line?: number
  column?: number
  stack?: string
}

// ===== Device Presets =====
export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'responsive', name: { zh: '自适应', en: 'Responsive' }, width: 0, height: 0, icon: 'monitor' },
  { id: 'desktop', name: { zh: '桌面端', en: 'Desktop' }, width: 1440, height: 900, icon: 'monitor' },
  { id: 'laptop', name: { zh: '笔记本', en: 'Laptop' }, width: 1280, height: 800, icon: 'monitor' },
  { id: 'ipad-pro', name: { zh: 'iPad Pro', en: 'iPad Pro' }, width: 1024, height: 1366, icon: 'tablet' },
  { id: 'ipad', name: { zh: 'iPad', en: 'iPad' }, width: 768, height: 1024, icon: 'tablet' },
  { id: 'iphone-15', name: { zh: 'iPhone 15', en: 'iPhone 15' }, width: 393, height: 852, icon: 'smartphone' },
  { id: 'iphone-se', name: { zh: 'iPhone SE', en: 'iPhone SE' }, width: 375, height: 667, icon: 'smartphone' },
  { id: 'android', name: { zh: 'Android', en: 'Android' }, width: 412, height: 915, icon: 'smartphone' },
]

/** 对齐 Guidelines: Breakpoint Preview — 常见 CSS 响应式断点 */
export const CSS_BREAKPOINTS = [
  { label: 'xs', width: 320, color: '#ef4444' },
  { label: 'sm', width: 640, color: '#f97316' },
  { label: 'md', width: 768, color: '#eab308' },
  { label: 'lg', width: 1024, color: '#22c55e' },
  { label: 'xl', width: 1280, color: '#3b82f6' },
  { label: '2xl', width: 1536, color: '#8b5cf6' },
] as const

// ===== State Shape =====
interface PreviewState {
  /** Current preview mode */
  mode: PreviewMode
  /** Selected device preset ID */
  deviceId: string
  /** Custom device width (0 = responsive/fill) */
  customWidth: number
  /** Custom device height (0 = responsive/fill) */
  customHeight: number
  /** Preview delay in ms (for delayed mode) */
  delay: number
  /** Auto-refresh interval in ms (0 = disabled) */
  autoRefreshInterval: number
  /** Whether scroll sync is enabled */
  scrollSyncEnabled: boolean
  /** Whether console panel is visible */
  consoleVisible: boolean
  /** Console entries */
  consoleEntries: ConsoleEntry[]
  /** Preview history snapshots */
  history: PreviewSnapshot[]
  /** Current history index (-1 = latest) */
  historyIndex: number
  /** Max history entries */
  maxHistory: number
  /** Current preview error */
  error: PreviewError | null
  /** Whether preview is currently updating */
  isUpdating: boolean
  /** Last update timestamp */
  lastUpdateTime: number
  /** Show device frame chrome */
  showDeviceFrame: boolean
  /** Show responsive grid lines */
  showGridLines: boolean
  /** Preview zoom level (0.25 to 2.0) */
  zoom: number
  /** Preview orientation: portrait or landscape */
  orientation: 'portrait' | 'landscape'
  /** 对齐 Guidelines: Performance Analysis — iframe 渲染耗时(ms) */
  renderTime: number
  /** 对齐 Guidelines: Breakpoint Preview — 是否显示断点标尺 */
  showBreakpointRuler: boolean
  /** 对齐 Guidelines: Multi-Device Preview — 是否启用多设备并排预览 */
  multiDeviceMode: boolean
  /** 对齐 Guidelines: Multi-Device Preview — 并排设备列表 */
  multiDeviceIds: string[]
  /** 编辑模式下是否显示内联预览面板 */
  inlinePreviewVisible: boolean
  /** 内联预览面板高度 */
  inlinePreviewHeight: number
}

// ===== Default State =====
const LS_KEY = 'yyc3_preview_settings'

function loadSettings(): Partial<PreviewState> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveSettings(s: PreviewState) {
  try {
    const { consoleEntries: _consoleEntries, history: _history, historyIndex: _historyIndex, error: _error, isUpdating: _isUpdating, lastUpdateTime: _lastUpdateTime, renderTime: _renderTime, ...persist } = s
    localStorage.setItem(LS_KEY, JSON.stringify(persist))
  } catch { /* ignore */ }
}

const defaults: PreviewState = {
  mode: 'realtime',
  deviceId: 'responsive',
  customWidth: 0,
  customHeight: 0,
  delay: 300,
  autoRefreshInterval: 0,
  scrollSyncEnabled: true,
  consoleVisible: false,
  consoleEntries: [],
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  error: null,
  isUpdating: false,
  lastUpdateTime: 0,
  showDeviceFrame: true,
  showGridLines: false,
  zoom: 1,
  orientation: 'portrait',
  renderTime: 0,
  showBreakpointRuler: false,
  multiDeviceMode: false,
  multiDeviceIds: [],
  inlinePreviewVisible: false,
  inlinePreviewHeight: 300,
}

let state: PreviewState = { ...defaults, ...loadSettings() }

// ===== Store Mechanics =====
type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  for (const l of listeners) l()
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function getSnapshot() {
  return state
}

function setState(partial: Partial<PreviewState>) {
  state = { ...state, ...partial }
  saveSettings(state)
  emitChange()
}

// ===== Actions =====

/** Set preview mode */
function setMode(mode: PreviewMode) {
  setState({ mode })
}

/** Set selected device */
function setDevice(deviceId: string) {
  setState({ deviceId })
}

/** Set custom dimensions */
function setCustomDimensions(width: number, height: number) {
  setState({ customWidth: width, customHeight: height })
}

/** Toggle scroll sync */
function toggleScrollSync() {
  setState({ scrollSyncEnabled: !state.scrollSyncEnabled })
}

/** Toggle console */
function toggleConsole() {
  setState({ consoleVisible: !state.consoleVisible })
}

/** Add console entry */
function addConsoleEntry(type: ConsoleEntry['type'], message: string) {
  const entry: ConsoleEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
    timestamp: Date.now(),
  }
  setState({ consoleEntries: [...state.consoleEntries.slice(-200), entry] })
}

/** Clear console */
function clearConsole() {
  setState({ consoleEntries: [] })
}

/** Add history snapshot */
function addHistorySnapshot(code: string, language: string, label?: string) {
  const snapshot: PreviewSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    code,
    language,
    timestamp: Date.now(),
    label,
  }
  const newHistory = [...state.history.slice(0, state.historyIndex + 1 === 0 ? state.history.length : state.historyIndex + 1), snapshot].slice(-state.maxHistory)
  setState({ history: newHistory, historyIndex: newHistory.length - 1 })
}

/** Navigate history (undo) */
function historyBack() {
  if (state.historyIndex > 0) {
    setState({ historyIndex: state.historyIndex - 1 })
  }
}

/** Navigate history (redo) */
function historyForward() {
  if (state.historyIndex < state.history.length - 1) {
    setState({ historyIndex: state.historyIndex + 1 })
  }
}

/** Restore to specific history index */
function restoreHistory(index: number) {
  if (index >= 0 && index < state.history.length) {
    setState({ historyIndex: index })
  }
}

/** Set preview error */
function setPreviewError(error: PreviewError | null) {
  setState({ error })
}

/** Set updating state */
function setIsUpdating(isUpdating: boolean) {
  setState({ isUpdating, lastUpdateTime: isUpdating ? state.lastUpdateTime : Date.now() })
}

/** Set zoom level */
function setZoom(zoom: number) {
  setState({ zoom: Math.max(0.25, Math.min(2, zoom)) })
}

/** Toggle device frame */
function toggleDeviceFrame() {
  setState({ showDeviceFrame: !state.showDeviceFrame })
}

/** Toggle grid lines */
function toggleGridLines() {
  setState({ showGridLines: !state.showGridLines })
}

/** Toggle orientation */
function toggleOrientation() {
  setState({ orientation: state.orientation === 'portrait' ? 'landscape' : 'portrait' })
}

/** Set delay */
function setDelay(delay: number) {
  setState({ delay: Math.max(0, Math.min(5000, delay)) })
}

/** 对齐 Guidelines: Performance Analysis — 记录渲染耗时 */
function setRenderTime(ms: number) {
  setState({ renderTime: Math.round(ms) })
}

/** 对齐 Guidelines: Breakpoint Preview — 切换断点标尺 */
function toggleBreakpointRuler() {
  setState({ showBreakpointRuler: !state.showBreakpointRuler })
}

/** 对齐 Guidelines: Multi-Device Preview — 切换多设备并排模式 */
function toggleMultiDeviceMode() {
  const enabled = !state.multiDeviceMode
  setState({
    multiDeviceMode: enabled,
    multiDeviceIds: enabled && state.multiDeviceIds.length === 0
      ? ['desktop', 'ipad', 'iphone-15']
      : state.multiDeviceIds,
  })
}

/** 对齐 Guidelines: Multi-Device Preview — 设置并排设备列表 */
function setMultiDeviceIds(ids: string[]) {
  setState({ multiDeviceIds: ids.slice(0, 4) }) // 最多 4 个
}

/** 切换编辑模式内联预览面板 */
function toggleInlinePreview() {
  setState({ inlinePreviewVisible: !state.inlinePreviewVisible })
}

/** 设置内联预览面板高度 */
function setInlinePreviewHeight(h: number) {
  setState({ inlinePreviewHeight: Math.max(120, Math.min(500, h)) })
}

/** 设置自动刷新间隔 */
function setAutoRefreshInterval(ms: number) {
  setState({ autoRefreshInterval: Math.max(0, Math.min(30000, ms)) })
}

/** Get current device dimensions */
function getCurrentDeviceDimensions(): { width: number; height: number } {
  const device = DEVICE_PRESETS.find(d => d.id === state.deviceId)
  if (!device || device.id === 'responsive') {
    return { width: state.customWidth, height: state.customHeight }
  }
  const w = state.orientation === 'portrait' ? device.width : device.height
  const h = state.orientation === 'portrait' ? device.height : device.width
  return { width: w, height: h }
}

// ===== Hook =====
export function usePreviewStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot)
  return {
    ...snap,
    setMode,
    setDevice,
    setCustomDimensions,
    toggleScrollSync,
    toggleConsole,
    addConsoleEntry,
    clearConsole,
    addHistorySnapshot,
    historyBack,
    historyForward,
    restoreHistory,
    setPreviewError,
    setIsUpdating,
    setZoom,
    toggleDeviceFrame,
    toggleGridLines,
    toggleOrientation,
    setDelay,
    setRenderTime,
    toggleBreakpointRuler,
    toggleMultiDeviceMode,
    setMultiDeviceIds,
    toggleInlinePreview,
    setInlinePreviewHeight,
    setAutoRefreshInterval,
    getCurrentDeviceDimensions,
  }
}

// ===== Imperative API (for non-React callers and tests) =====
export const previewStoreActions = {
  getState: getSnapshot,
  setMode,
  setDevice,
  setCustomDimensions,
  toggleScrollSync,
  toggleConsole,
  addConsoleEntry,
  clearConsole,
  addHistorySnapshot,
  historyBack,
  historyForward,
  restoreHistory,
  setPreviewError,
  setIsUpdating,
  setZoom,
  toggleDeviceFrame,
  toggleGridLines,
  toggleOrientation,
  setDelay,
  setRenderTime,
  toggleBreakpointRuler,
  toggleMultiDeviceMode,
  setMultiDeviceIds,
  toggleInlinePreview,
  setInlinePreviewHeight,
  setAutoRefreshInterval,
  getCurrentDeviceDimensions,
}
