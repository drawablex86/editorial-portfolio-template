<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import { Camera, MapPin, Sliders, X, ChevronLeft, ChevronRight } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
  }

  let { project }: Props = $props();

  let selectedPhotoIndex = $state<number | null>(null);

  let photos = $derived(
    project.gallery && project.gallery.length > 0
      ? project.gallery
      : (project.thumbnailSrc ? [project.thumbnailSrc] : [])
  );

  function openLightbox(index: number) {
    selectedPhotoIndex = index;
  }

  function closeLightbox() {
    selectedPhotoIndex = null;
  }

  function prevPhoto() {
    if (selectedPhotoIndex === null) return;
    selectedPhotoIndex = (selectedPhotoIndex - 1 + photos.length) % photos.length;
  }

  function nextPhoto() {
    if (selectedPhotoIndex === null) return;
    selectedPhotoIndex = (selectedPhotoIndex + 1) % photos.length;
  }

  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<article class="max-w-5xl mx-auto space-y-12">
  <!-- Header with Camera Spec Strip -->
  <header class="space-y-6 text-center max-w-2xl mx-auto border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-10">
    <span class="text-[11px] uppercase tracking-widest font-mono px-2.5 py-1 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xs inline-block">
      Photography Series
    </span>
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-tight">
      {project.title}
    </h1>
    {#if project.description}
      <p class="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-serif leading-relaxed italic">
        {project.description}
      </p>
    {/if}

    <!-- Technical Camera & Gear Metadata Strip -->
    <div class="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-4 text-xs text-stone-600 dark:text-stone-400 font-mono border-t border-[#E8E6DF]/60 dark:border-[#2E2C28]">
      {#if project.camera}
        <div class="flex items-center gap-1.5">
          <Camera size={14} class="text-stone-400 dark:text-stone-500" />
          <span>{project.camera}</span>
        </div>
      {/if}
      {#if project.lens}
        <div class="flex items-center gap-1.5">
          <Sliders size={14} class="text-stone-400 dark:text-stone-500" />
          <span>{project.lens}</span>
        </div>
      {/if}
      {#if project.location}
        <div class="flex items-center gap-1.5">
          <MapPin size={14} class="text-stone-400 dark:text-stone-500" />
          <span>{project.location}</span>
        </div>
      {/if}
    </div>
  </header>

  <!-- Narrative Essay -->
  {#if project.body}
    <div class="max-w-2xl mx-auto text-center">
      <MarkdownRenderer
        content={project.body}
        className="editorial-prose max-w-2xl mx-auto text-center"
      />
    </div>
  {/if}

  <!-- Photo Masonry Stream -->
  <section class="space-y-8 pt-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
      {#each photos as src, idx}
        <div
          onclick={() => openLightbox(idx)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openLightbox(idx);
            }
          }}
          tabindex="0"
          role="button"
          aria-label="Enlarge photo frame {idx + 1}"
          class="group cursor-pointer overflow-hidden rounded-xs bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] {idx % 3 === 0 ? 'md:col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}"
        >
          <img
            src={src}
            alt="{project.title} — Frame {idx + 1}"
            onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
            class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
            loading="lazy"
          />
        </div>
      {/each}
    </div>
  </section>

  <!-- Lightbox Modal -->
  {#if selectedPhotoIndex !== null}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Lightbox"
      class="fixed inset-0 z-50 bg-[#141312]/95 backdrop-blur-md flex items-center justify-center p-4"
    >
      <button
        onclick={closeLightbox}
        aria-label="Close Lightbox"
        title="Close (Esc)"
        class="absolute top-4 right-4 sm:top-6 sm:right-6 text-stone-300 hover:text-white p-3 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
      >
        <X size={24} />
      </button>

      <button
        onclick={prevPhoto}
        aria-label="Previous Photo"
        title="Previous (Arrow Left)"
        class="absolute left-2 sm:left-6 text-stone-300 hover:text-white p-3 sm:p-4 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
      >
        <ChevronLeft size={32} />
      </button>

      <div class="max-w-5xl max-h-[85vh] flex flex-col items-center">
        <img
          src={photos[selectedPhotoIndex]}
          alt="Expanded frame {selectedPhotoIndex + 1}"
          onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
          class="max-h-[80vh] w-auto max-w-full object-contain rounded-xs shadow-2xl"
        />
        <span class="text-stone-300 text-xs font-mono mt-3">
          {selectedPhotoIndex + 1} / {photos.length}
        </span>
      </div>

      <button
        onclick={nextPhoto}
        aria-label="Next Photo"
        title="Next (Arrow Right)"
        class="absolute right-2 sm:right-6 text-stone-300 hover:text-white p-3 sm:p-4 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
      >
        <ChevronRight size={32} />
      </button>
    </div>
  {/if}
</article>
