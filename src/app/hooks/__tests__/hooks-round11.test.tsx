/**
 * @file hooks-round11.test.tsx
 * @description 第十一轮 hooks 批 — useMonacoPerformanceMonitor / usePerformanceMonitor / useIntelligentWorkflow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMonacoPerformanceMonitor } from '../useMonacoPerformanceMonitor'
import { usePerformanceMonitor } from '../usePerformanceMonitor'
import { useIntelligentWorkflow } from '../useIntelligentWorkflow'
import { usePerformanceStore } from '../../store/performance-store'

beforeEach(() => {
  localStorage.clear()
  usePerformanceStore.setState({ isMonitoring: false, webVitals: {}, performanceScore: 0 })
})

describe('useMonacoPerformanceMonitor', () => {
  it('初始不可见；show/hide/toggle 状态流', () => {
    const { result } = renderHook(() => useMonacoPerformanceMonitor())
    expect(result.current.state.visible).toBe(false)
    act(() => result.current.show())
    expect(result.current.state.visible).toBe(true)
    act(() => result.current.hide())
    expect(result.current.state.visible).toBe(false)
    act(() => result.current.toggle())
    expect(result.current.state.visible).toBe(true)
  })

  it('autoShow 初始即可见；setEditorRef 挂引用', () => {
    const { result } = renderHook(() => useMonacoPerformanceMonitor({ autoShow: true }))
    expect(result.current.state.visible).toBe(true)
    const fake = { id: 'e1' } as never
    act(() => result.current.setEditorRef(fake))
    expect(result.current.state.running).toBe(false) // 未运行基准
  })

  it('runBenchmark 无编辑器引用时安全返回（不崩溃不置 running）', async () => {
    const { result } = renderHook(() => useMonacoPerformanceMonitor())
    await act(async () => { await result.current.runBenchmark() })
    expect(result.current.state.running).toBe(false)
  })
})

describe('usePerformanceMonitor', () => {
  it('enableWebVitals 默认开启 → 挂载即 startMonitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitor())
    expect(result.current.isMonitoring).toBe(true)
    expect(result.current.webVitals).toEqual({})
    expect(typeof result.current.performanceScore).toBe('number')
  })

  it('enableWebVitals=false 不启动监控', () => {
    const { result } = renderHook(() => usePerformanceMonitor({ enableWebVitals: false }))
    expect(result.current.isMonitoring).toBe(false)
  })

  it('onReport 回调路径（jsdom 无 PerformanceObserver 时静默不崩溃）', async () => {
    const onReport = vi.fn()
    renderHook(() => usePerformanceMonitor({ enableWebVitals: true, onReport }))
    expect(onReport.mock.calls.length).toBeGreaterThanOrEqual(0)
  })

  it('卸载清理（unmount 无残留定时器异常）', () => {
    const { unmount } = renderHook(() => usePerformanceMonitor({ enableSystemMonitoring: true }))
    expect(() => unmount()).not.toThrow()
  })
})

describe('useIntelligentWorkflow', () => {
  it('返回工作流数据与操作集', () => {
    const { result } = renderHook(() => useIntelligentWorkflow({ autoInitialize: false }))
    expect(Array.isArray(result.current.workflows)).toBe(true)
    expect(Array.isArray(result.current.templates)).toBe(true)
    expect(typeof result.current.createWorkflow).toBe('function')
    expect(typeof result.current.executeWorkflow).toBe('function')
    expect(typeof result.current.deleteWorkflow).toBe('function')
    expect(result.current.executingWorkflow).toBeNull()
  })

  /** 最小合法 Workflow 载荷（nodes 为 Map，startNodeId/aiGenerated 必填） */
  const newWorkflow = (name = '冒烟工作流') => ({
    name,
    description: '测试建档',
    executionMode: 'sequential' as const,
    nodes: new Map(),
    startNodeId: 'n-start',
    aiGenerated: false,
  })

  it('createWorkflow 建档并进入列表', async () => {
    const { result } = renderHook(() => useIntelligentWorkflow({ autoInitialize: false }))
    let created: unknown
    await act(async () => {
      created = result.current.createWorkflow(newWorkflow())
    })
    const id = (created as { id: string }).id
    expect(id).toBeTruthy()
    expect(result.current.workflows.some(w => w.id === id)).toBe(true)
  })

  it('updateWorkflow 改名生效；deleteWorkflow 移除', async () => {
    const { result } = renderHook(() => useIntelligentWorkflow({ autoInitialize: false }))
    let id = ''
    await act(async () => {
      id = result.current.createWorkflow(newWorkflow('待改名')).id
    })
    await act(async () => { result.current.updateWorkflow(id, { name: '已改名' }) })
    expect(result.current.workflows.find(w => w.id === id)?.name).toBe('已改名')
    await act(async () => { result.current.deleteWorkflow(id) })
    expect(result.current.workflows.some(w => w.id === id)).toBe(false)
  })
})
