<p align="center">
  <img src="public/yyc3-family.png" alt="YYC3-Pai Family" />
</p>

<p align="center">
  <strong>支持多用户、多 Agent 的自托管 AI 助手。</strong>
</p>

<p align="center">
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/YYC-Cube/YYC3-PAI-AI/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/actions/workflows/codeql.yml"><img alt="CodeQL" src="https://github.com/YYC-Cube/YYC3-PAI-AI/actions/workflows/codeql.yml/badge.svg" /></a>
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/releases"><img alt="Release" src="https://img.shields.io/github/v/release/YYC-Cube/YYC3-PAI-AI?include_prereleases&label=release" /></a>
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green" /></a>
  <a href="https://www.python.org/downloads/"><img alt="Python 3.12+" src="https://img.shields.io/badge/python-3.12%2B-blue?logo=python&logoColor=white" /></a>
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/pkgs/container/yyc3-pai"><img alt="Docker" src="https://img.shields.io/badge/docker-ghcr.io%2Fyyc--cube%2Fyyc3--pai-2496ED?logo=docker&logoColor=white" /></a>
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/issues"><img alt="Issues" src="https://img.shields.io/github/issues/YYC-Cube/YYC3-PAI-AI" /></a>
  <a href="https://github.com/YYC-Cube/YYC3-PAI-AI/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/YYC-Cube/YYC3-PAI-AI?style=social" /></a>
</p>

<p align="center">
  <a href="#-亮点">亮点</a> ·
  <a href="#-概述">概述</a> ·
  <a href="#-核心技术">核心技术</a> ·
  <a href="#-功能特性">功能特性</a> ·
  <a href="#-规划">规划</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-目录">目录</a>
</p>

<p align="center">
  <a href="README.md">English</a> · <b>中文</b>
</p>

---

