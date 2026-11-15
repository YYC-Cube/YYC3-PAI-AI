/**
 * @file useSystemTheme.ts
 * @description 功能1：系统暗黑模式自动跟随 + 手动切换 — 与项目 useThemeStore 并存互补
 * 通过 html class dark 控制全局暗黑，适配 tailwind dark: 前缀
 */

import { useEffect, useState } from 'react'
import type { ThemeMode } from '../../types/chat'

const THEME_KEY = 'yyc3-chat-theme-mode'

export function useSystemTheme() {
  const [mode, setModeRaw] = useState<ThemeMode>(() => {
    const cache = localStorage.getItem(THEME_KEY)
    return (cache as ThemeMode) || 'system'
  })
  const [isDark, setIsDark] = useState(false)

  // 跟随系统 + 手动切换
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const calcDark = () => {
      if (mode === 'system') return media.matches
      return mode === 'dark'
    }
    setIsDark(calcDark())

    const handler = () => setIsDark(calcDark())
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [mode])

  // html class 挂载 dark，全局 tailwind dark:xxx 自动生效
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const setMode = (v: ThemeMode) => {
    setModeRaw(v)
    localStorage.setItem(THEME_KEY, v)
  }

  return { mode, isDark, setMode }
}