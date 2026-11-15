/**
 * @file AIAssistPanel.deep.test.tsx
 * @description AI 智能辅助面板专项深化 — visible 门控 / 上下文栏（文件·光标·选中行数）/ 遮罩与 X 关闭 /
 *              无模型诚实指引 / 生成建议：提示词拼装·JSON 提取·类型与置信度归一·分析中态 /
 *              筛选页签 / 展开详情·代码片段·复制成功与失败 / 应用（onApplyCode + 已应用徽标 + 统计）/ 忽略 /
 *              解析失败·空数组·无 JSON·API 异常四类 toast
 * @note model-store 以 vi.hoisted 受控桩替换；sonner 由全局 setup 桩化（__sonnerLog 记录 toast 文案）；
 *       i18n 无 Provider 回退 zh → 中文字面量断言；navigator.clipboard 按用例定义
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'

const h = vi.hoisted(() => ({
  getActiveModel: vi.fn(),
  sendToActiveModel: vi.fn(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => ({ getActiveModel: h.getActiveModel, sendToActiveModel: h.sendToActiveModel }),
}))

import { AIAssistPanel, type AIContext } from '../AIAssistPanel'

const toastLog = (globalThis as unknown as { __sonnerLog: string[] }).__sonnerLog
const lastToast = () => toastLog[toastLog.length - 1]

// ── Helpers ──

const CTX: AIContext = {
  selectedFile: 'App.tsx',
  currentCode: 'const a = 1\nconst b = 2',
  designJsonSummary: '',
  recentActions: ['edit', 'save'],
  cursorLine: 3,
  cursorColumn: 5,
  selectedText: 'const a = 1\nconst b = 2',
  language: 'typescript',
}
const ACTIVE_MODEL = { id: 'm1', name: 'glm-4.6', provider: 'zhipu', active: true }
/** 被 markdown 围栏包裹的 JSON 数组：含非法 type / 超界置信度 / 缺 code 的三条 */
const RESPONSE = [
  'Here you go:',
  '```json',
  JSON.stringify([
    { type: 'fix', title_zh: '修复空指针', title_en: 'Fix NPE', desc_zh: '描述修复', desc_en: 'Fix desc', code: 'if (x) {}', confidence: 92 },
    { type: 'weird', title: '通用建议', description: 'desc', confidence: 150 },
    { type: 'doc', title_zh: '补文档', title_en: 'Add docs', desc_zh: '文档描述', desc_en: 'd' },
  ]),
  '```',
].join('\n')

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.textContent?.trim() === text) as HTMLButtonElement
const cardOf = (c: HTMLElement, title: string) =>
  Array.from(c.querySelectorAll('p')).find(p => p.textContent === title)!.closest('.rounded-lg') as HTMLElement
const generate = (c: HTMLElement) => fireEvent.click(btnByText(c, '生成建议'))

