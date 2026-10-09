import { getAiDeterrenceSettings, resolveCanonicalTdmPolicyUrl } from '$lib/server/ai-deterrence';

/**
 * W3C Community Group Text and Data Mining Reservation Protocol (TDMRep)
 * Used across the EU to satisfy machine-readable reservation under Article 4
 * of the EU Directive on Copyright in the Digital Single Market and the EU AI Act.
 */
export const GET: RequestHandler = async () => {
  const ai = getAiDeterrenceSettings();

  const body = {
    'tdm-reservation': ai.reserveRights ? 1 : 0,
    'tdm-policy': resolveCanonicalTdmPolicyUrl(),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
