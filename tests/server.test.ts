import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module, no type declarations
import { createGameServer, playPayload } from '../node/server.mjs';

const root = mkdtempSync(join(tmpdir(), 'kit-server-'));
mkdirSync(join(root, 'assets'));
writeFileSync(join(root, 'index.html'), '<!doctype html><title>Game</title>');
writeFileSync(join(root, 'sw.js'), '// sw');
writeFileSync(join(root, 'stone.webp'), 'webp');
writeFileSync(join(root, 'assets', 'app-1a2b.js'), 'export {}');

const hits: { url: string; body: unknown; headers: Record<string, string> }[] = [];
const server = createGameServer({
  title: 'Menhir Shepherd',
  root,
  umamiWebsiteId: 'site-id',
  umamiHost: 'https://umami.invalid',
  counting: true,
  send: async (url: string, init: { body: string; headers: Record<string, string> }) => {
    hits.push({ url, body: JSON.parse(init.body), headers: init.headers });
  },
});
let base = '';

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('game server', () => {
  it('serves the page, with types and cache rules', async () => {
    const page = await fetch(`${base}/`);
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(page.headers.get('cache-control')).toBe('no-cache');
    expect(page.headers.get('referrer-policy')).toBe('no-referrer');
    expect((await fetch(`${base}/stone.webp`)).headers.get('content-type')).toBe('image/webp');
    expect((await fetch(`${base}/assets/app-1a2b.js`)).headers.get('cache-control')).toContain('immutable');
  });

  it('refuses other methods, missing files and paths out of the folder', async () => {
    expect((await fetch(`${base}/`, { method: 'POST' })).status).toBe(405);
    expect((await fetch(`${base}/nope.js`)).status).toBe(404);
    expect((await fetch(`${base}/..%2f..%2fetc%2fpasswd`)).status).toBe(404);
  });

  it('counts first loads and launches, with nothing about the player', async () => {
    hits.length = 0;
    await fetch(`${base}/index.html`, { headers: { 'Accept-Language': 'fr', 'User-Agent': 'PlayerPhone' } });
    await fetch(`${base}/sw.js`);
    await fetch(`${base}/stone.webp`);
    await new Promise((r) => setTimeout(r, 20));
    expect(hits).toHaveLength(2);
    expect(hits[0]!.url).toBe('https://umami.invalid/api/send');
    expect(hits[0]!.headers['User-Agent']).toBe('Mozilla/5.0 (X11; Linux x86_64) MenhirShepherd/1.0');
    expect(hits[0]!.body).toEqual(playPayload('first-load', { website: 'site-id', hostname: '127.0.0.1', title: 'Menhir Shepherd' }));
    expect(hits[1]!.body).toMatchObject({ payload: { name: 'launch' } });
    expect(JSON.stringify(hits)).not.toMatch(/PlayerPhone|"fr"/);
  });
});
