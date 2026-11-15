/**
 * @file AudioEditor.tsx
 * @description 音频剪辑编辑器 - 裁剪、淡入淡出、音量调节
 */

import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Volume2,
  X
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioEngine, type AudioTrack, type EditedAudio } from '../../utils/audio-engine'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AudioEditor')

interface AudioEditorProps {
  track: AudioTrack
  onSave?: (edited: EditedAudio) => void
  onCancel?: () => void
  className?: string
}

export function AudioEditor({ track, onSave, onCancel, className = '' }: AudioEditorProps) {
  const audioEngine = getAudioEngine()
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(track.duration)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(track.duration)
  const [volume, setVolume] = useState(100)
  const [fadeIn, setFadeIn] = useState(0)
  const [fadeOut, setFadeOut] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)

  useEffect(() => {
    generateWaveform()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [track.url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const generateWaveform = async () => {
    try {
      const audioContext = new AudioContext()
      const response = await fetch(track.url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const rawData = audioBuffer.getChannelData(0)
      const samples = 200
      const blockSize = Math.floor(rawData.length / samples)
      const filteredData: number[] = []

      for (let i = 0; i < samples; i++) {
        let sum = 0
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j])
        }
        filteredData.push(sum / blockSize)
      }

      setWaveformData(filteredData)
      drawWaveform(filteredData)
      audioContext.close()
    } catch {
      logger.warn('[YYC3 Audio] Failed to generate waveform')
    }
  }

  const drawWaveform = (data: number[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barWidth = width / data.length
    const maxVal = Math.max(...data)

    ctx.clearRect(0, 0, width, height)

    data.forEach((value, index) => {
      const barHeight = (value / maxVal) * height * 0.8
      const x = index * barWidth
      const y = (height - barHeight) / 2

      const isInRange = (index / data.length) >= startTime / duration && (index / data.length) <= endTime / duration

      ctx.fillStyle = isInRange ? '#06b6d4' : '#374151'
      ctx.fillRect(x + 1, y, barWidth - 2, barHeight)
    })
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.currentTime = startTime
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    const audio = audioRef.current

    if (audio) {
      audio.currentTime = Math.max(startTime, Math.min(endTime, time))
      setCurrentTime(audio.currentTime)
    }
  }

  const handleMouseDownStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingStart(true)
  }, [])

  const handleMouseDownEnd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingEnd(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingStart && !isDraggingEnd) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = (x / rect.width) * duration

      if (isDraggingStart) {
        setStartTime(Math.max(0, Math.min(time, endTime - 1)))
      } else if (isDraggingEnd) {
        setEndTime(Math.max(startTime + 1, Math.min(time, duration)))
      }
    }

    const handleMouseUp = () => {
      setIsDraggingStart(false)
      setIsDraggingEnd(false)
    }

    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingStart, isDraggingEnd, duration, startTime, endTime])

  useEffect(() => {
    drawWaveform(waveformData)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [startTime, endTime, waveformData])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSave = () => {
    const edited = audioEngine.createEditedVersion(track.id, {
      startTime,
      endTime,
      volume,
      fadeIn,
      fadeOut,
    })

    if (edited) {
      onSave?.(edited)
    }
  }

  const handleReset = () => {
    setStartTime(0)
    setEndTime(duration)
    setVolume(100)
    setFadeIn(0)
    setFadeOut(0)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const selectionStartPercent = duration > 0 ? (startTime / duration) * 100 : 0
  const selectionEndPercent = duration > 0 ? (endTime / duration) * 100 : 100

  return (
    <div className={`audio-editor ${className}`}>
      <audio ref={audioRef} src={track.url} preload="metadata" />

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-200">{track.name}</h3>
        <div className="flex gap-2">
          <button onClick={handleReset} aria-label="重置" className="p-1.5 hover:bg-gray-700 rounded">
            <RotateCcw size={16} className="text-gray-400" />
          </button>
          {onCancel && (
            <button onClick={onCancel} aria-label="取消" className="p-1.5 hover:bg-gray-700 rounded">
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 波形显示 */}
      <div className="relative bg-gray-900 rounded-lg p-4 mb-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          className="w-full h-[120px] cursor-pointer"
          onClick={handleSeek}
        />

        {/* 选择区域 */}
        <div className="absolute top-4 left-4 right-4 h-[120px] pointer-events-none">
          <div
            className="absolute top-0 bottom-0 border-l-2 border-cyan-400 cursor-ew-resize pointer-events-auto"
            style={{ left: `${selectionStartPercent}%` }}
            onMouseDown={handleMouseDownStart}
          >
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-cyan-400 rounded" />
          </div>
          <div
            className="absolute top-0 bottom-0 border-r-2 border-cyan-400 cursor-ew-resize pointer-events-auto"
            style={{ left: `${selectionEndPercent}%` }}
            onMouseDown={handleMouseDownEnd}
          >
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-cyan-400 rounded" />
          </div>

          {/* 播放位置 */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 时间轴 */}
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>{formatTime(startTime)}</span>
        <span className="text-cyan-400">选中: {formatTime(endTime - startTime)}</span>
        <span>{formatTime(endTime)}</span>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? '暂停' : '播放'}
          className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-full transition-colors"
        >
          {isPlaying ? <Pause size={20} className="text-black" /> : <Play size={20} className="text-black ml-0.5" />}
        </button>

        <div className="flex-1">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <span className="text-xs text-gray-400 min-w-[80px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* 编辑控制 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 开始时间 */}
        <div>
          <label htmlFor="audio-start-time" className="block text-xs text-gray-400 mb-1.5">开始时间</label>
          <input
            id="audio-start-time"
            type="range"
            min={0}
            max={endTime - 0.1}
            step={0.1}
            value={startTime}
            onChange={(e) => setStartTime(parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <span className="text-xs text-gray-500">{formatTime(startTime)}</span>
        </div>

        {/* 结束时间 */}
        <div>
          <label htmlFor="audio-end-time" className="block text-xs text-gray-400 mb-1.5">结束时间</label>
          <input
            id="audio-end-time"
            type="range"
            min={startTime + 0.1}
            max={duration}
            step={0.1}
            value={endTime}
            onChange={(e) => setEndTime(parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <span className="text-xs text-gray-500">{formatTime(endTime)}</span>
        </div>

        {/* 音量 */}
        <div>
          <label htmlFor="audio-volume" className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1">
            <Volume2 size={12} /> 音量
          </label>
          <input
            id="audio-volume"
            type="range"
            min={0}
            max={150}
            step={1}
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <span className="text-xs text-gray-500">{volume}%</span>
        </div>

        {/* 淡入淡出 */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">淡入 / 淡出 (秒)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={fadeIn}
              onChange={(e) => setFadeIn(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
              placeholder="淡入"
            />
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={fadeOut}
              onChange={(e) => setFadeOut(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
              placeholder="淡出"
            />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          aria-label="保存编辑版本"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
        >
          <Check size={16} />
          保存编辑版本
        </button>

        <button
          onClick={() => audioEngine.deleteTrack(track.id)}
          aria-label="删除原始文件"
          className="px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default AudioEditor
