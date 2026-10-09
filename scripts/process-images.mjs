import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Resolve directory paths
export const ROOT_DIR = process.cwd();
export const STATIC_IMAGES_DIR = path.join(ROOT_DIR, 'static', 'images');
export const CONTENT_DIR = path.join(ROOT_DIR, 'content');
export const SRC_DIR = path.join(ROOT_DIR, 'src');

// Detect Vault / T7 SSD location
export function resolveT7Dir() {
  const settingsFile = path.join(CONTENT_DIR, 'settings', 'pipeline.json');
  if (fs.existsSync(settingsFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      if (parsed.vaultPath && parsed.vaultPath.trim().length > 0) {
        let resolved = parsed.vaultPath.trim();
        if (resolved.startsWith('.')) {
          resolved = path.resolve(ROOT_DIR, resolved);
        }
        if (fs.existsSync(resolved)) {
          return resolved;
        }
      }
    } catch {
      // ignore
    }
  }

  const envPath = process.env.PIPELINE_STORAGE_DIR || process.env.T7_STORAGE_DIR;
  if (envPath) {
    let resolved = envPath.trim();
    if (resolved.startsWith('.')) {
      resolved = path.resolve(ROOT_DIR, resolved);
    }
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  const candidates = [
    '/Volumes/T7/code/ai-deterrence',
    "/Volumes/Samsung_T7/code/ai-deterrence",
    '/Volumes/T7',
    "/Volumes/Samsung_T7",
  ];
  for (const c of candidates) {
    if (c) {
      try {
        if (fs.existsSync(c)) {
          if (c.endsWith('ai-deterrence')) return c;
          const sub = path.join(c, 'ai-deterrence');
          if (fs.existsSync(sub)) return sub;
          return c;
        }
      } catch (err) {
        // volume permission error or unmounted
      }
    }
  }

  const localVault = path.join(ROOT_DIR, '.pipeline-vault');
  if (fs.existsSync(localVault)) {
    return localVault;
  }

  return null;
}

export const T7_DIR = resolveT7Dir();

// Presets for Contextual Compression
export const CONTEXTUAL_PRESETS = {
  hero_cosmology: {
    maxWidth: 2880,
    quality: 92,
    smartSubsample: true,
    effort: 6,
    description: 'High-DPI 4K/Retina Hero Moodboard (Maximum detail, zero blur)',
  },
  art_sketch_protected: {
    maxWidth: 2400,
    quality: 90,
    smartSubsample: true,
    effort: 6,
    description: 'Fine Art / Charcoal / Sketch (High fidelity, preserves Glaze/Nightshade perturbations)',
  },
  product_ui_case_study: {
    maxWidth: 2400,
    quality: 86,
    smartSubsample: true,
    effort: 6,
    description: 'UI / Design Case Study (Crisp typography, 4:4:4 color preservation)',
  },
  card_thumbnail: {
    maxWidth: 1200,
    quality: 82,
    smartSubsample: false,
    effort: 5,
    description: 'Folio Card / Thumbnail (Fast loading, lightweight)',
  },
  standard: {
    maxWidth: 1920,
    quality: 84,
    smartSubsample: true,
    effort: 5,
    description: 'Standard Editorial Asset',
  },
};

export function getPresetForImage(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('inspiration_cosmology') || lower.includes('inspiration')) {
    return CONTEXTUAL_PRESETS.hero_cosmology;
  }
  if (
    lower.startsWith('sketch-') ||
    lower.startsWith('schematic-') ||
    lower.includes('avatar') ||
    lower.includes('figure') ||
    lower.includes('anatomy')
  ) {
    return CONTEXTUAL_PRESETS.art_sketch_protected;
  }
  if (
    lower.includes('unchoice') ||
    lower.includes('unwritten') ||
    lower.includes('hrblock') ||
    lower.includes('ui-') ||
    lower.includes('terminal')
  ) {
    return CONTEXTUAL_PRESETS.product_ui_case_study;
  }
  if (lower.includes('thumb') || lower.includes('preview')) {
    return CONTEXTUAL_PRESETS.card_thumbnail;
  }
  return CONTEXTUAL_PRESETS.standard;
}

