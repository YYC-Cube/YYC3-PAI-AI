/**
 * @file PanelDropZone.deep.test.tsx
 * @description 面板拖拽区域专项深化 — 槽位徽章（L/C/R）/拖拽事件布线（startDrag/hoverSlot/completeDrop/cancelDrag）/
 *              跨窗口拖拽（detachedWindows → startCrossDragFromSlot/hoverCrossTarget/completeCrossDrop）/
 *              分离窗口按钮/内联选择器（内容切换·重置·保存布局·加载布局·删除布局·云同步）/i18n 无 Provider 回退 key
 * 策略：真 panel-dnd-store（模块级 store + resetAll 测试钩子）+ 真 theme-store；无 I18nProvider → t 返回 key
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'

import { PanelDropZone } from '../PanelDropZone'
import { panelDnDActions, PANEL_CONTENT_MAP, type LayoutSnapshot } from '../../store/panel-dnd-store'

// ── Helpers ──

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const badgeBtn = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').trim().startsWith('L'))!

/** dataTransfer 桩：fireEvent 事件上直接挂属性 */
const dt = () => ({
  effectAllowed: '',
  dropEffect: '',
  setData: vi.fn(),
  setDragImage: vi.fn(),
})

const seedLayout = (over: Partial<LayoutSnapshot> = {}): LayoutSnapshot => ({
  id: 'lay_' + Math.random().toString(36).slice(2, 6),
  name: '深度工作区',
  slots: { left: 'terminal', center: 'code-editor', right: 'preview' },
  windows: [],
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 1000,
  ...over,
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  panelDnDActions.resetAll()
})

