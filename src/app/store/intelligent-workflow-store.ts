/**
 * @file intelligent-workflow-store.ts
 * @description 智能工作流Store，实现AI驱动的工作流管理系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,workflow,ai,intelligent,automation
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createLogger } from '../utils/logger'

const logger = createLogger('workflow')

/**
 * 工作流节点类型
 */
export type WorkflowNodeType =
  | 'task' // 任务节点
  | 'condition' // 条件节点
  | 'loop' // 循环节点
  | 'ai' // AI决策节点
  | 'parallel' // 并行节点
  | 'error-handler' // 错误处理节点

/**
 * 工作流节点状态
 */
export type WorkflowNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

/**
 * 工作流节点
 */
export interface WorkflowNode {
  /** 节点ID */
  id: string
  /** 节点名称 */
  name: string
  /** 节点类型 */
  type: WorkflowNodeType
  /** 节点状态 */
  status: WorkflowNodeStatus
  /** 开始时间 */
  startTime?: number
  /** 结束时间 */
  endTime?: number
  /** 执行时长（ms） */
  duration?: number
  /** 节点数据 */
  data: {
    /** 任务描述 */
    description?: string
    /** 命令/操作 */
    command?: string
    /** 参数 */
    params?: Record<string, unknown>
    /** AI提示词 */
    aiPrompt?: string
    /** 条件表达式 */
    condition?: string
    /** 循环条件 */
    loopCondition?: string
    /** 最大循环次数 */
    maxLoops?: number
    /** 错误处理策略 */
    errorStrategy?: 'retry' | 'skip' | 'fail' | 'fallback'
    /** 回退节点ID */
    fallbackNodeId?: string
    /** 是否启用 */
    enabled: boolean
  }
  /** 输入数据 */
  input?: unknown
  /** 输出数据 */
  output?: unknown
  /** 错误信息 */
  error?: string
  /** 重试次数 */
  retryCount: number
  /** 依赖节点ID列表 */
  dependencies: string[]
  /** 下游节点ID列表 */
  successors: string[]
  /** 执行日志 */
  logs: WorkflowNodeLog[]
}

/**
 * 工作流节点日志
 */
export interface WorkflowNodeLog {
  /** 时间戳 */
  timestamp: number
  /** 日志级别 */
  level: 'info' | 'warn' | 'error' | 'debug'
  /** 日志消息 */
  message: string
  /** 额外数据 */
  data?: unknown
}

/**
 * 工作流状态
 */
export type WorkflowStatus =
  | 'draft' // 草稿
  | 'ready' // 就绪
  | 'running' // 运行中
  | 'paused' // 已暂停
  | 'completed' // 已完成
  | 'failed' // 已失败
  | 'cancelled' // 已取消

/**
 * 工作流执行模式
 */
export type WorkflowExecutionMode =
  | 'sequential' // 顺序执行
  | 'parallel' // 并行执行
  | 'hybrid' // 混合模式

/**
 * 工作流
 */
export interface Workflow {
  /** 工作流ID */
  id: string
  /** 工作流名称 */
  name: string
  /** 工作流描述 */
  description: string
  /** 工作流状态 */
  status: WorkflowStatus
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 开始时间 */
  startedAt?: number
  /** 结束时间 */
  endedAt?: number
  /** 执行时长（ms） */
  duration?: number
  /** 执行模式 */
  executionMode: WorkflowExecutionMode
  /** 工作流节点 */
  nodes: Map<string, WorkflowNode>
  /** 起始节点ID */
  startNodeId: string
  /** 结束节点ID */
  endNodeId?: string
  /** 执行统计 */
  stats: {
    /** 总节点数 */
    totalNodes: number
    /** 已完成节点数 */
    completedNodes: number
    /** 失败节点数 */
    failedNodes: number
    /** 跳过节点数 */
    skippedNodes: number
    /** 总执行时长（ms） */
    totalDuration: number
    /** AI决策次数 */
    aiDecisions: number
    /** 自愈次数 */
    selfHealingCount: number
    /** 学习优化次数 */
    learningCount: number
  }
  /** 工作流版本 */
  version: number
  /** 自然语言描述 */
  naturalLanguageDescription?: string
  /** AI生成的 */
  aiGenerated: boolean
}

