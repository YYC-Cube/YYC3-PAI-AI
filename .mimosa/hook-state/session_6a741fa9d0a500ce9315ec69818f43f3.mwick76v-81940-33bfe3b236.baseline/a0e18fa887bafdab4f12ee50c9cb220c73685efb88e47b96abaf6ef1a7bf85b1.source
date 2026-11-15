/**
 * @file request-dedup.ts
 * @description 请求去重工具类，防止重复请求
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags request,dedup,performance
 */

import { createLogger } from './logger'

const logger = createLogger('request-dedup')

export interface PendingRequest<T = unknown> {
  promise: Promise<T>
  timestamp: number
  subscribers: number
}

export interface DedupStats {
  deduplicated: number
  total: number
  dedupRate: number
  pending: number
}

export interface DedupOptions {
  maxPendingTime?: number
  cleanupInterval?: number
  enableStats?: boolean
}

export class RequestDeduplicator<T = unknown> {
  private pending: Map<string, PendingRequest<T>> = new Map()
  private maxPendingTime: number
  private cleanupTimer: ReturnType<typeof setInterval> | null = null
  private stats = {
    deduplicated: 0,
    total: 0,
  }
  private enableStats: boolean

  constructor(options: DedupOptions = {}) {
    this.maxPendingTime = options.maxPendingTime ?? 30 * 1000
    this.enableStats = options.enableStats ?? true

    if (options.cleanupInterval !== 0) {
      this.startCleanup(options.cleanupInterval ?? 10 * 1000)
    }
  }

  async dedupe(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.enableStats) {
      this.stats.total++
    }

    const pending = this.pending.get(key)
    if (pending) {
      if (this.enableStats) {
        this.stats.deduplicated++
      }
      pending.subscribers++
      logger.debug(`[RequestDedup] Reusing pending request: ${key}`)
      return pending.promise
    }

    const promise = fetcher()
      .then((result) => {
        this.pending.delete(key)
        return result
      })
      .catch((error) => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
      subscribers: 1,
    })

    return promise
  }

  has(key: string): boolean {
    return this.pending.has(key)
  }

  getPending(key: string): Promise<T> | null {
    const pending = this.pending.get(key)
    return pending ? pending.promise : null
  }

  cancel(key: string): boolean {
    return this.pending.delete(key)
  }

  clear(): void {
    this.pending.clear()
    if (this.enableStats) {
      this.stats.deduplicated = 0
      this.stats.total = 0
    }
  }

  getStats(): DedupStats {
    return {
      deduplicated: this.stats.deduplicated,
      total: this.stats.total,
      dedupRate: this.stats.total > 0 ? this.stats.deduplicated / this.stats.total : 0,
      pending: this.pending.size,
    }
  }

  getPendingCount(): number {
    return this.pending.size
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.pending.clear()
  }

  private startCleanup(interval: number): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      let cleaned = 0
      for (const [key, request] of this.pending) {
        if (now - request.timestamp > this.maxPendingTime) {
          this.pending.delete(key)
          cleaned++
        }
      }
      if (cleaned > 0) {
        logger.debug(`[RequestDedup] Cleaned ${cleaned} stale pending requests`)
      }
    }, interval)
  }
}

export const globalRequestDeduplicator = new RequestDeduplicator({
  maxPendingTime: 30 * 1000,
  cleanupInterval: 10 * 1000,
  enableStats: true,
})

export function createRequestKey(url: string, options?: RequestInit): string {
  const method = options?.method ?? 'GET'
  const body = options?.body ? JSON.stringify(options.body) : ''
  return `${method}:${url}:${body}`
}

export async function dedupedFetch(
  url: string,
  options?: RequestInit,
  deduplicator: RequestDeduplicator<Response> = globalRequestDeduplicator as RequestDeduplicator<Response>
): Promise<Response> {
  const key = createRequestKey(url, options)
  return deduplicator.dedupe(key, () => fetch(url, options))
}
