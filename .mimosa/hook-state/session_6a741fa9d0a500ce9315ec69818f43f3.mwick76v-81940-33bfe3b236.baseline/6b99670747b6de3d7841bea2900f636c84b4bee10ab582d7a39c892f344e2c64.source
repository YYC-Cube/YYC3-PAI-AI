/**
 * @file FileContextMenu.tsx
 * @description 文件上下文菜单组件，提供文件菜单
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags context-menu,file,ui,component
 */

import {
  FileText, Edit3, Trash2, Copy, History, FolderPlus, FilePlus,
  Pin, ExternalLink,
} from 'lucide-react'
import { useThemeStore } from '../store/theme-store'
import { useI18n } from '../i18n/context'

export interface FileContextMenuProps {
  /** 菜单位置 */
  x: number
  y: number
  /** 文件名 */
  filename: string
  /** 是否文件夹 */
  isFolder: boolean
  /** 关闭菜单 */
  onClose: () => void
  /** 操作回调 */
  onOpen?: (filename: string) => void
  onRename?: (filename: string) => void
  onDelete?: (filename: string) => void
  onCopyPath?: (filename: string) => void
  onNewFile?: (parentFolder: string) => void
  onNewFolder?: (parentFolder: string) => void
  onViewHistory?: (filename: string) => void
  onPinTab?: (filename: string) => void
  onRevealInTree?: (filename: string) => void
}

export function FileContextMenu({
  x, y, filename, isFolder, onClose,
  onOpen, onRename, onDelete, onCopyPath,
  onNewFile, onNewFolder, onViewHistory, onPinTab, onRevealInTree,
}: FileContextMenuProps) {
  const { tokens: tk } = useThemeStore()
  const { locale } = useI18n()
  const isZh = locale === 'zh'

  type MenuItem = {
    label: string
    icon: typeof FileText
    action: () => void
    color?: string
    disabled?: boolean
    divider?: false
  } | { divider: true }

  const items: MenuItem[] = [
    ...(isFolder ? [] : [{
      label: isZh ? '打开文件' : 'Open File',
      icon: FileText,
      action: () => { onOpen?.(filename); onClose() },
    } as MenuItem]),
    ...(isFolder ? [
      {
        label: isZh ? '新建文件' : 'New File',
        icon: FilePlus,
        action: () => { onNewFile?.(filename); onClose() },
      } as MenuItem,
      {
        label: isZh ? '新建文件夹' : 'New Folder',
        icon: FolderPlus,
        action: () => { onNewFolder?.(filename); onClose() },
      } as MenuItem,
    ] : []),
    { divider: true },
    {
      label: isZh ? '重命名' : 'Rename',
      icon: Edit3,
      action: () => { onRename?.(filename); onClose() },
    },
    {
      label: isZh ? '复制路径' : 'Copy Path',
      icon: Copy,
      action: () => { onCopyPath?.(filename); onClose() },
    },
    ...(!isFolder ? [
      {
        label: isZh ? '固定到标签栏' : 'Pin to Tab Bar',
        icon: Pin,
        action: () => { onPinTab?.(filename); onClose() },
      } as MenuItem,
    ] : []),
    { divider: true },
    ...(!isFolder ? [
      {
        label: isZh ? '版本历史' : 'Version History',
        icon: History,
        action: () => { onViewHistory?.(filename); onClose() },
      } as MenuItem,
    ] : []),
    {
      label: isZh ? '在树中定位' : 'Reveal in Tree',
      icon: ExternalLink,
      action: () => { onRevealInTree?.(filename); onClose() },
    },
    { divider: true },
    {
      label: isZh ? '删除' : 'Delete',
      icon: Trash2,
      action: () => { onDelete?.(filename); onClose() },
      color: tk.error,
    },
  ]

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={onClose} />
      {/* 菜单 */}
      <div
        className="fixed rounded-lg overflow-hidden py-1"
        style={{
          left: Math.min(x, window.innerWidth - 180),
          top: Math.min(y, window.innerHeight - 300),
          zIndex: 999,
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          boxShadow: tk.shadowHover,
          minWidth: 170,
          backdropFilter: 'blur(12px)',
        }}
      >
        {items.map((item, i) => {
          if ('divider' in item && item.divider) {
            return <div key={`d-${i}`} style={{ height: 1, background: tk.borderDim, margin: '3px 6px' }} />
          }
          return (
            <button
              key={`m-${i}`}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-all hover:bg-white/5"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '10px',
                color: item.color || tk.foreground,
                opacity: item.disabled ? 0.4 : 1,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !item.disabled && item.action()}
              disabled={item.disabled}
            >
              <item.icon size={11} color={item.color || tk.primary} style={{ opacity: 0.7 }} />
              {item.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
