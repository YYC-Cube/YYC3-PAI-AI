/**
 * @file types.ts
 * @description Design JSON 数据模型、面板规范、组件规范、样式令牌等类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags types,typescript,core
 */

// ===== Design JSON Root =====
export interface DesignRoot {
  version: string
  theme: 'light' | 'dark'
  tokens: string
  panels: PanelSpec[]
  components: ComponentSpec[]
  styles: StyleSpec
}

// ===== Panel Specification =====
export interface PanelSpec {
  id: string
  type: 'container' | 'content' | 'preview'
  layout: PanelLayout
  style: PanelStyle
  children?: PanelSpec[]
  components?: ComponentSpec[]
}

export interface PanelLayout {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface PanelStyle {
  background?: string
  border?: string
  borderRadius?: number
  padding?: number
  margin?: number
  shadow?: string
}

// ===== Component Specification =====
export interface ComponentSpec {
  id: string
  type: ComponentType
  props: Record<string, unknown>
  style: ComponentStyle
  children?: ComponentSpec[]
}

export type ComponentType =
  | 'Button' | 'Input' | 'Text' | 'Image' | 'Container'
  | 'List' | 'Card' | 'Modal' | 'Dropdown' | 'Checkbox'
  | 'Radio' | 'Switch' | 'Slider' | 'DatePicker' | 'TimePicker'
  | 'Upload' | 'Progress' | 'Spinner' | 'Badge' | 'Avatar'
  | 'Divider' | 'Tooltip' | 'Popover' | 'Tabs' | 'Accordion'
  | 'Breadcrumb' | 'Pagination' | 'Table' | 'Form' | 'Alert'
  | 'Message' | 'Notification' | 'Drawer' | 'Skeleton' | 'Empty'
  | 'Result' | 'Statistic' | 'Timeline' | 'Tree' | 'Transfer'
  | 'Calendar' | 'Carousel' | 'Collapse' | 'Comment' | 'Description'
  | 'Steps' | 'Tag' | 'Rate' | 'Space' | 'Layout'
  | 'Menu' | 'PageHeader' | 'BackTop' | 'Anchor' | 'Affix'
  | 'Parallax' | 'ScrollNumber' | 'Spin' | 'ConfigProvider'

export interface ComponentStyle {
  width?: string | number
  height?: string | number
  padding?: string | number
  margin?: string | number
  background?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  opacity?: number
  transform?: string
  transition?: string
  animation?: string
  cursor?: string
  display?: string
  flexDirection?: string
  justifyContent?: string
  alignItems?: string
  gap?: string | number
  flexWrap?: string
  position?: string
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  zIndex?: number
  overflow?: string
  textOverflow?: string
  whiteSpace?: string
  wordBreak?: string
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  textAlign?: string
  textDecoration?: string
  textTransform?: string
  color?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  borderStyle?: string
  borderWidth?: string | number
  borderColor?: string
  outline?: string
  outlineOffset?: string | number
  filter?: string
  backdropFilter?: string
  mixBlendMode?: string
  isolation?: string
  clipPath?: string
}

// ===== Style Specification =====
export interface StyleSpec {
  tokens: DesignTokens
  theme: ThemeSpec
  components: ComponentStyleSpec
}

export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  borderRadius: BorderRadiusTokens
  shadows: ShadowTokens
  transitions: TransitionTokens
}

export interface ColorTokens {
  primary: ColorScale
  secondary: ColorScale
  success: ColorScale
  warning: ColorScale
  error: ColorScale
  neutral: ColorScale
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export interface SpacingTokens {
  0: string
  1: string
  2: string
  3: string
  4: string
  5: string
  6: string
  8: string
  10: string
  12: string
  16: string
  20: string
  24: string
}

export interface TypographyTokens {
  fontFamily: {
    sans: string[]
    mono: string[]
  }
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  lineHeight: Record<string, number>
}

export interface BorderRadiusTokens {
  none: string
  sm: string
  base: string
  md: string
  lg: string
  xl: string
  '2xl': string
  full: string
}

export interface ShadowTokens {
  xs: string
  sm: string
  base: string
  md: string
  lg: string
  xl: string
}

export interface TransitionTokens {
  fast: string
  normal: string
  slow: string
}

export interface ThemeSpec {
  name: string
  mode: 'light' | 'dark'
  colors: ThemeColors
}

export interface ThemeColors {
  background: string
  foreground: string
  primary: string
  secondary: string
  accent: string
  muted: string
  border: string
  input: string
  ring: string
}

export interface ComponentStyleSpec {
  [componentName: string]: ComponentStyle
}

// ===== IDE Layout Types =====
export type LayoutMode = 'edit' | 'preview'

export interface IDELayoutState {
  layoutMode: LayoutMode
  fullscreenPreview: boolean
  leftWidthPercent: number
  middleRatioPercent: number
  terminalVisible: boolean
  terminalHeight: number
  selectedFile: string
  searchQuery: string
}

// ===== Terminal Constants =====
export const TERMINAL_HEIGHT_MIN = 100
export const TERMINAL_HEIGHT_MAX = 500
/** 左栏宽度范围 (% of total) */
export const LEFT_WIDTH_MIN = 15
export const LEFT_WIDTH_MAX = 50
/** 中栏宽度范围 (% of remaining = total - left) */
export const MIDDLE_RATIO_MIN = 20
export const MIDDLE_RATIO_MAX = 80
/** 默认三栏比例: 35% / 30% / 35% → middleRatio = 30/65 ≈ 46.15 */
export const DEFAULT_LEFT_WIDTH = 35
export const DEFAULT_MIDDLE_RATIO = 46
export const DEFAULT_TERMINAL_HEIGHT = 220

// ===== File Tree Types =====
export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  ext?: string
}

// ===== Chat Types =====
export type MessageStatus = 'streaming' | 'complete' | 'error' | 'retrying'
export type FeedbackType = 'positive' | 'negative' | null

export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  timestamp?: string
  modelId?: string
  latencyMs?: number
  status?: MessageStatus
  feedback?: FeedbackType
  tokenUsage?: TokenUsage
}