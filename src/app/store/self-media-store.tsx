/**
 * @file self-media-store.tsx
 * @description 自媒体创作引擎跨面板通信层
 * 统一管理创作上下文、面板联动、事件总线
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [self-media],[store],[cross-panel]
 */

'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { WritingMode } from '../components/AIWritingPanel'
import type { ContentTemplate } from '../components/ContentTemplatePanel'

// ── Types ──

export interface PanelActions {
  /** 打开AI写作面板，可指定模式和初始主题 */
  openAIWriting: (options?: { mode?: WritingMode; topic?: string }) => void
  /** 打开素材管理器 */
  openMaterialManager: () => void
  /** 打开内容预览，可指定内容和标题 */
  openContentPreview: (options?: { content?: string; title?: string; platform?: string }) => void
  /** 打开编辑器 */
  openEditor: () => void
  /** 打开发布队列 */
  openPublishQueue: (options?: { content?: string; title?: string }) => void
  /** 打开热门话题 */
  openTrendingTopics: () => void
}

export interface SelfMediaContextType {
  /** 当前正在编辑的富文本内容 (HTML) */
  currentContent: string
  setCurrentContent: (content: string) => void

  /** 当前选中的内容模板 */
  activeTemplate: ContentTemplate | null
  /** 应用模板：设置模板并在AI写作面板填充上下文 */
  applyTemplate: (template: ContentTemplate) => void

  /** 通知AI写作面板从模板生成内容 */
  templateWritingTopic: string
  templateWritingMode: WritingMode | null
  clearTemplateTopic: () => void
  /** 直接设置待处理的AI写作主题（用于非模板触发的跨面板调用） */
  setPendingAIWritingTopic: (topic: string) => void
  setPendingAIWritingMode: (mode: WritingMode | null) => void

  /** 通知内容预览面板显示 */
  pendingPreviewContent: string | null
  pendingPreviewTitle: string | null
  pendingPreviewPlatform: string | null
  setPendingPreviewContent: (content: string | null) => void
  setPendingPreviewTitle: (title: string | null) => void
  setPendingPreviewPlatform: (platform: string | null) => void

  /** 待发布内容（任意面板→发布队列） */
  pendingPublishContent: string | null
  pendingPublishTitle: string | null
  setPendingPublish: (content: string | null, title?: string | null) => void

  /** 素材管理器→编辑器 插入回调 */
  insertCallback: ((content: string) => void) | null
  setInsertCallback: (cb: ((content: string) => void) | null) => void

  /** AI写作结果→编辑器 插入 */
  writingInsertCallback: ((content: string) => void) | null
  setWritingInsertCallback: (cb: ((content: string) => void) | null) => void

  /** 面板操作句柄（由App.tsx注入） */
  panelActions: PanelActions | null
  setPanelActions: (actions: PanelActions) => void

  /** 当前会话所有平台适配状态 */
  platformAdaptations: Record<string, string>
  addPlatformAdaptation: (platform: string, content: string) => void
  clearAdaptations: () => void
}

// ── Context ──

const Ctx = createContext<SelfMediaContextType | null>(null)

// ── Provider ──

