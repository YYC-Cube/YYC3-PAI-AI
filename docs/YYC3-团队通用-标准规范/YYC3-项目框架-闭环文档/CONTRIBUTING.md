# 贡献指南 | Contributing Guide

> 感谢您对 YANYUCLOUDCUBE 开源生态的关注！本指南帮助您快速完成第一次贡献。
> Thanks for your interest in contributing to YANYUCLOUDCUBE! This guide gets your first PR merged fast.

---

## 1. 快速通道 | Fast Path

```bash
# 1. Fork & Clone
git clone https://github.com/<your-fork>/YYC3-Prompt-Engineering.git
cd YYC3-Prompt-Engineering

# 2. 开发环境
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pre-commit install            # ruff · mypy · gitleaks 三闸 three gates

# 3. 分支 & 开发
git checkout -b feat/your-topic develop

# 4. 本地门禁（与 CI 同款 same gates as CI）
make lint && make test

# 5. 提交并推送（Conventional Commits）
git commit -m "feat(1306): add A2A retry policy for transient errors"
git push origin feat/your-topic
# 6. 在 GitHub 上开 PR，按模板勾选标签与检查单
```

---

## 2. 环境要求 | Prerequisites

| 依赖 Dependency | 版本 Version | 必需 Required |
|-----------------|-------------|:---:|
| Git | 2.40+ | ✅ |
| Python | 3.10+ | ✅ |
| Node.js + pnpm | 18+ / 8+ | ⬜（文档构建 docs build） |
| Docker | 24+ | ⬜（镜像验证 image testing） |
| GNU Make | 4.0+ | ✅ |

---

## 3. 分支模型 | Branching Model

```
main (protected)      ←─ release PR only 仅接受发布 PR
 └── develop          ←─ 集成分支 integration branch
      ├── feat/*      功能开发 features
      ├── fix/*       缺陷修复 bug fixes
      ├── docs/*      文档 documentation
      ├── perf/*      性能 performance
      ├── ci/*        流水线 pipeline
      └── refactor/*  重构 refactoring
```

- `main` 与 `develop` 受分支保护（必需检查 + 审批），禁止 force-push。
  `main` and `develop` are protected (required checks + approvals); force-push disabled.
- 功能分支生命周期 ≤ 2 周，过期请 rebase onto `develop`。
  Feature branches live ≤ 2 weeks; rebase onto `develop` when stale.

---

## 4. 提交规范 | Commit Convention

遵循 **Conventional Commits**，CI 将校验提交信息格式：

```text
<type>(<scope>): <subject>

<body 可选 optional>
<footer 可选 optional>   # e.g. BREAKING CHANGE: migration note / Closes #123
```

| type | 用途 Usage | 对应标签 Label |
|------|-----------|----------------|
| `feat` | 新功能 new feature | `feature` |
| `fix` | 缺陷修复 bug fix | `bug` |
| `docs` | 文档 documentation | `documentation` |
| `perf` | 性能 performance | `performance` |
| `refactor` | 重构（不改行为）refactor w/o behavior change | `enhancement` |
| `test` | 测试 tests | — |
| `ci` | 流水线 pipeline | `ci` |
| `chore` | 杂项 chores | — |

**scope 建议 suggested scopes**: 目录编号（`1300`/`1304`/`1306`…）、`infra`、`docs`。

---

## 5. 标签使用 | Labels

提交 Issue / PR 时请按 [`docs/LABELS.md`](./docs/LABELS.md) 选择标签：
**1 类型 + 1 模块 + 1 优先级**（Issue），**1 类型 + 1 模块**（PR）。
Pick labels per [`docs/LABELS.md`](./docs/LABELS.md): type + module + priority for Issues; type + module for PRs.

---

## 6. PR 检查单 | PR Checklist

- [ ] 分支基于最新 `develop`，提交符合 Conventional Commits
- [ ] `make lint && make test` 本地通过（coverage ≥ 80%）
- [ ] PR 标题、描述完整，已选类型/模块标签
- [ ] 涉及文档时同步更新（双语：中文在上，英文在下）
- [ ] `breaking-change` 已附迁移说明并叠加高优先级标签
- [ ] 不包含密钥/凭证（gitleaks 闸强制拦截）
- [ ] 新增代码有对应测试；修复附回归用例
- [ ] 大型变更（>500 行）已开 Issue 先行对齐设计

> CI 全绿后 @ 维护者 review；两人批准后由维护者 squash merge。
> After green CI, request review; maintainer squash-merges after 2 approvals for breaking changes, 1 otherwise.

---

## 7. 文档贡献规范 | Documentation Standards

1. **双语对照**：中文段落在上，English 在下；代码块/图表/标签名保持英文。
   Bilingual: Chinese first, English second; code/diagrams/labels in English.
2. **frontmatter**：新增 md 文档需带 YAML 元数据（file/description/author/version/created/updated/status/tags/category）。
   New md files must include YAML frontmatter (file/description/author/version/created/updated/status/tags/category).
3. **编号规则**：内容文档用六位编号（如 `120601-xxx.md`）；模块 README 固定命名 `README.md`。
   Six-digit numbering for content docs (`120601-xxx.md`); module index files are always `README.md`.
4. **图表**：优先 Mermaid；配色与命名遵循 [`docs/STYLE-GUIDE.md`](./docs/STYLE-GUIDE.md)。
   Prefer Mermaid; colors & naming per [`docs/STYLE-GUIDE.md`](./docs/STYLE-GUIDE.md).
5. **链接**：站内相对链接；CI 文档构建零死链门禁。
   Relative links inside the site; zero-dead-link gate in docs CI.

---

## 8. 报告缺陷 | Reporting Bugs

使用 [Bug Report 模板](./.github/ISSUE_TEMPLATE/bug_report.yml)并附：复现步骤 / 期望行为 / 实际行为 / 环境信息 / 日志（脱敏）。
Use the [Bug Report template](./.github/ISSUE_TEMPLATE/bug_report.yml) with steps / expected / actual / environment / sanitized logs.

安全漏洞请勿走公开 Issue——参见 [`SECURITY.md`](./SECURITY.md)。
Do **not** open public issues for security vulnerabilities — see [`SECURITY.md`](./SECURITY.md).

---

## 9. 行为准则 | Code of Conduct

参与本项目即表示您同意 [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)。
By participating, you agree to abide by [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

---

## 10. 联系 | Contact

| 事项 Topic | 邮箱 Email |
|-----------|------------|
| 开发问题 Development | dev@yanyucloud.com |
| 文档 Documentation | docs@yanyucloud.com |
| 技术支持 Support | support@yanyucloud.com |
| 安全 Security | sec@yanyucloud.com |

---

<div align="center">

**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司 · Yanyu Intelligent Technology Co., Ltd.

</div>
