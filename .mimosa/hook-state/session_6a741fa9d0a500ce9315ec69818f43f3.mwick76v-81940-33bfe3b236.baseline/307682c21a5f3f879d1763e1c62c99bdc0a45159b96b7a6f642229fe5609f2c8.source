/**
 * @file AdvancedAudioModule.test.ts
 * @description 高级音频处理模块专项 — jsdom 无 Web Audio，全桩 AudioContext 节点图（Panner/Convolver/Gain/
 *              Splitter/Merger/AudioParam），驱动：3D环绕声初始化图谱与监听者姿态/空间模式预设/旋转/混响钳位/
 *              启停与销毁降级、卡拉OK相位反相图谱与人声消除强度/开关切换、交叉淡入淡出三曲线（线性/等功率/S曲线）
 *              与增益交换、混响与曲线常量预设
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  CROSSFADE_CURVES,
  CrossfadeProcessor,
  KaraokeProcessor,
  REVERB_PRESETS,
  SpatialAudioProcessor,
} from '../AdvancedAudioModule'

// ── Web Audio 节点桩 ──

class ParamStub {
  value = 0
  setValueAtTime = vi.fn((v: number, _t?: number) => {
    this.value = v
  })
  linearRampToValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
}

class NodeStub {
  connect = vi.fn()
  disconnect = vi.fn()
}

/** 记录型节点：connect 目标与通道参数可断言 */
class RecordingNode extends NodeStub {
  connect = vi.fn((_node: unknown, output?: number, input?: number) => {
    this.connections.push([_node, output, input])
  })
  readonly connections: Array<[unknown, number | undefined, number | undefined]> = []
}

class GainStub extends RecordingNode {
  gain = new ParamStub()
}

class PannerStub extends NodeStub {
  panningModel = ''
  distanceModel = ''
  refDistance = 0
  maxDistance = 0
  rolloffFactor = 0
  coneInnerAngle = 0
  coneOuterAngle = 0
  positionX = new ParamStub()
  positionY = new ParamStub()
  positionZ = new ParamStub()
}

class ConvolverStub extends NodeStub {
  buffer: unknown = null
}

class SplitterStub extends RecordingNode {}
class MergerStub extends RecordingNode {}

const makeCtx = () => {
  const panners: PannerStub[] = []
  const convolvers: ConvolverStub[] = []
  const gains: GainStub[] = []
  const splitters: SplitterStub[] = []
  const mergers: MergerStub[] = []
  const buffers: Array<{ channels: Float32Array[]; sampleRate: number; length: number }> = []
  const listener = {
    positionX: new ParamStub(),
    positionY: new ParamStub(),
    positionZ: new ParamStub(),
    forwardX: new ParamStub(),
    forwardY: new ParamStub(),
    forwardZ: new ParamStub(),
    upX: new ParamStub(),
    upY: new ParamStub(),
    upZ: new ParamStub(),
  }
  const ctx = {
    sampleRate: 1000,
    currentTime: 1.5,
    destination: new NodeStub(),
    listener,
    createPanner: vi.fn(() => {
      const n = new PannerStub()
      panners.push(n)
      return n
    }),
    createConvolver: vi.fn(() => {
      const n = new ConvolverStub()
      convolvers.push(n)
      return n
    }),
    createGain: vi.fn(() => {
      const n = new GainStub()
      gains.push(n)
      return n
    }),
    createChannelSplitter: vi.fn(() => {
      const n = new SplitterStub()
      splitters.push(n)
      return n
    }),
    createChannelMerger: vi.fn(() => {
      const n = new MergerStub()
      mergers.push(n)
      return n
    }),
    createBuffer: vi.fn((_ch: number, length: number, sampleRate: number) => {
      const b = {
        channels: [new Float32Array(length), new Float32Array(length)],
        sampleRate,
        length,
      }
      b.channels.forEach((c, i) => {
        Object.defineProperty(b, `ch${i}`, { value: c })
      })
      buffers.push(b)
      // getChannelData 依通道返回
      ;(b as unknown as { getChannelData: (i: number) => Float32Array }).getChannelData = (
        i: number
      ) => b.channels[i]
      return b
    }),
    panners,
    convolvers,
    gains,
    splitters,
    mergers,
    buffers,
  }
  return ctx
}

