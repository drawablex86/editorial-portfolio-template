<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { 
    Home, 
    Compass, 
    BookOpen, 
    RotateCcw, 
    Pause, 
    Play, 
    AlertTriangle, 
    ChevronDown, 
    ChevronUp,
    Sparkles,
    ArrowRight
  } from '@lucide/svelte';

  let status = $derived(page.status || 404);
  let is404 = $derived(status === 404);
  let errorMessage = $derived(
    page.error?.message || 
    (is404 
      ? 'The requested document, monograph, or folio could not be found on the studio shelf.' 
      : 'An unexpected internal studio exception occurred during typesetting or rendering.')
  );

  // Countdown auto-redirect state
  const INITIAL_COUNTDOWN = 10;
  let secondsRemaining = $state(INITIAL_COUNTDOWN);
  let isTimerPaused = $state(false);
  let hasInteractedWithTimer = $state(false);
  let showDebugDrawer = $state(false);

  // Interactive mouse orientation for the illustration
  let mouseOffset = $state({ x: 0, y: 0 });

  function handleMouseMove(e: MouseEvent) {
    if (typeof window === 'undefined') return;
    const { innerWidth, innerHeight } = window;
    const xRatio = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
    const yRatio = (e.clientY / innerHeight - 0.5) * 2;
    mouseOffset = {
      x: Math.round(xRatio * 15),
      y: Math.round(yRatio * 15)
    };
  }

  function toggleTimer() {
    isTimerPaused = !isTimerPaused;
    hasInteractedWithTimer = true;
  }

  function cancelTimer() {
    isTimerPaused = true;
    hasInteractedWithTimer = true;
  }

  onMount(() => {
    const timerInterval = setInterval(() => {
      if (!isTimerPaused) {
        if (secondsRemaining > 1) {
          secondsRemaining -= 1;
        } else if (secondsRemaining === 1) {
          secondsRemaining = 0;
          clearInterval(timerInterval);
          goto('/');
        }
      }
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'h' || e.key === 'H') {
        goto('/');
      } else if (e.key === 'w' || e.key === 'W') {
        goto('/works');
      } else if (e.key === 'l' || e.key === 'L') {
        goto('/library');
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(timerInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  });

  // Calculate percentage for progress circle
  let progressRatio = $derived((secondsRemaining / INITIAL_COUNTDOWN) * 100);
</script>

<svelte:head>
  <title>{status} — {is404 ? 'Folio Not Located' : 'Studio Interruption'} | Linus Torvalds</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="relative min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 overflow-hidden select-none">
  
  <!-- Subtle Atmospheric Background Coordinates & Radial Glow -->
  <div class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-40 dark:opacity-25">
    <div class="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-stone-300/30 dark:from-stone-800/40 via-amber-200/10 dark:via-amber-500/5 to-transparent blur-3xl"></div>
  </div>

  <div class="relative max-w-2xl w-full mx-auto text-center space-y-8 z-10">
    
    <!-- Hero Interactive Vector Graphic: "The Drifting Folio & Compass" -->
    <div class="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
      
      <!-- Outer Rotating Orbital Compass Ring -->
      <svg 
        class="absolute inset-0 w-full h-full text-stone-300 dark:text-stone-800 animate-[spin_40s_linear_infinite]"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="92" stroke="currentColor" stroke-width="1" stroke-dasharray="4 6" opacity="0.8" />
        <circle cx="100" cy="100" r="76" stroke="currentColor" stroke-width="0.75" stroke-opacity="0.4" />
        <!-- Cardinal Tick Marks -->
        <line x1="100" y1="4" x2="100" y2="12" stroke="currentColor" stroke-width="1.5" />
        <line x1="100" y1="188" x2="100" y2="196" stroke="currentColor" stroke-width="1.5" />
        <line x1="4" y1="100" x2="12" y2="100" stroke="currentColor" stroke-width="1.5" />
        <line x1="188" y1="100" x2="196" y2="100" stroke="currentColor" stroke-width="1.5" />
      </svg>

      <!-- Counter-rotating atmospheric wind swirls -->
      <svg
        class="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] text-stone-400/50 dark:text-stone-700/60 animate-[spin_25s_linear_infinite_reverse]"
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="90" cy="90" r="60" stroke="currentColor" stroke-width="0.75" stroke-dasharray="2 12" />
        <path d="M 90,30 A 60,60 0 0,1 150,90" stroke="currentColor" stroke-width="1" stroke-dasharray="1 8" stroke-linecap="round" />
        <path d="M 90,150 A 60,60 0 0,1 30,90" stroke="currentColor" stroke-width="1" stroke-dasharray="1 8" stroke-linecap="round" />
      </svg>

      <!-- Center Floating Paper Plane Folio with dynamic tilt and parallax -->
      <div 
        class="relative transition-transform duration-300 ease-out will-change-transform"
        style="transform: translate({mouseOffset.x}px, {mouseOffset.y}px) rotate({mouseOffset.x * 0.6}deg);"
      >
        <!-- Floating breathing bobbing motion wrapper -->
        <div class="animate-bounce-subtle">
          <svg 
            class="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md transition-colors duration-200" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Shadow underneath plane -->
            <ellipse 
              cx="50" 
              cy="86" 
              rx="24" 
              ry="6" 
              class="fill-stone-900/10 dark:fill-black/40 blur-[2px] transition-all"
            />

            <!-- Origami Folio Wings (Light & Dark dynamic ink) -->
            <!-- Main Right Wing -->
            <polygon 
              points="50,15 88,72 50,60" 
              class="fill-[#2C2B29] dark:fill-[#EDE9E1] stroke-[#1C1B19] dark:stroke-white stroke-[0.75]" 
            />
            <!-- Main Left Wing -->
            <polygon 
              points="50,15 12,72 50,60" 
              class="fill-[#3D3A36] dark:fill-[#D8D3C7] stroke-[#1C1B19] dark:stroke-white stroke-[0.75]" 
            />
            <!-- Fold Underbelly Spine -->
            <polygon 
              points="50,15 50,60 46,75" 
              class="fill-[#1A1918] dark:fill-[#B8B2A4]" 
            />
            <!-- Red/Vermilion Pilot Keel Crest ( राहुल signature red paper plane motif) -->
            <polygon 
              points="50,22 55,54 50,52" 
              class="fill-red-500/90 dark:fill-red-400" 
            />
          </svg>
        </div>
      </div>

      <!-- Astrolabe status badge stamp -->
      <div class="absolute -bottom-1 px-3 py-0.5 rounded-full bg-[#FAF9F5] dark:bg-[#1C1B19] border border-[#DDD9CE] dark:border-stone-800 shadow-xs flex items-center gap-1.5 text-[11px] font-mono text-stone-600 dark:text-stone-400">
        <span class="w-1.5 h-1.5 rounded-full {is404 ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}"></span>
        <span>FOLIO {status}</span>
      </div>
    </div>

    <!-- Editorial Typography Block -->
    <div class="space-y-3.5 max-w-lg mx-auto">
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#2C2B29] dark:text-[#EDE9E1] tracking-tight leading-tight">
        {#if is404}
          This folio has departed the shelf.
        {:else}
          An unexpected pause in the studio press.
        {/if}
      </h1>

      <p class="text-base sm:text-lg font-serif italic text-stone-600 dark:text-stone-400 leading-relaxed max-w-md mx-auto">
        {#if is404}
          The monograph, entry, or archive index you requested is either resting elsewhere, renamed, or never inked to begin with.
        {:else}
          A mechanical glitch interrupted the studio rendering pipeline. The editorial ledger has caught the anomaly.
        {/if}
      </p>
    </div>

    <!-- Editorial Auto-Redirect Countdown Bar -->
    <div class="max-w-md mx-auto pt-2">
      <div class="p-3.5 sm:p-4 rounded-xl bg-stone-100/80 dark:bg-stone-900/60 border border-[#E8E6DF] dark:border-stone-800 text-left space-y-3 backdrop-blur-xs transition-colors">
        
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <!-- Circular countdown gauge -->
            <div class="relative w-6 h-6 flex items-center justify-center">
              <svg class="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  class="text-stone-300 dark:text-stone-700" 
                  fill="none" 
                />
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-dasharray="62.83" 
                  stroke-dashoffset={62.83 - (62.83 * progressRatio) / 100}
                  stroke-linecap="round"
                  class="{isTimerPaused ? 'text-stone-400' : 'text-amber-600 dark:text-amber-400'} transition-all duration-300" 
                  fill="none" 
                />
              </svg>
              <span class="font-mono text-xs font-semibold text-stone-700 dark:text-stone-300">
                {secondsRemaining}s
              </span>
            </div>

            <p class="text-xs font-mono text-stone-600 dark:text-stone-400">
              {#if isTimerPaused}
                Auto-redirect paused.
              {:else}
                Returning to studio desk in {secondsRemaining}s...
              {/if}
            </p>
          </div>

          <!-- Timer Actions: Pause / Cancel -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onclick={toggleTimer}
              class="px-2.5 py-1 rounded bg-stone-200/70 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
              title={isTimerPaused ? 'Resume countdown' : 'Pause countdown'}
            >
              {#if isTimerPaused}
                <Play size={10} />
                <span>Resume</span>
              {:else}
                <Pause size={10} />
                <span>Pause</span>
              {/if}
            </button>

            {#if !isTimerPaused}
              <button
                type="button"
                onclick={cancelTimer}
                class="px-2 py-1 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 text-[11px] font-mono transition-colors cursor-pointer"
                title="Dismiss countdown redirect"
              >
                Stay here
              </button>
            {/if}
          </div>
        </div>

        <!-- Progress track bar -->
        <div class="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div 
            class="h-full bg-stone-700 dark:bg-stone-300 transition-all duration-1000 ease-linear rounded-full"
            style="width: {progressRatio}%;"
          ></div>
        </div>

      </div>
    </div>

    <!-- Curated Editorial Navigation Options -->
    <div class="space-y-4 pt-1">
      <div class="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400">
        <Sparkles size={12} class="text-amber-500" />
        <span>Select Destination</span>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        <!-- Return Home Button -->
        <a
          href="/"
          class="group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] text-xs font-mono hover:opacity-95 transition-all shadow-xs hover:shadow-sm"
        >
          <Home size={13} />
          <span>Return Home</span>
          <span class="opacity-60 text-[10px] hidden sm:inline ml-0.5 border border-current px-1 py-0.2 rounded font-mono">H</span>
        </a>

        <!-- Browse Works -->
        <a
          href="/works"
          class="group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-stone-900 border border-[#DDD9CE] dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-2xs hover:shadow-xs"
        >
          <Compass size={13} />
          <span>Browse Works</span>
          <span class="opacity-60 text-[10px] hidden sm:inline ml-0.5 border border-stone-300 dark:border-stone-700 px-1 py-0.2 rounded font-mono">W</span>
        </a>

        <!-- Library -->
        <a
          href="/library"
          class="group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-stone-900 border border-[#DDD9CE] dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-2xs hover:shadow-xs"
        >
          <BookOpen size={13} />
          <span>Peruse Library</span>
          <span class="opacity-60 text-[10px] hidden sm:inline ml-0.5 border border-stone-300 dark:border-stone-700 px-1 py-0.2 rounded font-mono">L</span>
        </a>
      </div>

      <!-- Quick keyboard helper note -->
      <p class="text-[11px] font-mono text-stone-600 dark:text-stone-400">
        Hotkeys: <kbd class="px-1 py-0.5 bg-stone-200/70 dark:bg-stone-800 rounded text-[10px]">H</kbd> home &bull; <kbd class="px-1 py-0.5 bg-stone-200/70 dark:bg-stone-800 rounded text-[10px]">P</kbd> projects &bull; <kbd class="px-1 py-0.5 bg-stone-200/70 dark:bg-stone-800 rounded text-[10px]">Space</kbd> pause timer
      </p>
    </div>

    <!-- Technical Diagnostic Drawer (Especially for 500 or detailed inspection) -->
    <div class="pt-6 border-t border-[#E8E6DF] dark:border-stone-800 max-w-lg mx-auto">
      <button
        type="button"
        onclick={() => showDebugDrawer = !showDebugDrawer}
        class="inline-flex items-center gap-1.5 text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
      >
        <AlertTriangle size={12} />
        <span>{showDebugDrawer ? 'Hide Studio Trace & Diagnostics' : 'Inspect Studio Trace & Diagnostics'}</span>
        {#if showDebugDrawer}
          <ChevronUp size={12} />
        {:else}
          <ChevronDown size={12} />
        {/if}
      </button>

      {#if showDebugDrawer}
        <div class="mt-3 p-3.5 text-left rounded-lg bg-stone-100/90 dark:bg-stone-900/90 border border-[#E8E6DF] dark:border-stone-800 font-mono text-[11px] text-stone-700 dark:text-stone-300 space-y-2">
          <div class="flex justify-between items-center text-stone-500">
            <span>Status Code: {status}</span>
            <span>Path: {page.url.pathname}</span>
          </div>
          <div class="p-2 rounded bg-stone-200/60 dark:bg-stone-950 font-mono text-xs break-all select-all">
            {errorMessage}
          </div>
          <p class="text-[10px] text-stone-500 dark:text-stone-500 leading-normal">
            If you believe this link should exist, please report it via studio contacts or check the main navigation index.
          </p>
        </div>
      {/if}
    </div>

  </div>
</div>

<style>
  @keyframes bounceSubtle {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .animate-bounce-subtle {
    animation: bounceSubtle 4s ease-in-out infinite;
  }
</style>
