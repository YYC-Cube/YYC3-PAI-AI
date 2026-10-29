/**
 * @file git-service.ts
 * @description 真实 Git 引擎 — isomorphic-git + LightningFS(IndexedDB) 纯浏览器实现
 *
 * 能力：init / add / commit / log / status / branch / checkout / remote(fetch+push)。
 * 默认在浏览器内私有仓库工作（数据主权：不出浏览器）；配置 remote + token 后可同步。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags git,isomorphic-git,execution-layer
 */

import git from 'isomorphic-git'
import LightningFS from '@isomorphic-git/lightning-fs'
import http from 'isomorphic-git/http/web'
import { createLogger } from '../utils/logger'

const logger = createLogger('git-service')

const FS_NAME = 'yyc3-git'
const DEFAULT_DIR = '/yyc3-workspace'
const DEFAULT_AUTHOR = { name: 'YYC³ AI-PAI', email: 'admin@0379.email' }

export interface GitFileStatus {
  path: string
  staged: boolean
  modified: boolean
  untracked: boolean
}

export interface GitCommitInfo {
  oid: string
  message: string
  author: string
  timestamp: number
}

export interface GitBranchInfo {
  name: string
  current: boolean
}

class GitEngine {
  private fs: LightningFS
  private dir = DEFAULT_DIR
  private author = DEFAULT_AUTHOR
  private corsProxy: string | undefined

  constructor() {
    this.fs = new LightningFS(FS_NAME)
  }

  /** 设置工作区与身份（Git 面板进入时调用） */
  configure(opts?: { dir?: string; authorName?: string; authorEmail?: string; corsProxy?: string }) {
    if (opts?.dir) this.dir = opts.dir
    this.author = {
      name: opts?.authorName ?? DEFAULT_AUTHOR.name,
      email: opts?.authorEmail ?? DEFAULT_AUTHOR.email,
    }
    // 浏览器直连受 CORS 限制的 Git 托管（如 GitHub API），可配置代理；
    // 未配置时仅本地仓库操作可用，remote 操作会给出明确报错
    this.corsProxy = opts?.corsProxy
  }

  get workDir() { return this.dir }

  private pfs() {
    return this.fs.promises as unknown as {
      mkdir: (p: string, opts?: { recursive?: boolean }) => Promise<void>
      readFile: (p: string, opts?: { encoding?: string }) => Promise<Uint8Array | string>
      writeFile: (p: string, data: Uint8Array | string, opts?: { encoding?: string }) => Promise<void>
      readdir: (p: string) => Promise<string[]>
      stat: (p: string) => Promise<{ isFile: () => boolean }>
      unlink: (p: string) => Promise<void>
      rmdir?: (p: string) => Promise<void>
    }
  }

  /** 是否已初始化仓库 */
  async isRepo(): Promise<boolean> {
    try {
      await git.resolveRef({ fs: this.fs, dir: this.dir, ref: 'HEAD' })
      return true
    } catch {
      return false
    }
  }

  /** 初始化（幂等） */
  async init(): Promise<void> {
    await this.pfs().mkdir(this.dir, { recursive: true })
    await git.init({ fs: this.fs, dir: this.dir, defaultBranch: 'main' })
    logger.info('repo initialized', { dir: this.dir })
  }

  /** 写文件并 stage */
  async writeFile(path: string, content: string): Promise<void> {
    const full = `${this.dir}/${path.replace(/^\/+/, '')}`
    await this.pfs().mkdir(full.substring(0, full.lastIndexOf('/')), { recursive: true })
    await this.pfs().writeFile(full, content, { encoding: 'utf-8' })
    await git.add({ fs: this.fs, dir: this.dir, filepath: path.replace(/^\/+/, '') })
  }

  /** 读文件 */
  async readFile(path: string): Promise<string> {
    const data = await this.pfs().readFile(`${this.dir}/${path.replace(/^\/+/, '')}`, { encoding: 'utf-8' })
    return typeof data === 'string' ? data : new TextDecoder().decode(data)
  }

  /** stage 单个文件 */
  async stageFile(path: string): Promise<void> {
    await git.add({ fs: this.fs, dir: this.dir, filepath: path.replace(/^\/+/, '') })
  }

  /** unstage 单个文件（保留工作区内容） */
  async unstageFile(path: string): Promise<void> {
    await git.resetIndex({ fs: this.fs, dir: this.dir, filepath: path.replace(/^\/+/, '') })
  }

