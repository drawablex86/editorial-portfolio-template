import { marked, Marked, type Tokens } from 'marked';
import { RESPONSIVE_WIDTHS } from '$lib/images';

/** Languages the built-in lightweight highlighter knows about. */
const HIGHLIGHT_LANGUAGES = new Set([
  'bash',
  'css',
  'diff',
  'html',
  'javascript',
  'js',
  'json',
  'jsx',
  'md',
  'markdown',
  'python',
  'py',
  'sh',
  'shell',
  'svelte',
  'ts',
  'tsx',
  'typescript',
  'yaml',
  'yml',
]);

const KEYWORD_LANGUAGES = new Set([
  'bash',
  'css',
  'javascript',
  'js',
  'jsx',
  'python',
  'py',
  'sh',
  'shell',
  'svelte',
  'ts',
  'tsx',
  'typescript',
]);

const KEYWORDS =
  'about|after|and|as|async|await|break|case|catch|class|const|continue|def|default|delete|do|elif|else|elseif|end|enum|except|export|extends|false|finally|for|from|function|global|if|implements|import|in|instanceof|interface|lambda|let|none|not|new|null|of|or|pass|print|raise|return|self|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield';

/**
 * Minimal, dependency-free syntax highlighting. Emits `<span class="tok-*">`
 * wrappers that `app.css` colours on the editorial palette — deliberately far
 * lighter than pulling in a highlighter bundle for a handful of essays.
 */
