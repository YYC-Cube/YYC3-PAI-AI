/**
 * file: App.tsx
 * description: 应用根组件 · 提供全局布局、主题、国际化和状态管理
 * author: YanYuCloudCube Team
 * version: v2.0.0
 * created: 2026-03-19
 * updated: 2026-04-09
 * status: stable
 * tags: [app],[root],[react],[layout]
 *
 * copyright: YanYuCloudCube Team
 * license: MIT
 *
 * brief: 应用根组件，负责全局配置和布局
 *
 * details:
 * - 提供全局主题切换功能
 * - 集成国际化支持
 * - 管理全局状态（模型、主题、快捷键、设置）
 * - 实现面板拖拽和布局管理
 * - 提供错误边界和性能监控
 * - 面板管理已委托给 PanelManager + panel-store
 * - 命令定义已委托给 command-registry
 *
 * dependencies: React, PanelManager, command-registry, panel-store
 * exports: App (default)
 * notes: 需要在 main.tsx 中作为根组件渲染
 *
 * @changelog v2.0.0 (2026-04-09) — 架构重构
 * - 拆分 PanelManager: 面板渲染委托给 PanelManager 组件
 * - 拆分 CommandRegistry: 命令定义移至 command-registry.ts
 * - 引入 panel-store: 统一管理 20+ 面板状态，替换独立 useState
 * - Escape 面板栈模式: closeTop() 替代 20 行 if/else 链
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react"
import "../styles/cyberpunk.css"
import { CyberToaster } from "./components/CyberToast"
import { CyberpunkBackground } from "./components/CyberpunkBackground"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { PanelSkeleton } from "./components/LoadingSkeleton"
import { MonacoPerformanceMonitor } from "./components/performance"
import { PanelManager } from "./components/PanelManager"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { usePerformanceMonitor } from "./hooks/usePerformanceMonitor"
import { I18nProvider, useI18n } from "./i18n/context"
import { PRELOAD_STRATEGIES, useAutoMonacoPreload } from "./services/monaco-preloader"
import { ModelStoreProvider, useModelStore } from "./store/model-store"
import { panelDnDActions } from "./store/panel-dnd-store"
import { panelActions } from "./store/panel-store"
import { SelfMediaStoreProvider, useSelfMediaStore } from "./store/self-media-store"
import { useSettingsStore } from "./store/settings-store"
import { useShortcutStore } from "./store/shortcut-store"
import { useThemeStore } from "./store/theme-store"
import { buildCommands } from "./commands/command-registry"
import { initRouter } from "./utils/model-router"
import { createLogger } from "./utils/logger"

// ===== Eager imports — main views (critical rendering path) =====
import { FullscreenMode } from "./components/FullscreenMode"
import { ModelSettings } from "./components/ModelSettings"

const logger = createLogger('App')

// ===== React.lazy — main views (loaded on demand) =====
const IDEMode = lazy(() => import("./components/IDEMode").then(m => ({ default: m.IDEMode })))
const FloatingWidget = lazy(() => import("./components/FloatingWidget").then(m => ({ default: m.FloatingWidget })))

// ===== Types =====
type AppMode = "fullscreen" | "widget" | "ide"

/** Read file content map from localStorage (written by IDEMode autoSave) */
function readFileContentMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem("yyc3_file_content_map")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === "object" && parsed !== null) return parsed
    }
  } catch { /* ignore */ }
  return {}
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>("fullscreen")
  const { t, toggleLocale } = useI18n()
  const { tokens, isCyberpunk, toggleTheme, setTheme } = useThemeStore()
  const { openModelSettings } = useModelStore()
  const { shortcuts } = useShortcutStore()

  // ===== Self-Media Store (cross-panel communication) =====
  const {
    setPanelActions,
    templateWritingTopic,
    pendingPreviewContent,
    setPendingPreviewContent,
    setPendingPreviewTitle,
    setPendingPreviewPlatform,
    setPendingAIWritingTopic,
    setPendingAIWritingMode,
    setPendingPublish,
    pendingPublishContent,
    pendingPublishTitle,
  } = useSelfMediaStore()

  // ===== Monaco Editor Ref for Performance Monitoring =====
  const monacoEditorRef = useRef<unknown>(null)

  // ===== 隐藏白屏兜底启动屏（React 成功渲染后） =====
  useEffect(() => {
    const splash = document.getElementById('yyc3-splash')
    if (splash) {
      splash.classList.add('hidden')
      setTimeout(() => splash.remove(), 400)
    }
  }, [])

  // ===== Performance Monitoring =====
  const settings = useSettingsStore()
  const performanceSettings = settings.performance
  usePerformanceMonitor({
    enableWebVitals: performanceSettings.enabled && performanceSettings.enableWebVitals,
    enableSystemMonitoring: performanceSettings.enabled && performanceSettings.enableSystemMonitoring,
    systemMonitoringInterval: performanceSettings.sampleInterval,
    debug: performanceSettings.debugMode,
  })

  // ===== Monaco Editor 预加载 =====
  useAutoMonacoPreload({
    enabled: true,
    priority: PRELOAD_STRATEGIES.APP_START.priority,
    delay: PRELOAD_STRATEGIES.APP_START.delay,
  })

  // ===== Centralized panel actions — custom event bridge =====
  const switchToIDE = useCallback(() => setMode("ide"), [])
  const [_cheatSheetVisible, setCheatSheetVisible] = useState(false)

  // ===== Cross-Panel Communication (自媒体创作引擎全链路) =====
  useEffect(() => {
    setPanelActions({
      openAIWriting: (_options?: { mode?: string; topic?: string }) => {
        if (_options?.topic) setPendingAIWritingTopic(_options.topic)
        if (_options?.mode) {
          const validModes = ['title', 'outline', 'seo', 'expand', 'summary', 'rewrite']
          if (validModes.includes(_options.mode)) {
            setPendingAIWritingMode(_options.mode as any)
          }
        }
        panelActions.open('aiWriting')
      },
      openMaterialManager: () => panelActions.open('materialManager'),
      openContentPreview: (options?: { content?: string; title?: string; platform?: string }) => {
        if (options?.content) setPendingPreviewContent(options.content)
        if (options?.title) setPendingPreviewTitle(options.title)
        if (options?.platform) setPendingPreviewPlatform(options.platform)
        panelActions.open('contentPreview')
      },
      openEditor: () => panelActions.open('selfMediaEditor'),
      openPublishQueue: (_options?: { content?: string; title?: string }) => {
        setPendingPublish(_options?.content ?? null, _options?.title ?? null)
        panelActions.open('publishQueue')
      },
      openTrendingTopics: () => panelActions.open('trendingTopics'),
    })
  }, [setPanelActions, setPendingPublish, setPendingPreviewContent, setPendingPreviewTitle, setPendingPreviewPlatform, setPendingAIWritingTopic, setPendingAIWritingMode])

  // Auto-open panels when pending data is set
  useEffect(() => { if (templateWritingTopic) panelActions.open('aiWriting') }, [templateWritingTopic])
  useEffect(() => { if (pendingPreviewContent) panelActions.open('contentPreview') }, [pendingPreviewContent])
  useEffect(() => { if (pendingPublishContent) panelActions.open('publishQueue') }, [pendingPublishContent])

  // ===== Global search =====
  const [searchFileMap, setSearchFileMap] = useState<Record<string, string>>({})
  const openGlobalSearch = useCallback(() => {
    setSearchFileMap(readFileContentMap())
    panelActions.open('globalSearch')
  }, [])

  const handleSearchSelectFile = useCallback((_fileName: string, _line?: number) => {
    setMode("ide")
  }, [])

  const handleSearchReplace = useCallback((fileName: string, oldText: string, newText: string) => {
    try {
      const stored = localStorage.getItem("yyc3_file_content_map")
      if (stored) {
        const map = JSON.parse(stored) as Record<string, string>
        if (map[fileName]) {
          map[fileName] = map[fileName].replaceAll(oldText, newText)
          localStorage.setItem("yyc3_file_content_map", JSON.stringify(map))
          setSearchFileMap({ ...map })
        }
      }
    } catch { /* ignore */ }
  }, [])

  // ===== Clear pending publish =====
  const clearPendingPublish = useCallback(() => {
    setPendingPublish(null, null)
  }, [setPendingPublish])

  // ===== Shared Layout URL Detection =====
  useEffect(() => {
    initRouter().catch(() => { })

    try {
      const hash = window.location.hash
      if (hash.startsWith('#yyc3-layout=')) {
        const result = panelDnDActions.importFromShareURL(hash)
        if (result.success && result.layout) {
          try { history.replaceState(null, '', window.location.pathname + window.location.search) } catch { /* sandboxed */ }
        }
      }
    } catch { /* ignore hash parsing errors in preview iframe */ }

    // Listen for open-panel custom events
    const handleOpenPanel = (e: CustomEvent) => {
      if (e.detail === 'performance') {
        panelActions.open('performance')
      }
    }
    window.addEventListener('yyc3:open-panel', handleOpenPanel as EventListener)
    return () => window.removeEventListener('yyc3:open-panel', handleOpenPanel as EventListener)
  }, [])

  // ===== Command definitions — delegated to command-registry =====
  const commands = useMemo(() => buildCommands({
    isCyberpunk,
    toggleTheme,
    setTheme,
    toggleLocale,
    openModelSettings,
    shortcuts,
    openGlobalSearch,
    onSwitchToIDE: switchToIDE,
    setCheatSheetVisible,
  }), [isCyberpunk, toggleTheme, setTheme, toggleLocale, openModelSettings, shortcuts, openGlobalSearch, switchToIDE])

  // ===== Keyboard shortcuts =====
  useKeyboardShortcuts([
    { keys: shortcuts.commandPalette?.internal ?? 'mod+k', action: () => panelActions.toggle('commandPalette') },
    { keys: shortcuts.toggleTheme?.internal ?? 'mod+shift+t', action: toggleTheme },
    { keys: shortcuts.toggleLang?.internal ?? 'mod+shift+l', action: toggleLocale },
    { keys: shortcuts.openSettings?.internal ?? 'mod+,', action: () => panelActions.toggle('settings') },
    { keys: shortcuts.modelSettings?.internal ?? 'mod+shift+m', action: () => openModelSettings() },
    { keys: shortcuts.globalSearch?.internal ?? 'mod+shift+f', action: openGlobalSearch },
    { keys: shortcuts.openSnippets?.internal ?? 'mod+shift+s', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'snippets' })) } },
    { keys: shortcuts.openTaskBoard?.internal ?? 'mod+shift+b', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'taskBoard' })) } },
    { keys: shortcuts.openGitPanel?.internal ?? 'mod+shift+h', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'git' })) } },
    { keys: shortcuts.openPerformance?.internal ?? 'mod+shift+p', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'performance' })) } },
    { keys: shortcuts.openDiagnostics?.internal ?? 'mod+shift+d', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'diagnostics' })) } },
    { keys: shortcuts.openActivityLog?.internal ?? 'mod+shift+j', action: () => { setMode('ide'); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'activityLog' })) } },
    { keys: shortcuts.agentWorkflow?.internal ?? 'mod+shift+a', action: () => panelActions.toggle('agentWorkflow') },
    { keys: shortcuts.shortcutCheatSheet?.internal ?? 'mod+/', action: () => setCheatSheetVisible(v => !v) },
    // ===== Escape — 面板栈模式（后进先出） =====
    {
      keys: 'escape',
      action: () => { panelActions.closeTop() },
      preventDefault: false,
    },
  ])

  // ===== Render =====
  return (
    <div
      className="w-full h-screen overflow-hidden"
      style={{
        background: tokens.background,
        fontFamily: tokens.fontBody,
        position: "relative",
        color: tokens.foreground,
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <CyberpunkBackground />

      {/* ===== Main mode views ===== */}
      {mode === "fullscreen" ? (
        <FullscreenMode
          onSwitchMode={() => setMode("widget")}
          onSwitchToIDE={() => setMode("ide")}
          onOpenSettings={() => panelActions.open('settings')}
          onOpenNotifications={() => panelActions.open('notifications')}
          onOpenCommandPalette={() => panelActions.open('commandPalette')}
          onOpenGlobalSearch={openGlobalSearch}
          onOpenAIWriting={() => panelActions.open('aiWriting')}
          onOpenContentTemplate={() => panelActions.open('contentTemplate')}
          onOpenMaterialManager={() => panelActions.open('materialManager')}
          onOpenPublishQueue={() => panelActions.open('publishQueue')}
          onOpenTrendingTopics={() => panelActions.open('trendingTopics')}
          onOpenChat={() => panelActions.open('chat')}
        />
      ) : mode === "ide" ? (
        <Suspense fallback={<PanelSkeleton />}>
          <IDEMode
            onSwitchMode={() => setMode("fullscreen")}
            onOpenSettings={() => panelActions.open('settings')}
            onOpenNotifications={() => panelActions.open('notifications')}
            onOpenCommandPalette={() => panelActions.open('commandPalette')}
            onOpenGlobalSearch={openGlobalSearch}
            onOpenAudioPanel={() => {
              panelActions.open('settings')
              setTimeout(() => {
                const settingsTab = document.querySelector('[data-settings-tab="audio"]') as HTMLElement
                if (settingsTab) settingsTab.click()
              }, 100)
            }}
          />
        </Suspense>
      ) : (
        <div style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}>
          <div className="flex items-center justify-center size-full">
            <div className="text-center">
              <p style={{
                fontFamily: tokens.fontMono, fontSize: "12px",
                color: tokens.primaryDim, letterSpacing: "4px",
                opacity: isCyberpunk ? 0.3 : 0.6,
              }}>
                YYC&sup3; {t("common", "systemSubtitle")}
              </p>
              <p style={{
                fontFamily: tokens.fontMono, fontSize: "10px",
                color: isCyberpunk ? tokens.accent : tokens.foregroundMuted,
                marginTop: "8px", letterSpacing: "2px",
                opacity: isCyberpunk ? 0.15 : 0.6,
              }}>
                {t("mode", "widgetModeActive")}
              </p>
            </div>
          </div>
          <Suspense fallback={<PanelSkeleton />}>
            <FloatingWidget onSwitchMode={() => setMode("fullscreen")} />
          </Suspense>
        </div>
      )}

      {/* ===== Global overlays — eagerly imported ===== */}
      <ModelSettings />
      <CyberToaster />
      <MonacoPerformanceMonitor editorRef={monacoEditorRef} />

      {/* ===== Panel Manager — 统一渲染所有 overlay 面板 ===== */}
      <PanelManager
        commands={commands}
        searchFileMap={searchFileMap}
        onSearchSelectFile={handleSearchSelectFile}
        onSearchReplace={handleSearchReplace}
        pendingPublishContent={pendingPublishContent}
        pendingPublishTitle={pendingPublishTitle}
        onClearPendingPublish={clearPendingPublish}
      />
    </div>
  )
}

export default function App() {
  logger.info('App initialized')

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ModelStoreProvider>
          <SelfMediaStoreProvider>
            <AppContent />
          </SelfMediaStoreProvider>
        </ModelStoreProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}