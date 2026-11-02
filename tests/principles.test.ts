/**
 * The kit's browser modules end up in every game's bundle, so they follow the label's rule:
 * no network at all. (checks.ts and vite.ts run only in tests and builds; node/ only on the server.)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findNetworkUse } from '../src/checks';

const SHIPPED = ['platform.ts', 'storage.ts', 'i18n.ts', 'splash.ts', 'install.ts', 'updates.ts', 'characters.ts'];
const src = new URL('../src/', import.meta.url);

describe('no network in shipped code', () => {
  it('every source file is classified', () => {
    expect(readdirSync(src).sort()).toEqual([...SHIPPED, 'checks.ts', 'vite.ts'].sort());
  });

  it('shipped modules use no network API or remote URL', () => {
    const files = Object.fromEntries(SHIPPED.map((f) => [f, readFileSync(new URL(f, src), 'utf8')]));
    expect(findNetworkUse(files)).toEqual([]);
  });

  it('every export points to a file', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { exports: Record<string, string> };
    for (const target of Object.values(pkg.exports)) {
      const source = target.replace('./dist/', './src/').replace(/\.js$/, '.ts');
      expect(() => readFileSync(new URL(`../${source}`, import.meta.url)), target).not.toThrow();
    }
  });
});
