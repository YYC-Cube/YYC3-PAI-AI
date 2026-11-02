/**
 * @file SettingsPanel.deep.test.tsx
 * @description 设置中心二轮深化 — 侧栏分组/页签路由/搜索命中与过滤/编辑器偏好落盘/主题与效果/about 导出重置/关闭布线
 * （重型子页签 vi.mock stub；editor-prefs/theme/settings store 走真实实现并以 localStorage 断言）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

const h = vi.hoisted(() => ({
  openModelSettings: vi.fn(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => ({ openModelSettings: h.openModelSettings }),
}))

vi.mock('../settings/AIServiceTabs', () => ({
  AgentsTab: () => <div data-testid="stub-agents" />,
  ContextTab: () => <div data-testid="stub-context" />,
  ConversationTab: () => <div data-testid="stub-conversation" />,
  MCPTab: () => <div data-testid="stub-mcp" />,
  RulesSkillsTab: () => <div data-testid="stub-rules-skills" />,
}))

vi.mock('../settings/WorkspaceTabs', () => ({
  AccountTab: () => <div data-testid="stub-account" />,
  LayoutsTab: () => <div data-testid="stub-layouts" />,
  ShortcutsTab: () => <div data-testid="stub-shortcuts" />,
}))

vi.mock('../audio/AudioPanel', () => ({
  AudioPanel: () => <div data-testid="stub-audio" />,
}))

import { SettingsPanel } from '../SettingsPanel'
import { editorPrefsStore } from '../../store/editor-prefs-store'
import { themeStore } from '../../store/theme-store'
import { settingsActions } from '../../store/settings-store'

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  // resetAllMocks 会清掉 setup.ts 中 matchMedia 的 mockImplementation（返回 undefined），
  // 而 themeStore.setAutoDetect → getSystemPreference 会读 .matches；此处重新桩定
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  // 真实 store 为模块级单例：显式复位，避免跨用例串扰
  editorPrefsStore.reset()
  themeStore.setTheme('cyberpunk')
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const renderOpen = (onClose = vi.fn()) => ({ onClose, ...render(<SettingsPanel visible onClose={onClose} />) })

const sideTab = (key: string) => document.querySelector(`[data-settings-tab="${key}"]`) as HTMLElement

const btnIncluding = (text: string) =>
  Array.from(document.querySelectorAll('button')).find(b => b.textContent!.includes(text)) as HTMLElement

const btnExact = (text: string) =>
  Array.from(document.querySelectorAll('button')).find(b => b.textContent === text) as HTMLElement

/** ToggleRow：按标签文本定位行内开关按钮 */
const toggleFor = (label: string) => {
  const p = Array.from(document.querySelectorAll('p')).find(el => el.textContent === label)!
  return p.parentElement!.parentElement!.querySelector('button') as HTMLElement
}

const searchInput = () => document.querySelector('input[placeholder="searchPlaceholder"]') as HTMLInputElement

const lsJson = <T,>(key: string): T => JSON.parse(localStorage.getItem(key) || 'null') as T

const body = () => document.body.textContent!

describe('SettingsPanel 门控与侧栏结构', () => {
  it('visible=false → null；打开渲染 14 个页签 + 三组中文分组标签 + 版本脚注', () => {
    const { container, rerender } = render(<SettingsPanel visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<SettingsPanel visible onClose={() => {}} />)
    expect(document.querySelectorAll('[data-settings-tab]')).toHaveLength(14)
    for (const g of ['基础设置', 'AI 服务', '扩展功能']) expect(body()).toContain(g)
    expect(body()).toContain('YYC3 AI Code v4.8.2')
    // 默认 general 激活：左边框主色
    expect(sideTab('general').style.borderLeft).toContain('2px solid')
    expect(sideTab('general').style.borderLeft).not.toContain('transparent')
    expect(sideTab('editor').style.borderLeft).toContain('transparent')
  })

  it('general 默认页：语言双按钮（zh 带勾选）/ 默认模式三按钮；autoDetectTheme 开关写入 yyc3_theme_auto', () => {
    renderOpen()
    const zh = btnIncluding('langZh')
    const en = btnIncluding('langEn')
    expect(zh.querySelector('svg.lucide-check')).toBeTruthy()
    expect(en.querySelector('svg.lucide-check')).toBeNull()
    expect(btnIncluding('fullscreen')).toBeTruthy()
    expect(btnIncluding('IDE')).toBeTruthy()
    expect(btnIncluding('widget')).toBeTruthy()

    fireEvent.click(toggleFor('autoDetectTheme'))
    expect(localStorage.getItem('yyc3_theme_auto')).toBe('true')
  })
})

