<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import ImageLightbox, { type LightboxItem } from '$lib/components/common/ImageLightbox.svelte';
  import Image from '$lib/components/common/Image.svelte';
  import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
  }

  let { project }: Props = $props();

  let zoomLevel = $state(1);
  let lightboxIndex = $state<number | null>(null);

  let artworks = $derived(
    project.gallery && project.gallery.length > 0
      ? project.gallery
      : (project.thumbnailSrc ? [project.thumbnailSrc] : [])
  );

  let plateNoun = $derived(project.projectType === 'sketchbook' ? 'sketch' : 'study');

  let lightboxItems = $derived<LightboxItem[]>(
    artworks.map((src, idx) => ({
      src,
      alt:
        idx === 0
          ? `${project.title}${project.year ? ` (${project.year})` : ''} — ${plateNoun}, ${project.medium || 'mixed media'}`
          : `${project.title} — ${plateNoun} plate ${idx + 1} of ${artworks.length}, ${project.medium || 'mixed media'}`,
      caption: idx === 0 ? project.title : `Plate ${idx + 1}`
    }))
  );

  let lightboxExif = $derived(
    [
      project.medium ? { label: 'Medium', value: project.medium } : null,
      project.dimensions ? { label: 'Dimensions', value: project.dimensions } : null,
      project.year ? { label: 'Year', value: project.year } : null
    ].filter((row): row is { label: string; value: string } => row !== null)
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
          <Image
            src={artworks[0]}
            alt="{project.title}{project.year ? ` (${project.year})` : ''} — {plateNoun}, {project.medium || 'mixed media'}"
            sizes="hero"
            width={2400}
            priority="lcp"
            fallbackSrc={FALLBACK_IMAGE}
            class="max-h-[70vh] w-auto object-contain mx-auto shadow-xs"
          />
        </div>
      </div>

      <button
        type="button"
        onclick={() => (lightboxIndex = 0)}
        class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/80 dark:bg-[#1C1B19] text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:border-stone-400 dark:hover:border-stone-600 transition-all cursor-pointer"
      >
        <Maximize2 size={14} />
        <span>View Full Resolution</span>
      </button>
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
          <button
            type="button"
            onclick={() => (lightboxIndex = idx + 1)}
            aria-label="View plate {idx + 2} of {artworks.length} full resolution"
            class="group relative bg-white dark:bg-[#1C1B19] p-2 rounded-xs border border-[#E8E6DF] dark:border-[#2E2C28] cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 transition-colors"
          >
            <Image
              src={src}
              alt="{project.title} — {plateNoun} plate {idx + 2} of {artworks.length}"
              sizes="thirdGrid"
              width={2400}
              fallbackSrc={FALLBACK_IMAGE}
              class="w-full aspect-[4/5] object-contain"
            />
            <span class="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none">
              <ZoomIn size={13} />
            </span>
            <span class="absolute top-3 left-3 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/50 text-white pointer-events-none">
              {idx + 2}
            </span>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</article>

<ImageLightbox
  items={lightboxItems}
  index={lightboxIndex}
  onClose={() => (lightboxIndex = null)}
  onIndexChange={(i) => (lightboxIndex = i)}
  label="Artwork viewer"
  fallbackSrc={FALLBACK_IMAGE}
  exif={lightboxExif}
/>
