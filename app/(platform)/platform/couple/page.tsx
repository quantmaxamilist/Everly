import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { bookingsForCouple, notificationsFor, weddingFor } from '@/platform/data';
import { buildTasks } from '@/platform/tasks';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { CATEGORIES, balanceDue, daysUntil, depositOf, fmtDate, fmtWhen, gbp, isBooked, todayISO } from '@/platform/util';

export const metadata = { title: 'My wedding' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const sql = await db();
  const [bookings, notes, gs, ticks, planCount] = await Promise.all([
    bookingsForCouple(u.id), notificationsFor(u.id, 5),
    sql<{ rsvp: string; plus_coming: number; invited: boolean }[]>`select rsvp, plus_coming, invited from guests where wedding_id = ${w.id}`,
    sql<{ key: string }[]>`select key from tasks_done where wedding_id = ${w.id}`,
    sql<{ n: number }[]>`select count(distinct supplier_id)::int as n from plan_items where wedding_id = ${w.id}`,
  ]);
  const live = bookings.filter((b) => b.status !== 'declined' && b.status !== 'cancelled');
  const booked = live.filter((b) => isBooked(b.status));
  const committed = booked.reduce((t, b) => t + b.total, 0);
  const paid = bookings.reduce((t, b) => t + b.paid, 0);
  const attending = gs.filter((g) => g.rsvp === 'yes').reduce((t, g) => t + 1 + g.plus_coming, 0);
  const awaiting = gs.filter((g) => g.rsvp === 'awaiting').length;
  const tasks = buildTasks(w.date, new Set(booked.map((b) => b.category)), new Set(ticks.map((t) => t.key)), { guests: gs.length, invitesSent: gs.some((g) => g.invited), hasBudget: w.budget > 0 });
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due < todayISO()).length;
  const days = daysUntil(w.date);
  const pays = [
    ...live.filter((b) => b.status === 'contract').map((b) => ({ b, label: b.contract_signed_at ? 'Deposit' : 'Sign contract, then deposit', amount: Math.max(0, depositOf(b) - b.paid), due: todayISO() })),
    ...booked.filter((b) => b.total > b.paid).map((b) => ({ b, label: 'Final balance', amount: b.total - b.paid, due: balanceDue(b) })),
  ].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  const label = (st: string) => (isBooked(st) ? 'Booked' : st === 'contract' ? 'Awaiting your response' : st === 'enquiry' ? 'Enquired' : 'Cancelled');

  if (!w.date && !bookings.length) {
    return (
      <Shell user={u} active="home">
        <Head title={`Welcome${w.names ? `, ${w.names}` : ''}`} kicker="Let’s start planning" />
        <Flash sp={sp} />
        <div className={s.grid3}>
          <Link href="/platform/couple/settings" className={s.card} style={{ textDecoration: 'none' }}><b className={s.h3}>1 · Add your wedding details</b><span className={s.muted}>Date, location, guests and budget — prices and availability update to match.</span></Link>
          <Link href="/platform/couple/explore" className={s.card} style={{ textDecoration: 'none' }}><b className={s.h3}>2 · Find your suppliers</b><span className={s.muted}>Venues, photographers, caterers and more. Save favourites and build your plan.</span></Link>
          <Link href="/platform/couple/guests" className={s.card} style={{ textDecoration: 'none' }}><b className={s.h3}>3 · Start your guest list</b><span className={s.muted}>Track plus-ones, RSVPs and dietary needs.</span></Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell user={u} active="home">
      <Head title={w.names || 'My wedding'} kicker={w.date ? fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Add your date in Wedding details'}>
        <Link href="/platform/couple/explore" className={`${s.btn} ${s.sm}`}>Find suppliers</Link>
      </Head>
      <Flash sp={sp} />
      <div className={s.grid4}>
        <div className={s.cardDark}><span className={s.muted}>{w.place || w.region || 'Your wedding'}</span><b className={s.big}>{w.date ? `${Math.max(0, days)} days` : '—'}</b><span className={s.muted}>to go · {w.guests} guests</span></div>
        <Link href="/platform/couple/plan" className={`${s.card} ${s.kpi}`} style={{ textDecoration: 'none' }}><span>Suppliers booked</span><b>{booked.length} of {CATEGORIES.length}</b><span>{live.length - booked.length} in progress · {planCount[0].n} in plan</span></Link>
        <Link href="/platform/couple/budget" className={`${s.card} ${s.kpi}`} style={{ textDecoration: 'none' }}><span>Paid so far</span><b>{gbp(paid)}</b><span>of {gbp(committed)} booked · budget {gbp(w.budget)}</span></Link>
        <Link href="/platform/couple/checklist" className={`${s.card} ${s.kpi}`} style={{ textDecoration: 'none' }}><span>Checklist</span><b>{tasks.length - open.length} of {tasks.length}</b><span className={overdue ? s.over : ''}>{overdue ? `${overdue} overdue` : 'On track'}</span></Link>
      </div>
      <div className={s.split}>
        <div className={s.card}>
          <div className={s.row}><b className={s.h3}>Your suppliers</b><Link href="/platform/couple/explore" className={s.muted}>Find more →</Link></div>
          <div className={s.list}>
            {bookings.map((b) => (
              <Link key={b.id} href={`/platform/couple/bookings/${b.id}`} className={s.li}>
                <span><b>{b.supplier_name}</b><small>{b.category} · {b.package_name} · {gbp(b.total)} · {fmtDate(b.date)}</small></span>
                <span className={`${s.tag} ${isBooked(b.status) ? s.t_ok : b.status === 'contract' ? s.t_new : b.status === 'enquiry' ? s.t_held : s.t_off}`}>{label(b.status)}</span>
              </Link>
            ))}
            {!bookings.length && <p className={s.empty}>No enquiries yet. <Link href="/platform/couple/explore">Explore suppliers</Link></p>}
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.card}>
            <div className={s.row}><b className={s.h3}>Next payments</b><Link href="/platform/couple/budget" className={s.muted}>All →</Link></div>
            <ul className={s.lines}>{pays.map((p) => <li key={p.b.id + p.label}><span>{p.b.supplier_name}<br /><small className={s.muted}>{p.label} · {daysUntil(p.due) <= 0 ? 'now' : fmtDate(p.due)}</small></span><b>{gbp(p.amount)}</b></li>)}{!pays.length && <li className={s.muted}>Nothing due.</li>}</ul>
          </div>
          <div className={s.card}>
            <div className={s.row}><b className={s.h3}>Next on your checklist</b><Link href="/platform/couple/checklist" className={s.muted}>All →</Link></div>
            <ul className={s.lines}>{open.slice(0, 4).map((t) => <li key={t.key}><span>{t.title}</span><small className={t.due < todayISO() ? s.over : s.muted}>{fmtDate(t.due, { month: 'short', year: 'numeric' })}</small></li>)}</ul>
          </div>
          <div className={s.card}>
            <div className={s.row}><b className={s.h3}>Guests</b><Link href="/platform/couple/guests" className={s.muted}>Guest list →</Link></div>
            <p>{attending} attending · {awaiting} awaiting reply · {gs.length} invitations</p>
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
