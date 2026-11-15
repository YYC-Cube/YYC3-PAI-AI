/**
 * @file RichTextEditor.tsx
 * @description 富文本AI编辑器 — TipTap扩展 + AI改写/扩写/翻译/续写
 * 选中内容后通过AI气泡菜单进行智能处理
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [component],[editor],[tiptap],[ai],[rich-text]
 */

import { Image as ImageExt } from '@tiptap/extension-image'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { StarterKit } from '@tiptap/starter-kit'
import {
  Bold,
  ChevronDown,
  Edit3,
  Globe,
  Heading1 as H1,
  Heading2 as H2,
  Heading3 as H3,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo,
  Sparkles,
  Undo,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useModelStore } from '../store/model-store'
import { useThemeStore } from '../store/theme-store'

// ── Types ──

export interface RichTextEditorProps {
  initialContent?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: string
  maxHeight?: string
  /** 是否显示AI工具按钮（默认true） */
  enableAI?: boolean
}

type AIAction = 'rewrite' | 'expand' | 'summarize' | 'translate' | 'continue' | 'polish'

interface AIActionConfig {
  id: AIAction
  label: string
  icon: typeof Sparkles
  prompt: string
  description: string
}

const AI_ACTIONS: AIActionConfig[] = [
  {
    id: 'rewrite',
    label: '改写',
    icon: Edit3,
    description: '保持原意，优化表达方式',
    prompt: '请改写以下文本，保持原意不变但优化表达方式，使其更流畅、专业。直接返回改写后的文本，不要附加任何说明。',
  },
  {
    id: 'polish',
    label: '润色',
    icon: Sparkles,
    description: '修正语法，改善措辞',
    prompt: '请润色以下文本，修正语法错误和不通顺之处，改善措辞。直接返回润色后的文本。',
  },
  {
    id: 'expand',
    label: '扩写',
    icon: ChevronDown,
    description: '丰富细节，扩展内容',
    prompt: '请扩写以下文本，增加更多细节、例子或论据，使内容更加充实。直接返回扩写后的文本。',
  },
  {
    id: 'summarize',
    label: '摘要',
    icon: List,
    description: '提取要点，精简内容',
    prompt: '请为以下文本生成简洁的摘要，提取核心要点。直接返回摘要文本。',
  },
  {
    id: 'translate',
    label: '翻译',
    icon: Globe,
    description: '翻译为英文/中文',
    prompt: '请将以下文本翻译为{lang}。直接返回翻译结果，不要附加任何说明。',
  },
  {
    id: 'continue',
    label: '续写',
    icon: Quote,
    description: 'AI继续写作',
    prompt: '请基于以下文本继续写作，保持风格一致。直接返回续写内容，不要重复原文。',
  },
]

// ── Component ──

