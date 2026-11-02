/**
 * Launch splash. It is in the HTML (an element with id "splash") so it shows instantly; the game
 * is ready behind it. It leaves after a short moment or at the first tap or key press, whichever
 * comes first, and that first tap never reaches the game.
 */
export interface SplashOptions {
  /** How long the splash stays without a tap. */
  showMs?: number;
  /** The fade, matching the CSS transition on ".is-leaving" (skipped with reduced motion). */
  fadeMs?: number;
  id?: string;
}

export function dismissSplashSoon(onGone?: () => void, options: SplashOptions = {}): void {
  const { showMs = 1500, fadeMs = 400, id = 'splash' } = options;
  const splash = document.getElementById(id);
  if (!splash) {
    onGone?.();
    return;
  }
  let gone = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dismiss = () => {
    if (gone) return;
    gone = true;
    window.removeEventListener('keydown', dismiss);
    splash.classList.add('is-leaving');
    window.setTimeout(() => {
      splash.remove();
      onGone?.();
    }, reduceMotion ? 0 : fadeMs);
  };
  splash.addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
  });
  window.addEventListener('keydown', dismiss);
  window.setTimeout(dismiss, showMs);
}
