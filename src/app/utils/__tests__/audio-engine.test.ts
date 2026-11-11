/**
 * @file audio-engine.test.ts
 * @description 音频引擎专项 — jsdom 无 Web Audio/Howler 真实能力，全桩 AudioContext(含 webkit 前缀)/
 * Howl/HTMLAudio/fetch/rAF/URL API，驱动：单例与初始化降级/音乐库(本地 manifest·NAS API·版本校验·
 * 失败回退·时长探测)/播放暂停恢复 seek 停止/列表推进与原生 Audio 回退/音量与静音/合成音效与音效池/
 * 播放列表/编辑版本/上传删除/订阅持久化与资源释放
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'

/** Howl 构造参数（桩仅记录，回调由用例手动触发） */
interface HowlOpts {
  src: string[]
  html5?: boolean
  volume?: number
  format?: string[]
  preload?: boolean
  onload?: () => void
  onplay?: () => void
  onend?: () => void
  onstop?: () => void
  onpause?: () => void
  onloaderror?: (id: number, err: unknown) => void
  onplayerror?: (id: number, err: unknown) => void
}

// vi.mock 工厂引用的外部值 → 必须 vi.hoisted
const h = vi.hoisted(() => {
  const instances: HowlStub[] = []

  class HowlStub {
    readonly opts: HowlOpts
    readonly onceHandlers: Record<string, () => void> = {}
    pos = 0
    play = vi.fn(() => 1)
    pause = vi.fn()
    stop = vi.fn()
    unload = vi.fn()
    volume = vi.fn()
    fade = vi.fn()
    duration = vi.fn(() => 200)
    state = vi.fn((): string => 'loaded')
    seek = vi.fn((t?: number) => {
      if (t === undefined) return this.pos
      this.pos = t
      return this
    })
    once = vi.fn((evt: string, cb: () => void) => {
      this.onceHandlers[evt] = cb
    })
    constructor(opts: HowlOpts) {
      this.opts = opts
      instances.push(this)
    }
  }

  const howlerVolume = vi.fn()
  const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return { HowlStub, instances, howlerVolume, log }
})

vi.mock('howler', () => ({ Howl: h.HowlStub, Howler: { volume: h.howlerVolume } }))

vi.mock('../logger', () => ({
  Logger: class {
    debug = h.log.debug
    info = h.log.info
    warn = h.log.warn
    error = h.log.error
  },
}))

import { AudioEngine, getAudioEngine, destroyAudioEngine } from '../audio-engine'
import type { AudioEngineConfig, AudioTrack, ManifestTrackEntry } from '../audio-engine'

// ============================================================================
// Web Audio 全桩（jsdom 无 Web Audio，经 Object.defineProperty 注入 globalThis，
// window === globalThis，故 window.AudioContext / window.webkitAudioContext 均可命中）
// ============================================================================

class AudioParamStub {
  value = 0
  setValueAtTime = vi.fn()
  linearRampToValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
}

class AudioNodeStub {
  connect = vi.fn()
  disconnect = vi.fn()
}

class GainNodeStub extends AudioNodeStub {
  gain = new AudioParamStub()
}

class OscillatorNodeStub extends AudioNodeStub {
  type = 'sine'
  frequency = new AudioParamStub()
  start = vi.fn()
  stop = vi.fn()
}

class AnalyserNodeStub extends AudioNodeStub {
  fftSize = 2048
  get frequencyBinCount(): number {
    return this.fftSize / 2
  }
  getByteFrequencyData = vi.fn((arr: Uint8Array) => {
    arr.fill(128)
  })
  getByteTimeDomainData = vi.fn((arr: Uint8Array) => {
    arr.fill(64)
  })
}

class AudioContextStub {
  static instances: AudioContextStub[] = []
  static initialState: 'running' | 'suspended' = 'running'
  state: 'running' | 'suspended' | 'closed'
  currentTime = 1.5
  destination = new AudioNodeStub()
  oscillators: OscillatorNodeStub[] = []
  gains: GainNodeStub[] = []
  analysers: AnalyserNodeStub[] = []
  createOscillator = vi.fn(() => {
    const n = new OscillatorNodeStub()
    this.oscillators.push(n)
    return n
  })
  createGain = vi.fn(() => {
    const n = new GainNodeStub()
    this.gains.push(n)
    return n
  })
  createAnalyser = vi.fn(() => {
    const n = new AnalyserNodeStub()
    this.analysers.push(n)
    return n
  })
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  close = vi.fn(async () => {
    this.state = 'closed'
  })
  constructor() {
    this.state = AudioContextStub.initialState
    AudioContextStub.instances.push(this)
  }
}

/** 注入 AudioContext / webkitAudioContext（传 undefined 模拟缺失） */
const installAudioContext = (ctor: unknown, webkit: unknown) => {
  Object.defineProperty(globalThis, 'AudioContext', { value: ctor, writable: true, configurable: true })
  Object.defineProperty(globalThis, 'webkitAudioContext', { value: webkit, writable: true, configurable: true })
}

// ============================================================================
// HTMLAudioElement 桩：src 赋值后微任务派发 loadedmetadata / error / abort（真实浏览器亦为异步）
// ============================================================================

