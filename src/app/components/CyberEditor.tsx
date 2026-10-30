/**
 * @file CyberEditor.tsx
 * @description 赛博编辑器组件，提供代码编辑功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags editor,code,ui,component
 */

import type { EditorProps } from '@monaco-editor/react'
import { AlertTriangle, Code } from 'lucide-react'
import { Component, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { useCursorThrottle } from '../services/collaboration-cursor-throttle'
import { useCollabStore, type CollabUser } from '../store/collab-store'
import { useEditorPrefs } from '../store/editor-prefs-store'
import { useThemeStore } from '../store/theme-store'
import type { CursorPositionEvent, CursorSelectionEvent, MonacoDecoration, MonacoEditorInstance, MonacoNamespace } from '../types/monaco'
import { createLogger } from '../utils/logger'

const logger = createLogger('CyberEditor')

// Clean Modern theme for Monaco
const CLEAN_THEME_DATA = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8b5cf6' },
    { token: 'string', foreground: '059669' },
    { token: 'number', foreground: 'dc2626' },
    { token: 'type', foreground: '2563eb', fontStyle: 'italic' },
    { token: 'function', foreground: '7c3aed' },
    { token: 'variable', foreground: '1a1a2e' },
    { token: 'constant', foreground: 'dc2626' },
    { token: 'operator', foreground: '8b5cf6' },
    { token: 'delimiter', foreground: '6b7280' },
    { token: 'tag', foreground: '8b5cf6' },
    { token: 'attribute.name', foreground: '2563eb' },
    { token: 'attribute.value', foreground: '059669' },
    { token: 'regexp', foreground: 'dc2626' },
  ],
  colors: {
    'editor.background': '#fafafa',
    'editor.foreground': '#1a1a2e',
    'editor.lineHighlightBackground': '#3b82f608',
    'editor.selectionBackground': '#3b82f625',
    'editor.inactiveSelectionBackground': '#3b82f610',
    'editorCursor.foreground': '#3b82f6',
    'editorLineNumber.foreground': '#3b82f630',
    'editorLineNumber.activeForeground': '#3b82f680',
    'editorIndentGuide.background': '#00000008',
    'editorIndentGuide.activeBackground': '#00000015',
    'editor.selectionHighlightBackground': '#3b82f615',
    'editorBracketMatch.background': '#3b82f615',
    'editorBracketMatch.border': '#3b82f640',
    'editorGutter.background': '#fafafa',
    'editorWidget.background': '#ffffff',
    'editorWidget.border': '#00000010',
    'editorSuggestWidget.background': '#ffffff',
    'editorSuggestWidget.border': '#00000010',
    'editorSuggestWidget.selectedBackground': '#3b82f610',
    'editorSuggestWidget.highlightForeground': '#3b82f6',
    'editorHoverWidget.background': '#ffffff',
    'editorHoverWidget.border': '#00000010',
    'scrollbarSlider.background': '#00000010',
    'scrollbarSlider.hoverBackground': '#00000020',
    'scrollbarSlider.activeBackground': '#00000030',
    'minimap.background': '#fafafa',
    'minimapSlider.background': '#00000008',
    'minimapSlider.hoverBackground': '#00000015',
    'editorOverviewRuler.border': '#00000008',
  },
}

