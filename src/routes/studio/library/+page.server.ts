import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getLibraryData } from '$lib/server/content';
import { saveLibrarySpotlight } from '$lib/server/studio';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  if (!dev) {
    throw error(404, 'Studio is only accessible in local development mode');
  }

  const libraryData = getLibraryData();
  return {
    libraryData,
  };
};

export const actions: Actions = {
  updateSpotlight: async ({ request }) => {
    if (!dev) {
      throw error(403, 'Studio is only accessible in development');
    }

    const formData = await request.formData();
    const spotlightIdsRaw = formData.get('spotlightIds');
    const quoteUpdatesRaw = formData.get('quoteUpdates');

    try {
      const spotlightIds: string[] = JSON.parse(spotlightIdsRaw ? String(spotlightIdsRaw) : '[]');
      const quoteUpdates: Record<string, string> = quoteUpdatesRaw
        ? JSON.parse(String(quoteUpdatesRaw))
        : {};

      const result = saveLibrarySpotlight(spotlightIds, quoteUpdates);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  },
};
