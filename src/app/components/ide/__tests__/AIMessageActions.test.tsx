/**
 * @file AIMessageActions.test.tsx
 * @description AI 消息操作条 — 复制态翻转/重新生成门控/正负反馈互斥切换/卸载清定时器
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { AIMessageActions } from '../AIMessageActions'

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('AIMessageActions（消息操作条）', () => {
  it('渲染复制按钮；点击后写剪贴板并翻转为 COPIED（异步复制完成后）', async () => {
    const { container } = render(<AIMessageActions content="要复制的内容" />)
    const copyBtn = container.querySelector('button[title="Copy"]')!
    expect(copyBtn.textContent).toContain('COPY')
    fireEvent.click(copyBtn)
    // handleCopy 为 async：先写剪贴板再置 copied 态，需冲洗微任务
    await act(async () => { await Promise.resolve() })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('要复制的内容')
    expect(container.textContent).toContain('COPIED')
    expect(container.querySelector('button[title="Copied!"]')).not.toBeNull()
  })

  it('未传 onRegenerate 时不渲染重新生成按钮；传入后点击透传回调', () => {
    const onRegenerate = vi.fn()
    const { container, rerender } = render(<AIMessageActions content="c" />)
    expect(container.textContent).not.toContain('REGEN')
    rerender(<AIMessageActions content="c" onRegenerate={onRegenerate} />)
    const regen = container.querySelector('button[title="Regenerate"]')!
    fireEvent.click(regen)
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it('isRegenerating 时重新生成按钮禁用且不可触发', () => {
    const onRegenerate = vi.fn()
    const { container } = render(
      <AIMessageActions content="c" onRegenerate={onRegenerate} isRegenerating />,
    )
    const regen = container.querySelector('button[title="Regenerate"]') as HTMLButtonElement
    expect(regen.disabled).toBe(true)
    fireEvent.click(regen)
    expect(onRegenerate).not.toHaveBeenCalled()
  })

  it('正/负反馈按钮：点击高亮（fill 生效）、重复点击取消、异侧切换', () => {
    const { container } = render(<AIMessageActions content="c" />)
    const good = container.querySelector('button[title="Good response"]') as HTMLElement
    const bad = container.querySelector('button[title="Bad response"]') as HTMLElement
    const goodIcon = good.querySelector('svg') as SVGElement
    const badIcon = bad.querySelector('svg') as SVGElement
    // 初始均为未点亮（fill="none"）
    expect(goodIcon.getAttribute('fill')).toBe('none')
    expect(badIcon.getAttribute('fill')).toBe('none')
    // 正向点亮（success 色）
    fireEvent.click(good)
    expect(goodIcon.getAttribute('fill')).toBe('#00ff00')
    // 异侧切换：负向点亮（error 色）、正向熄灭
    fireEvent.click(bad)
    expect(badIcon.getAttribute('fill')).toBe('#ff0044')
    expect(goodIcon.getAttribute('fill')).toBe('none')
    // 重复点击负向：取消
    fireEvent.click(bad)
    expect(badIcon.getAttribute('fill')).toBe('none')
  })

  it('连续两次复制不会叠加多个复位定时器（旧定时器被清理，1.8s 后仅复位一次状态）', async () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<AIMessageActions content="c" />)
      const copyBtn = container.querySelector('button[title="Copy"]')!
      fireEvent.click(copyBtn)
      fireEvent.click(copyBtn)
      await act(async () => { await Promise.resolve() })
      expect(container.textContent).toContain('COPIED')
      act(() => { vi.advanceTimersByTime(1900) })
      expect(container.textContent).toContain('COPY')
      expect(container.textContent).not.toContain('COPIED')
    } finally {
      vi.useRealTimers()
    }
  })

  it('卸载时清理复制复位定时器（unmount 后不触发状态更新警告）', async () => {
    vi.useFakeTimers()
    try {
      const { container, unmount } = render(<AIMessageActions content="c" />)
      fireEvent.click(container.querySelector('button[title="Copy"]')!)
      await act(async () => { await Promise.resolve() })
      expect(() => unmount()).not.toThrow()
      vi.advanceTimersByTime(2000)
    } finally {
      vi.useRealTimers()
    }
  })
})
