/**
 * @file IDEHeader.deep.test.tsx
 * @description IDE 顶栏专项深化 — 顶栏/第二工具栏/中央视图组/右侧文件终端组全按钮布线：
 *              视图切换/全屏/终端开合/overlay 十面板 show/四 store 面板回调/⌘K/搜索/toast 通知
 * @note 无 I18nProvider 时 t() 回退返回 key → aria-label 即 key（preview/codeView/aiAssist…）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { IDEHeader } from '../IDEHeader'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

/** 全 false 的 overlay 面板状态（OverlayPanelState 十键） */
const PANELS = {
  aiAssist: false, codeGen: false, collabPanel: false, gitPanel: false, perfDash: false,
  diagPanel: false, taskBoard: false, snippetMgr: false, activityLog: false, multiInstance: false,
}
const overlayApi = (show = vi.fn()) => ({
  panels: { ...PANELS }, show, hide: vi.fn(), toggle: vi.fn(), setter: vi.fn(),
})

/** IDEHeader 完整 props 装配（参考 Round11A） */
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

const btn = (c: HTMLElement, label: string) => c.querySelector(`[aria-label="${label}"]`) as HTMLElement
/** setup.ts 中 sonner 桩写入的全局 toast 日志 */
const toastLog = () => (globalThis as unknown as { __sonnerLog: string[] }).__sonnerLog

describe('IDEHeader 框架渲染', () => {
  it('顶栏 + 第二工具栏完整渲染（关键 aria-label 全在）', () => {
    const { container } = render(<IDEHeader {...headerProps()} />)
    // 顶栏组
    for (const label of ['projectMgr', 'settings', 'github', 'share', 'deploy', 'notifications', 'userProfile']) {
      expect(btn(container, label)).toBeTruthy()
    }
    // 第二工具栏左组（overlay 十键 + ⌘K）
    for (const label of ['aiModel', 'aiAssist', 'codeGen', 'collab', 'git', 'performance', 'diagnostics', 'taskBoard', 'snippets', 'activityLog', 'newProject', '⌘K']) {
      expect(btn(container, label)).toBeTruthy()
    }
    // 中央视图组 + 右组
    for (const label of ['goBack', 'fullscreen', 'preview', 'codeView', 'search', 'database', 'plugins', 'security', 'more', 'fileManager', 'terminal', 'notes', 'multiInstance']) {
      expect(btn(container, label)).toBeTruthy()
    }
  })
})

describe('视图与终端开关', () => {
  it('preview/codeView 双按钮 → setViewMode("preview"/"edit")', () => {
    const setViewMode = vi.fn()
    const { container } = render(<IDEHeader {...headerProps({ setViewMode })} />)
    fireEvent.click(btn(container, 'preview'))
    expect(setViewMode).toHaveBeenCalledWith('preview')
    fireEvent.click(btn(container, 'codeView'))
    expect(setViewMode).toHaveBeenCalledWith('edit')
  })

  it('fileManager：preview 态点击 → setViewMode("edit") 并发 fileManagerOpened 通知', () => {
    const setViewMode = vi.fn()
    const { container } = render(<IDEHeader {...headerProps({ viewMode: 'preview', setViewMode })} />)
    const before = toastLog().length
    fireEvent.click(btn(container, 'fileManager'))
    expect(setViewMode).toHaveBeenCalledWith('edit')
    expect(toastLog().slice(before)).toContain('fileManagerOpened')
  })

  it('全屏按钮：false → setFullscreenPreview(true)+toast；true → (false) 且不再提示', () => {
    const setFullscreenPreview = vi.fn()
    const { container, rerender } = render(<IDEHeader {...headerProps({ setFullscreenPreview })} />)
    const before = toastLog().length
    fireEvent.click(btn(container, 'fullscreen'))
    expect(setFullscreenPreview).toHaveBeenCalledWith(true)
    expect(toastLog().slice(before)).toEqual(['fullscreenEntered'])

    rerender(<IDEHeader {...headerProps({ fullscreenPreview: true, setFullscreenPreview })} />)
    fireEvent.click(btn(container, 'fullscreen'))
    expect(setFullscreenPreview).toHaveBeenLastCalledWith(false)
    expect(toastLog().slice(before)).toEqual(['fullscreenEntered'])
  })

  it('终端按钮：隐藏 → setTerminalVisible(true)+setTerminalExpanded(false)；可见 → 仅关闭', () => {
    const setTerminalVisible = vi.fn()
    const setTerminalExpanded = vi.fn()
    const props = { setTerminalVisible, setTerminalExpanded }
    const { container, rerender } = render(<IDEHeader {...headerProps(props)} />)
    fireEvent.click(btn(container, 'terminal'))
    expect(setTerminalVisible).toHaveBeenCalledWith(true)
    expect(setTerminalExpanded).toHaveBeenCalledWith(false)

    rerender(<IDEHeader {...headerProps({ ...props, terminalVisible: true })} />)
    fireEvent.click(btn(container, 'terminal'))
    expect(setTerminalVisible).toHaveBeenLastCalledWith(false)
    expect(setTerminalExpanded).toHaveBeenCalledTimes(1)
  })
})

