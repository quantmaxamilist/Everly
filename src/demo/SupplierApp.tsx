'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { asset } from '@/lib/site';
import { Shell, Top, Sheet, Toast, Stars, loadEnquiry, useWeb } from './ui';
import type { EnquiryPayload } from './CoupleApp';
import { suppliers, personaFor, featuredPersonas, categories, catOne, PREVIEW_MONTHS, monthName, dayPrice, shortPrice, shortGbp, gbp, fmtDate, supById, type Booking, type Enquiry, type EnqStatus, type Persona } from './data';
import s from './app.module.css';
import c from './calendar.module.css';

type Tab = 'dash' | 'enq' | 'cal' | 'list';
const FEE = 0.08;
const monthOf = (d: string) => +d.slice(5, 7) - 1;
const firstName = (couple: string) => couple.split(' & ')[0];

export default function SupplierApp() {
  const [pid, setPid] = useState('stone-villa');
  const [coupleEnq, setCoupleEnq] = useState<Enquiry | null>(null);
  const [enqs, setEnqs] = useState<Enquiry[]>(() => personaFor('stone-villa').enquiries.map((e) => ({ ...e })));
  const [openId, setOpenId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null); // web inbox selection
  const [tab, setTab] = useState<Tab>('enq');
  const [month, setMonth] = useState(5);
  const [toast, setToast] = useState('');
  const [seen, setSeen] = useState({ opened: false, responded: false, dash: false, cal: false, switched: false });
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [asOpen, setAsOpen] = useState(false);

  const persona = personaFor(pid);
  const sup = persona.sup;

  const load = (id: string, ce: Enquiry | null) => {
    const list = personaFor(id).enquiries.map((e) => ({ ...e }));
    const all = ce && ce.sid === id ? [ce, ...list] : list;
    setPid(id); setEnqs(all); setSelId(all[0]?.id ?? null); setOpenId(null);
    const m = all[0] ? monthOf(all[0].date) : 5;
    setPrices({}); setBlocked([]); setMonth(PREVIEW_MONTHS.includes(m) ? m : 5);
  };

  useEffect(() => {
    let as: string | null = null;
    try { as = new URLSearchParams(location.search).get('as'); } catch {}
    const e = loadEnquiry<EnquiryPayload>();
    const ce: Enquiry | null = e && supById(e.sid) ? { ...e, id: 'E-20488', received: 'Just now', status: 'new', fromCouplePreview: true } : null;
    setCoupleEnq(ce);
    const id = as && supById(as) ? as : ce ? ce.sid : 'stone-villa';
    load(id, ce);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [tab, pid]);
  const switchTo = (id: string) => { load(id, coupleEnq); setSeen((x) => ({ ...x, switched: true })); setAsOpen(false); setToast(`Now previewing as ${supById(id)!.name}`); };

  const featured = enqs[0];
  const enqIds = new Set(enqs.map((e) => e.id));
  const bookings: Booking[] = useMemo(() => [
    ...persona.bookings,
    ...enqs.filter((e) => e.status !== 'declined').map((e): Booking => ({ id: e.id, couple: e.couple, date: e.date, pkg: e.pkg, guests: e.guests, total: e.total, paid: 0, status: e.status === 'booked' ? 'booked' : e.status === 'held' ? 'held' : 'enquiry', source: 'Everly' })),
  ].sort((a, b) => a.date.localeCompare(b.date)), [persona, enqs]);

  const open = (id: string) => { setOpenId(id); setSelId(id); setSeen((x) => ({ ...x, opened: true })); };
  const respond = (id: string, st: EnqStatus, msg: string) => {
    setEnqs((l) => l.map((e) => (e.id === id ? { ...e, status: st } : e)));
    setOpenId(null); setToast(msg); setSeen((x) => ({ ...x, responded: true }));
  };
  const go = (t: Tab) => { setTab(t); setOpenId(null); if (t === 'dash') setSeen((x) => ({ ...x, dash: true })); if (t === 'cal') setSeen((x) => ({ ...x, cal: true })); };
  const openBookingOrEnq = (b: Booking) => (enqIds.has(b.id) ? open(b.id) : null);
  const newCount = enqs.filter((e) => e.status === 'new').length;

  const steps = [
    { label: featured ? `Open ${featured.couple}'s new enquiry` : 'Open a new enquiry', done: seen.opened },
    { label: 'Review the quote and respond', done: seen.responded },
    { label: 'Check income, profit & bookings on the dashboard', done: seen.dash },
    { label: 'See the calendar with prices & bookings', done: seen.cal },
    { label: 'Preview as a different type of supplier', done: seen.switched },
  ];
  const openEnq = enqs.find((e) => e.id === openId) || null;
  const switcher = <PreviewAs pid={pid} onChange={switchTo} />;
  const avatarBtn = <button className={s.avatar} style={{ border: 0, cursor: 'pointer' }} onClick={() => setAsOpen(true)} aria-label="Switch business">{persona.initials}</button>;

  return (
    <Shell<Tab>
      side="Supplier" title="Run your bookings" intro={`Try the supplier side as ${sup.name}: answer couples' enquiries, check your income and manage your calendar.`} steps={steps}
      other={{ label: 'Switch to the couple preview', to: '/couple-preview' }}
      search="Search couples, bookings, enquiries…"
      account={{ initials: persona.initials, name: sup.name, sub: `${sup.category} · ${sup.town}` }}
      extra={switcher}
      nav={{ items: [{ id: 'dash', label: 'Dashboard', icon: 'grid' }, { id: 'enq', label: 'Enquiries', icon: 'inbox', count: newCount || undefined }, { id: 'cal', label: 'Calendar', icon: 'calendar' }, { id: 'list', label: 'Listing', icon: 'layers' }], active: tab, onChange: go }}
    >
      {tab === 'dash' && <Dashboard persona={persona} bookings={bookings} enqs={enqs} onOpen={(id) => { go('enq'); open(id); }} avatar={avatarBtn} />}
      {tab === 'enq' && <Inbox enqs={enqs} persona={persona} selId={selId} onOpen={open} respond={respond} avatar={avatarBtn} />}
      {tab === 'cal' && <Calendar persona={persona} bookings={bookings} month={month} setMonth={setMonth} prices={prices} setPrice={(d, p) => { setPrices((x) => ({ ...x, [d]: p })); setToast(`Price for ${fmtDate(d, { day: 'numeric', month: 'short' })} set to ${shortPrice(sup, p)}`); }} blocked={blocked} toggleBlock={(d) => setBlocked((b) => (b.includes(d) ? b.filter((x) => x !== d) : [...b, d]))} onBooking={openBookingOrEnq} isEnq={(id) => enqIds.has(id)} />}
      {tab === 'list' && <Listing persona={persona} onSwitch={() => setAsOpen(true)} />}
      {openEnq && <Sheet title={`Enquiry ${openEnq.id}`} onClose={() => setOpenId(null)}><EnquiryBody enq={openEnq} persona={persona} respond={respond} /></Sheet>}
      {asOpen && (
        <Sheet title="Preview as…" onClose={() => setAsOpen(false)}>
          <p className={s.muted}>See the platform as a different supplier. All figures are sample data.</p>
          {personaList(coupleEnq?.sid).map((id) => {
            const x = supById(id)!;
            return (
              <button key={id} className={s.sCard} style={{ gridTemplateColumns: '56px minmax(0,1fr)', border: id === pid ? '1.5px solid var(--olive)' : undefined }} onClick={() => switchTo(id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className={s.sImg}><img src={asset(x.img)} alt="" /></span>
                <span className={s.sInfo}><b>{x.name}</b><span className={s.sMeta}>{x.category} · {x.town}</span></span>
              </button>
            );
          })}
        </Sheet>
      )}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </Shell>
  );
}

const personaList = (extra?: string) => (extra && !featuredPersonas.includes(extra) ? [extra, ...featuredPersonas] : featuredPersonas);

function PreviewAs({ pid, onChange }: { pid: string; onChange: (id: string) => void }) {
  return (
    <label className={s.asBox}>
      <span>Previewing as</span>
      <select className={s.input} value={pid} onChange={(e) => onChange(e.target.value)}>
        {categories.map((cat) => (
          <optgroup key={cat} label={cat}>
            {suppliers.filter((x) => x.category === cat).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function statusBadge(st: string) {
  const map: Record<string, [string, string]> = { new: ['New enquiry', s.stNew], enquiry: ['Enquiry', s.stNew], held: ['Date held', s.stHeld], booked: ['Booked', s.stBooked], declined: ['Declined', s.stDeclined] };
  const [t, cls] = map[st] || map.new;
  return <span className={`${s.status} ${cls}`}>{t}</span>;
}

/* ---------------- inbox ---------------- */
function Inbox({ enqs, persona, selId, onOpen, respond, avatar }: { enqs: Enquiry[]; persona: Persona; selId: string | null; onOpen: (id: string) => void; respond: (id: string, st: EnqStatus, msg: string) => void; avatar: React.ReactNode }) {
  const web = useWeb();
  const [filter, setFilter] = useState<'all' | 'new' | 'held' | 'done'>('all');
  const shown = enqs.filter((e) => filter === 'all' || (filter === 'new' && e.status === 'new') || (filter === 'held' && e.status === 'held') || (filter === 'done' && (e.status === 'booked' || e.status === 'declined')));
  const seg = (
    <div className={s.seg}>
      {([['all', 'All'], ['new', 'New'], ['held', 'Held'], ['done', 'Answered']] as const).map(([k, l]) => <button key={k} className={filter === k ? s.on : ''} onClick={() => setFilter(k)}>{l}</button>)}
    </div>
  );
  const item = (e: Enquiry) => (
    <button key={e.id} className={`${s.card} ${s.enqItem} ${(web ? selId === e.id : e.status === 'new') ? s.enqOn : ''}`} onClick={() => onOpen(e.id)}>
      <div className={s.rowBetween}>{statusBadge(e.status)}<span className={s.muted}>{e.received}</span></div>
      <b className={s.h3}>{e.couple}{e.fromCouplePreview && <span className={s.tag} style={{ marginLeft: 8, verticalAlign: 'middle' }}>From your couple preview</span>}</b>
      <span className={s.muted}>{fmtDate(e.date)} · {e.guests} guests</span>
      <div className={s.rowBetween}><span>{e.pkg}</span><b className={s.price}>{gbp(e.total)}</b></div>
      {!web && <span className={`${s.muted} ${s.clamp}`}>“{e.message}”</span>}
    </button>
  );
  if (web) {
    const sel = enqs.find((e) => e.id === selId) || enqs[0];
    return (
      <>
        <Top title="Enquiries" kicker={`${enqs.filter((e) => e.status === 'new').length} waiting for a reply`} right={seg} />
        <div className={s.inbox}>
          <div className={s.inboxList}>{shown.map(item)}{!shown.length && <p className={s.muted}>Nothing here.</p>}</div>
          {sel && <div className={`${s.card} ${s.inboxPane}`}><EnquiryBody enq={sel} persona={persona} respond={respond} /></div>}
        </div>
      </>
    );
  }
  return (
    <>
      <Top title="Enquiries" right={avatar} />
      <div className={s.body}>
        {seg}
        {shown.map(item)}
        {!shown.length && <p className={s.muted}>Nothing here.</p>}
      </div>
    </>
  );
}

function EnquiryBody({ enq, persona, respond }: { enq: Enquiry; persona: Persona; respond: (id: string, st: EnqStatus, msg: string) => void }) {
  const web = useWeb();
  const sup = persona.sup;
  const deposit = Math.round((enq.total * enq.deposit) / 100);
  const fee = Math.round(enq.total * FEE);
  const clash = persona.bookings.find((b) => enq.date >= b.date && enq.date <= (b.endDate || b.date));
  const actions = enq.status === 'new' || enq.status === 'held' ? (
    <div className={web ? s.btnRow3 : s.sticky}>
      <button className={s.btn} onClick={() => respond(enq.id, 'booked', `Contract sent to ${enq.couple} — date booked`)}>Accept & send contract</button>
      {enq.status === 'new' && <button className={`${s.btn} ${s.btnGhost}`} onClick={() => respond(enq.id, 'held', 'Date held for 7 days')}>Hold date</button>}
      <button className={`${s.btn} ${s.btnGhost}`} onClick={() => respond(enq.id, 'declined', 'Enquiry declined')}>Decline</button>
    </div>
  ) : (
    <div className={web ? undefined : s.sticky}><button className={`${s.btn} ${s.btnGhost}`}><Icon name="message" />Message {firstName(enq.couple)}</button></div>
  );
  return (
    <>
      {statusBadge(enq.status)}
      <div>
        <h3 style={{ fontSize: '1.6rem' }}>{enq.couple}</h3>
        <p className={s.muted}>{enq.guests} guests · via Everly · {enq.phone} · received {enq.received.toLowerCase()}</p>
      </div>
      <div className={s.enqGrid}>
        <div className={s.card} style={{ gridTemplateColumns: '1fr auto', alignItems: 'center', background: web ? 'var(--off)' : undefined }}>
          <div><b className={s.h3}>{sup.name}</b><p className={s.muted}>{enq.pkg}</p></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(sup.img)} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
        </div>
        <div className={s.card} style={{ gridTemplateColumns: '1fr 1fr', background: web ? 'var(--off)' : undefined }}>
          <div><b>{fmtDate(enq.date, { weekday: 'long' })}</b><p>{fmtDate(enq.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className={s.muted}>{clash ? 'Clashes with a booking' : 'Date is free'}</p></div>
          <div><b>{enq.guests}</b><p>guests</p><p className={s.muted}>{sup.capacity ? `Capacity ${sup.capacity}` : catOne[sup.category]}</p></div>
        </div>
      </div>
      <div className={s.card} style={{ background: web ? 'var(--off)' : undefined }}>
        <span className={s.muted}>Message</span>
        <p style={{ fontSize: '.92rem' }}>“{enq.message}”</p>
      </div>
      <div className={s.enqGrid}>
        <div className={s.card} style={{ background: web ? 'var(--off)' : undefined }}>
          <b className={s.h3}>Quote</b>
          <ul className={s.lines}>
            <li><span>{enq.pkg}</span><span>{gbp(enq.total)}</span></li>
            <li className={s.muted}><span>Everly fee (8%)</span><span>−{gbp(fee)}</span></li>
            <li><b>You receive</b><b>{gbp(enq.total - fee)}</b></li>
          </ul>
        </div>
        <div className={s.card} style={{ background: web ? 'var(--off)' : undefined }}>
          <b className={s.h3}>Payment schedule</b>
          <p className={s.muted}>{enq.deposit}% ({gbp(deposit)}) is due when the couple signs. The remaining {gbp(enq.total - deposit)} is due 8 weeks before the wedding.</p>
          <b className={s.h3}>Cancellation policy</b>
          <p className={s.muted}>Deposits are non-refundable. Balances are refundable if cancelled more than 12 weeks before the date.</p>
        </div>
      </div>
      {actions}
    </>
  );
}

/* ---------------- dashboard ---------------- */
function Dashboard({ persona, bookings, enqs, onOpen, avatar }: { persona: Persona; bookings: Booking[]; enqs: Enquiry[]; onOpen: (id: string) => void; avatar: React.ReactNode }) {
  const web = useWeb();
  const sup = persona.sup;
  const confirmed = bookings.filter((b) => b.status === 'booked');
  const income = confirmed.reduce((t, b) => t + b.total, 0);
  const fees = Math.round(income * FEE);
  const costs = Math.round(income * persona.costRate);
  const profit = income - fees - costs;
  const paid = confirmed.reduce((t, b) => t + b.paid, 0);
  const monthly = PREVIEW_MONTHS.map((m) => ({ m: monthName(m), v: confirmed.filter((b) => monthOf(b.date) === m).reduce((t, b) => t + b.total, 0) }));
  const max = Math.max(1, ...monthly.map((m) => m.v));
  const growth = Math.round((1 / persona.lastYear - 1) * 100);
  const kpis = [
    { l: 'Bookings value', v: gbp(income), d: `+${growth}%`, up: true },
    { l: 'Net profit', v: gbp(profit), d: `+${Math.max(3, growth - 4)}%`, up: true },
    { l: 'Weddings booked', v: String(confirmed.length), d: `+${Math.max(1, Math.round(confirmed.length * 0.2))}`, up: true },
    { l: 'Enquiry → booking', v: `${persona.conversion}%`, d: persona.conversion > 36 ? '+3%' : '−4%', up: persona.conversion > 36 },
  ];
  const pending = enqs.filter((e) => e.status === 'new' || e.status === 'held');
  const upcoming = confirmed.slice(0, 5);
  const balances = confirmed.filter((b) => b.paid < b.total).slice(0, 5);
  return (
    <>
      <Top right={web ? undefined : avatar} title={web ? sup.name : undefined} kicker={web ? 'Good afternoon' : undefined} />
      <div className={s.body}>
        {!web && <div><p className={s.muted}>Good afternoon</p><h2 style={{ fontSize: '1.8rem' }}>{sup.name}</h2></div>}
        <div className={s.kpis}>
          {kpis.map((k) => (
            <div key={k.l} className={s.card} style={{ gap: 4 }}>
              <span className={s.muted}>{k.l}</span>
              <b className={s.big} style={{ fontSize: '1.45rem' }}>{k.v}</b>
              <span className={s.tag} style={k.up ? undefined : { background: '#f6e3da', color: '#9a4a2c' }}><Icon name={k.up ? 'up' : 'down'} size={12} /> {k.d} vs last year</span>
            </div>
          ))}
        </div>
        <div className={s.dashGrid}>
          <div className={`${s.card} ${s.span2}`}>
            <div className={s.rowBetween}><b className={s.h3}>Bookings by month</b><span className={s.muted}>2027 season · {gbp(paid)} received so far</span></div>
            <div className={s.chart}>
              {monthly.map((m) => (
                <div key={m.m} className={s.chartCol}>
                  <span className={s.chartVal}>{m.v ? shortGbp(m.v) : ''}</span>
                  <span className={s.chartBar} style={{ height: `${(m.v / max) * 100}%`, background: m.v === max ? 'var(--olive)' : 'var(--sage)' }} />
                  <span className={s.muted} style={{ fontSize: '.7rem' }}>{m.m}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Profit breakdown</b>
            <ul className={s.lines}>
              <li><span>Bookings value</span><span>{gbp(income)}</span></li>
              <li className={s.muted}><span>Everly fees (8%)</span><span>−{gbp(fees)}</span></li>
              <li className={s.muted}><span>Costs ({persona.costLabel})</span><span>−{gbp(costs)}</span></li>
              <li><b>Net profit</b><b>{gbp(profit)}</b></li>
            </ul>
          </div>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Needs a reply</b>{pending.length > 0 && <span className={`${s.status} ${s.stNew}`}>{pending.length} open</span>}</div>
            {pending.slice(0, 4).map((e) => (
              <button key={e.id} className={s.rowBetween} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => onOpen(e.id)}>
                <span><b style={{ fontWeight: 500 }}>{e.couple}</b><br /><span className={s.muted}>{fmtDate(e.date)} · {e.pkg}</span></span>{statusBadge(e.status)}
              </button>
            ))}
            {!pending.length && <p className={s.muted}>All caught up.</p>}
          </div>
          <div className={s.card}>
            <b className={s.h3}>Upcoming weddings</b>
            <ul className={s.lines}>
              {upcoming.map((b) => <li key={b.id}><span>{b.couple}<br /><span className={s.muted}>{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {b.guests} guests</span></span><span className={s.muted}>{b.source}</span></li>)}
            </ul>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Balances to collect</b>
            <ul className={s.lines}>
              {balances.map((b) => <li key={b.id}><span>{b.couple}<br /><span className={s.muted}>Due 8 wks before {fmtDate(b.date, { day: 'numeric', month: 'short' })}</span></span><b>{gbp(b.total - b.paid)}</b></li>)}
              {!balances.length && <li className={s.muted}>Nothing outstanding.</li>}
            </ul>
          </div>
          <div className={`${s.card} ${s.spanAll}`}>
            <div className={s.rowBetween}><b className={s.h3}>Latest reviews</b><span className={s.stars}>★ {sup.rating.toFixed(1)} · {sup.reviews} reviews</span></div>
            <div className={s.reviewGrid}>
              {persona.reviews.map((r) => (
                <div key={r.text} className={s.review}>
                  <div className={s.rowBetween}><b>{r.by}</b><span className={s.muted}>{r.when}</span></div>
                  <Stars n={r.stars} />
                  <p>“{r.text}”</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- calendar ---------------- */
function Calendar({ persona, bookings, month, setMonth, prices, setPrice, blocked, toggleBlock, onBooking, isEnq }: { persona: Persona; bookings: Booking[]; month: number; setMonth: (m: number) => void; prices: Record<string, number>; setPrice: (d: string, p: number) => void; blocked: string[]; toggleBlock: (d: string) => void; onBooking: (b: Booking) => void; isEnq: (id: string) => boolean }) {
  const web = useWeb();
  const sup = persona.sup;
  const [mode, setMode] = useState<'month' | 'list'>('month');
  const [sel, setSel] = useState<string | null>(null);
  const [selBooking, setSelBooking] = useState<Booking | null>(null);
  const [draft, setDraft] = useState(0);
  const year = 2027;
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const daysIn = new Date(year, month + 1, 0).getDate();
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const bookingOn = (d: string) => bookings.find((b) => d >= b.date && d <= (b.endDate || b.date));
  const priceOf = (d: string) => prices[d] ?? dayPrice(sup, d);
  const inMonth = bookings.filter((b) => monthOf(b.date) === month);
  const mi = PREVIEW_MONTHS.indexOf(month);
  const click = (b: Booking) => (isEnq(b.id) ? onBooking(b) : setSelBooking(b));
  const sample = ['2027-06-07', '2027-06-04', '2027-06-06', '2027-06-05'].map((d) => dayPrice(sup, d));
  const options = [...new Set([...sample, Math.round(sample[3] * 1.1)])].sort((a, b) => a - b);

  const monthNav = (
    <div className={s.monthNav}>
      <button className={s.back} disabled={mi <= 0} onClick={() => setMonth(PREVIEW_MONTHS[mi - 1])} aria-label="Previous month"><Icon name="arrow" size={16} /></button>
      <b>{monthName(month, true)} {year}</b>
      <button className={`${s.back} ${s.fwd}`} disabled={mi >= PREVIEW_MONTHS.length - 1} onClick={() => setMonth(PREVIEW_MONTHS[mi + 1])} aria-label="Next month"><Icon name="arrow" size={16} /></button>
    </div>
  );
  const grid = (
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
                <button key={i} className={`${c.day} ${bk ? c.taken : ''} ${isBlocked ? c.blocked : ''} ${[5, 6].includes(i) ? c.weekend : ''}`} onClick={() => { if (bk) click(bk); else { setSel(ds); setDraft(priceOf(ds)); } }}>
                  <b>{d}</b>
                  <span className={c.p}>{isBlocked ? 'Closed' : shortPrice(sup, priceOf(ds))}</span>
                </button>
              );
            })}
            {spans.map(({ b, start, len }) => (
              <button key={b.id} className={`${c.pill} ${c['pill_' + b.status]}`} style={{ left: `calc(${(start / 7) * 100}% + 3px)`, width: `calc(${(len / 7) * 100}% - 6px)` }} onClick={() => click(b)}>
                <span className={c.src}>{b.source === 'Everly' ? 'E' : 'D'}</span>
                <span className={c.name}>{len > 1 ? b.couple : firstName(b.couple)}</span>
              </button>
            ))}
          </div>
        );
      })}
      <div className={c.legend}>
        <span><i className={c.lgBooked} />Booked</span><span><i className={c.lgHeld} />Held</span><span><i className={c.lgEnq} />Enquiry</span><span><b>E</b> via Everly · <b>D</b> direct</span>
      </div>
    </div>
  );
  const list = (items: Booking[]) => items.map((b) => (
    <button key={b.id} className={s.card} style={{ textAlign: 'left', cursor: 'pointer', border: 0 }} onClick={() => click(b)}>
      <div className={s.rowBetween}>{statusBadge(b.status)}<span className={s.muted}>{b.source}</span></div>
      <b className={s.h3}>{b.couple}</b>
      <div className={s.rowBetween}><span className={s.muted}>{fmtDate(b.date)}{b.endDate ? ` – ${fmtDate(b.endDate, { day: 'numeric', month: 'short' })}` : ''}</span><span className={s.price}>{gbp(b.total)}</span></div>
    </button>
  ));
  const pkgSelect = <select className={s.input} defaultValue="all" aria-label="Package"><option value="all">{sup.category === 'Venues' ? 'Whole venue' : 'All packages'}</option>{sup.packages.map((p) => <option key={p.id}>{p.name}</option>)}</select>;

  return (
    <>
      <Top title="Calendar" right={web ? monthNav : <span className={s.demoTag}>{monthName(month)} 2027</span>} kicker={web ? `${inMonth.length} bookings & enquiries in ${monthName(month, true)}` : undefined} />
      {web ? (
        <div className={s.calWeb}>
          <div className={s.body}>{grid}<p className={s.muted}>Click a free date to change its price or close it. Weekend prices are set higher automatically.</p></div>
          <aside className={s.body}>
            <div className={s.card}><span className={s.muted}>Pricing for</span>{pkgSelect}</div>
            <b className={s.h3}>{monthName(month, true)} at a glance</b>
            {list(inMonth)}
            {!inMonth.length && <p className={s.muted}>No bookings yet this month.</p>}
          </aside>
        </div>
      ) : (
        <div className={s.body}>
          <div className={s.seg}><button className={mode === 'month' ? s.on : ''} onClick={() => setMode('month')}>Month</button><button className={mode === 'list' ? s.on : ''} onClick={() => setMode('list')}>Bookings</button></div>
          <div className={s.btnRow}>{monthNav}{pkgSelect}</div>
          {mode === 'month' ? grid : list(bookings)}
          <p className={s.muted}>Tap a free date to change its price or close it. Weekend prices are set higher automatically.</p>
        </div>
      )}
      {sel && (
        <Sheet title={fmtDate(sel, { weekday: 'long', day: 'numeric', month: 'long' })} onClose={() => setSel(null)}>
          <div className={s.field}><label htmlFor="pp">Price for this date{sup.packages[0].perGuest ? ' (per guest)' : ''}</label><input id="pp" inputMode="numeric" className={s.input} value={gbp(draft)} onChange={(e) => setDraft(+e.target.value.replace(/\D/g, '') || 0)} /></div>
          <div className={s.chips} style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>{options.map((p) => <button key={p} className={`${s.chip} ${draft === p ? s.chipOn : ''}`} onClick={() => setDraft(p)}>{gbp(p)}</button>)}</div>
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
          <button className={s.btn} onClick={() => setSelBooking(null)}><Icon name="message" />Message {firstName(selBooking.couple)}</button>
        </Sheet>
      )}
    </>
  );
}

/* ---------------- listing ---------------- */
function Listing({ persona, onSwitch }: { persona: Persona; onSwitch: () => void }) {
  const web = useWeb();
  const sup = persona.sup;
  const views = 600 + sup.reviews * 9;
  const stats = [['Profile views', views.toLocaleString('en-GB'), 'this month'], ['Saved by couples', String(Math.round(views / 11)), 'this month'], ['Enquiries', String(Math.round(views / 48)), 'this month']];
  return (
    <>
      <Top title="Your listing" right={web ? <span className={s.tag}>Live on Everly</span> : undefined} />
      <div className={`${s.body} ${s.listGrid}`}>
        <div className={s.listMain}>
          <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(sup.img)} alt="" style={{ width: '100%', height: web ? 240 : 150, objectFit: 'cover' }} />
            <div style={{ padding: '0 16px 16px', display: 'grid', gap: 6 }}>
              <b className={s.h3}>{sup.name}</b>
              <span className={s.muted}>{sup.category} · {sup.town}, {sup.region} · <span className={s.stars}>★ {sup.rating}</span> ({sup.reviews})</span>
              <p style={{ fontSize: '.9rem' }}>{sup.about}</p>
              {!web && <span className={s.tag}>Live on Everly</span>}
            </div>
          </div>
          <div className={s.kpis} style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            {stats.map(([l, v, d]) => <div key={l} className={s.card} style={{ gap: 2, padding: 12 }}><span className={s.muted} style={{ fontSize: '.74rem' }}>{l}</span><b className={s.big} style={{ fontSize: '1.3rem' }}>{v}</b><span className={s.muted} style={{ fontSize: '.7rem' }}>{d}</span></div>)}
          </div>
          {!web && <button className={`${s.btn} ${s.btnGhost}`} onClick={onSwitch}><Icon name="users" />Preview as another supplier</button>}
        </div>
        <div className={s.listSide}>
          <div className={s.rowBetween}><b className={s.h3}>Packages</b><button className={s.link}><Icon name="plus" size={14} /> Add package</button></div>
          {sup.packages.map((p) => (
            <div key={p.id} className={s.card}>
              <div className={s.rowBetween}><b className={s.h3}>{p.name}</b><Icon name="edit" size={18} /></div>
              <div className={s.rowBetween}><span className={s.muted}>{p.summary}</span><span className={s.price}>{gbp(p.price)}{p.perGuest ? ' pp' : ''}</span></div>
              <span className={s.muted}>Deposit {p.deposit}%{p.maxGuests ? ` · up to ${p.maxGuests} guests` : ''}{p.hours ? ` · ${p.hours}` : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