class AudioStub {
  static instances: AudioStub[] = []
  static nextDuration = 240
  static failPattern: RegExp | null = null
  static abortPattern: RegExp | null = null
  static silentPattern: RegExp | null = null // 永不派发 → 触发 3s 超时回退
  static rejectPlay = false
  private readonly listeners = new Map<string, Array<(e: Event) => void>>()
  private srcValue = ''
  preload = ''
  duration = 0
  currentTime = 0
  paused = true
  volume = 1
  play = vi.fn((): Promise<void> => {
    if (AudioStub.rejectPlay) return Promise.reject(new Error('NotAllowedError'))
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  constructor(src?: string) {
    AudioStub.instances.push(this)
    if (src) this.src = src
  }
  get src(): string {
    return this.srcValue
  }
  set src(v: string) {
    this.srcValue = v
    if (!v) return
    queueMicrotask(() => {
      if (AudioStub.failPattern?.test(v)) {
        this.dispatch('error')
        return
      }
      if (AudioStub.abortPattern?.test(v)) {
        this.dispatch('abort')
        return
      }
      if (AudioStub.silentPattern?.test(v)) return
      this.duration = AudioStub.nextDuration
      this.dispatch('loadedmetadata')
    })
  }
  addEventListener(type: string, cb: (e: Event) => void): void {
    const arr = this.listeners.get(type) ?? []
    arr.push(cb)
    this.listeners.set(type, arr)
  }
  removeEventListener(type: string, cb: (e: Event) => void): void {
    const arr = (this.listeners.get(type) ?? []).filter((f) => f !== cb)
    this.listeners.set(type, arr)
  }
  dispatch(type: string): void {
    for (const cb of (this.listeners.get(type) ?? []).slice()) cb(new Event(type))
  }
}

// ============================================================================
// 工具与固定数据
// ============================================================================

// 存储键按铁律拆分拼接（避免整串键/口令字面量落入仓库）
const STORAGE_KEY = ['yyc3', 'audio', 'engine'].join('-')
const LIB_VERSION_KEY = ['yyc3', 'audio', 'library', 'version'].join('-')
const TRACKS_VERSION_KEY = ['yyc3', 'audio', 'tracks', 'version'].join('-')

const mkTrack = (id: string, over: Partial<AudioTrack> = {}): AudioTrack => ({
  id,
  name: `歌曲-${id}`,
  url: `/music/${id}.mp3`,
  duration: 180,
  size: 0,
  type: 'music',
  tags: [],
  createdAt: 1,
  updatedAt: 1,
  ...over,
})

const seedStorage = (tracks: AudioTrack[], extra: Record<string, unknown> = {}) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ tracks: tracks.map((t) => [t.id, t]), ...extra })
  )
}

const entry = (fileName: string, over: Partial<ManifestTrackEntry> = {}): ManifestTrackEntry => ({
  fileName,
  title: fileName.replace(/\.mp3$/, ''),
  artist: 'YYC³',
  artistName: 'YYC³',
  album: 'YYC³ 音乐库',
  url: `/music/${fileName}`,
  tags: [],
  ...over,
})

/** 每次 json() 深拷贝：源码会就地改写 manifest.tracks，真实 fetch 亦为每次新对象 */
const stubFetchJson = (body: unknown, ok = true, status = 200) => {
  const f = vi.fn(async () => ({ ok, status, json: async () => structuredClone(body) }))
  vi.stubGlobal('fetch', f)
  return f
}

/** 假计时器仅伪造 setTimeout 系与 Date（默认会连 rAF 一并伪造，需保住 rAF 桩） */
const useFake = () =>
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })

const tick = async (n = 10) => {
  for (let i = 0; i < n; i++) await Promise.resolve()
}

const must = <T>(v: T | undefined | null, what = '值'): T => {
  if (v === undefined || v === null) throw new Error(`缺少${what}`)
  return v
}

/** jsdom 无 URL.createObjectURL：临时替换并返回还原函数 */
const stubUrlApi = () => {
  const names = ['createObjectURL', 'revokeObjectURL'] as const
  const originals = names.map((n) => [n, Object.getOwnPropertyDescriptor(URL, n)] as const)
  const createObjectURL = vi.fn(() => 'blob:http://localhost/u1')
  const revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true, configurable: true })
  const restore = () => {
    for (const [n, d] of originals) {
      if (d) Object.defineProperty(URL, n, d)
      else Reflect.deleteProperty(URL, n)
    }
  }
  return { createObjectURL, revokeObjectURL, restore }
}

// ============================================================================
// 生命周期
// ============================================================================

const engines: AudioEngine[] = []
const mk = (config?: Partial<AudioEngineConfig>): AudioEngine => {
  const e = new AudioEngine(config)
  engines.push(e)
  return e
}

let raf: Mock<(cb: FrameRequestCallback) => number>
let caf: Mock<(handle: number) => void>
let urlApi: ReturnType<typeof stubUrlApi>

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  AudioContextStub.instances = []
  AudioContextStub.initialState = 'running'
  AudioStub.instances = []
  AudioStub.nextDuration = 240
  AudioStub.failPattern = null
  AudioStub.abortPattern = null
  AudioStub.silentPattern = null
  AudioStub.rejectPlay = false
  h.instances.length = 0
  installAudioContext(AudioContextStub, AudioContextStub)
  vi.stubGlobal('Audio', AudioStub)
  raf = vi.fn((_cb: FrameRequestCallback) => 1)
  caf = vi.fn((_handle: number) => undefined)
  vi.stubGlobal('requestAnimationFrame', raf)
  vi.stubGlobal('cancelAnimationFrame', caf)
  urlApi = stubUrlApi()
  // 显式钉死本地清单分支（防开发者 .env.local 预设 NAS 地址）
  vi.stubEnv('VITE_MUSIC_API_BASE', '')
  stubFetchJson({ tracks: [], updatedAt: 0 })
})

