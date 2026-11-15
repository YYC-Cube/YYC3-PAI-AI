/**
 * @file ErrorBoundary.test.tsx
 * @description 错误边界行为测试（resetKeys 快照修复回归 · 覆盖率收敛 onboarding）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

const Boom = ({ msg }: { msg: string }) => {
  throw new Error(msg)
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => { })
  })

  it('子组件崩溃渲染降级 UI（不白屏）', () => {
    render(
      <ErrorBoundary>
        <Boom msg="crash-1" />
      </ErrorBoundary>,
    )
    expect(document.body.textContent).toMatch(/YYC|错误|Error|崩溃/i)
  })

  it('重试按钮复位边界：修复后的子组件重新渲染', () => {
    let broken = true
    const Child = () => {
      if (broken) throw new Error('temp')
      return <div data-testid="recovered">recovered</div>
    }
    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    )
    const retry = Array.from(document.querySelectorAll('button')).find(b => /try again|重试|retry/i.test(b.textContent || b.getAttribute('aria-label') || ''))
    expect(retry).toBeTruthy()
    broken = false
    fireEvent.click(retry!)
    expect(screen.getByTestId('recovered')).toBeTruthy()
  })

  it('resetKeys 变更自动复位（快照比较修复回归）', () => {
    let broken = true
    const Child = () => {
      if (broken) throw new Error('temp2')
      return <div data-testid="auto-recovered">ok</div>
    }
    const { rerender } = render(
      <ErrorBoundary resetKeys={['a']}>
        <Child />
      </ErrorBoundary>,
    )
    broken = false
    // resetKeys 变更 → 边界复位 → 子组件以修复状态重渲染
    rerender(
      <ErrorBoundary resetKeys={['b']}>
        <Child />
      </ErrorBoundary>,
    )
    expect(screen.getByTestId('auto-recovered')).toBeTruthy()
  })

  it('正常子组件直通渲染', () => {
    render(
      <ErrorBoundary>
        <div data-testid="fine">fine</div>
      </ErrorBoundary>,
    )
    expect(screen.getByTestId('fine')).toBeTruthy()
  })
})
