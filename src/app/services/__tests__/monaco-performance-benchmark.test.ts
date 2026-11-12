/**
 * @file monaco-performance-benchmark.test.ts
 * @description Monaco 性能基准服务专项 — 未初始化守卫/指标统计（avg·P50·P95·P99）/五大子基准
 *              （文件打开·光标移动·语法高亮·协作光标·滚动）/runFullSuite 全链路与默认示例文件路径/
 *              generateReport 评分聚合（含 0 值守护·VS Code 对标）/printReport 输出/单例/React Hook
 * 策略：mock monaco editor 实例形状（getModel/setPosition/deltaDecorations/setScrollTop/revealLineInCenter + Range 构造器），
 *       logger 以 vi.mock 静音；rAF/setTimeout 用真实定时器（vitest jsdom pretendToBeVisual）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const logger = vi.hoisted(() => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}))

vi.mock('../../utils/logger', () => ({
  createLogger: () => logger,
}))

import {
  MonacoPerformanceBenchmark,
  getMonacoBenchmark,
  useMonacoBenchmark,
  PERFORMANCE_TARGETS,
  type PerformanceMetrics,
} from '../monaco-performance-benchmark'

// ── Mock 实例形状（对齐 MonacoPerformanceMonitor.test.tsx 的 mock 风格） ──

type EditorParam = Parameters<MonacoPerformanceBenchmark['setEditor']>[0]
type MonacoParam = Parameters<MonacoPerformanceBenchmark['setEditor']>[1]

const makeModel = () => ({
  setValue: vi.fn(),
  getLineCount: () => 50,
})

const makeEditor = () => {
  const model = makeModel()
  return {
    model,
    getModel: vi.fn(() => model),
    setPosition: vi.fn<(pos: { lineNumber: number; column: number }) => void>(),
    deltaDecorations: vi.fn<(oldIds: string[], decorations: Array<{ range: unknown; options: unknown }>) => string[]>(),
    setScrollTop: vi.fn<(top: number) => void>(),
    revealLineInCenter: vi.fn<(line: number) => void>(),
  }
}

type MockEditor = ReturnType<typeof makeEditor>

/** 仅在交给被测类时收紧为 monaco 编辑器类型（测试内部保留 vi.fn 断言能力） */
const asEditor = (e: MockEditor) => e as unknown as EditorParam

const makeMonaco = () => {
  class Range {
    startLineNumber: number
    endLineNumber: number
    constructor(sln: number, _sc: number, eln: number, _ec: number) {
      this.startLineNumber = sln
      this.endLineNumber = eln
    }
  }
  return { Range } as unknown as MonacoParam & { Range: unknown }
}

type MockMonaco = ReturnType<typeof makeMonaco>
const asMonaco = (m: MockMonaco) => m as unknown as MonacoParam

