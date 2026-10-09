<script lang="ts">
  import SEOHead from '$lib/components/common/SEOHead.svelte';
  import { BookOpen, Sparkles, Layers, ArrowRight, ShieldCheck, Printer } from '@lucide/svelte';

  let { data } = $props();
  let zines = $derived(data.zines || []);
  let activeFilter = $state<string>('all');

  let filteredZines = $derived(
    activeFilter === 'all'
      ? zines
      : zines.filter((z) => z.texture === activeFilter || z.binding === activeFilter)
  );
</script>

<SEOHead
  title="Zines / The Magazine Stand & Reading Room"
  description="Tactile editorial publications, visual essays, risograph zines, and sketchbooks in an interactive flip-book format."
/>

<div class="min-h-screen pt-28 pb-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
  <!-- Editorial Header -->
  <header class="mb-14 max-w-3xl">
    <div class="flex items-center gap-2 mb-3">
      <span class="w-2 h-2 rounded-full bg-[#2C2B29] dark:bg-[#EDE9E1]"></span>
      <p class="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
        Print Stand / Reading Room
      </p>
    </div>
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-[#2C2B29] dark:text-[#EDE9E1] tracking-tight mb-4">
      Zines & Print Ephemera
    </h1>
    <p class="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
      A quiet editorial reading stand for bound publications, risograph pamphlets, visual monographs, and sketchbooks. Click any publication to flip through its tactile physical spreads.
    </p>

    <!-- Meta specs bar -->
    <div class="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-[#E8E6DF] dark:border-[#2E2C28] text-xs font-mono text-stone-500">
      <span class="flex items-center gap-1.5">
        <Printer class="w-3.5 h-3.5" />
        Retina 2x Physical Spreads
      </span>
      <span class="flex items-center gap-1.5">
        <ShieldCheck class="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
        Glaze / Nightshade Protected
      </span>
      <span>{zines.length} Publications in Archive</span>
    </div>
  </header>

  <!-- Empty state if no zines published yet -->
  {#if zines.length === 0}
    <div class="py-20 text-center rounded-2xl border border-dashed border-[#E8E6DF] dark:border-[#2E2C28] bg-[#EFECE6]/40 dark:bg-[#181716]/40">
      <BookOpen class="w-10 h-10 mx-auto text-stone-400 mb-3" />
      <h3 class="text-lg font-serif text-[#2C2B29] dark:text-[#EDE9E1]">The Stand is Currently Being Restocked</h3>
      <p class="text-sm font-sans text-stone-500 mt-1 max-w-md mx-auto">
        New publications are being processed through the Studio ingest pipeline.
      </p>
    </div>
  {:else}
    <!-- The Magazine Stand Shelf Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
      {#each filteredZines as zine}
        <a
          href="/zines/{zine.id}"
          class="group relative flex flex-col focus:outline-none focus:ring-2 focus:ring-[#2C2B29] rounded-xl transition-all"
        >
          <!-- Tilted Magazine Cover Card Container -->
          <div
            class="relative w-full overflow-hidden rounded-lg bg-[#EFECE6] dark:bg-[#1A1917] border border-[#E2DED4] dark:border-[#2E2C28] shadow-md group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 flex items-center justify-center p-4"
            style="aspect-ratio: {zine.aspectRatio ? (zine.aspectRatio < 1 ? '3/4' : '4/3') : '3/4'};"
          >
            <!-- Wood/Stone Rack Ledge Accent -->
            <div class="absolute bottom-0 inset-x-0 h-1.5 bg-[#DED9CE] dark:bg-[#2A2825] z-10"></div>

            <!-- Soft Spine Gutter Shadow -->
            <div class="absolute inset-y-0 left-4 w-4 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10"></div>

            <!-- Cover Image -->
            <img
              src={zine.coverSrc}
              alt={zine.title}
              class="w-full h-full object-contain filter drop-shadow-md group-hover:scale-102 transition-transform duration-500"
              loading="lazy"
            />

            <!-- Page Count Badge -->
            <div class="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-black/60 text-white backdrop-blur-xs">
              {zine.pageCount} Pgs
            </div>

            <!-- AI Protected Shield Indicator -->
            {#if zine.aiProtected}
              <div class="absolute top-3 left-3 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider bg-stone-800/80 text-stone-200 backdrop-blur-xs flex items-center gap-1">
                <ShieldCheck class="w-2.5 h-2.5 text-stone-300" />
                CLOAKED
              </div>
            {/if}
          </div>

          <!-- Magazine Info & Print Specs -->
          <div class="mt-4 flex flex-col">
            <div class="flex items-baseline justify-between gap-2">
              <h2 class="text-xl font-serif text-[#2C2B29] dark:text-[#EDE9E1] group-hover:underline underline-offset-4 decoration-stone-400">
                {zine.title}
              </h2>
              {#if zine.year}
                <span class="text-xs font-mono text-stone-400">{zine.year}</span>
              {/if}
            </div>

            {#if zine.subtitle}
              <p class="text-sm font-serif italic text-stone-600 dark:text-stone-400 mt-0.5">
                {zine.subtitle}
              </p>
            {/if}

            {#if zine.printSpecs}
              <p class="text-xs font-mono text-stone-500 dark:text-stone-400 mt-2 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                {zine.printSpecs}
              </p>
            {/if}

            <div class="mt-3 flex items-center gap-1 text-xs font-mono font-medium text-[#2C2B29] dark:text-[#EDE9E1] opacity-70 group-hover:opacity-100 transition-opacity">
              <span>Open in Reading Room</span>
              <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
