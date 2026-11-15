
/**
 * @file multi-instance-store.ts
 * @description 多实例状态管理模块，管理多实例配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags multi-instance,state-management,core
 */

import { useSyncExternalStore } from 'react'
import { activityBus } from './activity-store'

// ===== Type Definitions =====

export type InstanceType = 'main' | 'secondary' | 'popup' | 'preview'
export type WindowType = 'main' | 'editor' | 'preview' | 'terminal' | 'ai-chat' | 'settings'
export type WorkspaceType = 'project' | 'ai-session' | 'debug' | 'custom'
export type SessionType = 'ai-chat' | 'code-edit' | 'debug' | 'preview' | 'terminal'
export type SessionStatus = 'active' | 'idle' | 'suspended' | 'closed'

export type IPCMessageType =
  | 'instance-created'
  | 'instance-closed'
  | 'workspace-created'
  | 'workspace-updated'
  | 'workspace-closed'
  | 'session-created'
  | 'session-updated'
  | 'session-closed'
  | 'state-sync'
  | 'resource-share'
  | 'clipboard-share'

/** Application instance */
export interface AppInstance {
  id: string
  type: InstanceType
  windowId: string
  windowType: WindowType
  title: string
  createdAt: number
  lastActiveAt: number
  isMain: boolean
  isVisible: boolean
  isMinimized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  workspaceId?: string
  sessionIds: string[]
}

/** Workspace */
export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  icon?: string
  createdAt: number
  updatedAt: number
  projectPath?: string
  isActive: boolean
  windowIds: string[]
  sessionIds: string[]
  config: {
    theme?: string
    editorFontSize?: number
    panelLayout?: string
  }
}

/** Session */
export interface Session {
  id: string
  type: SessionType
  name: string
  createdAt: number
  updatedAt: number
  status: SessionStatus
  workspaceId: string
  windowId: string
  data: {
    aiMessages?: Array<{ role: string; content: string }>
    editedFiles?: Array<{ path: string }>
    terminalHistory?: Array<{ command: string }>
    previewUrl?: string
  }
}

/** IPC Message */
export interface IPCMessage {
  id: string
  type: IPCMessageType
  senderId: string
  receiverId?: string
  data: unknown
  timestamp: number
}

/** Resource usage per instance */
export interface ResourceUsage {
  instanceId: string
  memoryMB: number
  cpuPercent: number
  tabCount: number
  sessionCount: number
}

// ===== State Shape =====

interface MultiInstanceState {
  /** Current instance ID */
  currentInstanceId: string
  /** All registered instances */
  instances: AppInstance[]
  /** All workspaces */
  workspaces: Workspace[]
  /** All sessions */
  sessions: Session[]
  /** IPC message log (last 50) */
  ipcLog: IPCMessage[]
  /** Resource usage snapshot */
  resources: ResourceUsage[]
  /** Active workspace ID */
  activeWorkspaceId: string | null
  /** Active session ID */
  activeSessionId: string | null
}

// ===== Initial State =====

const STORAGE_KEY = 'yyc3-multi-instance'

function loadState(): MultiInstanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MultiInstanceState
      // Re-validate main instance
      return { ...parsed, currentInstanceId: parsed.currentInstanceId || crypto.randomUUID() }
    }
  } catch { /* ignore */ }
  return createDefaultState()
}

function createDefaultState(): MultiInstanceState {
  const mainId = crypto.randomUUID()
  const mainWindowId = `window-${mainId}`
  const defaultWorkspaceId = crypto.randomUUID()
  const defaultSessionId = crypto.randomUUID()

  return {
    currentInstanceId: mainId,
    instances: [{
      id: mainId,
      type: 'main',
      windowId: mainWindowId,
      windowType: 'main',
      title: 'YYC3 AI Code — Main',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      isMain: true,
      isVisible: true,
      isMinimized: false,
      position: { x: 100, y: 100 },
      size: { width: 1400, height: 900 },
      workspaceId: defaultWorkspaceId,
      sessionIds: [defaultSessionId],
    }],
    workspaces: [{
      id: defaultWorkspaceId,
      name: 'Default Workspace',
      type: 'project',
      icon: 'FolderOpen',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      windowIds: [mainWindowId],
      sessionIds: [defaultSessionId],
      config: {},
    }],
    sessions: [{
      id: defaultSessionId,
      type: 'code-edit',
      name: 'Main Editor',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
      workspaceId: defaultWorkspaceId,
      windowId: mainWindowId,
      data: {},
    }],
    ipcLog: [],
    resources: [{
      instanceId: mainId,
      memoryMB: 120,
      cpuPercent: 3,
      tabCount: 1,
      sessionCount: 1,
    }],
    activeWorkspaceId: defaultWorkspaceId,
    activeSessionId: defaultSessionId,
  }
}

// ===== Store Internals =====

