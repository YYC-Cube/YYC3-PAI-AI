/**
 * @file command-registry.ts
 * @description 命令注册中心 — 集中管理 CommandPalette 命令定义与注册
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-09
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags command,registry,palette,shortcut
 *
 * @brief
 * 从 App.tsx 抽取 200+ 行命令定义，集中管理并提供可扩展的命令注册机制。
 *
 * @details
 * - 内置命令（buildCommands）从各 Store 注入依赖
 * - 支持外部通过 registerCommand / unregisterCommand 动态扩展
 * - 与 PanelStore 深度集成，面板类命令直接调用 panelActions
 */

import type { PaletteCommand } from '../components/CommandPalette'
import {
  Activity, AlertTriangle,
  Bell, Bot, Brain, Clock,
  Code2, Cpu, Database, Eye,
  FileText, Flame, FolderPlus,
  GitBranch, Globe, Image as ImageIcon,
  Keyboard, LayoutGrid, Monitor, Moon,
  Puzzle, Scissors, Search, Send,
  Settings, Shield, Sparkles, Sun,
  Terminal, Users, Wifi, Zap
} from 'lucide-react'
import { panelActions } from '../store/panel-store'

// ============================================================================
// 命令依赖接口 — 由 App.tsx 注入
// ============================================================================

export interface CommandDeps {
  /** 主题相关 */
  isCyberpunk: boolean
  toggleTheme: () => void
  setTheme: (theme: 'cyberpunk' | 'clean') => void
  /** 国际化 */
  toggleLocale: () => void
  /** 模型设置 */
  openModelSettings: () => void
  /** 快捷键显示定义 */
  shortcuts: Record<string, { display?: string }>
  /** 全局搜索 */
  openGlobalSearch: () => void
  /** 面板切换 */
  onSwitchToIDE: () => void
  /** 通知 */
  setCheatSheetVisible: (v: boolean) => void
}

// ============================================================================
// 命令构建器
// ============================================================================