describe('overlay 面板与外部回调布线', () => {
  it('第二工具栏十面板入口 → overlayPanels.show(各键)', () => {
    const show = vi.fn()
    const { container } = render(<IDEHeader {...headerProps({ overlayPanels: overlayApi(show) })} />)
    const keys: Array<[string, string]> = [
      ['aiAssist', 'aiAssist'], ['codeGen', 'codeGen'], ['collab', 'collabPanel'], ['git', 'gitPanel'],
      ['performance', 'perfDash'], ['diagnostics', 'diagPanel'], ['taskBoard', 'taskBoard'],
      ['snippets', 'snippetMgr'], ['activityLog', 'activityLog'], ['multiInstance', 'multiInstance'],
    ]
    for (const [label] of keys) fireEvent.click(btn(container, label))
    for (const [, key] of keys) expect(show).toHaveBeenCalledWith(key)
    expect(show).toHaveBeenCalledTimes(10)
  })

  it('顶栏 projectMgr/settings/notifications 与 github/notes 跨组入口', () => {
    const show = vi.fn()
    const onOpenSettings = vi.fn()
    const onOpenNotifications = vi.fn()
    const projectStoreOpenModal = vi.fn()
    const { container } = render(
      <IDEHeader {...headerProps({
        overlayPanels: overlayApi(show), onOpenSettings, onOpenNotifications, projectStoreOpenModal,
      })} />,
    )
    fireEvent.click(btn(container, 'projectMgr'))
    expect(projectStoreOpenModal).toHaveBeenCalledTimes(1)
    fireEvent.click(btn(container, 'settings'))
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
    fireEvent.click(btn(container, 'notifications'))
    expect(onOpenNotifications).toHaveBeenCalledTimes(1)
    // github 与 notes 复用 overlay show（gitPanel/activityLog）
    fireEvent.click(btn(container, 'github'))
    expect(show).toHaveBeenCalledWith('gitPanel')
    fireEvent.click(btn(container, 'notes'))
    expect(show).toHaveBeenCalledWith('activityLog')
  })

  it('goBack/⌘K/more/search → onSwitchMode/onOpenCommandPalette/onOpenGlobalSearch', () => {
    const onSwitchMode = vi.fn()
    const onOpenCommandPalette = vi.fn()
    const onOpenGlobalSearch = vi.fn()
    const { container } = render(
      <IDEHeader {...headerProps({ onSwitchMode, onOpenCommandPalette, onOpenGlobalSearch })} />,
    )
    fireEvent.click(btn(container, 'goBack'))
    expect(onSwitchMode).toHaveBeenCalledTimes(1)
    fireEvent.click(btn(container, '⌘K'))
    fireEvent.click(btn(container, 'more'))
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(2)
    fireEvent.click(btn(container, 'search'))
    expect(onOpenGlobalSearch).toHaveBeenCalledTimes(1)
  })

  it('database/plugins/security → db/plugin/crypto 三 store 面板回调', () => {
    const dbStoreOpenPanel = vi.fn()
    const pluginStoreOpenPanel = vi.fn()
    const cryptoStoreOpenPanel = vi.fn()
    const { container } = render(
      <IDEHeader {...headerProps({ dbStoreOpenPanel, pluginStoreOpenPanel, cryptoStoreOpenPanel })} />,
    )
    fireEvent.click(btn(container, 'database'))
    fireEvent.click(btn(container, 'plugins'))
    fireEvent.click(btn(container, 'security'))
    expect(dbStoreOpenPanel).toHaveBeenCalledTimes(1)
    expect(pluginStoreOpenPanel).toHaveBeenCalledTimes(1)
    expect(cryptoStoreOpenPanel).toHaveBeenCalledTimes(1)
  })

  it('aiModel → openModelSettings；newProject → projectStoreOpenModal（双入口复用）', () => {
    const openModelSettings = vi.fn()
    const projectStoreOpenModal = vi.fn()
    const { container } = render(
      <IDEHeader {...headerProps({ openModelSettings, projectStoreOpenModal })} />,
    )
    fireEvent.click(btn(container, 'aiModel'))
    expect(openModelSettings).toHaveBeenCalledTimes(1)
    fireEvent.click(btn(container, 'newProject'))
    expect(projectStoreOpenModal).toHaveBeenCalledTimes(1)
  })
})

describe('通知类按钮（sonner toast）', () => {
  it('share/deploy/userProfile → cyberToast 推送 shareLink/deployStarted/profileOpened', () => {
    const { container } = render(<IDEHeader {...headerProps()} />)
    const before = toastLog().length
    fireEvent.click(btn(container, 'share'))
    fireEvent.click(btn(container, 'deploy'))
    fireEvent.click(btn(container, 'userProfile'))
    expect(toastLog().slice(before)).toEqual(['shareLink', 'deployStarted', 'profileOpened'])
  })
})
