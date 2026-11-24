import { requireUser } from '@/platform/auth';
import { changeGate, addAdmin } from '@/platform/actions/admin';
import { changePasswordAction } from '@/platform/actions/auth';
import { mailConfigured } from '@/platform/mail';
import { storageConfigured } from '@/platform/storage';
import { Submit } from '@/platform/client';
import { connectStripe } from '@/platform/actions/pay';
import { stripeConfigured, stripeMode, stripeReady } from '@/platform/stripe';
import { Flash, Head, Shell, s } from '@/platform/ui';

export const metadata = { title: 'Settings' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('admin');
  const checks: [string, boolean, string][] = [
    ['Database', true, 'Connected'],
    ['Photo & brochure storage', storageConfigured(), storageConfigured() ? 'Vercel Blob connected' : 'Connect a Blob store in Vercel → Storage'],
    ['Email', mailConfigured(), mailConfigured() ? 'Resend connected' : 'Add RESEND_API_KEY in Vercel to send emails and e-invites'],
    ['Card payments', await stripeReady(), (await stripeReady()) ? `Stripe connected (${stripeMode() === 'live' ? 'LIVE — real payments' : 'test mode — no real money'})` : stripeConfigured() ? 'Key added — press “Connect Stripe” below' : 'Add STRIPE_SECRET_KEY in Vercel'],
  ];
  const ready = await stripeReady();
  return (
    <Shell user={u} active="settings">
      <Head title="Settings" kicker="Platform access and services" />
      <Flash sp={sp} />
      <div className={s.grid2}>
        <div className={s.card}>
          <b className={s.h3}>Services</b>
          <div className={s.list}>{checks.map(([n, ok, d]) => <div key={n} className={s.li}><span><b>{n}</b><small>{d}</small></span><span className={`${s.tag} ${ok ? s.t_ok : s.t_new}`}>{ok ? 'On' : 'Not yet'}</span></div>)}</div>
        </div>
        <form action={connectStripe} className={`${s.card} ${s.form}`}>
          <div className={s.row}><b className={s.h3}>Stripe</b>{stripeConfigured() && <span className={`${s.tag} ${stripeMode() === 'live' ? s.t_ok : s.t_new}`}>{stripeMode() === 'live' ? 'Live' : 'Test mode'}</span>}</div>
          <p className={s.muted}>{!stripeConfigured()
            ? 'Add your Stripe secret key to Vercel as STRIPE_SECRET_KEY, redeploy, then come back here.'
            : ready ? 'Connected. Suppliers can switch on card payments from Account & plan, and plans, Featured, Spotlight and the Wedding Pass can be bought. Press again if you change the site address or Stripe key.'
            : 'One click sets up Stripe’s notifications to Asteria (webhooks) and the supplier billing page.'}</p>
          {stripeConfigured() && <Submit className={s.sm} pending="Connecting…">{ready ? 'Reconnect Stripe' : 'Connect Stripe'}</Submit>}
        </form>
        <form action={changeGate} className={`${s.card} ${s.form}`}>
          <b className={s.h3}>Platform password</b>
          <p className={s.muted}>Everyone needs this to reach the platform until launch. Changing it signs other people out of the gate.</p>
          <div className={s.field}><label htmlFor="gt">New platform password</label><input id="gt" name="gate" className={s.input} required minLength={6} /></div>
          <Submit className={s.sm}>Change platform password</Submit>
        </form>
        <form action={addAdmin} className={`${s.card} ${s.form}`}>
          <b className={s.h3}>Add an admin</b>
          <div className={s.f2}>
            <div className={s.field}><label htmlFor="ad-n">Name</label><input id="ad-n" name="name" className={s.input} /></div>
            <div className={s.field}><label htmlFor="ad-e">Email</label><input id="ad-e" name="email" type="email" className={s.input} required /></div>
          </div>
          <Submit className={`${s.ghost} ${s.sm}`}>Add admin</Submit>
        </form>
        <form action={changePasswordAction} className={`${s.card} ${s.form}`}>
          <input type="hidden" name="back" value="/admin/settings" />
          <b className={s.h3}>Your password</b>
          <div className={s.field}><label htmlFor="cp1">Current password</label><input id="cp1" name="current" type="password" className={s.input} required /></div>
          <div className={s.field}><label htmlFor="cp2">New password</label><input id="cp2" name="next" type="password" className={s.input} required minLength={8} /></div>
          <Submit className={`${s.ghost} ${s.sm}`}>Change password</Submit>
        </form>
      </div>
    </Shell>
  );
}
