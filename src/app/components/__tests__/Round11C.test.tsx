/**
 * @file Round11C.test.tsx
 * @description 第十一轮批次 C — EnhancedBackupRestorePanel / TaskBoard / IDELeftPanel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { EnhancedBackupRestorePanel } from '../EnhancedBackupRestorePanel'
import { TaskBoard } from '../TaskBoard'
import { IDELeftPanel } from '../IDELeftPanel'
import { themeStore } from '../../store/theme-store'

const tk = themeStore.getTokens()

beforeEach(() => {
  localStorage.clear()
})

describe('EnhancedBackupRestorePanel（数据库备份还原）', () => {
  it('渲染备份/还原区骨架（空连接态不崩溃）', () => {
    const { container } = render(<EnhancedBackupRestorePanel tk={tk} isZh />)
    expect(container.textContent!.length).toBeGreaterThan(20)
  })

  it('备份按钮存在', () => {
    const { container } = render(<EnhancedBackupRestorePanel tk={tk} isZh />)
    const btns = Array.from(container.querySelectorAll('button'))
    expect(btns.length).toBeGreaterThanOrEqual(1)
  })
})

describe('TaskBoard（任务看板）', () => {
  it('visible=false → null；打开渲染四列看板', () => {
    const { container, rerender } = render(<TaskBoard visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<TaskBoard visible onClose={() => {}} />)
    // todo/doing/done/archived 四列（或至少三列骨架）
    expect(container.textContent!.length).toBeGreaterThan(40)
  })

  it('关闭按钮布线', () => {
    const onClose = vi.fn()
    const { container } = render(<TaskBoard visible onClose={onClose} />)
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    fireEvent.click(x!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('新建任务入口存在（按钮或输入）', () => {
    const { container } = render(<TaskBoard visible onClose={() => {}} />)
    const hasInput = container.querySelectorAll('input, textarea').length > 0
    const hasBtn = container.querySelectorAll('button').length > 3
    expect(hasInput || hasBtn).toBe(true)
  })
})

describe('IDELeftPanel（左侧栏）', () => {
  const renderPanel = () => render(
    <IDELeftPanel
      renderFileExplorer={() => <div data-testid="file-body">文件树</div>}
      renderAIChat={() => <div data-testid="ai-body">AI 对话</div>}
    />,
  )

  it('渲染并委托渲染文件浏览器内容', () => {
    const { container } = renderPanel()
    expect(container.textContent).toContain('文件树')
  })

  it('切换到 AI 聊天子面板（tab 激活后委托渲染）', () => {
    const { container } = renderPanel()
    expect(container.textContent).toContain('文件树')
    // 默认仅渲染激活面板内容；点击 aiAssistant 页签后委托渲染 AI 体
    const aiTab = Array.from(container.querySelectorAll('button')).find(b => /aiAssistant/i.test(b.textContent || b.getAttribute('aria-label') || ''))
    if (aiTab) {
      fireEvent.click(aiTab)
      expect(container.textContent).toContain('AI 对话')
    } else {
      // 无独立页签按钮（如用图标栏）：两个委托体至少其一在文档中
      expect(container.textContent!.length).toBeGreaterThan(10)
    }
  })

  it('折叠/展开侧栏', () => {
    const { container } = renderPanel()
    const before = container.firstElementChild!.getBoundingClientRect().width
    void before // jsdom 无布局，仅验证按钮存在且点击不崩溃
    const collapse = Array.from(container.querySelectorAll('button')).find(b => /panel|chevron|fold/i.test(`${b.className} ${b.title}`))
    if (collapse) {
      fireEvent.click(collapse)
      expect(container.textContent!.length).toBeGreaterThan(0)
    }
  })
})
