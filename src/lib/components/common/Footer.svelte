<script lang="ts">
  import { page } from '$app/state';
  import { ArrowUp, Mail } from '@lucide/svelte';

  let author = $derived(page.data?.seoSettings?.author);
  let substackUrl = $derived(
    author?.sameAs?.find((u: string) => u.includes('substack.com')) ||
    'https://example.com/newsletter'
  );

  const NAV_LINKS = [
    { href: '/works', label: 'Works' },
    { href: '/blog', label: 'Writing' },
    { href: '/now', label: 'Now' },
    { href: '/library', label: 'Library' },
    { href: '/zines', label: 'Zines' },
    { href: '/inspiration', label: 'Cosmology' },
    { href: '/about', label: 'About' },
    { href: '/rights', label: 'Rights & TDM' }
  ];

  /**
   * Derives a readable platform label from a profile URL, so the CMS
   * `sameAs` list can stay a plain array of URLs.
   */
  function platformLabel(url: string): string {
    if (url.startsWith('mailto:')) return 'Email';
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      const known: Record<string, string> = {
        'substack.com': 'Newsletter',
        'instagram.com': 'Instagram',
        'twitter.com': 'Twitter',
        'x.com': 'X',
        'linkedin.com': 'LinkedIn',
        'github.com': 'GitHub',
        'youtube.com': 'YouTube',
        'are.na': 'Are.na',
        'goodreads.com': 'Goodreads'
      };
      for (const [key, label] of Object.entries(known)) {
        if (host === key || host.endsWith(`.${key}`)) return label;
      }
      return host;
    } catch {
      return url;
    }
  }

  function toTop() {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<footer
  class="w-full border-t border-[#E8E6DF] dark:border-[#2E2C28] bg-[#F4F2ED] dark:bg-[#141312] py-16 px-6 md:px-16 mt-24 transition-colors duration-200"
>
  <div class="max-w-6xl mx-auto space-y-12">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <!-- Newsletter Subscription -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-[#2C2B29] dark:text-[#EDE9E1] uppercase tracking-widest font-sans">
          Subscribe to Newsletter
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400 font-serif">
          Get essays on art, design, culture, creative labour, and political history delivered straight to your inbox.
        </p>
        <form
          action={`${substackUrl}/subscribe`}
          method="GET"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col sm:flex-row gap-2 max-w-md"
        >
          <label for="footer-newsletter-email" class="sr-only">
            Email address for newsletter updates
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            class="flex-1 bg-white dark:bg-[#1C1B19] border border-[#E8E6DF] dark:border-[#2E2C28] px-4 py-2.5 rounded-xs text-sm font-serif text-[#2C2B29] dark:text-[#EDE9E1] placeholder:text-stone-500 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1]"
          />
          <button
            type="submit"
            class="min-h-[44px] bg-[#2C2B29] dark:bg-[#EDE9E1] text-[#F4F2ED] dark:text-[#141312] px-5 py-2.5 rounded-xs text-xs uppercase tracking-widest font-sans hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C2B29] dark:focus:ring-[#EDE9E1] cursor-pointer"
          >
            Subscribe
          </button>
        </form>
      </div>

      <!-- Sitemap & Elsewhere -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 md:justify-items-end">
        <nav aria-label="Footer navigation" class="space-y-3">
          <h2 class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
            Browse
          </h2>
          <ul class="grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-2 text-sm font-sans">
            {#each NAV_LINKS as link}
              <li>
                <a
                  href={link.href}
                  class="text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors"
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </nav>

        {#if author?.sameAs && author.sameAs.length > 0}
          <div class="space-y-3">
            <h2 class="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Elsewhere
            </h2>
            <ul class="space-y-2 text-sm font-sans">
              {#each author.sameAs as url}
                <li>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] transition-colors"
                  >
                    {#if platformLabel(url) === 'Email'}
                      <Mail size={13} />
                    {/if}
                    <span class="underline decoration-stone-300 dark:decoration-stone-700 underline-offset-4">
                      {platformLabel(url)}
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>

    <!-- Brand & Rights -->
    <div class="border-t border-[#E8E6DF] dark:border-[#2E2C28] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5 text-stone-600 dark:text-stone-400 font-sans text-xs tracking-wider">
        <div class="flex flex-wrap items-center gap-2.5">
          <p class="flex items-center gap-1">
            <span class="inline-block rotate-180 font-bold" aria-hidden="true">©</span>
            {new Date().getFullYear()} {author?.name || 'Linus Torvalds'}. All rights reversed.
          </p>
          <span class="text-stone-300 dark:text-stone-700" aria-hidden="true">·</span>
          <a
            href="/rights"
            class="underline decoration-stone-300 dark:decoration-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Rights &amp; TDM Policy
          </a>
        </div>
        <p class="text-[11px] text-stone-600 dark:text-stone-400 font-serif">
          Vibe coded with intention using Trae IDE and Anti-Gravity
        </p>
      </div>

      <button
        type="button"
        onclick={toTop}
        class="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-xs border border-[#E8E6DF] dark:border-[#2E2C28] text-[11px] font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:text-[#2C2B29] dark:hover:text-[#EDE9E1] hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer"
      >
        <ArrowUp size={13} />
        <span>Back to top</span>
      </button>
    </div>
  </div>
</footer>
