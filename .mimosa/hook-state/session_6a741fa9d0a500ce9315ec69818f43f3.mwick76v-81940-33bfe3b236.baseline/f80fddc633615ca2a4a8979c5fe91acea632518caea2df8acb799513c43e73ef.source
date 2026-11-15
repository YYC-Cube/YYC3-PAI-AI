/**
 * @file PreviewEngine.tsx
 * @description 预览引擎组件，提供实时预览
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,engine,ui,component
 */

import { useState, useRef, useEffect, useMemo, memo } from 'react'
import { RefreshCw, Zap, GitMerge, Maximize2, Minimize2 } from 'lucide-react'
import { CyberTooltip } from './CyberTooltip'
import { useI18n } from '../i18n/context'
import { useThemeStore, type ThemeTokens } from '../store/theme-store'
import type { GeneratedFile } from './CodeGenPanel'

// ===== Diff Engine =====
export interface DiffChunk {
  type: 'add' | 'remove' | 'keep'
  lines: string[]
  oldStart: number
  newStart: number
}

export interface DiffResult {
  chunks: DiffChunk[]
  additions: number
  deletions: number
  modifications: number
  unchanged: number
}

function computeDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  const m = oldLines.length
  const n = newLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const chunks: DiffChunk[] = []
  let i = m, j = n
  const result: Array<{ type: 'add' | 'remove' | 'keep'; line: string; oldIdx: number; newIdx: number }> = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'keep', line: oldLines[i - 1], oldIdx: i - 1, newIdx: j - 1 })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', line: newLines[j - 1], oldIdx: i, newIdx: j - 1 })
      j--
    } else if (i > 0) {
      result.unshift({ type: 'remove', line: oldLines[i - 1], oldIdx: i - 1, newIdx: j })
      i--
    }
  }

  let currentChunk: DiffChunk | null = null
  for (const item of result) {
    if (!currentChunk || currentChunk.type !== item.type) {
      if (currentChunk) chunks.push(currentChunk)
      currentChunk = {
        type: item.type,
        lines: [item.line],
        oldStart: item.oldIdx,
        newStart: item.newIdx,
      }
    } else {
      currentChunk.lines.push(item.line)
    }
  }
  if (currentChunk) chunks.push(currentChunk)

  const additions = result.filter((r) => r.type === 'add').length
  const deletions = result.filter((r) => r.type === 'remove').length
  const unchanged = result.filter((r) => r.type === 'keep').length

  return { chunks, additions, deletions, modifications: Math.min(additions, deletions), unchanged }
}

