/**
 * @file LivePreview.tsx
 * @description 实时预览组件，提供实时预览
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,live,ui,component
 */

import {
  useState, useRef, useCallback, useEffect, useMemo, memo,
  type CSSProperties,
} from 'react'
import {
  Eye, RefreshCw, Play, Pause, Monitor, Tablet, Smartphone,
  RotateCcw, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Terminal, X, Trash2, ChevronDown, History,
  AlertTriangle, Grid3X3, Frame, Link2, Link2Off,
  Clock, SkipBack, SkipForward, Camera, Settings2,
  Gauge,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { CyberTooltip } from './CyberTooltip'
import { useI18n } from '../i18n/context'
import { useThemeStore } from '../store/theme-store'
import {
  usePreviewStore, DEVICE_PRESETS,
  type PreviewMode, type ConsoleEntry,
} from '../store/preview-store'

// ===== Language Detection =====
/** Detect preview language from file extension */
function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'css', less: 'css',
    js: 'javascript', mjs: 'javascript',
    ts: 'typescript', tsx: 'react', jsx: 'react',
    md: 'markdown', mdx: 'markdown',
    svg: 'svg',
    json: 'json',
    vue: 'vue',
  }
  return map[ext] || 'html'
}

// ===== Markdown Renderer (lightweight) =====
function renderMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%"/>')
    // Lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr/>')
    // Line breaks -> paragraphs
    .replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\s*)+/g, '<ul>$&</ul>')
  
  // Security: Sanitize HTML to prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'hr', 'img', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}

// ===== Build Preview HTML =====
interface BuildOptions {
  code: string
  language: string
  isCyberpunk: boolean
  fontDisplay: string
  fontMono: string
  fontBody: string
  background: string
  foreground: string
  primary: string
  primaryDim: string
}

