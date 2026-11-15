/**
 * @file NotificationCenter.tsx
 * @description 通知中心组件，提供通知管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,notification,ui,component
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  X, Bell, BellOff, CheckCheck, Trash2,
  Bot, Cpu, FolderOpen,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useActivityStore, type ActivityEntry } from '../store/activity-store'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'

// ===== Notification Types =====
export type NotifCategory = 'system' | 'ai' | 'project'
export type NotifLevel = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  category: NotifCategory
  level: NotifLevel
  title: { zh: string; en: string }
  message: { zh: string; en: string }
  timestamp: number
  read: boolean
}

// ===== 真实事件源：activity-store 持久化活动日志（file/git/ai/system）→ 通知 =====
// 历史 mock 七条假通知已删；无活动时显示空态而非编造内容
function categoryLabelZh(category: ActivityEntry['category']): string {
  switch (category) {
    case 'ai': return 'AI 助手'
    case 'git': return '项目/Git'
    case 'file': return '文件'
    default: return '系统'
  }
}

function notificationsFromActivities(entries: ActivityEntry[]): Notification[] {
  return entries
    .slice(0, 50)
    .map((e) => {
      const category: NotifCategory =
        e.category === 'ai' ? 'ai' : e.category === 'git' ? 'project' : 'system'
      return {
        id: e.id,
        category,
        level: 'info' as NotifLevel,
        title: { zh: categoryLabelZh(e.category), en: e.category },
        message: { zh: e.messageZh, en: e.message },
        timestamp: e.timestamp,
        read: true,
      }
    })
}

type TabFilter = 'all' | NotifCategory

interface NotificationCenterProps {
  visible: boolean
  onClose: () => void
}

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const { t, locale } = useI18n()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const activities = useActivityStore()
  const [notifications, setNotifications] = useState<Notification[]>(() => notificationsFromActivities(activities.entries))
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications
    return notifications.filter((n) => n.category === activeTab)
  }, [notifications, activeTab])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])

  const removeNotif = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  function relativeTime(ts: number): string {
    const diff = currentTime - ts
    if (diff < 60000) return t('notifications', 'justNow')
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t('notifications', 'minutesAgo')}`
    return `${Math.floor(diff / 3600000)} ${t('notifications', 'hoursAgo')}`
  }

  function levelColor(level: NotifLevel): string {
    return { info: tk.primary, success: tk.success, warning: tk.warning, error: tk.error }[level]
  }

  function catIcon(cat: NotifCategory): React.ElementType {
    return { system: Cpu, ai: Bot, project: FolderOpen }[cat]
  }

  const tabFilters: { key: TabFilter; labelKey: string }[] = [
    { key: 'all', labelKey: 'tabAll' },
    { key: 'system', labelKey: 'tabSystem' },
    { key: 'ai', labelKey: 'tabAI' },
    { key: 'project', labelKey: 'tabProject' },
  ]

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.sm }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 480,
          maxHeight: '75vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 30px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell size={16} color={tk.primary} />
              {unreadCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{
                    background: tk.error,
                    boxShadow: isCyberpunk ? `0 0 6px ${tk.error}` : 'none',
                  }}
                >
                  <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: '#fff' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1px', margin: 0 }}>
                {t('notifications', 'title')}
              </h2>
              <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '1px', margin: 0 }}>
                {t('notifications', 'subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={markAllRead} className="p-1.5 rounded transition-all hover:opacity-80" title={t('notifications', 'markAllRead')}>
              <CheckCheck size={13} color={tk.foregroundMuted} />
            </button>
            <button onClick={clearAll} className="p-1.5 rounded transition-all hover:opacity-80" title={t('notifications', 'clearAll')}>
              <Trash2 size={13} color={tk.foregroundMuted} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded transition-all hover:opacity-80">
              <X size={14} color={tk.foregroundMuted} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: tk.border }}>
          {tabFilters.map(({ key, labelKey }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-3 py-1 rounded-full transition-all"
                style={{
                  background: isActive ? tk.primaryGlow : 'transparent',
                  border: `1px solid ${isActive ? tk.primary : 'transparent'}`,
                  fontFamily: tk.fontMono,
                  fontSize: '9px',
                  color: isActive ? tk.primary : tk.foregroundMuted,
                  letterSpacing: '0.5px',
                }}
              >
                {t('notifications', labelKey)}
              </button>
            )
          })}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto neon-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <BellOff size={28} color={tk.foregroundMuted} style={{ opacity: 0.2 }} />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
                {t('notifications', 'empty')}
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const CatIcon = catIcon(notif.category)
              const color = levelColor(notif.level)
              return (
                <div
                  key={notif.id}
                  className="flex gap-3 px-5 py-3 border-b transition-all cursor-pointer"
                  style={{
                    borderColor: tk.borderDim,
                    background: notif.read ? 'transparent' : tk.primaryGlow,
                    opacity: notif.read ? 0.7 : 1,
                  }}
                  onClick={() => markRead(notif.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: `${color}12`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <CatIcon size={14} color={color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p style={{
                        fontFamily: tk.fontBody,
                        fontSize: '12px',
                        color: tk.foreground,
                        margin: 0,
                      }}>
                        {notif.title[locale]}
                      </p>
                      {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tk.primary, boxShadow: isCyberpunk ? `0 0 4px ${tk.primary}` : 'none' }} />
                      )}
                    </div>
                    <p style={{
                      fontFamily: tk.fontMono,
                      fontSize: '10px',
                      color: tk.foregroundMuted,
                      margin: '2px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {notif.message[locale]}
                    </p>
                    <p style={{
                      fontFamily: tk.fontMono,
                      fontSize: '8px',
                      color: tk.foregroundMuted,
                      margin: '4px 0 0 0',
                      opacity: 0.6,
                    }}>
                      {relativeTime(notif.timestamp)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNotif(notif.id) }}
                    className="p-1 rounded opacity-0 hover:opacity-100 transition-all shrink-0 self-start"
                    style={{ opacity: 0.3 }}
                  >
                    <X size={10} color={tk.foregroundMuted} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