/** 构建所有内置命令 */
export function buildCommands(deps: CommandDeps): PaletteCommand[] {
  const {
    isCyberpunk, toggleTheme, setTheme, toggleLocale,
    openModelSettings, shortcuts, openGlobalSearch,
    onSwitchToIDE, setCheatSheetVisible,
  } = deps

  return [
    // ===== Navigation =====
    {
      id: 'switch-fullscreen', labelKey: 'cmdSwitchFullscreen', categoryKey: 'catNavigation',
      icon: Monitor, shortcut: '',
      action: () => { /* handled by App.tsx mode switch */ },
    },
    {
      id: 'switch-ide', labelKey: 'cmdSwitchIDE', categoryKey: 'catNavigation',
      icon: Code2, shortcut: '',
      action: onSwitchToIDE,
    },
    {
      id: 'switch-widget', labelKey: 'cmdSwitchWidget', categoryKey: 'catNavigation',
      icon: Sparkles, shortcut: '',
      action: () => { /* handled by App.tsx mode switch */ },
    },

    // ===== Theme =====
    {
      id: 'toggle-theme', labelKey: 'cmdToggleTheme', categoryKey: 'catTheme',
      icon: isCyberpunk ? Sun : Moon, shortcut: shortcuts.toggleTheme?.display ?? '⌘⇧T',
      action: toggleTheme,
    },
    {
      id: 'cyberpunk-theme', labelKey: 'cmdCyberpunkTheme', categoryKey: 'catTheme',
      icon: Moon,
      action: () => setTheme('cyberpunk'),
    },
    {
      id: 'clean-theme', labelKey: 'cmdCleanTheme', categoryKey: 'catTheme',
      icon: Sun,
      action: () => setTheme('clean'),
    },
    {
      id: 'toggle-lang', labelKey: 'cmdToggleLang', categoryKey: 'catTheme',
      icon: Globe, shortcut: shortcuts.toggleLang?.display ?? '⌘⇧L',
      action: toggleLocale,
    },

    // ===== Tools =====
    {
      id: 'open-settings', labelKey: 'cmdOpenSettings', categoryKey: 'catTools',
      icon: Settings, shortcut: shortcuts.openSettings?.display ?? '⌘,',
      action: () => panelActions.open('settings'),
    },
    {
      id: 'open-model-settings', labelKey: 'cmdOpenModelSettings', categoryKey: 'catAI',
      icon: Bot, shortcut: shortcuts.modelSettings?.display ?? '⌘⇧M',
      action: openModelSettings,
    },
    {
      id: 'open-notifications', labelKey: 'cmdOpenNotifications', categoryKey: 'catTools',
      icon: Bell,
      action: () => panelActions.open('notifications'),
    },
    {
      id: 'keyboard-shortcuts', labelKey: 'cmdKeyboardShortcuts', categoryKey: 'catTools',
      icon: Keyboard,
      action: () => setCheatSheetVisible(true),
    },

    // ===== IDE-specific =====
    {
      id: 'toggle-terminal', labelKey: 'cmdToggleTerminal', categoryKey: 'catEditor',
      icon: Terminal, shortcut: shortcuts.toggleTerminal?.display ?? '⌘`',
      action: onSwitchToIDE,
    },
    {
      id: 'new-project', labelKey: 'cmdNewProject', categoryKey: 'catProject',
      icon: FolderPlus, shortcut: shortcuts.newProject?.display ?? '⌘⇧N',
      action: onSwitchToIDE,
    },
    {
      id: 'open-ai-assist', labelKey: 'cmdOpenAIAssist', categoryKey: 'catAI',
      icon: Sparkles, shortcut: shortcuts.aiAssist?.display ?? '⌘⇧A',
      action: onSwitchToIDE,
    },
    {
      id: 'open-code-gen', labelKey: 'cmdOpenCodeGen', categoryKey: 'catAI',
      icon: Code2, shortcut: shortcuts.codeGen?.display ?? '⌘⇧G',
      action: onSwitchToIDE,
    },
    {
      id: 'toggle-preview', labelKey: 'cmdTogglePreview', categoryKey: 'catEditor',
      icon: Eye, shortcut: shortcuts.togglePreview?.display ?? '⌘1',
      action: onSwitchToIDE,
    },
    {
      id: 'global-search', labelKey: 'cmdGlobalSearch', categoryKey: 'catTools',
      icon: Search, shortcut: shortcuts.globalSearch?.display ?? '⌘⇧F',
      action: openGlobalSearch,
    },
    {
      id: 'toggle-collab', labelKey: 'cmdToggleCollab', categoryKey: 'catTools',
      icon: Users,
      action: onSwitchToIDE,
    },

    // ===== New MVP expansion panels =====
    {
      id: 'open-git-panel', labelKey: 'cmdOpenGitPanel', categoryKey: 'catTools',
      icon: GitBranch, shortcut: shortcuts.openGitPanel?.display ?? '⌘ Shift H',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'git' })) },
    },
    {
      id: 'open-performance', labelKey: 'cmdOpenPerformance', categoryKey: 'catTools',
      icon: Activity, shortcut: shortcuts.openPerformance?.display ?? '⌘ Shift P',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'performance' })) },
    },
    {
      id: 'open-webgpu-ai', labelKey: 'cmdOpenWebGPUAI', categoryKey: 'catAI',
      icon: Zap, shortcut: '⌘ Shift W',
      action: () => panelActions.open('aiAssistant'),
    },
    {
      id: 'open-crdt-collab', labelKey: 'cmdOpenCRDTCollab', categoryKey: 'catTools',
      icon: Users, shortcut: '⌘ Shift C',
      action: () => panelActions.open('crdtCollab'),
    },
    {
      id: 'open-intelligent-workflow', labelKey: 'cmdOpenIntelligentWorkflow', categoryKey: 'catAI',
      icon: Brain, shortcut: '⌘ Shift I',
      action: () => panelActions.open('intelligentWorkflow'),
    },
    {
      id: 'open-agent-workflow', labelKey: 'cmdOpenAgentWorkflow', categoryKey: 'catAI',
      icon: Bot, shortcut: '⌘ Shift A',
      action: () => panelActions.open('agentWorkflow'),
    },

    // ===== P0: File Synchronization =====
    {
      id: 'open-sync-panel', labelKey: 'cmdOpenSyncPanel', categoryKey: 'catTools',
      icon: Wifi, shortcut: '⌘ Shift S',
      action: () => panelActions.open('syncPanel'),
    },

    // ===== IDE panels (via events) =====
    {
      id: 'open-diagnostics', labelKey: 'cmdOpenDiagnostics', categoryKey: 'catTools',
      icon: AlertTriangle, shortcut: shortcuts.openDiagnostics?.display ?? '⌘ Shift D',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'diagnostics' })) },
    },
    {
      id: 'open-task-board', labelKey: 'cmdOpenTaskBoard', categoryKey: 'catProject',
      icon: LayoutGrid, shortcut: shortcuts.openTaskBoard?.display ?? '⌘ Shift B',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'taskBoard' })) },
    },
    {
      id: 'open-snippets', labelKey: 'cmdOpenSnippets', categoryKey: 'catEditor',
      icon: Scissors, shortcut: shortcuts.openSnippets?.display ?? '⌘ Shift S',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'snippets' })) },
    },
    {
      id: 'open-activity-log', labelKey: 'cmdOpenActivityLog', categoryKey: 'catTools',
      icon: Clock, shortcut: shortcuts.openActivityLog?.display ?? '⌘ Shift J',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'activityLog' })) },
    },
    {
      id: 'open-database', labelKey: 'cmdOpenDatabase', categoryKey: 'catTools',
      icon: Database, shortcut: '⌘ Shift Q',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'database' })) },
    },
    {
      id: 'open-plugins', labelKey: 'cmdOpenPlugins', categoryKey: 'catTools',
      icon: Puzzle, shortcut: '⌘ Shift E',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'plugins' })) },
    },
    {
      id: 'open-security', labelKey: 'cmdOpenSecurity', categoryKey: 'catTools',
      icon: Shield, shortcut: '⌘ Shift X',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'security' })) },
    },
    {
      id: 'open-offline', labelKey: 'cmdOpenOffline', categoryKey: 'catTools',
      icon: Wifi, shortcut: '⌘ Shift O',
      action: () => { onSwitchToIDE(); window.dispatchEvent(new CustomEvent('yyc3:open-panel', { detail: 'offline' })) },
    },

    // ===== Phase 1: Self-Media =====
    {
      id: 'open-image-gen', labelKey: '图像生成', categoryKey: 'catAI',
      icon: ImageIcon, shortcut: '⌘ ⇧ G',
      action: () => panelActions.open('imageGen'),
    },
    {
      id: 'open-self-media-editor', labelKey: '内容编辑器', categoryKey: 'catAI',
      icon: FileText, shortcut: '⌘ ⇧ E',
      action: () => panelActions.open('selfMediaEditor'),
    },

    // ===== Phase 2: Self-Media Creation Engine =====
    {
      id: 'open-ai-writing', labelKey: 'AI写作助手', categoryKey: 'catAI',
      icon: Sparkles, shortcut: '⌘ ⇧ W',
      action: () => panelActions.open('aiWriting'),
    },
    {
      id: 'open-material-manager', labelKey: '素材管理器', categoryKey: 'catTools',
      icon: ImageIcon, shortcut: '⌘ ⇧ U',
      action: () => panelActions.open('materialManager'),
    },
    {
      id: 'open-content-preview', labelKey: '内容预览', categoryKey: 'catTools',
      icon: Eye, shortcut: '⌘ ⇧ P',
      action: () => panelActions.open('contentPreview'),
    },
    {
      id: 'open-publish-queue', labelKey: '多平台发布', categoryKey: 'catTools',
      icon: Send, shortcut: '',
      action: () => panelActions.open('publishQueue'),
    },
    {
      id: 'open-trending-topics', labelKey: '热点选题', categoryKey: 'catTools',
      icon: Flame, shortcut: '',
      action: () => panelActions.open('trendingTopics'),
    },

    // ===== Infrastructure =====
    {
      id: 'open-local-model-dash', labelKey: '本地模型基础设施', categoryKey: 'catAI',
      icon: Cpu, shortcut: '⌘ ⇧ M',
      action: () => panelActions.open('localModelDash'),
    },
  ]
}

// ============================================================================
// 动态命令注册（供插件扩展）
// ============================================================================

/** 外部注册的命令存储 */
const externalCommands = new Map<string, PaletteCommand>()

/** 注册外部命令 */
export function registerCommand(cmd: PaletteCommand): void {
  externalCommands.set(cmd.id, cmd)
}

/** 注销外部命令 */
export function unregisterCommand(id: string): void {
  externalCommands.delete(id)
}

/** 获取所有外部命令 */
export function getExternalCommands(): PaletteCommand[] {
  return Array.from(externalCommands.values())
}

/** 合并内置 + 外部命令 */
export function getAllCommands(deps: CommandDeps): PaletteCommand[] {
  return [...buildCommands(deps), ...getExternalCommands()]
}