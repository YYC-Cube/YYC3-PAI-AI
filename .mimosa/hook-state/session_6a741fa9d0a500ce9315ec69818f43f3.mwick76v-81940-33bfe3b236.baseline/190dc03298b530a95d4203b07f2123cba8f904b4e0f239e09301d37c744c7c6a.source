/**
 * @file ContentTemplatePanel.tsx
 * @description Phase 2.1: 内容模板系统 — 各平台预设模板选择与快速应用
 * 直接服用: D-Music-105 AIAssistant 双模式架构模式 + yyc3-karbon-platform Dashboard 面板布局
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status active
 * @tags [self-media],[content-template],[phase2]
 */

'use client'

import {
  BookOpen, Check, ChevronRight, Copy, FileText, Globe, Hash, Image, Layout, Play, Plus, Sparkles, Trash2, X
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSelfMediaStore } from '../store/self-media-store'
import { BLUR, useThemeStore } from '../store/theme-store'

// ===== Types =====

export interface ContentTemplate {
  id: string
  name: string
  description: string
  platform: string
  icon: typeof FileText
  color: string
  sections: ContentSection[]
  variables: string[]
}

export interface ContentSection {
  id: string
  title: string
  type: 'heading' | 'paragraph' | 'image' | 'list' | 'quote' | 'code'
  placeholder: string
  required: boolean
}

export interface ContentTemplatePanelProps {
  visible: boolean
  onClose: () => void
  onApplyTemplate?: (template: ContentTemplate) => void
}

// ===== Template Definitions =====
// 系统预设模板
const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'wechat',
    name: '公众号文章',
    description: '标题 + 摘要 + 多级正文分段 + 引导关注',
    platform: '微信',
    icon: FileText,
    color: '#07c160',
    sections: [
      { id: 'title', title: '文章标题', type: 'heading', placeholder: '输入吸引眼球的标题...', required: true },
      { id: 'summary', title: '摘要', type: 'paragraph', placeholder: '简短摘要显示在卡片上...', required: false },
      { id: 'opening', title: '开头引言', type: 'paragraph', placeholder: '开篇引入，点明主题...', required: true },
      { id: 'body-1', title: '正文第一段', type: 'paragraph', placeholder: '核心内容展开...', required: true },
      { id: 'image-1', title: '配图区域', type: 'image', placeholder: '插入相关图片', required: false },
      { id: 'body-2', title: '正文第二段', type: 'paragraph', placeholder: '深入分析或案例...', required: true },
      { id: 'closing', title: '结尾总结', type: 'paragraph', placeholder: '总结观点 + 引导互动...', required: true },
      { id: 'cta', title: '引导关注', type: 'quote', placeholder: '关注公众号 + 在看 + 转发...', required: false },
    ],
    variables: ['{{title}}', '{{author}}', '{{date}}', '{{wechat_id}}'],
  },
  {
    id: 'xiaohongshu',
    name: '小红书笔记',
    description: '封面标题 + 多图轮播 + 正文 + 话题标签',
    platform: '小红书',
    icon: Image,
    color: '#ff2442',
    sections: [
      { id: 'cover', title: '封面标题', type: 'heading', placeholder: '封面上的大字标题...', required: true },
      { id: 'body', title: '正文内容', type: 'paragraph', placeholder: '简练有力的笔记正文...', required: true },
      { id: 'list', title: '要点清单', type: 'list', placeholder: '分点列出核心信息...', required: false },
      { id: 'tips', title: '小贴士', type: 'quote', placeholder: '实用建议或注意事项...', required: false },
      { id: 'tags', title: '话题标签', type: 'paragraph', placeholder: '#标签1 #标签2 #标签3', required: true },
    ],
    variables: ['{{title}}', '{{date}}', '{{tags}}'],
  },
  {
    id: 'zhihu',
    name: '知乎回答/文章',
    description: '问题引入 + 结构化正文 + 参考文献',
    platform: '知乎',
    icon: BookOpen,
    color: '#0084ff',
    sections: [
      { id: 'question', title: '问题/引言', type: 'quote', placeholder: '引用问题或提出议题...', required: true },
      { id: 'intro', title: '开场陈述', type: 'paragraph', placeholder: '直接给出核心观点...', required: true },
      { id: 'body-1', title: '分析论证', type: 'paragraph', placeholder: '展开论证，引用数据...', required: true },
      { id: 'body-2', title: '深入探讨', type: 'paragraph', placeholder: '多角度分析...', required: false },
      { id: 'code', title: '代码/示例', type: 'code', placeholder: '插入代码或数据示例', required: false },
      { id: 'conclusion', title: '结论', type: 'paragraph', placeholder: '总结观点 + 升华...', required: true },
      { id: 'references', title: '参考文献', type: 'list', placeholder: '引用来源列表...', required: false },
    ],
    variables: ['{{title}}', '{{author}}', '{{date}}', '{{question_link}}'],
  },
  {
    id: 'bilibili',
    name: 'B站专栏/脚本',
    description: '封面 + 分镜脚本 + 台词 + 拍摄说明',
    platform: 'B站',
    icon: Play,
    color: '#fb7299',
    sections: [
      { id: 'title', title: '视频标题', type: 'heading', placeholder: '吸引点击的标题...', required: true },
      { id: 'hook', title: '黄金开头', type: 'paragraph', placeholder: '前5秒抓住观众...', required: true },
      { id: 'outline', title: '内容大纲', type: 'list', placeholder: '视频分段大纲...', required: true },
      { id: 'script', title: '完整脚本', type: 'paragraph', placeholder: '逐段台词+画面描述...', required: true },
      { id: 'cta', title: '结尾引导', type: 'paragraph', placeholder: '点赞投币收藏关注...', required: false },
    ],
    variables: ['{{title}}', '{{date}}', '{{duration}}'],
  },
  {
    id: 'video-script',
    name: '视频脚本',
    description: '专业分镜表格 + 时长控制 + 拍摄备注',
    platform: '通用',
    icon: Play,
    color: '#8f00e6',
    sections: [
      { id: 'title', title: '作品名称', type: 'heading', placeholder: '视频作品名称...', required: true },
      { id: 'overview', title: '内容概述', type: 'paragraph', placeholder: '视频整体内容描述...', required: true },
      { id: 'scene-list', title: '分镜列表', type: 'list', placeholder: '场景1: 描述/时长/台词...', required: true },
      { id: 'notes', title: '拍摄备注', type: 'paragraph', placeholder: '设备、灯光、音效等要求...', required: false },
    ],
    variables: ['{{title}}', '{{author}}', '{{date}}', '{{duration}}'],
  },
  {
    id: 'multi-platform',
    name: '多平台同步',
    description: '一次创作，自动适配公众号/知乎/小红书格式',
    platform: '全平台',
    icon: Globe,
    color: '#00f0ff',
    sections: [
      { id: 'master', title: '主内容', type: 'paragraph', placeholder: '完整的核心内容...', required: true },
      { id: 'wechat-v', title: '公众号版本', type: 'paragraph', placeholder: '适配公众号的版本调整...', required: false },
      { id: 'zhihu-v', title: '知乎版本', type: 'paragraph', placeholder: '适配知乎的长文调整...', required: false },
      { id: 'xhs-v', title: '小红书版本', type: 'paragraph', placeholder: '适配小红书的精简版本...', required: false },
      { id: 'tags-global', title: '全平台标签', type: 'paragraph', placeholder: '各平台话题标签...', required: false },
    ],
    variables: ['{{title}}', '{{author}}', '{{date}}', '{{tags}}'],
  },
]

