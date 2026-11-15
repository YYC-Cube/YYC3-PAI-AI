
/**
 * @file task-store.ts
 * @description 任务状态管理模块，管理任务和待办事项
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags task,state-management,ai
 */

import { useSyncExternalStore } from 'react'
import { createLogger } from '../utils/logger'
import { activityBus } from './activity-store'
import { settingsActions } from './settings-store'

const logger = createLogger('task-store')

// ===== Type Definitions =====

export type TaskStatus = 'todo' | 'inProgress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'feature' | 'bug' | 'refactor' | 'test' | 'documentation' | 'other'
export type TaskSource = 'manual' | 'ai-inferred' | 'imported'

/** 子任务 */
export interface SubTask {
  id: string
  title: string
  isCompleted: boolean
  createdAt: number
}

/** 提醒 */
export interface Reminder {
  id: string
  taskId: string
  type: 'deadline' | 'dependency' | 'blocking' | 'progress' | 'custom'
  message: string
  remindAt: number
  isTriggered: boolean
  isRead: boolean
  createdAt: number
}

/** 任务 */
export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  tags: string[]
  assignee?: string
  createdAt: number
  updatedAt: number
  /** 截止时间 */
  dueDate?: number
  /** 预估工时(小时) */
  estimatedHours?: number
  /** 实际工时(小时) */
  actualHours?: number
  /** 子任务列表 */
  subtasks: SubTask[]
  /** 依赖的任务 ID */
  dependencies: string[]
  /** 阻塞的任务 ID */
  blocking: string[]
  /** 关联文件 */
  relatedFiles: string[]
  /** 关联 AI 消息 ID */
  relatedMessageId?: string
  /** 任务来源 */
  source: TaskSource
  /** AI 推理置信度 (0-1) */
  confidence?: number
  /** 是否已归档 */
  isArchived: boolean
}

/** AI 推理结果 */
export interface TaskInference {
  task: Partial<Task>
  confidence: number
  reasoning: string
  context: string
}

/** Store 快照 */
export interface TaskStoreState {
  tasks: Task[]
  reminders: Reminder[]
}

// ===== Constants =====

const LS_KEY = 'yyc3_tasks'
const LS_REMINDERS_KEY = 'yyc3_task_reminders'

function generateId(prefix: string = 'task'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ===== Default tasks (backward compatible) =====
const INITIAL_TASKS: Task[] = [
  {
    id: 'task_demo_1', title: '实现 Git 集成面板', description: '添加分支管理、暂存区、提交历史功能',
    status: 'done', priority: 'high', type: 'feature', tags: ['feature', 'git'], subtasks: [], dependencies: [], blocking: [], relatedFiles: [], source: 'manual', isArchived: false,
    createdAt: Date.now() - 86400000, updatedAt: Date.now(),
  },
  {
    id: 'task_demo_2', title: '性能监控仪表盘', description: 'Recharts 图表展示 CPU、内存、网络指标',
    status: 'inProgress', priority: 'high', type: 'feature', tags: ['feature', 'monitoring'], subtasks: [], dependencies: [], blocking: [], relatedFiles: [], source: 'manual', isArchived: false,
    createdAt: Date.now() - 72000000, updatedAt: Date.now(),
  },
  {
    id: 'task_demo_3', title: 'AI 代码诊断', description: '实时分析代码质量、安全漏洞、性能问题',
    status: 'inProgress', priority: 'critical', type: 'feature', tags: ['ai', 'diagnostics'], subtasks: [], dependencies: [], blocking: [], relatedFiles: [], source: 'manual', isArchived: false,
    createdAt: Date.now() - 50000000, updatedAt: Date.now(),
  },
  {
    id: 'task_demo_4', title: '单元测试覆盖率 >80%', description: '为所有 store 和 service 编写 Vitest 测试',
    status: 'todo', priority: 'medium', type: 'test', tags: ['testing'], subtasks: [
      { id: 'st_1', title: '覆盖 settings-store 测试', isCompleted: true, createdAt: Date.now() - 20000000 },
      { id: 'st_2', title: '覆盖 quick-actions-store 测试', isCompleted: true, createdAt: Date.now() - 10000000 },
      { id: 'st_3', title: '覆盖 model-store 测试', isCompleted: false, createdAt: Date.now() - 5000000 },
    ], dependencies: [], blocking: [], relatedFiles: ['src/app/store/__tests__/'], source: 'manual', isArchived: false,
    createdAt: Date.now() - 30000000, updatedAt: Date.now(),
  },
  {
    id: 'task_demo_5', title: '暗色主题优化', description: '调整 Clean Modern 主题的对比度和可读性',
    status: 'review', priority: 'low', type: 'refactor', tags: ['ui', 'theme'], subtasks: [], dependencies: [], blocking: [], relatedFiles: ['src/app/store/theme-store.ts'], source: 'manual', isArchived: false,
    createdAt: Date.now() - 20000000, updatedAt: Date.now(),
  },
  {
    id: 'task_demo_6', title: 'CI/CD 流水线配置', description: '配置 GitHub Actions 自动构建和发布',
    status: 'todo', priority: 'medium', type: 'other', tags: ['devops'], subtasks: [], dependencies: ['task_demo_4'], blocking: [], relatedFiles: ['.github/workflows/ci.yml'], source: 'manual', isArchived: false,
    createdAt: Date.now() - 10000000, updatedAt: Date.now(),
  },
]

// ===== Persistence =====

/** 向后兼容：旧 Task 缺少新字段时自动填充默认值 */
function migrateTask(raw: Partial<Task> & Record<string, unknown>): Task {
  return {
    ...raw,
    id: raw.id || '',
    title: raw.title || '',
    description: raw.description || '',
    type: raw.type || 'other',
    tags: raw.tags || [],
    subtasks: raw.subtasks || [],
    dependencies: raw.dependencies || [],
    blocking: raw.blocking || [],
    relatedFiles: raw.relatedFiles || [],
    source: raw.source || 'manual',
    isArchived: raw.isArchived ?? false,
    status: raw.status || 'todo',
    priority: raw.priority || 'medium',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
  }
}

function load(): Task[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (Array.isArray(p) && p.length > 0) return p.map(migrateTask)
    }
  } catch { /* ignore */ }
  return [...INITIAL_TASKS]
}

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(LS_REMINDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function persist(tasks: Task[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(tasks)) } catch { /* */ }
}

