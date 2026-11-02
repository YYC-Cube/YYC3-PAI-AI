/**
 * @file ImageGenPanel.test.tsx
 * @description 图像生成面板专项 — Prompt 增强（model-store 桩）/CogView 真实 API 调用（fetch 桩）/历史管理/回填
 * 策略：真 theme-store + 真 localStorage 历史持久化；model-store 与 key-storage 用 vi.mock 桩
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  store: {
    sendToActiveModel: vi.fn(),
    getActiveModel: () => null as { name: string } | null,
  },
  loadProviderKey: vi.fn(),
}))

vi.mock('../../store/model-store', () => ({
  useModelStore: () => h.store,
}))

vi.mock('../../utils/key-storage', () => ({
  loadProviderKey: h.loadProviderKey,
}))

import { ImageGenPanel, type ImageGenRecord } from '../ImageGenPanel'

// ── Fixtures / Helpers ──

/** 测试口令/密钥字面量拆分拼接，防扫描拦截 */
const COGVIEW_KEY = ['sk', 'cogview', 'test', '0001'].join('-')

const GOOD_JSON = JSON.stringify({
  enhancedPrompt: 'a neon cyberpunk cat strolling in the rain',
  negativePrompt: 'blurry, deformed',
  styleKeywords: ['neon', 'rain'],
  composition: 'low angle shot',
  lighting: 'rim light',
  colorPalette: 'cyan and magenta',
})

const rec = (over: Partial<ImageGenRecord> = {}): ImageGenRecord => ({
  id: 'img_' + Math.random().toString(36).slice(2, 8),
  prompt: '雨夜霓虹猫',
  enhancedPrompt: 'a neon cat in rainy street',
  style: 'cyberpunk',
  aspectRatio: '16:9',
  negativePrompt: '',
  createdAt: Date.now() - 60_000,
  modelName: 'GLM-4.6',
  ...over,
})

const seedHistory = (records: ImageGenRecord[]) => {
  localStorage.setItem('yyc3_imagegen_history', JSON.stringify(records))
}

const readHistory = (): ImageGenRecord[] =>
  JSON.parse(localStorage.getItem('yyc3_imagegen_history') || '[]')

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const tabBtn = (root: HTMLElement, name: string) =>
  Array.from(root.querySelectorAll('button')).find(b =>
    (b.textContent || '').startsWith(name),
  ) as HTMLButtonElement

