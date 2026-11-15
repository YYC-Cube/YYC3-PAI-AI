/**
 * @file FloatingWidget.deep.test.tsx
 * @description 浮动挂件深化 — 挂件模式按钮/胶囊态/拖拽/缩放/聊天流（SSE 回调·错误·无模型·空输入）/音频电平定时器
 * （旧 FloatingWidget 无专项测试；model-store/theme-store/i18n mock，轻量子件 stub）
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ===== hoisted 状态与桩 =====
const h = vi.hoisted(() => ({
  getActiveModel: vi.fn(),
  sendToActiveModelStream: vi.fn(),
  onSwitchMode: vi.fn(),
  ui: { isCyberpunk: false },
}))

// ===== i18n mock：t() 返回 key（项目铁律） =====
vi.mock('../../i18n/context', () => ({
  useI18n: () => ({
    t: (_section: string, key: string) => key,
    locale: 'zh',
    setLocale: vi.fn(),
    toggleLocale: vi.fn(),
  }),
}))

// ===== model-store mock =====
vi.mock('../../store/model-store', () => ({
  useModelStore: () => ({
    getActiveModel: h.getActiveModel,
    sendToActiveModelStream: h.sendToActiveModelStream,
    models: [],
    activeModelId: null,
  }),
  ModelStoreProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ===== theme-store mock =====
const tokens = {
  background: '#0a0a0e',
  panelBg: '#101014',
  cardBg: '#14141a',
  cardBorder: '#26262e',
  border: '#26262e',
  borderDim: '#1b1b22',
  primary: '#3b82f6',
  primaryDim: '#93c5fd',
  primaryGlow: 'rgba(59,130,246,0.15)',
  foreground: '#f5f5f5',
  foregroundMuted: '#9ca3af',
  success: '#10b981',
  shadow: '0 4px 16px rgba(0,0,0,0.4)',
  shadowHover: '0 8px 30px rgba(0,0,0,0.5)',
  fontDisplay: 'serif',
  fontMono: 'monospace',
  fontBody: 'sans-serif',
}

vi.mock('../../store/theme-store', () => ({
  useThemeStore: () => ({ tokens, isCyberpunk: h.ui.isCyberpunk }),
}))

// ===== 轻量子件 stub =====
vi.mock('../GlitchText', () => ({
  GlitchText: ({ text }: { text: string }) => <span data-testid="glitch-text">{text}</span>,
}))
vi.mock('../LangSwitcher', () => ({
  LangSwitcher: () => <div data-testid="lang-switcher" />,
}))
vi.mock('../ThemeSwitcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))
vi.mock('../CyberTooltip', () => ({
  CyberTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { FloatingWidget } from '../FloatingWidget'

const flush = () => act(async () => { await Promise.resolve() })

const outer = () => document.querySelector('div.fixed.z-50') as HTMLElement
const iconBtn = (iconClass: string) =>
  document.querySelector(`.${iconClass}`)?.closest('button') as HTMLElement

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  h.ui.isCyberpunk = false
  h.getActiveModel.mockReturnValue({ id: 'm-1', name: 'GLM-5' })
  h.sendToActiveModelStream.mockResolvedValue('done')
})

afterEach(() => {
  vi.useRealTimers()
})

/** 完整窗口态渲染 */
const renderFull = () => render(<FloatingWidget onSwitchMode={h.onSwitchMode} />)

