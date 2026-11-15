/**
 * @file intelligent-workflow-store.deep.test.ts
 * @description 智能工作流Store深化测试——执行全流程/暂停恢复/重试/AI优化/自愈/洞察分层
 *
 * 深化背景：浅测（intelligent-workflow-store.test.ts）仅覆盖状态守卫与增删改查，
 * 未触达 executeWorkflow/retryNode/selfHeal/optimizeWorkflow 执行链与洞察分层逻辑。
 *
 * 实测确认的三处源码缺陷（本文件只复现不修改源码）：
 * 1. executeWorkflow 在 set() producer 内把 immer draft 赋给外层变量（25号修复引入），
 *    produce 结束后 draft 被撤销，后续 executeWorkflowNodes(workflow) 访问
 *    `workflow.nodes` 抛 "Cannot perform 'get' on a proxy that has been revoked"，
 *    任何含工作流的执行都失败（工作流被标记 failed）。
 * 2. retryNode 执行链 executeNode 直接改写 producer 外取得的冻结对象
 *    （node.status / workflow.stats）抛 "Cannot assign to read only property"，
 *    且 catch 内 set() 再次改冻结对象二次抛错，节点永远无法重试成功。
 * 3. naturalLanguageToWorkflow 成功路径：result 被 push 进 store 后被 immer 深冻结，
 *    随后 `result.workflow = {...}`（26号修复引入）对冻结对象赋值抛 TypeError，
 *    被 catch 吞掉后返回 confidence 0 的失败结果——但工作流实际已建档、
 *    历史重复入栈两条（成功结果 + 兜底错误）。
 *
 * 测法约定：retryNode 需要推进执行链的用例，注入「未冻结」的纯对象工作流，
 * 其中 stats 用 getter 返回全新副本（immer 冻结的是快照，getter 每次给新对象，
 * 执行链 `workflow.stats.X++` 不再命中冻结体）；假定计时器只 fake setTimeout/setInterval
 * （勿 fake rAF）。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-11-12
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { enableMapSet } from 'immer'
import { useIntelligentWorkflowStore } from '../intelligent-workflow-store'
import type {
  Workflow,
  WorkflowNode,
  WorkflowNodeLog,
  WorkflowNodeType,
} from '../intelligent-workflow-store'

enableMapSet()

/** 重置用零值统计 */
const freshStats = () => ({
  totalWorkflows: 0,
  totalExecutions: 0,
  successfulExecutions: 0,
  avgExecutionTime: 0,
  aiDecisionAccuracy: 0,
  selfHealingSuccessRate: 0,
})

/** 构造待执行节点（纯对象，未经 produce 冻结） */
const makeNode = (
  id: string,
  overrides: Partial<WorkflowNode> & { type?: WorkflowNodeType } = {}
): WorkflowNode => ({
  id,
  name: `节点 ${id}`,
  type: overrides.type ?? 'task',
  status: 'pending',
  data: {
    description: `测试任务 ${id}`,
    aiPrompt: overrides.type === 'ai' ? '分析代码质量' : undefined,
    enabled: true,
  },
  retryCount: 0,
  dependencies: [],
  successors: [],
  logs: [],
  ...overrides,
})

/**
 * 注入用节点：logs 换成「getter 返回代理副本」——produce 定稿会把未修改的
 * 共享子对象（logs 数组）原位冻结，getter 每次给新代理并把 push 同步回
 * liveLogs，执行链的 logs.push 不再命中冻结体且断言可追踪。
 */
const makeInjectableNode = (
  id: string,
  overrides: Partial<WorkflowNode> & { type?: WorkflowNodeType } = {}
): { node: WorkflowNode; liveLogs: WorkflowNodeLog[] } => {
  const node = makeNode(id, overrides)
  const liveLogs: WorkflowNodeLog[] = []
  Object.defineProperty(node, 'logs', {
    enumerable: true,
    configurable: true,
    get: () =>
      new Proxy([...liveLogs] as WorkflowNodeLog[], {
        set(target, prop, value) {
          if (prop === 'length') {
            target.length = value
            liveLogs.length = value
            return true
          }
          const idx = Number(prop)
          target[idx] = value
          liveLogs[idx] = value
          return true
        },
      }),
  })
  return { node, liveLogs }
}

