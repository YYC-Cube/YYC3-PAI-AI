/**
 * @file CyberEditor.deep.test.tsx
 * @description 赛博编辑器专项深化 — Monaco 以受控桩替换：动态加载态→桩挂载 / 扩展名→语言映射 /
 *              beforeMount+onMount 双主题注册与协作光标 CSS 注入 / 主题切换 setTheme / 编辑器偏好 updateOptions 同步 /
 *              onChange→collab insert 操作 / 光标与选区事件回调 / ref.insertAtCursor+replaceSelection（含无位置回退）/
 *              协作用户浮层与 toggleCollab / ErrorBoundary 兜底 FallbackEditor
 * @note vi.mock '../../services/monaco-setup' 与 '@monaco-editor/react'（loader.config + Editor 桩）；
 *       桩工厂引用外部值全部经 vi.hoisted；collab-store / editor-prefs-store / theme-store 走真 store
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
import { createRef } from 'react'
import type { EditorProps } from '@monaco-editor/react'

const h = vi.hoisted(() => {
  /** 最小 Range 构造（buildCollabDecorations / insertAtCursor 用） */
  class Range {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number,
    ) {}
  }
  return {
    editor: {
      getModel: vi.fn(),
      onDidChangeCursorPosition: vi.fn(),
      onDidChangeCursorSelection: vi.fn(),
      getSelection: vi.fn(),
      getPosition: vi.fn(),
      executeEdits: vi.fn(),
      focus: vi.fn(),
      getValue: vi.fn(),
      updateOptions: vi.fn(),
      deltaDecorations: vi.fn(),
    },
    monaco: { editor: { defineTheme: vi.fn(), setTheme: vi.fn() }, Range },
    cursorCb: null as null | ((e: { position: { lineNumber: number; column: number } }) => void),
    selCb: null as null | ((e: unknown) => void),
    lastProps: null as null | EditorProps,
    throwOnRender: false,
    loaderConfig: vi.fn(),
  }
})

vi.mock('../../services/monaco-setup', () => ({ monaco: {} }))

vi.mock('@monaco-editor/react', async () => {
  const React = await import('react')
  function MonacoStub(props: EditorProps) {
    const mounted = React.useRef(false)
    const propsRef = React.useRef(props)
    propsRef.current = props
    h.lastProps = props
    React.useEffect(() => {
      if (mounted.current) return
      mounted.current = true
      const p = propsRef.current
      p.beforeMount?.(h.monaco as never)
      p.onMount?.(h.editor as never, h.monaco as never)
    }, [])
    if (h.throwOnRender) throw new Error('monaco stub render failure')
    return React.createElement('div', {
      'data-testid': 'monaco-stub',
      'data-language': String(props.language),
      'data-theme': String(props.theme),
      'data-readonly': String(props.options?.readOnly ?? false),
    })
  }
  return { default: MonacoStub, loader: { config: h.loaderConfig } }
})

import { CyberEditor, type CyberEditorHandle } from '../CyberEditor'
import { collabStore } from '../../store/collab-store'
import { editorPrefsStore } from '../../store/editor-prefs-store'
import { themeStore } from '../../store/theme-store'

// ── Helpers ──

type Props = React.ComponentProps<typeof CyberEditor>
const stubOf = (c: HTMLElement) => c.querySelector('[data-testid="monaco-stub"]') as HTMLElement
const lastOp = () => {
  const ops = collabStore.getState().operations
  return ops[ops.length - 1]
}

