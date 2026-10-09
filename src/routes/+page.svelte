<script lang="ts">
  import { goto } from '$app/navigation';
  import StudioDesk3D from '$lib/components/home/StudioDesk3D.svelte';
  import HeroWaterVoyage from '$lib/components/home/HeroWaterVoyage.svelte';
  import ArchivalCard from '$lib/components/work/ArchivalCard.svelte';
  import ProjectIndexTable from '$lib/components/work/ProjectIndexTable.svelte';
  import type { ProjectItem } from '$lib/types';
  import { LayoutGrid, Table, Sparkles, Filter } from '@lucide/svelte';

  let { data } = $props();

  let workViewMode = $state<'folio' | 'index'>('folio');
  let selectedCategory = $state<string>('all');

  let projectsData = $derived(data.projectsData ?? []);
  let deskSheets = $derived(data.deskData?.sheets ?? []);

  const categories = [
    { key: 'all', label: 'All Disciplines' },
    { key: 'design', label: 'Design' },
    { key: 'product_design', label: 'Product Design' },
    { key: 'illustration', label: 'Illustration' },
    { key: 'photography', label: 'Photography' },
    { key: 'experiment', label: 'Experiments' },
  ];

  let filteredProjects = $derived(
    (selectedCategory === 'all'
      ? projectsData
      : projectsData.filter((item: ProjectItem) => item.projectType === selectedCategory || item.archetype === selectedCategory)
    ).slice().sort((a: ProjectItem, b: ProjectItem) => {
      // Prioritize projects explicitly marked as featured
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    })
  );

  import SEOHead from '$lib/components/common/SEOHead.svelte';

  function handleOpenProject(project: ProjectItem) {
    goto(`/works/${project.id}`);
  }
</script>

<SEOHead
  title="Visual Art, Systems & Design"
  description="Portfolio of Linus Torvalds — systems architecture, kernel engineering, distributed revision control, and physical optics."
  ogType="website"
/>

<div class="space-y-20 md:space-y-28 select-none">
  <!-- 1. HERO SECTION (THE MONSOON VOYAGE: KERALA BACKWATERS & ORIGAMI BOAT) -->
  <HeroWaterVoyage />

  <!-- 2. STUDIO DESK 3D -->
  <section class="space-y-3">
    <div class="flex items-center justify-between text-xs font-mono text-stone-600 dark:text-stone-400 px-1">
      <span>01 / Studio Desk Scene</span>
      <span>Interactive Workspace</span>
    </div>
    <StudioDesk3D sheets={deskSheets} />
  </section>

  <!-- 3. FEATURED WORKS (FOLIO & INDEX VIEW WITH CATEGORY PILLS) -->
  <section id="works" class="space-y-8 pt-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-5">
      <div>
        <h2 class="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-widest">
          02 / Featured Works &amp; Practice
        </h2>
        <p class="text-xs sm:text-sm font-serif text-stone-600 dark:text-stone-400 mt-1">
          Unified body of work across design, product architecture, visual arts, and research.
        </p>
      </div>

      <!-- Controls: Category Filter + View Switcher -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Interactive Category Pills -->
        <div class="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/50 dark:bg-[#1C1B19] rounded-lg border border-[#E8E6DF] dark:border-[#2E2C28]">
          {#each categories as cat}
            <button
              type="button"
              onclick={() => (selectedCategory = cat.key)}
              class="px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer {selectedCategory === cat.key
                ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-white font-medium shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-white'}"
            >
              {cat.label}
            </button>
          {/each}
        </div>

        <!-- View Switcher -->
        <div class="flex items-center p-1 bg-stone-200/50 dark:bg-[#1C1B19] rounded-lg border border-[#E8E6DF] dark:border-[#2E2C28]">
          <button
            type="button"
            onclick={() => (workViewMode = 'folio')}
            aria-label="Folio view"
            class="flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer {workViewMode === 'folio'
              ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-2xs font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}"
          >
            <LayoutGrid size={13} />
            <span>Folio</span>
          </button>
          <button
            type="button"
            onclick={() => (workViewMode = 'index')}
            aria-label="Index table view"
            class="flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer {workViewMode === 'index'
              ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-2xs font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}"
          >
            <Table size={13} />
            <span>Index</span>
          </button>
        </div>
      </div>
    </div>

    {#if workViewMode === 'folio'}
      <div class="space-y-8 md:space-y-10">
        <!-- Hero Spotlight Card (when all categories selected) -->
        {#if filteredProjects.length > 0 && selectedCategory === 'all'}
          <div>
            <ArchivalCard
              project={filteredProjects[0]}
              index={0}
              isHero={true}
              onClick={() => handleOpenProject(filteredProjects[0])}
            />
          </div>
        {/if}

        <!-- Asymmetrical Editorial Grid -->
        {#if (selectedCategory === 'all' ? filteredProjects.length > 1 : filteredProjects.length > 0)}
          {@const displayProjects = selectedCategory === 'all' ? filteredProjects.slice(1) : filteredProjects}
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
            {#each displayProjects as project, idx}
              {@const pairIndex = Math.floor(idx / 2)}
              {@const isFirstInPair = idx % 2 === 0}
              {@const colSpan =
                project.cardSpan === 'hero'
                  ? 'md:col-span-12'
                  : project.cardSpan === 'wide'
                  ? 'md:col-span-7'
                  : project.cardSpan === 'compact'
                  ? 'md:col-span-5'
                  : project.cardSpan === 'half'
                  ? 'md:col-span-6'
                  : pairIndex % 2 === 0
                  ? isFirstInPair ? 'md:col-span-7' : 'md:col-span-5'
                  : isFirstInPair ? 'md:col-span-5' : 'md:col-span-7'}

              <div class="{colSpan} flex flex-col justify-start">
                <ArchivalCard
                  project={project}
                  index={idx + 1}
                  onClick={() => handleOpenProject(project)}
                />
              </div>
            {/each}
          </div>
        {/if}

        {#if filteredProjects.length === 0}
          <div class="py-16 text-center text-xs font-mono text-stone-500 border border-dashed border-[#E8E6DF] dark:border-[#2E2C28] rounded-lg">
            No works found in this discipline.
          </div>
        {/if}
      </div>
    {:else}
      <ProjectIndexTable
        projects={filteredProjects}
        onSelectProject={handleOpenProject}
      />
    {/if}

    <!-- Bottom Full Archive CTA -->
    <div class="pt-6 border-t border-[#E8E6DF] dark:border-[#2E2C28] flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-xs font-mono text-stone-500 dark:text-stone-400">
        Showing curated selection from the creative archive ({filteredProjects.length} items).
      </p>
      <a
        href="/works"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#E8E6DF] dark:border-[#2E2C28] bg-white dark:bg-[#1E1D1B] hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-mono text-[#2C2B29] dark:text-[#EDE9E1] transition-all hover:scale-[1.02] shadow-2xs"
      >
        <span>Explore Full Works Archive ({projectsData.length})</span>
        <span class="text-amber-600 dark:text-amber-400">→</span>
      </a>
    </div>
  </section>
</div>
