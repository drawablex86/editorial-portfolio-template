<script lang="ts">
  import { ArrowLeft, ArrowRight } from '@lucide/svelte';

  interface SiblingWork {
    id: string;
    title: string;
    year?: string;
  }

  interface Props {
    prevWork?: SiblingWork | null;
    nextWork?: SiblingWork | null;
  }

  let { prevWork = null, nextWork = null }: Props = $props();
</script>

{#if prevWork || nextWork}
  <nav
    aria-label="More works"
    class="mt-16 border-t border-[#E8E6DF] dark:border-[#2E2C28] pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
  >
    {#if prevWork}
      <a
        href="/works/{prevWork.id}"
        rel="prev"
        class="group order-2 sm:order-1 p-4 rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/50 dark:bg-[#1C1B19]/50 hover:bg-[#FAF9F5] dark:hover:bg-[#1C1B19] hover:border-stone-400 dark:hover:border-stone-600 transition-all no-underline"
      >
        <div class="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
          <ArrowLeft size={12} class="group-hover:-translate-x-1 transition-transform" />
          <span>Previous Work</span>
        </div>
        <div class="mt-1 font-serif font-medium text-base text-[#2C2B29] dark:text-[#EDE9E1] line-clamp-1">
          {prevWork.title}
        </div>
      </a>
    {:else}
      <span class="hidden sm:block" aria-hidden="true"></span>
    {/if}

    {#if nextWork}
      <a
        href="/works/{nextWork.id}"
        rel="next"
        class="group order-1 sm:order-2 p-4 rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/50 dark:bg-[#1C1B19]/50 hover:bg-[#FAF9F5] dark:hover:bg-[#1C1B19] hover:border-stone-400 dark:hover:border-stone-600 transition-all sm:text-right no-underline"
      >
        <div class="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 sm:justify-end">
          <span>Next Work</span>
          <ArrowRight size={12} class="group-hover:translate-x-1 transition-transform" />
        </div>
        <div class="mt-1 font-serif font-medium text-base text-[#2C2B29] dark:text-[#EDE9E1] line-clamp-1">
          {nextWork.title}
        </div>
      </a>
    {/if}
  </nav>
{/if}
