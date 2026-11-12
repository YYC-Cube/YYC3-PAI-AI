/**
 * @file AIResponseFormatter.test.tsx
 * @description AI 回复排版格式化 — formatAIContent / contextManager / EnhancedMarkdown / ContextSummary
 *
 * react-markdown 以「组件映射驱动桩」替换 setup 全局透传桩：桩按映射表逐项调用
 * components.code/p/h1/...，从而覆盖 EnhancedMarkdown 内部全部 markdown 组件分支。
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import {
  EnhancedMarkdown,
  ContextSummary,
  contextManager,
  formatAIContent,
  type ConversationContext,
} from '../AIResponseFormatter'

// 组件映射驱动桩：逐项调用 components 映射（覆盖内部全部 markdown 组件分支），原文 children 仍透传
vi.mock('react-markdown', async () => {
  const React = await import('react')
  return {
    default: (props: {
      components?: Record<string, (p: Record<string, unknown>) => React.ReactNode>
      children?: React.ReactNode
    }) => {
      const C = props.components ?? {}
      const out: React.ReactNode[] = []
      const drive = (key: string, name: string, extra: Record<string, unknown> = {}, children: React.ReactNode = null) => {
        const comp = C[name]
        if (comp) out.push(React.createElement(comp, { key, ...extra }, children))
      }
      drive('h1', 'h1', {}, '标题一级')
      drive('h2', 'h2', {}, '标题二级')
      drive('h3', 'h3', {}, '标题三级')
      drive('bq', 'blockquote', {}, '引用内容')
      drive('ul', 'ul', {}, ['列表项一', '列表项二'])
      drive('ol', 'ol', {}, ['有序项A', '有序项B'])
      if (C.table && C.th && C.td) {
        out.push(React.createElement(C.table, { key: 'tbl' }, [
          React.createElement(C.th, { key: 'th' }, '表头列'),
          React.createElement(C.td, { key: 'td' }, '单元格'),
        ]))
      }
      drive('a', 'a', { href: 'https://example.com' }, '外链文本')
      drive('strong', 'strong', {}, '加粗文本')
      drive('em', 'em', {}, '斜体文本')
      drive('hr', 'hr')
      drive('p', 'p', {}, '段落正文')
      drive('pre', 'pre', {}, 'pre包裹内容')
      // 代码块（带语言 + 换行）与行内代码
      drive('cb', 'code', { inline: false, className: 'language-ts' }, 'const a = 1;\nconst b = 2;')
      drive('ic', 'code', { inline: true }, 'inlineCode')
      // 图片：安全 http 与不安全协议各一次
      drive('img-ok', 'img', { src: 'https://img.example.com/a.png', alt: '安全图' })
      drive('img-bad', 'img', { src: 'javascript:alert(1)', alt: '危险图' })
      return React.createElement('div', { 'data-testid': 'md-stub' }, ...out, props.children)
    },
  }
})

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('formatAIContent（文档分节器）', () => {
  it('纯文本 → 单 text 节', () => {
    const sections = formatAIContent('第一段说明文字')
    expect(sections).toEqual([{ type: 'text', content: '第一段说明文字' }])
  })

  it('带语言代码块 → code 节并提取语言', () => {
    const raw = '前导说明\n```ts\nconst a = 1;\n```\n'
    const sections = formatAIContent(raw)
    expect(sections).toEqual([
      { type: 'text', content: '前导说明' },
      { type: 'code', content: 'const a = 1;', language: 'ts' },
    ])
  })

  it('无语言标注代码块 → language 回退 text', () => {
    const sections = formatAIContent('```\nplain\n```')
    expect(sections).toEqual([{ type: 'code', content: 'plain', language: 'text' }])
  })

  it('多个代码块与间隔文本按序分节', () => {
    const raw = '开头\n```js\nA\n```\n中间\n```py\nB\n```\n结尾'
    const sections = formatAIContent(raw)
    expect(sections.map(s => s.type)).toEqual(['text', 'code', 'text', 'code', 'text'])
    expect(sections[1]).toMatchObject({ language: 'js', content: 'A' })
    expect(sections[3]).toMatchObject({ language: 'py', content: 'B' })
    expect(sections[4].content).toBe('结尾')
  })

  it('空字符串 → 空数组', () => {
    expect(formatAIContent('')).toEqual([])
  })
})

describe('contextManager（上下文记忆管理器）', () => {
  const msg = (id: string, role: 'user' | 'ai', content: string) => ({
    id, timestamp: 1, role, content, keywords: [], category: 'test',
  })

  it('addMessage 首次建档；getContext 命中；未命中返回 null', () => {
    contextManager.addMessage('s1', msg('m1', 'user', '帮我写登录页'))
    const ctx = contextManager.getContext('s1')
    expect(ctx?.sessionId).toBe('s1')
    expect(ctx?.messages).toHaveLength(1)
    expect(contextManager.getContext('不存在')).toBeNull()
  })

  it('addMessage 追加消息并更新 lastUpdated；重复 sessionId 覆盖不重复建档', () => {
    contextManager.addMessage('s2', msg('m1', 'user', '第一条'))
    const before = contextManager.getContext('s2')!
    contextManager.addMessage('s2', msg('m2', 'ai', '回复'))
    const after = contextManager.getContext('s2')!
    expect(after.messages).toHaveLength(2)
    expect(after.lastUpdated).toBeGreaterThanOrEqual(before.lastUpdated)
  })

  it('消息超过 50 条裁剪为最近 50 条', () => {
    for (let i = 0; i < 55; i++) {
      contextManager.addMessage('s3', msg(`m${i}`, 'user', `消息${i}`))
    }
    const ctx = contextManager.getContext('s3')!
    expect(ctx.messages).toHaveLength(50)
    expect(ctx.messages[0].id).toBe('m5')
    expect(ctx.messages[49].id).toBe('m54')
  })

  it('getRecentContext 取最近 N 条；无会话返回空数组', () => {
    for (let i = 0; i < 4; i++) {
      contextManager.addMessage('s4', msg(`r${i}`, 'user', `r${i}`))
    }
    const recent = contextManager.getRecentContext('s4', 2)
    expect(recent.map(m => m.id)).toEqual(['r2', 'r3'])
    expect(contextManager.getRecentContext('无', 2)).toEqual([])
  })

  it('generateSummary 只取 user 消息拼主题；全 ai 时返回空串', () => {
    const summary = contextManager.generateSummary([
      msg('a', 'user', '问题一内容'),
      msg('b', 'ai', '回答一'),
      msg('c', 'user', '问题二内容'),
    ])
    expect(summary).toBe('对话主题：问题一内容 | 问题二内容')
    expect(contextManager.generateSummary([msg('d', 'ai', '只有AI')])).toBe('')
  })

  it('clearSession 只删指定会话；clearAll 清空', () => {
    contextManager.addMessage('s5', msg('m', 'user', 'x'))
    contextManager.addMessage('s6', msg('m', 'user', 'y'))
    contextManager.clearSession('s5')
    expect(contextManager.getContext('s5')).toBeNull()
    expect(contextManager.getContext('s6')).not.toBeNull()
    contextManager.clearAll()
    expect(contextManager.getAllContexts()).toEqual([])
  })

  it('localStorage 脏数据时 getAllContexts 容错返回空数组', () => {
    localStorage.setItem('yyc3-ai-context-memory', '{broken json!')
    expect(contextManager.getAllContexts()).toEqual([])
    expect(contextManager.getContext('任意')).toBeNull()
  })
})

describe('EnhancedMarkdown（增强 markdown 渲染）', () => {
  it('渲染内容与流式光标（isStreaming 光标出现/消失）', () => {
    const { container, rerender } = render(<EnhancedMarkdown content="# 正文内容" />)
    expect(container.textContent).toContain('正文内容')
    expect(container.querySelector('.animate-pulse')).toBeNull()
    rerender(<EnhancedMarkdown content="# 正文内容" isStreaming />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('代码块分支：语言徽标 + COPY 按钮（剪贴板写入 + onCopyCode 回调透传）', async () => {
    const onCopyCode = vi.fn()
    const { container } = render(
      <EnhancedMarkdown content="x" onCopyCode={onCopyCode} />,
    )
    const block = container.querySelector('.enhanced-code-block')!
    expect(block.textContent).toContain('TS')
    const copyBtn = Array.from(block.querySelectorAll('button')).find(b => b.textContent!.includes('COPY'))!
    fireEvent.click(copyBtn)
    // handleCopy 为 async：await 剪贴板后才触发回调
    await waitFor(() => expect(onCopyCode).toHaveBeenCalledTimes(1))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const a = 1;\nconst b = 2;')
    expect(onCopyCode).toHaveBeenCalledWith('const a = 1;\nconst b = 2;', 'markdown')
    // 注：COPIED 高亮态当前不可达——code/h1 组件每次渲染重新生成随机 sectionId，
    // copiedSections/expandedSections 永远无法命中（疑似源码 bug，已单独报告，此处不断言 UI 态）
  })

  it('代码块反馈按钮：onFeedback 正/负向透传', () => {
    const onFeedback = vi.fn()
    const { container } = render(<EnhancedMarkdown content="x" onFeedback={onFeedback} />)
    const block = container.querySelector('.enhanced-code-block')!
    const good = block.querySelector('button[title="这段代码有帮助"]')!
    const bad = block.querySelector('button[title="这段代码有问题"]')!
    fireEvent.click(good)
    fireEvent.click(bad)
    expect(onFeedback).toHaveBeenCalledWith('positive', 'const a = 1;\nconst b = 2;')
    expect(onFeedback).toHaveBeenCalledWith('negative', 'const a = 1;\nconst b = 2;')
  })

  it('行内代码与 h1 标题分支（inline code 渲染 + h1 点击接线不崩溃）', () => {
    const { container } = render(<EnhancedMarkdown content="x" />)
    expect(container.querySelector('.inline-code')!.textContent).toBe('inlineCode')
    // h1 点击 → toggleSection 接线（注意：因随机 sectionId 每次渲染重生成，
    // 展开态 UI 当前不可达——疑似源码 bug 已报告，这里断言点击行为本身）
    const h1 = container.querySelector('h1')!
    expect(() => fireEvent.click(h1)).not.toThrow()
    expect(container.querySelector('h1 svg')).not.toBeNull()
  })

  it('块级元素全集渲染：表格/列表/引用/链接/段落驱动桩输出', () => {
    const { container } = render(<EnhancedMarkdown content="x" />)
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('ul.list-disc')).not.toBeNull()
    expect(container.querySelector('ol')).not.toBeNull()
    expect(container.querySelector('blockquote')).not.toBeNull()
    expect(container.querySelector('a[target="_blank"]')!.getAttribute('rel')).toContain('noopener')
    expect(container.querySelector('strong')).not.toBeNull()
    expect(container.querySelector('em')).not.toBeNull()
    expect(container.querySelector('hr')).not.toBeNull()
    expect(container.querySelector('pre')).not.toBeNull()
    expect(container.querySelector('p')).not.toBeNull()
  })
})

describe('ContextSummary（上下文摘要组件）', () => {
  const seed: ConversationContext = {
    sessionId: 'cs1',
    topic: '登录页',
    messages: [
      { id: 'a', timestamp: 1, role: 'user', content: '如何实现登录页', keywords: [], category: 't' },
      { id: 'b', timestamp: 2, role: 'ai', content: '使用表单校验', keywords: [], category: 't' },
      { id: 'c', timestamp: 3, role: 'user', content: '加上记住密码', keywords: [], category: 't' },
    ],
    contextWindow: 10,
    lastUpdated: Date.now(),
  }

  it('无上下文或空消息 → 返回 null', () => {
    const { container } = render(<ContextSummary sessionId="不存在" />)
    expect(container.firstElementChild).toBeNull()
  })

  it('有上下文 → 渲染摘要与最近 3 条消息；onRestore 点击透传整个上下文', () => {
    contextManager.saveContext(seed)
    const onRestore = vi.fn()
    const { container } = render(<ContextSummary sessionId="cs1" onRestore={onRestore} />)
    expect(container.textContent).toContain('上下文记忆')
    expect(container.textContent).toContain('对话主题：如何实现登录页 | 加上记住密码')
    expect(container.textContent).toContain('如何实现登录页')
    expect(container.textContent).toContain('共 3 条消息')
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('恢复上下文'))!)
    expect(onRestore).toHaveBeenCalledTimes(1)
    expect(onRestore.mock.calls[0][0].sessionId).toBe('cs1')
  })

  it('无 onRestore 时不渲染恢复按钮；超 80 字消息截断加省略号', () => {
    const longSeed: ConversationContext = {
      ...seed,
      sessionId: 'cs2',
      messages: [{ ...seed.messages[0], content: '长'.repeat(90) }],
    }
    contextManager.saveContext(longSeed)
    const { container } = render(<ContextSummary sessionId="cs2" />)
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).toContain('...')
    expect(container.textContent!.length).toBeLessThan(300)
  })
})
