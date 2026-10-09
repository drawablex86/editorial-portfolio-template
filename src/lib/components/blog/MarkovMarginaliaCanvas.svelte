<script lang="ts">
  import { onMount } from 'svelte';
  import { Sparkles, Play, Pause, Compass, ArrowUpRight, ChevronDown, ChevronUp } from '@lucide/svelte';
  import type { LinguisticCorpus, CorpusWord } from '$lib/types';

  interface Props {
    corpus: LinguisticCorpus;
    onSelectWord?: (word: string) => void;
  }

  let { corpus, onSelectWord }: Props = $props();

  let containerRef: HTMLDivElement | null = $state(null);
  let canvasRef: HTMLCanvasElement | null = $state(null);
  let ctx: CanvasRenderingContext2D | null = null;

  // UI state
  let isExpanded = $state(true);
  let isPlaying = $state(true);
  let hoveredWord = $state<CorpusWord | null>(null);
  let currentFragment = $state<string>('');
  let currentFragmentOrigin = $state<string>('');
  let isGenerating = $state(false);

  // Canvas dimensions & DPR
  let width = $state(800);
  let height = $state(300);
  let dpr = 1;

  // Animation & simulation variables
  let rafId: number | null = null;
  let isVisible = true;
  let simTime = 0;

  // Pointer tracking
  let mouseX = -1000;
  let mouseY = -1000;
  let isPointerOver = false;

  // Visual Theme detection
  let isDarkMode = $state(false);

  // Palimpsest particle definition
  interface WordParticle {
    word: string;
    count: number;
    essayIds: string[];
    samplePhrase?: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseSize: number;
    opacity: number;
    targetOpacity: number;
    seed: number;
    width: number;
    height: number;
  }

  // Generative sentence ribbon
  interface EphemeralRibbon {
    words: string[];
    x: number;
    y: number;
    progress: number;
    maxProgress: number;
    alpha: number;
    essayTitle: string;
  }

  let activeRibbon: EphemeralRibbon | null = null;
  const particles: WordParticle[] = [];

  // Procedural 2D Simplex / Perlin-style noise approximation
  function pseudoNoise(x: number, y: number, t: number): number {
    return (
      Math.sin(x * 0.003 + t * 0.4) * 0.5 +
      Math.cos(y * 0.003 - t * 0.3) * 0.3 +
      Math.sin((x + y) * 0.002 + t * 0.2) * 0.2
    );
  }

  // Generate a Markov-synthesized sentence fragment
  function generateMarkovFragment(): { text: string; origin: string } {
    if (!corpus.vocabulary || corpus.vocabulary.length === 0) {
      return { text: 'Craft within resistance.', origin: 'Studio Notes' };
    }

    // 50% chance: pick an evocative curated phrase from the essays
    if (corpus.phrases && corpus.phrases.length > 0 && Math.random() > 0.45) {
      const pick = corpus.phrases[Math.floor(Math.random() * corpus.phrases.length)];
      return { text: pick.text, origin: pick.essayTitle };
    }

    // Otherwise: synthesize procedurally via Markov transitions
    const starterSeeds = ['in', 'the', 'when', 'craft', 'light', 'water', 'tools', 'edge', 'canvas', 'practice'];
    let currentWord = starterSeeds[Math.floor(Math.random() * starterSeeds.length)];

    // If seed not in transitions, pick a popular vocabulary word
    if (!corpus.markovTransitions[currentWord]) {
      const vocabPick = corpus.vocabulary[Math.floor(Math.random() * Math.min(20, corpus.vocabulary.length))];
      currentWord = vocabPick?.word || 'craft';
    }

    const synthesized: string[] = [currentWord];
    const maxLen = 7 + Math.floor(Math.random() * 8);

    for (let i = 0; i < maxLen; i++) {
      const nextOptions = corpus.markovTransitions[currentWord];
      if (!nextOptions || nextOptions.length === 0) break;
      const nextWord = nextOptions[Math.floor(Math.random() * nextOptions.length)];
      synthesized.push(nextWord);
      currentWord = nextWord;
    }

    // Capitalize first letter and format
    let rawText = synthesized.join(' ');
    rawText = rawText.charAt(0).toUpperCase() + rawText.slice(1);
    if (!rawText.endsWith('.')) rawText += '.';

    return { text: rawText, origin: 'Procedural Markov Synthesis' };
  }

  function triggerNewFragment() {
    isGenerating = true;
    const res = generateMarkovFragment();
    currentFragment = res.text;
    currentFragmentOrigin = res.origin;

    // Launch ribbon across canvas
    if (width > 0 && height > 0) {
      activeRibbon = {
        words: res.text.split(' '),
        x: 40 + Math.random() * (width * 0.3),
        y: 60 + Math.random() * (height - 120),
        progress: 0,
        maxProgress: 240,
        alpha: 0,
        essayTitle: res.origin
      };
    }

    setTimeout(() => {
      isGenerating = false;
    }, 400);
  }

  function initParticles() {
    particles.length = 0;
    if (!corpus.vocabulary || corpus.vocabulary.length === 0) return;

    // Take top ~36 evocative words for optimal canvas breathing room
    const wordsToDisplay = corpus.vocabulary.slice(0, 36);
    const cols = 6;
    const rows = Math.ceil(wordsToDisplay.length / cols);
    const cellW = (width - 120) / cols;
    const cellH = (height - 80) / rows;

    for (let i = 0; i < wordsToDisplay.length; i++) {
      const item = wordsToDisplay[i];
      // Size scaled smoothly by word importance
      const baseSize = Math.max(11, Math.min(18, 11 + Math.sqrt(item.count) * 2.2));

      // Structured grid position with gentle random jitter to prevent clumping on spawn
      const col = i % cols;
      const row = Math.floor(i / cols);
      const initX = 60 + col * cellW + (Math.random() - 0.5) * (cellW * 0.6);
      const initY = 40 + row * cellH + (Math.random() - 0.5) * (cellH * 0.6);

      particles.push({
        word: item.word,
        count: item.count,
        essayIds: item.essayIds,
        samplePhrase: item.samplePhrase,
        x: Math.max(40, Math.min(width - 40, initX)),
        y: Math.max(30, Math.min(height - 30, initY)),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        baseSize,
        opacity: 0.35 + Math.random() * 0.45,
        targetOpacity: 0.35 + Math.random() * 0.45,
        seed: Math.random() * 1000,
        width: 0,
        height: baseSize
      });
    }
  }

  function updateDimensions() {
    if (!containerRef || !canvasRef) return;
    const rect = containerRef.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = isExpanded ? 260 : 0;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasRef.width = width * dpr;
    canvasRef.height = height * dpr;

    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }

  function handlePointerMove(e: MouseEvent) {
    if (!canvasRef) return;
    const rect = canvasRef.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    isPointerOver = true;

    // Check hit test for words
    let found: CorpusWord | null = null;
    for (const p of particles) {
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
      if (dist < (p.width ? p.width * 0.65 : 30) + 12) {
        found = {
          word: p.word,
          count: p.count,
          essayIds: p.essayIds,
          samplePhrase: p.samplePhrase
        };
        break;
      }
    }
    hoveredWord = found;
  }

  function handlePointerLeave() {
    isPointerOver = false;
    mouseX = -1000;
    mouseY = -1000;
    hoveredWord = null;
  }

  function handleCanvasClick() {
    if (hoveredWord && onSelectWord) {
      onSelectWord(hoveredWord.word);
    } else {
      triggerNewFragment();
    }
  }

  function step() {
    if (!isPlaying || !isVisible || !ctx || !canvasRef || height === 0) {
      rafId = requestAnimationFrame(step);
      return;
    }

    simTime += 0.01;

    // 1. Semi-transparent wash for generative palimpsest / drying ink persistence
    const bgWash = isDarkMode ? 'rgba(20, 19, 18, 0.22)' : 'rgba(244, 242, 237, 0.22)';
    ctx.fillStyle = bgWash;
    ctx.fillRect(0, 0, width, height);

    // Ink colors based on theme
    const inkPrimary = isDarkMode ? '#EDE9E1' : '#2C2B29';
    const inkSecondary = isDarkMode ? '#8E8C85' : '#737068';
    const accentLine = isDarkMode ? 'rgba(237, 233, 225, 0.07)' : 'rgba(44, 43, 41, 0.06)';

    // 2. Render delicate constellation filaments between words sharing essay co-occurrences
    ctx.lineWidth = 0.75;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];

        // Mutual particle-particle repulsion to prevent overlapping/clumping
        const dxRepel = p2.x - p1.x;
        const dyRepel = p2.y - p1.y;
        const distSqRepel = dxRepel * dxRepel + dyRepel * dyRepel;
        const minSpacing = ((p1.width || 40) + (p2.width || 40)) * 0.45 + 16;
        const minSpacingSq = minSpacing * minSpacing;

        if (distSqRepel < minSpacingSq && distSqRepel > 0.01) {
          const dist = Math.sqrt(distSqRepel);
          const pushForce = ((minSpacing - dist) / minSpacing) * 0.12;
          const nx = dxRepel / dist;
          const ny = dyRepel / dist;
          p1.vx -= nx * pushForce;
          p1.vy -= ny * pushForce;
          p2.vx += nx * pushForce;
          p2.vy += ny * pushForce;
        }

        // Do they share at least one essay?
        const hasSharedEssay = p1.essayIds.some((id) => p2.essayIds.includes(id));
        if (hasSharedEssay) {
          const distSq = dxRepel * dxRepel + dyRepel * dyRepel;

          // Connect if in proximity (< 130px)
          if (distSq < 16900) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / 130) * 0.14;
            ctx.strokeStyle = isDarkMode
              ? `rgba(237, 233, 225, ${alpha})`
              : `rgba(44, 43, 41, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    }

    // 3. Update & render floating word particles
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Vector flow-field force
      const angle = pseudoNoise(p.x, p.y, simTime + p.seed) * Math.PI * 2;
      const speed = 0.22;
      p.vx += Math.cos(angle) * speed * 0.12;
      p.vy += Math.sin(angle) * speed * 0.12;

      // Mouse interaction: soft attraction / magnetic focus
      if (isPointerOver) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.hypot(dx, dy);

        // Soft magnetic pull with minimum distance deadband to prevent collapsing onto cursor
        if (dist < 110 && dist > 35) {
          const force = ((110 - dist) / 110) * 0.18;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          p.targetOpacity = 0.95;
        } else if (dist <= 35 && dist > 1) {
          // Push away slightly if directly beneath pointer to preserve legibility
          const push = ((35 - dist) / 35) * 0.15;
          p.vx -= (dx / dist) * push;
          p.vy -= (dy / dist) * push;
          p.targetOpacity = 0.95;
        } else {
          p.targetOpacity = 0.35;
        }
      } else {
        p.targetOpacity = 0.45;
      }

      // Drag / friction
      p.vx *= 0.94;
      p.vy *= 0.94;

      p.x += p.vx;
      p.y += p.vy;

      // Screen wrap with soft margins
      if (p.x < 30) p.x = width - 40;
      if (p.x > width - 30) p.x = 40;
      if (p.y < 25) p.y = height - 30;
      if (p.y > height - 25) p.y = 30;


      // Smooth opacity interpolation
      p.opacity += (p.targetOpacity - p.opacity) * 0.08;

      // Measure text width once initialized
      ctx.font = `${p.baseSize}px Newsreader, serif`;
      if (!p.width) {
        p.width = ctx.measureText(p.word).width;
      }

      const isHovered = hoveredWord?.word === p.word;

      // Draw particle word
      if (isHovered) {
        // Highlighting halo ring
        ctx.strokeStyle = isDarkMode ? 'rgba(237, 233, 225, 0.4)' : 'rgba(44, 43, 41, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width * 0.6 + 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = inkPrimary;
        ctx.font = `italic 600 ${p.baseSize + 2}px Newsreader, serif`;
      } else {
        ctx.fillStyle = isDarkMode
          ? `rgba(237, 233, 225, ${p.opacity})`
          : `rgba(44, 43, 41, ${p.opacity})`;
        ctx.font = `italic 400 ${p.baseSize}px Newsreader, serif`;
      }

      ctx.fillText(p.word, p.x, p.y);
    }

    // 4. Render active generated Markov sentence ribbon if active
    if (activeRibbon) {
      activeRibbon.progress++;
      if (activeRibbon.progress < 40) {
        activeRibbon.alpha = activeRibbon.progress / 40;
      } else if (activeRibbon.progress > activeRibbon.maxProgress - 40) {
        activeRibbon.alpha = (activeRibbon.maxProgress - activeRibbon.progress) / 40;
      } else {
        activeRibbon.alpha = 1;
      }

      // Draw subtle backing pill
      const ribbonText = activeRibbon.words.join(' ');
      ctx.font = `500 14px Newsreader, serif`;
      const textMetrics = ctx.measureText(ribbonText);
      const boxW = textMetrics.width + 36;
      const boxH = 34;

      const rx = Math.max(20, Math.min(width - boxW - 20, activeRibbon.x));
      const ry = activeRibbon.y;

      ctx.save();
      ctx.globalAlpha = activeRibbon.alpha;

      // Background plate
      ctx.fillStyle = isDarkMode ? 'rgba(30, 29, 27, 0.88)' : 'rgba(250, 249, 245, 0.88)';
      ctx.strokeStyle = isDarkMode ? 'rgba(237, 233, 225, 0.15)' : 'rgba(44, 43, 41, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rx, ry, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      // Text inside plate
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = inkPrimary;
      ctx.font = `italic 14px Newsreader, serif`;
      ctx.fillText(ribbonText, rx + 18, ry + boxH / 2);

      // Monospace label marker
      ctx.font = '9px monospace';
      ctx.fillStyle = inkSecondary;
      ctx.textAlign = 'right';
      ctx.fillText(activeRibbon.essayTitle, rx + boxW - 12, ry + boxH + 12);

      ctx.restore();

      if (activeRibbon.progress >= activeRibbon.maxProgress) {
        activeRibbon = null;
      }
    }

    rafId = requestAnimationFrame(step);
  }

  function checkTheme() {
    if (typeof document !== 'undefined') {
      isDarkMode = document.documentElement.classList.contains('dark');
    }
  }

  onMount(() => {
    checkTheme();
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (canvasRef) {
      ctx = canvasRef.getContext('2d');
    }

    updateDimensions();
    initParticles();
    triggerNewFragment();

    const handleResize = () => {
      updateDimensions();
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    // IntersectionObserver to pause RAF when out of view
    const io = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    });
    if (containerRef) io.observe(containerRef);

    rafId = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
</script>

<div
  bind:this={containerRef}
  class="relative w-full rounded-lg border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5] dark:bg-[#141312] overflow-hidden transition-all duration-300"
>
  <!-- Generative Canvas Header Bar -->
  <div class="flex items-center justify-between px-4 py-2.5 border-b border-[#E8E6DF] dark:border-[#2E2C28] bg-[#F4F2ED]/60 dark:bg-[#1A1917]/70 text-xs font-mono">
    <div class="flex items-center gap-2 text-stone-600 dark:text-stone-300">
      <Sparkles size={13} class="text-stone-500 dark:text-stone-400" />
      <span class="font-medium tracking-wide">The Markov Marginalia</span>
      <span class="text-stone-400 dark:text-stone-500 hidden sm:inline">/</span>
      <span class="text-stone-500 dark:text-stone-400 hidden sm:inline text-[11px]">
        {corpus.stats.essayCount} essays &bull; {corpus.stats.totalWords.toLocaleString()} tokens &bull; generative n-gram field
      </span>
    </div>

    <div class="flex items-center gap-1.5">
      <!-- Generate new fragment -->
      <button
        type="button"
        onclick={triggerNewFragment}
        title="Synthesize a new procedural sentence fragment"
        class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] uppercase tracking-wider rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5] dark:bg-[#1F1E1B] text-stone-700 dark:text-stone-300 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer"
      >
        <Sparkles size={11} class={isGenerating ? 'animate-spin' : ''} />
        <span>Synthesize</span>
      </button>

      <!-- Play / Pause Simulation -->
      <button
        type="button"
        onclick={() => (isPlaying = !isPlaying)}
        title={isPlaying ? 'Pause generative simulation' : 'Resume generative simulation'}
        class="p-1 rounded text-stone-500 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors cursor-pointer"
        aria-label={isPlaying ? 'Pause generative simulation' : 'Resume generative simulation'}
      >
        {#if isPlaying}
          <Pause size={13} />
        {:else}
          <Play size={13} />
        {/if}
      </button>

      <!-- Expand / Collapse Canvas -->
      <button
        type="button"
        onclick={() => {
          isExpanded = !isExpanded;
          setTimeout(() => updateDimensions(), 50);
        }}
        title={isExpanded ? 'Collapse canvas' : 'Expand canvas'}
        class="p-1 rounded text-stone-500 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors cursor-pointer"
        aria-label={isExpanded ? 'Collapse canvas' : 'Expand canvas'}
      >
        {#if isExpanded}
          <ChevronUp size={14} />
        {:else}
          <ChevronDown size={14} />
        {/if}
      </button>
    </div>
  </div>

  <!-- Interactive Canvas Surface -->
  {#if isExpanded}
    <div class="relative w-full h-[260px] cursor-crosshair">
      <canvas
        bind:this={canvasRef}
        onmousemove={handlePointerMove}
        onmouseleave={handlePointerLeave}
        onclick={handleCanvasClick}
        class="w-full h-full block"
      ></canvas>

      <!-- Floating Tooltip on Word Hover -->
      {#if hoveredWord}
        <div
          class="absolute bottom-3 left-4 right-4 sm:right-auto sm:max-w-md pointer-events-none rounded border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#FAF9F5]/95 dark:bg-[#1C1B19]/95 backdrop-blur-xs p-2.5 shadow-xs transition-opacity duration-150 text-xs"
        >
          <div class="flex items-center justify-between gap-3 font-mono text-[11px] text-stone-500 dark:text-stone-400 mb-1">
            <span class="font-serif italic text-sm text-[#2C2B29] dark:text-[#EDE9E1] font-semibold">
              &ldquo;{hoveredWord.word}&rdquo;
            </span>
            <span>Occurs {hoveredWord.count}&times; across {hoveredWord.essayIds.length} essay{hoveredWord.essayIds.length > 1 ? 's' : ''}</span>
          </div>
          {#if hoveredWord.samplePhrase}
            <p class="font-serif italic text-stone-600 dark:text-stone-300 text-xs line-clamp-1">
              &hellip;{hoveredWord.samplePhrase}&hellip;
            </p>
          {/if}
          <div class="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Click word to filter essays below
          </div>
        </div>
      {/if}

      <!-- Bottom Status Bar -->
      <div class="absolute bottom-2.5 right-3 pointer-events-none font-mono text-[10px] text-stone-400 dark:text-stone-500 hidden sm:block">
        Hover to attract &bull; Click to synthesize &amp; filter
      </div>
    </div>
  {/if}
</div>
