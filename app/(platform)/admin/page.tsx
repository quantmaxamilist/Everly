import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { notificationsFor } from '@/platform/data';
import { setSupplierStatus } from '@/platform/actions/admin';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, StatusTag, s } from '@/platform/ui';
import { fmtDate, fmtWhen, gbp } from '@/platform/util';

export const metadata = { title: 'Admin' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('admin');
  const sql = await db();
  const [[c], pending, recent, notes, [m]] = await Promise.all([
    sql<{ couples: number; suppliers: number; live: number; pending: number; enquiries: number; booked: number; value: number; asteria_value: number }[]>`select
      (select count(*)::int from users where role = 'couple') as couples,
      (select count(*)::int from suppliers) as suppliers,
      (select count(*)::int from suppliers where status = 'approved') as live,
      (select count(*)::int from suppliers where status = 'pending') as pending,
      (select count(*)::int from bookings where source = 'asteria') as enquiries,
      (select count(*)::int from bookings where status in ('deposit','paid') and source = 'asteria') as booked,
      (select coalesce(sum(total), 0)::int from bookings where status in ('deposit','paid')) as value,
      (select coalesce(sum(total), 0)::int from bookings where status in ('deposit','paid') and source = 'asteria') as asteria_value`,
    sql<{ id: string; name: string; category: string; town: string; region: string; email: string; created_at: Date }[]>`select s.id, s.name, s.category, s.town, s.region, u.email, s.created_at from suppliers s join users u on u.id = s.user_id where s.status = 'pending' order by s.created_at`,
    sql<{ id: string; couple_name: string; supplier: string; date: string; status: string; total: number; created_at: Date }[]>`select b.id, b.couple_name, s.name as supplier, b.date::text as date, b.status, b.total, b.created_at from bookings b join suppliers s on s.id = b.supplier_id where b.source = 'asteria' order by b.created_at desc limit 8`,
    notificationsFor(u.id, 6),
    sql<{ commission: number; commission_month: number; card_total: number; subs: number; subs_month: number; passes: number; passes_month: number; plans_live: number; featured: number; spotlight: number; plus: number; payouts: number }[]>`select
      (select coalesce(sum(fee_pence - fee_refunded_pence), 0)::int from payments where stripe_session is not null) as commission,
      (select coalesce(sum(fee_pence - fee_refunded_pence), 0)::int from payments where stripe_session is not null and created_at >= date_trunc('month', now())) as commission_month,
      (select coalesce(sum(amount - refunded), 0)::int from payments where stripe_session is not null) as card_total,
      (select coalesce(sum(amount_pence), 0)::int from platform_payments where kind <> 'pass') as subs,
      (select coalesce(sum(amount_pence), 0)::int from platform_payments where kind <> 'pass' and created_at >= date_trunc('month', now())) as subs_month,
      (select coalesce(sum(amount_pence), 0)::int from platform_payments where kind = 'pass') as passes,
      (select coalesce(sum(amount_pence), 0)::int from platform_payments where kind = 'pass' and created_at >= date_trunc('month', now())) as passes_month,
      (select count(*)::int from suppliers where plan_sub is not null) as plans_live,
      (select count(*)::int from suppliers where featured_sub is not null) as featured,
      (select count(*)::int from suppliers where spotlight_sub is not null) as spotlight,
      (select count(*)::int from users where plus) as plus,
      (select count(*)::int from suppliers where payouts_ready) as payouts`,
  ]);
  const p2 = (n: number) => '£' + (n / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <Shell user={u} active="overview">
      <Head title="Asteria admin" kicker={`Logged in as ${u.email}`}><Link href="/platform/couple/explore" className={`${s.btn} ${s.ghost} ${s.sm}`}>View marketplace</Link></Head>
      <Flash sp={sp} />
      <div className={s.grid4}>
        <div className={`${s.card} ${s.kpi}`}><span>Couples</span><b>{c.couples}</b><span>accounts</span></div>
        <Link href="/admin/suppliers" className={`${s.card} ${s.kpi}`} style={{ textDecoration: 'none' }}><span>Suppliers</span><b>{c.live} live</b><span>{c.pending} waiting for approval · {c.suppliers} total</span></Link>
        <Link href="/admin/bookings" className={`${s.card} ${s.kpi}`} style={{ textDecoration: 'none' }}><span>Requests via Asteria</span><b>{c.enquiries}</b><span>{c.booked} booked</span></Link>
        <div className={`${s.card} ${s.kpi}`}><span>Booked through Asteria</span><b>{gbp(c.asteria_value)}</b><span>{gbp(c.value)} incl. direct bookings</span></div>
      </div>
      <div className={s.card}>
        <div className={s.row}><b className={s.h3}>Asteria income</b><span className={s.muted}>{p2(m.commission_month + m.subs_month + m.passes_month)} this month · {p2(m.commission + m.subs + m.passes)} all time</span></div>
        <div className={s.grid4}>
          <div className={s.kpi}><span>Commission</span><b>{p2(m.commission)}</b><span>on {gbp(m.card_total)} paid by card · {m.payouts} {m.payouts === 1 ? 'supplier' : 'suppliers'} taking cards</span></div>
          <div className={s.kpi}><span>Plans & extras</span><b>{p2(m.subs)}</b><span>{m.plans_live} paid {m.plans_live === 1 ? 'plan' : 'plans'} · {m.featured} Featured · {m.spotlight} Spotlight</span></div>
          <div className={s.kpi}><span>Wedding Passes</span><b>{p2(m.passes)}</b><span>{m.plus} {m.plus === 1 ? 'couple' : 'couples'} with Asteria Plus</span></div>
          <div className={s.kpi}><span>This month</span><b>{p2(m.commission_month + m.subs_month + m.passes_month)}</b><span>commission {p2(m.commission_month)} · subscriptions {p2(m.subs_month)} · passes {p2(m.passes_month)}</span></div>
        </div>
      </div>
      <div className={s.split}>
        <div className={s.card}>
          <div className={s.row}><b className={s.h3}>Waiting for approval</b><Link href="/admin/suppliers?f=pending" className={s.muted}>All →</Link></div>
          <div className={s.list}>
            {pending.map((p) => (
              <div key={p.id} className={s.li}>
                <span><b><Link href={`/platform/couple/s/${p.id}`}>{p.name}</Link></b><small>{p.category} · {[p.town, p.region].filter(Boolean).join(', ') || 'No location'} · {p.email} · joined {fmtWhen(p.created_at)}</small></span>
                <form action={setSupplierStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="approved" /><input type="hidden" name="back" value="/admin" /><Submit className={s.sm} pending="…">Approve</Submit></form>
              </div>
            ))}
            {!pending.length && <p className={s.empty}>No suppliers waiting.</p>}
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.card}>
            <div className={s.row}><b className={s.h3}>Latest requests</b><Link href="/admin/bookings" className={s.muted}>All →</Link></div>
            <div className={s.list}>{recent.map((b) => <div key={b.id} className={s.li}><span><b>{b.couple_name} → {b.supplier}</b><small>{fmtDate(b.date)} · {gbp(b.total)} · {fmtWhen(b.created_at)}</small></span><StatusTag status={b.status} side="supplier" /></div>)}{!recent.length && <p className={s.empty}>None yet.</p>}</div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Updates</b>
            <div className={s.list}>{notes.map((n) => <Link key={n.id} href={n.link || '#'} className={s.li}><span><span style={{ fontSize: '.88rem' }}>{n.body}</span><small>{fmtWhen(n.created_at)}</small></span><span /></Link>)}{!notes.length && <p className={s.empty}>Nothing new.</p>}</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