function buildPreviewDocument(opts: BuildOptions): string {
  const { code, language, fontDisplay, fontMono, fontBody, background, foreground, primary, primaryDim } = opts

  // Base styles injected into every preview
  const baseStyles = `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100vh; font-family: ${fontBody}; background: ${background}; color: ${foreground}; }
    body { padding: 16px; }
    a { color: ${primary}; }
    pre, code { font-family: ${fontMono}; font-size: 13px; }
    pre { background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; overflow-x: auto; }
    code { background: rgba(0,0,0,0.04); padding: 2px 4px; border-radius: 3px; }
    h1, h2, h3, h4, h5, h6 { font-family: ${fontDisplay}; color: ${primary}; margin: 0 0 8px; }
    h1 { font-size: 28px; } h2 { font-size: 22px; } h3 { font-size: 18px; }
    blockquote { border-left: 3px solid ${primaryDim}; margin: 8px 0; padding: 4px 12px; color: ${foreground}; opacity: 0.8; }
    hr { border: none; border-top: 1px solid ${primaryDim}; margin: 16px 0; }
    ul, ol { padding-left: 20px; }
    li { margin: 4px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid ${primaryDim}; padding: 6px 10px; text-align: left; }
    th { background: rgba(0,0,0,0.04); }
    img { max-width: 100%; }
    .error-display { background: rgba(255,0,68,0.08); border: 1px solid rgba(255,0,68,0.3); border-radius: 6px; padding: 16px; margin: 16px; font-family: ${fontMono}; color: #ff0044; font-size: 13px; white-space: pre-wrap; }
  `

  // Console capture script — forward console.log/warn/error to parent
  const consoleCapture = `
    <script>
      (function() {
        var _log = console.log, _warn = console.warn, _err = console.error, _info = console.info;
        function send(type, args) {
          try {
            var msg = Array.prototype.slice.call(args).map(function(a) {
              if (typeof a === 'object') try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
              return String(a);
            }).join(' ');
            window.parent.postMessage({ type: 'yyc3-console', logType: type, message: msg }, '*');
          } catch(e) {}
        }
        console.log = function() { send('log', arguments); _log.apply(console, arguments); };
        console.warn = function() { send('warn', arguments); _warn.apply(console, arguments); };
        console.error = function() { send('error', arguments); _err.apply(console, arguments); };
        console.info = function() { send('info', arguments); _info.apply(console, arguments); };
        window.onerror = function(msg, url, line, col, err) {
          window.parent.postMessage({ type: 'yyc3-error', message: String(msg), line: line, column: col, stack: err && err.stack || '' }, '*');
        };
        window.addEventListener('unhandledrejection', function(e) {
          window.parent.postMessage({ type: 'yyc3-error', message: 'Unhandled Promise: ' + String(e.reason), stack: '' }, '*');
        });
      })();
    </script>
  `

  // Scroll sync script
  const scrollSync = `
    <script>
      window.addEventListener('scroll', function() {
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = docH > 0 ? window.scrollY / docH : 0;
        window.parent.postMessage({ type: 'yyc3-scroll', ratio: ratio }, '*');
      });
      window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'yyc3-scroll-to') {
          var docH = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: docH * e.data.ratio, behavior: 'auto' });
        }
      });
    </script>
  `

  switch (language) {
    case 'html':
      // HTML: render as-is but inject console capture
      if (code.includes('<html') || code.includes('<!DOCTYPE')) {
        // Full document — inject scripts before </body>
        return code.replace('</body>', `${consoleCapture}${scrollSync}</body>`)
      }
      return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>${code}${consoleCapture}${scrollSync}</body></html>`

    case 'css':
      return `<!DOCTYPE html><html><head><style>${baseStyles}${code}</style></head><body>
        <div style="padding:20px;">
          <h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>
          <p>Paragraph text for CSS preview. <strong>Bold</strong> and <em>italic</em>.</p>
          <button class="btn">Button</button>
          <input placeholder="Input field" style="display:block;margin:8px 0;padding:8px;border:1px solid ${primaryDim};border-radius:4px;background:transparent;color:${foreground};"/>
          <div class="card" style="border:1px solid ${primaryDim};border-radius:8px;padding:16px;margin:12px 0;">Card Component</div>
          <ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>
          <table><tr><th>Name</th><th>Value</th></tr><tr><td>Alpha</td><td>100</td></tr><tr><td>Beta</td><td>200</td></tr></table>
        </div>
        ${consoleCapture}${scrollSync}</body></html>`

    case 'javascript':
    case 'typescript':
      return `<!DOCTYPE html><html><head><style>${baseStyles}
        #output { font-family: ${fontMono}; font-size: 13px; white-space: pre-wrap; padding: 16px; }
        .log-line { padding: 2px 0; border-bottom: 1px solid rgba(0,0,0,0.03); }
      </style></head><body>
        <div id="output"></div>
        ${consoleCapture}
        <script>
          var output = document.getElementById('output');
          var origLog = console.log;
          console.log = function() {
            origLog.apply(console, arguments);
            var line = document.createElement('div');
            line.className = 'log-line';
            line.textContent = Array.prototype.slice.call(arguments).map(function(a) {
              return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
            }).join(' ');
            output.appendChild(line);
          };
          try {
            ${language === 'typescript' ? code.replace(/:\s*\w+(\[\])?(\s*[=,);{])/g, '$2').replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '').replace(/type\s+\w+\s*=[\s\S]*?;/g, '') : code}
          } catch(e) {
            var errDiv = document.createElement('div');
            errDiv.className = 'error-display';
            errDiv.textContent = e.message + (e.stack ? '\n\n' + e.stack : '');
            output.appendChild(errDiv);
          }
        </script>
        ${scrollSync}</body></html>`

    case 'react':
      // JSX/TSX: render with Babel standalone + React UMD
      return `<!DOCTYPE html><html><head>
        <style>${baseStyles}</style>
        <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      </head><body>
        <div id="root"></div>
        ${consoleCapture}
        <script type="text/babel" data-presets="react,typescript">
          ${code.replace(/import\s+.*?from\s+['"].*?['"]\s*;?/g, '// [import removed for preview]')
            .replace(/export\s+default\s+/g, 'const __Default = ')
            .replace(/export\s+/g, '')}

          // Auto-detect and render the main component
          try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            if (typeof __Default !== 'undefined') {
              root.render(React.createElement(__Default));
            } else if (typeof App !== 'undefined') {
              root.render(React.createElement(App));
            } else {
              document.getElementById('root').innerHTML = '<div style="padding:20px;opacity:0.5;font-family:monospace;">Component rendered — no default export detected</div>';
            }
          } catch(e) {
            document.getElementById('root').innerHTML = '<div class="error-display">' + e.message + '</div>';
          }
        </script>
        ${scrollSync}</body></html>`

    case 'markdown':
      return `<!DOCTYPE html><html><head><style>${baseStyles}
        body { max-width: 720px; margin: 0 auto; padding: 24px; line-height: 1.7; }
      </style></head><body>${renderMarkdown(code)}${consoleCapture}${scrollSync}</body></html>`

    case 'svg':
      return `<!DOCTYPE html><html><head><style>${baseStyles}
        body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        svg { max-width: 100%; max-height: 90vh; }
      </style></head><body>${code}${consoleCapture}${scrollSync}</body></html>`

    case 'json':
      return `<!DOCTYPE html><html><head><style>${baseStyles}
        pre { background: transparent; padding: 16px; font-size: 13px; }
        .key { color: ${primary}; }
        .string { color: #059669; }
        .number { color: #dc2626; }
        .boolean { color: #8b5cf6; }
        .null { color: #6b7280; }
      </style></head><body>
        <pre id="json-output"></pre>
        ${consoleCapture}
        <script>
          try {
            var obj = JSON.parse(${JSON.stringify(code)});
            var formatted = JSON.stringify(obj, null, 2);
            // Syntax highlight
            formatted = formatted
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
              .replace(/: "([^"]*)"/g, ': <span class="string">"$1"</span>')
              .replace(/: (\\d+\\.?\\d*)/g, ': <span class="number">$1</span>')
              .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
              .replace(/: (null)/g, ': <span class="null">$1</span>');
            document.getElementById('json-output').innerHTML = formatted;
          } catch(e) {
            document.getElementById('json-output').innerHTML = '<div class="error-display">' + e.message + '</div>';
          }
        </script>
        ${scrollSync}</body></html>`

    default:
      return `<!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
        <pre style="padding:16px;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ${consoleCapture}${scrollSync}</body></html>`
  }
}

// ===== LivePreview Component =====
interface LivePreviewProps {
  /** Source code to preview */
  code: string
  /** Current file name (for language detection) */
  fileName: string
  /** Optional explicit language override */
  language?: string
  /** Called when user scrolls in preview (ratio 0-1) */
  onScrollSync?: (ratio: number) => void
  /** Whether preview panel is expanded to full area */
  isExpanded?: boolean
  /** Called when collapse/expand is toggled */
  onToggleExpand?: () => void
}

export const LivePreview = memo(function LivePreview({
  code,
  fileName,
  language: languageOverride,
  onScrollSync,
  isExpanded,
  onToggleExpand,
}: LivePreviewProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const preview = usePreviewStore()
  const {
    mode: previewMode, delay: previewDelay, autoRefreshInterval,
    setIsUpdating, setPreviewError, setRenderTime,
    addConsoleEntry, addHistorySnapshot, scrollSyncEnabled,
  } = preview

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renderStartRef = useRef<number>(0)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false)

  // Detect language
  const language = languageOverride || detectLanguage(fileName)

  // Build preview HTML
  const previewHTML = useMemo(() => {
    if (!code.trim()) return ''
    return buildPreviewDocument({
      code,
      language,
      isCyberpunk,
      fontDisplay: tk.fontDisplay,
      fontMono: tk.fontMono,
      fontBody: tk.fontBody,
      background: tk.background,
      foreground: tk.foreground,
      primary: tk.primary,
      primaryDim: tk.primaryDim,
    })
  }, [code, language, isCyberpunk, tk])

  // Handle preview updates based on mode
  useEffect(() => {
    if (!previewHTML || previewMode === 'manual') return

    if (previewMode === 'realtime') {
      setIsUpdating(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        renderStartRef.current = performance.now()
        setIframeKey(k => k + 1)
        setIsUpdating(false)
        setPreviewError(null)
      }, 150)
    } else if (previewMode === 'delayed') {
      setIsUpdating(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        renderStartRef.current = performance.now()
        setIframeKey(k => k + 1)
        setIsUpdating(false)
        setPreviewError(null)
      }, previewDelay)
    } else if (previewMode === 'smart') {
      const delay = code.length < 500 ? 100 : code.length < 2000 ? 300 : 600
      setIsUpdating(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        renderStartRef.current = performance.now()
        setIframeKey(k => k + 1)
        setIsUpdating(false)
        setPreviewError(null)
      }, delay)
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [previewHTML, previewMode, previewDelay, code.length, setIsUpdating, setPreviewError])

  // Performance timing: measure iframe load time
  const handleIframeLoad = useCallback(() => {
    if (renderStartRef.current > 0) {
      const elapsed = performance.now() - renderStartRef.current
      setRenderTime(elapsed)
      renderStartRef.current = 0
    }
  }, [setRenderTime])

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    if (autoRefreshInterval > 0) {
      autoRefreshRef.current = setInterval(() => {
        renderStartRef.current = performance.now()
        setIframeKey(k => k + 1)
      }, autoRefreshInterval)
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [autoRefreshInterval])

  // Manual refresh
  const handleManualRefresh = useCallback(() => {
    setIsUpdating(true)
    setPreviewError(null)
    setIframeKey(k => k + 1)
    setTimeout(() => setIsUpdating(false), 100)
  }, [setIsUpdating, setPreviewError])

  // Save snapshot
  const handleSaveSnapshot = useCallback(() => {
    addHistorySnapshot(code, language)
  }, [addHistorySnapshot, code, language])

  // Listen for console messages & errors from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // 来源校验：预览 iframe 为 srcdoc（null origin）；拒绝任意第三方页面注入
      if (e.origin !== 'null' && e.origin !== window.location.origin) return
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'yyc3-console') {
        addConsoleEntry(e.data.logType, e.data.message)
      } else if (e.data.type === 'yyc3-error') {
        setPreviewError({
          message: e.data.message,
          line: e.data.line,
          column: e.data.column,
          stack: e.data.stack,
        })
        addConsoleEntry('error', e.data.message)
      } else if (e.data.type === 'yyc3-scroll' && scrollSyncEnabled) {
        onScrollSync?.(e.data.ratio)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [scrollSyncEnabled, addConsoleEntry, setPreviewError, onScrollSync])

  // Get device dimensions
  const device = DEVICE_PRESETS.find(d => d.id === preview.deviceId) || DEVICE_PRESETS[0]
  const isResponsive = device.id === 'responsive'
  const dims = preview.getCurrentDeviceDimensions()
  const effectiveW = dims.width || undefined
  const effectiveH = dims.height || undefined

  // Mode labels
  const modeLabels: Record<PreviewMode, { zh: string; en: string }> = {
    realtime: { zh: '实时', en: 'LIVE' },
    manual: { zh: '手动', en: 'MANUAL' },
    delayed: { zh: '延迟', en: 'DELAYED' },
    smart: { zh: '智能', en: 'SMART' },
  }

  // Console type colors
  const consoleColors: Record<ConsoleEntry['type'], string> = {
    log: tk.foreground,
    info: tk.primary,
    warn: tk.warning,
    error: tk.error,
  }

  // Device icon
  const DeviceIcon = device.icon === 'tablet' ? Tablet : device.icon === 'smartphone' ? Smartphone : Monitor

  // Toolbar button style
  const btnStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  }

  return (
    <div className="flex flex-col h-full" style={{ background: tk.codeBg }}>
      {/* ===== Toolbar ===== */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b shrink-0"
        style={{ borderColor: tk.borderDim, background: tk.primaryGlow, minHeight: 32 }}
      >
        {/* Left: mode + device */}
        <div className="flex items-center gap-1.5">
          {/* Live indicator */}
          <div className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: preview.mode === 'manual' ? tk.warning : preview.isUpdating ? tk.warning : tk.success,
                boxShadow: isCyberpunk ? `0 0 4px ${preview.isUpdating ? tk.warning : tk.success}` : 'none',
                animation: preview.isUpdating ? 'pulse 0.6s infinite' : 'none',
              }}
            />
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: preview.isUpdating ? tk.warning : tk.success, letterSpacing: '1px' }}>
              {preview.isUpdating ? (isZh ? '更新中' : 'UPDATING') : modeLabels[preview.mode][isZh ? 'zh' : 'en']}
            </span>
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 12, background: tk.borderDim }} />

          {/* Mode cycle button */}
          <CyberTooltip label={isZh ? '切换预览模式' : 'CYCLE PREVIEW MODE'} position="bottom">
            <button
              style={btnStyle}
              onClick={() => {
                const modes: PreviewMode[] = ['realtime', 'manual', 'delayed', 'smart']
                const idx = modes.indexOf(preview.mode)
                preview.setMode(modes[(idx + 1) % modes.length])
              }}
            >
              {preview.mode === 'realtime' ? <Play size={10} color={tk.success} /> :
               preview.mode === 'manual' ? <Pause size={10} color={tk.warning} /> :
               preview.mode === 'delayed' ? <Clock size={10} color={tk.primary} /> :
               <Settings2 size={10} color={tk.primary} />}
            </button>
          </CyberTooltip>

          {/* Manual refresh (only in manual mode) */}
          {preview.mode === 'manual' && (
            <CyberTooltip label={isZh ? '刷新预览' : 'REFRESH'} position="bottom">
              <button style={btnStyle} onClick={handleManualRefresh}>
                <RefreshCw size={10} color={tk.primary} />
              </button>
            </CyberTooltip>
          )}

          {/* Separator */}
          <div style={{ width: 1, height: 12, background: tk.borderDim }} />

          {/* Device selector */}
          <div className="relative">
            <CyberTooltip label={isZh ? '设备模拟' : 'DEVICE'} position="bottom">
              <button
                style={btnStyle}
                className="flex items-center gap-1"
                onClick={() => setDeviceMenuOpen(v => !v)}
              >
                <DeviceIcon size={10} color={tk.primary} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
                  {isResponsive ? (isZh ? '自适应' : 'AUTO') : `${effectiveW}×${effectiveH}`}
                </span>
                <ChevronDown size={7} color={tk.foregroundMuted} />
              </button>
            </CyberTooltip>

            {/* Device dropdown */}
            {deviceMenuOpen && (
              <div
                className="absolute top-full left-0 mt-1 rounded-lg overflow-hidden"
                style={{
                  background: tk.panelBg,
                  border: `1px solid ${tk.cardBorder}`,
                  boxShadow: tk.shadowHover,
                  backdropFilter: 'blur(10px)',
                  zIndex: 50,
                  minWidth: 180,
                }}
              >
                {DEVICE_PRESETS.map(d => {
                  const DIcon = d.icon === 'tablet' ? Tablet : d.icon === 'smartphone' ? Smartphone : Monitor
                  const isActive = d.id === preview.deviceId
                  return (
                    <button
                      key={d.id}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-all"
                      style={{
                        background: isActive ? tk.primaryGlow : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => { preview.setDevice(d.id); setDeviceMenuOpen(false) }}
                    >
                      <DIcon size={11} color={isActive ? tk.primary : tk.foregroundMuted} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: isActive ? tk.primary : tk.foreground, flex: 1 }}>
                        {d.name[isZh ? 'zh' : 'en']}
                      </span>
                      {d.width > 0 && (
                        <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                          {d.width}×{d.height}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Orientation toggle (only for non-responsive devices) */}
          {!isResponsive && (
            <CyberTooltip label={isZh ? '旋转' : 'ROTATE'} position="bottom">
              <button style={btnStyle} onClick={preview.toggleOrientation}>
                <RotateCcw size={9} color={tk.primary} />
              </button>
            </CyberTooltip>
          )}
        </div>

        {/* Center: language badge */}
        <div className="flex items-center gap-1">
          <div
            className="px-1.5 py-0.5 rounded"
            style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}
          >
            <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.primary, letterSpacing: '1px' }}>
              {language.toUpperCase()}
            </span>
          </div>
          {/* Render time (对齐 Guidelines: Performance Analysis) */}
          {preview.renderTime > 0 && (
            <CyberTooltip label={isZh ? '渲染耗时' : 'RENDER TIME'} position="bottom">
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded" style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
                <Gauge size={7} color={preview.renderTime < 100 ? tk.success : preview.renderTime < 500 ? tk.warning : tk.error} />
                <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: preview.renderTime < 100 ? tk.success : preview.renderTime < 500 ? tk.warning : tk.error }}>
                  {preview.renderTime}ms
                </span>
              </div>
            </CyberTooltip>
          )}
          {preview.error && (
            <CyberTooltip label={preview.error.message.slice(0, 100)} position="bottom">
              <AlertTriangle size={10} color={tk.error} />
            </CyberTooltip>
          )}
        </div>

        {/* Right: tools */}
        <div className="flex items-center gap-1">
          {/* Scroll sync toggle */}
          <CyberTooltip label={isZh ? '滚动同步' : 'SCROLL SYNC'} position="bottom">
            <button style={btnStyle} onClick={preview.toggleScrollSync}>
              {preview.scrollSyncEnabled
                ? <Link2 size={9} color={tk.primary} />
                : <Link2Off size={9} color={tk.foregroundMuted} />}
            </button>
          </CyberTooltip>

          {/* Grid lines */}
          <CyberTooltip label={isZh ? '网格线' : 'GRID'} position="bottom">
            <button style={btnStyle} onClick={preview.toggleGridLines}>
              <Grid3X3 size={9} color={preview.showGridLines ? tk.primary : tk.foregroundMuted} />
            </button>
          </CyberTooltip>

          {/* Device frame */}
          <CyberTooltip label={isZh ? '设备边框' : 'FRAME'} position="bottom">
            <button style={btnStyle} onClick={preview.toggleDeviceFrame}>
              <Frame size={9} color={preview.showDeviceFrame ? tk.primary : tk.foregroundMuted} />
            </button>
          </CyberTooltip>

          <div style={{ width: 1, height: 12, background: tk.borderDim }} />

          {/* Zoom */}
          <CyberTooltip label={`${Math.round(preview.zoom * 100)}%`} position="bottom">
            <div className="flex items-center gap-0.5">
              <button style={btnStyle} onClick={() => preview.setZoom(preview.zoom - 0.1)}>
                <ZoomOut size={9} color={tk.foregroundMuted} />
              </button>
              <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, minWidth: 24, textAlign: 'center' }}>
                {Math.round(preview.zoom * 100)}%
              </span>
              <button style={btnStyle} onClick={() => preview.setZoom(preview.zoom + 0.1)}>
                <ZoomIn size={9} color={tk.foregroundMuted} />
              </button>
            </div>
          </CyberTooltip>

          <div style={{ width: 1, height: 12, background: tk.borderDim }} />

          {/* Snapshot */}
          <CyberTooltip label={isZh ? '保存快照' : 'SNAPSHOT'} position="bottom">
            <button style={btnStyle} onClick={handleSaveSnapshot}>
              <Camera size={9} color={tk.primary} />
            </button>
          </CyberTooltip>

          {/* History */}
          <CyberTooltip label={isZh ? '预览历史' : 'HISTORY'} position="bottom">
            <button style={btnStyle} onClick={() => setHistoryOpen(v => !v)}>
              <History size={9} color={preview.history.length > 0 ? tk.primary : tk.foregroundMuted} />
            </button>
          </CyberTooltip>

          {/* Console toggle */}
          <CyberTooltip label={isZh ? '控制台' : 'CONSOLE'} position="bottom">
            <button
              className="flex items-center gap-0.5"
              style={btnStyle}
              onClick={preview.toggleConsole}
            >
              <Terminal size={9} color={preview.consoleVisible ? tk.primary : tk.foregroundMuted} />
              {preview.consoleEntries.filter(e => e.type === 'error').length > 0 && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex items-center justify-center"
                  style={{ background: tk.error, fontSize: '6px', color: '#fff', fontFamily: tk.fontMono }}
                >
                  {preview.consoleEntries.filter(e => e.type === 'error').length}
                </span>
              )}
            </button>
          </CyberTooltip>

          {/* Expand/collapse */}
          {onToggleExpand && (
            <CyberTooltip label={isExpanded ? (isZh ? '收起' : 'COLLAPSE') : (isZh ? '展开' : 'EXPAND')} position="bottom">
              <button style={btnStyle} onClick={onToggleExpand}>
                {isExpanded ? <Minimize2 size={9} color={tk.primary} /> : <Maximize2 size={9} color={tk.primary} />}
              </button>
            </CyberTooltip>
          )}
        </div>
      </div>

      {/* ===== Preview Area ===== */}
      <div className="flex-1 overflow-auto relative" style={{ background: isResponsive ? 'transparent' : tk.backgroundAlt }}>
        {/* Grid overlay */}
        {preview.showGridLines && !isResponsive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(${tk.primary}10 1px, transparent 1px),
                linear-gradient(90deg, ${tk.primary}10 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              zIndex: 5,
            }}
          />
        )}

        {/* Device frame wrapper */}
        <div
          className="flex items-start justify-center"
          style={{
            padding: isResponsive ? 0 : 16,
            minHeight: '100%',
          }}
        >
          <div
            style={{
              width: isResponsive ? '100%' : (effectiveW ? effectiveW * preview.zoom : '100%'),
              maxWidth: '100%',
              borderRadius: !isResponsive && preview.showDeviceFrame ? (device.icon === 'smartphone' ? 28 : device.icon === 'tablet' ? 16 : 8) : 0,
              overflow: 'hidden',
              border: !isResponsive && preview.showDeviceFrame ? `2px solid ${tk.cardBorder}` : 'none',
              boxShadow: !isResponsive && preview.showDeviceFrame ? tk.shadowHover : 'none',
              transition: 'width 0.3s, border-radius 0.3s',
            }}
          >
            {/* Device chrome (notch for phones) */}
            {!isResponsive && preview.showDeviceFrame && device.icon === 'smartphone' && (
              <div
                className="flex items-center justify-center py-1"
                style={{ background: tk.backgroundAlt, borderBottom: `1px solid ${tk.borderDim}` }}
              >
                <div
                  className="rounded-full"
                  style={{ width: 40, height: 4, background: tk.borderDim }}
                />
              </div>
            )}

            {/* Browser chrome for desktop/laptop */}
            {!isResponsive && preview.showDeviceFrame && device.icon === 'monitor' && (
              <div className="flex items-center px-2 py-1" style={{ background: tk.primaryGlow, borderBottom: `1px solid ${tk.borderDim}` }}>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: tk.windowClose }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: tk.windowMinimize }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: tk.windowMaximize }} />
                </div>
                <div className="flex-1 mx-2 px-2 py-0.5 rounded" style={{ background: tk.inputBg, border: `1px solid ${tk.borderDim}` }}>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted }}>
                    localhost:5173/{fileName}
                  </span>
                </div>
              </div>
            )}

            {/* Iframe */}
            {previewHTML ? (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                title="Live Preview"
                sandbox="allow-scripts allow-modals"
                style={{
                  width: '100%',
                  height: isResponsive ? 'calc(100vh - 200px)' : (effectiveH ? effectiveH * preview.zoom : 500),
                  border: 'none',
                  background: tk.background,
                  display: 'block',
                  transition: 'height 0.3s',
                }}
                srcDoc={previewHTML}
                onLoad={handleIframeLoad}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ height: 300, background: tk.codeBg }}>
                <div className="text-center">
                  <Eye size={28} color={tk.primary} style={{ opacity: 0.2, margin: '0 auto 8px', display: 'block' }} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, letterSpacing: '2px' }}>
                    {isZh ? '输入代码开始预览' : 'START TYPING TO PREVIEW'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Console Panel ===== */}
      {preview.consoleVisible && (
        <div
          className="border-t shrink-0 flex flex-col"
          style={{ borderColor: tk.border, height: 150, background: tk.codeBg }}
        >
          {/* Console header */}
          <div className="flex items-center justify-between px-2 py-1 border-b" style={{ borderColor: tk.borderDim }}>
            <div className="flex items-center gap-2">
              <Terminal size={9} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, letterSpacing: '1px' }}>
                {isZh ? '控制台' : 'CONSOLE'}
              </span>
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                ({preview.consoleEntries.length})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CyberTooltip label={isZh ? '清空' : 'CLEAR'} position="top">
                <button style={btnStyle} onClick={preview.clearConsole}>
                  <Trash2 size={8} color={tk.foregroundMuted} />
                </button>
              </CyberTooltip>
              <button style={btnStyle} onClick={preview.toggleConsole}>
                <X size={8} color={tk.foregroundMuted} />
              </button>
            </div>
          </div>

          {/* Console entries */}
          <div className="flex-1 overflow-auto px-2 py-1" style={{ fontFamily: tk.fontMono, fontSize: '10px' }}>
            {preview.consoleEntries.length === 0 ? (
              <div className="flex items-center justify-center h-full" style={{ color: tk.foregroundMuted, fontSize: '9px' }}>
                {isZh ? '暂无输出' : 'No output'}
              </div>
            ) : (
              preview.consoleEntries.map(entry => (
                <div
                  key={entry.id}
                  className="py-0.5 border-b flex items-start gap-1.5"
                  style={{ borderColor: tk.borderDim }}
                >
                  <span style={{ color: consoleColors[entry.type], fontSize: '8px', opacity: 0.6, minWidth: 28 }}>
                    [{entry.type.toUpperCase()}]
                  </span>
                  <span style={{ color: consoleColors[entry.type], whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== History Panel (overlay) ===== */}
      {historyOpen && (
        <div
          className="absolute bottom-0 right-0 rounded-tl-lg overflow-hidden flex flex-col"
          style={{
            width: 240,
            maxHeight: 300,
            background: tk.panelBg,
            border: `1px solid ${tk.cardBorder}`,
            boxShadow: tk.shadowHover,
            backdropFilter: 'blur(10px)',
            zIndex: 30,
          }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: tk.borderDim }}>
            <div className="flex items-center gap-1.5">
              <History size={10} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.primary, letterSpacing: '1px' }}>
                {isZh ? '预览历史' : 'HISTORY'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button style={btnStyle} onClick={preview.historyBack} disabled={preview.historyIndex <= 0}>
                <SkipBack size={9} color={preview.historyIndex > 0 ? tk.primary : tk.foregroundMuted} />
              </button>
              <button style={btnStyle} onClick={preview.historyForward} disabled={preview.historyIndex >= preview.history.length - 1}>
                <SkipForward size={9} color={preview.historyIndex < preview.history.length - 1 ? tk.primary : tk.foregroundMuted} />
              </button>
              <button style={btnStyle} onClick={() => setHistoryOpen(false)}>
                <X size={9} color={tk.foregroundMuted} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {preview.history.length === 0 ? (
              <div className="flex items-center justify-center py-6" style={{ color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: '9px' }}>
                {isZh ? '暂无快照' : 'No snapshots'}
              </div>
            ) : (
              preview.history.map((snap, idx) => (
                <button
                  key={snap.id}
                  className="flex items-center gap-2 w-full px-3 py-1.5 border-b text-left transition-all"
                  style={{
                    background: idx === preview.historyIndex ? tk.primaryGlow : 'transparent',
                    borderColor: tk.borderDim,
                    border: 'none',
                    borderBottom: `1px solid ${tk.borderDim}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => preview.restoreHistory(idx)}
                >
                  <Camera size={9} color={idx === preview.historyIndex ? tk.primary : tk.foregroundMuted} />
                  <div className="flex-1 min-w-0">
                    <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: idx === preview.historyIndex ? tk.primary : tk.foreground }}>
                      {snap.label || `${isZh ? '快照' : 'Snapshot'} #${idx + 1}`}
                    </span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '7px', color: tk.foregroundMuted, display: 'block' }}>
                      {new Date(snap.timestamp).toLocaleTimeString()} — {snap.language.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Close device menu on outside click */}
      {deviceMenuOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 40 }}
          onClick={() => setDeviceMenuOpen(false)}
        />
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
})
