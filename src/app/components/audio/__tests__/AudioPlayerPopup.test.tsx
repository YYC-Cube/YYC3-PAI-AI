/**
 * @file AudioPlayerPopup.test.tsx
 * @description 轻量播放器弹窗专项 — 桩 audio-engine/theme-store，驱动：isOpen 门控、曲库初始化与空态文案、
 *              播放/暂停（续播当前曲/播首曲/空库拉取）、进度条 seek 与零时长守卫、音量条与静音切换、
 *              播放列表视图（当前曲高亮/切歌）、上一首/下一首边界、秒级轮询刷新时间、关闭按钮
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

interface TrackLike {
  id: string
  name: string
  metadata?: { artist?: string }
}

interface StateLike {
  isPlaying: boolean
  currentTime: number
  duration: number
  currentTrack: TrackLike | null
}

const h = vi.hoisted(() => {
  const subscribers: Array<(s: StateLike) => void> = []
  let state: StateLike = { isPlaying: false, currentTime: 0, duration: 0, currentTrack: null }
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
    seek: vi.fn(),
    setMusicVolume: vi.fn(),
    setMasterVolume: vi.fn(),
  }
  const tokens = {
    primary: '#8b5cf6',
    accent: '#06b6d4',
    border: '#333333',
    borderDim: '#222222',
    cardBg: '#111111',
    codeBg: '#1f2937',
    foreground: '#ffffff',
    foregroundMuted: '#9ca3af',
  }
  return {
    engine,
    subscribers,
    tokens,
    setState: (s: StateLike) => {
      state = s
    },
    fire: (s: StateLike) => subscribers.forEach((cb) => cb(s)),
  }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))
vi.mock('../../../store/theme-store', () => ({ useThemeStore: () => ({ tokens: h.tokens }) }))

import { AudioPlayerPopup } from '../AudioPlayerPopup'

const t1: TrackLike = { id: 't1', name: '云枢光痕', metadata: { artist: '沫语' } }
const t2: TrackLike = { id: 't2', name: '不懂的董小姐' }
const t3: TrackLike = { id: 't3', name: '男人的难', metadata: { artist: '沫言' } }

const btnByLabel = (c: HTMLElement, label: string) =>
  c.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.subscribers.length = 0
  h.setState({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: null })
})

/** 双重 act 冲刷：确保挂载期异步 init（initializeMusicLibrary → setTracks）完全落定 */
const flushAsync = async () => {
  await act(async () => {})
  await act(async () => {})
}

afterEach(() => {
  vi.useRealTimers()
})

