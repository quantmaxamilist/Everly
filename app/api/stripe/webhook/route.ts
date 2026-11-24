import { NextResponse } from 'next/server';
import { db, getSetting } from '@/platform/db';
import { sKey, verifyWebhook, type StripeEvent } from '@/platform/stripe';
import { applyAccount, applyRefund, settleBookingSession } from '@/platform/payments';
import { applySubscription, settleInvoice, settlePlatformSession } from '@/platform/billing';

export const dynamic = 'force-dynamic';

/** Stripe webhooks (both Asteria's own account and suppliers' connected accounts). */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secrets = [await getSetting(sKey('wh_platform')), await getSetting(sKey('wh_connect'))].filter(Boolean) as string[];
  const ev = secrets.map((s) => verifyWebhook<StripeEvent>(raw, sig, s)).find(Boolean);
  if (!ev) return NextResponse.json({ error: 'bad signature' }, { status: 400 });

  const sql = await db();
  const fresh = await sql`insert into stripe_events (id) values (${ev.id}) on conflict do nothing returning id`;
  if (!fresh.length) return NextResponse.json({ ok: true, duplicate: true });

  try {
    const o = ev.data.object as never;
    switch (ev.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        if (ev.account) await settleBookingSession(o); else await settlePlatformSession(o);
        break;
      case 'charge.refunded':
        if (ev.account) await applyRefund(o);
        break;
      case 'account.updated':
        await applyAccount(o);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applySubscription(o);
        break;
      case 'invoice.paid':
        await settleInvoice(o);
        break;
    }
  } catch (e) {
    // let Stripe retry later
    await sql`delete from stripe_events where id = ${ev.id}`;
    console.error('stripe webhook failed', ev.type, (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
