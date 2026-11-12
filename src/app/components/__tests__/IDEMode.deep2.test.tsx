/**
 * @file IDEMode.deep2.test.tsx
 * @description IDE 模式二轮深化 — 承接旧 IDEMode.test.tsx 的 mock 架构深入：
 * Git 工作区水合（buildTreeFromPaths）/ yyc3:open-panel 事件分发 / Tab 同步占位符三态 /
 * 布局预设 / AI 建议·回滚·片段·代码生成回调链 / 预览模式全屏交互 / 终端开闭 / 文件探索器扩展动作
 * （重型子组件全部 stub，外部 store 面板动作均以 act() 包裹触发）
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ===== hoisted 状态与桩（vi.mock 工厂引用外部值必须 vi.hoisted） =====
const h = vi.hoisted(() => ({
  ide: {
    tabs: [] as unknown[],
    activeTabId: null as string | null,
    layoutMode: 'edit' as string,
    fullscreenPreview: false,
    terminalVisible: false,
    terminalExpanded: false,
    leftWidthPercent: 20,
    middleRatioPercent: 46,
    terminalHeight: 200,
    openTab: vi.fn(),
    applyPreset: vi.fn(),
    setLayoutMode: vi.fn(),
    setFullscreenPreview: vi.fn(),
    setLeftWidth: vi.fn(),
    setMiddleRatio: vi.fn(),
    setTerminalVisible: vi.fn(),
    setTerminalHeight: vi.fn(),
  },
  slot: { left: 'file-explorer', center: 'code-editor', right: 'terminal' },
  overlay: { show: vi.fn(), hide: vi.fn() },
  fileActions: { recordAccess: vi.fn(), toggleRecentPanel: vi.fn(), recordOperation: vi.fn() },
  dbOpen: vi.fn(),
  pluginOpen: vi.fn(),
  cryptoOpen: vi.fn(),
  offlineOpen: vi.fn(),
  activityPush: vi.fn(),
  modelOpen: vi.fn(),
  projectModal: vi.fn(),
  getActiveProject: vi.fn(),
  git: { isRepo: vi.fn(), listFiles: vi.fn(), readFile: vi.fn() },
  toast: vi.fn(),
  collab: { enabled: false, users: [] as string[], sessions: [] as unknown[] },
  resize: {
    leftWidth: 20,
    middleRatio: 46,
    terminalHeight: 200,
    isDraggingPanel: false,
    setLeftWidth: vi.fn(),
    setMiddleRatio: vi.fn(),
    setTerminalHeight: vi.fn(),
    startPanelDrag: vi.fn(),
    startTerminalResize: vi.fn(),
  },
}))

// ===== store mocks（沿用旧 IDEMode.test.tsx 套路） =====
vi.mock('../../store/ide-store', () => ({
  useIDEStore: () => h.ide,
  LAYOUT_PRESETS: [
    { id: 'default', leftCollapsed: false, leftWidthPercent: 35, middleRatioPercent: 46, terminalVisible: false, terminalHeight: 220 },
    { id: 'terminal-focus', leftCollapsed: true, leftWidthPercent: 0, middleRatioPercent: 60, terminalVisible: true, terminalHeight: 300 },
  ],
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => ({ openModelSettings: h.modelOpen }),
}))

vi.mock('../../store/theme-store', () => ({
  useThemeStore: () => ({
    isCyberpunk: false,
    tokens: {
      background: '#ffffff', foreground: '#000000', foregroundMuted: '#666666',
      primary: '#3b82f6', primaryDim: '#93c5fd', primaryGlow: 'rgba(59,130,246,0.15)',
      accent: '#f59e0b', border: '#e5e7eb', borderDim: '#f3f4f6',
      cardBg: '#ffffff', cardBorder: '#e5e7eb', backgroundAlt: '#f9fafb',
      fontMono: 'monospace', fontBody: 'sans-serif', fontDisplay: 'serif',
      success: '#10b981', warning: '#f59e0b', error: '#ef4444',
      inputBg: '#ffffff', inputBorder: '#d1d5db', inputFocus: '#3b82f6',
      panelBg: '#ffffff', secondary: '#6b7280', shadow: '0 4px 16px rgba(0,0,0,.1)',
      shadowHover: '0 8px 30px rgba(0,0,0,.15)', borderRadius: '12px',
    },
  }),
}))

vi.mock('../../store/file-store', () => ({
  useFileStore: () => ({ files: [], openFiles: [], activeFileId: null }),
  fileStore: h.fileActions,
}))

vi.mock('../../store/project-store', () => ({
  useProjectStore: () => ({ getActiveProject: h.getActiveProject, openModal: h.projectModal }),
}))

vi.mock('../../store/collab-store', () => ({
  useCollabStore: () => h.collab,
}))

vi.mock('../../store/activity-store', () => ({
  activityBus: { push: h.activityPush, subscribe: vi.fn(() => vi.fn()) },
}))

vi.mock('../../store/crypto-store', () => ({
  cryptoStoreActions: { openPanel: h.cryptoOpen },
}))

vi.mock('../../store/db-store', () => ({
  dbStore: { openPanel: h.dbOpen },
}))

vi.mock('../../store/panel-dnd-store', () => ({
  usePanelDnD: () => ({ slotContent: h.slot }),
  PANEL_CONTENT_MAP: {
    'ai-chat': { type: 'ai-chat', labelKey: 'aiChat' },
    'file-explorer': { type: 'file-explorer', labelKey: 'fileExplorer' },
    'code-editor': { type: 'code-editor', labelKey: 'codeView' },
    'preview': { type: 'preview', labelKey: 'preview' },
    'terminal': { type: 'terminal', labelKey: 'terminal' },
  },
}))

vi.mock('../../store/offline-store', () => ({
  offlineStoreActions: { openPanel: h.offlineOpen },
}))

vi.mock('../../store/plugin-store', () => ({
  pluginStoreActions: { openPanel: h.pluginOpen },
}))

vi.mock('../../services/git-service', () => ({
  gitEngine: h.git,
}))

vi.mock('../CyberToast', () => ({
  cyberToast: h.toast,
}))

// ===== extracted hooks mock =====
vi.mock('../ide/useAutoSave', () => ({
  useAutoSave: () => ({ lastAutoSave: '12:00:05' }),
}))

vi.mock('../ide/useIDEKeyboard', () => ({
  useIDEKeyboard: () => { },
}))

vi.mock('../ide/useIDEPanelResize', () => ({
  useIDEPanelResize: () => h.resize,
}))

vi.mock('../ide/useOverlayPanels', () => ({
  useOverlayPanels: () => ({ panels: {}, show: h.overlay.show, hide: h.overlay.hide }),
  EVENT_TO_PANEL_KEY: { git: 'gitPanel', performance: 'perfDash' },
}))

// ===== 布局上下文与子组件 stub =====
// 布局上下文 mock：stash 暴露 context value，供测试直读 editorCode/selectedFile 等
vi.mock('../ide/IDELayoutContext', () => {
  const stash: { current: Record<string, unknown> | null } = { current: null }
  const IDELayoutProvider = ({ value, children }: { value: Record<string, unknown>; children: React.ReactNode }) => {
    stash.current = value
    return <>{children}</>
  }
  return {
    IDELayoutProvider,
    useIDELayout: () => stash.current,
    __stash: stash,
  }
})

vi.mock('../ide/IDEOverlays', () => {
  return {
    IDEOverlays: (props: {
      onApplyCode?: (code: string, title: string) => void
      onCodeGenerated?: (files: unknown[]) => void
      onSnippetInsert?: (code: string) => void
      onRollback?: (content: string) => void
      onOpenFile?: (name: string) => void
    }) => (
      <div data-testid="ide-overlays">
        <button data-testid="btn-apply" onClick={() => props.onApplyCode?.('// NEW_LOGIC', 'AI 建议')}>apply</button>
        <button data-testid="btn-generated" onClick={() => props.onCodeGenerated?.([{ id: 'g1', fileName: 'gen.tsx', content: 'GEN_CONTENT', language: 'tsx', type: 'component', linesOfCode: 1 }])}>gen</button>
        <button data-testid="btn-snippet" onClick={() => props.onSnippetInsert?.('SNIPPET_X')}>snippet</button>
        <button data-testid="btn-rollback" onClick={() => props.onRollback?.('回滚代码')}>rollback</button>
        <button data-testid="btn-openfile" onClick={() => props.onOpenFile?.('gen.tsx')}>openfile</button>
      </div>
    ),
  }
})

vi.mock('../ide/IDEChatPanel', () => ({
  IDEChatPanel: () => <div data-testid="ide-chat-panel" />,
}))
vi.mock('../ide/IDECodeEditorPanel', () => ({
  IDECodeEditorPanel: () => <div data-testid="ide-code-editor-panel" />,
}))
vi.mock('../ide/IDEFileExplorer', () => ({
  IDEFileExplorer: () => <div data-testid="ide-file-explorer" />,
}))

vi.mock('../ide/IDETerminal', () => ({
  IDETerminal: (props: {
    onClose?: () => void
    onSetExpanded?: (v: boolean) => void
    onSetHeight?: (h: number) => void
    onStartResize?: (e: unknown) => void
  }) => (
    <div data-testid="ide-terminal">
      <button data-testid="btn-terminal-close" onClick={() => props.onClose?.()}>tclose</button>
      <button data-testid="btn-terminal-expand" onClick={() => props.onSetExpanded?.(true)}>texpand</button>
      <button data-testid="btn-terminal-height" onClick={() => props.onSetHeight?.(260)}>theight</button>
      <button data-testid="btn-terminal-resize" onClick={(e) => props.onStartResize?.(e)}>tresize</button>
    </div>
  ),
}))

vi.mock('../IDEHeader', () => ({
  IDEHeader: (props: {
    viewMode: string
    setViewMode: (v: 'edit' | 'preview') => void
    setFullscreenPreview: (v: boolean) => void
    terminalVisible: boolean
    setTerminalVisible: (v: boolean) => void
    openModelSettings: () => void
    onSwitchMode: () => void
    onOpenSettings?: () => void
    onOpenNotifications?: () => void
    onOpenCommandPalette?: () => void
    onOpenGlobalSearch?: () => void
    onOpenAudioPanel?: () => void
    projectStoreOpenModal: () => void
    dbStoreOpenPanel: () => void
    pluginStoreOpenPanel: () => void
    cryptoStoreOpenPanel: () => void
  }) => (
    <div data-testid="ide-header">
      <button data-testid="btn-switch" onClick={props.onSwitchMode}>switch</button>
      <button data-testid="btn-notifications" onClick={() => props.onOpenNotifications?.()}>n</button>
      <button data-testid="btn-commands" onClick={() => props.onOpenCommandPalette?.()}>c</button>
      <button data-testid="btn-search" onClick={() => props.onOpenGlobalSearch?.()}>s</button>
      <button data-testid="btn-audio" onClick={() => props.onOpenAudioPanel?.()}>a</button>
      <button data-testid="btn-settings" onClick={() => props.onOpenSettings?.()}>st</button>
      <button data-testid="btn-model" onClick={props.openModelSettings}>m</button>
      <button data-testid="btn-project" onClick={props.projectStoreOpenModal}>p</button>
      <button data-testid="btn-db" onClick={props.dbStoreOpenPanel}>db</button>
      <button data-testid="btn-plugin" onClick={props.pluginStoreOpenPanel}>pl</button>
      <button data-testid="btn-crypto" onClick={props.cryptoStoreOpenPanel}>cr</button>
      <button data-testid="btn-view-preview" onClick={() => props.setViewMode('preview')}>vp</button>
      <button data-testid="btn-fs-on" onClick={() => props.setFullscreenPreview(true)}>fson</button>
      <button data-testid="btn-terminal-toggle" onClick={() => props.setTerminalVisible(!props.terminalVisible)}>tt</button>
    </div>
  ),
}))

vi.mock('../IDELeftPanel', () => ({
  IDELeftPanel: (props: {
    renderFileExplorer: () => React.ReactNode
    renderAIChat: () => React.ReactNode
  }) => (
    <div data-testid="ide-left-panel">
      {props.renderFileExplorer()}
      {props.renderAIChat()}
    </div>
  ),
}))

vi.mock('../IDEStatusBar', () => ({
  IDEStatusBar: (props: { selectedFile: string; onApplyPreset: (id: string) => void }) => (
    <div data-testid="ide-status-bar">
      <span data-testid="status-file">{props.selectedFile}</span>
      <button data-testid="btn-preset-default" onClick={() => props.onApplyPreset('default')}>pd</button>
      <button data-testid="btn-preset-terminal" onClick={() => props.onApplyPreset('terminal-focus')}>pt</button>
    </div>
  ),
}))

vi.mock('../LivePreview', () => ({
  LivePreview: (props: { code?: string; onToggleExpand?: () => void }) => (
    <div data-testid="live-preview">
      <span data-testid="live-code">{props.code}</span>
      <button data-testid="btn-toggle-expand" onClick={() => props.onToggleExpand?.()}>expand</button>
    </div>
  ),
}))

vi.mock('../PreviewEngine', () => ({
  PreviewEngine: () => <div data-testid="preview-engine" />,
}))

vi.mock('../PanelDropZone', () => ({
  PanelDropZone: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../CyberTooltip', () => ({
  CyberTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../DetachedWindow', () => ({
  DetachedWindowLayer: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../QuickActionsPanel', () => ({
  QuickActionsPanel: (props: { onClose?: () => void; onApplyResult?: (result: string, action: unknown) => void }) => (
    <div data-testid="quick-actions">
      <button data-testid="btn-qa-close" onClick={() => props.onClose?.()}>qclose</button>
      <button data-testid="btn-qa-apply" onClick={() => props.onApplyResult?.('QA_RESULT', {})}>qapply</button>
    </div>
  ),
}))

vi.mock('../../i18n/context', () => ({
  useI18n: () => ({
    t: (_section: string, key: string) => key,
    locale: 'zh',
    setLocale: vi.fn(),
    toggleLocale: vi.fn(),
  }),
}))

import { IDEMode } from '../IDEMode'
import * as layoutCtxModule from '../ide/IDELayoutContext'

/** 从布局上下文 stash 直读编辑器当前代码（不受槽位渲染分支影响） */
const editorCode = (): string => {
  const mod = layoutCtxModule as unknown as { __stash: { current: { editorCode?: string } | null } }
  return mod.__stash.current?.editorCode ?? ''
}
const selectedFileCtx = (): string => {
  const mod = layoutCtxModule as unknown as { __stash: { current: { selectedFile?: string } | null } }
  return mod.__stash.current?.selectedFile ?? ''
}

