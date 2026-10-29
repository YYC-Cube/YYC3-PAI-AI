/**
 * @file panel-store.ts
 * @description 面板可见性统一管理 Store — 集中管理所有 overlay 面板的开关状态与面板栈
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-09
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,visibility,state-management,escape-stack
 *
 * @brief
 * 用单一 Store 替代 App.tsx 中 20+ 个 useState 面板状态，统一面板生命周期管理。
 *
 * @details
 * - 维护 panelStack，支持 Escape 面板栈模式（后进先出）
 * - 提供 open / close / toggle / closeTop / closeAll 操作
 * - 遵循 useSyncExternalStore 模式，与现有 stores 风格一致
 */

import { useSyncExternalStore } from 'react'

// ============================================================================
// 面板 ID 定义
// ============================================================================

/** 所有 overlay 面板的唯一标识 */
export type PanelId =
  // Core overlays
  | 'commandPalette'
  | 'settings'
  | 'notifications'
  | 'globalSearch'
  | 'cheatSheet'
  // Performance & AI
  | 'performance'
  | 'aiAssistant'
  | 'crdtCollab'
  | 'intelligentWorkflow'
  | 'agentWorkflow'
  // P0 Sync
  | 'syncPanel'
  // Self-Media Suite
  | 'imageGen'
  | 'selfMediaEditor'
  | 'publishQueue'
  | 'trendingTopics'
  | 'aiWriting'
  | 'materialManager'
  | 'contentPreview'
  | 'contentTemplate'
  // Infrastructure
  | 'localModelDash'
  // Security
  | 'keyVault'
  // Chat
  | 'chat'

// ============================================================================
// State
// ============================================================================

/** 当面板打开时推入栈顶，关闭时从栈中移除 */
let panelStack: PanelId[] = []

/** 快速查找哪些面板当前可见（按入栈顺序，Escape 关闭栈顶） */
const visibleSet = new Set<PanelId>()

// ============================================================================
// External Store
// ============================================================================

type Listener = () => void
const listeners = new Set<Listener>()

/** 缓存的快照，仅在 emitChange 时重建 */
let cachedSnapshot: { stack: PanelId[]; visible: Set<PanelId> } = { stack: [], visible: new Set() }

function emitChange() {
  cachedSnapshot = { stack: [...panelStack], visible: new Set(panelStack) }
  for (const l of listeners) l()
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

function getSnapshot() {
  return cachedSnapshot
}

// ============================================================================
// Hook
// ============================================================================

/** 消费面板 Store 的 React Hook */
export function usePanelStore() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// ============================================================================
// Actions — 通过静态方法 / 模块函数暴露（对齐现有 stores 模式）
// ============================================================================

export const panelActions = {
  /** 打开面板 → 推入栈顶 */
  open(id: PanelId): void {
    if (visibleSet.has(id)) return // already open, do not duplicate in stack
    panelStack = panelStack.filter((p) => p !== id)
    panelStack.push(id)
    visibleSet.add(id)
    emitChange()
  },

  /** 关闭面板 → 从栈中移除 */
  close(id: PanelId): void {
    if (!visibleSet.has(id)) return
    panelStack = panelStack.filter((p) => p !== id)
    visibleSet.delete(id)
    emitChange()
  },

  /** 切换面板 */
  toggle(id: PanelId): void {
    if (visibleSet.has(id)) {
      panelActions.close(id)
    } else {
      panelActions.open(id)
    }
  },

  /** 关闭栈顶面板（Escape 关闭逻辑）→ 栈模式 */
  closeTop(): boolean {
    if (panelStack.length === 0) return false
    const top = panelStack[panelStack.length - 1]
    panelStack = panelStack.slice(0, -1)
    visibleSet.delete(top)
    emitChange()
    return true
  },

  /** 关闭所有面板 */
  closeAll(): void {
    if (panelStack.length === 0) return
    panelStack = []
    visibleSet.clear()
    emitChange()
  },

  /** 关闭除指定面板外的所有面板 */
  closeExcept(id: PanelId): void {
    if (visibleSet.has(id)) {
      panelStack = [id]
      visibleSet.clear()
      visibleSet.add(id)
    } else {
      panelStack = []
      visibleSet.clear()
    }
    emitChange()
  },

  /** 检查面板是否可见（同步，无需订阅） */
  isVisible(id: PanelId): boolean {
    return visibleSet.has(id)
  },

  /** 获取面板栈（同步，无需订阅） */
  getStack(): PanelId[] {
    return [...panelStack]
  },
}