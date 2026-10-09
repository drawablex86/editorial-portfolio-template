import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import fs from 'fs';
import path from 'path';
import {
  getMediaManifest,
  saveMediaManifest,
  reconcileContentReferences,
  type AssetClassification
} from '$lib/server/pipeline';

export async function POST({ request }) {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(403, 'Forbidden in production');
  }

  const body = await request.json();
  const { currentName, newName, classification, aiProtected } = body as {
    currentName: string;
    newName?: string;
    classification?: AssetClassification;
    aiProtected?: boolean;
  };

  if (!currentName) {
    throw error(400, 'Current filename is required');
  }

  const staticDir = path.resolve(process.cwd(), 'static', 'images');
  const publicDir = path.resolve(process.cwd(), 'public', 'images');

  // Sanitize paths with strict containment checks
  const cleanCurrentName = currentName.replace(/^\/+/, '');
  const currentStaticPath = path.resolve(staticDir, cleanCurrentName);
  const currentPublicPath = path.resolve(publicDir, cleanCurrentName);

  if (!currentStaticPath.startsWith(staticDir + path.sep)) {
    throw error(400, 'Invalid file path: path traversal detected');
  }

  if (!fs.existsSync(currentStaticPath) && !fs.existsSync(currentPublicPath)) {
    throw error(404, `File ${currentName} not found`);
  }

  let finalRelativeName = cleanCurrentName;
  const conversions: { originalName: string; webpName: string }[] = [];

  // Handle renaming if newName provided
  if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
    const rawClean = newName.trim().toLowerCase();
    const currentExt = path.extname(cleanCurrentName);
    const newExt = path.extname(rawClean) || currentExt;
    const currentSubdir = path.dirname(cleanCurrentName);

    const baseNameOnly = path.basename(rawClean, newExt).replace(/[^a-z0-9_-]/g, '-');
    const newFileName = `${baseNameOnly}${newExt}`;
    const newRelativeName = currentSubdir === '.' ? newFileName : `${currentSubdir}/${newFileName}`;

    const newStaticPath = path.resolve(staticDir, newRelativeName);
    const newPublicPath = path.resolve(publicDir, newRelativeName);

    if (!newStaticPath.startsWith(staticDir + path.sep)) {
      throw error(400, 'Invalid target file path: path traversal detected');
    }

    // Ensure target subdirectories exist
    if (!fs.existsSync(path.dirname(newStaticPath))) fs.mkdirSync(path.dirname(newStaticPath), { recursive: true });
    if (fs.existsSync(publicDir) && !fs.existsSync(path.dirname(newPublicPath))) {
      fs.mkdirSync(path.dirname(newPublicPath), { recursive: true });
    }

    // Rename on disk
    if (fs.existsSync(currentStaticPath)) {
      fs.renameSync(currentStaticPath, newStaticPath);
    }
    if (fs.existsSync(currentPublicPath)) {
      fs.renameSync(currentPublicPath, newPublicPath);
    }

    conversions.push({
      originalName: cleanCurrentName,
      webpName: newRelativeName,
    });

    finalRelativeName = newRelativeName;
  }

  // Update Media Manifest
  const manifest = getMediaManifest();
  const currentKey = cleanCurrentName.replace(/^\/+/, '');
  const finalKey = finalRelativeName.replace(/^\/+/, '');

  const oldEntry = manifest.assets[currentKey] || manifest.assets[finalKey];
  const updatedClassification = classification || oldEntry?.type || 'standard';
  const updatedAiProtected =
    typeof aiProtected === 'boolean'
      ? aiProtected
      : (typeof oldEntry?.aiProtected === 'boolean' ? oldEntry.aiProtected : updatedClassification === 'art');

  if (currentKey !== finalKey && manifest.assets[currentKey]) {
    delete manifest.assets[currentKey];
  }

  manifest.assets[finalKey] = {
    ...oldEntry,
    type: updatedClassification,
    label: oldEntry?.label || updatedClassification,
    aiProtected: updatedAiProtected,
    protectionMethod: updatedAiProtected ? (oldEntry?.protectionMethod || 'glaze') : undefined,
    stageStatus: updatedAiProtected ? 'cloaked_live' : 'unstaged',
    protectedAt: updatedAiProtected ? (oldEntry?.protectedAt || Date.now()) : undefined,
  };
  saveMediaManifest(manifest);

  // If filename changed, reconcile Markdown references
  let updatedDocsCount = 0;
  if (conversions.length > 0) {
    const recResult = reconcileContentReferences(conversions);
    updatedDocsCount = recResult.updatedFilesCount;
  }

  return json({
    success: true,
    oldName: cleanCurrentName,
    newName: finalRelativeName,
    classification: updatedClassification,
    updatedDocsCount,
  });
}
