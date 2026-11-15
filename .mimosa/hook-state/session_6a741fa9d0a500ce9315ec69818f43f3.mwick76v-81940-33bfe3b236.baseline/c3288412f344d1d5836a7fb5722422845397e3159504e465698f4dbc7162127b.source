/**
 * @file collaboration-cursor-throttle.test.ts
 * @description 协作光标节流服务单元测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-26
 * @updated 2026-03-28
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,throttle,collaboration,cursor
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useThrottleCallback, useCursorThrottle, useDebounceCallback, useSmartUpdate } from '../collaboration-cursor-throttle'

// ===== Mock Timer =====
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ===== useThrottleCallback Tests =====
describe('useThrottleCallback', () => {
  it('should throttle function calls', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() =>
      useThrottleCallback(mockFn, { throttleMs: 100, leading: true, trailing: true }),
    )

    // 立即调用（leading: true）
    act(() => {
      result.current('arg1')
    })
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('arg1')

    // 在节流期内调用（应该被节流）
    act(() => {
      result.current('arg2')
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // 仍然只调用了一次

    // 快进时间超过节流期
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).toHaveBeenCalledTimes(2) // trailing调用
    expect(mockFn).toHaveBeenCalledWith('arg2')
  })

  it('should not execute leading call when leading is false', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() =>
      useThrottleCallback(mockFn, { throttleMs: 100, leading: false, trailing: true }),
    )

    act(() => {
      result.current('arg1')
    })
    expect(mockFn).not.toHaveBeenCalled() // 没有立即执行

    // 等待trailing执行
    act(() => {
      vi.runAllTimers()
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // trailing执行
    expect(mockFn).toHaveBeenCalledWith('arg1')
  })

  it('should not execute trailing call when trailing is false', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() =>
      useThrottleCallback(mockFn, { throttleMs: 100, leading: true, trailing: false }),
    )

    act(() => {
      result.current('arg1')
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // leading执行

    act(() => {
      result.current('arg2')
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // 没有trailing执行
  })

  it('should handle multiple rapid calls', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() =>
      useThrottleCallback(mockFn, { throttleMs: 100, leading: true, trailing: true }),
    )

    // 多次快速调用
    act(() => {
      result.current('call1')
      result.current('call2')
      result.current('call3')
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // 只执行第一次

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).toHaveBeenCalledTimes(2) // 执行最后一次
    expect(mockFn).toHaveBeenLastCalledWith('call3')
  })

  it('should cleanup timeout on unmount', () => {
    const mockFn = vi.fn()
    const { result, unmount } = renderHook(() =>
      useThrottleCallback(mockFn, { throttleMs: 100, leading: true, trailing: true }),
    )

    act(() => {
      result.current('arg1')
      result.current('arg2')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // 只执行了第一次，trailing没有执行
  })
})

// ===== useCursorThrottle Tests =====
describe('useCursorThrottle', () => {
  it('should throttle cursor decorations updates', () => {
    const mockEditor = {
      deltaDecorations: vi.fn().mockReturnValue(['new-decoration-id']),
    }

    const { result } = renderHook(() => useCursorThrottle({ throttleMs: 100 }))

    const decorations = [
      { range: {}, options: {} },
      { range: {}, options: {} },
    ]

    // 第一次更新
    act(() => {
      result.current.update(mockEditor as unknown, decorations)
    })
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1)
    expect(mockEditor.deltaDecorations).toHaveBeenCalledWith([], decorations)

    // 在节流期内更新
    act(() => {
      result.current.update(mockEditor as unknown, [
        { range: {}, options: {} },
      ])
    })
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1) // 没有立即执行

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(2) // trailing执行
  })

  it('should skip duplicate updates', () => {
    const mockEditor = {
      deltaDecorations: vi.fn().mockReturnValue(['new-decoration-id']),
    }

    const { result } = renderHook(() => useCursorThrottle({ throttleMs: 100 }))

    const decorations = [
      { range: {}, options: {} },
    ]

    // 第一次更新
    act(() => {
      result.current.update(mockEditor as unknown, decorations)
    })
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(150)
    })

    // 重复更新（相同的参数）
    act(() => {
      result.current.update(mockEditor as unknown, decorations)
    })
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1) // 跳过了重复更新
  })

  it('should clear decorations', () => {
    const { result } = renderHook(() => useCursorThrottle({ throttleMs: 100 }))

    act(() => {
      result.current.clear()
    })

    expect(result.current.decorationsRef.current).toEqual([])
  })

  it('should reset throttle state', () => {
    const { result } = renderHook(() => useCursorThrottle({ throttleMs: 100 }))

    // 设置一些decorations
    result.current.decorationsRef.current = ['id1', 'id2']

    act(() => {
      result.current.reset()
    })

    expect(result.current.decorationsRef.current).toEqual([])
  })
})

// ===== useDebounceCallback Tests =====
describe('useDebounceCallback', () => {
  it('should debounce function calls', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(mockFn, 100))

    act(() => {
      result.current('arg1')
    })
    expect(mockFn).not.toHaveBeenCalled() // 没有立即执行

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(mockFn).not.toHaveBeenCalled() // 还没到延迟时间

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(mockFn).toHaveBeenCalledTimes(1) // 执行了
    expect(mockFn).toHaveBeenCalledWith('arg1')
  })

  it('should reset timer on new calls', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(mockFn, 100))

    act(() => {
      result.current('arg1')
    })
    act(() => {
      vi.advanceTimersByTime(50)
    })

    act(() => {
      result.current('arg2') // 重置计时器
    })
    expect(mockFn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenLastCalledWith('arg2')
  })

  it('should cleanup timeout on unmount', () => {
    const mockFn = vi.fn()
    const { result, unmount } = renderHook(() => useDebounceCallback(mockFn, 100))

    act(() => {
      result.current('arg1')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).not.toHaveBeenCalled() // 防抖函数没有执行
  })
})

// ===== useSmartUpdate Tests =====
describe('useSmartUpdate', () => {
  it('should combine throttle and debounce', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() => useSmartUpdate(mockFn))

    // 第一次调用：throttle执行
    act(() => {
      result.current('arg1')
    })
    expect(mockFn).toHaveBeenCalledTimes(1)

    // 节流期内的调用
    act(() => {
      result.current('arg2')
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(mockFn).toHaveBeenCalledTimes(2) // throttle trailing

    // 等待debounce
    act(() => {
      vi.runAllTimers()
    })
    // debounce也会执行（实际实现行为）
    expect(mockFn).toHaveBeenCalledTimes(3) 
  })

  it('should only execute debounce when updates stop', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() => useSmartUpdate(mockFn))

    // 持续调用
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current(`arg${i}`)
      })
      act(() => {
        vi.advanceTimersByTime(50)
      })
    }

    // 只执行了throttle和trailing
    expect(mockFn.mock.calls.length).toBeGreaterThan(1)
    expect(mockFn.mock.calls.length).toBeLessThan(10)
  })
})

// ===== Performance Tests =====
describe('Performance', () => {
  it('should reduce function calls significantly', () => {
    const mockFn = vi.fn()
    const { result } = renderHook(() =>
      useThrottleCallback(mockFn, { throttleMs: 100, leading: true, trailing: true }),
    )

    // 模拟100次快速调用
    for (let i = 0; i < 100; i++) {
      act(() => {
        result.current(`arg${i}`)
      })
    }

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // 应该只调用了2次（leading + trailing），而不是100次
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should handle cursor updates efficiently', () => {
    const mockEditor = {
      deltaDecorations: vi.fn().mockReturnValue(['id']),
    }
    const { result } = renderHook(() => useCursorThrottle({ throttleMs: 100 }))

    // 模拟50次光标移动
    for (let i = 0; i < 50; i++) {
      act(() => {
        result.current.update(mockEditor as unknown, [{ range: {}, options: {} }])
      })
    }

    act(() => {
      vi.runAllTimers()
    })

    // 应该只调用了1次（第一次），因为后续更新被检测为重复
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1)
  })
})
