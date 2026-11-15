/**
 * @file AdvancedAudioModule.ts
 * @description 高级音频处理模块 - 3D环绕声 + 卡拉OK模式 + 无缝交叉淡入淡出
 */

// ── 3D环绕声处理器 ──

export class SpatialAudioProcessor {
  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private pannerNode: PannerNode | null = null
  private listener: AudioListener | null = null
  private convolverNode: ConvolverNode | null = null
  private wetGainNode: GainNode | null = null
  private dryGainNode: GainNode | null = null
  private isActive = false

  get active(): boolean {
    return this.isActive
  }

  initialize(
    audioContext: AudioContext,
    sourceNode: MediaElementAudioSourceNode,
    destination: AudioDestinationNode
  ): void {
    this.audioContext = audioContext
    this.sourceNode = sourceNode
    this.listener = audioContext.listener

    this.pannerNode = audioContext.createPanner()
    this.pannerNode.panningModel = 'HRTF'
    this.pannerNode.distanceModel = 'inverse'
    this.pannerNode.refDistance = 1
    this.pannerNode.maxDistance = 10000
    this.pannerNode.rolloffFactor = 1
    this.pannerNode.coneInnerAngle = 360
    this.pannerNode.coneOuterAngle = 360

    this.convolverNode = audioContext.createConvolver()
    this.convolverNode.buffer = this.generateReverbIR(audioContext, 2.5, 2.0)

    this.wetGainNode = audioContext.createGain()
    this.wetGainNode.gain.value = 0

    this.dryGainNode = audioContext.createGain()
    this.dryGainNode.gain.value = 1

    this.updateListenerPosition()

    this.sourceNode.connect(this.pannerNode)
    this.pannerNode.connect(this.dryGainNode)
    this.pannerNode.connect(this.convolverNode)
    this.convolverNode.connect(this.wetGainNode)
    this.dryGainNode.connect(destination)
    this.wetGainNode.connect(destination)
  }

  private generateReverbIR(
    ctx: AudioContext,
    duration: number,
    decay: number
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay)
      }
    }

    return buffer
  }

  private updateListenerPosition(): void {
    if (!this.listener) return
    if (this.listener.positionX) {
      this.listener.positionX.value = 0
      this.listener.positionY.value = 0
      this.listener.positionZ.value = 0
    }
    if (this.listener.forwardX) {
      this.listener.forwardX.value = 0
      this.listener.forwardY.value = 0
      this.listener.forwardZ.value = -1
    }
    if (this.listener.upX) {
      this.listener.upX.value = 0
      this.listener.upY.value = 1
      this.listener.upZ.value = 0
    }
  }

  setSpatialMode(mode: ' concert' | 'studio' | 'arena' | 'headphones'): void {
    if (!this.pannerNode || !this.audioContext) return

    const configs: Record<string, { x: number; y: number; z: number; wet: number }> = {
      concert: { x: 0, y: 2, z: -5, wet: 0.3 },
      studio: { x: 0, y: 1, z: -2, wet: 0.1 },
      arena: { x: 0, y: 5, z: -10, wet: 0.5 },
      headphones: { x: 0, y: 0, z: -0.5, wet: 0.15 },
    }

    const config = configs[mode] || configs.studio

    this.pannerNode.positionX.setValueAtTime(config.x, this.audioContext.currentTime)
    this.pannerNode.positionY.setValueAtTime(config.y, this.audioContext.currentTime)
    this.pannerNode.positionZ.setValueAtTime(config.z, this.audioContext.currentTime)

    if (this.wetGainNode) {
      this.wetGainNode.gain.setValueAtTime(config.wet, this.audioContext.currentTime)
    }
    if (this.dryGainNode) {
      this.dryGainNode.gain.setValueAtTime(1 - config.wet, this.audioContext.currentTime)
    }
  }

  setRotation(angle: number): void {
    if (!this.pannerNode || !this.audioContext) return

    const radius = 3
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius

    this.pannerNode.positionX.setValueAtTime(x, this.audioContext.currentTime)
    this.pannerNode.positionZ.setValueAtTime(z, this.audioContext.currentTime)
  }

  setReverbMix(wet: number): void {
    if (!this.wetGainNode || !this.dryGainNode || !this.audioContext) return

    const clampedWet = Math.max(0, Math.min(1, wet))
    this.wetGainNode.gain.setValueAtTime(clampedWet, this.audioContext.currentTime)
    this.dryGainNode.gain.setValueAtTime(1 - clampedWet, this.audioContext.currentTime)
  }

  enable(): void {
    this.isActive = true
    this.setReverbMix(0.2)
  }

  disable(): void {
    this.isActive = false
    this.setReverbMix(0)
  }

  destroy(): void {
    this.pannerNode?.disconnect()
    this.convolverNode?.disconnect()
    this.wetGainNode?.disconnect()
    this.dryGainNode?.disconnect()
    this.pannerNode = null
    this.convolverNode = null
    this.wetGainNode = null
    this.dryGainNode = null
    this.isActive = false
  }
}

