/**
 * @file MaterialManager.tsx
 * @description Phase 2.3: 素材管理器 — 图片/音频/代码片段/文本片段管理
 * 支持分类管理、搜索筛选、拖拽引用
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @updated 2026-06-03
 * @status active
 * @tags [self-media],[material],[phase2]
 */

'use client'

import {
  Check,
  Code,
  Copy,
  Eye,
  FileText,
  FolderOpen,
  Grid3X3,
  Image,
  List,
  Music,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { indexedDBService } from '../services/indexeddb-service'
import { useSelfMediaStore } from '../store/self-media-store'
import { BLUR, Z_INDEX, useThemeStore } from '../store/theme-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('MaterialManager')

// ── Types ──

export interface MaterialManagerProps {
  visible: boolean
  onClose: () => void
  /** 将素材内容插入编辑器 */
  onInsertContent?: (content: string, type: MaterialType) => void
}

export type MaterialType = 'image' | 'audio' | 'code' | 'text'
export type ViewMode = 'grid' | 'list'

export interface MaterialItem {
  id: string
  type: MaterialType
  name: string
  content: string
  /** 图片/音频 URL 或 base64 */
  url?: string
  /** 代码语言（仅 code 类型） */
  language?: string
  /** 标签 */
  tags: string[]
  /** 分类 */
  category: string
  /** 大小（字节） */
  size: number
  /** 内容是否存储在 IndexedDB 中（大文件降级） */
  storedInIDB?: boolean
  createdAt: number
  updatedAt: number
}

export interface MaterialCategory {
  id: string
  name: string
  type: MaterialType
  icon: typeof Image
  count: number
}

// ── Constants ──

const MATERIAL_TYPES: { value: MaterialType; label: string; icon: typeof Image; color: string }[] = [
  { value: 'image', label: '图片', icon: Image, color: '#6366f1' },
  { value: 'audio', label: '音频', icon: Music, color: '#8b5cf6' },
  { value: 'code', label: '代码片段', icon: Code, color: '#10b981' },
  { value: 'text', label: '文本片段', icon: FileText, color: '#f59e0b' },
]

const DEFAULT_CATEGORIES: MaterialCategory[] = [
  { id: 'all', name: '全部', type: 'text', icon: FolderOpen, count: 0 },
  { id: 'image', name: '图片素材', type: 'image', icon: Image, count: 0 },
  { id: 'audio', name: '音频素材', type: 'audio', icon: Music, count: 0 },
  { id: 'code', name: '代码片段', type: 'code', icon: Code, count: 0 },
  { id: 'text', name: '文本片段', type: 'text', icon: FileText, count: 0 },
]

const LS_MATERIALS = 'yyc3_materials'

function genId() { return 'mat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8) }

// ── Component ──

export function MaterialManager({ visible, onClose, onInsertContent }: MaterialManagerProps) {
  const { tokens } = useThemeStore()
  const { insertCallback, panelActions } = useSelfMediaStore()

  // State — 从 localStorage 恢复 metadata
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_MATERIALS)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeType, setActiveType] = useState<MaterialType | 'all'>('all')
  const [selectedItem, setSelectedItem] = useState<MaterialItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const LARGE_CONTENT_THRESHOLD = 50 * 1024 // 50KB以上存入 IndexedDB

  // Save materials — 大文件内容迁入 IndexedDB
  const saveMaterials = useCallback(async (updated: MaterialItem[]) => {
    // 异步处理大文件迁移
    for (const item of updated) {
      if (!item.storedInIDB && item.content.length > LARGE_CONTENT_THRESHOLD) {
        try {
          await indexedDBService.set('files', item.id, {
            content: item.content,
            url: item.url || '',
            type: item.type,
          })
          item.storedInIDB = true
          item.content = `__idb_ref:${item.id}`
        } catch (e) {
          logger.warn('[MaterialManager] IDB save failed, fallback to localStorage:', e)
        }
      }
    }
    setMaterials(updated)
    // localStorage 存精简后的 metadata
    const stripped = updated.map(m => {
      if (m.storedInIDB) {
        return { ...m, content: `__idb_ref:${m.id}` }
      }
      return m
    })
    try { localStorage.setItem(LS_MATERIALS, JSON.stringify(stripped)) } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Category counts
  const categories = useMemo(() => {
    return DEFAULT_CATEGORIES.map(cat => {
      let count = 0
      if (cat.id === 'all') {
        count = materials.length
      } else {
        count = materials.filter(m => m.type === cat.id).length
      }
      return { ...cat, count }
    })
  }, [materials])

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      // Category filter
      if (activeCategory !== 'all' && m.type !== activeCategory) return false
      // Type filter
      if (activeType !== 'all' && m.type !== activeType) return false
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return m.name.toLowerCase().includes(q) ||
          m.tags.some(t => t.toLowerCase().includes(q)) ||
          m.content.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [materials, activeCategory, activeType, searchQuery])

  // Import file
  const handleImportFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newMaterials: MaterialItem[] = []

    for (const file of Array.from(files)) {
      const type: MaterialType = file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('audio/') ? 'audio' :
          file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md') ? 'text' :
            'code'

      let content = file.name
      let url: string | undefined

      if (type === 'image') {
        // Read as data URL for preview
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        url = content
      } else if (type === 'text' || type === 'code') {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsText(file)
        })
      }

      const lang = type === 'code' ? file.name.split('.').pop() || 'text' : undefined

      newMaterials.push({
        id: genId(),
        type,
        name: file.name,
        content: content.slice(0, 5000),
        url,
        language: lang,
        tags: [],
        category: type,
        size: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    saveMaterials([...newMaterials, ...materials])
    e.target.value = ''
  }, [materials, saveMaterials])

  // Add text snippet
  const handleAddText = useCallback(() => {
    const name = `文本片段 ${materials.filter(m => m.type === 'text').length + 1}`
    const newItem: MaterialItem = {
      id: genId(),
      type: 'text',
      name,
      content: '在此输入文本内容...',
      tags: [],
      category: 'text',
      size: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveMaterials([newItem, ...materials])
    setSelectedItem(newItem)
  }, [materials, saveMaterials])

  // Add code snippet
  const handleAddCode = useCallback(() => {
    const name = `代码片段 ${materials.filter(m => m.type === 'code').length + 1}`
    const newItem: MaterialItem = {
      id: genId(),
      type: 'code',
      name,
      content: '// 在此输入代码...',
      language: 'typescript',
      tags: [],
      category: 'code',
      size: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveMaterials([newItem, ...materials])
    setSelectedItem(newItem)
  }, [materials, saveMaterials])

  // Delete material
  const handleDelete = useCallback((id: string) => {
    // 同时删除 IndexedDB 中的大文件内容
    const item = materials.find(m => m.id === id)
    if (item?.storedInIDB) {
      indexedDBService.delete('files', id).catch(() => { })
    }
    saveMaterials(materials.filter(m => m.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)
  }, [materials, saveMaterials, selectedItem])

  // Copy content
  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* */ }
  }, [])

  // Insert content
  const handleInsert = useCallback((item: MaterialItem) => {
    const content = item.type === 'image' && item.url
      ? `![${item.name}](${item.url})`
      : item.content
    // 优先通过 props 回调，其次通过 store 回调
    if (onInsertContent) {
      onInsertContent(content, item.type)
    } else if (insertCallback) {
      insertCallback(content)
    }
  }, [onInsertContent, insertCallback])

  // Update material content
  const handleUpdateContent = useCallback((id: string, content: string) => {
    saveMaterials(materials.map(m =>
      m.id === id ? { ...m, content, updatedAt: Date.now() } : m
    ))
  }, [materials, saveMaterials])

  // Update material name
  const handleUpdateName = useCallback((id: string, name: string) => {
    saveMaterials(materials.map(m =>
      m.id === id ? { ...m, name, updatedAt: Date.now() } : m
    ))
  }, [materials, saveMaterials])

  // Format size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // Type icon helper
  const getTypeIcon = (type: MaterialType) => {
    const info = MATERIAL_TYPES.find(t => t.value === type)
    return info?.icon || FileText
  }
  const getTypeColor = (type: MaterialType) => {
    const info = MATERIAL_TYPES.find(t => t.value === type)
    return info?.color || tokens.foregroundMuted
  }

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
          background: tokens.overlayBg,
          backdropFilter: BLUR.lg,
          WebkitBackdropFilter: BLUR.lg,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '860px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          background: tokens.panelBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${tokens.shadow}`,
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.txt,.md,.ts,.js,.tsx,.jsx,.css,.json,.html,.py,.rs,.go,.java"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} style={{ color: tokens.primary }} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: tokens.fontDisplay }}>
              素材管理器
            </span>
            <span style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
              {materials.length} 个素材
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleImportFile}
              style={{
                padding: '6px 14px',
                background: tokens.primaryDim,
                border: `1px solid ${tokens.primary}`,
                borderRadius: '6px',
                color: tokens.primary,
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Upload size={14} />
              导入素材
            </button>
            <button
              onClick={handleAddText}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                border: `1px solid ${tokens.border}`,
                borderRadius: '6px',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              + 文本
            </button>
            <button
              onClick={handleAddCode}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                border: `1px solid ${tokens.border}`,
                borderRadius: '6px',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              + 代码
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                color: tokens.foregroundMuted,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar - Categories */}
          <div
            style={{
              width: '160px',
              borderRight: `1px solid ${tokens.border}`,
              padding: '12px 0',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '0 12px', marginBottom: '8px' }}>
              <div
                style={{
                  position: 'relative',
                }}
              >
                <Search
                  size={12}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: tokens.foregroundMuted,
                  }}
                />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索素材..."
                  style={{
                    width: '100%',
                    padding: '6px 8px 6px 26px',
                    background: tokens.inputBg,
                    border: `1px solid ${tokens.inputBorder}`,
                    borderRadius: '6px',
                    color: tokens.foreground,
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              {categories.map(cat => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: isActive ? tokens.primaryDim : 'transparent',
                      border: 'none',
                      borderRight: isActive ? `2px solid ${tokens.primary}` : '2px solid transparent',
                      color: isActive ? tokens.primary : tokens.foreground,
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={14} style={{ color: isActive ? tokens.primary : tokens.foregroundMuted }} />
                    <span style={{ flex: 1 }}>{cat.name}</span>
                    <span style={{ fontSize: '10px', color: tokens.foregroundMuted }}>{cat.count}</span>
                  </button>
                )
              })}
            </div>

            {/* Type filter */}
            <div
              style={{
                padding: '8px 12px',
                borderTop: `1px solid ${tokens.borderDim}`,
              }}
            >
              <span style={{ fontSize: '10px', color: tokens.foregroundMuted, fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                类型筛选
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {MATERIAL_TYPES.map(t => {
                  const Icon = t.icon
                  const isActive = activeType === t.value
                  const count = materials.filter(m => m.type === t.value).length
                  return (
                    <button
                      key={t.value}
                      onClick={() => setActiveType(isActive ? 'all' : t.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        background: isActive ? t.color + '20' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: isActive ? t.color : tokens.foregroundMuted,
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      <Icon size={11} />
                      {t.label}
                      <span style={{ marginLeft: 'auto', fontSize: '9px' }}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* View toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                borderBottom: `1px solid ${tokens.borderDim}`,
              }}
            >
              <span style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
                {filteredMaterials.length} 个结果
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '4px',
                    background: viewMode === 'grid' ? tokens.primaryDim : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: viewMode === 'grid' ? tokens.primary : tokens.foregroundMuted,
                    cursor: 'pointer',
                  }}
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '4px',
                    background: viewMode === 'list' ? tokens.primaryDim : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: viewMode === 'list' ? tokens.primary : tokens.foregroundMuted,
                    cursor: 'pointer',
                  }}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Material grid/list */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {filteredMaterials.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    opacity: 0.4,
                  }}
                >
                  <FolderOpen size={40} style={{ color: tokens.foregroundMuted, marginBottom: '12px' }} />
                  <p style={{ fontSize: '13px', color: tokens.foregroundMuted }}>
                    {searchQuery ? '没有匹配的素材' : '还没有素材'}
                  </p>
                  <p style={{ fontSize: '11px', color: tokens.foregroundMuted, marginTop: '4px' }}>
                    {searchQuery ? '试试其他关键词' : '点击「导入素材」或「+ 文本」添加'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                  }}
                >
                  {filteredMaterials.map(item => {
                    const TypeIcon = getTypeIcon(item.type)
                    const typeColor = getTypeColor(item.type)
                    const isSelected = selectedItem?.id === item.id

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        style={{
                          background: isSelected ? tokens.primaryDim : tokens.cardBg,
                          border: `1px solid ${isSelected ? tokens.primary : tokens.cardBorder}`,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.borderColor = tokens.cardHover
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.borderColor = tokens.cardBorder
                        }}
                      >
                        {/* Preview */}
                        <div
                          style={{
                            height: '100px',
                            background: tokens.backgroundAlt,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {item.type === 'image' && item.url ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <TypeIcon size={32} style={{ color: typeColor, opacity: 0.3 }} />
                          )}
                          {/* Type badge */}
                          <span
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              padding: '2px 6px',
                              background: typeColor + '30',
                              borderRadius: '4px',
                              fontSize: '9px',
                              color: typeColor,
                            }}
                          >
                            {MATERIAL_TYPES.find(t => t.value === item.type)?.label}
                          </span>
                        </div>

                        {/* Info */}
                        <div style={{ padding: '8px 10px' }}>
                          <p
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: tokens.foreground,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: '2px',
                            }}
                          >
                            {item.name}
                          </p>
                          <p style={{ fontSize: '10px', color: tokens.foregroundMuted }}>
                            {formatSize(item.size)} · {formatDate(item.updatedAt)}
                          </p>
                          {item.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {item.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  style={{
                                    padding: '1px 5px',
                                    background: tokens.borderDim,
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    color: tokens.foregroundMuted,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div
                          style={{
                            display: 'flex',
                            borderTop: `1px solid ${tokens.borderDim}`,
                          }}
                        >
                          <button
                            onClick={e => { e.stopPropagation(); handleCopy(item.content, item.id) }}
                            style={{
                              flex: 1,
                              padding: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: tokens.foregroundMuted,
                              cursor: 'pointer',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '3px',
                            }}
                          >
                            {copiedId === item.id ? <Check size={10} /> : <Copy size={10} />}
                            {copiedId === item.id ? '已复制' : '复制'}
                          </button>
                          {onInsertContent && (
                            <button
                              onClick={e => { e.stopPropagation(); handleInsert(item) }}
                              style={{
                                flex: 1,
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                borderLeft: `1px solid ${tokens.borderDim}`,
                                color: tokens.primary,
                                cursor: 'pointer',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <Plus size={10} />
                              插入
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                            style={{
                              padding: '4px 8px',
                              background: 'transparent',
                              border: 'none',
                              borderLeft: `1px solid ${tokens.borderDim}`,
                              color: tokens.error,
                              cursor: 'pointer',
                              fontSize: '10px',
                            }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* List view */
                <div style={{ padding: '8px 16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${tokens.borderDim}`, color: tokens.foregroundMuted, fontSize: '10px' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>名称</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>类型</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>大小</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>更新</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 500 }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaterials.map(item => {
                        const TypeIcon = getTypeIcon(item.type)
                        const typeColor = getTypeColor(item.type)
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            style={{
                              borderBottom: `1px solid ${tokens.borderDim}`,
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = tokens.cardHover }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <TypeIcon size={14} style={{ color: typeColor }} />
                              <span style={{ color: tokens.foreground }}>{item.name}</span>
                            </td>
                            <td style={{ padding: '8px', color: typeColor }}>{MATERIAL_TYPES.find(t => t.value === item.type)?.label}</td>
                            <td style={{ padding: '8px', color: tokens.foregroundMuted }}>{formatSize(item.size)}</td>
                            <td style={{ padding: '8px', color: tokens.foregroundMuted }}>{formatDate(item.updatedAt)}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              <button
                                onClick={e => { e.stopPropagation(); handleCopy(item.content, item.id) }}
                                style={{ padding: '2px 6px', background: 'transparent', border: 'none', color: tokens.foregroundMuted, cursor: 'pointer' }}
                              >
                                {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                              {onInsertContent && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleInsert(item) }}
                                  style={{ padding: '2px 6px', background: 'transparent', border: 'none', color: tokens.primary, cursor: 'pointer' }}
                                >
                                  <Plus size={12} />
                                </button>
                              )}
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                                style={{ padding: '2px 6px', background: 'transparent', border: 'none', color: tokens.error, cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <div
              style={{
                width: '280px',
                borderLeft: `1px solid ${tokens.border}`,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
              }}
            >
              {/* Detail header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${tokens.borderDim}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: tokens.foreground }}>素材详情</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{ padding: '2px', background: 'transparent', border: 'none', color: tokens.foregroundMuted, cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
                {/* Preview */}
                {selectedItem.type === 'image' && selectedItem.url && (
                  <div
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      background: tokens.backgroundAlt,
                    }}
                  >
                    <img
                      src={selectedItem.url}
                      alt={selectedItem.name}
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Name edit */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: tokens.foregroundMuted, display: 'block', marginBottom: '4px' }}>名称</label>
                  <input
                    value={selectedItem.name}
                    onChange={e => handleUpdateName(selectedItem.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: tokens.inputBg,
                      border: `1px solid ${tokens.inputBorder}`,
                      borderRadius: '6px',
                      color: tokens.foreground,
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Content preview/edit */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: tokens.foregroundMuted, display: 'block', marginBottom: '4px' }}>内容</label>
                  <textarea
                    value={selectedItem.content.slice(0, 500)}
                    onChange={e => handleUpdateContent(selectedItem.id, e.target.value)}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: tokens.inputBg,
                      border: `1px solid ${tokens.inputBorder}`,
                      borderRadius: '6px',
                      color: tokens.foreground,
                      fontSize: '11px',
                      fontFamily: tokens.fontMono,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Meta info */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: tokens.foregroundMuted, display: 'block', marginBottom: '4px' }}>信息</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: tokens.foregroundMuted }}>
                    <span>类型：{MATERIAL_TYPES.find(t => t.value === selectedItem.type)?.label}</span>
                    <span>大小：{formatSize(selectedItem.size)}</span>
                    {selectedItem.language && <span>语言：{selectedItem.language}</span>}
                    <span>创建：{new Date(selectedItem.createdAt).toLocaleString('zh-CN')}</span>
                    <span>更新：{new Date(selectedItem.updatedAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {selectedItem.type !== 'image' && (
                    <>
                      <button
                        onClick={() => panelActions?.openContentPreview({
                          content: selectedItem.content,
                          title: selectedItem.name,
                        })}
                        title="预览内容"
                        style={{
                          padding: '6px 10px',
                          background: 'transparent',
                          border: `1px solid ${tokens.border}`,
                          borderRadius: '6px',
                          color: tokens.foregroundMuted,
                          cursor: 'pointer',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} />
                        预览
                      </button>
                      <button
                        onClick={() => panelActions?.openAIWriting({
                          topic: selectedItem.content.slice(0, 500),
                          mode: 'rewrite',
                        })}
                        title="AI改写"
                        style={{
                          padding: '6px 10px',
                          background: tokens.primaryDim,
                          border: `1px solid ${tokens.primary}`,
                          borderRadius: '6px',
                          color: tokens.primary,
                          cursor: 'pointer',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={12} />
                        AI改写
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleCopy(selectedItem.content, selectedItem.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: tokens.primaryDim,
                      border: `1px solid ${tokens.primary}`,
                      borderRadius: '6px',
                      color: tokens.primary,
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedId === selectedItem.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === selectedItem.id ? '已复制' : '复制'}
                  </button>
                  {onInsertContent && (
                    <button
                      onClick={() => handleInsert(selectedItem)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: tokens.primary,
                        border: 'none',
                        borderRadius: '6px',
                        color: tokens.primaryForeground,
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Plus size={12} />
                      插入
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      border: `1px solid ${tokens.error}`,
                      borderRadius: '6px',
                      color: tokens.error,
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