// ===== Build preview HTML =====
function buildPreviewHTML(files: GeneratedFile[], version: number, tk: ThemeTokens): string {
  const cssFile = files.find((f) => f.language === 'css')
  const componentFiles = files.filter((f) => f.language === 'tsx')
  const cssContent = cssFile?.content || ''
  const isCyberpunk = tk.id === 'cyberpunk'

  // Theme-aware color tokens for the preview iframe — derived from theme store tokens
  const C = {
    bg: tk.background,
    fg: tk.foreground,
    primary: tk.primary,
    secondary: tk.primaryDim,
    glow: isCyberpunk ? tk.primaryDim : tk.primaryGlow,
    dimBorder: tk.border,
    dimBg: isCyberpunk ? tk.cardBg : tk.cardBg,
    dimBg2: tk.primaryGlow,
    dimBg3: tk.cardHover,
    dimCaption: tk.foregroundMuted,
    dimSub: tk.foregroundMuted,
    dimPlaceholder: tk.foregroundMuted,
    error: tk.error,
    fontDisplay: tk.fontDisplay,
    fontMono: tk.fontMono,
    fontBody: tk.fontBody,
    scanline: tk.enableScanlines,
  }

  const componentPreviews = componentFiles.map((f) => {
    const nameMatch = f.content.match(/export (?:function|const) (\w+)/)
    const compName = nameMatch ? nameMatch[1] : f.fileName.replace('.tsx', '')
    return `
      <div class="comp-card" data-component="${compName}">
        <div class="comp-header">
          <span class="comp-icon">\u25C6</span>
          <span class="comp-name">${compName}</span>
          <span class="comp-file">${f.fileName}</span>
          <span class="comp-lines">${f.linesOfCode}L</span>
        </div>
        <div class="comp-body">
          ${compName === 'Button' ? `
            <button class="cyber-btn primary">Get Started</button>
            <button class="cyber-btn secondary">Secondary</button>
            <button class="cyber-btn ghost">Ghost</button>
          ` : compName === 'Input' ? `
            <div class="input-group">
              <label class="input-label">LABEL</label>
              <input class="cyber-input" placeholder="Enter value..." />
            </div>
            <div class="input-group">
              <label class="input-label">WITH ERROR</label>
              <input class="cyber-input error" placeholder="Invalid..." />
              <span class="input-error">Required field</span>
            </div>
          ` : compName === 'Card' ? `
            <div class="cyber-card">
              <h3 class="card-title">CARD TITLE</h3>
              <p class="card-body">Card content with cyberpunk styling and neon glow effects.</p>
            </div>
          ` : compName === 'Text' ? `
            <h2 class="text-heading">Heading</h2>
            <p class="text-body">Body text with Rajdhani font.</p>
            <small class="text-caption">CAPTION TEXT</small>
          ` : `
            <div class="comp-placeholder"><span>\u25C7 ${compName} rendered</span></div>
          `}
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${cssContent}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};color:${C.fg};font-family:${C.fontBody};padding:20px;min-height:100vh}
.preview-header{font-family:${C.fontDisplay};font-size:11px;color:${C.primary};letter-spacing:2px;margin-bottom:6px;opacity:.8}
.preview-sub{font-family:${C.fontMono};font-size:9px;color:${C.dimSub};letter-spacing:1px;margin-bottom:20px}
.comp-card{border:1px solid ${C.dimBorder};border-radius:8px;margin-bottom:16px;overflow:hidden;background:${C.dimBg};transition:border-color .3s,box-shadow .3s}
.comp-card.updated{border-color:${tk.successGlow};box-shadow:0 0 12px ${tk.successGlow}}
.comp-header{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid ${C.dimBorder};background:${C.dimBg2}}
.comp-icon{color:${C.primary};font-size:10px}
.comp-name{font-family:${C.fontDisplay};font-size:10px;color:${C.primary};letter-spacing:1px}
.comp-file{font-family:${C.fontMono};font-size:8px;color:${C.dimSub};margin-left:auto}
.comp-lines{font-family:${C.fontMono};font-size:8px;color:${C.dimPlaceholder}}
.comp-body{padding:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
.cyber-btn{font-family:${C.fontMono};font-size:12px;padding:8px 16px;border-radius:6px;cursor:pointer;transition:all .2s;letter-spacing:.5px}
.cyber-btn.primary{background:${C.primary};color:${C.bg};border:1px solid ${C.primary};box-shadow:${isCyberpunk ? `0 0 12px ${C.glow}` : 'none'}}
.cyber-btn.primary:hover{box-shadow:${isCyberpunk ? `0 0 20px ${C.glow}` : `0 2px 8px ${C.glow}`}}
.cyber-btn.secondary{background:transparent;color:${C.primary};border:1px solid ${C.secondary}}
.cyber-btn.ghost{background:transparent;color:${C.primary};border:1px solid transparent}
.cyber-btn.ghost:hover{background:${C.dimBg3}}
.input-group{display:flex;flex-direction:column;gap:4px;min-width:200px}
.input-label{font-family:${C.fontMono};font-size:10px;color:${C.primary};opacity:.6;letter-spacing:1px}
.cyber-input{font-family:${C.fontMono};font-size:12px;color:${C.primary};background:${C.dimBg2};border:1px solid ${C.dimBorder};border-radius:4px;padding:8px 12px;outline:none;caret-color:${C.primary}}
.cyber-input:focus{border-color:${C.primary};box-shadow:${isCyberpunk ? `0 0 8px ${C.glow}` : `0 0 0 2px ${C.glow}`}}
.cyber-input.error{border-color:${C.error}}
.input-error{font-family:${C.fontMono};font-size:10px;color:${C.error}}
.cyber-card{border:1px solid ${C.dimBorder};border-radius:8px;padding:16px;background:${isCyberpunk ? `linear-gradient(135deg,${C.dimBg3},${C.dimBg2})` : C.dimBg};box-shadow:${isCyberpunk ? `0 0 20px ${C.glow}` : tk.shadow};width:100%}
.card-title{font-family:${C.fontDisplay};font-size:12px;color:${C.primary};letter-spacing:1px;margin-bottom:8px}
.card-body{font-size:13px;color:${C.fg};line-height:1.5}
.text-heading{font-family:${C.fontDisplay};font-size:18px;color:${C.primary};letter-spacing:1px;margin-bottom:4px}
.text-body{font-size:14px;color:${C.fg};line-height:1.6;margin-bottom:4px}
.text-caption{font-family:${C.fontMono};font-size:10px;color:${C.dimCaption};letter-spacing:1px}
.comp-placeholder{padding:12px;border:1px dashed ${C.dimBorder};border-radius:4px;width:100%;text-align:center}
.comp-placeholder span{font-family:${C.fontMono};font-size:10px;color:${C.dimPlaceholder}}
@keyframes flash-update{0%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 16px ${tk.successGlow}}100%{box-shadow:0 0 0 transparent}}
.flash{animation:flash-update .8s ease-out}
${C.scanline ? `.scanline{position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${C.glow},transparent);animation:scanline 4s linear infinite;pointer-events:none}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}` : ''}
</style>
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'hot-update') {
      var components = e.data.components || [];
      components.forEach(function(comp) {
        var el = document.querySelector('[data-component="' + comp.name + '"]');
        if (el) {
          el.classList.add('updated', 'flash');
          setTimeout(function() { el.classList.remove('flash'); }, 800);
        }
      });
      var sub = document.querySelector('.preview-sub');
      if (sub) sub.textContent = 'REVISION ' + e.data.version + ' \\u00b7 PATCHED ' + components.length + ' COMPONENTS \\u00b7 ' + new Date().toLocaleTimeString();
    }
  });
</script>
</head><body>
${C.scanline ? '<div class="scanline"></div>' : ''}
<div class="preview-header">COMPONENT GALLERY</div>
<div class="preview-sub">GENERATED BY YYC\\u00B3 CODE ENGINE v4.8.0 \\u00b7 REVISION ${version}</div>
${componentPreviews}
</body></html>`
}

