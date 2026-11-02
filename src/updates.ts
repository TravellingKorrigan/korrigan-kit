/**
 * Quiet updates. A new version downloads in the background (service worker). The game asks for
 * it right at launch (browsers otherwise wait several seconds after a reload, by which time the
 * player has tapped and the update has to wait), and again when the player comes back to the
 * game after a while (an installed game can stay open for days without ever reloading).
 * It takes over:
 * - right away, if it is ready before the player's first tap in this session (at launch or
 *   after a reload, usually while the splash is showing), with one silent reload;
 * - otherwise as soon as the game goes to the background (the player switched app or locked the
 *   phone) or comes back from it: waiting for a fresh launch would keep the old version for days;
 * - or when the player taps "Update to the new version" in the menu (shown only then);
 * - never in the middle of play on screen.
 * The game must save after every move, so a reload never loses progress.
 */
import { isNativeApp } from './platform';

/** The shape of `registerSW` from vite-plugin-pwa's "virtual:pwa-register", which the game passes in. */
export type RegisterSW = (options: {
  immediate?: boolean;
  onRegisteredSW?: (url: string, registration: ServiceWorkerRegistration | undefined) => void;
  onNeedRefresh?: () => void;
}) => (reloadPage?: boolean) => Promise<void>;

export interface UpdateOptions {
  registerSW: RegisterSW;
  /** The menu button shown when an update is waiting. */
  buttonId?: string;
  /** Taps on this element (the splash) don't count as playing. */
  splashId?: string;
  /** Coming back to the game checks for a new version, at most this often. */
  recheckMs?: number;
}

export function setupUpdates(options: UpdateOptions): void {
  const { registerSW, buttonId = 'update-now', splashId = 'splash', recheckMs = 60 * 60 * 1000 } = options;
  // The app stores bring updates to the native app; its files are bundled, no service worker needed.
  if (!('serviceWorker' in navigator) || isNativeApp()) return;
  let playerActed = false;
  const markActed = (e: Event) => {
    // Dismissing the splash doesn't count as playing.
    if ((e.target as HTMLElement | null)?.closest?.(`#${splashId}`)) return;
    playerActed = true;
  };
  window.addEventListener('pointerdown', markActed, { capture: true });
  window.addEventListener('keydown', markActed, { capture: true });

  let waiting = false;
  let registration: ServiceWorkerRegistration | undefined;
  let lastCheck = 0;
  const check = () => {
    if (!registration || waiting || !navigator.onLine) return;
    lastCheck = Date.now();
    registration.update().catch(() => {}); // offline or server down: play on, try next time
  };
  // Take the waiting version: tell it to take over (the page then reloads itself); if it already
  // took over while the page was frozen in the background, just reload.
  const apply = () => {
    if (registration?.waiting) void updateSW(true);
    else window.location.reload();
  };
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      registration = r;
      check();
    },
    onNeedRefresh() {
      waiting = true;
      if (!playerActed) apply();
      // The player's own way to take it now: a quiet button by the version line in the menu.
      const button = document.getElementById(buttonId);
      if (button) button.hidden = false;
    },
  });
  document.getElementById(buttonId)?.addEventListener('click', apply);
  document.addEventListener('visibilitychange', () => {
    // Phones freeze a page in the background almost at once, so taking the update as the game is
    // left may not finish; coming back is a natural pause too.
    if (waiting) apply();
    else if (document.visibilityState === 'visible' && Date.now() - lastCheck > recheckMs) check();
  });
}
