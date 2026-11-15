/**
 * @file CodeBlockWrap.test.ts
 * @description 代码块 rehype 插件契约：真实函数按钮 / 语言标签 / 纯文本提取
 */

import { describe, it, expect, vi } from 'vitest'
import { codeBlockPlugin } from '../CodeBlockWrap'

// 测试文件 no-explicit-any 已在 eslint.config 对 *.test.* 豁免（hast 夹具宽类型）

function makeTree(code: string, lang = 'typescript'): any {
  return {
    type: 'root',
    children: [{
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [{
        type: 'element',
        tagName: 'code',
        properties: { className: [`language-${lang}`] },
        children: [{ type: 'text', value: code }],
      }],
    }],
  }
}

function run(code = 'x', lang: string | null = 'typescript', opt?: Parameters<typeof codeBlockPlugin>[0]) {
  const tree = lang === null ? (() => {
    const t = makeTree(code)
    ;(t.children[0].children[0] as any).properties = {}
    return t
  })() : makeTree(code, lang)
  codeBlockPlugin(opt ?? {})(tree)
  const bar = tree.children[0].children[0] as any
  const [langSpan, btnGroup] = bar.children
  return { tree, bar, langText: langSpan.children[0].value, buttons: btnGroup.children as any[] }
}

describe('codeBlockPlugin（零 mock 死按钮修复回归）', () => {
  it('注入操作栏：语言标签 + 复制/填入编辑器按钮', () => {
    const { langText, buttons } = run('const x = 1', 'typescript')
    expect(langText).toBe('typescript')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].children[0].value).toBe('复制')
    expect(buttons[1].children[0].value).toBe('填入编辑器')
  })

  it('复制按钮为真实函数（历史字符串 onClick 死按钮回归）', () => {
    const { buttons } = run('hello')
    expect(typeof buttons[0].properties.onClick).toBe('function')
  })

  it('复制按钮点击写入剪贴板', () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: write } })
    const { buttons } = run('code-to-copy')
    buttons[0].properties.onClick()
    expect(write).toHaveBeenCalledWith('code-to-copy')
  })

  it('填入编辑器：有宿主回调时转发代码', () => {
    const onInsert = vi.fn()
    const { buttons } = run('insert-me', undefined, { onInsertEditor: onInsert })
    buttons[1].properties.onClick()
    expect(onInsert).toHaveBeenCalledWith('insert-me')
  })

  it('填入编辑器：无宿主回调退化为复制（按钮永远有真实行为）', () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: write } })
    const { buttons } = run('fallback-copy')
    buttons[1].properties.onClick()
    expect(write).toHaveBeenCalledWith('fallback-copy')
  })

  it('无语言类名默认 txt', () => {
    const { langText } = run('x', null)
    expect(langText).toBe('txt')
  })

  it('非 pre/code 节点不被处理', () => {
    const tree = { type: 'root', children: [{ type: 'element', tagName: 'div', properties: {}, children: [] }] }
    codeBlockPlugin({})(tree as any)
    expect(tree.children[0].children).toHaveLength(0)
  })
})
