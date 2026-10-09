<script lang="ts">
  import {
    Shield,
    HardDrive,
    Sparkles,
    Sliders,
    Layers,
    Play,
    RefreshCw,
    CheckCircle2,
    FileImage,
    Bot,
    ExternalLink,
    AlertTriangle,
    Check,
    Save,
    Lock,
    FolderGit2,
    Wrench,
    CheckCircle
  } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';
  import PipelineActivationModal from '$lib/components/studio/PipelineActivationModal.svelte';
  import type { AiDeterrenceConfig } from '$lib/types';

  let { data } = $props();

  let pipelineStatus = $state(data.pipelineStatus);
  let pipelineConfig = $state(data.pipelineConfig || {});
  let resolvedVault = $state(data.resolvedVault || {});
  let isModalOpen = $state(false);
  let isRefreshing = $state(false);

  // Vault Configuration & First-Time Setup State
  let customVaultInput = $state(data.pipelineConfig?.vaultPath || '');
  let isSavingVaultConfig = $state(false);
  let saveVaultSuccess = $state(false);
  let saveVaultError = $state<string | null>(null);

  let isRunningSetup = $state(false);
  let setupSuccess = $state(false);
  let setupLogs = $state<string[]>([]);
  let setupError = $state<string | null>(null);

  async function handleSaveVaultConfig() {
    isSavingVaultConfig = true;
    saveVaultError = null;
    saveVaultSuccess = false;
    try {
      const res = await fetch('/api/studio/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-config',
          vaultPath: customVaultInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        saveVaultSuccess = true;
        pipelineConfig = json.config;
        pipelineStatus = json.status;
        resolvedVault = json.resolvedVault;
        setTimeout(() => {
          saveVaultSuccess = false;
        }, 3000);
        invalidateAll();
      } else {
        saveVaultError = json.error || 'Failed to save vault configuration';
      }
    } catch (e: any) {
      saveVaultError = e.message || 'Network error saving vault configuration';
    } finally {
      isSavingVaultConfig = false;
    }
  }

  async function handleRunFirstTimeSetup(targetPath?: string) {
    isRunningSetup = true;
    setupError = null;
    setupSuccess = false;
    setupLogs = [];
    try {
      const pathToSend = targetPath !== undefined ? targetPath : customVaultInput.trim();
      const res = await fetch('/api/studio/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup-vault',
          vaultPath: pathToSend || '.pipeline-vault',
        }),
      });
      const json = await res.json();
      if (Array.isArray(json.logs)) {
        setupLogs = json.logs;
      }
      if (res.ok && json.success) {
        setupSuccess = true;
        customVaultInput = json.config?.vaultPath || '';
        pipelineConfig = json.config;
        pipelineStatus = json.status;
        resolvedVault = json.resolvedVault;
        invalidateAll();
      } else {
        setupError = json.error || 'Setup failed';
      }
    } catch (e: any) {
      setupError = e.message || 'Network error executing setup';
    } finally {
      isRunningSetup = false;
    }
  }

  // Dedicated AI Deterrence State
  let aiSettings = $state<AiDeterrenceConfig>(
    JSON.parse(JSON.stringify(data.aiSettings || {}))
  );
  let isSavingAi = $state(false);
  let saveAiSuccess = $state(false);
  let saveAiError = $state<string | null>(null);

  async function handleSaveAi() {
    isSavingAi = true;
    saveAiError = null;
    saveAiSuccess = false;

    try {
      const formData = new FormData();
      formData.set('payload', JSON.stringify(aiSettings));

      const res = await fetch('?/saveAiSettings', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.type !== 'failure') {
        saveAiSuccess = true;
        setTimeout(() => {
          saveAiSuccess = false;
        }, 3000);
        invalidateAll();
      } else {
        saveAiError = json?.data?.error || 'Failed to save AI deterrence configuration';
      }
    } catch (e: any) {
      saveAiError = e.message || 'Network error saving AI settings';
    } finally {
      isSavingAi = false;
    }
  }

  async function refreshDiagnostics() {
    isRefreshing = true;
    try {
      const res = await fetch('/api/studio/pipeline');
      const json = await res.json();
      if (json.success && json.status) {
        pipelineStatus = json.status;
      }
    } catch (e) {
      console.error('Failed to refresh diagnostics', e);
    } finally {
      isRefreshing = false;
    }
  }

  function handleModalSuccess() {
    refreshDiagnostics();
    invalidateAll();
  }

  function formatBytes(bytes: number) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
