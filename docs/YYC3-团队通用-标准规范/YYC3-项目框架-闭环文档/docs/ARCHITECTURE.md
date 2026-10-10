# 架构总览 | Architecture Overview

> 版本 v1.0.0 · 2026-09-16 · 维护者 docs@yanyucloud.com

## 一、三层双轮驱动 | Three-Layer Dual-Wheel Drive

```mermaid
graph TB
  subgraph L1["🚪 应用层 Application · 00-10 · 提示词工程之轮 Prompt Wheel"]
    A00["00 模版总览"] --> A01["01 理论"] --> A02["02 设计"] --> A03["03 开发"] --> A04["04 质量"] --> A05["05 安全"] --> A06["06 运维"] --> A07["07 案例"] --> A08["08 工具"] --> A09["09 演进"] --> A10["10 文库"]
  end
  subgraph L2["🏗️ 模型层 Model · 11 · 模型与推理架构"]
    M11["110+ 篇<br/>架构/预训/微调/推理"]
  end
  subgraph L3["🚀 实战层 Practice · 12-13 · AI 工程化之轮 Engineering Wheel"]
    D12["12 企业蓝图<br/>1200-1213 · 66 篇"]
    D13["13 代码示例<br/>1300-1309"]
  end
  L1 -->|"方法论沉淀 methodology"| L2
  L2 -->|"能力供给 capability"| L3
  D12 -.->|"why 文档讲原理"| D13
  D13 -.->|"how 代码给实现"| D12
```

## 二、13 目录代码资产图 | Directory 13 Code Assets

```mermaid
graph LR
  subgraph CORE["核心基础设施 Core · 1300/1301"]
    PE["PromptEngine<br/>CO-STAR + CRAFT"]
    DR["分布式推理<br/>master-worker"]
  end
  subgraph BIZ["业务场景 Business · 1302/1303/1309/1305"]
    SC["场景三件套<br/>inference + api + compose"]
  end
  subgraph FAM["AI-Family · 1304"]
    BA["BaseAgent 契约"]
    AG8["八智能体实现"]
  end
  subgraph PLAT["平台组件 Platform · 1306/1307/1308"]
    MCP["MCP 工具连接"]
    A2A["A2A 六状态机"]
    CF["内容三级过滤"]
    ZT["零信任网关"]
    TEL["OTel 遥测"]
  end
  PE --> AG8
  BA --> AG8
  AG8 --> MCP & A2A
  MCP & A2A --> CF
  CF --> ZT
  AG8 --> TEL
  SC --> PE
```

## 三、关键设计决策 | Key Design Decisions

| 决策 Decision | 选择 Choice | 理由 Rationale |
|---------------|------------|----------------|
| Agent 通信 | A2A 星型拓扑（经元启编排） | 集中治理、审计单点、避免网状依赖 Hub governance & audit |
| 工具接入 | MCP 标准协议 | 生态即插即用 Plug-and-play ecosystem |
| 身份安全 | SPIFFE ID + SVID 短期证书 | 零信任、1h 自动轮换 Zero-trust, auto-rotation |
| 观测标准 | OTel + W3C Trace | 厂商中立 Open standards |
| 提示词质量 | CO-STAR 结构 + CRAFT 五维量化 | 可评审、可回归 Reviewable & regression-able |
| 文档语言 | 中文在上/英文在下双语 | 中文为母本，英文为传播面 Bilingual by design |

## 四、目录编号规则 | Numbering Convention

- **四位数目录**: `1300-1309`（13 章模块）、`00-13`（顶级章节）
  Four-digit module codes; two-digit top-level chapters
- **六位数文档**: `120601` = 目录 `12` + 子目录 `06` + 序号 `01`
  Six-digit doc ID = chapter + subdirectory + sequence
- **唯一性红线**: 一个编号只对应一个模块（参考 `1304`/`1309` 拆分先例）
  One code, one module (see the 1304/1309 split precedent)

---

<div align="center">**® YANYUCLOUDCUBE** · © 2025-2026 言语（河南）智能科技有限公司</div>
