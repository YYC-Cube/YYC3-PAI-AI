/**
 * @file monaco.ts
 * @description Monaco Editor类型定义，避免使用any
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags types,monaco,editor
 */

import type * as monaco from 'monaco-editor'

// Monaco Editor实例类型
export type MonacoEditorInstance = monaco.editor.IStandaloneCodeEditor
export type MonacoNamespace = typeof monaco

// 装饰项类型（用于协作光标等）
export interface MonacoDecoration {
  range: monaco.IRange
  options: monaco.editor.IModelDecorationOptions
}

// 协作光标装饰
export interface CollaboratorCursorDecoration {
  userId: string
  userName: string
  color: string
  cursor: { line: number; col: number }
  selection?: { startLine: number; startCol: number; endLine: number; endCol: number }
}

// 位置事件
export type CursorPositionEvent = monaco.editor.ICursorPositionChangedEvent
export type CursorSelectionEvent = monaco.editor.ICursorSelectionChangedEvent

// 编辑器选项
export interface EditorOptions {
  minimap?: { enabled: boolean }
  automaticLayout?: boolean
  fontSize?: number
  fontFamily?: string
  theme?: string
  wordWrap?: 'on' | 'off' | 'wordWrapColumn'
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  scrollBeyondLastLine?: boolean
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'trailing'
  formatOnPaste?: boolean
  formatOnType?: boolean
}

// 代码动作提供者
export type CodeActionProvider = monaco.languages.CodeActionProvider

// 自动补全提供者
export type CompletionItemProvider = monaco.languages.CompletionItemProvider

// 内联补全提供者
export type InlineCompletionProvider = monaco.languages.InlineCompletionsProvider

// 悬停提供者
export type HoverProvider = monaco.languages.HoverProvider
