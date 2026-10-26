'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { asset } from '@/lib/site';
import { Shell, Top, Sheet, Toast, Tabs, loadEnquiry } from './ui';
import type { EnquiryPayload } from './CoupleApp';
import { suppliers, supplierBookings, otherEnquiries, monthly, dayPrice, gbp, fmtDate, type Booking } from './data';
import s from './app.module.css';
import c from './calendar.module.css';

type Tab = 'dash' | 'enq' | 'cal' | 'list';
const venue = suppliers.find((x) => x.id === 'stone-villa')!;
const DEFAULT: EnquiryPayload = { couple: 'Sophie & James', date: '2027-06-12', guests: 110, supplier: venue.name, sid: venue.id, pkg: 'Full Day Exclusive', pid: 'sv-day', total: 6500, deposit: 25, phone: '07700 900123', message: "Hi The Stone Villa! We're getting married on 12 June 2027 with around 110 guests and love the Full Day Exclusive package. Is the date available, and could we arrange a visit?", sentAt: '' };

export default function SupplierApp() {
  const [enq, setEnq] = useState<EnquiryPayload>(DEFAULT);
  const [status, setStatus] = useState<'new' | 'held' | 'booked' | 'declined'>('new');
  const [tab, setTab] = useState<Tab>('enq');
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [seen, setSeen] = useState({ opened: false, responded: false, dash: false, cal: false });
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => { const e = loadEnquiry<EnquiryPayload>(); if (e && e.sid === venue.id) setEnq(e); }, []);

  const bookings: Booking[] = useMemo(() => {
    const extra: Booking[] = status === 'declined' ? [] : [{ id: 'E-20488', couple: enq.couple, date: enq.date, pkg: enq.pkg, guests: enq.guests, total: enq.total, paid: 0, status: status === 'booked' ? 'booked' : status === 'held' ? 'held' : 'enquiry', source: 'Everly' }];
    return [...supplierBookings, ...extra];
  }, [enq, status]);

  const respond = (st: 'held' | 'booked' | 'declined', msg: string) => { setStatus(st); setOpen(false); setToast(msg); setSeen((x) => ({ ...x, responded: true })); };
  const go = (t: Tab) => { setTab(t); if (t === 'dash') setSeen((x) => ({ ...x, dash: true })); if (t === 'cal') setSeen((x) => ({ ...x, cal: true })); };

  const steps = [
    { label: `Open ${enq.couple}'s new enquiry`, done: seen.opened },
    { label: 'Review the quote and respond', done: seen.responded },
    { label: 'Check income, profit & bookings on the dashboard', done: seen.dash },
    { label: 'See the calendar with prices & bookings', done: seen.cal },
  ];

  return (
    <Shell side="Supplier" title="Run your bookings" intro={`Try the supplier side as ${venue.name}: answer a couple's enquiry, check your income and manage your calendar.`} steps={steps} other={{ label: 'Switch to the couple preview', to: '/couple-preview' }}>
      {tab === 'dash' && <Dashboard bookings={bookings} enq={enq} status={status} onOpen={() => { setOpen(true); setSeen((x) => ({ ...x, opened: true })); }} />}
      {tab === 'enq' && <Inbox enq={enq} status={status} onOpen={() => { setOpen(true); setSeen((x) => ({ ...x, opened: true })); }} />}
      {tab === 'cal' && <Calendar bookings={bookings} prices={prices} setPrice={(d, p) => { setPrices((x) => ({ ...x, [d]: p })); setToast(`Price for ${fmtDate(d, { day: 'numeric', month: 'short' })} set to ${gbp(p)}`); }} blocked={blocked} toggleBlock={(d) => setBlocked((b) => (b.includes(d) ? b.filter((x) => x !== d) : [...b, d]))} onEnquiry={() => setOpen(true)} enqDate={enq.date} />}
      {tab === 'list' && <Listing />}
      <Tabs<Tab> items={[{ id: 'dash', label: 'Dashboard', icon: 'grid' }, { id: 'enq', label: 'Enquiries', icon: 'inbox', count: status === 'new' ? 1 + otherEnquiries.length : otherEnquiries.length }, { id: 'cal', label: 'Calendar', icon: 'calendar' }, { id: 'list', label: 'Listing', icon: 'layers' }]} active={tab} onChange={go} />
      {open && <EnquiryDetail enq={enq} status={status} onClose={() => setOpen(false)} respond={respond} />}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </Shell>
  );
}

