import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { supplierFor, type Booking } from '@/platform/data';
import { Flash, Head, Shell, StatusTag, s } from '@/platform/ui';
import { fmtDate, fmtWhen, gbp, todayISO } from '@/platform/util';

export const metadata = { title: 'Enquiries & bookings' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const sql = await db();
  const rows = await sql<(Booking & { unread: number })[]>`
    select b.*, b.ref_no::text as ref_no, b.date::text as date,
      (select count(*)::int from messages m where m.booking_id = b.id and not m.read_supplier and (m.sender_id is null or m.sender_id <> ${u.id})) as unread
    from bookings b where b.supplier_id = ${sup.id} order by b.updated_at desc`;
  const f = typeof sp.f === 'string' ? sp.f : 'open';
  const today = todayISO();
  type Row = Booking & { unread: number };
  const lists: Record<string, Row[]> = {
    open: rows.filter((b) => b.status === 'enquiry' || b.status === 'contract'),
    booked: rows.filter((b) => (b.status === 'deposit' || b.status === 'paid') && b.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: rows.filter((b) => (b.status === 'deposit' || b.status === 'paid') && b.date < today),
    closed: rows.filter((b) => b.status === 'declined' || b.status === 'cancelled'),
  };
  const shown = lists[f] ?? lists.open;
  const tabs: [string, string][] = [['open', `Enquiries (${lists.open.length})`], ['booked', `Upcoming (${lists.booked.length})`], ['past', 'Past'], ['closed', 'Declined & cancelled']];
  return (
    <Shell user={u} active="enquiries">
      <Head title="Enquiries & bookings" kicker={`${rows.filter((b) => b.status === 'enquiry').length} new · ${rows.filter((b) => b.status === 'contract').length} contracts out`}>
        <Link href="/platform/supplier/calendar" className={`${s.btn} ${s.ghost} ${s.sm}`}>Add a direct booking</Link>
      </Head>
      <Flash sp={sp} />
      <div className={s.chips}>{tabs.map(([k, l]) => <Link key={k} href={`?f=${k}`} className={`${s.chip} ${f === k ? s.on : ''}`}>{l}</Link>)}</div>
      <div className={s.card}>
        <div className={s.list}>
          {shown.map((b) => (
            <Link key={b.id} href={`/platform/supplier/enquiries/${b.id}`} className={s.li}>
              <span>
                <b>{b.couple_name}{b.unread ? <span className={`${s.tag} ${s.t_warn}`} style={{ marginLeft: 8 }}>{b.unread} new</span> : null}</b>
                <small>{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {b.guests} guests · {b.package_name} · {gbp(b.total)} · {b.source === 'direct' ? 'Direct' : `updated ${fmtWhen(b.updated_at)}`}</small>
              </span>
              <StatusTag status={b.status} side="supplier" />
            </Link>
          ))}
          {!shown.length && <p className={s.empty}>Nothing here yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