</script>

<svelte:head>
  <title>AI Deterrence &amp; Media Protocol | Studio</title>
</svelte:head>

<div class="h-full overflow-y-auto p-8 md:p-12 max-w-6xl mx-auto space-y-10 [scrollbar-width:thin] select-none text-[#2C2B29]">
  <!-- Header Banner -->
  <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DED4] pb-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
        <Shield size={13} />
        <span>Protocol &amp; Security Workbench</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-serif tracking-tight text-[#2C2B29]">
        AI Deterrence &amp; Media Pipeline
      </h1>
      <p class="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl leading-relaxed">
        Adversarial style protection (Glaze / Nightshade) for fine art, external storage vault staging, machine-readable EU AI Act / TDMRep rights reservations, and contextual 4K Retina WebP compression.
      </p>
    </div>

    <!-- Quick Action Bar -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        type="button"
        onclick={refreshDiagnostics}
        disabled={isRefreshing}
        class="p-2.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-[#DDD9CE] shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
        title="Refresh hardware & media status"
      >
        <RefreshCw size={13} class={isRefreshing ? 'animate-spin' : ''} />
        <span class="hidden sm:inline">Refresh</span>
      </button>

      <button
        type="button"
        onclick={() => (isModalOpen = true)}
        class="px-4 py-2.5 rounded-lg bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] text-xs font-mono font-medium shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Play size={13} />
        <span>Activate Pipeline</span>
      </button>
    </div>
  </header>

  <!-- Top System Telemetry Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Telemetry 1: Storage Vault / SSD -->
    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <HardDrive size={13} class={pipelineStatus.t7Detected ? 'text-emerald-600' : 'text-stone-400'} />
          <span>{pipelineStatus.vaultLabel || 'Storage Vault'}</span>
        </span>
        {#if pipelineStatus.t7Detected}
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Vault Online"></span>
        {:else}
          <span class="w-2 h-2 rounded-full bg-stone-300" title="Vault Offline"></span>
        {/if}
      </div>
      <div class="text-xl font-serif text-[#2C2B29] font-medium">
        {pipelineStatus.t7Detected ? 'Vault Ready' : 'Unmounted / Not Configured'}
      </div>
      <p class="text-[11px] font-serif text-stone-500 truncate" title={pipelineStatus.t7Path || 'No vault path'}>
        {pipelineStatus.t7Path ? pipelineStatus.t7Path : 'Run First-Time Setup'}
      </p>
    </div>

    <!-- Telemetry 2: Glaze / Nightshade Engine -->
    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <Shield size={13} class="text-amber-600" />
          <span>AI Protection</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
          Active
        </span>
      </div>
      <div class="text-xl font-serif text-[#2C2B29] font-medium">
        {pipelineStatus.aiProtectedCount} Protected Artworks
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        TDMRep + Adversarial perturbation
      </p>
    </div>

    <!-- Telemetry 3: High-DPI WebP Assets -->
    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <FileImage size={13} class="text-blue-600" />
          <span>WebP Assets</span>
        </span>
        <span class="text-[10px] uppercase font-mono text-stone-400">Contextual</span>
      </div>
      <div class="text-xl font-serif text-[#2C2B29] font-medium">
        {pipelineStatus.webpImagesCount} WebP Images
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        4K Retina lossless/lossy
      </p>
    </div>
  </div>

  <!-- SECTION: Storage Vault Configuration & First-Time Setup -->
  <section class="p-6 md:p-8 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DE] pb-4">
      <div>
        <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
          <HardDrive size={13} />
          <span>Pipeline Infrastructure</span>
        </div>
        <h2 class="text-xl font-serif font-medium text-[#2C2B29] mt-1">
          Storage Vault &amp; Environment Setup
        </h2>
        <p class="text-xs font-serif text-stone-600 mt-1">
          Configure where adversarial perturbation staging (Glaze/Nightshade) and cold raw master archives are stored.
        </p>
      </div>

      <div class="flex items-center gap-2">
        {#if saveVaultSuccess}
          <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <Check size={12} />
            <span>Path Saved</span>
          </div>
        {/if}
        {#if saveVaultError}
          <div class="flex items-center gap-1.5 text-xs font-mono text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
            <AlertTriangle size={12} />
            <span class="truncate max-w-[200px]">{saveVaultError}</span>
          </div>
        {/if}
        <button
          type="button"
          onclick={handleSaveVaultConfig}
          disabled={isSavingVaultConfig}
          class="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-[#DDD9CE] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={13} />
          <span>{isSavingVaultConfig ? 'Saving...' : 'Save Vault Path'}</span>
        </button>

        <button
          type="button"
          onclick={() => handleRunFirstTimeSetup()}
          disabled={isRunningSetup}
          class="px-4 py-2 bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Wrench size={13} class={isRunningSetup ? 'animate-spin' : ''} />
          <span>{isRunningSetup ? 'Setting Up...' : 'First-Time Setup'}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-mono text-stone-700 block font-medium" for="vault-path-input">
            Vault Directory Location
          </label>
          <div class="flex items-center gap-2">
            <input
              id="vault-path-input"
              type="text"
              bind:value={customVaultInput}
              placeholder="e.g. /Volumes/MyExternalSSD/ai-deterrence or ./.pipeline-vault"
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-2 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
            />
          </div>
          <p class="text-[11px] font-serif text-stone-500">
            Leave empty to auto-detect mounted drives, or set a path to an external disk or local folder.
          </p>
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <span class="text-[11px] font-mono text-stone-400">Quick Fill:</span>
          <button
            type="button"
            onclick={() => { customVaultInput = '.pipeline-vault'; }}
            class="px-2.5 py-1 rounded bg-[#FAF8F5] hover:bg-stone-200 border border-[#DDD9CE] text-[11px] font-mono text-stone-700 cursor-pointer"
          >
            Local Folder (.pipeline-vault)
          </button>
          <button
            type="button"
            onclick={() => { customVaultInput = '/Volumes/T7/code/ai-deterrence'; }}
            class="px-2.5 py-1 rounded bg-[#FAF8F5] hover:bg-stone-200 border border-[#DDD9CE] text-[11px] font-mono text-stone-700 cursor-pointer"
          >
            External Drive (/Volumes/T7)
          </button>
          {#if customVaultInput}
            <button
              type="button"
              onclick={() => { customVaultInput = ''; }}
              class="px-2.5 py-1 rounded bg-stone-50 hover:bg-stone-100 border border-[#DDD9CE] text-[11px] font-mono text-stone-500 cursor-pointer"
            >
              Clear (Auto-Detect)
            </button>
          {/if}
        </div>
      </div>

      <!-- Current Vault Status Card -->
      <div class="p-4 rounded-lg bg-[#FAF8F5] border border-[#DDD9CE] space-y-2.5 text-xs font-mono">
        <div class="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
          Active Status
        </div>
        <div class="flex items-center gap-2">
          {#if pipelineStatus.vaultReady}
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-stone-900 font-medium">Ready ({pipelineStatus.vaultSource})</span>
          {:else}
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-amber-800 font-medium">Not Mounted / Uninitialized</span>
          {/if}
        </div>
        <div class="text-[11px] text-stone-600 truncate" title={pipelineStatus.t7Path || 'None'}>
          Path: <code class="text-stone-800">{pipelineStatus.t7Path || 'Not set'}</code>
        </div>
        <div class="pt-2 border-t border-stone-200 text-[11px] font-serif text-stone-500">
          Subfolders: <code class="font-mono text-[10px]">stage-in/</code>, <code class="font-mono text-[10px]">stage-out/</code>, <code class="font-mono text-[10px]">masters-archive/</code>, <code class="font-mono text-[10px]">zines/</code>
        </div>
      </div>
    </div>

    {#if setupSuccess || setupError || setupLogs.length > 0}
      <div class="p-4 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs space-y-2">
        <div class="flex items-center justify-between pb-2 border-b border-stone-800">
          <span class="text-amber-400 font-bold">First-Time Setup Output</span>
          {#if setupSuccess}
            <span class="text-emerald-400">✓ Ready</span>
          {:else if setupError}
            <span class="text-red-400">✗ Failed</span>
          {/if}
        </div>
        {#if setupError}
          <div class="text-red-400">{setupError}</div>
        {/if}
        <div class="space-y-1 max-h-36 overflow-y-auto text-[11px] text-stone-300">
          {#each setupLogs as log}
            <div>{log}</div>
          {/each}
        </div>
      </div>
    {/if}
  </section>

  <!-- SECTION: AI Rights Reservation & Crawler Rules -->
  <section class="p-6 md:p-8 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DE] pb-4">
      <div>
        <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-500">
          <Bot size={13} class="text-amber-700" />
          <span>AI Governance &amp; Machine-Readable Signals</span>
        </div>
        <h2 class="text-xl font-serif font-medium text-[#2C2B29] mt-1">
          Declarative AI Rights Reservation &amp; Training Defenses
        </h2>
        <p class="text-xs font-serif text-stone-600 mt-1">
          Configured in <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">content/settings/ai-deterrence.json</code>.
        </p>
      </div>

      <!-- Save Button -->
      <div class="flex items-center gap-3">
        {#if saveAiSuccess}
          <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <Check size={12} />
            <span>Saved</span>
          </div>
        {/if}
        {#if saveAiError}
          <div class="flex items-center gap-1.5 text-xs font-mono text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
            <AlertTriangle size={12} />
            <span class="truncate max-w-[200px]">{saveAiError}</span>
          </div>
        {/if}
        <button
          type="button"
          onclick={handleSaveAi}
          disabled={isSavingAi}
          class="px-4 py-2 bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={13} />
          <span>{isSavingAi ? 'Saving...' : 'Save AI Policy'}</span>
        </button>
      </div>
    </div>

    <!-- AI Settings Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4 bg-[#FAF8F5] p-5 rounded-lg border border-[#DDD9CE]">
        <label class="flex items-start justify-between gap-3 cursor-pointer">
          <div class="space-y-0.5">
            <span class="text-xs font-mono font-medium text-stone-900 block">
              EU Copyright Directive Art. 4 &amp; W3C TDMRep
            </span>
            <p class="text-[11px] font-serif text-stone-600">
              Serves <code class="font-mono bg-stone-200 px-1 rounded">TDM-Reservation: 1</code> HTTP headers and hosts <code class="font-mono bg-stone-200 px-1 rounded">/.well-known/tdmrep.json</code> for legal compliance under EU AI Act.
            </p>
          </div>
          <input
            type="checkbox"
            bind:checked={aiSettings.reserveRights}
            class="w-4 h-4 mt-1 text-amber-700 rounded border-stone-300 focus:ring-amber-600 accent-stone-900 cursor-pointer"
          />
        </label>

        <div class="h-px bg-stone-200 my-2"></div>

        <label class="flex items-start justify-between gap-3 cursor-pointer">
          <div class="space-y-0.5">
            <span class="text-xs font-mono font-medium text-stone-900 block">
              Block Known AI Model Training Crawlers
            </span>
            <p class="text-[11px] font-serif text-stone-600">
              Disallows GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, etc., and adds <code class="font-mono bg-stone-200 px-1 rounded">X-Robots-Tag: noai, noimageai</code>.
            </p>
          </div>
          <input
            type="checkbox"
            bind:checked={aiSettings.blockTrainingCrawlers}
            class="w-4 h-4 mt-1 text-amber-700 rounded border-stone-300 focus:ring-amber-600 accent-stone-900 cursor-pointer"
          />
        </label>
      </div>

      <div class="space-y-4">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-mono text-stone-600 block">TDM Policy URL Path</label>
              <span class="text-[10px] font-mono text-stone-400">Adapts to active domain automatically</span>
            </div>
            <input
              type="text"
              bind:value={aiSettings.tdmPolicyUrl}
              placeholder="/rights"
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Policy Effective Date</label>
            <input
              type="text"
              bind:value={aiSettings.effectiveDate}
              placeholder="October 2026"
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Custom Robots.txt Crawler Exceptions</label>
            <textarea
              bind:value={aiSettings.customRobotsRules}
              rows={2}
              placeholder="e.g. Disallow: /private-archive/"
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500 resize-none"
            ></textarea>
          </div>

          <div class="pt-1 flex items-center justify-between text-xs font-mono">
            <a
              href="/rights"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-950 underline"
            >
              <ExternalLink size={12} />
              <span>Preview Public /rights Page</span>
            </a>

            <a
              href="/.well-known/tdmrep.json"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 underline"
            >
              <ExternalLink size={12} />
              <span>/.well-known/tdmrep.json</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Live Policy Document Markdown Editor -->
      <div class="pt-6 border-t border-[#EAE6DE] space-y-3">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <label class="text-xs font-mono uppercase tracking-wider text-stone-800 font-semibold block">
              TDM Policy Document Text (content/settings/tdm-policy.md)
            </label>
            <p class="text-[11px] font-serif text-stone-500">
              Customized declaration of rights covering fine art, photography, critical essays, and design systems.
            </p>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">Markdown Format</span>
        </div>

        <textarea
          bind:value={aiSettings.tdmPolicyContent}
          rows={14}
          class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded-lg p-3 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500 resize-y leading-relaxed"
          placeholder="# Declaration of Intellectual Rights..."
        ></textarea>
      </div>
    </section>

  <!-- SECTION: Media Conversion Pipeline Diagnostic -->
  <section class="space-y-4">
    <div class="border-b border-[#E2DED4] pb-2">
      <h2 class="text-xs font-mono uppercase tracking-widest text-stone-600 font-semibold">
        Media Conversion Pipeline Diagnostic
      </h2>
    </div>

    {#if pipelineStatus.rawFiles.length === 0}
      <div class="p-8 border border-dashed border-[#DDD9CE] rounded-xl text-center space-y-2 bg-white/40">
        <CheckCircle2 size={24} class="mx-auto text-emerald-600" />
        <div class="text-xs font-mono uppercase tracking-wider text-stone-700 font-medium">
          Media Assets Fully Reconciled
        </div>
        <p class="text-xs font-serif text-stone-500 max-w-sm mx-auto">
          All images in <code class="font-mono bg-stone-100 px-1 rounded">static/images/</code> are current WebP format with contextual compression applied.
        </p>
      </div>
    {:else}
      <div class="bg-white border border-[#E2DED4] rounded-xl overflow-hidden divide-y divide-[#EAE6DE]">
        {#each pipelineStatus.rawFiles as file}
          <div class="p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="font-mono text-xs font-medium text-stone-800 truncate" title={file.name}>
                {file.name}
              </span>
              {#if file.classification === 'art'}
                <span class="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                  🛡️ Fine Art
                </span>
              {:else if file.classification === 'photography'}
                <span class="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                  📷 Photography (4K)
                </span>
              {:else if file.classification === 'product_ui'}
                <span class="text-[10px] font-mono uppercase bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">
                  💻 UI / Design
                </span>
              {/if}
            </div>

            <div class="flex items-center gap-4 shrink-0 font-mono text-xs text-stone-500">
              <span>{file.preset}</span>
              <span class="text-stone-700 font-medium">{formatBytes(file.size)}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<!-- Activation Modal Mount -->
<PipelineActivationModal
  isOpen={isModalOpen}
  {pipelineStatus}
  onclose={() => (isModalOpen = false)}
  onsuccess={handleModalSuccess}
/>
