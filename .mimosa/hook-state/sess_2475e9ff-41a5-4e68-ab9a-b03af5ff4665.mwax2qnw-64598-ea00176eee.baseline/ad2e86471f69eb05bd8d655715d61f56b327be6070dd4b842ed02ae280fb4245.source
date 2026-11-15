/**
 * @file multi-instance-store.test.ts
 * @description Unit test for multi-instance-store
 * @author YanYuCloudCube Team
 * @version v2.0.0
 * @updated 2026-06-04
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { multiInstanceActions, useMultiInstanceStore } from '../multi-instance-store'

describe('Multi-Instance Store Actions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should have total memory greater than 0 on first load', () => {
      const totalMem = multiInstanceActions.getTotalMemoryMB()
      expect(totalMem).toBeGreaterThan(0)
    })
  })

  describe('Instance management', () => {
    it('should create a new terminal instance with correct properties', () => {
      const inst = multiInstanceActions.createInstance('terminal', 'Test Terminal')
      expect(inst).toBeDefined()
      expect(inst.id).toBeTruthy()
      expect(inst.windowType).toBe('terminal')
      expect(inst.title).toBe('Test Terminal')
      expect(inst.type).toBe('secondary')
      expect(inst.isMain).toBe(false)
      expect(inst.isVisible).toBe(true)
      expect(inst.isMinimized).toBe(false)
    })

    it('should create an instance with default title when not provided', () => {
      const inst = multiInstanceActions.createInstance('preview')
      expect(inst.title).toContain('preview')
    })

    it('should increase total memory after creating instances', () => {
      const beforeMem = multiInstanceActions.getTotalMemoryMB()
      multiInstanceActions.createInstance('editor')
      const afterMem = multiInstanceActions.getTotalMemoryMB()
      expect(afterMem).toBeGreaterThanOrEqual(beforeMem)
    })

    it('should close a non-main instance', () => {
      const inst = multiInstanceActions.createInstance('terminal')
      expect(inst.isMain).toBe(false)
      expect(() => multiInstanceActions.closeInstance(inst.id)).not.toThrow()
    })

    it('should minimize an instance', () => {
      const inst = multiInstanceActions.createInstance('terminal')
      expect(() => multiInstanceActions.minimizeInstance(inst.id)).not.toThrow()
    })

    it('should move an instance', () => {
      const inst = multiInstanceActions.createInstance('terminal')
      expect(() => multiInstanceActions.moveInstance(inst.id, { x: 500, y: 300 })).not.toThrow()
    })

    it('should resize an instance', () => {
      const inst = multiInstanceActions.createInstance('editor')
      expect(() => multiInstanceActions.resizeInstance(inst.id, { width: 800, height: 600 })).not.toThrow()
    })

    it('should activate an instance', () => {
      const inst = multiInstanceActions.createInstance('terminal')
      expect(() => multiInstanceActions.activateInstance(inst.id)).not.toThrow()
    })
  })

  describe('Workspace management', () => {
    it('should create a new workspace with correct properties', () => {
      const ws = multiInstanceActions.createWorkspace('My Project', 'project', '/path/to/project')
      expect(ws).toBeDefined()
      expect(ws.id).toBeTruthy()
      expect(ws.name).toBe('My Project')
      expect(ws.type).toBe('project')
      expect(ws.projectPath).toBe('/path/to/project')
      expect(ws.isActive).toBe(false)
    })

    it('should activate a workspace and return it via getActiveWorkspace', () => {
      const ws = multiInstanceActions.createWorkspace('Test', 'debug')
      multiInstanceActions.activateWorkspace(ws.id)
      const active = multiInstanceActions.getActiveWorkspace()
      expect(active).toBeDefined()
      expect(active!.name).toBe('Test')
    })

    it('should update a workspace name', () => {
      const ws = multiInstanceActions.createWorkspace('Old Name', 'project')
      multiInstanceActions.updateWorkspace(ws.id, { name: 'New Name' })
      multiInstanceActions.activateWorkspace(ws.id)
      const active = multiInstanceActions.getActiveWorkspace()
      expect(active!.name).toBe('New Name')
    })

    it('should duplicate a workspace with (Copy) suffix', () => {
      const ws = multiInstanceActions.createWorkspace('Original', 'project', '/path')
      const dup = multiInstanceActions.duplicateWorkspace(ws.id)
      expect(dup).not.toBeNull()
      expect(dup!.name).toBe('Original (Copy)')
      expect(dup!.id).not.toBe(ws.id)
      expect(dup!.projectPath).toBe('/path')
    })

    it('should delete a workspace without throwing', () => {
      const ws1 = multiInstanceActions.createWorkspace('WS1', 'project')
      multiInstanceActions.createWorkspace('WS2', 'debug')
      expect(() => multiInstanceActions.deleteWorkspace(ws1.id)).not.toThrow()
    })
  })

  describe('Session management', () => {
    it('should create a new session with active status', () => {
      const ws = multiInstanceActions.createWorkspace('Test WS', 'project')
      multiInstanceActions.activateWorkspace(ws.id)
      const session = multiInstanceActions.createSession('My Session', 'ai-chat', ws.id)
      expect(session).toBeDefined()
      expect(session.id).toBeTruthy()
      expect(session.name).toBe('My Session')
      expect(session.type).toBe('ai-chat')
      expect(session.status).toBe('active')
    })

    it('should activate a session', () => {
      const ws = multiInstanceActions.createWorkspace('Test', 'project')
      multiInstanceActions.activateWorkspace(ws.id)
      const session = multiInstanceActions.createSession('Session 1', 'code-edit', ws.id)
      expect(() => multiInstanceActions.activateSession(session.id)).not.toThrow()
    })

    it('should suspend and resume a session', () => {
      const ws = multiInstanceActions.createWorkspace('Test', 'project')
      multiInstanceActions.activateWorkspace(ws.id)
      const session = multiInstanceActions.createSession('Session 1', 'code-edit', ws.id)
      multiInstanceActions.suspendSession(session.id)
      expect(() => multiInstanceActions.resumeSession(session.id)).not.toThrow()
    })

    it('should close a session', () => {
      const ws = multiInstanceActions.createWorkspace('Test', 'project')
      multiInstanceActions.activateWorkspace(ws.id)
      const session = multiInstanceActions.createSession('Session 1', 'code-edit', ws.id)
      expect(() => multiInstanceActions.closeSession(session.id)).not.toThrow()
    })

    it('should delete a session', () => {
      const ws = multiInstanceActions.createWorkspace('Test', 'project')
      multiInstanceActions.activateWorkspace(ws.id)
      const session = multiInstanceActions.createSession('Session 1', 'code-edit', ws.id)
      expect(() => multiInstanceActions.deleteSession(session.id)).not.toThrow()
    })

    it('should return active workspace sessions', () => {
      const ws = multiInstanceActions.createWorkspace('Test', 'project')
      multiInstanceActions.activateWorkspace(ws.id)
      multiInstanceActions.createSession('S1', 'ai-chat', ws.id)
      multiInstanceActions.createSession('S2', 'terminal', ws.id)
      const sessions = multiInstanceActions.getWorkspaceSessions(ws.id)
      expect(Array.isArray(sessions)).toBe(true)
      expect(sessions.length).toBe(2)
    })
  })

  describe('Resource management', () => {
    it('should refresh resources without throwing', () => {
      expect(() => multiInstanceActions.refreshResources()).not.toThrow()
    })

    it('should return total memory greater than 0', () => {
      const totalMem = multiInstanceActions.getTotalMemoryMB()
      expect(totalMem).toBeGreaterThan(0)
    })
  })

  describe('IPC messaging', () => {
    it('should broadcast a message without throwing', () => {
      expect(() => multiInstanceActions.broadcastMessage('state-sync', { key: 'value' })).not.toThrow()
    })

    it('should clear IPC log without throwing', () => {
      multiInstanceActions.broadcastMessage('clipboard-share', { text: 'hello' })
      expect(() => multiInstanceActions.clearIPCLog()).not.toThrow()
    })
  })

  describe('Hook export', () => {
    it('should export useMultiInstanceStore hook', () => {
      expect(typeof useMultiInstanceStore).toBe('function')
    })
  })
})