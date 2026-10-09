<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ZineItem } from '$lib/types';
  import {
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    BookOpen,
    Layers,
    RotateCcw,
    Sparkles,
    Volume2,
    VolumeX,
    FileText,
    Columns2,
    Square
  } from '@lucide/svelte';

  interface Props {
    zine: ZineItem;
  }

  let { zine }: Props = $props();

  let flipStage = $state<HTMLDivElement | null>(null);
  let flipContainer = $state<HTMLDivElement | null>(null);
  let flipBookInstance = $state<any>(null);
  let currentPage = $state(0);
  let totalPages = $derived(zine.pages.length || zine.pageCount || 0);
  let isFullscreen = $state(false);
  let isSoundEnabled = $state(false);
  let isLoaded = $state(false);
  let showThumbnails = $state(false);

  // User preference: 'auto' | 'dual' | 'single'
  let layoutPreference = $state<'auto' | 'dual' | 'single'>('auto');

  // Single page aspect ratio (width / height)
  let baseRatio = $derived(zine.aspectRatio || 0.707);

  // Exact target dimensions for each page
  let pageWidth = $state(450);
  let pageHeight = $state(640);
  let isSinglePageMode = $state(false);

  function calculateAdaptiveDimensions() {
    if (typeof window === 'undefined') return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Available desk area strictly bounded inside viewport
    const isMobile = screenW < 768;
    const availH = Math.min(screenH * (isMobile ? 0.72 : (isFullscreen ? 0.88 : 0.78)), 1000);
    const availW = Math.min(screenW * (isMobile ? 0.94 : 0.90), 1600);

    // Determine whether single page or dual spread
    if (layoutPreference === 'single') {
      isSinglePageMode = true;
    } else if (layoutPreference === 'dual') {
      isSinglePageMode = isMobile; // enforce single on mobile to avoid squishing
    } else {
      // AUTO MODE:
      // If mobile -> single page
      // If landscape zine (ratio > 1.15) and screen isn't huge -> single page fits better
      if (isMobile) {
        isSinglePageMode = true;
      } else if (baseRatio > 1.2 && screenW < 1280) {
        isSinglePageMode = true;
      } else {
        isSinglePageMode = false;
      }
    }

    // Spread aspect ratio:
    // In dual mode: total width = 2 * singleWidth, so ratio is 2 * baseRatio
    // In single mode: total width = singleWidth, so ratio is baseRatio
    const spreadRatio = isSinglePageMode ? baseRatio : baseRatio * 2;

    // Viewport box containment: fit (spreadRatio) strictly into (availW, availH)
    let totalW = availH * spreadRatio;
    let totalH = availH;

    if (totalW > availW) {
      totalW = availW;
      totalH = totalW / spreadRatio;
    }

    // Now derive each single page dimensions
    const singleW = isSinglePageMode ? totalW : totalW / 2;
    const singleH = totalH;

    pageWidth = Math.max(Math.round(singleW), 240);
    pageHeight = Math.max(Math.round(singleH), 340);
  }

  let resizeTimeout: any = null;

  async function initOrUpdateFlipBook() {
    if (!flipContainer) return;

    calculateAdaptiveDimensions();

    try {
      const { PageFlip } = await import('page-flip');

      if (flipBookInstance) {
        try {
          flipBookInstance.destroy();
        } catch {}
      }

      flipBookInstance = new PageFlip(flipContainer, {
        width: pageWidth,
        height: pageHeight,
        size: 'fixed',
        minWidth: 200,
        maxWidth: 1600,
        minHeight: 280,
        maxHeight: 1600,
        drawShadow: true,
        flippingTime: 650,
        usePortrait: isSinglePageMode,
        startZIndex: 10,
        autoSize: false,
        maxShadowOpacity: 0.55,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: true,
      });

      // Load HTML pages
      flipBookInstance.loadFromHTML(flipContainer.querySelectorAll('.zine-page-item'));

      // Restore current page
      if (currentPage > 0) {
        try {
          flipBookInstance.flip(currentPage);
        } catch {}
      }

      flipBookInstance.on('flip', (e: { data: number }) => {
        currentPage = e.data;
        if (isSoundEnabled) {
          playFlipSound();
        }
      });

      flipBookInstance.on('init', () => {
        isLoaded = true;
      });
    } catch (err) {
      console.error('[FlipBook] Initialization error:', err);
    }
  }

  onMount(() => {
    initOrUpdateFlipBook();

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initOrUpdateFlipBook();
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        flipBookInstance?.flipNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        flipBookInstance?.flipPrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(resizeTimeout);
      flipBookInstance?.destroy();
    };
  });

  onDestroy(() => {
    flipBookInstance?.destroy();
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen = true;
        setTimeout(initOrUpdateFlipBook, 100);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
        setTimeout(initOrUpdateFlipBook, 100);
      }).catch(() => {});
    }
  }

  function toggleLayoutMode() {
    if (layoutPreference === 'auto') layoutPreference = 'single';
    else if (layoutPreference === 'single') layoutPreference = 'dual';
    else layoutPreference = 'auto';

    initOrUpdateFlipBook();
  }

  function playFlipSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext muted/unsupported
    }
  }

  function flipTo(pageIdx: number) {
    if (!flipBookInstance) return;
    flipBookInstance.flip(pageIdx);
    showThumbnails = false;
  }
