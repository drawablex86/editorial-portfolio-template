<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import ImageLightbox, { type LightboxItem } from '$lib/components/common/ImageLightbox.svelte';
  import Image from '$lib/components/common/Image.svelte';
  import { Camera, MapPin, Sliders } from '@lucide/svelte';

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

  let lightboxItems = $derived<LightboxItem[]>(
    photos.map((src, idx) => ({
      src,
      alt: `${project.title} — frame ${idx + 1} of ${photos.length}${
        project.location ? `, photographed in ${project.location}` : ''
      }`,
      caption: `${project.title} · Frame ${idx + 1}`
    }))
  );

  let lightboxExif = $derived(
    [
      project.camera ? { label: 'Camera', value: project.camera } : null,
      project.lens ? { label: 'Lens', value: project.lens } : null,
      project.location ? { label: 'Location', value: project.location } : null,
      project.year ? { label: 'Year', value: project.year } : null
    ].filter((row): row is { label: string; value: string } => row !== null)
  );
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
          onclick={() => (selectedPhotoIndex = idx)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectedPhotoIndex = idx;
            }
          }}
          tabindex="0"
          role="button"
          aria-label="Enlarge frame {idx + 1} of {photos.length}"
          class="group cursor-pointer overflow-hidden rounded-xs bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] {idx % 3 === 0 ? 'md:col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}"
        >
          <Image
            src={src}
            alt="{project.title} — frame {idx + 1} of {photos.length}"
            sizes={idx % 3 === 0 ? 'hero' : 'halfGrid'}
            width={2880}
            fallbackSrc={FALLBACK_IMAGE}
            class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
          />
        </div>
      {/each}
    </div>
  </section>
</article>

<ImageLightbox
  items={lightboxItems}
  index={selectedPhotoIndex}
  onClose={() => (selectedPhotoIndex = null)}
  onIndexChange={(i) => (selectedPhotoIndex = i)}
  label="Photography series viewer"
  fallbackSrc={FALLBACK_IMAGE}
  exif={lightboxExif}
/>
