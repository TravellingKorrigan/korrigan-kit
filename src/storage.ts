/**
 * Small, non-critical saved state (settings and the game in progress).
 * Browser storage can be missing or wiped, so every call is guarded and the game
 * simply starts fresh if nothing comes back. The Capacitor build can swap this
 * for Capacitor Preferences behind the same interface.
 */
export interface KeyValueStore {
  get<T>(key: string): T | null;
  set(key: string, value: unknown): void;
  remove(key: string): void;
}

/** A store in localStorage, every key prefixed with the game's name (e.g. "pebble-tide:"). */
export function createLocalStore(prefix: string): KeyValueStore {
  const storage = (): Storage => globalThis.localStorage;
  return {
    get<T>(key: string): T | null {
      try {
        const raw = storage().getItem(prefix + key);
        return raw === null ? null : (JSON.parse(raw) as T);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        storage().setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Storage full or blocked: the game keeps working, it just won't resume.
      }
    },
    remove(key) {
      try {
        storage().removeItem(prefix + key);
      } catch {
        // ignore
      }
    },
  };
}
