<script lang="ts">
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';

  let { data } = $props();
  let nowData = $derived(data.nowData);
  import SEOHead from '$lib/components/common/SEOHead.svelte';
</script>

<SEOHead
  title="Now — Current Engineering Focus"
  description={nowData?.subtitle || 'What Linus Torvalds is actively focused on, reading, building, and benchmarking right now.'}
/>

<div class="max-w-4xl mx-auto space-y-12">
  <!-- Standardized Header Anatomy -->
  <header class="space-y-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <div class="flex items-center gap-2">
      <span class="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
        Now / Current Focus
      </span>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
      {nowData?.title || 'Now'}
    </h1>

    {#if nowData?.subtitle}
      <div class="font-sans text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
        <MarkdownRenderer
          content={nowData.subtitle}
          className="[&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-stone-400 hover:[&_a]:text-[#2C2B29] dark:hover:[&_a]:text-[#EDE9E1]"
        />
      </div>
    {/if}
  </header>

  <!-- Editorial Markdown Body -->
  <section class="space-y-10">
    {#if nowData?.body}
      <MarkdownRenderer
        content={nowData.body}
        className="editorial-prose"
      />
    {/if}

    <!-- Pull Quote Box -->
    {#if nowData?.quote}
      <div class="p-6 sm:p-8 bg-[#FAF9F5] dark:bg-[#181715] border border-[#E8E6DF] dark:border-[#2E2C28] rounded-lg shadow-xs font-serif italic text-stone-800 dark:text-stone-200 text-base sm:text-lg leading-relaxed">
        &ldquo;{nowData.quote}&rdquo;
      </div>
    {/if}

    <!-- Practice Trajectory & Path to About -->
    <div class="pt-8 border-t border-[#E8E6DF] dark:border-[#2E2C28] mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-xl bg-[#FAF9F5] dark:bg-[#181715] border border-[#E8E6DF] dark:border-[#2E2C28]">
      <div class="space-y-1">
        <span class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
          From Current Focus to Core Practice
        </span>
        <p class="font-serif text-sm sm:text-base text-stone-700 dark:text-stone-300">
          Curious about the broader context, disciplines, and working principles?
        </p>
      </div>
      <a
        href="/about"
        class="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shrink-0"
      >
        <span>Who I Am (About)</span>
        <span>→</span>
      </a>
    </div>
  </section>
</div>
