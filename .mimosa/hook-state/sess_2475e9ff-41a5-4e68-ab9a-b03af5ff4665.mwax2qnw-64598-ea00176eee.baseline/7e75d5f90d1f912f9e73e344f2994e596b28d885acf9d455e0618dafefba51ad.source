/**
 * @file TaskBoard.tsx
 * @description 任务板组件，提供任务管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,task,ui,component
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  X, Plus, Trash2,
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  ArrowRight, Tag, GripVertical, RotateCcw, Columns3,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useThemeStore, Z_INDEX, BLUR, type ThemeTokens } from '../store/theme-store'
import { useTaskStore, type Task, type TaskStatus, type TaskPriority } from '../store/task-store'

interface TaskBoardProps {
  visible: boolean
  onClose: () => void
}

const COLUMNS: { status: TaskStatus; labelKey: string; color: (tk: ThemeTokens) => string }[] = [
  { status: 'todo', labelKey: 'todo', color: (tk) => tk.foregroundMuted },
  { status: 'inProgress', labelKey: 'inProgress', color: (tk) => tk.primary },
  { status: 'review', labelKey: 'review', color: (tk) => tk.warning },
  { status: 'blocked', labelKey: 'blocked', color: (tk) => tk.error },
  { status: 'done', labelKey: 'done', color: (tk) => tk.success },
]

const DEFAULT_COLUMN_ORDER: TaskStatus[] = ['todo', 'inProgress', 'review', 'blocked', 'done']
const COLUMN_ORDER_LS_KEY = 'yyc3_task_column_order'

/** Load persisted column order from localStorage */
function loadColumnOrder(): TaskStatus[] {
  try {
    const raw = localStorage.getItem(COLUMN_ORDER_LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length === 5 &&
        DEFAULT_COLUMN_ORDER.every(s => parsed.includes(s))) {
        return parsed as TaskStatus[]
      }
    }
  } catch { /* ignore */ }
  return [...DEFAULT_COLUMN_ORDER]
}

/** Persist column order to localStorage */
function saveColumnOrder(order: TaskStatus[]) {
  try { localStorage.setItem(COLUMN_ORDER_LS_KEY, JSON.stringify(order)) } catch { /* */ }
}

// ===== Column width persistence =====
const DEFAULT_COL_WIDTH = 215
const MIN_COL_WIDTH = 140
const MAX_COL_WIDTH = 400
const COL_WIDTHS_LS_KEY = 'yyc3_task_column_widths'

/** Load persisted column widths */
function loadColumnWidths(): Record<TaskStatus, number> {
  try {
    const raw = localStorage.getItem(COL_WIDTHS_LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        const result: Record<string, number> = {}
        for (const s of DEFAULT_COLUMN_ORDER) {
          const v = parsed[s]
          result[s] = typeof v === 'number' ? Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, v)) : DEFAULT_COL_WIDTH
        }
        return result as Record<TaskStatus, number>
      }
    }
  } catch { /* ignore */ }
  return Object.fromEntries(DEFAULT_COLUMN_ORDER.map(s => [s, DEFAULT_COL_WIDTH])) as Record<TaskStatus, number>
}

/** Persist column widths */
function saveColumnWidths(widths: Record<TaskStatus, number>) {
  try { localStorage.setItem(COL_WIDTHS_LS_KEY, JSON.stringify(widths)) } catch { /* */ }
}

const PRIORITY_CONFIG: Record<TaskPriority, { icon: React.ElementType; colorKey: keyof ThemeTokens }> = {
  critical: { icon: AlertCircle, colorKey: 'error' },
  high: { icon: AlertTriangle, colorKey: 'warning' },
  medium: { icon: Info, colorKey: 'primary' },
  low: { icon: CheckCircle2, colorKey: 'success' },
}

/** Safely get color from ThemeTokens by key */
function getColor(tokens: ThemeTokens, key: keyof ThemeTokens): string {
  return tokens[key] as string
}

