<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import {
    RefreshCw,
    BookOpen,
    Sparkles,
    ExternalLink,
    Check,
    AlertCircle,
    Eye,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Pin,
    PinOff,
    Save,
    Quote
  } from '@lucide/svelte';
  import type { BookItem } from '$lib/types';

  let { data } = $props();
  let libraryData = $derived(data.libraryData);
  let books = $derived(libraryData?.books || []);

  // Editable spotlight state initialized from loaded data
  let currentSpotlightIds = $state<string[]>([]);

  // Editable quotes for spotlight books
  let editableQuotes = $state<Record<string, string>>({});

  // Sync state when data reloads
  $effect(() => {
    if (libraryData?.onTopOfMyMind) {
      currentSpotlightIds = [...libraryData.onTopOfMyMind];
    }
    const initialQuotes: Record<string, string> = {};
    for (const b of libraryData?.books || []) {
      if (b.quoteSnippet) {
        initialQuotes[b.id] = b.quoteSnippet;
      }
    }
    editableQuotes = initialQuotes;
  });

  let selectedBookToAdd = $state('');
  let goodreadsInput = $state('');
  let isSyncing = $state(false);
  let isSavingSpotlight = $state(false);
  let syncFeedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);
  let saveFeedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

  $effect(() => {
    if (libraryData?.goodreadsUrl) {
      goodreadsInput = libraryData.goodreadsUrl;
    }
  });

  // Available books to add to spotlight (books not already in spotlight)
  let availableBooksToAdd = $derived(
    books.filter((b) => !currentSpotlightIds.includes(b.id) && !currentSpotlightIds.includes(b.bookId || ''))
  );

  function addSelectedToSpotlight() {
    if (!selectedBookToAdd) return;
    if (!currentSpotlightIds.includes(selectedBookToAdd)) {
      currentSpotlightIds = [...currentSpotlightIds, selectedBookToAdd];
    }
    selectedBookToAdd = '';
  }

  function toggleSpotlight(bookId: string) {
    if (currentSpotlightIds.includes(bookId)) {
      currentSpotlightIds = currentSpotlightIds.filter((id) => id !== bookId);
    } else {
      currentSpotlightIds = [...currentSpotlightIds, bookId];
    }
  }

  function removeFromSpotlight(bookId: string) {
    currentSpotlightIds = currentSpotlightIds.filter((id) => id !== bookId);
  }

  function moveSpotlight(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSpotlightIds.length) return;
    const updated = [...currentSpotlightIds];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    currentSpotlightIds = updated;
  }

  async function triggerSync() {
    isSyncing = true;
    syncFeedback = null;
    try {
      const res = await fetch('/api/studio/sync-goodreads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goodreadsUrl: goodreadsInput })
      });
      const result = await res.json();
      if (result.success) {
        syncFeedback = {
          type: 'success',
          message: `Goodreads shelf synced successfully! Total volumes: ${result.bookCount}.`,
        };
        await invalidateAll();
      } else {
        syncFeedback = {
          type: 'error',
          message: result.error || 'Failed to sync Goodreads shelf.',
        };
      }
    } catch (e: unknown) {
      syncFeedback = {
        type: 'error',
        message: e instanceof Error ? e.message : 'Network error during sync.',
      };
    } finally {
      isSyncing = false;
    }
  }
</script>

