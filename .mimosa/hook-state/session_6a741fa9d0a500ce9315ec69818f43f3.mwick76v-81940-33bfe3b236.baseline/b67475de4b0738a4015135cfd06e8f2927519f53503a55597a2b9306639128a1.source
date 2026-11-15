/**
 * @file AudioDiagnostic.test.tsx
 * @description 音频系统诊断专项 — 全桩 fetch(HEAD)/AudioContext/Audio/howler/存储，驱动：六段检测流水线
 *              全绿（缓存/文件/Howler/WebAudio/自动播放/实际加载）、缓存四态（正常/无缓存/旧版/为空/损坏）、
 *              文件可达性三态、WebAudio 暂停警告、一键修复（清缓存+清内存+强制重载）、强制播放测试
 *              （成功/失败/空库异常/停止）、重新检测按钮
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

// 存储键按铁律拆分拼接（与 audio-engine 约定一致）
const KEY_ENGINE = ['yyc3', 'audio', 'engine'].join('-')
const KEY_LIB_VERSION = ['yyc3', 'audio', 'library', 'version'].join('-')

const h = vi.hoisted(() => {
  const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const engine = {
    getTracks: vi.fn((): Array<{ id: string; name: string; url: string; duration: number }> => []),
    initializeMusicLibrary: vi.fn(async () => [] as Array<{ id: string; name: string; url: string; duration: number }>),
    play: vi.fn(async () => {}),
    stop: vi.fn(),
    getState: vi.fn((): StateLike => ({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: null })),
  }
  interface TrackLike {
    id: string
    name: string
    url: string
    duration: number
  }
  interface StateLike {
    isPlaying: boolean
    currentTime: number
    duration: number
    currentTrack: TrackLike | null
  }
  class HowlStub {
    play = vi.fn(() => 1)
  }
  return { log, engine, HowlStub }
})

vi.mock('../../../store/theme-store', () => ({
  useThemeStore: () => ({ tokens: { primary: '#8b5cf6', cardBg: '#111', border: '#333', foreground: '#fff', foregroundMuted: '#9ca3af' } }),
}))
vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))
vi.mock('../../../utils/logger', () => ({ createLogger: () => h.log }))
// 诊断经动态 import('howler') 检测引擎可用性 → 提供 default 导出即「已就绪」
vi.mock('howler', () => ({ Howl: h.HowlStub, default: h.HowlStub }))

import { AudioDiagnostic } from '../AudioDiagnostic'

// ── Web Audio / 原生 Audio 桩 ──

class AudioContextStub {
  static instances: AudioContextStub[] = []
  static initialState: 'running' | 'suspended' = 'running'
  state: string
  close = vi.fn(async () => {})
  constructor() {
    this.state = AudioContextStub.initialState
    AudioContextStub.instances.push(this)
  }
}

/** 原生 Audio 桩：src 赋值（微任务派发）后按 mode 派发 canplaythrough / error */
class AudioStub {
  static mode: 'canplay' | 'error' = 'canplay'
  private listeners = new Map<string, Array<() => void>>()
  private srcValue = ''
  load = vi.fn()
  addEventListener(type: string, cb: () => void) {
    const arr = this.listeners.get(type) ?? []
    arr.push(cb)
    this.listeners.set(type, arr)
  }
  dispatch(type: string) {
    for (const cb of (this.listeners.get(type) ?? []).slice()) cb()
  }
  get src(): string {
    return this.srcValue
  }
  set src(v: string) {
    this.srcValue = v
    if (!v) return
    queueMicrotask(() => {
      this.dispatch(AudioStub.mode === 'canplay' ? 'canplaythrough' : 'error')
    })
  }
}

const installEnv = () => {
  Object.defineProperty(globalThis, 'AudioContext', { value: AudioContextStub, writable: true, configurable: true })
  Object.defineProperty(globalThis, 'webkitAudioContext', { value: AudioContextStub, writable: true, configurable: true })
  vi.stubGlobal('Audio', AudioStub)
}

/** 六段检测共 ~1.9s 的人为延时；统一推进并清空微任务 */
const runDiagnostics = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
}

