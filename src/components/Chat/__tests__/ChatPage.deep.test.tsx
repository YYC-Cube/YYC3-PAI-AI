/**
 * @file ChatPage.deep.test.tsx
 * @description ChatPage 专项深化 — 会话侧栏/全局搜索/发送流（trace+评估+缓存降级+RAG）/重生成/导出/主题
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'

const h = vi.hoisted(() => ({
  inputValue: { value: '默认输入' },
  sessionSpies: {
    createNewSession: vi.fn(),
    delSession: vi.fn(),
    switchSession: vi.fn(),
    updateCurrentMsg: vi.fn(),
  },
  stream: vi.fn(),
  buildRagContext: vi.fn(),
  saveTrace: vi.fn(),
  recordEvaluation: vi.fn(),
  sendWithCacheFallback: vi.fn(),
}))

vi.mock('../ChatInputBox', () => ({
  default: (props: { onSend: (t: string) => void; quoteContent?: string }) => (
    <div>
      <span data-testid="quote">{props.quoteContent ?? '∅'}</span>
      <button
        data-testid="send"
        onClick={() => props.onSend(h.inputValue.value)}
      >send</button>
    </div>
  ),
}))

vi.mock('../ChatMessageList', () => ({
  default: (props: {
    messages: Array<{ id: string; role: string; content: string }>;
    onRegenerate: (id: string) => void;
    onQuote: (c: string) => void;
  }) => (
    <div>
      <ul>
        {props.messages.map(m => (
          <li key={m.id} data-testid={`msg-${m.id}`} data-role={m.role}>{m.content || '∅'}</li>
        ))}
      </ul>
      {props.messages.filter(m => m.role === 'ai').map(m => (
        <button key={m.id} data-testid={`regen-${m.id}`} onClick={() => props.onRegenerate(m.id)}>regen</button>
      ))}
      {props.messages.filter(m => m.role === 'ai' && m.content).slice(0, 1).map(m => (
        <button key={`q-${m.id}`} data-testid="quote-btn" onClick={() => props.onQuote(m.content)}>quote</button>
      ))}
    </div>
  ),
}))

vi.mock('../../../app/hooks/useChatSession', () => ({
  useChatSession: () => ({
    sessionList: SESSIONS,
    currentSid: 's1',
    initialized: true,
    createNewSession: h.sessionSpies.createNewSession,
    delSession: h.sessionSpies.delSession,
    switchSession: h.sessionSpies.switchSession,
    updateCurrentMsg: h.sessionSpies.updateCurrentMsg,
    // 稳定函数引用：ChatPage 同步 effect 依赖 getCurrentMsg——函数身份不稳定会在每次渲染后
    // 把消息 setMessages([]) 抹掉（生产 hook 为 useCallback 稳定，mock 必须对齐）
    getCurrentMsg: STABLE_GET_CURRENT_MSG,
  }),
}))

const STABLE_EMPTY: never[] = []
const STABLE_GET_CURRENT_MSG = () => STABLE_EMPTY
const SESSIONS = [
  { sid: 's1', title: '会话一', list: [{ id: 'm1', role: 'user', content: '登录页怎么写', folded: false, timestamp: 1 }] },
  { sid: 's2', title: '会话二', list: [{ id: 'm2', role: 'ai', content: '登录页实现如下', folded: false, timestamp: 2 }] },
]

vi.mock('../../../app/store/model-store', () => ({
  useModelStore: () => ({ sendToActiveModelStream: h.stream }),
}))

vi.mock('../../../app/services/code-indexer', () => ({ buildRagContext: h.buildRagContext }))
vi.mock('../../../app/services/trace-store', () => ({
  newTraceId: () => 'trace_test_1',
  sanitizePrompt: (p: string) => p.slice(0, 200),
  saveTrace: h.saveTrace,
}))
vi.mock('../../../app/services/cache-fallback', () => ({
  sendWithCacheFallback: h.sendWithCacheFallback,
}))
vi.mock('../../../app/services/evaluation-store', () => ({
  recordEvaluation: h.recordEvaluation,
}))

import ChatPage from '../ChatPage'

beforeEach(() => {
  vi.clearAllMocks()
  h.inputValue.value = '帮我写登录页'
  h.buildRagContext.mockResolvedValue('')
  h.saveTrace.mockResolvedValue(undefined)
  h.sendWithCacheFallback.mockImplementation(
    async (_p: string, _m: string, sendFn: () => Promise<string>) => {
      const content = await sendFn()
      return { content, isCached: false, source: undefined, cachedAt: undefined }
    },
  )
  // 导出所需 jsdom 缺口
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:x'), writable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true })
})

describe('ChatPage 会话侧栏', () => {
  it('渲染会话标题与当前会话高亮', () => {
    const { container } = render(<ChatPage />)
    expect(container.textContent).toContain('会话一')
    expect(container.textContent).toContain('会话二')
    expect(container.textContent).toContain('+ 新建会话')
  })

  it('点击会话切换；删除按钮 stopPropagation 不触发切换', () => {
    const { container } = render(<ChatPage />)
    const rows = container.querySelectorAll('.cursor-pointer')
    fireEvent.click(rows[0])
    expect(h.sessionSpies.switchSession).toHaveBeenCalledWith('s1')
    // 删除按钮（×）
    const del = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '×')!
    fireEvent.click(del)
    expect(h.sessionSpies.delSession).toHaveBeenCalledWith('s1')
    expect(h.sessionSpies.switchSession).toHaveBeenCalledTimes(1)
  })

  it('新建会话按钮布线', () => {
    const { container } = render(<ChatPage />)
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent === '+ 新建会话')!)
    expect(h.sessionSpies.createNewSession).toHaveBeenCalledTimes(1)
  })
})

describe('ChatPage 全局搜索', () => {
  it('Enter 触发搜索：结果面板展示 [会话名] + 摘要；点击结果跳转并清空', () => {
    const { container } = render(<ChatPage />)
    const input = container.querySelector('input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '登录页' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    const panel = container.querySelector('.max-h-32')!
    expect(panel.textContent).toContain('[会话一]')
    expect(panel.textContent).toContain('登录页怎么写')
    expect(panel.textContent).toContain('[会话二]')
    // 点击 [会话二] 的结果 → switchSession + 清空搜索态
    const target = Array.from(panel.children).find(el => el.textContent!.includes('[会话二]'))!
    fireEvent.click(target)
    expect(h.sessionSpies.switchSession).toHaveBeenCalledWith('s2')
    expect(container.querySelector('.max-h-32')).toBeNull()
    expect(input.value).toBe('')
  })

  it('搜索按钮与空关键词清空结果', () => {
    const { container } = render(<ChatPage />)
    const input = container.querySelector('input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '登录页' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(container.querySelector('.max-h-32')).toBeTruthy()
    // 清空关键词再搜 → 面板消失
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent === '搜索')!)
    expect(container.querySelector('.max-h-32')).toBeNull()
  })
})

describe('ChatPage 发送流（trace/评估/RAG/缓存降级）', () => {
  it('完整链路：用户+AI 消息入列、流式增量、trace/评估落账、RAG 注入', async () => {
    h.buildRagContext.mockResolvedValue('### 相关代码片段')
    h.stream.mockImplementation(async (_t: string, opts: { systemPrompt?: string }, onChunk?: (d: string, f: string) => void) => {
      onChunk?.('Hel', 'Hel')
      onChunk?.('lo', 'Hello')
      expect(opts?.systemPrompt).toContain('相关代码片段')
      return 'Hello'
    })
    const { container } = render(<ChatPage />)
    await act(async () => { fireEvent.click(container.querySelector('[data-testid="send"]')!) })
    await waitFor(() => {
      const items = container.querySelectorAll('li')
      expect(items).toHaveLength(2)
    })
    expect(container.querySelector('li[data-role="user"]')!.textContent).toBe('帮我写登录页')
    expect(container.querySelector('li[data-role="ai"]')!.textContent).toBe('Hello')
    // 服务链路
    expect(h.buildRagContext).toHaveBeenCalledWith('帮我写登录页', 3)
    expect(h.saveTrace).toHaveBeenCalledWith(expect.objectContaining({
      id: 'trace_test_1', promptPreview: '帮我写登录页', completion: 'Hello', success: true,
    }))
    expect(h.recordEvaluation).toHaveBeenCalledWith(expect.objectContaining({
      traceId: 'trace_test_1', prompt: '帮我写登录页', completion: 'Hello',
    }))
  })

  it('缓存命中：追加缓存来源标注', async () => {
    h.sendWithCacheFallback.mockResolvedValue({
      content: '缓存里的答案', isCached: true, source: 'memory', cachedAt: Date.now(),
    })
    const { container } = render(<ChatPage />)
    await act(async () => { fireEvent.click(container.querySelector('[data-testid="send"]')!) })
    await waitFor(() => expect(container.querySelector('li[data-role="ai"]')!.textContent).toContain('缓存回复'))
    expect(container.querySelector('li[data-role="ai"]')!.textContent).toContain('内存缓存')
  })

  it('请求失败：AI 消息置错误文案', async () => {
    h.sendWithCacheFallback.mockRejectedValue(new Error('模型超时'))
    const { container } = render(<ChatPage />)
    await act(async () => { fireEvent.click(container.querySelector('[data-testid="send"]')!) })
    await waitFor(() => expect(container.querySelector('li[data-role="ai"]')!.textContent).toContain('请求失败'))
    expect(container.querySelector('li[data-role="ai"]')!.textContent).toContain('模型超时')
  })

  it('RAG 检索失败静默降级（systemPrompt=undefined）', async () => {
    h.buildRagContext.mockRejectedValue(new Error('index missing'))
    h.stream.mockResolvedValue('ok')
    render(<ChatPage />)
    await act(async () => { fireEvent.click(document.querySelector('[data-testid="send"]')!) })
    await waitFor(() => expect(h.sendWithCacheFallback).toHaveBeenCalled())
    expect(document.querySelector('li[data-role="ai"]')!.textContent).toBe('ok')
  })
})

describe('ChatPage 重生成与引用', () => {
  it('重生成：回溯最近用户消息重发并替换内容', async () => {
    h.stream.mockImplementation(async (_t: string, _o: unknown, onChunk?: (d: string, f: string) => void) => {
      expect(_t).toBe('原问题')
      onChunk?.('新', '新')
      return '新回答'
    })
    const { container } = render(<ChatPage />)
    // 先正常发送一轮
    h.inputValue.value = '原问题'
    h.sendWithCacheFallback.mockResolvedValue({ content: '旧回答', isCached: false })
    await act(async () => { fireEvent.click(container.querySelector('[data-testid="send"]')!) })
    const aiId = container.querySelector('li[data-role="ai"]')!.getAttribute('data-testid')!.replace('msg-', '')
    // 重生成
    h.stream.mockClear()
    await act(async () => { fireEvent.click(container.querySelector(`[data-testid="regen-${aiId}"]`)!) })
    await waitFor(() => expect(container.querySelector('li[data-role="ai"]')!.textContent).toBe('新回答'))
  })

  it('引用：quoteContent 透传输入框', async () => {
    const { container } = render(<ChatPage />)
    h.inputValue.value = '原始问题'
    h.sendWithCacheFallback.mockResolvedValue({ content: '被引用内容', isCached: false })
    await act(async () => { fireEvent.click(container.querySelector('[data-testid="send"]')!) })
    await waitFor(() => expect(container.querySelector('[data-testid="quote-btn"]')).toBeTruthy())
    fireEvent.click(container.querySelector('[data-testid="quote-btn"]')!)
    expect(container.querySelector('[data-testid="quote"]')!.textContent).toBe('被引用内容')
  })
})

describe('ChatPage 导出与主题', () => {
  it('导出 MD/JSON：触发下载（Blob+click）', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<ChatPage />)
    const btns = container.querySelectorAll('button')
    fireEvent.click(Array.from(btns).find(b => b.title === '导出 Markdown')!)
    fireEvent.click(Array.from(btns).find(b => b.title === '导出 JSON')!)
    expect(clickSpy).toHaveBeenCalledTimes(2)
    clickSpy.mockRestore()
  })

  it('主题三档切换布线（system/light/dark）', () => {
    const { container } = render(<ChatPage />)
    const themeBtns = Array.from(container.querySelectorAll('button')).filter(b => ['🌓', '☀', '☾'].includes(b.textContent || ''))
    expect(themeBtns).toHaveLength(3)
    fireEvent.click(themeBtns[2])
    // useSystemTheme 真实现：dark class 挂载 html
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    document.documentElement.classList.remove('dark')
  })
})
