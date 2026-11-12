/**
 * @file useIDEPanelResize.test.tsx
 * @description 面板/终端拖拽缩放 hook — 初始值/终端高度夹取/左栏宽度夹取/中间比例夹取/拖拽态清理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIDEPanelResize } from '../useIDEPanelResize'
import {
  TERMINAL_HEIGHT_MIN, TERMINAL_HEIGHT_MAX,
  LEFT_WIDTH_MIN, LEFT_WIDTH_MAX,
  MIDDLE_RATIO_MIN, MIDDLE_RATIO_MAX,
} from '../../../types'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

afterEach(() => {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})

const mouseMove = (clientX: number, clientY = 0) =>
  act(() => { window.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY })) })
const mouseUp = () =>
  act(() => { window.dispatchEvent(new MouseEvent('mouseup')) })

describe('useIDEPanelResize（拖拽缩放）', () => {
  it('初始值取 options 且 isDraggingPanel=false；setLeftWidth/setTerminalHeight 直改状态', () => {
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 35, initialMiddleRatio: 46, initialTerminalHeight: 220,
    }))
    expect(result.current.leftWidth).toBe(35)
    expect(result.current.middleRatio).toBe(46)
    expect(result.current.terminalHeight).toBe(220)
    expect(result.current.isDraggingPanel).toBe(false)
    act(() => result.current.setLeftWidth(40))
    act(() => result.current.setTerminalHeight(300))
    act(() => result.current.setMiddleRatio(55))
    expect(result.current.leftWidth).toBe(40)
    expect(result.current.terminalHeight).toBe(300)
    expect(result.current.middleRatio).toBe(55)
  })

  it('终端拖拽：上移增加高度、下移减少；夹取在 [MIN, MAX] 区间', () => {
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 35, initialMiddleRatio: 46, initialTerminalHeight: 220,
    }))
    act(() => { result.current.startTerminalResize({ clientY: 400 } as React.MouseEvent) })
    mouseMove(0, 300) // 上移 100 → 320
    expect(result.current.terminalHeight).toBe(320)
    mouseMove(0, 700) // 下移 300 → 20 → 夹取 MIN
    expect(result.current.terminalHeight).toBe(TERMINAL_HEIGHT_MIN)
    act(() => { result.current.startTerminalResize({ clientY: 0 } as React.MouseEvent) })
    mouseMove(0, -1000) // +1000 → 夹取 MAX
    expect(result.current.terminalHeight).toBe(TERMINAL_HEIGHT_MAX)
  })

  it('终端拖拽结束（mouseup）后再移动不再更新高度', () => {
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 35, initialMiddleRatio: 46, initialTerminalHeight: 200,
    }))
    act(() => { result.current.startTerminalResize({ clientY: 300 } as React.MouseEvent) })
    mouseUp()
    mouseMove(0, 100)
    expect(result.current.terminalHeight).toBe(200)
  })

  it('左栏拖拽：按窗口宽度百分比增量，夹取 [15, 50]', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 30, initialMiddleRatio: 46, initialTerminalHeight: 220,
    }))
    act(() => { result.current.startPanelDrag('left', { clientX: 500, preventDefault: () => {} } as React.MouseEvent) })
    expect(result.current.isDraggingPanel).toBe(true)
    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')
    mouseMove(600) // +100px / 1000 → +10% → 40
    expect(result.current.leftWidth).toBe(40)
    // 高度始终从拖拽起点 startVal 绝对计算（非增量叠加）：400-500=-100px → 30-10=20
    mouseMove(400) // -100px → 20
    expect(result.current.leftWidth).toBe(20)
    mouseMove(1500) // +1000px → +100% → 夹取 50
    expect(result.current.leftWidth).toBe(LEFT_WIDTH_MAX)
    mouseMove(-5000) // → 夹取 15
    expect(result.current.leftWidth).toBe(LEFT_WIDTH_MIN)
  })

  it('中间栏拖拽：按剩余宽度百分比增量，夹取 [20, 80]', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 20, initialMiddleRatio: 50, initialTerminalHeight: 220,
    }))
    act(() => { result.current.startPanelDrag('middle', { clientX: 300, preventDefault: () => {} } as React.MouseEvent) })
    mouseMove(360) // 剩余 800px，+60px → +7.5% → 57.5
    expect(result.current.middleRatio).toBeCloseTo(57.5)
    mouseMove(-10000) // 巨幅负增量 → 夹取 MIN
    expect(result.current.middleRatio).toBe(MIDDLE_RATIO_MIN)
    act(() => { result.current.startPanelDrag('middle', { clientX: 0, preventDefault: () => {} } as React.MouseEvent) })
    mouseMove(10000) // 巨幅正增量 → 夹取 MAX
    expect(result.current.middleRatio).toBe(MIDDLE_RATIO_MAX)
  })

  it('拖拽结束清理：isDraggingPanel 复位 + body 内联样式清空 + ref 置空', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 30, initialMiddleRatio: 46, initialTerminalHeight: 220,
    }))
    act(() => { result.current.startPanelDrag('left', { clientX: 0, preventDefault: () => {} } as React.MouseEvent) })
    expect(result.current.isDraggingPanel).toBe(true)
    mouseUp()
    expect(result.current.isDraggingPanel).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
    // 结束后再移动不应继续更新
    mouseMove(500)
    expect(result.current.leftWidth).toBe(30)
  })

  it('中间栏拖拽在剩余宽度为 0 时安全跳过（leftWidth=100 → 不更新不崩溃）', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    const { result } = renderHook(() => useIDEPanelResize({
      initialLeftWidth: 30, initialMiddleRatio: 46, initialTerminalHeight: 220,
    }))
    act(() => { result.current.setLeftWidth(100) })
    act(() => { result.current.startPanelDrag('middle', { clientX: 0, preventDefault: () => {} } as React.MouseEvent) })
    mouseMove(200)
    expect(result.current.middleRatio).toBe(46)
  })
})
