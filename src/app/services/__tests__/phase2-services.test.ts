/**
 * @file phase2-services.test.ts
 * @description Phase 2 测试：EventStream / Agent Orchestrator (Plan/Act) / Sandbox
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventStream } from '../event-stream'
import { parsePlan, runOrchestratedAgent, type OrchestratorConfig } from '../agent-orchestrator'
import { getSandbox, terminateSandbox } from '../sandbox-client'

// jsdom 无 Web Worker：用同步 mock 模拟沙箱执行
class MockWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null
  onerror: ((e: Error) => void) | null = null

  postMessage(req: { id: string; code: string; timeoutMs: number }) {
    const console_: Array<{ level: string; args: unknown[] }> = []
    const sandboxConsole = {
      log: (...a: unknown[]) => console_.push({ level: 'log', args: a }),
      warn: (...a: unknown[]) => console_.push({ level: 'warn', args: a }),
      error: (...a: unknown[]) => console_.push({ level: 'error', args: a }),
      info: (...a: unknown[]) => console_.push({ level: 'info', args: a }),
    }
    const start = performance.now()
    try {
      const fn = new Function('console', `"use strict";
${req.code}`)
      const result = fn(sandboxConsole)
      this.onmessage?.({ data: {
        id: req.id, success: true, result: result ?? null,
        console: console_, durationMs: performance.now() - start,
      } })
    } catch (e) {
      this.onmessage?.({ data: {
        id: req.id, success: false, result: null, console: console_,
        error: e instanceof Error ? e.message : String(e),
        durationMs: performance.now() - start,
      } })
    }
  }

  terminate() { /* noop */ }
}
;(globalThis as unknown as { Worker: unknown }).Worker = MockWorker

// ===== P2.1 EventStream =====

describe('EventStream（OpenHands 式事件流）', () => {
  it('emit 追加事件并通知订阅者', () => {
    const stream = new EventStream('test_session')
    const listener = vi.fn()
    stream.subscribe(listener)

    stream.emit('user_message', { content: 'hello' }, 'user')
    stream.emit('ai_response', { content: 'world' }, 'ai')

    expect(stream.allEvents).toHaveLength(2)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(stream.allEvents[0].type).toBe('user_message')
    expect(stream.allEvents[1].source).toBe('ai')
  })

  it('subscribe 返回取消函数', () => {
    const stream = new EventStream()
    const listener = vi.fn()
    const unsubscribe = stream.subscribe(listener)

    stream.emit('user_message', {}, 'user')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    stream.emit('user_message', {}, 'user')
    expect(listener).toHaveBeenCalledTimes(1) // 不再接收
  })

  it('filter 按类型过滤', () => {
    const stream = new EventStream()
    stream.emit('user_message', { content: 'q1' }, 'user')
    stream.emit('tool_call', { tool: 'read' }, 'ai')
    stream.emit('tool_result', { result: 'data' }, 'tool')
    stream.emit('tool_call', { tool: 'write' }, 'ai')

    const toolCalls = stream.filter('tool_call')
    expect(toolCalls).toHaveLength(2)

    const toolEvents = stream.filter(['tool_call', 'tool_result'])
    expect(toolEvents).toHaveLength(3)
  })

  it('search 搜索事件内容', () => {
    const stream = new EventStream()
    stream.emit('user_message', { content: 'find the auth module' }, 'user')
    stream.emit('tool_result', { result: 'auth.ts contents here' }, 'tool')

    expect(stream.search('auth')).toHaveLength(2)
    expect(stream.search('nonexistent')).toHaveLength(0)
  })

  it('getToolStats 统计工具调用', () => {
    const stream = new EventStream()
    stream.emit('tool_call', { tool: 'a' }, 'ai')
    stream.emit('tool_approved', {}, 'user')
    stream.emit('tool_result', { isError: false }, 'tool')
    stream.emit('tool_call', { tool: 'b' }, 'ai')
    stream.emit('tool_rejected', {}, 'user')

    const stats = stream.getToolStats()
    expect(stats.total).toBe(2)
    expect(stats.approved).toBe(1)
    expect(stats.rejected).toBe(1)
    expect(stats.success).toBe(1)
    expect(stats.failed).toBe(0)
  })

  it('export 生成可回放 JSON', () => {
    const stream = new EventStream('export_test')
    stream.emit('session_start', {}, 'system')
    stream.emit('user_message', { content: 'test' }, 'user')

    const json = stream.export()
    const parsed = JSON.parse(json)
    expect(parsed.sessionId).toBe('export_test')
    expect(parsed.events).toHaveLength(2)
  })

  it('reset 清空事件', () => {
    const stream = new EventStream()
    stream.emit('user_message', {}, 'user')
    expect(stream.allEvents).toHaveLength(1)
    stream.reset()
    expect(stream.allEvents).toHaveLength(0)
  })
})

// ===== P2.1 Plan 解析 =====

