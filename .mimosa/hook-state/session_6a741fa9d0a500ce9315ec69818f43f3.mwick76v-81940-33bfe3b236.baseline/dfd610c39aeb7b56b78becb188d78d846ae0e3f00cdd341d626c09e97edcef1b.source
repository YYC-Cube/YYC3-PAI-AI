/**
 * @file IDETerminal.test.tsx
 * @description 集成终端面板 — 头部按钮/命令回显/VFS 命令族（ls/cat/touch/rm/cd/clear）/git 与 npm 守卫
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({
  isRepo: vi.fn(),
  branches: vi.fn(),
  status: vi.fn(),
}))

vi.mock('../../../services/git-service', () => ({
  gitEngine: { isRepo: m.isRepo, branches: m.branches, status: m.status },
}))

import { IDETerminal } from '../IDETerminal'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  m.isRepo.mockResolvedValue(false)
  m.branches.mockResolvedValue([])
  m.status.mockResolvedValue([])
})

const renderTerminal = (overrides: Partial<Parameters<typeof IDETerminal>[0]> = {}) => {
  const props: Parameters<typeof IDETerminal>[0] = {
    terminalHeight: 220,
    terminalExpanded: true,
    middleRatio: 46,
    viewMode: 'edit',
    onClose: vi.fn(),
    onSetExpanded: vi.fn(),
    onSetHeight: vi.fn(),
    onStartResize: vi.fn(),
    ...overrides,
  }
  return { ...render(<IDETerminal {...props} />), props }
}

describe('IDETerminal（集成终端）', () => {
  it('渲染头部（标题/宽度徽标/cwd 提示）与初始历史行', () => {
    const { container } = renderTerminal()
    expect(container.textContent).toContain('integratedTerminal')
    expect(container.textContent).toContain('terminalWide')
    expect(container.textContent).toContain('/src/app')
    expect(container.textContent).toContain('$ npm run dev')
    expect(container.textContent).toContain('VITE v5.4.7')
  })

  it('头部按钮布线：展开切换/最小化与关闭/最大化高度', () => {
    const onClose = vi.fn()
    const onSetExpanded = vi.fn()
    const onSetHeight = vi.fn()
    const { container } = renderTerminal({ onClose, onSetExpanded, onSetHeight })
    const btns = Array.from(container.querySelectorAll('button'))
    fireEvent.click(btns[0]) // 展开/收起
    expect(onSetExpanded).toHaveBeenCalledWith(false)
    fireEvent.click(btns[1]) // 最小化
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(btns[2]) // 最大化
    expect(onSetHeight).toHaveBeenCalledWith(500)
    fireEvent.click(btns[3]) // 关闭
    expect(onClose).toHaveBeenCalledTimes(2)
    // 拖拽把手
    const handle = container.querySelector('.cursor-ns-resize')!
    fireEvent.mouseDown(handle)
    expect(container).toBeTruthy()
  })

  it('非展开态：左边界随 middleRatio 收缩、无行号与 cwd 前缀', () => {
    const { container } = renderTerminal({ terminalExpanded: false, middleRatio: 46 })
    const root = container.firstElementChild as HTMLElement
    expect(root.style.left).toBe('46%')
    expect(container.textContent).toContain('terminalRightOnly')
    expect(container.textContent).not.toContain('~/')
  })

  it('echo 与 pwd：输出回显工作目录；输入行带 cwd 前缀', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'pwd' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('/src/app $ pwd'), { timeout: 2000 })
    await waitFor(() => expect(container.textContent).toContain('/src/app'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'echo 你好终端' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('你好终端'), { timeout: 2000 })
  })

  it('ls 与 cat：VFS 目录列表与文件内容读取', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('components/'), { timeout: 2000 })
    expect(container.textContent).toContain('App.tsx')
    fireEvent.change(input, { target: { value: 'cat App.tsx' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('YYC³'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'cat 缺失.ts' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('No such file'), { timeout: 2000 })
  })

  it('touch 创建文件、重复创建报存在、ls 可见新文件', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'touch new-file.ts' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('Created: new-file.ts'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'touch new-file.ts' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('File exists: new-file.ts'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('new-file.ts'), { timeout: 2000 })
  })

  it('cd 切目录（不存在/非目录/相对路径..）与 rm 删除', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'cd 缺失目录' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('no such directory'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'cd ..' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    // 回显行以发送时 cwd 为前缀（/src/app）；随后头部 cwd 提示更新为 ~//src
    await waitFor(() => expect(container.textContent).toContain('/src/app $ cd ..'), { timeout: 2000 })
    await waitFor(() => expect(container.textContent).toContain('~/src'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'cd app' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'rm App.tsx' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('Removed: App.tsx'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'cat App.tsx' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('No such file'), { timeout: 2000 })
  })

  it('clear 清空历史；未知命令给出提示；空输入不追加行', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'clear' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).not.toContain('$ npm run dev'), { timeout: 2000 })
    fireEvent.change(input, { target: { value: 'totally-unknown' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('command not found: totally-unknown'), { timeout: 2000 })
    expect(container.textContent).toContain("Type 'help'")
    const before = container.textContent!.length
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(container.textContent!.length).toBe(before)
  })

  it('npm/pnpm 等宿主命令被拒（不伪造输出）', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'npm run dev' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('没有 Node.js 运行时'), { timeout: 2000 })
    expect(container.textContent).toContain('npm')
  })

  it('git 命令：未初始化提示；仓库就绪且工作树干净时输出 On branch 与 clean', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    fireEvent.change(input, { target: { value: 'git status' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('工作区未初始化'), { timeout: 2000 })
    // 仓库就绪路径（真实异步分支）
    m.isRepo.mockResolvedValue(true)
    m.branches.mockResolvedValue([{ name: 'main', current: true }])
    m.status.mockResolvedValue([])
    fireEvent.change(input, { target: { value: 'git status' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(container.textContent).toContain('On branch main'), { timeout: 2000 })
    expect(container.textContent).toContain('nothing to commit, working tree clean')
    // 注：isRepo 拒绝路径的 await 位于 try 外 → 组件侧产生 unhandled rejection（疑似源码 bug，已单独报告）
  })
})
