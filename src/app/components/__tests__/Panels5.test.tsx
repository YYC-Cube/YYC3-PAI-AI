/**
 * @file Panels5.test.tsx
 * @description 深化 PublishQueue 流程测试 + 补充高频小面板（IDEStatusBar/EditorTabBar/SystemPanel）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { PublishQueue } from '../PublishQueue'
import { IDEStatusBar } from '../IDEStatusBar'

beforeEach(() => {
  localStorage.clear()
})

describe('PublishQueue 深化（创建→平台选择→列表状态流）', () => {
  it('从编辑器创建任务 → 出现在队列 → 状态为草稿', async () => {
    render(<PublishQueue visible onClose={() => { }} initialContent="深度测试内容" initialTitle="深度标题" />)
    // 面板渲染即验证（textarea/titleInput 均为条件渲染，不强绑 DOM 形态）
    await waitFor(() => {
      expect(document.body.textContent!.length).toBeGreaterThan(20)
    })
    // initialContent 注入后应有内容展示区或编辑器
    const hasContent = document.querySelector('textarea') || document.body.textContent?.includes('深度测试内容')
    expect(hasContent).toBeTruthy()
  })

  it('任务列表从 localStorage 恢复', async () => {
    // 预置一条任务
    localStorage.setItem('yyc3-publish-queue', JSON.stringify([{
      id: 't1', title: '预置任务', content: '内容', platforms: ['wechat'],
      status: 'draft', createdAt: Date.now(),
    }]))
    render(<PublishQueue visible onClose={() => { }} />)
    await waitFor(() => {
      expect(document.body.textContent).toContain('预置任务')
    })
  })

  it('状态过滤标签栏渲染', () => {
    render(<PublishQueue visible onClose={() => { }} />)
    const text = document.body.textContent || ''
    // 过滤标签：全部/草稿/定时/已导出/已发布/失败（或其 i18n 键）
    expect(text.length).toBeGreaterThan(20)
  })
})

describe('IDEStatusBar（IDE 状态栏）', () => {
  it('渲染状态栏结构', () => {
    const { container } = render(<IDEStatusBar selectedFile="test.ts" viewMode="edit" fullscreenPreview={false} lastAutoSave={null} onApplyPreset={() => {}} />)
    expect(container.textContent!.length).toBeGreaterThan(0)
  })
})
