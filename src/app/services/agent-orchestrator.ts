/**
 * @file agent-orchestrator.ts
 * @description P2.1/P2.2 Agent 编排引擎 — Plan/Act 双模式 + 人机审批环 + 工具编排
 *
 * 对标：OpenHands Event Stream + Cline Plan/Act 模式
 *
 * Plan 阶段：AI 接收任务 → 生成结构化计划（steps[]）
 * Act 阶段：逐步执行 → 每步审批 → 工具调用 → 结果反馈 → 下一步
 * 终止条件：全部步骤完成 / 用户中止 / 达到安全限制
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags agent,orchestrator,plan,act,approval,phase-2
 */

import { EventStream, type AgentPlan, type AgentPlanStep, type AgentEvent } from './event-stream'
import { createMCPClient, type MCPClient } from './mcp-client'
import { createLogger } from '../utils/logger'

const logger = createLogger('agent-orchestrator')

// ===== Types =====

export interface OrchestratorConfig {
  /** MCP 服务器配置 */
  mcpServers: Array<{ name: string; endpoint: string; token?: string }>
  /** 最大步骤数 */
  maxSteps: number
  /** 是否自动批准（false = 每步需要人工审批） */
  autoApprove: boolean
  /** 审批回调：返回 { approved, editedArgs? } */
  approvalCallback?: (step: AgentPlanStep) => Promise<{ approved: boolean; editedArgs?: Record<string, unknown> }>
  /** AI 调用函数 */
  sendFn: (msg: string, opts?: { systemPrompt?: string; history?: Array<{ role: string; content: string }> }, onChunk?: (d: string, full: string) => void) => Promise<string>
  /** 事件回调 */
  onEvent?: (event: AgentEvent) => void
  /** 流式回调 */
  onChunk?: (delta: string, full: string) => void
}

export interface OrchestratorResult {
  plan: AgentPlan
  finalResponse: string
  completedSteps: number
  totalSteps: number
  success: boolean
  eventStream: EventStream
}

// ===== Plan 解析 =====

/**
 * 从 AI 回复中解析结构化计划（JSON）
 */
export function parsePlan(response: string): AgentPlan | null {
  // 尝试直接 JSON 解析
  try {
    const trimmed = response.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      if (parsed.goal && Array.isArray(parsed.steps)) {
        return {
          goal: parsed.goal,
          steps: parsed.steps.map((s: Partial<AgentPlanStep>, i: number) => ({
            id: s.id ?? `step_${i + 1}`,
            description: s.description ?? '',
            tool: s.tool,
            args: s.args,
            status: 'pending' as const,
          })),
          createdAt: Date.now(),
        }
      }
    }
  } catch { /* not JSON */ }

  // 尝试从 Markdown 代码块提取
  const codeBlock = response.match(/```(?:json)?\s*\n(\{[\s\S]*?"goal"[\s\S]*?"steps"[\s\S]*?\})\s*\n```/)
  if (codeBlock) {
    try {
      const parsed = JSON.parse(codeBlock[1])
      if (parsed.goal && Array.isArray(parsed.steps)) {
        return {
          goal: parsed.goal,
          steps: parsed.steps.map((s: Partial<AgentPlanStep>, i: number) => ({
            id: s.id ?? `step_${i + 1}`,
            description: s.description ?? '',
            tool: s.tool,
            args: s.args,
            status: 'pending' as const,
          })),
          createdAt: Date.now(),
        }
      }
    } catch { /* fallthrough */ }
  }

  return null
}

/** Plan 阶段的 systemPrompt */
export const PLAN_PROMPT = `You are YYC³ Agent Planner. Given a task, create an execution plan.

Return EXACTLY this JSON format (no markdown fences, no explanation):
{
  "goal": "Brief description of what to accomplish",
  "steps": [
    { "id": "step_1", "description": "What to do", "tool": "tool_name_if_any", "args": {} },
    { "id": "step_2", "description": "Next action" }
  ]
}

Rules:
- Maximum 8 steps
- Each step must be independently verifiable
- Include a "tool" field ONLY if a specific MCP tool is needed
- If no tool is needed, just provide "description"
- The final step should always be to summarize the results`

/** Act 阶段的 systemPrompt */
export function actPrompt(plan: AgentPlan, currentStepIndex: number, previousResults: string[]): string {
  const stepsText = plan.steps.map((s, i) => {
    const status = i < currentStepIndex ? `[✓ done]` : i === currentStepIndex ? `[→ current]` : `[pending]`
    const result = i < currentStepIndex ? ` (result: ${previousResults[i]?.slice(0, 100) ?? 'ok'})` : ''
    return `${i + 1}. ${status} ${s.description}${result}`
  }).join('\n')

  return `You are YYC³ Agent Executor. You are executing a plan step by step.

Current plan:
${stepsText}

You are on step ${currentStepIndex + 1}. Based on the current step and previous results, either:
1. Call a tool: respond with {"tool": "<name>", "arguments": {...}}
2. Provide a final summary if all steps are complete: respond with plain text`
}

// ===== Agent Orchestrator =====

