import { headers } from 'next/headers';

/** The site address this request came in on (so links work on www, the vercel.app address and locally). */
export async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'www.asteria-events.com';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