describe('AudioPlayerPopup（轻量播放器弹窗）', () => {
  it('isOpen=false → 返回 null；卸载时退订引擎', () => {
    const { container, unmount } = render(<AudioPlayerPopup isOpen={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
    expect(h.engine.subscribe).not.toHaveBeenCalled()
    unmount()
    expect(h.subscribers).toHaveLength(0)
  })

  it('打开 → 初始化曲库（非空则直接读取）并渲染头尾文案与曲目计数', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { container, unmount } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()

    expect(container.textContent).toContain('YYC³ 音乐播放器')
    expect(container.textContent).toContain('2 首歌曲可用')
    expect(container.textContent).toContain('沫语·女生版 & 沫言·男声版')
    expect(h.engine.initializeMusicLibrary).not.toHaveBeenCalled()
    expect(h.engine.subscribe).toHaveBeenCalledTimes(1)
    unmount()
    expect(h.subscribers).toHaveLength(0)
  })

  it('空曲库 → 挂载时拉取音乐库；无当前曲 → 显示「未选择歌曲」与 0:00', async () => {
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([t1])
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()

    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('未选择歌曲')
    expect(container.textContent).toContain('0:00')
  })

  it('播放按钮：空曲库先拉取再播首曲；引擎已有当前曲 → 续播当前曲并把按钮切成暂停', async () => {
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()

    // 空库（组件内 tracks=[] 且引擎空）→ 拉取后播首曲
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([t1, t2])
    fireEvent.click(btnByLabel(container, '播放'))
    await flushAsync()
    expect(h.engine.play).toHaveBeenCalledWith('t1')
    expect(btnByLabel(container, '暂停')).toBeTruthy()

    // 引擎有当前曲 → 续播（先经订阅回调把组件态打回未播放）
    h.engine.play.mockClear()
    await act(async () => { h.fire({ isPlaying: false, currentTime: 5, duration: 200, currentTrack: t2 }) })
    h.setState({ isPlaying: false, currentTime: 5, duration: 200, currentTrack: t2 })
    h.engine.getTracks.mockReturnValue([t1, t2])
    fireEvent.click(btnByLabel(container, '播放'))
    await flushAsync()
    expect(h.engine.play).toHaveBeenCalledWith('t2')
  })

  it('播放中点击暂停 → engine.pause 且按钮回切播放；订阅回调驱动进度/时长/当前曲名', async () => {
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()
    await act(async () => {
      h.fire({ isPlaying: true, currentTime: 65, duration: 200, currentTrack: t1 })
    })
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('1:05')
    expect(container.textContent).toContain('3:20')

    fireEvent.click(btnByLabel(container, '暂停'))
    expect(h.engine.pause).toHaveBeenCalledTimes(1)
    expect(btnByLabel(container, '播放')).toBeTruthy()
  })

  it('进度条点击：duration 有效 → 按比例 seek（75%×200=150）并回显时间；duration=0 → 守卫不 seek', async () => {
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 200, currentTrack: t1 }) })
    const bar = container.querySelector('.h-2.rounded-full') as HTMLElement
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect)

    fireEvent.click(bar, { clientX: 75 })
    expect(h.engine.seek).toHaveBeenCalledWith(150)

    // duration 0 → 直接返回
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: t1 }) })
    fireEvent.click(bar, { clientX: 50 })
    expect(h.engine.seek).toHaveBeenCalledTimes(1)
  })

  it('音量条变更 → setMusicVolume 与百分比文案；静音按钮 0↔70 切换并同步图标', async () => {
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()
    const volume = container.querySelector('[aria-label="音量调节"]') as HTMLInputElement
    const mute = btnByLabel(container, '静音')

    fireEvent.change(volume, { target: { value: '40' } })
    expect(h.engine.setMusicVolume).toHaveBeenCalledWith(40)
    expect(container.textContent).toContain('40%')

    fireEvent.click(mute)
    expect(h.engine.setMasterVolume).toHaveBeenCalledWith(0)
    expect(btnByLabel(container, '取消静音')).toBeTruthy()

    fireEvent.click(btnByLabel(container, '取消静音'))
    expect(h.engine.setMasterVolume).toHaveBeenLastCalledWith(70)
  })

  it('播放列表视图：当前曲高亮 + 未知艺术家兜底；点击曲目切歌；再次切换回主视图', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2, t3])
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()
    await act(async () => { h.fire({ isPlaying: true, currentTime: 0, duration: 100, currentTrack: t2 }) })

    fireEvent.click(btnByLabel(container, '播放列表'))
    expect(container.textContent).toContain('未知艺术家') // t2 无 metadata.artist
    expect(container.textContent).toContain('沫言')

    // 当前曲行高亮（背景 primary 15 透明度）
    const rows = Array.from(container.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('不懂的董小姐')
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].style.background).toBe('rgba(139, 92, 246, 0.082)') // primary + 15 透明度

    fireEvent.click(rows[0])
    await flushAsync()
    expect(h.engine.play).toHaveBeenCalledWith('t2')

    fireEvent.click(btnByLabel(container, '播放列表'))
    expect(container.textContent).toContain('首歌曲可用') // 回到主视图
  })

  it('上一首/下一首按名称定位：中间曲双向切换；首曲上一首不动、末曲下一首不动', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2, t3])
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()

    // 当前曲 = t2 → 上一首 t1、下一首 t3
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t2 }) })
    fireEvent.click(btnByLabel(container, '上一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t1')
    fireEvent.click(btnByLabel(container, '下一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t3')

    // 首曲上一首 → 不切换
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t1 }) })
    fireEvent.click(btnByLabel(container, '上一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t3') // 未变化

    // 末曲下一首 → 不切换
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t3 }) })
    fireEvent.click(btnByLabel(container, '下一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t3')
  })

  it('播放中每秒轮询引擎状态刷新进度文案；点击 X 关闭回调 onClose', async () => {
    vi.useFakeTimers()
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)

    // 订阅回调置播放中 → 秒级轮询 effect 启动
    await act(async () => { h.fire({ isPlaying: true, currentTime: 1, duration: 200, currentTrack: t1 }) })
    h.setState({ isPlaying: true, currentTime: 8, duration: 200, currentTrack: t1 })
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(container.textContent).toContain('0:08')

    const onClose = vi.fn()
    const c2 = render(<AudioPlayerPopup isOpen onClose={onClose} />)
    fireEvent.click(btnByLabel(c2.container, '关闭'))
    expect(onClose).toHaveBeenCalledTimes(1)
    c2.unmount()
  })

  it('切歌异常（引擎 play 拒绝）→ 记录错误日志不崩溃', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    h.engine.getTracks.mockReturnValue([t1])
    const { container } = render(<AudioPlayerPopup isOpen onClose={() => {}} />)
    await flushAsync()
    h.engine.play.mockRejectedValueOnce(new Error('设备被占用'))

    fireEvent.click(btnByLabel(container, '播放列表'))
    const row = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(row)
    await flushAsync()
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('切换歌曲失败'), expect.any(Error))
    errSpy.mockRestore()
  })
})