export async function runOrchestratedAgent(
  task: string,
  config: OrchestratorConfig,
): Promise<OrchestratorResult> {
  const stream = new EventStream()
  if (config.onEvent) stream.subscribe(config.onEvent)

  stream.emit('session_start', { task }, 'system')
  stream.emit('user_message', { content: task }, 'user')

  // ===== Phase 1: Plan =====
  stream.emit('ai_plan', { phase: 'planning' }, 'ai')
  let planResponse: string
  try {
    planResponse = await config.sendFn(task, { systemPrompt: PLAN_PROMPT }, config.onChunk)
  } catch (e) {
    stream.emit('error', { message: `Plan generation failed: ${e}` }, 'system')
    return {
      plan: { goal: task, steps: [], createdAt: Date.now() },
      finalResponse: `Failed to generate plan: ${e}`,
      completedSteps: 0, totalSteps: 0, success: false, eventStream: stream,
    }
  }

  const plan = parsePlan(planResponse)
  if (!plan) {
    // AI 未能生成结构化计划 → 直接作为对话回复
    stream.emit('ai_response', { content: planResponse }, 'ai')
    stream.emit('task_complete', { reason: 'no_plan_generated' }, 'system')
    return {
      plan: { goal: task, steps: [], createdAt: Date.now() },
      finalResponse: planResponse,
      completedSteps: 0, totalSteps: 0, success: true, eventStream: stream,
    }
  }

  stream.emit('ai_plan', { plan, phase: 'plan_ready' }, 'ai')
  logger.info(`Plan generated: ${plan.steps.length} steps for "${plan.goal}"`)

  // ===== Phase 2: Act (逐步执行) =====
  const results: string[] = []
  let completed = 0
  const maxExec = Math.min(plan.steps.length, config.maxSteps)

  for (let i = 0; i < maxExec; i++) {
    const step = plan.steps[i]
    step.status = 'running'
    stream.emit('tool_call', { stepId: step.id, description: step.description, tool: step.tool, args: step.args }, 'ai')

    // 人机审批
    if (!config.autoApprove && config.approvalCallback) {
      stream.emit('tool_call', { stepId: step.id, phase: 'approval_request' }, 'ai')
      const decision = await config.approvalCallback(step)

      if (!decision.approved) {
        step.status = 'skipped'
        stream.emit('tool_rejected', { stepId: step.id, reason: 'user_rejected' }, 'user')
        results.push('User rejected this step.')
        continue
      }

      // 如果用户编辑了参数
      if (decision.editedArgs) {
        step.args = decision.editedArgs
        stream.emit('tool_approved', { stepId: step.id, editedArgs: decision.editedArgs }, 'user')
      } else {
        stream.emit('tool_approved', { stepId: step.id }, 'user')
      }
    }

    // 执行步骤
    try {
      let stepResult: string

      if (step.tool) {
        // 工具调用（MCP）
        stepResult = await executeToolCall(step.tool, step.args ?? {}, config)
        stream.emit('tool_result', { stepId: step.id, tool: step.tool, result: stepResult, isError: false }, 'tool')
      } else {
        // 纯 AI 步骤（无工具）→ 让 AI 处理
        const actResponse = await config.sendFn(
          actPrompt(plan, i, results),
          { systemPrompt: actPrompt(plan, i, results) },
          config.onChunk,
        )
        stepResult = actResponse
        stream.emit('ai_response', { stepId: step.id, content: actResponse }, 'ai')
      }

      step.status = 'done'
      step.result = stepResult
      results.push(stepResult)
      completed++
    } catch (e) {
      step.status = 'failed'
      const errMsg = e instanceof Error ? e.message : String(e)
      step.result = errMsg
      results.push(`Error: ${errMsg}`)
      stream.emit('tool_result', { stepId: step.id, tool: step.tool, result: errMsg, isError: true }, 'tool')
    }
  }

  // ===== Phase 3: Summarize =====
  const summaryPrompt = `You executed the following plan. Summarize the results concisely.

Goal: ${plan.goal}
Steps completed: ${completed}/${plan.steps.length}
Results: ${results.map((r, i) => `\n${i + 1}. ${plan.steps[i].description}: ${r?.slice(0, 200)}`).join('')}`

  let finalResponse: string
  try {
    finalResponse = await config.sendFn(summaryPrompt, undefined, config.onChunk)
  } catch {
    finalResponse = results.join('\n\n') // 降级：直接返回结果列表
  }

  stream.emit('ai_response', { content: finalResponse, phase: 'summary' }, 'ai')
  stream.emit('task_complete', { completedSteps: completed, totalSteps: plan.steps.length }, 'system')

  return {
    plan,
    finalResponse,
    completedSteps: completed,
    totalSteps: plan.steps.length,
    success: completed > 0,
    eventStream: stream,
  }
}

// ===== 工具执行 =====

const mcpClientCache = new Map<string, MCPClient>()

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  config: OrchestratorConfig,
): Promise<string> {
  // 遍历 MCP 服务器找到拥有此工具的
  for (const server of config.mcpServers) {
    const cacheKey = `${server.name}:${server.endpoint}`
    let client = mcpClientCache.get(cacheKey)

    if (!client) {
      client = createMCPClient(server.endpoint, server.token)
      try {
        await client.connect()
        mcpClientCache.set(cacheKey, client)
      } catch {
        continue
      }
    }

    try {
      const tools = await client.listTools()
      if (tools.some(t => t.name === toolName)) {
        const result = await client.callTool(toolName, args)
        return result.content
          .map(c => ('text' in c ? c.text : JSON.stringify(c)))
          .join('\n')
      }
    } catch (e) {
      logger.warn(`Tool ${toolName} failed on server ${server.name}`, e as Error)
    }
  }

  throw new Error(`Tool "${toolName}" not found in any connected MCP server`)
}

/** 清理 MCP 连接缓存 */
export function disconnectOrchestratorClients(): void {
  mcpClientCache.clear()
}