describe('parsePlan（AI 计划解析）', () => {
  it('解析标准 JSON 计划', () => {
    const json = JSON.stringify({
      goal: 'Read project files',
      steps: [
        { id: 's1', description: 'List files', tool: 'fs_list' },
        { id: 's2', description: 'Read main file', tool: 'fs_read', args: { path: '/src/main.ts' } },
      ],
    })
    const plan = parsePlan(json)
    expect(plan).not.toBeNull()
    expect(plan!.goal).toBe('Read project files')
    expect(plan!.steps).toHaveLength(2)
    expect(plan!.steps[0].status).toBe('pending')
  })

  it('Markdown 代码块中的计划', () => {
    const text = 'Here is my plan:\n```json\n{"goal":"test","steps":[{"id":"s1","description":"do it"}]}\n```'
    const plan = parsePlan(text)
    expect(plan).not.toBeNull()
    expect(plan!.goal).toBe('test')
  })

  it('纯文本返回 null', () => {
    expect(parsePlan('I cannot create a plan for this.')).toBeNull()
    expect(parsePlan('')).toBeNull()
  })
})

// ===== P2.1/P2.2 Agent Orchestrator =====

describe('runOrchestratedAgent（Plan/Act 引擎）', () => {
  const mockConfig: OrchestratorConfig = {
    mcpServers: [],
    maxSteps: 5,
    autoApprove: true,
    sendFn: vi.fn(),
  }

  it('AI 未生成计划 → 直接返回回复', async () => {
    const sendFn = vi.fn().mockResolvedValue('I will help you directly with this task.')
    const result = await runOrchestratedAgent('do something', { ...mockConfig, sendFn })
    expect(result.finalResponse).toBe('I will help you directly with this task.')
    expect(result.plan.steps).toHaveLength(0)
    expect(result.success).toBe(true)
  })

  it('Plan 生成失败 → 诚实报错', async () => {
    const sendFn = vi.fn().mockRejectedValue(new Error('API down'))
    const result = await runOrchestratedAgent('task', { ...mockConfig, sendFn })
    expect(result.success).toBe(false)
    expect(result.finalResponse).toContain('Failed to generate plan')
  })

  it('autoApprove 模式跳过审批', async () => {
    const planJson = JSON.stringify({
      goal: 'Simple task',
      steps: [{ id: 's1', description: 'Just explain something' }],
    })
    const sendFn = vi.fn()
      .mockResolvedValueOnce(planJson)  // Plan 调用
      .mockResolvedValueOnce('Step 1 result')  // Act 调用
      .mockResolvedValueOnce('Summary: task complete')  // Summary

    const approvalCallback = vi.fn()
    const result = await runOrchestratedAgent('task', {
      ...mockConfig, sendFn, autoApprove: true, approvalCallback,
    })

    expect(approvalCallback).not.toHaveBeenCalled() // 跳过审批
    expect(result.completedSteps).toBe(1)
    expect(result.finalResponse).toContain('Summary')
  })

  it('用户拒绝步骤 → 标记 skipped', async () => {
    const planJson = JSON.stringify({
      goal: 'Test rejection',
      steps: [{ id: 's1', description: 'Do something', tool: 'test_tool' }],
    })
    const sendFn = vi.fn()
      .mockResolvedValueOnce(planJson)
      .mockResolvedValueOnce('Summary after rejection')

    const result = await runOrchestratedAgent('task', {
      ...mockConfig,
      sendFn,
      autoApprove: false,
      approvalCallback: async () => ({ approved: false }),
    })

    expect(result.plan.steps[0].status).toBe('skipped')
    expect(result.completedSteps).toBe(0)
  })
})

// ===== P2.3 Sandbox =====

describe('SandboxClient（Web Worker 沙箱）', () => {
  beforeEach(() => terminateSandbox())

  it('执行简单表达式', async () => {
    const sandbox = getSandbox()
    const result = await sandbox.execute('return 1 + 2')
    expect(result.success).toBe(true)
    expect(result.result).toBe(3)
  }, 10000)

  it('执行函数并返回结果', async () => {
    const sandbox = getSandbox()
    const result = await sandbox.execute(`
      const arr = [1, 2, 3, 4, 5]
      return arr.filter(n => n > 2).map(n => n * 2)
    `)
    expect(result.success).toBe(true)
    expect(result.result).toEqual([6, 8, 10])
  }, 10000)

  it('捕获 console 输出', async () => {
    const sandbox = getSandbox()
    const result = await sandbox.execute(`
      console.log('hello from sandbox')
      console.warn('warning message')
      return 'done'
    `)
    expect(result.success).toBe(true)
    expect(result.console).toHaveLength(2)
    expect(result.console[0].level).toBe('log')
    expect(result.console[0].args[0]).toBe('hello from sandbox')
  }, 10000)

  it('语法错误返回 error', async () => {
    const sandbox = getSandbox()
    const result = await sandbox.execute('this is not valid javascript {{{')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  }, 10000)

  it('超长代码被拒绝', async () => {
    const sandbox = getSandbox()
    const longCode = 'x'.repeat(20000)
    const result = await sandbox.execute(longCode)
    expect(result.success).toBe(false)
    expect(result.error).toContain('too long')
  }, 10000)

  it('terminate 后可重建', async () => {
    const s1 = getSandbox()
    const r1 = await s1.execute('return 42')
    expect(r1.result).toBe(42)

    terminateSandbox()
    const s2 = getSandbox()
    expect(s2).not.toBe(s1)
    const r2 = await s2.execute('return 100')
    expect(r2.result).toBe(100)
  }, 15000)
})
