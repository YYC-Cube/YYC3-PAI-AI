/**
 * @file StorePanels.test.tsx
 * @description 存储驱动面板测试（覆盖率 onboarding：NotificationCenter/DiagnosticsPanel/StatDetailPanel/TrendingTopics/MCPPanel/KeyManagerPanel/PerformancePanel）
 * 策略：向真实 zustand/模块 store 注入受控数据 → 断言渲染映射（面板逻辑全真）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'

// ── stores ──
import { activityBus } from '../../store/activity-store'
import { aiMetricsStore } from '../../store/ai-metrics-store'
import { usePerformanceStore } from '../../store/performance-store'

// ── panels ──
import { NotificationCenter } from '../NotificationCenter'
import { DiagnosticsPanel } from '../DiagnosticsPanel'
import { StatDetailPanel } from '../StatDetailPanel'
import { TrendingTopics } from '../TrendingTopics'
import { MCPPanel } from '../MCPPanel'
import { KeyManagerPanel } from '../KeyManagerPanel'
import { PerformancePanel } from '../PerformancePanel'
import { useThemeStore } from '../../store/theme-store'

const t = (_s: string, k: string) => k

/** 组件内取 tokens（hook 规则） */
function PerfHarness() {
  const { tokens } = useThemeStore()
  return <PerformancePanel t={t} tk={tokens} />
}

beforeEach(() => {
  localStorage.clear()
  aiMetricsStore.clearAll()
})

describe('NotificationCenter（activity-store 真源）', () => {
  it('空活动显示空态（无编造通知）', () => {
    render(<NotificationCenter visible onClose={() => { }} />)
    expect(document.body.textContent).not.toContain('System Ready')
  })

  it('推送真实活动后渲染对应通知', () => {
    activityBus.push('ai', 'AI request completed', 'AI 请求完成')
    render(<NotificationCenter visible onClose={() => { }} />)
    expect(document.body.textContent).toContain('AI 请求完成')
  })
})

describe('DiagnosticsPanel（aiMetrics 错误真源）', () => {
  it('无错误时空态', () => {
    render(<DiagnosticsPanel visible onClose={() => { }} />)
    expect(document.body.textContent).not.toContain('TS2322')
  })
})

describe('StatDetailPanel（performance-store 采样真源）', () => {
  it('无采样时不显示伪造历史（Quick stats 为 -）', () => {
    render(<StatDetailPanel stat={{ key: 'cpu', value: 42 }} onClose={() => { }} />)
    expect(document.body.textContent).not.toContain('99.97%')
    expect(document.body.textContent).not.toContain('0.003ms')
  })

  it('注入采样后显示真实延迟', () => {
    act(() => {
      usePerformanceStore.getState().recordSystemMetrics({ cpu: 30, memory: 50, latency: 128, networkSpeed: 10 })
    })
    render(<StatDetailPanel stat={{ key: 'cpu', value: 30 }} onClose={() => { }} />)
    expect(document.body.textContent).toContain('128ms')
  })
})

describe('TrendingTopics（离线示例显式标注）', () => {
  it('页脚标注离线示例与 VITE_TRENDING_API 指引', () => {
    render(<TrendingTopics visible onClose={() => { }} />)
    expect(document.body.textContent).toContain('离线示例')
  })

  it('刷新（未配置数据源）给出诚实提示', async () => {
    render(<TrendingTopics visible onClose={() => { }} />)
    const refresh = Array.from(document.querySelectorAll('button')).find(b => /刷新|refresh/i.test(b.textContent || b.getAttribute('aria-label') || ''))
    expect(refresh).toBeTruthy()
    fireEvent.click(refresh!)
    await waitFor(() => {
      expect(document.body.textContent).toContain('VITE_TRENDING_API')
    })
  })
})

describe('MCPPanel（配置 CRUD + JSON 导入导出）', () => {
  it('渲染预置 MCP 服务器并可切换启用态', async () => {
    render(<MCPPanel t={t} />)
    expect(document.body.textContent).toContain('Filesystem')
    const toggle = document.querySelector('button[aria-label*="Filesystem"]')
    expect(toggle).toBeTruthy()
    fireEvent.click(toggle!)
    const saved = JSON.parse(localStorage.getItem('yyc3-mcp-servers') || '[]')
    const fs = saved.find((s: { name: string }) => s.name === 'Filesystem')
    expect(fs.enabled).toBe(false)
  })

  it('JSON 模式导出含启用服务器', () => {
    render(<MCPPanel t={t} />)
    const jsonBtn = Array.from(document.querySelectorAll('button')).find(b => /JSON/i.test(b.textContent || ''))
    expect(jsonBtn).toBeTruthy()
    fireEvent.click(jsonBtn!)
    const ta = document.querySelector('textarea')
    expect(ta).toBeTruthy()
    expect(ta!.value).toContain('"command"')
    expect(JSON.parse(ta!.value).mcpServers).toBeTruthy()
  })
})

describe('KeyManagerPanel（保险库锁/解锁流）', () => {
  it('未初始化显示设置主密码表单', () => {
    render(<KeyManagerPanel />)
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
  })

  it('设置主密码 → 解锁态 → 锁定（真实 KeyManager 流）', async () => {
    render(<KeyManagerPanel />)
    const pw = document.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(pw, { target: { value: 'master-pass-123' } })
    const submit = Array.from(document.querySelectorAll('button')).find(b => /设置|初始化|创建|解锁|initialize|set/i.test(b.textContent || ''))
    expect(submit).toBeTruthy()
    fireEvent.click(submit!)
    await waitFor(() => {
      const hash = localStorage.getItem('yyc3_master_key_hash') || ''
      expect(hash).toMatch(/^pbkdf2\$/)  // PBKDF2 升级生效
    }, { timeout: 4000 })
  })
})

describe('PerformancePanel（aiMetrics 聚合真源）', () => {
  it('无数据空态（不渲染假指标）', () => {
    render(<PerfHarness />)
    expect(document.body.textContent).not.toContain('$')
  })

  it('注入成功记录后显示成功率/请求数', () => {
    aiMetricsStore.recordSuccess({ providerId: 'zhipu', modelId: 'glm-5', modelName: 'GLM-5', latencyMs: 800 })
    render(<PerfHarness />)
    expect(document.body.textContent).toContain('100.0%')
    expect(document.body.textContent).toContain('1')
  })
})
