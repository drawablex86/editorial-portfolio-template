<script lang="ts">
  import {
    Briefcase,
    BookOpen,
    FileText,
    Image,
    Plus,
    Clock,
    ArrowRight,
    LayoutGrid,
    Sparkles,
    Shield,
    Sliders,
    Search,
    Compass,
    ExternalLink,
    Filter
  } from '@lucide/svelte';

  let { data } = $props();
  let studioItems = $derived(data.studioItems || { projects: [], blog: [], pages: [] });

  let totalProjects = $derived(studioItems.projects?.length || 0);
  let totalBlogs = $derived(studioItems.blog?.length || 0);
  let totalPages = $derived(studioItems.pages?.length || 0);

  // Active filter tab for recent documents
  let activeFilter = $state<'all' | 'projects' | 'blog' | 'pages'>('all');
  let filterQuery = $state('');

  // Collect modified items across all sections
  let allRecentItems = $derived(
    [
      ...(studioItems.projects || []),
      ...(studioItems.blog || []),
      ...(studioItems.pages || []),
    ].sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
  );

  let filteredRecentItems = $derived(
    allRecentItems
      .filter((item) => {
        if (activeFilter !== 'all' && item.section !== activeFilter) return false;
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.tags?.toLowerCase().includes(q) ||
          item.archetype?.toLowerCase().includes(q)
        );
      })
      .slice(0, 10)
  );

  function formatDate(timestamp: number) {
    if (!timestamp) return 'Undated';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getArchetypeBadge(archetype?: string) {
    if (!archetype) return { label: 'PROJ', color: 'bg-stone-100 text-stone-700 border-stone-200' };
    const a = archetype.toLowerCase();
    if (a.includes('product')) return { label: 'Product Design', color: 'bg-amber-100/70 text-amber-900 border-amber-200' };
    if (a.includes('photo')) return { label: 'Photo Album', color: 'bg-sky-100/70 text-sky-900 border-sky-200' };
    if (a.includes('illustrat')) return { label: 'Illustration', color: 'bg-emerald-100/70 text-emerald-900 border-emerald-200' };
    if (a.includes('case_study') || a.includes('design')) return { label: 'Case Study', color: 'bg-orange-100/70 text-orange-900 border-orange-200' };
    return { label: archetype, color: 'bg-stone-100 text-stone-700 border-stone-200' };
  }
</script>

<svelte:head>
  <title>Workbench Overview | Studio</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto space-y-9 [scrollbar-width:thin]">
  <!-- Studio Welcome Banner -->
  <header class="space-y-2 border-b border-[#E2DED4] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
        <Sparkles size={13} />
        <span>Local Authoring Studio</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-serif tracking-tight text-[#2C2B29]">
        Authoring Workbench
      </h1>
      <p class="text-sm font-serif text-stone-600 max-w-2xl leading-relaxed">
        Publishing cockpit and design archive. Write essays, manage project archetypes, curate desk plates, and manage deterrence pipelines.
      </p>
    </div>

    <!-- Quick Stats Bar -->
    <div class="flex items-center gap-2 font-mono text-xs">
      <div class="bg-[#FCFBF9] border border-[#DDD9CE] px-3 py-1.5 rounded flex items-center gap-2 text-stone-700 shadow-2xs">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        <span>Pipeline: <strong>Active</strong></span>
      </div>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        class="bg-[#FCFBF9] border border-[#DDD9CE] hover:bg-white px-3 py-1.5 rounded flex items-center gap-1.5 text-stone-700 hover:text-stone-900 transition-colors shadow-2xs"
      >
        <span>Live Site</span>
        <ExternalLink size={12} />
      </a>
    </div>
  </header>

  <!-- Metric Overview Cards -->
  <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="p-3.5 rounded-lg bg-[#EFECE6] border border-[#E2DED4] hover:border-stone-400 transition-colors">
      <div class="flex items-center justify-between text-stone-500">
        <span class="text-[10px] font-mono uppercase tracking-wider">Works Archive</span>
        <Briefcase size={13} />
      </div>
      <div class="text-2xl font-serif font-medium text-[#2C2B29] mt-1">{totalProjects}</div>
    </div>
    <div class="p-3.5 rounded-lg bg-[#EFECE6] border border-[#E2DED4] hover:border-stone-400 transition-colors">
      <div class="flex items-center justify-between text-stone-500">
        <span class="text-[10px] font-mono uppercase tracking-wider">Essays &amp; Notes</span>
        <BookOpen size={13} />
      </div>
      <div class="text-2xl font-serif font-medium text-[#2C2B29] mt-1">{totalBlogs}</div>
    </div>
    <div class="p-3.5 rounded-lg bg-[#EFECE6] border border-[#E2DED4] hover:border-stone-400 transition-colors">
      <div class="flex items-center justify-between text-stone-500">
        <span class="text-[10px] font-mono uppercase tracking-wider">Pages</span>
        <FileText size={13} />
      </div>
      <div class="text-2xl font-serif font-medium text-[#2C2B29] mt-1">{totalPages}</div>
    </div>
    <div class="p-3.5 rounded-lg bg-[#EFECE6] border border-[#E2DED4] hover:border-stone-400 transition-colors">
      <div class="flex items-center justify-between text-stone-500">
        <span class="text-[10px] font-mono uppercase tracking-wider">Spatial Worlds</span>
        <Compass size={13} />
      </div>
      <div class="text-2xl font-serif font-medium text-[#2C2B29] mt-1">2</div>
    </div>
  </section>

  <!-- Quick Action & Creation Launchers -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-xs font-mono uppercase tracking-widest text-stone-500">
        Workspaces &amp; Launchers
      </h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <a
        href="/studio/projects/new"
        class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4] hover:border-stone-400 hover:shadow-2xs transition-all group flex flex-col justify-between"
      >
        <div class="flex items-start justify-between">
          <div class="w-8 h-8 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Briefcase size={15} />
          </div>
          <span class="text-[10px] font-mono uppercase tracking-wider bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded border border-[#E2DED4]">
            Action
          </span>
        </div>
        <div>
          <h3 class="text-xs font-mono font-medium text-stone-900 group-hover:text-amber-700 flex items-center gap-1.5">
            <span>New Project Document</span>
            <ArrowRight size={12} class="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-700" />
          </h3>
          <p class="text-xs text-stone-500 font-serif mt-1">Design archetypes, product prototypes, photography series</p>
        </div>
      </a>

      <a
        href="/studio/blog/new"
        class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4] hover:border-stone-400 hover:shadow-2xs transition-all group flex flex-col justify-between"
      >
        <div class="flex items-start justify-between">
          <div class="w-8 h-8 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookOpen size={15} />
          </div>
          <span class="text-[10px] font-mono uppercase tracking-wider bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded border border-[#E2DED4]">
            Action
          </span>
        </div>
        <div>
          <h3 class="text-xs font-mono font-medium text-stone-900 group-hover:text-amber-700 flex items-center gap-1.5">
            <span>New Essay or Note</span>
            <ArrowRight size={12} class="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-700" />
          </h3>
          <p class="text-xs text-stone-500 font-serif mt-1">Draft an editorial essay, technical memo, or journal note</p>
        </div>
      </a>

      <a
        href="/studio/desk"
        class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4] hover:border-stone-400 hover:shadow-2xs transition-all group flex flex-col justify-between"
      >
        <div class="flex items-start justify-between">
          <div class="w-8 h-8 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <LayoutGrid size={15} />
          </div>
          <span class="text-[10px] font-mono uppercase tracking-wider bg-amber-100/70 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
            Spatial
          </span>
        </div>
        <div>
          <h3 class="text-xs font-mono font-medium text-stone-900 group-hover:text-amber-700 flex items-center gap-1.5">
            <span>Studio Desk Mat</span>
            <ArrowRight size={12} class="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-700" />
          </h3>
          <p class="text-xs text-stone-500 font-serif mt-1">Curate tactile artwork plates, rotation angles, and captions</p>
        </div>
      </a>

      <a
        href="/studio/inspiration"
        class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4] hover:border-stone-400 hover:shadow-2xs transition-all group flex flex-col justify-between"
      >
        <div class="flex items-start justify-between">
          <div class="w-8 h-8 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Compass size={15} />
          </div>
          <span class="text-[10px] font-mono uppercase tracking-wider bg-amber-100/70 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
            Spatial
          </span>
        </div>
        <div>
          <h3 class="text-xs font-mono font-medium text-stone-900 group-hover:text-amber-700 flex items-center gap-1.5">
            <span>Inspiration Space</span>
            <ArrowRight size={12} class="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-700" />
          </h3>
          <p class="text-xs text-stone-500 font-serif mt-1">2D canvas celestial coordinate pins &amp; quotation clusters</p>
        </div>
      </a>

      <a
        href="/studio/protocol"
        class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4] hover:border-stone-400 hover:shadow-2xs transition-all group flex flex-col justify-between"
      >
        <div class="flex items-start justify-between">
          <div class="w-8 h-8 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Shield size={15} />
          </div>
          <span class="text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
            Live
          </span>
        </div>
        <div>
          <h3 class="text-xs font-mono font-medium text-stone-900 group-hover:text-amber-700 flex items-center gap-1.5">
            <span>AI Protocol &amp; Storage Vault</span>
            <ArrowRight size={12} class="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-700" />
          </h3>
          <p class="text-xs text-stone-500 font-serif mt-1">Glaze / Nightshade deterrence vault &amp; WebP processing pipeline</p>
        </div>
      </a>

      <a
        href="/studio/media"
        class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4] hover:border-stone-400 hover:shadow-2xs transition-all group flex flex-col justify-between"
      >
        <div class="flex items-start justify-between">
          <div class="w-8 h-8 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Image size={15} />
          </div>
          <span class="text-[10px] font-mono uppercase tracking-wider bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded border border-[#E2DED4]">
            Assets
          </span>
        </div>
        <div>
          <h3 class="text-xs font-mono font-medium text-stone-900 group-hover:text-amber-700 flex items-center gap-1.5">
            <span>Media Library</span>
            <ArrowRight size={12} class="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-700" />
          </h3>
          <p class="text-xs text-stone-500 font-serif mt-1">Fast drag &amp; drop uploader, rename, and markdown link clipboard</p>
        </div>
      </a>
    </div>
  </section>

  <!-- Interactive Document Registry (Complementary to Sidebar) -->
  <section class="space-y-3">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DED4] pb-2">
      <div class="flex items-center gap-1.5">
        <Clock size={13} class="text-stone-500" />
        <h2 class="text-xs font-mono uppercase tracking-widest text-stone-600 font-semibold">
          Document Explorer &amp; Recent Edits
        </h2>
      </div>

      <!-- Category Filter Tabs + Search -->
      <div class="flex items-center gap-2">
        <div class="flex items-center bg-[#EAE6DE] p-0.5 rounded text-xs font-mono">
          <button
            type="button"
            onclick={() => (activeFilter = 'all')}
            class="px-2.5 py-1 rounded transition-colors {activeFilter === 'all'
              ? 'bg-[#FCFBF9] text-stone-900 font-semibold shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'}"
          >
            All ({allRecentItems.length})
          </button>
          <button
            type="button"
            onclick={() => (activeFilter = 'projects')}
            class="px-2.5 py-1 rounded transition-colors {activeFilter === 'projects'
              ? 'bg-[#FCFBF9] text-stone-900 font-semibold shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'}"
          >
            Projects ({totalProjects})
          </button>
          <button
            type="button"
            onclick={() => (activeFilter = 'blog')}
            class="px-2.5 py-1 rounded transition-colors {activeFilter === 'blog'
              ? 'bg-[#FCFBF9] text-stone-900 font-semibold shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'}"
          >
            Essays ({totalBlogs})
          </button>
          <button
            type="button"
            onclick={() => (activeFilter = 'pages')}
            class="px-2.5 py-1 rounded transition-colors {activeFilter === 'pages'
              ? 'bg-[#FCFBF9] text-stone-900 font-semibold shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'}"
          >
            Pages ({totalPages})
          </button>
        </div>

        <div class="relative hidden md:flex items-center">
          <Search size={11} class="absolute left-2.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter list..."
            bind:value={filterQuery}
            class="bg-[#FCFBF9] border border-[#DDD9CE] rounded py-1 pl-7 pr-2 text-xs font-sans text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 w-36"
          />
        </div>
      </div>
    </div>

    <!-- Document Registry Table/List -->
    <div class="bg-[#FCFBF9] border border-[#E2DED4] rounded-lg divide-y divide-[#EAE6DE] overflow-hidden shadow-2xs">
      {#if filteredRecentItems.length === 0}
        <div class="p-8 text-center text-xs font-mono text-stone-500">
          No documents match the current filter.
        </div>
      {:else}
        {#each filteredRecentItems as item}
          {@const badge = getArchetypeBadge(item.archetype || item.projectType)}
          <a
            href={`/studio/${item.section}/${item.slug}`}
            class="p-3.5 flex items-center justify-between hover:bg-[#F7F5F0] transition-colors group"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#EFECE6] text-stone-600 border border-[#E2DED4] shrink-0">
                {item.section}
              </span>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-stone-900 group-hover:text-amber-700 truncate">
                    {item.title}
                  </span>
                  {#if item.archetype}
                    <span class="hidden sm:inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border {badge.color} shrink-0">
                      {badge.label}
                    </span>
                  {/if}
                </div>
                {#if item.description}
                  <p class="text-xs text-stone-500 font-serif truncate mt-0.5 max-w-xl">
                    {item.description}
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-4 shrink-0 font-mono text-xs text-stone-400 ml-4">
              <span class="hidden sm:inline-block text-[11px]">
                {formatDate(item.lastModified)}
              </span>
              <div class="w-6 h-6 rounded flex items-center justify-center group-hover:bg-[#EAE6DE] transition-colors">
                <ArrowRight size={13} class="text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </a>
        {/each}
      {/if}
    </div>
  </section>
</div>