const SMALL_FILE = 'const a = 1\nconst b = 2\n'
const LARGE_FILE = '// large\n'.repeat(200)

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('MonacoPerformanceBenchmark（Monaco 性能基准服务）', () => {
  it('未初始化守卫：无 editor/monaco 时五个子基准全部返回空数组且告警', async () => {
    const bench = new MonacoPerformanceBenchmark()
    expect(await bench.testFileOpen(SMALL_FILE, 2)).toEqual([])
    expect(await bench.testCursorMovement(2)).toEqual([])
    expect(await bench.testSyntaxHighlighting(SMALL_FILE, 2)).toEqual([])
    expect(await bench.testCollaboratorCursors(2, 2)).toEqual([])
    expect(await bench.testScrolling(10, 2)).toEqual([])
    expect(logger.warn).toHaveBeenCalled()
  })

  it('start/stop/recordMetric/getMetricStats：均值与分位数统计正确；未知指标返回 null；start 清空历史', () => {
    const bench = new MonacoPerformanceBenchmark()
    bench.start()
    for (const v of [5, 1, 4, 2, 3]) bench.recordMetric('fileOpen', v)
    const stats = bench.getMetricStats('fileOpen')!
    expect(stats.avg).toBe(3)
    expect(stats.p50).toBe(3)
    expect(stats.p95).toBe(5)
    expect(stats.p99).toBe(5)
    expect(bench.getMetricStats('不存在')).toBeNull()
    // start 清空后统计归零
    bench.start()
    expect(bench.getMetricStats('fileOpen')).toBeNull()
    expect(bench.stop()).toBeGreaterThanOrEqual(0)
  })

  it('testFileOpen：按迭代次数 setValue + 计时入列，并写入 fileOpen 指标', async () => {
    const editor = makeEditor()
    const bench = new MonacoPerformanceBenchmark(asEditor(editor), asMonaco(makeMonaco()))
    const results = await bench.testFileOpen(SMALL_FILE, 3)
    expect(results).toHaveLength(3)
    for (const r of results) expect(r).toBeGreaterThanOrEqual(0)
    expect(editor.model.setValue).toHaveBeenCalledTimes(3)
    expect(editor.model.setValue).toHaveBeenCalledWith(SMALL_FILE)
    expect(bench.getMetricStats('fileOpen')).not.toBeNull()
  })

  it('testCursorMovement：按行数范围随机 setPosition；getModel 为 null 时返回空数组', async () => {
    const editor = makeEditor()
    const bench = new MonacoPerformanceBenchmark(asEditor(editor), asMonaco(makeMonaco()))
    const results = await bench.testCursorMovement(20)
    expect(results).toHaveLength(20)
    expect(editor.setPosition).toHaveBeenCalledTimes(20)
    const [pos] = editor.setPosition.mock.calls[0]
    expect(pos.lineNumber).toBeGreaterThanOrEqual(1)
    expect(pos.lineNumber).toBeLessThanOrEqual(50)
    expect(pos.column).toBeGreaterThanOrEqual(1)
    expect(pos.column).toBeLessThanOrEqual(80)
    expect(bench.getMetricStats('cursorMove')).not.toBeNull()
    // 无模型守卫
    const nullModelEditor = makeEditor()
    ;(nullModelEditor.getModel as ReturnType<typeof vi.fn>).mockReturnValue(null)
    const bench2 = new MonacoPerformanceBenchmark(asEditor(nullModelEditor), asMonaco(makeMonaco()))
    expect(await bench2.testCursorMovement(5)).toEqual([])
  })

  it('testCollaboratorCursors：monaco.Range 实例化 userCount 个装饰并在每次迭代 deltaDecorations', async () => {
    const editor = makeEditor()
    const monaco = makeMonaco()
    const bench = new MonacoPerformanceBenchmark(asEditor(editor), asMonaco(monaco))
    const results = await bench.testCollaboratorCursors(4, 2)
    expect(results).toHaveLength(2)
    expect(editor.deltaDecorations).toHaveBeenCalledTimes(2)
    const decorations = editor.deltaDecorations.mock.calls[0][1]
    expect(decorations).toHaveLength(4)
    const RangeClass = monaco.Range as unknown as { new (...args: unknown[]): unknown }
    for (const d of decorations) {
      expect(d.range).toBeInstanceOf(RangeClass)
    }
    expect(bench.getMetricStats('collabDecorations')).not.toBeNull()
  })

  it('testScrolling：先回顶再逐次 revealLineInCenter(scrollLines) 并在迭代间归位', async () => {
    const editor = makeEditor()
    const bench = new MonacoPerformanceBenchmark(asEditor(editor), asMonaco(makeMonaco()))
    const results = await bench.testScrolling(80, 3)
    expect(results).toHaveLength(3)
    expect(editor.revealLineInCenter).toHaveBeenCalledTimes(3)
    expect(editor.revealLineInCenter).toHaveBeenCalledWith(80)
    // 每次迭代前后各 setScrollTop(0) → 共 1 + 3 次
    expect(editor.setScrollTop.mock.calls.filter(c => c[0] === 0)).toHaveLength(4)
    expect(bench.getMetricStats('scrolling')).not.toBeNull()
  })

  it('runFullSuite：全链路跑通五个子基准并返回完整指标报告（含 P50/P95/P99/评分/对标）', async () => {
    const editor = makeEditor()
    const bench = new MonacoPerformanceBenchmark(asEditor(editor), asMonaco(makeMonaco()))
    const report = await bench.runFullSuite({
      fileContent: SMALL_FILE,
      largeFileContent: LARGE_FILE,
      iterations: 2,
    })
    // 报告字段完整
    expect(report.fileOpenTime).toBeGreaterThanOrEqual(0)
    expect(report.cursorMoveTime).toBeGreaterThanOrEqual(0)
    expect(report.syntaxHighlightTime).toBeGreaterThanOrEqual(0)
    expect(report.memoryUsage).toBe(0) // jsdom 无 performance.memory → 0 兜底
    expect(report.overallScore).toBeGreaterThan(0)
    expect(report.vsCodeScore).toBe(report.overallScore)
    // 五类指标均有采样
    expect(bench.getMetricStats('fileOpen')).not.toBeNull()
    expect(bench.getMetricStats('cursorMove')).not.toBeNull()
    expect(bench.getMetricStats('syntaxHighlight')).not.toBeNull()
    expect(bench.getMetricStats('collabDecorations')).not.toBeNull()
    expect(bench.getMetricStats('scrolling')).not.toBeNull()
    // 语法高亮用大文件内容（iterations/2 = 1 次）
    expect(editor.model.setValue).toHaveBeenCalledWith(LARGE_FILE)
    // printReport 全量输出被调用
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('性能基准测试报告'))
  }, 30000)

  it('runFullSuite 默认参数路径：fileContent 走 generateSampleFile(1000) 采样', async () => {
    const editor = makeEditor()
    const bench = new MonacoPerformanceBenchmark(asEditor(editor), asMonaco(makeMonaco()))
    await bench.runFullSuite({ largeFileContent: LARGE_FILE, iterations: 2 })
    // 默认示例文件首行注释可被 setValue 捕获
    const firstCall = editor.model.setValue.mock.calls[0][0] as string
    expect(firstCall).toContain('// Sample line 1')
    expect(firstCall).toContain('function test0()')
  }, 30000)

  it('generateReport 评分聚合：达标计 100 分上限，部分达标按比例折算，overallScore 为四项均值', () => {
    const bench = new MonacoPerformanceBenchmark()
    // fileOpen=100ms（目标 200 → 200%）→ 100；cursor=32ms（目标 16 → 50）；syntax=50ms（目标 100 → 200）→ 100
    bench.recordMetric('fileOpen', 100)
    bench.recordMetric('cursorMove', 32)
    bench.recordMetric('syntaxHighlight', 50)
    const report = bench.generateReport()
    expect(report.fileOpenTime).toBe(100)
    expect(report.cursorMoveTime).toBe(32)
    expect(report.syntaxHighlightTime).toBe(50)
    // (100 + 50 + 100 + 100[memory=0 → Infinity→100]) / 4 = 87.5
    expect(report.overallScore).toBeCloseTo(87.5, 5)
    expect(report.vsCodeScore).toBeCloseTo(87.5, 5)
    expect(report.memoryLeakRate).toBe(0)
    expect(report.cpuUsage).toBe(0)
    expect(PERFORMANCE_TARGETS.fileOpenTime).toBe(200)
  })

  it('printReport + 优化建议：指标超标时输出对应建议段，正常时输出良好提示', () => {
    const bench = new MonacoPerformanceBenchmark()
    // 全部超标 → 四组建议 + 无泄漏提示
    bench.recordMetric('fileOpen', 999)
    bench.recordMetric('cursorMove', 999)
    bench.recordMetric('syntaxHighlight', 999)
    bench.generateReport()
    expect(() => bench.printReport()).not.toThrow()
    const texts = logger.log.mock.calls.map(c => c.join(' ')).join('\n')
    expect(texts).toContain('文件打开时间过长')
    expect(texts).toContain('光标移动延迟过高')
    expect(texts).toContain('语法高亮渲染慢')
    // 良好路径
    logger.log.mockClear()
    const good = new MonacoPerformanceBenchmark()
    good.recordMetric('fileOpen', 10)
    good.recordMetric('cursorMove', 1)
    good.recordMetric('syntaxHighlight', 5)
    good.printReport()
    const goodTexts = logger.log.mock.calls.map(c => c.join(' ')).join('\n')
    expect(goodTexts).toContain('当前性能表现良好')
  })

  it('getMonacoBenchmark 单例：多次获取同一实例且行为共享', async () => {
    const a = getMonacoBenchmark()
    const b = getMonacoBenchmark()
    expect(a).toBe(b)
    a.recordMetric('fileOpen', 42)
    expect(b.getMetricStats('fileOpen')!.avg).toBe(42)
  })

  it('useMonacoBenchmark Hook：初始态为空且未运行；runQuickTest 返回光标均值；runBenchmark 全链路写入 metrics', async () => {
    const editor = makeEditor()
    const monaco = makeMonaco()
    const { result } = renderHook(() => useMonacoBenchmark())
    expect(result.current.metrics).toBeNull()
    expect(result.current.isRunning).toBe(false)
    // 快测
    let quick: { cursorMoveAvg: number } | undefined
    await act(async () => {
      quick = await result.current.runQuickTest(asEditor(editor), asMonaco(monaco))
    })
    expect(quick!.cursorMoveAvg).toBeGreaterThanOrEqual(0)
    // 全链路（默认大文件构造较重，放宽超时）
    let metrics: PerformanceMetrics | undefined
    await act(async () => {
      metrics = await result.current.runBenchmark(asEditor(editor), asMonaco(monaco))
    })
    expect(metrics!.overallScore).toBeGreaterThan(0)
    expect(result.current.metrics).not.toBeNull()
    expect(result.current.metrics!.overallScore).toBe(metrics!.overallScore)
    expect(result.current.isRunning).toBe(false)
  }, 30000)
})