const resultBadge = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('span')).some((s) => s.textContent === text)

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  localStorage.clear()
  AudioContextStub.instances = []
  AudioContextStub.initialState = 'running'
  AudioStub.mode = 'canplay'
  installEnv()
  // 文件存在性 HEAD 探测：默认全部可达
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('AudioDiagnostic（音频系统诊断）', () => {
  it('全绿基线：六项检测全部 ✓ 正常、底部全过提示、无修复按钮', async () => {
    localStorage.setItem(KEY_ENGINE, JSON.stringify({ tracks: [['t1', {}], ['t2', {}]] }))
    localStorage.setItem(KEY_LIB_VERSION, '2.0')

    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    expect(resultBadge(container, '✓ 正常')).toBe(true)
    expect(container.querySelectorAll('span').length).toBeGreaterThanOrEqual(6)
    expect(container.textContent).toContain('所有测试文件可访问 (4/4)')
    expect(container.textContent).toContain('Howler.js 已就绪')
    expect(container.textContent).toContain('Web Audio API 正常运行')
    expect(container.textContent).toContain('状态: running')
    expect(container.textContent).toContain('自动播放允许')
    expect(container.textContent).toContain('音频加载成功')
    expect(container.textContent).toContain('✅ 所有检测项均通过，音频系统正常运行')
    expect(container.textContent).not.toContain('一键修复')
    expect(AudioContextStub.instances[0].close).toHaveBeenCalledTimes(1) // 探测用上下文即开即关
  })

  it('无缓存 → 「无缓存数据」可修复警告 + 一键修复按钮 + 黄色提示条', async () => {
    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    expect(container.textContent).toContain('无缓存数据')
    expect(container.textContent).toContain('首次使用或已清除')
    expect(container.textContent).toContain('一键修复')
    expect(container.textContent).toContain('⚠️ 存在警告项，建议修复以获得最佳体验')
    // 可修复项的引导按钮
    expect(container.textContent).toContain('点击"一键修复"解决此问题')
  })

  it('旧版缓存（v1.0）与空缓存分别给出对应警告；损坏 JSON → 缓存读取失败错误', async () => {
    const a = render(<AudioDiagnostic onClose={() => {}} />)
    localStorage.setItem(KEY_ENGINE, JSON.stringify({ tracks: [['t1', {}]] }))
    localStorage.setItem(KEY_LIB_VERSION, '1.0')
    await runDiagnostics()
    expect(a.container.textContent).toContain('发现旧版缓存 (v1.0)')
    expect(a.container.textContent).toContain('需要更新到 v2.0')
    a.unmount()

    localStorage.setItem(KEY_LIB_VERSION, '2.0')
    localStorage.setItem(KEY_ENGINE, JSON.stringify({ tracks: [] }))
    const b = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(b.container.textContent).toContain('缓存为空')
    b.unmount()

    localStorage.setItem(KEY_ENGINE, '{corrupted')
    const c = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(c.container.textContent).toContain('缓存读取失败')
    expect(c.container.textContent).toContain('❌ 发现问题，请点击"一键修复"')
  })

  it('文件可达性：全部失败 → 错误提示与修复引导；部分失败（2/4）→ 列出失败文件名', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const a = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(a.container.textContent).toContain('所有测试文件都无法访问')
    expect(a.container.textContent).toContain('/public 目录')
    a.unmount()

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        // 仅按文件名判断：沫言两首可达、沫语两首失败（目录前缀亦含艺人名，故取最后一段）
        const fileName = decodeURIComponent(String(url)).split('/').pop() ?? ''
        return Promise.resolve(fileName.includes('沫言') ? { ok: true } : { ok: false })
      })
    )
    const b = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(b.container.textContent).toContain('部分文件无法访问 (2/4)')
    expect(b.container.textContent).toContain('失败:')
  })

  it('Web Audio 暂停 → 黄色警告「需要用户交互」；AudioContext 缺失 → 「不可用」警告', async () => {
    AudioContextStub.initialState = 'suspended'
    const a = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(a.container.textContent).toContain('Web Audio API 已暂停')
    a.unmount()

    Object.defineProperty(globalThis, 'AudioContext', { value: undefined, writable: true, configurable: true })
    Object.defineProperty(globalThis, 'webkitAudioContext', { value: undefined, writable: true, configurable: true })
    const b = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(b.container.textContent).toContain('Web Audio API 不可用')
  })

  it('实际加载失败（Audio error 事件）→ 加载失败详情含 URL 与原因清单', async () => {
    localStorage.setItem(KEY_ENGINE, JSON.stringify({ tracks: [['t1', {}]] }))
    localStorage.setItem(KEY_LIB_VERSION, '2.0')
    AudioStub.mode = 'error'
    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()
    expect(container.textContent).toContain('音频加载失败')
    expect(container.textContent).toContain('沫言 - 男人的难.mp3')
    expect(container.textContent).toContain('CORS问题')
  })

  it('一键修复：清除两个存储键 → 清空引擎内存轨道 → 强制重载 → 缓存结果更新为「缓存已重建」', async () => {
    localStorage.setItem(KEY_ENGINE, '{old')
    localStorage.setItem(KEY_LIB_VERSION, '1.0')
    h.engine.initializeMusicLibrary.mockResolvedValue([{ id: 'x', name: '新曲', url: '', duration: 10 }])

    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    const fixBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('一键修复'))!
    fireEvent.click(fixBtn)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(localStorage.getItem(KEY_ENGINE)).toBeNull()
    expect(localStorage.getItem(KEY_LIB_VERSION)).toBeNull()
    expect(h.engine.initializeMusicLibrary).toHaveBeenCalledWith(true)
    expect(container.textContent).toContain('缓存已重建')
    expect(container.textContent).toContain('1 首歌曲')
  })

  it('一键修复重载失败 → 「重新加载失败」错误结果', async () => {
    localStorage.setItem(KEY_LIB_VERSION, '1.0')
    h.engine.initializeMusicLibrary.mockRejectedValue(new Error('NAS 离线'))
    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('一键修复'))!)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(h.log.error).toHaveBeenCalledWith('[YYC3 Diagnostic] ❌ 重新加载失败:', expect.any(Error))
    expect(container.textContent).toContain('重新加载失败')
  })

  it('强制播放测试成功：播首曲 → 2s 后状态在播 → 1s 后时间走动 → ✅ 播放成功 + 实时日志', async () => {
    const track = { id: 't1', name: '云枢光痕', url: '/music/t1.mp3', duration: 200 }
    h.engine.getTracks.mockReturnValue([track])
    let call = 0
    h.engine.getState.mockImplementation(() => {
      call++
      // 第 1 次：播后状态核查；第 2 次：1s 后时间走动核查（0 → 2.5）
      if (call === 1) return { isPlaying: true, currentTime: 0, duration: 200, currentTrack: track }
      return { isPlaying: true, currentTime: 2.5, duration: 200, currentTrack: track }
    })

    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('开始测试'))!)
    // 测试进行中（状态 playing）→ 停止按钮出现 → 点击走 stopTest 路径
    const stopBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('停止'))
    expect(stopBtn).toBeTruthy()
    fireEvent.click(stopBtn!)
    expect(h.engine.stop).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('已停止')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(h.engine.play).toHaveBeenCalledWith('t1')
    expect(container.textContent).toContain('✅ 播放成功！')
    expect(container.textContent).toContain('云枢光痕 (200.0s)')
    expect(container.textContent).toContain('时间正常走动')
    expect(container.textContent).toContain('audioEngine.play()')
  })

  it('强制播放测试失败（isPlaying=false）→ ❌ 播放失败与状态日志', async () => {
    const track = { id: 't1', name: '云枢光痕', url: '/music/t1.mp3', duration: 200 }
    h.engine.getTracks.mockReturnValue([track])
    h.engine.getState.mockReturnValue({ isPlaying: false, currentTime: 0, duration: 0, currentTrack: null })

    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('开始测试'))!)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(container.textContent).toContain('❌ 播放失败')
    expect(container.textContent).toContain('isPlaying=false')
  })

  it('空库且重载为空 → 异常「没有可用的歌曲」；重新检测按钮重跑流水线', async () => {
    // 预置正常缓存 → 重跑后可到达全绿提示
    localStorage.setItem(KEY_ENGINE, JSON.stringify({ tracks: [['t1', {}]] }))
    localStorage.setItem(KEY_LIB_VERSION, '2.0')
    h.engine.getTracks.mockReturnValueOnce([])
    h.engine.initializeMusicLibrary.mockResolvedValueOnce([])
    const { container } = render(<AudioDiagnostic onClose={() => {}} />)
    await runDiagnostics()

    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('开始测试'))!)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(container.textContent).toContain('没有可用的歌曲')

    // 重新检测：六项结果重置后再次完成（fetch 仍全可达）
    const refresh = container.querySelector('[aria-label="重新检测"]') as HTMLButtonElement
    expect(refresh.disabled).toBe(false)
    fireEvent.click(refresh)
    await runDiagnostics()
    expect(container.textContent).toContain('✅ 所有检测项均通过，音频系统正常运行')
  })
})