// ── 卡拉OK模式处理器（人声消除） ──

export class KaraokeProcessor {
  private audioContext: AudioContext | null = null
  private splitter: ChannelSplitterNode | null = null
  private merger: ChannelMergerNode | null = null
  private gainL: GainNode | null = null
  private gainR: GainNode | null = null
  private invertGain: GainNode | null = null
  private vocalGain: GainNode | null = null
  private inputNode: AudioNode | null = null
  private outputNode: AudioNode | null = null
  private isActive = false
  private vocalLevel = 0

  get active(): boolean {
    return this.isActive
  }

  get vocalReductionLevel(): number {
    return this.vocalLevel
  }

  initialize(
    audioContext: AudioContext,
    inputNode: AudioNode,
    outputNode: AudioNode
  ): void {
    this.audioContext = audioContext
    this.inputNode = inputNode
    this.outputNode = outputNode

    this.splitter = audioContext.createChannelSplitter(2)
    this.merger = audioContext.createChannelMerger(2)
    this.gainL = audioContext.createGain()
    this.gainR = audioContext.createGain()
    this.invertGain = audioContext.createGain()
    this.vocalGain = audioContext.createGain()

    this.gainL.gain.value = 1
    this.gainR.gain.value = 1
    this.invertGain.gain.value = -1
    this.vocalGain.gain.value = 0

    this.inputNode.connect(this.splitter)

    this.splitter.connect(this.gainL, 0)
    this.splitter.connect(this.gainR, 1)

    this.splitter.connect(this.invertGain, 1)
    this.invertGain.connect(this.gainL)

    this.gainL.connect(this.merger, 0, 0)
    this.gainR.connect(this.merger, 0, 1)

    this.splitter.connect(this.vocalGain, 0)
    this.splitter.connect(this.vocalGain, 1)
    this.vocalGain.connect(this.merger, 0, 0)
    this.vocalGain.connect(this.merger, 0, 1)

    this.merger.connect(this.outputNode)
  }

  setVocalReduction(level: number): void {
    this.vocalLevel = Math.max(0, Math.min(1, level))

    if (!this.audioContext) return

    if (this.invertGain) {
      this.invertGain.gain.setValueAtTime(
        level > 0 ? -level : 0,
        this.audioContext.currentTime
      )
    }

    if (this.vocalGain) {
      this.vocalGain.gain.setValueAtTime(
        1 - level,
        this.audioContext.currentTime
      )
    }
  }

  enable(): void {
    this.isActive = true
    this.setVocalReduction(0.85)
  }

  disable(): void {
    this.isActive = false
    this.setVocalReduction(0)
  }

  toggle(): boolean {
    if (this.isActive) {
      this.disable()
    } else {
      this.enable()
    }
    return this.isActive
  }

