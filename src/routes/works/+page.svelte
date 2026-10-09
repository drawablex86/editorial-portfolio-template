<script lang="ts">
  import { goto } from '$app/navigation';
  import ArchivalCard from '$lib/components/work/ArchivalCard.svelte';
  import ProjectIndexTable from '$lib/components/work/ProjectIndexTable.svelte';
  import type { ProjectItem } from '$lib/types';
  import { LayoutGrid, Table, Search, Sparkles } from '@lucide/svelte';

  let { data } = $props();

  let viewMode = $state<'folio' | 'index'>('folio');
  let selectedType = $state<string>('all');
  let searchQuery = $state<string>('');

  let works = $derived(data.works || data.projects || []);

  const workTypes: { key: string; label: string }[] = [
    { key: 'all', label: 'All Works' },
    { key: 'design', label: 'Design' },
    { key: 'product_design', label: 'Product Design' },
    { key: 'photography', label: 'Photography' },
    { key: 'illustration', label: 'Illustration' },
    { key: 'sketchbook', label: 'Sketchbook' },
    { key: 'writing', label: 'Writing' },
    { key: 'experiment', label: 'Experiments' },
  ];

  let filteredWorks = $derived(
    works.filter((p: ProjectItem) => {
      const matchesType = selectedType === 'all' || p.projectType === selectedType || p.archetype === selectedType;
      const matchesSearch = !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.client && p.client.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    })
  );

  import SEOHead from '$lib/components/common/SEOHead.svelte';

  function handleOpenWork(work: ProjectItem) {
    goto(`/works/${work.id}`);
  }
</script>

<SEOHead
  title="Works — Archive of Systems &amp; Architecture"
  description="Unified archive of systems architecture, kernel engineering, documentary photography, and technical schematics by Linus Torvalds."
/>

<div class="space-y-12 select-none">
  <!-- Page Header -->
  <header class="space-y-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-amber-400">
      <Sparkles size={13} class="text-amber-600 dark:text-amber-400" />
      <span>Archive of Creative Practice</span>
    </div>
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] font-serif">
          Works
        </h1>
        <p class="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-serif mt-2 max-w-2xl leading-relaxed">
          One continuous body of work encompassing commissioned design systems, product architecture, documentary photography, fine art studies, and behavioral experiments.
        </p>
      </div>

      <!-- Quick stats -->
      <div class="text-xs font-mono text-stone-500 shrink-0">
        <span>{filteredWorks.length} of {works.length} Works</span>
      </div>
    </div>
  </header>

  <!-- Filter & View Controls -->
  <section class="space-y-4">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <!-- Work Type Filter Pills -->
      <div class="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/50 dark:bg-[#1C1B19] rounded-lg border border-[#E8E6DF] dark:border-[#2E2C28]">
        {#each workTypes as type}
          <button
            type="button"
            onclick={() => (selectedType = type.key)}
            class="px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer {selectedType === type.key
              ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-white font-medium shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-white'}"
          >
            {type.label}
          </button>
        {/each}
      </div>

      <!-- Search & View Mode Switcher -->
      <div class="flex items-center gap-3">
        <!-- Search bar -->
        <div class="relative flex items-center">
          <Search size={13} class="absolute left-2.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter works..."
            bind:value={searchQuery}
            class="bg-white dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] rounded py-1 pl-8 pr-2.5 text-xs text-[#2C2B29] dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-stone-500 w-44 sm:w-56 font-mono"
          />
        </div>

        <!-- View Switcher -->
        <div class="flex items-center p-1 bg-stone-200/50 dark:bg-[#1C1B19] rounded-lg border border-[#E8E6DF] dark:border-[#2E2C28]">
          <button
            type="button"
            onclick={() => (viewMode = 'folio')}
            aria-label="Folio view"
            class="flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer {viewMode === 'folio'
              ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-2xs font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}"
          >
            <LayoutGrid size={13} />
            <span>Folio</span>
          </button>
          <button
            type="button"
            onclick={() => (viewMode = 'index')}
            aria-label="Index table view"
            class="flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer {viewMode === 'index'
              ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-2xs font-medium'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}"
          >
            <Table size={13} />
            <span>Index</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Filter Indicators -->
    {#if selectedType !== 'all' || searchQuery.trim()}
      <div class="flex items-center gap-2 text-xs font-mono text-stone-500">
        <span>Filtering by:</span>
        {#if selectedType !== 'all'}
          <span class="px-2 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-stone-700 dark:text-stone-300">
            Type: {selectedType}
          </span>
        {/if}
        {#if searchQuery.trim()}
          <span class="px-2 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-stone-700 dark:text-stone-300">
            Query: &ldquo;{searchQuery}&rdquo;
          </span>
        {/if}
        <button
          type="button"
          onclick={() => { selectedType = 'all'; searchQuery = ''; }}
          class="underline text-stone-600 hover:text-stone-900 dark:hover:text-white cursor-pointer ml-2"
        >
          Reset filters
        </button>
      </div>
    {/if}
  </section>

  <!-- Content: Folio View or Index Table View -->
  {#if viewMode === 'folio'}
    {#if filteredWorks.length === 0}
      <div class="py-24 text-center border border-dashed border-[#E8E6DF] dark:border-[#2E2C28] rounded-xl space-y-3">
        <p class="font-serif text-lg text-stone-600 dark:text-stone-400">No works match your current filter.</p>
        <button
          type="button"
          onclick={() => { selectedType = 'all'; searchQuery = ''; }}
          class="text-xs font-mono underline text-[#2C2B29] dark:text-[#EDE9E1] cursor-pointer"
        >
          Clear filters and view all works
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
        {#each filteredWorks as work, idx}
          {@const pairIndex = Math.floor(idx / 2)}
          {@const isFirstInPair = idx % 2 === 0}
          {@const colSpan =
            work.cardSpan === 'hero'
              ? 'md:col-span-12'
              : work.cardSpan === 'wide'
              ? 'md:col-span-7'
              : work.cardSpan === 'compact'
              ? 'md:col-span-5'
              : work.cardSpan === 'half'
              ? 'md:col-span-6'
              : pairIndex % 2 === 0
              ? isFirstInPair ? 'md:col-span-7' : 'md:col-span-5'
              : isFirstInPair ? 'md:col-span-5' : 'md:col-span-7'}

          <div class="{colSpan} flex flex-col justify-start">
            <ArchivalCard
              project={work}
              index={idx + 1}
              onClick={() => handleOpenWork(work)}
            />
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <!-- Index Table View -->
    <ProjectIndexTable
      projects={filteredWorks}
      onSelectProject={handleOpenWork}
    />
  {/if}
</div>
