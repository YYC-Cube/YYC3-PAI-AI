/**
 * @file SelfMediaEditor.deep.test.tsx
 * @description 自媒体编辑器专项深化 — RichTextEditor 受控内容流(OnChange 接线)/字符计数/
 *              三大动作按钮(panelActions 注入)/导出下载管线(Blob+createObjectURL+anchor)/无 Provider 降级
 * @note RichTextEditor 以 vi.hoisted 受控桩替换（回显 div + 暴露 lastOnChange 供用例注入内容）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { SelfMediaEditor } from '../SelfMediaEditor'
import { SelfMediaStoreProvider, useSelfMediaStore, type PanelActions } from '../../store/self-media-store'

// ===== RichTextEditor 受控桩（工厂引用外部值 → vi.hoisted 提升）=====
const rte = vi.hoisted(() => {
  const state = {
    lastOnChange: null as null | ((html: string) => void),
    mounts: [] as Array<{ minHeight?: string; maxHeight?: string; enableAI?: boolean }>,
  }
  const Stub = (props: { onChange?: (html: string) => void; minHeight?: string; maxHeight?: string; enableAI?: boolean }) => {
    state.lastOnChange = props.onChange ?? null
    state.mounts.push({ minHeight: props.minHeight, maxHeight: props.maxHeight, enableAI: props.enableAI })
    return <div data-testid="rte-stub">富文本桩</div>
  }
  return { state, Stub }
})
vi.mock('../RichTextEditor', () => ({ RichTextEditor: rte.Stub }))

// ===== jsdom 缺 URL.createObjectURL：以可断言桩补齐 =====
let anchorClickSpy: ReturnType<typeof vi.spyOn> | null = null

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:editor-test')
  URL.revokeObjectURL = vi.fn()
  anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })
})

afterEach(() => {
  anchorClickSpy?.mockRestore()
  anchorClickSpy = null
})

/** 把 panelActions 注入 Provider（生产由 App.tsx setPanelActions）*/
function InjectActions({ actions }: { actions: PanelActions }) {
  const { setPanelActions } = useSelfMediaStore()
  const ref = useRef(actions)
  ref.current = actions
  useEffect(() => { setPanelActions(ref.current) }, [setPanelActions])
  return null
}

const makeActions = (): PanelActions => ({
  openAIWriting: vi.fn(),
  openMaterialManager: vi.fn(),
  openContentPreview: vi.fn(),
  openEditor: vi.fn(),
  openPublishQueue: vi.fn(),
  openTrendingTopics: vi.fn(),
})

const mountWithActions = () => {
  const actions = makeActions()
  const onClose = vi.fn()
  const utils = render(
    <SelfMediaStoreProvider>
      <InjectActions actions={actions} />
      <SelfMediaEditor visible onClose={onClose} />
    </SelfMediaStoreProvider>,
  )
  return { actions, onClose, ...utils }
}

/** 经受控桩注入内容（模拟用户编辑） */
const typeContent = (html: string) => act(() => { rte.state.lastOnChange?.(html) })

