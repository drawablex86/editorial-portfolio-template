import { getMarkdownItems } from '$lib/server/content';
import { buildLinguisticCorpus, cleanMarkdownText } from '$lib/server/linguistics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const allPostItems = getMarkdownItems('blog');

  // Support shareable/bookmarkable searches arriving as /blog?q=…
  const initialQuery = url.searchParams.get('q') ?? '';

  // Extract linguistic corpus from full markdown bodies for generative canvas
  const linguisticCorpus = buildLinguisticCorpus(
    allPostItems.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      description: p.description
    }))
  );

  // Prepare blogData with lightweight cleaned searchable content for full-text filtering
  const blogData = allPostItems.map(({ body, ...rest }) => ({
    ...rest,
    searchableContent: body ? cleanMarkdownText(body) : '',
    // Derive reading time for list metadata when frontmatter omits it
    readingTime:
      rest.readingTime ||
      (body ? `${Math.max(1, Math.round(body.trim().split(/\s+/).length / 220))} min read` : undefined)
  }));

  return {
    blogData,
    linguisticCorpus,
    initialQuery
  };
};
