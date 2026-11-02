/**
 * Checks for the games' tests: the label's principles, written once.
 * Each game feeds its own files in (e.g. with import.meta.glob(..., { query: '?raw' })).
 */

/** Network APIs the shipped code must never use. */
export const FORBIDDEN_APIS: readonly RegExp[] = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /EventSource/,
  /sendBeacon/,
  /importScripts/,
  /navigator\.connection/,
];

/**
 * URLs allowed in shipped code. SVG namespace identifiers look like URLs but are never fetched.
 * The label's website is a plain link in the menu, opened in the browser only if the player
 * taps it; nothing is ever loaded from it (the CSP still blocks every connection).
 */
export const ALLOWED_URLS: readonly string[] = ['http://www.w3.org/2000/svg', 'https://travellingkorrigan.com'];

const URL_PATTERN = /(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)]*/gi;

export interface NetworkUse {
  file: string;
  found: string;
}

/** Every network API or remote URL in the given files (path -> text). Empty means clean. */
export function findNetworkUse(files: Record<string, string>, allowedUrls: readonly string[] = ALLOWED_URLS): NetworkUse[] {
  const problems: NetworkUse[] = [];
  for (const [file, text] of Object.entries(files)) {
    for (const pattern of FORBIDDEN_APIS) {
      const match = text.match(pattern);
      if (match) problems.push({ file, found: match[0] });
    }
    for (const url of text.match(URL_PATTERN) ?? []) {
      if (!allowedUrls.includes(url)) problems.push({ file, found: url });
    }
  }
  return problems;
}

export interface KeyGaps {
  /** Keys English has and this language lacks. */
  missing: string[];
  /** Keys this language has and English doesn't. */
  extra: string[];
}

/** For each language other than English, the keys that differ from English. Empty means complete. */
export function translationGaps(strings: Record<string, Record<string, string>>, reference = 'en'): Record<string, KeyGaps> {
  const base = new Set(Object.keys(strings[reference] ?? {}));
  const gaps: Record<string, KeyGaps> = {};
  for (const [lang, table] of Object.entries(strings)) {
    if (lang === reference) continue;
    const keys = new Set(Object.keys(table));
    const missing = [...base].filter((k) => !keys.has(k)).sort();
    const extra = [...keys].filter((k) => !base.has(k)).sort();
    if (missing.length || extra.length) gaps[lang] = { missing, extra };
  }
  return gaps;
}
