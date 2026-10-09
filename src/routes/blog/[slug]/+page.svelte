<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft, ArrowRight, Shuffle, Check, Copy } from '@lucide/svelte';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import SEOHead from '$lib/components/common/SEOHead.svelte';

  let { data } = $props();
  let post = $derived(data.post);
  let allPosts = $derived(data.allPosts ?? []);

  let wordCount = $derived(post.body ? post.body.trim().split(/\s+/).length : 0);
  let readingTimeMin = $derived(Math.max(1, Math.round(wordCount / 220)));

  // Reading progress tracking
  let articleEl = $state<HTMLElement | null>(null);
  let scrollProgress = $state(0);
  let isCopied = $state(false);

  // Compute sibling / next posts
  let currentIndex = $derived(allPosts.findIndex((p: { id: string }) => p.id === post.id));
  let nextPost = $derived(
    currentIndex !== -1 && allPosts.length > 1
      ? allPosts[(currentIndex + 1) % allPosts.length]
      : null
  );

  let randomOtherPost = $derived.by(() => {
    if (allPosts.length <= 1) return null;
    const others = allPosts.filter((p: { id: string }) => p.id !== post.id);
    return others[Math.floor(Math.random() * others.length)] || null;
  });

  function updateScrollProgress() {
    if (!articleEl) return;
    const rect = articleEl.getBoundingClientRect();
    const totalHeight = rect.height - window.innerHeight;
    if (totalHeight <= 0) {
      scrollProgress = 100;
      return;
    }
    const currentScrolled = -rect.top;
    const progress = Math.min(100, Math.max(0, (currentScrolled / totalHeight) * 100));
    scrollProgress = Math.round(progress);
  }

  async function copyCitation() {
    const citation = `Linus Torvalds. "${post.title}." Systems Notes${post.year ? ` (${post.year})` : ''}. ${typeof window !== 'undefined' ? window.location.href : ''}`;
    try {
      await navigator.clipboard.writeText(citation);
      isCopied = true;
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch {
      // Fallback
    }
  }

  onMount(() => {
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  });
</script>

<SEOHead
  title={post.seoTitle || `${post.title} — Essays & Notes`}
  description={post.seoDescription || post.description || post.title}
  ogImage={post.ogImage || post.thumbnailSrc}
  ogType="article"
  publishDate={post.publishDate || (post.year ? `${post.year}-01-01` : undefined)}
  noIndex={post.noIndex}
/>

<!-- Fixed Reading Progress Indicator Bar -->
<div
  class="fixed top-0 left-0 w-full h-[2.5px] z-50 pointer-events-none bg-stone-300/30 dark:bg-stone-800/40"
  aria-hidden="true"
>
  <div
    class="h-full bg-[#2C2B29] dark:bg-[#EDE9E1] transition-all duration-100 ease-out will-change-[width]"
    style="width: {scrollProgress}%;"
  ></div>
</div>

<article bind:this={articleEl} class="max-w-3xl mx-auto space-y-10">
  <nav aria-label="Breadcrumb navigation" class="mb-2 flex items-center justify-between">
    <a
      href="/blog"
      class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded py-1 px-1 -ml-1"
    >
      <ArrowLeft size={14} />
      <span>Back to All Essays</span>
    </a>

    <!-- Subtle Reading Progress Telemetry -->
    {#if scrollProgress > 0}
      <span class="text-[11px] font-mono tracking-wider uppercase text-stone-400 dark:text-stone-500 transition-opacity">
        {scrollProgress}% read
      </span>
    {/if}
  </nav>

  <header class="border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-stone-500 dark:text-stone-400">
      <div class="flex items-center gap-2.5">
        <span class="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-2xs font-medium">
          Essays &amp; Notes
        </span>
        {#if post.year}
          <span class="uppercase tracking-widest">
            {post.year}
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-3 text-[11px] uppercase tracking-wider">
        <span>{readingTimeMin} min read</span>
        <span>•</span>
        <span>{wordCount} words</span>
      </div>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-tight pt-2">
      {post.title}
    </h1>

    {#if post.description}
      <p class="text-lg text-stone-600 dark:text-stone-300 font-serif leading-relaxed italic pt-1">
        {post.description}
      </p>
    {/if}

    <!-- Micro Toolbar / Cite Fragment Action -->
    <div class="pt-2 flex items-center gap-3">
      <button
        type="button"
        onclick={copyCitation}
        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] bg-stone-200/50 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-800 border border-[#E8E6DF] dark:border-[#2E2C28] rounded transition-all cursor-pointer"
        title="Copy bibliographic citation to clipboard"
      >
        {#if isCopied}
          <Check size={12} class="text-emerald-600 dark:text-emerald-400" />
          <span class="text-emerald-700 dark:text-emerald-300">Citation Copied</span>
        {:else}
          <Copy size={12} />
          <span>Cite Fragment</span>
        {/if}
      </button>

      {#if post.tags}
        <span class="text-[11px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          {post.tags}
        </span>
      {/if}
    </div>
  </header>

  {#if post.body}
    <div class="pt-2">
      <MarkdownRenderer
        content={post.body}
        className="editorial-prose mx-auto"
      />
    </div>
  {/if}

  <!-- Sovereign Colophon & Imprint with Serendipity Discovery -->
  <footer class="border-t border-[#E8E6DF] dark:border-[#2E2C28] pt-10 mt-16 space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
      <div>
        <p class="font-medium text-stone-700 dark:text-stone-300">Published in Systems Notes</p>
        <p class="mt-0.5 font-serif italic text-stone-500">Observational essays &amp; studio notes by Linus Torvalds</p>
      </div>
      <a
        href="/blog"
        class="inline-flex items-center gap-1.5 uppercase tracking-wider text-[#2C2B29] dark:text-[#EDE9E1] hover:underline"
      >
        <span>All Essays &amp; Notes</span>
        <span>→</span>
      </a>
    </div>

    <!-- Next & Random Navigation Matrix -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8E6DF]/60 dark:border-[#2E2C28]">
      {#if nextPost}
        <a
          href="/blog/{nextPost.id}"
          class="group p-4 rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/50 dark:bg-[#1C1B19]/50 hover:bg-[#FAF9F5] dark:hover:bg-[#1C1B19] hover:border-stone-400 dark:hover:border-stone-600 transition-all space-y-1 block cursor-pointer"
        >
          <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Next Essay</span>
            <ArrowRight size={12} class="group-hover:translate-x-1 transition-transform" />
          </div>
          <div class="font-serif font-medium text-base text-[#2C2B29] dark:text-[#EDE9E1] group-hover:text-stone-900 dark:group-hover:text-white line-clamp-1">
            {nextPost.title}
          </div>
        </a>
      {/if}

      {#if randomOtherPost}
        <a
          href="/blog/{randomOtherPost.id}"
          class="group p-4 rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/50 dark:bg-[#1C1B19]/50 hover:bg-[#FAF9F5] dark:hover:bg-[#1C1B19] hover:border-stone-400 dark:hover:border-stone-600 transition-all space-y-1 block cursor-pointer"
        >
          <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Serendipitous Read</span>
            <Shuffle size={12} class="group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div class="font-serif font-medium text-base text-[#2C2B29] dark:text-[#EDE9E1] group-hover:text-stone-900 dark:group-hover:text-white line-clamp-1">
            {randomOtherPost.title}
          </div>
        </a>
      {/if}
    </div>
  </footer>
</article>

