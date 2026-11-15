/**
 * @file lru-cache.test.ts
 * @description LRU缓存实现测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LRUCache, createLRUCache, globalLRUCache } from '../lru-cache'

describe('LRUCache', () => {
  let cache: LRUCache<string, number>

  beforeEach(() => {
    cache = new LRUCache<string, number>({ maxSize: 3, maxMemory: 1024, ttl: 5000, enableStats: true })
  })

  describe('constructor', () => {
    it('should create cache with default options', () => {
      const c = new LRUCache()
      expect(c.size).toBe(0)
    })

    it('should create cache with custom options', () => {
      const c = new LRUCache({ maxSize: 50, maxMemory: 1024 * 1024, ttl: 1000 })
      expect(c.size).toBe(0)
    })
  })

  describe('get / set', () => {
    it('should store and retrieve values', () => {
      cache.set('a', 1)
      expect(cache.get('a')).toBe(1)
    })

    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined()
    })

    it('should update existing key', () => {
      cache.set('a', 1)
      cache.set('a', 2)
      expect(cache.get('a')).toBe(2)
      expect(cache.size).toBe(1)
    })

    it('should evict LRU when exceeding maxSize', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      cache.set('d', 4)

      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
      expect(cache.size).toBe(3)
    })

    it('should promote accessed items to head', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      cache.get('a')
      cache.set('d', 4)

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
    })
  })

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortCache = new LRUCache<string, number>({ ttl: 100 })
      shortCache.set('a', 1)
      expect(shortCache.get('a')).toBe(1)

      await new Promise((r) => setTimeout(r, 150))
      expect(shortCache.get('a')).toBeUndefined()
    })

    it('should report expired entries as not present via has()', async () => {
      const shortCache = new LRUCache<string, number>({ ttl: 100 })
      shortCache.set('a', 1)
      expect(shortCache.has('a')).toBe(true)

      await new Promise((r) => setTimeout(r, 150))
      expect(shortCache.has('a')).toBe(false)
    })

    it('should not expire with ttl=0', () => {
      const noExpiry = new LRUCache<string, number>({ ttl: 0 })
      noExpiry.set('a', 1)
      expect(noExpiry.get('a')).toBe(1)
    })
  })

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('a', 1)
      expect(cache.has('a')).toBe(true)
    })

    it('should return false for missing keys', () => {
      expect(cache.has('missing')).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('a', 1)
      expect(cache.delete('a')).toBe(true)
      expect(cache.get('a')).toBeUndefined()
    })

    it('should return false for missing key', () => {
      expect(cache.delete('missing')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.clear()
      expect(cache.size).toBe(0)
      expect(cache.get('a')).toBeUndefined()
    })

    it('should reset stats after clear', () => {
      cache.set('a', 1)
      cache.get('a')
      cache.clear()
      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.evictions).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should track hits and misses', () => {
      cache.set('a', 1)
      cache.get('a')
      cache.get('missing')

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.5)
    })

    it('should track evictions', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      cache.set('d', 4)

      const stats = cache.getStats()
      expect(stats.evictions).toBe(1)
    })

    it('should report correct size', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      expect(cache.getStats().size).toBe(2)
    })
  })

  describe('getOrSet', () => {
    it('should return cached value if exists', () => {
      cache.set('a', 1)
      const result = cache.getOrSet('a', () => 999)
      expect(result).toBe(1)
    })

    it('should fetch and cache if missing', () => {
      const result = cache.getOrSet('a', () => 42)
      expect(result).toBe(42)
      expect(cache.get('a')).toBe(42)
    })
  })

  describe('getOrSetAsync', () => {
    it('should return cached value if exists', async () => {
      cache.set('a', 1)
      const result = await cache.getOrSetAsync('a', async () => 999)
      expect(result).toBe(1)
    })

    it('should fetch and cache if missing', async () => {
      const result = await cache.getOrSetAsync('a', async () => 42)
      expect(result).toBe(42)
      expect(cache.get('a')).toBe(42)
    })
  })

  describe('prune', () => {
    it('should remove expired entries', async () => {
      const shortCache = new LRUCache<string, number>({ ttl: 100 })
      shortCache.set('a', 1)
      shortCache.set('b', 2)

      await new Promise((r) => setTimeout(r, 150))
      const pruned = shortCache.prune()
      expect(pruned).toBe(2)
      expect(shortCache.size).toBe(0)
    })

    it('should not remove non-expired entries', () => {
      cache.set('a', 1)
      const pruned = cache.prune()
      expect(pruned).toBe(0)
      expect(cache.size).toBe(1)
    })
  })

  describe('iteration methods', () => {
    beforeEach(() => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
    })

    it('keys() should return all keys', () => {
      expect(cache.keys()).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    })

    it('values() should return all values', () => {
      expect(cache.values()).toEqual(expect.arrayContaining([1, 2, 3]))
    })

    it('entries() should return all entries', () => {
      const entries = cache.entries()
      expect(entries).toHaveLength(3)
      expect(entries).toEqual(expect.arrayContaining([['a', 1], ['b', 2], ['c', 3]]))
    })
  })

  describe('memory tracking', () => {
    it('should track memory usage', () => {
      cache.set('a', 1)
      expect(cache.memoryUsed).toBeGreaterThan(0)
    })

    it('should reduce memory on delete', () => {
      cache.set('a', 1)
      const memBefore = cache.memoryUsed
      cache.delete('a')
      expect(cache.memoryUsed).toBeLessThan(memBefore)
    })
  })

  describe('edge cases', () => {
    it('should handle single element cache', () => {
      const tiny = new LRUCache<string, number>({ maxSize: 1 })
      tiny.set('a', 1)
      tiny.set('b', 2)
      expect(tiny.get('a')).toBeUndefined()
      expect(tiny.get('b')).toBe(2)
    })

    it('should handle delete of head node', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.delete('b')
      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeUndefined()
    })

    it('should handle delete of tail node', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.delete('a')
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
    })

    it('should handle delete of middle node', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      cache.delete('b')
      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('c')).toBe(3)
    })
  })
})

describe('createLRUCache', () => {
  it('should create a new LRUCache instance', () => {
    const cache = createLRUCache({ maxSize: 10 })
    expect(cache).toBeInstanceOf(LRUCache)
    expect(cache.size).toBe(0)
  })
})

describe('globalLRUCache', () => {
  it('should be an LRUCache instance', () => {
    expect(globalLRUCache).toBeInstanceOf(LRUCache)
  })
})
