import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module, no type declarations
import { buildNumber, syncVersion, versionMismatches } from '../node/version.mjs';

function game(version: string): string {
  const root = mkdtempSync(join(tmpdir(), 'kit-version-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ version }));
  mkdirSync(join(root, 'android/app'), { recursive: true });
  writeFileSync(join(root, 'android/app/build.gradle'), 'versionCode 1\nversionName "1.0"\n');
  mkdirSync(join(root, 'ios/App/App.xcodeproj'), { recursive: true });
  writeFileSync(join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'MARKETING_VERSION = 1.0;\nCURRENT_PROJECT_VERSION = 1;\nMARKETING_VERSION = 1.0;\n');
  return root;
}

describe('version sync', () => {
  it('turns semver into a growing build number', () => {
    expect(buildNumber('0.2.0')).toBe(200);
    expect(buildNumber('1.0.0')).toBe(10000);
    expect(() => buildNumber('1.0')).toThrow();
    expect(() => buildNumber('0.100.0')).toThrow();
  });

  it('writes the version into both native projects and then finds them in step', () => {
    const root = game('0.3.4');
    expect(versionMismatches(root)).toHaveLength(4);
    expect(syncVersion(root)).toMatchObject({ version: '0.3.4', build: 304 });
    expect(readFileSync(join(root, 'android/app/build.gradle'), 'utf8')).toContain('versionCode 304');
    expect(readFileSync(join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8').match(/MARKETING_VERSION = 0.3.4;/g)).toHaveLength(2);
    expect(versionMismatches(root)).toEqual([]);
  });
});
