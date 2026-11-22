import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/platform/auth';
import { bookingsForSupplier, notificationsFor, photosOf, packagesOf, supplierFor } from '@/platform/data';
import { Flash, Head, Shell, StatusTag, s } from '@/platform/ui';
import { balanceDue, daysUntil, depositOf, fmtDate, fmtWhen, gbp, isBooked, planOf, todayISO } from '@/platform/util';

export const metadata = { title: 'Dashboard' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const [bookings, notes, photos, pkgs] = await Promise.all([bookingsForSupplier(sup.id), notificationsFor(u.id, 6), photosOf(sup.id), packagesOf(sup.id)]);
  const today = todayISO();
  const year = today.slice(0, 4);
  const open = bookings.filter((b) => b.status === 'enquiry');
  const contracts = bookings.filter((b) => b.status === 'contract');
  const booked = bookings.filter((b) => isBooked(b.status));
  const upcoming = booked.filter((b) => b.date >= today).slice(0, 6);
  const yearValue = booked.filter((b) => b.date.startsWith(year)).reduce((t, b) => t + b.total, 0);
  const received = booked.reduce((t, b) => t + b.paid, 0);
  const plan = planOf(sup.plan);
  const asteriaValue = booked.filter((b) => b.source === 'asteria' && b.date.startsWith(year)).reduce((t, b) => t + b.total, 0);
  const dues = [
    ...contracts.filter((b) => b.contract_signed_at).map((b) => ({ b, kind: 'Deposit', amount: Math.max(0, depositOf(b) - b.paid), due: today })),
    ...booked.filter((b) => b.total > b.paid).map((b) => ({ b, kind: 'Final payment', amount: b.total - b.paid, due: balanceDue(b) })),
  ].filter((d) => d.amount > 0 && daysUntil(d.due) <= 28).sort((a, b) => a.due.localeCompare(b.due));
  const checklist = [
    { done: photos.length >= 3, t: 'Add at least 3 photos' },
    { done: pkgs.length > 0, t: 'Add a package with prices' },
    { done: sup.about.length > 80, t: 'Write about your business' },
  ];

  return (
    <Shell user={u} active="dash">
      <Head title={sup.name} kicker={`${sup.category} · ${sup.town || sup.region || 'Location not set'}`}>
        <Link href="/platform/supplier/listing" className={`${s.btn} ${s.ghost} ${s.sm}`}>Edit listing</Link>
      </Head>
      <Flash sp={sp} />
      {sup.status === 'pending' && <div className={s.notice}><b>Your listing is waiting for approval.</b> Asteria checks every supplier before couples can see them. {checklist.some((c) => !c.done) && <>Meanwhile: {checklist.filter((c) => !c.done).map((c) => c.t.toLowerCase()).join(', ')}.</>}</div>}
      {sup.status === 'suspended' && <div className={s.alert}>Your listing is hidden from couples. Contact hello@asteria-events.com.</div>}
      <div className={s.grid4}>
        <Link href="/platform/supplier/enquiries" className={`${s.card} ${s.kpi}`} style={{ textDecoration: 'none' }}><span>New enquiries</span><b>{open.length}</b><span>{contracts.length} contract{contracts.length === 1 ? '' : 's'} out</span></Link>
        <div className={`${s.card} ${s.kpi}`}><span>Weddings booked</span><b>{booked.length}</b><span>{upcoming.length} coming up</span></div>
        <div className={`${s.card} ${s.kpi}`}><span>Booked value {year}</span><b>{gbp(yearValue)}</b><span>{gbp(asteriaValue)} through Asteria</span></div>
        <div className={`${s.card} ${s.kpi}`}><span>Received so far</span><b>{gbp(received)}</b><span>across all bookings</span></div>
      </div>
      <div className={s.split}>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.card}>
            <div className={s.row}><b className={s.h3}>Needs a reply</b><Link href="/platform/supplier/enquiries" className={s.muted}>All →</Link></div>
            <div className={s.list}>
              {open.slice(0, 5).map((b) => (
                <Link key={b.id} href={`/platform/supplier/enquiries/${b.id}`} className={s.li}>
                  <span><b>{b.couple_name}</b><small>{fmtDate(b.date)} · {b.guests} guests · {b.package_name} · {fmtWhen(b.created_at)}</small></span>
                  <StatusTag status={b.status} side="supplier" />
                </Link>
              ))}
              {!open.length && <p className={s.empty}>All caught up.</p>}
            </div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Upcoming weddings</b>
            <div className={s.list}>
              {upcoming.map((b) => (
                <Link key={b.id} href={`/platform/supplier/enquiries/${b.id}`} className={s.li}>
                  <span><b>{b.couple_name}</b><small>{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {b.guests} guests · {b.source === 'direct' ? 'Direct' : 'Asteria'}</small></span>
                  <span className={s.muted}>{gbp(b.total)}</span>
                </Link>
              ))}
              {!upcoming.length && <p className={s.empty}>No upcoming weddings yet.</p>}
            </div>
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.cardDark}>
            <span className={s.muted}>Payments due in the next 4 weeks</span>
            <b className={s.big}>{gbp(dues.reduce((t, d) => t + d.amount, 0))}</b>
            <ul className={s.lines} style={{ fontSize: '.84rem' }}>
              {dues.slice(0, 5).map((d) => <li key={d.b.id + d.kind}><span>{d.b.couple_name}<br /><small className={s.muted}>{d.kind} · {daysUntil(d.due) <= 0 ? 'due now' : `due ${fmtDate(d.due, { day: 'numeric', month: 'short' })}`}</small></span><span>{gbp(d.amount)}</span></li>)}
              {!dues.length && <li className={s.muted}>Nothing due.</li>}
            </ul>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Updates</b>
            <div className={s.list}>
              {notes.map((n) => <Link key={n.id} href={n.link || '#'} className={s.li}><span><span style={{ fontSize: '.88rem' }}>{n.body}</span><small>{fmtWhen(n.created_at)}</small></span><span /></Link>)}
              {!notes.length && <p className={s.empty}>Nothing new.</p>}
            </div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Your plan</b>
            <p><b>{plan.name}</b> · {Math.round(plan.rate * 100)}% commission on Asteria bookings</p>
            <p className={s.muted}>Commission on {year} Asteria bookings so far: {gbp(asteriaValue * plan.rate)}</p>
            <Link href="/platform/supplier/account" className={`${s.btn} ${s.ghost} ${s.sm}`} style={{ justifySelf: 'start' }}>Plan & account</Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
