/**
 * @file local-model-infra.ts
 * @description 本地模型基础设施层 — 多端点发现/健康检测/能力分类
 * 基于实际硬件资产: MacBook M4 Max + 2×DGX Spark + NAS + Cloud
 * @author YYC³ Team
 * @version v2.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status stable
 */

import { createLogger } from './logger'

void createLogger('local-model-infra')

// ===== 模型能力分类 =====
export type ModelCapability =
  | 'chat'          // 通用对话
  | 'reasoning'     // 深度推理
  | 'vision'        // 图像理解
  | 'embedding'     // 文本嵌入
  | 'reranker'      // 重排序
  | 'image-gen'     // 图像生成
  | 'video-gen'     // 视频生成
  | 'code'          // 代码生成
  | 'audio'         // 音频
  | 'finetune'      // 微调模型

/** 模型节点（运行推理服务的硬件节点） */
export interface ModelNode {
  id: string
  name: string
  host: string
  port: number
  type: 'local' | 'dgx' | 'nas' | 'cloud'
  status: 'unknown' | 'online' | 'offline'
  latencyMs?: number
  lastChecked?: number
  models?: DetectedModel[]
  /** SSH 连接信息 */
  ssh?: {
    user: string
    port: number
    identityFile: string
  }
  /** 模型存储路径 */
  modelPaths?: string[]
  /** 节点描述 */
  description?: string
}

/** 检测到的模型 */
export interface DetectedModel {
  name: string
  size: string
  quantization?: string
  capabilities: ModelCapability[]
  nodeId: string
  status: 'online' | 'offline'
  /** 物理存储路径（如有） */
  path?: string
  /** 是否为微调模型 */
  isFinetuned?: boolean
}

// ===== 节点预定义配置 =====
// 基于 ~/.ssh/config 和实际硬件拓扑
export const NODE_CONFIGS: Omit<ModelNode, 'status' | 'latencyMs' | 'lastChecked' | 'models'>[] = [
  // ── 本机 MacBook M4 Max ──
  {
    id: 'mac-local',
    name: 'MacBook M4 Max',
    host: 'localhost',
    port: 11434,
    type: 'local',
    ssh: { user: 'yanyu', port: 22, identityFile: '~/.ssh/yyc3_ed25519' },
    modelPaths: ['/Volumes/Max/models'],
    description: '主开发机 · Ollama 服务',
  },
  // ── NVIDIA DGX Spark #1 ──
  {
    id: 'dgx-spark-1',
    name: 'DGX Spark #1',
    host: '192.168.3.101',
    port: 11434,
    type: 'dgx',
    ssh: { user: 'yyc3', port: 22, identityFile: '~/.ssh/yyc3_dgx' },
    modelPaths: ['/models'],
    description: '双机互联-节点1 · Ollama 服务',
  },
  // ── NVIDIA DGX Spark #2 ──
  {
    id: 'dgx-spark-2',
    name: 'DGX Spark #2',
    host: '192.168.3.102',
    port: 11434,
    type: 'dgx',
    ssh: { user: 'yyc3', port: 22, identityFile: '~/.ssh/yyc3_dgx' },
    modelPaths: ['/models'],
    description: '双机互联-节点2 · Ollama 服务',
  },
  // ── NAS 服务器 (Synology) ──
  {
    id: 'nas-main',
    name: 'NAS (Synology)',
    host: '192.168.3.45',
    port: 11434,
    type: 'nas',
    ssh: { user: 'YYC', port: 9557, identityFile: '~/.ssh/id_ed25519' },
    modelPaths: [
      '/Volume1/yyc3_hd/data',
      '/Volume2/docker/models',
    ],
    description: '存储服务器 · Docker Ollama',
  },
  // ── 阿里云 ECS #33 ──
  {
    id: 'cloud-33',
    name: '阿里云 ECS #33',
    host: '39.97.53.176',
    port: 11434,
    type: 'cloud',
    ssh: { user: 'root', port: 22, identityFile: '~/.ssh/id_ed25519' },
    description: '主控服务器',
  },
  // ── 阿里云 ECS #202 ──
  {
    id: 'cloud-202',
    name: '阿里云 ECS #202',
    host: '47.94.135.202',
    port: 11434,
    type: 'cloud',
    ssh: { user: 'root', port: 22, identityFile: '~/.ssh/id_ed25519' },
    description: '备用服务器',
  },
]

