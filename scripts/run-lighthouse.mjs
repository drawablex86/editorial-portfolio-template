import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isDesktopOnly = process.argv.includes('--desktop');
const isMobileOnly = process.argv.includes('--mobile');

const runDesktop = isDesktopOnly || (!isDesktopOnly && !isMobileOnly);
const runMobile = isMobileOnly || (!isDesktopOnly && !isMobileOnly);

const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const chromePath = '/tmp/chrome-bin/chrome/mac_arm-155.0.8059.39/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
process.env.CHROME_PATH = chromePath;

console.log('Using Chromium Browser at:', chromePath);
console.log(`Starting Lighthouse Audit: Desktop=${runDesktop}, Mobile=${runMobile}`);

function runLighthouse(preset, outputFileBase) {
  return new Promise((resolve, reject) => {
    const reportHtmlPath = path.join(reportsDir, `${outputFileBase}.html`);
    const reportJsonPath = path.join(reportsDir, `${outputFileBase}.json`);

    const flags = [
      'http://localhost:4173/',
      '--output=html,json',
      `--output-path=${path.join(reportsDir, outputFileBase)}`,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--quiet',
    ];

    if (preset === 'desktop') {
      flags.push('--preset=desktop');
    }

    console.log(`\n========================================`);
    console.log(`Running Lighthouse audit [${preset.toUpperCase()}]...`);
    console.log(`========================================`);

    const child = spawn('lighthouse', flags, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const raw = fs.readFileSync(reportJsonPath, 'utf8');
          const data = JSON.parse(raw);
          const cats = data.categories;
          const audits = data.audits;

          console.log(`\n📊 [${preset.toUpperCase()}] LIGHTHOUSE RESULTS:`);
          console.log(`- Performance:     ${Math.round(cats.performance.score * 100)} / 100`);
          console.log(`- Accessibility:   ${Math.round(cats.accessibility.score * 100)} / 100`);
          console.log(`- Best Practices:  ${Math.round(cats['best-practices'].score * 100)} / 100`);
          console.log(`- SEO:             ${Math.round(cats.seo.score * 100)} / 100`);

          console.log(`\n⚡ Core Web Vitals [${preset.toUpperCase()}]:`);
          console.log(`- First Contentful Paint (FCP):  ${audits['first-contentful-paint'].displayValue}`);
          console.log(`- Largest Contentful Paint (LCP):${audits['largest-contentful-paint'].displayValue}`);
          console.log(`- Total Blocking Time (TBT):     ${audits['total-blocking-time'].displayValue}`);
          console.log(`- Cumulative Layout Shift (CLS): ${audits['cumulative-layout-shift'].displayValue}`);
          console.log(`- Speed Index (SI):              ${audits['speed-index'].displayValue}`);

          resolve(data);
        } catch (err) {
          console.error('Error parsing report json:', err);
          resolve(null);
        }
      } else {
        reject(new Error(`Lighthouse exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    if (runDesktop) {
      await runLighthouse('desktop', 'lighthouse-desktop');
    }
    if (runMobile) {
      await runLighthouse('mobile', 'lighthouse-mobile');
    }
    console.log('\n✅ All audits completed. Reports written to reports/ directory.');
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

main();
