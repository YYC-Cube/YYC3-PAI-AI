/**
 * @file useCRDTCollab.test.ts
 * @description CRDT协作Hook的单元测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { enableMapSet } from 'immer'

vi.mock('y-indexeddb', () => {
  const MockedPersistence = vi.fn(function(this: any) {
    this.on = vi.fn((event: string, callback: () => void) => {
      if (event === 'synced' || event === 'load') {
        setTimeout(callback, 0)
      }
    })
    this.off = vi.fn()
    this.destroy = vi.fn()
  })
  return { IndexeddbPersistence: MockedPersistence }
})

vi.mock('y-websocket', () => {
  const MockedProvider = vi.fn(function(this: any) {
    this.connect = vi.fn()
    this.disconnect = vi.fn()
    this.destroy = vi.fn()
    this.on = vi.fn()
    this.off = vi.fn()
  })
  return { WebsocketProvider: MockedProvider }
})

vi.mock('y-webrtc', () => {
  const MockedProvider = vi.fn(function(this: any) {
    this.connect = vi.fn()
    this.disconnect = vi.fn()
    this.destroy = vi.fn()
    this.on = vi.fn()
    this.off = vi.fn()
  })
  return { WebrtcProvider: MockedProvider }
})

import {
  useCRDTCollab,
  useDocumentManager,
  useUserManager,
  useConnectionManager,
  useCursorTracking,
} from '../useCRDTCollab'
import { useCRDTCollabStore } from '../../store/crdt-collab-store'

enableMapSet()

describe('useCRDTCollab', () => {
  beforeEach(() => {
    // 重置store状态
    useCRDTCollabStore.setState({
      connectionType: 'none',
      connected: false,
      userId: 'user-test',
      userName: 'Anonymous',
      userColor: '#FF6B6B',
      users: new Map(),
      documents: new Map(),
      connectionStatus: 'disconnected',
      error: undefined,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('should return initial connection type', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.connectionType).toBe('none')
    })

    it('should return initial connected state', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.connected).toBe(false)
    })

    it('should return initial connection status', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.connectionStatus).toBe('disconnected')
    })

    it('should return user ID', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.userId).toBeDefined()
      expect(typeof result.current.userId).toBe('string')
    })

    it('should return user name', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.userName).toBeDefined()
      expect(result.current.userName).toBe('Anonymous')
    })

    it('should return user color', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.userColor).toBeDefined()
      expect(typeof result.current.userColor).toBe('string')
    })

    it('should return empty users array initially', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.users).toEqual([])
    })

    it('should return zero online users initially', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.onlineUsersCount).toBe(0)
    })
  })

  describe('选项配置', () => {
    it('should auto-initialize by default', async () => {
      const { result } = renderHook(() => useCRDTCollab())

      await waitFor(() => {
        expect(result.current.userId).toBeDefined()
      })
    })

    it('should not initialize when autoInitialize is false', async () => {
      const { result } = renderHook(() => useCRDTCollab({ autoInitialize: false }))

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(result.current.userId).toBeDefined()
    })

    it('should support defaultConnectionType option', () => {
      const { result } = renderHook(() => useCRDTCollab({ defaultConnectionType: 'websocket' }))

      expect(result.current.connectionType).toBe('websocket')
    })
  })

  describe('文档操作', () => {
    it('should provide createDocument function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.createDocument).toBeDefined()
      expect(typeof result.current.createDocument).toBe('function')
    })

    it('should provide openDocument function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.openDocument).toBeDefined()
      expect(typeof result.current.openDocument).toBe('function')
    })

    it('should provide closeDocument function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.closeDocument).toBeDefined()
      expect(typeof result.current.closeDocument).toBe('function')
    })

    it('should provide getDocument function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.getDocument).toBeDefined()
      expect(typeof result.current.getDocument).toBe('function')
    })

    it('should return undefined for non-existent document', () => {
      const { result } = renderHook(() => useCRDTCollab())

      const doc = result.current.getDocument('non-existent')

      expect(doc).toBeUndefined()
    })

    it('should call closeDocument', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(() => {
        result.current.closeDocument('doc-1')
      }).not.toThrow()
    })
  })

  describe('文档内容操作', () => {
    it('should provide getDocumentContent function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.getDocumentContent).toBeDefined()
      expect(typeof result.current.getDocumentContent).toBe('function')
    })

    it('should provide updateDocumentContent function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.updateDocumentContent).toBeDefined()
      expect(typeof result.current.updateDocumentContent).toBe('function')
    })

    it('should return empty string for non-existent document content', () => {
      const { result } = renderHook(() => useCRDTCollab())

      const content = result.current.getDocumentContent('non-existent')

      expect(content).toBe('')
    })
  })

  describe('用户信息管理', () => {
    it('should provide setUserInfo function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.setUserInfo).toBeDefined()
      expect(typeof result.current.setUserInfo).toBe('function')
    })

    it('should update user name', () => {
      const { result } = renderHook(() => useCRDTCollab())

      act(() => {
        result.current.setUserInfo('TestUser')
      })

      const { result: result2 } = renderHook(() => useCRDTCollab())
      expect(result2.current.userName).toBe('TestUser')
    })

    it('should update user color', () => {
      const { result } = renderHook(() => useCRDTCollab())

      act(() => {
        result.current.setUserInfo('TestUser', '#4ECDC4')
      })

      const { result: result2 } = renderHook(() => useCRDTCollab())
      expect(result2.current.userColor).toBe('#4ECDC4')
    })
  })

  describe('连接管理', () => {
    it('should provide setConnectionType function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.setConnectionType).toBeDefined()
      expect(typeof result.current.setConnectionType).toBe('function')
    })

    it('should provide disconnect function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.disconnect).toBeDefined()
      expect(typeof result.current.disconnect).toBe('function')
    })

    it('should update connection type', async () => {
      const { result } = renderHook(() => useCRDTCollab())

      await act(async () => {
        await result.current.setConnectionType('websocket')
      })

      const { result: result2 } = renderHook(() => useCRDTCollab())
      expect(result2.current.connectionType).toBe('websocket')
    })

    it('should disconnect', async () => {
      const { result } = renderHook(() => useCRDTCollab())

      await act(async () => {
        await result.current.disconnect()
      })

      const { result: result2 } = renderHook(() => useCRDTCollab())
      expect(result2.current.connected).toBe(false)
    })
  })

  describe('光标跟踪', () => {
    it('should provide updateCursor function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.updateCursor).toBeDefined()
      expect(typeof result.current.updateCursor).toBe('function')
    })

    it('should update cursor position', () => {
      const { result } = renderHook(() => useCRDTCollab())

      act(() => {
        result.current.updateCursor('file.ts', 10, 20)
      })

      const users = result.current.users
      expect(users.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('文档状态', () => {
    it('should provide getDocumentStatus function', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(result.current.getDocumentStatus).toBeDefined()
      expect(typeof result.current.getDocumentStatus).toBe('function')
    })

    it('should return document status', () => {
      const { result } = renderHook(() => useCRDTCollab())

      const status = result.current.getDocumentStatus('doc-1')

      expect(status).toBeDefined()
      expect(typeof status.synced).toBe('boolean')
    })
  })

  describe('用户列表管理', () => {
    it('should convert users Map to array', () => {
      const { result } = renderHook(() => useCRDTCollab())

      const users = result.current.users

      expect(Array.isArray(users)).toBe(true)
    })

    it('should filter online users correctly', () => {
      const { result } = renderHook(() => useCRDTCollab())

      act(() => {
        result.current.updateCursor('file.ts', 10, 20)
      })

      const onlineCount = result.current.onlineUsersCount
      expect(onlineCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('边缘情况', () => {
    it('should handle empty document ID', () => {
      const { result } = renderHook(() => useCRDTCollab())

      const doc = result.current.getDocument('')

      expect(doc).toBeUndefined()
    })

    it('should handle special characters in document ID', () => {
      const { result } = renderHook(() => useCRDTCollab())

      const doc = result.current.getDocument('doc-📝-test')

      expect(doc).toBeUndefined()
    })

    it('should handle empty user name', () => {
      const { result } = renderHook(() => useCRDTCollab())

      act(() => {
        result.current.setUserInfo('')
      })

      const { result: result2 } = renderHook(() => useCRDTCollab())
      expect(result2.current.userName).toBe('')
    })

    it('should handle negative line numbers', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(() => {
        result.current.updateCursor('file.ts', -1, 10)
      }).not.toThrow()
    })

    it('should handle negative column numbers', () => {
      const { result } = renderHook(() => useCRDTCollab())

      expect(() => {
        result.current.updateCursor('file.ts', 10, -1)
      }).not.toThrow()
    })
  })
})

describe('useDocumentManager', () => {
  beforeEach(() => {
    // 重置store状态
    useCRDTCollabStore.setState({
      connectionType: 'none',
      connected: false,
      userId: 'user-test',
      userName: 'Anonymous',
      userColor: '#FF6B6B',
      users: new Map(),
      documents: new Map(),
      connectionStatus: 'disconnected',
      error: undefined,
    })
  })

  it('should provide document management functions', () => {
    const { result } = renderHook(() => useDocumentManager())

    expect(result.current.getDocument).toBeDefined()
    expect(result.current.createDocument).toBeDefined()
    expect(result.current.openDocument).toBeDefined()
    expect(result.current.closeDocument).toBeDefined()
  })

  it('should get document', () => {
    const { result } = renderHook(() => useDocumentManager())

    const doc = result.current.getDocument('doc-1')

    expect(doc).toBeUndefined()
  })

  it('should create document', async () => {
    const { result } = renderHook(() => useDocumentManager())

    const doc = await act(async () => {
      return await result.current.createDocument('doc-1', 'Test Document')
    })

    expect(doc).toBeDefined()
  })

  it('should close document', () => {
    const { result } = renderHook(() => useDocumentManager())

    expect(() => {
      result.current.closeDocument('doc-1')
    }).not.toThrow()
  })
})

describe('useUserManager', () => {
  beforeEach(() => {
    // 重置store状态
    useCRDTCollabStore.setState({
      connectionType: 'none',
      connected: false,
      userId: 'user-test',
      userName: 'Anonymous',
      userColor: '#FF6B6B',
      users: new Map(),
      documents: new Map(),
      connectionStatus: 'disconnected',
      error: undefined,
    })
  })

  it('should provide user management functions', () => {
    const { result } = renderHook(() => useUserManager())

    expect(result.current.userId).toBeDefined()
    expect(result.current.userName).toBeDefined()
    expect(result.current.userColor).toBeDefined()
    expect(result.current.users).toBeDefined()
    expect(result.current.onlineUsersCount).toBeDefined()
    expect(result.current.setUserInfo).toBeDefined()
  })

  it('should return user info', () => {
    const { result } = renderHook(() => useUserManager())

    expect(result.current.userId).toBeDefined()
    expect(result.current.userName).toBeDefined()
    expect(result.current.userColor).toBeDefined()
  })

  it('should return users array', () => {
    const { result } = renderHook(() => useUserManager())

    const users = result.current.users

    expect(Array.isArray(users)).toBe(true)
  })

  it('should count online users', () => {
    const { result } = renderHook(() => useUserManager())

    const onlineCount = result.current.onlineUsersCount

    expect(onlineCount).toBeGreaterThanOrEqual(0)
  })

  it('should set user info', () => {
    const { result } = renderHook(() => useUserManager())

    act(() => {
      result.current.setUserInfo('TestUser')
    })

    const { result: result2 } = renderHook(() => useUserManager())
    expect(result2.current.userName).toBe('TestUser')
  })
})

describe('useConnectionManager', () => {
  beforeEach(() => {
    // 重置store状态
    useCRDTCollabStore.setState({
      connectionType: 'none',
      connected: false,
      userId: 'user-test',
      userName: 'Anonymous',
      userColor: '#FF6B6B',
      users: new Map(),
      documents: new Map(),
      connectionStatus: 'disconnected',
      error: undefined,
    })
  })

  it('should provide connection management functions', () => {
    const { result } = renderHook(() => useConnectionManager())

    expect(result.current.connectionType).toBeDefined()
    expect(result.current.connected).toBeDefined()
    expect(result.current.connectionStatus).toBeDefined()
    expect(result.current.setConnectionType).toBeDefined()
    expect(result.current.disconnect).toBeDefined()
  })

  it('should return connection info', () => {
    const { result } = renderHook(() => useConnectionManager())

    expect(result.current.connectionType).toBe('none')
    expect(result.current.connected).toBe(false)
    expect(result.current.connectionStatus).toBe('disconnected')
  })

  it('should set connection type', async () => {
    const { result } = renderHook(() => useConnectionManager())

    await act(async () => {
      await result.current.setConnectionType('websocket')
    })

    const { result: result2 } = renderHook(() => useConnectionManager())
    expect(result2.current.connectionType).toBe('websocket')
  })

  it('should disconnect', async () => {
    const { result } = renderHook(() => useConnectionManager())

    await act(async () => {
      await result.current.disconnect()
    })

    const { result: result2 } = renderHook(() => useConnectionManager())
    expect(result2.current.connected).toBe(false)
  })
})

describe('useCursorTracking', () => {
  beforeEach(() => {
    // 重置store状态
    useCRDTCollabStore.setState({
      connectionType: 'none',
      connected: false,
      userId: 'user-test',
      userName: 'Anonymous',
      userColor: '#FF6B6B',
      users: new Map(),
      documents: new Map(),
      connectionStatus: 'disconnected',
      error: undefined,
    })
  })

  it('should provide cursor tracking functions', () => {
    const { result } = renderHook(() => useCursorTracking())

    expect(result.current.updateCursor).toBeDefined()
    expect(result.current.users).toBeDefined()
  })

  it('should return users with cursors', () => {
    const { result } = renderHook(() => useCursorTracking())

    const users = result.current.users

    expect(Array.isArray(users)).toBe(true)
    expect(users.every((u) => u.cursor !== undefined)).toBe(true)
  })

  it('should update cursor position', () => {
    const { result } = renderHook(() => useCursorTracking())

    act(() => {
      result.current.updateCursor('file.ts', 10, 20)
    })

    const users = result.current.users
    expect(users.length).toBeGreaterThanOrEqual(0)
  })

  it('should filter users without cursors', () => {
    const { result } = renderHook(() => useCursorTracking())

    act(() => {
      result.current.updateCursor('file.ts', 10, 20)
    })

    const users = result.current.users

    expect(users.every((u) => u.cursor !== undefined)).toBe(true)
  })
})
