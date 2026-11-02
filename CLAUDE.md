# Korrigan Kit: project brief

Shared code for the games of **Travelling Korrigan** (travellingkorrigan.com): Menhir Mahjong, Pebble Tide, Menhir Shepherd. Public, MIT licence (decided by the author). The games themselves stay private.

## The label's principles (decided, they bind this code too)

- **Fully offline**, including the first launch after install.
- **No ads, no tracking, no analytics, no network requests at all** from the game. Everything is bundled. A plain link to travellingkorrigan.com is allowed: it only opens if the player taps it.
- **Play counts happen on the server, never in the game**: `node/server.mjs` forwards a bare hit to the author's Umami when it serves the game page or the service worker, with nothing about the player (no IP, cookie, identifier, user agent, language or referrer).
- **No dark patterns. Free. Calm.**

## What is here

| Import | Runs in | What |
|---|---|---|
| `@travellingkorrigan/kit/platform` | browser | `isNativeApp()`: inside the Capacitor app or not |
| `@travellingkorrigan/kit/storage` | browser | `createLocalStore(prefix)`: guarded localStorage, never throws |
| `@travellingkorrigan/kit/i18n` | browser | `createI18n({ en, fr, es })`: `t()`, English fallback, character variants (`<key>@<variant>`), `detectLang()` |
| `@travellingkorrigan/kit/splash` | browser | `dismissSplashSoon()` |
| `@travellingkorrigan/kit/install` | browser | `InstallOffer`: the quiet "install the game" offer |
| `@travellingkorrigan/kit/updates` | browser | `setupUpdates({ registerSW })`: quiet service-worker updates |
| `@travellingkorrigan/kit/vite` | build | `contentSecurityPolicy()` plugin (`connect-src 'none'`), `buildInfo(version)` |
| `@travellingkorrigan/kit/checks` | tests | `findNetworkUse()`, `translationGaps()` for each game's principles test |
| `@travellingkorrigan/kit/server` | server | `serveGame({ title, root, umamiWebsiteId })`: the static server with play counts |
| `@travellingkorrigan/kit/version` | tests, scripts | `versionMismatches()`, `syncVersion()`; also the `korrigan-sync-version` command |

Browser code is TypeScript in `src/`, compiled to `dist/` when the kit is installed (`prepare`). Server and script code is plain JavaScript in `node/`, so it needs no build and no Node type package.

## How games use it

Installed from GitHub, pinned to a tag (no npm registry):

```json
"@travellingkorrigan/kit": "github:TravellingKorrigan/korrigan-kit#v0.1.0"
```

It goes in `dependencies` (not `devDependencies`), because Clever Cloud runs `server.mjs` from it.

## Working agreements

- Only code that at least two games really share comes here, and only once it has settled. Game rules, art, sounds and screens stay in the games.
- **Never a breaking change without a major version.** Games pin a tag; a new tag changes nothing until a game moves to it.
- **Semver, tagged at every merge** (`vX.Y.Z`, matching `package.json`). Bump the version in the PR (`npm version patch|minor --no-git-tag-version`): patch for fixes, minor for additions. Below 1.0.0, a minor may break, but say so in the PR. The tag is made by `.github/workflows/tag.yml` after the tests pass on `main`; never push tags by hand.
- Everything shipped to the browser stays network-free: `tests/principles.test.ts` checks it. A new browser module must be added to its list.
- Ask the author before adding any dependency. The kit has none at run time.
- Test everything that can run in Node. DOM-only parts (splash, install, updates) are kept thin.
- Small, focused commits with clear messages.
- Writing style for anything a player reads: no em or en dashes, no emojis, short direct sentences.
