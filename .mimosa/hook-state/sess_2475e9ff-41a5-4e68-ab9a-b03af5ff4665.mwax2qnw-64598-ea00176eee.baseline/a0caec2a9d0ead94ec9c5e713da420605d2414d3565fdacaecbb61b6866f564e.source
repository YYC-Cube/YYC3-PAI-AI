/**
 * @file panel-dnd-store.ts
 * @description 面板拖拽状态管理模块，管理面板拖拽和布局
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,drag-drop,state-management
 */

import { useSyncExternalStore } from 'react'

/** 可拖拽的面板槽位 */
export type PanelSlot = 'left' | 'center' | 'right'

/** 面板内容类型 */
export type PanelContentType =
  | 'ai-chat'
  | 'file-explorer'
  | 'code-editor'
  | 'preview'
  | 'terminal'

/** 面板内容配置 */
export interface PanelContentConfig {
  type: PanelContentType
  labelKey: string      // i18n key (ide section)
  iconName: string      // Lucide icon name
}

/** 预定义面板内容 */
export const PANEL_CONTENT_MAP: Record<PanelContentType, PanelContentConfig> = {
  'ai-chat': { type: 'ai-chat', labelKey: 'aiChat', iconName: 'MessageSquare' },
  'file-explorer': { type: 'file-explorer', labelKey: 'fileExplorer', iconName: 'FolderOpen' },
  'code-editor': { type: 'code-editor', labelKey: 'codeView', iconName: 'Code2' },
  'preview': { type: 'preview', labelKey: 'preview', iconName: 'Eye' },
  'terminal': { type: 'terminal', labelKey: 'terminal', iconName: 'Terminal' },
}

// ===== 弹出窗口状态 (对齐 Guidelines: Window Management — Multi-Window Support) =====
export interface DetachedWindow {
  id: string
  contentType: PanelContentType
  /** 源槽位 (detach 来源) */
  sourceSlot: PanelSlot
  /** 窗口位置 */
  position: { x: number; y: number }
  /** 窗口尺寸 */
  size: { width: number; height: number }
  /** z-index */
  zIndex: number
  /** 是否最小化 */
  isMinimized: boolean
}

// ===== Layout Snapshot (对齐 Guidelines: Layout Persistence) =====

/** 窗口快照（可序列化） */
export interface WindowSnapshot {
  contentType: PanelContentType
  sourceSlot: PanelSlot
  position: { x: number; y: number }
  size: { width: number; height: number }
}

/** 完整布局快照 */
export interface LayoutSnapshot {
  id: string
  name: string
  slots: Record<PanelSlot, PanelContentType>
  windows: WindowSnapshot[]
  createdAt: number
  updatedAt: number
}

/** 布局云同步状态 (对齐 Guidelines: Layout Synchronization — Cloud Sync) */
export interface LayoutSyncState {
  /** 是否正在同步 */
  isSyncing: boolean
  /** 上次云同步时间 */
  lastCloudSyncTime: number | null
  /** 同步错误 */
  syncError: string | null
  /** 冲突列表 */
  conflicts: LayoutSyncConflict[]
  /** 云端布局数 (缓存) */
  cloudLayoutCount: number
}

/** 布局同步冲突 */
export interface LayoutSyncConflict {
  layoutId: string
  localVersion: LayoutSnapshot
  cloudVersion: LayoutSnapshot
  detectedAt: number
  resolved: boolean
}

