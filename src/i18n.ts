/**
 * UI strings, one JSON file per language in each game. Keys missing from a language fall back
 * to English, then to the key itself. A placeholder "{name}" is filled from the params.
 * A variant (the chosen character, e.g. "korriganez") makes "<key>@<variant>" replace "<key>"
 * when it exists: sentences about her or him.
 */
export const LANGUAGES = { en: 'English', fr: 'Français', es: 'Español' } as const;
export type Lang = keyof typeof LANGUAGES;
export type Strings = Record<string, string>;

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value);
}

/** Picks the first supported language from the browser's preferences, else English. */
export function detectLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'en';
}

export interface I18n {
  t(key: string, params?: Record<string, string | number>): string;
  setLang(lang: Lang): void;
  getLang(): Lang;
  setVariant(variant: string | null): void;
  readonly strings: Readonly<Record<Lang, Strings>>;
}

export function createI18n(strings: Record<Lang, Strings>): I18n {
  let current: Lang = 'en';
  let variant: string | null = null;
  const lookup = (lang: Lang, key: string): string | undefined => strings[lang][key] || undefined;
  return {
    t(key, params = {}) {
      const special = variant ? `${key}@${variant}` : null;
      const template =
        (special && (lookup(current, special) ?? lookup('en', special))) || lookup(current, key) || lookup('en', key) || key;
      return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
    },
    setLang(lang) {
      current = lang;
    },
    getLang: () => current,
    setVariant(next) {
      variant = next;
    },
    strings,
  };
}
