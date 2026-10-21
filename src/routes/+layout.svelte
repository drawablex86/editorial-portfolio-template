<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import Header from '$lib/components/common/Header.svelte';
  import Footer from '$lib/components/common/Footer.svelte';
  import PaperPlaneCursor from '$lib/components/common/PaperPlaneCursor.svelte';
  import RouteProgress from '$lib/components/common/RouteProgress.svelte';
  import GoatCounterAnalytics from '$lib/components/common/GoatCounterAnalytics.svelte';

  // Resolved by Vite to the same content-hashed URL the stylesheet emits, so the
  // preload is a cache hit rather than a duplicate download. Preloading only the
  // two faces used above the fold avoids competing with the LCP image.
  import geistRegular from '@fontsource/geist/files/geist-latin-400-normal.woff2?url';
  import newsreaderRegular from '@fontsource/newsreader/files/newsreader-latin-400-normal.woff2?url';

  let { children, data } = $props();

let seoSettings = $derived(data?.seoSettings);

  let isStudio = $derived(page.url.pathname.startsWith('/studio'));
  let isFullWidthRoute = $derived(page.url.pathname.startsWith('/inspiration'));
</script>

<svelte:head>
  <link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" href={geistRegular} />
  <link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" href={newsreaderRegular} />
  <!-- GoatCounter Analytics - injected via component $effect -->
</svelte:head>

<GoatCounterAnalytics {seoSettings} />

{#if isStudio}
  {@render children()}
{:else}
  <PaperPlaneCursor />
  <RouteProgress />
  <div class="min-h-screen flex flex-col justify-between">
    <Header />

    {#if isFullWidthRoute}
      <main id="main-content" tabindex="-1" class="flex-1 w-full pt-20 pb-16 focus:outline-none">
        {#key page.url.pathname}
          <div class="route-fade">
            {@render children()}
          </div>
        {/key}
      </main>
    {:else}
      <main id="main-content" tabindex="-1" class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-24 pb-16 focus:outline-none">
        {#key page.url.pathname}
          <div class="route-fade">
            {@render children()}
          </div>
        {/key}
      </main>
    {/if}

    <Footer />
  </div>
{/if}
