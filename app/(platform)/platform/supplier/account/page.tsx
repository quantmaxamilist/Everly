import { redirect } from 'next/navigation';
import { requireUser } from '@/platform/auth';
import { supplierFor } from '@/platform/data';
import { requestPlan } from '@/platform/actions/supplier';
import { changePasswordAction } from '@/platform/actions/auth';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { PLANS, gbp, planOf } from '@/platform/util';

export const metadata = { title: 'Account & plan' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const cur = planOf(sup.plan);
  return (
    <Shell user={u} active="account">
      <Head title="Account & plan" kicker={sup.name} />
      <Flash sp={sp} />
      <div className={s.grid2}>
        <div className={s.card}>
          <b className={s.h3}>Your plan</b>
          <p><b>{cur.name}</b> · {Math.round(cur.rate * 100)}% commission on bookings made through Asteria{cur.monthly ? ` · ${gbp(cur.monthly)}/month` : ' · free for 12 months from launch'}</p>
          <p className={s.muted}>Direct bookings you add yourself are never charged commission. Subscriptions start at launch — nothing is charged during the preview.</p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>Plan</th><th>Monthly</th><th>Commission</th><th /></tr></thead>
              <tbody>
                {PLANS.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.name}</b></td><td>{p.monthly ? gbp(p.monthly) : 'Free'}</td><td>{Math.round(p.rate * 100)}%</td>
                    <td>{p.id === cur.id ? <span className={`${s.tag} ${s.t_ok}`}>Current</span> : p.id !== 'founding' && <form action={requestPlan}><input type="hidden" name="plan" value={p.name} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Request</Submit></form>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
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
