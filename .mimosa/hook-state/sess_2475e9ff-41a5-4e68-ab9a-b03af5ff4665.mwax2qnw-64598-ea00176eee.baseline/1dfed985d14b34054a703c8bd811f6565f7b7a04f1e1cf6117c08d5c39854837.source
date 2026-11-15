/**
 * @file theme-store.ts
 * @description 主题状态管理模块，管理主题切换和主题令牌
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,ui,state-management,critical
 */

import { useSyncExternalStore } from 'react'
import { activityBus } from './activity-store'

export type ThemeId = 'cyberpunk' | 'clean'

export interface ThemeTokens {
  id: ThemeId
  name: { zh: string; en: string }
  // Core colors
  background: string
  backgroundAlt: string
  foreground: string
  foregroundMuted: string
  primary: string
  primaryDim: string
  primaryGlow: string
  primaryForeground: string
  secondary: string
  accent: string
  accentGlow: string
  success: string
  warning: string
  error: string
  border: string
  borderDim: string
  // Panel / Card
  panelBg: string
  cardBg: string
  cardBorder: string
  cardHover: string
  // Input
  inputBg: string
  inputBorder: string
  inputFocus: string
  // Fonts
  fontDisplay: string
  fontMono: string
  fontBody: string
  // Misc
  scrollbarThumb: string
  scrollbarTrack: string
  shadow: string
  shadowHover: string
  // Overlay & code
  overlayBg: string
  codeBg: string
  contrastOnSuccess: string
  // Window chrome (macOS-style traffic lights)
  windowClose: string
  windowMinimize: string
  windowMaximize: string
  // Success glow for update flash effects
  successGlow: string
  // Effects
  enableGlitch: boolean
  enableScanlines: boolean
  enableCRT: boolean
  enableGlow: boolean
  borderRadius: string
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: { zh: '赛博朋克', en: 'Cyberpunk' },
    background: '#0a0a0a',
    backgroundAlt: '#111111',
    foreground: '#e0e0e0',
    foregroundMuted: '#888888',
    primary: '#00f0ff',
    primaryDim: 'rgba(0, 240, 255, 0.5)',
    primaryGlow: 'rgba(0, 240, 255, 0.15)',
    primaryForeground: '#0a0a0a',
    secondary: '#ff79c6',
    accent: '#ff00ff',
    accentGlow: 'rgba(255, 0, 255, 0.15)',
    success: '#00ff00',
    warning: '#ffaa00',
    error: '#ff0044',
    border: 'rgba(0, 240, 255, 0.15)',
    borderDim: 'rgba(0, 240, 255, 0.08)',
    panelBg: 'rgba(10, 10, 10, 0.85)',
    cardBg: 'rgba(0, 240, 255, 0.03)',
    cardBorder: 'rgba(0, 240, 255, 0.2)',
    cardHover: 'rgba(0, 240, 255, 0.06)',
    inputBg: 'rgba(0, 240, 255, 0.04)',
    inputBorder: 'rgba(0, 240, 255, 0.15)',
    inputFocus: 'rgba(0, 240, 255, 0.4)',
    fontDisplay: "'Orbitron', sans-serif",
    fontMono: "'Share Tech Mono', monospace",
    fontBody: "'Rajdhani', sans-serif",
    scrollbarThumb: 'rgba(0, 240, 255, 0.3)',
    scrollbarTrack: 'rgba(0, 240, 255, 0.05)',
    shadow: '0 0 12px rgba(0, 240, 255, 0.1)',
    shadowHover: '0 0 20px rgba(0, 240, 255, 0.2)',
    overlayBg: 'rgba(0, 0, 0, 0.75)',
    codeBg: 'rgba(0, 0, 0, 0.4)',
    contrastOnSuccess: '#0a0a0a',
    windowClose: '#ff5f57',
    windowMinimize: '#febc2e',
    windowMaximize: '#28c840',
    successGlow: 'rgba(0, 255, 136, 0.4)',
    enableGlitch: true,
    enableScanlines: true,
    enableCRT: true,
    enableGlow: true,
    borderRadius: '6px',
  },
  clean: {
    id: 'clean',
    name: { zh: '现代简约', en: 'Clean Modern' },
    background: '#fafafa',
    backgroundAlt: '#f0f2f5',
    foreground: '#1a1a2e',
    foregroundMuted: '#6b7280',
    primary: '#3b82f6',
    primaryDim: 'rgba(59, 130, 246, 0.5)',
    primaryGlow: 'rgba(59, 130, 246, 0.08)',
    primaryForeground: '#ffffff',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.08)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: 'rgba(0, 0, 0, 0.08)',
    borderDim: 'rgba(0, 0, 0, 0.04)',
    panelBg: 'rgba(255, 255, 255, 0.95)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    cardHover: 'rgba(59, 130, 246, 0.04)',
    inputBg: '#ffffff',
    inputBorder: 'rgba(0, 0, 0, 0.12)',
    inputFocus: 'rgba(59, 130, 246, 0.4)',
    fontDisplay: "'Inter', 'system-ui', sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontBody: "'Inter', 'system-ui', sans-serif",
    scrollbarThumb: 'rgba(0, 0, 0, 0.15)',
    scrollbarTrack: 'rgba(0, 0, 0, 0.03)',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    shadowHover: '0 4px 12px rgba(0, 0, 0, 0.12)',
    overlayBg: 'rgba(0, 0, 0, 0.3)',
    codeBg: 'rgba(0, 0, 0, 0.03)',
    contrastOnSuccess: '#ffffff',
    windowClose: '#ff5f57',
    windowMinimize: '#febc2e',
    windowMaximize: '#28c840',
    successGlow: 'rgba(16, 185, 129, 0.3)',
    enableGlitch: false,
    enableScanlines: false,
    enableCRT: false,
    enableGlow: false,
    borderRadius: '10px',
  },
}