// ===== 完整模型资产清单 =====
// 基于 /Volumes/Max/models + NAS Volume1 + NAS Volume2 的实际目录结构

/** 已知模型的完整能力与来源映射 */
interface ModelAsset {
  name: string
  capabilities: ModelCapability[]
  /** 所在节点ID列表 */
  locations: string[]
  /** 存储路径 */
  path?: string
  /** 是否为微调模型 */
  isFinetuned?: boolean
  /** 参数量/描述 */
  description?: string
}

export const MODEL_ASSETS: ModelAsset[] = [
  // ── Mac 本地 (Ollama) ──
  { name: 'deepseek-v4-flash', capabilities: ['chat', 'reasoning'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/DeepSeek-V4-Flash', description: 'DeepSeek V4 Flash 多模态' },
  { name: 'deepseek-v4-pro', capabilities: ['chat', 'reasoning'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/DeepSeek-V4-Pro', description: 'DeepSeek V4 Pro 增强版' },

  // ── Qwen3 系列 ──
  { name: 'qwen3-8b', capabilities: ['chat'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3-8B', description: 'Qwen3 8B 轻量对话' },
  { name: 'qwen3-14b', capabilities: ['chat', 'reasoning'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3-14B', description: 'Qwen3 14B 全能' },
  { name: 'qwen3-14b-yyc3-merged', capabilities: ['chat', 'reasoning', 'finetune'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3-14B-YYC3-merged', isFinetuned: true, description: 'YYC³ 微调 14B' },
  { name: 'qwen3.6-27b', capabilities: ['chat', 'reasoning'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3.6-27B', description: 'Qwen3.6 27B 高性能' },
  { name: 'qwen3.6-27b-fp8', capabilities: ['chat', 'reasoning'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3.6-27B-FP8', description: 'Qwen3.6 27B FP8 量化' },
  { name: 'qwen3.6-35b-a3b', capabilities: ['chat', 'reasoning', 'code'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3.6-35B-A3B', description: 'Qwen3.6 35B MoE' },
  { name: 'qwen3.6-35b-a3b-fp8', capabilities: ['chat', 'reasoning', 'code'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3.6-35B-A3B-FP8', description: 'Qwen3.6 35B MoE FP8' },
  { name: 'qwen3-coder-30b-a3b', capabilities: ['code', 'reasoning'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3-Coder-30B-A3B-Q4', description: 'Qwen Coder 30B MoE Q4' },

  // ── 嵌入/重排序 ──
  { name: 'qwen3-embedding-8b', capabilities: ['embedding'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3-Embedding-8B', description: 'Qwen3 Embedding 8B' },
  { name: 'qwen3-reranker-8b', capabilities: ['reranker'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Qwen/Qwen3-Reranker-8B', description: 'Qwen3 Reranker 8B' },

  // ── 视觉/多模态 ──
  { name: 'minicpm-v-4.6', capabilities: ['vision', 'chat'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/MiniCPM-V-4.6', description: 'MiniCPM-V 4.6 多模态' },
  { name: 'cogagent-9b', capabilities: ['vision', 'chat'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Cogagent-9B', description: 'CogAgent 9B 视觉Agent' },

  // ── 图像/视频生成 ──
  { name: 'z-image-turbo', capabilities: ['image-gen'], locations: ['mac-local'], path: '/Volumes/Max/models/Z-Image-Turbo', description: 'Z Image Turbo 快速图像生成' },
  { name: 'hidream-ai', capabilities: ['image-gen'], locations: ['mac-local'], path: '/Volumes/Max/models/HiDream-ai', description: 'HiDream AI 图像生成' },
  { name: 'cogvideox-5b', capabilities: ['video-gen'], locations: ['mac-local', 'nas-main'], path: '/Volumes/Max/models/Cogvideox-5B', description: 'CogVideoX 5B 视频生成' },

  // ── NAS 重量级模型 ──
  { name: 'glm-5.1', capabilities: ['chat', 'reasoning'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/GLM-5.1', description: 'GLM 5.1 中文优化' },
  { name: 'glm-5.1-fp8', capabilities: ['chat', 'reasoning'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/GLM-5.1-FP8', description: 'GLM 5.1 FP8 量化' },
  { name: 'kimi-k2.6', capabilities: ['chat', 'reasoning'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/Kimi-K2.6', description: 'Kimi K2.6 长上下文' },
  { name: 'ring-2.6-1t', capabilities: ['chat', 'reasoning'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/Ring-2.6-1T', description: 'Ring 2.6 1T 万亿参数' },
  { name: 'qwen3.5-122b-a10b', capabilities: ['chat', 'reasoning', 'code'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/Qwen3.5-122B-A10B', description: 'Qwen3.5 122B MoE' },
  { name: 'qwen3.5-397b-a17b', capabilities: ['chat', 'reasoning', 'code'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/Qwen3.5-397B-A17B', description: 'Qwen3.5 397B MoE 旗舰' },
  { name: 'megastyle-1.4m', capabilities: ['image-gen'], locations: ['nas-main'], path: '/Volume1/yyc3_hd/data/MegaStyle-1.4M', description: 'MegaStyle 图像风格迁移' },

  // ── Docker 容器模型 (NAS Volume2) ──
  { name: 'chatglm3-6b', capabilities: ['chat'], locations: ['nas-main'], path: '/Volume2/docker/models/ChatGLM3-6B', description: 'ChatGLM3 6B 轻量' },
  { name: 'codegeex4-9b', capabilities: ['code'], locations: ['nas-main'], path: '/Volume2/docker/models/CodeGeeX4-9B', description: 'CodeGeeX4 9B 代码生成' },
  { name: 'codegeex4-9b-q8', capabilities: ['code'], locations: ['nas-main'], path: '/Volume2/docker/models/CodeGeex4-9B_Q8', description: 'CodeGeeX4 9B Q8 量化' },
  { name: 'qwen3-14b-yyc3-merged-gguf', capabilities: ['chat', 'reasoning', 'finetune'], locations: ['nas-main'], path: '/Volume2/docker/models/Qwen3-14B-YYC3-merged-gguf', isFinetuned: true, description: 'YYC³ 微调 GGUF' },

  // ── 其他 ──
  { name: 'robbyant', capabilities: ['chat'], locations: ['mac-local'], path: '/Volumes/Max/models/Robbyant', description: 'Robbyant 对话' },
  { name: 'tencent-hunyuan', capabilities: ['chat', 'image-gen'], locations: ['mac-local'], path: '/Volumes/Max/models/Tencent-Hunyuan', description: '腾讯混元' },
]

// ===== 模型能力映射 =====
/** 已知模型的能力标记 (优先使用本地自动检测，此表作为 fallback) */
const KNOWN_MODEL_CAPABILITIES: Record<string, ModelCapability[]> = {}

// 从 MODEL_ASSETS 构建映射
for (const asset of MODEL_ASSETS) {
  KNOWN_MODEL_CAPABILITIES[asset.name] = asset.capabilities
  // 也匹配 Ollama 的标签格式 (e.g., "deepseek-v4-flash:latest")
  KNOWN_MODEL_CAPABILITIES[`${asset.name}:latest`] = asset.capabilities
  // 匹配路径格式 (e.g., "qwen3.6-27b-fp8")
  if (asset.name.includes('-')) {
    KNOWN_MODEL_CAPABILITIES[asset.name.replace(/-/g, ':')] = asset.capabilities
  }
}

/** 归一化模型名称匹配 */
function normalizeModelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:\-_\s]+/g, '-')  // 已收敛连字符；原第二段 replace(/[-]+/g,'-') 为死代码（甄别队列 9 号，已清）
    .replace(/^-|-$/g, '')
}

function matchCapabilities(name: string): ModelCapability[] {
  const normalized = normalizeModelName(name)

  // 精确匹配 (含 Ollama 标签格式)
  for (const [key, caps] of Object.entries(KNOWN_MODEL_CAPABILITIES)) {
    if (normalized === normalizeModelName(key)) return caps
  }

  // 前缀匹配
  for (const [key, caps] of Object.entries(KNOWN_MODEL_CAPABILITIES)) {
    const normKey = normalizeModelName(key)
    if (normalized.startsWith(normKey) || normKey.startsWith(normalized)) return caps
  }

  // 模糊匹配
  if (normalized.includes('embedding')) return ['embedding']
  if (normalized.includes('reranker')) return ['reranker']
  if (normalized.includes('vision') || normalized.includes('minicpm') || normalized.includes('cogagent')) return ['vision', 'chat']
  if (normalized.includes('image') || normalized.includes('turbo') || normalized.includes('hidream') || normalized.includes('megastyle')) return ['image-gen']
  if (normalized.includes('video') || normalized.includes('cogvideox')) return ['video-gen']
  if (normalized.includes('code') || normalized.includes('coder') || normalized.includes('codegee')) return ['code', 'chat']
  if (normalized.includes('deepseek') || normalized.includes('glm') || normalized.includes('kimi') || normalized.includes('ring')) return ['chat', 'reasoning']
  if (normalized.includes('qwen3.5') || normalized.includes('qwen3.6')) return ['chat', 'reasoning', 'code']
  if (normalized.includes('yyc3') || normalized.includes('finetune') || normalized.includes('merged')) return ['chat', 'reasoning', 'finetune']
  return ['chat'] // 默认
}

/** 获取模型资产信息 */
export function getModelAsset(modelName: string): ModelAsset | undefined {
  const normalized = normalizeModelName(modelName)
  return MODEL_ASSETS.find(a => normalizeModelName(a.name) === normalized)
}

/** 检查模型是否为微调版本 */
export function isFinetunedModel(modelName: string): boolean {
  const asset = getModelAsset(modelName)
  return asset?.isFinetuned ?? false
}

/** 获取指定节点上推荐的默认模型 */
export function getDefaultModelForNode(nodeId: string): string | undefined {
  const assets = MODEL_ASSETS.filter(a => a.locations.includes(nodeId))
  // 优先级: 微调模型 > 推理模型 > 对话模型
  const finetuned = assets.find(a => a.isFinetuned)
  if (finetuned) return finetuned.name
  const reasoning = assets.find(a => a.capabilities.includes('reasoning') && !a.capabilities.includes('finetune'))
  if (reasoning) return reasoning.name
  const chat = assets.find(a => a.capabilities.includes('chat'))
  return chat?.name
}

// ===== 服务发现 =====

/** 健康检测单个节点 */
export async function checkNodeHealth(node: Pick<ModelNode, 'host' | 'port'>): Promise<{
  online: boolean
  latencyMs: number
  models?: { name: string; size: string; quantization?: string }[]
  error?: string
}> {
  const start = performance.now()
  const baseUrl = `http://${node.host}:${node.port}`
  try {
    const resp = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    const latencyMs = Math.round(performance.now() - start)
    if (!resp.ok) {
      return { online: false, latencyMs, error: `HTTP ${resp.status}` }
    }
    const data = await resp.json()
    const models: { name: string; size: string; quantization?: string }[] = (data.models || []).map((m: Record<string, unknown>) => ({
      name: (m.name as string) || (m.model as string),
      size: m.size ? ((m.size as number) / 1e9).toFixed(1) + ' GB' : 'N/A',
      quantization: (m.details as Record<string, unknown> | undefined)?.quantization_level as string || 'N/A',
    }))
    return { online: true, latencyMs, models }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start)
    const error = err instanceof Error ? err.message : 'Unknown error'
    return { online: false, latencyMs, error }
  }
}

/** 扫描所有节点 */
export async function scanAllNodes(): Promise<ModelNode[]> {
  const nodes: ModelNode[] = await Promise.all(
    NODE_CONFIGS.map(async (cfg) => {
      const result = await checkNodeHealth(cfg)
      const models: DetectedModel[] | undefined = result.models?.map(m => {
        const asset = getModelAsset(m.name)
        return {
          name: m.name,
          size: m.size,
          quantization: m.quantization,
          capabilities: matchCapabilities(m.name),
          nodeId: cfg.id,
          status: 'online' as const,
          path: asset?.path,
          isFinetuned: asset?.isFinetuned,
        }
      })
      return {
        ...cfg,
        status: result.online ? 'online' : 'offline',
        latencyMs: result.latencyMs,
        lastChecked: Date.now(),
        models,
      }
    })
  )
  return nodes
}

/** 按能力查找可用模型 */
export function findModelsByCapability(
  nodes: ModelNode[],
  capability: ModelCapability
): { node: ModelNode; model: DetectedModel }[] {
  const results: { node: ModelNode; model: DetectedModel }[] = []
  for (const node of nodes) {
    if (node.status !== 'online' || !node.models) continue
    for (const model of node.models) {
      if (model.capabilities.includes(capability)) {
        results.push({ node, model })
      }
    }
  }
  // 排序: local > dgx > nas > cloud, 同类型按延迟
  const priority: Record<string, number> = { local: 0, dgx: 1, nas: 2, cloud: 3 }
  results.sort((a, b) => {
    const pa = priority[a.node.type] ?? 99
    const pb = priority[b.node.type] ?? 99
    if (pa !== pb) return pa - pb
    return (a.node.latencyMs ?? 999) - (b.node.latencyMs ?? 999)
  })
  return results
}

/** 获取推荐模型：给定能力，返回最优模型端点 */
export function getRecommendedModel(
  nodes: ModelNode[],
  capability: ModelCapability
): { endpoint: string; modelName: string; nodeId: string } | null {
  const candidates = findModelsByCapability(nodes, capability)
  if (candidates.length === 0) return null
  const best = candidates[0]
  const baseUrl = `http://${best.node.host}:${best.node.port}`
  return {
    endpoint: `${baseUrl}/v1/chat/completions`,
    modelName: best.model.name,
    nodeId: best.node.id,
  }
}

/** 节点摘要文本 */
export function getNodeSummary(node: ModelNode): string {
  const modelCount = node.models?.length ?? 0
  const latency = node.latencyMs !== undefined ? `${node.latencyMs}ms` : '-'
  const statusIcon = node.status === 'online' ? '🟢' : node.status === 'offline' ? '🔴' : '⚪'
  return `${statusIcon} ${node.name} (${modelCount} models, ${latency})`
}

/** 持久化节点状态到 localStorage */
const STORAGE_KEY = 'yyc3_local_model_nodes'

export function saveNodeState(nodes: ModelNode[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.map(n => ({
      ...n,
      status: n.status,
      latencyMs: n.latencyMs,
      lastChecked: n.lastChecked,
      models: n.models?.map(m => ({ ...m })),
    }))))
  } catch { /* ignore */ }
}

export function loadNodeState(): ModelNode[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ModelNode[]
  } catch {
    return null
  }
}