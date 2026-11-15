/**
 * @file model-router.test.ts
 * @description 智能模型路由器测试 — 任务→能力映射/节点刷新/路由核心（mock local-model-infra）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ModelNode } from '../local-model-infra'

vi.mock('../local-model-infra', () => ({
  scanAllNodes: vi.fn(),
  getRecommendedModel: vi.fn(),
  findModelsByCapability: vi.fn(),
  saveNodeState: vi.fn(),
  loadNodeState: vi.fn(),
}))

import {
  initRouter, refreshNodes, getNodes, getOnlineCount, getNodeSummary,
  routeTask, getAvailableCapabilities, hasCapability,
} from '../model-router'
import {
  scanAllNodes, getRecommendedModel, findModelsByCapability, saveNodeState, loadNodeState,
} from '../local-model-infra'

const nodeWith = (overrides: Partial<ModelNode>): ModelNode => ({
  id: 'n1', name: '本机', host: 'localhost', port: 11434,
  type: 'local', status: 'online',
  models: [{ name: 'qwen2.5:7b', size: '4GB', capabilities: ['chat', 'code'], nodeId: 'n1', status: 'online' }],
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(scanAllNodes).mockResolvedValue([])
  vi.mocked(loadNodeState).mockReturnValue(null)
  vi.mocked(getRecommendedModel).mockReturnValue(null)
  vi.mocked(findModelsByCapability).mockReturnValue([])
})

describe('model-router 节点管理', () => {
  it('initRouter：有缓存立即装载，后台扫描同集不覆盖', async () => {
    vi.mocked(loadNodeState).mockReturnValue([nodeWith({})])
    vi.mocked(scanAllNodes).mockResolvedValue([nodeWith({})])
    await initRouter()
    // 让后台 refreshNodes 微任务跑完，验证扫描结果与缓存一致
    await new Promise(r => setTimeout(r, 0))
    expect(getNodes()).toHaveLength(1)
    expect(getOnlineCount()).toBe(1)
  })

  it('refreshNodes：扫描并持久化，扫描中重入返回现值', async () => {
    vi.mocked(scanAllNodes).mockResolvedValue([
      nodeWith({}),
      nodeWith({ id: 'n2', status: 'offline', models: [] }),
    ])
    const nodes = await refreshNodes()
    expect(nodes).toHaveLength(2)
    expect(getOnlineCount()).toBe(1)
    expect(saveNodeState).toHaveBeenCalledTimes(1)
    expect(getNodeSummary()).toBe('1/2 nodes · 1 models')
  })

  it('getNodeSummary：空状态', async () => {
    await refreshNodes()
    expect(getNodeSummary()).toBe('0/0 nodes · 0 models')
  })
})

describe('model-router 路由核心', () => {
  it('routeTask：chat 任务映射 chat 能力与端点，无系统提示词', async () => {
    vi.mocked(scanAllNodes).mockResolvedValue([nodeWith({})])
    vi.mocked(getRecommendedModel).mockReturnValue({
      endpoint: 'http://localhost:11434/v1', modelName: 'qwen2.5:7b', nodeId: 'n1',
    })
    const r = await routeTask('chat')
    expect(r).not.toBeNull()
    expect(r!.modelName).toBe('qwen2.5:7b')
    expect(r!.capabilities).toEqual(['chat', 'code'])
    expect(r!.systemPrompt).toBeUndefined()
  })

  it('routeTask：writing/summary 注入专属提示词；查无模型节点时能力回退任务映射', async () => {
    vi.mocked(scanAllNodes).mockResolvedValue([nodeWith({})])
    vi.mocked(getRecommendedModel).mockReturnValue({
      endpoint: 'http://x/v1', modelName: 'qwen2.5:7b', nodeId: 'n1',
    })
    const writing = await routeTask('writing')
    expect(writing!.systemPrompt).toContain('自媒体内容创作者')
    // nodeId 指向不存在节点 → model undefined → capabilities 回退单能力数组
    vi.mocked(getRecommendedModel).mockReturnValue({
      endpoint: 'http://x/v1', modelName: 'ghost', nodeId: 'n-missing',
    })
    const summary = await routeTask('summary')
    expect(summary!.systemPrompt).toContain('摘要')
    expect(summary!.capabilities).toEqual(['reasoning'])
  })

  it('routeTask：无可用模型返回 null', async () => {
    vi.mocked(scanAllNodes).mockResolvedValue([nodeWith({})])
    vi.mocked(getRecommendedModel).mockReturnValue(null)
    expect(await routeTask('code')).toBeNull()
  })

  it('getAvailableCapabilities 跨节点聚合去重；hasCapability 委托查询', async () => {
    vi.mocked(scanAllNodes).mockResolvedValue([
      nodeWith({}),
      nodeWith({
        id: 'n3', status: 'online',
        models: [{ name: 'bge-m3', size: '1GB', capabilities: ['embedding', 'chat'], nodeId: 'n3', status: 'online' }],
      }),
      nodeWith({ id: 'n4', status: 'offline', models: [{ name: 'x', size: '', capabilities: ['vision'], nodeId: 'n4', status: 'online' }] }),
    ])
    await refreshNodes()
    expect(getAvailableCapabilities()).toEqual(expect.arrayContaining(['chat', 'code', 'embedding']))
    expect(getAvailableCapabilities()).not.toContain('vision')
    const n1 = nodeWith({})
    vi.mocked(findModelsByCapability).mockReturnValue([{ node: n1, model: n1.models![0] }])
    expect(hasCapability('chat')).toBe(true)
    vi.mocked(findModelsByCapability).mockReturnValue([])
    expect(hasCapability('vision')).toBe(false)
  })
})
