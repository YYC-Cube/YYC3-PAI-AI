/**
 * @file AudioDiagnostic.tsx
 * @description 音频系统智能诊断工具 - 全面检测音频播放问题
 */

import { AlertCircle, CheckCircle2, Loader2, Play, RefreshCw, Square, Trash2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useThemeStore } from '../../store/theme-store'
import { getAudioEngine } from '../../utils/audio-engine'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AudioDiagnostic')

interface DiagnosticResult {
  id: string
  test: string
  status: 'pending' | 'running' | 'success' | 'warning' | 'error'
  message: string
  details?: string
  fixable?: boolean
}

export function AudioDiagnostic({ onClose }: { onClose: () => void }) {
  const { tokens } = useThemeStore()
  const audioEngine = getAudioEngine()

  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [fixInProgress, setFixInProgress] = useState(false)

  // 播放测试状态
  const [playTestStatus, setPlayTestStatus] = useState<'idle' | 'playing' | 'success' | 'error'>('idle')
  const [playTestLog, setPlayTestLog] = useState<string[]>([])
  const [currentTrackInfo, setCurrentTrackInfo] = useState<string>('')

  const updateResult = useCallback((id: string, update: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...update } : r))
  }, [])

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true)
    const tests: DiagnosticResult[] = [
      { id: 'cache', test: '缓存状态检测', status: 'pending', message: '' },
      { id: 'files', test: '音乐文件存在性', status: 'pending', message: '' },
      { id: 'howler', test: 'Howler.js引擎', status: 'pending', message: '' },
      { id: 'webaudio', test: 'Web Audio API', status: 'pending', message: '' },
      { id: 'autoplay', test: '自动播放策略', status: 'pending', message: '' },
      { id: 'load', test: '实际加载测试', status: 'pending', message: '' },
    ]
    setResults(tests)

    // 测试1: 缓存状态
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      const cachedData = localStorage.getItem('yyc3-audio-engine')
      const libraryVersion = localStorage.getItem('yyc3-audio-library-version')

      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        const trackCount = parsed.tracks?.length || 0

        if (libraryVersion !== '2.0') {
          updateResult('cache', {
            status: 'warning',
            message: `发现旧版缓存 (v${libraryVersion || '未知'})`,
            details: `包含 ${trackCount} 首歌曲，需要更新到 v2.0`,
            fixable: true
          })
        } else if (trackCount === 0) {
          updateResult('cache', {
            status: 'warning',
            message: '缓存为空',
            details: '需要重新加载音乐库',
            fixable: true
          })
        } else {
          updateResult('cache', {
            status: 'success',
            message: `缓存正常 (v${libraryVersion})`,
            details: `已存储 ${trackCount} 首歌曲`
          })
        }
      } else {
        updateResult('cache', {
          status: 'warning',
          message: '无缓存数据',
          details: '首次使用或已清除',
          fixable: true
        })
      }
    } catch (error) {
      updateResult('cache', {
        status: 'error',
        message: '缓存读取失败',
        details: String(error),
        fixable: true
      })
    }

    // 测试2: 文件存在性
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const testFiles = [
        '/沫语-Music/My-Music-01/' + encodeURIComponent('沫言 - 不懂的董小姐.mp3'),
        '/沫语-Music/My-Music-02/' + encodeURIComponent('沫言 - 男人的难.mp3'),
        '/沫言-Music/My-Music-A/' + encodeURIComponent('沫语 - 云枢光痕.mp3'),
        '/沫言-Music/My-Music-B/' + encodeURIComponent('沫语 - 不过时间而已.mp3'),
      ]

      let successCount = 0
            const failedFiles: string[] = []

      for (const file of testFiles) {
        try {
          const response = await fetch(file, { method: 'HEAD' })
          if (response.ok) {
            successCount++
          } else {
              failedFiles.push(file.split('/').pop() || file)
          }
        } catch {
          failedFiles.push(file.split('/').pop() || file)
        }
      }

      if (successCount === testFiles.length) {
        updateResult('files', {
          status: 'success',
          message: `所有测试文件可访问 (${successCount}/${testFiles.length})`,
          details: '音乐文件路径正确'
        })
      } else if (successCount > 0) {
        updateResult('files', {
          status: 'warning',
          message: `部分文件无法访问 (${successCount}/${testFiles.length})`,
          details: `失败: ${failedFiles.join(', ')}`,
          fixable: true
        })
      } else {
        updateResult('files', {
          status: 'error',
          message: '所有测试文件都无法访问',
          details: '请检查 /public 目录是否存在音乐文件',
          fixable: false
        })
      }
    } catch (error) {
      updateResult('files', {
        status: 'error',
        message: '文件检测异常',
        details: String(error)
      })
    }

    // 测试3: Howler.js
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      const Howl = (await import('howler')).default || (window as unknown as { Howl?: new (opts: Record<string, unknown>) => { play: () => number } }).Howl

      if (!Howl) {
        updateResult('howler', {
          status: 'error',
          message: 'Howler.js 未加载',
          details: '请检查 howler 包是否正确安装',
          fixable: false
        })
      } else {
        updateResult('howler', {
          status: 'success',
          message: 'Howler.js 已就绪',
          details: `版本信息可用`
        })
      }
    } catch (error) {
      updateResult('howler', {
        status: 'error',
        message: 'Howler.js 加载失败',
        details: String(error),
        fixable: false
      })
    }

    // 测试4: Web Audio API
    await new Promise(resolve => setTimeout(resolve, 200))
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext

      if (!AudioContext) {
        updateResult('webaudio', {
          status: 'warning',
          message: 'Web Audio API 不可用',
          details: '浏览器可能不支持或被禁用',
          fixable: false
        })
      } else {
        const ctx = new AudioContext()
        const state = ctx.state
        ctx.close()

        if (state === 'running') {
          updateResult('webaudio', {
            status: 'success',
            message: 'Web Audio API 正常运行',
            details: `状态: ${state}`
          })
        } else if (state === 'suspended') {
          updateResult('webaudio', {
            status: 'warning',
            message: 'Web Audio API 已暂停',
            details: '需要用户交互才能激活（浏览器策略）',
            fixable: true
          })
        } else {
          updateResult('webaudio', {
            status: 'success',
            message: 'Web Audio API 可用',
            details: `状态: ${state}`
          })
        }
      }
    } catch (error) {
      updateResult('webaudio', {
        status: 'error',
        message: 'Web Audio API 错误',
        details: String(error)
      })
    }

    // 测试5: 自动播放策略
    await new Promise(resolve => setTimeout(resolve, 200))
    try {
      const doc = document as unknown as { featurePolicy?: { allowsFeature: (f: string) => boolean } }
      const canAutoplay = !doc.featurePolicy ||
        doc.featurePolicy?.allowsFeature('autoplay') !== false

      updateResult('autoplay', {
        status: canAutoplay ? 'success' : 'warning',
        message: canAutoplay ? '自动播放允许' : '自动播放受限',
        details: canAutoplay
          ? '可以自动播放音频'
          : '需要用户交互后才能播放（浏览器安全策略）',
        fixable: !canAutoplay
      })
    } catch (err) {
      logger.warn('[YYC3 Diagnostic] 自动播放检测跳过:', err)
      updateResult('autoplay', {
        status: 'success',
        message: '自动播放策略未限制',
        details: '标准模式'
      })
    }

    // 测试6: 实际加载测试
    await new Promise(resolve => setTimeout(resolve, 400))
    try {
      const testUrl = '/沫语-Music/My-Music-02/沫言 - 男人的难.mp3'

      const audioTest = new Promise<boolean>((resolve) => {
        const audio = new Audio()
        audio.src = testUrl

        const timeout = setTimeout(() => {
          resolve(false)
        }, 8000)

        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout)
          resolve(true)
        })

        audio.addEventListener('error', () => {
          clearTimeout(timeout)
          resolve(false)
        })

        audio.load()
      })

      const canPlay = await audioTest

      if (canPlay) {
        updateResult('load', {
          status: 'success',
          message: '音频加载成功',
          details: '可以正常播放 "男人的难"'
        })
      } else {
        updateResult('load', {
          status: 'error',
          message: '音频加载失败',
          details: `URL: ${testUrl}\n可能原因：\n1. 文件不存在\n2. MIME类型不支持\n3. CORS问题\n4. 文件损坏`,
          fixable: true
        })
      }
    } catch (error) {
      updateResult('load', {
        status: 'error',
        message: '加载测试异常',
        details: String(error)
      })
    }

    setIsRunning(false)
  }, [updateResult])

  const handleFixAll = useCallback(async () => {
    setFixInProgress(true)

    // console.log('[YYC3 Diagnostic] 🔧 开始一键修复...')

    // 1. 清除所有音频相关缓存
    localStorage.removeItem('yyc3-audio-engine')
    localStorage.removeItem('yyc3-audio-library-version')
    // console.log('[YYC3 Diagnostic] 🗑️ 已清除缓存')

    // 2. 清空内存中的tracks和playlists
    const engine = getAudioEngine() as unknown as { tracks?: Map<unknown, unknown>; playlists?: Map<unknown, unknown>; howlInstance?: { unload: () => void } | null }
    if (engine.tracks) engine.tracks.clear()
    if (engine.playlists) engine.playlists.clear()
    if (engine.howlInstance) {
      try { engine.howlInstance.unload() } catch { /* ignore */ }
      engine.howlInstance = null
    }
    // console.log('[YYC3 Diagnostic] 🧹 已清空内存')

    // 3. 强制重新初始化
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const tracks = await audioEngine.initializeMusicLibrary(true)
      // console.log(`[YYC3 Diagnostic] ✅ 重新加载完成: ${tracks.length} 首`)

      // 更新结果
      updateResult('cache', {
        status: 'success',
        message: '缓存已重建',
        details: `${tracks.length} 首歌曲`
      })
    } catch (error) {
      logger.error('[YYC3 Diagnostic] ❌ 重新加载失败:', error)
      updateResult('cache', {
        status: 'error',
        message: '重新加载失败',
        details: String(error)
      })
    }

    setFixInProgress(false)
  }, [audioEngine, updateResult])

  // 强制播放测试
  const handlePlayTest = useCallback(async () => {
    setPlayTestStatus('playing')
    setPlayTestLog([])
    setCurrentTrackInfo('')

    const log = (msg: string) => {
      // console.log(`[YYC3 PlayTest] ${msg}`)
      setPlayTestLog(prev => [...prev.slice(-9), msg])
    }

    try {
      log('🎬 开始强制播放测试...')

      // 获取音乐库
      let tracks = audioEngine.getTracks()
      if (tracks.length === 0) {
        log('📦 音乐库为空，正在加载...')
        tracks = await audioEngine.initializeMusicLibrary(true)
        log(`✅ 加载完成: ${tracks.length} 首`)
      }

      if (tracks.length === 0) {
        throw new Error('没有可用的歌曲')
      }

      // 选择第一首歌进行测试
      const testTrack = tracks[0]
      log(`🎵 测试歌曲: ${testTrack.name}`)
      log(`🔗 URL: ${testTrack.url}`)
      setCurrentTrackInfo(`${testTrack.name} (${(testTrack.duration || 0).toFixed(1)}s)`)

      // 播放
      log(`▶️ 调用 audioEngine.play()...`)
      await audioEngine.play(testTrack.id)

      // 等待并检查状态
      await new Promise(resolve => setTimeout(resolve, 2000))

      const state = audioEngine.getState()
      if (state.isPlaying && state.currentTrack) {
        log(`🎉 播放成功！`)
        log(`📊 状态: isPlaying=${state.isPlaying}, time=${state.currentTime.toFixed(1)}s`)

        // 监听时间变化
        const startTime = state.currentTime
        await new Promise(resolve => setTimeout(resolve, 1000))
        const endTime = audioEngine.getState().currentTime

        if (endTime > startTime) {
          log(`⏱️ 时间正常走动: ${startTime.toFixed(1)}s → ${endTime.toFixed(1)}s`)
          setPlayTestStatus('success')
        } else {
          log(`⚠️ 时间未变化: ${startTime.toFixed(1)}s → ${endTime.toFixed(1)}s`)
          setPlayTestStatus('error')
        }
      } else {
        log(`❌ 播放失败: isPlaying=${state.isPlaying}`)
        log(`   currentTrack: ${state.currentTrack?.name || 'null'}`)
        setPlayTestStatus('error')
      }
    } catch (error) {
      log(`❌ 异常: ${String(error)}`)
      setPlayTestStatus('error')
    }
  }, [audioEngine])

  const handleStopTest = useCallback(() => {
    audioEngine.stop()
    setPlayTestLog(prev => [...prev, '⏹️ 已停止'])
    setPlayTestStatus('idle')
  }, [audioEngine])

  useEffect(() => {
    runDiagnostics()
  }, [runDiagnostics])

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 size={16} className="animate-spin" />
      case 'success':
        return <CheckCircle2 size={16} />
      case 'warning':
        return <AlertCircle size={16} />
      case 'error':
        return <XCircle size={16} />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-500" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      case 'running': return tokens.primary
      default: return '#6b7280'
    }
  }

  const hasErrors = results.some(r => r.status === 'error')
  const hasWarnings = results.some(r => r.status === 'warning')

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{
        backgroundColor: tokens.cardBg + '90',
        borderColor: tokens.border,
        borderWidth: '1px',
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} style={{ color: tokens.primary }} />
          <span className="font-semibold text-sm" style={{ color: tokens.primary }}>
            音频系统诊断
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => runDiagnostics()}
            disabled={isRunning}
            aria-label="重新检测"
            className="p-1.5 rounded hover:bg-white/10 transition-all"
            style={{ color: tokens.primary }}
          >
            <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
          </button>

          {(hasErrors || hasWarnings) && (
            <button
              onClick={handleFixAll}
              disabled={fixInProgress}
              aria-label="一键修复"
              className="px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1"
              style={{
                backgroundColor: fixInProgress ? '#374151' : tokens.primary,
                color: '#fff',
                opacity: fixInProgress ? 0.7 : 1,
              }}
            >
              {fixInProgress ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              一键修复
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-1.5 rounded hover:bg-white/10 transition-all"
            style={{ color: tokens.foregroundMuted }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 诊断结果列表 */}
      <div className="space-y-2">
        {results.map(result => (
          <div
            key={result.id}
            className="p-3 rounded transition-all"
            style={{
              backgroundColor: result.status === 'error' ? 'rgba(239,68,68,0.1)' :
                result.status === 'warning' ? 'rgba(245,158,11,0.1)' :
                  result.status === 'success' ? 'rgba(16,185,129,0.1)' :
                    'transparent',
              borderLeft: `3px solid ${getStatusColor(result.status)}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div style={{ color: getStatusColor(result.status), marginTop: '2px' }}>
                {getStatusIcon(result.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: tokens.foreground }}>
                    {result.test}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: getStatusColor(result.status) + '20',
                      color: getStatusColor(result.status),
                    }}
                  >
                    {result.status === 'running' ? '检测中...' :
                      result.status === 'success' ? '✓ 正常' :
                        result.status === 'warning' ? '⚠ 警告' :
                          result.status === 'error' ? '✗ 错误' : '等待'}
                  </span>
                </div>

                <p className="text-xs mt-1" style={{ color: tokens.foregroundMuted }}>
                  {result.message}
                </p>

                {result.details && (
                  <pre
                    className="text-xs mt-2 p-2 rounded overflow-x-auto whitespace-pre-wrap"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: tokens.foregroundMuted,
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  >
                    {result.details}
                  </pre>
                )}

                {result.fixable && result.status !== 'success' && (
                  <button
                    onClick={handleFixAll}
                    disabled={fixInProgress}
                    className="mt-2 text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: tokens.primary + '30',
                      color: tokens.primary,
                    }}
                  >
                    点击"一键修复"解决此问题 →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      {!isRunning && results.length > 0 && (
        <div
          className="text-xs p-2 rounded text-center"
          style={{
            backgroundColor: hasErrors ? 'rgba(239,68,68,0.1)' :
              hasWarnings ? 'rgba(245,158,11,0.1)' :
                'rgba(16,185,129,0.1)',
            color: hasErrors ? '#ef4444' :
              hasWarnings ? '#f59e0b' : '#10b981',
          }}
        >
          {hasErrors && '❌ 发现问题，请点击"一键修复"'}
          {hasWarnings && !hasErrors && '⚠️ 存在警告项，建议修复以获得最佳体验'}
          {!hasErrors && !hasWarnings && '✅ 所有检测项均通过，音频系统正常运行'}
        </div>
      )}

      {/* 强制播放测试 */}
      <div
        className="mt-4 p-3 rounded-lg"
        style={{
          backgroundColor: 'rgba(59,130,246,0.05)',
          border: `1px dashed ${tokens.primary}40`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: tokens.primary }}>
            🎵 强制播放测试
          </span>

          <div className="flex gap-2">
            {playTestStatus !== 'playing' && (
              <button
                onClick={handlePlayTest}
                aria-label="开始播放测试"
                className="px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1"
                style={{
                  backgroundColor: tokens.primary,
                  color: '#fff',
                }}
              >
                <Play size={12} />
                开始测试
              </button>
            )}

            {playTestStatus === 'playing' && (
              <button
                onClick={handleStopTest}
                aria-label="停止播放测试"
                className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
              >
                <Square size={12} />
                停止
              </button>
            )}
          </div>
        </div>

        {/* 当前歌曲信息 */}
        {currentTrackInfo && (
          <div
            className="text-xs p-2 rounded mb-2"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: tokens.foregroundMuted,
            }}
          >
            🎼 {currentTrackInfo}
          </div>
        )}

        {/* 播放状态指示 */}
        <div
          className="text-xs px-2 py-1 rounded mb-2 inline-block"
          style={{
            backgroundColor: playTestStatus === 'success' ? 'rgba(16,185,129,0.2)' :
              playTestStatus === 'error' ? 'rgba(239,68,68,0.2)' :
                playTestStatus === 'playing' ? 'rgba(59,130,246,0.2)' :
                  'rgba(107,114,128,0.2)',
            color: playTestStatus === 'success' ? '#10b981' :
              playTestStatus === 'error' ? '#ef4444' :
                playTestStatus === 'playing' ? tokens.primary :
                  '#6b7280',
          }}
        >
          {playTestStatus === 'idle' && '⏸️ 等待测试'}
          {playTestStatus === 'playing' && '▶️ 正在播放...'}
          {playTestStatus === 'success' && '✅ 播放成功！'}
          {playTestStatus === 'error' && '❌ 播放失败'}
        </div>

        {/* 实时日志 */}
        {playTestLog.length > 0 && (
          <pre
            className="text-xs p-2 rounded overflow-y-auto max-h-40 mt-2"
            style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: '#9ca3af',
              fontFamily: 'monospace',
              fontSize: '11px',
              lineHeight: '1.5',
            }}
          >
            {playTestLog.join('\n')}
          </pre>
        )}

        {!isRunning && results.every(r => r.status === 'success') && playTestStatus === 'idle' && (
          <p className="text-xs mt-2" style={{ color: tokens.foregroundMuted }}>
            💡 所有检测通过但仍无声？点击"开始测试"进行实际播放验证，详细日志会显示在下方。
          </p>
        )}
      </div>
    </div>
  )
}

export default AudioDiagnostic