afterEach(() => {
  engines.splice(0).forEach((e) => e.destroy())
  destroyAudioEngine()
  urlApi.restore()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

// ============================================================================
// 用例
// ============================================================================

describe('AudioEngine 单例与初始化', () => {
  it('getAudioEngine 单例复用、destroyAudioEngine 关闭上下文后重建；构造建立 gain→analyser→destination 图谱并应用主音量，配置可覆盖', () => {
    const a = getAudioEngine()
    expect(getAudioEngine()).toBe(a)
    expect(AudioContextStub.instances).toHaveLength(1)
    const ctx = AudioContextStub.instances[0]
    const analyser = ctx.analysers[0]
    const gain = ctx.gains[0]
    expect(ctx.createAnalyser).toHaveBeenCalledTimes(1)
    expect(analyser.fftSize).toBe(256)
    expect(gain.connect).toHaveBeenCalledWith(analyser)
    expect(analyser.connect).toHaveBeenCalledWith(ctx.destination)
    expect(gain.gain.value).toBeCloseTo(0.8) // masterVolume 80/100
    destroyAudioEngine()
    expect(ctx.close).toHaveBeenCalledTimes(1)
    const b = getAudioEngine()
    expect(b).not.toBe(a)
    expect(AudioContextStub.instances).toHaveLength(2)
    const custom = mk({ masterVolume: 50, crossfadeDuration: 250 })
    expect(custom.getVolumes()).toMatchObject({ masterVolume: 50, musicVolume: 70, crossfadeDuration: 250, normalizeAudio: true })
    expect(AudioContextStub.instances[2].gains[0].gain.value).toBeCloseTo(0.5)
  })

  it('AudioContext/webkitAudioContext 均缺失 → 告警降级：可视化返回 null、合成音效静默、Howler 播放照常；仅 webkit 前缀可用时回退构建', async () => {
    useFake()
    seedStorage([mkTrack('t1')])
    installAudioContext(undefined, undefined)
    const e = mk()
    expect(AudioContextStub.instances).toHaveLength(0)
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('Web Audio API not available'))
    expect(e.getFrequencyData()).toBeNull()
    expect(e.getTimeDomainData()).toBeNull()
    expect(() => {
      e.playUIClick()
      e.playNotification()
      e.setMasterVolume(10)
    }).not.toThrow()
    // 无 Web Audio 不影响 Howler 播放：play 时再试初始化（仍失败）后照常创建 Howl
    await e.play('t1')
    expect(h.log.warn.mock.calls.filter((c) => String(c[0]).includes('Web Audio API not available'))).toHaveLength(2)
    expect(h.instances).toHaveLength(1)
    expect(e.getState()).toMatchObject({ isPlaying: true, currentTrack: expect.objectContaining({ id: 't1' }) })

    installAudioContext(undefined, AudioContextStub)
    const w = mk()
    expect(AudioContextStub.instances).toHaveLength(1)
    const freq = w.getFrequencyData()
    expect(freq).toBeInstanceOf(Uint8Array)
    expect(freq).toHaveLength(128) // fftSize 256 / 2
    expect(AudioContextStub.instances[0].analysers[0].getByteFrequencyData).toHaveBeenCalledTimes(1)
    expect(w.getTimeDomainData()).toHaveLength(128)
  })
})

describe('AudioEngine 音乐库初始化', () => {
  it('本地 manifest 加载：追加内置主题曲、推断标签/流派、写入双版本号并生成默认播放列表；二次调用命中缓存不再 fetch', async () => {
    const fetchMock = stubFetchJson(
      {
        updatedAt: 1700000000000,
        tracks: [
          entry('duet.mp3', { title: '双人曲', artistName: '沫言&沫语', artist: '沫言 & 沫语', album: 'AB辑', durationSec: 120 }),
          entry('solo.mp3', { title: '独唱曲', artistName: '沫言', artist: '沫言', album: 'A辑', durationSec: 90 }),
        ],
      }
    )
    const e = mk()
    const listener = vi.fn()
    e.subscribe(listener)
    const tracks = await e.initializeMusicLibrary()
    expect(fetchMock).toHaveBeenCalledWith('/music-manifest.json')
    expect(tracks).toHaveLength(4) // 2 首自定义 + 2 首内置主题曲
    const duet = must(tracks.find((t) => t.name === '双人曲'), '双人曲')
    expect(duet.tags).toEqual(expect.arrayContaining(['YYC³', '音乐库', '合唱']))
    expect(duet.metadata?.genre).toBe('流行/合唱')
    expect(duet.duration).toBe(120)
    const solo = must(tracks.find((t) => t.name === '独唱曲'), '独唱曲')
    expect(solo.tags).toEqual(expect.arrayContaining(['男声', '深情', 'A辑', '独唱']))
    expect(solo.metadata?.genre).toBe('流行/摇滚')
    const theme = must(tracks.find((t) => t.url === '/AI-Family.mp3'), '主题曲')
    expect(theme.duration).toBe(240) // 无 durationSec → HTMLAudio 探测
    expect(theme.metadata?.album).toBe('AI-Family 主题曲')
    expect(localStorage.getItem(LIB_VERSION_KEY)).toBe('1700000000000')
    expect(localStorage.getItem(TRACKS_VERSION_KEY)).toBe('1700000000000')
    const st = e.getState()
    expect(st.playlist?.name).toBe('YYC³ 音乐库')
    expect(st.playlist?.repeat).toBe('all')
    expect(st.playlist?.tracks).toHaveLength(4)
    expect(e.getPlaylists()).toHaveLength(1)
    expect(listener).toHaveBeenCalled()
    // 二次调用：版本一致 + 内存已有曲目 → 直接返回
    const again = await e.initializeMusicLibrary()
    expect(again).toHaveLength(4)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('并发初始化共享同一 Promise（fetch 仅一次）；forceReload 与 tracks 版本不一致均清缓存重拉', async () => {
    const fetchMock = stubFetchJson({ updatedAt: 1700000000000, tracks: [entry('a.mp3', { durationSec: 10 })] })
    const e = mk()
    const [r1, r2] = await Promise.all([e.initializeMusicLibrary(), e.initializeMusicLibrary()])
    expect(r1).toHaveLength(3)
    expect(r2).toBe(r1) // 同一 initializationPromise 的结果
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(h.log.info).toHaveBeenCalledWith(expect.stringContaining('正在初始化中'))
    expect(await e.initializeMusicLibrary(true)).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // tracks 版本 ≠ 曲库版本：构造时恢复的旧曲目被清除并重新拉取
    seedStorage([mkTrack('stale')])
    localStorage.setItem(LIB_VERSION_KEY, '1700000000000')
    localStorage.setItem(TRACKS_VERSION_KEY, '1')
    const e2 = mk()
    expect(e2.getTrackById('stale')).toBeDefined()
    const r4 = await e2.initializeMusicLibrary()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(e2.getTrackById('stale')).toBeUndefined()
    expect(r4).toHaveLength(3)
    expect(localStorage.getItem(TRACKS_VERSION_KEY)).toBe('1700000000000')
    // 版本一致但内存为空（如另一实例已写入 storage）→ 从 storage 恢复，不重建曲目/播放列表
    localStorage.removeItem(STORAGE_KEY)
    const e3 = mk()
    seedStorage([mkTrack('from-other-tab')])
    const r5 = await e3.initializeMusicLibrary()
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(r5.map((t) => t.id)).toEqual(['from-other-tab'])
    expect(e3.getState().playlist).toBeNull()
  })

  it('manifest 请求失败（HTTP 404 / 网络异常）→ 告警并返回空列表，不生成播放列表', async () => {
    stubFetchJson({}, false, 404)
    const e = mk()
    expect(await e.initializeMusicLibrary()).toEqual([])
    expect(h.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('无法加载 music-manifest.json'),
      expect.any(Error)
    )
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await e.initializeMusicLibrary()).toEqual([])
    expect(e.getState().playlist).toBeNull()
    expect(e.getTracks()).toHaveLength(0)
    expect(localStorage.getItem(LIB_VERSION_KEY)).toBeNull()
  })

  it('NAS 远程曲库：VITE_MUSIC_API_BASE 去尾斜杠、映射流式 URL/时长/默认艺人专辑，版本号按条数+字节数', async () => {
    vi.stubEnv('VITE_MUSIC_API_BASE', 'http://nas.local:3000/')
    const fetchMock = stubFetchJson({
      data: [
        { id: 'x1', title: 'NAS曲', artist: null, album: null, duration: 95, fileSize: '1024', format: 'flac' },
        { id: 'x2', title: '有艺人', artist: '沫语', album: 'B辑', duration: 0, fileSize: 'abc', format: '' },
      ],
    })
    const e = mk()
    const tracks = await e.initializeMusicLibrary()
    expect(fetchMock).toHaveBeenCalledWith('http://nas.local:3000/api/music/tracks')
    expect(tracks).toHaveLength(4)
    const t1 = must(tracks.find((t) => t.name === 'NAS曲'), 'NAS曲')
    expect(t1.url).toBe('http://nas.local:3000/api/music/stream/x1')
    expect(t1.duration).toBe(95)
    expect(t1.metadata).toMatchObject({ artist: 'YYC³', album: 'YYC³ 音乐库' })
    const t2 = must(tracks.find((t) => t.name === '有艺人'), '有艺人')
    expect(t2.duration).toBe(240) // duration 0 → 探测
    expect(t2.tags).toEqual(expect.arrayContaining(['女声', '治愈', 'B辑', '独唱']))
    expect(t2.metadata?.genre).toBe('流行/抒情')
    expect(localStorage.getItem(LIB_VERSION_KEY)).toBe('nas-2-1024')
    // NAS 接口非 2xx → 抛错被捕获：返回空列表、已加载曲目保留
    stubFetchJson({}, false, 503)
    expect(await e.initializeMusicLibrary(true)).toEqual([])
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('无法加载'), expect.objectContaining({ message: 'HTTP 503' }))
    expect(e.getTracks()).toHaveLength(4)
  })

  it('单曲时长探测：超时 / error / abort 均回退 180 秒；畸形条目单条跳过，均不影响其余曲目入库', async () => {
    useFake()
    AudioStub.silentPattern = /AI-Family\.mp3$/ // 永不派发 → 3s 超时
    AudioStub.failPattern = /工坊/ // error 事件
    AudioStub.abortPattern = /abort\.mp3$/ // abort 事件
    stubFetchJson({
      updatedAt: 1,
      tracks: [
        entry('abort.mp3', { title: '中止曲' }),
        entry('ok.mp3', { title: '正常曲' }),
        { title: '', url: '/music/broken.mp3', durationSec: 1 } as unknown as ManifestTrackEntry, // 缺 fileName → 单条跳过
      ],
    })
    const e = mk()
    const p = e.initializeMusicLibrary()
    await vi.advanceTimersByTimeAsync(3000)
    const tracks = await p
    expect(tracks).toHaveLength(4)
    const by = (name: string) => must(tracks.find((t) => t.name === name), name)
    expect(by('中止曲').duration).toBe(180)
    expect(by('正常曲').duration).toBe(240)
    expect(by('AI-Family · YYC³ 家族主题曲').duration).toBe(180)
    expect(by('Family 工坊').duration).toBe(180)
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('获取时长超时'))
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('加载失败'), expect.anything())
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('跳过'), expect.any(TypeError))
    expect(h.log.info).toHaveBeenCalledWith(expect.stringContaining('加载中止'))
  })

  it('localStorage 恢复：跳过 blob: 曲目、合并配置/播放列表/编辑版本；损坏 JSON 仅告警不崩', () => {
    const t1 = mkTrack('t1')
    const blobTrack = mkTrack('tb', { url: 'blob:http://localhost/abc' })
    seedStorage([t1, blobTrack], {
      config: { masterVolume: 33 },
      playlists: [[
        'p1',
        { id: 'p1', name: '旧单', tracks: [t1], currentIndex: 0, shuffle: false, repeat: 'off', createdAt: 1 },
      ]],
      editedTracks: [[
        'e1',
        { originalId: 't1', id: 'e1', name: '剪辑', startTime: 0, endTime: 10, volume: 100, fadeIn: 0, fadeOut: 0, url: t1.url },
      ]],
    })
    const e = mk()
    expect(e.getTracks().map((t) => t.id)).toEqual(['t1'])
    expect(e.getVolumes().masterVolume).toBe(33)
    // 现状：构造先建 Web Audio 图谱后读存储，恢复的 33 未作用于 gainNode（疑似 bug，见报告）
    expect(AudioContextStub.instances[0].gains[0].gain.value).toBeCloseTo(0.8)
    expect(e.getPlaylistById('p1')?.name).toBe('旧单')
    expect(e.getEditedVersions()).toHaveLength(1)
    localStorage.setItem(STORAGE_KEY, '{not-json')
    const broken = mk()
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to load from storage'))
    expect(broken.getTracks()).toHaveLength(0)
  })
})

