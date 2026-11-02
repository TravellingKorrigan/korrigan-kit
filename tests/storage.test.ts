import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalStore } from '../src/storage';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('local store', () => {
  it('saves JSON under the game prefix', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    const store = createLocalStore('menhir-shepherd:');
    store.set('settings', { muted: true });
    expect(storage.getItem('menhir-shepherd:settings')).toBe('{"muted":true}');
    expect(store.get<{ muted: boolean }>('settings')).toEqual({ muted: true });
    store.remove('settings');
    expect(store.get('settings')).toBeNull();
  });

  it('never throws when storage is missing, full or corrupt', () => {
    vi.stubGlobal('localStorage', undefined);
    const store = createLocalStore('x:');
    expect(() => store.set('a', 1)).not.toThrow();
    expect(store.get('a')).toBeNull();
    expect(() => store.remove('a')).not.toThrow();
    const storage = fakeStorage();
    storage.setItem('x:bad', '{nope');
    vi.stubGlobal('localStorage', storage);
    expect(store.get('bad')).toBeNull();
  });
});
