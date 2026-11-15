/**
 * @file event-stream.ts
 * @description P2.1 EventStream 架构 — Agent-环境交互统一事件流（对标 OpenHands）
 *
 * OpenHands 的核心设计：所有交互（命令/文件编辑/浏览/消息）作为事件流经统一总线，
 * 使得 Agent、环境、审批 UI 解耦，可观察、可回放、可审计。
 *
 * 本实现：
 *   - 不可变事件追加（append-only log）
 *   - 订阅/取消订阅（UI 实时渲染）
 *   - 会话持久化（IndexedDB，可回放）
 *   - 事件过滤/搜索
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags agent,event-stream,architecture,phase-2
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('event-stream')

// ===== Event Types =====

export type AgentEventType =
  // 会话生命周期
  | 'session_start'
  | 'session_end'
  // 用户交互
  | 'user_message'
  // AI 响应
  | 'ai_plan'        // AI 生成的任务计划（Plan 阶段）
  | 'ai_response'    // AI 文本回复（Act 阶段）
  // 工具调用
  | 'tool_call'      // 请求调用工具
  | 'tool_result'    // 工具执行结果
  | 'tool_approved'  // 用户批准
  | 'tool_rejected'  // 用户拒绝
  // 代码执行（沙箱）
  | 'code_execute'   // 请求执行代码
  | 'code_output'    // 代码输出
  | 'code_error'     // 代码错误
  // 文件操作
  | 'file_read'
  | 'file_write'
  // 搜索
  | 'search_query'
  | 'search_result'
  // 错误/完成
  | 'error'
  | 'task_complete'

export interface AgentEvent {
  id: string
  sessionId: string
  type: AgentEventType
  timestamp: number
  /** 事件数据（按 type 不同结构不同） */
  data: Record<string, unknown>
  /** 事件来源 */
  source: 'user' | 'ai' | 'tool' | 'sandbox' | 'system'
}

export type EventListener = (event: AgentEvent) => void

// ===== Plan/Act Types =====

export interface AgentPlanStep {
  id: string
  description: string
  tool?: string
  args?: Record<string, unknown>
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
  result?: string
}

export interface AgentPlan {
  goal: string
  steps: AgentPlanStep[]
  createdAt: number
}

// ===== EventStream (核心) =====

export class EventStream {
  private events: AgentEvent[] = []
  private listeners = new Set<EventListener>()
  private sessionId: string
  private nextId = 0

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  }

  get session(): string { return this.sessionId }
  get allEvents(): AgentEvent[] { return [...this.events] }

  /**
   * 追加事件（不可变，返回事件引用）
   */
  emit(
    type: AgentEventType,
    data: Record<string, unknown> = {},
    source: AgentEvent['source'] = 'system',
  ): AgentEvent {
    const event: AgentEvent = {
      id: `${this.sessionId}_${++this.nextId}`,
      sessionId: this.sessionId,
      type,
      timestamp: Date.now(),
      data,
      source,
    }
    this.events.push(event)

    // 通知所有订阅者
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (e) {
        logger.warn('Event listener error', e as Error)
      }
    }

    logger.debug(`Event: ${type}`, { id: event.id, source })
    return event
  }

  /**
   * 订阅事件流
   */
  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 按类型过滤事件
   */
  filter(type: AgentEventType | AgentEventType[]): AgentEvent[] {
    const types = Array.isArray(type) ? type : [type]
    return this.events.filter(e => types.includes(e.type))
  }

  /**
   * 搜索事件内容
   */
  search(query: string): AgentEvent[] {
    const q = query.toLowerCase()
    return this.events.filter(e =>
      JSON.stringify(e.data).toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q),
    )
  }

  /**
   * 获取最近的 Plan（如果有）
   */
  getLatestPlan(): AgentPlan | null {
    const plans = this.filter('ai_plan')
    if (!plans.length) return null
    return (plans[plans.length - 1].data.plan as AgentPlan) ?? null
  }

  /**
   * 获取工具调用统计
   */
  getToolStats(): { total: number; approved: number; rejected: number; success: number; failed: number } {
    const calls = this.filter('tool_call')
    const approved = this.filter('tool_approved').length
    const rejected = this.filter('tool_rejected').length
    const results = this.filter('tool_result')
    const failed = results.filter(e => e.data.isError === true).length
    return {
      total: calls.length,
      approved,
      rejected,
      success: results.length - failed,
      failed,
    }
  }

  /**
   * 导出事件（JSON，供回放/分析）
   */
  export(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      events: this.events,
      exportedAt: Date.now(),
    }, null, 2)
  }

  /**
   * 清空事件（重置）
   */
  reset(): void {
    this.events = []
    this.nextId = 0
  }
}

// ===== 全局事件流管理 =====

const activeStreams = new Map<string, EventStream>()

export function createEventStream(sessionId?: string): EventStream {
  const stream = new EventStream(sessionId)
  activeStreams.set(stream.session, stream)
  return stream
}

export function getEventStream(sessionId: string): EventStream | null {
  return activeStreams.get(sessionId) ?? null
}

export function getActiveStreams(): string[] {
  return Array.from(activeStreams.keys())
}
