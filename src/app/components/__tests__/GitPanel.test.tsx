/**
 * @file GitPanel.test.tsx
 * @description Git 面板组件测试（覆盖率收敛：真执行层面板纳入组件测试）
 * 策略：加载真实 git-service 模块，对引擎方法 spyOn 打桩——组件逻辑全真，
 * 仅在 isomorphic-git/LightningFS 边界处替换（jsdom 无 IndexedDB）。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { gitEngine } from '../../services/git-service'
import { GitPanel } from '../GitPanel'

// 引擎行为状态（各 stub 共享）
const state = {
  isRepo: false,
  files: [] as string[],
  statuses: [] as Array<{ path: string; staged: boolean; modified: boolean; untracked: boolean }>,
  commits: [] as Array<{ oid: string; message: string; author: string; timestamp: number }>,
}

function stubEngine() {
  vi.spyOn(gitEngine, 'isRepo').mockImplementation(async () => state.isRepo)
  vi.spyOn(gitEngine, 'init').mockImplementation(async () => {
    state.isRepo = true
    state.files = ['README.md']
  })
  vi.spyOn(gitEngine, 'writeFile').mockResolvedValue(undefined)
  vi.spyOn(gitEngine, 'listFiles').mockImplementation(async () => state.files)
  vi.spyOn(gitEngine, 'status').mockImplementation(async () => state.statuses)
  vi.spyOn(gitEngine, 'log').mockImplementation(async () => state.commits)
  vi.spyOn(gitEngine, 'branches').mockResolvedValue([{ name: 'main', current: true }])
  vi.spyOn(gitEngine, 'commit').mockImplementation(async (msg: string) => {
    if (!state.statuses.some(s => s.staged)) return null
    const oid = 'abc' + Date.now().toString(16)
    state.commits = [{ oid, message: msg, author: 'YYC³ AI-PAI', timestamp: Date.now() }, ...state.commits]
    return oid
  })
  vi.spyOn(gitEngine, 'stageFile').mockImplementation(async (p: string) => {
    const s = state.statuses.find(x => x.path === p)
    if (s) s.staged = true
  })
  vi.spyOn(gitEngine, 'unstageFile').mockImplementation(async (p: string) => {
    const s = state.statuses.find(x => x.path === p)
    if (s) s.staged = false
  })
}

const renderPanel = () => render(<GitPanel visible onClose={() => { }} />)

describe('GitPanel（真执行层面板 · 引擎边界打桩）', () => {
  beforeEach(() => {
    state.isRepo = false
    state.files = []
    state.statuses = []
    state.commits = []
    vi.restoreAllMocks()
    stubEngine()
  })

  it('无仓库时显示初始化入口，点击调用引擎 init 并刷新', async () => {
    renderPanel()
    const initBtn = await screen.findByText('初始化仓库（main）')
    fireEvent.click(initBtn)
    await waitFor(() => expect(gitEngine.init).toHaveBeenCalled())
    await waitFor(() => expect(gitEngine.status).toHaveBeenCalled())
  })

  it('有仓库时展示 status 映射的工作区变更', async () => {
    state.isRepo = true
    state.files = ['a.ts', 'b.ts']
    state.statuses = [
      { path: 'a.ts', staged: true, modified: false, untracked: false },
      { path: 'b.ts', staged: false, modified: true, untracked: false },
    ]
    renderPanel()
    await waitFor(() => expect(screen.getByText('a.ts')).toBeTruthy())
    expect(screen.getByText('b.ts')).toBeTruthy()
  })

  it('unstaged 文件切换 stage 走真实引擎调用', async () => {
    state.isRepo = true
    state.statuses = [{ path: 'x.ts', staged: false, modified: true, untracked: false }]
    renderPanel()
    await waitFor(() => expect(screen.getByText('x.ts')).toBeTruthy())
    const toggleBtn = screen.getByText('x.ts').closest('div')?.querySelector('button')
    expect(toggleBtn).toBeTruthy()
    fireEvent.click(toggleBtn!)
    await waitFor(() => expect(gitEngine.stageFile).toHaveBeenCalledWith('x.ts'))
  })

  it('无 staged 变更时 commit 诚实禁用', async () => {
    state.isRepo = true
    state.statuses = []
    renderPanel()
    await waitFor(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /提交|commit/i.test(b.textContent || ''))
      expect(btn).toBeTruthy()
      expect(btn!.hasAttribute('disabled')).toBe(true)
    })
  })
})
