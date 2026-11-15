/**
 * @file MonacoPerformanceMonitor.test.tsx
 * @description Monaco 性能基准面板测试 — mock 基准服务（空态/运行/结果态/守卫）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const runFullSuite = vi.fn()
const setEditor = vi.fn()

vi.mock('../../services/monaco-performance-benchmark', () => ({
  getMonacoBenchmark: () => ({ runFullSuite, setEditor }),
}))

import { MonacoPerformanceMonitor } from '../MonacoPerformanceMonitor'

beforeEach(() => {
  vi.clearAllMocks()
})

const fakeEditor = { id: 'editor' } as never
const fakeMonaco = { id: 'monaco' } as never

const metrics = {
  overallScore: 87.5,
  vsCodeScore: 92.3,
} as never

describe('MonacoPerformanceMonitor（基准面板）', () => {
  it('visible=false 返回 null', () => {
    const { container } = render(<MonacoPerformanceMonitor visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('空态：无编辑器时按钮禁用', () => {
    const { container } = render(<MonacoPerformanceMonitor visible onClose={() => {}} />)
    expect(container.textContent).toContain('暂无基准测试数据')
    expect((container.querySelector('button.mt-4') as HTMLButtonElement).disabled).toBe(true)
  })

  it('有编辑器：点击运行 → setEditor + runFullSuite → 展示评分', async () => {
    runFullSuite.mockResolvedValue(metrics)
    const { container } = render(
      <MonacoPerformanceMonitor visible editor={fakeEditor} monaco={fakeMonaco} onClose={() => {}} />,
    )
    fireEvent.click(container.querySelector('button.mt-4')!)
    await waitFor(() => expect(setEditor).toHaveBeenCalledWith(fakeEditor, fakeMonaco))
    expect(runFullSuite).toHaveBeenCalledWith({ iterations: 5 })
    await waitFor(() => expect(container.textContent).toContain('87.5/100'))
    expect(container.textContent).toContain('VS Code 对标: 92.3%')
    // 结果态出现运行时间戳与重跑按钮
    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  it('基准抛错：isRunning 复位，不崩溃', async () => {
    runFullSuite.mockRejectedValue(new Error('bench failed'))
    const { container } = render(
      <MonacoPerformanceMonitor visible editor={fakeEditor} monaco={fakeMonaco} onClose={() => {}} />,
    )
    fireEvent.click(container.querySelector('button.mt-4')!)
    await waitFor(() => expect(runFullSuite).toHaveBeenCalledTimes(1))
    // 回到空态（metrics 未写入）
    expect(container.textContent).toContain('暂无基准测试数据')
    expect((container.querySelector('button.mt-4') as HTMLButtonElement).disabled).toBe(false)
  })

  it('空态守卫：无 editor/monaco 时点击运行不调基准', async () => {
    const { container } = render(<MonacoPerformanceMonitor visible onClose={() => {}} />)
    const btn = container.querySelector('button.mt-4') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    fireEvent.click(btn)
    expect(runFullSuite).not.toHaveBeenCalled()
  })

  it('关闭按钮回调 onClose（空态与结果态两处）', async () => {
    runFullSuite.mockResolvedValue(metrics)
    const onClose = vi.fn()
    const { container } = render(
      <MonacoPerformanceMonitor visible editor={fakeEditor} monaco={fakeMonaco} onClose={onClose} />,
    )
    fireEvent.click(container.querySelectorAll('button')[0])
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('button.mt-4')!)
    await waitFor(() => expect(container.textContent).toContain('87.5'))
    const closeBtns = Array.from(container.querySelectorAll('button'))
    fireEvent.click(closeBtns[closeBtns.length - 1])
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
