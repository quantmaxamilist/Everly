import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { Head, Shell, StatusTag, s } from '@/platform/ui';
import { fmtDate, fmtWhen } from '@/platform/util';

export const metadata = { title: 'Messages' };

export default async function Page() {
  const u = await requireUser('couple');
  const sql = await db();
  const rows = await sql<{ id: string; status: string; date: string; supplier_name: string; category: string; last: string | null; last_at: Date | null; unread: number }[]>`
    select b.id, b.status, b.date::text as date, s.name as supplier_name, s.category,
      (select body from messages m where m.booking_id = b.id order by created_at desc limit 1) as last,
      coalesce((select max(created_at) from messages m where m.booking_id = b.id), b.created_at) as last_at,
      (select count(*)::int from messages m where m.booking_id = b.id and not m.read_couple and (m.sender_id is null or m.sender_id <> ${u.id})) as unread
    from bookings b join suppliers s on s.id = b.supplier_id where b.couple_user_id = ${u.id} order by last_at desc`;
  return (
    <Shell user={u} active="messages">
      <Head title="Messages" kicker="Every supplier conversation in one place" />
      <div className={s.card}>
        <div className={s.list}>
          {rows.map((r) => (
            <Link key={r.id} href={`/platform/couple/bookings/${r.id}`} className={s.li}>
              <span><b>{r.supplier_name}{r.unread ? <span className={`${s.tag} ${s.t_warn}`} style={{ marginLeft: 8 }}>{r.unread} new</span> : null}</b>
                <small>{r.category} · {fmtDate(r.date)} · {r.last ? r.last.slice(0, 90) : 'Request sent'}{r.last_at ? ` · ${fmtWhen(r.last_at)}` : ''}</small></span>
              <StatusTag status={r.status} side="couple" />
            </Link>
          ))}
          {!rows.length && <p className={s.empty}>Send a booking request to a supplier and your conversation will appear here. <Link href="/platform/couple/explore">Explore suppliers</Link></p>}
        </div>
      </div>
    </Shell>
  );
}
