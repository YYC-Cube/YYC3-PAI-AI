/**
 * @file collaboration-cursor-throttle.ts
 * @description 协作光标节流服务，优化decorations更新频率
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-26
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,collaboration,cursor,throttle,optimization
 */

import { useCallback, useRef, useEffect } from 'react'

/**
 * 节流配置
 */
export interface ThrottleConfig {
  /** 节流时间（毫秒） */
  throttleMs: number
  /** 是否立即执行首次调用 */
  leading: boolean
  /** 是否延迟执行最后一次调用 */
  trailing: boolean
}

/**
 * 节流状态
 */
interface ThrottleState {
  lastCallTime: number
  pendingUpdate: boolean
  pendingArgs: unknown[] | null
  timeoutId: ReturnType<typeof setTimeout> | null
}

/**
 * 默认节流配置
 */
const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  throttleMs: 100,
  leading: true,
  trailing: true,
}

/**
 * 协作光标节流Hook
 *
 * 优化decorations更新频率，避免频繁重绘
 *
 * @param updateFn - 更新函数
 * @param config - 节流配置
 * @returns 节流后的更新函数
 *
 * @example
 * ```tsx
 * const throttledUpdate = useThrottleCallback(
 *   (decorations) => editor.deltaDecorations(oldDecorations, decorations),
 *   { throttleMs: 100 }
 * )
 * ```
 */
export function useThrottleCallback<T extends (...args: unknown[]) => void>(
  updateFn: T,
  config: Partial<ThrottleConfig> = {},
): T {
  const { throttleMs = 100, leading = true, trailing = true } = {
    ...DEFAULT_THROTTLE_CONFIG,
    ...config,
  }

  const stateRef = useRef<ThrottleState>({
    lastCallTime: 0,
    pendingUpdate: false,
    pendingArgs: null,
    timeoutId: null,
  })

  const updateFnRef = useRef(updateFn)
  
  useEffect(() => {
    updateFnRef.current = updateFn
  }, [updateFn])

  // 清理定时器
  useEffect(() => {
    const state = stateRef.current
    return () => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId)
      }
    }
  }, [])

  // 节流函数
  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const state = stateRef.current

      // 检查是否在节流期内
      const timeSinceLastCall = now - state.lastCallTime
      const shouldThrottle = timeSinceLastCall < throttleMs

      if (shouldThrottle) {
        // 保存待处理的更新
        state.pendingUpdate = true
        state.pendingArgs = args

        // 设置延迟执行
        if (!state.timeoutId && trailing) {
          state.timeoutId = setTimeout(() => {
            const { pendingArgs: pending } = stateRef.current
            if (pending) {
              updateFnRef.current(...(pending as Parameters<T>))
              stateRef.current.lastCallTime = Date.now()
            }
            stateRef.current.pendingUpdate = false
            stateRef.current.pendingArgs = null
            stateRef.current.timeoutId = null
          }, throttleMs - timeSinceLastCall)
        }
        return
      }

      // 清除之前的定时器
      if (state.timeoutId) {
        clearTimeout(state.timeoutId)
        state.timeoutId = null
      }

      // 立即执行（如果允许）
      if (leading) {
        updateFnRef.current(...args)
        state.lastCallTime = now
        state.pendingUpdate = false
        state.pendingArgs = null
      } else if (trailing) {
        // 如果leading=false且trailing=true，在节流期结束后执行
        state.pendingUpdate = true
        state.pendingArgs = args
        state.timeoutId = setTimeout(() => {
          const { pendingArgs: pending } = stateRef.current
          if (pending) {
            updateFnRef.current(...(pending as Parameters<T>))
            stateRef.current.lastCallTime = Date.now()
          }
          stateRef.current.pendingUpdate = false
          stateRef.current.pendingArgs = null
          stateRef.current.timeoutId = null
        }, throttleMs)
      }
    },
    [throttleMs, leading, trailing],
  ) as T

  return throttledFn
}

