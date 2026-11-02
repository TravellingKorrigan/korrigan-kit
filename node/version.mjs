// The game's version (package.json, semver) in the Android and iOS projects, so the stores show
// the same version as the menu. The build number the stores require to grow with every upload
// comes from it too: major * 10000 + minor * 100 + patch (0.2.0 -> 200, 1.0.0 -> 10000).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GRADLE = 'android/app/build.gradle';
const PBXPROJ = 'ios/App/App.xcodeproj/project.pbxproj';

export function buildNumber(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`package.json version must be semver (x.y.z), found: ${version}`);
  const [, major, minor, patch] = match.map(Number);
  if (minor > 99 || patch > 99) throw new Error(`minor and patch must stay below 100: ${version}`);
  return major * 10000 + minor * 100 + patch;
}

const readVersion = (root) => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

/** Writes the version into the native projects that exist under root. Returns what it did. */
export function syncVersion(root = process.cwd()) {
  const version = readVersion(root);
  const build = buildNumber(version);
  const touched = [];
  const gradle = join(root, GRADLE);
  if (existsSync(gradle)) {
    writeFileSync(gradle, readFileSync(gradle, 'utf8')
      .replace(/versionCode \d+/, `versionCode ${build}`)
      .replace(/versionName "[^"]*"/, `versionName "${version}"`));
    touched.push(GRADLE);
  }
  const pbx = join(root, PBXPROJ);
  if (existsSync(pbx)) {
    writeFileSync(pbx, readFileSync(pbx, 'utf8')
      .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
      .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`));
    touched.push(PBXPROJ);
  }
  return { version, build, touched };
}

/** For the games' tests: what disagrees with package.json (empty means in step). */
export function versionMismatches(root = process.cwd()) {
  const version = readVersion(root);
  const problems = [];
  if (!/^\d+\.\d+\.\d+$/.test(version)) return [`package.json version is not semver: ${version}`];
  const build = buildNumber(version);
  const expect = (path, needles) => {
    const file = join(root, path);
    if (!existsSync(file)) return;
    const text = readFileSync(file, 'utf8');
    for (const needle of needles) if (!text.includes(needle)) problems.push(`${path} lacks ${needle}`);
  };
  expect(GRADLE, [`versionName "${version}"`, `versionCode ${build}`]);
  expect(PBXPROJ, [`MARKETING_VERSION = ${version};`, `CURRENT_PROJECT_VERSION = ${build};`]);
  return problems;
}
