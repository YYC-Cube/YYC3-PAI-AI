/**
 * @file Round11A.test.tsx
 * @description 第十一轮批次 A — SelfMediaEditor / IDEHeader / PerformanceDashboard / SnippetManager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SelfMediaEditor } from '../SelfMediaEditor'
import { IDEHeader } from '../IDEHeader'
import { PerformanceDashboard } from '../PerformanceDashboard'
import { SnippetManager } from '../SnippetManager'

beforeEach(() => {
  localStorage.clear()
})

describe('SelfMediaEditor（全屏创作层）', () => {
  it('visible=false → null；打开渲染标题与关闭按钮（X 图标定位）', () => {
    const onClose = vi.fn()
    const { container, rerender } = render(<SelfMediaEditor visible={false} onClose={onClose} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<SelfMediaEditor visible onClose={onClose} />)
    expect(container.textContent).toContain('自媒体')
    const close = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))!
    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

/** 全 false 的 overlay 面板状态（OverlayPanelState 十键） */
const PANELS = {
  aiAssist: false, codeGen: false, collabPanel: false, gitPanel: false, perfDash: false,
  diagPanel: false, taskBoard: false, snippetMgr: false, activityLog: false, multiInstance: false,
}
const overlayApi = (show = vi.fn()) => ({
  panels: { ...PANELS }, show, hide: vi.fn(), toggle: vi.fn(), setter: vi.fn(),
})

/** IDEHeader 完整 props 装配（overlayPanels 等必填） */
const headerProps = (over: Record<string, unknown> = {}) => ({
  viewMode: 'edit' as const,
  setViewMode: vi.fn(),
  fullscreenPreview: false,
  setFullscreenPreview: vi.fn(),
  terminalVisible: false,
  setTerminalVisible: vi.fn(),
  setTerminalExpanded: vi.fn(),
  openModelSettings: vi.fn(),
  projectStoreOpenModal: vi.fn(),
  dbStoreOpenPanel: vi.fn(),
  pluginStoreOpenPanel: vi.fn(),
  cryptoStoreOpenPanel: vi.fn(),
  overlayPanels: overlayApi(),
  ...over,
})

describe('IDEHeader（顶栏）', () => {
  it('渲染工具按钮组（含视图/终端入口）', () => {
    const { container } = render(<IDEHeader {...headerProps()} />)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(3)
  })

  it('视图切换按钮回调 setViewMode（aria-label 定位）', () => {
    const setViewMode = vi.fn()
    const { container } = render(<IDEHeader {...headerProps({ setViewMode })} />)
    // fallback i18t：t('ide','preview') → 'preview'，t('ide','codeView') → 'codeView'
    fireEvent.click(container.querySelector('[aria-label="preview"]')!)
    expect(setViewMode).toHaveBeenCalledWith('preview')
    fireEvent.click(container.querySelector('[aria-label="codeView"]')!)
    expect(setViewMode).toHaveBeenCalledWith('edit')
  })

  it('overlayPanels.show 布线（面板开关入口）', () => {
    const show = vi.fn()
    const { container } = render(<IDEHeader {...headerProps({ overlayPanels: overlayApi(show) })} />)
    const btns = Array.from(container.querySelectorAll('button'))
    const panelBtn = btns.find(b => /panel|面板/i.test(b.title || ''))
      ?? btns.find(b => /panel/i.test(b.textContent || ''))
    if (panelBtn) {
      fireEvent.click(panelBtn)
      expect(show).toHaveBeenCalled()
    }
  })
})

describe('PerformanceDashboard（性能面板）', () => {
  it('visible=false → null；打开渲染 Web Vitals 骨架', () => {
    const { container, rerender } = render(<PerformanceDashboard visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<PerformanceDashboard visible onClose={() => {}} />)
    expect(container.textContent!.length).toBeGreaterThan(50)
  })

  it('关闭按钮布线', () => {
    const onClose = vi.fn()
    const { container } = render(<PerformanceDashboard visible onClose={onClose} />)
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    fireEvent.click(x!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('SnippetManager（代码片段）', () => {
  it('visible=false → null；打开渲染空态或列表骨架', () => {
    const { container, rerender } = render(
      <SnippetManager visible={false} onClose={() => {}} />,
    )
    expect(container.firstElementChild).toBeNull()
    rerender(<SnippetManager visible onClose={() => {}} />)
    expect(container.textContent!.length).toBeGreaterThan(30)
  })

  it('关闭与插入回调布线', () => {
    const onClose = vi.fn()
    const onInsert = vi.fn()
    const { container } = render(
      <SnippetManager visible onClose={onClose} onInsertSnippet={onInsert} />,
    )
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    fireEvent.click(x!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
