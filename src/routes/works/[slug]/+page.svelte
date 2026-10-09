<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte';
  import CaseStudyLayout from '$lib/components/layouts/CaseStudyLayout.svelte';
  import ProductDesignLayout from '$lib/components/layouts/ProductDesignLayout.svelte';
  import PhotoAlbumLayout from '$lib/components/layouts/PhotoAlbumLayout.svelte';
  import IllustrationLayout from '$lib/components/layouts/IllustrationLayout.svelte';
  import SEOHead from '$lib/components/common/SEOHead.svelte';

  let { data } = $props();
  let project = $derived(data.work || data.project);

  let typeLabel = $derived(
    project.projectType === 'design' ? 'Design' :
    project.projectType === 'product_design' ? 'Product Design' :
    project.projectType === 'photography' ? 'Photography' :
    project.projectType === 'illustration' ? 'Illustration' :
    project.projectType === 'sketchbook' ? 'Sketchbook' :
    project.projectType === 'writing' ? 'Writing' : 'Experiment'
  );
</script>

<SEOHead
  title={project.seoTitle || `${project.title} — ${typeLabel}`}
  description={project.seoDescription || project.description || project.title}
  ogImage={project.ogImage || project.thumbnailSrc}
  publishDate={project.publishDate || (project.year ? `${project.year}-01-01` : undefined)}
  noIndex={project.noIndex}
/>

<div class="space-y-8 select-none">
  <!-- Back navigation bar -->
  <nav aria-label="Breadcrumb navigation" class="border-b border-[#E8E6DF] dark:border-[#2E2C28] pb-4 flex items-center justify-between">
    <a
      href="/works"
      class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded py-1 px-1 -ml-1"
    >
      <ArrowLeft size={14} />
      <span>Back to All Works</span>
    </a>

    <span class="text-xs font-mono px-2 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase tracking-wider">
      {typeLabel}
    </span>
  </nav>

  <!-- Dynamic Presentation Archetype Dispatch based on Work Type -->
  {#if project.projectType === 'product_design'}
    <ProductDesignLayout {project} />
  {:else if project.projectType === 'photography'}
    <PhotoAlbumLayout {project} />
  {:else if project.projectType === 'illustration' || project.projectType === 'sketchbook'}
    <IllustrationLayout {project} />
  {:else if project.projectType === 'design'}
    <CaseStudyLayout {project} />
  {:else}
    <!-- Default presentation (Experiments, Writing, General) -->
    <CaseStudyLayout {project} />
  {/if}
</div>
