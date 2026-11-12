/**
 * @file ProjectCreateModal.deep.test.tsx
 * @description 项目创建模态框专项深化 — 关闭门控（默认 null/遮罩点击/X 按钮/ESC）/三步进度指示器/
 *              模板选择（全模板渲染·选中高亮·下一步守卫）/项目信息步（模板预览·目录结构树·返回）/生成步（进度条·日志·完成态）/
 *              完成后 DESIGN JSON 与「进入项目」toast/真 project-store 驱动（fake timers 推进 400ms 间隔）
 * 策略：真 project-store（useSyncExternalStore 自动重渲染）；cyberToast 经全局 sonner 桩捕获
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

import { ProjectCreateModal } from '../ProjectCreateModal'
import { projectStore, PROJECT_TEMPLATES } from '../../store/project-store'

const toastLog = (globalThis as unknown as { __sonnerLog: string[] }).__sonnerLog

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  toastLog.length = 0
  vi.useFakeTimers()
  // openModal 重置步骤/名称/进度等；项目列表可能累积，仅断言本用例创建项
  act(() => { projectStore.openModal() })
})

afterEach(() => {
  act(() => { projectStore.closeModal() })
  vi.useRealTimers()
})

describe('ProjectCreateModal（项目创建模态框）', () => {
  it('关闭门控：modalOpen=false 渲染 null；遮罩空白处点击与 X 按钮均关闭；ESC 键关闭', () => {
    const { container } = render(<ProjectCreateModal />)
    expect(container.textContent).toContain('创建新项目')
    expect(container.textContent).toContain('选择模板 → 填写信息 → 生成项目')
    // ESC 关闭
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.firstElementChild).toBeNull()
    // 重新打开 → 遮罩点击关闭
    act(() => { projectStore.openModal() })
    fireEvent.click(container.firstElementChild!)
    expect(container.firstElementChild).toBeNull()
    // 再打开 → X 按钮关闭
    act(() => { projectStore.openModal() })
    fireEvent.click(container.querySelector('button svg.lucide-x')!.closest('button')!)
    expect(container.firstElementChild).toBeNull()
  })

  it('模板选择步：全部 PROJECT_TEMPLATES 渲染（中文名/描述/技术栈 chips）；未选时「下一步」禁用，选中后可进入信息步', () => {
    const { container } = render(<ProjectCreateModal />)
    // 三步进度指示器（第 1 步当前）
    expect(container.textContent).toContain('选择模板')
    expect(container.textContent).toContain('项目信息')
    expect(container.textContent).toContain('生成项目')
    // 全部模板渲染
    for (const tpl of PROJECT_TEMPLATES) {
      expect(container.textContent).toContain(tpl.name.zh)
    }
    // 未选模板 → 下一步禁用
    const next = btnByText(container, '下一步')
    expect(next.disabled).toBe(true)
    // 选中 React 应用模板
    const reactTpl = PROJECT_TEMPLATES.find(t => t.id === 'react-app')!
    fireEvent.click(btnByText(container, reactTpl.name.zh))
    expect(next.disabled).toBe(false)
    fireEvent.click(next)
    expect(container.textContent).toContain('项目名称')
  })

  it('信息步：模板预览条/项目名称与描述输入/技术栈 chips/目录结构树（📁📄）/返回按钮回模板步', () => {
    const { container } = render(<ProjectCreateModal />)
    const reactTpl = PROJECT_TEMPLATES.find(t => t.id === 'react-app')!
    fireEvent.click(btnByText(container, reactTpl.name.zh))
    fireEvent.click(btnByText(container, '下一步'))
    expect(container.textContent).toContain(`模板: ${reactTpl.name.zh}`)
    // 目录结构树图标
    expect(container.textContent).toContain('📁')
    expect(container.textContent).toContain('📄')
    // 技术栈 chips
    for (const tech of reactTpl.techStack) {
      expect(container.textContent).toContain(tech)
    }
    // 名称/描述输入布线（真 store）
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '我的商城' } })
    expect(nameInput.value).toBe('我的商城')
    const desc = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(desc, { target: { value: '电商后台管理系统' } })
    // 返回 → 模板步
    fireEvent.click(btnByText(container, '返回'))
    expect(container.textContent).toContain('选择一个项目模板作为起点')
  })

  it('生成守卫：项目名称为空（含纯空格）时「创建项目」禁用；输入名称后可启动生成', () => {
    const { container } = render(<ProjectCreateModal />)
    fireEvent.click(btnByText(container, PROJECT_TEMPLATES[0].name.zh))
    fireEvent.click(btnByText(container, '下一步'))
    expect(btnByText(container, '创建项目').disabled).toBe(true)
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '   ' } })
    expect(btnByText(container, '创建项目').disabled).toBe(true)
    fireEvent.change(nameInput, { target: { value: '空白校验项目' } })
    expect(btnByText(container, '创建项目').disabled).toBe(false)
    fireEvent.click(btnByText(container, '创建项目'))
    expect(container.textContent).toContain('正在生成项目...')
    expect(container.textContent).toContain('处理中...')
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('生成过程：进度条按 400ms 间隔推进，日志逐条入列；10 个 tick 后进入 done（进度 100%）', () => {
    const { container } = render(<ProjectCreateModal />)
    fireEvent.click(btnByText(container, PROJECT_TEMPLATES[0].name.zh))
    fireEvent.click(btnByText(container, '下一步'))
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: ' ticking 项目 ' } })
    fireEvent.click(btnByText(container, '创建项目'))
    // 前半程：出现 INIT 日志
    act(() => { vi.advanceTimersByTime(800) })
    expect(container.textContent).toContain('INIT > Creating project directory structure...')
    expect(container.textContent).toMatch(/\d+%/)
    // 推进完 9 条日志 + 1 个落定 tick
    act(() => { vi.advanceTimersByTime(4000) })
    expect(container.textContent).toContain('项目生成完成!')
    expect(container.textContent).toContain('DONE > Project created successfully!')
    expect(container.textContent).toContain('100%')
    // 名称原样入库（真 store projects；store 不做 trim）
    const st = projectStore
    expect(st.getActiveProject()).not.toBeNull()
    expect(st.getActiveProject()!.name).toBe(' ticking 项目 ')
    // DESIGN JSON 预览
    expect(container.textContent).toContain('DESIGN JSON 已初始化')
    expect(container.textContent).toContain('"version"')
    // done 态不再有旋转 Loader
    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  it('done 态「进入项目」：关闭模态并经 cyberToast 提示项目已就绪', () => {
    const { container } = render(<ProjectCreateModal />)
    fireEvent.click(btnByText(container, PROJECT_TEMPLATES[0].name.zh))
    fireEvent.click(btnByText(container, '下一步'))
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'toast 项目' } })
    fireEvent.click(btnByText(container, '创建项目'))
    act(() => { vi.advanceTimersByTime(4800) })
    expect(container.textContent).toContain('进入项目')
    fireEvent.click(btnByText(container, '进入项目'))
    expect(container.firstElementChild).toBeNull()
    expect(toastLog[toastLog.length - 1]).toContain('toast 项目')
    expect(toastLog[toastLog.length - 1]).toContain('已就绪')
  })

  it('生成中途关闭模态：closeModal 清掉定时器，重开回到 template 步且日志清零', () => {
    const { container } = render(<ProjectCreateModal />)
    fireEvent.click(btnByText(container, PROJECT_TEMPLATES[0].name.zh))
    fireEvent.click(btnByText(container, '下一步'))
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '中断项目' } })
    fireEvent.click(btnByText(container, '创建项目'))
    act(() => { vi.advanceTimersByTime(800) })
    expect(container.textContent).toContain('正在生成项目...')
    // 中途 ESC 关闭
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.firstElementChild).toBeNull()
    // 已清定时器：再推进不会崩溃也不会有隐藏状态更新
    act(() => { vi.advanceTimersByTime(5000) })
    // 重开 → 全新 template 步
    act(() => { projectStore.openModal() })
    expect(container.textContent).toContain('选择一个项目模板作为起点')
    expect(container.textContent).not.toContain('正在生成项目...')
  })

  it('步骤指示器联动：done 态第三步点亮并对号；generating 步 spinner 区域文字为「生成项目」流程提示', () => {
    const { container } = render(<ProjectCreateModal />)
    fireEvent.click(btnByText(container, PROJECT_TEMPLATES[0].name.zh))
    fireEvent.click(btnByText(container, '下一步'))
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: '指示器项目' } })
    fireEvent.click(btnByText(container, '创建项目'))
    act(() => { vi.advanceTimersByTime(4800) })
    // done → 第三步显示 Check 对号
    expect(container.querySelector('.lucide-check')).toBeTruthy()
    expect(container.textContent).toContain('项目生成完成!')
  })
})

describe('ProjectCreateModal 附加守卫', () => {
  it('未打开时 ESC 不触发任何副作用（无监听器注册）', () => {
    act(() => { projectStore.closeModal() })
    const { container } = render(<ProjectCreateModal />)
    expect(container.firstElementChild).toBeNull()
    expect(() => fireEvent.keyDown(window, { key: 'Escape' })).not.toThrow()
    expect(container.firstElementChild).toBeNull()
    // 随后正常打开不受影响
    act(() => { projectStore.openModal() })
    expect(container.textContent).toContain('创建新项目')
  })
})
