/**
 * @file model-router.ts
 * @description 智能模型路由器 — 按任务类型自动路由到最佳本地模型
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2026-06-03
 * @status stable
 */

import {
  findModelsByCapability,
  getRecommendedModel,
  scanAllNodes,
  saveNodeState,
  loadNodeState,
  type ModelCapability,
  type ModelNode,
} from './local-model-infra'
import { createLogger } from './logger'

const logger = createLogger('model-router')

// ===== 任务类型定义 =====
export type TaskType =
  | 'chat'           // 通用对话
  | 'writing'        // 自媒体内容写作
  | 'writing-title'  // 标题生成
  | 'writing-outline' // 大纲生成
  | 'code'           // 代码生成
  | 'reasoning'      // 深度推理
  | 'embedding'      // 文本嵌入
  | 'reranker'      // 重排序
  | 'vision'         // 图像理解
  | 'image-gen'      // 图像生成
  | 'video-gen'      // 视频生成
  | 'rewrite'        // 改写润色
  | 'translate'      // 翻译
  | 'summary'        // 摘要

/** 任务 → 能力映射 */
const TASK_CAPABILITY: Record<TaskType, ModelCapability> = {
  chat: 'chat',
  writing: 'chat',
  'writing-title': 'chat',
  'writing-outline': 'chat',
  code: 'code',
  reasoning: 'reasoning',
  embedding: 'embedding',
  reranker: 'reranker',
  vision: 'vision',
  'image-gen': 'image-gen',
  'video-gen': 'video-gen',
  rewrite: 'chat',
  translate: 'chat',
  summary: 'reasoning',
}

/** 任务 → 推荐系统提示词 */
const TASK_SYSTEM_PROMPTS: Partial<Record<TaskType, string>> = {
  writing: '你是一位专业的自媒体内容创作者。请根据用户需求创作高质量的内容，注意排版和可读性。',
  'writing-title': '你是一位自媒体标题专家。请生成吸引眼球但不过分夸张的标题，提供3-5个选项。',
  'writing-outline': '你是一位内容规划专家。请生成详细的内容大纲，包含引言、主体段落和结尾。',
  rewrite: '你是一位文字润色专家。请在保持原意的基础上优化表达，使语言更流畅、专业。',
  translate: '你是一位专业翻译。请准确翻译内容，保持原文风格和语气。',
  summary: '你是一位内容分析专家。请提取核心要点，生成简洁但全面的摘要。',
  code: '你是一位资深程序员。请生成高质量、可维护的代码，附带必要注释。',
}

// ===== 路由器状态 =====
interface RouterState {
  nodes: ModelNode[]
  lastScanTime: number
  isScanning: boolean
}

const routerState: RouterState = {
  nodes: [],
  lastScanTime: 0,
  isScanning: false,
}

/** 初始化路由器（加载缓存并后台扫描） */
export async function initRouter(): Promise<void> {
  const cached = loadNodeState()
  if (cached) {
    routerState.nodes = cached
    routerState.lastScanTime = Date.now()
  }
  // 后台扫描
  refreshNodes().catch(() => {})
}

/** 刷新节点状态 */
export async function refreshNodes(): Promise<ModelNode[]> {
  if (routerState.isScanning) return routerState.nodes
  routerState.isScanning = true
  try {
    const nodes = await scanAllNodes()
    routerState.nodes = nodes
    routerState.lastScanTime = Date.now()
    saveNodeState(nodes)
    logger.info('Nodes refreshed', { count: nodes.filter(n => n.status === 'online').length })
    return nodes
  } finally {
    routerState.isScanning = false
  }
}

/** 获取当前节点状态 */
export function getNodes(): ModelNode[] {
  return routerState.nodes
}

/** 获取在线节点数 */
export function getOnlineCount(): number {
  return routerState.nodes.filter(n => n.status === 'online').length
}

/** 获取节点摘要 */
export function getNodeSummary(): string {
  const online = getOnlineCount()
  const total = routerState.nodes.length
  const modelCount = routerState.nodes.reduce((s, n) => s + (n.models?.length ?? 0), 0)
  return `${online}/${total} nodes · ${modelCount} models`
}

// ===== 路由核心 =====

export interface RouteResult {
  endpoint: string
  modelName: string
  nodeId: string
  systemPrompt?: string
  capabilities: ModelCapability[]
}

/** 根据任务类型路由到最佳模型 */
export async function routeTask(taskType: TaskType): Promise<RouteResult | null> {
  // 如果节点未扫描或超过5分钟，刷新
  if (routerState.nodes.length === 0 || Date.now() - routerState.lastScanTime > 5 * 60 * 1000) {
    await refreshNodes()
  }

  const capability = TASK_CAPABILITY[taskType]
  const recommendation = getRecommendedModel(routerState.nodes, capability)

  if (!recommendation) {
    logger.warn('No model available for task', { taskType, capability })
    return null
  }

  const node = routerState.nodes.find(n => n.id === recommendation.nodeId)
  const model = node?.models?.find(m => m.name === recommendation.modelName)

  return {
    endpoint: recommendation.endpoint,
    modelName: recommendation.modelName,
    nodeId: recommendation.nodeId,
    systemPrompt: TASK_SYSTEM_PROMPTS[taskType],
    capabilities: model?.capabilities ?? [capability],
  }
}

/** 获取所有可用能力 */
export function getAvailableCapabilities(): ModelCapability[] {
  const caps = new Set<ModelCapability>()
  for (const node of routerState.nodes) {
    if (node.status !== 'online' || !node.models) continue
    for (const model of node.models) {
      for (const cap of model.capabilities) {
        caps.add(cap)
      }
    }
  }
  return Array.from(caps)
}

/** 快速检查指定能力是否可用 */
export function hasCapability(capability: ModelCapability): boolean {
  return findModelsByCapability(routerState.nodes, capability).length > 0
}