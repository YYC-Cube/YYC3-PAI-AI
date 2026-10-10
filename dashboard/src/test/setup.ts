/**
 * Vitest jsdom setup.
 *
 * Antd's components rely on a few browser APIs jsdom doesn't ship:
 *   - ``window.matchMedia`` (used by Grid responsive breakpoints)
 *   - ``ResizeObserver`` (used by Card/Drawer/Modal portals)
 *   - ``IntersectionObserver`` (used by virtual lists)
 *
 * Recharts also wants ``ResizeObserver`` for the ``ResponsiveContainer``;
 * it'll log a console error otherwise even though our snapshot tests
 * don't actually render the chart at a real size.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Auto-mock react-i18next so components' ``t(key, fallback)`` calls
// resolve synchronously to ``fallback`` without needing the real
// i18n module (which would async-fetch tool labels and add 1-2s of
// console noise per test file).
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();

  type TOptions = Record<string, unknown> & { defaultValue?: string };

  // Interpolate ``{{name}}`` placeholders like real i18next so tests can
  // assert user-visible copy such as "已捕获 42 条对话记忆".
  const interpolate = (template: string, options?: TOptions): string => {
    if (!options) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
      name in options ? String(options[name]) : match,
    );
  };

  // ``t`` must keep a STABLE identity across renders: components that list
  // ``t`` in effect deps (e.g. MBTISelector) would otherwise re-run their
  // effects on every render — an infinite fetch loop that pins the worker
  // CPU and starves sibling test files under parallel execution. Real
  // i18next also returns a stable ``t``.
  const translate = (
    key: string,
    fallback?: string | TOptions,
    options?: TOptions,
  ): string => {
    if (typeof fallback === "string") return interpolate(fallback, options);
    if (fallback && typeof fallback === "object") {
      const template = fallback.defaultValue ?? key;
      return interpolate(template, fallback);
    }
    return key;
  };

  const i18nStub = {
    language: "zh",
    changeLanguage: () => Promise.resolve(),
  };

  return {
    ...actual,
    useTranslation: () => ({ t: translate, i18n: i18nStub }),
    Trans: ({ children }: { children?: React.ReactNode }) => children,
  };
});

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  // matchMedia
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  // ResizeObserver
  class _ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  if (!window.ResizeObserver) {
    (
      window as unknown as { ResizeObserver: typeof _ResizeObserver }
    ).ResizeObserver = _ResizeObserver;
  }

  // IntersectionObserver
  class _IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  }
  if (!window.IntersectionObserver) {
    (
      window as unknown as {
        IntersectionObserver: typeof _IntersectionObserver;
      }
    ).IntersectionObserver = _IntersectionObserver;
  }

  // pdf.js (pulled in via react-pdf) evaluates ``new DOMMatrix()`` at module
  // scope, but jsdom doesn't implement DOMMatrix. Stub the spec surface the
  // bundle touches — tests import the module chain but never render a real
  // PDF canvas.
  if (typeof globalThis.DOMMatrix === "undefined") {
    class DOMMatrixStub {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      static fromMatrix(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      static fromFloat32Array(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      static fromFloat64Array(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      multiply(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      inverse(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      translate(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      scale(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      rotate(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      rotateAxisAngle(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      skewX(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      skewY(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      flipX(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      flipY(): DOMMatrixStub {
        return new DOMMatrixStub();
      }
      transformPoint(): { x: number; y: number; z: number; w: number } {
        return { x: 0, y: 0, z: 0, w: 1 };
      }
    }
    (globalThis as { DOMMatrix?: unknown }).DOMMatrix = DOMMatrixStub;
  }

  // jsdom doesn't implement ``getComputedStyle().transition`` properly,
  // so antd's wave / motion can throw — silence that one noisy console
  // warning without hiding real errors.
  const _origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (
      typeof first === "string" &&
      (first.includes(
        "Not implemented: HTMLFormElement.prototype.requestSubmit",
      ) ||
        first.includes("React does not recognize the") ||
        first.includes("antd: ") ||
        first.includes("[antd:"))
    ) {
      return;
    }
    _origError(...args);
  };
}
