<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import {
    Save,
    Check,
    AlertCircle,
    Plus,
    Trash2,
    Upload,
    LayoutGrid,
    MoveUp,
    MoveDown,
    ExternalLink,
    Image as ImageIcon,
    ZoomIn,
    X,
    RotateCcw
  } from '@lucide/svelte';

  let { data } = $props();

  interface DeskPlate {
    id?: string | number;
    title: string;
    caption?: string;
    src: string;
  }

  let frontmatter = $state<Record<string, any>>(JSON.parse(JSON.stringify(data.data || {})));
  let plates = $state<DeskPlate[]>(Array.isArray(frontmatter.sheets) ? frontmatter.sheets : []);
  let selectedPlateIndex = $state<number>(0);

  let isSaving = $state(false);
  let saveSuccess = $state(false);
  let errorMessage = $state<string | null>(null);

  // Live preview interactive state
  let previewCardId = $state<number | null>(null);

  // Selected plate derived
  let selectedPlate = $derived(plates[selectedPlateIndex] || null);

  function addPlate() {
    const newPlate: DeskPlate = {
      title: `Study Plate ${plates.length + 1}`,
      caption: 'Studio study on cold-pressed linen',
      src: `/images/sketch-${(plates.length % 23) + 1}.webp`,
    };
    plates = [...plates, newPlate];
    selectedPlateIndex = plates.length - 1;
  }

  function removePlate(index: number) {
    if (plates.length <= 1) {
      alert('Keep at least 1 plate on the studio desk.');
      return;
    }
    plates = plates.filter((_, idx) => idx !== index);
    if (selectedPlateIndex >= plates.length) {
      selectedPlateIndex = Math.max(0, plates.length - 1);
    }
  }

  function movePlate(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= plates.length) return;
    const reordered = [...plates];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;
    plates = reordered;
    selectedPlateIndex = target;
  }

  async function handleImageUpload(e: Event, index: number) {
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
      if (plates[index]) {
        plates[index].src = json.url;
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }

    input.value = '';
  }

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
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>Studio Desk Mat Editor | Studio</title>
</svelte:head>

