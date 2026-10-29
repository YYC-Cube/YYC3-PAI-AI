/**
 * @file CodeBlockWrap.tsx
 * @description Rehype 插件：代码块顶部操作栏（复制 + 填入编辑器）
 * 按钮挂载真实函数（react-markdown 会把函数值属性渲染为可用的 onClick）——
 * 历史版本把 onClick 写成字符串导致按钮是死的，已修复。
 */

import { visit } from 'unist-util-visit'

type Opt = { onInsertEditor?: (code: string) => void }

export const codeBlockPlugin = (opt: Opt) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
        const codeNode = node.children[0]
        const codeText = (codeNode.children?.[0]?.value ?? '') as string
        const classNameArr = (codeNode.properties?.className ?? []) as string[]
        const lang = classNameArr
          .find((s: string) => s.startsWith('language-'))
          ?.replace('language-', '') || 'txt'

        node.properties.className = 'relative group my-2 rounded-lg overflow-hidden'

        node.children.unshift({
          type: 'element',
          tagName: 'div',
          properties: {
            className:
              'flex items-center justify-between px-3 py-1.5 border-b',
            style:
              'border-color: color-mix(in srgb, currentColor 15%, transparent); background: color-mix(in srgb, currentColor 5%, transparent);',
          },
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: {
                className: 'text-xs font-mono uppercase tracking-wider opacity-60',
              },
              children: [{ type: 'text', value: lang }],
            },
            {
              type: 'element',
              tagName: 'div',
              properties: { className: 'flex gap-2' },
              children: [
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    className:
                      'text-xs px-2 py-0.5 rounded transition-all hover:opacity-80',
                    style:
                      'background: color-mix(in srgb, currentColor 12%, transparent);',
                    // 真实函数：react-markdown 将其作为 onClick 渲染
                    onClick: () => {
                      navigator.clipboard.writeText(codeText).catch(() => { /* 剪贴板权限被拒时静默 */ })
                    },
                    'data-action': 'copy',
                  },
                  children: [{ type: 'text', value: '复制' }],
                },
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    className:
                      'text-xs px-2 py-0.5 rounded transition-all hover:opacity-80',
                    style:
                      'background: color-mix(in srgb, currentColor 12%, transparent);',
                    onClick: () => {
                      // 无宿主回调时退化为复制（保证按钮永远有真实行为）
                      if (opt.onInsertEditor) opt.onInsertEditor(codeText)
                      else navigator.clipboard.writeText(codeText).catch(() => { /* 同上 */ })
                    },
                    'data-action': 'insert',
                  },
                  children: [{ type: 'text', value: '填入编辑器' }],
                },
              ],
            },
          ],
        })
      }
    })
  }
}
