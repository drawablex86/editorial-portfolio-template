import { getAllWorks } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const allWorks = getAllWorks();

  // Strip large markdown body content for lighter payload in index listing
  const works = allWorks.map(({ body, ...rest }) => rest);

  return {
    works,
    // Provide backwards-compatible field for components expecting projects
    projects: works
  };
};
