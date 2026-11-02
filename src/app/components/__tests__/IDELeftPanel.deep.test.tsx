/**
 * @file IDELeftPanel.deep.test.tsx
 * @description IDE 左侧面板专项深化 — 六图标导航切换 / 委托渲染 / 任务迷你面板(真 task-store) /
 *              全局搜索 / 快速访问(真 file-store+localStorage) / Git 静态视图
 * @note 无 I18nProvider 时 t() 回退返回 key（如 addTask / inferredTasks / noResults）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { IDELeftPanel } from '../IDELeftPanel'
import { taskStore } from '../../store/task-store'
import { fileStore } from '../../store/file-store'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  // 真 store 归零（模块级单例，需手动清空保证用例确定性）
  for (const t of taskStore.getState().tasks.slice()) taskStore.remove(t.id)
  fileStore.clearRecentFiles()
})

/** 左侧图标导航栏（根节点第一个子 div），按 lucide 图标类定位按钮 */
const rail = (c: HTMLElement) => c.firstElementChild!.firstElementChild as HTMLElement
const railBtn = (c: HTMLElement, icon: string) =>
  Array.from(rail(c).querySelectorAll('button')).find(b => b.querySelector(`svg.${icon}`))!
/** 面板内容区（根节点第二个子 div） */
const panel = (c: HTMLElement) => c.firstElementChild!.children[1] as HTMLElement

const mount = (over: { defaultTab?: Parameters<typeof IDELeftPanel>[0]['defaultTab'] } = {}) =>
  render(
    <IDELeftPanel
      renderFileExplorer={vi.fn(() => <div data-testid="fx-body">文件树主体</div>)}
      renderAIChat={vi.fn(() => <div data-testid="ai-body">AI 对话主体</div>)}
      {...over}
    />,
  )

describe('IDELeftPanel 图标导航与委托渲染', () => {
  it('渲染六个图标导航（file/ai/task/search/quick/git 全在 rail 上）', () => {
    const { container } = mount()
    const icons = [
      'lucide-folder-open', 'lucide-message-square', 'lucide-list-todo',
      'lucide-search', 'lucide-clock', 'lucide-git-branch',
    ]
    for (const ic of icons) expect(railBtn(container, ic)).toBeTruthy()
    expect(rail(container).querySelectorAll('button')).toHaveLength(6)
  })

  it('默认激活 file-explorer：仅委托渲染文件浏览器，AI 聊天体不出现', () => {
    const { container } = mount()
    expect(container.textContent).toContain('文件树主体')
    expect(container.textContent).not.toContain('AI 对话主体')
  })

  it('点击 ai-assistant 图标 → 委托体切换为 AI 聊天（文件树被替换）', () => {
    const { container } = mount()
    fireEvent.click(railBtn(container, 'lucide-message-square'))
    expect(container.textContent).toContain('AI 对话主体')
    expect(container.textContent).not.toContain('文件树主体')
  })

  it('defaultTab="task-manager" 初始即任务面板，且不调用 renderFileExplorer', () => {
    const renderFileExplorer = vi.fn(() => <div>文件树主体</div>)
    const { container } = render(
      <IDELeftPanel
        renderFileExplorer={renderFileExplorer}
        renderAIChat={vi.fn(() => null)}
        defaultTab="task-manager"
      />,
    )
    expect(renderFileExplorer).not.toHaveBeenCalled()
    expect(panel(container).textContent).toContain('taskManager')
  })
})

