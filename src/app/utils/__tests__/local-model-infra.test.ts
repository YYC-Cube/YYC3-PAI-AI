/**
 * @file local-model-infra.test.ts
 * @description 本地模型基础设施测试 — 资产清单/能力匹配/节点扫描（mock fetch）/能力检索/状态持久化
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  NODE_CONFIGS,
  getModelAsset,
  isFinetunedModel,
  getDefaultModelForNode,
  checkNodeHealth,
  scanAllNodes,
  findModelsByCapability,
  getRecommendedModel,
  getNodeSummary,
  saveNodeState,
  loadNodeState,
  type ModelNode,
  type DetectedModel,
  type ModelCapability,
} from '../local-model-infra'

const fetchMock = vi.fn()

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

/** 构造节点（默认在线、无模型） */
function makeNode(over: Partial<ModelNode>): ModelNode {
  return {
    id: 'n', name: '节点', host: 'localhost', port: 11434, type: 'local', status: 'online',
    ...over,
  }
}

/** 构造已检测模型 */
function makeModel(name: string, caps: ModelCapability[], nodeId = 'n'): DetectedModel {
  return { name, size: '1 GB', capabilities: caps, nodeId, status: 'online' }
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('local-model-infra 静态资产', () => {
  it('NODE_CONFIGS：六个预定义节点、id 唯一且覆盖 local/dgx/nas/cloud 类型', () => {
    expect(NODE_CONFIGS).toHaveLength(6)
    const ids = NODE_CONFIGS.map(c => c.id)
    expect(new Set(ids).size).toBe(6)
    const types = new Set(NODE_CONFIGS.map(c => c.type))
    expect(types).toEqual(new Set(['local', 'dgx', 'nas', 'cloud']))
    for (const c of NODE_CONFIGS) {
      expect(c.host).toBeTruthy()
      expect(c.port).toBe(11434)
      expect(c.ssh?.user).toBeTruthy()
    }
  })

  it('getModelAsset：精确名与归一化变体（大小写/冒号）命中同一资产', () => {
    const asset = getModelAsset('qwen3.6-27b')
    expect(asset?.path).toBe('/Volumes/Max/models/Qwen/Qwen3.6-27B')
    expect(asset?.capabilities).toEqual(['chat', 'reasoning'])
    expect(getModelAsset('Qwen3.6-27B')).toBe(asset)
    expect(getModelAsset('qwen3.6:27b')).toBe(asset)
  })

  it('getModelAsset：未知模型返回 undefined', () => {
    expect(getModelAsset('totally-unknown-model')).toBeUndefined()
  })

  it('isFinetunedModel：微调模型为 true，普通/未知模型为 false', () => {
    expect(isFinetunedModel('qwen3-14b-yyc3-merged')).toBe(true)
    expect(isFinetunedModel('qwen3-14b-yyc3-merged-gguf')).toBe(true)
    expect(isFinetunedModel('qwen3-14b')).toBe(false)
    expect(isFinetunedModel('no-such-model')).toBe(false)
  })

  it('getDefaultModelForNode：优先返回微调模型；无资产节点返回 undefined', () => {
    expect(getDefaultModelForNode('mac-local')).toBe('qwen3-14b-yyc3-merged')
    expect(getDefaultModelForNode('nas-main')).toBe('qwen3-14b-yyc3-merged')
    expect(getDefaultModelForNode('cloud-33')).toBeUndefined()
    expect(getDefaultModelForNode('dgx-spark-1')).toBeUndefined()
  })
})

describe('local-model-infra 健康检测（mock fetch）', () => {
  it('checkNodeHealth：在线节点解析 /api/tags 模型列表（GB 格式化/量化级别/name 回退）', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      models: [
        { name: 'qwen3.6-27b', size: 20e9, details: { quantization_level: 'Q4_K_M' } },
        { model: 'mystery-model' },
      ],
    }))
    const r = await checkNodeHealth({ host: 'localhost', port: 11434 })
    expect(r.online).toBe(true)
    expect(r.error).toBeUndefined()
    expect(r.latencyMs).toBeGreaterThanOrEqual(0)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/tags',
      expect.objectContaining({ signal: expect.anything() }),
    )
    expect(r.models).toEqual([
      { name: 'qwen3.6-27b', size: '20.0 GB', quantization: 'Q4_K_M' },
      { name: 'mystery-model', size: 'N/A', quantization: 'N/A' },
    ])
  })

  it('checkNodeHealth：HTTP 非 2xx 返回 offline 与状态错误', async () => {
    fetchMock.mockResolvedValue(new Response('err', { status: 500 }))
    const r = await checkNodeHealth({ host: '192.168.3.101', port: 11434 })
    expect(r.online).toBe(false)
    expect(r.error).toBe('HTTP 500')
    expect(r.models).toBeUndefined()
  })

  it('checkNodeHealth：fetch 异常返回 offline 与错误消息', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'))
    const r = await checkNodeHealth({ host: '192.168.3.102', port: 11434 })
    expect(r.online).toBe(false)
    expect(r.error).toBe('connection refused')
  })
})

