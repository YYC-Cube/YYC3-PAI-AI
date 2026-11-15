/**
 * @file AICompletionProvider.test.tsx
 * @description Monaco AI 补全 Provider Hook 专项 — Provider 注册生命周期（editor/enabled/webgpu 三重门控·卸载 dispose）/
 *              触发字符守卫/防抖触发/推理输出解析（函数·字符串·注释·逐行回退·maxSuggestions 截断）/
 *              AI 标记（isAI/range/detail/documentation/sortText）/customHandler 优先/推理异常/简化与高级 Hook
 * 策略：monaco-editor 与 useWebGPUInference 均 vi.mock 桩；防抖用 vi.useFakeTimers 推进
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useRef } from 'react'

const h = vi.hoisted(() => ({
  hook: {
    infer: vi.fn(),
    isInferencing: false,
    activeModel: { name: 'GLM-4.6' } as { name: string } | null,
    stats: { avgInferenceTime: 42 },
    webGPUSupported: true,
  },
  register: vi.fn(),
}))

vi.mock('../../hooks/useWebGPUInference', () => ({
  useWebGPUInference: () => h.hook,
}))

vi.mock('monaco-editor', () => {
  const Kind = { Function: 'function-kind', Text: 'text-kind', Snippet: 'snippet-kind' }
  class MockRange {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
    constructor(sln: number, sc: number, eln: number, ec: number) {
      this.startLineNumber = sln
      this.startColumn = sc
      this.endLineNumber = eln
      this.endColumn = ec
    }
  }
  return {
    languages: {
      CompletionItemKind: Kind,
      registerCompletionItemProvider: (...args: unknown[]) => h.register(...args),
    },
    Range: MockRange,
  }
})

import {
  useAICompletionProvider,
  useBasicAICompletion,
  useAICompletionStatus,
  useAdvancedAICompletion,
  type AICompletionItem,
  type AICompletionProviderOptions,
} from '../AICompletionProvider'
import type * as Monaco from 'monaco-editor'

// ── Fixtures / Helpers ──

type Provider = Monaco.languages.CompletionItemProvider
const fakeEditor = { getModel: () => null } as unknown as Monaco.editor.IStandaloneCodeEditor
const posAt = (line: string) => ({ lineNumber: 1, column: line.length + 1 }) as unknown as Monaco.Position
const lineModel = (line: string) => ({ getLineContent: () => line }) as unknown as Monaco.editor.ITextModel

// 稳定的 triggerChars 引用：源码 options 解构默认值每次渲染重建数组（见疑似 bug 清单），
// 会令注册 effect 依赖抖动 → 测试桩下无限重渲染。Harness 固定传入以隔离验证业务分支。
const STABLE_TRIGGERS = ['.', '(', '[', '{', '=', ' ', '\n']

function Harness({ options, withEditor = true }: { options?: AICompletionProviderOptions; withEditor?: boolean }) {
  const ref = useRef<Monaco.editor.IStandaloneCodeEditor | null>(withEditor ? fakeEditor : null)
  const res = useAICompletionProvider(ref, { triggerChars: STABLE_TRIGGERS, ...options })
  return (
    <div>
      <span data-testid="registered">{String(res.providerRegistered)}</span>
      <span data-testid="model">{res.activeModel?.name ?? 'none'}</span>
      <span data-testid="stats">{String(res.stats.avgInferenceTime)}</span>
    </div>
  )
}

function StatusHarness() {
  const res = useAICompletionStatus()
  return <span data-testid="s">{`${res.isInferencing}|${res.webGPUSupported}|${res.stats.avgInferenceTime}`}</span>
}

const BasicHarness = () => {
  const ref = useRef<Monaco.editor.IStandaloneCodeEditor | null>(fakeEditor)
  useBasicAICompletion(ref)
  return null
}

const AdvHarness = ({ mode }: { mode: 'auto' | 'manual' }) => {
  const ref = useRef<Monaco.editor.IStandaloneCodeEditor | null>(fakeEditor)
  useAdvancedAICompletion(ref, { mode })
  return null
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  // 仅伪造 setTimeout/clearTimeout：queueMicrotask/performance 若一并伪造会让 React 异步 act 挂起
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  h.hook.isInferencing = false
  h.hook.webGPUSupported = true
  h.hook.activeModel = { name: 'GLM-4.6' }
  h.register.mockImplementation(() => ({ dispose: vi.fn() }))
})

afterEach(() => {
  vi.useRealTimers()
})

/** 在指定 render 树内取 testid 文本（render 结果查询绑定 baseElement，同测试多树时须用 container 收窄） */
const txt = (utils: { container: HTMLElement }, id: string) =>
  utils.container.querySelector(`[data-testid="${id}"]`)!.textContent

