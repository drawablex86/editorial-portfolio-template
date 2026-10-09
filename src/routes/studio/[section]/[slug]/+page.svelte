<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import {
    Save,
    Trash2,
    ArrowLeft,
    Check,
    AlertCircle,
    Eye,
    Code,
    Columns,
    Upload,
    ExternalLink,
    Plus,
    X,
    FileText,
    Settings,
    Maximize2,
    Quote,
    Layers,
    Sliders,
    BarChart3,
    BookOpen,
    Bookmark,
    Unlink,
    Globe
  } from '@lucide/svelte';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';

  let { data } = $props();

  // Working state
  let section = $derived(data.section);
  let slug = $derived(data.slug);
  let isNew = $derived(data.isNew);

  let targetSlug = $state(data.slug === 'new' ? '' : data.slug);
  let frontmatter = $state<Record<string, any>>(JSON.parse(JSON.stringify(data.data || {})));
  let bodyContent = $state(data.content || '');

  // UI state: split view is default
  let viewMode = $state<'split' | 'edit' | 'preview'>('split');
  let isSaving = $state(false);
  let saveSuccess = $state(page.url.searchParams.get('saved') === 'true');
  let errorMessage = $state<string | null>(null);
  let activeTab = $state<'content' | 'meta'>('content');

  let libraryBooks = $derived<any[]>(data.libraryBooks || []);
  let bookSearchQuery = $state('');

  // Find currently connected book
  let linkedBook = $derived(
    frontmatter.linkedBookId
      ? libraryBooks.find((b) => b.id === frontmatter.linkedBookId)
      : (slug !== 'new' ? libraryBooks.find((b) => b.notesSlug === slug) : null)
  );

  let filteredBooks = $derived(
    libraryBooks.filter((b) => {
      if (!bookSearchQuery) return true;
      const q = bookSearchQuery.toLowerCase();
      return (
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q))
      );
    })
  );

  function linkBook(bookId: string) {
    frontmatter.linkedBookId = bookId;
  }

  function unlinkBook() {
    frontmatter.linkedBookId = '';
  }

  // New gallery item input
  let newGalleryUrl = $state('');

  function addGalleryItem() {
    if (!newGalleryUrl.trim()) return;
    if (!Array.isArray(frontmatter.gallery)) {
      frontmatter.gallery = [];
    }
    frontmatter.gallery = [...frontmatter.gallery, newGalleryUrl.trim()];
    newGalleryUrl = '';
  }

  function removeGalleryItem(index: number) {
    if (Array.isArray(frontmatter.gallery)) {
      frontmatter.gallery = frontmatter.gallery.filter((_: any, i: number) => i !== index);
    }
  }

  // Handle image upload from computer directly into gallery, thumbnail, or markdown
  async function handleImageUpload(e: Event, target: 'thumbnail' | 'gallery' | 'markdown') {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/studio/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Upload failed');
        return;
      }

      const imgUrl = json.url;
      if (target === 'thumbnail') {
        frontmatter.thumbnailSrc = imgUrl;
      } else if (target === 'gallery') {
        if (!Array.isArray(frontmatter.gallery)) frontmatter.gallery = [];
        frontmatter.gallery = [...frontmatter.gallery, imgUrl];
      } else if (target === 'markdown') {
        bodyContent += `\n\n![${file.name}](${imgUrl})\n`;
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }

    input.value = '';
  }

  function insertDirective(type: 'figure' | 'duo' | 'note' | 'quote' | 'metrics') {
    let snippet = '';
    switch (type) {
      case 'figure':
        snippet = `\n\n:::figure[Figure 1.0 — Detailed design tokens & typographic hierarchy]\n![Specimen Image](${frontmatter.thumbnailSrc || '/images/inspiration_cosmology.webp'})\n:::\n\n`;
        break;
      case 'duo':
        snippet = `\n\n:::duo[Comparative study: legacy interface (left) versus calm ontological design (right)]\n![Left Specimen](${frontmatter.thumbnailSrc || '/images/inspiration_cosmology.webp'})\n![Right Specimen](${frontmatter.thumbnailSrc || '/images/inspiration_cosmology.webp'})\n:::\n\n`;
        break;
      case 'note':
        snippet = `\n\n:::note[Author's Sidenote]\nThis design decision emerged during the qualitative system benchmarking and latency evaluation sessions.\n:::\n\n`;
        break;
      case 'quote':
        snippet = `\n\n:::quote[John Berger — Selected Essays on Looking]\nThe way we see things is affected by what we know or what we believe.\n:::\n\n`;
        break;
      case 'metrics':
        snippet = `\n\n:::metrics\n42% : Reduction in cognitive friction\n3× : Faster onboarding velocity\n24k : Active monthly community\n:::\n\n`;
        break;
    }
    bodyContent += snippet;
  }

  // Keyboard shortcut ⌘S / Ctrl+S
  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      triggerSave();
    }
  }

  let formElement: HTMLFormElement;

  function triggerSave() {
    if (isSaving) return;
    if (formElement) {
      formElement.requestSubmit();
    }
  }

  // Composed payload serialized for gray-matter save
  let serializedPayload = $derived(
    JSON.stringify({
      frontmatter,
      body: bodyContent,
    })
  );

  // Live URL link for previews
  let publicUrl = $derived(
    section === 'work' ? `/work/${slug}` :
    section === 'play' ? `/play/${slug}` :
    section === 'blog' ? `/blog/${slug}` :
    section === 'pages' ? `/${slug === 'about' ? 'about' : slug === 'now' ? 'now' : ''}` : '/'
  );
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>{isNew ? 'New Document' : frontmatter.title || slug} | Studio</title>
</svelte:head>

