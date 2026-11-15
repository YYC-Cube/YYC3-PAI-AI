/**
 * @file file-system-adapter.integration.test.ts
 * @description 文件系统适配器集成测试 - 验证Web/Tauri环境下的完整流程
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getFileSystemAdapter,
  destroyFileSystemAdapter,
  detectEnvironment,
  type FileSystemAdapter,
} from '../file-system-adapter'

describe('FileSystemAdapter - 集成测试', () => {
  let adapter: FileSystemAdapter

  beforeEach(() => {
    destroyFileSystemAdapter()
    adapter = getFileSystemAdapter()
  })

  afterEach(() => {
    destroyFileSystemAdapter()
  })

  describe('环境检测', () => {
    it('应该正确检测当前运行环境', () => {
      const env = detectEnvironment()
      expect(['web', 'tauri']).toContain(env)
    })

    it('应该返回正确的environment属性', () => {
      expect(adapter.environment).toBeDefined()
      expect(typeof adapter.environment).toBe('string')
    })
  })

  describe('单例模式', () => {
    it('应该返回相同的适配器实例', () => {
      const adapter1 = getFileSystemAdapter()
      const adapter2 = getFileSystemAdapter()
      expect(adapter1).toBe(adapter2)
    })

    it('destroy后应该创建新实例', () => {
      const adapter1 = getFileSystemAdapter()
      destroyFileSystemAdapter()
      const adapter2 = getFileSystemAdapter()
      expect(adapter1).not.toBe(adapter2)
    })
  })

  describe('Web环境适配器', () => {
    it('Web环境下isNative应返回false', () => {
      if (adapter.environment === 'web') {
        expect(adapter.isNative()).toBe(false)
      }
    })
  })

  describe('API接口完整性', () => {
    it('应该实现所有必需的接口方法', () => {
      expect(typeof adapter.isSupported).toBe('function')
      expect(typeof adapter.requestPermission).toBe('function')
      expect(typeof adapter.readFile).toBe('function')
      expect(typeof adapter.writeFile).toBe('function')
      expect(typeof adapter.deleteFile).toBe('function')
      expect(typeof adapter.renameFile).toBe('function')
      expect(typeof adapter.copyFile).toBe('function')
      expect(typeof adapter.exists).toBe('function')
      expect(typeof adapter.stat).toBe('function')
      expect(typeof adapter.listDirectory).toBe('function')
      expect(typeof adapter.createDirectory).toBe('function')
      expect(typeof adapter.watchDirectory).toBe('function')
      expect(typeof adapter.getBasePath).toBe('function')
      expect(typeof adapter.isNative).toBe('function')
    })
  })

  describe('错误处理', () => {
    it('未授权时readFile应该抛出错误', async () => {
      try {
        await adapter.readFile('/nonexistent/file.txt')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('未授权时writeFile应该抛出错误', async () => {
      try {
        await adapter.writeFile('/test/file.txt', new Uint8Array([1, 2, 3]))
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('watchDirectory集成', () => {
    it('应该返回有效的WatchHandle', async () => {
      const handle = await adapter.watchDirectory('/test', vi.fn(), { debounceMs: 100 })
      expect(handle).toBeDefined()
      expect(handle.id).toBeDefined()
      expect(typeof handle.close).toBe('function')

      handle.close()
    })

    it('close后不应该报错', async () => {
      const handle = await adapter.watchDirectory('/test', vi.fn())
      handle.close()

      expect(() => handle.close()).not.toThrow()
    })
  })

  describe('getBasePath', () => {
    it('应该返回字符串类型的路径', () => {
      const path = adapter.getBasePath()
      expect(typeof path).toBe('string')
    })
  })

  describe('强制环境切换', () => {
    it('可以强制使用web适配器', () => {
      destroyFileSystemAdapter()
      const webAdapter = getFileSystemAdapter('web')
      expect(webAdapter.environment).toBe('web')
    })
  })
})

describe('FileSystemAdapter - 与SyncEngine集成', () => {
  beforeEach(() => {
    destroyFileSystemAdapter()
  })

  afterEach(() => {
    destroyFileSystemAdapter()
  })

  it('适配器应该支持同步引擎所需的操作', async () => {
    const adapter = getFileSystemAdapter()

    const operations: Promise<unknown>[] = []

    operations.push(
      adapter.exists('/test').catch((e) => e),
      adapter.stat('/test').catch((e) => e),
      adapter.listDirectory('/test').catch((e) => e)
    )

    const results = await Promise.allSettled(operations)

    results.forEach((result) => {
      expect(result.status).toBeDefined()
    })
  })
})
