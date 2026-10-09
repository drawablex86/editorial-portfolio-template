<script lang="ts">
  import { onMount } from 'svelte';

  let containerRef: HTMLDivElement;
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Logical coordinate space
  let width = 1000;
  let height = 340;

  let isVisible = true;
  let rafId: number | null = null;

  // Interaction tracking (mouse & paper plane wake)
  let mouseX = -1000;
  let mouseY = -1000;
  let prevMouseX = -1000;
  let prevMouseY = -1000;
  let isPointerOver = false;

  // Water Simulation Parameters
  let time = 0;

  // Water ripples created by pointer/plane interaction
  interface Ripple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    amplitude: number;
    speed: number;
    opacity: number;
  }

  const ripples: Ripple[] = [];

  // Drifting Origami Boat Physics
  interface Boat {
    x: number;
    y: number;
    targetX: number;
    speed: number;
    rotation: number;
    buoyancyBob: number;
    width: number;
    height: number;
  }

  const boat: Boat = {
    x: 120,
    y: 0,
    targetX: 280,
    speed: 0.35,
    rotation: 0,
    buoyancyBob: 0,
    width: 44,
    height: 22
  };

  // Subtle floating blossom / foliage fragments on water surface
  interface WaterFlora {
    x: number;
    y: number;
    baseY: number;
    size: number;
    driftSpeed: number;
    phase: number;
    color: string;
    opacity: number;
  }

  const waterFlora: WaterFlora[] = [];

  function initFlora() {
    waterFlora.length = 0;
    const colors = [
      'rgba(239, 68, 68, 0.45)', // crimson origami accent
      'rgba(217, 119, 6, 0.35)', // warm amber
      'rgba(180, 83, 9, 0.25)',  // ochre
      'rgba(120, 113, 108, 0.3)' // stone pebble
    ];

    for (let i = 0; i < 16; i++) {
      const x = Math.random() * width;
      const baseY = height * 0.58 + Math.random() * (height * 0.35);
      waterFlora.push({
        x,
        y: baseY,
        baseY,
        size: 2 + Math.random() * 3,
        driftSpeed: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.4 + Math.random() * 0.4
      });
    }
  }

  // Calculate surface wave height at any x coordinate and time
  function getWaterSurfaceY(x: number, t: number, layer: number = 0): number {
    const baseline = height * 0.62 + layer * 18;

    // Harmonized gentle sine octaves
    const wave1 = Math.sin(x * 0.007 + t * 0.85) * 7;
    const wave2 = Math.sin(x * 0.018 - t * 1.1) * 3.5;
    const wave3 = Math.cos(x * 0.035 + t * 0.6) * 1.8;

    // Interactive ripple displacement
    let rippleDisplacement = 0;
    for (let i = 0; i < ripples.length; i++) {
      const rip = ripples[i];
      const dist = Math.abs(x - rip.x);
      if (dist < rip.radius + 30 && dist > rip.radius - 30) {
        const factor = 1 - Math.abs(dist - rip.radius) / 30;
        rippleDisplacement += Math.sin((dist - rip.radius) * 0.2) * rip.amplitude * factor;
      }
    }

    return baseline + wave1 + wave2 + wave3 + rippleDisplacement;
  }

  // Surface slope (derivative) for realistic buoyancy tilting
  function getWaterSlope(x: number, t: number): number {
    const delta = 4;
    const y1 = getWaterSurfaceY(x - delta, t);
    const y2 = getWaterSurfaceY(x + delta, t);
    return Math.atan2(y2 - y1, delta * 2);
  }

  function spawnRipple(x: number, y: number, amplitude: number = 5) {
    if (ripples.length > 25) ripples.shift();
    ripples.push({
      x,
      y,
      radius: 2,
      maxRadius: 85 + Math.random() * 45,
      amplitude,
      speed: 1.2 + Math.random() * 0.8,
      opacity: 0.6
    });
  }

  function handlePointerMove(e: PointerEvent) {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    isPointerOver = true;

    // If mouse moves across or near the water line, stir ripples
    const waterY = getWaterSurfaceY(mouseX, time);
    if (Math.abs(mouseY - waterY) < 65) {
      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 2.5 && Math.random() < 0.4) {
        spawnRipple(mouseX, waterY, Math.min(speed * 0.4, 6));
      }
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }

  function handlePointerLeave() {
    isPointerOver = false;
    mouseX = -1000;
    mouseY = -1000;
  }

  function handlePointerDown(e: PointerEvent) {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const waterY = getWaterSurfaceY(clickX, time);
    spawnRipple(clickX, waterY, 8);
  }

  function updateDimensions() {
    if (!canvasRef || !containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    width = rect.width;
    height = rect.height;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvasRef.width = width * dpr;
    canvasRef.height = height * dpr;

    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    initFlora();
  }

  // Draw delicate origami paper boat with paper facets
  function drawOrigamiBoat(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const isDark = document.documentElement.classList.contains('dark');

    // 1. Water shadow / gentle reflection beneath hull
    ctx.beginPath();
    ctx.ellipse(0, 7, 24, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(44, 43, 41, 0.12)';
    ctx.fill();

    // 2. Origami Hull - Left Bottom Facet
    ctx.beginPath();
    ctx.moveTo(0, 4);       // keel bottom center
    ctx.lineTo(-24, -2);    // left prow tip
    ctx.lineTo(-9, 4);      // left keel step
    ctx.closePath();
    ctx.fillStyle = isDark ? '#D6D3D1' : '#E7E5E4';
    ctx.fill();

    // 3. Origami Hull - Right Bottom Facet
    ctx.beginPath();
    ctx.moveTo(0, 4);       // keel bottom center
    ctx.lineTo(24, -2);     // right prow tip
    ctx.lineTo(9, 4);       // right keel step
    ctx.closePath();
    ctx.fillStyle = isDark ? '#A8A29E' : '#D6D3D1';
    ctx.fill();

    // 4. Origami Hull - Center Hull Trapeze
    ctx.beginPath();
    ctx.moveTo(-24, -2);
    ctx.lineTo(-14, -7);
    ctx.lineTo(14, -7);
    ctx.lineTo(24, -2);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fillStyle = isDark ? '#F5F5F4' : '#FAF9F6';
    ctx.fill();

    // Hull subtle crease lines
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -7);
    ctx.strokeStyle = isDark ? 'rgba(44, 43, 41, 0.25)' : 'rgba(120, 113, 108, 0.4)';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // 5. Origami Sail / Pyramid Crown (Left Facet - Bright Parchment)
    ctx.beginPath();
    ctx.moveTo(0, -22);     // sail apex
    ctx.lineTo(-12, -7);    // left sail base
    ctx.lineTo(0, -7);      // center mast base
    ctx.closePath();
    ctx.fillStyle = isDark ? '#E7E5E4' : '#F5F5F4';
    ctx.fill();

    // 6. Origami Sail (Right Facet - Shaded Cream Parchment)
    ctx.beginPath();
    ctx.moveTo(0, -22);     // sail apex
    ctx.lineTo(12, -7);     // right sail base
    ctx.lineTo(0, -7);      // center mast base
    ctx.closePath();
    ctx.fillStyle = isDark ? '#D6D3D1' : '#E5E2DC';
    ctx.fill();

    // 7. Signature Studio Red Origami Keel Flag (Tying into the Red Paper Plane)
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(7, -19);
    ctx.lineTo(0, -16);
    ctx.closePath();
    ctx.fillStyle = '#EF4444'; // Warm crimson
    ctx.fill();

    ctx.restore();
  }

  function renderLoop() {
    if (!isVisible || !ctx || !canvasRef) {
      rafId = requestAnimationFrame(renderLoop);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    time += 0.022;

    const isDark = document.documentElement.classList.contains('dark');

    // --- 1. Update Ripples ---
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.radius += rip.speed;
      rip.amplitude *= 0.97;
      rip.opacity = (1 - rip.radius / rip.maxRadius) * 0.45;

      if (rip.radius >= rip.maxRadius || rip.amplitude < 0.1) {
        ripples.splice(i, 1);
        continue;
      }

      // Draw oval water ripple ring
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y + 4, rip.radius, rip.radius * 0.32, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark
        ? `rgba(237, 233, 225, ${rip.opacity * 0.3})`
        : `rgba(44, 43, 41, ${rip.opacity * 0.25})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // --- 2. Update Boat Drift & Buoyancy ---
    // The boat drifts slowly left-to-right across the canvas, then gently loops or sways
    boat.x += boat.speed;
    if (boat.x > width + 50) {
      boat.x = -50;
    }

    const boatSurfaceY = getWaterSurfaceY(boat.x, time, 1);
    const targetSlope = getWaterSlope(boat.x, time);

    // Smooth physics interpolation for buoyant rocking
    boat.y += (boatSurfaceY - boat.y) * 0.15;
    boat.rotation += (targetSlope - boat.rotation) * 0.12;

    // Periodic tiny wake droplet behind boat
    if (Math.random() < 0.08) {
      spawnRipple(boat.x - 18, boatSurfaceY, 1.8);
    }

    // --- 3. Draw Water Waves (3 Back-to-Front Translucent Layers) ---
    const waveLayers = [
      {
        layerIdx: 0,
        fill: isDark ? 'rgba(30, 29, 27, 0.45)' : 'rgba(235, 232, 224, 0.55)',
        stroke: isDark ? 'rgba(55, 52, 47, 0.4)' : 'rgba(215, 211, 201, 0.65)'
      },
      {
        layerIdx: 1,
        fill: isDark ? 'rgba(24, 23, 22, 0.65)' : 'rgba(228, 225, 216, 0.72)',
        stroke: isDark ? 'rgba(75, 71, 65, 0.5)' : 'rgba(200, 196, 185, 0.75)'
      },
      {
        layerIdx: 2,
        fill: isDark ? 'rgba(20, 19, 18, 0.85)' : 'rgba(220, 216, 206, 0.88)',
        stroke: isDark ? 'rgba(95, 90, 83, 0.6)' : 'rgba(184, 180, 168, 0.85)'
      }
    ];

    // Background water layer 0
    drawWavePath(waveLayers[0].layerIdx, waveLayers[0].fill, waveLayers[0].stroke);

    // Water flora behind foreground waves
    for (let i = 0; i < waterFlora.length; i++) {
      const f = waterFlora[i];
      f.x += f.driftSpeed;
      if (f.x > width + 20) f.x = -20;
      const fy = getWaterSurfaceY(f.x, time, 1) + Math.sin(time + f.phase) * 3;

      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, fy, f.size, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.restore();
    }

    // Middle water layer 1
    drawWavePath(waveLayers[1].layerIdx, waveLayers[1].fill, waveLayers[1].stroke);

    // Render the Origami Boat sitting on layer 1
    drawOrigamiBoat(ctx, boat.x, boat.y, boat.rotation);

    // Foreground water layer 2
    drawWavePath(waveLayers[2].layerIdx, waveLayers[2].fill, waveLayers[2].stroke);

    rafId = requestAnimationFrame(renderLoop);
  }

  function drawWavePath(layerIdx: number, fill: string, stroke: string) {
    if (!ctx) return;
    const step = 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, height);

    const firstY = getWaterSurfaceY(0, time, layerIdx);
    ctx.lineTo(0, firstY);

    for (let x = step; x <= width; x += step) {
      const y = getWaterSurfaceY(x, time, layerIdx);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    ctx.restore();
  }

  onMount(() => {
    if (canvasRef && containerRef) {
      ctx = canvasRef.getContext('2d');
      updateDimensions();
      boat.y = getWaterSurfaceY(boat.x, 0, 1);
      rafId = requestAnimationFrame(renderLoop);
    }

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef) resizeObserver.observe(containerRef);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });

    if (containerRef) intersectionObserver.observe(containerRef);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  });
</script>

<!-- HERO CONTAINER: MONSOON VOYAGE (KERALA WATER & ORIGAMI BOAT DIORAMA) -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerRef}
  onpointermove={handlePointerMove}
  onpointerleave={handlePointerLeave}
  onpointerdown={handlePointerDown}
  class="relative rounded-2xl overflow-hidden border border-[#E8E6DF] dark:border-[#2E2C28] bg-[#F4F2ED] dark:bg-[#151413] shadow-xs select-none min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex flex-col justify-between transition-colors duration-300"
>
  <!-- Background Archival Atmosphere & Water Canvas -->
  <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    <!-- Top-to-bottom gentle archival wash scrim -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-[#F4F2ED] via-[#F4F2ED]/75 to-transparent dark:from-[#151413] dark:via-[#151413]/70 dark:to-transparent z-1"
    ></div>

    <canvas
      bind:this={canvasRef}
      class="absolute inset-0 w-full h-full pointer-events-none z-2"
      aria-hidden="true"
    ></canvas>
  </div>

  <!-- Foreground Editorial Content -->
  <div class="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 max-w-4xl space-y-6">
    <!-- Studio Header Eyebrow -->
    <div class="flex items-center gap-2">
      <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
      <span class="text-xs uppercase tracking-widest font-mono text-stone-600 dark:text-stone-400">
        Studio &amp; Digital Workspace
      </span>
    </div>

    <!-- Main Editorial Headline -->
    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-[#2C2B29] dark:text-[#EDE9E1] leading-[1.14]">
      Designing sovereign systems, digital tools, and technical craft.
    </h1>

    <!-- Narrative Bio -->
    <p class="text-lg sm:text-xl text-stone-600 dark:text-stone-300 font-serif max-w-2xl leading-relaxed">
      An independent portfolio and digital garden spanning systems architecture, technical research, photography, and tactile experiments.
    </p>

    <!-- Contextual Discipline Tags -->
    <div class="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
      <span>Systems Architecture</span>
      <span class="text-stone-300 dark:text-stone-700">•</span>
      <span>Open-Source Craft</span>
      <span class="text-stone-300 dark:text-stone-700">•</span>
      <span>Technical Research</span>
      <span class="text-stone-300 dark:text-stone-700">•</span>
      <span class="text-stone-400 dark:text-stone-500 italic">Documentary Optics</span>
    </div>
  </div>

  <!-- Bottom Interaction Prompt -->
  <div class="relative z-10 px-6 sm:px-8 md:px-10 pb-5 pt-4 flex items-center justify-between text-[11px] font-mono text-stone-400 dark:text-stone-500">
    <div class="flex items-center gap-2">
      <span class="inline-block w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700"></span>
      <span>Hover or drag near water to ripple · Watch the origami boat navigate the tide</span>
    </div>
    <span class="hidden sm:inline text-stone-400/80 dark:text-stone-500 italic font-serif">Ambient water surface</span>
  </div>
</div>
