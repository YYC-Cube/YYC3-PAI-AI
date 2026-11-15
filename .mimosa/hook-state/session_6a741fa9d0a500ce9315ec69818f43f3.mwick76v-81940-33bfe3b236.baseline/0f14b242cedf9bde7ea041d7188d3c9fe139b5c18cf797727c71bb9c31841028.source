/**
 * @file FullscreenMode.deep.test.tsx
 * @description 全屏仪表盘（FullscreenMode）专项 — 骨架与 i18n key 回退/模型指示与连通性状态色/入口回调布线/
 *              导航页签与统计详情/侧栏悬停伸缩与模块动作/四路定时器/聊天发送（无模型指引·真 SSE 流式·历史窗口·失败写回）/
 *              英文 locale 与主题切换分支
 * 策略：真 theme-store + 真 i18n（缺省走 fallback：t() 返回 key）；model-store 受控桩（vi.hoisted）；
 *       重型子组件 MiniAudioPlayer / AIMessageRenderer / StatDetailPanel 以 vi.mock 桩替；全程假时钟
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'

// ── 受控桩（vi.mock 工厂引用的外部值必须经 vi.hoisted） ──

type Connectivity = { modelId: string; status: 'unknown' | 'checking' | 'online' | 'offline'; latencyMs?: number }
type ModelFixture = { id: string; name: string; provider: 'custom'; endpoint: string; apiKey: string; isActive: boolean }
type StreamOptions = { systemPrompt?: string; history?: { role: string; content: string }[] }
type OnChunk = (delta: string, full: string) => void
type StreamFn = (message: string, options?: StreamOptions, onChunk?: OnChunk) => Promise<string>

const h = vi.hoisted(() => ({
  store: {
    openModelSettings: vi.fn<(initialTab?: string) => void>(),
    getActiveModel: vi.fn<() => ModelFixture | null>(),
    sendToActiveModelStream: vi.fn<StreamFn>(),
    activeModelId: null as string | null,
    connectivityMap: {} as Record<string, Connectivity>,
    lastSuccessTime: 0,
  },
  toast: vi.fn<(message: string) => void>(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => h.store,
}))

vi.mock('../CyberToast', () => ({
  cyberToast: h.toast,
}))

vi.mock('../audio/MiniAudioPlayer', () => ({
  MiniAudioPlayer: () => <div data-testid="mini-audio" />,
}))

vi.mock('../ide/AIMessageRenderer', () => ({
  AIMessageRenderer: ({ content }: { content: string }) => <div data-testid="chat-msg">{content}</div>,
}))

vi.mock('../StatDetailPanel', () => ({
  StatDetailPanel: ({ stat, onClose }: { stat: { key: string; value: number }; onClose: () => void }) => (
    <div data-testid="stat-detail" data-key={stat.key}>
      <button data-testid="stat-close" onClick={onClose}>close</button>
    </div>
  ),
}))

import { FullscreenMode } from '../FullscreenMode'
import { I18nProvider } from '../../i18n/context'
import { THEMES, themeStore } from '../../store/theme-store'

// ── Fixtures / Helpers ──

const tk = THEMES.cyberpunk
const BASE_TIME = new Date(2026, 0, 15, 8, 30, 0)
const NAV = ['neural', 'data', 'network', 'security']
const NO_MODEL_HINT = '未激活模型——请打开 设置 → 模型管理 激活后重试。'

const model = (over: Partial<ModelFixture> = {}): ModelFixture => ({
  id: 'm1',
  name: 'GLM-4',
  provider: 'custom',
  endpoint: 'https://llm.example.com/v1',
  apiKey: '',
  isActive: true,
  ...over,
})

/** 让受控 model-store 进入「已激活模型」态（可附带连通性记录与最近成功时间） */
const activate = (m: ModelFixture, cs?: Connectivity, lastSuccessTime = 0) => {
  h.store.activeModelId = m.id
  h.store.getActiveModel.mockReturnValue(m)
  h.store.connectivityMap = cs ? { [m.id]: cs } : {}
  h.store.lastSuccessTime = lastSuccessTime
}

