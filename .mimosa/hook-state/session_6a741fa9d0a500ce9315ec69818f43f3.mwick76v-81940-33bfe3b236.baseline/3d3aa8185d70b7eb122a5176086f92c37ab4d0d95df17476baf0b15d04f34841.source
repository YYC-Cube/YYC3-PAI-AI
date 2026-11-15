/**
 * @file lazy-loader.test.ts
 * @description 组件懒加载和预加载工具测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createLazyComponent,
  ComponentPreloader,
  globalPreloader,
  PRELOAD_STRATEGIES,
  usePreloadOnHover,
  createChunkLoader,
  schedulePreload,
} from '../lazy-loader'

describe('createLazyComponent', () => {
  it('should return a lazy component and preload function', () => {
    const mockImport = () => Promise.resolve({ default: () => null })
    const result = createLazyComponent(mockImport)

    expect(result.component).toBeTruthy()
    expect(result.preload).toBeInstanceOf(Function)
  })

  it('should preload component', async () => {
    const mockImport = vi.fn().mockResolvedValue({ default: () => null })
    const { preload } = createLazyComponent(mockImport)

    await preload()
    expect(mockImport).toHaveBeenCalled()
  })

  it('should not preload twice', async () => {
    const mockImport = vi.fn().mockResolvedValue({ default: () => null })
    const { preload } = createLazyComponent(mockImport)

    await preload()
    await preload()
    expect(mockImport).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure', async () => {
    let attempts = 0
    const failThenSucceed = () => {
      attempts++
      if (attempts < 3) return Promise.reject(new Error('fail'))
      return Promise.resolve({ default: () => null })
    }

    const { preload } = createLazyComponent(failThenSucceed, { retryAttempts: 3, retryDelay: 10 })
    await preload()
    expect(attempts).toBe(3)
  })

  it('should throw after max retries', async () => {
    const alwaysFail = () => Promise.reject(new Error('permanent failure'))
    const { preload } = createLazyComponent(alwaysFail, { retryAttempts: 2, retryDelay: 10 })

    await expect(preload()).rejects.toThrow('permanent failure')
  })
})

describe('ComponentPreloader', () => {
  let preloader: ComponentPreloader

  beforeEach(() => {
    preloader = new ComponentPreloader()
  })

  describe('register', () => {
    it('should register a preload strategy', () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      preloader.register('test', loader, {
        name: 'test',
        priority: 'medium',
        delay: 0,
      })

      expect(preloader.getStats().registered).toBe(1)
    })

    it('should register strategy but skip timer if condition returns false', () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      preloader.register('test', loader, {
        name: 'test',
        priority: 'medium',
        delay: 0,
        condition: () => false,
      })

      expect(preloader.getStats().registered).toBe(1)
      expect(preloader.isPreloaded('test')).toBe(false)
    })
  })

  describe('preload', () => {
    it('should preload a component', async () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      await preloader.preload('test', loader)
      expect(loader).toHaveBeenCalled()
      expect(preloader.isPreloaded('test')).toBe(true)
    })

    it('should not preload same component twice', async () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      await preloader.preload('test', loader)
      await preloader.preload('test', loader)
      expect(loader).toHaveBeenCalledTimes(1)
    })

    it('should handle preload failure gracefully', async () => {
      const loader = vi.fn().mockRejectedValue(new Error('fail'))
      await preloader.preload('test', loader)

      expect(preloader.isPreloaded('test')).toBe(false)
    })
  })

  describe('cancel', () => {
    it('should cancel a registered preload', () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      preloader.register('test', loader, {
        name: 'test',
        priority: 'low',
        delay: 10000,
      })

      preloader.cancel('test')
      expect(preloader.isPreloaded('test')).toBe(false)
    })
  })

  describe('cancelAll', () => {
    it('should cancel all preloads', () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      preloader.register('a', loader, { name: 'a', priority: 'low', delay: 10000 })
      preloader.register('b', loader, { name: 'b', priority: 'low', delay: 10000 })

      preloader.cancelAll()
      expect(preloader.isPreloaded('a')).toBe(false)
      expect(preloader.isPreloaded('b')).toBe(false)
    })
  })

  describe('getStats', () => {
    it('should return registered and preloaded counts', async () => {
      const loader = vi.fn().mockResolvedValue(undefined)
      preloader.register('test', loader, { name: 'test', priority: 'medium', delay: 0 })

      await new Promise((r) => setTimeout(r, 50))

      const stats = preloader.getStats()
      expect(stats.registered).toBe(1)
    })
  })
})

describe('PRELOAD_STRATEGIES', () => {
  it('should define all expected strategies', () => {
    expect(PRELOAD_STRATEGIES.APP_START).toBeDefined()
    expect(PRELOAD_STRATEGIES.IDLE).toBeDefined()
    expect(PRELOAD_STRATEGIES.HOVER).toBeDefined()
    expect(PRELOAD_STRATEGIES.VIEWPORT).toBeDefined()
    expect(PRELOAD_STRATEGIES.ROUTE_CHANGE).toBeDefined()
  })

  it('should have correct priority levels', () => {
    expect(PRELOAD_STRATEGIES.APP_START.priority).toBe('critical')
    expect(PRELOAD_STRATEGIES.IDLE.priority).toBe('low')
    expect(PRELOAD_STRATEGIES.HOVER.priority).toBe('high')
    expect(PRELOAD_STRATEGIES.VIEWPORT.priority).toBe('medium')
    expect(PRELOAD_STRATEGIES.ROUTE_CHANGE.priority).toBe('high')
  })
})

describe('usePreloadOnHover', () => {
  it('should return onMouseEnter and onFocus handlers', () => {
    const loader = vi.fn().mockResolvedValue(undefined)
    const handlers = usePreloadOnHover(loader)

    expect(handlers.onMouseEnter).toBeInstanceOf(Function)
    expect(handlers.onFocus).toBeInstanceOf(Function)
  })

  it('should call loader on hover', () => {
    const loader = vi.fn().mockResolvedValue(undefined)
    const handlers = usePreloadOnHover(loader)

    handlers.onMouseEnter()
    expect(loader).toHaveBeenCalled()
  })

  it('should call loader on focus', () => {
    const loader = vi.fn().mockResolvedValue(undefined)
    const handlers = usePreloadOnHover(loader)

    handlers.onFocus()
    expect(loader).toHaveBeenCalled()
  })

  it('should not call loader twice', () => {
    const loader = vi.fn().mockResolvedValue(undefined)
    const handlers = usePreloadOnHover(loader)

    handlers.onMouseEnter()
    handlers.onFocus()
    expect(loader).toHaveBeenCalledTimes(1)
  })
})

describe('createChunkLoader', () => {
  it('should return a function that loads a chunk', async () => {
    const mockImport = vi.fn().mockResolvedValue({ default: {} })
    const loader = createChunkLoader('test-chunk', mockImport)

    await loader()
    expect(mockImport).toHaveBeenCalled()
  })
})

describe('schedulePreload', () => {
  it('should return a cancel function', () => {
    const loader = vi.fn().mockResolvedValue(undefined)
    const cancel = schedulePreload(loader, 10000)
    expect(cancel).toBeInstanceOf(Function)
    cancel()
  })
})

describe('globalPreloader', () => {
  it('should be a ComponentPreloader instance', () => {
    expect(globalPreloader).toBeInstanceOf(ComponentPreloader)
  })
})