// ===== State =====
interface PanelDnDState {
  /** 各槽位当前显示的面板类型 */
  slotContent: Record<PanelSlot, PanelContentType>
  /** 当前拖拽中的面板（来源槽位） */
  dragSource: PanelSlot | null
  /** 当前悬停的目标槽位 */
  dropTarget: PanelSlot | null
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 弹出的独立窗口 (对齐 Guidelines: Window Management) */
  detachedWindows: DetachedWindow[]
  /** 下一个窗口 z-index */
  nextZIndex: number
  /** 跨窗口拖拽来源 — 窗口ID或槽位 (对齐 Guidelines: Window Synchronization) */
  crossDragSource: { type: 'window'; windowId: string } | { type: 'slot'; slot: PanelSlot } | null
  /** 跨窗口拖拽目标 */
  crossDropTarget: { type: 'window'; windowId: string } | { type: 'slot'; slot: PanelSlot } | null
  /** 是否正在跨窗口拖拽 */
  isCrossDragging: boolean
  /** 布局云同步状态 */
  layoutSync: LayoutSyncState
}

// ===== Persistence =====
const STORAGE_KEY = 'yyc3-panel-slots'
const LAYOUTS_KEY = 'yyc3-panel-layouts'
const LAST_LAYOUT_KEY = 'yyc3-panel-last-layout'

function loadSlots(): Record<PanelSlot, PanelContentType> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.left && parsed.center && parsed.right) return parsed
    }
  } catch { /* ignore */ }
  // Default: AI Chat | File Explorer | Code Editor
  return { left: 'ai-chat', center: 'file-explorer', right: 'code-editor' }
}

function persistSlots(slots: Record<PanelSlot, PanelContentType>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)) } catch { /* ignore */ }
}

function loadLayouts(): LayoutSnapshot[] {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function persistLayouts(layouts: LayoutSnapshot[]) {
  try { localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts)) } catch { /* ignore */ }
}

function loadLastLayoutId(): string | null {
  try {
    const raw = localStorage.getItem(LAST_LAYOUT_KEY)
    if (raw) return raw
  } catch { /* ignore */ }
  return null
}

function persistLastLayoutId(id: string) {
  try { localStorage.setItem(LAST_LAYOUT_KEY, id) } catch { /* ignore */ }
}

// ===== Module-level store =====
let state: PanelDnDState = {
  slotContent: loadSlots(),
  dragSource: null,
  dropTarget: null,
  isDragging: false,
  detachedWindows: [],
  nextZIndex: 1000,
  crossDragSource: null,
  crossDropTarget: null,
  isCrossDragging: false,
  layoutSync: {
    isSyncing: false,
    lastCloudSyncTime: null,
    syncError: null,
    conflicts: [],
    cloudLayoutCount: 0,
  },
}

type Listener = () => void
const listeners = new Set<Listener>()

// ===== Debounced Auto-Save (对齐 Guidelines: Layout Persistence — Auto Save) =====
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
const AUTO_SAVE_DELAY = 2000 // 2 seconds debounce

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    panelDnDActions.autoSaveLayout()
  }, AUTO_SAVE_DELAY)
}

