// All player-facing texts. Czech is the default; other languages are selected with ?lang=en.
// To add a language: copy en.tsx, translate it and register it in LANGUAGES.
import { cs, type Texts } from "./cs";
import { en } from "./en";

export type { Texts };
export const LANGUAGES = { cs, en } satisfies Record<string, Texts>;
export type Lang = keyof typeof LANGUAGES;
export const DEFAULT_LANG: Lang = "cs";

function pickLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const requested = new URLSearchParams(window.location.search).get("lang");
  return requested && requested in LANGUAGES ? (requested as Lang) : DEFAULT_LANG;
}

/** Texts for the current language, chosen once on page load. */
export const t: Texts = LANGUAGES[pickLang()];

/** Probability 0–1 as a percentage in the current language, e.g. "12,5 %" / "12.5%". */
export function formatPercent(value: number, digits = 0) {
  return new Intl.NumberFormat(t.locale, { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatNumber(value: number) {
  return value.toLocaleString(t.locale);
}