describe('SelfMediaEditor 框架与内容流', () => {
  it('visible=false → null；打开渲染标题与关闭按钮 → onClose', () => {
    const onClose = vi.fn()
    const { container, rerender } = render(<SelfMediaEditor visible={false} onClose={onClose} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<SelfMediaEditor visible onClose={onClose} />)
    expect(container.textContent).toContain('自媒体内容编辑器')
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('RichTextEditor 以 minHeight/maxHeight/enableAI 挂载且 onChange 完成接线', () => {
    mountWithActions()
    const last = rte.state.mounts[rte.state.mounts.length - 1]!
    expect(last).toMatchObject({ minHeight: '100%', maxHeight: '100%', enableAI: true })
    expect(typeof rte.state.lastOnChange).toBe('function')
  })

  it('内容流：初始空文档 → 注入 HTML 后字符计数联动，导出/预览/发布由禁用转可用', () => {
    const { container } = mountWithActions()
    expect(container.textContent).toContain('空文档')
    const exportBtn = container.querySelector<HTMLButtonElement>('[title="导出 HTML"]')!
    const previewBtn = container.querySelector<HTMLButtonElement>('[title="预览内容"]')!
    const publishBtn = container.querySelector<HTMLButtonElement>('[title="发送到发布队列"]')!
    expect(exportBtn.disabled).toBe(true)
    expect(previewBtn.disabled).toBe(true)
    expect(publishBtn.disabled).toBe(true)

    const html = '<p>自媒体内容甲</p>'
    typeContent(html)
    expect(container.textContent).toContain(`${html.length} 字符`)
    expect(exportBtn.disabled).toBe(false)
    expect(previewBtn.disabled).toBe(false)
    expect(publishBtn.disabled).toBe(false)
  })
})

describe('SelfMediaEditor 动作按钮布线（panelActions 注入）', () => {
  it('预览按钮 → openContentPreview({ content, title })', () => {
    const { actions, container } = mountWithActions()
    const html = '<p>预览内容甲</p>'
    typeContent(html)
    fireEvent.click(container.querySelector('[title="预览内容"]')!)
    expect(actions.openContentPreview).toHaveBeenCalledWith({ content: html, title: '编辑器内容' })
  })

  it('发布按钮 → openPublishQueue({ content, title })', () => {
    const { actions, container } = mountWithActions()
    const html = '<p>发布内容甲</p>'
    typeContent(html)
    fireEvent.click(container.querySelector('[title="发送到发布队列"]')!)
    expect(actions.openPublishQueue).toHaveBeenCalledWith({ content: html, title: '编辑器内容' })
  })

  it('AI 写作按钮 → openAIWriting({ topic })（空内容亦可用）', () => {
    const { actions, container } = mountWithActions()
    fireEvent.click(container.querySelector('[title="AI写作助手"]')!)
    expect(actions.openAIWriting).toHaveBeenCalledWith({ topic: '继续当前编辑内容...' })
  })
})

describe('SelfMediaEditor 导出管线', () => {
  it('导出：Blob URL 创建 + anchor 点击 + revoke，按钮态变「已导出 ✓」', () => {
    const { container } = mountWithActions()
    typeContent('<p>导出内容甲</p>')
    const exportBtn = container.querySelector<HTMLButtonElement>('[title="导出 HTML"]')!
    fireEvent.click(exportBtn)

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:editor-test')
    expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    expect(exportBtn.textContent).toContain('已导出')
  })

  it('导出后继续编辑 → saved 复位为「导出 HTML」（handleChange 重置保存态）', () => {
    const { container } = mountWithActions()
    typeContent('<p>再次编辑甲</p>')
    const exportBtn = container.querySelector<HTMLButtonElement>('[title="导出 HTML"]')!
    fireEvent.click(exportBtn)
    expect(exportBtn.textContent).toContain('已导出')

    typeContent('<p>再次编辑乙</p>')
    expect(exportBtn.textContent).not.toContain('已导出')
    expect(container.textContent).toContain('<p>再次编辑乙</p>'.length + ' 字符')
  })

  it('空内容导出走禁用态：不创建 Blob URL、不触发下载', () => {
    const { container } = mountWithActions()
    const exportBtn = container.querySelector<HTMLButtonElement>('[title="导出 HTML"]')!
    expect(exportBtn.disabled).toBe(true)
    fireEvent.click(exportBtn)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(anchorClickSpy).not.toHaveBeenCalled()
  })
})

describe('SelfMediaEditor 无 Provider 降级', () => {
  it('panelActions 为 null 时预览/发布点击静默无操作（不抛错、不回调）', () => {
    const { container } = render(<SelfMediaEditor visible onClose={vi.fn()} />)
    typeContent('<p>降级内容甲</p>')
    const preview = container.querySelector<HTMLButtonElement>('[title="预览内容"]')!
    const publish = container.querySelector<HTMLButtonElement>('[title="发送到发布队列"]')!
    expect(() => {
      fireEvent.click(preview)
      fireEvent.click(publish)
    }).not.toThrow()
    // 内容状态仍正常流动（footer 计数），仅面板联动静默丢失
    expect(container.textContent).toContain('<p>降级内容甲</p>'.length + ' 字符')
  })
})
