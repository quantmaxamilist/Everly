import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { bookingsForSupplier, supplierFor } from '@/platform/data';
import { toggleClosed, addDirectBooking } from '@/platform/actions/supplier';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, StatusTag, s } from '@/platform/ui';
import { STATUS, fmtDate, gbp, todayISO } from '@/platform/util';

export const metadata = { title: 'Calendar' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const shift = (ym: string, n: number) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const today = todayISO();
  const month = typeof sp.month === 'string' && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const sel = typeof sp.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : '';
  const sql = await db();
  const [bookings, closed] = await Promise.all([
    bookingsForSupplier(sup.id),
    sql<{ date: string; reason: string }[]>`select date::text as date, reason from closed_dates where supplier_id = ${sup.id}`,
  ]);
  const live = bookings.filter((b) => b.status !== 'declined' && b.status !== 'cancelled');
  const closedMap = new Map(closed.map((c) => [c.date, c.reason]));
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  while (cells.length % 7) cells.push(null);
  const on = (d: string) => live.filter((b) => d >= b.date && d <= (b.end_date || b.date));
  const selBookings = sel ? on(sel) : [];
  const selHeld = selBookings.some((b) => b.status === 'deposit' || b.status === 'paid');
  const inMonth = live.filter((b) => b.date.startsWith(month));
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <Shell user={u} active="calendar">
      <Head title="Calendar" kicker={`${inMonth.length} booking${inMonth.length === 1 ? '' : 's'} & enquiries in ${label}`}>
        <Link href={`?month=${shift(month, -1)}`} className={`${s.btn} ${s.ghost} ${s.sm}`} aria-label="Previous month">←</Link>
        <span className={s.h3} style={{ alignSelf: 'center', minWidth: 140, textAlign: 'center' }}>{label}</span>
        <Link href={`?month=${shift(month, 1)}`} className={`${s.btn} ${s.ghost} ${s.sm}`} aria-label="Next month">→</Link>
      </Head>
      <Flash sp={sp} />
      <div className={`${s.split} ${s.splitR}`}>
        <div className={s.card}>
          <div className={s.cal}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className={s.dow}>{d}</span>)}
            {cells.map((d, i) => d ? (
              <div key={d} className={`${s.day} ${d < today ? s.past : ''} ${closedMap.has(d) ? s.closed : ''} ${d === today ? s.today : ''}`} style={d === sel ? { borderColor: 'var(--olive)', boxShadow: 'inset 0 0 0 1.5px var(--olive)' } : undefined}>
                <Link href={`?month=${month}&d=${d}`} className={s.dayBtn} aria-label={fmtDate(d)} />
                <b>{Number(d.slice(8))}</b>
                {closedMap.has(d) && <span className={s.small} style={{ color: '#9a4a2c' }}>{closedMap.get(d)}</span>}
                {on(d).slice(0, 2).map((b) => <Link key={b.id} href={`/platform/supplier/enquiries/${b.id}`} className={`${s.ev} ${s['ev_' + (STATUS[b.status]?.tone ?? 'new')]}`}>{b.couple_name.split(' ')[0]}</Link>)}
              </div>
            ) : <span key={'e' + i} />)}
          </div>
          <div className={s.chips} style={{ fontSize: '.74rem' }}>
            <span className={`${s.ev} ${s.ev_new}`}>Enquiry</span><span className={`${s.ev} ${s.ev_held}`}>Contract sent (date still open)</span><span className={`${s.ev} ${s.ev_ok}`}>Deposit paid · held</span><span className={`${s.ev} ${s.ev_done}`}>Fully paid</span>
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          {!sel ? (
            <div className={s.card}><b className={s.h3}>Pick a date</b><p className={s.muted}>Tap a day to close it, re-open it, or add a booking you took directly.</p></div>
          ) : (
            <>
              <div className={s.card}>
                <b className={s.h3}>{fmtDate(sel, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
                {selBookings.map((b) => <Link key={b.id} href={`/platform/supplier/enquiries/${b.id}`} className={s.li}><span><b>{b.couple_name}</b><small>{b.package_name} · {gbp(b.total)}</small></span><StatusTag status={b.status} side="supplier" /></Link>)}
                {!selHeld && (
                  <form action={toggleClosed} className={s.form}>
                    <input type="hidden" name="date" value={sel} /><input type="hidden" name="month" value={month} />
                    {!closedMap.has(sel) && <input name="reason" className={s.input} placeholder="Reason (e.g. Holiday)" />}
                    <Submit className={`${s.ghost} ${s.sm}`}>{closedMap.has(sel) ? 'Re-open this date' : 'Close this date'}</Submit>
                  </form>
                )}
              </div>
              {!selHeld && !closedMap.has(sel) && (
                <form action={addDirectBooking} className={`${s.card} ${s.form}`}>
                  <b className={s.h3}>Add a direct booking</b>
                  <p className={s.muted}>For weddings booked outside Asteria — no commission. Holds the date.</p>
                  <input type="hidden" name="date" value={sel} />
                  <div className={s.field}><label htmlFor="db-c">Couple’s names</label><input id="db-c" name="couple" className={s.input} required /></div>
                  <div className={s.f2}>
                    <div className={s.field}><label htmlFor="db-e">Email</label><input id="db-e" name="email" type="email" className={s.input} /></div>
                    <div className={s.field}><label htmlFor="db-p">Phone</label><input id="db-p" name="phone" className={s.input} /></div>
                    <div className={s.field}><label htmlFor="db-g">Guests</label><input id="db-g" name="guests" inputMode="numeric" className={s.input} /></div>
                    <div className={s.field}><label htmlFor="db-k">Package</label><input id="db-k" name="package" className={s.input} /></div>
                    <div className={s.field}><label htmlFor="db-t">Total (£)</label><input id="db-t" name="total" inputMode="numeric" className={s.input} /></div>
                    <div className={s.field}><label htmlFor="db-pd">Paid so far (£)</label><input id="db-pd" name="paid" inputMode="numeric" className={s.input} /></div>
                  </div>
                  <div className={s.field}><label htmlFor="db-n">Notes</label><textarea id="db-n" name="note" className={s.input} /></div>
                  <Submit className={s.sm}>Add booking</Submit>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
