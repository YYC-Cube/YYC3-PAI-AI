/**
 * @file panel-dnd-store.test.ts
 * @description Unit test for panel-dnd-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

import { panelDnDActions, PANEL_CONTENT_MAP } from '../panel-dnd-store'

describe('Panel DnD Store', () => {
  beforeEach(() => {
    localStorageMock.clear()
    panelDnDActions.resetSlots()
  })

  it('default slots should be: ai-chat | file-explorer | code-editor', () => {
    panelDnDActions.resetSlots()
    // Verify via getSlotConfig
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
    expect(panelDnDActions.getSlotConfig('center').type).toBe('file-explorer')
    expect(panelDnDActions.getSlotConfig('right').type).toBe('code-editor')
  })

  it('swapSlots should exchange two slots', () => {
    panelDnDActions.swapSlots('left', 'right')
    expect(panelDnDActions.getSlotConfig('left').type).toBe('code-editor')
    expect(panelDnDActions.getSlotConfig('right').type).toBe('ai-chat')
    expect(panelDnDActions.getSlotConfig('center').type).toBe('file-explorer')
  })

  it('swapSlots with same slot should be no-op', () => {
    panelDnDActions.swapSlots('left', 'left')
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
  })

  it('setSlotContent should change a specific slot', () => {
    panelDnDActions.setSlotContent('center', 'terminal')
    expect(panelDnDActions.getSlotConfig('center').type).toBe('terminal')
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat') // unchanged
  })

  it('resetSlots should restore defaults', () => {
    panelDnDActions.setSlotContent('left', 'preview')
    panelDnDActions.setSlotContent('center', 'terminal')
    panelDnDActions.resetSlots()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
    expect(panelDnDActions.getSlotConfig('center').type).toBe('file-explorer')
    expect(panelDnDActions.getSlotConfig('right').type).toBe('code-editor')
  })

  it('PANEL_CONTENT_MAP should have entries for all types', () => {
    expect(Object.keys(PANEL_CONTENT_MAP)).toContain('ai-chat')
    expect(Object.keys(PANEL_CONTENT_MAP)).toContain('file-explorer')
    expect(Object.keys(PANEL_CONTENT_MAP)).toContain('code-editor')
    expect(Object.keys(PANEL_CONTENT_MAP)).toContain('preview')
    expect(Object.keys(PANEL_CONTENT_MAP)).toContain('terminal')
  })

  it('each PANEL_CONTENT_MAP entry should have labelKey and iconName', () => {
    for (const [, config] of Object.entries(PANEL_CONTENT_MAP)) {
      expect(config.labelKey).toBeTruthy()
      expect(config.iconName).toBeTruthy()
    }
  })

  it('persistence: setSlotContent should call localStorage.setItem', () => {
    const before = localStorageMock.setItem.mock.calls.length
    panelDnDActions.setSlotContent('left', 'preview')
    expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(before)
  })
})

describe('Panel DnD Drag Flow', () => {
  beforeEach(() => {
    localStorageMock.clear()
    panelDnDActions.resetSlots()
  })

  it('startDrag + hoverSlot + completeDrop should swap panels', () => {
    panelDnDActions.startDrag('left')
    panelDnDActions.hoverSlot('right')
    panelDnDActions.completeDrop()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('code-editor')
    expect(panelDnDActions.getSlotConfig('right').type).toBe('ai-chat')
  })

  it('cancelDrag should not change slots', () => {
    panelDnDActions.startDrag('left')
    panelDnDActions.hoverSlot('center')
    panelDnDActions.cancelDrag()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
    expect(panelDnDActions.getSlotConfig('center').type).toBe('file-explorer')
  })

  it('completeDrop without target should be no-op', () => {
    panelDnDActions.startDrag('left')
    // No hoverSlot call
    panelDnDActions.completeDrop()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
  })

  it('completeDrop with same source and target should be no-op', () => {
    panelDnDActions.startDrag('left')
    panelDnDActions.hoverSlot('left')
    panelDnDActions.completeDrop()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
  })
})

// ===== Window Management Tests (对齐 Guidelines: Window Management) =====
describe('Panel DnD Window Management', () => {
  beforeEach(() => {
    localStorageMock.clear()
    panelDnDActions.resetAll()
  })

  it('detachWindow should create a new detached window', () => {
    panelDnDActions.detachWindow('left')
    expect(panelDnDActions.getState().detachedWindows.length).toBe(1)
    expect(panelDnDActions.getState().detachedWindows[0].contentType).toBe('ai-chat')
    expect(panelDnDActions.getState().detachedWindows[0].sourceSlot).toBe('left')
  })

  it('detachWindow should preserve the content type of the slot', () => {
    panelDnDActions.setSlotContent('center', 'preview')
    panelDnDActions.detachWindow('center')
    expect(panelDnDActions.getState().detachedWindows[0].contentType).toBe('preview')
  })

  it('closeWindow should remove a window', () => {
    panelDnDActions.detachWindow('right')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.closeWindow(winId)
    expect(panelDnDActions.getState().detachedWindows.length).toBe(0)
  })

  it('minimizeWindow and restoreWindow should toggle', () => {
    panelDnDActions.detachWindow('left')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.minimizeWindow(winId)
    expect(panelDnDActions.getState().detachedWindows[0].isMinimized).toBe(true)
    panelDnDActions.restoreWindow(winId)
    expect(panelDnDActions.getState().detachedWindows[0].isMinimized).toBe(false)
  })

  it('moveWindow should update position', () => {
    panelDnDActions.detachWindow('center')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.moveWindow(winId, { x: 200, y: 300 })
    expect(panelDnDActions.getState().detachedWindows[0].position).toEqual({ x: 200, y: 300 })
  })

  it('resizeWindow should update size', () => {
    panelDnDActions.detachWindow('right')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.resizeWindow(winId, { width: 500, height: 400 })
    expect(panelDnDActions.getState().detachedWindows[0].size).toEqual({ width: 500, height: 400 })
  })

  it('setWindowZIndex should update z-index', () => {
    panelDnDActions.detachWindow('left')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.setWindowZIndex(winId, 2000)
    expect(panelDnDActions.getState().detachedWindows[0].zIndex).toBe(2000)
  })

  it('multiple detachWindow calls should create multiple windows', () => {
    panelDnDActions.detachWindow('left')
    panelDnDActions.detachWindow('center')
    panelDnDActions.detachWindow('right')
    expect(panelDnDActions.getState().detachedWindows.length).toBe(3)
  })

  it('nextZIndex should increment with each detachWindow', () => {
    expect(panelDnDActions.getState().nextZIndex).toBe(1000)
    panelDnDActions.detachWindow('left')
    expect(panelDnDActions.getState().nextZIndex).toBe(1001)
    panelDnDActions.detachWindow('center')
    expect(panelDnDActions.getState().nextZIndex).toBe(1002)
  })
})

// ===== Cross-Window Drag Tests (对齐 Guidelines: Window Synchronization) =====
describe('Cross-Window Content Drag', () => {
  beforeEach(() => {
    localStorageMock.clear()
    panelDnDActions.resetAll()
  })

  it('startCrossDragFromWindow should set crossDragSource to window', () => {
    panelDnDActions.detachWindow('left')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.startCrossDragFromWindow(winId)
    expect(panelDnDActions.getState().isCrossDragging).toBe(true)
    expect(panelDnDActions.getState().crossDragSource).toEqual({ type: 'window', windowId: winId })
  })

  it('startCrossDragFromSlot should set crossDragSource to slot', () => {
    panelDnDActions.startCrossDragFromSlot('center')
    expect(panelDnDActions.getState().isCrossDragging).toBe(true)
    expect(panelDnDActions.getState().crossDragSource).toEqual({ type: 'slot', slot: 'center' })
  })

  it('cancelCrossDrag should clear cross-drag state', () => {
    panelDnDActions.startCrossDragFromSlot('left')
    panelDnDActions.cancelCrossDrag()
    expect(panelDnDActions.getState().isCrossDragging).toBe(false)
    expect(panelDnDActions.getState().crossDragSource).toBeNull()
  })

  it('completeCrossDrop without source/target should be no-op', () => {
    panelDnDActions.completeCrossDrop()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
  })

  it('completeCrossDrop: window → slot should swap contents', () => {
    panelDnDActions.detachWindow('left') // ai-chat window
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.setSlotContent('right', 'preview')

    panelDnDActions.startCrossDragFromWindow(winId)
    panelDnDActions.hoverCrossTarget({ type: 'slot', slot: 'right' })
    panelDnDActions.completeCrossDrop()

    expect(panelDnDActions.getSlotConfig('right').type).toBe('ai-chat')
    expect(panelDnDActions.getState().detachedWindows[0].contentType).toBe('preview')
  })

  it('completeCrossDrop: slot → slot should swap like normal drag', () => {
    panelDnDActions.startCrossDragFromSlot('left')
    panelDnDActions.hoverCrossTarget({ type: 'slot', slot: 'right' })
    panelDnDActions.completeCrossDrop()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('code-editor')
    expect(panelDnDActions.getSlotConfig('right').type).toBe('ai-chat')
  })

  it('completeCrossDrop: same source & target slot should be no-op', () => {
    panelDnDActions.startCrossDragFromSlot('center')
    panelDnDActions.hoverCrossTarget({ type: 'slot', slot: 'center' })
    panelDnDActions.completeCrossDrop()
    expect(panelDnDActions.getSlotConfig('center').type).toBe('file-explorer')
  })

  it('completeCrossDrop: window → window should swap contents', () => {
    panelDnDActions.setSlotContent('left', 'terminal')
    panelDnDActions.setSlotContent('right', 'preview')
    panelDnDActions.detachWindow('left')  // terminal
    panelDnDActions.detachWindow('right') // preview
    const wins = panelDnDActions.getState().detachedWindows
    const winA = wins[0].id
    const winB = wins[1].id

    panelDnDActions.startCrossDragFromWindow(winA)
    panelDnDActions.hoverCrossTarget({ type: 'window', windowId: winB })
    panelDnDActions.completeCrossDrop()

    const newWins = panelDnDActions.getState().detachedWindows
    expect(newWins.find(w => w.id === winA)!.contentType).toBe('preview')
    expect(newWins.find(w => w.id === winB)!.contentType).toBe('terminal')
  })

  it('sendWindowToSlot should transfer content to slot and swap', () => {
    panelDnDActions.setSlotContent('left', 'terminal')
    panelDnDActions.detachWindow('right') // code-editor window
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.sendWindowToSlot(winId, 'left')
    expect(panelDnDActions.getSlotConfig('left').type).toBe('code-editor')
    expect(panelDnDActions.getState().detachedWindows[0].contentType).toBe('terminal')
  })

  it('swapWindowContents should swap two windows', () => {
    panelDnDActions.setSlotContent('left', 'terminal')
    panelDnDActions.setSlotContent('right', 'preview')
    panelDnDActions.detachWindow('left')
    panelDnDActions.detachWindow('right')
    const wins = panelDnDActions.getState().detachedWindows
    panelDnDActions.swapWindowContents(wins[0].id, wins[1].id)
    const newWins = panelDnDActions.getState().detachedWindows
    expect(newWins[0].contentType).toBe('preview')
    expect(newWins[1].contentType).toBe('terminal')
  })

  it('swapWindowContents with unknown window should be no-op', () => {
    panelDnDActions.swapWindowContents('nonexistent-a', 'nonexistent-b')
  })

  it('sendWindowToSlot with unknown window should be no-op', () => {
    panelDnDActions.sendWindowToSlot('nonexistent', 'left')
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
  })
})

// ===== Layout Persistence Tests (对齐 Guidelines: Layout Persistence) =====
describe('Layout Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
    panelDnDActions.resetAll()
  })

  it('saveLayout should return a LayoutSnapshot with name and slots', () => {
    const layout = panelDnDActions.saveLayout('My Layout')
    expect(layout.name).toBe('My Layout')
    expect(layout.id).toMatch(/^layout_/)
    expect(layout.slots.left).toBe('ai-chat')
    expect(layout.slots.center).toBe('file-explorer')
    expect(layout.slots.right).toBe('code-editor')
    expect(layout.windows).toEqual([])
    expect(layout.createdAt).toBeGreaterThan(0)
  })

  it('saveLayout should include detached windows', () => {
    panelDnDActions.detachWindow('left')
    panelDnDActions.moveWindow(panelDnDActions.getState().detachedWindows[0].id, { x: 200, y: 150 })
    const layout = panelDnDActions.saveLayout('With Windows')
    expect(layout.windows.length).toBe(1)
    expect(layout.windows[0].contentType).toBe('ai-chat')
    expect(layout.windows[0].position.x).toBe(200)
    expect(layout.windows[0].position.y).toBe(150)
  })

  it('listLayouts should return saved layouts', () => {
    panelDnDActions.saveLayout('Layout A')
    panelDnDActions.saveLayout('Layout B')
    const layouts = panelDnDActions.listLayouts()
    expect(layouts.length).toBe(2)
    expect(layouts[0].name).toBe('Layout A')
    expect(layouts[1].name).toBe('Layout B')
  })

  it('loadLayout should restore slots and windows', () => {
    panelDnDActions.setSlotContent('left', 'terminal')
    panelDnDActions.detachWindow('right')
    const layout = panelDnDActions.saveLayout('Saved')

    // Change state
    panelDnDActions.resetAll()
    expect(panelDnDActions.getSlotConfig('left').type).toBe('ai-chat')
    expect(panelDnDActions.getState().detachedWindows.length).toBe(0)

    // Restore
    const result = panelDnDActions.loadLayout(layout.id)
    expect(result).toBe(true)
    expect(panelDnDActions.getSlotConfig('left').type).toBe('terminal')
    expect(panelDnDActions.getState().detachedWindows.length).toBe(1)
    expect(panelDnDActions.getState().detachedWindows[0].contentType).toBe('code-editor')
  })

  it('loadLayout should return false for unknown layoutId', () => {
    expect(panelDnDActions.loadLayout('nonexistent')).toBe(false)
  })

  it('deleteLayout should remove a saved layout', () => {
    const layout = panelDnDActions.saveLayout('To Delete')
    expect(panelDnDActions.listLayouts().length).toBe(1)
    panelDnDActions.deleteLayout(layout.id)
    expect(panelDnDActions.listLayouts().length).toBe(0)
  })

  it('renameLayout should update layout name and updatedAt', () => {
    const layout = panelDnDActions.saveLayout('Old Name')
    panelDnDActions.renameLayout(layout.id, 'New Name')
    const layouts = panelDnDActions.listLayouts()
    expect(layouts[0].name).toBe('New Name')
    expect(layouts[0].updatedAt).toBeGreaterThanOrEqual(layout.updatedAt)
  })

  it('overwriteLayout should update slots and windows', () => {
    const layout = panelDnDActions.saveLayout('Overwrite Me')
    panelDnDActions.setSlotContent('center', 'preview')
    panelDnDActions.detachWindow('left')
    panelDnDActions.overwriteLayout(layout.id)

    const layouts = panelDnDActions.listLayouts()
    expect(layouts[0].slots.center).toBe('preview')
    expect(layouts[0].windows.length).toBe(1)
  })

  it('autoSaveLayout should create "__autosave__" layout', () => {
    panelDnDActions.autoSaveLayout()
    const layouts = panelDnDActions.listLayouts()
    const auto = layouts.find(l => l.name === '__autosave__')
    expect(auto).toBeDefined()
  })

  it('autoSaveLayout should overwrite existing autosave', () => {
    panelDnDActions.autoSaveLayout()
    panelDnDActions.setSlotContent('left', 'preview')
    panelDnDActions.autoSaveLayout()
    const layouts = panelDnDActions.listLayouts()
    const autoLayouts = layouts.filter(l => l.name === '__autosave__')
    expect(autoLayouts.length).toBe(1)
    expect(autoLayouts[0].slots.left).toBe('preview')
  })

  it('restoreLastLayout should restore last saved/loaded layout', () => {
    panelDnDActions.setSlotContent('left', 'terminal')
    panelDnDActions.saveLayout('Last Used')

    panelDnDActions.resetAll()
    const result = panelDnDActions.restoreLastLayout()
    expect(result).toBe(true)
    expect(panelDnDActions.getSlotConfig('left').type).toBe('terminal')
  })

  it('restoreLastLayout should return false if no last layout', () => {
    expect(panelDnDActions.restoreLastLayout()).toBe(false)
  })

  it('saveLayout should persist to localStorage under LAYOUTS_KEY', () => {
    localStorageMock.setItem.mockClear()
    panelDnDActions.saveLayout('Persist Test')
    const calls = localStorageMock.setItem.mock.calls.filter(
      (c: string[]) => c[0] === 'yyc3-panel-layouts'
    )
    expect(calls.length).toBeGreaterThan(0)
    const parsed = JSON.parse(calls[calls.length - 1][1])
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].name).toBe('Persist Test')
  })

  it('loadLayout should restore window positions and sizes correctly', () => {
    panelDnDActions.detachWindow('center')
    const winId = panelDnDActions.getState().detachedWindows[0].id
    panelDnDActions.moveWindow(winId, { x: 300, y: 250 })
    panelDnDActions.resizeWindow(winId, { width: 600, height: 450 })
    const layout = panelDnDActions.saveLayout('Positioned')

    panelDnDActions.resetAll()
    panelDnDActions.loadLayout(layout.id)
    const win = panelDnDActions.getState().detachedWindows[0]
    expect(win.position).toEqual({ x: 300, y: 250 })
    expect(win.size).toEqual({ width: 600, height: 450 })
  })

  it('multiple save + delete should maintain correct list', () => {
    panelDnDActions.saveLayout('A')
    const b = panelDnDActions.saveLayout('B')
    panelDnDActions.saveLayout('C')
    panelDnDActions.deleteLayout(b.id)
    const layouts = panelDnDActions.listLayouts()
    expect(layouts.length).toBe(2)
    expect(layouts.map(l => l.name)).toEqual(['A', 'C'])
  })
})

// ===== Layout Cloud Sync Tests (对齐 Guidelines: Layout Synchronization — Cloud Sync) =====
describe('Layout Cloud Sync', () => {
  beforeEach(() => {
    localStorageMock.clear()
    panelDnDActions.resetAll()
  })

  it('getSyncState should return initial sync state', () => {
    const sync = panelDnDActions.getSyncState()
    expect(sync.isSyncing).toBe(false)
    expect(sync.lastCloudSyncTime).toBeNull()
    expect(sync.syncError).toBeNull()
    expect(sync.conflicts).toEqual([])
    expect(sync.cloudLayoutCount).toBe(0)
  })

  it('syncAllToCloud should return uploaded/failed counts', async () => {
    panelDnDActions.saveLayout('Sync A')
    panelDnDActions.saveLayout('Sync B')
    const result = await panelDnDActions.syncAllToCloud()
    expect(result.uploaded + result.failed).toBe(2)
    expect(panelDnDActions.getSyncState().isSyncing).toBe(false)
    expect(panelDnDActions.getSyncState().lastCloudSyncTime).toBeGreaterThan(0)
  })

  it('syncAllToCloud should skip __autosave__ layouts', async () => {
    panelDnDActions.autoSaveLayout()
    panelDnDActions.saveLayout('Real Layout')
    const result = await panelDnDActions.syncAllToCloud()
    expect(result.uploaded + result.failed).toBe(1)
  })

  it('syncLayoutsFromCloud should return cloud layouts', async () => {
    panelDnDActions.saveLayout('Local A')
    const cloudLayouts = await panelDnDActions.syncLayoutsFromCloud()
    expect(cloudLayouts.length).toBeGreaterThanOrEqual(1)
    expect(cloudLayouts[0].name).toContain('Cloud')
  })

  it('syncLayoutsFromCloud should update cloudLayoutCount', async () => {
    panelDnDActions.saveLayout('For Cloud')
    await panelDnDActions.syncLayoutsFromCloud()
    const sync = panelDnDActions.getSyncState()
    expect(sync.cloudLayoutCount).toBeGreaterThanOrEqual(1)
  })

  it('importCloudLayout should import non-conflicting layout', () => {
    const cloudLayout = {
      id: 'cloud_unique_layout',
      name: 'From Cloud',
      slots: { left: 'terminal' as const, center: 'preview' as const, right: 'ai-chat' as const },
      windows: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const result = panelDnDActions.importCloudLayout(cloudLayout)
    expect(result).toBe(true)
    const layouts = panelDnDActions.listLayouts()
    expect(layouts.some(l => l.name === 'From Cloud')).toBe(true)
  })

  it('importCloudLayout should detect conflict when cloud is newer', () => {
    const local = panelDnDActions.saveLayout('Conflicting')
    const cloudVersion = {
      ...local,
      id: `cloud_${local.id}`,
      name: 'Conflicting (Cloud)',
      updatedAt: local.updatedAt + 5000,
    }
    const result = panelDnDActions.importCloudLayout(cloudVersion)
    expect(result).toBe(false)
    const sync = panelDnDActions.getSyncState()
    expect(sync.conflicts.length).toBe(1)
    expect(sync.conflicts[0].layoutId).toBe(local.id)
    expect(sync.conflicts[0].resolved).toBe(false)
  })

  it('resolveConflict with "local" should keep local version', () => {
    const local = panelDnDActions.saveLayout('Conflict Local')
    const cloudVersion = {
      ...local,
      id: `cloud_${local.id}`,
      name: 'Conflict Cloud',
      slots: { left: 'terminal' as const, center: 'preview' as const, right: 'ai-chat' as const },
      updatedAt: local.updatedAt + 5000,
    }
    panelDnDActions.importCloudLayout(cloudVersion)
    panelDnDActions.resolveConflict(local.id, 'local')

    const sync = panelDnDActions.getSyncState()
    expect(sync.conflicts[0].resolved).toBe(true)
    // Local version should be unchanged
    const layouts = panelDnDActions.listLayouts()
    const kept = layouts.find(l => l.id === local.id)
    expect(kept!.slots.left).toBe('ai-chat') // original default
  })

  it('resolveConflict with "cloud" should replace local with cloud', () => {
    panelDnDActions.setSlotContent('left', 'terminal')
    const local = panelDnDActions.saveLayout('Conflict Replace')
    const cloudVersion = {
      ...local,
      id: `cloud_${local.id}`,
      name: 'Cloud Version',
      slots: { left: 'preview' as const, center: 'code-editor' as const, right: 'terminal' as const },
      updatedAt: local.updatedAt + 5000,
    }
    panelDnDActions.importCloudLayout(cloudVersion)
    panelDnDActions.resolveConflict(local.id, 'cloud')

    const layouts = panelDnDActions.listLayouts()
    const replaced = layouts.find(l => l.id === local.id)
    expect(replaced!.slots.left).toBe('preview')
    expect(replaced!.slots.center).toBe('code-editor')
  })

  it('clearResolvedConflicts should remove resolved conflicts only', () => {
    // Create two conflicts
    const a = panelDnDActions.saveLayout('A')
    const b = panelDnDActions.saveLayout('B')
    panelDnDActions.importCloudLayout({ ...a, id: `cloud_${a.id}`, updatedAt: a.updatedAt + 1000 })
    panelDnDActions.importCloudLayout({ ...b, id: `cloud_${b.id}`, updatedAt: b.updatedAt + 1000 })
    expect(panelDnDActions.getSyncState().conflicts.length).toBe(2)

    // Resolve one
    panelDnDActions.resolveConflict(a.id, 'local')
    panelDnDActions.clearResolvedConflicts()
    expect(panelDnDActions.getSyncState().conflicts.length).toBe(1)
    expect(panelDnDActions.getSyncState().conflicts[0].layoutId).toBe(b.id)
  })

  it('syncLayoutToCloud should return false for unknown layout', async () => {
    const result = await panelDnDActions.syncLayoutToCloud('nonexistent')
    expect(result).toBe(false)
  })
})