describe('SettingsPanel 编辑器偏好（真实 store 落盘）', () => {
  it('editor 页：fontSize 滑杆 → 16px；tabSize 点 4 → yyc3_editor_prefs 持久化并高亮', () => {
    renderOpen()
    fireEvent.click(sideTab('editor'))
    const range = document.querySelector('input[type="range"][aria-label="fontSize"]') as HTMLInputElement
    expect(range.value).toBe('13')
    fireEvent.change(range, { target: { value: '16' } })
    expect(body()).toContain('16px')
    expect(lsJson<{ fontSize: number }>('yyc3_editor_prefs').fontSize).toBe(16)

    fireEvent.click(btnExact('4'))
    expect(lsJson<{ tabSize: number }>('yyc3_editor_prefs').tabSize).toBe(4)
    expect(editorPrefsStore.getState().tabSize).toBe(4)
  })

  it('editor 页 ToggleRow：wordWrap 关→开、minimap 开→关 均落盘', () => {
    renderOpen()
    fireEvent.click(sideTab('editor'))
    fireEvent.click(toggleFor('wordWrap'))
    expect(lsJson<{ wordWrap: boolean }>('yyc3_editor_prefs').wordWrap).toBe(true)
    fireEvent.click(toggleFor('minimap'))
    expect(lsJson<{ minimap: boolean }>('yyc3_editor_prefs').minimap).toBe(false)
    expect(editorPrefsStore.getState().autoSave).toBe(true)
  })
})

describe('SettingsPanel 外观（主题与效果）', () => {
  it('appearance 页：切 clean → yyc3_theme_id=clean 且效果区禁用（effectsCyberpunkOnly / pointerEvents none）；切回恢复', () => {
    renderOpen()
    fireEvent.click(sideTab('appearance'))
    expect(body()).toContain('effectsCyberpunkCtrl')
    fireEvent.click(btnIncluding('现代简约'))
    expect(localStorage.getItem('yyc3_theme_id')).toBe('clean')
    expect(body()).toContain('effectsCyberpunkOnly')
    const effectsBox = toggleFor('glitchEffect').closest('div[style*="pointer-events"]') as HTMLElement
    expect(effectsBox.style.pointerEvents).toBe('none')
    fireEvent.click(btnIncluding('赛博朋克'))
    expect(localStorage.getItem('yyc3_theme_id')).toBe('cyberpunk')
    expect(body()).toContain('effectsCyberpunkCtrl')
  })

  it('appearance 页：glitch/scanline 效果开关翻转并写入 yyc3_theme_effects', () => {
    renderOpen()
    fireEvent.click(sideTab('appearance'))
    const before = themeStore.getState().effects
    fireEvent.click(toggleFor('glitchEffect'))
    expect(lsJson<{ enableGlitch: boolean }>('yyc3_theme_effects').enableGlitch).toBe(!before.enableGlitch)
    fireEvent.click(toggleFor('scanlineEffect'))
    expect(lsJson<{ enableScanlines: boolean }>('yyc3_theme_effects').enableScanlines).toBe(!before.enableScanlines)
  })
})

describe('SettingsPanel 搜索', () => {
  it('输入 font → 命中 fontSize（上下文 tabEditor）→ 点击跳转 editor 页并清空搜索', () => {
    renderOpen()
    fireEvent.change(searchInput(), { target: { value: 'font' } })
    const hit = btnExact('fontSizetabEditor')
    expect(hit).toBeTruthy()
    // 侧栏同步过滤：仅 editor 页签保留
    expect(sideTab('editor')).toBeTruthy()
    expect(sideTab('general')).toBeNull()
    fireEvent.click(hit)
    expect(document.querySelector('input[type="range"][aria-label="fontSize"]')).toBeTruthy()
    expect(searchInput().value).toBe('')
    expect(document.querySelectorAll('[data-settings-tab]')).toHaveLength(14)
  })

  it('无结果：searchNoResults 文案 + 侧栏清空；清除按钮恢复 14 页签', () => {
    renderOpen()
    fireEvent.change(searchInput(), { target: { value: 'zzz-nothing' } })
    expect(body()).toContain('searchNoResults')
    expect(document.querySelectorAll('[data-settings-tab]')).toHaveLength(0)
    fireEvent.click(document.querySelector('button[aria-label="Clear search"]')!)
    expect(searchInput().value).toBe('')
    expect(document.querySelectorAll('[data-settings-tab]')).toHaveLength(14)
  })

  it('输入 agent → 侧栏仅保留 agents 页签，命中列表最多 8 条', () => {
    renderOpen()
    fireEvent.change(searchInput(), { target: { value: 'agent' } })
    expect(sideTab('agents')).toBeTruthy()
    expect(sideTab('general')).toBeNull()
    expect(sideTab('editor')).toBeNull()
    const hits = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('svg.lucide-search'))
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(8)
  })
})

