/**
 * @file MultiInstancePanel.deep.test.tsx
 * @description 多实例管理器专项 — 五页签切换/实例创建入口/计数徽标/关闭路径
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { MultiInstancePanel } from '../MultiInstancePanel'
import { multiInstanceActions } from '../../store/multi-instance-store'

beforeEach(() => {
  localStorage.clear()
})

const tabBtn = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes(label))!

describe('MultiInstancePanel 框架', () => {
  it('visible=false 返回 null', () => {
    const { container } = render(<MultiInstancePanel visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('五页签渲染（实例/工作区/会话/资源/IPC）+ 标题 + 关闭按钮', () => {
    const onClose = vi.fn()
    const { container } = render(<MultiInstancePanel visible onClose={onClose} />)
    expect(container.textContent).toContain('多实例管理器')
    for (const label of ['实例', '工作区', '会话', '资源', 'IPC']) {
      expect(tabBtn(container, label)).toBeTruthy()
    }
    fireEvent.click(container.querySelector('button')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('遮罩点击关闭（target 判定）', () => {
    const onClose = vi.fn()
    const { container } = render(<MultiInstancePanel visible onClose={onClose} />)
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('MultiInstancePanel 页签切换与实例操作', () => {
  it('实例页：四类创建按钮 → createInstance 布线 + 列表计数', () => {
    const spy = vi.spyOn(multiInstanceActions, 'createInstance')
    const { container } = render(<MultiInstancePanel visible onClose={() => {}} />)
    for (const type of ['editor', 'preview', 'terminal', 'ai-chat']) {
      const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes(type))!
      fireEvent.click(btn)
    }
    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenCalledWith('editor')
    expect(spy).toHaveBeenCalledWith('ai-chat')
    spy.mockRestore()
  })

  it('真 store 集成：创建实例后徽标计数 +1 且列表出现新行', async () => {
    const { container } = render(<MultiInstancePanel visible onClose={() => {}} />)
    const before = Number(tabBtn(container, '实例').textContent!.replace(/\D/g, '')) || 0
    act(() => { multiInstanceActions.createInstance('terminal', '我的终端') })
    const after = Number(tabBtn(container, '实例').textContent!.replace(/\D/g, ''))
    expect(after).toBe(before + 1)
    expect(container.textContent).toContain('我的终端')
  })

  it('切换到 IPC 页签：渲染 IPC 视图（空日志态）', () => {
    const { container } = render(<MultiInstancePanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'IPC'))
    expect(container.textContent).toContain('实例') // 页签仍在
    expect(container.querySelector('.overflow-y-auto')!.textContent!.length).toBeGreaterThan(0)
  })

  it('切换到资源页签：渲染资源视图', () => {
    const { container } = render(<MultiInstancePanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, '资源'))
    expect(container.querySelector('.overflow-y-auto')!.textContent!.length).toBeGreaterThan(0)
  })
})