export function SelfMediaStoreProvider({ children }: { children: ReactNode }) {
  const [currentContent, setCurrentContent] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<ContentTemplate | null>(null)
  const [templateWritingTopic, setTemplateWritingTopic] = useState('')
  const [templateWritingMode, setTemplateWritingMode] = useState<WritingMode | null>(null)
  const [pendingPreviewContent, setPendingPreviewContent] = useState<string | null>(null)
  const [pendingPreviewTitle, setPendingPreviewTitle] = useState<string | null>(null)
  const [pendingPreviewPlatform, setPendingPreviewPlatform] = useState<string | null>(null)
  const [pendingPublishContent, setPendingPublishContent] = useState<string | null>(null)
  const [pendingPublishTitle, setPendingPublishTitle] = useState<string | null>(null)
  const [insertCallback, _setInsertCallback] = useState<((content: string) => void) | null>(null)
  const [writingInsertCallback, _setWritingInsertCallback] = useState<((content: string) => void) | null>(null)
  const [panelActions, setPanelActions] = useState<PanelActions | null>(null)
  const [platformAdaptations, setPlatformAdaptations] = useState<Record<string, string>>({})

  // 回调本身是函数：useState 直传函数参数会被 React 当作 lazy updater 调用并存其返回值
  // （生产踩雷：AIWritingPanel 传 (text)=>{...} → 实际存了 undefined）→ 包一层存"值"
  const setInsertCallback = useCallback((cb: ((content: string) => void) | null) => {
    _setInsertCallback(() => cb)
  }, [])
  const setWritingInsertCallback = useCallback((cb: ((content: string) => void) | null) => {
    _setWritingInsertCallback(() => cb)
  }, [])

  const applyTemplate = useCallback((template: ContentTemplate) => {
    setActiveTemplate(template)
    // 生成大纲写作提示
    const sectionTitles = template.sections
      .filter(s => s.required)
      .map(s => `- ${s.title}`)
      .join('\n')
    const topic = `平台：${template.platform}\n模板：${template.name}\n\n必需段落：\n${sectionTitles}\n\n请生成完整的大纲和内容方案。`
    setTemplateWritingTopic(topic)
    setTemplateWritingMode('outline')
  }, [])

  const clearTemplateTopic = useCallback(() => {
    setTemplateWritingTopic('')
    setTemplateWritingMode(null)
  }, [])

  const addPlatformAdaptation = useCallback((platform: string, content: string) => {
    setPlatformAdaptations(prev => ({ ...prev, [platform]: content }))
  }, [])

  const clearAdaptations = useCallback(() => {
    setPlatformAdaptations({})
  }, [])

  const setPendingPublish = useCallback((content: string | null, title?: string | null) => {
    setPendingPublishContent(content)
    if (title !== undefined) setPendingPublishTitle(title)
  }, [])

  const value = useMemo<SelfMediaContextType>(() => ({
    currentContent, setCurrentContent,
    activeTemplate, applyTemplate,
    templateWritingTopic, templateWritingMode, clearTemplateTopic,
    setPendingAIWritingTopic: setTemplateWritingTopic,
    setPendingAIWritingMode: setTemplateWritingMode,
    pendingPreviewContent, setPendingPreviewContent,
    pendingPreviewTitle, setPendingPreviewTitle,
    pendingPreviewPlatform, setPendingPreviewPlatform,
    pendingPublishContent, pendingPublishTitle, setPendingPublish,
    insertCallback, setInsertCallback,
    writingInsertCallback, setWritingInsertCallback,
    panelActions, setPanelActions,
    platformAdaptations, addPlatformAdaptation, clearAdaptations,
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 稳定引用/快照语义，入依赖改变重建行为
  }), [currentContent, activeTemplate, templateWritingTopic, templateWritingMode, clearTemplateTopic,
    pendingPreviewContent, pendingPreviewTitle, pendingPreviewPlatform,
    pendingPublishContent, pendingPublishTitle, setPendingPublish,
    insertCallback, writingInsertCallback, panelActions,
    platformAdaptations, addPlatformAdaptation, clearAdaptations])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// ── Hook ──

// eslint-disable-next-line react-refresh/only-export-components -- Context hook 导出（非 UI 组件）
export function useSelfMediaStore(): SelfMediaContextType {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Fallback for use outside provider (read-only, no-ops)
    return {
      currentContent: '', setCurrentContent: () => { },
      activeTemplate: null, applyTemplate: () => { },
      templateWritingTopic: '', templateWritingMode: null, clearTemplateTopic: () => { },
      setPendingAIWritingTopic: () => { }, setPendingAIWritingMode: () => { },
      pendingPreviewContent: null, setPendingPreviewContent: () => { },
      pendingPreviewTitle: null, setPendingPreviewTitle: () => { },
      pendingPreviewPlatform: null, setPendingPreviewPlatform: () => { },
      pendingPublishContent: null, pendingPublishTitle: null, setPendingPublish: () => { },
      insertCallback: null, setInsertCallback: () => { },
      writingInsertCallback: null, setWritingInsertCallback: () => { },
      panelActions: null, setPanelActions: () => { },
      platformAdaptations: {}, addPlatformAdaptation: () => { }, clearAdaptations: () => { },
    }
  }
  return ctx
}
