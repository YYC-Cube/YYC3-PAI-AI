# 更新日志 | Changelog

本项目的所有重要变更记录于此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer 2.0.0](https://semver.org/lang/zh-CN/)。
All notable changes are documented here. Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer 2.0.0](https://semver.org/).

> 变更提交申请 changelog submissions: <dev@yanyucloud.com>

## [Unreleased]

### 计划 Planned

- `v1.1.0`: 08 目录工具平台文档双语化 Bilingual pass over dir 08
- `v1.1.0`: PromptEngine 插件注册机制 Plugin registry for PromptEngine

---

## [1.0.0] - 2026-09-16

### Added 新增

- **文档体系**: 14 大目录（00-13）465+ 篇双语开发者文档
  Documentation system: 14 top-level directories, 465+ bilingual documents
- **企业蓝图**: 12 目录五大实战蓝图 + 编写规范/协议栈/可观测性/安全治理/工程手册（120601-121105 25 篇细则）
  Enterprise blueprints: five battle blueprints + 25 detailed guides (120601-121105)
- **代码示例**: 13 目录 1300-1309 参考实现（提示词引擎/BaseAgent/AI-Family 八智能体/MCP/A2A/内容过滤/遥测/能力建设）
  Code examples: 1300-1309 reference implementations (PromptEngine/BaseAgent/AI-Family eight agents/MCP/A2A/ContentFilter/Telemetry/Capability)
- **CI/CD**: GitHub Actions 三工作流（ci/release/docs）+ 分支保护 + 制品管理
  CI/CD: three GitHub Actions workflows (ci/release/docs) + branch protection + artifact management
- **仓库规范**: 标签体系 / Issue-PR 模板 / 贡献指南 / 安全策略 / 行为准则
  Repo governance: label system / Issue-PR templates / contributing guide / security policy / code of conduct

### Fixed 修复

- 编号统一：`1304` 唯一对应 AI-Family-Agent，「能力建设智能化」迁移至 `1309`
  Numbering unified: `1304` exclusively maps to AI-Family-Agent; Capability moved to `1309`

### Security 安全

- 全库注入样本基线（50 条）+ 三级内容过滤 + 安全 System Prompt 模板
  Repo-wide injection baseline (50 samples) + 3-tier content filter + secure System Prompt template

---

## 版本语义 | Versioning Semantics

| 变更类型 Change | 版本位 Bump |
| ---------------- | ------------- |
| 破坏性变更 Breaking | MAJOR |
| 新功能/新文档 Feature/Docs addition | MINOR |
| 缺陷修复/笔误 Bug fix/Typos | PATCH |

> 发布由 `v*.*.*` 标签自动触发 Release 流水线；变更条目在合并时由维护者汇总。
> Releases auto-trigger on `v*.*.*` tags; entries are aggregated by maintainers at merge time.

[Unreleased]: https://github.com/YanYuCloudCube/YYC3-Prompt-Engineering/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YanYuCloudCube/YYC3-Prompt-Engineering/releases/tag/v1.0.0

---

<div align="center">

**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司 · Yanyu Intelligent Technology Co., Ltd.

</div>
