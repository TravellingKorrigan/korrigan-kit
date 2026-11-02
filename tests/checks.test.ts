import { describe, expect, it } from 'vitest';
import { findNetworkUse, translationGaps } from '../src/checks';

describe('findNetworkUse', () => {
  it('flags network APIs and remote URLs', () => {
    const found = findNetworkUse({
      'a.ts': 'await fetch("/x")',
      'b.ts': 'new WebSocket(url)',
      'c.css': '@import url(https://fonts.example.com/font.css);',
      'd.ts': 'navigator.sendBeacon(u)',
    });
    expect(found.map((p) => p.file)).toEqual(['a.ts', 'b.ts', 'c.css', 'd.ts']);
  });

  it('allows the SVG namespace and the label website', () => {
    expect(
      findNetworkUse({
        'icon.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        'index.html': '<a href="https://travellingkorrigan.com">Travelling Korrigan</a>',
      }),
    ).toEqual([]);
  });
});

describe('translationGaps', () => {
  it('lists keys missing from or extra to each language', () => {
    expect(translationGaps({ en: { a: '', b: '' }, fr: { a: '', b: '' }, es: { a: '', c: '' } })).toEqual({
      es: { missing: ['b'], extra: ['c'] },
    });
  });
});
