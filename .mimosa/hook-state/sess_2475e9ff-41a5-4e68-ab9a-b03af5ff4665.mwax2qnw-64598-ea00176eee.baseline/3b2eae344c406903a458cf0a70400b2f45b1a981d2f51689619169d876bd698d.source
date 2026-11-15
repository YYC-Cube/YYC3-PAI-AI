/**
 * @file layout-engine.test.ts
 * @description 排版适配引擎测试 — 平台配置注册表/CSS 生成/内容转换/一键适配
 */

import { describe, it, expect } from 'vitest'
import {
  getLayoutConfig,
  generatePlatformCSS,
  transformContent,
  adaptForPlatform,
  type LayoutPlatform,
} from '../layout-engine'

const ALL_PLATFORMS: LayoutPlatform[] = ['wechat', 'xiaohongshu', 'zhihu', 'bilibili', 'twitter', 'web']

describe('layout-engine 平台配置注册表', () => {
  it('getLayoutConfig：六个平台均注册且 id/name 与平台一致', () => {
    for (const p of ALL_PLATFORMS) {
      const cfg = getLayoutConfig(p)
      expect(cfg.id).toBe(p)
      expect(cfg.name.length).toBeGreaterThan(0)
    }
    expect(getLayoutConfig('wechat').name).toBe('公众号')
    expect(getLayoutConfig('xiaohongshu').name).toBe('小红书')
  })

  it('getLayoutConfig：各平台 typography 字段完整且非空', () => {
    for (const p of ALL_PLATFORMS) {
      const t = getLayoutConfig(p).typography
      expect(t.h1Size).toBeTruthy()
      expect(t.h2Size).toBeTruthy()
      expect(t.h3Size).toBeTruthy()
      expect(t.bodySize).toBeTruthy()
      expect(t.lineHeight).toBeGreaterThan(0)
      expect(t.paragraphGap).toBeTruthy()
      expect(t.headingColor).toMatch(/^#/)
      expect(t.bodyColor).toMatch(/^#/)
      expect(t.blockquoteBorder).toMatch(/^#/)
      expect(t.blockquoteBg).toMatch(/^#/)
      expect(t.codeSize).toBeTruthy()
      expect(t.codeBg).toMatch(/^#/)
      expect(t.imageRadius).toBeTruthy()
      expect(t.listStyle).toBeTruthy()
    }
  })
})

describe('layout-engine CSS 生成', () => {
  it('generatePlatformCSS：以平台名注释开头且首尾无空白', () => {
    const css = generatePlatformCSS('wechat')
    expect(css.startsWith('/* ── 公众号')).toBe(true)
    expect(css.trim()).toBe(css)
    expect(css).toContain('.preview-content {')
  })

  it('generatePlatformCSS：wechat 正文排版变量注入正文选择器', () => {
    const css = generatePlatformCSS('wechat')
    expect(css).toContain('font-size: 15px;')
    expect(css).toContain('line-height: 1.8;')
    expect(css).toContain('color: #555555;')
    expect(css).toContain('font-size: 20px;') // h1Size
  })

  it('generatePlatformCSS：extraStyles 注入 img/a/table 规则（wechat 阴影、zhihu 链接色）', () => {
    const wechat = generatePlatformCSS('wechat')
    expect(wechat).toContain('box-shadow: 0 2px 8px rgba(0,0,0,0.06);')
    // 23号已修：th/td 等未消费键现输出为独立规则（回归锁定）
    expect(wechat).toContain('.preview-content th {')
    expect(wechat).toContain('.preview-content td {')
    expect(wechat).toContain('border-collapse: collapse;')
    const zhihu = generatePlatformCSS('zhihu')
    expect(zhihu).toContain('color: #056de8;') // zhihu a 链接色
  })

  it('generatePlatformCSS：平台未定义 extraStyles 时使用默认回退（bilibili）', () => {
    const css = generatePlatformCSS('bilibili')
    // a 未配置 → 默认链接样式
    expect(css).toContain('color: #2563eb; text-decoration: underline;')
    // table 未配置 → 注入空串，不出现表格布局样式
    expect(css).not.toContain('border-collapse')
    // hr 为平台自有规则（全部平台均定义了 hr，默认回退分支不可达）
    expect(css).toContain('border-top: 1px solid #eee;')
  })

  it('generatePlatformCSS：li 的 list-style-type 随平台变化', () => {
    expect(generatePlatformCSS('xiaohongshu')).toContain('list-style-type: circle;')
    expect(generatePlatformCSS('zhihu')).toContain('list-style-type: decimal;')
    expect(generatePlatformCSS('wechat')).toContain('list-style-type: disc;')
  })
})

describe('layout-engine 阅读原文区（24号回归）', () => {
  it('平台配置 addReadMore=true（wechat）→ 输出 readmore-section；显式 false 关闭', () => {
    const out = transformContent('wechat', '<p>正文</p>', { addCTA: false })
    expect(out).toContain('readmore-section')
    expect(out).toContain('在看')
    const off = transformContent('wechat', '<p>正文</p>', { addCTA: false, addReadMore: false })
    expect(off).not.toContain('readmore-section')
  })
})

describe('layout-engine 内容转换', () => {
  it('transformContent：基础内容包裹 preview-content 容器', () => {
    const out = transformContent('web', '<p>正文</p>')
    expect(out).toBe('<div class="preview-content"><p>正文</p></div>')
    expect(out).not.toContain('tags-section')
    expect(out).not.toContain('cta-section')
  })

  it('transformContent：xiaohongshu 默认 autoTags 渲染全部模板标签', () => {
    const out = transformContent('xiaohongshu', '<p>笔记</p>')
    expect(out).toContain('tags-section')
    expect(out.match(/class="platform-tag"/g)).toHaveLength(5)
    expect(out).toContain('<span class="platform-tag">#自媒体</span>')
    expect(out).toContain('<span class="platform-tag">#AI写作</span>')
  })

  it('transformContent：自定义标签列表覆盖平台模板', () => {
    const out = transformContent('web', '<p>x</p>', { addTags: true, tags: ['#自定义'] })
    expect(out.match(/class="platform-tag"/g)).toHaveLength(1)
    expect(out).toContain('<span class="platform-tag">#自定义</span>')
  })

  it('transformContent：addTags 显式关闭覆盖平台默认', () => {
    const out = transformContent('xiaohongshu', '<p>x</p>', { addTags: false })
    expect(out).not.toContain('tags-section')
    expect(out).not.toContain('platform-tag')
  })

  it('transformContent：addTags 开启但标签为空时不渲染标签区', () => {
    const out = transformContent('web', '<p>x</p>', { addTags: true, tags: [] })
    expect(out).not.toContain('tags-section')
  })

  it('transformContent：wechat 默认 CTA 包含 ctaText 与 readMoreText', () => {
    const out = transformContent('wechat', '<p>x</p>')
    expect(out).toContain('cta-section')
    expect(out).toContain('关注 YYC³ 获取更多内容')
    expect(out).toContain('点个「在看」')
  })

  it('transformContent：addCTA 开启但 ctaText 为空时不渲染 CTA 区', () => {
    const out = transformContent('web', '<p>x</p>', { addCTA: true, ctaText: '' })
    expect(out).not.toContain('cta-section')
  })

  it('transformContent：twitter 超 280 字符截断并追加省略号', () => {
    const long = 'a'.repeat(281)
    const out = transformContent('twitter', long)
    expect(out).toContain('a'.repeat(280) + '...')
    expect(out).not.toContain('a'.repeat(281))
  })

  it('transformContent：恰好 280 字符时不截断（边界）', () => {
    const exact = 'b'.repeat(280)
    const out = transformContent('twitter', exact)
    expect(out).toContain(exact + '</div>')
    expect(out).not.toContain('...')
  })

  it('transformContent：web 大容量上限下长内容不截断', () => {
    const big = 'c'.repeat(5000)
    const out = transformContent('web', big)
    expect(out).toContain(big + '</div>')
  })
})

describe('layout-engine 一键适配', () => {
  it('adaptForPlatform：css/html 与独立函数输出完全一致并透传 options', () => {
    const { css, html } = adaptForPlatform('wechat', '<p>内容</p>', '标题', { addCTA: false })
    expect(css).toBe(generatePlatformCSS('wechat'))
    expect(html).toBe(transformContent('wechat', '<p>内容</p>', { addCTA: false, title: '标题' }))
  })
})