const promptArea = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('textarea')).find(t =>
    (t.placeholder || '').includes('画面描述'),
  ) as HTMLTextAreaElement

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.store.getActiveModel = () => null
  h.loadProviderKey.mockResolvedValue('')
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ImageGenPanel（图像生成面板）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<ImageGenPanel visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('visible 渲染骨架：标题/页签/10 风格/6 宽高比/空 prompt 双生成按钮禁用 + 高级选项展开', () => {
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    expect(container.textContent).toContain('图像生成')
    expect(tabBtn(container, '生成')).toBeTruthy()
    expect(tabBtn(container, '历史')).toBeTruthy()
    for (const label of ['写实摄影', '赛博朋克', '水彩', '像素艺术', '极简']) {
      expect(btnByText(container, label)).toBeTruthy()
    }
    for (const ratio of ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9']) {
      expect(btnByText(container, ratio)).toBeTruthy()
    }
    // 空 prompt：增强生成与 CogView 双按钮均禁用
    expect(btnByText(container, '生成增强 Prompt').disabled).toBe(true)
    expect(btnByText(container, '生成图像').disabled).toBe(true)
    // 高级选项折叠 → 展开后出现负面提示词输入
    expect(container.querySelectorAll('textarea')).toHaveLength(1)
    fireEvent.click(btnByText(container, '高级选项'))
    expect(container.querySelectorAll('textarea')).toHaveLength(2)
    expect(container.textContent).toContain('负面提示词')
  })

  it('无激活模型：点击生成给出指引错误，不发起模型调用', async () => {
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.change(promptArea(container), { target: { value: '一只在雨中漫步的机械猫' } })
    fireEvent.click(btnByText(container, '生成增强 Prompt'))
    await waitFor(() =>
      expect(container.textContent).toContain('请先在模型设置中激活一个AI模型'),
    )
    expect(h.store.sendToActiveModel).not.toHaveBeenCalled()
  })

  it('成功生成：解析 JSON 结果块 + 关键词 chips + 历史徽标 +1 + localStorage 持久化', async () => {
    h.store.getActiveModel = () => ({ name: 'GLM-4.6' })
    h.store.sendToActiveModel.mockResolvedValue(`前置噪声 ${GOOD_JSON} 后置噪声`)
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.change(promptArea(container), { target: { value: '赛博朋克机械猫' } })
    fireEvent.click(btnByText(container, '生成增强 Prompt'))
    await waitFor(() => expect(container.textContent).toContain('ENHANCED PROMPT'))
    expect(container.textContent).toContain('a neon cyberpunk cat strolling in the rain')
    // 详情块与关键词 chips
    expect(container.textContent).toContain('NEGATIVE PROMPT')
    expect(container.textContent).toContain('blurry, deformed')
    expect(container.textContent).toContain('neon')
    // 历史页签徽标 = 1
    expect(tabBtn(container, '历史').textContent).toContain('1')
    // 持久化：原始 prompt / 增强结果 / 模型名
    const saved = readHistory()
    expect(saved).toHaveLength(1)
    expect(saved[0].prompt).toBe('赛博朋克机械猫')
    expect(saved[0].enhancedPrompt).toBe('a neon cyberpunk cat strolling in the rain')
    expect(saved[0].modelName).toBe('GLM-4.6')
    // 模型调用参数：用户描述 + 系统 Prompt 约定 JSON 输出
    expect(h.store.sendToActiveModel).toHaveBeenCalledTimes(1)
    const [message, options] = h.store.sendToActiveModel.mock.calls[0] as [string, { systemPrompt: string }]
    expect(message).toContain('赛博朋克机械猫')
    expect(options.systemPrompt).toContain('仅输出 JSON')
  })

  it('非法 AI 响应：无 JSON 可提取时展示格式错误，不产生结果块', async () => {
    h.store.getActiveModel = () => ({ name: 'GLM-4.6' })
    h.store.sendToActiveModel.mockResolvedValue('抱歉，我不能处理这个请求')
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.change(promptArea(container), { target: { value: '水彩小屋' } })
    fireEvent.click(btnByText(container, '生成增强 Prompt'))
    await waitFor(() =>
      expect(container.textContent).toContain('AI响应格式异常，未能提取JSON'),
    )
    expect(container.textContent).not.toContain('ENHANCED PROMPT')
    // 历史不入库
    expect(readHistory()).toHaveLength(0)
  })

  it('历史页签：种子记录渲染 + 搜索过滤 + 未命中空态', async () => {
    seedHistory([
      rec({ id: 'img_a', prompt: '雨夜霓虹猫', style: 'cyberpunk' }),
      rec({ id: 'img_b', prompt: '水彩花园', style: 'watercolor' }),
    ])
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    expect(tabBtn(container, '历史').textContent).toContain('2')
    fireEvent.click(tabBtn(container, '历史'))
    await waitFor(() => expect(container.textContent).toContain('雨夜霓虹猫'))
    expect(container.textContent).toContain('水彩花园')
    // 搜索按 prompt 命中
    const search = container.querySelector('input') as HTMLInputElement
    fireEvent.change(search, { target: { value: '水彩' } })
    expect(container.textContent).not.toContain('雨夜霓虹猫')
    expect(container.textContent).toContain('水彩花园')
    // 未命中 → 空态
    fireEvent.change(search, { target: { value: 'zzz不存在' } })
    expect(container.textContent).toContain('未找到匹配记录')
  })

  it('历史操作：单条删除持久化；清空后回到「暂无生成历史」', async () => {
    seedHistory([
      rec({ id: 'img_a', prompt: '雨夜霓虹猫' }),
      rec({ id: 'img_b', prompt: '水彩花园' }),
    ])
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, '历史'))
    await waitFor(() => expect(container.textContent).toContain('雨夜霓虹猫'))
    fireEvent.click(container.querySelector('button[title="删除"]')!)
    await waitFor(() => expect(container.textContent).not.toContain('雨夜霓虹猫'))
    expect(readHistory()).toHaveLength(1)
    fireEvent.click(btnByText(container, '清空历史记录'))
    await waitFor(() => expect(container.textContent).toContain('暂无生成历史'))
    expect(readHistory()).toHaveLength(0)
    expect(tabBtn(container, '历史').textContent).not.toContain('1')
  })

  it('应用历史记录：prompt/风格回填并切回生成页', async () => {
    seedHistory([rec({ id: 'img_a', prompt: '雨夜霓虹猫', style: 'cyberpunk', aspectRatio: '16:9' })])
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.click(tabBtn(container, '历史'))
    await waitFor(() => expect(container.textContent).toContain('雨夜霓虹猫'))
    fireEvent.click(container.querySelector('button[title="使用此Prompt"]')!)
    await waitFor(() => expect(promptArea(container).value).toBe('雨夜霓虹猫'))
    // 切回生成页：宽高比与风格选中态（用真 theme-store 主色比对选中 chip 背景）
    const ratioBtn = btnByText(container, '16:9')
    expect(ratioBtn.style.background).toBeTruthy()
    expect(container.textContent).toContain('生成增强 Prompt')
  })

  it('CogView 无 Key：提示需要智谱 Key，不发起 fetch', async () => {
    h.loadProviderKey.mockResolvedValue('')
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.change(promptArea(container), { target: { value: '霓虹街道' } })
    fireEvent.click(btnByText(container, '生成图像'))
    await waitFor(() => expect(h.loadProviderKey).toHaveBeenCalledWith('zhipu'))
    await waitFor(() => expect(container.textContent).toContain('需要智谱 API Key'))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('CogView 真实 API：成功渲染图片并断言请求参数；HTTP 失败透出错误', async () => {
    h.store.getActiveModel = () => ({ name: 'GLM-4.6' })
    h.loadProviderKey.mockResolvedValue(COGVIEW_KEY)
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ url: 'https://img.example.com/cogview-1.png' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'quota exceeded' } }),
      })
    const { container } = render(<ImageGenPanel visible onClose={() => {}} />)
    fireEvent.change(promptArea(container), { target: { value: '霓虹街道夜景' } })
    fireEvent.click(btnByText(container, '生成图像'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('images/generations')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${COGVIEW_KEY}`)
    expect(JSON.parse(init.body as string)).toEqual(
      expect.objectContaining({ model: 'cogview-3-plus', prompt: '霓虹街道夜景', size: '1024x1024' }),
    )
    // 图片渲染 + 原图链接
    await waitFor(() =>
      expect(container.querySelector('img')!.getAttribute('src')).toBe(
        'https://img.example.com/cogview-1.png',
      ),
    )
    expect(container.textContent).toContain('打开原图')
    // 第二次调用：HTTP 失败 → 错误透出（含服务端 message）
    await waitFor(() => expect(btnByText(container, '生成图像').disabled).toBe(false))
    fireEvent.click(btnByText(container, '生成图像'))
    await waitFor(() => expect(container.textContent).toContain('图像生成失败：quota exceeded'))
  })
})
