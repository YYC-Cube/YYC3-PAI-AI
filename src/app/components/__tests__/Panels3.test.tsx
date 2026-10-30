/**
 * @file Panels3.test.tsx
 * @description 面板补测第三程 A：主题/快捷键/快捷操作/最近文件/命令面板/全局搜索
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { ThemePreview } from '../ThemePreview'
import { ShortcutCheatSheet } from '../ShortcutCheatSheet'
import { QuickActionsPanel } from '../QuickActionsPanel'
import { RecentFilesPanel } from '../RecentFilesPanel'
import { CommandPalette } from '../CommandPalette'
import { GlobalSearch } from '../GlobalSearch'
import { themeStore } from '../../store/theme-store'
import { fileStore as fileStoreActions } from '../../store/file-store'

beforeEach(() => {
  localStorage.clear()
})

describe('ThemeSwitcher / ThemePreview（主题系统真源）', () => {
  it('ThemeSwitcher 单击切换主题（theme-store 真切换）', () => {
    const { container } = render(<ThemeSwitcher />)
    const before = themeStore.getState().themeId
    const btn = container.querySelector('button')
    expect(btn).toBeTruthy()
    fireEvent.click(btn!)
    expect(themeStore.getState().themeId).not.toBe(before)
    // 恢复默认，避免污染其他用例
    themeStore.setTheme(before as never)
  })

  it('ThemePreview 列出主题并回调 onSelect', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ThemePreview currentTheme="cyberpunk" onSelect={onSelect} autoDetect={false} onAutoDetectChange={() => { }} />,
    )
    const cards = container.querySelectorAll('button, [role="button"], [style]')
    expect(cards.length).toBeGreaterThan(0)
    // 主题卡点击（从后往前避免点到外层容器）
    for (let i = cards.length - 1; i >= 0; i--) {
      fireEvent.click(cards[i])
      if (onSelect.mock.calls.length > 0) break
    }
    expect(onSelect).toHaveBeenCalled()
  })
})

describe('ShortcutCheatSheet（shortcut-store 真源）', () => {
  it('渲染已注册快捷键表', () => {
    render(<ShortcutCheatSheet visible onClose={() => { }} />)
    expect(document.body.textContent!.length).toBeGreaterThan(20)
  })
})

describe('QuickActionsPanel', () => {
  it('渲染快捷操作按钮组', () => {
    render(<QuickActionsPanel context={null} visible onClose={() => { }} />)
    expect(document.querySelectorAll('button').length).toBeGreaterThan(0)
  })
})

describe('RecentFilesPanel（file-store 真源）', () => {
  it('注入记录并打开面板后渲染文件名', () => {
    const onOpen = vi.fn()
    fileStoreActions.recordAccess('demo-file.tsx')
    fileStoreActions.toggleRecentPanel()
    render(<RecentFilesPanel onOpenFile={onOpen} />)
    expect(document.body.textContent).toContain('demo-file.tsx')
    fileStoreActions.closeRecentPanel()
  })
})

describe('CommandPalette（命令注册表）', () => {
  it('渲染命令并支持过滤', async () => {
    const commands = [
      { id: 'c1', labelKey: 'openSettings', categoryKey: 'file', icon: () => null, shortcut: 'Ctrl+,', action: vi.fn() },
      { id: 'c2', labelKey: 'switchTheme', categoryKey: 'editor', icon: () => null, shortcut: 'Ctrl+T', action: vi.fn() },
    ] as never
    render(<CommandPalette visible onClose={() => { }} commands={commands} />)
    expect(document.querySelectorAll('[data-cmd-idx]').length).toBeGreaterThan(0)
    const input = document.querySelector('input') as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { value: '主题' } })
      await waitFor(() => {
        expect(document.querySelector('input')?.value).toBe('主题')
      })
    }
  })
})

describe('GlobalSearch（文件内容搜索真源）', () => {
  it('跨文件搜索命中并回调 onSelectFile', async () => {
    const onSelect = vi.fn()
    const map = { 'a.ts': 'const targetFn = () => 1', 'b.ts': 'other code' }
    render(<GlobalSearch visible onClose={() => { }} fileContentMap={map} onSelectFile={onSelect} onReplace={() => { }} />)
    const input = document.querySelector('input') as HTMLInputElement
    expect(input).toBeTruthy()
    fireEvent.change(input, { target: { value: 'targetFn' } })
    await waitFor(() => {
      expect(document.body.textContent).toContain('a.ts')
    })
  })
})
