/**
 * Run tests against the Playwright-matched browser when installed.
 * When the chosen environment only provides an older cached Chromium,
 * allow a diagnostic CI fallback without changing production dependencies.
 * This is a temporary compatibility path, not release-parity evidence.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const env = { ...process.env };
const expected = chromium.executablePath();
const exists = (p) => { try { return !!p && fs.statSync(p).isFile(); } catch { return false; } };
function findCachedBrowser() {
  const root = env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !fs.existsSync(root)) return null;
  const matches = fs.readdirSync(root)
    .filter(name => /^chromium_headless_shell-\d+$/.test(name))
    .sort((a,b) => Number(b.split('-').at(-1)) - Number(a.split('-').at(-1)));
  for (const name of matches) {
    for (const suffix of [
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-linux/headless_shell'
    ]) {
      const file = path.join(root, name, suffix);
      if (exists(file)) return file;
    }
  }
  return null;
}
if (env.CHROMIUM_EXECUTABLE) {
  if (!exists(env.CHROMIUM_EXECUTABLE)) {
    console.error('CHROMIUM_EXECUTABLE points to a missing binary:', env.CHROMIUM_EXECUTABLE);
    process.exit(1);
  }
} else if (!exists(expected)) {
  const fallback = findCachedBrowser();
  if (fallback) {
    env.CHROMIUM_EXECUTABLE = fallback;
    console.warn('WARNING: Playwright-matched Chromium unavailable:', expected);
    console.warn('Using older cached Chromium for development verification:', fallback);
    console.warn('Browser compatibility must be confirmed using the Playwright-matched revision before release.');
  } else {
    console.error('Chromium not available. Expected:', expected);
    console.error('Run npx playwright install chromium or use a correctly provisioned browser image.');
    process.exit(1);
  }
}
const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','test:raw'], {
  stdio: 'inherit', env, shell: false
});
if (result.error) { console.error(result.error); process.exit(1); }
process.exit(result.status ?? 1);