<div class="h-full w-full flex flex-col bg-[#F4F2ED] text-[#2C2B29] overflow-hidden select-none">
  <!-- Top Editor App Bar -->
  <header class="h-13 border-b border-[#E2DED4] bg-[#EAE6DE] px-4 flex items-center justify-between shrink-0 z-20">
    <div class="flex items-center gap-3 min-w-0">
      <a
        href="/studio"
        class="p-1.5 rounded hover:bg-[#DDD9CE] text-stone-600 hover:text-stone-900 transition-colors"
        title="Back to Studio dashboard"
      >
        <ArrowLeft size={16} />
      </a>

      <div class="flex items-center gap-2 min-w-0">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DDD9CE] text-stone-700 uppercase tracking-wider">
          {section}
        </span>
        {#if isNew}
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-stone-400 font-mono">/</span>
            <input
              type="text"
              placeholder="document-slug (e.g. new-project)"
              bind:value={targetSlug}
              class="bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500 w-56"
            />
          </div>
        {:else}
          <span class="text-xs font-mono font-medium text-stone-800 truncate">{slug}.md</span>
        {/if}
      </div>
    </div>

    <!-- Center View Mode Toggles -->
    <div class="hidden md:flex items-center bg-[#DDD9CE] p-0.5 rounded gap-0.5">
      <button
        type="button"
        onclick={() => (viewMode = 'edit')}
        class="p-1 px-3 rounded text-xs flex items-center gap-1.5 transition-colors {viewMode === 'edit'
          ? 'bg-white text-stone-900 font-medium shadow-2xs'
          : 'text-stone-600 hover:text-stone-900'}"
      >
        <Code size={13} />
        <span>Editor Only</span>
      </button>
      <button
        type="button"
        onclick={() => (viewMode = 'split')}
        class="p-1 px-3 rounded text-xs flex items-center gap-1.5 transition-colors {viewMode === 'split'
          ? 'bg-white text-stone-900 font-medium shadow-2xs'
          : 'text-stone-600 hover:text-stone-900'}"
      >
        <Columns size={13} />
        <span>Split Canvas</span>
      </button>
      <button
        type="button"
        onclick={() => (viewMode = 'preview')}
        class="p-1 px-3 rounded text-xs flex items-center gap-1.5 transition-colors {viewMode === 'preview'
          ? 'bg-white text-stone-900 font-medium shadow-2xs'
          : 'text-stone-600 hover:text-stone-900'}"
      >
        <Eye size={13} />
        <span>Preview Only</span>
      </button>
    </div>

    <!-- Right Controls: Save, Delete, Live Site Preview -->
    <div class="flex items-center gap-2">
      {#if !isNew}
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="hidden sm:flex items-center gap-1 text-xs font-mono text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded hover:bg-[#DDD9CE] transition-colors"
          title="Open public page"
        >
          <span>View Live</span>
          <ExternalLink size={12} />
        </a>
      {/if}

      <!-- Delete Form -->
      {#if !isNew}
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            if (!confirm(`Are you sure you want to delete ${slug}.md? This cannot be undone.`)) {
              return () => {};
            }
            return async ({ update }) => {
              await update();
            };
          }}
        >
          <button
            type="submit"
            class="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete document"
          >
            <Trash2 size={15} />
          </button>
        </form>
      {/if}

      <!-- Save Form -->
      <form
        bind:this={formElement}
        method="POST"
        action="?/save"
        use:enhance={() => {
          isSaving = true;
          errorMessage = null;
          saveSuccess = false;
          return async ({ result, update }) => {
            isSaving = false;
            if (result.type === 'failure') {
              errorMessage = (result.data as any)?.message || 'Failed to save';
            } else if (result.type === 'success') {
              saveSuccess = true;
              setTimeout(() => {
                saveSuccess = false;
              }, 3000);
            }
            await update();
          };
        }}
      >
        <input type="hidden" name="payload" value={serializedPayload} />
        <input type="hidden" name="targetSlug" value={targetSlug} />

        <button
          type="submit"
          disabled={isSaving}
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
        >
          {#if isSaving}
            <span class="animate-spin text-[#F4F2ED] font-bold">⟳</span>
            <span>Saving...</span>
          {:else if saveSuccess}
            <Check size={14} class="text-green-300" />
            <span>Saved!</span>
          {:else}
            <Save size={14} />
            <span>Save (⌘S)</span>
          {/if}
        </button>
      </form>
    </div>
  </header>

  <!-- Error Banner -->
  {#if errorMessage}
    <div class="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2 text-xs flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertCircle size={14} class="text-red-600" />
        <span>{errorMessage}</span>
      </div>
      <button type="button" onclick={() => (errorMessage = null)} class="text-red-500 hover:text-red-800">
        <X size={13} />
      </button>
    </div>
  {/if}

  <!-- Editor Workspace Panels -->
  <div class="flex-1 flex min-h-0 overflow-hidden">
    <!-- LEFT PANEL: Writing & Metadata Editor -->
    {#if viewMode !== 'preview'}
      <div class="{viewMode === 'split' ? 'w-full md:w-1/2 border-r border-[#E2DED4]' : 'w-full'} flex flex-col bg-[#FAF9F6] overflow-hidden">
        <!-- Subtabs: Markdown Editor vs Metadata Form -->
        <div class="flex items-center border-b border-[#E2DED4] bg-[#EFECE6] px-4 shrink-0 text-xs font-mono">
          <button
            type="button"
            onclick={() => (activeTab = 'content')}
            class="py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 {activeTab === 'content'
              ? 'border-[#2C2B29] text-[#2C2B29] font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'}"
          >
            <FileText size={13} />
            <span>Markdown Content</span>
          </button>
          <button
            type="button"
            onclick={() => (activeTab = 'meta')}
            class="py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 {activeTab === 'meta'
              ? 'border-[#2C2B29] text-[#2C2B29] font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'}"
          >
            <Settings size={13} />
            <span>Frontmatter &amp; Metadata</span>
          </button>

          <!-- Insert image shortcut -->
          <div class="ml-auto flex items-center gap-2">
            <label class="text-[11px] text-stone-600 hover:text-stone-900 cursor-pointer flex items-center gap-1 font-mono">
              <Upload size={12} />
              <span>Insert Image</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                onchange={(e) => handleImageUpload(e, 'markdown')}
              />
            </label>
          </div>
        </div>

        <!-- Tab 1: Markdown Body Area -->
        {#if activeTab === 'content'}
          <!-- Storytelling Directives Toolbar -->
          <div class="px-4 py-2 bg-[#F4F1EA] border-b border-[#E2DED4] flex flex-wrap items-center gap-1.5 text-xs font-mono shrink-0">
            <span class="text-[10px] uppercase tracking-wider text-stone-500 mr-1">Story Blocks:</span>
            
            <button
              type="button"
              onclick={() => insertDirective('figure')}
              class="px-2 py-1 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#DDD9CE] shadow-2xs flex items-center gap-1 transition-colors"
              title="Insert figure with semantic caption and lightbox"
            >
              <FileText size={11} class="text-amber-700" />
              <span>+ Figure &amp; Caption</span>
            </button>

            <button
              type="button"
              onclick={() => insertDirective('duo')}
              class="px-2 py-1 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#DDD9CE] shadow-2xs flex items-center gap-1 transition-colors"
              title="Insert 2-column comparative image duo"
            >
              <Layers size={11} class="text-amber-700" />
              <span>+ Image Duo</span>
            </button>

            <button
              type="button"
              onclick={() => insertDirective('note')}
              class="px-2 py-1 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#DDD9CE] shadow-2xs flex items-center gap-1 transition-colors"
              title="Insert marginalia / sidenote callout"
            >
              <Sliders size={11} class="text-amber-700" />
              <span>+ Sidenote</span>
            </button>

            <button
              type="button"
              onclick={() => insertDirective('quote')}
              class="px-2 py-1 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#DDD9CE] shadow-2xs flex items-center gap-1 transition-colors"
              title="Insert pull quote with attribution"
            >
              <Quote size={11} class="text-amber-700" />
              <span>+ Pull Quote</span>
            </button>

            <button
              type="button"
              onclick={() => insertDirective('metrics')}
              class="px-2 py-1 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#DDD9CE] shadow-2xs flex items-center gap-1 transition-colors"
              title="Insert quantifiable outcomes & metrics stat grid"
            >
              <BarChart3 size={11} class="text-amber-700" />
              <span>+ Metrics Grid</span>
            </button>
          </div>

          <div class="flex-1 flex flex-col p-6 overflow-hidden bg-[#FAF9F6]">
            <textarea
              bind:value={bodyContent}
              placeholder="Write your markdown story or article content here..."
              class="w-full flex-1 bg-transparent text-[#2C2B29] font-mono text-sm leading-relaxed resize-none focus:outline-none selection:bg-stone-300 [scrollbar-width:thin]"
            ></textarea>
          </div>
        {/if}

        <!-- Tab 2: Frontmatter Fields Form -->
        {#if activeTab === 'meta'}
          <div class="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin] bg-[#FAF9F6]">
            <!-- Core Common Fields -->
            <div class="space-y-4">
              <h3 class="text-xs font-mono uppercase tracking-wider text-stone-600 border-b border-[#E2DED4] pb-1.5">
                Core Information
              </h3>

              <div class="space-y-1">
                <label class="text-xs font-mono text-stone-600 block">Title</label>
                <input
                  type="text"
                  bind:value={frontmatter.title}
                  placeholder="Document Title"
                  class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs font-mono text-stone-600 block">Year / Date</label>
                  <input
                    type="text"
                    bind:value={frontmatter.year}
                    class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-mono text-stone-600 block">Tags / Categories</label>
                  <input
                    type="text"
                    bind:value={frontmatter.tags}
                    placeholder="e.g. brand identity / systems design"
                    class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-mono text-stone-600 block">Summary / Description</label>
                <textarea
                  bind:value={frontmatter.description}
                  rows={2}
                  placeholder="Brief synopsis of this piece..."
                  class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 resize-none font-sans"
                ></textarea>
              </div>

              <!-- SEO & Discovery Overrides (Page / Article Level) -->
              <div class="space-y-3 pt-3 border-t border-[#E2DED4]">
                <h4 class="text-[11px] font-mono uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <Globe size={12} class="text-amber-700" />
                  <span>Search Engine &amp; Social Overrides</span>
                </h4>

                <div class="space-y-1">
                  <label class="text-[11px] font-mono text-stone-600 block">Custom SEO Title (defaults to title)</label>
                  <input
                    type="text"
                    bind:value={frontmatter.seoTitle}
                    placeholder="e.g. {frontmatter.title || 'Custom Title'}"
                    class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-sans"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-mono text-stone-600 block">SEO Meta Description</label>
                  <textarea
                    bind:value={frontmatter.seoDescription}
                    rows={2}
                    placeholder="Excerpt tailored for search results and Twitter cards..."
                    class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 resize-none font-sans"
                  ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-1">
                  <div class="space-y-1">
                    <label class="text-[11px] font-mono text-stone-600 block">Custom OG Share Image</label>
                    <input
                      type="text"
                      bind:value={frontmatter.ogImage}
                      placeholder="/images/og-share.webp"
                      class="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
                    />
                  </div>

                  <div class="flex items-center pt-5">
                    <label class="flex items-center gap-2 cursor-pointer text-xs font-mono text-stone-700">
                      <input
                        type="checkbox"
                        bind:checked={frontmatter.noIndex}
                        class="w-3.5 h-3.5 text-red-600 rounded border-stone-300 accent-red-700 cursor-pointer"
                      />
                      <span>Hide from Search Engines (noindex)</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Featured Project Toggle (for projects) -->
              {#if section === 'projects'}
                <div class="pt-1">
                  <label class="flex items-center justify-between p-3 rounded-lg border border-[#DDD9CE] bg-white cursor-pointer hover:border-stone-400 transition-colors">
                    <div class="space-y-0.5">
                      <div class="flex items-center gap-1.5">
                        <span class="text-amber-600 text-sm">★</span>
                        <span class="text-xs font-mono font-medium text-stone-900">Featured On Homepage</span>
                      </div>
                      <p class="text-[11px] font-serif text-stone-500">
                        Highlight this project in the curated homepage section.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      bind:checked={frontmatter.featured}
                      class="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600 cursor-pointer accent-stone-800"
                    />
                  </label>
                </div>
              {/if}
            </div>

            <!-- Connected Library Book Card (for blog & projects) -->
            {#if section === 'blog' || section === 'projects'}
              <div class="space-y-3 pt-2">
                <div class="flex items-center justify-between border-b border-[#E2DED4] pb-1.5">
                  <h3 class="text-xs font-mono uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Bookmark size={13} class="text-amber-700" />
                    <span>Connected Library Book</span>
                  </h3>
                  {#if linkedBook}
                    <span class="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Linked
                    </span>
                  {/if}
                </div>

                <p class="text-[11px] font-serif text-stone-600">
                  Link this entry to a volume on your GoodReads bookshelf so readers can jump straight from the 3D book modal into this essay.
                </p>

                {#if linkedBook}
                  <!-- Linked Book Preview Card -->
                  <div class="p-3 bg-white border border-[#DDD9CE] rounded-lg shadow-2xs flex items-start gap-3 justify-between">
                    <div class="flex items-center gap-3 min-w-0">
                      {#if linkedBook.coverUrl}
                        <img
                          src={linkedBook.coverUrl}
                          alt={linkedBook.title}
                          class="w-10 h-14 object-cover rounded shrink-0 border border-stone-200 shadow-2xs"
                        />
                      {/if}
                      <div class="min-w-0">
                        <div class="text-xs font-semibold text-stone-900 truncate">
                          {linkedBook.title}
                        </div>
                        <div class="text-[11px] text-stone-600 truncate">
                          by {linkedBook.author}
                        </div>
                        <div class="text-[10px] font-mono text-stone-600 mt-0.5">
                          ID: {linkedBook.id}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onclick={unlinkBook}
                      class="px-2.5 py-1 text-xs font-mono text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors flex items-center gap-1 shrink-0"
                      title="Detach book from this essay"
                    >
                      <Unlink size={12} />
                      <span>Unlink</span>
                    </button>
                  </div>
                {:else}
                  <!-- Book Search and Select Dropdown -->
                  <div class="space-y-2 bg-white p-3 border border-[#DDD9CE] rounded-lg">
                    <div class="space-y-1">
                      <label class="text-[11px] font-mono text-stone-600 block">Search Library Books</label>
                      <input
                        type="text"
                        placeholder="Search by book title or author..."
                        bind:value={bookSearchQuery}
                        class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-sans"
                      />
                    </div>

                    <div class="max-h-48 overflow-y-auto space-y-1 [scrollbar-width:thin] border border-stone-100 rounded p-1">
                      {#if filteredBooks.length === 0}
                        <div class="text-[11px] font-mono text-stone-600 p-2 text-center">
                          No matching books found
                        </div>
                      {:else}
                        {#each filteredBooks as book}
                          <button
                            type="button"
                            onclick={() => linkBook(book.id)}
                            class="w-full text-left p-1.5 hover:bg-[#F4F2ED] rounded flex items-center gap-2.5 transition-colors group cursor-pointer"
                          >
                            {#if book.coverUrl}
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                class="w-6 h-8 object-cover rounded shrink-0 border border-stone-200"
                              />
                            {:else}
                              <div class="w-6 h-8 bg-stone-200 rounded shrink-0 flex items-center justify-center text-[9px] font-mono text-stone-500">
                                📖
                              </div>
                            {/if}
                            <div class="flex-1 min-w-0">
                              <div class="text-xs font-medium text-stone-800 group-hover:text-amber-900 truncate">
                                {book.title}
                              </div>
                              <div class="text-[10px] text-stone-600 truncate">
                                {book.author}
                              </div>
                            </div>
                            <span class="text-[10px] font-mono text-stone-600 group-hover:text-stone-800 shrink-0">
                              Link →
                            </span>
                          </button>
                        {/each}
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Project Type & Metadata (for projects and legacy work) -->
            {#if section === 'projects' || section === 'work'}
              <div class="space-y-4 pt-2">
                <h3 class="text-xs font-mono uppercase tracking-wider text-stone-600 border-b border-[#E2DED4] pb-1.5">
                  Project Character &amp; Taxonomy
                </h3>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-xs font-mono text-stone-600 block">Project Type</label>
                    <select
                      bind:value={frontmatter.projectType}
                      onchange={() => {
                        // Keep archetype synced with projectType for presentation layout defaults
                        if (frontmatter.projectType === 'design') frontmatter.archetype = 'case_study';
                        else if (frontmatter.projectType === 'product_design') frontmatter.archetype = 'product_design';
                        else if (frontmatter.projectType === 'photography') frontmatter.archetype = 'photo_album';
                        else if (frontmatter.projectType === 'illustration') frontmatter.archetype = 'illustration';
                        else if (frontmatter.projectType === 'sketchbook') frontmatter.archetype = 'illustration';
                        else if (frontmatter.projectType === 'writing') frontmatter.archetype = 'case_study';
                        else if (frontmatter.projectType === 'experiment') frontmatter.archetype = 'product_design';
                      }}
                      class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-medium"
                    >
                      <option value="design">Design (Brand Identity, Systems, Campaigns, Art Direction)</option>
                      <option value="product_design">Product Design (Digital Tools, UI/UX Architecture)</option>
                      <option value="photography">Photography (Documentary, Photo Albums, EXIF)</option>
                      <option value="illustration">Illustration (Fine Art, Studies, Digital Painting)</option>
                      <option value="sketchbook">Sketchbook (Series &amp; Observational Studies)</option>
                      <option value="writing">Writing (Essays &amp; Theory)</option>
                      <option value="experiment">Experiment (Interactive Mechanics &amp; Prototypes)</option>
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-mono text-stone-600 block">Presentation Layout</label>
                    <select
                      bind:value={frontmatter.archetype}
                      class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                    >
                      <option value="case_study">Case Study (Editorial, Client, Deliverables)</option>
                      <option value="product_design">Product Design (Live Prototype, Tech Stack)</option>
                      <option value="photo_album">Photo Album (EXIF metadata, Lightbox)</option>
                      <option value="illustration">Fine Art / Specimen (Medium, Dimensions, Zoom)</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-xs font-mono text-stone-600 block">Client / Organization / Context</label>
                    <input
                      type="text"
                      bind:value={frontmatter.client}
                      placeholder="e.g. H&R Block or Self-initiated"
                      class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-mono text-stone-600 block">Role / Practice</label>
                    <input
                      type="text"
                      bind:value={frontmatter.role}
                      placeholder="e.g. Lead Designer / Artist"
                      class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                </div>

                <!-- Product design / Experiment links -->
                {#if frontmatter.projectType === 'product_design' || frontmatter.archetype === 'product_design' || frontmatter.projectType === 'experiment'}
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Live Application URL</label>
                      <input
                        type="text"
                        bind:value={frontmatter.liveUrl}
                        placeholder="https://..."
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Prototype / Repository URL</label>
                      <input
                        type="text"
                        bind:value={frontmatter.prototypeUrl}
                        placeholder="https://..."
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                  </div>
                {/if}

                <!-- Photography camera / lens metadata -->
                {#if frontmatter.projectType === 'photography' || frontmatter.archetype === 'photo_album'}
                  <div class="grid grid-cols-3 gap-3">
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Camera</label>
                      <input
                        type="text"
                        bind:value={frontmatter.camera}
                        placeholder="e.g. Leica Q2"
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Lens</label>
                      <input
                        type="text"
                        bind:value={frontmatter.lens}
                        placeholder="e.g. 28mm f/1.7"
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Location</label>
                      <input
                        type="text"
                        bind:value={frontmatter.location}
                        placeholder="e.g. City, Country"
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                  </div>
                {/if}

                <!-- Illustration / Fine Art medium & dimensions -->
                {#if frontmatter.projectType === 'illustration' || frontmatter.archetype === 'illustration'}
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Medium / Materials</label>
                      <input
                        type="text"
                        bind:value={frontmatter.medium}
                        placeholder="e.g. Oil and cold wax on linen"
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-xs font-mono text-stone-600 block">Dimensions</label>
                      <input
                        type="text"
                        bind:value={frontmatter.dimensions}
                        placeholder="e.g. 48 × 36 inches"
                        class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Thumbnail & Visual Media -->
            <div class="space-y-4 pt-2">
              <h3 class="text-xs font-mono uppercase tracking-wider text-stone-600 border-b border-[#E2DED4] pb-1.5">
                Thumbnail &amp; Media Assets
              </h3>

              <div class="space-y-2">
                <label class="text-xs font-mono text-stone-600 block">Thumbnail Image Path or URL</label>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    bind:value={frontmatter.thumbnailSrc}
                    placeholder="/images/example.webp or https://..."
                    class="flex-1 bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
                  />
                  <label class="px-3 py-1.5 rounded bg-[#EFECE6] hover:bg-[#EAE6DE] text-stone-800 text-xs font-mono cursor-pointer transition-colors border border-[#DDD9CE]">
                    <Upload size={12} class="inline mr-1" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      onchange={(e) => handleImageUpload(e, 'thumbnail')}
                    />
                  </label>
                </div>

                {#if frontmatter.thumbnailSrc}
                  <div class="mt-2 w-40 aspect-video rounded overflow-hidden border border-[#E2DED4] bg-stone-100 shadow-2xs">
                    <img src={frontmatter.thumbnailSrc} alt="Thumbnail preview" class="w-full h-full object-cover" />
                  </div>
                {/if}
              </div>

              <!-- Gallery Array (if applicable) -->
              {#if section === 'work' || section === 'play'}
                <div class="space-y-2 pt-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-mono text-stone-600 block">Project Gallery Images</label>
                    <label class="text-[11px] font-mono text-stone-700 hover:underline cursor-pointer">
                      <Upload size={11} class="inline mr-0.5" />
                      <span>Upload &amp; Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onchange={(e) => handleImageUpload(e, 'gallery')}
                      />
                    </label>
                  </div>

                  <!-- Gallery URLs List -->
                  <div class="space-y-2">
                    {#if Array.isArray(frontmatter.gallery)}
                      {#each frontmatter.gallery as item, index}
                        <div class="flex items-center gap-2">
                          <input
                            type="text"
                            bind:value={frontmatter.gallery[index]}
                            class="flex-1 bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
                          />
                          <button
                            type="button"
                            onclick={() => removeGalleryItem(index)}
                            class="p-1 text-stone-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      {/each}
                    {/if}

                    <div class="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add image URL or path..."
                        bind:value={newGalleryUrl}
                        onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryItem())}
                        class="flex-1 bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-xs text-stone-500 font-mono focus:outline-none focus:border-stone-500"
                      />
                      <button
                        type="button"
                        onclick={addGalleryItem}
                        class="px-3 py-1 rounded bg-[#EFECE6] hover:bg-[#EAE6DE] text-stone-700 text-xs font-mono border border-[#DDD9CE] transition-colors"
                      >
                        <Plus size={12} class="inline mr-1" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- RIGHT PANEL: Live Editorial Preview -->
    {#if viewMode !== 'edit'}
      <div class="{viewMode === 'split' ? 'w-full md:w-1/2' : 'w-full'} flex flex-col bg-[#F4F2ED] text-[#2C2B29] overflow-hidden">
        <!-- Preview Header Bar -->
        <div class="h-10 border-b border-[#E8E6DF] bg-[#ECE9E2] px-4 flex items-center justify-between shrink-0 text-xs font-mono text-stone-600">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Live Editorial Canvas</span>
          </div>
          <span class="text-[11px] text-stone-500">Matches Public Site Typography</span>
        </div>

        <!-- Preview Canvas -->
        <div class="flex-1 overflow-y-auto p-8 md:p-14 [scrollbar-width:thin]">
          <div class="max-w-2xl mx-auto space-y-6">
            <!-- Simulated Header -->
            <div class="border-b border-[#E8E6DF] pb-6 space-y-2">
              {#if frontmatter.tags}
                <div class="text-xs font-mono tracking-widest uppercase text-stone-500">
                  {frontmatter.tags}
                </div>
              {/if}
              <h1 class="text-3xl sm:text-4xl font-serif text-[#2C2B29] tracking-tight">
                {frontmatter.title || 'Untitled Document'}
              </h1>
              {#if frontmatter.year}
                <div class="text-xs font-mono text-stone-500 pt-1">
                  {frontmatter.year}
                </div>
              {/if}
              {#if frontmatter.description}
                <p class="text-sm font-serif text-stone-600 italic pt-2 leading-relaxed">
                  {frontmatter.description}
                </p>
              {/if}
            </div>

            <!-- Simulated Thumbnail -->
            {#if frontmatter.thumbnailSrc}
              <div class="w-full aspect-[16/9] rounded-sm overflow-hidden bg-stone-200 shadow-sm">
                <img
                  src={frontmatter.thumbnailSrc}
                  alt={frontmatter.title || 'Cover'}
                  class="w-full h-full object-cover"
                />
              </div>
            {/if}

            <!-- Rendered Markdown Body -->
            <div class="pt-4">
              <MarkdownRenderer content={bodyContent} className="editorial-prose" />
            </div>

            <!-- Rendered Gallery items if any -->
            {#if Array.isArray(frontmatter.gallery) && frontmatter.gallery.length > 0}
              <div class="pt-8 border-t border-[#E8E6DF] space-y-4">
                <div class="text-xs font-mono uppercase tracking-wider text-stone-500">
                  Gallery ({frontmatter.gallery.length} items)
                </div>
                <div class="grid grid-cols-2 gap-4">
                  {#each frontmatter.gallery as imgUrl}
                    <div class="aspect-[4/3] rounded bg-stone-200 overflow-hidden shadow-2xs">
                      <img src={imgUrl} alt="Gallery item" class="w-full h-full object-cover" />
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
