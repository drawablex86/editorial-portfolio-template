import type { RequestHandler } from './$types';
import { getSeoSettings, toAbsoluteUrl } from '$lib/server/seo';
import { getAllProjects, getMarkdownItems } from '$lib/server/content';

export const GET: RequestHandler = async () => {
  const settings = getSeoSettings();
  const baseUrl = settings.siteUrl.replace(/\/+$/, '');

  const now = new Date().toISOString().split('T')[0];

  // Core static pages with priority and change frequencies
  const corePages = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly', lastmod: now },
    { loc: `${baseUrl}/works`, priority: '0.9', changefreq: 'weekly', lastmod: now },
    { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'weekly', lastmod: now },
    { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly', lastmod: now },
    { loc: `${baseUrl}/rights`, priority: '0.8', changefreq: 'monthly', lastmod: now },
    { loc: `${baseUrl}/now`, priority: '0.7', changefreq: 'monthly', lastmod: now },
    { loc: `${baseUrl}/library`, priority: '0.6', changefreq: 'monthly', lastmod: now },
    { loc: `${baseUrl}/inspiration`, priority: '0.6', changefreq: 'monthly', lastmod: now },
  ];

  // Projects
  const projects = getAllProjects()
    .filter((p) => !p.noIndex)
    .map((p) => ({
      loc: `${baseUrl}/works/${encodeURIComponent(p.id)}`,
      priority: p.featured ? '0.85' : '0.75',
      changefreq: 'monthly',
      lastmod: p.publishDate || now,
    }));

  // Blog Essays
  const blogPosts = getMarkdownItems('blog')
    .filter((b) => !b.noIndex)
    .map((b) => ({
      loc: `${baseUrl}/blog/${encodeURIComponent(b.id)}`,
      priority: '0.75',
      changefreq: 'monthly',
      lastmod: b.publishDate || now,
    }));

  const allUrls = [...corePages, ...projects, ...blogPosts];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
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