export function isArtEligible(filename) {
  const lower = filename.toLowerCase();
  return (
    lower.startsWith('sketch-') ||
    lower.startsWith('schematic-') ||
    lower.includes('avatar') ||
    lower.includes('inspiration_cosmology') ||
    lower.includes('drawing') ||
    lower.includes('charcoal') ||
    lower.includes('linen')
  );
}

// Helper to gather image assets from directory recursively
export function scanImageDirectory(dir, relPrefix = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const relName = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...scanImageDirectory(fullPath, relName));
    } else {
      results.push({
        name: relName,
        fileName: entry.name,
        fullPath,
        size: fs.statSync(fullPath).size,
      });
    }
  }
  return results;
}

// Get comprehensive status of all assets in static/images
export function getPipelineStatus() {
  const t7Dir = resolveT7Dir();
  const staticFiles = scanImageDirectory(STATIC_IMAGES_DIR);

  const allAssets = staticFiles.map((f) => ({ ...f, dirType: 'static' }));
  const rawImages = allAssets.filter((a) => /\.(jpe?g|png)$/i.test(a.fileName));
  const webpImages = allAssets.filter((a) => /\.webp$/i.test(a.fileName));
  const aiEligible = rawImages.filter((a) => isArtEligible(a.fileName));

  let glazedReadyCount = 0;
  const stageOutDir = t7Dir ? path.join(t7Dir, 'stage-out') : null;
  if (stageOutDir && fs.existsSync(stageOutDir)) {
    try {
      const outFiles = fs.readdirSync(stageOutDir);
      glazedReadyCount = outFiles.filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).length;
    } catch (e) {
      // ignore
    }
  }

  return {
    t7Detected: !!t7Dir,
    t7Path: t7Dir,
    totalImages: allAssets.length,
    rawImagesCount: rawImages.length,
    webpImagesCount: webpImages.length,
    aiEligibleCount: aiEligible.length,
    glazedReadyCount,
    rawFiles: rawImages.map((r) => ({
      name: r.name,
      size: r.size,
      dirType: r.dirType,
      isArtEligible: isArtEligible(r.fileName),
      preset: getPresetForImage(r.fileName).description,
    })),
  };
}

// Stage eligible art images to T7 SSD for Glaze / Nightshade
export async function stageForAI(logger = console.log) {
  const t7Dir = resolveT7Dir();
  if (!t7Dir || !fs.existsSync(t7Dir)) {
    throw new Error(
      `Storage vault not detected. Please ensure an external drive is plugged in or configure vault location.`
    );
  }

  const stageInDir = path.join(t7Dir, 'stage-in');
  fs.mkdirSync(stageInDir, { recursive: true });

  const staticFiles = scanImageDirectory(STATIC_IMAGES_DIR);

  const fileMap = new Map();
  for (const f of staticFiles) fileMap.set(f.name, f.fullPath);

  let stagedCount = 0;
  const stagedFiles = [];

  for (const [name, fullPath] of fileMap.entries()) {
    if (!/\.(jpe?g|png)$/i.test(name)) continue;
    if (isArtEligible(path.basename(name))) {
      const destPath = path.join(stageInDir, path.basename(name));
      fs.copyFileSync(fullPath, destPath);
      stagedCount++;
      stagedFiles.push({ name, destPath });
      logger(`📦 Staged for AI protection: ${name} -> ${destPath}`);
    }
  }

  logger(`\n✅ Staged ${stagedCount} creative assets to storage vault (${stageInDir}).`);
  logger(`Next steps in Glaze/Nightshade:`);
  logger(`1. Open Glaze/Nightshade app from ${path.join(t7Dir, 'apps')}`);
  logger(`2. Select input directory: ${stageInDir}`);
  logger(`3. Select output directory: ${path.join(t7Dir, 'stage-out')}`);
  logger(`4. Run deterrence model batch, then run optimize pipeline.`);

  return {
    stagedCount,
    stageInDir,
    stagedFiles,
  };
}

