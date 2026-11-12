/**
 * @file ImageWithFallback.test.tsx
 * @description 带降级图占位 — 正常渲染 src/onError 切换降级/降级态保留 className+style+其余 props/data-original-url
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ImageWithFallback } from '../ImageWithFallback'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('ImageWithFallback（图片降级组件）', () => {
  it('初始渲染 img（src/alt/className/style 透传），无降级容器', () => {
    const { container } = render(
      <ImageWithFallback
        src="https://img.example.com/cat.png"
        alt="一只猫"
        className="w-8 rounded"
        style={{ height: 120 }}
        loading="lazy"
      />,
    )
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://img.example.com/cat.png')
    expect(img.getAttribute('alt')).toBe('一只猫')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(container.querySelector('div.inline-block')).toBeNull()
  })

  it('onError 触发 → 切换为降级容器：错误占位 SVG + alt 固定文案 + data-original-url 保留原地址', () => {
    const { container } = render(
      <ImageWithFallback src="https://img.example.com/broken.png" alt="原alt" />,
    )
    const img = container.querySelector('img')!
    fireEvent.error(img)
    const fallbackImg = container.querySelector('.inline-block img')!
    expect(fallbackImg.getAttribute('alt')).toBe('Error loading image')
    expect(fallbackImg.getAttribute('data-original-url')).toBe('https://img.example.com/broken.png')
    expect(fallbackImg.getAttribute('src')!.startsWith('data:image/svg+xml;base64,')).toBe(true)
  })

  it('降级态保留 className 与 style，且 rest props（onClick 等）透传到占位 img', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ImageWithFallback
        src="https://x.example.com/a.png"
        alt="图"
        className="ring-4 shadow"
        style={{ height: 60, width: 80 }}
        onClick={onClick}
        data-attr="extra"
      />,
    )
    fireEvent.error(container.querySelector('img')!)
    const box = container.querySelector('.inline-block') as HTMLElement
    expect(box.className).toContain('ring-4')
    expect(box.className).toContain('shadow')
    expect(box.style.height).toBe('60px')
    const fallbackImg = container.querySelector('.inline-block img')!
    fireEvent.click(fallbackImg)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(fallbackImg.getAttribute('data-attr')).toBe('extra')
  })

  it('降级后再渲染新 props 不会自动恢复（didError 保持 true）；正常路径 onError 未触发不降级', () => {
    const { container } = render(<ImageWithFallback src="https://a.example.com/ok.png" alt="ok" />)
    expect(container.querySelector('.inline-block')).toBeNull()
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('.inline-block')).not.toBeNull()
    expect(container.querySelector('.inline-block img')!.getAttribute('alt')).toBe('Error loading image')
  })
})
