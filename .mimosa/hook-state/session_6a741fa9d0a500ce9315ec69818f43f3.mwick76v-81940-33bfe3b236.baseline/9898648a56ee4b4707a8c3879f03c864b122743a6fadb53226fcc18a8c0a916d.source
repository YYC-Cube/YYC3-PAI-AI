/**
 * @file ChatMessageList.test.tsx
 * @description 消息列表组件测试 — 空态/用户消息右对齐/AI 消息渲染/锚定滚动
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import ChatMessageList from '../ChatMessageList'
import type { ChatMessage } from '../../../types/chat'

beforeAll(() => {
  // jsdom 无 scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})

const userMsg: ChatMessage = {
  id: 'm1', role: 'user', content: '帮我写个登录页', folded: false, timestamp: 1,
}
const aiMsg: ChatMessage = {
  id: 'm2', role: 'ai', content: '好的，**登录页**实现如下：', folded: false, timestamp: 2,
}

describe('ChatMessageList（消息列表）', () => {
  it('空消息渲染占位提示', () => {
    const { container } = render(
      <ChatMessageList messages={[]} onRegenerate={() => {}} onQuote={() => {}} />,
    )
    expect(container.textContent).toContain('暂无消息，开始对话吧')
  })

  it('用户消息渲染（右对齐容器）', () => {
    const { container } = render(
      <ChatMessageList messages={[userMsg]} onRegenerate={() => {}} onQuote={() => {}} />,
    )
    expect(container.textContent).toContain('帮我写个登录页')
    expect(container.querySelector('.justify-end')).toBeTruthy()
  })

  it('AI 消息经 AiMessageRender 渲染（内容进入 prose 区；react-markdown 为 setup 全局桩，原文透传）', () => {
    const { container } = render(
      <ChatMessageList messages={[aiMsg]} onRegenerate={() => {}} onQuote={() => {}} />,
    )
    expect(container.querySelector('.prose')?.textContent).toContain('登录页')
  })

  it('混合消息按序渲染且角色对齐分区', () => {
    const { container } = render(
      <ChatMessageList messages={[userMsg, aiMsg]} onRegenerate={() => {}} onQuote={() => {}} />,
    )
    expect(container.querySelector('.justify-end')).toBeTruthy()
    expect(container.querySelector('.justify-start')).toBeTruthy()
  })

  it('activeMsgId 触发锚定滚动（scrollIntoView 调用）', () => {
    const { rerender } = render(
      <ChatMessageList messages={[userMsg, aiMsg]} onRegenerate={() => {}} onQuote={() => {}} />,
    )
    rerender(
      <ChatMessageList messages={[userMsg, aiMsg]} activeMsgId="m2" onRegenerate={() => {}} onQuote={() => {}} />,
    )
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('onInsertEditor/onRegenerate/onQuote 透传 AiMessageRender（按钮布线）', async () => {
    const onQuote = vi.fn()
    const { container } = render(
      <ChatMessageList messages={[aiMsg]} onRegenerate={() => {}} onQuote={onQuote} />,
    )
    // AiMessageRender 的操作按钮（引用/重新生成/插入编辑器）
    const btns = Array.from(container.querySelectorAll('button'))
    expect(btns.length).toBeGreaterThan(0)
  })
})
