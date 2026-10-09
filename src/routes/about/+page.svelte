<script lang="ts">
  import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
  import { Mail } from '@lucide/svelte';

  let { data } = $props();
  let aboutData = $derived(data.aboutData);
  import SEOHead from '$lib/components/common/SEOHead.svelte';
</script>

<SEOHead
  title="About — Biography, Principles & Practice"
  description="Biography, working principles, disciplines, and systems engineering practice of Linus Torvalds."
  ogImage={aboutData?.portraitImage || '/images/avatar.webp'}
  ogType="profile"
/>

<div class="max-w-4xl mx-auto space-y-12">
  <!-- Standardized Header Anatomy -->
  <header class="space-y-4 border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-8">
    <div class="flex items-center gap-2">
      <span class="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
        About / Biography &amp; Practice
      </span>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
      {aboutData?.title || 'About'}
    </h1>

    <p class="font-sans text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
      Visual artist, mechanical engineer, and creative entrepreneur shaping independent studio systems.
    </p>
  </header>

  <!-- Bio Narrative & Portrait Grid -->
  <div class="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10 md:gap-12 items-start">
    <div class="space-y-6">
      {#if aboutData?.body}
        <MarkdownRenderer
          content={aboutData.body}
          className="editorial-prose"
        />
      {:else}
        <p class="editorial-prose">
          Linus is a software architect and systems engineer best known for creating the Linux operating system kernel and the Git distributed version control system.
        </p>
      {/if}

      <!-- Social Links -->
      <div class="flex flex-wrap gap-5 pt-4 font-sans text-sm text-stone-600 dark:text-stone-400">
        {#if aboutData?.socialLinks && aboutData.socialLinks.length > 0}
          {#each aboutData.socialLinks as link}
            <a
              href={link.url}
              target={link.url.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              class="hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C2B29] rounded px-1"
            >
              {#if link.platform.toLowerCase() === 'whole fragments'}
                <span class="underline underline-offset-4 font-medium">{link.platform}</span>
              {:else if link.platform.toLowerCase() === 'email' || link.url.startsWith('mailto:')}
                <Mail size={15} />
                <span>{link.platform || 'Email'}</span>
              {:else}
                <span class="underline underline-offset-4">{link.platform}</span>
              {/if}
            </a>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Portrait image -->
    <div class="w-full max-w-[260px] mx-auto md:mx-0 aspect-[3/4] bg-[#FAF9F5] dark:bg-[#1C1B19] rounded-xl overflow-hidden shadow-md border border-[#E8E6DF] dark:border-[#2E2C28]">
      <img
        src={aboutData?.portraitImage || '/images/avatar.webp'}
        alt="Portrait of Linus Torvalds"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  </div>

  <!-- Principles and Disciplines -->
  <div class="border-t border-[#E8E6DF] dark:border-[#2E2C28] pt-12 space-y-12">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      {#if aboutData?.principles && aboutData.principles.length > 0}
        <div class="space-y-4">
          <h2 class="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono font-semibold">
            Core Working Principles
          </h2>
          <ul class="space-y-3 text-sm font-sans text-stone-600 dark:text-stone-400">
            {#each aboutData.principles as principle}
              <li class="leading-relaxed">
                <strong class="text-[#2C2B29] dark:text-[#EDE9E1] font-medium">{principle.title}:</strong> {principle.description}
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if aboutData?.disciplines && aboutData.disciplines.length > 0}
        <div class="space-y-4">
          <h2 class="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono font-semibold">
            Disciplines &amp; Mediums
          </h2>
          <div class="space-y-3 text-sm font-sans text-stone-600 dark:text-stone-400">
            {#each aboutData.disciplines as disc}
              <div class="leading-relaxed">
                <span class="font-medium text-[#2C2B29] dark:text-[#EDE9E1]">{disc.area}:</span> {disc.details}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