/** 源节点桩（带 connect 以校验图谱起点） */
const makeSource = () => ({ connect: vi.fn() })

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

// ── 3D环绕声处理器 ──

describe('SpatialAudioProcessor（3D环绕声）', () => {
  it('initialize 构建 source→panner→(dry|convolver→wet)→destination 图谱，HRTF/Inverse 参数与监听者姿态复位', () => {
    const p = new SpatialAudioProcessor()
    const ctx = makeCtx()
    const source = makeSource()
    p.initialize(ctx as unknown as AudioContext, source as unknown as MediaElementAudioSourceNode, ctx.destination as unknown as AudioDestinationNode)

    expect(ctx.panners).toHaveLength(1)
    const panner = ctx.panners[0]
    expect(panner.panningModel).toBe('HRTF')
    expect(panner.distanceModel).toBe('inverse')
    expect(panner.refDistance).toBe(1)
    expect(panner.maxDistance).toBe(10000)
    expect(panner.rolloffFactor).toBe(1)
    expect(panner.coneInnerAngle).toBe(360)
    expect(panner.coneOuterAngle).toBe(360)

    // 卷积混响 IR：2 通道、2.5s × sampleRate
    expect(ctx.convolvers).toHaveLength(1)
    expect(ctx.buffers).toHaveLength(1)
    expect(ctx.buffers[0].length).toBe(2500)
    expect(ctx.buffers[0].sampleRate).toBe(1000)

    // 湿/干增益初值
    expect(ctx.gains).toHaveLength(2)
    const [wet, dry] = ctx.gains
    expect(wet.gain.value).toBe(0)
    expect(dry.gain.value).toBe(1)

    // 连线
    expect(source.connect).toHaveBeenCalledWith(panner)
    expect(panner.connect).toHaveBeenCalledWith(dry)
    expect(panner.connect).toHaveBeenCalledWith(ctx.convolvers[0])
    expect(ctx.convolvers[0].connect).toHaveBeenCalledWith(wet)
    expect(dry.connect).toHaveBeenCalledWith(ctx.destination)
    expect(wet.connect).toHaveBeenCalledWith(ctx.destination)

    // 监听者姿态：位置原点、朝向 -Z、上方 +Y
    expect(ctx.listener.positionX.value).toBe(0)
    expect(ctx.listener.positionZ.value).toBe(0)
    expect(ctx.listener.forwardZ.value).toBe(-1)
    expect(ctx.listener.upY.value).toBe(1)
    expect(p.active).toBe(false)
  })

  it('setSpatialMode 应用预设坐标与湿干比例（音乐厅 wet 0.3），未知模式回退录音室；未初始化时静默', () => {
    const p = new SpatialAudioProcessor()
    // 未初始化 → 全部 no-op
    expect(() => p.setSpatialMode('studio')).not.toThrow()

    const ctx = makeCtx()
    p.initialize(ctx as unknown as AudioContext, makeSource() as unknown as MediaElementAudioSourceNode, ctx.destination as unknown as AudioDestinationNode)
    const panner = ctx.panners[0]
    const [wet, dry] = ctx.gains

    p.setSpatialMode('concert' as ' concert') // 源码类型字面量带前导空格（疑似 bug，见报告），运行时键值为 'concert'
    expect(panner.positionX.setValueAtTime).toHaveBeenCalledWith(0, 1.5)
    expect(panner.positionY.setValueAtTime).toHaveBeenCalledWith(2, 1.5)
    expect(panner.positionZ.setValueAtTime).toHaveBeenCalledWith(-5, 1.5)
    expect(wet.gain.setValueAtTime).toHaveBeenLastCalledWith(0.3, 1.5)
    expect(dry.gain.setValueAtTime).toHaveBeenLastCalledWith(0.7, 1.5)

    // 未知模式（含带空格的畸形值）→ 回退 studio 配置
    p.setSpatialMode('bogus' as 'studio')
    expect(panner.positionY.setValueAtTime).toHaveBeenLastCalledWith(1, 1.5)
    expect(panner.positionZ.setValueAtTime).toHaveBeenLastCalledWith(-2, 1.5)
    expect(wet.gain.setValueAtTime).toHaveBeenLastCalledWith(0.1, 1.5)

    // 体育馆
    p.setSpatialMode('arena')
    expect(panner.positionZ.setValueAtTime).toHaveBeenLastCalledWith(-10, 1.5)
  })

  it('setRotation 按半径 3 计算圆周坐标：0°→(0,3)、90°→(3,0)；未初始化静默', () => {
    const p = new SpatialAudioProcessor()
    expect(() => p.setRotation(Math.PI / 2)).not.toThrow()

    const ctx = makeCtx()
    p.initialize(ctx as unknown as AudioContext, makeSource() as unknown as MediaElementAudioSourceNode, ctx.destination as unknown as AudioDestinationNode)
    const panner = ctx.panners[0]

    p.setRotation(0)
    expect(panner.positionX.setValueAtTime).toHaveBeenLastCalledWith(0, 1.5)
    expect(panner.positionZ.setValueAtTime).toHaveBeenLastCalledWith(3, 1.5)

    p.setRotation(Math.PI / 2)
    expect(panner.positionX.setValueAtTime.mock.calls.slice(-1)[0][0]).toBeCloseTo(3)
    expect(panner.positionZ.setValueAtTime.mock.calls.slice(-1)[0][0]).toBeCloseTo(0, 5)
    expect(panner.positionZ.setValueAtTime.mock.calls.slice(-1)[0][1]).toBe(1.5)
  })

  it('setReverbMix 钳位 0–1：1.5→(湿1,干0)、-0.5→(湿0,干1)；未初始化静默', () => {
    const p = new SpatialAudioProcessor()
    expect(() => p.setReverbMix(0.5)).not.toThrow()

    const ctx = makeCtx()
    p.initialize(ctx as unknown as AudioContext, makeSource() as unknown as MediaElementAudioSourceNode, ctx.destination as unknown as AudioDestinationNode)
    const [wet, dry] = ctx.gains

    p.setReverbMix(1.5)
    expect(wet.gain.setValueAtTime).toHaveBeenLastCalledWith(1, 1.5)
    expect(dry.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 1.5)
    p.setReverbMix(-0.5)
    expect(wet.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 1.5)
    expect(dry.gain.setValueAtTime).toHaveBeenLastCalledWith(1, 1.5)
    p.setReverbMix(0.45)
    expect(wet.gain.setValueAtTime).toHaveBeenLastCalledWith(0.45, 1.5)
  })

  it('enable 置 active 并设混响 0.2；disable 复位混响 0；destroy 断连并清空节点（后续调用静默）', () => {
    const ctx = makeCtx()
    const p = new SpatialAudioProcessor()
    p.initialize(ctx as unknown as AudioContext, makeSource() as unknown as MediaElementAudioSourceNode, ctx.destination as unknown as AudioDestinationNode)
    const panner = ctx.panners[0]

    p.enable()
    expect(p.active).toBe(true)
    expect(ctx.gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0.2, 1.5)

    p.disable()
    expect(p.active).toBe(false)
    expect(ctx.gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 1.5)

    p.destroy()
    expect(panner.disconnect).toHaveBeenCalledTimes(1)
    expect(ctx.convolvers[0].disconnect).toHaveBeenCalledTimes(1)
    ctx.gains.forEach((g) => expect(g.disconnect).toHaveBeenCalledTimes(1))
    expect(p.active).toBe(false)

    // 销毁后所有方法走空指针守卫 → 静默
    expect(() => {
      p.setSpatialMode('studio')
      p.setRotation(1)
      p.setReverbMix(0.5)
      p.destroy()
    }).not.toThrow()
    expect(panner.disconnect).toHaveBeenCalledTimes(1)
  })
})

