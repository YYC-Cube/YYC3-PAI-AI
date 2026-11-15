/**
 * @file lru-cache.ts
 * @description LRU缓存实现，优化内存使用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags cache,lru,memory,performance
 */

import { createLogger } from './logger'

const logger = createLogger('lru-cache')

export interface LRUCacheNode<K, V> {
  key: K
  value: V
  prev: LRUCacheNode<K, V> | null
  next: LRUCacheNode<K, V> | null
  timestamp: number
  size: number
}

export interface LRUCacheOptions {
  maxSize?: number
  maxMemory?: number
  ttl?: number
  enableStats?: boolean
}

export interface LRUCacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  memoryUsed: number
  evictions: number
}

export class LRUCache<K = string, V = unknown> {
  private cache: Map<K, LRUCacheNode<K, V>> = new Map()
  private head: LRUCacheNode<K, V> | null = null
  private tail: LRUCacheNode<K, V> | null = null
  private maxSize: number
  private maxMemory: number
  private ttl: number
  private currentMemory: number = 0
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  }
  private enableStats: boolean

  constructor(options: LRUCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000
    this.maxMemory = options.maxMemory ?? 50 * 1024 * 1024
    this.ttl = options.ttl ?? 5 * 60 * 1000
    this.enableStats = options.enableStats ?? true
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key)

    if (!node) {
      if (this.enableStats) {
        this.stats.misses++
      }
      return undefined
    }

    if (this.isExpired(node)) {
      this.deleteNode(node)
      if (this.enableStats) {
        this.stats.misses++
      }
      return undefined
    }

    this.moveToHead(node)
    if (this.enableStats) {
      this.stats.hits++
    }
    return node.value
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key)

    if (existingNode) {
      this.currentMemory -= existingNode.size
      existingNode.value = value
      existingNode.size = this.estimateSize(value)
      existingNode.timestamp = Date.now()
      this.currentMemory += existingNode.size
      this.moveToHead(existingNode)
      return
    }

    const size = this.estimateSize(value)
    
    while (
      (this.cache.size >= this.maxSize || this.currentMemory + size > this.maxMemory) &&
      this.tail
    ) {
      this.evictTail()
    }

    const newNode: LRUCacheNode<K, V> = {
      key,
      value,
      prev: null,
      next: this.head,
      timestamp: Date.now(),
      size,
    }

    if (this.head) {
      this.head.prev = newNode
    }
    this.head = newNode

    if (!this.tail) {
      this.tail = newNode
    }

    this.cache.set(key, newNode)
    this.currentMemory += size
  }

  has(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) return false
    if (this.isExpired(node)) {
      this.deleteNode(node)
      return false
    }
    return true
  }

  delete(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) return false
    this.deleteNode(node)
    return true
  }

  clear(): void {
    this.cache.clear()
    this.head = null
    this.tail = null
    this.currentMemory = 0
    if (this.enableStats) {
      this.stats.hits = 0
      this.stats.misses = 0
      this.stats.evictions = 0
    }
  }

  getStats(): LRUCacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
      memoryUsed: this.currentMemory,
      evictions: this.stats.evictions,
    }
  }

  getOrSet(key: K, fetcher: () => V): V {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }
    const value = fetcher()
    this.set(key, value)
    return value
  }

  async getOrSetAsync(key: K, fetcher: () => Promise<V>): Promise<V> {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }
    const value = await fetcher()
    this.set(key, value)
    return value
  }

  prune(): number {
    let pruned = 0
    for (const [_key, node] of this.cache) {
      if (this.isExpired(node)) {
        this.deleteNode(node)
        pruned++
      }
    }
    return pruned
  }

  keys(): K[] {
    return Array.from(this.cache.keys())
  }

  values(): V[] {
    return Array.from(this.cache.values()).map((node) => node.value)
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([key, node]) => [key, node.value])
  }

  get size(): number {
    return this.cache.size
  }

  get memoryUsed(): number {
    return this.currentMemory
  }

  private isExpired(node: LRUCacheNode<K, V>): boolean {
    return this.ttl > 0 && Date.now() - node.timestamp > this.ttl
  }

  private moveToHead(node: LRUCacheNode<K, V>): void {
    if (node === this.head) return

    if (node.prev) {
      node.prev.next = node.next
    }
    if (node.next) {
      node.next.prev = node.prev
    }

    if (node === this.tail) {
      this.tail = node.prev
    }

    node.prev = null
    node.next = this.head
    if (this.head) {
      this.head.prev = node
    }
    this.head = node
  }

  private deleteNode(node: LRUCacheNode<K, V>): void {
    this.cache.delete(node.key)
    this.currentMemory -= node.size

    if (node.prev) {
      node.prev.next = node.next
    }
    if (node.next) {
      node.next.prev = node.prev
    }

    if (node === this.head) {
      this.head = node.next
    }
    if (node === this.tail) {
      this.tail = node.prev
    }
  }

  private evictTail(): void {
    if (!this.tail) return

    this.deleteNode(this.tail)
    if (this.enableStats) {
      this.stats.evictions++
    }
    logger.debug(`[LRUCache] Evicted tail entry, current size: ${this.cache.size}`)
  }

  private estimateSize(value: V): number {
    try {
      if (typeof value === 'string') {
        return value.length * 2
      }
      if (value instanceof ArrayBuffer) {
        return value.byteLength
      }
      if (ArrayBuffer.isView(value)) {
        return value.byteLength
      }
      return JSON.stringify(value).length * 2
    } catch {
      return 1024
    }
  }
}

export const globalLRUCache = new LRUCache({
  maxSize: 1000,
  maxMemory: 50 * 1024 * 1024,
  ttl: 5 * 60 * 1000,
  enableStats: true,
})

export function createLRUCache<K = string, V = unknown>(options?: LRUCacheOptions): LRUCache<K, V> {
  return new LRUCache<K, V>(options)
}
