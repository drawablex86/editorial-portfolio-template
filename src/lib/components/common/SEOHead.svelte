<script lang="ts">
  import { page } from '$app/state';
  import type { SeoSettings, AiDeterrenceConfig } from '$lib/types';

  interface Props {
    title?: string;
    description?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'profile';
    publishDate?: string;
    noIndex?: boolean;
    canonicalPath?: string;
  }

  let {
    title,
    description,
    ogImage,
    ogType = 'website',
    publishDate,
    noIndex = false,
    canonicalPath,
  }: Props = $props();

  // Root layout data contains current site-wide seoSettings
  let settings = $derived<SeoSettings | undefined>(page.data?.seoSettings);

  let siteUrl = $derived(settings?.siteUrl || 'https://example.com');
  let cleanBaseUrl = $derived(siteUrl.replace(/\/+$/, ''));

  // Compute final title with titleTemplate
  let computedTitle = $derived.by(() => {
    if (!title) return settings?.siteTitle || 'Linus Torvalds — Systems Architecture & Engineering';
    const template = settings?.titleTemplate || '%s | Linus Torvalds';
    return template.includes('%s') ? template.replace('%s', title) : `${title} | ${settings?.siteTitle || 'Linus Torvalds'}`;
  });

  let computedDescription = $derived(
    description || settings?.defaultDescription || 'Portfolio of Linus Torvalds — systems architect and software engineer.'
  );

  // Compute canonical URL
  let canonicalUrl = $derived.by(() => {
    if (canonicalPath) {
      if (canonicalPath.startsWith('http://') || canonicalPath.startsWith('https://')) return canonicalPath;
      const path = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
      return `${cleanBaseUrl}${path}`;
    }
    const currentPath = page.url.pathname;
    return `${cleanBaseUrl}${currentPath === '/' ? '' : currentPath}`;
  });

  // Compute OpenGraph image (absolute URL)
  let computedOgImage = $derived.by(() => {
    const rawImg = ogImage || settings?.defaultOgImage || '/images/avatar.webp';
    if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) return rawImg;
    const cleanImg = rawImg.startsWith('/') ? rawImg : `/${rawImg}`;
    return `${cleanBaseUrl}${cleanImg}`;
  });

  let twitterHandle = $derived(settings?.twitterHandle || '@torvalds');
  let authorProfile = $derived(settings?.author);
  let aiDeterrence = $derived<AiDeterrenceConfig | undefined>(page.data?.aiDeterrenceSettings);

  // Build JSON-LD structured data graph
  let structuredDataJson = $derived.by(() => {
    const graph: any[] = [];

    // 1. Person Graph (Author Card & Knowledge Graph entity)
    if (authorProfile) {
      graph.push({
        '@type': 'Person',
        '@id': `${cleanBaseUrl}/#author`,
        name: authorProfile.name,
        jobTitle: authorProfile.jobTitle,
        description: authorProfile.bio,
        image: authorProfile.avatar ? (authorProfile.avatar.startsWith('http') ? authorProfile.avatar : `${cleanBaseUrl}${authorProfile.avatar}`) : undefined,
        url: authorProfile.url || `${cleanBaseUrl}/about`,
        sameAs: authorProfile.sameAs || [],
        address: authorProfile.location ? {
          '@type': 'PostalAddress',
          addressLocality: authorProfile.location,
        } : undefined,
      });
    }

    // 2. WebSite Graph
    graph.push({
      '@type': 'WebSite',
      '@id': `${cleanBaseUrl}/#website`,
      url: cleanBaseUrl,
      name: settings?.siteTitle || 'Linus Torvalds',
      description: settings?.defaultDescription,
      publisher: {
        '@id': `${cleanBaseUrl}/#author`,
      },
      inLanguage: 'en-US',
    });

    // 3. Page / CreativeWork / Article Graph
    if (ogType === 'article') {
      graph.push({
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        isPartOf: {
          '@id': `${cleanBaseUrl}/#website`,
        },
        headline: title || computedTitle,
        description: computedDescription,
        url: canonicalUrl,
        image: computedOgImage,
        datePublished: publishDate,
        inLanguage: 'en-US',
        author: {
          '@id': `${cleanBaseUrl}/#author`,
        },
        publisher: {
          '@id': `${cleanBaseUrl}/#author`,
        },
        copyrightHolder: {
          '@id': `${cleanBaseUrl}/#author`,
        },
      });
    } else if (page.url.pathname.startsWith('/works/') || page.url.pathname.startsWith('/projects/')) {
      graph.push({
        '@type': 'CreativeWork',
        '@id': `${canonicalUrl}#work`,
        headline: title || computedTitle,
        description: computedDescription,
        url: canonicalUrl,
        image: computedOgImage,
        author: {
          '@id': `${cleanBaseUrl}/#author`,
        },
        creator: {
          '@id': `${cleanBaseUrl}/#author`,
        },
        copyrightHolder: {
          '@id': `${cleanBaseUrl}/#author`,
        },
      });
    }

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });
  });
</script>

<svelte:head>
  <!-- Primary Meta Tags -->
  <title>{computedTitle}</title>
  <meta name="title" content={computedTitle} />
  <meta name="description" content={computedDescription} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Declarative AI Scraping & Anti-Training Directives -->
  {#if noIndex}
    <meta name="robots" content="noindex, nofollow, noai, noimageai" />
  {:else}
    <meta name="robots" content="index, follow, noai, noimageai" />
  {/if}

  {#if aiDeterrence?.reserveRights}
    <!-- EU AI Act (Art. 53) & EU Copyright Directive Art. 4 W3C TDMRep standard tags -->
    <meta name="tdm-reservation" content="1" />
    {#if aiDeterrence.tdmPolicyUrl}
      <meta name="tdm-policy" content={aiDeterrence.tdmPolicyUrl} />
    {/if}
  {/if}

  <!-- OpenGraph / Facebook -->
  <meta property="og:type" content={ogType} />
  <meta property="og:site_name" content={settings?.siteTitle || 'Linus Torvalds'} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={computedTitle} />
  <meta property="og:description" content={computedDescription} />
  <meta property="og:image" content={computedOgImage} />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  {#if twitterHandle}
    <meta name="twitter:site" content={twitterHandle} />
    <meta name="twitter:creator" content={twitterHandle} />
  {/if}
  <meta name="twitter:url" content={canonicalUrl} />
  <meta name="twitter:title" content={computedTitle} />
  <meta name="twitter:description" content={computedDescription} />
  <meta name="twitter:image" content={computedOgImage} />

  <!-- Schema.org JSON-LD Structured Data Multi-Graph -->
  {@html `<script type="application/ld+json">${structuredDataJson}<\/script>`}
</svelte:head>