let state = loadState()
const listeners = new Set<() => void>()

function emit() {
  for (const fn of listeners) fn()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* quota */ }
}

function pushIPC(type: IPCMessageType, data: unknown, receiverId?: string) {
  const msg: IPCMessage = {
    id: crypto.randomUUID(),
    type,
    senderId: state.currentInstanceId,
    receiverId,
    data,
    timestamp: Date.now(),
  }
  state = { ...state, ipcLog: [...state.ipcLog.slice(-49), msg] }
}

// ===== Public Actions =====

export const multiInstanceActions = {
  // ---- Instance management ----

  createInstance(windowType: WindowType, title?: string, workspaceId?: string): AppInstance {
    const id = crypto.randomUUID()
    const windowId = `window-${id}`
    const offset = state.instances.length * 40

    const instance: AppInstance = {
      id,
      type: 'secondary',
      windowId,
      windowType,
      title: title || `YYC3 — ${windowType}`,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      isMain: false,
      isVisible: true,
      isMinimized: false,
      position: { x: 140 + offset, y: 140 + offset },
      size: { width: windowType === 'preview' ? 800 : 1200, height: windowType === 'terminal' ? 400 : 800 },
      workspaceId: workspaceId || state.activeWorkspaceId || undefined,
      sessionIds: [],
    }

    pushIPC('instance-created', instance)
    state = { ...state, instances: [...state.instances, instance] }

    // Auto-create resource entry
    state = {
      ...state,
      resources: [...state.resources, { instanceId: id, memoryMB: 80, cpuPercent: 1, tabCount: 0, sessionCount: 0 }],
    }

    activityBus.push('system', `New ${windowType} instance created`, `创建新的${windowType}实例`, undefined)
    emit()
    return instance
  },

  closeInstance(instanceId: string) {
    const inst = state.instances.find(i => i.id === instanceId)
    if (!inst || inst.isMain) return // Cannot close main instance

    // Close associated sessions
    const sessionsToClose = state.sessions.filter(s => inst.sessionIds.includes(s.id))
    sessionsToClose.forEach(s => { pushIPC('session-closed', s) })

    pushIPC('instance-closed', inst)
    state = {
      ...state,
      instances: state.instances.filter(i => i.id !== instanceId),
      sessions: state.sessions.map(s =>
        inst.sessionIds.includes(s.id) ? { ...s, status: 'closed' as SessionStatus } : s
      ),
      resources: state.resources.filter(r => r.instanceId !== instanceId),
    }

    activityBus.push('system', `Instance ${inst.title} closed`, `实例 ${inst.title} 已关闭`, undefined)
    emit()
  },

  activateInstance(instanceId: string) {
    state = {
      ...state,
      instances: state.instances.map(i =>
        i.id === instanceId ? { ...i, lastActiveAt: Date.now(), isMinimized: false } : i
      ),
    }
    emit()
  },

  minimizeInstance(instanceId: string) {
    state = {
      ...state,
      instances: state.instances.map(i =>
        i.id === instanceId ? { ...i, isMinimized: true } : i
      ),
    }
    emit()
  },

  moveInstance(instanceId: string, position: { x: number; y: number }) {
    state = {
      ...state,
      instances: state.instances.map(i =>
        i.id === instanceId ? { ...i, position } : i
      ),
    }
    emit()
  },

  resizeInstance(instanceId: string, size: { width: number; height: number }) {
    state = {
      ...state,
      instances: state.instances.map(i =>
        i.id === instanceId ? { ...i, size } : i
      ),
    }
    emit()
  },

  // ---- Workspace management ----

  createWorkspace(name: string, type: WorkspaceType, projectPath?: string): Workspace {
    const ws: Workspace = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectPath,
      isActive: false,
      windowIds: [],
      sessionIds: [],
      config: {},
    }

    pushIPC('workspace-created', ws)
    state = { ...state, workspaces: [...state.workspaces, ws] }
    activityBus.push('system', `Workspace "${name}" created`, `工作区 "${name}" 已创建`, undefined)
    emit()
    return ws
  },

  activateWorkspace(workspaceId: string) {
    state = {
      ...state,
      activeWorkspaceId: workspaceId,
      workspaces: state.workspaces.map(w => ({ ...w, isActive: w.id === workspaceId })),
    }
    pushIPC('workspace-updated', { workspaceId, action: 'activate' })
    emit()
  },

  updateWorkspace(workspaceId: string, updates: Partial<Workspace>) {
    state = {
      ...state,
      workspaces: state.workspaces.map(w =>
        w.id === workspaceId ? { ...w, ...updates, updatedAt: Date.now() } : w
      ),
    }
    pushIPC('workspace-updated', { workspaceId, updates })
    emit()
  },

  deleteWorkspace(workspaceId: string) {
    if (state.workspaces.length <= 1) return // Keep at least one workspace

    pushIPC('workspace-closed', { workspaceId })
    state = {
      ...state,
      workspaces: state.workspaces.filter(w => w.id !== workspaceId),
      activeWorkspaceId: state.activeWorkspaceId === workspaceId
        ? state.workspaces.find(w => w.id !== workspaceId)?.id || null
        : state.activeWorkspaceId,
      sessions: state.sessions.map(s =>
        s.workspaceId === workspaceId ? { ...s, status: 'closed' as SessionStatus } : s
      ),
    }
    emit()
  },

  duplicateWorkspace(workspaceId: string): Workspace | null {
    const original = state.workspaces.find(w => w.id === workspaceId)
    if (!original) return null

    const dup: Workspace = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
      windowIds: [],
      sessionIds: [],
    }

    state = { ...state, workspaces: [...state.workspaces, dup] }
    emit()
    return dup
  },

  // ---- Session management ----

  createSession(name: string, type: SessionType, workspaceId: string, windowId?: string): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
      workspaceId,
      windowId: windowId || state.instances[0]?.windowId || '',
      data: {},
    }

    pushIPC('session-created', session)

    // Link session to workspace and instance
    state = {
      ...state,
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
      workspaces: state.workspaces.map(w =>
        w.id === workspaceId ? { ...w, sessionIds: [...w.sessionIds, session.id], updatedAt: Date.now() } : w
      ),
    }

    // Link to instance
    const targetInstance = state.instances.find(i => i.windowId === session.windowId)
    if (targetInstance) {
      state = {
        ...state,
        instances: state.instances.map(i =>
          i.id === targetInstance.id ? { ...i, sessionIds: [...i.sessionIds, session.id] } : i
        ),
      }
    }

    activityBus.push('system', `Session "${name}" (${type}) created`, `会话 "${name}" (${type}) 已创建`, undefined)
    emit()
    return session
  },

  activateSession(sessionId: string) {
    state = {
      ...state,
      activeSessionId: sessionId,
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, status: 'active', updatedAt: Date.now() } : s
      ),
    }
    emit()
  },

  suspendSession(sessionId: string) {
    state = {
      ...state,
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, status: 'suspended', updatedAt: Date.now() } : s
      ),
    }
    pushIPC('session-updated', { sessionId, action: 'suspend' })
    emit()
  },

  resumeSession(sessionId: string) {
    state = {
      ...state,
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, status: 'active', updatedAt: Date.now() } : s
      ),
    }
    pushIPC('session-updated', { sessionId, action: 'resume' })
    emit()
  },

  closeSession(sessionId: string) {
    state = {
      ...state,
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, status: 'closed', updatedAt: Date.now() } : s
      ),
      activeSessionId: state.activeSessionId === sessionId
        ? state.sessions.find(s => s.id !== sessionId && s.status === 'active')?.id || null
        : state.activeSessionId,
    }
    pushIPC('session-closed', { sessionId })
    emit()
  },

  deleteSession(sessionId: string) {
    state = {
      ...state,
      sessions: state.sessions.filter(s => s.id !== sessionId),
      activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
      workspaces: state.workspaces.map(w => ({
        ...w,
        sessionIds: w.sessionIds.filter(id => id !== sessionId),
      })),
      instances: state.instances.map(i => ({
        ...i,
        sessionIds: i.sessionIds.filter(id => id !== sessionId),
      })),
    }
    emit()
  },

  // ---- Resource simulation ----

  refreshResources() {
    state = {
      ...state,
      resources: state.instances.map(inst => ({
        instanceId: inst.id,
        memoryMB: Math.round(80 + Math.random() * 200),
        cpuPercent: Math.round(Math.random() * 15 * 10) / 10,
        tabCount: inst.sessionIds.length,
        sessionCount: state.sessions.filter(s => inst.sessionIds.includes(s.id) && s.status === 'active').length,
      })),
    }
    emit()
  },

  // ---- IPC helpers ----

  broadcastMessage(type: IPCMessageType, data: unknown) {
    pushIPC(type, data)
    emit()
  },

  clearIPCLog() {
    state = { ...state, ipcLog: [] }
    emit()
  },

  // ---- Getters ----

  getActiveWorkspace(): Workspace | undefined {
    return state.workspaces.find(w => w.id === state.activeWorkspaceId)
  },

  getWorkspaceSessions(workspaceId: string): Session[] {
    return state.sessions.filter(s => s.workspaceId === workspaceId && s.status !== 'closed')
  },

  getTotalMemoryMB(): number {
    return state.resources.reduce((sum, r) => sum + r.memoryMB, 0)
  },
}

// ===== Hook =====

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } }
function getSnapshot(): MultiInstanceState { return state }

export function useMultiInstanceStore(): MultiInstanceState {
  return useSyncExternalStore(subscribe, getSnapshot)
}
