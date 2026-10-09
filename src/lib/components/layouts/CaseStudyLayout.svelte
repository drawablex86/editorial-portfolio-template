<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import { X, ZoomIn, ArrowLeft, ArrowRight, Share2, Check } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
  }

  let { project }: Props = $props();

  let activeLightboxImg = $state<string | null>(null);
  let activeLightboxCaption = $state<string | null>(null);
  let hasCopiedLink = $state(false);

  function openLightbox(src?: string, caption?: string) {
    if (!src) return;
    activeLightboxImg = src;
    activeLightboxCaption = caption || null;
  }

  function closeLightbox() {
    activeLightboxImg = null;
    activeLightboxCaption = null;
  }

  async function shareProject() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      hasCopiedLink = true;
      setTimeout(() => (hasCopiedLink = false), 2500);
    }
  }

  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
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
          <span class="text-emerald-700">Link Copied!</span>
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
      onclick={() => openLightbox(project.thumbnailSrc, project.title)}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && openLightbox(project.thumbnailSrc, project.title)}
      class="group relative aspect-[16/9] w-full overflow-hidden rounded-md bg-[#E8E6DF] dark:bg-[#1C1B19] shadow-md border border-[#E8E6DF] dark:border-[#2E2C28] cursor-zoom-in"
    >
      <img
        src={project.thumbnailSrc}
        alt={project.title}
        onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
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
          <div
            role="button"
            tabindex="0"
            onclick={() => openLightbox(img, `${project.title} — Artifact ${idx + 1}`)}
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && openLightbox(img, `${project.title} — Artifact ${idx + 1}`)}
            class="group relative overflow-hidden rounded bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs aspect-[4/3] cursor-zoom-in"
          >
            <img
              src={img}
              alt="{project.title} Artifact {idx + 1}"
              loading="lazy"
              onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
              class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div class="absolute bottom-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={13} />
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</article>

<!-- Fullscreen Lightbox Modal -->
{#if activeLightboxImg}
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={closeLightbox}
    onkeydown={(e) => e.key === 'Escape' && closeLightbox()}
    class="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-in fade-in"
  >
    <button
      type="button"
      onclick={closeLightbox}
      class="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      aria-label="Close image viewer"
    >
      <X size={20} />
    </button>

    <div
      role="presentation"
      class="max-w-5xl max-h-[85vh] flex flex-col items-center select-none"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <img
        src={activeLightboxImg}
        alt="Expanded artifact inspection"
        class="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
      />
      {#if activeLightboxCaption}
        <p class="mt-3 text-xs sm:text-sm font-serif italic text-stone-300 text-center">
          {activeLightboxCaption}
        </p>
      {/if}
    </div>
  </div>
{/if}
