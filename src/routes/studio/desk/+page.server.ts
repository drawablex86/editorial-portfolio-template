import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getDeskFile, saveDeskFile } from '$lib/server/studio';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  if (!dev) {
    throw error(404, 'Studio is only accessible in local development mode');
  }

  const fileData = getDeskFile();
  if (!fileData) {
    return {
      data: {
        title: '3D Studio Desk',
        sheets: [],
      },
      content: '',
    };
  }

  return {
    data: fileData.data,
    content: fileData.content,
  };
};

export const actions: Actions = {
  save: async ({ request }) => {
    if (!dev) {
      throw error(403, 'Studio is only accessible in development');
    }

    const formData = await request.formData();
    const sheetsJson = formData.get('sheetsJson');
    const title = formData.get('title');

    try {
      const sheets = JSON.parse(sheetsJson ? String(sheetsJson) : '[]');
      const frontmatter = {
        title: title ? String(title) : '3D Studio Desk',
        sheets,
      };

      const result = saveDeskFile(frontmatter, '');
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