const mount = (ctx: AIContext = CTX, onApplyCode?: (code: string, title: string) => void) => {
  const onClose = vi.fn()
  const utils = render(<AIAssistPanel visible onClose={onClose} context={ctx} onApplyCode={onApplyCode} />)
  return { ...utils, onClose }
}
/** 生成并等待三条建议落地 */
const mountWithSuggestions = async (onApplyCode?: (code: string, title: string) => void) => {
  h.getActiveModel.mockReturnValue(ACTIVE_MODEL)
  h.sendToActiveModel.mockResolvedValue(RESPONSE)
  const utils = mount(CTX, onApplyCode)
  generate(utils.container)
  await waitFor(() => expect(utils.container.textContent).toContain('全部 (3)'))
  return utils
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  toastLog.length = 0
  h.getActiveModel.mockReturnValue(null)
  h.sendToActiveModel.mockResolvedValue('')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AIAssistPanel 框架', () => {
  it('visible=false → null；打开渲染标题/上下文栏（文件·Ln/Col·已选行数）/空态指引；无光标与选区时不显示 Ln', () => {
    const { container, rerender } = render(<AIAssistPanel visible={false} onClose={vi.fn()} context={CTX} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<AIAssistPanel visible onClose={vi.fn()} context={CTX} />)
    expect(container.textContent).toContain('AI 智能辅助')
    expect(container.textContent).toContain('App.tsx')
    expect(container.textContent).toContain('Ln 3, Col 5')
    expect(container.textContent).toContain('已选 2 行')
    expect(container.textContent).toContain('点击"生成建议"开始 AI 分析')
    rerender(<AIAssistPanel visible onClose={vi.fn()} context={{ ...CTX, cursorLine: undefined, cursorColumn: undefined, selectedText: undefined }} />)
    expect(container.textContent).not.toContain('Ln ')
    expect(container.textContent).not.toContain('已选')
  })

  it('遮罩点击（target 判定）与 X 按钮双路关闭', () => {
    const { container, onClose } = mount()
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(btnByText(container, '生成建议').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('无激活模型 → toast 诚实指引，不调用模型，保持空态', () => {
    const { container } = mount()
    generate(container)
    expect(lastToast()).toContain('未激活模型')
    expect(h.sendToActiveModel).not.toHaveBeenCalled()
    expect(container.textContent).toContain('点击"生成建议"开始 AI 分析')
  })
})

describe('生成建议', () => {
  it('提示词拼装（文件·语言·最近动作·光标·选中代码·中文偏好）→ 分析中态 → JSON 提取与归一（非法 type→code / 置信度钳位 / 缺省 80）', async () => {
    h.getActiveModel.mockReturnValue(ACTIVE_MODEL)
    let resolve!: (v: string) => void
    h.sendToActiveModel.mockImplementation(() => new Promise<string>(r => { resolve = r }))
    const { container } = mount()
    generate(container)
    // 分析中态
    expect(container.textContent).toContain('分析中...')
    expect(container.textContent).toContain('正在收集上下文并分析...')
    for (const step of ['selectedFile', 'codeAST', 'designJSON', 'patterns']) expect(container.textContent).toContain(step)
    expect(btnByText(container, '分析中...').disabled).toBe(true)

    const [userPrompt, opts] = h.sendToActiveModel.mock.calls[0] as [string, { systemPrompt: string; history: unknown[] }]
    expect(userPrompt).toContain('File: App.tsx (typescript)')
    expect(userPrompt).toContain('Recent actions: edit, save')
    expect(userPrompt).toContain('Cursor position: line 3, column 5')
    expect(userPrompt).toContain('Selected code:')
    expect(userPrompt).toContain('Focus suggestions on the selected code region.')
    expect(opts.systemPrompt).toContain('Language preference: 中文')
    expect(opts.history).toEqual([])

    await act(async () => { resolve(RESPONSE) })
    await waitFor(() => expect(container.textContent).toContain('全部 (3)'))
    expect(lastToast()).toBe('AI 已生成 3 条智能建议')
    expect(container.textContent).toContain('错误修复 (1)')
    expect(container.textContent).toContain('代码生成 (1)')
    expect(container.textContent).toContain('文档生成 (1)')
    expect(cardOf(container, '修复空指针').textContent).toContain('92% 置信度')
    expect(cardOf(container, '通用建议').textContent).toContain('100% 置信度')
    expect(cardOf(container, '补文档').textContent).toContain('80% 置信度')
    expect(container.textContent).toContain('✓ 0')
    expect(container.textContent).toContain('○ 3')
    expect(container.textContent).not.toContain('分析中...')
  })

  it('解析失败 / 空数组 / 无 JSON / API 异常 → 四类诚实 toast，均不产生建议', async () => {
    h.getActiveModel.mockReturnValue(ACTIVE_MODEL)
    const { container } = mount()

    h.sendToActiveModel.mockResolvedValueOnce('[{bad json}]')
    generate(container)
    await waitFor(() => expect(lastToast()).toBe('AI 响应解析失败——未生成建议'))

    h.sendToActiveModel.mockResolvedValueOnce('[]')
    generate(container)
    await waitFor(() => expect(lastToast()).toBe('AI 未返回有效建议'))

    h.sendToActiveModel.mockResolvedValueOnce('nothing structured here')
    generate(container)
    await waitFor(() => expect(lastToast()).toBe('AI 未返回有效建议'))

    h.sendToActiveModel.mockRejectedValueOnce(new Error('rate limited'))
    generate(container)
    await waitFor(() => expect(lastToast()).toBe('AI 调用失败: rate limited'))

    expect(container.textContent).toContain('点击"生成建议"开始 AI 分析')
    expect(container.textContent).not.toContain('全部 (')
  })
})

describe('建议交互', () => {
  it('展开详情显示描述 + CODE SNIPPET；应用 → onApplyCode(code, 中文标题) + 已应用徽标 + 统计 ✓1/○2 + 操作按钮消失', async () => {
    const onApplyCode = vi.fn()
    const { container } = await mountWithSuggestions(onApplyCode)
    expect(container.textContent).not.toContain('描述修复')
    fireEvent.click(cardOf(container, '修复空指针').querySelector('button')!)
    const card = cardOf(container, '修复空指针')
    expect(card.textContent).toContain('描述修复')
    expect(card.textContent).toContain('CODE SNIPPET')
    expect(card.querySelector('pre')!.textContent).toBe('if (x) {}')
    expect(card.querySelector('.lucide-chevron-down')).toBeTruthy()

    fireEvent.click(btnByText(card, '应用建议'))
    expect(onApplyCode).toHaveBeenCalledWith('if (x) {}', '修复空指针')
    expect(lastToast()).toBe('建议已应用')
    const after = cardOf(container, '修复空指针')
    expect(after.textContent).toContain('已应用')
    expect(btnByText(after, '应用建议')).toBeUndefined()
    expect(container.textContent).toContain('✓ 1')
    expect(container.textContent).toContain('○ 2')
    // 再点标题收起
    fireEvent.click(after.querySelector('button')!)
    expect(cardOf(container, '修复空指针').textContent).not.toContain('CODE SNIPPET')
  })

  it('忽略 → 卡片半透明且待处理减一；无 code 的建议展开不显示片段', async () => {
    const { container } = await mountWithSuggestions()
    fireEvent.click(cardOf(container, '通用建议').querySelector('button')!)
    fireEvent.click(btnByText(cardOf(container, '通用建议'), '忽略'))
    expect(cardOf(container, '通用建议').style.opacity).toBe('0.5')
    expect(container.textContent).toContain('○ 2')
    fireEvent.click(cardOf(container, '补文档').querySelector('button')!)
    const docCard = cardOf(container, '补文档')
    expect(docCard.textContent).toContain('文档描述')
    expect(docCard.textContent).not.toContain('CODE SNIPPET')
  })

  it('筛选页签：点文档生成仅剩补文档 → 点全部恢复三条', async () => {
    const { container } = await mountWithSuggestions()
    fireEvent.click(btnByText(container, '文档生成 (1)'))
    expect(container.textContent).toContain('补文档')
    expect(container.textContent).not.toContain('修复空指针')
    expect(container.textContent).not.toContain('通用建议')
    fireEvent.click(btnByText(container, '全部 (3)'))
    expect(container.textContent).toContain('修复空指针')
    expect(container.textContent).toContain('通用建议')
  })

  it('复制代码：clipboard 成功 → 已复制 toast；失败 → 复制失败 toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { container } = await mountWithSuggestions()
    fireEvent.click(cardOf(container, '修复空指针').querySelector('button')!)
    fireEvent.click(cardOf(container, '修复空指针').querySelector('.lucide-copy')!.closest('button')!)
    expect(writeText).toHaveBeenCalledWith('if (x) {}')
    await waitFor(() => expect(lastToast()).toBe('代码已复制到剪贴板'))

    writeText.mockRejectedValueOnce(new Error('denied'))
    fireEvent.click(cardOf(container, '修复空指针').querySelector('.lucide-copy')!.closest('button')!)
    await waitFor(() => expect(lastToast()).toBe('复制失败'))
  })
})
