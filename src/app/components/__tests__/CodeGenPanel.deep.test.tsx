/**
 * @file CodeGenPanel.deep.test.tsx
 * @description 代码生成面板专项 — 五段流水线（假时钟推进）/文件生成与选择/模板内容/样式与类型文件/复制下载/遮罩关闭
 * 策略：真 theme-store + 真 CyberTooltip（i18n 走无 Provider 中文兜底）；cyberToast 用 vi.mock 桩，clipboard 注桩
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

const h = vi.hoisted(() => ({ toast: vi.fn() }))

vi.mock('../CyberToast', () => ({
  cyberToast: h.toast,
}))

import { CodeGenPanel } from '../CodeGenPanel'
import type { DesignRoot } from '../../types'

// ── Fixtures / Helpers ──

const scale = (base: string) => ({
  50: base, 100: base, 200: base, 300: base, 400: base, 500: base,
  600: base, 700: base, 800: base, 900: base,
})

const designJson: DesignRoot = {
  version: '4.7.2',
  theme: 'dark',
  tokens: 'legacy-token-string',
  panels: [
    { id: 'panel-1', type: 'content', layout: { x: 0, y: 0, w: 6, h: 4 }, style: {} },
  ],
  components: [
    { id: 'comp-btn', type: 'Button', props: { text: '点击我', variant: 'primary' }, style: {} },
    { id: 'comp-input', type: 'Input', props: { placeholder: '请输入内容' }, style: {} },
    { id: 'comp-card', type: 'Card', props: {}, style: {} },
  ],
  styles: {
    theme: {
      name: '赛博测试主题',
      mode: 'dark',
      colors: {
        background: '#0a0a0a', foreground: '#fafafa', primary: '#00f0ff',
        secondary: '#ff2442', accent: '#f59e0b', muted: '#6b7280',
        border: '#1f2937', input: '#111827', ring: '#00f0ff',
      },
    },
    tokens: {
      colors: {
        primary: scale('#00f0ff'), secondary: scale('#ff2442'), success: scale('#22c55e'),
        warning: scale('#f59e0b'), error: scale('#ef4444'), neutral: scale('#6b7280'),
      },
      spacing: {
        0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
        6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px',
      },
      typography: {
        fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['Fira Code', 'monospace'] },
        fontSize: {}, fontWeight: {}, lineHeight: {},
      },
      borderRadius: {
        none: '0', sm: '4px', base: '6px', md: '8px',
        lg: '12px', xl: '16px', '2xl': '24px', full: '9999px',
      },
      shadows: { xs: '0 1px', sm: '0 2px', base: '0 4px', md: '0 8px', lg: '0 16px', xl: '0 32px' },
      transitions: { fast: '100ms', normal: '200ms', slow: '400ms' },
    },
    components: {},
  },
}

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

/** 文件头工具按钮（经 CyberTooltip 包裹：父容器含 tooltip label 文本） */
const toolBtn = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll('button')).find(b =>
    (b.parentElement?.textContent || '').includes(label),
  )!

