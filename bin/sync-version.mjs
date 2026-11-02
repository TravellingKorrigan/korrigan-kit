#!/usr/bin/env node
// `korrigan-sync-version`: run from a game's folder (npm run version:sync).
import { syncVersion } from '../node/version.mjs';

const { version, build, touched } = syncVersion();
console.log(`version ${version}, build ${build}${touched.length ? ` (${touched.join(', ')})` : ' (no native project found)'}`);
