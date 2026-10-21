import { getSeoSettings, saveSeoSettings } from '$lib/server/seo';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SeoSettings } from '$lib/types';

export const load: PageServerLoad = async () => {
  const seoSettings = getSeoSettings();

  return {
    seoSettings,
  };
};

export const actions: Actions = {
  saveAnalytics: async ({ request }) => {
    const data = await request.formData();
    const payload = data.get('payload');

    if (typeof payload !== 'string') {
      return fail(400, { error: 'Payload missing' });
    }

    try {
      const parsed: Partial<SeoSettings> = JSON.parse(payload);
      // Only allow goatCounter updates through this action
      const goatCounterSettings = {
        goatCounter: parsed.goatCounter
      };
      const res = saveSeoSettings(goatCounterSettings);
      if (!res.success) {
        return fail(500, { error: res.error || 'Failed to save analytics settings' });
      }
      return { success: true };
    } catch (e: any) {
      return fail(400, { error: e.message || 'Malformed JSON payload' });
    }
  }
};