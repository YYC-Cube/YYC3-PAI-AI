/**
 * @file audio-engine.ts
 * @description YYC3 AI 音频引擎 - 完整音频管理系统
 * @features 背景音乐、音效池、音频上传/编辑、可视化支持
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import { Howl, Howler } from 'howler'
import { v4 as uuidv4 } from 'uuid'
import { Logger } from './logger'

const audioLogger = new Logger('Audio')

// ============================================================================
// 类型定义
// ============================================================================

export interface AudioTrack {
  id: string
  name: string
  url: string
  duration: number
  size: number
  type: 'music' | 'effect' | 'ambient' | 'custom'
  tags: string[]
  createdAt: number
  updatedAt: number
  metadata?: {
    artist?: string
    album?: string
    genre?: string
    bpm?: number
  }
}

export interface EditedAudio {
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

export interface Playlist {
  id: string
  name: string
  tracks: AudioTrack[]
  currentIndex: number
  shuffle: boolean
  repeat: 'off' | 'all' | 'one'
  createdAt: number
}

export interface SoundEffect {
  id: string
  name: string
  url: string
  category: 'ui' | 'system' | 'ai' | 'notification'
  volume: number
  defaultVolume: number
}

export interface AudioEngineConfig {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  ambientVolume: number
  crossfadeDuration: number
  normalizeAudio: boolean
}

export interface AudioEngineState {
  isPlaying: boolean
  currentTrack: AudioTrack | null
  currentTime: number
  duration: number
  playlist: Playlist | null
  queues: AudioTrack[]
}

/** music-manifest.json 单曲条目 */
export interface ManifestTrackEntry {
  fileName: string
  title: string
  artist: string
  artistName: string
  album: string
  url: string
  tags: string[]
  /** 远程曲库模式下由 API 直接提供，免去逐首跨域探测时长 */
  durationSec?: number
}

/** yyc3-music-api /api/music/tracks 单曲条目（NAS 远程曲库） */
interface NasApiTrack {
  id: string
  title: string
  artist: string | null
  album: string | null
  duration: number
  fileSize: string
  format: string
}

/** AI-Family 内置主题曲（public/ 根目录随前端分发，本地/NAS 双模式恒可用） */
const BUILTIN_THEME_TRACKS: ManifestTrackEntry[] = [
  {
    fileName: 'AI-Family.mp3',
    title: 'AI-Family · YYC³ 家族主题曲',
    artist: 'YYC³',
    artistName: 'YYC³',
    album: 'AI-Family 主题曲',
    url: '/AI-Family.mp3',
    tags: ['主题曲', 'AI-Family'],
  },
  {
    fileName: 'Family-工坊.mp3',
    title: 'Family 工坊',
    artist: 'YYC³',
    artistName: 'YYC³',
    album: 'AI-Family 主题曲',
    url: '/Family-工坊.mp3',
    tags: ['主题曲', 'AI-Family'],
  },
]

type AudioEventListener = (state: AudioEngineState) => void

// ============================================================================
// 音频引擎核心类
// ============================================================================

export class AudioEngine {
  private config: AudioEngineConfig
  private state: AudioEngineState
  private howlInstance: Howl | null = null
  private fallbackAudio: HTMLAudioElement | null = null
  private timeUpdateRAF: number | null = null
  private soundPool: Map<string, Howl> = new Map()
  private tracks: Map<string, AudioTrack> = new Map()
  private playlists: Map<string, Playlist> = new Map()
  private editedTracks: Map<string, EditedAudio> = new Map()
  private listeners: Set<AudioEventListener> = new Set()
  private analyserNode: AnalyserNode | null = null
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private readonly STORAGE_KEY = 'yyc3-audio-engine'
  private readonly TRACKS_VERSION_KEY = 'yyc3-audio-tracks-version'
  private isInitializing = false
  private initializationPromise: Promise<AudioTrack[]> | null = null

  constructor(config?: Partial<AudioEngineConfig>) {
    this.config = {
      masterVolume: 80,
      musicVolume: 70,
      sfxVolume: 80,
      ambientVolume: 50,
      crossfadeDuration: 1000,
      normalizeAudio: true,
      ...config,
    }

    this.state = {
      isPlaying: false,
      currentTrack: null,
      currentTime: 0,
      duration: 0,
      playlist: null,
      queues: [],
    }

    this.initializeAudioContext()
    this.loadFromStorage()
  }