export function highlightCode(code: string, lang?: string): string {
  const language = (lang || '').toLowerCase().trim();
  const keywordPattern = new RegExp(`\\b(?:${KEYWORDS})\\b`, 'g');

  type Rule = { name: string; pattern: RegExp };
  const rules: Rule[] = [];

  if (language === 'json') {
    rules.push({ name: 'key', pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/g });
  }
  if (keywordPattern) {
    rules.push({ name: 'keyword', pattern: keywordPattern });
  }
  if (['css', 'svelte', 'html'].includes(language)) {
    rules.push({ name: 'keyword', pattern: /(?:^|(?<=[\s.{#[]))[a-z-]+(?=\s*:)/g });
  }
  rules.push({ name: 'comment', pattern: /(?:#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?:^|\s)--[^\n]*)/g });
  rules.push({
    name: 'string',
    pattern: /(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
  });
  rules.push({
    name: 'number',
    pattern: /\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
  });

  interface Span {
    name: string;
    start: number;
    end: number;
  }

  // Collect every candidate span across all rules, dropping any that overlap an
  // already-accepted one (earlier rules win, so strings beat keywords inside
  // them and comments swallow everything they contain).
  const spans: Span[] = [];
  for (const rule of rules) {
    for (const match of code.matchAll(rule.pattern)) {
      if (match.index === undefined) continue;
      const start = match.index;
      const end = start + match[0].length;
      if (start === end) continue;
      if (spans.some((s) => start < s.end && end > s.start)) continue;
      spans.push({ name: rule.name, start, end });
    }
  }

  spans.sort((a, b) => a.start - b.start);

  let out = '';
  let cursor = 0;
  for (const span of spans) {
    out += escapeHtml(code.slice(cursor, span.start));
    out += `<span class="tok-${span.name}">${escapeHtml(code.slice(span.start, span.end))}</span>`;
    cursor = span.end;
  }
  out += escapeHtml(code.slice(cursor));
  return out;
}


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
 * Builds the responsive `srcset` for an image the pipeline has already staged.
 *
 * Only local `/images/*.webp` masters get a ladder: external and data URIs have
 * no siblings on disk, and a `srcset` pointing at 404s makes the browser
 * download the fallback candidate first, which is worse than no `srcset`.
 */
export function buildResponsiveSrcset(src: string, maxWidth = 2400): string {
  const master = src.replace(/&amp;/g, '&');
  if (!/^\/images\/.*\.webp$/i.test(master)) return '';
  const candidates = RESPONSIVE_WIDTHS.filter((w) => w < maxWidth).map((w) => {
    const variant = master.replace(/\.webp$/i, `-${w}.webp`);
    return `${variant} ${w}w`;
  });
  return candidates.join(', ');
}

/**
 * A directive-staged figure image rendered with `srcset`/`sizes`.
 *
 * `:::figure` and `:::duo` substitute their markdown before `marked` ever sees
 * it, so they do not pass through the `image` renderer. Without this helper they
 * would be the only images on the site still streaming a master-sized plate into
 * a grid cell.
 *
 * `widths` should be the widest the slot can ever render (a duo cell is half the
 * reading column, a solo figure is the whole thing).
 */
export function renderDirectiveImage(
  src: string,
  alt: string,
  options: { sizes: string; maxWidth?: number } = { sizes: '100vw' }
): string {
  const safeSrc = sanitizeImageSrc(src);
  if (!safeSrc) return '';
  const safeAlt = escapeHtml(alt || '');
  const srcset = buildResponsiveSrcset(safeSrc, options.maxWidth);
  const srcsetAttr = srcset ? ` srcset="${srcset}" sizes="${escapeHtml(options.sizes)}"` : '';
  return `<img src="${safeSrc}" alt="${safeAlt}"${srcsetAttr} loading="lazy" decoding="async" />`;
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
        const alt = m[1]?.trim() || '';
        const src = m[2]?.trim() || '';
        const img = renderDirectiveImage(src, alt, {
          sizes: '(min-width: 640px) 34vw, 100vw',
          maxWidth: 1200
        });
        const badge = alt ? `<span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs shadow-xs pointer-events-none">${escapeHtml(alt)}</span>` : '';
        return `<div class="relative overflow-hidden rounded bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center group">${img}${badge}</div>`;
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
      const img = renderDirectiveImage(imgMatch[2]?.trim() || '', imgMatch[1]?.trim() || '', {
        sizes: '(min-width: 768px) 68ch, 100vw',
        maxWidth: 2400
      });
      figureHtml = `<div class="rounded overflow-hidden border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs aspect-[16/9] w-full bg-[#E8E6DF] dark:bg-[#1C1B19]">${img}</div>`;
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

/* ---------------------------------------------------------------------------
   Long-form navigation: heading anchors + table of contents
   ------------------------------------------------------------------------- */

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface RenderedEditorial {
  html: string;
  toc: TocItem[];
}

/**
 * Slugifies heading text into a URL-safe, human-readable anchor id.
 * Falls back to a generic "section" base when the heading has no
 * slug-safe characters (e.g. a heading made entirely of punctuation).
 */
export function slugifyHeading(text: string): string {
  const base = text
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
  return base || 'section';
}

/** Reduces inline markdown (emphasis, links, code) to plain TOC label text. */
function toPlainHeadingText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Renders markdown through the editorial pipeline and returns the final
 * sanitized HTML together with a table of contents built from headings.
 *
 * Every `##`/`###`/`####` heading receives a unique slug `id` so long-form
 * essays and case studies can be deep-linked, and so a table of contents can
 * anchor to it. Duplicate headings get deterministic `-2`, `-3`… suffixes.
 */
export function renderEditorialMarkdown(markdown: string): RenderedEditorial {
  const processedText = preprocessEditorialDirectives(markdown);

  const toc: TocItem[] = [];
  const seenIds = new Map<string, number>();

  // A local Marked instance keeps the heading renderer (and the collected TOC)
  // scoped to this render instead of mutating the shared singleton used by the
  // directive preprocessor above.
  const md = new Marked();
  md.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const renderedInline = this.parser.parseInline(tokens) as string;
        const label = toPlainHeadingText(
          renderedInline.replace(/<[^>]*>/g, ' ')
        );

        const base = slugifyHeading(label);
        const count = seenIds.get(base) ?? 0;
        seenIds.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count + 1}`;

        // Table of contents covers section (h2) and sub-section (h3) depth.
        if (depth >= 2 && depth <= 3 && label) {
          toc.push({ id, text: label, depth });
        }

        const anchor = `<a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a>`;
        return `<h${depth} id="${escapeHtml(id)}">${renderedInline}${anchor}</h${depth}>\n`;
      },

      // Plain markdown images inside prose should not block first paint, and
      // should not download a 2400px plate into a 68ch reading column.
      image({ href, title, text }: Tokens.Image) {
        const src = sanitizeImageSrc(href || '');
        const alt = escapeHtml(text || '');
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        if (!src) return '';
        const srcset = buildResponsiveSrcset(src);
        const srcsetAttr = srcset ? ` srcset="${srcset}" sizes="(min-width: 768px) 68ch, 100vw"` : '';
        return `<img src="${src}" alt="${alt}"${titleAttr}${srcsetAttr} loading="lazy" decoding="async" />`;
      },

      // Code blocks: language chip, copy affordance, and light highlighting.
      code({ text, lang }: Tokens.Code) {
        const language = (lang || '').split(/\s+/)[0]?.toLowerCase() || '';
        const raw = text.replace(/\n$/, '');
        const known = HIGHLIGHT_LANGUAGES.has(language);
        const body = known ? highlightCode(raw, language) : escapeHtml(raw);
        const langClass = language ? ` language-${escapeHtml(language)}` : '';

        return `<div class="code-block not-prose">
  <div class="code-block__bar">
    <span class="code-block__lang">${escapeHtml(language || 'text')}</span>
    <button type="button" class="code-block__copy" data-copy-code aria-label="Copy code to clipboard">
      <span data-copy-label>Copy</span>
    </button>
  </div>
  <pre><code class="code-block__code${langClass}">${body}</code></pre>
</div>\n`;
      },

      // Anchors leave the site in a new tab; internal links stay in-page.
      link({ href, title, tokens }: Tokens.Link) {
        const rendered = this.parser.parseInline(tokens) as string;
        const url = href || '';
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';

        const isHash = url.startsWith('#');
        const isExternal = /^https?:\/\//i.test(url);
        const isProtocolRelative = url.startsWith('//');
        const externalAttrs =
          isExternal || isProtocolRelative
            ? ' target="_blank" rel="noopener noreferrer"'
            : '';

        // Relative links are normalised to root-relative so they resolve from
        // any nested route (e.g. `/blog/some-post` inside `/works/a-slug`).
        const normalised =
          !isExternal && !isProtocolRelative && !isHash && !url.startsWith('/') && !url.startsWith('mailto:') && !url.startsWith('tel:')
            ? `/${url}`
            : url;

        return `<a href="${escapeHtml(normalised)}"${titleAttr}${externalAttrs}>${rendered}</a>`;
      },
    },
  });

  const parsedRaw = md.parse(processedText) as string;
  return { html: sanitizeRenderedHtml(parsedRaw), toc };
}