describe('FloatingWidget 渲染与窗口按钮', () => {
  it('完整窗口渲染：标题栏 YYC³ AI + 主题/语言切换器 + 状态栏 CPU/网络 + 初始 AI 消息（t 返回 key）', () => {
    renderFull()
    // 非赛博主题：标题为普通 span，非 GlitchText
    expect(document.body.textContent).toContain('YYC³ AI')
    expect(document.querySelector('[data-testid="glitch-text"]')).toBeNull()
    expect(document.querySelector('[data-testid="theme-switcher"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="lang-switcher"]')).toBeTruthy()
    expect(document.body.textContent).toContain('CPU: 23%')
    expect(document.body.textContent).toContain('847 TB/s')
    expect(document.body.textContent).toContain('widgetInitMessage')
    expect(document.body.textContent).toContain('aiLabel')
    // 状态栏 12 根音频电平条（class 含字面量 w-0.5 → 属性选择器匹配）
    expect(document.querySelectorAll('[class~="w-0.5"]').length).toBe(12)
  })

  it('赛博主题变体：标题栏走 GlitchText 分支，胶囊态 logo 带发光 filter', () => {
    h.ui.isCyberpunk = true
    renderFull()
    expect(document.querySelector('[data-testid="glitch-text"]')).toBeTruthy()
    // 最小化为胶囊 → 赛博分支 logo filter: drop-shadow
    fireEvent.click(iconBtn('lucide-minus'))
    const imgStyle = document.querySelector('img')!.getAttribute('style') || ''
    expect(imgStyle).toContain('drop-shadow')
    h.ui.isCyberpunk = false
  })

  it('全屏模式按钮：点击透传 onSwitchMode 回调', () => {
    renderFull()
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'fullMode') as HTMLElement
    expect(btn).toBeTruthy()
    fireEvent.click(btn)
    expect(h.onSwitchMode).toHaveBeenCalledTimes(1)
  })

  it('最大化/还原：点击后铺满视口（innerWidth-40）且缩放手柄消失，再点恢复原尺寸与手柄', () => {
    renderFull()
    expect(outer().style.width).toBe('420px')
    expect(document.querySelector('.cursor-se-resize')).toBeTruthy()
    fireEvent.click(iconBtn('lucide-maximize-2'))
    expect(outer().style.width).toBe(`${window.innerWidth - 40}px`)
    expect(outer().style.height).toBe(`${window.innerHeight - 40}px`)
    expect(outer().style.left).toBe('20px')
    expect(document.querySelector('.cursor-se-resize')).toBeNull()
    // 还原
    fireEvent.click(iconBtn('lucide-minimize-2'))
    expect(outer().style.width).toBe('420px')
    expect(outer().style.height).toBe('520px')
    expect(document.querySelector('.cursor-se-resize')).toBeTruthy()
  })

  it('挂件胶囊态：最小化按钮收起为胶囊（6 根音频条），点击胶囊恢复完整窗口', () => {
    renderFull()
    // 关闭（X）与最小化（Minus）都进入胶囊态 — 用 Minus
    fireEvent.click(iconBtn('lucide-minus'))
    expect(document.body.textContent).not.toContain('CPU: 23%')
    expect(document.querySelectorAll('[class~="w-1"]').length).toBe(6)
    // 非赛博主题胶囊文案（HTML 实体已解析为 ³）
    expect(document.body.textContent).toContain('YYC³')
    // 点击胶囊恢复
    fireEvent.click(outer())
    expect(document.body.textContent).toContain('CPU: 23%')
    expect(document.body.textContent).toContain('widgetInitMessage')
  })

  it('标题栏拖拽：mousedown 后 window mousemove 更新 left/top', () => {
    renderFull()
    const titleBar = document.querySelector('.cursor-move') as HTMLElement
    fireEvent.mouseDown(titleBar, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 150, clientY: 120 })
    expect(outer().style.left).toBe('150px')
    expect(outer().style.top).toBe('120px')
    fireEvent.mouseUp(window)
    // 松开后不再跟随
    fireEvent.mouseMove(window, { clientX: 400, clientY: 400 })
    expect(outer().style.left).toBe('150px')
  })

  it('右下角缩放手柄：mousedown+mousemove 改变尺寸，最小 320x300 钳制；最大化态下拖标题栏无效', () => {
    renderFull()
    const handle = document.querySelector('.cursor-se-resize') as HTMLElement
    fireEvent.mouseDown(handle, { clientX: 500, clientY: 500, stopPropagation: vi.fn() })
    fireEvent.mouseMove(window, { clientX: 620, clientY: 560 })
    expect(outer().style.width).toBe('540px')
    expect(outer().style.height).toBe('580px')
    // 反向缩小 → 钳制下限
    fireEvent.mouseMove(window, { clientX: 100, clientY: 100 })
    expect(outer().style.width).toBe('320px')
    expect(outer().style.height).toBe('300px')
    fireEvent.mouseUp(window)
    // 最大化后标题栏拖拽被禁用（startDrag 早退）
    fireEvent.click(iconBtn('lucide-maximize-2'))
    const titleBar = document.querySelector('.cursor-move') as HTMLElement
    fireEvent.mouseDown(titleBar, { clientX: 50, clientY: 50 })
    fireEvent.mouseMove(window, { clientX: 300, clientY: 300 })
    expect(outer().style.left).toBe('20px')
    expect(outer().style.top).toBe('20px')
  })
})

