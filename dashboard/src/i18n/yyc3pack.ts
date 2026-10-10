/**
 * YYC³ language packs adapter.
 *
 * Single source of truth: the independent YYC3-i18n-Core repo
 * (npm: @yyc3/i18n-core). JSON assets under src/locales/yyc3/ are generated
 * by `npm run sync:yyc3-locales` and committed so the app builds standalone.
 */
import type { UiLocale } from "../utils/localePrefs";

type PackLoader = () => Promise<{ default: object }>;

const packLoaders: Record<UiLocale, PackLoader> = {
  zh: () => import("../locales/yyc3/zh-CN.json"),
  en: () => import("../locales/yyc3/en.json"),
  "zh-TW": () => import("../locales/yyc3/zh-TW.json"),
  ja: () => import("../locales/yyc3/ja.json"),
  ko: () => import("../locales/yyc3/ko.json"),
  de: () => import("../locales/yyc3/de.json"),
  fr: () => import("../locales/yyc3/fr.json"),
  es: () => import("../locales/yyc3/es.json"),
  "pt-BR": () => import("../locales/yyc3/pt-BR.json"),
  ar: () => import("../locales/yyc3/ar.json"),
};

/** Locales with first-party Octop bundles serving as the primary resource. */
export function isCoreLocale(locale: UiLocale): boolean {
  return locale === "zh" || locale === "en";
}

/** Load the YYC³ pack table for a locale (all 10 locales are covered). */
export async function loadYyc3Pack(locale: UiLocale): Promise<object> {
  return (await packLoaders[locale]()).default;
}
