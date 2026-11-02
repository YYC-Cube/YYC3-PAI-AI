/**
 * @file ContentPreview.deep.test.tsx
 * @description 内容预览面板专项 — 六平台预览渲染/Markdown→HTML→DOMPurify 净化/设备宽度切换/B站截断/关闭与发布布线
 * 策略：真 theme-store + 真 layout-engine + 真 DOMPurify；self-media-store 用真 Provider 注入 panelActions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useEffect } from 'react'

import { ContentPreview } from '../ContentPreview'
import {
  SelfMediaStoreProvider,
  useSelfMediaStore,
  type PanelActions,
} from '../../store/self-media-store'

// ── Fixtures / Helpers ──

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const deviceBtn = (root: HTMLElement, title: string) =>
  root.querySelector(`button[title="${title}"]`) as HTMLButtonElement

/** 设备框架 div（style 中含 width: Npx） */
const frameByWidth = (root: HTMLElement, px: number) =>
  root.querySelector(`div[style*="width: ${px}px"]`)

/** 真 self-media-store 注入器：向 Context 注册 panelActions（App.tsx 同款注入路径） */
function PanelActionsHarness({ actions }: { actions: PanelActions }) {
  const { setPanelActions } = useSelfMediaStore()
  useEffect(() => { setPanelActions(actions) }, [actions, setPanelActions])
  return null
}

