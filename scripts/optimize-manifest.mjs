#!/usr/bin/env node
/**
 * One-shot re-encode pass over the WebPs already committed to `static/images`.
 *
 * Why this exists: `process-images.mjs` only ever looks at raw JPEG/PNG files
 * and *deletes* them once archived to the vault, so by the time responsive
 * variants were added to the pipeline there were no raw sources left to
 * re-derive from. This script therefore treats the committed `.webp` masters as
 * the source of truth and re-derives both:
 *
 *   1. a leaner master at the same contextual preset quality, and
 *   2. the responsive sibling ladder (`-480/-768/-1200/-1600`).
 *
 * It is idempotent: a file that already has a complete, up-to-date ladder is
 * skipped, so re-running is safe and cheap. Pass `--dry-run` to preview.
 *
 * Usage:
 *   node scripts/optimize-manifest.mjs [--dry-run] [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import {
  STATIC_IMAGES_DIR,
  RESPONSIVE_WIDTHS,
  variantName,
  getPresetForImage,
} from './process-images.mjs';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const bytes = (n) => `${(n / 1024).toFixed(1)} KB`;

/**
 * Recursively collect every master `.webp` under `static/images`.
 *
 * Note many legitimate assets end in a bare number (`sketch-7.webp`,
 * `monsoon-1.webp`), so a `-\d+` suffix alone cannot identify a variant. Instead
 * a file is treated as a generated sibling only when stripping a known
 * breakpoint leaves a name that also exists on disk — that is unambiguous and
 * cannot swallow a real asset.
 */
function collectWebp(dir) {
  const all = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      all.push(...collectWebp(full));
    } else if (entry.name.toLowerCase().endsWith('.webp')) {
      all.push(full);
    }
  }

  const names = new Set(all.map((f) => path.basename(f)));
  return all.filter((full) => {
    const name = path.basename(full);
    const isVariant = RESPONSIVE_WIDTHS.some((w) => {
      const suffix = `-${w}.webp`;
      if (!name.toLowerCase().endsWith(suffix)) return false;
      return names.has(`${name.slice(0, -suffix.length)}.webp`);
    });
    return !isVariant;
  });
}

async function main() {
  if (!fs.existsSync(STATIC_IMAGES_DIR)) {
    console.log('No static/images directory found; nothing to do.');
    return;
  }

  const masters = collectWebp(STATIC_IMAGES_DIR).sort();
  console.log(`\n📦 ${masters.length} master WebPs found in static/images\n`);

  let reencoded = 0;
  let skipped = 0;
  let originalTotal = 0;
  let finalTotal = 0;
  let variantsWritten = 0;

  for (const masterPath of masters) {
    const relName = path.relative(STATIC_IMAGES_DIR, masterPath);
    const preset = getPresetForImage(relName);
    const originalStat = fs.statSync(masterPath);
    originalTotal += originalStat.size;

    const meta = await sharp(masterPath).metadata();
    const sourceWidth = meta.width || 0;
    const masterWidth = Math.min(sourceWidth, preset.maxWidth);

    const variantWidths = RESPONSIVE_WIDTHS.filter((w) => w < masterWidth);

    const expectedVariants = variantWidths.map((w) => ({
      width: w,
      path: path.join(path.dirname(masterPath), variantName(relName, w)),
    }));

    const allVariantsPresent = expectedVariants.every((v) => fs.existsSync(v.path));
    if (allVariantsPresent && !force) {
      skipped++;
      finalTotal += originalStat.size;
      for (const v of expectedVariants) finalTotal += fs.statSync(v.path).size;
      continue;
    }

    console.log(`🖼️  ${relName}`);
    console.log(
      `   ${preset.description} · source ${sourceWidth}w · master ${masterWidth}w · ${bytes(originalStat.size)}`
    );

    if (dryRun) {
      const projected = expectedVariants
        .map((v) => `${v.width}w`)
        .join(', ');
      console.log(`   [Dry Run] would re-encode master + emit ${projected || '(no variants)'}`);
      finalTotal += originalStat.size;
      continue;
    }

    // Nearest-neighbour resize keeps the master at its own width; sharp will
    // not enlarge past the source, so an already-smaller master stays put.
    const buffer = await sharp(masterPath)
      .resize({ width: masterWidth, withoutEnlargement: true })
      .webp({
        quality: preset.quality,
        smartSubsample: preset.smartSubsample,
        effort: preset.effort,
      })
      .toBuffer();

    // Only overwrite when the re-encode actually shrank the file, so repeated
    // runs cannot creep quality downwards.
    if (buffer.length < originalStat.size) {
      fs.writeFileSync(masterPath, buffer);
      console.log(`   ✅ master re-encoded: ${bytes(originalStat.size)} → ${bytes(buffer.length)}`);
      reencoded++;
      finalTotal += buffer.length;
    } else {
      console.log(`   ➖ master already optimal (${bytes(originalStat.size)}), left as-is`);
      finalTotal += originalStat.size;
    }

    for (const v of expectedVariants) {
      const variantBuffer = await sharp(masterPath)
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({
          quality: preset.quality,
          smartSubsample: preset.smartSubsample,
          effort: preset.effort,
        })
        .toBuffer();
      fs.writeFileSync(v.path, variantBuffer);
      variantsWritten++;
      finalTotal += variantBuffer.length;
    }
    if (expectedVariants.length > 0) {
      console.log(`   🪜 ${expectedVariants.length} variants emitted`);
    }
  }

  console.log('\n📊 Re-encode Summary');
  console.log(`   Masters re-encoded: ${reencoded}`);
  console.log(`   Variants written:   ${variantsWritten}`);
  console.log(`   Already complete:   ${skipped}`);
  if (!dryRun && originalTotal > 0) {
    console.log(`   Master bytes:       ${bytes(originalTotal)} → ${bytes(finalTotal)}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('❌ Re-encode failed:', err);
  process.exit(1);
});
