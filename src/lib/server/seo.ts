import fs from 'fs';
import path from 'path';
import type { SeoSettings } from '$lib/types';

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteTitle: 'Linus Torvalds — Systems Architecture & Engineering',
  titleTemplate: '%s | Linus Torvalds',
  defaultDescription:
    'Portfolio and digital workspace of Linus Torvalds — systems architect, software engineer, and open-source creator.',
  siteUrl: 'https://example.com',
  defaultOgImage: '/images/avatar.webp',
  twitterHandle: '@torvalds',
  author: {
    name: 'Linus Torvalds',
    jobTitle: 'Systems Architect & Software Engineer',
    location: 'Portland, Oregon',
    bio: 'Creator of Linux and Git. Building sovereign, high-performance systems and exploring prime lens optics and hardware architecture.',
    avatar: '/images/avatar.webp',
    url: 'https://example.com/about',
    sameAs: [
      'https://github.com/torvalds',
      'https://kernel.org',
      'https://twitter.com/torvalds',
    ],
  },
  redirects: [
    { from: '/work', to: '/works', status: 301 },
    { from: '/projects', to: '/works', status: 301 },
    { from: '/play', to: '/works', status: 301 },
    { from: '/essays', to: '/blog', status: 301 },
  ],
};

function getSettingsPath(): string {
  return path.join(process.cwd(), 'content', 'settings', 'seo.json');
}

export function getSeoSettings(): SeoSettings {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) {
    return DEFAULT_SEO_SETTINGS;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SEO_SETTINGS,
      ...parsed,
      author: {
        ...DEFAULT_SEO_SETTINGS.author,
        ...(parsed.author || {}),
      },
      redirects: Array.isArray(parsed.redirects) ? parsed.redirects : DEFAULT_SEO_SETTINGS.redirects,
    };
  } catch (err) {
    console.error('Failed to parse content/settings/seo.json, using defaults:', err);
    return DEFAULT_SEO_SETTINGS;
  }
}

export function saveSeoSettings(settings: Partial<SeoSettings>): { success: boolean; error?: string } {
  try {
    const current = getSeoSettings();
    const merged: SeoSettings = {
      ...current,
      ...settings,
      author: {
        ...current.author,
        ...(settings.author || {}),
      },
      redirects: Array.isArray(settings.redirects) ? settings.redirects : current.redirects,
    };

    const filePath = getSettingsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Resolves an absolute URL given a relative or already-absolute path.
 */
export function toAbsoluteUrl(urlOrPath: string | undefined, baseUrl: string): string {
  if (!urlOrPath) return baseUrl;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${cleanBase}${cleanPath}`;
}
