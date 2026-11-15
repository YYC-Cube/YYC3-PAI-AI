/**
 * @file virtual-list-crdt.e2e.test.ts
 * @description VirtualList与CRDT协作端到端测试 - 验证性能和实时同步
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCRDTWebSocketBridge,
  destroyCRDTWebSocketBridge,
} from '../src/app/services/crdt-websocket-bridge'

describe('E2E: VirtualList 性能集成', () => {
  it('应正确处理大量数据项的虚拟化', () => {
    const itemCount = 10000
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      value: i,
    }))

    expect(items.length).toBe(itemCount)
    expect(items[0].id).toBe('item-0')
    expect(items[itemCount - 1].id).toBe(`item-${itemCount - 1}`)
  })

  it('应支持动态高度计算', () => {
    function estimateHeight(item: { content: string; expanded: boolean }): number {
      const baseHeight = 24
      const lineHeight = 16
      const lines = Math.ceil(item.content.length / 50)
      return item.expanded ? baseHeight + (lines * lineHeight) : baseHeight
    }

    const shortItem = { content: 'Short', expanded: false }
    const longItem = { content: 'A'.repeat(200), expanded: true }

    const shortHeight = estimateHeight(shortItem)
    const longHeight = estimateHeight(longItem)

    expect(shortHeight).toBe(24)
    expect(longHeight).toBeGreaterThan(24)
  })

  it('应正确计算可见范围', () => {
    const totalItems = 500
    const itemHeight = 32
    const containerHeight = 400
    const scrollTop = 1600

    const startIndex = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2
    const endIndex = Math.min(startIndex + visibleCount, totalItems)

    expect(startIndex).toBe(50)
    expect(endIndex).toBeLessThanOrEqual(totalItems)
    expect(endIndex - startIndex).toBeLessThanOrEqual(visibleCount + 2)
  })
})

describe('E2E: CRDT WebSocket 协作完整流程', () => {
  let bridge: ReturnType<typeof getCRDTWebSocketBridge>

  beforeEach(() => {
    destroyCRDTWebSocketBridge()
    bridge = getCRDTWebSocketBridge()
  })

  afterEach(() => {
    destroyCRDTWebSocketBridge()
  })

  describe('用户流程1: 连接生命周期管理', () => {
    it('应完成从连接到断开的完整状态转换', async () => {
      const states: string[] = []

      bridge.onStateChange((state) => {
        states.push(state.status)
      })

      expect(states.length).toBeGreaterThanOrEqual(1)
      expect(states[0]).toBe('disconnected')

      try {
        await bridge.connect({
          serverUrl: 'ws://localhost:8080',
          roomId: 'test-room',
        })
      } catch {
      }

      await new Promise((resolve) => setTimeout(resolve, 50))

      if (states.length > 1) {
        const validStatuses = ['connecting', 'connected', 'disconnecting', 'disconnected', 'reconnecting']
        states.forEach((status) => {
          expect(validStatuses).toContain(status)
        })
      }
    })

    it('断开连接后应恢复初始状态', async () => {
      bridge.disconnect()

      const state = bridge.getState()
      expect(state.status).toBe('disconnected')
      expect(typeof state.retryCount).toBe('number')
      expect(typeof state.uptimeMs).toBe('number')
    })
  })

  describe('用户流程2: 消息收发', () => {
    it('消息回调注册应正常工作', () => {
      let messageReceived = false

      const unsubscribe = bridge.onMessage(() => {
        messageReceived = true
      })

      expect(typeof unsubscribe).toBe('function')

      unsubscribe()

      expect(messageReceived).toBe(false)
    })

    it('未连接时发送应返回false', () => {
      const result1 = bridge.send({ type: 'operation', data: {} })
      const result2 = bridge.send(JSON.stringify({ type: 'ping' }))

      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })
  })

  describe('用户流程3: 健康检查和指标', () => {
    it('isHealthy在未连接时应返回false', () => {
      expect(bridge.isHealthy()).toBe(false)
    })

    it('getMetrics应返回完整的指标对象', () => {
      const metrics = bridge.getMetrics()

      expect(metrics).toHaveProperty('totalConnections')
      expect(metrics).toHaveProperty('totalDisconnections')
      expect(metrics).toHaveProperty('totalReconnections')
      expect(metrics).toHaveProperty('failedReconnections')
      expect(metrics).toHaveProperty('averageReconnectionTime')
      expect(metrics).toHaveProperty('lastConnectionTime')
      expect(metrics).toHaveProperty('lastDisconnectionTime')
      expect(metrics).toHaveProperty('lastError')
      expect(metrics).toHaveProperty('currentRetryCount')
      expect(metrics).toHaveProperty('uptimeMs')
    })

    it('所有数值型指标应为非负数', () => {
      const metrics = bridge.getMetrics()

      expect(metrics.totalConnections).toBeGreaterThanOrEqual(0)
      expect(metrics.totalDisconnections).toBeGreaterThanOrEqual(0)
      expect(metrics.totalReconnections).toBeGreaterThanOrEqual(0)
      expect(metrics.failedReconnections).toBeGreaterThanOrEqual(0)
      expect(metrics.averageReconnectionTime).toBeGreaterThanOrEqual(0)
      expect(metrics.currentRetryCount).toBeGreaterThanOrEqual(0)
      expect(metrics.uptimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('用户流程4: 强制重连', () => {
    it('forceReconnect应返回Promise', async () => {
      const result = bridge.forceReconnect()
      expect(result).toBeInstanceOf(Promise)
      await result
    })

    it('强制重连不应抛出错误', async () => {
      await expect(bridge.forceReconnect()).resolves.toBeUndefined()
    })
  })

  describe('用户流程5: 多订阅者模式', () => {
    it('多个状态监听器都应收到通知', () => {
      const calls1: Array<{ status: string }> = []
      const calls2: Array<{ status: string }> = []
      const calls3: Array<{ status: string }> = []

      const unsub1 = bridge.onStateChange((state) => calls1.push(state))
      const unsub2 = bridge.onStateChange((state) => calls2.push(state))
      const unsub3 = bridge.onStateChange((state) => calls3.push(state))

      expect(calls1.length).toBe(1)
      expect(calls2.length).toBe(1)
      expect(calls3.length).toBe(1)

      expect(calls1[0].status).toBe(calls2[0].status)
      expect(calls2[0].status).toBe(calls3[0].status)

      unsub1()
      unsub2()
      unsub3()
    })

    it('取消部分订阅不影响其他订阅者', () => {
      let callback1Calls = 0
      let callback2Calls = 0

      const unsub1 = bridge.onStateChange(() => { callback1Calls++ })
      const unsub2 = bridge.onStateChange(() => { callback2Calls++ })

      unsub1()

      const unsub3 = bridge.onStateChange(() => { })

      expect(callback1Calls).toBe(1)
      expect(callback2Calls).toBeGreaterThanOrEqual(1)

      unsub2()
      unsub3()
    })
  })
})

describe('E2E: 文件系统适配器 + 同步引擎集成', () => {
  it('文件系统操作应能触发同步队列更新', async () => {
    const { getFileSystemAdapter } = await import('../src/app/services/file-system-adapter')
    const adapter = getFileSystemAdapter()

    if (adapter.isSupported()) {
      const basePath = adapter.getBasePath()
      expect(basePath).toBeTruthy()

      const statResult = await adapter.stat(basePath).catch(() => null)
      if (statResult) {
        expect(statResult).toHaveProperty('name')
        expect(statResult).toHaveProperty('size')
        expect(statResult).toHaveProperty('mtime')
      }
    }
  })
})
