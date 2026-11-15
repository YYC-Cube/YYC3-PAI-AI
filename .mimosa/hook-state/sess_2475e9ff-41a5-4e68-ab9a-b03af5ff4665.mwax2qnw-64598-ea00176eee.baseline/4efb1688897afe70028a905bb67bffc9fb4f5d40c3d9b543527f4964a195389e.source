/**
 * @file phase3-services.test.ts
 * @description Phase 3 测试：Prompt 版本管理（CRUD/A-B/回滚）+ OAuth PKCE 基建
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  extractVariables, renderTemplate, createTemplate, listTemplates,
  getTemplate, addVersion, rollbackTo, enableABTest, disableABTest,
  getActiveVersion, renderPrompt, recordUsage, getABTestResult, deleteTemplate,
} from '../prompt-manager'
import {
  generateCodeVerifier, generateCodeChallenge,
  getAuthState, isAuthenticated, logout, getUser,
} from '../auth-client'

beforeEach(() => {
  localStorage.clear()
})

// ===== P3.2 Prompt 版本管理 =====

describe('extractVariables / renderTemplate', () => {
  it('提取模板变量（去重）', () => {
    expect(extractVariables('Hello {{name}}, welcome {{name}} to {{project}}!'))
      .toEqual(['name', 'project'])
  })

  it('无变量返回空数组', () => {
    expect(extractVariables('No variables here')).toEqual([])
  })

  it('renderTemplate 替换变量', () => {
    expect(renderTemplate('Hello {{name}}!', { name: 'YYC³' })).toBe('Hello YYC³!')
  })

  it('未提供的变量保持原样', () => {
    expect(renderTemplate('{{a}} {{b}}', { a: '1' })).toBe('1 {{b}}')
  })
})

describe('PromptTemplate CRUD + 版本链', () => {
  it('创建模板 → v1 自动生成', () => {
    const tpl = createTemplate('greeting', 'Hello {{user}}!', 'Test template')
    expect(tpl.name).toBe('greeting')
    expect(tpl.activeVersion).toBe(1)
    expect(tpl.versions).toHaveLength(1)
    expect(tpl.versions[0].variables).toEqual(['user'])
    expect(listTemplates()).toHaveLength(1)
  })

  it('添加新版本 → 自动激活 + 历史保留', () => {
    const tpl = createTemplate('test', 'v1 content')
    const v2 = addVersion(tpl.id, 'v2 content with {{var}}', '改进版')

    expect(v2?.version).toBe(2)
    const updated = getTemplate(tpl.id)!
    expect(updated.activeVersion).toBe(2)
    expect(updated.versions).toHaveLength(2)
    expect(updated.versions[0].version).toBe(2) // 最新在前
  })

  it('回滚到历史版本', () => {
    const tpl = createTemplate('test', 'v1')
    addVersion(tpl.id, 'v2')
    addVersion(tpl.id, 'v3')

    expect(rollbackTo(tpl.id, 1)).toBe(true)
    const updated = getTemplate(tpl.id)!
    expect(updated.activeVersion).toBe(1)
    // 版本历史仍然保留
    expect(updated.versions).toHaveLength(3)
  })

  it('删除模板', () => {
    const tpl = createTemplate('to-delete', 'content')
    expect(deleteTemplate(tpl.id)).toBe(true)
    expect(listTemplates()).toHaveLength(0)
    expect(deleteTemplate(tpl.id)).toBe(false) // 不存在
  })
})

describe('A/B 测试', () => {
  it('启用 A/B 测试 + 交替使用', () => {
    const tpl = createTemplate('ab-test', 'variant A content')
    addVersion(tpl.id, 'variant B content')

    expect(enableABTest(tpl.id, 1, 2)).toBe(true)

    // 第一次应该用 A（lastVariant 初始 null → 取反 → A）
    const first = getActiveVersion(tpl.id)
    expect(first?.variant).toBe('A')

    // 第二次应该用 B
    const second = getActiveVersion(tpl.id)
    expect(second?.variant).toBe('B')

    // 第三次回到 A
    const third = getActiveVersion(tpl.id)
    expect(third?.variant).toBe('A')
  })

  it('renderPrompt 返回渲染内容 + 版本信息', () => {
    const tpl = createTemplate('greet', 'Hello {{name}}, you are {{role}}')
    const result = renderPrompt(tpl.id, { name: 'Alice', role: 'admin' })
    expect(result?.content).toBe('Hello Alice, you are admin')
    expect(result?.version).toBe(1)
    expect(result?.variant).toBeNull() // 非 A/B 模式
  })

  it('A/B 统计结果', () => {
    const tpl = createTemplate('ab', 'content A')
    addVersion(tpl.id, 'content B')
    enableABTest(tpl.id, 1, 2)

    // 模拟使用记录
    for (let i = 0; i < 6; i++) {
      recordUsage({ templateId: tpl.id, version: 1, variant: 'A', latencyMs: 100 + i * 10, success: i < 5, feedback: i < 4 ? 'positive' : 'negative' })
    }
    for (let i = 0; i < 6; i++) {
      recordUsage({ templateId: tpl.id, version: 2, variant: 'B', latencyMs: 150 + i * 10, success: i < 3, feedback: i < 2 ? 'positive' : 'negative' })
    }

    const result = getABTestResult(tpl.id)
    expect(result.variantA.calls).toBe(6)
    expect(result.variantB.calls).toBe(6)
    expect(result.variantA.successRate).toBeCloseTo(5 / 6)
    expect(result.variantB.successRate).toBeCloseTo(3 / 6)
    expect(result.winner).toBe('A') // A 成功率明显更高
  })

  it('禁用 A/B 后回归单版本', () => {
    const tpl = createTemplate('test', 'v1')
    addVersion(tpl.id, 'v2')
    enableABTest(tpl.id, 1, 2)
    disableABTest(tpl.id)

    const result = getActiveVersion(tpl.id)
    expect(result?.variant).toBeNull()
    expect(result?.version.version).toBe(2) // activeVersion
  })
})

// ===== P3.1 OAuth PKCE =====

describe('PKCE 工具', () => {
  it('generateCodeVerifier 生成 64 字符 hex', async () => {
    const verifier = generateCodeVerifier()
    expect(verifier).toMatch(/^[a-f0-9]{64}$/)
  })

  it('generateCodeVerifier 每次不同', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
  })

  it('generateCodeChallenge 生成 SHA-256 哈希', async () => {
    const verifier = 'test_verifier_123'
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge).toMatch(/^[a-f0-9]{64}$/)
    // 相同输入相同输出
    expect(await generateCodeChallenge(verifier)).toBe(challenge)
    // 不同输入不同输出
    expect(await generateCodeChallenge('other')).not.toBe(challenge)
  })
})

describe('Auth 状态管理', () => {
  it('初始状态 unauthenticated', () => {
    expect(getAuthState()).toBe('unauthenticated')
    expect(isAuthenticated()).toBe(false)
  })

  it('logout 清空所有认证数据', () => {
    localStorage.setItem('yyc3_auth_state', 'authenticated')
    localStorage.setItem('yyc3_auth_tokens', JSON.stringify({ accessToken: 'tok', expiresAt: Date.now() + 3600000, tokenType: 'Bearer' }))
    localStorage.setItem('yyc3_auth_user', JSON.stringify({ id: '1', username: 'test' }))

    logout()

    expect(getAuthState()).toBe('unauthenticated')
    expect(isAuthenticated()).toBe(false)
    expect(getUser()).toBeNull()
  })
})
