/**
 * @file useIntelligentWorkflow.ts
 * @description 智能工作流Hook，提供工作流管理的便捷接口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hook,workflow,ai,intelligent
 */

import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  useIntelligentWorkflowStore,
  type Workflow,
  type WorkflowNode,
  type WorkflowExecutionEvent,
  type NaturalLanguageConversionResult,
  type WorkflowStatus,
} from '../store/intelligent-workflow-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('intelligent-workflow')

/**
 * 智能工作流Hook配置
 */
export interface UseIntelligentWorkflowOptions {
  /** 是否自动初始化 */
  autoInitialize?: boolean
  /** 是否自动加载模板 */
  autoLoadTemplates?: boolean
}

/**
 * 智能工作流Hook返回值
 */
export interface UseIntelligentWorkflowReturn {
  // ===== 工作流数据 =====
  /** 工作流列表 */
  workflows: Workflow[]
  /** 当前执行的工作流 */
  executingWorkflow: Workflow | null
  /** 工作流模板 */
  templates: Workflow[]
  /** 执行事件历史 */
  executionEvents: WorkflowExecutionEvent[]
  /** 自然语言输入历史 */
  naturalLanguageHistory: {
    id: string
    input: string
    result?: NaturalLanguageConversionResult
    timestamp: number
  }[]

  // ===== 工作流操作 =====
  /** 创建工作流 */
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'stats' | 'status'>) => Workflow
  /** 更新工作流 */
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => void
  /** 删除工作流 */
  deleteWorkflow: (workflowId: string) => void
  /** 复制工作流 */
  duplicateWorkflow: (workflowId: string) => Workflow | null

  // ===== 工作流执行 =====
  /** 执行工作流 */
  executeWorkflow: (workflowId: string) => Promise<void>
  /** 暂停工作流 */
  pauseWorkflow: (workflowId: string) => void
  /** 恢复工作流 */
  resumeWorkflow: (workflowId: string) => void
  /** 取消工作流 */
  cancelWorkflow: (workflowId: string) => void
  /** 重试节点 */
  retryNode: (workflowId: string, nodeId: string) => Promise<void>
  /** 执行工作流状态 */
  isExecuting: boolean

  // ===== AI智能功能 =====
  /** 自然语言转换为工作流 */
  naturalLanguageToWorkflow: (input: string) => Promise<NaturalLanguageConversionResult>
  /** AI优化工作流 */
  optimizeWorkflow: (workflowId: string) => Promise<void>
  /** 生成节点建议 */
  generateNodeSuggestions: (context: string) => Promise<WorkflowNode[]>
  /** AI转换中 */
  isConverting: boolean

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

  // ===== 统计信息 =====
  /** 获取统计信息 */
  // ===== 辅助方法 =====
  /** 按状态分组的工作流 */
  workflowsByStatus: Record<WorkflowStatus, Workflow[]>
  /** 格式化持续时间 */
  formatDuration: (ms: number) => string
  /** 获取状态颜色 */
  getStatusColor: (status: WorkflowStatus) => string


  stats: ReturnType<typeof useIntelligentWorkflowStore.getState>['stats']
}

