/**
 * @file EditorTabBar.tsx
 * @description 编辑器标签栏组件，提供标签页管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags editor,tabs,ui,component
 */

import { useCallback, useRef, useState } from 'react'
import { X, Pin, PinOff, FileCode, FileText, FileJson, Palette } from 'lucide-react'
import { useThemeStore } from '../store/theme-store'
import { useIDEStore } from '../store/ide-store'
import { useI18n } from '../i18n/context'

/** 根据文件扩展名获取图标 */
function getFileIcon(ext: string) {
  switch (ext) {
    case 'tsx': case 'ts': case 'jsx': case 'js':
      return FileCode
    case 'css': case 'scss':
      return Palette
    case 'json':
      return FileJson
    default:
      return FileText
  }
}

/** 根据文件扩展名获取图标颜色 */
function getFileColor(ext: string, tk: { primary: string; success: string; warning: string; secondary: string; foregroundMuted: string }): string {
  switch (ext) {
    case 'tsx': case 'jsx': return tk.primary
    case 'ts': case 'js': return tk.success
    case 'css': case 'scss': return tk.secondary
    case 'json': return tk.warning
    default: return tk.foregroundMuted
  }
}

export function EditorTabBar() {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { openTabs, activeTabId, activateTab, closeTab, togglePinTab, closeOtherTabs, closeTabsToRight } = useIDEStore()

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null)

  // Drag state for tab reordering
  const dragIdxRef = useRef<number | null>(null)
  /** 对齐 Guidelines: Tab Dragging — 拖拽位置指示 */
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ tabId, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  // Tab drag reorder (simple swap)
  const { reorderTabs } = useIDEStore()

  return (
    <>
      <div
        className="flex items-center overflow-x-auto neon-scrollbar shrink-0"
        style={{
          borderBottom: `1px solid ${tk.borderDim}`,
          background: tk.backgroundAlt,
          minHeight: 32,
        }}
        onClick={closeContextMenu}
      >
        {openTabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId
          const IconComp = getFileIcon(tab.ext)
          const iconColor = getFileColor(tab.ext, tk)

          return (
            <div
              key={tab.id}
              className="flex items-center gap-1 px-2.5 py-1.5 border-r cursor-pointer transition-all group shrink-0"
              style={{
                borderColor: tk.borderDim,
                background: isActive ? tk.panelBg : dropTarget === idx ? `${tk.primary}10` : 'transparent',
                borderBottom: isActive ? `2px solid ${tk.primary}` : '2px solid transparent',
                borderLeft: dropTarget === idx ? `2px solid ${tk.primary}` : undefined,
                maxWidth: 160,
                transition: 'background 0.15s, border-left 0.15s',
              }}
              onClick={() => activateTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              draggable
              onDragStart={(e) => {
                dragIdxRef.current = idx
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (dragIdxRef.current !== null && dragIdxRef.current !== idx) {
                  setDropTarget(idx)
                }
              }}
              onDragLeave={() => setDropTarget(null)}
              onDragEnd={() => { setDropTarget(null); dragIdxRef.current = null }}
              onDrop={() => {
                if (dragIdxRef.current !== null && dragIdxRef.current !== idx) {
                  reorderTabs(dragIdxRef.current, idx)
                }
                dragIdxRef.current = null
                setDropTarget(null)
              }}
            >
              {/* Pin indicator */}
              {tab.isPinned && (
                <Pin size={8} color={tk.warning} style={{ flexShrink: 0 }} />
              )}

              {/* File icon */}
              <IconComp size={11} color={isActive ? iconColor : tk.foregroundMuted} style={{ flexShrink: 0 }} />

              {/* File name */}
              <span
                className="truncate"
                style={{
                  fontFamily: tk.fontMono,
                  fontSize: '10px',
                  color: isActive ? tk.foreground : tk.foregroundMuted,
                  maxWidth: 100,
                  letterSpacing: '0.3px',
                }}
              >
                {tab.label}
              </span>

              {/* Modified indicator */}
              {tab.isModified && (
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: tk.warning,
                    boxShadow: isCyberpunk ? `0 0 4px ${tk.warning}` : 'none',
                  }}
                />
              )}

              {/* Close button (hidden for pinned tabs) */}
              {!tab.isPinned && (
                <button
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <X size={9} color={tk.foregroundMuted} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 999 }} onClick={closeContextMenu} />
          <div
            className="fixed rounded-lg overflow-hidden"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000,
              background: tk.panelBg,
              border: `1px solid ${tk.cardBorder}`,
              boxShadow: tk.shadowHover,
              minWidth: 160,
            }}
          >
            {[
              {
                label: isZh ? '关闭' : 'Close',
                action: () => { closeTab(contextMenu.tabId); closeContextMenu() },
                disabled: openTabs.find(t => t.id === contextMenu.tabId)?.isPinned,
              },
              {
                label: isZh ? '关闭其他' : 'Close Others',
                action: () => { closeOtherTabs(contextMenu.tabId); closeContextMenu() },
              },
              {
                label: isZh ? '关闭右侧' : 'Close to Right',
                action: () => { closeTabsToRight(contextMenu.tabId); closeContextMenu() },
              },
              { divider: true },
              {
                label: openTabs.find(t => t.id === contextMenu.tabId)?.isPinned
                  ? (isZh ? '取消固定' : 'Unpin')
                  : (isZh ? '固定标签' : 'Pin Tab'),
                icon: openTabs.find(t => t.id === contextMenu.tabId)?.isPinned ? PinOff : Pin,
                action: () => { togglePinTab(contextMenu.tabId); closeContextMenu() },
              },
            ].map((item, i) => {
              if ('divider' in item && item.divider) {
                return <div key={i} style={{ height: 1, background: tk.borderDim, margin: '2px 0' }} />
              }
              return (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all hover:bg-white/5"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '10px',
                    color: 'disabled' in item && item.disabled ? tk.foregroundMuted : tk.foreground,
                    opacity: 'disabled' in item && item.disabled ? 0.4 : 1,
                    cursor: 'disabled' in item && item.disabled ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => !('disabled' in item && item.disabled) && item.action?.()}
                  disabled={'disabled' in item ? !!item.disabled : false}
                >
                  {'icon' in item && item.icon && <item.icon size={10} color={tk.primary} />}
                  {'label' in item ? item.label : ''}
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
