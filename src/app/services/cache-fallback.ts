/**
 * @file cache-fallback.ts
 * @description E1-3 缓存降级 — 网络故障时提供缓存回复 + 明确标注 + 恢复后新鲜化
 *
 * 设计：
 *   Layer 1: 内存缓存（当前会话，最快）
 *   Layer 2: localStorage 持久缓存（跨会话，标签"缓存"）
 *   Layer 3: 网络请求（正常路径）
 *
 * 降级链：网络请求 → 失败 → 检查 L1 → 检查 L2 → 均无 → 诚实报错（拒绝伪造）
 * 恢复链：网络恢复 → 后台刷新缓存 → 标签移除
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags cache,fallback,offline,degradation,phase-e1
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('cache-fallback')
const LS_PREFIX = 'yyc3_cache_'
const MAX_CACHE_ENTRIES = 50
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 分钟

// ===== Types =====

export interface CachedResponse {
  /** 缓存键（prompt + model 的哈希） */
  key: string
  /** 缓存的 AI 回复 */
  content: string
  /** 缓存时间 */
  cachedAt: number
  /** 是否已过期 */
  expired: boolean
  /** 来源模型 */
  model: string
  /** 命中次数 */
  hitCount: number
}

export type CacheSource = 'memory' | 'persistent' | null

export interface CacheFallbackResult {
  content: string
  source: CacheSource
  cachedAt: number
  /** 明确标注这是缓存回复 */
  isCached: boolean
}

// ===== 内存缓存 (Layer 1) =====

const memoryCache = new Map<string, CachedResponse>()

// ===== 工具 =====

function hashKey(prompt: string, model: string): string {
  let hash = 0
  const input = `${model}:${prompt}`
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff
  }
  return `${hash.toString(36)}_${input.length.toString(36)}`
}

function isExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > CACHE_TTL_MS
}

// ===== Layer 2: localStorage 持久缓存 =====

function loadPersistent(key: string): CachedResponse | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function savePersistent(entry: CachedResponse): void {
  try {
    localStorage.setItem(LS_PREFIX + entry.key, JSON.stringify(entry))
    // 淘汰旧条目
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
    if (keys.length > MAX_CACHE_ENTRIES) {
      const entries = keys
        .map(k => ({ k, data: loadPersistent(k.slice(LS_PREFIX.length)) }))
        .filter(e => e.data)
        .sort((a, b) => a.data!.cachedAt - b.data!.cachedAt)
      for (const e of entries.slice(0, keys.length - MAX_CACHE_ENTRIES)) {
        localStorage.removeItem(e.k)
      }
    }
  } catch { /* quota exceeded */ }
}

// ===== Public API =====

/**
 * 存入缓存（同时写 L1 + L2）
 */
export function cacheResponse(prompt: string, model: string, content: string): void {
  const key = hashKey(prompt, model)
  const entry: CachedResponse = {
    key,
    content,
    cachedAt: Date.now(),
    expired: false,
    model,
    hitCount: 0,
  }
  memoryCache.set(key, entry)
  savePersistent(entry)
}

/**
 * 查找缓存回复（L1 → L2 → null）
 * 过期缓存不返回（诚实降级，不提供过期数据）
 */
export function findCached(prompt: string, model: string): CacheFallbackResult | null {
  const key = hashKey(prompt, model)

  // Layer 1: 内存
  const mem = memoryCache.get(key)
  if (mem && !isExpired(mem.cachedAt)) {
    mem.hitCount++
    return {
      content: mem.content,
      source: 'memory',
      cachedAt: mem.cachedAt,
      isCached: true,
    }
  }

  // Layer 2: localStorage
  const persisted = loadPersistent(key)
  if (persisted && !isExpired(persisted.cachedAt)) {
    // 提升到内存
    persisted.hitCount++
    memoryCache.set(key, persisted)
    return {
      content: persisted.content,
      source: 'persistent',
      cachedAt: persisted.cachedAt,
      isCached: true,
    }
  }

  return null
}

/**
 * 带缓存降级的 AI 调用包装器
 *
 * 正常路径：调 sendFn → 成功 → 缓存 → 返回 { isCached: false }
 * 降级路径：调 sendFn → 失败 → findCached → 有缓存 → 返回 { isCached: true, source }
 * 兜底：均失败 → 诚实报错（拒绝伪造回复）
 */
export async function sendWithCacheFallback(
  prompt: string,
  model: string,
  sendFn: () => Promise<string>,
  onChunk?: (delta: string, full: string) => void,
): Promise<CacheFallbackResult> {
  try {
    // 正常路径
    const result = await sendFn()
    cacheResponse(prompt, model, result)
    return { content: result, source: null, cachedAt: Date.now(), isCached: false }
  } catch (networkError) {
    logger.warn('Network failed, trying cache fallback', networkError as Error)

    // 降级路径
    const cached = findCached(prompt, model)
    if (cached) {
      logger.info(`Cache fallback hit (${cached.source})`, { key: hashKey(prompt, model) })
      // 模拟流式输出缓存内容（保持 UI 一致性）
      if (onChunk) {
        onChunk(cached.content, cached.content)
      }
      return cached
    }

    // 兜底：诚实报错
    throw new Error(
      `网络请求失败且无缓存可用。` +
      `错误：${networkError instanceof Error ? networkError.message : String(networkError)}。` +
      `请检查网络连接后重试。`,
    )
  }
}

/**
 * 清理过期缓存条目
 */
export function cleanExpiredCache(): number {
  let cleaned = 0
  for (const [key, entry] of memoryCache) {
    if (isExpired(entry.cachedAt)) {
      memoryCache.delete(key)
      cleaned++
    }
  }
  const lsKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
  for (const k of lsKeys) {
    try {
      const data = JSON.parse(localStorage.getItem(k) || '{}')
      if (data.cachedAt && isExpired(data.cachedAt)) {
        localStorage.removeItem(k)
        cleaned++
      }
    } catch { /* skip */ }
  }
  return cleaned
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { memoryCount: number; persistentCount: number; totalHits: number } {
  const lsKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
  const totalHits = Array.from(memoryCache.values()).reduce((s, e) => s + e.hitCount, 0)
  return {
    memoryCount: memoryCache.size,
    persistentCount: lsKeys.length,
    totalHits,
  }
}

/**
 * 清空全部缓存
 */
export function clearAllCache(): void {
  memoryCache.clear()
  const lsKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
  for (const k of lsKeys) localStorage.removeItem(k)
}
