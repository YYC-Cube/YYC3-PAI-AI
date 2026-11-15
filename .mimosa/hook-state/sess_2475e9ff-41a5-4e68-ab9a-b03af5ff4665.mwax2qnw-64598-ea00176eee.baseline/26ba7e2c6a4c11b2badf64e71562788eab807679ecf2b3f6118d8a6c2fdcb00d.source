
/**
 * @file quick-actions-store.ts
 * @description 快速操作状态管理模块，管理AI快速操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags quick-actions,ai,state-management
 */

import { useSyncExternalStore } from 'react'
import { settingsActions } from './settings-store'

// ===== Type Definitions =====

/** 操作类型 */
export type ActionType =
  | 'copy' | 'copy-markdown' | 'copy-html'
  | 'replace' | 'refactor' | 'optimize' | 'format'
  | 'convert' | 'summarize' | 'translate' | 'rewrite' | 'expand' | 'correct'
  | 'explain' | 'test-generate' | 'document-generate' | 'add-comments' | 'find-issues'

/** 操作目标 */
export type ActionTarget = 'code' | 'text' | 'document' | 'file'

/** 操作状态 */
export type ActionStatus = 'idle' | 'processing' | 'success' | 'error'

/** 操作上下文 — 从编辑器 / 选区收集 */
export interface ActionContext {
  /** 选中文本 */
  selection: string
  /** 文件路径 */
  filePath?: string
  /** 文件语言 (tsx, ts, md, json...) */
  language?: string
  /** 完整文件内容 (用于上下文感知) */
  fullContent?: string
  /** 光标行号 */
  cursorLine?: number
}

/** 操作配置 */
export interface ActionConfig {
  type: ActionType
  params?: Record<string, string | number | boolean>
  /** 是否使用 AI (false = 纯本地操作) */
  useAI?: boolean
  /** 目标语言 (翻译用) */
  targetLang?: string
}

/** 操作结果 */
export interface ActionResult {
  success: boolean
  output?: string
  explanation?: string
  error?: string
  durationMs: number
}

/** 剪贴板历史项 */
export interface ClipboardItem {
  id: string
  content: string
  type: 'text' | 'code' | 'markdown' | 'html'
  language?: string
  sourceFile?: string
  copiedAt: number
  size: number
}

/** 操作定义 (注册表中) */
export interface ActionDefinition {
  id: ActionType
  target: ActionTarget[]
  requiresAI: boolean
  /** i18n key: quickActions.{labelKey} */
  labelKey: string
  /** Lucide icon name */
  icon: string
  /** 快捷键 (optional) */
  shortcut?: string
}

/** Store 快照 */
export interface QuickActionsState {
  /** 当前操作状态 */
  status: ActionStatus
  /** 当前执行的操作类型 */
  currentAction: ActionType | null
  /** 最后一次操作结果 */
  lastResult: ActionResult | null
  /** 剪贴板历史 (最近 50 条) */
  clipboardHistory: ClipboardItem[]
  /** 上下文感知推荐的操作列表 */
  recommendedActions: ActionType[]
}

// ===== Action Registry =====

/** 所有可用操作定义 */
export const ACTION_REGISTRY: ActionDefinition[] = [
  // === Code Operations ===
  { id: 'copy',              target: ['code', 'text'],     requiresAI: false, labelKey: 'copy',            icon: 'Copy' },
  { id: 'copy-markdown',     target: ['code'],             requiresAI: false, labelKey: 'copyMarkdown',    icon: 'FileCode' },
  { id: 'copy-html',         target: ['code'],             requiresAI: false, labelKey: 'copyHtml',        icon: 'Code2' },
  { id: 'replace',           target: ['code', 'text'],     requiresAI: true,  labelKey: 'replace',         icon: 'Replace' },
  { id: 'refactor',          target: ['code'],             requiresAI: true,  labelKey: 'refactor',        icon: 'RefreshCw' },
  { id: 'optimize',          target: ['code'],             requiresAI: true,  labelKey: 'optimize',        icon: 'Zap' },
  { id: 'format',            target: ['code'],             requiresAI: false, labelKey: 'format',          icon: 'AlignLeft' },
  { id: 'test-generate',     target: ['code'],             requiresAI: true,  labelKey: 'generateTests',   icon: 'TestTube2' },
  { id: 'document-generate', target: ['code'],             requiresAI: true,  labelKey: 'generateDocs',    icon: 'BookOpen' },
  // === Document Operations ===
  { id: 'convert',           target: ['document', 'text'], requiresAI: true,  labelKey: 'convert',         icon: 'ArrowRightLeft' },
  { id: 'summarize',         target: ['document', 'text'], requiresAI: true,  labelKey: 'summarize',       icon: 'ListCollapse' },
  // === Text Operations ===
  { id: 'translate',         target: ['text', 'code', 'document'], requiresAI: true,  labelKey: 'translate',  icon: 'Languages' },
  { id: 'rewrite',           target: ['text', 'document'], requiresAI: true,  labelKey: 'rewrite',         icon: 'PenLine' },
  { id: 'expand',            target: ['text', 'document'], requiresAI: true,  labelKey: 'expand',          icon: 'Maximize2' },
  { id: 'correct',           target: ['text', 'document'], requiresAI: true,  labelKey: 'correct',         icon: 'SpellCheck' },
  // === AI Operations ===
  { id: 'explain',           target: ['code'],             requiresAI: true,  labelKey: 'explain',         icon: 'HelpCircle' },
  { id: 'add-comments',      target: ['code'],             requiresAI: true,  labelKey: 'addComments',     icon: 'MessageSquarePlus' },
  { id: 'find-issues',       target: ['code'],             requiresAI: true,  labelKey: 'findIssues',      icon: 'Bug' },
]

