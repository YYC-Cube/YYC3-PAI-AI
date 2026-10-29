/**
 * @file EnhancedAudioPlayer.tsx
 * @description 增强版音乐播放器 - 集成MV、歌词、可视化、收藏、搜索、快捷键
 * @version v2.0.0
 */


import {
  ChevronLeft,
  ChevronRight,
  Film,
  Heart,
  Keyboard,
  ListMusic,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useThemeStore } from '../../store/theme-store'
import { getAudioEngine , type AudioTrack} from '../../utils/audio-engine'
import { createLogger } from '../../utils/logger'

const logger = createLogger('EnhancedAudioPlayer')

// ── 类型定义 ──
interface LyricLine {
  time: number
  text: string
  translation?: string
}

interface FavoriteTrack {
  id: string
  name: string
  artist: string
  addedAt: number
}

interface MVTrackInfo {
  videoUrl: string
  title: string
  thumbnail?: string
}

interface EnhancedAudioPlayerProps {
  isOpen: boolean
  onClose: () => void
}

// ── LRC歌词解析器 ──
class LyricsParser {
  static parse(lrcContent: string): LyricLine[] {
    const lines: LyricLine[] = []
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g
    let match

    while ((match = timeRegex.exec(lrcContent)) !== null) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + milliseconds / 1000
      const text = match[4].trim()

      if (text) {
        lines.push({ time, text })
      }
    }

    return lines.sort((a, b) => a.time - b.time)
  }

  static findCurrentLine(lines: LyricLine[], currentTime: number): number {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        return i
      }
    }
    return -1
  }
}

// ── 收藏管理器 ──
class FavoritesManager {
  private storageKey = 'yyc3-audio-favorites'

