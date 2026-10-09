<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Search, X, Tag, Shuffle, ArrowUpRight } from '@lucide/svelte';
  import SEOHead from '$lib/components/common/SEOHead.svelte';
  import MarkovMarginaliaCanvas from '$lib/components/blog/MarkovMarginaliaCanvas.svelte';

  let { data } = $props();

  let blogData = $derived(data.blogData ?? []);
  let linguisticCorpus = $derived(data.linguisticCorpus);
  let searchQuery = $state('');
  let selectedTag = $state<string | null>(null);
  let searchInputEl = $state<HTMLInputElement | null>(null);
  let isSearchFocused = $state(false);

  function handleSelectWordFromCanvas(word: string) {
    searchQuery = word;
    searchInputEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  let allTags = $derived(
    Array.from(
      new Set(
        blogData
          .flatMap((p) => (p.tags ? p.tags.split('/').map((t) => t.trim()) : []))
          .filter(Boolean)
      )
    )
  );

  function getSearchExcerpt(content?: string, query?: string): string | null {
    if (!content || !query || query.trim().length < 2) return null;
    const q = query.trim().toLowerCase();
    const idx = content.toLowerCase().indexOf(q);
    if (idx === -1) return null;

    const start = Math.max(0, idx - 45);
    const end = Math.min(content.length, idx + q.length + 65);
    const excerpt = content.slice(start, end).replace(/\s+/g, ' ').trim();
    return (start > 0 ? '…' : '') + excerpt + (end < content.length ? '…' : '');
  }

  let filteredPosts = $derived(
    blogData.filter((post) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        (post.description && post.description.toLowerCase().includes(q)) ||
        (post.tags && post.tags.toLowerCase().includes(q)) ||
        (post.searchableContent && post.searchableContent.toLowerCase().includes(q));

      const matchesTag =
        !selectedTag ||
        (post.tags && post.tags.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesSearch && matchesTag;
    })
  );

  function triggerRandomRead() {
    if (blogData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * blogData.length);
    const chosen = blogData[randomIndex];
    if (chosen?.id) {
      goto(`/blog/${chosen.id}`);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    // If user presses "/" and isn't currently focused in another text field
    const active = document.activeElement;
    const isTyping =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active?.getAttribute('contenteditable') === 'true';

    if (e.key === '/' && !isTyping) {
      e.preventDefault();
      searchInputEl?.focus();
      searchInputEl?.select();
    } else if (e.key === 'Escape' && isSearchFocused) {
      if (searchQuery) {
        searchQuery = '';
      } else {
        searchInputEl?.blur();
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<SEOHead
  title="Writing &amp; Notes — Systems Essays"
  description="Essays on systems architecture, kernel engineering, data structure taste, and software craftsmanship by Linus Torvalds."
/>

<div class="max-w-4xl mx-auto space-y-10">
  <!-- Standardized Header Anatomy -->
  <header class="border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8 space-y-4">
    <div class="flex items-center justify-between">
      <span class="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
        Writing / Systems Essays
      </span>
      <div class="flex items-center gap-3">
        {#if blogData.length > 0}
          <span class="text-xs text-stone-500 dark:text-stone-400 font-mono">
            {filteredPosts.length === blogData.length
              ? `${blogData.length} essays`
              : `${filteredPosts.length} of ${blogData.length} essays`}
          </span>
        {/if}
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
        Essays &amp; Notes
      </h1>

      {#if blogData.length > 0}
        <button
          type="button"
          onclick={triggerRandomRead}
          title="Pick a serendipitous essay to read"
          class="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/80 dark:bg-[#1C1B19] text-stone-700 dark:text-stone-300 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:border-stone-400 dark:hover:border-stone-600 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer group"
        >
          <Shuffle size={13} class="text-stone-500 dark:text-stone-400 group-hover:rotate-45 transition-transform duration-300" />
          <span>Serendipity / Random</span>
        </button>
      {/if}
    </div>

    <p class="font-sans text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
      Observational essays, technical notes, systems architecture, and engineering principles.
    </p>
  </header>

  <!-- Generative Typography & Computational Linguistics Canvas -->
  {#if linguisticCorpus && linguisticCorpus.vocabulary?.length > 0}
    <div class="pt-1">
      <MarkovMarginaliaCanvas
        corpus={linguisticCorpus}
        onSelectWord={handleSelectWordFromCanvas}
      />
    </div>
  {/if}

  <!-- Search & Filter Bar -->
  {#if blogData.length > 0}
    <div class="space-y-4">
      <div class="relative flex items-center">
        <Search
          size={15}
          class="absolute left-3.5 text-stone-400 dark:text-stone-500 pointer-events-none transition-colors {isSearchFocused ? 'text-[#2C2B29] dark:text-[#EDE9E1]' : ''}"
        />
        <input
          bind:this={searchInputEl}
          type="search"
          aria-label="Search essays and notes (Press / to focus)"
          bind:value={searchQuery}
          onfocus={() => (isSearchFocused = true)}
          onblur={() => (isSearchFocused = false)}
          placeholder="Search essays, tags, topics..."
          class="w-full bg-[#EAE7DF]/40 dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] hover:border-stone-400 dark:hover:border-stone-600 focus:border-[#2C2B29] dark:focus:border-[#EDE9E1] focus:bg-[#FAF9F5] dark:focus:bg-[#1C1B19] focus:ring-1 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded py-2.5 pl-10 pr-20 text-sm text-[#2C2B29] dark:text-[#EDE9E1] placeholder:text-stone-500 transition-all outline-none font-sans"
        />

        <div class="absolute right-3 flex items-center gap-1.5">
          {#if searchQuery}
            <button
              type="button"
              onclick={() => {
                searchQuery = '';
                searchInputEl?.focus();
              }}
              aria-label="Clear search"
              class="p-1 text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          {:else if !isSearchFocused}
            <kbd
              title="Press / anywhere on this page to search"
              class="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[11px] font-mono rounded bg-stone-200/60 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700 shadow-2xs select-none pointer-events-none"
            >
              /
            </kbd>
          {/if}
        </div>
      </div>

      <!-- Tag Filter Pills -->
      {#if allTags.length > 0}
        <div class="flex items-center gap-1.5 flex-wrap pt-1">
          <span class="text-[11px] font-mono uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1 select-none">
            <Tag size={11} /> Tags:
          </span>
          <button
            type="button"
            onclick={() => (selectedTag = null)}
            class="text-xs px-2.5 py-0.5 rounded-full transition-all border cursor-pointer {selectedTag === null
              ? 'bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] border-[#2C2B29] dark:border-[#EDE9E1] shadow-2xs font-medium'
              : 'bg-stone-200/50 dark:bg-[#1C1B19] text-stone-600 dark:text-stone-300 border-[#E8E6DF] dark:border-[#2E2C28] hover:border-stone-400 dark:hover:border-stone-600'}"
          >
            All
          </button>
          {#each allTags as tag}
            <button
              type="button"
              onclick={() => (selectedTag = selectedTag === tag ? null : tag)}
              class="text-xs px-2.5 py-0.5 rounded-full transition-all border cursor-pointer {selectedTag === tag
                ? 'bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] border-[#2C2B29] dark:border-[#EDE9E1] shadow-2xs font-medium'
                : 'bg-stone-200/50 dark:bg-[#1C1B19] text-stone-600 dark:text-stone-300 border-[#E8E6DF] dark:border-[#2E2C28] hover:border-stone-400 dark:hover:border-stone-600'}"
            >
              {tag}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Articles List with Expansive Tactile Click Zones -->
  <div class="space-y-4 pt-2">
    {#each filteredPosts as post (post.id)}
      <article
        data-hover-card="true"
        class="group relative rounded-lg p-5 -mx-5 sm:p-6 sm:-mx-6 transition-all duration-200 border border-transparent hover:border-[#E8E6DF] dark:hover:border-[#2E2C28] hover:bg-[#FAF9F5]/70 dark:hover:bg-[#1C1B19]/60 hover:shadow-2xs"
      >
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6">
          <div class="space-y-2 max-w-2xl">
            <h2 class="text-xl sm:text-2xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] group-hover:text-stone-900 dark:group-hover:text-white transition-colors flex items-center gap-2">
              <a
                href="/blog/{post.id}"
                class="focus:outline-none after:absolute after:inset-0 after:content-['']"
              >
                {post.title}
              </a>
              <ArrowUpRight
                size={16}
                class="opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200 text-stone-400 shrink-0"
              />
            </h2>
            {#if searchQuery && getSearchExcerpt(post.searchableContent, searchQuery) && !post.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !post.title.toLowerCase().includes(searchQuery.toLowerCase())}
              {@const excerpt = getSearchExcerpt(post.searchableContent, searchQuery)}
              <p class="text-stone-700 dark:text-stone-300 font-serif italic text-sm line-clamp-2 leading-relaxed bg-[#EAE7DF]/40 dark:bg-[#252320]/60 px-2.5 py-1.5 rounded border border-[#E8E6DF] dark:border-[#2E2C28]">
                <span class="font-mono text-[10px] uppercase tracking-wider text-stone-500 mr-1 not-italic">Match in essay:</span>
                &ldquo;{excerpt}&rdquo;
              </p>
            {:else if post.description}
              <p class="text-stone-600 dark:text-stone-400 font-serif text-base line-clamp-2 leading-relaxed">
                {post.description}
              </p>
            {/if}
          </div>

          <div class="flex items-baseline md:flex-col md:items-end space-x-3 md:space-x-0 md:space-y-1.5 text-xs tracking-widest text-stone-500 dark:text-stone-400 uppercase font-mono md:text-right md:max-w-[190px] shrink-0">
            <div>
              <span>{post.year}</span>
            </div>
            {#if post.tags}
              <span class="leading-relaxed truncate max-w-full text-[11px] text-stone-400 dark:text-stone-500">{post.tags}</span>
            {/if}
          </div>
        </div>
      </article>
    {/each}

    {#if filteredPosts.length === 0}
      <div class="py-16 text-center text-stone-500 font-serif space-y-2">
        <p class="text-lg">No essays matched your query.</p>
        <p class="text-xs font-mono text-stone-400">
          Try adjusting your search terms or clearing the active tag filter.
        </p>
      </div>
    {/if}
  </div>
</div>
