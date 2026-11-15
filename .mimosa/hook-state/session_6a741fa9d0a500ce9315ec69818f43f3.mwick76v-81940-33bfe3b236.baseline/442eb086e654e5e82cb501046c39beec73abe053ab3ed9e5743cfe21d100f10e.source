/**
 * @file version-examples.test.ts
 * @description 版本示例脚本烟测 — 顶层演示代码导入即全量执行（console 桩抑制）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('version-examples（演示脚本）', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('导入执行全脚本：基础信息/递增/比较各段落均输出', async () => {
    await import('../version-examples')
    const out = logSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n')
    expect(out).toContain('版本管理器')
    expect(out).toContain('当前版本')
    expect(out).toContain('Patch')
    // 示例脚本的比较/范围段也执行
    expect(logSpy.mock.calls.length).toBeGreaterThan(10)
  })
})
