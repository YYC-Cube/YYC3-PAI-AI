/**
 * @file IDEMode.test.tsx
 * @description IDE 模式组件单元测试 — 渲染与核心交互
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-09
 * @status active
 * @tags [test],[unit],[ide-mode]
 */

import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ===== Mock localStorage =====
const lsMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: lsMock })

// ===== Mock store modules =====
vi.mock('../../store/ide-store', () => ({
  useIDEStore: () => ({
    tabs: [],
    activeTabId: null,
    leftPanelVisible: true,
    rightPanelVisible: false,
    terminalVisible: false,
    terminalExpanded: false,
    layout: 'classic' as const,
    layoutMode: 'edit',
    fullscreenPreview: false,
    splitDirection: 'none' as const,
    leftWidthPercent: 20,
    middleRatioPercent: 0.5,
    terminalHeight: 200,
    activePanelKey: null,
    hoveredPanelKey: null,
    leftWidth: 260,
    middleRatio: 0.5,
    setLayoutMode: vi.fn(),
    setFullscreenPreview: vi.fn(),
    setLeftWidth: vi.fn(),
    setMiddleRatio: vi.fn(),
    setTerminalVisible: vi.fn(),
    setTerminalHeight: vi.fn(),
    openTab: vi.fn(),
    applyPreset: vi.fn(),
  }),
  LAYOUT_PRESETS: {
    classic: { leftVisible: true, rightVisible: false, terminalVisible: false, split: false },
    split: { leftVisible: true, rightVisible: true, terminalVisible: false, split: true },
  },
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => ({
    openModelSettings: vi.fn(),
    providers: [],
    activeProviderId: null,
  }),
  ModelStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../store/theme-store', () => ({
  useThemeStore: () => ({
    isCyberpunk: false,
    tokens: {
      background: '#ffffff',
      foreground: '#000000',
      foregroundMuted: '#666666',
      primary: '#3b82f6',
      primaryDim: '#93c5fd',
      accent: '#f59e0b',
      border: '#e5e7eb',
      borderDim: '#f3f4f6',
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      fontMono: 'monospace',
      fontBody: 'sans-serif',
      fontDisplay: 'serif',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      inputBg: '#ffffff',
      inputBorder: '#d1d5db',
      inputFocus: '#3b82f6',
      panelBg: '#ffffff',
      secondary: '#6b7280',
    },
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}))

vi.mock('../../store/file-store', () => ({
  useFileStore: () => ({
    files: [],
    openFiles: [],
    activeFileId: null,
  }),
  fileStore: { getState: () => ({ files: [] }) },
}))

vi.mock('../../store/project-store', () => ({
  useProjectStore: () => ({
    projects: [],
    activeProjectId: null,
    getActiveProject: () => null,
    openModal: vi.fn(),
  }),
  projectStore: {
    getActiveProject: () => null,
  },
}))

vi.mock('../../store/collab-store', () => ({
  useCollabStore: () => ({
    sessions: [],
    enabled: false,
    users: [],
  }),
}))

vi.mock('../../store/shortcut-store', () => ({
  useShortcutStore: () => ({ shortcuts: {} }),
  eventToShortcut: vi.fn(),
}))

vi.mock('../../store/activity-store', () => ({
  activityBus: {
    push: vi.fn(),
    dispatch: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    clear: vi.fn(),
    list: vi.fn(() => []),
  },
}))

vi.mock('../../store/crypto-store', () => ({
  cryptoStoreActions: {
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
}))

vi.mock('../../store/db-store', () => ({
  dbStore: {
    getState: () => ({ data: {} }),
    setState: vi.fn(),
  },
}))

vi.mock('../../store/panel-dnd-store', () => ({
  usePanelDnD: () => ({
    layout: { panels: [] },
    slotContent: { left: null, center: 'code-editor', right: 'terminal' },
    dropZone: null,
    startDrag: vi.fn(),
    endDrag: vi.fn(),
  }),
  PANEL_CONTENT_MAP: {
    'ai-chat': { type: 'ai-chat', labelKey: 'aiChat', iconName: 'MessageSquare' },
    'file-explorer': { type: 'file-explorer', labelKey: 'fileExplorer', iconName: 'FolderOpen' },
    'code-editor': { type: 'code-editor', labelKey: 'codeView', iconName: 'Code2' },
    'preview': { type: 'preview', labelKey: 'preview', iconName: 'Eye' },
    'terminal': { type: 'terminal', labelKey: 'terminal', iconName: 'Terminal' },
  },
}))

vi.mock('../../store/offline-store', () => ({
  offlineStoreActions: {
    getQueue: () => [],
  },
}))

vi.mock('../../store/plugin-store', () => ({
  pluginStoreActions: {
    getPlugins: () => [],
  },
}))

vi.mock('../../store/quick-actions-store', () => ({
  useQuickActionsStore: () => ({ actions: [] }),
}))

vi.mock('../../store/editor-prefs-store', () => ({
  useEditorPrefs: () => ({ preferences: {} }),
}))

vi.mock('../../store/ai-metrics-store', () => ({
  useAIMetricsStore: () => ({ metrics: [], logMetric: vi.fn() }),
}))

// ===== Mock extracted IDEMode hooks =====
vi.mock('../ide/useAutoSave', () => ({
  useAutoSave: () => ({ triggerAutoSave: vi.fn(), lastAutoSave: null }),
}))

vi.mock('../ide/useIDEKeyboard', () => ({
  useIDEKeyboard: () => { },
}))

vi.mock('../ide/useIDEPanelResize', () => ({
  useIDEPanelResize: () => ({
    leftWidth: 260,
    middleRatio: 0.5,
    terminalHeight: 200,
    startResize: vi.fn(),
  }),
}))

vi.mock('../ide/useOverlayPanels', () => ({
  useOverlayPanels: () => ({
    panelMap: {},
    panels: {},
    togglePanel: vi.fn(),
    closePanel: vi.fn(),
    openPanel: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
  }),
  EVENT_TO_PANEL_KEY: {},
}))

vi.mock('../CyberEditor', () => ({}))

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}))