const flush = () => act(async () => { await Promise.resolve() })

const defaultProps = {
  onSwitchMode: vi.fn(),
  onOpenSettings: vi.fn(),
  onOpenNotifications: vi.fn(),
  onOpenCommandPalette: vi.fn(),
  onOpenGlobalSearch: vi.fn(),
  onOpenAudioPanel: vi.fn(),
}

const body = () => document.body.textContent!

const btn = (testid: string) => document.querySelector(`[data-testid="${testid}"]`) as HTMLElement

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  h.ide.activeTabId = null
  h.ide.layoutMode = 'edit'
  h.ide.fullscreenPreview = false
  h.ide.terminalVisible = false
  h.ide.terminalExpanded = false
  h.slot.left = 'file-explorer'
  h.slot.center = 'code-editor'
  h.slot.right = 'terminal'
  h.collab.enabled = false
  h.collab.users = []
  h.git.isRepo.mockResolvedValue(false)
  h.getActiveProject.mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('IDEMode 渲染骨架与数据源选择', () => {
  it('基础渲染：三栏槽位标题（file-explorer/ai-chat/code-editor/terminal）+ active 徽标 + 状态栏选中文件', () => {
    render(<IDEMode {...defaultProps} />)
    expect(btn('ide-header')).toBeTruthy()
    expect(btn('ide-left-panel')).toBeTruthy()
    expect(btn('ide-status-bar')).toBeTruthy()
    expect(btn('ide-file-explorer')).toBeTruthy()
    expect(btn('ide-chat-panel')).toBeTruthy()
    // 中列 code-editor 槽 body；右列 terminal 槽 body（文字提示）
    expect(body()).toContain('codeView')
    expect(body()).toContain('terminal')
    // file-explorer 槽头扩展 + ai-chat 槽头 active 徽标（IDELeftPanel 渲染两个槽）
    expect(body()).toContain('active')
    expect(body()).toContain('fileExplorer')
    expect(body()).toContain('aiChat')
    // 状态栏透传选中文件
    expect(document.querySelector('[data-testid="status-file"]')!.textContent).toBe('IDEMode.tsx')
    expect(selectedFileCtx()).toBe('IDEMode.tsx')
  })

  it('fileContentMap 初值：合法 localStorage JSON 以存储内容为源；损坏 JSON 回退 SAMPLE_CODE', async () => {
    localStorage.setItem('yyc3_file_content_map', JSON.stringify({ 'stored.tsx': 'STORED_EDITOR_CODE' }))
    const r1 = render(<IDEMode {...defaultProps} key="a" />)
    await flush()
    // selectedFile 初始 IDEMode.tsx 不在存储中 → 生成 tsx 占位
    expect(editorCode()).toContain('export default function IDEMode')
    r1.unmount()

    localStorage.setItem('yyc3_file_content_map', '{broken-json')
    render(<IDEMode {...defaultProps} key="b" />)
    await flush()
    expect(editorCode()).toContain('export function Panel')
  })

  it('Git 工作区水合：isRepo true → 列表建树 + 内容水合 + 首文件自动选中（readFile 单文件拒绝被跳过）', async () => {
    h.git.isRepo.mockResolvedValue(true)
    h.git.listFiles.mockResolvedValue(['src/app.tsx', 'README.md', 'broken.txt'])
    h.git.readFile.mockImplementation(async (p: string) => {
      if (p === 'broken.txt') throw new Error('EACCES')
      return `CONTENT_OF_${p}`
    })
    render(<IDEMode {...defaultProps} />)
    await waitFor(() => expect(h.ide.openTab).toHaveBeenCalledWith('src/app.tsx'))
    expect(h.fileActions.recordAccess).toHaveBeenCalledWith('src/app.tsx')
    // 编辑器代码切到工作区首文件内容
    await waitFor(() => {
      expect(editorCode()).toBe('CONTENT_OF_src/app.tsx')
    })
    // 状态栏选中文件同步
    expect(document.querySelector('[data-testid="status-file"]')!.textContent).toBe('src/app.tsx')
    expect(selectedFileCtx()).toBe('src/app.tsx')
    expect(h.toast).not.toHaveBeenCalled()
  })

  it('无 Git 仓库：回退项目 mock 树路径（getActiveProject 参与派生，编辑器仍为 SAMPLE_CODE）', async () => {
    render(<IDEMode {...defaultProps} />)
    await flush()
    expect(h.git.isRepo).toHaveBeenCalledTimes(1)
    expect(h.getActiveProject).toHaveBeenCalled()
    expect(editorCode()).toContain('export function Panel')
    expect(h.ide.openTab).not.toHaveBeenCalled()
  })
})

