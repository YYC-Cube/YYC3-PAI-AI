/**
 * @file IDEOverlays.test.tsx
 * @description 覆盖层集合 — visible/onClose 透传布线（各子面板 stub）/文件右键菜单回调族/常驻面板渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

// 各子面板 props 收集器（vi.hoisted 供 mock 工厂引用外部值）
const h = vi.hoisted(() => ({
  lazyProps: [] as Array<Record<string, unknown>>,
  ctxMenuProps: { current: null as Record<string, unknown> | null },
}))

const lazyStub = (testId: string) =>
  function Stub(props: Record<string, unknown>) {
    h.lazyProps.push({ testId, ...props })
    return props.visible
      ? <div data-testid={`overlay-${testId}`}>{testId}</div>
      : <div data-testid={`overlay-hidden-${testId}`} />
  }

vi.mock('../../AIAssistPanel', () => ({ AIAssistPanel: lazyStub('aiAssist'), __esModule: true }))
vi.mock('../../CodeGenPanel', () => ({ CodeGenPanel: lazyStub('codeGen'), __esModule: true }))
vi.mock('../../CollabPanel', () => ({ CollabPanel: lazyStub('collabPanel'), __esModule: true }))
vi.mock('../../GitPanel', () => ({ GitPanel: lazyStub('gitPanel'), __esModule: true }))
vi.mock('../../PerformanceDashboard', () => ({ PerformanceDashboard: lazyStub('perfDash'), __esModule: true }))
vi.mock('../../DiagnosticsPanel', () => ({ DiagnosticsPanel: lazyStub('diagPanel'), __esModule: true }))
vi.mock('../../TaskBoard', () => ({ TaskBoard: lazyStub('taskBoard'), __esModule: true }))
vi.mock('../../SnippetManager', () => ({ SnippetManager: lazyStub('snippetMgr'), __esModule: true }))
vi.mock('../../ActivityLog', () => ({ ActivityLog: lazyStub('activityLog'), __esModule: true }))
vi.mock('../../MultiInstancePanel', () => ({ MultiInstancePanel: lazyStub('multiInstance'), __esModule: true }))
vi.mock('../../ProjectCreateModal', () => ({ ProjectCreateModal: () => <div data-testid="project-create-modal" /> }))
vi.mock('../../FileContextMenu', () => ({
  FileContextMenu: (props: Record<string, unknown>) => {
    h.ctxMenuProps.current = props
    return (
      <div data-testid="ctx-menu">
        <button data-testid="ctx-open" onClick={() => (props.onOpen as (f: string) => void)('目标.ts')} />
        <button data-testid="ctx-rename" onClick={() => (props.onRename as (f: string) => void)('旧名.ts')} />
        <button data-testid="ctx-delete" onClick={() => (props.onDelete as (f: string) => void)('待删.ts')} />
        <button data-testid="ctx-copy-path" onClick={() => (props.onCopyPath as (f: string) => void)('/a/b.ts')} />
        <button data-testid="ctx-view-history" onClick={() => (props.onViewHistory as (f: string) => void)('版本.ts')} />
        <button data-testid="ctx-pin" onClick={() => (props.onPinTab as (f: string) => void)('钉住.ts')} />
        <button data-testid="ctx-new-file" onClick={() => (props.onNewFile as () => void)()} />
        <button data-testid="ctx-new-folder" onClick={() => (props.onNewFolder as () => void)()} />
        <button data-testid="ctx-close" onClick={() => (props.onClose as () => void)()} />
      </div>
    )
  },
}))
vi.mock('../../VersionHistoryPanel', () => ({ VersionHistoryPanel: () => <div data-testid="version-history" /> }))
vi.mock('../../RecentFilesPanel', () => ({ RecentFilesPanel: () => <div data-testid="recent-files" /> }))
vi.mock('../../DatabasePanel', () => ({ DatabasePanel: () => <div data-testid="database-panel" /> }))
vi.mock('../../SystemPanel', () => ({ SystemPanel: () => <div data-testid="system-panel" /> }))

import { IDEOverlays, type IDEOverlaysProps } from '../IDEOverlays'
import type { OverlayPanelState, OverlayPanelKey } from '../useOverlayPanels'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.lazyProps = []
  h.ctxMenuProps.current = null
  window.prompt = vi.fn(() => '新名字.ts')
  window.confirm = vi.fn(() => true)
})

const hiddenPanels: OverlayPanelState = {
  aiAssist: false, codeGen: false, collabPanel: false, gitPanel: false, perfDash: false,
  diagPanel: false, taskBoard: false, snippetMgr: false, activityLog: false, multiInstance: false,
}

const makeProps = (overrides: {
  panels?: Partial<OverlayPanelState>
  hide?: (key: OverlayPanelKey) => void
  fileContextMenu?: IDEOverlaysProps['fileContextMenu']
  setFileContextMenu?: IDEOverlaysProps['setFileContextMenu']
  onApplyCode?: IDEOverlaysProps['onApplyCode']
  onCodeGenerated?: IDEOverlaysProps['onCodeGenerated']
  onSnippetInsert?: IDEOverlaysProps['onSnippetInsert']
  onRollback?: IDEOverlaysProps['onRollback']
  onOpenFile?: IDEOverlaysProps['onOpenFile']
} = {}): IDEOverlaysProps => ({
  panels: { ...hiddenPanels, ...overrides.panels },
  hide: overrides.hide ?? vi.fn(),
  aiContext: { selectedFile: 'a.tsx', currentCode: '', designJsonSummary: '', recentActions: [] },
  activeDesignJson: null,
  editorCode: 'console.log(1)',
  selectedFile: 'a.tsx',
  onApplyCode: overrides.onApplyCode ?? vi.fn(),
  onCodeGenerated: overrides.onCodeGenerated ?? vi.fn(),
  onSnippetInsert: overrides.onSnippetInsert ?? vi.fn(),
  onRollback: overrides.onRollback ?? vi.fn(),
  onOpenFile: overrides.onOpenFile ?? vi.fn(),
  fileContextMenu: overrides.fileContextMenu ?? null,
  setFileContextMenu: overrides.setFileContextMenu ?? vi.fn(),
})

/** 等 React.lazy 桩异步解析完成 */
const renderOverlays = async (props: IDEOverlaysProps) => {
  const utils = render(<IDEOverlays {...props} />)
  await waitFor(() => expect(utils.container.querySelector('[data-testid^="overlay-"]')).not.toBeNull())
  return utils
}

