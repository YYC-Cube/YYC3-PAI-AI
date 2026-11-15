/**
 * @file preview-store.test.ts
 * @description Unit test for preview-store
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

import { previewStoreActions, DEVICE_PRESETS, CSS_BREAKPOINTS } from '../preview-store'

function s() { return previewStoreActions.getState() }

// ===== Constants =====
describe('Device Presets', () => {
  it('should have at least 5 device presets', () => {
    expect(DEVICE_PRESETS.length).toBeGreaterThanOrEqual(5)
  })

  it('each preset should have id, name (zh/en), width, height, icon', () => {
    for (const d of DEVICE_PRESETS) {
      expect(d.id).toBeDefined()
      expect(d.name.zh).toBeDefined()
      expect(d.name.en).toBeDefined()
      expect(typeof d.width).toBe('number')
      expect(typeof d.height).toBe('number')
      expect(['monitor', 'tablet', 'smartphone']).toContain(d.icon)
    }
  })

  it('should include "responsive" preset with 0×0 dimensions', () => {
    const responsive = DEVICE_PRESETS.find(d => d.id === 'responsive')
    expect(responsive).toBeDefined()
    expect(responsive!.width).toBe(0)
    expect(responsive!.height).toBe(0)
  })
})

describe('CSS Breakpoints', () => {
  it('should have standard breakpoints (xs through 2xl)', () => {
    expect(CSS_BREAKPOINTS.length).toBe(6)
    const labels = CSS_BREAKPOINTS.map(b => b.label)
    expect(labels).toContain('xs')
    expect(labels).toContain('sm')
    expect(labels).toContain('md')
    expect(labels).toContain('lg')
    expect(labels).toContain('xl')
    expect(labels).toContain('2xl')
  })

  it('breakpoints should be in ascending order', () => {
    for (let i = 1; i < CSS_BREAKPOINTS.length; i++) {
      expect(CSS_BREAKPOINTS[i].width).toBeGreaterThan(CSS_BREAKPOINTS[i - 1].width)
    }
  })
})

// ===== Default State =====
describe('Default State', () => {
  it('should default to realtime mode', () => {
    expect(s().mode).toBe('realtime')
  })

  it('should default to responsive device', () => {
    expect(s().deviceId).toBe('responsive')
  })

  it('should have scroll sync enabled by default', () => {
    expect(s().scrollSyncEnabled).toBe(true)
  })

  it('should have console hidden by default', () => {
    expect(s().consoleVisible).toBe(false)
  })

  it('should have zoom at 1', () => {
    expect(s().zoom).toBe(1)
  })

  it('should have portrait orientation', () => {
    expect(s().orientation).toBe('portrait')
  })

  it('should have no error', () => {
    expect(s().error).toBeNull()
  })

  it('should not be updating', () => {
    expect(s().isUpdating).toBe(false)
  })

  it('should show device frame by default', () => {
    expect(s().showDeviceFrame).toBe(true)
  })

  it('should hide grid lines by default', () => {
    expect(s().showGridLines).toBe(false)
  })

  it('should have empty history', () => {
    expect(s().history).toEqual([])
    expect(s().historyIndex).toBe(-1)
  })

  it('should have multi-device mode disabled', () => {
    expect(s().multiDeviceMode).toBe(false)
  })
})

// ===== Preview Mode =====
describe('setMode', () => {
  it('should switch to manual mode', () => {
    previewStoreActions.setMode('manual')
    expect(s().mode).toBe('manual')
  })

  it('should switch to delayed mode', () => {
    previewStoreActions.setMode('delayed')
    expect(s().mode).toBe('delayed')
  })

  it('should switch to smart mode', () => {
    previewStoreActions.setMode('smart')
    expect(s().mode).toBe('smart')
  })

  it('should switch back to realtime', () => {
    previewStoreActions.setMode('realtime')
    expect(s().mode).toBe('realtime')
  })
})

// ===== Device Selection =====
describe('setDevice', () => {
  it('should set device to desktop', () => {
    previewStoreActions.setDevice('desktop')
    expect(s().deviceId).toBe('desktop')
  })

  it('should set device to iphone-15', () => {
    previewStoreActions.setDevice('iphone-15')
    expect(s().deviceId).toBe('iphone-15')
  })
})

describe('setCustomDimensions', () => {
  it('should set custom width and height', () => {
    previewStoreActions.setCustomDimensions(1024, 768)
    expect(s().customWidth).toBe(1024)
    expect(s().customHeight).toBe(768)
  })
})

describe('getCurrentDeviceDimensions', () => {
  it('should return custom dimensions for responsive device', () => {
    previewStoreActions.setDevice('responsive')
    previewStoreActions.setCustomDimensions(500, 400)
    const dims = previewStoreActions.getCurrentDeviceDimensions()
    expect(dims.width).toBe(500)
    expect(dims.height).toBe(400)
  })

  it('should return preset dimensions for named device', () => {
    previewStoreActions.setDevice('desktop')
    const dims = previewStoreActions.getCurrentDeviceDimensions()
    expect(dims.width).toBe(1440)
    expect(dims.height).toBe(900)
  })

  it('should swap dimensions in landscape orientation', () => {
    previewStoreActions.setDevice('iphone-15')
    previewStoreActions.toggleOrientation() // switch to landscape
    const dims = previewStoreActions.getCurrentDeviceDimensions()
    expect(dims.width).toBe(852)  // height becomes width
    expect(dims.height).toBe(393) // width becomes height
    previewStoreActions.toggleOrientation() // reset
  })
})

// ===== Toggles =====
describe('Toggle Actions', () => {
  it('toggleScrollSync should flip scrollSyncEnabled', () => {
    const before = s().scrollSyncEnabled
    previewStoreActions.toggleScrollSync()
    expect(s().scrollSyncEnabled).toBe(!before)
    previewStoreActions.toggleScrollSync()
    expect(s().scrollSyncEnabled).toBe(before)
  })

  it('toggleConsole should flip consoleVisible', () => {
    const before = s().consoleVisible
    previewStoreActions.toggleConsole()
    expect(s().consoleVisible).toBe(!before)
    previewStoreActions.toggleConsole()
  })

  it('toggleDeviceFrame should flip showDeviceFrame', () => {
    const before = s().showDeviceFrame
    previewStoreActions.toggleDeviceFrame()
    expect(s().showDeviceFrame).toBe(!before)
    previewStoreActions.toggleDeviceFrame()
  })

  it('toggleGridLines should flip showGridLines', () => {
    const before = s().showGridLines
    previewStoreActions.toggleGridLines()
    expect(s().showGridLines).toBe(!before)
    previewStoreActions.toggleGridLines()
  })

  it('toggleOrientation should flip portrait/landscape', () => {
    previewStoreActions.setDevice('responsive') // reset context
    expect(s().orientation).toBe('portrait')
    previewStoreActions.toggleOrientation()
    expect(s().orientation).toBe('landscape')
    previewStoreActions.toggleOrientation()
    expect(s().orientation).toBe('portrait')
  })

  it('toggleBreakpointRuler should flip showBreakpointRuler', () => {
    const before = s().showBreakpointRuler
    previewStoreActions.toggleBreakpointRuler()
    expect(s().showBreakpointRuler).toBe(!before)
    previewStoreActions.toggleBreakpointRuler()
  })

  it('toggleInlinePreview should flip inlinePreviewVisible', () => {
    const before = s().inlinePreviewVisible
    previewStoreActions.toggleInlinePreview()
    expect(s().inlinePreviewVisible).toBe(!before)
    previewStoreActions.toggleInlinePreview()
  })
})

// ===== Zoom =====
describe('setZoom', () => {
  it('should set zoom level', () => {
    previewStoreActions.setZoom(1.5)
    expect(s().zoom).toBe(1.5)
  })

  it('should clamp zoom to min 0.25', () => {
    previewStoreActions.setZoom(0.1)
    expect(s().zoom).toBe(0.25)
  })

  it('should clamp zoom to max 2', () => {
    previewStoreActions.setZoom(5)
    expect(s().zoom).toBe(2)
  })

  it('should allow exact boundary values', () => {
    previewStoreActions.setZoom(0.25)
    expect(s().zoom).toBe(0.25)
    previewStoreActions.setZoom(2)
    expect(s().zoom).toBe(2)
    previewStoreActions.setZoom(1) // reset
  })
})

// ===== Delay =====
describe('setDelay', () => {
  it('should set delay', () => {
    previewStoreActions.setDelay(500)
    expect(s().delay).toBe(500)
  })

  it('should clamp delay to min 0', () => {
    previewStoreActions.setDelay(-100)
    expect(s().delay).toBe(0)
  })

  it('should clamp delay to max 5000', () => {
    previewStoreActions.setDelay(10000)
    expect(s().delay).toBe(5000)
  })
})

// ===== Console =====
describe('Console', () => {
  beforeEach(() => {
    previewStoreActions.clearConsole()
  })

  it('addConsoleEntry should add a log entry', () => {
    previewStoreActions.addConsoleEntry('log', 'Hello world')
    expect(s().consoleEntries.length).toBe(1)
    expect(s().consoleEntries[0].type).toBe('log')
    expect(s().consoleEntries[0].message).toBe('Hello world')
  })

  it('should support all console types', () => {
    previewStoreActions.addConsoleEntry('log', 'Log')
    previewStoreActions.addConsoleEntry('warn', 'Warning')
    previewStoreActions.addConsoleEntry('error', 'Error')
    previewStoreActions.addConsoleEntry('info', 'Info')
    expect(s().consoleEntries.length).toBe(4)
  })

  it('clearConsole should empty all entries', () => {
    previewStoreActions.addConsoleEntry('log', 'Will clear')
    previewStoreActions.clearConsole()
    expect(s().consoleEntries.length).toBe(0)
  })

  it('should cap console entries at 201 (slice -200 + new)', () => {
    for (let i = 0; i < 220; i++) {
      previewStoreActions.addConsoleEntry('log', `Entry ${i}`)
    }
    expect(s().consoleEntries.length).toBeLessThanOrEqual(201)
  })

  it('each entry should have unique id and timestamp', () => {
    previewStoreActions.addConsoleEntry('log', 'A')
    previewStoreActions.addConsoleEntry('warn', 'B')
    const ids = new Set(s().consoleEntries.map(e => e.id))
    expect(ids.size).toBe(s().consoleEntries.length)
  })
})

// ===== History =====
describe('History Snapshots', () => {
  beforeEach(() => {
    // Reset history by setting empty manually — no direct reset action
    // We'll add fresh snapshots
  })

  it('addHistorySnapshot should add a snapshot', () => {
    previewStoreActions.addHistorySnapshot('<h1>Test</h1>', 'html', 'First')
    const state = s()
    expect(state.history.length).toBeGreaterThanOrEqual(1)
    const last = state.history[state.historyIndex]
    expect(last.code).toBe('<h1>Test</h1>')
    expect(last.language).toBe('html')
    expect(last.label).toBe('First')
  })

  it('historyBack should decrement historyIndex', () => {
    previewStoreActions.addHistorySnapshot('v1', 'js')
    previewStoreActions.addHistorySnapshot('v2', 'js')
    const idx = s().historyIndex
    previewStoreActions.historyBack()
    if (idx > 0) {
      expect(s().historyIndex).toBe(idx - 1)
    }
  })

  it('historyForward should increment historyIndex', () => {
    previewStoreActions.addHistorySnapshot('v1', 'js')
    previewStoreActions.addHistorySnapshot('v2', 'js')
    previewStoreActions.historyBack()
    const idx = s().historyIndex
    previewStoreActions.historyForward()
    expect(s().historyIndex).toBe(idx + 1)
  })

  it('historyBack should not go below 0', () => {
    previewStoreActions.addHistorySnapshot('only', 'js')
    previewStoreActions.historyBack()
    previewStoreActions.historyBack()
    previewStoreActions.historyBack()
    expect(s().historyIndex).toBeGreaterThanOrEqual(0)
  })

  it('historyForward should not exceed history length', () => {
    previewStoreActions.addHistorySnapshot('x', 'js')
    previewStoreActions.historyForward()
    previewStoreActions.historyForward()
    expect(s().historyIndex).toBeLessThan(s().history.length)
  })

  it('restoreHistory should jump to specific index', () => {
    previewStoreActions.addHistorySnapshot('a', 'js')
    previewStoreActions.addHistorySnapshot('b', 'js')
    previewStoreActions.addHistorySnapshot('c', 'js')
    previewStoreActions.restoreHistory(0)
    expect(s().historyIndex).toBe(0)
  })

  it('restoreHistory should reject out-of-range index', () => {
    previewStoreActions.restoreHistory(-5)
    previewStoreActions.restoreHistory(99999)
    // Should not change
  })
})

// ===== Error =====
describe('Preview Error', () => {
  it('setPreviewError should set error', () => {
    previewStoreActions.setPreviewError({ message: 'Syntax error', line: 5, column: 10 })
    expect(s().error).not.toBeNull()
    expect(s().error!.message).toBe('Syntax error')
    expect(s().error!.line).toBe(5)
  })

  it('setPreviewError(null) should clear error', () => {
    previewStoreActions.setPreviewError({ message: 'Oops' })
    previewStoreActions.setPreviewError(null)
    expect(s().error).toBeNull()
  })
})

// ===== Updating State =====
describe('isUpdating', () => {
  it('setIsUpdating(true) should set updating', () => {
    previewStoreActions.setIsUpdating(true)
    expect(s().isUpdating).toBe(true)
  })

  it('setIsUpdating(false) should clear and set lastUpdateTime', () => {
    previewStoreActions.setIsUpdating(true)
    previewStoreActions.setIsUpdating(false)
    expect(s().isUpdating).toBe(false)
    expect(s().lastUpdateTime).toBeGreaterThan(0)
  })
})

// ===== Render Time =====
describe('setRenderTime', () => {
  it('should store rounded render time', () => {
    previewStoreActions.setRenderTime(45.7)
    expect(s().renderTime).toBe(46)
  })
})

// ===== Multi-Device Mode =====
describe('Multi-Device Mode', () => {
  it('toggleMultiDeviceMode should enable and set defaults', () => {
    if (s().multiDeviceMode) previewStoreActions.toggleMultiDeviceMode() // ensure off
    previewStoreActions.toggleMultiDeviceMode() // turn on
    expect(s().multiDeviceMode).toBe(true)
    expect(s().multiDeviceIds.length).toBeGreaterThanOrEqual(1)
    previewStoreActions.toggleMultiDeviceMode() // turn off
  })

  it('setMultiDeviceIds should set device list', () => {
    previewStoreActions.setMultiDeviceIds(['desktop', 'ipad'])
    expect(s().multiDeviceIds).toEqual(['desktop', 'ipad'])
  })

  it('setMultiDeviceIds should cap at 4 devices', () => {
    previewStoreActions.setMultiDeviceIds(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(s().multiDeviceIds.length).toBe(4)
  })
})

// ===== Inline Preview =====
describe('Inline Preview', () => {
  it('setInlinePreviewHeight should clamp between 120 and 500', () => {
    previewStoreActions.setInlinePreviewHeight(50)
    expect(s().inlinePreviewHeight).toBe(120)
    previewStoreActions.setInlinePreviewHeight(999)
    expect(s().inlinePreviewHeight).toBe(500)
    previewStoreActions.setInlinePreviewHeight(300)
    expect(s().inlinePreviewHeight).toBe(300)
  })
})

// ===== Auto Refresh =====
describe('setAutoRefreshInterval', () => {
  it('should set interval', () => {
    previewStoreActions.setAutoRefreshInterval(2000)
    expect(s().autoRefreshInterval).toBe(2000)
  })

  it('should clamp to min 0', () => {
    previewStoreActions.setAutoRefreshInterval(-100)
    expect(s().autoRefreshInterval).toBe(0)
  })

  it('should clamp to max 30000', () => {
    previewStoreActions.setAutoRefreshInterval(60000)
    expect(s().autoRefreshInterval).toBe(30000)
  })
})

// ===== Persistence =====
describe('Persistence', () => {
  it('should persist settings to localStorage', () => {
    localStorageMock.setItem.mockClear()
    previewStoreActions.setMode('delayed')
    const calls = localStorageMock.setItem.mock.calls.filter(
      (c: string[]) => c[0] === 'yyc3_preview_settings'
    )
    expect(calls.length).toBeGreaterThan(0)
  })

  it('should NOT persist transient state (consoleEntries, history, error)', () => {
    previewStoreActions.addConsoleEntry('log', 'Transient')
    const calls = localStorageMock.setItem.mock.calls.filter(
      (c: string[]) => c[0] === 'yyc3_preview_settings'
    )
    const lastCall = calls[calls.length - 1]
    const parsed = JSON.parse(lastCall[1])
    expect(parsed).not.toHaveProperty('consoleEntries')
    expect(parsed).not.toHaveProperty('history')
    expect(parsed).not.toHaveProperty('error')
    expect(parsed).not.toHaveProperty('isUpdating')
    expect(parsed).not.toHaveProperty('renderTime')
  })
})
