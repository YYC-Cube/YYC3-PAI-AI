/**
 * @file MonacoPerformanceMonitor.tsx
 * @description Monaco Editor性能监控组件 - 集成性能基准测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @updated 2026-03-25
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags monaco,performance,monitor,ui,component
 */

import { Clock, Monitor, RefreshCw, X } from 'lucide-react'
import type * as monaco from 'monaco-editor'
import { useCallback, useState } from 'react'
import {
  getMonacoBenchmark,
  type PerformanceMetrics,
} from '../services/monaco-performance-benchmark'
import { useThemeStore } from '../store/theme-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('MonacoPerformanceMonitor')

interface MonacoPerformanceMonitorProps {
  editor?: monaco.editor.IStandaloneCodeEditor
  monaco?: typeof monaco
  visible: boolean
  onClose: () => void
}

export function MonacoPerformanceMonitor({ editor, monaco, visible, onClose }: MonacoPerformanceMonitorProps) {
  const { tokens: tk } = useThemeStore()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null)

  const benchmark = getMonacoBenchmark()

  const runBenchmark = useCallback(async () => {
    if (!editor || !monaco) {
      logger.warn('[MonacoPerformanceMonitor] Editor not initialized')
      return
    }

    setIsRunning(true)
    try {
      benchmark.setEditor(editor, monaco)
      const result = await benchmark.runFullSuite({
        iterations: 5,
      })
      setMetrics(result)
      setLastRunTime(new Date())
    } catch (error) {
      logger.error('[MonacoPerformanceMonitor] Benchmark failed:', error)
    } finally {
      setIsRunning(false)
    }
  }, [editor, monaco, benchmark])

  if (!visible) return null

  if (!metrics) {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ background: tk.background, zIndex: 9999 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.borderDim, background: tk.panelBg }}>
          <div className="flex items-center gap-2">
            <Monitor size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
              Monaco Editor 性能基准测试
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: tk.foregroundMuted }}>
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Monitor size={48} color={tk.foregroundMuted} style={{ opacity: 0.3 }} />
            <p style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foregroundMuted, marginTop: '16px' }}>
              暂无基准测试数据
            </p>
            <button
              onClick={runBenchmark}
              disabled={isRunning || !editor || !monaco}
              className="mt-4 px-4 py-2 rounded transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: tk.primary, color: tk.primaryForeground, fontFamily: tk.fontMono, fontSize: '11px' }}
            >
              {isRunning ? '运行测试中...' : '运行基准测试'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: tk.background, zIndex: 9999 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.borderDim, background: tk.panelBg }}>
        <div className="flex items-center gap-2">
          <Monitor size={16} color={tk.primary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
            Monaco Editor 性能基准测试
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRunTime && (
            <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>
              <Clock size={10} className="inline mr-1" />
              {lastRunTime.toLocaleTimeString()}
            </span>
          )}
          <button onClick={runBenchmark} disabled={isRunning} className="p-1.5 rounded" style={{ background: tk.primary + '20', color: tk.primary }}>
            <RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: tk.foregroundMuted }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg p-4 mb-4" style={{ background: tk.panelBg, border: `1px solid ${tk.borderDim}` }}>
          <div style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>综合评分</div>
          <div style={{ fontFamily: tk.fontMono, fontSize: '24px', fontWeight: 'bold', color: tk.primary }}>
            {metrics.overallScore.toFixed(1)}/100
          </div>
          <div style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
            VS Code 对标: {metrics.vsCodeScore.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
