/**
 * @file MusicAIModule.ts
 * @description AI音乐智能模块 - 歌词翻译 + 封面生成 + 情感分析
 */

import { createLogger } from '../../utils/logger'
import type { TrackInfo } from './EnhancedAudioPlayerV3'

const logger = createLogger('MusicAIModule')

export interface LyricTranslation {
  original: string
  translated: string
  sourceLang: string
  targetLang: string
  confidence: number
}

export interface AlbumCoverConfig {
  trackName: string
  artist: string
  genre: string
  mood: string
  colorScheme: string[]
  style: 'abstract' | 'minimalist' | 'gradient' | 'geometric' | 'organic'
}

export interface EmotionAnalysis {
  mood: 'happy' | 'sad' | 'energetic' | 'calm' | 'romantic' | 'melancholic' | 'aggressive' | 'dreamy'
  energy: number
  valence: number
  danceability: number
  acousticness: number
  dominantTags: string[]
  colorPalette: string[]
  recommendedTracks: string[]
}

export class MusicAI {
  private sendToModel: ((msg: string, opts?: {
    systemPrompt?: string
    history?: { role: string; content: string }[]
  }) => Promise<string>) | null = null

  setModelSender(sender: typeof this.sendToModel): void {
    this.sendToModel = sender
  }

  private async callAI(prompt: string, systemPrompt: string): Promise<string> {
    if (!this.sendToModel) {
      throw new Error('AI模型未配置')
    }
    return this.sendToModel(prompt, { systemPrompt })
  }

  async translateLyrics(
    lyrics: string,
    targetLang: string = '中文'
  ): Promise<LyricTranslation[]> {
    const systemPrompt = `你是一位专业的音乐歌词翻译专家。请将歌词翻译为${targetLang}，保持韵律和情感。返回JSON数组格式：
[{"original":"原文","translated":"译文","sourceLang":"检测到的源语言","confidence":0.95}]`

    try {
      const result = await this.callAI(
        `请翻译以下歌词：\n\n${lyrics}`,
        systemPrompt
      )

      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)

      return parsed.map((item: { original?: string; translated?: string; sourceLang?: string; confidence?: number }) => ({
        original: item.original || '',
        translated: item.translated || '',
        sourceLang: item.sourceLang || 'unknown',
        targetLang,
        confidence: item.confidence || 0.8
      }))
    } catch (error) {
      logger.error('[MusicAI] 歌词翻译失败:', error)
      return lyrics.split('\n').filter(Boolean).map(line => ({
        original: line,
        translated: `[翻译失败] ${line}`,
        sourceLang: 'unknown',
        targetLang,
        confidence: 0
      }))
    }
  }

  async generateCoverPrompt(config: AlbumCoverConfig): Promise<string> {
    const systemPrompt = `你是专辑封面设计专家。根据歌曲信息生成详细的AI绘图提示词。
返回格式：一个英文的详细绘图提示词，适合用于Stable Diffusion或DALL-E。`

    const prompt = `请为以下歌曲生成专辑封面设计提示词：
- 歌曲名: ${config.trackName}
- 艺术家: ${config.artist}
- 风格: ${config.genre || '流行'}
- 情感: ${config.mood || '温暖'}
- 色调: ${config.colorScheme.join(', ') || '紫色+蓝色'}
- 设计风格: ${config.style}`

    try {
      return await this.callAI(prompt, systemPrompt)
    } catch {
      return `Album cover for "${config.trackName}" by ${config.artist}, ${config.style} style, ${config.mood} mood, vibrant colors, high quality digital art`
    }
  }

  generateCoverCanvas(config: AlbumCoverConfig): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    const colors = config.colorScheme.length > 0
      ? config.colorScheme
      : ['#8b5cf6', '#3b82f6', '#06b6d4', '#8b5cf6']

    const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 400)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(0.4, colors[1] || colors[0])
    gradient.addColorStop(0.7, colors[2] || colors[1] || colors[0])
    gradient.addColorStop(1, colors[3] || colors[0])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)

    switch (config.style) {
      case 'geometric':
        this.drawGeometricPattern(ctx, colors)
        break
      case 'organic':
        this.drawOrganicPattern(ctx, colors)
        break
      case 'minimalist':
        this.drawMinimalistPattern(ctx, colors)
        break
      default:
        this.drawAbstractPattern(ctx, colors)
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 300, 512, 212)

    ctx.font = 'bold 32px -apple-system, "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(config.trackName.slice(0, 12), 256, 360)

    ctx.font = '18px -apple-system, "PingFang SC", sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(config.artist.slice(0, 16), 256, 395)

    return canvas
  }

  private drawAbstractPattern(ctx: CanvasRenderingContext2D, colors: string[]): void {
    for (let i = 0; i < 20; i++) {
      ctx.beginPath()
      ctx.arc(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 80 + 20,
        0, Math.PI * 2
      )
      ctx.fillStyle = `${colors[Math.floor(Math.random() * colors.length)]}30`
      ctx.fill()
    }
  }

  private drawGeometricPattern(ctx: CanvasRenderingContext2D, colors: string[]): void {
    for (let i = 0; i < 12; i++) {
      ctx.save()
      ctx.translate(256, 200)
      ctx.rotate((Math.PI * 2 * i) / 12)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-40, -120)
      ctx.lineTo(40, -120)
      ctx.closePath()
      ctx.fillStyle = `${colors[i % colors.length]}40`
      ctx.fill()
      ctx.restore()
    }
  }

  private drawOrganicPattern(ctx: CanvasRenderingContext2D, colors: string[]): void {
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      const startX = Math.random() * 512
      const startY = Math.random() * 512
      ctx.moveTo(startX, startY)
      ctx.bezierCurveTo(
        Math.random() * 512, Math.random() * 512,
        Math.random() * 512, Math.random() * 512,
        Math.random() * 512, Math.random() * 512
      )
      ctx.lineWidth = Math.random() * 4 + 1
      ctx.strokeStyle = `${colors[i % colors.length]}60`
      ctx.stroke()
    }
  }

  private drawMinimalistPattern(ctx: CanvasRenderingContext2D, _colors: string[]): void {
    ctx.beginPath()
    ctx.arc(256, 200, 100, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(256, 200, 130, 0, Math.PI * 2)
    ctx.stroke()
  }

  async analyzeEmotion(track: TrackInfo): Promise<EmotionAnalysis> {
    const systemPrompt = `你是音乐情感分析专家。根据歌曲名称和标签分析歌曲的情感特征。
返回严格的JSON格式，不要包含任何其他文本：
{
  "mood": "happy|sad|energetic|calm|romantic|melancholic|aggressive|dreamy",
  "energy": 0.0-1.0,
  "valence": 0.0-1.0,
  "danceability": 0.0-1.0,
  "acousticness": 0.0-1.0,
  "dominantTags": ["tag1", "tag2", "tag3"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "recommendedTracks": ["推荐歌曲1", "推荐歌曲2", "推荐歌曲3"]
}`

    const tags = track.tags?.join(', ') || ''
    const artist = track.metadata?.artist || ''
    const genre = track.metadata?.genre || ''

    try {
      const result = await this.callAI(
        `分析这首歌曲的情感：\n歌曲名: ${track.name}\n艺术家: ${artist}\n流派: ${genre}\n标签: ${tags}`,
        systemPrompt
      )

      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      logger.error('[MusicAI] 情感分析失败:', error)
      return {
        mood: 'calm',
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
        dominantTags: track.tags || ['音乐'],
        colorPalette: ['#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899'],
        recommendedTracks: []
      }
    }
  }
}
