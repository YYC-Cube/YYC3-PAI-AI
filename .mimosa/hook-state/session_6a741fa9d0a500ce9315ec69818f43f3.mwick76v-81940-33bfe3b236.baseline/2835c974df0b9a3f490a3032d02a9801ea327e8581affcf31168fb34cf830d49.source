/**
 * @file syntax-highlighter.ts
 * @description 高性能语法高亮服务，集成Shiki实现增量高亮和大文件优化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-27
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,syntax,highlight,shiki,performance
 */

import type { Highlighter, BundledLanguage, BundledTheme } from 'shiki'
import { createLogger } from '../utils/logger'

const logger = createLogger('syntax-highlighter')

/**
 * 语法高亮配置
 */
export interface SyntaxHighlighterConfig {
  /** 默认主题 */
  theme?: BundledTheme
  /** 默认语言 */
  defaultLanguage?: string
  /** 是否启用缓存 */
  enableCache?: boolean
  /** 大文件阈值（行数） */
  largeFileThreshold?: number
  /** 增量高亮阈值（字符数） */
  incrementalThreshold?: number
}

/**
 * 高亮结果
 */
export interface HighlightResult {
  /** HTML字符串 */
  html: string
  /** 语言 */
  language: string
  /** 主题 */
  theme: string
  /** 是否使用缓存 */
  cached?: boolean
  /** 是否是增量高亮 */
  incremental?: boolean
  /** 处理时间（毫秒） */
  processTime?: number
}

/**
 * 增量高亮范围
 */
export interface IncrementalRange {
  /** 起始行号 */
  startLine: number
  /** 结束行号 */
  endLine: number
  /** 原始代码 */
  code: string
}

/**
 * 语法高亮服务
 *
 * 使用Shiki实现高性能语法高亮，支持：
 * - 增量高亮（只高亮变化的部分）
 * - 大文件优化（分批处理）
 * - 结果缓存（避免重复高亮）
 * - 多语言支持（100+语言）
 *
 * @example
 * ```typescript
 * const highlighter = new SyntaxHighlighter({
 *   theme: 'github-dark',
 *   defaultLanguage: 'typescript',
 *   enableCache: true,
 *   largeFileThreshold: 1000,
 *   incrementalThreshold: 5000,
 * })
 *
 * // 完整高亮
 * const result = await highlighter.highlight(code, 'typescript')
 *
 * // 增量高亮
 * const incremental = await highlighter.highlightIncremental([
 *   { startLine: 0, endLine: 100, code: firstChunk },
 *   { startLine: 100, endLine: 200, code: secondChunk },
 * ])
 *
 * // 大文件高亮
 * const large = await highlighter.highlightLarge(largeCode, 'typescript')
 * ```
 */
export class SyntaxHighlighter {
  private highlighter: Highlighter | null = null
  private config: Required<SyntaxHighlighterConfig>
  private cache: Map<string, HighlightResult>
  private pendingUpdates: Map<string, Set<number>>
  private largeFileQueue: Set<string>
  /** 共享初始化 Promise：并发调用共享同一次初始化；失败可重试（无轮询死等） */
  private initPromise: Promise<void> | null = null

  constructor(config: SyntaxHighlighterConfig = {}) {
    this.config = {
      theme: config.theme || 'github-dark',
      defaultLanguage: config.defaultLanguage || 'typescript',
      enableCache: config.enableCache !== false,
      largeFileThreshold: config.largeFileThreshold || 1000,
      incrementalThreshold: config.incrementalThreshold || 5000,
    }

    this.cache = new Map()
    this.pendingUpdates = new Map()
    this.largeFileQueue = new Set()
  }

