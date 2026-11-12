/**
 * @file FileTreeNode.test.tsx
 * @description 文件树节点与过滤器 — 目录展开收起/文件选中/右键菜单/高亮命中包裹/filterFileTree 剪枝
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FileTreeNode, filterFileTree } from '../FileTreeNode'
import type { FileNode } from '../../../types'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

const tree: FileNode = {
  name: 'project',
  type: 'folder',
  children: [
    { name: 'readme.md', type: 'file' },
    { name: 'src', type: 'folder', children: [{ name: 'main.tsx', type: 'file', ext: 'tsx' }] },
  ],
}

describe('FileTreeNode（文件树节点）', () => {
  it('深度 <2 的目录默认展开渲染子节点；文件节点不展开子级', () => {
    const { container } = render(
      <FileTreeNode node={tree} depth={0} selectedFile="" onSelect={() => {}} />,
    )
    expect(container.textContent).toContain('readme.md')
    expect(container.textContent).toContain('src')
    expect(container.textContent).toContain('main.tsx')
  })

  it('点击目录切换展开/收起；点击文件透传 onSelect', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <FileTreeNode node={tree} depth={0} selectedFile="" onSelect={onSelect} />,
    )
    const buttons = Array.from(container.querySelectorAll('button'))
    const folderBtn = buttons.find(b => b.textContent!.includes('src'))!
    const fileBtn = buttons.find(b => b.textContent!.includes('readme.md'))!
    fireEvent.click(folderBtn)
    // 收起后深层文件消失
    expect(container.textContent).not.toContain('main.tsx')
    fireEvent.click(folderBtn)
    expect(container.textContent).toContain('main.tsx')
    fireEvent.click(fileBtn)
    expect(onSelect).toHaveBeenCalledWith('readme.md')
  })

  it('selectedFile 命中的文件按钮带选中背景（primaryGlow）', () => {
    const { container } = render(
      <FileTreeNode node={tree} depth={0} selectedFile="readme.md" onSelect={() => {}} />,
    )
    const fileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('readme.md'))!
    expect((fileBtn as HTMLElement).style.background).not.toBe('transparent')
    expect((fileBtn as HTMLElement).style.background).toContain('rgba')
  })

  it('右键菜单：preventDefault + onContextMenu 透传文件名与 isFolder 标记', () => {
    const onCtxMenu = vi.fn()
    const { container } = render(
      <FileTreeNode node={tree} depth={0} selectedFile="" onSelect={() => {}} onContextMenu={onCtxMenu} />,
    )
    const fileBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('readme.md'))!
    const folderBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('project'))!
    const fileEvt = fireEvent.contextMenu(fileBtn)
    expect(fileEvt).toBe(false) // preventDefault 已调用
    expect(onCtxMenu).toHaveBeenCalledWith(expect.anything(), 'readme.md', false)
    fireEvent.contextMenu(folderBtn)
    expect(onCtxMenu).toHaveBeenCalledWith(expect.anything(), 'project', true)
  })

  it('highlightQuery 命中片段被 span 包裹高亮；未命中原样输出', () => {
    const { container } = render(
      <FileTreeNode node={{ name: 'AppPanel.tsx', type: 'file' }} depth={2} selectedFile="" onSelect={() => {}} highlightQuery="panel" />,
    )
    const mark = container.querySelector('span span')
    expect(mark?.textContent).toBe('Panel')
    const { container: c2 } = render(
      <FileTreeNode node={{ name: 'AppPanel.tsx', type: 'file' }} depth={2} selectedFile="" onSelect={() => {}} highlightQuery="zzz" />,
    )
    expect(c2.querySelector('span span')).toBeNull()
    const { container: c3 } = render(
      <FileTreeNode node={{ name: 'AppPanel.tsx', type: 'file' }} depth={2} selectedFile="" onSelect={() => {}} highlightQuery="  " />,
    )
    expect(c3.querySelector('span span')).toBeNull()
  })
})

describe('filterFileTree（文件树过滤器）', () => {
  const nodes: FileNode[] = [
    { name: 'src', type: 'folder', children: [
      { name: 'App.tsx', type: 'file' },
      { name: 'utils.ts', type: 'file' },
    ] },
    { name: 'docs', type: 'folder', children: [{ name: 'guide.md', type: 'file' }] },
    { name: 'package.json', type: 'file' },
  ]

  it('空查询原样返回', () => {
    expect(filterFileTree(nodes, '')).toEqual(nodes)
    expect(filterFileTree(nodes, '   ')).toEqual(nodes)
  })

  it('文件命中保留；文件不命中剪除', () => {
    const out = filterFileTree(nodes, 'package')
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('package.json')
  })

  it('子文件命中 → 保留父目录且子级剪枝为命中项', () => {
    const out = filterFileTree(nodes, 'app.tsx')
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('src')
    expect(out[0].children).toEqual([{ name: 'App.tsx', type: 'file' }])
  })

  it('目录名自身命中 → 保留全部原始子级', () => {
    const out = filterFileTree(nodes, 'docs')
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('docs')
    expect(out[0].children).toEqual([{ name: 'guide.md', type: 'file' }])
  })

  it('大小写不敏感匹配', () => {
    const out = filterFileTree(nodes, 'UTILS')
    expect(out[0].children).toEqual([{ name: 'utils.ts', type: 'file' }])
  })

  it('全部不命中 → 空数组', () => {
    expect(filterFileTree(nodes, '不存在的内容')).toEqual([])
  })
})
