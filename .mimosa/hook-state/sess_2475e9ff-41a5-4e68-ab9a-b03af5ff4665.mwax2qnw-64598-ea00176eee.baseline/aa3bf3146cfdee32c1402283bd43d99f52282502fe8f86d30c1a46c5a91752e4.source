/**
 * @file ChatPage.test.tsx
 * @description ChatPage 模块加载与接口完整性测试
 * 避免渲染全量 UI 组件以规避重型 ESM 依赖的 OOM 问题
 */

import { describe, expect, it, vi } from 'vitest'

const lsStore: Record<string, string> = {}
vi.spyOn(Storage.prototype, 'getItem').mockImplementation((k: string) => lsStore[k] ?? null)
vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k: string, v: string) => { lsStore[k] = v })
vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => { Object.keys(lsStore).forEach(k => delete lsStore[k]) })

vi.mock('react-markdown', () => ({ default: () => null }))
vi.mock('remark-gfm', () => ({ default: () => { } }))
vi.mock('../ChatInputBox', () => ({ default: () => null }))
vi.mock('../ChatMessageList', () => ({ default: () => null }))

vi.mock('../../../app/hooks/useChatSession', () => ({
  useChatSession: () => ({
    sessionList: [], currentSid: '', initialized: true,
    createNewSession: vi.fn(), delSession: vi.fn(), switchSession: vi.fn(),
    updateCurrentMsg: vi.fn(), getCurrentMsg: () => [],
  }),
}))
vi.mock('../../../app/hooks/useStreamText', () => ({
  useStreamText: () => ({ renderText: (t: string) => t, startStream: vi.fn() }),
}))
vi.mock('../../../app/hooks/useSystemTheme', () => ({
  useSystemTheme: () => ({ mode: 'light', setMode: vi.fn() }),
}))
vi.mock('../../../app/store/model-store', () => ({
  useModelStore: () => ({ sendToActiveModel: vi.fn(), providers: [], activeProviderId: null }),
}))
vi.mock('../../../app/store/theme-store', () => ({
  useThemeStore: () => ({ isCyberpunk: false, tokens: { background: '#fff', foreground: '#000' } }),
}))

import ChatPage from '../ChatPage'

describe('ChatPage — 模块加载与接口完整性', () => {
  it('ChatPage 应为函数组件（默认导出）', () => {
    expect(ChatPage).toBeDefined()
    expect(typeof ChatPage).toBe('function')
  })
})
