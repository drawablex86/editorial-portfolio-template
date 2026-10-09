<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import { ArrowUpRight } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
    index: number;
    isHero?: boolean;
    onClick?: () => void;
  }

  let { project, index, isHero = false, onClick }: Props = $props();

  let rotateX = $state(0);
  let rotateY = $state(0);
  let isHovered = $state(false);

  function handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    rotateX = ((y - centerY) / centerY) * -6;
    rotateY = ((x - centerX) / centerX) * 6;
  }

  function handleMouseLeave() {
    rotateX = 0;
    rotateY = 0;
    isHovered = false;
  }

  function getArchetypeAspectRatio(archetype?: string, isHeroCard?: boolean): string {
    if (isHeroCard) return 'aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1]';
    switch (archetype) {
      case 'product_design': return 'aspect-[16/10]';
      case 'case_study': return 'aspect-[4/3]';
      case 'photo_album': return 'aspect-[4/5] sm:aspect-[1/1]';
      case 'illustration': return 'aspect-[3/4]';
      default: return 'aspect-[16/10]';
    }
  }

  function getArchetypeBadge(archetype?: string): string {
    switch (archetype) {
      case 'product_design': return 'Product Design';
      case 'case_study': return 'Case Study';
      case 'photo_album': return 'Photo Series';
      case 'illustration': return 'Artwork & Study';
      default: return 'Archive Specimen';
    }
  }

  let resolvedAspect = $derived(
    project.aspectRatio === '16:9' ? 'aspect-[16/9]' :
    project.aspectRatio === '4:3' ? 'aspect-[4/3]' :
    project.aspectRatio === '1:1' ? 'aspect-square' :
    project.aspectRatio === '3:4' ? 'aspect-[3/4]' :
    project.aspectRatio === '4:5' ? 'aspect-[4/5]' :
    getArchetypeAspectRatio(project.archetype, isHero)
  );

  let imageSrc = $derived(
    project.thumbnailSrc ||
    (project.gallery && project.gallery.length > 0 ? project.gallery[0] : '') ||
    FALLBACK_IMAGE
  );

  let displayContext = $derived(
    project.client
      ? `Client: ${project.client}`
      : project.medium
      ? project.medium
      : project.camera
      ? `${project.camera}`
      : project.tags || ''
  );
</script>

<a
  href="/works/{project.id}"
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  onmouseenter={() => (isHovered = true)}
  onclick={(e) => {
    if (onClick) {
      onClick();
    }
  }}
  style="transform: perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);"
  class="group relative block w-full text-left focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded cursor-pointer"
>
  <div class="space-y-4">
    <!-- Visual Plate -->
    <div
      class="w-full {resolvedAspect} overflow-hidden rounded bg-[#E8E6DF] dark:bg-[#1C1B19] relative border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs group-hover:shadow-lg transition-all duration-500"
    >
      <img
        src={imageSrc}
        alt={project.title}
        loading={isHero ? 'eager' : 'lazy'}
        fetchpriority={isHero ? 'high' : 'auto'}
        decoding="async"
        onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
      />

      <!-- Specimen Number Tag -->
      <div class="absolute top-3.5 left-3.5 z-10">
        <span
          class="font-mono text-[10px] sm:text-xs tracking-wider px-2 py-0.5 rounded bg-[#FAF9F5]/90 dark:bg-[#141312]/90 backdrop-blur-md text-[#2C2B29] dark:text-[#EDE9E1] border border-[#E8E6DF]/80 dark:border-[#2E2C28]"
        >
          № {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <!-- Archetype Pill Badge -->
      <div class="absolute top-3.5 right-3.5 z-10">
        <span
          class="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF9F5]/90 dark:bg-[#141312]/90 backdrop-blur-md text-stone-600 dark:text-stone-300 border border-[#E8E6DF]/80 dark:border-[#2E2C28]"
        >
          {getArchetypeBadge(project.archetype)}
        </span>
      </div>

      <!-- Subtle grain texture overlay -->
      <div class="absolute inset-0 bg-stone-900/5 pointer-events-none group-hover:opacity-0 transition-opacity duration-300"></div>
    </div>

    <!-- Editorial Label Metadata Strip -->
    <div class="space-y-1.5 px-0.5">
      <div class="flex items-baseline justify-between gap-4">
        <h2
          class="{isHero
            ? 'text-2xl sm:text-3xl'
            : 'text-lg sm:text-xl'} font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex items-center gap-1.5"
        >
          <span>{project.title}</span>
          <ArrowUpRight
            size={16}
            class="text-stone-400 group-hover:text-[#2C2B29] dark:group-hover:text-[#EDE9E1] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0"
          />
        </h2>
        <span class="font-mono text-xs text-stone-500 dark:text-stone-400 shrink-0">
          {project.year || '—'}
        </span>
      </div>

      {#if project.description}
        <p class="font-serif text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      {/if}

      {#if displayContext}
        <div class="flex items-center gap-2 pt-0.5 text-xs text-stone-500 dark:text-stone-400 font-mono">
          <span>{displayContext}</span>
        </div>
      {/if}
    </div>
  </div>
</a>
