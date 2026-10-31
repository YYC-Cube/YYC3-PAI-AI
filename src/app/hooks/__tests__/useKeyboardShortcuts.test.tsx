/**
 * @file useKeyboardShortcuts.test.tsx
 * @description 键盘快捷键 hook 测试 — 组合解析（mod/ctrl/shift/alt）、输入框豁免、preventDefault
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts, type ShortcutBinding } from '../useKeyboardShortcuts'

const keyEvent = (init: Partial<KeyboardEvent> & { key: string }) =>
  new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })

describe('useKeyboardShortcuts', () => {
  it('单键匹配并触发 action', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'k', action }]))
    window.dispatchEvent(keyEvent({ key: 'k' }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('大小写不敏感（A 键匹配 a 绑定）', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'a', action }]))
    window.dispatchEvent(keyEvent({ key: 'A' }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('宽松语义：未指定的 ctrl/alt 不阻断，但 shift 要求未按下', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'k', action }]))
    // ctrl 按下仍匹配（实现仅检查已声明的修饰键）
    window.dispatchEvent(keyEvent({ key: 'k', ctrlKey: true }))
    expect(action).toHaveBeenCalledTimes(1)
    // shift 按下则不匹配（shift 位反相要求）
    window.dispatchEvent(keyEvent({ key: 'k', shiftKey: true }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('mod 组合：非 Mac 用 ctrlKey（jsdom navigator.platform 非 mac）', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'mod+k', action }]))
    window.dispatchEvent(keyEvent({ key: 'k', ctrlKey: true }))
    expect(action).toHaveBeenCalledTimes(1)
    // 仅 meta 无 ctrl 不触发（非 Mac 语义）
    window.dispatchEvent(keyEvent({ key: 'k', metaKey: true }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('shift 组合要求 shiftKey 同按', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'shift+k', action }]))
    window.dispatchEvent(keyEvent({ key: 'K', shiftKey: true }))
    expect(action).toHaveBeenCalledTimes(1)
    window.dispatchEvent(keyEvent({ key: 'k' }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('特殊键 escape/enter/`/,/// 精确匹配', () => {
    const esc = vi.fn()
    const enter = vi.fn()
    renderHook(() => useKeyboardShortcuts([
      { keys: 'escape', action: esc },
      { keys: 'enter', action: enter },
    ]))
    window.dispatchEvent(keyEvent({ key: 'Escape' }))
    window.dispatchEvent(keyEvent({ key: 'Enter' }))
    expect(esc).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledTimes(1)
  })

  it('输入框聚焦时豁免普通键，但 escape/mod 组合仍生效', () => {
    const normal = vi.fn()
    const esc = vi.fn()
    const mod = vi.fn()
    renderHook(() => useKeyboardShortcuts([
      { keys: 'k', action: normal },
      { keys: 'escape', action: esc },
      { keys: 'mod+s', action: mod },
    ]))
    const input = document.createElement('input')
    document.body.appendChild(input)

    const evInInput = keyEvent({ key: 'k' })
    Object.defineProperty(evInInput, 'target', { value: input })
    window.dispatchEvent(evInInput)
    expect(normal).not.toHaveBeenCalled()

    const evEscInInput = keyEvent({ key: 'Escape' })
    Object.defineProperty(evEscInInput, 'target', { value: input })
    window.dispatchEvent(evEscInInput)
    expect(esc).toHaveBeenCalledTimes(1)

    const evModInInput = keyEvent({ key: 's', ctrlKey: true })
    Object.defineProperty(evModInInput, 'target', { value: input })
    window.dispatchEvent(evModInInput)
    expect(mod).toHaveBeenCalledTimes(1)

    input.remove()
  })

  it('preventDefault 默认开启（事件被取消）', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'k', action }]))
    const ev = keyEvent({ key: 'k' })
    window.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })

  it('preventDefault: false 时不取消默认行为', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ keys: 'k', action, preventDefault: false }]))
    const ev = keyEvent({ key: 'k' })
    window.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
  })

  it('bindings 更新后无需重挂载即生效（ref 同步）', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ b }: { b: ShortcutBinding[] }) => useKeyboardShortcuts(b), {
      initialProps: { b: [{ keys: 'j', action: first }] },
    })
    rerender({ b: [{ keys: 'j', action: second }] })
    window.dispatchEvent(keyEvent({ key: 'j' }))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
