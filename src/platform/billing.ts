import { db, getSetting } from './db';
import { notify, type Supplier } from './data';
import { stripe, stripeMode, sKey, pence } from './stripe';
import { ADDONS, PLANS, WEDDING_PASS, planOf } from './util';

/**
 * Asteria's own billing on Asteria's Stripe account:
 *  - supplier plans (monthly), Featured and Spotlight (monthly add-ons)
 *  - the couples' Wedding Pass (one-off)
 */
export type SubKind = `plan:${string}` | 'featured' | 'spotlight';
const subField = (kind: string) => (kind.startsWith('plan:') ? 'plan_sub' : kind === 'featured' ? 'featured_sub' : 'spotlight_sub');

function priceOf(kind: SubKind) {
  if (kind === 'featured' || kind === 'spotlight') return { name: `Asteria ${ADDONS[kind].name}`, monthly: ADDONS[kind].monthly };
  const p = PLANS.find((x) => x.id === kind.slice(5) && x.monthly > 0);
  if (!p) throw new Error('Unknown plan');
  return { name: `Asteria ${p.name} plan`, monthly: p.monthly };
}

async function customerFor(sup: Supplier, email: string) {
  if (sup.stripe_customer && sup.stripe_customer_mode === stripeMode()) return sup.stripe_customer;
  const c = await stripe<{ id: string }>('POST', '/customers', { email, name: sup.name, metadata: { supplier_id: sup.id } }, { idempotencyKey: `cus-${stripeMode()}-${sup.id}` });
  const sql = await db();
  await sql`update suppliers set stripe_customer = ${c.id}, stripe_customer_mode = ${stripeMode()} where id = ${sup.id}`;
  return c.id;
}

/** Stripe Checkout for a monthly plan or add-on. */
export async function startSubscription(sup: Supplier, email: string, kind: SubKind, origin: string) {
  const { name, monthly } = priceOf(kind);
  const customer = await customerFor(sup, email);
  const back = `${origin}/platform/supplier/account`;
  const s = await stripe<{ url: string }>('POST', '/checkout/sessions', {
    mode: 'subscription', customer,
    line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: pence(monthly), recurring: { interval: 'month' }, product_data: { name } } }],
    subscription_data: { metadata: { supplier_id: sup.id, kind }, description: `${name} — ${sup.name}` },
    metadata: { kind: 'subscription', sub_kind: kind, supplier_id: sup.id },
    success_url: `${back}?sub={CHECKOUT_SESSION_ID}`,
    cancel_url: `${back}?e=${encodeURIComponent('Nothing was charged')}`,
  });
  return s.url;
}

type Sub = { id: string; status: string; metadata: Record<string, string>; customer: string };
const ACTIVE = ['active', 'trialing', 'past_due'];

/** Applies a subscription's state to the supplier (called from webhooks and on return from Stripe). */
export async function applySubscription(sub: Sub) {
  const kind = sub.metadata?.kind; const sid = sub.metadata?.supplier_id;
  if (!kind || !sid) return;
  const sql = await db();
  const [sup] = await sql<Supplier[]>`select * from suppliers where id = ${sid}`;
  if (!sup) return;
  const on = ACTIVE.includes(sub.status);
  const field = subField(kind);
  const current = (sup as unknown as Record<string, string | null>)[field];
  if (on) {
    // switching plans: cancel the previous plan subscription straight away
    if (current && current !== sub.id && kind.startsWith('plan:')) { try { await stripe('DELETE', `/subscriptions/${current}`); } catch { /* already gone */ } }
    if (kind.startsWith('plan:')) await sql`update suppliers set plan = ${kind.slice(5)}, plan_sub = ${sub.id} where id = ${sid}`;
    else if (kind === 'featured') await sql`update suppliers set featured = true, featured_sub = ${sub.id} where id = ${sid}`;
    else await sql`update suppliers set spotlight = true, spotlight_sub = ${sub.id} where id = ${sid}`;
    if (current !== sub.id) await notify(sup.user_id, `${kind.startsWith('plan:') ? planOf(kind.slice(5)).name + ' plan' : ADDONS[kind as 'featured'].name} is now active`, '/platform/supplier/account');
  } else if (current === sub.id) {
    // ended or failed: only undo it if this is still the live subscription
    if (kind.startsWith('plan:')) {
      await sql`update suppliers set plan_sub = null where id = ${sid}`;
      const admins = await sql<{ id: string }[]>`select id from users where role = 'admin'`;
      for (const a of admins) await notify(a.id, `${sup.name}'s ${planOf(kind.slice(5)).name} plan has ended (${sub.status})`, '/admin/suppliers');
    } else if (kind === 'featured') await sql`update suppliers set featured = false, featured_sub = null where id = ${sid}`;
    else await sql`update suppliers set spotlight = false, spotlight_sub = null where id = ${sid}`;
    await notify(sup.user_id, `Your ${kind.startsWith('plan:') ? planOf(kind.slice(5)).name + ' plan' : ADDONS[kind as 'featured'].name} subscription has ended`, '/platform/supplier/account');
  }
}

