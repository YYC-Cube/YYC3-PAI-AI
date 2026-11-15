/**
 * @file useChatSession.test.tsx
 * @description 多会话 Hook 测试：坏 JSON 防御 / 新建 / 切换 / 删除（覆盖率收敛）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatSession } from '../useChatSession'

const KEY = 'yyc3-chat-sessions'

describe('useChatSession（多会话管理）', () => {
  beforeEach(() => localStorage.clear())

  it('空存储自动创建首个会话', async () => {
    const { result } = renderHook(() => useChatSession())
    await act(async () => { })
    expect(result.current.sessionList.length).toBeGreaterThanOrEqual(1)
    expect(result.current.currentSid).toBeTruthy()
  })

  it('坏 JSON 丢弃重建不崩溃（P3 修复回归）', async () => {
    localStorage.setItem(KEY, '{{broken')
    const { result } = renderHook(() => useChatSession())
    await act(async () => { })
    expect(result.current.sessionList.length).toBeGreaterThanOrEqual(1)
    expect(localStorage.getItem(KEY)).not.toContain('{{')
  })

  it('持久化到 localStorage', async () => {
    renderHook(() => useChatSession())
    await act(async () => { })
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]')
    expect(Array.isArray(stored)).toBe(true)
    expect(stored.length).toBeGreaterThanOrEqual(1)
  })

  it('新建会话：加入列表并切换为当前', async () => {
    const { result } = renderHook(() => useChatSession())
    await act(async () => { })
    const before = result.current.sessionList.length
    let sid = ''
    await act(async () => { sid = result.current.createNewSession() })
    void sid
    expect(result.current.sessionList.length).toBe(before + 1)
    expect(result.current.currentSid).toBe(sid)
  })

  it('删除当前会话：自动切到剩余会话', async () => {
    const { result } = renderHook(() => useChatSession())
    await act(async () => { })
    const first = result.current.currentSid
    await act(async () => { result.current.createNewSession() })
    expect(result.current.currentSid).not.toBe(first)
    await act(async () => { result.current.delSession(result.current.currentSid) })
    expect(result.current.sessionList.some(s => s.sid === first)).toBe(true)
    expect(result.current.currentSid).toBeTruthy()
  })
})
