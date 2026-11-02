# Korrigan Kit

Shared code for the games of [Travelling Korrigan](https://travellingkorrigan.com): small, calm games that work offline, with no ads and no tracking.

Free to play. Offline. No ads.

## Use

In a game's `package.json`, pinned to a tag:

```json
"dependencies": {
  "@travellingkorrigan/kit": "github:TravellingKorrigan/korrigan-kit#v0.1.0"
}
```

```ts
import { createI18n } from '@travellingkorrigan/kit/i18n';
import { createLocalStore } from '@travellingkorrigan/kit/storage';
import { setupUpdates } from '@travellingkorrigan/kit/updates';
import { registerSW } from 'virtual:pwa-register';

export const i18n = createI18n({ en, fr, es });
export const store = createLocalStore('menhir-shepherd:');
setupUpdates({ registerSW });
```

```js
// vite.config.ts
import { buildInfo, contentSecurityPolicy } from '@travellingkorrigan/kit/vite';
export default defineConfig({ define: buildInfo(pkg.version), plugins: [contentSecurityPolicy(), VitePWA({ ... })] });
```

```js
// server.mjs
import { serveGame } from '@travellingkorrigan/kit/server';
serveGame({ title: 'Menhir Shepherd', root: new URL('./dist/', import.meta.url), umamiWebsiteId: '...' });
```

```json
"scripts": { "version:sync": "korrigan-sync-version" }
```

See `CLAUDE.md` for the full list.

## Develop

```sh
npm install   # also builds dist/
npm test
npm run typecheck
```

## Licence

MIT. See `LICENSE`.
