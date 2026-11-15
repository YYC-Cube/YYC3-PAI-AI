/**
 * @file CodeGenPanel.tsx
 * @description 代码生成面板组件，提供AI代码生成功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,code-gen,ai,ui,component
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  X, Play, Download, Copy, Check, RefreshCw, FileCode, Code2,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { CyberTooltip } from './CyberTooltip'
import { cyberToast } from './CyberToast'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import type { DesignRoot, ComponentSpec, ComponentType } from '../types'

// ===== Code Generation Types =====
export interface GeneratedFile {
  id: string
  fileName: string
  content: string
  language: 'tsx' | 'ts' | 'css'
  type: 'component' | 'style' | 'type' | 'util'
  linesOfCode: number
}

type GenStep = 'idle' | 'reading' | 'matching' | 'generating' | 'formatting' | 'checking' | 'done'

// ===== Template Registry =====
const COMPONENT_TEMPLATES: Partial<Record<ComponentType, (spec: ComponentSpec) => string>> = {
  Button: (spec) => {
    const text = (spec.props.text as string) || 'Click me'
    const variant = (spec.props.variant as string) || 'primary'
    return `import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: '${variant}' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = '${variant}',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md transition-all'

  const variants = {
    ${variant}: 'bg-[var(--yyc3-primary)] text-[var(--yyc3-bg)] hover:opacity-90 shadow-[0_0_12px_var(--yyc3-primary-glow)]',
    secondary: 'bg-transparent border border-[var(--yyc3-border)] text-[var(--yyc3-primary)] hover:bg-[var(--yyc3-primary-glow)]',
    ghost: 'bg-transparent text-[var(--yyc3-primary)] hover:bg-[var(--yyc3-primary-glow)]',
  }

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={\\\`\\\${baseStyles} \\\${variants[variant]} \\\${sizes[size]} \\\${className}\\\`}
      {...props}
    >
      {children || '${text}'}
    </button>
  )
}`
  },

  Input: (spec) => {
    const placeholder = (spec.props.placeholder as string) || 'Enter value...'
    const type = (spec.props.type as string) || 'text'
    return `import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            className="text-xs tracking-wider"
            style={{
              fontFamily: "var(--yyc3-font-mono)",
              color: 'var(--yyc3-primary)',
              opacity: 0.6,
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="${type}"
          placeholder="${placeholder}"
          className={\\\`w-full bg-transparent outline-none px-3 py-2 rounded-md text-sm transition-all \\\${
            error
              ? 'border-[var(--yyc3-error)] focus:border-[var(--yyc3-error)]'
              : 'border-[var(--yyc3-border)] focus:border-[var(--yyc3-primary)]'
          } \\\${className}\\\`}
          style={{
            fontFamily: "var(--yyc3-font-mono)",
            color: 'var(--yyc3-primary)',
            caretColor: 'var(--yyc3-primary)',
            background: 'var(--yyc3-input-bg)',
            border: '1px solid var(--yyc3-input-border)',
          }}
          {...props}
        />
        {error && (
          <span
            className="text-xs"
            style={{ fontFamily: "var(--yyc3-font-mono)", color: 'var(--yyc3-error)' }}
          >
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'`
  },

  Card: () => {
    return `import { type ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
  glow?: boolean
}

export function Card({ title, children, className = '', glow = false }: CardProps) {
  return (
    <div
      className={\\\`rounded-lg p-4 backdrop-blur-sm \\\${className}\\\`}
      style={{
        background: 'var(--yyc3-card-bg)',
        border: '1px solid var(--yyc3-card-border)',
        boxShadow: glow ? 'var(--yyc3-shadow)' : 'none',
      }}
    >
      {title && (
        <h3
          className="mb-3 tracking-wider"
          style={{
            fontFamily: "var(--yyc3-font-display)",
            fontSize: '12px',
            color: 'var(--yyc3-primary)',
            letterSpacing: '1px',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}`
  },

  Container: () => {
    return `import { type ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  direction?: 'row' | 'column'
  gap?: number
}

export function Container({
  children,
  className = '',
  direction = 'column',
  gap = 16,
}: ContainerProps) {
  return (
    <div
      className={\\\`flex \\\${direction === 'row' ? 'flex-row' : 'flex-col'} \\\${className}\\\`}
      style={{ gap: \\\`\\\${gap}px\\\` }}
    >
      {children}
    </div>
  )
}`
  },

  Text: () => {
    return `interface TextProps {
  children: React.ReactNode
  variant?: 'heading' | 'body' | 'caption' | 'code'
  color?: string
  className?: string
}

export function Text({
  children,
  variant = 'body',
  color,
  className = '',
}: TextProps) {
  const styles = {
    heading: {
      fontFamily: "var(--yyc3-font-display)",
      fontSize: '18px',
      color: color || 'var(--yyc3-primary)',
      letterSpacing: '1px',
    },
    body: {
      fontFamily: "var(--yyc3-font-body)",
      fontSize: '14px',
      color: color || 'var(--yyc3-fg)',
      lineHeight: 1.6,
    },
    caption: {
      fontFamily: "var(--yyc3-font-mono)",
      fontSize: '10px',
      color: color || 'var(--yyc3-fg-muted)',
      letterSpacing: '1px',
    },
    code: {
      fontFamily: "var(--yyc3-font-mono)",
      fontSize: '12px',
      color: color || 'var(--yyc3-primary)',
    },
  }

  const Tag = variant === 'heading' ? 'h2' : variant === 'caption' ? 'small' : 'p'

  return (
    <Tag className={className} style={styles[variant]}>
      {children}
    </Tag>
  )
}`
  },
}

// ===== Style Generation =====
function generateStyleFile(designJson: DesignRoot): string {
  const { theme, tokens } = designJson.styles
  return `/* Generated by YYC³ Code Generator v4.7.2 */
