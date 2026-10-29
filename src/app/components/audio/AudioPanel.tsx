/**
 * @file AudioPanel.tsx
 * @description 完整音频控制面板 - 整合所有音频功能
 */

import {
  Activity,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Music,
  Scissors,
  Stethoscope,
  Upload,
  Volume2,
  VolumeX
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useThemeStore } from '../../store/theme-store'
import { getAudioEngine, type AudioTrack, type Playlist } from '../../utils/audio-engine'
import { createLogger } from '../../utils/logger'
import { AudioDiagnostic } from './AudioDiagnostic'
import { AudioEditor } from './AudioEditor'
import { AudioPlaylist } from './AudioPlaylist'
import { AudioUploader } from './AudioUploader'
import { AudioVisualizer } from './AudioVisualizer'

const logger = createLogger('AudioPanel')

interface AudioPanelProps {
  className?: string
}

type PanelView = 'player' | 'upload' | 'editor' | 'playlist' | 'visualizer' | 'diagnostic'

export function AudioPanel({ className = '' }: AudioPanelProps) {
  const { tokens } = useThemeStore()
  const audioEngine = getAudioEngine()

  const [currentView, setCurrentView] = useState<PanelView>('player')
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null)
  const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null)
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volumes, setVolumes] = useState(audioEngine.getVolumes())
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [_isLibraryLoading, setIsLibraryLoading] = useState(false)
  const [libraryInitialized, setLibraryInitialized] = useState(false)

  useEffect(() => {
    const initializeLibrary = async () => {
      const existingTracks = audioEngine.getTracks()

      if (existingTracks.length === 0 && !libraryInitialized) {
        setIsLibraryLoading(true)
        try {
          // console.log('[YYC3 Audio] 🎵 正在初始化音乐库...')
          const loadedTracks = await audioEngine.initializeMusicLibrary()
          // console.log(`[YYC3 Audio] ✅ 音乐库初始化完成: ${loadedTracks.length} 首歌曲`)
          setTracks(loadedTracks)
          setLibraryInitialized(true)
        } catch (error) {
          logger.error('[YYC3 Audio] ❌ 音乐库初始化失败:', error)
        } finally {
          setIsLibraryLoading(false)
        }
      } else {
        setTracks(existingTracks)
      }

      setActivePlaylist(
        audioEngine.getPlaylists()[0] || null
      )

      const unsubscribe = audioEngine.subscribe((state) => {
        if (state.currentTrack) {
          setSelectedTrack(state.currentTrack)
        }
      })

      return () => unsubscribe()
    }

    initializeLibrary()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [libraryInitialized])

  useEffect(() => {
    const interval = setInterval(() => {
      setVolumes(audioEngine.getVolumes())
      setTracks(audioEngine.getTracks())
    }, 1000)

    return () => clearInterval(interval)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [])

  const handleUploadComplete = useCallback((newTracks: AudioTrack[]) => {
    setTracks((prev) => [...prev, ...newTracks])

    if (!activePlaylist) {
      const newPlaylist = audioEngine.createPlaylist('我的音乐', newTracks.map(t => t.id))
      setActivePlaylist(newPlaylist)
    } else {
      newTracks.forEach(track => {
        audioEngine.addToPlaylist(activePlaylist.id, track.id)
      })
      const updatedPlaylist = audioEngine.getPlaylistById(activePlaylist.id)
      if (updatedPlaylist) {
        setActivePlaylist(updatedPlaylist)
      }
    }

    setCurrentView('playlist')
  }, [activePlaylist, audioEngine])

  const handleEditTrack = useCallback((track: AudioTrack) => {
    setEditingTrack(track)
    setCurrentView('editor')
  }, [])

  const handleSaveEdited = () => {
    setEditingTrack(null)
    setCurrentView('playlist')
  }

  const handleCancelEdit = () => {
    setEditingTrack(null)
    setCurrentView('player')
  }

  const toggleMute = () => {
    if (isMuted) {
      audioEngine.setMasterVolume(volumes.masterVolume)
      setIsMuted(false)
    } else {
      audioEngine.setMasterVolume(0)
      setIsMuted(true)
    }
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const state = audioEngine.getState()

  const tabs: { id: PanelView; label: string; icon: React.ReactNode }[] = [
    { id: 'player', label: '播放器', icon: <Music size={14} /> },
    { id: 'upload', label: '上传', icon: <Upload size={14} /> },
    { id: 'editor', label: '编辑', icon: <Scissors size={14} /> },
    { id: 'playlist', label: '列表', icon: <ListMusic size={14} /> },
    { id: 'visualizer', label: '可视化', icon: <Activity size={14} /> },
    { id: 'diagnostic', label: '诊断', icon: <Stethoscope size={14} /> },
  ]

  return (
    <div
      className={`audio-panel border rounded-lg overflow-hidden transition-all ${isExpanded ? 'max-h-[800px]' : 'max-h-12'
        } ${className}`}
      style={{
        borderColor: tokens.border,
        backgroundColor: tokens.cardBg + '80',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
        style={{ borderBottom: `1px solid ${tokens.border}` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Music size={18} style={{ color: tokens.primary }} />
          <span className="text-sm font-medium" style={{ color: tokens.primary }}>
            YYC³ 音频引擎
          </span>
          {state.isPlaying && (
            <span
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full animate-pulse"
              style={{ backgroundColor: tokens.primary + '20', color: tokens.primary }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              播放中
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 快速音量控制 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
            aria-label={isMuted ? '取消静音' : '静音'}
            className="p-1.5 hover:bg-gray-700 rounded"
          >
            {isMuted ? (
              <VolumeX size={16} className="text-gray-500" />
            ) : (
              <Volume2 size={16} className="text-gray-400" />
            )}
          </button>

          {/* 展开/收起 */}
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronUp size={16} className="text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 当前播放信息 */}
          {(state.currentTrack || selectedTrack) && (
            <div
              className="p-3 rounded-lg flex items-center gap-4"
              style={{ backgroundColor: tokens.primary + '10', border: `1px solid ${tokens.primary}20` }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: tokens.primary + '20' }}
              >
                <Music size={24} style={{ color: tokens.primary }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: tokens.primary }}>
                  {state.currentTrack?.name ?? selectedTrack?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(state.currentTime)} / {formatTime(state.duration)}
                </p>
              </div>

              {/* 迷你进度条 */}
              <div className="w-32 hidden sm:block">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: state.duration > 0 ? `${(state.currentTime / state.duration) * 100}%` : '0%',
                      background: `linear-gradient(to right, ${tokens.primary}, ${tokens.secondary})`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 切换 */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: tokens.background + '50' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                aria-label={tab.label}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-md transition-all ${currentView === tab.id
                    ? 'text-black font-medium shadow-sm'
                    : 'text-gray-400 hover:text-gray-300'
                  }`}
                style={
                  currentView === tab.id
                    ? { backgroundColor: tokens.primary }
                    : undefined
                }
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 内容区域 */}
          <div className="min-h-[200px]">
            {currentView === 'player' && (
              <div className="space-y-4">
                <AudioVisualizer type="bars" height={120} showLabels />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="master-volume" className="block text-xs text-gray-400 mb-1">主音量</label>
                    <input
                      id="master-volume"
                      type="range"
                      min={0}
                      max={100}
                      value={volumes.masterVolume}
                      onChange={(e) => audioEngine.setMasterVolume(parseInt(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <span className="text-xs text-gray-500">{volumes.masterVolume}%</span>
                  </div>
                  <div>
                    <label htmlFor="music-volume" className="block text-xs text-gray-400 mb-1">音乐</label>
                    <input
                      id="music-volume"
                      type="range"
                      min={0}
                      max={100}
                      value={volumes.musicVolume}
                      onChange={(e) => audioEngine.setMusicVolume(parseInt(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <span className="text-xs text-gray-500">{volumes.musicVolume}%</span>
                  </div>
                  <div>
                    <label htmlFor="sfx-volume" className="block text-xs text-gray-400 mb-1">音效</label>
                    <input
                      id="sfx-volume"
                      type="range"
                      min={0}
                      max={100}
                      value={volumes.sfxVolume}
                      onChange={(e) => audioEngine.setSFXVolume(parseInt(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <span className="text-xs text-gray-500">{volumes.sfxVolume}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => audioEngine.playUIClick()}
                    className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
                  >
                    🔊 测试 UI 音效
                  </button>
                  <button
                    onClick={() => audioEngine.playAIResponseComplete()}
                    className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
                  >
                    🎵 测试 AI 完成
                  </button>
                </div>
              </div>
            )}

            {currentView === 'upload' && (
              <AudioUploader onUploadComplete={handleUploadComplete} />
            )}

            {currentView === 'editor' && editingTrack ? (
              <AudioEditor track={editingTrack} onSave={handleSaveEdited} onCancel={handleCancelEdit} />
            ) : currentView === 'editor' ? (
              <div className="text-center py-8 text-gray-500">
                <Scissors size={32} className="mx-auto mb-2 opacity-50" />
                <p>请从播放列表选择要编辑的曲目</p>
                <button
                  onClick={() => setCurrentView('playlist')}
                  className="mt-3 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30"
                >
                  前往播放列表
                </button>
              </div>
            ) : null}

            {currentView === 'playlist' && (
              <AudioPlaylist
                playlist={activePlaylist}
                onTrackSelect={setSelectedTrack}
                onTrackEdit={handleEditTrack}
              />
            )}

            {currentView === 'visualizer' && (
              <div className="space-y-4">
                <AudioVisualizer type="bars" height={150} />
                <AudioVisualizer type="wave" height={100} color="#a855f7" />
                <AudioVisualizer type="circular" height={180} color="#22c55e" />
              </div>
            )}

            {currentView === 'diagnostic' && (
              <AudioDiagnostic onClose={() => setCurrentView('player')} />
            )}
          </div>

          {/* 底部统计 */}
          <div
            className="flex items-center justify-between pt-3 text-xs"
            style={{ borderTop: `1px solid ${tokens.border}`, color: tokens.foregroundMuted }}
          >
            <span>{tracks.length} 个曲目</span>
            <span>{audioEngine.getPlaylists().length} 个播放列表</span>
            <span>{audioEngine.getEditedVersions().length} 个编辑版本</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioPanel
