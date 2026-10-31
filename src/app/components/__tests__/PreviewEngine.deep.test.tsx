/**
 * @file PreviewEngine.deep.test.tsx
 * @description 预览引擎专项 — 首载/版本变更 diff 分析/HOT PATCH 阈值/展开切换/浏览器外壳
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { PreviewEngine } from '../PreviewEngine'
import type { GeneratedFile } from '../CodeGenPanel'

const file = (over: Partial<GeneratedFile> = {}): GeneratedFile => ({
  id: 'f1',
  fileName: 'App.tsx',
  content: 'export function App() {\n  return <div>Hello</div>\n}\n',
  language: 'tsx',
  type: 'component',
  linesOfCode: 3,
  ...over,
})

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve() })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PreviewEngine 基础渲染', () => {
  it('空文件列表返回 null', () => {
    const { container } = render(<PreviewEngine files={[]} version={1} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('渲染浏览器外壳：地址栏版本号 / LIVE / FULL RELOAD 初始态', async () => {
    const { container } = render(<PreviewEngine files={[file()]} version={3} />)
    await flush()
    expect(container.textContent).toContain('localhost:5173 — v3')
    expect(container.textContent).toContain('LIVE')
    expect(container.textContent).toContain('FULL RELOAD')
    expect(container.querySelector('iframe')).toBeTruthy()
    // 首载 srcDoc 注入完整 HTML
    const iframe = container.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.getAttribute('srcdoc')!.length).toBeGreaterThan(50)
  })
})

describe('PreviewEngine 增量更新（diff 阈值）', () => {
  it('小改动（<30%）→ HOT PATCH 模式并向 iframe postMessage 热更新', async () => {
    const postMessage = vi.fn()
    // iframe key 随模式/版本变化会换新元素：在原型上挂 contentWindow getter 覆盖任意实例
    const cwSpy = vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue({ postMessage } as never)
    try {
      const { container, rerender } = render(<PreviewEngine files={[file()]} version={1} />)
      await flush()
      rerender(<PreviewEngine files={[file({ content: 'export function App() {\n  return <div>World</div>\n}\n' })]} version={2} />)
      await flush()
      expect(container.textContent).toContain('HOT PATCH')
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'hot-update', version: 2, components: [{ name: 'App' }] }),
        '*',
      )
      expect(container.textContent).toContain('差异分析')
      expect(container.textContent).toMatch(/\+\d+/)
    } finally {
      cwSpy.mockRestore()
    }
  })

  it('大改动（新增文件行数占优）→ FULL RELOAD，不发 hot-update', async () => {
    const postMessage = vi.fn()
    const cwSpy = vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue({ postMessage } as never)
    try {
      const big = Array.from({ length: 8 }, (_, i) => file({
        id: `f${i}`, fileName: `Mod${i}.tsx`,
        content: `export function Mod${i}() {\n  return <div>block ${i} line a</div>\n}\n// tail ${i}\n`,
      }))
      const { container, rerender } = render(<PreviewEngine files={[file()]} version={1} />)
      await flush()
      rerender(<PreviewEngine files={[file(), ...big]} version={2} />)
      await flush()
      expect(container.textContent).toContain('FULL RELOAD')
      expect(postMessage).not.toHaveBeenCalled()
    } finally {
      cwSpy.mockRestore()
    }
  })
})

describe('PreviewEngine 交互', () => {
  it('展开切换：宽度/高度/按钮图标与 tooltip 文案变化', async () => {
    const { container } = render(<PreviewEngine files={[file()]} version={1} />)
    await flush()
    const expandBtn = container.querySelector('button') as HTMLButtonElement
    fireEvent.click(expandBtn)
    expect(container.textContent).toContain('收起')
    const frame = container.querySelector('iframe') as HTMLIFrameElement
    expect(frame.style.height).toBe('600px')
    fireEvent.click(container.querySelector('button') as HTMLButtonElement)
    expect((container.querySelector('iframe') as HTMLIFrameElement).style.height).toBe('400px')
  })

  it('双击还原回调（onDoubleClickRestore）', async () => {
    const onDouble = vi.fn()
    const { container } = render(<PreviewEngine files={[file()]} version={1} onDoubleClickRestore={onDouble} />)
    await flush()
    fireEvent.dblClick(container.firstElementChild as HTMLElement)
    expect(onDouble).toHaveBeenCalledTimes(1)
  })
})
