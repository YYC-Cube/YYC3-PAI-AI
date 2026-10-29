/**
 * @file GitPanel.tsx
 * @description Git面板组件，提供Git功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,git,ui,component
 */

import { useState, useMemo, useEffect } from 'react'
import {
  X, GitBranch, GitCommit,
  Plus, Minus, Check, RefreshCw, Upload, Download,
  ChevronDown, FilePlus, FileMinus,
  Edit3, RotateCcw, Copy,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { gitEngine } from '../services/git-service'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

type GitTab = 'changes' | 'branches' | 'history' | 'stash'

interface GitFile {
  name: string
  status: 'modified' | 'added' | 'deleted' | 'renamed'
  staged: boolean
  diff?: string
}

interface GitCommitEntry {
  hash: string
  message: string
  author: string
  date: string
  branch: string
}

interface GitPanelProps {
  visible: boolean
  onClose: () => void
}

// 真实 Git 引擎（isomorphic-git + IndexedDB）；下列 MOCK 仅作为无仓库时的演示降级
const MOCK_BRANCHES = ['main']

const MOCK_FILES: GitFile[] = []

const MOCK_COMMITS: GitCommitEntry[] = []

export function GitPanel({ visible, onClose }: GitPanelProps) {
  const { t } = useI18n()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const [tab, setTab] = useState<GitTab>('changes')
  const [hasRepo, setHasRepo] = useState(false)
  const [currentBranch, setCurrentBranch] = useState('main')
  const [branchList, setBranchList] = useState<string[]>(MOCK_BRANCHES)
  const [files, setFiles] = useState<GitFile[]>(MOCK_FILES)
  const [commits, setCommits] = useState<GitCommitEntry[]>(MOCK_COMMITS)
  const [commitMsg, setCommitMsg] = useState('')
  const [commitBusy, setCommitBusy] = useState(false)
  const [gitNotice, setGitNotice] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState<string | null>(null)
  const [branchDropdown, setBranchDropdown] = useState(false)

  // 打开面板时从真实引擎刷新全部状态
  const refresh = async () => {
    const isRepo = await gitEngine.isRepo()
    setHasRepo(isRepo)
    if (!isRepo) return
    const [brs, sts, log, cur] = await Promise.all([
      gitEngine.branches(),
      gitEngine.status(),
      gitEngine.log(30),
      gitEngine.branches().then((b) => b.find((x) => x.current)?.name ?? 'main'),
    ])
    setBranchList(brs.map((b) => b.name))
    setCurrentBranch(cur)
    setFiles(sts.map((s) => ({
      name: s.path,
      status: s.staged ? 'added' : s.untracked ? 'added' : 'modified',
      staged: s.staged,
    } as GitFile)))
    setCommits(log.map((c) => ({
      hash: c.oid.slice(0, 7),
      message: c.message,
      author: c.author,
      date: new Date(c.timestamp).toLocaleString('zh-CN', { hour12: false }),
      branch: 'main',
    })))
  }

  useEffect(() => {
    if (visible) refresh().catch(() => { /* 引擎异常保持降级 */ })
  }, [visible])

  const handleInit = async () => {
    await gitEngine.init()
    await gitEngine.writeFile('README.md', '# YYC³ Workspace\n\n由 AI-PAI Git 面板创建。\n')
    await gitEngine.commit('chore: initialize workspace')
    await refresh()
  }

  const stagedFiles = useMemo(() => files.filter(f => f.staged), [files])
  const unstagedFiles = useMemo(() => files.filter(f => !f.staged), [files])

  const toggleStage = async (name: string) => {
    const target = files.find(f => f.name === name)
    if (!target) return
    try {
      if (target.staged) {
        await gitEngine.unstageFile(name)
      } else {
        await gitEngine.stageFile(name)
      }
      setFiles(prev => prev.map(f => f.name === name ? { ...f, staged: !f.staged } : f))
    } catch (e) {
      setGitNotice(`stage 操作失败：${e instanceof Error ? e.message : String(e)}`)
      setTimeout(() => setGitNotice(null), 3000)
    }
  }

  const stageAll = () => setFiles(prev => prev.map(f => ({ ...f, staged: true })))
  const unstageAll = () => setFiles(prev => prev.map(f => ({ ...f, staged: false })))

  const handleCommit = async () => {
    if (!commitMsg.trim() || commitBusy) return
    setCommitBusy(true)
    try {
      const oid = await gitEngine.commit(commitMsg.trim())
      if (!oid) {
        setGitNotice('没有可提交的变更（先 stage 文件）')
      } else {
        setCommitMsg('')
        setGitNotice(`已提交 ${oid.slice(0, 7)}`)
        await refresh()
      }
    } catch (e) {
      setGitNotice(`提交失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCommitBusy(false)
      setTimeout(() => setGitNotice(null), 3000)
    }
  }

  const statusIcon = (status: GitFile['status']) => {
    switch (status) {
      case 'modified': return <Edit3 size={10} color={tk.warning} />
      case 'added': return <FilePlus size={10} color={tk.success} />
      case 'deleted': return <FileMinus size={10} color={tk.error} />
      case 'renamed': return <RefreshCw size={10} color={tk.primary} />
    }
  }

  const statusColor = (status: GitFile['status']) => {
    switch (status) {
      case 'modified': return tk.warning
      case 'added': return tk.success
      case 'deleted': return tk.error
      case 'renamed': return tk.primary
    }
  }

  const tabs: { key: GitTab; label: string; count?: number }[] = [
    { key: 'changes', label: t('git', 'changes'), count: files.length },
    { key: 'branches', label: t('git', 'branches'), count: branchList.length },
    { key: 'history', label: t('git', 'history'), count: commits.length },
    { key: 'stash', label: t('git', 'stash') },
  ]

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-stretch justify-end"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.sm }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col h-full"
        style={{
          width: 420, background: tk.panelBg, borderLeft: `1px solid ${tk.cardBorder}`,
          backdropFilter: BLUR.lg,
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2">
            <GitBranch size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1.5px' }}>
              {t('git', 'title')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Branch selector */}
            <div className="relative">
              <button
                onClick={() => setBranchDropdown(!branchDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded transition-all"
                style={{
                  fontFamily: tk.fontMono, fontSize: '10px', color: tk.success,
                  background: `${tk.success}15`, border: `1px solid ${tk.success}30`,
                }}
              >
                <GitBranch size={10} />
                {currentBranch}
                <ChevronDown size={10} />
              </button>
              {branchDropdown && (
                <div
                  className="absolute right-0 top-full mt-1 py-1 rounded-lg overflow-hidden"
                  style={{ width: 200, background: tk.panelBg, border: `1px solid ${tk.cardBorder}`, boxShadow: tk.shadowHover, zIndex: 10 }}
                >
                  {branchList.map(b => (
                    <button
                      key={b}
                      onClick={() => { setCurrentBranch(b); setBranchDropdown(false) }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all hover:opacity-80"
                      style={{
                        fontFamily: tk.fontMono, fontSize: '10px',
                        color: b === currentBranch ? tk.primary : tk.foreground,
                        background: b === currentBranch ? tk.primaryGlow : 'transparent',
                      }}
                    >
                      <GitBranch size={10} />
                      {b}
                      {b === currentBranch && <Check size={10} color={tk.primary} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: tk.border }}>
          {tabs.map(tabItem => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className="flex-1 flex items-center justify-center gap-1 py-2 transition-all"
              style={{
                fontFamily: tk.fontMono, fontSize: '9px', letterSpacing: '0.5px',
                color: tab === tabItem.key ? tk.primary : tk.foregroundMuted,
                borderBottom: tab === tabItem.key ? `2px solid ${tk.primary}` : '2px solid transparent',
                background: tab === tabItem.key ? tk.primaryGlow : 'transparent',
              }}
            >
              {tabItem.label}
              {tabItem.count != null && (
                <span className="px-1 rounded" style={{ fontSize: '8px', background: `${tk.primary}20`, color: tk.primary }}>
                  {tabItem.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto neon-scrollbar">
          {gitNotice && (
            <div className="mx-3 mt-3 px-3 py-2 rounded-lg" style={{ fontFamily: tk.fontMono, fontSize: '10px', background: `${tk.primary}12`, border: `1px solid ${tk.primary}33`, color: tk.primary }}>
              {gitNotice}
            </div>
          )}
          {!hasRepo ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <GitBranch size={28} color={tk.primary} style={{ opacity: 0.5 }} />
              <div style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted, lineHeight: 1.8 }}>
                尚未初始化工作区仓库。<br />
                isomorphic-git + IndexedDB 纯浏览器实现，数据不出本机。
              </div>
              <button
                onClick={handleInit}
                className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.background, background: tk.primary, letterSpacing: '1px' }}
              >
                初始化仓库（main）
              </button>
            </div>
          ) : tab === 'changes' && (
            <div className="p-3 space-y-3">
              {/* Staged */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success, letterSpacing: '1px' }}>
                    {t('git', 'staged')} ({stagedFiles.length})
                  </span>
                  {stagedFiles.length > 0 && (
                    <button onClick={unstageAll} className="px-1.5 py-0.5 rounded transition-all hover:opacity-70"
                      style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
                      {t('git', 'unstageAll')}
                    </button>
                  )}
                </div>
                {stagedFiles.map(f => (
                  <div key={f.name} className="flex items-center gap-2 px-2 py-1.5 rounded transition-all hover:opacity-80"
                    style={{ background: `${tk.success}08`, borderBottom: `1px solid ${tk.borderDim}` }}>
                    {statusIcon(f.status)}
                    <span className="flex-1 truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
                      {f.name.split('/').pop()}
                    </span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: statusColor(f.status) }}>{f.status[0].toUpperCase()}</span>
                    <button onClick={() => toggleStage(f.name)} className="p-0.5 rounded hover:opacity-70" style={{ color: tk.foregroundMuted }}>
                      <Minus size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Unstaged */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.warning, letterSpacing: '1px' }}>
                    {t('git', 'unstaged')} ({unstagedFiles.length})
                  </span>
                  {unstagedFiles.length > 0 && (
                    <button onClick={stageAll} className="px-1.5 py-0.5 rounded transition-all hover:opacity-70"
                      style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
                      {t('git', 'stageAll')}
                    </button>
                  )}
                </div>
                {unstagedFiles.map(f => (
                  <div key={f.name}
                    className="flex items-center gap-2 px-2 py-1.5 rounded transition-all hover:opacity-80 cursor-pointer"
                    style={{ borderBottom: `1px solid ${tk.borderDim}` }}
                    onClick={() => f.diff && setShowDiff(showDiff === f.name ? null : f.name)}
                  >
                    {statusIcon(f.status)}
                    <span className="flex-1 truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
                      {f.name.split('/').pop()}
                    </span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: statusColor(f.status) }}>{f.status[0].toUpperCase()}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleStage(f.name) }} className="p-0.5 rounded hover:opacity-70" style={{ color: tk.success }}>
                      <Plus size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Diff view */}
              {showDiff && (() => {
                const file = files.find(f => f.name === showDiff)
                if (!file?.diff) return null
                return (
                  <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
                    <div className="px-3 py-1.5" style={{ background: tk.primaryGlow }}>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary }}>{file.name}</span>
                    </div>
                    <pre className="px-3 py-2 overflow-x-auto" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground, background: tk.codeBg, margin: 0 }}>
                      {file.diff.split('\n').map((line, i) => (
                        <div key={i} style={{
                          color: line.startsWith('+') ? tk.success : line.startsWith('-') ? tk.error : line.startsWith('@') ? tk.primary : tk.foregroundMuted,
                          background: line.startsWith('+') ? `${tk.success}10` : line.startsWith('-') ? `${tk.error}10` : 'transparent',
                        }}>
                          {line}
                        </div>
                      ))}
                    </pre>
                  </div>
                )
              })()}

              {/* Commit message */}
              <div className="space-y-2">
                <textarea
                  value={commitMsg}
                  onChange={e => setCommitMsg(e.target.value)}
                  placeholder={t('git', 'commitPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg resize-none outline-none"
                  style={{
                    fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground,
                    background: tk.inputBg, border: `1px solid ${tk.inputBorder}`,
                  }}
                />
                <button
                  onClick={handleCommit}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all hover:opacity-90"
                  style={{
                    fontFamily: tk.fontMono, fontSize: '11px', color: tk.background,
                    background: tk.primary, letterSpacing: '1px',
                    opacity: stagedFiles.length === 0 || !commitMsg.trim() || commitBusy ? 0.4 : 1,
                    boxShadow: isCyberpunk ? `0 0 12px ${tk.primaryGlow}` : 'none',
                  }}
                  disabled={stagedFiles.length === 0 || !commitMsg.trim() || commitBusy}
                >
                  <GitCommit size={12} />
                  {commitBusy ? '提交中…' : `${t('git', 'commit')} (${stagedFiles.length})`}
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.border}` }}>
                    <Upload size={10} /> {t('git', 'push')}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, border: `1px solid ${tk.border}` }}>
                    <Download size={10} /> {t('git', 'pull')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'branches' && (
            <div className="p-3 space-y-1">
              {MOCK_BRANCHES.map(b => (
                <div
                  key={b}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer hover:opacity-80"
                  style={{
                    background: b === currentBranch ? tk.primaryGlow : 'transparent',
                    border: `1px solid ${b === currentBranch ? tk.border : 'transparent'}`,
                  }}
                  onClick={() => setCurrentBranch(b)}
                >
                  <GitBranch size={12} color={b === currentBranch ? tk.primary : tk.foregroundMuted} />
                  <span className="flex-1" style={{ fontFamily: tk.fontMono, fontSize: '11px', color: b === currentBranch ? tk.primary : tk.foreground }}>
                    {b}
                  </span>
                  {b === currentBranch && (
                    <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.success, background: `${tk.success}15` }}>
                      {t('git', 'current')}
                    </span>
                  )}
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded-lg transition-all hover:opacity-80"
                style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, border: `1px dashed ${tk.border}` }}>
                <Plus size={12} /> {t('git', 'newBranch')}
              </button>
            </div>
          )}

          {tab === 'history' && (
            <div className="p-3 space-y-1">
              {commits.map((c, i) => (
                <div key={c.hash} className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: i === 0 ? tk.primaryGlow : 'transparent', borderBottom: `1px solid ${tk.borderDim}` }}>
                  <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 2 }}>
                    <GitCommit size={12} color={i === 0 ? tk.primary : tk.foregroundMuted} />
                    {i < commits.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: tk.borderDim, minHeight: 16 }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foreground }}>{c.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary }}>{c.hash}</span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>{c.date}</span>
                    </div>
                  </div>
                  <button className="p-1 rounded hover:opacity-70 shrink-0" style={{ color: tk.foregroundMuted }}>
                    <Copy size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'stash' && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <RotateCcw size={24} color={tk.foregroundMuted} style={{ opacity: 0.3 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>{t('git', 'noStash')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
