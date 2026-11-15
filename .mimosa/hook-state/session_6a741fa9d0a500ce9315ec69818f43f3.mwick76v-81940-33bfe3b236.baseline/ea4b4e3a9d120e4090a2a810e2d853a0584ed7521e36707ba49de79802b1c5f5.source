/**
 * @file file-system-watcher.test.ts
 * @description 文件系统监听服务单元测试（测试公开API）
 * @created 2026-04-08
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFileSystemWatcher, destroyFileSystemWatcher } from '../file-system-watcher'

describe('FileSystemWatcher', () => {
  beforeEach(() => {
    destroyFileSystemWatcher()
  })

  afterEach(() => {
    destroyFileSystemWatcher()
  })

  describe('初始化', () => {
    it('应该正确创建watcher实例', () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
        onChange: vi.fn(),
        onError: vi.fn(),
      })
      expect(watcher).toBeDefined()
      expect(watcher.isWatching()).toBe(false)
      expect(watcher.getWatchedPaths()).toEqual([])
      expect(watcher.getPendingEventsCount()).toBe(0)
    })

    it('应该使用默认选项创建', () => {
      const watcher = getFileSystemWatcher()
      expect(watcher).toBeDefined()
      watcher.destroy()
    })

    it('应该支持单例模式', () => {
      const watcher1 = getFileSystemWatcher()
      const watcher2 = getFileSystemWatcher()
      expect(watcher1).toBe(watcher2)
      watcher1.destroy()
    })
  })

  describe('路径监听', () => {
    it('应该能够添加监听路径并自动开始监听', async () => {
      const changeListener = vi.fn()
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
        onChange: changeListener,
      })

      await watcher.watchPath('/test/path')
      expect(watcher.isWatching()).toBe(true)
      expect(watcher.getWatchedPaths()).toContain('/test/path')
    })

    it('不应该重复添加相同路径', async () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
      })

      await watcher.watchPath('/duplicate/path')
      await watcher.watchPath('/duplicate/path')
      const paths = watcher.getWatchedPaths()
      const count = paths.filter((p: string) => p === '/duplicate/path').length
      expect(count).toBe(1)
    })

    it('应该能够获取所有监听路径', async () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
      })

      await watcher.watchPath('/path1')
      await watcher.watchPath('/path2')
      await watcher.watchPath('/path3')
      const paths = watcher.getWatchedPaths()
      expect(paths).toHaveLength(3)
      expect(paths).toEqual(expect.arrayContaining(['/path1', '/path2', '/path3']))
    })
  })

  describe('事件处理', () => {
    it('应该在创建时注册变更监听器', () => {
      const changeListener = vi.fn()
      getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
        onChange: changeListener,
      })
      // 监听器已注册但未触发
      expect(changeListener).not.toHaveBeenCalled()
    })

    it('应该在创建时注册错误监听器', () => {
      const errorListener = vi.fn()
      getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
        onError: errorListener,
      })
      expect(errorListener).not.toHaveBeenCalled()
    })
  })

  describe('状态管理', () => {
    it('初始状态应该是未监听', () => {
      const watcher = getFileSystemWatcher()
      expect(watcher.isWatching()).toBe(false)
      expect(watcher.getWatchedPaths()).toHaveLength(0)
      expect(watcher.getPendingEventsCount()).toBe(0)
    })

    it('forceFlush应该返回空数组（无事件时）', () => {
      const watcher = getFileSystemWatcher()
      const events = watcher.forceFlush()
      expect(events).toEqual([])
      expect(watcher.getPendingEventsCount()).toBe(0)
    })
  })

  describe('销毁', () => {
    it('应该能够销毁实例', () => {
      const watcher = getFileSystemWatcher()
      watcher.destroy()
      // 销毁后不应该报错
      expect(() => watcher.destroy()).not.toThrow()
    })

    it('销毁后应该停止监听', async () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
      })

      await watcher.watchPath('/destroy/test')
      expect(watcher.isWatching()).toBe(true)

      watcher.destroy()
      expect(watcher.isWatching()).toBe(false)
    })
  })

  describe('配置选项', () => {
    it('应该支持自定义防抖时间', () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 500,
        ignorePatterns: [],
        recursive: false,
      })
      expect(watcher).toBeDefined()
      watcher.destroy()
    })

    it('应该支持忽略规则配置', () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [/node_modules/, /\.git/],
        recursive: true,
      })
      expect(watcher).toBeDefined()
      watcher.destroy()
    })

    it('应该支持非递归模式', () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: false,
      })
      expect(watcher).toBeDefined()
      watcher.destroy()
    })
  })

  describe('边界情况', () => {
    it('空路径不应该导致错误', async () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
      })

      await watcher.watchPath('')
      expect(watcher).toBeDefined()
    })

    it('特殊字符路径应该正常处理', async () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
      })

      const specialPath = '/path/with spaces/and-special.chars'
      await watcher.watchPath(specialPath)
      expect(watcher.getWatchedPaths()).toContain(specialPath)
    })

    it('大量路径添加应该稳定', async () => {
      const watcher = getFileSystemWatcher({
        debounceMs: 0,
        ignorePatterns: [],
        recursive: true,
      })

      const promises = Array.from({ length: 100 }, (_, i) =>
        watcher.watchPath(`/bulk/path/${i}`)
      )
      await Promise.all(promises)
      expect(watcher.getWatchedPaths()).toHaveLength(100)
    })
  })
})
