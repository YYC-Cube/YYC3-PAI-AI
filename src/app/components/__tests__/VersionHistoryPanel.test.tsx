/**
 * @file VersionHistoryPanel.test.tsx
 * @description 版本历史面板交互测试 — 真 file-store 集成（快照/diff/回滚/删除/清空/关闭）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { VersionHistoryPanel } from '../VersionHistoryPanel'
import { fileStoreActions } from '../../store/file-store'

const FILE = 'story.tsx'

function setup(currentContent: string) {
  const onRollback = vi.fn()
  const view = render(<VersionHistoryPanel currentContent={currentContent} onRollback={onRollback} />)
  return { onRollback, ...view }
}

beforeEach(() => {
  localStorage.clear()
  fileStoreActions.closeVersionPanel()
  fileStoreActions.clearVersions(FILE)
})

describe('VersionHistoryPanel（版本历史面板）', () => {
  it('面板未打开时返回 null，openVersionPanel 后渲染', () => {
    const view = setup('v3 content')
    expect(view.container.firstElementChild).toBeNull()
    fileStoreActions.openVersionPanel(FILE)
    view.rerender(<VersionHistoryPanel currentContent="v3 content" onRollback={view.onRollback} />)
    expect(view.container.textContent).toContain('版本历史')
    expect(view.container.textContent).toContain(FILE)
  })

  it('无版本时渲染空态提示', () => {
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('content')
    expect(container.textContent).toContain('暂无版本记录')
  })

  it('渲染版本时间线（最新徽标/手动标记/描述/体积）', () => {
    fileStoreActions.createVersion(FILE, 'first draft', 'auto', '自动保存')
    fileStoreActions.createVersion(FILE, 'second draft with more words', 'manual', '手动快照')
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('second draft with more words')
    expect(container.textContent).toContain('2 个版本')
    expect(container.textContent).toContain('最新')
    expect(container.textContent).toContain('手动快照')
    expect(container.querySelector('.lucide-tag')).toBeTruthy()
  })

  it('点击版本条目展开 Diff 视图（+/- 计数，computeLineDiff 逐行语义）', () => {
    fileStoreActions.createVersion(FILE, 'line1\nline2', 'manual', '旧版本')
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('line1\nline2-changed\nline3')
    const entry = container.querySelector('.cursor-pointer') as HTMLElement
    fireEvent.click(entry)
    expect(container.textContent).toContain('Diff 对比')
    // line2→removed+added，line3→added ⇒ +2/-1
    expect(container.textContent).toContain('+2')
    expect(container.textContent).toContain('-1')
  })

  it('保存快照按钮 → createVersion 入库（计数增加）', () => {
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('current draft')
    fireEvent.click(container.querySelector('.lucide-save')!.closest('button')!)
    expect(container.textContent).toContain('1 个版本')
  })

  it('回滚按钮 → onRollback(versionContent, versionId)', () => {
    fileStoreActions.createVersion(FILE, 'old content', 'manual', '旧版本')
    fileStoreActions.openVersionPanel(FILE)
    const { container, onRollback } = setup('new content')
    fireEvent.click(container.querySelector('.lucide-rotate-ccw')!.closest('button')!)
    expect(onRollback).toHaveBeenCalledTimes(1)
    expect(onRollback).toHaveBeenCalledWith('old content', expect.any(String))
  })

  it('删除版本按钮 → 列表计数减少', () => {
    fileStoreActions.createVersion(FILE, 'a', 'auto', 'v1')
    fileStoreActions.createVersion(FILE, 'b', 'auto', 'v2')
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('b')
    expect(container.textContent).toContain('2 个版本')
    const listDelete = container.querySelectorAll('.lucide-trash2')[1] as HTMLElement
    fireEvent.click(listDelete.closest('button')!)
    expect(container.textContent).toContain('1 个版本')
  })

  it('清除所有版本 → 回到空态', () => {
    fileStoreActions.createVersion(FILE, 'a', 'auto', 'v1')
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('a')
    const clearBtn = container.querySelectorAll('.lucide-trash2')[0] as HTMLElement
    fireEvent.click(clearBtn.closest('button')!)
    expect(container.textContent).toContain('暂无版本记录')
  })

  it('关闭按钮 → closeVersionPanel 面板卸载', () => {
    fileStoreActions.createVersion(FILE, 'a', 'auto', 'v1')
    fileStoreActions.openVersionPanel(FILE)
    const { container } = setup('a')
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(container.firstElementChild).toBeNull()
  })
})