describe('IDEMode 事件分发与状态同步', () => {
  it('yyc3:open-panel 事件：overlay 命中走 show，database/plugins/security/offline 分发到四个外部 store，未知 detail 无副作用', async () => {
    render(<IDEMode {...defaultProps} />)
    await flush()
    const dispatch = (detail: string) =>
      act(() => { window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail })) })
    dispatch('git')
    expect(h.overlay.show).toHaveBeenCalledWith('gitPanel')
    dispatch('database')
    dispatch('plugins')
    dispatch('security')
    dispatch('offline')
    expect(h.dbOpen).toHaveBeenCalledTimes(1)
    expect(h.pluginOpen).toHaveBeenCalledTimes(1)
    expect(h.cryptoOpen).toHaveBeenCalledTimes(1)
    expect(h.offlineOpen).toHaveBeenCalledTimes(1)
    dispatch('nonexistent-panel')
    expect(h.overlay.show).toHaveBeenCalledTimes(1)
    expect(h.dbOpen).toHaveBeenCalledTimes(1)
  })

  it('Tab→selectedFile 同步 + 三种扩展名占位符（json/css/默认）+ activityBus.file 推送', async () => {
    const r = render(<IDEMode {...defaultProps} />)
    await flush()
    expect(h.activityPush).toHaveBeenCalledWith('file', 'Opened IDEMode.tsx', '打开了 IDEMode.tsx', 'IDEMode.tsx')

    // rerender + 微任务排空（queueMicrotask 的 setState 需在 act 作用域内落地）
    h.ide.activeTabId = 'notes.json'
    await act(async () => { r.rerender(<IDEMode {...defaultProps} />); await Promise.resolve(); await Promise.resolve() })
    expect(editorCode()).toContain('"name": "notes.json"')

    h.ide.activeTabId = 'style.css'
    await act(async () => { r.rerender(<IDEMode {...defaultProps} />); await Promise.resolve(); await Promise.resolve() })
    expect(editorCode()).toContain('--color-primary')

    h.ide.activeTabId = 'helper.py'
    await act(async () => { r.rerender(<IDEMode {...defaultProps} />); await Promise.resolve(); await Promise.resolve() })
    expect(editorCode()).toContain('export default function helper')
    expect(h.activityPush).toHaveBeenCalledWith('file', 'Opened helper.py', '打开了 helper.py', 'helper.py')
  })

  it('头部动作穿透与视图切换：九个回调/store 动作各就各位；setViewMode(preview) 触发 syncLayoutMode', async () => {
    render(<IDEMode {...defaultProps} />)
    await flush()
    fireEvent.click(btn('btn-switch'))
    expect(defaultProps.onSwitchMode).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-notifications'))
    expect(defaultProps.onOpenNotifications).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-commands'))
    expect(defaultProps.onOpenCommandPalette).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-search'))
    expect(defaultProps.onOpenGlobalSearch).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-audio'))
    expect(defaultProps.onOpenAudioPanel).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-settings'))
    expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-model'))
    expect(h.modelOpen).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-project'))
    expect(h.projectModal).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-db'))
    expect(h.dbOpen).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-plugin'))
    expect(h.pluginOpen).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-crypto'))
    expect(h.cryptoOpen).toHaveBeenCalledTimes(1)
    // 切到预览视图 → 同步 zustand
    fireEvent.click(btn('btn-view-preview'))
    await waitFor(() => expect(h.ide.setLayoutMode).toHaveBeenCalledWith('preview'))
    expect(body()).toContain('previewMode')
    expect(body()).not.toContain('codeView')
  })

  it('终端开闭：toggle 显示 IDETerminal 并同步 store；close 隐藏；expand/高度/拖拽回调透传 resize hook', async () => {
    render(<IDEMode {...defaultProps} />)
    expect(document.querySelector('[data-testid="ide-terminal"]')).toBeNull()
    fireEvent.click(btn('btn-terminal-toggle'))
    await waitFor(() => expect(document.querySelector('[data-testid="ide-terminal"]')).toBeTruthy())
    expect(h.ide.setTerminalVisible).toHaveBeenCalledWith(true)
    // 终端内部动作回调（展开态 / 高度 / 拖拽起始）直通 hook API
    fireEvent.click(btn('btn-terminal-expand'))
    fireEvent.click(btn('btn-terminal-height'))
    expect(h.resize.setTerminalHeight).toHaveBeenCalledWith(260)
    fireEvent.click(btn('btn-terminal-resize'))
    expect(h.resize.startTerminalResize).toHaveBeenCalledTimes(1)
    fireEvent.click(btn('btn-terminal-close'))
    await waitFor(() => {
      expect(document.querySelector('[data-testid="ide-terminal"]')).toBeNull()
    })
    expect(h.ide.setTerminalVisible).toHaveBeenLastCalledWith(false)
  })

  it('布局预设应用：terminal-focus 折叠左栏并显示终端；default 恢复三栏并隐藏终端', async () => {
    render(<IDEMode {...defaultProps} />)
    await flush()
    await act(async () => { fireEvent.click(btn('btn-preset-terminal')) })
    expect(h.ide.applyPreset).toHaveBeenCalledWith('terminal-focus')
    expect(h.resize.setLeftWidth).toHaveBeenCalledWith(0)
    expect(h.resize.setMiddleRatio).toHaveBeenCalledWith(60)
    expect(h.ide.setTerminalVisible).toHaveBeenCalledWith(true)

    await act(async () => { fireEvent.click(btn('btn-preset-default')) })
    expect(h.ide.applyPreset).toHaveBeenCalledWith('default')
    expect(h.resize.setLeftWidth).toHaveBeenLastCalledWith(35)
    expect(h.resize.setMiddleRatio).toHaveBeenLastCalledWith(46)
    expect(h.ide.setTerminalVisible).toHaveBeenLastCalledWith(false)
  })
})

