/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@tauri-apps/plugin-fs',
        replacement: path.resolve(__dirname, 'src/__mocks__/tauri-plugin-fs.ts'),
      },
      {
        find: '@tauri-apps/plugin-shell',
        replacement: path.resolve(__dirname, 'src/__mocks__/tauri-plugin-shell.ts'),
      },
      // monaco-editor 0.57 封闭 exports 后 `?worker` 深导入解析失败（与 vite.config.ts 同步修复）：
      // 正则 alias 改写为包内绝对路径，保留 ?worker 后缀；运行时仍由测试内 vi.mock 接管。
      {
        find: /^monaco-editor\/(esm\/vs\/(?:editor|language\/(?:json|css|html|typescript))\/[a-z]+\.worker)(\?worker)$/,
        replacement: path.resolve(__dirname, 'node_modules/monaco-editor') + '/$1.js$2',
      },
    ],
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
        // components/{FileContextMenu,PerformanceMonitor,MonacoPerformanceMonitor},
        // services/{trace-store,code-indexer,auth-client}(第七轮专项), webgpu-inference-store
        // 已浅测待专项深化（有测试但覆盖 <35%，300+ 行需专项；达标后移出）：
        // ModelSettings 28.6%（第十轮 9 用例：六页签/ESC/遮罩/初始页跳转/API Key 门面——
        // 1261 行需更多交互场景，二轮专项达标后移出）
        // （第七轮 onboard：trace-store/code-indexer/auth-client；第八轮：PanelManager/self-media-store；
        //   第九轮：ChatPage；第十轮：DetachedWindow 80%/CyberpunkBackground 97%/PreviewEngine 100%/
        //   MultiInstancePanel 47% 四件达标）
        // （第十三轮 onboard：五大面板 deep 专项——ContentPreview/SyncPanel/CodeGenPanel/PublishQueue/
        //   IntelligentWorkflowPanel，各自 __tests__/<组件名>.deep.test.tsx）
        // 第十一轮回档（有测试但 <35%，二轮深化达标后移出）：
        // SelfMediaEditor 22.7% / IDEHeader 26.8% / SettingsPanel 27.8% / EnhancedBackupRestorePanel 23.8% /
        // TaskBoard 33.2% / IDELeftPanel 6.0%
        // 第十二轮回档：data-portability-manager 23.1%（导出/预览 5 用例留作回归，导入/加密二轮）
        // audio/ide/performance/figma 四目录已 onboard（20轮：14+15+2+1 实体全测，见各 __tests__/）；
        // AudioPlaylist.tsx（无测试）与 index.ts（桶 re-export）仍排除
        'src/app/components/audio/AudioPlaylist.tsx',
        'src/app/components/audio/index.ts',
        'src/app/components/ui/**',
        // components 根目录未测面板（71）
                                                                                                                                                                                                                                                                                                        // hooks 未测（10）→ 第四轮 onboard 5（useAI 94%/useDebounce 96%/useKeyboardShortcuts 100%/
        // useStreamText 100%/useSystemTheme 96%）；留专项：useMonacoPerformanceMonitor(288行)/
        // usePerformanceMonitor(336行)/useIntelligentWorkflow(404行)；ai-types(纯类型无运行时)与
        // index.ts(桶 re-export 覆盖归因 0%)不参与分母
        'src/app/hooks/ai-types.ts',
        'src/app/hooks/index.ts',
        // Chat 未测（4）→ 第四轮 onboard 2（ChatInputBox 93%/ChatMessageList ~90%）；
        // 留专项：AiMessageRender(346行)；index.ts 桶(引 ChatPage 重依赖)不参与分母
        'src/components/Chat/index.ts',
        'src/app/pages/**',
        'src/app/App.tsx',
        'src/app/router.tsx',
        'src/test/**',
        'src/__mocks__/**',
        'src/app/workers/**',
        '**/*.worker.ts',
        'src/app/types/**',
        '**/types/**',
      ],
      thresholds: {
        // 2026-11-12 新标准（20轮清零战役后 statements/lines/functions 破 80）
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
        // 增量分支覆盖率要求 ≥70%（新增代码 diff 必须达标，PR 审查依据）
        // Vitest v4 不原生支持 per-diff coverage，通过 CI PR 审查手动检查
      },
      clean: true,
    },
  },
})