  getFavorites(): FavoriteTrack[] {
    try {
      const raw = localStorage.getItem(this.storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  addFavorite(track: { id: string; name: string; artist: string }): void {
    const favorites = this.getFavorites()
    if (!favorites.find(f => f.id === track.id)) {
      favorites.unshift({
        ...track,
        addedAt: Date.now(),
      })
      localStorage.setItem(this.storageKey, JSON.stringify(favorites))
    }
  }

  removeFavorite(trackId: string): void {
    const favorites = this.getFavorites().filter(f => f.id !== trackId)
    localStorage.setItem(this.storageKey, JSON.stringify(favorites))
  }

  isFavorite(trackId: string): boolean {
    return this.getFavorites().some(f => f.id === trackId)
  }
}

const favoritesManager = new FavoritesManager()

// ── 主组件 ──
export function EnhancedAudioPlayer({ isOpen, onClose }: EnhancedAudioPlayerProps) {
  const { tokens } = useThemeStore()
  const audioEngine = getAudioEngine()

  // 播放状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackName, setCurrentTrackName] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)

  // 歌曲列表
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [filteredTracks, setFilteredTracks] = useState<AudioTrack[]>([])
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)

  // 搜索
  const [searchQuery, setSearchQuery] = useState('')

  // MV播放器
  const [showMVPlayer, setShowMVPlayer] = useState(false)
  const [currentMV, setCurrentMV] = useState<MVTrackInfo | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreenMV, setIsFullscreenMV] = useState(false)
  const [showMVControls, setShowMVControls] = useState(true)

  // 歌词显示
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1)
  const [showLyrics, setShowLyrics] = useState(true)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)

  // 音频可视化
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // 收藏
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([])
  const [isCurrentFavorite, setIsCurrentFavorite] = useState(false)

  // 播放模式
  const [playMode, setPlayMode] = useState<'normal' | 'shuffle' | 'repeat' | 'repeatOne'>('normal')

  // 快捷键提示
  const [showShortcuts, setShowShortcuts] = useState(false)

  // 初始化音频引擎和歌曲列表
  useEffect(() => {
    if (!isOpen) return

    const init = async () => {
      let trackList = audioEngine.getTracks()
      if (trackList.length === 0) {
        await audioEngine.initializeMusicLibrary()
        trackList = audioEngine.getTracks()
      }
      setTracks(trackList)
      setFilteredTracks(trackList)

      // 加载收藏列表
      setFavorites(favoritesManager.getFavorites())
    }

    init()

    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying)
      setCurrentTime(state.currentTime)
      setDuration(state.duration || 0)
      if (state.currentTrack) {
        setCurrentTrackName(state.currentTrack.name)
        setIsCurrentFavorite(favoritesManager.isFavorite(state.currentTrack.id))

        // 尝试加载歌词（基于歌曲名）
        loadLyricsForTrack(state.currentTrack.name)

        // 检查是否有MV
        checkForMV(state.currentTrack)
      }
    })

    return () => unsubscribe()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isOpen])

  // 时间更新（用于歌词同步）
  useEffect(() => {
    if (!isOpen || !isPlaying) return

    const interval = setInterval(() => {
      const state = audioEngine.getState()
      setCurrentTime(state.currentTime)
      setDuration(state.duration || 0)

      // 更新歌词位置
      if (lyrics.length > 0) {
        const idx = LyricsParser.findCurrentLine(lyrics, state.currentTime)
        if (idx !== currentLyricIndex && idx >= 0) {
          setCurrentLyricIndex(idx)
          scrollToLyric(idx)
        }
      }
    }, 100)

    return () => clearInterval(interval)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isOpen, isPlaying, lyrics])

  // 音频可视化初始化
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    const initVisualizer = async () => {
      try {
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256

        // 连接到音频源（如果可用）
        const audioElement = document.querySelector('audio') as HTMLAudioElement
        if (audioElement && audioContextRef.current) {
          const source = audioContextRef.current.createMediaElementSource(audioElement)
          source.connect(analyserRef.current)
          analyserRef.current.connect(audioContextRef.current.destination)
        }
      } catch (error) {
        logger.error('[EnhancedPlayer] 可视化初始化失败:', error)
      }
    }

    initVisualizer()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isOpen])

  // 绘制波形图
  useEffect(() => {
    if (!analyserRef.current || !canvasRef.current || !isPlaying) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      const bufferLength = analyserRef.current!.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current!.getByteFrequencyData(dataArray)

      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      const barWidth = (canvas.offsetWidth / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.offsetHeight

        // 渐变色
        const gradient = ctx.createLinearGradient(0, canvas.offsetHeight - barHeight, 0, canvas.offsetHeight)
        gradient.addColorStop(0, tokens.primary)
        gradient.addColorStop(0.5, tokens.accent)
        gradient.addColorStop(1, `${tokens.primary}40`)

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.offsetHeight - barHeight, barWidth - 1, barHeight)

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, tokens])

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSeek(Math.max(0, currentTime - 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSeek(Math.min(duration, currentTime + 5))
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(100, volume + 5))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 5))
          break
        case 'KeyM':
          handleToggleMute()
          break
        case 'KeyL':
          toggleLyrics()
          break
        case 'KeyF':
          toggleFavorite()
          break
        case 'KeyV':
          toggleMVPlayer()
          break
        case 'Escape':
          if (showMVPlayer) {
            closeMVPlayer()
          } else if (showShortcuts) {
            setShowShortcuts(false)
          } else {
            onClose()
          }
          break
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault()
            setShowShortcuts(prev => !prev)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isOpen, isPlaying, currentTime, duration, volume, showMVPlayer, showShortcuts])

  // 搜索功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTracks(tracks)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = tracks.filter(track =>
      track.name.toLowerCase().includes(query) ||
      track.metadata?.artist?.toLowerCase().includes(query) ||
      track.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    )
    setFilteredTracks(filtered)
  }, [searchQuery, tracks])

  // 核心功能方法
  const handlePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        audioEngine.pause()
        setIsPlaying(false)
      } else {
        let trackList = tracks.length > 0 ? tracks : audioEngine.getTracks()

        if (trackList.length === 0) {
          trackList = await audioEngine.initializeMusicLibrary()
          setTracks(trackList)
        }

        if (trackList.length > 0) {
          const currentId = audioEngine.getState().currentTrack?.id
          if (currentId) {
            audioEngine.play(currentId)
          } else {
            audioEngine.play(trackList[0].id)
          }
          setIsPlaying(true)
        }
      }
    } catch (error) {
      logger.error('[EnhancedPlayer] ❌ 播放失败:', error)
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isPlaying, tracks])

  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time)
    setCurrentTime(time)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration

    handleSeek(newTime)
  }, [duration, handleSeek])

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol)
    audioEngine.setMusicVolume(vol)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [])

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      audioEngine.setMasterVolume(volume)
      setIsMuted(false)
    } else {
      audioEngine.setMasterVolume(0)
      setIsMuted(true)
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isMuted, volume])

  const handleTrackSelect = useCallback(async (trackId: string) => {
    try {
      await audioEngine.play(trackId)
      setIsPlaying(true)
    } catch (error) {
      logger.error('[EnhancedPlayer] ❌ 切换歌曲失败:', error)
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [])

  const handlePrevious = useCallback(() => {
    const currentIndex = filteredTracks.findIndex(t => t.name === currentTrackName)
    if (currentIndex > 0) {
      handleTrackSelect(filteredTracks[currentIndex - 1].id)
    } else if (playMode === 'repeat' || playMode === 'repeatOne') {
      handleTrackSelect(filteredTracks[filteredTracks.length - 1].id)
    }
  }, [filteredTracks, currentTrackName, playMode, handleTrackSelect])

  const handleNext = useCallback(() => {
    let nextIndex: number

    if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * filteredTracks.length)
    } else {
      const currentIndex = filteredTracks.findIndex(t => t.name === currentTrackName)
      nextIndex = currentIndex < filteredTracks.length - 1 ? currentIndex + 1 : 0
    }

    if (nextIndex < filteredTracks.length) {
      handleTrackSelect(filteredTracks[nextIndex].id)
    }
  }, [filteredTracks, currentTrackName, playMode, handleTrackSelect])

  const togglePlayMode = useCallback(() => {
    const modes: Array<'normal' | 'shuffle' | 'repeat' | 'repeatOne'> = ['normal', 'shuffle', 'repeat', 'repeatOne']
    const currentIndex = modes.indexOf(playMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setPlayMode(modes[nextIndex])
  }, [playMode])

  const toggleFavorite = useCallback(() => {
    const currentTrack = audioEngine.getState().currentTrack
    if (!currentTrack) return

    if (isCurrentFavorite) {
      favoritesManager.removeFavorite(currentTrack.id)
    } else {
      favoritesManager.addFavorite({
        id: currentTrack.id,
        name: currentTrack.name,
        artist: currentTrack.metadata?.artist || '未知',
      })
    }

    setIsCurrentFavorite(!isCurrentFavorite)
    setFavorites(favoritesManager.getFavorites())
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isCurrentFavorite])

  const toggleLyrics = useCallback(() => {
    setShowLyrics(prev => !prev)
  }, [])

  const toggleMVPlayer = useCallback(() => {
    if (showMVPlayer) {
      closeMVPlayer()
    } else if (currentMV) {
      setShowMVPlayer(true)
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [showMVPlayer, currentMV])

  const closeMVPlayer = useCallback(() => {
    setShowMVPlayer(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [])

  // MV相关方法
  const checkForMV = useCallback((_track: AudioTrack) => {
    // 模拟：检查是否有对应的MV文件
    // 实际项目中可以从API或本地目录获取MV信息

    // 这里可以添加实际的MV检测逻辑
    // 暂时设置为null，表示没有MV
    setCurrentMV(null)
  }, [])

  const loadLyricsForTrack = useCallback((trackName: string) => {
    // 尝试加载LRC歌词文件
    // 实际项目中可以从API或本地文件获取歌词
    const lrcContent = generateSampleLRC(trackName)
    if (lrcContent) {
      const parsedLyrics = LyricsParser.parse(lrcContent)
      setLyrics(parsedLyrics)
      setCurrentLyricIndex(-1)
    }
  }, [])

  const scrollToLyric = useCallback((index: number) => {
    if (!lyricsContainerRef.current) return

    const lyricElements = lyricsContainerRef.current.children
    if (lyricElements[index]) {
      lyricElements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [])

  // MV控制方法
  const toggleFullscreenMV = useCallback(async () => {
    if (!videoRef.current?.parentElement) return

    try {
      if (!document.fullscreenElement) {
        await videoRef.current.parentElement.requestFullscreen()
        setIsFullscreenMV(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreenMV(false)
      }
    } catch { /* ignore */ }
  }, [])

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch { /* ignore */ }
  }, [])

  // 工具函数
  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'shuffle': return <Shuffle size={16} />
      case 'repeat': return <Repeat size={16} />
      case 'repeatOne': return <Repeat1 size={16} />
      default: return <ListMusic size={16} />
    }
  }

  const getPlayModeLabel = () => {
    switch (playMode) {
      case 'shuffle': return '随机播放'
      case 'repeat': return '列表循环'
      case 'repeatOne': return '单曲循环'
      default: return '顺序播放'
    }
  }

  // 生成示例歌词（实际项目中应该从服务器获取）
  const generateSampleLRC = (_trackName: string): string => {
    // 返回空字符串表示没有歌词
    // 在实际应用中，这里应该调用API获取真实歌词
    return ''
  }

  if (!isOpen) return null

  return (
    <>
      {/* 主播放器界面 */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            background: tokens.cardBg,
            border: `1px solid ${tokens.border}`,
            animation: 'enhancedSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <div className="flex items-center gap-3">
              <Music size={22} style={{ color: tokens.primary }} />
              <span className="font-bold text-lg" style={{ color: tokens.primary }}>
                YYC³ 增强音乐播放器
              </span>

              {/* 播放模式 */}
              <button
                onClick={togglePlayMode}
                className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                title={getPlayModeLabel()}
                style={{ color: tokens.primary }}
              >
                {getPlayModeIcon()}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* 快捷键帮助 */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                title="键盘快捷键"
                style={{ color: tokens.foregroundMuted }}
              >
                <Keyboard size={16} />
              </button>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                aria-label="关闭播放器"
                className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                style={{ color: tokens.foregroundMuted }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
              {/* 左侧：播放控制 + 可视化 */}
              <div className="lg:col-span-2 space-y-4">
                {/* 当前歌曲信息 */}
                <div className="text-center space-y-2 p-4 rounded-xl" style={{
                  background: `linear-gradient(135deg, ${tokens.primary}08, ${tokens.accent}08)`,
                  border: `1px solid ${tokens.primary}20`,
                }}>
                  <h2 className="text-xl font-bold truncate" style={{ color: tokens.foreground }} title={currentTrackName}>
                    {currentTrackName || '未选择歌曲'}
                  </h2>

                  <div className="flex items-center justify-center gap-4 text-sm" style={{ color: tokens.foregroundMuted }}>
                    <span>{audioEngine.getState().currentTrack?.metadata?.artist || '未知艺术家'}</span>
                    <span>•</span>
                    <span>{filteredTracks.length} 首歌曲</span>

                    {/* MV按钮 */}
                    {currentMV && (
                      <button
                        onClick={toggleMVPlayer}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:bg-white/10"
                        style={{ color: tokens.primary }}
                      >
                        <Film size={14} />
                        <span>MV</span>
                      </button>
                    )}
                  </div>

                  {/* 音频可视化波形图 */}
                  <div className="w-full h-20 rounded-lg overflow-hidden relative" style={{
                    background: `${tokens.codeBg}`,
                    border: `1px solid ${tokens.borderDim}`,
                  }}>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full"
                      style={{ display: 'block' }}
                    />

                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: tokens.foregroundMuted }}>
                        点击播放查看波形图
                      </div>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="space-y-2 px-4">
                  <div
                    className="w-full h-2 rounded-full cursor-pointer relative group"
                    style={{ background: `${tokens.border}40` }}
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full rounded-full transition-all relative"
                      style={{
                        width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                        background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent}, ${tokens.warning})`,
                      }}
                    >
                      {/* 进度指示器 */}
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          transform: 'translate(50%, -50%)',
                          background: '#fff',
                          boxShadow: `0 0 8px ${tokens.primary}`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-mono" style={{ color: tokens.foregroundMuted }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 播放控制按钮 */}
                <div className="flex items-center justify-center gap-4 px-4">
                  <button
                    onClick={handlePrevious}
                    aria-label="上一首"
                    className="p-3 rounded-full transition-all hover:bg-white/10 active:scale-95"
                    style={{ color: tokens.foreground }}
                  >
                    <SkipBack size={20} fill="currentColor" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "暂停" : "播放"}
                    className="p-4 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
                      color: '#fff',
                      boxShadow: `0 8px 24px ${tokens.primary}40`,
                    }}
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                  </button>

                  <button
                    onClick={handleNext}
                    aria-label="下一首"
                    className="p-3 rounded-full transition-all hover:bg-white/10 active:scale-95"
                    style={{ color: tokens.foreground }}
                  >
                    <SkipForward size={20} fill="currentColor" />
                  </button>
                </div>

                {/* 音量控制 + 功能按钮 */}
                <div className="flex items-center justify-between px-4 pt-2">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={handleToggleMute}
                      aria-label={isMuted ? "取消静音" : "静音"}
                      className="transition-colors"
                      style={{ color: isMuted ? tokens.error : tokens.foregroundMuted }}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      aria-label="音量调节"
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${tokens.primary} 0%, ${tokens.primary} ${volume}%, ${tokens.border} ${volume}%, ${tokens.border} 100%)`,
                      }}
                    />

                    <span className="text-xs w-10 text-right font-mono" style={{ color: tokens.foregroundMuted }}>
                      {volume}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* 歌词开关 */}
                    <button
                      onClick={toggleLyrics}
                      className={`p-2 rounded-lg transition-all ${showLyrics ? '' : 'opacity-50'}`}
                      title="显示/隐藏歌词"
                      style={{ color: showLyrics ? tokens.primary : tokens.foregroundMuted }}
                    >
                      <Zap size={16} />
                    </button>

                    {/* 收藏按钮 */}
                    <button
                      onClick={toggleFavorite}
                      className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                      title={isCurrentFavorite ? "取消收藏" : "收藏"}
                      style={{
                        color: isCurrentFavorite ? '#ff4757' : tokens.foregroundMuted,
                        filter: isCurrentFavorite ? 'drop-shadow(0 0 6px #ff4757)' : 'none',
                      }}
                    >
                      <Heart size={18} fill={isCurrentFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                {/* 歌词显示区域 */}
                {showLyrics && lyrics.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl max-h-48 overflow-y-auto relative" style={{
                    background: `${tokens.primary}04`,
                    border: `1px solid ${tokens.primary}15`,
                  }}
                    ref={lyricsContainerRef}
                  >
                    <div className="space-y-3">
                      {lyrics.map((line, index) => (
                        <p
                          key={index}
                          className="text-center transition-all duration-300"
                          style={{
                            fontSize: index === currentLyricIndex ? '16px' : '13px',
                            fontWeight: index === currentLyricIndex ? 'bold' : 'normal',
                            color: index === currentLyricIndex
                              ? tokens.primary
                              : index < currentLyricIndex
                                ? tokens.foregroundMuted
                                : `${tokens.foregroundMuted}60`,
                            opacity: index === currentLyricIndex ? 1 : 0.7,
                            transform: index === currentLyricIndex ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {line.text}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：播放列表 + 搜索 + 收藏 */}
              <div className="space-y-4">
                {/* 搜索框 */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.foregroundMuted }} />
                  <input
                    type="text"
                    placeholder="搜索歌曲..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: tokens.codeBg,
                      border: `1px solid ${tokens.borderDim}`,
                      color: tokens.foreground,
                    }}
                  />
                </div>

                {/* 切换标签 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowPlaylist(true); setShowFavorites(false) }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showPlaylist ? '' : 'opacity-60'
                      }`}
                    style={{
                      background: showPlaylist ? `${tokens.primary}15` : 'transparent',
                      color: showPlaylist ? tokens.primary : tokens.foregroundMuted,
                      border: `1px solid ${showPlaylist ? tokens.primary : tokens.borderDim}`,
                    }}
                  >
                    <ListMusic size={14} className="inline mr-1" />
                    播放列表 ({filteredTracks.length})
                  </button>

                  <button
                    onClick={() => { setShowFavorites(true); setShowPlaylist(false) }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showFavorites ? '' : 'opacity-60'
                      }`}
                    style={{
                      background: showFavorites ? `${tokens.primary}15` : 'transparent',
                      color: showFavorites ? tokens.primary : tokens.foregroundMuted,
                      border: `1px solid ${showFavorites ? tokens.primary : tokens.borderDim}`,
                    }}
                  >
                    <Heart size={14} className="inline mr-1" fill={showFavorites ? 'currentColor' : 'none'} />
                    收藏 ({favorites.length})
                  </button>
                </div>

                {/* 播放列表 / 收藏列表 */}
                <div className="max-h-[400px] overflow-y-auto space-y-1 rounded-lg p-2" style={{
                  background: `${tokens.codeBg}40`,
                  border: `1px solid ${tokens.borderDim}`,
                }}>
                  {(showPlaylist ? filteredTracks : favorites).map((item, index) => {
                    const track = showPlaylist ? item : item
                    const trackId = track.id
                    const trackName = track.name || ''
                    const isActive = currentTrackName === trackName
                    // isFav 保留备用

                    return (
                      <button
                        key={trackId}
                        onClick={() => handleTrackSelect(trackId)}
                        className="w-full text-left p-2.5 rounded-lg transition-all hover:bg-white/5 group flex items-center gap-3"
                        style={{
                          background: isActive ? `${tokens.primary}12` : 'transparent',
                          borderLeft: isActive ? `3px solid ${tokens.primary}` : 'none',
                        }}
                      >
                        <span className="text-xs font-mono w-6 text-center" style={{
                          color: isActive ? tokens.primary : tokens.foregroundMuted,
                        }}>
                          {index + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate font-medium" style={{ color: tokens.foreground }}>
                            {trackName}
                          </p>
                          <p className="text-xs truncate" style={{ color: tokens.foregroundMuted }}>
                            {(track as { metadata?: { artist?: string }; artist?: string }).metadata?.artist || (track as { artist?: string }).artist || '未知'}
                          </p>
                        </div>

                        {/* 播放状态指示器 */}
                        {(isActive && isPlaying) && (
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className="w-0.5 h-3 rounded-full animate-pulse"
                                style={{
                                  background: tokens.primary,
                                  animationDelay: `${i * 150}ms`,
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* 收藏按钮（仅在播放列表中显示） */}
                        {showPlaylist && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (favoritesManager.isFavorite(trackId)) {
                                favoritesManager.removeFavorite(trackId)
                              } else {
                                favoritesManager.addFavorite({
                                  id: trackId,
                                  name: trackName,
                                  artist: (track as { metadata?: { artist?: string } }).metadata?.artist || '未知',
                                })
                              }
                              setFavorites(favoritesManager.getFavorites())
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              color: favoritesManager.isFavorite(trackId) ? '#ff4757' : tokens.foregroundMuted,
                            }}
                          >
                            <Heart size={14} fill={favoritesManager.isFavorite(trackId) ? 'currentColor' : 'none'} />
                          </button>
                        )}
                      </button>
                    )
                  })}

                  {/* 空状态 */}
                  {(showPlaylist ? filteredTracks : favorites).length === 0 && (
                    <div className="text-center py-8 text-sm" style={{ color: tokens.foregroundMuted }}>
                      {showPlaylist ? '没有找到匹配的歌曲' : '还没有收藏任何歌曲'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 text-xs flex items-center justify-between" style={{ borderTop: `1px solid ${tokens.border}`, color: tokens.foregroundMuted }}>
            <span>
              YYC³ AI Code v8.2 | 沫语·女生版 & 沫言·男声版 | {filteredTracks.length} 首
            </span>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">按 ? 查看快捷键</span>
              <span>🎵 音乐持续播放中</span>
            </div>
          </div>
        </div>

        {/* MV播放器弹窗 */}
        {showMVPlayer && currentMV && (
          <div
            className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
            onClick={closeMVPlayer}
          >
            <div
              className="relative w-full max-w-5xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 视频容器 */}
              <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  src={currentMV.videoUrl}
                  poster={currentMV.thumbnail}
                  className="w-full aspect-video"
                  muted
                  playsInline
                />

                {/* 视频控制覆盖层 */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 ${showMVControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  onMouseMove={() => {
                    setShowMVControls(true)
                    setTimeout(() => setShowMVControls(false), 3000)
                  }}
                >
                  {/* 顶部信息栏 */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Film size={20} />
                      <span className="font-semibold">{currentMV.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePiP}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
                        title="画中画"
                      >
                        <PictureInPicture2 size={18} className="text-white" />
                      </button>

                      <button
                        onClick={toggleFullscreenMV}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
                        title="全屏"
                      >
                        {isFullscreenMV ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                      </button>

                      <button
                        onClick={closeMVPlayer}
                        className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-all"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  </div>

                  {/* 底部进度和控制 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    {/* 进度条 */}
                    <div
                      className="w-full h-1 bg-white/30 rounded-full cursor-pointer group"
                      onClick={handleProgressClick}
                    >
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-white text-sm">
                      <span className="font-mono">{formatTime(currentTime)}</span>

                      <div className="flex items-center gap-3">
                        <button onClick={handlePrevious} className="p-1 hover:bg-white/20 rounded">
                          <ChevronLeft size={20} />
                        </button>

                        <button
                          onClick={handlePlayPause}
                          className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>

                        <button onClick={handleNext} className="p-1 hover:bg-white/20 rounded">
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <span className="font-mono">{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 键盘快捷键帮助弹窗 */}
        {showShortcuts && (
          <div
            className="absolute inset-0 z-[10001] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowShortcuts(false)}
          >
            <div
              className="w-full max-w-md rounded-xl p-6 m-4"
              style={{
                background: tokens.cardBg,
                border: `1px solid ${tokens.border}`,
                animation: 'enhancedSlideUp 0.3s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: tokens.primary }}>
                  ⌨️ 键盘快捷键
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <X size={18} style={{ color: tokens.foregroundMuted }} />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { key: 'Space', action: '播放 / 暂停' },
                  { key: '← →', action: '快退 / 快进 5秒' },
                  { key: '↑ ↓', action: '增加 / 减少音量' },
                  { key: 'M', action: '静音切换' },
                  { key: 'L', action: '显示 / 隐藏歌词' },
                  { key: 'F', action: '收藏当前歌曲' },
                  { key: 'V', action: '打开 / 关闭MV' },
                  { key: 'Esc', action: '关闭弹窗' },
                  { key: '?', action: '显示此帮助' },
                ].map(({ key, action }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ background: `${tokens.primary}06` }}
                  >
                    <kbd className="px-2 py-1 rounded text-xs font-mono" style={{
                      background: tokens.codeBg,
                      border: `1px solid ${tokens.borderDim}`,
                      color: tokens.primary,
                    }}>
                      {key}
                    </kbd>
                    <span style={{ color: tokens.foreground }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 全局样式 */}
      <style>{`
        @keyframes enhancedSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .neon-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .neon-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .neon-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(128, 128, 128, 0.4);
          border-radius: 3px;
        }

        .neon-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${tokens.primary};
        }

        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type='range']::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: none;
        }
      `}</style>
    </>
  )
}

export default EnhancedAudioPlayer
