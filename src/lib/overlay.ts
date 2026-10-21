/**
 * Shared overlay/dialog behaviour: initial focus, focus trap (Tab wrapping),
 * focus restore on close, and body scroll lock.
 *
 * Usage from a Svelte 5 component:
 *
 *   let dialogEl: HTMLElement | null = $state(null);
 *   let isOpen = $state(false);
 *
 *   $effect(() => {
 *     if (!isOpen) return;
 *     const cleanup = trapFocus(dialogEl);
 *     return cleanup;
 *   });
 *
 * The helper returns a cleanup function that must be called when the overlay
 * closes (the `$effect` teardown covers this automatically). `trapFocus` also
 * locks `document.body` scroll and restores the previously focused element,
 * so it is the single entry point every overlay should use.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary:first-of-type',
].join(',');

/** Elements that are focusable and actually visible. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
  return candidates.filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    // `hidden`, `display:none` and zero-size elements report no client rects.
    return el.getClientRects().length > 0;
  });
}

/**
 * Number of active overlays. Refcounted so nested/stacked overlays only release
 * the body scroll lock once the last one closes.
 */
let lockCount = 0;
let previousOverflow: string | null = null;

function lockScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlockScroll() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? '';
    previousOverflow = null;
  }
}

export interface TrapFocusOptions {
  /** Move focus into the overlay on open. Defaults to `true`. */
  autoFocus?: boolean;
  /** Restore focus to the previously focused element on close. Defaults to `true`. */
  restoreFocus?: boolean;
  /** Lock body scroll while open. Defaults to `true`. */
  lockBodyScroll?: boolean;
  /** Preferred element to focus on open, if present and focusable. */
  initialFocus?: HTMLElement | null;
}

/**
 * Activate focus trapping + scroll lock for a dialog container.
 * Returns a cleanup function; safe to call when `container` is null (no-op).
 */
export function trapFocus(
  container: HTMLElement | null | undefined,
  options: TrapFocusOptions = {}
): () => void {
  if (typeof document === 'undefined' || !container) return () => {};

  const { autoFocus = true, restoreFocus = true, lockBodyScroll = true, initialFocus } = options;

  const previouslyFocused =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (lockBodyScroll) lockScroll();

  if (autoFocus) {
    // Prefer an [autofocus] target, then an explicit one, then the first
    // focusable child, then the container itself.
    const explicit =
      initialFocus ??
      container.querySelector<HTMLElement>('[autofocus]') ??
      getFocusable(container)[0] ??
      container;
    // Wait a frame so transition/`{#if}` mounted content is measurable.
    requestAnimationFrame(() => {
      try {
        explicit.focus({ preventScroll: true });
      } catch {
        /* element may have been removed */
      }
    });
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable(container);
    if (focusable.length === 0) {
      // Nothing tabbable inside — keep focus pinned to the container.
      e.preventDefault();
      container.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || active === container || !container.contains(active)) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else if (active === last || !container.contains(active)) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  document.addEventListener('keydown', onKeyDown, true);

  return () => {
    document.removeEventListener('keydown', onKeyDown, true);
    if (lockBodyScroll) unlockScroll();
    if (restoreFocus && previouslyFocused && document.contains(previouslyFocused)) {
      try {
        previouslyFocused.focus({ preventScroll: true });
      } catch {
        /* element may have been removed */
      }
    }
  };
}
