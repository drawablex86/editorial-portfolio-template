import { getMarkdownItems } from '$lib/server/content';
import type { LayoutServerLoad } from './$types';

/**
 * Shared across the blog index and every essay detail page so the sticky
 * writing bar can render the table of contents, search, and linear
 * prev/next navigation without re-fetching the corpus per route.
 */
export const load: LayoutServerLoad = async () => {
  const allPosts = getMarkdownItems('blog').map((p) => ({
    id: p.id,
    title: p.title,
    year: p.year,
  }));

  return { allPosts };
};
