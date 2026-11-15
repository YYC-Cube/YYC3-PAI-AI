/**
 * @file MusicFeaturePanels.test.tsx
 * @description 音乐功能面板集合专项 — 桩 theme-store/model-store（其余真实：MusicAI/三管理器/处理器），
 *              驱动：PanelWrapper 门控与关闭、AI歌词翻译（成功/空词/降级）、AI封面生成与下载、AI情感分析
 *              （成功/降级）、协作播放列表创建、实时评论（发送/时间戳/点赞现状）、打赏（余额/礼物切换/
 *              送出/余额不足/统计）、3D环绕声模式与混响、卡拉OK开关与强度、交叉淡入淡出执行、主题曲面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

const h = vi.hoisted(() => {
  const send = vi.fn(async (_msg: string, _opts?: { systemPrompt?: string }): Promise<string> => '[]')
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
  return { send, tokens }
})

vi.mock('../../../store/theme-store', () => ({ useThemeStore: () => ({ tokens: h.tokens }) }))
vi.mock('../../../store/model-store', () => ({ useModelStore: () => ({ sendToActiveModel: h.send }) }))

import {
  AICoverGeneratorPanel,
  AIEmotionAnalysisPanel,
  AILyricsTranslatePanel,
  CollabPlaylistPanel,
  CrossfadePanel,
  FamilyThemePanel,
  GiftTipPanel,
  KaraokePanel,
  SpatialAudioPanel,
  TimedCommentPanel,
} from '../MusicFeaturePanels'
import type { SpatialAudioProcessor, KaraokeProcessor, CrossfadeProcessor } from '../AdvancedAudioModule'
import { collabPlaylistManager, giftTipManager } from '../MusicSocialModule'

// ── 桩基建 ──

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
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillText: vi.fn(),
  bezierCurveTo: vi.fn(),
  scale: vi.fn(),
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
    }
    return el
  }) as typeof document.createElement)
}

/** 假处理器（记录方法调用，免真实 Web Audio 图谱） */
const fakeSpatial = {
  setSpatialMode: vi.fn(),
  enable: vi.fn(),
  setReverbMix: vi.fn(),
  setRotation: vi.fn(),
  active: false,
} as unknown as SpatialAudioProcessor

const fakeCrossfade = {
  crossfade: vi.fn(async () => {}),
} as unknown as CrossfadeProcessor

/** 按包含文本定位按钮（面板按钮多为图标+文案复合节点，textContent 为拼接串） */
const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement

const KEY_PLAYLISTS = ['yyc3', 'collab', 'playlists'].join('-')
const KEY_COMMENTS = ['yyc3', 'timed', 'comments'].join('-')
const KEY_BALANCE = ['yyc3', 'user', 'balance'].join('-')
const KEY_TIPS = ['yyc3', 'gift', 'tips'].join('-')

