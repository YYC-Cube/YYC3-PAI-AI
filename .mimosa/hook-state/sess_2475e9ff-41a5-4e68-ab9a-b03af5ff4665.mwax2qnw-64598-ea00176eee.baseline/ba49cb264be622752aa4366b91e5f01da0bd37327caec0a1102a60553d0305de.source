/**
 * @file IntelligentWorkflowPanel.tsx
 * @description 智能工作流面板组件，提供自然语言输入和工作流管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,workflow,ai,intelligent,ui
 */

import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  GitBranch,
  Layers,
  Lightbulb,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  Terminal,
  Trash2,
  TrendingUp,
  X, Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useIntelligentWorkflow } from '../hooks/useIntelligentWorkflow'
import type { WorkflowNodeStatus, WorkflowNodeType } from '../store/intelligent-workflow-store'
import { BLUR, Z_INDEX, useThemeStore } from '../store/theme-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('workflow-panel')

/**
 * 智能工作流面板属性
 */
export interface IntelligentWorkflowPanelProps {
  /** 是否可见 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 智能工作流面板组件
 *
 * 提供智能工作流的完整管理界面，包括：
 * - 自然语言输入转换为工作流
 * - 工作流创建、编辑、执行
 * - 实时执行监控
 * - AI智能控制和交互
 * - 自愈和学习可视化
 *
 * @example
 * ```tsx
 * function App() {
 *   const [visible, setVisible] = useState(false)
 *
 *   return (
 *     <div>
 *       <button onClick={() => setVisible(true)}>
 *         打开智能工作流
 *       </button>
 *       <IntelligentWorkflowPanel
 *         visible={visible}
 *         onClose={() => setVisible(false)}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function IntelligentWorkflowPanel({ visible, onClose }: IntelligentWorkflowPanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()

  const {
    workflows,
    executingWorkflow,
    templates,
    naturalLanguageHistory,
    executeWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    retryNode,
    createWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    naturalLanguageToWorkflow,
    optimizeWorkflow,
    getWorkflowInsights,
    isExecuting,
    isConverting,
    formatDuration,
    getStatusColor,
    stats,
  } = useIntelligentWorkflow({
    autoInitialize: true,
  })

  const [activeTab, setActiveTab] = useState<'input' | 'workflows' | 'monitoring' | 'insights'>('input')
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!executingWorkflow) return
    queueMicrotask(() => setCurrentTime(Date.now()))
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [executingWorkflow])

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const getNodeIcon = (type: WorkflowNodeType) => {
    const icons: Record<WorkflowNodeType, React.ElementType> = {
      task: Terminal,
      condition: GitBranch,
      loop: RotateCcw,
      ai: Brain,
      parallel: Layers,
      'error-handler': AlertTriangle,
    }
    return icons[type]
  }

  const getNodeTypeColor = (type: WorkflowNodeType): string => {
    const colors: Record<WorkflowNodeType, string> = {
      task: tk.primary,
      condition: tk.warning,
      loop: tk.success,
      ai: tk.error,
      parallel: tk.foregroundMuted,
      'error-handler': tk.error,
    }
    return colors[type]
  }

  const getNodeStatusColor = (status: WorkflowNodeStatus): string => {
    const colors: Record<WorkflowNodeStatus, string> = {
      pending: '#94a3b8',
      running: '#eab308',
      completed: '#10b981',
      failed: '#ef4444',
      skipped: '#6b7280',
    }
    return colors[status]
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[5vh]"
      style={{ zIndex: Z_INDEX.topModal + 50, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 1200,
          maxHeight: '90vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <Brain size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '2px' }}>
              INTELLIGENT WORKFLOW
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: `${tk.primary}15` }}>
              <Zap size={10} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary }}>
                AI-POWERED
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 border-b shrink-0" style={{ borderColor: tk.border }}>
          {(['input', 'workflows', 'monitoring', 'insights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded text-xs transition-all"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '10px',
                letterSpacing: '1px',
                background: activeTab === tab ? `${tk.primary}15` : 'transparent',
                color: activeTab === tab ? tk.primary : tk.foregroundMuted,
                border: activeTab === tab ? `1px solid ${tk.primary}30` : '1px solid transparent',
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto neon-scrollbar p-5">
          {/* Natural Language Input Tab */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                NATURAL LANGUAGE INPUT
              </h3>