/**
 * 构造完整工作流（纯对象注入用——不经 produce，保持可写）。
 * stats 用 getter 返回全新副本：produce 定稿会把「未修改的共享子对象」原位冻结，
 * 而 getter 每次给新对象，执行链的 workflow.stats.X++ 不再命中冻结体。
 */
const makePlainWorkflow = (id: string, nodes: WorkflowNode[]): Workflow => {
  const wf: Workflow = {
    id,
    name: `注入流程 ${id}`,
    description: '未冻结注入工作流',
    status: 'ready',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionMode: 'sequential',
    nodes: new Map(nodes.map((n) => [n.id, n])),
    startNodeId: nodes[0]?.id ?? '',
    stats: {
      totalNodes: nodes.length,
      completedNodes: 0,
      failedNodes: 0,
      skippedNodes: 0,
      totalDuration: 0,
      aiDecisions: 0,
      selfHealingCount: 0,
      learningCount: 0,
    },
    version: 1,
    aiGenerated: false,
  }
  const statsShape = wf.stats
  Object.defineProperty(wf, 'stats', {
    enumerable: true,
    configurable: true,
    get: () => ({ ...statsShape }),
  })
  return wf
}

/** 以 setState 对象部分注入（替换 workflows，绕开 immer 冻结） */
const injectWorkflow = (wf: Workflow) => {
  useIntelligentWorkflowStore.setState({
    workflows: new Map([[wf.id, wf]]),
    executingWorkflowId: null,
    executionEvents: [],
    learnedOptimizations: [],
    stats: freshStats(),
  })
}