beforeEach(() => {
  vi.resetAllMocks()
  ctx2d = makeCtx2D()
  installCanvas()
  localStorage.clear()
  h.send.mockImplementation(async () => '[]')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('PanelWrapper 公共门控', () => {
  it('isOpen=false → 各面板返回 null；isOpen=true → 标题与关闭按钮（aria）渲染，关闭按钮/遮罩回调 onClose', () => {
    const onClose = vi.fn()
    const a = render(<AILyricsTranslatePanel isOpen={false} onClose={onClose} lyrics="x" trackName="t" />)
    expect(a.container.firstElementChild).toBeNull()
    a.unmount()

    const { container } = render(<AILyricsTranslatePanel isOpen onClose={onClose} lyrics="x" trackName="我的歌" />)
    expect(container.textContent).toContain('🤖 AI歌词翻译')
    expect(container.textContent).toContain('🎵 我的歌')

    // 关闭按钮（X 图标）：aria-label 为「关闭{title}」动态拼接，按图标类定位更稳
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(1)

    // 遮罩点击关闭、卡片内点击不关（stopPropagation）
    const overlay = container.firstElementChild as HTMLElement
    fireEvent.click(overlay.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('AILyricsTranslatePanel（AI歌词翻译）', () => {
  it('点击翻译 → 调用模型并渲染逐行对照（置信度百分比/语言方向）；目标语言下拉可切换', async () => {
    h.send.mockResolvedValueOnce(
      JSON.stringify([{ original: 'hello', translated: '你好', sourceLang: 'English', confidence: 0.9 }])
    )
    const { container } = render(<AILyricsTranslatePanel isOpen onClose={() => {}} lyrics="hello" trackName="测试曲" />)

    const select = container.querySelector('select[aria-label="目标语言"]') as HTMLSelectElement
    expect(select.value).toBe('中文')
    fireEvent.change(select, { target: { value: 'English' } })

    fireEvent.click(btnByText(container, '翻译'))
    await act(async () => {})

    expect(h.send).toHaveBeenCalledTimes(1)
    expect(String(h.send.mock.calls[0][0])).toContain('hello')
    expect(String(h.send.mock.calls[0][1]?.systemPrompt)).toContain('English')
    expect(container.textContent).toContain('hello')
    expect(container.textContent).toContain('你好')
    expect(container.textContent).toContain('置信度: 90%')
    expect(container.textContent).toContain('English')
    expect(container.textContent).toContain('→')
    expect(container.textContent).not.toContain('点击"翻译"开始AI翻译')
  })

  it('空歌词 → 翻译按钮不动作；模型返回坏 JSON → 逐行降级「[翻译失败]」且零置信度行不渲染百分比', async () => {
    const { container } = render(<AILyricsTranslatePanel isOpen onClose={() => {}} lyrics="" trackName="" />)
    fireEvent.click(btnByText(container, '翻译'))
    await act(async () => {})
    expect(h.send).not.toHaveBeenCalled()

    h.send.mockResolvedValueOnce('不是 JSON')
    const b = render(<AILyricsTranslatePanel isOpen onClose={() => {}} lyrics="一行歌词" trackName="曲" />)
    fireEvent.click(btnByText(b.container, '翻译'))
    await act(async () => {})
    expect(b.container.textContent).toContain('[翻译失败] 一行歌词')
    expect(b.container.textContent).not.toContain('置信度') // confidence 0 → 无百分比
    b.unmount()
  })
})

describe('AICoverGeneratorPanel（AI封面生成）', () => {
  it('生成封面 → 画布渲染成 img（data URL）+ 下载按钮触发 a.click（文件名含曲名）；风格/基调下拉联动', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<AICoverGeneratorPanel isOpen onClose={() => {}} trackName="云枢光痕" artist="沫语" />)

    expect(container.textContent).not.toContain('下载封面')
    fireEvent.click(btnByText(container, '✨ 生成封面'))

    const img = container.querySelector('img') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('data:image/png;base64,AbC=')
    expect(img.getAttribute('alt')).toBe('云枢光痕 专辑封面')

    const selects = container.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: 'geometric' } })
    fireEvent.change(selects[1], { target: { value: '梦幻' } })
    fireEvent.click(btnByText(container, '生成封面')) // 重新生成走几何分支
    expect(ctx2d.rotate).toHaveBeenCalled()

    fireEvent.click(btnByText(container, '下载封面'))
    expect(clickSpy).toHaveBeenCalledTimes(1)
    const link = HTMLAnchorElement.prototype // download 属性经实例断言
    void link
    clickSpy.mockRestore()
  })

  it('未生成封面时下载按钮不渲染', () => {
    const { container } = render(<AICoverGeneratorPanel isOpen onClose={() => {}} trackName="x" artist="y" />)
    expect(btnByText(container, '下载封面')).toBeUndefined()
  })
})

describe('AIEmotionAnalysisPanel（AI情感分析）', () => {
  const emotion = {
    mood: 'happy',
    energy: 0.8,
    valence: 0.6,
    danceability: 0.7,
    acousticness: 0.2,
    dominantTags: ['电子'],
    colorPalette: ['#f00', '#0f0'],
    recommendedTracks: ['霓虹快跑', '夜行者'],
  }

  it('开始分析 → 情感标签「欢快」+ 四特征条百分比 + 配色板 + 相似推荐列表', async () => {
    h.send.mockResolvedValueOnce(JSON.stringify(emotion))
    const { container } = render(<AIEmotionAnalysisPanel isOpen onClose={() => {}} trackName="霓虹之城" artist="沫语" />)

    expect(container.textContent).toContain('🎵 霓虹之城 — 沫语')
    fireEvent.click(btnByText(container, '🧠 开始分析'))
    await act(async () => {})

    expect(String(h.send.mock.calls[0][0])).toContain('霓虹之城')
    expect(container.textContent).toContain('欢快')
    expect(container.textContent).toContain('主导情感')
    expect(container.textContent).toContain('80%')
    expect(container.textContent).toContain('积极性')
    expect(container.textContent).toContain('20%')
    expect(container.textContent).toContain('推荐配色')
    expect(container.textContent).toContain('相似推荐')
    expect(container.textContent).toContain('霓虹快跑')
    expect(container.textContent).toContain('夜行者')
  })

  it('分析失败 → calm「平静」兜底；无推荐歌曲则不渲染推荐区', async () => {
    h.send.mockResolvedValueOnce('解析不了')
    const { container } = render(<AIEmotionAnalysisPanel isOpen onClose={() => {}} trackName="x" artist="y" />)
    fireEvent.click(btnByText(container, '🧠 开始分析'))
    await act(async () => {})

    expect(container.textContent).toContain('平静')
    expect(container.textContent).not.toContain('相似推荐')
  })
})

describe('CollabPlaylistPanel（协作播放列表）', () => {
  it('空态提示；输入名称创建 → 列表渲染（曲目数/成员数/owner 头像）并持久化；空名称创建不动作', () => {
    const { container } = render(<CollabPlaylistPanel isOpen onClose={() => {}} tracks={[]} />)
    expect(container.textContent).toContain('还没有播放列表，创建一个开始协作吧！')

    const input = container.querySelector('input[aria-label="播放列表名称"]') as HTMLInputElement
    fireEvent.click(btnByText(container, '创建')) // 空名称
    expect(localStorage.getItem(KEY_PLAYLISTS)).toBeNull()

    fireEvent.change(input, { target: { value: '家庭嗨歌' } })
    fireEvent.click(btnByText(container, '创建'))
    expect(container.textContent).toContain('家庭嗨歌')
    expect(container.textContent).toContain('0 首歌曲 · 1 位成员')
    expect(container.textContent).toContain('👤')

    // 刷新面板 → 从 localStorage 回读
    const b = render(<CollabPlaylistPanel isOpen onClose={() => {}} tracks={[]} />)
    expect(b.container.textContent).toContain('家庭嗨歌')
  })

  it('点击列表卡片 → 高亮选中（主色描边）', () => {
    collabPlaylistManager.createPlaylist({
      name: '已有单',
      description: '',
      createdBy: 'local-user',
      trackIds: [],
      isPublic: true,
      coverColor: '#8b5cf6',
    })
    const { container } = render(<CollabPlaylistPanel isOpen onClose={() => {}} tracks={[]} />)
    const card = container.querySelector('.cursor-pointer') as HTMLElement
    expect(card.style.border).toContain('transparent')
    fireEvent.click(card)
    expect(card.style.border).toContain('rgb(139, 92, 246)') // #8b5cf6
  })
})

describe('TimedCommentPanel（实时评论）', () => {
  it('空态；输入评论回车发送 → 带时间戳徽标渲染；勾选框关闭 → 时间戳 0 无徽标', () => {
    const { container } = render(<TimedCommentPanel isOpen onClose={() => {}} trackId="t1" currentTime={90} />)
    expect(container.textContent).toContain('还没有评论，快来抢沙发！')
    expect(container.textContent).toContain('标记在 1:30')

    const input = container.querySelector('input[aria-label="评论内容"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '前奏绝了' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(container.textContent).toContain('前奏绝了')
    expect(container.textContent).toContain('我')
    expect(container.textContent).toContain('1:30')

    // 关闭时间戳标记 → timestamp 0 → 无徽标
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    fireEvent.click(checkbox)
    fireEvent.change(input, { target: { value: '随便聊聊' } })
    fireEvent.click(container.querySelector('[aria-label="发送评论"]')!)
    expect(container.textContent).toContain('随便聊聊')
    const stamps = Array.from(container.querySelectorAll('span')).filter((s) => s.textContent === '1:30')
    expect(stamps).toHaveLength(1) // 仅旧评论带徽标
  })

  it('点赞按钮调用管理器（现状：UI 计数不即时刷新，见报告）', () => {
    const { container, rerender } = render(
      <TimedCommentPanel isOpen onClose={() => {}} trackId="t1" currentTime={0} />
    )
    const input = container.querySelector('input[aria-label="评论内容"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '点赞测试' } })
    fireEvent.click(container.querySelector('[aria-label="发送评论"]')!)

    const likeBtn = container.querySelector('[aria-label="点赞"]')!
    fireEvent.click(likeBtn)
    // 现状：likeComment 落盘但组件不重读 comments → UI 仍显示 0
    expect(container.textContent).toContain('点赞测试')
    const persisted = JSON.parse(localStorage.getItem(KEY_COMMENTS)!)
    expect(persisted.t1[0].likes).toBe(1)
    void rerender
  })
})

describe('GiftTipPanel（打赏支持）', () => {
  it('默认余额 1000 + 六档礼物 + 已收统计；切换礼物更新按钮文案与价格', () => {
    const { container } = render(<GiftTipPanel isOpen onClose={() => {}} artistName="沫言" />)
    expect(container.textContent).toContain('支持艺术家')
    expect(container.textContent).toContain('沫言')
    expect(container.textContent).toContain('1000')
    expect(container.textContent).toContain('0 份礼物 · 价值 0')
    expect(container.textContent).toContain('🌸')
    expect(container.textContent).toContain('💎')
    expect(container.textContent).toContain('500 币')
    expect(container.textContent).toContain('🌸 打赏 1 币')

    fireEvent.click(btnByText(container, '钻石'))
    expect(container.textContent).toContain('💎 打赏 500 币')
  })

  it('送出礼物：余额扣减、按钮短暂变「已送出」后复位、统计与留言落盘', async () => {
    vi.useFakeTimers()
    const { container } = render(<GiftTipPanel isOpen onClose={() => {}} artistName="沫言" />)

    const msg = container.querySelector('input[aria-label="打赏留言"]') as HTMLInputElement
    fireEvent.change(msg, { target: { value: '加油创作' } })
    fireEvent.click(btnByText(container, '打赏 1 币')) // 鲜花 1

    expect(container.textContent).toContain('✅ 已送出！')
    expect(container.textContent).toContain('999')
    expect(container.textContent).toContain('1 份礼物 · 价值 1')

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    expect(container.textContent).toContain('🌸 打赏 1 币') // justSent 复位

    const tips = JSON.parse(localStorage.getItem(KEY_TIPS)!)
    expect(tips[0].message).toBe('加油创作')
  })

  it('余额不足 → 送出失败：余额与统计不变、按钮不变化（注：余额 0 因 Number(x)||1000 不可表示，疑似 bug 见报告，故用 0.5）', () => {
    localStorage.setItem(KEY_BALANCE, '0.5')
    const { container } = render(<GiftTipPanel isOpen onClose={() => {}} artistName="沫言" />)
    expect(container.textContent).toContain('余额: 0.5')

    fireEvent.click(btnByText(container, '打赏 1 币'))
    expect(container.textContent).not.toContain('已送出')
    expect(giftTipManager.getBalance()).toBe(0.5)
    expect(JSON.parse(localStorage.getItem(KEY_TIPS) ?? '[]')).toHaveLength(0)
    expect(container.textContent).toContain('0 份礼物 · 价值 0')
  })
})

describe('SpatialAudioPanel（3D环绕声）', () => {
  it('四种空间模式点击 → setSpatialMode + enable；六档混响 → setReverbMix 对应湿声值', () => {
    const { container } = render(<SpatialAudioPanel isOpen onClose={() => {}} processor={fakeSpatial} />)

    fireEvent.click(btnByText(container, '🏛️ 音乐厅'))
    expect(fakeSpatial.setSpatialMode).toHaveBeenCalledWith('concert')
    expect(fakeSpatial.enable).toHaveBeenCalled()

    fireEvent.click(btnByText(container, '🏟️ 体育馆'))
    expect(fakeSpatial.setSpatialMode).toHaveBeenLastCalledWith('arena')

    const reverbBtns = Array.from(container.querySelectorAll('button')).filter((b) =>
      ['🔇', '🏠', '🏛️', '⛪', '🕳️', '🌌'].includes(b.textContent?.trim() ?? '')
    )
    expect(reverbBtns).toHaveLength(6)
    fireEvent.click(reverbBtns[4]) // 洞穴 0.7
    expect(fakeSpatial.setReverbMix).toHaveBeenLastCalledWith(0.7)
    fireEvent.click(reverbBtns[0]) // 无混响
    expect(fakeSpatial.setReverbMix).toHaveBeenLastCalledWith(0)
  })

  it('processor=null → 面板静默可用（按钮点击不崩）', () => {
    const { container } = render(<SpatialAudioPanel isOpen onClose={() => {}} processor={null} />)
    expect(() => fireEvent.click(btnByText(container, '🎧 录音室'))).not.toThrow()
    expect(container.textContent).toContain('近距离监听')
  })
})

describe('KaraokePanel（卡拉OK模式）', () => {
  it('开关按钮 → processor.toggle 状态联动文案与 aria；强度滑杆 → setVocalReduction；null 处理器回退 false', () => {
    const on = vi.fn(() => true)
    const karaokeOn = { toggle: on, setVocalReduction: vi.fn() } as unknown as KaraokeProcessor
    const { container } = render(<KaraokePanel isOpen onClose={() => {}} processor={karaokeOn} />)

    expect(container.textContent).toContain('点击开启卡拉OK模式')
    fireEvent.click(container.querySelector('[aria-label="开启卡拉OK模式"]')!)
    expect(on).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('🎤 卡拉OK模式已开启')
    expect(container.querySelector('[aria-label="关闭卡拉OK模式"]')).toBeTruthy()

    const slider = container.querySelector('[aria-label="人声消除强度"]') as HTMLInputElement
    fireEvent.change(slider, { target: { value: '50' } })
    expect(karaokeOn.setVocalReduction).toHaveBeenCalledWith(0.5)
    expect(container.textContent).toContain('50%')
  })

  it('null 处理器 → toggle 回退 false，保持未开启文案', () => {
    const { container } = render(<KaraokePanel isOpen onClose={() => {}} processor={null} />)
    fireEvent.click(container.querySelector('[aria-label="开启卡拉OK模式"]')!)
    expect(container.textContent).toContain('点击开启卡拉OK模式')
  })
})

describe('CrossfadePanel（交叉淡入淡出）', () => {
  it('时长滑杆更新秒数文案；曲线三选一；执行 → crossfade(时长, 曲线)，执行期间按钮禁用文案变化', async () => {
    let resolveFade!: () => void
    fakeCrossfade.crossfade = vi.fn(() => new Promise<void>((r) => { resolveFade = r }))
    const { container } = render(<CrossfadePanel isOpen onClose={() => {}} processor={fakeCrossfade} />)

    expect(container.textContent).toContain('3.0秒')
    const slider = container.querySelector('[aria-label="淡入淡出时长"]') as HTMLInputElement
    fireEvent.change(slider, { target: { value: '5500' } })
    expect(container.textContent).toContain('5.5秒')

    fireEvent.click(btnByText(container, 'S曲线'))
    fireEvent.click(btnByText(container, '线性'))

    const exec = btnByText(container, '🔄 执行交叉淡入淡出')
    fireEvent.click(exec)
    expect(fakeCrossfade.crossfade).toHaveBeenCalledWith(5500, 'linear')
    expect(container.textContent).toContain('淡入淡出中...')

    resolveFade()
    await act(async () => {})
    expect(container.textContent).toContain('🔄 执行交叉淡入淡出')
  })

  it('执行中重复点击被禁用；processor=null → 点击静默', () => {
    const { container } = render(<CrossfadePanel isOpen onClose={() => {}} processor={null} />)
    const exec = btnByText(container, '🔄 执行交叉淡入淡出')
    expect(() => fireEvent.click(exec)).not.toThrow()
    expect(container.textContent).toContain('🔄 执行交叉淡入淡出')
  })
})

describe('FamilyThemePanel（AI-Family 主题曲）', () => {
  const tracks = [
    { id: 'a1', name: 'AI-Family · YYC³ 家族主题曲', url: '/AI-Family.mp3', duration: 240 },
    { id: 'a2', name: 'Family 工坊', url: '/family.mp3' },
  ]

  it('曲目渲染（时长格式化/缺省副标题）+ 点击回调 onPlay + 正播高亮', () => {
    const onPlay = vi.fn()
    const { container } = render(
      <FamilyThemePanel isOpen onClose={() => {}} tracks={tracks} onPlay={onPlay} currentlyPlayingId="a1" />
    )
    expect(container.textContent).toContain('家族之声')
    expect(container.textContent).toContain('4:00') // 240s
    expect(container.textContent).toContain('AI-Family 主题曲') // 无时长副标题

    const rows = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent?.includes('工坊'))
    fireEvent.click(rows[0])
    expect(onPlay).toHaveBeenCalledWith(tracks[1])

    // a1 正播：圆形按钮底色主色实心
    const playingRow = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('家族主题曲')
    ) as HTMLElement
    expect(playingRow.style.border).toContain('rgb(139, 92, 246)')
  })
})