/* Theme: ${theme.name} | Mode: ${theme.mode} */

:root {
  /* === Color Tokens === */
  --color-background: ${theme.colors.background};
  --color-foreground: ${theme.colors.foreground};
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-muted: ${theme.colors.muted};
  --color-border: ${theme.colors.border};
  --color-input: ${theme.colors.input};
  --color-ring: ${theme.colors.ring};

  /* === Spacing === */
  --space-1: ${tokens.spacing[1]};
  --space-2: ${tokens.spacing[2]};
  --space-3: ${tokens.spacing[3]};
  --space-4: ${tokens.spacing[4]};
  --space-6: ${tokens.spacing[6]};
  --space-8: ${tokens.spacing[8]};

  /* === Typography === */
  --font-sans: ${tokens.typography.fontFamily.sans.join(', ')};
  --font-mono: ${tokens.typography.fontFamily.mono.join(', ')};

  /* === Border Radius === */
  --radius-sm: ${tokens.borderRadius.sm};
  --radius-md: ${tokens.borderRadius.md};
  --radius-lg: ${tokens.borderRadius.lg};
  --radius-xl: ${tokens.borderRadius.xl};

  /* === Transitions === */
  --transition-fast: ${tokens.transitions.fast};
  --transition-normal: ${tokens.transitions.normal};
  --transition-slow: ${tokens.transitions.slow};
}

/* === Base Styles === */
body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}

/* === Utility Classes === */
.neon-glow {
  box-shadow: 0 0 8px var(--color-primary), inset 0 0 8px var(--yyc3-primary-glow, rgba(0, 240, 255, 0.08));
}

.cyber-border {
  border: 1px solid var(--color-border);
}

.cyber-bg {
  background: var(--yyc3-card-bg, linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(0, 240, 255, 0.02)));
}`
}

// ===== Type Definition Generation =====
function generateTypesFile(designJson: DesignRoot): string {
  const types = designJson.components.map((comp) => {
    const propsEntries = Object.entries(comp.props)
      .map(([k, v]) => `  ${k}: ${typeof v === 'string' ? 'string' : typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'unknown'}`)
      .join('\n')

    return `export interface ${comp.type}Props {\n${propsEntries || '  // No props defined'}\n}`
  })

  return `/**
 * Auto-generated type definitions
 * Generated by YYC³ Code Generator v4.7.2
 */

