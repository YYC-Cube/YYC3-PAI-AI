/**
 * @file AiMessageRender.test.tsx
 * @description AI 消息渲染组件专项 — react-markdown 全局桩 children 原样透传语义（内容字符串直出）/
 *              折叠门控（needFold 阈值·初始 folded·遮罩按钮）/工具栏「引用/重新生成」回调布线/
 *              覆盖组件抽检（本文件局部升级桩驱动 components.p/strong/a/table/img：链接安全 rel、img 危险 src 过滤）
 * 策略：默认沿用 setup.ts 全局桩（children || null）；覆盖组件用例切 md.mode='overrides'，
 *       由局部 react-markdown 桩以固定 props 逐一调用覆盖组件并渲染（真 theme-store 提供 tokens）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

const md = vi.hoisted(() => ({ mode: 'passthrough' as 'passthrough' | 'overrides' }))

vi.mock('react-markdown', async () => {
  const React = await import('react')
  return {
    default: (props: {
      children?: unknown
      components?: Record<string, (p: Record<string, unknown>) => React.ReactNode>
    }) => {
      // 透传模式：与全局 setup 桩语义一致
      if (md.mode !== 'overrides' || !props.components) {
        return (props.children ?? null) as React.ReactNode
      }
      // 覆盖组件抽检模式：以固定 props 逐一调用全部组件覆盖
      const c = props.components
      return React.createElement(
        'div',
        { 'data-testid': 'overrides' },
        React.createElement('section', { 'data-testid': 'ov-p' }, c.p({ children: '段落文本' })),
        React.createElement('section', { 'data-testid': 'ov-strong' }, c.strong({ children: '加粗文本' })),
        React.createElement('section', { 'data-testid': 'ov-em' }, c.em({ children: '强调文本' })),
        React.createElement('section', { 'data-testid': 'ov-a' }, c.a({ href: 'https://example.com/x', children: '链接文本' })),
        React.createElement('section', { 'data-testid': 'ov-table' }, c.table({ children: c.th({ children: '表头' }) })),
        React.createElement('section', { 'data-testid': 'ov-th' }, c.th({ children: '表头' })),
        React.createElement('section', { 'data-testid': 'ov-td' }, c.td({ children: '单元格' })),
        React.createElement('section', { 'data-testid': 'ov-blockquote' }, c.blockquote({ children: '引用块' })),
        React.createElement('section', { 'data-testid': 'ov-h1' }, c.h1({ children: '一级标题' })),
        React.createElement('section', { 'data-testid': 'ov-h2' }, c.h2({ children: '二级标题' })),
        React.createElement('section', { 'data-testid': 'ov-h3' }, c.h3({ children: '三级标题' })),
        React.createElement('section', { 'data-testid': 'ov-ul' }, c.ul({ children: c.li({ children: '无序项' }) })),
        React.createElement('section', { 'data-testid': 'ov-ol' }, c.ol({ children: c.li({ children: '有序项' }) })),
        React.createElement('section', { 'data-testid': 'ov-li' }, c.li({ children: '列表项' })),
        React.createElement('section', { 'data-testid': 'ov-hr' }, c.hr({})),
        React.createElement('section', { 'data-testid': 'ov-img-safe' }, c.img({ src: 'https://img.example.com/ok.png', alt: '安全图' })),
        React.createElement('section', { 'data-testid': 'ov-img-evil' }, c.img({ src: 'javascript:alert(1)', alt: '危险图' })),
      )
    },
  }
})

import AiMessageRender from '../AiMessageRender'
import type { ChatMessage } from '../../../types/chat'

// ── Fixtures / Helpers ──

const mkMsg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg_1',
  role: 'ai',
  content: '普通回答内容',
  folded: false,
  timestamp: Date.now(),
  ...over,
})

const LONG_TEXT = '很长的段落。'.repeat(150) // 900 字符 > 800 阈值
const WITH_CODE = ['说明如下：', '```ts', 'const a = 1', '```'].join('\n') // < 800 但含代码围栏

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  md.mode = 'passthrough'
})

describe('AiMessageRender（AI 消息渲染）', () => {
  it('覆盖组件抽检：标题层级 h1-h3/引用块/列表 ul·ol·li/分隔线 hr/表格 th·td 全部按 tokens 主题渲染', () => {
    md.mode = 'overrides'
    const { container } = render(
      <AiMessageRender message={mkMsg()} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    // 标题层级
    const h1 = container.querySelector('[data-testid="ov-h1"] h1') as HTMLElement
    expect(h1.className).toContain('font-bold')
    expect(h1.style.color).toBeTruthy()
    expect((container.querySelector('[data-testid="ov-h2"] h2') as HTMLElement).style.fontSize).toBeTruthy()
    expect((container.querySelector('[data-testid="ov-h3"] h3') as HTMLElement).style.fontSize).toBeTruthy()
    // 引用块：主色左边框
    const bq = container.querySelector('[data-testid="ov-blockquote"] blockquote') as HTMLElement
    expect(bq.className).toContain('border-l-2')
    expect(bq.style.borderColor).toBeTruthy()
    // 列表：ul 圆点 / ol 数字 / li 行高
    const ul = container.querySelector('[data-testid="ov-ul"] ul') as HTMLElement
    expect(ul.className).toContain('list-disc')
    expect((container.querySelector('[data-testid="ov-ol"] ol') as HTMLElement).className).toContain('list-decimal')
    expect((container.querySelector('[data-testid="ov-li"] li') as HTMLElement).style.lineHeight).toBeTruthy()
    // 分隔线
    expect(container.querySelector('[data-testid="ov-hr"] hr')).toBeTruthy()
    // 表头/单元格 tokens
    const th = container.querySelector('[data-testid="ov-th"] th') as HTMLElement
    expect(th.style.background).toBeTruthy()
    expect(th.style.textTransform).toBe('uppercase')
    const td = container.querySelector('[data-testid="ov-td"] td') as HTMLElement
    expect(td.style.borderBottom).toBeTruthy()
    expect((container.querySelector('[data-testid="ov-em"] em') as HTMLElement).style.fontStyle).toBe('italic')
  })

  it('全局桩语义：content 字符串经 ReactMarkdown 桩原样直出；容器背景使用 tokens.primaryGlow', () => {
    const { container } = render(
      <AiMessageRender message={mkMsg({ content: '## 标题与 **加粗** 原样输出' })} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    // 桩 children 透传 → markdown 源文本直接出现在 DOM
    expect(container.textContent).toContain('## 标题与 **加粗** 原样输出')
    // 容器 tokens：primaryGlow 背景 + cardBorder 边框
    const root = container.firstElementChild as HTMLElement
    expect(root.style.background).toBeTruthy()
    expect(root.style.border).toContain('1px solid')
  })

  it('工具栏布线：「引用」回调 onQuote(content)；「重新生成」回调 onRegenerate(id)', () => {
    const onQuote = vi.fn()
    const onRegenerate = vi.fn()
    const { container } = render(
      <AiMessageRender message={mkMsg({ id: 'msg_re', content: '待引用内容' })} onRegenerate={onRegenerate} onQuote={onQuote} />,
    )
    fireEvent.click(btnByText(container, '引用'))
    expect(onQuote).toHaveBeenCalledTimes(1)
    expect(onQuote).toHaveBeenCalledWith('待引用内容')
    fireEvent.click(btnByText(container, '重新生成'))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
    expect(onRegenerate).toHaveBeenCalledWith('msg_re')
  })

  it('折叠门控：短文本无折叠按钮；>800 字符出现「折叠」按钮，点击加 max-h-[200px] 截断类并显示遮罩按钮', () => {
    const { container } = render(
      <AiMessageRender message={mkMsg({ content: '短内容' })} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    expect(container.textContent).not.toContain('折叠')
    expect(container.querySelector('.max-h-\\[200px\\]')).toBeNull()

    const long = render(
      <AiMessageRender message={mkMsg({ content: LONG_TEXT })} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    const foldBtn = btnByText(long.container, '折叠')
    expect(foldBtn).toBeTruthy()
    expect(long.container.querySelector('.max-h-\\[200px\\]')).toBeNull()
    fireEvent.click(foldBtn)
    expect(long.container.querySelector('.max-h-\\[200px\\]')).toBeTruthy()
    // 折叠后按钮文案切「展开」+ 底部遮罩按钮
    expect(btnByText(long.container, '展开')).toBeTruthy()
    expect(long.container.textContent).toContain('点击展开完整内容')
    // 遮罩按钮点击 → 再次折叠切换（恢复展开）
    fireEvent.click(btnByText(long.container, '点击展开完整内容'))
    expect(long.container.querySelector('.max-h-\\[200px\\]')).toBeNull()
    expect(btnByText(long.container, '折叠')).toBeTruthy()
  })

  it('代码围栏触发折叠（短于 800 字符也折叠）且 folded=true 初始即折叠', () => {
    const { container } = render(
      <AiMessageRender message={mkMsg({ content: WITH_CODE })} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    expect(btnByText(container, '折叠')).toBeTruthy()
    // folded 初始 true → 直接折叠态
    const folded = render(
      <AiMessageRender message={mkMsg({ content: WITH_CODE, folded: true })} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    expect(folded.container.querySelector('.max-h-\\[200px\\]')).toBeTruthy()
    expect(folded.container.textContent).toContain('点击展开完整内容')
  })

  it('覆盖组件抽检（局部升级桩）：p 应用 my-1 与 token 前景色；strong 字重 600；a 新窗口 + noopener', () => {
    md.mode = 'overrides'
    const { container } = render(
      <AiMessageRender message={mkMsg()} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    const p = container.querySelector('[data-testid="ov-p"] p') as HTMLElement
    expect(p.className).toContain('my-1')
    expect(p.style.color).toBeTruthy()
    const strong = container.querySelector('[data-testid="ov-strong"] strong') as HTMLElement
    expect(strong.style.fontWeight).toBe('600')
    const a = container.querySelector('[data-testid="ov-a"] a') as HTMLAnchorElement
    expect(a.getAttribute('href')).toBe('https://example.com/x')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toContain('noopener')
    expect(a.style.textDecoration).toContain('underline')
  })

  it('覆盖组件抽检：table 包裹横向滚动容器；img 白名单放行 http/data，拦截 javascript: 危险协议', () => {
    md.mode = 'overrides'
    const { container } = render(
      <AiMessageRender message={mkMsg()} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    // table 外层 overflow-x-auto，内层 border-collapse
    const wrap = container.querySelector('[data-testid="ov-table"] div') as HTMLElement
    expect(wrap.className).toContain('overflow-x-auto')
    const table = wrap.querySelector('table')!
    expect(table.className).toContain('border-collapse')
    // img：安全 http src 保留；危险协议 src 被置为 undefined（无 src 属性）
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    expect((imgs[0] as HTMLImageElement).getAttribute('src')).toBe('https://img.example.com/ok.png')
    expect(imgs[0].getAttribute('loading')).toBe('lazy')
    expect(imgs[0].getAttribute('referrerpolicy')).toBe('no-referrer')
    expect((imgs[1] as HTMLImageElement).getAttribute('src')).toBeNull()
    expect((imgs[1] as HTMLImageElement).getAttribute('alt')).toBe('危险图')
  })

  it('短内容下工具栏常驻：引用/重新生成双按钮存在且不渲染折叠分支；onInsertEditor 缺省不报错', () => {
    expect(() =>
      render(
        <AiMessageRender message={mkMsg()} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
      ),
    ).not.toThrow()
    const { container } = render(
      <AiMessageRender message={mkMsg()} onRegenerate={vi.fn()} onQuote={vi.fn()} />,
    )
    expect(btnByText(container, '引用')).toBeTruthy()
    expect(btnByText(container, '重新生成')).toBeTruthy()
    expect(container.querySelectorAll('button')).toHaveLength(2) // 无折叠按钮
  })
})
