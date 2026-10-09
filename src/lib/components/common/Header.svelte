<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Menu, X, ChevronDown, Sparkles, BookOpen, Layers, User, ArrowUpRight } from '@lucide/svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  export type ViewType = 'home' | 'works' | 'writing' | 'now' | 'cabinet' | 'about' | 'inspiration' | 'zines' | 'library';

  interface Props {
    currentView?: string;
    onNavigate?: (view: ViewType) => void;
  }

  let { currentView, onNavigate }: Props = $props();

  const PRIMARY_NAV_ITEMS = [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'works', label: 'Works', href: '/works' },
    { key: 'writing', label: 'Writing', href: '/blog' },
    { key: 'now', label: 'Now', href: '/now' }
  ];

  const CABINET_ITEMS = [
    {
      code: 'CAB-01',
      title: 'Cosmology',
      description: 'Spatial constellation of intellectual influences & vibes',
      href: '/inspiration',
      icon: Sparkles
    },
    {
      code: 'CAB-02',
      title: 'Library',
      description: 'Lo-Fi cafe shelf & Goodreads collection',
      href: '/library',
      icon: BookOpen
    },
    {
      code: 'CAB-03',
      title: 'Zines',
      description: 'Tactile print stand & flipbook reading room',
      href: '/zines',
      icon: Layers
    },
    {
      code: 'CAB-04',
      title: 'About',
      description: 'Biography, working principles & practice',
      href: '/about',
      icon: User
    }
  ];

  let isMobileMenuOpen = $state(false);
  let isCabinetOpen = $state(false);
  let cabinetRef: HTMLDivElement | null = $state(null);

  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isMobileMenuOpen = false;
        isCabinetOpen = false;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (cabinetRef && !cabinetRef.contains(e.target as Node)) {
        isCabinetOpen = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  });

  $effect(() => {
    if (typeof document !== 'undefined') {
      if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  });

  function isItemActive(key: string): boolean {
    const pathname = page.url.pathname;
    if (key === 'home') {
      if (pathname === '/') return (currentView || 'home') === 'home';
      return false;
    }
    if (key === 'works') {
      return pathname.startsWith('/works') || pathname.startsWith('/projects') || pathname.startsWith('/work') || pathname.startsWith('/play');
    }
    if (key === 'writing') return pathname.startsWith('/blog');
    if (key === 'now') return pathname.startsWith('/now');
    if (key === 'cabinet') {
      return (
        pathname.startsWith('/inspiration') ||
        pathname.startsWith('/library') ||
        pathname.startsWith('/zines') ||
        pathname.startsWith('/about')
      );
    }
    if (key === 'inspiration') return pathname.startsWith('/inspiration');
    if (key === 'library') return pathname.startsWith('/library');
    if (key === 'zines') return pathname.startsWith('/zines');
    if (key === 'about') return pathname.startsWith('/about');
    return false;
  }

  function handleNavClick(e: MouseEvent, item: typeof PRIMARY_NAV_ITEMS[0]) {
    isMobileMenuOpen = false;
    isCabinetOpen = false;
    if (page.url.pathname === '/' && onNavigate) {
      if (item.key === 'home' || item.key === 'works') {
        e.preventDefault();
        onNavigate(item.key as ViewType);
      }
    }
  }
</script>

<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] px-4 py-2 text-xs uppercase tracking-widest font-mono rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1]"
>
  Skip to main content
</a>

<header
  class="fixed top-0 left-0 w-full px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 flex flex-row items-center justify-between bg-[#F4F2ED]/95 dark:bg-[#141312]/95 backdrop-blur-md z-40 border-b border-[#E8E6DF] dark:border-[#2E2C28] transition-colors duration-200"
