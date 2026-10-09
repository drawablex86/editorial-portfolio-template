<script lang="ts">
  import type { ProjectItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import { ExternalLink, Play, Layers } from '@lucide/svelte';

  const FALLBACK_IMAGE = "/images/inspiration_cosmology.webp";

  interface Props {
    project: ProjectItem;
  }

  let { project }: Props = $props();
</script>

<article class="max-w-4xl mx-auto space-y-12">
  <!-- Product Header -->
  <header class="space-y-6 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-[11px] uppercase tracking-widest font-mono px-2.5 py-1 bg-stone-900 dark:bg-stone-800 text-[#F4F2ED] dark:text-[#EDE9E1] rounded-xs font-medium">
          Product Design
        </span>
        {#if project.year}
          <span class="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono">
            {project.year}
          </span>
        {/if}
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap items-center gap-3">
        {#if project.liveUrl}
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] hover:bg-stone-800 dark:hover:bg-stone-200 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors shadow-xs"
          >
            <span>Live Site</span>
            <ExternalLink size={13} />
          </a>
        {/if}
        {#if project.prototypeUrl}
          <a
            href={project.prototypeUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] text-[#2C2B29] dark:text-[#EDE9E1] hover:bg-stone-50 dark:hover:bg-[#242320] text-xs font-mono uppercase tracking-wider rounded-xs transition-colors shadow-xs"
          >
            <Play size={12} class="fill-current" />
            <span>Prototype</span>
          </a>
        {/if}
      </div>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-tight">
      {project.title}
    </h1>

    {#if project.description}
      <p class="text-lg md:text-xl text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
        {project.description}
      </p>
    {/if}

    <!-- Product Spec Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E8E6DF]/60 dark:border-[#2E2C28] text-xs">
      {#if project.client}
        <div>
          <span class="block uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono text-[10px]">Product / Client</span>
          <span class="font-medium text-[#2C2B29] dark:text-[#EDE9E1] mt-0.5 block">{project.client}</span>
        </div>
      {/if}
      {#if project.role}
        <div class="col-span-2 sm:col-span-1">
          <span class="block uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono text-[10px]">Role</span>
          <span class="font-medium text-[#2C2B29] dark:text-[#EDE9E1] mt-0.5 block">{project.role}</span>
        </div>
      {/if}
      {#if project.techStack && project.techStack.length > 0}
        <div class="col-span-2">
          <span class="block uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono text-[10px] flex items-center gap-1">
            <Layers size={11} /> Tech Stack &amp; Tools
          </span>
          <div class="flex flex-wrap gap-1.5 mt-1">
            {#each project.techStack as tool}
              <span
                class="px-2 py-0.5 bg-stone-100 dark:bg-[#242320] text-stone-700 dark:text-stone-300 rounded-2xs text-[11px] font-mono border border-stone-200 dark:border-[#2E2C28]"
              >
                {tool}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Main Hero Image -->
  {#if project.thumbnailSrc}
    <div class="aspect-[16/9] w-full overflow-hidden rounded-xs bg-[#E8E6DF] dark:bg-[#1C1B19] shadow-md border border-[#E8E6DF] dark:border-[#2E2C28] relative group">
      <img
        src={project.thumbnailSrc}
        alt={project.title}
        onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
        class="w-full h-full object-cover"
      />
      {#if project.liveUrl}
        <div class="absolute bottom-4 right-4 flex gap-2">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="bg-[#2C2B29]/90 dark:bg-[#1C1B19]/90 hover:bg-[#2C2B29] dark:hover:bg-black text-[#F4F2ED] dark:text-[#EDE9E1] backdrop-blur-sm text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded shadow flex items-center gap-1.5 transition-all"
          >
            Visit Live Site <ExternalLink size={12} />
          </a>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Narrative Body -->
  {#if project.body}
    <MarkdownRenderer
      content={project.body}
      className="editorial-prose pt-4"
    />
  {/if}

  <!-- Interface Gallery -->
  {#if project.gallery && project.gallery.length > 0}
    <section class="space-y-6 pt-12 border-t border-[#E8E6DF] dark:border-[#2E2C28]">
      <h3 class="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
        Interface Views &amp; User Journeys
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each project.gallery as img, idx}
          <div class="overflow-hidden rounded-xs bg-[#E8E6DF] dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] shadow-xs relative aspect-video">
            <img
              src={img}
              alt="{project.title} Interface Flow {idx + 1}"
              loading="lazy"
              onerror={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
              class="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
            />
          </div>
        {/each}
      </div>
    </section>
  {/if}
</article>
