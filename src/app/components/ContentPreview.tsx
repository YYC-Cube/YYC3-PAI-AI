/**
 * @file ContentPreview.tsx
 * @description Phase 2.4: 多平台内容预览 — 模拟各平台展示效果
 * 支持微信/小红书/知乎/B站等平台风格预览
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status active
 * @tags [self-media],[preview],[phase2]
 */

'use client'

import {
  Eye,
  FileText,
  Globe,
  Image,
  MessageSquare,
  Monitor,
  Play,
  Send,
  Share2,
  Smartphone,
  Tablet,
  ThumbsUp,
  X
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelfMediaStore } from '../store/self-media-store'
import { BLUR, Z_INDEX, useThemeStore } from '../store/theme-store'
import type { LayoutPlatform } from '../utils/layout-engine'
import { getLayoutConfig } from '../utils/layout-engine'

// ── Types ──

export interface ContentPreviewProps {
  visible: boolean
  onClose: () => void
  /** 要预览的内容（Markdown 或 HTML） */
  content?: string
  /** 内容标题 */
  title?: string
  /** 初始平台 */
  initialPlatform?: PreviewPlatform
}

export type PreviewPlatform = LayoutPlatform

export interface PlatformConfig {
  id: PreviewPlatform
  name: string
  icon: typeof FileText
  color: string
  /** 模拟设备宽度 */
  deviceWidth: number
  /** 背景色 */
  bgColor: string
  /** 卡片背景 */
  cardBg: string
  /** 字体 */
  fontFamily: string
  /** 标题颜色 */
  titleColor: string
  /** 正文颜色 */
  textColor: string
}

// ── Constants ──

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'wechat', name: '公众号', icon: FileText, color: '#07c160',
    deviceWidth: 400, bgColor: '#f7f7f7', cardBg: '#ffffff',
    fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
    titleColor: '#333333', textColor: '#555555',
  },
  {
    id: 'xiaohongshu', name: '小红书', icon: Image, color: '#ff2442',
    deviceWidth: 380, bgColor: '#f5f5f5', cardBg: '#ffffff',
    fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
    titleColor: '#222222', textColor: '#444444',
  },
  {
    id: 'zhihu', name: '知乎', icon: Globe, color: '#056de8',
    deviceWidth: 420, bgColor: '#f5f5f5', cardBg: '#ffffff',
    fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
    titleColor: '#1a1a1a', textColor: '#444444',
  },
  {
    id: 'bilibili', name: 'B站', icon: Play, color: '#fb7299',
    deviceWidth: 400, bgColor: '#f5f5f5', cardBg: '#ffffff',
    fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
    titleColor: '#222222', textColor: '#555555',
  },
  {
    id: 'twitter', name: 'Twitter', icon: MessageSquare, color: '#1d9bf0',
    deviceWidth: 380, bgColor: '#ffffff', cardBg: '#ffffff',
    fontFamily: '-apple-system, "Segoe UI", "Helvetica Neue", sans-serif',
    titleColor: '#0f1419', textColor: '#0f1419',
  },
  {
    id: 'web', name: '网页', icon: Globe, color: '#6366f1',
    deviceWidth: 640, bgColor: '#f5f5f5', cardBg: '#ffffff',
    fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
    titleColor: '#1a1a1a', textColor: '#374151',
  },
]

// ── Helpers ──

function renderMarkdownToHTML(content: string): string {
  // Simple markdown to HTML conversion for preview
  let html = content
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;margin:20px 0 10px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:24px 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-size:0.9em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #ddd;padding:8px 12px;margin:12px 0;color:#666;background:#f9fafb">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0" />')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin:12px 0;line-height:1.8">')
    .replace(/\n/g, '<br/>')

  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p style="margin:12px 0;line-height:1.8">' + html + '</p>'
  }

  // Security: sanitize before any dangerouslySetInnerHTML use —
  // 内容来自 AI 输出与用户粘贴，属不可信输入（P0 修复，同 LivePreview 范式）
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'hr', 'img', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}

function getCurrentDate(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// ── Platform Preview Renderers ──

function WeChatPreview({ title, contentHtml }: { title?: string; contentHtml: string }) {
  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: '1.4', color: '#333', margin: '0 0 12px' }}>
          {title || '文章标题'}
        </h1>
        <div style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ color: '#07c160', fontWeight: 600 }}>YYC³ 创作引擎</span>
          <span>·</span>
          <span>{getCurrentDate()}</span>
        </div>
      </div>
      {/* Divider */}
      <div style={{ height: '1px', background: '#eee', margin: '16px 20px' }} />
      {/* Content */}
      <div className="preview-content" style={{ padding: '0 20px 30px', fontSize: '15px', color: '#555', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: contentHtml }} />
      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #eee', fontSize: '13px', color: '#07c160' }}>
        <p style={{ margin: '0 0 4px' }}>👇 觉得不错？点个「在看」分享给朋友</p>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>关注 YYC³ 获取更多内容</p>
      </div>
    </div>
  )
}

