<script lang="ts">
  import {
    Image,
    Upload,
    Check,
    Copy,
    ArrowLeft,
    Trash2,
    CheckSquare,
    Square,
    X,
    AlertTriangle,
    Edit3,
    Tag,
    Camera,
    Shield,
    Layout,
    Layers,
    RefreshCw
  } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import MediaUploadModal from '$lib/components/studio/MediaUploadModal.svelte';

  let { data } = $props();

  let assets = $derived(data.assets || []);
  let searchQuery = $state('');
  let copiedUrl = $state<string | null>(null);

  // Upload modal state
  let showUploadModal = $state(false);

  // Multi-select state
  let selectedNames = $state<string[]>([]);
  let isDeleting = $state(false);
  let showConfirmDelete = $state(false);
  let deleteError = $state<string | null>(null);

  // In-place rename / reclassify state
  let editingAsset = $state<{ name: string; url: string; classification: string; isProtected?: boolean } | null>(null);
  let renameValue = $state('');
  let classificationValue = $state<'art' | 'photography' | 'product_ui' | 'standard'>('standard');
  let aiProtectedValue = $state(false);
  let isRenaming = $state(false);
  let renameError = $state<string | null>(null);
  let renameSuccessMessage = $state<string | null>(null);

  let filteredAssets = $derived(
    assets.filter((a: any) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  let selectedTotalSize = $derived(
    assets
      .filter((a: any) => selectedNames.includes(a.name))
      .reduce((acc: number, a: any) => acc + (a.size || 0), 0)
  );

  function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function toggleSelect(name: string) {
    if (selectedNames.includes(name)) {
      selectedNames = selectedNames.filter((n) => n !== name);
    } else {
      selectedNames = [...selectedNames, name];
    }
  }

  function selectAllFiltered() {
    const allFilteredNames = filteredAssets.map((a: any) => a.name);
    const set = new Set([...selectedNames, ...allFilteredNames]);
    selectedNames = Array.from(set);
  }

  function deselectAll() {
    selectedNames = [];
  }

  async function copyMarkdown(url: string, name: string) {
    const snippet = `![${name}](${url})`;
    try {
      await navigator.clipboard.writeText(snippet);
      copiedUrl = url;
      setTimeout(() => {
        if (copiedUrl === url) copiedUrl = null;
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  }

  function openEditModal(asset: any) {
    editingAsset = asset;
    renameValue = asset.name;
    classificationValue = asset.classification || 'standard';
    aiProtectedValue = !!asset.isProtected;
    renameError = null;
    renameSuccessMessage = null;
  }

  function appendEditTag(tag: 'art' | 'photo') {
    const suffix = tag === 'art' ? '-art' : '-photo';
    const ext = renameValue.substring(renameValue.lastIndexOf('.'));
    const base = renameValue.substring(0, renameValue.lastIndexOf('.'));
    if (!base.endsWith(suffix)) {
      renameValue = `${base}${suffix}${ext}`;
    }
    if (tag === 'art') {
      classificationValue = 'art';
      aiProtectedValue = true;
    }
    if (tag === 'photo') {
      classificationValue = 'photography';
    }
  }

  async function submitRename() {
    if (!editingAsset) return;
    isRenaming = true;
    renameError = null;
    renameSuccessMessage = null;

    try {
      const res = await fetch('/api/studio/media/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentName: editingAsset.name,
          newName: renameValue,
          classification: classificationValue,
          aiProtected: aiProtectedValue,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        renameError = data.error || 'Failed to update asset';
      } else {
        renameSuccessMessage = `Updated successfully! ${data.updatedDocsCount > 0 ? `Reconciled ${data.updatedDocsCount} markdown docs.` : ''}`;
        await invalidateAll();
        setTimeout(() => {
          editingAsset = null;
          renameSuccessMessage = null;
        }, 1200);
      }
    } catch (err: any) {
      renameError = err.message || 'Network error';
    } finally {
      isRenaming = false;
    }
  }
</script>

<svelte:head>
  <title>Media Library | Studio</title>
</svelte:head>

<div class="h-full overflow-y-auto p-8 md:p-12 max-w-7xl mx-auto space-y-8 select-none [scrollbar-width:thin] relative">
  <!-- Top Bar -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DED4] pb-6">
    <div class="flex items-center gap-3">
      <a
        href="/studio"
        class="p-2 rounded bg-[#EFECE6] hover:bg-[#EAE6DE] text-stone-600 hover:text-stone-900 transition-colors border border-[#E2DED4]"
        title="Back to Studio dashboard"
      >
        <ArrowLeft size={16} />
      </a>
      <div>
        <h1 class="text-xl font-medium tracking-tight text-[#2C2B29] flex items-center gap-2">
          <Image size={18} class="text-amber-700" />
          <span>Local Media Assets</span>
        </h1>
        <p class="text-xs text-stone-500 font-mono mt-0.5">
          Directory: <span class="text-stone-700">/static/images/</span> ({assets.length} items)
        </p>
      </div>
    </div>

    <!-- Upload CTA -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        onclick={() => (showUploadModal = true)}
        class="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] text-xs font-medium rounded cursor-pointer transition-colors shadow-2xs"
      >
        <Upload size={14} />
        <span>Upload &amp; Classify Media</span>
      </button>
    </div>
  </div>

  <!-- Search Filter & Selection Quick Bar -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <input
      type="text"
      placeholder="Filter media assets by filename or directory..."
      bind:value={searchQuery}
      class="max-w-md w-full bg-white border border-[#DDD9CE] rounded px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 transition-colors font-mono"
    />

    <div class="flex items-center gap-2 text-xs font-mono">
      {#if filteredAssets.length > 0}
        <button
          type="button"
          onclick={selectAllFiltered}
          class="px-3 py-1.5 rounded bg-white hover:bg-stone-100 text-stone-700 border border-[#DDD9CE] transition-colors cursor-pointer"
        >
          Select All Visible ({filteredAssets.length})
        </button>
      {/if}
      {#if selectedNames.length > 0}
        <button
          type="button"
          onclick={deselectAll}
          class="px-3 py-1.5 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 transition-colors cursor-pointer"
        >
          Clear Selection
        </button>
      {/if}
    </div>
  </div>

  <!-- Floating Multi-Select Action Bar -->
  {#if selectedNames.length > 0}
    <div class="sticky top-4 z-40 p-4 rounded-xl bg-[#2C2B29] text-[#F4F2ED] shadow-xl flex flex-wrap items-center justify-between gap-4 border border-stone-700">
      <div class="flex items-center gap-3 text-xs font-mono">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
        <span class="font-medium">{selectedNames.length}</span>
        <span class="text-stone-400">files selected ({formatBytes(selectedTotalSize)})</span>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={deselectAll}
          class="px-3 py-1 text-xs font-mono text-stone-300 hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={() => (showConfirmDelete = true)}
          class="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-mono font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Delete Selected ({selectedNames.length})</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Delete Error Banner -->
  {#if deleteError}
    <div class="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs flex items-center justify-between">
      <span>{deleteError}</span>
      <button type="button" onclick={() => (deleteError = null)} class="text-red-500 hover:text-red-700">
        <X size={14} />
      </button>
    </div>
  {/if}

  <!-- Media Grid -->
  {#if filteredAssets.length === 0}
    <div class="py-20 text-center border border-dashed border-[#DDD9CE] rounded-lg text-stone-400 font-mono text-xs">
      No media files match your filter.
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {#each filteredAssets as asset}
        {@const isSelected = selectedNames.includes(asset.name)}
        <div
          class="group relative bg-[#FCFBF9] border rounded-lg overflow-hidden flex flex-col transition-all {isSelected
            ? 'border-red-500 ring-2 ring-red-500/30 shadow-md'
            : 'border-[#E2DED4] hover:border-stone-400 hover:shadow-xs'}"
        >
          <!-- Thumbnail preview container with Checkbox Overlay -->
          <div
            role="button"
            tabindex="0"
            onclick={() => toggleSelect(asset.name)}
            onkeydown={(e) => e.key === 'Enter' && toggleSelect(asset.name)}
            class="relative aspect-square w-full bg-stone-100 flex items-center justify-center overflow-hidden border-b border-[#EAE6DE] cursor-pointer"
          >
            <img
              src={asset.url}
              alt={asset.name}
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />

            <!-- Multi-select checkbox badge -->
            <div
              class="absolute top-2 left-2 z-10 p-1 rounded-md backdrop-blur-xs transition-opacity {isSelected
                ? 'bg-red-600 text-white opacity-100'
                : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100'}"
            >
              {#if isSelected}
                <CheckSquare size={16} />
              {:else}
                <Square size={16} />
              {/if}
            </div>

            <!-- Intent Badge -->
            <div class="absolute bottom-2 left-2 z-10 text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs shadow-xs {asset.isProtected || asset.classification === 'art'
              ? 'bg-amber-950/85 text-amber-200 border border-amber-500/40'
              : asset.classification === 'photography'
              ? 'bg-emerald-950/85 text-emerald-200 border border-emerald-500/40'
              : asset.classification === 'product_ui'
              ? 'bg-blue-950/85 text-blue-200 border border-blue-500/40'
              : 'bg-black/60 text-stone-200'}">
              {#if asset.isProtected || asset.classification === 'art'}
                🛡️ Glazed &amp; Protected
              {:else if asset.classification === 'photography'}
                📷 Photo
              {:else if asset.classification === 'product_ui'}
                💻 UI
              {:else}
                Standard
              {/if}
            </div>
          </div>

          <!-- Metadata & Actions -->
          <div class="p-3 flex flex-col justify-between flex-1 gap-2 bg-[#FCFBF9]">
            <div class="min-w-0">
              <div class="text-xs font-mono text-stone-800 truncate" title={asset.name}>
                {asset.name}
              </div>
              <div class="text-[10px] font-mono text-stone-400 mt-0.5">
                {formatBytes(asset.size)}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onclick={() => openEditModal(asset)}
                class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded text-[11px] font-mono bg-[#EFECE6] hover:bg-[#EAE6DE] text-stone-700 hover:text-stone-900 transition-colors border border-[#E2DED4] cursor-pointer"
                title="Rename or change intent"
              >
                <Edit3 size={11} />
                <span>Classify</span>
              </button>

              <button
                type="button"
                onclick={() => copyMarkdown(asset.url, asset.name)}
                class="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded text-[11px] font-mono bg-[#EFECE6] hover:bg-[#EAE6DE] text-stone-700 hover:text-stone-900 transition-colors border border-[#E2DED4] cursor-pointer"
                title="Copy markdown snippet"
              >
                {#if copiedUrl === asset.url}
                  <Check size={11} class="text-emerald-600" />
                  <span class="text-emerald-700 font-medium">Copied!</span>
                {:else}
                  <Copy size={11} />
                  <span>Copy</span>
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- In-Place Rename / Reclassify Modal -->
  {#if editingAsset}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="max-w-md w-full bg-[#FAF8F5] rounded-xl p-6 border border-[#DCD7CB] shadow-2xl space-y-4 text-[#2C2B29]">
        <div class="flex items-center justify-between border-b border-[#DDD9CE] pb-3">
          <div class="flex items-center gap-2">
            <Edit3 size={16} class="text-amber-800" />
            <h2 class="text-sm font-serif font-medium text-stone-900">Classify &amp; Rename Asset</h2>
          </div>
          <button type="button" onclick={() => (editingAsset = null)} class="text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>

        {#if renameError}
          <div class="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-mono">
            {renameError}
          </div>
        {/if}

        {#if renameSuccessMessage}
          <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-mono">
            {renameSuccessMessage}
          </div>
        {/if}

        <div class="space-y-3 text-xs font-mono">
          <div class="space-y-1">
            <label class="text-[10px] text-stone-500 uppercase tracking-wider block">Filename</label>
            <div class="flex items-center gap-2">
              <input
                type="text"
                bind:value={renameValue}
                class="flex-1 bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
              />
              <button
                type="button"
                onclick={() => appendEditTag('art')}
                class="px-2 py-1 rounded bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-[#DDD9CE] text-[10px]"
                title="Append -art"
              >
                +art
              </button>
              <button
                type="button"
                onclick={() => appendEditTag('photo')}
                class="px-2 py-1 rounded bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-[#DDD9CE] text-[10px]"
                title="Append -photo"
              >
                +photo
              </button>
            </div>
            <span class="text-[10px] text-stone-400 font-serif block">
              Renaming automatically updates references across all Markdown documents.
            </span>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] text-stone-500 uppercase tracking-wider block">Compression Intent</label>
            <select
              bind:value={classificationValue}
              onchange={() => {
                if (classificationValue === 'art') aiProtectedValue = true;
              }}
              class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500"
            >
              <option value="art">🛡️ Fine Art (AI-Protected / Q90)</option>
              <option value="photography">📷 Documentary Photo (4K / Q89)</option>
              <option value="product_ui">💻 UI / Case Study (Crisp 1px / Q86)</option>
              <option value="standard">📦 Standard Editorial (Q84)</option>
            </select>
          </div>

          <!-- AI Deterrence Verification Checkbox -->
          <div class="pt-2 border-t border-[#EAE6DE]">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={aiProtectedValue}
                class="mt-0.5 rounded text-amber-700 focus:ring-amber-500"
              />
              <div>
                <span class="text-xs font-medium text-stone-900 block flex items-center gap-1.5">
                  <Shield size={12} class="text-amber-700" />
                  <span>AI Deterrence Verified (Glazed / Nightshaded)</span>
                </span>
                <span class="text-[11px] text-stone-500 font-serif block mt-0.5">
                  Flags this asset as cloaked with adversarial noise. Displays the golden shield badge in the library.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#DDD9CE]">
          <button
            type="button"
            onclick={() => (editingAsset = null)}
            disabled={isRenaming}
            class="px-3 py-1.5 rounded text-xs font-mono text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onclick={submitRename}
            disabled={isRenaming}
            class="px-4 py-1.5 bg-[#2C2B29] hover:bg-stone-800 text-white rounded text-xs font-mono flex items-center gap-1.5"
          >
            {#if isRenaming}
              <RefreshCw size={12} class="animate-spin" />
              <span>Updating...</span>
            {:else}
              <span>Save Changes</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showConfirmDelete}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="max-w-md w-full bg-white rounded-xl p-6 border border-stone-300 shadow-2xl space-y-4 text-[#2C2B29]">
        <div class="flex items-center gap-3 text-red-600">
          <div class="p-2 rounded-full bg-red-100">
            <AlertTriangle size={20} />
          </div>
          <h2 class="text-base font-medium font-serif">Confirm Permanent Deletion</h2>
        </div>

        <p class="text-xs text-stone-600 font-sans leading-relaxed">
          You are about to permanently delete <strong class="text-stone-900">{selectedNames.length} image files</strong> ({formatBytes(selectedTotalSize)}) from your local <code class="bg-stone-100 px-1 py-0.5 rounded text-[11px]">static/images/</code> directory.
        </p>

        <!-- Form for deleteBatch action -->
        <form
          method="POST"
          action="?/deleteBatch"
          use:enhance={() => {
            isDeleting = true;
            deleteError = null;
            return async ({ result }) => {
              isDeleting = false;
              showConfirmDelete = false;
              if (result.type === 'success') {
                selectedNames = [];
                await invalidateAll();
              } else if (result.type === 'failure') {
                deleteError = (result.data as any)?.message || 'Deletion failed';
              }
            };
          }}
          class="flex items-center justify-end gap-3 pt-3 border-t border-stone-200"
        >
          <input type="hidden" name="filenames" value={JSON.stringify(selectedNames)} />

          <button
            type="button"
            onclick={() => (showConfirmDelete = false)}
            disabled={isDeleting}
            class="px-4 py-2 rounded text-xs font-mono text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isDeleting}
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-mono font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {#if isDeleting}
              <span class="animate-spin text-white">⟳</span>
              <span>Deleting...</span>
            {:else}
              <Trash2 size={13} />
              <span>Confirm Delete ({selectedNames.length})</span>
            {/if}
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>

<!-- Upload & Classify Modal Mount -->
<MediaUploadModal
  isOpen={showUploadModal}
  onclose={() => (showUploadModal = false)}
  onsuccess={() => invalidateAll()}
/>
