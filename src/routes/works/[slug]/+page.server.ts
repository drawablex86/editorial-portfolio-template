import { error } from '@sveltejs/kit';
import { getWorkBySlug, getAllWorks } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const project = getWorkBySlug(params.slug);
  if (!project) {
    throw error(404, `Work "${params.slug}" not found`);
  }

  // Sibling works in the same archive order, reduced to the fields the
  // prev/next footer cards actually render.
  const archive = getAllWorks();
  const index = archive.findIndex((w) => w.id === project.id);
  const toSibling = (w: typeof project | undefined) =>
    w ? { id: w.id, title: w.title, year: w.year, projectType: w.projectType } : null;

  return {
    project,
    work: project,
    prevWork: index > 0 ? toSibling(archive[index - 1]) : null,
    nextWork: index !== -1 && index < archive.length - 1 ? toSibling(archive[index + 1]) : null
  };
};
