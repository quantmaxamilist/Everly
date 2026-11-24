import { redirect } from 'next/navigation';
import Icon from '@/components/Icon';
import { requireUser } from '@/platform/auth';
import { supplierFor } from '@/platform/data';
import { requestPlan } from '@/platform/actions/supplier';
import { changePasswordAction } from '@/platform/actions/auth';
import { manageBilling, subscribe } from '@/platform/actions/pay';
import { canTakeCards, syncAccount } from '@/platform/payments';
import { syncPlatformReturn } from '@/platform/billing';
import { stripeMode, stripeReady } from '@/platform/stripe';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { ADDONS, PLANS, fmtDate, foundingUntil, gbp, planOf } from '@/platform/util';

export const metadata = { title: 'Account & plan' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('supplier');
  let sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const ready = await stripeReady();
  // back from Stripe
  if (sp.stripe === 'return' && sup.stripe_account && sup.stripe_account_mode === stripeMode()) {
    try { const a = await syncAccount(sup.stripe_account); sp.m = a.charges_enabled ? 'Card payments are switched on' : 'Thanks — Stripe is checking your details. This can take a few minutes.'; } catch { /* webhook will catch up */ }
  }
  if (typeof sp.sub === 'string') { const ok = await syncPlatformReturn(sp.sub); sp.m = ok ? 'Subscription active — thank you!' : 'Payment is processing — this will update shortly'; }
  sup = (await supplierFor(u.id))!;

  const cur = planOf(sup.plan);
  const until = foundingUntil(sup.approved_at);
  const cards = canTakeCards(sup);
  const started = !!sup.stripe_account && sup.stripe_account_mode === stripeMode();
  const hasBilling = !!sup.stripe_customer && sup.stripe_customer_mode === stripeMode();

  return (
    <Shell user={u} active="account">
      <Head title="Account & plan" kicker={sup.name} />
      <Flash sp={sp} />
      <div className={s.grid2}>
        <div className={s.stack} style={{ gap: 16 }}>
          {/* ---- card payments ---- */}
          <div className={s.card} id="payments">
            <div className={s.row}><b className={s.h3}>Card payments</b>{cards ? <span className={`${s.tag} ${s.t_ok}`}>On</span> : started ? <span className={`${s.tag} ${s.t_warn}`}>Not finished</span> : <span className={s.tag}>Off</span>}</div>
            {!ready ? (
              <p className={s.muted}>Card payments are being switched on by Asteria. Until then, record payments couples make to you directly on each booking.</p>
            ) : cards ? (
              <>
                <p className={s.muted}>Couples can pay deposits and balances by card, Apple Pay or Google Pay. Money goes into your own Stripe account and out to your bank. Stripe&rsquo;s card fees are paid by you, and Asteria&rsquo;s {Math.round(cur.rate * 100)}% commission is taken automatically from each payment.</p>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className={`${s.btn} ${s.ghost} ${s.sm}`} style={{ justifySelf: 'start' }}>Open your Stripe dashboard</a>
              </>
            ) : (
              <>
                <p className={s.muted}>Let couples pay you by card through Asteria. Stripe will ask for your business details and the bank account to pay you into. It takes about 5 minutes.</p>
                <a href="/api/stripe/onboard" className={s.btn} style={{ justifySelf: 'start' }}><Icon name="card" />{started ? 'Finish setting up with Stripe' : 'Set up card payments'}</a>
              </>
            )}
          </div>

          {/* ---- plan ---- */}
          <div className={s.card}>
            <b className={s.h3}>Your plan</b>
            <p><b>{cur.name}</b> · {Math.round(cur.rate * 100)}% commission on bookings made through Asteria{cur.monthly ? ` · ${gbp(cur.monthly)}/month` : ''}</p>
            {sup.plan === 'founding' && <p className={s.muted}>As a Founding Partner you pay no subscription {until ? <>until <b>{fmtDate(until)}</b></> : 'for 12 months from when your listing is approved'}. We&rsquo;ll tell you before anything changes. You can still choose a paid plan now for a lower commission.</p>}
            <p className={s.muted}>Direct bookings you add yourself are never charged commission. See the <a href="/fee-schedule" target="_blank">Fee Schedule</a>.</p>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead><tr><th>Plan</th><th>Monthly</th><th>Commission</th><th /></tr></thead>
                <tbody>
                  {PLANS.map((p) => (
                    <tr key={p.id}>
                      <td><b>{p.name}</b></td><td>{p.monthly ? gbp(p.monthly) : 'Free 12 months'}</td><td>{Math.round(p.rate * 100)}%</td>
                      <td>{p.id === cur.id ? <span className={`${s.tag} ${s.t_ok}`}>Current</span> : p.id === 'founding' ? null : ready ? (
                        <form action={subscribe}><input type="hidden" name="kind" value={`plan:${p.id}`} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Choose</Submit></form>
                      ) : (
                        <form action={requestPlan}><input type="hidden" name="plan" value={p.name} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Request</Submit></form>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasBilling && <form action={manageBilling}><Submit className={`${s.ghost} ${s.sm}`} pending="Opening…">Manage billing, card & invoices</Submit></form>}
          </div>
        </div>

        <div className={s.stack} style={{ gap: 16 }}>
          {/* ---- add-ons ---- */}
          <div className={s.card}>
            <b className={s.h3}>Get seen by more couples</b>
            {(['featured', 'spotlight'] as const).map((k) => {
              const on = k === 'featured' ? sup!.featured : sup!.spotlight;
              const paid = k === 'featured' ? sup!.featured_sub : sup!.spotlight_sub;
              return (
                <div key={k} className={s.notice} style={{ display: 'grid', gap: 8 }}>
                  <div className={s.row}><b>{ADDONS[k].name} · {gbp(ADDONS[k].monthly)}/month</b>{on && <span className={`${s.tag} ${s.t_ok}`}>Active</span>}</div>
                  <span className={s.muted}>{ADDONS[k].what}</span>
                  {on ? (paid ? <span className={s.muted}>Cancel any time from &ldquo;Manage billing&rdquo;.</span> : <span className={s.muted}>Switched on by Asteria.</span>)
                    : !ready ? <span className={s.muted}>Available soon.</span>
                    : sup!.status !== 'approved' ? <span className={s.muted}>Available once your listing is approved.</span>
                    : <form action={subscribe}><input type="hidden" name="kind" value={k} /><Submit className={s.sm} pending="…">Add {ADDONS[k].name}</Submit></form>}
                </div>
              );
            })}
          </div>
          <div className={s.card}>
            <b className={s.h3}>Account</b>
            <ul className={s.lines}><li><span>Name</span><span>{u.name}</span></li><li><span>Email</span><span>{u.email}</span></li><li><span>Listing</span><span>{sup.status === 'approved' ? 'Live' : sup.status === 'pending' ? 'Waiting for approval' : 'Hidden'}</span></li></ul>
          </div>
          <form action={changePasswordAction} className={`${s.card} ${s.form}`}>
            <input type="hidden" name="back" value="/platform/supplier/account" />
            <b className={s.h3}>Change password</b>
            <div className={s.field}><label htmlFor="cp1">Current password</label><input id="cp1" name="current" type="password" className={s.input} required autoComplete="current-password" /></div>
            <div className={s.field}><label htmlFor="cp2">New password</label><input id="cp2" name="next" type="password" className={s.input} required minLength={8} autoComplete="new-password" /></div>
            <Submit className={`${s.ghost} ${s.sm}`}>Change password</Submit>
          </form>
        </div>
      </div>
    </Shell>
  );
}
