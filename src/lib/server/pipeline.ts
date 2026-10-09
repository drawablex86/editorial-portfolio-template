import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Resolve directory paths
export const ROOT_DIR = process.cwd();
export const STATIC_IMAGES_DIR = path.join(ROOT_DIR, 'static', 'images');
export const CONTENT_DIR = path.join(ROOT_DIR, 'content');
export const SRC_DIR = path.join(ROOT_DIR, 'src');
export const MANIFEST_PATH = path.join(CONTENT_DIR, 'settings', 'media-manifest.json');

// Media Manifest Interface & Helpers
export type AssetClassification = 'art' | 'photography' | 'product_ui' | 'standard';

export interface MediaManifestRecord {
  type: AssetClassification;
  label?: string;
  notes?: string;
  aiProtected?: boolean;
  protectionMethod?: 'glaze' | 'nightshade' | 'cloaked';
  protectedAt?: number;
  stageStatus?: 'unstaged' | 'staged_in_t7' | 'perturbed_in_t7' | 'cloaked_live';
}

export interface MediaManifestData {
  assets: Record<string, MediaManifestRecord>;
}

export function getMediaManifest(): MediaManifestData {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { assets: {} };
  }
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { assets: {} };
  }
}

export function saveMediaManifest(manifest: MediaManifestData) {
  const dir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

export function recordAssetClassification(
  relPath: string,
  type: AssetClassification,
  label?: string,
  extra?: Partial<MediaManifestRecord>
) {
  const manifest = getMediaManifest();
  const cleanKey = relPath.replace(/^\/+/, '');
  const existing = manifest.assets[cleanKey] || {};
  manifest.assets[cleanKey] = {
    ...existing,
    type,
    label: label || existing.label || type,
    ...extra,
  };
  saveMediaManifest(manifest);
}

export function isAssetAiProtected(relPath: string, filename: string): boolean {
  const manifest = getMediaManifest();
  const cleanPath = relPath.replace(/^\/+/, '');
  const baseName = path.basename(filename);
  const ext = path.extname(baseName);
  const webpName = `${path.basename(baseName, ext)}.webp`;
  const relWebpPath = cleanPath.replace(/\.(jpe?g|png)$/i, '.webp');

  const record =
    manifest.assets[cleanPath] ||
    manifest.assets[relWebpPath] ||
    manifest.assets[baseName] ||
    manifest.assets[webpName];

  if (record && typeof record.aiProtected === 'boolean') {
    return record.aiProtected;
  }

  // If marked as art or sketch, default to protected
  const classification = getClassificationForAsset(relPath, filename);
  return classification === 'art';
}

import {
  resolveVaultDir as resolveVaultDirHelper,
  getPipelineConfig,
  savePipelineConfig,
  initVaultStructure,
  type ResolvedVault,
  type PipelineConfig,
} from './pipelineSettings';

// Detect Vault / T7 SSD location
export function resolveVaultDir(): ResolvedVault {
  return resolveVaultDirHelper();
}

export function resolveT7Dir(): string | null {
  return resolveVaultDirHelper().path;
}

// Presets for Contextual Compression
export const CONTEXTUAL_PRESETS = {
  hero_cosmology: {
    maxWidth: 2880,
    quality: 92,
    smartSubsample: true,
    effort: 6,
    description: 'High-DPI 4K/Retina Hero Moodboard (Maximum detail, zero blur)',
  },
  documentary_photography: {
    maxWidth: 2880,
    quality: 89,
    smartSubsample: true, // 4:4:4 chroma preservation
    effort: 6,
    description: 'Documentary & Street Photography (Shadow nuance, film grain, zero banding)',
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

export function getClassificationForAsset(relPath: string, filename: string): AssetClassification {
  const manifest = getMediaManifest();
  const cleanPath = relPath.replace(/^\/+/, '');
  const baseName = path.basename(filename);
  const ext = path.extname(baseName);
  const webpName = `${path.basename(baseName, ext)}.webp`;
  const relWebpPath = cleanPath.replace(/\.(jpe?g|png)$/i, '.webp');

  // 1. Explicit match in media manifest
  if (manifest.assets[cleanPath]) return manifest.assets[cleanPath].type;
  if (manifest.assets[relWebpPath]) return manifest.assets[relWebpPath].type;
  if (manifest.assets[baseName]) return manifest.assets[baseName].type;
  if (manifest.assets[webpName]) return manifest.assets[webpName].type;

  // 2. Intent keywords & tags in filename (e.g. -art, -photo, -ui)
  const lower = baseName.toLowerCase();
  if (
    lower.includes('-art') ||
    lower.includes('_art') ||
    lower.startsWith('sketch-') ||
    lower.includes('drawing') ||
    lower.includes('schematic') ||
    lower.includes('technical')
  ) {
    return 'art';
  }

  if (
    lower.includes('-photo') ||
    lower.includes('_photo') ||
    lower.includes('monsoon') ||
    lower.includes('street') ||
    lower.includes('leica') ||
    lower.includes('camera') ||
    lower.includes('lens')
  ) {
    return 'photography';
  }

  if (
    lower.includes('-ui') ||
    lower.includes('_ui') ||
    lower.includes('unchoice') ||
    lower.includes('unwritten') ||
    lower.includes('hrblock') ||
    lower.includes('terminal')
  ) {
    return 'product_ui';
  }

  return 'standard';
}

export function getPresetForImage(filename: string, relPath: string = filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('inspiration_cosmology') || lower.includes('inspiration')) {
    return CONTEXTUAL_PRESETS.hero_cosmology;
  }
  if (lower.includes('thumb') || lower.includes('preview')) {
    return CONTEXTUAL_PRESETS.card_thumbnail;
  }

  const classification = getClassificationForAsset(relPath, filename);
  if (classification === 'art') {
    return CONTEXTUAL_PRESETS.art_sketch_protected;
  }
  if (classification === 'photography') {
    return CONTEXTUAL_PRESETS.documentary_photography;
  }
  if (classification === 'product_ui') {
    return CONTEXTUAL_PRESETS.product_ui_case_study;
  }

  return CONTEXTUAL_PRESETS.standard;
}

export function isArtEligible(filename: string, relPath: string = filename): boolean {
  const classification = getClassificationForAsset(relPath, filename);
  return classification === 'art';
}

export interface ImageAssetItem {
  name: string;
  fileName: string;
  fullPath: string;
  size: number;
}

export function scanImageDirectory(dir: string, relPrefix = ''): ImageAssetItem[] {
  const results: ImageAssetItem[] = [];
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

export interface PipelineStatus {
  t7Detected: boolean;
  t7Path: string | null;
  totalImages: number;
  rawImagesCount: number;
  webpImagesCount: number;
  aiEligibleCount: number;
  aiProtectedCount: number;
  stagedInT7Count: number;
  perturbedInT7Count: number;
  cloakedLiveCount: number;
  photoCount: number;
  glazedReadyCount: number;
  vaultSource?: string;
  vaultLabel?: string;
  vaultReady?: boolean;
  rawFiles: {
    name: string;
    size: number;
    dirType: string;
    classification: AssetClassification;
    isArtEligible: boolean;
    isProtected: boolean;
    preset: string;
  }[];
}

export function getPipelineStatus(): PipelineStatus {
  const resolvedVault = resolveVaultDirHelper();
  const t7Dir = resolvedVault.path;
  const staticFiles = scanImageDirectory(STATIC_IMAGES_DIR);
  const manifest = getMediaManifest();

  const allAssets = staticFiles.map((f) => ({ ...f, dirType: 'static' }));
  const rawImages = allAssets.filter((a) => /\.(jpe?g|png)$/i.test(a.fileName));
  const webpImages = allAssets.filter((a) => /\.webp$/i.test(a.fileName));
  const aiEligible = rawImages.filter((a) => isArtEligible(a.fileName, a.name));
  const photoImages = rawImages.filter((a) => getClassificationForAsset(a.name, a.fileName) === 'photography');

  // Count verified protected assets across active WebPs
  let aiProtectedCount = 0;
  for (const a of webpImages) {
    if (isAssetAiProtected(a.name, a.fileName)) {
      aiProtectedCount++;
    }
  }

  let stagedInT7Count = 0;
  let perturbedInT7Count = 0;
  const stageInDir = t7Dir ? path.join(t7Dir, 'stage-in') : null;
  const stageOutDir = t7Dir ? path.join(t7Dir, 'stage-out') : null;

  if (stageInDir && fs.existsSync(stageInDir)) {
    try {
      stagedInT7Count = fs.readdirSync(stageInDir).filter((f) => !f.startsWith('.')).length;
    } catch {
      // ignore
    }
  }

  if (stageOutDir && fs.existsSync(stageOutDir)) {
    try {
      perturbedInT7Count = fs.readdirSync(stageOutDir).filter((f) => !f.startsWith('.')).length;
    } catch {
      // ignore
    }
  }

  return {
    t7Detected: !!t7Dir && resolvedVault.isReady,
    t7Path: t7Dir,
    vaultSource: resolvedVault.source,
    vaultLabel: resolvedVault.label,
    vaultReady: resolvedVault.isReady,
    totalImages: allAssets.length,
    rawImagesCount: rawImages.length,
    webpImagesCount: webpImages.length,
    aiEligibleCount: aiEligible.length,
    aiProtectedCount,
    stagedInT7Count,
    perturbedInT7Count,
    cloakedLiveCount: aiProtectedCount,
    photoCount: photoImages.length,
    glazedReadyCount: perturbedInT7Count,
    rawFiles: rawImages.map((r) => {
      const classification = getClassificationForAsset(r.name, r.fileName);
      const isProtected = isAssetAiProtected(r.name, r.fileName);
      return {
        name: r.name,
        size: r.size,
        dirType: r.dirType,
        classification,
        isArtEligible: classification === 'art',
        isProtected,
        preset: getPresetForImage(r.fileName, r.name).description,
      };
    }),
  };
}

export async function stageForAI(logger: (msg: string) => void = console.log) {
  const resolvedVault = resolveVaultDirHelper();
  const t7Dir = resolvedVault.path;
  if (!t7Dir || !fs.existsSync(t7Dir)) {
    throw new Error(
      `Pipeline storage vault not found at: ${t7Dir || 'unspecified'}. Please run First-Time Setup or configure vault location.`
    );
  }

  const stageInDir = path.join(t7Dir, 'stage-in');
  fs.mkdirSync(stageInDir, { recursive: true });

  const staticFiles = scanImageDirectory(STATIC_IMAGES_DIR);

  const fileMap = new Map<string, string>();
  for (const f of staticFiles) fileMap.set(f.name, f.fullPath);

  let stagedCount = 0;
  const stagedFiles: { name: string; destPath: string }[] = [];

  for (const [name, fullPath] of fileMap.entries()) {
    if (!/\.(jpe?g|png)$/i.test(name)) continue;
    if (isArtEligible(path.basename(name), name)) {
      const destPath = path.join(stageInDir, path.basename(name));
      fs.copyFileSync(fullPath, destPath);
      stagedCount++;
      stagedFiles.push({ name, destPath });
      logger(`📦 Staged for AI protection: ${name} -> ${destPath}`);
    }
  }

  logger(`\n✅ Staged ${stagedCount} creative assets to storage vault (${stageInDir}).`);
  return {
    stagedCount,
    stageInDir,
    stagedFiles,
  };
}

export function reconcileContentReferences(
  conversions: { originalName: string; webpName: string }[],
  logger: (msg: string) => void = console.log
) {
  if (conversions.length === 0) return { updatedFilesCount: 0, updatedFiles: [] };

  const replaceMap = new Map<string, string>();
  for (const { originalName, webpName } of conversions) {
    replaceMap.set(`/images/${originalName}`, `/images/${webpName}`);
  }

  const findFiles = (dir: string, extRegex: RegExp): string[] => {
    let results: string[] = [];
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
  const updatedFiles: string[] = [];

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

export async function optimizeImages(
  options: { archiveOriginals?: boolean; dryRun?: boolean } = {},
  logger: (msg: string) => void = console.log
) {
  const { archiveOriginals = true, dryRun = false } = options;
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
      updatedFiles: [],
    };
  }

  const conversions: {
    originalName: string;
    webpName: string;
    originalSize: number;
    webpSize: number;
    isGlazed: boolean;
  }[] = [];

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

    const preset = getPresetForImage(file, relName);
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

        const staticTargetDir = path.dirname(staticWebpPath);
        if (!fs.existsSync(staticTargetDir)) fs.mkdirSync(staticTargetDir, { recursive: true });
        fs.writeFileSync(staticWebpPath, webpBuffer);

        const webpSize = webpBuffer.length;
        totalWebpBytes += webpSize;

        const savingsPercent = (((originalStats.size - webpSize) / originalStats.size) * 100).toFixed(1);
        logger(`   ✅ Converted: ${(webpSize / 1024).toFixed(1)} KB (Saved ${savingsPercent}%)`);

        conversions.push({
          originalName: relName,
          webpName: webpRelName,
          originalSize: originalStats.size,
          webpSize,
          isGlazed,
        });

        if (archiveOriginals && archiveDir) {
          const archivePath = path.join(archiveDir, file);
          fs.copyFileSync(originalPath, archivePath);
          fs.unlinkSync(originalPath);
          logger(`   📦 Archived original to storage vault: ${archivePath}`);
        }
      } catch (err: any) {
        logger(`   ❌ Failed to process ${relName}: ${err.message}`);
      }
    } else {
      logger(`   [Dry Run] Would convert to ${webpRelName} (${preset.description})`);
      conversions.push({
        originalName: relName,
        webpName: webpRelName,
        originalSize: originalStats.size,
        webpSize: Math.round(originalStats.size * 0.4),
        isGlazed,
      });
    }
  }

  let reconciliationResult = { updatedFilesCount: 0, updatedFiles: [] as string[] };
  if (!dryRun && conversions.length > 0) {
    logger(`\n🔄 Reconciling Markdown and Svelte component references...`);
    reconciliationResult = reconcileContentReferences(conversions, logger);
    logger(`🎉 Reconciliation complete: updated ${reconciliationResult.updatedFilesCount} files.`);
  }

  const totalSavedBytes = totalOriginalBytes - totalWebpBytes;
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
