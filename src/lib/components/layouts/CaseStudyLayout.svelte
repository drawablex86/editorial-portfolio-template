<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import ImageLightbox, { type LightboxItem } from '$lib/components/common/ImageLightbox.svelte';
  import Image from '$lib/components/common/Image.svelte';
  import { ZoomIn, Share2, Check } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
  }

  let { project }: Props = $props();

  let lightboxIndex = $state<number | null>(null);
  let hasCopiedLink = $state(false);

  /**
   * Single ordered set of viewable images so the hero plate and the gallery
   * plates share one viewer with working ← / → navigation and a counter.
   */
  let lightboxItems = $derived.by<LightboxItem[]>(() => {
    const items: LightboxItem[] = [];
    if (project.thumbnailSrc) {
      items.push({
        src: project.thumbnailSrc,
        alt: `${project.title}${project.year ? ` (${project.year})` : ''} — lead plate`,
        caption: project.description || null
      });
    }
    for (const [i, src] of (project.gallery ?? []).entries()) {
      const total = project.gallery?.length ?? 0;
      items.push({
        src,
        alt: `${project.title} — artifact plate ${i + 1} of ${total}`,
        caption: project.client ? `${project.client} · Plate ${i + 1}` : `Plate ${i + 1}`
      });
    }
    return items;
  });

  /** EXIF-ish strip shown in the viewer when the project carries the metadata. */
  let lightboxExif = $derived(
    [
      project.client ? { label: 'Client', value: project.client } : null,
      project.role ? { label: 'Role', value: project.role } : null,
      project.year ? { label: 'Year', value: project.year } : null
    ].filter((row): row is { label: string; value: string } => row !== null)
  );

  function openLightboxAt(index: number) {
    lightboxIndex = index;
  }

  function closeLightbox() {
    lightboxIndex = null;
  }

  // Space/Enter activate divs styled as buttons; Space must not also scroll.
  function handlePlateKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightboxAt(index);
    }
  }

  async function shareProject() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      hasCopiedLink = true;
      setTimeout(() => (hasCopiedLink = false), 2500);
    }
  }
</script>

<article class="max-w-4xl mx-auto space-y-12 select-none">
  <!-- Case Study Header -->
  <header class="space-y-6 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-[11px] uppercase tracking-widest font-mono px-2.5 py-1 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded font-medium">
          Case Study
        </span>
        {#if project.year}
          <span class="text-xs uppercase tracking-widest text-stone-500 font-mono">
            {project.year}
          </span>
        {/if}
      </div>

      <button
        type="button"
        onclick={shareProject}
        class="inline-flex items-center gap-1.5 text-xs font-mono text-stone-500 hover:text-stone-900 dark:hover:text-white px-2.5 py-1 rounded bg-[#EFECE6] dark:bg-[#1C1B19] border border-[#E2DED4] dark:border-[#2E2C28] transition-colors"
        title="Copy project link"
      >
        {#if hasCopiedLink}
          <Check size={12} class="text-emerald-600" />
          <span role="status" aria-live="polite" class="text-emerald-700">Link Copied!</span>
        {:else}
          <Share2 size={12} />
          <span>Share</span>
        {/if}
      </button>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-tight font-serif">
      {project.title}
    </h1>

    {#if project.description}
      <p class="text-lg md:text-xl text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
        {project.description}
      </p>
    {/if}

    <!-- System Spec Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E8E6DF]/60 dark:border-[#2E2C28] text-xs">
      {#if project.client}
        <div>
          <span class="block uppercase tracking-widest text-stone-500 font-mono text-[10px]">Client / Org</span>
          <span class="font-medium text-[#2C2B29] dark:text-[#EDE9E1] mt-0.5 block">{project.client}</span>
        </div>
      {/if}
      {#if project.role}
        <div>
          <span class="block uppercase tracking-widest text-stone-500 font-mono text-[10px]">Role</span>
          <span class="font-medium text-[#2C2B29] dark:text-[#EDE9E1] mt-0.5 block">{project.role}</span>
        </div>
      {/if}
      {#if project.deliverables && project.deliverables.length > 0}
        <div class="col-span-2">
          <span class="block uppercase tracking-widest text-stone-500 font-mono text-[10px]">Deliverables</span>
          <span class="font-medium text-[#2C2B29] dark:text-[#EDE9E1] mt-0.5 block">{project.deliverables.join(' · ')}</span>
        </div>
      {/if}
    </div>
  </header>

  <!-- Hero Visual with Click to Lightbox -->
  {#if project.thumbnailSrc}
    <div
      role="button"
      tabindex="0"
      onclick={() => openLightboxAt(0)}
      onkeydown={(e) => handlePlateKeydown(e, 0)}
      class="group relative aspect-[16/9] w-full overflow-hidden rounded-md bg-[#E8E6DF] dark:bg-[#1C1B19] shadow-md border border-[#E8E6DF] dark:border-[#2E2C28] cursor-zoom-in"
    >
      <Image
        src={project.thumbnailSrc}
        alt={`${project.title}${project.year ? ` (${project.year})` : ''} — lead plate`}
        sizes="hero"
        width={2400}
        priority="lcp"
        fallbackSrc={FALLBACK_IMAGE}
        class="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
      />
      <div class="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn size={14} />
      </div>
    </div>
  {/if}

  <!-- Case Narrative Body with Editorial Directives Enabled -->
  {#if project.body}
    <MarkdownRenderer
      content={project.body}
      className="editorial-prose pt-4"
      toc
      tocTitle="In This Case Study"
    />
  {/if}

  <!-- Gallery Artifact Stream -->
  {#if project.gallery && project.gallery.length > 0}
    <section class="space-y-6 pt-12 border-t border-[#E8E6DF] dark:border-[#2E2C28]">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-mono uppercase tracking-widest text-stone-500">
          Exhibition Plates &amp; Design Artifacts
        </h3>
        <span class="text-xs font-mono text-stone-400">{project.gallery.length} items</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each project.gallery as img, idx}
          {@const itemIndex = project.thumbnailSrc ? idx + 1 : idx}
          <div
            role="button"
            tabindex="0"
            onclick={() => openLightboxAt(itemIndex)}
            onkeydown={(e) => handlePlateKeydown(e, itemIndex)}
            class="group relative overflow-hidden rounded bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs aspect-[4/3] cursor-zoom-in"
          >
            <Image
              src={img}
              alt="{project.title} — artifact plate {idx + 1} of {project.gallery.length}"
              sizes="halfGrid"
              width={2400}
              fallbackSrc={FALLBACK_IMAGE}
              class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs pointer-events-none">
              Plate {idx + 1}
            </span>
            <div class="absolute bottom-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={13} />
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</article>

<ImageLightbox
  items={lightboxItems}
  index={lightboxIndex}
  onClose={closeLightbox}
  onIndexChange={(i) => (lightboxIndex = i)}
  label="Case study image viewer"
  fallbackSrc={FALLBACK_IMAGE}
  exif={lightboxExif}
/>
