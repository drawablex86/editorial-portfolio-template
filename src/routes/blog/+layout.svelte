<script lang="ts">
  import { page } from '$app/state';
  import { ArrowLeft, Shuffle, Search } from '@lucide/svelte';

  let { children } = $props();

  let isIndex = $derived(page.url.pathname === '/blog');
  let allPosts = $derived(page.data.allPosts ?? []);

  /** Locally-held search query; committed to the URL only on submit. */
  let query = $state('');

  let currentIndex = $derived(
    isIndex ? -1 : allPosts.findIndex((p: { id: string }) => p.id === page.params.slug)
  );
  let prevPost = $derived(currentIndex > 0 ? allPosts[currentIndex - 1] : null);
  let nextPost = $derived(
    currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
  );

  // Keep the field in sync when the user navigates or lands on a filtered URL.
  $effect(() => {
    query = page.url.searchParams.get('q') ?? '';
  });

  function submitSearch(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const target = trimmed ? `/blog?q=${encodeURIComponent(trimmed)}` : '/blog';
    // Full page load: the blog index loads its whole corpus from the server,
    // so a client-side navigation is far heavier than re-rendering the route.
    window.location.assign(target);
  }

  function clearSearch() {
    query = '';
    window.location.assign('/blog');
  }

  function randomEssay() {
    if (allPosts.length === 0) return;
    window.location.assign(`/blog/${allPosts[Math.floor(Math.random() * allPosts.length)].id}`);
  }
</script>

<header
  class="sticky top-[var(--header-height,53px)] z-30 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 mb-8
         bg-[#F4F2ED]/95 dark:bg-[#141312]/95 backdrop-blur-md
         border-b border-[#E8E6DF] dark:border-[#2E2C28]"
>
  <div class="max-w-4xl mx-auto flex items-center gap-3 py-2.5">
    <a
      href="/blog"
      class="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors py-1.5 pr-1"
      aria-label="Back to all essays"
    >
      <ArrowLeft size={13} />
      <span class="hidden sm:inline">Writing</span>
    </a>

    <span class="h-4 w-px bg-[#E8E6DF] dark:bg-[#2E2C28] shrink-0" aria-hidden="true"></span>

    {#if isIndex}
      <!-- Index: quick corpus-wide actions -->
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 truncate">
          Essays &amp; Notes
        </span>
        {#if allPosts.length > 0}
          <button
            type="button"
            onclick={randomEssay}
            class="ml-auto shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/80 dark:bg-[#1C1B19] text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:border-stone-400 dark:hover:border-stone-600 transition-all cursor-pointer group"
            title="Pick a serendipitous essay to read"
          >
            <Shuffle size={12} class="group-hover:rotate-45 transition-transform duration-300" />
            <span class="hidden sm:inline">Serendipity</span>
          </button>
        {/if}
      </div>
    {:else}
      <!-- Detail: compact search + linear reading navigation -->
      <form onsubmit={submitSearch} class="relative flex items-center shrink min-w-0" role="search">
        <Search size={13} class="absolute left-2.5 text-stone-400 dark:text-stone-500 pointer-events-none" />
        <input
          bind:value={query}
          type="search"
          name="q"
          aria-label="Search essays"
          placeholder="Search essays…"
          class="w-full sm:w-44 md:w-56 bg-[#EAE7DF]/40 dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] hover:border-stone-400 dark:hover:border-stone-600 focus:border-[#2C2B29] dark:focus:border-[#EDE9E1] focus:bg-[#FAF9F5] dark:focus:bg-[#1C1B19] focus:ring-1 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded py-1.5 pl-8 pr-12 text-xs text-[#2C2B29] dark:text-[#EDE9E1] placeholder:text-stone-500 transition-all outline-none font-sans"
        />
        <div class="absolute right-1.5 flex items-center gap-0.5">
          {#if query}
            <button
              type="button"
              onclick={clearSearch}
              aria-label="Clear search"
              class="p-0.5 text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors cursor-pointer"
            >
              <span aria-hidden="true">×</span>
            </button>
          {/if}
          <button
            type="submit"
            class="px-1.5 py-0.5 text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors cursor-pointer"
            aria-label="Submit search"
          >
            ↵
          </button>
        </div>
      </form>

      <nav class="ml-auto flex items-center gap-1 shrink-0" aria-label="Essay navigation">
        <a
          href={prevPost ? `/blog/${prevPost.id}` : '/blog'}
          rel={prevPost ? 'prev' : undefined}
          class="inline-flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:bg-black/5 dark:hover:bg-white/10 transition-colors max-w-[9rem] truncate"
          title={prevPost ? `Previous: ${prevPost.title}` : 'Back to all essays'}
        >
          <ArrowLeft size={12} class="shrink-0" />
          <span class="truncate hidden md:inline">{prevPost ? prevPost.title : 'All essays'}</span>
        </a>
        <a
          href={nextPost ? `/blog/${nextPost.id}` : '/blog'}
          rel={nextPost ? 'next' : undefined}
          class="inline-flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:bg-black/5 dark:hover:bg-white/10 transition-colors max-w-[9rem] truncate"
          title={nextPost ? `Next: ${nextPost.title}` : 'Back to all essays'}
        >
          <span class="truncate hidden md:inline">{nextPost ? nextPost.title : 'All essays'}</span>
          <span aria-hidden="true">→</span>
        </a>
      </nav>
    {/if}
  </div>
</header>

{@render children()}
