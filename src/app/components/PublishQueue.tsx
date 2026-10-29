/**
 * @file PublishQueue.tsx
 * @description B2: 多平台发布队列 — 管理内容发布任务，支持多平台同步/定时发布
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [self-media],[publish],[phase-b]
 */

'use client'

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BLUR, Z_INDEX, useThemeStore } from '../store/theme-store'
import type { LayoutPlatform } from '../utils/layout-engine'

// ── Types ──

export type PublishStatus = 'draft' | 'scheduled' | 'exported' | 'publishing' | 'published' | 'failed'

/** 各平台创作后台入口（真实发布须经平台登录与编辑器，浏览器无法也不应代发） */
const PLATFORM_EDITOR_URL: Partial<Record<LayoutPlatform, string>> = {
  wechat: 'https://mp.weixin.qq.com/',
  xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish',
  zhihu: 'https://zhuanlan.zhihu.com/write',
  bilibili: 'https://member.bilibili.com/platform/upload/text/',
  twitter: 'https://x.com/compose/post',
  web: '',
}

export interface PublishTask {
  id: string
  title: string
  content: string
  platforms: LayoutPlatform[]
  status: PublishStatus
  createdAt: number
  scheduledAt?: number
  publishedAt?: number
  error?: string
}

export interface PublishQueueProps {
  visible: boolean
  onClose: () => void
  /** 初始内容（从编辑器/AI写作传入） */
  initialContent?: string
  initialTitle?: string
}

// ── Platform Icons Map ──

const PLATFORM_ICONS: Record<LayoutPlatform, typeof Globe> = {
  wechat: MessageSquare,
  xiaohongshu: ImageIcon,
  zhihu: Globe,
  bilibili: Play,
  twitter: MessageSquare,
  web: Monitor,
}

const PLATFORM_NAMES: Record<LayoutPlatform, string> = {
  wechat: '公众号',
  xiaohongshu: '小红书',
  zhihu: '知乎',
  bilibili: 'B站',
  twitter: 'Twitter',
  web: '网页',
}

const PLATFORM_COLORS: Record<LayoutPlatform, string> = {
  wechat: '#07c160',
  xiaohongshu: '#ff2442',
  zhihu: '#056de8',
  bilibili: '#fb7299',
  twitter: '#1d9bf0',
  web: '#6366f1',
}

// ── Helpers ──

