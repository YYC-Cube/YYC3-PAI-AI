/**
 * @file IDETerminal.deep.test.tsx
 * @description 集成终端深化 — help/mkdir/mv/cp/tree/date 族/git 真实子命令族（log/commit/branch/ls-files）与错误路径
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({
  isRepo: vi.fn(),
  branches: vi.fn(),
  status: vi.fn(),
  log: vi.fn(),
  commit: vi.fn(),
  listFiles: vi.fn(),
  writeFile: vi.fn(),
}))

vi.mock('../../../services/git-service', () => ({
  gitEngine: {
    isRepo: m.isRepo,
    branches: m.branches,
    status: m.status,
    log: m.log,
    commit: m.commit,
    listFiles: m.listFiles,
    writeFile: m.writeFile,
  },
}))

import { IDETerminal } from '../IDETerminal'

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  m.isRepo.mockResolvedValue(true)
  m.branches.mockResolvedValue([{ name: 'main', current: true }])
  m.status.mockResolvedValue([])
  m.log.mockResolvedValue([])
  m.commit.mockResolvedValue(null)
  m.listFiles.mockResolvedValue([])
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
  return render(<IDETerminal {...props} />)
}

const send = (input: HTMLInputElement, cmd: string) => {
  fireEvent.change(input, { target: { value: cmd } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('IDETerminal 深化（内置命令族）', () => {
  it('help：输出完整可用命令清单', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'help')
    await waitFor(() => expect(container.textContent).toContain('YYC³ Terminal v1.0'), { timeout: 2000 })
    expect(container.textContent).toContain('tree')
    expect(container.textContent).toContain('mv <old> <new>')
    expect(container.textContent).toContain('git status|log|commit -m|branch|ls-files')
  })

  it('date/whoami/uname：固定输出', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'whoami')
    await waitFor(() => expect(container.textContent).toContain('yyc3-admin'), { timeout: 2000 })
    send(input, 'uname')
    await waitFor(() => expect(container.textContent).toContain('YYC3-OS 1.0.0'), { timeout: 2000 })
    send(input, 'date')
    await waitFor(() => expect(container.textContent).not.toContain('command not found: date'), { timeout: 2000 })
  })

  it('mkdir：创建目录成功/重复创建报已存在/缺操作数报错', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'mkdir new-dir')
    await waitFor(() => expect(container.textContent).toContain('Created directory: new-dir'), { timeout: 2000 })
    send(input, 'mkdir new-dir')
    await waitFor(() => expect(container.textContent).toContain("mkdir: 'new-dir' already exists"), { timeout: 2000 })
    send(input, 'mkdir')
    await waitFor(() => expect(container.textContent).toContain('mkdir: missing operand'), { timeout: 2000 })
  })

  it('mv：缺操作数/源不存在/成功移动', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'mv')
    await waitFor(() => expect(container.textContent).toContain('mv: missing operand'), { timeout: 2000 })
    send(input, 'mv 不存在.ts somewhere.ts')
    await waitFor(() => expect(container.textContent).toContain('not found'), { timeout: 2000 })
    send(input, 'mv /package.json /moved.json')
    await waitFor(() => expect(container.textContent).toContain('Moved: package.json → moved.json'), { timeout: 2000 })
    send(input, 'ls /')
    await waitFor(() => expect(container.textContent).toContain('moved.json'), { timeout: 2000 })
  })

  it('cp：缺操作数/源不是文件/复制成功', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'cp')
    await waitFor(() => expect(container.textContent).toContain('cp: missing operand'), { timeout: 2000 })
    send(input, 'cp src copied-src')
    await waitFor(() => expect(container.textContent).toContain("cp: 'src': not a file"), { timeout: 2000 })
    send(input, 'cp /README.md /backup.md')
    await waitFor(() => expect(container.textContent).toContain('Copied: /README.md → /backup.md'), { timeout: 2000 })
    send(input, 'cat /backup.md')
    await waitFor(() => expect(container.textContent).toContain('Desktop AI IDE'), { timeout: 2000 })
  })

  it('tree：目录树渲染；对文件执行 tree 报 not a directory', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'tree')
    await waitFor(() => expect(container.textContent).toContain('├──'), { timeout: 2000 })
    expect(container.textContent).toContain('components/')
    send(input, 'tree package.json')
    await waitFor(() => expect(container.textContent).toContain('tree: not a directory'), { timeout: 2000 })
  })

  it('ls 带路径参数：目录列表/不可访问/单文件名回显', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'ls /src/app')
    await waitFor(() => expect(container.textContent).toContain('i18n/'), { timeout: 2000 })
    expect(container.textContent).toContain('store/')
    send(input, 'ls /缺失路径')
    await waitFor(() => expect(container.textContent).toContain("ls: cannot access '/缺失路径'"), { timeout: 2000 })
    send(input, 'ls package.json')
    await waitFor(() => expect(container.textContent).toContain('package.json'), { timeout: 2000 })
  })

  it('cat 目录/缺操作数；cd 到文件报 not a directory；rm 缺失路径报错', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'cat /src')
    await waitFor(() => expect(container.textContent).toContain('Is a directory'), { timeout: 2000 })
    send(input, 'cat')
    await waitFor(() => expect(container.textContent).toContain('cat: missing operand'), { timeout: 2000 })
    send(input, 'cd /package.json')
    await waitFor(() => expect(container.textContent).toContain('cd: not a directory'), { timeout: 2000 })
    send(input, 'rm')
    await waitFor(() => expect(container.textContent).toContain('rm: missing operand'), { timeout: 2000 })
    send(input, 'rm / nowhere')
    await waitFor(() => expect(container.textContent).toContain('No such file or directory'), { timeout: 2000 })
  })

  it('cd 绝对路径与 ~（回根目录）', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'cd /src/app/components')
    await waitFor(() => expect(container.textContent).toContain('~/src/app/components'), { timeout: 2000 })
    send(input, 'cd ~')
    await waitFor(() => expect(container.textContent).toContain('~/$'), { timeout: 2000 })
  })

  it('viewMode=preview 时终端左边界为 0（全宽）', () => {
    const { container } = renderTerminal({ viewMode: 'preview', terminalExpanded: false })
    const root = container.firstElementChild as HTMLElement
    expect(['0', '0px']).toContain(root.style.left)
  })
})

describe('IDETerminal 深化（git 真实子命令族）', () => {
  it('git log：有提交时输出 commit/Author/message；无提交时输出 fatal', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    m.log.mockResolvedValue([
      { oid: '1234567890abcdef', author: '严宇', timestamp: new Date('2026-01-01T08:00:00Z').getTime(), message: '初始化提交' },
    ])
    send(input, 'git log')
    await waitFor(() => expect(container.textContent).toContain('commit 1234567'), { timeout: 2000 })
    expect(container.textContent).toContain('Author: 严宇')
    expect(container.textContent).toContain('初始化提交')
    m.log.mockResolvedValue([])
    send(input, 'git log')
    await waitFor(() => expect(container.textContent).toContain('fatal: your current branch does not have any commits yet'), { timeout: 2000 })
  })

  it('git commit -m：成功输出 oid 短哈希；空消息输出 usage；提交抛错输出 git: 前缀错误', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    m.commit.mockResolvedValue('abcdef1234567890')
    send(input, 'git commit -m "first blood"')
    await waitFor(() => expect(container.textContent).toContain('[main abcdef1] first blood'), { timeout: 2000 })
    m.commit.mockResolvedValue(null)
    send(input, 'git commit -m')
    await waitFor(() => expect(container.textContent).toContain('usage: git commit -m'), { timeout: 2000 })
    m.commit.mockRejectedValue(new Error('引用冲突'))
    send(input, 'git commit -m "again"')
    await waitFor(() => expect(container.textContent).toContain('git: 引用冲突'), { timeout: 2000 })
  })

  it('git branch：当前分支带 * 前缀；git ls-files 列出全部文件', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    m.branches.mockResolvedValue([
      { name: 'main', current: true },
      { name: 'feature-x', current: false },
    ])
    send(input, 'git branch')
    await waitFor(() => expect(container.textContent).toContain('* main'), { timeout: 2000 })
    expect(container.textContent).toContain('feature-x')
    m.listFiles.mockResolvedValue(['src/app/App.tsx', 'README.md'])
    send(input, 'git ls-files')
    await waitFor(() => expect(container.textContent).toContain('src/app/App.tsx'), { timeout: 2000 })
    expect(container.textContent).toContain('README.md')
  })

  it('git status：有变更时按 staged/untracked/modified 标记输出', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    m.status.mockResolvedValue([
      { path: 'src/app/App.tsx', staged: true, untracked: false },
      { path: 'notes.md', staged: false, untracked: true },
      { path: 'README.md', staged: false, untracked: false },
    ])
    send(input, 'git status')
    await waitFor(() => expect(container.textContent).toContain('Changes:'), { timeout: 2000 })
    expect(container.textContent).toContain('staged:    src/app/App.tsx')
    expect(container.textContent).toContain('untracked: notes.md')
    expect(container.textContent).toContain('modified:  README.md')
  })

  it('git 未实现子命令：提示未实现与可用列表', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'git push origin main')
    await waitFor(() => expect(container.textContent).toContain("git: 'push' 在浏览器引擎(isomorphic-git)中未实现"), { timeout: 2000 })
    expect(container.textContent).toContain('status / log / commit -m / branch / ls-files')
  })

  it('git 纯命令（无子命令）：未实现提示以空串回显', async () => {
    const { container } = renderTerminal()
    const input = container.querySelector('input')! as HTMLInputElement
    send(input, 'git')
    await waitFor(() => expect(container.textContent).toContain("git: '' 在浏览器引擎(isomorphic-git)中未实现"), { timeout: 2000 })
  })
})
