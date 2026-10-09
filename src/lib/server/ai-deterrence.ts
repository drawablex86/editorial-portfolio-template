import fs from 'fs';
import path from 'path';
import type { AiDeterrenceConfig } from '$lib/types';
import { getSeoSettings, toAbsoluteUrl } from '$lib/server/seo';

const POLICY_MD_PATH = path.join(process.cwd(), 'content', 'settings', 'tdm-policy.md');

export function getTdmPolicyMarkdown(): string {
  if (fs.existsSync(POLICY_MD_PATH)) {
    try {
      return fs.readFileSync(POLICY_MD_PATH, 'utf-8');
    } catch {
      // fallback
    }
  }
  return '# TDM Policy\n\nAll rights reserved under EU Directive 2019/790 Art. 4.';
}

export function saveTdmPolicyMarkdown(content: string): boolean {
  try {
    const dir = path.dirname(POLICY_MD_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POLICY_MD_PATH, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save tdm-policy.md:', err);
    return false;
  }
}

export const DEFAULT_AI_DETERRENCE_CONFIG: AiDeterrenceConfig = {
  reserveRights: true,
  blockTrainingCrawlers: true,
  allowSearchIndexers: true,
  tdmPolicyUrl: '/rights',
  customRobotsRules: '',
  effectiveDate: 'October 2026',
};

export const AI_TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Bytespider',
  'cohere-ai',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'PerplexityBot',
  'FacebookBot',
  'Amazonbot',
  'Applebot-Extended',
];

function getSettingsPath(): string {
  return path.join(process.cwd(), 'content', 'settings', 'ai-deterrence.json');
}

export function getAiDeterrenceSettings(): AiDeterrenceConfig {
  const filePath = getSettingsPath();
  let baseConfig = { ...DEFAULT_AI_DETERRENCE_CONFIG };

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      baseConfig = {
        ...baseConfig,
        ...parsed,
      };
    } catch (err) {
      console.error('Failed to parse content/settings/ai-deterrence.json, using defaults:', err);
    }
  }

  // Load live policy markdown content
  baseConfig.tdmPolicyContent = getTdmPolicyMarkdown();
  return baseConfig;
}

export function saveAiDeterrenceSettings(
  settings: Partial<AiDeterrenceConfig>
): { success: boolean; error?: string } {
  try {
    const current = getAiDeterrenceSettings();
    const merged: AiDeterrenceConfig = {
      ...current,
      ...settings,
    };

    if (typeof settings.tdmPolicyContent === 'string') {
      saveTdmPolicyMarkdown(settings.tdmPolicyContent);
    }

    const filePath = getSettingsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Persist JSON metadata (excluding large markdown string which is stored in tdm-policy.md)
    const jsonToSave = {
      reserveRights: merged.reserveRights,
      blockTrainingCrawlers: merged.blockTrainingCrawlers,
      allowSearchIndexers: merged.allowSearchIndexers,
      tdmPolicyUrl: merged.tdmPolicyUrl || '/rights',
      customRobotsRules: merged.customRobotsRules || '',
      effectiveDate: merged.effectiveDate || 'October 2026',
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonToSave, null, 2), 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Resolves the full canonical URL for the TDM policy, adapting automatically
 * to whichever domain is currently configured in SEO settings.
 */
export function resolveCanonicalTdmPolicyUrl(): string {
  const ai = getAiDeterrenceSettings();
  const seo = getSeoSettings();
  const rawUrl = ai.tdmPolicyUrl || '/rights';
  return toAbsoluteUrl(rawUrl, seo.siteUrl);
}
