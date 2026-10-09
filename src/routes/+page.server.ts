import { getAllProjects, getDeskData } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const allProjects = getAllProjects();
  // Strip heavy markdown bodies for the home page cards to save serialization size
  const projectsData = allProjects.map(({ body, ...rest }) => rest);
  const deskData = getDeskData();

  return {
    projectsData,
    deskData,
  };
};