function XiaohongshuPreview({ title, contentHtml }: { title?: string; contentHtml: string }) {
  return (
    <div style={{ padding: '0' }}>
      {/* Cover image placeholder */}
      <div style={{
        height: '200px',
        background: 'linear-gradient(135deg, #ff2442, #ff6b81)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '24px',
        fontWeight: 700,
      }}>
        {title || '封面标题'}
      </div>
      {/* Info bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff2442, #ff6b81)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '12px', fontWeight: 600,
        }}>
          Y
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#222', margin: 0 }}>YYC³ 创作引擎</p>
          <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0' }}>{getCurrentDate()}</p>
        </div>
      </div>
      {/* Content */}
      <div className="preview-content" style={{ padding: '8px 16px 20px', fontSize: '14px', color: '#444', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: contentHtml }} />
      {/* Tags */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['#自媒体', '#创作', '#内容营销', '#AI写作'].map(tag => (
          <span key={tag} style={{ fontSize: '12px', color: '#ff2442' }}>{tag}</span>
        ))}
      </div>
      {/* Interaction bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #eee', padding: '10px 16px', justifyContent: 'space-around' }}>
        {[
          { icon: ThumbsUp, label: '1.2k' },
          { icon: MessageSquare, label: '89' },
          { icon: Share2, label: '分享' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#999' }}>
              <Icon size={16} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ZhihuPreview({ title, contentHtml }: { title?: string; contentHtml: string }) {
  return (
    <div style={{ padding: '0' }}>
      {/* Title */}
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, lineHeight: '1.4', color: '#1a1a1a', margin: '0 0 8px' }}>
          {title || '如何创作高质量的自媒体内容？'}
        </h1>
        <div style={{ fontSize: '13px', color: '#999', display: 'flex', gap: '12px' }}>
          <span>YYC³ 创作引擎</span>
          <span>{getCurrentDate()}</span>
        </div>
      </div>
      {/* Content */}
      <div className="preview-content" style={{ padding: '16px 20px 20px', fontSize: '15px', color: '#444', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: contentHtml }} />
      {/* Actions */}
      <div style={{ display: 'flex', gap: '20px', padding: '12px 20px', borderTop: '1px solid #eee', fontSize: '13px', color: '#8590a6' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={16} /> 赞同 256</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={16} /> 评论 32</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={16} /> 分享</span>
      </div>
    </div>
  )
}

function BilibiliPreview({ title, contentHtml }: { title?: string; contentHtml: string }) {
  return (
    <div style={{ padding: '0' }}>
      {/* Video placeholder */}
      <div style={{
        height: '200px',
        background: 'linear-gradient(135deg, #fb7299, #fc8bab)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        position: 'relative',
      }}>
        <Play size={48} style={{ opacity: 0.8 }} />
        <span style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>视频封面区域</span>
        <span style={{
          position: 'absolute', bottom: '10px', right: '10px',
          background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px',
          fontSize: '11px',
        }}>
          12:34
        </span>
      </div>
      {/* Title */}
      <div style={{ padding: '12px 16px' }}>
        <h1 style={{ fontSize: '15px', fontWeight: 600, lineHeight: '1.4', color: '#222', margin: '0 0 8px' }}>
          {title || '视频标题'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#999' }}>
          <span style={{ color: '#fb7299', fontWeight: 600 }}>YYC³ 创作引擎</span>
          <span>|</span>
          <span>10.5万播放</span>
          <span>|</span>
          <span>{getCurrentDate()}</span>
        </div>
      </div>
      {/* Description */}
      <div className="preview-content" style={{ padding: '0 16px 16px', fontSize: '13px', color: '#555', lineHeight: '1.7' }}
        dangerouslySetInnerHTML={{ __html: contentHtml.slice(0, 300) }} />
      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderTop: '1px solid #eee', fontSize: '12px', color: '#999' }}>
        <span>👍 2.3万</span>
        <span>💬 1567</span>
        <span>⭐ 8921</span>
        <span>🔗 转发 432</span>
      </div>
    </div>
  )
}