/** Drag payload stored in a ref (dataTransfer is limited to strings) */
interface DragPayload {
  taskId: string
  sourceStatus: TaskStatus
  sourceIndex: number
}

export function TaskBoard({ visible, onClose }: TaskBoardProps) {
  const { t, locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { tasks, add, remove, moveStatus, reorder } = useTaskStore()

  // Column order persistence
  const [columnOrder, setColumnOrder] = useState<TaskStatus[]>(() => loadColumnOrder())
  const orderedColumns = useMemo(
    () => columnOrder.map(status => COLUMNS.find(c => c.status === status)!),
    [columnOrder],
  )

  // Column widths (resizable)
  const [colWidths, setColWidths] = useState<Record<TaskStatus, number>>(() => loadColumnWidths())
  const hasCustomWidths = useMemo(
    () => Object.values(colWidths).some(w => w !== DEFAULT_COL_WIDTH),
    [colWidths],
  )

  // Resize state
  const resizeRef = useRef<{ status: TaskStatus; startX: number; startWidth: number } | null>(null)

  const handleResizeStart = useCallback((e: React.MouseEvent, status: TaskStatus) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { status, startX: e.clientX, startWidth: colWidths[status] }

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = ev.clientX - resizeRef.current.startX
      const newWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, resizeRef.current.startWidth + delta))
      setColWidths(prev => {
        const updated = { ...prev, [resizeRef.current!.status]: newWidth }
        return updated
      })
    }
    const onUp = () => {
      setColWidths(prev => { saveColumnWidths(prev); return prev })
      resizeRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [colWidths])

  const handleResetColumnWidths = useCallback(() => {
    const def = Object.fromEntries(DEFAULT_COLUMN_ORDER.map(s => [s, DEFAULT_COL_WIDTH])) as Record<TaskStatus, number>
    setColWidths(def)
    saveColumnWidths(def)
  }, [])

  /** Double-click on resize handle: auto-fit column width based on task count heuristic */
  const handleResizeDoubleClick = useCallback((status: TaskStatus) => {
    const columnTasks = tasks.filter(task => task.status === status && !task.isArchived)
    // Heuristic: base 160px + max(title length) * 5.5px, clamped
    let optimal = DEFAULT_COL_WIDTH
    if (columnTasks.length > 0) {
      const longestTitle = Math.max(...columnTasks.map(task => task.title.length))
      optimal = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, 80 + longestTitle * 5.5 + 60))
    } else {
      optimal = MIN_COL_WIDTH
    }
    setColWidths(prev => {
      const updated = { ...prev, [status]: Math.round(optimal) }
      saveColumnWidths(updated)
      return updated
    })
  }, [tasks])

  // Column drag state (separate from card drag)
  const [draggingColStatus, setDraggingColStatus] = useState<TaskStatus | null>(null)
  const [dragOverColHeader, setDragOverColHeader] = useState<TaskStatus | null>(null)

  const handleColumnDragStart = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.dataTransfer.setData('text/plain', `col:${status}`)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingColStatus(status)
  }, [])

  const handleColumnDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    if (!draggingColStatus) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColHeader(status)
  }, [draggingColStatus])

  const handleColumnDrop = useCallback((targetStatus: TaskStatus) => {
    if (!draggingColStatus || draggingColStatus === targetStatus) {
      setDraggingColStatus(null)
      setDragOverColHeader(null)
      return
    }
    setColumnOrder(prev => {
      const newOrder = [...prev]
      const fromIdx = newOrder.indexOf(draggingColStatus)
      const toIdx = newOrder.indexOf(targetStatus)
      newOrder.splice(fromIdx, 1)
      newOrder.splice(toIdx, 0, draggingColStatus)
      saveColumnOrder(newOrder)
      return newOrder
    })
    setDraggingColStatus(null)
    setDragOverColHeader(null)
  }, [draggingColStatus])

  const handleColumnDragEnd = useCallback(() => {
    setDraggingColStatus(null)
    setDragOverColHeader(null)
  }, [])

  const handleResetColumnOrder = useCallback(() => {
    const def = [...DEFAULT_COLUMN_ORDER]
    setColumnOrder(def)
    saveColumnOrder(def)
  }, [])

  // Quick-add form
  const [addingIn, setAddingIn] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')

  // Drag state
  const dragPayloadRef = useRef<DragPayload | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  /** Add a new task directly into the target column */
  const handleAdd = (status: TaskStatus) => {
    if (!newTitle.trim()) return
    const id = add(newTitle.trim(), '', newPriority, [])
    if (status !== 'todo') {
      moveStatus(id, status)
    }
    setNewTitle('')
    setAddingIn(null)
  }

  // ===== Card drag handlers =====
  const handleDragStart = useCallback((e: React.DragEvent, task: Task, indexInCol: number) => {
    dragPayloadRef.current = { taskId: task.id, sourceStatus: task.status, sourceIndex: indexInCol }
    setDraggingId(task.id)
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('div')
    ghost.style.opacity = '0'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }, [])

  const handleDragOverCard = useCallback((e: React.DragEvent, status: TaskStatus, indexInCol: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(status)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const insertIdx = e.clientY < midY ? indexInCol : indexInCol + 1
    setDropIndex(insertIdx)
  }, [])

  const handleDragOverColumn = useCallback((e: React.DragEvent, status: TaskStatus, colTaskCount: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(status)
    setDropIndex(colTaskCount)
  }, [])

  const resetDrag = useCallback(() => {
    dragPayloadRef.current = null
    setDraggingId(null)
    setDragOverCol(null)
    setDropIndex(null)
  }, [])

  const handleDrop = useCallback((status: TaskStatus) => {
    const payload = dragPayloadRef.current
    if (payload && dropIndex !== null) {
      reorder(payload.taskId, status, dropIndex)
    } else if (payload) {
      moveStatus(payload.taskId, status)
    }
    resetDrag()
  }, [dropIndex, reorder, moveStatus, resetDrag])

  const handleDragEnd = useCallback(() => {
    resetDrag()
  }, [resetDrag])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[4vh]"
      style={{ zIndex: Z_INDEX.topModal + 20, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 'auto', maxWidth: '95vw', maxHeight: '90vh',
          background: tk.panelBg, border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <Tag size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '2px' }}>
              {t('tasks', 'title')}
            </span>
            <span className="px-1.5 py-0.5 rounded" style={{
              fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted,
              background: tk.primaryGlow, border: `1px solid ${tk.borderDim}`,
            }}>
              {tasks.length} {isZh ? '个任务' : 'tasks'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Reset column widths */}
            {hasCustomWidths && (
              <button
                onClick={handleResetColumnWidths}
                className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted,
                  border: `1px solid ${tk.borderDim}`, background: 'transparent',
                }}
                title={t('tasks', 'resetColumnWidths')}
              >
                <Columns3 size={10} />
                {t('tasks', 'resetColumnWidths')}
              </button>
            )}
            {/* Reset column order */}
            <button
              onClick={handleResetColumnOrder}
              className="flex items-center gap-1 px-2 py-1 rounded hover:opacity-70 transition-opacity"
              style={{
                fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted,
                border: `1px solid ${tk.borderDim}`, background: 'transparent',
              }}
              title={t('tasks', 'resetColumnOrder')}
            >
              <RotateCcw size={10} />
              {t('tasks', 'resetColumnOrder')}
            </button>
            <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: tk.foregroundMuted }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Kanban columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden neon-scrollbar">
          <div className="flex gap-0 p-4 min-w-max h-full">
            {orderedColumns.map((col, colIdx) => {
              const columnTasks = tasks.filter(task => task.status === col.status && !task.isArchived)
              const color = col.color(tk)
              const isDragOverThisCol = dragOverCol === col.status
              const colW = colWidths[col.status]

              return (
                <div key={col.status} className="flex" style={{ position: 'relative' }}>
                  {/* Column */}
                  <div
                    className="flex flex-col rounded-xl"
                    style={{
                      width: colW, minHeight: 300,
                      background: isDragOverThisCol ? `${color}08` : tk.cardBg,
                      border: `1px solid ${isDragOverThisCol ? color : tk.cardBorder}`,
                      transition: 'background 0.15s, border-color 0.15s',
                      marginRight: colIdx < orderedColumns.length - 1 ? 0 : 0,
                    }}
                    onDragOver={(e) => handleDragOverColumn(e, col.status, columnTasks.length)}
                    onDragLeave={() => { setDragOverCol(null); setDropIndex(null) }}
                    onDrop={() => handleDrop(col.status)}
                  >
                    {/* Column header — draggable for reorder */}
                    <div
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handleColumnDragStart(e, col.status) }}
                      onDragOver={(e) => handleColumnDragOver(e, col.status)}
                      onDrop={(e) => { if (draggingColStatus) e.stopPropagation(); handleColumnDrop(col.status) }}
                      onDragEnd={handleColumnDragEnd}
                      className="flex items-center justify-between px-3 py-2.5 border-b cursor-grab active:cursor-grabbing"
                      style={{
                        borderColor: tk.borderDim,
                        background: dragOverColHeader === col.status ? `${color}15` : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <GripVertical size={10} color={tk.foregroundMuted} className="opacity-40" />
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color, letterSpacing: '0.5px' }}>
                          {t('tasks', col.labelKey)}
                        </span>
                        <span className="px-1 rounded" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, background: tk.primaryGlow }}>
                          {columnTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setAddingIn(addingIn === col.status ? null : col.status)}
                        className="p-0.5 rounded hover:opacity-70"
                        style={{ color: tk.foregroundMuted }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Quick-add */}
                    {addingIn === col.status && (
                      <div className="px-2 py-2 border-b" style={{ borderColor: tk.borderDim }}>
                        <input
                          autoFocus
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAdd(col.status); if (e.key === 'Escape') setAddingIn(null) }}
                          placeholder={isZh ? '任务标题...' : 'Task title...'}
                          className="w-full px-2 py-1.5 rounded outline-none"
                          style={{
                            fontFamily: tk.fontBody, fontSize: '11px', color: tk.foreground,
                            background: tk.inputBg, border: `1px solid ${tk.inputBorder}`,
                          }}
                        />
                        <div className="flex items-center gap-1 mt-1.5">
                          {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(p => {
                            const cfg = PRIORITY_CONFIG[p]
                            const c = getColor(tk, cfg.colorKey)
                            return (
                              <button
                                key={p}
                                onClick={() => setNewPriority(p)}
                                className="px-1.5 py-0.5 rounded transition-all"
                                style={{
                                  fontFamily: tk.fontMono, fontSize: '7px',
                                  color: newPriority === p ? c : tk.foregroundMuted,
                                  background: newPriority === p ? `${c}15` : 'transparent',
                                  border: `1px solid ${newPriority === p ? c : 'transparent'}`,
                                }}
                              >
                                {p[0].toUpperCase()}
                              </button>
                            )
                          })}
                          <div className="flex-1" />
                          <button
                            onClick={() => handleAdd(col.status)}
                            className="px-2 py-0.5 rounded"
                            style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.background, background: tk.primary }}
                          >
                            {isZh ? '添加' : 'Add'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Task cards with drop indicators */}
                    <div className="flex-1 overflow-y-auto neon-scrollbar px-2 py-1 space-y-0">
                      {columnTasks.map((task, idx) => {
                        const priCfg = PRIORITY_CONFIG[task.priority]
                        const priColor = getColor(tk, priCfg.colorKey)
                        const PriIcon = priCfg.icon
                        const isDragging = draggingId === task.id
                        const showDropBefore = isDragOverThisCol && dropIndex === idx && draggingId !== task.id

                        return (
                          <div key={task.id}>
                            {/* Drop indicator line */}
                            {showDropBefore && (
                              <div
                                className="rounded-full my-0.5"
                                style={{
                                  height: 3,
                                  background: tk.primary,
                                  boxShadow: isCyberpunk ? `0 0 8px ${tk.primary}` : 'none',
                                  transition: 'all 0.15s',
                                }}
                              />
                            )}

                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, task, idx)}
                              onDragOver={(e) => handleDragOverCard(e, col.status, idx)}
                              onDragEnd={handleDragEnd}
                              className="p-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all mb-1.5"
                              style={{
                                background: isDragging ? tk.primaryGlow : tk.panelBg,
                                border: `1px solid ${isDragging ? tk.primary : tk.borderDim}`,
                                opacity: isDragging ? 0.4 : 1,
                                transform: isDragging ? 'scale(0.96)' : 'scale(1)',
                                boxShadow: isCyberpunk && !isDragging ? `0 0 4px ${tk.primaryGlow}` : tk.shadow,
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1 flex-1">
                                  <GripVertical size={10} color={tk.foregroundMuted} className="shrink-0 opacity-40" />
                                  <p className="flex-1" style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foreground, lineHeight: '15px' }}>
                                    {task.title}
                                  </p>
                                </div>
                                <button onClick={() => remove(task.id)} className="p-0.5 rounded hover:opacity-60 shrink-0" style={{ color: tk.foregroundMuted }}>
                                  <Trash2 size={9} />
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="flex items-center gap-0.5">
                                  <PriIcon size={9} color={priColor} />
                                  <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: priColor }}>{task.priority}</span>
                                </div>
                                {task.tags.map(tag => (
                                  <span key={tag} className="px-1 py-0.5 rounded" style={{
                                    fontFamily: tk.fontMono, fontSize: '7px', color: tk.primary,
                                    background: tk.primaryGlow, border: `1px solid ${tk.borderDim}`,
                                  }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              {/* Move arrow shortcut */}
                              {col.status !== 'done' && (
                                <div className="flex justify-end mt-1">
                                  <button
                                    onClick={() => {
                                      const order: TaskStatus[] = ['todo', 'inProgress', 'review', 'blocked', 'done']
                                      const i = order.indexOf(task.status)
                                      if (i < order.length - 1) moveStatus(task.id, order[i + 1])
                                    }}
                                    className="flex items-center gap-0.5 px-1 py-0.5 rounded hover:opacity-70"
                                    style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}
                                  >
                                    <ArrowRight size={8} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {/* Drop indicator — after last card */}
                      {isDragOverThisCol && dropIndex !== null && dropIndex >= columnTasks.length && draggingId && (
                        <div
                          className="rounded-full my-0.5"
                          style={{
                            height: 3,
                            background: tk.primary,
                            boxShadow: isCyberpunk ? `0 0 8px ${tk.primary}` : 'none',
                            transition: 'all 0.15s',
                          }}
                        />
                      )}

                      {/* Empty column hint */}
                      {columnTasks.length === 0 && !isDragOverThisCol && (
                        <div className="flex items-center justify-center py-8 opacity-30">
                          <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                            {isZh ? '拖拽任务到此处' : 'Drop tasks here'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resize handle between columns */}
                  {colIdx < orderedColumns.length - 1 && (
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.status)}
                      onDoubleClick={() => handleResizeDoubleClick(col.status)}
                      style={{
                        width: 12,
                        cursor: 'col-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 2,
                      }}
                      title={isZh ? '拖拽调整列宽 · 双击自适应' : 'Drag to resize · Double-click to auto-fit'}
                    >
                      {/* Visible resize grip */}
                      <div
                        style={{
                          width: 3,
                          height: 32,
                          borderRadius: 2,
                          background: tk.borderDim,
                          transition: 'background 0.2s, height 0.2s',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget
                          el.style.background = tk.primary
                          el.style.height = '48px'
                          if (isCyberpunk) el.style.boxShadow = `0 0 6px ${tk.primary}`
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget
                          el.style.background = tk.borderDim
                          el.style.height = '32px'
                          el.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
