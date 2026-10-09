<script lang="ts">
  import {
    Shield,
    X,
    Play,
    CheckCircle2,
    AlertCircle,
    HardDrive,
    Sparkles,
    RefreshCw,
    Sliders,
    Eye,
    ChevronRight,
    Terminal
  } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    pipelineStatus: any;
    onclose: () => void;
    onsuccess?: () => void;
  }

  let { isOpen = false, pipelineStatus, onclose, onsuccess }: Props = $props();

  // Execution states
  type Stage = 'idle' | 'executing' | 'completed' | 'error';
  let stage = $state<Stage>('idle');
  let activeAction = $state<'dry-run' | 'stage-ai' | 'optimize' | 'full'>('full');
  let archiveOriginals = $state(true);
  let stageAiFirst = $state(true);

  // Results & Logs
  let logs = $state<string[]>([]);
  let errorMessage = $state<string | null>(null);
  let executionResult = $state<any>(null);

  function resetState() {
    stage = 'idle';
    logs = [];
    errorMessage = null;
    executionResult = null;
  }

  function handleClose() {
    if (stage === 'executing') return; // prevent closing during run
    resetState();
    onclose();
  }

  async function runPipeline(actionType: 'dry-run' | 'stage-ai' | 'optimize' | 'full') {
    stage = 'executing';
    activeAction = actionType;
    errorMessage = null;
    logs = [`[Pipeline Dispatcher] Starting ${actionType.toUpperCase()} job...`];
    executionResult = null;

    try {
      const res = await fetch('/api/studio/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          archiveOriginals,
          stageAiFirst,
        }),
      });

      const data = await res.json();
      if (Array.isArray(data.logs)) {
        logs = data.logs;
      }

      if (!res.ok || !data.success) {
        stage = 'error';
        errorMessage = data.error || 'Pipeline execution failed';
      } else {
        stage = 'completed';
        executionResult = data;
        if (onsuccess) onsuccess();
      }
    } catch (err: any) {
      stage = 'error';
      errorMessage = err.message || 'Network error executing pipeline';
      logs.push(`❌ Network/Fetch Error: ${errorMessage}`);
    }
  }

  function formatBytes(bytes: number) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div
      class="max-w-2xl w-full bg-[#FAF8F5] rounded-xl border border-[#DCD7CB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#2C2B29]"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4.5 bg-[#EAE6DE] border-b border-[#DDD9CE] flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-[#2C2B29] text-[#F4F2ED]">
            <Shield size={18} />
          </div>
          <div>
            <h2 id="modal-title" class="text-base font-serif font-medium text-stone-900 flex items-center gap-2">
              <span>One-Click Media Pipeline &amp; Deterrence</span>
            </h2>
            <p class="text-xs font-mono text-stone-500 mt-0.5">
              Glaze &middot; Nightshade &middot; Contextual WebP &middot; Markdown Reconcile
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={handleClose}
          disabled={stage === 'executing'}
          class="p-1.5 rounded text-stone-400 hover:text-stone-700 hover:bg-[#DDD9CE] transition-colors disabled:opacity-30 cursor-pointer"
          title="Close dialog"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-6 [scrollbar-width:thin] flex-1">
        <!-- 1. System Pre-flight Ribbon -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg border bg-[#F3EFE7] border-[#E2DED4] flex items-center gap-2.5">
            <HardDrive size={15} class={pipelineStatus?.t7Detected ? 'text-emerald-700' : 'text-amber-700'} />
            <div class="min-w-0">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">{pipelineStatus?.vaultLabel || 'Storage Vault'}</div>
              <div class="font-medium truncate text-stone-800">
                {pipelineStatus?.t7Detected ? 'Vault Ready' : 'Unmounted (Local Only)'}
              </div>
            </div>
          </div>

          <div class="p-3 rounded-lg border bg-[#F3EFE7] border-[#E2DED4] flex items-center gap-2.5">
            <Sparkles size={15} class="text-amber-700" />
            <div class="min-w-0">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">Eligible Artworks</div>
              <div class="font-medium text-stone-800">
                {pipelineStatus?.aiEligibleCount ?? 0} candidate files
              </div>
            </div>
          </div>

          <div class="p-3 rounded-lg border bg-[#F3EFE7] border-[#E2DED4] flex items-center gap-2.5">
            <Sliders size={15} class="text-stone-700" />
            <div class="min-w-0">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">Pending Raw Assets</div>
              <div class="font-medium text-stone-800">
                {pipelineStatus?.rawImagesCount ?? 0} JPEG / PNG
              </div>
            </div>
          </div>
        </div>

        <!-- IDLE CONFIGURATION STAGE -->
        {#if stage === 'idle'}
          <div class="space-y-4">
            <div class="bg-white p-4 rounded-lg border border-[#DDD9CE] space-y-3">
              <h3 class="text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
                Execution Settings
              </h3>

              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  bind:checked={stageAiFirst}
                  disabled={!pipelineStatus?.t7Detected}
                  class="mt-0.5 rounded text-amber-700 focus:ring-amber-500"
                />
                <div class="text-xs">
                  <span class="font-medium text-stone-900 block">
                    Stage Art Assets to Vault for Glaze / Nightshade
                  </span>
                  <span class="text-stone-500 text-[11px] block mt-0.5 font-serif">
                    Copies sketches, charcoal studies, and portraits to vault <code class="bg-stone-100 px-1 py-0.5 rounded font-mono">stage-in/</code> for model protection.
                  </span>
                </div>
              </label>

              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  bind:checked={archiveOriginals}
                  disabled={!pipelineStatus?.t7Detected}
                  class="mt-0.5 rounded text-amber-700 focus:ring-amber-500"
                />
                <div class="text-xs">
                  <span class="font-medium text-stone-900 block">
                    Archive Raw Masters to Vault Storage
                  </span>
                  <span class="text-stone-500 text-[11px] block mt-0.5 font-serif">
                    Transfers raw multi-megabyte master files to cold storage, keeping Git lean.
                  </span>
                </div>
              </label>
            </div>

            <!-- Pre-flight notices -->
            {#if !pipelineStatus?.t7Detected}
              <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-serif text-amber-900 leading-relaxed">
                <strong>Notice:</strong> Storage vault is unmounted or uninitialized ({pipelineStatus?.t7Path || 'no path configured'}). Optimization will run in local-safe mode without external raw archiving.
              </div>
            {/if}

            {#if pipelineStatus?.rawImagesCount === 0}
              <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-serif text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 size={16} class="text-emerald-700 shrink-0" />
                <span>
                  All assets in <code class="font-mono text-[10px] bg-emerald-100 px-1 rounded">static/images/</code> are already optimized to modern WebP format. You can run a Dry Run verification or stage newly added artworks.
                </span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- EXECUTING STAGE -->
        {#if stage === 'executing'}
          <div class="space-y-4">
            <div class="p-4 bg-amber-500/10 border border-amber-600/30 rounded-lg flex items-center gap-3">
              <RefreshCw size={18} class="animate-spin text-amber-700 shrink-0" />
              <div>
                <h4 class="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider">
                  Pipeline Running: {activeAction.toUpperCase()}
                </h4>
                <p class="text-xs font-serif text-amber-800 mt-0.5">
                  Scanning assets, encoding contextual WebP, and checking deterrence vaults...
                </p>
              </div>
            </div>
          </div>
        {/if}

        <!-- ERROR STAGE -->
        {#if stage === 'error'}
          <div class="space-y-4">
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-900">
              <AlertCircle size={18} class="text-red-600 shrink-0 mt-0.5" />
              <div class="space-y-1 text-xs">
                <div class="font-bold font-mono uppercase tracking-wider">Pipeline Execution Halted</div>
                <div class="font-serif leading-relaxed">{errorMessage}</div>
                <div class="text-[11px] font-mono text-red-700 pt-1">
                  Check drive mounting permissions or run a Dry-Run simulation to diagnose.
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- COMPLETED CONFIRMATION STAGE -->
        {#if stage === 'completed'}
          <div class="space-y-4">
            <div class="p-4.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-3.5 text-emerald-950">
              <div class="p-1 rounded-full bg-emerald-600 text-white mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div class="space-y-1 text-xs flex-1">
                <div class="font-bold font-mono uppercase tracking-wider text-emerald-900">
                  Pipeline Execution Successful
                </div>
                <p class="font-serif text-emerald-800 leading-relaxed">
                  {#if activeAction === 'dry-run'}
                    Simulation completed. Reviewed all candidate assets and compression presets with zero modifications to disk.
                  {:else}
                    Media optimization and AI deterrence staging completed. Local disk storage and markdown frontmatter references have been reconciled.
                  {/if}
                </p>

                {#if executionResult?.optimizeResult}
                  <div class="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div>
                      <span class="text-emerald-700 block text-[10px]">CONVERTED</span>
                      <strong>{executionResult.optimizeResult.convertedCount ?? 0} files</strong>
                    </div>
                    <div>
                      <span class="text-emerald-700 block text-[10px]">BYTES SAVED</span>
                      <strong>{formatBytes(executionResult.optimizeResult.totalSavedBytes ?? 0)}</strong>
                    </div>
                    <div>
                      <span class="text-emerald-700 block text-[10px]">MD RECONCILED</span>
                      <strong>{executionResult.optimizeResult.updatedFilesCount ?? 0} docs</strong>
                    </div>
                    <div>
                      <span class="text-amber-800 block text-[10px]">🛡️ AI PROTECTED</span>
                      <strong class="text-amber-900">{executionResult.currentStatus?.aiProtectedCount ?? 0} active</strong>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Real-time Console Log Terminal -->
        {#if logs.length > 0}
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span class="flex items-center gap-1.5">
                <Terminal size={12} />
                <span>Pipeline Event Log</span>
              </span>
              <span>{logs.length} entries</span>
            </div>
            <div
              class="p-3.5 rounded-lg bg-[#1E1D1B] text-stone-200 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto space-y-1 select-text [scrollbar-width:thin]"
            >
              {#each logs as logLine}
                <div class="flex gap-2">
                  <span class="text-amber-500 select-none">&gt;</span>
                  <span class="break-all">{logLine}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer Action Bar -->
      <div class="px-6 py-4 bg-[#EAE6DE] border-t border-[#DDD9CE] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          {#if stage === 'completed' || stage === 'error'}
            <button
              type="button"
              onclick={resetState}
              class="px-3 py-1.5 rounded text-xs font-mono text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#DDD9CE] transition-colors cursor-pointer"
            >
              Reset / Configure
            </button>
          {/if}
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            onclick={handleClose}
            disabled={stage === 'executing'}
            class="px-4 py-2 rounded text-xs font-mono text-stone-600 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-30"
          >
            {stage === 'completed' ? 'Done' : 'Cancel'}
          </button>

          {#if stage === 'idle' || stage === 'error'}
            <!-- Dry Run Action -->
            <button
              type="button"
              onclick={() => runPipeline('dry-run')}
              class="px-3.5 py-2 rounded bg-white hover:bg-stone-100 text-stone-800 text-xs font-mono border border-[#DDD9CE] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Simulate run without writing to disk"
            >
              <Eye size={13} />
              <span>Dry Run</span>
            </button>

            <!-- One-Click Full Activation -->
            <button
              type="button"
              onclick={() => runPipeline('full')}
              class="px-4.5 py-2 rounded bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] text-xs font-mono font-medium shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play size={13} />
              <span>Activate Full Pipeline</span>
            </button>
          {:else if stage === 'executing'}
            <button
              type="button"
              disabled
              class="px-4 py-2 rounded bg-stone-300 text-stone-600 text-xs font-mono flex items-center gap-2 cursor-not-allowed"
            >
              <RefreshCw size={13} class="animate-spin" />
              <span>Processing...</span>
            </button>
          {:else if stage === 'completed'}
            <button
              type="button"
              onclick={handleClose}
              class="px-4.5 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-mono font-medium shadow-xs transition-colors cursor-pointer"
            >
              Finished
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
