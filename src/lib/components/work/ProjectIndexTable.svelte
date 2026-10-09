<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import { ArrowUpRight } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    projects: ProjectItem[];
    onSelectProject: (project: ProjectItem) => void;
  }

  let { projects, onSelectProject }: Props = $props();

  let hoveredProject = $state<ProjectItem | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let containerRef: HTMLDivElement;

  function handleMouseMove(e: MouseEvent) {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function getArchetypeBadge(archetype?: string): string {
    switch (archetype) {
      case 'product_design': return 'Product Design';
      case 'case_study': return 'Case Study';
      case 'photo_album': return 'Photography';
      case 'illustration': return 'Illustration';
      default: return 'Studio Archive';
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerRef}
  onmousemove={handleMouseMove}
  class="relative w-full overflow-hidden"
>
  <!-- Floating Magnetic Preview Card (Desktop Only) -->
  {#if hoveredProject}
    <div
      aria-hidden="true"
      class="pointer-events-none absolute z-30 hidden md:block w-72 bg-[#FAF9F5] dark:bg-[#1C1B19] p-3 rounded-2xl border border-[#E8E6DF] dark:border-[#2E2C28] shadow-[0_20px_45px_-12px_rgba(44,43,41,0.22)] dark:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.85)] transition-opacity duration-150"
      style="left: {mouseX + 24}px; top: {mouseY - 90}px;"
    >
      <div class="space-y-2.5">
        <div class="w-full aspect-[16/10] bg-[#EAE7DF] dark:bg-[#141312] rounded-xl overflow-hidden relative border border-[#E8E6DF]/60 dark:border-[#2E2C28]">
          <img
            src={hoveredProject.thumbnailSrc || (hoveredProject.gallery && hoveredProject.gallery.length > 0 ? hoveredProject.gallery[0] : FALLBACK_IMAGE)}
            alt={hoveredProject.title}
            onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
            class="w-full h-full object-cover"
          />
        </div>
        <div>
          <p class="font-medium text-sm text-[#2C2B29] dark:text-[#EDE9E1] line-clamp-1">
            {hoveredProject.title}
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">
            {hoveredProject.year} · {getArchetypeBadge(hoveredProject.archetype)}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Table Header -->
  <div class="grid grid-cols-[40px_1fr_90px] sm:grid-cols-[48px_1fr_130px_90px] md:grid-cols-[56px_2fr_1.2fr_1.2fr_80px_40px] items-center py-3 border-b border-[#E8E6DF] dark:border-[#2E2C28] text-[11px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
    <span>№</span>
    <span>Project Title</span>
    <span class="hidden sm:inline">Discipline</span>
    <span class="hidden md:inline">Context / Medium</span>
    <span class="text-right sm:text-left">Year</span>
    <span class="hidden md:inline text-right">View</span>
  </div>

  <!-- Table Rows -->
  <div class="divide-y divide-[#E8E6DF]/60 dark:divide-[#2E2C28]/60">
    {#each projects as project, idx (project.id)}
      <a
        href="/works/{project.id}"
        onmouseenter={() => (hoveredProject = project)}
        onmouseleave={() => (hoveredProject = null)}
        onclick={(e) => {
          if (onSelectProject) {
            onSelectProject(project);
          }
        }}
        aria-label={`Open project details for ${project.title}`}
        class="group cursor-pointer grid grid-cols-[40px_1fr_90px] sm:grid-cols-[48px_1fr_130px_90px] md:grid-cols-[56px_2fr_1.2fr_1.2fr_80px_40px] items-center py-4 sm:py-5 px-1 hover:bg-[#FAF9F5] dark:hover:bg-[#1C1B19]/70 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1]"
      >
        <!-- Index Number -->
        <span class="font-mono text-xs text-stone-400 dark:text-stone-500 group-hover:text-[#2C2B29] dark:group-hover:text-[#EDE9E1] transition-colors">
          {String(idx + 1).padStart(2, '0')}
        </span>

        <!-- Title & Mobile Tags -->
        <div class="pr-4">
          <span class="font-medium text-base sm:text-lg text-[#2C2B29] dark:text-[#EDE9E1] group-hover:translate-x-1 inline-block transition-transform duration-200">
            {project.title}
          </span>
          <p class="sm:hidden text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">
            {getArchetypeBadge(project.archetype)}
          </p>
        </div>

        <!-- Archetype Badge (Desktop) -->
        <div class="hidden sm:block">
          <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-200/50 dark:bg-[#242320] text-stone-700 dark:text-stone-300 border border-[#E8E6DF] dark:border-[#2E2C28]">
            {getArchetypeBadge(project.archetype)}
          </span>
        </div>

        <!-- Context / Client / Medium -->
        <div class="hidden md:block text-xs text-stone-500 dark:text-stone-400 font-serif truncate pr-4">
          {project.client
            ? `Client: ${project.client}`
            : project.medium
            ? project.medium
            : project.camera
            ? `${project.camera}`
            : project.tags || '—'}
        </div>

        <!-- Year -->
        <span class="text-xs font-mono text-stone-500 dark:text-stone-400 text-right sm:text-left">
          {project.year || '—'}
        </span>

        <!-- Arrow Link -->
        <div class="hidden md:flex justify-end pr-1 text-stone-400 dark:text-stone-500 group-hover:text-[#2C2B29] dark:group-hover:text-[#EDE9E1] transition-colors">
          <ArrowUpRight
            size={16}
            class="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
          />
        </div>
      </a>
    {/each}
  </div>
</div>
