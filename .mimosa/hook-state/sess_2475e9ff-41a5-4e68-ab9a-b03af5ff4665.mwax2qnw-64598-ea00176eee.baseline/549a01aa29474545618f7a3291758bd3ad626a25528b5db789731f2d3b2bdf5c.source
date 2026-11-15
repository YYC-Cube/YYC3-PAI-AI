/**
 * @file PublishQueue.deep.test.tsx
 * @description 多平台发布队列专项 — localStorage 持久化/状态筛选/新建与定时任务/立即发布导出（clipboard+window.open）/展开详情与删除
 * 策略：真 theme-store + 真 localStorage；clipboard 与 window.open 按范本注桩
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

import { PublishQueue, type PublishTask } from '../PublishQueue'

// ── Fixtures / Helpers ──

const task = (over: Partial<PublishTask> = {}): PublishTask => ({
  id: 'pub_' + Math.random().toString(36).slice(2, 8),
  title: '示例任务',
  content: '示例内容',
  platforms: ['wechat'],
  status: 'draft',
  createdAt: Date.now() - 3600_000,
  ...over,
})

const seedTasks = (tasks: PublishTask[]) => {
  localStorage.setItem('yyc3-publish-queue', JSON.stringify(tasks))
}

const readTasks = (): PublishTask[] =>
  JSON.parse(localStorage.getItem('yyc3-publish-queue') || '[]')

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const filterBtn = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll('button')).find(b =>
    (b.textContent || '').replace(/\s*\(\d+\)$/, '').trim() === label,
  ) as HTMLButtonElement

const titleInput = (root: HTMLElement) =>
  root.querySelector('input[placeholder="文章标题 *"]') as HTMLInputElement

const contentArea = (root: HTMLElement) =>
  root.querySelector('textarea[placeholder="文章内容（支持 Markdown/HTML）"]') as HTMLTextAreaElement

/** 点任务卡片头部（含标题文本的可点击 div）展开详情 */
const expandTask = (root: HTMLElement, title: string) => {
  const span = Array.from(root.querySelectorAll('span')).find(
    s => s.textContent === title && (s as HTMLElement).style.overflow === 'hidden',
  )
  fireEvent.click(span!)
  return span!
}

let openMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  // jsdom 无 Clipboard API：注入桩（发布导出与复制路径）
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  })
  openMock = vi.fn()
  vi.stubGlobal('open', openMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PublishQueue（多平台发布队列）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<PublishQueue visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('visible 空态：标题/筛选页签/新建入口 + 暂无发布任务提示', () => {
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    expect(container.textContent).toContain('多平台发布')
    expect(container.textContent).toContain('管理内容发布任务')
    for (const label of ['全部', '草稿', '定时', '已发布', '失败']) {
      expect(filterBtn(container, label)).toBeTruthy()
    }
    expect(container.textContent).toContain('暂无发布任务')
    expect(container.textContent).toContain('点击「新建发布」创建你的第一个发布任务')
    expect(btnByText(container, '新建发布')).toBeTruthy()
  })

  it('种子任务渲染：标题/状态徽标/筛选计数/头部总数徽标/平台图标', () => {
    seedTasks([
      task({ id: 'pub_a', title: '草稿文章', status: 'draft', platforms: ['wechat', 'zhihu'] }),
      task({ id: 'pub_b', title: '定时文章', status: 'scheduled', scheduledAt: Date.now() + 86400_000 }),
      task({ id: 'pub_c', title: '失败文章', status: 'failed', error: '平台接口 403' }),
    ])
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    for (const title of ['草稿文章', '定时文章', '失败文章']) {
      expect(container.textContent).toContain(title)
    }
    for (const badge of ['草稿', '定时', '失败']) {
      expect(container.textContent).toContain(badge)
    }
    // 筛选计数
    expect(filterBtn(container, '全部').textContent).toContain('(3)')
    expect(filterBtn(container, '草稿').textContent).toContain('(1)')
    expect(filterBtn(container, '定时').textContent).toContain('(1)')
    expect(filterBtn(container, '失败').textContent).toContain('(1)')
    expect(filterBtn(container, '已发布').textContent).not.toContain('(')
    // 头部总数徽标 3 + 平台图标 title（公众号/知乎）
    expect(container.querySelector('span[title="公众号"]')).toBeTruthy()
    expect(container.querySelector('span[title="知乎"]')).toBeTruthy()
  })

  it('状态筛选：草稿只剩一条；无已发布任务时筛选落入空态', () => {
    seedTasks([
      task({ id: 'pub_a', title: '草稿文章', status: 'draft' }),
      task({ id: 'pub_b', title: '定时文章', status: 'scheduled' }),
    ])
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    fireEvent.click(filterBtn(container, '草稿'))
    expect(container.textContent).toContain('草稿文章')
    expect(container.textContent).not.toContain('定时文章')
    fireEvent.click(filterBtn(container, '已发布'))
    expect(container.textContent).toContain('暂无发布任务')
    // 回全部
    fireEvent.click(filterBtn(container, '全部'))
    expect(container.textContent).toContain('定时文章')
  })

  it('新建发布全流程：编辑器展开/校验禁用/平台多选/入队并持久化/表单重置', () => {
    seedTasks([task({ id: 'pub_seed', title: '存量任务' })])
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    fireEvent.click(btnByText(container, '新建发布'))
    expect(titleInput(container)).toBeTruthy()
    expect(contentArea(container)).toBeTruthy()
    expect(container.textContent).toContain('目标平台')
    // 空标题 → 创建禁用
    const createBtn = btnByText(container, '加入发布队列') as HTMLButtonElement
    expect(createBtn.disabled).toBe(true)
    // 有标题但取消唯一平台 → 仍禁用
    fireEvent.change(titleInput(container), { target: { value: '新任务标题' } })
    expect(createBtn.disabled).toBe(false)
    fireEvent.click(btnByText(container, '公众号'))
    expect(createBtn.disabled).toBe(true)
    // 恢复公众号并加选小红书
    fireEvent.click(btnByText(container, '公众号'))
    fireEvent.click(btnByText(container, '小红书'))
    fireEvent.change(contentArea(container), { target: { value: '新任务内容正文' } })
    fireEvent.click(createBtn)
    // 列表新增 + 持久化（新任务在首位，双平台，draft）
    expect(container.textContent).toContain('新任务标题')
    expect(container.textContent).toContain('存量任务')
    const saved = readTasks()
    expect(saved).toHaveLength(2)
    expect(saved[0].title).toBe('新任务标题')
    expect(saved[0].content).toBe('新任务内容正文')
    expect(saved[0].status).toBe('draft')
    expect(saved[0].platforms).toEqual(['wechat', 'xiaohongshu'])
    // 编辑器收起 + 表单重置
    expect(titleInput(container)).toBeFalsy()
  })

  it('定时发布：切定时出日期时间输入、按钮文案切换、scheduledAt 落库并展示计划时间', () => {
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    fireEvent.click(btnByText(container, '新建发布'))
    fireEvent.change(titleInput(container), { target: { value: '定时任务标题' } })
    fireEvent.click(btnByText(container, '定时发布'))
    expect(container.querySelector('input[type="date"]')).toBeTruthy()
    expect(container.querySelector('input[type="time"]')).toBeTruthy()
    expect(btnByText(container, '添加到定时队列')).toBeTruthy()
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-12-25' } })
    fireEvent.change(container.querySelector('input[type="time"]')!, { target: { value: '09:30' } })
    fireEvent.click(btnByText(container, '添加到定时队列'))
    // 状态徽标「定时」+ 展开后展示计划时间
    expect(container.textContent).toContain('定时任务标题')
    const saved = readTasks()
    expect(saved).toHaveLength(1)
    expect(saved[0].status).toBe('scheduled')
    expect(new Date(saved[0].scheduledAt!).getMonth()).toBe(11)
    expect(new Date(saved[0].scheduledAt!).getDate()).toBe(25)
    expandTask(container, '定时任务标题')
    expect(container.textContent).toContain('计划发布：12月25日 09:30')
  })

  it('展开详情：内容截断 200 字 + 平台 chips + 删除持久化', () => {
    const longContent = '长'.repeat(250) + '结尾标记'
    seedTasks([
      task({ id: 'pub_long', title: '长文任务', content: longContent, platforms: ['bilibili', 'twitter'] }),
    ])
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    expandTask(container, '长文任务')
    // 内容预览截断：省略号出现、结尾标记缺失
    expect(container.textContent).toContain('...')
    expect(container.textContent).not.toContain('结尾标记')
    // 平台明细 chips
    expect(container.textContent).toContain('B站')
    expect(container.textContent).toContain('Twitter')
    // 删除 → 列表与 localStorage 同步清空
    fireEvent.click(btnByText(container, '删除'))
    expect(container.textContent).toContain('暂无发布任务')
    expect(readTasks()).toHaveLength(0)
  })

  it('立即发布（导出）：剪贴板收到标题+内容、打开公众号创作后台、状态转已导出', () => {
    seedTasks([
      task({ id: 'pub_go', title: '导出任务', content: '导出内容', platforms: ['wechat'] }),
    ])
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    expandTask(container, '导出任务')
    fireEvent.click(btnByText(container, '立即发布'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('导出任务\n\n导出内容')
    expect(openMock).toHaveBeenCalledWith('https://mp.weixin.qq.com/', '_blank', 'noopener')
    expect(container.textContent).toContain('已导出·待平台粘贴')
  })

  it('失败/已发布任务的详情态：错误提示与发布信息', () => {
    seedTasks([
      task({ id: 'pub_err', title: '失败任务', status: 'failed', error: '平台鉴权失败' }),
      task({ id: 'pub_ok', title: '已发布任务', status: 'published', publishedAt: Date.now() - 60_000 }),
    ])
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    expandTask(container, '失败任务')
    expect(container.textContent).toContain('平台鉴权失败')
    expandTask(container, '已发布任务')
    expect(container.textContent).toMatch(/已发布：\d+月\d+日 \d{2}:\d{2}/)
    expect(container.textContent).toContain('查看已发布')
  })

  it('initialContent/initialTitle：跨面板传入自动展开编辑器并预填', () => {
    const { container } = render(
      <PublishQueue
        visible
        onClose={() => {}}
        initialTitle="预填标题"
        initialContent="# 预填正文"
      />,
    )
    expect(titleInput(container).value).toBe('预填标题')
    expect(contentArea(container).value).toBe('# 预填正文')
    // 预填可直接入队
    fireEvent.click(btnByText(container, '加入发布队列'))
    expect(readTasks()).toHaveLength(1)
    expect(readTasks()[0].title).toBe('预填标题')
    expect(readTasks()[0].content).toBe('# 预填正文')
  })

  it('编辑器取消：收起编辑器不产生任务', () => {
    const { container } = render(<PublishQueue visible onClose={() => {}} />)
    fireEvent.click(btnByText(container, '新建发布'))
    fireEvent.change(titleInput(container), { target: { value: '不会入库' } })
    fireEvent.click(btnByText(container, '取消'))
    expect(titleInput(container)).toBeFalsy()
    expect(container.textContent).toContain('暂无发布任务')
    expect(readTasks()).toHaveLength(0)
  })

  it('关闭布线：遮罩点击与头部 X 按钮触发 onClose', () => {
    const onClose = vi.fn()
    const { container } = render(<PublishQueue visible onClose={onClose} />)
    // 遮罩是外层 fixed 容器的第一个子元素
    fireEvent.click(container.firstElementChild!.firstElementChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
