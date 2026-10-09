import { getAiDeterrenceSettings } from '$lib/server/ai-deterrence';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const aiSettings = getAiDeterrenceSettings();

  return {
    aiSettings,
  };
};
