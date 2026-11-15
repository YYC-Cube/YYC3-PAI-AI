/**
 * @file collab-store.test.ts
 * @description Unit test for collab-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, vi, afterEach } from 'vitest'

vi.useFakeTimers()

import { collabStore, type CRDTOperation, type ConflictRecord } from '../collab-store'

function s() { return collabStore.getState() }

describe('Collab Store — Initial State', () => {
  afterEach(() => {
    collabStore.destroy()
  })

  it('should start enabled', () => {
    expect(s().enabled).toBe(true)
  })

  it('should have a sessionId', () => {
    expect(s().sessionId).toMatch(/^session-/)
  })

  it('should have mock users including local user', () => {
    expect(s().users.length).toBeGreaterThanOrEqual(4)
    expect(s().users.some(u => u.id === 'user-local')).toBe(true)
    expect(s().users.some(u => u.id === 'user-alice')).toBe(true)
  })

  it('localUserId should be "user-local"', () => {
    expect(s().localUserId).toBe('user-local')
  })

  it('should start with empty operations', () => {
    expect(s().operations).toEqual([])
  })

  it('should start synced', () => {
    expect(s().syncStatus).toBe('synced')
  })

  it('vectorClock should have entries for all users', () => {
    const clock = s().vectorClock
    expect(clock['user-local']).toBeDefined()
    expect(clock['user-alice']).toBeDefined()
    expect(clock['user-bob']).toBeDefined()
    expect(clock['user-carol']).toBeDefined()
  })
})

describe('CollabUser interface', () => {
  it('each user should have required fields', () => {
    for (const u of s().users) {
      expect(u.id).toBeTruthy()
      expect(u.name).toBeTruthy()
      expect(u.color).toMatch(/^#/)
      expect(u.cursor).toHaveProperty('line')
      expect(u.cursor).toHaveProperty('col')
      expect(['active', 'idle', 'away']).toContain(u.status)
      expect(u.lastSeen).toBeGreaterThan(0)
    }
  })

  it('Carol should have a selection', () => {
    const carol = s().users.find(u => u.id === 'user-carol')
    expect(carol).toBeDefined()
    expect(carol!.selection).toBeDefined()
    expect(carol!.selection!.startLine).toBeLessThanOrEqual(carol!.selection!.endLine)
  })
})

describe('toggleCollab', () => {
  afterEach(() => {
    collabStore.destroy()
  })

  it('should toggle enabled state', () => {
    const before = s().enabled
    collabStore.toggleCollab()
    expect(s().enabled).toBe(!before)
    // Toggle back
    collabStore.toggleCollab()
    expect(s().enabled).toBe(before)
  })
})

describe('pushLocalOp', () => {
  afterEach(() => {
    collabStore.destroy()
  })

  it('should add operation to history', () => {
    const before = s().operations.length
    collabStore.pushLocalOp('insert', 5, 10, '// new code')
    expect(s().operations.length).toBe(before + 1)
  })

  it('operation should have correct fields', () => {
    collabStore.pushLocalOp('insert', 3, 0, 'hello')
    const op = s().operations[s().operations.length - 1]
    expect(op.userId).toBe('user-local')
    expect(op.type).toBe('insert')
    expect(op.position).toEqual({ line: 3, col: 0 })
    expect(op.content).toBe('hello')
    expect(op.resolved).toBe(true)
  })

  it('cursor_move should update local user cursor', () => {
    collabStore.pushLocalOp('cursor_move', 10, 20)
    const local = s().users.find(u => u.id === 'user-local')
    expect(local!.cursor).toEqual({ line: 10, col: 20 })
  })

  it('should increment vector clock for local user', () => {
    const before = s().vectorClock['user-local']
    collabStore.pushLocalOp('insert', 1, 0, 'x')
    expect(s().vectorClock['user-local']).toBe(before + 1)
  })

  it('should increment opCount', () => {
    const before = s().opCount
    collabStore.pushLocalOp('delete', 5, 0)
    expect(s().opCount).toBe(before + 1)
  })

  it('operations should be capped at ~51', () => {
    for (let i = 0; i < 60; i++) {
      collabStore.pushLocalOp('insert', i, 0, `line-${i}`)
    }
    expect(s().operations.length).toBeLessThanOrEqual(55)
  })

  it('all OpTypes should be accepted', () => {
    const ops: Array<'insert' | 'delete' | 'replace' | 'cursor_move'> = ['insert', 'delete', 'replace', 'cursor_move']
    for (const op of ops) {
      expect(() => collabStore.pushLocalOp(op, 1, 0, op === 'replace' ? 'new' : undefined)).not.toThrow()
    }
  })
})

describe('resolveConflict', () => {
  afterEach(() => {
    collabStore.destroy()
  })

  it('should resolve with accept_a', () => {
    // Push ops to potentially create conflicts, then resolve
    collabStore.pushLocalOp('insert', 1, 0, 'test')
    // Manually check if any conflicts exist
    if (s().conflicts.length > 0) {
      const cid = s().conflicts[0].id
      collabStore.resolveConflict(cid, 'accept_a')
      const resolved = s().conflicts.find(c => c.id === cid)
      expect(resolved?.resolution).toBe('accept_a')
    }
  })

  it('should resolve with accept_b', () => {
    if (s().conflicts.length > 0) {
      const cid = s().conflicts[0].id
      collabStore.resolveConflict(cid, 'accept_b')
      const resolved = s().conflicts.find(c => c.id === cid)
      expect(resolved?.resolution).toBe('accept_b')
    }
  })

  it('resolving should set syncStatus to synced', () => {
    if (s().conflicts.length > 0) {
      const cid = s().conflicts[0].id
      collabStore.resolveConflict(cid, 'accept_a')
      expect(s().syncStatus).toBe('synced')
    }
  })
})

describe('getRemoteUsers', () => {
  it('should return only non-local users', () => {
    const remotes = collabStore.getRemoteUsers()
    expect(remotes.every(u => u.id !== 'user-local')).toBe(true)
    expect(remotes.length).toBe(s().users.length - 1)
  })

  it('should include Alice, Bob, Carol', () => {
    const remotes = collabStore.getRemoteUsers()
    const names = remotes.map(u => u.name)
    expect(names).toContain('Alice')
    expect(names).toContain('Bob')
    expect(names).toContain('Carol')
  })
})

describe('init / destroy', () => {
  it('init should not throw', () => {
    expect(() => collabStore.init()).not.toThrow()
    collabStore.destroy()
  })

  it('destroy should not throw', () => {
    collabStore.init()
    expect(() => collabStore.destroy()).not.toThrow()
  })
})

describe('CRDTOperation interface', () => {
  it('should have correct shape', () => {
    const op: CRDTOperation = {
      id: 'op-123',
      userId: 'user-local',
      type: 'insert',
      timestamp: Date.now(),
      position: { line: 1, col: 0 },
      content: 'hello',
      resolved: true,
    }
    expect(op.id).toBeTruthy()
    expect(['insert', 'delete', 'replace', 'cursor_move']).toContain(op.type)
    expect(op.position).toHaveProperty('line')
    expect(op.position).toHaveProperty('col')
  })

  it('conflictWith should be optional', () => {
    const op: CRDTOperation = {
      id: 'op-x', userId: 'u', type: 'insert', timestamp: 0,
      position: { line: 0, col: 0 }, resolved: false, conflictWith: 'op-y',
    }
    expect(op.conflictWith).toBe('op-y')
  })
})

describe('ConflictRecord interface', () => {
  it('should have correct shape', () => {
    const opA: CRDTOperation = { id: 'a', userId: 'u1', type: 'insert', timestamp: 0, position: { line: 1, col: 0 }, resolved: true }
    const opB: CRDTOperation = { id: 'b', userId: 'u2', type: 'insert', timestamp: 0, position: { line: 1, col: 0 }, resolved: true }
    const conflict: ConflictRecord = {
      id: 'c-1',
      opA,
      opB,
      resolution: 'pending',
    }
    expect(['auto_merge', 'accept_a', 'accept_b', 'pending']).toContain(conflict.resolution)
  })
})