describe('TaskManagerMiniPanel 任务迷你面板（真 task-store）', () => {
  const mountTask = () => mount({ defaultTab: 'task-manager' })
  const titleSpans = (c: HTMLElement) =>
    Array.from(panel(c).querySelectorAll('span.flex-1')) as HTMLElement[]

  it('空标题回车不建卡；输入标题回车 → 列表出现 + 底部统计 todo: 1 + 输入框清空', () => {
    const { container } = mountTask()
    const input = panel(container).querySelector('input')!
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(taskStore.getState().tasks).toHaveLength(0)

    fireEvent.change(input, { target: { value: '左侧栏新建任务' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    const tasks = taskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('左侧栏新建任务')
    expect(tasks[0].status).toBe('todo')
    expect(input.value).toBe('')
    expect(container.textContent).toContain('todo: 1')
  })

  it('筛选下拉切到 done → 仅显示已完成任务', () => {
    act(() => {
      const a = taskStore.add('待办甲', '', 'medium', [])
      const b = taskStore.add('完成乙', '', 'medium', [])
      taskStore.moveStatus(b, 'done')
      void a
    })
    const { container } = mountTask()
    expect(container.textContent).toContain('待办甲')
    expect(container.textContent).toContain('完成乙')

    fireEvent.change(panel(container).querySelector('select')!, { target: { value: 'done' } })
    expect(container.textContent).not.toContain('待办甲')
    expect(container.textContent).toContain('完成乙')

    fireEvent.change(panel(container).querySelector('select')!, { target: { value: 'all' } })
    expect(container.textContent).toContain('待办甲')
  })

  it('状态切换按钮：todo → done 划线，再点回 todo 取消划线', () => {
    act(() => { taskStore.add('切换划线任务', '', 'medium', []) })
    const { container } = mountTask()
    const row = Array.from(panel(container).querySelectorAll('div.group'))
      .find(d => d.textContent!.includes('切换划线任务'))!
    const toggleBtn = row.querySelector('button')!
    fireEvent.click(toggleBtn)
    expect(taskStore.getState().tasks[0].status).toBe('done')

    let span = Array.from(panel(container).querySelectorAll('span.flex-1'))
      .find(s => s.textContent === '切换划线任务') as HTMLElement
    expect(span.style.textDecoration).toContain('line-through')

    fireEvent.click(Array.from(panel(container).querySelectorAll('div.group'))
      .find(d => d.textContent!.includes('切换划线任务'))!.querySelector('button')!)
    span = Array.from(panel(container).querySelectorAll('span.flex-1'))
      .find(s => s.textContent === '切换划线任务') as HTMLElement
    expect(taskStore.getState().tasks[0].status).toBe('todo')
    expect(span.style.textDecoration).not.toContain('line-through')
  })

  it('删除按钮 → remove 入库，列表与统计同步减少', () => {
    act(() => {
      taskStore.add('将被删除', '', 'medium', [])
      taskStore.add('幸存者', '', 'medium', [])
    })
    const { container } = mountTask()
    const delBtn = Array.from(panel(container).querySelectorAll('button'))
      .find(b => b.querySelector('svg.lucide-trash-2') && b.closest('div.group')!.textContent!.includes('将被删除'))!
    fireEvent.click(delBtn)
    const tasks = taskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('幸存者')
    expect(container.textContent).not.toContain('将被删除')
    expect(titleSpans(container).length).toBe(1)
  })

  it('子任务计数 x/y 渲染（toggle 后 1/3）', () => {
    act(() => {
      const id = taskStore.add('父任务', '', 'medium', [])
      taskStore.addSubtask(id, '子甲')
      taskStore.addSubtask(id, '子乙')
      taskStore.addSubtask(id, '子丙')
      const st = taskStore.getState().tasks.find(t => t.id === id)!.subtasks
      taskStore.toggleSubtask(id, st[0].id)
    })
    const { container } = mountTask()
    expect(container.textContent).toContain('1/3')
  })

  it('AI 推理按钮 → fallback 演示结果 2 条；接受一条 → 入库带 AI 徽标且剩余计数 1', async () => {
    const { container } = mountTask()
    // 无 ModelStoreProvider：sendToActiveModel 回退返回 "" → parse 为空 → 走内置演示数据
    fireEvent.click(Array.from(panel(container).querySelectorAll('button'))
      .find(b => b.querySelector('svg.lucide-brain'))!)
    await waitFor(() => expect(container.textContent).toContain('inferredTasks (2)'))

    const scrollLists = panel(container).querySelectorAll('div.neon-scrollbar')
    expect(scrollLists.length).toBeGreaterThanOrEqual(2)
    const inferList = scrollLists[scrollLists.length - 1]
    const acceptBtns = Array.from(inferList.querySelectorAll('button'))
    expect(acceptBtns.length).toBe(2)
    fireEvent.click(acceptBtns[0])

    const tasks = taskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].source).toBe('ai-inferred')
    expect(container.textContent).toContain('AI')
    expect(container.textContent).toContain('inferredTasks (1)')
  })
})

describe('GlobalSearchMiniPanel 全局搜索', () => {
  const mountSearch = () => mount({ defaultTab: 'global-search' })

  it('输入 store 匹配多个结果；清空按钮复位为提示态', () => {
    const { container } = mountSearch()
    const input = panel(container).querySelector('input')!
    expect(container.textContent).toContain('searchHint')

    fireEvent.change(input, { target: { value: 'store' } })
    expect(container.textContent).toContain('theme-store.ts')
    expect(container.textContent).toContain('file-store.ts')
    expect(container.textContent).not.toContain('searchHint')

    fireEvent.click(Array.from(panel(container).querySelectorAll('button'))
      .find(b => b.querySelector('svg.lucide-x'))!)
    expect(container.textContent).toContain('searchHint')
  })

  it('无匹配显示 noResults；类型页签切换高亮（borderBottom 落色）', () => {
    const { container } = mountSearch()
    const input = panel(container).querySelector('input')!
    fireEvent.change(input, { target: { value: 'zzz不存在的文件' } })
    expect(container.textContent).toContain('noResults')

    const tabBtn = (label: string) => Array.from(panel(container).querySelectorAll('button'))
      .find(b => b.textContent === label)!
    expect(tabBtn('searchContent').style.borderBottom).toContain('transparent')
    fireEvent.click(tabBtn('searchContent'))
    expect(tabBtn('searchContent').style.borderBottom).not.toContain('transparent')
    expect(tabBtn('searchFile').style.borderBottom).toContain('transparent')
  })
})

describe('QuickAccessMiniPanel 快速访问', () => {
  it('favorites（localStorage 种子）与最近文件（真 file-store）双区渲染', () => {
    localStorage.setItem('yyc3_favorites', JSON.stringify(['收藏甲.tsx', '收藏乙.md']))
    act(() => { fileStore.recordAccess('最近打开.tsx') })
    const { container } = mount({ defaultTab: 'quick-access' })

    expect(container.textContent).toContain('favorites')
    expect(container.textContent).toContain('收藏甲.tsx')
    expect(container.textContent).toContain('收藏乙.md')
    expect(container.textContent).toContain('recentFiles')
    expect(container.textContent).toContain('最近打开.tsx')
  })
})

describe('GitMiniPanel Git 集成视图', () => {
  it('渲染 main 分支/↑2 ahead/暂存 2/未暂存 2/未跟踪 1 三组变更', () => {
    const { container } = mount({ defaultTab: 'git-integration' })
    expect(container.textContent).toContain('main')
    expect(container.textContent).toContain('↑2')
    expect(container.textContent).toContain('staged (2)')
    expect(container.textContent).toContain('unstaged (2)')
    expect(container.textContent).toContain('untracked (1)')
    expect(container.textContent).toContain('IDELeftPanel.tsx')
    expect(container.textContent).toContain('IDEStatusBar.tsx')
  })
})