function persistReminders(reminders: Reminder[]) {
  try { localStorage.setItem(LS_REMINDERS_KEY, JSON.stringify(reminders)) } catch { /* */ }
}

// ===== State =====

let tasks: Task[] = load()
let reminders: Reminder[] = loadReminders()
type Listener = () => void
const listeners = new Set<Listener>()
function emitChange() { for (const l of listeners) l() }
function subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l) }
let cachedSnapshot: TaskStoreState | null = null
function getSnapshot(): TaskStoreState {
  if (!cachedSnapshot || cachedSnapshot.tasks !== tasks || cachedSnapshot.reminders !== reminders) {
    cachedSnapshot = { tasks, reminders }
  }
  return cachedSnapshot
}

// ===== AI Task Inference Prompt =====

const INFERENCE_SYSTEM_PROMPT = `You are an expert project manager and task analyst. Extract actionable tasks from the provided text.

For each task output a JSON object with:
- title: string (brief)
- description: string (detailed)
- type: "feature"|"bug"|"refactor"|"test"|"documentation"|"other"
- priority: "critical"|"high"|"medium"|"low"
- estimatedHours: number (optional)
- tags: string[] (optional)
- confidence: number (0-1)
- reasoning: string (why this is a task)

Output a JSON array. Only output JSON, no other text.`

function buildInferencePrompt(): string {
  const rules = settingsActions.getActiveRulesAsSystemPrompt()
  return rules ? `${INFERENCE_SYSTEM_PROMPT}\n\n---\n\n${rules}` : INFERENCE_SYSTEM_PROMPT
}

