import { error, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getInspirationFile, saveInspirationFile } from '$lib/server/studio';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  if (!dev) {
    throw error(404, 'Studio is only accessible in development mode');
  }

  const file = getInspirationFile();
  if (!file) {
    throw error(404, 'inspiration.md not found');
  }

  return {
    data: file.data,
    content: file.content,
  };
};

export const actions: Actions = {
  save: async ({ request }) => {
    if (!dev) {
      throw error(403, 'Forbidden');
    }

    const formData = await request.formData();
    const payloadRaw = formData.get('payload') as string;

    if (!payloadRaw) {
      return fail(400, { message: 'Missing inspiration payload' });
    }

    try {
      const payload = JSON.parse(payloadRaw);
      const { frontmatter, body } = payload;

      const result = saveInspirationFile(frontmatter, body);
      if (!result.success) {
        return fail(500, { message: result.error || 'Failed to save inspiration file' });
      }

      return { success: true, savedAt: Date.now() };
    } catch (err: any) {
      return fail(500, { message: err.message || 'Serialization error' });
    }
  },
};
