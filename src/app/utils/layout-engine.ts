/**
 * @file layout-engine.ts
 * @description B1: 排版适配引擎 — 各自媒体平台专属排版规则与内容转换
 * 提供平台特定的 CSS 样式生成、HTML 内容转换、设备框架配置
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [self-media],[layout],[preview]
 */

// ── 平台支持类型 ──

export type LayoutPlatform = 'wechat' | 'xiaohongshu' | 'zhihu' | 'bilibili' | 'twitter' | 'web'

// ── 平台排版配置 ──

export interface TypographyConfig {
  /** 标题字体大小 */
  h1Size: string
  h2Size: string
  h3Size: string
  /** 正文字体大小 */
  bodySize: string
  /** 行高 */
  lineHeight: number
  /** 段落间距 */
  paragraphGap: string
  /** 标题颜色 */
  headingColor: string
  /** 正文颜色 */
  bodyColor: string
  /** 引用块边框颜色 */
  blockquoteBorder: string
  /** 引用块背景色 */
  blockquoteBg: string
  /** 代码字体大小 */
  codeSize: string
  /** 代码背景色 */
  codeBg: string
  /** 图片圆角 */
  imageRadius: string
  /** 列表样式类型 */
  listStyle: string
}

export interface PlatformLayoutConfig {
  id: LayoutPlatform
  name: string
  /** 排版规则 */
  typography: TypographyConfig
  /** 额外 CSS 规则（键为选择器，值为样式对象） */
  extraStyles: Record<string, string>
  /** 内容转换规则 */
  transforms: {
    /** 是否自动添加标签 */
    autoTags?: boolean
    /** 标签模板 */
    tagsTemplate?: string[]
    /** 是否添加阅读原文链接 */
    addReadMore?: boolean
    /** 阅读原文文本 */
    readMoreText?: string
    /** 是否添加CTA按钮 */
    addCTA?: boolean
    /** CTA文本 */
    ctaText?: string
    /** 最大内容长度（字符） */
    maxContentLength?: number
  }
}

// ── 各平台排版配置 ──

const WECHAT_LAYOUT: PlatformLayoutConfig = {
  id: 'wechat',
  name: '公众号',
  typography: {
    h1Size: '20px',
    h2Size: '18px',
    h3Size: '16px',
    bodySize: '15px',
    lineHeight: 1.8,
    paragraphGap: '12px',
    headingColor: '#333333',
    bodyColor: '#555555',
    blockquoteBorder: '#07c160',
    blockquoteBg: '#f0faf4',
    codeSize: '13px',
    codeBg: '#f5f5f5',
    imageRadius: '4px',
    listStyle: 'disc',
  },
  extraStyles: {
    'img': 'border-radius: 4px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);',
    'table': 'width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;',
    'th': 'background: #f7f7f7; padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600;',
    'td': 'padding: 8px 12px; border: 1px solid #e0e0e0;',
    'hr': 'border: none; border-top: 1px solid #eee; margin: 24px 0;',
  },
  transforms: {
    autoTags: false,
    addReadMore: true,
    readMoreText: '👇 觉得不错？点个「在看」分享给朋友',
    addCTA: true,
    ctaText: '关注 YYC³ 获取更多内容',
  },
}

const XIAOHONGSHU_LAYOUT: PlatformLayoutConfig = {
  id: 'xiaohongshu',
  name: '小红书',
  typography: {
    h1Size: '18px',
    h2Size: '16px',
    h3Size: '15px',
    bodySize: '14px',
    lineHeight: 1.9,
    paragraphGap: '10px',
    headingColor: '#222222',
    bodyColor: '#444444',
    blockquoteBorder: '#ff2442',
    blockquoteBg: '#fff5f6',
    codeSize: '12px',
    codeBg: '#f5f5f5',
    imageRadius: '8px',
    listStyle: 'circle',
  },
  extraStyles: {
    'img': 'border-radius: 8px; margin: 12px 0;',
    'hr': 'border: none; height: 1px; background: linear-gradient(to right, transparent, #eee, transparent); margin: 20px 0;',
    'strong': 'color: #ff2442;',
  },
  transforms: {
    autoTags: true,
    tagsTemplate: ['#自媒体', '#创作', '#内容营销', '#AI写作', '#干货分享'],
    maxContentLength: 2000,
  },
}

const ZHIHU_LAYOUT: PlatformLayoutConfig = {
  id: 'zhihu',
  name: '知乎',
  typography: {
    h1Size: '20px',
    h2Size: '18px',
    h3Size: '16px',
    bodySize: '15px',
    lineHeight: 1.8,
    paragraphGap: '12px',
    headingColor: '#1a1a1a',
    bodyColor: '#444444',
    blockquoteBorder: '#056de8',
    blockquoteBg: '#f0f6ff',
    codeSize: '13px',
    codeBg: '#f6f8fa',
    imageRadius: '4px',
    listStyle: 'decimal',
  },
  extraStyles: {
    'img': 'max-width: 100%; border-radius: 4px; margin: 16px 0;',
    'table': 'width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;',
    'th': 'background: #f6f8fa; padding: 8px 12px; border: 1px solid #d0d7de; font-weight: 600;',
    'td': 'padding: 8px 12px; border: 1px solid #d0d7de;',
    'a': 'color: #056de8;',
    'hr': 'border: none; border-top: 1px solid #d0d7de; margin: 20px 0;',
  },
  transforms: {
    autoTags: false,
    addReadMore: false,
    maxContentLength: 50000,
  },
}

