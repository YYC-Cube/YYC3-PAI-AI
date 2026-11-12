/**
 * @file IDEFileExplorer.test.tsx
 * @description 文件资源管理器 — 搜索框布线/清除按钮/文件树渲染与选中/右键菜单/空态
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { IDEFileExplorer } from '../IDEFileExplorer'
import { IDELayoutProvider, type IDELayoutContextValue } from '../IDELayoutContext'
import type { FileNode } from '../../../types'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

const makeCtx = (overrides: Partial<IDELayoutContextValue> = {}): IDELayoutContextValue => ({
  selectedFile: 'App.tsx',
  setSelectedFile: vi.fn(),
  editorCode: '',
  setEditorCode: vi.fn(),
  editorDirty: false,
  setEditorDirty: vi.fn(),
  fileContentMap: {},
  setFileContentMap: vi.fn(),
  cyberEditorRef: { current: null },
  searchQuery: '',
  setSearchQuery: vi.fn(),
  filteredFileTree: [
    { name: 'src', type: 'folder', children: [
      { name: 'App.tsx', type: 'file' },
      { name: 'main.ts', type: 'file', ext: 'ts' },
    ] },
    { name: 'styles', type: 'folder', children: [{ name: 'theme.css', type: 'file', ext: 'css' }] },
    { name: 'package.json', type: 'file', ext: 'json' },
  ] as FileNode[],
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

const renderExplorer = (ctx = makeCtx()) =>
  render(
    <IDELayoutProvider value={ctx}>
      <IDEFileExplorer />
    </IDELayoutProvider>,
  )

describe('IDEFileExplorer（文件资源管理器）', () => {
  it('渲染搜索框与「项目结构」标签；文件树平铺渲染所有节点', () => {
    const { container } = renderExplorer()
    // placeholder 是属性而非文本节点
    expect((container.querySelector('input') as HTMLInputElement).placeholder).toBe('searchFiles')
    expect(container.textContent).toContain('projectStructure')
    for (const name of ['src', 'App.tsx', 'main.ts', 'styles', 'theme.css', 'package.json']) {
      expect(container.textContent).toContain(name)
    }
  })

  it('搜索输入布线：输入透传 setSearchQuery；有值时出现清除按钮，点击清空', () => {
    const setSearchQuery = vi.fn()
    const { container, rerender } = renderExplorer(makeCtx({ setSearchQuery }))
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'app' } })
    expect(setSearchQuery).toHaveBeenCalledWith('app')
    // 有值时（ctx.searchQuery 更新后）清除按钮出现
    rerender(
      <IDELayoutProvider value={makeCtx({ setSearchQuery, searchQuery: 'app' })}>
        <IDEFileExplorer />
      </IDELayoutProvider>,
    )
    const clearBtn = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('svg'))!
    expect(clearBtn).toBeTruthy()
    fireEvent.click(clearBtn)
    expect(setSearchQuery).toHaveBeenCalledWith('')
  })

  it('点击文件节点 → setSelectedFile 透传文件名', () => {
    const setSelectedFile = vi.fn()
    const { container } = renderExplorer(makeCtx({ setSelectedFile }))
    const fileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('App.tsx'))!
    fireEvent.click(fileBtn)
    expect(setSelectedFile).toHaveBeenCalledWith('App.tsx')
  })

  it('点击目录节点 → 仅切换展开（不触发 setSelectedFile）', () => {
    const setSelectedFile = vi.fn()
    const { container } = renderExplorer(makeCtx({ setSelectedFile }))
    const folderBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('src'))!
    fireEvent.click(folderBtn)
    expect(setSelectedFile).not.toHaveBeenCalled()
    // 收起后 src 子文件消失，再点重新展开
    expect(container.textContent).not.toContain('App.tsx')
    fireEvent.click(folderBtn)
    expect(container.textContent).toContain('App.tsx')
  })

  it('右键菜单：透传坐标、文件名与 isFolder 到 setFileContextMenu', () => {
    const setFileContextMenu = vi.fn()
    const { container } = renderExplorer(makeCtx({ setFileContextMenu }))
    const fileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('package.json'))!
    fireEvent.contextMenu(fileBtn, { clientX: 33, clientY: 44 })
    expect(setFileContextMenu).toHaveBeenCalledWith(expect.objectContaining({
      x: 33, y: 44, filename: 'package.json', isFolder: false,
    }))
    const folderBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('styles'))!
    fireEvent.contextMenu(folderBtn, { clientX: 1, clientY: 2 })
    expect(setFileContextMenu).toHaveBeenLastCalledWith(expect.objectContaining({ filename: 'styles', isFolder: true }))
  })

  it('highlightQuery 传入树节点：命中片段高亮包裹', () => {
    const { container } = renderExplorer(makeCtx({ searchQuery: 'theme' }))
    const mark = container.querySelector('span span')
    expect(mark?.textContent).toBe('theme')
  })

  it('filteredFileTree 为空 → 渲染无匹配空态（图标 + noMatchFiles）', () => {
    const { container } = renderExplorer(makeCtx({ filteredFileTree: [] }))
    expect(container.textContent).toContain('noMatchFiles')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('选中文件高亮：selectedFile 命中节点带 primaryGlow 背景', () => {
    const { container } = renderExplorer(makeCtx({ selectedFile: 'package.json' }))
    const fileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('package.json'))! as HTMLElement
    expect(fileBtn.style.background).toContain('rgba')
  })
})
