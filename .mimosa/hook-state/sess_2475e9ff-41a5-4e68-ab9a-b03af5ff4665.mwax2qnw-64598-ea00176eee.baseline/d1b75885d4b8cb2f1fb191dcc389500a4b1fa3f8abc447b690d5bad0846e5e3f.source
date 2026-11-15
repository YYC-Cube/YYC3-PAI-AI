/**
 * @file MiniAudioPlayer.tsx
 * @description 全局迷你音乐播放器 - 顶部/侧边图标 + 点击弹出增强版播放器v3
 */

import { Music, Pause } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useThemeStore } from '../../store/theme-store'
import { getAudioEngine } from '../../utils/audio-engine'
import { createLogger } from '../../utils/logger'
import { EnhancedAudioPlayerV3 } from './EnhancedAudioPlayerV3'

const logger = createLogger('MiniAudioPlayer')

interface MiniAudioPlayerProps {
  onOpenFullPlayer?: () => void
  className?: string
}

export function MiniAudioPlayer({ onOpenFullPlayer: _onOpenFullPlayer, className = '' }: MiniAudioPlayerProps) {
  const { tokens } = useThemeStore()
  const audioEngine = getAudioEngine()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackName, setCurrentTrackName] = useState<string>('')
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        let tracks = audioEngine.getTracks()

        if (tracks.length === 0) {
          // console.log('[YYC3 MiniPlayer] 🎵 正在初始化音乐库...')
          await audioEngine.initializeMusicLibrary()
          tracks = audioEngine.getTracks()
        }
      } catch (error) {
        logger.error('[YYC3 MiniPlayer] ❌ 初始化失败:', error)
      }
    }

    initializeAudio()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [])

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying)
      if (state.currentTrack) {
        setCurrentTrackName(state.currentTrack.name)
      }
    })

    return () => unsubscribe()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [])

  const handleQuickToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      if (isPlaying) {
        audioEngine.pause()
      } else {
        let tracks = audioEngine.getTracks()

        if (tracks.length === 0) {
          tracks = await audioEngine.initializeMusicLibrary()
        }

        if (tracks.length > 0) {
          const currentId = audioEngine.getState().currentTrack?.id
          if (currentId) {
            audioEngine.play(currentId)
          } else {
            audioEngine.play(tracks[0].id)
          }
        }
      }
    } catch (error) {
      logger.error('[YYC3 MiniPlayer] ❌ 播放失败:', error)
    }
  }, [isPlaying, audioEngine])

  return (
    <>
      <div className={`mini-audio-player ${className}`}>
        <div
          className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all hover:bg-white/5 group"
          onClick={() => setShowPopup(true)}
          style={{ border: `1px solid transparent`, position: 'relative' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = tokens.border
            e.currentTarget.style.background = `${tokens.primary}08`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {/* 音乐图标 + 快速播放/暂停 */}
          <button
            onClick={handleQuickToggle}
            aria-label={isPlaying ? "暂停播放" : "开始播放"}
            className="relative p-1.5 rounded-full transition-all"
            style={{
              background: isPlaying ? `${tokens.primary}20` : 'transparent',
              color: isPlaying ? tokens.primary : tokens.foregroundMuted,
              boxShadow: isPlaying ? `0 0 8px ${tokens.primary}33` : 'none',
              animation: isPlaying ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            }}
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Music size={14} />
            )}

            {/* 播放状态指示器 */}
            {isPlaying && (
              <span
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                style={{
                  background: tokens.success,
                  boxShadow: `0 0 6px ${tokens.success}`,
                }}
              />
            )}
          </button>

          {/* 歌曲信息（可选显示） */}
          {(currentTrackName && showPopup === false) && (
            <div className="max-w-[120px] overflow-hidden">
              <p
                className="text-xs truncate font-medium"
                style={{ color: tokens.foreground }}
                title={currentTrackName}
              >
                {currentTrackName}
              </p>
            </div>
          )}

          {/* 展开图标 */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-50 group-hover:opacity-100 transition-opacity"
            style={{ color: tokens.foregroundMuted }}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        {/* Enhanced V3 Popup 弹窗 */}
        <EnhancedAudioPlayerV3
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
        />
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 8px ${tokens.primary}33;
          }
          50% {
            box-shadow: 0 0 16px ${tokens.primary}66;
          }
        }

        .mini-audio-player {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}

export default MiniAudioPlayer
