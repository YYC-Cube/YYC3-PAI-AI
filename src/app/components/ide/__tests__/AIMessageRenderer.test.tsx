/**
 * @file AIMessageRenderer.test.tsx
 * @description AI 消息 markdown 渲染器 — 空内容守卫/流式光标/代码块复制/表格图片链接守卫
 *
 * react-markdown 以「组件映射驱动桩」替换 setup 全局透传桩：桩按映射表逐项调用
 * components.code/pre/a/table/th/td/...，覆盖渲染器内部全部组件映射分支。
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { AIMessageRenderer } from '../AIMessageRenderer'

// 组件映射驱动桩：逐项调用 components 映射（含安全/不安全图片两种入参），children 原文透传
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
      drive('h1', 'h1', {}, '一级标题')
      drive('h2', 'h2', {}, '二级标题')
      drive('h3', 'h3', {}, '三级标题')
      drive('bq', 'blockquote', {}, '引用片段')
      drive('ul', 'ul', {}, [React.createElement('span', { key: 'x' }, '甲'), React.createElement('span', { key: 'y' }, '乙')])
      drive('ol', 'ol', {}, React.createElement('span', { key: 'z' }, '丙'))
      drive('li', 'li', {}, '列表叶子')
      if (C.table && C.th && C.td) {
        out.push(React.createElement(C.table, { key: 'tbl' }, [
          React.createElement(C.th, { key: 'th' }, '字段'),
          React.createElement(C.td, { key: 'td' }, '取值'),
        ]))
      }
      drive('a', 'a', { href: 'https://example.com' }, '文档链接')
      drive('strong', 'strong', {}, '重点')
      drive('em', 'em', {}, '强调')
      drive('hr', 'hr')
      drive('p', 'p', {}, '段落文字')
      // pre 透传分支：直接透传子元素
      if (C.pre) out.push(React.createElement(C.pre, { key: 'pre' }, React.createElement('span', null, 'pre内部')))
      // 块级代码（string children）与块级代码（数组 children → 拼接复制）
      drive('cb', 'code', { inline: false, className: 'language-js' }, 'let x = 1;\nlet y = 2;')
      drive('cb-arr', 'code', { inline: false, className: 'language-json' }, ['{"a":', '1}'])
      drive('ic', 'code', { inline: true, className: 'not-language' }, '行内码')
      // 图片：http 安全保留；javascript: 危险协议置空
      drive('img-ok', 'img', { src: 'https://pic.example.com/x.png', alt: '正常图' })
      drive('img-bad', 'img', { src: 'javascript:alert(1)', alt: '危险图' })
      drive('img-none', 'img', { alt: '无源图' })
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

describe('AIMessageRenderer（AI 消息渲染器）', () => {
  it('空内容或纯空白 → 返回 null', () => {
    const { container } = render(<AIMessageRenderer content="" />)
    expect(container.firstElementChild).toBeNull()
    const { container: c2 } = render(<AIMessageRenderer content="   " />)
    expect(c2.firstElementChild).toBeNull()
  })

  it('正常内容渲染 + className 透传 + 流式光标随 isStreaming 显隐', () => {
    const { container, rerender } = render(
      <AIMessageRenderer content="回答正文" className="extra-cls" />,
    )
    expect(container.querySelector('.ai-message-renderer')!.classList.contains('extra-cls')).toBe(true)
    expect(container.querySelector('.ai-streaming-cursor')).toBeNull()
    rerender(<AIMessageRenderer content="回答正文" isStreaming />)
    expect(container.querySelector('.ai-streaming-cursor')).not.toBeNull()
  })

  it('代码块（string children）：语言徽标 + COPY 点击写剪贴板并出现 COPIED', async () => {
    const { container } = render(<AIMessageRenderer content="x" />)
    const blocks = container.querySelectorAll('.ai-md-code-block')
    expect(blocks).toHaveLength(2)
    expect(blocks[0].textContent).toContain('js') // textTransform:uppercase 仅视觉层，DOM 文本仍小写
    const copyBtn = blocks[0].querySelector('button')!
    expect(copyBtn.getAttribute('title')).toBe('Copy code')
    fireEvent.click(copyBtn)
    await waitFor(() => expect(container.textContent).toContain('COPIED'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('let x = 1;\nlet y = 2;')
  })

  it('代码块（数组 children）复制时拼接为完整纯文本', () => {
    const { container } = render(<AIMessageRenderer content="x" />)
    const blocks = container.querySelectorAll('.ai-md-code-block')
    fireEvent.click(blocks[1].querySelector('button')!)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"a":1}')
  })

  it('行内代码走 InlineCode 分支（不带复制按钮）', () => {
    const { container } = render(<AIMessageRenderer content="x" />)
    const inline = container.querySelector('.ai-md-inline-code')!
    expect(inline.textContent).toBe('行内码')
    expect(inline.querySelector('button')).toBeNull()
  })

  it('块级元素全集：标题/表格/列表/引用/链接/图片渲染与危险图片源清空', () => {
    const { container } = render(<AIMessageRenderer content="x" />)
    expect(container.querySelector('h1')!.textContent).toContain('一级标题')
    expect(container.querySelector('h2')).not.toBeNull()
    expect(container.querySelector('h3')).not.toBeNull()
    expect(container.querySelector('blockquote')).not.toBeNull()
    expect(container.querySelector('table.ai-md-table')).not.toBeNull()
    expect(container.querySelector('th')!.textContent).toBe('字段')
    expect(container.querySelector('td')!.textContent).toBe('取值')
    expect(container.querySelector('ul.list-disc')).not.toBeNull()
    expect(container.querySelector('ol.list-decimal')).not.toBeNull()
    const link = container.querySelector('a[target="_blank"]')!
    expect(link.getAttribute('rel')).toContain('noreferrer')
    const imgs = Array.from(container.querySelectorAll('img'))
    expect(imgs.find(i => i.getAttribute('alt') === '正常图')!.getAttribute('src')).toContain('https://')
    expect(imgs.find(i => i.getAttribute('alt') === '危险图')!.getAttribute('src')).toBeNull()
    expect(imgs.find(i => i.getAttribute('alt') === '无源图')).not.toBeNull()
    expect(container.querySelector('strong')).not.toBeNull()
    expect(container.querySelector('em')).not.toBeNull()
    expect(container.querySelector('hr')).not.toBeNull()
    expect(container.querySelector('p')).not.toBeNull()
  })

  it('流式模式在内容尾部插入零宽字符占位', () => {
    const { container } = render(<AIMessageRenderer content="增量" isStreaming />)
    expect(container.querySelector('.ai-message-renderer')!.textContent).toContain('\u200B')
  })
})
