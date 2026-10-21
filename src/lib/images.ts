/**
 * Responsive image helpers shared by the `<Image>` component, the lightbox, and
 * the Markdown renderer.
 *
 * The media pipeline (`scripts/process-images.mjs`) emits a master WebP plus a
 * ladder of `-480/-768/-1200/-1600` siblings next to it. Nothing here probes the
 * filesystem — SvelteKit's `static/` directory is served as-is, so the variants
 * either exist (a real `srcset` is emitted) or they do not (a broken `srcset`
 * would make the browser fall back to the first candidate, which is why the
 * `srcset` is opt-in and the `src` attribute always points at the master).
 */

/** Widths the pipeline can emit, ascending. Must match `RESPONSIVE_WIDTHS`. */
export const RESPONSIVE_WIDTHS = [480, 768, 1200, 1600];

/** `hero.webp` + 768 -> `hero-768.webp`. Mirrors `variantName()` in the script. */
export function variantSrc(src: string, width: number): string {
  const match = /^(.*?)(\.[a-z0-9]+)$/i.exec(src);
  if (!match) return src;
  return `${match[1]}-${width}${match[2]}`;
}

/**
 * Widths to advertise for an image whose intrinsic width is `maxWidth`.
 *
 * Widths at or above the intrinsic width are dropped: upscaling a 1200px card
 * into a 1600w slot is worse than letting the browser use the master. A width
 * smaller than the smallest breakpoint would ask the browser to download a
 * variant that cannot exist.
 */
export function srcsetWidths(maxWidth?: number | null): number[] {
  if (!maxWidth) return [];
  return RESPONSIVE_WIDTHS.filter((w) => w < maxWidth);
}

/**
 * `sizes` values for the common layout slots, derived from the site's own
 * breakpoints. Kept here so a layout change is a one-line edit rather than a
 * hunt through every `<img>`.
 */
export const IMAGE_SIZES = {
  /** Full-bleed hero inside the max-w-7xl shell. */
  hero: '(min-width: 1280px) 1280px, 100vw',
  /** Two-up gallery grid that collapses to one column on mobile. */
  halfGrid: '(min-width: 768px) 50vw, 100vw',
  /** Three-up series grid. */
  thirdGrid: '(min-width: 768px) 33vw, 50vw',
  /** Fixed-height index-table row thumbnail. */
  rowThumb: '120px',
  /** Archive card in the home/works grid. */
  card: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
} as const;