// Reconcile markdown and code files to reference .webp versions
export function reconcileContentReferences(conversions, logger = console.log) {
  if (conversions.length === 0) return 0;

  const replaceMap = new Map();
  for (const { originalName, webpName } of conversions) {
    replaceMap.set(`/images/${originalName}`, `/images/${webpName}`);
  }

  const findFiles = (dir, extRegex) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findFiles(fullPath, extRegex));
      } else if (extRegex.test(entry.name)) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const targetFiles = [
    ...findFiles(CONTENT_DIR, /\.(md|json)$/),
    ...findFiles(SRC_DIR, /\.(svelte|ts|js|css)$/),
  ];

  let updatedFilesCount = 0;
  const updatedFiles = [];

  for (const filePath of targetFiles) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanged = false;

    for (const [oldRef, newRef] of replaceMap.entries()) {
      if (content.includes(oldRef)) {
        content = content.replaceAll(oldRef, newRef);
        hasChanged = true;
      }
    }

    if (hasChanged) {
      fs.writeFileSync(filePath, content, 'utf-8');
      updatedFilesCount++;
      updatedFiles.push(path.relative(ROOT_DIR, filePath));
      logger(`📝 Updated references in: ${path.relative(ROOT_DIR, filePath)}`);
    }
  }

  return { updatedFilesCount, updatedFiles };
}

