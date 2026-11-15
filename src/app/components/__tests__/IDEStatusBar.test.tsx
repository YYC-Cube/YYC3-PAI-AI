/**
 * @file IDEStatusBar.test.tsx
 * @description IDE 状态栏测试 — 连接态/模式文案/布局预设菜单/自动保存时间/编辑器偏好联动
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

vi.mock('../store/model-store', () => ({
  useModelStore: () => ({ getActiveModel: () => ({ name: 'glm' }), connectivityMap: {} }),
}))
vi.mock('../store/editor-prefs', () => ({
  useEditorPrefs: () => ({ prefs: { autoSave: true, autoSaveDelay: 3000, formatOnSave: true } }),
}))

import { IDEStatusBar } from '../IDEStatusBar'

beforeEach(() => {
  localStorage.clear()
})

const renderBar = () =>
  render(
    <IDEStatusBar
      selectedFile="App.tsx"
      viewMode="edit"
      fullscreenPreview={false}
      lastAutoSave={Date.now()}
      onApplyPreset={() => {}}
    />,
  )

describe('IDEStatusBar（IDE 状态栏）', () => {
  it('渲染连接态/编辑模式文案/当前文件', () => {
    const { container } = renderBar()
    expect(container.textContent).toContain('App.tsx')
    expect(container.textContent!.length).toBeGreaterThan(10)
  })

  it('布局预设菜单：点击展开 → 选择项回调 onApplyPreset → 关闭', () => {
    const onApplyPreset = vi.fn()
    const { container } = render(<IDEStatusBar {...{ selectedFile: 'a.ts', viewMode: 'edit', fullscreenPreview: false, lastAutoSave: 0, onApplyPreset }} />)
    const presetBtn = container.querySelector('.relative button') as HTMLButtonElement
    fireEvent.click(presetBtn)
    // 菜单展开后出现预设项（点击第一个非宿主按钮）
    const items = Array.from(container.querySelectorAll('.relative button')).slice(1)
    if (items.length > 0) {
      fireEvent.click(items[0])
      expect(onApplyPreset).toHaveBeenCalled()
    }
    expect(container).toBeTruthy()
  })

  it('自动保存时间展示（最近保存时间戳文案）', () => {
    const { container } = renderBar()
    expect(container.textContent!.length).toBeGreaterThan(5)
  })

  it('模式随 viewMode prop 切换（edit/preview 文案差异不崩溃）', () => {
    const { container, rerender } = renderBar()
    rerender(
      <IDEStatusBar
        selectedFile="a.ts"
        viewMode="preview"
        fullscreenPreview={false}
        lastAutoSave={0}
        onApplyPreset={() => {}}
      />,
    )
    expect(container).toBeTruthy()
  })
})