describe('AudioEngine 播放控制', () => {
  it('play：激活上下文→立即置 isPlaying 并通知→创建 html5 Howl（音量=music×master/10000）→启动 rAF 时间更新；2 秒仍未实际播放则重试 play()', async () => {
    useFake()
    seedStorage([mkTrack('t1')])
    const e = mk()
    const listener = vi.fn()
    e.subscribe(listener)
    await e.play('t1')
    expect(h.instances).toHaveLength(1)
    const howl = h.instances[0]
    expect(howl.opts).toMatchObject({ src: ['/music/t1.mp3'], html5: true, format: ['mp3'] })
    expect(howl.opts.volume).toBeCloseTo(0.56) // 70 × 80 / 10000
    expect(howl.play).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ isPlaying: true, currentTrack: expect.objectContaining({ id: 't1' }) })
    )
    expect(e.getState()).toMatchObject({ isPlaying: true, duration: 200 }) // duration 取自 Howl
    expect(raf).toHaveBeenCalledTimes(1)
    // 2 秒检查：Howl state='loaded'（非 playing）且 currentTime=0 → 重试
    vi.advanceTimersByTime(2000)
    expect(howl.play).toHaveBeenCalledTimes(2)
    expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('音频未播放'))
    // 真正在播（state=playing 且 seek>0）→ 确认日志，不重试
    await e.play('t1')
    const howl2 = h.instances[1]
    howl2.state.mockReturnValue('playing')
    howl2.seek.mockReturnValue(5)
    vi.advanceTimersByTime(2000)
    expect(howl2.play).toHaveBeenCalledTimes(1)
    expect(h.log.info).toHaveBeenCalledWith(expect.stringContaining('正在正常播放'))
  })

  it('play 未知曲目拒绝；suspended 上下文先 resume 再播；resume 失败仅记错不阻断', async () => {
    seedStorage([mkTrack('t1')])
    AudioContextStub.initialState = 'suspended'
    const e = mk()
    await expect(e.play('ghost')).rejects.toThrow('Track ghost not found')
    const ctx = AudioContextStub.instances[0]
    await e.play('t1')
    expect(ctx.resume).toHaveBeenCalledTimes(1)
    expect(ctx.state).toBe('running')
    expect(e.getState().isPlaying).toBe(true)
    const e2 = mk()
    const ctx2 = AudioContextStub.instances[1]
    ctx2.resume.mockRejectedValueOnce(new Error('blocked by policy'))
    await e2.play('t1')
    expect(h.log.error).toHaveBeenCalledWith(expect.stringContaining('激活失败'), expect.any(Error))
    expect(e2.getState().currentTrack?.id).toBe('t1')
    expect(h.instances).toHaveLength(2)
  })

  it('pause/resume/seek/stop 状态机：pause 通知订阅者、resume 复播、seek 同步 currentTime、stop 重置并取消 rAF，切歌先停旧实例', async () => {
    useFake()
    seedStorage([mkTrack('t1')])
    const e = mk()
    await e.play('t1')
    const howl = h.instances[0]
    const listener = vi.fn()
    e.subscribe(listener)
    e.pause()
    expect(howl.pause).toHaveBeenCalledTimes(1)
    expect(e.getState().isPlaying).toBe(false)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isPlaying: false }))
    e.resume()
    expect(howl.play).toHaveBeenCalledTimes(2)
    expect(e.getState().isPlaying).toBe(true)
    must(howl.opts.onstop)() // Howler 侧停止回调 → 置停并通知
    expect(e.getState().isPlaying).toBe(false)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isPlaying: false }))
    e.resume()
    expect(howl.play).toHaveBeenCalledTimes(3)
    e.seek(42)
    expect(howl.seek).toHaveBeenCalledWith(42)
    expect(e.getState().currentTime).toBe(42)
    e.stop()
    expect(howl.stop).toHaveBeenCalledTimes(1)
    expect(caf).toHaveBeenCalledWith(1)
    expect(e.getState()).toMatchObject({ isPlaying: false, currentTrack: null, currentTime: 0 })
    await e.play('t1') // 切歌：先 stop 旧 Howl 再新建
    expect(howl.stop).toHaveBeenCalledTimes(2)
    expect(h.instances).toHaveLength(2)
  })

  it('曲目结束（onend）按播放列表推进：repeat=all 下一首、repeat=one 重播、repeat=off 末尾停止并清空 currentTrack', async () => {
    useFake()
    seedStorage([mkTrack('t1'), mkTrack('t2')])
    const e = mk()
    const pl = e.createPlaylist('双曲', ['t1', 't2'])
    e.setActivePlaylist(pl.id)
    e.setRepeat('all')
    await e.play('t1')
    must(h.instances[0].opts.onend)()
    await tick()
    expect(h.instances).toHaveLength(2)
    expect(h.instances[1].opts.src).toEqual(['/music/t2.mp3'])
    expect(e.getState().playlist?.currentIndex).toBe(1)
    expect(e.getState().currentTrack?.id).toBe('t2')
    e.setRepeat('one')
    must(h.instances[1].opts.onend)()
    await tick()
    expect(h.instances).toHaveLength(3)
    expect(h.instances[2].opts.src).toEqual(['/music/t2.mp3'])
    e.setRepeat('off')
    const listener = vi.fn()
    e.subscribe(listener)
    must(h.instances[2].opts.onend)()
    await tick()
    expect(h.instances).toHaveLength(3) // 末尾 + off：不再切歌
    expect(e.getState()).toMatchObject({ isPlaying: false, currentTrack: null })
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isPlaying: false, currentTrack: null }))
  })

  it('Howl 加载失败 → 回退原生 Audio：卸载 Howl、按音量播放、timeupdate 同步进度；ended 收尾、error 事件与 play() 被拒均置停通知', async () => {
    useFake()
    seedStorage([mkTrack('t1')])
    const e = mk()
    const listener = vi.fn()
    e.subscribe(listener)
    await e.play('t1')
    const howl = h.instances[0]
    howl.opts.onload?.() // 纯日志回调
    howl.opts.onplay?.()
    howl.opts.onpause?.()
    expect(e.getState().isPlaying).toBe(true)
    howl.opts.onloaderror?.(1, 'decode')
    expect(howl.stop).toHaveBeenCalledTimes(1)
    expect(howl.unload).toHaveBeenCalledTimes(1)
    expect(AudioStub.instances).toHaveLength(1)
    const fb = AudioStub.instances[0]
    expect(fb.src).toBe('/music/t1.mp3')
    expect(fb.volume).toBeCloseTo(0.56)
    expect(fb.play).toHaveBeenCalledTimes(1)
    fb.dispatch('play')
    expect(h.log.info).toHaveBeenCalledWith(expect.stringContaining('备用方案播放成功'))
    must(raf.mock.calls[0])[0](16) // rAF 循环：回退播放中仍续排下一帧
    expect(raf).toHaveBeenCalledTimes(2)
    fb.currentTime = 3
    fb.duration = 100
    fb.dispatch('timeupdate')
    expect(e.getState()).toMatchObject({ currentTime: 3, duration: 100 })
    vi.advanceTimersByTime(2000) // 2 秒检查：回退元素在播 → 确认日志
    expect(h.log.info).toHaveBeenCalledWith(expect.stringContaining('正在正常播放'))
    fb.dispatch('ended') // 无播放列表 → 清空收尾
    expect(e.getState()).toMatchObject({ isPlaying: false, currentTrack: null })
    await e.play('t1') // 新播放先暂停旧回退元素
    expect(fb.pause).toHaveBeenCalled()
    must(h.instances[1].opts.onloaderror)(1, 'decode')
    AudioStub.instances[1].dispatch('error')
    expect(e.getState().isPlaying).toBe(false)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isPlaying: false }))
    AudioStub.instances[1].currentTime = 7
    e.stop() // 回退模式下 stop：暂停并归零原生元素
    expect(AudioStub.instances[1].pause).toHaveBeenCalledTimes(1)
    expect(AudioStub.instances[1].currentTime).toBe(0)
    AudioStub.rejectPlay = true // onplayerror → 回退 play() 被浏览器拒绝
    await e.play('t1')
    must(h.instances[2].opts.onplayerror)(1, 'policy')
    await tick()
    expect(e.getState().isPlaying).toBe(false)
    expect(h.log.error).toHaveBeenCalledWith(expect.stringContaining('被拒绝'), 'NotAllowedError')
    // 原生 Audio 构造失败 → 备用方案创建失败：置停并通知
    class ThrowingAudio {
      constructor() {
        throw new Error('Audio 不可用')
      }
    }
    vi.stubGlobal('Audio', ThrowingAudio)
    await e.play('t1')
    must(h.instances[3].opts.onloaderror)(1, 'decode')
    expect(h.log.error).toHaveBeenCalledWith(expect.stringContaining('备用方案创建失败'), expect.any(Error))
    expect(e.getState().isPlaying).toBe(false)
  })
})

