/**
 * @file LangSwitcher.tsx
 * @description 语言切换器组件，提供语言切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags language,switcher,ui,component
 */
import { Languages } from "lucide-react";
import { useI18n } from "../i18n/context";
import { useThemeStore } from "../store/theme-store";

export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale } = useI18n();
  const { tokens, isCyberpunk } = useThemeStore();

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all hover:opacity-80"
      style={{
        border: `1px solid ${tokens.border}`,
        background: isCyberpunk ? "transparent" : tokens.primaryGlow,
      }}
      title={locale === "zh" ? "Switch to English" : "\u5207\u6362\u5230\u4E2D\u6587"}
    >
      <Languages size={compact ? 10 : 12} color={tokens.primary} style={{ filter: isCyberpunk ? `drop-shadow(0 0 3px ${tokens.primary})` : "none" }} />
      <span
        style={{
          fontFamily: tokens.fontMono,
          fontSize: compact ? "9px" : "10px",
          color: tokens.primary,
          letterSpacing: "1px",
        }}
      >
        {locale === "zh" ? "EN" : "\u4E2D"}
      </span>
      <div className="w-px h-3" style={{ background: tokens.border }} />
      <span
        style={{
          fontFamily: tokens.fontMono,
          fontSize: compact ? "8px" : "9px",
          color: tokens.primaryDim,
        }}
      >
        {locale === "zh" ? "\u4E2D\u6587" : "EN"}
      </span>
    </button>
  );
}
