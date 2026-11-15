/**
 * @file TraceViewer.test.tsx
 * @description 请求追踪面板测试 — 消费 trace-store + otel-adapter（列表/摘要/详情/导出/清空）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import type { TraceRecord, TraceSummary } from '../../services/trace-store'

vi.mock('../../services/trace-store', () => ({
  getRecentTraces: vi.fn(),
  getTraceSummary: vi.fn(),
  clearTraces: vi.fn(),
}))

vi.mock('../../services/otel-adapter', () => ({
  downloadOtelExport: vi.fn(),
}))

import { TraceViewer } from '../TraceViewer'
import { getRecentTraces, getTraceSummary, clearTraces } from '../../services/trace-store'
import { downloadOtelExport } from '../../services/otel-adapter'

const fixture: TraceRecord = {
  id: 'trace-1',
  timestamp: Date.parse('2026-10-31T10:00:00Z'),
  provider: 'zhipu',
  model: 'glm-4.6',
  promptPreview: '帮我生成登录页代码',
  completion: '好的，以下是登录页实现……',
  firstTokenMs: 320,
  totalMs: 1420,
  inputTokens: 120,
  outputTokens: 480,
  costUsd: 0.012,
  success: true,
  toolCalls: [
    { tool: 'read_file', args: { path: 'src/App.tsx' }, result: 'file content', isError: false, durationMs: 42 },
  ],
  iterations: 2,
}

const summary: TraceSummary = {
  totalTraces: 1,
  avgFirstTokenMs: 320,
  avgTotalMs: 1420,
  avgCostUsd: 0.012,
  totalCostUsd: 0.012,
  successRate: 1,
  toolCallCount: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRecentTraces).mockResolvedValue([fixture])
  vi.mocked(getTraceSummary).mockResolvedValue(summary)
  vi.mocked(clearTraces).mockResolvedValue(undefined)
})

describe('TraceViewer（请求追踪面板）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<TraceViewer visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('空态渲染占位提示', async () => {
    vi.mocked(getRecentTraces).mockResolvedValue([])
    vi.mocked(getTraceSummary).mockResolvedValue({ ...summary, totalTraces: 0 })
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('暂无追踪记录'))
  })

  it('渲染追踪列表与摘要卡（延迟/工具/成本/成功率）', async () => {
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('帮我生成登录页代码'))
    expect(container.textContent).toContain('1420ms')
    expect(container.textContent).toContain('glm-4.6')
    expect(container.textContent).toContain('平均延迟')
    expect(container.textContent).toContain('总成本')
    expect(container.textContent).toContain('100%')
    expect(container.textContent).toContain('1 条 · 成功率 100%')
  })

  it('点击记录展开链路详情（模型/耗时/工具调用）', async () => {
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('帮我生成登录页代码'))
    fireEvent.click(container.textContent!.includes('帮我生成登录页代码') ? container.querySelectorAll('.cursor-pointer')[0] : container)
    await waitFor(() => expect(container.textContent).toContain('链路详情'))
    expect(container.textContent).toContain('zhipu/glm-4.6')
    expect(container.textContent).toContain('首 Token')
    expect(container.textContent).toContain('read_file')
  })

  it('导出按钮调用 OTel 导出（有记录时）', async () => {
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('帮我生成登录页代码'))
    fireEvent.click(container.querySelector('[title="导出 OTel JSON"]')!)
    expect(downloadOtelExport).toHaveBeenCalledTimes(1)
  })

  it('清空按钮调用 clearTraces 并刷新列表', async () => {
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('帮我生成登录页代码'))
    fireEvent.click(container.querySelector('[title="清空"]')!)
    await waitFor(() => expect(clearTraces).toHaveBeenCalledTimes(1))
    // 清空后触发 refresh（getRecentTraces 第二次调用）
    await waitFor(() => expect(getRecentTraces).toHaveBeenCalledTimes(2))
  })

  it('失败追踪仍渲染记录行（success=false 状态点）', async () => {
    vi.mocked(getRecentTraces).mockResolvedValue([{ ...fixture, id: 'trace-2', success: false, errorMessage: '模型超时' }])
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('glm-4.6'))
    // 失败记录的红点：error 色（主题变量），此处验证记录仍被渲染
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThan(0)
  })

  it('详情可关闭且无工具调用时不渲染工具段', async () => {
    vi.mocked(getRecentTraces).mockResolvedValue([{ ...fixture, toolCalls: [] }])
    const { container } = render(<TraceViewer visible onClose={() => {}} />)
    await waitFor(() => expect(container.textContent).toContain('帮我生成登录页代码'))
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    await waitFor(() => expect(container.textContent).toContain('链路详情'))
    expect(container.textContent).not.toContain('工具调用 (')
    // 关闭详情
    fireEvent.click(container.querySelector('.border-t .p-1')!)
    await waitFor(() => expect(container.textContent).not.toContain('链路详情'))
  })
})