/** monaco 类型声明 provideCompletionItems 需 4 参，桩内仅需 model/position 两参 */
type Provide2 = (model: Monaco.editor.ITextModel, position: Monaco.Position) => Promise<Monaco.languages.CompletionList>
const provide = (provider: Provider, m: Monaco.editor.ITextModel, pos: Monaco.Position) =>
  (provider.provideCompletionItems as unknown as Provide2)(m, pos)

const lastProvider = () =>
  h.register.mock.calls.length
    ? (h.register.mock.calls[h.register.mock.calls.length - 1][1] as Provider)
    : null

/** 走完防抖并取回补全结果 */
const complete = async (line: string, options?: AICompletionProviderOptions) => {
  render(<Harness options={options} />)
  const provider = lastProvider()!
  const p = provide(provider, lineModel(line), posAt(line))
  act(() => { vi.advanceTimersByTime(500) })
  return (await p) as Monaco.languages.CompletionList
}

describe('AICompletionProvider（Monaco AI 补全）', () => {
  it('三重门控：editor 就绪且启用 → 以 "*" 注册 Provider 且 registered=true；webGPU 不支持/editor 缺失/enabled=false 均不注册', async () => {
    const first = render(<Harness />)
    expect(h.register).toHaveBeenCalledTimes(1)
    expect(h.register.mock.calls[0][0]).toBe('*')
    // queueMicrotask 置位需等微任务清空（异步 act 负责冲洗）
    await act(async () => {})
    expect(txt(first, 'registered')).toBe('true')
    expect(txt(first, 'model')).toBe('GLM-4.6')
    expect(txt(first, 'stats')).toBe('42')
    // state 稳定后不重复注册
    expect(h.register).toHaveBeenCalledTimes(1)

    // webGPU 不支持 → 不注册（同文件独立 render，各自断言各自树）
    h.hook.webGPUSupported = false
    const second = render(<Harness />)
    expect(h.register).toHaveBeenCalledTimes(1)
    expect(txt(second, 'registered')).toBe('false')

    // editor 缺失 → clearProvider 分支
    h.hook.webGPUSupported = true
    render(<Harness withEditor={false} />)
    expect(h.register).toHaveBeenCalledTimes(1)

    // enabled=false → clearProvider 分支
    const fourth = render(<Harness options={{ enabled: false }} />)
    expect(h.register).toHaveBeenCalledTimes(1)
    expect(txt(fourth, 'registered')).toBe('false')
  })

  it('unmount 清理：dispose 被调用', () => {
    const dispose = vi.fn()
    h.register.mockImplementation(() => ({ dispose }))
    const { unmount } = render(<Harness />)
    expect(h.register).toHaveBeenCalledTimes(1)
    unmount()
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('触发守卫：光标前文本不以触发字符结尾 → 返回空建议且不发起推理', async () => {
    render(<Harness />)
    const provider = lastProvider()!
    const res = await provide(provider, lineModel('const plainText'), posAt('const plainText'))
    expect((res as Monaco.languages.CompletionList).suggestions).toHaveLength(0)
    expect(h.hook.infer).not.toHaveBeenCalled()
  })

  it('防抖触发 + 输出解析：函数名/变量名/字符串/注释四类建议被识别，并带 AI 标记（isAI/range/detail/documentation/sortText）', async () => {
    h.hook.infer.mockResolvedValue([
      'function fetchData() {}',
      "const apiUrl = 'https://api.example.com'",
      '// 这是补充说明',
    ].join('\n'))
    const res = await complete('const value = ')
    // 光标前文本作为推理输入
    expect(h.hook.infer).toHaveBeenCalledWith('const value = ')
    const s = res.suggestions as AICompletionItem[]
    // 行1 → fetchData；行2 → apiUrl + 字符串；行3 → 注释
    expect(s.map(i => i.label)).toEqual(['fetchData', 'apiUrl', 'https://api.example.com', '这是补充说明'])
    for (const item of s) {
      expect(item.isAI).toBe(true)
      expect(item.kind).toBe('text-kind')
      expect(item.detail).toBe('AI (GLM-4.6)')
      expect(item.sortText!.startsWith('a')).toBe(true)
      expect((item.documentation as { value: string }).value).toContain('GLM-4.6')
      expect((item.range as unknown as { startColumn: number }).startColumn).toBe(15)
    }
    expect(s[0].inferenceTime).toBeGreaterThanOrEqual(0)
  })

  it('maxSuggestions 截断：超出上限的建议被丢弃', async () => {
    h.hook.infer.mockResolvedValue(['function a() {}', "const b = 'bb'", '// c1', '// c2', '// c3', '// c4'].join('\n'))
    const res = await complete('const value = ', { maxSuggestions: 2 })
    expect(res.suggestions).toHaveLength(2)
  })

  it('无匹配行回退：普通文本行在建议为空时整行作为建议', async () => {
    h.hook.infer.mockResolvedValue('just a plain sentence here')
    const res = await complete('say something ')
    expect((res.suggestions[0] as AICompletionItem).label).toBe('just a plain sentence here')
  })

  it('customHandler 优先：不调用 infer，改用自定义处理函数输出解析', async () => {
    const customHandler = vi.fn().mockResolvedValue('function fromCustom() {}')
    h.hook.infer.mockResolvedValue('function fromInfer() {}')
    const res = await complete('call(', { customHandler })
    expect(customHandler).toHaveBeenCalledWith('call(')
    expect(h.hook.infer).not.toHaveBeenCalled()
    expect((res.suggestions[0] as AICompletionItem).label).toBe('fromCustom')
  })

  it('推理异常与推理中守卫：infer 抛错返回空建议；isInferencing=true 时调用计数不增长', async () => {
    h.hook.infer.mockRejectedValue(new Error('模型炸了'))
    const failed = await complete('const value = ')
    expect(failed.suggestions).toHaveLength(0)
    const callsAfterFailure = h.hook.infer.mock.calls.length
    expect(callsAfterFailure).toBe(1)

    h.hook.isInferencing = true
    h.hook.infer.mockResolvedValue('function x() {}')
    const busy = await complete('const value = ')
    expect(busy.suggestions).toHaveLength(0)
    expect(h.hook.infer.mock.calls.length).toBe(callsAfterFailure)
  })

  it('辅助 Hook：useAICompletionStatus 透传状态；useBasicAICompletion 触发布线；useAdvancedAICompletion(manual) 不注册', async () => {
    const status = render(<StatusHarness />)
    expect(txt(status, 's')).toBe('false|true|42')

    // basic：触发字符 [., (, []，防抖 500
    render(<BasicHarness />)
    const basicProvider = lastProvider()!
    const p = provide(basicProvider, lineModel('foo('), posAt('foo('))
    act(() => { vi.advanceTimersByTime(500) })
    await p
    expect(h.hook.infer).toHaveBeenCalledWith('foo(')

    // advanced manual 模式 → enabled=false → 不注册
    const before = h.register.mock.calls.length
    render(<AdvHarness mode="manual" />)
    expect(h.register.mock.calls.length).toBe(before)
  })
})