const BILIBILI_LAYOUT: PlatformLayoutConfig = {
  id: 'bilibili',
  name: 'B站',
  typography: {
    h1Size: '17px',
    h2Size: '15px',
    h3Size: '14px',
    bodySize: '13px',
    lineHeight: 1.7,
    paragraphGap: '8px',
    headingColor: '#222222',
    bodyColor: '#555555',
    blockquoteBorder: '#fb7299',
    blockquoteBg: '#fff5f7',
    codeSize: '12px',
    codeBg: '#f5f5f5',
    imageRadius: '4px',
    listStyle: 'disc',
  },
  extraStyles: {
    'img': 'max-width: 100%; border-radius: 4px; margin: 8px 0;',
    'hr': 'border: none; border-top: 1px solid #eee; margin: 16px 0;',
  },
  transforms: {
    autoTags: false,
    addReadMore: false,
    maxContentLength: 5000,
  },
}

const TWITTER_LAYOUT: PlatformLayoutConfig = {
  id: 'twitter',
  name: 'Twitter',
  typography: {
    h1Size: '18px',
    h2Size: '16px',
    h3Size: '15px',
    bodySize: '15px',
    lineHeight: 1.6,
    paragraphGap: '8px',
    headingColor: '#0f1419',
    bodyColor: '#0f1419',
    blockquoteBorder: '#1d9bf0',
    blockquoteBg: '#f7f9fc',
    codeSize: '13px',
    codeBg: '#f7f9fc',
    imageRadius: '16px',
    listStyle: 'disc',
  },
  extraStyles: {
    'img': 'border-radius: 16px; margin: 12px 0;',
    'a': 'color: #1d9bf0;',
    'hr': 'border: none; border-top: 1px solid #eff3f4; margin: 16px 0;',
  },
  transforms: {
    autoTags: false,
    addReadMore: false,
    maxContentLength: 280,
  },
}

const WEB_LAYOUT: PlatformLayoutConfig = {
  id: 'web',
  name: '网页',
  typography: {
    h1Size: '24px',
    h2Size: '20px',
    h3Size: '18px',
    bodySize: '16px',
    lineHeight: 1.75,
    paragraphGap: '16px',
    headingColor: '#1a1a1a',
    bodyColor: '#374151',
    blockquoteBorder: '#6366f1',
    blockquoteBg: '#f5f3ff',
    codeSize: '14px',
    codeBg: '#f3f4f6',
    imageRadius: '8px',
    listStyle: 'disc',
  },
  extraStyles: {
    'img': 'max-width: 100%; border-radius: 8px; margin: 24px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);',
    'table': 'width: 100%; border-collapse: collapse; font-size: 14px; margin: 24px 0;',
    'th': 'background: #f9fafb; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;',
    'td': 'padding: 10px 16px; border: 1px solid #e5e7eb;',
    'a': 'color: #6366f1;',
    'hr': 'border: none; height: 1px; background: #e5e7eb; margin: 32px 0;',
  },
  transforms: {
    autoTags: false,
    addReadMore: false,
    maxContentLength: 100000,
  },
}

// ── 配置注册表 ──

const LAYOUT_REGISTRY: Record<LayoutPlatform, PlatformLayoutConfig> = {
  wechat: WECHAT_LAYOUT,
  xiaohongshu: XIAOHONGSHU_LAYOUT,
  zhihu: ZHIHU_LAYOUT,
  bilibili: BILIBILI_LAYOUT,
  twitter: TWITTER_LAYOUT,
  web: WEB_LAYOUT,
}

export function getLayoutConfig(platform: LayoutPlatform): PlatformLayoutConfig {
  return LAYOUT_REGISTRY[platform]
}

// ── CSS 生成器 ──

