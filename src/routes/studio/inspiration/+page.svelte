<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import {
    Save,
    ArrowLeft,
    Check,
    AlertCircle,
    Plus,
    Trash2,
    Sparkles,
    Move,
    Eye,
    ExternalLink,
    HelpCircle
  } from '@lucide/svelte';

  let { data } = $props();

  let frontmatter = $state<Record<string, any>>(JSON.parse(JSON.stringify(data.data || {})));
  let bodyContent = $state(data.content || '');

  let nodes = $state<any[]>(Array.isArray(frontmatter.nodes) ? frontmatter.nodes : []);
  let selectedNodeId = $state<string | number | null>(null);

  let isSaving = $state(false);
  let saveSuccess = $state(false);
  let errorMessage = $state<string | null>(null);

  let canvasRef: HTMLDivElement;
  let isDragging = $state(false);
  let draggedNodeId = $state<string | number | null>(null);

  // Selected node object derived
  let selectedNode = $derived(nodes.find((n) => n.id === selectedNodeId) || null);

  function selectNode(id: string | number) {
    selectedNodeId = id;
  }

  function addNode(defaultX = 50, defaultY = 50) {
    const newId = String(Date.now());
    const newNode = {
      id: newId,
      title: 'New Influence',
      category: 'Philosophy / Art',
      x: Math.round(defaultX),
      y: Math.round(defaultY),
      quote: 'Add inspiring excerpt or quotation...',
    };
    nodes = [...nodes, newNode];
    selectedNodeId = newId;
  }

  function removeNode(id: string | number) {
    nodes = nodes.filter((n) => n.id !== id);
    if (selectedNodeId === id) {
      selectedNodeId = nodes[0]?.id || null;
    }
  }

  // Handle clicking on the canvas directly to place or reposition node
  function handleCanvasClick(e: MouseEvent) {
    if (isDragging) return;
    if (!canvasRef) return;
    const rect = canvasRef.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(2, Math.min(98, Math.round(clickX)));
    const clampedY = Math.max(2, Math.min(98, Math.round(clickY)));

    if (selectedNode) {
      // Reposition currently selected node
      selectedNode.x = clampedX;
      selectedNode.y = clampedY;
    } else {
      // Add new node at clicked position
      addNode(clampedX, clampedY);
    }
  }

  // Drag pin across the canvas
  function startDrag(e: MouseEvent, id: string | number) {
    e.stopPropagation();
    isDragging = true;
    draggedNodeId = id;
    selectedNodeId = id;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!canvasRef) return;
      const rect = canvasRef.getBoundingClientRect();
      const moveX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const moveY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      const node = nodes.find((n) => n.id === draggedNodeId);
      if (node) {
        node.x = Math.max(2, Math.min(98, Math.round(moveX)));
        node.y = Math.max(2, Math.min(98, Math.round(moveY)));
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      draggedNodeId = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Global ⌘S keyboard listener
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

  let serializedPayload = $derived(
    JSON.stringify({
      frontmatter: {
        ...frontmatter,
        nodes,
      },
      body: bodyContent,
    })
  );
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>Cosmology Pin Editor | Studio</title>
</svelte:head>

<div class="h-full w-full flex flex-col bg-[#F4F2ED] text-[#2C2B29] overflow-hidden select-none">
  <!-- Top App Bar -->
  <header class="h-13 border-b border-[#E2DED4] bg-[#EAE6DE] px-4 flex items-center justify-between shrink-0 z-20">
    <div class="flex items-center gap-3">
      <a
        href="/studio"
        class="p-1.5 rounded hover:bg-[#DDD9CE] text-stone-600 hover:text-stone-900 transition-colors"
        title="Back to Studio dashboard"
      >
        <ArrowLeft size={16} />
      </a>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DDD9CE] text-stone-700 uppercase tracking-wider">
          Visual Spatial Editor
        </span>
        <span class="text-xs font-mono font-medium text-stone-800">
          Inspiration Cosmology ({nodes.length} Nodes)
        </span>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-2.5">
      <a
        href="/inspiration"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 text-xs font-mono text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded hover:bg-[#DDD9CE] transition-colors"
      >
        <span>View Public</span>
        <ExternalLink size={12} />
      </a>

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
              setTimeout(() => (saveSuccess = false), 3000);
            }
            await update();
          };
        }}
      >
        <input type="hidden" name="payload" value={serializedPayload} />
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
    <div class="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2 text-xs flex items-center gap-2">
      <AlertCircle size={14} class="text-red-600" />
      <span>{errorMessage}</span>
    </div>
  {/if}

  <!-- Main Split Editor Workspace -->
  <div class="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
    <!-- LEFT: Interactive Visual Pin Canvas -->
    <div class="flex-1 bg-[#121110] relative flex items-center justify-center p-4 overflow-auto">
      <div
        bind:this={canvasRef}
        onclick={handleCanvasClick}
        class="relative w-full aspect-[16/9] max-h-full max-w-5xl rounded-lg shadow-2xl overflow-hidden cursor-crosshair border border-[#2E2C28]"
      >
        <!-- Background Archival Plate Image -->
        <img
          src="/images/inspiration_cosmology.webp"
          alt="Cosmology Plate"
          class="w-full h-full object-cover pointer-events-none select-none"
        />

        <!-- Constellation Lines SVG -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {#each nodes as node, idx}
            {#if idx < nodes.length - 1}
              {@const next = nodes[idx + 1]}
              <line
                x1="{node.x}%"
                y1="{node.y}%"
                x2="{next.x}%"
                y2="{next.y}%"
                stroke="rgba(251, 191, 36, 0.4)"
                stroke-width="1.5"
                stroke-dasharray="3 3"
              />
            {/if}
          {/each}
        </svg>

        <!-- Interactive Pins -->
        {#each nodes as node (node.id)}
          {@const isSelected = selectedNodeId === node.id}
          <div
            style="left: {node.x}%; top: {node.y}%;"
            class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 group"
            onmousedown={(e) => startDrag(e, node.id)}
            onclick={(e) => {
              e.stopPropagation();
              selectNode(node.id);
            }}
          >
            <div class="relative flex items-center justify-center">
              <!-- Halo ring -->
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center transition-all {isSelected
                  ? 'bg-amber-400/40 ring-2 ring-amber-400 scale-125'
                  : 'bg-amber-500/20 group-hover:scale-110'}"
              >
                <!-- Core Star Pin -->
                <div
                  class="w-3 h-3 rounded-full transition-transform {isSelected
                    ? 'bg-amber-400 scale-125 shadow-[0_0_12px_rgba(251,191,36,1)]'
                    : 'bg-amber-200 group-hover:bg-amber-300'}"
                ></div>
              </div>

              <!-- Node Title Badge -->
              <span
                class="absolute top-7 whitespace-nowrap font-mono text-[10px] px-2 py-0.5 rounded shadow pointer-events-none transition-all {isSelected
                  ? 'bg-amber-400 text-stone-950 font-bold scale-105'
                  : 'bg-black/80 text-stone-200 border border-stone-700'}"
              >
                {node.title} ({node.x}%, {node.y}%)
              </span>
            </div>
          </div>
        {/each}

        <!-- Canvas Floating Hint -->
        <div class="absolute bottom-3 left-3 pointer-events-none bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded text-[11px] font-mono text-stone-300 flex items-center gap-2 border border-stone-800">
          <Move size={12} class="text-amber-400" />
          <span>Click to place/move selected pin · Drag pin directly to reposition</span>
        </div>
      </div>
    </div>

    <!-- RIGHT: Node Inspector & Meta Sidebar -->
    <div class="w-full lg:w-96 bg-[#FAF9F6] border-t lg:border-t-0 lg:border-l border-[#E2DED4] flex flex-col justify-between shrink-0 h-80 lg:h-full overflow-hidden">
      <!-- Node Inspector Card -->
      <div class="flex-1 overflow-y-auto p-5 space-y-6 [scrollbar-width:thin]">
        <div class="flex items-center justify-between border-b border-[#E2DED4] pb-3">
          <h2 class="text-xs font-mono uppercase tracking-wider text-stone-700 font-semibold flex items-center gap-1.5">
            <Sparkles size={13} class="text-amber-600" />
            <span>Selected Node Details</span>
          </h2>
          <button
            type="button"
            onclick={() => addNode()}
            class="px-2.5 py-1 rounded bg-[#EFECE6] hover:bg-[#EAE6DE] text-stone-800 text-xs font-mono flex items-center gap-1 border border-[#DDD9CE] transition-colors"
          >
            <Plus size={12} />
            <span>Add Node</span>
          </button>
        </div>

        {#if selectedNode}
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Title / Name</label>
              <input
                type="text"
                bind:value={selectedNode.title}
                class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-medium"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Category / Discipline</label>
              <input
                type="text"
                bind:value={selectedNode.category}
                class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>

            <!-- Coordinate Sliders -->
            <div class="grid grid-cols-2 gap-3 p-3 bg-[#EFECE6] rounded border border-[#E2DED4]">
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] font-mono text-stone-600">
                  <span>X Position</span>
                  <span class="font-bold text-stone-800">{selectedNode.x}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="98"
                  bind:value={selectedNode.x}
                  class="w-full accent-stone-800"
                />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-[11px] font-mono text-stone-600">
                  <span>Y Position</span>
                  <span class="font-bold text-stone-800">{selectedNode.y}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="98"
                  bind:value={selectedNode.y}
                  class="w-full accent-stone-800"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Quotation / Insight Excerpt</label>
              <textarea
                bind:value={selectedNode.quote}
                rows={3}
                class="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-serif leading-relaxed resize-none"
              ></textarea>
            </div>

            <div class="pt-2 flex justify-between items-center">
              <button
                type="button"
                onclick={() => removeNode(selectedNode.id)}
                class="text-xs font-mono text-red-600 hover:text-red-800 flex items-center gap-1 p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={13} />
                <span>Delete Pin</span>
              </button>
            </div>
          </div>
        {:else}
          <div class="py-10 text-center text-xs font-mono text-stone-500">
            Click any pin on the canvas or click "Add Node" to edit details.
          </div>
        {/if}

        <!-- All Nodes Quick Directory -->
        <div class="pt-4 border-t border-[#E2DED4] space-y-2">
          <div class="text-[10px] font-mono uppercase tracking-wider text-stone-500">
            All Constellation Nodes ({nodes.length})
          </div>
          <div class="space-y-1 max-h-48 overflow-y-auto [scrollbar-width:thin]">
            {#each nodes as n}
              {@const isSel = selectedNodeId === n.id}
              <button
                type="button"
                onclick={() => selectNode(n.id)}
                class="w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors {isSel
                  ? 'bg-[#E0DBD0] text-stone-900 font-semibold'
                  : 'hover:bg-[#EFECE6] text-stone-600'}"
              >
                <span class="truncate">{n.title}</span>
                <span class="text-[10px] font-mono text-stone-400 shrink-0 ml-2">{n.x}%, {n.y}%</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
