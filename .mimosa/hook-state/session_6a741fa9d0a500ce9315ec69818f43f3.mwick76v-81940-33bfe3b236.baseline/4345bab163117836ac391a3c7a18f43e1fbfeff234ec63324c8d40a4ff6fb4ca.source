/**
 * @file FileContextMenu.test.tsx
 * @description 文件上下文菜单测试 — 文件/文件夹双形态、菜单项回调、遮罩关闭、边界位置钳制
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FileContextMenu } from '../FileContextMenu'

const menuItem = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(b => b.textContent === label)

describe('FileContextMenu（文件上下文菜单）', () => {
  it('文件形态：打开/重命名/复制路径/固定/版本历史/定位/删除 全项渲染', () => {
    const { container } = render(
      <FileContextMenu x={10} y={10} filename="app.tsx" isFolder={false} onClose={() => {}} />,
    )
    for (const label of ['打开文件', '重命名', '复制路径', '固定到标签栏', '版本历史', '在树中定位', '删除']) {
      expect(menuItem(container, label)).toBeTruthy()
    }
    // 文件形态不渲染新建项
    expect(menuItem(container, '新建文件')).toBeUndefined()
    expect(menuItem(container, '新建文件夹')).toBeUndefined()
  })

  it('文件夹形态：新建文件/新建文件夹 出现，文件专属项隐藏', () => {
    const { container } = render(
      <FileContextMenu x={10} y={10} filename="src/" isFolder onClose={() => {}} />,
    )
    expect(menuItem(container, '新建文件')).toBeTruthy()
    expect(menuItem(container, '新建文件夹')).toBeTruthy()
    expect(menuItem(container, '打开文件')).toBeUndefined()
    expect(menuItem(container, '固定到标签栏')).toBeUndefined()
    expect(menuItem(container, '版本历史')).toBeUndefined()
    // 通用项仍在
    expect(menuItem(container, '重命名')).toBeTruthy()
    expect(menuItem(container, '删除')).toBeTruthy()
  })

  it('菜单项点击触发回调并自动关闭', () => {
    const onClose = vi.fn()
    const onRename = vi.fn()
    const { container } = render(
      <FileContextMenu x={10} y={10} filename="a.ts" isFolder={false}
        onClose={onClose} onRename={onRename} />,
    )
    fireEvent.click(menuItem(container, '重命名')!)
    expect(onRename).toHaveBeenCalledWith('a.ts')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('删除项同样回调后关闭（错误色高亮）', () => {
    const onClose = vi.fn()
    const onDelete = vi.fn()
    const { container } = render(
      <FileContextMenu x={10} y={10} filename="b.ts" isFolder={false}
        onClose={onClose} onDelete={onDelete} />,
    )
    fireEvent.click(menuItem(container, '删除')!)
    expect(onDelete).toHaveBeenCalledWith('b.ts')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('文件夹新建项透传 parentFolder', () => {
    const onClose = vi.fn()
    const onNewFile = vi.fn()
    const onNewFolder = vi.fn()
    const { container } = render(
      <FileContextMenu x={10} y={10} filename="docs/" isFolder
        onClose={onClose} onNewFile={onNewFile} onNewFolder={onNewFolder} />,
    )
    fireEvent.click(menuItem(container, '新建文件')!)
    expect(onNewFile).toHaveBeenCalledWith('docs/')
    fireEvent.click(menuItem(container, '新建文件夹')!)
    expect(onNewFolder).toHaveBeenCalledWith('docs/')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('点击遮罩层关闭（不触发任何操作）', () => {
    const onClose = vi.fn()
    const onOpen = vi.fn()
    const { container } = render(
      <FileContextMenu x={10} y={10} filename="c.ts" isFolder={false}
        onClose={onClose} onOpen={onOpen} />,
    )
    fireEvent.click(container.querySelector('.fixed.inset-0')!)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('位置钳制：超出视口的坐标被压回边界内', () => {
    const { container } = render(
      <FileContextMenu x={99999} y={99999} filename="d.ts" isFolder={false} onClose={() => {}} />,
    )
    const menu = container.querySelectorAll('.fixed')[1] as HTMLElement
    const left = Number(menu.style.left.replace('px', ''))
    const top = Number(menu.style.top.replace('px', ''))
    expect(left).toBeLessThanOrEqual(window.innerWidth - 180)
    expect(top).toBeLessThanOrEqual(window.innerHeight - 300)
  })
})
