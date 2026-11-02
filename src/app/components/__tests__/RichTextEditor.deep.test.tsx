/**
 * @file RichTextEditor.deep.test.tsx
 * @description 富文本 AI 编辑器专项深化 — 真 Tiptap(jsdom)：工具栏命令→onChange HTML / 撤销重做 /
 *              AI 菜单选区门控 / 无模型错误条 / AI 改写成功替换 + 撤销AI修改 / 调用失败 / 翻译语言选择 / 处理中指示
 * @note model-store 以 vi.hoisted 受控桩替换（getActiveModel/sendToActiveModel）；
 *       选区通过 ProseMirror 键位 Mod-a 建立（jsdom 无真实鼠标选区）；
 *       Tiptap v3 默认不随 transaction 重渲染 → 选区派生态需经一次 setState（如开关 AI 菜单）刷新
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'

const h = vi.hoisted(() => ({
  getActiveModel: vi.fn(),
  sendToActiveModel: vi.fn(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => ({ getActiveModel: h.getActiveModel, sendToActiveModel: h.sendToActiveModel }),
}))

import { RichTextEditor } from '../RichTextEditor'

// jsdom 的 Range 缺 getClientRects/getBoundingClientRect：ProseMirror insertContent 后 scrollToSelection 需要
const ZERO_RECT = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect
if (!Range.prototype.getClientRects) Range.prototype.getClientRects = () => [] as unknown as DOMRectList
if (!Range.prototype.getBoundingClientRect) Range.prototype.getBoundingClientRect = () => ZERO_RECT

// ── Helpers ──

const pmOf = (c: HTMLElement) => c.querySelector('.ProseMirror') as HTMLElement
/** ProseMirror 基础键位 Mod-a → 全选（建立非空选区） */
const selectAll = (pm: HTMLElement) => fireEvent.keyDown(pm, { key: 'a', ctrlKey: true })
const btnByTitle = (c: HTMLElement, title: string) => c.querySelector(`button[title="${title}"]`) as HTMLButtonElement
const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.textContent?.trim() === text) as HTMLButtonElement
/** AI 下拉菜单根节点（以标题文案「AI 文本操作」定位） */
const aiMenu = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('div')).find(d => d.textContent === 'AI 文本操作')!.parentElement as HTMLElement
/** 菜单内动作按钮（按钮文本 = label + description，取前缀匹配） */
const aiAction = (c: HTMLElement, label: string) =>
  Array.from(aiMenu(c).querySelectorAll('button')).find(b => b.textContent?.startsWith(label)) as HTMLButtonElement
const lastHtml = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls[spy.mock.calls.length - 1]?.[0] as string

const ACTIVE_MODEL = { id: 'm1', name: 'glm-4.6', provider: 'zhipu', active: true }

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.getActiveModel.mockReturnValue(null)
  h.sendToActiveModel.mockResolvedValue('')
})

const mount = (props: Partial<React.ComponentProps<typeof RichTextEditor>> = {}) => {
  const onChange = vi.fn()
  const utils = render(<RichTextEditor initialContent="<p>hello world</p>" onChange={onChange} {...props} />)
  return { ...utils, onChange }
}

describe('RichTextEditor 骨架', () => {
  it('渲染工具栏八格式按钮 + 撤销/重做 + AI 写作入口；初始内容进入 ProseMirror；状态栏空选提示', () => {
    const { container } = mount()
    for (const t of ['加粗', '斜体', '标题1', '标题2', '标题3', '无序列表', '有序列表', '引用', '撤销', '重做']) {
      expect(btnByTitle(container, t)).toBeTruthy()
    }
    expect(btnByText(container, 'AI 写作')).toBeTruthy()
    expect(pmOf(container).textContent).toContain('hello world')
    expect(container.textContent).toContain('选中文本后使用AI工具')
    // 未装 CharacterCount 扩展 → 字数恒为 0
    expect(container.textContent).toContain('0 字')
    // 初始无历史：撤销/重做禁用
    expect(btnByTitle(container, '撤销').disabled).toBe(true)
    expect(btnByTitle(container, '重做').disabled).toBe(true)
  })

  it('enableAI=false 时不渲染 AI 写作入口', () => {
    const { container } = mount({ enableAI: false })
    expect(btnByText(container, 'AI 写作')).toBeUndefined()
    expect(btnByTitle(container, '加粗')).toBeTruthy()
  })
})