  /**
   * 初始化高亮器（并发安全：共享单次初始化；失败清空句柄允许重试，
   * 替代历史的 setInterval 轮询——首次失败会让等待者永远空转）
   */
  async initialize(): Promise<void> {
    if (this.highlighter) {
      return
    }

    if (!this.initPromise) {
      const startTime = performance.now()
      this.initPromise = (async () => {
        const shiki = await import('shiki')
        this.highlighter = await shiki.createHighlighter({
          themes: [this.config.theme as BundledTheme],
          langs: [
            this.config.defaultLanguage as BundledLanguage,
            'javascript',
            'typescript',
            'tsx',
            'jsx',
            'python',
            'java',
            'cpp',
            'c',
            'go',
            'rust',
            'html',
            'css',
            'json',
            'markdown',
            'yaml',
            'bash',
            'shell',
            'sql',
          ],
        })
        const initTime = performance.now() - startTime
        logger.info(`Initialized in ${initTime.toFixed(2)}ms`)
      })().catch((error) => {
        // 失败：清空共享句柄，让后续调用可重试而非永久挂起
        this.initPromise = null
        logger.error('[SyntaxHighlighter] Initialization failed:', error)
        const initError = new Error('Failed to initialize syntax highlighter')
        if (error instanceof Error) {
          ;(initError as Error & { cause?: Error }).cause = error
        }
        throw initError
      })
    }

    return this.initPromise
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(code: string, language: string): string {
    return `${language}:${code.slice(0, 100)}:${code.length}`
  }

  /**
   * 高亮代码（完整）
   *
   * @param code - 代码字符串
   * @param language - 语言
   * @returns 高亮结果
   */
  async highlight(
    code: string,
    language: string = this.config.defaultLanguage,
  ): Promise<HighlightResult> {
    await this.initialize()

    const startTime = performance.now()

    // 检查缓存
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey(code, language)
      const cached = this.cache.get(cacheKey)
      if (cached) {
        logger.debug('[SyntaxHighlighter] Cache hit for', language)
        return { ...cached, cached: true }
      }
    }

    // 执行高亮
    if (!this.highlighter) {
      throw new Error('Highlighter not initialized')
    }

    const html = this.highlighter.codeToHtml(code, {
      lang: language,
      theme: this.config.theme as BundledTheme,
    })

    const result: HighlightResult = {
      html,
      language,
      theme: this.config.theme,
      cached: false,
      incremental: false,
      processTime: performance.now() - startTime,
    }

    // 保存到缓存
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey(code, language)
      this.cache.set(cacheKey, result)

      // 限制缓存大小（最多1000条）
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value
        if (firstKey) {
          this.cache.delete(firstKey)
        }
      }
    }

    return result
  }

  /**
   * 增量高亮
   *
   * 只高亮变化的部分，提高性能
   *
   * @param ranges - 变化范围列表
   * @param language - 语言
   * @returns 高亮结果列表
   */
  async highlightIncremental(
    ranges: IncrementalRange[],
    language: string = this.config.defaultLanguage,
  ): Promise<HighlightResult[]> {
    await this.initialize()

    const startTime = performance.now()
    const results: HighlightResult[] = []

    for (const range of ranges) {
      const code = range.code

      // 检查是否需要增量高亮
      if (code.length > this.config.incrementalThreshold) {
        logger.warn(
          `[SyntaxHighlighter] Code size (${code.length}) exceeds incremental threshold (${this.config.incrementalThreshold}), falling back to full highlight`,
        )
        const result = await this.highlight(code, language)
        results.push({ ...result, incremental: false })
        continue
      }

      // 增量高亮
      const cacheKey = this.getCacheKey(code, language)
      const cached = this.cache.get(cacheKey)

      if (cached) {
        results.push({ ...cached, cached: true, incremental: true })
      } else {
        const result = await this.highlight(code, language)
        results.push({ ...result, incremental: true })
      }
    }

    const totalTime = performance.now() - startTime
    logger.debug(
      `[SyntaxHighlighter] Incremental highlight: ${ranges.length} ranges in ${totalTime.toFixed(2)}ms`,
    )

    return results
  }

  /**
   * 大文件高亮
   *
   * 分批处理大文件，避免阻塞UI
   *
   * @param code - 完整代码
   * @param language - 语言
   * @param onProgress - 进度回调
   * @returns 高亮结果
   */
  async highlightLarge(
    code: string,
    language: string = this.config.defaultLanguage,
    onProgress?: (progress: number) => void,
  ): Promise<HighlightResult> {
    await this.initialize()

    const lines = code.split('\n')
    const lineCount = lines.length

    // 检查是否是大文件
    if (lineCount <= this.config.largeFileThreshold) {
      return this.highlight(code, language)
    }

    logger.debug(
      `[SyntaxHighlighter] Large file detected: ${lineCount} lines (threshold: ${this.config.largeFileThreshold})`,
    )

    // 分批处理
    const batchSize = 100 // 每批100行
    const batchCount = Math.ceil(lineCount / batchSize)
    const batches: string[][] = []

    for (let i = 0; i < batchCount; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, lineCount)
      const batch = lines.slice(start, end)
      batches.push(batch)
    }

    // 逐批高亮
    let html = ''
    const startTime = performance.now()

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchCode = batch.join('\n')

      const batchResult = await this.highlight(batchCode, language)

      // 去掉末尾的</pre>以便拼接
      const batchHtml = batchResult.html.replace(/<\/pre>\s*$/, '')
      html += batchHtml

      // 调用进度回调
      if (onProgress) {
        const progress = ((i + 1) / batches.length) * 100
        onProgress(progress)
      }

      // 让出主线程，避免阻塞UI
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    html += '</pre>'

    const totalTime = performance.now() - startTime
    const result: HighlightResult = {
      html,
      language,
      theme: this.config.theme,
      incremental: false,
      cached: false,
      processTime: totalTime,
    }

    logger.info(
      `[SyntaxHighlighter] Large file highlight completed: ${lineCount} lines in ${totalTime.toFixed(2)}ms`,
    )

    return result
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    logger.info('Cache cleared')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate?: number } {
    const stats = {
      size: this.cache.size,
    }
    return stats
  }

  /**
   * 销毁高亮器
   */
  destroy(): void {
    this.cache.clear()
    this.pendingUpdates.clear()
    this.largeFileQueue.clear()
    this.highlighter = null
    logger.info('Destroyed')
  }
}

/**
 * 全局单例
 */
let globalHighlighter: SyntaxHighlighter | null = null

/**
 * 获取全局高亮器实例
 *
 * @param config - 配置
 * @returns 高亮器实例
 */
export function getGlobalHighlighter(
  config?: SyntaxHighlighterConfig,
): SyntaxHighlighter {
  if (!globalHighlighter) {
    globalHighlighter = new SyntaxHighlighter(config)
  }
  return globalHighlighter
}

/**
 * 快捷高亮函数
 *
 * @param code - 代码
 * @param language - 语言
 * @returns 高亮结果
 */
export async function highlightCode(
  code: string,
  language?: string,
): Promise<string> {
  const highlighter = getGlobalHighlighter()
  const result = await highlighter.highlight(code, language)
  return result.html
}

/**
 * 检测语言
 *
 * 基于文件扩展名或内容推断语言
 *
 * @param fileName - 文件名
 * @param code - 代码内容（可选）
 * @returns 语言标识
 */
export function detectLanguage(
  fileName: string,
  _code?: string,
): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    html: 'html',
    xml: 'xml',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    yaml: 'yml',
    yml: 'yml',
    md: 'markdown',
    markdown: 'markdown',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    shell: 'shell',
    sql: 'sql',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
  }

  return languageMap[ext] || 'plaintext'
}
