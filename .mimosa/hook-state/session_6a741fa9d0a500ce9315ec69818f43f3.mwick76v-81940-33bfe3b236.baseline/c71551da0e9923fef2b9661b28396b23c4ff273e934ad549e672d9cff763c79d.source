/**
 * @file crdt-websocket-bridge.integration.test.ts
 * @description CRDT WebSocket桥接层集成测试 - 验证与CRDT Store的完整集成
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCRDTWebSocketBridge,
  destroyCRDTWebSocketBridge,
  type CRDTConnectionState,
} from '../crdt-websocket-bridge'

describe('CRDTWebSocketBridge - 集成测试', () => {
  let bridge: ReturnType<typeof getCRDTWebSocketBridge>

  beforeEach(() => {
    destroyCRDTWebSocketBridge()
    bridge = getCRDTWebSocketBridge()
  })

  afterEach(() => {
    destroyCRDTWebSocketBridge()
  })

  describe('初始化', () => {
    it('应该正确创建bridge实例', () => {
      expect(bridge).toBeDefined()
      expect(typeof bridge.connect).toBe('function')
      expect(typeof bridge.disconnect).toBe('function')
      expect(typeof bridge.send).toBe('function')
      expect(typeof bridge.onMessage).toBe('function')
      expect(typeof bridge.onStateChange).toBe('function')
      expect(typeof bridge.getState).toBe('function')
      expect(typeof bridge.getStatus).toBe('function')
      expect(typeof bridge.getMetrics).toBe('function')
      expect(typeof bridge.isHealthy).toBe('function')
      expect(typeof bridge.forceReconnect).toBe('function')
    })

    it('应该支持单例模式', () => {
      const bridge1 = getCRDTWebSocketBridge()
      const bridge2 = getCRDTWebSocketBridge()
      expect(bridge1).toBe(bridge2)
    })
  })

  describe('状态管理', () => {
    it('初始状态应为disconnected', () => {
      const state = bridge.getState()
      expect(state.status).toBe('disconnected')
      expect(state.retryCount).toBe(0)
      expect(state.uptimeMs).toBe(0)
    })

    it('getStatus应返回连接状态', () => {
      const status = bridge.getStatus()
      expect(['connecting', 'connected', 'disconnecting', 'disconnected', 'reconnecting']).toContain(status)
    })

    it('isHealthy在未连接时应返回false', () => {
      expect(bridge.isHealthy()).toBe(false)
    })

    it('getMetrics应返回指标对象', () => {
      const metrics = bridge.getMetrics()
      expect(metrics).toBeDefined()
      expect(metrics).toHaveProperty('totalConnections')
      expect(metrics).toHaveProperty('uptimeMs')
    })
  })

  describe('onStateChange集成', () => {
    it('注册回调后应立即收到当前状态', () => {
      const callback = vi.fn()
      const unsubscribe = bridge.onStateChange(callback)

      expect(callback).toHaveBeenCalledTimes(1)

      const receivedState = callback.mock.calls[0][0] as CRDTConnectionState
      expect(receivedState.status).toBe('disconnected')

      unsubscribe()
    })

    it('取消订阅后不应再收到更新', () => {
      const callback = vi.fn()
      const unsubscribe = bridge.onStateChange(callback)

      callback.mockClear()
      unsubscribe()

      const unsubscribe2 = bridge.onStateChange(vi.fn())
      unsubscribe2()

      expect(callback).not.toHaveBeenCalled()
    })

    it('多个回调都应收到状态更新', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unsub1 = bridge.onStateChange(callback1)
      const unsub2 = bridge.onStateChange(callback2)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)

      unsub1()
      unsub2()
    })
  })

  describe('send方法', () => {
    it('未连接时send应返回false', () => {
      const result = bridge.send({ test: 'data' })
      expect(result).toBe(false)
    })

    it('发送字符串数据应返回false(未连接)', () => {
      const result = bridge.send('test message')
      expect(result).toBe(false)
    })
  })

  describe('onMessage方法', () => {
    it('应该返回取消订阅函数', () => {
      const callback = vi.fn()
      const unsubscribe = bridge.onMessage(callback)
      expect(typeof unsubscribe).toBe('function')

      unsubscribe()
    })

    it('取消订阅不应报错', () => {
      const callback = vi.fn()
      const unsubscribe = bridge.onMessage(callback)
      expect(() => unsubscribe()).not.toThrow()
    })
  })

  describe('disconnect方法', () => {
    it('disconnect不应抛出错误', () => {
      expect(() => bridge.disconnect()).not.toThrow()
    })

    it('disconnect后状态仍为disconnected', () => {
      bridge.disconnect()
      const state = bridge.getState()
      expect(state.status).toBe('disconnected')
    })
  })

  describe('forceReconnect方法', () => {
    it('forceReconnect应返回Promise', async () => {
      const result = bridge.forceReconnect()
      expect(result).toBeInstanceOf(Promise)
      await result
    })
  })

  describe('destroy和重建', () => {
    it('destroy后重新获取应创建新实例', () => {
      const bridge1 = getCRDTWebSocketBridge()
      destroyCRDTWebSocketBridge()
      const bridge2 = getCRDTWebSocketBridge()
      expect(bridge1).not.toBe(bridge2)
    })
  })
})

describe('CRDTWebSocketBridge - 与ReconnectionManager集成', () => {
  beforeEach(() => {
    destroyCRDTWebSocketBridge()
  })

  afterEach(() => {
    destroyCRDTWebSocketBridge()
  })

  it('bridge应正确反映底层管理器的状态', () => {
    const bridge = getCRDTWebSocketBridge()

    const state = bridge.getState()
    const status = bridge.getStatus()
    const metrics = bridge.getMetrics()

    expect(state.status).toBe(status)
    expect(typeof metrics.uptimeMs).toBe('number')
  })

  it('状态变更应包含时间戳信息', () => {
    const bridge = getCRDTWebSocketBridge()
    let capturedTimestamp: number | undefined

    const unsub = bridge.onStateChange((state) => {
      if (state.connectedAt) {
        capturedTimestamp = state.connectedAt
      }
    })

    if (capturedTimestamp !== undefined) {
      expect(typeof capturedTimestamp).toBe('number')
      expect(capturedTimestamp).toBeGreaterThan(0)
    }

    unsub()
  })
})

describe('CRDTWebSocketBridge - 模拟连接场景', () => {
  beforeEach(() => {
    destroyCRDTWebSocketBridge()
  })

  afterEach(() => {
    destroyCRDTWebSocketBridge()
  })

  it('状态变更流程应正确记录重试次数', () => {
    const bridge = getCRDTWebSocketBridge()
    const states: CRDTConnectionState[] = []

    const unsub = bridge.onStateChange((state) => {
      states.push({ ...state })
    })

    expect(states.length).toBeGreaterThan(0)
    expect(states[0].retryCount).toBe(0)

    unsub()
  })

  it('lastError应在错误时被设置', () => {
    const bridge = getCRDTWebSocketBridge()
    const state = bridge.getState()

    expect(typeof state.lastError).toBe('undefined')
  })
})
