import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { getAllStudioItems } from '$lib/server/studio';

export async function load() {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(404, 'Studio is only accessible in local development mode.');
  }

  const items = getAllStudioItems();
  return {
    studioItems: items,
  };
}
