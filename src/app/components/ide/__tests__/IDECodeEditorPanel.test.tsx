/**
 * @file IDECodeEditorPanel.test.tsx
 * @description 代码编辑器面板 — 页签条/内联预览开关/分屏开关/编辑联动 dirty+内容映射/快捷操作选择布线
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

// 桩组件在工厂内创建（引用外部值会触发 hoist TDZ），测试经 data-testid 驱动
vi.mock('../../CyberEditor', async () => {
  const React = await import('react')
  const CyberEditorStub = React.forwardRef(function CyberEditorStub(
    props: {
      code?: string
      fileName?: string
      onChange?: (v: string) => void
      onSelectionChange?: (sel: { text: string; startLineNumber?: number } | null) => void
    },
    _ref: unknown,
  ) {
    return (
      <div data-testid={`cyber-editor-${props.fileName ?? 'unknown'}`} data-code={props.code ?? ''}>
        <button data-testid="fire-change" onClick={() => props.onChange?.('// 由桩触发的新代码')} />
        <button data-testid="fire-selection" onClick={() => props.onSelectionChange?.({ text: 'const selectedCode = 1' })} />
        <button data-testid="fire-selection-empty" onClick={() => props.onSelectionChange?.(null)} />
      </div>
    )
  })
  return { CyberEditor: CyberEditorStub }
})
vi.mock('../../LivePreview', async () => ({
  LivePreview: (props: { code?: string; fileName?: string }) => (
    <div data-testid="live-preview">{`preview:${props.fileName}:${props.code}`}</div>
  ),
}))

import { IDECodeEditorPanel } from '../IDECodeEditorPanel'
import { IDELayoutProvider, type IDELayoutContextValue } from '../IDELayoutContext'
import { ideStore } from '../../../store/ide-store'
import { previewStoreActions } from '../../../store/preview-store'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  ideStore.toggleSplit('none')
  ideStore.setSplitFile(null)
  if (previewStoreActions.getState().inlinePreviewVisible) previewStoreActions.toggleInlinePreview()
})

const makeCtx = (overrides: Partial<IDELayoutContextValue> = {}): IDELayoutContextValue => ({
  selectedFile: 'App.tsx',
  setSelectedFile: vi.fn(),
  editorCode: 'const hello = 1;',
  setEditorCode: vi.fn(),
  editorDirty: false,
  setEditorDirty: vi.fn(),
  fileContentMap: {},
  setFileContentMap: vi.fn(),
  cyberEditorRef: { current: null },
  searchQuery: '',
  setSearchQuery: vi.fn(),
  filteredFileTree: [],
  fileContextMenu: null,
  setFileContextMenu: vi.fn(),
  borderColor: '#123456',
  panelBg: '#000000',
  terminalVisible: false,
  setQuickActionsContext: vi.fn(),
  setQuickActionsPos: vi.fn(),
  setQuickActionsVisible: vi.fn(),
  ...overrides,
})

const renderPanel = (ctx = makeCtx()) =>
  render(
    <IDELayoutProvider value={ctx}>
      <IDECodeEditorPanel />
    </IDELayoutProvider>,
  )

describe('IDECodeEditorPanel（代码编辑器面板）', () => {
  it('渲染页签条（真 EditorTabBar）与主编辑器桩（带当前文件与代码）', () => {
    const { container, getByTestId } = renderPanel()
    expect(getByTestId('cyber-editor-App.tsx')).toBeTruthy()
    expect(getByTestId('cyber-editor-App.tsx').getAttribute('data-code')).toBe('const hello = 1;')
    expect(container.textContent).toContain('inlinePreview')
    expect(container.textContent).toContain('splitEditor')
  })

  it('内联预览开关：点击 Eye → LivePreview 渲染当前代码；再点收起', () => {
    const { container, getByTestId, queryByTestId } = renderPanel()
    expect(queryByTestId('live-preview')).toBeNull()
    const toggleBtns = Array.from(container.querySelectorAll('button'))
    const eyeBtn = toggleBtns.find(b => b.querySelector('svg') && b.getAttribute('class')?.includes('p-1.5'))!
    // Eye 按钮是第一个工具按钮
    fireEvent.click(eyeBtn)
    expect(getByTestId('live-preview').textContent).toContain('preview:App.tsx:const hello = 1;')
    expect(previewStoreActions.getState().inlinePreviewVisible).toBe(true)
    fireEvent.click(eyeBtn)
    expect(queryByTestId('live-preview')).toBeNull()
  })

  it('分屏开关：toggleSplit 循环 none→horizontal→vertical→none，副编辑器与分隔把手出现/消失', () => {
    const { container, getByTestId, queryByTestId } = renderPanel()
    expect(queryByTestId('cyber-editor-App.tsx-tab2')).toBeNull()
    const splitBtn = Array.from(container.querySelectorAll('button')).find(b => b.getAttribute('class')?.includes('mx-1'))!
    fireEvent.click(splitBtn) // → horizontal
    expect(ideStore.getState().splitDirection).toBe('horizontal')
    // 分屏时 splitActiveFile 默认取 activeTabId，副编辑器头部显示该文件名
    expect(getByTestId('cyber-editor-App.tsx')).toBeTruthy()
    const splitFile = ideStore.getState().splitActiveFile ?? ''
    expect(splitFile).not.toBe('')
    expect(container.textContent).toContain(splitFile)
    fireEvent.click(splitBtn) // → vertical：主代码区纵向排列
    expect(ideStore.getState().splitDirection).toBe('vertical')
    expect((container.querySelector('.flex-1.overflow-hidden.flex') as HTMLElement).style.flexDirection).toBe('column')
    fireEvent.click(splitBtn) // → none
    expect(ideStore.getState().splitDirection).toBe('none')
  })

  it('主编辑器 onChange：更新 editorCode + dirty 标记 + fileContentMap + 页签 modified', () => {
    const setEditorCode = vi.fn()
    const setEditorDirty = vi.fn()
    const setFileContentMap = vi.fn()
    ideStore.openTab('App.tsx')
    const ctx = makeCtx({ setEditorCode, setEditorDirty, setFileContentMap })
    const { getByTestId } = renderPanel(ctx)
    fireEvent.click(getByTestId('fire-change'))
    expect(setEditorCode).toHaveBeenCalledWith('// 由桩触发的新代码')
    expect(setEditorDirty).toHaveBeenCalledWith(true)
    // setFileContentMap 以 updater 形式调用（SetStateAction）
    const updater = setFileContentMap.mock.calls[0][0] as (prev: Record<string, string>) => Record<string, string>
    expect(updater({})).toEqual({ 'App.tsx': '// 由桩触发的新代码' })
    // markTabModified 落到 store 快照（组件经 useIDEStore 解引用 actions，无法属性级 spy）
    expect(ideStore.getState().openTabs.find(t => t.id === 'App.tsx')?.isModified).toBe(true)
  })

  it('editorDirty=true 时显示 MODIFIED 状态条（collab 默认开启同时显示 CRDT 行）', () => {
    const { container, rerender } = renderPanel(makeCtx({ editorDirty: false }))
    expect(container.textContent).not.toContain('MODIFIED')
    rerender(
      <IDELayoutProvider value={makeCtx({ editorDirty: true })}>
        <IDECodeEditorPanel />
      </IDELayoutProvider>,
    )
    expect(container.textContent).toContain('MODIFIED')
    // collab-store 默认 enabled: true → CRDT 状态行出现
    expect(container.textContent).toContain('CRDT:')
    expect(container.textContent).toContain('usersLabel')
  })

  it('选中文本超 2 字符 → 快捷操作上下文/位置/可见性三连布线', () => {
    const setQuickActionsContext = vi.fn()
    const setQuickActionsPos = vi.fn()
    const setQuickActionsVisible = vi.fn()
    const { getByTestId } = renderPanel(makeCtx({ setQuickActionsContext, setQuickActionsPos, setQuickActionsVisible }))
    fireEvent.click(getByTestId('fire-selection'))
    expect(setQuickActionsContext).toHaveBeenCalledWith(expect.objectContaining({
      selection: 'const selectedCode = 1',
      filePath: 'App.tsx',
      fullContent: 'const hello = 1;',
    }))
    expect(setQuickActionsContext.mock.calls[0][0].language).toBe('tsx')
    expect(setQuickActionsPos).toHaveBeenCalledWith(expect.objectContaining({ y: 120 }))
    expect(setQuickActionsVisible).toHaveBeenCalledWith(true)
  })

  it('清空选区 → 200ms 后且无文档选区时隐藏快捷操作', async () => {
    vi.useFakeTimers()
    try {
      const setQuickActionsVisible = vi.fn()
      const { getByTestId } = renderPanel(makeCtx({ setQuickActionsVisible }))
      fireEvent.click(getByTestId('fire-selection-empty'))
      expect(setQuickActionsVisible).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(250) })
      expect(setQuickActionsVisible).toHaveBeenCalledWith(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('分屏激活另一文件时：副编辑器读取 fileContentMap 内容，onChange 写回对应文件', () => {
    const setFileContentMap = vi.fn()
    ideStore.toggleSplit('horizontal')
    ideStore.setSplitFile('other.tsx')
    ideStore.openTab('other.tsx')
    const { getByTestId } = renderPanel(makeCtx({ fileContentMap: { 'other.tsx': '// other 内容' }, setFileContentMap }))
    expect(getByTestId('cyber-editor-other.tsx').getAttribute('data-code')).toBe('// other 内容')
    fireEvent.click(getByTestId('cyber-editor-other.tsx').querySelector('button')!)
    const updater = setFileContentMap.mock.calls[0][0] as (prev: Record<string, string>) => Record<string, string>
    expect(updater({})).toEqual({ 'other.tsx': '// 由桩触发的新代码' })
    expect(ideStore.getState().openTabs.find(t => t.id === 'other.tsx')?.isModified).toBe(true)
    ideStore.setSplitFile(null)
    ideStore.toggleSplit('none')
  })
})
