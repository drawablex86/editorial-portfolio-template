<script lang="ts">
  import { onMount } from 'svelte';
  import { renderEditorialMarkdown } from '$lib/editorialParser';

  interface Props {
    content?: string;
    className?: string;
    /** Render an in-page table of contents when the prose has enough headings. */
    toc?: boolean;
    tocTitle?: string;
    /** Minimum number of collected headings before the TOC is rendered. */
    tocMinItems?: number;
  }

  let {
    content = '',
    className = '',
    toc = false,
    tocTitle = 'Contents',
    tocMinItems = 3
  }: Props = $props();

  let rendered = $derived(renderEditorialMarkdown(content));
  let html = $derived(rendered.html);
  let tocItems = $derived(toc ? rendered.toc : []);
  let showToc = $derived(tocItems.length >= tocMinItems);

  let rootEl: HTMLDivElement | null = $state(null);
  let pendingReset: ReturnType<typeof setTimeout> | undefined;

  /**
   * Copy-to-clipboard for fenced code blocks. Delegated from the prose
   * container so the injected `<pre>` markup stays renderer-agnostic and
   * innerHTML-driven updates need no re-binding.
   */
  async function handleClick(e: MouseEvent) {
    const button = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-copy-code]');
    if (!button) return;

    const block = button.closest('.code-block');
    const code = block?.querySelector('code');
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
    } catch {
      return;
    }

    const label = button.querySelector('[data-copy-label]');
    button.dataset.copied = 'true';
    if (label) label.textContent = 'Copied';
    if (pendingReset) clearTimeout(pendingReset);
    pendingReset = setTimeout(() => {
      button.dataset.copied = 'false';
      if (label) label.textContent = 'Copy';
    }, 2000);
  }

  /**
   * An in-page anchor jump to an element that does not exist (stale link, or a
   * heading slug renamed since publication) silently does nothing and scrolls
   * to the top. Detect it and surface the problem instead.
   */
  function handleAnchorClick(e: MouseEvent) {
    const anchor = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;
    const id = decodeURIComponent(anchor.getAttribute('href')!.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) {
      e.preventDefault();
      anchor.setAttribute('data-broken-anchor', 'true');
      anchor.title = `Nothing on this page is titled “${id.replace(/-/g, ' ')}”`;
    } else {
      anchor.removeAttribute('data-broken-anchor');
    }
  }

  onMount(() => () => {
    if (pendingReset) clearTimeout(pendingReset);
  });
</script>

{#if showToc}
  <nav
    aria-label="Table of contents"
    class="mb-10 rounded-sm border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/70 dark:bg-[#1C1B19]/70 px-5 py-4 sm:px-6 sm:py-5"
  >
    <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-3">
      {tocTitle}
    </p>
    <ol class="space-y-2">
      {#each tocItems as item, idx}
        <li class={item.depth === 3 ? 'pl-6' : ''}>
          <a
            href="#{item.id}"
            class="group flex items-baseline gap-3 text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors"
          >
            <span class="font-mono text-[10px] tabular-nums text-stone-400 dark:text-stone-500 shrink-0">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span class="font-serif text-[15px] leading-snug group-hover:underline underline-offset-4">
              {item.text}
            </span>
          </a>
        </li>
      {/each}
    </ol>
  </nav>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  bind:this={rootEl}
  class={className}
  onclick={(e) => {
    handleClick(e);
    handleAnchorClick(e);
  }}
>
  {@html html}
</div>
