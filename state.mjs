import { getStore } from '@netlify/blobs';
import { handle } from './state-core.mjs';

export default async (req) => {
  const store = getStore({ name: 'tkc-live', consistency: 'strong' });
  return handle(req, store, { TKC_WRITE_KEY: Netlify.env.get('TKC_WRITE_KEY') });
};

export const config = { path: '/api/state' };
