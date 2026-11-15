/**
 * @file useOverlayPanels.test.tsx
 * @description 十面板可见性聚合 hook — 初始态/show/hide/toggle/setter 工厂/事件键映射
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOverlayPanels, EVENT_TO_PANEL_KEY, type OverlayPanelKey } from '../useOverlayPanels'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

const ALL_KEYS: OverlayPanelKey[] = [
  'aiAssist', 'codeGen', 'collabPanel', 'gitPanel', 'perfDash',
  'diagPanel', 'taskBoard', 'snippetMgr', 'activityLog', 'multiInstance',
]

describe('useOverlayPanels（面板可见性聚合）', () => {
  it('初始：10 个面板全部不可见', () => {
    const { result } = renderHook(() => useOverlayPanels())
    for (const k of ALL_KEYS) {
      expect(result.current.panels[k]).toBe(false)
    }
    expect(Object.keys(result.current.panels)).toHaveLength(10)
  })

  it('show/hide：单键置位不影响其他键', () => {
    const { result } = renderHook(() => useOverlayPanels())
    act(() => result.current.show('gitPanel'))
    expect(result.current.panels.gitPanel).toBe(true)
    expect(result.current.panels.aiAssist).toBe(false)
    act(() => result.current.hide('gitPanel'))
    expect(result.current.panels.gitPanel).toBe(false)
  })

  it('toggle：开↔关翻转；互不干扰', () => {
    const { result } = renderHook(() => useOverlayPanels())
    act(() => result.current.toggle('taskBoard'))
    expect(result.current.panels.taskBoard).toBe(true)
    act(() => result.current.toggle('taskBoard'))
    expect(result.current.panels.taskBoard).toBe(false)
    act(() => result.current.toggle('snippetMgr'))
    expect(result.current.panels.snippetMgr).toBe(true)
    expect(result.current.panels.taskBoard).toBe(false)
  })

  it('setter 工厂：生成 (v)=>void 闭包，同键重复调用取最后值', () => {
    const { result } = renderHook(() => useOverlayPanels())
    const setter = result.current.setter('perfDash')
    expect(typeof setter).toBe('function')
    act(() => setter(true))
    expect(result.current.panels.perfDash).toBe(true)
    act(() => setter(false))
    expect(result.current.panels.perfDash).toBe(false)
    // setter 工厂为 useCallback 稳定引用；每次调用返回作用于指定键的新闭包
    const first = result.current
    const diagSetter = first.setter('diagPanel')
    act(() => diagSetter(true))
    expect(result.current.panels.diagPanel).toBe(true)
  })

  it('setter 与 show/hide 操作同一状态', () => {
    const { result } = renderHook(() => useOverlayPanels())
    const hide = result.current.hide
    act(() => result.current.setter('multiInstance')(true))
    expect(result.current.panels.multiInstance).toBe(true)
    act(() => hide('multiInstance'))
    expect(result.current.panels.multiInstance).toBe(false)
  })

  it('EVENT_TO_PANEL_KEY：7 个事件名 → 面板键映射完整且不含未注册事件', () => {
    expect(EVENT_TO_PANEL_KEY).toEqual({
      git: 'gitPanel',
      performance: 'perfDash',
      diagnostics: 'diagPanel',
      taskBoard: 'taskBoard',
      snippets: 'snippetMgr',
      activityLog: 'activityLog',
      multiInstance: 'multiInstance',
    })
    for (const v of Object.values(EVENT_TO_PANEL_KEY)) {
      expect(ALL_KEYS).toContain(v)
    }
  })
})
