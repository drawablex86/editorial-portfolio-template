#!/usr/bin/env node
/**
 * Setup Script for Media & AI Deterrence Pipeline
 * Run with: node scripts/setup-pipeline.mjs [--path=/path/to/vault] [--non-interactive]
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ROOT_DIR = process.cwd();
const SETTINGS_DIR = path.join(ROOT_DIR, 'content', 'settings');
const PIPELINE_SETTINGS_FILE = path.join(SETTINGS_DIR, 'pipeline.json');
const DEFAULT_LOCAL_VAULT = path.join(ROOT_DIR, '.pipeline-vault');

const KNOWN_T7_CANDIDATES = [
  '/Volumes/T7/code/ai-deterrence',
  "/Volumes/Samsung_T7/code/ai-deterrence",
  '/Volumes/T7',
  "/Volumes/Samsung_T7",
];

function printHeader() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛠️  Portfolio Pipeline & Deterrence Vault Setup Wizard');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function detectDefaultVault() {
  for (const c of KNOWN_T7_CANDIDATES) {
    try {
      if (fs.existsSync(c)) {
        if (c.endsWith('ai-deterrence')) return c;
        const sub = path.join(c, 'ai-deterrence');
        if (fs.existsSync(sub)) return sub;
        return c;
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_LOCAL_VAULT;
}

function promptUser(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

function initVaultStructure(targetPath) {
  let resolved = targetPath.trim();
  if (resolved.startsWith('.')) {
    resolved = path.resolve(ROOT_DIR, resolved);
  }

  const subdirs = [
    'stage-in',
    'stage-out',
    'masters-archive',
    path.join('zines', 'raw-masters'),
  ];

  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
    console.log(`📁 Created vault directory: ${resolved}`);
  }

  for (const sub of subdirs) {
    const full = path.join(resolved, sub);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      console.log(`   + Created subfolder: ${sub}/`);
    } else {
      console.log(`   ✓ Found existing: ${sub}/`);
    }
  }

  // Create README.md inside vault
  const readmePath = path.join(resolved, 'README.md');
  if (!fs.existsSync(readmePath)) {
    const readmeContent = `# Portfolio AI Deterrence & Media Pipeline Vault\n
This directory acts as the offline / hardware vault for your portfolio assets.

## Directory Structure
- **\`stage-in/\`**: Place raw uncloaked artwork images here before feeding to Glaze / Nightshade.
- **\`stage-out/\`**: Place adversarial protected / perturbed output images here. When running the pipeline, images from here will automatically replace raw versions with high-DPI WebP.
- **\`masters-archive/\`**: When optimizing images, raw multi-megabyte master PNGs/JPEGs are moved here to keep your Git repository slim.
- **\`zines/\`**: Stores master PDF publications and high-res print spreads.
`;
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log(`   + Created guide: README.md`);
  }

  return resolved;
}

function saveConfig(vaultPath) {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }

  let existing = {};
  if (fs.existsSync(PIPELINE_SETTINGS_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(PIPELINE_SETTINGS_FILE, 'utf-8'));
    } catch {
      existing = {};
    }
  }

  const updated = {
    ...existing,
    vaultPath,
    autoDetectT7: true,
    enableLocalFallback: true,
    lastSetupAt: Date.now(),
  };

  fs.writeFileSync(PIPELINE_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`\n💾 Saved vault configuration to content/settings/pipeline.json:`);
  console.log(`   vaultPath: "${vaultPath}"`);
}

async function checkSharp() {
  try {
    const sharp = (await import('sharp')).default;
    const testBuf = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();
    if (testBuf.length > 0) {
      console.log('⚡ Sharp & libvips image engine: Verified healthy');
    }
  } catch (err) {
    console.warn('⚠️  Sharp verification warning:', err.message);
  }
}

async function main() {
  printHeader();

  const args = process.argv.slice(2);
  let explicitPath = null;
  let nonInteractive = false;

  for (const arg of args) {
    if (arg.startsWith('--path=')) {
      explicitPath = arg.replace('--path=', '').trim();
    } else if (arg === '--non-interactive') {
      nonInteractive = true;
    }
  }

  const detectedDefault = detectDefaultVault();
  let selectedPath = explicitPath;

  if (!selectedPath) {
    if (nonInteractive) {
      selectedPath = detectedDefault;
    } else {
      console.log(`Where would you like to stage your pipeline storage vault?`);
      console.log(`Suggested default: [${detectedDefault}]`);
      console.log(`(Press ENTER to accept default, or enter an absolute/relative path):\n`);

      const answer = await promptUser(`Vault path [${detectedDefault}]: `);
      selectedPath = answer || detectedDefault;
    }
  }

  console.log(`\n📦 Initializing storage vault at: ${selectedPath}...`);
  const resolved = initVaultStructure(selectedPath);

  saveConfig(selectedPath);

  await checkSharp();

  console.log('\n🎉 Pipeline Setup Completed Successfully!');
  console.log('You can now run:');
  console.log('  • npm run images:dry-run      (Simulate image optimization)');
  console.log('  • npm run images:stage-ai     (Stage art to vault stage-in/ for Glaze/Nightshade)');
  console.log('  • npm run images:optimize     (Compress to 4K WebP and archive raw masters)');
  console.log('  • Open http://localhost:5173/studio/protocol in your browser for live UI management.\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal error in setup script:', err);
  process.exit(1);
});