export function generatePlatformCSS(platform: LayoutPlatform): string {
  const config = getLayoutConfig(platform)
  const t = config.typography
  const extra = config.extraStyles

  let css = `
/* ── ${config.name} 排版规则 ── */
.preview-content {
  font-size: ${t.bodySize};
  line-height: ${t.lineHeight};
  color: ${t.bodyColor};
  word-break: break-word;
}
.preview-content h1 {
  font-size: ${t.h1Size};
  font-weight: 700;
  color: ${t.headingColor};
  margin: 24px 0 12px;
  line-height: 1.4;
}
.preview-content h2 {
  font-size: ${t.h2Size};
  font-weight: 600;
  color: ${t.headingColor};
  margin: 20px 0 10px;
  line-height: 1.4;
}
.preview-content h3 {
  font-size: ${t.h3Size};
  font-weight: 600;
  color: ${t.headingColor};
  margin: 16px 0 8px;
}
.preview-content p {
  margin: ${t.paragraphGap} 0;
  line-height: ${t.lineHeight};
}
.preview-content blockquote {
  border-left: 3px solid ${t.blockquoteBorder};
  background: ${t.blockquoteBg};
  padding: 10px 16px;
  margin: 16px 0;
  border-radius: 0 6px 6px 0;
  color: ${t.bodyColor};
}
.preview-content code {
  font-size: ${t.codeSize};
  background: ${t.codeBg};
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.preview-content pre {
  background: ${t.codeBg};
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: ${t.codeSize};
  line-height: 1.6;
  margin: 16px 0;
}
.preview-content pre code {
  background: transparent;
  padding: 0;
}
.preview-content img {
  ${extra['img'] || 'max-width: 100%;'}
}
.preview-content ul, .preview-content ol {
  padding-left: 24px;
  margin: 12px 0;
}
.preview-content li {
  margin: 4px 0;
  list-style-type: ${t.listStyle};
}
.preview-content a {
  ${extra['a'] || 'color: #2563eb; text-decoration: underline;'}
}
.preview-content table {
  ${extra['table'] || ''}
}
.preview-content hr {
  ${extra['hr'] || 'border: none; border-top: 1px solid #eee; margin: 20px 0;'}
}
`

  // 23号修复：extraStyles 中未被上方固定规则消费的选择器（th/td/strong 等）原先静默丢失——
  // 统一追加为 .preview-content 下的规则
  const consumed = new Set(['img', 'a', 'table', 'hr'])
  for (const [selector, style] of Object.entries(extra)) {
    if (consumed.has(selector) || !style) continue
    css += `\n.preview-content ${selector} {\n  ${style}\n}`
  }
  return css.trim()
}

// ── HTML 内容转换器 ──

export interface TransformOptions {
  /** 是否追加阅读原文区（缺省用平台配置） */
  addReadMore?: boolean
  /** 是否添加标签 */
  addTags?: boolean
  /** 自定义标签列表 */
  tags?: string[]
  /** 是否添加CTA */
  addCTA?: boolean
  /** CTA 文本 */
  ctaText?: string
  /** 阅读更多文本 */
  readMoreText?: string
  /** 标题 */
  title?: string
}

/**
 * 根据平台转换 HTML 内容：添加平台特定的包装结构
 */
export function transformContent(
  platform: LayoutPlatform,
  contentHtml: string,
  options?: TransformOptions
): string {
  const config = getLayoutConfig(platform)
  const t = config.transforms
  const opts = {
    addTags: options?.addTags ?? t.autoTags ?? false,
    tags: options?.tags ?? t.tagsTemplate ?? [],
    addCTA: options?.addCTA ?? t.addCTA ?? false,
    ctaText: options?.ctaText ?? t.ctaText ?? '',
    readMoreText: options?.readMoreText ?? t.readMoreText ?? '',
    title: options?.title ?? '',
  }

  // 截断内容
  let html = contentHtml
  if (t.maxContentLength && html.length > t.maxContentLength) {
    html = html.slice(0, t.maxContentLength) + '...'
  }

  // 包装内容
  let result = `<div class="preview-content">${html}</div>`

  // 添加标签
  if (opts.addTags && opts.tags.length > 0) {
    const tags = opts.tags.map(tag =>
      `<span class="platform-tag">${tag}</span>`
    ).join(' ')
    result += `<div class="tags-section" style="padding: 12px 0; display: flex; gap: 8px; flex-wrap: wrap;">${tags}</div>`
  }

  // 24号修复：addReadMore 原为死开关（配置存在但从不读取）——现独立生效
  const addReadMore = options?.addReadMore ?? t.addReadMore ?? false
  if (addReadMore && opts.readMoreText && !(opts.addCTA && opts.ctaText)) {
    result += `<div class="readmore-section" style="text-align: center; padding: 16px 0; border-top: 1px solid #eee; margin-top: 12px;">
      <p style="margin: 0; font-size: 13px; color: #999;">${opts.readMoreText}</p>
    </div>`
  }

  // 添加CTA
  if (opts.addCTA && opts.ctaText) {
    result += `<div class="cta-section" style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; margin-top: 16px;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #999;">${opts.readMoreText}</p>
      <p style="margin: 0; font-size: 12px; color: #999;">${opts.ctaText}</p>
    </div>`
  }

  return result
}

/**
 * 一键适配：生成平台特定的完整预览 HTML
 * 包含 CSS + 转换后的内容
 */
export function adaptForPlatform(
  platform: LayoutPlatform,
  contentHtml: string,
  title?: string,
  options?: TransformOptions
): { css: string; html: string } {
  const css = generatePlatformCSS(platform)
  const html = transformContent(platform, contentHtml, { ...options, title })
  return { css, html }
}