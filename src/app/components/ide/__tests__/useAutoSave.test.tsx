/**
 * @file useAutoSave.test.tsx
 * @description 自动保存 hook — 周期落盘/脏态防抖保存/版本创建/开关门控/工作区直通
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const m = vi.hoisted(() => ({
  isRepo: vi.fn(),
  writeFile: vi.fn(),
}))

vi.mock('../../../services/git-service', () => ({
  gitEngine: { isRepo: m.isRepo, writeFile: m.writeFile },
}))

import { useAutoSave } from '../useAutoSave'
import { editorPrefsStore, useEditorPrefs } from '../../../store/editor-prefs-store'
import { fileStore as fileStoreActions } from '../../../store/file-store'

const STORAGE_KEY = 'yyc3_file_content_map'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  editorPrefsStore.update({ autoSave: true })
  // resetAllMocks 后 isRepo 无实现返回 undefined → 直通 .then 同步抛错被 interval try/catch 吞掉，
  // 给出默认非仓库实现，保证 lastAutoSave 正常推进
  m.isRepo.mockResolvedValue(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoSave（自动保存）', () => {
  const baseOpts = {
    fileContentMap: { 'a.tsx': 'const a = 1;' },
    editorDirty: false,
    setEditorDirty: () => {},
    selectedFile: 'a.tsx',
    editorCode: 'const a = 1;',
  }

  it('autoSave 开启：10 秒周期把 fileContentMap 落盘 localStorage 并更新 lastAutoSave', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useAutoSave(baseOpts))
    expect(result.current.lastAutoSave).toBeNull()
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ 'a.tsx': 'const a = 1;' })
    expect(result.current.lastAutoSave).not.toBeNull()
    // 非仓库时直通静默跳过
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('autoSave 关闭：周期与脏态防抖均不落盘', () => {
    vi.useFakeTimers()
    editorPrefsStore.update({ autoSave: false })
    const setEditorDirty = vi.fn()
    const { result } = renderHook(() => useAutoSave({ ...baseOpts, editorDirty: true, setEditorDirty }))
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.lastAutoSave).toBeNull()
    expect(setEditorDirty).not.toHaveBeenCalled()
  })

  it('脏态防抖：3 秒后落盘 + 创建版本 + 复位 dirty', () => {
    vi.useFakeTimers()
    const createVersion = vi.spyOn(fileStoreActions, 'createVersion').mockReturnValue(undefined)
    const setEditorDirty = vi.fn()
    renderHook(() => useAutoSave({ ...baseOpts, editorDirty: true, setEditorDirty }))
    act(() => { vi.advanceTimersByTime(2000) })
    expect(setEditorDirty).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(1500) })
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(createVersion).toHaveBeenCalledWith('a.tsx', 'const a = 1;', 'auto')
    expect(setEditorDirty).toHaveBeenCalledWith(false)
    createVersion.mockRestore()
  })

  it('编辑持续输入时防抖被重置（fileContentMap 变化重起 3 秒计时）', () => {
    vi.useFakeTimers()
    const setEditorDirty = vi.fn()
    const { rerender } = renderHook(
      (p: Parameters<typeof useAutoSave>[0]) => useAutoSave(p),
      { initialProps: { ...baseOpts, editorDirty: true, setEditorDirty } },
    )
    act(() => { vi.advanceTimersByTime(2500) })
    rerender({ ...baseOpts, fileContentMap: { 'a.tsx': 'const a = 2;' }, editorDirty: true, setEditorDirty })
    act(() => { vi.advanceTimersByTime(2500) })
    expect(setEditorDirty).not.toHaveBeenCalled() // 2.5s < 3s，被重置
    act(() => { vi.advanceTimersByTime(1000) })
    expect(setEditorDirty).toHaveBeenCalledWith(false)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ 'a.tsx': 'const a = 2;' })
  })

  it('无选中文件或空内容时不创建版本，但 dirty 仍复位', () => {
    vi.useFakeTimers()
    const createVersion = vi.spyOn(fileStoreActions, 'createVersion').mockReturnValue(undefined)
    const setEditorDirty = vi.fn()
    renderHook(() => useAutoSave({ ...baseOpts, selectedFile: '', editorCode: '', editorDirty: true, setEditorDirty }))
    act(() => { vi.advanceTimersByTime(3500) })
    expect(createVersion).not.toHaveBeenCalled()
    expect(setEditorDirty).toHaveBeenCalledWith(false)
    createVersion.mockRestore()
  })

  it('工作区仓库存在时：保存触发 writeThrough（逐文件写 LightningFS）', async () => {
    vi.useFakeTimers()
    m.isRepo.mockResolvedValue(true)
    m.writeFile.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave(baseOpts))
    act(() => { vi.advanceTimersByTime(10_000) })
    // writeThrough 为 fire-and-forget promise
    await act(async () => { await Promise.resolve() })
    expect(m.isRepo).toHaveBeenCalled()
    expect(m.writeFile).toHaveBeenCalledWith('a.tsx', 'const a = 1;')
    expect(result.current.lastAutoSave).not.toBeNull()
  })

  it('isRepo 抛错或返回 false 时直通静默忽略（不崩溃）', async () => {
    vi.useFakeTimers()
    m.isRepo.mockRejectedValue(new Error('FS 不可用'))
    const { result } = renderHook(() => useAutoSave(baseOpts))
    act(() => { vi.advanceTimersByTime(10_000) })
    await act(async () => { await Promise.resolve() })
    expect(m.writeFile).not.toHaveBeenCalled()
    expect(result.current.lastAutoSave).not.toBeNull()
  })

  it('useEditorPrefs 返回 prefs 与操作集（sanity：autoSave 开关可切）', () => {
    const { result } = renderHook(() => useEditorPrefs())
    expect(result.current.prefs.autoSave).toBe(true)
    act(() => { editorPrefsStore.update({ autoSave: false }) })
    expect(result.current.prefs.autoSave).toBe(false)
    act(() => { editorPrefsStore.update({ autoSave: true }) })
  })
})