// ===== Error Boundary for Monaco =====
class MonacoErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: Error) {
    logger.warn('[CyberEditor] Monaco failed to load:', err.message)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

// Define cyberpunk dark theme for Monaco
const CYBER_THEME_DATA = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '00f0ff', fontStyle: 'italic', background: '0a0a0a55' },
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'string', foreground: 'f1fa8c' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
    { token: 'function', foreground: '50fa7b' },
    { token: 'variable', foreground: 'e0e0e0' },
    { token: 'constant', foreground: 'bd93f9' },
    { token: 'operator', foreground: 'ff79c6' },
    { token: 'delimiter', foreground: '888888' },
    { token: 'tag', foreground: 'ff79c6' },
    { token: 'attribute.name', foreground: '50fa7b' },
    { token: 'attribute.value', foreground: 'f1fa8c' },
    { token: 'regexp', foreground: 'ff5555' },
  ],
  colors: {
    'editor.background': '#0a0a0a',
    'editor.foreground': '#e0e0e0',
    'editor.lineHighlightBackground': '#00f0ff08',
    'editor.selectionBackground': '#00f0ff25',
    'editor.inactiveSelectionBackground': '#00f0ff10',
    'editorCursor.foreground': '#00f0ff',
    'editorLineNumber.foreground': '#00f0ff30',
    'editorLineNumber.activeForeground': '#00f0ff80',
    'editorIndentGuide.background': '#00f0ff10',
    'editorIndentGuide.activeBackground': '#00f0ff25',
    'editor.selectionHighlightBackground': '#00f0ff15',
    'editorBracketMatch.background': '#00f0ff15',
    'editorBracketMatch.border': '#00f0ff40',
    'editorGutter.background': '#0a0a0a',
    'editorWidget.background': '#111111',
    'editorWidget.border': '#00f0ff30',
    'editorSuggestWidget.background': '#0d0d0d',
    'editorSuggestWidget.border': '#00f0ff20',
    'editorSuggestWidget.selectedBackground': '#00f0ff15',
    'editorSuggestWidget.highlightForeground': '#00f0ff',
    'editorHoverWidget.background': '#0d0d0d',
    'editorHoverWidget.border': '#00f0ff20',
    'scrollbarSlider.background': '#00f0ff15',
    'scrollbarSlider.hoverBackground': '#00f0ff25',
    'scrollbarSlider.activeBackground': '#00f0ff35',
    'minimap.background': '#0a0a0a',
    'minimapSlider.background': '#00f0ff10',
    'minimapSlider.hoverBackground': '#00f0ff20',
    'editorOverviewRuler.border': '#00f0ff10',
  },
}

// Language detection from file extension
function getLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript', jsx: 'javascript', js: 'javascript',
    css: 'css', json: 'json', html: 'html', md: 'markdown', py: 'python',
  }
  return map[ext] || 'typescript'
}

// ===== Collaborative cursor decorations =====
function buildCollabDecorations(
  remoteUsers: CollabUser[],
  editor: MonacoEditorInstance | null,
  monaco: MonacoNamespace | null,
): MonacoDecoration[] {
  if (!editor || !monaco) return []
  const decorations: MonacoDecoration[] = []
  for (const user of remoteUsers) {
    if (user.status === 'away') continue
    const lineCount = editor.getModel()?.getLineCount() || 1
    const line = Math.min(user.cursor.line, lineCount)
    const col = Math.min(user.cursor.col + 1, 200)

    // Cursor line decoration
    decorations.push({
      range: new monaco.Range(line, col, line, col + 1),
      options: {
        className: `collab-cursor-${user.id}`,
        beforeContentClassName: `collab-cursor-marker-${user.id}`,
        stickiness: 1,
      },
    })

    // Selection decoration
    if (user.selection) {
      const startLine = Math.min(user.selection.startLine, lineCount)
      const endLine = Math.min(user.selection.endLine, lineCount)
      decorations.push({
        range: new monaco.Range(startLine, user.selection.startCol + 1, endLine, user.selection.endCol + 1),
        options: {
          className: `collab-selection-${user.id}`,
          stickiness: 1,
        },
      })
    }
  }
  return decorations
}