describe('local-model-infra 节点扫描（mock fetch）', () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async (input: unknown) => {
      const url = String(input)
      if (url.startsWith('http://localhost:11434')) {
        return jsonResponse({
          models: [
            { name: 'qwen3.6-27b', size: 18.35e9, details: { quantization_level: 'Q4_K_M' } },
            { name: 'qwen3-14b-yyc3-merged', size: 9e9 },
            { model: 'mystery-model' },
          ],
        })
      }
      return new Response('down', { status: 503 })
    })
  })

  it('scanAllNodes：返回全部六节点，在线节点模型带能力/路径归属，离线节点无模型', async () => {
    const nodes = await scanAllNodes()
    expect(nodes).toHaveLength(6)
    const mac = nodes.find(n => n.id === 'mac-local')!
    expect(mac.status).toBe('online')
    expect(mac.models).toHaveLength(3)
    expect(mac.models![0]).toMatchObject({
      name: 'qwen3.6-27b',
      capabilities: ['chat', 'reasoning'],
      nodeId: 'mac-local',
      path: '/Volumes/Max/models/Qwen/Qwen3.6-27B',
    })
    expect(mac.models![1].isFinetuned).toBe(true)
    // 未登记模型：能力走默认 chat，无路径
    expect(mac.models![2]).toMatchObject({ name: 'mystery-model', capabilities: ['chat'] })
    expect(mac.models![2].path).toBeUndefined()
    const dgx = nodes.find(n => n.id === 'dgx-spark-1')!
    expect(dgx.status).toBe('offline')
    expect(dgx.models).toBeUndefined()
    for (const n of nodes) {
      expect(typeof n.lastChecked).toBe('number')
      expect(typeof n.latencyMs).toBe('number')
    }
  })

  it('scanAllNodes：按节点地址逐一请求 /api/tags', async () => {
    await scanAllNodes()
    expect(fetchMock).toHaveBeenCalledTimes(6)
    const urls = fetchMock.mock.calls.map(c => String(c[0]))
    for (const cfg of NODE_CONFIGS) {
      expect(urls).toContain(`http://${cfg.host}:${cfg.port}/api/tags`)
    }
  })
})

