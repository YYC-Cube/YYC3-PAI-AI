/**
 * @file context.tsx
 * @description context组件/模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags i18n,context,react
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Locale, type TranslationValue } from "./translations";

export type TranslationSection = keyof typeof translations;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (section: TranslationSection, key: string) => string;
}

const fallbackI18n: I18nContextType = {
  locale: "zh",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (_section: keyof typeof translations, key: string) => key,
};

const I18nContext = createContext<I18nContextType | null>(null);

const LOCALE_KEY = "yyc3-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  // 历史缺陷：locale 从不持久化——刷新即重置为中文。现从 localStorage 恢复并在切换时落盘
  const [locale, setLocaleState] = useState<Locale>(() =>
    localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "zh",
  );

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {
      /* 配额异常时仅本会话生效 */
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      try {
        localStorage.setItem(LOCALE_KEY, next);
      } catch {
        /* 配额异常时仅本会话生效 */
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (section: keyof typeof translations, key: string): string => {
      const sectionData = translations[section] as Record<string, TranslationValue>;
      const entry = sectionData?.[key];
      if (!entry) return key;
      return entry[locale] ?? entry.en ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return fallbackI18n;
  return ctx;
}