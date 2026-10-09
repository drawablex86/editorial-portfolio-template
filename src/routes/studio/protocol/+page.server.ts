import { getPipelineStatus } from '$lib/server/pipeline';
import { getAiDeterrenceSettings, saveAiDeterrenceSettings } from '$lib/server/ai-deterrence';
import { getPipelineConfig, resolveVaultDir } from '$lib/server/pipelineSettings';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AiDeterrenceConfig } from '$lib/types';

export const load: PageServerLoad = async () => {
  const status = getPipelineStatus();
  const aiSettings = getAiDeterrenceSettings();
  const pipelineConfig = getPipelineConfig();
  const resolvedVault = resolveVaultDir();

  return {
    pipelineStatus: status,
    aiSettings,
    pipelineConfig,
    resolvedVault,
  };
};

export const actions: Actions = {
  saveAiSettings: async ({ request }) => {
    const data = await request.formData();
    const payload = data.get('payload');

    if (typeof payload !== 'string') {
      return fail(400, { error: 'Payload missing' });
    }

    try {
      const parsed: Partial<AiDeterrenceConfig> = JSON.parse(payload);
      const res = saveAiDeterrenceSettings(parsed);
      if (!res.success) {
        return fail(500, { error: res.error || 'Failed to save AI deterrence settings' });
      }
      return { success: true };
    } catch (e: any) {
      return fail(400, { error: e.message || 'Malformed JSON payload' });
    }
  },
};
