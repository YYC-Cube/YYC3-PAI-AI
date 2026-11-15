/**
 * @file activity-store.ts
 * @description 活动状态管理模块，管理用户活动和日志
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags activity,logging,state-management
 */

import { useSyncExternalStore } from 'react'

/** Activity event categories */
export type ActivityCategory = 'file' | 'git' | 'ai' | 'system'

/** Single activity entry */
export interface ActivityEntry {
  /** Unique identifier */
  id: string
  /** Event category for tab filtering */
  category: ActivityCategory
  /** English message */
  message: string
  /** Chinese message */
  messageZh: string
  /** Optional detail string (file path, commit hash, etc.) */
  detail?: string
  /** Unix timestamp (ms) */
  timestamp: number
}

const LS_KEY = 'yyc3_activity_log'
const MAX_ENTRIES = 200

/** Generate unique ID for activity entries */
function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

/** Load persisted activities from localStorage */
function load(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return getInitialActivities()
}

/** Persist activities to localStorage */
function persist(entries: ActivityEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch { /* ignore */ }
}

/** Initial seed activities for first launch */
function getInitialActivities(): ActivityEntry[] {
  return [
    {
      id: 'init_1', category: 'system',
      message: 'Application started v4.8.0',
      messageZh: '应用已启动 v4.8.0',
      timestamp: Date.now() - 1000,
    },
  ]
}

// ===== External Store State =====
let state: ActivityEntry[] = load()
type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  for (const l of listeners) l()
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function getSnapshot(): ActivityEntry[] {
  return state
}

// ===== Public Actions =====

/**
 * Push a new activity entry to the front of the log.
 * Automatically deduplicates rapid identical events within 2 seconds.
 */
function pushActivity(
  category: ActivityCategory,
  message: string,
  messageZh: string,
  detail?: string,
): void {
  // Dedup: skip if same message was logged within last 2 seconds
  if (
    state.length > 0 &&
    state[0].message === message &&
    Date.now() - state[0].timestamp < 2000
  ) {
    return
  }

  const entry: ActivityEntry = {
    id: generateId(),
    category,
    message,
    messageZh,
    detail,
    timestamp: Date.now(),
  }

  state = [entry, ...state].slice(0, MAX_ENTRIES)
  persist(state)
  emitChange()
}

/** Clear all activity entries */
function clearAll(): void {
  state = []
  persist(state)
  emitChange()
}

/** Import entries (merge, dedupe by id, sort by timestamp desc) */
function importEntries(newEntries: ActivityEntry[]): number {
  const existingIds = new Set(state.map(e => e.id))
  const unique = newEntries.filter(e =>
    e.id && e.category && e.message && e.timestamp && !existingIds.has(e.id)
  )
  if (unique.length === 0) return 0
  state = [...unique, ...state]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ENTRIES)
  persist(state)
  emitChange()
  return unique.length
}

/** Remove a single entry by ID */
function removeEntry(id: string): void {
  state = state.filter(e => e.id !== id)
  persist(state)
  emitChange()
}

// ===== React Hook =====

/** React hook for reading activity log state */
export function useActivityStore() {
  const entries = useSyncExternalStore(subscribe, getSnapshot)
  return { entries, pushActivity, clearAll, removeEntry, importEntries }
}

// ===== Imperative API (for non-React callers like other stores) =====
export const activityBus = {
  push: pushActivity,
  clear: clearAll,
  import: importEntries,
  getEntries: getSnapshot,
}