<svelte:head>
  <title>The Shelf & Library Curator | Studio</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto space-y-8 [scrollbar-width:thin]">
  <!-- Studio Header -->
  <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DED4] pb-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
        <Sparkles size={13} />
        <span>Curated Physicality</span>
      </div>
      <h1 class="text-3xl font-serif tracking-tight text-[#2C2B29]">
        The Shelf Library
      </h1>
      <p class="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl leading-relaxed">
        Manage and curate volumes, Goodreads RSS sync status, and directly add or remove books from the &ldquo;On top of my mind&rdquo; spotlight section.
      </p>
    </div>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      <div class="relative flex items-center min-w-[280px] sm:min-w-[320px]">
        <input
          type="url"
          bind:value={goodreadsInput}
          placeholder="https://www.goodreads.com/review/list/... or RSS"
          class="w-full text-xs font-mono bg-white border border-[#DDD9CE] rounded-lg px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 shadow-2xs"
        />
      </div>

      <div class="flex items-center gap-2">
        <a
          href="/library"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#DDD9CE] bg-white text-stone-700 hover:text-stone-900 transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Eye size={13} />
          <span>View Public Shelf</span>
        </a>

        <button
          onclick={triggerSync}
          disabled={isSyncing}
          class="px-4 py-2 text-xs font-medium rounded-lg bg-[#2C2B29] text-[#F4F2ED] hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCw size={13} class={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Update & Sync Shelf'}</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Feedback Banners -->
  {#if syncFeedback}
    <div
      class="p-4 rounded-lg flex items-center gap-3 text-xs font-mono {syncFeedback.type === 'success'
        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
        : 'bg-rose-50 text-rose-900 border border-rose-200'}"
    >
      {#if syncFeedback.type === 'success'}
        <Check size={15} class="text-emerald-700 shrink-0" />
      {:else}
        <AlertCircle size={15} class="text-rose-700 shrink-0" />
      {/if}
      <span class="flex-1">{syncFeedback.message}</span>
    </div>
  {/if}

  {#if saveFeedback}
    <div
      class="p-4 rounded-lg flex items-center gap-3 text-xs font-mono {saveFeedback.type === 'success'
        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
        : 'bg-rose-50 text-rose-900 border border-rose-200'}"
    >
      {#if saveFeedback.type === 'success'}
        <Check size={15} class="text-emerald-700 shrink-0" />
      {:else}
        <AlertCircle size={15} class="text-rose-700 shrink-0" />
      {/if}
      <span class="flex-1">{saveFeedback.message}</span>
    </div>
  {/if}

  <!-- Status Metric Cards -->
  <section class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4]">
      <div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">Total Volumes</div>
      <div class="text-2xl font-serif font-medium text-[#2C2B29] mt-1">{books.length}</div>
    </div>
    <div class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4]">
      <div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">Spotlight Titles</div>
      <div class="text-2xl font-serif font-medium text-[#2C2B29] mt-1">{currentSpotlightIds.length}</div>
    </div>
    <div class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4]">
      <div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">Last Synced</div>
      <div class="text-xs font-mono font-medium text-stone-800 mt-2.5">
        {libraryData?.lastSynced || 'Never'}
      </div>
    </div>
    <div class="p-4 rounded-lg bg-[#FCFBF9] border border-[#E2DED4]">
      <div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">Spotlight Grid</div>
      <div class="text-xs font-mono text-stone-700 mt-2.5">
        {currentSpotlightIds.length === 2 ? 'Optimal (2 Books)' : `${currentSpotlightIds.length} Active`}
      </div>
    </div>
  </section>

  <!-- "On top of my mind" Interactive Spotlight Editor -->
  <section class="space-y-4 bg-[#FCFBF9] border border-[#E2DED4] p-5 md:p-6 rounded-xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE6DE] pb-4">
      <div>
        <h2 class="text-sm font-mono uppercase tracking-wider text-[#2C2B29] flex items-center gap-2">
          <BookOpen size={14} class="text-amber-700" />
          <span>&ldquo;On top of my mind&rdquo; Spotlight Editor</span>
        </h2>
        <p class="text-xs text-stone-500 font-serif mt-0.5">
          Choose which books appear in the top hero spotlight and customize their pull-quotes.
        </p>
      </div>

      <!-- Save Form -->
      <form
        method="POST"
        action="?/updateSpotlight"
        use:enhance={() => {
          isSavingSpotlight = true;
          saveFeedback = null;
          return async ({ result }) => {
            isSavingSpotlight = false;
            if (result.type === 'success') {
              saveFeedback = { type: 'success', message: 'Spotlight changes saved successfully!' };
              await invalidateAll();
            } else {
              saveFeedback = { type: 'error', message: 'Failed to save spotlight changes.' };
            }
          };
        }}
      >
        <input type="hidden" name="spotlightIds" value={JSON.stringify(currentSpotlightIds)} />
        <input type="hidden" name="quoteUpdates" value={JSON.stringify(editableQuotes)} />
        <button
          type="submit"
          disabled={isSavingSpotlight}
          class="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <Save size={13} />
          <span>{isSavingSpotlight ? 'Saving...' : 'Save Spotlight Changes'}</span>
        </button>
      </form>
    </div>

    <!-- Quick Add Selector -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
      <div class="flex-1">
        <select
          aria-label="Select book to add to spotlight"
          bind:value={selectedBookToAdd}
          class="w-full px-3 py-2 text-xs font-sans bg-white border border-[#DDD9CE] rounded-lg text-[#2C2B29] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">-- Choose a book to add to spotlight --</option>
          {#each availableBooksToAdd as book}
            <option value={book.id}>
              {book.title} — {book.author}
            </option>
          {/each}
        </select>
      </div>
      <button
        type="button"
        onclick={addSelectedToSpotlight}
        disabled={!selectedBookToAdd}
        class="px-4 py-2 bg-[#2C2B29] hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
      >
        <Plus size={14} />
        <span>Add to Spotlight</span>
      </button>
    </div>

    <!-- Current Spotlight Cards -->
    {#if currentSpotlightIds.length === 0}
      <div class="p-6 text-center border border-dashed border-[#DDD9CE] rounded-lg text-xs font-serif text-stone-500">
        No books currently selected for the spotlight. Choose a book above to add one.
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {#each currentSpotlightIds as sId, index}
          {@const b = books.find((item) => item.id === sId || item.bookId === sId)}
          {#if b}
            <div class="p-4 rounded-lg bg-white border border-[#E2DED4] shadow-xs flex flex-col justify-between gap-3">
              <div class="flex gap-4 items-start">
                <div class="w-16 aspect-[2/3] shrink-0 rounded overflow-hidden shadow-sm border border-stone-200">
                  <img src={b.coverUrl} alt={b.title} class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 border border-amber-500/20">
                      Slot #{index + 1}
                    </span>
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        onclick={() => moveSpotlight(index, 'up')}
                        disabled={index === 0}
                        class="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                        aria-label="Move {b.title} up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onclick={() => moveSpotlight(index, 'down')}
                        disabled={index === currentSpotlightIds.length - 1}
                        class="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                        aria-label="Move {b.title} down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onclick={() => removeFromSpotlight(b.id)}
                        class="p-1 text-rose-600 hover:text-rose-800 cursor-pointer ml-1"
                        title="Remove from Spotlight"
                        aria-label="Remove {b.title} from spotlight"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h3 class="text-sm font-serif font-medium text-[#2C2B29] truncate">{b.title}</h3>
                  <p class="text-xs text-stone-500">{b.author}</p>
                </div>
              </div>

              <!-- Editable Quote Snippet -->
              <div class="space-y-1 pt-2 border-t border-stone-100">
                <label for="quote-{b.id}" class="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                  <Quote size={10} class="text-amber-700" />
                  <span>Highlight Pull-Quote Excerpt</span>
                </label>
                <textarea
                  id="quote-{b.id}"
                  rows="2"
                  placeholder="Enter a memorable quote or excerpt from this book..."
                  bind:value={editableQuotes[b.id]}
                  class="w-full p-2 text-xs font-serif bg-stone-50 border border-stone-200 rounded text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </section>

  <!-- Complete Books Table with Quick Pin / Unpin Action -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-xs font-mono uppercase tracking-widest text-stone-600">
        All Books Archive ({books.length})
      </h2>
      <span class="text-[11px] font-mono text-stone-400">Click &ldquo;Pin / Unpin&rdquo; to modify spotlight</span>
    </div>

    <div class="bg-[#FCFBF9] border border-[#E2DED4] rounded-lg overflow-x-auto">
      <table class="w-full text-left text-xs font-sans">
        <thead class="bg-[#EFECE6] border-b border-[#E2DED4] font-mono text-[10px] uppercase text-stone-600">
          <tr>
            <th class="py-2.5 px-4">Spine</th>
            <th class="py-2.5 px-4">Title</th>
            <th class="py-2.5 px-4">Author</th>
            <th class="py-2.5 px-4">Rating</th>
            <th class="py-2.5 px-4">Spotlight Status</th>
            <th class="py-2.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#EAE6DE]">
          {#each books as book}
            {@const isPinned = currentSpotlightIds.includes(book.id) || currentSpotlightIds.includes(book.bookId || '')}
            <tr class="hover:bg-[#F7F5F0] transition-colors {isPinned ? 'bg-amber-50/30' : ''}">
              <td class="py-2.5 px-4">
                <div class="h-10 flex items-end">
                  <div
                    class="h-9 w-6 rounded-xs shadow-xs border border-black/20"
                    style="background-color: {book.spineColor || '#3B3632'};"
                    title="{book.title} spine"
                  ></div>
                </div>
              </td>
              <td class="py-2.5 px-4 font-serif text-stone-900 font-medium">
                {book.title}
              </td>
              <td class="py-2.5 px-4 text-stone-600">
                {book.author}
              </td>
              <td class="py-2.5 px-4 font-mono text-amber-700">
                {'★'.repeat(book.rating || 5)}
              </td>
              <td class="py-2.5 px-4">
                {#if isPinned}
                  <span class="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/60 text-amber-900">
                    <Pin size={10} />
                    <span>In Spotlight</span>
                  </span>
                {:else}
                  <span class="text-[11px] font-mono text-stone-400">—</span>
                {/if}
              </td>
              <td class="py-2.5 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onclick={() => toggleSpotlight(book.id)}
                    class="px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer {isPinned
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-800'}"
                  >
                    {#if isPinned}
                      <span>Unpin</span>
                    {:else}
                      <span>+ Pin to Spotlight</span>
                    {/if}
                  </button>

                  <a
                    href={book.goodreadsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-1 text-stone-400 hover:text-stone-800"
                    title="View on Goodreads"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>
