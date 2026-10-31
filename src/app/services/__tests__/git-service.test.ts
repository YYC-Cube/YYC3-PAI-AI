/**
 * @file git-service.test.ts
 * @description GitEngine 测试 — mock isomorphic-git + 内存 FS，驱动全部仓库操作逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── 内存 FS（替代 LightningFS/IndexedDB）；vi.hoisted 保证 mock 工厂提升后仍可访问 ──
const { memfs, files, dirs } = vi.hoisted(() => {
  const files = new Map<string, string>()
  const dirs = new Set<string>()
  return {
    files,
    dirs,
    memfs: {
      mkdir: vi.fn(async (p: string) => { dirs.add(p) }),
      readFile: vi.fn(async (p: string) => {
        if (!files.has(p)) throw new Error(`ENOENT: ${p}`)
        return files.get(p)!
      }),
      writeFile: vi.fn(async (p: string, data: string) => { files.set(p, data) }),
      readdir: vi.fn(async (p: string) => {
        const prefix = p === '/' ? '' : p.replace(/\/$/, '') + '/'
        const names = new Set<string>()
        for (const key of [...files.keys(), ...dirs]) {
          if (key.startsWith(prefix)) {
            const rest = key.slice(prefix.length)
            if (rest) names.add(rest.split('/')[0])
          }
        }
        return [...names]
      }),
      stat: vi.fn(async (p: string) => ({ isFile: () => files.has(p) })),
      unlink: vi.fn(async (p: string) => { files.delete(p) }),
    },
  }
})

vi.mock('@isomorphic-git/lightning-fs', () => ({
  default: class MockFS {
    promises = memfs
  },
}))

vi.mock('isomorphic-git', () => ({
  default: {
    resolveRef: vi.fn(),
    init: vi.fn(),
    add: vi.fn(),
    resetIndex: vi.fn(),
    commit: vi.fn(),
    log: vi.fn(),
    currentBranch: vi.fn(),
    listBranches: vi.fn(),
    checkout: vi.fn(),
    statusMatrix: vi.fn(),
    deleteRemote: vi.fn(),
    addRemote: vi.fn(),
    fetch: vi.fn(),
    push: vi.fn(),
  },
}))

vi.mock('isomorphic-git/http/web', () => ({ default: {} }))

import { gitEngine } from '../git-service'
import git from 'isomorphic-git'

const g = vi.mocked(git)

beforeEach(() => {
  vi.clearAllMocks()
  files.clear()
  dirs.clear()
  // 单例状态复位：dir 不传不会被 configure 重置，需显式指回默认
  gitEngine.configure({ dir: '/yyc3-workspace', authorName: 'YYC³ AI-PAI', authorEmail: 'admin@0379.email' })
})

describe('GitEngine 配置与仓库状态', () => {
  it('configure 更新工作目录与作者', () => {
    gitEngine.configure({ dir: '/custom', authorName: 'YY', authorEmail: 'yy@test.dev' })
    expect(gitEngine.workDir).toBe('/custom')
  })

  it('isRepo：HEAD 可解析为 true，异常为 false', async () => {
    vi.mocked(git.resolveRef).mockResolvedValue('oid-1')
    expect(await gitEngine.isRepo()).toBe(true)
    vi.mocked(git.resolveRef).mockRejectedValue(new Error('no ref'))
    expect(await gitEngine.isRepo()).toBe(false)
  })

  it('init 幂等建仓（mkdir + git.init）', async () => {
    await gitEngine.init()
    expect(memfs.mkdir).toHaveBeenCalledWith('/yyc3-workspace', { recursive: true })
    expect(g.init).toHaveBeenCalledWith(expect.objectContaining({ dir: '/yyc3-workspace', defaultBranch: 'main' }))
  })
})

describe('GitEngine 文件与提交', () => {
  beforeEach(() => {
    vi.mocked(git.resolveRef).mockResolvedValue('oid-1')
  })

  it('writeFile 归一化路径并自动 stage', async () => {
    await gitEngine.writeFile('src/app.tsx', 'console.log(1)')
    expect(files.get('/yyc3-workspace/src/app.tsx')).toBe('console.log(1)')
    expect(g.add).toHaveBeenCalledWith(expect.objectContaining({ filepath: 'src/app.tsx' }))
  })

  it('readFile 返回字符串内容并容忍前导斜杠', async () => {
    files.set('/yyc3-workspace/notes.md', '# 标题')
    expect(await gitEngine.readFile('/notes.md')).toBe('# 标题')
  })

  it('stageFile/unstageFile 分别布线 add/resetIndex', async () => {
    await gitEngine.stageFile('a.ts')
    expect(g.add).toHaveBeenCalledWith(expect.objectContaining({ filepath: 'a.ts' }))
    await gitEngine.unstageFile('a.ts')
    expect(g.resetIndex).toHaveBeenCalledWith(expect.objectContaining({ filepath: 'a.ts' }))
  })

  it('commit 透传消息并返回 oid', async () => {
    vi.mocked(git.commit).mockResolvedValue('abc123')
    expect(await gitEngine.commit('feat: x')).toBe('abc123')
    expect(g.commit).toHaveBeenCalledWith(expect.objectContaining({ message: 'feat: x' }))
  })

  it('log 映射提交信息（首行/作者/毫秒时间戳），异常返回空数组', async () => {
    vi.mocked(git.log).mockResolvedValue([
      { oid: 'o1', commit: { message: 'feat: 首行\n\n正文', author: { name: 'A', email: 'a@x', timestamp: 1700000000 } } },
    ] as never)
    const rows = await gitEngine.log()
    expect(rows[0]).toEqual({ oid: 'o1', message: 'feat: 首行', author: 'A <a@x>', timestamp: 1700000000000 })
    vi.mocked(git.log).mockRejectedValue(new Error('empty'))
    expect(await gitEngine.log()).toEqual([])
  })

  it('listFiles 递归跳过 .git 并排序；非仓库返回空', async () => {
    files.set('/yyc3-workspace/b.txt', 'b')
    files.set('/yyc3-workspace/a/c.txt', 'c')
    dirs.add('/yyc3-workspace/.git')
    const list = await gitEngine.listFiles()
    expect(list).toEqual(['a/c.txt', 'b.txt'])
    vi.mocked(git.resolveRef).mockRejectedValue(new Error('no repo'))
    expect(await gitEngine.listFiles()).toEqual([])
  })
})

describe('GitEngine 分支与状态', () => {
  beforeEach(() => {
    vi.mocked(git.resolveRef).mockResolvedValue('oid-1')
  })

  it('branches 标记当前分支；异常返回空', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main')
    vi.mocked(git.listBranches).mockResolvedValue(['main', 'dev'])
    expect(await gitEngine.branches()).toEqual([
      { name: 'main', current: true },
      { name: 'dev', current: false },
    ])
    vi.mocked(git.currentBranch).mockRejectedValue(new Error('x'))
    expect(await gitEngine.branches()).toEqual([])
  })

  it('checkout 布线 ref 切换', async () => {
    await gitEngine.checkout('dev', true)
    expect(g.checkout).toHaveBeenCalledWith(expect.objectContaining({ ref: 'dev' }))
  })

  it('status 状态矩阵映射 staged/modified/untracked 并跳过干净文件', async () => {
    vi.mocked(git.statusMatrix).mockResolvedValue([
      ['clean.ts', 1, 1, 1],   // 干净 → 过滤
      ['staged-new.ts', 0, 2, 3], // 新文件已 stage
      ['modified.ts', 1, 2, 1],   // 已跟踪修改未 stage
      ['untracked.ts', 0, 2, 0],  // 未跟踪
    ] as never)
    const rows = await gitEngine.status()
    expect(rows).toEqual([
      { path: 'staged-new.ts', staged: true, modified: false, untracked: false },
      { path: 'modified.ts', staged: false, modified: true, untracked: false },
      { path: 'untracked.ts', staged: false, modified: false, untracked: true },
    ])
    vi.mocked(git.statusMatrix).mockRejectedValue(new Error('x'))
    expect(await gitEngine.status()).toEqual([])
  })
})

describe('GitEngine 远端与重置', () => {
  it('addRemote 先删后加（幂等）', async () => {
    await gitEngine.addRemote('https://git.dev/x.git')
    expect(g.deleteRemote).toHaveBeenCalled()
    expect(g.addRemote).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://git.dev/x.git' }))
  })

  it('fetch/push 未配置代理时给出明确报错；配置后布线调用', async () => {
    await expect(gitEngine.fetch()).rejects.toThrow('CORS')
    await expect(gitEngine.push()).rejects.toThrow('CORS')
    gitEngine.configure({ corsProxy: 'https://proxy.dev' })
    vi.mocked(git.currentBranch).mockResolvedValue('feature-x')
    await gitEngine.fetch('origin')
    expect(g.fetch).toHaveBeenCalledWith(expect.objectContaining({ corsProxy: 'https://proxy.dev' }))
    await gitEngine.push()
    expect(g.push).toHaveBeenCalledWith(expect.objectContaining({ ref: 'feature-x' }))
  })

  it('reset 清空工作区文件', async () => {
    vi.mocked(git.resolveRef).mockResolvedValue('oid-1')
    files.set('/yyc3-workspace/a.txt', 'a')
    await gitEngine.reset()
    expect(files.has('/yyc3-workspace/a.txt')).toBe(false)
  })
})
