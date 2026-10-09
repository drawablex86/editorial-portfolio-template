<script lang="ts">
  import {
    Globe,
    Save,
    Share2,
    Compass,
    Layers,
    Plus,
    Trash2,
    ExternalLink,
    AlertTriangle,
    Check,
    Eye
  } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';
  import type { SeoSettings } from '$lib/types';

  let { data } = $props();

  // SEO Workbench State
  let seoSettings = $state<SeoSettings>(
    JSON.parse(JSON.stringify(data.seoSettings || {}))
  );
  let isSavingSeo = $state(false);
  let saveSeoSuccess = $state(false);
  let saveSeoError = $state<string | null>(null);

  // New redirect rule input
  let newRedirectFrom = $state('');
  let newRedirectTo = $state('');
  let newRedirectStatus = $state<301 | 302>(301);

  // New sameAs input
  let newSameAsUrl = $state('');

  function addRedirect() {
    if (!newRedirectFrom.trim() || !newRedirectTo.trim()) return;
    if (!Array.isArray(seoSettings.redirects)) {
      seoSettings.redirects = [];
    }
    seoSettings.redirects = [
      ...seoSettings.redirects,
      {
        from: newRedirectFrom.trim().startsWith('/') ? newRedirectFrom.trim() : `/${newRedirectFrom.trim()}`,
        to: newRedirectTo.trim().startsWith('/') ? newRedirectTo.trim() : `/${newRedirectTo.trim()}`,
        status: newRedirectStatus,
      },
    ];
    newRedirectFrom = '';
    newRedirectTo = '';
  }

  function removeRedirect(index: number) {
    seoSettings.redirects = seoSettings.redirects.filter((_, i) => i !== index);
  }

  function addSameAs() {
    if (!newSameAsUrl.trim()) return;
    if (!Array.isArray(seoSettings.author.sameAs)) {
      seoSettings.author.sameAs = [];
    }
    seoSettings.author.sameAs = [...seoSettings.author.sameAs, newSameAsUrl.trim()];
    newSameAsUrl = '';
  }

  function removeSameAs(index: number) {
    seoSettings.author.sameAs = seoSettings.author.sameAs.filter((_, i) => i !== index);
  }

  async function handleSaveSeo() {
    isSavingSeo = true;
    saveSeoError = null;
    saveSeoSuccess = false;

    try {
      const formData = new FormData();
      formData.set('payload', JSON.stringify(seoSettings));

      const res = await fetch('?/saveSeo', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.type !== 'failure') {
        saveSeoSuccess = true;
        setTimeout(() => {
          saveSeoSuccess = false;
        }, 3000);
        invalidateAll();
      } else {
        saveSeoError = json?.data?.error || 'Failed to save SEO configuration';
      }
    } catch (e: any) {
      saveSeoError = e.message || 'Network exception saving SEO settings';
    } finally {
      isSavingSeo = false;
    }
  }
</script>

<svelte:head>
  <title>Site SEO &amp; Meta Workbench | Studio Protocol</title>
</svelte:head>