describe('IDEMode 编辑器回调链与预览交互', () => {
  it('AI 建议应用→回滚→片段插入→代码生成→打开生成文件：编辑器与 fileContentMap 全链路联动', async () => {
    // 中列槽位固定 preview：LivePreview 直显编辑器代码（previewFiles 为空阶段）
    h.slot.center = 'preview'
    const r = render(<IDEMode {...defaultProps} />)
    await flush()
    expect(editorCode()).toContain('export function Panel')
    expect(document.querySelector('[data-testid="live-preview"]')).toBeTruthy()
    // 1) AI 建议插入到顶部
    fireEvent.click(btn('btn-apply'))
    expect(editorCode()).toContain('AI Suggestion Applied: AI 建议')
    expect(editorCode()).toContain('// NEW_LOGIC')
    expect(h.toast).toHaveBeenCalledTimes(1)
    expect(h.activityPush).toHaveBeenCalledWith('ai', 'AI code applied: AI 建议', 'AI 代码已应用: AI 建议', 'IDEMode.tsx')
    // 2) 回滚：内容替换且不脏
    fireEvent.click(btn('btn-rollback'))
    expect(editorCode()).toBe('回滚代码')
    // 3) 片段插入（cyberEditorRef 为空 → 追加路径）
    fireEvent.click(btn('btn-snippet'))
    expect(editorCode()).toContain('SNIPPET_X')
    // 4) 代码生成：previewFiles 落位 → 槽位切换 PreviewEngine 分支
    fireEvent.click(btn('btn-generated'))
    expect(document.querySelector('[data-testid="preview-engine"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="live-preview"]')).toBeNull()
    // 5) 打开生成文件 → 编辑器切到生成内容（此刻由 PreviewEngine 占位展示）
    await act(async () => {
      fireEvent.click(btn('btn-openfile'))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(editorCode()).toBe('GEN_CONTENT')
    expect(h.ide.openTab).toHaveBeenCalledWith('gen.tsx')
    expect(h.fileActions.recordAccess).toHaveBeenCalledWith('gen.tsx')
    // 6) 全新挂载（previewFiles 为空）+ preview 槽 → 回退 LivePreview 分支
    r.unmount()
    render(<IDEMode {...defaultProps} />)
    expect(document.querySelector('[data-testid="live-preview"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="preview-engine"]')).toBeNull()
  })

  it('文件探索器扩展按钮：最近文件面板开关；prompt 新建文件全链路；prompt 取消不产生副作用', async () => {
    render(<IDEMode {...defaultProps} />)
    await flush()
    // 最近文件
    fireEvent.click(document.querySelector('[aria-label="recentFilesBtn"]') as HTMLElement)
    expect(h.fileActions.toggleRecentPanel).toHaveBeenCalledTimes(1)
    // 新建文件：prompt 有值
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new-page.tsx')
    fireEvent.click(document.querySelector('[aria-label="newFileBtn"]') as HTMLElement)
    expect(promptSpy).toHaveBeenCalledWith('newFilePrompt')
    expect(h.fileActions.recordOperation).toHaveBeenCalledWith('create', 'new-page.tsx', 'Created new-page.tsx')
    await waitFor(() => expect(h.ide.openTab).toHaveBeenCalledWith('new-page.tsx'))
    expect(h.toast).toHaveBeenCalledTimes(1)
    // prompt 取消（null）→ 无副作用
    promptSpy.mockReturnValue(null)
    fireEvent.click(document.querySelector('[aria-label="newFileBtn"]') as HTMLElement)
    expect(h.fileActions.recordOperation).toHaveBeenCalledTimes(1)
    expect(h.ide.openTab).toHaveBeenCalledTimes(1)
  })

  it('预览模式全屏交互：onToggleExpand 进入全屏（左栏手柄消失）→ 双击还原；collab 徽标随 enabled 显示', async () => {
    const r = render(<IDEMode {...defaultProps} />)
    await flush()
    // 非全屏：两根列宽拖拽手柄（左 + 中右）
    expect(document.querySelectorAll('.cursor-col-resize').length).toBe(2)
    fireEvent.mouseDown(document.querySelectorAll('.cursor-col-resize')[0])
    expect(h.resize.startPanelDrag).toHaveBeenCalledWith('left', expect.anything())
    fireEvent.mouseDown(document.querySelectorAll('.cursor-col-resize')[1])
    expect(h.resize.startPanelDrag).toHaveBeenCalledWith('middle', expect.anything())

    // 切到预览视图
    fireEvent.click(btn('btn-view-preview'))
    await waitFor(() => expect(body()).toContain('previewMode'))
    // collab 关闭：无徽标；LivePreview 有展开按钮
    expect(body()).not.toContain('onlineLabel')
    fireEvent.click(btn('btn-toggle-expand'))
    await waitFor(() => expect(h.ide.setFullscreenPreview).toHaveBeenCalledWith(true))
    // 全屏态：左栏手柄消失
    expect(document.querySelectorAll('.cursor-col-resize').length).toBe(0)

    // collab 开启 → 用户数徽标（原地更新，全屏预览状态保留）
    h.collab.enabled = true
    h.collab.users = ['a', 'b', 'c']
    r.rerender(<IDEMode {...defaultProps} />)
    expect(body()).toContain('onlineLabel')

    // 双击预览容器 → 退出全屏并回编辑视图
    fireEvent.doubleClick(document.querySelector('.neon-scrollbar') as HTMLElement)
    await waitFor(() => {
      expect(h.ide.setFullscreenPreview).toHaveBeenLastCalledWith(false)
      expect(h.ide.setLayoutMode).toHaveBeenLastCalledWith('edit')
    })
    await waitFor(() => expect(body()).toContain('codeView'))
  })
})
