/**
 * Optional "Install the game" offer. Shown only where installing is possible and the game isn't
 * installed yet: in the menu, and discreetly on the end-of-level screen until the player
 * dismisses it. On iPhone (no install prompt) it shows the Share > Add to Home Screen tip instead.
 * Never a popup, never repeated after "Don't show again".
 *
 * Markup it looks for: buttons with [data-install], tips with [data-install-tip], and the ids below.
 */
import { isNativeApp } from './platform';
import type { KeyValueStore } from './storage';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallOfferIds {
  /** The install button in the menu. */
  menuButton?: string;
  /** The discreet offer on the end-of-level screen. */
  endOffer?: string;
  /** Its "Don't show again" button. */
  dismiss?: string;
}

const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

export class InstallOffer {
  private prompt: InstallPromptEvent | null = null;
  private readonly ids: Required<InstallOfferIds>;

  constructor(
    private readonly store: KeyValueStore,
    ids: InstallOfferIds = {},
  ) {
    this.ids = { menuButton: 'menu-install', endOffer: 'win-install', dismiss: 'install-dismiss', ...ids };
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // we offer it ourselves, quietly
      this.prompt = e as InstallPromptEvent;
      this.render();
    });
    window.addEventListener('appinstalled', () => {
      this.prompt = null;
      this.render();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-install]').forEach((b) => b.addEventListener('click', () => void this.install()));
    document.getElementById(this.ids.dismiss)?.addEventListener('click', () => {
      this.store.set('installDismissed', true);
      this.render();
    });
    this.render();
  }

  /** Whether the game can be offered for install on this device right now. */
  get available(): boolean {
    if (isNativeApp()) return false; // already an installed app
    return !isInstalled() && (this.prompt !== null || isIos());
  }

  private async install(): Promise<void> {
    if (this.prompt) {
      const event = this.prompt;
      this.prompt = null;
      await event.prompt();
      await event.userChoice.catch(() => undefined);
    } else if (isIos()) {
      document.querySelectorAll<HTMLElement>('[data-install-tip]').forEach((tip) => (tip.hidden = false));
    }
    this.render();
  }

  render(): void {
    const can = this.available;
    const menuButton = document.getElementById(this.ids.menuButton);
    if (menuButton) menuButton.hidden = !can;
    const endOffer = document.getElementById(this.ids.endOffer);
    if (endOffer) endOffer.hidden = !can || this.store.get<boolean>('installDismissed') === true;
    if (!can) document.querySelectorAll<HTMLElement>('[data-install-tip]').forEach((tip) => (tip.hidden = true));
  }
}