<div class="h-full flex flex-col bg-[#F4F2ED] text-[#2C2B29] overflow-hidden select-none">
  <!-- Studio Desk Top Bar -->
  <header class="h-14 border-b border-[#E2DED4] bg-[#EFECE6] px-4 md:px-6 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div class="p-1.5 rounded bg-white text-stone-800 border border-[#DDD9CE] shadow-2xs">
        <LayoutGrid size={15} class="text-amber-700" />
      </div>
      <div>
        <h1 class="text-xs font-mono font-semibold uppercase tracking-wider text-[#2C2B29]">
          Studio Desk Mat Editor
        </h1>
        <p class="text-[11px] text-stone-500 font-serif">
          Curate the tactile drawing plates, captions, and images displayed on your homepage mat.
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2.5">
      <a
        href="/#projects"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs font-mono text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded hover:bg-[#EAE6DE] flex items-center gap-1 transition-colors"
      >
        <span>View On Live Site</span>
        <ExternalLink size={12} />
      </a>

      <!-- Save Form -->
      <form
        method="POST"
        action="?/save"
        bind:this={formElement}
        use:enhance={() => {
          isSaving = true;
          errorMessage = null;
          return async ({ result }) => {
            isSaving = false;
            if (result.type === 'success') {
              saveSuccess = true;
              setTimeout(() => (saveSuccess = false), 2500);
            } else if (result.type === 'failure') {
              errorMessage = (result.data as any)?.error || 'Save failed';
            }
          };
        }}
      >
        <input type="hidden" name="title" value={frontmatter.title || '3D Studio Desk'} />
        <input type="hidden" name="sheetsJson" value={JSON.stringify(plates)} />

        <button
          type="button"
          onclick={triggerSave}
          disabled={isSaving}
          class="flex items-center gap-1.5 bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] px-3.5 py-1.5 rounded text-xs font-mono transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
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

  <!-- Main Split Workbench -->
  <div class="flex-1 flex min-h-0 overflow-hidden">
    <!-- LEFT PANEL: Plates List & Detailed Form -->
    <div class="w-full md:w-[460px] border-r border-[#E2DED4] bg-[#FAF9F6] flex flex-col shrink-0 overflow-hidden">
      <!-- Toolbar -->
      <div class="p-3.5 border-b border-[#E2DED4] bg-[#EFECE6] flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-xs font-mono text-stone-700">
          <span class="font-semibold">{plates.length}</span>
          <span>Plates Configured</span>
        </div>
        <button
          type="button"
          onclick={addPlate}
          class="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded bg-[#FCFBF9] hover:bg-white text-stone-800 border border-[#DDD9CE] shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={13} class="text-amber-700" />
          <span>Add Study Plate</span>
        </button>
      </div>

      <!-- Plates List Scroll -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin]">
        {#each plates as plate, idx}
          {@const isSelected = selectedPlateIndex === idx}
          <div
            class="rounded-lg border transition-all {isSelected
              ? 'bg-white border-amber-600/80 shadow-xs ring-1 ring-amber-600/20'
              : 'bg-[#FCFBF9] border-[#E2DED4] hover:border-stone-400'}"
          >
            <!-- Plate Summary Header -->
            <div
              role="button"
              tabindex="0"
              onclick={() => (selectedPlateIndex = idx)}
              onkeydown={(e) => e.key === 'Enter' && (selectedPlateIndex = idx)}
              class="p-3 flex items-center gap-3 cursor-pointer"
            >
              <!-- Thumbnail Preview -->
              <div class="w-12 h-16 rounded overflow-hidden bg-stone-200 border border-stone-300 shrink-0">
                <img src={plate.src} alt={plate.title} class="w-full h-full object-cover" />
              </div>

              <!-- Title & Caption -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono text-stone-400">#{idx + 1}</span>
                  <h3 class="text-xs font-mono font-medium text-stone-900 truncate">{plate.title}</h3>
                </div>
                <p class="text-[11px] font-serif text-stone-500 truncate mt-0.5">
                  {plate.caption || 'No caption'}
                </p>
                <p class="text-[10px] font-mono text-stone-400 truncate mt-1">
                  {plate.src}
                </p>
              </div>

              <!-- Reorder & Delete Actions -->
              <div class="flex flex-col gap-1 shrink-0" onclick={(e) => e.stopPropagation()} role="presentation">
                <div class="flex items-center gap-0.5">
                  <button
                    type="button"
                    onclick={() => movePlate(idx, 'up')}
                    disabled={idx === 0}
                    class="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200 cursor-pointer"
                    title="Move up"
                  >
                    <MoveUp size={12} />
                  </button>
                  <button
                    type="button"
                    onclick={() => movePlate(idx, 'down')}
                    disabled={idx === plates.length - 1}
                    class="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200 cursor-pointer"
                    title="Move down"
                  >
                    <MoveDown size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onclick={() => removePlate(idx)}
                  class="p-1 text-stone-400 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer self-end"
                  title="Remove plate"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <!-- Expanded Details Editor when Selected -->
            {#if isSelected}
              <div class="px-3 pb-3.5 pt-2 border-t border-stone-200/60 bg-stone-50/50 space-y-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-mono text-stone-600 block">Plate Title</label>
                  <input
                    type="text"
                    bind:value={plate.title}
                    placeholder="e.g. Figure Study I"
                    class="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-mono text-stone-600 block">Caption &amp; Medium</label>
                  <input
                    type="text"
                    bind:value={plate.caption}
                    placeholder="e.g. Charcoal & graphite on cold-pressed linen"
                    class="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-mono text-stone-600 block">Artwork Image Path</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      bind:value={plate.src}
                      placeholder="/images/sketch-1.webp"
                      class="flex-1 bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
                    />
                    <label class="px-2.5 py-1.5 bg-white border border-[#DDD9CE] hover:bg-stone-100 rounded text-xs text-stone-700 font-mono cursor-pointer flex items-center gap-1 shrink-0">
                      <Upload size={12} />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onchange={(e) => handleImageUpload(e, idx)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- RIGHT PANEL: Live Mat Visualization & Simulation -->
    <div class="flex-1 flex flex-col min-w-0 bg-[#EAE6DE] p-6 overflow-hidden">
      <div class="flex items-center justify-between pb-3 text-xs font-mono text-stone-600">
        <span class="uppercase tracking-widest">Live Studio Desk Simulation</span>
        <span>Drag &amp; Click cards to inspect</span>
      </div>

      <!-- Simulation Mat Container -->
      <div class="flex-1 relative rounded-xl border border-[#D5CFC2] bg-[#FAF9F5] overflow-hidden shadow-inner flex flex-col justify-between p-4">
        <!-- Architectural Grid Background -->
        <div
          class="absolute inset-0 pointer-events-none opacity-40"
          style="background-size: 32px 32px; background-image: linear-gradient(to right, rgba(160, 150, 130, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 150, 130, 0.2) 1px, transparent 1px);"
        ></div>

        <!-- Mat Watermark -->
        <div class="absolute inset-4 rounded border border-dashed border-[#DDD9CE] pointer-events-none flex items-end justify-between p-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest">
          <span>Desk Mat Preview</span>
          <span>{plates.length} Active Items</span>
        </div>

        <!-- Live Visual Cards Grid / Scatter preview -->
        <div class="relative z-10 w-full h-full overflow-auto p-4 flex flex-wrap gap-5 items-start content-start">
          {#each plates as plate, idx}
            {@const isSelected = selectedPlateIndex === idx}
            <div
              role="button"
              tabindex="0"
              onclick={() => (selectedPlateIndex = idx)}
              onkeydown={(e) => e.key === 'Enter' && (selectedPlateIndex = idx)}
              class="w-36 sm:w-44 p-2 rounded bg-white border shadow-sm transition-all cursor-pointer transform hover:-translate-y-1 {isSelected
                ? 'border-amber-600 ring-2 ring-amber-600/30'
                : 'border-[#E2DED4]'}"
            >
              <div class="aspect-[3/4] bg-stone-100 rounded overflow-hidden border border-stone-200">
                <img src={plate.src} alt={plate.title} class="w-full h-full object-cover" />
              </div>
              <div class="mt-1.5 space-y-0.5">
                <p class="text-[11px] font-serif font-medium text-stone-900 truncate">{plate.title}</p>
                {#if plate.caption}
                  <p class="text-[9px] font-sans text-stone-500 truncate">{plate.caption}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
