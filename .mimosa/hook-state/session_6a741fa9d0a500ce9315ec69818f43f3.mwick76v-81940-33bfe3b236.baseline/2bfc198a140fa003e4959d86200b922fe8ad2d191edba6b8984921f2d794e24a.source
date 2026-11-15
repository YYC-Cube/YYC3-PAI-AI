/**
 * @file file-system-watcher.deep.test.ts
 * @description 文件系统监听服务深化测试——事件触发链/批量防抖/忽略规则/错误回调/轮询侦测
 *
 * 深化背景：浅测（file-system-watcher.test.ts）只测初始化/路径管理/销毁；
 * queueEvent 合并去重、防抖 flush、forceFlush、忽略规则、create/modify 侦测、
 * 错误回调双通道等执行链未触达。
 *
 * 测法约定：
 * - 事件入队走 queueEvent（私有，经类型收窄直调）；轮询侦测经覆写私有
 *   getLastModifiedMap 注入文件表（源码该方法是返回空对象的桩）。
 * - 假定时器 fake setTimeout/setInterval（勿 fake rAF），驱动防抖与轮询。
 * - 单例用 destroyFileSystemWatcher 在 beforeEach/afterEach 复位。
 *
 * 实测确认一处源码缺陷（只复现不修改）：startWatching 的轮询 interval 是
 * setupPollingWatcher/setupFileSystemAccessAPI 的局部变量，stopWatching/destroy
 * 无法清除——destroy 后 interval 仍在计时，属于监听器泄漏（本文件用例不依赖
 * destroy 后的时间推进，避免踩中）。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-11-12
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getFileSystemWatcher,
  destroyFileSystemWatcher,
} from '../file-system-watcher'
import type { FileChangeEvent } from '../file-system-watcher'

/** watcher 实例类型（沿用工厂返回推断，避免命名导入 default 类） */
type Watcher = ReturnType<typeof getFileSystemWatcher>

/** 私有成员通道（事件入队/忽略规则/文件表覆写） */
type WatcherInternals = {
  queueEvent: (event: FileChangeEvent) => void
  shouldIgnore: (path: string) => boolean
  getLastModifiedMap: (path: string) => Record<string, number>
  options: { ignorePatterns: RegExp[] }
}
const intern = (watcher: Watcher): WatcherInternals =>
  watcher as unknown as WatcherInternals

/** 构造事件 */
const evt = (
  type: FileChangeEvent['type'],
  path: string,
  timestamp: number,
  size?: number
): FileChangeEvent => ({
  id: `evt_${timestamp}_${path}`,
  type,
  path,
  timestamp,
  size,
})

