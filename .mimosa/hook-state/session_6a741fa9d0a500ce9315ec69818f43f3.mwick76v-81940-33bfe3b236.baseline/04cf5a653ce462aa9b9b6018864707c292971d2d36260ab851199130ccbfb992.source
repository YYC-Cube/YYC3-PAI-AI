/**
 * @file MonacoPerformanceMonitor.deep.test.tsx
 * @description 性能监控面板（performance/）深化 — mock useMonacoPerformanceMonitor/usePerformanceData 后测交互深度：
 * 可见性门控/基准运行链路（无编辑器守卫→addRecord→runBenchmark）/running 禁用/清除数据/趋势图与改善文案/指标卡与评分分区
 *
 * 注：与 src/app/components/__tests__/MonacoPerformanceMonitor.test.tsx（components 根目录同名组件）互不相干，旧文件未改动。
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  hookState: {
    state: { visible: true, running: false },
    toggle: vi.fn(),
    runBenchmark: vi.fn(),
  },
  data: {
    history: [] as Array<{ timestamp: Date; stats: import('../../../hooks/useMonacoPerformanceMonitor').PerformanceStats }>,
    stats: null as import('../../../hooks/useMonacoPerformanceMonitor').PerformanceStats | null,
    addRecord: vi.fn(),
    clearHistory: vi.fn(),
    getTrend: vi.fn<() => { average: number; improving: boolean; samples: number } | null>(() => null),
  },
}))

vi.mock('../../../hooks/useMonacoPerformanceMonitor', () => ({
  useMonacoPerformanceMonitor: () => h.hookState,
  usePerformanceData: () => h.data,
}))

import { MonacoPerformanceMonitor } from '../MonacoPerformanceMonitor'
import type { PerformanceStats } from '../../../hooks/useMonacoPerformanceMonitor'

const editorRef = { current: { id: 'editor' } } as React.RefObject<unknown>

const statsOf = (overallScore: number): PerformanceStats => ({
  fileOpenTime: 120, cursorMoveTime: 12, syntaxHighlightTime: 90, memoryUsage: 70,
  overallScore, vsCodeAlignment: 92,
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.hookState.state = { visible: true, running: false }
  h.data.history = []
  h.data.stats = null
  h.data.getTrend.mockReturnValue(null)
  h.hookState.runBenchmark.mockResolvedValue(undefined)
})

describe('MonacoPerformanceMonitor（性能监控面板深化）', () => {
  it('state.visible=false → 返回 null（不渲染面板）', () => {
    h.hookState.state = { visible: false, running: false }
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('visible=true → 渲染头部（标题/关闭）与操作区（运行基准/清除数据）', () => {
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(container.textContent).toContain('性能监控')
    expect(container.textContent).toContain('运行基准测试')
    expect(container.textContent).toContain('清除数据')
    expect(container.textContent).toContain('历史记录')
  })

  it('有编辑器引用：运行基准 → addRecord 写入指标 + runBenchmark 链路被 await', async () => {
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('运行基准'))!)
    await waitFor(() => expect(h.data.addRecord).toHaveBeenCalledTimes(1))
    const recorded = h.data.addRecord.mock.calls[0][0] as PerformanceStats
    expect(recorded.fileOpenTime).toBeGreaterThanOrEqual(100)
    expect(recorded.fileOpenTime).toBeLessThanOrEqual(150)
    expect(recorded.overallScore).toBeGreaterThanOrEqual(0)
    expect(recorded.overallScore).toBeLessThanOrEqual(100)
    await waitFor(() => expect(h.hookState.runBenchmark).toHaveBeenCalledTimes(1))
  })

  it('无编辑器引用：运行基准直接返回（不 addRecord 不 runBenchmark）', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<MonacoPerformanceMonitor editorRef={{ current: null } as React.RefObject<unknown>} />)
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('运行基准'))!)
    await waitFor(() => expect(container).toBeTruthy())
    expect(h.data.addRecord).not.toHaveBeenCalled()
    expect(h.hookState.runBenchmark).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('state.running=true：运行按钮禁用并显示「运行中...」', () => {
    h.hookState.state = { visible: true, running: true }
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    const runBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('运行中')) as HTMLButtonElement
    expect(runBtn.disabled).toBe(true)
    expect(container.textContent).toContain('运行中...')
  })

  it('清除数据 → clearHistory 布线', () => {
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('清除数据'))!)
    expect(h.data.clearHistory).toHaveBeenCalledTimes(1)
  })

  it('有关键字 stats：四指标卡 + 综合评分分区 + VS Code 对标百分比', () => {
    h.data.stats = statsOf(85)
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    for (const title of ['文件打开', '光标移动', '语法高亮', '内存使用']) {
      expect(container.textContent).toContain(title)
    }
    expect(container.textContent).toContain('目标: 200ms')
    expect(container.textContent).toContain('综合评分')
    expect(container.textContent).toContain('85')
    expect(container.textContent).toContain('VS Code对标: 92%')
    // 评分 ≥80 → 绿色分区
    expect(container.textContent).toContain('当前性能')
  })

  it('评分分区配色：≥80 绿 / ≥60 黄 / <60 红', () => {
    h.data.stats = statsOf(85)
    const { container: c1 } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(c1.querySelector('.text-green-600')).not.toBeNull()
    h.data.stats = statsOf(65)
    const { container: c2 } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(c2.querySelector('.text-yellow-600')).not.toBeNull()
    h.data.stats = statsOf(40)
    const { container: c3 } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(c3.querySelector('.text-red-600')).not.toBeNull()
  })

  it('趋势 <2 条：趋势区显示「需要至少2条数据来显示趋势」占位', () => {
    h.data.stats = statsOf(85)
    h.data.getTrend.mockReturnValue({ average: 85, improving: true, samples: 1 })
    h.data.history = [{ timestamp: new Date(), stats: statsOf(85) }]
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(container.textContent).toContain('性能趋势')
    expect(container.textContent).toContain('需要至少2条数据来显示趋势')
  })

  it('趋势 ≥2 条且 improving：柱状图渲染 + 「性能正在改善」文案', () => {
    h.data.stats = statsOf(85)
    h.data.getTrend.mockReturnValue({ average: 80, improving: true, samples: 3 })
    h.data.history = [
      { timestamp: new Date(), stats: statsOf(70) },
      { timestamp: new Date(), stats: statsOf(75) },
      { timestamp: new Date(), stats: statsOf(85) },
    ]
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(container.textContent).toContain('性能正在改善')
    expect(container.textContent).not.toContain('性能保持稳定')
    const bars = container.querySelectorAll('.h-32.flex.items-end > div')
    expect(bars.length).toBe(3)
    expect(bars[2].className).toContain('bg-blue-500')
  })

  it('趋势 ≥2 条但未改善 → 「性能保持稳定」文案', () => {
    h.data.stats = statsOf(60)
    h.data.getTrend.mockReturnValue({ average: 70, improving: false, samples: 2 })
    h.data.history = [
      { timestamp: new Date(), stats: statsOf(90) },
      { timestamp: new Date(), stats: statsOf(60) },
    ]
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(container.textContent).toContain('性能保持稳定')
  })

  it('历史记录条数随 history.length 显示', () => {
    h.data.history = [
      { timestamp: new Date(), stats: statsOf(80) },
      { timestamp: new Date(), stats: statsOf(81) },
      { timestamp: new Date(), stats: statsOf(82) },
    ]
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    expect(container.textContent).toContain('历史记录: 3 条')
  })

  it('点击头部关闭按钮 → toggle() 布线', () => {
    const { container } = render(<MonacoPerformanceMonitor editorRef={editorRef} />)
    const closeBtn = container.querySelector('button.p-1')!
    fireEvent.click(closeBtn)
    expect(h.hookState.toggle).toHaveBeenCalledTimes(1)
  })
})
