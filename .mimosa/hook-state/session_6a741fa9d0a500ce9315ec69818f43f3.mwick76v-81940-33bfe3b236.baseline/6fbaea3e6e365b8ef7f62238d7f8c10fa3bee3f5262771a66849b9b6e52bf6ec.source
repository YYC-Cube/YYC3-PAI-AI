/**
 * @file VersionHistoryPanel.tsx
 * @description 版本历史面板组件，提供版本历史
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,version,history,ui,component
 */

import { useState, useMemo, useCallback } from 'react'
import {
  X, History, RotateCcw, Trash2,
  ChevronDown, FileDiff, Save, Tag,
} from 'lucide-react'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { useFileStore, type DiffLine } from '../store/file-store'
import { CyberTooltip } from './CyberTooltip'
import { cyberToast } from './CyberToast'

interface VersionHistoryPanelProps {
  /** 当前文件内容（用于与版本对比） */
  currentContent?: string
  /** 回滚回调 */
  onRollback?: (content: string, versionId: string) => void
}

export function VersionHistoryPanel({ currentContent = '', onRollback }: VersionHistoryPanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const {
    versionPanelVisible, versionPanelFile, diffVersionId,
    closeVersionPanel, setDiffVersion, getVersions, getVersionContent,
    deleteVersion, clearVersions, createVersion, computeLineDiff,
  } = useFileStore()

  const [showDiff, setShowDiff] = useState(false)

  // 直接计算而非 useMemo：版本数据不在依赖里，memo 会导致面板打开期间保存/删除/清空后列表不刷新
  const versions = versionPanelFile ? getVersions(versionPanelFile).slice().reverse() : []

  /** 计算 diff */
  const diffLines: DiffLine[] = useMemo(() => {
    if (!diffVersionId || !versionPanelFile) return []
    const versionContent = getVersionContent(diffVersionId)
    if (versionContent === null) return []
    return computeLineDiff(versionContent, currentContent)
  }, [diffVersionId, currentContent, versionPanelFile, getVersionContent, computeLineDiff])

  const handleRollback = useCallback((versionId: string) => {
    const content = getVersionContent(versionId)
    if (content !== null && versionPanelFile) {
      onRollback?.(content, versionId)
      cyberToast(isZh ? '已回滚到选定版本' : 'Rolled back to selected version')
    }
  }, [getVersionContent, versionPanelFile, onRollback, isZh])

  const handleSaveSnapshot = useCallback(() => {
    if (versionPanelFile && currentContent) {
      createVersion(versionPanelFile, currentContent, 'manual', isZh ? '手动保存快照' : 'Manual snapshot')
      cyberToast(isZh ? '已保存版本快照' : 'Version snapshot saved')
    }
  }, [versionPanelFile, currentContent, createVersion, isZh])

  if (!versionPanelVisible || !versionPanelFile) return null

  const addedCount = diffLines.filter(l => l.type === 'added').length
  const removedCount = diffLines.filter(l => l.type === 'removed').length

  return (
    <div
      className="fixed right-0 top-0 h-full flex flex-col"
      style={{
        width: 380,
        zIndex: Z_INDEX.modal,
        background: tk.panelBg,
        borderLeft: `1px solid ${tk.cardBorder}`,
        backdropFilter: BLUR.heavy,
        boxShadow: tk.shadowHover,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
        <History size={14} color={tk.primary} />
        <span style={{ fontFamily: tk.fontMono, fontSize: '12px', color: tk.foreground }}>
          {isZh ? '版本历史' : 'Version History'}
        </span>
        <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primaryDim, maxWidth: 140 }}>
          {versionPanelFile}
        </span>
        <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.backgroundAlt }}>
          {versions.length} {isZh ? '个版本' : 'versions'}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <CyberTooltip label={isZh ? '保存快照' : 'Save Snapshot'} position="left">
            <button className="p-1 rounded hover:bg-white/5 transition-all" onClick={handleSaveSnapshot}>
              <Save size={12} color={tk.success} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={isZh ? '清除所有版本' : 'Clear All'} position="left">
            <button
              className="p-1 rounded hover:bg-white/5 transition-all"
              onClick={() => { clearVersions(versionPanelFile); cyberToast(isZh ? '版本已清除' : 'Versions cleared') }}
            >
              <Trash2 size={12} color={tk.error} />
            </button>
          </CyberTooltip>
          <button className="p-1 rounded hover:bg-white/10 transition-all" onClick={closeVersionPanel}>
            <X size={14} color={tk.foregroundMuted} />
          </button>
        </div>
      </div>

      {/* Version Timeline */}
      <div className="flex-1 overflow-y-auto neon-scrollbar">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}` }}>
              <History size={24} color={tk.borderDim} />
            </div>
            <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted }}>
              {isZh ? '暂无版本记录' : 'No versions yet'}
            </p>
            <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.6, marginTop: 4 }}>
              {isZh ? '编辑文件后将自动记录版本' : 'Versions will be recorded when you edit files'}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {versions.map((version, idx) => {
              const isSelected = diffVersionId === version.id
              const timeStr = new Date(version.timestamp).toLocaleString(isZh ? 'zh-CN' : 'en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                month: 'short', day: 'numeric',
              })
              const isLatest = idx === 0

              return (
                <div key={version.id} className="relative">
                  {/* Timeline connector */}
                  <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: tk.borderDim }} />

                  <div
                    className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-white/3"
                    style={{
                      background: isSelected ? `${tk.primary}08` : 'transparent',
                      borderLeft: isSelected ? `2px solid ${tk.primary}` : '2px solid transparent',
                    }}
                    onClick={() => {
                      setDiffVersion(isSelected ? null : version.id)
                      setShowDiff(true)
                    }}
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          borderColor: isLatest ? tk.success : version.label === 'manual' ? tk.warning : tk.primaryDim,
                          background: isSelected ? tk.primary : tk.panelBg,
                          boxShadow: isSelected && isCyberpunk ? `0 0 6px ${tk.primary}` : 'none',
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
                          {timeStr}
                        </span>
                        {isLatest && (
                          <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.success, background: `${tk.success}15`, border: `1px solid ${tk.success}33` }}>
                            {isZh ? '最新' : 'LATEST'}
                          </span>
                        )}
                        {version.label === 'manual' && (
                          <Tag size={8} color={tk.warning} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                          {version.description}
                        </span>
                        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, opacity: 0.5 }}>
                          {version.size > 1024 ? `${(version.size / 1024).toFixed(1)}KB` : `${version.size}B`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <CyberTooltip label={isZh ? '回滚到此版本' : 'Rollback'} position="left">
                        <button
                          className="p-1 rounded hover:bg-white/10 transition-all"
                          onClick={(e) => { e.stopPropagation(); handleRollback(version.id) }}
                        >
                          <RotateCcw size={10} color={tk.warning} />
                        </button>
                      </CyberTooltip>
                      <CyberTooltip label={isZh ? '删除版本' : 'Delete'} position="left">
                        <button
                          className="p-1 rounded hover:bg-white/10 transition-all"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteVersion(versionPanelFile, version.id)
                          }}
                        >
                          <Trash2 size={10} color={tk.error} style={{ opacity: 0.5 }} />
                        </button>
                      </CyberTooltip>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Diff Viewer */}
      {showDiff && diffVersionId && diffLines.length > 0 && (
        <div className="shrink-0" style={{ borderTop: `1px solid ${tk.borderDim}`, maxHeight: '40%' }}>
          <div className="flex items-center gap-2 px-4 py-2" style={{ background: tk.backgroundAlt }}>
            <FileDiff size={11} color={tk.primary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foreground }}>
              {isZh ? 'Diff 对比' : 'Diff View'}
            </span>
            <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.success, background: `${tk.success}12` }}>
              +{addedCount}
            </span>
            <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.error, background: `${tk.error}12` }}>
              -{removedCount}
            </span>
            <button className="ml-auto p-0.5 rounded hover:bg-white/10" onClick={() => setShowDiff(false)}>
              <ChevronDown size={10} color={tk.foregroundMuted} />
            </button>
          </div>
          <div className="overflow-y-auto neon-scrollbar" style={{ maxHeight: 200 }}>
            {diffLines.filter(l => l.type !== 'same').slice(0, 100).map((line, i) => (
              <div
                key={`diff-${i}`}
                className="flex items-start gap-2 px-4 py-0.5"
                style={{
                  background: line.type === 'added' ? `${tk.success}08` : `${tk.error}08`,
                  borderLeft: `2px solid ${line.type === 'added' ? tk.success : tk.error}`,
                }}
              >
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, minWidth: 24, textAlign: 'right' }}>
                  {line.lineNumber}
                </span>
                <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: line.type === 'added' ? tk.success : tk.error }}>
                  {line.type === 'added' ? '+' : '-'}
                </span>
                <span className="truncate" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foreground }}>
                  {line.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
