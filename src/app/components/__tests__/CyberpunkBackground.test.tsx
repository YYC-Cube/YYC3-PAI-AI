/**
 * @file CyberpunkBackground.test.tsx
 * @description 赛博朋克背景专项 — canvas stub 驱动动画路径（粒子/网格点/raf 生命周期/主题双态）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'

const gradient = { addColorStop: vi.fn() }
const ctx2d = {
  clearRect: vi.fn(),
  createLinearGradient: vi.fn(() => gradient),
  createRadialGradient: vi.fn(() => gradient),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  lineWidth: 1,
}

const rafSpy = vi.fn((cb: FrameRequestCallback) => {
  // 帧数预算：animate 尾部会再调度 raf，无界桩会形成无限微任务链 → OOM
  if (rafBudget-- > 0) queueMicrotask(() => cb(performance.now()))
  return 1
})
let rafBudget = 5
const cancelSpy = vi.fn()
const addListener = vi.fn()
const removeListener = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  rafBudget = 5
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx2d as unknown as CanvasRenderingContext2D)
  vi.stubGlobal('requestAnimationFrame', rafSpy)
  vi.stubGlobal('cancelAnimationFrame', cancelSpy)
  vi.spyOn(window, 'addEventListener').mockImplementation(addListener as never)
  vi.spyOn(window, 'removeEventListener').mockImplementation(removeListener as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

import { CyberpunkBackground } from '../CyberpunkBackground'
import { themeStore } from '../../store/theme-store'

describe('CyberpunkBackground 赛博朋克模式（默认主题）', () => {
  it('渲染 canvas + 电路网格层 + 底色层（结构）', () => {
    const { container } = render(<CyberpunkBackground />)
    expect(container.querySelector('canvas')).toBeTruthy()
    expect(container.querySelector('.circuit-grid')).toBeTruthy()
    // 底色层存在（fixed 定位容器）
    expect((container.firstElementChild as HTMLElement).className).toContain('fixed')
  })

  it('动画启动：resize 注册 + 帧绘制（clearRect/渐变/描边）', async () => {
    render(<CyberpunkBackground />)
    await act(async () => { await Promise.resolve() })
    // effect 已运行：resize 监听注册 + 首帧绘制
    expect(addListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(ctx2d.clearRect).toHaveBeenCalled()
    expect(ctx2d.createLinearGradient).toHaveBeenCalled()
    expect(ctx2d.createRadialGradient).toHaveBeenCalled()
    expect(ctx2d.arc).toHaveBeenCalled()
    expect(ctx2d.stroke).toHaveBeenCalled()
  })

  it('卸载：cancelAnimationFrame + 解绑 resize', () => {
    const { unmount } = render(<CyberpunkBackground />)
    unmount()
    expect(cancelSpy).toHaveBeenCalled()
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})

describe('CyberpunkBackground 素净模式', () => {
  it('切到 clean 主题：渲染渐变层而非 canvas，无动画', () => {
    const prev = themeStore.getState().themeId
    themeStore.setTheme('clean')
    try {
      const { container } = render(<CyberpunkBackground />)
      expect(container.querySelector('canvas')).toBeNull()
      expect(container.querySelector('.circuit-grid')).toBeNull()
      // clean 分支：effect 里 clearRect 后直接 return，不调度动画
      expect(rafSpy).not.toHaveBeenCalled()
      // 渐变底 + 点纹纹理两层
      expect(container.firstElementChild!.children.length).toBeGreaterThanOrEqual(2)
    } finally {
      themeStore.setTheme(prev)
    }
  })
})
