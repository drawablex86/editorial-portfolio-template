#!/usr/bin/env node
/**
 * Lighthouse audit runner.
 *
 * Usage:
 *   npm run audit            # desktop + mobile
 *   npm run audit:desktop
 *   npm run audit:mobile
 *   node scripts/run-lighthouse.mjs --url http://localhost:4173/works
 *
 * Requires the site to be running (e.g. `npm run preview`). The runner checks
 * first and fails with a clear message rather than timing out inside Chrome.
 *
 * Portability notes:
 * - Chrome is located via `CHROME_PATH`, then common local install paths, then
 *   whatever Lighthouse can find itself (which includes puppeteer's cache).
 * - Lighthouse is resolved from the project's own `node_modules/.bin` so the
 *   audit does not depend on a global install.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const flagValue = (name, fallback) => {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
};

/** @type {boolean} */
const isDesktopOnly = hasFlag('--desktop');
const isMobileOnly = hasFlag('--mobile');
const runDesktop = isDesktopOnly || (!isDesktopOnly && !isMobileOnly);
const runMobile = isMobileOnly || (!isDesktopOnly && !isMobileOnly);

const targetUrl = flagValue('--url', 'http://localhost:4173/');
const reportsDir = path.join(process.cwd(), 'reports');

/**
 * Search `root` (up to `maxDepth` levels) for a path ending in `tailSegments`.
 *
 * Used only for Chrome-for-Testing trees, whose directory depth differs between
 * installers. Stops at the first match and ignores unreadable directories.
 */
function findFile(root, tailSegments, maxDepth, depth = 0) {
  if (!fs.existsSync(root) || depth > maxDepth) return null;

  const direct = path.join(root, ...tailSegments);
  if (fs.existsSync(direct)) return direct;

  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = findFile(path.join(root, entry.name), tailSegments, maxDepth, depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * Locate a usable Chrome binary, or return null to let Lighthouse decide.
 *
 * An explicit `CHROME_PATH` always wins, since that is how CI images pin a
 * browser. The candidate list covers a default macOS install plus the
 * Chrome-for-Testing layout used by some local setups.
 */
function resolveChromePath() {
  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];


  // Chrome for Testing nests the binary under a version directory whose depth
  // varies by installer (`@puppeteer/browsers` adds one more level), so search
  // a bounded tree for the bundle rather than hardcoding a layout.
  const cftRoots = ['/tmp/chrome-bin', path.join(process.cwd(), '.chrome')];
  const bundleTail = [
    'Google Chrome for Testing.app',
    'Contents',
    'MacOS',
    'Google Chrome for Testing',
  ];
  for (const root of cftRoots) {
    const found = findFile(root, bundleTail, 4);
    if (found) return found;
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Resolve Lighthouse from the project's own dependencies.
 *
 * Falls back to the bare command only so a globally installed copy still works;
 * the error path explains how to fix it if neither is present.
 */
function resolveLighthouseCommand() {
  const localBin = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse'
  );
  if (fs.existsSync(localBin)) return { command: localBin, viaLocal: true };
  return { command: 'lighthouse', viaLocal: false };
}

/** Fail early if the target is not serving, instead of inside Chrome. */
async function assertServerReachable(url) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status >= 500) {
      throw new Error(`responded with HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`\n❌ Cannot reach ${url}`);
    console.error(`   ${err instanceof Error ? err.message : String(err)}`);
    console.error('\nStart the site first, then re-run the audit:');
    console.error('   npm run build && npm run preview\n');
    process.exit(1);
  }
}

/**
 * Lighthouse suffixes reports when more than one format is requested, writing
 * `name.report.json` rather than `name.json`. Check both so this keeps working
 * if the output flag changes.
 */
function findReportJson(outputFileBase) {
  const candidates = [
    path.join(reportsDir, `${outputFileBase}.report.json`),
    path.join(reportsDir, `${outputFileBase}.json`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function runLighthouse(preset, outputFileBase) {
  return new Promise((resolve, reject) => {
    const { command } = resolveLighthouseCommand();

    const flags = [
      targetUrl,
      '--output=html,json',
      `--output-path=${path.join(reportsDir, outputFileBase)}`,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--quiet',
    ];

    if (preset === 'desktop') flags.push('--preset=desktop');

    console.log('\n========================================');
    console.log(`Running Lighthouse audit [${preset.toUpperCase()}] → ${targetUrl}`);
    console.log('========================================');

    const child = spawn(command, flags, { stdio: 'inherit', env: process.env });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'Lighthouse is not installed. Run `npm install` so the local ' +
              'devDependency is available, or install it globally.'
          )
        );
        return;
      }
      reject(err);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Lighthouse exited with code ${code}`));
        return;
      }
      const reportJsonPath = findReportJson(outputFileBase);
      if (!fs.existsSync(reportJsonPath)) {
        reject(
          new Error(
            'Lighthouse reported success but wrote no JSON report. ' +
              `Looked for ${reportJsonPath}.`
          )
        );
        return;
      }

      try {
        const data = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
        const { categories, audits } = data;
        const score = (key) => toScore(categories[key]?.score);

        console.log(`\n📊 [${preset.toUpperCase()}] LIGHTHOUSE RESULTS:`);
        console.log(`- Performance:     ${score('performance')} / 100`);
        console.log(`- Accessibility:   ${score('accessibility')} / 100`);
        console.log(`- Best Practices:  ${score('best-practices')} / 100`);
        console.log(`- SEO:             ${score('seo')} / 100`);

        console.log(`\n⚡ Core Web Vitals [${preset.toUpperCase()}]:`);
        console.log(`- First Contentful Paint (FCP):  ${audits['first-contentful-paint']?.displayValue ?? 'n/a'}`);
        console.log(`- Largest Contentful Paint (LCP):${audits['largest-contentful-paint']?.displayValue ?? 'n/a'}`);
        console.log(`- Total Blocking Time (TBT):     ${audits['total-blocking-time']?.displayValue ?? 'n/a'}`);
        console.log(`- Cumulative Layout Shift (CLS): ${audits['cumulative-layout-shift']?.displayValue ?? 'n/a'}`);
        console.log(`- Speed Index (SI):              ${audits['speed-index']?.displayValue ?? 'n/a'}`);

        resolve(data);
      } catch (err) {
        reject(new Error(`Could not parse ${reportJsonPath}: ${err.message}`));
      }
    });
  });
}

/** Lighthouse scores are 0–1 floats; render as a percentage, tolerating null. */
function toScore(score) {
  if (typeof score !== 'number') return 'n/a';
  return Math.round(score * 100);
}

async function main() {
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const chromePath = resolveChromePath();
  if (chromePath) {
    process.env.CHROME_PATH = chromePath;
    console.log('Using Chromium Browser at:', chromePath);
  } else {
    console.log('No explicit Chrome found; letting Lighthouse auto-detect one.');
  }

  const { viaLocal } = resolveLighthouseCommand();
  if (!viaLocal) {
    console.warn(
      '\n⚠️  Using a globally installed Lighthouse. Add it to devDependencies ' +
        'for reproducible audits.'
    );
  }

  await assertServerReachable(targetUrl);

  try {
    if (runDesktop) await runLighthouse('desktop', 'lighthouse-desktop');
    if (runMobile) await runLighthouse('mobile', 'lighthouse-mobile');
    console.log('\n✅ All audits completed. Reports written to reports/ directory.');
  } catch (err) {
    console.error('\nAudit failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
