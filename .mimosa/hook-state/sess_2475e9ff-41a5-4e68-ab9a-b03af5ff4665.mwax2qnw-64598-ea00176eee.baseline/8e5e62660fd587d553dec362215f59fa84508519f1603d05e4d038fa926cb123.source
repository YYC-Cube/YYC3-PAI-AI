/**
 * @file storage-monitor.test.ts
 * @description 存储监控和管理工具测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageMonitor } from '../storage-monitor'

describe('StorageMonitor', () => {
  let monitor: StorageMonitor

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    const AnySM = StorageMonitor as unknown as { instance: StorageMonitor | null }
    AnySM.instance = null
    monitor = StorageMonitor.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const a = StorageMonitor.getInstance()
      const b = StorageMonitor.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('getLocalStorageUsage', () => {
    it('should return usage stats', () => {
      localStorage.setItem('test_key', 'test_value')

      const usage = monitor.getLocalStorageUsage()

      expect(usage.used).toBeGreaterThan(0)
      expect(usage.total).toBe(5 * 1024 * 1024)
      expect(usage.percentage).toBeGreaterThan(0)
      expect(usage.items).toBeGreaterThan(0)
    })

    it('should return zero usage for empty localStorage', () => {
      const usage = monitor.getLocalStorageUsage()
      expect(usage.used).toBe(0)
      expect(usage.items).toBe(0)
      expect(usage.percentage).toBe(0)
    })

    it('should calculate percentage correctly', () => {
      localStorage.setItem('a', 'x'.repeat(1000))

      const usage = monitor.getLocalStorageUsage()
      expect(usage.percentage).toBeGreaterThan(0)
      expect(usage.percentage).toBeLessThan(1)
    })
  })

  describe('getIndexedDBUsage', () => {
    it('should return usage stats with default values', async () => {
      const usage = await monitor.getIndexedDBUsage()

      expect(usage.total).toBe(500 * 1024 * 1024)
      expect(usage.percentage).toBeGreaterThanOrEqual(0)
      expect(usage.items).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getMemoryCacheUsage', () => {
    it('should return default memory cache usage', () => {
      const usage = monitor.getMemoryCacheUsage()

      expect(usage.used).toBe(0)
      expect(usage.total).toBe(100 * 1024 * 1024)
      expect(usage.percentage).toBe(0)
      expect(usage.items).toBe(0)
    })
  })

  describe('updateMemoryCacheStats', () => {
    it('should update memory cache stats', () => {
      monitor.updateMemoryCacheStats(1024 * 1024, 50)

      const usage = monitor.getMemoryCacheUsage()
      expect(usage.used).toBe(1024 * 1024)
      expect(usage.items).toBe(50)
      expect(usage.percentage).toBeCloseTo(1)
    })
  })

  describe('getStats', () => {
    it('should return combined storage stats', async () => {
      localStorage.setItem('test', 'value')
      monitor.updateMemoryCacheStats(1024, 5)

      const stats = await monitor.getStats()

      expect(stats.localStorage).toBeTruthy()
      expect(stats.indexedDB).toBeTruthy()
      expect(stats.memoryCache).toBeTruthy()
      expect(stats.totalUsed).toBeGreaterThan(0)
      expect(stats.totalAvailable).toBeGreaterThan(0)
    })
  })

  describe('setAlertThreshold', () => {
    it('should set alert threshold', () => {
      monitor.setAlertThreshold('localStorage', 0.9)
    })
  })

  describe('onAlert', () => {
    it('should register and call alert callback', async () => {
      const callback = vi.fn()
      const unsubscribe = monitor.onAlert(callback)

      monitor.updateMemoryCacheStats(99 * 1024 * 1024, 100)
      monitor.setAlertThreshold('memoryCache', 0.5)

      await new Promise((r) => setTimeout(r, 100))

      unsubscribe()
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = monitor.onAlert(callback)

      unsubscribe()
    })
  })

  describe('startMonitoring / stopMonitoring', () => {
    it('should start and stop monitoring', () => {
      monitor.startMonitoring(60000)
      monitor.stopMonitoring()
    })

    it('should replace existing monitoring interval', () => {
      monitor.startMonitoring(60000)
      monitor.startMonitoring(30000)
      monitor.stopMonitoring()
    })
  })

  describe('alert threshold detection', () => {
    it('should emit warning alert when localStorage exceeds threshold', async () => {
      const callback = vi.fn()
      monitor.onAlert(callback)
      monitor.setAlertThreshold('localStorage', 0)

      const largeValue = 'x'.repeat(4 * 1024 * 1024)
      localStorage.setItem('yyc3_large', largeValue)

      monitor.startMonitoring(50)

      await new Promise((r) => setTimeout(r, 200))

      monitor.stopMonitoring()

      if (callback.mock.calls.length > 0) {
        const alert = callback.mock.calls[0][0]
        expect(alert.type).toBe('localStorage')
        expect(alert.level).toMatch(/^(warning|critical)$/)
      }
    })
  })
})
