/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@tauri-apps/plugin-fs': path.resolve(__dirname, 'src/__mocks__/tauri-plugin-fs.ts'),
      '@tauri-apps/plugin-shell': path.resolve(__dirname, 'src/__mocks__/tauri-plugin-shell.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'benchmarks/**/*.test.ts', 'e2e/tests/**/*.test.ts', 'e2e/**/*.e2e.test.ts'],
    exclude: ['e2e/My-mgmt*/**', 'node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'e2e/',
        'benchmarks/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/dist/**',
        'src/app/components/ui/**',
        'src/app/lib/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // ── 覆盖率收敛（文件级 onboarding）：以下为「尚无对应测试」的文件清单。
        // 每补一个组件/hook 测试，就从对应清单删除该文件（自动进入分母受阈值约束）。
        // 子目录整体未测的用通配；新增文件默认计入分母（防新增盲区）。
        // 已 onboard（不再排除）：components/{GitPanel,IDEMode,settings-model,TraceViewer,PluginManager,
        // SmallPanels 件套(EditorTabBar/FloatingWidget/VersionHistory/PerformanceAlert/SecurityAudit/Collab)},
        // hooks/{useAgent,useCRDTCollab,useWebGPUInference,useChatSession,useAI,useDebounce,
        // useKeyboardShortcuts,useStreamText,useSystemTheme},
        // Chat/{CodeBlockWrap,ChatInputBox,ChatMessageList}, services/{file-system-watcher,monaco-setup,
        // git-service}, utils/{model-router,version-manager,version-examples},
        // components/{FileContextMenu,PerformanceMonitor,MonacoPerformanceMonitor}, webgpu-inference-store
        // 已浅测待专项深化（有测试但覆盖 <35%，300+ 行需专项；达标后移出）：
        // ModelSettings(0%) / PanelManager(0%) / ChatPage(1.4%) / DetachedWindow(3.2%)
        // trace-store(9.7%) / CyberpunkBackground(14.9%) / PreviewEngine(17.5%)
        // code-indexer(25.8%) / auth-client(27.8%) / MultiInstancePanel(28.5%)
        'src/app/components/ModelSettings.tsx',
        'src/app/components/PanelManager.tsx',
        'src/app/components/DetachedWindow.tsx',
        'src/app/components/MultiInstancePanel.tsx',
        'src/app/components/PreviewEngine.tsx',
        'src/app/components/CyberpunkBackground.tsx',
        'src/components/Chat/ChatPage.tsx',
        'src/app/services/trace-store.ts',
        'src/app/services/code-indexer.ts',
        'src/app/services/auth-client.ts',
        'src/app/components/audio/**',
        'src/app/components/figma/**',
        'src/app/components/ide/**',
        'src/app/components/performance/**',
        'src/app/components/ui/**',
        // components 根目录未测面板（71）
        'src/app/components/AIAssistPanel.tsx',
        'src/app/components/AIAssistantPanel.tsx',
        'src/app/components/AICompletionProvider.tsx',
                'src/app/components/ActivityLog.tsx',
                        'src/app/components/CodeGenPanel.tsx',
                        'src/app/components/ContentPreview.tsx',
                'src/app/components/CyberEditor.tsx',
                        'src/app/components/EnhancedBackupRestorePanel.tsx',
                'src/app/components/FullscreenMode.tsx',
                                'src/app/components/IDEHeader.tsx',
        'src/app/components/IDELeftPanel.tsx',
                                                'src/app/components/LivePreview.tsx',
                'src/app/components/LocalModelDashboard.tsx',
                        'src/app/components/PanelDropZone.tsx',
                'src/app/components/PerformanceDashboard.tsx',
                        'src/app/components/ProjectCreateModal.tsx',
                                'src/app/components/RichTextEditor.tsx',
                'src/app/components/SelfMediaEditor.tsx',
                                        'src/app/components/StorageManager.tsx',
                                                        'src/app/components/UnifiedDataPanel.tsx',
                        'src/app/components/settings/AIServiceTabs.tsx',
                'src/app/components/settings/WorkspaceTabs.tsx',
        'src/app/services/sync-backend-adapter.ts',
        'src/app/services/indexeddb-service.ts',
        'src/app/services/sync-engine.ts',
        'src/app/services/native-database-dumper.ts',
        'src/app/components/PublishQueue.tsx',
        'src/app/components/AIWritingPanel.tsx',
        'src/app/components/IntelligentWorkflowPanel.tsx',
        'src/app/components/SyncPanel.tsx',
        'src/app/components/DatabasePanel.tsx',
        'src/app/components/MaterialManager.tsx',
        'src/app/components/ImageGenPanel.tsx',
        'src/app/components/SettingsPanel.tsx',
        'src/app/components/SystemPanel.tsx',
        'src/app/components/TaskBoard.tsx',
        'src/app/components/SnippetManager.tsx',
        'src/app/components/CRDTCollabPanel.tsx',
        'src/app/components/ContentTemplatePanel.tsx',
        'src/app/components/AgentWorkflowPanel.tsx',
        // hooks 未测（10）→ 第四轮 onboard 5（useAI 94%/useDebounce 96%/useKeyboardShortcuts 100%/
        // useStreamText 100%/useSystemTheme 96%）；留专项：useMonacoPerformanceMonitor(288行)/
        // usePerformanceMonitor(336行)/useIntelligentWorkflow(404行)；ai-types(纯类型无运行时)与
        // index.ts(桶 re-export 覆盖归因 0%)不参与分母
        'src/app/hooks/ai-types.ts',
        'src/app/hooks/index.ts',
        'src/app/hooks/useIntelligentWorkflow.ts',
        'src/app/hooks/useMonacoPerformanceMonitor.ts',
        'src/app/hooks/usePerformanceMonitor.tsx',
        // Chat 未测（4）→ 第四轮 onboard 2（ChatInputBox 93%/ChatMessageList ~90%）；
        // 留专项：AiMessageRender(346行)；index.ts 桶(引 ChatPage 重依赖)不参与分母
        'src/components/Chat/AiMessageRender.tsx',
        'src/components/Chat/index.ts',
        'src/app/pages/**',
        'src/app/App.tsx',
        'src/app/router.tsx',
        'src/test/**',
        'src/__mocks__/**',
        'src/app/workers/**',
        '**/*.worker.ts',
        'src/app/utils/layout-engine.ts',
        'src/app/utils/audio-engine.ts',
        'src/app/utils/local-model-client.ts',
        'src/app/utils/local-model-infra.ts',
        'src/app/types/**',
        '**/types/**',
        'src/app/store/self-media-store.tsx',
        'src/app/services/data-sync-orchestrator.ts',
        'src/app/services/data-portability-manager.ts',
        'src/app/services/monaco-performance-benchmark.ts',
        'src/app/services/monaco-preloader.ts',
      ],
      thresholds: {
        // 新标准（2026-10-30 提升）
        statements: 70,
        branches: 55,
        functions: 65,
        lines: 65,
        // 增量分支覆盖率要求 ≥70%（新增代码 diff 必须达标，PR 审查依据）
        // Vitest v4 不原生支持 per-diff coverage，通过 CI PR 审查手动检查
      },
      clean: true,
    },
  },
})
