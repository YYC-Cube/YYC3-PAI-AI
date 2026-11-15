/**
 * @file storage-cleaner.test.ts
 * @description 存储清理工具测试 v2.0.0 - 策略引擎测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StorageCleaner } from '../storage-cleaner'

describe('StorageCleaner', () => {
  let cleaner: StorageCleaner

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    const AnySC = StorageCleaner as unknown as { instance: StorageCleaner | null }
    AnySC.instance = null
    cleaner = StorageCleaner.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const a = StorageCleaner.getInstance()
      const b = StorageCleaner.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('getPolicies', () => {
    it('should return default policies', () => {
      const policies = cleaner.getPolicies()
      expect(policies.length).toBeGreaterThanOrEqual(4)
      expect(policies.some(p => p.id === 'cache-expiry')).toBe(true)
      expect(policies.some(p => p.id === 'old-sync-records')).toBe(true)
      expect(policies.some(p => p.id === 'low-priority-clean')).toBe(true)
      expect(policies.some(p => p.id === 'size-threshold')).toBe(true)
    })
  })

  describe('updatePolicy / togglePolicy', () => {
    it('should update a policy', () => {
      cleaner.updatePolicy('cache-expiry', { maxAgeDays: 14 })
      const policies = cleaner.getPolicies()
      const p = policies.find(p => p.id === 'cache-expiry')!
      expect(p.maxAgeDays).toBe(14)
    })

    it('should toggle a policy', () => {
      cleaner.togglePolicy('cache-expiry', false)
      expect(cleaner.getPolicies().find(p => p.id === 'cache-expiry')!.enabled).toBe(false)
      cleaner.togglePolicy('cache-expiry', true)
      expect(cleaner.getPolicies().find(p => p.id === 'cache-expiry')!.enabled).toBe(true)
    })
  })

  describe('addPolicy / removePolicy', () => {
    it('should add and remove a custom policy', () => {
      cleaner.addPolicy({ id: 'test', type: 'age', enabled: true, maxAgeDays: 1 })
      expect(cleaner.getPolicies().some(p => p.id === 'test')).toBe(true)
      cleaner.removePolicy('test')
      expect(cleaner.getPolicies().some(p => p.id === 'test')).toBe(false)
    })
  })

  describe('runPolicy (age)', () => {
    it('should remove entries older than maxAgeDays', async () => {
      const now = Date.now()
      localStorage.setItem('yyc3_old', JSON.stringify({ createdAt: now - 200000 }))
      localStorage.setItem('yyc3_recent', JSON.stringify({ createdAt: now - 1000 }))

      const result = await cleaner.runPolicy({
        id: 'test-age',
        type: 'age',
        enabled: true,
        maxAgeDays: 0.002, // ~173 seconds
        targetStorage: 'localStorage',
      })

      expect(result.cleaned).toBe(1)
      expect(localStorage.getItem('yyc3_old')).toBeNull()
      expect(localStorage.getItem('yyc3_recent')).toBeTruthy()
    })

    it('should support dryRun mode', async () => {
      const now = Date.now()
      localStorage.setItem('yyc3_old', JSON.stringify({ createdAt: now - 200000 }))

      const result = await cleaner.runPolicy({
        id: 'test-age-dry',
        type: 'age',
        enabled: true,
        maxAgeDays: 0.002,
        targetStorage: 'localStorage',
      }, true)

      expect(result.cleaned).toBe(1)
      expect(localStorage.getItem('yyc3_old')).toBeTruthy()
    })

    it('should skip non-yyc3_ prefixed keys', async () => {
      const now = Date.now()
      localStorage.setItem('other_old', JSON.stringify({ createdAt: now - 200000 }))

      const result = await cleaner.runPolicy({
        id: 'test-age-skip',
        type: 'age',
        enabled: true,
        maxAgeDays: 0.002,
        targetStorage: 'localStorage',
      })
      expect(result.cleaned).toBe(0)
    })
  })

  describe('runPolicy (priority)', () => {
    it('should remove low priority keys', async () => {
      localStorage.setItem('yyc3_file_store', JSON.stringify({ data: 'files' }))
      localStorage.setItem('yyc3_query_history', JSON.stringify({ data: 'queries' }))
      localStorage.setItem('yyc3_activity_log', JSON.stringify({ data: 'logs' }))
      localStorage.setItem('yyc3_settings', JSON.stringify({ theme: 'dark' }))

      const result = await cleaner.runPolicy({
        id: 'test-priority',
        type: 'priority',
        enabled: true,
        minPriority: 'low',
        targetStorage: 'localStorage',
      })

      expect(result.cleaned).toBe(3)
      expect(localStorage.getItem('yyc3_file_store')).toBeNull()
      expect(localStorage.getItem('yyc3_query_history')).toBeNull()
      expect(localStorage.getItem('yyc3_activity_log')).toBeNull()
      expect(localStorage.getItem('yyc3_settings')).toBeTruthy()
    })

    it('should support dryRun mode', async () => {
      localStorage.setItem('yyc3_file_store', JSON.stringify({ data: 'files' }))

      const result = await cleaner.runPolicy({
        id: 'test-priority-dry',
        type: 'priority',
        enabled: true,
        minPriority: 'low',
        targetStorage: 'localStorage',
      }, true)

      expect(result.cleaned).toBe(1)
      expect(localStorage.getItem('yyc3_file_store')).toBeTruthy()
    })
  })

  describe('runPolicy (type)', () => {
    it('should remove entries matching target type', async () => {
      localStorage.setItem('yyc3_cache_data', JSON.stringify({ data: 'cached' }))
      localStorage.setItem('yyc3_settings', JSON.stringify({ theme: 'dark' }))

      const result = await cleaner.runPolicy({
        id: 'test-type',
        type: 'type',
        enabled: true,
        targetTypes: ['cache'],
        targetStorage: 'localStorage',
      })

      expect(result.cleaned).toBe(1)
      expect(localStorage.getItem('yyc3_cache_data')).toBeNull()
      expect(localStorage.getItem('yyc3_settings')).toBeTruthy()
    })
  })

  describe('runAllPolicies', () => {
    it('should run all enabled policies', async () => {
      localStorage.setItem('yyc3_temp_cache', JSON.stringify({ createdAt: Date.now() - 200000 }))
      localStorage.setItem('yyc3_file_store', JSON.stringify({ data: 'files' }))

      const result = await cleaner.runAllPolicies()

      expect(result.cleaned).toBeGreaterThanOrEqual(0)
      expect(result.freedBytes).toBeGreaterThanOrEqual(0)
    })
  })

  describe('startAutoClean / stopAutoClean', () => {
    it('should start and stop auto clean schedule', () => {
      cleaner.startAutoClean(60000)
      expect(cleaner.getSchedule().enabled).toBe(true)
      cleaner.stopAutoClean()
      expect(cleaner.getSchedule().enabled).toBe(false)
    })

    it('should replace existing schedule', () => {
      cleaner.startAutoClean(60000)
      cleaner.startAutoClean(30000)
      cleaner.stopAutoClean()
    })
  })

  describe('getSchedule', () => {
    it('should return schedule info', () => {
      const schedule = cleaner.getSchedule()
      expect(schedule).toHaveProperty('intervalMs')
      expect(schedule).toHaveProperty('enabled')
      expect(schedule).toHaveProperty('policies')
    })
  })
})