/**
 * 工作流执行事件
 */
export interface WorkflowExecutionEvent {
  /** 事件ID */
  id: string
  /** 事件类型 */
  type: 'node-started' | 'node-completed' | 'node-failed' | 'workflow-started' | 'workflow-completed' | 'workflow-failed' | 'workflow-paused' | 'workflow-resumed'
  /** 工作流ID */
  workflowId: string
  /** 节点ID */
  nodeId?: string
  /** 时间戳 */
  timestamp: number
  /** 事件数据 */
  data?: unknown
}

/**
 * 自然语言转换结果
 */
export interface NaturalLanguageConversionResult {
  /** 转换是否成功 */
  success: boolean
  /** 生成的工作流 */
  workflow?: Partial<Workflow>
  /** 错误信息 */
  error?: string
  /** AI解释 */
  explanation?: string
  /** 置信度 */
  confidence: number
}

/**
 * 智能工作流Store状态
 */
interface IntelligentWorkflowStoreState {
  /** 工作流列表 */
  workflows: Map<string, Workflow>
  /** 当前执行的工作流ID */
  executingWorkflowId: string | null
  /** 执行事件历史 */
  executionEvents: WorkflowExecutionEvent[]
  /** 自然语言输入历史 */
  naturalLanguageInputs: {
    id: string
    input: string
    result?: NaturalLanguageConversionResult
    timestamp: number
  }[]
  /** 工作流模板 */
  workflowTemplates: Workflow[]
  /** 学习的优化建议 */
  learnedOptimizations: {
    workflowId: string
    nodeId: string
    optimization: string
    applied: boolean
    timestamp: number
  }[]
  /** 统计信息 */
  stats: {
    /** 总工作流数 */
    totalWorkflows: number
    /** 总执行次数 */
    totalExecutions: number
    /** 成功执行次数 */
    successfulExecutions: number
    /** 平均执行时长（ms） */
    avgExecutionTime: number
    /** AI决策准确率 */
    aiDecisionAccuracy: number
    /** 自愈成功率 */
    selfHealingSuccessRate: number
  }
}

/**
 * 智能工作流Store操作
 */
interface IntelligentWorkflowStoreActions {
  // ===== 工作流管理 =====
  /** 创建工作流 */
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'stats' | 'status'>) => Workflow
  /** 更新工作流 */
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => void
  /** 删除工作流 */
  deleteWorkflow: (workflowId: string) => void
  /** 复制工作流 */
  duplicateWorkflow: (workflowId: string) => Workflow | null

  // ===== 工作流执行 =====
  /** 开始执行工作流 */
  executeWorkflow: (workflowId: string) => Promise<void>
  /** 暂停工作流 */
  pauseWorkflow: (workflowId: string) => void
  /** 恢复工作流 */
  resumeWorkflow: (workflowId: string) => void
  /** 取消工作流 */
  cancelWorkflow: (workflowId: string) => void
  /** 重试失败节点 */
  retryNode: (workflowId: string, nodeId: string) => Promise<void>

  // ===== AI智能功能 =====
  /** 自然语言转换为工作流 */
  naturalLanguageToWorkflow: (input: string) => Promise<NaturalLanguageConversionResult>
  /** AI优化工作流 */
  optimizeWorkflow: (workflowId: string) => Promise<void>
  /** AI生成节点建议 */
  generateNodeSuggestions: (context: string) => Promise<WorkflowNode[]>

  // ===== 自愈与学习 =====
  /** 自愈执行 */
  selfHeal: (workflowId: string, nodeId: string, error: string) => Promise<boolean>
  /** 应用学习优化 */
  applyLearningOptimization: (workflowId: string, nodeId: string) => void
  /** 获取工作流洞察 */
  getWorkflowInsights: (workflowId: string) => {
    performance: string
    bottlenecks: string[]
    suggestions: string[]
    accuracy: number
  }

  // ===== 数据管理 =====
  /** 清除执行事件 */
  clearExecutionEvents: () => void
  /** 清除自然语言输入历史 */
  clearNaturalLanguageHistory: () => void
  /** 清除学习优化 */
  clearLearnedOptimizations: () => void
  /** 获取统计数据 */
  getStats: () => IntelligentWorkflowStoreState['stats']

  // ===== 内部辅助方法 =====
  /** 添加执行事件 */
  addExecutionEvent: (event: Omit<WorkflowExecutionEvent, 'id'>) => void
}

