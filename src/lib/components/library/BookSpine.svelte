<script lang="ts">
  import type { BookItem } from '$lib/types';

  interface Props {
    book: BookItem;
    onClick: () => void;
  }

  let { book, onClick }: Props = $props();

  const heightPx = $derived(book.height || 210);
  const thicknessPx = $derived(Math.max(book.thickness || 32, 28));
  const isLeaning = $derived(book.orientation === 'leaning');
  const isHorizontal = $derived(book.orientation === 'horizontal');

  const bg = $derived(book.spineColor || '#3B3632');
  const textColor = $derived(book.spineTextColor || '#F4F2ED');
  const leanAngle = $derived(isLeaning ? book.leanAngle || -10 : 0);
</script>

{#if isHorizontal}
  <div
    role="button"
    tabindex="0"
    onclick={onClick}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label="View book details for {book.title} by {book.author}"
    class="relative cursor-pointer group flex flex-col items-center justify-end transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xs z-10"
    style="width: {Math.min(heightPx * 0.75, 170)}px;"
  >
    <div
      class="w-full h-9 rounded-xs shadow-md border-l-2 border-t border-b border-black/30 flex items-center justify-between px-3 text-xs font-serif font-medium overflow-hidden relative"
      style="background-color: {bg}; color: {textColor};"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-white/10 to-black/40 pointer-events-none"></div>
      <span class="truncate pr-2 font-serif text-xs tracking-tight relative z-10 font-medium">
        {book.title}
      </span>
      <span class="font-mono text-[9px] opacity-75 relative z-10 shrink-0">
        {'★'.repeat(book.rating || 5)}
      </span>
    </div>
  </div>
{:else}
  <div
    role="button"
    tabindex="0"
    onclick={onClick}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label="View book details for {book.title} by {book.author}"
    class="relative cursor-pointer group flex items-end transform transition-transform duration-300 hover:scale-[1.04] hover:-translate-y-3 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xs z-10"
    style="height: {heightPx}px; width: {thicknessPx}px; {isLeaning ? `transform: rotate(${leanAngle}deg);` : ''} transform-origin: bottom center;"
  >
    <div
      class="w-full h-full rounded-xs shadow-lg border-l border-white/25 border-r border-black/50 flex flex-col justify-between items-center relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl"
      style="background-color: {bg}; color: {textColor};"
    >
      <!-- Top Headband & Trim -->
      <div class="w-full h-1.5 bg-stone-300/40 border-b border-black/20 shrink-0"></div>
      
      <!-- Top Gold Leaf / Classic Filigree Accent -->
      {#if book.pattern === 'gold-leaf' || book.pattern === 'vintage'}
        <div class="w-4/5 h-[1.5px] bg-amber-400/60 shadow-xs my-1.5 shrink-0"></div>
      {:else}
        <div class="w-full h-[1px] bg-white/20 my-1 shrink-0"></div>
      {/if}

      <!-- Spine Title (Vertical Layout) -->
      <div class="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        <div
          class="absolute whitespace-nowrap transform -rotate-90 origin-center text-center px-1 select-none flex items-center justify-center"
          style="width: {heightPx - 50}px;"
        >
          <span class="font-serif font-medium tracking-tight text-xs sm:text-[13px] truncate block w-full text-center drop-shadow-xs">
            {book.title}
          </span>
        </div>
      </div>

      <!-- Bookmark Ribbon Peek (for leaning or highlighted books) -->
      {#if isLeaning}
        <div class="absolute -top-1 right-2 w-1.5 h-6 bg-red-700/80 rounded-b-xs shadow-xs pointer-events-none z-20"></div>
      {/if}

      <!-- Bottom Accents & Star Rating -->
      {#if book.pattern === 'gold-leaf' || book.pattern === 'vintage'}
        <div class="w-4/5 h-[1.5px] bg-amber-400/60 shadow-xs my-1 shrink-0"></div>
      {:else}
        <div class="w-full h-[1px] bg-white/20 my-1 shrink-0"></div>
      {/if}

      <div class="w-full flex flex-col items-center pb-1 shrink-0">
        <span class="text-[9px] font-mono opacity-80 font-bold tracking-tighter">
          {'★'.repeat(book.rating || 5)}
        </span>
        <div class="w-full h-1.5 bg-stone-300/40 border-t border-black/20 mt-1"></div>
      </div>

      <!-- Spine Lighting / Shadow Curvature Gradient -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/45 via-white/15 to-black/50 pointer-events-none"></div>
    </div>
  </div>
{/if}
