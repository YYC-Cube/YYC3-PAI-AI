/**
 * @file TaskBoard.deep.test.tsx
 * @description 任务看板专项深化 — 建卡(Enter/优先级)/列内移动/删除/卡片拖拽落列/列头拖拽重排(持久化)/
 *              列宽拖拽 clamp 与双击自适应（真 task-store + localStorage 持久化）
 * @note 无 I18nProvider 时 t() 回退返回 key；locale 回退 zh → isZh 字面量（添加/个任务）生效
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { TaskBoard } from '../TaskBoard'
import { taskStore } from '../../store/task-store'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  for (const t of taskStore.getState().tasks.slice()) taskStore.remove(t.id)
})

/** jsdom 无 DataTransfer：构造最小可用的拖拽载荷对象 */
const mockDT = () =>
  ({ setData: vi.fn(), getData: vi.fn(), setDragImage: vi.fn(), effectAllowed: 'all', dropEffect: 'move' }) as unknown as DataTransfer

/** 五列根节点（.rounded-xl 仅列容器使用），按列头 label span 文本识别 */
const columns = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('.rounded-xl'))
const colEl = (c: HTMLElement, label: string) =>
  columns(c).find(col => col.querySelector('div.cursor-grab span')?.textContent?.trim() === label)!
const colOrder = (c: HTMLElement) =>
  columns(c).map(col => col.querySelector('div.cursor-grab span')?.textContent?.trim())
/** 按标题找卡片根节点（.rounded-lg） */
const cardEl = (c: HTMLElement, title: string) =>
  Array.from(c.querySelectorAll<HTMLElement>('p'))
    .find(p => p.textContent === title)!.closest('.rounded-lg') as HTMLElement
const colHeader = (c: HTMLElement, label: string) => colEl(c, label).querySelector('div.cursor-grab') as HTMLElement

const mount = () => render(<TaskBoard visible onClose={vi.fn()} />)