  // ============================================================================
  // 音乐库初始化（从public目录自动加载）
  // ============================================================================

  async initializeMusicLibrary(forceReload = false): Promise<AudioTrack[]> {
    if (this.isInitializing && this.initializationPromise) {
      audioLogger.info('[YYC3 Audio] ⏳ 音乐库正在初始化中，等待完成...')
      return this.initializationPromise
    }

    const storedVersion = localStorage.getItem('yyc3-audio-library-version')

    if (!forceReload && storedVersion && this.tracks.size > 0) {
      // 验证内存中的 tracks 版本与 manifest 版本一致
      // （防止 constructor loadFromStorage 恢复了旧版 tracks）
      const tracksVersion = localStorage.getItem(this.TRACKS_VERSION_KEY)
      if (tracksVersion === storedVersion) {
        audioLogger.info(`[YYC3 Audio] ✅ 音乐库已加载 (${this.tracks.size} 首)，跳过初始化`)
        return Array.from(this.tracks.values())
      }
      // 版本不匹配 → 清除旧的缓存 tracks
      audioLogger.info(`[YYC3 Audio] 🔄 tracks 版本不匹配 (${tracksVersion} ≠ ${storedVersion})，重新加载...`)
      this.tracks.clear()
      this.playlists.clear()
      localStorage.removeItem(this.STORAGE_KEY)
    }

    this.isInitializing = true
    this.initializationPromise = this._doInitializeMusicLibrary(storedVersion, forceReload)

    try {
      const result = await this.initializationPromise
      return result
    } finally {
      this.isInitializing = false
      this.initializationPromise = null
    }
  }

