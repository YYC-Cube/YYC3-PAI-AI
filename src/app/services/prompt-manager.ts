/**
 * @file prompt-manager.ts
 * @description P3.2 Prompt 版本管理 — 模板 CRUD + 版本历史 + A/B 测试 + 回滚
 *
 * 对标：Langfuse prompt management（本地版）
 *
 * 功能：
 *   1. 模板化：变量插槽 {{variable}}，运行时注入
 *   2. 版本链：每次修改产生新版本，可回滚任意历史版本
 *   3. A/B 测试：同一 prompt 两个变体交替使用，比较成功率
 *   4. 使用统计：每个版本的调用次数/满意度/平均延迟
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags prompt,version,ab-test,template,phase-3
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('prompt-manager')
const LS_TEMPLATES = 'yyc3_prompt_templates'
const LS_USAGE = 'yyc3_prompt_usage'

// ===== Types =====

export interface PromptVersion {
  version: number
  content: string
  /** 变量列表（从 {{...}} 提取） */
  variables: string[]
  /** 创建时间 */
  createdAt: number
  /** 版本备注 */
  note?: string
  /** 变体标记（A/B 测试用） */
  variant?: 'A' | 'B'
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  /** 当前激活版本号 */
  activeVersion: number
  /** 版本历史（最新在前） */
  versions: PromptVersion[]
  /** A/B 测试状态 */
  abTest: {
    enabled: boolean
    variantA: number | null // version number
    variantB: number | null
    /** 上次使用的变体 */
    lastVariant: 'A' | 'B' | null
  }
  createdAt: number
  updatedAt: number
}

export interface PromptUsage {
  templateId: string
  version: number
  variant?: 'A' | 'B'
  timestamp: number
  /** 请求延迟 */
  latencyMs: number
  /** 用户反馈 */
  feedback: 'positive' | 'negative' | null
  /** 是否成功 */
  success: boolean
}

export interface ABTestResult {
  variantA: { calls: number; successRate: number; avgLatencyMs: number; positiveRate: number }
  variantB: { calls: number; successRate: number; avgLatencyMs: number; positiveRate: number }
  winner: 'A' | 'B' | 'tie' | 'insufficient_data'
}

// ===== 变量提取 =====

/**
 * 从模板内容中提取 {{variable}} 插槽
 */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

/**
 * 渲染模板：替换 {{variable}} 为实际值
 */
