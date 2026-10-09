<footer
  class="w-full border-t border-[#E8E6DF] dark:border-[#2E2C28] bg-[#F4F2ED] dark:bg-[#141312] py-16 px-6 md:px-16 mt-24 transition-colors duration-200"
>
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    <!-- Newsletter Subscription -->
    <div class="space-y-4">
      <h2 class="text-sm font-semibold text-[#2C2B29] dark:text-[#EDE9E1] uppercase tracking-widest font-sans">
        Newsletter &amp; Dispatches
      </h2>
      <p class="text-sm text-stone-600 dark:text-stone-400 font-serif">
        Get occasional essays, release notes, and engineering dispatches delivered straight to your inbox.
      </p>
      <form
        action="#"
        method="POST"
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

    <!-- Brand & Rights -->
    <div class="flex flex-col md:items-end space-y-2 text-stone-600 dark:text-stone-400 font-sans text-xs tracking-wider">
      <div class="flex items-center gap-2.5">
        <p class="flex items-center gap-1">
          <span class="inline-block rotate-180 font-bold" aria-hidden="true">©</span>
          {new Date().getFullYear()} Linus Torvalds. All rights reversed.
        </p>
        <span class="text-stone-300 dark:text-stone-700">·</span>
        <a
          href="/rights"
          class="underline decoration-stone-300 dark:decoration-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          Rights &amp; TDM Policy
        </a>
      </div>
      <p class="text-[11px] text-stone-600 dark:text-stone-400 font-serif">
        Minimalist Editorial Portfolio &amp; Spatial Studio Engine
      </p>
    </div>
  </div>
</footer>
