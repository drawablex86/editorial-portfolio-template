<script lang="ts">
  import { onMount } from 'svelte';
  import type { InspirationData, InspirationNode } from '$lib/types';
  import { X, Sparkles, Move, Compass, Eye } from '@lucide/svelte';

  interface Props {
    data: InspirationData | null;
  }

  let { data }: Props = $props();

  let containerRef: HTMLDivElement;
  let scrollWrapperRef: HTMLDivElement;
  let isMobile = $state(false);
  let mousePos = $state({ x: -1000, y: -1000 });
  let isHovering = $state(false);
  let activeNode = $state<InspirationNode | null>(null);

  onMount(() => {
    isMobile = window.innerWidth < 768;
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    window.addEventListener('resize', checkMobile);

    // Initial center scroll on mobile so users start at the rich center
    if (isMobile && scrollWrapperRef) {
      scrollWrapperRef.scrollLeft = (scrollWrapperRef.scrollWidth - scrollWrapperRef.clientWidth) / 3;
    }

    return () => window.removeEventListener('resize', checkMobile);
  });

  function handleMouseMove(e: MouseEvent) {
    if (isMobile || !containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isHovering = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!containerRef || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.getBoundingClientRect();
    mousePos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    isHovering = true;
  }

  function handleMouseLeave() {
    isHovering = false;
  }

  let nodes = $derived(data?.nodes ?? []);
</script>

<div class="w-full space-y-6">
  <!-- Editorial Header Bar -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-5">
    <div class="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-stone-500 dark:text-amber-300/80 mb-1.5">
      <Sparkles size={14} class="text-amber-600 dark:text-amber-400" />
      <span>Cosmology &amp; Intellectual Influences</span>
    </div>
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
          Inspiration Cosmology
        </h1>
        <p class="text-sm md:text-base text-stone-600 dark:text-stone-300 font-serif mt-2 max-w-2xl leading-relaxed">
          A spatial constellation of influences, inspiration and vibes. Move the torch and explore with light.
        </p>
      </div>

      {#if isMobile}
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-200/70 text-stone-700 text-xs font-mono self-start">
          <Move size={13} />
          <span>Swipe horizontally to explore archive</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Full-Width Archival Plate Experience -->
  <div class="w-full relative">
    <!-- Horizontal scroll wrapper for mobile panoramic exploration -->
    <div
      bind:this={scrollWrapperRef}
      class="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:thin] touch-pan-x"
    >
      <div
        bind:this={containerRef}
        role="presentation"
        onmousemove={handleMouseMove}
        onmouseleave={handleMouseLeave}
        ontouchmove={handleTouchMove}
        ontouchend={() => setTimeout(() => (isHovering = false), 800)}
        class="relative w-full min-w-[980px] md:min-w-0 aspect-[16/9] md:h-[calc(100vh-210px)] max-h-[860px] bg-[#121110] select-none overflow-hidden"
      >
        <!-- 1. Ambient Background Layer (Low Opacity Warm Archival Plate) -->
        <div class="absolute inset-0 pointer-events-none opacity-25 dark:opacity-20 mix-blend-screen transition-opacity duration-700">
          <img
            src="/images/inspiration_cosmology.webp"
            alt="Inspiration Cosmology Ambient Plate"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- 2. Torchlight Spotlight Layer (Illuminated by cursor / touch) -->
        <div
          class="absolute inset-0 pointer-events-none transition-opacity duration-300 {isHovering ? 'opacity-100' : 'opacity-0'}"
          style="mask-image: radial-gradient(circle 340px at {mousePos.x}px {mousePos.y}px, black 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.15) 75%, transparent 100%); -webkit-mask-image: radial-gradient(circle 340px at {mousePos.x}px {mousePos.y}px, black 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.15) 75%, transparent 100%);"
        >
          <img
            src="/images/inspiration_cosmology.webp"
            alt="Inspiration Cosmology Illuminated"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- 3. Torch Halo Glow (Light Warmth Ring around Cursor) -->
        {#if isHovering}
          <div
            class="pointer-events-none absolute inset-0"
            style="background: radial-gradient(circle 340px at {mousePos.x}px {mousePos.y}px, rgba(255, 230, 180, 0.24) 0%, rgba(220, 190, 130, 0.08) 50%, transparent 100%);"
          ></div>
        {/if}

        <!-- 4. Constellation Lines SVG Linking Key Intellectual Nodes -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {#each nodes as node, idx}
            {#if idx < nodes.length - 1}
              {@const next = nodes[idx + 1]}
              <line
                x1="{node.x}%"
                y1="{node.y}%"
                x2="{next.x}%"
                y2="{next.y}%"
                stroke="rgba(255, 240, 200, 0.28)"
                stroke-width="1.2"
                stroke-dasharray="4 4"
              />
            {/if}
          {/each}
        </svg>

        <!-- 5. Interactive Constellation Node Hotspots -->
        {#each nodes as node (node.id)}
          {@const isActive = activeNode?.id === node.id}
          <button
            type="button"
            onclick={() => (activeNode = node)}
            style="left: {node.x}%; top: {node.y}%;"
            class="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none z-10"
            aria-label="Inspect influence: {node.title}"
          >
            <div class="relative flex items-center justify-center">
              <!-- Pulse halo ring -->
              <div
                class="w-8 h-8 rounded-full transition-transform duration-300 flex items-center justify-center {isActive
                  ? 'scale-125 bg-amber-400/35'
                  : 'group-hover:scale-125 bg-amber-400/15'}"
              >
                <!-- Core Star Dot -->
                <div
                  class="w-2.5 h-2.5 rounded-full shadow-md transition-all duration-300 {isActive
                    ? 'bg-amber-400 scale-125 shadow-[0_0_14px_rgba(251,191,36,0.95)]'
                    : 'bg-amber-200/90 group-hover:bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]'}"
                ></div>
              </div>

              <!-- Node Floating Label -->
              <span
                class="absolute top-8 whitespace-nowrap font-mono text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md bg-[#1C1B19]/90 border border-amber-400/30 text-[#EDE9E1] shadow-lg pointer-events-none transition-all backdrop-blur-md {isActive
                  ? 'border-amber-400 font-medium text-amber-200 scale-105'
                  : 'group-hover:border-amber-300/60'}"
              >
                {node.title}
              </span>
            </div>
          </button>
        {/each}

        <!-- 6. Active Specimen Card Drawer (Floating inspector) -->
        {#if activeNode}
          <div
            class="absolute bottom-6 right-6 max-w-sm w-full bg-[#181715]/95 backdrop-blur-md rounded-xl p-5 border border-amber-400/40 shadow-2xl z-30 transition-all animate-in fade-in"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="font-mono text-[10px] uppercase tracking-wider text-amber-300/80">
                  {activeNode.category || 'Intellectual Specimen'}
                </span>
                <h3 class="text-base font-medium text-[#EDE9E1] mt-0.5">
                  {activeNode.title}
                </h3>
              </div>
              <button
                type="button"
                onclick={() => (activeNode = null)}
                class="p-1 rounded text-stone-400 hover:text-white cursor-pointer"
                aria-label="Close details"
              >
                <X size={15} />
              </button>
            </div>

            {#if activeNode.quote}
              <blockquote class="mt-3 font-serif italic text-xs sm:text-sm text-stone-300 leading-relaxed border-l-2 border-amber-400/60 pl-3">
                &ldquo;{activeNode.quote}&rdquo;
              </blockquote>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
