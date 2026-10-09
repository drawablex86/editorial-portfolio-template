<script lang="ts">
  import { onMount } from 'svelte';

  interface WindParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    life: number;
    maxLife: number;
  }

  let canvasRef = $state<HTMLCanvasElement>();
  let ctx: CanvasRenderingContext2D | null = null;

  // Flight positions & physics
  let mouseX = -100;
  let mouseY = -100;
  let currentX = -100;
  let currentY = -100;
  let prevX = -100;
  let prevY = -100;

  let currentAngle = -45; // Default orientation pointing up-left
  let targetAngle = -45;
  let velocity = 0;

  // Interaction states
  let isHoveringInteractive = $state(false);
  let isPointerDown = $state(false);
  let isHidden = $state(true);
  let isTouchDevice = $state(false);

  // RAF loop management: automatically sleeps when idle to save CPU/battery
  let isRafRunning = false;
  let rafId: number | null = null;
  let idleTimer = 0;

  const particles: WindParticle[] = [];

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // Shortest angular difference interpolation for smooth 360-degree rotation
  function lerpAngle(fromAngle: number, toAngle: number, t: number): number {
    let diff = (toAngle - fromAngle) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return fromAngle + diff * t;
  }

  function spawnWindParticles(x: number, y: number, angleRad: number, speed: number) {
    if (speed < 1.5) return;

    // Wing offset positions relative to flight angle
    const wingSpan = 7;
    const tailOffset = 8;
    const perpX = Math.cos(angleRad + Math.PI / 2);
    const perpY = Math.sin(angleRad + Math.PI / 2);
    const backX = -Math.cos(angleRad) * tailOffset;
    const backY = -Math.sin(angleRad) * tailOffset;

    // Left and right wingtip emission points
    const leftWingX = x + backX + perpX * wingSpan;
    const leftWingY = y + backY + perpY * wingSpan;
    const rightWingX = x + backX - perpX * wingSpan;
    const rightWingY = y + backY - perpY * wingSpan;

    // Backward velocity opposite to flight direction
    const trailSpeed = 0.5 + Math.random() * 0.8;
    const driftAngle = angleRad + Math.PI + (Math.random() - 0.5) * 0.4;
    const vx = Math.cos(driftAngle) * trailSpeed;
    const vy = Math.sin(driftAngle) * trailSpeed;

    const maxLife = 18 + Math.random() * 12;

    particles.push(
      {
        x: leftWingX,
        y: leftWingY,
        vx,
        vy,
        size: 1.5 + Math.random() * 1.5,
        opacity: 0.65,
        life: 0,
        maxLife,
      },
      {
        x: rightWingX,
        y: rightWingY,
        vx,
        vy,
        size: 1.5 + Math.random() * 1.5,
        opacity: 0.65,
        life: 0,
        maxLife,
      }
    );

    // Keep memory bounded
    if (particles.length > 50) {
      particles.splice(0, particles.length - 50);
    }
  }

  function renderLoop() {
    if (!ctx || !canvasRef) {
      isRafRunning = false;
      return;
    }

    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

    // Smooth position interpolation (smooth lerp follow)
    currentX = lerp(currentX, mouseX, 0.4);
    currentY = lerp(currentY, mouseY, 0.4);

    const dx = mouseX - prevX;
    const dy = mouseY - prevY;
    velocity = Math.sqrt(dx * dx + dy * dy);

    prevX = mouseX;
    prevY = mouseY;

    // When moving, calculate flight angle
    if (velocity > 0.8) {
      // Offset so the nose of the plane aligns with movement direction
      const rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      targetAngle = rawAngle + 90;
      idleTimer = 0;
    } else {
      idleTimer += 1;
    }

    currentAngle = lerpAngle(currentAngle, targetAngle, 0.25);

    const rad = ((currentAngle - 90) * Math.PI) / 180;

    // Spawn wind trail when moving
    if (velocity > 1.2 && !isHidden) {
      spawnWindParticles(currentX, currentY, rad, velocity);
    }

    // 1. Render Wind Particles (Hardware accelerated canvas paths)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      const progress = p.life / p.maxLife;
      const currentOpacity = p.opacity * (1 - progress);

      if (progress >= 1) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(225, 75, 45, ${currentOpacity * 0.45})`;
      ctx.fill();

      // Delicate air current white core
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.size * 0.6) * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 235, ${currentOpacity * 0.75})`;
      ctx.fill();
      ctx.restore();
    }

    // 2. Render Red Paper Plane
    if (!isHidden) {
      ctx.save();
      ctx.translate(currentX, currentY);
      ctx.rotate((currentAngle * Math.PI) / 180);

      const scale = isHoveringInteractive
        ? (isPointerDown ? 1.05 : 1.25)
        : (isPointerDown ? 0.9 : 1.0);

      ctx.scale(scale, scale);

      // Subtle drop shadow under the paper plane for depth
      ctx.shadowColor = 'rgba(44, 43, 41, 0.22)';
      ctx.shadowBlur = isHoveringInteractive ? 8 : 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      // Origami Paper Plane Geometry
      // Left Wing (Lighter Crimson facet)
      ctx.beginPath();
      ctx.moveTo(0, -11);      // Nose tip
      ctx.lineTo(-9, 10);     // Left wing corner
      ctx.lineTo(0, 5);       // Center keel
      ctx.closePath();
      ctx.fillStyle = '#EF4444'; // Bright warm crimson
      ctx.fill();

      // Right Wing (Deeper Crimson facet for 3D paper fold)
      ctx.beginPath();
      ctx.moveTo(0, -11);      // Nose tip
      ctx.lineTo(9, 10);      // Right wing corner
      ctx.lineTo(0, 5);       // Center keel
      ctx.closePath();
      ctx.fillStyle = '#DC2626'; // Shaded crimson
      ctx.fill();

      // Left Underside Keel Fold
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-3, 8);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fillStyle = '#F87171'; // Light paper crease highlight
      ctx.fill();

      // Right Underside Keel Fold
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 8);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fillStyle = '#B91C1C'; // Deep shadow crease
      ctx.fill();

      // Crisp center crease spine
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, 5);
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.restore();
    }

    // Performance auto-sleep: sleep RAF loop when idle and particles have cleared
    if (idleTimer > 45 && particles.length === 0) {
      isRafRunning = false;
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(renderLoop);
  }

  function startRafIfNeeded() {
    if (!isRafRunning) {
      isRafRunning = true;
      rafId = requestAnimationFrame(renderLoop);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (isTouchDevice) return;

    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isHidden) {
      isHidden = false;
      currentX = mouseX;
      currentY = mouseY;
      prevX = mouseX;
      prevY = mouseY;
    }

    // Inspect hovered target for interactive conventions
    const target = e.target as HTMLElement | null;
    if (target) {
      const interactiveEl = target.closest('a, button, input, select, textarea, [role="button"], label, summary, [data-hover-card]');
      isHoveringInteractive = !!interactiveEl;
    }

    startRafIfNeeded();
  }

  function handlePointerDown() {
    isPointerDown = true;
    startRafIfNeeded();
  }

  function handlePointerUp() {
    isPointerDown = false;
    startRafIfNeeded();
  }

  function handleMouseLeave() {
    isHidden = true;
    startRafIfNeeded();
  }

  function handleMouseEnter() {
    isHidden = false;
    startRafIfNeeded();
  }

  function handleResize() {
    if (!canvasRef) return;
    canvasRef.width = window.innerWidth;
    canvasRef.height = window.innerHeight;
    startRafIfNeeded();
  }

  onMount(() => {
    // Detect whether device supports fine mouse pointer
    isTouchDevice = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (isTouchDevice) return;

    if (canvasRef) {
      canvasRef.width = window.innerWidth;
      canvasRef.height = window.innerHeight;
      ctx = canvasRef.getContext('2d');
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  });
</script>

{#if !isTouchDevice}
  <canvas
    bind:this={canvasRef}
    class="fixed inset-0 pointer-events-none z-[9999] select-none"
    aria-hidden="true"
  ></canvas>
{/if}