  destroy(): void {
    this.splitter?.disconnect()
    this.merger?.disconnect()
    this.gainL?.disconnect()
    this.gainR?.disconnect()
    this.invertGain?.disconnect()
    this.vocalGain?.disconnect()
    this.splitter = null
    this.merger = null
    this.gainL = null
    this.gainR = null
    this.invertGain = null
    this.vocalGain = null
    this.isActive = false
  }
}

// ── 无缝交叉淡入淡出处理器 ──

export class CrossfadeProcessor {
  private audioContext: AudioContext | null = null
  private currentGain: GainNode | null = null
  private nextGain: GainNode | null = null
  private isCrossfading = false

  get crossfading(): boolean {
    return this.isCrossfading
  }

  initialize(audioContext: AudioContext): void {
    this.audioContext = audioContext
    this.currentGain = audioContext.createGain()
    this.currentGain.gain.value = 1
    this.nextGain = audioContext.createGain()
    this.nextGain.gain.value = 0
  }

  getCurrentGainNode(): GainNode | null {
    return this.currentGain
  }

  getNextGainNode(): GainNode | null {
    return this.nextGain
  }

  async crossfade(
    durationMs: number = 3000,
    curve: 'linear' | 'equalPower' | 'sCurve' = 'equalPower'
  ): Promise<void> {
    if (!this.audioContext || !this.currentGain || !this.nextGain) return

    this.isCrossfading = true
    const ctx = this.audioContext
    const now = ctx.currentTime
    const durationSec = durationMs / 1000

    switch (curve) {
      case 'linear':
        this.currentGain.gain.linearRampToValueAtTime(0, now + durationSec)
        this.nextGain.gain.linearRampToValueAtTime(1, now + durationSec)
        break

      case 'equalPower':
        for (let t = 0; t <= 100; t++) {
          const x = t / 100
          const time = now + (x * durationSec)
          const cosOut = Math.cos(x * Math.PI * 0.5)
          const sinIn = Math.sin(x * Math.PI * 0.5)
          this.currentGain.gain.setValueAtTime(cosOut, time)
          this.nextGain.gain.setValueAtTime(sinIn, time)
        }
        break

      case 'sCurve': {
        const steps = 50
        for (let t = 0; t <= steps; t++) {
          const x = t / steps
          const time = now + (x * durationSec)
          const sOut = 1 - (3 * x * x - 2 * x * x * x)
          const sIn = 3 * x * x - 2 * x * x * x
          this.currentGain.gain.setValueAtTime(sOut, time)
          this.nextGain.gain.setValueAtTime(sIn, time)
        }
        break
      }
    }

    await new Promise<void>(resolve => {
      setTimeout(() => {
        this.isCrossfading = false
        const temp = this.currentGain
        this.currentGain = this.nextGain
        this.nextGain = temp
        this.nextGain!.gain.value = 0
        resolve()
      }, durationMs)
    })
  }

  destroy(): void {
    this.currentGain?.disconnect()
    this.nextGain?.disconnect()
    this.currentGain = null
    this.nextGain = null
    this.isCrossfading = false
  }
}

// ── 预设混响配置 ──

export const REVERB_PRESETS = [
  { id: 'none', name: '无混响', wet: 0, icon: '🔇' },
  { id: 'room', name: '小房间', wet: 0.15, icon: '🏠' },
  { id: 'hall', name: '音乐厅', wet: 0.35, icon: '🏛️' },
  { id: 'cathedral', name: '大教堂', wet: 0.55, icon: '⛪' },
  { id: 'cave', name: '洞穴', wet: 0.7, icon: '🕳️' },
  { id: 'outerSpace', name: '外太空', wet: 0.9, icon: '🌌' },
]

export const CROSSFADE_CURVES = [
  { id: 'linear', name: '线性', description: '均匀过渡' },
  { id: 'equalPower', name: '等功率', description: '保持恒定音量（推荐）' },
  { id: 'sCurve', name: 'S曲线', description: '平滑自然过渡' },
] as const