export function RichTextEditor({
  initialContent = '',
  onChange,
  placeholder: _placeholder,
  minHeight = '200px',
  maxHeight = '600px',
  enableAI = true,
}: RichTextEditorProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { sendToActiveModel, getActiveModel } = useModelStore()

  // ── State ──
  const [aiMenuOpen, setAIMenuOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState<AIAction | null>(null)
  const [translateLang, setTranslateLang] = useState<'en' | 'zh'>('en')
  const [error, setError] = useState<string | null>(null)
  const [showLangPicker, setShowLangPicker] = useState(false)

  const prevContentRef = useRef<string>('')
  const editorRef = useRef<HTMLDivElement>(null)

  // ── Editor ──
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ImageExt.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose prose-sm max-w-none',
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; padding: 16px;`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  // ── Check if text is selected ──
  const hasSelection = (editor?.state.selection.content().size ?? 0) > 0
  const selectedText = editor?.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
  ) ?? ''

  // ── Handle AI Action ──
  const handleAIAction = useCallback(async (action: AIAction) => {
    if (!editor || !selectedText.trim()) return

    const activeModel = getActiveModel()
    if (!activeModel) {
      setError('请先在模型设置中激活一个AI模型')
      return
    }

    const config = AI_ACTIONS.find(a => a.id === action)
    if (!config) return

    setProcessingAction(action)
    setError(null)

    // Save current content for undo
    prevContentRef.current = editor.getHTML()

    try {
      let promptText = config.prompt
      if (action === 'translate') {
        const langName = translateLang === 'en' ? 'English' : '中文'
        promptText = config.prompt.replace('{lang}', langName)
      }

      const fullPrompt = `${promptText}\n\n---\n${selectedText}`
      const result = await sendToActiveModel(fullPrompt, {
        systemPrompt: '你是一个专业的写作助手。请严格按照用户要求处理文本，只返回处理结果，不附加任何说明或元信息。',
      })

      // Replace selection with AI result
      const cleanResult = result.replace(/^["']|["']$/g, '').trim()
      editor.chain().focus().deleteSelection().insertContent(cleanResult).run()

      // Trigger onChange
      onChange?.(editor.getHTML())
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI处理失败'
      setError(msg)
    } finally {
      setProcessingAction(null)
      setAIMenuOpen(false)
    }
  }, [editor, selectedText, sendToActiveModel, getActiveModel, onChange, translateLang])

  // ── Undo AI change ──
  const undoAIChange = useCallback(() => {
    if (prevContentRef.current && editor) {
      editor.commands.setContent(prevContentRef.current)
      prevContentRef.current = ''
      onChange?.(editor.getHTML())
    }
  }, [editor, onChange])

  // ── Formatting Commands ──
  const toolbarItems = useMemo(() => [
    { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold'), label: '加粗' },
    { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic'), label: '斜体' },
    { icon: H1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive('heading', { level: 1 }), label: '标题1' },
    { icon: H2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive('heading', { level: 2 }), label: '标题2' },
    { icon: H3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive('heading', { level: 3 }), label: '标题3' },
    { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList'), label: '无序列表' },
    { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList'), label: '有序列表' },
    { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive('blockquote'), label: '引用' },
  ], [editor])

  // ── Styles ──
  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px',
    borderRadius: '6px',
    fontSize: '11px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: tk.fontBody,
    background: 'transparent',
  }

  return (
    <div
      className="rich-text-editor"
      ref={editorRef}
      style={{
        borderRadius: '8px',
        border: `1px solid ${tk.borderDim}`,
        overflow: 'hidden',
        background: isCyberpunk ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap"
        style={{
          borderColor: tk.borderDim,
          background: isCyberpunk ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.04)',
        }}
      >
        {/* Formatting */}
        {toolbarItems.map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            title={item.label}
            style={{
              ...btnBase,
              color: item.active ? tk.primary : tk.foregroundMuted,
              background: item.active
                ? (isCyberpunk ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.08)')
                : 'transparent',
            }}
          >
            <item.icon size={14} />
          </button>
        ))}

        <div className="w-px h-5 mx-1" style={{ background: tk.borderDim }} />

        {/* Undo / Redo */}
        <button
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          style={{ ...btnBase, color: tk.foregroundMuted, opacity: editor?.can().undo() ? 1 : 0.3 }}
          title="撤销"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          style={{ ...btnBase, color: tk.foregroundMuted, opacity: editor?.can().redo() ? 1 : 0.3 }}
          title="重做"
        >
          <Redo size={14} />
        </button>

        {/* AI Tools */}
        {enableAI && (
          <>
            <div className="w-px h-5 mx-1" style={{ background: tk.borderDim }} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAIMenuOpen(v => !v)}
                style={{
                  ...btnBase,
                  padding: '6px 12px',
                  background: aiMenuOpen
                    ? tk.primary
                    : (isCyberpunk ? 'rgba(0,240,255,0.05)' : 'rgba(0,240,255,0.04)'),
                  color: aiMenuOpen ? tk.background : tk.primary,
                  border: `1px solid ${aiMenuOpen ? tk.primary : tk.primary + '33'}`,
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={12} />
                AI 写作
              </button>

              {/* AI Dropdown Menu */}
              {aiMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    minWidth: '180px',
                    background: isCyberpunk ? '#111' : '#fff',
                    border: `1px solid ${tk.borderDim}`,
                    borderRadius: '8px',
                    boxShadow: `0 8px 24px ${isCyberpunk ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}`,
                    zIndex: 100,
                    padding: '4px',
                  }}
                >
                  <div style={{ padding: '6px 8px', fontSize: '9px', color: tk.foregroundMuted, fontFamily: tk.fontMono }}>
                    AI 文本操作
                  </div>
                  {AI_ACTIONS.map(action => (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.id === 'translate') {
                          setShowLangPicker(true)
                          return
                        }
                        handleAIAction(action.id)
                      }}
                      disabled={processingAction !== null || !hasSelection || !selectedText.trim()}
                      style={{
                        ...btnBase,
                        width: '100%',
                        padding: '8px',
                        justifyContent: 'flex-start',
                        gap: '8px',
                        opacity: !hasSelection ? 0.4 : 1,
                        cursor: !hasSelection ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        color: tk.foreground,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = isCyberpunk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <action.icon size={13} color={tk.primary} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '11px' }}>{action.label}</div>
                        <div style={{ fontSize: '9px', color: tk.foregroundMuted }}>{action.description}</div>
                      </div>
                    </button>
                  ))}

                  {/* Lang picker for translate */}
                  {showLangPicker && (
                    <div style={{ borderTop: `1px solid ${tk.borderDim}`, padding: '6px', marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: tk.foregroundMuted, marginBottom: '4px' }}>目标语言</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['en', 'zh'] as const).map(lang => (
                          <button
                            key={lang}
                            onClick={() => {
                              setTranslateLang(lang)
                              setShowLangPicker(false)
                              setTimeout(() => handleAIAction('translate'), 100)
                            }}
                            style={{
                              ...btnBase,
                              flex: 1,
                              padding: '4px 8px',
                              background: translateLang === lang ? tk.primary : 'transparent',
                              color: translateLang === lang ? tk.background : tk.foreground,
                              fontSize: '10px',
                            }}
                          >
                            {lang === 'en' ? 'English' : '中文'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Processing indicator */}
            {processingAction && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: '8px',
                  fontSize: '10px',
                  color: tk.primary,
                  fontFamily: tk.fontMono,
                }}
              >
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                {AI_ACTIONS.find(a => a.id === processingAction)?.label}中...
              </div>
            )}

            {/* Undo AI button */}
            {prevContentRef.current && (
              <button
                onClick={undoAIChange}
                style={{
                  ...btnBase,
                  marginLeft: '4px',
                  color: tk.warning,
                  fontSize: '10px',
                }}
              >
                <X size={12} />
                撤销AI修改
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Error message ── */}
      {error && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '11px',
            color: '#ff3333',
            background: 'rgba(255,50,50,0.06)',
            borderBottom: '1px solid rgba(255,50,50,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ ...btnBase, color: '#ff3333', padding: '2px' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Editor Content ── */}
      <div
        style={{
          fontSize: '13px',
          lineHeight: '1.8',
          color: tk.foreground,
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* ── Bubble Menu (appears on text selection) ── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{
            placement: 'top',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '2px',
              padding: '4px',
              background: isCyberpunk ? '#1a1a1a' : '#f5f5f5',
              border: `1px solid ${tk.borderDim}`,
              borderRadius: '8px',
              boxShadow: `0 4px 12px ${isCyberpunk ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              style={{ ...btnBase, color: editor.isActive('bold') ? tk.primary : tk.foregroundMuted }}
            >
              <Bold size={12} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              style={{ ...btnBase, color: editor.isActive('italic') ? tk.primary : tk.foregroundMuted }}
            >
              <Italic size={12} />
            </button>
            <div className="w-px h-4 mx-0.5" style={{ background: tk.borderDim }} />
            {/* AI quick actions in bubble */}
            {enableAI && (
              <>
                <button
                  onClick={() => handleAIAction('polish')}
                  disabled={processingAction !== null}
                  style={{
                    ...btnBase,
                    color: tk.primary,
                    fontSize: '9px',
                    padding: '4px 6px',
                    opacity: processingAction ? 0.5 : 1,
                  }}
                  title="AI润色"
                >
                  <Sparkles size={11} />
                  润色
                </button>
                <button
                  onClick={() => handleAIAction('rewrite')}
                  disabled={processingAction !== null}
                  style={{
                    ...btnBase,
                    color: tk.primary,
                    fontSize: '9px',
                    padding: '4px 6px',
                    opacity: processingAction ? 0.5 : 1,
                  }}
                  title="AI改写"
                >
                  <Edit3 size={11} />
                  改写
                </button>
                <button
                  onClick={() => {
                    setTranslateLang(prev => prev === 'en' ? 'zh' : 'en')
                    setTimeout(() => handleAIAction('translate'), 100)
                  }}
                  disabled={processingAction !== null}
                  style={{
                    ...btnBase,
                    color: tk.accent || tk.primary,
                    fontSize: '9px',
                    padding: '4px 6px',
                    opacity: processingAction ? 0.5 : 1,
                  }}
                  title="AI翻译"
                >
                  <Globe size={11} />
                  {translateLang === 'en' ? '中→英' : '英→中'}
                </button>
              </>
            )}
          </div>
        </BubbleMenu>
      )}

      {/* ── Status Bar ── */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: `1px solid ${tk.borderDim}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: tk.foregroundMuted,
          fontFamily: tk.fontMono,
          background: isCyberpunk ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.03)',
        }}
      >
        <span>
          {editor?.storage.characterCount?.characters?.() ?? 0} 字
        </span>
        <span>
          {hasSelection ? `已选 ${selectedText.length} 字` : '选中文本后使用AI工具'}
        </span>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rich-text-editor .ProseMirror p { margin: 0.5em 0; }
        .rich-text-editor .ProseMirror h1 { font-size: 1.5em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .rich-text-editor .ProseMirror h2 { font-size: 1.3em; font-weight: 600; margin: 0.7em 0 0.3em; }
        .rich-text-editor .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; }
        .rich-text-editor .ProseMirror ul, .rich-text-editor .ProseMirror ol { padding-left: 1.5em; }
        .rich-text-editor .ProseMirror blockquote {
          border-left: 3px solid currentColor;
          padding-left: 1em;
          opacity: 0.8;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror th,
        .rich-text-editor .ProseMirror td {
          border: 1px solid currentColor;
          padding: 6px 10px;
          text-align: left;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .rich-text-editor .ProseMirror { outline: none; }
      `}</style>
    </div>
  )
}