describe('TaskBoard 框架', () => {
  it('visible=false → null；打开渲染默认顺序五列 + 任务总数徽标', () => {
    const { container, rerender } = render(<TaskBoard visible={false} onClose={vi.fn()} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<TaskBoard visible onClose={vi.fn()} />)
    expect(colOrder(container)).toEqual(['todo', 'inProgress', 'review', 'blocked', 'done'])
    expect(container.textContent).toContain('0 个任务')
  })

  it('遮罩点击（target 判定）与 X 按钮双路关闭', () => {
    const onClose = vi.fn()
    const { container } = render(<TaskBoard visible onClose={onClose} />)
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('快速建卡（真 store）', () => {
  it('done 列 Plus → 输入回车 → 直接入 done 列（徽标 1，空列提示消失）', () => {
    const { container } = mount()
    const doneCol = colEl(container, 'done')
    expect(doneCol.textContent).toContain('拖拽任务到此处')
    fireEvent.click(doneCol.querySelector('div.cursor-grab button')!)

    const input = doneCol.querySelector('input')!
    fireEvent.change(input, { target: { value: '直建完成卡' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const tasks = taskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({ title: '直建完成卡', status: 'done' })
    const doneNow = colEl(container, 'done')
    expect(doneNow.textContent).not.toContain('拖拽任务到此处')
    expect(doneNow.querySelector('div.cursor-grab span.px-1')!.textContent).toBe('1')
  })

  it('优先级四选：H → 新卡 priority=high 且卡片上显示 high', () => {
    const { container } = mount()
    fireEvent.click(colHeader(container, 'todo').querySelector('button')!)
    const form = colEl(container, 'todo')!
    fireEvent.click(Array.from(form.querySelectorAll('button')).find(b => b.textContent === 'H')!)
    const input = form.querySelector('input')!
    fireEvent.change(input, { target: { value: '高优卡' } })
    fireEvent.click(Array.from(form.querySelectorAll('button')).find(b => b.textContent === '添加')!)

    expect(taskStore.getState().tasks[0]).toMatchObject({ title: '高优卡', priority: 'high' })
    expect(colEl(container, 'todo').textContent).toContain('high')
  })

  it('Escape 关闭表单；空标题点添加不建卡且表单保留', () => {
    const { container } = mount()
    fireEvent.click(colHeader(container, 'todo').querySelector('button')!)
    const todoCol = () => colEl(container, 'todo')
    fireEvent.keyDown(todoCol().querySelector('input')!, { key: 'Escape' })
    expect(todoCol().querySelector('input')).toBeNull()

    fireEvent.click(colHeader(container, 'todo').querySelector('button')!)
    fireEvent.click(Array.from(todoCol().querySelectorAll('button')).find(b => b.textContent === '添加')!)
    expect(taskStore.getState().tasks).toHaveLength(0)
    expect(todoCol().querySelector('input')).not.toBeNull()
  })
})

describe('卡片操作（真 store）', () => {
  it('右移箭头：todo 卡 → 下一状态 inProgress', () => {
    act(() => { taskStore.add('待右移', '', 'medium', []) })
    const { container } = mount()
    fireEvent.click(cardEl(container, '待右移').querySelector('.lucide-arrow-right')!.closest('button')!)
    expect(taskStore.getState().tasks[0].status).toBe('inProgress')
    expect(colEl(container, 'inProgress').textContent).toContain('待右移')
  })

  it('删除卡片按钮 → remove 入库', () => {
    act(() => {
      taskStore.add('删甲', '', 'medium', [])
      taskStore.add('留乙', '', 'medium', [])
    })
    const { container } = mount()
    fireEvent.click(cardEl(container, '删甲').querySelector('.lucide-trash-2')!.closest('button')!)
    const tasks = taskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('留乙')
  })
})

describe('拖拽交互', () => {
  it('卡片 dragStart → 目标列 dragOver → drop：reorder 跨列入 done', () => {
    act(() => { taskStore.add('拖拽卡', '', 'medium', []) })
    const { container } = mount()
    fireEvent.dragStart(cardEl(container, '拖拽卡'), { dataTransfer: mockDT() })
    fireEvent.dragOver(colEl(container, 'done'), { dataTransfer: mockDT() })
    fireEvent.drop(colEl(container, 'done'), { dataTransfer: mockDT() })

    expect(taskStore.getState().tasks[0].status).toBe('done')
    expect(colEl(container, 'done').textContent).toContain('拖拽卡')
  })

  it('拖拽指示线：dragOver 时空列出现 3px 指示条，drop 后消失', () => {
    act(() => { taskStore.add('指示线卡', '', 'medium', []) })
    const { container } = mount()
    fireEvent.dragStart(cardEl(container, '指示线卡'), { dataTransfer: mockDT() })
    const doneCol = colEl(container, 'done')
    fireEvent.dragOver(doneCol, { dataTransfer: mockDT() })

    const indicator = doneCol.querySelector('div[style*="height: 3px"]')
    expect(indicator).toBeTruthy()
    expect(doneCol.textContent).not.toContain('拖拽任务到此处')

    fireEvent.drop(doneCol, { dataTransfer: mockDT() })
    expect(colEl(container, 'done').querySelector('div[style*="height: 3px"]')).toBeNull()
  })

  it('列头拖拽重排：done 拖到 todo 前 → 顺序持久化 → 重置按钮恢复默认', () => {
    const { container } = mount()
    fireEvent.dragStart(colHeader(container, 'done'), { dataTransfer: mockDT() })
    fireEvent.dragOver(colHeader(container, 'todo'), { dataTransfer: mockDT() })
    fireEvent.drop(colHeader(container, 'todo'), { dataTransfer: mockDT() })

    expect(colOrder(container)[0]).toBe('done')
    expect(JSON.parse(localStorage.getItem('yyc3_task_column_order')!)[0]).toBe('done')

    fireEvent.click(container.querySelector('button[title="resetColumnOrder"]')!)
    expect(colOrder(container)).toEqual(['todo', 'inProgress', 'review', 'blocked', 'done'])
    expect(JSON.parse(localStorage.getItem('yyc3_task_column_order')!)).toEqual(['todo', 'inProgress', 'review', 'blocked', 'done'])
  })
})

describe('列宽调整', () => {
  it('拖拽调宽：+450px 被 clamp 到 400px，mouseup 持久化，重置列宽按钮复位 215', () => {
    const { container } = mount()
    const handle = container.querySelector('[title="拖拽调整列宽 · 双击自适应"]')!
    fireEvent.mouseDown(handle, { clientX: 200 })
    fireEvent.mouseMove(document, { clientX: 650 })
    expect(colEl(container, 'todo').style.width).toBe('400px')

    fireEvent.mouseUp(document)
    expect(JSON.parse(localStorage.getItem('yyc3_task_column_widths')!).todo).toBe(400)

    const resetBtn = container.querySelector('button[title="resetColumnWidths"]')!
    expect(resetBtn).toBeTruthy()
    fireEvent.click(resetBtn)
    expect(colEl(container, 'todo').style.width).toBe('215px')
    expect(JSON.parse(localStorage.getItem('yyc3_task_column_widths')!).todo).toBe(215)
  })

  it('双击自适应：空列收敛到最小宽 140px 并持久化', () => {
    const { container } = mount()
    const handle = container.querySelector('[title="拖拽调整列宽 · 双击自适应"]')!
    fireEvent.doubleClick(handle)
    expect(colEl(container, 'todo').style.width).toBe('140px')
    expect(JSON.parse(localStorage.getItem('yyc3_task_column_widths')!).todo).toBe(140)
  })
})