  private async _doInitializeMusicLibrary(
    storedVersion: string | null,
    forceReload: boolean
  ): Promise<AudioTrack[]> {

    // ===== 从 music-manifest.json 自动发现歌曲 =====
    const loadedTracks: AudioTrack[] = []

    try {
      // ===== 曲库来源：VITE_MUSIC_API_BASE 指向 NAS yyc3-music-api 时走远程流式，
      // 否则维持本地静态 manifest（默认行为不变）=====
      const apiBase = (import.meta.env.VITE_MUSIC_API_BASE as string | undefined)
        ?.trim()
        .replace(/\/+$/, '')
      let manifest: { tracks: ManifestTrackEntry[]; updatedAt: number }
      let manifestVersion: string

      if (apiBase) {
        const res = await fetch(`${apiBase}/api/music/tracks`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const payload: { data?: NasApiTrack[] } = await res.json()
        const rows = Array.isArray(payload.data) ? payload.data : []
        const totalBytes = rows.reduce((sum, t) => sum + (Number(t.fileSize) || 0), 0)
        manifestVersion = `nas-${rows.length}-${totalBytes}`
        manifest = {
          updatedAt: 0,
          tracks: rows.map((t) => ({
            fileName: `${t.title}.${t.format || 'mp3'}`,
            title: t.title,
            artist: t.artist || 'YYC³',
            artistName: t.artist || 'YYC³',
            album: t.album || 'YYC³ 音乐库',
            url: `${apiBase}/api/music/stream/${t.id}`,
            tags: [],
            durationSec: Number(t.duration) || undefined,
          })),
        }
      } else {
        const res = await fetch('/music-manifest.json')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        manifest = await res.json()
        manifestVersion = String(manifest.updatedAt)
      }

      // AI-Family 内置主题曲：双模式下都追加，家族资产恒在库
      manifest.tracks = [...manifest.tracks, ...BUILTIN_THEME_TRACKS]

      // 用 manifest.updatedAt 做版本校验，当 music/ 目录变化时 manifest 自动更新
      if (forceReload || storedVersion !== manifestVersion) {
        audioLogger.info(`[YYC3 Audio] 🔄 音乐库版本更新 (${storedVersion} → ${manifestVersion})，重新加载...`)
        this.tracks.clear()
        this.playlists.clear()
        localStorage.removeItem(this.STORAGE_KEY)
        localStorage.setItem('yyc3-audio-library-version', manifestVersion)
      } else {
        audioLogger.info(`[YYC3 Audio] ✅ manifest 版本一致 (${manifestVersion})，使用已有缓存`)
        // 如果 tracks 已被清空但版本一致，尝试从 storage 恢复
        if (this.tracks.size === 0) {
          this.loadFromStorage()
        }
        if (this.tracks.size > 0) {
          return Array.from(this.tracks.values())
        }
      }

      for (const entry of manifest.tracks) {
        try {
          const duration = entry.durationSec ?? (await this.getAudioDurationFromUrl(entry.url))
          const trackId = `track-${this.generateTrackId(entry.fileName, entry.url)}`
          const track: AudioTrack = {
            id: trackId,
            name: entry.title || entry.fileName.replace('.mp3', ''),
            url: entry.url,
            duration,
            size: 0,
            type: 'music',
            tags: this.inferTags(entry),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            metadata: {
              artist: entry.artistName || entry.artist || 'YYC³',
              album: entry.album || 'YYC³ 音乐库',
              genre: this.inferGenre(entry),
            },
          }
          this.tracks.set(track.id, track)
          loadedTracks.push(track)
        } catch (err) {
          audioLogger.warn(`[YYC3 Audio] ⚠️ 跳过 ${entry.fileName}:`, err)
        }
      }
      audioLogger.info(`[YYC3 Audio] ✅ manifest 加载: ${loadedTracks.length}/${manifest.tracks.length} 首`)

      // 在 try 成功时同步 tracks 版本
      if (loadedTracks.length > 0) {
        localStorage.setItem(this.TRACKS_VERSION_KEY, manifestVersion)
      }
    } catch (error) {
      audioLogger.warn('[YYC3 Audio] ⚠️ 无法加载 music-manifest.json，使用空列表:', error)
    }

    if (loadedTracks.length > 0) {
      const playlistId = `playlist-${Date.now()}`
      const playlist: Playlist = {
        id: playlistId,
        name: 'YYC³ 音乐库',
        tracks: loadedTracks,
        currentIndex: 0,
        shuffle: false,
        repeat: 'all',
        createdAt: Date.now(),
      }
      this.playlists.set(playlistId, playlist)
      this.state.playlist = playlist
      this.saveToStorage()
      this.emitStateChange()
    }

    return loadedTracks
  }

  private inferTags(entry: ManifestTrackEntry): string[] {
    const tags = ['YYC³', '音乐库']
    const artist = (entry.artistName || entry.artist || '').toLowerCase()
    const album = (entry.album || '').toLowerCase()

    if (artist.includes('沫言') && (artist.includes('沫语') || artist.includes('&'))) {
      tags.push('合唱')
    } else if (artist.includes('沫言')) {
      tags.push('男声', '深情')
    } else if (artist.includes('沫语')) {
      tags.push('女声', '治愈')
    }

    if (album.includes('a') && !album.includes('ab')) tags.push('A辑', '独唱')
    if (album.includes('b') && !album.includes('ab')) tags.push('B辑', '独唱')
    if (album.includes('ab')) tags.push('合唱')

    return tags
  }

  private inferGenre(entry: ManifestTrackEntry): string {
    const tags = this.inferTags(entry)
    if (tags.includes('合唱')) return '流行/合唱'
    if (tags.includes('男声')) return '流行/摇滚'
    if (tags.includes('女声')) return '流行/抒情'
    return '流行'
  }

  private generateTrackId(fileName: string, path: string): string {
    const input = `${path}/${fileName}`
    let hash = 0

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    const absHash = Math.abs(hash).toString(16)
    return absHash.slice(0, 16).padStart(16, '0')
  }

  private getAudioDurationFromUrl(url: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.preload = 'metadata'

      const timeout = setTimeout(() => {
        audioLogger.warn(`[YYC3 Audio] ⏱️ 获取时长超时: ${url.split('/').pop()}`)
        audio.src = ''
        resolve(180)
      }, 3000)

      const cleanup = () => {
        clearTimeout(timeout)
        audio.removeEventListener('loadedmetadata', onLoaded)
        audio.removeEventListener('error', onError)
        audio.removeEventListener('abort', onAbort)
      }

      const onLoaded = () => {
        cleanup()
        resolve(audio.duration || 180)
      }

      const onError = (e: Event) => {
        cleanup()
        audioLogger.warn(`[YYC3 Audio] ❌ 加载失败: ${url.split('/').pop()}`, e)
        resolve(180)
      }

      const onAbort = () => {
        cleanup()
        audioLogger.info(`[YYC3 Audio] ⚠️ 加载中止: ${url.split('/').pop()}`)
        resolve(180)
      }

      audio.addEventListener('loadedmetadata', onLoaded)
      audio.addEventListener('error', onError)
      audio.addEventListener('abort', onAbort)

      audio.src = url
    })
  }

  // ============================================================================
  // 初始化
  // ============================================================================

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext)()
      this.analyserNode = this.audioContext.createAnalyser()
      this.gainNode = this.audioContext.createGain()

      this.analyserNode.fftSize = 256
      this.gainNode.connect(this.analyserNode)
      this.analyserNode.connect(this.audioContext.destination)

      this.gainNode.gain.value = this.config.masterVolume / 100
    } catch {
      audioLogger.warn('[YYC3 Audio] Web Audio API not available')
    }
  }

  // ============================================================================
  // 音频上传与管理
  // ============================================================================

  async uploadAudio(file: File, options?: { name?: string; type?: AudioTrack['type']; tags?: string[] }): Promise<AudioTrack> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const blob = new Blob([arrayBuffer], { type: file.type })
          const url = URL.createObjectURL(blob)

          const track: AudioTrack = {
            id: uuidv4(),
            name: options?.name || file.name.replace(/\.[^/.]+$/, ''),
            url,
            duration: 0,
            size: file.size,
            type: options?.type || 'music',
            tags: options?.tags || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }

          this.tracks.set(track.id, track)
          this.getAudioDuration(url).then((duration) => {
            track.duration = duration
            this.saveToStorage()
            resolve(track)
          })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  private getAudioDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.src = url

      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration)
        URL.revokeObjectURL(audio.src)
      })

      audio.addEventListener('error', () => {
        resolve(0)
      })
    })
  }

  deleteTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId)
    if (!track) return false

    URL.revokeObjectURL(track.url)
    this.tracks.delete(trackId)
    this.saveToStorage()
    return true
  }

  getTracks(): AudioTrack[] {
    return Array.from(this.tracks.values())
  }

  getTrackById(id: string): AudioTrack | undefined {
    return this.tracks.get(id)
  }

  // ============================================================================
  // 播放控制
  // ============================================================================

  async play(trackId: string): Promise<void> {
    const track = this.tracks.get(trackId)
    if (!track) throw new Error(`Track ${trackId} not found`)

    audioLogger.info(`\n[YYC3 Audio] 🎬 ===== 开始播放流程 =====`)
    audioLogger.info(`[YYC3 Audio] 📝 歌曲信息:`, {
      id: track.id,
      name: track.name,
      url: track.url,
      duration: track.duration,
    })

    // 1. 停止当前播放
    if (this.howlInstance) {
      audioLogger.info('[YYC3 Audio] ⏹️ 停止当前播放')
      this.stop()
    }
    if (this.fallbackAudio) {
      this.fallbackAudio.pause()
      this.fallbackAudio = null
    }

    // 2. 强制激活Web Audio Context（浏览器安全策略）
    await this.activateAudioContext()

    // 3. 立即设置状态（不等待onplay事件！）
    this.state.isPlaying = true
    this.state.currentTrack = track
    this.emitStateChange()

    audioLogger.info('[YYC3 Audio] ✅ 状态已设置为: isPlaying=true')

    // 4. 创建新的Howl实例
    audioLogger.info('[YYC3 Audio] 🔧 创建Howl实例...')

    this.howlInstance = new Howl({
      src: [track.url],
      html5: true,
      volume: (this.config.musicVolume * this.config.masterVolume) / 10000,
      format: ['mp3'],

      onload: () => {
        audioLogger.info('[YYC3 Audio] ✅ Howl: 音频文件加载完成')
        audioLogger.info('[YYC3 Audio] 📊 Howl状态:', {
          duration: this.howlInstance?.duration(),
          state: this.howlInstance?.state(),
        })
      },

      onplay: () => {
        audioLogger.info(`[YYC3 Audio] ▶️▶️▶️ Howl onplay触发: ${track.name}`)
      },

      onend: () => {
        audioLogger.info(`[YYC3 Audio] ⏹️ 播放结束: ${track.name}`)
        this.state.isPlaying = false
        this.handleTrackEnd()
      },

      onstop: () => {
        audioLogger.info('[YYC3 Audio] ⏹️ 播放被停止')
        this.state.isPlaying = false
        this.emitStateChange()
      },

      onpause: () => {
        audioLogger.info('[YYC3 Audio] ⏸️ 播放暂停')
        // 不在这里设置isPlaying=false，让外部控制
      },

      onloaderror: (_id: number, error: unknown) => {
        audioLogger.error(`[YYC3 Audio] ❌ Howl加载失败，尝试备用方案...`)
        audioLogger.error(`[YYC3 Audio] 错误码:`, error)
        this.fallbackPlay(track.url, track.name)
      },

      onplayerror: (_id: number, error: unknown) => {
        audioLogger.error(`[YYC3 Audio] ❌ Howl播放错误，尝试备用方案...`)
        audioLogger.error(`[YYC3 Audio] 错误码:`, error)
        this.fallbackPlay(track.url, track.name)
      },
    })

    audioLogger.info('[YYC3 Audio] ▶️ 调用Howl.play()...')

    // 5. 尝试Howler播放
    const playId = this.howlInstance.play()

    audioLogger.info(`[YYC3 Audio] 🎯 play()返回ID:`, playId)

    // 6. 立即启动时间更新循环（不依赖isPlaying状态！）
    this.startRobustTimeUpdate()

    // 7. 2秒后检查是否真正在播放
    setTimeout(() => {
      this.checkPlaybackStatus(track.name)
    }, 2000)
  }

  private fallbackPlay(url: string, name: string): void {
    audioLogger.info(`[YYC3 Audio] 🔄 使用原生Audio API备用方案播放: ${name}`)

    try {
      // 停止Howl实例
      if (this.howlInstance) {
        try { this.howlInstance.stop() } catch { /* ignore */ }
        try { this.howlInstance.unload() } catch { /* ignore */ }
        this.howlInstance = null
      }

      // 创建原生Audio元素
      this.fallbackAudio = new Audio(url)
      this.fallbackAudio.volume = (this.config.musicVolume * this.config.masterVolume) / 10000

      this.fallbackAudio.addEventListener('play', () => {
        audioLogger.info(`[YYC3 Audio] ▶️▶️▶️ 备用方案播放成功: ${name}`)
      })

      this.fallbackAudio.addEventListener('timeupdate', () => {
        if (this.fallbackAudio) {
          this.state.currentTime = this.fallbackAudio.currentTime
          this.state.duration = this.fallbackAudio.duration || 0
        }
      })

      this.fallbackAudio.addEventListener('ended', () => {
        audioLogger.info(`[YYC3 Audio] ⏹️ 备用方案播放结束: ${name}`)
        this.state.isPlaying = false
        this.handleTrackEnd()
      })

      this.fallbackAudio.addEventListener('error', (e) => {
        audioLogger.error(`[YYC3 Audio] ❌❌❌ 备用方案也失败: ${name}`, e)
        this.state.isPlaying = false
        this.emitStateChange()
      })

      // 播放
      const playPromise = this.fallbackAudio.play()

      if (playPromise && playPromise.catch) {
        playPromise.catch((err) => {
          audioLogger.error(`[YYC3 Audio] ❌ 备用方案play()被拒绝:`, err.message)
          this.state.isPlaying = false
          this.emitStateChange()
        })
      }

      audioLogger.info(`[YYC3 Audio] ✅ 备用方案已启动: ${url}`)

    } catch (error) {
      audioLogger.error(`[YYC3 Audio] ❌ 备用方案创建失败:`, error)
      this.state.isPlaying = false
      this.emitStateChange()
    }
  }

  private startRobustTimeUpdate(): void {
    // 取消之前的时间更新
    if (this.timeUpdateRAF) {
      cancelAnimationFrame(this.timeUpdateRAF)
    }

    const update = () => {
      // 优先使用Howl，其次使用fallbackAudio
      if (this.howlInstance && this.state.isPlaying) {
        try {
          const seek = this.howlInstance.seek()
          if (typeof seek === 'number' && !isNaN(seek)) {
            this.state.currentTime = seek
            this.state.duration = this.howlInstance.duration() || 0
          }
        } catch { /* ignore */ }
      } else if (this.fallbackAudio && this.state.isPlaying) {
        // fallbackAudio自带timeupdate事件处理，无需额外操作
      }

      // 只要isPlaying为true就继续更新
      if (this.state.isPlaying) {
        this.timeUpdateRAF = requestAnimationFrame(update)
      }
    }

    update()
  }

  private checkPlaybackStatus(trackName: string): void {
    let actualPlaying = false

    // 检查Howl状态
    if (this.howlInstance) {
      const howlState = this.howlInstance.state() as string
      const howlSeek = this.howlInstance.seek()

      audioLogger.info(`[YYC3 Audio] 🔍 2秒后状态检查:`)
      audioLogger.info(`   - Howl state: ${howlState}`)
      audioLogger.info(`   - Howl seek: ${howlSeek}`)
      audioLogger.info(`   - isPlaying: ${this.state.isPlaying}`)
      audioLogger.info(`   - currentTime: ${this.state.currentTime}`)

      if (howlState === 'playing' && typeof howlSeek === 'number' && howlSeek > 0) {
        actualPlaying = true
      }
    }

    // 检查fallbackAudio状态
    if (this.fallbackAudio && !this.fallbackAudio.paused) {
      audioLogger.info(`   - fallbackAudio currentTime: ${this.fallbackAudio.currentTime}`)
      if (this.fallbackAudio.currentTime > 0) {
        actualPlaying = true
      }
    }

    if (!actualPlaying && this.state.isPlaying) {
      audioLogger.warn(`[YYC3 Audio] ⚠️ 检测到未实际播放，currentTime=${this.state.currentTime}`)

      // 如果时间仍然是0，可能真的没有在播放
      if (this.state.currentTime === 0) {
        audioLogger.warn(`[YYC3 Audio] ❌ 确认：音频未播放，时间停留在0:00`)

        // 尝试重新播放一次
        if (this.howlInstance) {
          audioLogger.info(`[YYC3 Audio] 🔄 最后尝试：重新调用play()...`)
          this.howlInstance.play()
        }
      }
    } else if (actualPlaying) {
      audioLogger.info(`[YYC3 Audio] ✅ 确认：正在正常播放 "${trackName}"`)
    }
  }

  private async activateAudioContext(): Promise<void> {
    if (!this.audioContext) {
      audioLogger.info('[YYC3 Audio] 初始化Audio Context...')
      this.initializeAudioContext()
    }

    if (this.audioContext?.state === 'suspended') {
      audioLogger.info('[YYC3 Audio] 🔓 解锁Audio Context (suspended → running)')
      try {
        await this.audioContext.resume()
        audioLogger.info('[YYC3 Audio] ✅ Audio Context已激活:', this.audioContext.state)
      } catch (error) {
        audioLogger.error('[YYC3 Audio] ❌ Audio Context激活失败:', error)
      }
    } else {
      audioLogger.info('[YYC3 Audio] ✅ Audio Context状态:', this.audioContext?.state || '未初始化')
    }
  }

  pause(): void {
    this.howlInstance?.pause()
    this.state.isPlaying = false
    this.emitStateChange()
  }

  resume(): void {
    this.howlInstance?.play()
    this.state.isPlaying = true
  }

  stop(): void {
    this.howlInstance?.stop()
    if (this.fallbackAudio) {
      this.fallbackAudio.pause()
      this.fallbackAudio.currentTime = 0
      this.fallbackAudio = null
    }
    if (this.timeUpdateRAF) {
      cancelAnimationFrame(this.timeUpdateRAF)
      this.timeUpdateRAF = null
    }
    this.state.isPlaying = false
    this.state.currentTrack = null
    this.state.currentTime = 0
  }

  seek(time: number): void {
    this.howlInstance?.seek(time)
    this.state.currentTime = time
  }

  // updateTime - delegated to Howler's own time tracking

  private handleTrackEnd(): void {
    this.state.isPlaying = false

    if (this.state.playlist) {
      const { repeat, currentIndex, tracks } = this.state.playlist

      if (repeat === 'one') {
        this.play(tracks[currentIndex].id)
      } else if (repeat === 'all' || currentIndex < tracks.length - 1) {
        const nextIndex = (currentIndex + 1) % tracks.length
        this.state.playlist.currentIndex = nextIndex
        this.play(tracks[nextIndex].id)
      } else {
        this.state.currentTrack = null
        this.emitStateChange()
      }
    } else {
      this.state.currentTrack = null
      this.emitStateChange()
    }
  }

  // ============================================================================
  // 音量控制
  // ============================================================================

  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(100, volume))
    Howler.volume(this.config.masterVolume / 100)
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.masterVolume / 100
    }
    this.saveToStorage()
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(100, volume))
    if (this.howlInstance) {
      this.howlInstance.volume((this.config.musicVolume * this.config.masterVolume) / 10000)
    }
    this.saveToStorage()
  }

  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(100, volume))
    this.saveToStorage()
  }

  getVolumes() {
    return { ...this.config }
  }

  // ============================================================================
  // 音效系统
  // ============================================================================

  registerSoundEffect(effect: Omit<SoundEffect, 'id'>): string {
    const id = uuidv4()

    const howl = new Howl({
      src: [effect.url],
      volume: (effect.volume * this.config.sfxVolume) / 10000,
      preload: true,
    })

    this.soundPool.set(id, howl)
    return id
  }

  playSoundEffect(effectId: string): void {
    const howl = this.soundPool.get(effectId)
    if (howl) {
      howl.volume((this.config.sfxVolume * this.config.masterVolume) / 10000)
      howl.play()
    }
  }

  playUIClick(): void {
    if (!this.soundPool.has('ui-click')) {
      this.playTone(800, 50, 0.2)
      return
    }
    this.playSoundEffect('ui-click')
  }

  playUIHover(): void {
    if (!this.soundPool.has('ui-hover')) {
      this.playTone(1200, 30, 0.1)
      return
    }
    this.playSoundEffect('ui-hover')
  }

  playNotification(): void {
    if (!this.soundPool.has('notification')) {
      this.playTone(600, 200, 0.3)
      return
    }
    this.playSoundEffect('notification')
  }

  playAIResponseStart(): void {
    if (!this.soundPool.has('ai-start')) {
      this.playTone(440, 100, 0.15)
      return
    }
    this.playSoundEffect('ai-start')
  }

  playAIResponseComplete(): void {
    if (!this.soundPool.has('ai-complete')) {
      this.playChord([523.25, 659.25, 783.99], 300, 0.2)
      return
    }
    this.playSoundEffect('ai-complete')
  }

  private playTone(frequency: number, duration: number, volume: number): void {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gainNode.gain.value = volume * (this.config.sfxVolume / 100) * (this.config.masterVolume / 100)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration / 1000)
  }

  private playChord(frequencies: number[], duration: number, volume: number): void {
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, duration, volume), index * 50)
    })
  }

  // ============================================================================
  // 播放列表管理
  // ============================================================================

  createPlaylist(name: string, trackIds: string[]): Playlist {
    const tracks = trackIds.map((id) => this.tracks.get(id)).filter(Boolean) as AudioTrack[]

    const playlist: Playlist = {
      id: uuidv4(),
      name,
      tracks,
      currentIndex: 0,
      shuffle: false,
      repeat: 'off',
      createdAt: Date.now(),
    }

    this.playlists.set(playlist.id, playlist)
    this.saveToStorage()
    return playlist
  }

  addToPlaylist(playlistId: string, trackId: string): boolean {
    const playlist = this.playlists.get(playlistId)
    const track = this.tracks.get(trackId)

    if (!playlist || !track) return false

    playlist.tracks.push(track)
    this.saveToStorage()
    return true
  }

  removeFromPlaylist(playlistId: string, trackIndex: number): boolean {
    const playlist = this.playlists.get(playlistId)
    if (!playlist) return false

    playlist.tracks.splice(trackIndex, 1)
    if (playlist.currentIndex >= playlist.tracks.length) {
      playlist.currentIndex = Math.max(0, playlist.tracks.length - 1)
    }

    this.saveToStorage()
    return true
  }

  setActivePlaylist(playlistId: string): void {
    const playlist = this.playlists.get(playlistId)
    if (playlist) {
      this.state.playlist = playlist
    }
  }

  setShuffle(shuffle: boolean): void {
    if (this.state.playlist) {
      this.state.playlist.shuffle = shuffle
      if (shuffle) {
        this.shufflePlaylist()
      }
    }
  }

  setRepeat(repeat: Playlist['repeat']): void {
    if (this.state.playlist) {
      this.state.playlist.repeat = repeat
    }
  }

  private shufflePlaylist(): void {
    if (!this.state.playlist) return

    for (let i = this.state.playlist.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[this.state.playlist.tracks[i], this.state.playlist.tracks[j]] = [
          this.state.playlist.tracks[j],
          this.state.playlist.tracks[i],
        ]
    }
  }

  getPlaylists(): Playlist[] {
    return Array.from(this.playlists.values())
  }

  getPlaylistById(id: string): Playlist | undefined {
    return this.playlists.get(id)
  }

  // ============================================================================
  // 音频编辑功能
  // ============================================================================

  createEditedVersion(
    originalId: string,
    options: {
      name?: string
      startTime?: number
      endTime?: number
      volume?: number
      fadeIn?: number
      fadeOut?: number
    }
  ): EditedAudio | null {
    const original = this.tracks.get(originalId)
    if (!original) return null

    const edited: EditedAudio = {
      originalId,
      id: uuidv4(),
      name: options.name || `${original.name} (Edited)`,
      startTime: options.startTime ?? 0,
      endTime: options.endTime ?? original.duration,
      volume: options.volume ?? 100,
      fadeIn: options.fadeIn ?? 0,
      fadeOut: options.fadeOut ?? 0,
      url: original.url,
    }

    this.editedTracks.set(edited.id, edited)
    this.saveToStorage()
    return edited
  }

  playEditedVersion(editedId: string): void {
    const edited = this.editedTracks.get(editedId)
    if (!edited) return

    if (this.howlInstance) {
      this.stop()
    }

    this.howlInstance = new Howl({
      src: [edited.url],
      html5: true,
      volume: ((edited.volume * this.config.musicVolume * this.config.masterVolume) / 10000),
    })

    this.howlInstance.once('load', () => {
      this.howlInstance?.seek(edited.startTime)
      this.howlInstance?.play()

      setTimeout(() => {
        if (edited.fadeOut > 0 && this.howlInstance) {
          this.howlInstance.fade(
            (edited.volume * this.config.musicVolume * this.config.masterVolume) / 10000,
            0,
            edited.fadeOut / 1000
          )
        }
      }, (edited.endTime - edited.fadeOut - edited.startTime) * 1000)

      setTimeout(() => {
        this.howlInstance?.stop()
      }, (edited.endTime - edited.startTime) * 1000 + 500)
    })
  }

  deleteEditedVersion(editedId: string): boolean {
    return this.editedTracks.delete(editedId)
  }

  getEditedVersions(): EditedAudio[] {
    return Array.from(this.editedTracks.values())
  }

  // ============================================================================
  // 可视化数据
  // ============================================================================

  getFrequencyData(): Uint8Array | null {
    if (!this.analyserNode) return null

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteFrequencyData(dataArray)
    return dataArray
  }

  getTimeDomainData(): Uint8Array | null {
    if (!this.analyserNode) return null

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteTimeDomainData(dataArray)
    return dataArray
  }

  // ============================================================================
  // 状态监听
  // ============================================================================

  subscribe(listener: AudioEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState(): AudioEngineState {
    return { ...this.state }
  }

  private emitStateChange(): void {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }

  // ============================================================================
  // 持久化存储
  // ============================================================================

  private saveToStorage(): void {
    try {
      const data = {
        config: this.config,
        tracks: Array.from(this.tracks.entries()),
        playlists: Array.from(this.playlists.entries()),
        editedTracks: Array.from(this.editedTracks.entries()),
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data, (_key, value) => {
        if (typeof value === 'string' && value.startsWith('blob:')) {
          return undefined
        }
        return value
      }))
    } catch {
      audioLogger.warn('[YYC3 Audio] Failed to save to storage')
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY)
      if (!raw) return

      const data = JSON.parse(raw)

      if (data.config) {
        this.config = { ...this.config, ...data.config }
      }

      if (data.tracks) {
        for (const [id, track] of data.tracks) {
          if (track.url && !track.url.startsWith('blob:')) {
            this.tracks.set(id, track)
          }
        }
      }

      if (data.playlists) {
        for (const [id, playlist] of data.playlists) {
          this.playlists.set(id, playlist)
        }
      }

      if (data.editedTracks) {
        for (const [id, edited] of data.editedTracks) {
          this.editedTracks.set(id, edited)
        }
      }
    } catch {
      audioLogger.warn('[YYC3 Audio] Failed to load from storage')
    }
  }

  // ============================================================================
  // 清理
  // ============================================================================

  destroy(): void {
    this.stop()
    this.howlInstance?.unload()
    this.soundPool.forEach((howl) => howl.unload())
    this.soundPool.clear()
    this.audioContext?.close()
    this.listeners.clear()
  }

  exportConfig(): string {
    return JSON.stringify({
      config: this.config,
      playlists: Array.from(this.playlists.values()).map((p) => ({
        ...p,
        tracks: p.tracks.map((t) => t.id),
      })),
    }, null, 2)
  }

  importConfig(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)

      if (data.config) {
        this.config = { ...this.config, ...data.config }
      }

      this.saveToStorage()
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// 单例导出
// ============================================================================

let audioEngineInstance: AudioEngine | null = null

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine()
  }
  return audioEngineInstance
}

export function destroyAudioEngine(): void {
  if (audioEngineInstance) {
    audioEngineInstance.destroy()
    audioEngineInstance = null
  }
}