const requiredProps = () => ({ onSwitchMode: vi.fn(), onSwitchToIDE: vi.fn() })

const optionalProps = () => ({
  onOpenGlobalSearch: vi.fn(),
  onOpenCommandPalette: vi.fn(),
  onOpenSettings: vi.fn(),
  onOpenNotifications: vi.fn(),
  onOpenAIWriting: vi.fn(),
  onOpenContentTemplate: vi.fn(),
  onOpenMaterialManager: vi.fn(),
  onOpenPublishQueue: vi.fn(),
  onOpenTrendingTopics: vi.fn(),
  onOpenChat: vi.fn(),
})

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

/** 冲刷已决议的 Promise（流式回调的 then/catch） */
const flush = () => act(async () => {})

const byLabel = (root: HTMLElement, label: string) =>
  root.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement

/** CyberTooltip 包裹层：按 tooltip 文案定位其内的按钮 */
const tipBtn = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll('div.relative.group'))
    .find(w => w.lastElementChild?.textContent === label)!
    .querySelector('button') as HTMLButtonElement

/** 当前处于激活态的顶栏页签（激活态背景为主色，其余 transparent） */
const activeTabs = (root: HTMLElement) =>
  NAV.filter(key => byLabel(root, key).style.background !== 'transparent')

const chatTexts = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('[data-testid="chat-msg"]')).map(n => n.textContent)

const lastChat = (root: HTMLElement) => {
  const texts = chatTexts(root)
  return texts[texts.length - 1]
}

const chatInput = (root: HTMLElement) => root.querySelector('input') as HTMLInputElement

const sendText = (root: HTMLElement, text: string) => {
  fireEvent.change(chatInput(root), { target: { value: text } })
  fireEvent.keyDown(chatInput(root), { key: 'Enter' })
}

const statDetail = (root: HTMLElement) => root.querySelector('[data-testid="stat-detail"]')

let randomSpy: { mockRestore: () => void } | null = null
const fixRandom = (value: number) => {
  randomSpy = vi.spyOn(Math, 'random').mockReturnValue(value)
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.store.activeModelId = null
  h.store.connectivityMap = {}
  h.store.lastSuccessTime = 0
  vi.useFakeTimers()
  vi.setSystemTime(BASE_TIME)
})

afterEach(() => {
  // 先在假时钟下卸载（组件清掉自身四路 interval），再还原真时钟与被改动的全局态
  cleanup()
  vi.useRealTimers()
  randomSpy?.mockRestore()
  randomSpy = null
  if (themeStore.getState().themeId !== 'cyberpunk') themeStore.setTheme('cyberpunk')
})