// Convert images to WebP contextually
export async function optimizeImages(options = {}, logger = console.log) {
  const { archiveOriginals = true, dryRun = false, forceAll = false } = options;
  const t7Dir = resolveT7Dir();

  logger(`🔍 Scanning image directory for raw assets...`);
  const staticFiles = scanImageDirectory(STATIC_IMAGES_DIR);

  const allAssets = staticFiles.map((f) => ({ ...f, primaryDir: 'static' }));
  const imageFiles = allAssets.filter((f) => /\.(jpe?g|png)$/i.test(f.fileName));

  if (imageFiles.length === 0) {
    logger(`✨ No unoptimized JPEG or PNG images found. All assets up to date!`);
    return {
      convertedCount: 0,
      totalSavedBytes: 0,
      conversions: [],
      updatedFilesCount: 0,
    };
  }

  const conversions = [];
  const stageOutDir = t7Dir ? path.join(t7Dir, 'stage-out') : null;
  const archiveDir = t7Dir ? path.join(t7Dir, 'masters-archive') : null;

  if (!dryRun && archiveOriginals && archiveDir) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  let totalOriginalBytes = 0;
  let totalWebpBytes = 0;

  for (const fileObj of imageFiles) {
    const file = fileObj.fileName;
    const relName = fileObj.name;
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);
    const relBaseDir = path.dirname(relName);
    const webpRelName = relBaseDir === '.' ? `${baseName}.webp` : `${relBaseDir}/${baseName}.webp`;

    const originalPath = fileObj.fullPath;
    const staticWebpPath = path.join(STATIC_IMAGES_DIR, webpRelName);

    // Check if there is an AI-deterred version in stage-out on T7
    let inputPath = originalPath;
    let isGlazed = false;
    if (stageOutDir && fs.existsSync(stageOutDir)) {
      const glazedCandidates = [
        path.join(stageOutDir, file),
        path.join(stageOutDir, `${baseName}-glazed.png`),
        path.join(stageOutDir, `${baseName}-glazed.jpg`),
        path.join(stageOutDir, `${baseName}-shaded.png`),
      ];
      for (const gc of glazedCandidates) {
        if (fs.existsSync(gc)) {
          inputPath = gc;
          isGlazed = true;
          break;
        }
      }
    }

    const preset = getPresetForImage(file);
    const originalStats = fs.statSync(originalPath);
    totalOriginalBytes += originalStats.size;

    logger(`\n🖼️  Processing: ${relName}`);
    logger(`   Source: ${isGlazed ? '🛡️ AI-Protected (T7 stage-out)' : 'Original'}`);
    logger(`   Preset: ${preset.description} (Target Q: ${preset.quality})`);

    if (!dryRun) {
      try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        let pipeline = image;
        if (metadata.width && metadata.width > preset.maxWidth) {
          pipeline = pipeline.resize({
            width: preset.maxWidth,
            withoutEnlargement: true,
          });
        }

        const webpBuffer = await pipeline
          .webp({
            quality: preset.quality,
            smartSubsample: preset.smartSubsample,
            effort: preset.effort,
          })
          .toBuffer();

        // Write to static/images
        const staticTargetDir = path.dirname(staticWebpPath);
        if (!fs.existsSync(staticTargetDir)) fs.mkdirSync(staticTargetDir, { recursive: true });
        fs.writeFileSync(staticWebpPath, webpBuffer);

        const webpSize = webpBuffer.length;
        totalWebpBytes += webpSize;

        const savingsPercent = (
          ((originalStats.size - webpSize) / originalStats.size) *
          100
        ).toFixed(1);
        logger(
          `   ✅ Converted: ${(webpSize / 1024).toFixed(1)} KB (Saved ${savingsPercent}% from ${(originalStats.size / 1024).toFixed(1)} KB)`
        );

        conversions.push({
          originalName: relName,
          webpName: webpRelName,
          originalSize: originalStats.size,
          webpSize,
          isGlazed,
        });

        // Archive original to Samsung T7 SSD or delete raw file
        if (archiveOriginals && archiveDir) {
          const archivePath = path.join(archiveDir, file);
          fs.copyFileSync(originalPath, archivePath);
          fs.unlinkSync(originalPath);
          logger(`   📦 Archived original to T7: ${archivePath}`);
          logger(`   🗑️  Cleaned raw file from local workspace.`);
        }
      } catch (err) {
        logger(`   ❌ Failed to process ${relName}: ${err.message}`);
      }
    } else {
      logger(`   [Dry Run] Would convert to ${webpRelName} (${preset.description})`);
      conversions.push({
        originalName: relName,
        webpName: webpRelName,
        originalSize: originalStats.size,
        webpSize: Math.round(originalStats.size * 0.4), // estimate for dry run
        isGlazed,
      });
    }
  }

  let reconciliationResult = { updatedFilesCount: 0, updatedFiles: [] };
  if (!dryRun && conversions.length > 0) {
    logger(`\n🔄 Reconciling Markdown and Svelte component references...`);
    reconciliationResult = reconcileContentReferences(conversions, logger);
    logger(`🎉 Reconciliation complete: updated ${reconciliationResult.updatedFilesCount} files.`);
  }

  const totalSavedBytes = totalOriginalBytes - totalWebpBytes;
  const totalSavedMB = (totalSavedBytes / (1024 * 1024)).toFixed(2);
  logger(`\n📊 Optimization Summary:`);
  logger(`   Total original size: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
  logger(`   Total optimized size: ${(totalWebpBytes / (1024 * 1024)).toFixed(2)} MB`);
  logger(`   Net bandwidth & git storage saved: ${totalSavedMB} MB`);

  return {
    convertedCount: conversions.length,
    totalOriginalBytes,
    totalWebpBytes,
    totalSavedBytes,
    conversions,
    updatedFilesCount: reconciliationResult.updatedFilesCount,
    updatedFiles: reconciliationResult.updatedFiles,
  };
}

// CLI Argument Handling
async function main() {
  const args = process.argv.slice(2);
  const isStageAI = args.includes('--stage-ai');
  const isDryRun = args.includes('--dry-run');
  const noArchive = args.includes('--no-archive');
  const isStatus = args.includes('--status');

  const t7Dir = resolveT7Dir();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 Studio Portfolio — Performance & AI Deterrence Pipeline');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (t7Dir) {
    console.log(`📍 Storage Vault Active: ${t7Dir}`);
  } else {
    console.log(`⚠️  Storage vault not detected. Operating in local-safe mode (run 'npm run pipeline:setup').`);
  }

  if (isStatus) {
    const status = getPipelineStatus();
    console.log('\n📊 Pipeline Diagnostics:');
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (isStageAI) {
    await stageForAI();
  } else {
    await optimizeImages({
      archiveOriginals: !noArchive && !!t7Dir,
      dryRun: isDryRun,
    });
  }
}

// Only execute CLI runner if called directly
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('process-images.mjs') ||
    process.argv[1].includes('process-images'));

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal error in image pipeline:', err);
    process.exit(1);
  });
}