// ===== Mock IDEOverlays =====
vi.mock('../ide/IDEOverlays', () => ({
  IDEOverlays: () => <div data-testid="ide-overlays" />,
}))

// ===== Mock IDELayoutContext =====
vi.mock('../ide/IDELayoutContext', () => ({
  IDELayoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ===== Mock child components (avoid deep render) =====
vi.mock('../IDEHeader', () => ({
  IDEHeader: ({ onOpenNotifications, onOpenCommandPalette, onOpenGlobalSearch }: {
    onOpenNotifications?: () => void
    onOpenCommandPalette?: () => void
    onOpenGlobalSearch?: () => void
  }) => <div data-testid="ide-header">
      <button data-testid="btn-notifications" onClick={onOpenNotifications}>通知</button>
      <button data-testid="btn-commands" onClick={onOpenCommandPalette}>命令</button>
      <button data-testid="btn-search" onClick={onOpenGlobalSearch}>搜索</button>
    </div>,
}))

vi.mock('../IDELeftPanel', () => ({
  IDELeftPanel: () => <div data-testid="ide-left-panel" />,
}))

vi.mock('../ide/IDEFileExplorer', () => ({
  IDEFileExplorer: () => <div data-testid="ide-file-explorer" />,
}))

vi.mock('../ide/IDEChatPanel', () => ({
  IDEChatPanel: () => <div data-testid="ide-chat-panel" />,
}))

vi.mock('../ide/IDECodeEditorPanel', () => ({
  IDECodeEditorPanel: () => <div data-testid="ide-code-editor-panel" />,
}))

vi.mock('../IDEStatusBar', () => ({
  IDEStatusBar: () => <div data-testid="ide-status-bar" />,
}))

vi.mock('../CyberTooltip', () => ({
  CyberTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../DetachedWindow', () => ({
  DetachedWindowLayer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../PanelDropZone', () => ({
  PanelDropZone: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../ide/IDETerminal', () => ({
  IDETerminal: () => <div data-testid="ide-terminal" />,
}))

vi.mock('../LivePreview', () => ({
  LivePreview: () => <div data-testid="live-preview" />,
}))

vi.mock('../PreviewEngine', () => ({
  PreviewEngine: () => <div data-testid="preview-engine" />,
}))

vi.mock('../QuickActionsPanel', () => ({
  QuickActionsPanel: () => <div data-testid="quick-actions" />,
}))

vi.mock('../../i18n/context', () => ({
  useI18n: () => ({
    t: (_ns: string, key: string) => key,
    locale: 'zh',
    toggleLocale: vi.fn(),
  }),
}))

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children, defaultSize, minSize, ...rest }: any) => (
    <div data-testid="resizable-panel" data-default-size={defaultSize} data-min-size={minSize} {...rest}>
      {children}
    </div>
  ),
  PanelGroup: ({ children }: any) => <div data-testid="panel-group">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
}))

// ===== Import component after mocks =====
import React from 'react'
import { IDEMode } from '../IDEMode'

// ============================================================================
// Tests
// ============================================================================

describe('IDEMode', () => {
  const defaultProps = {
    onSwitchMode: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenNotifications: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    onOpenGlobalSearch: vi.fn(),
    onOpenAudioPanel: vi.fn(),
  }

  beforeEach(() => {
    lsMock.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该成功渲染 IDE 头部', () => {
    render(<IDEMode {...defaultProps} />)
    expect(screen.getByTestId('ide-header')).toBeDefined()
  })

  it('应该渲染左侧面板', () => {
    render(<IDEMode {...defaultProps} />)
    expect(screen.getByTestId('ide-left-panel')).toBeDefined()
  })

  it('应该渲染状态栏', () => {
    render(<IDEMode {...defaultProps} />)
    expect(screen.getByTestId('ide-status-bar')).toBeDefined()
  })

  it('点击通知按钮应该调用 onOpenNotifications', () => {
    render(<IDEMode {...defaultProps} />)
    const btn = screen.getByTestId('btn-notifications')
    act(() => btn.click())
    expect(defaultProps.onOpenNotifications).toHaveBeenCalled()
  })

  it('点击命令按钮应该调用 onOpenCommandPalette', () => {
    render(<IDEMode {...defaultProps} />)
    const btn = screen.getByTestId('btn-commands')
    act(() => btn.click())
    expect(defaultProps.onOpenCommandPalette).toHaveBeenCalled()
  })

  it('点击搜索按钮应该调用 onOpenGlobalSearch', () => {
    render(<IDEMode {...defaultProps} />)
    const btn = screen.getByTestId('btn-search')
    act(() => btn.click())
    expect(defaultProps.onOpenGlobalSearch).toHaveBeenCalled()
  })
})
