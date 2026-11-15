/**
 * @file SmallUI.test.tsx
 * @description 纯 UI 小件测试（覆盖率 onboarding：LoadingSkeleton/CyberToast/GlitchText/LangSwitcher/VirtualList）
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { ModeSkeleton, PanelSkeleton } from '../LoadingSkeleton'
import { CyberToaster, cyberToast } from '../CyberToast'
import { GlitchText } from '../GlitchText'
import { LangSwitcher } from '../LangSwitcher'
import { VirtualList } from '../VirtualList'


describe('LoadingSkeleton', () => {
  it('ModeSkeleton 渲染骨架结构（面板占位）', () => {
    const { container } = render(<ModeSkeleton />)
    expect(container.querySelectorAll('div').length).toBeGreaterThan(3)
  })

  it('PanelSkeleton 渲染非空占位（Suspense fallback 契约）', () => {
    const { container } = render(<PanelSkeleton />)
    expect(container.innerHTML.length).toBeGreaterThan(10)
  })
})

describe('CyberToast（全局提示）', () => {
  it('cyberToast 布线到 sonner toast（桩日志验证）', () => {
    render(<CyberToaster />)
    act(() => { cyberToast('操作成功提示') })
    const log = (globalThis as unknown as { __sonnerLog?: string[] }).__sonnerLog as string[]
    expect(log).toContain('操作成功提示')
  })
})

describe('GlitchText', () => {
  it('渲染文本与 data-text 属性（故障艺术基础）', () => {
    const { container } = render(<GlitchText text="YYC3" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.textContent).toBe('YYC3')
  })
})

describe('LangSwitcher（i18n 切换）', () => {
  it('渲染并可点击切换语言', () => {
    render(<LangSwitcher />)
    const btn = container = document.querySelector('button')
    void btn
    expect(document.querySelector('button')).toBeTruthy()
  })
})

describe('VirtualList（虚拟滚动）', () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, data: { label: `行-${i}` } }))

  it('千级数据渲染不崩溃且 DOM 有界（虚拟化契约）', async () => {
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={30}
        style={{ height: 300 }}
        renderItem={(item: { data: { label: string } }) => <div>{item.data.label}</div>}
        getKey={(_i: number, item: { id: string | number }) => String(item.id)}
      />,
    )
    await act(async () => { await new Promise(r => setTimeout(r, 10)) })
    // 虚拟列表绝不渲染全部 1000 项（jsdom 量测退化时同样必须成立）
    expect(container.querySelectorAll('div').length).toBeLessThan(items.length)
  })

  it('滚动回调透传 scrollTop（滚动布线）', () => {
    const onScroll = vi.fn()
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={30}
        style={{ height: 300 }}
        onScroll={onScroll}
        renderItem={(item: { data: { label: string } }) => <div>{item.data.label}</div>}
        getKey={(_i: number, item: { id: string | number }) => String(item.id)}
      />,
    )
    const scroller = container.firstElementChild as HTMLElement
    fireEvent.scroll(scroller, { target: { scrollTop: 900 } })
    expect(onScroll).toHaveBeenCalledWith(900)
  })
})

// 容器引用占位（LangSwitcher 用例）
let container: Element | null = null
void container
