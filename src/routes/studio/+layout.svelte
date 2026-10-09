<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import {
    Briefcase,
    Sparkles,
    BookOpen,
    FileText,
    Image,
    Plus,
    PlusCircle,
    ArrowUpRight,
    Search,
    Compass,
    LayoutGrid,
    ChevronDown,
    ChevronRight,
    Folder,
    Shield,
    Globe,
    PanelLeftClose,
    PanelLeftOpen,
    Layers,
    Camera,
    Palette,
    Sliders,
    X
  } from '@lucide/svelte';

  let { data, children } = $props();

  let studioItems = $derived(data.studioItems || { projects: [], blog: [], pages: [] });
  let pathname = $derived(page.url.pathname);
  let sidebarSearch = $state('');
  let isCollapsed = $state(false);

  // Sidebar resizable width
  let sidebarWidth = $state(288);
  let isResizing = $state(false);

  // Accordion open/collapse states: default CLOSED for projects, blog, and pages!
  let openSections = $state<Record<string, boolean>>({
    protocol: false,
    spatial: true,
    projects: false,
    blog: false,
    pages: false,
  });

  // Track collapsed sub-groups (default: collapsed)
  let openSubgroups = $state<Record<string, boolean>>({});

  // Track "expanded all items" in long subgroups
  let expandedAllGroups = $state<Record<string, boolean>>({});

  function toggleSection(secKey: string) {
    openSections[secKey] = !openSections[secKey];
    saveAccordionState();
  }

  function toggleSubgroup(groupKey: string) {
    openSubgroups[groupKey] = !openSubgroups[groupKey];
    saveAccordionState();
  }

  function toggleExpandAll(groupKey: string) {
    expandedAllGroups[groupKey] = !expandedAllGroups[groupKey];
  }

  function saveAccordionState() {
    try {
      localStorage.setItem('studio_sidebar_sections', JSON.stringify(openSections));
      localStorage.setItem('studio_sidebar_subgroups', JSON.stringify(openSubgroups));
    } catch {}
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    try {
      localStorage.setItem('studio_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch {}
  }

  // Auto-expand the active route's parent section & subgroup
  function autoExpandActiveItem() {
    if (!pathname) return;

    if (pathname.startsWith('/studio/projects/')) {
      const slug = pathname.replace('/studio/projects/', '');
      openSections.projects = true;
      if (slug && slug !== 'new') {
        const found = studioItems.projects?.find((p: any) => p.slug === slug);
        if (found) {
          const pt = (found.projectType || found.archetype || '').toLowerCase();
          let cat = 'Other';
          if (pt.includes('product')) cat = 'Product Design';
          else if (pt.includes('photo')) cat = 'Photography';
          else if (pt.includes('illustrat') || pt.includes('specimen')) cat = 'Illustration';
          else if (pt.includes('experiment')) cat = 'Experiment';
          else if (pt.includes('design') || pt.includes('case_study') || pt.includes('brand')) cat = 'Design';
          openSubgroups[`proj-${cat}`] = true;
        }
      }
    } else if (pathname.startsWith('/studio/blog/')) {
      const slug = pathname.replace('/studio/blog/', '');
      openSections.blog = true;
      if (slug && slug !== 'new') {
        const found = studioItems.blog?.find((b: any) => b.slug === slug);
        if (found && found.year) {
          openSubgroups[`blog-${found.year}`] = true;
        }
      }
    } else if (pathname.startsWith('/studio/pages/')) {
      openSections.pages = true;
    } else if (pathname.startsWith('/studio/protocol')) {
      openSections.protocol = true;
    }
  }

  // Resizing mouse handlers
  function startResizing(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;

    function handleMouseMove(moveEvent: MouseEvent) {
      if (!isResizing) return;
      const newWidth = Math.max(240, Math.min(520, moveEvent.clientX));
      sidebarWidth = newWidth;
    }

    function handleMouseUp() {
      if (isResizing) {
        isResizing = false;
        try {
          localStorage.setItem('studio_sidebar_width', String(sidebarWidth));
        } catch {}
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function resetSidebarWidth() {
    sidebarWidth = 288;
    try {
      localStorage.setItem('studio_sidebar_width', '288');
    } catch {}
  }

  onMount(() => {
    try {
      const storedCollapsed = localStorage.getItem('studio_sidebar_collapsed');
      if (storedCollapsed === 'true') {
        isCollapsed = true;
      }

      const storedWidth = localStorage.getItem('studio_sidebar_width');
      if (storedWidth) {
        const parsed = parseInt(storedWidth, 10);
        if (!isNaN(parsed) && parsed >= 240 && parsed <= 520) {
          sidebarWidth = parsed;
        }
      }

      const storedSections = localStorage.getItem('studio_sidebar_sections');
      if (storedSections) {
        openSections = { ...openSections, ...JSON.parse(storedSections) };
      }

      const storedSubgroups = localStorage.getItem('studio_sidebar_subgroups');
      if (storedSubgroups) {
        openSubgroups = { ...openSubgroups, ...JSON.parse(storedSubgroups) };
      }
    } catch {}

    // Ensure currently viewed document is visible
    autoExpandActiveItem();
  });

  $effect(() => {
    // Whenever pathname changes, auto reveal current document
    if (pathname) {
      autoExpandActiveItem();
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    // ⌘[ or [ toggles sidebar if not typing in input/textarea
    const target = e.target as HTMLElement;
    const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (!isEditing && (e.key === '[' || (e.metaKey && e.key === 'b'))) {
      e.preventDefault();
      toggleCollapse();
    }
  }

  function matchesSearch(title: string, slug: string, tags?: string) {
    if (!sidebarSearch) return true;
    const q = sidebarSearch.toLowerCase();
    return (
      title.toLowerCase().includes(q) ||
      slug.toLowerCase().includes(q) ||
      (tags && tags.toLowerCase().includes(q))
    );
  }

  // Group projects by projectType / archetype
  let groupedProjects = $derived.by(() => {
    const map = new Map<string, any[]>();
    const order = ['Design', 'Product Design', 'Photography', 'Illustration', 'Experiment', 'Other'];

    for (const key of order) {
      map.set(key, []);
    }

    for (const item of (studioItems.projects || [])) {
      if (!matchesSearch(item.title, item.slug, item.tags)) continue;
      let cat = 'Other';
      const pt = (item.projectType || item.archetype || '').toLowerCase();
      if (pt.includes('product')) cat = 'Product Design';
      else if (pt.includes('photo')) cat = 'Photography';
      else if (pt.includes('illustrat') || pt.includes('specimen')) cat = 'Illustration';
      else if (pt.includes('experiment')) cat = 'Experiment';
      else if (pt.includes('design') || pt.includes('case_study') || pt.includes('brand')) cat = 'Design';

      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }

    return Array.from(map.entries()).filter(([_, items]) => items.length > 0);
  });

  // Group blog posts by year
  let groupedBlog = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const item of (studioItems.blog || [])) {
      if (!matchesSearch(item.title, item.slug, item.tags)) continue;
      const y = item.year || 'Undated';
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  });

  // Filtered pages
  let filteredPages = $derived(
    (studioItems.pages || []).filter((item: any) => matchesSearch(item.title, item.slug, item.tags))
  );

  let isSearching = $derived(sidebarSearch.trim().length > 0);

  function getArchetypeBadge(archetype?: string) {
    if (!archetype) return { label: 'PROJ', color: 'bg-stone-200 text-stone-700' };
    const a = archetype.toLowerCase();
    if (a.includes('product')) return { label: 'PROD', color: 'bg-amber-100 text-amber-900 border-amber-200/60' };
    if (a.includes('photo')) return { label: 'PHOTO', color: 'bg-sky-100 text-sky-900 border-sky-200/60' };
    if (a.includes('illustrat')) return { label: 'ART', color: 'bg-emerald-100 text-emerald-900 border-emerald-200/60' };
    if (a.includes('case_study') || a.includes('design')) return { label: 'CASE', color: 'bg-orange-100 text-orange-900 border-orange-200/60' };
    return { label: 'DOC', color: 'bg-stone-200 text-stone-700 border-stone-300' };
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  data-studio-mode
  class="h-screen w-screen bg-[#F4F2ED] text-[#2C2B29] flex flex-row overflow-hidden antialiased font-sans select-none"
  class:cursor-col-resize={isResizing}
>
  <!-- Studio Left Sidebar -->
  <aside
    style={isCollapsed ? undefined : `width: ${sidebarWidth}px`}
    class="bg-[#EFECE6] border-r border-[#E2DED4] flex flex-col justify-between shrink-0 h-full z-30 relative transition-[width] {isResizing ? 'duration-0 select-none' : 'duration-150 ease-out'} {isCollapsed ? 'w-14' : ''}"
  >
    <!-- Resize Handle (Right Border) -->
    {#if !isCollapsed}
      <button
        type="button"
        tabindex="-1"
        aria-label="Resize sidebar width (double-click to reset)"
        onmousedown={startResizing}
        ondblclick={resetSidebarWidth}
        class="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:w-2 hover:bg-amber-500/30 transition-all z-40 group focus:outline-none"
        title="Drag to resize, double-click to reset"
      >
        <div class="h-full w-[2px] ml-auto transition-colors {isResizing ? 'bg-amber-600' : 'bg-transparent group-hover:bg-amber-500/50'}"></div>
      </button>
    {/if}
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Studio Brand Bar -->
      <div class="h-13 px-3 border-b border-[#E2DED4] flex items-center justify-between bg-[#EAE6DE] shrink-0">
        {#if !isCollapsed}
          <div class="flex items-center gap-2 min-w-0">
            <a href="/studio" class="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#2C2B29] hover:text-stone-900 transition-colors truncate">
              <span class="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
              <span class="truncate">Studio</span>
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] text-stone-500 hover:text-[#2C2B29] flex items-center gap-0.5 font-mono px-1.5 py-0.5 rounded hover:bg-[#DDD9CE] transition-colors shrink-0"
              title="Open live site preview"
            >
              <span>Live</span>
              <ArrowUpRight size={10} />
            </a>
          </div>
        {:else}
          <a href="/studio" class="mx-auto" title="Workbench Overview">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-600 block ring-2 ring-amber-300/60"></span>
          </a>
        {/if}

        <button
          type="button"
          onclick={toggleCollapse}
          class="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-[#DDD9CE] transition-colors shrink-0"
          title={isCollapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
        >
          {#if isCollapsed}
            <PanelLeftOpen size={15} />
          {:else}
            <PanelLeftClose size={15} />
          {/if}
        </button>
      </div>

      <!-- Quick Search Filter in Sidebar (Expanded View Only) -->
      {#if !isCollapsed}
        <div class="p-2.5 border-b border-[#E2DED4] bg-[#FAF8F5]/50">
          <div class="relative flex items-center">
            <Search size={12} class="absolute left-2.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tree... (/)"
              bind:value={sidebarSearch}
              class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded py-1 pl-7 pr-6 text-xs text-[#2C2B29] placeholder:text-stone-400 focus:outline-none focus:border-stone-500 transition-colors font-sans"
            />
            {#if sidebarSearch}
              <button
                type="button"
                onclick={() => (sidebarSearch = '')}
                class="absolute right-2 text-stone-400 hover:text-stone-600"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Expanded Navigation Tree -->
      {#if !isCollapsed}
        <div class="flex-1 overflow-y-auto p-3 space-y-4 [scrollbar-width:thin]">
          <!-- 1. Dedicated Spatial Editors -->
          <div class="space-y-1">
            <button
              type="button"
              onclick={() => toggleSection('spatial')}
              class="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <span class="flex items-center gap-1.5 font-semibold">
                {#if isSearching || openSections.spatial}
                  <ChevronDown size={11} class="text-stone-500" />
                {:else}
                  <ChevronRight size={11} class="text-stone-500" />
                {/if}
                <span>Spatial Editors</span>
              </span>
              <span class="bg-[#E2DED4] px-1.5 py-0.2 rounded text-[10px] text-stone-600 font-mono">3</span>
            </button>

            {#if isSearching || openSections.spatial}
              <div class="space-y-0.5 pt-0.5 pl-1">
                <a
                  href="/studio/desk"
                  class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded transition-colors {pathname === '/studio/desk'
                    ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                    : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                >
                  <span class="flex items-center gap-1.5">
                    <LayoutGrid size={13} class="text-amber-700" />
                    <span>Studio Desk Mat</span>
                  </span>
                  <span class="text-[9px] font-mono bg-amber-200/60 text-amber-900 px-1 rounded">Interactive</span>
                </a>
                <a
                  href="/studio/inspiration"
                  class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded transition-colors {pathname === '/studio/inspiration'
                    ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                    : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                >
                  <span class="flex items-center gap-1.5">
                    <Compass size={13} class="text-amber-700" />
                    <span>Inspiration Space</span>
                  </span>
                  <span class="text-[9px] font-mono bg-amber-200/60 text-amber-900 px-1 rounded">Interactive</span>
                </a>
                <a
                  href="/studio/library"
                  class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded transition-colors {pathname === '/studio/library'
                    ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                    : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                >
                  <span class="flex items-center gap-1.5">
                    <Sparkles size={13} class="text-amber-700" />
                    <span>The Shelf Library</span>
                  </span>
                  <span class="text-[9px] font-mono bg-amber-200/60 text-amber-900 px-1 rounded">Curated</span>
                </a>
                <a
                  href="/studio/zines"
                  class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded transition-colors {pathname === '/studio/zines'
                    ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                    : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                >
                  <span class="flex items-center gap-1.5">
                    <BookOpen size={13} class="text-amber-700" />
                    <span>Zine Stand & Spreads</span>
                  </span>
                  <span class="text-[9px] font-mono bg-emerald-200/60 text-emerald-900 px-1 rounded">Flip-Book</span>
                </a>
              </div>
            {/if}
          </div>

          <!-- 2. Projects Archive (Hierarchical by Type) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between px-2 py-1 group/header">
              <button
                type="button"
                onclick={() => toggleSection('projects')}
                class="flex-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-stone-700 hover:text-stone-950 cursor-pointer text-left font-semibold"
              >
                <span class="flex items-center gap-1.5">
                  {#if isSearching || openSections.projects}
                    <ChevronDown size={12} class="text-stone-600" />
                  {:else}
                    <ChevronRight size={12} class="text-stone-600" />
                  {/if}
                  <Briefcase size={12} class="text-stone-600" />
                  <span>Works</span>
                </span>
                <span class="bg-[#DDD9CE] px-1.5 py-0.2 rounded text-[10px] text-stone-700 font-mono mr-1">
                  {studioItems.projects?.length || 0}
                </span>
              </button>

              <a
                href="/studio/projects/new"
                class="p-0.5 rounded hover:bg-[#DDD9CE] text-stone-500 hover:text-stone-900 transition-colors opacity-70 group-hover/header:opacity-100"
                title="Create new project"
              >
                <Plus size={12} />
              </a>
            </div>

            {#if isSearching || openSections.projects}
              <div class="space-y-1.5 pt-0.5 pl-1.5">
                {#if groupedProjects.length === 0}
                  <div class="text-[11px] font-mono text-stone-500 px-2 py-1 italic">
                    No matching projects
                  </div>
                {:else}
                  {#each groupedProjects as [category, items]}
                    {@const groupKey = `proj-${category}`}
                    {@const isOpen = isSearching || !!openSubgroups[groupKey]}
                    {@const isExpanded = !!expandedAllGroups[groupKey]}
                    {@const displayedItems = isExpanded || items.length <= 10 ? items : items.slice(0, 10)}
                    <div class="space-y-0.5">
                      <!-- Clear Subheading with Category Styling -->
                      <button
                        type="button"
                        onclick={() => toggleSubgroup(groupKey)}
                        class="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer group {isOpen ? 'bg-[#E5E1D8] text-stone-900 font-medium' : 'text-stone-600 hover:bg-[#EAE6DE] hover:text-stone-900'}"
                      >
                        <span class="flex items-center gap-1.5 truncate">
                          {#if isOpen}
                            <ChevronDown size={11} class="text-stone-600 shrink-0" />
                          {:else}
                            <ChevronRight size={11} class="text-stone-400 group-hover:text-stone-600 shrink-0" />
                          {/if}
                          <Folder size={11} class="text-stone-500 group-hover:text-stone-700 shrink-0" />
                          <span class="truncate">{category}</span>
                        </span>
                        <span class="text-[10px] font-mono bg-[#DDD9CE]/80 text-stone-600 px-1 rounded shrink-0">
                          {items.length}
                        </span>
                      </button>

                      {#if isOpen}
                        <div class="space-y-0.5 pl-2.5 border-l-2 border-[#D5CFC2] ml-2.5 mt-0.5">
                          {#each displayedItems as item}
                            {@const active = pathname === `/studio/projects/${item.slug}`}
                            {@const badge = getArchetypeBadge(item.archetype || item.projectType)}
                            <a
                              href={`/studio/projects/${item.slug}`}
                              class="flex items-center justify-between text-xs px-2 py-1 rounded transition-colors group {active
                                ? 'bg-[#DFDAD0] text-[#1A1918] font-medium shadow-2xs'
                                : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                              title={item.title}
                            >
                              <span class="truncate mr-1.5 text-[11.5px]">{item.title}</span>
                              <span class="shrink-0 text-[8px] font-mono uppercase px-1 py-0.2 rounded border {badge.color}">
                                {badge.label}
                              </span>
                            </a>
                          {/each}

                          {#if items.length > 10}
                            <button
                              type="button"
                              onclick={() => toggleExpandAll(groupKey)}
                              class="w-full text-left text-[10px] font-mono text-stone-500 hover:text-amber-800 px-2 py-0.5 hover:underline cursor-pointer"
                            >
                              {isExpanded ? '← Show fewer' : `+ Show ${items.length - 10} more...`}
                            </button>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>

          <!-- 3. Essays & Notes (Hierarchical by Year) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between px-2 py-1 group/header">
              <button
                type="button"
                onclick={() => toggleSection('blog')}
                class="flex-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-stone-700 hover:text-stone-950 cursor-pointer text-left font-semibold"
              >
                <span class="flex items-center gap-1.5">
                  {#if isSearching || openSections.blog}
                    <ChevronDown size={12} class="text-stone-600" />
                  {:else}
                    <ChevronRight size={12} class="text-stone-600" />
                  {/if}
                  <BookOpen size={12} class="text-stone-600" />
                  <span>Essays &amp; Notes</span>
                </span>
                <span class="bg-[#DDD9CE] px-1.5 py-0.2 rounded text-[10px] text-stone-700 font-mono mr-1">
                  {studioItems.blog?.length || 0}
                </span>
              </button>

              <a
                href="/studio/blog/new"
                class="p-0.5 rounded hover:bg-[#DDD9CE] text-stone-500 hover:text-stone-900 transition-colors opacity-70 group-hover/header:opacity-100"
                title="Create new essay"
              >
                <Plus size={12} />
              </a>
            </div>

            {#if isSearching || openSections.blog}
              <div class="space-y-1.5 pt-0.5 pl-1.5">
                {#if groupedBlog.length === 0}
                  <div class="text-[11px] font-mono text-stone-500 px-2 py-1 italic">
                    No matching essays
                  </div>
                {:else}
                  {#each groupedBlog as [year, items]}
                    {@const groupKey = `blog-${year}`}
                    {@const isOpen = isSearching || !!openSubgroups[groupKey]}
                    {@const isExpanded = !!expandedAllGroups[groupKey]}
                    {@const displayedItems = isExpanded || items.length <= 10 ? items : items.slice(0, 10)}
                    <div class="space-y-0.5">
                      <!-- Clear Subheading with Year/Calendar Styling -->
                      <button
                        type="button"
                        onclick={() => toggleSubgroup(groupKey)}
                        class="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer group {isOpen ? 'bg-[#E5E1D8] text-stone-900 font-medium' : 'text-stone-600 hover:bg-[#EAE6DE] hover:text-stone-900'}"
                      >
                        <span class="flex items-center gap-1.5 truncate">
                          {#if isOpen}
                            <ChevronDown size={11} class="text-stone-600 shrink-0" />
                          {:else}
                            <ChevronRight size={11} class="text-stone-400 group-hover:text-stone-600 shrink-0" />
                          {/if}
                          <span class="text-stone-500 group-hover:text-stone-700 shrink-0 font-sans text-[11px]">📅</span>
                          <span class="truncate">{year}</span>
                        </span>
                        <span class="text-[10px] font-mono bg-[#DDD9CE]/80 text-stone-600 px-1 rounded shrink-0">
                          {items.length}
                        </span>
                      </button>

                      {#if isOpen}
                        <div class="space-y-0.5 pl-2.5 border-l-2 border-[#D5CFC2] ml-2.5 mt-0.5">
                          {#each displayedItems as item}
                            {@const active = pathname === `/studio/blog/${item.slug}`}
                            <a
                              href={`/studio/blog/${item.slug}`}
                              class="block text-xs px-2 py-1 rounded truncate transition-colors text-[11.5px] {active
                                ? 'bg-[#DFDAD0] text-[#1A1918] font-medium shadow-2xs'
                                : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                              title={item.title}
                            >
                              {item.title}
                            </a>
                          {/each}

                          {#if items.length > 10}
                            <button
                              type="button"
                              onclick={() => toggleExpandAll(groupKey)}
                              class="w-full text-left text-[10px] font-mono text-stone-500 hover:text-amber-800 px-2 py-0.5 hover:underline cursor-pointer"
                            >
                              {isExpanded ? '← Show fewer' : `+ Show ${items.length - 10} more...`}
                            </button>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>

          <!-- 4. Core Pages -->
          <div class="space-y-1">
            <button
              type="button"
              onclick={() => toggleSection('pages')}
              class="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <span class="flex items-center gap-1.5 font-semibold">
                {#if isSearching || openSections.pages}
                  <ChevronDown size={11} class="text-stone-500" />
                {:else}
                  <ChevronRight size={11} class="text-stone-500" />
                {/if}
                <FileText size={11} />
                <span>Pages</span>
              </span>
              <span class="bg-[#E2DED4] px-1.5 py-0.2 rounded text-[10px] text-stone-600 font-mono">
                {studioItems.pages?.length || 0}
              </span>
            </button>

            {#if isSearching || openSections.pages}
              <div class="space-y-0.5 pt-0.5 pl-2 border-l border-[#DDD9CE] ml-3.5">
                {#each filteredPages as item}
                  {@const active = pathname === `/studio/pages/${item.slug}`}
                  <a
                    href={`/studio/pages/${item.slug}`}
                    class="block text-xs px-2 py-1 rounded truncate transition-colors {active
                      ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                      : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                    title={item.title}
                  >
                    {item.title}
                  </a>
                {/each}
              </div>
            {/if}
          </div>

          <!-- 5. Protocol & System -->
          <div class="space-y-1">
            <button
              type="button"
              onclick={() => toggleSection('protocol')}
              class="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <span class="flex items-center gap-1.5 font-semibold">
                {#if isSearching || openSections.protocol}
                  <ChevronDown size={11} class="text-stone-500" />
                {:else}
                  <ChevronRight size={11} class="text-stone-500" />
                {/if}
                <Shield size={11} />
                <span>Protocol</span>
              </span>
              <span class="bg-[#E2DED4] px-1.5 py-0.2 rounded text-[10px] text-stone-600 font-mono">2</span>
            </button>

            {#if isSearching || openSections.protocol}
              <div class="space-y-0.5 pt-0.5 pl-1">
                <a
                  href="/studio/protocol"
                  class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded transition-colors {pathname === '/studio/protocol'
                    ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                    : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                >
                  <span class="flex items-center gap-1.5 truncate">
                    <Shield size={13} class="text-amber-700 shrink-0" />
                    <span class="truncate">AI Protection &amp; WebP</span>
                  </span>
                  <span class="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 rounded shrink-0">Live</span>
                </a>

                <a
                  href="/studio/protocol/seo"
                  class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded transition-colors {pathname === '/studio/protocol/seo'
                    ? 'bg-[#E0DBD0] text-[#1E1D1B] font-semibold border-l-2 border-stone-800'
                    : 'text-stone-700 hover:text-[#2C2B29] hover:bg-[#EAE6DE]'}"
                >
                  <span class="flex items-center gap-1.5 truncate">
                    <Globe size={13} class="text-amber-700 shrink-0" />
                    <span class="truncate">Site SEO &amp; Meta</span>
                  </span>
                  <span class="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 rounded shrink-0">Live</span>
                </a>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <!-- Collapsed Icon Rail Navigation -->
        <div class="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-2 [scrollbar-width:none]">
          <a
            href="/studio"
            class="p-2.5 rounded-md transition-colors {pathname === '/studio'
              ? 'bg-[#E0DBD0] text-stone-900 font-semibold'
              : 'text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]'}"
            title="Workbench Overview"
          >
            <LayoutGrid size={16} />
          </a>

          <div class="w-6 border-b border-[#DDD9CE] my-1"></div>

          <a
            href="/studio/desk"
            class="p-2.5 rounded-md transition-colors {pathname === '/studio/desk'
              ? 'bg-[#E0DBD0] text-amber-900 font-semibold'
              : 'text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]'}"
            title="Studio Desk Mat"
          >
            <Layers size={16} />
          </a>

          <a
            href="/studio/inspiration"
            class="p-2.5 rounded-md transition-colors {pathname === '/studio/inspiration'
              ? 'bg-[#E0DBD0] text-amber-900 font-semibold'
              : 'text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]'}"
            title="Inspiration Cosmology"
          >
            <Compass size={16} />
          </a>

          <a
            href="/studio/library"
            class="p-2.5 rounded-md transition-colors {pathname === '/studio/library'
              ? 'bg-[#E0DBD0] text-amber-900 font-semibold'
              : 'text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]'}"
            title="Shelf Library"
          >
            <Sparkles size={16} />
          </a>

          <div class="w-6 border-b border-[#DDD9CE] my-1"></div>

          <a
            href="/studio/projects/new"
            class="p-2.5 rounded-md transition-colors text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]"
            title="New Project ({studioItems.projects?.length || 0})"
          >
            <Briefcase size={16} />
          </a>

          <a
            href="/studio/blog/new"
            class="p-2.5 rounded-md transition-colors text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]"
            title="New Essay ({studioItems.blog?.length || 0})"
          >
            <BookOpen size={16} />
          </a>

          <a
            href="/studio/protocol"
            class="p-2.5 rounded-md transition-colors {pathname === '/studio/protocol'
              ? 'bg-[#E0DBD0] text-amber-900 font-semibold'
              : 'text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]'}"
            title="AI Protocol & Deterrence"
          >
            <Shield size={16} />
          </a>

          <a
            href="/studio/protocol/seo"
            class="p-2.5 rounded-md transition-colors {pathname === '/studio/protocol/seo'
              ? 'bg-[#E0DBD0] text-amber-900 font-semibold'
              : 'text-stone-500 hover:text-stone-800 hover:bg-[#EAE6DE]'}"
            title="Site SEO & Meta"
          >
            <Globe size={16} />
          </a>
        </div>
      {/if}
    </div>

    <!-- Sidebar Bottom Controls -->
    <div class="border-t border-[#E2DED4] bg-[#EAE6DE] {isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 flex items-center justify-between gap-2'}">
      {#if !isCollapsed}
        <a
          href="/studio/media"
          class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono rounded bg-[#FCFBF9] hover:bg-white text-stone-700 hover:text-stone-900 transition-colors border border-[#DDD9CE] shadow-2xs"
        >
          <Image size={13} />
          <span>Media Library</span>
        </a>

        <a
          href="/studio/projects/new"
          class="flex items-center justify-center p-1.5 text-stone-800 bg-[#E0DBD0] hover:bg-[#D5CFC2] rounded border border-[#DDD9CE] transition-colors"
          title="Create new project document"
        >
          <PlusCircle size={16} />
        </a>
      {:else}
        <a
          href="/studio/media"
          class="p-2 rounded hover:bg-[#DDD9CE] text-stone-700 transition-colors"
          title="Media Library"
        >
          <Image size={16} />
        </a>
      {/if}
    </div>
  </aside>

  <!-- Main Studio Workspace Area (Full Viewport) -->
  <main class="flex-1 h-full min-w-0 overflow-hidden bg-[#F4F2ED]">
    {@render children()}
  </main>
</div>
