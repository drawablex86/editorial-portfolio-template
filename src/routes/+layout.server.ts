import { getSeoSettings } from '$lib/server/seo';
import { getAiDeterrenceSettings } from '$lib/server/ai-deterrence';

export async function load() {
  return {
    seoSettings: getSeoSettings(),
    aiDeterrenceSettings: getAiDeterrenceSettings(),
  };
}
