/**
 * @file collab-store.ts
 * @description 协作状态管理模块，管理实时协作状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags collaboration,state-management,core
 */

import { useSyncExternalStore } from 'react'

// ===== Types =====
export interface CollabUser {
  id: string
  name: string
  color: string
  cursor: { line: number; col: number }
  selection?: { startLine: number; startCol: number; endLine: number; endCol: number }
  status: 'active' | 'idle' | 'away'
  lastSeen: number
}

export type OpType = 'insert' | 'delete' | 'replace' | 'cursor_move'

export interface CRDTOperation {
  id: string
  userId: string
  type: OpType
  timestamp: number
  position: { line: number; col: number }
  content?: string          // for insert/replace
  deleteCount?: number      // for delete
  resolved: boolean
  conflictWith?: string     // id of conflicting op
}

export interface ConflictRecord {
  id: string
  opA: CRDTOperation
  opB: CRDTOperation
  resolution: 'auto_merge' | 'accept_a' | 'accept_b' | 'pending'
  resolvedAt?: number
}

// ===== State Shape =====
interface CollabState {
  enabled: boolean
  sessionId: string
  users: CollabUser[]
  localUserId: string
  operations: CRDTOperation[]
  conflicts: ConflictRecord[]
  vectorClock: Record<string, number>
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'offline'
  opCount: number
  latency: number
}

// ===== Mock Users =====
const MOCK_USERS: CollabUser[] = [
  { id: 'user-local', name: 'You', color: '#00f0ff', cursor: { line: 1, col: 0 }, status: 'active', lastSeen: Date.now() },
  { id: 'user-alice', name: 'Alice', color: '#ff79c6', cursor: { line: 5, col: 12 }, status: 'active', lastSeen: Date.now() },
  { id: 'user-bob', name: 'Bob', color: '#50fa7b', cursor: { line: 12, col: 8 }, status: 'idle', lastSeen: Date.now() - 30000 },
  { id: 'user-carol', name: 'Carol', color: '#f1fa8c', cursor: { line: 18, col: 3 }, selection: { startLine: 18, startCol: 3, endLine: 20, endCol: 15 }, status: 'active', lastSeen: Date.now() },
]

// ===== Module-level store =====
let state: CollabState = {
  enabled: true,
  sessionId: `session-${Date.now().toString(36)}`,
  users: MOCK_USERS,
  localUserId: 'user-local',
  operations: [],
  conflicts: [],
  vectorClock: { 'user-local': 0, 'user-alice': 0, 'user-bob': 0, 'user-carol': 0 },
  syncStatus: 'synced',
  opCount: 0,
  latency: 45,
}

type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  for (const listener of listeners) listener()
}
function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function getSnapshot() {
  return state
}

// ===== OT Transform =====
function transformOperation(op: CRDTOperation, against: CRDTOperation): CRDTOperation {
  // Simple operational transform: adjust line positions
  if (op.userId === against.userId) return op
  const transformed = { ...op }
  if (against.type === 'insert' && against.position.line <= op.position.line) {
    transformed.position = { ...transformed.position, line: transformed.position.line + 1 }
  }
  if (against.type === 'delete' && against.position.line < op.position.line) {
    transformed.position = { ...transformed.position, line: Math.max(0, transformed.position.line - 1) }
  }
  return transformed
}

// ===== Conflict Detection =====
function detectConflict(opA: CRDTOperation, opB: CRDTOperation): boolean {
  if (opA.userId === opB.userId) return false
  if (opA.type === 'cursor_move' || opB.type === 'cursor_move') return false
  // Same line conflict
  const timeDiff = Math.abs(opA.timestamp - opB.timestamp)
  return opA.position.line === opB.position.line && timeDiff < 2000
}

// ===== Simulated peer activity timer =====
let simTimer: ReturnType<typeof setInterval> | null = null