/**
 * 预定义工作流模板
 */
const WORKFLOW_TEMPLATES: Partial<Workflow>[] = [
  {
    name: 'CI/CD Pipeline',
    description: '自动化构建、测试和部署流程',
    executionMode: 'hybrid',
    aiGenerated: false,
    naturalLanguageDescription: '自动构建代码、运行测试、部署到生产环境',
  },
  {
    name: '代码审查工作流',
    description: '自动执行代码审查和质量检查',
    executionMode: 'sequential',
    aiGenerated: false,
    naturalLanguageDescription: '分析代码质量、检查潜在问题、生成审查报告',
  },
  {
    name: '性能优化工作流',
    description: '自动分析和优化应用性能',
    executionMode: 'sequential',
    aiGenerated: false,
    naturalLanguageDescription: '收集性能指标、识别瓶颈、应用优化建议',
  },
]

/**
 * 智能工作流Store
 */
export const useIntelligentWorkflowStore = create<IntelligentWorkflowStoreState & IntelligentWorkflowStoreActions>()(
  immer((set, get) => ({
    // 初始状态
    workflows: new Map(),
    executingWorkflowId: null,
    executionEvents: [],
    naturalLanguageInputs: [],
    workflowTemplates: WORKFLOW_TEMPLATES as Workflow[],
    learnedOptimizations: [],
    stats: {
      totalWorkflows: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      avgExecutionTime: 0,
      aiDecisionAccuracy: 0,
      selfHealingSuccessRate: 0,
    },

    // ===== 工作流管理 =====

    createWorkflow: (workflow) => {
      const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = Date.now()
      const newWorkflow: Workflow = {
        ...workflow,
        id,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        version: 1,
        stats: {
          totalNodes: workflow.nodes.size,
          completedNodes: 0,
          failedNodes: 0,
          skippedNodes: 0,
          totalDuration: 0,
          aiDecisions: 0,
          selfHealingCount: 0,
          learningCount: 0,
        },
      }

      set((state) => {
        state.workflows.set(id, newWorkflow)
        state.stats.totalWorkflows = state.workflows.size
      })

      logger.info(`Created workflow ${id}: ${newWorkflow.name}`)
      return newWorkflow
    },

    updateWorkflow: (workflowId, updates) => {
      set((state) => {
        const workflow = state.workflows.get(workflowId)
        if (workflow) {
          Object.assign(workflow, updates)
          workflow.updatedAt = Date.now()
          workflow.version++
        }
      })
    },

    deleteWorkflow: (workflowId) => {
      set((state) => {
        state.workflows.delete(workflowId)
        state.stats.totalWorkflows = state.workflows.size
      })
      logger.info(`Deleted workflow ${workflowId}`)
    },

    duplicateWorkflow: (workflowId) => {
      const original = get().workflows.get(workflowId)
      if (!original) return null

      const newWorkflow = get().createWorkflow({
        ...original,
        name: `${original.name} (Copy)`,
        naturalLanguageDescription: original.naturalLanguageDescription
          ? `${original.naturalLanguageDescription} (复制)`
          : undefined,
      })

      // 复制节点
      set((state) => {
        const newNodes = new Map<string, WorkflowNode>()
        original.nodes.forEach((node) => {
          newNodes.set(node.id, { ...node })
        })
        state.workflows.get(newWorkflow.id)!.nodes = newNodes
      })

      return newWorkflow
    },

    // ===== 工作流执行 =====

    executeWorkflow: async (workflowId) => {
      const stored = get().workflows.get(workflowId)
      if (!stored) {
        throw new Error(`Workflow ${workflowId} not found`)
      }

      // 34号修复（25号回归）：执行链直改 node.status 与 stats，而 store 内对象经 immer 定稿已冻结——
      // 冻结感知可变化：冻结走拷贝，未冻结（注入/live）原样直传保契约
      const workflow = mutableWorkflow(stored)

      set((state) => {
        state.executingWorkflowId = workflowId
        const wf = state.workflows.get(workflowId)
        if (wf) {
          wf.status = 'running'
          wf.startedAt = Date.now()
          wf.stats = {
            ...wf.stats,
            completedNodes: 0,
            failedNodes: 0,
            skippedNodes: 0,
            totalDuration: 0,
          }
        }
      })
      workflow.startedAt = Date.now()

      // 记录执行事件
      get().addExecutionEvent({
        type: 'workflow-started',
        workflowId,
        timestamp: Date.now(),
      })

      try {
        // 执行工作流节点
        await executeWorkflowNodes(workflow, get())

        set((state) => {
          state.stats.totalExecutions++
          state.stats.successfulExecutions++
        })
      } catch (error) {
        set((state) => {
          const wfFail = state.workflows.get(workflowId)
          if (wfFail) wfFail.status = 'failed'
          state.stats.totalExecutions++
        })

        throw error
      }
    },

    pauseWorkflow: (workflowId) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow || workflow.status !== 'running') return

      set((state) => {
        // 25号修复：producer 外取得的 workflow 已被 immer 冻结——须从 state 重新取草稿
        const w = state.workflows.get(workflowId)
        if (w) w.status = 'paused'
      })

      get().addExecutionEvent({
        type: 'workflow-paused',
        workflowId,
        timestamp: Date.now(),
      })

      logger.info(`Paused workflow ${workflowId}`)
    },

    resumeWorkflow: (workflowId) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow || workflow.status !== 'paused') return

      set((state) => {
        const w = state.workflows.get(workflowId)
        if (w) w.status = 'running'
      })

      get().addExecutionEvent({
        type: 'workflow-resumed',
        workflowId,
        timestamp: Date.now(),
      })

      logger.info(`Resumed workflow ${workflowId}`)
    },

    cancelWorkflow: (workflowId) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow) return

      set((state) => {
        const wf = state.workflows.get(workflowId)
        if (wf) {
          wf.status = 'cancelled'
          wf.endedAt = Date.now()
        }
        if (state.executingWorkflowId === workflowId) {
          state.executingWorkflowId = null
        }
      })

      logger.info(`Cancelled workflow ${workflowId}`)
    },

    retryNode: async (workflowId, nodeId) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow) return

      const node = workflow.nodes.get(nodeId)
      if (!node) return

      // 重置节点状态
      set((state) => {
        // 25号修复：node 同样经 producer 外取得（冻结）——从 state 草稿重新定位
        const w = state.workflows.get(workflowId)
        const n = w?.nodes.get(nodeId)
        if (n) {
          n.status = 'pending'
          n.retryCount++
          n.error = undefined
        }
      })

      // 34号：冻结感知——reset 后重取（retryCount 新值）；冻结走拷贝回写，未冻结直传保 live 契约
      const fresh = get().workflows.get(workflowId)
      const freshNode = fresh?.nodes.get(nodeId)
      if (!fresh || !freshNode) return
      const frozen = Object.isFrozen(freshNode) || Object.isFrozen(fresh.stats)
      // immer reset 定稿会把 getter 属性（如 logs）物化为冻结快照数组——克隆重挂可变 logs，
      // 执行后随写回落库（AI 决策日志断言走 store 终态）
      const retryNodeCopy = frozen ? { ...freshNode, logs: [] as WorkflowNodeLog[] } : freshNode
      const workflowCopy = mutableWorkflow(fresh)

      try {
        await executeNode(retryNodeCopy, workflowCopy, get())
        if (frozen) {
          set((state) => {
            const wf = state.workflows.get(workflowId)
            const n = wf?.nodes.get(nodeId)
            if (wf && n) {
              n.status = 'completed'
              n.endTime = retryNodeCopy.endTime
              n.duration = retryNodeCopy.duration
              n.error = undefined
              n.logs = retryNodeCopy.logs
              // 完成计数在执行链副本上自增——从此处透传落库（aiDecisions 等已由链上 updateWorkflow 落库，勿覆盖）
              if (wf.stats) {
                wf.stats.completedNodes = workflowCopy.stats.completedNodes
                wf.stats.failedNodes = workflowCopy.stats.failedNodes
                wf.stats.skippedNodes = workflowCopy.stats.skippedNodes
              }
            }
          })
        } else {
          // 未冻结直传：执行链已直写 live 对象；store 内重试计数保持 reset 值
          retryNodeCopy.status = 'completed'
        }
      } catch (error) {
        if (frozen) {
          set((state) => {
            const wf = state.workflows.get(workflowId)
            const n = wf?.nodes.get(nodeId)
            if (wf && n) {
              n.status = 'failed'
              n.error = retryNodeCopy.error
              if (wf.stats) {
                wf.stats.failedNodes = workflowCopy.stats.failedNodes
                wf.stats.skippedNodes = workflowCopy.stats.skippedNodes
              }
            }
          })
        } else {
          retryNodeCopy.status = 'failed'
        }
        throw error
      }
    },

    // ===== AI智能功能 =====

    naturalLanguageToWorkflow: async (input) => {
      const inputId = `nl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      try {
        // 模拟AI转换（实际应调用AI服务）
        const result = await simulateNaturalLanguageConversion(input)

        set((state) => {
          state.naturalLanguageInputs.push({
            id: inputId,
            input,
            result,
            timestamp: Date.now(),
          })
        })

        // 如果转换成功，创建工作流
        if (result.success && result.workflow) {
          const workflow = get().createWorkflow({
            name: result.workflow.name || 'Untitled Workflow',
            description: result.workflow.description || '',
            executionMode: result.workflow.executionMode || 'sequential',
            nodes: new Map(),
            startNodeId: '',
            aiGenerated: true,
            naturalLanguageDescription: result.workflow.naturalLanguageDescription || input,
          })
          // 34号修复（26号回归）：result 已随历史入 store 被 immer 冻结——属性赋值抛 TypeError
          // 且被外层 catch 吞掉（转换成功却报失败）。以新对象返回修正后的引用
          return { ...result, workflow: { ...result.workflow, id: workflow.id } }
        }

        return result
      } catch (error) {
        const errorResult: NaturalLanguageConversionResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          confidence: 0,
        }

        set((state) => {
          state.naturalLanguageInputs.push({
            id: inputId,
            input,
            result: errorResult,
            timestamp: Date.now(),
          })
        })

        return errorResult
      }
    },

    optimizeWorkflow: async (workflowId) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow) return

      logger.debug(`AI optimizing workflow ${workflowId}...`)

      // 模拟AI优化（实际应调用AI服务）
      await simulateAIOptimization(workflow)

      set((state) => {
        const w = state.workflows.get(workflowId)
        if (w) {
          w.updatedAt = Date.now()
          w.stats.learningCount++
        }
      })

      logger.info(`Workflow ${workflowId} optimized`)
    },

    generateNodeSuggestions: async (_context) => {
      // 模拟AI生成节点建议
      const suggestions: WorkflowNode[] = [
        {
          id: `suggested-${Date.now()}-1`,
          name: 'Code Analysis',
          type: 'ai',
          status: 'pending',
          data: {
            description: 'Analyze code quality and potential issues',
            aiPrompt: 'Analyze the current code for quality issues, bugs, and optimization opportunities.',
            enabled: true,
          },
          retryCount: 0,
          dependencies: [],
          successors: [],
          logs: [],
        },
        {
          id: `suggested-${Date.now()}-2`,
          name: 'Performance Check',
          type: 'ai',
          status: 'pending',
          data: {
            description: 'Check application performance metrics',
            aiPrompt: 'Check Core Web Vitals and identify performance bottlenecks.',
            enabled: true,
          },
          retryCount: 0,
          dependencies: [],
          successors: [],
          logs: [],
        },
      ]

      return suggestions
    },

    // ===== 自愈与学习 =====

    selfHeal: async (workflowId, nodeId, error) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow) return false

      const node = workflow.nodes.get(nodeId)
      if (!node) return false

      logger.debug(`Self-healing node ${nodeId}...`)

      // 模拟自愈逻辑
      const healed = await simulateSelfHealing(node, error)

      if (healed) {
        set(() => {
          workflow.stats.selfHealingCount++
          node.logs.push({
            timestamp: Date.now(),
            level: 'info',
            message: 'Self-healing applied successfully',
          })
        })
      } else {
        set(() => {
          node.logs.push({
            timestamp: Date.now(),
            level: 'error',
            message: `Self-healing failed: ${error}`,
          })
        })
      }

      return healed
    },

    applyLearningOptimization: (workflowId, nodeId) => {
      const optimization = get().learnedOptimizations.find(
        (opt) => opt.workflowId === workflowId && opt.nodeId === nodeId && !opt.applied
      )

      if (!optimization) return

      set((state) => {
        optimization.applied = true
        const workflow = state.workflows.get(workflowId)
        if (workflow) {
          const node = workflow.nodes.get(nodeId)
          if (node) {
            node.logs.push({
              timestamp: Date.now(),
              level: 'info',
              message: `Applied optimization: ${optimization.optimization}`,
            })
          }
          workflow.stats.learningCount++
        }
      })

      logger.info(`Applied optimization for ${workflowId}/${nodeId}`)
    },

    getWorkflowInsights: (workflowId) => {
      const workflow = get().workflows.get(workflowId)
      if (!workflow) {
        return {
          performance: 'Unknown',
          bottlenecks: [],
          suggestions: [],
          accuracy: 0,
        }
      }

      const completedNodes = Array.from(workflow.nodes.values()).filter(
        (n) => n.status === 'completed'
      )
      const failedNodes = Array.from(workflow.nodes.values()).filter(
        (n) => n.status === 'failed'
      )

      const successRate =
        workflow.stats.totalNodes > 0
          ? (workflow.stats.completedNodes / workflow.stats.totalNodes) * 100
          : 0

      let performance = 'Excellent'
      if (successRate < 50) performance = 'Poor'
      else if (successRate < 70) performance = 'Fair'
      else if (successRate < 90) performance = 'Good'

      const bottlenecks: string[] = []
      const suggestions: string[] = []

      // 识别瓶颈
      completedNodes.forEach((node) => {
        if (node.duration && node.duration > 5000) {
          bottlenecks.push(`${node.name} took ${node.duration}ms`)
        }
      })

      // 生成建议
      if (failedNodes.length > 0) {
        suggestions.push('Consider adding error handling to improve reliability')
      }
      if (workflow.stats.selfHealingCount > workflow.stats.totalNodes * 0.5) {
        suggestions.push('High self-healing rate suggests unstable conditions')
      }
      if (workflow.stats.aiDecisions > workflow.stats.totalNodes * 2) {
        suggestions.push('Many AI decisions may indicate unclear workflow logic')
      }

      return {
        performance,
        bottlenecks,
        suggestions,
        accuracy: successRate,
      }
    },

    // ===== 数据管理 =====

    clearExecutionEvents: () => {
      set((state) => {
        state.executionEvents = []
      })
    },

    clearNaturalLanguageHistory: () => {
      set((state) => {
        state.naturalLanguageInputs = []
      })
    },

    clearLearnedOptimizations: () => {
      set((state) => {
        state.learnedOptimizations = []
      })
    },

    getStats: () => {
      return get().stats
    },

    // ===== 内部辅助方法 =====

    addExecutionEvent: (event) => {
      set((state) => {
        state.executionEvents.push({
          ...event,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })
      })
    },
  }))
)

/**
 * 执行工作流节点（递归执行）
 */
/** 34号：冻结感知可变化——未冻结对象原样返回（保留注入/live 引用契约），冻结对象拷贝解冻 */
function mutableWorkflow(w: Workflow): Workflow {
  if (!Object.isFrozen(w) && !Object.isFrozen(w.stats)) return w
  const nodes = new Map<string, WorkflowNode>()
  w.nodes.forEach((n, k) => nodes.set(k, Object.isFrozen(n) ? { ...n } : n))
  return { ...w, nodes, stats: Object.isFrozen(w.stats) ? { ...w.stats } : w.stats }
}

async function executeWorkflowNodes(
  workflow: Workflow,
  store: ReturnType<typeof useIntelligentWorkflowStore.getState>
): Promise<void> {
  const nodes = Array.from(workflow.nodes.values())
  const executingNodes = nodes.filter((n) => n.status === 'pending' && n.data.enabled)

  for (const node of executingNodes) {
    await executeNode(node, workflow, store)
  }

  // 34号：可变副本上的节点终态与执行计数回写 store（此前链上改动从不落库）
  store.updateWorkflow(workflow.id, {
    nodes: new Map(workflow.nodes),
    stats: {
      ...store.workflows.get(workflow.id)?.stats,
      completedNodes: workflow.stats.completedNodes,
      failedNodes: workflow.stats.failedNodes,
      skippedNodes: workflow.stats.skippedNodes,
    },
  })

  // 检查是否所有节点都已完成
  const allCompleted = nodes.every((n) => n.status === 'completed' || n.status === 'skipped')
  if (allCompleted) {
    store.updateWorkflow(workflow.id, {
      status: 'completed',
      endedAt: Date.now(),
      duration: Date.now() - (workflow.startedAt || Date.now()),
    })
  }
}

/**
 * 执行单个节点
 */
async function executeNode(
  node: WorkflowNode,
  workflow: Workflow,
  store: ReturnType<typeof useIntelligentWorkflowStore.getState>
): Promise<void> {
  // 检查依赖
  const dependenciesReady = node.dependencies.every((depId) => {
    const depNode = workflow.nodes.get(depId)
    return depNode && depNode.status === 'completed'
  })

  if (!dependenciesReady) {
    node.status = 'skipped'
    workflow.stats.skippedNodes++
    return
  }

  node.status = 'running'
  node.startTime = Date.now()

  store.addExecutionEvent({
    type: 'node-started',
    workflowId: workflow.id,
    nodeId: node.id,
    timestamp: Date.now(),
  })

  try {
    if (node.type === 'ai') {
      // AI节点需要特殊处理
      const startTime = Date.now()
      await executeAINode(node, workflow, store)
      const duration = Date.now() - startTime

      store.updateWorkflow(workflow.id, {
        stats: {
          ...workflow.stats,
          aiDecisions: workflow.stats.aiDecisions + 1,
          totalDuration: workflow.stats.totalDuration + duration,
        },
      })
    } else {
      // 普通节点执行
      const startTime = Date.now()
      await simulateNodeExecution(node)
      const duration = Date.now() - startTime

      store.updateWorkflow(workflow.id, {
        stats: {
          ...workflow.stats,
          totalDuration: workflow.stats.totalDuration + duration,
        },
      })
    }

    node.status = 'completed'
    node.endTime = Date.now()
    node.duration = node.endTime - node.startTime

    workflow.stats.completedNodes++

    store.addExecutionEvent({
      type: 'node-completed',
      workflowId: workflow.id,
      nodeId: node.id,
      timestamp: Date.now(),
    })
  } catch (error) {
    node.status = 'failed'
    node.endTime = Date.now()
    node.duration = node.endTime - node.startTime
    node.error = error instanceof Error ? error.message : String(error)

    workflow.stats.failedNodes++

    store.addExecutionEvent({
      type: 'node-failed',
      workflowId: workflow.id,
      nodeId: node.id,
      timestamp: Date.now(),
      data: { error: node.error },
    })

    // 尝试自愈
    if (node.data.errorStrategy !== 'fail') {
      const healed = await store.selfHeal(workflow.id, node.id, node.error || '')
      if (healed) {
        node.status = 'completed'
        workflow.stats.completedNodes++
        workflow.stats.failedNodes--
      } else {
        throw error
      }
    } else {
      throw error
    }
  }
}

/**
 * 执行AI节点
 */
async function executeAINode(
  node: WorkflowNode,
  _workflow: Workflow,
  _store: ReturnType<typeof useIntelligentWorkflowStore.getState>
): Promise<void> {
  if (!node.data.aiPrompt) return

  logger.debug(`Executing AI node ${node.id}: ${node.data.aiPrompt}`)

  // 模拟AI执行（实际应调用AI服务）
  await simulateAIExecution(node)

  node.logs.push({
    timestamp: Date.now(),
    level: 'info',
    message: 'AI decision made',
  })
}

/**
 * 模拟节点执行
 */
function simulateNodeExecution(node: WorkflowNode): Promise<void> {
  return new Promise((resolve) => {
    const duration = 500 + Math.random() * 1000
    logger.debug(`Executing node ${node.id}: ${node.data.description}`)
    setTimeout(resolve, duration)
  })
}

/**
 * 模拟AI执行
 */
function simulateAIExecution(node: WorkflowNode): Promise<void> {
  return new Promise((resolve) => {
    const duration = 1000 + Math.random() * 2000
    logger.debug(`AI executing: ${node.data.aiPrompt}`)
    setTimeout(resolve, duration)
  })
}

/**
 * 模拟自然语言转换
 */
async function simulateNaturalLanguageConversion(
  input: string
): Promise<NaturalLanguageConversionResult> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 简单的模拟逻辑
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('构建') || lowerInput.includes('build') || lowerInput.includes('ci')) {
    return {
      success: true,
      workflow: {
        name: 'CI/CD Pipeline',
        description: input,
        executionMode: 'hybrid',
        naturalLanguageDescription: input,
      },
      explanation: 'Created CI/CD workflow based on input',
      confidence: 0.9,
    }
  } else if (lowerInput.includes('测试') || lowerInput.includes('test')) {
    return {
      success: true,
      workflow: {
        name: 'Test Pipeline',
        description: input,
        executionMode: 'sequential',
        naturalLanguageDescription: input,
      },
      explanation: 'Created test workflow based on input',
      confidence: 0.85,
    }
  } else if (lowerInput.includes('部署') || lowerInput.includes('deploy')) {
    return {
      success: true,
      workflow: {
        name: 'Deployment Pipeline',
        description: input,
        executionMode: 'sequential',
        naturalLanguageDescription: input,
      },
      explanation: 'Created deployment workflow based on input',
      confidence: 0.88,
    }
  } else {
    return {
      success: false,
      error: 'Unable to understand the workflow request',
      explanation: 'The input could not be parsed into a workflow',
      confidence: 0.3,
    }
  }
}

/**
 * 模拟AI优化
 */
async function simulateAIOptimization(_workflow: Workflow): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  logger.info(`AI optimization applied`)
}

/**
 * 模拟自愈
 */
async function simulateSelfHealing(_node: WorkflowNode, error: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 简单的自愈逻辑
  if (error.includes('timeout')) {
    logger.warn(`Self-healing timeout by increasing timeout`)
    return true
  } else if (error.includes('network')) {
    logger.warn(`Self-healing network error by retrying`)
    return true
  }

  return false
}
