import { db } from './db';
import { notify, supplierById, type Booking, type Supplier } from './data';
import { sendMail, wrap, escapeHtml } from './mail';
import { stripe, stripeMode, pence } from './stripe';
import { depositOf, fmtDate, gbp, planOf } from './util';

/* ---------------- shared: apply a payment to a booking ---------------- */
async function note(bookingId: string, body: string) {
  const sql = await db();
  await sql`insert into messages (booking_id, kind, body, read_couple, read_supplier) values (${bookingId}, 'note', ${body}, false, false)`;
}

/**
 * Adds a payment to a booking and moves it along (contract → deposit → paid).
 * Card payments pass `stripeSession`; the same session is only ever counted once.
 * Returns false if it was already recorded.
 */
export async function applyPayment(b: Booking, sup: Supplier, p: { amount: number; kind: string; method: string; reference?: string; stripeSession?: string; feePence?: number; by: 'supplier' | 'card' }) {
  const sql = await db();
  const ins = await sql<{ id: string }[]>`insert into payments (booking_id, kind, amount, method, reference, stripe_session, fee_pence)
    values (${b.id}, ${p.kind}, ${p.amount}, ${p.method}, ${p.reference ?? ''}, ${p.stripeSession ?? null}, ${p.feePence ?? 0})
    on conflict do nothing returning id`;
  if (!ins.length) return false;
  const [cur] = await sql<{ paid: number; status: string; total: number; deposit_pct: number }[]>`
    update bookings set paid = paid + ${p.amount}, updated_at = now() where id = ${b.id} returning paid, status, total, deposit_pct`;
  let status = cur.status;
  if (cur.total > 0 && cur.paid >= cur.total) status = 'paid';
  else if (cur.paid >= depositOf(cur) && (status === 'contract' || status === 'enquiry')) status = 'deposit';
  if (status !== cur.status) await sql`update bookings set status = ${status} where id = ${b.id}`;
  const held = status === 'deposit' && cur.status !== 'deposit';
  const full = status === 'paid' && cur.status !== 'paid';
  await note(b.id, `${gbp(p.amount)} ${p.by === 'card' ? 'paid by card through Asteria' : 'payment received'}${held ? ' · date now held' : full ? ' · fully paid' : ''}`);
  const coupleLink = `/platform/couple/bookings/${b.id}`; const supLink = `/platform/supplier/enquiries/${b.id}`;
  if (p.by === 'card') {
    await notify(sup.user_id, `${b.couple_name} paid ${gbp(p.amount)} by card${held ? ' — the date is now held' : full ? ' — fully paid' : ''}`, supLink);
    await notify(b.couple_user_id, `Payment of ${gbp(p.amount)} to ${sup.name} received${held ? ' — your date is booked!' : ''}`, coupleLink);
  } else {
    await notify(b.couple_user_id, `${sup.name} confirmed your ${gbp(p.amount)} payment${held ? ' — your date is booked!' : ''}`, coupleLink);
  }
  // emails (skipped quietly until email is switched on)
  const [su] = await sql<{ email: string }[]>`select email from users where id = ${sup.user_id}`;
  const site = 'https://www.asteria-events.com';
  if (b.couple_email) await sendMail(b.couple_email, `Payment received — ${sup.name}`, wrap('Payment received',
    `<p>Thanks — your payment of <b>${gbp(p.amount)}</b> to ${escapeHtml(sup.name)} for ${fmtDate(b.date, { day: 'numeric', month: 'long', year: 'numeric' })} has been received.</p>
     <p>Paid so far: ${gbp(cur.paid)} of ${gbp(cur.total)}.${held ? ' Your date is now booked.' : ''}</p>`, { href: site + coupleLink, label: 'View booking' }));
  if (p.by === 'card' && su?.email) await sendMail(su.email, `${b.couple_name} paid ${gbp(p.amount)}`, wrap('Card payment received',
    `<p>${escapeHtml(b.couple_name)} paid <b>${gbp(p.amount)}</b> by card for ${fmtDate(b.date, { day: 'numeric', month: 'long', year: 'numeric' })}.${held ? ' The date is now held in your calendar.' : ''}</p>
     <p>Stripe pays it into your bank account on your usual payout schedule.</p>`, { href: site + supLink, label: 'Open booking' }));
  return true;
}

/* ---------------- card payments by couples ---------------- */
export type DueNow = { kind: 'deposit' | 'balance'; amount: number; label: string } | null;
/** What the couple can pay right now by card. */
export function dueNow(b: Booking): DueNow {
  if (b.source !== 'asteria' || !b.couple_user_id) return null;
  if (b.status === 'contract' && b.contract_signed_at) {
    const amount = Math.max(0, depositOf(b) - b.paid);
    return amount > 0 ? { kind: 'deposit', amount, label: 'deposit' } : null;
  }
  if (b.status === 'deposit') {
    const amount = Math.max(0, b.total - b.paid);
    return amount > 0 ? { kind: 'balance', amount, label: 'balance' } : null;
  }
  return null;
}
export const canTakeCards = (sup: Supplier) => !!sup.stripe_account && sup.payouts_ready && sup.stripe_account_mode === stripeMode();
export const commissionRate = (sup: Supplier) => planOf(sup.plan).rate;

