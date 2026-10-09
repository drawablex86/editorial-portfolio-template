<script lang="ts">
  import { enhance } from '$app/forms';
  import {
    BookOpen,
    Upload,
    Sparkles,
    Shield,
    Layers,
    Save,
    ExternalLink,
    Check,
    AlertCircle,
    Printer,
    FileImage,
    Trash2
  } from '@lucide/svelte';

  let { data, form } = $props();
  let zines = $derived(data.zines || []);
  let selectedZine = $state<any>(zines[0] || null);

  let isUploading = $state(false);
  let showDeleteConfirm = $state(false);
  let importTab = $state<'pdf' | 'images'>('pdf');
  let importSlug = $state('');
  let importTitle = $state('');
  let importPrintSpecs = $state('Risograph · 2-Color · 80gsm');

  // Auto-slugify
  function handleTitleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    importTitle = val;
    importSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
</script>

<div class="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DED4] pb-6">
    <div>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
        <span class="text-xs font-mono uppercase tracking-widest text-stone-500">Publication Management</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-serif font-light text-[#2C2B29] mt-1">
        Zine Stand & Flip-Books
      </h1>
      <p class="text-sm text-stone-600 font-sans mt-0.5">
        Manage tactile flip-books, run multi-spread image ingest, and stage raw masters to the storage vault.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <a
        href="/zines"
        target="_blank"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-[#DDD9CE] text-xs font-mono text-stone-700 hover:text-stone-900 shadow-xs"
      >
        <span>View Live Stand</span>
        <ExternalLink size={13} />
      </a>
    </div>
  </div>

  <!-- Status Notification -->
  {#if form?.success}
    <div class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono rounded-lg flex items-center gap-2">
      <Check size={14} class="text-emerald-700" />
      <span>{form.message || 'Action executed successfully.'}</span>
    </div>
  {:else if form?.error}
    <div class="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono rounded-lg flex items-center gap-2">
      <AlertCircle size={14} class="text-rose-700" />
      <span>{form.error}</span>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Left Column: Zine List & Import Card -->
    <div class="lg:col-span-5 space-y-6">
      <!-- Published Publications Selector -->
      <div class="bg-white rounded-xl border border-[#E2DED4] p-5 shadow-xs">
        <h2 class="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-between">
          <span>Active Publications</span>
          <span class="bg-stone-100 px-2 py-0.5 rounded text-[10px]">{zines.length}</span>
        </h2>

        <div class="space-y-2">
          {#each zines as zine}
            <button
              type="button"
              onclick={() => (selectedZine = zine)}
              class="w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 {selectedZine?.id === zine.id
                ? 'border-stone-800 bg-[#F7F5F0] ring-1 ring-stone-800'
                : 'border-[#EAE6DE] hover:bg-stone-50'}"
            >
              <div class="w-12 h-14 bg-stone-200 rounded overflow-hidden shrink-0 border border-stone-300">
                <img src={zine.coverSrc} alt={zine.title} class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-serif font-medium text-stone-900 truncate">{zine.title}</h3>
                <p class="text-xs text-stone-500 font-mono">{zine.pageCount} pages · {zine.year || '2026'}</p>
                <div class="flex items-center gap-2 mt-1">
                  {#if zine.aiProtected}
                    <span class="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <Shield size={10} />
                      AI Protected
                    </span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Ingest New Zine: Multi-File Batch Selection or PDF -->
      <div class="bg-white rounded-xl border border-[#E2DED4] p-5 shadow-xs">
        <div class="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
          <h2 class="text-xs font-mono uppercase tracking-wider text-stone-700 flex items-center gap-1.5 font-semibold">
            <Upload size={13} />
            <span>One-Click Ingest</span>
          </h2>
          <!-- Segmented Tab Switcher -->
          <div class="flex bg-stone-100 p-0.5 rounded text-[11px] font-mono">
            <button
              type="button"
              onclick={() => (importTab = 'pdf')}
              class="px-2.5 py-1 rounded transition-colors {importTab === 'pdf' ? 'bg-white shadow-2xs font-semibold text-stone-900' : 'text-stone-500 hover:text-stone-800'}"
            >
              PDF Document
            </button>
            <button
              type="button"
              onclick={() => (importTab = 'images')}
              class="px-2.5 py-1 rounded transition-colors {importTab === 'images' ? 'bg-white shadow-2xs font-semibold text-stone-900' : 'text-stone-500 hover:text-stone-800'}"
            >
              Batch Images
            </button>
          </div>
        </div>

        {#if importTab === 'pdf'}
          <p class="text-xs text-stone-500 mb-4">
            Upload a local PDF file. Automatically stripped into 2x Retina WebP spreads on your Mac, measures physical aspect ratio, stages to storage vault, and tags for SEO. Zero client work.
          </p>

          <form
            method="POST"
            action="?/importPdf"
            enctype="multipart/form-data"
            use:enhance={() => {
              isUploading = true;
              return async ({ update }) => {
                isUploading = false;
                await update();
              };
            }}
            class="space-y-3"
          >
            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-pdf-title">Publication Title</label>
              <input
                id="import-pdf-title"
                name="title"
                type="text"
                required
                placeholder="e.g. Kyoto Shadows Zine"
                bind:value={importTitle}
                oninput={handleTitleInput}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-pdf-slug">URL Slug</label>
              <input
                id="import-pdf-slug"
                name="slug"
                type="text"
                required
                placeholder="kyoto-shadows-zine"
                bind:value={importSlug}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-pdf-specs">Print Specifications</label>
              <input
                id="import-pdf-specs"
                name="printSpecs"
                type="text"
                placeholder="Risograph · 2-Color · Fedrigoni 90gsm"
                bind:value={importPrintSpecs}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-pdf-file">
                Select Master PDF (.pdf)
              </label>
              <input
                id="import-pdf-file"
                name="pdf"
                type="file"
                accept=".pdf,application/pdf"
                required
                class="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-stone-300 file:text-xs file:font-mono file:bg-stone-100 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              class="w-full py-2 px-3 rounded bg-[#2C2B29] text-white text-xs font-mono hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {#if isUploading}
                <div class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Stripping PDF & Optimizing Spreads...</span>
              {:else}
                <Upload size={13} />
                <span>Strip PDF & Archive to Vault</span>
              {/if}
            </button>
          </form>
        {:else}
          <p class="text-xs text-stone-500 mb-4">
            Select multiple spread files. Automatically optimizes to high-DPI WebP, generates semantic SEO alt tags, and stages to storage vault.
          </p>

          <form
            method="POST"
            action="?/importImages"
            enctype="multipart/form-data"
            use:enhance={() => {
              isUploading = true;
              return async ({ update }) => {
                isUploading = false;
                await update();
              };
            }}
            class="space-y-3"
          >
            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-title">Publication Title</label>
              <input
                id="import-title"
                name="title"
                type="text"
                required
                placeholder="e.g. Kyoto Shadows Zine"
                bind:value={importTitle}
                oninput={handleTitleInput}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-slug">URL Slug</label>
              <input
                id="import-slug"
                name="slug"
                type="text"
                required
                placeholder="kyoto-shadows-zine"
                bind:value={importSlug}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-specs">Print Specifications</label>
              <input
                id="import-specs"
                name="printSpecs"
                type="text"
                placeholder="Risograph · 2-Color · Fedrigoni 90gsm"
                bind:value={importPrintSpecs}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="import-files">
                Upload Spreads (Select Multiple Images)
              </label>
              <input
                id="import-files"
                name="images"
                type="file"
                multiple
                accept="image/*"
                required
                class="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-stone-300 file:text-xs file:font-mono file:bg-stone-100 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              class="w-full py-2 px-3 rounded bg-[#2C2B29] text-white text-xs font-mono hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {#if isUploading}
                <div class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Processing Ingest Pipeline...</span>
              {:else}
                <Upload size={13} />
                <span>Run Pipeline & Publish Zine</span>
              {/if}
            </button>
          </form>
        {/if}
      </div>
    </div>

    <!-- Right Column: Metadata & Spreads Inspector -->
    <div class="lg:col-span-7">
      {#if selectedZine}
        <div class="bg-white rounded-xl border border-[#E2DED4] p-6 shadow-xs space-y-6">
          <div class="flex items-center justify-between border-b border-[#EAE6DE] pb-4">
            <div>
              <h2 class="text-xl font-serif font-medium text-stone-900">{selectedZine.title}</h2>
              <p class="text-xs font-mono text-stone-500">ID: {selectedZine.id} · {selectedZine.pageCount} Spreads</p>
            </div>
            <a
              href="/zines/{selectedZine.id}"
              target="_blank"
              class="inline-flex items-center gap-1 text-xs font-mono text-stone-700 hover:text-black py-1 px-2.5 rounded bg-stone-100 border border-stone-200"
            >
              <span>Preview Flip-Book</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <!-- Metadata Form -->
          <form method="POST" action="?/saveMetadata" use:enhance class="space-y-4">
            <input type="hidden" name="id" value={selectedZine.id} />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-title">Title</label>
                <input
                  id="meta-title"
                  name="title"
                  type="text"
                  bind:value={selectedZine.title}
                  class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900"
                />
              </div>

              <div>
                <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-sub">Subtitle</label>
                <input
                  id="meta-sub"
                  name="subtitle"
                  type="text"
                  bind:value={selectedZine.subtitle}
                  class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900"
                />
              </div>

              <div>
                <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-year">Year</label>
                <input
                  id="meta-year"
                  name="year"
                  type="text"
                  bind:value={selectedZine.year}
                  class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-mono text-stone-900"
                />
              </div>

              <div>
                <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-edition">Edition</label>
                <input
                  id="meta-edition"
                  name="edition"
                  type="text"
                  bind:value={selectedZine.edition}
                  class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900"
                />
              </div>

              <div>
                <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-specs">Print Specs</label>
                <input
                  id="meta-specs"
                  name="printSpecs"
                  type="text"
                  bind:value={selectedZine.printSpecs}
                  class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900"
                />
              </div>

              <div>
                <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-texture">Texture Overlay</label>
                <select
                  id="meta-texture"
                  name="texture"
                  bind:value={selectedZine.texture}
                  class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 font-mono"
                >
                  <option value="risograph-matte">Risograph Matte</option>
                  <option value="matte">Standard Matte</option>
                  <option value="glossy">Glossy Sheen</option>
                  <option value="kraft">Recycled Kraft</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-mono text-stone-600 mb-1" for="meta-desc">Description</label>
              <textarea
                id="meta-desc"
                name="description"
                rows="2"
                bind:value={selectedZine.description}
                class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900"
              ></textarea>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-[#EAE6DE]">
              <!-- Delete Button & Action -->
              <div>
                {#if showDeleteConfirm}
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-mono text-rose-700">Delete publication & all images?</span>
                    <button
                      type="submit"
                      formaction="?/deleteZine"
                      class="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-mono flex items-center gap-1 shadow-xs"
                    >
                      <Trash2 size={12} />
                      <span>Yes, Delete</span>
                    </button>
                    <button
                      type="button"
                      onclick={() => (showDeleteConfirm = false)}
                      class="px-2.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                {:else}
                  <button
                    type="button"
                    onclick={() => (showDeleteConfirm = true)}
                    class="px-3 py-1.5 rounded text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Delete Zine</span>
                  </button>
                {/if}
              </div>

              <!-- Save Changes Button -->
              <button
                type="submit"
                formaction="?/saveMetadata"
                class="px-4 py-2 rounded bg-stone-800 hover:bg-black text-white text-xs font-mono flex items-center gap-1.5 shadow-xs"
              >
                <Save size={13} />
                <span>Save Zine Changes</span>
              </button>
            </div>
          </form>

          <!-- Spreads Sequence Inspection -->
          <div class="border-t border-[#EAE6DE] pt-5">
            <h3 class="text-xs font-mono uppercase tracking-wider text-stone-600 mb-3 flex items-center justify-between">
              <span>Extracted Spreads ({selectedZine.pages.length})</span>
              <span class="text-[10px] text-stone-500">Aspect Ratio: {Number(selectedZine.aspectRatio || 0.707).toFixed(3)}</span>
            </h3>

            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto p-2 bg-stone-50 rounded-lg border border-stone-200">
              {#each selectedZine.pages as page, i}
                <div class="relative group rounded overflow-hidden border border-stone-300 bg-white shadow-2xs aspect-[3/4]">
                  <img src={page.src} alt={page.alt} class="w-full h-full object-cover" />
                  <span class="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-white font-mono text-[9px]">
                    {i + 1}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-white rounded-xl border border-dashed border-[#DDD9CE] p-12 text-center text-stone-400">
          <BookOpen size={36} class="mx-auto mb-2 opacity-50" />
          <p class="text-sm font-serif">Select a publication from the left to inspect its spreads.</p>
        </div>
      {/if}
    </div>
  </div>
</div>