// ── 卡拉OK模式处理器 ──

describe('KaraokeProcessor（卡拉OK人声消除）', () => {
  it('initialize 构建 input→splitter→(gainL|gainR|invertGain→gainL|vocalGain)→merger→output 图谱，反相增益 -1', () => {
    const p = new KaraokeProcessor()
    const ctx = makeCtx()
    const input = new NodeStub()
    const output = new NodeStub()
    p.initialize(ctx as unknown as AudioContext, input as unknown as AudioNode, output as unknown as AudioNode)

    expect(ctx.splitters).toHaveLength(1)
    expect(ctx.mergers).toHaveLength(1)
    expect(ctx.gains).toHaveLength(4)
    const [gainL, gainR, invertGain, vocalGain] = ctx.gains
    expect(gainL.gain.value).toBe(1)
    expect(gainR.gain.value).toBe(1)
    expect(invertGain.gain.value).toBe(-1)
    expect(vocalGain.gain.value).toBe(0)

    const splitter = ctx.splitters[0]
    const merger = ctx.mergers[0]
    expect(input.connect).toHaveBeenCalledWith(splitter)
    // splitter 通道接线：L(0)/R(1)/反相取 R(1)/人声取 L+R
    expect(splitter.connections).toContainEqual([gainL, 0, undefined])
    expect(splitter.connections).toContainEqual([gainR, 1, undefined])
    expect(splitter.connections).toContainEqual([invertGain, 1, undefined])
    expect(splitter.connections).toContainEqual([vocalGain, 0, undefined])
    expect(splitter.connections).toContainEqual([vocalGain, 1, undefined])
    expect(invertGain.connections).toContainEqual([gainL, undefined, undefined])
    // 汇入 merger 的通道位：L→(0,0)、R→(0,1)、人声→(0,0)+(0,1)（记录在发起方节点上）
    expect(gainL.connections).toContainEqual([merger, 0, 0])
    expect(gainR.connections).toContainEqual([merger, 0, 1])
    expect(vocalGain.connections).toContainEqual([merger, 0, 0])
    expect(vocalGain.connections).toContainEqual([merger, 0, 1])
    expect(merger.connections).toContainEqual([output, undefined, undefined])
    expect(p.active).toBe(false)
    expect(p.vocalReductionLevel).toBe(0)
  })

  it('setVocalReduction 钳位并下发反相/人声增益；未初始化仅记级别不发参数', () => {
    const p = new KaraokeProcessor()
    p.setVocalReduction(2)
    expect(p.vocalReductionLevel).toBe(1) // 钳位
    p.setVocalReduction(-1)
    expect(p.vocalReductionLevel).toBe(0)

    const ctx = makeCtx()
    p.initialize(ctx as unknown as AudioContext, new NodeStub() as unknown as AudioNode, new NodeStub() as unknown as AudioNode)
    const [, , invertGain, vocalGain] = ctx.gains

    p.setVocalReduction(0.6)
    expect(invertGain.gain.setValueAtTime).toHaveBeenLastCalledWith(-0.6, 1.5)
    expect(vocalGain.gain.setValueAtTime).toHaveBeenLastCalledWith(0.4, 1.5)
    p.setVocalReduction(0)
    expect(invertGain.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 1.5)
    expect(p.vocalReductionLevel).toBe(0)
  })

  it('enable 设 0.85 消除强度；toggle 在开/关间翻转并返回最新状态；destroy 断连清空且后续静默', () => {
    const ctx = makeCtx()
    const p = new KaraokeProcessor()
    p.initialize(ctx as unknown as AudioContext, new NodeStub() as unknown as AudioNode, new NodeStub() as unknown as AudioNode)

    p.enable()
    expect(p.active).toBe(true)
    expect(p.vocalReductionLevel).toBeCloseTo(0.85)
    expect(ctx.gains[2].gain.setValueAtTime).toHaveBeenLastCalledWith(-0.85, 1.5)

    expect(p.toggle()).toBe(false)
    expect(p.active).toBe(false)
    expect(p.vocalReductionLevel).toBe(0)
    expect(p.toggle()).toBe(true)
    expect(p.active).toBe(true)

    p.destroy()
    ctx.splitters.forEach((n) => expect(n.disconnect).toHaveBeenCalledTimes(1))
    ctx.mergers.forEach((n) => expect(n.disconnect).toHaveBeenCalledTimes(1))
    ctx.gains.forEach((n) => expect(n.disconnect).toHaveBeenCalledTimes(1))
    expect(p.active).toBe(false)
    expect(() => p.setVocalReduction(0.5)).not.toThrow()
    // enable/disable/enable 共 3 次下发；destroy 置空节点后（audioContext 未清）不再下发
    expect(ctx.gains[2].gain.setValueAtTime.mock.calls).toHaveLength(3)
  })
})

