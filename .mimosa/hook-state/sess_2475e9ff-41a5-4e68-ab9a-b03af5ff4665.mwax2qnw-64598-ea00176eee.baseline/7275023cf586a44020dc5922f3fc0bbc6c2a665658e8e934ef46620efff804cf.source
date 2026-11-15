/**
 * @file EditorTabBar.test.tsx
 * @description 编辑器标签栏交互测试 — 真 ide-store 集成（打开/激活/关闭/固定/右键菜单/拖拽重排）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { EditorTabBar } from '../EditorTabBar'
import { ideStore } from '../../store/ide-store'

const DEFAULT_TAB_ID = 'IDEMode.tsx'

beforeEach(() => {
  localStorage.clear()
  // 模块级 store 跨用例累积：只保留默认 tab，保证每个用例从确定基线开始
  ideStore.getState().openTabs
    .filter(t => t.id !== DEFAULT_TAB_ID)
    .forEach(t => ideStore.closeTab(t.id))
})

/** 按文件名定位标签元素（DEFAULT_TAB 占 index 0，不能按序号取） */
const tabEl = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll('.cursor-pointer'))
    .find(el => el.textContent?.includes(name)) as HTMLElement

const findMenuButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(b => b.textContent === label)

function setupTwoTabs() {
  ideStore.openTab('alpha.tsx')
  ideStore.openTab('beta.tsx')
  return render(<EditorTabBar />)
}

describe('EditorTabBar（标签栏交互）', () => {
  it('openTab 后渲染标签，最后打开的为激活态', () => {
    const { container } = setupTwoTabs()
    expect(container.textContent).toContain('alpha.tsx')
    expect(container.textContent).toContain('beta.tsx')
    expect(ideStore.getState().activeTabId).toBe('beta.tsx')
  })

  it('点击标签切换激活（activateTab 布线）', () => {
    const { container } = setupTwoTabs()
    fireEvent.click(tabEl(container, 'alpha.tsx'))
    expect(ideStore.getState().activeTabId).toBe('alpha.tsx')
  })

  it('点击关闭按钮移除标签（closeTab 布线）', () => {
    const { container } = setupTwoTabs()
    const closeBtns = container.querySelectorAll('button')
    fireEvent.click(closeBtns[closeBtns.length - 1])
    expect(ideStore.getState().openTabs.find(t => t.id === 'beta.tsx')).toBeUndefined()
  })

  it('右键弹出上下文菜单（关闭/关闭其他/关闭右侧/固定标签）', () => {
    const { container } = setupTwoTabs()
    fireEvent.contextMenu(tabEl(container, 'alpha.tsx'))
    expect(findMenuButton(container, '关闭')).toBeTruthy()
    expect(findMenuButton(container, '关闭其他')).toBeTruthy()
    expect(findMenuButton(container, '关闭右侧')).toBeTruthy()
    expect(findMenuButton(container, '固定标签')).toBeTruthy()
  })

  it('菜单「固定标签」→ isPinned、Pin 图标渲染、菜单切换为「取消固定」', () => {
    const { container } = setupTwoTabs()
    fireEvent.contextMenu(tabEl(container, 'alpha.tsx'))
    fireEvent.click(findMenuButton(container, '固定标签')!)
    expect(ideStore.getState().openTabs.find(t => t.id === 'alpha.tsx')?.isPinned).toBe(true)
    // pinned tab 渲染 Pin 图标
    expect(container.querySelector('.lucide-pin')).toBeTruthy()
    // 再次右键 → 菜单项切换为「取消固定」且「关闭」对 pinned 项 disabled
    fireEvent.contextMenu(tabEl(container, 'alpha.tsx'))
    expect(findMenuButton(container, '取消固定')).toBeTruthy()
    expect((findMenuButton(container, '关闭') as HTMLButtonElement).disabled).toBe(true)
  })

  it('菜单「关闭其他」仅保留目标标签', () => {
    ideStore.openTab('gamma.tsx')
    const { container } = render(<EditorTabBar />)
    fireEvent.contextMenu(tabEl(container, 'alpha.tsx'))
    fireEvent.click(findMenuButton(container, '关闭其他')!)
    const ids = ideStore.getState().openTabs.map(t => t.id)
    expect(ids).toEqual(['alpha.tsx'])
  })

  it('拖拽重排：dragStart + drop 交换标签顺序', () => {
    const { container } = setupTwoTabs()
    const dt = { effectAllowed: 'move', dropEffect: 'move' } as unknown as DataTransfer
    fireEvent.dragStart(tabEl(container, 'alpha.tsx'), { dataTransfer: dt })
    fireEvent.drop(tabEl(container, 'beta.tsx'), { dataTransfer: dt })
    const ids = ideStore.getState().openTabs.map(t => t.id)
    expect(ids.indexOf('alpha.tsx')).toBeGreaterThan(ids.indexOf('beta.tsx'))
  })
})
