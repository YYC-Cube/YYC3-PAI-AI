/**
 * @file useIDEKeyboard.test.tsx
 * @description IDE 全局快捷键 — Esc/Ctrl+1|2|Shift+F|\\|w|Shift+P|b|j|3..9|e 分发表
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const m = vi.hoisted(() => ({
  toggleInlinePreview: vi.fn(),
  toggleSplit: vi.fn(),
  closeTab: vi.fn(),
  activateTab: vi.fn(),
  toggleLeftCollapsed: vi.fn(),
  toggleTerminal: vi.fn(),
}))

vi.mock('../../../store/preview-store', () => ({
  usePreviewStore: () => ({ toggleInlinePreview: m.toggleInlinePreview }),
}))

vi.mock('../../../store/ide-store', () => ({
  ideStore: {
    toggleSplit: m.toggleSplit,
    closeTab: m.closeTab,
    activateTab: m.activateTab,
    toggleLeftCollapsed: m.toggleLeftCollapsed,
    toggleTerminal: m.toggleTerminal,
    getState: () => ({
      activeTabId: 'tab-2',
      openTabs: [{ id: 'tab-1' }, { id: 'tab-2' }, { id: 'tab-3' }],
    }),
  },
}))

import { useIDEKeyboard } from '../useIDEKeyboard'
import { fileStore as fileStoreActions } from '../../../store/file-store'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

const press = (key: string, mods: { ctrl?: boolean; shift?: boolean } = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      ctrlKey: mods.ctrl ?? false,
      shiftKey: mods.shift ?? false,
      cancelable: true,
    }))
  })

describe('useIDEKeyboard（全局快捷键）', () => {
  const base = {
    onSwitchMode: vi.fn(),
    fullscreenPreview: false,
    setFullscreenPreview: vi.fn(),
    setViewMode: vi.fn(),
    setTerminalVisible: vi.fn(),
    setTerminalExpanded: vi.fn(),
  }

  it('Escape：全屏预览中退出全屏；非全屏切换模式', () => {
    const onSwitchMode = vi.fn()
    const setFullscreenPreview = vi.fn()
    const { rerender } = renderHook((p: Parameters<typeof useIDEKeyboard>[0]) => useIDEKeyboard(p), {
      initialProps: { ...base, onSwitchMode, setFullscreenPreview },
    })
    press('Escape')
    expect(onSwitchMode).toHaveBeenCalledTimes(1)
    rerender({ ...base, onSwitchMode, setFullscreenPreview, fullscreenPreview: true })
    press('Escape')
    expect(setFullscreenPreview).toHaveBeenCalledWith(false)
    expect(onSwitchMode).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+1 进入预览模式；Ctrl+2 进入编辑模式', () => {
    const setViewMode = vi.fn()
    renderHook(() => useIDEKeyboard({ ...base, setViewMode }))
    press('1', { ctrl: true })
    expect(setViewMode).toHaveBeenCalledWith('preview')
    press('2', { ctrl: true })
    expect(setViewMode).toHaveBeenCalledWith('edit')
  })

  it('Ctrl+Shift+F 触发全局搜索；未传回调时不崩溃', () => {
    const onOpenGlobalSearch = vi.fn()
    renderHook(() => useIDEKeyboard({ ...base, onOpenGlobalSearch }))
    press('F', { ctrl: true, shift: true })
    expect(onOpenGlobalSearch).toHaveBeenCalledTimes(1)
    renderHook(() => useIDEKeyboard(base))
    press('F', { ctrl: true, shift: true })
  })

  it('Ctrl+\\ 分屏、Ctrl+W 关闭当前页签（以 getState().activeTabId 调用）', () => {
    renderHook(() => useIDEKeyboard(base))
    press('\\', { ctrl: true })
    expect(m.toggleSplit).toHaveBeenCalledTimes(1)
    press('w', { ctrl: true })
    expect(m.closeTab).toHaveBeenCalledWith('tab-2')
  })

  it('Ctrl+Shift+P 切换内联预览；Ctrl+B 折叠左栏', () => {
    renderHook(() => useIDEKeyboard(base))
    press('P', { ctrl: true, shift: true })
    expect(m.toggleInlinePreview).toHaveBeenCalledTimes(1)
    press('b', { ctrl: true })
    expect(m.toggleLeftCollapsed).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+J 切换终端：store 动作 + setTerminalVisible 翻转，展开时收起提示', () => {
    const setTerminalVisible = vi.fn((updater: (v: boolean) => boolean): boolean => {
      // 模拟真实 updater：v=false → setTerminalExpanded(false) → true
      const next = updater(false)
      expect(next).toBe(true)
      return next
    }) as unknown as React.Dispatch<React.SetStateAction<boolean>>
    const setTerminalExpanded = vi.fn()
    renderHook(() => useIDEKeyboard({ ...base, setTerminalVisible, setTerminalExpanded }))
    press('j', { ctrl: true })
    expect(m.toggleTerminal).toHaveBeenCalledTimes(1)
    expect(setTerminalExpanded).toHaveBeenCalledWith(false)
    press('`', { ctrl: true })
    expect(m.toggleTerminal).toHaveBeenCalledTimes(2)
  })

  it('Ctrl+3..9 按序号切页签：越界（如 Ctrl+9）不调用 activateTab', () => {
    const { rerender } = renderHook((p: Parameters<typeof useIDEKeyboard>[0]) => useIDEKeyboard(p), { initialProps: { ...base } })
    press('3', { ctrl: true })
    expect(m.activateTab).toHaveBeenCalledWith('tab-3') // 第3个键 → 下标2 → tab-3
    press('9', { ctrl: true }) // 下标8 → 只有3个页签 → 越界不切
    expect(m.activateTab).toHaveBeenCalledTimes(1)
    rerender({ ...base })
  })

  it('Ctrl+E 切换最近文件面板；卸载后按键不再分发', () => {
    const spy = vi.spyOn(fileStoreActions, 'toggleRecentPanel')
    const { unmount } = renderHook(() => useIDEKeyboard(base))
    press('e', { ctrl: true })
    expect(spy).toHaveBeenCalledTimes(1)
    unmount()
    press('e', { ctrl: true })
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('无修饰键的按键不触发任何分发', () => {
    renderHook(() => useIDEKeyboard(base))
    press('1')
    press('j')
    press('e')
    expect(m.toggleTerminal).not.toHaveBeenCalled()
    expect(m.toggleInlinePreview).not.toHaveBeenCalled()
  })
})
