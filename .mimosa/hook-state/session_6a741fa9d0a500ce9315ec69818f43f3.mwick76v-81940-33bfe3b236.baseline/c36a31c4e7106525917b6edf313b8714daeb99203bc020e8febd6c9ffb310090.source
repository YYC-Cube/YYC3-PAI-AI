/**
 * @file TrackDialogs.test.tsx
 * @description 曲目对话框专项 — 纯受控组件（tokens 由 props 注入，零 mock）：删除确认框空曲目不渲染/确认与取消
 *              /遮罩与卡片点击冒泡隔离、编辑框表单初值/空白名称拒绝提交/去空白与可选艺术家/遮罩关闭
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

import { DeleteConfirmDialog, EditTrackDialog } from '../TrackDialogs'
import type { ThemeTokens } from '../../../store/theme-store'

const tokens: ThemeTokens = {
  primary: '#8b5cf6',
  border: '#333',
  borderDim: '#222',
  cardBg: '#111',
  codeBg: '#1f2937',
  foreground: '#ffffff',
  foregroundMuted: '#9ca3af',
} as ThemeTokens

const track = { id: 't1', name: '云枢光痕', metadata: { artist: '沫语' } }

beforeEach(() => {
  vi.resetAllMocks()
})

describe('DeleteConfirmDialog（删除确认）', () => {
  it('track 为 null → 不渲染（返回 null 契约）', () => {
    const { container } = render(
      <DeleteConfirmDialog track={null} onConfirm={() => {}} onCancel={() => {}} tokens={tokens} />
    )
    expect(container.firstElementChild).toBeNull()
  })

  it('渲染确认文案与曲目名；确认按钮回调 onConfirm、取消按钮回调 onCancel', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(
      <DeleteConfirmDialog track={track} onConfirm={onConfirm} onCancel={onCancel} tokens={tokens} />
    )
    expect(container.textContent).toContain('确认删除歌曲？')
    expect(container.textContent).toContain('云枢光痕')
    expect(container.textContent).toContain('此操作无法撤销')

    const btnByText = (text: string) =>
      Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)!

    fireEvent.click(btnByText('确认删除'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    fireEvent.click(btnByText('取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('点击遮罩 → onCancel；点击卡片内部（stopPropagation）→ 不触发取消', () => {
    const onCancel = vi.fn()
    const { container } = render(
      <DeleteConfirmDialog track={track} onConfirm={() => {}} onCancel={onCancel} tokens={tokens} />
    )
    const overlay = container.firstElementChild as HTMLElement
    const card = overlay.firstElementChild as HTMLElement

    fireEvent.click(card) // 卡片内点击被 stopPropagation 拦截
    expect(onCancel).not.toHaveBeenCalled()

    fireEvent.click(overlay)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('EditTrackDialog（编辑歌曲信息）', () => {
  it('表单初值取自曲目（名称 + 元数据艺术家）', () => {
    const { container } = render(
      <EditTrackDialog track={track} onSave={() => {}} onClose={() => {}} tokens={tokens} />
    )
    const inputs = container.querySelectorAll('input[type="text"]')
    expect((inputs[0] as HTMLInputElement).value).toBe('云枢光痕')
    expect((inputs[1] as HTMLInputElement).value).toBe('沫语')
    expect(container.textContent).toContain('编辑歌曲信息')
    expect(container.textContent).toContain('歌曲名称 *')
  })

  it('清空名称 → 保存按钮禁用且点击不提交；艺术家清空 → 保存回调第二参为 undefined', () => {
    const onSave = vi.fn()
    const { container } = render(
      <EditTrackDialog track={track} onSave={onSave} onClose={() => {}} tokens={tokens} />
    )
    const inputs = container.querySelectorAll('input[type="text"]')
    const name = inputs[0] as HTMLInputElement
    const artist = inputs[1] as HTMLInputElement
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === '保存修改'
    ) as HTMLButtonElement

    fireEvent.change(name, { target: { value: '   ' } })
    expect(saveBtn.disabled).toBe(true)
    fireEvent.click(saveBtn)
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.change(name, { target: { value: '  新名字  ' } })
    fireEvent.change(artist, { target: { value: '' } })
    expect(saveBtn.disabled).toBe(false)
    fireEvent.click(saveBtn)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('新名字', undefined)
  })

  it('名称与艺术家均去空白后提交；点击遮罩/取消按钮 → onClose', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const { container } = render(
      <EditTrackDialog track={track} onSave={onSave} onClose={onClose} tokens={tokens} />
    )
    const inputs = container.querySelectorAll('input[type="text"]')

    fireEvent.change(inputs[0], { target: { value: ' 不懂的董小姐 ' } })
    fireEvent.change(inputs[1], { target: { value: ' 沫言 ' } })
    fireEvent.click(
      Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '保存修改')!
    )
    expect(onSave).toHaveBeenCalledWith('不懂的董小姐', '沫言')

    const overlay = container.firstElementChild as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(
      Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '取消')!
    )
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
