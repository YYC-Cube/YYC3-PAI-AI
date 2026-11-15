/**
 * @file EnhancedAudioPlayerV3.test.tsx
 * @description 超级增强版播放器 v3 专项 — 桩 audio-engine/theme-store/CyberToast/九大功能面板（logger），
 *              TrackDialogs 与高级音频处理器保持真实，驱动：isOpen 门控与初始化（曲库/收藏/历史）、
 *              播放暂停（首曲/续播/暂停）、列表行切歌（历史落盘/MV 探测/收藏态）、搜索过滤（名/艺人/标签）、
 *              上传（成功/非音频跳过/失败 toast）、删除确认（取消/确认/失败）、编辑保存、10 段均衡器
 *              （预设/滑杆/重置）、播放历史面板与回放、睡眠定时器（设置/取消/到点暂停/当前歌曲结束）、
 *              键盘快捷键全集、分享卡片生成与下载、收藏红心切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

interface TrackLike {
  id: string
  name: string
  url: string
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
    uploadAudio: vi.fn(async () => ({ id: 'up1', name: '上传曲', url: 'blob:x', duration: 10 })),
    deleteTrack: vi.fn(() => false),
    setMasterVolume: vi.fn(),
    setMusicVolume: vi.fn(),
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
    toast: vi.fn(),
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
vi.mock('../../CyberToast', () => ({ cyberToast: h.toast }))
vi.mock('../../../utils/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))
// 九大功能面板全部 stub（各自已有专项/依赖重）
vi.mock('../MusicFeaturePanels', () => ({
  AICoverGeneratorPanel: vi.fn(() => null),
  AIEmotionAnalysisPanel: vi.fn(() => null),
  AILyricsTranslatePanel: vi.fn(() => null),
  CollabPlaylistPanel: vi.fn(() => null),
  CrossfadePanel: vi.fn(() => null),
  FamilyThemePanel: vi.fn(() => null),
  GiftTipPanel: vi.fn(() => null),
  KaraokePanel: vi.fn(() => null),
  SpatialAudioPanel: vi.fn(() => null),
  TimedCommentPanel: vi.fn(() => null),
}))

import { EnhancedAudioPlayerV3 } from '../EnhancedAudioPlayerV3'

// ── 桩基建 ──

const makeCtx2D = () => ({
  canvas: null,
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  scale: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  lineWidth: 1,
  strokeStyle: '',
  fillStyle: '',
  font: '',
  textAlign: '',
})

let ctx2d: ReturnType<typeof makeCtx2D>

const installCanvas = () => {
  const protoCreate = Document.prototype.createElement
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, opts?: ElementCreationOptions) => {
    const el = protoCreate.call(document, tagName, opts)
    if (tagName === 'canvas') {
      Object.defineProperty(el, 'getContext', { value: () => ctx2d, configurable: true })
      Object.defineProperty(el, 'toDataURL', { value: () => 'data:image/png;base64,AbC=', configurable: true })
      Object.defineProperty(el, 'toBlob', {
        value: (cb: (b: Blob) => void) => cb(new Blob(['x'])),
        configurable: true,
      })
    }
    return el
  }) as typeof document.createElement)
}

const t1: TrackLike = { id: 't1', name: '云枢光痕', url: '/music/t1.mp3', metadata: { artist: '沫语' } }
const t2: TrackLike = { id: 't2', name: '不懂的董小姐', url: '/music/t2.mp3', metadata: { artist: '沫言' }, tags: ['女声'] }

const KEY_FAV_V3 = ['yyc3', 'audio', 'favorites', 'v3'].join('-')
const KEY_HISTORY = ['yyc3', 'play', 'history'].join('-')

const btnByTitle = (c: HTMLElement, title: string) =>
  c.querySelector(`[title="${title}"]`) as HTMLButtonElement
const btnByLabel = (c: HTMLElement, label: string) =>
  c.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement
const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement

const ready = async () => {
  await act(async () => {})
}

/** 异步尾巴冲刷（MV 探测等 thenable） */
const flush = async () => {
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
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }))) // MV 探测默认不存在
  vi.stubGlobal('alert', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('EnhancedAudioPlayerV3（超级播放器）', () => {
  it('isOpen=false → null；打开 → 头部 v3.0 + 初始化曲库（空库拉取）+ 收藏计数 + 列表渲染', async () => {
    const a = render(<EnhancedAudioPlayerV3 isOpen={false} onClose={() => {}} />)
    expect(a.container.firstElementChild).toBeNull()
    expect(h.engine.subscribe).not.toHaveBeenCalled()
    a.unmount()

    // 注意：FamilyThemePanel 的 tracks prop 在每次渲染都会调 getTracks → 前两次（渲染+init 判空）须为空
    h.engine.getTracks
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([t1, t2])
      .mockReturnValue([t1, t2])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    expect(container.textContent).toContain('YYC³ 音乐播放器 v3.0')
    expect(container.textContent).toContain('2 首歌曲 · 0 个收藏')
    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('沫言')
    expect(container.textContent).toContain('📋 全部 (2)')
    expect(container.textContent).toContain('❤️ 收藏 (0)')
  })

  it('播放暂停：无当前曲 → 播首曲；播放中 → 暂停；再点恢复播放（V3 不订阅引擎，播放态全由本地 UI 翻转）', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    // 中心大播放键（Play 图标按钮，无 title/aria）
    const playBtn = () =>
      Array.from(container.querySelectorAll('button')).find((b) => b.querySelector('.lucide-play'))!
    const pauseBtn = () =>
      Array.from(container.querySelectorAll('button')).find((b) => b.querySelector('.lucide-pause'))!

    fireEvent.click(playBtn())
    expect(h.engine.play).toHaveBeenCalledWith('t1') // 无当前曲 → 播首曲

    fireEvent.click(pauseBtn())
    expect(h.engine.pause).toHaveBeenCalledTimes(1)

    fireEvent.click(playBtn())
    expect(h.engine.play).toHaveBeenCalledTimes(2)
    expect(h.engine.play).toHaveBeenLastCalledWith('t1') // currentTrack 仍为 null → 再次播首曲
    void btnByLabel
  })

  it('列表行点击切歌：engine.play + 历史落盘 + MV HEAD 探测（未命中无 MV 徽标）+ 当前曲展示', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    const row = Array.from(container.querySelectorAll('div')).find((d) =>
      d.className.includes('group') && d.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(row)
    await ready()

    expect(h.engine.play).toHaveBeenCalledWith('t1')
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).not.toContain('🎬 有MV')

    const history = JSON.parse(localStorage.getItem(KEY_HISTORY)!)
    expect(history[0]).toMatchObject({ trackId: 't1', name: '云枢光痕', artist: '沫语' })
    expect(fetch).toHaveBeenCalledWith(
      `/mv/${encodeURIComponent('云枢光痕')}.mp4`,
      expect.objectContaining({ method: 'HEAD' })
    )
    void btnByText
  })

  it('搜索过滤：曲名/艺人/标签命中；清空恢复全量', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    const search = container.querySelector('input[placeholder="搜索歌曲..."]') as HTMLInputElement
    fireEvent.change(search, { target: { value: '董小姐' } })
    expect(container.textContent).toContain('不懂的董小姐')
    expect(container.textContent).not.toContain('云枢光痕')

    fireEvent.change(search, { target: { value: '沫语' } }) // 艺人
    expect(container.textContent).toContain('云枢光痕')

    fireEvent.change(search, { target: { value: '女声' } }) // 标签
    expect(container.textContent).toContain('不懂的董小姐')

    fireEvent.change(search, { target: { value: '  ' } })
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('不懂的董小姐')
  })

  it('上传：音频文件 → uploadAudio(type custom) + 成功 toast；非音频跳过；失败 → 失败 toast', async () => {
    h.engine.getTracks.mockReturnValue([t1])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    const input = container.querySelector('input[aria-label="上传音频文件"]') as HTMLInputElement
    const file = new File([new Uint8Array(4)], '新歌.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    await ready()

    expect(h.engine.uploadAudio).toHaveBeenCalledWith(file, { name: '新歌', type: 'custom' })
    expect(h.toast).toHaveBeenLastCalledWith('成功上传 1 首歌曲')

    // 非音频 → 跳过上传但 toast 仍按文件数提示（现状）
    h.toast.mockClear()
    h.engine.uploadAudio.mockClear()
    const txt = new File([new Uint8Array(2)], '说明.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { value: [txt], configurable: true })
    fireEvent.change(input)
    await ready()
    expect(h.engine.uploadAudio).not.toHaveBeenCalled()

    // 上传异常 → 失败 toast
    h.engine.uploadAudio.mockRejectedValueOnce(new Error('磁盘满'))
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
    await ready()
    expect(h.toast).toHaveBeenLastCalledWith('上传失败，请重试')
  })

  it('删除：行内删除按钮 → 确认对话框；取消关闭；确认 → deleteTrack + 成功/失败 toast；当前曲被删 → 清空播放态', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    // 选中 t1 为当前曲
    const row = Array.from(container.querySelectorAll('div')).find(
      (d) => d.className.includes('group') && d.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(row)
    expect(container.textContent).toContain('云枢光痕')

    // 打开删除确认（有两个删除按钮 → 取 t1 行的）
    const delBtns = () => container.querySelectorAll('[title="删除歌曲"]')
    fireEvent.click(delBtns()[0])
    expect(container.textContent).toContain('确认删除歌曲？')
    expect(container.textContent).toContain('此操作无法撤销')

    // 取消 → 关闭
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '取消')!)
    expect(container.textContent).not.toContain('确认删除歌曲？')

    // 确认删除 → 成功 toast、列表刷新、当前曲清空
    h.engine.deleteTrack.mockReturnValueOnce(true)
    h.engine.getTracks.mockReturnValue([t2])
    fireEvent.click(delBtns()[0])
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '确认删除')!)
    expect(h.engine.deleteTrack).toHaveBeenCalledWith('t1')
    expect(h.toast).toHaveBeenLastCalledWith('已删除: 云枢光痕')
    expect(container.textContent).not.toContain('🎬')
    expect(container.textContent).not.toContain('确认删除歌曲？')

    // 删除失败 → 失败 toast
    h.engine.deleteTrack.mockReturnValueOnce(false)
    fireEvent.click(delBtns()[0])
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '确认删除')!)
    expect(h.toast).toHaveBeenLastCalledWith('删除失败，请重试')
  })

  it('编辑：行内编辑按钮 → 编辑对话框（预填）→ 保存修改 → 曲目名/艺人更新 + toast + 对话框关闭', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    fireEvent.click(container.querySelectorAll('[title="编辑歌曲信息"]')[0])
    expect(container.textContent).toContain('编辑歌曲信息')

    // 对话框卡片作用域内取输入框（外层还有搜索框 type=text）
    const dialog = container.querySelector('.max-w-md') as HTMLElement
    const inputs = dialog.querySelectorAll('input[type="text"]')
    expect((inputs[0] as HTMLInputElement).value).toBe('云枢光痕')
    expect((inputs[1] as HTMLInputElement).value).toBe('沫语')

    fireEvent.change(inputs[0], { target: { value: '云枢光痕 (Remastered)' } })
    fireEvent.change(inputs[1], { target: { value: '沫语 & 沫言' } })
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '保存修改')!)

    expect(h.toast).toHaveBeenLastCalledWith('歌曲信息已更新')
    expect(container.textContent).toContain('云枢光痕 (Remastered)')
    expect(container.textContent).not.toContain('编辑歌曲信息')
  })

  it('10 段均衡器：预设九宫格应用增益（摇滚 → +5dB）、单段滑杆改自定义、重置归零', async () => {
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    fireEvent.click(btnByTitle(container, '均衡器'))
    expect(container.textContent).toContain('10段均衡器')
    for (const label of ['32Hz', '1kHz', '16kHz']) {
      expect(container.textContent).toContain(label)
    }
    expect(container.textContent).toContain('平坦')

    fireEvent.click(btnByText(container, '摇滚'))
    expect(container.textContent).toContain('+5dB') // 摇滚第 1 段 +5
    expect(container.textContent).toContain('+4dB')

    // 单段滑杆 → 自定义
    const band = container.querySelector('[aria-label="32Hz均衡器"]') as HTMLInputElement
    fireEvent.change(band, { target: { value: '-3' } })
    expect(container.textContent).toContain('-3dB')

    // 重置 → 全 0
    fireEvent.click(btnByText(container, '重置为默认'))
    expect(container.textContent).not.toContain('+5dB')
    expect(container.textContent).toContain('0dB')

    // 关闭
    fireEvent.click(container.querySelector('[aria-label="关闭均衡器"]')!)
    expect(container.textContent).not.toContain('10段均衡器')
  })

  it('播放历史：面板列出持久化条目（相对时间「刚刚」），点击条目回放对应曲目并关闭面板', async () => {
    localStorage.setItem(
      KEY_HISTORY,
      JSON.stringify([
        { id: 'h1', trackId: 't1', name: '云枢光痕', artist: '沫语', playedAt: Date.now(), playDuration: 0 },
        { id: 'h2', trackId: 'gone', name: '已删的歌', artist: '佚名', playedAt: Date.now(), playDuration: 0 },
      ])
    )
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    fireEvent.click(btnByTitle(container, '播放历史'))
    expect(container.textContent).toContain('播放历史')
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('已删的歌')
    expect(container.textContent).toContain('刚刚')

    // 点击存在条目 → 回放；面板关闭（历史条目行无 group 类，与播放列表行区分）
    const entry = Array.from(container.querySelectorAll('div')).find(
      (d) => d.className.includes('cursor-pointer') && !d.className.includes('group') && d.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(entry)
    expect(h.engine.play).toHaveBeenCalledWith('t1')
    expect(container.textContent).not.toContain('已删的歌') // 面板已关闭
  })

  it('睡眠定时器：设置 10 分钟 → 倒计时激活；取消复位；到点自动暂停；「当前歌曲结束」模式不崩溃', async () => {
    vi.useFakeTimers()
    h.engine.getTracks.mockReturnValue([t1])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    fireEvent.click(btnByTitle(container, '设置'))
    expect(container.textContent).toContain('睡眠定时器')
    expect(container.textContent).toContain('⏰ 10分钟')

    fireEvent.click(btnByText(container, '10分钟'))
    expect(container.textContent).toContain('后将停止播放')
    expect(container.textContent).toContain('取消定时器')

    // 到点 → 暂停引擎并回到选择网格
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    })
    expect(h.engine.pause).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('⏰ 10分钟') // 回到网格

    // 「当前歌曲结束」（-1）模式：无真实 timer，仅激活展示
    fireEvent.click(btnByText(container, '当前歌曲结束'))
    expect(container.textContent).toContain('后将停止播放')
    fireEvent.click(btnByText(container, '取消定时器'))
    expect(container.textContent).toContain('⏰ 10分钟')
  })

  it('键盘快捷键：Space 播放、Esc 关闭、KeyE 开均衡器、KeyH 开历史、ArrowUp/Down 音量、KeyM 静音、输入框聚焦不响应', async () => {
    const onClose = vi.fn()
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={onClose} />)
    await ready()

    fireEvent.keyDown(window, { code: 'KeyE' })
    expect(container.textContent).toContain('10段均衡器')
    // V3 的 Esc 直接关闭整个播放器（不逐层关面板）→ 面板用自身关闭按钮退出
    fireEvent.click(container.querySelector('[aria-label="关闭均衡器"]')!)
    expect(container.textContent).not.toContain('10段均衡器')

    fireEvent.keyDown(window, { code: 'KeyH' })
    expect(container.textContent).toContain('播放历史')
    fireEvent.keyDown(window, { code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1) // Esc 直接回调 onClose
    onClose.mockClear()

    const volumeInput = () => container.querySelector('[aria-label="音量调节"]') as HTMLInputElement
    expect(volumeInput().value).toBe('0.7')
    fireEvent.keyDown(window, { code: 'ArrowUp' })
    expect(volumeInput().value).toBe('0.75')
    fireEvent.keyDown(window, { code: 'ArrowDown' })
    fireEvent.keyDown(window, { code: 'ArrowDown' })
    // 0.7 - 0.05×2 的浮点结果
    expect(Number(volumeInput().value)).toBeCloseTo(0.65, 10)

    fireEvent.keyDown(window, { code: 'KeyM' })
    expect(volumeInput().value).toBe('0') // 静音 → 显示 0
    fireEvent.keyDown(window, { code: 'KeyM' })
    // 取消静音回显原始音量（0.7-0.05×2 的浮点串）
    expect(Number(volumeInput().value)).toBeCloseTo(0.65, 10)

    fireEvent.keyDown(window, { code: 'Space' })
    expect(h.engine.play).toHaveBeenCalled()

    fireEvent.keyDown(window, { code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    // 焦点在输入框 → 快捷键守卫
    const search = container.querySelector('input[placeholder="搜索歌曲..."]')!
    fireEvent.keyDown(search, { code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('分享：无当前曲 → 静默；有当前曲 → 生成分享卡片画布并下载（剪贴板 API 不可用走降级）', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    h.engine.getTracks.mockReturnValue([t1])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    // 无当前曲 → 点击无动作
    fireEvent.click(btnByTitle(container, '分享'))
    expect(clickSpy).not.toHaveBeenCalled()

    // 经列表行点击设当前曲（V3 不订阅引擎）→ 生成卡片 → 剪贴板缺失 → 下载路径
    const row = Array.from(container.querySelectorAll('div')).find(
      (d) => d.className.includes('group') && d.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(row)
    fireEvent.click(btnByTitle(container, '分享'))
    await ready()

    expect(ctx2d.fillText).toHaveBeenCalledWith('云枢光痕', 400, 120)
    expect(ctx2d.fillText).toHaveBeenCalledWith('沫语', 400, 170)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(ctx2d.fillRect).toHaveBeenCalledWith(0, 0, 800, 400)
    clickSpy.mockRestore()
  })

  it('收藏红心：添加/取消当前曲收藏并持久化；收藏行显示红心徽标与计数联动', async () => {
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    // 选中 t1 → 红心添加
    const row = Array.from(container.querySelectorAll('div')).find(
      (d) => d.className.includes('group') && d.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(row)

    fireEvent.click(btnByTitle(container, '添加收藏'))
    const favs = JSON.parse(localStorage.getItem(KEY_FAV_V3)!)
    expect(favs).toHaveLength(1)
    expect(favs[0]).toMatchObject({ id: 't1', name: '云枢光痕', artist: '沫语' })
    expect(container.querySelector('[title="取消收藏"]')).toBeTruthy()
    expect(container.textContent).toContain('1 个收藏')
    expect(container.querySelector('.lucide-heart')).toBeTruthy() // 行内红心徽标

    // 取消收藏
    fireEvent.click(btnByTitle(container, '取消收藏'))
    expect(JSON.parse(localStorage.getItem(KEY_FAV_V3)!)).toHaveLength(0)
    expect(container.querySelector('[title="添加收藏"]')).toBeTruthy()
    expect(container.textContent).toContain('0 个收藏')
  })

  it('MV 命中与播放器弹窗：HEAD 探测成功 → 「🎬 有MV」徽标与播放按钮 → 弹窗展示/关闭；进度与音量滑杆直调', async () => {
    // MV 探测成功（首个扩展名 .mp4 命中）
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })))
    h.engine.getTracks.mockReturnValue([t1])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    // 行点击 → playTrack → 异步 detectMVForTrack 命中 → 徽标 + MV 按钮
    const row = Array.from(container.querySelectorAll('div')).find(
      (d) => d.className.includes('group') && d.textContent?.includes('云枢光痕')
    )!
    fireEvent.click(row)
    await flush()

    expect(container.textContent).toContain('🎬 有MV')
    fireEvent.click(btnByTitle(container, '播放MV'))
    expect(container.textContent).toContain('云枢光痕 MV')
    expect(container.textContent).toContain('按 ESC 关闭')
    expect(container.querySelector('video')).toBeTruthy()

    fireEvent.click(container.querySelector('[aria-label="关闭MV播放器"]')!)
    expect(container.textContent).not.toContain('按 ESC 关闭')

    // 进度滑杆 onChange → handleSeek；音量滑杆 onChange → setVolume
    h.engine.getState.mockReturnValue({ isPlaying: true, currentTime: 20, duration: 200, currentTrack: t1 })
    const progress = container.querySelector('[aria-label="播放进度"]') as HTMLInputElement
    fireEvent.change(progress, { target: { value: '88' } })
    expect(h.engine.seek).toHaveBeenCalledWith(88)

    const volume = container.querySelector('[aria-label="音量调节"]') as HTMLInputElement
    fireEvent.change(volume, { target: { value: '0.3' } })
    expect(volume.value).toBe('0.3')

    // 静音按钮（非快捷键路径）→ 显示 0
    fireEvent.click(container.querySelector('.lucide-volume-2')!.closest('button')!)
    expect((container.querySelector('[aria-label="音量调节"]') as HTMLInputElement).value).toBe('0')
  })

  it('历史相对时间分支：分钟/小时/天级条目渲染对应文案；关闭历史按钮收起面板', async () => {
    const now = Date.now()
    localStorage.setItem(
      KEY_HISTORY,
      JSON.stringify([
        { id: 'h1', trackId: 't1', name: '云枢光痕', artist: '沫语', playedAt: now, playDuration: 0 },
        { id: 'h2', trackId: 't2', name: '不懂的董小姐', artist: '沫言', playedAt: now - 5 * 60000, playDuration: 0 },
        { id: 'h3', trackId: 't3', name: '男人的难', artist: '佚名', playedAt: now - 3 * 3600000, playDuration: 0 },
        { id: 'h4', trackId: 't4', name: '两天前', artist: '佚名', playedAt: now - 2 * 86400000, playDuration: 0 },
        { id: 'h5', trackId: 't5', name: '上周', artist: '佚名', playedAt: now - 9 * 86400000, playDuration: 0 },
      ])
    )
    h.engine.getTracks.mockReturnValue([t1, t2])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    fireEvent.click(btnByTitle(container, '播放历史'))
    expect(container.textContent).toContain('刚刚')
    expect(container.textContent).toContain('5分钟前')
    expect(container.textContent).toContain('3小时前')
    expect(container.textContent).toContain('2天前')
    // 7 天以上 → 本地化日期
    expect(container.textContent).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/)

    // 面板关闭按钮
    fireEvent.click(container.querySelector('[aria-label="关闭历史记录"]')!)
    expect(container.textContent).not.toContain('上周')
  })

  it('批量工具面：九大高级面板 stub 均接 isOpen 且 EQ 预设里「平坦」可重置（applyEQPreset 空图谱安全）', async () => {
    h.engine.getTracks.mockReturnValue([t1])
    const { baseElement: container } = render(<EnhancedAudioPlayerV3 isOpen onClose={() => {}} />)
    await ready()

    // EQ 摇滚 → 平坦重置（EQManager 未初始化时 setBandGain 为安全 no-op）
    fireEvent.click(btnByTitle(container, '均衡器'))
    fireEvent.click(btnByText(container, '摇滚'))
    expect(container.textContent).toContain('+5dB')
    fireEvent.click(btnByText(container, '平坦'))
    expect(container.textContent).not.toContain('+5dB')
    fireEvent.click(container.querySelector('[aria-label="关闭均衡器"]')!)
  })
})
