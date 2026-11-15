/**
 * @file monaco-preloader.ts
 * @description Monaco Editor预加载服务 - 优化首屏加载性能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @updated 2026-03-25
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,monaco,preload,optimization
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('monaco-preloader')

/**
 * Monaco预加载策略
 * 
 * 1. 首屏空闲时预加载 (requestIdleCallback)
 * 2. 用户交互前预加载 (hover/即将进入IDE)
 * 3. 路由切换时预加载 (模式切换前)
 * 
 * 预加载时机优先级：
 *   - 高: 用户点击"切换到IDE"按钮
 *   - 中: 应用首屏渲染完成后3s
 *   - 低: 用户空闲时
 */

// ===== 状态管理 =====
type PreloadState = 'idle' | 'loading' | 'loaded' | 'failed'

class MonacoPreloader {
  private state: PreloadState = 'idle'
  private loadPromise: Promise<boolean> | null = null
  private listeners: Set<(success: boolean) => void> = new Set()
  private preloadTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * 获取当前状态
   */
  getState(): PreloadState {
    return this.state
  }

  /**
   * 检查是否已加载
   */
  isLoaded(): boolean {
    return this.state === 'loaded'
  }

  /**
   * 检查是否正在加载
   */
  isLoading(): boolean {
    return this.state === 'loading'
  }

  /**
   * 添加状态监听器
   */
  onLoad(callback: (success: boolean) => void): () => void {
    this.listeners.add(callback)

    // 如果已经加载或失败，立即回调
    if (this.state === 'loaded') {
      callback(true)
    } else if (this.state === 'failed') {
      callback(false)
    }

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * 通知所有监听器
   */
  private notify(success: boolean) {
    this.listeners.forEach(callback => {
      try {
        callback(success)
      } catch (err) {
        logger.warn('[MonacoPreloader] Listener error:', err)
      }
    })
  }

  /**
   * 执行预加载
   */
  async preload(priority: 'high' | 'medium' | 'low' = 'medium'): Promise<boolean> {
    // 如果已经加载或正在加载，直接返回
    if (this.state === 'loaded') {
      return true
    }
    if (this.state === 'loading') {
      return this.loadPromise!
    }

    this.state = 'loading'
    logger.info(`Preloading Monaco (${priority} priority)...`)

    const startTime = performance.now()

    this.loadPromise = this.doPreload(priority).then((success) => {
      const duration = performance.now() - startTime
      logger.info(`Preload ${success ? 'succeeded' : 'failed'} in ${duration.toFixed(2)}ms`)

      this.state = success ? 'loaded' : 'failed'
      this.loadPromise = null

      this.notify(success)
      return success
    })

    return this.loadPromise
  }

  /**
   * 实际执行预加载
   */
  private async doPreload(priority: 'high' | 'medium' | 'low'): Promise<boolean> {
    try {
      // 高优先级：立即加载
      if (priority === 'high') {
        await import('./monaco-setup').then(() => import('@monaco-editor/react'))
        return true
      }

      // 中优先级：延迟加载（给首屏渲染让路）
      if (priority === 'medium') {
        await new Promise(resolve => setTimeout(resolve, 100))
        await import('./monaco-setup').then(() => import('@monaco-editor/react'))
        return true
      }

      // 低优先级：使用requestIdleCallback
      if (priority === 'low') {
        return new Promise((resolve) => {
          const load = () => {
            import('./monaco-setup').then(() => import('@monaco-editor/react'))
              .then(() => resolve(true))
              .catch(() => resolve(false))
          }

          if ('requestIdleCallback' in window) {
            const winWithIdle = window as Window & {
              requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void
            }
            winWithIdle.requestIdleCallback(
              () => load(),
              { timeout: 2000 } // 2秒超时
            )
          } else {
            // Fallback: setTimeout
            setTimeout(load, 2000)
          }
        })
      }

      return false
    } catch (error) {
      logger.warn('[MonacoPreloader] Preload failed:', error)
      return false
    }
  }

  /**
   * 延迟预加载（高优先级）
   */
  preloadWithDelay(delay: number = 3000): void {
    if (this.state !== 'idle') return

    logger.debug(`Scheduled preload in ${delay}ms`)

    this.preloadTimeout = setTimeout(() => {
      this.preload('medium')
      this.preloadTimeout = null
    }, delay)
  }

  /**
   * 取消延迟预加载
   */
  cancelDelayedPreload(): void {
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout)
      this.preloadTimeout = null
      logger.info('Cancelled delayed preload')
    }
  }

  /**
   * 强制重新加载
   */
  async reload(): Promise<boolean> {
    this.state = 'idle'
    return this.preload('high')
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = 'idle'
    this.loadPromise = null
    this.listeners.clear()
    this.cancelDelayedPreload()
  }
}

