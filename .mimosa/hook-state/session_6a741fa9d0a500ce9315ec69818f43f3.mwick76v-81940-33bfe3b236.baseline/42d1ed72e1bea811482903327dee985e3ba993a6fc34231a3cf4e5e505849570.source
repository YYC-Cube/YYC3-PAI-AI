/**
 * @file AudioVisualizer.test.tsx
 * @description 音频可视化组件专项 — 桩 audio-engine 频谱数据 + Canvas 2D 上下文 + rAF，驱动：无数据闲置态
 *              （32 根低矮柱/IDLE 徽标）、柱状/波形/圆形三种绘制路径、高电平白色峰值帽、rAF 循环续帧与卸载
 *              取消、getContext 缺失守卫、高度背景色与标签开关、模式切换按钮组
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

const h = vi.hoisted(() => {
  const engine = {
    getFrequencyData: vi.fn((): Uint8Array | null => null),
    getTimeDomainData: vi.fn((): Uint8Array | null => null),
  }
  return { engine }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))

import { AudioVisualizer } from '../AudioVisualizer'

const makeCtx2D = () => ({
  canvas: null,
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  roundRect: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  lineWidth: 1,
  strokeStyle: '',
  fillStyle: '',
})

let ctx2d: ReturnType<typeof makeCtx2D>
let raf: ReturnType<typeof vi.fn>
let caf: ReturnType<typeof vi.fn>

/** 接管 document.createElement：canvas 实例挂桩 getContext（setup.ts 的旧桩已被 reset 还原） */
const installCanvas = (ctxFactory: () => ReturnType<typeof makeCtx2D> | null) => {
  const protoCreate = Document.prototype.createElement
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, opts?: ElementCreationOptions) => {
    const el = protoCreate.call(document, tagName, opts)
    if (tagName === 'canvas') {
      const ctx = ctxFactory()
      Object.defineProperty(el, 'getContext', {
        value: () => ctx,
        configurable: true,
      })
    }
    return el
  }) as typeof document.createElement)
}