// ===== Fallback plain text editor =====
function FallbackEditor({
  code, fileName, onChange, readOnly,
}: { code: string; fileName: string; onChange?: (v: string) => void; readOnly: boolean }) {
  const { tokens } = useThemeStore()
  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: tokens.background }}>
      <div className="flex items-center gap-2 px-3 py-1.5" style={{
        borderBottom: `1px solid ${tokens.borderDim}`,
        background: tokens.panelBg,
      }}>
        <Code size={12} color={tokens.primary} />
        <span style={{ fontFamily: tokens.fontMono, fontSize: '10px', color: tokens.foregroundMuted }}>
          {fileName}
        </span>
        <span className="ml-auto flex items-center gap-1" style={{ fontFamily: tokens.fontMono, fontSize: '9px', color: tokens.warning }}>
          <AlertTriangle size={10} /> Monaco unavailable — fallback mode
        </span>
      </div>
      <textarea
        value={code}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="flex-1 w-full resize-none outline-none p-3"
        style={{
          fontFamily: tokens.fontMono,
          fontSize: '13px',
          lineHeight: '20px',
          letterSpacing: '0.5px',
          background: tokens.background,
          color: tokens.foreground,
          border: 'none',
          tabSize: 2,
        }}
      />
    </div>
  )
}

// ===== Props =====
interface CyberEditorProps {
  code: string
  fileName: string
  onChange?: (value: string) => void
  readOnly?: boolean
  /** Callback when user selects text — provides selected text and cursor position */
  onSelectionChange?: (selection: { text: string; startLine: number; endLine: number } | null) => void
}

/** Imperative handle exposed via ref for external code insertion */
export interface CyberEditorHandle {
  /** Insert text at the current cursor position in the Monaco editor */
  insertAtCursor: (text: string) => void
  /** Focus the editor */
  focus: () => void
  /** Replace current selection with new text */
  replaceSelection: (text: string) => void
}