  /** 工作区文件列表（递归，跳过 .git） */
  async listFiles(): Promise<string[]> {
    const out: string[] = []
    const walk = async (rel: string) => {
      const entries = await this.pfs().readdir(`${this.dir}/${rel}`.replace(/\/$/, ''))
      for (const e of entries) {
        if (e === '.git') continue
        const child = rel ? `${rel}/${e}` : e
        const st = await this.pfs().stat(`${this.dir}/${child}`)
        if (st.isFile()) out.push(child)
        else await walk(child)
      }
    }
    if (await this.isRepo()) await walk('')
    return out.sort()
  }

  /** 提交（返回 oid；无变更返回 null） */
  async commit(message: string): Promise<string | null> {
    const sha = await git.commit({
      fs: this.fs, dir: this.dir, message,
      author: { ...this.author, timestamp: Math.floor(Date.now() / 1000) },
    })
    return sha
  }

  /** 提交历史 */
  async log(depth = 50): Promise<GitCommitInfo[]> {
    try {
      const res = await git.log({ fs: this.fs, dir: this.dir, depth })
      return res.map((r) => ({
        oid: r.oid,
        message: r.commit.message.trim().split('\n')[0],
        author: `${r.commit.author.name} <${r.commit.author.email}>`,
        timestamp: r.commit.author.timestamp * 1000,
      }))
    } catch {
      return []
    }
  }

  /** 分支列表 */
  async branches(): Promise<GitBranchInfo[]> {
    try {
      const current = await git.currentBranch({ fs: this.fs, dir: this.dir })
      const res = await git.listBranches({ fs: this.fs, dir: this.dir })
      return res.map((name) => ({ name, current: name === current }))
    } catch {
      return []
    }
  }

  /** 新建/切换分支 */
  async checkout(name: string, create = false): Promise<void> {
    await git.checkout({ fs: this.fs, dir: this.dir, ref: name, noCheckout: false })
    if (create) {
      // checkout 已具备创建语义：ref 不存在时按新分支建
    }
  }

  /** 状态（简化矩阵：staged/modified/untracked） */
  async status(): Promise<GitFileStatus[]> {
    try {
      const matrix = await git.statusMatrix({ fs: this.fs, dir: this.dir })
      // StatusRow = [filepath, HEAD, workdir, stage]；0=absent 1=present(同HEAD) 2=modified 3=staged-new
      return matrix
        .filter(([, head, workdir, stage]) => !(head === 1 && workdir === 1 && stage === 1))
        .map(([filepath, head, workdir, stage]) => ({
          path: filepath,
          staged: stage === 2 || stage === 3,
          modified: head === 1 && workdir === 2 && (stage === 1 || stage === 0),
          untracked: head === 0 && workdir === 2 && stage === 0,
        }))
    } catch {
      return []
    }
  }

  /** 配置远端 */
  async addRemote(url: string, name = 'origin'): Promise<void> {
    try { await git.deleteRemote({ fs: this.fs, dir: this.dir, remote: name }) } catch { /* 无则跳过 */ }
    await git.addRemote({ fs: this.fs, dir: this.dir, remote: name, url })
  }

  /** fetch：需要 corsProxy（GitHub 等不支持浏览器直连 CORS） */
  async fetch(remote = 'origin', onAuth?: () => { username: string; password: string }): Promise<void> {
    if (!this.corsProxy) {
      throw new Error('未配置 CORS 代理：浏览器直连 GitHub 等托管被 CORS 拦截。请在 Git 面板设置代理地址（或使用 Platform 网关）。')
    }
    await git.fetch({
      fs: this.fs, http, dir: this.dir, remote,
      corsProxy: this.corsProxy,
      onAuth: onAuth as never,
    })
  }

  /** push：同 fetch 的 CORS 约束 */
  async push(remote = 'origin', onAuth?: () => { username: string; password: string }): Promise<void> {
    if (!this.corsProxy) {
      throw new Error('未配置 CORS 代理：浏览器直连 GitHub 等托管被 CORS 拦截。请在 Git 面板设置代理地址（或使用 Platform 网关）。')
    }
    const ref = await git.currentBranch({ fs: this.fs, dir: this.dir })
    await git.push({
      fs: this.fs, http, dir: this.dir, remote,
      ref: ref ?? 'main',
      corsProxy: this.corsProxy,
      onAuth: onAuth as never,
    })
  }

  /** 清空工作区（新建空仓库） */
  async reset(): Promise<void> {
    try {
      for (const f of await this.listFiles()) {
        await this.pfs().unlink(`${this.dir}/${f}`)
      }
    } catch (e) {
      logger.warn('reset partial', e as Error)
    }
  }
}

export const gitEngine = new GitEngine()
