import { getAllProjects, getDeskData, getMarkdownItems, getLibraryData, getNowPageData } from '$lib/server/content';
import fs from 'fs';
import path from 'path';
import type { PageServerLoad } from './$types';

/** Number of zine editions currently in the print archive. */
function getZineCount(): number {
  const dir = path.join(process.cwd(), 'content', 'zines');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).length;
}

/**
 * Best-effort freshness stamp for /now, read from the last git commit that
 * touched the page — the frontmatter does not carry a date and git mtime is
 * meaningless on a fresh clone. Falls back to null so the card keeps its
 * static label when git is unavailable.
 */
function getNowUpdated(): string | null {
  try {
    const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', 'content/pages/now.md'],
      { cwd: process.cwd(), encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

export const load: PageServerLoad = async () => {
  const allProjects = getAllProjects();
  // Strip heavy markdown bodies for the home page cards to save serialization size
  const projectsData = allProjects.map(({ body, ...rest }) => rest);
  const deskData = getDeskData();

  // Live counts for the discovery strip hub.
  const library = getLibraryData();
  const discoveryCounts = {
    blog: getMarkdownItems('blog').length,
    library: library?.books?.length ?? 0,
    zines: getZineCount(),
  };

  return {
    projectsData,
    deskData,
    discoveryCounts,
    nowUpdated: getNowPageData() ? getNowUpdated() : null,
  };
};