</script>

<div
  bind:this={flipStage}
  class="relative w-full min-h-[82vh] flex flex-col items-center justify-center select-none overflow-hidden py-4 sm:py-6"
  class:fixed={isFullscreen}
  class:inset-0={isFullscreen}
  class:z-50={isFullscreen}
  class:bg-[#141312]={isFullscreen}
  class:min-h-screen={isFullscreen}
>
  <!-- Tactile Desk Stage Container -->
  <div class="relative w-full max-w-7xl mx-auto flex items-center justify-center px-2 sm:px-4">
    <!-- The StPageFlip Container -->
    <div
      bind:this={flipContainer}
      class="zine-flip-viewport relative mx-auto shadow-2xl transition-opacity duration-300 rounded-sm"
      class:opacity-0={!isLoaded}
      class:opacity-100={isLoaded}
    >
      {#each zine.pages as page, idx}
        <div
          class="zine-page-item relative bg-[#F4F2ED] dark:bg-[#1C1B19] overflow-hidden"
          data-density={idx === 0 || idx === zine.pages.length - 1 ? 'hard' : 'soft'}
        >
          <!-- Tactile Paper Tooth Texture Overlay -->
          <div
            class="absolute inset-0 pointer-events-none z-20 opacity-35 mix-blend-multiply dark:mix-blend-overlay"
            style="background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 0); background-size: 4px 4px;"
          ></div>

          <!-- Gutter Center Seam Shadow (Simulates physical book spine fold) -->
          {#if !isSinglePageMode}
            <div
              class="absolute top-0 bottom-0 pointer-events-none z-20 w-8"
              class:left-0={idx % 2 === 1}
              class:right-0={idx % 2 === 0}
              style={idx % 2 === 1
                ? 'background: linear-gradient(to right, rgba(0, 0, 0, 0.16), transparent);'
                : 'background: linear-gradient(to left, rgba(0, 0, 0, 0.16), transparent);'}
            ></div>
          {/if}

          <!-- Page Image: Strictly Contained, Zero Distortion -->
          <img
            src={page.src}
            alt={page.alt || `${zine.title} page ${page.pageNumber}`}
            class="w-full h-full object-contain pointer-events-none select-none bg-[#EFECE6] dark:bg-[#181716]"
            loading={idx < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />

          <!-- Subtle Page Corner Page Number Badge -->
          <div
            class="absolute bottom-3 text-[10px] font-mono tracking-widest text-stone-500/70 select-none pointer-events-none"
            class:left-4={idx % 2 === 0}
            class:right-4={idx % 2 === 1}
          >
            {idx === 0 ? 'COVER' : idx === zine.pages.length - 1 ? 'BACK' : String(idx).padStart(2, '0')}
          </div>
        </div>
      {/each}
    </div>

    <!-- Loading Skeleton indicator while assets hydrate -->
    {#if !isLoaded}
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-800 animate-spin"></div>
        <p class="text-xs font-mono tracking-wider uppercase text-stone-500">Fitting tactile spreads...</p>
      </div>
    {/if}
  </div>

  <!-- Editorial HUD: Floating Bottom Control Strip -->
  <div class="mt-6 z-30 flex items-center justify-center px-4">
    <div
      class="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-full bg-[#EFECE6]/90 dark:bg-[#1E1D1B]/90 border border-[#E2DED4] dark:border-[#2E2C28] backdrop-blur-md shadow-lg text-[#2C2B29] dark:text-[#EDE9E1] text-xs font-mono transition-all"
    >
      <!-- Prev Button -->
      <button
        onclick={() => flipBookInstance?.flipPrev()}
        disabled={currentPage === 0}
        class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous Page"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Page Counter Indicator -->
      <div class="px-2 font-medium tracking-wider whitespace-nowrap min-w-[70px] text-center">
        <span>{String(currentPage + 1).padStart(2, '0')}</span>
        <span class="text-stone-400 mx-1">/</span>
        <span class="text-stone-500">{String(totalPages).padStart(2, '0')}</span>
      </div>

      <!-- Next Button -->
      <button
        onclick={() => flipBookInstance?.flipNext()}
        disabled={currentPage >= totalPages - 1}
        class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next Page"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <div class="h-3.5 w-px bg-stone-300 dark:bg-stone-700 mx-0.5"></div>

      <!-- Layout Mode Toggle (Dual Spread vs Single Page) -->
      <button
        onclick={toggleLayoutMode}
        class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Toggle Layout Mode: {layoutPreference} ({isSinglePageMode ? 'Single Page' : 'Two-Page Spread'})"
        aria-label="Toggle Layout Mode"
      >
        {#if isSinglePageMode}
          <Square class="w-3.5 h-3.5" />
        {:else}
          <Columns2 class="w-3.5 h-3.5" />
        {/if}
      </button>

      <!-- Thumbnails Drawer Toggle -->
      <button
        onclick={() => (showThumbnails = !showThumbnails)}
        class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        class:bg-black={showThumbnails}
        class:text-white={showThumbnails}
        title="Spreads Drawer"
        aria-label="Toggle Spreads Drawer"
      >
        <Layers class="w-3.5 h-3.5" />
      </button>

      <!-- Audio Rustle FX Toggle -->
      <button
        onclick={() => (isSoundEnabled = !isSoundEnabled)}
        class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        class:text-stone-900={isSoundEnabled}
        class:dark:text-stone-100={isSoundEnabled}
        title={isSoundEnabled ? 'Paper audio enabled' : 'Muted'}
        aria-label="Toggle Paper Audio"
      >
        {#if isSoundEnabled}
          <Volume2 class="w-3.5 h-3.5" />
        {:else}
          <VolumeX class="w-3.5 h-3.5 text-stone-400" />
        {/if}
      </button>

      <!-- Fullscreen Toggle -->
      <button
        onclick={toggleFullscreen}
        class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Toggle Fullscreen"
        aria-label="Toggle Fullscreen"
      >
        {#if isFullscreen}
          <Minimize2 class="w-3.5 h-3.5" />
        {:else}
          <Maximize2 class="w-3.5 h-3.5" />
        {/if}
      </button>

      <!-- Download Master PDF Link if available -->
      {#if zine.downloadPdfUrl}
        <a
          href={zine.downloadPdfUrl}
          download
          class="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-0.5"
          title="Download original master PDF"
          aria-label="Download original PDF"
        >
          <FileText class="w-3.5 h-3.5" />
        </a>
      {/if}
    </div>
  </div>

  <!-- Thumbnails Quick-Navigation Drawer -->
  {#if showThumbnails}
    <div
      class="mt-4 max-w-4xl w-full mx-auto px-4 py-3 bg-[#EFECE6]/95 dark:bg-[#1A1917]/95 border border-[#E2DED4] dark:border-[#2E2C28] rounded-xl shadow-xl backdrop-blur-md overflow-x-auto flex gap-3 items-center scrollbar-thin transition-all"
    >
      {#each zine.pages as page, idx}
        <button
          onclick={() => flipTo(idx)}
          class="shrink-0 flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div
            class="w-14 sm:w-16 aspect-[3/4] rounded overflow-hidden border transition-all"
            class:border-[#2C2B29]={currentPage === idx}
            class:ring-2={currentPage === idx}
            class:ring-[#2C2B29]={currentPage === idx}
            class:border-transparent={currentPage !== idx}
          >
            <img src={page.src} alt={page.alt} class="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform" />
          </div>
          <span class="text-[9px] font-mono text-stone-500">{idx + 1}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(.zine-flip-viewport) {
    user-select: none;
    -webkit-user-select: none;
  }
  :global(.zine-page-item) {
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.03);
  }
</style>
