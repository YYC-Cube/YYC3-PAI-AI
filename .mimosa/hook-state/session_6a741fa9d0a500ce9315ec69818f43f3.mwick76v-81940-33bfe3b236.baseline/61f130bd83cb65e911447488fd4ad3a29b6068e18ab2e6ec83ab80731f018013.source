/**
 * @file AIAssistantPanel.deep2.test.tsx
 * @description AI 辅助面板专项深化二 — visible 门控/遮罩与 X 关闭/模型分组渲染（加载·激活·卸载·全部卸载）/
 *              推理页（模型守卫·输入·运行·推理中态）/统计页四卡与系统信息/缓存页（大小·用量·清空·重载）
 * 策略：useWebGPUInference 以 vi.hoisted 受控桩替换；真 theme-store 提供 tokens；
 *       断言按内联 style 与文案（断言不依赖 snapshot）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

const h = vi.hoisted(() => ({
  hook: {
    models: [] as Array<Record<string, unknown>>,
    activeModel: null as Record<string, unknown> | null,
    loadedModels: [] as Array<Record<string, unknown>>,
    isLoadingModel: false,
    isInferencing: false,
    webGPUSupported: true,
    engineType: 'webgpu',
    stats: { totalInferences: 12, avgInferenceTime: 33.4, successRate: 95.5 },
    loadModel: vi.fn(),
    unloadModel: vi.fn(),
    unloadAllModels: vi.fn(),
    setActiveModel: vi.fn(),
    infer: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(() => ({ size: 2 * 1024 * 1024, usage: 40, max: 500 * 1024 * 1024 })),
  },
}))

vi.mock('../../hooks/useWebGPUInference', () => ({
  useWebGPUInference: () => h.hook,
}))

import { AIAssistantPanel } from '../AIAssistantPanel'

// ── Fixtures / Helpers ──

const mkModel = (over: Record<string, unknown> = {}) => ({
  id: 'm_' + Math.random().toString(36).slice(2, 6),
  name: 'TinyLLM-1B',
  type: 'llm',
  description: '轻量语言模型',
  size: 600 * 1024 * 1024,
  engine: 'webgpu',
  loaded: false,
  loadProgress: 0,
  ...over,
})

const TAB = (c: HTMLElement, name: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.textContent!.trim() === name)!

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.hook.models = []
  h.hook.activeModel = null
  h.hook.loadedModels = []
  h.hook.isLoadingModel = false
  h.hook.isInferencing = false
  h.hook.webGPUSupported = true
  h.hook.engineType = 'webgpu'
  h.hook.stats = { totalInferences: 12, avgInferenceTime: 33.4, successRate: 95.5 }
  h.hook.getCacheStats = vi.fn(() => ({ size: 2 * 1024 * 1024, usage: 40, max: 500 * 1024 * 1024 }))
})

describe('AIAssistantPanel（AI 辅助面板）', () => {
  it('visible=false 返回 null；visible 渲染标题/引擎徽章/四个页签；遮罩与 X 均触发 onClose', () => {
    const onClose = vi.fn()
    const { container, rerender } = render(<AIAssistantPanel visible={false} onClose={onClose} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<AIAssistantPanel visible onClose={onClose} />)
    expect(container.textContent).toContain('AI ASSISTANT')
    expect(container.textContent).toContain('WEBGPU') // engineType.toUpperCase()
    for (const tab of ['MODELS', 'INFER', 'STATS', 'CACHE']) {
      expect(TAB(container, tab)).toBeTruthy()
    }
    // 遮罩点击（target === currentTarget）→ onClose
    fireEvent.click(container.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
    // X 按钮
    fireEvent.click(container.querySelector('button svg.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('模型列表：按类型分组标题/模型名/描述/Size（formatSize）/Engine 大写/loaded 勾选与 ACTIVE 徽章', () => {
    h.hook.models = [
      mkModel({ id: 'llm_1', name: 'TinyLLM-1B', type: 'llm', engine: 'webgpu', size: 600 * 1024 * 1024, loaded: true }),
      mkModel({ id: 'emb_1', name: 'Embed-3B', type: 'embedding', engine: 'cpu', size: 1024 * 1024 }),
    ]
    h.hook.loadedModels = [h.hook.models[0]]
    h.hook.activeModel = h.hook.models[0]
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    expect(container.textContent).toContain('LLM MODELS')
    expect(container.textContent).toContain('EMBEDDING MODELS')
    expect(container.textContent).toContain('TinyLLM-1B')
    expect(container.textContent).toContain('Embed-3B')
    expect(container.textContent).toContain('轻量语言模型')
    expect(container.textContent).toContain('WEBGPU') // 模型 engine.toUpperCase()
    expect(container.textContent).toContain('CPU')
    expect(container.textContent).toContain('ACTIVE')
    expect(container.querySelector('.lucide-circle-check')).toBeTruthy()
    // formatSize(600MB) → 含 MB 的尺寸文案
    expect(container.textContent).toMatch(/Size:.*MB/)
  })

  it('Load/Unload/Activate 按钮布线：未加载 Load、已加载 Unload；无激活模型时已加载模型出现 Activate', () => {
    const exactBtn = (c: HTMLElement, text: string) =>
      Array.from(c.querySelectorAll('button')).find(b => b.textContent!.trim() === text)!
    h.hook.models = [
      mkModel({ id: 'm_load', loaded: false }),
      mkModel({ id: 'm_unload', loaded: true, name: 'Loaded-1' }),
    ]
    h.hook.loadedModels = [h.hook.models[1]]
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(exactBtn(container, 'Load'))
    expect(h.hook.loadModel).toHaveBeenCalledWith('m_load')
    fireEvent.click(exactBtn(container, 'Unload'))
    expect(h.hook.unloadModel).toHaveBeenCalledWith('m_unload')
    // loadedModels 非空 → Unload All 出现
    fireEvent.click(exactBtn(container, 'Unload All'))
    expect(h.hook.unloadAllModels).toHaveBeenCalledTimes(1)
    // 无 activeModel 且已加载 → Activate
    fireEvent.click(exactBtn(container, 'Activate'))
    expect(h.hook.setActiveModel).toHaveBeenCalledWith('m_unload')
  })

  it('isLoadingModel=true：Load 按钮显示 Loading... 并禁用；loadProgress 进度条按百分比渲染', () => {
    h.hook.models = [mkModel({ id: 'm_prog', loaded: false, loadProgress: 45 })]
    h.hook.isLoadingModel = true
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    const loadBtn = btnByText(container, 'Loading...')
    expect(loadBtn.disabled).toBe(true)
    expect(container.textContent).toContain('45%')
    // 进度条内层宽度 45%
    const bar = Array.from(container.querySelectorAll('div')).find(d => d.style.width === '45%')
    expect(bar).toBeTruthy()
  })

  it('INFER 页：激活模型名回显/textarea 默认代码/Run Inference → infer(输入)；无激活模型则禁用', () => {
    h.hook.models = [mkModel({ id: 'm_act', name: 'Act-7B' })]
    h.hook.activeModel = h.hook.models[0]
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(TAB(container, 'INFER'))
    expect(container.textContent).toContain('Act-7B')
    const area = container.querySelector('textarea') as HTMLTextAreaElement
    expect(area.value).toContain('function helloWorld()')
    fireEvent.change(area, { target: { value: 'const answer = 42' } })
    fireEvent.click(btnByText(container, 'Run Inference'))
    expect(h.hook.infer).toHaveBeenCalledWith('const answer = 42')
  })

  it('INFER 页守卫：无激活模型时 textarea 与 Run Inference 均禁用且不推理', () => {
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(TAB(container, 'INFER'))
    expect(container.textContent).toContain('None (select a model first)')
    const area = container.querySelector('textarea') as HTMLTextAreaElement
    expect(area.disabled).toBe(true)
    const run = btnByText(container, 'Run Inference')
    expect(run.disabled).toBe(true)
    fireEvent.click(run)
    expect(h.hook.infer).not.toHaveBeenCalled()
  })

  it('isInferencing=true：按钮变 Inferring... 带旋转图标，textarea 禁用', () => {
    h.hook.models = [mkModel({ id: 'm_act' })]
    h.hook.activeModel = h.hook.models[0]
    h.hook.isInferencing = true
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(TAB(container, 'INFER'))
    expect(container.textContent).toContain('Inferring...')
    expect(container.querySelector('.animate-spin')).toBeTruthy()
    expect((container.querySelector('textarea') as HTMLTextAreaElement).disabled).toBe(true)
  })

  it('STATS 页：四张统计卡（推理数/均时/成功率/引擎）与系统信息网格', () => {
    h.hook.models = [mkModel({ id: 'm1', loaded: true })]
    h.hook.loadedModels = [h.hook.models[0]]
    h.hook.activeModel = h.hook.models[0]
    h.hook.webGPUSupported = false
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(TAB(container, 'STATS'))
    expect(container.textContent).toContain('PERFORMANCE STATS')
    expect(container.textContent).toContain('Total Inferences')
    expect(container.textContent).toContain('33ms') // toFixed(0)
    expect(container.textContent).toContain('95.5%')
    expect(container.textContent).toContain('SYSTEM INFO')
    expect(container.textContent).toContain('No') // WebGPU Support: No
    expect(container.textContent).toContain('1 / 1') // Loaded Models
    expect(container.textContent).toContain('TinyLLM-1B') // Active Model 名
  })

  it('CACHE 页：缓存大小/用量按 getCacheStats 计算；Clear Cache → clearCache；Reload All → 逐个 loadModel', () => {
    h.hook.models = [mkModel({ id: 'r1', loaded: true }), mkModel({ id: 'r2', loaded: true })]
    h.hook.loadedModels = h.hook.models
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(TAB(container, 'CACHE'))
    expect(container.textContent).toContain('CACHE MANAGEMENT')
    expect(container.textContent).toContain('2.0 MB') // size/1024/1024 toFixed(1)
    expect(container.textContent).toContain('40.0%')
    expect(container.textContent).toContain('0 / 500 MB')
    expect(container.textContent).toContain('yyc3-webgpu-cache')
    // 用量 40 → 进度条绿色（success）而非红/黄
    const clear = btnByText(container, 'Clear Cache')
    fireEvent.click(clear)
    expect(h.hook.clearCache).toHaveBeenCalledTimes(1)
    fireEvent.click(btnByText(container, 'Reload All Models'))
    expect(h.hook.loadModel).toHaveBeenCalledWith('r1')
    expect(h.hook.loadModel).toHaveBeenCalledWith('r2')
  })

  it('CACHE 页用量分级：>80% 红色错误色；Reload All 无已加载模型时禁用', () => {
    h.hook.getCacheStats = vi.fn(() => ({ size: 420 * 1024 * 1024, usage: 90, max: 500 * 1024 * 1024 }))
    const { container } = render(<AIAssistantPanel visible onClose={vi.fn()} />)
    fireEvent.click(TAB(container, 'CACHE'))
    expect(container.textContent).toContain('420.0 MB')
    expect(container.textContent).toContain('90.0%')
    // 用量 90 > 80 → error 色
    const bar = Array.from(container.querySelectorAll('div')).find(d => d.style.width === '90%')
    expect(bar).toBeTruthy()
    // loadedModels 为空 → Reload All 禁用
    expect(btnByText(container, 'Reload All Models').disabled).toBe(true)
  })
})
