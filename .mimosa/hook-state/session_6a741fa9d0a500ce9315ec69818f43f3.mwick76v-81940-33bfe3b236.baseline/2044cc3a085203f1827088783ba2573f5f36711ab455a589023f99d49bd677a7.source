/**
 * @file AgentWorkflowPanel.deep.test.tsx
 * @description Agent 工作流面板专项深化 — 头部/统计卡/空态、Agent 卡片（状态·技能截断·选中回调）、
 *              任务输入（创建·清空·执行中态）、日志（过滤·元数据·清空）、执行计划（子任务状态与 Agent 关联）
 * 策略：useAgent Hook 以 vi.hoisted 受控桩替换（真 agent-store 含 PDA 循环定时器不适合单测）；
 *       motion/react 真实渲染；断言中文文案与 lucide 图标 class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  hook: {
    agents: [] as unknown[],
    activeAgentId: null as string | null,
    currentTask: null as unknown,
    executionPlan: null as unknown,
    isExecuting: false,
    logs: [] as unknown[],
    selectAgent: vi.fn(),
    createTask: vi.fn(),
    startTask: vi.fn(),
    clearLogs: vi.fn(),
    getAgentStats: vi.fn(),
  },
}))

vi.mock('../../hooks/useAgent', () => ({
  useAgent: () => h.hook,
  getAgentIcon: (role: string) =>
    ({ planner: '📋', coder: '💻', reviewer: '🔍', tester: '🧪' })[role as 'planner'] || '🤖',
  formatAgentStatus: (status: string) =>
    ({ idle: '空闲', busy: '忙碌', offline: '离线', error: '错误' })[status as 'idle'] || status,
  getAgentStatusColor: (status: string) =>
    ({ idle: 'bg-green-500', busy: 'bg-blue-500', offline: 'bg-gray-500', error: 'bg-red-500' })[status as 'idle'] || 'bg-gray-500',
}))

import { AgentWorkflowPanel } from '../AgentWorkflowPanel'
import type { Agent, AgentLog, ComplexTask, ExecutionPlan } from '../../store/agent-store'

// ── Fixtures / Helpers ──

const mkAgent = (over: Partial<Agent> = {}): Agent => ({
  id: 'agent_1',
  name: '规划者',
  role: 'planner',
  status: 'idle',
  currentLoad: 3,
  skills: [
    { id: 's1', name: '任务分解' },
    { id: 's2', name: '代码生成' },
    { id: 's3', name: '测试生成' },
    { id: 's4', name: '代码审查' },
    { id: 's5', name: '重构' },
  ],
  stats: { tasksCompleted: 7, tasksFailed: 2 },
  memory: { learnings: [], patterns: [] },
  ...over,
} as unknown as Agent)

const mkLog = (over: Partial<AgentLog> = {}): AgentLog => ({
  id: 'log_' + Math.random().toString(36).slice(2, 6),
  agentId: 'agent_1',
  level: 'info',
  message: '开始执行子任务',
  timestamp: new Date('2026-01-01T08:00:00').getTime(),
  ...over,
} as AgentLog)

const STAT_VALUES = { totalAgents: 1, activeAgents: 0, idleAgents: 1, totalTasksCompleted: 7, totalTasksFailed: 2 }

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.hook.agents = []
  h.hook.activeAgentId = null
  h.hook.currentTask = null
  h.hook.executionPlan = null
  h.hook.isExecuting = false
  h.hook.logs = []
  h.hook.getAgentStats.mockReturnValue(STAT_VALUES)
})

describe('AgentWorkflowPanel（Agent 工作流面板）', () => {
  it('渲染骨架：标题/副标题/三张统计卡/任务输入区/Agents 列表与日志空态', () => {
    const { container } = render(<AgentWorkflowPanel />)
    expect(container.textContent).toContain('AI Agent 工作流')
    expect(container.textContent).toContain('PDA+记忆+反思架构')
    // 统计卡（真值来自 getAgentStats 桩）
    expect(container.textContent).toContain('总Agents')
    expect(container.textContent).toContain('已完成任务')
    expect(container.textContent).toContain('失败任务')
    expect(container.textContent).toContain('7')
    expect(container.textContent).toContain('2')
    // Agents 空列表 + 执行监控空态 + 日志空态
    expect(container.textContent).toContain('Agents')
    expect(container.textContent).toContain('创建一个任务开始工作')
    expect(container.textContent).toContain('暂无日志')
    expect(container.textContent).toContain('创建任务')
  })

  it('Agent 卡片：名称/状态中文/完成·失败·负载统计/负载百分比/技能 3 个后截断为 +2', () => {
    h.hook.agents = [mkAgent()]
    const { container } = render(<AgentWorkflowPanel />)
    expect(container.textContent).toContain('规划者')
    expect(container.textContent).toContain('空闲')
    expect(container.textContent).toContain('任务分解')
    expect(container.textContent).toContain('代码生成')
    expect(container.textContent).toContain('测试生成')
    expect(container.textContent).not.toContain('代码审查') // slice(0, 3) 截断
    expect(container.textContent).toContain('+2')
    // 负载百分比 = currentLoad(3)/10*100 = 30%
    expect(container.textContent).toContain('30%')
    // 状态色 class
    expect(container.querySelector('.bg-green-500')).toBeTruthy()
  })

  it('点击 Agent 卡片 → selectAgent(agentId) 布线', () => {
    h.hook.agents = [mkAgent({ id: 'agent_pick', name: '拾取者' })]
    const { container } = render(<AgentWorkflowPanel />)
    // AgentCard 根节点带 cursor-pointer，是该 DOM 中首个此类元素
    const card = container.querySelector('.cursor-pointer')!
    expect(card.textContent).toContain('拾取者')
    fireEvent.click(card)
    expect(h.hook.selectAgent).toHaveBeenCalledWith('agent_pick')
  })

  it('任务创建：输入描述提交 → createTask 收到裁剪文本并清空输入；空输入按钮禁用', () => {
    h.hook.createTask.mockReturnValue({ id: 'task_1', description: '创建登录页', priority: 'medium' })
    h.hook.startTask.mockResolvedValue(undefined)
    const { container } = render(<AgentWorkflowPanel />)
    const submit = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('开始执行'))!
    expect(submit.disabled).toBe(true)
    const area = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(area, { target: { value: '  创建登录页  ' } })
    expect(submit.disabled).toBe(false)
    fireEvent.submit(area.closest('form')!)
    expect(h.hook.createTask).toHaveBeenCalledWith('创建登录页')
    expect(h.hook.startTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task_1' }))
    expect(area.value).toBe('')
    // 优先级选择器存在
    expect(container.querySelector('select')).toBeTruthy()
  })

  it('isExecuting=true：按钮切换「执行中...」并带旋转图标，textarea 与 select 禁用', () => {
    h.hook.isExecuting = true
    const { container } = render(<AgentWorkflowPanel />)
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent!.includes('执行中...'))!
    expect(btn.disabled).toBe(true)
    expect(container.querySelector('.animate-spin')).toBeTruthy()
    expect((container.querySelector('textarea') as HTMLTextAreaElement).disabled).toBe(true)
    expect((container.querySelector('select') as HTMLSelectElement).disabled).toBe(true)
  })

  it('日志列表：倒序渲染/级别计数/元数据 JSON 块/级别过滤只留 error', async () => {
    h.hook.logs = [
      mkLog({ id: 'l1', level: 'info', message: '信息一条' }),
      mkLog({ id: 'l2', level: 'warn', message: '警告一条' }),
      mkLog({
        id: 'l3',
        level: 'error',
        message: '出错了',
        metadata: { code: 500, reason: 'timeout' },
      }),
    ]
    const { container } = render(<AgentWorkflowPanel />)
    expect(container.textContent).toContain('日志')
    expect(container.textContent).toContain('(3)')
    expect(container.textContent).toContain('信息一条')
    expect(container.textContent).toContain('警告一条')
    expect(container.textContent).toContain('出错了')
    // 元数据以 JSON pre 呈现
    expect(container.querySelector('pre')!.textContent).toContain('"code"')
    expect(container.querySelector('pre')!.textContent).toContain('timeout')
    // 过滤为 error（页面有两个 select：任务优先级在前，须按 option 值定位日志级别筛选）
    const logSelect = Array.from(container.querySelectorAll('select')).find(
      sl => Array.from(sl.querySelectorAll('option')).some(o => o.value === 'all'),
    ) as HTMLSelectElement
    expect(logSelect).toBeTruthy()
    fireEvent.change(logSelect, { target: { value: 'error' } })
    expect(container.textContent).toContain('(1)')
    expect(container.textContent).toContain('出错了')
    // 退出动画期间旧条目短暂残留，动画结束后消失
    await waitFor(() => expect(container.textContent).not.toContain('信息一条'))
  })

  it('清空日志：头部垃圾桶与日志区垃圾桶两处均触发 clearLogs', () => {
    const { container } = render(<AgentWorkflowPanel />)
    const clears = container.querySelectorAll('button[title="清空日志"]')
    expect(clears).toHaveLength(2)
    fireEvent.click(clears[0])
    fireEvent.click(clears[1])
    expect(h.hook.clearLogs).toHaveBeenCalledTimes(2)
  })

  it('执行监控：当前任务（优先级徽章 critical + 时间）与执行计划（子任务序号/描述/Agent 关联/状态图标）', () => {
    const task: ComplexTask = {
      id: 'task_9',
      description: '构建一个电商后台',
      priority: 'critical',
      createdAt: new Date('2026-02-03T10:00:00').getTime(),
      dependencies: [],
    }
    const plan: ExecutionPlan = {
      taskId: 'task_9',
      subtasks: [
        { id: 'st1', description: '分析需求', assignedAgentId: 'agent_1', status: 'in_progress', dependencies: [] },
        { id: 'st2', description: '编写代码', assignedAgentId: 'agent_x', status: 'pending', dependencies: [] },
        { id: 'st3', description: '运行测试', assignedAgentId: 'agent_1', status: 'completed', dependencies: [] },
        { id: 'st4', description: '发布产物', assignedAgentId: 'agent_x', status: 'failed', dependencies: [] },
      ],
      estimatedDuration: 42,
      strategy: 'sequential',
    } as unknown as ExecutionPlan
    h.hook.agents = [mkAgent()]
    h.hook.currentTask = task
    h.hook.executionPlan = plan
    const { container } = render(<AgentWorkflowPanel />)
    expect(container.textContent).toContain('当前任务')
    expect(container.textContent).toContain('构建一个电商后台')
    expect(container.textContent).toContain('critical')
    expect(container.textContent).not.toContain('创建一个任务开始工作') // 空态消失
    // 执行计划头与预估时长
    expect(container.textContent).toContain('执行计划')
    expect(container.textContent).toContain('预计 42 分钟')
    // 子任务序号与描述
    expect(container.textContent).toContain('分析需求')
    expect(container.textContent).toContain('编写代码')
    expect(container.textContent).toContain('运行测试')
    expect(container.textContent).toContain('发布产物')
    // Agent 关联（子任务 1 找到 agent_1 → 显示名称与图标）
    expect(container.textContent).toContain('规划者')
    // 状态文案与图标
    expect(container.textContent).toContain('in_progress')
    expect(container.textContent).toContain('completed')
    expect(container.textContent).toContain('failed')
    expect(container.querySelector('.animate-spin')).toBeTruthy() // in_progress 旋转图标
    expect(container.querySelector('.lucide-circle-check')).toBeTruthy() // completed 图标
    expect(container.querySelector('.lucide-circle-x')).toBeTruthy() // failed 图标
    expect(container.querySelector('.lucide-clock')).toBeTruthy() // pending 图标
  })
})
