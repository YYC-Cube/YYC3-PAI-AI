/**
 * @file AIWritingPanel.deep.test.tsx
 * @description AI 写作助手（AIWritingPanel）专项 — 门控与骨架/六模式切换与占位/本地模型生成（入参契约·任务类型映射·
 *              语气设置）/currentContent 与模板联动/远端模式（无模型诚实指引·有模型直连）/本地失败回退远端/双重失败容错/
 *              ⌘+Enter 快捷键/结果操作（复制·重新生成·插入·预览·发布·素材回写）/历史侧栏（回填·删除·清空）/存储容错
 * 策略：真 theme-store + 真 self-media-store（Provider + 探针组件注入 panelActions）；
 *       model-store 受控桩（vi.hoisted）；local-model-client 仅桩 chat（buildMessages 走真实现）；假时钟。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { useEffect, type ReactElement } from 'react'

// ── 受控桩（vi.mock 工厂引用的外部值必须经 vi.hoisted） ──

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ChatResult = { content: string; modelName: string; nodeId: string; latencyMs: number; tokensUsed?: number }
type LocalChatFn = (
  messages: ChatMsg[],
  taskType: string,
  options?: { temperature?: number; maxTokens?: number },
) => Promise<ChatResult>
type RemoteModel = { id: string; name: string; provider: 'custom'; endpoint: string; apiKey: string; isActive: boolean }
type WritingSession = { id: string; mode: WritingMode; topic: string; result: string; createdAt: number }

const h = vi.hoisted(() => ({
  store: {
    getActiveModel: vi.fn<() => RemoteModel | null>(),
    sendToActiveModel: vi.fn<(message: string, options?: { systemPrompt?: string }) => Promise<string>>(),
  },
  localChat: vi.fn<LocalChatFn>(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => h.store,
}))

vi.mock('../../utils/local-model-client', async importOriginal => {
  const actual = await importOriginal<typeof import('../../utils/local-model-client')>()
  return { ...actual, chat: h.localChat }
})

import { AIWritingPanel, type WritingMode } from '../AIWritingPanel'
import {
  SelfMediaStoreProvider,
  useSelfMediaStore,
  type PanelActions,
} from '../../store/self-media-store'

// ── Fixtures / Helpers ──

const chatResult = (over: Partial<ChatResult> = {}): ChatResult => ({
  content: '生成结果文本',
  modelName: 'GLM-Local',
  nodeId: 'node-7',
  latencyMs: 120,
  ...over,
})

const remoteModel = (): RemoteModel => ({
  id: 'm1',
  name: 'GLM-Online',
  provider: 'custom',
  endpoint: 'https://llm.example.com/v1',
  apiKey: '',
  isActive: true,
})

const session = (over: Partial<WritingSession> = {}): WritingSession => ({
  id: 'aw_' + Math.random().toString(36).slice(2, 8),
  mode: 'title',
  topic: '示例主题',
  result: '示例结果',
  createdAt: 1_700_000_000_000,
  ...over,
})

/** 当前用例的渲染容器 */
let container: HTMLElement

/** 真 self-media-store 探针：登记 store 实例并注入 panelActions（App.tsx 同款注入路径） */
let probeStore: ReturnType<typeof useSelfMediaStore> | null = null
const StoreProbe = ({ actions }: { actions?: PanelActions }) => {
  const store = useSelfMediaStore()
  probeStore = store
  const setPanelActions = store.setPanelActions
  useEffect(() => {
    if (actions) setPanelActions(actions)
  }, [actions, setPanelActions])
  return null
}

const renderPanel = (ui: ReactElement, actions?: PanelActions) => {
  const view = render(
    <SelfMediaStoreProvider>
      <StoreProbe actions={actions} />
      {ui}
    </SelfMediaStoreProvider>,
  )
  container = view.container
  return view
}

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text)) as HTMLButtonElement

/** 生成按钮：文案以「生成」开头（区别于「重新生成」与「标题生成」页签） */
const generateBtn = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('button')).find(b =>
    (b.textContent || '').trim().startsWith('生成'),
  ) as HTMLButtonElement

const textarea = () => container.querySelector('textarea') as HTMLTextAreaElement

