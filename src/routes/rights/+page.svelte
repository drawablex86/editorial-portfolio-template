<script lang="ts">
  import SEOHead from '$lib/components/common/SEOHead.svelte';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import { Shield, ArrowLeft, Download, ExternalLink, Bot, CheckCircle2 } from '@lucide/svelte';

  let { data } = $props();
  let aiSettings = $derived(data.aiSettings);
  let policyMarkdown = $derived(aiSettings.tdmPolicyContent || '');
</script>

<SEOHead
  title="Intellectual Rights &amp; TDM Reservation Policy"
  description="Declaration of intellectual property rights, AI model training opt-outs, and machine-readable Text &amp; Data Mining (TDM) reservations under EU Directive 2019/790 by Linus Torvalds."
  canonicalPath="/rights"
/>

<div class="max-w-4xl mx-auto space-y-12 select-none">
  <!-- Navigation Header -->
  <header class="space-y-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
      <Shield size={13} class="text-amber-700 dark:text-amber-500" />
      <span>Studio Protocol / Legal &amp; AI Governance</span>
    </div>

    <div class="space-y-2">
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
        Rights &amp; TDM Reservation Policy
      </h1>
      <p class="text-sm sm:text-base font-serif italic text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
        Machine-readable reservation of rights regarding artificial intelligence training, generative diffusion models, and automated data extraction.
      </p>
    </div>

    <!-- Telemetry Strip -->
    <div class="flex flex-wrap items-center gap-4 pt-3 text-xs font-mono text-stone-600 dark:text-stone-400 border-t border-dashed border-[#DDD9CE] dark:border-stone-800">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>W3C TDMRep: Reserved (1)</span>
      </div>
      <span>·</span>
      <div>EU Directive 2019/790 (Art. 4(3))</div>
      <span>·</span>
      <div>EU AI Act (Art. 53)</div>
      <span>·</span>
      <div class="text-amber-800 dark:text-amber-400 font-medium">Effective: {aiSettings.effectiveDate || 'October 2026'}</div>
    </div>
  </header>

  <!-- Machine-Readable Discovery Box -->
  <section class="p-6 rounded-xl bg-white dark:bg-stone-900 border border-[#E2DED4] dark:border-[#2E2C28] shadow-2xs space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Bot size={15} class="text-amber-700 dark:text-amber-500" />
        <h2 class="text-xs font-mono uppercase tracking-widest text-stone-800 dark:text-stone-200 font-semibold">
          Machine-Readable Technical Endpoints
        </h2>
      </div>
      <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
        Active Signals
      </span>
    </div>

    <p class="text-xs font-serif text-stone-600 dark:text-stone-400 leading-relaxed">
      Autonomous crawlers, dataset scrapers, and large language model ingestion systems must parse and respect the following machine-readable signals hosted across this origin:
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
      <a
        href="/.well-known/tdmrep.json"
        target="_blank"
        rel="noreferrer"
        class="p-3 rounded-lg border border-[#DDD9CE] dark:border-stone-800 bg-[#FAF8F5] dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-900 flex items-center justify-between text-stone-700 dark:text-stone-300 transition-colors"
      >
        <div>
          <div class="font-semibold text-stone-900 dark:text-stone-100">/.well-known/tdmrep.json</div>
          <div class="text-[10px] text-stone-500 dark:text-stone-500">W3C Community Protocol</div>
        </div>
        <ExternalLink size={12} class="text-stone-400" />
      </a>

      <a
        href="/robots.txt"
        target="_blank"
        rel="noreferrer"
        class="p-3 rounded-lg border border-[#DDD9CE] dark:border-stone-800 bg-[#FAF8F5] dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-900 flex items-center justify-between text-stone-700 dark:text-stone-300 transition-colors"
      >
        <div>
          <div class="font-semibold text-stone-900 dark:text-stone-100">/robots.txt</div>
          <div class="text-[10px] text-stone-500 dark:text-stone-500">AI crawler disallow directives</div>
        </div>
        <ExternalLink size={12} class="text-stone-400" />
      </a>

      <div class="p-3 rounded-lg border border-[#DDD9CE] dark:border-stone-800 bg-[#FAF8F5] dark:bg-stone-950 text-stone-700 dark:text-stone-300">
        <div class="font-semibold text-stone-900 dark:text-stone-100">HTTP Response Header</div>
        <div class="text-[10px] text-stone-500 dark:text-stone-500 font-mono">TDM-Reservation: 1</div>
      </div>
    </div>
  </section>

  <!-- Editorial Markdown Rendered Policy Body -->
  <article class="prose prose-stone max-w-none space-y-6">
    <MarkdownRenderer content={policyMarkdown} className="editorial-prose" />
  </article>

  <!-- Bottom Contact / Action Bar -->
  <section class="border-t border-[#E8E6DF] dark:border-[#2E2C28] pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
    <div class="flex items-center gap-2">
      <CheckCircle2 size={14} class="text-emerald-600" />
      <span>Managed &amp; audited via Portfolio Studio Protocol</span>
    </div>

    <a
      href="/about"
      class="inline-flex items-center gap-1.5 text-stone-800 dark:text-stone-200 hover:underline"
    >
      <ArrowLeft size={13} />
      <span>Return to About Linus Torvalds</span>
    </a>
  </section>
</div>