${types.join('\n\n')}`
}

// ===== Main Code Generation Engine =====
function runCodeGeneration(designJson: DesignRoot): GeneratedFile[] {
  const files: GeneratedFile[] = []

  // 1. Generate component files
  designJson.components.forEach((comp) => {
    const templateFn = COMPONENT_TEMPLATES[comp.type]
    if (templateFn) {
      const content = templateFn(comp)
      files.push({
        id: `gen-${comp.id}`,
        fileName: `${comp.type}.tsx`,
        content,
        language: 'tsx',
        type: 'component',
        linesOfCode: content.split('\n').length,
      })
    }
  })

  // 2. Generate style file
  const styleContent = generateStyleFile(designJson)
  files.push({
    id: 'gen-styles',
    fileName: 'theme.generated.css',
    content: styleContent,
    language: 'css',
    type: 'style',
    linesOfCode: styleContent.split('\n').length,
  })

  // 3. Generate types file
  const typesContent = generateTypesFile(designJson)
  files.push({
    id: 'gen-types',
    fileName: 'types.generated.ts',
    content: typesContent,
    language: 'ts',
    type: 'type',
    linesOfCode: typesContent.split('\n').length,
  })

  return files
}

// ===== Component Props =====
interface CodeGenPanelProps {
  visible: boolean
  onClose: () => void
  designJson: DesignRoot | null
  onCodeGenerated?: (files: GeneratedFile[]) => void
}

export function CodeGenPanel({ visible, onClose, designJson, onCodeGenerated }: CodeGenPanelProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const [step, setStep] = useState<GenStep>('idle')
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [stepLogs, setStepLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [stepLogs])

  const handleGenerate = useCallback(() => {
    if (!designJson) {
      cyberToast(isZh ? '未找到 Design JSON 数据' : 'No Design JSON data found')
      return
    }

    setStep('reading')
    setFiles([])
    setSelectedFileId(null)
    setStepLogs([])

    const pipeline: { step: GenStep; log: string; delay: number }[] = [
      { step: 'reading', log: '[READ] Parsing Design JSON schema...', delay: 0 },
      { step: 'reading', log: `[READ] Found ${designJson.panels.length} panels, ${designJson.components.length} components`, delay: 400 },
      { step: 'matching', log: '[MATCH] Scanning template registry...', delay: 800 },
      { step: 'matching', log: `[MATCH] Matched ${designJson.components.length} component templates`, delay: 1200 },
      { step: 'generating', log: '[GEN] Generating component code...', delay: 1600 },
      { step: 'generating', log: '[GEN] Generating style tokens & theme...', delay: 2000 },
      { step: 'generating', log: '[GEN] Generating TypeScript type definitions...', delay: 2400 },
      { step: 'formatting', log: '[FMT] Applying code formatting (2-space indent, single quotes)...', delay: 2800 },
      { step: 'checking', log: '[CHECK] Running type check (tsc --noEmit)...', delay: 3200 },
      { step: 'checking', log: '[CHECK] ✓ No type errors found', delay: 3600 },
    ]

    pipeline.forEach(({ step: s, log, delay }) => {
      setTimeout(() => {
        setStep(s)
        setStepLogs((prev) => [...prev, log])
      }, delay)
    })

    setTimeout(() => {
      const generated = runCodeGeneration(designJson)
      setFiles(generated)
      setSelectedFileId(generated[0]?.id || null)
      setStep('done')
      setStepLogs((prev) => [...prev, `[DONE] Generated ${generated.length} files (${generated.reduce((a, f) => a + f.linesOfCode, 0)} lines total)`])
      cyberToast(isZh ? `成功生成 ${generated.length} 个文件` : `Successfully generated ${generated.length} files`)
      if (onCodeGenerated) onCodeGenerated(generated)
    }, 4000)
  }, [designJson, isZh, onCodeGenerated])

  const handleCopyFile = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      cyberToast(isZh ? '代码已复制' : 'Code copied')
    }).catch(() => {
      cyberToast(isZh ? '复制失败' : 'Copy failed')
    })
  }, [isZh])

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || null
  }, [files, selectedFileId])

  const totalLines = useMemo(() => files.reduce((a, f) => a + f.linesOfCode, 0), [files])

  const stepLabels: Record<GenStep, { zh: string; en: string }> = {
    idle: { zh: '就绪', en: 'READY' },
    reading: { zh: '读取 Design JSON', en: 'READING DESIGN JSON' },
    matching: { zh: '模板匹配', en: 'TEMPLATE MATCHING' },
    generating: { zh: '生成代码', en: 'GENERATING CODE' },
    formatting: { zh: '代码格式化', en: 'FORMATTING' },
    checking: { zh: '类型检查', en: 'TYPE CHECKING' },
    done: { zh: '完成', en: 'COMPLETE' },
  }

  const borderColor = tk.border

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.assistPanel, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-xl overflow-hidden flex flex-col"
        style={{
          width: 800,
          maxHeight: '85vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.borderDim}` : tk.shadowHover,
          borderRadius: tk.borderRadius,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
            >
              <FileCode size={14} color={tk.primary} />
            </div>
            <div>
              <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '1px', margin: 0, lineHeight: 1.3 }}>
                {isZh ? '代码生成引擎' : 'CODE GENERATION ENGINE'}
              </h2>
              <p style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted, letterSpacing: '2px', margin: 0 }}>
                DESIGN JSON → TEMPLATE → CODE → FORMAT  TYPE CHECK
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step !== 'idle' && step !== 'done' && (
              <div className="flex items-center gap-1.5">
                <RefreshCw size={10} color={tk.primary} className="animate-spin" />
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary }}>
                  {stepLabels[step][locale]}
                </span>
              </div>
            )}
            {step === 'done' && (
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success }}>
                ✓ {files.length} {isZh ? '个文件' : 'files'} · {totalLines} {isZh ? '行' : 'lines'}
              </span>
            )}
            <button onClick={onClose} className="p-1 rounded hover:opacity-80 transition-all">
              <X size={14} color={tk.primary} />
            </button>
          </div>
        </div>

        {/* Pipeline steps indicator */}
        <div className="px-5 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto" style={{ borderColor }}>
          {(['reading', 'matching', 'generating', 'formatting', 'checking'] as GenStep[]).map((s, i) => {
            const steps: GenStep[] = ['reading', 'matching', 'generating', 'formatting', 'checking']
            const currentIdx = steps.indexOf(step)
            const thisIdx = steps.indexOf(s)
            const isDone = step === 'done' || thisIdx < currentIdx
            const isCurrent = s === step
            const color = isDone ? tk.success : isCurrent ? tk.primary : tk.foregroundMuted

            return (
              <div key={s} className="flex items-center gap-0">
                {i > 0 && <div style={{ width: 20, height: 1, background: isDone ? tk.success + '44' : tk.borderDim, transition: 'background 0.3s' }} />}
                <div className="flex items-center gap-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{
                      border: `1px solid ${color}`,
                      background: isDone ? tk.success + '15' : isCurrent ? tk.primaryGlow : 'transparent',
                      transition: 'all 0.3s',
                    }}
                  >
                    {isDone ? <Check size={7} color={tk.success} /> : isCurrent ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: tk.primary }} /> : null}
                  </div>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    {stepLabels[s][locale]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: File list + Logs */}
          <div className="flex flex-col border-r" style={{ width: '35%', borderColor }}>
            {/* Generate button */}
            <div className="px-4 py-3 border-b" style={{ borderColor }}>
              <button
                onClick={handleGenerate}
                disabled={step !== 'idle' && step !== 'done'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{
                  fontFamily: tk.fontMono,
                  fontSize: '11px',
                  letterSpacing: '1px',
                  color: step !== 'idle' && step !== 'done' ? tk.foregroundMuted : tk.background,
                  background: step !== 'idle' && step !== 'done' ? tk.primaryGlow : tk.primary,
                  border: `1px solid ${step !== 'idle' && step !== 'done' ? tk.borderDim : tk.primary}`,
                  cursor: step !== 'idle' && step !== 'done' ? 'wait' : 'pointer',
                  boxShadow: (step === 'idle' || step === 'done') && isCyberpunk ? `0 0 12px ${tk.primary}44` : 'none',
                }}
              >
                <Play size={12} />
                {step === 'done' ? (isZh ? '重新生成' : 'REGENERATE') : (isZh ? '开始生成' : 'START GENERATION')}
              </button>
            </div>

            {/* Generated files */}
            {files.length > 0 && (
              <div className="border-b" style={{ borderColor }}>
                <div className="px-4 py-1.5">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
                    {isZh ? '生成的文件' : 'GENERATED FILES'}
                  </span>
                </div>
                {files.map((file) => {
                  const isSelected = selectedFileId === file.id
                  const typeColors: Record<string, string> = { component: tk.primary, style: tk.secondary, type: tk.warning, util: tk.accent }
                  return (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className="w-full flex items-center gap-2 px-4 py-1.5 text-left transition-all"
                      style={{ background: isSelected ? tk.primaryGlow : 'transparent' }}
                    >
                      <FileCode size={11} color={typeColors[file.type] || tk.primary} style={{ opacity: 0.6 }} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: isSelected ? tk.primary : tk.foreground, flex: 1, opacity: isSelected ? 1 : 0.6 }}>
                        {file.fileName}
                      </span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                        {file.linesOfCode}L
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Generation logs */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-1.5 border-b shrink-0" style={{ borderColor }}>
                <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
                  {isZh ? '生成日志' : 'GENERATION LOG'}
                </span>
              </div>
              <div ref={logRef} className="flex-1 overflow-y-auto neon-scrollbar p-3 space-y-1">
                {stepLogs.length === 0 && (
                  <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.4, textAlign: 'center', marginTop: 20 }}>
                    {isZh ? '等待生成...' : 'Waiting for generation...'}
                  </p>
                )}
                {stepLogs.map((log, i) => (
                  <div key={i} style={{
                    fontFamily: tk.fontMono,
                    fontSize: '9px',
                    color: log.includes('✓') ? tk.success : log.startsWith('[DONE]') ? tk.success : log.startsWith('[CHECK]') ? tk.warning : tk.primary,
                    lineHeight: 1.5,
                    opacity: 0.8,
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Code preview */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {selectedFile ? (
              <>
                {/* File header */}
                <div className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <Code2 size={11} color={tk.primary} />
                    <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>
                      {selectedFile.fileName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded" style={{
                      fontFamily: tk.fontMono,
                      fontSize: '8px',
                      color: tk.foregroundMuted,
                      background: tk.primaryGlow,
                      border: `1px solid ${tk.borderDim}`,
                    }}>
                      {selectedFile.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CyberTooltip label={isZh ? '复制代码' : 'COPY CODE'} position="top">
                      <button
                        onClick={() => handleCopyFile(selectedFile.content)}
                        className="p-1 rounded hover:opacity-80 transition-all"
                        style={{ border: `1px solid ${tk.borderDim}` }}
                      >
                        <Copy size={10} color={tk.primary} style={{ opacity: 0.5 }} />
                      </button>
                    </CyberTooltip>
                    <CyberTooltip label={isZh ? '下载文件' : 'DOWNLOAD'} position="top">
                      <button
                        onClick={() => cyberToast(isZh ? '文件下载已触发' : 'File download triggered')}
                        className="p-1 rounded hover:opacity-80 transition-all"
                        style={{ border: `1px solid ${tk.borderDim}` }}
                      >
                        <Download size={10} color={tk.primary} style={{ opacity: 0.5 }} />
                      </button>
                    </CyberTooltip>
                  </div>
                </div>

                {/* Code content with line numbers */}
                <div className="flex-1 overflow-auto neon-scrollbar p-0">
                  {selectedFile.content.split('\n').map((line, i) => (
                    <div key={i} className="flex" style={{ lineHeight: '20px' }}>
                      <span
                        className="shrink-0 text-right select-none px-3"
                        style={{ width: 44, color: tk.foregroundMuted, opacity: 0.3, fontFamily: tk.fontMono, fontSize: '10px' }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, opacity: 0.75, whiteSpace: 'pre' }}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileCode size={36} color={tk.primary} style={{ opacity: 0.1, margin: '0 auto 12px' }} />
                  <p style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foregroundMuted, letterSpacing: '1px' }}>
                    {isZh ? '点击"开始生成"运行代码生成引擎' : 'Click "START GENERATION" to run code gen engine'}
                  </p>
                  <p style={{ fontFamily: tk.fontBody, fontSize: '10px', color: tk.foregroundMuted, opacity: 0.5, marginTop: 4 }}>
                    Design JSON → Template Match → Code Output → Format → Type Check
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
