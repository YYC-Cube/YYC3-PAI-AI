/**
 * @file local-inference-engine.ts
 * @description WebGPU/WASM 本地推理引擎 — @huggingface/transformers 真实现
 *
 * 按需动态 import transformers.js（不进主 bundle）；pipeline 由浏览器
 * Cache API 缓存权重；WebGPU 不可用时自动回退 wasm。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags webgpu,inference,transformers,execution-layer
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('local-inference')

/** 本地模型目录 → HuggingFace 仓库（均为 transformers.js 官方支持形态） */
export const HF_MODEL_MAP: Record<string, { repo: string; task: 'text-generation' | 'feature-extraction' }> = {
  'tinyllama-1.1b': { repo: 'onnx-community/TinyLlama-1.1B-Chat-v1.0', task: 'text-generation' },
  'qwen2.5-coder-0.5b': { repo: 'onnx-community/Qwen2.5-Coder-0.5B-Instruct', task: 'text-generation' },
  'distilgpt2': { repo: 'onnx-community/distilgpt2', task: 'text-generation' },
  'codebert-base': { repo: 'Xenova/codebert-base', task: 'feature-extraction' },
  'all-MiniLM-L6-v2': { repo: 'Xenova/all-MiniLM-L6-v2', task: 'feature-extraction' },
}

type TransformersNS = typeof import('@huggingface/transformers')
/** transformers.js pipeline 是 20+ 具体管线的联合类型（互相不兼容的可调用签名），
 *  统一收敛为最小可调用形状；具体返回结构由 runCompletion/runEmbedding 内部解 */
type CallablePipeline = (input: unknown, options?: unknown) => Promise<unknown>

let transformersMod: TransformersNS | null = null
const pipelines = new Map<string, CallablePipeline>()

async function getTransformers(): Promise<TransformersNS> {
  if (!transformersMod) {
    transformersMod = await import('@huggingface/transformers')
    transformersMod.env.allowLocalModels = false
  }
  return transformersMod
}

export interface LoadOptions {
  device?: 'webgpu' | 'wasm'
  onProgress?: (pct: number, note: string) => void
}

/** 检测 WebGPU 可用性 */
export async function isWebGPUAvailable(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  if (!gpu) return false
  try { return (await gpu.requestAdapter()) != null } catch { return false }
}

/**
 * 加载本地模型 pipeline（真实权重下载 + 编译；进度回调整合到 UI）。
 * @throws 环境不支持/网络失败时抛出可读错误（调用方应把模型标记为 load-error，不再造假输出）
 */
export async function loadPipeline(
  modelId: string,
  opts: LoadOptions = {},
): Promise<CallablePipeline> {
  const cached = pipelines.get(modelId)
  if (cached) return cached

  const spec = HF_MODEL_MAP[modelId]
  if (!spec) {
    throw new Error(`模型 ${modelId} 未登记本地推理目录（HF_MODEL_MAP）`)
  }

  const T = await getTransformers()
  const wantWebGPU = opts.device === 'webgpu' || opts.device == null
  const useWebGPU = wantWebGPU && (await isWebGPUAvailable())

  opts.onProgress?.(2, useWebGPU ? 'WebGPU 就绪，准备下载权重' : 'WebGPU 不可用，回退 WASM')

  const pipeline = await T.pipeline(spec.task, spec.repo, {
    device: useWebGPU ? 'webgpu' : 'wasm',
    dtype: useWebGPU ? 'q4' : 'q8',
    progress_callback: (info: unknown) => {
      const p = info as { status?: string; progress?: number; file?: string }
      if (p.status === 'progress' && typeof p.progress === 'number') {
        opts.onProgress?.(
          Math.min(95, Math.max(2, Math.round(p.progress))),
          `下载 ${p.file ?? ''} ${Math.round(p.progress)}%`,
        )
      }
    },
  } as never) as CallablePipeline

  pipelines.set(modelId, pipeline)
  opts.onProgress?.(100, '模型就绪')
  logger.info('pipeline ready', { modelId, device: useWebGPU ? 'webgpu' : 'wasm' })
  return pipeline
}

export function unloadPipeline(modelId: string): void {
  pipelines.delete(modelId)
}

export function isPipelineLoaded(modelId: string): boolean {
  return pipelines.has(modelId)
}

/** 代码/文本补全（chat 模板 + 生成参数保守） */
export async function runCompletion(
  modelId: string,
  prompt: string,
  maxNewTokens = 128,
): Promise<string> {
  const pipe = pipelines.get(modelId)
  if (!pipe) throw new Error('pipeline 未加载')

  const messages = [
    { role: 'system', content: 'You are a concise code completion assistant. Output code only, no prose.' },
    { role: 'user', content: prompt },
  ]
  const out = (await pipe(messages, {
    max_new_tokens: maxNewTokens,
    do_sample: false,
    return_full_text: false,
  })) as unknown

  const first = (Array.isArray(out) ? out[0] : out) as { generated_text?: unknown } | null
  const generated = first?.generated_text
  if (typeof generated === 'string') return generated
  // 部分模型返回消息数组形态
  const chatMsgs = generated as { content?: string }[] | undefined
  if (Array.isArray(chatMsgs)) {
    return chatMsgs.map((m) => m?.content ?? '').join('').trim()
  }
  return String(generated ?? '')
}

/** 向量嵌入（代码/文本相似度） */
export async function runEmbedding(modelId: string, text: string): Promise<number[]> {
  const pipe = pipelines.get(modelId)
  if (!pipe) throw new Error('pipeline 未加载')
  const out = (await pipe(text, { pooling: 'mean', normalize: true })) as unknown
  const data = (Array.isArray(out) ? out[0] : out) as { data?: Float32Array | number[] } | null
  return Array.from(data?.data ?? [])
}
