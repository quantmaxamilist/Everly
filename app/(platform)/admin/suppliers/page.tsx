import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { setSupplierStatus, setSupplierFlags } from '@/platform/actions/admin';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { PLANS, fmtDate } from '@/platform/util';

export const metadata = { title: 'Suppliers' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('admin');
  const f = typeof sp.f === 'string' && ['pending', 'approved', 'suspended'].includes(sp.f) ? sp.f : 'all';
  const q = typeof sp.q === 'string' ? sp.q : '';
  const sql = await db();
  const rows = await sql<{ id: string; name: string; category: string; town: string; region: string; status: string; plan: string; featured: boolean; spotlight: boolean; email: string; created_at: Date; photos: number; packages: number; bookings: number }[]>`
    select s.id, s.name, s.category, s.town, s.region, s.status, s.plan, s.featured, s.spotlight, u.email, s.created_at,
      (select count(*)::int from photos p where p.supplier_id = s.id) as photos,
      (select count(*)::int from packages k where k.supplier_id = s.id) as packages,
      (select count(*)::int from bookings b where b.supplier_id = s.id and b.status in ('deposit','paid')) as bookings
    from suppliers s join users u on u.id = s.user_id
    where (${f} = 'all' or s.status = ${f}) and (${q} = '' or s.name ilike ${'%' + q + '%'} or u.email ilike ${'%' + q + '%'})
    order by (s.status = 'pending') desc, s.created_at desc`;
  return (
    <Shell user={u} active="suppliers">
      <Head title="Suppliers" kicker={`${rows.length} shown`} />
      <Flash sp={sp} />
      <div className={s.row}>
        <div className={s.chips}>{[['all', 'All'], ['pending', 'Waiting'], ['approved', 'Live'], ['suspended', 'Hidden']].map(([k, l]) => <Link key={k} href={`?f=${k}`} className={`${s.chip} ${f === k ? s.on : ''}`}>{l}</Link>)}</div>
        <form className={s.btnRow}><input type="hidden" name="f" value={f} /><input name="q" defaultValue={q} className={s.input} placeholder="Search name or email" style={{ width: 220 }} /><button className={`${s.btn} ${s.ghost} ${s.sm}`}>Search</button></form>
      </div>
      <div className={s.stack} style={{ gap: 12 }}>
        {rows.map((r) => (
          <div key={r.id} className={s.card}>
            <div className={s.row}>
              <span><b className={s.h3}><Link href={`/platform/couple/s/${r.id}`}>{r.name}</Link></b><br /><span className={s.muted}>{r.category} · {[r.town, r.region].filter(Boolean).join(', ') || 'No location'} · {r.email} · joined {fmtDate(r.created_at)}</span></span>
              <span className={`${s.tag} ${r.status === 'approved' ? s.t_ok : r.status === 'pending' ? s.t_new : s.t_warn}`}>{r.status === 'approved' ? 'Live' : r.status === 'pending' ? 'Waiting for approval' : 'Hidden'}</span>
            </div>
            <span className={s.muted}>{r.photos} photos · {r.packages} packages · {r.bookings} bookings</span>
            <div className={s.btnRow}>
              {r.status !== 'approved' && <form action={setSupplierStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="approved" /><input type="hidden" name="back" value={`/admin/suppliers?f=${f}`} /><Submit className={s.sm} pending="…">Approve</Submit></form>}
              {r.status !== 'suspended' && <form action={setSupplierStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="suspended" /><input type="hidden" name="back" value={`/admin/suppliers?f=${f}`} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Hide</Submit></form>}
              <form action={setSupplierFlags} className={s.btnRow}>
                <input type="hidden" name="id" value={r.id} /><input type="hidden" name="back" value={`/admin/suppliers?f=${f}`} />
                <select name="plan" defaultValue={r.plan} className={s.input} style={{ width: 'auto', minHeight: 36, padding: '4px 10px', fontSize: '.82rem' }} aria-label="Plan">{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <label className={s.check}><input type="checkbox" name="featured" defaultChecked={r.featured} />Featured</label>
                <label className={s.check}><input type="checkbox" name="spotlight" defaultChecked={r.spotlight} />Spotlight</label>
                <Submit className={`${s.ghost} ${s.sm}`} pending="…">Save</Submit>
              </form>
            </div>
          </div>
        ))}
        {!rows.length && <div className={`${s.card} ${s.empty}`}>No suppliers here.</div>}
      </div>
    </Shell>
  );
}