// ===== Component =====

export function ContentTemplatePanel({ visible, onClose, onApplyTemplate }: ContentTemplatePanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { applyTemplate } = useSelfMediaStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userTemplates, setUserTemplates] = useState<ContentTemplate[]>(() => {
    try {
      const raw = localStorage.getItem('yyc3_user_templates')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  const allTemplates = useMemo(() => [...CONTENT_TEMPLATES, ...userTemplates], [userTemplates])

  const saveUserTemplates = useCallback((updated: ContentTemplate[]) => {
    setUserTemplates(updated)
    try { localStorage.setItem('yyc3_user_templates', JSON.stringify(updated)) } catch { /* */ }
  }, [])

  const filtered = searchQuery
    ? allTemplates.filter(t =>
      t.name.includes(searchQuery) || t.platform.includes(searchQuery) ||
      t.description.includes(searchQuery)
    )
    : allTemplates

  const handleApply = useCallback((template: ContentTemplate) => {
    // 应用模板到AI写作面板（触发全链路联动）
    applyTemplate(template)
    onApplyTemplate?.(template)
    onClose()
  }, [applyTemplate, onApplyTemplate, onClose])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* silent */ }
  }, [])

  const handleDeleteUserTemplate = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    saveUserTemplates(userTemplates.filter(t => t.id !== id))
  }, [userTemplates, saveUserTemplates])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: isCyberpunk ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
        backdropFilter: BLUR.md,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col"
        style={{
          width: '85vw',
          maxWidth: '1000px',
          height: '80vh',
          borderRadius: '12px',
          border: `1px solid ${tk.borderDim}`,
          background: tk.background,
          boxShadow: `0 24px 80px ${isCyberpunk ? 'rgba(0,240,255,0.08)' : 'rgba(0,0,0,0.2)'}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${tk.borderDim}`,
            background: isCyberpunk ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            <Layout size={16} style={{ color: tk.primary }} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.foreground, letterSpacing: '1px' }}>
              内容模板
            </span>
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
              PHASE 2.1 · 自媒体创作引擎
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                const newId = 'custom_' + Date.now().toString(36)
                const newTpl: ContentTemplate = {
                  id: newId,
                  name: '自定义模板',
                  description: '点击编辑自定义模板内容',
                  platform: '自定义',
                  icon: Layout,
                  color: tk.primary || '#6366f1',
                  sections: [
                    { id: 's1', title: '章节1', type: 'paragraph', placeholder: '输入内容...', required: true },
                  ],
                  variables: ['{{title}}', '{{author}}'],
                }
                saveUserTemplates([newTpl, ...userTemplates])
                setSelectedId(newId)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '10px',
                color: tk.primary,
                background: `${tk.primary}15`,
                border: `1px solid ${tk.primary}33`,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} />
              新建模板
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-lg transition-all hover:opacity-70"
              style={{ width: 28, height: 28, color: tk.foregroundMuted }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          className="shrink-0"
          style={{ padding: '12px 20px', borderBottom: `1px solid ${tk.borderDim}` }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模板..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${tk.borderDim}`,
              background: tk.backgroundAlt,
              color: tk.foreground,
              fontFamily: tk.fontBody,
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((template) => {
              const isSelected = selectedId === template.id
              const Icon = template.icon

              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className="rounded-xl transition-all cursor-pointer"
                  style={{
                    border: `1px solid ${isSelected ? template.color : tk.borderDim}`,
                    background: isSelected
                      ? `${template.color}08`
                      : tk.cardBg,
                    boxShadow: isSelected && isCyberpunk
                      ? `0 0 20px ${template.color}22, inset 0 0 20px ${template.color}11`
                      : 'none',
                    overflow: 'hidden',
                  }}
                >
                  {/* Platform badge */}
                  <div
                    className="flex items-center justify-between"
                    style={{
                      padding: '10px 14px',
                      borderBottom: `1px solid ${isSelected ? `${template.color}22` : tk.borderDim}`,
                      background: isCyberpunk ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: template.color }} />
                      <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.foreground }}>
                        {template.name}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        fontFamily: tk.fontMono,
                        fontSize: '9px',
                        color: template.color,
                        border: `1px solid ${template.color}44`,
                        background: `${template.color}11`,
                      }}
                    >
                      {template.platform}
                    </span>
                  </div>

                  {/* Description */}
                  <div style={{ padding: '10px 14px' }}>
                    <p style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foregroundMuted, lineHeight: 1.5, marginBottom: 8 }}>
                      {template.description}
                    </p>

                    {/* Sections preview */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.sections.map((section) => (
                        <span
                          key={section.id}
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '8px',
                            color: section.required ? tk.primary : tk.foregroundMuted,
                            background: section.required ? `${tk.primary}11` : tk.borderDim,
                            border: `1px solid ${section.required ? `${tk.primary}33` : 'transparent'}`,
                          }}
                        >
                          {section.required ? '✦ ' : ''}{section.title}
                        </span>
                      ))}
                    </div>

                    {/* Variables */}
                    {template.variables.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Hash size={10} style={{ color: tk.foregroundMuted }} />
                        {template.variables.map((v) => (
                          <button
                            key={v}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(v, v)
                            }}
                            className="px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                            style={{
                              fontFamily: tk.fontMono,
                              fontSize: '8px',
                              color: tk.foregroundMuted,
                              background: tk.borderDim,
                              border: `1px solid ${tk.borderDim}`,
                            }}
                          >
                            {copiedId === v ? '✓' : v}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApply(template)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          fontFamily: tk.fontMono,
                          fontSize: '10px',
                          color: isCyberpunk ? '#0a0a0a' : '#ffffff',
                          background: template.color,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={12} />
                        应用模板
                        <ChevronRight size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(
                            template.sections.map(s => `# ${s.title}\n${s.placeholder}\n`).join('\n'),
                            `copy-${template.id}`
                          )
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                          fontFamily: tk.fontMono,
                          fontSize: '10px',
                          color: tk.foregroundMuted,
                          background: tk.borderDim,
                          border: `1px solid ${tk.borderDim}`,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedId === `copy-${template.id}` ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === `copy-${template.id}` ? '已复制' : '复制结构'}
                      </button>

                      {/* 自定义模板删除按钮 */}
                      {template.id.startsWith('custom_') && (
                        <button
                          onClick={(e) => handleDeleteUserTemplate(e, template.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '10px',
                            color: '#ef4444',
                            background: '#ef444415',
                            border: `1px solid #ef444433`,
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '8px 20px',
            borderTop: `1px solid ${tk.borderDim}`,
            fontSize: '9px',
            color: tk.foregroundMuted,
            fontFamily: tk.fontMono,
            background: isCyberpunk ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.03)',
          }}
        >
          <span>{allTemplates.length} 个模板 {userTemplates.length > 0 && `(自定义 ${userTemplates.length})`}</span>
          <span>YYC³ · CONTENT TEMPLATE SYSTEM</span>
        </div>
      </div>
    </div>
  )
}
