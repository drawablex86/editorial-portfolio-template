<script lang="ts">
  import {
    Globe,
    Save,
    AlertTriangle,
    Check,
    ExternalLink,
    BarChart2,
    Eye,
    Settings,
    HelpCircle
  } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';
  import type { GoatCounterConfig } from '$lib/types';

  let { data } = $props();

  // Analytics State
  let goatCounter = $state<GoatCounterConfig>({
    enabled: false,
    code: '',
    domain: '',
    allowFrame: false,
    email: ''
  });

  $effect(() => {
    goatCounter = JSON.parse(JSON.stringify(data.seoSettings?.goatCounter || {
      enabled: false,
      code: '',
      domain: '',
      allowFrame: false,
      email: ''
    }));
  });

  let isSaving = $state(false);
  let saveSuccess = $state(false);
  let saveError = $state<string | null>(null);

  async function handleSaveAnalytics() {
    isSaving = true;
    saveError = null;
    saveSuccess = false;

    try {
      const formData = new FormData();
      formData.set('payload', JSON.stringify({ goatCounter }));

      const res = await fetch('?/saveAnalytics', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.type !== 'failure') {
        saveSuccess = true;
        setTimeout(() => {
          saveSuccess = false;
        }, 3000);
        invalidateAll();
      } else {
        saveError = json?.data?.error || 'Failed to save analytics configuration';
      }
    } catch (e: any) {
      saveError = e.message || 'Network exception saving analytics settings';
    } finally {
      isSaving = false;
    }
  }

  function getDebugScript(): string {
    const url = getTrackingUrl();
    const code = goatCounter.code;
    const allowFrame = goatCounter.allowFrame;
    return `<!-- GoatCounter Analytics -->
<scr` + `ipt async src="${url}" data-goatcounter="${code}" data-goatcounter-settings='{"allow_frame":${allowFrame}}'></scr` + `ipt>`;
  }

  function getDashboardUrl(): string {
    if (!goatCounter.code) return '';
    const baseDomain = goatCounter.domain || `${goatCounter.code}.goatcounter.com`;
    return `https://${baseDomain}/dashboard`;
  }

  function getTrackingUrl(): string {
    if (!goatCounter.code) return '';
    const baseDomain = goatCounter.domain || `${goatCounter.code}.goatcounter.com`;
    return `https://${baseDomain}/count.js`;
  }

  function formatUrl(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname + u.pathname;
    } catch {
      return url;
    }
  }
</script>

<svelte:head>
  <title>Analytics (GoatCounter) | Studio Protocol</title>
</svelte:head>