              {/* AI输入区域 */}
              <div className="p-4 rounded-lg" style={{ background: `${tk.primary}5`, border: `1px solid ${tk.primary}20` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>
                    AI-POWERED WORKFLOW GENERATION
                  </span>
                </div>

                <textarea
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="用自然语言描述你想要的工作流...&#10;&#10;例如：'自动构建代码、运行测试、部署到生产环境'&#10;&#10;或者：'分析代码质量、检查潜在问题、生成审查报告'"
                  disabled={isConverting}
                  className="w-full p-4 rounded-lg text-sm font-mono resize-none"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '12px',
                    minHeight: '120px',
                    background: tk.cardBg,
                    border: `1px solid ${tk.cardBorder}`,
                    color: tk.foreground,
                    outline: 'none',
                    opacity: isConverting ? 0.7 : 1,
                  }}
                />

                <button
                  onClick={() => {
                    if (naturalLanguageInput.trim()) {
                      naturalLanguageToWorkflow(naturalLanguageInput.trim()).then((result) => {
                        if (result.success) {
                          logger.debug('Workflow created:', result.workflow)
                          setNaturalLanguageInput('')
                        } else {
                          logger.error('Conversion failed:', result.error)
                        }
                      })
                    }
                  }}
                  disabled={isConverting || !naturalLanguageInput.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 mt-4"
                  style={{
                    fontFamily: tk.fontMono,
                    background: isConverting ? `${tk.foregroundMuted}20` : `${tk.primary}15`,
                    color: isConverting ? tk.foregroundMuted : tk.primary,
                    border: `1px solid ${tk.primary}30`,
                  }}
                >
                  {isConverting ? (
                    <>
                      <Activity size={16} className="animate-spin" />
                      AI转换中...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      转换为工作流
                    </>
                  )}
                </button>
              </div>

              {/* 输入历史 */}
              {naturalLanguageHistory.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginBottom: '8px' }}>
                    输入历史
                  </h4>
                  <div className="space-y-2">
                    {naturalLanguageHistory.slice(-5).reverse().map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg"
                        style={{
                          background: tk.cardBg,
                          border: `1px solid ${tk.cardBorder}`,
                        }}
                      >
                        <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: '4px' }}>
                          {formatTime(item.timestamp)}
                        </div>
                        <div style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, marginBottom: '8px' }}>
                          {item.input}
                        </div>
                        {item.result && (
                          <div className="flex items-center gap-2">
                            {item.result.success ? (
                              <div className="flex items-center gap-1" style={{ color: tk.success }}>
                                <CheckCircle2 size={12} />
                                <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                                  {item.result.workflow?.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1" style={{ color: tk.error }}>
                                <AlertTriangle size={12} />
                                <span style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                                  {item.result.error}
                                </span>
                              </div>
                            )}
                            {item.result.confidence && (
                              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                                置信度: {(item.result.confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                  WORKFLOWS ({workflows.length})
                </h3>
                {/* 模板快速创建 */}
                <div className="flex gap-2">
                  {templates.slice(0, 3).map((template) => (
                    <button
                      key={template.name}
                      onClick={() => {
                        const workflow = createWorkflow({
                          ...template,
                          nodes: new Map(),
                        })
                        logger.debug('Created workflow from template:', workflow)
                      }}
                      className="px-2 py-1 rounded text-xs transition-all hover:opacity-70"
                      style={{
                        fontFamily: tk.fontMono,
                        background: `${tk.success}15`,
                        color: tk.success,
                        border: `1px solid ${tk.success}30`,
                      }}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 工作流列表 */}
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-4 rounded-lg"
                    style={{
                      background: selectedWorkflow === workflow.id ? `${tk.primary}10` : tk.cardBg,
                      border: `1px solid ${selectedWorkflow === workflow.id ? tk.primary : tk.cardBorder}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedWorkflow(workflow.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                            {workflow.name}
                          </span>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: `${getStatusColor(workflow.status)}15` }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(workflow.status) }} />
                            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: getStatusColor(workflow.status) }}>
                              {workflow.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: '8px' }}>
                          {workflow.description}
                        </div>
                        {workflow.naturalLanguageDescription && (
                          <div className="p-2 rounded mt-2" style={{ background: `${tk.primary}5`, border: `1px solid ${tk.primary}15` }}>
                            <div className="flex items-center gap-1 mb-1">
                              <MessageSquare size={10} color={tk.primary} />
                              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary }}>
                                自然语言描述
                              </span>
                            </div>
                            <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>
                              {workflow.naturalLanguageDescription}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {/* 执行控制 */}
                        {workflow.status === 'running' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              pauseWorkflow(workflow.id)
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                            style={{ background: `${tk.warning}15`, color: tk.warning, fontFamily: tk.fontMono }}
                          >
                            <Pause size={10} />
                            暂停
                          </button>
                        ) : workflow.status === 'paused' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              resumeWorkflow(workflow.id)
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                            style={{ background: `${tk.success}15`, color: tk.success, fontFamily: tk.fontMono }}
                          >
                            <Play size={10} />
                            恢复
                          </button>
                        ) : workflow.status === 'draft' || workflow.status === 'ready' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              executeWorkflow(workflow.id)
                            }}
                            disabled={isExecuting}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70 disabled:opacity-50"
                            style={{
                              fontFamily: tk.fontMono,
                              background: isExecuting ? `${tk.foregroundMuted}20` : `${tk.primary}15`,
                              color: isExecuting ? tk.foregroundMuted : tk.primary,
                              border: `1px solid ${tk.primary}30`,
                            }}
                          >
                            <Play size={10} />
                            执行
                          </button>
                        ) : null}

                        {workflow.status === 'running' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelWorkflow(workflow.id)
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                            style={{ background: `${tk.error}15`, color: tk.error, fontFamily: tk.fontMono }}
                          >
                            <Square size={10} />
                            取消
                          </button>
                        )}

                        {/* 复制 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateWorkflow(workflow.id)
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                          style={{ background: `${tk.foregroundMuted}10`, color: tk.foregroundMuted, fontFamily: tk.fontMono }}
                        >
                          <Copy size={10} />
                          复制
                        </button>

                        {/* 优化 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            optimizeWorkflow(workflow.id)
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                          style={{ background: `${tk.success}10`, color: tk.success, fontFamily: tk.fontMono }}
                        >
                          <Sparkles size={10} />
                          AI优化
                        </button>

                        {/* 删除 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteWorkflow(workflow.id)
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                          style={{ background: `${tk.error}15`, color: tk.error, fontFamily: tk.fontMono }}
                        >
                          <Trash2 size={10} />
                          删除
                        </button>
                      </div>
                    </div>

                    {/* 工作流统计 */}
                    <div className="grid grid-cols-4 gap-2 mt-3" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                      <div>节点: {workflow.nodes.size}</div>
                      <div>已完成: {workflow.stats.completedNodes}</div>
                      <div>失败: {workflow.stats.failedNodes}</div>
                      <div>AI决策: {workflow.stats.aiDecisions}</div>
                    </div>
                  </div>
                ))}

                {workflows.length === 0 && (
                  <div className="text-center py-12" style={{ color: tk.foregroundMuted }}>
                    <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
                    <p style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
                      暂无工作流
                    </p>
                    <p style={{ fontFamily: tk.fontMono, fontSize: '9px', marginTop: '8px' }}>
                      使用自然语言输入创建你的第一个工作流
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                EXECUTION MONITORING
              </h3>

              {executingWorkflow ? (
                <div className="space-y-4">
                  {/* 工作流概览 */}
                  <div className="p-4 rounded-lg" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={12} color={tk.primary} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>
                        EXECUTING: {executingWorkflow.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <StatItem label="运行时间" value={formatDuration(currentTime - (executingWorkflow.startedAt || currentTime))} />
                      <StatItem label="完成节点" value={`${executingWorkflow.stats.completedNodes}/${executingWorkflow.nodes.size}`} />
                      <StatItem label="成功率" value={`${((executingWorkflow.stats.completedNodes / Math.max(1, executingWorkflow.stats.completedNodes + executingWorkflow.stats.failedNodes)) * 100).toFixed(1)}%`} />
                    </div>
                  </div>

                  {/* 节点执行状态 */}
                  <div>
                    <h4 style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginBottom: '8px' }}>
                      节点执行状态
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from(executingWorkflow.nodes.values()).map((node) => {
                        const Icon = getNodeIcon(node.type)
                        return (
                          <div
                            key={node.id}
                            className="p-3 rounded-lg"
                            style={{
                              background: tk.cardBg,
                              border: `1px solid ${tk.cardBorder}`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon size={12} color={getNodeTypeColor(node.type)} />
                              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, fontWeight: 'bold' }}>
                                {node.name}
                              </span>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: `${getNodeStatusColor(node.status)}15` }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: getNodeStatusColor(node.status) }} />
                                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: getNodeStatusColor(node.status) }}>
                                  {node.status}
                                </span>
                              </div>
                            </div>
                            {node.data.description && (
                              <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: '4px' }}>
                                {node.data.description}
                              </div>
                            )}
                            {node.duration && (
                              <div className="flex items-center gap-1" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                                <Clock size={8} />
                                <span>{formatDuration(node.duration)}</span>
                              </div>
                            )}
                            {node.error && (
                              <div className="p-2 rounded mt-2" style={{ background: `${tk.error}10`, border: `1px solid ${tk.error}20` }}>
                                <div className="flex items-center gap-1" style={{ color: tk.error, fontFamily: tk.fontMono, fontSize: '9px' }}>
                                  <AlertTriangle size={10} />
                                  <span>{node.error}</span>
                                </div>
                                <button
                                  onClick={() => retryNode(executingWorkflow.id, node.id)}
                                  className="mt-2 flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70"
                                  style={{
                                    fontFamily: tk.fontMono,
                                    background: `${tk.primary}15`,
                                    color: tk.primary,
                                    border: `1px solid ${tk.primary}30`,
                                  }}
                                >
                                  <RotateCcw size={10} />
                                  重试
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: tk.foregroundMuted }}>
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
                    当前没有正在执行的工作流
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                WORKFLOW INSIGHTS
              </h3>

              {/* 全局统计 */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard icon={GitBranch} label="总工作流" value={stats.totalWorkflows} color={tk.primary} />
                <StatCard icon={Activity} label="总执行次数" value={stats.totalExecutions} color={tk.success} />
                <StatCard icon={CheckCircle2} label="成功执行" value={stats.successfulExecutions} color={tk.success} />
                <StatCard icon={Brain} label="AI决策准确率" value={`${stats.aiDecisionAccuracy.toFixed(1)}%`} color={tk.warning} />
              </div>

              {/* 自愈和学习统计 */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Zap} label="自愈成功率" value={`${stats.selfHealingSuccessRate.toFixed(1)}%`} color={tk.primary} />
                <StatCard icon={TrendingUp} label="平均执行时长" value={formatDuration(stats.avgExecutionTime)} color={tk.success} />
              </div>

              {/* 详细洞察 */}
              {workflows.map((workflow) => (
                <div key={workflow.id} className="space-y-2">
                  <div
                    className="p-4 rounded-lg cursor-pointer transition-all hover:opacity-80"
                    style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}
                    onClick={() => setShowInsights(showInsights === workflow.id ? null : workflow.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                        {workflow.name}
                      </span>
                      <ChevronRight
                        size={16}
                        color={tk.foregroundMuted}
                        style={{ transform: showInsights === workflow.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </div>
                  </div>

                  {/* 详细洞察面板 */}
                  {showInsights === workflow.id && (
                    <div className="p-4 rounded-lg" style={{ background: `${tk.primary}5`, border: `1px solid ${tk.primary}15` }}>
                      {(() => {
                        const insights = getWorkflowInsights(workflow.id)
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <Target size={12} color={tk.primary} />
                              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>
                                性能评估
                              </span>
                            </div>
                            <div className="p-3 rounded mb-3" style={{ background: tk.cardBg }}>
                              <span style={{ fontFamily: tk.fontMono, fontSize: '14px', color: insights.performance, fontWeight: 'bold' }}>
                                {insights.performance}
                              </span>
                            </div>

                            {insights.bottlenecks.length > 0 && (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertTriangle size={12} color={tk.error} />
                                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.error }}>
                                    瓶颈问题
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {insights.bottlenecks.map((bottleneck, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded" style={{ background: `${tk.error}5` }}>
                                      <Lightbulb size={10} color={tk.error} />
                                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>
                                        {bottleneck}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {insights.suggestions.length > 0 && (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <Lightbulb size={12} color={tk.warning} />
                                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.warning }}>
                                    优化建议
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {insights.suggestions.map((suggestion, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded" style={{ background: `${tk.warning}5` }}>
                                      <Sparkles size={10} color={tk.warning} />
                                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>
                                        {suggestion}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                              <TrendingUp size={12} color={tk.success} />
                              <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.success }}>
                                准确率
                              </span>
                            </div>
                            <div className="w-full h-2 rounded mt-2" style={{ background: tk.borderDim }}>
                              <div
                                className="h-full rounded"
                                style={{
                                  width: `${insights.accuracy}%`,
                                  background: tk.success,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 统计项组件
 */
function StatItem({ label, value }: { label: string; value: string | number }) {
  const { tokens: tk } = useThemeStore()

  return (
    <div>
      <div style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontFamily: tk.fontMono, fontSize: '14px', color: tk.foreground, fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  )
}

/**
 * 统计卡片组件
 */
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  const { tokens: tk } = useThemeStore()

  return (
    <div className="p-3 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <Icon size={16} color={color} className="mb-1" />
      <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: tk.fontMono, fontSize: '16px', color, fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  )
}