// ── 交叉淡入淡出处理器 ──

describe('CrossfadeProcessor（无缝交叉淡入淡出）', () => {
  it('initialize 建两路增益（当前1/下一首0）；equalPower 曲线下发 101 步 setValueAtTime；到时后交换增益并复位下一路', async () => {
    vi.useFakeTimers()
    const ctx = makeCtx()
    const p = new CrossfadeProcessor()
    // 未初始化 → no-op
    await p.crossfade(10)
    expect(ctx.gains).toHaveLength(0)

    p.initialize(ctx as unknown as AudioContext)
    expect(p.getCurrentGainNode()).toBe(ctx.gains[0])
    expect(p.getNextGainNode()).toBe(ctx.gains[1])
    expect(ctx.gains[0].gain.value).toBe(1)
    expect(ctx.gains[1].gain.value).toBe(0)

    const currentBefore = p.getCurrentGainNode() as unknown as GainStub
    const nextBefore = p.getNextGainNode() as unknown as GainStub
    const fade = p.crossfade(1000, 'equalPower')
    expect(p.crossfading).toBe(true)

    await vi.advanceTimersByTimeAsync(1000)
    await fade

    // 101 个采样点：cos/sin 互补（首点 1/0，末点 ~0/1）
    expect(currentBefore!.gain.setValueAtTime).toHaveBeenCalledTimes(101)
    expect(nextBefore!.gain.setValueAtTime).toHaveBeenCalledTimes(101)
    const first = currentBefore!.gain.setValueAtTime.mock.calls[0]
    expect(first[0]).toBeCloseTo(1)
    expect(first[1]).toBe(1.5)
    const last = currentBefore!.gain.setValueAtTime.mock.calls[100]
    expect(last[0]).toBeCloseTo(0, 5)
    expect(last[1]).toBeCloseTo(1.5 + 1, 5)

    // 完成后交换：当前↔下一首，新下一路归零
    expect(p.getCurrentGainNode()).toBe(nextBefore)
    expect(p.getNextGainNode()).toBe(currentBefore)
    expect(p.getNextGainNode()!.gain.value).toBe(0)
    expect(p.crossfading).toBe(false)
  })

  it('linear 曲线走 linearRampToValueAtTime；sCurve 走 51 步 S 形插值', async () => {
    vi.useFakeTimers()
    const ctx = makeCtx()
    const p = new CrossfadeProcessor()
    p.initialize(ctx as unknown as AudioContext)
    const [g1, g2] = ctx.gains

    const linear = p.crossfade(2000, 'linear')
    await vi.advanceTimersByTimeAsync(2000)
    await linear
    expect(g1.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 1.5 + 2)
    expect(g2.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 1.5 + 2)
    expect(g1.gain.setValueAtTime).not.toHaveBeenCalled()

    // 交换后再次淡出：sCurve 51 步
    const sCurve = p.crossfade(500, 'sCurve')
    await vi.advanceTimersByTimeAsync(500)
    await sCurve
    const now = ctx.gains[0].gain.setValueAtTime.mock.calls
    expect(now).toHaveLength(51)
    // S 曲线中点 ≈ 0.5
    const mid = ctx.gains[0].gain.setValueAtTime.mock.calls[25]
    expect(mid[0]).toBeCloseTo(0.5, 5)
    expect(p.crossfading).toBe(false)
  })

  it('destroy 断连两路增益并复位交叉状态', () => {
    const ctx = makeCtx()
    const p = new CrossfadeProcessor()
    p.initialize(ctx as unknown as AudioContext)
    p.destroy()
    ctx.gains.forEach((g) => expect(g.disconnect).toHaveBeenCalledTimes(1))
    expect(p.getCurrentGainNode()).toBeNull()
    expect(p.getNextGainNode()).toBeNull()
    expect(p.crossfading).toBe(false)
  })
})

// ── 常量预设 ──

describe('混响/交叉淡入淡出预设常量', () => {
  it('REVERB_PRESETS 六档湿声比例递增；CROSSFADE_CURVES 三曲线含推荐等功率', () => {
    expect(REVERB_PRESETS.map((p) => p.id)).toEqual([
      'none', 'room', 'hall', 'cathedral', 'cave', 'outerSpace',
    ])
    expect(REVERB_PRESETS.map((p) => p.wet)).toEqual([0, 0.15, 0.35, 0.55, 0.7, 0.9])
    expect(REVERB_PRESETS.every((p) => p.name && p.icon)).toBe(true)

    expect(CROSSFADE_CURVES.map((c) => c.id)).toEqual(['linear', 'equalPower', 'sCurve'])
    expect(CROSSFADE_CURVES[1].description).toContain('推荐')
  })
})