describe('local-model-infra 能力检索与推荐', () => {
  it('findModelsByCapability：仅在线节点参与，按 local>dgx>nas>cloud 再按延迟排序', () => {
    const nodes: ModelNode[] = [
      makeNode({ id: 'cloud', type: 'cloud', latencyMs: 30, models: [makeModel('c-model', ['chat'], 'cloud')] }),
      makeNode({ id: 'nas', type: 'nas', latencyMs: 20, models: [makeModel('n-model', ['chat'], 'nas')] }),
      makeNode({ id: 'dgx', type: 'dgx', latencyMs: 10, models: [makeModel('d-model', ['chat'], 'dgx')] }),
      makeNode({ id: 'mac-slow', type: 'local', latencyMs: 50, models: [makeModel('m1', ['chat'], 'mac-slow')] }),
      makeNode({ id: 'mac-fast', type: 'local', latencyMs: 5, models: [makeModel('m2', ['chat'], 'mac-fast')] }),
      // 离线节点即使有匹配模型也排除；无模型在线节点跳过
      makeNode({ id: 'nas-off', type: 'nas', status: 'offline', models: [makeModel('x', ['chat'], 'nas-off')] }),
      makeNode({ id: 'empty', type: 'local', latencyMs: 1, models: undefined }),
    ]
    const r = findModelsByCapability(nodes, 'chat')
    expect(r.map(x => x.node.id)).toEqual(['mac-fast', 'mac-slow', 'dgx', 'nas', 'cloud'])
    expect(r[0].model.name).toBe('m2')
  })

  it('findModelsByCapability：能力不匹配返回空数组', () => {
    const nodes = [makeNode({ id: 'n1', models: [makeModel('chat-only', ['chat'])] })]
    expect(findModelsByCapability(nodes, 'image-gen')).toEqual([])
  })

  it('getRecommendedModel：返回最优候选的完整端点信息', () => {
    const nodes = [
      makeNode({ id: 'cloud', type: 'cloud', host: '1.2.3.4', port: 11434, latencyMs: 10, models: [makeModel('far', ['chat'], 'cloud')] }),
      makeNode({ id: 'mac', type: 'local', latencyMs: 200, models: [makeModel('near', ['chat'], 'mac')] }),
    ]
    expect(getRecommendedModel(nodes, 'chat')).toEqual({
      endpoint: 'http://localhost:11434/v1/chat/completions',
      modelName: 'near',
      nodeId: 'mac',
    })
  })

  it('getRecommendedModel：无候选返回 null', () => {
    expect(getRecommendedModel([], 'chat')).toBeNull()
    expect(getRecommendedModel([makeNode({ status: 'offline', models: [makeModel('m', ['chat'])] })], 'chat')).toBeNull()
  })

  it('getNodeSummary：三态状态图标、模型计数与延迟缺省显示', () => {
    const online = makeNode({ name: 'NAS', latencyMs: 42, models: [makeModel('a', ['chat']), makeModel('b', ['chat'])] })
    expect(getNodeSummary(online)).toBe('🟢 NAS (2 models, 42ms)')
    expect(getNodeSummary(makeNode({ name: 'X', status: 'offline' }))).toBe('🔴 X (0 models, -)')
    expect(getNodeSummary(makeNode({ name: 'Y', status: 'unknown' }))).toBe('⚪ Y (0 models, -)')
  })
})

describe('local-model-infra 状态持久化（真实 localStorage）', () => {
  it('saveNodeState/loadNodeState：往返序列化保持节点数据一致', () => {
    const nodes: ModelNode[] = [
      makeNode({
        id: 'mac-local', name: 'MacBook', status: 'online', latencyMs: 12, lastChecked: 1700000000000,
        ssh: { user: 'mock-user', port: 22, identityFile: '~/mock/node_key' },
        modelPaths: ['/mock/models'],
        models: [makeModel('qwen3.6-27b', ['chat', 'reasoning'], 'mac-local')],
      }),
      makeNode({ id: 'cloud-33', type: 'cloud', status: 'offline', latencyMs: 99, models: [] }),
    ]
    saveNodeState(nodes)
    expect(loadNodeState()).toEqual(nodes)
  })

  it('loadNodeState：无数据返回 null；损坏 JSON 容错返回 null', () => {
    expect(loadNodeState()).toBeNull()
    localStorage.setItem('yyc3_local_model_nodes', '{broken json')
    expect(loadNodeState()).toBeNull()
  })
})