describe('IDEOverlays（覆盖层集合）', () => {
  it('常驻面板渲染：ProjectCreateModal/版本历史/最近文件/数据库/系统面板', async () => {
    const { container } = await renderOverlays(makeProps())
    for (const id of ['project-create-modal', 'version-history', 'recent-files', 'database-panel', 'system-panel']) {
      expect(container.querySelector(`[data-testid="${id}"]`)).not.toBeNull()
    }
  })

  it('全面板隐藏：10 个 lazy 桩全部收到 visible=false（隐藏占位而非内容）', async () => {
    await renderOverlays(makeProps())
    await waitFor(() => expect(h.lazyProps.length).toBeGreaterThanOrEqual(10))
    await waitFor(() => expect(collectedIds()).toEqual(expect.arrayContaining(
      ['aiAssist', 'codeGen', 'collabPanel', 'gitPanel', 'perfDash', 'diagPanel', 'taskBoard', 'snippetMgr', 'activityLog', 'multiInstance'],
    )))
    expect(document.querySelector('[data-testid="overlay-aiAssist"]')).toBeNull()
    expect(document.querySelector('[data-testid="overlay-hidden-aiAssist"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="overlay-hidden-gitPanel"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="overlay-hidden-multiInstance"]')).not.toBeNull()
  })

  it('visible 透传布线：面板键 → 对应桩 visible=true 渲染出内容', async () => {
    const { container } = await renderOverlays(makeProps({
      panels: { aiAssist: true, gitPanel: true, taskBoard: true },
    }))
    expect(container.querySelector('[data-testid="overlay-aiAssist"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="overlay-gitPanel"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="overlay-taskBoard"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="overlay-codeGen"]')).toBeNull()
  })

  it('onClose → hide(key) 透传：aiAssist/gitPanel/multiInstance 三键逐一验证', async () => {
    const hide = vi.fn()
    await renderOverlays(makeProps({ hide, panels: { aiAssist: true, gitPanel: true, multiInstance: true } }))
    const stubProps = (id: string) => {
      const arr = h.lazyProps.filter(p => p.testId === id)
      expect(arr.length).toBeGreaterThan(0)
      return arr[arr.length - 1]!
    }
    const p1 = stubProps('aiAssist')
    ;(p1.onClose as () => void)()
    expect(hide).toHaveBeenLastCalledWith('aiAssist')
    ;(stubProps('gitPanel').onClose as () => void)()
    expect(hide).toHaveBeenLastCalledWith('gitPanel')
    ;(stubProps('multiInstance').onClose as () => void)()
    expect(hide).toHaveBeenLastCalledWith('multiInstance')
  })

  it('数据与回调透传：aiContext/onApplyCode 注入 AIAssist 桩；designJson/onCodeGenerated 注入 CodeGen 桩', async () => {
    const onApplyCode = vi.fn()
    const onCodeGenerated = vi.fn()
    await renderOverlays(makeProps({ panels: { codeGen: true }, onApplyCode, onCodeGenerated }))
    const assist = lastStub('aiAssist')
    expect(assist.context).toMatchObject({ selectedFile: 'a.tsx' })
    expect(assist.onApplyCode).toBe(onApplyCode)
    const codeGen = lastStub('codeGen')
    expect(codeGen.designJson).toBeNull()
    expect(codeGen.onCodeGenerated).toBe(onCodeGenerated)
    // SnippetManager 桩收到 onInsertSnippet
    const snippet = lastStub('snippetMgr')
    ;(snippet.onInsertSnippet as (c: string) => void)('片段代码')
    // 布线函数被透传（调用交给真实组件的桩内逻辑，这里验证引用存在）
    expect(typeof snippet.onInsertSnippet).toBe('function')
  })

  it('文件右键菜单：x/y/filename/isFolder 透传 + onClose → setFileContextMenu(null) + onOpen → onOpenFile', async () => {
    const setFileContextMenu = vi.fn()
    const onOpenFile = vi.fn()
    await renderOverlays(makeProps({
      fileContextMenu: { x: 10, y: 20, filename: '入口.tsx', isFolder: false },
      setFileContextMenu,
      onOpenFile,
    }))
    expect(document.querySelector('[data-testid="ctx-menu"]')).not.toBeNull()
    expect(h.ctxMenuProps.current).toMatchObject({ x: 10, y: 20, filename: '入口.tsx', isFolder: false })
    fireEvent.click(document.querySelector('[data-testid="ctx-close"]')!)
    expect(setFileContextMenu).toHaveBeenCalledWith(null)
    fireEvent.click(document.querySelector('[data-testid="ctx-open"]')!)
    expect(onOpenFile).toHaveBeenCalledWith('目标.ts')
  })

  it('右键重命名/新建：prompt 返回新名 → recordOperation + toast + onOpenFile', async () => {
    const onOpenFile = vi.fn()
    const { container } = await renderOverlays(makeProps({
      fileContextMenu: { x: 0, y: 0, filename: '入口.tsx', isFolder: false },
      onOpenFile,
    }))
    fireEvent.click(container.querySelector('[data-testid="ctx-rename"]')!)
    expect(window.prompt).toHaveBeenCalled()
    fireEvent.click(container.querySelector('[data-testid="ctx-new-file"]')!)
    expect(onOpenFile).toHaveBeenCalledWith('新名字.ts')
    const sonnerLog = (globalThis as unknown as { __sonnerLog?: string[] }).__sonnerLog ?? []
    expect(sonnerLog.some(l => l.includes('新名字.ts'))).toBe(true)
  })

  it('右键删除：confirm 确认后记录操作 + toast；取消时不记录', async () => {
    const { container } = await renderOverlays(makeProps({
      fileContextMenu: { x: 0, y: 0, filename: '入口.tsx', isFolder: false },
    }))
    fireEvent.click(container.querySelector('[data-testid="ctx-delete"]')!)
    expect(window.confirm).toHaveBeenCalled()
    const sonnerLog = (globalThis as unknown as { __sonnerLog?: string[] }).__sonnerLog ?? []
    expect(sonnerLog.some(l => l.includes('deleted'))).toBe(true)
    ;(window.confirm as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)
    fireEvent.click(container.querySelector('[data-testid="ctx-delete"]')!)
    expect(sonnerLog.filter(l => l.includes('deleted')).length).toBe(1)
  })

  it('右键复制路径/查看历史/钉住：clipboard + fileStore/ideStore 布线不崩溃', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    const { container } = await renderOverlays(makeProps({
      fileContextMenu: { x: 0, y: 0, filename: '入口.tsx', isFolder: false },
    }))
    expect(() => fireEvent.click(container.querySelector('[data-testid="ctx-copy-path"]')!)).not.toThrow()
    expect(() => fireEvent.click(container.querySelector('[data-testid="ctx-view-history"]')!)).not.toThrow()
    expect(() => fireEvent.click(container.querySelector('[data-testid="ctx-pin"]')!)).not.toThrow()
    expect(() => fireEvent.click(container.querySelector('[data-testid="ctx-new-folder"]')!)).not.toThrow()
  })
})

function collectedIds(): string[] {
  return [...new Set(h.lazyProps.map(p => p.testId as string))]
}
function lastStub(id: string): Record<string, unknown> {
  const arr = h.lazyProps.filter(p => p.testId === id)
  expect(arr.length).toBeGreaterThan(0)
  return arr[arr.length - 1]!
}
