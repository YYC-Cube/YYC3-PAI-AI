/**
 * @file AudioEditor.test.tsx
 * @description 音频剪辑编辑器专项 — 桩 audio-engine/AudioContext/fetch/Canvas 2D/媒体元素，驱动：波形生成
 *              （200 分块均值 + 失败降级日志）、播放暂停与进度/元数据/结束事件、画布点选 seek 钳位、
 *              起止滑杆与音量/淡入淡出、拖拽选择手柄（含窗口级 mousemove/mouseup）、保存编辑版本与回调、
 *              重置、删除原曲、取消按钮有无
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import type { Mock } from 'vitest'

const h = vi.hoisted(() => {
  interface EditedAudioLike {
    originalId: string
    id: string
    name: string
    startTime: number
    endTime: number
    volume: number
    fadeIn: number
    fadeOut: number
    url: string
  }
  const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const engine = {
    createEditedVersion: vi.fn((): EditedAudioLike | null => null),
    deleteTrack: vi.fn(() => false),
  }
  return { log, engine }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))
vi.mock('../../../utils/logger', () => ({
  createLogger: () => h.log,
}))

import { AudioEditor } from '../AudioEditor'
import type { AudioTrack, EditedAudio } from '../../../utils/audio-engine'

// ── 桩基建 ──

const makeCtx2D = () => ({
  canvas: null,
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  scale: vi.fn(),
  lineWidth: 1,
  fillStyle: '',
})

let ctx2d: ReturnType<typeof makeCtx2D>
let audioCtxInstances: Array<{ decodeAudioData: Mock; close: Mock }>

/** AudioContext 桩（decodeAudioData 返回固定幅度 0.5 的样本） */
class AudioContextStub {
  sampleRate = 44100
  currentTime = 0
  decodeAudioData = vi.fn(async () => ({
    getChannelData: () => new Float32Array(4000).fill(0.5),
  }))
  close = vi.fn(async () => {})
  constructor() {
    audioCtxInstances.push(this)
  }
}

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

const track: AudioTrack = {
  id: 't1',
  name: '云枢光痕',
  url: '/music/t1.mp3',
  duration: 60,
  size: 1024,
  type: 'music',
  tags: [],
  createdAt: 1,
  updatedAt: 1,
}

const getAudioEl = (c: HTMLElement) => c.querySelector('audio') as HTMLAudioElement
const btnByLabel = (c: HTMLElement, label: string) =>
  c.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement

const editedFixture: EditedAudio = {
  originalId: 't1',
  id: 'e1',
  name: '云枢光痕 (Edited)',
  startTime: 0,
  endTime: 60,
  volume: 100,
  fadeIn: 0,
  fadeOut: 0,
  url: '/music/t1.mp3',
}

