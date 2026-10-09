import { error } from '@sveltejs/kit';
import { getWorkBySlug } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const project = getWorkBySlug(params.slug);
  if (!project) {
    throw error(404, `Work "${params.slug}" not found`);
  }

  return {
    project,
    work: project
  };
};