function generateId(): string {
  return `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ── Main Component ──

export function PublishQueue({ visible, onClose, initialContent, initialTitle }: PublishQueueProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()

  // State
  const [tasks, setTasks] = useState<PublishTask[]>(() => {
    try {
      const raw = localStorage.getItem('yyc3-publish-queue')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [showEditor, setShowEditor] = useState(false)

  // New task form — sync props into state (跨面板传入更新)
  const [newTitle, setNewTitle] = useState(initialTitle || '')
  const [newContent, setNewContent] = useState(initialContent || '')
  useEffect(() => {
    if (initialContent) setNewContent(initialContent)
  }, [initialContent])
  useEffect(() => {
    if (initialTitle) setNewTitle(initialTitle)
  }, [initialTitle])
  useEffect(() => {
    if (initialContent || initialTitle) setShowEditor(true)
  }, [initialContent, initialTitle])
  const [selectedPlatforms, setSelectedPlatforms] = useState<LayoutPlatform[]>(['wechat'])
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<PublishStatus | 'all'>('all')

  // Refs
  const publishTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      publishTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      publishTimeoutsRef.current.clear()
    }
  }, [])

  // Save tasks
  const saveTasks = useCallback((updated: PublishTask[]) => {
    setTasks(updated)
    try { localStorage.setItem('yyc3-publish-queue', JSON.stringify(updated)) } catch { /* */ }
  }, [])

  // Toggle platform selection
  const togglePlatform = useCallback((platform: LayoutPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }, [])

  // Create task
  const handleCreateTask = useCallback(() => {
    if (!newTitle.trim() || selectedPlatforms.length === 0) return

    const task: PublishTask = {
      id: generateId(),
      title: newTitle.trim(),
      content: newContent.trim(),
      platforms: [...selectedPlatforms],
      status: scheduleMode === 'schedule' ? 'scheduled' : 'draft',
      createdAt: Date.now(),
      scheduledAt: scheduleMode === 'schedule' && scheduleDate
        ? new Date(`${scheduleDate}T${scheduleTime || '09:00'}`).getTime()
        : undefined,
    }

    saveTasks([task, ...tasks])
    // Reset form
    setNewTitle('')
    setNewContent('')
    setSelectedPlatforms(['wechat'])
    setScheduleMode('now')
    setShowEditor(false)
  }, [newTitle, newContent, selectedPlatforms, scheduleMode, scheduleDate, scheduleTime, tasks, saveTasks])

  // Publish now (simulate)
  // 真实发布动作：复制成品内容 + 打开对应平台创作后台（浏览器端无法也不应
  // 直接代发平台内容——状态标为 exported 而非伪造 published）
  const handlePublishNow = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const text = `${t.title}\n\n${t.content}`
      navigator.clipboard.writeText(text).catch(() => { /* 剪贴板被拒时仍打开后台 */ })
      const url = PLATFORM_EDITOR_URL[t.platforms[0]]
      if (url) window.open(url, '_blank', 'noopener')
      return { ...t, status: 'exported' as const, publishedAt: Date.now(), error: url ? undefined : '未登记该平台创作后台入口，内容已复制到剪贴板' }
    }))
  }, [])

  // Delete task
  const handleDelete = useCallback((taskId: string) => {
    saveTasks(tasks.filter(t => t.id !== taskId))
  }, [tasks, saveTasks])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks
    return tasks.filter(t => t.status === statusFilter)
  }, [tasks, statusFilter])

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length }
    tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1
    })
    return counts
  }, [tasks])

  // Status badge component
  const StatusBadge = useCallback(({ status }: { status: PublishStatus }) => {
    const config: Record<PublishStatus, { label: string; color: string; bg: string }> = {
      draft: { label: '草稿', color: '#6b7280', bg: '#f3f4f6' },
      scheduled: { label: '定时', color: '#2563eb', bg: '#eff6ff' },
      exported: { label: '已导出·待平台粘贴', color: '#7c3aed', bg: '#f5f3ff' },
      publishing: { label: '发布中', color: '#d97706', bg: '#fffbeb' },
      published: { label: '已发布', color: '#059669', bg: '#ecfdf5' },
      failed: { label: '失败', color: '#dc2626', bg: '#fef2f2' },
    }
    const c = config[status]
    return (
      <span style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '10px',
        color: c.color,
        background: c.bg,
        fontWeight: 600,
      }}>
        {c.label}
      </span>
    )
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tk.overlayBg,
          backdropFilter: BLUR.lg,
          WebkitBackdropFilter: BLUR.lg,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '800px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          background: tk.panelBg,
          border: `1px solid ${tk.border}`,
          borderRadius: tk.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${tk.shadow}`,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${tk.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={16} style={{ color: tk.primary }} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: tk.fontDisplay }}>
              多平台发布
            </span>
            <span style={{ fontSize: '11px', color: tk.foregroundMuted }}>
              管理内容发布任务
            </span>
            {tasks.length > 0 && (
              <span style={{
                fontSize: '10px',
                padding: '1px 8px',
                borderRadius: '10px',
                background: tk.primaryDim,
                color: tk.primary,
              }}>
                {tasks.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setShowEditor(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: tk.primary,
                border: 'none',
                borderRadius: '6px',
                color: tk.primaryForeground,
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Plus size={12} />
              新建发布
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                color: tk.foregroundMuted,
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            padding: '10px 20px',
            borderBottom: `1px solid ${tk.borderDim}`,
            background: isCyberpunk ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          }}
        >
          {(['all', 'draft', 'scheduled', 'published', 'failed'] as const).map(status => {
            const count = statusCounts[status] || 0
            const isActive = statusFilter === status
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  background: isActive ? tk.primaryDim : 'transparent',
                  border: `1px solid ${isActive ? tk.primary : 'transparent'}`,
                  borderRadius: '14px',
                  color: isActive ? tk.primary : tk.foregroundMuted,
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {status === 'all' ? '全部' :
                  status === 'draft' ? '草稿' :
                    status === 'scheduled' ? '定时' :
                      status === 'published' ? '已发布' : '失败'}
                {count > 0 && ` (${count})`}
              </button>
            )
          })}
        </div>

        {/* ── New Task Editor ── */}
        {showEditor && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${tk.border}`,
              background: isCyberpunk ? 'rgba(0,240,255,0.02)' : 'rgba(99,102,241,0.02)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="文章标题 *"
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: tk.background,
                  border: `1px solid ${tk.border}`,
                  borderRadius: '6px',
                  color: tk.foreground,
                  outline: 'none',
                  fontFamily: tk.fontBody,
                }}
              />
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="文章内容（支持 Markdown/HTML）"
                rows={3}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  background: tk.background,
                  border: `1px solid ${tk.border}`,
                  borderRadius: '6px',
                  color: tk.foreground,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: tk.fontMono,
                  lineHeight: '1.5',
                }}
              />

              {/* Platform Selector */}
              <div>
                <div style={{ fontSize: '10px', color: tk.foregroundMuted, marginBottom: '6px', fontWeight: 600 }}>
                  目标平台
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['wechat', 'xiaohongshu', 'zhihu', 'bilibili', 'twitter'] as LayoutPlatform[]).map(p => {
                    const Icon = PLATFORM_ICONS[p]
                    const isSelected = selectedPlatforms.includes(p)
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          fontSize: '10px',
                          background: isSelected ? PLATFORM_COLORS[p] + '20' : 'transparent',
                          border: `1px solid ${isSelected ? PLATFORM_COLORS[p] : tk.border}`,
                          borderRadius: '14px',
                          color: isSelected ? PLATFORM_COLORS[p] : tk.foregroundMuted,
                          cursor: 'pointer',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <Icon size={12} />
                        {PLATFORM_NAMES[p]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '10px', color: tk.foregroundMuted, fontWeight: 600 }}>
                  发布方式
                </div>
                <button
                  onClick={() => setScheduleMode('now')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '10px',
                    background: scheduleMode === 'now' ? tk.primaryDim : 'transparent',
                    border: `1px solid ${scheduleMode === 'now' ? tk.primary : tk.border}`,
                    borderRadius: '14px',
                    color: scheduleMode === 'now' ? tk.primary : tk.foregroundMuted,
                    cursor: 'pointer',
                    fontWeight: scheduleMode === 'now' ? 600 : 400,
                  }}
                >
                  <Send size={10} style={{ display: 'inline', marginRight: '3px' }} />
                  立即发布
                </button>
                <button
                  onClick={() => setScheduleMode('schedule')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '10px',
                    background: scheduleMode === 'schedule' ? tk.primaryDim : 'transparent',
                    border: `1px solid ${scheduleMode === 'schedule' ? tk.primary : tk.border}`,
                    borderRadius: '14px',
                    color: scheduleMode === 'schedule' ? tk.primary : tk.foregroundMuted,
                    cursor: 'pointer',
                    fontWeight: scheduleMode === 'schedule' ? 600 : 400,
                  }}
                >
                  <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                  定时发布
                </button>
                {scheduleMode === 'schedule' && (
                  <>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: tk.background,
                        border: `1px solid ${tk.border}`,
                        borderRadius: '6px',
                        color: tk.foreground,
                        outline: 'none',
                      }}
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: tk.background,
                        border: `1px solid ${tk.border}`,
                        borderRadius: '6px',
                        color: tk.foreground,
                        outline: 'none',
                      }}
                    />
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowEditor(false)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    background: 'transparent',
                    border: `1px solid ${tk.border}`,
                    borderRadius: '6px',
                    color: tk.foregroundMuted,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTitle.trim() || selectedPlatforms.length === 0}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    background: tk.primary,
                    border: 'none',
                    borderRadius: '6px',
                    color: tk.primaryForeground,
                    cursor: newTitle.trim() && selectedPlatforms.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: newTitle.trim() && selectedPlatforms.length > 0 ? 1 : 0.4,
                    fontWeight: 600,
                  }}
                >
                  {scheduleMode === 'schedule' ? '添加到定时队列' : '加入发布队列'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Task List ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: tk.foregroundMuted,
              }}
            >
              <Send size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>暂无发布任务</span>
              <span style={{ fontSize: '11px' }}>点击「新建发布」创建你的第一个发布任务</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTasks.map(task => {
                const isExpanded = expandedTask === task.id
                return (
                  <div
                    key={task.id}
                    style={{
                      border: `1px solid ${tk.borderDim}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: isCyberpunk ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    {/* Task Header */}
                    <div
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {isExpanded ? <ChevronDown size={14} style={{ color: tk.foregroundMuted, flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: tk.foregroundMuted, flexShrink: 0 }} />}
                        <StatusBadge status={task.status} />
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: tk.foreground,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {task.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {task.platforms.map(p => {
                            const Icon = PLATFORM_ICONS[p]
                            return (
                              <span
                                key={p}
                                title={PLATFORM_NAMES[p]}
                                style={{ color: PLATFORM_COLORS[p], display: 'flex' }}
                              >
                                <Icon size={12} />
                              </span>
                            )
                          })}
                        </div>
                        <span style={{ fontSize: '10px', color: tk.foregroundMuted, marginLeft: '6px' }}>
                          {task.createdAt ? formatDate(task.createdAt) : ''}
                        </span>
                      </div>
                    </div>

                    {/* Task Detail */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 14px 10px 30px',
                          borderTop: `1px solid ${tk.borderDim}`,
                        }}
                      >
                        <div style={{ padding: '10px 0' }}>
                          {/* Content preview */}
                          {task.content && (
                            <div style={{
                              fontSize: '11px',
                              color: tk.foregroundMuted,
                              lineHeight: '1.6',
                              marginBottom: '10px',
                              maxHeight: '60px',
                              overflow: 'hidden',
                            }}>
                              {task.content.slice(0, 200)}
                              {task.content.length > 200 ? '...' : ''}
                            </div>
                          )}

                          {/* Platforms detail */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {task.platforms.map(p => (
                              <span
                                key={p}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: PLATFORM_COLORS[p] + '15',
                                  color: PLATFORM_COLORS[p],
                                }}
                              >
                                {PLATFORM_NAMES[p]}
                              </span>
                            ))}
                          </div>

                          {/* Schedule info */}
                          {task.status === 'scheduled' && task.scheduledAt && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              color: '#2563eb',
                              marginBottom: '8px',
                            }}>
                              <Calendar size={10} />
                              <span>计划发布：{formatDate(task.scheduledAt)}</span>
                            </div>
                          )}

                          {/* Published info */}
                          {task.status === 'published' && task.publishedAt && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              color: '#059669',
                              marginBottom: '8px',
                            }}>
                              <Check size={10} />
                              <span>已发布：{formatDate(task.publishedAt)}</span>
                            </div>
                          )}

                          {/* Error info */}
                          {task.status === 'failed' && task.error && (
                            <div style={{
                              fontSize: '10px',
                              color: '#dc2626',
                              marginBottom: '8px',
                              padding: '6px 10px',
                              background: '#fef2f2',
                              borderRadius: '6px',
                            }}>
                              {task.error}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {task.status === 'draft' && (
                              <button
                                onClick={() => handlePublishNow(task.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  fontSize: '10px',
                                  background: tk.primary,
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: tk.primaryForeground,
                                  cursor: 'pointer',
                                }}
                              >
                                <Send size={10} />
                                立即发布
                              </button>
                            )}
                            {task.status === 'publishing' && (
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '10px',
                                color: '#d97706',
                              }}>
                                <RefreshCw size={10} className="animate-spin" />
                                发布中...
                              </span>
                            )}
                            {task.status === 'published' && (
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '10px',
                                color: '#059669',
                              }}>
                                <ExternalLink size={10} />
                                查看已发布
                              </span>
                            )}
                            <button
                              onClick={() => handleDelete(task.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '10px',
                                background: 'transparent',
                                border: `1px solid ${tk.border}`,
                                borderRadius: '6px',
                                color: tk.foregroundMuted,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={10} />
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
