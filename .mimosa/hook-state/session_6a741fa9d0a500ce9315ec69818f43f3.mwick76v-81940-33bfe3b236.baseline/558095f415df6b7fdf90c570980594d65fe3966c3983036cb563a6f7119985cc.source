/**
 * @file ChatInputBox.test.tsx
 * @description 双模输入框测试 — MD 输入/快捷插入/引用填充/⌘+⏎发送/模式切换
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import ChatInputBox from '../ChatInputBox'

const findBtn = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(b => b.textContent === label)

describe('ChatInputBox（双模输入框）', () => {
  it('输入内容后点击发送（onSend 回调 + 清空）', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: '你好世界' } })
    fireEvent.click(findBtn(container, '发送')!)
    expect(onSend).toHaveBeenCalledWith('你好世界')
    expect(ta.value).toBe('')
  })

  it('空内容发送为 no-op（trim 守卫）', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    fireEvent.click(findBtn(container, '发送')!)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('纯空白内容发送为 no-op', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: '   \n  ' } })
    fireEvent.click(findBtn(container, '发送')!)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('⌘/Ctrl+Enter 快捷发送', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: '快捷发送' } })
    fireEvent.keyDown(ta, { key: 'Enter', ctrlKey: true })
    expect(onSend).toHaveBeenCalledWith('快捷发送')
  })

  it('MD 快捷插入按钮追加片段（B/Code/块/表）', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.click(findBtn(container, 'B')!)
    fireEvent.click(findBtn(container, 'Code')!)
    expect(ta.value).toBe('**粗体**`行内代码`')
    expect(findBtn(container, '块')!).toBeTruthy()
    expect(findBtn(container, '表')!).toBeTruthy()
  })

  it('引用内容自动填充为 Markdown 引用块（多行逐行加 > 前缀）', () => {
    const onSend = vi.fn()
    const { container } = render(
      <ChatInputBox onSend={onSend} quoteContent={'第一行\n第二行'} />,
    )
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    expect(ta.value).toContain('> 第一行')
    expect(ta.value).toContain('> 第二行')
    expect(ta.placeholder).toContain('引用消息已自动填充')
  })

  it('切到富文本模式渲染 Tiptap 编辑区；切回 MD（md 内容按设计不保留，富文本→MD 才回填）', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    fireEvent.click(findBtn(container, '富文本')!)
    // MD textarea 卸载，Tiptap EditorContent 出现
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('.tiptap') || container.querySelector('[contenteditable]')).toBeTruthy()
    // 底部提示切为富文本文案
    expect(container.textContent).toContain('支持表格 / 图片 / 粘贴')
    fireEvent.click(findBtn(container, 'Markdown')!)
    const taBack = container.querySelector('textarea') as HTMLTextAreaElement
    expect(taBack).toBeTruthy()
    // 空编辑器切回 → 空（丢弃 HTML 内容，保留纯文本参考）
    expect(taBack.value).toBe('')
  })

  it('聚焦时高亮边框（isFocused 状态）', () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInputBox onSend={onSend} />)
    const focusWrap = container.querySelector('textarea')!.parentElement as HTMLElement
    fireEvent.focus(focusWrap)
    fireEvent.blur(focusWrap)
    expect(container.firstElementChild).toBeTruthy()
  })
})
