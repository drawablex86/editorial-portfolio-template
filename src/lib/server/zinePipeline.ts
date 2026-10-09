import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import type { ZinePage, ZineItem } from '$lib/types';

export const STATIC_ZINES_DIR = path.join(process.cwd(), 'static', 'zines');
export const CONTENT_ZINES_DIR = path.join(process.cwd(), 'content', 'zines');
export const MANIFEST_PATH = path.join(process.cwd(), 'content', 'settings', 'media-manifest.json');

import { resolveVaultDir } from './pipelineSettings';

// Check Storage Vault Mount
export function resolveT7Dir(): string | null {
  return resolveVaultDir().path;
}

export const T7_DIR = resolveT7Dir();

// Helper: load and update media manifest for Anti-AI tracking
export function recordZineInMediaManifest(slug: string, pageCount: number) {
  let manifest: any = { assets: {} };
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch {
    manifest = { assets: {} };
  }

  const stagedInT7 = Boolean(T7_DIR);
  const now = Date.now();

  for (let i = 1; i <= pageCount; i++) {
    const pad = String(i).padStart(2, '0');
    const assetPath = `zines/${slug}/${slug}-p${pad}.webp`;
    manifest.assets[assetPath] = {
      type: 'art',
      label: `Zine spread: ${slug} page ${i}`,
      notes: `Zine publication spread for ${slug}`,
      aiProtected: true,
      protectionMethod: 'nightshade',
      protectedAt: now,
      stageStatus: stagedInT7 ? 'staged_in_t7' : 'unstaged',
    };
  }

  const dir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

// Helper: purge zine spread records from media-manifest.json upon deletion
export function unrecordZineInMediaManifest(slug: string) {
  if (!fs.existsSync(MANIFEST_PATH)) return;

  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest: any = JSON.parse(raw);
    if (!manifest.assets) return;

    const prefix = `zines/${slug}/`;
    let modified = false;

    for (const key of Object.keys(manifest.assets)) {
      if (key.startsWith(prefix) || key.startsWith(`static/${prefix}`)) {
        delete manifest.assets[key];
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error(`[ai-deterrence] Error unrecording zine ${slug}:`, err);
  }
}

// Helper: Copy raw files to storage vault if mounted
export function stageRawToT7(slug: string, sourceFiles: string[]): boolean {
  if (!T7_DIR) {
    return false;
  }

  const targetDir = path.join(T7_DIR, 'zines', slug, 'raw-masters');
  try {
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    for (const file of sourceFiles) {
      const dest = path.join(targetDir, path.basename(file));
      fs.copyFileSync(file, dest);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a raw image or buffer to an optimized WebP for FlipBook spread.
 */
export async function processImageSpread(inputBufferOrPath: string | Buffer, outputPath: string, targetHeight = 1600) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const image = sharp(inputBufferOrPath);
  const metadata = await image.metadata();

  const width = metadata.width || 1200;
  const height = metadata.height || 1600;
  const aspectRatio = width / height;

  await image
    .resize({ height: targetHeight, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  return { aspectRatio, width, height };
}

/**
 * Strips a PDF file buffer/path into high-DPI WebP spreads locally.
 * Measures exact aspect ratio from Page 1 and stages to T7.
 */
export async function processPdfFile(
  pdfBufferOrPath: string | Buffer,
  slug: string,
  options: { title?: string; rawPdfOriginalPath?: string } = {}
): Promise<{ pageCount: number; aspectRatio: number; pages: ZinePage[]; downloadPdfUrl: string }> {
  const zineOutputDir = path.join(STATIC_ZINES_DIR, slug);
  if (!fs.existsSync(zineOutputDir)) fs.mkdirSync(zineOutputDir, { recursive: true });

  const rawBuffer = Buffer.isBuffer(pdfBufferOrPath)
    ? pdfBufferOrPath
    : fs.readFileSync(pdfBufferOrPath);

  // Save master PDF to static dir for optional download
  const masterPdfDest = path.join(zineOutputDir, 'master.pdf');
  fs.writeFileSync(masterPdfDest, rawBuffer);

  // Stage master PDF to T7 vault
  stageRawToT7(slug, [masterPdfDest]);

  // Load PDF.js and Canvas dynamically for local processing
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas } = await import('@napi-rs/canvas');

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(rawBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pages: ZinePage[] = [];
  let detectedRatio = 0.707;

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    // Render at 2x scale for Retina crispness
    const viewport = page.getViewport({ scale: 2.0 });

    if (i === 1 && viewport.width && viewport.height) {
      detectedRatio = viewport.width / viewport.height;
    }

    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const context = canvas.getContext('2d') as any;

    await (page.render({
      canvasContext: context,
      viewport,
      canvas: canvas as any,
    } as any).promise);

    const pngBuffer = canvas.toBuffer('image/png');
    const pad = String(i).padStart(2, '0');
    const outFilename = `${slug}-p${pad}.webp`;
    const destPath = path.join(zineOutputDir, outFilename);

    await processImageSpread(pngBuffer, destPath, 1600);

    pages.push({
      src: `/zines/${slug}/${outFilename}`,
      alt: `${options.title || slug} — Spread ${i} of ${numPages}`,
      pageNumber: i,
      title: i === 1 ? 'Cover' : i === numPages ? 'Back Cover' : `Page ${i}`,
    });
  }

  // Record AI Protection in manifest
  recordZineInMediaManifest(slug, pages.length);

  return {
    pageCount: pages.length,
    aspectRatio: detectedRatio,
    pages,
    downloadPdfUrl: `/zines/${slug}/master.pdf`,
  };
}

/**
 * Processes a sequence of image files (e.g. from multi-selection upload or folder).
 */
export async function processImageFolderZine(
  imagePaths: string[],
  slug: string,
  options: { title?: string } = {}
): Promise<{ pageCount: number; aspectRatio: number; pages: ZinePage[] }> {
  const zineOutputDir = path.join(STATIC_ZINES_DIR, slug);
  if (!fs.existsSync(zineOutputDir)) fs.mkdirSync(zineOutputDir, { recursive: true });

  // Stage raw files to T7
  stageRawToT7(slug, imagePaths);

  const pages: ZinePage[] = [];
  let detectedRatio = 0.707;

  for (let i = 0; i < imagePaths.length; i++) {
    const filePath = imagePaths[i];
    const pageNum = i + 1;
    const pad = String(pageNum).padStart(2, '0');
    const outFilename = `${slug}-p${pad}.webp`;
    const destPath = path.join(zineOutputDir, outFilename);

    const meta = await processImageSpread(filePath, destPath, 1600);

    if (i === 0) {
      detectedRatio = meta.aspectRatio;
    }

    pages.push({
      src: `/zines/${slug}/${outFilename}`,
      alt: `${options.title || slug} — Spread ${pageNum} of ${imagePaths.length}`,
      pageNumber: pageNum,
      title: pageNum === 1 ? 'Cover' : pageNum === imagePaths.length ? 'Back Cover' : `Page ${pageNum}`,
    });
  }

  // Record AI protection in media-manifest
  recordZineInMediaManifest(slug, pages.length);

  return {
    pageCount: pages.length,
    aspectRatio: detectedRatio,
    pages,
  };
}
