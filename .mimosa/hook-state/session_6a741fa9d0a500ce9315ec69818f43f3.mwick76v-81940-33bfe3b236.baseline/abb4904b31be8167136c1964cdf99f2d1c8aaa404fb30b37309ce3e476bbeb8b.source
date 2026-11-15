/**
 * @file ThemeSwitcher.tsx
 * @description 主题切换器组件，提供主题切换功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,switcher,ui,component
 */

import { Sun, Moon } from 'lucide-react'
import { useThemeStore, THEMES, type ThemeId } from '../store/theme-store'
import { useI18n } from '../i18n/context'
import { CyberTooltip } from './CyberTooltip'

export function ThemeSwitcher() {
  const { themeId, setTheme, tokens } = useThemeStore()
  const { locale } = useI18n()

  const nextTheme: ThemeId = themeId === 'cyberpunk' ? 'clean' : 'cyberpunk'
  const nextName = THEMES[nextTheme].name[locale]
  const label = locale === 'zh' ? `切换至 ${nextName}` : `Switch to ${nextName}`

  return (
    <CyberTooltip label={label}>
      <button
        onClick={() => setTheme(nextTheme)}
        className="p-1.5 rounded transition-all hover:opacity-80"
        style={{
          color: tokens.primary,
          border: `1px solid ${tokens.border}`,
          background: themeId === 'clean' ? tokens.primaryGlow : 'transparent',
        }}
      >
        {themeId === 'cyberpunk' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </CyberTooltip>
  )
}
