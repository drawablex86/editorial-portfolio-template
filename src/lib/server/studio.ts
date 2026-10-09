import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface StudioItemSummary {
  section: string;
  slug: string;
  title: string;
  description?: string;
  year?: string;
  projectType?: string;
  archetype?: string;
  tags?: string;
  lastModified: number;
}

export function getAllStudioItems(): Record<string, StudioItemSummary[]> {
  const sections = ['projects', 'blog', 'pages'];
  const result: Record<string, StudioItemSummary[]> = {
    projects: [],
    blog: [],
    pages: [],
  };

  for (const sec of sections) {
    const dir = path.join(process.cwd(), 'content', sec);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);
      const slug = file.replace(/\.md$/, '');

      result[sec].push({
        section: sec,
        slug,
        title: typeof data.title === 'string' ? data.title : slug,
        description: typeof data.description === 'string' ? data.description : undefined,
        year: data.year ? String(data.year) : undefined,
        projectType: typeof data.projectType === 'string' ? data.projectType : undefined,
        archetype: typeof data.archetype === 'string' ? data.archetype : undefined,
        tags: typeof data.tags === 'string' ? data.tags : undefined,
        lastModified: stat.mtimeMs,
      });
    }

    // Sort newest first
    result[sec].sort((a, b) => b.lastModified - a.lastModified);
  }

  return result;
}

const ALLOWED_SECTIONS = new Set(['projects', 'blog', 'pages', 'desk', 'zines']);
const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

export function validateStudioPath(section: string, slug: string): { valid: boolean; filePath?: string; error?: string } {
  if (!ALLOWED_SECTIONS.has(section)) {
    return { valid: false, error: `Invalid content section: ${section}` };
  }
  if (!slug || !SLUG_REGEX.test(slug)) {
    return { valid: false, error: `Invalid slug name: ${slug}` };
  }
  const baseDir = path.resolve(process.cwd(), 'content', section);
  const targetPath = path.resolve(baseDir, `${slug}.md`);
  if (!targetPath.startsWith(baseDir + path.sep)) {
    return { valid: false, error: 'Path traversal detected' };
  }
  return { valid: true, filePath: targetPath };
}

export function getStudioFile(section: string, slug: string) {
  const check = validateStudioPath(section, slug);
  if (!check.valid || !check.filePath) return null;

  const filePath = check.filePath;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    section,
    slug,
    data,
    content,
  };
}

export function saveStudioFile(
  section: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string
): { success: boolean; error?: string } {
  try {
    const check = validateStudioPath(section, slug);
    if (!check.valid || !check.filePath) {
      return { success: false, error: check.error || 'Invalid section or slug' };
    }

    const dir = path.dirname(check.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const yamlString = matter.stringify(body, frontmatter);
    fs.writeFileSync(check.filePath, yamlString, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function deleteStudioFile(section: string, slug: string): boolean {
  const check = validateStudioPath(section, slug);
  if (!check.valid || !check.filePath) return false;

  const filePath = check.filePath;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export function getDeskFile() {
  const filePath = path.join(process.cwd(), 'content', 'desk', 'desk.md');
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    data,
    content,
  };
}

export function saveDeskFile(
  frontmatter: Record<string, unknown>,
  body: string = ''
): { success: boolean; error?: string } {
  try {
    const dir = path.join(process.cwd(), 'content', 'desk');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, 'desk.md');
    const yamlString = matter.stringify(body, frontmatter);
    fs.writeFileSync(filePath, yamlString, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function getInspirationFile() {
  const filePath = path.join(process.cwd(), 'content', 'inspiration.md');
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    data,
    content,
  };
}

export function saveInspirationFile(
  frontmatter: Record<string, unknown>,
  body: string
): { success: boolean; error?: string } {
  try {
    const filePath = path.join(process.cwd(), 'content', 'inspiration.md');
    const yamlString = matter.stringify(body, frontmatter);
    fs.writeFileSync(filePath, yamlString, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

import { getClassificationForAsset, isAssetAiProtected, type AssetClassification } from '$lib/server/pipeline';

export function getMediaAssets(): {
  name: string;
  url: string;
  size: number;
  mtime: number;
  classification: AssetClassification;
  isProtected: boolean;
}[] {
  const mediaDir = path.join(process.cwd(), 'static', 'images');
  if (!fs.existsSync(mediaDir)) return [];

  const results: {
    name: string;
    url: string;
    size: number;
    mtime: number;
    classification: AssetClassification;
    isProtected: boolean;
  }[] = [];

  function scanDir(dir: string, subPath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = subPath ? `${subPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        scanDir(fullPath, relPath);
      } else if (/\.(webp|png|jpe?g|gif|svg)$/i.test(entry.name)) {
        const stat = fs.statSync(fullPath);
        const classification = getClassificationForAsset(relPath, entry.name);
        const isProtected = isAssetAiProtected(relPath, entry.name);
        results.push({
          name: relPath,
          url: `/images/${relPath}`,
          size: stat.size,
          mtime: stat.mtimeMs,
          classification,
          isProtected,
        });
      }
    }
  }

  scanDir(mediaDir);
  return results.sort((a, b) => b.mtime - a.mtime);
}

export function deleteMediaAssets(filenames: string[]): { success: boolean; deletedCount: number; errors: string[] } {
  const mediaDir = path.resolve(process.cwd(), 'static', 'images');
  let deletedCount = 0;
  const errors: string[] = [];

  for (const rawName of filenames) {
    if (!rawName || typeof rawName !== 'string') continue;

    // Resolve normalized target path and enforce strict containment
    const cleanRelPath = rawName.replace(/^\/+/, '');
    const fullPath = path.resolve(mediaDir, cleanRelPath);

    // Verify it remains strictly inside mediaDir
    if (fullPath !== mediaDir && !fullPath.startsWith(mediaDir + path.sep)) {
      errors.push(`Forbidden path: ${rawName}`);
      continue;
    }

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        deletedCount++;
      } catch (err: any) {
        errors.push(`Failed to delete ${rawName}: ${err.message}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    deletedCount,
    errors,
  };
}

export function getLibraryFile() {
  const filePath = path.join(process.cwd(), 'content', 'library.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function updateBookNotesLink(bookId: string, notesSlug: string | null): boolean {
  const filePath = path.join(process.cwd(), 'content', 'library.json');
  if (!fs.existsSync(filePath)) return false;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.books)) return false;

    for (const book of data.books) {
      if (bookId && book.id === bookId) {
        if (notesSlug) {
          book.notesSlug = notesSlug;
        } else {
          delete book.notesSlug;
        }
      } else if (notesSlug && book.notesSlug === notesSlug) {
        // Disconnect from any other book if it was pointing to this notesSlug
        delete book.notesSlug;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

export function saveLibrarySpotlight(
  spotlightIds: string[],
  quoteUpdates?: Record<string, string>
): { success: boolean; error?: string } {
  const filePath = path.join(process.cwd(), 'content', 'library.json');
  if (!fs.existsSync(filePath)) {
    return { success: false, error: 'library.json not found' };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    data.onTopOfMyMind = spotlightIds;

    if (quoteUpdates && Array.isArray(data.books)) {
      for (const book of data.books) {
        if (Object.prototype.hasOwnProperty.call(quoteUpdates, book.id)) {
          book.quoteSnippet = quoteUpdates[book.id];
        } else if (book.bookId && Object.prototype.hasOwnProperty.call(quoteUpdates, book.bookId)) {
          book.quoteSnippet = quoteUpdates[book.bookId];
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

