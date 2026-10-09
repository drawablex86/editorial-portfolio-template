<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import { ZoomIn, ZoomOut, RotateCcw } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
  }

  let { project }: Props = $props();

  let zoomLevel = $state(1);

  let artworks = $derived(
    project.gallery && project.gallery.length > 0
      ? project.gallery
      : (project.thumbnailSrc ? [project.thumbnailSrc] : [])
  );

  function handleZoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.3, 2.5);
  }

  function handleZoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.3, 0.8);
  }

  function handleResetZoom() {
    zoomLevel = 1;
  }
</script>

<article class="max-w-4xl mx-auto space-y-12">
  <!-- Editorial Header -->
  <header class="space-y-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <span class="text-[11px] uppercase tracking-widest font-mono px-2 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xs inline-block">
      Artwork &amp; Studio Practice
    </span>
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-tight">
      {project.title}
    </h1>

    <!-- Medium & Dimensions Block -->
    <div class="flex flex-wrap gap-6 pt-2 text-xs font-mono text-stone-600 dark:text-stone-400">
      {#if project.medium}
        <div>
          <span class="block uppercase tracking-widest text-stone-400 dark:text-stone-500 text-[10px]">Medium</span>
          <span class="mt-0.5 block font-medium text-[#2C2B29] dark:text-[#EDE9E1]">{project.medium}</span>
        </div>
      {/if}
      {#if project.dimensions}
        <div>
          <span class="block uppercase tracking-widest text-stone-400 dark:text-stone-500 text-[10px]">Dimensions</span>
          <span class="mt-0.5 block">{project.dimensions}</span>
        </div>
      {/if}
      {#if project.year}
        <div>
          <span class="block uppercase tracking-widest text-stone-400 dark:text-stone-500 text-[10px]">Year</span>
          <span class="mt-0.5 block">{project.year}</span>
        </div>
      {/if}
    </div>
  </header>

  <!-- Artwork Viewer with Zoom Controls -->
  {#if artworks[0]}
    <section class="space-y-3">
      <div class="flex justify-end gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
        <button
          onclick={handleZoomIn}
          class="min-h-[40px] px-3 py-2 bg-white dark:bg-[#1C1B19] hover:bg-stone-100 dark:hover:bg-[#242320] text-stone-700 dark:text-stone-300 rounded border border-[#E8E6DF] dark:border-[#2E2C28] flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] cursor-pointer"
          title="Zoom In"
          aria-label="Zoom in on artwork"
        >
          <ZoomIn size={15} /> <span>Zoom In</span>
        </button>
        <button
          onclick={handleZoomOut}
          class="min-h-[40px] px-3 py-2 bg-white dark:bg-[#1C1B19] hover:bg-stone-100 dark:hover:bg-[#242320] text-stone-700 dark:text-stone-300 rounded border border-[#E8E6DF] dark:border-[#2E2C28] flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom out on artwork"
        >
          <ZoomOut size={15} /> <span>Zoom Out</span>
        </button>
        <button
          onclick={handleResetZoom}
          class="min-h-[40px] px-3 py-2 bg-white dark:bg-[#1C1B19] hover:bg-stone-100 dark:hover:bg-[#242320] text-stone-700 dark:text-stone-300 rounded border border-[#E8E6DF] dark:border-[#2E2C28] flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] cursor-pointer"
          title="Reset Zoom"
          aria-label="Reset zoom level to default"
        >
          <RotateCcw size={15} /> <span>Reset</span>
        </button>
      </div>

      <div class="overflow-hidden rounded-sm bg-white dark:bg-[#1C1B19] p-4 sm:p-8 border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs flex items-center justify-center min-h-[420px]">
        <div
          style="transform: scale({zoomLevel}); transition: transform 0.3s ease-out;"
          class="origin-center max-w-full max-h-full"
        >
          <img
            src={artworks[0]}
            alt={project.title}
            onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
            class="max-h-[70vh] w-auto object-contain mx-auto shadow-xs"
          />
        </div>
      </div>
    </section>
  {/if}

  <!-- Narrative -->
  {#if project.body}
    <MarkdownRenderer
      content={project.body}
      className="editorial-prose pt-4"
    />
  {/if}

  <!-- Series Studies Grid -->
  {#if artworks.length > 1}
    <section class="space-y-4 pt-10 border-t border-[#E8E6DF] dark:border-[#2E2C28]">
      <h3 class="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
        Series Studies &amp; Plates
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        {#each artworks.slice(1) as src, idx}
          <div class="bg-white dark:bg-[#1C1B19] p-2 rounded-xs border border-[#E8E6DF] dark:border-[#2E2C28]">
            <img
              src={src}
              alt="Study plate {idx + 2}"
              onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
              class="w-full aspect-[4/5] object-contain"
              loading="lazy"
            />
          </div>
        {/each}
      </div>
    </section>
  {/if}
</article>
