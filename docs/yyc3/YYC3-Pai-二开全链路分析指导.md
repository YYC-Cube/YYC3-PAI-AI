---
file: YYC3-Pai-二开全链路分析指导.md
description: 基于 Octop 的 YYC³ 硬分叉项目 YYC3-Pai(π³) 全链路分析指导
author: AI Tutor <YanYuCloudCube>
version: v2.0.0
created: 2026-10-10
updated: 2026-10-10
status: active
tags: [fork],[yyc3-pai],[hard-fork],[i18n],[roadmap]
category: plan
upstream: https://github.com/TencentCloud/Octop
license-upstream: MIT
---

# π³ YYC3-Pai 二开全链路分析指导

> **定名：YYC3-Pai（π³）** — 承 Octop 血统的 YYC³ 硬分叉，AI Family 统一 Agent 内核
> 本文档随分叉仓维护；执行状态速览见 YYC-Cube/Octop 侧同名文档 v2.0.0。

---

## 〇、执行状态速览（2026-10-10）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| Git 硬断开 | ✅ 已执行 | 本地克隆断开 remote，分支 `yyc3/main`，保留完整历史（MIT 合规） |
| 语言包替换 | ✅ 已执行 | sync 管道指向发布源 `~/YYC-Cube/YYC3-i18n-Core`（github: YYC-Cube/YYC3-i18n-Core，npm 3.0.2 同源）；10/10 真实内容各 4 命名空间 |
| Anthropic 技能剥离 | ✅ 已执行 | 提交 `718b114b`，基线 `d88a6bc1`，tag `v0.1.0-yyc3` |
| 品牌改造（pyproject/CLI/镜像） | ✅ 已执行 | pyproject→`yyc3-pai` v0.1.0、CLI→`pai`、显示串品牌化，uv lock 已同步 |
| 四包 Fork-and-Own | ✅ 基线建成 | `yyc3-agent-core` monorepo（发行名 yyc3-*、uv sources 接线闭环、LICENSE/NOTICE 合规），基线提交 `98b9802` |
| Phase 2 依赖换指向 | ✅ 已执行 | 主仓依赖→`yyc3-*` 本地 editable；`self_update._PACKAGE_NAME`→`yyc3-pai`；uv sync 后五包 import + `pai --help` 验证通过 |

## 章节索引

完整章节（背景与输入 / 同类 TOP3 对比 / 命名定案 / Phase 0-6 路线 / 合规红线 / 四包自研可行性 / 语言包替换 / 里程碑 / 快速启动 / 参考来源）见镜像侧文档：
`/Users/yanyu/YYC3-GitHub/YYC-Cube/Octop/YYC3-OctoPAI-二开全链路分析指导.md`（v2.0.0）

本仓内保留核心章节摘要如下。

---

## 四运行时包自研可行性（第六章摘要）

| 包 | 规模 | 自研难度 | 判定 |
| --- | --- | --- | --- |
| octop-memory | 201 文件/5.8 万行，核心零依赖 | ★☆☆☆☆ | 优先 Fork-and-Own → `yyc3-memory` |
| octop-browser | 68 文件/1.5 万行，薄 CDP 封装 | ★★☆☆☆ | 可自研（4 个调用点） |
| octop-gateway | 81 文件/2.6 万行，8 平台 SDK | ★★★★☆ | 与 yyc3-gateway 收敛二选一 |
| octop-harness | 345 文件/7.1 万行，langchain 生态 | ★★★☆☆ | Fork 接管（大脑在 langchain，社区资产） |

关键发现：harness 内部依赖 memory+browser → 四包一起 Fork；memory/browser 版权头 "OrcaKit" 证明派生先例；全部 MIT 活跃维护。

Fork-and-Own 路线：fork 改名（半天）→ monorepo yyc3-agent-core（1 天）→ 主仓依赖换指向+import 改名（2-3 天，调用点 <50）→ 长期收敛。

## 语言包替换（第七章摘要，已执行）

```
YYC3-i18n-Core（npm: @yyc3/i18n-core@3.0.2）← 单一事实源
  → npm run sync:yyc3-locales → dashboard/src/locales/yyc3/*.json（10 语言资产入库）
  → i18next（fallbackLng: en）→ UI 10 语言（ar 支持 RTL）
```

- 4 实语言（en/zh-CN/zh-TW/pt-BR）+ 6 占位（ar/de/es/fr/ja/ko，自动回落英文）
- 后端 `loader.py` locale 动态发现，多语言表扩展就绪

## 合规红线（第五章）

1. 保留原 MIT LICENSE 版权声明（Copyright (c) 2026 Octop）
2. Anthropic 授权四技能（xlsx/pptx/pdf/docx）已剥离，不得回流
3. 不得使用 "Octop"/"TencentCloud" 标识推广
4. 版本线独立：`0.1.0-yyc3` 起

---

> 「***YanYuCloudCube***」
> 「***言启象限 | 语枢未来***」
**© 2025-2026 YanYuCloudCube™. All Rights Reserved.**
