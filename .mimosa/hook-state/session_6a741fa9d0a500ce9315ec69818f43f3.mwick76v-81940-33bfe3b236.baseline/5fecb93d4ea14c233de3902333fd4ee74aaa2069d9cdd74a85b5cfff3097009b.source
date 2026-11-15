/**
 * @file theme-store.test.ts
 * @description Unit test for theme-store
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

import { THEMES, themeStore as themeActions } from '../theme-store'

describe('Theme Tokens', () => {
  it('should have both cyberpunk and clean themes', () => {
    expect(THEMES.cyberpunk).toBeDefined()
    expect(THEMES.clean).toBeDefined()
  })

  it('cyberpunk theme should have dark background', () => {
    expect(THEMES.cyberpunk.background).toBe('#0a0a0a')
  })

  it('clean theme should have light background', () => {
    // Clean theme uses OKLch-based colors; should not be black
    expect(THEMES.clean.background).not.toBe('#0a0a0a')
  })

  const requiredTokens = [
    'background', 'backgroundAlt', 'foreground', 'foregroundMuted',
    'primary', 'primaryDim', 'primaryGlow', 'secondary', 'accent',
    'success', 'warning', 'error', 'border', 'borderDim',
    'panelBg', 'cardBg', 'cardBorder', 'cardHover',
    'inputBg', 'inputBorder', 'inputFocus',
    'fontDisplay', 'fontMono', 'fontBody',
    'scrollbarThumb', 'scrollbarTrack', 'shadow', 'shadowHover',
    'overlayBg', 'codeBg',
    'windowClose', 'windowMinimize', 'windowMaximize',
  ]

  for (const token of requiredTokens) {
    it(`cyberpunk should have token: ${token}`, () => {
      expect((THEMES.cyberpunk as any)[token]).toBeDefined()
      expect(typeof (THEMES.cyberpunk as any)[token]).toBe('string')
    })

    it(`clean should have token: ${token}`, () => {
      expect((THEMES.clean as any)[token]).toBeDefined()
      expect(typeof (THEMES.clean as any)[token]).toBe('string')
    })
  }

  it('both themes should have effect flags', () => {
    expect(typeof THEMES.cyberpunk.enableGlitch).toBe('boolean')
    expect(typeof THEMES.cyberpunk.enableScanlines).toBe('boolean')
    expect(typeof THEMES.clean.enableGlitch).toBe('boolean')
    expect(typeof THEMES.clean.enableScanlines).toBe('boolean')
  })

  it('clean theme should disable visual effects', () => {
    expect(THEMES.clean.enableGlitch).toBe(false)
    expect(THEMES.clean.enableScanlines).toBe(false)
    expect(THEMES.clean.enableCRT).toBe(false)
  })

  it('cyberpunk theme should enable visual effects', () => {
    expect(THEMES.cyberpunk.enableGlitch).toBe(true)
    expect(THEMES.cyberpunk.enableScanlines).toBe(true)
  })
})

describe('Theme Actions', () => {
  beforeEach(() => {
    localStorageMock.clear()
    themeActions.setTheme('cyberpunk')
  })

  it('setTheme should switch to clean', () => {
    themeActions.setTheme('clean')
    const state = themeActions.getState()
    expect(state.themeId).toBe('clean')
  })

  it('toggleTheme should flip between themes', () => {
    themeActions.setTheme('cyberpunk')
    themeActions.toggleTheme()
    expect(themeActions.getState().themeId).toBe('clean')
    themeActions.toggleTheme()
    expect(themeActions.getState().themeId).toBe('cyberpunk')
  })

  it('getTokens should return tokens for current theme', () => {
    themeActions.setTheme('cyberpunk')
    expect(themeActions.getTokens().id).toBe('cyberpunk')
    themeActions.setTheme('clean')
    expect(themeActions.getTokens().id).toBe('clean')
  })

  it('should persist theme to localStorage', () => {
    themeActions.setTheme('clean')
    const calls = localStorageMock.setItem.mock.calls
    const themeCall = calls.find((c: string[]) => c[0] === 'yyc3_theme_id')
    expect(themeCall).toBeDefined()
  })
})
