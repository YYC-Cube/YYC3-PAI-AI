/**
 * @file SettingsShared.tsx
 * @author YanYuCloudCube Team <admin@0379.email>
 * @description Shared types and helpers for Settings sub-tabs
 * @version v4.8.2
 */

import type { ThemeTokens } from '../../store/theme-store'

/** Common props passed to every settings tab */
export interface SettingsTabProps {
  tk: ThemeTokens
}

/** Reusable toggle row */
export function ToggleRow({
  label,
  desc,
  value,
  onChange,
  tk,
}: {
  label: string
  desc?: string
  value: boolean
  onChange: (v: boolean) => void
  tk: ThemeTokens
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p style={{ fontFamily: tk.fontBody, fontSize: '13px', color: tk.foreground }}>{label}</p>
        {desc && <p style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted, marginTop: 2 }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-all"
        style={{
          background: value ? tk.primary : tk.inputBorder,
        }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            background: value ? tk.background : tk.foregroundMuted,
            left: value ? 22 : 2,
          }}
        />
      </button>
    </div>
  )
}

/** Section label */
export function SectionLabel({ text, tk }: { text: string; tk: ThemeTokens }) {
  return (
    <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
      {text}
    </label>
  )
}