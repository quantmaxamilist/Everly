import Link from 'next/link';
import { requireUser } from '@/platform/auth';
import { bookingsForCouple, weddingFor } from '@/platform/data';
import { Head, Shell, StatusTag, s } from '@/platform/ui';
import { balanceDue, depositOf, fmtDate, gbp, isBooked } from '@/platform/util';

export const metadata = { title: 'Budget & payments' };

export default async function Page() {
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const bookings = (await bookingsForCouple(u.id)).filter((b) => b.status !== 'declined');
  const live = bookings.filter((b) => b.status !== 'cancelled');
  const committed = live.filter((b) => isBooked(b.status)).reduce((t, b) => t + b.total, 0);
  const pending = live.filter((b) => !isBooked(b.status)).reduce((t, b) => t + b.total, 0);
  const paid = bookings.reduce((t, b) => t + b.paid, 0);
  const over = committed + pending > w.budget;
  const schedule = live.flatMap((b) => [
    { b, label: 'Deposit', amount: depositOf(b), due: b.contract_signed_at ? fmtDate(b.contract_signed_at) : 'When you sign', done: b.paid >= depositOf(b) && b.status !== 'enquiry' },
    { b, label: 'Final balance', amount: Math.max(0, b.total - depositOf(b)), due: fmtDate(balanceDue(b)), done: b.paid >= b.total && b.total > 0 },
  ]).filter((x) => x.b.status !== 'enquiry');
  return (
    <Shell user={u} active="budget">
      <Head title="Budget & payments" kicker="Spending, deposits, balances and due dates"><Link href="/platform/couple/settings" className={`${s.btn} ${s.ghost} ${s.sm}`}>Change budget</Link></Head>
      <div className={s.grid4}>
        <div className={`${s.card} ${s.kpi}`}><span>Budget</span><b>{gbp(w.budget)}</b></div>
        <div className={`${s.card} ${s.kpi}`}><span>Booked</span><b>{gbp(committed)}</b></div>
        <div className={`${s.card} ${s.kpi}`}><span>Paid so far</span><b>{gbp(paid)}</b></div>
        <div className={`${s.card} ${s.kpi}`}><span>Still to pay</span><b>{gbp(Math.max(0, committed - paid))}</b></div>
      </div>
      <div className={s.card}>
        <div className={s.row}><b>Booked + in progress: {gbp(committed + pending)}</b><span className={over ? s.over : s.muted}>{over ? `${gbp(committed + pending - w.budget)} over budget` : `${gbp(w.budget - committed - pending)} left`}</span></div>
        <div className={s.bar}><span style={{ width: `${Math.min(100, ((committed + pending) / Math.max(1, w.budget)) * 100)}%`, background: over ? '#a8412a' : undefined }} /></div>
      </div>
      <div className={s.split}>
        <div className={s.card}>
          <b className={s.h3}>By supplier</b>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>Supplier</th><th>Status</th><th>Total</th><th>Paid</th><th>To pay</th></tr></thead>
              <tbody>{bookings.map((b) => <tr key={b.id}><td><Link href={`/platform/couple/bookings/${b.id}`}>{b.supplier_name}</Link><br /><small className={s.muted}>{b.category}</small></td><td><StatusTag status={b.status} side="couple" /></td><td>{gbp(b.total)}</td><td>{gbp(b.paid)}</td><td>{b.status === 'cancelled' ? '—' : gbp(Math.max(0, b.total - b.paid))}</td></tr>)}</tbody>
            </table>
            {!bookings.length && <p className={s.empty}>Your suppliers’ costs appear here once you send requests.</p>}
          </div>
        </div>
        <div className={s.card}>
          <b className={s.h3}>Payment schedule</b>
          <ul className={s.lines}>{schedule.map((x) => <li key={x.b.id + x.label}><span>{x.b.supplier_name}<br /><small className={s.muted}>{x.label} · {x.done ? 'Paid ✓' : x.due}</small></span><b>{gbp(x.amount)}</b></li>)}{!schedule.length && <li className={s.muted}>Payments appear once suppliers send contracts.</li>}</ul>
          <p className={s.muted} style={{ fontSize: '.76rem' }}>Pay suppliers directly for now — they confirm each payment here. Card payments through Asteria are coming.</p>
        </div>
      </div>
    </Shell>
  );
}
