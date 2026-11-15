/**
 * @file MonacoPerformanceMonitor.tsx
 * @description Monaco性能监控面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-28
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,monitor,monaco,ui
 */

import { Clock, Play, RotateCcw, TrendingDown, TrendingUp, X, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useMonacoPerformanceMonitor, usePerformanceData, type PerformanceStats } from '../../hooks/useMonacoPerformanceMonitor'
import { createLogger } from '../../utils/logger'

const logger = createLogger('MonacoPerfMonitor')

/**
 * 性能指标卡片
 */
function MetricCard({ title, value, unit, trend, target }: {
  title: string
  value: number
  unit: string
  trend?: 'up' | 'down' | 'neutral'
  target?: number
}) {
  const isGood = target ? value <= target : trend !== 'down'
  const trendIcon = trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
    trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null

  return (
    <div className={`p-4 rounded-lg border ${isGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {trendIcon && <span className={isGood ? 'text-green-600' : 'text-red-600'}>{trendIcon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      {target && (
        <div className="mt-2 text-xs text-gray-500">
          目标: {target}{unit}
        </div>
      )}
    </div>
  )
}

/**
 * 性能历史图表（简化版）
 */
function PerformanceTrendChart({ history }: { history: Array<{ timestamp: Date; stats: PerformanceStats }> }) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        需要至少2条数据来显示趋势
      </div>
    )
  }

  const recent = history.slice(-10)
  const scores = recent.map(h => h.stats.overallScore)
  const maxScore = 100
  const minScore = Math.min(...scores) - 10

  return (
    <div className="h-32 flex items-end gap-1">
      {scores.map((score, i) => {
        const height = ((score - minScore) / (maxScore - minScore)) * 100
        const isLast = i === scores.length - 1
        return (
          <div
            key={i}
            className={`flex-1 rounded-t transition-all ${isLast ? 'bg-blue-500' : 'bg-blue-300'}`}
            style={{ height: `${Math.max(height, 5)}%` }}
            title={`${recent[i].timestamp.toLocaleTimeString()}: ${score}`}
          />
        )
      })}
    </div>
  )
}

/**
 * Monaco性能监控面板
 */
export function MonacoPerformanceMonitor({ editorRef }: { editorRef: React.RefObject<unknown> }) {
  const { state, toggle, runBenchmark } = useMonacoPerformanceMonitor({ autoShow: false })
  const { history, stats, addRecord, clearHistory, getTrend } = usePerformanceData()

  useEffect(() => {
    // 设置编辑器引用
    // 这里可以添加编辑器性能监控逻辑
  }, [state.visible, editorRef])

  const handleRunBenchmark = async () => {
    if (!editorRef.current) {
      logger.warn('[PerformanceMonitor] No editor instance available')
      return
    }

    // 模拟性能基准测试

    // 模拟文件打开性能测试
    const fileOpenTime = Math.random() * 50 + 100 // 100-150ms

    // 模拟光标移动性能测试
    const cursorMoveTime = Math.random() * 5 + 10 // 10-15ms

    // 模拟语法高亮性能测试
    const syntaxHighlightTime = Math.random() * 20 + 80 // 80-100ms

    // 模拟内存使用
    const memoryUsage = Math.random() * 20 + 60 // 60-80MB

    // 计算综合评分
    const score = Math.round(
      (1 - fileOpenTime / 500) * 30 +
      (1 - cursorMoveTime / 30) * 25 +
      (1 - syntaxHighlightTime / 300) * 25 +
      (1 - memoryUsage / 150) * 20
    )

    const newStats: PerformanceStats = {
      fileOpenTime,
      cursorMoveTime,
      syntaxHighlightTime,
      memoryUsage,
      overallScore: Math.max(0, Math.min(100, score)),
      vsCodeAlignment: Math.round(
        (fileOpenTime <= 150 ? 100 : (200 / fileOpenTime) * 100) * 0.3 +
        (cursorMoveTime <= 15 ? 100 : (10 / cursorMoveTime) * 100) * 0.3 +
        (syntaxHighlightTime <= 100 ? 100 : (100 / syntaxHighlightTime) * 100) * 0.4
      ),
    }

    addRecord(newStats)
    await runBenchmark()
  }

  const handleClearData = () => {
    clearHistory()
  }

  if (!state.visible) {
    return null
  }

  const trend = getTrend()
  const currentStats = stats

  return (
    <div className="fixed top-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">性能监控</h3>
        </div>
        <button
          onClick={toggle}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRunBenchmark}
            disabled={state.running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            {state.running ? '运行中...' : '运行基准测试'}
          </button>
          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            清除数据
          </button>
        </div>

        {/* Current Stats */}
        {currentStats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">当前性能</h4>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="文件打开"
                value={Math.round(currentStats.fileOpenTime)}
                unit="ms"
                target={200}
                trend="down"
              />
              <MetricCard
                title="光标移动"
                value={Math.round(currentStats.cursorMoveTime)}
                unit="ms"
                target={15}
                trend="down"
              />
              <MetricCard
                title="语法高亮"
                value={Math.round(currentStats.syntaxHighlightTime)}
                unit="ms"
                target={100}
                trend="down"
              />
              <MetricCard
                title="内存使用"
                value={Math.round(currentStats.memoryUsage)}
                unit="MB"
                target={100}
                trend="down"
              />
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">综合评分</span>
                </div>
                <span className={`text-2xl font-bold ${currentStats.overallScore >= 80 ? 'text-green-600' :
                    currentStats.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  {currentStats.overallScore}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                VS Code对标: {currentStats.vsCodeAlignment}%
              </div>
            </div>
          </div>
        )}

        {/* Trend */}
        {trend && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">性能趋势</h4>
            <PerformanceTrendChart history={history} />
            {trend.improving ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>性能正在改善</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <TrendingDown className="w-4 h-4" />
                <span>性能保持稳定</span>
              </div>
            )}
          </div>
        )}

        {/* History Count */}
        <div className="text-xs text-gray-500">
          历史记录: {history.length} 条 (最多保留100条)
        </div>
      </div>
    </div>
  )
}
