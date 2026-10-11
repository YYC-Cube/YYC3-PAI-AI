---
name: dgx-catalog
display_name: DGX Spark 语义目录检索
description: Skill to query the NVIDIA-DGX-Workbench semantic catalog (YAML) for DGX Spark deployment guides, NVIDIA skills, NIM models and AI resources. 当用户询问 DGX Spark / GB10 部署、NIM 模型选型、NVIDIA 组件用法或 AI 资源矩阵时触发。优先本地 MCP server 检索，其次直连 raw YAML。
metadata:
  octop:
    emoji: "🧬"
    label:
      zh: "DGX 语义目录"
      en: "DGX Semantic Catalog"
    summary:
      zh: "检索 DGX Spark 语义目录：226 指南 / 401 技能 / 140 NIM 模型 / 196 资源。"
      en: "Query the DGX Spark semantic catalog: 226 guides / 401 skills / 140 NIM models / 196 resources."
version: 1.0.0
tags: [dgx-spark, nim, nvidia, semantic-catalog, mcp]
keywords: [DGX Spark, GB10, NIM, 部署指南, 模型选型, 语义目录, dgx-catalog]
examples:
  - 单机 DGX Spark 怎么部署 DeepSeek
  - 有哪些适合 RAG 的 NIM 模型
  - 查 cuDF GPU 加速的官方技能
---

# DGX Spark 语义目录检索

数据源：YYC-Cube/NVIDIA-DGX-Workbench 的 `catalog/*.yaml`（语义目录 v1）。
两种消费方式，按可用性选择。

## 方式一：本地 MCP server（推荐，已配置时）

Workbench 仓库 `mcp-server/server.py` 暴露 4 个工具，已作为 custom MCP connector
接入本实例时直接调用：

| 工具 | 用途 | 主要过滤参数 |
|------|------|--------------|
| `dgx_search_guides` | 部署指南 | `query`, `category`, `difficulty` |
| `dgx_search_skills` | NVIDIA 技能（含安装命令） | `query`, `category` |
| `dgx_search_nim_models` | NIM 模型选型 | `query`, `category` |
| `dgx_search_resources` | AI 资源矩阵 | `query`, `domain` |

未配置时引导用户（一次性）：

```bash
git clone https://github.com/YYC-Cube/NVIDIA-DGX-Workbench.git ~/NVIDIA-DGX-Workbench
pip install -r ~/NVIDIA-DGX-Workbench/mcp-server/requirements.txt
# 然后在 Dashboard → Connectors → Custom MCP 添加 stdio connector：
#   command: python3
#   args: ["/Users/<user>/NVIDIA-DGX-Workbench/mcp-server/server.py"]
```

## 方式二：直连 raw YAML（零安装兜底）

catalog 每层一个文件，任意 YAML 1.2 解析器可读：

```
https://raw.githubusercontent.com/YYC-Cube/NVIDIA-DGX-Workbench/main/catalog/{guides,skills,nim-models,resources,index}.yaml
```

用 `execute_shell_command` 现查（PAI venv 自带 PyYAML）：

```bash
python3 - <<'EOF'
import urllib.request, yaml
url = "https://raw.githubusercontent.com/YYC-Cube/NVIDIA-DGX-Workbench/main/catalog/nim-models.yaml"
models = yaml.safe_load(urllib.request.urlopen(url, timeout=15))["models"]
hits = [m for m in models if "rag" in str(m).lower() or "检索" in str(m)]
for m in hits[:5]:
    print(m["name"], "|", m["category"], "|", m.get("single_node", ""))
EOF
```

搜索技巧：

- 关键词用**小写**做子串匹配（条目含中英文混合文本）。
- guides 的 `category` 取值：getting-started / inference / ai-application / model-tuning / quantization / cluster / data-science / dev-tools / security 等；`difficulty`：easy / medium / hard。
- resources 的 `domain` 取值：nvidia-official / nvidia-github / nlp-aigc-llm / dev-toolchain / dgx-spark-community / platform-infra。
- nim-models 的 `category` 为「大类名（N款）」格式，如 `大语言模型类（32款）`。

## 回答格式

1. 命中条目列表：名称 + 关键字段（指南给难度/耗时/步骤数；模型给发布方/单机/双机适配；资源给域/链接）。
2. 明确区分**单机**与**双机**适配结论。
3. 附来源条目标识（guide id / model name），便于用户复核。
