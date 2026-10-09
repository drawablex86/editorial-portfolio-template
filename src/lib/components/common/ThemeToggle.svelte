<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon } from '@lucide/svelte';

  let theme = $state<'light' | 'dark'>('light');
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
    const isDark = document.documentElement.classList.contains('dark');
    theme = isDark ? 'dark' : 'light';

    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains('dark');
      theme = currentDark ? 'dark' : 'light';
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  });

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    theme = nextTheme;

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (_) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch (_) {}
    }

    // Dispatch event for Three.js studio desk and other canvas listeners
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
  }
</script>

{#if !mounted}
  <div
    class="w-[36px] h-[36px] rounded flex items-center justify-center text-stone-400 opacity-60"
    aria-hidden="true"
  >
    <span class="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 block animate-pulse"></span>
  </div>
{:else}
  <button
    type="button"
    onclick={toggleTheme}
    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    title={theme === 'dark' ? 'Light mode (Warm linen)' : 'Dark mode (Obsidian paper)'}
    class="min-h-[38px] min-w-[38px] p-2 text-stone-600 dark:text-stone-300 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] border border-transparent hover:border-stone-300 dark:hover:border-stone-700 bg-black/0 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] cursor-pointer"
  >
    {#if theme === 'dark'}
      <Sun size={15} strokeWidth={2} class="text-amber-200/90 hover:rotate-45 transition-transform duration-300" />
    {:else}
      <Moon size={15} strokeWidth={2} class="text-stone-700 hover:-rotate-12 transition-transform duration-300" />
    {/if}
  </button>
{/if}