function TwitterPreview({ title, contentHtml }: { title?: string; contentHtml: string }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d9bf0, #1a8cd8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '16px', fontWeight: 700,
        }}>
          Y
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f1419', margin: 0 }}>YYC³</p>
          <p style={{ fontSize: '13px', color: '#536471', margin: 0 }}>@yyc3_engine · {getCurrentDate()}</p>
        </div>
      </div>
      {/* Content */}
      <div className="preview-content" style={{ fontSize: '15px', color: '#0f1419', lineHeight: '1.6', marginBottom: '8px' }}>
        {title && <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{title}</p>}
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#536471', padding: '8px 0', borderTop: '1px solid #eee' }}>
        <span>💬 45</span>
        <span>🔁 128</span>
        <span>❤️ 892</span>
        <span>🔗 32</span>
      </div>
    </div>
  )
}

function WebPreview({ title, contentHtml }: { title?: string; contentHtml: string }) {
  return (
    <div style={{ padding: '0', maxWidth: '640px', margin: '0 auto' }}>
      {/* Article header */}
      <div style={{ padding: '32px 32px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: '1.3', color: '#1a1a1a', margin: '0 0 12px' }}>
          {title || '文章标题'}
        </h1>
        <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span>YYC³ 创作引擎</span>
          <span>·</span>
          <span>{getCurrentDate()}</span>
          <span>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> 阅读 2.3k</span>
        </div>
      </div>
      {/* Featured image placeholder */}
      <div style={{
        margin: '24px 32px',
        height: '200px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '14px', opacity: 0.8,
      }}>
        封面图片
      </div>
      {/* Content */}
      <div className="preview-content" style={{ padding: '0 32px 40px', fontSize: '17px', color: '#374151', lineHeight: '1.8', maxWidth: '100%' }}
        dangerouslySetInnerHTML={{ __html: contentHtml }} />
      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px 32px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6b7280' }}>
            <ThumbsUp size={16} /> 256
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6b7280' }}>
            <MessageSquare size={16} /> 32
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Twitter', '微信', '知乎'].map(p => (
            <span key={p} style={{ fontSize: '12px', color: '#6366f1', cursor: 'pointer' }}>分享到 {p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──

export function ContentPreview({ visible, onClose, content, title, initialPlatform }: ContentPreviewProps) {
  const { tokens } = useThemeStore()
  const { panelActions } = useSelfMediaStore()
  const [platform, setPlatform] = useState<PreviewPlatform>(initialPlatform || 'wechat')
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [sampleText, setSampleText] = useState(() => content || '')

  // 响应 content prop 变化（跨面板传入时更新）
  useEffect(() => {
    if (content !== undefined) {
      setSampleText(content)
    }
  }, [content])

  const currentPlatform = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0]

  const contentHtml = useMemo(() => {
    if (!sampleText) {
      return '<p style="color:#999">在此输入内容以预览各平台展示效果。支持 Markdown 格式：**粗体** *斜体* `代码` [链接](url)</p>'
    }
    return renderMarkdownToHTML(sampleText)
  }, [sampleText])

  // ── Layout Engine Integration ──
  const platformCSS = useMemo(() => {
    const config = getLayoutConfig(platform)
    if (!config) return ''
    const t = config.typography
    const extra = config.extraStyles
    const css = `
/* ${config.name} 排版规则 */
.preview-content {
  font-size: ${t.bodySize}; line-height: ${t.lineHeight}; color: ${t.bodyColor}; word-break: break-word;
}
.preview-content h1 { font-size: ${t.h1Size}; font-weight: 700; color: ${t.headingColor}; margin: 24px 0 12px; line-height: 1.4; }
.preview-content h2 { font-size: ${t.h2Size}; font-weight: 600; color: ${t.headingColor}; margin: 20px 0 10px; line-height: 1.4; }
.preview-content h3 { font-size: ${t.h3Size}; font-weight: 600; color: ${t.headingColor}; margin: 16px 0 8px; }
.preview-content p { margin: ${t.paragraphGap} 0; line-height: ${t.lineHeight}; }
.preview-content blockquote { border-left: 3px solid ${t.blockquoteBorder}; background: ${t.blockquoteBg}; padding: 10px 16px; margin: 16px 0; border-radius: 0 6px 6px 0; color: ${t.bodyColor}; }
.preview-content code { font-size: ${t.codeSize}; background: ${t.codeBg}; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono','Fira Code',monospace; }
.preview-content pre { background: ${t.codeBg}; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: ${t.codeSize}; margin: 16px 0; }
.preview-content pre code { background: transparent; padding: 0; }
.preview-content img { ${extra['img'] || 'max-width: 100%;'} }
.preview-content ul, .preview-content ol { padding-left: 24px; margin: 12px 0; }
.preview-content li { margin: 4px 0; }
.preview-content a { ${extra['a'] || 'color: #2563eb; text-decoration: underline;'} }
.preview-content table { ${extra['table'] || ''} }
.preview-content hr { border: none; ${extra['hr'] || 'border-top: 1px solid #eee;'} margin: 20px 0; }`
    return css
  }, [platform])

  const deviceWidth = useMemo(() => {
    if (deviceMode === 'mobile') return currentPlatform.deviceWidth
    if (deviceMode === 'tablet') return 600
    return 800
  }, [deviceMode, currentPlatform.deviceWidth])

  const renderPreview = useCallback(() => {
    const props = { title, contentHtml }
    switch (platform) {
      case 'wechat': return <WeChatPreview {...props} />
      case 'xiaohongshu': return <XiaohongshuPreview {...props} />
      case 'zhihu': return <ZhihuPreview {...props} />
      case 'bilibili': return <BilibiliPreview {...props} />
      case 'twitter': return <TwitterPreview {...props} />
      case 'web': return <WebPreview {...props} />
      default: return <WeChatPreview {...props} />
    }
  }, [platform, title, contentHtml])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tokens.overlayBg,
          backdropFilter: BLUR.lg,
          WebkitBackdropFilter: BLUR.lg,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '900px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          background: tokens.panelBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${tokens.shadow}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} style={{ color: tokens.primary }} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: tokens.fontDisplay }}>
              内容预览
            </span>
            <span style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
              模拟各平台展示效果
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setDeviceMode('mobile')}
              style={{
                padding: '6px',
                background: deviceMode === 'mobile' ? tokens.primaryDim : 'transparent',
                border: `1px solid ${tokens.border}`,
                borderRadius: '6px',
                color: deviceMode === 'mobile' ? tokens.primary : tokens.foregroundMuted,
                cursor: 'pointer',
              }}
              title="手机视图"
            >
              <Smartphone size={14} />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              style={{
                padding: '6px',
                background: deviceMode === 'tablet' ? tokens.primaryDim : 'transparent',
                border: `1px solid ${tokens.border}`,
                borderRadius: '6px',
                color: deviceMode === 'tablet' ? tokens.primary : tokens.foregroundMuted,
                cursor: 'pointer',
              }}
              title="平板视图"
            >
              <Tablet size={14} />
            </button>
            <button
              onClick={() => setDeviceMode('desktop')}
              style={{
                padding: '6px',
                background: deviceMode === 'desktop' ? tokens.primaryDim : 'transparent',
                border: `1px solid ${tokens.border}`,
                borderRadius: '6px',
                color: deviceMode === 'desktop' ? tokens.primary : tokens.foregroundMuted,
                cursor: 'pointer',
              }}
              title="桌面视图"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => {
                panelActions?.openPublishQueue({ content: contentHtml, title: title || undefined })
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: tokens.primary,
                border: 'none',
                borderRadius: '6px',
                color: tokens.primaryForeground,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title="多平台发布"
            >
              <Send size={12} />
              发布
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Platform Tabs + Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Platform sidebar */}
          <div
            style={{
              width: '140px',
              borderRight: `1px solid ${tokens.border}`,
              padding: '12px 0',
              flexShrink: 0,
            }}
          >
            <div style={{ padding: '0 12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: tokens.foregroundMuted, fontWeight: 600 }}>选择平台</span>
            </div>
            {PLATFORMS.map(p => {
              const Icon = p.icon
              const isActive = platform === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: isActive ? p.color + '20' : 'transparent',
                    border: 'none',
                    borderRight: isActive ? `2px solid ${p.color}` : '2px solid transparent',
                    color: isActive ? p.color : tokens.foreground,
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={14} />
                  <span>{p.name}</span>
                </button>
              )
            })}
          </div>

          {/* Preview area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Device frame */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', background: tokens.backgroundAlt }}>
              <div
                style={{
                  width: `${deviceWidth}px`,
                  maxWidth: '100%',
                  background: currentPlatform.bgColor,
                  borderRadius: '12px',
                  boxShadow: `0 4px 24px ${tokens.shadow}`,
                  overflow: 'hidden',
                  alignSelf: 'flex-start',
                }}
              >
                {/* Platform header bar */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${currentPlatform.bgColor === '#ffffff' ? '#eee' : '#e0e0e0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: currentPlatform.textColor,
                    opacity: 0.7,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{currentPlatform.name}</span>
                  <span>{getCurrentDate()}</span>
                </div>
                {/* Content */}
                <div style={{ fontFamily: currentPlatform.fontFamily, color: currentPlatform.textColor }}>
                  <style>{platformCSS}</style>
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
