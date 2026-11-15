/**
 * @file request-cache.test.ts
 * @description 请求缓存工具类测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RequestCache, globalRequestCache, createCacheKey } from '../request-cache'

describe('RequestCache', () => {
  let cache: RequestCache<string>

  beforeEach(() => {
    cache = new RequestCache<string>({
      maxSize: 3,
      defaultTTL: 5000,
      cleanupInterval: 0,
      enableStats: true,
    })
  })

  describe('constructor', () => {
    it('should create cache with default options', () => {
      const c = new RequestCache()
      expect(c.getStats().maxSize).toBe(100)
    })

    it('should create cache with custom options', () => {
      const c = new RequestCache({ maxSize: 50, defaultTTL: 1000 })
      expect(c.getStats().maxSize).toBe(50)
    })
  })

  describe('get / set', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return null for missing keys', () => {
      expect(cache.get('missing')).toBeNull()
    })

    it('should return null for expired entries', async () => {
      const shortCache = new RequestCache<string>({ defaultTTL: 100, cleanupInterval: 0 })
      shortCache.set('key1', 'value1')
      expect(shortCache.get('key1')).toBe('value1')

      await new Promise((r) => setTimeout(r, 150))
      expect(shortCache.get('key1')).toBeNull()
    })

    it('should support custom TTL per entry', async () => {
      cache.set('short', 'value', 100)
      cache.set('long', 'value', 10000)

      await new Promise((r) => setTimeout(r, 150))
      expect(cache.get('short')).toBeNull()
      expect(cache.get('long')).toBe('value')
    })

    it('should evict oldest when exceeding maxSize', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.set('d', '4')

      expect(cache.get('a')).toBeNull()
      expect(cache.get('d')).toBe('4')
    })

    it('should update existing key and move to end', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.get('a')
      cache.set('d', '4')

      expect(cache.get('a')).toBe('1')
      expect(cache.get('b')).toBeNull()
    })
  })

  describe('has', () => {
    it('should return true for existing non-expired entries', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
    })

    it('should return false for missing entries', () => {
      expect(cache.has('missing')).toBe(false)
    })

    it('should return false for expired entries', async () => {
      const shortCache = new RequestCache<string>({ defaultTTL: 100, cleanupInterval: 0 })
      shortCache.set('key1', 'value1')

      await new Promise((r) => setTimeout(r, 150))
      expect(shortCache.has('key1')).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.get('key1')).toBeNull()
    })

    it('should return false for missing key', () => {
      expect(cache.delete('missing')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.clear()
      expect(cache.getStats().size).toBe(0)
    })

    it('should reset stats', () => {
      cache.set('a', '1')
      cache.get('a')
      cache.clear()
      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should track hits and misses', () => {
      cache.set('a', '1')
      cache.get('a')
      cache.get('missing')

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.5)
    })

    it('should track evictions', () => {
      cache.set('a', '1')
      cache.set('b', '2')
      cache.set('c', '3')
      cache.set('d', '4')

      expect(cache.getStats().evictions).toBe(1)
    })
  })

  describe('getOrSet', () => {
    it('should return cached value if exists', () => {
      cache.set('a', '1')
      const result = cache.getOrSet('a', () => 'fallback')
      expect(result).toBe('1')
    })

    it('should fetch and cache if missing (sync)', () => {
      const result = cache.getOrSet('a', () => 'computed')
      expect(result).toBe('computed')
      expect(cache.get('a')).toBe('computed')
    })

    it('should fetch and cache if missing (async)', async () => {
      const result = await cache.getOrSet('a', async () => 'async-computed')
      expect(result).toBe('async-computed')
      expect(cache.get('a')).toBe('async-computed')
    })
  })

  describe('getOrSetAsync', () => {
    it('should return cached value if exists', async () => {
      cache.set('a', '1')
      const result = await cache.getOrSetAsync('a', async () => 'fallback')
      expect(result).toBe('1')
    })

    it('should fetch and cache if missing', async () => {
      const result = await cache.getOrSetAsync('a', async () => 'async-value')
      expect(result).toBe('async-value')
      expect(cache.get('a')).toBe('async-value')
    })
  })

  describe('prune', () => {
    it('should remove expired entries', async () => {
      const shortCache = new RequestCache<string>({ defaultTTL: 100, cleanupInterval: 0 })
      shortCache.set('a', '1')
      shortCache.set('b', '2')

      await new Promise((r) => setTimeout(r, 150))
      const pruned = shortCache.prune()
      expect(pruned).toBe(2)
    })

    it('should not remove non-expired entries', () => {
      cache.set('a', '1')
      expect(cache.prune()).toBe(0)
    })
  })

  describe('destroy', () => {
    it('should clear cache and stop cleanup', () => {
      cache.set('a', '1')
      cache.destroy()
      expect(cache.getStats().size).toBe(0)
    })
  })
})

describe('createCacheKey', () => {
  it('should join parts with ::', () => {
    expect(createCacheKey('a', 'b', 'c')).toBe('a::b::c')
  })

  it('should stringify objects', () => {
    const key = createCacheKey('prefix', { foo: 'bar' })
    expect(key).toContain('prefix')
    expect(key).toContain('foo')
  })

  it('should convert numbers to strings', () => {
    expect(createCacheKey('api', 42)).toBe('api::42')
  })
})

describe('globalRequestCache', () => {
  it('should be a RequestCache instance', () => {
    expect(globalRequestCache).toBeInstanceOf(RequestCache)
  })
})
