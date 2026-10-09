import fs from 'fs';
import path from 'path';
import type { ZineItem } from '$lib/types';

export const CONTENT_ZINES_DIR = path.join(process.cwd(), 'content', 'zines');

/**
 * Returns all zines saved in content/zines/*.json, sorted by year/recency.
 */
export function getAllZines(): ZineItem[] {
  if (!fs.existsSync(CONTENT_ZINES_DIR)) {
    fs.mkdirSync(CONTENT_ZINES_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(CONTENT_ZINES_DIR).filter((f) => f.endsWith('.json'));
  const zines: ZineItem[] = [];

  for (const file of files) {
    try {
      const fullPath = path.join(CONTENT_ZINES_DIR, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const data = JSON.parse(raw) as ZineItem;
      if (data && data.id && data.title) {
        zines.push(data);
      }
    } catch (err) {
      console.error(`[zines] Error parsing ${file}:`, err);
    }
  }

  // Sort by year descending (newest first)
  return zines.sort((a, b) => {
    const yearA = parseInt(a.year || '0', 10);
    const yearB = parseInt(b.year || '0', 10);
    return yearB - yearA;
  });
}

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Fetches a single zine by its slug ID.
 */
export function getZineBySlug(slug: string): ZineItem | null {
  if (!slug || !SLUG_REGEX.test(slug)) {
    return null;
  }

  const filePath = path.resolve(CONTENT_ZINES_DIR, `${slug}.json`);
  if (!filePath.startsWith(CONTENT_ZINES_DIR + path.sep)) {
    return null;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ZineItem;
  } catch (err) {
    console.error(`[zines] Error reading zine ${slug}:`, err);
    return null;
  }
}

/**
 * Saves or updates a zine manifest file.
 */
export function saveZineManifest(zine: ZineItem): boolean {
  if (!zine || !zine.id || !SLUG_REGEX.test(zine.id)) {
    console.error('[zines] Invalid zine ID for save manifest');
    return false;
  }

  if (!fs.existsSync(CONTENT_ZINES_DIR)) {
    fs.mkdirSync(CONTENT_ZINES_DIR, { recursive: true });
  }

  const filePath = path.resolve(CONTENT_ZINES_DIR, `${zine.id}.json`);
  if (!filePath.startsWith(CONTENT_ZINES_DIR + path.sep)) {
    return false;
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(zine, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`[zines] Error saving zine ${zine.id}:`, err);
    return false;
  }
}

/**
 * Permanently deletes a zine:
 * 1. Removes its static manifest (content/zines/{slug}.json)
 * 2. Purges the static asset folder (static/zines/{slug}/)
 * 3. Removes AI-deterrence manifest entries
 */
export function deleteZine(slug: string): boolean {
  if (!slug || !SLUG_REGEX.test(slug)) {
    console.error(`[zines] Invalid slug for deletion: ${slug}`);
    return false;
  }

  try {
    // 1. Delete content manifest
    const manifestPath = path.resolve(CONTENT_ZINES_DIR, `${slug}.json`);
    if (!manifestPath.startsWith(CONTENT_ZINES_DIR + path.sep)) {
      return false;
    }
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }

    // 2. Delete static assets folder with strict containment check
    const zinesStaticBase = path.resolve(process.cwd(), 'static', 'zines');
    const staticDir = path.resolve(zinesStaticBase, slug);
    if (!staticDir.startsWith(zinesStaticBase + path.sep)) {
      return false;
    }
    if (fs.existsSync(staticDir)) {
      fs.rmSync(staticDir, { recursive: true, force: true });
    }

    // 3. Unrecord from media manifest
    import('$lib/server/zinePipeline').then(({ unrecordZineInMediaManifest }) => {
      unrecordZineInMediaManifest(slug);
    }).catch(() => {});

    return true;
  } catch (err) {
    console.error(`[zines] Error deleting zine ${slug}:`, err);
    return false;
  }
}