/** 推进假时钟并冲刷 React 状态 */
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.useFakeTimers()
  // jsdom 无 Clipboard API：注入桩供「复制」用例断言
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CodeGenPanel（代码生成面板）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(
      <CodeGenPanel visible={false} onClose={() => {}} designJson={designJson} />,
    )
    expect(container.firstElementChild).toBeNull()
  })

  it('visible 渲染骨架：标题/五段流水线标签/开始生成按钮/右侧空态与日志等待态', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    expect(container.textContent).toContain('代码生成引擎')
    for (const step of ['读取 Design JSON', '模板匹配', '生成代码', '代码格式化', '类型检查']) {
      expect(container.textContent).toContain(step)
    }
    const genBtn = btnByText(container, '开始生成') as HTMLButtonElement
    expect(genBtn.disabled).toBe(false)
    // 右侧空态
    expect(container.textContent).toContain('运行代码生成引擎')
    // 日志空态
    expect(container.textContent).toContain('等待生成...')
  })

  it('designJson 缺失：点击生成仅 toast 提示，不进入流水线', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={null} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    expect(h.toast).toHaveBeenCalledWith('未找到 Design JSON 数据')
    // 仍处 idle：无日志产生、按钮文案未变
    expect(container.textContent).toContain('等待生成...')
    expect(btnByText(container, '开始生成')).toBeTruthy()
  })

  it('完整流水线（假时钟）：五段日志推进 → done 徽标 + 5 文件 + onCodeGenerated 回调 + 成功 toast', () => {
    const onCodeGenerated = vi.fn()
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} onCodeGenerated={onCodeGenerated} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    // 400ms：READ 阶段两条日志
    advance(450)
    expect(container.textContent).toContain('[READ] Parsing Design JSON schema...')
    expect(container.textContent).toContain('[READ] Found 1 panels, 3 components')
    // 1250ms：MATCH 阶段
    advance(800)
    expect(container.textContent).toContain('[MATCH] Matched 3 component templates')
    // 生成中：按钮禁用
    expect((btnByText(container, '生成') as HTMLButtonElement).disabled).toBe(true)
    // 4.5s：全部完成
    advance(3300)
    expect(container.textContent).toMatch(/✓ 5 个文件 · \d+ 行/)
    expect(container.textContent).toContain('[CHECK] ✓ No type errors found')
    expect(container.textContent).toMatch(/\[DONE\] Generated 5 files \(\d+ lines total\)/)
    for (const file of ['Button.tsx', 'Input.tsx', 'Card.tsx', 'theme.generated.css', 'types.generated.ts']) {
      expect(container.textContent).toContain(file)
    }
    expect(onCodeGenerated).toHaveBeenCalledTimes(1)
    const files = onCodeGenerated.mock.calls[0][0]
    expect(files).toHaveLength(5)
    expect(files.map((f: { fileName: string }) => f.fileName)).toContain('theme.generated.css')
    expect(h.toast).toHaveBeenCalledWith('成功生成 5 个文件')
    // done 后按钮恢复并可重新生成
    const regen = btnByText(container, '重新生成') as HTMLButtonElement
    expect(regen.disabled).toBe(false)
  })

  it('生成中按钮文案保持「开始生成」且禁用，完成后切换「重新生成」', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    advance(1000)
    const genBtn = btnByText(container, '开始生成') as HTMLButtonElement
    expect(genBtn.disabled).toBe(true)
    advance(3300)
    expect(btnByText(container, '重新生成')).toBeTruthy()
    // 二次生成：日志清零后重新累积
    fireEvent.click(btnByText(container, '重新生成'))
    advance(450)
    expect(container.textContent).toContain('[READ] Parsing Design JSON schema...')
    advance(4100)
    expect(container.textContent).toMatch(/✓ 5 个文件/)
  })

  it('样式文件预览：theme.generated.css 含主题色 CSS 变量与元信息注释', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    advance(4400)
    fireEvent.click(btnByText(container, 'theme.generated.css'))
    expect(container.textContent).toContain('Theme: 赛博测试主题 | Mode: dark')
    expect(container.textContent).toContain('--color-primary: #00f0ff')
    expect(container.textContent).toContain('--font-mono: Fira Code, monospace')
    // 语言徽标 + 行号槽（宽 44px 的序号列）
    expect(container.textContent).toContain('CSS')
    expect(container.querySelector('span[style*="width: 44px"]')).toBeTruthy()
  })

  it('类型文件预览：types.generated.ts 按组件 props 生成接口，无 props 组件给占位注释', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    advance(4400)
    fireEvent.click(btnByText(container, 'types.generated.ts'))
    expect(container.textContent).toContain('export interface ButtonProps')
    expect(container.textContent).toContain('text: string')
    expect(container.textContent).toContain('export interface InputProps')
    expect(container.textContent).toContain('placeholder: string')
    expect(container.textContent).toContain('export interface CardProps')
    expect(container.textContent).toContain('// No props defined')
  })

  it('Button 模板内容：text/variant props 内插到生成代码', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    advance(4400)
    fireEvent.click(btnByText(container, 'Button.tsx'))
    expect(container.textContent).toContain("children || '点击我'")
    expect(container.textContent).toContain("variant = 'primary'")
    expect(container.textContent).toContain('TSX')
  })

  it('复制代码：clipboard.writeText 收到选中文件全文；失败走失败 toast', async () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    advance(4400)
    fireEvent.click(btnByText(container, 'Card.tsx'))
    fireEvent.click(toolBtn(container, '复制代码')!)
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    expect(copied).toContain('interface CardProps')
    await act(async () => { /* 冲剪贴板 then 微任务 */ })
    expect(h.toast).toHaveBeenCalledWith('代码已复制')
    // 剪贴板被拒 → 失败分支
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'))
    fireEvent.click(toolBtn(container, '复制代码')!)
    await act(async () => {})
    expect(h.toast).toHaveBeenCalledWith('复制失败')
  })

  it('下载按钮：触发下载 toast', () => {
    const { container } = render(
      <CodeGenPanel visible onClose={() => {}} designJson={designJson} />,
    )
    fireEvent.click(btnByText(container, '开始生成'))
    advance(4400)
    fireEvent.click(toolBtn(container, '下载文件')!)
    expect(h.toast).toHaveBeenCalledWith('文件下载已触发')
  })

  it('关闭布线：遮罩点击触发 onClose，面板内部点击不关闭', () => {
    const onClose = vi.fn()
    const { container } = render(
      <CodeGenPanel visible onClose={onClose} designJson={designJson} />,
    )
    // 内部面板点击
    fireEvent.click(container.firstElementChild!.firstElementChild!)
    expect(onClose).not.toHaveBeenCalled()
    // 遮罩（外层 fixed 容器本身）
    fireEvent.click(container.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