/** Creates a Stripe Checkout page on the supplier's own Stripe account; Asteria's commission is taken as an application fee. */
export async function startCardPayment(b: Booking, sup: Supplier, origin: string) {
  const due = dueNow(b);
  if (!due || !canTakeCards(sup)) throw new Error('This payment can’t be taken by card right now');
  const amount = pence(due.amount);
  const fee = Math.round(amount * commissionRate(sup));
  const back = `${origin}/platform/couple/bookings/${b.id}`;
  const session = await stripe<{ id: string; url: string }>('POST', '/checkout/sessions', {
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: amount, product_data: { name: `${due.kind === 'deposit' ? 'Deposit' : 'Balance'} — ${sup.name}`, description: `${b.package_name} · wedding on ${fmtDate(b.date)} · booking A-${b.ref_no}` } } }],
    payment_intent_data: { application_fee_amount: fee, description: `Asteria booking A-${b.ref_no} (${due.kind})`, metadata: { booking_id: b.id, kind: due.kind } },
    customer_email: b.couple_email || undefined,
    metadata: { kind: 'booking', booking_id: b.id, pay: due.kind, amount: due.amount, fee },
    success_url: `${back}?paid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${back}?e=${encodeURIComponent('Payment cancelled — nothing was charged')}`,
  }, { account: sup.stripe_account! });
  return session.url;
}

type Session = { id: string; mode: string; payment_status: string; status?: string; amount_total: number; metadata: Record<string, string>; subscription?: string | null; customer?: string | null; customer_email?: string | null };

/** Records a completed booking payment (called from the webhook and when the couple returns from Stripe). */
export async function settleBookingSession(s: Session) {
  if (s.metadata?.kind !== 'booking' || s.payment_status !== 'paid') return false;
  const sql = await db();
  const [b] = await sql<Booking[]>`select b.*, b.ref_no::text as ref_no, b.date::text as date, b.end_date::text as end_date from bookings b where id = ${s.metadata.booking_id}`;
  if (!b) return false;
  const sup = await supplierById(b.supplier_id);
  if (!sup) return false;
  return applyPayment(b, sup, { amount: Math.round(s.amount_total / 100), kind: s.metadata.pay || 'payment', method: 'card', reference: s.id, stripeSession: s.id, feePence: Number(s.metadata.fee) || 0, by: 'card' });
}

/** Couple came back from Stripe: check the session straight away (the webhook does the same, whichever is first wins). */
export async function syncBookingReturn(sessionId: string, sup: Supplier) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !sup.stripe_account) return false;
  try {
    const s = await stripe<Session>('GET', `/checkout/sessions/${sessionId}`, {}, { account: sup.stripe_account });
    return await settleBookingSession(s);
  } catch { return false; }
}

/* ---------------- supplier Stripe accounts ---------------- */
/** Creates the supplier's Stripe account if needed and returns a Stripe onboarding link. */
export async function onboardingLink(sup: Supplier, email: string, origin: string) {
  const sql = await db();
  let acct = sup.stripe_account_mode === stripeMode() ? sup.stripe_account : null;
  if (!acct) {
    const a = await stripe<{ id: string }>('POST', '/accounts', {
      country: 'GB', email,
      business_profile: { name: sup.name },
      controller: { fees: { payer: 'account' }, losses: { payments: 'stripe' }, requirement_collection: 'stripe', stripe_dashboard: { type: 'full' } },
      metadata: { supplier_id: sup.id },
    }, { idempotencyKey: `acct-${stripeMode()}-${sup.id}` });
    acct = a.id;
    await sql`update suppliers set stripe_account = ${acct}, stripe_account_mode = ${stripeMode()}, payouts_ready = false where id = ${sup.id}`;
  }
  const link = await stripe<{ url: string }>('POST', '/account_links', {
    account: acct, type: 'account_onboarding',
    refresh_url: `${origin}/api/stripe/onboard`,
    return_url: `${origin}/platform/supplier/account?stripe=return`,
  });
  return link.url;
}

/** Reads the supplier's Stripe account and stores whether it can take payments. */
export async function syncAccount(acctId: string) {
  const a = await stripe<{ id: string; charges_enabled: boolean; details_submitted: boolean }>('GET', `/accounts/${acctId}`);
  await applyAccount(a);
  return a;
}
export async function applyAccount(a: { id: string; charges_enabled: boolean }) {
  const sql = await db();
  const [before] = await sql<{ id: string; user_id: string; name: string; payouts_ready: boolean }[]>`select id, user_id, name, payouts_ready from suppliers where stripe_account = ${a.id}`;
  if (!before) return;
  await sql`update suppliers set payouts_ready = ${!!a.charges_enabled} where id = ${before.id}`;
  if (a.charges_enabled && !before.payouts_ready) await notify(before.user_id, 'Card payments are switched on — couples can now pay you through Asteria', '/platform/supplier/account');
}
