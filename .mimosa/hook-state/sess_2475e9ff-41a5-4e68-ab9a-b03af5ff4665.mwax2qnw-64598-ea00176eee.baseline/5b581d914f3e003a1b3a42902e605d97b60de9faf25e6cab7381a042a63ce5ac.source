/**
 * @file ThemePreview.tsx
 * @description 主题预览组件，提供主题预览功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,preview,ui,component
 */
import { Monitor, Moon, Sun, Cpu, Database, Shield, Bot, Zap } from 'lucide-react'
import { THEMES, type ThemeId, type ThemeTokens } from '../store/theme-store'
import { useI18n } from '../i18n/context'

function MiniPreview({ tokens, label }: { tokens: ThemeTokens; label: string }) {
  const isCyber = tokens.id === 'cyberpunk'
  return (
    <div
      className="flex-1 rounded-lg overflow-hidden flex flex-col"
      style={{
        background: tokens.background,
        border: `1px solid ${tokens.cardBorder}`,
        minHeight: 220,
      }}
    >
      {/* Mini nav bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ background: tokens.panelBg, borderColor: tokens.border }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: tokens.primary, opacity: 0.8 }} />
          <span style={{ fontFamily: tokens.fontDisplay, fontSize: "9px", color: tokens.primary, fontWeight: 700 }}>YYC³</span>
        </div>
        <div className="flex items-center gap-1">
          {[Monitor, Moon].map((Icon, i) => (
            <div key={i} className="w-4 h-4 rounded flex items-center justify-center" style={{ background: tokens.primaryGlow }}>
              <Icon size={8} color={tokens.primary} />
            </div>
          ))}
        </div>
      </div>

      {/* Mini sidebar + content */}
      <div className="flex flex-1">
        <div className="w-8 border-r flex flex-col items-center gap-2 py-2" style={{ background: tokens.panelBg, borderColor: tokens.borderDim }}>
          {[Cpu, Database, Shield, Bot].map((Icon, i) => (
            <Icon key={i} size={8} color={tokens.primary} style={{ opacity: i === 0 ? 1 : 0.4 }} />
          ))}
        </div>
        <div className="flex-1 p-2 space-y-1.5">
          {/* Mini stat cards */}
          <div className="grid grid-cols-2 gap-1">
            {[92.3, 64.8].map((v, i) => (
              <div key={i} className="rounded p-1.5" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
                <div style={{ fontFamily: tokens.fontMono, fontSize: "6px", color: tokens.foregroundMuted, letterSpacing: "0.5px" }}>
                  METRIC {i + 1}
                </div>
                <div style={{ fontFamily: tokens.fontDisplay, fontSize: "12px", color: tokens.primary, textShadow: isCyber ? `0 0 6px ${tokens.primary}` : "none" }}>
                  {v}%
                </div>
                <div className="h-0.5 rounded-full mt-1" style={{ background: tokens.primaryGlow }}>
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: tokens.primary }} />
                </div>
              </div>
            ))}
          </div>
          {/* Mini chat area */}
          <div className="rounded p-1.5 space-y-1" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}` }}>
            <div className="rounded px-1.5 py-1" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.borderDim}` }}>
              <span style={{ fontFamily: tokens.fontMono, fontSize: "5px", color: tokens.primary }}>AI:</span>
              <div className="mt-0.5" style={{ fontFamily: tokens.fontBody, fontSize: "6px", color: tokens.foreground, lineHeight: 1.3 }}>
                Ready to assist with your code...
              </div>
            </div>
            <div className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ border: `1px solid ${tokens.borderDim}` }}>
              <Zap size={6} color={tokens.primary} />
              <div className="flex-1 h-1.5 rounded" style={{ background: tokens.inputBg }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mini footer */}
      <div className="flex items-center justify-between px-3 py-1 border-t" style={{ background: tokens.panelBg, borderColor: tokens.border }}>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.success }} />
          <span style={{ fontFamily: tokens.fontMono, fontSize: "6px", color: tokens.success }}>ONLINE</span>
        </div>
        <span style={{ fontFamily: tokens.fontMono, fontSize: "6px", color: tokens.foregroundMuted }}>{label}</span>
      </div>
    </div>
  )
}

interface ThemePreviewProps {
  currentTheme: ThemeId
  onSelect: (id: ThemeId) => void
  autoDetect: boolean
  onAutoDetectChange: (enabled: boolean) => void
}

export function ThemePreview({ currentTheme, onSelect, autoDetect, onAutoDetectChange }: ThemePreviewProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'
  const tk = THEMES[currentTheme]

  return (
    <div className="space-y-4">
      {/* Auto-detect toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Monitor size={14} color={tk.primary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>
            {isZh ? '跟随系统主题' : 'Follow System Theme'}
          </span>
          <span style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>
            (prefers-color-scheme)
          </span>
        </div>
        <button
          onClick={() => onAutoDetectChange(!autoDetect)}
          className="shrink-0"
        >
          <div className="w-9 h-5 rounded-full transition-all" style={{ background: autoDetect ? `${tk.primary}50` : tk.borderDim }}>
            <div className="w-4 h-4 rounded-full transition-all" style={{
              background: autoDetect ? tk.primary : tk.foregroundMuted,
              marginTop: 2,
              marginLeft: autoDetect ? 18 : 2,
            }} />
          </div>
        </button>
      </div>

      {/* Side-by-side preview */}
      <div className="flex gap-3">
        {(['cyberpunk', 'clean'] as ThemeId[]).map((id) => {
          const isActive = currentTheme === id
          const theme = THEMES[id]
          return (
            <div key={id} className="flex-1 flex flex-col gap-2">
              <button
                onClick={() => onSelect(id)}
                className="w-full transition-all hover:opacity-90"
                style={{
                  outline: isActive ? `2px solid ${tk.primary}` : "none",
                  outlineOffset: 2,
                  borderRadius: tk.borderRadius,
                }}
              >
                <MiniPreview tokens={theme} label={theme.name[locale]} />
              </button>
              <div className="flex items-center justify-center gap-2">
                {id === 'cyberpunk' ? <Moon size={10} color={tk.foregroundMuted} /> : <Sun size={10} color={tk.foregroundMuted} />}
                <span style={{
                  fontFamily: tk.fontMono,
                  fontSize: "10px",
                  color: isActive ? tk.primary : tk.foregroundMuted,
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {theme.name[locale]}
                </span>
                {isActive && (
                  <span style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.success }}>
                    ✓ {isZh ? '当前' : 'Active'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Color palette preview */}
      <div className="space-y-2 px-1">
        <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, letterSpacing: "1px" }}>
          {isZh ? '色彩系统' : 'COLOR SYSTEM'}
        </span>
        <div className="flex gap-1.5">
          {[
            { label: 'Primary', color: tk.primary },
            { label: 'Secondary', color: tk.secondary },
            { label: 'Accent', color: tk.accent },
            { label: 'Success', color: tk.success },
            { label: 'Warning', color: tk.warning },
            { label: 'Error', color: tk.error },
            { label: 'BG', color: tk.background },
            { label: 'FG', color: tk.foreground },
          ].map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded" style={{ background: c.color, border: `1px solid ${tk.border}` }} />
              <span style={{ fontFamily: tk.fontMono, fontSize: "6px", color: tk.foregroundMuted }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
