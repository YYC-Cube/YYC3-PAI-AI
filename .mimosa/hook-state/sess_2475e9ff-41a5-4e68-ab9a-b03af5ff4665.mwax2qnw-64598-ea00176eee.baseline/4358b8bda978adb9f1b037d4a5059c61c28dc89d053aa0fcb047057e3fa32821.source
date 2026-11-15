/**
 * @file request-cache.ts
 * @description 请求缓存工具类，支持LRU淘汰、TTL过期、缓存统计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags cache,request,performance
 */

import { createLogger } from './logger'

const logger = createLogger('request-cache')

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
  evictions: number
}

export interface CacheOptions {
  maxSize?: number
  defaultTTL?: number
  cleanupInterval?: number
  enableStats?: boolean
}

export class RequestCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number
  private defaultTTL: number
  private cleanupInterval: number
  private cleanupTimer: ReturnType<typeof setInterval> | null = null
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  }
  private enableStats: boolean

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100
    this.defaultTTL = options.defaultTTL ?? 5 * 60 * 1000
    this.cleanupInterval = options.cleanupInterval ?? 60 * 1000
    this.enableStats = options.enableStats ?? true

    this.startCleanup()
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      if (this.enableStats) {
        this.stats.misses++
      }
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      if (this.enableStats) {
        this.stats.misses++
      }
      return null
    }

    entry.hits++
    if (this.enableStats) {
      this.stats.hits++
    }

    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.data
  }

  set(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evict()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
      hits: 0,
      size: this.estimateSize(data),
    }

    this.cache.set(key, entry)
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    if (this.enableStats) {
      this.stats.hits = 0
      this.stats.misses = 0
      this.stats.evictions = 0
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.stats.evictions,
    }
  }

  getOrSet(key: string, fetcher: () => T | Promise<T>, ttl?: number): T | Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const result = fetcher()
    if (result instanceof Promise) {
      return result.then((data) => {
        this.set(key, data, ttl)
        return data
      })
    }

    this.set(key, result, ttl)
    return result
  }

  async getOrSetAsync(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  prune(): number {
    let pruned = 0
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        pruned++
      }
    }
    return pruned
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.cache.clear()
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private evict(): void {
    const oldestKey = this.cache.keys().next().value
    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey)
      if (this.enableStats) {
        this.stats.evictions++
      }
    }
  }

  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length
    } catch {
      return 0
    }
  }

  private startCleanup(): void {
    if (this.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        const pruned = this.prune()
        if (pruned > 0) {
          logger.debug(`[RequestCache] Pruned ${pruned} expired entries`)
        }
      }, this.cleanupInterval)
    }
  }
}

export const globalRequestCache = new RequestCache({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000,
  cleanupInterval: 60 * 1000,
  enableStats: true,
})

export function createCacheKey(...parts: (string | number | object)[]): string {
  return parts
    .map((part) => {
      if (typeof part === 'object') {
        return JSON.stringify(part)
      }
      return String(part)
    })
    .join('::')
}
