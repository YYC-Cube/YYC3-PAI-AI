/**
 * @file hooks-small.test.tsx
 * @description 小型 hooks 批测 — useDebounce/useDebouncedCallback/useStreamText/useSystemTheme + 桶导出
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce, useDebouncedCallback } from '../useDebounce'
import { useStreamText } from '../useStreamText'
import { useSystemTheme } from '../useSystemTheme'
import { useDebounce as barrelDebounce, useAI as barrelUseAI } from '../index'

beforeEach(() => {
  localStorage.clear()
})

describe('useDebounce', () => {
  it('delay 内多次变更只在超时后落定一次', () => {
    vi.useFakeTimers()
    try {
      const { result, rerender } = renderHook(({ v }) => useDebounce(v, 100), { initialProps: { v: 'a' } })
      expect(result.current).toBe('a')
      rerender({ v: 'b' })
      rerender({ v: 'c' })
      act(() => { vi.advanceTimersByTime(50) })
      expect(result.current).toBe('a')
      act(() => { vi.advanceTimersByTime(60) })
      expect(result.current).toBe('c')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('useDebouncedCallback', () => {
  it('trailing：最后一次调用的参数生效', () => {
    vi.useFakeTimers()
    try {
      const fn = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(fn, 100))
      act(() => { result.current('x') })
      act(() => { result.current('y') })
      expect(fn).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(120) })
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('y')
    } finally {
      vi.useRealTimers()
    }
  })

  it('leading：首次立即执行，后续合并', () => {
    vi.useFakeTimers()
    try {
      const fn = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(fn, 100, { leading: true }))
      act(() => { result.current('first') })
      expect(fn).toHaveBeenCalledTimes(1)
      act(() => { result.current('second') })
      act(() => { vi.advanceTimersByTime(120) })
      // leading 首次同步执行，trailing 阶段不再补发
      expect(fn).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancel：取消挂起的调用', () => {
    vi.useFakeTimers()
    try {
      const fn = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(fn, 100))
      act(() => { result.current('x') })
      act(() => { result.current.cancel() })
      act(() => { vi.advanceTimersByTime(200) })
      expect(fn).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('useStreamText（打字机）', () => {
  it('startStream 逐字填充至全文', async () => {
    const { result } = renderHook(() => useStreamText())
    await act(async () => { await result.current.startStream('abc', 0) })
    expect(result.current.renderText).toBe('abc')
  })

  it('fastFinish 立即全量填充（打断流式）', async () => {
    const { result } = renderHook(() => useStreamText())
    let finish!: () => void
    const streaming = act(async () => {
      const p = result.current.startStream('abcdefghijklmnopqrstuvwxyz', 5)
      finish = () => result.current.fastFinish('abcdefghijklmnopqrstuvwxyz')
      await p
    })
    // 流式进行中触发 fastFinish，循环提前退出
    setTimeout(() => finish(), 10)
    await streaming
    expect(result.current.renderText).toBe('abcdefghijklmnopqrstuvwxyz')
  })
})

describe('useSystemTheme（暗黑跟随）', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('默认 system 模式，setMode(dark) 落 localStorage 并挂载 dark class', async () => {
    const { result } = renderHook(() => useSystemTheme())
    expect(result.current.mode).toBe('system')
    act(() => { result.current.setMode('dark') })
    expect(result.current.mode).toBe('dark')
    await waitFor(() => expect(result.current.isDark).toBe(true))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('yyc3-chat-theme-mode')).toBe('dark')
  })

  it('setMode(light) 移除 dark class', async () => {
    const { result } = renderHook(() => useSystemTheme())
    act(() => { result.current.setMode('light') })
    await waitFor(() => expect(result.current.isDark).toBe(false))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('持久化模式：初始化时从 localStorage 恢复', () => {
    localStorage.setItem('yyc3-chat-theme-mode', 'dark')
    const { result } = renderHook(() => useSystemTheme())
    expect(result.current.mode).toBe('dark')
  })
})

describe('hooks 桶导出（index.ts）', () => {
  it('桶文件 re-export 与直连导出同源', () => {
    expect(typeof barrelDebounce).toBe('function')
    expect(typeof barrelUseAI).toBe('function')
  })
})
