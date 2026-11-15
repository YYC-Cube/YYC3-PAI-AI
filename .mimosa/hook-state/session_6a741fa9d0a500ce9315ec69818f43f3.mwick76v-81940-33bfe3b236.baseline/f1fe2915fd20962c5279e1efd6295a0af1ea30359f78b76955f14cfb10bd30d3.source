/**
 * @file monaco-performance-benchmark.ts
 * @description Monaco Editor性能基准测试套件 - 用于识别性能瓶颈
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance,benchmark,monaco,monitoring
 */

import type * as monaco from 'monaco-editor'
import { createLogger } from '../utils/logger'

const logger = createLogger('monaco-benchmark')

// ===== 性能指标类型 =====
export interface PerformanceMetrics {
  // 文件加载性能
  fileOpenTime: number
  fileOpenP50: number
  fileOpenP95: number
  fileOpenP99: number

  // 编辑器响应性能
  cursorMoveTime: number
  cursorMoveP50: number
  cursorMoveP95: number
  cursorMoveP99: number

  // 渲染性能
  syntaxHighlightTime: number
  syntaxHighlightP50: number
  syntaxHighlightP95: number
  syntaxHighlightP99: number

  // 内存占用
  memoryUsage: number
  memoryLeakRate: number

  // CPU占用
  cpuUsage: number

  // 总体评分
  overallScore: number
  vsCodeScore: number // 对比VS Code的百分比
}

// ===== 性能测试用例 =====
export interface BenchmarkCase {
  name: string
  description: string
  run: () => Promise<number>
  iterations: number
  warmupIterations: number
}

// ===== 性能基准目标 =====
export const PERFORMANCE_TARGETS = {
  // VS Code基准
  fileOpenTime: 200, // ms, 文件打开时间
  cursorMoveTime: 16, // ms, 光标移动延迟
  syntaxHighlightTime: 100, // ms, 10万行文件高亮
  memoryUsage: 500, // MB, 内存占用
  cpuUsage: 20, // %, CPU占用

  // YYC³当前基线（需要测量）
  current: {
    fileOpenTime: 500, // ms, 预估
    cursorMoveTime: 30, // ms, 预估
    syntaxHighlightTime: 300, // ms, 预估
    memoryUsage: 1000, // MB, 预估
    cpuUsage: 50, // %, 预估
  },
} as const

// ===== 性能基准测试套件 =====
export class MonacoPerformanceBenchmark {
  private metrics: Map<string, number[]> = new Map()
  private memorySnapshots: number[] = []
  private startTime: number = 0
  private editor: monaco.editor.IStandaloneCodeEditor | null = null
  private monaco: typeof monaco | null = null

  constructor(editor?: monaco.editor.IStandaloneCodeEditor, monacoInstance?: typeof monaco) {
    this.editor = editor || null
    this.monaco = monacoInstance || null
  }

  /**
   * 设置编辑器实例
   */
  setEditor(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) {
    this.editor = editor
    this.monaco = monacoInstance
  }

  /**
   * 开始基准测试
   */
  start() {
    this.startTime = performance.now()
    this.metrics.clear()
    this.memorySnapshots = []
    this.captureMemorySnapshot()
  }

  /**
   * 结束基准测试
   */
  stop() {
    const totalTime = performance.now() - this.startTime
    this.captureMemorySnapshot()
    return totalTime
  }

  /**
   * 记录指标
   */
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  /**
   * 获取指标统计
   */
  getMetricStats(name: string): { avg: number; p50: number; p95: number; p99: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    const avg = sum / sorted.length

    return {
      avg,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  /**
   * 捕获内存快照
   */
  captureMemorySnapshot() {
    if ('memory' in performance) {
      const perfWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number
        }
      }
      const mem = perfWithMemory.memory
      if (mem) {
        this.memorySnapshots.push(mem.usedJSHeapSize / 1024 / 1024) // MB
      }
    }
  }

