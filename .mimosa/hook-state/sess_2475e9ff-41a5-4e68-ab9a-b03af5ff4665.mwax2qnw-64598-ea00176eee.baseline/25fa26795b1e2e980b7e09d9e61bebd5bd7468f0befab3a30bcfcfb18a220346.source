/**
 * @file AudioPlaylist.tsx
 * @description 播放列表管理组件
 */

import {
    Clock,
    GripVertical,
    ListMusic,
    Music2,
    Pause,
    Play,
    Plus,
    Repeat,
    Repeat1,
    Scissors,
    Shuffle,
    SkipBack,
    SkipForward,
    Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { getAudioEngine, type AudioTrack, type Playlist } from '../../utils/audio-engine'

interface AudioPlaylistProps {
  playlist?: Playlist | null
  onTrackSelect?: (track: AudioTrack) => void
  onTrackEdit?: (track: AudioTrack) => void
  className?: string
}

export function AudioPlaylist({ playlist, onTrackSelect, onTrackEdit, className = '' }: AudioPlaylistProps) {
  const audioEngine = getAudioEngine()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)
  const [shuffle, setShuffle] = useState(playlist?.shuffle ?? false)
  const [repeat, setRepeat] = useState<Playlist['repeat']>(playlist?.repeat ?? 'off')
  const [showAddTracks, setShowAddTracks] = useState(false)

  const allTracks = audioEngine.getTracks()
  const displayTracks = playlist?.tracks ?? allTracks

  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause()
      setIsPlaying(false)
    } else if (currentTrackId) {
      audioEngine.play(currentTrackId)
      setIsPlaying(true)
    } else if (displayTracks.length > 0) {
      audioEngine.play(displayTracks[0].id)
      setCurrentTrackId(displayTracks[0].id)
      setIsPlaying(true)
    }
  }

  const handlePlayTrack = (track: AudioTrack) => {
    if (currentTrackId === track.id && isPlaying) {
      audioEngine.pause()
      setIsPlaying(false)
    } else {
      audioEngine.play(track.id)
      setCurrentTrackId(track.id)
      setIsPlaying(true)
    }
    onTrackSelect?.(track)
  }

  const handleNext = () => {
    if (!currentTrackId) return

    const currentIndex = displayTracks.findIndex((t) => t.id === currentTrackId)
    if (currentIndex < displayTracks.length - 1) {
      const nextTrack = displayTracks[currentIndex + 1]
      audioEngine.play(nextTrack.id)
      setCurrentTrackId(nextTrack.id)
    } else if (repeat === 'all' && displayTracks.length > 0) {
      audioEngine.play(displayTracks[0].id)
      setCurrentTrackId(displayTracks[0].id)
    }
  }

  const handlePrevious = () => {
    if (!currentTrackId) return

    const currentIndex = displayTracks.findIndex((t) => t.id === currentTrackId)
    if (currentIndex > 0) {
      const prevTrack = displayTracks[currentIndex - 1]
      audioEngine.play(prevTrack.id)
      setCurrentTrackId(prevTrack.id)
    }
  }

  const handleToggleShuffle = () => {
    const newShuffle = !shuffle
    setShuffle(newShuffle)
    audioEngine.setShuffle(newShuffle)
  }

  const handleToggleRepeat = () => {
    const modes: Playlist['repeat'][] = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeat)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setRepeat(nextMode)
    audioEngine.setRepeat(nextMode)
  }

  const handleRemoveFromPlaylist = (index: number) => {
    if (playlist) {
      audioEngine.removeFromPlaylist(playlist.id, index)
    } else {
      const track = displayTracks[index]
      if (track) {
        audioEngine.deleteTrack(track.id)
      }
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat

  return (
    <div className={`audio-playlist ${className}`}>
      {/* 控制栏 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevious} aria-label="上一曲" className="p-2 hover:bg-gray-700 rounded-full">
            <SkipBack size={18} className="text-gray-300" />
          </button>
          <button
            onClick={handlePlayPause}
            aria-label={isPlaying ? '暂停' : '播放'}
            className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-full"
          >
            {isPlaying ? (
              <Pause size={20} className="text-black" />
            ) : (
              <Play size={20} className="text-black ml-0.5" />
            )}
          </button>
          <button onClick={handleNext} aria-label="下一曲" className="p-2 hover:bg-gray-700 rounded-full">
            <SkipForward size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleShuffle}
            aria-label={`随机播放: ${shuffle ? '开' : '关'}`}
            className={`p-2 rounded ${shuffle ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-gray-700 text-gray-400'}`}
          >
            <Shuffle size={16} />
          </button>
          <button
            onClick={handleToggleRepeat}
            aria-label={`循环模式: ${repeat}`}
            className={`p-2 rounded ${repeat !== 'off' ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-gray-700 text-gray-400'}`}
          >
            <RepeatIcon size={16} />
          </button>
        </div>
      </div>

      {/* 播放列表标题 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <ListMusic size={16} className="text-cyan-400" />
          {playlist?.name ?? '我的音乐'}
          <span className="text-xs text-gray-500">({displayTracks.length})</span>
        </h3>
        <button
          onClick={() => setShowAddTracks(!showAddTracks)}
          aria-label="添加曲目"
          className="p-1.5 hover:bg-gray-700 rounded"
        >
          <Plus size={16} className="text-gray-400" />
        </button>
      </div>

      {/* 添加曲目面板 */}
      {showAddTracks && (
        <div className="mb-4 p-3 bg-gray-800/30 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
          <p className="text-xs text-gray-400 mb-2">点击添加到播放列表</p>
          <div className="space-y-1">
            {allTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => {
                  if (playlist) {
                    audioEngine.addToPlaylist(playlist.id, track.id)
                  }
                }}
                disabled={playlist?.tracks.some((t) => t.id === track.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Music2 size={14} className="text-gray-500" />
                <span className="flex-1 text-xs text-gray-300 truncate">{track.name}</span>
                <span className="text-xs text-gray-500">{formatDuration(track.duration)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 曲目列表 */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {displayTracks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ListMusic size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无音乐</p>
            <p className="text-xs mt-1">上传音频文件开始播放</p>
          </div>
        ) : (
          displayTracks.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                currentTrackId === track.id
                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                  : 'hover:bg-gray-800/50'
              }`}
              onClick={() => handlePlayTrack(track)}
            >
              <GripVertical size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab" />

              <span className="w-6 text-xs text-gray-500 text-center">{index + 1}</span>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayTrack(track)
                }}
                aria-label={currentTrackId === track.id && isPlaying ? '暂停' : '播放'}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {currentTrackId === track.id && isPlaying ? (
                  <Pause size={14} className="text-cyan-400" />
                ) : (
                  <Play size={14} className="text-gray-400 ml-0.5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    currentTrackId === track.id ? 'text-cyan-400 font-medium' : 'text-gray-200'
                  }`}
                >
                  {track.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{track.metadata?.artist ?? '未知艺术家'}</p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTrackEdit?.(track)
                  }}
                  aria-label="编辑"
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Scissors size={12} className="text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFromPlaylist(index)
                  }}
                  aria-label="移除"
                  className="p-1 hover:bg-red-900/50 rounded"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>

              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {formatDuration(track.duration)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AudioPlaylist