type Session = { id: string; mode: string; payment_status: string; amount_total: number; metadata: Record<string, string>; subscription?: string | null; customer?: string | null };

/** Records Asteria's own income from a finished Checkout (plans, add-ons, Wedding Pass). */
export async function settlePlatformSession(s: Session) {
  const kind = s.metadata?.kind;
  if (kind !== 'subscription' && kind !== 'pass') return false;
  if (s.payment_status !== 'paid' && s.payment_status !== 'no_payment_required') return false;
  const sql = await db();
  if (kind === 'subscription' && s.subscription) {
    const sub = await stripe<Sub>('GET', `/subscriptions/${s.subscription}`);
    await applySubscription(sub);
    await sql`insert into platform_payments (kind, supplier_id, amount_pence, stripe_id) values (${s.metadata.sub_kind}, ${s.metadata.supplier_id}, ${s.amount_total ?? 0}, ${s.id}) on conflict (stripe_id) do nothing`;
    return true;
  }
  if (kind === 'pass') {
    const ins = await sql`insert into platform_payments (kind, user_id, amount_pence, stripe_id) values ('pass', ${s.metadata.user_id}, ${s.amount_total ?? 0}, ${s.id}) on conflict (stripe_id) do nothing returning id`;
    await sql`update users set plus = true, plus_at = coalesce(plus_at, now()) where id = ${s.metadata.user_id}`;
    if (ins.length) await notify(s.metadata.user_id, 'Asteria Plus is unlocked — enjoy multiple plans, the savings finder and price watch', '/platform/couple/plan');
    return true;
  }
  return false;
}

/** Monthly renewals: count them as income. */
export async function settleInvoice(inv: { id: string; customer: string; amount_paid: number; billing_reason: string }) {
  if (inv.billing_reason !== 'subscription_cycle' || !inv.amount_paid) return;
  const sql = await db();
  const [sup] = await sql<{ id: string }[]>`select id from suppliers where stripe_customer = ${inv.customer}`;
  await sql`insert into platform_payments (kind, supplier_id, amount_pence, stripe_id) values ('renewal', ${sup?.id ?? null}, ${inv.amount_paid}, ${inv.id}) on conflict (stripe_id) do nothing`;
}

export async function syncPlatformReturn(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return false;
  try { return await settlePlatformSession(await stripe<Session>('GET', `/checkout/sessions/${sessionId}`)); } catch { return false; }
}

/** Stripe's billing page where suppliers change card, see invoices or cancel. */
export async function billingPortal(sup: Supplier, origin: string) {
  if (!sup.stripe_customer || sup.stripe_customer_mode !== stripeMode()) throw new Error('No billing set up yet');
  const configuration = (await getSetting(sKey('portal'))) || undefined;
  const s = await stripe<{ url: string }>('POST', '/billing_portal/sessions', { customer: sup.stripe_customer, return_url: `${origin}/platform/supplier/account`, configuration });
  return s.url;
}

/** Couples: one-off Wedding Pass. */
export async function startPass(user: { id: string; email: string }, origin: string) {
  const s = await stripe<{ url: string }>('POST', '/checkout/sessions', {
    mode: 'payment', customer_email: user.email,
    line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: pence(WEDDING_PASS.price), product_data: { name: 'Asteria Plus — Wedding Pass', description: 'One-off payment · ' + WEDDING_PASS.what.join(' · ') } } }],
    metadata: { kind: 'pass', user_id: user.id },
    success_url: `${origin}/platform/couple/plus?pass={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/platform/couple/plus?e=${encodeURIComponent('Nothing was charged')}`,
  });
  return s.url;
}