<div class="h-full overflow-y-auto p-8 md:p-12 max-w-6xl mx-auto space-y-10 [scrollbar-width:thin] select-none text-[#2C2B29]">
  <!-- Header Banner -->
  <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DED4] pb-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700">
        <Globe size={13} />
        <span>Protocol / SEO Workbench</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-serif tracking-tight text-[#2C2B29]">
        Site-Wide SEO &amp; Discovery Engine
      </h1>
      <p class="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl leading-relaxed">
        Control canonical site titles, metadata templates, Schema.org author knowledge card, dynamic XML sitemaps, OpenGraph image fallbacks, and server-side redirects.
      </p>
    </div>

    <!-- Quick Action Bar -->
    <div class="flex items-center gap-3 shrink-0">
      {#if saveSeoSuccess}
        <div class="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          <Check size={12} />
          <span>Saved</span>
        </div>
      {/if}
      {#if saveSeoError}
        <div class="flex items-center gap-1.5 text-xs font-mono text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
          <AlertTriangle size={12} />
          <span class="truncate max-w-[200px]">{saveSeoError}</span>
        </div>
      {/if}
      <button
        type="button"
        onclick={handleSaveSeo}
        disabled={isSavingSeo}
        class="px-4 py-2 bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        <Save size={13} />
        <span>{isSavingSeo ? 'Saving...' : 'Save Settings'}</span>
      </button>
    </div>
  </header>

  <!-- Top System Telemetry Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <Globe size={13} class="text-emerald-600" />
          <span>Canonical Host</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Verified</span>
      </div>
      <div class="text-base sm:text-lg font-serif text-[#2C2B29] font-medium truncate">
        {seoSettings.siteUrl || 'https://example.com'}
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        Base domain for canonical links &amp; sitemaps
      </p>
    </div>

    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <Compass size={13} class="text-blue-600" />
          <span>Author Entity</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Schema.org</span>
      </div>
      <div class="text-base sm:text-lg font-serif text-[#2C2B29] font-medium">
        {seoSettings.author?.name || 'Linus Torvalds'}
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        {seoSettings.author?.sameAs?.length || 0} Connected Social Profiles
      </p>
    </div>

    <div class="p-4 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-stone-500">
        <span class="flex items-center gap-1.5">
          <Layers size={13} class="text-amber-600" />
          <span>Redirect Engine</span>
        </span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">301 / 302</span>
      </div>
      <div class="text-base sm:text-lg font-serif text-[#2C2B29] font-medium">
        {seoSettings.redirects?.length || 0} Active Rules
      </div>
      <p class="text-[11px] font-serif text-stone-500">
        Executed in server middleware hooks
      </p>
    </div>
  </div>

  <!-- Main Settings Workbench Section -->
  <section class="p-6 md:p-8 rounded-xl bg-white border border-[#E2DED4] shadow-2xs space-y-8">
    <div class="border-b border-[#EAE6DE] pb-4">
      <h2 class="text-xl font-serif font-medium text-[#2C2B29]">
        Identity, Metadata &amp; OpenGraph Fallbacks
      </h2>
      <p class="text-xs font-serif text-stone-600 mt-1">
        Managed in <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">content/settings/seo.json</code>.
      </p>
    </div>

    <!-- Form Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Core Identity & OpenGraph -->
      <div class="space-y-6">
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 flex items-center gap-1.5">
          <Share2 size={13} />
          <span>General Metadata</span>
        </h3>

        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Site Title</label>
            <input
              type="text"
              bind:value={seoSettings.siteTitle}
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-sans"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Title Template (%s = page title)</label>
            <input
              type="text"
              bind:value={seoSettings.titleTemplate}
              placeholder="%s | Linus Torvalds"
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Default Meta Description</label>
            <textarea
              bind:value={seoSettings.defaultDescription}
              rows={3}
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-serif resize-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Canonical Base URL</label>
              <input
                type="text"
                bind:value={seoSettings.siteUrl}
                placeholder="https://example.com"
                class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Twitter / X Handle</label>
              <input
                type="text"
                bind:value={seoSettings.twitterHandle}
                placeholder="@torvalds"
                class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Default OpenGraph Image URL</label>
            <div class="flex items-center gap-2">
              <input
                type="text"
                bind:value={seoSettings.defaultOgImage}
                placeholder="/images/avatar.webp"
                class="flex-1 bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-mono"
              />
              {#if seoSettings.defaultOgImage}
                <a
                  href={seoSettings.defaultOgImage}
                  target="_blank"
                  rel="noreferrer"
                  class="p-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                  title="Open image preview"
                >
                  <ExternalLink size={13} />
                </a>
              {/if}
            </div>
          </div>
        </div>

        <!-- Author Knowledge Card / Schema.org Person -->
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 pt-4 flex items-center gap-1.5">
          <Compass size={13} />
          <span>Author Card &amp; Schema.org Person Graph</span>
        </h3>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Full Name</label>
              <input
                type="text"
                bind:value={seoSettings.author.name}
                class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-mono text-stone-600 block">Job Title / Role</label>
              <input
                type="text"
                bind:value={seoSettings.author.jobTitle}
                class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-mono text-stone-600 block">Location</label>
            <input
              type="text"
              bind:value={seoSettings.author.location}
              class="w-full bg-[#FAF8F5] border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
            />
          </div>

          <!-- Social sameAs URLs -->
          <div class="space-y-2">
            <label class="text-xs font-mono text-stone-600 block">SameAs Social Graph Links (Schema.org)</label>
            <div class="space-y-1.5">
              {#if Array.isArray(seoSettings.author.sameAs)}
                {#each seoSettings.author.sameAs as url, index}
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      bind:value={seoSettings.author.sameAs[index]}
                      class="flex-1 bg-[#FAF8F5] border border-[#DDD9CE] rounded px-2.5 py-1 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
                    />
                    <button
                      type="button"
                      onclick={() => removeSameAs(index)}
                      class="p-1 text-stone-400 hover:text-red-600 transition-colors"
                      title="Remove link"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                {/each}
              {/if}
              <div class="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="https://..."
                  bind:value={newSameAsUrl}
                  onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSameAs())}
                  class="flex-1 bg-[#FAF8F5] border border-[#DDD9CE] rounded px-2.5 py-1 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
                />
                <button
                  type="button"
                  onclick={addSameAs}
                  class="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-mono transition-colors"
                >
                  <Plus size={12} class="inline mr-1" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Redirects Engine & Live Endpoints -->
      <div class="space-y-6">
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 flex items-center gap-1.5">
          <Layers size={13} />
          <span>Server Canonical Redirects (301 / 302)</span>
        </h3>

        <div class="space-y-3">
          <p class="text-[11px] font-serif text-stone-600">
            Redirect incoming requests at the server level to preserve link equity, resolve legacy URLs, and avoid broken internal paths.
          </p>

          <div class="space-y-2">
            {#if Array.isArray(seoSettings.redirects)}
              {#each seoSettings.redirects as rule, idx}
                <div class="flex items-center gap-2 bg-[#FAF8F5] p-2 rounded border border-[#DDD9CE]">
                  <span class="text-xs font-mono font-medium text-stone-800">{rule.from}</span>
                  <span class="text-xs text-stone-400 font-mono">→</span>
                  <span class="text-xs font-mono text-stone-800 flex-1 truncate">{rule.to}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                    {rule.status}
                  </span>
                  <button
                    type="button"
                    onclick={() => removeRedirect(idx)}
                    class="p-1 text-stone-400 hover:text-red-600 transition-colors ml-1"
                    title="Delete redirect"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              {/each}
            {/if}

            <!-- Add Redirect Input -->
            <div class="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="/from"
                bind:value={newRedirectFrom}
                class="w-1/3 bg-[#FAF8F5] border border-[#DDD9CE] rounded px-2 py-1 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
              />
              <span class="text-xs text-stone-400 font-mono">→</span>
              <input
                type="text"
                placeholder="/to"
                bind:value={newRedirectTo}
                class="flex-1 bg-[#FAF8F5] border border-[#DDD9CE] rounded px-2 py-1 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-500"
              />
              <select
                bind:value={newRedirectStatus}
                class="bg-[#FAF8F5] border border-[#DDD9CE] rounded px-2 py-1 text-xs text-stone-900 font-mono focus:outline-none"
              >
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
              </select>
              <button
                type="button"
                onclick={addRedirect}
                class="px-2.5 py-1 rounded bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] text-xs font-mono transition-colors"
              >
                <Plus size={12} class="inline mr-1" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Live Feeds & Endpoints Inspection -->
        <h3 class="text-xs font-mono uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 pt-4 flex items-center gap-1.5">
          <Eye size={13} />
          <span>Discovery Endpoints &amp; Sitemap</span>
        </h3>

        <div class="grid grid-cols-2 gap-3">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            class="p-3 rounded border border-[#DDD9CE] bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-xs font-mono text-stone-700 transition-colors"
          >
            <div>
              <div class="font-medium">/sitemap.xml</div>
              <div class="text-[10px] text-stone-500">Auto-generated XML index</div>
            </div>
            <ExternalLink size={13} class="text-stone-400" />
          </a>

          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            class="p-3 rounded border border-[#DDD9CE] bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-xs font-mono text-stone-700 transition-colors"
          >
            <div>
              <div class="font-medium">/robots.txt</div>
              <div class="text-[10px] text-stone-500">Crawler instructions</div>
            </div>
            <ExternalLink size={13} class="text-stone-400" />
          </a>
        </div>
      </div>
    </div>
  </section>
</div>
