/**
 * @file lazy-loader.ts
 * @description 组件懒加载和预加载工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-07
 * @updated 2026-04-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags lazy,preload,performance
 */

import { lazy, ComponentType } from 'react'
import { createLogger } from './logger'

const logger = createLogger('lazy-loader')

export interface LazyLoaderOptions {
  preloadDelay?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface PreloadStrategy {
  name: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  delay: number
  condition?: () => boolean
}

const defaultOptions: LazyLoaderOptions = {
  preloadDelay: 100,
  retryAttempts: 3,
  retryDelay: 1000,
}

export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoaderOptions = {}
): {
  component: React.LazyExoticComponent<T>
  preload: () => Promise<void>
} {
  const opts = { ...defaultOptions, ...options }
  let preloadPromise: Promise<void> | null = null
  let attempts = 0

  const loadWithRetry = async (): Promise<{ default: T }> => {
    try {
      const module = await importFn()
      attempts = 0
      return module
    } catch (error) {
      attempts++
      if (attempts < (opts.retryAttempts ?? 3)) {
        logger.warn(`[LazyLoader] Retry ${attempts} after error:`, error)
        await new Promise((resolve) => setTimeout(resolve, opts.retryDelay))
        return loadWithRetry()
      }
      throw error
    }
  }

  const component = lazy<T>(loadWithRetry)

  const preload = async (): Promise<void> => {
    if (!preloadPromise) {
      preloadPromise = loadWithRetry().then(() => {
        logger.debug(`[LazyLoader] Preloaded component`)
      })
    }
    return preloadPromise
  }

  return { component, preload }
}

export class ComponentPreloader {
  private preloadedComponents: Map<string, Promise<void>> = new Map()
  private strategies: Map<string, PreloadStrategy> = new Map()
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map()

  register(name: string, loader: () => Promise<void>, strategy: PreloadStrategy): void {
    this.strategies.set(name, { ...strategy })
    
    if (strategy.condition && !strategy.condition()) {
      return
    }

    const timer = setTimeout(() => {
      this.preload(name, loader)
    }, strategy.delay)

    this.timers.set(name, timer)
  }

  async preload(name: string, loader: () => Promise<void>): Promise<void> {
    if (this.preloadedComponents.has(name)) {
      return this.preloadedComponents.get(name)!
    }

    const promise = loader()
      .then(() => {
        logger.debug(`[Preloader] Preloaded: ${name}`)
      })
      .catch((error) => {
        logger.error(`[Preloader] Failed to preload ${name}:`, error)
        this.preloadedComponents.delete(name)
      })

    this.preloadedComponents.set(name, promise)
    return promise
  }

  preloadAll(): Promise<PromiseSettledResult<void>[]> {
    return Promise.allSettled(Array.from(this.preloadedComponents.values()))
  }

  cancel(name: string): void {
    const timer = this.timers.get(name)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(name)
    }
    this.preloadedComponents.delete(name)
  }

  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    this.preloadedComponents.clear()
  }

  isPreloaded(name: string): boolean {
    return this.preloadedComponents.has(name)
  }

  getStats(): { registered: number; preloaded: number } {
    return {
      registered: this.strategies.size,
      preloaded: this.preloadedComponents.size,
    }
  }
}

export const globalPreloader = new ComponentPreloader()

export const PRELOAD_STRATEGIES: Record<string, PreloadStrategy> = {
  APP_START: { name: 'app-start', priority: 'critical', delay: 0 },
  IDLE: { name: 'idle', priority: 'low', delay: 3000 },
  HOVER: { name: 'hover', priority: 'high', delay: 100 },
  VIEWPORT: { name: 'viewport', priority: 'medium', delay: 500 },
  ROUTE_CHANGE: { name: 'route-change', priority: 'high', delay: 200 },
}

export function usePreloadOnHover(loader: () => Promise<void>): {
  onMouseEnter: () => void
  onFocus: () => void
} {
  let preloadPromise: Promise<void> | null = null

  const handlePreload = () => {
    if (!preloadPromise) {
      preloadPromise = loader()
    }
  }

  return {
    onMouseEnter: handlePreload,
    onFocus: handlePreload,
  }
}

export function createChunkLoader(chunkName: string, importFn: () => Promise<unknown>): () => Promise<void> {
  return () => {
    const start = performance.now()
    return importFn().then(() => {
      const duration = performance.now() - start
      logger.debug(`[ChunkLoader] Loaded chunk "${chunkName}" in ${duration.toFixed(2)}ms`)
    })
  }
}

export function schedulePreload(loader: () => Promise<void>, delay: number): () => void {
  const timer = setTimeout(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loader(), { timeout: delay })
    } else {
      loader()
    }
  }, delay)

  return () => clearTimeout(timer)
}
