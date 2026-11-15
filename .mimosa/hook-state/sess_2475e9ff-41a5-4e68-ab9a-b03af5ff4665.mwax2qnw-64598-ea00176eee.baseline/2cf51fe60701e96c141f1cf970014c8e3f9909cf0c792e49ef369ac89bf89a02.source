/**
 * @file AudioPlayerPopup.tsx
 * @description 轻量化音乐播放器弹窗 - 点击顶部/侧边图标弹出
 */


import { ListMusic, Music, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useThemeStore } from '../../store/theme-store'
import { getAudioEngine , type AudioTrack} from '../../utils/audio-engine'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AudioPlayerPopup')

interface AudioPlayerPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function AudioPlayerPopup({ isOpen, onClose }: AudioPlayerPopupProps) {
  const { tokens } = useThemeStore()
  const audioEngine = getAudioEngine()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackName, setCurrentTrackName] = useState<string>('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [showPlaylist, setShowPlaylist] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const init = async () => {
      let trackList = audioEngine.getTracks()
      if (trackList.length === 0) {
        await audioEngine.initializeMusicLibrary()
        trackList = audioEngine.getTracks()
      }
      setTracks(trackList)
    }

    init()

    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying)
      setCurrentTime(state.currentTime)
      setDuration(state.duration || 0)
      if (state.currentTrack) {
        setCurrentTrackName(state.currentTrack.name)
      }
    })

    return () => unsubscribe()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !isPlaying) return

    const interval = setInterval(() => {
      const state = audioEngine.getState()
      setCurrentTime(state.currentTime)
      setDuration(state.duration || 0)
    }, 1000)

    return () => clearInterval(interval)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isOpen, isPlaying])

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
      logger.error('[YYC3 PlayerPopup] ❌ 播放失败:', error)
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [isPlaying, tracks])

  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration

    audioEngine.seek(newTime)
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value)
    setVolume(vol)
    audioEngine.setMusicVolume(vol)
  }

  const handleTrackSelect = async (trackId: string) => {
    try {
      await audioEngine.play(trackId)
      setIsPlaying(true)
    } catch (error) {
      logger.error('[YYC3 PlayerPopup] ❌ 切换歌曲失败:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: tokens.cardBg,
          border: `1px solid ${tokens.border}`,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <div className="flex items-center gap-2">
            <Music size={20} style={{ color: tokens.primary }} />
            <span className="font-semibold text-sm" style={{ color: tokens.primary }}>YYC³ 音乐播放器</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              aria-label="播放列表"
              className="p-1.5 rounded-lg transition-all hover:bg-white/10"
              style={{ color: showPlaylist ? tokens.primary : tokens.foregroundMuted }}
            >
              <ListMusic size={16} />
            </button>

            <button
              onClick={onClose}
              aria-label="关闭"
              className="p-1.5 rounded-lg transition-all hover:bg-white/10"
              style={{ color: tokens.foregroundMuted }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        {!showPlaylist ? (
          <div className="p-4 space-y-4">
            {/* Current Track Info */}
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-base truncate" style={{ color: tokens.foreground }} title={currentTrackName}>
                {currentTrackName || '未选择歌曲'}
              </h3>
              <p className="text-xs" style={{ color: tokens.foregroundMuted }}>
                {tracks.length} 首歌曲可用
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div
                className="w-full h-2 rounded-full cursor-pointer relative group"
                style={{ background: `${tokens.border}40` }}
                onClick={handleProgressClick}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                    background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})`,
                  }}
                />

                {/* Hover indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: duration ? `${(currentTime / duration) * 100}%` : '0%',
                    transform: 'translate(-50%, -50%)',
                    background: tokens.primary,
                    boxShadow: `0 0 8px ${tokens.primary}`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs" style={{ color: tokens.foregroundMuted }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  const currentIndex = tracks.findIndex(t => t.name === currentTrackName)
                  if (currentIndex > 0) {
                    handleTrackSelect(tracks[currentIndex - 1].id)
                  }
                }}
                aria-label="上一首"
                className="p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: tokens.foreground }}
              >
                <SkipBack size={18} fill="currentColor" />
              </button>

              <button
                onClick={handlePlayPause}
                aria-label={isPlaying ? "暂停" : "播放"}
                className="p-3 rounded-full transition-all hover:scale-105 active:scale-95"
                style={{
                  background: tokens.primary,
                  color: '#fff',
                  boxShadow: `0 4px 12px ${tokens.primary}40`,
                }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={() => {
                  const currentIndex = tracks.findIndex(t => t.name === currentTrackName)
                  if (currentIndex < tracks.length - 1) {
                    handleTrackSelect(tracks[currentIndex + 1].id)
                  }
                }}
                aria-label="下一首"
                className="p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: tokens.foreground }}
              >
                <SkipForward size={18} fill="currentColor" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={() => {
                  const newVol = volume > 0 ? 0 : 70
                  setVolume(newVol)
                  audioEngine.setMasterVolume(newVol)
                }}
                aria-label={volume > 0 ? "静音" : "取消静音"}
                className="transition-colors"
                style={{ color: tokens.foregroundMuted }}
              >
                {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="音量调节"
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${tokens.primary} 0%, ${tokens.primary} ${volume}%, ${tokens.border} ${volume}%, ${tokens.border} 100%)`,
                }}
              />

              <span className="text-xs w-8 text-right" style={{ color: tokens.foregroundMuted }}>
                {volume}%
              </span>
            </div>
          </div>
        ) : (
          /* Playlist View */
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(track.id)}
                className="w-full text-left p-2 rounded-lg transition-all hover:bg-white/5 flex items-center gap-3 group"
                style={{
                  background: currentTrackName === track.name ? `${tokens.primary}15` : 'transparent',
                  borderLeft: currentTrackName === track.name ? `2px solid ${tokens.primary}` : 'none',
                }}
              >
                <span className="text-xs font-mono" style={{
                  color: currentTrackName === track.name ? tokens.primary : tokens.foregroundMuted,
                  width: '20px'
                }}>
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: tokens.foreground }}>
                    {track.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: tokens.foregroundMuted }}>
                    {track.metadata?.artist || '未知艺术家'}
                  </p>
                </div>

                {(currentTrackName === track.name && isPlaying) && (
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 rounded-full animate-pulse" style={{ background: tokens.primary }} />
                    <div className="w-0.5 h-3 rounded-full animate-pulse delay-75" style={{ background: tokens.primary }} />
                    <div className="w-0.5 h-3 rounded-full animate-pulse delay-150" style={{ background: tokens.primary }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 text-xs text-center" style={{ borderTop: `1px solid ${tokens.border}`, color: tokens.foregroundMuted }}>
          YYC³ AI Code v8.2 | 沫语·女生版 & 沫言·男声版
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}

export default AudioPlayerPopup