function startSimulation() {
  if (simTimer) return
  simTimer = setInterval(() => {
    if (!state.enabled) return

    // Random peer cursor movements
    const peerIds = ['user-alice', 'user-bob', 'user-carol']
    const randomPeer = peerIds[Math.floor(Math.random() * peerIds.length)]
    const peer = state.users.find((u) => u.id === randomPeer)
    if (!peer) return

    const newLine = Math.max(1, peer.cursor.line + Math.floor(Math.random() * 5) - 2)
    const newCol = Math.max(0, Math.floor(Math.random() * 40))

    const op: CRDTOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: randomPeer,
      type: Math.random() > 0.7 ? 'insert' : 'cursor_move',
      timestamp: Date.now(),
      position: { line: newLine, col: newCol },
      content: Math.random() > 0.7 ? '// auto-edit' : undefined,
      resolved: true,
    }

    const updatedUsers = state.users.map((u) =>
      u.id === randomPeer
        ? { ...u, cursor: { line: newLine, col: newCol }, lastSeen: Date.now(), status: Math.random() > 0.1 ? 'active' as const : 'idle' as const }
        : u
    )

    // Occasionally generate conflicts
    const recentLocalOps = state.operations.filter(
      (o) => o.userId === 'user-local' && Date.now() - o.timestamp < 3000
    )
    let newConflicts = [...state.conflicts]
    if (op.type === 'insert' && recentLocalOps.length > 0 && Math.random() > 0.8) {
      const conflictOp = recentLocalOps[recentLocalOps.length - 1]
      if (detectConflict(conflictOp, op)) {
        newConflicts = [...newConflicts, {
          id: `conflict-${Date.now()}`,
          opA: conflictOp,
          opB: op,
          resolution: 'auto_merge' as const,
          resolvedAt: Date.now(),
        }]
      }
    }

    const newClock = { ...state.vectorClock }
    newClock[randomPeer] = (newClock[randomPeer] || 0) + 1

    state = {
      ...state,
      users: updatedUsers,
      operations: [...state.operations.slice(-50), op],
      conflicts: newConflicts.slice(-20),
      vectorClock: newClock,
      opCount: state.opCount + 1,
      syncStatus: Math.random() > 0.95 ? 'syncing' : 'synced',
      latency: 30 + Math.floor(Math.random() * 40),
    }
    emitChange()
  }, 2000 + Math.random() * 3000)
}

function stopSimulation() {
  if (simTimer) {
    clearInterval(simTimer)
    simTimer = null
  }
}

// ===== Actions =====
const actions = {
  toggleCollab: () => {
    state = { ...state, enabled: !state.enabled }
    if (state.enabled) startSimulation()
    else stopSimulation()
    emitChange()
  },

  pushLocalOp: (type: OpType, line: number, col: number, content?: string) => {
    const op: CRDTOperation = {
      id: `op-${Date.now()}-local`,
      userId: 'user-local',
      type,
      timestamp: Date.now(),
      position: { line, col },
      content,
      resolved: true,
    }

    const newClock = { ...state.vectorClock }
    newClock['user-local'] = (newClock['user-local'] || 0) + 1

    // Transform against recent peer ops
    let transformed = op
    const recentPeerOps = state.operations.filter(
      (o) => o.userId !== 'user-local' && Date.now() - o.timestamp < 2000
    )
    for (const peerOp of recentPeerOps) {
      transformed = transformOperation(transformed, peerOp)
    }

    const updatedUsers = state.users.map((u) =>
      u.id === 'user-local' ? { ...u, cursor: { line, col }, lastSeen: Date.now() } : u
    )

    state = {
      ...state,
      users: updatedUsers,
      operations: [...state.operations.slice(-50), transformed],
      vectorClock: newClock,
      opCount: state.opCount + 1,
    }
    emitChange()
  },

  resolveConflict: (conflictId: string, resolution: 'accept_a' | 'accept_b') => {
    state = {
      ...state,
      conflicts: state.conflicts.map((c) =>
        c.id === conflictId ? { ...c, resolution, resolvedAt: Date.now() } : c
      ),
      syncStatus: 'synced',
    }
    emitChange()
  },

  getRemoteUsers: (): CollabUser[] => {
    return state.users.filter((u) => u.id !== state.localUserId)
  },

  init: () => {
    if (state.enabled) startSimulation()
  },

  destroy: () => {
    stopSimulation()
  },
}

// ===== React Hook =====
export function useCollabStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, ...actions }
}

export const collabStore = {
  getState: getSnapshot,
  ...actions,
}