export function renderTemplate(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}` // 未提供的变量保持原样
  })
}

// ===== 模板管理 =====

function loadTemplates(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(LS_TEMPLATES)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTemplates(templates: PromptTemplate[]): void {
  try {
    localStorage.setItem(LS_TEMPLATES, JSON.stringify(templates))
  } catch { /* quota */ }
}

function loadUsage(): PromptUsage[] {
  try {
    const raw = localStorage.getItem(LS_USAGE)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUsage(usage: PromptUsage[]): void {
  try {
    // 保留最近 500 条
    localStorage.setItem(LS_USAGE, JSON.stringify(usage.slice(-500)))
  } catch { /* quota */ }
}

// ===== Public API =====

/**
 * 创建新模板（初始版本 v1）
 */
export function createTemplate(name: string, content: string, description = ''): PromptTemplate {
  const templates = loadTemplates()
  const variables = extractVariables(content)

  const template: PromptTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    description,
    activeVersion: 1,
    versions: [{
      version: 1,
      content,
      variables,
      createdAt: Date.now(),
    }],
    abTest: { enabled: false, variantA: null, variantB: null, lastVariant: null },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  templates.push(template)
  saveTemplates(templates)
  logger.info(`Template created: ${name} (v1, ${variables.length} variables)`)
  return template
}

/**
 * 获取所有模板
 */
export function listTemplates(): PromptTemplate[] {
  return loadTemplates()
}

/**
 * 获取单个模板
 */
export function getTemplate(id: string): PromptTemplate | null {
  return loadTemplates().find(t => t.id === id) ?? null
}

/**
 * 添加新版本（保留历史）
 */
export function addVersion(
  templateId: string,
  content: string,
  note?: string,
  variant?: 'A' | 'B',
): PromptVersion | null {
  const templates = loadTemplates()
  const tpl = templates.find(t => t.id === templateId)
  if (!tpl) return null

  const nextVersion = Math.max(...tpl.versions.map(v => v.version)) + 1
  const variables = extractVariables(content)

  const version: PromptVersion = {
    version: nextVersion,
    content,
    variables,
    createdAt: Date.now(),
    note,
    variant,
  }

  tpl.versions.unshift(version) // 最新在前
  tpl.activeVersion = nextVersion // 自动激活
  tpl.updatedAt = Date.now()
  saveTemplates(templates)
  logger.info(`Version added: ${tpl.name} v${nextVersion}`)
  return version
}

/**
 * 回滚到指定版本
 */
export function rollbackTo(templateId: string, version: number): boolean {
  const templates = loadTemplates()
  const tpl = templates.find(t => t.id === templateId)
  if (!tpl) return false

  const target = tpl.versions.find(v => v.version === version)
  if (!target) return false

  tpl.activeVersion = version
  tpl.updatedAt = Date.now()
  saveTemplates(templates)
  logger.info(`Rolled back: ${tpl.name} → v${version}`)
  return true
}

/**
 * 启用 A/B 测试（指定两个版本号）
 */
export function enableABTest(templateId: string, versionA: number, versionB: number): boolean {
  const templates = loadTemplates()
  const tpl = templates.find(t => t.id === templateId)
  if (!tpl) return false

  const hasA = tpl.versions.some(v => v.version === versionA)
  const hasB = tpl.versions.some(v => v.version === versionB)
  if (!hasA || !hasB) return false

  tpl.abTest = { enabled: true, variantA: versionA, variantB: versionB, lastVariant: null }
  tpl.updatedAt = Date.now()
  saveTemplates(templates)
  return true
}

/**
 * 禁用 A/B 测试
 */
export function disableABTest(templateId: string): void {
  const templates = loadTemplates()
  const tpl = templates.find(t => t.id === templateId)
  if (tpl) {
    tpl.abTest.enabled = false
    tpl.updatedAt = Date.now()
    saveTemplates(templates)
  }
}

/**
 * 获取要使用的版本（考虑 A/B 测试交替）
 */
export function getActiveVersion(templateId: string): { version: PromptVersion; variant: 'A' | 'B' | null } | null {
  const tpl = getTemplate(templateId)
  if (!tpl) return null

  if (tpl.abTest.enabled && tpl.abTest.variantA && tpl.abTest.variantB) {
    // 交替使用 A/B
    const nextVariant = tpl.abTest.lastVariant === 'A' ? 'B' : 'A'
    const versionNum = nextVariant === 'A' ? tpl.abTest.variantA : tpl.abTest.variantB
    const version = tpl.versions.find(v => v.version === versionNum)

    // 更新 lastVariant
    const templates = loadTemplates()
    const t = templates.find(x => x.id === templateId)
    if (t) {
      t.abTest.lastVariant = nextVariant
      saveTemplates(templates)
    }

    return version ? { version, variant: nextVariant } : null
  }

  // 非 A/B：使用 activeVersion
  const version = tpl.versions.find(v => v.version === tpl.activeVersion)
  return version ? { version, variant: null } : null
}

/**
 * 渲染模板（考虑 A/B 测试）
 */
export function renderPrompt(
  templateId: string,
  variables: Record<string, string>,
): { content: string; version: number; variant: 'A' | 'B' | null } | null {
  const active = getActiveVersion(templateId)
  if (!active) return null

  return {
    content: renderTemplate(active.version.content, variables),
    version: active.version.version,
    variant: active.variant,
  }
}

/**
 * 记录使用（供 A/B 分析）
 */
export function recordUsage(params: Omit<PromptUsage, 'timestamp'>): void {
  const usage = loadUsage()
  usage.push({ ...params, timestamp: Date.now() })
  saveUsage(usage)
}

/**
 * 获取 A/B 测试结果
 */
export function getABTestResult(templateId: string): ABTestResult {
  const usage = loadUsage().filter(u => u.templateId === templateId)

  const variantAUsage = usage.filter(u => u.variant === 'A')
  const variantBUsage = usage.filter(u => u.variant === 'B')

  const calcStats = (records: PromptUsage[]) => {
    if (!records.length) {
      return { calls: 0, successRate: 0, avgLatencyMs: 0, positiveRate: 0 }
    }
    const withFeedback = records.filter(r => r.feedback !== null)
    return {
      calls: records.length,
      successRate: records.filter(r => r.success).length / records.length,
      avgLatencyMs: Math.round(records.reduce((s, r) => s + r.latencyMs, 0) / records.length),
      positiveRate: withFeedback.length > 0
        ? withFeedback.filter(r => r.feedback === 'positive').length / withFeedback.length
        : 0,
    }
  }

  const statsA = calcStats(variantAUsage)
  const statsB = calcStats(variantBUsage)

  // 判定胜者（最少 5 次调用才有效）
  let winner: ABTestResult['winner'] = 'insufficient_data'
  if (statsA.calls >= 5 && statsB.calls >= 5) {
    if (statsA.successRate > statsB.successRate + 0.05) winner = 'A'
    else if (statsB.successRate > statsA.successRate + 0.05) winner = 'B'
    else winner = 'tie'
  }

  return { variantA: statsA, variantB: statsB, winner }
}

/**
 * 删除模板
 */
export function deleteTemplate(templateId: string): boolean {
  const templates = loadTemplates()
  const idx = templates.findIndex(t => t.id === templateId)
  if (idx < 0) return false
  templates.splice(idx, 1)
  saveTemplates(templates)
  return true
}