describe('工具栏命令（真 Tiptap）', () => {
  it('全选后点击加粗/标题1/引用 → onChange 回传含 strong/h1/blockquote 的 HTML', () => {
    const { container, onChange } = mount()
    const pm = pmOf(container)
    selectAll(pm)
    fireEvent.click(btnByTitle(container, '加粗'))
    expect(lastHtml(onChange)).toContain('<strong>hello world</strong>')
    fireEvent.click(btnByTitle(container, '标题1'))
    expect(lastHtml(onChange)).toContain('<h1>')
    fireEvent.click(btnByTitle(container, '引用'))
    expect(lastHtml(onChange)).toContain('<blockquote>')
    expect(pm.querySelector('blockquote h1 strong')?.textContent).toBe('hello world')
  })

  it('撤销/重做：变更后经一次重渲染解禁 → 撤销回退到原文 → 重做恢复加粗', () => {
    const { container, onChange } = mount()
    selectAll(pmOf(container))
    fireEvent.click(btnByTitle(container, '加粗'))
    expect(lastHtml(onChange)).toContain('<strong>')
    // Tiptap v3 不随 transaction 重渲染 → 开关 AI 菜单触发 setState 以刷新 can().undo()
    fireEvent.click(btnByText(container, 'AI 写作'))
    fireEvent.click(btnByText(container, 'AI 写作'))
    expect(btnByTitle(container, '撤销').disabled).toBe(false)
    fireEvent.click(btnByTitle(container, '撤销'))
    expect(lastHtml(onChange)).toBe('<p>hello world</p>')
    fireEvent.click(btnByText(container, 'AI 写作'))
    fireEvent.click(btnByText(container, 'AI 写作'))
    expect(btnByTitle(container, '重做').disabled).toBe(false)
    fireEvent.click(btnByTitle(container, '重做'))
    expect(lastHtml(onChange)).toContain('<strong>hello world</strong>')
  })
})

