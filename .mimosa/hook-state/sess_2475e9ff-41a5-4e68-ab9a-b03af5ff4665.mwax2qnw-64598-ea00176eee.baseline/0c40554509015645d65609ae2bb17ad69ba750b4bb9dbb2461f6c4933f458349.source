/**
 * @file AICompletionProvider.tsx
 * @description Monaco Editor AI补全Provider，基于WebGPU推理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,monaco,ai,completion,webgpu
 */

import * as Monaco from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWebGPUInference } from '../hooks/useWebGPUInference'
import { createLogger } from '../utils/logger'

const logger = createLogger('ai-completion')

/**
 * AI补全Provider配置
 */
export interface AICompletionProviderOptions {
  /** 是否启用 */
  enabled?: boolean
  /** 触发字符 */
  triggerChars?: string[]
  /** 最小触发延迟 (ms) */
  debounceDelay?: number
  /** 最大补全建议数 */
  maxSuggestions?: number
  /** 是否在UI中显示补全来源 */
  showSource?: boolean
  /** 自定义补全处理函数 */
  customHandler?: (input: string) => Promise<string>
}

/**
 * AI补全项
 */
export interface AICompletionItem extends Monaco.languages.CompletionItem {
  /** 是否为AI生成 */
  isAI?: boolean
  /** 推理时间 (ms) */
  inferenceTime?: number
}

/**
 * AI补全Provider Hook
 *
 * 为Monaco Editor添加基于WebGPU推理的代码补全功能。
 *
 * @example 基本使用
 * ```tsx
 * function MyEditor() {
 *   const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
 *
 *   useAICompletionProvider({
 *     editorRef,
 *     enabled: true,
 *   })
 *
 *   return <MonacoEditor ref={editorRef} />
 * }
 * ```
 *
 * @example 自定义配置
 * ```tsx
 * function MyEditor() {
 *   const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
 *
 *   useAICompletionProvider({
 *     editorRef,
 *     enabled: true,
 *     triggerChars: ['.', '(', '[', '='],
 *     debounceDelay: 300,
 *     maxSuggestions: 5,
 *     showSource: true,
 *   })
 *
 *   return <MonacoEditor ref={editorRef} />
 * }
 * ```
 *
 * @example 自定义处理函数
 * ```tsx
 * function MyEditor() {
 *   const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
 *
 *   useAICompletionProvider({
 *     editorRef,
 *     enabled: true,
 *     customHandler: async (input) => {
 *       // 自定义推理逻辑
 *       const result = await myCustomInference(input)
 *       return result
 *     },
 *   })
 *
 *   return <MonacoEditor ref={editorRef} />
 * }
 * ```
 */
