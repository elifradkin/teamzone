import type { Direction, Locale } from "../types/enums.js";
import en from "./en.json" with { type: "json" };
import he from "./he.json" with { type: "json" };

export const catalogs = { en, he } as const;
export type Catalog = typeof en;

/** Hebrew is RTL; English is LTR. */
export function directionFor(locale: Locale): Direction {
  return locale === "he" ? "rtl" : "ltr";
}

export function isRtl(locale: Locale): boolean {
  return directionFor(locale) === "rtl";
}

/**
 * Resolve a dot-path key for a locale, falling back to English, then the key
 * itself. No hardcoded display strings live in components (CLAUDE.md Rule 3).
 */
export function translate(locale: Locale, key: string): string {
  return lookup(catalogs[locale], key) ?? lookup(catalogs.en, key) ?? key;
}

function lookup(obj: unknown, key: string): string | undefined {
  let cur: unknown = obj;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}