function emitChange() {
  for (const fn of listeners) fn()
  // Trigger debounced auto-save on any state change that affects layout
  scheduleAutoSave()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() { return state }

// ===== Actions =====
export const panelDnDActions = {
  /** 获取当前状态快照（用于测试和调试） */
  getState: () => state,

  /** 重置全部状态（含窗口和 z-index，用于测试） */
  resetAll: () => {
    state = {
      slotContent: { left: 'ai-chat', center: 'file-explorer', right: 'code-editor' },
      dragSource: null,
      dropTarget: null,
      isDragging: false,
      detachedWindows: [],
      nextZIndex: 1000,
      crossDragSource: null,
      crossDropTarget: null,
      isCrossDragging: false,
      layoutSync: {
        isSyncing: false,
        lastCloudSyncTime: null,
        syncError: null,
        conflicts: [],
        cloudLayoutCount: 0,
      },
    }
    persistSlots(state.slotContent)
    emitChange()
  },

  /** 开始拖拽面板 */
  startDrag: (slot: PanelSlot) => {
    state = { ...state, dragSource: slot, isDragging: true }
    emitChange()
  },

  /** 悬停到目标槽位 */
  hoverSlot: (slot: PanelSlot | null) => {
    if (state.dropTarget !== slot) {
      state = { ...state, dropTarget: slot }
      emitChange()
    }
  },

  /** 完成拖拽：交换两个槽位内容 */
  completeDrop: () => {
    if (state.dragSource && state.dropTarget && state.dragSource !== state.dropTarget) {
      const newSlots = { ...state.slotContent }
      const srcContent = newSlots[state.dragSource]
      newSlots[state.dragSource] = newSlots[state.dropTarget]
      newSlots[state.dropTarget] = srcContent
      state = {
        ...state,
        slotContent: newSlots,
        dragSource: null,
        dropTarget: null,
        isDragging: false,
      }
      persistSlots(state.slotContent)
    } else {
      state = { ...state, dragSource: null, dropTarget: null, isDragging: false }
    }
    emitChange()
  },

  /** 取消拖拽 */
  cancelDrag: () => {
    state = { ...state, dragSource: null, dropTarget: null, isDragging: false }
    emitChange()
  },

  /** 直接设置槽位内容（如从菜单选择） */
  setSlotContent: (slot: PanelSlot, content: PanelContentType) => {
    state = {
      ...state,
      slotContent: { ...state.slotContent, [slot]: content },
    }
    persistSlots(state.slotContent)
    emitChange()
  },

  /** 交换两个槽位 */
  swapSlots: (a: PanelSlot, b: PanelSlot) => {
    if (a === b) return
    const newSlots = { ...state.slotContent }
    const tmp = newSlots[a]
    newSlots[a] = newSlots[b]
    newSlots[b] = tmp
    state = { ...state, slotContent: newSlots }
    persistSlots(state.slotContent)
    emitChange()
  },

  /** 重置为默认布局 */
  resetSlots: () => {
    state = {
      ...state,
      slotContent: { left: 'ai-chat', center: 'file-explorer', right: 'code-editor' },
      dragSource: null,
      dropTarget: null,
      isDragging: false,
    }
    persistSlots(state.slotContent)
    emitChange()
  },

  /** 获取槽位内容配置 */
  getSlotConfig: (slot: PanelSlot): PanelContentConfig => {
    return PANEL_CONTENT_MAP[state.slotContent[slot]]
  },

  /** 分离窗口 */
  detachWindow: (slot: PanelSlot) => {
    const contentType = state.slotContent[slot]
    const newWindow: DetachedWindow = {
      id: `window-${state.nextZIndex}`,
      contentType,
      sourceSlot: slot,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
      zIndex: state.nextZIndex,
      isMinimized: false,
    }
    state = {
      ...state,
      detachedWindows: [...state.detachedWindows, newWindow],
      nextZIndex: state.nextZIndex + 1,
    }
    emitChange()
  },

  /** 关闭窗口 */
  closeWindow: (id: string) => {
    state = {
      ...state,
      detachedWindows: state.detachedWindows.filter(w => w.id !== id),
    }
    emitChange()
  },

  /** 最小化窗口 */
  minimizeWindow: (id: string) => {
    state = {
      ...state,
      detachedWindows: state.detachedWindows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
    }
    emitChange()
  },

  /** 恢复窗口 */
  restoreWindow: (id: string) => {
    state = {
      ...state,
      detachedWindows: state.detachedWindows.map(w => w.id === id ? { ...w, isMinimized: false } : w),
    }
    emitChange()
  },

  /** 移动窗口 */
  moveWindow: (id: string, position: { x: number; y: number }) => {
    state = {
      ...state,
      detachedWindows: state.detachedWindows.map(w => w.id === id ? { ...w, position } : w),
    }
    emitChange()
  },

  /** 调整窗口大小 */
  resizeWindow: (id: string, size: { width: number; height: number }) => {
    state = {
      ...state,
      detachedWindows: state.detachedWindows.map(w => w.id === id ? { ...w, size } : w),
    }
    emitChange()
  },

  /** 设置窗口 z-index */
  setWindowZIndex: (id: string, zIndex: number) => {
    state = {
      ...state,
      detachedWindows: state.detachedWindows.map(w => w.id === id ? { ...w, zIndex } : w),
    }
    emitChange()
  },

  // ===== Cross-Window Drag (对齐 Guidelines: Window Synchronization) =====

  /** 开始跨窗口/槽位拖拽 — 从窗口拖出 */
  startCrossDragFromWindow: (windowId: string) => {
    state = {
      ...state,
      crossDragSource: { type: 'window', windowId },
      isCrossDragging: true,
    }
    emitChange()
  },

  /** 开始跨窗口/槽位拖拽 — 从主面板槽位拖出 */
  startCrossDragFromSlot: (slot: PanelSlot) => {
    state = {
      ...state,
      crossDragSource: { type: 'slot', slot },
      isCrossDragging: true,
    }
    emitChange()
  },

  /** 悬停到跨窗口拖拽目标 */
  hoverCrossTarget: (target: PanelDnDState['crossDropTarget']) => {
    if (state.crossDropTarget !== target) {
      state = { ...state, crossDropTarget: target }
      emitChange()
    }
  },

  /** 完成跨窗口拖拽 — 交换来源与目标内容 */
  completeCrossDrop: () => {
    const { crossDragSource: src, crossDropTarget: tgt } = state
    if (!src || !tgt) {
      state = { ...state, crossDragSource: null, crossDropTarget: null, isCrossDragging: false }
      emitChange()
      return
    }
    // Avoid same-target drop
    if (src.type === tgt.type) {
      if (src.type === 'window' && tgt.type === 'window' && src.windowId === tgt.windowId) {
        state = { ...state, crossDragSource: null, crossDropTarget: null, isCrossDragging: false }
        emitChange()
        return
      }
      if (src.type === 'slot' && tgt.type === 'slot' && src.slot === tgt.slot) {
        state = { ...state, crossDragSource: null, crossDropTarget: null, isCrossDragging: false }
        emitChange()
        return
      }
    }

    // Resolve content types for source and target
    const srcContent = src.type === 'window'
      ? state.detachedWindows.find(w => w.id === src.windowId)?.contentType
      : state.slotContent[src.slot]
    const tgtContent = tgt.type === 'window'
      ? state.detachedWindows.find(w => w.id === tgt.windowId)?.contentType
      : state.slotContent[tgt.slot]

    if (!srcContent || !tgtContent) {
      state = { ...state, crossDragSource: null, crossDropTarget: null, isCrossDragging: false }
      emitChange()
      return
    }

    // Swap content
    let newSlots = { ...state.slotContent }
    let newWindows = [...state.detachedWindows]

    // Apply source content to target
    if (tgt.type === 'slot') {
      newSlots = { ...newSlots, [tgt.slot]: srcContent }
    } else {
      newWindows = newWindows.map(w =>
        w.id === tgt.windowId ? { ...w, contentType: srcContent } : w
      )
    }

    // Apply target content to source
    if (src.type === 'slot') {
      newSlots = { ...newSlots, [src.slot]: tgtContent }
    } else {
      newWindows = newWindows.map(w =>
        w.id === src.windowId ? { ...w, contentType: tgtContent } : w
      )
    }

    state = {
      ...state,
      slotContent: newSlots,
      detachedWindows: newWindows,
      crossDragSource: null,
      crossDropTarget: null,
      isCrossDragging: false,
    }
    persistSlots(state.slotContent)
    emitChange()
  },

  /** 取消跨窗口拖拽 */
  cancelCrossDrag: () => {
    state = { ...state, crossDragSource: null, crossDropTarget: null, isCrossDragging: false }
    emitChange()
  },

  /** 将窗口内容直接发送到指定槽位（窗口→槽位单向转移） */
  sendWindowToSlot: (windowId: string, targetSlot: PanelSlot) => {
    const win = state.detachedWindows.find(w => w.id === windowId)
    if (!win) return
    const prevSlotContent = state.slotContent[targetSlot]
    state = {
      ...state,
      slotContent: { ...state.slotContent, [targetSlot]: win.contentType },
      detachedWindows: state.detachedWindows.map(w =>
        w.id === windowId ? { ...w, contentType: prevSlotContent } : w
      ),
    }
    persistSlots(state.slotContent)
    emitChange()
  },

  /** 将两个窗口的内容互换 */
  swapWindowContents: (windowA: string, windowB: string) => {
    const a = state.detachedWindows.find(w => w.id === windowA)
    const b = state.detachedWindows.find(w => w.id === windowB)
    if (!a || !b) return
    state = {
      ...state,
      detachedWindows: state.detachedWindows.map(w => {
        if (w.id === windowA) return { ...w, contentType: b.contentType }
        if (w.id === windowB) return { ...w, contentType: a.contentType }
        return w
      }),
    }
    emitChange()
  },

  // ===== Layout Persistence (对齐 Guidelines: Layout Persistence) =====

  /** 保存当前布局为命名快照 */
  saveLayout: (name: string): LayoutSnapshot => {
    const id = `layout_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const snapshot: LayoutSnapshot = {
      id,
      name,
      slots: { ...state.slotContent },
      windows: state.detachedWindows.map(w => ({
        contentType: w.contentType,
        sourceSlot: w.sourceSlot,
        position: { ...w.position },
        size: { ...w.size },
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const layouts = loadLayouts()
    layouts.push(snapshot)
    persistLayouts(layouts)
    persistLastLayoutId(id)
    return snapshot
  },

  /** 列出所有已保存布局 */
  listLayouts: (): LayoutSnapshot[] => {
    return loadLayouts()
  },

  /** 加载指定布局并恢复 */
  loadLayout: (layoutId: string): boolean => {
    const layouts = loadLayouts()
    const layout = layouts.find(l => l.id === layoutId)
    if (!layout) return false

    // Close all current windows
    const restoredWindows: DetachedWindow[] = layout.windows.map((w, i) => ({
      id: `window-${state.nextZIndex + i}`,
      contentType: w.contentType,
      sourceSlot: w.sourceSlot,
      position: { ...w.position },
      size: { ...w.size },
      zIndex: state.nextZIndex + i,
      isMinimized: false,
    }))

    state = {
      ...state,
      slotContent: { ...layout.slots },
      detachedWindows: restoredWindows,
      nextZIndex: state.nextZIndex + layout.windows.length,
      dragSource: null,
      dropTarget: null,
      isDragging: false,
      crossDragSource: null,
      crossDropTarget: null,
      isCrossDragging: false,
    }
    persistSlots(state.slotContent)
    persistLastLayoutId(layoutId)
    emitChange()
    return true
  },

  /** 删除已保存布局 */
  deleteLayout: (layoutId: string) => {
    const layouts = loadLayouts().filter(l => l.id !== layoutId)
    persistLayouts(layouts)
  },

  /** 重命名已保存布局 */
  renameLayout: (layoutId: string, newName: string) => {
    const layouts = loadLayouts()
    const layout = layouts.find(l => l.id === layoutId)
    if (layout) {
      layout.name = newName
      layout.updatedAt = Date.now()
      persistLayouts(layouts)
    }
  },

  /** 覆盖已有布局（用当前状态更新） */
  overwriteLayout: (layoutId: string) => {
    const layouts = loadLayouts()
    const idx = layouts.findIndex(l => l.id === layoutId)
    if (idx === -1) return
    layouts[idx] = {
      ...layouts[idx],
      slots: { ...state.slotContent },
      windows: state.detachedWindows.map(w => ({
        contentType: w.contentType,
        sourceSlot: w.sourceSlot,
        position: { ...w.position },
        size: { ...w.size },
      })),
      updatedAt: Date.now(),
    }
    persistLayouts(layouts)
    persistLastLayoutId(layoutId)
  },

  /** 恢复最后使用的布局 */
  restoreLastLayout: (): boolean => {
    const lastId = loadLastLayoutId()
    if (!lastId) return false
    return panelDnDActions.loadLayout(lastId)
  },

  /** 自动保存当前布局（覆盖 "autosave" 布局） */
  autoSaveLayout: () => {
    const layouts = loadLayouts()
    const autoIdx = layouts.findIndex(l => l.name === '__autosave__')
    const snapshot: LayoutSnapshot = {
      id: autoIdx >= 0 ? layouts[autoIdx].id : `layout_auto_${Date.now()}`,
      name: '__autosave__',
      slots: { ...state.slotContent },
      windows: state.detachedWindows.map(w => ({
        contentType: w.contentType,
        sourceSlot: w.sourceSlot,
        position: { ...w.position },
        size: { ...w.size },
      })),
      createdAt: autoIdx >= 0 ? layouts[autoIdx].createdAt : Date.now(),
      updatedAt: Date.now(),
    }
    if (autoIdx >= 0) {
      layouts[autoIdx] = snapshot
    } else {
      layouts.push(snapshot)
    }
    persistLayouts(layouts)
    persistLastLayoutId(snapshot.id)
  },

  // ===== Layout Cloud Sync (对齐 Guidelines: Layout Synchronization — Cloud Sync) =====

  /** 模拟上传本地布局到云端 */
  syncLayoutToCloud: async (layoutId: string): Promise<boolean> => {
    const layouts = loadLayouts()
    const layout = layouts.find(l => l.id === layoutId)
    if (!layout) return false

    state = { ...state, layoutSync: { ...state.layoutSync, isSyncing: true, syncError: null } }
    emitChange()

    try {
      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
      // 模拟成功（90% 概率）
      if (Math.random() < 0.1) throw new Error('Network timeout')

      state = {
        ...state,
        layoutSync: {
          ...state.layoutSync,
          isSyncing: false,
          lastCloudSyncTime: Date.now(),
          syncError: null,
          cloudLayoutCount: state.layoutSync.cloudLayoutCount + 1,
        },
      }
      emitChange()
      return true
    } catch (err) {
      state = {
        ...state,
        layoutSync: {
          ...state.layoutSync,
          isSyncing: false,
          syncError: err instanceof Error ? err.message : 'Unknown error',
        },
      }
      emitChange()
      return false
    }
  },

  /** 模拟从云端拉取布局列表 */
  syncLayoutsFromCloud: async (): Promise<LayoutSnapshot[]> => {
    state = { ...state, layoutSync: { ...state.layoutSync, isSyncing: true, syncError: null } }
    emitChange()

    try {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300))

      // 模拟云端返回（基于本地数据 + 时间戳偏移模拟 "不同设备" 的布局）
      const localLayouts = loadLayouts()
      const cloudLayouts: LayoutSnapshot[] = localLayouts.map(l => ({
        ...l,
        id: `cloud_${l.id}`,
        name: `${l.name} (Cloud)`,
        updatedAt: l.updatedAt + 1000, // 模拟云端略新
      }))

      state = {
        ...state,
        layoutSync: {
          ...state.layoutSync,
          isSyncing: false,
          lastCloudSyncTime: Date.now(),
          syncError: null,
          cloudLayoutCount: cloudLayouts.length,
        },
      }
      emitChange()
      return cloudLayouts
    } catch (err) {
      state = {
        ...state,
        layoutSync: {
          ...state.layoutSync,
          isSyncing: false,
          syncError: err instanceof Error ? err.message : 'Sync failed',
        },
      }
      emitChange()
      return []
    }
  },

  /** 全量同步：上传所有本地布局到云端 */
  syncAllToCloud: async (): Promise<{ uploaded: number; failed: number }> => {
    const layouts = loadLayouts().filter(l => l.name !== '__autosave__')
    let uploaded = 0
    let failed = 0

    state = { ...state, layoutSync: { ...state.layoutSync, isSyncing: true, syncError: null } }
    emitChange()

    for (const _layout of layouts) {
      try {
        await new Promise(r => setTimeout(r, 200 + Math.random() * 200))
        uploaded++
      } catch {
        failed++
      }
    }

    state = {
      ...state,
      layoutSync: {
        ...state.layoutSync,
        isSyncing: false,
        lastCloudSyncTime: Date.now(),
        syncError: failed > 0 ? `${failed} layout(s) failed to sync` : null,
        cloudLayoutCount: uploaded,
      },
    }
    emitChange()
    return { uploaded, failed }
  },

  /** 导入云端布局到本地（合并，去重） */
  importCloudLayout: (cloudLayout: LayoutSnapshot): boolean => {
    const layouts = loadLayouts()
    // Check for ID conflict (strip cloud_ prefix for matching)
    const localId = cloudLayout.id.replace(/^cloud_/, '')
    const existing = layouts.find(l => l.id === localId || l.id === cloudLayout.id)

    if (existing) {
      // Conflict detected
      if (cloudLayout.updatedAt > existing.updatedAt) {
        // Cloud is newer → create conflict entry
        const conflict: LayoutSyncConflict = {
          layoutId: existing.id,
          localVersion: { ...existing },
          cloudVersion: { ...cloudLayout },
          detectedAt: Date.now(),
          resolved: false,
        }
        state = {
          ...state,
          layoutSync: {
            ...state.layoutSync,
            conflicts: [...state.layoutSync.conflicts, conflict],
          },
        }
        emitChange()
        return false // conflict, not imported
      }
      return false // local is same or newer
    }

    // No conflict → import
    layouts.push({ ...cloudLayout, id: cloudLayout.id.replace(/^cloud_/, '') })
    persistLayouts(layouts)
    return true
  },

  /** 解决同步冲突：选择 local 或 cloud 版本 */
  resolveConflict: (layoutId: string, resolution: 'local' | 'cloud') => {
    const conflict = state.layoutSync.conflicts.find(c => c.layoutId === layoutId && !c.resolved)
    if (!conflict) return

    if (resolution === 'cloud') {
      // Replace local with cloud version
      const layouts = loadLayouts()
      const idx = layouts.findIndex(l => l.id === layoutId)
      if (idx >= 0) {
        layouts[idx] = { ...conflict.cloudVersion, id: layoutId }
        persistLayouts(layouts)
      }
    }
    // Mark resolved
    state = {
      ...state,
      layoutSync: {
        ...state.layoutSync,
        conflicts: state.layoutSync.conflicts.map(c =>
          c.layoutId === layoutId ? { ...c, resolved: true } : c
        ),
      },
    }
    emitChange()
  },

  /** 清除所有已解决的冲突 */
  clearResolvedConflicts: () => {
    state = {
      ...state,
      layoutSync: {
        ...state.layoutSync,
        conflicts: state.layoutSync.conflicts.filter(c => !c.resolved),
      },
    }
    emitChange()
  },

  /** 获取同步状态 */
  getSyncState: (): LayoutSyncState => state.layoutSync,

  // ===== Layout Import/Export (对齐 Guidelines: Layout Persistence — Import/Export JSON) =====

  /** 导出单个布局为 JSON 字符串 */
  exportLayoutJSON: (layoutId: string): string | null => {
    const layouts = loadLayouts()
    const layout = layouts.find(l => l.id === layoutId)
    if (!layout) return null
    return JSON.stringify(layout, null, 2)
  },

  /** 导出所有布局为 JSON 字符串 */
  exportAllLayoutsJSON: (): string => {
    const layouts = loadLayouts().filter(l => l.name !== '__autosave__')
    return JSON.stringify(layouts, null, 2)
  },

  /** 从 JSON 字符串导入单个布局 */
  importLayoutJSON: (json: string): { success: boolean; error?: string; layout?: LayoutSnapshot } => {
    try {
      const parsed = JSON.parse(json)
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON: not an object' }
      }
      // Validate required fields
      if (!parsed.name || !parsed.slots || !parsed.slots.left || !parsed.slots.center || !parsed.slots.right) {
        return { success: false, error: 'Invalid layout: missing name or slots (left/center/right)' }
      }
      // Assign new ID to avoid collisions
      const layout: LayoutSnapshot = {
        id: `layout_import_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: parsed.name,
        slots: { left: parsed.slots.left, center: parsed.slots.center, right: parsed.slots.right },
        windows: Array.isArray(parsed.windows) ? parsed.windows : [],
        createdAt: parsed.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      }
      const layouts = loadLayouts()
      layouts.push(layout)
      persistLayouts(layouts)
      return { success: true, layout }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'JSON parse error' }
    }
  },

  /** 从 JSON 字符串批量导入布局 */
  importAllLayoutsJSON: (json: string): { success: boolean; imported: number; error?: string } => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) {
        return { success: false, imported: 0, error: 'Invalid JSON: expected an array' }
      }
      const layouts = loadLayouts()
      let imported = 0
      for (const item of parsed) {
        if (!item.name || !item.slots?.left || !item.slots?.center || !item.slots?.right) continue
        const layout: LayoutSnapshot = {
          id: `layout_import_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${imported}`,
          name: item.name,
          slots: { left: item.slots.left, center: item.slots.center, right: item.slots.right },
          windows: Array.isArray(item.windows) ? item.windows : [],
          createdAt: item.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        }
        layouts.push(layout)
        imported++
      }
      persistLayouts(layouts)
      return { success: true, imported }
    } catch (err) {
      return { success: false, imported: 0, error: err instanceof Error ? err.message : 'JSON parse error' }
    }
  },

  // ===== Shareable URL (对齐 Guidelines: Layout Sharing — Share Link) =====

  /** 生成布局分享链接（base64 编码） */
  generateShareURL: (layoutId: string): string | null => {
    const layouts = loadLayouts()
    const layout = layouts.find(l => l.id === layoutId)
    if (!layout) return null
    try {
      const json = JSON.stringify({
        name: layout.name,
        slots: layout.slots,
        windows: layout.windows,
      })
      const encoded = btoa(unescape(encodeURIComponent(json)))
      const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
      return `${base}#yyc3-layout=${encoded}`
    } catch {
      return null
    }
  },

  /** 从分享链接的 hash 中解析布局 */
  parseShareURL: (hash: string): { success: boolean; layout?: LayoutSnapshot; error?: string } => {
    try {
      const prefix = '#yyc3-layout='
      const raw = hash.startsWith(prefix) ? hash.slice(prefix.length) : hash
      if (!raw) return { success: false, error: 'Empty hash' }
      const json = decodeURIComponent(escape(atob(raw)))
      const parsed = JSON.parse(json)
      if (!parsed.name || !parsed.slots?.left || !parsed.slots?.center || !parsed.slots?.right) {
        return { success: false, error: 'Invalid layout data: missing name or slots' }
      }
      const layout: LayoutSnapshot = {
        id: `layout_shared_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: parsed.name,
        slots: { left: parsed.slots.left, center: parsed.slots.center, right: parsed.slots.right },
        windows: Array.isArray(parsed.windows) ? parsed.windows : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return { success: true, layout }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Parse error' }
    }
  },

  /** 从分享链接导入布局并保存 */
  importFromShareURL: (hash: string): { success: boolean; layout?: LayoutSnapshot; error?: string } => {
    const result = panelDnDActions.parseShareURL(hash)
    if (!result.success || !result.layout) return result
    const layouts = loadLayouts()
    layouts.push(result.layout)
    persistLayouts(layouts)
    return result
  },
}

// ===== React Hook =====
export function usePanelDnD() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, ...panelDnDActions }
}
