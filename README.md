<p align="center">
  <img src="public/yyc3-family.png" alt="YYC3-Pai Family" />
</p>

<p align="center">
  <strong>A smarter, self-hosted AI assistant — multi-user, multi-agent.</strong>
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
  <a href="#-highlights">Highlights</a> ·
  <a href="#-overview">Overview</a> ·
  <a href="#-core-technology">Core Technology</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-roadmap">Roadmap</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-contents">Contents</a>
</p>

<p align="center">
  <b>English</b> · <a href="README_CN.md">中文</a>
</p>

---

**YYC3-Pai (YYC π³)** is an open-source, self-hosted AI assistant maintained by [YanYuCloudCube](https://github.com/YYC-Cube). It's not just a tool — it's a digital assistant that can operate in parallel. Through its multi-agent architecture, it builds an intelligent environment that is both independent and collaborative for teams, families, and individuals. Best of all, it runs entirely on your machine — the fully self-hosted design means privacy is never a compromise, while single-process startup makes the powerful web console, CLI, and IM integrations readily accessible.

Chat through the Web Dashboard, Feishu, DingTalk, QQ, WeChat, Telegram, Discord, WeCom, or programmatic HTTP/SSE/WebSocket. Extend capabilities with the **expert library**, **Connectors** (OAuth + MCP), and **ACP** integration for IDE workflows.

> YYC3-Pai is a hard fork of the upstream [Octop](https://github.com/TencentCloud/Octop) project. See [LICENSE](LICENSE) and the source history for upstream attribution.

## ✨ Highlights

| | Feature | Description |
| --- | --------- | ------------- |
| 👥 | **Multi-user expert team** | One admin, shared household; built-in expert library and expert market — switch specialists per scenario |
| 🤝 | **Expert sharing** | Publish experts and shared skill/sub-agent pools so teammates reuse proven setups instead of rebuilding them |
| 🎭 | **MBTI personas** | 16 personality templates plus an interactive quiz — give each agent a distinct character |
| 🎯 | **AgentTeams** *(Beta)* | A coordinator schedules multiple experts on multi-step work; [details](docs/expert-teams.md) |
| 🔒 | **Security built-in** | JWT multi-user isolation, tool approval, shell command guardrails, and PII redaction — data stays local |
| 🔌 | **Connector ecosystem** | Docs, Meeting, News and other connectors; OAuth and MCP gateway extend resource boundaries |
| 💾 | **Pluggable workspace backends** | Local disk, Docker sandbox, PostgreSQL, or COS/S3 for agent files — separate from the control-plane DB |
| 🧠 | **Portable memory** | Powered by YYC³ Memory (yyc3-memory); memory migrates with the workspace |
| 📚 | **Knowledge base** | RAG over your documents; share corpora within a deployment and ground answers in your private data |
| 🧩 | **Plugins** | Extend YYC3-Pai with third-party plugins; bundled plugins are seeded and toggled on demand |
| ↔️ | **ACP bidirectional** | `pai acp` for IDE/terminal AI; delegate to OpenCode / Claude Code with permission gates |
| 💻 | **Terminal AI+** | Interactive shell in the browser — AI-assisted command execution and troubleshooting |
| 🌐 | **Browser AI+** | Headless Chromium sessions for web automation, screenshots, and remote browsing |
| 🖥️ | **Remote desktop** | Live screen and input from the dashboard on Linux, Windows, and macOS — remote office work and GUI apps; one-click isolated desktop on headless Linux |
| 🏠 | **Self-hosted** | Dashboard, CLI, IM channels, and cron in one `pai run` — all data under `~/.yyc3-pai/` |

## 📌 Overview

YYC3-Pai is a self-hosted AI assistant platform for households and small teams. It runs a single process that serves a web dashboard, a CLI, IM channels (Feishu, DingTalk, QQ, WeChat, Telegram, Discord, WeCom, and more), and cron automation — all sharing one control-plane database under `~/.yyc3-pai/` (SQLite by default, file `yyc3-pai.db`; PostgreSQL optional).

> YYC3-Pai's design goal: keep every conversation, workspace, and credential on your own machine, while giving each user a personal team of specialized agents they can switch between per task.

<details>
<summary>What can you do with YYC3-Pai</summary>

- **Personal assistant** — let a dedicated agent write weekly reports, organize notes, and manage your schedule; memory persists with the workspace.
- **Family sharing** — one admin account, the whole household; assign different agents and experts per member; share experts and knowledge bases when useful.
- **Team helper** — AgentTeams or parallel agents, bridging Feishu / DingTalk / WeCom / WeChat to route tasks into group chats.
- **Developer boost** — delegate coding tasks to OpenCode / Claude Code via ACP, or troubleshoot from the terminal with AI assistance.
- **Web automation** — use Browser AI+ and remote desktop for forms, screenshots, and GUI apps.
- **Scheduled tasks** — configure cron in natural language so the agent pushes or runs jobs on time every day.

</details>

## 🧠 Core Technology

| Layer | Technology |
| ------- | ----------- |
| **Language** | Python 3.12+ |
| **Web framework** | FastAPI + uvicorn |
| **Agent runtime** | YYC³ Harness (yyc3-harness) |
| **Gateway** | YYC³ Gateway (yyc3-gateway) |
| **Control plane DB** | SQLite (WAL, default) or PostgreSQL (optional) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Scheduling** | APScheduler |
| **ACP** | agent-client-protocol |
| **Build / quality** | hatchling · ruff · mypy · pytest |

YYC3-Pai is built on the YYC³ Harness stack — a set of focused runtimes it composes into one process:

- **YYC³ Harness (yyc3-harness)** — Agent runtime: model routing, tools, skills, and conversation checkpointing.
- **YYC³ Gateway (yyc3-gateway)** — multi-platform IM channel bridge that normalizes incoming messages into a single processing pipeline.
- **YYC³ Memory (yyc3-memory)** — hierarchical recall with full-text search, so an agent's memory travels with its workspace.
- **YYC³ Browser (yyc3-browser)** — CDP-based browser automation with persistent profiles for web tasks.

Instead of an external queue or message broker, YYC3-Pai routes every surface — Web UI, IM, and cron — through one in-process processor. The result is a single, restart-safe process whose entire state is rebuilt from the control-plane database on boot (local SQLite by default; PostgreSQL optional).

## 🤔 Features

### Server & auth

- Multi-user JWT authentication with admin role
- First-run setup wizard (`pai init`)
- Interactive API docs at `/api/docs` (Scalar)

### Experts

- Multiple experts per user; each has its own workspace, providers, channels, and cron
- 16 MBTI persona templates + custom system prompt
- Expert library scanned at boot (`infra/agents/experts/library/`); expert market and in-deployment expert sharing
- **AgentTeams** *(Beta)* — coordinator + member experts for multi-step tasks ([docs/expert-teams.md](docs/expert-teams.md))
- Workspace backends (expert files): local disk, Docker sandbox, PostgreSQL, COS/S3, and other remote stores — distinct from the control-plane database

### Channels & automation

- IM channels: Feishu, DingTalk, QQ, WeChat, Telegram, Discord, WeCom, and more
- Proactive cron jobs with natural-language and slash-command triggers
- Unified message processing across Web UI, IM, and cron surfaces

### Surfaces

- **Web dashboard** — chat, experts / teams, connectors, channels, cron, knowledge, plugins, settings
- **CLI** — `pai run`, `pai chats`, `pai acp`, admin commands
- **HTTP/SSE/WebSocket API** — full programmatic access
- **Remote desktop** — dashboard control of the host desktop session

### Knowledge & plugins

- **Knowledge base** — RAG over your documents; optional sharing within the same deployment
- **Plugins** — install and manage third-party plugins (`pai plugin`); bundled plugins are seeded and toggled on demand from the dashboard

### ACP (Agent Client Protocol)

YYC3-Pai supports ACP in two directions:

1. **Inbound** — external tools use **your** YYC3-Pai agent

   ```bash
   pai acp --agent main   # stdio ACP server for Zed, OpenCode, …
   ```

2. **Outbound** — YYC3-Pai delegates to external coding agents
   - Dashboard → **ACP** (`/acp`): configure runners (global per user)
   - Enable **acp_runner** per agent, then delegate in chat

Built-in outbound runners include OpenCode, CodeBuddy, Claude Code, and Codex.

Full setup: **[docs/acp.md](docs/acp.md)**.

## 🧭 Roadmap

Here are mid-to-long term plans:

**Shipped**

- [x] **Shared resource pool** — a central pool of skills and sub-agents that any user can drop into a new expert without rebuilding from scratch.
- [x] **Expert sharing** — publish your experts to other users in the same deployment, so good configurations are reused instead of recreated.

**In progress**

- [ ] **AgentTeams** *(Beta)* — let one coordinator autonomously schedule and orchestrate multiple experts to tackle multi-step tasks.
- [ ] **Self-evolution** — distill conversations into reusable skills, so the assistant grows with you.

**Planned**

- [ ] **Browser & terminal polishing** — browser workflow *recording* (capture and replay as a skill) and a more capable terminal AI assistant.
- [ ] **Project** — project-scoped workspaces that group agents, files, and conversations around a shared goal.
- [ ] **Cloud–edge continuum** — run YYC3-Pai locally while offloading selected tasks to the cloud, so light work stays on-device and heavier jobs use remote capacity when you need it.
- [ ] **Conversational control plane** — deepen YYC3-Pai's own skills so chat can cover the full dashboard surface: create experts, wire channels, manage knowledge bases, and scaffold plugins end-to-end.

This roadmap may shift as the project grows; treat it as indicative only.

## 🚀 Quick Start

### Prerequisites

- **macOS / Linux / Windows**
- [uv](https://docs.astral.sh/uv/) and Python 3.12+
- A modern multi-core CPU with a few GB of RAM for the process plus model/embedding caches; enough disk for the database, agent workspaces, and document corpora

### 1. Install from source

```bash
git clone https://github.com/YYC-Cube/YYC3-PAI-AI.git
cd YYC3-PAI-AI
uv sync                       # provision an isolated venv and install dependencies
```

Optional extras (local ONNX embedding models):

```bash
uv sync --extra local-embedding
```

For browser automation, install Chromium:

```bash
uv run playwright install chromium
```

### 2. Initialize

```bash
uv run pai init
```

The interactive wizard creates the SQLite database, JWT secret, and first admin account under `~/.yyc3-pai/`.

### 3. Run

```bash
# Foreground (API + Web dashboard)
uv run pai run

# Custom host / port
uv run pai run --host 0.0.0.0 --port 8088

# Register as a system service (systemd / launchd / Windows service)
uv run pai service start
```

Open **<http://127.0.0.1:8088>**. The interactive setup asks you to choose a password (≥8 characters, letters and digits).

### Docker (recommended for production)

```bash
# Build and start
docker compose -f docker/docker-compose.yml up -d
```

Open `http://localhost:8088`. First boot creates the admin account and writes the credentials to the container data volume. Set `YYC3_DEFAULT_PASSWORD` to pin the first-run password; unset a strong random password is generated. Override the username via `YYC3_ADMIN_USERNAME`.

> **Password policy:** at least 8 characters with letters and digits.

| Variable | Default | Description |
| ---------- | --------- | ------------- |
| `YYC3_PORT` | `8088` | HTTP listen port |
| `YYC3_DEFAULT_PASSWORD` | *(unset)* | First-run admin password (Docker bootstrap). Unset = random password written to the data volume |
| `YYC3_ADMIN_USERNAME` | `admin` | First-run admin username |
| `YYC3_PAI_HOME` | `~/.yyc3-pai` | Data root (compose bind mount) |

Environment variables use the `YYC3_` prefix; legacy `OCTOP_*` variables remain supported as a fallback. See [`.env.example`](.env.example) for the full list.

## 📑 Contents

- [Highlights](#-highlights)
- [Overview](#-overview)
- [Core Technology](#-core-technology)
- [Features](#-features)
- [Roadmap](#-roadmap)
- [Quick Start](#-quick-start)
- **Architecture & Dev**
  - [Configuration](#️-configuration)
  - [CLI reference](#-cli-reference)
  - [Data directory](#-data-directory)
  - [Architecture](#-architecture)
  - [Development](#-development)
- **Project Info**
  - [Security & privacy](#-security--privacy)
  - [Contributing](#-contributing)
  - [Changelog](#-changelog)
  - [Related projects](#-related-projects)
  - [License](#-license)

### 🗂️ Documentation center

| | Doc | What's inside |
| --- | ----- | --------------- |
| 🏗️ | [Architecture](docs/architecture.md) | Single-process model, module map, boot sequence |
| ⚙️ | [Configuration](docs/configuration.md) | `config.json`, env vars, database backends, TLS |
| ⌨️ | [CLI reference](docs/cli.md) | Every `pai` subcommand with examples |
| 🔌 | [API](docs/api.md) | HTTP / SSE / WebSocket endpoints behind `/api` |
| 💬 | [User guide](docs/user-guide.md) | Dashboard walkthrough, step by step |
| 🎭 | [Personas](docs/personas.md) | MBTI templates and expert personas |
| 🤝 | [Expert teams](docs/expert-teams.md) | AgentTeams coordinator / member design |
| 🔗 | [ACP](docs/acp.md) | Bidirectional IDE & coding-agent integration |
| 🌉 | [Bridge](docs/bridge.md) | Link two instances for remote experts |
| 📡 | [Workspace file I/O](docs/agent-backend-file-io.md) | Storage backends, Docker sandbox, path rules |
| 🧠 | [Memory slim](docs/memory-slim.md) | Shrink agent memory safely |
| 🔐 | [LDAP](docs/ldap.md) | Directory login & provisioning |
| 📻 | [Discord channel](docs/discord-channel.md) | Bot setup & testing |
| 📚 | [Versioned history](docs/versioned-history.md) | Conversation archive internals |

## ⚙️ Configuration

All runtime state lives in `~/.yyc3-pai/`. Manage it via CLI or edit files directly.

```bash
# LLM providers and models
pai models
pai provider list

# IM channels
pai channel list

# Skills (per agent)
pai skills list --agent main

# Cron jobs
pai cron list
pai cron create --help

# Users (admin)
pai user list
```

### Supported LLM providers

OpenAI-compatible APIs, DashScope (Qwen), Ollama, and other presets — configure per agent in the dashboard or via `pai provider`.

### Supported channels

| Channel | Credentials |
| --------- | ------------- |
| **Feishu** | App ID, App Secret |
| **DingTalk** | App Key, App Secret |
| **QQ** | Bot AppID, Token |
| **WeChat** | QR bind / account credentials; [CLI](docs/cli.md) |
| **Telegram** | Bot Token |
| **Discord** | Bot Token; optional channel/DM allowlists; [setup and testing](docs/discord-channel.md) |
| **WeCom** | Corp ID, Agent Secret |
| **Web Dashboard** | Enabled by default |

## 📖 CLI reference

| Command | Description |
| --------- | ------------- |
| `pai init` | Bootstrap `~/.yyc3-pai/` (DB, admin, JWT secret) |
| `pai run` | Start YYC3-Pai in the foreground |
| `pai service start` | Install and start as a system service |
| `pai service stop` | Stop the system service |
| `pai agent` | Create, list, start/stop agents |
| `pai channel` | Install and manage IM channels |
| `pai chats` | REPL and session management |
| `pai acp` | Stdio ACP server for IDE integration |
| `pai cron` | Manage scheduled tasks |
| `pai models` | Provider presets and model resolution |
| `pai skills` | Enable/disable per-agent skills |
| `pai plugin` | Install and manage third-party plugins |
| `pai backup` | Export / restore backups |
| `pai clean` | Remove CLI state or wipe `~/.yyc3-pai/` |
| `pai memory slim [--agent ID]` | Back up and slim SQLite memory through the running host. [Details](docs/memory-slim.md) |
| `pai update` | Check for and install updates |

Full reference: **[docs/cli.md](docs/cli.md)**.

## 🖥️ Web dashboard

After `pai run`, open **<http://127.0.0.1:8088>**.

- **Chat** — real-time conversation with experts and teams
- **Experts** — create experts, pick templates / MBTI personas, share or publish experts, configure providers
- **AgentTeams** *(Beta)* — coordinator + member experts for multi-step work
- **Connectors** — OAuth apps and MCP gateways
- **Channels** — IM platform setup
- **Cron** — visual cron job management
- **Knowledge base** — manage document corpora, semantic retrieval, and in-deployment sharing
- **Plugins** — install, enable, and configure plugins
- **Remote desktop** — live screen and input from the dashboard
- **ACP** — configure outbound coding-agent runners
- **Settings** — users, security, TLS, system

Interactive API docs: **<http://127.0.0.1:8088/api/docs>** (Scalar).

## 📁 Data directory

```
~/.yyc3-pai/                       ← data root
├── config.json                    # process config (optional database section)
├── yyc3-pai.db                    # SQLite — users, agents, channels, cron, …
├── secrets/                       # JWT secret, channel tokens
├── agents/<agent_id>/             # per-agent workspace (SOUL.md, skills, …)
├── security/tool_guard/           # shell command allow/deny rules
├── logs/                          # runtime logs
├── env                            # global environment variables
└── cli_state.json                 # pinned CLI user / agent
```

The control plane can also use PostgreSQL — set `database` in `config.json`, via `YYC3_DATABASE_*`, or the first-run wizard. With PostgreSQL, agent memory reuses the same DSN by default (per-agent schema); to keep file-based memory, set `"memory": { "backend": { "type": "sqlite" } }` in the agent config. See [docs/configuration.md](docs/configuration.md) and [docs/adr/002-database-backends.md](docs/adr/002-database-backends.md).

## 🏗️ Architecture

```
OctopServer
 ├─ DatabasePool            SQLite (WAL) or PostgreSQL
 ├─ SharedServices          DI root — every repo + config
 ├─ ExpertCatalog           scans agents/experts/library/ at boot
 ├─ UserManager
 │   └─ HarnessAgentManager (per user)
 │       └─ AgentRuntime (per agent)
 │           ├─ HarnessAgent      Agent runtime (yyc3-harness)
 │           ├─ HarnessProcessor  IM / UI / cron entry point
 │           ├─ ChannelManager    IM connections (yyc3-gateway)
 │           └─ CronManager       APScheduler
 └─ FastAPI app (uvicorn)
```

Single process. Restart rebuilds state from the control-plane database (local SQLite by default; PostgreSQL optional). Internal class/module names such as `OctopServer` and the `octop` package are kept as implementation identifiers.

See [docs/architecture.md](docs/architecture.md), [docs/adr/001-single-process-model.md](docs/adr/001-single-process-model.md), and [docs/adr/002-database-backends.md](docs/adr/002-database-backends.md).

### Project layout

```
src/octop/
  config.py    env-var config
  launch.py    OctopServer boot + uvicorn
  infra/       business core (agents, gateway, cron, db, users, …)
  api/         HTTP layer — FastAPI app, routers, JWT, SSE
  cli/         CLI layer — Click commands
  dashboard/   built React SPA (wheel artifact)

dashboard/     frontend source (Vite) — edit here, run make build-frontend
docker/        Docker Compose, entrypoint, build & deploy scripts
tests/         unit/ + integration/
```

## 🛠️ Development

**Prerequisites:** Python 3.12+, Node 18+, [uv](https://docs.astral.sh/uv/)

```bash
# Backend
make install          # pip install -e ".[dev]"
make all              # format-all + lint + typecheck + test (ship bar)

# Frontend (separate terminal)
make dev-frontend     # Vite dev server
make build-frontend   # production build → src/octop/dashboard/
cd dashboard && npx tsc -b
```

Individual targets: `make test`, `make lint`, `make typecheck`, `make format`.

## 🔒 Security & privacy

- **Local-first**: Config, chats, workspaces, and credentials live under `~/.yyc3-pai/` on your machine.
- **Multi-user isolation**: JWT auth with per-user agents and workspaces.
- **PII redaction & tool approval**: sensitive data is redacted before it leaves the workspace, and risky tools or shell commands require explicit approval under the guardrail rules.
- **Tool guardrails**: User-editable shell command rules under `~/.yyc3-pai/security/tool_guard/`.
- **No vendor lock-in**: Swap LLM providers, storage backends, and channels without rewriting agents.

## 🤝 Contributing

Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run `make all` before submitting
4. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Security issues: [SECURITY.md](SECURITY.md). Module boundaries and coding conventions: [AGENTS.md](AGENTS.md).

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## 🔗 Related projects

| Project | Description |
| --------- | ------------- |
| YYC³ Harness (yyc3-harness) | Agent runtime — model routing, tools, skills, checkpointing |
| YYC³ Gateway (yyc3-gateway) | Multi-platform IM channel bridge |
| YYC³ Memory (yyc3-memory) | Hierarchical recall and FTS search |
| YYC³ Browser (yyc3-browser) | CDP browser automation with persistent profiles |

## 📄 License

This project is licensed under the [MIT License](LICENSE).
