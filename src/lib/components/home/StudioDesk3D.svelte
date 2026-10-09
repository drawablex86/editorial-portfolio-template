<script lang="ts">
  import { onMount } from 'svelte';
  import type { DeskSheetItem } from '$lib/types';
  import { Sparkles, RotateCcw, LayoutGrid, Shuffle, ZoomIn, X } from '@lucide/svelte';

  interface Props {
    sheets?: DeskSheetItem[];
  }

  let { sheets = [] }: Props = $props();

  interface StudioCard {
    id: string | number;
    title: string;
    caption?: string;
    src: string;
    x: number;
    y: number;
    rotation: number;
    zIndex: number;
    isHovered: boolean;
  }

  const DEFAULT_ITEMS: DeskSheetItem[] = [
    { id: 1, title: 'Figure Study I', caption: 'Charcoal & graphite on cold-pressed linen', src: '/images/sketch-1.webp' },
    { id: 2, title: 'Anatomy in Charcoal', caption: 'Gestural torso study, natural daylight', src: '/images/sketch-2.webp' },
    { id: 3, title: 'Torsional Profile', caption: 'Anatomical weight and spine counter-twist', src: '/images/sketch-3.webp' },
    { id: 4, title: 'Gesture Study IV', caption: 'Rapid 3-minute warm-up study', src: '/images/sketch-4.webp' },
    { id: 5, title: 'Prime Lens Exposure', caption: '50mm f/1.4 documentary daylight study', src: '/images/sketch-5.webp' },
    { id: 6, title: 'Studio Light Reflection', caption: 'High-contrast study in chiaroscuro', src: '/images/sketch-6.webp' },
    { id: 7, title: 'Seated Contour', caption: 'Continuous line brush and ink study', src: '/images/sketch-7.webp' },
  ];

  let cards = $state<StudioCard[]>([]);
  let containerRef: HTMLDivElement;
  let highestZ = $state(10);
  let isDragging = $state(false);
  let draggedCardId = $state<string | number | null>(null);
  let inspectedCard = $state<StudioCard | null>(null);

  // Drag tracking offsets
  let dragStartX = 0;
  let dragStartY = 0;
  let initialCardX = 0;
  let initialCardY = 0;

  function initScatteredPositions() {
    const source = sheets && sheets.length > 0 ? sheets : DEFAULT_ITEMS;
    const baseRotations = [-4.5, 3.2, -2.8, 4.1, -1.9, 3.8, -3.5];

    // Distribute cards with an artful, natural overlapping studio desk arrangement
    cards = source.slice(0, 7).map((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);

      // Organic spread percentage coordinates
      const baseX = 8 + col * 23 + (idx % 2 === 0 ? 3 : -3);
      const baseY = 8 + row * 45 + (idx % 3 === 0 ? 5 : -4);

      return {
        id: item.id || idx + 1,
        title: item.title || `Study Plate ${idx + 1}`,
        caption: item.caption || 'Studio drawing on heavy rag paper',
        src: item.src || `/images/sketch-${idx + 1}.webp`,
        x: baseX,
        y: baseY,
        rotation: baseRotations[idx % baseRotations.length],
        zIndex: idx + 1,
        isHovered: false,
      };
    });
    highestZ = cards.length + 1;
  }

  function tidyDesk() {
    // Organizes into a neat architectural contact sheet grid
    cards = cards.map((c, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      return {
        ...c,
        x: 6 + col * 23.5,
        y: 8 + row * 46,
        rotation: 0,
        zIndex: idx + 1,
      };
    });
  }

  function scatterDesk() {
    initScatteredPositions();
  }

  onMount(() => {
    initScatteredPositions();
  });

  // Pointer drag logic
  function handlePointerDown(e: PointerEvent, card: StudioCard) {
    if ((e.target as HTMLElement).closest('button')) return;

    isDragging = true;
    draggedCardId = card.id;

    highestZ += 1;
    card.zIndex = highestZ;

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialCardX = card.x;
    initialCardY = card.y;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent, card: StudioCard) {
    if (!isDragging || draggedCardId !== card.id || !containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartY) / rect.height) * 100;

    card.x = Math.max(-5, Math.min(85, initialCardX + deltaX));
    card.y = Math.max(-5, Math.min(80, initialCardY + deltaY));
  }

  function handlePointerUp(e: PointerEvent, card: StudioCard) {
    if (draggedCardId === card.id) {
      isDragging = false;
      draggedCardId = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }
</script>

<div class="space-y-3">
  <!-- Desk Header Controls Bar -->
  <div class="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-400 px-1">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
      <span class="uppercase tracking-wider">Fragments</span>
    </div>

    <!-- Action Toolbar -->
    <div class="flex items-center gap-2">
      <!-- Mobile swipe hint -->
      <span class="inline-flex md:hidden text-[11px] font-mono text-stone-400">
        Scroll ↔
      </span>

      <button
        type="button"
        onclick={tidyDesk}
        class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-[#E8E6DF] dark:border-[#2E2C28]"
        title="Arrange studies into an architectural grid"
      >
        <LayoutGrid size={13} />
        <span>Tidy Grid</span>
      </button>

      <button
        type="button"
        onclick={scatterDesk}
        class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-[#E8E6DF] dark:border-[#2E2C28]"
        title="Naturally scatter studies across desk"
      >
        <Shuffle size={13} />
        <span>Scatter</span>
      </button>
    </div>
  </div>

  <!-- Horizontal Scroll Outer Container for Mobile Panning -->
  <div class="w-full overflow-x-auto pb-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
    <!-- Interactive Studio Drafting Mat -->
    <div
      bind:this={containerRef}
      class="relative min-w-[760px] md:min-w-full w-full h-[480px] sm:h-[540px] md:h-[600px] overflow-hidden rounded-2xl border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5] dark:bg-[#161513] shadow-inner select-none transition-colors"
    >
      <!-- Architectural Desk Grid & Ruler Markings Background -->
      <div
        class="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style="background-size: 32px 32px; background-image: linear-gradient(to right, rgba(160, 150, 130, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 150, 130, 0.2) 1px, transparent 1px);"
      ></div>

      <!-- Center Studio Mat Emboss -->
      <div class="absolute inset-6 rounded-xl border border-dashed border-[#E8E6DF]/80 dark:border-[#2E2C28]/60 pointer-events-none flex items-end justify-between p-4 text-[10px] font-mono text-stone-400/70 uppercase tracking-widest">
        <span>Studio Desk &amp; Workshop</span>
        <span>Technical Schematics &amp; Spec Sheets</span>
      </div>

      <!-- Draggable Tactile Study Plates -->
      {#each cards as card (card.id)}
        {@const isCardDragging = draggedCardId === card.id}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onpointerdown={(e) => handlePointerDown(e, card)}
          onpointermove={(e) => handlePointerMove(e, card)}
          onpointerup={(e) => handlePointerUp(e, card)}
          onmouseenter={() => (card.isHovered = true)}
          onmouseleave={() => (card.isHovered = false)}
          style="
            left: {card.x}%;
            top: {card.y}%;
            transform: rotate({card.rotation}deg) scale({isCardDragging ? 1.05 : card.isHovered ? 1.02 : 1});
            z-index: {card.zIndex};
            touch-action: none;
          "
          class="absolute w-44 sm:w-52 md:w-56 cursor-grab active:cursor-grabbing p-2.5 rounded-sm bg-[#FFFDF9] dark:bg-[#1F1E1B] border border-[#E8E6DF] dark:border-[#33302B] transition-shadow duration-200 {isCardDragging
            ? 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]'
            : card.isHovered
            ? 'shadow-[0_15px_30px_-8px_rgba(0,0,0,0.2)] dark:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.5)]'
            : 'shadow-[0_8px_16px_-4px_rgba(44,43,41,0.12)] dark:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)]'}"
        >
        <!-- Drawing Plate Image -->
        <div class="relative aspect-[3/4] overflow-hidden rounded-xs bg-[#EAE7DF] dark:bg-[#141312] border border-[#E8E6DF]/80 dark:border-[#2E2C28]">
          <img
            src={card.src}
            alt={card.title}
            loading="lazy"
            decoding="async"
            draggable="false"
            class="w-full h-full object-cover pointer-events-none select-none"
          />

          <!-- Quick Zoom Inspection Trigger -->
          <button
            type="button"
            onclick={() => (inspectedCard = card)}
            class="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-opacity {card.isHovered ? 'opacity-100' : 'opacity-0'} cursor-pointer"
            title="Inspect artwork closely"
            aria-label="Inspect artwork: {card.title}"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        <!-- Handwritten Specimen Label -->
        <div class="mt-2 px-0.5 space-y-0.5 pointer-events-none">
          <p class="font-serif text-xs font-medium text-[#2C2B29] dark:text-[#EDE9E1] truncate">
            {card.title}
          </p>
          {#if card.caption}
            <p class="font-sans text-[10px] text-stone-500 dark:text-stone-400 truncate">
              {card.caption}
            </p>
          {/if}
        </div>
      </div>
    {/each}
    </div>
  </div>

  <!-- Full Artwork Modal Inspector -->
  {#if inspectedCard}
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspected-card-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm"
    >
      <div
        class="relative max-w-xl w-full bg-[#FAF9F5] dark:bg-[#181715] p-5 rounded-xl border border-[#E8E6DF] dark:border-[#2E2C28] shadow-2xl text-[#2C2B29] dark:text-[#EDE9E1]"
      >
        <button
          type="button"
          onclick={() => (inspectedCard = null)}
          class="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          aria-label="Close inspection"
        >
          <X size={18} />
        </button>

        <div class="aspect-[3/4] max-h-[65vh] w-auto mx-auto overflow-hidden rounded-sm mb-4">
          <img
            src={inspectedCard.src}
            alt={inspectedCard.title}
            class="w-full h-full object-contain mx-auto"
          />
        </div>

        <h3 id="inspected-card-title" class="font-serif text-lg font-medium">{inspectedCard.title}</h3>
        {#if inspectedCard.caption}
          <p class="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1">{inspectedCard.caption}</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
