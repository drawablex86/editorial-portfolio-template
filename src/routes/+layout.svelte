<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import Header from '$lib/components/common/Header.svelte';
  import Footer from '$lib/components/common/Footer.svelte';
  import PaperPlaneCursor from '$lib/components/common/PaperPlaneCursor.svelte';

  let { children } = $props();

  let isStudio = $derived(page.url.pathname.startsWith('/studio'));
  let isFullWidthRoute = $derived(page.url.pathname.startsWith('/inspiration'));
</script>

{#if isStudio}
  {@render children()}
{:else}
  <PaperPlaneCursor />
  <div class="min-h-screen flex flex-col justify-between">
    <Header />

    {#if isFullWidthRoute}
      <main id="main-content" tabindex="-1" class="flex-1 w-full pt-20 pb-16 focus:outline-none">
        {@render children()}
      </main>
    {:else}
      <main id="main-content" tabindex="-1" class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-24 pb-16 focus:outline-none">
        {@render children()}
      </main>
    {/if}

    <Footer />
  </div>
{/if}
