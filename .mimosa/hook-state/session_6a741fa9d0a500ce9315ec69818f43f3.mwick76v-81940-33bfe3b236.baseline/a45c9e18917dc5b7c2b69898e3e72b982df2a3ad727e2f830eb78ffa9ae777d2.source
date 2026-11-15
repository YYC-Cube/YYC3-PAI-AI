/**
 * @file request-dedup.test.ts
 * @description 请求去重工具类测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RequestDeduplicator, globalRequestDeduplicator, createRequestKey } from '../request-dedup'

describe('RequestDeduplicator', () => {
  let dedup: RequestDeduplicator<string>

  beforeEach(() => {
    dedup = new RequestDeduplicator<string>({
      maxPendingTime: 5000,
      cleanupInterval: 0,
      enableStats: true,
    })
  })

  describe('dedupe', () => {
    it('should execute a new request', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')
      const result = await dedup.dedupe('key1', fetcher)

      expect(result).toBe('result')
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('should reuse pending request for same key', async () => {
      let resolveFirst: (v: string) => void
      const firstPromise = new Promise<string>((r) => { resolveFirst = r })
      const fetcher = vi.fn()
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce('second')

      const p1 = dedup.dedupe('key1', fetcher)
      const p2 = dedup.dedupe('key1', fetcher)

      resolveFirst!('first')

      const [r1, r2] = await Promise.all([p1, p2])
      expect(r1).toBe('first')
      expect(r2).toBe('first')
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('should track dedup stats', async () => {
      let resolveFirst: (v: string) => void
      const firstPromise = new Promise<string>((r) => { resolveFirst = r })
      const fetcher = vi.fn().mockReturnValue(firstPromise)

      dedup.dedupe('key1', fetcher)
      dedup.dedupe('key1', fetcher)

      resolveFirst!('result')
      await firstPromise

      const stats = dedup.getStats()
      expect(stats.deduplicated).toBe(1)
      expect(stats.total).toBe(2)
      expect(stats.dedupRate).toBeCloseTo(0.5)
    })

    it('should remove pending after resolve', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')
      await dedup.dedupe('key1', fetcher)

      expect(dedup.has('key1')).toBe(false)
    })

    it('should remove pending after reject', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('fail'))
      await expect(dedup.dedupe('key1', fetcher)).rejects.toThrow('fail')

      expect(dedup.has('key1')).toBe(false)
    })

    it('should allow new request after previous completes', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second')

      const r1 = await dedup.dedupe('key1', fetcher)
      const r2 = await dedup.dedupe('key1', fetcher)

      expect(r1).toBe('first')
      expect(r2).toBe('second')
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('has', () => {
    it('should return false when no pending request', () => {
      expect(dedup.has('key1')).toBe(false)
    })

    it('should return true for pending request', async () => {
      let resolve: (v: string) => void
      const promise = new Promise<string>((r) => { resolve = r })
      const fetcher = vi.fn().mockReturnValue(promise)

      dedup.dedupe('key1', fetcher)
      expect(dedup.has('key1')).toBe(true)

      resolve!('result')
      await promise
    })
  })

  describe('getPending', () => {
    it('should return null for non-existent key', () => {
      expect(dedup.getPending('key1')).toBeNull()
    })

    it('should return promise for pending key', async () => {
      let resolve: (v: string) => void
      const promise = new Promise<string>((r) => { resolve = r })
      const fetcher = vi.fn().mockReturnValue(promise)

      dedup.dedupe('key1', fetcher)
      expect(dedup.getPending('key1')).toBeTruthy()

      resolve!('result')
      await promise
    })
  })

  describe('cancel', () => {
    it('should cancel a pending request', async () => {
      let resolve: (v: string) => void
      const promise = new Promise<string>((r) => { resolve = r })
      const fetcher = vi.fn().mockReturnValue(promise)

      dedup.dedupe('key1', fetcher)
      expect(dedup.cancel('key1')).toBe(true)
      expect(dedup.has('key1')).toBe(false)

      resolve!('result')
      await promise
    })

    it('should return false for non-existent key', () => {
      expect(dedup.cancel('key1')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all pending requests', async () => {
      let resolve: (v: string) => void
      const promise = new Promise<string>((r) => { resolve = r })
      const fetcher = vi.fn().mockReturnValue(promise)

      dedup.dedupe('key1', fetcher)
      dedup.clear()

      expect(dedup.has('key1')).toBe(false)

      resolve!('result')
      await promise
    })

    it('should reset stats', async () => {
      const fetcher = vi.fn().mockResolvedValue('result')
      await dedup.dedupe('key1', fetcher)

      dedup.clear()
      const stats = dedup.getStats()
      expect(stats.deduplicated).toBe(0)
      expect(stats.total).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = dedup.getStats()
      expect(stats.deduplicated).toBe(0)
      expect(stats.total).toBe(0)
      expect(stats.dedupRate).toBe(0)
      expect(stats.pending).toBe(0)
    })
  })

  describe('getPendingCount', () => {
    it('should return 0 when no pending', () => {
      expect(dedup.getPendingCount()).toBe(0)
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      dedup.destroy()
      expect(dedup.getPendingCount()).toBe(0)
    })
  })
})

describe('createRequestKey', () => {
  it('should create key from URL only', () => {
    expect(createRequestKey('/api/data')).toBe('GET:/api/data:')
  })

  it('should include method', () => {
    expect(createRequestKey('/api/data', { method: 'POST' })).toBe('POST:/api/data:')
  })

  it('should include body', () => {
    const key = createRequestKey('/api/data', { body: JSON.stringify({ key: 'value' }) })
    expect(key).toContain('GET:/api/data:')
    expect(key).toContain('key')
    expect(key).toContain('value')
  })
})

describe('globalRequestDeduplicator', () => {
  it('should be a RequestDeduplicator instance', () => {
    expect(globalRequestDeduplicator).toBeInstanceOf(RequestDeduplicator)
  })
})