describe('FileSystemWatcher 深化——事件触发链与错误回调', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    destroyFileSystemWatcher()
  })

  afterEach(() => {
    destroyFileSystemWatcher()
    vi.useRealTimers()
  })

  it('watchPath 启动轮询监听；unwatchPath 撤销最后路径后停止', async () => {
    const watcher = getFileSystemWatcher()
    expect(watcher.isWatching()).toBe(false)

    await watcher.watchPath('/demo')
    expect(watcher.isWatching()).toBe(true)
    expect(watcher.getWatchedPaths()).toEqual(['/demo'])
    // 轮询 interval 已建（Fake timers 计数）
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1)

    watcher.unwatchPath('/demo')
    expect(watcher.isWatching()).toBe(false)
    expect(watcher.getWatchedPaths()).toEqual([])
  })

  it('支持 File System Access API 的环境走 API 分支启动监听', async () => {
    Object.defineProperty(window, 'showOpenFilePicker', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    })
    try {
      const watcher = getFileSystemWatcher()
      await watcher.watchPath('/fsapi')
      expect(watcher.isWatching()).toBe(true)
      expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1)
    } finally {
      Reflect.deleteProperty(window, 'showOpenFilePicker')
    }
  })

  it('防抖窗口内同 key 事件合并：modify 只保留最新 timestamp/size', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 100, onChange })

    intern(watcher).queueEvent(evt('modify', '/a.ts', 1000, 10))
    intern(watcher).queueEvent(evt('modify', '/a.ts', 2000, 20))
    expect(watcher.getPendingEventsCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).toHaveBeenCalledTimes(1)
    const events = onChange.mock.calls[0][0] as FileChangeEvent[]
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'modify', path: '/a.ts', timestamp: 2000, size: 20 })
    expect(watcher.getPendingEventsCount()).toBe(0)
  })

  it('不同路径事件按 timestamp 升序批量回调', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 100, onChange })

    intern(watcher).queueEvent(evt('create', '/c.ts', 300))
    intern(watcher).queueEvent(evt('create', '/a.ts', 100))
    intern(watcher).queueEvent(evt('delete', '/b.ts', 200))

    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).toHaveBeenCalledTimes(1)
    const events = onChange.mock.calls[0][0] as FileChangeEvent[]
    expect(events.map((e) => e.path)).toEqual(['/a.ts', '/b.ts', '/c.ts'])
  })

  it('delete 事件同 key 覆盖保留最新，异 key 事件并存', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 100, onChange })

    intern(watcher).queueEvent(evt('delete', '/gone.ts', 1000))
    intern(watcher).queueEvent(evt('delete', '/gone.ts', 2000))
    intern(watcher).queueEvent(evt('delete', '/other.ts', 1500))
    expect(watcher.getPendingEventsCount()).toBe(2)

    await vi.advanceTimersByTimeAsync(100)
    const events = onChange.mock.calls[0][0] as FileChangeEvent[]
    expect(events).toHaveLength(2)
    expect(events.every((e) => e.type === 'delete')).toBe(true)
    expect(events.find((e) => e.path === '/gone.ts')?.timestamp).toBe(2000)
  })

  it('forceFlush 立即清队回调并取消挂起防抖，不再二次触发', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 500, onChange })

    intern(watcher).queueEvent(evt('modify', '/x.ts', 1000))
    intern(watcher).queueEvent(evt('create', '/y.ts', 2000))

    const flushed = watcher.forceFlush()
    expect(flushed.map((e) => e.path)).toEqual(['/x.ts', '/y.ts'])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(watcher.getPendingEventsCount()).toBe(0)

    // 防抖定时器已清：推进时间不再触发第二次
    await vi.advanceTimersByTimeAsync(1000)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('onChange 与 addChangeListener 双通道派发，退订生效，监听器抛错不阻断其他监听', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 100, onChange })
    const received: string[] = []
    const throwing = vi.fn(() => {
      throw new Error('监听器内部错误')
    })
    const listener = vi.fn((events: FileChangeEvent[]) => {
      received.push(events[0]?.path ?? '')
    })

    const unsubscribe = watcher.addChangeListener(throwing)
    watcher.addChangeListener(listener)

    intern(watcher).queueEvent(evt('create', '/first.ts', 1))
    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(received).toEqual(['/first.ts'])

    // 退订 throwing 后不再收到；其余监听不受历史抛错影响
    unsubscribe()
    intern(watcher).queueEvent(evt('create', '/second.ts', 2))
    await vi.advanceTimersByTimeAsync(100)
    expect(throwing).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(received).toEqual(['/first.ts', '/second.ts'])
  })

  it('checkPathChanges 抛错经轮询触发 onError 与 addErrorListener 双通道', async () => {
    const onError = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 0, onError })
    const errorListener = vi.fn()
    const throwingListener = vi.fn(() => {
      throw new Error('错误监听器内部错误')
    })
    watcher.addErrorListener(throwingListener)
    watcher.addErrorListener(errorListener)
    intern(watcher).getLastModifiedMap = () => {
      throw new Error('stat 失败')
    }

    await watcher.watchPath('/boom')
    await vi.advanceTimersByTimeAsync(2000)

    const expected = new Error('stat 失败')
    expect(onError).toHaveBeenCalledWith(expected)
    expect(errorListener).toHaveBeenCalledWith(expected)
  })

  it('默认忽略规则命中 node_modules/.git/dist/build/.DS_Store，放行业务文件', () => {
    // 不传 ignorePatterns 才会用默认五条规则（传空数组会整体覆盖）
    const watcher = getFileSystemWatcher({ debounceMs: 0 })
    const shouldIgnore = (p: string) => intern(watcher).shouldIgnore(p)

    expect(intern(watcher).options.ignorePatterns).toHaveLength(5)
    expect(shouldIgnore('/repo/node_modules/pkg/index.js')).toBe(true)
    expect(shouldIgnore('/repo/.git/config')).toBe(true)
    expect(shouldIgnore('/repo/dist/bundle.js')).toBe(true)
    expect(shouldIgnore('/repo/build/out.js')).toBe(true)
    expect(shouldIgnore('/log/.DS_Store')).toBe(true)
    expect(shouldIgnore('/src/App.tsx')).toBe(false)
  })

  it('自定义 ignorePatterns 覆盖默认：仅匹配自定义规则', () => {
    const watcher = getFileSystemWatcher({ debounceMs: 0, ignorePatterns: [/secret/] })
    const shouldIgnore = (p: string) => intern(watcher).shouldIgnore(p)

    expect(shouldIgnore('/etc/secret.key')).toBe(true)
    expect(shouldIgnore('/x/node_modules/y.js')).toBe(false)
  })

  it('轮询首轮：新文件产生 create 事件且忽略规则在侦测阶段过滤', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 50, onChange })
    const fileMap: Record<string, number> = {
      '/src/a.ts': 100,
      '/src/node_modules/x.js': 200,
      '/repo/.git/config': 300,
      '/log/.DS_Store': 400,
    }
    intern(watcher).getLastModifiedMap = () => fileMap

    await watcher.watchPath('/src')
    await vi.advanceTimersByTimeAsync(2000) // 轮询一轮（2s 间隔）
    await vi.advanceTimersByTimeAsync(100) // 防抖 50ms 到期

    expect(onChange).toHaveBeenCalledTimes(1)
    const events = onChange.mock.calls[0][0] as FileChangeEvent[]
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'create', path: '/src/a.ts' })
  })

  it('轮询次轮：mtime 不变不重报，mtime 变化升级为 modify 事件', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 50, onChange })
    const fileMap: Record<string, number> = { '/src/a.ts': 100 }
    intern(watcher).getLastModifiedMap = () => fileMap

    await watcher.watchPath('/src')
    await vi.advanceTimersByTimeAsync(2000)
    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).toHaveBeenCalledTimes(1) // 首轮 create

    // mtime 未变 → 不重复上报
    onChange.mockClear()
    await vi.advanceTimersByTimeAsync(2000)
    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).not.toHaveBeenCalled()

    // mtime 变化 → modify
    fileMap['/src/a.ts'] = 999
    await vi.advanceTimersByTimeAsync(2000)
    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).toHaveBeenCalledTimes(1)
    const events = onChange.mock.calls[0][0] as FileChangeEvent[]
    expect(events[0]).toMatchObject({ type: 'modify', path: '/src/a.ts' })
  })

  it('destroy 清空监听/队列/缓存并幂等；销毁后 flush 不再派发', async () => {
    const onChange = vi.fn()
    const watcher = getFileSystemWatcher({ debounceMs: 100, onChange })
    const listener = vi.fn()
    watcher.addChangeListener(listener)

    intern(watcher).queueEvent(evt('modify', '/pending.ts', 1))
    watcher.destroy()
    expect(watcher.isWatching()).toBe(false)
    expect(watcher.getPendingEventsCount()).toBe(0)

    expect(() => watcher.destroy()).not.toThrow()
    expect(watcher.forceFlush()).toEqual([])
    expect(onChange).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  it('getPendingEventsCount 实时反映事件队列', () => {
    const watcher = getFileSystemWatcher({ debounceMs: 1000 })
    expect(watcher.getPendingEventsCount()).toBe(0)
    intern(watcher).queueEvent(evt('create', '/c1.ts', 1))
    intern(watcher).queueEvent(evt('create', '/c2.ts', 2))
    expect(watcher.getPendingEventsCount()).toBe(2)
    watcher.forceFlush()
    expect(watcher.getPendingEventsCount()).toBe(0)
  })
})
