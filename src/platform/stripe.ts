import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSetting } from './db';

/**
 * Minimal Stripe client (REST over fetch, no SDK).
 * Set STRIPE_SECRET_KEY in Vercel (sk_test_… while testing, sk_live_… to go live).
 * Webhooks are created from Admin → Settings → "Connect Stripe", which stores their signing secrets in the database.
 */
const BASE = process.env.STRIPE_API_BASE || 'https://api.stripe.com'; // STRIPE_API_BASE is only used by local tests
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;
export const stripeMode = (): 'live' | 'test' => (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') || process.env.STRIPE_SECRET_KEY?.startsWith('rk_live') ? 'live' : 'test');

type Params = Record<string, unknown>;
function flatten(obj: Params, prefix = '', out: [string, string][] = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' && item !== null ? flatten(item as Params, `${key}[${i}]`, out) : out.push([`${key}[${i}]`, String(item)])));
    else if (typeof v === 'object') flatten(v as Params, key, out);
    else out.push([key, String(v)]);
  }
  return out;
}

export class StripeError extends Error { constructor(msg: string, public status: number, public code?: string) { super(msg); } }

export async function stripe<T = Record<string, unknown>>(method: 'GET' | 'POST' | 'DELETE', path: string, params: Params = {}, opts: { account?: string; idempotencyKey?: string } = {}): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeError('Card payments aren’t switched on yet', 503);
  const body = new URLSearchParams(flatten(params));
  const url = BASE + '/v1' + path + (method === 'GET' && body.toString() ? '?' + body : '');
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (opts.account) headers['Stripe-Account'] = opts.account;
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  const r = await fetch(url, { method, headers, body: method === 'GET' ? undefined : body, cache: 'no-store' });
  const json = (await r.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
  if (!r.ok) throw new StripeError(json.error?.message || `Stripe error ${r.status}`, r.status, json.error?.code);
  return json as T;
}

/** Verifies a Stripe webhook signature (Stripe-Signature header). Returns the parsed event or null. */
export function verifyWebhook<T = StripeEvent>(raw: string, header: string | null, secret: string, toleranceSec = 300): T | null {
  if (!header || !secret) return null;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]).filter((p) => p.length === 2).map(([k, v]) => [k, v])) as Record<string, string>;
  const sigs = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  const t = parts.t;
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return null;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex'));
  const ok = sigs.some((s) => { const b = Buffer.from(s); return b.length === expected.length && timingSafeEqual(b, expected); });
  if (!ok) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
export type StripeEvent = { id: string; type: string; account?: string; data: { object: Record<string, unknown> & { id: string } } };

/* settings are stored per mode, so test and live never mix */
export const sKey = (name: string) => `stripe_${stripeMode()}_${name}`;
export async function stripeReady() { return stripeConfigured() && !!(await getSetting(sKey('wh_platform'))); }

export const pence = (pounds: number) => Math.round(pounds * 100);
