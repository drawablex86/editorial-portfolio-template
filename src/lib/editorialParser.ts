import { marked } from 'marked';

/**
 * Escapes HTML entities to prevent Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validates and sanitizes image source URLs.
 * Permits only web-safe relative paths, https/http URLs, and safe data image URIs.
 */
export function sanitizeImageSrc(src: string): string {
  if (!src) return '';
  const clean = src.trim();
  if (/^(https?:\/\/|\/|data:image\/)/i.test(clean) && !/[\r\n\t<>"']/.test(clean)) {
    return escapeHtml(clean);
  }
  return '';
}

/**
 * Strips script tags, dangerous embed tags, inline event handlers,
 * and malicious javascript: URI pseudoprotocols.
 */
export function sanitizeRenderedHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|applet|meta|link|base)[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(['"]?)\s*(?:javascript|vbscript|data:(?!image\/)):[^\s'">]*\2/gi, '$1="#"');
}

/**
 * Transforms custom editorial directives in markdown into semantic HTML.
 * Strips all leading indentation to prevent marked from treating HTML tags
 * as indented preformatted code blocks.
 */
export function preprocessEditorialDirectives(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Clean legacy margin notes if present
  text = text
    .replace(/>\s*\[!margin\][^\n]*\n((?:>\s*[^\n]*\n?)*)/g, '')
    .replace(/>\s*\[!margin\]\s*[^\n]+/g, '');

  // 1. :::metrics block
  text = text.replace(/:::metrics\s*([\s\S]*?):::/g, (_, body: string) => {
    const lines = body.trim().split('\n').filter(Boolean);
    const metricCards = lines.map((line) => {
      const parts = line.split(':');
      const val = escapeHtml(parts[0]?.trim() || '');
      const label = escapeHtml(parts.slice(1).join(':').trim() || '');
      return `<div class="metric-item p-4 rounded bg-[#EFECE6] dark:bg-[#1C1B19] border border-[#E2DED4] dark:border-[#2E2C28] text-center sm:text-left"><div class="metric-val text-2xl sm:text-3xl font-serif font-semibold text-[#2C2B29] dark:text-[#EDE9E1]">${val}</div><div class="metric-lbl text-xs font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 mt-1">${label}</div></div>`;
    }).join('');

    return `\n\n<div class="editorial-metrics my-8 grid grid-cols-2 sm:grid-cols-3 gap-4 not-prose">${metricCards}</div>\n\n`;
  });

  // 2. :::duo[caption] block — Extracts images individually to guarantee true sibling grid cells
  text = text.replace(/:::duo(?:\[(.*?)\])?\s*([\s\S]*?):::/g, (_, caption: string | undefined, body: string) => {
    const imgMatches = [...body.matchAll(/!\[(.*?)\]\((.*?)\)/g)];

    let cellsHtml = '';
    if (imgMatches.length > 0) {
      cellsHtml = imgMatches.map((m) => {
        const alt = escapeHtml(m[1]?.trim() || '');
        const src = sanitizeImageSrc(m[2]?.trim() || '');
        const badge = alt ? `<span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs shadow-xs pointer-events-none">${alt}</span>` : '';
        return `<div class="relative overflow-hidden rounded bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center group"><img src="${src}" alt="${alt}" class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" loading="lazy" />${badge}</div>`;
      }).join('');
    } else {
      cellsHtml = (marked.parse(body.trim()) as string).replace(/^[ \t]+/gm, '').trim();
    }

    const safeCaption = caption ? `<figcaption class="mt-3 text-xs text-stone-500 dark:text-stone-400 font-mono italic text-center w-full">${escapeHtml(caption)}</figcaption>` : '';

    return `\n\n<figure class="editorial-duo my-8 not-prose w-full"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full items-stretch">${cellsHtml}</div>${safeCaption}</figure>\n\n`;
  });

  // 3. :::figure[caption] block
  text = text.replace(/:::figure(?:\[(.*?)\])?\s*([\s\S]*?):::/g, (_, caption: string | undefined, body: string) => {
    const imgMatch = body.match(/!\[(.*?)\]\((.*?)\)/);
    let figureHtml = '';
    if (imgMatch) {
      const alt = escapeHtml(imgMatch[1]?.trim() || '');
      const src = sanitizeImageSrc(imgMatch[2]?.trim() || '');
      figureHtml = `<div class="rounded overflow-hidden border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs aspect-[16/9] w-full bg-[#E8E6DF] dark:bg-[#1C1B19]"><img src="${src}" alt="${alt}" class="w-full h-full object-cover" loading="lazy" /></div>`;
    } else {
      figureHtml = `<div class="rounded overflow-hidden border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs w-full bg-[#E8E6DF] dark:bg-[#1C1B19]">${(marked.parse(body.trim()) as string).replace(/^[ \t]+/gm, '').trim()}</div>`;
    }

    const safeCaption = caption ? `<figcaption class="mt-2.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif italic text-center w-full">${escapeHtml(caption)}</figcaption>` : '';

    return `\n\n<figure class="editorial-figure my-8 not-prose w-full text-center">${figureHtml}${safeCaption}</figure>\n\n`;
  });

  // 4. :::dropcap block or directive
  text = text.replace(/:::dropcap\s*([\s\S]*?):::/g, (_, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return '';
    const firstChar = escapeHtml(trimmed.charAt(0));
    const rest = trimmed.slice(1);
    return `\n\n<p class="editorial-dropcap-paragraph"><span class="editorial-dropcap font-serif float-left text-[3.8rem] leading-[0.8] pr-2.5 pt-1 font-medium text-[#2C2B29] dark:text-[#EDE9E1] select-none">${firstChar}</span>${rest}</p>\n\n`;
  });

  // 5. :::note[title] / :::sidenote[title] block
  text = text.replace(/:::(?:note|sidenote)(?:\[(.*?)\])?\s*([\s\S]*?):::/g, (_, title: string | undefined, body: string) => {
    const renderedBody = (marked.parse(body.trim()) as string).replace(/^[ \t]+/gm, '').trim();
    const titleHeader = title ? `<div class="font-mono text-xs uppercase tracking-widest font-medium text-stone-600 dark:text-stone-400 mb-1.5">${escapeHtml(title)}</div>` : '';

    return `\n\n<aside class="editorial-sidenote my-8 p-5 rounded-sm bg-[#EFECE6]/80 dark:bg-[#1C1B19] border-l-2 border-[#2C2B29] dark:border-[#EDE9E1] shadow-2xs">${titleHeader}<div class="text-sm sm:text-[15px] font-serif text-stone-700 dark:text-stone-300 leading-relaxed">${renderedBody}</div></aside>\n\n`;
  });

  // 6. :::quote[author] block
  text = text.replace(/:::quote(?:\[(.*?)\])?\s*([\s\S]*?):::/g, (_, author: string | undefined, body: string) => {
    const safeAuthor = author ? `<cite class="block mt-3 font-mono text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 not-italic">— ${escapeHtml(author)}</cite>` : '';

    return `\n\n<blockquote class="editorial-pullquote my-10 pl-6 sm:pl-8 border-l-2 border-[#2C2B29] dark:border-[#EDE9E1] font-serif italic text-xl sm:text-2xl text-[#2C2B29] dark:text-[#EDE9E1] leading-relaxed">${body.trim()}${safeAuthor}</blockquote>\n\n`;
  });

  return text;
}
