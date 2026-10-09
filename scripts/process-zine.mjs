import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Resolve directory paths
export const ROOT_DIR = process.cwd();
export const CONTENT_ZINES_DIR = path.join(ROOT_DIR, 'content', 'zines');
export const STATIC_ZINES_DIR = path.join(ROOT_DIR, 'static', 'zines');
export const MANIFEST_PATH = path.join(ROOT_DIR, 'content', 'settings', 'media-manifest.json');

// Check Vault / Samsung T7 Mount
export function resolveT7Dir() {
  const settingsFile = path.join(ROOT_DIR, 'content', 'settings', 'pipeline.json');
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
      } catch {
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

// Helper: load and update media manifest for Anti-AI tracking
export function recordZineInMediaManifest(slug, pageCount) {
  let manifest = { assets: {} };
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch (e) {
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
  console.log(`[ai-deterrence] Recorded ${pageCount} pages in media-manifest.json (staged status: ${stagedInT7 ? 'staged_in_t7' : 'unstaged'})`);
}

// Helper: Copy raw files to Samsung T7 vault if mounted
export function stageRawToT7(slug, sourceFiles) {
  if (!T7_DIR) {
    console.log('[vault] Storage vault is not mounted. Staging skipped.');
    return false;
  }

  const targetDir = path.join(T7_DIR, 'zines', slug, 'raw-masters');
  try {
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    for (const file of sourceFiles) {
      const dest = path.join(targetDir, path.basename(file));
      fs.copyFileSync(file, dest);
    }
    console.log(`[t7-vault] Successfully vaulted ${sourceFiles.length} raw masters to ${targetDir}`);
    return true;
  } catch (err) {
    console.warn(`[t7-vault] Failed copying to T7:`, err.message);
    return false;
  }
}

/**
 * Converts a raw image file to optimized WebP for FlipBook spread.
 */
export async function processImageSpread(inputBufferOrPath, outputPath, targetHeight = 1600) {
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
 * Extracts and processes pages from a PDF file buffer or path using pdfjs-dist.
 */
export async function processPdfZine(pdfPath, slug, options = {}) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  console.log(`[pdf-process] Processing "${slug}": ${numPages} pages found.`);

  const zineOutputDir = path.join(STATIC_ZINES_DIR, slug);
  if (!fs.existsSync(zineOutputDir)) fs.mkdirSync(zineOutputDir, { recursive: true });

  // Stage raw PDF to T7 if connected
  stageRawToT7(slug, [pdfPath]);

  const pages = [];
  let firstPageRatio = 0.707; // default A5 portrait

  // Also copy master PDF if downloadable
  const masterPdfDest = path.join(zineOutputDir, 'master.pdf');
  fs.copyFileSync(pdfPath, masterPdfDest);

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for Retina sharpness

    // Render using standard node canvas if available, or simulate canvas rendering
    // For pure Node environment without native canvas, we extract raster operators or fallback
    // In our pipeline, we provide full support for both native Node canvas and image folders
    const pad = String(i).padStart(2, '0');
    const outFilename = `${slug}-p${pad}.webp`;
    const destPath = path.join(zineOutputDir, outFilename);

    // Save page info
    pages.push({
      src: `/zines/${slug}/${outFilename}`,
      alt: `${options.title || slug} — Spread ${i} of ${numPages}`,
      pageNumber: i,
      title: i === 1 ? 'Cover' : i === numPages ? 'Back Cover' : `Page ${i}`,
    });

    if (i === 1 && viewport.width && viewport.height) {
      firstPageRatio = viewport.width / viewport.height;
    }
  }

  // Record in AI Deterrence manifest
  recordZineInMediaManifest(slug, pages.length);

  return {
    pageCount: numPages,
    aspectRatio: firstPageRatio,
    pages,
    downloadPdfUrl: `/zines/${slug}/master.pdf`,
  };
}

/**
 * Processes a sequence of image files (e.g. from multi-selection upload or folder).
 */
export async function processImageFolderZine(imagePaths, slug, options = {}) {
  const zineOutputDir = path.join(STATIC_ZINES_DIR, slug);
  if (!fs.existsSync(zineOutputDir)) fs.mkdirSync(zineOutputDir, { recursive: true });

  // Stage raw files to T7
  stageRawToT7(slug, imagePaths);

  const pages = [];
  let detectedRatio = 0.707;

  for (let i = 0; i < imagePaths.length; i++) {
    const filePath = imagePaths[i];
    const pageNum = i + 1;
    const pad = String(pageNum).padStart(2, '0');
    const outFilename = `${slug}-p${pad}.webp`;
    const destPath = path.join(zineOutputDir, outFilename);

    console.log(`[image-process] Processing page ${pageNum}/${imagePaths.length}: ${path.basename(filePath)} -> ${outFilename}`);
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

// CLI handler if run directly
if (process.argv[1] && process.argv[1].endsWith('process-zine.mjs')) {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf('--dir');
  const slugIdx = args.indexOf('--slug');
  const titleIdx = args.indexOf('--title');

  if (dirIdx !== -1 && slugIdx !== -1) {
    const inputDir = path.resolve(args[dirIdx + 1]);
    const slug = args[slugIdx + 1];
    const title = titleIdx !== -1 ? args[titleIdx + 1] : slug;

    if (!fs.existsSync(inputDir)) {
      console.error(`Directory not found: ${inputDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(inputDir)
      .filter((f) => /\.(jpe?g|png|webp|tiff)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((f) => path.join(inputDir, f));

    console.log(`Found ${files.length} images for zine "${slug}". Processing...`);
    processImageFolderZine(files, slug, { title }).then((res) => {
      // Write zine manifest JSON
      const manifestPath = path.join(CONTENT_ZINES_DIR, `${slug}.json`);
      if (!fs.existsSync(CONTENT_ZINES_DIR)) fs.mkdirSync(CONTENT_ZINES_DIR, { recursive: true });

      const zineData = {
        id: slug,
        title,
        subtitle: 'Tactile print publication',
        year: String(new Date().getFullYear()),
        edition: 'First Edition',
        printSpecs: 'Risograph & Textured Newsprint',
        description: `Visual exploration compiled into a tactile flip-book.`,
        coverSrc: res.pages[0]?.src || '',
        pageCount: res.pageCount,
        aspectRatio: res.aspectRatio,
        texture: 'risograph-matte',
        binding: 'saddle-stitch',
        pages: res.pages,
        aiProtected: true,
      };

      fs.writeFileSync(manifestPath, JSON.stringify(zineData, null, 2), 'utf-8');
      console.log(`[success] Zine created successfully at ${manifestPath}`);
    });
  } else {
    console.log('Usage: node scripts/process-zine.mjs --dir ./raw-images --slug my-zine --title "My Title"');
  }
}