describe('SettingsPanel 页签路由', () => {
  it('models 侧栏项为外链：openModelSettings + onClose，且不切换内容页', () => {
    const { onClose } = renderOpen()
    expect(sideTab('models').querySelector('svg.lucide-external-link')).toBeTruthy()
    fireEvent.click(sideTab('models'))
    expect(h.openModelSettings).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('九个抽离子页签分别渲染对应 stub', () => {
    renderOpen()
    const pairs: Array<[string, string]> = [
      ['shortcuts', 'stub-shortcuts'], ['layouts', 'stub-layouts'], ['account', 'stub-account'],
      ['agents', 'stub-agents'], ['mcp', 'stub-mcp'], ['context', 'stub-context'],
      ['conversation', 'stub-conversation'], ['rules-skills', 'stub-rules-skills'], ['audio', 'stub-audio'],
    ]
    for (const [key, testid] of pairs) {
      fireEvent.click(sideTab(key))
      expect(document.querySelector(`[data-testid="${testid}"]`)).toBeTruthy()
      expect(document.querySelectorAll('[data-testid^="stub-"]')).toHaveLength(1)
    }
  })
})

describe('SettingsPanel about 页', () => {
  it('信息行 + 姊妹站深链 + 导出配置（exportConfig → 下载 yyc3-settings-日期.json）', () => {
    const exportSpy = vi.spyOn(settingsActions, 'exportConfig')
    const downloads: string[] = []
    vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(function (this: HTMLElement) {
      downloads.push((this as HTMLAnchorElement).download)
    })
    const createUrl = vi.fn(() => 'blob:mock')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true, writable: true })

    renderOpen()
    fireEvent.click(sideTab('about'))
    for (const txt of ['YanYuCloudCube Team', 'MIT', 'Monaco Editor', '0.45.x', 'YYC3-Pai Platform', '言启象限 | 语枢未来']) {
      expect(body()).toContain(txt)
    }
    const link = document.querySelector('a[href="https://pai-ai.yyc3.vip"]') as HTMLAnchorElement
    expect(link.target).toBe('_blank')

    fireEvent.click(btnIncluding('exportConfig'))
    expect(exportSpy).toHaveBeenCalledTimes(1)
    expect(createUrl).toHaveBeenCalledTimes(1)
    expect(revokeUrl).toHaveBeenCalledWith('blob:mock')
    expect(downloads).toHaveLength(1)
    expect(downloads[0]).toMatch(/^yyc3-settings-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('重置全部：confirm=false 不触发；confirm=true 调用 resetSettings', () => {
    const resetSpy = vi.spyOn(settingsActions, 'resetSettings').mockImplementation(() => {})
    const confirmMock = vi.fn(() => false)
    vi.stubGlobal('confirm', confirmMock)
    renderOpen()
    fireEvent.click(sideTab('about'))
    fireEvent.click(btnIncluding('resetAll'))
    expect(confirmMock).toHaveBeenCalledWith('resetConfirm')
    expect(resetSpy).not.toHaveBeenCalled()
    confirmMock.mockReturnValue(true)
    fireEvent.click(btnIncluding('resetAll'))
    expect(resetSpy).toHaveBeenCalledTimes(1)
  })
})

describe('SettingsPanel 关闭布线', () => {
  it('遮罩点击关闭、面板内部点击不关闭、右上角关闭按钮关闭', () => {
    const { container, onClose } = renderOpen()
    const overlay = container.firstElementChild as HTMLElement
    fireEvent.click(overlay.firstElementChild!)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(document.querySelector('button[aria-label="Close settings"]')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
