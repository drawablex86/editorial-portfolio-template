import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getZineBySlug } from '$lib/server/zines';

export const load: PageServerLoad = async ({ params }) => {
  const zine = getZineBySlug(params.slug);

  if (!zine) {
    throw error(404, `Zine "${params.slug}" not found on the stand.`);
  }

  return {
    zine,
  };
};