describe('FullscreenMode（全屏仪表盘模式）', () => {
  it('骨架渲染：顶栏/侧栏/统计卡/聊天初始消息/系统信息/进程/页脚（无 Provider 时 t() 回退为 key）', () => {
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    // 顶栏：品牌（赛博朋克下为故障字）、四个导航页签（首个激活）、音乐播放器入口
    expect(container.querySelector('img[alt="YYC³"]')).toBeTruthy()
    expect(container.querySelector('[data-text="YYC³"]')!.classList.contains('neon-text-cyan')).toBe(true)
    for (const key of NAV) expect(byLabel(container, key)).toBeTruthy()
    expect(activeTabs(container)).toEqual(['neural'])
    expect(container.querySelector('[data-testid="mini-audio"]')).toBeTruthy()
    // 侧栏：收起态 56px，六模块
    const aside = container.querySelector('aside') as HTMLElement
    expect(aside.style.width).toBe('56px')
    expect(aside.querySelectorAll('button')).toHaveLength(6)
    for (const key of ['neuralCore', 'dataMatrix', 'netScanner', 'iceBreaker', 'cliAccess', 'config']) {
      expect(aside.textContent).toContain(key)
    }
    // 统计卡：四项初值
    const cards = container.querySelectorAll('.stat-card-interactive')
    const stats: Array<[string, string]> = [
      ['neuralNet', '97.3%'], ['memory', '64.8%'], ['bandwidth', '82.1%'], ['quantum', '45.6%'],
    ]
    expect(cards).toHaveLength(4)
    stats.forEach(([key, value], i) => {
      expect(cards[i].textContent).toContain(key)
      expect(cards[i].textContent).toContain(value)
    })
    // 聊天：三条初始消息、输入占位、无加载指示
    expect(chatTexts(container)).toEqual(['initMessage', 'userMsg1', 'aiMsg1'])
    expect(chatInput(container).placeholder).toBe('enterCommand')
    expect(container.textContent).not.toContain('aiThinking')
    // 右侧：系统信息 + 进程表
    for (const text of ['4.7 THz', '2,847', 'AES-512', '98.2%', 'neural_opt.exe', 'quantum_sync.bin']) {
      expect(container.textContent).toContain(text)
    }
    // 页脚：状态项、首条日志、版本号
    const footer = container.querySelector('footer')!
    for (const text of ['sysNominal', 'threatLevel', 'netSpeed', '> log1', 'YYC³ v4.8.0 | BUILD 20260313']) {
      expect(footer.textContent).toContain(text)
    }
    // 统计详情默认不展示
    expect(statDetail(container)).toBeNull()
  })

  it('无活跃模型：指示器显示 OFF、连接状态灰显、页脚无模型指示；点击打开模型设置', () => {
    const { container, unmount } = render(<FullscreenMode {...requiredProps()} />)
    const indicator = tipBtn(container, 'modelConfig')
    expect(indicator.textContent).toBe('OFF')
    expect(container.querySelector('svg.lucide-wifi')!.getAttribute('stroke')).toBe(tk.foregroundMuted)
    expect(container.querySelector('footer')!.textContent).not.toContain('modelIndicator')
    fireEvent.click(indicator)
    expect(h.store.openModelSettings).toHaveBeenCalledTimes(1)
    unmount()

    // activeModelId 残留但模型已被移除（getActiveModel 返回 null）→ 同样降级为 OFF/灰显
    h.store.activeModelId = 'ghost'
    h.store.getActiveModel.mockReturnValue(null)
    const again = render(<FullscreenMode {...requiredProps()} />)
    expect(tipBtn(again.container, 'modelConfig').textContent).toBe('OFF')
    expect(again.container.querySelector('svg.lucide-wifi')!.getAttribute('stroke')).toBe(tk.foregroundMuted)
  })

  it('活跃模型：名称截断（顶栏 12 字 / 页脚 10 字）+ 延迟展示 + 连通性状态色全分支', () => {
    activate(model({ name: 'GLM-4-Plus-Turbo-Preview' }), { modelId: 'm1', status: 'online', latencyMs: 42 })
    const first = render(<FullscreenMode {...requiredProps()} />)
    expect(tipBtn(first.container, 'modelConfig').textContent).toBe('GLM-4-Plus-T…')
    expect(first.container.querySelector('footer')!.textContent).toContain('modelIndicator: GLM-4-Plus… · 42ms')
    first.unmount()

    const now = Date.now()
    const cases: Array<{ name: string; cs?: Connectivity; last?: number; color: string; pulse?: boolean }> = [
      { name: '未探测（无连通性记录）视为可用', color: tk.success },
      { name: '在线', cs: { modelId: 'm1', status: 'online' }, color: tk.success },
      { name: '探测中', cs: { modelId: 'm1', status: 'checking' }, color: tk.success, pulse: true },
      { name: '离线但 5 分钟内成功过', cs: { modelId: 'm1', status: 'offline' }, last: now - 60_000, color: tk.success },
      { name: '离线且成功记录已过期', cs: { modelId: 'm1', status: 'offline' }, last: now - 600_000, color: tk.error },
      { name: '离线且从未成功', cs: { modelId: 'm1', status: 'offline' }, color: tk.error },
      { name: '状态未知', cs: { modelId: 'm1', status: 'unknown' }, color: tk.foregroundMuted },
    ]
    for (const c of cases) {
      activate(model(), c.cs, c.last ?? 0)
      const { container, unmount } = render(<FullscreenMode {...requiredProps()} />)
      const indicator = tipBtn(container, 'modelConfig')
      // 短名称不截断；无延迟数据时页脚不带 ms 后缀
      expect(indicator.textContent, c.name).toBe('GLM-4')
      expect(container.querySelector('footer')!.textContent, c.name).not.toContain(' · ')
      // 顶栏 Wifi 与页脚 Radio 同色
      expect(container.querySelector('svg.lucide-wifi')!.getAttribute('stroke'), c.name).toBe(c.color)
      expect(container.querySelector('svg.lucide-radio')!.getAttribute('stroke'), c.name).toBe(c.color)
      // 仅「探测中」状态点带脉冲动画
      const dotStyle = indicator.querySelector('div.rounded-full')!.getAttribute('style') ?? ''
      expect(dotStyle.includes('animation: pulse 1.5s infinite'), c.name).toBe(Boolean(c.pulse))
      unmount()
    }
  })

  it('顶栏与创作引擎入口：可选回调缺省时点击不抛错；提供后逐一布线，模式切换/IDE 必选回调生效', () => {
    const required = requiredProps()
    const { container, rerender } = render(<FullscreenMode {...required} />)
    const targets = (root: HTMLElement) => [
      byLabel(root, 'search'),
      byLabel(root, 'Command Palette'),
      byLabel(root, 'settings'),
      byLabel(root, 'notifications'),
      tipBtn(root, 'AI写作助手'),
      tipBtn(root, '内容模板'),
      tipBtn(root, '素材管理器'),
      tipBtn(root, '多平台发布'),
      tipBtn(root, '热点选题'),
      tipBtn(root, '智能聊天'),
    ]
    // 可选回调全缺省：可选链兜底，界面保持完好
    for (const btn of targets(container)) fireEvent.click(btn)
    expect(chatTexts(container)).toHaveLength(3)

    const optional = optionalProps()
    rerender(<FullscreenMode {...required} {...optional} />)
    const handlers = Object.values(optional)
    targets(container).forEach((btn, i) => {
      fireEvent.click(btn)
      // 第 i 个入口只触发第 i 个回调
      handlers.forEach((fn, j) => expect(fn).toHaveBeenCalledTimes(j <= i ? 1 : 0))
    })

    // 必选回调：小组件模式切换 + IDE 模式
    const switchBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('widgetMode'))!
    fireEvent.click(switchBtn)
    expect(required.onSwitchMode).toHaveBeenCalledTimes(1)
    fireEvent.click(byLabel(container, 'ideMode'))
    expect(required.onSwitchToIDE).toHaveBeenCalledTimes(1)
  })

  it('导航页签与统计卡：点击打开对应统计详情（页签 i ↔ 统计项 i），关闭后收起', () => {
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    const pairs: Array<[string, string]> = [
      ['data', 'memory'], ['network', 'bandwidth'], ['security', 'quantum'], ['neural', 'neuralNet'],
    ]
    for (const [tab, statKey] of pairs) {
      fireEvent.click(byLabel(container, tab))
      expect(activeTabs(container)).toEqual([tab])
      expect(statDetail(container)!.getAttribute('data-key')).toBe(statKey)
    }
    fireEvent.click(container.querySelector('[data-testid="stat-close"]')!)
    expect(statDetail(container)).toBeNull()

    // 统计卡点击同样打开详情，且不改变当前页签
    fireEvent.click(container.querySelectorAll('.stat-card-interactive')[2])
    expect(statDetail(container)!.getAttribute('data-key')).toBe('bandwidth')
    expect(activeTabs(container)).toEqual(['neural'])
    fireEvent.click(container.querySelector('[data-testid="stat-close"]')!)
    expect(statDetail(container)).toBeNull()
  })

  it('侧栏悬停：进入展开 208px，离开 300ms 后收起 56px；离开窗口内重新进入取消收起', () => {
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    const aside = container.querySelector('aside') as HTMLElement
    const bars = () => aside.querySelectorAll('.h-10 > div')
    const sensorActive = () => aside.querySelector('.sidebar-sensor-line')!.classList.contains('active')
    // 收起态：6 根电平条 + 六个悬浮提示
    expect(bars()).toHaveLength(6)
    expect(aside.querySelectorAll('.pointer-events-none')).toHaveLength(6)
    expect(sensorActive()).toBe(false)

    fireEvent.mouseEnter(aside)
    expect(aside.style.width).toBe('208px')
    expect(bars()).toHaveLength(16)
    expect(aside.querySelectorAll('.pointer-events-none')).toHaveLength(0)
    expect(sensorActive()).toBe(true)

    fireEvent.mouseLeave(aside)
    advance(299)
    expect(aside.style.width).toBe('208px')
    advance(1)
    expect(aside.style.width).toBe('56px')

    // 离开后 300ms 窗口内重新进入 → 取消待执行的收起
    fireEvent.mouseEnter(aside)
    fireEvent.mouseLeave(aside)
    advance(200)
    fireEvent.mouseEnter(aside)
    advance(1000)
    expect(aside.style.width).toBe('208px')
  })

  it('侧栏模块动作：四模块切换页签并提示；CLI 提示后 600ms 切 IDE；配置打开设置', () => {
    const required = requiredProps()
    const onOpenSettings = vi.fn()
    const { container } = render(<FullscreenMode {...required} onOpenSettings={onOpenSettings} />)
    const items = Array.from(container.querySelectorAll('aside button'))
    const modules: Array<[string, string]> = [
      ['dataMatrix', 'data'], ['netScanner', 'network'], ['iceBreaker', 'security'], ['neuralCore', 'neural'],
    ]
    const indexOf: Record<string, number> = { neuralCore: 0, dataMatrix: 1, netScanner: 2, iceBreaker: 3 }
    for (const [key, tab] of modules) {
      fireEvent.click(items[indexOf[key]])
      expect(h.toast).toHaveBeenLastCalledWith(key)
      expect(activeTabs(container)).toEqual([tab])
    }
    expect(h.toast).toHaveBeenCalledTimes(4)
    // 侧栏切页签不弹统计详情（仅顶栏页签会弹）
    expect(statDetail(container)).toBeNull()

    fireEvent.click(items[4])
    expect(h.toast).toHaveBeenLastCalledWith('cliAccess')
    advance(599)
    expect(required.onSwitchToIDE).not.toHaveBeenCalled()
    advance(1)
    expect(required.onSwitchToIDE).toHaveBeenCalledTimes(1)

    fireEvent.click(items[5])
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
    expect(h.toast).toHaveBeenCalledTimes(5)
  })

  it('四路定时器：150ms 音频电平 / 1s 时钟 / 2s 统计抖动（上限钳制 99）/ 3s 日志轮播（8 条一轮）', () => {
    fixRandom(0.9)
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    const bars = () => Array.from(container.querySelectorAll<HTMLElement>('aside .h-10 > div'))
    const clockAt = (offsetMs: number) =>
      new Date(BASE_TIME.getTime() + offsetMs).toLocaleTimeString('zh-CN', { hour12: false })
    // 初始：电平 20%、时钟未出
    expect(bars().every(b => b.style.height === '20%')).toBe(true)
    expect(container.querySelector('nav')!.textContent).not.toContain(clockAt(1000))
    // 150ms：电平刷新为 10 + 0.9 × 70 = 73%
    advance(150)
    expect(bars().every(b => b.style.height === '73%')).toBe(true)
    // 1s：时钟出现
    advance(850)
    expect(container.querySelector('nav')!.textContent).toContain(clockAt(1000))
    // 2s：每项 +(0.9 − 0.5) × 5 = +2.0；97.3 触顶钳制为 99
    advance(1000)
    const cards = container.querySelectorAll('.stat-card-interactive')
    ;['99.0%', '66.8%', '84.1%', '47.6%'].forEach((value, i) => expect(cards[i].textContent).toContain(value))
    // 3s：日志轮播到第二条；再过 21s（共 8 次）回到第一条
    advance(1000)
    expect(container.querySelector('footer')!.textContent).toContain('> log2')
    advance(21_000)
    expect(container.querySelector('footer')!.textContent).toContain('> log1')
    expect(container.querySelector('nav')!.textContent).toContain(clockAt(24_000))
  })

  it('发送拦截与无活跃模型：空白输入不发送；有内容时追加用户消息与诚实指引，不触发模型调用', () => {
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    // 空输入点击发送 / 纯空白回车：均不追加消息
    fireEvent.click(byLabel(container, 'send'))
    sendText(container, '   ')
    expect(chatTexts(container)).toHaveLength(3)
    // 非回车键不发送
    fireEvent.change(chatInput(container), { target: { value: '你好' } })
    fireEvent.keyDown(chatInput(container), { key: 'a' })
    expect(chatTexts(container)).toHaveLength(3)
    // 点击发送按钮
    fireEvent.click(byLabel(container, 'send'))
    const texts = chatTexts(container)
    expect(texts.slice(0, 4)).toEqual(['initMessage', 'userMsg1', 'aiMsg1', '你好'])
    expect(texts[texts.length - 1]).toBe(NO_MODEL_HINT)
    expect(chatInput(container).value).toBe('')
    expect(h.store.sendToActiveModelStream).not.toHaveBeenCalled()
  })

  it('流式发送：中文系统提示词 + 历史映射（ai→assistant、去尾）+ onChunk 增量写回 + 加载态收敛', async () => {
    activate(model())
    let emit!: OnChunk
    let finish!: (full: string) => void
    h.store.sendToActiveModelStream.mockImplementation((_message, _options, onChunk) => {
      emit = onChunk!
      return new Promise<string>(resolve => { finish = resolve })
    })
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    sendText(container, '解释闭包')

    expect(h.store.sendToActiveModelStream).toHaveBeenCalledTimes(1)
    const [message, options] = h.store.sendToActiveModelStream.mock.calls[0]
    expect(message).toBe('解释闭包')
    expect(options!.systemPrompt).toContain('你是 YYC³ AI Code 智能编程助手')
    // 历史 = 发送前的三条消息（本次提问由入口自行追加，故去尾）
    expect(options!.history).toEqual([
      { role: 'assistant', content: 'initMessage' },
      { role: 'user', content: 'userMsg1' },
      { role: 'assistant', content: 'aiMsg1' },
    ])
    // 发送后：用户消息 + 空 AI 占位、加载指示出现、输入框清空
    expect(chatTexts(container)).toEqual(['initMessage', 'userMsg1', 'aiMsg1', '解释闭包', ''])
    expect(container.textContent).toContain('aiThinking')
    expect(chatInput(container).value).toBe('')
    // 增量写回最后一条 AI 消息（用户消息不被覆盖）
    act(() => emit('闭', '闭'))
    expect(lastChat(container)).toBe('闭')
    act(() => emit('包是函数与其词法环境的组合', '闭包是函数与其词法环境的组合'))
    expect(chatTexts(container).slice(-2)).toEqual(['解释闭包', '闭包是函数与其词法环境的组合'])
    // 流结束 → 加载态消失
    await act(async () => { finish('闭包是函数与其词法环境的组合') })
    expect(container.textContent).not.toContain('aiThinking')
    expect(chatTexts(container)).toHaveLength(5)
  })

  it('历史窗口：仅携带最近 10 条（含本次提问）→ 传给模型的 history 为 9 条且丢弃最早消息', async () => {
    activate(model())
    h.store.sendToActiveModelStream.mockImplementation(async (_message, _options, onChunk) => {
      onChunk?.('答', '答')
      return '答'
    })
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    for (let i = 1; i <= 5; i++) {
      sendText(container, `问题${i}`)
      await flush()
    }
    const calls = h.store.sendToActiveModelStream.mock.calls
    expect(calls).toHaveLength(5)
    // 第 2 次：3 条初始 + 一轮问答 = 5 条历史，尚未触及窗口
    expect(calls[1][1]!.history).toHaveLength(5)
    // 第 5 次：既有 3 + 4×2 = 11 条，加本次提问 12 条 → 窗口取 10 → 去尾 9
    const history = calls[4][1]!.history!
    expect(history).toHaveLength(9)
    expect(history[0]).toEqual({ role: 'assistant', content: 'aiMsg1' })
    expect(history[history.length - 1]).toEqual({ role: 'assistant', content: '答' })
    expect(history.some(m => m.content === 'initMessage' || m.content === 'userMsg1')).toBe(false)
    expect(history.filter(m => m.role === 'user').map(m => m.content)).toEqual(['问题1', '问题2', '问题3', '问题4'])
  })

  it('流式失败：错误写回最后一条 AI 消息并结束加载态；非 Error 值按字符串呈现', async () => {
    activate(model())
    h.store.sendToActiveModelStream.mockRejectedValueOnce(new Error('网络中断'))
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    sendText(container, '第一问')
    await flush()
    expect(chatTexts(container).slice(-2)).toEqual(['第一问', '[modelError] 网络中断'])
    expect(container.textContent).not.toContain('aiThinking')

    h.store.sendToActiveModelStream.mockRejectedValueOnce('quota exceeded')
    sendText(container, '第二问')
    await flush()
    expect(chatTexts(container).slice(-2)).toEqual(['第二问', '[modelError] quota exceeded'])
    // 上一轮的错误消息保留在会话中
    expect(chatTexts(container)).toContain('[modelError] 网络中断')
    expect(container.textContent).not.toContain('aiThinking')
  })

  it('英文 locale（真 I18nProvider）：系统提示词用英文版；经语言开关切回中文后改用中文版', async () => {
    localStorage.setItem('yyc3-locale', 'en')
    activate(model())
    h.store.sendToActiveModelStream.mockResolvedValue('ok')
    const { container } = render(
      <I18nProvider>
        <FullscreenMode {...requiredProps()} />
      </I18nProvider>,
    )
    // 真翻译生效：占位文案不再是 key
    expect(chatInput(container).placeholder).not.toBe('enterCommand')
    sendText(container, 'explain closures')
    await flush()
    const calls = h.store.sendToActiveModelStream.mock.calls
    expect(calls[0][1]!.systemPrompt).toContain('You are YYC³ AI Code intelligent programming assistant')

    fireEvent.click(container.querySelector('button[title="切换到中文"]')!)
    expect(localStorage.getItem('yyc3-locale')).toBe('zh')
    sendText(container, '解释闭包')
    await flush()
    expect(calls[1][1]!.systemPrompt).toContain('你是 YYC³ AI Code 智能编程助手')
  })

  it('主题切换（真 ThemeSwitcher）：切到现代简约后撤掉故障字与全息卡、品牌以纯文本呈现；可切回', () => {
    const { container } = render(<FullscreenMode {...requiredProps()} />)
    expect(container.querySelector('[data-text="YYC³"]')).toBeTruthy()
    expect(container.querySelectorAll('.holo-card').length).toBeGreaterThan(0)

    fireEvent.click(tipBtn(container, '切换至 现代简约'))
    expect(themeStore.getState().themeId).toBe('clean')
    expect(container.querySelector('[data-text]')).toBeNull()
    expect(container.querySelector('.holo-card')).toBeNull()
    expect(container.querySelector('nav')!.textContent).toContain('YYC³')
    // 状态色随主题令牌切换
    expect(container.querySelector('svg.lucide-wifi')!.getAttribute('stroke')).toBe(THEMES.clean.foregroundMuted)

    fireEvent.click(tipBtn(container, '切换至 赛博朋克'))
    expect(themeStore.getState().themeId).toBe('cyberpunk')
    expect(container.querySelector('[data-text="YYC³"]')).toBeTruthy()
  })
})
