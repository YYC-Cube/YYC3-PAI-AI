/**
 * @file MusicAIModule.test.ts
 * @description AI音乐智能模块专项 — 桩模型发送器 + Canvas 2D 上下文全桩，驱动：歌词翻译成功解析（代码围栏
 *              剥离/字段缺省）/无模型与异常与坏 JSON 逐行降级、封面提示词成功与降级模板、封面画布四风格绘制
 *              （抽象/极简/几何/有机 + 渐变走抽象分支）与默认色板、情感分析 JSON 解析与 calm 兜底
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'

const h = vi.hoisted(() => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  send: vi.fn(async (_msg: string, _opts?: { systemPrompt?: string }): Promise<string> => '[]'),
}))

vi.mock('../../../utils/logger', () => ({
  Logger: class {
    debug = h.log.debug
    info = h.log.info
    warn = h.log.warn
    error = h.log.error
  },
  createLogger: () => ({
    debug: h.log.debug,
    info: h.log.info,
    warn: h.log.warn,
    error: h.log.error,
  }),
}))

import { MusicAI } from '../MusicAIModule'
import type { AlbumCoverConfig } from '../MusicAIModule'
import type { TrackInfo } from '../EnhancedAudioPlayerV3'

// ── Canvas 2D 桩（jsdom 无 canvas 实现；setup.ts 的 createElement 桩被 resetAllMocks 还原，需重新接管） ──

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
  clip: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  drawImage: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  lineWidth: 1,
  strokeStyle: '',
  fillStyle: '',
  font: '',
  textAlign: '',
  globalAlpha: 1,
})

let ctx2d: ReturnType<typeof makeCtx2D>
let createdCanvases: HTMLCanvasElement[]

const installCanvas = () => {
  const protoCreate = Document.prototype.createElement
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, opts?: ElementCreationOptions) => {
    const el = protoCreate.call(document, tagName, opts)
    if (tagName === 'canvas') {
      Object.defineProperty(el, 'getContext', {
        value: () => ctx2d,
        configurable: true,
      })
      createdCanvases.push(el as HTMLCanvasElement)
    }
    return el
  }) as typeof document.createElement)
}

// ── 固定数据 ──

const mkTrack = (over: Partial<TrackInfo> = {}): TrackInfo => ({
  id: 't1',
  name: '不懂的董小姐',
  url: '/music/t1.mp3',
  metadata: { artist: '沫言', genre: '流行/民谣' },
  tags: ['女声', '深情'],
  ...over,
})

const coverCfg = (over: Partial<AlbumCoverConfig> = {}): AlbumCoverConfig => ({
  trackName: '云枢光痕',
  artist: '沫语',
  genre: '流行',
  mood: '温暖',
  colorScheme: ['#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899'],
  style: 'abstract',
  ...over,
})

beforeEach(() => {
  vi.resetAllMocks()
  ctx2d = makeCtx2D()
  createdCanvases = []
  installCanvas()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── 歌词翻译 ──

describe('MusicAI 歌词翻译', () => {
  it('成功解析 JSON 数组（剥离 ```json 围栏），字段缺失走缺省值，targetLang 逐条回填', async () => {
    const ai = new MusicAI()
    const send = h.send.mockImplementation(async () =>
      '```json\n' +
      JSON.stringify([
        { original: 'Line1', translated: '第一行', sourceLang: 'English', confidence: 0.95 },
        { translated: '缺原文' },
      ]) +
      '\n```'
    )
    ai.setModelSender(send)

    const result = await ai.translateLyrics('Line1\nLine2', 'English')

    expect(send).toHaveBeenCalledTimes(1)
    expect(String(send.mock.calls[0][0])).toContain('Line1')
    expect(String(send.mock.calls[0][1]?.systemPrompt)).toContain('English')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      original: 'Line1',
      translated: '第一行',
      sourceLang: 'English',
      targetLang: 'English',
      confidence: 0.95,
    })
    expect(result[1]).toMatchObject({
      original: '',
      translated: '缺原文',
      sourceLang: 'unknown',
      targetLang: 'English',
      confidence: 0.8, // 缺省置信度
    })
  })

  it('目标语言缺省为中文，提示词包含译文语种要求', async () => {
    const ai = new MusicAI()
    const send = vi.fn(async (_msg: string, _opts?: { systemPrompt?: string }): Promise<string> => '[]')
    ai.setModelSender(send)
    await ai.translateLyrics('词')
    expect(String(send.mock.calls[0][1]?.systemPrompt)).toContain('中文')
  })

  it('模型未配置 / 模型异常 / 坏 JSON → 逐行降级「[翻译失败]」且置信度 0，空行剔除', async () => {
    // 未配置 sender
    const a1 = new MusicAI()
    const r1 = await a1.translateLyrics('第一行\n\n第二行')
    expect(r1).toHaveLength(2) // 空行被 filter(Boolean) 剔除
    expect(r1[0]).toMatchObject({ original: '第一行', translated: '[翻译失败] 第一行', confidence: 0 })
    expect(h.log.error).toHaveBeenCalledWith('[MusicAI] 歌词翻译失败:', expect.any(Error))

    // sender 抛错
    const a2 = new MusicAI()
    a2.setModelSender(vi.fn(async () => { throw new Error('超时') }))
    const r2 = await a2.translateLyrics('只有一行', '日本語')
    expect(r2[0]).toMatchObject({ original: '只有一行', translated: '[翻译失败] 只有一行', targetLang: '日本語' })

    // sender 返回非 JSON
    const a3 = new MusicAI()
    a3.setModelSender(vi.fn(async (_m: string, _o?: { systemPrompt?: string }): Promise<string> => '我觉得这首歌不错'))
    const r3 = await a3.translateLyrics('词句')
    expect(r3[0].translated).toBe('[翻译失败] 词句')
  })
})

// ── 封面生成 ──

describe('MusicAI 封面生成', () => {
  it('generateCoverPrompt 成功返回模型原文，提示词携带歌曲名/艺术家/风格/情感/色调/设计风格', async () => {
    const ai = new MusicAI()
    const send = vi.fn(async (_m: string, _o?: { systemPrompt?: string }): Promise<string> => 'futuristic neon album art')
    ai.setModelSender(send)

    const prompt = await ai.generateCoverPrompt(coverCfg({ genre: '', mood: '' }))

    expect(prompt).toBe('futuristic neon album art')
    const sent = String(send.mock.calls[0][0])
    expect(sent).toContain('云枢光痕')
    expect(sent).toContain('沫语')
    expect(sent).toContain('流行') // genre 缺省回退
    expect(sent).toContain('温暖')
    expect(sent).toContain('#8b5cf6, #3b82f6, #06b6d4, #ec4899')
  })

  it('generateCoverPrompt 失败 → 本地降级模板（含歌曲名/艺术家/风格/情感）', async () => {
    const ai = new MusicAI()
    ai.setModelSender(vi.fn(async () => { throw new Error('额度不足') }))

    const prompt = await ai.generateCoverPrompt(coverCfg({ style: 'geometric', mood: '梦幻' }))

    expect(prompt).toContain('"云枢光痕"')
    expect(prompt).toContain('沫语')
    expect(prompt).toContain('geometric style')
    expect(prompt).toContain('梦幻 mood')
  })

  it('generateCoverCanvas：512×512 径向渐变铺底 + 底部遮罩 + 歌名/艺术家文字；四风格各自走绘制分支', () => {
    const ai = new MusicAI()

    // abstract（默认）
    const canvas = ai.generateCoverCanvas(coverCfg())
    expect(canvas.width).toBe(512)
    expect(canvas.height).toBe(512)
    expect(canvas).toBe(createdCanvases[0])
    expect(ctx2d.createRadialGradient).toHaveBeenCalledWith(256, 256, 50, 256, 256, 400)
    expect(ctx2d.fillRect).toHaveBeenCalledWith(0, 0, 512, 512)
    expect(ctx2d.fillRect).toHaveBeenCalledWith(0, 300, 512, 212)
    const texts = ctx2d.fillText.mock.calls.map((c) => c[0])
    expect(texts).toContain('云枢光痕')
    expect(texts).toContain('沫语')

    // minimalist
    ctx2d.arc.mockClear()
    ai.generateCoverCanvas(coverCfg({ style: 'minimalist' }))
    expect(ctx2d.arc).toHaveBeenCalledTimes(2) // 双圆环
    expect(ctx2d.stroke).toHaveBeenCalled()

    // geometric：12 个旋转变换
    ctx2d.save.mockClear()
    ctx2d.rotate.mockClear()
    ai.generateCoverCanvas(coverCfg({ style: 'geometric' }))
    expect(ctx2d.save).toHaveBeenCalledTimes(12)
    expect(ctx2d.rotate).toHaveBeenCalledTimes(12)

    // organic：8 条贝塞尔曲线
    ctx2d.bezierCurveTo.mockClear()
    ai.generateCoverCanvas(coverCfg({ style: 'organic' }))
    expect(ctx2d.bezierCurveTo).toHaveBeenCalledTimes(8)

    // gradient 等未列出风格 → default 分支（abstract 抽象圆）
    ctx2d.arc.mockClear()
    ai.generateCoverCanvas(coverCfg({ style: 'gradient' }))
    expect(ctx2d.arc).toHaveBeenCalledTimes(20)
  })

  it('generateCoverCanvas：空色板回退默认四色渐变；长歌名/艺术家按 12/16 字截断', () => {
    const ai = new MusicAI()
    ai.generateCoverCanvas(
      coverCfg({
        colorScheme: [],
        trackName: '一二三四五六七八九十一二三四五六七八九十',
        artist: 'abcdefghijklmnopqrstuvwxyz',
      })
    )
    // 渐变四个色标均使用默认色板首位
    const stops = (ctx2d.createRadialGradient.mock.results[0].value as { addColorStop: Mock }).addColorStop.mock.calls
    expect(stops[0][1]).toBe('#8b5cf6')
    expect(stops[3][1]).toBe('#8b5cf6') // colors[3] 越界回退 colors[0]
    const texts = ctx2d.fillText.mock.calls.map((c) => String(c[0]))
    expect(texts).toContain('一二三四五六七八九十一二') // 12 字截断
    expect(texts).toContain('abcdefghijklmnop') // 16 字截断
  })
})

// ── 情感分析 ──

describe('MusicAI 情感分析', () => {
  it('成功解析 JSON：元数据（艺术家/流派/标签）注入提示词，分析结果原样返回', async () => {
    const ai = new MusicAI()
    const emotion = {
      mood: 'energetic',
      energy: 0.9,
      valence: 0.7,
      danceability: 0.8,
      acousticness: 0.2,
      dominantTags: ['电子'],
      colorPalette: ['#f00', '#0f0', '#00f', '#fff'],
      recommendedTracks: ['霓虹快跑'],
    }
    const send = vi.fn(async (_m: string, _o?: { systemPrompt?: string }): Promise<string> => '```json\n' + JSON.stringify(emotion) + '\n```')
    ai.setModelSender(send)

    const result = await ai.analyzeEmotion(mkTrack())

    expect(result).toEqual(emotion)
    const sent = String(send.mock.calls[0][0])
    expect(sent).toContain('不懂的董小姐')
    expect(sent).toContain('沫言')
    expect(sent).toContain('流行/民谣')
    expect(sent).toContain('女声, 深情')
  })

  it('失败 → calm 兜底：五维 0.5、标签回填、默认配色与空推荐', async () => {
    const ai = new MusicAI()
    ai.setModelSender(vi.fn(async () => '分析不出来'))

    const result = await ai.analyzeEmotion(mkTrack())
    expect(result).toEqual({
      mood: 'calm',
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
      dominantTags: ['女声', '深情'],
      colorPalette: ['#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899'],
      recommendedTracks: [],
    })
    expect(h.log.error).toHaveBeenCalledWith('[MusicAI] 情感分析失败:', expect.any(Error))

    // 无标签曲目 → 兜底标签「音乐」
    const noTags = await ai.analyzeEmotion(mkTrack({ tags: undefined }))
    expect(noTags.dominantTags).toEqual(['音乐'])
  })
})