describe('FloatingWidget 聊天流', () => {
  const input = () => document.querySelector('input') as HTMLInputElement

  it('有激活模型发送：Enter 追加用户消息 + AI 占位，SSE onDelta 回调以 full 更新最后一条 AI 消息', async () => {
    h.sendToActiveModelStream.mockImplementation(
      async (_msg: string, _sys: unknown, onDelta: (d: unknown, full: string) => void) => {
        onDelta('你好', '你好，世界')
        onDelta('你好，世界！', '你好，世界！完整回复')
        return 'done'
      },
    )
    renderFull()
    fireEvent.change(input(), { target: { value: '测试问题' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(input().value).toBe('')
    expect(h.sendToActiveModelStream).toHaveBeenCalledWith('测试问题', undefined, expect.any(Function))
    await flush()
    expect(document.body.textContent).toContain('测试问题')
    expect(document.body.textContent).toContain('你好，世界！完整回复')
    // 用户消息标签 youLabel 出现
    expect(document.body.textContent).toContain('youLabel')
  })

  it('流式失败：Promise reject 时最后一条 AI 消息回填 [错误] + detail', async () => {
    h.sendToActiveModelStream.mockRejectedValueOnce(new Error('SSE 断流'))
    renderFull()
    fireEvent.change(input(), { target: { value: '会失败的问题' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    await waitFor(() => expect(document.body.textContent).toContain('[错误] SSE 断流'))
    expect(h.sendToActiveModelStream).toHaveBeenCalledTimes(1)
  })

  it('无激活模型：占位 AI 消息替换为未激活提示且不发起流式请求', async () => {
    h.getActiveModel.mockReturnValue(null)
    renderFull()
    fireEvent.change(input(), { target: { value: '离线提问' } })
    fireEvent.click(iconBtn('lucide-send'))
    await flush()
    expect(h.sendToActiveModelStream).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('未激活模型——请先在设置中激活。')
  })

  it('空输入与纯空白输入：Enter/点击发送均不触发流式请求', () => {
    renderFull()
    fireEvent.change(input(), { target: { value: '   ' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    fireEvent.click(iconBtn('lucide-send'))
    expect(h.sendToActiveModelStream).not.toHaveBeenCalled()
    // 无新增用户消息标签
    expect(document.body.textContent).not.toContain('youLabel')
  })
})

describe('FloatingWidget 音频电平与卸载', () => {
  it('150ms 定时器刷新 12 根电平条高度（fake timers），卸载后清理不泄漏', () => {
    vi.useFakeTimers()
    const { unmount } = renderFull()
    const heightBefore = (document.querySelector('[class~="w-0.5"]') as HTMLElement).style.height
    act(() => { vi.advanceTimersByTime(160) })
    const heights = Array.from(document.querySelectorAll('[class~="w-0.5"]')).map(el => (el as HTMLElement).style.height)
    expect(heights.length).toBe(12)
    expect(heights.some(hh => hh !== heightBefore)).toBe(true)
    // 卸载后定时器不再触发（无元素可变，仅验证不抛错）
    unmount()
    act(() => { vi.advanceTimersByTime(500) })
  })
})
