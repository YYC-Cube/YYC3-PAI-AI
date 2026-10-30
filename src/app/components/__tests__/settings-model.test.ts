/**
 * @file settings-model.test.ts
 * @description ModelSettings 共享数据层契约（拆分后模块 · 覆盖率收敛）
 */

import { describe, it, expect } from 'vitest'
import { DEFAULT_MCP_SERVERS, OLLAMA_BASE, PROVIDERS, SK, loadJ, saveJ, type ProviderDef } from '../settings-model'

describe('settings-model（Provider 目录 / 存储助手）', () => {
  it('PROVIDERS：三大内置 provider 齐全且 id 唯一', () => {
    const ids = PROVIDERS.map(p => p.id)
    expect(ids).toEqual(expect.arrayContaining(['zhipu', 'zhipu-coding', 'ollama']))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('智谱双端点为真实 API URL（生产直连契约）', () => {
    const zhipu = PROVIDERS.find(p => p.id === 'zhipu') as ProviderDef
    const coding = PROVIDERS.find(p => p.id === 'zhipu-coding') as ProviderDef
    expect(zhipu.baseURL).toBe('https://open.bigmodel.cn/api/paas/v4/chat/completions')
    expect(coding.baseURL).toContain('open.bigmodel.cn/api/coding/')
  })

  it('OLLAMA_BASE：直连地址无尾斜杠（dev 代理路径已成历史）', () => {
    expect(OLLAMA_BASE).not.toMatch(/\/$/)
    expect(OLLAMA_BASE).toMatch(/^https?:\/\//)
    expect(PROVIDERS.find(p => p.id === 'ollama')?.baseURL).toBe(`${OLLAMA_BASE}/api/chat`)
  })

  it('SK 键：yyc3-provider-api-keys 与 key-storage 降级层同键', () => {
    expect(SK.keys).toBe('yyc3-provider-api-keys')
    expect(SK.mcp).toBe('yyc3-mcp-servers')
  })

  it('loadJ/saveJ：往返一致 + 坏数据回退', () => {
    saveJ(SK.urls, { zhipu: 'https://x' })
    expect(loadJ(SK.urls, {})).toEqual({ zhipu: 'https://x' })
    localStorage.setItem(SK.urls, 'not-json')
    expect(loadJ(SK.urls, { fb: 1 })).toEqual({ fb: 1 })
  })

  it('DEFAULT_MCP_SERVERS：含 Streamable HTTP 可选字段类型', () => {
    expect(DEFAULT_MCP_SERVERS.length).toBeGreaterThan(0)
    for (const s of DEFAULT_MCP_SERVERS) {
      expect(typeof s.command).toBe('string')
      expect(Array.isArray(s.args)).toBe(true)
    }
  })
})