describe('PanelDropZone（面板拖拽区域）', () => {
  it('渲染骨架：拖拽手柄/槽位徽章 L/tooltip key（i18n 无 Provider 回退）/分离窗口按钮', () => {
    const { container } = render(<PanelDropZone slot="left" />)
    expect(container.querySelector('.lucide-grip-vertical')).toBeTruthy()
    expect(container.querySelector('.lucide-external-link')).toBeTruthy()
    // 槽位徽章显示 L
    expect(badgeBtn(container).textContent).toContain('L')
    // CyberTooltip 文案：t('ide','dragToSwap') 回退为 key；徽章 title 属性
    expect(container.textContent).toContain('dragToSwap')
    expect(container.textContent).toContain('detachWindow')
    expect(badgeBtn(container).getAttribute('title')).toBe('panelContent')
  })

  it('拖拽事件布线：dragStart 记录来源并设置 dataTransfer；dragOver 悬停；drop 完成交换；dragEnd 取消', () => {
    const { container } = render(<PanelDropZone slot="left" />)
    const root = container.firstElementChild as HTMLElement
    const dataTr = dt()
    fireEvent.dragStart(root, { dataTransfer: dataTr })
    let st = panelDnDActions.getState()
    expect(st.isDragging).toBe(true)
    expect(st.dragSource).toBe('left')
    expect(dataTr.effectAllowed).toBe('move')
    expect(dataTr.setData).toHaveBeenCalledWith('text/plain', 'left')
    // dragOver：先在 left（自身），再切到 center
    fireEvent.dragOver(root, { dataTransfer: dt() })
    expect(panelDnDActions.getState().dropTarget).toBe('left')
    const centerZone = render(<PanelDropZone slot="center" />)
    fireEvent.dragOver(centerZone.container.firstElementChild as HTMLElement, { dataTransfer: dt() })
    expect(panelDnDActions.getState().dropTarget).toBe('center')
    // drop → 交换 left/center 内容
    fireEvent.drop(centerZone.container.firstElementChild as HTMLElement, { dataTransfer: dt() })
    st = panelDnDActions.getState()
    expect(st.isDragging).toBe(false)
    expect(st.slotContent.left).toBe('file-explorer')
    expect(st.slotContent.center).toBe('ai-chat')
    // dragEnd → cancelDrag 复位
    fireEvent.dragEnd(root)
    expect(panelDnDActions.getState().dragSource).toBeNull()
  })

  it('拖拽悬停高亮：isDropTarget 时显示覆盖层提示（dropToSwap），取消拖拽后消失', async () => {
    const left = render(<PanelDropZone slot="left" />)
    const center = render(<PanelDropZone slot="center" />)
    fireEvent.dragStart(left.container.firstElementChild as HTMLElement, { dataTransfer: dt() })
    fireEvent.dragOver(center.container.firstElementChild as HTMLElement, { dataTransfer: dt() })
    expect(center.container.textContent).toContain('dropToSwap')
    // 拖拽来源手柄仍在（canDrop 着色分支）
    expect(left.container.querySelector('.lucide-grip-vertical')).toBeTruthy()
    panelDnDActions.cancelDrag()
    await waitFor(() => expect(center.container.textContent).not.toContain('dropToSwap'))
  })

  it('跨窗口拖拽：存在分离窗口时 dragStart 同时进入跨拖拽，dragOver/drop 走 cross 分支', () => {
    panelDnDActions.detachWindow('center') // 制造 detachedWindows
    const { container } = render(<PanelDropZone slot="left" />)
    const root = container.firstElementChild as HTMLElement
    fireEvent.dragStart(root, { dataTransfer: dt() })
    expect(panelDnDActions.getState().isCrossDragging).toBe(true)
    fireEvent.dragOver(root, { dataTransfer: dt() })
    const crossTarget = panelDnDActions.getState().crossDropTarget
    expect(crossTarget).toEqual({ type: 'slot', slot: 'left' })
    // dragLeave 清除跨拖拽悬停
    fireEvent.dragLeave(root)
    expect(panelDnDActions.getState().crossDropTarget).toBeNull()
    // drop → completeCrossDrop（窗口内容落到槽位）后 dragEnd 复位
    fireEvent.drop(root, { dataTransfer: dt() })
    expect(panelDnDActions.getState().isCrossDragging).toBe(false)
  })

  it('分离窗口按钮：点击 detach → detachedWindows +1（带 stopPropagation）', () => {
    const { container } = render(<PanelDropZone slot="right" />)
    fireEvent.click(container.querySelector('.lucide-external-link')!.closest('button')!)
    const st = panelDnDActions.getState()
    expect(st.detachedWindows).toHaveLength(1)
    expect(st.detachedWindows[0].sourceSlot).toBe('right')
    expect(st.detachedWindows[0].contentType).toBe('code-editor')
  })

  it('徽章点击与右键打开内联选择器：五个内容类型 key 全渲染，点选后 setSlotContent 生效并关闭；重置布局回默认', async () => {
    const { container } = render(<PanelDropZone slot="left" />)
    // 右键打开
    fireEvent.contextMenu(container.firstElementChild as HTMLElement)
    const labelKeys = Object.values(PANEL_CONTENT_MAP).map(cfg => cfg.labelKey)
    expect(labelKeys).toHaveLength(5)
    for (const key of labelKeys) {
      expect(container.textContent).toContain(key)
    }
    // 点击 codeView 切换槽位内容
    fireEvent.click(btnByText(container, 'codeView'))
    expect(panelDnDActions.getState().slotContent.left).toBe('code-editor')
    // 选择后选择器关闭（AnimatePresence 退出动画结束后 key 文案消失）
    await waitFor(() => expect(container.textContent).not.toContain('resetLayout'))
    // 徽章点击再次打开
    fireEvent.click(badgeBtn(container))
    expect(container.textContent).toContain('resetLayout')
    // 重置布局 → 回默认槽位内容并关闭
    fireEvent.click(btnByText(container, 'resetLayout'))
    expect(panelDnDActions.getState().slotContent.left).toBe('ai-chat')
    await waitFor(() => expect(container.textContent).not.toContain('resetLayout'))
  })

  it('保存布局：save 视图输入名称回车保存 → listLayouts 持久化；空名保存按钮禁用', () => {
    const { container } = render(<PanelDropZone slot="left" />)
    fireEvent.contextMenu(container.firstElementChild as HTMLElement)
    fireEvent.click(btnByText(container, 'saveLayout'))
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(input).toBeTruthy()
    // 空名 → 禁用
    expect(btnByText(container, 'save').hasAttribute('disabled')).toBe(true)
    fireEvent.change(input, { target: { value: '  主工作区  ' } })
    expect(btnByText(container, 'save').hasAttribute('disabled')).toBe(false)
    fireEvent.keyDown(input, { key: 'Enter' })
    const layouts = panelDnDActions.listLayouts()
    expect(layouts).toHaveLength(1)
    expect(layouts[0].name).toBe('主工作区')
    expect(layouts[0].slots.left).toBe('ai-chat')
    // 保存成功后回到 main 视图
    expect(container.textContent).toContain('saveLayout') // main 视图中仍有「保存布局」入口
  })

  it('加载布局视图：seed 布局渲染名称；__autosave__ 被过滤；点选加载并关闭；垃圾桶删除布局；无布局显示空态 key', () => {
    localStorage.setItem(
      'yyc3-panel-layouts',
      JSON.stringify([
        seedLayout({ id: 'lay_a', name: '深度工作区' }),
        seedLayout({ id: 'lay_auto', name: '__autosave__' }),
      ]),
    )
    const { container } = render(<PanelDropZone slot="left" />)
    fireEvent.contextMenu(container.firstElementChild as HTMLElement)
    fireEvent.click(btnByText(container, 'loadLayout'))
    // __autosave__ 过滤；真实布局渲染
    expect(container.textContent).toContain('深度工作区')
    expect(container.textContent).not.toContain('__autosave__')
    // 加载 → loadLayout 布线 + 关闭
    fireEvent.click(btnByText(container, '深度工作区'))
    expect(panelDnDActions.getState().slotContent.left).toBe('terminal')
    // 再次打开：AnimatePresence 子组件同 key 复用，仍停留在 load 视图（1 条布局）
    fireEvent.contextMenu(container.firstElementChild as HTMLElement)
    // 行内删除是 motion.div（非 button），closest('button') 会误中行按钮触发 loadLayout
    fireEvent.click(container.querySelector('.lucide-trash-2')!)
    // deleteLayout 仅落盘不 emitChange → 需一次 store 更新驱动重渲染后 UI 才反映删除
    expect(panelDnDActions.listLayouts()).toHaveLength(1) // 仅剩 __autosave__
    act(() => { panelDnDActions.resetAll() })
    expect(container.textContent).toContain('noSavedLayouts')
  })

  it('云同步按钮：无布局时 syncAllToCloud 立即完成并更新 lastCloudSyncTime；同步中文案切换 syncing key', async () => {
    const { container } = render(<PanelDropZone slot="left" />)
    fireEvent.contextMenu(container.firstElementChild as HTMLElement)
    expect(panelDnDActions.getState().layoutSync.lastCloudSyncTime).toBeNull()
    fireEvent.click(btnByText(container, 'syncCloud'))
    // 同步进行中文案（无 i18n Provider → key）
    expect(container.textContent).toContain('syncing')
    await waitFor(() =>
      expect(panelDnDActions.getState().layoutSync.lastCloudSyncTime).not.toBeNull(),
    )
    await waitFor(() => expect(container.textContent).toContain('syncCloud'))
    expect(panelDnDActions.getState().layoutSync.cloudLayoutCount).toBe(0)
  })
})
