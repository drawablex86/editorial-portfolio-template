import { getMarkdownItemBySlug, getMarkdownItems } from '$lib/server/content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, EntryGenerator } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const post = getMarkdownItemBySlug('blog', params.slug);
  if (!post) {
    throw error(404, 'Essay not found');
  }

  // Only project id, title, and year for prev/next serendipity cards
  const allPosts = getMarkdownItems('blog').map((p) => ({
    id: p.id,
    title: p.title,
    year: p.year,
  }));

  return { post, allPosts };
};

export const entries: EntryGenerator = () => {
  const items = getMarkdownItems('blog');
  return items.map((item) => ({ slug: item.id }));
};