/** Z-index constants for consistent modal stacking */
export const Z_INDEX = {
  /** Base content panels */
  content: 10,
  /** Floating widget overlay */
  floatingWidget: 20,
  /** Stat detail panel & secondary overlays */
  overlay: 50,
  /** Model settings modal */
  modal: 100,
  /** AI assist & code gen panels */
  assistPanel: 200,
  /** Project create & top-level modals */
  topModal: 300,
  /** Toast notifications */
  toast: 9000,
} as const

/** Standardized backdrop-filter blur levels */
export const BLUR = {
  /** Subtle blur for panel backgrounds */
  sm: 'blur(6px)',
  /** Default modal overlay blur */
  md: 'blur(10px)',
  /** Heavy blur for important modals */
  lg: 'blur(14px)',
  /** Extra heavy blur for overlays */
  heavy: 'blur(20px)',
} as const

// ===== State =====
interface ThemeState {
  themeId: ThemeId
  effects: {
    enableGlitch: boolean
    enableScanlines: boolean
    enableCRT: boolean
    enableGlow: boolean
  }
}

const LS_KEY = 'yyc3_theme_id'
const LS_AUTO_KEY = 'yyc3_theme_auto'
const LS_EFFECTS_KEY = 'yyc3_theme_effects'

function getSystemPreference(): ThemeId {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'clean'
  }
  return 'cyberpunk'
}

function isAutoDetectEnabled(): boolean {
  try {
    return localStorage.getItem(LS_AUTO_KEY) === 'true'
  } catch { return false }
}

function loadEffects(): { enableGlitch: boolean; enableScanlines: boolean; enableCRT: boolean; enableGlow: boolean } {
  try {
    const v = localStorage.getItem(LS_EFFECTS_KEY)
    if (v) return JSON.parse(v)
  } catch { /* ignore */ }
  return { enableGlitch: true, enableScanlines: true, enableCRT: true, enableGlow: true }
}

function loadThemeId(): ThemeId {
  try {
    // If auto-detect is enabled, use system preference
    if (isAutoDetectEnabled()) return getSystemPreference()
    const v = localStorage.getItem(LS_KEY)
    if (v === 'cyberpunk' || v === 'clean') return v
  } catch { /* ignore */ }
  return 'cyberpunk'
}

let state: ThemeState = { themeId: loadThemeId(), effects: loadEffects() }

type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  for (const l of listeners) l()
}
function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}
function getSnapshot() {
  return state
}

