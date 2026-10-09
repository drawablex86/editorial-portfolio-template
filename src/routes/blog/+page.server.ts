import { getMarkdownItems } from '$lib/server/content';
import { buildLinguisticCorpus, cleanMarkdownText } from '$lib/server/linguistics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const allPosts = getMarkdownItems('blog');

  // Extract linguistic corpus from full markdown bodies for generative canvas
  const linguisticCorpus = buildLinguisticCorpus(
    allPosts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      description: p.description
    }))
  );

  // Prepare blogData with lightweight cleaned searchable content for full-text filtering
  const blogData = allPosts.map(({ body, ...rest }) => ({
    ...rest,
    searchableContent: body ? cleanMarkdownText(body) : ''
  }));

  return {
    blogData,
    linguisticCorpus
  };
};
