/**
 * @file IntelligentWorkflowPanel.deep.test.tsx
 * @description 智能工作流面板专项 — 四页签（输入·工作流·监控·洞察）/自然语言转换（真 store 1s 模拟）/模板创建/复制删除/取消执行/洞察展开
 * 策略：真 intelligent-workflow-store（经 useIntelligentWorkflow 真链路）+ 真 theme-store；状态用 setState 直播种子
 * 注：store 的 execute/pause/resume/retry/optimize 动作存在 immer 冻结缺陷（见报告），本文件只覆盖可用动作与渲染布线
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'

import { IntelligentWorkflowPanel } from '../IntelligentWorkflowPanel'
import { useIntelligentWorkflowStore } from '../../store/intelligent-workflow-store'
import type { Workflow, WorkflowNode } from '../../store/intelligent-workflow-store'

// ── Fixtures / Helpers ──

const mkNode = (over: Partial<WorkflowNode> = {}): WorkflowNode => ({
  id: 'n_' + Math.random().toString(36).slice(2, 8),
  name: '构建任务',
  type: 'task',
  status: 'pending',
  data: { description: '执行构建命令', enabled: true },
  retryCount: 0,
  dependencies: [],
  successors: [],
  logs: [],
  ...over,
})

const mkWorkflow = (over: Partial<Workflow> = {}): Workflow => ({
  id: 'wf_' + Math.random().toString(36).slice(2, 8),
  name: '发布流水线',
  description: '构建、测试并部署',
  status: 'draft',
  createdAt: Date.now() - 60_000,
  updatedAt: Date.now() - 60_000,
  executionMode: 'sequential',
  nodes: new Map<string, WorkflowNode>(),
  startNodeId: '',
  version: 1,
  stats: {
    totalNodes: 0, completedNodes: 0, failedNodes: 0, skippedNodes: 0,
    totalDuration: 0, aiDecisions: 0, selfHealingCount: 0, learningCount: 0,
  },
  aiGenerated: false,
  ...over,
})

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const tabBtn = (root: HTMLElement, name: string) =>
  Array.from(root.querySelectorAll('button')).find(b => b.textContent === name) as HTMLButtonElement

const inputArea = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('textarea')).find(t =>
    (t.placeholder || '').includes('用自然语言描述'),
  ) as HTMLTextAreaElement

const seedWorkflows = (...wfs: Workflow[]) =>
  act(() => {
    useIntelligentWorkflowStore.setState({ workflows: new Map(wfs.map(w => [w.id, w])) })
  })

const state = () => useIntelligentWorkflowStore.getState()

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  act(() => {
    useIntelligentWorkflowStore.setState({
      workflows: new Map(),
      executingWorkflowId: null,
      executionEvents: [],
      naturalLanguageInputs: [],
      learnedOptimizations: [],
      stats: {
        totalWorkflows: 0, totalExecutions: 0, successfulExecutions: 0,
        avgExecutionTime: 0, aiDecisionAccuracy: 0, selfHealingSuccessRate: 0,
      },
    })
  })
})

describe('IntelligentWorkflowPanel（智能工作流面板）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<IntelligentWorkflowPanel visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('visible 渲染骨架：头部徽标/四页签/自然语言输入区/空输入时转换按钮禁用', () => {
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    expect(container.textContent).toContain('INTELLIGENT WORKFLOW')
    expect(container.textContent).toContain('AI-POWERED')
    for (const tab of ['INPUT', 'WORKFLOWS', 'MONITORING', 'INSIGHTS']) {
      expect(tabBtn(container, tab)).toBeTruthy()
    }
    expect(container.textContent).toContain('NATURAL LANGUAGE INPUT')
    expect(inputArea(container)).toBeTruthy()
    expect((btnByText(container, '转换为工作流') as HTMLButtonElement).disabled).toBe(true)
    // 输入后解禁
    fireEvent.change(inputArea(container), { target: { value: '构建项目' } })
    expect((btnByText(container, '转换为工作流') as HTMLButtonElement).disabled).toBe(false)
  })

  it('WORKFLOWS 空态：暂无工作流 + 三个模板快捷创建；点模板经真 store 建卡', () => {
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'WORKFLOWS'))
    expect(container.textContent).toContain('暂无工作流')
    expect(container.textContent).toContain('使用自然语言输入创建你的第一个工作流')
    for (const tpl of ['CI/CD Pipeline', '代码审查工作流', '性能优化工作流']) {
      expect(btnByText(container, tpl)).toBeTruthy()
    }
    fireEvent.click(btnByText(container, 'CI/CD Pipeline'))
    expect(container.textContent).toContain('WORKFLOWS (1)')
    expect(container.textContent).toContain('DRAFT')
    expect(container.textContent).toContain('自动化构建、测试和部署流程')
    // 卡片操作按钮布线
    for (const label of ['执行', '复制', 'AI优化', '删除']) {
      expect(btnByText(container, label)).toBeTruthy()
    }
    expect(container.textContent).toContain('节点: 0')
  })

  it('自然语言转换成功（真 store 1s 模拟）：工作流入列 + 历史记录成功结果', async () => {
    // 注：store 成功分支存在 immer 冻结缺陷（result.workflow.id 赋值抛错，见交付报告），
    // 工作流本身已创建入库 —— 本用例只断言稳定的业务产出，不锁定受缺陷影响的清空行为。
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.change(inputArea(container), { target: { value: '自动构建代码并运行测试' } })
    fireEvent.click(btnByText(container, '转换为工作流'))
    // 模拟 AI 转换耗时 1s（真定时器）
    await waitFor(() => expect(state().workflows.size).toBe(1), { timeout: 4000 })
    // 输入历史：成功记录（工作流名 + 置信度 90%）
    expect(container.textContent).toContain('输入历史')
    expect(container.textContent).toContain('自动构建代码并运行测试')
    expect(container.textContent).toContain('CI/CD Pipeline')
    expect(container.textContent).toContain('置信度: 90%')
    fireEvent.click(tabBtn(container, 'WORKFLOWS'))
    expect(container.textContent).toContain('CI/CD Pipeline')
    // AI 生成标记：自然语言描述块回显原始输入
    expect(container.textContent).toContain('自然语言描述')
    expect(container.textContent).toContain('自动构建代码并运行测试')
  })

  it('自然语言转换失败：历史展示错误，不产生工作流', async () => {
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.change(inputArea(container), { target: { value: '完全无关的天气闲聊' } })
    fireEvent.click(btnByText(container, '转换为工作流'))
    await waitFor(() =>
      expect(container.textContent).toContain('Unable to understand the workflow request'),
      { timeout: 4000 },
    )
    expect(state().workflows.size).toBe(0)
    expect(container.textContent).toContain('置信度: 30%')
  })

  it('输入历史（种子）：成功/失败两种结果渲染', () => {
    act(() => {
      useIntelligentWorkflowStore.setState({
        naturalLanguageInputs: [
          {
            id: 'nl_1', input: '构建并部署服务', timestamp: Date.now() - 1000,
            result: { success: true, workflow: { name: 'CI/CD Pipeline' }, confidence: 0.9 },
          },
          {
            id: 'nl_2', input: '帮我写一首诗', timestamp: Date.now() - 500,
            result: { success: false, error: 'Unable to understand the workflow request', confidence: 0.3 },
          },
        ],
      })
    })
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    expect(container.textContent).toContain('输入历史')
    expect(container.textContent).toContain('构建并部署服务')
    expect(container.textContent).toContain('CI/CD Pipeline')
    expect(container.textContent).toContain('帮我写一首诗')
    expect(container.textContent).toContain('Unable to understand the workflow request')
  })

  it('工作流卡片操作（真 store）：复制生成 (Copy) 卡；删除后计数回落', () => {
    const wf = mkWorkflow({ id: 'wf_src', nodes: new Map([['n1', mkNode()]]) })
    seedWorkflows(wf)
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'WORKFLOWS'))
    expect(container.textContent).toContain('WORKFLOWS (1)')
    fireEvent.click(btnByText(container, '复制'))
    expect(container.textContent).toContain('WORKFLOWS (2)')
    expect(container.textContent).toContain('发布流水线 (Copy)')
    // 节点被复制：新卡统计 节点: 1
    expect(container.textContent).toContain('节点: 1')
    // 删除原始卡（btnByText 命中第一张删除按钮，属先插入的原卡）
    fireEvent.click(btnByText(container, '删除'))
    expect(container.textContent).toContain('WORKFLOWS (1)')
    expect(state().workflows.size).toBe(1)
  })

  it('监控页签运行态：EXECUTING 概览 + 节点状态卡 + 失败节点错误', () => {
    const nodes = new Map<string, WorkflowNode>([
      ['n1', mkNode({ id: 'n1', name: '构建任务', status: 'running' })],
      ['n2', mkNode({ id: 'n2', name: 'AI审查', type: 'ai', status: 'failed', error: 'AI 网关超时', duration: 1200 })],
    ])
    seedWorkflows(mkWorkflow({
      id: 'wf_run', status: 'running', startedAt: Date.now() - 2000, nodes,
      stats: { totalNodes: 2, completedNodes: 0, failedNodes: 1, skippedNodes: 0, totalDuration: 1200, aiDecisions: 0, selfHealingCount: 0, learningCount: 0 },
    }))
    act(() => { useIntelligentWorkflowStore.setState({ executingWorkflowId: 'wf_run' }) })
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'MONITORING'))
    expect(container.textContent).toContain('EXECUTION MONITORING')
    expect(container.textContent).toContain('EXECUTING: 发布流水线')
    expect(container.textContent).toContain('运行时间')
    expect(container.textContent).toContain('完成节点')
    expect(container.textContent).toContain('0/2')
    expect(container.textContent).toContain('节点执行状态')
    expect(container.textContent).toContain('构建任务')
    expect(container.textContent).toContain('AI审查')
    expect(container.textContent).toContain('AI 网关超时')
    // 工作流卡：running 态给 暂停/取消
    fireEvent.click(tabBtn(container, 'WORKFLOWS'))
    expect(btnByText(container, '暂停')).toBeTruthy()
    expect(btnByText(container, '取消')).toBeTruthy()
  })

  it('取消执行（真 store cancelWorkflow）：状态转 CANCELLED、监控回到空态', async () => {
    seedWorkflows(mkWorkflow({ id: 'wf_cancel', status: 'running', startedAt: Date.now() }))
    act(() => { useIntelligentWorkflowStore.setState({ executingWorkflowId: 'wf_cancel' }) })
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'WORKFLOWS'))
    fireEvent.click(btnByText(container, '取消'))
    await waitFor(() => expect(container.textContent).toContain('CANCELLED'))
    expect(state().executingWorkflowId).toBeNull()
    fireEvent.click(tabBtn(container, 'MONITORING'))
    expect(container.textContent).toContain('当前没有正在执行的工作流')
  })

  it('paused 工作流卡片：展示恢复按钮（不展示执行）', () => {
    seedWorkflows(mkWorkflow({ id: 'wf_paused', status: 'paused' }))
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'WORKFLOWS'))
    expect(btnByText(container, '恢复')).toBeTruthy()
    expect(btnByText(container, '执行')).toBeUndefined()
  })

  it('INSIGHTS 页签：全局统计卡 + 展开工作流洞察（性能/瓶颈/准确率条）', () => {
    seedWorkflows(mkWorkflow({
      id: 'wf_ins', status: 'completed',
      nodes: new Map([['n1', mkNode({ id: 'n1', status: 'completed', duration: 8000 })]]),
      stats: { totalNodes: 1, completedNodes: 1, failedNodes: 0, skippedNodes: 0, totalDuration: 8000, aiDecisions: 0, selfHealingCount: 0, learningCount: 0 },
    }))
    act(() => {
      useIntelligentWorkflowStore.setState({
        stats: {
          totalWorkflows: 1, totalExecutions: 3, successfulExecutions: 2,
          avgExecutionTime: 45000, aiDecisionAccuracy: 92.5, selfHealingSuccessRate: 88.8,
        },
      })
    })
    const { container } = render(<IntelligentWorkflowPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, 'INSIGHTS'))
    expect(container.textContent).toContain('WORKFLOW INSIGHTS')
    expect(container.textContent).toContain('总工作流')
    expect(container.textContent).toContain('总执行次数')
    expect(container.textContent).toContain('成功执行')
    expect(container.textContent).toContain('AI决策准确率')
    expect(container.textContent).toContain('92.5%')
    expect(container.textContent).toContain('自愈成功率')
    expect(container.textContent).toContain('88.8%')
    expect(container.textContent).toContain('平均执行时长')
    expect(container.textContent).toContain('45.0s')
    // 展开洞察面板
    fireEvent.click(Array.from(container.querySelectorAll('span')).find(s => s.textContent === '发布流水线')!)
    expect(container.textContent).toContain('性能评估')
    expect(container.textContent).toContain('Excellent')
    expect(container.textContent).toContain('瓶颈问题')
    expect(container.textContent).toContain('构建任务 took 8000ms')
    expect(container.textContent).toContain('准确率')
  })

  it('关闭布线：遮罩点击与头部 X 按钮触发 onClose', () => {
    const onClose = vi.fn()
    const { container } = render(<IntelligentWorkflowPanel visible onClose={onClose} />)
    // 内部面板点击不关闭
    fireEvent.click(container.firstElementChild!.firstElementChild!)
    expect(onClose).not.toHaveBeenCalled()
    // 遮罩（外层 fixed 容器本身）
    fireEvent.click(container.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
    // 头部关闭按钮（X 图标）
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
