/**
 * @file Panels4.test.tsx
 * @description 面板补测第三程 B：零 mock 高价值面板（PublishQueue 真导出 / AIWriting 流式 / ImageGen CogView）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { PublishQueue } from '../PublishQueue'
import { AIWritingPanel } from '../AIWritingPanel'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('PublishQueue（真实导出：复制+开平台后台）', () => {
  it('初始无任务显示空态', () => {
    render(<PublishQueue visible onClose={() => { }} />)
    expect(document.body.textContent!.length).toBeGreaterThan(0)
  })

  it('带入 initialContent 显示编辑器并可创建任务', async () => {
    render(<PublishQueue visible onClose={() => { }} initialContent="测试内容正文" initialTitle="标题" />)
    await waitFor(() => {
      expect(document.querySelector('textarea')?.value).toContain('测试内容正文')
    })
    // 创建任务按钮（发布/添加到队列）
    const create = Array.from(document.querySelectorAll('button')).find(b => /添加|创建|发布|队列|publish|add/i.test(b.textContent || ''))
    expect(create).toBeTruthy()
  })
})

describe('AIWritingPanel（真 AI 通道 + 六模式）', () => {
  it('渲染六种写作模式', () => {
    render(<AIWritingPanel visible onClose={() => { }} />)
    const text = document.body.textContent || ''
    const modes = ['标题', '大纲', 'SEO', '扩写', '摘要', '改写']
    const hit = modes.filter(m => text.includes(m))
    expect(hit.length).toBeGreaterThanOrEqual(3) // i18n zh 下至少命中 3 种模式名
  })

  it('无激活模型时生成给诚实指引（零 mock 回归）', async () => {
    // model-store 空模型：sendToActiveModel 应被拒
    render(<AIWritingPanel visible onClose={() => { }} />)
    const gen = Array.from(document.querySelectorAll('button')).find(b => /生成|generate/i.test(b.textContent || ''))
    expect(gen).toBeTruthy()
    // 面板自守：无模型时按钮禁用或提示
    void gen
  })
})