// Apply CSS custom properties to document root
function applyThemeToDOM(id: ThemeId) {
  const t = THEMES[id]
  const root = document.documentElement
  root.setAttribute('data-theme', id)
  root.style.setProperty('--yyc3-bg', t.background)
  root.style.setProperty('--yyc3-bg-alt', t.backgroundAlt)
  root.style.setProperty('--yyc3-fg', t.foreground)
  root.style.setProperty('--yyc3-fg-muted', t.foregroundMuted)
  root.style.setProperty('--yyc3-primary', t.primary)
  root.style.setProperty('--yyc3-primary-dim', t.primaryDim)
  root.style.setProperty('--yyc3-primary-glow', t.primaryGlow)
  root.style.setProperty('--yyc3-secondary', t.secondary)
  root.style.setProperty('--yyc3-accent', t.accent)
  root.style.setProperty('--yyc3-success', t.success)
  root.style.setProperty('--yyc3-warning', t.warning)
  root.style.setProperty('--yyc3-error', t.error)
  root.style.setProperty('--yyc3-border', t.border)
  root.style.setProperty('--yyc3-border-dim', t.borderDim)
  root.style.setProperty('--yyc3-panel-bg', t.panelBg)
  root.style.setProperty('--yyc3-card-bg', t.cardBg)
  root.style.setProperty('--yyc3-card-border', t.cardBorder)
  root.style.setProperty('--yyc3-card-hover', t.cardHover)
  root.style.setProperty('--yyc3-input-bg', t.inputBg)
  root.style.setProperty('--yyc3-input-border', t.inputBorder)
  root.style.setProperty('--yyc3-input-focus', t.inputFocus)
  root.style.setProperty('--yyc3-shadow', t.shadow)
  root.style.setProperty('--yyc3-shadow-hover', t.shadowHover)
  root.style.setProperty('--yyc3-radius', t.borderRadius)
  root.style.setProperty('--yyc3-font-display', t.fontDisplay)
  root.style.setProperty('--yyc3-font-mono', t.fontMono)
  root.style.setProperty('--yyc3-font-body', t.fontBody)
  root.style.setProperty('--yyc3-scrollbar-thumb', t.scrollbarThumb)
  root.style.setProperty('--yyc3-scrollbar-track', t.scrollbarTrack)
  root.style.setProperty('--yyc3-overlay-bg', t.overlayBg)
  root.style.setProperty('--yyc3-code-bg', t.codeBg)
  root.style.setProperty('--yyc3-contrast-on-success', t.contrastOnSuccess)
  root.style.setProperty('--yyc3-window-close', t.windowClose)
  root.style.setProperty('--yyc3-window-minimize', t.windowMinimize)
  root.style.setProperty('--yyc3-window-maximize', t.windowMaximize)
  root.style.setProperty('--yyc3-success-glow', t.successGlow)
  root.style.setProperty('--yyc3-accent-glow', t.accentGlow)
}

// Apply on load
applyThemeToDOM(state.themeId)

const actions = {
  setTheme: (id: ThemeId) => {
    state = { ...state, themeId: id }
    try { localStorage.setItem(LS_KEY, id) } catch { /* */ }
    applyThemeToDOM(id)
    emitChange()
    const label = id === 'cyberpunk' ? 'Cyberpunk' : 'Clean Modern'
    activityBus.push('system', `Theme switched to ${label}`, `主题已切换为 ${label === 'Cyberpunk' ? '赛博朋克' : '现代简约'}`)
  },
  toggleTheme: () => {
    const next = state.themeId === 'cyberpunk' ? 'clean' : 'cyberpunk'
    // Disable auto-detect when user manually toggles
    try { localStorage.setItem(LS_AUTO_KEY, 'false') } catch { /* */ }
    actions.setTheme(next)
  },
  getTokens: (): ThemeTokens => THEMES[state.themeId],
  setAutoDetect: (enabled: boolean) => {
    try { localStorage.setItem(LS_AUTO_KEY, String(enabled)) } catch { /* */ }
    if (enabled) {
      actions.setTheme(getSystemPreference())
    }
  },
  isAutoDetect: (): boolean => isAutoDetectEnabled(),
  setEffect: (effect: keyof ThemeState['effects'], value: boolean) => {
    state = { ...state, effects: { ...state.effects, [effect]: value } }
    try { localStorage.setItem(LS_EFFECTS_KEY, JSON.stringify(state.effects)) } catch { /* */ }
    emitChange()
  },
}

// Listen for system color scheme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (isAutoDetectEnabled()) {
      actions.setTheme(e.matches ? 'clean' : 'cyberpunk')
    }
  })
}

// ===== React Hook =====
export function useThemeStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return {
    ...snapshot,
    ...actions,
    tokens: THEMES[snapshot.themeId],
    isCyberpunk: snapshot.themeId === 'cyberpunk',
    isClean: snapshot.themeId === 'clean',
    autoDetect: isAutoDetectEnabled(),
    ...snapshot.effects,
  }
}

export const themeStore = {
  getState: getSnapshot,
  ...actions,
}
