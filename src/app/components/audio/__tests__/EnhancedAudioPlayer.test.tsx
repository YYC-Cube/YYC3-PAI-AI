/**
 * @file EnhancedAudioPlayer.test.tsx
 * @description 增强版音乐播放器专项 — 桩 audio-engine/theme-store（收藏管理/LRC 解析走真实实现），
 *              驱动：isOpen 门控与曲库初始化、订阅回调驱动当前曲/收藏态、播放暂停（续播/首曲）、
 *              进度 seek、音量与静音、播放模式四态循环、收藏增删与收藏页、搜索过滤、上一首/下一首
 *              （顺序/随机/循环回绕）、键盘快捷键全集（Space/方向/M/L/F/V/Esc/? 与输入框守卫）、
 *              快捷键帮助弹窗、可视化绘制循环与卸载清理、遮罩点击关闭
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

interface TrackLike {
  id: string
  name: string
  metadata?: { artist?: string }
  tags?: string[]
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
    warning: '#f59e0b',
    error: '#ef4444',
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
    fire: (s: StateLike) => {
      state = s
      subscribers.forEach((cb) => cb(s))
    },
  }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))
vi.mock('../../../store/theme-store', () => ({ useThemeStore: () => ({ tokens: h.tokens }) }))

import { EnhancedAudioPlayer } from '../EnhancedAudioPlayer'

// ── 桩基建 ──

const makeCtx2D = () => ({
  canvas: null,
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: '',
})

class AnalyserStub {
  fftSize = 0
  get frequencyBinCount() {
    return 128
  }
  getByteFrequencyData = vi.fn((arr: Uint8Array) => arr.fill(200))
  connect = vi.fn()
  disconnect = vi.fn()
}

class AudioContextStub {
  static instances: AudioContextStub[] = []
  destination = { connect: vi.fn() }
  createAnalyser = vi.fn(() => new AnalyserStub())
  createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }))
  constructor() {
    AudioContextStub.instances.push(this)
  }
}

let ctx2d: ReturnType<typeof makeCtx2D>
let raf: ReturnType<typeof vi.fn>
let caf: ReturnType<typeof vi.fn>

const installCanvas = () => {
  const protoCreate = Document.prototype.createElement
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, opts?: ElementCreationOptions) => {
    const el = protoCreate.call(document, tagName, opts)
    if (tagName === 'canvas') {
      Object.defineProperty(el, 'getContext', { value: () => ctx2d, configurable: true })
    }
    return el
  }) as typeof document.createElement)
}

const t1: TrackLike = { id: 't1', name: '云枢光痕', metadata: { artist: '沫语' } }
const t2: TrackLike = { id: 't2', name: '不懂的董小姐', metadata: { artist: '沫言' } }
const t3: TrackLike = { id: 't3', name: '男人的难' }

const KEY_FAV = ['yyc3', 'audio', 'favorites'].join('-')

const btnByLabel = (c: HTMLElement, label: string) =>
  c.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement
const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement

/** 等待挂载异步初始化（曲库/订阅）完全落定：双重 act 冲刷 */
const ready = async () => {
  await act(async () => {})
  await act(async () => {})
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.subscribers.length = 0
  h.setState({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: null })
  ctx2d = makeCtx2D()
  installCanvas()
  raf = vi.fn((_cb: FrameRequestCallback) => 1)
  caf = vi.fn()
  vi.stubGlobal('requestAnimationFrame', raf)
  vi.stubGlobal('cancelAnimationFrame', caf)
  Object.defineProperty(globalThis, 'AudioContext', {
    value: AudioContextStub,
    writable: true,
    configurable: true,
  })
  AudioContextStub.instances = []
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('EnhancedAudioPlayer（增强版音乐播放器）', () => {
  it('isOpen=false → null 且不订阅；打开 → 初始化曲库（已加载则直读）、订阅、页脚就绪', async () => {
    const a = render(<EnhancedAudioPlayer isOpen={false} onClose={() => {}} />)
    expect(a.container.firstElementChild).toBeNull()
    expect(h.engine.subscribe).not.toHaveBeenCalled()
    a.unmount()

    h.engine.getTracks.mockReturnValue([t1, t2])
    const { container, unmount } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()

    expect(container.textContent).toContain('YYC³ 增强音乐播放器')
    expect(container.textContent).toContain('2 首歌曲')
    expect(container.textContent).toContain('按 ? 查看快捷键')
    expect(h.engine.initializeMusicLibrary).not.toHaveBeenCalled()
    unmount()
    expect(h.subscribers).toHaveLength(0)
  })

  it('空曲库 → 打开时拉取音乐库；无当前曲 → 「未选择歌曲」占位与播放按钮', async () => {
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([t1])
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()

    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('未选择歌曲')
    expect(btnByLabel(container, '播放')).toBeTruthy()
    expect(container.textContent).toContain('点击播放查看波形图')
  })

  it('订阅回调驱动：当前曲名/艺术家/收藏高亮；播放中 → 暂停按钮与可视化绘制（rAF 续帧）', async () => {
    localStorage.setItem(KEY_FAV, JSON.stringify([{ id: 't1', name: '云枢光痕', artist: '沫语', addedAt: 1 }]))
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()

    await act(async () => { h.fire({ isPlaying: true, currentTime: 40, duration: 200, currentTrack: t1 }) })

    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('沫语')
    expect(container.textContent).toContain('0:40') // 进度时间 40s
    expect(btnByLabel(container, '暂停')).toBeTruthy()
    expect(container.querySelector('[title="取消收藏"]')).toBeTruthy() // 已收藏 → title 翻转
    // 可视化：analyser 频谱 → 128 根柱 fillRect，且 rAF 续帧重绘
    expect(ctx2d.fillRect).toHaveBeenCalledTimes(128)
    const frame = raf.mock.calls[0][0] as FrameRequestCallback
    act(() => frame(16))
    expect(ctx2d.fillRect).toHaveBeenCalledTimes(256)
  })

  it('播放暂停：无当前曲 → 播首曲；有当前曲 → 续播；播放中点击 → engine.pause', async () => {
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()

    h.engine.getTracks.mockReturnValue([t1, t2])
    fireEvent.click(btnByLabel(container, '播放'))
    await act(async () => {})
    expect(h.engine.play).toHaveBeenCalledWith('t1')

    h.engine.play.mockClear()
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: t2 }) })
    h.setState({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: t2 })
    fireEvent.click(btnByLabel(container, '播放'))
    await act(async () => {})
    expect(h.engine.play).toHaveBeenCalledWith('t2')

    await act(async () => { h.fire({ isPlaying: true, currentTime: 0, duration: 0, currentTrack: t2 }) })
    fireEvent.click(btnByLabel(container, '暂停'))
    expect(h.engine.pause).toHaveBeenCalledTimes(1)
  })

  it('进度条点击按比例 seek；音量条转发 setMusicVolume；静音切换 setMasterVolume 0↔原值', async () => {
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 200, currentTrack: t1 }) })

    const bar = container.querySelector('.h-2.rounded-full') as HTMLElement
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect)
    fireEvent.click(bar, { clientX: 25 })
    expect(h.engine.seek).toHaveBeenCalledWith(50)

    const volume = container.querySelector('[aria-label="音量调节"]') as HTMLInputElement
    fireEvent.change(volume, { target: { value: '35' } })
    expect(h.engine.setMusicVolume).toHaveBeenCalledWith(35)

    fireEvent.click(btnByLabel(container, '静音'))
    expect(h.engine.setMasterVolume).toHaveBeenCalledWith(0)
    fireEvent.click(btnByLabel(container, '取消静音'))
    expect(h.engine.setMasterVolume).toHaveBeenLastCalledWith(35) // 恢复到最近音量
  })

  it('播放模式按钮循环四态：顺序→随机→列表循环→单曲循环；随机下一首按 Math.random 取曲', async () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    h.engine.getTracks.mockReturnValue([t1, t2, t3]) // 初始化读取 → filteredTracks 就绪
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t1 }) })
    h.engine.getTracks.mockReturnValue([t1, t2, t3])

    fireEvent.click(container.querySelector('[title="顺序播放"]')!)
    expect(container.querySelector('[title="随机播放"]')).toBeTruthy()

    fireEvent.click(btnByLabel(container, '下一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t3') // random 0.99 → 末曲

    fireEvent.click(container.querySelector('[title="随机播放"]')!)
    expect(container.querySelector('[title="列表循环"]')).toBeTruthy()
    fireEvent.click(container.querySelector('[title="列表循环"]')!)
    expect(container.querySelector('[title="单曲循环"]')).toBeTruthy()
    rnd.mockRestore()
    await act(async () => {}) // 收尾冲刷：清理挂载期异步尾巴
  })

  it('上一首/下一首：顺序模式首曲上一首不切换；循环模式首尾回绕', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2, t3]) // 初始化读取 → filteredTracks 就绪
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t1 }) })

    fireEvent.click(btnByLabel(container, '上一首'))
    expect(h.engine.play).not.toHaveBeenCalled() // 首曲 + 顺序模式 → 不切换
    fireEvent.click(btnByLabel(container, '下一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t2')

    // 切到列表循环 → 首尾回绕
    fireEvent.click(container.querySelector('[title="顺序播放"]')!) // → 随机
    fireEvent.click(container.querySelector('[title="随机播放"]')!) // → 列表循环
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t3 }) })
    fireEvent.click(btnByLabel(container, '下一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t1')
    await act(async () => { h.fire({ isPlaying: false, currentTime: 0, duration: 100, currentTrack: t1 }) })
    fireEvent.click(btnByLabel(container, '上一首'))
    expect(h.engine.play).toHaveBeenLastCalledWith('t3')
    await act(async () => {}) // 收尾冲刷：清理挂载期异步尾巴
  })

  it('收藏：播放列表行内红心加入/移除并持久化；收藏页签展示（FavoriteTrack 走 artist 字段兜底）与计数', async () => {
    // 预置一条收藏 → 挂载时经 favoritesManager 回读
    localStorage.setItem(
      KEY_FAV,
      JSON.stringify([{ id: 't9', name: '外部的歌', artist: '沫语', addedAt: 1 }])
    )
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()

    // 组件初值 showPlaylist=false → 列表区渲染收藏 → 预置收藏行（无 metadata → artist 字段兜底）
    expect(container.textContent).toContain('外部的歌')
    expect(container.textContent).toContain('沫语')
    expect(container.textContent).toContain('收藏 (1)')

    // 播放列表页签 → 行内红心加入收藏（stopPropagation 不触发切歌）
    fireEvent.click(btnByText(container, '播放列表'))
    expect(container.textContent).toContain('播放列表 (2)')
    // 行内悬停红心：行（button.group）内的嵌套按钮
    const heartsInRows = () => container.querySelectorAll('.group button')
    expect(heartsInRows().length).toBe(2)
    fireEvent.click(heartsInRows()[0])
    const favs1 = JSON.parse(localStorage.getItem(KEY_FAV)!)
    expect(favs1).toHaveLength(2)
    expect(favs1[0].id).toBe('t1')
    expect(container.textContent).toContain('收藏 (2)')

    // 再点同一行红心 → 移除
    fireEvent.click(heartsInRows()[0])
    expect(JSON.parse(localStorage.getItem(KEY_FAV)!)).toHaveLength(1)
    expect(container.textContent).toContain('收藏 (1)')
    await act(async () => {}) // 收尾冲刷：清理挂载期异步尾巴
  })

  it('搜索过滤：按曲名命中后计数变化；无匹配 → 空态文案；空白恢复全量', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2, t3])
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()
    // 空态文案在播放列表视图（初值为收藏视图）
    fireEvent.click(btnByText(container, '播放列表'))

    const search = container.querySelector('input[placeholder="搜索歌曲..."]') as HTMLInputElement
    fireEvent.change(search, { target: { value: '董小姐' } })
    expect(container.textContent).toContain('播放列表 (1)')

    fireEvent.change(search, { target: { value: '不存在' } })
    expect(container.textContent).toContain('没有找到匹配的歌曲')
    expect(container.textContent).toContain('播放列表 (0)')

    fireEvent.change(search, { target: { value: '  ' } })
    expect(container.textContent).toContain('播放列表 (3)')
  })

  it('键盘快捷键：Space 播放/ArrowRight 快进/ArrowUp 加音量/M 静音/F 收藏/Esc 关闭；输入框聚焦不响应', async () => {
    const onClose = vi.fn()
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={onClose} />)
    await ready()
    await act(async () => { h.fire({ isPlaying: false, currentTime: 10, duration: 200, currentTrack: t1 }) })
    h.engine.getTracks.mockReturnValue([t1])

    fireEvent.keyDown(window, { code: 'Space' })
    expect(h.engine.play).toHaveBeenCalledWith('t1')

    fireEvent.keyDown(window, { code: 'ArrowRight' })
    expect(h.engine.seek).toHaveBeenCalledWith(15)

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    expect(h.engine.setMusicVolume).toHaveBeenCalledWith(75) // 默认 70 + 5

    fireEvent.keyDown(window, { code: 'KeyM' })
    expect(h.engine.setMasterVolume).toHaveBeenCalledWith(0)

    fireEvent.keyDown(window, { code: 'KeyF' })
    expect(JSON.parse(localStorage.getItem(KEY_FAV)!)).toHaveLength(1)

    fireEvent.keyDown(window, { code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    // 焦点在输入框（搜索框）内按键 → 快捷键守卫不触发
    const search = container.querySelector('input')!
    fireEvent.keyDown(search, { code: 'Space' })
    expect(h.engine.play).toHaveBeenCalledTimes(1)
  })

  it('Shift+/ 打开快捷键帮助弹窗；Esc 先关帮助再关播放器；V 无 MV 时静默；L 切歌词开关', async () => {
    const onClose = vi.fn()
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={onClose} />)
    await ready()

    fireEvent.keyDown(window, { code: 'Slash', shiftKey: true })
    expect(container.textContent).toContain('⌨️ 键盘快捷键')
    expect(container.textContent).toContain('播放 / 暂停')
    expect(container.textContent).toContain('显示 / 隐藏歌词')
    expect(container.textContent).toContain('收藏当前歌曲')

    fireEvent.keyDown(window, { code: 'Escape' })
    expect(container.textContent).not.toContain('⌨️ 键盘快捷键')
    expect(onClose).not.toHaveBeenCalled() // 先关帮助

    fireEvent.keyDown(window, { code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    // V：无 MV → 无弹窗；L：无歌词数据 → 歌词区始终不渲染
    expect(() => fireEvent.keyDown(window, { code: 'KeyV' })).not.toThrow()
    expect(container.textContent).not.toContain('MV')
    expect(() => fireEvent.keyDown(window, { code: 'KeyL' })).not.toThrow()
    expect(container.querySelector('.max-h-48')).toBeNull() // 歌词容器不出现（无歌词）
  })

  it('遮罩点击（target===currentTarget）→ onClose；点击卡片内部不关闭', async () => {
    const onClose = vi.fn()
    const { container } = render(<EnhancedAudioPlayer isOpen onClose={onClose} />)
    await ready() // 初始化落定，避免挂载期异步 setState 触发 act 告警
    const overlay = container.firstElementChild as HTMLElement

    fireEvent.click(overlay, { target: overlay })
    expect(onClose).toHaveBeenCalledTimes(1)

    const card = overlay.querySelector('.max-w-4xl') as HTMLElement
    fireEvent.click(card, { target: card })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('卸载清理：播放中取消 rAF 帧循环', async () => {
    const { unmount } = render(<EnhancedAudioPlayer isOpen onClose={() => {}} />)
    await ready()
    await act(async () => { h.fire({ isPlaying: true, currentTime: 0, duration: 0, currentTrack: t1 }) })
    expect(raf).toHaveBeenCalled()

    unmount()
    expect(caf).toHaveBeenCalled()
  })
})
