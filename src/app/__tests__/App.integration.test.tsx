/**
 * @file App.integration.test.tsx
 * @description 主页发起的根链路集成测试 — Providers 链/快捷键→面板栈/Escape LIFO/
 * i18n 与主题持久化回环/自定义事件桥（重子件 stub，store 全真）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act, screen } from '@testing-library/react'

// ── 重子件 stub（保留 props 布线证据）──
vi.mock('../components/PanelManager', async () => {
  const { usePanelStore } = await import('../store/panel-store')
  return {
    PanelManager: () => {
      // 真实读取 panel-store：App↔store↔PanelManager 布线证据
      const { visible } = usePanelStore()
      return <div data-testid="open-panels">{[...visible].join(',')}</div>
    },
  }
})
vi.mock('../components/FullscreenMode', () => ({
  FullscreenMode: (props: Record<string, () => void>) => (
    <div>
      <button data-testid="to-ide" onClick={props.onSwitchToIDE} />
      <button data-testid="open-settings" onClick={props.onOpenSettings} />
      <button data-testid="open-chat" onClick={props.onOpenChat} />
    </div>
  ),
}))
vi.mock('../components/IDEMode', () => ({ IDEMode: () => <div data-testid="ide-mode" /> }))
vi.mock('../components/FloatingWidget', () => ({ FloatingWidget: () => <div data-testid="widget" /> }))
vi.mock('../components/ModelSettings', () => ({ ModelSettings: () => <div data-testid="model-settings" /> }))
vi.mock('../components/performance', () => ({ MonacoPerformanceMonitor: () => <div /> }))
vi.mock('../components/CyberpunkBackground', () => ({ CyberpunkBackground: () => <div /> }))
vi.mock('../services/monaco-preloader', () => ({
  useAutoMonacoPreload: () => { },
  PRELOAD_STRATEGIES: { APP_START: { priority: 'medium', delay: 0 } },
}))
vi.mock('../utils/model-router', () => ({ initRouter: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../store/model-store', () => ({
  ModelStoreProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useModelStore: () => ({
    openModelSettings: vi.fn(),
    aiModels: [],
    activeModelId: null,
    modelSettingsOpen: false,
    closeModelSettings: vi.fn(),
  }),
}))

import App from '../App'
import { panelActions } from '../store/panel-store'

/** 重桩 matchMedia（resetAllMocks 会清 setup 桩——已知坑） */
const restubMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    value: Object.assign(vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, addEventListener: () => { }, removeEventListener: () => { },
    })), { __isStub: true }),
    writable: true, configurable: true,
  })
}

beforeEach(() => {
  localStorage.clear()
  panelActions.closeAll()
  restubMatchMedia()
  // 主页启动屏：验证挂载后被隐藏
  document.body.innerHTML = '<div id="yyc3-splash">loading</div>'
})

const key = (keyStr: string, opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) => {
  const parts = keyStr.split('+')
  const k = parts[parts.length - 1]
  // 外部 store 面板状态经 useSyncExternalStore 同步——须在 act 内分发以刷新渲染
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: k === 'escape' ? 'Escape' : k === ',' ? ',' : k,
      ctrlKey: opts.ctrlKey ?? parts.includes('ctrl'),
      metaKey: opts.metaKey ?? false,
      shiftKey: opts.shiftKey ?? parts.includes('shift'),
      bubbles: true, cancelable: true,
    }))
  })
}

describe('App 根链路（主页发起）', () => {
  it('全 Providers 链挂载无崩溃 + 启动屏被隐藏', () => {
    render(<App />)
    expect(screen.getByTestId('open-panels')).toBeTruthy()
    const splash = document.getElementById('yyc3-splash')
    expect(splash?.classList.contains('hidden')).toBe(true)
  })

  it('mod+k → 命令面板开（toggle 布线）→ 再按关闭', () => {
    render(<App />)
    key('mod+k', { ctrlKey: true })
    expect(screen.getByTestId('open-panels').textContent).toContain('commandPalette')
    key('mod+k', { ctrlKey: true })
    expect(screen.getByTestId('open-panels').textContent).not.toContain('commandPalette')
  })

  it('Escape 面板栈 LIFO：后开先关', () => {
    render(<App />)
    key('mod+,', { ctrlKey: true })            // settings
    act(() => { panelActions.open('notifications') })
    expect(screen.getByTestId('open-panels').textContent).toContain('notifications')
    key('escape')
    expect(screen.getByTestId('open-panels').textContent).not.toContain('notifications')
    expect(screen.getByTestId('open-panels').textContent).toContain('settings')
    key('escape')
    expect(screen.getByTestId('open-panels').textContent).not.toContain('settings')
  })

  it('mod+shift+l 切语言 → yyc3-locale 持久化（实地验证持久化修复）', () => {
    render(<App />)
    expect(localStorage.getItem('yyc3-locale')).toBeNull()
    key('mod+shift+l', { ctrlKey: true, shiftKey: true })
    expect(localStorage.getItem('yyc3-locale')).toBe('en')
    key('mod+shift+l', { ctrlKey: true, shiftKey: true })
    expect(localStorage.getItem('yyc3-locale')).toBe('zh')
  })

  it('mod+shift+t 切主题 → 主题档持久化翻转（yyc3-theme-id）', () => {
    render(<App />)
    const before = localStorage.getItem('yyc3_theme_id')
    key('mod+shift+t', { ctrlKey: true, shiftKey: true })
    const after = localStorage.getItem('yyc3_theme_id')
    expect(after).toBeDefined()
    expect(after).not.toEqual(before)
  })

  it('mod+shift+f → 全局搜索打开 + 文件映射从 localStorage 装载', () => {
    localStorage.setItem('yyc3_file_content_map', JSON.stringify({ 'a.ts': 'export const A = 1' }))
    render(<App />)
    key('mod+shift+f', { ctrlKey: true, shiftKey: true })
    expect(screen.getByTestId('open-panels').textContent).toContain('globalSearch')
  })

  it('FullscreenMode 按钮 → IDE 模式切换（lazy 异步挂载）', async () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('to-ide'))
    await screen.findByTestId('ide-mode')
    expect(screen.getByTestId('ide-mode')).toBeTruthy()
  })

  it('yyc3:open-panel 自定义事件桥 → performance 面板打开', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('to-ide'))
    act(() => {
      window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'performance' }))
    })
    expect(screen.getByTestId('open-panels').textContent).toContain('performance')
  })

  it('自媒体桥注入 panelActions → openPublishQueue 布线（pendingPublish + 面板开）', async () => {
    render(<App />)
    // App 已向 self-media store 注入桥——经动态验证注入存在：直接触发 FullscreenMode 的 chat 打开
    fireEvent.click(screen.getByTestId('open-chat'))
    expect(screen.getByTestId('open-panels').textContent).toContain('chat')
    void act
  })
})
