import Link from 'next/link';
import Icon from '@/components/Icon';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { buyPass } from '@/platform/actions/pay';
import { syncPlatformReturn } from '@/platform/billing';
import { stripeReady } from '@/platform/stripe';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { WEDDING_PASS, fmtDate } from '@/platform/util';

export const metadata = { title: 'Asteria Plus' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FEATURES = [
  { icon: 'compare', t: 'Multiple plans', d: 'Build different versions of your wedding — a dream plan, a sensible plan, a smaller plan — and compare the totals side by side.' },
  { icon: 'sparkle', t: 'Savings finder', d: 'For every supplier in your plan, we look for cheaper approved suppliers that cover your area, fit your guest numbers and are free on your date. Swap in one tap.' },
  { icon: 'bell', t: 'Price watch', d: 'Get an alert when a supplier you’ve saved or planned changes their prices or adds a new package.' },
];

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  if (typeof sp.pass === 'string') { const ok = await syncPlatformReturn(sp.pass); sp.m = ok ? 'Asteria Plus is unlocked — enjoy!' : 'Payment is processing — this will update shortly'; }
  const sql = await db();
  const [me] = await sql<{ plus: boolean; plus_at: Date | null }[]>`select plus, plus_at from users where id = ${u.id}`;
  const ready = await stripeReady();
  return (
    <Shell user={u} active="plus">
      <Head title="Asteria Plus" kicker="Wedding Pass · one-off payment" />
      <Flash sp={sp} />
      <div className={s.split}>
        <div className={s.stack} style={{ gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.t} className={s.card} style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'start', gap: 14 }}>
              <span className={s.avatar} aria-hidden="true"><Icon name={f.icon} /></span>
              <span><b className={s.h3}>{f.t}</b><p className={s.muted} style={{ marginTop: 4 }}>{f.d}</p></span>
            </div>
          ))}
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.cardDark}>
            <span className={s.plusBadge}>Asteria Plus</span>
            {me?.plus ? (
              <>
                <b className={s.big} style={{ fontSize: '1.8rem' }}>Wedding Pass active</b>
                <span className={s.muted}>Since {fmtDate(me.plus_at)} · yours until the wedding</span>
                <Link href="/platform/couple/plan" className={s.btn}>Go to my plans</Link>
              </>
            ) : (
              <>
                <b className={s.big}>£{WEDDING_PASS.price.toFixed(2)}</b>
                <span className={s.muted}>One payment, no subscription. Lasts until your wedding.</span>
                {ready ? (
                  <form action={buyPass}><Submit className={s.full} pending="Opening secure payment…"><Icon name="card" />Get the Wedding Pass</Submit></form>
                ) : <span className={s.muted}>Coming soon — card payments are being switched on.</span>}
                <small className={s.muted}>Planning on Asteria stays free. Asteria Plus just adds the extras on the left.</small>
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