beforeEach(() => {
  vi.resetAllMocks()
  ctx2d = makeCtx2D()
  installCanvas(() => ctx2d)
  raf = vi.fn((_cb: FrameRequestCallback) => 1)
  caf = vi.fn()
  vi.stubGlobal('requestAnimationFrame', raf)
  vi.stubGlobal('cancelAnimationFrame', caf)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AudioVisualizer（音频可视化）', () => {
  it('无频谱数据 → 闲置态：32 根低矮随机柱（fillRect 32 次）+ Activity 图标 + ○ IDLE 标签', () => {
    const { container } = render(<AudioVisualizer showLabels />)

    expect(raf).toHaveBeenCalledTimes(1)
    expect(ctx2d.clearRect).toHaveBeenCalledWith(0, 0, 0, 120) // jsdom offsetWidth 0
    expect(ctx2d.fillRect).toHaveBeenCalledTimes(32)
    expect(ctx2d.fillStyle).toBe('#06b6d430') // 默认色 + 30 透明度
    expect(container.querySelector('.lucide-activity')).toBeTruthy()
    expect(container.textContent).toContain('○ IDLE')
    expect(container.textContent).toContain('0 Hz')
    expect(container.textContent).toContain('20 kHz')
  })

  it('有频谱数据 → 柱状绘制：每根柱 roundRect + 三段渐变；满电平柱绘制白色峰值帽；徽标变 ● LIVE', () => {
    h.engine.getFrequencyData.mockReturnValue(new Uint8Array(64).fill(255))
    const { container } = render(<AudioVisualizer type="bars" showLabels />)

    expect(ctx2d.roundRect).toHaveBeenCalledTimes(64)
    expect(ctx2d.createLinearGradient).toHaveBeenCalledTimes(64)
    // 满电平（255/255 > 0.8）→ 顶部白帽 fillRect
    expect(ctx2d.fillRect).toHaveBeenCalledTimes(64)
    expect(ctx2d.fillStyle).toBe('#ffffff40')
    expect(container.textContent).toContain('● LIVE')
    expect(container.querySelector('.lucide-activity')).toBeNull() // 激活后 Activity 图标隐藏
  })

  it('波形绘制：timeDomain 数据逐点连线 + 底部闭合填充', () => {
    const data = new Uint8Array(128)
    for (let i = 0; i < data.length; i++) data[i] = i % 256
    h.engine.getTimeDomainData.mockReturnValue(data)

    render(<AudioVisualizer type="wave" />)

    expect(ctx2d.moveTo).toHaveBeenCalledTimes(1)
    // 127 个循环点 + 3 个闭合路径点（右中/右底/左底）
    expect(ctx2d.lineTo).toHaveBeenCalledTimes(130)
    expect(ctx2d.stroke).toHaveBeenCalled()
    expect(ctx2d.closePath).toHaveBeenCalledTimes(1)
    expect(ctx2d.fill).toHaveBeenCalledTimes(1)
    expect(ctx2d.fillStyle).toBe('#06b6d415')
  })

  it('圆形绘制：逐柱放射线 + 中心圆环描边', () => {
    h.engine.getFrequencyData.mockReturnValue(new Uint8Array(32).fill(128))

    render(<AudioVisualizer type="circular" />)

    expect(ctx2d.moveTo).toHaveBeenCalledTimes(32)
    expect(ctx2d.lineTo).toHaveBeenCalledTimes(32)
    // 32 根柱每根 beginPath+stroke，中心圆环再各 1 次
    expect(ctx2d.beginPath).toHaveBeenCalledTimes(33)
    expect(ctx2d.stroke).toHaveBeenCalledTimes(33)
    expect(ctx2d.arc).toHaveBeenCalledTimes(1)
  })

  it('rAF 循环续帧：首帧后再次排队，手动触发续帧重绘；卸载时 cancelAnimationFrame', () => {
    h.engine.getFrequencyData.mockReturnValue(new Uint8Array(8).fill(100))
    const { unmount } = render(<AudioVisualizer type="bars" />)

    expect(raf).toHaveBeenCalledTimes(1)
    expect(raf.mock.calls[0][0]).toBeTypeOf('function')

    // 手动跑下一帧：clearRect 再次发生
    const frame2 = raf.mock.calls[0][0] as FrameRequestCallback
    act(() => frame2(16))
    expect(raf).toHaveBeenCalledTimes(2)
    expect(ctx2d.clearRect).toHaveBeenCalledTimes(2)
    expect(caf).not.toHaveBeenCalled()

    unmount()
    expect(caf).toHaveBeenCalledWith(1)
  })

  it('canvas.getContext 返回 null → 守卫直接返回，不启动 rAF 循环', () => {
    vi.restoreAllMocks() // 撤销本文件的 createElement 接管 → jsdom 原生 canvas（getContext 返回 null）
    const { container } = render(<AudioVisualizer />)
    expect(raf).not.toHaveBeenCalled()
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('height/backgroundColor/color 属性生效；三个模式切换按钮（柱状/波形/圆形）渲染且当前模式高亮', () => {
    const { container } = render(<AudioVisualizer type="wave" height={200} color="#a855f7" backgroundColor="#111827" />)

    const canvas = container.querySelector('canvas') as HTMLElement
    expect(canvas.style.height).toBe('200px')
    expect(canvas.style.backgroundColor).toBe('rgb(17, 24, 39)') // #111827

    const buttons = Array.from(container.querySelectorAll('button'))
    expect(buttons.map((b) => b.textContent)).toEqual(['柱状', '波形', '圆形'])
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'bars 模式', 'wave 模式', 'circular 模式',
    ])
    expect(buttons[1].className).toContain('bg-cyan-500/20') // 当前模式高亮
    expect(buttons[0].className).not.toContain('bg-cyan-500/20')

    // 无数据 → 闲置柱使用传入色的 30 透明度（color + '30'）
    expect(ctx2d.fillStyle).toBe('#a855f730')
    // 切换按钮 click（组件暂为空实现）不崩
    fireEvent.click(buttons[0])
  })
})