describe('intelligent-workflow-store 深化——执行链与 AI 能力', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    useIntelligentWorkflowStore.setState({
      workflows: new Map(),
      executingWorkflowId: null,
      executionEvents: [],
      naturalLanguageInputs: [],
      workflowTemplates: [],
      learnedOptimizations: [],
      stats: freshStats(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executeWorkflow：执行不存在的工作流抛 Workflow not found', async () => {
    const state = useIntelligentWorkflowStore.getState()
    await expect(state.executeWorkflow('不存在的ID')).rejects.toThrow(/not found/)
    // 失败不影响统计
    expect(useIntelligentWorkflowStore.getState().stats.totalExecutions).toBe(0)
  })

  it('executeWorkflow：冻结副本方案修复后真执行成功（34号回归修复）——节点终态回写 store', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    try {
      const store = useIntelligentWorkflowStore.getState()
      const wf = store.createWorkflow({
        name: '冻结执行流',
        description: '经 produce 冻结的正常建档案',
        executionMode: 'sequential',
        nodes: new Map([['n1', makeNode('n1')]]),
        startNodeId: 'n1',
        aiGenerated: false,
      })

      const promise = useIntelligentWorkflowStore.getState().executeWorkflow(wf.id)
      // simulateNodeExecution 延迟 500-1500ms——假计时器推进
      await vi.runAllTimersAsync()

      await promise
      const after = useIntelligentWorkflowStore.getState()
      const done = after.workflows.get(wf.id)
      // 成功路径：状态 completed + 总执行/成功各 +1 + started/completed 事件齐
      expect(done?.status).toBe('completed')
      expect(after.stats.totalExecutions).toBe(1)
      expect(after.stats.successfulExecutions).toBe(1)
      expect(after.executionEvents.map((e) => e.type)).toEqual(['workflow-started', 'node-started', 'node-completed'])
      // 34号：可变副本上的节点终态回写 store（此前链上改动从不落库）
      expect(done?.nodes.get('n1')?.status).toBe('completed')
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauseWorkflow/resumeWorkflow：运行态暂停恢复联动事件，非法态静默', () => {
    const store = useIntelligentWorkflowStore.getState()
    const wf = store.createWorkflow({
      name: '暂停恢复流',
      description: 'd',
      executionMode: 'sequential',
      nodes: new Map(),
      startNodeId: '',
      aiGenerated: false,
    })

    // 非 running 状态暂停 → 静默无事件
    store.pauseWorkflow(wf.id)
    expect(useIntelligentWorkflowStore.getState().executionEvents).toHaveLength(0)

    // 非 paused 状态恢复 → 静默无事件
    store.resumeWorkflow(wf.id)
    expect(useIntelligentWorkflowStore.getState().executionEvents).toHaveLength(0)

    // 置为 running 后暂停 → paused + workflow-paused 事件
    useIntelligentWorkflowStore.setState((s) => {
      const w = s.workflows.get(wf.id)
      if (w) w.status = 'running'
      s.executingWorkflowId = wf.id
    })
    useIntelligentWorkflowStore.getState().pauseWorkflow(wf.id)
    const paused = useIntelligentWorkflowStore.getState().workflows.get(wf.id)
    expect(paused?.status).toBe('paused')
    expect(useIntelligentWorkflowStore.getState().executionEvents.map((e) => e.type)).toEqual([
      'workflow-paused',
    ])

    // 已暂停时再暂停 → 不重复发事件
    useIntelligentWorkflowStore.getState().pauseWorkflow(wf.id)
    expect(useIntelligentWorkflowStore.getState().executionEvents).toHaveLength(1)

    // 恢复 → running + workflow-resumed 事件
    useIntelligentWorkflowStore.getState().resumeWorkflow(wf.id)
    const resumed = useIntelligentWorkflowStore.getState()
    expect(resumed.workflows.get(wf.id)?.status).toBe('running')
    expect(resumed.executionEvents.map((e) => e.type)).toEqual([
      'workflow-paused',
      'workflow-resumed',
    ])

    // 已运行时再恢复 → 不重复发事件
    useIntelligentWorkflowStore.getState().resumeWorkflow(wf.id)
    expect(useIntelligentWorkflowStore.getState().executionEvents).toHaveLength(2)
  })

  it('cancelWorkflow：运行中取消置 cancelled/endedAt 并清空执行指针；不存在静默', () => {
    const store = useIntelligentWorkflowStore.getState()
    const wf = store.createWorkflow({
      name: '取消流',
      description: 'd',
      executionMode: 'sequential',
      nodes: new Map(),
      startNodeId: '',
      aiGenerated: false,
    })

    // 不存在的工作流取消 → 无副作用不抛错
    expect(() => store.cancelWorkflow('幽灵ID')).not.toThrow()

    useIntelligentWorkflowStore.setState((s) => {
      const w = s.workflows.get(wf.id)
      if (w) w.status = 'running'
      s.executingWorkflowId = wf.id
    })
    useIntelligentWorkflowStore.getState().cancelWorkflow(wf.id)

    const cancelled = useIntelligentWorkflowStore.getState()
    expect(cancelled.workflows.get(wf.id)?.status).toBe('cancelled')
    expect(typeof cancelled.workflows.get(wf.id)?.endedAt).toBe('number')
    expect(cancelled.executingWorkflowId).toBeNull()
  })

  it('retryNode：不存在工作流/节点静默返回', async () => {
    const store = useIntelligentWorkflowStore.getState()
    const wf = store.createWorkflow({
      name: '重试守卫流',
      description: 'd',
      executionMode: 'sequential',
      nodes: new Map(),
      startNodeId: '',
      aiGenerated: false,
    })
    await expect(useIntelligentWorkflowStore.getState().retryNode('幽灵流程', 'n1')).resolves.toBeUndefined()
    await expect(useIntelligentWorkflowStore.getState().retryNode(wf.id, '幽灵节点')).resolves.toBeUndefined()
    expect(useIntelligentWorkflowStore.getState().stats.totalExecutions).toBe(0)
  })

  it('retryNode：冻结节点经 34号可变副本方案成功重试——结果回写 store', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    try {
      const store = useIntelligentWorkflowStore.getState()
      const wf = store.createWorkflow({
        name: '冻结重试流',
        description: 'd',
        executionMode: 'sequential',
        nodes: new Map([['n1', makeNode('n1')]]),
        startNodeId: 'n1',
        aiGenerated: false,
      })

      const promise = useIntelligentWorkflowStore.getState().retryNode(wf.id, 'n1')
      await vi.runAllTimersAsync()
      await expect(promise).resolves.toBeUndefined()

      const retried = useIntelligentWorkflowStore.getState().workflows.get(wf.id)?.nodes.get('n1')
      // 34号：可变副本执行 + Object.assign 回写——节点完成态与重试计数落库
      expect(retried?.status).toBe('completed')
      expect(retried?.retryCount).toBe(1)
      // 执行链事件齐 + 完成计数回写
      const events = useIntelligentWorkflowStore.getState().executionEvents.map((e) => e.type)
      expect(events).toEqual(['node-started', 'node-completed'])
      expect(useIntelligentWorkflowStore.getState().workflows.get(wf.id)?.stats.completedNodes).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('retryNode：未冻结注入节点成功执行——started/completed 事件与总时长推进', async () => {
    const { node } = makeInjectableNode('n1')
    const wf = makePlainWorkflow('注入重试流', [node])
    injectWorkflow(wf)

    const promise = useIntelligentWorkflowStore.getState().retryNode('注入重试流', 'n1')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()

    const state = useIntelligentWorkflowStore.getState()
    expect(state.executionEvents.map((e) => e.type)).toEqual(['node-started', 'node-completed'])
    expect(state.executionEvents.every((e) => e.nodeId === 'n1')).toBe(true)
    // updateWorkflow 走 state 草稿：重置计数与总时长落库
    expect(state.workflows.get('注入重试流')?.stats.totalDuration).toBeGreaterThanOrEqual(0)
    expect(state.workflows.get('注入重试流')?.nodes.get('n1')?.retryCount).toBe(1)
    // 34号后（immer store）：执行结果以 store 终态为准（live 引用与 store 脱钩）
    expect(state.workflows.get('注入重试流')?.nodes.get('n1')?.status).toBe('completed')
    expect(state.workflows.get('注入重试流')?.nodes.get('n1')?.duration).not.toBeNull()
  })

  it('retryNode：依赖未就绪走跳过分支（不发 started 事件）', async () => {
    const { node } = makeInjectableNode('n2', { dependencies: ['nX'] })
    const wf = makePlainWorkflow('注入跳过流', [node])
    injectWorkflow(wf)

    const promise = useIntelligentWorkflowStore.getState().retryNode('注入跳过流', 'n2')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()

    // 跳过分支：不发 started/completed 事件；重试收尾置 completed（源码行为，34号后读 store 终态）
    expect(useIntelligentWorkflowStore.getState().executionEvents).toHaveLength(0)
    expect(useIntelligentWorkflowStore.getState().workflows.get('注入跳过流')?.nodes.get('n2')?.status).toBe('completed')
  })

  it('retryNode：AI 节点执行推进 aiDecisions 统计并写决策日志', async () => {
    const { node } = makeInjectableNode('ai1', { type: 'ai' })
    void node
    const wf = makePlainWorkflow('注入AI流', [node])
    injectWorkflow(wf)

    const promise = useIntelligentWorkflowStore.getState().retryNode('注入AI流', 'ai1')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()

    const aiState = useIntelligentWorkflowStore.getState()
    expect(aiState.workflows.get('注入AI流')?.stats.aiDecisions).toBe(1)
    // 34号后：决策日志以 store 节点终态为准（immer 定稿会把 getter 物化，liveLogs 代理契约失效）
    const logs = aiState.workflows.get('注入AI流')?.nodes.get('ai1')?.logs ?? []
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('AI decision made')
    expect(aiState.workflows.get('注入AI流')?.nodes.get('ai1')?.status).toBe('completed')
  })

  it('naturalLanguageToWorkflow：部署分支命中转换——34号修复后成功返回且 id 回填（不再吞错）', async () => {
    const promise = useIntelligentWorkflowStore.getState().naturalLanguageToWorkflow('部署应用到生产环境')
    await vi.runAllTimersAsync()
    const result = await promise

    // 34号修复后：以新对象返回（不再对冻结 result 赋值）——成功语义完整
    expect(result.success).toBe(true)
    expect(result.workflow?.id).toBeTruthy()

    const state = useIntelligentWorkflowStore.getState()
    // 工作流按转换结果建档（部署 → Deployment Pipeline，aiGenerated）
    expect(state.workflows.size).toBe(1)
    const created = [...state.workflows.values()][0]
    expect(created?.name).toBe('Deployment Pipeline')
    expect(created?.aiGenerated).toBe(true)
    expect(created?.status).toBe('draft')
    expect(created?.naturalLanguageDescription).toBe('部署应用到生产环境')
    // 历史仅成功一条（不再出现成功+错误双条）
    expect(state.naturalLanguageInputs).toHaveLength(1)
    expect(state.naturalLanguageInputs[0].result?.success).toBe(true)
    expect(state.naturalLanguageInputs[0].result?.workflow?.name).toBe('Deployment Pipeline')
  })

  it('naturalLanguageToWorkflow：无法理解时返回失败结果且不建工作流', async () => {
    const promise = useIntelligentWorkflowStore.getState().naturalLanguageToWorkflow('随便聊聊天气')
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.success).toBe(false)
    expect(result.confidence).toBe(0.3)
    expect(result.error).toContain('Unable to understand')
    expect(result.workflow).toBeUndefined()
    // 无工作流建档，但历史仍记录
    const state = useIntelligentWorkflowStore.getState()
    expect(state.workflows.size).toBe(0)
    expect(state.naturalLanguageInputs).toHaveLength(1)
    expect(state.naturalLanguageInputs[0].result?.success).toBe(false)
  })

  it('optimizeWorkflow：优化推进 learningCount 与 updatedAt；不存在静默', async () => {
    const store = useIntelligentWorkflowStore.getState()
    const wf = store.createWorkflow({
      name: '优化流',
      description: 'd',
      executionMode: 'sequential',
      nodes: new Map(),
      startNodeId: '',
      aiGenerated: false,
    })
    const beforeUpdatedAt = useIntelligentWorkflowStore.getState().workflows.get(wf.id)?.updatedAt ?? 0

    // 不存在的工作流 → 静默返回
    await expect(useIntelligentWorkflowStore.getState().optimizeWorkflow('幽灵ID')).resolves.toBeUndefined()

    const promise = useIntelligentWorkflowStore.getState().optimizeWorkflow(wf.id)
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()

    const optimized = useIntelligentWorkflowStore.getState().workflows.get(wf.id)
    expect(optimized?.stats.learningCount).toBe(1)
    expect((optimized?.updatedAt ?? 0)).toBeGreaterThanOrEqual(beforeUpdatedAt)
  })

  it('selfHeal：timeout 错误自愈成功——写 info 日志并返回 true', async () => {
    const { node, liveLogs } = makeInjectableNode('n1')
    const wf = makePlainWorkflow('注入自愈流', [node])
    injectWorkflow(wf)

    const promise = useIntelligentWorkflowStore.getState().selfHeal('注入自愈流', 'n1', '请求 timeout 超时')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe(true)

    expect(liveLogs).toHaveLength(1)
    expect(liveLogs[0].level).toBe('info')
    expect(liveLogs[0].message).toBe('Self-healing applied successfully')
  })

  it('selfHeal：普通错误自愈失败写 error 日志；不存在工作流/节点返回 false', async () => {
    const { node, liveLogs } = makeInjectableNode('n1')
    const wf = makePlainWorkflow('注入自愈失败流', [node])
    injectWorkflow(wf)
    const state = useIntelligentWorkflowStore.getState()

    const promise = state.selfHeal('注入自愈失败流', 'n1', '磁盘已满')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe(false)
    expect(liveLogs).toHaveLength(1)
    expect(liveLogs[0].level).toBe('error')
    expect(liveLogs[0].message).toContain('Self-healing failed')

    await expect(state.selfHeal('幽灵流程', 'n1', 'timeout')).resolves.toBe(false)
    await expect(state.selfHeal('注入自愈失败流', '幽灵节点', 'timeout')).resolves.toBe(false)
  })

  it('getWorkflowInsights：完成率映射四档性能评价', () => {
    const store = useIntelligentWorkflowStore.getState()
    const wf = store.createWorkflow({
      name: '洞察流',
      description: 'd',
      executionMode: 'sequential',
      nodes: new Map(['a', 'b', 'c', 'd', 'e'].map((n) => [n, makeNode(n)])),
      startNodeId: 'a',
      aiGenerated: false,
    })
    const setCompleted = (count: number) => {
      useIntelligentWorkflowStore.setState((s) => {
        const w = s.workflows.get(wf.id)
        if (w) w.stats.completedNodes = count
      })
    }

    setCompleted(0)
    expect(useIntelligentWorkflowStore.getState().getWorkflowInsights(wf.id)).toMatchObject({
      performance: 'Poor',
      accuracy: 0,
    })
    setCompleted(3)
    expect(useIntelligentWorkflowStore.getState().getWorkflowInsights(wf.id)).toMatchObject({
      performance: 'Fair',
      accuracy: 60,
    })
    setCompleted(4)
    expect(useIntelligentWorkflowStore.getState().getWorkflowInsights(wf.id)).toMatchObject({
      performance: 'Good',
      accuracy: 80,
    })
    setCompleted(5)
    expect(useIntelligentWorkflowStore.getState().getWorkflowInsights(wf.id)).toMatchObject({
      performance: 'Excellent',
      accuracy: 100,
    })
  })

  it('getWorkflowInsights：耗时瓶颈识别、三类建议与未知工作流守卫', () => {
    const store = useIntelligentWorkflowStore.getState()
    const nodes = [makeNode('slow', { status: 'completed' }), makeNode('bad', { status: 'failed' })]
    const wf = store.createWorkflow({
      name: '瓶颈流',
      description: 'd',
      executionMode: 'sequential',
      nodes: new Map(nodes.map((n) => [n.id, n])),
      startNodeId: 'slow',
      aiGenerated: false,
    })
    useIntelligentWorkflowStore.setState((s) => {
      const w = s.workflows.get(wf.id)
      if (!w) return
      const slow = w.nodes.get('slow')
      if (slow) {
        slow.duration = 6000
        slow.status = 'completed'
      }
      const bad = w.nodes.get('bad')
      if (bad) bad.status = 'failed'
      w.stats.failedNodes = 1
      w.stats.selfHealingCount = 2 // > totalNodes(2) * 0.5
      w.stats.aiDecisions = 5 // > totalNodes(2) * 2
    })

    const insights = useIntelligentWorkflowStore.getState().getWorkflowInsights(wf.id)
    expect(insights.bottlenecks).toEqual(['节点 slow took 6000ms'])
    expect(insights.suggestions).toEqual([
      'Consider adding error handling to improve reliability',
      'High self-healing rate suggests unstable conditions',
      'Many AI decisions may indicate unclear workflow logic',
    ])

    // 未知工作流 → Unknown 兜底
    expect(useIntelligentWorkflowStore.getState().getWorkflowInsights('幽灵ID')).toEqual({
      performance: 'Unknown',
      bottlenecks: [],
      suggestions: [],
      accuracy: 0,
    })
  })
})
