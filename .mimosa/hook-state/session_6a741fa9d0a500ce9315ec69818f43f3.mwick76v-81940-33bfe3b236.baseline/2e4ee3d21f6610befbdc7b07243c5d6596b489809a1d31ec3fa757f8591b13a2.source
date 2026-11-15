/**
 * @file MiniAudioPlayer.test.tsx
 * @description 全局迷你播放器专项 — 桩 audio-engine/theme-store/V3 弹窗，驱动：订阅与退订、曲库初始化
 *              （空库才拉取/已加载跳过/异常日志）、快速播放暂停（续播当前曲/首曲/播放中暂停）、
 *              播放状态图标与状态点、歌名展示与弹窗开合联动、主题令牌配色
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import type { Mock } from 'vitest'

interface TrackLike {
  id: string
  name: string
}

const h = vi.hoisted(() => {
  const subscribers: Array<(s: StateLike) => void> = []
  interface StateLike {
    isPlaying: boolean
    currentTime?: number
    duration?: number
    currentTrack?: TrackLike | null
  }
  let state: StateLike = { isPlaying: false, currentTrack: null }
  const engine = {
    getTracks: vi.fn((): TrackLike[] => []),
    initializeMusicLibrary: vi.fn(async (): Promise<TrackLike[]> => []),
    subscribe: vi.fn((cb: (s: StateLike) => void) => {
      subscribers.push(cb)
      return () => {
        const i = subscribers.indexOf(cb)
        if (i >= 0) subscribers.splice(i, 1)
      }
    }),
    getState: vi.fn((): StateLike => state),
    play: vi.fn(async () => {}),
    pause: vi.fn(),
  }
  const tokens = {
    primary: '#8b5cf6',
    border: '#333',
    foreground: '#ffffff',
    foregroundMuted: '#9ca3af',
    success: '#10b981',
  }
  const V3Stub = vi.fn(() => null)
  return {
    engine,
    subscribers,
    tokens,
    V3Stub,
    setState: (s: StateLike) => {
      state = s
    },
    fire: (s: StateLike) => subscribers.forEach((cb) => cb(s)),
  }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))
vi.mock('../../../store/theme-store', () => ({ useThemeStore: () => ({ tokens: h.tokens }) }))
vi.mock('../EnhancedAudioPlayerV3', () => ({ EnhancedAudioPlayerV3: h.V3Stub }))

import { MiniAudioPlayer } from '../MiniAudioPlayer'

const t1 = { id: 't1', name: '云枢光痕' }
const t2 = { id: 't2', name: '不懂的董小姐' }

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.subscribers.length = 0
  h.setState({ isPlaying: false, currentTrack: null })
})

describe('MiniAudioPlayer（全局迷你播放器）', () => {
  it('挂载即订阅引擎状态，卸载时退订', () => {
    const { unmount } = render(<MiniAudioPlayer />)
    expect(h.engine.subscribe).toHaveBeenCalledTimes(1)
    expect(h.subscribers).toHaveLength(1)
    unmount()
    expect(h.subscribers).toHaveLength(0)
  })

  it('曲库已加载（getTracks 非空）→ 不再重复初始化；空库 → 调用 initializeMusicLibrary 后二次读取', async () => {
    h.engine.getTracks.mockReturnValueOnce([t1])
    const a = render(<MiniAudioPlayer />)
    await act(async () => {})
    expect(h.engine.initializeMusicLibrary).not.toHaveBeenCalled()
    a.unmount()

    h.engine.getTracks.mockReturnValueOnce([]).mockReturnValueOnce([t1, t2])
    const b = render(<MiniAudioPlayer />)
    await act(async () => {})
    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1)
    expect(h.engine.getTracks).toHaveBeenCalledTimes(3) // 1（挂载判空）+ 1（判空）+ 1（初始化后重读）
    b.unmount()
  })

  it('初始化异常 → 记录错误日志不崩溃', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockRejectedValueOnce(new Error('网络失败'))
    render(<MiniAudioPlayer />)
    await act(async () => {})
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('[YYC3 MiniPlayer]'),
      expect.any(Error)
    )
    errSpy.mockRestore()
  })

  it('未播放时点击图标：引擎已加载 → 播放列表首曲', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { container } = render(<MiniAudioPlayer />)
    await act(async () => {})

    fireEvent.click(container.querySelector('[aria-label="开始播放"]')!)
    await act(async () => {})
    expect(h.engine.play).toHaveBeenCalledWith('t1')
    expect(h.engine.pause).not.toHaveBeenCalled()
  })

  it('未播放时点击图标：空库先拉取曲库再播首曲；引擎已有当前曲 → 续播当前曲', async () => {
    h.engine.getTracks.mockReturnValueOnce([]).mockReturnValueOnce([t1, t2])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([t1, t2])
    const { container } = render(<MiniAudioPlayer />)
    await act(async () => {})
    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1) // 挂载初始化

    // 挂载后的 Once 桩已耗尽 → 恢复默认已加载曲库
    h.engine.getTracks.mockReturnValue([t1, t2])
    fireEvent.click(container.querySelector('[aria-label="开始播放"]')!)
    await act(async () => {})
    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1) // 不再二次拉取
    expect(h.engine.play).toHaveBeenCalledWith('t1')

    // 状态里有当前曲 → 续播而不是首曲
    h.engine.play.mockClear()
    h.setState({ isPlaying: false, currentTrack: t2 })
    h.engine.getState.mockReturnValue({ isPlaying: false, currentTrack: t2 })
    fireEvent.click(container.querySelector('[aria-label="开始播放"]')!)
    await act(async () => {})
    expect(h.engine.play).toHaveBeenCalledWith('t2')
  })

  it('播放中点击图标 → 暂停；播放失败 → 记录错误日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<MiniAudioPlayer />)
    await act(async () => {})
    act(() => h.fire({ isPlaying: true, currentTrack: t1 }))

    fireEvent.click(container.querySelector('[aria-label="暂停播放"]')!)
    expect(h.engine.pause).toHaveBeenCalledTimes(1)

    // 引擎暂停后回推未播放状态 → 图标恢复「开始播放」
    act(() => h.fire({ isPlaying: false, currentTrack: t1 }))
    // 播放失败路径：空库 → await initializeMusicLibrary 抛错 → catch 记录「播放失败」
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockRejectedValueOnce(new Error('曲库不可用'))
    fireEvent.click(container.querySelector('[aria-label="开始播放"]')!)
    await act(async () => {})
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('播放失败'), expect.any(Error))
    errSpy.mockRestore()
  })

  it('订阅回调驱动 UI：isPlaying → 图标切换暂停样式 + 发光状态点；currentTrack → 歌名展示（title 悬停全文）', () => {
    const { container } = render(<MiniAudioPlayer />)
    expect(container.querySelector('[aria-label="开始播放"]')).toBeTruthy()
    expect(container.querySelector('.lucide-music')).toBeTruthy()

    act(() => h.fire({ isPlaying: true, currentTrack: t1 }))
    expect(container.querySelector('[aria-label="暂停播放"]')).toBeTruthy()
    expect(container.querySelector('.lucide-pause')).toBeTruthy()
    const name = container.querySelector('p[title]')
    expect(name?.textContent).toBe('云枢光痕')
    expect(name?.getAttribute('title')).toBe('云枢光痕')

    // 播放状态指示点（success 色发光小圆；jsdom 将 hex 内联样式归一化为 rgb）
    const dot = container.querySelector('span.rounded-full') as HTMLElement | null
    expect(dot).toBeTruthy()
    expect(dot!.style.background).toBe('rgb(16, 185, 129)')
    expect(dot!.style.boxShadow).toBe(`0 0 6px ${h.tokens.success}`)
  })

  it('点击容器 → V3 弹窗打开（isOpen=true）；弹窗打开期间歌名隐藏；点击 V3 onClose → 弹窗关闭', async () => {
    const { container } = render(<MiniAudioPlayer />)
    await act(async () => {})
    act(() => h.fire({ isPlaying: false, currentTrack: t1 }))
    expect(container.querySelector('p[title]')).toBeTruthy() // 弹窗未开 → 显示歌名

    fireEvent.click(container.querySelector('.mini-audio-player > div')!)
    expect(h.V3Stub).toHaveBeenCalled()
    const lastProps = (h.V3Stub as Mock).mock.lastCall![0] as { isOpen: boolean; onClose: () => void }
    expect(lastProps.isOpen).toBe(true)
    // 弹窗开启 → 歌名区隐藏
    expect(container.querySelector('p[title]')).toBeNull()

    act(() => lastProps.onClose())
    const reopened = (h.V3Stub as Mock).mock.lastCall![0] as { isOpen: boolean }
    expect(reopened.isOpen).toBe(false)
    expect(container.querySelector('p[title]')).toBeTruthy() // 恢复显示
  })

  it('鼠标悬停切换容器描边色为主题 primary，移出还原透明（内联样式直改；jsdom 归一化 hex→rgb）', () => {
    const { container } = render(<MiniAudioPlayer />)
    const box = container.querySelector('.mini-audio-player > div') as HTMLElement
    fireEvent.mouseEnter(box)
    expect(box.style.borderColor).toBe('rgb(51, 51, 51)') // #333
    expect(box.style.background).toMatch(/^rgba\(139, 92, 246/) // primary + 08 透明度
    fireEvent.mouseLeave(box)
    expect(box.style.borderColor).toBe('transparent')
    expect(box.style.background).toBe('transparent')
  })
})
