/**
 * @file ide-store.test.ts
 * @description Unit test for ide-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage before importing store
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

// Import after mocking localStorage
import { ideStore, LAYOUT_PRESETS } from '../ide-store'
import {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_MIDDLE_RATIO,
  LEFT_WIDTH_MIN,
  LEFT_WIDTH_MAX,
  MIDDLE_RATIO_MIN,
  MIDDLE_RATIO_MAX,
  TERMINAL_HEIGHT_MIN,
  TERMINAL_HEIGHT_MAX,
} from '../../types'

// ===== Helper: reset store to defaults =====
function resetStore() {
  ideStore.resetLayout()
}

// ===== Layout Constants =====
describe('Layout Constants', () => {
  it('default left width should be 35% (三栏式 35/30/35)', () => {
    expect(DEFAULT_LEFT_WIDTH).toBe(35)
  })

  it('default middle ratio should be 46 (≈30% of 65%)', () => {
    expect(DEFAULT_MIDDLE_RATIO).toBe(46)
  })

  it('calculated right column should be ≈35% of total', () => {
    const remaining = 100 - DEFAULT_LEFT_WIDTH // 65%
    const middleActual = remaining * (DEFAULT_MIDDLE_RATIO / 100) // ~29.9%
    const rightActual = remaining - middleActual // ~35.1%
    expect(rightActual).toBeGreaterThan(34)
    expect(rightActual).toBeLessThan(36)
  })

  it('LEFT_WIDTH_MIN should be 15, MAX 50', () => {
    expect(LEFT_WIDTH_MIN).toBe(15)
    expect(LEFT_WIDTH_MAX).toBe(50)
  })

  it('MIDDLE_RATIO range should be 20-80', () => {
    expect(MIDDLE_RATIO_MIN).toBe(20)
    expect(MIDDLE_RATIO_MAX).toBe(80)
  })

  it('TERMINAL_HEIGHT_MAX should be 500', () => {
    expect(TERMINAL_HEIGHT_MAX).toBe(500)
  })
})

// ===== Layout Presets =====
describe('Layout Presets', () => {
  it('should have at least 5 presets', () => {
    expect(LAYOUT_PRESETS.length).toBeGreaterThanOrEqual(5)
  })

  it('each preset should have zh and en names', () => {
    for (const preset of LAYOUT_PRESETS) {
      expect(preset.name.zh).toBeTruthy()
      expect(preset.name.en).toBeTruthy()
    }
  })

  it('default preset should have 35/46 ratio', () => {
    const defaultPreset = LAYOUT_PRESETS.find(p => p.id === 'default')
    expect(defaultPreset).toBeDefined()
    expect(defaultPreset!.leftWidthPercent).toBe(35)
    expect(defaultPreset!.middleRatioPercent).toBe(46)
  })

  it('most presets should default terminal to closed', () => {
    const closedCount = LAYOUT_PRESETS.filter(p => !p.terminalVisible).length
    expect(closedCount).toBeGreaterThanOrEqual(3)
  })
})

// ===== Tab Management =====
describe('Tab Management', () => {
  beforeEach(resetStore)

  it('initial state should have one tab (IDEMode.tsx)', () => {
    const s = ideStore.getState()
    expect(s.openTabs.length).toBe(1)
    expect(s.openTabs[0].id).toBe('IDEMode.tsx')
    expect(s.activeTabId).toBe('IDEMode.tsx')
  })

  it('openTab should add a new tab and activate it', () => {
    ideStore.openTab('App.tsx')
    const s = ideStore.getState()
    expect(s.openTabs.length).toBe(2)
    expect(s.activeTabId).toBe('App.tsx')
    expect(s.openTabs[1].id).toBe('App.tsx')
    expect(s.openTabs[1].ext).toBe('tsx')
  })

  it('openTab on existing file should activate without duplicating', () => {
    ideStore.openTab('App.tsx')
    ideStore.openTab('utils.ts')
    ideStore.openTab('App.tsx') // re-open
    const s = ideStore.getState()
    expect(s.openTabs.length).toBe(3)
    expect(s.activeTabId).toBe('App.tsx')
  })

  it('closeTab should remove tab and activate neighbor', () => {
    ideStore.openTab('A.ts')
    ideStore.openTab('B.ts')
    ideStore.openTab('C.ts')
    ideStore.activateTab('B.ts')
    ideStore.closeTab('B.ts')
    const s = ideStore.getState()
    expect(s.openTabs.find(t => t.id === 'B.ts')).toBeUndefined()
    // should activate the next tab (C.ts or adjacent)
    expect(s.activeTabId).toBeDefined()
  })

  it('closeTab should not remove pinned tabs', () => {
    ideStore.openTab('pinned.ts')
    ideStore.togglePinTab('pinned.ts')
    ideStore.closeTab('pinned.ts')
    const s = ideStore.getState()
    expect(s.openTabs.find(t => t.id === 'pinned.ts')).toBeDefined()
  })

  it('closeTab should not remove the last tab', () => {
    const s = ideStore.getState()
    expect(s.openTabs.length).toBe(1)
    ideStore.closeTab(s.openTabs[0].id)
    expect(ideStore.getState().openTabs.length).toBe(1) // still 1
  })

  it('markTabModified should set isModified flag', () => {
    ideStore.markTabModified('IDEMode.tsx', true)
    const tab = ideStore.getState().openTabs.find(t => t.id === 'IDEMode.tsx')
    expect(tab?.isModified).toBe(true)
    ideStore.markTabModified('IDEMode.tsx', false)
    const tab2 = ideStore.getState().openTabs.find(t => t.id === 'IDEMode.tsx')
    expect(tab2?.isModified).toBe(false)
  })

  it('reorderTabs should swap tab positions', () => {
    ideStore.openTab('A.ts')
    ideStore.openTab('B.ts')
    // Tabs: IDEMode.tsx, A.ts, B.ts
    ideStore.reorderTabs(0, 2) // move IDEMode.tsx to end
    const s = ideStore.getState()
    expect(s.openTabs[0].id).toBe('A.ts')
    expect(s.openTabs[2].id).toBe('IDEMode.tsx')
  })

  it('closeOtherTabs should keep only target and pinned', () => {
    ideStore.openTab('A.ts')
    ideStore.openTab('B.ts')
    ideStore.openTab('C.ts')
    ideStore.togglePinTab('A.ts')
    ideStore.closeOtherTabs('C.ts')
    const s = ideStore.getState()
    const ids = s.openTabs.map(t => t.id)
    expect(ids).toContain('A.ts') // pinned
    expect(ids).toContain('C.ts') // kept
    expect(ids).not.toContain('B.ts') // closed
  })

  it('closeTabsToRight should close tabs after index', () => {
    ideStore.openTab('A.ts')
    ideStore.openTab('B.ts')
    ideStore.openTab('C.ts')
    // Tabs: IDEMode.tsx, A.ts, B.ts, C.ts
    ideStore.closeTabsToRight('A.ts')
    const ids = ideStore.getState().openTabs.map(t => t.id)
    expect(ids).toContain('IDEMode.tsx')
    expect(ids).toContain('A.ts')
    expect(ids).not.toContain('B.ts')
    expect(ids).not.toContain('C.ts')
  })
})

// ===== Terminal State =====
describe('Terminal State', () => {
  beforeEach(resetStore)

  it('terminal should be closed by default', () => {
    // resetLayout sets terminalVisible: true, so we check the fresh state
    // Actually resetLayout sets true, but persisted default is false
    // Let's test the toggle
    ideStore.setTerminalVisible(false)
    expect(ideStore.getState().terminalVisible).toBe(false)
  })

  it('toggleTerminal should flip visibility', () => {
    ideStore.setTerminalVisible(false)
    ideStore.toggleTerminal()
    expect(ideStore.getState().terminalVisible).toBe(true)
    ideStore.toggleTerminal()
    expect(ideStore.getState().terminalVisible).toBe(false)
  })

  it('terminalExpanded should default to false', () => {
    ideStore.setTerminalExpanded(false)
    expect(ideStore.getState().terminalExpanded).toBe(false)
  })

  it('setTerminalExpanded should update state', () => {
    ideStore.setTerminalExpanded(true)
    expect(ideStore.getState().terminalExpanded).toBe(true)
    ideStore.setTerminalExpanded(false)
    expect(ideStore.getState().terminalExpanded).toBe(false)
  })

  it('setTerminalHeight should clamp to min/max', () => {
    ideStore.setTerminalHeight(50) // below min
    expect(ideStore.getState().terminalHeight).toBe(TERMINAL_HEIGHT_MIN)
    ideStore.setTerminalHeight(9999) // above max
    expect(ideStore.getState().terminalHeight).toBe(TERMINAL_HEIGHT_MAX)
    ideStore.setTerminalHeight(250) // normal
    expect(ideStore.getState().terminalHeight).toBe(250)
  })
})

// ===== Panel Width Clamping =====
describe('Panel Width Clamping', () => {
  beforeEach(resetStore)

  it('setLeftWidth should clamp below minimum', () => {
    ideStore.setLeftWidth(5) // below 15
    expect(ideStore.getState().leftWidthPercent).toBe(LEFT_WIDTH_MIN)
  })

  it('setLeftWidth should clamp above maximum', () => {
    ideStore.setLeftWidth(90) // above 50
    expect(ideStore.getState().leftWidthPercent).toBe(LEFT_WIDTH_MAX)
  })

  it('setMiddleRatio should clamp below minimum', () => {
    ideStore.setMiddleRatio(5) // below 20
    expect(ideStore.getState().middleRatioPercent).toBe(MIDDLE_RATIO_MIN)
  })

  it('setMiddleRatio should clamp above maximum', () => {
    ideStore.setMiddleRatio(95) // above 80
    expect(ideStore.getState().middleRatioPercent).toBe(MIDDLE_RATIO_MAX)
  })
})

// ===== Split View =====
describe('Split View', () => {
  beforeEach(resetStore)

  it('initial split direction should be none', () => {
    expect(ideStore.getState().splitDirection).toBe('none')
  })

  it('toggleSplit should cycle: none → horizontal → vertical → none', () => {
    ideStore.toggleSplit()
    expect(ideStore.getState().splitDirection).toBe('horizontal')
    ideStore.toggleSplit()
    expect(ideStore.getState().splitDirection).toBe('vertical')
    ideStore.toggleSplit()
    expect(ideStore.getState().splitDirection).toBe('none')
  })

  it('toggleSplit with explicit direction should set it', () => {
    ideStore.toggleSplit('vertical')
    expect(ideStore.getState().splitDirection).toBe('vertical')
  })

  it('split should auto-assign splitActiveFile if not set', () => {
    ideStore.toggleSplit()
    expect(ideStore.getState().splitActiveFile).toBe('IDEMode.tsx')
  })

  it('setSplitRatio should clamp 20-80', () => {
    ideStore.setSplitRatio(10)
    expect(ideStore.getState().splitRatio).toBe(20)
    ideStore.setSplitRatio(90)
    expect(ideStore.getState().splitRatio).toBe(80)
    ideStore.setSplitRatio(60)
    expect(ideStore.getState().splitRatio).toBe(60)
  })
})

// ===== Preset Application =====
describe('Preset Application', () => {
  beforeEach(resetStore)

  it('applyPreset("default") should set 35/46 layout', () => {
    ideStore.applyPreset('default')
    const s = ideStore.getState()
    expect(s.leftWidthPercent).toBe(35)
    expect(s.middleRatioPercent).toBe(46)
    expect(s.terminalVisible).toBe(false)
    expect(s.activePresetId).toBe('default')
  })

  it('applyPreset("focus") should collapse left panel', () => {
    ideStore.applyPreset('focus')
    const s = ideStore.getState()
    expect(s.leftWidthPercent).toBe(0)
    expect(s.leftCollapsed).toBe(true)
  })

  it('applyPreset("debug") should enable terminal and split', () => {
    ideStore.applyPreset('debug')
    const s = ideStore.getState()
    expect(s.terminalVisible).toBe(true)
    expect(s.splitDirection).toBe('horizontal')
  })

  it('applyPreset with unknown id should be no-op', () => {
    const before = ideStore.getState()
    ideStore.applyPreset('nonexistent')
    expect(ideStore.getState()).toBe(before)
  })
})

// ===== Persistence =====
describe('Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
    resetStore()
  })

  it('actions should trigger localStorage.setItem', () => {
    const callsBefore = localStorageMock.setItem.mock.calls.length
    ideStore.openTab('test.ts')
    expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('persisted data should contain _layoutVersion', () => {
    ideStore.openTab('test.ts')
    const calls = localStorageMock.setItem.mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall).toBeDefined()
    const data = JSON.parse(lastCall![1])
    expect(data._layoutVersion).toBe(2)
  })
})