export const CyberEditor = forwardRef<CyberEditorHandle, CyberEditorProps>(function CyberEditor(
  { code, fileName, onChange, readOnly = false, onSelectionChange },
  ref,
) {
  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const monacoRef = useRef<MonacoNamespace | null>(null)
  const collab = useCollabStore()
  const { tokens, isCyberpunk } = useThemeStore()
  const { prefs: editorPrefs } = useEditorPrefs()
  const [editorReady, setEditorReady] = useState(false)
  const [MonacoEditor, setMonacoEditor] = useState<React.ComponentType<EditorProps> | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const language = useMemo(() => getLanguage(fileName), [fileName])
  const remoteUsers = useMemo(() => collab.getRemoteUsers(), [collab])
  const monacoTheme = isCyberpunk ? 'cyberpunk-dark' : 'clean-modern'

  // Dynamically import Monaco to prevent top-level import failures
  useEffect(() => {
    let cancelled = false
    // 先装本地 monaco（loader.config + workers，终结 CDN 依赖），再取 React 包装
    import('../services/monaco-setup')
      .then(() => import('@monaco-editor/react'))
      .then((mod) => {
        if (!cancelled) setMonacoEditor(() => mod.default)
      })
      .catch((err) => {
        logger.warn('[CyberEditor] Failed to load Monaco:', err)
        if (!cancelled) setLoadFailed(true)
      })
    return () => { cancelled = true }
  }, [])

  // Handle editor mount
  const handleMount = useCallback((editor: MonacoEditorInstance, monaco: MonacoNamespace) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Register both themes
    monaco.editor.defineTheme('cyberpunk-dark', CYBER_THEME_DATA)
    monaco.editor.defineTheme('clean-modern', CLEAN_THEME_DATA)
    monaco.editor.setTheme(monacoTheme)

    // Inject collaborative cursor CSS
    const styleEl = document.createElement('style')
    styleEl.id = 'collab-cursors-css'
    const existingStyle = document.getElementById('collab-cursors-css')
    if (existingStyle) existingStyle.remove()

    const cursorCSS = remoteUsers.map((user) => `
      .collab-cursor-marker-${user.id}::before {
        content: '${user.name}';
        position: absolute;
        top: -16px;
        left: 0;
        font-family: ${tokens.fontMono};
        font-size: 9px;
        color: #0a0a0a;
        background: ${user.color};
        padding: 0 4px;
        border-radius: 2px;
        line-height: 14px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 0 6px ${user.color}44;
      }
      .collab-cursor-${user.id} {
        border-left: 2px solid ${user.color};
        box-shadow: 0 0 4px ${user.color}44;
      }
      .collab-selection-${user.id} {
        background: ${user.color}15;
        border: 1px solid ${user.color}20;
      }
    `).join('\n')
    styleEl.textContent = cursorCSS
    document.head.appendChild(styleEl)

    setEditorReady(true)

    // Track local cursor for collab
    editor.onDidChangeCursorPosition((e: CursorPositionEvent) => {
      if (collab.enabled) {
        collab.pushLocalOp('cursor_move', e.position.lineNumber, e.position.column - 1)
      }
    })

    // Track selection change for Quick Actions (对齐 Guidelines: P1-AI-quick-actions)
    editor.onDidChangeCursorSelection((_e: CursorSelectionEvent) => {
      if (!onSelectionChange) return
      const selection = editor.getSelection()
      if (!selection || selection.isEmpty()) {
        onSelectionChange(null)
        return
      }
      const selectedText = editor.getModel()?.getValueInRange(selection) || ''
      if (selectedText.trim().length > 0) {
        onSelectionChange({
          text: selectedText,
          startLine: selection.startLineNumber,
          endLine: selection.endLineNumber,
        })
      } else {
        onSelectionChange(null)
      }
    })
  }, [remoteUsers, collab, monacoTheme, tokens.fontMono, onSelectionChange])

  // Switch Monaco theme dynamically when theme store changes
  useEffect(() => {
    const monaco = monacoRef.current
    if (monaco && editorReady) {
      monaco.editor.setTheme(monacoTheme)
    }
  }, [monacoTheme, editorReady])

  // Sync editor preferences to Monaco at runtime (no remount needed)
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !editorReady) return
    editor.updateOptions({
      fontSize: editorPrefs.fontSize,
      lineHeight: Math.round(editorPrefs.fontSize * 1.54),
      tabSize: editorPrefs.tabSize,
      wordWrap: editorPrefs.wordWrap ? 'on' : 'off',
      minimap: { enabled: editorPrefs.minimap, renderCharacters: false, maxColumn: 80 },
      lineNumbers: editorPrefs.lineNumbers ? 'on' : 'off',
      bracketPairColorization: { enabled: editorPrefs.bracketPairs },
      guides: { indentation: true, bracketPairs: editorPrefs.bracketPairs },
    })
  }, [editorPrefs, editorReady])

  // Expose imperative handle for external consumers (e.g. snippet insertion)
  useImperativeHandle(ref, () => ({
    insertAtCursor(text: string) {
      const editor = editorRef.current
      const monaco = monacoRef.current
      if (!editor || !monaco) {
        // Fallback: append to end via onChange
        onChange?.(code + '\n' + text)
        return
      }
      const position = editor.getPosition()
      if (!position) {
        onChange?.(code + '\n' + text)
        return
      }
      // Use executeEdits to insert at cursor and move cursor after insertion
      const range = new monaco.Range(
        position.lineNumber, position.column,
        position.lineNumber, position.column,
      )
      editor.executeEdits('snippet-insert', [{
        range,
        text,
        forceMoveMarkers: true,
      }])
      editor.focus()
      // Trigger onChange with new value
      const newValue = editor.getValue()
      if (newValue !== undefined) onChange?.(newValue)
    },
    focus() {
      editorRef.current?.focus()
    },
    replaceSelection(text: string) {
      const editor = editorRef.current
      const monaco = monacoRef.current
      if (!editor || !monaco) {
        // Fallback: append to end via onChange
        onChange?.(code + '\n' + text)
        return
      }
      const selection = editor.getSelection()
      if (!selection) {
        onChange?.(code + '\n' + text)
        return
      }
      // Use executeEdits to replace selection and move cursor after insertion
      editor.executeEdits('snippet-insert', [{
        range: selection,
        text,
        forceMoveMarkers: true,
      }])
      editor.focus()
      // Trigger onChange with new value
      const newValue = editor.getValue()
      if (newValue !== undefined) onChange?.(newValue)
    },
  }), [code, onChange])

  // Handle code change
  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined && onChange) {
      onChange(value)
      // Push local edit op
      const editor = editorRef.current
      if (editor && collab.enabled) {
        const pos = editor.getPosition()
        if (pos) {
          collab.pushLocalOp('insert', pos.lineNumber, pos.column - 1, value.slice(-20))
        }
      }
    }
  }, [onChange, collab])

  // ===== Q2-01: 协作光标节流优化 =====
  // 使用节流服务优化decorations更新频率（100ms）
  const throttleRef = useCursorThrottle({ throttleMs: 100, leading: true, trailing: true })

  // Update collaborative cursor decorations
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco || !editorReady) return

    const newDecorations = buildCollabDecorations(remoteUsers, editor, monaco)
    // 使用节流更新，避免频繁重绘
    throttleRef.update(editor, newDecorations)
  }, [remoteUsers, editorReady, collab.operations, throttleRef])

  // Initialize collab simulation
  useEffect(() => {
    collab.init()
    return () => collab.destroy()
  }, [collab])

  // Show fallback if Monaco failed to load
  if (loadFailed) {
    return <FallbackEditor code={code} fileName={fileName} onChange={onChange} readOnly={readOnly} />
  }

  // Show loading while Monaco is being imported
  if (!MonacoEditor) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: tokens.background }}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full" style={{ border: `2px solid ${tokens.borderDim}`, borderTopColor: tokens.primary, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontFamily: tokens.fontMono, fontSize: '10px', color: tokens.foregroundMuted, letterSpacing: '1px' }}>
            LOADING EDITOR...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden relative" style={{ background: tokens.background }}>
      <MonacoErrorBoundary fallback={<FallbackEditor code={code} fileName={fileName} onChange={onChange} readOnly={readOnly} />}>
        <MonacoEditor
          language={language}
          value={code}
          onChange={handleChange}
          theme={monacoTheme}
          beforeMount={(monaco: MonacoNamespace) => {
            monaco.editor.defineTheme('cyberpunk-dark', CYBER_THEME_DATA)
            monaco.editor.defineTheme('clean-modern', CLEAN_THEME_DATA)
          }}
          onMount={handleMount}
          options={{
            readOnly,
            fontFamily: tokens.fontMono,
            fontSize: editorPrefs.fontSize,
            lineHeight: Math.round(editorPrefs.fontSize * 1.54),
            letterSpacing: 0.5,
            minimap: {
              enabled: editorPrefs.minimap,
              renderCharacters: false,
              maxColumn: 80,
            },
            lineNumbers: editorPrefs.lineNumbers ? 'on' : 'off',
            wordWrap: editorPrefs.wordWrap ? 'on' : 'off',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: editorPrefs.bracketPairs },
            guides: {
              indentation: true,
              bracketPairs: editorPrefs.bracketPairs,
            },
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'mouseover',
            padding: { top: 8, bottom: 8 },
            overviewRulerLanes: 2,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: 'currentDocument',
            tabSize: editorPrefs.tabSize,
            automaticLayout: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full" style={{ background: tokens.background }}>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full" style={{ border: `2px solid ${tokens.borderDim}`, borderTopColor: tokens.primary, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: tokens.fontMono, fontSize: '10px', color: tokens.foregroundMuted, letterSpacing: '1px' }}>
                  LOADING EDITOR...
                </p>
              </div>
            </div>
          }
        />
      </MonacoErrorBoundary>

      {/* Collaborative user indicators — bottom-right overlay */}
      {collab.enabled && remoteUsers.length > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1" style={{ zIndex: 5 }}>
          {remoteUsers.filter((u) => u.status !== 'away').map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                background: `${user.color}15`,
                border: `1px solid ${user.color}30`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: user.color, boxShadow: `0 0 3px ${user.color}` }} />
              <span style={{ fontFamily: tokens.fontMono, fontSize: '8px', color: user.color }}>
                {user.name}
              </span>
              <span style={{ fontFamily: tokens.fontMono, fontSize: '7px', color: `${user.color}80` }}>
                L{user.cursor.line}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
