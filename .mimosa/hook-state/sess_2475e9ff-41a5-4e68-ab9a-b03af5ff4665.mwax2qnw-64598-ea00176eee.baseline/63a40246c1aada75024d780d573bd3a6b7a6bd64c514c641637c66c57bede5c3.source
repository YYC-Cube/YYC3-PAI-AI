/**
 * @file PanelManager.tsx
 * @description 面板渲染管理器 — 集中渲染所有 overlay 面板，替代 App.tsx 中 200+ 行 JSX
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-09
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,overlay,render,manager
 *
 * @brief
 * 从 panel-store 读取面板状态，统一渲染所有 lazy-loaded 面板组件。
 *
 * @details
 * - 每个面板按需 lazy import，避免首屏负担
 * - 使用 Suspense + PanelSkeleton 包裹每个面板
 * - 面板关闭时从 panelActions.close 触发，不再需要独立 setXxxVisible(false)
 */

import { Suspense, lazy, useCallback } from 'react'
import { panelActions, usePanelStore } from '../store/panel-store'
import { useThemeStore } from '../store/theme-store'
import { PanelSkeleton } from './LoadingSkeleton'

// ===== Lazy-loaded panels =====
const CommandPalette = lazy(() => import('../components/CommandPalette').then(m => ({ default: m.CommandPalette })))
const SettingsPanel = lazy(() => import('../components/SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const NotificationCenter = lazy(() => import('../components/NotificationCenter').then(m => ({ default: m.NotificationCenter })))
const GlobalSearch = lazy(() => import('../components/GlobalSearch').then(m => ({ default: m.GlobalSearch })))
const PerformanceDashboard = lazy(() => import('../components/PerformanceDashboard').then(m => ({ default: m.PerformanceDashboard })))
const AIAssistantPanel = lazy(() => import('../components/AIAssistantPanel').then(m => ({ default: m.AIAssistantPanel })))
const CRDTCollabPanel = lazy(() => import('../components/CRDTCollabPanel').then(m => ({ default: m.CRDTCollabPanel })))
const IntelligentWorkflowPanel = lazy(() => import('../components/IntelligentWorkflowPanel').then(m => ({ default: m.IntelligentWorkflowPanel })))
const AgentWorkflowPanel = lazy(() => import('../components/AgentWorkflowPanel').then(m => ({ default: m.AgentWorkflowPanel })))
const SyncPanel = lazy(() => import('../components/SyncPanel').then(m => ({ default: m.SyncPanel })))
const ImageGenPanel = lazy(() => import('../components/ImageGenPanel').then(m => ({ default: m.ImageGenPanel })))
const SelfMediaEditor = lazy(() => import('../components/SelfMediaEditor').then(m => ({ default: m.SelfMediaEditor })))
const PublishQueue = lazy(() => import('../components/PublishQueue').then(m => ({ default: m.PublishQueue })))
const TrendingTopics = lazy(() => import('../components/TrendingTopics').then(m => ({ default: m.TrendingTopics })))
const AIWritingPanel = lazy(() => import('../components/AIWritingPanel').then(m => ({ default: m.AIWritingPanel })))
const MaterialManager = lazy(() => import('../components/MaterialManager').then(m => ({ default: m.MaterialManager })))
const ContentPreview = lazy(() => import('../components/ContentPreview').then(m => ({ default: m.ContentPreview })))
const ContentTemplatePanel = lazy(() => import('../components/ContentTemplatePanel').then(m => ({ default: m.ContentTemplatePanel })))
const LocalModelDashboard = lazy(() => import('../components/LocalModelDashboard').then(m => ({ default: m.LocalModelDashboard })))
const ChatPage = lazy(() => import('../../components/Chat/ChatPage').then(m => ({ default: m.default })))
const KeyManagerPanel = lazy(() => import('../components/KeyManagerPanel').then(m => ({ default: m.KeyManagerPanel })))

// ===== Props interfaces =====
export interface PanelManagerProps {
  /** Command palette commands */
  commands: import('../components/CommandPalette').PaletteCommand[]
  /** File content map for global search */
  searchFileMap: Record<string, string>
  /** Callback when a file is selected from search */
  onSearchSelectFile: (fileName: string, line?: number) => void
  /** Callback when text is replaced in search */
  onSearchReplace: (fileName: string, oldText: string, newText: string) => void
  /** Pending publish content */
  pendingPublishContent?: string | null
  /** Pending publish title */
  pendingPublishTitle?: string | null
  /** Callback to clear pending publish */
  onClearPendingPublish: () => void
}

/**
 * 面板渲染管理器
 * 统一渲染所有 overlay 面板，驱动于 panel-store
 */
export function PanelManager({
  commands,
  searchFileMap,
  onSearchSelectFile,
  onSearchReplace,
  pendingPublishContent,
  pendingPublishTitle,
  onClearPendingPublish,
}: PanelManagerProps) {
  const { visible } = usePanelStore()
  const { tokens } = useThemeStore()

  const close = useCallback((id: import('../store/panel-store').PanelId) => panelActions.close(id), [])

  return (
    <>
      {/* ===== Core Overlays ===== */}
      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('commandPalette') && (
          <CommandPalette visible onClose={() => close('commandPalette')} commands={commands} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('settings') && (
          <SettingsPanel visible onClose={() => close('settings')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('notifications') && (
          <NotificationCenter visible onClose={() => close('notifications')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('globalSearch') && (
          <GlobalSearch
            visible
            onClose={() => close('globalSearch')}
            fileContentMap={searchFileMap}
            onSelectFile={onSearchSelectFile}
            onReplace={onSearchReplace}
          />
        )}
      </Suspense>

      {/* ===== Performance & AI ===== */}
      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('performance') && (
          <PerformanceDashboard visible onClose={() => close('performance')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('aiAssistant') && (
          <AIAssistantPanel visible onClose={() => close('aiAssistant')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('crdtCollab') && (
          <CRDTCollabPanel visible onClose={() => close('crdtCollab')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('intelligentWorkflow') && (
          <IntelligentWorkflowPanel visible onClose={() => close('intelligentWorkflow')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('agentWorkflow') && (
          <AgentWorkflowPanel visible onClose={() => close('agentWorkflow')} />
        )}
      </Suspense>

      {/* ===== P0: Sync ===== */}
      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('syncPanel') && (
          <SyncPanel isOpen onClose={() => close('syncPanel')} />
        )}
      </Suspense>

      {/* ===== Self-Media Suite ===== */}
      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('imageGen') && (
          <ImageGenPanel visible onClose={() => close('imageGen')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('selfMediaEditor') && (
          <SelfMediaEditor visible onClose={() => close('selfMediaEditor')} />
        )}
        {visible.has('publishQueue') && (
          <PublishQueue
            visible
            onClose={() => {
              close('publishQueue')
              onClearPendingPublish()
            }}
            initialContent={pendingPublishContent || undefined}
            initialTitle={pendingPublishTitle || undefined}
          />
        )}
        {visible.has('trendingTopics') && (
          <TrendingTopics visible onClose={() => close('trendingTopics')} />
        )}
        {visible.has('localModelDash') && (
          <LocalModelDashboard onClose={() => close('localModelDash')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('aiWriting') && (
          <AIWritingPanel visible onClose={() => close('aiWriting')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('materialManager') && (
          <MaterialManager visible onClose={() => close('materialManager')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('contentPreview') && (
          <ContentPreview visible onClose={() => close('contentPreview')} />
        )}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('contentTemplate') && (
          <ContentTemplatePanel visible onClose={() => close('contentTemplate')} />
        )}
      </Suspense>

      {/* ===== Security Vault ===== */}
      <Suspense fallback={<PanelSkeleton />}>
        {visible.has('keyVault') && (
          <KeyManagerPanel />
        )}
      </Suspense>

      {/* ===== Chat Page ===== */}
      {visible.has('chat') && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{ background: tokens.background }}
        >
          <Suspense fallback={<PanelSkeleton />}>
            <ChatPage />
          </Suspense>
          <button
            onClick={() => close('chat')}
            className="absolute top-4 right-4 z-[10000] px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: tokens.error,
              color: tokens.background,
              fontFamily: tokens.fontMono,
            }}
          >
            关闭聊天
          </button>
        </div>
      )}
    </>
  )
}
