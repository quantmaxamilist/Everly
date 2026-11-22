import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { Head, Shell, StatusTag, s } from '@/platform/ui';
import { fmtDate, fmtWhen, gbp, planOf } from '@/platform/util';

export const metadata = { title: 'Bookings' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('admin');
  const f = typeof sp.f === 'string' ? sp.f : 'all';
  const sql = await db();
  const rows = await sql<{ id: string; ref_no: string; couple_name: string; couple_email: string; supplier: string; supplier_id: string; plan: string; date: string; status: string; total: number; paid: number; source: string; updated_at: Date }[]>`
    select b.id, b.ref_no::text as ref_no, b.couple_name, b.couple_email, s.name as supplier, s.id as supplier_id, s.plan, b.date::text as date, b.status, b.total, b.paid, b.source, b.updated_at
    from bookings b join suppliers s on s.id = b.supplier_id
    where (${f} = 'all' or (${f} = 'open' and b.status in ('enquiry','contract')) or (${f} = 'booked' and b.status in ('deposit','paid')) or (${f} = 'closed' and b.status in ('declined','cancelled')))
      and b.source = 'asteria'
    order by b.updated_at desc limit 300`;
  const booked = rows.filter((r) => r.status === 'deposit' || r.status === 'paid');
  const commission = booked.reduce((t, r) => t + r.total * planOf(r.plan).rate, 0);
  return (
    <Shell user={u} active="bookings">
      <Head title="Bookings" kicker={`Requests made through Asteria · estimated commission on booked: ${gbp(commission)}`} />
      <div className={s.chips}>{[['all', 'All'], ['open', 'In progress'], ['booked', 'Booked'], ['closed', 'Declined & cancelled']].map(([k, l]) => <Link key={k} href={`?f=${k}`} className={`${s.chip} ${f === k ? s.on : ''}`}>{l}</Link>)}</div>
      <div className={`${s.card} ${s.tableWrap}`}>
        <table className={s.table}>
          <thead><tr><th>Ref</th><th>Couple</th><th>Supplier</th><th>Date</th><th>Total</th><th>Paid</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>A-{r.ref_no}</td><td>{r.couple_name}<br /><small className={s.muted}>{r.couple_email}</small></td>
                <td><Link href={`/platform/couple/s/${r.supplier_id}`}>{r.supplier}</Link></td><td>{fmtDate(r.date)}</td><td>{gbp(r.total)}</td><td>{gbp(r.paid)}</td>
                <td><StatusTag status={r.status} side="supplier" /></td><td className={s.muted}>{fmtWhen(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className={s.empty}>No bookings yet.</p>}
      </div>
    </Shell>
  );
}
