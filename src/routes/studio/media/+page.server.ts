import { error, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getMediaAssets, deleteMediaAssets } from '$lib/server/studio';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  if (!dev) {
    throw error(404, 'Studio is only accessible in development mode');
  }

  const assets = getMediaAssets();
  return {
    assets,
  };
};

export const actions: Actions = {
  deleteBatch: async ({ request }) => {
    if (!dev) {
      throw error(403, 'Forbidden');
    }

    const formData = await request.formData();
    const filenamesJson = formData.get('filenames') as string;

    if (!filenamesJson) {
      return fail(400, { message: 'No assets selected for deletion' });
    }

    try {
      const filenames = JSON.parse(filenamesJson);
      if (!Array.isArray(filenames) || filenames.length === 0) {
        return fail(400, { message: 'Invalid asset selection' });
      }

      const result = deleteMediaAssets(filenames);
      return {
        success: result.success,
        deletedCount: result.deletedCount,
        errors: result.errors,
      };
    } catch (err: any) {
      return fail(500, { message: err.message || 'Deletion error' });
    }
  },
};