describe('AI 菜单与门控', () => {
  it('点击 AI 写作展开六项操作；无选区时动作禁用；再次点击收起', () => {
    const { container } = mount()
    fireEvent.click(btnByText(container, 'AI 写作'))
    expect(container.textContent).toContain('AI 文本操作')
    for (const label of ['改写', '润色', '扩写', '摘要', '翻译', '续写']) {
      expect(aiAction(container, label)).toBeTruthy()
    }
    expect(aiAction(container, '改写').disabled).toBe(true)
    expect(aiAction(container, '改写').style.opacity).toBe('0.4')
    fireEvent.click(btnByText(container, 'AI 写作'))
    expect(container.textContent).not.toContain('AI 文本操作')
  })

  it('有选区但无激活模型 → 错误条提示激活模型且不调用模型；X 关闭错误条', async () => {
    const { container } = mount()
    selectAll(pmOf(container))
    fireEvent.click(btnByText(container, 'AI 写作'))
    expect(container.textContent).toContain('已选 11 字')
    expect(aiAction(container, '改写').disabled).toBe(false)
    fireEvent.click(aiAction(container, '改写'))
    await waitFor(() => expect(container.textContent).toContain('请先在模型设置中激活一个AI模型'))
    expect(h.sendToActiveModel).not.toHaveBeenCalled()
    // 错误条右侧 X：错误条内唯一按钮
    const errBar = Array.from(container.querySelectorAll('span')).find(s => s.textContent === '请先在模型设置中激活一个AI模型')!.parentElement as HTMLElement
    fireEvent.click(errBar.querySelector('button')!)
    expect(container.textContent).not.toContain('请先在模型设置中激活一个AI模型')
  })

  it('AI 改写成功：提示词携带选中文本 → 结果去引号替换选区 → onChange 回传 → 撤销AI修改恢复原文', async () => {
    h.getActiveModel.mockReturnValue(ACTIVE_MODEL)
    h.sendToActiveModel.mockResolvedValue('"REWRITTEN TEXT"')
    const { container, onChange } = mount()
    selectAll(pmOf(container))
    fireEvent.click(btnByText(container, 'AI 写作'))
    fireEvent.click(aiAction(container, '改写'))

    await waitFor(() => expect(h.sendToActiveModel).toHaveBeenCalledTimes(1))
    const [prompt, opts] = h.sendToActiveModel.mock.calls[0] as [string, { systemPrompt: string }]
    expect(prompt).toContain('请改写以下文本')
    expect(prompt).toContain('---\nhello world')
    expect(opts.systemPrompt).toContain('写作助手')

    await waitFor(() => expect(pmOf(container).textContent).toContain('REWRITTEN TEXT'))
    expect(pmOf(container).textContent).not.toContain('hello world')
    expect(lastHtml(onChange)).toContain('REWRITTEN TEXT')
    // finally：菜单关闭 + 出现撤销AI修改
    await waitFor(() => expect(container.textContent).not.toContain('AI 文本操作'))
    const undoAI = btnByText(container, '撤销AI修改')
    expect(undoAI).toBeTruthy()
    fireEvent.click(undoAI)
    expect(pmOf(container).textContent).toContain('hello world')
    expect(lastHtml(onChange)).toContain('hello world')
  })

  it('AI 调用失败 → 错误条显示异常信息；处理中指示在 pending 期间可见、结束后消失', async () => {
    h.getActiveModel.mockReturnValue(ACTIVE_MODEL)
    let reject!: (e: Error) => void
    h.sendToActiveModel.mockImplementation(() => new Promise<string>((_, rej) => { reject = rej }))
    const { container } = mount()
    selectAll(pmOf(container))
    fireEvent.click(btnByText(container, 'AI 写作'))
    fireEvent.click(aiAction(container, '润色'))
    await waitFor(() => expect(container.textContent).toContain('润色中...'))
    expect(aiAction(container, '改写').disabled).toBe(true)
    await act(async () => { reject(new Error('quota exceeded')) })
    await waitFor(() => expect(container.textContent).toContain('quota exceeded'))
    expect(container.textContent).not.toContain('润色中...')
    expect(pmOf(container).textContent).toContain('hello world')
  })

  it('翻译：点击翻译弹出目标语言 → 选 English → 延时触发带 English 的翻译提示词', async () => {
    h.getActiveModel.mockReturnValue(ACTIVE_MODEL)
    h.sendToActiveModel.mockResolvedValue('TRANSLATED')
    const { container } = mount()
    selectAll(pmOf(container))
    fireEvent.click(btnByText(container, 'AI 写作'))
    fireEvent.click(aiAction(container, '翻译'))
    expect(h.sendToActiveModel).not.toHaveBeenCalled()
    expect(container.textContent).toContain('目标语言')
    const picker = Array.from(container.querySelectorAll('div')).find(d => d.textContent === '目标语言')!.parentElement as HTMLElement
    fireEvent.click(Array.from(picker.querySelectorAll('button')).find(b => b.textContent === 'English')!)
    expect(container.textContent).not.toContain('目标语言')
    await waitFor(() => expect(h.sendToActiveModel).toHaveBeenCalledTimes(1))
    expect((h.sendToActiveModel.mock.calls[0] as [string])[0]).toContain('翻译为English')
    await waitFor(() => expect(pmOf(container).textContent).toContain('TRANSLATED'))
  })
})
