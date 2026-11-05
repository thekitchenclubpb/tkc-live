// Core request logic for the Kitchen Club live-score API.
// Kept separate from the Netlify wrapper so it can be tested with an in-memory store.
//
//   GET  /api/state   -> public, read-only. Anyone with the link can watch.
//   POST /api/state   -> requires the secret write key (header x-write-key). Only the scorer device has it.

const MAX_BYTES = 600 * 1024;
const KEY = 'state';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function sameKey(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function cleanData(d) {
  // Only plain string values under our own key prefix are accepted.
  const out = {};
  if (!d || typeof d !== 'object' || Array.isArray(d)) return out;
  for (const k of Object.keys(d)) {
    if (!/^kc_nov6_[a-z_]+$/.test(k)) continue;
    if (typeof d[k] !== 'string') continue;
    out[k] = d[k];
  }
  return out;
}

function cleanTimer(t) {
  if (!t || typeof t !== 'object') return null;
  const n = (v, def) => (Number.isFinite(v) ? v : def);
  return {
    mode: t.mode === 'changeover' ? 'changeover' : 'game',
    running: !!t.running,
    rem: Math.max(0, n(t.rem, 0)),
    total: Math.max(1, n(t.total, 600)),
    gameSecs: Math.max(1, n(t.gameSecs, 600)),
    coMins: Math.max(1, n(t.coMins, 2)),
  };
}

export async function handle(req, store, env = {}, nowFn = Date.now) {
  const method = req.method.toUpperCase();
  const writeKey = env.TKC_WRITE_KEY || '';
  const supplied = req.headers.get('x-write-key') || '';

  if (method === 'GET') {
    let st = null;
    try { st = await store.get(KEY, { type: 'json' }); } catch (e) { st = null; }
    const body = st || { rev: 0, ts: 0, data: {}, timer: null };
    const out = { ...body, now: nowFn() };
    if (supplied) out.authed = sameKey(supplied, writeKey);
    return json(out);
  }

  if (method === 'POST') {
    if (!writeKey) return json({ error: 'write key not configured on the server' }, 503);
    if (!sameKey(supplied, writeKey)) return json({ error: 'wrong key' }, 401);
    const raw = await req.text();
    if (raw.length > MAX_BYTES) return json({ error: 'too large' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch (e) { return json({ error: 'bad json' }, 400); }
    let prev = null;
    try { prev = await store.get(KEY, { type: 'json' }); } catch (e) { prev = null; }
    // Only one scorer at a time: a device that is behind (someone else wrote since it last synced) is refused.
    if (Number.isInteger(body.baseRev) && prev && prev.rev && body.baseRev !== prev.rev) {
      return json({ error: 'conflict', rev: prev.rev }, 409);
    }
    const rev = ((prev && prev.rev) || 0) + 1;
    const st = { rev, ts: nowFn(), data: cleanData(body.data), timer: cleanTimer(body.timer) };
    await store.setJSON(KEY, st);
    return json({ ok: true, rev, ts: st.ts, now: nowFn() });
  }

  return json({ error: 'method not allowed' }, 405);
}

// Not used. (This file sits beside state.mjs, so Netlify treats it as a function too; this keeps that harmless.)
export default async () => new Response('not found', { status: 404 });
export const config = { path: '/api/unused-core' };
