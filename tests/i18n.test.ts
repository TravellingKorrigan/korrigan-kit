import { describe, expect, it } from 'vitest';
import { createI18n, detectLang, isLang } from '../src/i18n';

const strings = {
  en: { hello: 'Hello {name}', only: 'English only', step: 'He steps back', 'step@korriganez': 'She steps back' },
  fr: { hello: 'Bonjour {name}', only: '', step: 'Il recule', 'step@korriganez': 'Elle recule' },
  es: { hello: 'Hola {name}', step: 'Él retrocede' },
};

describe('i18n', () => {
  it('detects the first supported language', () => {
    expect(detectLang(['de-DE', 'fr-CA', 'en'])).toBe('fr');
    expect(detectLang(['de'])).toBe('en');
    expect(isLang('es')).toBe(true);
    expect(isLang('toString')).toBe(false);
  });

  it('translates, fills placeholders and falls back to English, then the key', () => {
    const i18n = createI18n(strings);
    i18n.setLang('fr');
    expect(i18n.getLang()).toBe('fr');
    expect(i18n.t('hello', { name: 'Anna' })).toBe('Bonjour Anna');
    expect(i18n.t('hello')).toBe('Bonjour {name}');
    expect(i18n.t('only')).toBe('English only');
    expect(i18n.t('missing')).toBe('missing');
  });

  it('uses the variant when it exists, in the language or else in English', () => {
    const i18n = createI18n(strings);
    i18n.setVariant('korriganez');
    i18n.setLang('fr');
    expect(i18n.t('step')).toBe('Elle recule');
    i18n.setLang('es');
    expect(i18n.t('step')).toBe('She steps back');
    i18n.setVariant(null);
    expect(i18n.t('step')).toBe('Él retrocede');
  });
});