export function useAICompletionProvider(
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>,
  options: AICompletionProviderOptions = {}
) {
  const {
    enabled = true,
    triggerChars = ['.', '(', '[', '{', '=', ' ', '\n'],
    debounceDelay = 300,
    maxSuggestions = 5,
    showSource = true,
    customHandler,
  } = options

  const { infer, isInferencing, activeModel, stats, webGPUSupported } = useWebGPUInference({
    autoInitialize: true,
    autoLoadDefaultModel: true,
  })

  const providerRef = useRef<Monaco.IDisposable | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isProviderRegistered, setIsProviderRegistered] = useState(false)

  // 清除补全Provider
  const clearProvider = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.dispose()
      providerRef.current = null
    }
  }, [])

  // 清除防抖定时器
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  // 解析AI输出为补全建议
  const parseAIOutput = useCallback(
    (output: string, _input: string): Omit<Monaco.languages.CompletionItem, 'range'>[] => {
      const suggestions: Omit<Monaco.languages.CompletionItem, 'range'>[] = []

      // 简单的解析逻辑：提取AI生成的代码片段
      const lines = output.split('\n').filter((line) => line.trim().length > 0)

      // 提取函数名、变量名等
      for (const line of lines) {
        const trimmed = line.trim()

        // 匹配函数定义
        const functionMatch = trimmed.match(/(?:function|const|let|var)\s+(\w+)/)
        if (functionMatch) {
          suggestions.push({
            label: functionMatch[1],
            kind: Monaco.languages.CompletionItemKind.Function,
            insertText: functionMatch[1],
            sortText: '1',
          })
        }

        // 匹配字符串
        const stringMatch = trimmed.match(/['"`]([^'"`]*)['"`]/)
        if (stringMatch) {
          suggestions.push({
            label: stringMatch[1],
            kind: Monaco.languages.CompletionItemKind.Text,
            insertText: stringMatch[1],
            sortText: '2',
          })
        }

        // 匹配注释
        if (trimmed.startsWith('//')) {
          suggestions.push({
            label: trimmed.substring(2).trim(),
            kind: Monaco.languages.CompletionItemKind.Snippet,
            insertText: trimmed.substring(2).trim(),
            sortText: '3',
          })
        }

        // 如果没有匹配，直接使用该行作为建议
        if (suggestions.length === 0 && trimmed.length > 2) {
          suggestions.push({
            label: trimmed,
            kind: Monaco.languages.CompletionItemKind.Text,
            insertText: trimmed,
            sortText: '4',
          })
        }
      }

      return suggestions.slice(0, maxSuggestions)
    },
    [maxSuggestions]
  )

  // 调用AI推理
  const triggerAICompletion = useCallback(
    async (input: string): Promise<AICompletionItem[]> => {
      if (!enabled || isInferencing) {
        return []
      }

      try {
        const startTime = performance.now()

        let output: string
        if (customHandler) {
          output = await customHandler(input)
        } else {
          output = await infer(input)
        }

        const inferenceTime = performance.now() - startTime

        // 解析AI输出为补全建议
        const suggestions = parseAIOutput(output, input)

        // 标记为AI生成的补全
        const aiSuggestions: AICompletionItem[] = suggestions.map((suggestion) => ({
          ...suggestion,
          isAI: true,
          inferenceTime,
          kind: Monaco.languages.CompletionItemKind.Text,
          detail: showSource ? `AI (${activeModel?.name})` : '',
          documentation: {
            value: `Generated by ${activeModel?.name || 'AI'}\n\nInference time: ${inferenceTime.toFixed(0)}ms`,
            isTrusted: true,
            supportHtml: false,
          },
          sortText: 'a' + (suggestion.sortText || '0'),
          range: undefined as unknown as Monaco.IRange,
        }))

        return aiSuggestions
      } catch (error) {
        logger.error('[AI Completion] Inference failed:', error)
        return []
      }
    },
    [enabled, isInferencing, infer, customHandler, showSource, activeModel, parseAIOutput]
  )

  // 设置补全Provider
  useEffect(() => {
    if (!editorRef.current || !enabled) {
      clearProvider()
      return
    }

    // 如果WebGPU不支持，不设置Provider
    if (!webGPUSupported) {
      logger.warn('[AI Completion] WebGPU not supported, AI completion disabled')
      return
    }

    // 清除旧的Provider
    clearProvider()

    // 创建新的Provider
    const provider: Monaco.languages.CompletionItemProvider = {
      provideCompletionItems: async (
        model: Monaco.editor.ITextModel,
        position: Monaco.Position
      ): Promise<Monaco.languages.CompletionList | undefined> => {
        // 获取当前行的文本
        const line = model.getLineContent(position.lineNumber)
        const textBeforeCursor = line.substring(0, position.column - 1)

        // 检查是否应该触发AI补全
        const shouldTrigger = triggerChars.some((char) =>
          textBeforeCursor.endsWith(char)
        )

        if (!shouldTrigger) {
          return { suggestions: [] }
        }

        // 清除之前的定时器
        clearDebounceTimer()

        // 返回Promise以支持防抖
        return new Promise((resolve) => {
          debounceTimerRef.current = setTimeout(async () => {
            const suggestions = await triggerAICompletion(textBeforeCursor)
            const range = new Monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            )
            const suggestionsWithRange = suggestions.map(s => ({ ...s, range }))
            resolve({ suggestions: suggestionsWithRange })
          }, debounceDelay)
        })
      },
    }

    // 注册Provider
    providerRef.current = Monaco.languages.registerCompletionItemProvider('*', provider)
    queueMicrotask(() => setIsProviderRegistered(true))

    logger.info('Provider registered')

    return () => {
      clearDebounceTimer()
      clearProvider()
      setIsProviderRegistered(false)
    }
  }, [
    editorRef,
    enabled,
    triggerChars,
    debounceDelay,
    webGPUSupported,
    clearProvider,
    clearDebounceTimer,
    triggerAICompletion,
  ])

  return {
    providerRegistered: isProviderRegistered,
    isInferencing,
    activeModel,
    stats,
    webGPUSupported,
  }
}

/**
 * 简化版Hook：仅提供基本AI补全功能
 *
 * @example
 * ```tsx
 * function SimpleEditor() {
 *   const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
 *
 *   useBasicAICompletion(editorRef)
 *
 *   return <MonacoEditor ref={editorRef} />
 * }
 * ```
 */
export function useBasicAICompletion(
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>
) {
  return useAICompletionProvider(editorRef, {
    enabled: true,
    triggerChars: ['.', '(', '['],
    debounceDelay: 500,
    maxSuggestions: 3,
  })
}

/**
 * Hook：仅AI推理状态（用于显示加载状态等）
 *
 * @example
 * ```tsx
 * function AIStatusIndicator() {
 *   const { isInferencing, activeModel, stats } = useAICompletionStatus()
 *
 *   return (
 *     <div>
 *       {isInferencing && <Spinner />}
 *       <span>{activeModel?.name}</span>
 *       <span>{stats.avgInferenceTime.toFixed(0)}ms</span>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAICompletionStatus() {
  const { isInferencing, activeModel, stats, webGPUSupported } = useWebGPUInference({
    autoInitialize: true,
  })

  return {
    isInferencing,
    activeModel,
    stats,
    webGPUSupported,
  }
}

/**
 * 高级Hook：支持多种触发模式的AI补全
 *
 * @example
 * ```tsx
 * function AdvancedEditor() {
 *   const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
 *
 *   useAdvancedAICompletion(editorRef, {
 *     mode: 'hybrid',
 *     triggerOnSpace: true,
 *     triggerOnTyping: true,
 *     minTypingDelay: 1000,
 *   })
 *
 *   return <MonacoEditor ref={editorRef} />
 * }
 * ```
 */
export function useAdvancedAICompletion(
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>,
  options: {
    mode?: 'auto' | 'manual' | 'hybrid'
    triggerOnSpace?: boolean
    triggerOnTyping?: boolean
    minTypingDelay?: number
  } = {}
) {
  const { mode = 'auto', triggerOnSpace = true, triggerOnTyping = false, minTypingDelay = 1000 } =
    options

  const triggerChars = useMemo(() => {
    const chars = ['.', '(', '[', '{', '=']
    if (triggerOnSpace) chars.push(' ')
    if (triggerOnTyping) chars.push('\n')
    return chars
  }, [triggerOnSpace, triggerOnTyping])

  return useAICompletionProvider(editorRef, {
    enabled: mode !== 'manual',
    triggerChars,
    debounceDelay: minTypingDelay,
  })
}
