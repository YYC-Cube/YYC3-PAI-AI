/**
 * @file WorkspaceTabs.test.tsx
 * @description 设置·工作区页签专项 — ShortcutsTab（四分组渲染·录制布线·ESC 取消·冲突检测·自定义徽标与单项重置）/
 *              AccountTab（资料回显·用户名/邮箱/简介编辑持久化）/LayoutsTab（空态·保存·列表操作·重命名·导入导出·分享）
 * 策略：真 shortcut-store/settings-store/panel-dnd-store（localStorage 驱动）；无 I18nProvider → t 返回 key；
 *       clipboard 以 Object.defineProperty 注入桩（resetAllMocks 清 matchMedia 桩不涉及）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'

import { ShortcutsTab, AccountTab, LayoutsTab } from '../WorkspaceTabs'
import { themeStore } from '../../../store/theme-store'
import { settingsActions } from '../../../store/settings-store'
import { shortcutStore, eventToShortcut } from '../../../store/shortcut-store'
import { panelDnDActions, type LayoutSnapshot } from '../../../store/panel-dnd-store'

const TK = themeStore.getTokens()

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const btnByTitle = (c: HTMLElement, title: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.getAttribute('title') === title)!

const seedLayout = (over: Partial<LayoutSnapshot> = {}): LayoutSnapshot => ({
  id: 'lay_' + Math.random().toString(36).slice(2, 6),
  name: '我的工作区',
  slots: { left: 'ai-chat', center: 'file-explorer', right: 'code-editor' },
  windows: [],
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 1000,
  ...over,
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  settingsActions.resetSettings()
  shortcutStore.resetAll()
  panelDnDActions.resetAll()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  })
})

describe('WorkspaceTabs · ShortcutsTab（快捷键）', () => {
  it('四个分组与默认快捷键渲染：分组标题 key + 行内 display（⌘ K 等）+ 编辑提示与重置全部按钮', () => {
    const shortcuts = shortcutStore.getState()
    const { container } = render(<ShortcutsTab tk={TK} shortcuts={shortcuts} setShortcut={vi.fn()} />)
    expect(container.textContent).toContain('catGeneral')
    expect(container.textContent).toContain('catEditor')
    expect(container.textContent).toContain('catPanels')
    expect(container.textContent).toContain('catAI')
    expect(container.textContent).toContain('editHint')
    expect(container.textContent).toContain('resetAll')
    expect(container.textContent).toContain('⌘ K')
    expect(container.textContent).toContain('⌘ Shift T')
    expect(container.textContent).toContain('Esc')
  })

  it('录制布线：点击条目进入 recording 态；按下 Ctrl+K → eventToShortcut 解析并回调 setShortcut；ESC 取消录制', () => {
    const setShortcut = vi.fn()
    const { container } = render(<ShortcutsTab tk={TK} shortcuts={shortcutStore.getState()} setShortcut={setShortcut} />)
    // 点击「⌘ K」条目的编辑按钮进入录制
    const editBtn = btnByText(container, '⌘ K')
    fireEvent.click(editBtn)
    expect(container.textContent).toContain('recording')
    // 仅修饰键按下 → eventToShortcut 返回 null，仍在录制
    fireEvent.keyDown(window, { key: 'Control', ctrlKey: true })
    expect(container.textContent).toContain('recording')
    // Ctrl+K → 解析为 mod+k
    const parsed = eventToShortcut({ key: 'k', ctrlKey: true } as KeyboardEvent)
    expect(parsed).toEqual({ internal: 'mod+k', display: '⌘ K' })
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(setShortcut).toHaveBeenCalledTimes(1)
    expect(setShortcut.mock.calls[0][0]).toBe('commandPalette')
    expect(setShortcut.mock.calls[0][1]).toEqual({ internal: 'mod+k', display: '⌘ K' })
    expect(container.textContent).not.toContain('recording')

    // ESC 分支（首次录制后行按钮被重建，须重新查询再点击）
    fireEvent.click(btnByText(container, '⌘ K'))
    expect(container.textContent).toContain('recording')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.textContent).not.toContain('recording')
    // 49号已修：录制态按 Esc 直接取消录制，不再把 Esc 记为绑定（setShortcut 仅第 1 次的 mod+k）
    expect(setShortcut).toHaveBeenCalledTimes(1)
    expect(setShortcut.mock.calls.every((c: unknown[]) => (c[1] as { internal: string }).internal !== 'escape')).toBe(true)
  })

  it('冲突检测：传入共享 internal 绑定的 shortcuts → 冲突横幅（count=1）+ conflictWith 徽标；resetAll 清空 overrides', () => {
    const conflicting = {
      save: { internal: 'mod+s', display: '⌘ S' },
      openGitPanel: { internal: 'mod+s', display: '⌘ S' },
    }
    const { container } = render(<ShortcutsTab tk={TK} shortcuts={conflicting} setShortcut={vi.fn()} />)
    expect(container.textContent).toContain('conflictsFound')
    expect(container.textContent).toContain('conflictWith')
    // 真 store resetAll 落盘空 overrides
    fireEvent.click(btnByText(container, 'resetAll'))
    expect(JSON.parse(localStorage.getItem('yyc3_shortcut_overrides') || '{}')).toEqual({})
  })

  it('自定义徽标与单项重置：store 设置 override 后行内出现 customized key + reset 按钮', () => {
    shortcutStore.set('save', { internal: 'mod+alt+s', display: '⌘ Alt S' })
    const { container } = render(<ShortcutsTab tk={TK} shortcuts={shortcutStore.getState()} setShortcut={vi.fn()} />)
    expect(container.textContent).toContain('customized')
    expect(container.textContent).toContain('⌘ Alt S')
    // 单项重置
    fireEvent.click(btnByTitle(container, 'reset'))
    expect(shortcutStore.isCustom('save')).toBe(false)
    expect(container.textContent).toContain('⌘ S')
  })
})

describe('WorkspaceTabs · AccountTab（账户）', () => {
  it('资料回显与编辑：默认 Operator/邮箱回退值；输入用户名/邮箱/简介 → 真 store 持久化', () => {
    const { container } = render(<AccountTab tk={TK} />)
    expect(container.textContent).toContain('accountTitle')
    expect(container.textContent).toContain('Operator')
    expect(container.textContent).toContain('admin@0379.email')
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    expect(inputs).toHaveLength(2)
    fireEvent.change(inputs[0], { target: { value: '夜雨' } })
    fireEvent.change(inputs[1], { target: { value: 'yanyu@0379.email' } })
    const ta = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: '全栈工程师' } })
    const snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.userProfile.username).toBe('夜雨')
    expect(snap.userProfile.email).toBe('yanyu@0379.email')
    expect(snap.userProfile.bio).toBe('全栈工程师')
    // 无头像 → User 图标占位
    expect(container.querySelector('.lucide-user')).toBeTruthy()
  })
})

describe('WorkspaceTabs · LayoutsTab（布局管理）', () => {
  it('空态：noSavedLayouts key；保存按钮空名禁用；导出全部禁用；云同步后出现上次同步横幅', async () => {
    const { container } = render(<LayoutsTab tk={TK} />)
    expect(container.textContent).toContain('layoutManager')
    expect(container.textContent).toContain('noSavedLayouts')
    expect(container.textContent).toContain('layoutSaved (0)')
    const saveBtn = btnByText(container, 'save')
    expect(saveBtn.hasAttribute('disabled')).toBe(true)
    expect(btnByText(container, 'layoutExportAll').hasAttribute('disabled')).toBe(true)
    // 云同步（无布局 → 立即完成）
    fireEvent.click(btnByText(container, 'syncCloud'))
    await waitFor(() => expect(container.textContent).toContain('layoutLastSync'))
    expect(panelDnDActions.getState().layoutSync.lastCloudSyncTime).not.toBeNull()
  })

  it('保存与列表操作：输入名称保存 → 列表渲染（名称/slots 串）；加载/覆盖/删除/导出按钮布线', () => {
    const { container } = render(<LayoutsTab tk={TK} />)
    const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '深度工作区' } })
    fireEvent.keyDown(nameInput, { key: 'Enter' })
    expect(container.textContent).toContain('layoutSaved (1)')
    expect(container.textContent).toContain('深度工作区')
    // slots 串
    expect(container.textContent).toContain('ai-chat/file-explorer/code-editor')
    // 加载
    fireEvent.click(btnByText(container, 'layoutLoad'))
    expect(panelDnDActions.getState().slotContent.left).toBe('ai-chat')
    // 覆盖（overwrite）
    fireEvent.click(btnByTitle(container, 'layoutOverwrite'))
    expect(panelDnDActions.listLayouts()).toHaveLength(1)
    // 删除（deleteLayout 仅落盘不 emitChange → 以 resetAll 驱动一次重渲染后 UI 才反映）
    fireEvent.click(container.querySelector('.lucide-trash-2')!.closest('button')!)
    act(() => { panelDnDActions.resetAll() })
    expect(container.textContent).toContain('noSavedLayouts')
    expect(panelDnDActions.listLayouts()).toHaveLength(0)
  })

  it('重命名：Edit3 进入行内输入 → 回车提交 → listLayouts 名称更新', () => {
    localStorage.setItem('yyc3-panel-layouts', JSON.stringify([seedLayout({ id: 'lay_r', name: '旧名' })]))
    const { container } = render(<LayoutsTab tk={TK} />)
    fireEvent.click(container.querySelector('.lucide-pen-line')!.closest('button')!)
    // 行内重命名输入框回显旧名（页面顶部另有「保存新布局」输入框，须按值定位）
    const renameInput = Array.from(container.querySelectorAll('input')).find(
      i => (i as HTMLInputElement).value === '旧名',
    ) as HTMLInputElement
    expect(renameInput).toBeTruthy()
    fireEvent.change(renameInput, { target: { value: '新名' } })
    fireEvent.keyDown(renameInput, { key: 'Enter' })
    expect(panelDnDActions.listLayouts()[0].name).toBe('新名')
    expect(container.textContent).toContain('新名')
    // ESC 分支：退出重命名态且不改名
    fireEvent.click(container.querySelector('.lucide-pen-line')!.closest('button')!)
    const escInput = Array.from(container.querySelectorAll('input')).find(
      i => (i as HTMLInputElement).value === '新名',
    ) as HTMLInputElement
    fireEvent.keyDown(escInput, { key: 'Escape' })
    expect(container.textContent).toContain('新名') // 回到展示态
  })

  it('JSON 导入：合法单布局 → 成功提示；非法 JSON → layoutImportFailed key；批量数组 → imported 计数', () => {
    const { container } = render(<LayoutsTab tk={TK} />)
    const importInput = Array.from(container.querySelectorAll('input[type="text"]')).pop() as HTMLInputElement
    // 非法 JSON → 组件透出 store 的原始解析错误
    fireEvent.change(importInput, { target: { value: 'not-json{{' } })
    fireEvent.click(btnByText(container, 'import'))
    expect(container.textContent).toContain('is not valid JSON')
    // 合法单布局
    fireEvent.change(importInput, {
      target: { value: JSON.stringify({ name: '导入布局', slots: { left: 'terminal', center: 'preview', right: 'code-editor' } }) },
    })
    fireEvent.click(btnByText(container, 'import'))
    expect(container.textContent).toContain('已导入: 导入布局')
    expect(panelDnDActions.listLayouts()).toHaveLength(1)
    // 批量数组（先清空避免叠加）
    panelDnDActions.resetAll()
    localStorage.setItem('yyc3-panel-layouts', '[]')
    fireEvent.change(importInput, {
      target: {
        value: JSON.stringify([
          { name: '批量A', slots: { left: 'ai-chat', center: 'file-explorer', right: 'code-editor' } },
          { name: '批量B', slots: { left: 'preview', center: 'preview', right: 'preview' } },
        ]),
      },
    })
    fireEvent.click(btnByText(container, 'import'))
    expect(container.textContent).toContain('已导入 2 个布局')
    expect(panelDnDActions.listLayouts()).toHaveLength(2)
  })

  it('导出：导出全部与单布局导出走 Blob 下载（createObjectURL 桩）；导入失败路径与空导出守卫', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock-x'),
      writable: true,
      configurable: true,
    })
    const revoke = vi.fn()
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, writable: true, configurable: true })
    // 直接桩掉 <a> 原型 click（setup.ts 已 spy createElement，二次 spy 会自递归）
    const clickSpy = vi.fn()
    const origAnchorClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { clickSpy() }
    const { container, unmount } = render(<LayoutsTab tk={TK} />)
    // 空列表导出全部禁用（守卫分支）
    expect(btnByText(container, 'layoutExportAll').hasAttribute('disabled')).toBe(true)
    // 保存一个布局 → 导出全部可用
    const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '导出布局' } })
    fireEvent.click(btnByText(container, 'save'))
    fireEvent.click(btnByText(container, 'layoutExportAll'))
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledTimes(1)
    // 单布局导出（Download 图标按钮在行操作区，最后一个）
    const exportOne = Array.from(container.querySelectorAll('button')).find(
      b => b.querySelector('.lucide-download') && !b.textContent!.includes('layoutExportAll'),
    )!
    fireEvent.click(exportOne)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
    unmount()
    HTMLAnchorElement.prototype.click = origAnchorClick
  })

  it('文件导入：隐藏 file input 走 FileReader → 50ms 后自动导入成功', async () => {
    const { container } = render(<LayoutsTab tk={TK} />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()
    const file = new File(
      [JSON.stringify({ name: '文件布局', slots: { left: 'preview', center: 'code-editor', right: 'terminal' } })],
      'layout.json',
      { type: 'application/json' },
    )
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fireEvent.change(fileInput)
    await waitFor(() => expect(panelDnDActions.listLayouts()).toHaveLength(1), { timeout: 3000 })
    await waitFor(() => expect(container.textContent).toContain('已导入: 文件布局'), { timeout: 3000 })
  })

  it('布局缩略图：hover 展开三栏全名详情面板（AI 助手/文件浏览/代码编辑）', () => {
    localStorage.setItem('yyc3-panel-layouts', JSON.stringify([seedLayout({ id: 'lay_thumb' })]))
    const { container } = render(<LayoutsTab tk={TK} />)
    const thumb = container.querySelector('.shrink-0.relative') as HTMLElement
    expect(thumb).toBeTruthy()
    // hover 前无详情面板
    expect(container.textContent).not.toContain('AI 助手')
    fireEvent.mouseEnter(thumb)
    expect(container.textContent).toContain('AI 助手')
    expect(container.textContent).toContain('文件浏览')
    expect(container.textContent).toContain('代码编辑')
    expect(container.textContent).toContain('左:')
    fireEvent.mouseLeave(thumb)
    expect(container.textContent).not.toContain('AI 助手')
  })

  it('同步冲突：importCloudLayout 制造未解决冲突 → 冲突区块渲染；保留本地/使用云端布线', () => {
    localStorage.setItem('yyc3-panel-layouts', JSON.stringify([seedLayout({ id: 'lay_c' })]))
    act(() => {
      panelDnDActions.importCloudLayout({
        id: 'cloud_lay_c',
        name: '我的工作区 (Cloud)',
        slots: { left: 'terminal', center: 'preview', right: 'code-editor' },
        windows: [],
        createdAt: Date.now(),
        updatedAt: Date.now() + 5000, // 云端较新 → 产生冲突
      })
    })
    const { container } = render(<LayoutsTab tk={TK} />)
    expect(container.textContent).toContain('1 个同步冲突')
    expect(container.textContent).toContain('layoutKeepLocal')
    expect(container.textContent).toContain('layoutUseCloud')
    // 保留本地 → 冲突解除后区块消失
    fireEvent.click(btnByText(container, 'layoutKeepLocal'))
    expect(panelDnDActions.getState().layoutSync.conflicts.every(c => c.resolved)).toBe(true)
    expect(container.textContent).not.toContain('个同步冲突')
  })

  it('分享按钮：generateShareURL 生成链接并写入剪贴板，按钮 title 切为已复制', async () => {
    localStorage.setItem('yyc3-panel-layouts', JSON.stringify([seedLayout({ id: 'lay_share' })]))
    const { container } = render(<LayoutsTab tk={TK} />)
    const shareBtn = btnByTitle(container, 'layoutShareCopy')
    expect(shareBtn).toBeTruthy()
    await act(async () => { fireEvent.click(shareBtn) })
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    const url = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('#yyc3-layout=')
    await waitFor(() => expect(btnByTitle(container, 'layoutShareCopied')).toBeTruthy())
  })

  it('分享回退：剪贴板写入被拒时走 execCommand 隐藏输入框路径，仍提示已复制', async () => {
    localStorage.setItem('yyc3-panel-layouts', JSON.stringify([seedLayout({ id: 'lay_fb' })]))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      writable: true,
      configurable: true,
    })
    // jsdom 未实现 execCommand（catch 路径内调用会抛错），注入空桩
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(true), writable: true, configurable: true })
    const { container } = render(<LayoutsTab tk={TK} />)
    await act(async () => { fireEvent.click(btnByTitle(container, 'layoutShareCopy')) })
    await waitFor(() => expect(btnByTitle(container, 'layoutShareCopied')).toBeTruthy())
  })
})
