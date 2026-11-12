/**
 * @file IDELayoutContext.test.tsx
 * @description IDE 布局上下文 — Provider 外使用抛错 / Provider 值透传消费
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, render } from '@testing-library/react'
import { IDELayoutProvider, useIDELayout, type IDELayoutContextValue } from '../IDELayoutContext'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

const ctx: IDELayoutContextValue = {
  selectedFile: 'App.tsx',
  setSelectedFile: () => {},
  editorCode: 'const x = 1;',
  setEditorCode: () => {},
  editorDirty: true,
  setEditorDirty: () => {},
  fileContentMap: { 'App.tsx': 'const x = 1;' },
  setFileContentMap: () => {},
  cyberEditorRef: { current: null },
  searchQuery: '',
  setSearchQuery: () => {},
  filteredFileTree: [{ name: 'App.tsx', type: 'file' }],
  fileContextMenu: null,
  setFileContextMenu: () => {},
  borderColor: '#fff',
  panelBg: '#000',
  terminalVisible: false,
  setQuickActionsContext: () => {},
  setQuickActionsPos: () => {},
  setQuickActionsVisible: () => {},
}

describe('IDELayoutContext（布局上下文）', () => {
  it('Provider 外调用 useIDELayout 抛出定向错误', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useIDELayout())).toThrow('useIDELayout must be used inside <IDELayoutProvider>')
    errSpy.mockRestore()
  })

  it('Provider 内消费：全部字段原样透传', () => {
    const { result } = renderHook(() => useIDELayout(), {
      wrapper: ({ children }) => <IDELayoutProvider value={ctx}>{children}</IDELayoutProvider>,
    })
    expect(result.current).toBe(ctx)
    expect(result.current.selectedFile).toBe('App.tsx')
    expect(result.current.editorDirty).toBe(true)
    expect(result.current.filteredFileTree).toEqual([{ name: 'App.tsx', type: 'file' }])
    expect(result.current.terminalVisible).toBe(false)
  })

  it('Provider 可作组件包裹渲染（值更新透传给消费者）', () => {
    const nextCtx = { ...ctx, selectedFile: 'main.tsx' }
    const { container, rerender } = render(
      <IDELayoutProvider value={ctx}>
        <Consumer />
      </IDELayoutProvider>,
    )
    function Consumer() {
      const v = useIDELayout()
      return <span>{v.selectedFile}</span>
    }
    expect(container.textContent).toBe('App.tsx')
    rerender(
      <IDELayoutProvider value={nextCtx}>
        <Consumer />
      </IDELayoutProvider>,
    )
    expect(container.textContent).toBe('main.tsx')
  })
})
