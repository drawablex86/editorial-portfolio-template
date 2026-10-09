<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { BookItem } from '$lib/types';
  import { X, ExternalLink, BookOpen, Star, Sparkles, ChevronLeft, ChevronRight, Quote } from '@lucide/svelte';

  interface Props {
    book: BookItem | null;
    onClose: () => void;
    onSelectBook?: (book: BookItem) => void;
    allBooks?: BookItem[];
  }

  let { book, onClose, onSelectBook, allBooks = [] }: Props = $props();

  let currentIndex = $derived(
    book && allBooks.length > 0 ? allBooks.findIndex((b) => b.id === book.id) : -1
  );

  let prevBook = $derived(
    currentIndex > 0 ? allBooks[currentIndex - 1] : null
  );

  let nextBook = $derived(
    currentIndex >= 0 && currentIndex < allBooks.length - 1 ? allBooks[currentIndex + 1] : null
  );

  function goToPrev() {
    if (prevBook && onSelectBook) {
      onSelectBook(prevBook);
    }
  }

  function goToNext() {
    if (nextBook && onSelectBook) {
      onSelectBook(nextBook);
    }
  }

  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

{#if book}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-book-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
  >
    <!-- Backdrop with fade transition -->
    <div
      transition:fade={{ duration: 200 }}
      onclick={onClose}
      class="fixed inset-0 bg-stone-950/70 dark:bg-black/85 backdrop-blur-sm cursor-pointer"
      aria-hidden="true"
    ></div>

    <!-- Modal Container with scale/fade transition -->
    <div
      transition:scale={{ duration: 240, start: 0.96, easing: cubicOut }}
      class="relative w-full max-w-2xl bg-[#F4F2ED] dark:bg-[#1A1826] border border-[#E8E6DF] dark:border-[#2E2A40] rounded-xl shadow-2xl overflow-hidden z-10 text-[#2C2B29] dark:text-[#EDE9E1]"
    >
      <!-- Close Button -->
      <button
        onclick={onClose}
        class="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-200/60 dark:bg-stone-800/60 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
        aria-label="Close book details"
      >
        <X size={18} />
      </button>

      <!-- Prev / Next quick switch controls -->
      {#if prevBook}
        <button
          onclick={goToPrev}
          class="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/70 dark:bg-stone-800/70 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 shadow-md border border-stone-300/40 dark:border-stone-700/50 transition-all cursor-pointer hover:scale-105"
          aria-label="Previous book: {prevBook.title}"
          title="Previous: {prevBook.title}"
        >
          <ChevronLeft size={18} />
        </button>
      {/if}

      {#if nextBook}
        <button
          onclick={goToNext}
          class="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/70 dark:bg-stone-800/70 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 shadow-md border border-stone-300/40 dark:border-stone-700/50 transition-all cursor-pointer hover:scale-105"
          aria-label="Next book: {nextBook.title}"
          title="Next: {nextBook.title}"
        >
          <ChevronRight size={18} />
        </button>
      {/if}

      <div class="flex flex-col md:flex-row p-6 md:p-8 gap-6 md:gap-8 {prevBook || nextBook ? 'md:px-12' : ''}">
        <!-- Cover -->
        <div class="flex flex-col items-center justify-center shrink-0">
          <div class="relative w-44 sm:w-52 h-64 sm:h-76 rounded-r-xs overflow-hidden shadow-2xl border-l-4 border-stone-800/40">
            <img
              src={book.coverUrl}
              alt={book.title}
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none"></div>
          </div>
        </div>

        <!-- Book Details -->
        <div class="flex flex-col justify-between flex-1 space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2 text-xs font-mono tracking-wider uppercase text-stone-500 dark:text-stone-400">
              <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                Goodreads Favourite
              </span>
              {#if book.publishYear}
                <span>• {book.publishYear}</span>
              {/if}
            </div>

            <h3
              id="modal-book-title"
              class="text-xl sm:text-2xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-tight"
            >
              {book.title}
            </h3>
            <p class="text-sm font-sans font-medium text-stone-600 dark:text-stone-300 mt-1">
              by {book.author}
            </p>

            {#if book.rating && book.rating > 0}
              <div class="flex items-center gap-1 mt-3 text-amber-500 dark:text-amber-400">
                {#each Array(5) as _, i}
                  <Star
                    size={15}
                    class={i < (book.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-stone-300 dark:text-stone-700'}
                  />
                {/each}
                <span class="text-xs font-mono ml-2 text-stone-500 dark:text-stone-400">
                  {book.rating}/5
                </span>
              </div>
            {/if}

            {#if book.quoteSnippet}
              <div class="mt-3.5 p-3 bg-amber-500/5 dark:bg-amber-400/5 border-l-2 border-amber-500/60 rounded-r-md">
                <div class="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-1">
                  <Quote size={11} />
                  <span>Highlight</span>
                </div>
                <p class="text-xs sm:text-[13px] font-serif italic text-stone-700 dark:text-stone-200 leading-relaxed">
                  &ldquo;{book.quoteSnippet}&rdquo;
                </p>
              </div>
            {/if}

            {#if book.userReview}
              <div class="mt-3 p-3.5 bg-stone-200/50 dark:bg-[#232035] border border-stone-300/60 dark:border-stone-700/50 rounded-lg">
                <div class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 flex items-center gap-1 mb-1.5">
                  <Sparkles size={12} class="text-amber-500" />
                  <span>Curator&apos;s Review</span>
                </div>
                <p class="text-xs sm:text-sm font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
                  &ldquo;{book.userReview}&rdquo;
                </p>
              </div>
            {:else if !book.quoteSnippet}
              <p class="text-xs sm:text-sm font-serif text-stone-600 dark:text-stone-400 italic mt-3">
                Part of the curated studio library of foundational literature, systems architecture, and computing history.
              </p>
            {/if}
          </div>

          <div class="pt-3 border-t border-stone-300/60 dark:border-stone-800 flex flex-wrap items-center gap-3">
            {#if book.notesSlug}
              <a
                href={`/blog/${book.notesSlug.replace(/^\/blog\//, '').replace(/^\//, '')}`}
                class="flex-1 min-h-[40px] px-4 py-2 bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] hover:bg-stone-800 dark:hover:bg-white rounded-lg text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <BookOpen size={15} />
                <span>Read Notes</span>
              </a>
            {:else}
              <a
                href="/blog"
                class="flex-1 min-h-[40px] px-4 py-2 bg-stone-200/80 dark:bg-[#252136] hover:bg-stone-300 dark:hover:bg-[#2F2A45] text-stone-800 dark:text-stone-200 border border-stone-300/70 dark:border-stone-700/60 rounded-lg text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <BookOpen size={15} class="text-amber-600 dark:text-amber-400" />
                <span>Explore Essays</span>
              </a>
            {/if}

            <a
              href={book.goodreadsUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-stone-200/70 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-stone-300/50 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <span>Goodreads</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