/**
 * 协作光标更新节流器
 *
 * 专门用于优化协作光标decorations更新
 *
 * @example
 * ```tsx
 * const throttleRef = useCursorThrottle()
 *
 * useEffect(() => {
 *   const editor = editorRef.current
 *   const monaco = monacoRef.current
 *   if (!editor || !monaco) return
 *
 *   const decorations = buildCollabDecorations(remoteUsers, editor, monaco)
 *   throttleRef.current(editor, decorations)
 * }, [remoteUsers])
 * ```
 */
export function useCursorThrottle(
  config: Partial<ThrottleConfig> = {},
) {
  const decorationsRef = useRef<string[]>([])
  const lastUpdateArgsRef = useRef<[unknown, unknown[]] | null>(null)

  // 更新decorations的节流函数
  const throttledUpdate = useThrottleCallback(
    (editor: unknown, decorations: unknown) => {
      const decorationsArray = decorations as unknown[]
      const { current: oldDecorations } = decorationsRef
      const { current: lastArgs } = lastUpdateArgsRef

      // 检查是否是重复的更新
      if (
        lastArgs &&
        lastArgs[0] === editor &&
        lastArgs[1]?.length === decorationsArray.length &&
        JSON.stringify(lastArgs[1]) === JSON.stringify(decorationsArray)
      ) {
        return // 跳过重复更新
      }

      // 保存参数以便下次比较
      lastUpdateArgsRef.current = [editor, decorationsArray]

      // 执行更新
      if (editor && typeof editor === 'object' && 'deltaDecorations' in editor) {
        const monacoEditor = editor as { deltaDecorations: (oldDecor: string[], newDecor: unknown[]) => string[] }
        decorationsRef.current = monacoEditor.deltaDecorations(oldDecorations, decorationsArray)
      }
    },
    config,
  )

  return {
    /** 节流更新函数 */
    update: throttledUpdate,
    /** 当前decorations引用 */
    decorationsRef,
    /** 清除所有decorations */
    clear: useCallback(() => {
      decorationsRef.current = []
      lastUpdateArgsRef.current = null
    }, []),
    /** 重置节流状态 */
    reset: useCallback(() => {
      decorationsRef.current = []
      lastUpdateArgsRef.current = null
    }, []),
  }
}

/**
 * 防抖Hook
 *
 * 防抖与节流配合使用，进一步优化性能
 *
 * @param updateFn - 更新函数
 * @param delayMs - 延迟时间（毫秒）
 * @returns 防抖后的更新函数
 */
export function useDebounceCallback<T extends (...args: unknown[]) => void>(
  updateFn: T,
  delayMs: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateFnRef = useRef(updateFn)

  useEffect(() => {
    updateFnRef.current = updateFn
  }, [updateFn])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        updateFnRef.current(...args)
      }, delayMs)
    },
    [delayMs],
  ) as T

  return debouncedFn
}

/**
 * 智能更新Hook
 *
 * 结合节流和防抖，提供智能更新策略：
 * - 高频更新时使用节流（100ms）
 * - 更新停止后延迟执行最后一次（200ms）
 *
 * @param updateFn - 更新函数
 * @returns 智能更新函数
 */
export function useSmartUpdate<T extends (...args: unknown[]) => void>(
  updateFn: T,
): T {
  const throttledFn = useThrottleCallback(updateFn, { throttleMs: 100, leading: true, trailing: true })
  const debouncedFn = useDebounceCallback(updateFn, 200)

  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const smartFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      lastCallRef.current = now

      // 立即执行节流版本
      throttledFn(...args)

      // 如果在200ms内没有新的调用，执行防抖版本
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const timeSinceLastCall = Date.now() - lastCallRef.current
        if (timeSinceLastCall >= 200) {
          debouncedFn(...args)
        }
      }, 200)
    },
    [throttledFn, debouncedFn],
  ) as T

  return smartFn
}
