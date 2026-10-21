<script lang="ts">
  import { trapFocus } from '$lib/overlay';
  import { X, ChevronLeft, ChevronRight } from '@lucide/svelte';

  export interface LightboxItem {
    src: string;
    /** Real alternative text — never a generic "expanded image" string. */
    alt: string;
    /** Optional caption / EXIF line rendered under the image. */
    caption?: string | null;
  }

  interface Props {
    items: LightboxItem[];
    /** Index of the open item, or null when closed. */
    index: number | null;
    onClose: () => void;
    onIndexChange: (index: number) => void;
    label?: string;
    /** Fallback applied when an image fails to load. */
    fallbackSrc?: string;
    /** EXIF strip shown above the caption (camera, lens, location…). */
    exif?: Array<{ label: string; value: string }>;
  }

  let {
    items,
    index,
    onClose,
    onIndexChange,
    label = 'Image viewer',
    fallbackSrc,
    exif = []
  }: Props = $props();

  let lightboxEl: HTMLDivElement | null = $state(null);

  let isOpen = $derived(index !== null && index >= 0 && index < items.length);
  let current = $derived(isOpen ? items[index as number] : null);
  let hasMany = $derived(items.length > 1);

  const SWIPE_THRESHOLD = 60;
  let touchStartX = $state<number | null>(null);
  let touchStartY = $state<number | null>(null);

  function goPrev() {
    if (!isOpen || !hasMany) return;
    onIndexChange(((index as number) - 1 + items.length) % items.length);
  }

  function goNext() {
    if (!isOpen || !hasMany) return;
    onIndexChange(((index as number) + 1) % items.length);
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0]?.clientX ?? null;
    touchStartY = e.changedTouches[0]?.clientY ?? null;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX === null || touchStartY === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
    const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStartY;
    touchStartX = null;
    touchStartY = null;

    // Horizontal intent only: ignore vertical scroll gestures.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  // Focus trap + scroll lock + focus restore while open. The container is
  // focused rather than the close button so arrow keys reach our handler.
  $effect(() => {
    if (!isOpen || !lightboxEl) return;
    return trapFocus(lightboxEl, { initialFocus: lightboxEl });
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  }}
/>

{#if isOpen && current}
  <div
    bind:this={lightboxEl}
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    class="fixed inset-0 z-50 bg-[#141312]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 cursor-zoom-out focus:outline-none"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
  >
    <button
      type="button"
      onclick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      aria-label="Close image viewer"
      title="Close (Esc)"
      class="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
    >
      <X size={22} />
    </button>

    {#if hasMany}
      <button
        type="button"
        onclick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        aria-label="Previous image"
        title="Previous (Arrow Left)"
        class="absolute left-2 sm:left-6 z-10 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronLeft size={30} />
      </button>

      <button
        type="button"
        onclick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        aria-label="Next image"
        title="Next (Arrow Right)"
        class="absolute right-2 sm:right-6 z-10 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronRight size={30} />
      </button>
    {/if}

    <figure
      class="max-w-5xl max-h-[85vh] flex flex-col items-center cursor-default"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <!-- The viewer is the full-resolution path: no srcset, because the plate
           is already loaded from the grid and a ladder would re-download it. -->
      <img
        src={current.src}
        alt={current.alt}
        onerror={(e) => {
          if (fallbackSrc) (e.currentTarget as HTMLImageElement).src = fallbackSrc;
        }}
        class="max-h-[76vh] w-auto max-w-full object-contain rounded-xs shadow-2xl"
      />

      <figcaption class="mt-3 max-w-2xl text-center space-y-1.5">
        {#if exif.length > 0}
          <div class="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-stone-400">
            {#each exif as row}
              <span>{row.label}: <span class="text-stone-200">{row.value}</span></span>
            {/each}
          </div>
        {/if}

        {#if current.caption}
          <p class="text-xs sm:text-sm font-serif italic text-stone-300">{current.caption}</p>
        {/if}

        {#if hasMany}
          <p
            class="text-[11px] font-mono text-stone-400 pt-0.5"
            role="status"
            aria-live="polite"
          >
            {(index as number) + 1} / {items.length}
          </p>
        {/if}
      </figcaption>
    </figure>
  </div>
{/if}
