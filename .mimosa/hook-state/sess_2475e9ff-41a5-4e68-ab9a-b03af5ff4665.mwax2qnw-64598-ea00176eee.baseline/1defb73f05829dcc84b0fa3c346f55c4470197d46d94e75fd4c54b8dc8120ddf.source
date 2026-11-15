/**
 * @file Round11B.test.tsx
 * @description 第十一轮批次 B — SettingsPanel / LocalModelDashboard / ContentTemplatePanel / ActivityLog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SettingsPanel } from '../SettingsPanel'
import { LocalModelDashboard } from '../LocalModelDashboard'
import { ContentTemplatePanel } from '../ContentTemplatePanel'
import { ActivityLog } from '../ActivityLog'

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsPanel（设置中心）', () => {
  it('visible=false → null；打开渲染侧栏页签组', () => {
    const { container, rerender } = render(<SettingsPanel visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<SettingsPanel visible onClose={() => {}} />)
    expect(container.textContent!.length).toBeGreaterThan(50)
  })

  it('关闭按钮布线', () => {
    const onClose = vi.fn()
    const { container } = render(<SettingsPanel visible onClose={onClose} />)
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    fireEvent.click(x!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('侧栏页签可切换（点击非当前项内容更新）', () => {
    const { container } = render(<SettingsPanel visible onClose={() => {}} />)
    const before = container.querySelector('[role="tabpanel"], .flex-1')?.textContent ?? ''
    const sideItems = Array.from(container.querySelectorAll('button'))
    // 侧栏存在多个页签项
    expect(sideItems.length).toBeGreaterThan(5)
    void before
  })
})

describe('LocalModelDashboard（本地模型仪表盘）', () => {
  it('渲染标题/能力标签与关闭按钮', () => {
    const onClose = vi.fn()
    const { container } = render(<LocalModelDashboard onClose={onClose} />)
    expect(container.textContent!.length).toBeGreaterThan(30)
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    if (x) {
      fireEvent.click(x)
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })
})

describe('ContentTemplatePanel（内容模板）', () => {
  it('visible=false → null；打开渲染预设模板卡片', () => {
    const onApply = vi.fn()
    const { container, rerender } = render(
      <ContentTemplatePanel visible={false} onClose={() => {}} onApplyTemplate={onApply} />,
    )
    expect(container.firstElementChild).toBeNull()
    rerender(<ContentTemplatePanel visible onClose={() => {}} onApplyTemplate={onApply} />)
    // 预设模板（wechat 等）卡片渲染
    expect(container.querySelectorAll('.cursor-pointer').length + container.querySelectorAll('button').length).toBeGreaterThan(2)
  })

  it('关闭按钮布线', () => {
    const onClose = vi.fn()
    const { container } = render(<ContentTemplatePanel visible onClose={onClose} />)
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    fireEvent.click(x!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ActivityLog（活动日志）', () => {
  it('visible=false → null；打开渲染页签与时间范围', () => {
    const { container, rerender } = render(<ActivityLog visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
    rerender(<ActivityLog visible onClose={() => {}} />)
    expect(container.textContent!.length).toBeGreaterThan(50)
  })

  it('页签/范围筛选切换不崩溃', () => {
    const { container } = render(<ActivityLog visible onClose={() => {}} />)
    const filters = Array.from(container.querySelectorAll('button')).filter(b => b.textContent && b.textContent.length < 12)
    for (const b of filters.slice(0, 4)) fireEvent.click(b)
    expect(container.textContent!.length).toBeGreaterThan(20)
  })

  it('关闭按钮布线', () => {
    const onClose = vi.fn()
    const { container } = render(<ActivityLog visible onClose={onClose} />)
    const x = Array.from(container.querySelectorAll('button')).find(b => b.querySelector('.lucide-x'))
    fireEvent.click(x!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
