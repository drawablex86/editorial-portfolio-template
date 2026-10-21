<script lang="ts">
  import { variantSrc, srcsetWidths, IMAGE_SIZES } from '$lib/images';

  interface Props {
    /** Master image URL; always rendered as `src`. */
    src: string;
    /** Real alternative text. Never a generic "image" placeholder. */
    alt: string;
    /** Layout slot name from `IMAGE_SIZES`, or a raw `sizes` string. */
    sizes?: keyof typeof IMAGE_SIZES | string;
    /**
     * Intrinsic master width in px. Supplying it enables the `srcset` ladder;
     * omit it for images that are always displayed small (thumbnails).
     */
    width?: number | null;
    /** Intrinsic master height in px — reserves layout space and prevents CLS. */
    height?: number | null;
    /**
     * `lcp` = the detail-page hero: eager + high priority.
     * `eager` = above the fold without being the LCP candidate.
     * `lazy` = everything else (the default).
     */
    priority?: 'lcp' | 'eager' | 'lazy';
    /** Responsive ladder to advertise. Omit to derive from `width`. */
    variantWidths?: number[];
    /** Shown if the master fails to load. */
    fallbackSrc?: string;
    class?: string;
    /** Extra attributes (onerror handlers, data hooks) forwarded to the `<img>`. */
    [key: string]: unknown;
  }

  let {
    src,
    alt,
    sizes = 'card',
    width = null,
    height = null,
    priority = 'lazy',
    variantWidths,
    fallbackSrc,
    class: className = '',
    ...rest
  }: Props = $props();

  let resolvedSizes = $derived(
    sizes in IMAGE_SIZES ? IMAGE_SIZES[sizes as keyof typeof IMAGE_SIZES] : sizes
  );

  let ladder = $derived(variantWidths ?? srcsetWidths(width));

  // `fallbackSrc` is applied once so a broken fallback cannot loop onerror.
  let isFallbackApplied = $state(false);

  let srcset = $derived(
    ladder.length > 0 && !isFallbackApplied
      ? ladder.map((w) => `${variantSrc(src, w)} ${w}w`).join(', ')
      : undefined
  );

  function handleError(e: Event) {
    const el = e.currentTarget as HTMLImageElement;
    if (!isFallbackApplied && fallbackSrc) {
      isFallbackApplied = true;
      el.src = fallbackSrc;
      el.removeAttribute('srcset');
    }
  }
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<img
  {src}
  {alt}
  {srcset}
  sizes={srcset ? resolvedSizes : undefined}
  width={width ?? undefined}
  height={height ?? undefined}
  loading={priority === 'lazy' ? 'lazy' : 'eager'}
  fetchpriority={priority === 'lcp' ? 'high' : 'auto'}
  decoding="async"
  onerror={handleError}
  class={className}
  {...rest}
/>
