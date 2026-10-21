import type { RequestHandler } from './$types';
import { getSeoSettings, toAbsoluteUrl } from '$lib/server/seo';
import { getAllProjects, getMarkdownItems } from '$lib/server/content';
import { getAllZines } from '$lib/server/zines';

export const GET: RequestHandler = async () => {
  const settings = getSeoSettings();
  const baseUrl = settings.siteUrl.replace(/\/+$/, '');

  const today = new Date().toISOString().split('T')[0];

  // Core static pages. Static pages have no per-page content date, so we omit
  // lastmod entirely rather than falsely claiming they changed today.
  const corePages = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${baseUrl}/works`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/zines`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/rights`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/now`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/library`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${baseUrl}/inspiration`, priority: '0.6', changefreq: 'monthly' },
  ];

  // Projects
  const projects = getAllProjects()
    .filter((p) => !p.noIndex)
    .map((p) => ({
      loc: `${baseUrl}/works/${encodeURIComponent(p.id)}`,
      priority: p.featured ? '0.85' : '0.75',
      changefreq: 'monthly',
      lastmod: p.publishDate || today,
    }));

  // Blog Essays
  const blogPosts = getMarkdownItems('blog')
    .filter((b) => !b.noIndex)
    .map((b) => ({
      loc: `${baseUrl}/blog/${encodeURIComponent(b.id)}`,
      priority: '0.75',
      changefreq: 'monthly',
      lastmod: b.publishDate || today,
    }));

  // Zines / print ephemera
  const zines = getAllZines().map((z) => ({
    loc: `${baseUrl}/zines/${encodeURIComponent(z.id)}`,
    priority: '0.65',
    changefreq: 'monthly',
    lastmod: z.year ? `${z.year}-01-01` : today,
  }));

  const allUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
    ...corePages,
    ...projects,
    ...blogPosts,
    ...zines,
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
${item.lastmod ? `    <lastmod>${item.lastmod}</lastmod>\n` : ''}    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
