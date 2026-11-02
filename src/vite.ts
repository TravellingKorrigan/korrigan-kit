/** Build-time helpers for the games' vite.config.ts. Nothing here ships to the player. */
import type { Plugin } from 'vite';

/**
 * The page's Content-Security-Policy: no network connection at all, and no resource that isn't
 * shipped with the game. The "no network requests" principle is then enforced by the browser,
 * not only by code review.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/**
 * Adds the policy to the built page, right after `<meta charset="UTF-8" />` (which index.html
 * must contain). Dev mode is left without it because Vite's hot reload uses a websocket.
 */
export function contentSecurityPolicy(): Plugin {
  const charset = '<meta charset="UTF-8" />';
  return {
    name: 'korrigan-csp',
    apply: 'build',
    transformIndexHtml(html) {
      if (!html.includes(charset)) throw new Error(`korrigan-csp: index.html needs ${charset}`);
      return html.replace(charset, `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`);
    },
  };
}

/**
 * Values for Vite's `define`: the game's version and build time (UTC, "YYYY-MM-DD HH:MM"),
 * shown in the menu so a player can tell whether an update has arrived.
 * Declare them in the game: `declare const __APP_VERSION__: string; declare const __BUILD_TIME__: string;`
 */
export function buildInfo(version: string, now: Date = new Date()): Record<string, string> {
  return {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(now.toISOString().slice(0, 16).replace('T', ' ')),
  };
}
