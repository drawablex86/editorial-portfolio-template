import type { PageServerLoad } from './$types';
import { getAllZines } from '$lib/server/zines';

export const load: PageServerLoad = async () => {
  const zines = getAllZines();
  return {
    zines,
  };
};
