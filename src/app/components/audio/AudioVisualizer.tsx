/**
 * @file AudioVisualizer.tsx
 * @description 音频波形可视化 - 实时频谱显示
 */

import { Activity } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getAudioEngine } from '../../utils/audio-engine'

interface AudioVisualizerProps {
  type?: 'bars' | 'wave' | 'circular'
  height?: number
  color?: string
  backgroundColor?: string
  showLabels?: boolean
  className?: string
}

export function AudioVisualizer({
  type = 'bars',
  height = 120,
  color = '#06b6d4',
  backgroundColor = 'transparent',
  showLabels = false,
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)

  const audioEngine = getAudioEngine()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1)
    canvas.height = height * (window.devicePixelRatio || 1)
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    let animationId: number

    const draw = () => {
      const frequencyData = audioEngine.getFrequencyData()
      const timeDomainData = audioEngine.getTimeDomainData()

      ctx.clearRect(0, 0, canvas.offsetWidth, height)

      if (!frequencyData && !timeDomainData) {
        drawIdleState(ctx, canvas.offsetWidth, height)
        setIsActive(false)
        animationId = requestAnimationFrame(draw)
        return
      }

      setIsActive(true)

      switch (type) {
        case 'bars':
          drawBars(ctx, frequencyData!, canvas.offsetWidth, height, color)
          break
        case 'wave':
          drawWave(ctx, timeDomainData!, canvas.offsetWidth, height, color)
          break
        case 'circular':
          drawCircular(ctx, frequencyData!, canvas.offsetWidth, height, color)
          break
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- audioEngine 为模块级单例（非响应式），函数为稳定引用——入依赖仅致无谓重建
  }, [type, height, color, backgroundColor])

  const drawIdleState = (
    ctx: CanvasRenderingContext2D,
    width: number,
    _height: number
  ) => {
    const barCount = 32
    const barWidth = width / barCount - 2
    const maxBarHeight = _height * 0.3

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 2) + 1
      const barHeight = Math.random() * maxBarHeight * 0.3 + 2

      ctx.fillStyle = color + '30'
      ctx.fillRect(x, (_height - barHeight) / 2, barWidth, barHeight)
    }
  }

  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    _height: number,
    barColor: string
  ) => {
    const barCount = data.length
    const barWidth = width / barCount - 1
    const maxBarHeight = _height - 10

    for (let i = 0; i < barCount; i++) {
      const value = data[i]
      const percent = value / 255
      const barHeight = Math.max(2, percent * maxBarHeight)

      const x = i * (barWidth + 1)
      const y = _height - barHeight - 5

      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y)
      gradient.addColorStop(0, barColor + '60')
      gradient.addColorStop(0.5, barColor + 'aa')
      gradient.addColorStop(1, barColor)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 2)
      ctx.fill()

      if (percent > 0.8) {
        ctx.fillStyle = '#ffffff40'
        ctx.fillRect(x, y, barWidth, 2)
      }
    }
  }

  const drawWave = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    _height: number,
    waveColor: string
  ) => {
    ctx.lineWidth = 2
    ctx.strokeStyle = waveColor
    ctx.beginPath()

    const sliceWidth = width / data.length
    let x = 0

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0
      const y = (v * _height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(width, _height / 2)
    ctx.stroke()

    ctx.fillStyle = waveColor + '15'
    ctx.lineTo(width, _height)
    ctx.lineTo(0, _height)
    ctx.closePath()
    ctx.fill()
  }

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    _height: number,
    circleColor: string
  ) => {
    const centerX = width / 2
    const centerY = _height / 2
    const radius = Math.min(width, _height) / 3
    const barCount = data.length

    for (let i = 0; i < barCount; i++) {
      const value = data[i]
      const percent = value / 255

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
      const innerRadius = radius * 0.7
      const outerRadius = radius + percent * radius * 0.5

      const x1 = centerX + Math.cos(angle) * innerRadius
      const y1 = centerY + Math.sin(angle) * innerRadius
      const x2 = centerX + Math.cos(angle) * outerRadius
      const y2 = centerY + Math.sin(angle) * outerRadius

      const hue = (i / barCount) * 60 + 180
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.5 + percent * 0.5})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2)
    ctx.strokeStyle = circleColor + '40'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  return (
    <div className={`audio-visualizer ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          style={{ height: `${height}px`, backgroundColor }}
        />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Activity size={24} className={color.replace('#', 'text-') + '/30'} />
          </div>
        )}

        {showLabels && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs" style={{ color }}>
            <span>0 Hz</span>
            <span>{isActive ? '● LIVE' : '○ IDLE'}</span>
            <span>20 kHz</span>
          </div>
        )}
      </div>

      {/* 可视化类型切换器 */}
      <div className="flex gap-1 mt-2">
        {(['bars', 'wave', 'circular'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {}}
            aria-label={`${t} 模式`}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              type === t ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800/50 text-gray-500 hover:text-gray-400'
            }`}
          >
            {t === 'bars' ? '柱状' : t === 'wave' ? '波形' : '圆形'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AudioVisualizer
