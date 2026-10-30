/**
 * @file setup.ts
 * @description 测试环境设置文件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { enableMapSet } from 'immer'
import React from 'react'
import { vi } from 'vitest'

enableMapSet()

vi.mock('y-indexeddb', () => {
  return {
    IndexeddbPersistence: vi.fn().mockImplementation(() => ({
      on: vi.fn((event: string, callback: () => void) => {
        if (event === 'synced' || event === 'load') {
          setTimeout(callback, 0)
        }
      }),
      off: vi.fn(),
      destroy: vi.fn(),
    })),
  }
})

vi.mock('y-websocket', () => {
  return {
    WebsocketProvider: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    })),
  }
})

vi.mock('y-webrtc', () => {
  return {
    WebrtcProvider: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    })),
  }
})

vi.mock('@tauri-apps/plugin-fs', () => {
  return {
    readTextFile: vi.fn().mockResolvedValue(''),
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeFile: vi.fn().mockResolvedValue(undefined),
    removeFile: vi.fn().mockResolvedValue(undefined),
    renameFile: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    stat: vi.fn().mockResolvedValue({
      name: 'test',
      path: '/test',
      isFile: true,
      isDirectory: false,
      size: 1024,
      mtime: Date.now(),
      permissions: { mode: 0o644, readonly: false },
    }),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn().mockResolvedValue(undefined),
  }
})

// ===== Mock heavy ESM deps used by Chat/AiMessageRender =====
vi.mock('react-markdown', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 测试桩：react-markdown 组件 props 无需精确
  default: ({ children }: any) => children || null,
}))
vi.mock('remark-gfm', () => ({
  default: () => { },
}))

vi.mock('@tauri-apps/plugin-shell', () => {
  const MockCommand = vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      code: 0,
      stdout: '',
      stderr: '',
    }),
  }))
  return { Command: MockCommand }
})

const indexedDB = {
  open: vi.fn(() => {
    const request = {
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            put: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
          })),
        })),
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(false),
        },
      },
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      onupgradeneeded: null as (() => void) | null,
    }
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess()
      }
    }, 0)
    return request
  }),
  deleteDatabase: vi.fn(),
}

Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDB,
  writable: true,
})

Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: {
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
    bound: vi.fn(),
    only: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ResizeObserver 桩必须可 new（tanstack/virtual 以 class 方式实例化）
// sonner 桩：toast() 记录调用；<Toaster/> 渲染已推送消息（供组件断言）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sonnerLog: string[] = (globalThis as any).__sonnerLog = []
vi.mock('sonner', () => ({
  toast: (msg: string, _opts?: unknown) => { sonnerLog.push(msg) },
  Toaster: () => React.createElement('div', { 'data-testid': 'sonner-toaster' },
    ...sonnerLog.slice(-5).map((m, i) => React.createElement('div', { key: i }, m))),
}))

class ResizeObserverStub {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private cb: (entries: Array<{ target: Element; contentRect: DOMRectReadOnly }>) => void) { }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  observe(target: Element) {
    const rect = { width: (target as any).clientWidth || 400, height: (target as any).clientHeight || 400, top: 0, left: 0, right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}) } as DOMRectReadOnly
    // 异步回报一次，模拟真实量测时序
    setTimeout(() => this.cb([{ target, contentRect: rect }]), 0)
  }
  unobserve() { }
  disconnect() { }
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverStub,
})

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

Object.defineProperty(globalThis.navigator, 'gpu', {
  writable: true,
  value: {
    requestAdapter: vi.fn().mockResolvedValue(null),
  },
})

const mockCreateElement = document.createElement.bind(document)
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  const element = mockCreateElement.call(document, tagName)
  if (tagName === 'canvas') {
    Object.defineProperty(element, 'getContext', {
      value: vi.fn().mockReturnValue(null),
    })
  }
  return element
})