<div class="h-full overflow-y-auto p-8 md:p-12 max-w-6xl mx-auto space-y-10 [scrollbar-width:thin] select-none text-[#2C2B29]">
  <!-- Header Banner -->
  <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DED4] pb-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
        <BarChart2 size={13} />
        <span>Protocol / Analytics</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-serif tracking-tight text-[#2C2B29]">
        Site Analytics & GoatCounter
      </h1>
      <p class="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl leading-relaxed">
        Configure privacy-friendly GoatCounter analytics. No cookies, no personal data, GDPR compliant by default.
        Embed the dashboard below for quick access to visitor metrics.
      </p>
    </div>

    <!-- Quick Action Bar -->
    <div class="flex items-center gap-3 shrink-0">
      {#if saveSuccess}
        <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          <Check size={12} />
          <span>Saved</span>
        </div>
      {/if}
      {#if saveError}
        <div class="flex items-center gap-1.5 text-xs font-mono text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
          <AlertTriangle size={12} />
          <span class="truncate max-w-[200px]">{saveError}</span>
        </div>
      {/if}
      <button
        type="button"
        onclick={handleSaveAnalytics}
        disabled={isSaving}
        class="px-4 py-2 bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        <Save size={13} />
        <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
      </button>
    </div>
  </header>

  <!-- Top Telemetry Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <BarChart2 size={13} class="text-emerald-600" />
          <span>Tracking Status</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded {goatCounter.enabled && goatCounter.code
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-stone-100 text-stone-600'}">
          {goatCounter.enabled && goatCounter.code ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div class="text-base sm:text-lg font-serif text-[#2C2B29] font-medium truncate">
        {goatCounter.enabled && goatCounter.code ? 'Collecting page views' : 'Not configured'}
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        Enable and set site code to activate
      </p>
    </div>

    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <Globe size={13} class="text-blue-600" />
          <span>Site Code</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
          {goatCounter.code || 'Not set'}
        </span>
      </div>
      <div class="text-base sm:text-lg font-serif text-[#2C2B29] font-medium truncate">
        {goatCounter.code ? `${goatCounter.code}.goatcounter.com` : '—'}
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        Your GoatCounter site identifier
      </p>
    </div>

    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <Settings size={13} class="text-amber-600" />
          <span>Account Email</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
          Linked
        </span>
      </div>
      <div class="text-base sm:text-lg font-serif text-[#2C2B29] font-medium truncate">
        {goatCounter.email || 'your@email.com'}
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        GoatCounter account association
      </p>
    </div>
  </div>

  <!-- Configuration Form -->
  <section class="p-6 md:p-8 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-8">
    <div class="border-b border-[#EAE6DE] pb-4">
      <h2 class="text-xl font-serif font-medium text-[#2C2B29]">
        GoatCounter Configuration
      </h2>
      <p class="text-xs font-serif text-stone-600 mt-1">
        Managed in <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">content/settings/seo.json</code> under <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">goatCounter</code>.
      </p>
    </div>

    <div class="space-y-6">
      <!-- Enabled Toggle -->
      <div class="space-y-2 p-4 bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <div class="flex items-center justify-between">
          <div>
            <label for="enable-analytics" class="text-xs font-mono text-stone-600 block mb-1">Enable Analytics Tracking</label>
            <p class="text-[11px] font-serif text-stone-500">
              Inject GoatCounter script on all public pages. Respects Do Not Track and excludes localhost.
            </p>
          </div>
          <button
            type="button"
            onclick={() => { goatCounter.enabled = !goatCounter.enabled; }}
            class="relative w-14 h-7 rounded-full border-2 transition-colors {goatCounter.enabled
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-stone-300 border-stone-300'}"
            aria-label={goatCounter.enabled ? 'Disable analytics' : 'Enable analytics'}
          >
            <span class="absolute top-0.5 transition-transform duration-200 {goatCounter.enabled
              ? 'left-6'
              : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow-md"></span>
          </button>
        </div>
      </div>

      <!-- Site Code -->
      <div class="space-y-1">
        <label for="analytics-code" class="text-xs font-mono text-stone-600 block">Site Code</label>
        <input
          id="analytics-code"
          type="text"
          bind:value={goatCounter.code}
          placeholder="e.g., yourname"
          class="w-full max-w-xs bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
          disabled={!goatCounter.enabled}
        />
        <p class="text-[11px] font-serif text-stone-500">
          Your GoatCounter site code (subdomain). Creates dashboard at <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">{goatCounter.code ? `${goatCounter.code}.goatcounter.com` : 'yourcode.goatcounter.com'}</code>
        </p>
      </div>

      <!-- Custom Domain (Optional) -->
      <div class="space-y-1">
        <label for="analytics-domain" class="text-xs font-mono text-stone-600 block">Custom Domain (Optional)</label>
        <input
          id="analytics-domain"
          type="text"
          bind:value={goatCounter.domain}
          placeholder="analytics.example.com"
          class="w-full max-w-xs bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
          disabled={!goatCounter.enabled}
        />
        <p class="text-[11px] font-serif text-stone-500">
          If using a custom domain (CNAME to goatcounter.com), enter it here. Leave empty for default <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">{goatCounter.code}.goatcounter.com</code>.
        </p>
      </div>

      <!-- Allow Frame -->
      <div class="space-y-2 p-4 bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <div class="flex items-center justify-between">
          <div>
            <label for="allow-frame" class="text-xs font-mono text-stone-600 block mb-1">Allow Dashboard Embedding</label>
            <p class="text-[11px] font-serif text-stone-500">
              Required to embed the GoatCounter dashboard in this Studio page via iframe.
            </p>
          </div>
          <button
            type="button"
            onclick={() => { goatCounter.allowFrame = !goatCounter.allowFrame; }}
            class="relative w-14 h-7 rounded-full border-2 transition-colors {goatCounter.allowFrame
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-stone-300 border-stone-300'}"
            aria-label={goatCounter.allowFrame ? 'Disable iframe embedding' : 'Enable iframe embedding'}
          >
            <span class="absolute top-0.5 transition-transform duration-200 {goatCounter.allowFrame
              ? 'left-6'
              : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow-md"></span>
          </button>
        </div>
      </div>

      <!-- Account Email -->
      <div class="space-y-1">
        <label for="analytics-email" class="text-xs font-mono text-stone-600 block">Account Email</label>
        <input
          id="analytics-email"
          type="email"
          bind:value={goatCounter.email}
          placeholder="your@email.com"
          class="w-full max-w-xs bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
          disabled={!goatCounter.enabled}
        />
        <p class="text-[11px] font-serif text-stone-500">
          Email associated with your GoatCounter account (for reference).
        </p>
      </div>
    </div>
  </section>

  <!-- Embedded Dashboard -->
  <section class="p-6 md:p-8 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-6">
    <div class="flex items-center justify-between border-b border-[#EAE6DE] pb-4">
      <div>
        <h2 class="text-xl font-serif font-medium text-[#2C2B29]">
          Live Dashboard
        </h2>
        <p class="text-xs font-serif text-stone-600 mt-1">
          Embedded GoatCounter dashboard. Requires <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">allowFrame: true</code> in GoatCounter site settings.
        </p>
      </div>
      {#if goatCounter.enabled && goatCounter.code}
        <a
          href={getDashboardUrl()}
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <ExternalLink size={12} />
          <span>Open Full Dashboard</span>
        </a>
      {/if}
    </div>

    {#if !goatCounter.enabled || !goatCounter.code}
      <div class="p-8 text-center bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <HelpCircle size={48} class="mx-auto text-stone-300 mb-3" />
        <h3 class="text-lg font-serif text-stone-700 mb-2">Analytics Not Configured</h3>
        <p class="text-sm font-serif text-stone-500 max-w-md mx-auto">
          Enable tracking and enter your GoatCounter site code above to view the embedded dashboard here.
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        <!-- Dashboard Iframe -->
        <div class="bg-[#FAF8F5] rounded-lg border border-[#DDD9CE] overflow-hidden">
          <iframe
            src={getDashboardUrl()}
            class="w-full h-[600px] border-0"
            title="GoatCounter Analytics Dashboard"
            allow="fullscreen"
          ></iframe>
        </div>

        <!-- Quick Links -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={getDashboardUrl()}
            target="_blank"
            rel="noopener noreferrer"
            class="p-3 rounded border border-[#DDD9CE] bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-xs font-mono text-stone-700 transition-colors"
          >
            <div>
              <div class="font-medium">Dashboard</div>
              <div class="text-[10px] text-stone-500 truncate">{formatUrl(getDashboardUrl())}</div>
            </div>
            <ExternalLink size={13} class="text-stone-400" />
          </a>

          <a
            href="https://goatcounter.com"
            target="_blank"
            rel="noopener noreferrer"
            class="p-3 rounded border border-[#DDD9CE] bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-xs font-mono text-stone-700 transition-colors"
          >
            <div>
              <div class="font-medium">GoatCounter Account</div>
              <div class="text-[10px] text-stone-500">Manage site settings, allow_frame, exports</div>
            </div>
            <ExternalLink size={13} class="text-stone-400" />
          </a>
        </div>

        <!-- Debug Info -->
        <details class="border-t border-[#EAE6DE] pt-4">
          <summary class="text-xs font-mono text-stone-500 cursor-pointer hover:text-stone-700">
            Debug: Tracking Script Details
          </summary>
          <div class="mt-3 p-3 bg-[#1E1D1B] rounded text-[10px] font-mono text-stone-200 overflow-x-auto">
            <pre>{getDebugScript()}</pre>
          </div>
        </details>
      </div>
    {/if}
  </section>

  <!-- Help / Documentation -->
  <section class="p-6 md:p-8 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-6">
    <div class="border-b border-[#EAE6DE] pb-4">
      <h2 class="text-xl font-serif font-medium text-[#2C2B29]">
        Quick Start Guide
      </h2>
    </div>

    <div class="space-y-4 text-sm font-serif text-stone-600">
      <div class="p-4 bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
          <Settings size={12} /> 1. Create GoatCounter Account
        </h3>
        <p>Visit <a href="https://goatcounter.com" target="_blank" rel="noopener" class="underline text-amber-700 hover:text-amber-900">goatcounter.com</a> and sign up with <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">your@email.com</code>. Choose a site code (e.g., <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">yourname</code>).</p>
      </div>

      <div class="p-4 bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
          <Eye size={12} /> 2. Enable Frame Embedding
        </h3>
        <p>In GoatCounter site settings, enable <strong>Allow framing</strong> (allow_frame) so the dashboard can be embedded in this Studio page.</p>
      </div>

      <div class="p-4 bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
          <BarChart2 size={12} /> 3. Configure in Studio
        </h3>
        <p>Enter your site code above, enable tracking, and save. The script will be injected on all public pages (excluding localhost).</p>
      </div>

      <div class="p-4 bg-[#FAF8F5] rounded-lg border border-[#DDD9CE]">
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
          <Globe size={12} /> 4. Custom Domain (Optional)
        </h3>
        <p>In GoatCounter settings, add a CNAME record (e.g., <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">analytics.yourdomain.com</code>) and enter it in the Custom Domain field above.</p>
      </div>
    </div>
  </section>
</div>