// ===== Prompt Builders =====

/** 构建 AI 操作的系统提示词 (含 settings 规则注入) */
function buildSystemPrompt(role: string): string {
  const rulesInjection = settingsActions.getActiveRulesAsSystemPrompt()
  return rulesInjection ? `${role}\n\n---\n\n${rulesInjection}` : role
}

/** 构建操作 prompt */
function buildActionPrompt(action: ActionType, context: ActionContext, config: ActionConfig): { system: string; user: string } {
  const lang = context.language || 'text'
  const code = context.selection

  switch (action) {
    case 'replace':
      return {
        system: buildSystemPrompt('You are an expert programmer. Replace code according to instructions. Only output the replaced code.'),
        user: `Language: ${lang}\n\nOriginal Code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nInstructions: ${config.params?.instructions || 'Improve the code'}\n\nOnly output the replaced code, no explanations.`,
      }
    case 'refactor':
      return {
        system: buildSystemPrompt('You are an expert code refactoring specialist. Improve code quality and maintainability.'),
        user: `Language: ${lang}\n\nOriginal Code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nRefactoring Goals:\n- Improve readability\n- Reduce duplication\n- Apply design patterns\n- Enhance maintainability\n\nOnly output the refactored code, no explanations.`,
      }
    case 'optimize':
      return {
        system: buildSystemPrompt('You are an expert code optimizer. Optimize for performance and readability.'),
        user: `Language: ${lang}\n\nOriginal Code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nOptimize for:\n- Performance\n- Memory usage\n- Algorithmic efficiency\n\nProvide:\nOPTIMIZED_CODE:\n\`\`\`${lang}\n[optimized code]\n\`\`\`\n\nEXPLANATION:\n[explanation]`,
      }
    case 'format':
      return {
        system: buildSystemPrompt('You are an expert code formatter. Format code according to best practices.'),
        user: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nFormat according to best practices and conventions. Only output the formatted code.`,
      }
    case 'test-generate':
      return {
        system: buildSystemPrompt('You are an expert test engineer. Generate comprehensive test cases using Vitest.'),
        user: `Language: ${lang}\n\nCode to Test:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nGenerate comprehensive test cases including:\n- Unit tests\n- Edge cases\n- Error handling tests\n\nOnly output the test code.`,
      }
    case 'document-generate':
      return {
        system: buildSystemPrompt('You are an expert technical writer. Generate clear JSDoc/TSDoc documentation.'),
        user: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nGenerate documentation including:\n- Function/class descriptions\n- Parameters and return values\n- Usage examples\n\nFormat as Markdown.`,
      }
    case 'summarize':
      return {
        system: buildSystemPrompt('You are an expert document summarizer. Create clear and concise summaries.'),
        user: `Text:\n${code}\n\nCreate a summary including:\n- Main points\n- Key insights\n- Important details\n\nFormat as Markdown.`,
      }
    case 'translate':
      return {
        system: buildSystemPrompt('You are an expert translator. Translate accurately while maintaining tone and context.'),
        user: `Text:\n${code}\n\nTranslate to ${config.targetLang || 'English'}. Maintain tone, context, and meaning. Only output the translated text.`,
      }
    case 'rewrite':
      return {
        system: buildSystemPrompt('You are an expert writer. Rewrite for clarity, conciseness, and impact.'),
        user: `Text:\n${code}\n\n${config.params?.style ? `Style: ${config.params.style}\n` : ''}Rewrite for improved clarity and impact. Only output the rewritten text.`,
      }
    case 'expand':
      return {
        system: buildSystemPrompt('You are an expert writer. Expand text with relevant details and examples.'),
        user: `Text:\n${code}\n\nExpand with relevant details, examples, and explanations. Only output the expanded text.`,
      }
    case 'correct':
      return {
        system: buildSystemPrompt('You are an expert editor. Correct grammar, spelling, and punctuation errors.'),
        user: `Text:\n${code}\n\nCorrect any grammar, spelling, and punctuation errors. Maintain original meaning. Only output the corrected text.`,
      }
    case 'explain':
      return {
        system: buildSystemPrompt('You are an expert code educator. Explain code clearly and comprehensively.'),
        user: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nExplain this code including:\n- Overall purpose\n- Key components\n- How it works\n- Patterns used\n- Potential improvements\n\nFormat as Markdown.`,
      }
    case 'add-comments':
      return {
        system: buildSystemPrompt('You are an expert code commenter. Add clear and helpful comments.'),
        user: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nAdd comments including:\n- Function/class descriptions\n- Parameter explanations\n- Complex logic explanations\n\nOnly output the commented code.`,
      }
    case 'find-issues':
      return {
        system: buildSystemPrompt('You are an expert code reviewer. Identify bugs, security issues, and performance problems.'),
        user: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nIdentify issues:\n- Bugs and errors\n- Security vulnerabilities\n- Performance problems\n- Code smells\n\nFor each: type, severity, location, description, suggested fix.\nFormat as Markdown.`,
      }
    case 'convert':
      return {
        system: buildSystemPrompt('You are an expert document converter. Convert between formats accurately.'),
        user: `Text:\n${code}\n\nConvert to ${config.params?.toFormat || 'markdown'} format. Maintain all content. Only output the converted text.`,
      }
    default:
      return {
        system: buildSystemPrompt('You are YYC3 AI Code assistant.'),
        user: code,
      }
  }
}

// ===== State =====

const CLIPBOARD_LS_KEY = 'yyc3_clipboard_history'
const MAX_CLIPBOARD_ITEMS = 50

function loadClipboardHistory(): ClipboardItem[] {
  try {
    const raw = localStorage.getItem(CLIPBOARD_LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function persistClipboardHistory(items: ClipboardItem[]) {
  try { localStorage.setItem(CLIPBOARD_LS_KEY, JSON.stringify(items)) } catch { /* */ }
}

let state: QuickActionsState = {
  status: 'idle',
  currentAction: null,
  lastResult: null,
  clipboardHistory: loadClipboardHistory(),
  recommendedActions: [],
}

type Listener = () => void
const listeners = new Set<Listener>()
function emit() { for (const l of listeners) l() }
function subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l) }
function getSnapshot() { return state }

// ===== Context Analysis =====

/** 根据选中内容推断目标类型 */
function detectTarget(context: ActionContext): ActionTarget {
  const lang = context.language?.toLowerCase() || ''
  const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'css', 'scss', 'html', 'vue', 'svelte']
  const docExtensions = ['md', 'mdx', 'txt', 'rst', 'adoc']

  if (codeExtensions.some(e => lang.includes(e))) return 'code'
  if (docExtensions.some(e => lang.includes(e))) return 'document'

  // Heuristic: if contains braces/semicolons/imports, likely code
  const text = context.selection
  if (/^(import|export|const|let|var|function|class|interface|type)\s/m.test(text)) return 'code'
  if (/[{};]/.test(text) && text.split('\n').length > 2) return 'code'

  return 'text'
}

/** 根据上下文推荐可用操作 */
function computeRecommendedActions(context: ActionContext): ActionType[] {
  const target = detectTarget(context)
  const hasText = context.selection.trim().length > 0
  if (!hasText) return []

  return ACTION_REGISTRY
    .filter(def => def.target.includes(target))
    .map(def => def.id)
}

// ===== Actions =====

export const quickActionsStore = {
  /** 更新上下文 → 重新计算推荐操作 */
  updateContext(context: ActionContext) {
    const recommended = computeRecommendedActions(context)
    state = { ...state, recommendedActions: recommended }
    emit()
  },

  /** 清除选区 → 隐藏面板 */
  clearContext() {
    state = { ...state, recommendedActions: [], status: 'idle', currentAction: null }
    emit()
  },

  // ===== Clipboard Operations (本地，无需 AI) =====

  /** 复制文本到剪贴板 + 写入历史 */
  async copyToClipboard(text: string, opts?: { type?: ClipboardItem['type']; language?: string; sourceFile?: string }) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    const item: ClipboardItem = {
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content: text,
      type: opts?.type || 'text',
      language: opts?.language,
      sourceFile: opts?.sourceFile,
      copiedAt: Date.now(),
      size: text.length,
    }
    const history = [item, ...state.clipboardHistory].slice(0, MAX_CLIPBOARD_ITEMS)
    state = { ...state, clipboardHistory: history }
    persistClipboardHistory(history)
    emit()
    return item
  },

  /** 复制代码为 Markdown 格式 */
  async copyAsMarkdown(code: string, language?: string, sourceFile?: string) {
    const md = `\`\`\`${language || 'text'}\n${code}\n\`\`\``
    return quickActionsStore.copyToClipboard(md, { type: 'markdown', language, sourceFile })
  },

  /** 复制代码为 HTML 格式 */
  async copyAsHTML(code: string, language?: string, sourceFile?: string) {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const html = `<pre><code class="language-${language || 'text'}">${escaped}</code></pre>`
    return quickActionsStore.copyToClipboard(html, { type: 'html', language, sourceFile })
  },

  /** 从历史中粘贴 */
  async pasteFromHistory(itemId: string): Promise<string | null> {
    const item = state.clipboardHistory.find(i => i.id === itemId)
    if (!item) return null
    try { await navigator.clipboard.writeText(item.content) } catch { /* */ }
    return item.content
  },

  /** 清除剪贴板历史 */
  clearClipboardHistory() {
    state = { ...state, clipboardHistory: [] }
    persistClipboardHistory([])
    emit()
  },

  /** 删除单条历史 */
  removeClipboardItem(itemId: string) {
    const history = state.clipboardHistory.filter(i => i.id !== itemId)
    state = { ...state, clipboardHistory: history }
    persistClipboardHistory(history)
    emit()
  },

  // ===== AI-Powered Operations =====

  /**
   * 执行 AI 操作 — 通用入口
   * @param action 操作类型
   * @param context 操作上下文 (选中文本、文件信息等)
   * @param config 额外配置
   * @param sendFn AI 发送函数 (来自 model-store 的 sendToActiveModel)
   */
  async executeAction(
    action: ActionType,
    context: ActionContext,
    config: ActionConfig,
    sendFn: (message: string, options?: { systemPrompt?: string; history?: { role: string; content: string }[] }) => Promise<string>,
  ): Promise<ActionResult> {
    // 本地操作 — 不需要 AI
    if (action === 'copy') {
      const start = Date.now()
      await quickActionsStore.copyToClipboard(context.selection, { type: 'code', language: context.language, sourceFile: context.filePath })
      return { success: true, output: context.selection, durationMs: Date.now() - start }
    }
    if (action === 'copy-markdown') {
      const start = Date.now()
      await quickActionsStore.copyAsMarkdown(context.selection, context.language, context.filePath)
      return { success: true, output: context.selection, durationMs: Date.now() - start }
    }
    if (action === 'copy-html') {
      const start = Date.now()
      await quickActionsStore.copyAsHTML(context.selection, context.language, context.filePath)
      return { success: true, output: context.selection, durationMs: Date.now() - start }
    }

    // AI 操作
    state = { ...state, status: 'processing', currentAction: action, lastResult: null }
    emit()

    const start = Date.now()
    try {
      const { system, user } = buildActionPrompt(action, context, config)
      const output = await sendFn(user, { systemPrompt: system })

      let explanation: string | undefined
      // Parse optimize response format
      if (action === 'optimize') {
        const codeMatch = output.match(/OPTIMIZED_CODE:\n```(?:\w+)?\n([\s\S]*?)\n```/)
        const explMatch = output.match(/EXPLANATION:\n([\s\S]*)/)
        if (codeMatch) {
          explanation = explMatch?.[1]?.trim()
        }
      }

      const result: ActionResult = {
        success: true,
        output: output.trim(),
        explanation,
        durationMs: Date.now() - start,
      }
      state = { ...state, status: 'success', lastResult: result }
      emit()
      return result
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const result: ActionResult = {
        success: false,
        error: errMsg,
        durationMs: Date.now() - start,
      }
      state = { ...state, status: 'error', lastResult: result }
      emit()
      return result
    }
  },

  /** 获取操作定义 */
  getActionDef(action: ActionType): ActionDefinition | undefined {
    return ACTION_REGISTRY.find(d => d.id === action)
  },

  /** 重置状态 */
  resetStatus() {
    state = { ...state, status: 'idle', currentAction: null }
    emit()
  },

  /** 获取当前快照 */
  getState: () => state,
}

// ===== React Hook =====

/** Hook: 读取 QuickActions store */
export function useQuickActionsStore() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
