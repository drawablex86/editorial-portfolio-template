<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { page } from '$app/state';

  /**
   * Route progress bar. Starts on link clicks that SvelteKit will handle
   * client-side and completes on `afterNavigate`. Purely decorative, so it is
   * hidden from assistive tech and collapsed by the global reduced-motion rule.
   */
  let active = $state(false);
  let progress = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const SAME_PAGE_HASH = /^#/;

  function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent): boolean {
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.dataset.noProgress !== undefined) return false;
    if (anchor.getAttribute('rel')?.includes('external')) return false;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    // In-page anchors are handled by the native smooth scroll, not the router.
    if (SAME_PAGE_HASH.test(href)) return false;

    let url: URL;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }
    if (url.origin !== window.location.origin) return false;

    // Same path, only a different hash — no route change to wait for.
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }
    return true;
  }

  function start() {
    clearTimers();
    active = true;
    // Jump to 90% and creep: the final stretch is reserved for completion so
    // the bar never sits at 100% while the page is still loading.
    progress = 8;
    timer = setInterval(() => {
      progress = Math.min(90, progress + (90 - progress) * 0.12);
    }, 180);
  }

  function finish() {
    clearTimers();
    progress = 100;
    resetTimer = setTimeout(() => {
      active = false;
      progress = 0;
    }, 320);
  }

  function clearTimers() {
    if (timer) clearInterval(timer);
    if (resetTimer) clearTimeout(resetTimer);
    timer = undefined;
    resetTimer = undefined;
  }

  // `onNavigate` fires before the router commits the new URL, which is exactly
  // when the bar should appear. The return value is an unsubscribe function.
  onNavigate((navigation) => {
    if (navigation.type === 'link' || navigation.type === 'goto' || navigation.type === 'popstate') {
      start();
    }
  });

  $effect(() => {
    // Track the resolved route so `afterNavigate` runs for both link clicks and
    // programmatic `goto()` calls.
    page.url.pathname;
    page.url.search;
    if (active) finish();
    return clearTimers;
  });
</script>

<div
  class="fixed top-0 left-0 w-full h-[2.5px] z-[60] pointer-events-none"
  aria-hidden="true"
>
  <div
    class="h-full bg-[#2C2B29] dark:bg-[#EDE9E1] transition-[width,opacity] duration-200 ease-out"
    style="width: {progress}%; opacity: {active ? 1 : 0};"
  ></div>
</div>