**YYC3-Pai（YYC π³）** 是由 [YanYuCloudCube](https://github.com/YYC-Cube) 维护的开源、自托管 AI 助手。它不仅是工具，更是可并行运作的数字助手。通过多 Agent 架构，它为团队、家庭和个人构建了既独立又协作的智能环境。这一切都运行在你的机器上——完全自托管的设计让隐私不再是妥协，而单进程启动的便捷性，让强大的 Web 控制台、CLI 与 IM 集成触手可及。

借助飞书、钉钉、QQ、微信、企业微信或 HTTP/SSE/WebSocket API 与任意 Agent 对话；通过**专家库**一键创建专业角色，通过 **Connector**（OAuth + MCP）接入外部服务，通过 **ACP** 与 IDE / 终端 AI 工具双向协作。

> YYC3-Pai 由上游 [Octop](https://github.com/TencentCloud/Octop) 项目硬分叉，上游归属见 [LICENSE](LICENSE) 与源码历史。

## ✨ 亮点

| | 特性 | 说明 |
| --- | ------ | ------ |
| 👥 | **多用户多 Agent 专家团** | 一人管理，全家共用；内置专家库与专家市场，按场景切换专业角色 |
| 🤝 | **专家共享** | 支持发布专家与技能 / 子智能体共享池，同实例内复用优秀配置 |
| 🎭 | **MBTI 人格** | 16 种人格模板与互动测试，为每个 Agent 赋予鲜明性格 |
| 🎯 | **AgentTeams** *（Beta）* | 协调者调度多位专家协作完成多步骤任务；[详见](docs/expert-teams.md) |
| 🔒 | **更安全** | JWT 多用户隔离、工具审批、Shell 命令防护与敏感信息脱敏，数据留在本地 |
| 🔌 | **Connector 拓展体系** | 文档 / 会议 / 新闻等连接器，OAuth 与 MCP 网关轻松扩展 |
| 💾 | **可插拔工作区后端** | 本地目录、Docker 沙箱、PostgreSQL 或 COS/S3 存放 Agent 文件 — 与控制面数据库分离 |
| 🧠 | **可迁移记忆系统** | 基于 YYC³ Memory（yyc3-memory），记忆随工作区迁移 |
| 📚 | **知识库** | 基于文档的 RAG 检索；支持同实例共享语料，让回答锚定私有知识 |
| 🧩 | **插件** | 支持第三方插件扩展；内置插件按需一键启用 |
| ↔️ | **ACP 双向集成** | `pai acp` 增强 IDE 与终端 AI；对话中委派 OpenCode / Claude Code 等 |
| 💻 | **终端 AI+** | 浏览器内交互式 Shell，AI 辅助命令执行与排障 |
| 🌐 | **浏览器 AI+** | 基于 Chromium 的无头浏览器会话，支持网页自动化、截图与远程操控 |
| 🖥️ | **远程桌面** | 控制台内实时看屏与键鼠操控，跨 Linux / Windows / macOS；无图形 Linux 可一键搭建隔离桌面 |
| 🏠 | **可自托管** | 一条 `pai run` 即可运行控制台、CLI、IM 通道与定时任务，数据存于 `~/.yyc3-pai/` |

## 📌 概述

YYC3-Pai 是面向家庭与小团队的自托管 AI 助手平台。单进程同时提供 Web 控制台、CLI、IM 通道（飞书、钉钉、QQ、微信、企业微信等）与定时任务，共享 `~/.yyc3-pai/` 下的控制面数据库（默认 SQLite，文件 `yyc3-pai.db`；可选 PostgreSQL）。

> YYC3-Pai 的设计目标：让每一次对话、工作区与凭据都留在你自己的机器上，同时为每个用户配备一组可按场景切换的专业 Agent。

<details>
<summary>你能用 YYC3-Pai 做什么</summary>

- **个人助理** — 让专属 Agent 帮你写周报、整理资料、定日程，记忆随工作区长期保留。
- **家庭共享** — 一个管理员账号，全家共用；按成员分配不同 Agent 与专家角色，也可共享专家与知识库。
- **团队助手** — AgentTeams 或多 Agent 并行协作，对接飞书 / 钉钉 / 企业微信 / 微信，把任务自动分发到群里。
- **开发者增效** — 通过 ACP 把编码任务委派给 OpenCode / Claude Code，或在终端用 AI 辅助排障。
- **网页自动化** — 用浏览器 AI+ 与远程桌面自动填表、截图、操作 GUI 软件。
- **定时任务** — 用自然语言配置 Cron，让 Agent 每天按时推送或执行任务。

</details>

## 🧠 核心技术

| 层级 | 技术 |
| ------ | ------ |
| **语言** | Python 3.12+ |
| **Web 框架** | FastAPI + uvicorn |
| **Agent 运行时** | YYC³ Harness（yyc3-harness） |
| **IM 桥接** | YYC³ Gateway（yyc3-gateway） |
| **控制平面数据库** | SQLite（WAL，默认）或 PostgreSQL（可选） |
| **前端** | React 18 + TypeScript + Vite |
| **调度** | APScheduler |
| **ACP** | agent-client-protocol |
| **构建 / 质量** | hatchling · ruff · mypy · pytest |

YYC3-Pai 基于 YYC³ Harness 技术栈构建——它将这些专注的运行时组合进同一个进程：

- **YYC³ Harness（yyc3-harness）** — Agent 运行时：模型路由、工具、技能与对话检查点。
- **YYC³ Gateway（yyc3-gateway）** — 多平台 IM 通道桥接，将各类入站消息归一为统一的处理管线。
- **YYC³ Memory（yyc3-memory）** — 分层记忆与全文检索，让 Agent 的记忆随工作区一同迁移。
- **YYC³ Browser（yyc3-browser）** — 基于 CDP 的浏览器自动化，支持持久化配置，用于网页类任务。

YYC3-Pai 不依赖外部消息队列或中间件，而是通过进程内处理器统一路由所有入口——Web UI、IM 与定时任务。最终呈现为一个可重启恢复的单进程：启动时整个状态都从控制面数据库重建（默认本地 SQLite；可选 PostgreSQL）。

## 🤔 功能特性

### 服务器与认证

- 多用户 JWT 认证，支持管理员角色
- 首次运行向导（`pai init`）
- 交互式 API 文档：`/api/docs`（Scalar）

### 专家

- 每位用户可创建多个专家；各自拥有独立工作区、供应商、通道和定时任务
- 16 种 MBTI 人格模板 + 自定义系统提示词
- 启动时扫描专家库（`infra/agents/experts/library/`）；支持专家市场与同实例专家共享
- **AgentTeams** *（Beta）* — 协调者 + 成员专家协作完成多步骤任务（[docs/expert-teams.md](docs/expert-teams.md)）
- 工作区后端（专家文件）：本地磁盘、Docker 沙箱、PostgreSQL、COS/S3 及其他远程存储 — 与控制面数据库分离

### 通道与自动化

- IM 通道：飞书、钉钉、QQ、微信、企业微信等
- 主动定时任务，支持自然语言和斜杠命令触发
- Web UI、IM、定时任务共用同一套消息处理链路

### 使用入口

- **Web 控制台** — 对话、专家 / 团队、连接器、通道、定时任务、知识库、插件、设置
- **CLI** — `pai run`、`pai chats`、`pai acp`、管理命令
- **HTTP/SSE/WebSocket API** — 完整的程序化访问能力
- **远程桌面** — 在控制台操控本机桌面会话

### 知识库与插件

- **知识库** — 基于文档的 RAG 检索；支持同实例内共享语料
- **插件** — 安装并管理第三方插件（`pai plugin`）；内置插件按需在控制台一键启用

### ACP（Agent Client Protocol）

YYC3-Pai 支持两个方向的 ACP 集成：

1. **入站** — 外部工具使用**你的** YYC3-Pai Agent

   ```bash
   pai acp --agent main   # 为 Zed、OpenCode 等提供 stdio ACP 服务
   ```

2. **出站** — YYC3-Pai 委派给外部编程 Agent
   - 控制台 → **ACP**（`/acp`）：配置 Runner（按用户全局）
   - 为 Agent 启用 **acp_runner** 后，在对话中委派任务

内置出站 Runner 包括 OpenCode、CodeBuddy、Claude Code 和 Codex。

完整配置：**[docs/acp.md](docs/acp.md)**。

## 🧭 规划

以下是中长期规划：

**已完成**

- [x] **资源共享池** — 构建技能 / 子智能体共享池，用户在创建专家时可直接取用，无需从零搭建。
- [x] **专家共享** — 支持用户将自有专家共享给其他用户使用，沉淀优秀配置、避免重复造轮子。

**进行中**

- [ ] **AgentTeams** *（Beta）* — 支持协调者自主调度、编排多位专家，协同完成复杂多步骤任务。
- [ ] **自进化能力** — 将日常对话沉淀为可复用技能，让助手随使用不断成长。

**规划中**

- [ ] **浏览器与终端能力补全** — 增强浏览器操作*录制*（把流程录制为可复用技能），并完善终端 AI 助手能力。
- [ ] **Project** — 以项目为边界组织 Agent、文件与会话，围绕同一目标协作。
- [ ] **云边端一体** — 本地运行 YYC3-Pai，同时可将选定任务调度到云端执行：轻量工作留在本地，重活按需上云。
- [ ] **对话式控制面** — 完善 YYC3-Pai 自身 Skill，让对话即可覆盖当前控制台的完整能力：创建专家、配置通道、管理知识库，并支持开发插件。

规划会随项目发展动态调整，以上仅供参考。

## 🚀 快速开始

### 环境要求

- **macOS / Linux / Windows**
- [uv](https://docs.astral.sh/uv/) 与 Python 3.12+
- 现代多核 CPU，并预留数 GB 内存供进程与模型 / Embedding 缓存使用；磁盘需容纳数据库、Agent 工作区与文档语料

### 1. 从源码安装

```bash
git clone https://github.com/YYC-Cube/YYC3-PAI-AI.git
cd YYC3-PAI-AI
uv sync                       # 创建隔离虚拟环境并安装依赖
```

可选本地 ONNX Embedding 模型：

```bash
uv sync --extra local-embedding
```

浏览器自动化需安装 Chromium：

```bash
uv run playwright install chromium
```

### 2. 初始化

```bash
uv run pai init
```

交互式向导会在 `~/.yyc3-pai/` 下创建 SQLite 数据库、JWT 密钥，并引导你设置首个管理员账号。

### 3. 启动

```bash
# 前台运行（API + Web 控制台）
uv run pai run

# 自定义主机与端口
uv run pai run --host 0.0.0.0 --port 8088

# 注册为系统服务（systemd / launchd / Windows 服务）
uv run pai service start
```

打开 **<http://127.0.0.1:8088**。交互式设置会让你自行设置密码（至少> 8 位，且同时包含字母和数字）。

### Docker（推荐用于生产部署）

```bash
docker compose -f docker/docker-compose.yml up -d
```

打开 `http://localhost:8088`。首次初始化会创建管理员账号，并把凭据写入容器数据卷。设置 `YYC3_DEFAULT_PASSWORD` 可固定首次密码，未设置则自动生成随机强密码。可通过 `YYC3_ADMIN_USERNAME` 覆盖用户名。

> **密码策略：** 至少 8 位，且同时包含字母和数字。

| 变量 | 默认值 | 说明 |
| ------ | -------- | ------ |
| `YYC3_PORT` | `8088` | HTTP 监听端口 |
| `YYC3_DEFAULT_PASSWORD` | *(未设置)* | 首次运行管理员密码（Docker 引导），未设置 = 随机密码写入数据卷 |
| `YYC3_ADMIN_USERNAME` | `admin` | 首次运行管理员用户名 |
| `YYC3_PAI_HOME` | `~/.yyc3-pai` | 数据根目录（compose 挂载） |

环境变量统一使用 `YYC3_` 前缀，旧的 `OCTOP_*` 变量仍作为兜底兼容。完整列表见 [`.env.example`](.env.example)。

## 📑 目录

- [亮点](#-亮点)
- [概述](#-概述)
- [核心技术](#-核心技术)
- [功能特性](#-功能特性)
- [规划](#-规划)
- [快速开始](#-快速开始)
- **架构与开发**
  - [配置](#️-配置)
  - [CLI 参考](#-cli-参考)
  - [数据目录](#-数据目录)
  - [架构](#-架构)
  - [开发](#-开发)
- **项目信息**
  - [安全与隐私](#-安全与隐私)
  - [参与贡献](#-参与贡献)
  - [更新日志](#-更新日志)
  - [相关项目](#-相关项目)
  - [许可证](#-许可证)

### 🗂️ 文档中心

| | 文档 | 内容 |
| --- | ------ | ------ |
| 🏗️ | [架构](docs/architecture.md) | 单进程模型、模块地图、启动时序 |
| ⚙️ | [配置](docs/configuration.md) | `config.json`、环境变量、数据库后端、TLS |
| ⌨️ | [CLI 参考](docs/cli.md) | 全部 `pai` 子命令与示例 |
| 🔌 | [API](docs/api.md) | `/api` 下的 HTTP / SSE / WebSocket 端点 |
| 💬 | [使用指南](docs/user-guide.md) | 控制台功能逐步走读 |
| 🎭 | [人格](docs/personas.md) | MBTI 模板与专家人格 |
| 🤝 | [专家团队](docs/expert-teams.md) | AgentTeams 协调者 / 成员设计 |
| 🔗 | [ACP](docs/acp.md) | 与 IDE、编码智能体的双向集成 |
| 🌉 | [桥接](docs/bridge.md) | 实例互联，远程专家协作 |
| 📡 | [工作区文件 I/O](docs/agent-backend-file-io.md) | 存储后端、Docker 沙箱、路径规则 |
| 🧠 | [记忆瘦身](docs/memory-slim.md) | 安全收缩智能体记忆 |
| 🔐 | [LDAP](docs/ldap.md) | 目录服务登录与自动开通 |
| 📻 | [Discord 通道](docs/discord-channel.md) | 机器人配置与测试 |
| 📚 | [会话存档](docs/versioned-history.md) | 对话归档内部机制 |

## ⚙️ 配置

所有运行时数据存放在 `~/.yyc3-pai/`。可通过 CLI 管理，也可直接编辑文件。

```bash
# LLM 供应商与模型
pai models
pai provider list

# IM 通道
pai channel list

# Skill（按 Agent）
pai skills list --agent main

# 定时任务
pai cron list
pai cron create --help

# 用户（管理员）
pai user list
```

### 支持的 LLM 供应商

OpenAI 兼容 API、DashScope（千问）、Ollama 等预设 — 在控制台或通过 `pai provider` 按 Agent 配置。

### 支持的通道

| 通道 | 所需凭证 |
| ------ | ---------- |
| **飞书** | App ID、App Secret |
| **钉钉** | App Key、App Secret |
| **QQ** | Bot AppID、Token |
| **微信** | 扫码绑定 / 账号凭证；见 [CLI](docs/cli.md) |
| **企业微信** | Corp ID、Agent Secret |
| **Web 控制台** | 默认启用 |

## 📖 CLI 参考

| 命令 | 说明 |
| ------ | ------ |
| `pai init` | 初始化 `~/.yyc3-pai/`（数据库、管理员、JWT 密钥） |
| `pai run` | 前台启动 YYC3-Pai |
| `pai service start` | 安装并启动系统服务 |
| `pai service stop` | 停止系统服务 |
| `pai agent` | 创建、列出、启停 Agent |
| `pai channel` | 安装与管理 IM 通道 |
| `pai chats` | REPL 与会话管理 |
| `pai acp` | 为 IDE 提供 stdio ACP 服务 |
| `pai cron` | 管理定时任务 |
| `pai models` | 供应商预设与模型解析 |
| `pai skills` | 按 Agent 启用 / 禁用 Skill |
| `pai plugin` | 安装并管理第三方插件 |
| `pai backup` | 导出 / 恢复备份 |
| `pai clean` | 清理 CLI 状态或清空 `~/.yyc3-pai/` |
| `pai memory slim [--agent ID]` | 通过运行中的宿主备份并精简 SQLite 记忆。[详情](docs/memory-slim.md) |
| `pai update` | 检查并安装更新 |

完整参考：**[docs/cli.md](docs/cli.md)**。

## 🖥️ Web 控制台

`pai run` 启动后访问 **<http://127.0.0.1:8088**。>

- **对话** — 与专家 / 团队实时聊天
- **专家** — 创建专家、选择专家库 / MBTI、共享或发布专家、配置供应商
- **AgentTeams** *（Beta）* — 协调者 + 成员专家协作多步骤任务
- **Connector** — OAuth 应用与 MCP 网关
- **通道** — IM 平台配置
- **定时任务** — 可视化 Cron 管理
- **知识库** — 管理文档语料、语义检索与同实例共享
- **插件** — 安装、启用与配置插件
- **远程桌面** — 控制台内实时看屏与键鼠操控
- **ACP** — 配置出站编程 Agent Runner
- **设置** — 用户、安全、TLS、系统

交互式 API 文档：**<http://127.0.0.1:8088/api/docs**（Scalar）。>

## 📁 数据目录

```
~/.yyc3-pai/                       ← 数据根目录
├── config.json                    # 进程配置（含可选 database 段）
├── yyc3-pai.db                    # 默认 SQLite 控制面（用户、Agent、通道、定时任务 …）
├── secrets/                       # JWT 密钥、通道 Token
├── agents/<agent_id>/             # 各 Agent 工作区（SOUL.md、skills …）
├── security/tool_guard/           # Shell 命令允许 / 拒绝规则
├── logs/                          # 运行日志
├── env                            # 全局环境变量
└── cli_state.json                 # CLI 固定的用户 / Agent
```

控制面也可改用 PostgreSQL（`config.json` → `database`，或 `YYC3_DATABASE_*` / 首次设置向导）。控制面为 PostgreSQL 时，Agent 记忆**默认复用同一 DSN**（per-agent schema）；若需继续用文件记忆，在 agent 配置里设 `"memory": { "backend": { "type": "sqlite" } }`。详见 [docs/configuration.md](docs/configuration.md) 与 [docs/adr/002-database-backends.md](docs/adr/002-database-backends.md)。

## 🏗️ 架构

```
OctopServer
 ├─ DatabasePool         SQLite（WAL）或 PostgreSQL
 ├─ SharedServices       依赖注入根 — 所有 repo 与配置
 ├─ ExpertCatalog        启动时扫描 agents/experts/library/
 ├─ UserManager
 │   └─ HarnessAgentManager（按用户）
 │       └─ AgentRuntime（按 Agent）
 │           ├─ HarnessAgent      Agent 运行时（yyc3-harness）
 │           ├─ HarnessProcessor  IM / UI / 定时任务入口
 │           ├─ ChannelManager    IM 连接（yyc3-gateway）
 │           └─ CronManager       APScheduler
 └─ FastAPI app (uvicorn)
```

单进程架构。重启后从控制面数据库重建状态（默认本地 SQLite；可选 PostgreSQL）。`OctopServer` 等内部类名与 `octop` 包名作为实现标识符保留。

详见 [docs/architecture.md](docs/architecture.md)、[docs/adr/001-single-process-model.md](docs/adr/001-single-process-model.md) 与 [docs/adr/002-database-backends.md](docs/adr/002-database-backends.md)。

### 项目结构

```
src/octop/
  config.py    环境变量配置
  launch.py    OctopServer 启动 + uvicorn
  infra/       业务核心（agents、gateway、cron、db、users …）
  api/         HTTP 层 — FastAPI 路由、JWT、SSE
  cli/         CLI 层 — Click 命令
  dashboard/   构建后的 React SPA（wheel 产物）

dashboard/     前端源码（Vite）— 在此编辑，运行 make build-frontend
docker/        Docker Compose、入口脚本、构建与部署脚本
tests/         unit/ + integration/
```

## 🛠️ 开发

**前置条件：** Python 3.12+、Node 18+、[uv](https://docs.astral.sh/uv/)

```bash
# 后端
make install          # pip install -e ".[dev]"
make all              # format-all + lint + typecheck + test（发布门槛）

# 前端（另开终端）
make dev-frontend     # Vite 开发服务器
make build-frontend   # 生产构建 → src/octop/dashboard/
cd dashboard && npx tsc -b
```

单独执行：`make test`、`make lint`、`make typecheck`、`make format`。

## 🔒 安全与隐私

- **本地优先**：配置、对话、工作区与凭证均存储在 `~/.yyc3-pai/`。
- **多用户隔离**：JWT 认证，按用户隔离 Agent 与工作区。
- **敏感信息脱敏与工具审批**：离开工作区前自动脱敏敏感数据；高风险工具或 Shell 命令需依据护栏规则显式审批。
- **工具护栏**：可在 `~/.yyc3-pai/security/tool_guard/` 编辑 Shell 命令规则。
- **无厂商锁定**：可自由切换 LLM 供应商、存储后端与 IM 通道。

## 🤝 参与贡献

欢迎贡献代码：

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交前运行 `make all`
4. 发起 Pull Request

完整指南见 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题见 [SECURITY.md](SECURITY.md)。模块边界与编码规范见 [AGENTS.md](AGENTS.md)。

## 📋 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)。

## 🔗 相关项目

| 项目 | 描述 |
| ------ | ------ |
| YYC³ Harness（yyc3-harness） | Agent 运行时 — 模型路由、工具、Skill、检查点 |
| YYC³ Gateway（yyc3-gateway） | 多平台 IM 通道桥接 |
| YYC³ Memory（yyc3-memory） | 层级召回与全文搜索 |
| YYC³ Browser（yyc3-browser） | CDP 浏览器自动化，支持 profile 持久登录 |

## 📄 许可证

本项目采用 [MIT License](LICENSE)。