/** 挂载并等待 Monaco 桩 onMount → editorReady → 偏好 updateOptions 首次同步 */
const mountEditor = async (props: Partial<Props> = {}) => {
  const ref = createRef<CyberEditorHandle>()
  const onChange = vi.fn()
  const onSelectionChange = vi.fn()
  const utils = render(
    <CyberEditor ref={ref} code="const a = 1" fileName="App.tsx" onChange={onChange} onSelectionChange={onSelectionChange} {...props} />,
  )
  await waitFor(() => expect(h.editor.updateOptions).toHaveBeenCalled())
  return { ...utils, ref, onChange, onSelectionChange }
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.cursorCb = null
  h.selCb = null
  h.lastProps = null
  h.throwOnRender = false
  // resetAllMocks 清实现 → 回填桩行为
  h.editor.getModel.mockReturnValue({ getLineCount: () => 40, getValueInRange: () => 'const x = 1' })
  h.editor.onDidChangeCursorPosition.mockImplementation((cb: typeof h.cursorCb) => { h.cursorCb = cb })
  h.editor.onDidChangeCursorSelection.mockImplementation((cb: typeof h.selCb) => { h.selCb = cb })
  h.editor.getPosition.mockReturnValue({ lineNumber: 2, column: 3 })
  h.editor.getSelection.mockReturnValue(null)
  h.editor.getValue.mockReturnValue('EDITED')
  h.editor.deltaDecorations.mockReturnValue([])
  // 真 store 复位
  themeStore.setTheme('cyberpunk')
  editorPrefsStore.reset()
  if (!collabStore.getState().enabled) collabStore.toggleCollab()
  document.getElementById('collab-cursors-css')?.remove()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('加载与语言映射', () => {
  it('动态导入前显示 LOADING EDITOR...；桩挂载后按扩展名映射语言（tsx/css/py/md/未知→typescript）', async () => {
    const { container, rerender } = render(<CyberEditor code="x" fileName="App.tsx" />)
    expect(container.textContent).toContain('LOADING EDITOR...')
    await waitFor(() => expect(stubOf(container)).toBeTruthy())
    expect(stubOf(container).dataset.language).toBe('typescript')
    const cases: Array<[string, string]> = [['style.css', 'css'], ['main.py', 'python'], ['README.md', 'markdown'], ['weird.xyz', 'typescript'], ['index.jsx', 'javascript']]
    for (const [file, lang] of cases) {
      rerender(<CyberEditor code="x" fileName={file} />)
      expect(stubOf(container).dataset.language).toBe(lang)
    }
    expect(stubOf(container).dataset.readonly).toBe('false')
    rerender(<CyberEditor code="x" fileName="a.ts" readOnly />)
    expect(stubOf(container).dataset.readonly).toBe('true')
  })
})

describe('挂载流程（beforeMount / onMount）', () => {
  it('双主题各注册两次（beforeMount+onMount）→ setTheme(cyberpunk-dark) → 注入协作光标 CSS → 首次 updateOptions 同步默认偏好 → deltaDecorations 四条', async () => {
    const { container } = await mountEditor()
    const defined = h.monaco.editor.defineTheme.mock.calls.map(c => c[0])
    expect(defined.filter(n => n === 'cyberpunk-dark')).toHaveLength(2)
    expect(defined.filter(n => n === 'clean-modern')).toHaveLength(2)
    expect(h.monaco.editor.setTheme).toHaveBeenCalledWith('cyberpunk-dark')
    expect(stubOf(container).dataset.theme).toBe('cyberpunk-dark')

    const style = document.getElementById('collab-cursors-css')!
    expect(style).toBeTruthy()
    expect(style.textContent).toContain(".collab-cursor-marker-user-alice::before")
    expect(style.textContent).toContain("content: 'Alice'")
    expect(style.textContent).toContain('.collab-selection-user-carol')

    const opts = h.editor.updateOptions.mock.calls[0][0]
    expect(opts).toMatchObject({ fontSize: 13, lineHeight: 20, tabSize: 2, wordWrap: 'off', lineNumbers: 'on' })
    expect(opts.minimap.enabled).toBe(true)
    // 远端三人（Alice/Bob 各 1 光标，Carol 光标+选区）→ 4 条装饰
    await waitFor(() => expect(h.editor.deltaDecorations).toHaveBeenCalled())
    const decos = h.editor.deltaDecorations.mock.calls[0][1] as Array<{ options: { className: string } }>
    expect(decos).toHaveLength(4)
    expect(decos.map(d => d.options.className)).toEqual(
      expect.arrayContaining(['collab-cursor-user-alice', 'collab-cursor-user-bob', 'collab-cursor-user-carol', 'collab-selection-user-carol']),
    )
  })

  it('主题切换 clean → setTheme(clean-modern) 且桩 theme 同步；偏好变更 → updateOptions 回传新 fontSize/lineHeight/wordWrap/minimap', async () => {
    const { container } = await mountEditor()
    h.monaco.editor.setTheme.mockClear()
    act(() => { themeStore.setTheme('clean') })
    await waitFor(() => expect(h.monaco.editor.setTheme).toHaveBeenCalledWith('clean-modern'))
    expect(stubOf(container).dataset.theme).toBe('clean-modern')

    h.editor.updateOptions.mockClear()
    act(() => { editorPrefsStore.update({ fontSize: 20, wordWrap: true, minimap: false, lineNumbers: false }) })
    await waitFor(() => expect(h.editor.updateOptions).toHaveBeenCalled())
    const calls = h.editor.updateOptions.mock.calls
    const opts = calls[calls.length - 1][0]
    expect(opts).toMatchObject({ fontSize: 20, lineHeight: 31, wordWrap: 'on', lineNumbers: 'off' })
    expect(opts.minimap.enabled).toBe(false)
  })
})

describe('编辑与协作事件', () => {
  it('Monaco onChange → 外部 onChange + collab insert 操作（取光标位置，col 减一）；toggleCollab 关闭后不再推送', async () => {
    const { onChange } = await mountEditor()
    const before = collabStore.getState().opCount
    act(() => { (h.lastProps!.onChange as (v: string) => void)('abc') })
    expect(onChange).toHaveBeenCalledWith('abc')
    expect(collabStore.getState().opCount).toBe(before + 1)
    expect(lastOp()).toMatchObject({ type: 'insert', userId: 'user-local', position: { line: 2, col: 2 }, content: 'abc' })

    act(() => { collabStore.toggleCollab() })
    expect(collabStore.getState().enabled).toBe(false)
    act(() => { (h.lastProps!.onChange as (v: string) => void)('def') })
    expect(onChange).toHaveBeenLastCalledWith('def')
    expect(collabStore.getState().opCount).toBe(before + 1)
  })

  it('光标移动事件 → collab cursor_move；选区事件：空选区→null / 文本→{text,startLine,endLine} / 纯空白→null', async () => {
    const { onSelectionChange } = await mountEditor()
    expect(h.cursorCb).toBeTruthy()
    act(() => { h.cursorCb!({ position: { lineNumber: 7, column: 4 } }) })
    expect(lastOp()).toMatchObject({ type: 'cursor_move', position: { line: 7, col: 3 } })

    expect(h.selCb).toBeTruthy()
    h.editor.getSelection.mockReturnValue(null)
    act(() => { h.selCb!({}) })
    expect(onSelectionChange).toHaveBeenLastCalledWith(null)

    h.editor.getSelection.mockReturnValue({ isEmpty: () => false, startLineNumber: 3, endLineNumber: 4 })
    act(() => { h.selCb!({}) })
    expect(onSelectionChange).toHaveBeenLastCalledWith({ text: 'const x = 1', startLine: 3, endLine: 4 })

    h.editor.getModel.mockReturnValue({ getLineCount: () => 40, getValueInRange: () => '   \n ' })
    act(() => { h.selCb!({}) })
    expect(onSelectionChange).toHaveBeenLastCalledWith(null)

    h.editor.getSelection.mockReturnValue({ isEmpty: () => true, startLineNumber: 1, endLineNumber: 1 })
    act(() => { h.selCb!({}) })
    expect(onSelectionChange).toHaveBeenLastCalledWith(null)
  })
})

describe('命令式句柄（ref）', () => {
  it('insertAtCursor：光标处 executeEdits(snippet-insert) + focus + onChange(getValue)；无光标位置 → 追加到末尾回退', async () => {
    const { ref, onChange } = await mountEditor()
    ref.current!.insertAtCursor('SNIP')
    expect(h.editor.executeEdits).toHaveBeenCalledTimes(1)
    const [source, edits] = h.editor.executeEdits.mock.calls[0]
    expect(source).toBe('snippet-insert')
    expect(edits[0]).toMatchObject({ text: 'SNIP', forceMoveMarkers: true, range: { startLineNumber: 2, startColumn: 3, endLineNumber: 2, endColumn: 3 } })
    expect(h.editor.focus).toHaveBeenCalled()
    expect(onChange).toHaveBeenLastCalledWith('EDITED')

    h.editor.getPosition.mockReturnValue(null)
    ref.current!.insertAtCursor('TAIL')
    expect(h.editor.executeEdits).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('const a = 1\nTAIL')

    h.editor.focus.mockClear()
    ref.current!.focus()
    expect(h.editor.focus).toHaveBeenCalledTimes(1)
  })

  it('replaceSelection：以当前选区为 range 执行替换；无选区 → 追加回退', async () => {
    const { ref, onChange } = await mountEditor()
    const sel = { isEmpty: () => false, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6 }
    h.editor.getSelection.mockReturnValue(sel)
    ref.current!.replaceSelection('NEW')
    expect(h.editor.executeEdits).toHaveBeenCalledWith('snippet-insert', [{ range: sel, text: 'NEW', forceMoveMarkers: true }])
    expect(onChange).toHaveBeenLastCalledWith('EDITED')

    h.editor.getSelection.mockReturnValue(null)
    ref.current!.replaceSelection('APPEND')
    expect(h.editor.executeEdits).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('const a = 1\nAPPEND')
  })
})

describe('协作浮层与兜底', () => {
  it('collab 开启且有远端用户 → 右下角浮层显示 Alice/Bob/Carol 与行号；toggleCollab 关闭 → 浮层消失', async () => {
    const { container } = await mountEditor()
    for (const name of ['Alice', 'Bob', 'Carol']) expect(container.textContent).toContain(name)
    expect(container.textContent).toMatch(/L\d+/)
    act(() => { collabStore.toggleCollab() })
    expect(container.textContent).not.toContain('Alice')
  })

  it('Monaco 渲染抛错 → MonacoErrorBoundary 兜底 FallbackEditor：提示文案 + 文件名 + textarea 可编辑回传 onChange；readOnly 透传', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // React 开发态会把渲染异常重放为 window error 事件 → jsdom 以未捕获异常上报；preventDefault 压掉噪音
    const swallow = (e: Event) => e.preventDefault()
    window.addEventListener('error', swallow)
    h.throwOnRender = true
    const onChange = vi.fn()
    const { container, rerender } = render(<CyberEditor code="fallback code" fileName="Fb.tsx" onChange={onChange} />)
    await waitFor(() => expect(container.textContent).toContain('Monaco unavailable — fallback mode'))
    expect(container.textContent).toContain('Fb.tsx')
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    expect(ta.value).toBe('fallback code')
    expect(ta.readOnly).toBe(false)
    fireEvent.change(ta, { target: { value: 'typed' } })
    expect(onChange).toHaveBeenCalledWith('typed')
    rerender(<CyberEditor code="fallback code" fileName="Fb.tsx" onChange={onChange} readOnly />)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).readOnly).toBe(true)
    window.removeEventListener('error', swallow)
    errSpy.mockRestore()
  })
})
