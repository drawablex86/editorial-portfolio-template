<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { LibraryData, BookItem } from '$lib/types';
  import { LayoutGrid, List, Sparkles, Layers, ChevronLeft, ChevronRight, BookOpen, Quote, ArrowUpDown } from '@lucide/svelte';
  import BookSpine from './BookSpine.svelte';
  import BookDetailModal from './BookDetailModal.svelte';

  interface Props {
    libraryData?: LibraryData | null;
  }

  let { libraryData }: Props = $props();

  let books = $derived(libraryData?.books || []);
  let spotlightIds = $derived(libraryData?.onTopOfMyMind || ['book-42771901', 'book-187633']);
  let spotlightBooks = $derived(
    spotlightIds
      .map((id) => books.find((b) => b.id === id || b.bookId === id))
      .filter((b): b is BookItem => Boolean(b))
  );

  let selectedBook = $state<BookItem | null>(null);
  let viewMode = $state<'shelf' | 'cover' | 'list'>('shelf');
  let searchQuery = $state('');
  let sortBy = $state<'curated' | 'rating' | 'year' | 'title'>('curated');

  // Deep-linking: sync URL ?book= parameter with selectedBook state
  $effect(() => {
    const bookParam = page.url.searchParams.get('book');
    if (bookParam && (!selectedBook || selectedBook.id !== bookParam)) {
      const matched = books.find((b) => b.id === bookParam || b.bookId === bookParam);
      if (matched) {
        selectedBook = matched;
      }
    } else if (!bookParam && selectedBook) {
      selectedBook = null;
    }
  });

  function openBook(book: BookItem) {
    selectedBook = book;
    const url = new URL(page.url);
    url.searchParams.set('book', book.id);
    goto(url.toString(), { replaceState: false, keepFocus: true, noScroll: true });
  }

  function closeBook() {
    selectedBook = null;
    const url = new URL(page.url);
    url.searchParams.delete('book');
    goto(url.toString(), { replaceState: false, keepFocus: true, noScroll: true });
  }

  let filteredBooks = $derived(
    books
      .filter((b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice()
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'year') return Number(b.publishYear || 0) - Number(a.publishYear || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0; // 'curated' keeps original order
      })
  );

  // Dynamic shelf packing based on thickness (or default slicing)
  let shelf1 = $derived(filteredBooks.slice(0, 7));
  let shelf2 = $derived(filteredBooks.slice(7, 14));
  let shelf3 = $derived(filteredBooks.slice(14));

  let shelfRef0 = $state<HTMLDivElement | null>(null);
  let shelfRef1 = $state<HTMLDivElement | null>(null);
  let shelfRef2 = $state<HTMLDivElement | null>(null);

  function registerShelf(node: HTMLDivElement, idx: number) {
    if (idx === 0) shelfRef0 = node;
    else if (idx === 1) shelfRef1 = node;
    else if (idx === 2) shelfRef2 = node;
  }

  function scrollShelf(shelfIdx: number, direction: 'left' | 'right') {
    const el = shelfIdx === 0 ? shelfRef0 : shelfIdx === 1 ? shelfRef1 : shelfRef2;
    if (el) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
</script>

<div class="space-y-10">
  <!-- Header Bar -->
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E6DF] dark:border-[#28243A] pb-6">
    <div>
      <div class="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-stone-600 dark:text-amber-300/80 mb-1">
        <Sparkles size={14} class="text-amber-500" />
        <span>The Shelf</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
        My Favourite Books
      </h1>
      <p class="text-xs sm:text-sm font-sans text-stone-600 dark:text-stone-400 max-w-xl mt-1.5 leading-relaxed">
        Selected literature, monographs, and philosophy from my Goodreads archive.
      </p>
    </div>

    <!-- Controls: Search, Sort & Mode Switcher -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Search Input -->
      <div class="relative min-w-[170px] sm:min-w-[190px]">
        <input
          type="text"
          aria-label="Search books by title or author"
          placeholder="Search title or author..."
          bind:value={searchQuery}
          class="w-full px-3 py-1.5 text-xs font-sans bg-white/70 dark:bg-[#1D192B]/80 border border-stone-300 dark:border-stone-700 rounded-md text-[#2C2B29] dark:text-[#EDE9E1] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      <!-- Sort Dropdown -->
      <div class="relative">
        <select
          aria-label="Sort books by"
          bind:value={sortBy}
          class="px-2.5 py-1.5 text-xs font-sans bg-white/70 dark:bg-[#1D192B]/80 border border-stone-300 dark:border-stone-700 rounded-md text-[#2C2B29] dark:text-[#EDE9E1] focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
        >
          <option value="curated">Curated Order</option>
          <option value="rating">Highest Rated</option>
          <option value="year">Publish Year</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      <!-- Mode Switcher -->
      <div
        role="group"
        aria-label="Library display mode"
        class="flex items-center p-1 bg-stone-200/70 dark:bg-[#1B1728] border border-stone-300 dark:border-stone-800 rounded-lg"
      >
        <button
          onclick={() => (viewMode = 'shelf')}
          aria-pressed={viewMode === 'shelf'}
          class="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer {viewMode === 'shelf'
            ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-xs'
            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}"
          title="3D Spine View"
        >
          <LayoutGrid size={13} />
          <span>Spines</span>
        </button>
        <button
          onclick={() => (viewMode = 'cover')}
          aria-pressed={viewMode === 'cover'}
          class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer {viewMode === 'cover'
            ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-xs'
            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}"
          title="Front Covers on Shelf"
        >
          <Layers size={13} />
          <span>Covers</span>
        </button>
        <button
          onclick={() => (viewMode = 'list')}
          aria-pressed={viewMode === 'list'}
          class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer {viewMode === 'list'
            ? 'bg-white dark:bg-stone-800 text-[#2C2B29] dark:text-[#EDE9E1] shadow-xs'
            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'}"
          title="Typographic Index Table"
        >
          <List size={13} />
          <span>Index</span>
        </button>
      </div>
    </div>
  </div>

  <!-- "On top of my mind" Spotlight Section (Active when not searching) -->
  {#if !searchQuery.trim() && spotlightBooks.length > 0}
    <section class="space-y-2.5 pt-1">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-amber-300/80 flex items-center gap-2">
          <BookOpen size={13} class="text-amber-600 dark:text-amber-400" />
          <span>On top of my mind</span>
        </h2>
        <span class="text-[11px] font-mono text-stone-400 dark:text-stone-500 hidden sm:inline">Currently occupying thought</span>
      </div>

      <!-- Mobile View: Compact covers only, minimal height without taking full viewport -->
      <div class="flex md:hidden items-center gap-3.5 py-1 overflow-x-auto scrollbar-none">
        {#each spotlightBooks as book}
          <button
            type="button"
            onclick={() => openBook(book)}
            class="relative w-20 aspect-[2/3] shrink-0 rounded-r-xs overflow-hidden shadow-md border-l-[3px] border-stone-800/60 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="View spotlight book: {book.title} by {book.author}"
          >
            <img src={book.coverUrl} alt={book.title} class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none"></div>
          </button>
        {/each}
      </div>

      <!-- Desktop View: Rich two-column cards with metadata & quote snippets -->
      <div class="hidden md:grid md:grid-cols-2 gap-4">
        {#each spotlightBooks as book}
          <div
            role="button"
            tabindex="0"
            onclick={() => openBook(book)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openBook(book);
              }
            }}
            class="group p-5 rounded-xl bg-white/60 dark:bg-[#1A1826]/70 border border-stone-300/70 dark:border-stone-800 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer flex gap-5 items-start text-left"
          >
            <!-- Miniature Cover with shadow -->
            <div class="relative w-20 sm:w-24 aspect-[2/3] shrink-0 rounded-r-xs overflow-hidden shadow-lg border-l-2 border-stone-800/40 group-hover:scale-102 transition-transform">
              <img src={book.coverUrl} alt={book.title} class="w-full h-full object-cover" />
            </div>

            <!-- Content Details -->
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  Spotlight
                </span>
                {#if book.publishYear}
                  <span class="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                    {book.publishYear}
                  </span>
                {/if}
              </div>

              <h3 class="text-base sm:text-lg font-serif font-medium text-[#2C2B29] dark:text-[#EDE9E1] group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors leading-snug">
                {book.title}
              </h3>
              <p class="text-xs font-sans text-stone-500 dark:text-stone-400">
                by {book.author}
              </p>

              {#if book.quoteSnippet}
                <div class="pt-1.5 flex gap-1.5 items-start">
                  <Quote size={12} class="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p class="text-xs font-serif italic text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                    &ldquo;{book.quoteSnippet}&rdquo;
                  </p>
                </div>
              {:else if book.userReview}
                <p class="text-xs font-serif italic text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                  &ldquo;{book.userReview}&rdquo;
                </p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Shelf Canvas -->
  {#if viewMode !== 'list'}
    <!-- Desktop 3D Wooden Shelves -->
    <div class="hidden md:flex flex-col gap-14 lg:gap-16 py-2">
      {#each [shelf1, shelf2, shelf3] as shelfBooks, shelfIdx}
        <div class="relative group/shelf">
          {#if viewMode === 'cover' && shelfBooks.length > 3}
            <div class="absolute top-1/2 -translate-y-1/2 inset-x-0 -mx-5 flex justify-between pointer-events-none z-30 opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-200">
              <button
                onclick={() => scrollShelf(shelfIdx, 'left')}
                class="pointer-events-auto p-2 rounded-full bg-white/90 dark:bg-stone-800/90 shadow-lg text-stone-700 dark:text-stone-200 hover:scale-110 transition-transform cursor-pointer border border-stone-200 dark:border-stone-700"
                aria-label="Scroll shelf {shelfIdx + 1} left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onclick={() => scrollShelf(shelfIdx, 'right')}
                class="pointer-events-auto p-2 rounded-full bg-white/90 dark:bg-stone-800/90 shadow-lg text-stone-700 dark:text-stone-200 hover:scale-110 transition-transform cursor-pointer border border-stone-200 dark:border-stone-700"
                aria-label="Scroll shelf {shelfIdx + 1} right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          {/if}

          <!-- Books Row -->
          <div
            use:registerShelf={shelfIdx}
            class="flex items-end justify-start gap-5 lg:gap-7 px-8 min-h-[260px] pb-1 {viewMode === 'cover'
              ? 'overflow-x-auto scrollbar-none scroll-smooth'
              : 'overflow-visible'}"
          >
            {#each shelfBooks as book (book.id)}
              {#if viewMode === 'shelf'}
                <BookSpine {book} onClick={() => openBook(book)} />
              {:else}
                <div
                  role="button"
                  tabindex="0"
                  onclick={() => openBook(book)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openBook(book);
                    }
                  }}
                  class="relative cursor-pointer group flex flex-col items-center justify-end z-10 transition-all duration-300 hover:-translate-y-3 hover:scale-[1.03] rounded-xs shrink-0 focus:outline-none"
                >
                  <div
                    class="relative w-36 lg:w-44 aspect-[2/3] rounded-r-xs bg-stone-900 border-l-[7px] border-stone-950 shadow-[8px_14px_24px_rgba(0,0,0,0.45),-3px_0px_6px_rgba(0,0,0,0.25)] overflow-hidden"
                    style="transform: perspective(900px) rotateX(3deg) rotateY(-3deg); transform-origin: bottom center;"
                  >
                    <img src={book.coverUrl} alt={book.title} class="w-full h-full object-cover" />
                    <div class="absolute top-0 bottom-0 left-2.5 w-[2px] bg-black/40 pointer-events-none"></div>
                    <div class="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/20 pointer-events-none"></div>
                  </div>
                  <div class="w-32 lg:w-40 h-2 bg-black/45 blur-xs rounded-full mt-[-3px] pointer-events-none"></div>
                </div>
              {/if}
            {/each}
          </div>

          <!-- Realistic Shelf Wood Board -->
          <div class="relative w-full shadow-2xl rounded-xs">
            <div class="w-full h-3 bg-[#D4C5B0] dark:bg-[#201C2B] border-t border-white/40 dark:border-amber-300/20 shadow-inner"></div>
            <div class="w-full h-7 border-t border-white/30 border-b border-black/40 shadow-lg relative bg-amber-950/20 dark:bg-black/60">
              <div class="absolute top-0 inset-x-0 h-[1px] bg-white/40 dark:bg-amber-300/40"></div>
            </div>
            <div class="w-full h-10 bg-gradient-to-b from-black/35 via-black/15 to-transparent pointer-events-none"></div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Mobile Cover Grid -->
    <div class="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
      {#each filteredBooks as book (book.id)}
        <div
          role="button"
          tabindex="0"
          onclick={() => openBook(book)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openBook(book);
            }
          }}
          class="group relative bg-white/50 dark:bg-stone-900/70 p-2.5 rounded-lg border border-stone-300/60 dark:border-stone-800 shadow-xs cursor-pointer flex flex-col justify-between"
        >
          <div class="relative w-full aspect-[2/3] rounded overflow-hidden shadow-md mb-2">
            <img src={book.coverUrl} alt={book.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div>
            <h4 class="text-xs font-serif font-medium line-clamp-1 leading-snug text-[#2C2B29] dark:text-[#EDE9E1]">
              {book.title}
            </h4>
            <p class="text-[10px] font-sans text-stone-500 dark:text-stone-400 truncate mt-0.5">
              {book.author}
            </p>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Index Table -->
    <div class="w-full overflow-x-auto rounded-lg border border-stone-300 dark:border-stone-800 bg-white/60 dark:bg-[#181526]/70 backdrop-blur-sm shadow-md">
      <table class="w-full text-left text-xs font-sans border-collapse">
        <thead>
          <tr class="border-b border-stone-300 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80 font-mono text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <th class="py-3 px-4">Title</th>
            <th class="py-3 px-4">Author</th>
            <th class="py-3 px-4">Rating</th>
            <th class="py-3 px-4">Year</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-200 dark:divide-stone-800">
          {#each filteredBooks as book (book.id)}
            <tr
              onclick={() => openBook(book)}
              class="hover:bg-amber-500/5 transition-colors cursor-pointer group"
            >
              <td class="py-3 px-4 font-serif text-sm font-medium text-[#2C2B29] dark:text-[#EDE9E1]">
                {book.title}
              </td>
              <td class="py-3 px-4 text-stone-600 dark:text-stone-300">
                {book.author}
              </td>
              <td class="py-3 px-4 font-mono text-amber-600 dark:text-amber-400">
                {'★'.repeat(book.rating || 5)}
              </td>
              <td class="py-3 px-4 font-mono text-stone-600 dark:text-stone-400">
                {book.publishYear || '—'}
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  type="button"
                  onclick={(e) => {
                    e.stopPropagation();
                    openBook(book);
                  }}
                  class="px-2.5 py-1 text-[11px] font-mono rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  Details
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Book Detail Modal with deep-linking & keyboard navigation -->
  <BookDetailModal
    book={selectedBook}
    allBooks={filteredBooks}
    onClose={closeBook}
    onSelectBook={(next) => openBook(next)}
  />
</div>

