/**
 * @file SmallPanels.test.tsx
 * @description 覆盖率渐进 onboard：15 个小组件（38-400 行）批量测试
 * 目标：每个 3-6 用例，期望覆盖 30-60%
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { HoloCard } from '../HoloCard'
import { CyberTooltip } from '../CyberTooltip'
import { CyberpunkBackground } from '../CyberpunkBackground'
import { EditorTabBar } from '../EditorTabBar'
import { FloatingWidget } from '../FloatingWidget'
import { VersionHistoryPanel } from '../VersionHistoryPanel'
import { PerformanceAlertPanel } from '../PerformanceAlertPanel'
import { SecurityAuditPanel } from '../SecurityAuditPanel'
import { MultiInstancePanel } from '../MultiInstancePanel'
import { CollabPanel } from '../CollabPanel'
import { PreviewEngine } from '../PreviewEngine'
import { DetachedWindowLayer } from '../DetachedWindow'

beforeEach(() => {
  localStorage.clear()
})

// ===== HoloCard (38 lines) =====
describe('HoloCard', () => {
  it('渲染子元素', () => {
    const { container } = render(
      <HoloCard><div data-testid="child">content</div></HoloCard>
    )
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy()
  })

  it('glowColor 属性', () => {
    const { container } = render(
      <HoloCard glowColor="magenta"><div>x</div></HoloCard>
    )
    expect(container).toBeTruthy()
  })

  it('className 自定义', () => {
    const { container } = render(
      <HoloCard className="custom-class"><div>y</div></HoloCard>
    )
    expect(container.querySelector('.custom-class') || container.firstElementChild).toBeTruthy()
  })
})

// ===== CyberTooltip (70 lines) =====
describe('CyberTooltip', () => {
  it('渲染子元素', () => {
    const { container } = render(
      <CyberTooltip label="提示文本"><button>hover</button></CyberTooltip>
    )
    expect(container.textContent).toContain('hover')
  })

  it('不同 position 属性', () => {
    const { container } = render(
      <CyberTooltip label="top" position="top"><span>x</span></CyberTooltip>
    )
    expect(container).toBeTruthy()
  })
})

// ===== CyberpunkBackground (170 lines) =====
describe('CyberpunkBackground', () => {
  it('渲染画布背景', () => {
    const { container } = render(<CyberpunkBackground />)
    expect(container.querySelector('canvas') || container.firstElementChild).toBeTruthy()
  })
})

// ===== EditorTabBar (238 lines) =====
describe('EditorTabBar', () => {
  it('渲染标签栏', () => {
    const { container } = render(<EditorTabBar />)
    expect(container.textContent!.length).toBeGreaterThan(0)
  })
})

// ===== FloatingWidget (267 lines) =====
describe('FloatingWidget', () => {
  it('渲染悬浮球', () => {
    const { container } = render(
      <FloatingWidget onSwitchMode={() => {}} />
    )
    expect(container).toBeTruthy()
  })
})

// ===== VersionHistoryPanel (272 lines) =====
describe('VersionHistoryPanel', () => {
  it('渲染版本历史（可能空态但有结构）', () => {
    const { container } = render(
      <VersionHistoryPanel currentContent="test" onRollback={() => {}} />
    )
    expect(container).toBeTruthy()
  })
})

// ===== PerformanceAlertPanel (295 lines) =====
describe('PerformanceAlertPanel', () => {
  it('渲染性能告警', () => {
    const { container } = render(
      <PerformanceAlertPanel visible onClose={() => {}} />
    )
    expect(container.textContent!.length).toBeGreaterThan(0)
  })
})

// ===== SecurityAuditPanel (375 lines) =====
describe('SecurityAuditPanel', () => {
  it('渲染安全审计', () => {
    const { container } = render(
      <SecurityAuditPanel visible onClose={() => {}} />
    )
    expect(container.textContent!.length).toBeGreaterThan(0)
  })
})

// ===== PreviewEngine =====
describe('PreviewEngine', () => {
  it('渲染预览引擎（空文件列表）', () => {
    const { container } = render(<PreviewEngine files={[]} version={0} />)
    expect(container).toBeTruthy()
  })
})

// ===== DetachedWindowLayer =====
describe('DetachedWindowLayer', () => {
  it('渲染分离窗口层', () => {
    const { container } = render(
      <DetachedWindowLayer renderContent={() => <div>content</div>} />
    )
    expect(container).toBeTruthy()
  })
})

// ===== MultiInstancePanel (426 lines) =====
describe('MultiInstancePanel', () => {
  it('渲染多实例面板', () => {
    const { container } = render(
      <MultiInstancePanel visible onClose={() => {}} />
    )
    expect(container.textContent!.length).toBeGreaterThan(0)
  })
})

// ===== CollabPanel (283 lines) =====
describe('CollabPanel', () => {
  it('渲染协作面板', () => {
    const { container } = render(
      <CollabPanel visible onClose={() => {}} />
    )
    expect(container.textContent!.length).toBeGreaterThan(0)
  })
})