describe('AudioEngine 音量控制', () => {
  it('主音量钳位 0–100 并同步 Howler.volume 与 gainNode；音乐音量实时作用于当前 Howl；静音(0)与 SFX 独立持久化', async () => {
    useFake()
    seedStorage([mkTrack('t1')])
    const e = mk()
    const gain = AudioContextStub.instances[0].gains[0]
    e.setMasterVolume(150)
    expect(e.getVolumes().masterVolume).toBe(100)
    expect(h.howlerVolume).toHaveBeenLastCalledWith(1)
    expect(gain.gain.value).toBe(1)
    await e.play('t1')
    const howl = h.instances[0]
    e.setMusicVolume(50)
    expect(howl.volume).toHaveBeenLastCalledWith(0.5)
    e.setMasterVolume(-5) // 静音
    expect(e.getVolumes().masterVolume).toBe(0)
    expect(h.howlerVolume).toHaveBeenLastCalledWith(0)
    expect(gain.gain.value).toBe(0)
    e.setMusicVolume(80)
    expect(howl.volume).toHaveBeenLastCalledWith(0) // master=0 → 乘积 0
    e.setSFXVolume(130)
    expect(e.getVolumes()).toMatchObject({ masterVolume: 0, musicVolume: 80, sfxVolume: 100 })
    const saved = JSON.parse(must(localStorage.getItem(STORAGE_KEY), '持久化数据'))
    expect(saved.config).toMatchObject({ masterVolume: 0, musicVolume: 80, sfxVolume: 100 })
    const snapshot = e.getVolumes() // getVolumes 返回副本
    snapshot.masterVolume = 99
    expect(e.getVolumes().masterVolume).toBe(0)
    // 存储写入异常（配额/隐私模式）→ 仅告警不抛，内存配置仍生效
    const setItem = vi.spyOn(Object.getPrototypeOf(localStorage) as Storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    try {
      expect(() => e.setSFXVolume(20)).not.toThrow()
      expect(e.getVolumes().sfxVolume).toBe(20)
      expect(h.log.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to save to storage'))
    } finally {
      setItem.mockRestore()
    }
  })
})

describe('AudioEngine 音效系统', () => {
  it('未注册命名音效 → 振荡器合成：click/hover/notification/ai-start 频率·增益·停止时刻；AI 完成和弦每 50ms 触发一音', () => {
    useFake()
    const e = mk()
    const ctx = AudioContextStub.instances[0]
    e.playUIClick()
    expect(ctx.oscillators).toHaveLength(1)
    const osc = ctx.oscillators[0]
    const g = ctx.gains[1] // gains[0] 为主增益
    expect(osc.type).toBe('sine')
    expect(osc.frequency.value).toBe(800)
    expect(g.gain.value).toBeCloseTo(0.2 * 0.8 * 0.8) // 音量 × sfx × master
    expect(osc.connect).toHaveBeenCalledWith(g)
    expect(g.connect).toHaveBeenCalledWith(ctx.destination)
    expect(osc.start).toHaveBeenCalledTimes(1)
    expect(osc.stop).toHaveBeenCalledWith(ctx.currentTime + 0.05)
    e.playUIHover()
    e.playNotification()
    e.playAIResponseStart()
    expect(ctx.oscillators.map((o) => o.frequency.value)).toEqual([800, 1200, 600, 440])
    expect(ctx.oscillators[2].stop).toHaveBeenCalledWith(ctx.currentTime + 0.2)
    e.playAIResponseComplete()
    expect(ctx.oscillators).toHaveLength(4) // 和弦经 setTimeout 延迟触发
    vi.advanceTimersByTime(0)
    expect(ctx.oscillators).toHaveLength(5)
    vi.advanceTimersByTime(49)
    expect(ctx.oscillators).toHaveLength(5)
    vi.advanceTimersByTime(1)
    expect(ctx.oscillators).toHaveLength(6)
    vi.advanceTimersByTime(50)
    expect(ctx.oscillators).toHaveLength(7)
    expect(ctx.oscillators.slice(4).map((o) => o.frequency.value)).toEqual([523.25, 659.25, 783.99])
    expect(ctx.oscillators[4].stop).toHaveBeenCalledWith(ctx.currentTime + 0.3)
  })

  it('registerSoundEffect 预载 Howl 并按 sfx×master 音量播放；未知 id 静默；池键为 uuid，命名回退键永不命中（仍走合成，疑似 bug 见报告）', () => {
    const e = mk()
    const id = e.registerSoundEffect({ name: 'ui-click', url: '/sfx/click.mp3', category: 'ui', volume: 50, defaultVolume: 50 })
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(h.instances).toHaveLength(1)
    expect(h.instances[0].opts).toMatchObject({ src: ['/sfx/click.mp3'], preload: true })
    expect(h.instances[0].opts.volume).toBeCloseTo(0.4) // 50 × 80 / 10000
    e.playSoundEffect(id)
    expect(h.instances[0].volume).toHaveBeenCalledTimes(1)
    expect(h.instances[0].volume.mock.calls[0][0]).toBeCloseTo(0.64) // 80 × 80 / 10000
    expect(h.instances[0].play).toHaveBeenCalledTimes(1)
    expect(() => e.playSoundEffect('nope')).not.toThrow()
    e.playUIClick() // 'ui-click' 键不存在（register 用 uuid）→ 回退合成音
    expect(AudioContextStub.instances[0].oscillators).toHaveLength(1)
    expect(h.instances[0].play).toHaveBeenCalledTimes(1)
  })
})

describe('AudioEngine 播放列表与编辑版本', () => {
  it('播放列表：createPlaylist 过滤无效曲目、add/remove 返回值与 currentIndex 钳位、setActive/shuffle/repeat 与持久化', () => {
    seedStorage([mkTrack('t1'), mkTrack('t2'), mkTrack('t3')])
    const e = mk()
    const pl = e.createPlaylist('我的歌单', ['t1', 'ghost', 't2'])
    expect(pl.tracks.map((t) => t.id)).toEqual(['t1', 't2'])
    expect(pl).toMatchObject({ name: '我的歌单', currentIndex: 0, shuffle: false, repeat: 'off' })
    expect(e.getPlaylistById(pl.id)).toBe(pl)
    expect(e.getPlaylists()).toHaveLength(1)
    expect(e.addToPlaylist(pl.id, 't3')).toBe(true)
    expect(e.addToPlaylist(pl.id, 'ghost')).toBe(false)
    expect(e.addToPlaylist('nope', 't1')).toBe(false)
    expect(pl.tracks).toHaveLength(3)
    pl.currentIndex = 2
    expect(e.removeFromPlaylist(pl.id, 2)).toBe(true)
    expect(pl.currentIndex).toBe(1) // 越界钳位到末尾
    expect(e.removeFromPlaylist('nope', 0)).toBe(false)
    e.setShuffle(true) // 未激活播放列表 → no-op
    e.setRepeat('one')
    expect(pl.shuffle).toBe(false)
    e.setActivePlaylist('nope')
    expect(e.getState().playlist).toBeNull()
    e.setActivePlaylist(pl.id)
    expect(e.getState().playlist?.id).toBe(pl.id)
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0) // 每轮 j=0 → 确定性洗牌
    try {
      e.setShuffle(true)
      expect(pl.shuffle).toBe(true)
      expect(pl.tracks.map((t) => t.id)).toEqual(['t2', 't1'])
      e.setRepeat('one')
      expect(pl.repeat).toBe('one')
    } finally {
      rnd.mockRestore()
    }
    const saved = JSON.parse(must(localStorage.getItem(STORAGE_KEY), '持久化数据'))
    expect(saved.playlists).toHaveLength(1)
  })

  it('编辑版本：createEditedVersion 默认值/未知原曲 null；playEditedVersion 加载后 seek→play、到点 fade 与 stop；delete 幂等', () => {
    useFake()
    seedStorage([mkTrack('t1', { duration: 60 })])
    const e = mk()
    expect(e.createEditedVersion('ghost', {})).toBeNull()
    const dflt = must(e.createEditedVersion('t1', {}), '默认剪辑')
    expect(dflt).toMatchObject({ originalId: 't1', name: '歌曲-t1 (Edited)', startTime: 0, endTime: 60, volume: 100, fadeIn: 0, fadeOut: 0, url: '/music/t1.mp3' })
    const cut = must(e.createEditedVersion('t1', { name: '副歌', startTime: 10, endTime: 30, volume: 50, fadeOut: 2 }), '副歌剪辑')
    expect(e.getEditedVersions()).toHaveLength(2)
    e.playEditedVersion('nope')
    expect(h.instances).toHaveLength(0)
    e.playEditedVersion(cut.id)
    expect(h.instances).toHaveLength(1)
    const howl = h.instances[0]
    expect(howl.opts).toMatchObject({ src: ['/music/t1.mp3'], html5: true })
    // 28号已修：三因子各 0-100 相乘后 /1e6 得 0-1 域（旧公式 /10000 得 28，真实浏览器抛 IndexSizeError）
    expect(howl.opts.volume).toBeCloseTo(0.28)
    expect(howl.once).toHaveBeenCalledWith('load', expect.any(Function))
    must(howl.onceHandlers.load)()
    expect(howl.seek).toHaveBeenCalledWith(10)
    expect(howl.play).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(17999) // (30-2-10)s 后淡出
    expect(howl.fade).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(howl.fade).toHaveBeenCalledTimes(1)
    expect(howl.fade.mock.calls[0][1]).toBe(0)
    expect(howl.fade.mock.calls[0][2]).toBeCloseTo(0.002) // fadeOut=2 按 ms 折算（与秒级时间轴单位混用，疑似 bug 见报告）
    expect(howl.stop).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2500) // (30-10)s + 500ms 停止
    expect(howl.stop).toHaveBeenCalledTimes(1)
    expect(e.deleteEditedVersion(cut.id)).toBe(true)
    expect(e.deleteEditedVersion(cut.id)).toBe(false)
    expect(e.getEditedVersions()).toHaveLength(1)
    e.playEditedVersion(dflt.id) // 重复播放先 stop 旧实例
    expect(howl.stop).toHaveBeenCalledTimes(2)
    expect(h.instances).toHaveLength(2)
  })
})

