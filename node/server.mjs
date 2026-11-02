// Minimal static server for a built game (its dist/ folder). No dependencies.
// Used for hosting the web version (Clever Cloud): `npm run build`, then `npm start`.
// A game's server.mjs is then just:
//
//   import { serveGame } from '@travellingkorrigan/kit/server';
//   serveGame({ title: 'Pebble Tide', root: new URL('./dist/', import.meta.url) });
//
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * @typedef {object} GameServerOptions
 * @property {string} title The game's name, e.g. "Pebble Tide".
 * @property {string | URL} root The built game (dist/).
 * @property {string} [umamiWebsiteId] The game's website in Umami. UMAMI_WEBSITE_ID overrides it.
 * @property {string} [umamiHost] UMAMI_HOST overrides it.
 * @property {boolean} [counting] Whether to count plays. Default: production only, unless UMAMI_DISABLED is set.
 * @property {(url: string, init: RequestInit) => Promise<unknown>} [send] How hits are sent (tests replace it).
 */

// --- Anonymous play counts (author's decision) ---------------------------------------------
// The game itself never connects to anything. This server, which hosts the web version, counts
// two kinds of requests it receives anyway and forwards a bare hit to the author's Umami:
//   - the game page (index.html): a first load, i.e. a new player or a cleared cache;
//   - the service worker (sw.js): the installed or cached game being opened while online.
// Nothing about the player is sent: no IP address, no cookie, no identifier, no referrer,
// no language, no screen size, not even the player's user agent. Only in production.
export function playKind(path) {
  if (path === '/' || path === '/index.html') return 'first-load';
  if (path === '/sw.js') return 'launch';
  return null;
}

/** The hit sent to Umami: nothing about the player. */
export function playPayload(kind, { website, hostname, title }) {
  const payload = { website, hostname, url: '/', title, language: '', screen: '', referrer: '' };
  if (kind === 'launch') payload.name = 'launch';
  return { type: 'event', payload };
}

/** @param {GameServerOptions} options */
export function createGameServer(options) {
  const root = normalize(options.root instanceof URL ? fileURLToPath(options.root) : options.root).replace(/[\\/]+$/, '');
  const slug = options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const umamiHost = process.env.UMAMI_HOST ?? options.umamiHost ?? 'https://analytics.lostinbrittany.dev';
  const website = process.env.UMAMI_WEBSITE_ID ?? options.umamiWebsiteId ?? '';
  const counting = (options.counting ?? (process.env.NODE_ENV === 'production' && !process.env.UMAMI_DISABLED)) && umamiHost && website;
  const send = options.send ?? fetch;
  const userAgent = `Mozilla/5.0 (X11; Linux x86_64) ${options.title.replace(/[^A-Za-z0-9]/g, '')}/1.0`;

  function countPlay(kind, hostname) {
    if (!counting) return;
    Promise.resolve()
      .then(() =>
        send(`${umamiHost}/api/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent },
          body: JSON.stringify(playPayload(kind, { website, hostname, title: options.title })),
          signal: AbortSignal.timeout(5000),
        }),
      )
      .catch(() => {}); // counting must never affect serving the game
  }

  async function resolveFile(urlPath) {
    let path;
    try {
      path = decodeURIComponent(urlPath.split('?')[0]);
    } catch {
      return null;
    }
    const file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) return null; // no escaping dist/
    try {
      const info = await stat(file);
      if (info.isDirectory()) return resolveFile(join(path, 'index.html'));
      return { file, size: info.size };
    } catch {
      return null;
    }
  }

  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const found = await resolveFile(req.url || '/');
    if (!found) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    if (req.method === 'GET') {
      const kind = playKind((req.url || '/').split('?')[0]);
      if (kind) countPlay(kind, (req.headers.host || slug).split(':')[0]);
    }
    // Files under assets/ have a content hash in their name, so they can be cached for good.
    const immutable = found.file.startsWith(join(root, 'assets') + sep);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(found.file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': found.size,
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(found.file).pipe(res);
  });
}

/** Serves the game on PORT (default 8080) and HOST (default 0.0.0.0). @param {GameServerOptions} options */
export function serveGame(options) {
  const root = options.root instanceof URL ? fileURLToPath(options.root) : options.root;
  if (!existsSync(join(root, 'index.html'))) {
    console.error(`${join(root, 'index.html')} not found: run \`npm run build\` before \`npm start\`.`);
    process.exit(1);
  }
  const port = Number(process.env.PORT) || 8080;
  const host = process.env.HOST || '0.0.0.0';
  const server = createGameServer(options);
  server.listen(port, host, () => console.log(`${options.title} on http://${host}:${port}`));
  return server;
}
