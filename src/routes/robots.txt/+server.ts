import type { RequestHandler } from './$types';
import { getSeoSettings } from '$lib/server/seo';
import { getAiDeterrenceSettings, AI_TRAINING_BOTS } from '$lib/server/ai-deterrence';

export const GET: RequestHandler = async () => {
  const seo = getSeoSettings();
  const ai = getAiDeterrenceSettings();
  const baseUrl = seo.siteUrl.replace(/\/+$/, '');

  let lines: string[] = [
    '# robots.txt generated dynamically by Portfolio Studio Protocol',
    `# Canonical Host: ${baseUrl}`,
    '',
  ];

  if (ai.blockTrainingCrawlers) {
    lines.push('# Prohibit AI training, dataset ingestion, and model fine-tuning crawlers');
    for (const bot of AI_TRAINING_BOTS) {
      lines.push(`User-agent: ${bot}`);
      lines.push('Disallow: /');
      lines.push('');
    }
  }

  lines.push('# Default rule for search engine indexers and general web discovery');
  lines.push('User-agent: *');
  lines.push('Allow: /');
  lines.push('Disallow: /studio');
  lines.push('Disallow: /api/');
  lines.push('');

  if (ai.customRobotsRules && ai.customRobotsRules.trim()) {
    lines.push('# Custom Rules configured from Studio AI Deterrence Workbench');
    lines.push(ai.customRobotsRules.trim());
    lines.push('');
  }

  lines.push(`# Canonical XML Sitemap`);
  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
