<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    /**
     * How far ahead of the viewport to start mounting. A positive rootMargin
     * warms the content so it is ready by the time the user scrolls to it.
     */
    rootMargin?: string;
    /** Reserve this much height before mount, to avoid layout shift. */
    minHeight?: string;
    /** Accessible label for the placeholder region while it is deferred. */
    label?: string;
    class?: string;
    children: Snippet;
  }

  let {
    rootMargin = '600px 0px',
    minHeight = '320px',
    label = 'Loading interactive content',
    class: className = '',
    children
  }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let shouldRender = $state(false);

  onMount(() => {
    // Without IntersectionObserver (or with JS disabled at mount time) render
    // immediately rather than leaving a permanently empty box.
    if (typeof IntersectionObserver === 'undefined' || !container) {
      shouldRender = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          shouldRender = true;
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  });
</script>

<div bind:this={container} class={className}>
  {#if shouldRender}
    {@render children()}
  {:else}
    <div
      style="min-height: {minHeight};"
      class="w-full rounded-sm bg-[#FAF9F5]/60 dark:bg-[#1C1B19]/60 border border-[#E8E6DF] dark:border-[#2E2C28]"
      role="region"
      aria-label={label}
      aria-busy="true"
    ></div>
  {/if}
</div>
