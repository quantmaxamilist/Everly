'use server';
import { redirect } from 'next/navigation';
import { db, getSetting, setSetting } from '../db';
import { requireUser } from '../auth';
import { bookingById, supplierById, supplierFor } from '../data';
import { startCardPayment } from '../payments';
import { billingPortal, startPass, startSubscription, type SubKind } from '../billing';
import { stripe, stripeConfigured, sKey } from '../stripe';
import { origin } from '../origin';
import { PLANS, clean, qs } from '../util';

const fail = (path: string, e: unknown) => redirect(path + qs({ e: (e as Error).message || 'Something went wrong' }));

/* couples */
export async function payBooking(fd: FormData) {
  const u = await requireUser('couple');
  const b = await bookingById(clean(fd.get('id'), 40));
  if (!b || b.couple_user_id !== u.id) redirect('/platform/couple');
  const sup = (await supplierById(b.supplier_id))!;
  const back = `/platform/couple/bookings/${b.id}`;
  let url = '';
  try { url = await startCardPayment(b, sup, await origin()); } catch (e) { fail(back, e); }
  redirect(url);
}

export async function buyPass() {
  const u = await requireUser('couple');
  const sql = await db();
  const [r] = await sql<{ plus: boolean }[]>`select plus from users where id = ${u.id}`;
  if (r?.plus) redirect('/platform/couple/plus?m=' + encodeURIComponent('You already have the Wedding Pass'));
  let url = '';
  try { url = await startPass(u, await origin()); } catch (e) { fail('/platform/couple/plus', e); }
  redirect(url);
}

/* suppliers */
const ACCOUNT = '/platform/supplier/account';
export async function subscribe(fd: FormData) {
  const u = await requireUser('supplier');
  const sup = (await supplierFor(u.id))!;
  const kind = clean(fd.get('kind'), 30) as SubKind;
  const ok = kind === 'featured' || kind === 'spotlight' || PLANS.some((p) => p.monthly > 0 && `plan:${p.id}` === kind);
  if (!ok) redirect(ACCOUNT + qs({ e: 'Choose a plan' }));
  if (sup.status !== 'approved' && (kind === 'featured' || kind === 'spotlight')) redirect(ACCOUNT + qs({ e: 'Featured and Spotlight are available once Asteria has approved your listing' }));
  if (kind === 'featured' && sup.featured_sub) redirect(ACCOUNT + qs({ e: 'Featured is already active' }));
  if (kind === 'spotlight' && sup.spotlight_sub) redirect(ACCOUNT + qs({ e: 'Spotlight is already active' }));
  if (kind === `plan:${sup.plan}` && sup.plan_sub) redirect(ACCOUNT + qs({ e: 'You’re already on that plan' }));
  let url = '';
  try { url = await startSubscription(sup, u.email, kind, await origin()); } catch (e) { fail(ACCOUNT, e); }
  redirect(url);
}

export async function manageBilling() {
  const u = await requireUser('supplier');
  const sup = (await supplierFor(u.id))!;
  let url = '';
  try { url = await billingPortal(sup, await origin()); } catch (e) { fail(ACCOUNT, e); }
  redirect(url);
}

/* admin: one click sets up the webhooks and the billing page in Stripe */
const EVENTS_PLATFORM = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid'];
const EVENTS_CONNECT = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'account.updated'];

export async function connectStripe() {
  await requireUser('admin');
  const S = '/admin/settings';
  if (!stripeConfigured()) redirect(S + qs({ e: 'Add STRIPE_SECRET_KEY in Vercel first, then redeploy' }));
  const o = await origin();
  if (o.startsWith('http://') && !process.env.STRIPE_API_BASE) redirect(S + qs({ e: 'Connect Stripe from the live site (https)' }));
  try {
    for (const name of ['platform', 'connect']) {
      const old = await getSetting(sKey(`wh_${name}_id`));
      if (old) { try { await stripe('DELETE', `/webhook_endpoints/${old}`); } catch { /* already removed */ } }
      const ep = await stripe<{ id: string; secret: string }>('POST', '/webhook_endpoints', {
        url: `${o}/api/stripe/webhook`,
        enabled_events: name === 'platform' ? EVENTS_PLATFORM : EVENTS_CONNECT,
        connect: name === 'connect' ? 'true' : undefined,
        description: `Asteria (${name === 'platform' ? 'plans, add-ons, Wedding Pass' : 'supplier booking payments'})`,
      });
      await setSetting(sKey(`wh_${name}_id`), ep.id);
      await setSetting(sKey(`wh_${name}`), ep.secret);
    }
    if (!(await getSetting(sKey('portal')))) {
      const cfg = await stripe<{ id: string }>('POST', '/billing_portal/configurations', {
        business_profile: { headline: 'Asteria — manage your plan, card and invoices', privacy_policy_url: `${o}/privacy`, terms_of_service_url: `${o}/supplier-terms` },
        features: { invoice_history: { enabled: 'true' }, payment_method_update: { enabled: 'true' }, subscription_cancel: { enabled: 'true', mode: 'at_period_end' } },
      });
      await setSetting(sKey('portal'), cfg.id);
    }
  } catch (e) { fail(S, e); }
  redirect(S + qs({ m: 'Stripe connected — payments, subscriptions and the Wedding Pass are live' }));
}
