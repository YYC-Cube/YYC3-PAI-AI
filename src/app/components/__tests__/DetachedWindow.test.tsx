/**
 * @file DetachedWindow.test.tsx
 * @description 浮动窗口专项 — 真 panel-dnd-store 集成（拖拽/缩放/最大化往返/最小化/还原/聚焦/回贴）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { DetachedWindowComponent } from '../DetachedWindow'
import { panelDnDActions } from '../../store/panel-dnd-store'
import type { DetachedWindow } from '../../store/panel-dnd-store'

const makeWin = (over: Partial<DetachedWindow> = {}): DetachedWindow => ({
  id: 'w-test',
  contentType: 'ai-chat',
  sourceSlot: 'left',
  position: { x: 100, y: 100 },
  size: { width: 500, height: 400 },
  zIndex: 10,
  isMinimized: false,
  ...over,
})

beforeEach(() => {
  vi.restoreAllMocks()
})

const spies = () => ({
  move: vi.spyOn(panelDnDActions, 'moveWindow'),
  resize: vi.spyOn(panelDnDActions, 'resizeWindow'),
  z: vi.spyOn(panelDnDActions, 'setWindowZIndex'),
  minimize: vi.spyOn(panelDnDActions, 'minimizeWindow'),
  close: vi.spyOn(panelDnDActions, 'closeWindow'),
  setSlot: vi.spyOn(panelDnDActions, 'setSlotContent'),
  restore: vi.spyOn(panelDnDActions, 'restoreWindow'),
})

describe('DetachedWindowComponent 普通窗口', () => {
  it('渲染标题栏：标题键 + 槽位徽标 + 控制按钮', () => {
    const { container } = render(
      <DetachedWindowComponent window={makeWin()} renderContent={() => <div>内容</div>} />,
    )
    // fallback i18n 返回 labelKey 本身
    expect(container.textContent).toContain('aiChat')
    expect(container.textContent).toContain('[LEFT]')
    expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(4)
    expect(container.textContent).toContain('内容')
  })

  it('聚焦：mousedown 窗体 → setWindowZIndex 置顶', () => {
    const s = spies()
    const { container } = render(
      <DetachedWindowComponent window={makeWin()} renderContent={() => null} />,
    )
    fireEvent.mouseDown(container.firstElementChild as HTMLElement)
    expect(s.z).toHaveBeenCalledWith('w-test', expect.any(Number))
  })

  it('标题栏拖拽：mousedown → mousemove 位移 → moveWindow（clamp ≥0）→ mouseup 解绑', () => {
    const s = spies()
    const { container } = render(
      <DetachedWindowComponent window={makeWin()} renderContent={() => null} />,
    )
    const header = container.querySelector('.cursor-move') as HTMLElement
    fireEvent.mouseDown(header, { clientX: 200, clientY: 200 })
    fireEvent.mouseMove(document, { clientX: 250, clientY: 230 })
    expect(s.move).toHaveBeenCalledWith('w-test', { x: 150, y: 130 })
    // 负位移被钳制到 0
    fireEvent.mouseMove(document, { clientX: 0, clientY: 0 })
    expect(s.move).toHaveBeenLastCalledWith('w-test', { x: 0, y: 0 })
    fireEvent.mouseUp(document)
    const calls = s.move.mock.calls.length
    fireEvent.mouseMove(document, { clientX: 999, clientY: 999 })
    expect(s.move.mock.calls.length).toBe(calls) // 解绑后不再响应
  })

  it('角落缩放：最小尺寸钳制 320×200', () => {
    const s = spies()
    const { container } = render(
      <DetachedWindowComponent window={makeWin()} renderContent={() => null} />,
    )
    const handle = container.querySelector('.cursor-nwse-resize') as HTMLElement
    fireEvent.mouseDown(handle, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(document, { clientX: -500, clientY: -500 })
    expect(s.resize).toHaveBeenCalledWith('w-test', { width: 320, height: 200 })
    fireEvent.mouseMove(document, { clientX: 150, clientY: 120 })
    expect(s.resize).toHaveBeenLastCalledWith('w-test', { width: 550, height: 420 })
    fireEvent.mouseUp(document)
  })

  it('最大化往返：双击标题栏 → 铺满；再双击 → 恢复原 bounds', () => {
    const s = spies()
    const { container } = render(
      <DetachedWindowComponent window={makeWin()} renderContent={() => null} />,
    )
    const header = container.querySelector('.cursor-move') as HTMLElement
    fireEvent.doubleClick(header)
    expect(s.move).toHaveBeenCalledWith('w-test', { x: 0, y: 0 })
    expect(s.resize).toHaveBeenCalledWith('w-test', { width: window.innerWidth, height: window.innerHeight })
    // 再双击还原（组件内部 isMaximized 翻转）
    fireEvent.doubleClick(header)
    expect(s.move).toHaveBeenLastCalledWith('w-test', { x: 100, y: 100 })
    expect(s.resize).toHaveBeenLastCalledWith('w-test', { width: 500, height: 400 })
  })

  it('最小化/回贴按钮布线', () => {
    const s = spies()
    const { container } = render(
      <DetachedWindowComponent window={makeWin()} renderContent={() => null} />,
    )
    const btns = container.querySelectorAll('button')
    // 回贴（RotateCcw 图标第一个）与最小化（Minus）
    fireEvent.click(btns[0])
    expect(s.setSlot).toHaveBeenCalled()
    expect(s.close).toHaveBeenCalledWith('w-test')
    fireEvent.click(btns[1])
    expect(s.minimize).toHaveBeenCalledWith('w-test')
  })
})

describe('DetachedWindowComponent 最小化窗口', () => {
  it('渲染为底部紧凑条，点击还原', () => {
    const s = spies()
    const { container } = render(
      <DetachedWindowComponent window={makeWin({ isMinimized: true })} renderContent={() => null} />,
    )
    expect(container.querySelector('.cursor-move')).toBeNull()
    // 紧凑条仅渲染内容类型标签（无槽位徽标）
    expect(container.textContent).toContain('aiChat')
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(s.restore).toHaveBeenCalledWith('w-test')
  })
})