/**
 * 智能工作流Hook
 *
 * 提供智能工作流的完整接口，包括：
 * - 工作流管理（创建、更新、删除、复制）
 * - 工作流执行（启动、暂停、恢复、取消）
 * - AI智能功能（自然语言转换、优化、节点建议）
 * - 自愈与学习机制
 *
 * @example 基本使用
 * ```tsx
 * function MyComponent() {
 *   const { workflows, executeWorkflow } = useIntelligentWorkflow()
 *
 *   return (
 *     <div>
 *       {workflows.map(workflow => (
 *         <button onClick={() => executeWorkflow(workflow.id)}>
 *           {workflow.name}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example 自然语言转换
 * ```tsx
 * function NaturalLanguageInput() {
 *   const { naturalLanguageToWorkflow, isConverting } = useIntelligentWorkflow()
 *
 *   const handleConvert = async () => {
 *     const result = await naturalLanguageToWorkflow('自动构建并部署代码')
 *     if (result.success) {
 *       // console.log('Created workflow:', result.workflow)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <textarea placeholder="描述你想要的工作流..." />
 *       <button onClick={handleConvert} disabled={isConverting}>
 *         {isConverting ? 'AI转换中...' : '转换为工作流'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example 获取工作流洞察
 * ```tsx
 * function WorkflowInsights({ workflowId }: { workflowId: string }) {
 *   const { getWorkflowInsights } = useIntelligentWorkflow()
 *
 *   const insights = getWorkflowInsights(workflowId)
 *
 *   return (
 *     <div>
 *       <h3>性能: {insights.performance}</h3>
 *       <h4>瓶颈:</h4>
 *       <ul>
 *         {insights.bottlenecks.map((b, i) => (
 *           <li key={i}>{b}</li>
 *         ))}
 *       </ul>
 *       <h4>建议:</h4>
 *       <ul>
 *         {insights.suggestions.map((s, i) => (
 *           <li key={i}>{s}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useIntelligentWorkflow(
  options: UseIntelligentWorkflowOptions = {}
): UseIntelligentWorkflowReturn {
  const {
    autoInitialize = true,
  } = options

  // Store state - 使用 useShallow 避免无限循环
  const {
    workflowsMap,
    executingWorkflowId,
    executionEvents,
    naturalLanguageInputs,
    workflowTemplates,
    stats,
  } = useIntelligentWorkflowStore(
    useShallow((state) => ({
      workflowsMap: state.workflows,
      executingWorkflowId: state.executingWorkflowId,
      executionEvents: state.executionEvents,
      naturalLanguageInputs: state.naturalLanguageInputs,
      workflowTemplates: state.workflowTemplates,
      stats: state.stats,
    }))
  )

  // Store actions - 使用 useShallow 避免无限循环
  const {
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    executeWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    retryNode,
    naturalLanguageToWorkflow,
    optimizeWorkflow,
    generateNodeSuggestions,
    selfHeal,
    applyLearningOptimization,
    getWorkflowInsights,
  } = useIntelligentWorkflowStore(
    useShallow((state) => ({
      createWorkflow: state.createWorkflow,
      updateWorkflow: state.updateWorkflow,
      deleteWorkflow: state.deleteWorkflow,
      duplicateWorkflow: state.duplicateWorkflow,
      executeWorkflow: state.executeWorkflow,
      pauseWorkflow: state.pauseWorkflow,
      resumeWorkflow: state.resumeWorkflow,
      cancelWorkflow: state.cancelWorkflow,
      retryNode: state.retryNode,
      naturalLanguageToWorkflow: state.naturalLanguageToWorkflow,
      optimizeWorkflow: state.optimizeWorkflow,
      generateNodeSuggestions: state.generateNodeSuggestions,
      selfHeal: state.selfHeal,
      applyLearningOptimization: state.applyLearningOptimization,
      getWorkflowInsights: state.getWorkflowInsights,
    }))
  )

  // 转换为数组 - 使用 useMemo 缓存
  const workflows = useMemo(
    () => Array.from(workflowsMap.values()),
    [workflowsMap]
  )

  // 当前执行的工作流
  const executingWorkflow = useMemo(
    () => {
      if (!executingWorkflowId) return null
      return workflows.find((w) => w.id === executingWorkflowId) || null
    },
    [workflows, executingWorkflowId]
  )

  // 是否正在执行
  const isExecuting = useMemo(() => !!executingWorkflow, [executingWorkflow])

  // 是否正在转换
  const isConverting = useMemo(() => {
    return naturalLanguageInputs.some((input) => !input.result)
  }, [naturalLanguageInputs])

  // 按状态分组工作流
  const workflowsByStatus = useMemo(() => {
    const groups: Record<WorkflowStatus, Workflow[]> = {
      draft: [],
      ready: [],
      running: [],
      paused: [],
      completed: [],
      failed: [],
      cancelled: [],
    }
    workflows.forEach((workflow) => {
      groups[workflow.status].push(workflow)
    })
    return groups
  }, [workflows])

  // 格式化时间
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // 格式化状态
  const getStatusColor = (status: WorkflowStatus): string => {
    const colors: Record<WorkflowStatus, string> = {
      draft: '#94a3b8',
      ready: '#22c55e',
      running: '#eab308',
      paused: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444',
      cancelled: '#6b7280',
    }
    return colors[status]
  }

  // 自动初始化
  useEffect(() => {
    if (autoInitialize) {
      logger.info('Intelligent workflow system initialized')
    }
  }, [autoInitialize])

  return {
    // 工作流数据
    workflows,
    executingWorkflow,
    templates: workflowTemplates,
    executionEvents: executionEvents,
    naturalLanguageHistory: naturalLanguageInputs,

    // 工作流操作
    createWorkflow: createWorkflow,
    updateWorkflow: updateWorkflow,
    deleteWorkflow: deleteWorkflow,
    duplicateWorkflow: duplicateWorkflow,

    // 工作流执行
    executeWorkflow: executeWorkflow,
    pauseWorkflow: pauseWorkflow,
    resumeWorkflow: resumeWorkflow,
    cancelWorkflow: cancelWorkflow,
    retryNode: retryNode,
    isExecuting,

    // AI智能功能
    naturalLanguageToWorkflow: naturalLanguageToWorkflow,
    optimizeWorkflow: optimizeWorkflow,
    generateNodeSuggestions: generateNodeSuggestions,
    isConverting,

    // 自愈与学习
    selfHeal: selfHeal,
    applyLearningOptimization: applyLearningOptimization,
    getWorkflowInsights: getWorkflowInsights,

    // 统计信息
    stats: stats,

    // 辅助函数
    workflowsByStatus,
    formatDuration,
    getStatusColor,
  }
}

/**
 * 简化版Hook：仅执行工作流
 */
export function useWorkflowExecution() {
  const { executeWorkflow, pauseWorkflow, resumeWorkflow, cancelWorkflow, executingWorkflow, isExecuting } =
    useIntelligentWorkflow({
      autoInitialize: true,
    })

  return {
    executeWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    executingWorkflow,
    isExecuting,
  }
}

/**
 * Hook：仅AI智能功能
 */
export function useWorkflowAI() {
  const { naturalLanguageToWorkflow, optimizeWorkflow, generateNodeSuggestions, isConverting } =
    useIntelligentWorkflow({
      autoInitialize: true,
    })

  return {
    naturalLanguageToWorkflow,
    optimizeWorkflow,
    generateNodeSuggestions,
    isConverting,
  }
}
