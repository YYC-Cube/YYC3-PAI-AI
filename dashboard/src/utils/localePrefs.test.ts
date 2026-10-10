import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectBrowserLocale,
  readStoredUiLocale,
  resolveInitialLocale,
  speechLocaleFromUi,
  storeUiLocale,
  UI_LOCALE_STORAGE_KEY,
} from "./localePrefs";

describe("localePrefs", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("detectBrowserLocale prefers zh when browser lists Chinese first", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["zh-CN", "en-US"],
    });
    expect(detectBrowserLocale()).toBe("zh");
  });

  it("detectBrowserLocale prefers en when browser lists English first", () => {
    vi.stubGlobal("navigator", {
      language: "zh-CN",
      languages: ["en-US", "zh-CN"],
    });
    expect(detectBrowserLocale()).toBe("en");
  });

  it("resolveInitialLocale uses stored preference over browser", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["en-US"],
    });
    storeUiLocale("zh");
    expect(resolveInitialLocale()).toBe("zh");
    expect(readStoredUiLocale()).toBe("zh");
    localStorage.removeItem(UI_LOCALE_STORAGE_KEY);
    expect(resolveInitialLocale()).toBe("en");
  });

  it("speechLocaleFromUi maps UI locale to STT BCP-47 tags", () => {
    expect(speechLocaleFromUi("zh")).toBe("zh-CN");
    expect(speechLocaleFromUi("zh-CN")).toBe("zh-CN");
    expect(speechLocaleFromUi("en")).toBe("en-US");
    expect(speechLocaleFromUi("en-US")).toBe("en-US");
    expect(speechLocaleFromUi(null)).toBe("zh-CN");
  });

  it("detectBrowserLocale maps YYC³ pack locales", () => {
    vi.stubGlobal("navigator", { language: "ja-JP", languages: ["ja-JP"] });
    expect(detectBrowserLocale()).toBe("ja");
    vi.stubGlobal("navigator", { language: "pt", languages: ["pt"] });
    expect(detectBrowserLocale()).toBe("pt-BR");
    vi.stubGlobal("navigator", { language: "zh-TW", languages: ["zh-TW"] });
    expect(detectBrowserLocale()).toBe("zh-TW");
    vi.stubGlobal("navigator", { language: "ar", languages: ["ar-EG"] });
    expect(detectBrowserLocale()).toBe("ar");
  });

  it("speechLocaleFromUi maps YYC³ pack locales to BCP-47", () => {
    expect(speechLocaleFromUi("ja")).toBe("ja-JP");
    expect(speechLocaleFromUi("pt-BR")).toBe("pt-BR");
    expect(speechLocaleFromUi("zh-TW")).toBe("zh-TW");
    expect(speechLocaleFromUi("ar")).toBe("ar");
  });
});
