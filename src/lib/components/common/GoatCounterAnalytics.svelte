<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';

  let { seoSettings } = $props();

  let isMounted = $state(false);

  // Derive goatCounter config from SEO settings
  let goatCounter = $derived(seoSettings?.goatCounter || {
    enabled: false,
    code: '',
    domain: '',
    allowFrame: false,
    email: 'rahulrajeev1975@gmail.com'
  });

  $effect(() => {
    if (!browser) return;
    isMounted = true;
  });

  $effect(() => {
    if (!isMounted || !browser) return;
    if (!goatCounter.enabled || !goatCounter.code) return;

    // Respect Do Not Track
    if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') {
      return;
    }

    // Don't track on localhost/development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return;
    }

    // Remove any existing GoatCounter script
    const existingScript = document.querySelector('script[data-goatcounter]');
    if (existingScript) {
      existingScript.remove();
    }

    // Build GoatCounter URL
    const baseDomain = goatCounter.domain || `${goatCounter.code}.goatcounter.com`;
    const scriptSrc = `https://${baseDomain}/count.js`;

    // Create and inject script
    const script = document.createElement('script');
    script.async = true;
    script.src = scriptSrc;
    script.dataset.goatcounter = goatCounter.code;
    script.setAttribute('data-goatcounter', goatCounter.code);
    script.setAttribute('data-goatcounter-settings', JSON.stringify({
      allow_frame: goatCounter.allowFrame || false
    }));

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const s = document.querySelector('script[data-goatcounter]');
      if (s) s.remove();
    };
  });

  // Track page navigation (SPA)
  $effect(() => {
    if (!isMounted || !browser) return;
    if (!goatCounter.enabled || !goatCounter.code) return;

    // GoatCounter automatically tracks page views via popstate/hashchange
    // But we can manually trigger for SPA navigation if needed
    const path = page.url.pathname + page.url.search;
    if ((window as any).goatcounter && typeof (window as any).goatcounter.count === 'function') {
      (window as any).goatcounter.count({
        path,
        title: document.title,
        referrer: document.referrer
      });
    }
  });
</script>

<!-- GoatCounter Analytics Component - No visible UI -->
<!-- Script is injected into <head> via $effect above -->