function statusBadge(st: string) {
  const map: Record<string, [string, string]> = { new: ['New enquiry', s.stNew], enquiry: ['Enquiry', s.stNew], held: ['Date held', s.stHeld], booked: ['Booked', s.stBooked], declined: ['Declined', s.stDeclined] };
  const [t, cls] = map[st] || map.new;
  return <span className={`${s.status} ${cls}`}>{t}</span>;
}

function Inbox({ enq, status, onOpen }: { enq: EnquiryPayload; status: string; onOpen: () => void }) {
  return (
    <>
      <Top title="Enquiries" right={<span className={s.demoTag}>Demo</span>} />
      <div className={s.body}>
        <button className={s.card} style={{ textAlign: 'left', border: status === 'new' ? '1.5px solid var(--olive)' : '1.5px solid transparent', cursor: 'pointer' }} onClick={onOpen}>
          <div className={s.rowBetween}>{statusBadge(status)}<span className={s.muted}>{enq.sentAt ? 'Just now' : '12 min ago'}</span></div>
          <b className={s.h3}>{enq.couple}</b>
          <span className={s.muted}>{fmtDate(enq.date)} · {enq.guests} guests</span>
          <div className={s.rowBetween}><span>{enq.pkg}</span><b className={s.price}>{gbp(enq.total)}</b></div>
          <span className={s.muted} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{enq.message}”</span>
        </button>
        {otherEnquiries.map((e) => (
          <div key={e.id} className={s.card}>
            <div className={s.rowBetween}>{statusBadge('enquiry')}<span className={s.muted}>{e.received}</span></div>
            <b className={s.h3}>{e.couple}</b>
            <span className={s.muted}>{fmtDate(e.date)} · {e.guests} guests · {e.pkg}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function EnquiryDetail({ enq, status, onClose, respond }: { enq: EnquiryPayload; status: string; onClose: () => void; respond: (st: 'held' | 'booked' | 'declined', msg: string) => void }) {
  const deposit = Math.round((enq.total * enq.deposit) / 100);
  const fee = Math.round(enq.total * 0.08);
  return (
    <Sheet title="Enquiry E-20488" onClose={onClose}>
      {statusBadge(status)}
      <div>
        <h3 style={{ fontSize: '1.6rem' }}>{enq.couple}</h3>
        <p className={s.muted}>{enq.guests} guests · via Everly · {enq.phone}</p>
      </div>
      <div className={s.card} style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
        <div><b className={s.h3}>{venue.name}</b><p className={s.muted}>{enq.pkg}</p></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(venue.img)} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
      </div>
      <div className={s.card} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><b>{fmtDate(enq.date, { weekday: 'long' })}</b><p>{fmtDate(enq.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className={s.muted}>Wedding date</p></div>
        <div><b>{enq.guests}</b><p>guests</p><p className={s.muted}>Capacity {venue.capacity}</p></div>
      </div>
      <div className={s.card}>
        <span className={s.muted}>Message</span>
        <p style={{ fontSize: '.92rem' }}>“{enq.message}”</p>
      </div>
      <div className={s.card}>
        <b className={s.h3}>Quote</b>
        <ul className={s.lines}>
          <li><span>{enq.pkg}</span><span>{gbp(enq.total)}</span></li>
          <li className={s.muted}><span>Everly fee (8%)</span><span>−{gbp(fee)}</span></li>
          <li><b>You receive</b><b>{gbp(enq.total - fee)}</b></li>
        </ul>
      </div>
      <div className={s.card}>
        <b className={s.h3}>Payment schedule</b>
        <p className={s.muted}>{enq.deposit}% ({gbp(deposit)}) is due when the couple signs. The remaining {gbp(enq.total - deposit)} is due 8 weeks before the wedding.</p>
        <b className={s.h3}>Cancellation policy</b>
        <p className={s.muted}>Deposits are non-refundable. Balances are refundable if cancelled more than 12 weeks before the date.</p>
      </div>
      {status === 'new' || status === 'held' ? (
        <div className={s.sticky}>
          <button className={s.btn} onClick={() => respond('booked', `Contract sent to ${enq.couple} — date booked`)}>Accept & send contract</button>
          <div className={s.btnRow}>
            {status === 'new' ? <button className={`${s.btn} ${s.btnGhost}`} onClick={() => respond('held', 'Date held for 7 days')}>Hold date</button> : <span />}
            <button className={`${s.btn} ${s.btnGhost}`} onClick={() => respond('declined', 'Enquiry declined')}>Decline</button>
          </div>
        </div>
      ) : (
        <div className={s.sticky}><button className={`${s.btn} ${s.btnGhost}`} onClick={onClose}><Icon name="message" />Message couple</button></div>
      )}
    </Sheet>
  );
}

function Dashboard({ bookings, enq, status, onOpen }: { bookings: Booking[]; enq: EnquiryPayload; status: string; onOpen: () => void }) {
  const confirmed = bookings.filter((b) => b.status === 'booked');
  const income = 86400 + (status === 'booked' ? enq.total : 0);
  const fees = Math.round(income * 0.08);
  const costs = Math.round(income * 0.18);
  const profit = income - fees - costs;
  const max = Math.max(...monthly.map((m) => m.v));
  const kpis = [
    { l: 'Bookings income', v: gbp(income), d: '+18%', up: true },
    { l: 'Net profit', v: gbp(profit), d: '+14%', up: true },
    { l: 'Bookings', v: String(13 + confirmed.length), d: '+4', up: true },
    { l: 'Enquiry → booking', v: '38%', d: '−6%', up: false },
  ];
  return (
    <>
      <Top right={<span className={s.avatar}>SV</span>} />
      <div className={s.body}>
        <div><p className={s.muted}>Good afternoon</p><h2 style={{ fontSize: '1.8rem' }}>{venue.name}</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {kpis.map((k) => (
            <div key={k.l} className={s.card} style={{ gap: 4 }}>
              <span className={s.muted}>{k.l}</span>
              <b className={s.big} style={{ fontSize: '1.45rem' }}>{k.v}</b>
              <span className={s.tag} style={k.up ? undefined : { background: '#f6e3da', color: '#9a4a2c' }}><Icon name={k.up ? 'up' : 'down'} size={12} /> {k.d} vs last year</span>
            </div>
          ))}
        </div>
        <div className={s.card}>
          <div className={s.rowBetween}><b className={s.h3}>Income 2027</b><span className={s.muted}>Jan – Jun</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {monthly.map((m, i) => (
              <div key={m.m} style={{ flex: 1, display: 'grid', gap: 4, justifyItems: 'center' }}>
                <span style={{ width: '100%', height: `${(m.v / max) * 96}px`, borderRadius: '8px 8px 4px 4px', background: i === monthly.length - 1 ? 'var(--olive)' : 'var(--sage)' }} />
                <span className={s.muted} style={{ fontSize: '.7rem' }}>{m.m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={s.card}>
          <b className={s.h3}>Profit breakdown</b>
          <ul className={s.lines}>
            <li><span>Bookings income</span><span>{gbp(income)}</span></li>
            <li className={s.muted}><span>Everly fees (8%)</span><span>−{gbp(fees)}</span></li>
            <li className={s.muted}><span>Costs (staff, cleaning)</span><span>−{gbp(costs)}</span></li>
            <li><b>Net profit</b><b>{gbp(profit)}</b></li>
          </ul>
        </div>
        <div className={s.card}>
          <div className={s.rowBetween}><b className={s.h3}>Needs a reply</b>{status === 'new' && <span className={`${s.status} ${s.stNew}`}>1 new</span>}</div>
          <button className={s.rowBetween} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={onOpen}>
            <span><b style={{ fontWeight: 500 }}>{enq.couple}</b><br /><span className={s.muted}>{fmtDate(enq.date)} · {enq.pkg}</span></span>{statusBadge(status)}
          </button>
        </div>
        <div className={s.card}>
          <b className={s.h3}>Upcoming payments</b>
          <ul className={s.lines}>
            {supplierBookings.filter((b) => b.paid < b.total).map((b) => <li key={b.id}><span>{b.couple}<br /><span className={s.muted}>Balance due 8 wks before {fmtDate(b.date, { day: 'numeric', month: 'short' })}</span></span><b>{gbp(b.total - b.paid)}</b></li>)}
          </ul>
        </div>
      </div>
    </>
  );
}

function Calendar({ bookings, prices, setPrice, blocked, toggleBlock, onEnquiry, enqDate }: { bookings: Booking[]; prices: Record<string, number>; setPrice: (d: string, p: number) => void; blocked: string[]; toggleBlock: (d: string) => void; onEnquiry: () => void; enqDate: string }) {
  const [mode, setMode] = useState<'month' | 'list'>('month');
  const [sel, setSel] = useState<string | null>(null);
  const [selBooking, setSelBooking] = useState<Booking | null>(null);
  const [draft, setDraft] = useState(0);
  const year = 2027, month = 5; // June 2027
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const daysIn = new Date(year, month + 1, 0).getDate();
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const bookingOn = (d: string) => bookings.find((b) => d >= b.date && d <= (b.endDate || b.date));
  const priceOf = (d: string) => prices[d] ?? dayPrice(d);

  return (
    <>
      <Top title="Calendar" right={<span className={s.demoTag}>June 2027</span>} />
      <div className={s.body}>
        <div className={s.seg}><button className={mode === 'month' ? s.on : ''} onClick={() => setMode('month')}>Month</button><button className={mode === 'list' ? s.on : ''} onClick={() => setMode('list')}>Bookings</button></div>
        <div className={s.btnRow}>
          <select className={s.input} defaultValue="Jun" aria-label="Month"><option>Jun 2027</option></select>
          <select className={s.input} defaultValue="all" aria-label="Package"><option value="all">Whole venue</option>{venue.packages.map((p) => <option key={p.id}>{p.name}</option>)}</select>
        </div>
        {mode === 'month' ? (
          <div className={c.cal}>
            <div className={c.dow}>{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d}>{d}</span>)}</div>
            {weeks.map((wk, wi) => {
              const isoWk = wk.map((d) => (d ? iso(d) : null));
              const spans = bookings.map((b) => {
                const idx = isoWk.map((d, i) => (d && d >= b.date && d <= (b.endDate || b.date) ? i : -1)).filter((i) => i >= 0);
                return idx.length ? { b, start: idx[0], len: idx.length } : null;
              }).filter(Boolean) as { b: Booking; start: number; len: number }[];
              return (
                <div key={wi} className={c.week}>
                  {wk.map((d, i) => {
                    if (!d) return <span key={i} className={c.empty} />;
                    const ds = iso(d); const bk = bookingOn(ds); const isBlocked = blocked.includes(ds);
                    return (
                      <button key={i} className={`${c.day} ${bk ? c.taken : ''} ${isBlocked ? c.blocked : ''} ${[5, 6].includes(i) ? c.weekend : ''}`} onClick={() => { if (bk) { if (bk.id === 'E-20488') onEnquiry(); else setSelBooking(bk); } else { setSel(ds); setDraft(priceOf(ds)); } }}>
                        <b>{d}</b>
                        <span className={c.p}>{isBlocked ? 'Closed' : gbp(priceOf(ds)).replace(',000', 'k').replace(/,(\d)00$/, '.$1k')}</span>
                      </button>
                    );
                  })}
                  {spans.map(({ b, start, len }) => (
                    <button key={b.id} className={`${c.pill} ${c['pill_' + b.status]}`} style={{ left: `calc(${(start / 7) * 100}% + 3px)`, width: `calc(${(len / 7) * 100}% - 6px)` }} onClick={() => (b.id === 'E-20488' ? onEnquiry() : setSelBooking(b))}>
                      <span className={c.src}>{b.source === 'Everly' ? 'E' : 'D'}</span>
                      <span className={c.name}>{b.couple.split(' & ')[0]}{len > 1 ? ` & ${b.couple.split(' & ')[1]}` : ''}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            <div className={c.legend}>
              <span><i className={c.lgBooked} />Booked</span><span><i className={c.lgHeld} />Held</span><span><i className={c.lgEnq} />Enquiry</span><span><b>E</b> via Everly · <b>D</b> direct</span>
            </div>
          </div>
        ) : (
          bookings.slice().sort((a, b) => a.date.localeCompare(b.date)).map((b) => (
            <button key={b.id} className={s.card} style={{ textAlign: 'left', cursor: 'pointer', border: 0 }} onClick={() => (b.id === 'E-20488' ? onEnquiry() : setSelBooking(b))}>
              <div className={s.rowBetween}>{statusBadge(b.status)}<span className={s.muted}>{b.source}</span></div>
              <b className={s.h3}>{b.couple}</b>
              <div className={s.rowBetween}><span className={s.muted}>{fmtDate(b.date)}{b.endDate ? ` – ${fmtDate(b.endDate, { day: 'numeric', month: 'short' })}` : ''}</span><span className={s.price}>{gbp(b.total)}</span></div>
            </button>
          ))
        )}
        <p className={s.muted}>Tap a free date to change its price or close it. Weekend prices are set higher automatically.</p>
      </div>
      {sel && (
        <Sheet title={fmtDate(sel, { weekday: 'long', day: 'numeric', month: 'long' })} onClose={() => setSel(null)}>
          {sel === enqDate && <span className={`${s.status} ${s.stNew}`}>Enquiry pending for this date</span>}
          <div className={s.field}><label htmlFor="pp">Price for this date</label><input id="pp" inputMode="numeric" className={s.input} value={gbp(draft)} onChange={(e) => setDraft(+e.target.value.replace(/\D/g, '') || 0)} /></div>
          <div className={s.chips} style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>{[4200, 5200, 5600, 6500, 7200].map((p) => <button key={p} className={`${s.chip} ${draft === p ? s.chipOn : ''}`} onClick={() => setDraft(p)}>{gbp(p)}</button>)}</div>
          <button className={s.btn} onClick={() => { setPrice(sel, draft); setSel(null); }}>Save price</button>
          <button className={`${s.btn} ${s.btnGhost}`} onClick={() => { toggleBlock(sel); setSel(null); }}>{blocked.includes(sel) ? 'Re-open this date' : 'Close this date'}</button>
        </Sheet>
      )}
      {selBooking && (
        <Sheet title={`Booking ${selBooking.id}`} onClose={() => setSelBooking(null)}>
          {statusBadge(selBooking.status)}
          <h3 style={{ fontSize: '1.5rem' }}>{selBooking.couple}</h3>
          <p className={s.muted}>{selBooking.guests} guests · {selBooking.pkg} · {selBooking.source === 'Everly' ? 'via Everly' : 'Direct booking'}</p>
          <div className={s.card}><b>{fmtDate(selBooking.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>{selBooking.endDate && <span className={s.muted}>to {fmtDate(selBooking.endDate, { weekday: 'long', day: 'numeric', month: 'long' })}</span>}</div>
          <div className={s.card}><ul className={s.lines}><li><span>Total</span><b>{gbp(selBooking.total)}</b></li><li><span>Paid</span><span>{gbp(selBooking.paid)}</span></li><li><span>Due</span><span>{gbp(selBooking.total - selBooking.paid)}</span></li></ul></div>
          <button className={s.btn} onClick={() => setSelBooking(null)}><Icon name="message" />Message couple</button>
        </Sheet>
      )}
    </>
  );
}

function Listing() {
  return (
    <>
      <Top title="Your listing" />
      <div className={s.body}>
        <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(venue.img)} alt="" style={{ width: '100%', height: 150, objectFit: 'cover' }} />
          <div style={{ padding: '0 16px 16px', display: 'grid', gap: 4 }}>
            <b className={s.h3}>{venue.name}</b>
            <span className={s.muted}>{venue.town}, {venue.region} · <span className={s.stars}>★ {venue.rating}</span> ({venue.reviews})</span>
            <span className={s.tag}>Live on Everly</span>
          </div>
        </div>
        <div className={s.rowBetween}><b className={s.h3}>Packages</b><button className={s.link}><Icon name="plus" size={14} /> Add package</button></div>
        {venue.packages.map((p) => (
          <div key={p.id} className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>{p.name}</b><Icon name="edit" size={18} /></div>
            <div className={s.rowBetween}><span className={s.muted}>{p.summary}</span><span className={s.price}>{gbp(p.price)}</span></div>
            <span className={s.muted}>Deposit {p.deposit}% · up to {p.maxGuests} guests</span>
          </div>
        ))}
      </div>
    </>
  );
}