// ===== Preview Engine Component =====
interface PreviewEngineProps {
  files: GeneratedFile[]
  version: number
  onDoubleClickRestore?: () => void
  isFullscreen?: boolean
}

export const PreviewEngine = memo(function PreviewEngine({
  files, version, onDoubleClickRestore,
}: PreviewEngineProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const prevHTMLRef = useRef<string>('')
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [updateMode, setUpdateMode] = useState<'full' | 'patch'>('full')
  const [expanded, setExpanded] = useState(false)

  const currentHTML = useMemo(() => {
    if (files.length === 0) return ''
    return buildPreviewHTML(files, version, tk)
  }, [files, version, tk])

  useEffect(() => {
    if (!currentHTML) return

    const prevHTML = prevHTMLRef.current
    if (!prevHTML) {
      prevHTMLRef.current = currentHTML
      queueMicrotask(() => setUpdateMode('full'))
      return
    }

    const diffResult = computeDiff(prevHTML, currentHTML)
    setDiff(diffResult)

    const changeRatio = (diffResult.additions + diffResult.deletions) /
      (diffResult.unchanged + diffResult.additions + diffResult.deletions)

    if (changeRatio < 0.3 && iframeRef.current?.contentWindow) {
      queueMicrotask(() => setUpdateMode('patch'))
      const changedComponents = files
        .filter((f) => f.language === 'tsx')
        .map((f) => {
          const nameMatch = f.content.match(/export (?:function|const) (\w+)/)
          return { name: nameMatch?.[1] || f.fileName.replace('.tsx', '') }
        })

      iframeRef.current.contentWindow.postMessage({
        type: 'hot-update',
        version,
        components: changedComponents,
      }, '*')
    } else {
      queueMicrotask(() => setUpdateMode('full'))
    }

    prevHTMLRef.current = currentHTML
  }, [currentHTML, version, files])

  if (files.length === 0) return null

  return (
    <div className="p-4" onDoubleClick={onDoubleClickRestore}>
      {/* Preview browser chrome */}
      <div
        className="mx-auto rounded-lg overflow-hidden"
        style={{
          maxWidth: expanded ? '100%' : 720,
          border: `1px solid ${tk.cardBorder}`,
          background: tk.codeBg,
          boxShadow: tk.shadowHover,
          transition: 'max-width 0.3s',
        }}
      >
        {/* Browser chrome bar */}
        <div className="flex items-center px-3 py-1.5 border-b" style={{ borderColor: tk.borderDim, background: tk.primaryGlow }}>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: tk.windowClose }} />
            <div className="w-2 h-2 rounded-full" style={{ background: tk.windowMinimize }} />
            <div className="w-2 h-2 rounded-full" style={{ background: tk.windowMaximize }} />
          </div>
          <div className="flex-1 mx-3 px-2 py-0.5 rounded" style={{ background: tk.inputBg, border: `1px solid ${tk.borderDim}` }}>
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
              localhost:5173 — v{version}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Update mode indicator */}
            <div className="flex items-center gap-1">
              {updateMode === 'patch' ? (
                <Zap size={8} color={tk.success} />
              ) : (
                <RefreshCw size={8} color={tk.warning} />
              )}
              <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: updateMode === 'patch' ? tk.success : tk.warning }}>
                {updateMode === 'patch' ? 'HOT PATCH' : 'FULL RELOAD'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: tk.success, boxShadow: isCyberpunk ? `0 0 4px ${tk.success}` : 'none' }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.success }}>LIVE</span>
            </div>
            <CyberTooltip label={expanded ? (isZh ? '收起' : 'COLLAPSE') : (isZh ? '展开' : 'EXPAND')} position="top">
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:opacity-80">
                {expanded ? <Minimize2 size={9} color={tk.primary} /> : <Maximize2 size={9} color={tk.primary} />}
              </button>
            </CyberTooltip>
          </div>
        </div>

        {/* Iframe preview */}
        <iframe
          ref={iframeRef}
          key={updateMode === 'full' ? version : 'stable'}
          title="Live Preview"
          sandbox="allow-scripts"
          style={{ width: '100%', height: expanded ? 600 : 400, border: 'none', background: tk.background }}
          srcDoc={currentHTML}
        />
      </div>

      {/* Diff summary bar */}
      <div className="mx-auto mt-3 px-4 py-2 rounded-lg flex items-center justify-between" style={{ maxWidth: expanded ? '100%' : 720, background: tk.primaryGlow, border: `1px solid ${tk.borderDim}`, transition: 'max-width 0.3s' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <GitMerge size={9} color={tk.primary} style={{ opacity: 0.5 }} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, letterSpacing: '1px' }}>
              {isZh ? '差异分析' : 'DIFF ANALYSIS'}
            </span>
          </div>
          {diff && (
            <>
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.success }}>
                +{diff.additions}
              </span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.error }}>
                -{diff.deletions}
              </span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                ~{diff.modifications} {isZh ? '修改' : 'mod'}
              </span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, opacity: 0.5 }}>
                {diff.unchanged} {isZh ? '不变' : 'kept'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
            {files.length} {isZh ? '文件' : 'files'} · {files.reduce((a, f) => a + f.linesOfCode, 0)}L
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: tk.success, boxShadow: isCyberpunk ? `0 0 4px ${tk.success}` : 'none' }} />
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.success }}>
              {isZh ? '实时同步' : 'LIVE SYNC'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