const flush = () => act(async () => {})

const savedSessions = (): WritingSession[] =>
  JSON.parse(localStorage.getItem('yyc3_aiwriting_sessions') ?? '[]')

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  probeStore = null
  // jsdom 无 Clipboard API：注桩（复制结果路径）
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  })
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('AIWritingPanel（AI 写作助手）', () => {
  it('门控与骨架：visible=false 返回 null；visible 渲染六模式页签/本地模式/历史入口/空态与禁用的生成按钮', () => {
    const first = render(<AIWritingPanel visible={false} onClose={() => {}} />)
    expect(first.container.firstElementChild).toBeNull()

    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    expect(container.textContent).toContain('AI 写作助手')
    for (const label of ['标题生成', '大纲规划', 'SEO优化', '内容扩写', '智能摘要', '风格改写']) {
      expect(btnByText(container, label)).toBeTruthy()
    }
    // 默认本地模型模式
    expect(container.textContent).toContain('本地')
    expect(btnByText(container, '历史 (0)')).toBeTruthy()
    expect(container.textContent).toContain('输入主题或内容，点击「生成」开始写作辅助')
    expect(container.textContent).toContain('支持 ⌘+Enter 快捷键快速生成')
    expect(generateBtn(container).disabled).toBe(true)
    expect(textarea().placeholder).toBe('输入文章主题或关键词...')
    expect(container.textContent).not.toContain('生成中...')
  })

  it('模式切换：六页签逐一激活并切换占位文案；切换清空结果但保留输入', async () => {
    h.localChat.mockResolvedValue(chatResult())
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    const cases: Array<[string, string]> = [
      ['大纲规划', '输入文章主题或核心论点...'],
      ['SEO优化', '输入要优化的内容...'],
      ['内容扩写', '输入要点列表（每行一个）...'],
      ['智能摘要', '输入要摘要的文章内容...'],
      ['风格改写', '输入需要改写的原文...'],
      ['标题生成', '输入文章主题或关键词...'],
    ]
    for (const [label, placeholder] of cases) {
      fireEvent.click(btnByText(container, label))
      expect(textarea().placeholder, label).toBe(placeholder)
    }

    // 有结果时切模式 → 结果清空、回到空态，但输入保留
    fireEvent.change(textarea(), { target: { value: '切换用主题' } })
    fireEvent.click(generateBtn(container))
    await flush()
    expect(container.textContent).toContain('生成结果文本')
    fireEvent.click(btnByText(container, 'SEO优化'))
    expect(container.textContent).not.toContain('生成结果文本')
    expect(container.textContent).toContain('输入主题或内容，点击「生成」开始写作辅助')
    expect(textarea().value).toBe('切换用主题')
  })

  it('本地模型生成（标题模式）：生成中状态收敛；localChat 收到系统+用户消息（写作提示词+时间+平台+主题）；结果与模型信息条上屏并入库', async () => {
    let resolveChat!: (r: ChatResult) => void
    h.localChat.mockImplementation(() => new Promise<ChatResult>(resolve => { resolveChat = resolve }))
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)

    fireEvent.change(textarea(), { target: { value: 'AI 智能体选型' } })
    // 字符计数 8
    expect(container.textContent).toContain('8')
    expect(generateBtn(container).disabled).toBe(false)
    fireEvent.click(generateBtn(container))
    expect(container.textContent).toContain('生成中...')
    expect(generateBtn(container).disabled).toBe(true)

    // 入参契约：messages（真 buildMessages：system + user）、taskType、选项
    expect(h.localChat).toHaveBeenCalledTimes(1)
    const [messages, taskType, options] = h.localChat.mock.calls[0]
    expect(taskType).toBe('writing-title')
    expect(options).toEqual({ temperature: 0.7, maxTokens: 4096 })
    expect(messages[0]).toEqual({ role: 'system', content: expect.stringContaining('自媒体标题专家') })
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toContain('新媒体标题创作专家')
    expect(messages[1].content).toContain('当前时间：')
    expect(messages[1].content).toContain('目标平台：自媒体')
    expect(messages[1].content.endsWith('AI 智能体选型')).toBe(true)

    await act(async () => {
      resolveChat({ content: '标题甲\n标题乙', modelName: 'GLM-Local', nodeId: 'node-7', latencyMs: 120 })
    })
    expect(container.textContent).not.toContain('生成中...')
    expect(container.textContent).toContain('标题甲\n标题乙')
    // 本地模型信息条
    for (const part of ['本地模型:', 'GLM-Local', '节点: node-7']) {
      expect(container.textContent).toContain(part)
    }
    // 会话入库 + 历史计数
    const saved = savedSessions()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ mode: 'title', topic: 'AI 智能体选型', result: '标题甲\n标题乙' })
    expect(btnByText(container, '历史 (1)')).toBeTruthy()
  })

  it('任务类型映射：大纲→writing-outline；SEO/扩写→writing；摘要→summary；改写→rewrite，各模式系统提示词齐备', async () => {
    h.localChat.mockResolvedValue(chatResult())
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    const cases: Array<[string, string, string]> = [
      ['大纲规划', 'writing-outline', '内容规划专家'],
      ['SEO优化', 'writing', 'SEO优化专家'],
      ['内容扩写', 'writing', '内容创作专家'],
      ['智能摘要', 'summary', '内容分析专家'],
      ['风格改写', 'rewrite', '文字润色专家'],
    ]
    let index = 0
    for (const [label, taskType, systemFragment] of cases) {
      fireEvent.click(btnByText(container, label))
      fireEvent.change(textarea(), { target: { value: `${label}素材` } })
      fireEvent.click(generateBtn(container))
      await flush()
      const call = h.localChat.mock.calls[index]
      expect(call[1], label).toBe(taskType)
      expect(call[0][0].content, label).toContain(systemFragment)
      expect(call[0][1].content.endsWith(`${label}素材`), label).toBe(true)
      index++
    }
    expect(h.localChat).toHaveBeenCalledTimes(5)
  })

  it('改写语气：语气面板展开/收起与五个选项；选中「幽默风趣」后用户提示词与系统提示词都携带目标语气', async () => {
    h.localChat.mockResolvedValue(chatResult())
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    fireEvent.click(btnByText(container, '风格改写'))
    // 展开
    fireEvent.click(btnByText(container, '语气设置'))
    expect(container.textContent).toContain('目标语气：')
    for (const tone of ['正式专业', '轻松口语', '幽默风趣', '权威严谨', '温暖感性']) {
      expect(btnByText(container, tone)).toBeTruthy()
    }
    fireEvent.click(btnByText(container, '幽默风趣'))
    fireEvent.change(textarea(), { target: { value: '原始文案' } })
    fireEvent.click(generateBtn(container))
    await flush()
    expect(h.localChat).toHaveBeenCalledTimes(1)
    const [messages] = h.localChat.mock.calls[0]
    expect(messages[0].content).toContain('目标语气：幽默风趣')
    expect(messages[1].content).toContain('目标风格/语气：幽默风趣')
    expect(messages[1].content.endsWith('原始文案')).toBe(true)
    // 收起
    fireEvent.click(btnByText(container, '语气设置'))
    expect(container.textContent).not.toContain('目标语气：')
  })

  it('currentContent 联动：seo/summary/rewrite 自动填充并截断 2000 字（title 不填）；「使用当前内容」按钮仅相关模式出现', async () => {
    const long = '段'.repeat(2050)
    renderPanel(<AIWritingPanel visible onClose={() => {}} currentContent={long} />)
    // title 模式不自动填充
    expect(textarea().value).toBe('')
    // 切到 SEO：自动填充并截断
    fireEvent.click(btnByText(container, 'SEO优化'))
    expect(textarea().value).toBe('段'.repeat(2000))
    expect(container.textContent).toContain('2000')
    // 「使用当前内容」可用（重填同一份内容）
    expect(btnByText(container, '使用当前内容')).toBeTruthy()
    fireEvent.click(btnByText(container, '使用当前内容'))
    expect(textarea().value).toBe('段'.repeat(2000))
    // title 模式按钮消失，但输入保留
    fireEvent.click(btnByText(container, '标题生成'))
    expect(btnByText(container, '使用当前内容')).toBeUndefined()
    expect(textarea().value).toBe('段'.repeat(2000))
    // 摘要模式：输入被清空时同样自动填充
    fireEvent.change(textarea(), { target: { value: '' } })
    fireEvent.click(btnByText(container, '智能摘要'))
    expect(textarea().value).toBe('段'.repeat(2000))
  })

  it('模板联动：store 注入写作主题与模式后自动填充并切换模式，且消费即清空 store 暂存', async () => {
    h.localChat.mockResolvedValue(chatResult({ content: '大纲内容' }))
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    // 同一 Provider 内注入模板写作主题与模式（跨面板联动路径）
    act(() => {
      probeStore!.setPendingAIWritingTopic('平台：小红书\n模板：种草文模板')
      probeStore!.setPendingAIWritingMode('outline')
    })
    expect(textarea().value).toBe('平台：小红书\n模板：种草文模板')
    // store 暂存被清空（不会二次消费）
    expect(probeStore!.templateWritingTopic).toBe('')
    expect(probeStore!.templateWritingMode).toBeNull()
    // 模式已切到大纲：生成走 outline 通道
    fireEvent.click(generateBtn(container))
    await flush()
    expect(h.localChat.mock.calls[0][1]).toBe('writing-outline')
    expect(container.textContent).toContain('大纲内容')
  })

  it('远端模式：无活跃模型给诚实指引不调用；有活跃模型走 sendToActiveModel（trim 后上屏，无本地模型信息条）', async () => {
    h.store.getActiveModel.mockReturnValue(null)
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    // 切到远端
    fireEvent.click(btnByText(container, '本地'))
    expect(btnByText(container, '远端')).toBeTruthy()
    fireEvent.change(textarea(), { target: { value: '远端主题' } })
    fireEvent.click(generateBtn(container))
    await flush()
    expect(container.textContent).toContain('请先在模型设置中激活一个AI模型，或切换到本地模型模式')
    expect(h.store.sendToActiveModel).not.toHaveBeenCalled()
    expect(savedSessions()).toHaveLength(0)

    // 激活远端模型
    h.store.sendToActiveModel.mockResolvedValue('  远端结果正文  \n')
    h.store.getActiveModel.mockReturnValue(remoteModel())
    fireEvent.click(generateBtn(container))
    await flush()
    expect(h.store.sendToActiveModel).toHaveBeenCalledTimes(1)
    const [prompt, options] = h.store.sendToActiveModel.mock.calls[0]
    expect(prompt).toContain('远端主题')
    expect(options!.systemPrompt).toContain('专业的写作助手')
    expect(container.textContent).toContain('远端结果正文')
    expect(container.textContent).not.toContain('请先在模型设置中激活')
    expect(container.textContent).not.toContain('本地模型:')
    expect(savedSessions()).toHaveLength(1)
    expect(savedSessions()[0].result).toBe('远端结果正文')
  })

  it('本地失败回退远端：localChat 拒绝后自动走远端并入库；提示词入参至少携带原始主题（提示词前缀存在已知缺陷，不在此锁定）', async () => {
    h.localChat.mockRejectedValue(new Error('本地节点不可用'))
    h.store.getActiveModel.mockReturnValue(remoteModel())
    h.store.sendToActiveModel.mockResolvedValue('远端兜底结果')
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    fireEvent.change(textarea(), { target: { value: '回退主题' } })
    fireEvent.click(generateBtn(container))
    await flush()

    expect(h.store.sendToActiveModel).toHaveBeenCalledTimes(1)
    const [fallbackPrompt] = h.store.sendToActiveModel.mock.calls[0]
    expect(fallbackPrompt).toContain('回退主题')
    expect(container.textContent).toContain('远端兜底结果')
    expect(container.textContent).not.toContain('本地节点不可用')
    expect(savedSessions()).toHaveLength(1)
    expect(savedSessions()[0].result).toBe('远端兜底结果')
  })

  it('双重失败：本地失败且无活跃模型 → 错误框展示原始消息；非 Error 值 → 兜底文案「生成失败」', async () => {
    h.localChat.mockRejectedValue(new Error('本地节点宕机'))
    h.store.getActiveModel.mockReturnValue(null)
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    fireEvent.change(textarea(), { target: { value: '失败主题甲' } })
    fireEvent.click(generateBtn(container))
    await flush()
    expect(container.textContent).toContain('本地节点宕机')
    expect(container.textContent).not.toContain('生成结果文本')

    h.localChat.mockRejectedValue('boom')
    fireEvent.change(textarea(), { target: { value: '失败主题乙' } })
    fireEvent.click(generateBtn(container))
    await flush()
    expect(container.textContent).toContain('生成失败')
    expect(savedSessions()).toHaveLength(0)
  })

  it('快捷键与空输入：空输入点击/⌘+Enter 不触发；有输入时 ⌘+Enter 触发、普通 Enter 不触发；结束后 Ctrl+Enter 再起一轮', async () => {
    let resolveChat!: (r: ChatResult) => void
    h.localChat.mockImplementation(() => new Promise<ChatResult>(resolve => { resolveChat = resolve }))
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    // 空输入：按钮禁用，点击与快捷键均不触发
    fireEvent.click(generateBtn(container))
    fireEvent.keyDown(textarea(), { key: 'Enter', metaKey: true })
    expect(h.localChat).not.toHaveBeenCalled()

    // ⌘+Enter 触发
    fireEvent.change(textarea(), { target: { value: '快捷主题' } })
    fireEvent.keyDown(textarea(), { key: 'Enter', metaKey: true })
    expect(h.localChat).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('生成中...')
    // 普通回车不触发
    fireEvent.keyDown(textarea(), { key: 'Enter' })
    expect(h.localChat).toHaveBeenCalledTimes(1)
    await act(async () => { resolveChat(chatResult({ content: '快捷结果' })) })
    expect(container.textContent).toContain('快捷结果')

    // 第一轮结束后 Ctrl+Enter 再次触发新一轮生成
    h.localChat.mockResolvedValue(chatResult({ content: '第二轮结果' }))
    fireEvent.keyDown(textarea(), { key: 'Enter', ctrlKey: true })
    await flush()
    expect(h.localChat).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('第二轮结果')
  })

  it('结果操作：复制（已复制 2s 复原）、重新生成、插入编辑器、预览/发布/素材经真 store 布线（素材回调回写输入框）', async () => {
    const actions: PanelActions = {
      openAIWriting: vi.fn(),
      openMaterialManager: vi.fn(),
      openContentPreview: vi.fn(),
      openEditor: vi.fn(),
      openPublishQueue: vi.fn(),
      openTrendingTopics: vi.fn(),
    }
    const onInsertContent = vi.fn()
    h.localChat.mockResolvedValue(chatResult({ content: '结果正文' }))
    renderPanel(<AIWritingPanel visible onClose={() => {}} onInsertContent={onInsertContent} />, actions)
    fireEvent.change(textarea(), { target: { value: '结果主题' } })
    fireEvent.click(generateBtn(container))
    await flush()
    expect(container.textContent).toContain('结果正文')

    // 复制 → 已复制 → 2s 后复原
    fireEvent.click(btnByText(container, '复制'))
    await flush()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('结果正文')
    expect(btnByText(container, '已复制')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(btnByText(container, '已复制')).toBeUndefined()
    expect(btnByText(container, '复制')).toBeTruthy()

    // 重新生成：再次调用本地模型
    fireEvent.click(btnByText(container, '重新生成'))
    await flush()
    expect(h.localChat).toHaveBeenCalledTimes(2)

    // 插入编辑器
    fireEvent.click(btnByText(container, '插入'))
    expect(onInsertContent).toHaveBeenCalledWith('结果正文')

    // 预览 / 发布（标题取输入前 30 字）
    fireEvent.click(btnByText(container, '预览'))
    expect(actions.openContentPreview).toHaveBeenCalledWith({ content: '结果正文', title: 'AI写作 - 结果主题' })
    fireEvent.click(btnByText(container, '发布'))
    expect(actions.openPublishQueue).toHaveBeenCalledWith({ content: '结果正文', title: 'AI写作 - 结果主题' })

    // 素材：注册写作插入回调 + 打开素材管理器；回调被调用后回写输入框
    fireEvent.click(btnByText(container, '素材'))
    expect(actions.openMaterialManager).toHaveBeenCalledTimes(1)
    expect(typeof probeStore!.writingInsertCallback).toBe('function')
    act(() => { probeStore!.writingInsertCallback!('素材文本') })
    expect(textarea().value.endsWith('素材文本')).toBe(true)
  })

  it('历史侧栏：种子会话渲染（模式标签/主题/结果截断 80 字）；点击回填并关闭；单条删除不触发回填；清空持久化；悬停高亮', async () => {
    localStorage.setItem('yyc3_aiwriting_sessions', JSON.stringify([
      session({ id: 'aw_1', mode: 'title', topic: '历史主题一', result: '甲'.repeat(90), createdAt: Date.UTC(2026, 0, 2) }),
      session({ id: 'aw_2', mode: 'outline', topic: '历史主题二', result: '乙结果', createdAt: Date.UTC(2026, 5, 15) }),
    ]))
    renderPanel(<AIWritingPanel visible onClose={() => {}} />)
    expect(btnByText(container, '历史 (2)')).toBeTruthy()
    fireEvent.click(btnByText(container, '历史 (2)'))
    // 侧栏打开期间头部入口改为「关闭历史」
    expect(btnByText(container, '关闭历史')).toBeTruthy()
    expect(container.textContent).toContain('写作历史')
    expect(container.textContent).toContain('标题生成')
    expect(container.textContent).toContain('大纲规划')
    expect(container.textContent).toContain('历史主题一')
    expect(container.textContent).toContain('乙结果')
    // 结果截断 80 字
    expect(container.textContent).toContain('甲'.repeat(80) + '...')
    expect(container.textContent).not.toContain('甲'.repeat(81))

    const trashIcons = () => Array.from(container.querySelectorAll('svg.lucide-trash2'))
    /** 历史条目 = 删除按钮所在的条目 div */
    const itemOf = (topic: string) =>
      trashIcons().map(icon => icon.closest('div') as HTMLElement).find(d => d.textContent!.includes(topic))!
    expect(trashIcons()).toHaveLength(2)

    // 悬停高亮 / 移出复原
    fireEvent.mouseEnter(itemOf('历史主题一'))
    expect(itemOf('历史主题一').style.background).not.toBe('transparent')
    fireEvent.mouseLeave(itemOf('历史主题一'))
    expect(itemOf('历史主题一').style.background).toBe('transparent')

    // 点击会话 → 回填模式/输入/结果并关闭侧栏（条目总数不变）
    fireEvent.click(itemOf('历史主题二'))
    expect(textarea().value).toBe('历史主题二')
    expect(textarea().placeholder).toBe('输入文章主题或核心论点...')
    expect(container.textContent).toContain('乙结果')
    expect(btnByText(container, '关闭历史')).toBeUndefined()
    expect(btnByText(container, '历史 (2)')).toBeTruthy()

    // 重新打开 → 删除首条：仅删除、不冒泡为回填（输入仍是上一步的主题二）
    fireEvent.click(btnByText(container, '历史 (2)'))
    fireEvent.click(trashIcons()[0].closest('button')!)
    expect(trashIcons()).toHaveLength(1)
    expect(textarea().value).toBe('历史主题二')
    expect(savedSessions().map(s => s.id)).toEqual(['aw_2'])

    // 清空 → 空态、清空入口消失；关闭侧栏后计数归零
    fireEvent.click(btnByText(container, '清空'))
    expect(container.textContent).toContain('暂无记录')
    expect(savedSessions()).toHaveLength(0)
    expect(btnByText(container, '清空')).toBeUndefined()
    fireEvent.click(btnByText(container, '关闭历史'))
    expect(btnByText(container, '历史 (0)')).toBeTruthy()
  })

  it('存储容错与关闭布线：损坏的 localStorage 回退空历史；遮罩与 X 均触发 onClose', () => {
    localStorage.setItem('yyc3_aiwriting_sessions', '{oops')
    const onClose = vi.fn()
    renderPanel(<AIWritingPanel visible onClose={onClose} />)
    expect(btnByText(container, '历史 (0)')).toBeTruthy()
    // 遮罩：固定层第一个子元素
    fireEvent.click(container.firstElementChild!.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
    // 头部 X
    fireEvent.click(container.querySelector('svg.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
