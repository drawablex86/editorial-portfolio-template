<script lang="ts">
  import SEOHead from '$lib/components/common/SEOHead.svelte';
  import ZineFlipBook from '$lib/components/zines/ZineFlipBook.svelte';
  import { ArrowLeft, BookOpen, ShieldCheck, Printer, Calendar } from '@lucide/svelte';

  let { data } = $props();
  let zine = $derived(data.zine);
</script>

<SEOHead
  title={`${zine.title} / The Reading Room`}
  description={zine.description || zine.subtitle || 'Tactile flip-book edition.'}
  ogImage={zine.coverSrc}
/>

<div class="min-h-screen bg-[#F4F2ED] dark:bg-[#141312] text-[#2C2B29] dark:text-[#EDE9E1] transition-colors flex flex-col justify-between">
  <!-- Minimalist Editorial Top Bar -->
  <header class="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-4">
    <div class="flex items-center gap-4">
      <a
        href="/zines"
        class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors py-1 px-2 rounded-sm border border-[#E2DED4] dark:border-[#2E2C28] bg-[#EFECE6]/60 dark:bg-[#1A1917]/60"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        Return to Stand
      </a>

      <div>
        <h1 class="text-lg sm:text-xl font-serif font-medium text-[#2C2B29] dark:text-[#EDE9E1]">
          {zine.title}
        </h1>
        {#if zine.subtitle}
          <p class="text-xs font-serif italic text-stone-500">{zine.subtitle}</p>
        {/if}
      </div>
    </div>

    <!-- Print & Physical Ephemera Badges -->
    <div class="flex items-center gap-3 text-xs font-mono text-stone-500">
      {#if zine.printSpecs}
        <span class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EFECE6] dark:bg-[#1C1B19] border border-[#E2DED4] dark:border-[#2E2C28]">
          <Printer class="w-3 h-3 text-stone-400" />
          {zine.printSpecs}
        </span>
      {/if}

      {#if zine.edition}
        <span class="hidden sm:inline-flex px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
          {zine.edition}
        </span>
      {/if}

      {#if zine.aiProtected}
        <span class="inline-flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-400 font-mono">
          <ShieldCheck class="w-3.5 h-3.5" />
          AI Cloaked
        </span>
      {/if}
    </div>
  </header>

  <!-- Main Tactile Flip-Book Reading Stage -->
  <section class="flex-1 flex flex-col justify-center items-center w-full px-2 sm:px-6">
    <ZineFlipBook {zine} />
  </section>

  <!-- Footer Marginal Notes -->
  <footer class="py-4 px-6 text-center text-[11px] font-mono text-stone-400 border-t border-[#E8E6DF] dark:border-[#2E2C28]">
    <span>Drag page corners or use arrow keys (← / →) to flip spreads</span>
  </footer>
</div>
