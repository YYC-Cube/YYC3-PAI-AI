/**
 * @file RecentFilesPanel.tsx
 * @description 最近文件面板组件，提供最近文件管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,recent,files,ui,component
 */

import { useCallback } from 'react'
import {
  X, Clock, FileCode, FileText, FileJson, Palette, Trash2,
} from 'lucide-react'
import { useThemeStore, Z_INDEX } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { useFileStore } from '../store/file-store'

/** 根据扩展名获取图标 */
function getFileIcon(ext: string) {
  switch (ext) {
    case 'tsx': case 'ts': case 'jsx': case 'js': return FileCode
    case 'css': case 'scss': return Palette
    case 'json': return FileJson
    default: return FileText
  }
}

/** 根据扩展名获取图标颜色 */
function getFileColor(ext: string, tk: { primary: string; success: string; warning: string; secondary: string; foregroundMuted: string }): string {
  switch (ext) {
    case 'tsx': case 'jsx': return tk.primary
    case 'ts': case 'js': return tk.success
    case 'css': case 'scss': return tk.secondary
    case 'json': return tk.warning
    default: return tk.foregroundMuted
  }
}

/** 格式化相对时间 */
function relativeTime(ts: number, isZh: boolean): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return isZh ? '刚刚' : 'Just now'
  if (mins < 60) return isZh ? `${mins} 分钟前` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return isZh ? `${hours} 小时前` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return isZh ? `${days} 天前` : `${days}d ago`
}

interface RecentFilesPanelProps {
  /** 打开文件回调 */
  onOpenFile?: (filename: string) => void
}

export function RecentFilesPanel({ onOpenFile }: RecentFilesPanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { recentFiles, recentPanelVisible, closeRecentPanel, removeRecentFile, clearRecentFiles } = useFileStore()

  const handleOpen = useCallback((filename: string) => {
    onOpenFile?.(filename)
    closeRecentPanel()
  }, [onOpenFile, closeRecentPanel])

  if (!recentPanelVisible) return null

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0" style={{ zIndex: Z_INDEX.modal - 1 }} onClick={closeRecentPanel} />
      {/* 面板 */}
      <div
        className="fixed rounded-xl overflow-hidden flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          maxHeight: '60vh',
          zIndex: Z_INDEX.modal,
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          boxShadow: tk.shadowHover,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
          <Clock size={14} color={tk.primary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
            {isZh ? '最近文件' : 'Recent Files'}
          </span>
          <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>
            {recentFiles.length}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {recentFiles.length > 0 && (
              <button
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 transition-all"
                style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}
                onClick={() => { clearRecentFiles() }}
              >
                <Trash2 size={9} />
                {isZh ? '清除' : 'Clear'}
              </button>
            )}
            <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={closeRecentPanel}>
              <X size={14} color={tk.foregroundMuted} />
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto neon-scrollbar">
          {recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock size={28} color={tk.borderDim} className="mb-3" />
              <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
                {isZh ? '暂无最近文件' : 'No recent files'}
              </p>
              <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.6, marginTop: 4 }}>
                {isZh ? '打开文件后将自动记录' : 'Files will appear here after you open them'}
              </p>
            </div>
          ) : (
            recentFiles.map((file) => {
              const IconComp = getFileIcon(file.ext)
              const iconColor = getFileColor(file.ext, tk)

              return (
                <div
                  key={file.filename}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-white/3 group"
                  style={{ borderBottom: `1px solid ${tk.borderDim}06` }}
                  onClick={() => handleOpen(file.filename)}
                >
                  <IconComp size={14} color={iconColor} style={{ opacity: 0.7, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground }}>
                        {file.filename}
                      </span>
                      {file.isModified && (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                          background: tk.warning,
                          boxShadow: isCyberpunk ? `0 0 4px ${tk.warning}` : 'none',
                        }} />
                      )}
                    </div>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                      {relativeTime(file.lastAccessed, isZh)}
                    </span>
                  </div>
                  <button
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRecentFile(file.filename)
                    }}
                  >
                    <X size={10} color={tk.foregroundMuted} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${tk.borderDim}`, background: tk.backgroundAlt }}>
          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, opacity: 0.5 }}>
            {isZh ? '提示：Ctrl+E 快速打开最近文件' : 'Tip: Ctrl+E to quickly open recent files'}
          </span>
        </div>
      </div>
    </>
  )
}