function parseInferenceResponse(content: string): TaskInference[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const arr = JSON.parse(jsonMatch[0])
    return arr.map((item: Record<string, unknown>): TaskInference => ({
      task: {
        id: `inferred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: (item.title as string) || 'Untitled',
        description: (item.description as string) || '',
        status: 'todo' as TaskStatus,
        priority: (item.priority as TaskPriority) || 'medium',
        type: (item.type as TaskType) || 'other',
        tags: Array.isArray(item.tags) ? item.tags as string[] : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        subtasks: [],
        dependencies: [],
        blocking: [],
        relatedFiles: [],
        source: 'ai-inferred',
        isArchived: false,
        estimatedHours: item.estimatedHours as number | undefined,
      },
      confidence: (item.confidence as number) ?? 0.8,
      reasoning: (item.reasoning as string) || '',
      context: (item.context as string) || '',
    }))
  } catch (err) {
    logger.error('Failed to parse inference response:', err)
    return []
  }
}

// ===== Actions =====

const actions = {
  // ===== CRUD =====

  /** 创建任务 */
  add(title: string, description: string, priority: TaskPriority = 'medium', tags: string[] = [], opts?: Partial<Pick<Task, 'type' | 'source' | 'confidence' | 'dueDate' | 'estimatedHours' | 'relatedFiles' | 'relatedMessageId'>>): string {
    const now = Date.now()
    const id = generateId()
    const task: Task = {
      id, title, description, status: 'todo', priority,
      type: opts?.type || 'other',
      tags,
      subtasks: [], dependencies: [], blocking: [], relatedFiles: opts?.relatedFiles || [],
      source: opts?.source || 'manual',
      confidence: opts?.confidence,
      dueDate: opts?.dueDate,
      estimatedHours: opts?.estimatedHours,
      relatedMessageId: opts?.relatedMessageId,
      isArchived: false,
      createdAt: now, updatedAt: now,
    }
    tasks = [...tasks, task]
    persist(tasks); emitChange()
    activityBus.push('system', `Task created: ${title}`, `创建任务: ${title}`, `Priority: ${priority}`)
    return id
  },

  /** 更新任务 */
  update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    tasks = tasks.map(t => t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)
    persist(tasks); emitChange()
  },

  /** 删除任务 */
  remove(id: string) {
    const task = tasks.find(t => t.id === id)
    tasks = tasks.filter(t => t.id !== id)
    // Also remove related reminders
    reminders = reminders.filter(r => r.taskId !== id)
    persist(tasks); persistReminders(reminders); emitChange()
    if (task) activityBus.push('system', `Task deleted: ${task.title}`, `删除任务: ${task.title}`)
  },

  /** 移动任务状态 */
  moveStatus(id: string, status: TaskStatus) {
    const task = tasks.find(t => t.id === id)
    tasks = tasks.map(t => t.id === id ? { ...t, status, updatedAt: Date.now() } : t)
    persist(tasks); emitChange()
    if (task) activityBus.push('system', `Task moved to ${status}: ${task.title}`, `任务移至 ${status}: ${task.title}`)
  },

  /** 排序/跨列移动 */
  reorder(taskId: string, targetStatus: TaskStatus, targetIndex: number) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const without = tasks.filter(t => t.id !== taskId)
    const updated = { ...task, status: targetStatus, updatedAt: Date.now() }
    const colTasks = without.filter(t => t.status === targetStatus)
    const clampedIndex = Math.min(targetIndex, colTasks.length)
    if (clampedIndex >= colTasks.length) {
      const lastColTask = colTasks[colTasks.length - 1]
      const globalIdx = lastColTask ? without.indexOf(lastColTask) + 1 : without.length
      without.splice(globalIdx, 0, updated)
    } else {
      const refTask = colTasks[clampedIndex]
      const globalIdx = without.indexOf(refTask)
      without.splice(globalIdx, 0, updated)
    }
    tasks = without
    persist(tasks); emitChange()
  },

  // ===== Subtasks =====

  /** 添加子任务 */
  addSubtask(taskId: string, title: string) {
    const st: SubTask = { id: generateId('st'), title, isCompleted: false, createdAt: Date.now() }
    tasks = tasks.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, st], updatedAt: Date.now() } : t)
    persist(tasks); emitChange()
  },

  /** 切换子任务完成状态 */
  toggleSubtask(taskId: string, subtaskId: string) {
    tasks = tasks.map(t => {
      if (t.id !== taskId) return t
      return {
        ...t,
        subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st),
        updatedAt: Date.now(),
      }
    })
    persist(tasks); emitChange()
  },

  /** 删除子任务 */
  removeSubtask(taskId: string, subtaskId: string) {
    tasks = tasks.map(t => {
      if (t.id !== taskId) return t
      return { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId), updatedAt: Date.now() }
    })
    persist(tasks); emitChange()
  },

  // ===== Dependencies =====

  /** 添加依赖 */
  addDependency(taskId: string, depId: string) {
    if (taskId === depId) return
    tasks = tasks.map(t => {
      if (t.id === taskId && !t.dependencies.includes(depId)) {
        return { ...t, dependencies: [...t.dependencies, depId], updatedAt: Date.now() }
      }
      if (t.id === depId && !t.blocking.includes(taskId)) {
        return { ...t, blocking: [...t.blocking, taskId], updatedAt: Date.now() }
      }
      return t
    })
    persist(tasks); emitChange()
  },

  /** 移除依赖 */
  removeDependency(taskId: string, depId: string) {
    tasks = tasks.map(t => {
      if (t.id === taskId) return { ...t, dependencies: t.dependencies.filter(d => d !== depId), updatedAt: Date.now() }
      if (t.id === depId) return { ...t, blocking: t.blocking.filter(b => b !== taskId), updatedAt: Date.now() }
      return t
    })
    persist(tasks); emitChange()
  },

  // ===== Reminders =====

  /** 添加提醒 */
  addReminder(taskId: string, message: string, remindAt: number, type: Reminder['type'] = 'custom') {
    const r: Reminder = {
      id: generateId('rem'), taskId, type, message, remindAt,
      isTriggered: false, isRead: false, createdAt: Date.now(),
    }
    reminders = [...reminders, r]
    persistReminders(reminders); emitChange()
  },

  /** 标记提醒已读 */
  markReminderRead(reminderId: string) {
    reminders = reminders.map(r => r.id === reminderId ? { ...r, isRead: true } : r)
    persistReminders(reminders); emitChange()
  },

  /** 触发到期提醒 */
  checkReminders(): Reminder[] {
    const now = Date.now()
    const triggered: Reminder[] = []
    reminders = reminders.map(r => {
      if (!r.isTriggered && r.remindAt <= now) {
        triggered.push({ ...r, isTriggered: true })
        return { ...r, isTriggered: true }
      }
      return r
    })
    if (triggered.length > 0) {
      persistReminders(reminders); emitChange()
    }
    return triggered
  },

  /** 获取未读提醒数 */
  getUnreadReminderCount(): number {
    return reminders.filter(r => r.isTriggered && !r.isRead).length
  },

  // ===== AI Task Inference =====

  /**
   * 从 AI 对话中推理任务
   * @param messages 对话历史
   * @param sendFn model-store 的 sendToActiveModel
   * @returns 推理出的任务列表
   */
  async inferTasksFromChat(
    messages: Array<{ role: string; content: string }>,
    sendFn: (msg: string, opts?: { systemPrompt?: string }) => Promise<string>,
  ): Promise<TaskInference[]> {
    const conversationText = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n\n')
    const prompt = `Analyze the following conversation and extract all actionable tasks:\n\n${conversationText}\n\nOutput as JSON array.`
    try {
      const response = await sendFn(prompt, { systemPrompt: buildInferencePrompt() })
      return parseInferenceResponse(response)
    } catch {
      return []
    }
  },

  /**
   * 从代码 TODO/FIXME 注释推理任务
   */
  async inferTasksFromCode(
    code: string,
    language: string,
    sendFn: (msg: string, opts?: { systemPrompt?: string }) => Promise<string>,
  ): Promise<TaskInference[]> {
    const prompt = `Analyze the following ${language} code and extract tasks from TODO, FIXME, HACK, BUG comments:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nOutput as JSON array.`
    try {
      const response = await sendFn(prompt, { systemPrompt: buildInferencePrompt() })
      return parseInferenceResponse(response)
    } catch {
      return []
    }
  },

  /** 批量导入推理任务 */
  importInferredTasks(inferences: TaskInference[], messageId?: string): string[] {
    const ids: string[] = []
    for (const inf of inferences) {
      const id = actions.add(
        inf.task.title || 'Untitled Task',
        inf.task.description || '',
        inf.task.priority,
        inf.task.tags || [],
        {
          type: inf.task.type,
          source: 'ai-inferred',
          confidence: inf.confidence,
          relatedMessageId: messageId,
        },
      )
      ids.push(id)
    }
    return ids
  },

  // ===== Archive =====

  /** 归档任务 */
  archive(id: string) {
    tasks = tasks.map(t => t.id === id ? { ...t, isArchived: true, updatedAt: Date.now() } : t)
    persist(tasks); emitChange()
  },

  /** 取消归档 */
  unarchive(id: string) {
    tasks = tasks.map(t => t.id === id ? { ...t, isArchived: false, updatedAt: Date.now() } : t)
    persist(tasks); emitChange()
  },

  // ===== Stats =====

  /** 获取看板统计 */
  getStats() {
    const active = tasks.filter(t => !t.isArchived)
    return {
      total: active.length,
      todo: active.filter(t => t.status === 'todo').length,
      inProgress: active.filter(t => t.status === 'inProgress').length,
      review: active.filter(t => t.status === 'review').length,
      done: active.filter(t => t.status === 'done').length,
      blocked: active.filter(t => t.status === 'blocked').length,
      overdue: active.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== 'done').length,
    }
  },
}

// ===== React Hook =====

export function useTaskStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, ...actions }
}

export const taskStore = { getState: getSnapshot, ...actions }