// ===== 单例导出 =====
let preloaderInstance: MonacoPreloader | null = null

export function getMonacoPreloader(): MonacoPreloader {
  if (!preloaderInstance) {
    preloaderInstance = new MonacoPreloader()
  }
  return preloaderInstance
}

// ===== React Hooks =====
import { useEffect, useState, useCallback } from 'react'

/**
 * 使用Monaco预加载Hook
 */
export function useMonacoPreload() {
  const preloader = getMonacoPreloader()
  const [state, setState] = useState<PreloadState>(preloader.getState())

  useEffect(() => {
    const unsubscribe = preloader.onLoad((success) => {
      setState(success ? 'loaded' : 'failed')
    })

    queueMicrotask(() => setState(preloader.getState()))

    return unsubscribe
  }, [preloader])

  const preload = useCallback(async (priority?: 'high' | 'medium' | 'low') => {
    const success = await preloader.preload(priority)
    setState(success ? 'loaded' : 'failed')
    return success
  }, [preloader])

  const preloadWithDelay = useCallback((delay?: number) => {
    preloader.preloadWithDelay(delay)
  }, [preloader])

  const cancelDelayed = useCallback(() => {
    preloader.cancelDelayedPreload()
  }, [preloader])

  return {
    state,
    isLoaded: preloader.isLoaded(),
    isLoading: preloader.isLoading(),
    preload,
    preloadWithDelay,
    cancelDelayed,
  }
}

/**
 * 自动Monaco预加载Hook
 * 
 * 使用场景：
 * - App.tsx: 应用启动时自动预加载
 * - IDE入口组件: 进入IDE前预加载
 */
export function useAutoMonacoPreload(options: {
  enabled?: boolean
  priority?: 'high' | 'medium' | 'low'
  delay?: number
  trigger?: () => boolean // 自定义触发条件
} = {}) {
  const { enabled = true, priority = 'medium', delay = 3000, trigger } = options
  const { state, preload, preloadWithDelay } = useMonacoPreload()

  useEffect(() => {
    if (!enabled || state === 'loaded' || state === 'loading') return

    // 如果有自定义触发条件
    if (trigger && !trigger()) return

    // 立即预加载
    if (priority === 'high') {
      preload(priority)
      return
    }

    // 延迟预加载
    if (delay && delay > 0) {
      preloadWithDelay(delay)
    } else {
      preload(priority)
    }
  }, [enabled, state, priority, delay, trigger, preload, preloadWithDelay])

  return {
    state,
    isLoaded: state === 'loaded',
    isLoading: state === 'loading',
  }
}

// ===== 预加载策略 =====
export const PRELOAD_STRATEGIES = {
  /**
   * 策略1: 应用启动后延迟预加载
   * 适用于: 首屏渲染完成后，用户可能切换到IDE
   */
  APP_START: {
    priority: 'medium' as const,
    delay: 3000, // 3秒后
  },

  /**
   * 策略2: 用户hover IDE入口时预加载
   * 适用于: 用户即将切换到IDE
   */
  IDE_HOVER: {
    priority: 'high' as const,
    delay: 0, // 立即
  },

  /**
   * 策略3: 模式切换前预加载
   * 适用于: 确定要切换到IDE时
   */
  MODE_SWITCH: {
    priority: 'high' as const,
    delay: 0, // 立即
  },

  /**
   * 策略4: 用户空闲时预加载
   * 适用于: 用户不活跃时
   */
  USER_IDLE: {
    priority: 'low' as const,
    delay: 5000, // 5秒后
  },
} as const
