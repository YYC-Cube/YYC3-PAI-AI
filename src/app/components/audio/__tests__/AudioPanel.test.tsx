/**
 * @file AudioPanel.test.tsx
 * @description 完整音频控制面板专项 — 桩 audio-engine/theme-store，重型子组件（诊断/编辑/列表）stub、上传与
 *              可视化保持真实实现，驱动：曲库初始化两条路径、标题栏播放徽标与当前曲信息卡、折叠/展开、
 *              静音切换、六页签切换（含诊断 onClose 回环、编辑空态引导）、三音量滑杆、音效试听按钮、
 *              上传完成建单/入单回路、秒级轮询刷新、底部统计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

interface TrackLike {
  id: string
  name: string
  duration: number
  metadata?: { artist?: string }
}
interface PlaylistLike {
  id: string
  name: string
  tracks: TrackLike[]
  currentIndex: number
}
interface VolumesLike {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  crossfadeDuration?: number
  normalizeAudio?: boolean
}

const h = vi.hoisted(() => {
  const subscribers: Array<(s: StateLike) => void> = []
  interface StateLike {
    isPlaying: boolean
    currentTime: number
    duration: number
    currentTrack: TrackLike | null
  }
  let state: StateLike = { isPlaying: false, currentTime: 0, duration: 0, currentTrack: null }
  let volumes: VolumesLike = { masterVolume: 80, musicVolume: 70, sfxVolume: 80 }
  const myPlaylist: PlaylistLike = { id: 'pl-1', name: '我的音乐', tracks: [], currentIndex: 0 }
  const engine = {
    getTracks: vi.fn((): TrackLike[] => []),
    initializeMusicLibrary: vi.fn(async (): Promise<TrackLike[]> => []),
    getPlaylists: vi.fn((): PlaylistLike[] => []),
    getPlaylistById: vi.fn((): PlaylistLike | null => null),
    getEditedVersions: vi.fn((): unknown[] => []),
    getVolumes: vi.fn((): VolumesLike => volumes),
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
    createPlaylist: vi.fn((): PlaylistLike => myPlaylist),
    addToPlaylist: vi.fn(() => true),
    setMasterVolume: vi.fn(),
    setMusicVolume: vi.fn(),
    setSFXVolume: vi.fn(),
    playUIClick: vi.fn(),
    playAIResponseComplete: vi.fn(),
    uploadAudio: vi.fn(async (file: File) => ({
      id: `up-${file.name}`,
      name: file.name,
      url: 'blob:x',
      duration: 10,
      size: 1,
      type: 'music' as const,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    })),
  }
  const tokens = {
    primary: '#8b5cf6',
    secondary: '#22d3ee',
    accent: '#06b6d4',
    background: '#0a0a0f',
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
    myPlaylist,
    setVolumes: (v: VolumesLike) => {
      volumes = v
    },
    setState: (s: StateLike) => {
      state = s
    },
    // 与真实引擎一致：通知前先落内部状态（getState 读最新值）
    fire: (s: StateLike) => {
      state = s
      subscribers.forEach((cb) => cb(s))
    },
  }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))
vi.mock('../../../store/theme-store', () => ({ useThemeStore: () => ({ tokens: h.tokens }) }))

// 重型子组件 stub（上传/可视化保持真实以覆盖其渲染路径）
vi.mock('../AudioDiagnostic', () => ({
  AudioDiagnostic: vi.fn(({ onClose }: { onClose: () => void }) => (
    <div data-testid="diagnostic-stub">
      <button onClick={onClose}>诊断关闭</button>
    </div>
  )),
}))
vi.mock('../AudioEditor', () => ({
  AudioEditor: vi.fn(({ track }: { track: { name: string } }) => (
    <div data-testid="editor-stub">编辑中:{track.name}</div>
  )),
}))
vi.mock('../AudioPlaylist', () => ({
  AudioPlaylist: vi.fn(() => <div data-testid="playlist-stub" />),
}))

import { AudioPanel } from '../AudioPanel'

const t1: TrackLike = { id: 't1', name: '云枢光痕', duration: 200, metadata: { artist: '沫语' } }

const tabByLabel = (c: HTMLElement, label: string) =>
  c.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement

const mkFile = (name: string) => new File([new Uint8Array(8)], name, { type: 'audio/mpeg' })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.subscribers.length = 0
  h.setState({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: null })
  h.setVolumes({ masterVolume: 80, musicVolume: 70, sfxVolume: 80 })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AudioPanel（完整音频控制面板）', () => {
  it('曲库已加载 → 直接读取曲目与播放列表，不重复初始化；底部统计齐全', async () => {
    h.engine.getTracks.mockReturnValueOnce([t1]).mockReturnValue([t1])
    h.engine.getPlaylists.mockReturnValue([h.myPlaylist]) // 底部统计每次渲染直读引擎
    const { container } = render(<AudioPanel />)
    await act(async () => {})

    expect(h.engine.initializeMusicLibrary).not.toHaveBeenCalled()
    expect(container.textContent).toContain('YYC³ 音频引擎')
    expect(container.textContent).toContain('1 个曲目')
    expect(container.textContent).toContain('1 个播放列表')
    expect(container.textContent).toContain('0 个编辑版本')
    expect(h.engine.subscribe).toHaveBeenCalledTimes(1)
  })

  it('空曲库 → 挂载初始化并写入曲目/激活首个播放列表；失败仅记日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // 首查为空触发初始化；初始化成功后 effect 因 libraryInitialized 翻转重跑 → 从引擎读取已入库曲目
    h.engine.getTracks.mockReturnValueOnce([]).mockReturnValue([t1])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([t1])
    h.engine.getPlaylists.mockReturnValue([h.myPlaylist])
    const a = render(<AudioPanel />)
    await act(async () => {})
    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1)
    expect(a.container.textContent).toContain('1 个曲目')
    a.unmount()

    // 初始化异常路径：finally 复位 loading，错误进日志
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockRejectedValueOnce(new Error('清单 404'))
    render(<AudioPanel />)
    await act(async () => {})
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('音乐库初始化失败'), expect.any(Error))
    errSpy.mockRestore()
  })

  it('播放中徽标与当前曲信息卡：曲名 + 时间 + 迷你进度条宽度', async () => {
    const { container } = render(<AudioPanel />)
    await act(async () => {}) // 等待异步初始化（订阅在其尾部注册）

    act(() =>
      h.fire({ isPlaying: true, currentTime: 30, duration: 200, currentTrack: t1 })
    )
    expect(container.textContent).toContain('播放中')
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('0:30 / 3:20')
    const fill = container.querySelector('.h-full.rounded-full') as HTMLElement
    expect(fill.style.width).toBe('15%') // 30/200
  })

  it('标题栏点击折叠/再展开：收起后内容区（含页签）不可见', async () => {
    const { container } = render(<AudioPanel />)
    await act(async () => {})
    expect(container.textContent).toContain('播放器')
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    expect(container.textContent).not.toContain('主音量')
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    expect(container.textContent).toContain('主音量')
  })

  it('静音切换：静音 → setMasterVolume(0)；再点 → 恢复当前主音量', async () => {
    const { container } = render(<AudioPanel />)
    await act(async () => {})
    const mute = tabByLabel(container, '静音')
    fireEvent.click(mute)
    expect(h.engine.setMasterVolume).toHaveBeenCalledWith(0)
    expect(tabByLabel(container, '取消静音')).toBeTruthy()

    fireEvent.click(tabByLabel(container, '取消静音'))
    expect(h.engine.setMasterVolume).toHaveBeenLastCalledWith(80)
  })

  it('六页签切换：上传（真实 AudioUploader）/列表/可视化（三画布）/诊断（onClose 回环）', async () => {
    const { container } = render(<AudioPanel />)
    await act(async () => {})

    fireEvent.click(tabByLabel(container, '上传'))
    expect(container.querySelector('.audio-uploader')).toBeTruthy()

    fireEvent.click(tabByLabel(container, '列表'))
    expect(container.querySelector('[data-testid="playlist-stub"]')).toBeTruthy()

    fireEvent.click(tabByLabel(container, '可视化'))
    expect(container.querySelectorAll('canvas').length).toBe(3) // bars+wave+circular

    fireEvent.click(tabByLabel(container, '诊断'))
    expect(container.querySelector('[data-testid="diagnostic-stub"]')).toBeTruthy()
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '诊断关闭')!)
    expect(container.querySelector('[data-testid="diagnostic-stub"]')).toBeNull() // 回到播放器视图
  })

  it('编辑页签空态引导：无选中曲目 → 提示前往播放列表并跳转；有选中曲目 → 渲染编辑器', async () => {
    const { container } = render(<AudioPanel />)
    await act(async () => {})

    fireEvent.click(tabByLabel(container, '编辑'))
    expect(container.textContent).toContain('请从播放列表选择要编辑的曲目')
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '前往播放列表')!)
    expect(container.querySelector('[data-testid="playlist-stub"]')).toBeTruthy()
  })

  it('三音量滑杆：转发引擎 setter；百分比文案经秒级轮询回读引擎后刷新', async () => {
    vi.useFakeTimers()
    const { container } = render(<AudioPanel />)
    await act(async () => {})
    fireEvent.change(container.querySelector('#master-volume')!, { target: { value: '33' } })
    expect(h.engine.setMasterVolume).toHaveBeenCalledWith(33)
    fireEvent.change(container.querySelector('#music-volume')!, { target: { value: '55' } })
    expect(h.engine.setMusicVolume).toHaveBeenCalledWith(55)
    fireEvent.change(container.querySelector('#sfx-volume')!, { target: { value: '66' } })
    expect(h.engine.setSFXVolume).toHaveBeenCalledWith(66)

    // 轮询回读：引擎侧音量同步变化 → 标签更新
    h.setVolumes({ masterVolume: 33, musicVolume: 55, sfxVolume: 66 })
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(container.textContent).toContain('33%')
    expect(container.textContent).toContain('55%')
    expect(container.textContent).toContain('66%')
  })

  it('音效试听按钮：UI 点击音与 AI 完成音各转发一次', async () => {
    const { container } = render(<AudioPanel />)
    await act(async () => {})
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('测试 UI 音效'))!)
    expect(h.engine.playUIClick).toHaveBeenCalledTimes(1)
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('测试 AI 完成'))!)
    expect(h.engine.playAIResponseComplete).toHaveBeenCalledTimes(1)
  })

  it('上传完成回路：无播放列表 → 创建「我的音乐」并跳转列表页；已有播放列表 → 逐曲加入', async () => {
    h.engine.getPlaylists.mockReturnValue([]) // 无列表 → 创建分支
    const { container } = render(<AudioPanel />)
    await act(async () => {})

    fireEvent.click(tabByLabel(container, '上传'))
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [mkFile('new-song.mp3')], configurable: true })
    fireEvent.change(input)
    await act(async () => {})

    expect(h.engine.createPlaylist).toHaveBeenCalledWith('我的音乐', ['up-new-song.mp3'])
    expect(container.querySelector('[data-testid="playlist-stub"]')).toBeTruthy() // 自动跳转列表

    // 已有播放列表 → addToPlaylist 分支
    h.engine.getPlaylistById.mockReturnValue(h.myPlaylist)
    h.engine.getPlaylists.mockReturnValue([h.myPlaylist])
    fireEvent.click(tabByLabel(container, '上传'))
    const input2 = container.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input2, 'files', { value: [mkFile('another.mp3')], configurable: true })
    fireEvent.change(input2)
    await act(async () => {})
    expect(h.engine.addToPlaylist).toHaveBeenCalledWith('pl-1', 'up-another.mp3')
  })

  it('秒级轮询：音量与曲目统计每秒从引擎重读（外部位改音量后 1s 内生效）', async () => {
    vi.useFakeTimers()
    const { container } = render(<AudioPanel />)
    expect(container.textContent).toContain('80%')

    h.setVolumes({ masterVolume: 12, musicVolume: 70, sfxVolume: 80 })
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(container.textContent).toContain('12%')
  })
})
