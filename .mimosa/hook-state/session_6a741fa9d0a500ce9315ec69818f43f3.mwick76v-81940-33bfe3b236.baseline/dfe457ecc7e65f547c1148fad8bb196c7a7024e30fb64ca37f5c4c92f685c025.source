/**
 * @file local-inference-engine.test.ts
 * @description 本地推理引擎契约：模型目录一致性 / WebGPU 探测 / 未加载诚实报错
 */

import { describe, it, expect, vi } from 'vitest'
import { HF_MODEL_MAP, isPipelineLoaded, runCompletion, runEmbedding, unloadPipeline } from '../local-inference-engine'
import { PREDEFINED_MODELS } from '../../store/webgpu-inference-store'

describe('local-inference-engine（transformers.js 本地推理）', () => {
  it('HF_MODEL_MAP 覆盖全部预置模型（目录一致性契约）', () => {
    const predefined = PREDEFINED_MODELS.map(m => m.id)
    for (const id of predefined) {
      expect(HF_MODEL_MAP, `预置模型 ${id} 未登记 HF 目录`).toHaveProperty(id)
    }
    // 每项必有合法任务类型
    for (const spec of Object.values(HF_MODEL_MAP)) {
      expect(['text-generation', 'feature-extraction']).toContain(spec.task)
      expect(spec.repo).toMatch(/^[\w.-]+\/[\w.-]+$/)
    }
  })

  it('未登记模型 loadPipeline 诚实报错（不静默模拟）', async () => {
    const { loadPipeline } = await import('../local-inference-engine')
    await expect(loadPipeline('nonexistent-model-x')).rejects.toThrow('未登记')
  })

  it('pipeline 未加载时 runCompletion 拒绝执行（拒绝伪造输出）', async () => {
    expect(isPipelineLoaded('tinyllama-1.1b')).toBe(false)
    await expect(runCompletion('tinyllama-1.1b', 'x')).rejects.toThrow('未加载')
  })

  it('pipeline 未加载时 runEmbedding 同样拒绝', async () => {
    await expect(runEmbedding('codebert-base', 'x')).rejects.toThrow('未加载')
  })

  it('unloadPipeline 幂等且保持未加载态', () => {
    expect(() => unloadPipeline('tinyllama-1.1b')).not.toThrow()
    expect(isPipelineLoaded('tinyllama-1.1b')).toBe(false)
  })

  it('isWebGPUAvailable：无 gpu 对象返回 false（jsdom 环境实测）', async () => {
    const { isWebGPUAvailable } = await import('../local-inference-engine')
    // jsdom navigator 无 gpu → false（不抛错）
    expect(await isWebGPUAvailable()).toBe(false)
    void vi // 保持 import 使用
  })
})