  /**
   * 计算内存泄漏率
   */
  calculateMemoryLeakRate(): number {
    if (this.memorySnapshots.length < 2) return 0

    const first = this.memorySnapshots[0]
    const last = this.memorySnapshots[this.memorySnapshots.length - 1]
    const duration = (performance.now() - this.startTime) / 1000 / 60 // 分钟

    return duration > 0 ? (last - first) / duration : 0 // MB/min
  }

  /**
   * 测试1: 文件打开性能
   */
  async testFileOpen(content: string, iterations = 10): Promise<number[]> {
    if (!this.editor || !this.monaco) {
      logger.warn('[MonacoPerformanceBenchmark] Editor not initialized')
      return []
    }

    const results: number[] = []
    const model = this.editor.getModel()

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()

      // 设置新内容
      model?.setValue(content)

      // 等待渲染完成
      await new Promise(resolve => requestAnimationFrame(resolve))
      await new Promise(resolve => setTimeout(resolve, 10))

      const end = performance.now()
      results.push(end - start)
    }

    results.forEach(result => this.recordMetric('fileOpen', result))
    return results
  }

  /**
   * 测试2: 光标移动性能
   */
  async testCursorMovement(iterations = 100): Promise<number[]> {
    if (!this.editor || !this.monaco) {
      logger.warn('[MonacoPerformanceBenchmark] Editor not initialized')
      return []
    }

    const results: number[] = []
    const model = this.editor.getModel()
    if (!model) return []

    const lineCount = model.getLineCount()

    for (let i = 0; i < iterations; i++) {
      const line = Math.floor(Math.random() * lineCount) + 1
      const col = Math.floor(Math.random() * 80) + 1

      const start = performance.now()
      this.editor.setPosition({ lineNumber: line, column: col })
      const end = performance.now()

      results.push(end - start)
    }

    results.forEach(result => this.recordMetric('cursorMove', result))
    return results
  }

  /**
   * 测试3: 语法高亮性能
   */
  async testSyntaxHighlighting(content: string, iterations = 10): Promise<number[]> {
    if (!this.editor || !this.monaco) {
      logger.warn('[MonacoPerformanceBenchmark] Editor not initialized')
      return []
    }

    const results: number[] = []
    const model = this.editor.getModel()

    for (let i = 0; i < iterations; i++) {
      // 设置大文件内容
      model?.setValue(content)

      // 测量渲染时间
      const start = performance.now()
      await new Promise(resolve => requestAnimationFrame(resolve))
      await new Promise(resolve => setTimeout(resolve, 50)) // 等待异步渲染
      const end = performance.now()

      results.push(end - start)
    }

    results.forEach(result => this.recordMetric('syntaxHighlight', result))
    return results
  }

  /**
   * 测试4: 协作光标更新性能
   */
  async testCollaboratorCursors(userCount = 10, iterations = 10): Promise<number[]> {
    if (!this.editor || !this.monaco) {
      logger.warn('[MonacoPerformanceBenchmark] Editor not initialized')
      return []
    }

    const results: number[] = []
    const model = this.editor.getModel()
    if (!model) return []

    // 生成随机用户光标
    const decorations = Array.from({ length: userCount }, (_, i) => {
      const line = Math.floor(Math.random() * 100) + 1
      return {
        range: new this.monaco!.Range(line, 1, line, 2),
        options: {
          className: `collab-cursor-${i}`,
          stickiness: 1,
        },
      }
    })

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()

      // 添加/更新装饰
      this.editor.deltaDecorations([], decorations)

      await new Promise(resolve => requestAnimationFrame(resolve))

      const end = performance.now()
      results.push(end - start)
    }

    results.forEach(result => this.recordMetric('collabDecorations', result))
    return results
  }

  /**
   * 测试5: 滚动性能
   */
  async testScrolling(scrollLines = 100, iterations = 10): Promise<number[]> {
    if (!this.editor || !this.monaco) {
      logger.warn('[MonacoPerformanceBenchmark] Editor not initialized')
      return []
    }

    const results: number[] = []
    const model = this.editor.getModel()
    if (!model) return []

    // 滚动到顶部
    this.editor.setScrollTop(0)
    await new Promise(resolve => requestAnimationFrame(resolve))

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()

      // 滚动到指定行
      this.editor.revealLineInCenter(scrollLines)
      await new Promise(resolve => requestAnimationFrame(resolve))

      const end = performance.now()
      results.push(end - start)

      // 滚回顶部
      this.editor.setScrollTop(0)
      await new Promise(resolve => requestAnimationFrame(resolve))
    }

    results.forEach(result => this.recordMetric('scrolling', result))
    return results
  }

  /**
   * 生成综合性能报告
   */
  generateReport(): PerformanceMetrics {
    const fileOpenStats = this.getMetricStats('fileOpen')
    const cursorMoveStats = this.getMetricStats('cursorMove')
    const syntaxHighlightStats = this.getMetricStats('syntaxHighlight')

    const fileOpenTime = fileOpenStats?.avg || 0
    const cursorMoveTime = cursorMoveStats?.avg || 0
    const syntaxHighlightTime = syntaxHighlightStats?.avg || 0
    const memoryUsage = this.memorySnapshots[this.memorySnapshots.length - 1] || 0
    const memoryLeakRate = this.calculateMemoryLeakRate()

    // 计算VS Code对标分数
    const fileOpenScore = Math.min(100, (PERFORMANCE_TARGETS.fileOpenTime / fileOpenTime) * 100)
    const cursorMoveScore = Math.min(100, (PERFORMANCE_TARGETS.cursorMoveTime / cursorMoveTime) * 100)
    const syntaxHighlightScore = Math.min(100, (PERFORMANCE_TARGETS.syntaxHighlightTime / syntaxHighlightTime) * 100)
    const memoryScore = Math.min(100, (PERFORMANCE_TARGETS.memoryUsage / memoryUsage) * 100)

    const overallScore = (fileOpenScore + cursorMoveScore + syntaxHighlightScore + memoryScore) / 4

    return {
      fileOpenTime,
      fileOpenP50: fileOpenStats?.p50 || 0,
      fileOpenP95: fileOpenStats?.p95 || 0,
      fileOpenP99: fileOpenStats?.p99 || 0,

      cursorMoveTime,
      cursorMoveP50: cursorMoveStats?.p50 || 0,
      cursorMoveP95: cursorMoveStats?.p95 || 0,
      cursorMoveP99: cursorMoveStats?.p99 || 0,

      syntaxHighlightTime,
      syntaxHighlightP50: syntaxHighlightStats?.p50 || 0,
      syntaxHighlightP95: syntaxHighlightStats?.p95 || 0,
      syntaxHighlightP99: syntaxHighlightStats?.p99 || 0,

      memoryUsage,
      memoryLeakRate,
      cpuUsage: 0, // 需要额外实现CPU监控

      overallScore,
      vsCodeScore: overallScore,
    }
  }

  /**
   * 打印性能报告
   */
  printReport() {
    const report = this.generateReport()
    logger.log('=== Monaco Editor 性能基准测试报告 ===\n')

    logger.log('📊 文件打开性能:')
    logger.log(`  平均时间: ${report.fileOpenTime.toFixed(2)}ms`)
    logger.log(`  P50: ${report.fileOpenP50.toFixed(2)}ms`)
    logger.log(`  P95: ${report.fileOpenP95.toFixed(2)}ms`)
    logger.log(`  P99: ${report.fileOpenP99.toFixed(2)}ms`)
    logger.log(`  目标: ${PERFORMANCE_TARGETS.fileOpenTime}ms (VS Code)`)
    logger.log(`  达成率: ${(PERFORMANCE_TARGETS.fileOpenTime / report.fileOpenTime * 100).toFixed(1)}%\n`)

    logger.log('⚡ 光标移动性能:')
    logger.log(`  平均时间: ${report.cursorMoveTime.toFixed(2)}ms`)
    logger.log(`  P50: ${report.cursorMoveP50.toFixed(2)}ms`)
    logger.log(`  P95: ${report.cursorMoveP95.toFixed(2)}ms`)
    logger.log(`  P99: ${report.cursorMoveP99.toFixed(2)}ms`)
    logger.log(`  目标: ${PERFORMANCE_TARGETS.cursorMoveTime}ms (VS Code)`)
    logger.log(`  达成率: ${(PERFORMANCE_TARGETS.cursorMoveTime / report.cursorMoveTime * 100).toFixed(1)}%\n`)

    logger.log('🎨 语法高亮性能:')
    logger.log(`  平均时间: ${report.syntaxHighlightTime.toFixed(2)}ms`)
    logger.log(`  P50: ${report.syntaxHighlightP50.toFixed(2)}ms`)
    logger.log(`  P95: ${report.syntaxHighlightP95.toFixed(2)}ms`)
    logger.log(`  P99: ${report.syntaxHighlightP99.toFixed(2)}ms`)
    logger.log(`  目标: ${PERFORMANCE_TARGETS.syntaxHighlightTime}ms (VS Code)`)
    logger.log(`  达成率: ${(PERFORMANCE_TARGETS.syntaxHighlightTime / report.syntaxHighlightTime * 100).toFixed(1)}%\n`)

    logger.log('💾 内存使用:')
    logger.log(`  当前占用: ${report.memoryUsage.toFixed(2)}MB`)
    logger.log(`  目标: ${PERFORMANCE_TARGETS.memoryUsage}MB (VS Code)`)
    logger.log(`  达成率: ${(PERFORMANCE_TARGETS.memoryUsage / report.memoryUsage * 100).toFixed(1)}%`)
    logger.log(`  泄漏率: ${report.memoryLeakRate.toFixed(2)}MB/min\n`)

    logger.log('🎯 总体评分:')
    logger.log(`  综合得分: ${report.overallScore.toFixed(1)}/100`)
    logger.log(`  VS Code对标: ${report.vsCodeScore.toFixed(1)}%\n`)

    logger.log('=== 性能优化建议 ===\n')
    this.printOptimizationSuggestions(report)
  }

  /**
   * 打印优化建议
   */
  private printOptimizationSuggestions(report: PerformanceMetrics) {
    const suggestions: string[] = []

    // 文件打开优化建议
    if (report.fileOpenTime > PERFORMANCE_TARGETS.fileOpenTime * 1.5) {
      suggestions.push('⚠️  文件打开时间过长，建议:')
      suggestions.push('   • 优化initial editor creation时间')
      suggestions.push('   • 考虑使用Monaco的延迟加载特性')
      suggestions.push('   • 实现虚拟滚动减少渲染压力')
    }

    // 光标移动优化建议
    if (report.cursorMoveTime > PERFORMANCE_TARGETS.cursorMoveTime * 1.5) {
      suggestions.push('⚠️  光标移动延迟过高，建议:')
      suggestions.push('   • 优化editor.updateOptions调用频率')
      suggestions.push('   • 减少不必要的状态更新')
      suggestions.push('   • 使用requestAnimationFrame节流更新')
    }

    // 语法高亮优化建议
    if (report.syntaxHighlightTime > PERFORMANCE_TARGETS.syntaxHighlightTime * 1.5) {
      suggestions.push('⚠️  语法高亮渲染慢，建议:')
      suggestions.push('   • 考虑使用增量高亮渲染')
      suggestions.push('   • 优化token provider实现')
      suggestions.push('   • 对超大文件实现分块渲染')
    }

    // 内存优化建议
    if (report.memoryUsage > PERFORMANCE_TARGETS.memoryUsage * 1.5) {
      suggestions.push('⚠️  内存占用过高，建议:')
      suggestions.push('   • 检查模型清理逻辑')
      suggestions.push('   • 实现model的dispose和复用')
      suggestions.push('   • 优化decorations管理')
    }

    if (report.memoryLeakRate > 5) {
      suggestions.push('🚨  检测到内存泄漏，建议:')
      suggestions.push('   • 检查事件监听器是否正确清理')
      suggestions.push('   • 验证ref.current的引用清理')
      suggestions.push('   • 使用React DevTools Profiler分析')
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ 当前性能表现良好，符合VS Code基准!')
    }

    suggestions.forEach(s => logger.log(s))
    logger.log('')
  }

  /**
   * 运行完整基准测试套件
   */
  async runFullSuite(options: {
    fileContent?: string
    largeFileContent?: string
    iterations?: number
  } = {}): Promise<PerformanceMetrics> {
    const {
      fileContent = this.generateSampleFile(1000),
      largeFileContent = this.generateLargeFile(100000),
      iterations = 10,
    } = options

    logger.log('🚀 开始Monaco Editor性能基准测试...\n')

    this.start()

    // 1. 文件打开性能测试
    logger.log('📝 测试1: 文件打开性能...')
    await this.testFileOpen(fileContent, iterations)
    logger.log('   ✓ 完成\n')

    // 2. 光标移动性能测试
    logger.log('⚡ 测试2: 光标移动性能...')
    await this.testCursorMovement(100)
    logger.log('   ✓ 完成\n')

    // 3. 语法高亮性能测试
    logger.log('🎨 测试3: 语法高亮性能...')
    await this.testSyntaxHighlighting(largeFileContent, Math.floor(iterations / 2))
    logger.log('   ✓ 完成\n')

    // 4. 协作光标性能测试
    logger.log('👥 测试4: 协作光标性能...')
    await this.testCollaboratorCursors(10, iterations)
    logger.log('   ✓ 完成\n')

    // 5. 滚动性能测试
    logger.log('📜 测试5: 滚动性能...')
    await this.testScrolling(100, iterations)
    logger.log('   ✓ 完成\n')

    this.stop()

    // 生成并打印报告
    this.printReport()

    return this.generateReport()
  }

  /**
   * 生成示例文件内容
   */
  private generateSampleFile(lines = 1000): string {
    const code = []
    for (let i = 0; i < lines; i++) {
      code.push(
        `// Sample line ${i + 1}`,
        `function test${i}() {`,
        `  const value = ${i};`,
        `  return value * 2;`,
        `}`,
        ''
      )
    }
    return code.join('\n')
  }

  /**
   * 生成大文件内容
   */
  private generateLargeFile(lines = 100000): string {
    const code: string[] = []
    for (let i = 0; i < lines; i++) {
      code.push(
        `// Large file line ${i + 1}`,
        `export function largeFunction${i}(param${i}: any): any {`,
        `  // Function body with ${i} iterations`,
        `  const result = {`,
        `    id: ${i},`,
        `    name: 'function${i}',`,
        `    data: Array.from({ length: 10 }, (_, j) => ({`,
        `      key: 'item_\${i}_\${j}',`,
        `      value: Math.random() * 100,`,
        `      nested: {`,
        `        level1: {`,
        `          level2: {`,
        `            level3: 'deep nesting',`,
        `          },`,
        `        },`,
        `      },`,
        `    })),`,
        `  };`,
        `  return result;`,
        `}`,
        ''
      )
    }
    return code.join('\n')
  }
}

// ===== 单例导出 =====
let benchmarkInstance: MonacoPerformanceBenchmark | null = null

export function getMonacoBenchmark() {
  if (!benchmarkInstance) {
    benchmarkInstance = new MonacoPerformanceBenchmark()
  }
  return benchmarkInstance
}

// ===== React Hook导出 =====
export function useMonacoBenchmark() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runBenchmark = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    setIsRunning(true)
    const benchmark = new MonacoPerformanceBenchmark(editor, monacoInstance)
    const result = await benchmark.runFullSuite()
    setMetrics(result)
    setIsRunning(false)
    return result
  }, [])

  const runQuickTest = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    const benchmark = new MonacoPerformanceBenchmark(editor, monacoInstance)
    const cursorMove = await benchmark.testCursorMovement(50)
    return { cursorMoveAvg: cursorMove.reduce((a, b) => a + b, 0) / cursorMove.length }
  }, [])

  return { metrics, isRunning, runBenchmark, runQuickTest }
}

// 导入React hook需要的useState和useCallback
import { useCallback, useState } from 'react'
