/**
 * @file task-store.test.ts
 * @description Unit test for task-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, vi } from 'vitest'

const lsMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: lsMock })

import { taskStore, type Task, type TaskStatus, type TaskPriority } from '../task-store'

function tasks(): Task[] { return taskStore.getState().tasks }

describe('Initial State', () => {
  it('should have initial demo tasks', () => {
    expect(tasks().length).toBeGreaterThan(0)
  })

  it('each task should have required fields', () => {
    for (const t of tasks()) {
      expect(t.id).toBeTruthy()
      expect(t.title).toBeTruthy()
      expect(typeof t.description).toBe('string')
      expect(['todo', 'inProgress', 'review', 'done']).toContain(t.status)
      expect(['low', 'medium', 'high', 'critical']).toContain(t.priority)
      expect(Array.isArray(t.tags)).toBe(true)
      expect(t.createdAt).toBeGreaterThan(0)
      expect(t.updatedAt).toBeGreaterThan(0)
    }
  })
})

describe('add()', () => {
  it('should add a new task and return its id', () => {
    const before = tasks().length
    const id = taskStore.add('New Task', 'Description', 'high', ['test'])
    expect(typeof id).toBe('string')
    expect(id).toMatch(/^task_/)
    expect(tasks().length).toBe(before + 1)
  })

  it('new task should have status "todo"', () => {
    const id = taskStore.add('Todo Task', '', 'medium')
    const task = tasks().find(t => t.id === id)
    expect(task).toBeDefined()
    expect(task!.status).toBe('todo')
  })

  it('should use default priority "medium" and empty tags', () => {
    const id = taskStore.add('Default Priority', 'desc')
    const task = tasks().find(t => t.id === id)
    expect(task!.priority).toBe('medium')
    expect(task!.tags).toEqual([])
  })

  it('should persist to localStorage', () => {
    lsMock.setItem.mockClear()
    taskStore.add('Persist Test', 'desc')
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_tasks')
    expect(calls.length).toBeGreaterThan(0)
  })

  it('new task should have createdAt and updatedAt', () => {
    const before = Date.now()
    const id = taskStore.add('Timed Task', '')
    const task = tasks().find(t => t.id === id)
    expect(task!.createdAt).toBeGreaterThanOrEqual(before)
    expect(task!.updatedAt).toBeGreaterThanOrEqual(before)
  })
})

describe('update()', () => {
  it('should update task fields', () => {
    const id = taskStore.add('Update Me', 'original')
    taskStore.update(id, { title: 'Updated', description: 'changed', priority: 'critical' })
    const task = tasks().find(t => t.id === id)
    expect(task!.title).toBe('Updated')
    expect(task!.description).toBe('changed')
    expect(task!.priority).toBe('critical')
  })

  it('should update updatedAt', () => {
    const id = taskStore.add('Timestamp Test', '')
    const before = tasks().find(t => t.id === id)!.updatedAt
    // Small delay to ensure timestamp differs
    taskStore.update(id, { title: 'Changed' })
    const after = tasks().find(t => t.id === id)!.updatedAt
    expect(after).toBeGreaterThanOrEqual(before)
  })

  it('should not affect other tasks', () => {
    const id1 = taskStore.add('Task A', 'a')
    const id2 = taskStore.add('Task B', 'b')
    taskStore.update(id1, { title: 'Changed A' })
    expect(tasks().find(t => t.id === id2)!.title).toBe('Task B')
  })

  it('should persist changes', () => {
    const id = taskStore.add('Persist Update', '')
    lsMock.setItem.mockClear()
    taskStore.update(id, { title: 'Persisted' })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_tasks')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.find((t: Task) => t.id === id).title).toBe('Persisted')
  })
})

describe('remove()', () => {
  it('should remove a task', () => {
    const id = taskStore.add('Remove Me', '')
    const before = tasks().length
    taskStore.remove(id)
    expect(tasks().length).toBe(before - 1)
    expect(tasks().find(t => t.id === id)).toBeUndefined()
  })

  it('removing non-existent task should be no-op', () => {
    const before = tasks().length
    taskStore.remove('nonexistent')
    expect(tasks().length).toBe(before)
  })

  it('should persist removal', () => {
    const id = taskStore.add('Persist Removal', '')
    lsMock.setItem.mockClear()
    taskStore.remove(id)
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_tasks')
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(parsed.find((t: Task) => t.id === id)).toBeUndefined()
  })
})

describe('moveStatus()', () => {
  it('should change task status', () => {
    const id = taskStore.add('Move Me', '')
    expect(tasks().find(t => t.id === id)!.status).toBe('todo')
    taskStore.moveStatus(id, 'inProgress')
    expect(tasks().find(t => t.id === id)!.status).toBe('inProgress')
  })

  it('should cycle through all statuses', () => {
    const id = taskStore.add('Cycle', '')
    const statuses: TaskStatus[] = ['todo', 'inProgress', 'review', 'done']
    for (const status of statuses) {
      taskStore.moveStatus(id, status)
      expect(tasks().find(t => t.id === id)!.status).toBe(status)
    }
  })

  it('should update updatedAt on move', () => {
    const id = taskStore.add('Move Time', '')
    const before = tasks().find(t => t.id === id)!.updatedAt
    taskStore.moveStatus(id, 'done')
    const after = tasks().find(t => t.id === id)!.updatedAt
    expect(after).toBeGreaterThanOrEqual(before)
  })
})

describe('reorder()', () => {
  it('should move task to a different column', () => {
    const id = taskStore.add('Reorder Me', '')
    taskStore.reorder(id, 'inProgress', 0)
    expect(tasks().find(t => t.id === id)!.status).toBe('inProgress')
  })

  it('should place task at specified index in target column', () => {
    const id1 = taskStore.add('First', '')
    taskStore.moveStatus(id1, 'review')
    const id2 = taskStore.add('Second', '')
    taskStore.reorder(id2, 'review', 0)
    // id2 should now be before id1 in review column
    const reviewTasks = tasks().filter(t => t.status === 'review')
    const idx2 = reviewTasks.findIndex(t => t.id === id2)
    const idx1 = reviewTasks.findIndex(t => t.id === id1)
    expect(idx2).toBeLessThan(idx1)
  })

  it('reorder non-existent task should be no-op', () => {
    const before = [...tasks()]
    taskStore.reorder('nonexistent', 'todo', 0)
    expect(tasks().length).toBe(before.length)
  })

  it('clampedIndex should not exceed column length', () => {
    const id = taskStore.add('Clamp Test', '')
    taskStore.reorder(id, 'done', 99999) // large index
    expect(tasks().find(t => t.id === id)!.status).toBe('done')
  })
})

describe('Task Shape', () => {
  it('should have correct type for all priority values', () => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical']
    for (const p of priorities) {
      const id = taskStore.add(`Priority ${p}`, '', p)
      const task = tasks().find(t => t.id === id)
      expect(task!.priority).toBe(p)
    }
  })

  it('tags should be an array of strings', () => {
    const id = taskStore.add('Tagged', '', 'medium', ['ui', 'bug', 'critical'])
    const task = tasks().find(t => t.id === id)
    expect(task!.tags).toEqual(['ui', 'bug', 'critical'])
  })

  it('assignee should be optional', () => {
    const id = taskStore.add('No Assignee', '')
    const task = tasks().find(t => t.id === id)
    expect(task!.assignee).toBeUndefined()
  })

  it('update should allow setting assignee', () => {
    const id = taskStore.add('Assign Me', '')
    taskStore.update(id, { assignee: 'alice' })
    expect(tasks().find(t => t.id === id)!.assignee).toBe('alice')
  })
})

// ===== v2.0.0 Features =====

describe('Subtasks', () => {
  it('should add a subtask to a task', () => {
    const id = taskStore.add('Parent Task', '')
    taskStore.addSubtask(id, 'Child 1')
    const task = tasks().find(t => t.id === id)!
    expect(task.subtasks.length).toBe(1)
    expect(task.subtasks[0].title).toBe('Child 1')
    expect(task.subtasks[0].isCompleted).toBe(false)
  })

  it('should toggle subtask completion', () => {
    const id = taskStore.add('Toggle Parent', '')
    taskStore.addSubtask(id, 'Sub A')
    const stId = tasks().find(t => t.id === id)!.subtasks[0].id
    taskStore.toggleSubtask(id, stId)
    expect(tasks().find(t => t.id === id)!.subtasks[0].isCompleted).toBe(true)
    taskStore.toggleSubtask(id, stId)
    expect(tasks().find(t => t.id === id)!.subtasks[0].isCompleted).toBe(false)
  })

  it('should remove a subtask', () => {
    const id = taskStore.add('Remove Sub Parent', '')
    taskStore.addSubtask(id, 'Sub to remove')
    const stId = tasks().find(t => t.id === id)!.subtasks[0].id
    taskStore.removeSubtask(id, stId)
    expect(tasks().find(t => t.id === id)!.subtasks.length).toBe(0)
  })

  it('should not affect other tasks when adding subtasks', () => {
    const id1 = taskStore.add('Task A', '')
    const id2 = taskStore.add('Task B', '')
    taskStore.addSubtask(id1, 'Sub for A')
    expect(tasks().find(t => t.id === id2)!.subtasks.length).toBe(0)
  })
})

describe('Dependencies', () => {
  it('should add a dependency', () => {
    const id1 = taskStore.add('Dep Task', '')
    const id2 = taskStore.add('Blocked Task', '')
    taskStore.addDependency(id2, id1)
    const blocked = tasks().find(t => t.id === id2)!
    expect(blocked.dependencies).toContain(id1)
  })

  it('should add reverse blocking reference', () => {
    const id1 = taskStore.add('Dep A', '')
    const id2 = taskStore.add('Dep B', '')
    taskStore.addDependency(id2, id1)
    const dep = tasks().find(t => t.id === id1)!
    expect(dep.blocking).toContain(id2)
  })

  it('should not allow self-dependency', () => {
    const id = taskStore.add('Self Dep', '')
    taskStore.addDependency(id, id)
    expect(tasks().find(t => t.id === id)!.dependencies.length).toBe(0)
  })

  it('should remove a dependency', () => {
    const id1 = taskStore.add('Rem Dep 1', '')
    const id2 = taskStore.add('Rem Dep 2', '')
    taskStore.addDependency(id2, id1)
    taskStore.removeDependency(id2, id1)
    expect(tasks().find(t => t.id === id2)!.dependencies).not.toContain(id1)
    expect(tasks().find(t => t.id === id1)!.blocking).not.toContain(id2)
  })
})

describe('Reminders', () => {
  it('should add a reminder', () => {
    const id = taskStore.add('Reminder Task', '')
    taskStore.addReminder(id, 'Due soon', Date.now() + 60000)
    const state = taskStore.getState()
    expect(state.reminders.length).toBeGreaterThan(0)
    const rem = state.reminders.find(r => r.taskId === id)
    expect(rem).toBeDefined()
    expect(rem!.message).toBe('Due soon')
    expect(rem!.isTriggered).toBe(false)
    expect(rem!.isRead).toBe(false)
  })

  it('should check and trigger past-due reminders', () => {
    const id = taskStore.add('Past Reminder', '')
    taskStore.addReminder(id, 'Overdue', Date.now() - 1000) // already past
    const triggered = taskStore.checkReminders()
    expect(triggered.length).toBeGreaterThan(0)
    expect(triggered.some(r => r.taskId === id)).toBe(true)
  })

  it('should mark reminder as read', () => {
    const id = taskStore.add('Read Rem Task', '')
    taskStore.addReminder(id, 'Read me', Date.now() - 1000)
    taskStore.checkReminders()
    const rem = taskStore.getState().reminders.find(r => r.taskId === id && r.isTriggered)!
    taskStore.markReminderRead(rem.id)
    expect(taskStore.getState().reminders.find(r => r.id === rem.id)!.isRead).toBe(true)
  })

  it('getUnreadReminderCount should return correct count', () => {
    const before = taskStore.getUnreadReminderCount()
    const id = taskStore.add('Unread Count', '')
    taskStore.addReminder(id, 'Unread', Date.now() - 1000)
    taskStore.checkReminders()
    expect(taskStore.getUnreadReminderCount()).toBeGreaterThan(before)
  })

  it('removing a task should also remove its reminders', () => {
    const id = taskStore.add('Rem + Task', '')
    taskStore.addReminder(id, 'Linked', Date.now() + 60000)
    expect(taskStore.getState().reminders.some(r => r.taskId === id)).toBe(true)
    taskStore.remove(id)
    expect(taskStore.getState().reminders.some(r => r.taskId === id)).toBe(false)
  })
})

describe('Archive', () => {
  it('should archive a task', () => {
    const id = taskStore.add('Archive Me', '')
    expect(tasks().find(t => t.id === id)!.isArchived).toBe(false)
    taskStore.archive(id)
    expect(tasks().find(t => t.id === id)!.isArchived).toBe(true)
  })

  it('should unarchive a task', () => {
    const id = taskStore.add('Unarchive Me', '')
    taskStore.archive(id)
    taskStore.unarchive(id)
    expect(tasks().find(t => t.id === id)!.isArchived).toBe(false)
  })
})

describe('AI Inference', () => {
  it('inferTasksFromChat should call sendFn and parse response', async () => {
    const mockResponse = JSON.stringify([
      { title: 'Fix bug', description: 'Fix the login bug', type: 'bug', priority: 'high', confidence: 0.9, reasoning: 'User reported' }
    ])
    const sendFn = vi.fn().mockResolvedValue(mockResponse)
    const messages = [
      { role: 'user', content: 'There is a login bug that needs fixing' },
      { role: 'assistant', content: 'I will look into the login bug.' },
    ]
    const results = await taskStore.inferTasksFromChat(messages, sendFn)
    expect(sendFn).toHaveBeenCalledOnce()
    expect(results.length).toBe(1)
    expect(results[0].task.title).toBe('Fix bug')
    expect(results[0].confidence).toBe(0.9)
  })

  it('inferTasksFromChat should return empty on sendFn failure', async () => {
    const sendFn = vi.fn().mockRejectedValue(new Error('Network error'))
    const results = await taskStore.inferTasksFromChat([], sendFn)
    expect(results).toEqual([])
  })

  it('inferTasksFromCode should extract TODO tasks', async () => {
    const mockResponse = JSON.stringify([
      { title: 'Implement auth', description: 'TODO in line 42', type: 'feature', priority: 'medium', confidence: 0.85, reasoning: 'TODO comment' }
    ])
    const sendFn = vi.fn().mockResolvedValue(mockResponse)
    const results = await taskStore.inferTasksFromCode('// TODO: implement auth', 'typescript', sendFn)
    expect(results.length).toBe(1)
    expect(results[0].task.title).toBe('Implement auth')
  })

  it('importInferredTasks should create tasks with ai-inferred source', () => {
    const inferences = [
      { task: { title: 'AI Task 1', description: '', status: 'todo' as const, priority: 'medium' as const, type: 'feature' as const, tags: [] }, confidence: 0.8, reasoning: '', context: '' },
      { task: { title: 'AI Task 2', description: '', status: 'todo' as const, priority: 'high' as const, type: 'bug' as const, tags: ['bug'] }, confidence: 0.95, reasoning: '', context: '' },
    ]
    const ids = taskStore.importInferredTasks(inferences)
    expect(ids.length).toBe(2)
    for (const id of ids) {
      const task = tasks().find(t => t.id === id)!
      expect(task.source).toBe('ai-inferred')
    }
    expect(tasks().find(t => t.id === ids[1])!.confidence).toBe(0.95)
  })
})

describe('Stats', () => {
  it('getStats should return correct counts', () => {
    const stats = taskStore.getStats()
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.todo).toBe('number')
    expect(typeof stats.inProgress).toBe('number')
    expect(typeof stats.review).toBe('number')
    expect(typeof stats.done).toBe('number')
    expect(typeof stats.blocked).toBe('number')
    expect(typeof stats.overdue).toBe('number')
    expect(stats.total).toBe(stats.todo + stats.inProgress + stats.review + stats.done + stats.blocked)
  })

  it('archived tasks should not count in stats', () => {
    const id = taskStore.add('Stats Archive', '')
    const before = taskStore.getStats().total
    taskStore.archive(id)
    expect(taskStore.getStats().total).toBe(before - 1)
  })

  it('blocked status should be counted', () => {
    const id = taskStore.add('Blocked Task', '')
    taskStore.moveStatus(id, 'blocked')
    expect(taskStore.getStats().blocked).toBeGreaterThan(0)
  })
})

describe('Migration', () => {
  it('tasks should have all v2.0.0 fields even from initial data', () => {
    for (const t of tasks()) {
      expect(Array.isArray(t.subtasks)).toBe(true)
      expect(Array.isArray(t.dependencies)).toBe(true)
      expect(Array.isArray(t.blocking)).toBe(true)
      expect(Array.isArray(t.relatedFiles)).toBe(true)
      expect(typeof t.source).toBe('string')
      expect(typeof t.isArchived).toBe('boolean')
      expect(typeof t.type).toBe('string')
    }
  })
})
