import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import fs from 'fs';
import path from 'path';
import { recordAssetClassification, type AssetClassification } from '$lib/server/pipeline';

const ALLOWED_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']);
const ALLOWED_CLASSIFICATIONS = new Set(['art', 'photography', 'product_ui', 'standard']);

export async function POST({ request }) {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(403, 'Studio media upload is only permitted in local development mode.');
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    throw error(400, 'No file uploaded');
  }

  const customName = (formData.get('customName') as string | null)?.trim();
  const rawClassification = ((formData.get('classification') as string | null) || 'standard') as AssetClassification;
  const classification = ALLOWED_CLASSIFICATIONS.has(rawClassification) ? rawClassification : 'standard';
  const subfolder = (formData.get('subfolder') as string | null)?.trim() || '';

  // Determine and validate web-safe extension
  const originalExt = path.extname(file.name).toLowerCase() || '.png';
  if (!ALLOWED_EXTENSIONS.has(originalExt)) {
    throw error(400, 'Invalid file type. Only web-safe images (.webp, .png, .jpg, .jpeg, .gif, .svg) are allowed.');
  }

  let baseName = '';
  if (customName) {
    baseName = customName
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // strip existing extension if typed
      .replace(/[^a-z0-9_-]/g, '-');
  } else {
    const rawBase = path.basename(file.name.toLowerCase(), originalExt);
    baseName = rawBase.replace(/[^a-z0-9_-]/g, '-');
  }

  // Ensure base name is valid
  if (!baseName) {
    baseName = `asset-${Date.now()}`;
  }

  const filename = `${baseName}${originalExt}`;

  // Sanitize target directory with strict containment
  const staticImagesBase = path.resolve(process.cwd(), 'static', 'images');
  const safeSubfolder = subfolder
    .split(/[/\\]+/)
    .filter((seg) => seg && seg !== '.' && seg !== '..' && /^[a-zA-Z0-9_-]+$/.test(seg))
    .join('/');

  const targetDir = safeSubfolder ? path.resolve(staticImagesBase, safeSubfolder) : staticImagesBase;
  if (targetDir !== staticImagesBase && !targetDir.startsWith(staticImagesBase + path.sep)) {
    throw error(400, 'Invalid upload target directory');
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.resolve(targetDir, filename);
  if (!targetPath.startsWith(staticImagesBase + path.sep)) {
    throw error(400, 'Invalid upload file path');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Prevent SVG script execution (Stored XSS defense)
  if (originalExt === '.svg') {
    const svgContent = buffer.toString('utf-8');
    if (/<script|javascript:|data:text\/html/i.test(svgContent)) {
      throw error(400, 'Malicious SVG payload detected. Scripts in SVGs are strictly prohibited.');
    }
  }

  fs.writeFileSync(targetPath, buffer);

  // If public/images directory exists, keep it mirrored for backwards compatibility
  const publicImagesBase = path.resolve(process.cwd(), 'public', 'images');
  if (fs.existsSync(publicImagesBase)) {
    const publicDir = safeSubfolder ? path.resolve(publicImagesBase, safeSubfolder) : publicImagesBase;
    if (publicDir.startsWith(publicImagesBase)) {
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(path.resolve(publicDir, filename), buffer);
    }
  }

  // Save classification to content/settings/media-manifest.json
  const relativeAssetKey = safeSubfolder ? `${safeSubfolder}/${filename}` : filename;
  recordAssetClassification(relativeAssetKey, classification);

  return json({
    success: true,
    url: `/images/${relativeAssetKey}`,
    filename,
    relativeKey: relativeAssetKey,
    classification,
  });
}
