<!-- ==========================================================================
     YYC³ AI-PAI
     © 2026 YanYuCloudCube™. All rights reserved.
     Intellectual Property & Trademark: YanYuCloudCube™
     ========================================================================== -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/Family-001.png">
    <img src="./public/Family-001.png" width="100%" alt="YYC³ AI-PAI — Words Initiate Quadrants, Language Serves as Core for Future" style="max-width: 896px;">
  </picture>
</p>

<div align="center">

# YYC³ AI-PAI · π

> ***YanYuCloudCube™***
>
> *言启象限 · 语枢未来*
>
> **Words Initiate Quadrants, Language Serves as Core for Future**
>
> *万象归元于云枢 · 深栈智启新纪元*
>
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

[![Release](https://img.shields.io/github/v/release/YYC-Cube/YYC3-PAI-AI?style=flat-square&logo=github&color=blue)](https://github.com/YYC-Cube/YYC3-PAI-AI/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-PAI-AI/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white)](https://github.com/YYC-Cube/YYC3-PAI-AI/actions)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg?style=flat-square&logo=open-source-initiative&logoColor=white)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square&logo=git&logoColor=white)](./CONTRIBUTING.md)

[![Tests](https://img.shields.io/badge/tests-2810%20passing-brightgreen?style=flat-square&logo=vitest&logoColor=white)](https://github.com/YYC-Cube/YYC3-PAI-AI/actions)
[![Dependencies](https://img.shields.io/badge/critical%20vulns-0-success?style=flat-square&logo=github&logoColor=white)](https://github.com/YYC-Cube/YYC3-PAI-AI/security/dependabot)
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9%20%7C%2010-f69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-latest-9cf?style=flat-square&logo=radixui&logoColor=white)](https://www.radix-ui.com/)
[![Code Size](https://img.shields.io/github/languages/code-size/YYC-Cube/YYC3-PAI-AI?style=flat-square&color=purple)](https://github.com/YYC-Cube/YYC3-PAI-AI)
[![Last Commit](https://img.shields.io/github/last-commit/YYC-Cube/YYC3-PAI-AI?style=flat-square&color=orange)](https://github.com/YYC-Cube/YYC3-PAI-AI/commits/main)

**🌐 [pai.yyc3.vip](https://pai.yyc3.vip)** · 📖 [文档](./docs) · 🚀 [快速开始](#-quick-start-快速开始) · 🤝 [贡献指南](./CONTRIBUTING.md) · 💬 [Discussions](https://github.com/YYC-Cube/YYC3-PAI-AI/discussions)

> **📦 仓库定位（2026-10 仓库分离后）**
>
> | 仓库 | 产品 | 线上地址 |
> |---|---|---|
> | **本仓 `YYC3-PAI-AI`** | YYC³ AI-PAI —— React 18 + Vite 纯前端智能编程助手（一人一端 · 数据本地优先 · 无自建后端） | **[pai.yyc3.vip](https://pai.yyc3.vip)** |
> | 姊妹仓 [`YYC3-Pai-Platform`](https://github.com/YYC-Cube/YYC3-Pai-Platform) | YYC3-Pai —— Python 多用户 / 多 Agent 自托管平台（langgraph · MCP · A2A + antd dashboard + desktop） | [pai-ai.yyc3.vip](https://pai-ai.yyc3.vip) |
>
> 两仓同源（git 历史共享血脉），2026-10-29 按「一个项目一条线」原则分离：本仓专注 React 前端产品，Platform 仓专注 Python 平台。质量基线：**2810 个单元测试全绿 · tsc 零错误 · 依赖 critical 漏洞清零**。项目状态速查见 [`docs/YYC3-项目状态速览.md`](./docs/YYC3-项目状态速览.md)。

</div>

---

## 📋 Table of Contents · 目录

| English | 中文 |
|---------|------|
| [✨ Features](#-features-核心特性) | [核心特性](#-features-核心特性) |
| [🏗️ Architecture](#️-architecture-架构) | [架构](#️-architecture-架构) |
| [🚀 Quick Start](#-quick-start-快速开始) | [快速开始](#-quick-start-快速开始) |
| [📦 Tech Stack](#-tech-stack-技术栈) | [技术栈](#-tech-stack-技术栈) |
| [📁 Project Structure](#-project-structure-项目结构) | [项目结构](#-project-structure-项目结构) |
| [🧪 Testing](#-testing-测试) | [测试](#-testing-测试) |
| [🔌 API](#-api-api文档) | [API文档](#-api-api文档) |
| [📊 Performance](#-performance-性能指标) | [性能指标](#-performance-性能指标) |
| [📚 Documentation](#-documentation-文档体系) | [文档体系](#-documentation-文档体系) |
| [🤝 Contributing](#-contributing-贡献) | [贡献](#-contributing-贡献) |
| [📄 License](#-license-许可证) | [许可证](#-license-许可证) |

---

## ✨ Features · 核心特性

### 🤖 AI-Driven Development · AI驱动开发

| English | 中文 |
|---------|------|
| Multi-model support — OpenAI, Claude, Zhipu, Qwen, DeepSeek, Ollama | 多模型支持 — 主流AI模型无缝集成 |
| Context-aware code generation & completion | 基于上下文的智能代码补全与生成 |
| Real-time code diagnostics & optimization suggestions | 实时代码质量检测与优化建议 |
| Natural language to code | 自然语言编程 — 话说即代码 |

### 🔐 Data Sovereignty · 数据主权

| English | 中文 |
|---------|------|
| **Local-first** — all data stored locally, full control | **本地优先** — 所有数据本地存储，完全掌控 |
| **End-to-end encryption** — AES-256-GCM | **端到端加密** — AES-256-GCM 加密保护 |
| **Zero-knowledge architecture** — server has no data access | **零知识架构** — 服务器无法访问用户数据 |
| **Data portability** — import/export, zero lock-in | **数据可移植** — 支持导入导出，无锁定风险 |

### 🚀 High Performance · 高性能

- **Lightweight** — built with Vite + Tree-shaking, fast HMR
- **Virtual scrolling** — smooth rendering for large datasets
- **Incremental sync** — intelligent file sync, delta-only transfer
- **LRU caching** — millisecond-level response

### 🎨 Modern UI · 现代化界面

- **Cyberpunk aesthetic** — unique visual design language
- **Multi-theme** — built-in themes + full customization
- **Responsive panels** — drag, split, merge, resize
- **Keyboard-first** — complete shortcut support

### 🔌 Extensible Ecosystem · 扩展生态

- **Plugin system** — flexible plugin architecture
- **MCP protocol** — Model Context Protocol support
- **Open API** — complete API surface
- **Webhook** — event-driven integration

---

## 🏗️ Architecture · 架构

### System Architecture · 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           YYC³ AI-PAI · π                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   UI Layer      │  │  State Layer    │  │  Service Layer  │         │
│  │  React + Radix  │◄┤  Zustand + Immer │◄┤  AI · File · DB │         │
│  │  Tailwind 4     │  │  Context        │  │  Sync · Crypto  │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│           ▼                    ▼                    ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    Storage Layer                             │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │       │
│  │  │  IndexedDB   │  │ localStorage │  │  File System     │   │       │
│  │  │  (Dexie.js)  │  │  (Config)    │  │  (Tauri / Web)   │   │       │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Gateway Architecture · AI 网关架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI Model Gateway                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ OpenAI   │ │ Claude   │ │ Zhipu    │ │ Qwen     │ │ Ollama   │     │
│  │ GPT-4o   │ │ Claude 4 │ │ GLM-5    │ │ Qwen3-Max│ │ Local    │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       │            │            │            │            │           │
│       └────────────┴────────────┴─────┬──────┴────────────┘           │
│                                       ▼                                │
│                          ┌────────────────────┐                        │
│                          │  Unified Adapter    │                        │
│                          │  (统一适配层)        │                        │
│                          └────────────────────┘                        │
│                                       │                                │
│                    ┌──────────────────┼──────────────────┐             │
│                    ▼                  ▼                  ▼             │
│           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│           │  Cache Layer │  │ Rate Limiter │  │   Fallback   │         │
│           └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start · 快速开始

### Prerequisites · 环境要求

| Dependency · 依赖 | Version · 版本 | Check · 验证 |
|-------------------|---------------|--------------|
| Node.js | >= 18.0.0 | `node -v` |
| pnpm | >= 9.0.0 | `pnpm -v` |
| Git | >= 2.30.0 | `git --version` |

### Installation · 安装

```bash
# 1. Clone · 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-PAI-AI.git
cd YYC3-PAI

# 2. Install dependencies · 安装依赖
pnpm install

# 3. Start dev server · 启动开发服务器
pnpm dev
# → http://localhost:3200

# 4. Build for production · 构建生产版本
pnpm build
# → dist/
```

### Commands · 命令参考

```bash
# Development · 开发
pnpm dev              # Start Vite dev server on :3200
pnpm type-check       # TypeScript type checking

# Build · 构建
pnpm build            # Build production bundle + music manifest

# Test · 测试
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage report

# Code quality · 代码质量
pnpm lint             # ESLint check
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Prettier formatting

# Music manifest · 音乐库
pnpm gen-music-manifest  # Regenerate music manifest
```

---

## 📦 Tech Stack · 技术栈

| Category · 类别 | Technology · 技术 | Version · 版本 | Purpose · 用途 |
|----------------|-------------------|---------------|----------------|
| **Frontend** | React | 18.3+ | UI framework |
| | TypeScript | 5.6+ | Type safety |
| | Vite | 6.3+ | Build tool |
| **State** | Zustand | 5.0+ | State management |
| | Immer | 10.0+ | Immutable data |
| **UI** | Radix UI | latest | Accessible components |
| | Tailwind CSS | 4.0+ | Styling system |
| | shadcn/ui | latest | Component library |
| **Editor** | Monaco Editor | 0.55+ | Code editor |
| | @tiptap | 3.24+ | Rich text editor |
| **Storage** | IndexedDB (Dexie) | 4.0+ | Local database |
| | localStorage | — | Config storage |
| **AI** | OpenAI SDK | — | GPT-4o integration |
| | Zhipu SDK | — | GLM-5 integration |
| | Ollama | — | Local models |
| **Audio** | Howler.js | 2.2+ | Audio engine |
| | Web Audio API | — | Audio visualization |
| **Testing** | Vitest | 4.x | Unit testing |
| | Playwright | 1.58+ | E2E testing |
| **Deploy** | GitHub Pages | — | Hosting |
| | GitHub Actions | — | CI/CD |

---

## 📁 Project Structure · 项目结构

```
YYC3-PAI/
├── public/                         # Static assets · 静态资源
│   ├── music/                      # Music library · 音乐库
│   │   ├── My-music-A/            # 沫言 (10 tracks)
│   │   ├── My-music-B/            # 沫语 (10 tracks)
│   │   └── My-music-AB/           # 合唱 (5 tracks)
│   ├── music-manifest.json         # Auto-generated manifest · 自动生成清单
│   ├── Family-001.png              # Project hero image · 项目封面
│   ├── yyc3-icons/                 # Multi-platform icons · 多平台图标
│   └── icon.svg                    # Favicon
├── scripts/
│   └── generate-music-manifest.cjs # Music scanner · 音乐扫描脚本
├── src/
│   ├── app/
│   │   ├── components/             # Page components · 页面组件
│   │   │   ├── audio/             # Audio player components
│   │   │   ├── ide/               # IDE components
│   │   │   └── settings/          # Settings components
│   │   ├── store/                  # State stores · 状态管理
│   │   ├── services/              # Business services · 业务服务
│   │   ├── hooks/                 # Custom hooks · 自定义 Hooks
│   │   ├── utils/                 # Utilities · 工具函数
│   │   │   ├── audio-engine.ts    # Audio engine · 音频引擎
│   │   │   ├── model-router.ts    # AI model router · 模型路由
│   │   │   └── storage-cleaner.ts # Storage manager · 存储管理
│   │   ├── i18n/                  # Internationalization · 国际化
│   │   └── types/                 # Type definitions · 类型定义
│   ├── components/                 # Shared components · 共享组件
│   │   └── ui/                    # Base UI components
│   ├── styles/                     # Global styles · 全局样式
│   ├── types/                      # Global types · 全局类型
│   └── workers/                    # Web Workers
├── docs/                           # Documentation · 文档
│   └── [project documentation]
├── e2e/                            # E2E tests · 端到端测试
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline
├── CNAME                           # Custom domain · 自定义域名
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🧪 Testing · 测试

### Coverage · 覆盖率

| Type · 类型 | Current · 当前 | Target · 目标 |
|-------------|---------------|--------------|
| Statements · 语句 | 85%+ | 80% |
| Branches · 分支 | 75%+ | 70% |
| Functions · 函数 | 90%+ | 85% |
| Lines · 行 | 85%+ | 80% |

### Run Tests · 运行测试

```bash
# All tests · 全部测试
pnpm test

# Unit tests · 单元测试
pnpm vitest run

# With coverage · 带覆盖率
pnpm test:coverage

# E2E tests · 端到端测试
pnpm test:e2e
```

---

## 🔌 API · API文档

<details>
<summary><b>📁 File System · 文件系统</b></summary>

```typescript
// Read file · 读取文件
const content = await fileSystem.readFile('/path/to/file.ts')

// Write file · 写入文件
await fileSystem.writeFile('/path/to/file.ts', content)

// Watch file changes · 监听文件变化
fileSystem.watch('/path/to/dir', (event, path) => {
  console.log(`${event}: ${path}`)
})
```

</details>

<details>
<summary><b>🤖 AI Services · AI服务</b></summary>

```typescript
// Code generation · 代码生成
const result = await aiService.generateCode({
  prompt: 'Create a React component',
  language: 'typescript',
  context: currentFile
})

// Code analysis · 代码分析
const analysis = await aiService.analyzeCode({
  code: sourceCode,
  language: 'typescript'
})

// Chat completion · 对话补全
const response = await aiService.chat({
  messages: [{ role: 'user', content: 'Optimize this code' }],
  model: 'gpt-4o'
})
```

</details>

<details>
<summary><b>💾 Data Storage · 数据存储</b></summary>

```typescript
// IndexedDB operations · IndexedDB 操作
const db = new Dexie('YYC3Database')
await db.entries.add({
  id: 'entry-1',
  path: '/path/to/file',
  content: '...',
  metadata: { ... }
})

// Data export · 数据导出
const blob = await portabilityManager.exportData({
  format: 'json',
  includeEncrypted: true,
  compress: true
})

// Data import · 数据导入
await portabilityManager.importData(file, passphrase)
```

</details>

<details>
<summary><b>🎵 Audio Engine · 音频引擎</b></summary>

```typescript
// Initialize music library · 初始化音乐库
const engine = getAudioEngine()
await engine.initializeMusicLibrary()

// Play · 播放
engine.play('track-id')

// Seek · 跳转
engine.seek(30) // seconds

// Volume · 音量
engine.setMusicVolume(70)  // 0-100

// Subscribe to state · 订阅状态
engine.subscribe((state) => {
  console.log(state.currentTime, state.isPlaying)
})
```

</details>

---

## 📊 Performance · 性能指标

| Metric · 指标 | Target · 目标 | Current · 当前 |
|--------------|--------------|---------------|
| First Paint · 首屏加载 | < 2s | ~1.5s |
| Page Switch · 页面切换 | < 100ms | ~80ms |
| Data Load · 数据加载 | < 500ms | ~350ms |
| Memory · 内存占用 | < 500MB | ~380MB |
| CPU Usage · CPU使用率 | < 30% | ~22% |
| Bundle Size · 包体积 | < 5MB | ~3.5MB (gzip) |

---

## 📚 Documentation · 文档体系

### Open-Source Standards · 开源标准文件

| File · 文件 | Status · 状态 | Description · 说明 |
|------------|-------------|------------------|
| ✅ [LICENSE](./LICENSE) | MIT v1.0 | Open-source license · 开源许可证 |
| ✅ [CONTRIBUTING.md](./CONTRIBUTING.md) | v1.0 | Contribution guide · 贡献指南 |
| ✅ [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | v1.0 | Code of conduct · 行为准则 |
| ✅ [SECURITY.md](./SECURITY.md) | v1.0 | Security policy · 安全政策 |
| ✅ [SUPPORT.md](./SUPPORT.md) | v1.0 | Support channels · 支持渠道 |
| ✅ [CHANGELOG.md](./CHANGELOG.md) | v1.0.0 | Version changelog · 更新日志 |
| ✅ [.github/ISSUE_TEMPLATE](./.github/ISSUE_TEMPLATE/) | 2 templates | Bug report & Feature request |
| ✅ [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) | v1.0 | PR template |
| ✅ [.github/workflows/ci.yml](./.github/workflows/ci.yml) | v1.0 | CI/CD pipeline |

### Full Documentation Index · 完整文档索引

| Document · 文档 | Description · 说明 | Link · 链接 |
|----------------|-------------------|------------|
| 📘 项目总览 · Overview | Architecture, features, quick start | [README](./README.md) |
| 📗 核心架构 · Core Arch | Technical design, storage, building | [P0-核心架构](./docs/P0-核心架构/) |
| 📙 功能说明 · Features | AI, editor, state management | [P1-核心功能](./docs/P1-核心功能/) |
| 📒 高级特性 · Advanced | Collaboration, plugins, database | [P2-高级功能](./docs/P2-高级功能/) |
| 🎵 音乐库 · Music Lib | 25 original tracks | [MUSIC-LIBRARY-INDEX.md](./public/MUSIC-LIBRARY-INDEX.md) |

---

## 🤝 Contributing · 贡献

We welcome all forms of contribution! See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

我们欢迎所有形式的贡献！详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

### Quick Guide · 快速指南

```bash
# 1. Fork the repo · Fork 仓库
# 2. Create branch · 创建分支
git checkout -b feature/amazing-feature

# 3. Make changes · 修改代码
pnpm dev

# 4. Run tests · 运行测试
pnpm test && pnpm lint && pnpm type-check

# 5. Commit · 提交 (遵循 Conventional Commits)
git commit -m 'feat: add amazing feature'

# 6. Push & PR
git push origin feature/amazing-feature
```

---

## 📄 License · 许可证

<div align="center">

```
MIT License

Copyright (c) 2026 YanYuCloudCube™

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

**YYC³ AI-PAI** © 2026 **YanYuCloudCube™**

**All rights reserved. · 版权所有**

**Trademark Notice:** *YanYuCloudCube™* and the YYC³ logo are trademarks of YanYuCloudCube Team.

*言启象限 · 语枢未来*
*Words Initiate Quadrants, Language Serves as Core for Future*

**🌐 [pai.yyc3.vip](https://pai.yyc3.vip)** · 📧 [admin@0379.email](mailto:admin@0379.email) · 🐛 [Issues](https://github.com/YYC-Cube/YYC3-PAI-AI/issues)

</div>