>
  <!-- Site Identity -->
  <div class="flex items-center shrink-0">
    <a
      href="/"
      class="text-base sm:text-lg md:text-xl font-medium tracking-tight whitespace-nowrap text-[#2C2B29] dark:text-[#EDE9E1] hover:text-stone-600 dark:hover:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded py-1 px-1 -ml-1 cursor-pointer"
      aria-label="Linus Torvalds — Return to home"
      onclick={(e) => {
        if (page.url.pathname === '/' && onNavigate) {
          e.preventDefault();
          onNavigate('home');
        }
      }}
    >
      Linus Torvalds
    </a>
  </div>

  <!-- Desktop Navigation -->
  <div class="hidden md:flex items-center gap-2 lg:gap-3">
    <nav aria-label="Main Navigation" class="flex items-center gap-1.5 lg:gap-2">
      {#each PRIMARY_NAV_ITEMS as item}
        {@const active = isItemActive(item.key)}
        <a
          href={item.href}
          onclick={(e) => handleNavClick(e, item)}
          aria-current={active ? 'page' : undefined}
          class="min-h-[36px] px-3.5 py-1.5 text-xs lg:text-sm whitespace-nowrap transition-all duration-200 capitalize focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded flex items-center justify-center border {active
            ? 'text-[#2C2B29] dark:text-[#EDE9E1] font-medium border-[#2C2B29] dark:border-[#EDE9E1] bg-black/5 dark:bg-white/10 shadow-2xs'
            : 'text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] border-transparent hover:border-stone-300 dark:hover:border-stone-700'}"
        >
          {item.label}
        </a>
      {/each}

      <!-- Interactive Cabinet Popover Trigger -->
      <div class="relative" bind:this={cabinetRef}>
        <button
          type="button"
          onclick={() => (isCabinetOpen = !isCabinetOpen)}
          aria-expanded={isCabinetOpen}
          aria-haspopup="true"
          class="min-h-[36px] px-3.5 py-1.5 text-xs lg:text-sm whitespace-nowrap transition-all duration-200 capitalize focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] rounded flex items-center gap-1.5 border cursor-pointer {isItemActive('cabinet') || isCabinetOpen
            ? 'text-[#2C2B29] dark:text-[#EDE9E1] font-medium border-[#2C2B29] dark:border-[#EDE9E1] bg-black/5 dark:bg-white/10 shadow-2xs'
            : 'text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] border-transparent hover:border-stone-300 dark:hover:border-stone-700'}"
        >
          <span>Cabinet</span>
          <ChevronDown
            size={13}
            class="transition-transform duration-200 {isCabinetOpen ? 'rotate-180' : 'opacity-70'}"
          />
        </button>

        <!-- Cabinet Archival Drawer Dropdown -->
        {#if isCabinetOpen}
          <div
            role="menu"
            tabindex="-1"
            class="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-[#FAF9F5] dark:bg-[#181715] border border-[#E8E6DF] dark:border-[#2E2C28] rounded-xl shadow-xl py-3 px-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none"
          >
            <!-- Archival Drawer Header -->
            <div class="px-3 pb-2.5 mb-2 border-b border-[#E8E6DF] dark:border-[#2E2C28] flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
              <span class="uppercase tracking-widest">Archival Cabinet</span>
              <span class="italic font-serif">Curiosities &amp; Stacks</span>
            </div>

            <!-- Drawer Compartments -->
            <div class="flex flex-col gap-1">
              {#each CABINET_ITEMS as item}
                {@const Icon = item.icon}
                {@const itemActive = isItemActive(item.title.toLowerCase())}
                <a
                  href={item.href}
                  onclick={() => (isCabinetOpen = false)}
                  role="menuitem"
                  class="group flex items-start gap-3 p-2.5 rounded-lg transition-all border {itemActive
                    ? 'bg-black/5 dark:bg-white/10 border-stone-300 dark:border-stone-700'
                    : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:border-stone-200 dark:hover:border-stone-800'}"
                >
                  <div class="p-1.5 rounded-md bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 group-hover:text-[#2C2B29] dark:group-hover:text-white transition-colors shrink-0 mt-0.5">
                    <Icon size={14} />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-stone-400 dark:text-stone-500 font-normal">
                          {item.code}
                        </span>
                        <span class="text-sm font-medium text-[#2C2B29] dark:text-[#EDE9E1] group-hover:text-black dark:group-hover:text-white transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <ArrowUpRight
                        size={12}
                        class="text-stone-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                      />
                    </div>
                    <p class="text-xs text-stone-500 dark:text-stone-400 font-serif line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </a>
              {/each}
            </div>

            <!-- Archival Drawer Footer Note -->
            <div class="mt-2.5 pt-2 border-t border-[#E8E6DF] dark:border-[#2E2C28] px-3 flex items-center justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500">
              <span>Personal collection</span>
              <span>Studio Archive</span>
            </div>
          </div>
        {/if}
      </div>
    </nav>

    <!-- Theme Toggle -->
    <div class="pl-2 ml-1 border-l border-[#E8E6DF] dark:border-[#2E2C28] shrink-0">
      <ThemeToggle />
    </div>
  </div>

  <!-- Mobile Controls -->
  <div class="flex md:hidden items-center gap-2">
    <ThemeToggle />

    <button
      type="button"
      onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
      class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono tracking-wider uppercase text-[#2C2B29] dark:text-[#EDE9E1] bg-black/5 dark:bg-white/10 border border-stone-300 dark:border-stone-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] cursor-pointer"
      aria-expanded={isMobileMenuOpen}
      aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
    >
      {#if isMobileMenuOpen}
        <X size={15} />
        <span>Close</span>
      {:else}
        <Menu size={15} />
        <span>Menu</span>
      {/if}
    </button>
  </div>
</header>

<!-- Mobile Fullscreen Drawer -->
{#if isMobileMenuOpen}
  <div
    class="fixed inset-0 top-[53px] z-30 bg-[#F4F2ED] dark:bg-[#141312] overflow-y-auto px-6 py-8 flex flex-col justify-between md:hidden border-b border-[#E8E6DF] dark:border-[#2E2C28] transition-all"
  >
    <div class="space-y-6">
      <!-- Section 1: Main Practice Flow -->
      <div>
        <div class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 pb-2 border-b border-[#E8E6DF] dark:border-[#2E2C28] mb-3 flex items-center justify-between">
          <span>Creative Practice</span>
          <span>01 — 04</span>
        </div>

        <nav class="flex flex-col space-y-1">
          {#each PRIMARY_NAV_ITEMS as item, idx}
            {@const active = isItemActive(item.key)}
            <a
              href={item.href}
              onclick={(e) => handleNavClick(e, item)}
              class="text-left py-2.5 px-3 rounded-lg transition-all flex items-baseline justify-between group {active
                ? 'bg-black/5 dark:bg-white/10 text-[#2C2B29] dark:text-[#EDE9E1]'
                : 'hover:bg-stone-200/50 dark:hover:bg-[#1C1B19] text-stone-600 dark:text-stone-400'}"
            >
              <div class="flex items-baseline gap-3">
                <span class="font-mono text-xs text-stone-400">
                  0{idx + 1}
                </span>
                <span class="text-xl font-medium tracking-tight text-[#2C2B29] dark:text-[#EDE9E1]">
                  {item.label}
                </span>
              </div>
              {#if active}
                <span class="w-2 h-2 rounded-full bg-[#2C2B29] dark:bg-[#EDE9E1]"></span>
              {/if}
            </a>
          {/each}
        </nav>
      </div>

      <!-- Section 2: Cabinet of Curiosities -->
      <div class="pt-2">
        <div class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 pb-2 border-b border-[#E8E6DF] dark:border-[#2E2C28] mb-3 flex items-center justify-between">
          <span>Cabinet &amp; Archives</span>
          <span>Curated Stacks</span>
        </div>

        <nav class="flex flex-col space-y-1.5">
          {#each CABINET_ITEMS as item}
            {@const active = isItemActive(item.title.toLowerCase())}
            {@const Icon = item.icon}
            <a
              href={item.href}
              onclick={() => (isMobileMenuOpen = false)}
              class="text-left py-2.5 px-3 rounded-lg transition-all flex items-center justify-between border {active
                ? 'bg-black/5 dark:bg-white/10 border-stone-300 dark:border-stone-700 text-[#2C2B29] dark:text-[#EDE9E1]'
                : 'border-transparent bg-stone-200/30 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 hover:text-[#2C2B29]'}"
            >
              <div class="flex items-center gap-3">
                <div class="p-1 rounded bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  <Icon size={14} />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-mono text-stone-400">{item.code}</span>
                    <span class="text-base font-medium text-[#2C2B29] dark:text-[#EDE9E1]">{item.title}</span>
                  </div>
                  <span class="text-xs text-stone-500 dark:text-stone-400 font-serif block">
                    {item.description}
                  </span>
                </div>
              </div>
              <ArrowUpRight size={13} class="text-stone-400" />
            </a>
          {/each}
        </nav>
      </div>
    </div>

    <!-- Drawer Footer -->
    <div class="pt-6 border-t border-[#E8E6DF] dark:border-[#2E2C28] mt-8 text-xs font-mono text-stone-500 dark:text-stone-400 flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <span>Linus Torvalds Studio</span>
        <span>Portland / Helsinki</span>
      </div>
      <p class="font-serif text-stone-600 dark:text-stone-400 text-xs italic">
        Systems Architecture, Kernel Engineering &amp; Optics
      </p>
    </div>
  </div>
{/if}