beforeEach(() => {
  vi.resetAllMocks()
  ctx2d = makeCtx2D()
  audioCtxInstances = []
  installCanvas()
  Object.defineProperty(globalThis, 'AudioContext', {
    value: AudioContextStub,
    writable: true,
    configurable: true,
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) }))
  )
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    value: vi.fn(async () => {}),
    writable: true,
    configurable: true,
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AudioEditor（音频剪辑编辑器）', () => {
  it('渲染曲目名、时长与选中区间标签（00:00 / 01:00 格式）', async () => {
    const { container } = render(<AudioEditor track={track} />)
    await act(async () => {}) // 冲刷波形生成的异步 setState
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('选中: 01:00')
    expect(container.textContent).toContain('01:00')
    expect(getAudioEl(container).getAttribute('src')).toBe('/music/t1.mp3')
  })

  it('波形生成：fetch 曲目 URL → decodeAudioData → 200 根柱绘制并关闭 AudioContext', async () => {
    render(<AudioEditor track={track} />)
    await act(async () => {})

    expect(fetch).toHaveBeenCalledWith('/music/t1.mp3')
    expect(audioCtxInstances).toHaveLength(1)
    expect(audioCtxInstances[0].decodeAudioData).toHaveBeenCalledTimes(1)
    // generateWaveform 直绘一次 + waveformData 变更触发 effect 再绘一次 → 2 × 200
    expect(ctx2d.fillRect).toHaveBeenCalledTimes(400)
    expect(audioCtxInstances[0].close).toHaveBeenCalledTimes(1)
    // 样本 0.5 幅度 → 柱高 = 0.5/0.5 × 高 × 0.8 = 96
    const call = ctx2d.fillRect.mock.calls[0]
    expect(call[3]).toBeCloseTo(96)
    expect(ctx2d.fillStyle).toBe('#06b6d4') // 区间内主色
  })

  it('波形生成失败（fetch 拒绝）→ 记录告警不崩溃、不绘制', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    render(<AudioEditor track={track} />)
    await act(async () => {})
    expect(h.log.warn).toHaveBeenCalledWith('[YYC3 Audio] Failed to generate waveform')
    expect(ctx2d.fillRect).not.toHaveBeenCalled()
  })

  it('播放/暂停切换：播放从起点开始（currentTime=startTime）并切暂停图标；timeupdate 同步进度、loadedmetadata 更新时长、ended 复位', async () => {
    const { container } = render(<AudioEditor track={track} />)
    const audio = getAudioEl(container)
    await act(async () => {}) // 先完成波形生成，避免其 await 打断后续断言

    fireEvent.click(btnByLabel(container, '播放'))
    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(audio.currentTime).toBe(0) // startTime 初始 0
    expect(btnByLabel(container, '暂停')).toBeTruthy()

    audio.currentTime = 12.4
    fireEvent(audio, new Event('timeupdate'))
    expect(container.textContent).toContain('00:12')

    // jsdom duration 仅有 getter → 以 defineProperty 注入
    Object.defineProperty(audio, 'duration', { value: 75, configurable: true })
    fireEvent(audio, new Event('loadedmetadata'))
    expect(container.textContent).toContain('00:12 / 01:15') // 时长标签更新
    // 注意：endTime 状态仅由初始 track.duration/滑杆驱动 → 选中区间不随元数据时长变化
    expect(container.textContent).toContain('选中: 01:00')

    // 播放中再次点击 → 暂停
    fireEvent.click(btnByLabel(container, '暂停'))
    expect(audio.pause).toHaveBeenCalledTimes(1)

    // ended 事件 → 复位到播放图标
    fireEvent(audio, new Event('ended'))
    expect(btnByLabel(container, '播放')).toBeTruthy()
  })

  it('画布点选 seek：x=400/800 → 30s，钳位在起止区间内；拖拽起点手柄经窗口 mousemove 更新起点且不低于 0、不超过终点-1', async () => {
    const { container } = render(<AudioEditor track={track} />)
    await act(async () => {})
    const canvas = container.querySelector('canvas') as HTMLElement
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 800 } as DOMRect)
    const audio = getAudioEl(container)

    fireEvent.click(canvas, { clientX: 400 })
    expect(audio.currentTime).toBe(30)
    expect(container.textContent).toContain('00:30')

    // 拖拽起点手柄（第一个 ew-resize 手柄）
    const handles = container.querySelectorAll('.cursor-ew-resize')
    const startHandle = handles[0] as HTMLElement
    const endHandle = handles[1] as HTMLElement
    vi.spyOn(endHandle, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 800 } as DOMRect)

    fireEvent.mouseDown(startHandle)
    fireEvent(window, new MouseEvent('mousemove', { clientX: 400 }))
    expect(container.textContent).toContain('00:30') // 起点 → 30s（0:30 位置标签）
    // 起点标签更新（只取 span 标签，避开同 class 的容器 div）
    const timeLabels = () => container.querySelectorAll('span.text-gray-500')
    expect(timeLabels()[0].textContent).toBe('00:30')
    fireEvent(window, new MouseEvent('mouseup'))
    // 松开后 mousemove 不再更新
    fireEvent(window, new MouseEvent('mousemove', { clientX: 100 }))
    expect(timeLabels()[0].textContent).toBe('00:30')
  })

  it('拖拽终点手柄：钳位不低于起点+1、不高于时长；滑杆变更起止时间与音量、淡入淡出数值', async () => {
    const { container } = render(<AudioEditor track={track} />)
    await act(async () => {})
    const endHandle = container.querySelectorAll('.cursor-ew-resize')[1] as HTMLElement
    const canvas = container.querySelector('canvas') as HTMLElement
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 800 } as DOMRect)

    fireEvent.mouseDown(endHandle)
    fireEvent(window, new MouseEvent('mousemove', { clientX: 100 })) // 100/800×60 = 7.5s
    fireEvent(window, new MouseEvent('mousemove', { clientX: 900 })) // 超出 → 钳位 60s
    // span.text-gray-500 仅两个：起点 [0]、终点 [1]（「选中」为青色 span）
    expect(container.querySelectorAll('span.text-gray-500')[1].textContent).toBe('01:00')
    fireEvent(window, new MouseEvent('mouseup'))

    // 起止滑杆
    const start = container.querySelector('#audio-start-time') as HTMLInputElement
    const end = container.querySelector('#audio-end-time') as HTMLInputElement
    const volume = container.querySelector('#audio-volume') as HTMLInputElement
    fireEvent.change(start, { target: { value: '10' } })
    fireEvent.change(end, { target: { value: '50' } })
    fireEvent.change(volume, { target: { value: '150' } })
    expect(start.value).toBe('10')
    expect(end.value).toBe('50')
    expect(container.textContent).toContain('选中: 00:40')
    expect(container.textContent).toContain('150%')

    // 淡入淡出数字输入
    const numbers = container.querySelectorAll('input[type="number"]')
    fireEvent.change(numbers[0], { target: { value: '2' } })
    fireEvent.change(numbers[1], { target: { value: '3' } })
    expect((numbers[0] as HTMLInputElement).value).toBe('2')
    expect((numbers[1] as HTMLInputElement).value).toBe('3')
  })

  it('保存编辑版本：以当前起止/音量/淡入淡出调用 createEditedVersion 并回传 onSave', async () => {
    const onSave = vi.fn()
    h.engine.createEditedVersion.mockReturnValueOnce(editedFixture)
    const { container } = render(<AudioEditor track={track} onSave={onSave} />)
    await act(async () => {})

    const start = container.querySelector('#audio-start-time') as HTMLInputElement
    const end = container.querySelector('#audio-end-time') as HTMLInputElement
    fireEvent.change(start, { target: { value: '10' } })
    fireEvent.change(end, { target: { value: '45' } })

    fireEvent.click(btnByLabel(container, '保存编辑版本'))
    expect(h.engine.createEditedVersion).toHaveBeenCalledWith('t1', {
      startTime: 10,
      endTime: 45,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
    })
    expect(onSave).toHaveBeenCalledWith(editedFixture)
  })

  it('createEditedVersion 返回 null（未知曲目）→ onSave 不回调', async () => {
    const onSave = vi.fn()
    const { container } = render(<AudioEditor track={track} onSave={onSave} />)
    await act(async () => {})
    fireEvent.click(btnByLabel(container, '保存编辑版本'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('重置按钮：改动后一键回到 0/duration/100 音量/零淡入淡出；删除按钮调用 deleteTrack', async () => {
    h.engine.deleteTrack.mockReturnValueOnce(true)
    const { container } = render(<AudioEditor track={track} />)
    await act(async () => {})
    const start = container.querySelector('#audio-start-time') as HTMLInputElement
    const volume = container.querySelector('#audio-volume') as HTMLInputElement
    fireEvent.change(start, { target: { value: '20' } })
    fireEvent.change(volume, { target: { value: '80' } })

    fireEvent.click(btnByLabel(container, '重置'))
    expect(start.value).toBe('0')
    expect(volume.value).toBe('100')
    expect(container.textContent).toContain('选中: 01:00')

    fireEvent.click(btnByLabel(container, '删除原始文件'))
    expect(h.engine.deleteTrack).toHaveBeenCalledWith('t1')
  })

  it('onCancel 存在时渲染取消按钮并回调；未传 onCancel 时不渲染', async () => {
    const onCancel = vi.fn()
    const a = render(<AudioEditor track={track} onCancel={onCancel} />)
    await act(async () => {})
    expect(a.container.querySelector('[aria-label="取消"]')).toBeTruthy()
    fireEvent.click(btnByLabel(a.container, '取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    a.unmount()

    const b = render(<AudioEditor track={track} />)
    await act(async () => {})
    expect(b.container.querySelector('[aria-label="取消"]')).toBeNull()
  })
})
