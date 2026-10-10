export const UI_LOCALES = [
  "zh",
  "en",
  "zh-TW",
  "ja",
  "ko",
  "de",
  "fr",
  "es",
  "pt-BR",
  "ar",
] as const;

export type UiLocale = (typeof UI_LOCALES)[number];

export const UI_LOCALE_STORAGE_KEY = "octop:ui-locale";

/** Canonical BCP-47 tag for each dashboard UI locale. */
export const UI_LOCALE_BCP47: Record<UiLocale, string> = {
  zh: "zh-CN",
  en: "en-US",
  "zh-TW": "zh-TW",
  ja: "ja-JP",
  ko: "ko-KR",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  "pt-BR": "pt-BR",
  ar: "ar",
};

const RTL_UI_LOCALES: ReadonlySet<UiLocale> = new Set(["ar"]);

export function isRtlUi(locale: UiLocale): boolean {
  return RTL_UI_LOCALES.has(locale);
}

/** Match a raw language tag against supported locales, longest prefix first. */
function matchUiLocale(raw: string): UiLocale | null {
  const lang = raw.toLowerCase();
  const ordered = [...UI_LOCALES].sort((a, b) => b.length - a.length);
  for (const loc of ordered) {
    const lower = loc.toLowerCase();
    if (lang === lower || lang.startsWith(`${lower}-`)) return loc;
  }
  const base = lang.split("-")[0];
  const exactBase = ordered.find((loc) => loc.toLowerCase() === base);
  if (exactBase) return exactBase;
  return ordered.find((loc) => loc.toLowerCase().split("-")[0] === base) ?? null;
}

/** Map browser language tags to a supported dashboard locale. */
export function detectBrowserLocale(): UiLocale {
  if (typeof navigator === "undefined") return "en";

  const candidates =
    navigator.languages?.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const raw of candidates) {
    const hit = raw ? matchUiLocale(raw) : null;
    if (hit) return hit;
  }

  const primary = navigator.language?.toLowerCase() ?? "";
  const hit = primary ? matchUiLocale(primary) : null;
  return hit ?? "en";
}

export function normalizeUiLocale(raw: string | null | undefined): UiLocale {
  if (!raw) return "zh";
  return matchUiLocale(raw) ?? "zh";
}

export function readStoredUiLocale(): UiLocale | null {
  try {
    const raw = localStorage.getItem(UI_LOCALE_STORAGE_KEY);
    if (raw && (UI_LOCALES as readonly string[]).includes(raw)) {
      return raw as UiLocale;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

export function storeUiLocale(locale: UiLocale): void {
  try {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
  } catch {
    // quota / disabled
  }
}

/** Stored user preference wins; otherwise follow the browser. */
export function resolveInitialLocale(): UiLocale {
  return readStoredUiLocale() ?? detectBrowserLocale();
}

export function syncDocumentLang(locale: UiLocale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = UI_LOCALE_BCP47[locale];
  document.documentElement.dir = isRtlUi(locale) ? "rtl" : "ltr";
}

/** BCP-47 tag for STT / SpeechRecognition from dashboard UI locale. */
export function speechLocaleFromUi(locale: string | null | undefined): string {
  return UI_LOCALE_BCP47[normalizeUiLocale(locale)];
}