const renderWithActions = (ui: React.ReactElement, actions: PanelActions) =>
  render(
    <SelfMediaStoreProvider>
      <PanelActionsHarness actions={actions} />
      {ui}
    </SelfMediaStoreProvider>,
  )

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe('ContentPreview（内容预览面板）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<ContentPreview visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('visible 渲染骨架：标题/平台侧栏六平台/三档设备按钮/默认公众号预览与空内容占位', () => {
    const { container } = render(<ContentPreview visible onClose={() => {}} />)
    expect(container.textContent).toContain('内容预览')
    expect(container.textContent).toContain('模拟各平台展示效果')
    expect(container.textContent).toContain('选择平台')
    for (const name of ['公众号', '小红书', '知乎', 'B站', 'Twitter', '网页']) {
      expect(btnByText(container, name)).toBeTruthy()
    }
    // 设备三档按钮（title 布线）
    for (const title of ['手机视图', '平板视图', '桌面视图']) {
      expect(deviceBtn(container, title)).toBeTruthy()
    }
    // 默认平台 wechat：品牌署名 + 在看 CTA + 空内容占位
    expect(container.textContent).toContain('YYC³ 创作引擎')
    expect(container.textContent).toContain('点个「在看」')
    expect(container.textContent).toContain('在此输入内容以预览各平台展示效果')
    // 手机模式下公众号设备宽 400px
    expect(frameByWidth(container, 400)).toBeTruthy()
  })

  it('Markdown 渲染：h2/strong/inline code 进入预览 DOM', () => {
    const { container } = render(
      <ContentPreview
        visible
        onClose={() => {}}
        title="渲染用例"
        content={'## 二级标题\n\n**加粗文本** 与 `行内代码`'}
      />,
    )
    const h2 = container.querySelector('.preview-content h2')!
    expect(h2).toBeTruthy()
    expect(h2.textContent).toBe('二级标题')
    expect(container.querySelector('.preview-content strong')!.textContent).toBe('加粗文本')
    expect(container.querySelector('.preview-content code')!.textContent).toBe('行内代码')
    // 标题 prop 透传到公众号文章头
    expect(container.textContent).toContain('渲染用例')
  })

  it('XSS 净化：script 标签被剥离；img onerror 句柄被剥离但 src 保留', () => {
    const { container } = render(
      <ContentPreview
        visible
        onClose={() => {}}
        content={'# 标题\n\n<script>steal("secret")</script>'}
      />,
    )
    expect(container.querySelector('.preview-content script')).toBeNull()
    expect(container.textContent).not.toContain('steal')

    const { container: c2 } = render(
      <ContentPreview
        visible
        onClose={() => {}}
        content={'<img src="https://evil.example.com/x.png" onerror="fetch(\'//evil\')">'}
      />,
    )
    const img = c2.querySelector('.preview-content img')!
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://evil.example.com/x.png')
    expect(img.getAttribute('onerror')).toBeNull()
  })

  it('平台切换：六平台各自标志性内容渲染', () => {
    const { container } = render(
      <ContentPreview visible onClose={() => {}} title="跨端标题" content="正文内容" />,
    )
    // 小红书：封面 + 标签 + 互动栏
    fireEvent.click(btnByText(container, '小红书'))
    expect(container.textContent).toContain('跨端标题')
    expect(container.textContent).toContain('#自媒体')
    expect(container.textContent).toContain('1.2k')
    // 知乎：赞同/评论操作栏
    fireEvent.click(btnByText(container, '知乎'))
    expect(container.textContent).toContain('赞同 256')
    expect(container.textContent).toContain('评论 32')
    // B站：视频封面区 + 播放统计
    fireEvent.click(btnByText(container, 'B站'))
    expect(container.textContent).toContain('视频封面区域')
    expect(container.textContent).toContain('10.5万播放')
    expect(container.textContent).toContain('12:34')
    // Twitter：作者行 @yyc3_engine
    fireEvent.click(btnByText(container, 'Twitter'))
    expect(container.textContent).toContain('@yyc3_engine')
    // 网页：封面图占位 + 分享到
    fireEvent.click(btnByText(container, '网页'))
    expect(container.textContent).toContain('封面图片')
    expect(container.textContent).toContain('分享到 知乎')
    // 回到公众号
    fireEvent.click(btnByText(container, '公众号'))
    expect(container.textContent).toContain('关注 YYC³ 获取更多内容')
  })

  it('initialPlatform 指定初始平台（B站）', () => {
    const { container } = render(
      <ContentPreview visible onClose={() => {}} initialPlatform="bilibili" content="内容" />,
    )
    // B站设备宽 400 + 视频封面区域初始即渲染
    expect(container.textContent).toContain('视频封面区域')
    expect(frameByWidth(container, 400)).toBeTruthy()
  })

  it('设备宽度切换：手机=平台宽(400) → 平板 600 → 桌面 800 → 回手机 400', () => {
    const { container } = render(<ContentPreview visible onClose={() => {}} content="内容" />)
    expect(frameByWidth(container, 400)).toBeTruthy()
    fireEvent.click(deviceBtn(container, '平板视图'))
    expect(frameByWidth(container, 600)).toBeTruthy()
    fireEvent.click(deviceBtn(container, '桌面视图'))
    expect(frameByWidth(container, 800)).toBeTruthy()
    fireEvent.click(deviceBtn(container, '手机视图'))
    expect(frameByWidth(container, 400)).toBeTruthy()
    expect(frameByWidth(container, 800)).toBeNull()
  })

  it('B站预览截断 300 字符：长文尾部标记缺失，网页端完整展示', () => {
    const longContent =
      Array.from({ length: 12 }, (_, i) => `第${i}段占位内容`).join('\n\n') + '\n\n尾部标记ZZZ'
    const { container } = render(
      <ContentPreview visible onClose={() => {}} content={longContent} />,
    )
    fireEvent.click(btnByText(container, 'B站'))
    expect(container.textContent).toContain('第0段占位内容')
    expect(container.textContent).not.toContain('尾部标记ZZZ')
    fireEvent.click(btnByText(container, '网页'))
    expect(container.textContent).toContain('尾部标记ZZZ')
  })

  it('content prop 变化响应：rerender 后预览更新为新内容', () => {
    const { container, rerender } = render(
      <ContentPreview visible onClose={() => {}} content="# 旧内容标题" />,
    )
    expect(container.querySelector('.preview-content h1')!.textContent).toBe('旧内容标题')
    rerender(<ContentPreview visible onClose={() => {}} content="# 新内容标题" />)
    expect(container.querySelector('.preview-content h1')!.textContent).toBe('新内容标题')
  })

  it('关闭布线：遮罩点击与右上角 X 按钮均触发 onClose', () => {
    const onClose = vi.fn()
    const { container } = render(<ContentPreview visible onClose={onClose} content="内容" />)
    // 遮罩是外层 fixed 容器的第一个子元素
    fireEvent.click(container.firstElementChild!.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
    // X 按钮：标题栏中唯一含 lucide-x 图标的按钮（侧栏平台按钮在 DOM 中位于其后）
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('发布按钮：经真 self-media-store 注入的 panelActions.openPublishQueue 收到渲染后 HTML 与标题', () => {
    const actions: PanelActions = {
      openAIWriting: vi.fn(),
      openMaterialManager: vi.fn(),
      openContentPreview: vi.fn(),
      openEditor: vi.fn(),
      openPublishQueue: vi.fn(),
      openTrendingTopics: vi.fn(),
    }
    const { container } = renderWithActions(
      <ContentPreview visible onClose={() => {}} title="发布标题" content="# 发布内容" />,
      actions,
    )
    fireEvent.click(btnByText(container, '发布'))
    expect(actions.openPublishQueue).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(actions.openPublishQueue).mock.calls[0][0]!
    expect(arg.title).toBe('发布标题')
    expect(arg.content).toContain('<h1')
    expect(arg.content).toContain('发布内容')
  })

  it('无 Provider 时发布按钮不崩溃（panelActions 缺省为 null 的兜底路径）', () => {
    const { container } = render(
      <ContentPreview visible onClose={() => {}} content="# 兜底内容" />,
    )
    fireEvent.click(btnByText(container, '发布'))
    // 仍渲染正常，无异常抛出
    expect(container.textContent).toContain('内容预览')
  })
})
