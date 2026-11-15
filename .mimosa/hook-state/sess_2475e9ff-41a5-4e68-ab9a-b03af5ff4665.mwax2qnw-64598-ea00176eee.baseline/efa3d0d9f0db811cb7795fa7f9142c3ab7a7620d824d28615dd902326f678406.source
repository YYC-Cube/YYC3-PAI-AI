/**
 * @file useMonacoPerformanceMonitor.ts
 * @description Monaco性能监控Hook，集成MonacoPerformanceMonitor到IDE
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-26
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hook,performance,monitor,monaco
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MonacoEditorInstance } from '../types/monaco'
import { createLogger } from '../utils/logger'

const logger = createLogger('monaco-performance-monitor')

/**
 * 监控状态
 */
export interface MonitorState {
  /** 是否可见 */
  visible: boolean
  /** 是否正在运行测试 */
  running: boolean
  /** 最后运行时间 */
  lastRunTime?: Date
}

/**
 * 性能监控Hook配置
 */
export interface UseMonacoPerformanceMonitorConfig {
  /** 是否自动显示 */
  autoShow?: boolean
  /** 快捷键 */
  shortcut?: string
}

/**
 * Monaco性能监控Hook
 *
 * 将MonacoPerformanceMonitor集成到IDE，提供快捷键控制和自动化监控
 *
 * @param config - 配置选项
 * @returns 监控状态和控制方法
 *
 * @example
 * ```tsx
 * const { visible, toggle, runBenchmark } = useMonacoPerformanceMonitor({
 *   autoShow: false,
 *   shortcut: 'mod+shift+p',
 * })
 *
 * return (
 *   <>
 *     {visible && <MonacoPerformanceMonitor editorRef={editorRef} />}
 *     <button onClick={toggle}>Toggle Monitor</button>
 *   </>
 * )
 * ```
 */
export function useMonacoPerformanceMonitor(
  config: UseMonacoPerformanceMonitorConfig = {},
) {
  const { autoShow = false, shortcut } = config

  const [state, setState] = useState<MonitorState>({
    visible: autoShow,
    running: false,
    lastRunTime: undefined,
  })

  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const runTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 切换可见性
  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, visible: !prev.visible }))
  }, [])

  // 显示监控面板
  const show = useCallback(() => {
    setState((prev) => ({ ...prev, visible: true }))
  }, [])

  // 隐藏监控面板
  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  // 设置编辑器引用
  const setEditorRef = useCallback((editor: MonacoEditorInstance | null) => {
    editorRef.current = editor
  }, [])

  // 运行基准测试
  const runBenchmark = useCallback(async () => {
    if (!editorRef.current) {
      logger.warn('[Monitor] No editor instance available')
      return
    }

    setState((prev) => ({ ...prev, running: true }))

    try {
      // 这里应该调用实际的基准测试
      // 暂时使用setTimeout模拟
      await new Promise((resolve) => {
        runTimeoutRef.current = setTimeout(resolve, 2000)
      })

      setState((prev) => ({
        ...prev,
        running: false,
        lastRunTime: new Date(),
      }))

      logger.info('Benchmark completed')
    } catch (error) {
      logger.error('[Monitor] Benchmark failed:', error)
      setState((prev) => ({ ...prev, running: false }))
    }
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (runTimeoutRef.current) {
        clearTimeout(runTimeoutRef.current)
      }
    }
  }, [])

  // 自动监控（每5分钟运行一次）
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.visible && !state.running) {
        runBenchmark()
      }
    }, 5 * 60 * 1000) // 5分钟

    return () => clearInterval(interval)
  }, [state.visible, state.running, runBenchmark])

  return {
    /** 监控状态 */
    state,
    /** 切换可见性 */
    toggle,
    /** 显示监控面板 */
    show,
    /** 隐藏监控面板 */
    hide,
    /** 设置编辑器引用 */
    setEditorRef,
    /** 运行基准测试 */
    runBenchmark,
    /** 快捷键 */
    shortcut,
  }
}

/**
 * 性能监控快捷键配置
 */
export const PERFORMANCE_SHORTCUTS = [
  {
    keys: 'mod+shift+p',
    description: 'Toggle Performance Monitor',
    action: 'togglePerformanceMonitor',
  },
  {
    keys: 'mod+shift+r',
    description: 'Run Performance Benchmark',
    action: 'runBenchmark',
  },
  {
    keys: 'mod+shift+c',
    description: 'Clear Performance Data',
    action: 'clearData',
  },
]

/**
 * 获取性能监控快捷键绑定
 */
export function getPerformanceShortcuts(
  toggle: () => void,
  runBenchmark: () => void,
  clearData: () => void,
) {
  return [
    {
      keys: 'mod+shift+p',
      action: toggle,
      preventDefault: true,
    },
    {
      keys: 'mod+shift+r',
      action: runBenchmark,
      preventDefault: true,
    },
    {
      keys: 'mod+shift+c',
      action: clearData,
      preventDefault: true,
    },
  ]
}

/**
 * 性能统计类型
 */
export interface PerformanceStats {
  /** 文件打开时间（毫秒） */
  fileOpenTime: number
  /** 光标移动时间（毫秒） */
  cursorMoveTime: number
  /** 语法高亮时间（毫秒） */
  syntaxHighlightTime: number
  /** 内存使用（MB） */
  memoryUsage: number
  /** 综合评分（0-100） */
  overallScore: number
  /** VS Code对标（%） */
  vsCodeAlignment: number
}

/**
 * 性能历史记录
 */
export interface PerformanceHistory {
  /** 时间戳 */
  timestamp: Date
  /** 性能统计 */
  stats: PerformanceStats
}

/**
 * 性能监控数据Hook
 *
 * 管理性能监控数据和历史记录
 */
export function usePerformanceData() {
  const [history, setHistory] = useState<PerformanceHistory[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)

  // 添加性能记录
  const addRecord = useCallback((newStats: PerformanceStats) => {
    const record: PerformanceHistory = {
      timestamp: new Date(),
      stats: newStats,
    }

    setHistory((prev) => [...prev, record].slice(-100)) // 保留最近100条记录
    setStats(newStats)
  }, [])

  // 清除历史记录
  const clearHistory = useCallback(() => {
    setHistory([])
    setStats(null)
  }, [])

  // 获取性能趋势
  const getTrend = useCallback(() => {
    if (history.length < 2) return null

    const recent = history.slice(-10)
    const avgScore = recent.reduce((sum, r) => sum + r.stats.overallScore, 0) / recent.length

    return {
      average: avgScore,
      improving: recent[recent.length - 1].stats.overallScore > recent[0].stats.overallScore,
      samples: recent.length,
    }
  }, [history])

  return {
    history,
    stats,
    addRecord,
    clearHistory,
    getTrend,
  }
}
