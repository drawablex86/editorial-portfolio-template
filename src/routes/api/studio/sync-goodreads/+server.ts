import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);
let isSyncing = false;

export async function POST({ request }: { request: Request }) {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(403, 'Goodreads sync is only available in development or authorized studio mode.');
  }

  if (isSyncing) {
    return json({ success: false, error: 'A sync process is already in progress.' }, { status: 429 });
  }

  try {
    isSyncing = true;
    let customUrl = '';
    try {
      const body = await request.json();
      if (body && typeof body.goodreadsUrl === 'string') {
        customUrl = body.goodreadsUrl.trim();
      }
    } catch {
      // Empty or non-JSON body is valid
    }

    const libraryPath = path.join(process.cwd(), 'content', 'library.json');
    if (customUrl && fs.existsSync(libraryPath)) {
      try {
        const lib = JSON.parse(fs.readFileSync(libraryPath, 'utf-8'));
        lib.goodreadsUrl = customUrl;
        fs.writeFileSync(libraryPath, JSON.stringify(lib, null, 2), 'utf-8');
      } catch {
        // ignore write error
      }
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-goodreads.mjs');
    if (!fs.existsSync(scriptPath)) {
      return json({ success: false, error: 'sync-goodreads.mjs not found' }, { status: 404 });
    }

    const cmd = customUrl
      ? `node "${scriptPath}" ${JSON.stringify(customUrl)}`
      : `node "${scriptPath}"`;
    const { stdout } = await execPromise(cmd, { timeout: 30000 });

    let lastSynced = new Date().toISOString().split('T')[0];
    let bookCount = 0;

    if (fs.existsSync(libraryPath)) {
      try {
        const lib = JSON.parse(fs.readFileSync(libraryPath, 'utf-8'));
        lastSynced = lib.lastSynced || lastSynced;
        bookCount = lib.books?.length || 0;
      } catch {
        // ignore
      }
    }

    return json({
      success: true,
      stdout: stdout.trim(),
      lastSynced,
      bookCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error triggering goodreads sync:', message);
    return json({ success: false, error: message }, { status: 500 });
  } finally {
    isSyncing = false;
  }
}