describe('AudioEngine 上传删除与持久化清理', () => {
  it('uploadAudio：读文件→blob URL→探测时长（URL 保留，39号已修）→入库并持久化（blob: 被剔除）；deleteTrack 释放 URL；未知 id false', async () => {
    AudioStub.nextDuration = 33
    const e = mk()
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'demo.mp3', { type: 'audio/mpeg' })
    const track = await e.uploadAudio(file, { tags: ['上传'] })
    expect(track).toMatchObject({ name: 'demo', url: 'blob:http://localhost/u1', size: 4, type: 'music', tags: ['上传'], duration: 33 })
    expect(urlApi.createObjectURL).toHaveBeenCalledTimes(1)
    // 39号已修：探测时长后不可 revoke——audio.src 即 track.url（常驻播放地址），
    // 历史缺陷在探测后自毁 URL 致上传曲目不可播放。删除后不调用，deleteTrack 才释放
    expect(urlApi.revokeObjectURL).not.toHaveBeenCalled()
    expect(e.getTrackById(track.id)).toBe(track)
    const saved = JSON.parse(must(localStorage.getItem(STORAGE_KEY), '持久化数据'))
    expect(JSON.stringify(saved)).not.toContain('blob:')
    AudioStub.failPattern = /^blob:/ // 第二次探测失败 → 时长回退 0
    const fx = await e.uploadAudio(file, { name: '提示音', type: 'effect' })
    expect(fx).toMatchObject({ name: '提示音', type: 'effect', duration: 0 })
    expect(e.deleteTrack(track.id)).toBe(true)
    expect(urlApi.revokeObjectURL).toHaveBeenLastCalledWith('blob:http://localhost/u1')
    expect(e.getTrackById(track.id)).toBeUndefined()
    expect(e.deleteTrack('ghost')).toBe(false)
  })

  it('subscribe 退订后不再通知；exportConfig 播放列表仅含曲目 id；importConfig 合并配置/非法 JSON false；destroy 释放 Howl·音效池·上下文并清空监听', async () => {
    useFake()
    seedStorage([mkTrack('t1'), mkTrack('t2')])
    const e = mk()
    const listener = vi.fn()
    const off = e.subscribe(listener)
    const pl = e.createPlaylist('导出单', ['t1', 't2'])
    await e.play('t1')
    expect(listener).toHaveBeenCalledTimes(1)
    off()
    e.pause()
    expect(listener).toHaveBeenCalledTimes(1)
    const exported = JSON.parse(e.exportConfig())
    expect(exported.config.masterVolume).toBe(80)
    expect(exported.playlists).toEqual([expect.objectContaining({ id: pl.id, name: '导出单', tracks: ['t1', 't2'] })])
    expect(e.importConfig(JSON.stringify({ config: { musicVolume: 12, normalizeAudio: false } }))).toBe(true)
    expect(e.getVolumes()).toMatchObject({ masterVolume: 80, musicVolume: 12, normalizeAudio: false })
    expect(JSON.parse(must(localStorage.getItem(STORAGE_KEY), '持久化数据')).config.musicVolume).toBe(12)
    expect(e.importConfig('{oops')).toBe(false)
    const fxId = e.registerSoundEffect({ name: 'ding', url: '/sfx/ding.mp3', category: 'notification', volume: 80, defaultVolume: 80 })
    const listener2 = vi.fn()
    e.subscribe(listener2)
    e.destroy()
    const [music, fx] = h.instances
    expect(music.stop).toHaveBeenCalled()
    expect(music.unload).toHaveBeenCalledTimes(1)
    expect(fx.unload).toHaveBeenCalledTimes(1)
    expect(AudioContextStub.instances[0].close).toHaveBeenCalledTimes(1)
    expect(e.getState()).toMatchObject({ isPlaying: false, currentTrack: null })
    e.playSoundEffect(fxId) // 池已清空 → 静默
    expect(fx.play).not.toHaveBeenCalled()
    e.pause() // 监听已清空 → 不再通知
    expect(listener2).not.toHaveBeenCalled()
  })
})
