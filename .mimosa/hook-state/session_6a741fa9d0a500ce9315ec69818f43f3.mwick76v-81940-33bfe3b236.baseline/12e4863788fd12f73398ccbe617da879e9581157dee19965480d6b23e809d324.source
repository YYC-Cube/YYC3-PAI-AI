/**
 * @file PerformanceMonitor.test.tsx
 * @description React Profiler 性能监控组件测试 — 渲染记录入 store、enabled 开关、更新累积
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PerformanceMonitor } from '../PerformanceMonitor'
import { usePerformanceStore } from '../../store/performance-store'

beforeEach(() => {
  // 真 store：重置组件渲染记录
  usePerformanceStore.setState({ componentMetrics: [] })
})

function Counter() {
  const [n, setN] = useState(0)
  return <button data-testid="inc" onClick={() => setN(n + 1)}>count:{n}</button>
}

const entryOf = (name: string) =>
  usePerformanceStore.getState().componentMetrics.find(m => m.name === name)

describe('PerformanceMonitor（Profiler 包装）', () => {
  it('包裹子组件正常渲染并透传交互', () => {
    const { container, getByTestId } = render(
      <PerformanceMonitor name="Counter"><Counter /></PerformanceMonitor>,
    )
    expect(container.textContent).toContain('count:0')
    fireEvent.click(getByTestId('inc'))
    expect(container.textContent).toContain('count:1')
  })

  it('mount 渲染记录入 performance-store（真 store 集成）', () => {
    render(<PerformanceMonitor name="TrackedWidget"><div>w</div></PerformanceMonitor>)
    const entry = entryOf('TrackedWidget')
    expect(entry).toBeTruthy()
    expect(entry!.renderCount).toBe(1)
    expect(entry!.renderTime).toBeGreaterThanOrEqual(0)
  })

  it('enabled=false 不记录（开关短路）', () => {
    render(
      <PerformanceMonitor name="MutedWidget" enabled={false}><div>m</div></PerformanceMonitor>,
    )
    expect(entryOf('MutedWidget')).toBeUndefined()
  })

  it('更新阶段累积渲染计数（Profiler update 回调）', () => {
    const { getByTestId } = render(
      <PerformanceMonitor name="UpdatingWidget"><Counter /></PerformanceMonitor>,
    )
    fireEvent.click(getByTestId('inc'))
    fireEvent.click(getByTestId('inc'))
    // mount + 2 updates（Profiler 对嵌套提交可能合并，至少 2 次）
    expect(entryOf('UpdatingWidget')!.renderCount).toBeGreaterThanOrEqual(2)
  })

  it('多实例各自按 name 分桶记录', () => {
    render(
      <>
        <PerformanceMonitor name="WidgetA"><div>a</div></PerformanceMonitor>
        <PerformanceMonitor name="WidgetB"><div>b</div></PerformanceMonitor>
      </>,
    )
    expect(entryOf('WidgetA')).toBeTruthy()
    expect(entryOf('WidgetB')).toBeTruthy()
    expect(usePerformanceStore.getState().componentMetrics).toHaveLength(2)
  })
})
