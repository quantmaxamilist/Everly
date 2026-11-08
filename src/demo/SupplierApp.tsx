'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { asset } from '@/lib/site';
import { Shell, Top, Sheet, Toast, Stars, loadEnquiry, useWeb } from './ui';
import type { EnquiryPayload } from './CoupleApp';
import {
  suppliers, personaFor, featuredPersonas, categories, catOne, PREVIEW_MONTHS, monthLabel, dayPrice, shortPrice, shortGbp, gbp, fmtDate, supById, addDays, daysBetween, paymentsDue, depositAmt, isBooked, blocksDate,
  PLANS, planById, pct, planYear, breakEven, isTentative, regions, styles, extrasFor, type Extra, type Package, PROC_LABEL, txCount, processingFee, gbp2, TODAY, BALANCE_DAYS, CONTRACT_DAYS, STATUS_LABEL, pkgTotal, type Job, type JobStatus, type Persona, type Supplier, type Due, type PlanId, type SubPlan,
} from './data';
import s from './app.module.css';
import c from './calendar.module.css';

type Tab = 'dash' | 'enq' | 'cal' | 'list';
const monthOf = (d: string) => d.slice(0, 7);
const firstName = (couple: string) => couple.split(' & ')[0];
const statusText = (j: Job) => (j.noQuote ? 'Booked · no quote' : STATUS_LABEL[j.status]);
const dueText = (n: number) => (n < 0 ? `overdue by ${-n} day${n === -1 ? '' : 's'}` : n === 0 ? 'due today' : `due in ${n} day${n === 1 ? '' : 's'}`);

export default function SupplierApp() {
  const [pid, setPid] = useState('stone-villa');
  const [coupleJob, setCoupleJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>(() => personaFor('stone-villa').jobs.map((j) => ({ ...j })));
  const [openId, setOpenId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('enq');
  const [month, setMonth] = useState('2027-06');
  const [toast, setToast] = useState('');
  const [seen, setSeen] = useState({ opened: false, held: false, deposit: false, filtered: false, plan: false, calendar: false, switched: false });
  const [planId, setPlanId] = useState<PlanId>('starter');
  const [autoPlan, setAutoPlan] = useState(true);
  const [addons, setAddons] = useState({ featured: false, spotlight: false });
  const [notes, setNotes] = useState<Note[]>([]);
  const [brochure, setBrochure] = useState<{ name: string; size: number } | null>({ name: 'Brochure 2027.pdf', size: 2_400_000 });
  const plan = planById(planId);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [closed, setClosed] = useState<Record<string, string>>({});
  const [asOpen, setAsOpen] = useState(false);

  const [edits, setEdits] = useState<Partial<Supplier>>({});
  const [extras, setExtras] = useState<Extra[] | null>(null);
  const persona0 = personaFor(pid);
  const sup: Supplier = useMemo(() => ({ ...persona0.sup, ...edits }), [persona0, edits]);
  const persona: Persona = useMemo(() => ({ ...persona0, sup }), [persona0, sup]);

  const load = (id: string, cj: Job | null) => {
    const list = personaFor(id).jobs.map((j) => ({ ...j }));
    const all = cj && cj.id && supById(id) && cj.pid && supById(id)!.packages.some((p) => p.id === cj.pid) ? [cj, ...list] : list;
    const first = all.find((j) => j.status === 'new');
    setPid(id); setJobs(all); setSelId(first?.id ?? null); setOpenId(null);
    setPrices({}); setClosed({}); setEdits({}); setExtras(null);
    setPlanId(cheapestPlan(asteriaTakings(all)).id);
    setNotes(seedNotes(all));
    setBrochure({ name: `${supById(id)!.name} brochure 2027.pdf`, size: 1_800_000 + (id.length % 7) * 300_000 });
    setMonth(first && PREVIEW_MONTHS.includes(monthOf(first.date)) ? monthOf(first.date) : '2027-06');
  };

  useEffect(() => {
    let as: string | null = null;
    try { as = new URLSearchParams(location.search).get('as'); } catch {}
    const e = loadEnquiry<EnquiryPayload>();
    const cj: Job | null = e && supById(e.sid) ? { id: 'A-20488', couple: e.couple, date: e.date, guests: e.guests, pkg: e.pkg, pid: e.pid, total: e.total, deposit: e.deposit, paid: 0, status: 'new', source: 'Asteria', message: e.message, phone: e.phone, received: 'Just now', fromCouplePreview: true } : null;
    setCoupleJob(cj);
    load(as && supById(as) ? as : cj ? cj.pid && suppliers.find((x) => x.packages.some((p) => p.id === cj.pid))!.id || 'stone-villa' : 'stone-villa', cj);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo(0, 0); }, [tab, pid]);

  const switchTo = (id: string) => { load(id, coupleJob); setSeen((x) => ({ ...x, switched: true })); setAsOpen(false); setToast(`Now previewing as ${supById(id)!.name}`); };
  const update = (id: string, patch: Partial<Job>, msg: string) => { setJobs((l) => l.map((j) => (j.id === id ? { ...j, ...patch } : j))); setToast(msg); };
  const notify = (j: Job, text: string, kind: Note['kind']) => setNotes((n) => [{ id: `${j.id}-${kind}-${n.length}`, jobId: j.id, text, kind, at: 'Just now' }, ...n]);
  const act = {
    hold: (j: Job) => { update(j.id, { status: 'held', contractDaysAgo: 0 }, `Contract sent to ${j.couple} — the date stays open until they pay the deposit`); notify(j, `Contract sent to ${j.couple}`, 'contract'); setSeen((x) => ({ ...x, held: true })); },
    deposit: (j: Job) => {
      update(j.id, { status: 'deposit', paid: depositAmt(j) }, `Automatic: ${j.couple} signed & paid ${gbp(depositAmt(j))} — date now held`);
      notify(j, `${j.couple} signed the contract and paid the ${gbp(depositAmt(j))} deposit. ${fmtDate(j.date, { day: 'numeric', month: 'short', year: 'numeric' })} is now held.`, 'deposit');
      setSeen((x) => ({ ...x, deposit: true }));
    },
    paid: (j: Job) => {
      const owed = j.total - j.paid; const inst = j.instalment && j.paid < depositAmt(j) + j.instalment.amount ? j.instalment.amount : 0;
      if (inst && inst < owed) { update(j.id, { paid: j.paid + inst }, `Automatic: ${gbp(inst)} instalment received from ${j.couple}`); notify(j, `${j.couple} paid their ${gbp(inst)} instalment.`, 'payment'); return; }
      update(j.id, { status: 'paid', paid: j.total }, `Automatic: final payment received — ${j.couple} fully paid`); notify(j, `${j.couple} paid the final ${gbp(owed)}. Fully paid ✓`, 'payment');
    },
    decline: (j: Job) => update(j.id, { status: 'declined' }, 'Enquiry declined'),
    release: (j: Job) => update(j.id, { status: 'declined' }, 'Date released — contract withdrawn'),
    resend: (j: Job) => update(j.id, { contractDaysAgo: 0 }, `Contract re-sent to ${j.couple}`),
    cancel: (j: Job) => update(j.id, { status: 'cancelled' }, `Booking cancelled — ${j.couple} notified`),
    restore: (j: Job) => update(j.id, { status: j.paid >= j.total && j.total > 0 ? 'paid' : j.paid > 0 ? 'deposit' : 'held' }, 'Booking restored'),
  };
  const addJob = (j: Job) => { setJobs((l) => [...l, j].sort((a, b) => a.date.localeCompare(b.date))); setSeen((x) => ({ ...x, calendar: true })); setToast(`${j.couple} added to your calendar`); };

  const open = (id: string) => { setOpenId(id); setSelId(id); setSeen((x) => ({ ...x, opened: true })); };
  const go = (t: Tab) => { setTab(t); setOpenId(null); };
  const featured = jobs.find((j) => j.status === 'new') || jobs.find((j) => j.received);
  const newCount = jobs.filter((j) => j.status === 'new').length;
  const steps = [
    { label: featured ? `Open ${featured.couple}'s new enquiry` : 'Open a new enquiry', done: seen.opened },
    { label: 'Send the contract (date stays open until the deposit)', done: seen.held },
    { label: 'Watch the deposit arrive automatically', done: seen.deposit },
    { label: 'Filter the dashboard by month, year or dates', done: seen.filtered },
    { label: 'Check your plan & add-ons (Featured, Spotlight)', done: seen.plan },
    { label: 'Add a direct booking or close dates on the calendar', done: seen.calendar },
    { label: 'Preview as a different type of supplier', done: seen.switched },
  ];
  const openJob = jobs.find((j) => j.id === openId) || null;
  const avatarBtn = <button className={s.avatar} style={{ border: 0, cursor: 'pointer' }} onClick={() => setAsOpen(true)} aria-label="Switch business">{persona.initials}</button>;

  return (
    <Shell<Tab>
      side="Supplier" title="Run your bookings" intro={`Try the supplier side as ${sup.name}: answer enquiries, take bookings from enquiry to fully paid, and manage your calendar.`} steps={steps}
      other={{ label: 'Switch to the couple preview', to: '/couple-preview' }}
      search="Search couples, bookings, enquiries…"
      account={{ initials: persona.initials, name: sup.name, sub: `${sup.category} · ${sup.town}` }}
      extra={<PreviewAs pid={pid} onChange={switchTo} />}
      nav={{ items: [{ id: 'dash', label: 'Dashboard', icon: 'grid' }, { id: 'enq', label: 'Enquiries', icon: 'inbox', count: newCount || undefined }, { id: 'cal', label: 'Calendar', icon: 'calendar' }, { id: 'list', label: 'Listing', icon: 'layers' }], active: tab, onChange: go }}
    >
      {tab === 'dash' && <Dashboard persona={persona} jobs={jobs} onOpen={open} avatar={avatarBtn} onFilter={() => setSeen((x) => ({ ...x, filtered: true }))} plan={plan} setPlan={(id) => { setPlanId(id); setToast(`Switched to ${planById(id).name} — ${pct(planById(id).rate)} commission`); }} onPlanSeen={() => setSeen((x) => ({ ...x, plan: true }))}
        autoPlan={autoPlan} setAutoPlan={(v) => { setAutoPlan(v); if (v) { const best = cheapestPlan(asteriaTakings(jobs)); setPlanId(best.id); setToast(`Auto-switch on — you're on ${best.name}, the cheapest plan for your Asteria bookings`); } else setToast('Auto-switch off — you stay on your chosen plan'); }}
        notes={notes} addons={addons} setAddon={(k, v) => { setAddons((a) => ({ ...a, [k]: v })); setSeen((x) => ({ ...x, plan: true })); setToast(v ? `${k === 'featured' ? 'Featured' : 'Spotlight'} turned on (preview — nothing charged)` : `${k === 'featured' ? 'Featured' : 'Spotlight'} turned off`); }} />}
      {tab === 'enq' && <Inbox jobs={jobs} sup={sup} selId={selId} onOpen={open} onSelect={(id) => { setSelId(id); setSeen((x) => ({ ...x, opened: true })); }} act={act} avatar={avatarBtn} plan={plan} />}
      {tab === 'cal' && <Calendar sup={sup} jobs={jobs} month={month} setMonth={setMonth} prices={prices} setPrices={(d, p) => { setPrices((x) => { const n = { ...x }; d.forEach((k) => { n[k] = p; }); return n; }); setSeen((x) => ({ ...x, calendar: true })); setToast(`Price set to ${shortPrice(sup, p)} for ${d.length} day${d.length > 1 ? 's' : ''}`); }} closed={closed} setClosed={(d, reason) => { setClosed((x) => { const n = { ...x }; d.forEach((k) => { if (reason) n[k] = reason; else delete n[k]; }); return n; }); setSeen((x) => ({ ...x, calendar: true })); setToast(reason ? `${d.length} day${d.length > 1 ? 's' : ''} closed — ${reason}` : 'Dates re-opened'); }} onJob={(j) => open(j.id)} addJob={addJob} />}
      {tab === 'list' && <Listing persona={persona} onSwitch={() => setAsOpen(true)} brochure={brochure} setBrochure={(b) => { setBrochure(b); setToast(b ? `${b.name} uploaded — couples can download it from your listing` : 'Brochure removed'); }} addons={addons}
        update={(patch, msg) => { setEdits((e) => { const n = { ...e, ...patch }; if (patch.packages) n.fromPrice = Math.min(...patch.packages.map((p) => p.price)); if (patch.gallery) n.img = patch.gallery[0] ?? '/images/setting.jpg'; return n; }); if (msg) setToast(msg); }}
        extras={extras ?? extrasFor(persona0.sup)} setExtras={setExtras} />}
      {openJob && <Sheet title={openJob.received ? `Enquiry ${openJob.id}` : `Booking ${openJob.id}`} onClose={() => setOpenId(null)}><JobDetail j={openJob} sup={sup} act={act} jobs={jobs} plan={plan} /></Sheet>}
      {asOpen && (
        <Sheet title="Preview as…" onClose={() => setAsOpen(false)}>
          <p className={s.muted}>See the platform as a different supplier. All figures are sample data.</p>
          {featuredPersonas.map((id) => {
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

type Acts = Record<'hold' | 'deposit' | 'paid' | 'decline' | 'release' | 'resend' | 'cancel' | 'restore', (j: Job) => void>;
type Note = { id: string; jobId: string; text: string; kind: 'contract' | 'deposit' | 'payment' | 'reminder'; at: string };
type Addons = { featured: boolean; spotlight: boolean };
const ADDONS: { k: keyof Addons; name: string; price: number; what: string; badge: boolean }[] = [
  { k: 'featured', name: 'Featured', price: 29, what: 'A Featured badge and a place at the top of your category when couples search your area.', badge: true },
  { k: 'spotlight', name: 'Spotlight', price: 49, what: 'Shown in the matching Inspiration mood boards (e.g. Country, Rustic barn). No badge.', badge: false },
];
/** Asteria-only income from weddings in the last 12 months (direct bookings don't count) */
const asteriaTakings = (jobs: Job[]) => jobs.filter((j) => isBooked(j) && !j.noQuote && j.source === 'Asteria' && j.date > addDays(TODAY, -365) && j.date <= TODAY).reduce((t, j) => t + j.total, 0);
const cheapestPlan = (takings: number, billing: 'annual' | 'monthly' = 'annual') => PLANS.filter((p) => p.id !== 'founding').reduce((a, b) => (planYear(b, takings, billing) < planYear(a, takings, billing) ? b : a));
const NOTE_IC: Record<Note['kind'], string> = { contract: 'sign', deposit: 'check', payment: 'card', reminder: 'bell' };
function seedNotes(jobs: Job[]): Note[] {
  const out: Note[] = [];
  const dep = jobs.filter((j) => j.status === 'deposit' && j.source === 'Asteria').slice(-2);
  const held = jobs.filter((j) => j.status === 'held').slice(0, 1);
  const due = paymentsDue(jobs).filter((d) => d.inDays >= 0 && d.inDays <= 14).slice(0, 1);
  held.forEach((j) => out.push({ id: `${j.id}-r`, jobId: j.id, kind: 'reminder', at: 'Today', text: `Reminder sent to ${j.couple}: contract & deposit ${dueText(CONTRACT_DAYS - (j.contractDaysAgo ?? 0))}.` }));
  due.forEach((d) => out.push({ id: `${d.job.id}-d`, jobId: d.job.id, kind: 'reminder', at: 'Today', text: `${d.kind} of ${gbp(d.amount)} from ${d.job.couple} ${dueText(d.inDays)} — they've been reminded.` }));
  dep.forEach((j, i) => out.push({ id: `${j.id}-s`, jobId: j.id, kind: 'deposit', at: i ? '3 days ago' : 'Yesterday', text: `${j.couple} signed and paid the ${gbp(depositAmt(j))} deposit. Date held.` }));
  return out;
}

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

function Badge({ j }: { j: Job }) {
  const cls: Record<JobStatus, string> = { new: s.stNew, held: s.stHeld, deposit: s.stDeposit, paid: s.stBooked, declined: s.stDeclined, cancelled: s.stCancelled };
  return <span className={`${s.status} ${cls[j.status]}`}>{statusText(j)}</span>;
}

/* ---------------- enquiries & bookings ---------------- */
function Inbox({ jobs, sup, selId, onOpen, onSelect, act, avatar, plan }: { jobs: Job[]; sup: Supplier; selId: string | null; onOpen: (id: string) => void; onSelect: (id: string) => void; act: Acts; avatar: React.ReactNode; plan: SubPlan }) {
  const web = useWeb();
  const [filter, setFilter] = useState<'enq' | 'booked' | 'closed'>('enq');
  const lists = {
    enq: jobs.filter((j) => j.status === 'new' || j.status === 'held').sort((a, b) => (a.status === b.status ? 0 : a.status === 'new' ? -1 : 1)),
    booked: jobs.filter((j) => isBooked(j) && j.date >= TODAY),
    closed: jobs.filter((j) => j.status === 'declined' || j.status === 'cancelled'),
  };
  const shown = lists[filter];
  const seg = (
    <div className={s.seg}>
      {([['enq', `Enquiries (${lists.enq.length})`], ['booked', `Bookings (${lists.booked.length})`], ['closed', 'Declined & cancelled']] as const).map(([k, l]) => <button key={k} className={filter === k ? s.on : ''} onClick={() => setFilter(k)}>{l}</button>)}
    </div>
  );
  const item = (j: Job) => (
    <button key={j.id} className={`${s.card} ${s.enqItem} ${(web ? selId === j.id : j.status === 'new') ? s.enqOn : ''}`} onClick={() => (web ? onSelect(j.id) : onOpen(j.id))}>
      <div className={s.rowBetween}><Badge j={j} /><span className={s.muted}>{j.received || j.source}</span></div>
      <b className={s.h3}>{j.couple}{j.fromCouplePreview && <span className={s.tag} style={{ marginLeft: 8, verticalAlign: 'middle' }}>From your couple preview</span>}</b>
      <span className={s.muted}>{fmtDate(j.date)} · {j.guests} guests</span>
      <div className={s.rowBetween}><span>{j.pkg}</span><b className={s.price}>{j.noQuote ? '—' : gbp(j.total)}</b></div>
      {j.status === 'held' && <span className={s.muted} style={{ fontSize: '.78rem' }}>Tentative — date not held until the deposit · {dueText(CONTRACT_DAYS - (j.contractDaysAgo ?? 0))}</span>}
    </button>
  );
  if (web) {
    const sel = jobs.find((j) => j.id === selId) || shown[0];
    return (
      <>
        <Top title="Enquiries & bookings" kicker={`${jobs.filter((j) => j.status === 'new').length} new · ${jobs.filter(isTentative).length} contracts out (tentative)`} right={seg} />
        <div className={s.inbox}>
          <div className={s.inboxList}>{shown.map(item)}{!shown.length && <p className={s.muted}>Nothing here.</p>}</div>
          {sel && <div className={`${s.card} ${s.inboxPane}`}><JobDetail j={sel} sup={sup} act={act} jobs={jobs} plan={plan} /></div>}
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

const PIPE: [JobStatus, string, string][] = [['new', 'New enquiry', 'Couple asks'], ['held', 'Contract sent', 'Tentative'], ['deposit', 'Deposit paid', 'Date held'], ['paid', 'Fully paid', 'Balance received']];

function JobDetail({ j, sup, act, jobs, plan }: { j: Job; sup: Supplier; act: Acts; jobs: Job[]; plan: SubPlan }) {
  const web = useWeb();
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setConfirm(false), [j.id, j.status]);
  const dep = depositAmt(j);
  const fee = j.source === 'Asteria' ? Math.round(j.total * plan.rate) : 0;
  const proc = processingFee(j);
  const balanceDue = addDays(j.date, -(j.balanceDays ?? BALANCE_DAYS));
  const stage = PIPE.findIndex(([st]) => st === j.status);
  const clash = jobs.find((b) => b.id !== j.id && blocksDate(b) && j.date >= b.date && j.date <= (b.endDate || b.date));
  const bg = web ? { background: 'var(--off)' } : undefined;
  const depositLine = j.paid >= dep && dep > 0 ? 'Paid ✓' : j.status === 'held' ? dueText(CONTRACT_DAYS - (j.contractDaysAgo ?? 0)) : 'Due when the contract is signed';
  const balanceLine = j.paid >= j.total && j.total > 0 ? 'Paid ✓' : `${fmtDate(balanceDue, { day: 'numeric', month: 'short', year: 'numeric' })} · ${dueText(daysBetween(TODAY, balanceDue))}`;
  const ghost = `${s.btn} ${s.btnGhost}`;
  let actions: React.ReactNode = null;
  if (confirm) {
    actions = (
      <div className={`${s.card} ${s.overCard}`}>
        <b className={s.h3}>Cancel {j.couple}&rsquo;s booking?</b>
        <p className={s.muted}>{j.paid > 0 ? `They've paid ${gbp(j.paid)}. Under your policy the ${gbp(Math.min(j.paid, dep))} deposit is non-refundable${j.paid > dep ? ` and ${gbp(j.paid - dep)} would be refunded` : ''}.` : 'Nothing has been paid yet.'} The date will re-open on your calendar.</p>
        <div className={s.btnRow}><button className={ghost} onClick={() => setConfirm(false)}>Keep booking</button><button className={`${s.btn} ${s.btnDanger}`} onClick={() => act.cancel(j)}>Cancel booking</button></div>
      </div>
    );
  } else if (j.status === 'new') {
    actions = <div className={s.actRow}><button className={s.btn} onClick={() => act.hold(j)}>Send contract</button><button className={ghost} onClick={() => act.decline(j)}>Decline</button></div>;
  } else if (j.status === 'held') {
    actions = (
      <>
        <div className={s.autoNote}><Icon name="clock" size={16} /><span>Waiting for {firstName(j.couple)} to sign &amp; pay the deposit. The booking updates by itself — and the date is held — the moment they pay.</span></div>
        <div className={s.actRow}>{j.source === 'Asteria' ? <button className={`${s.btn} ${s.btnSim}`} onClick={() => act.deposit(j)}><Icon name="sparkle" />Simulate: couple signs &amp; pays deposit</button> : <button className={s.btn} onClick={() => act.deposit(j)}>Record deposit received</button>}<button className={ghost} onClick={() => act.resend(j)}>Resend contract</button><button className={ghost} onClick={() => act.release(j)}>Withdraw contract</button></div>
      </>
    );
  } else if (j.status === 'deposit') {
    const nextKind = j.instalment && j.paid < dep + j.instalment.amount ? 'instalment' : 'balance';
    actions = (
      <>
        {!j.noQuote && j.source === 'Asteria' && <div className={s.autoNote}><Icon name="bell" size={16} /><span>Asteria reminds {firstName(j.couple)} before each payment is due and updates this booking automatically when they pay.</span></div>}
        <div className={s.actRow}>{!j.noQuote && (j.source === 'Asteria' ? <button className={`${s.btn} ${s.btnSim}`} onClick={() => act.paid(j)}><Icon name="sparkle" />Simulate: couple pays {nextKind}</button> : <button className={s.btn} onClick={() => act.paid(j)}>Record {nextKind} received</button>)}<button className={ghost}><Icon name="message" />Message {firstName(j.couple)}</button><button className={`${ghost} ${s.btnDangerGhost}`} onClick={() => setConfirm(true)}>Cancel booking</button></div>
      </>
    );
  } else if (j.status === 'paid') {
    actions = <div className={s.actRow}><button className={ghost}><Icon name="message" />Message {firstName(j.couple)}</button><button className={`${ghost} ${s.btnDangerGhost}`} onClick={() => setConfirm(true)}>Cancel booking</button></div>;
  } else {
    actions = <div className={s.actRow}>{j.status === 'cancelled' && <button className={ghost} onClick={() => act.restore(j)}>Restore booking</button>}<button className={ghost}><Icon name="message" />Message {firstName(j.couple)}</button></div>;
  }
  return (
    <>
      {j.status === 'cancelled' || j.status === 'declined' ? <Badge j={j} /> : (
        <ol className={s.pipe}>
          {PIPE.map(([st, l, sub], i) => <li key={st} className={i < stage ? s.pipeDone : i === stage ? s.pipeNow : ''}><span>{i < stage ? <Icon name="check" size={12} /> : i + 1}</span><b>{l}</b><small>{sub}</small></li>)}
        </ol>
      )}
      <div>
        <h3 style={{ fontSize: '1.6rem' }}>{j.couple}</h3>
        <p className={s.muted}>{j.guests} guests · {j.source === 'Asteria' ? 'via Asteria' : 'Direct booking'}{j.phone ? ` · ${j.phone}` : ''}{j.email ? ` · ${j.email}` : ''}{j.received ? ` · received ${j.received.toLowerCase()}` : ''}</p>
      </div>
      <div className={s.enqGrid}>
        <div className={s.card} style={{ gridTemplateColumns: '1fr auto', alignItems: 'center', ...bg }}>
          <div><b className={s.h3}>{j.pkg}</b><p className={s.muted}>{sup.name}</p></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(sup.img)} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
        </div>
        <div className={s.card} style={{ gridTemplateColumns: '1fr 1fr', ...bg }}>
          <div><b>{fmtDate(j.date, { weekday: 'long' })}</b><p>{fmtDate(j.date, { day: 'numeric', month: 'short', year: 'numeric' })}{j.endDate ? ` – ${fmtDate(j.endDate, { day: 'numeric', month: 'short' })}` : ''}</p><p className={s.muted}>{j.status === 'new' || j.status === 'held' ? (clash ? 'Clashes with a booking' : j.status === 'held' ? 'Tentative — not held yet' : 'Date is free') : `${Math.max(0, daysBetween(TODAY, j.date))} days away`}</p></div>
          <div><b>{j.guests}</b><p>guests</p><p className={s.muted}>{sup.capacity ? `Capacity ${sup.capacity}` : catOne[sup.category]}</p></div>
        </div>
      </div>
      {j.message && <div className={s.card} style={bg}><span className={s.muted}>Message</span><p style={{ fontSize: '.92rem' }}>“{j.message}”</p></div>}
      {j.note && <div className={s.card} style={bg}><span className={s.muted}>Note</span><p style={{ fontSize: '.92rem' }}>{j.note}</p></div>}
      {!j.noQuote && (
        <div className={s.enqGrid}>
          <div className={s.card} style={bg}>
            <b className={s.h3}>Quote</b>
            <ul className={s.lines}>
              <li><span>{j.pkg}</span><span>{gbp(j.total)}</span></li>
              {fee ? <li className={s.muted}><span>Asteria commission ({plan.name}, {pct(plan.rate)})</span><span>−{gbp(fee)}</span></li> : <li className={s.muted}><span>Direct booking — no Asteria fee</span><span>£0</span></li>}
              <li className={s.muted}><span>Processing fees (1.5% + 20p × {txCount(j)} payment{txCount(j) > 1 ? 's' : ''})</span><span>−{gbp2(proc)}</span></li>
              <li><b>You receive</b><b>{gbp2(j.total - fee - proc)}</b></li>
            </ul>
          </div>
          <div className={s.card} style={bg}>
            <b className={s.h3}>Payments</b>
            <ul className={s.lines}>
              <li><span>Deposit {j.deposit}% · {gbp(dep)}</span><span className={j.paid >= dep ? s.okTxt : s.muted}>{depositLine}</span></li>
              {j.instalment && <li><span>Instalment · {gbp(j.instalment.amount)}</span><span className={j.paid >= dep + j.instalment.amount ? s.okTxt : s.muted}>{j.paid >= dep + j.instalment.amount ? 'Paid ✓' : `${fmtDate(j.instalment.due, { day: 'numeric', month: 'short', year: 'numeric' })} · ${dueText(daysBetween(TODAY, j.instalment.due))}`}</span></li>}
              <li><span>Final payment · {gbp(j.total - dep - (j.instalment?.amount ?? 0))}</span><span className={j.paid >= j.total ? s.okTxt : s.muted}>{balanceLine}</span></li>
              <li><b>Received so far</b><b>{gbp(j.paid)}</b></li>
            </ul>
          </div>
        </div>
      )}
      {!j.noQuote && (
        <div className={s.card} style={bg}>
          <b className={s.h3}>Policy</b>
          <p className={s.muted}><b>Payment:</b> {j.deposit}% due when the contract is signed{j.instalment ? `, an instalment on ${fmtDate(j.instalment.due, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}; the rest {Math.round((j.balanceDays ?? BALANCE_DAYS) / 7)} weeks before the date.</p>
          <p className={s.muted}><b>Date hold:</b> the date is only held once the deposit is paid. Until then it shows as tentative on your calendar and other couples can still book it.</p>
          <p className={s.muted}><b>Cancellation:</b> {j.cancelPolicy || 'Deposit is non-refundable. Other payments are refundable if cancelled more than 12 weeks before the date.'}</p>
          <p className={s.muted}><b>Security deposit:</b> {j.securityDeposit ? `${gbp(j.securityDeposit)}, returned after the event` : 'None'}</p>
        </div>
      )}
      <div className={web ? undefined : s.sticky}>{actions}</div>
    </>
  );
}

/* ---------------- dashboard ---------------- */
type Period = { mode: 'month' | 'year' | 'range'; month: string; year: string; from: string; to: string };
const periodRange = (p: Period): [string, string] => {
  if (p.mode === 'month') { const [y, m] = p.month.split('-').map(Number); return [`${p.month}-01`, `${p.month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`]; }
  if (p.mode === 'year') return [`${p.year}-01-01`, `${p.year}-12-31`];
  return p.from <= p.to ? [p.from, p.to] : [p.to, p.from];
};
const periodName = (p: Period) => (p.mode === 'month' ? monthLabel(p.month, true) : p.mode === 'year' ? p.year : `${fmtDate(periodRange(p)[0], { day: 'numeric', month: 'short', year: 'numeric' })} – ${fmtDate(periodRange(p)[1], { day: 'numeric', month: 'short', year: 'numeric' })}`);

function Dashboard({ persona, jobs, onOpen, avatar, onFilter, plan, setPlan, onPlanSeen, autoPlan, setAutoPlan, notes, addons, setAddon }: { persona: Persona; jobs: Job[]; onOpen: (id: string) => void; avatar: React.ReactNode; onFilter: () => void; plan: SubPlan; setPlan: (id: PlanId) => void; onPlanSeen: () => void; autoPlan: boolean; setAutoPlan: (v: boolean) => void; notes: Note[]; addons: Addons; setAddon: (k: keyof Addons, v: boolean) => void }) {
  const web = useWeb();
  const sup = persona.sup;
  const [p, setP] = useState<Period>({ mode: 'year', month: '2027-06', year: '2027', from: '2027-05-01', to: '2027-08-31' });
  const setPeriod = (x: Partial<Period>) => { setP((o) => ({ ...o, ...x })); onFilter(); };
  const [from, to] = periodRange(p);
  const len = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1); const prevFrom = addDays(prevTo, -(len - 1));
  const booked = jobs.filter((j) => isBooked(j) && !j.noQuote);
  const inP = (a: string, b: string) => booked.filter((j) => j.date >= a && j.date <= b);
  const cur = inP(from, to); const prev = inP(prevFrom, prevTo);
  const sum = (l: Job[], k: 'total' | 'paid') => l.reduce((t, j) => t + j[k], 0);
  const value = sum(cur, 'total'); const prevValue = sum(prev, 'total');
  const fees = Math.round(cur.filter((j) => j.source === 'Asteria').reduce((t, j) => t + j.total, 0) * plan.rate);
  const takings = asteriaTakings(jobs);
  const proc = Math.round(cur.reduce((t, j) => t + processingFee(j), 0) * 100) / 100;
  const tx = cur.reduce((t, j) => t + txCount(j), 0);
  const keep = value - fees - proc;
  const received = sum(cur, 'paid');
  const chg = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
  const d1 = chg(value, prevValue); const d2 = cur.length - prev.length;
  const kpis = [
    { l: 'Bookings value', v: gbp(value), d: `${d1 >= 0 ? '+' : ''}${d1}%`, up: d1 >= 0 },
    { l: 'You keep', v: gbp(keep), d: 'after commission & processing fees', up: true, plain: true },
    { l: 'Weddings booked', v: String(cur.length), d: `${d2 >= 0 ? '+' : ''}${d2}`, up: d2 >= 0 },
    { l: 'Received so far', v: gbp(received), d: value ? `${Math.round((received / value) * 100)}% of value` : '—', up: true, plain: true },
  ];
  // chart buckets: months, or weeks for short periods
  const buckets: { l: string; a: string; b: string }[] = [];
  if (len <= 45) {
    for (let d = from; d <= to; d = addDays(d, 7)) buckets.push({ l: fmtDate(d, { day: 'numeric', month: 'short' }), a: d, b: addDays(d, 6) > to ? to : addDays(d, 6) });
  } else {
    let ym = from.slice(0, 7);
    while (`${ym}-01` <= to) { const [y, m] = ym.split('-').map(Number); buckets.push({ l: monthLabel(ym), a: `${ym}-01`, b: `${ym}-31` }); ym = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; }
  }
  const series = buckets.map((x) => ({ ...x, v: sum(inP(x.a, x.b), 'total') }));
  const max = Math.max(1, ...series.map((x) => x.v));
  const pending = jobs.filter((j) => j.status === 'new' || j.status === 'held');
  const upcoming = jobs.filter((j) => isBooked(j) && j.date >= TODAY).slice(0, 5);
  const dues = paymentsDue(jobs);
  const next4 = dues.filter((x) => x.inDays <= 28);
  const next4Total = next4.reduce((t, x) => t + x.amount, 0);

  const filter = (
    <div className={s.periodBar}>
      <div className={s.seg}>{(['month', 'year', 'range'] as const).map((m) => <button key={m} className={p.mode === m ? s.on : ''} onClick={() => setPeriod({ mode: m })}>{m === 'month' ? 'Month' : m === 'year' ? 'Year' : 'Date range'}</button>)}</div>
      {p.mode === 'month' && <select className={s.input} value={p.month} onChange={(e) => setPeriod({ month: e.target.value })} aria-label="Month">{PREVIEW_MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m, true)}</option>)}</select>}
      {p.mode === 'year' && <select className={s.input} value={p.year} onChange={(e) => setPeriod({ year: e.target.value })} aria-label="Year"><option>2026</option><option>2027</option></select>}
      {p.mode === 'range' && <div className={s.rangeIn}><input type="date" className={s.input} value={p.from} onChange={(e) => setPeriod({ from: e.target.value })} aria-label="From" /><span>to</span><input type="date" className={s.input} value={p.to} onChange={(e) => setPeriod({ to: e.target.value })} aria-label="To" /></div>}
    </div>
  );
  return (
    <>
      <Top right={web ? undefined : avatar} title={web ? sup.name : undefined} kicker={web ? 'Good evening' : undefined} />
      <div className={s.body}>
        {!web && <div><p className={s.muted}>Good evening</p><h2 style={{ fontSize: '1.8rem' }}>{sup.name}</h2></div>}
        {filter}
        <p className={s.muted}>Showing weddings in <b>{periodName(p)}</b> · compared with the previous {p.mode === 'year' ? 'year' : p.mode === 'month' ? 'month' : `${len} days`}</p>
        <div className={s.kpis}>
          {kpis.map((k) => (
            <div key={k.l} className={s.card} style={{ gap: 4 }}>
              <span className={s.muted}>{k.l}</span>
              <b className={s.big} style={{ fontSize: '1.45rem' }}>{k.v}</b>
              {k.plain ? <span className={s.muted} style={{ fontSize: '.74rem' }}>{k.d}</span> : <span className={s.tag} style={k.up ? undefined : { background: '#f6e3da', color: '#9a4a2c' }}><Icon name={k.up ? 'up' : 'down'} size={12} /> {k.d} vs previous</span>}
            </div>
          ))}
        </div>
        <Updates notes={notes} onOpen={onOpen} />
        <PlanAdvisor takings={takings} plan={plan} setPlan={(id) => { if (autoPlan) setAutoPlan(false); setPlan(id); }} onSeen={onPlanSeen} autoPlan={autoPlan} setAutoPlan={setAutoPlan} />
        <AddOns addons={addons} setAddon={setAddon} />
        <div className={s.dashGrid}>
          <div className={`${s.card} ${s.span2}`}>
            <div className={s.rowBetween}><b className={s.h3}>Bookings by {len <= 45 ? 'week' : 'month'}</b><span className={s.muted}>{periodName(p)}</span></div>
            <div className={s.chart}>
              {series.map((m) => (
                <div key={m.a} className={s.chartCol}>
                  <span className={s.chartVal}>{m.v ? shortGbp(m.v) : ''}</span>
                  <span className={s.chartBar} style={{ height: `${(m.v / max) * 100}%`, background: m.v === max ? 'var(--olive)' : 'var(--sage)' }} />
                  <span className={s.muted} style={{ fontSize: '.66rem', whiteSpace: 'nowrap' }}>{m.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Profit breakdown</b>
            <ul className={s.lines}>
              <li><span>Bookings value</span><span>{gbp2(value)}</span></li>
              <li className={s.muted}><span>Asteria commission ({plan.name}, {pct(plan.rate)} · Asteria bookings only)</span><span>−{gbp2(fees)}</span></li>
              <li className={s.muted}><span>Processing fees ({PROC_LABEL})<br /><small>{tx} card payment{tx === 1 ? '' : 's'}</small></span><span>−{gbp2(proc)}</span></li>
              <li><b>You keep</b><b>{gbp2(keep)}</b></li>
            </ul>
            <p className={s.muted} style={{ fontSize: '.76rem' }}>{cur.filter((j) => j.source === 'Direct').length} direct bookings this period — no fee on those.</p>
          </div>
          <div className={`${s.card} ${s.dueBox}`}>
            <span className={s.muted}>Payments due in the next 4 weeks</span>
            <b className={s.big}>{gbp(next4Total)}</b>
            <ul className={s.dueSplit}>
              {(['Deposit', 'Instalment', 'Final payment'] as const).map((k) => { const l = next4.filter((x) => x.kind === k); return <li key={k}><span>{k === 'Deposit' ? 'Deposits' : k === 'Instalment' ? 'Instalments' : 'Final payments'} <small>· {l.length}</small></span><b>{gbp(l.reduce((t, x) => t + x.amount, 0))}</b></li>; })}
            </ul>
          </div>
          <div className={`${s.card} ${s.span2}`}>
            <div className={s.rowBetween}><b className={s.h3}>Payments to collect</b><span className={s.muted}>Next {Math.min(6, dues.length)} of {dues.length}</span></div>
            <ul className={s.dueList}>
              {dues.slice(0, 6).map((x: Due) => (
                <li key={x.job.id + x.kind}>
                  <button onClick={() => onOpen(x.job.id)}>
                    <span><b>{x.job.couple}</b><small><i className={`${s.kindTag} ${s['kind' + x.kind.split(' ')[0]]}`}>{x.kind}</i> {dueText(x.inDays)} · wedding {fmtDate(x.job.date, { day: 'numeric', month: 'short', year: 'numeric' })}</small></span>
                    <span className={s.dueAmt}><b>{gbp(x.amount)}</b><small className={x.inDays < 0 ? s.overTxt : x.inDays <= 7 ? s.soonTxt : ''}>{x.inDays < 0 ? 'Overdue' : fmtDate(x.due, { day: 'numeric', month: 'short' })}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Needs a reply</b>{pending.length > 0 && <span className={`${s.status} ${s.stNew}`}>{pending.length} open</span>}</div>
            {pending.slice(0, 4).map((e) => (
              <button key={e.id} className={s.rowBetween} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => onOpen(e.id)}>
                <span><b style={{ fontWeight: 500 }}>{e.couple}</b><br /><span className={s.muted}>{fmtDate(e.date)} · {e.pkg}</span></span><Badge j={e} />
              </button>
            ))}
            {!pending.length && <p className={s.muted}>All caught up.</p>}
          </div>
          <div className={`${s.card} ${s.span2}`}>
            <b className={s.h3}>Upcoming weddings</b>
            <ul className={s.lines}>
              {upcoming.map((b) => <li key={b.id}><span>{b.couple}<br /><span className={s.muted}>{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {b.guests} guests · {b.source}</span></span><Badge j={b} /></li>)}
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

/* ---------------- plan advisor ---------------- */
function PlanAdvisor({ takings, plan, setPlan, onSeen, autoPlan, setAutoPlan }: { takings: number; plan: SubPlan; setPlan: (id: PlanId) => void; onSeen: () => void; autoPlan: boolean; setAutoPlan: (v: boolean) => void }) {
  const web = useWeb();
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [amt, setAmt] = useState(Math.round(takings / 1000) * 1000);
  useEffect(() => { setAmt(Math.round(takings / 1000) * 1000); }, [takings]);
  const paid = PLANS.filter((p) => p.id !== 'founding');
  const rows = paid.map((p) => ({ p, sub: billing === 'annual' ? p.annual : p.monthly * 12, com: p.rate * amt, total: planYear(p, amt, billing) }));
  const best = rows.reduce((a, b) => (b.total < a.total ? b : a));
  const curRow = rows.find((r) => r.p.id === plan.id);
  const saving = curRow ? curRow.total - best.total : 0;
  const max = Math.max(...rows.map((r) => r.total), 1);
  const touch = (fn: () => void) => { fn(); onSeen(); };
  const fmtK = (n: number) => `£${Math.round(n / 1000)}k`;
  const steps = paid.slice(1).map((p, i) => ({ from: paid[i], to: p, at: breakEven(paid[i], p, billing) }));
  const founding = planById('founding');
  const rec = cheapestPlan(takings, billing);
  return (
    <div className={`${s.card} ${s.planAdv}`}>
      <div className={s.rowBetween} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <span className={s.muted}>Your Asteria plan{autoPlan ? ' · picked automatically' : ''}</span>
          <b className={s.h3} style={{ display: 'block', fontSize: '1.35rem' }}>{plan.name} · {pct(plan.rate)} commission</b>
          <span className={s.muted} style={{ fontSize: '.8rem' }}>Recommended from your <b>{gbp(takings)}</b> of Asteria bookings in the last 12 months: <b>{rec.name}</b>. Direct bookings don&rsquo;t count.</span>
        </div>
        <div className={s.seg} style={{ minWidth: 220 }}>
          <button className={billing === 'annual' ? s.on : ''} onClick={() => touch(() => setBilling('annual'))}>Pay yearly</button>
          <button className={billing === 'monthly' ? s.on : ''} onClick={() => touch(() => setBilling('monthly'))}>Pay monthly</button>
        </div>
      </div>
      <div className={`${s.advVerdict} ${saving > 0 ? s.advUp : ''}`}>
        <Icon name={saving > 0 ? 'up' : 'check'} size={18} />
        <p>{saving > 0
          ? <>At <b>{gbp(amt)}</b> a year through Asteria, <b>{best.p.name}</b> would cost you <b>{gbp(best.total)}</b> a year — <b>{gbp(saving)} less</b> than {plan.name}.</>
          : curRow ? <>At <b>{gbp(amt)}</b> a year through Asteria, <b>{plan.name}</b> is already your cheapest plan.</>
            : <>At <b>{gbp(amt)}</b> a year through Asteria, the best paid plan after your free year is <b>{best.p.name}</b> ({gbp(best.total)} a year).</>}</p>
        {saving > 0 && <button className={`${s.btn} ${s.btnSm}`} style={{ width: 'auto' }} onClick={() => touch(() => setPlan(best.p.id))}>Switch to {best.p.name}</button>}
      </div>
      <label className={s.autoRow}>
        <input type="checkbox" className={s.check} checked={autoPlan} onChange={(e) => touch(() => setAutoPlan(e.target.checked))} />
        <span><b>Auto-switch me to the cheapest plan</b><small>Each renewal we check your last 12 months of Asteria bookings and move you to whichever plan costs least. We&rsquo;ll email you before any change.</small></span>
      </label>
      <div className={s.field}>
        <label htmlFor="tk">What if you took this through Asteria per year: <b>{gbp(amt)}</b> <span className={s.muted}>· last 12 months: {gbp(takings)}</span></label>
        <input id="tk" type="range" className={s.range} min={0} max={200000} step={1000} value={amt} onChange={(e) => touch(() => setAmt(+e.target.value))} />
      </div>
      <div className={s.advTable} role="table">
        {web && <div className={`${s.advRow} ${s.advHead}`} role="row"><span>Plan</span><span>Subscription</span><span>Commission</span><span>Commission on {fmtK(amt)}</span><span>Total per year</span><span /></div>}
        {rows.map((r) => {
          const isBest = r.p.id === best.p.id; const isCur = r.p.id === plan.id;
          return (
            <div key={r.p.id} role="row" className={`${s.advRow} ${isBest ? s.advBest : ''} ${isCur ? s.advCur : ''}`}>
              <span className={s.advName}><b>{r.p.name}</b>{isBest && <i className={s.tag}>Best for you</i>}{isCur && <i className={`${s.tag} ${s.tagCur}`}>Your plan</i>}</span>
              <span>{billing === 'annual' ? `${gbp(r.p.annual)}/yr` : `${gbp(r.p.monthly)}/mo`}</span>
              <span>{pct(r.p.rate)}</span>
              <span>{gbp(r.com)}</span>
              <span className={s.advTotal}><b>{gbp(r.total)}</b><em><i style={{ width: `${(r.total / max) * 100}%` }} /></em><small>{amt ? `${pct(r.total / amt)} of takings` : ''}</small></span>
              <span>{isCur ? <span className={s.muted}>Current</span> : <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} onClick={() => touch(() => setPlan(r.p.id))}>Choose</button>}</span>
            </div>
          );
        })}
      </div>
      <div className={s.advFoot}>
        <span className={s.muted}>When it pays to move up {billing === 'annual' ? '(yearly billing)' : '(monthly billing)'}:</span>
        <div className={s.chips} style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
          {steps.map((x) => <span key={x.to.id} className={`${s.chip} ${amt >= x.at ? s.chipOn : ''}`}>{x.to.name} beats {x.from.name} from {fmtK(x.at)}</span>)}
        </div>
        <p className={s.muted} style={{ fontSize: '.78rem' }}><b>{founding.name}:</b> free for 12 months with {pct(founding.rate)} commission — for launch partners only{plan.id === 'founding' ? ' (your current plan)' : ''}. {plan.id !== 'founding' && <button className={s.link} style={{ fontSize: '.78rem' }} onClick={() => touch(() => setPlan('founding'))}>Preview as a Founding Partner</button>}</p>
      </div>
    </div>
  );
}

/* ---------------- automatic updates ---------------- */
function Updates({ notes, onOpen }: { notes: Note[]; onOpen: (id: string) => void }) {
  return (
    <div className={`${s.card} ${s.updates}`}>
      <div className={s.rowBetween}><b className={s.h3}><Icon name="bell" size={18} /> Automatic updates</b><span className={s.muted} style={{ fontSize: '.76rem' }}>Contracts &amp; payments update themselves</span></div>
      {notes.slice(0, 4).map((n) => (
        <button key={n.id} className={s.noteRow} onClick={() => onOpen(n.jobId)}>
          <span className={s.docIc}><Icon name={NOTE_IC[n.kind]} size={16} /></span>
          <span><span>{n.text}</span><small className={s.muted}>{n.at}</small></span>
        </button>
      ))}
      {!notes.length && <p className={s.muted}>Nothing new — you&rsquo;ll see signed contracts and payments here as they happen.</p>}
    </div>
  );
}

/* ---------------- add-on subscriptions ---------------- */
function AddOns({ addons, setAddon }: { addons: Addons; setAddon: (k: keyof Addons, v: boolean) => void }) {
  return (
    <div className={s.addonGrid}>
      {ADDONS.map((a) => (
        <div key={a.k} className={`${s.card} ${s.addon} ${addons[a.k] ? s.addonOn : ''}`}>
          <div className={s.rowBetween}><span className={s.tag}>Add-on</span><b className={s.price}>{gbp(a.price)}/month</b></div>
          <b className={s.h3}>{a.name}{a.badge && <span className={s.featBadge}>★ Featured</span>}</b>
          <p className={s.muted}>{a.what}</p>
          <label className={s.rowBetween}><span>{addons[a.k] ? 'On — cancel any time' : 'Off'}</span><input type="checkbox" className={s.check} checked={addons[a.k]} onChange={(e) => setAddon(a.k, e.target.checked)} /></label>
        </div>
      ))}
    </div>
  );
}

/* ---------------- calendar ---------------- */
type Range = { from: string; to: string };
const datesIn = (r: Range) => { const out: string[] = []; for (let d = r.from; d <= r.to; d = addDays(d, 1)) out.push(d); return out; };

function Calendar({ sup, jobs, month, setMonth, prices, setPrices, closed, setClosed, onJob, addJob }: { sup: Supplier; jobs: Job[]; month: string; setMonth: (m: string) => void; prices: Record<string, number>; setPrices: (d: string[], p: number) => void; closed: Record<string, string>; setClosed: (d: string[], reason: string) => void; onJob: (j: Job) => void; addJob: (j: Job) => void }) {
  const web = useWeb();
  const [mode, setMode] = useState<'month' | 'list'>('month');
  const [range, setRange] = useState<Range | null>(null);
  const [form, setForm] = useState<'price' | 'close' | 'quote' | 'noquote' | null>(null);
  const [y, m1] = month.split('-').map(Number); const m = m1 - 1;
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysIn = new Date(y, m + 1, 0).getDate();
  const iso = (d: number) => `${month}-${String(d).padStart(2, '0')}`;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const visible = useMemo(() => jobs.filter((j) => j.status !== 'declined' && j.status !== 'cancelled'), [jobs]);
  const jobOn = (d: string) => visible.find((b) => d >= b.date && d <= (b.endDate || b.date));
  const priceOf = (d: string) => prices[d] ?? dayPrice(sup, d);
  const inMonth = visible.filter((j) => monthOf(j.date) === month);
  const mi = PREVIEW_MONTHS.indexOf(month);
  const sel = range ? datesIn(range) : [];
  const selBusy = sel.some((d) => { const j = jobOn(d); return j && blocksDate(j); });
  const allClosed = sel.length > 0 && sel.every((d) => closed[d]);
  const tap = (d: string) => {
    if (!range || range.from !== range.to || d < range.from) setRange({ from: d, to: d });
    else if (d === range.from) setRange(null);
    else setRange({ from: range.from, to: d });
  };
  const nights = sel.length;
  const rangeLabel = range ? (range.from === range.to ? fmtDate(range.from, { weekday: 'short', day: 'numeric', month: 'short' }) : `${fmtDate(range.from, { day: 'numeric', month: 'short' })} – ${fmtDate(range.to, { day: 'numeric', month: 'short' })}`) : '';

  const monthNav = (
    <div className={s.monthNav}>
      <button className={s.back} disabled={mi <= 0} onClick={() => setMonth(PREVIEW_MONTHS[mi - 1])} aria-label="Previous month"><Icon name="arrow" size={16} /></button>
      <b>{monthLabel(month, true)}</b>
      <button className={`${s.back} ${s.fwd}`} disabled={mi >= PREVIEW_MONTHS.length - 1} onClick={() => setMonth(PREVIEW_MONTHS[mi + 1])} aria-label="Next month"><Icon name="arrow" size={16} /></button>
    </div>
  );
  const grid = (
    <div className={c.cal}>
      <div className={c.dow}>{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d}>{d}</span>)}</div>
      {weeks.map((wk, wi) => {
        const isoWk = wk.map((d) => (d ? iso(d) : null));
        const spans = visible.map((b) => {
          const idx = isoWk.map((d, i) => (d && d >= b.date && d <= (b.endDate || b.date) ? i : -1)).filter((i) => i >= 0);
          return idx.length ? { b, start: idx[0], len: idx.length } : null;
        }).filter(Boolean) as { b: Job; start: number; len: number }[];
        return (
          <div key={wi} className={c.week}>
            {wk.map((d, i) => {
              if (!d) return <span key={i} className={c.empty} />;
              const ds = iso(d); const bk = jobOn(ds); const cl = closed[ds]; const on = sel.includes(ds);
              return (
                <button key={i} className={`${c.day} ${bk && blocksDate(bk) ? c.taken : ''} ${cl ? c.blocked : ''} ${[5, 6].includes(i) ? c.weekend : ''} ${on ? c.sel : ''} ${ds < TODAY ? c.past : ''}`} onClick={() => (bk && blocksDate(bk) ? onJob(bk) : tap(ds))}>
                  <b>{d}</b>
                  <span className={c.p}>{cl ? 'Closed' : shortPrice(sup, priceOf(ds))}</span>
                </button>
              );
            })}
            {spans.map(({ b, start, len }) => (
              <button key={b.id} className={`${c.pill} ${c['pill_' + b.status]}`} style={{ left: `calc(${(start / 7) * 100}% + 3px)`, width: `calc(${(len / 7) * 100}% - 6px)` }} onClick={() => onJob(b)}>
                <span className={c.src}>{b.source === 'Asteria' ? 'A' : 'D'}</span>
                <span className={c.name}>{len > 1 ? b.couple : firstName(b.couple)}</span>
              </button>
            ))}
          </div>
        );
      })}
      <div className={c.legend}>
        <span><i className={c.lgEnq} />Enquiry</span><span><i className={c.lgHeld} />Contract sent · tentative</span><span><i className={c.lgDeposit} />Deposit paid</span><span><i className={c.lgBooked} />Fully paid</span><span><i className={c.lgClosed} />Closed</span><span><b>A</b> Asteria · <b>D</b> direct</span>
      </div>
    </div>
  );
  const list = (items: Job[]) => items.map((b) => (
    <button key={b.id} className={s.card} style={{ textAlign: 'left', cursor: 'pointer', border: 0 }} onClick={() => onJob(b)}>
      <div className={s.rowBetween}><Badge j={b} /><span className={s.muted}>{b.source}</span></div>
      <b className={s.h3}>{b.couple}</b>
      <div className={s.rowBetween}><span className={s.muted}>{fmtDate(b.date)}{b.endDate ? ` – ${fmtDate(b.endDate, { day: 'numeric', month: 'short' })}` : ''}</span><span className={s.price}>{b.noQuote ? '—' : gbp(b.total)}</span></div>
    </button>
  ));
  const manage = range && (
    <div className={web ? `${s.card} ${s.manageWeb}` : s.manage}>
      <div className={s.rowBetween}>
        <div><b>Manage calendar</b><p className={s.muted}>{nights} day{nights > 1 ? 's' : ''} · {rangeLabel}</p></div>
        <button className={s.close} onClick={() => setRange(null)} aria-label="Clear selection"><Icon name="close" /></button>
      </div>
      <div className={s.manageGrid}>
        <button onClick={() => setForm('price')}><span>£</span>Edit price</button>
        <button onClick={() => (allClosed ? (setClosed(sel, ''), setRange(null)) : setForm('close'))}><Icon name="close" size={18} />{allClosed ? 'Re-open dates' : 'Close period'}</button>
      </div>
      <div className={s.manageList}>
        <button disabled={selBusy} onClick={() => setForm('quote')}><Icon name="sign" size={18} />Create booking with quote</button>
        <button disabled={selBusy} onClick={() => setForm('noquote')}><Icon name="plus" size={18} />Create booking without quote</button>
      </div>
      {selBusy && <p className={s.muted} style={{ fontSize: '.76rem' }}>Some of these dates are already booked (deposit paid).</p>}
      {!web && <p className={s.muted} style={{ fontSize: '.74rem' }}>Tap another date to select a range.</p>}
    </div>
  );
  const addBtn = <button className={`${s.btn} ${s.btnSm}`} style={{ width: 'auto' }} onClick={() => { if (!range) setRange({ from: `${month}-15`, to: `${month}-15` }); setForm('quote'); }}><Icon name="plus" />Add booking</button>;

  return (
    <>
      <Top title="Calendar" right={web ? <>{monthNav}{addBtn}</> : addBtn} kicker={web ? `${inMonth.length} bookings & enquiries in ${monthLabel(month, true)}` : undefined} />
      {web ? (
        <div className={s.calWeb}>
          <div className={s.body}>{grid}<p className={s.muted}>Click a free date (or two, for a range) to edit prices, close dates or add a booking. Click a booking to open it.</p></div>
          <aside className={s.body}>
            {manage || <div className={s.card}><b className={s.h3}>Select dates</b><p className={s.muted}>Click a date on the calendar, then another to select a range — like a weekend or a holiday.</p></div>}
            <b className={s.h3}>{monthLabel(month, true)} at a glance</b>
            {list(inMonth)}
            {!inMonth.length && <p className={s.muted}>No bookings yet this month.</p>}
          </aside>
        </div>
      ) : (
        <div className={s.body} style={range ? { paddingBottom: 280 } : undefined}>
          <div className={s.seg}><button className={mode === 'month' ? s.on : ''} onClick={() => setMode('month')}>Month</button><button className={mode === 'list' ? s.on : ''} onClick={() => setMode('list')}>Bookings</button></div>
          {monthNav}
          {mode === 'month' ? grid : list(visible.filter((j) => j.date >= TODAY))}
          <p className={s.muted}>Tap a free date (then another for a range) to edit prices, close dates or add a booking.</p>
        </div>
      )}
      {!web && manage}
      {form === 'price' && range && <PriceForm sup={sup} days={sel} start={priceOf(range.from)} onSave={(p) => { setPrices(sel, p); setForm(null); setRange(null); }} onClose={() => setForm(null)} />}
      {form === 'close' && range && <CloseForm label={rangeLabel} onSave={(reason) => { setClosed(sel, reason); setForm(null); setRange(null); }} onClose={() => setForm(null)} />}
      {(form === 'quote' || form === 'noquote') && range && <BookingForm sup={sup} range={range} withQuote={form === 'quote'} onSave={(j) => { addJob(j); setForm(null); setRange(null); setMonth(monthOf(j.date)); }} onClose={() => setForm(null)} />}
    </>
  );
}

function PriceForm({ sup, days, start, onSave, onClose }: { sup: Supplier; days: string[]; start: number; onSave: (p: number) => void; onClose: () => void }) {
  const [v, setV] = useState(start);
  const opts = [...new Set(['2027-06-07', '2027-06-04', '2027-06-06', '2027-06-05'].map((d) => dayPrice(sup, d)))].sort((a, b) => a - b);
  return (
    <Sheet title={`Edit price · ${days.length} day${days.length > 1 ? 's' : ''}`} onClose={onClose}>
      <div className={s.field}><label htmlFor="pp">Price per day{sup.packages[0].perGuest ? ' (per guest)' : ''}</label><input id="pp" inputMode="numeric" className={s.input} value={gbp(v)} onChange={(e) => setV(+e.target.value.replace(/\D/g, '') || 0)} /></div>
      <div className={s.chips} style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>{opts.map((p) => <button key={p} className={`${s.chip} ${v === p ? s.chipOn : ''}`} onClick={() => setV(p)}>{gbp(p)}</button>)}</div>
      <div className={s.sticky}><button className={s.btn} onClick={() => onSave(v)}>Save price</button></div>
    </Sheet>
  );
}

function CloseForm({ label, onSave, onClose }: { label: string; onSave: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('Holiday');
  return (
    <Sheet title={`Close ${label}`} onClose={onClose}>
      <p className={s.muted}>Couples won&rsquo;t be able to enquire for these dates.</p>
      <div className={s.chips} style={{ margin: 0, padding: 0, flexWrap: 'wrap' }}>{['Holiday', 'Maintenance', 'Private event', 'Booked elsewhere', 'Other'].map((r) => <button key={r} className={`${s.chip} ${reason === r ? s.chipOn : ''}`} onClick={() => setReason(r)}>{r}</button>)}</div>
      <div className={s.sticky}><button className={s.btn} onClick={() => onSave(reason)}>Close period</button></div>
    </Sheet>
  );
}

function BookingForm({ sup, range, withQuote, onSave, onClose }: { sup: Supplier; range: Range; withQuote: boolean; onSave: (j: Job) => void; onClose: () => void }) {
  const [g, setG] = useState({ first: '', last: '', partner: '', email: '', phone: '', guests: 100, from: range.from, to: range.to, pid: sup.packages[0].id, deposit: sup.packages[0].deposit, balanceWeeks: 8, cancel: 'standard', security: 0, contract: true, note: '' });
  const pkg = sup.packages.find((p) => p.id === g.pid)!;
  const [total, setTotal] = useState<number | null>(null);
  const t = total ?? pkgTotal(pkg, g.guests);
  const valid = g.first.trim() && g.last.trim();
  const couple = `${g.first.trim() || 'Guest'}${g.partner.trim() ? ` & ${g.partner.trim()}` : ` ${g.last.trim()}`}`;
  const cancelText: Record<string, string> = {
    standard: 'Deposit is non-refundable. Other payments are refundable if cancelled more than 12 weeks before the date.',
    flexible: 'All payments refundable if cancelled more than 8 weeks before the date.',
    strict: 'All payments are non-refundable once the contract is signed.',
  };
  const save = () => {
    if (!valid) return;
    const base = { id: `D-${21000 + Math.floor(Math.random() * 900)}`, couple, date: g.from, endDate: g.to > g.from ? g.to : undefined, guests: g.guests, source: 'Direct' as const, email: g.email || undefined, phone: g.phone ? `+44 ${g.phone}` : undefined, note: g.note || undefined };
    if (!withQuote) onSave({ ...base, pkg: 'Reserved — no quote', total: 0, deposit: 0, paid: 0, status: 'deposit', noQuote: true });
    else onSave({ ...base, pkg: pkg.name, pid: pkg.id, total: t, deposit: g.deposit, paid: g.contract ? 0 : Math.round((t * g.deposit) / 100), status: g.contract ? 'held' : 'deposit', contractDaysAgo: 0, balanceDays: g.balanceWeeks * 7, cancelPolicy: cancelText[g.cancel], securityDeposit: g.security || undefined });
  };
  const set = (x: Partial<typeof g>) => setG((o) => ({ ...o, ...x }));
  return (
    <Sheet title={withQuote ? 'New booking with quote' : 'New booking without quote'} onClose={onClose} wide>
      <div className={s.card}>
        <b className={s.h3}>Dates</b>
        <div className={s.btnRow}>
          <div className={s.field}><label htmlFor="bf">From</label><input id="bf" type="date" className={s.input} value={g.from} onChange={(e) => set({ from: e.target.value, to: e.target.value > g.to ? e.target.value : g.to })} /></div>
          <div className={s.field}><label htmlFor="bt">To</label><input id="bt" type="date" className={s.input} value={g.to} onChange={(e) => set({ to: e.target.value })} /></div>
        </div>
      </div>
      <div className={s.card}>
        <b className={s.h3}>Guest info</b>
        <div className={s.btnRow}>
          <div className={s.field}><label htmlFor="g1">First name*</label><input id="g1" className={s.input} value={g.first} onChange={(e) => set({ first: e.target.value })} /></div>
          <div className={s.field}><label htmlFor="g2">Last name*</label><input id="g2" className={s.input} value={g.last} onChange={(e) => set({ last: e.target.value })} /></div>
        </div>
        <div className={s.field}><label htmlFor="g3">Partner&rsquo;s first name</label><input id="g3" className={s.input} value={g.partner} onChange={(e) => set({ partner: e.target.value })} /></div>
        <div className={s.btnRow}>
          <div className={s.field}><label htmlFor="g4">Email</label><input id="g4" type="email" className={s.input} value={g.email} onChange={(e) => set({ email: e.target.value })} /></div>
          <div className={s.field}><label htmlFor="g5">Phone</label><div className={s.phoneIn}><span>🇬🇧 +44</span><input id="g5" inputMode="tel" className={s.input} value={g.phone} onChange={(e) => set({ phone: e.target.value })} /></div></div>
        </div>
        <div className={s.field}><label htmlFor="g6">Guests: <b>{g.guests}</b></label><input id="g6" type="range" className={s.range} min={10} max={250} step={5} value={g.guests} onChange={(e) => set({ guests: +e.target.value })} /></div>
      </div>
      {withQuote ? (
        <>
          <div className={s.card}>
            <b className={s.h3}>Quote</b>
            <div className={s.field}><label htmlFor="q1">Package</label><select id="q1" className={s.input} value={g.pid} onChange={(e) => { const p = sup.packages.find((x) => x.id === e.target.value)!; set({ pid: p.id, deposit: p.deposit }); setTotal(null); }}>{sup.packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className={s.field}><label htmlFor="q2">Total</label><input id="q2" inputMode="numeric" className={s.input} value={gbp(t)} onChange={(e) => setTotal(+e.target.value.replace(/\D/g, '') || 0)} /></div>
            <p className={s.muted}>Direct booking — no Asteria fee.</p>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Policy</b>
            <div className={s.btnRow}>
              <div className={s.field}><label htmlFor="p1">Deposit at signing</label><select id="p1" className={s.input} value={g.deposit} onChange={(e) => set({ deposit: +e.target.value })}>{[10, 20, 25, 30, 50].map((x) => <option key={x} value={x}>{x}% · {gbp((t * x) / 100)}</option>)}</select></div>
              <div className={s.field}><label htmlFor="p2">Balance due</label><select id="p2" className={s.input} value={g.balanceWeeks} onChange={(e) => set({ balanceWeeks: +e.target.value })}>{[2, 4, 8, 12].map((x) => <option key={x} value={x}>{x} weeks before</option>)}</select></div>
            </div>
            <div className={s.field}><label htmlFor="p3">Cancellation policy</label><select id="p3" className={s.input} value={g.cancel} onChange={(e) => set({ cancel: e.target.value })}><option value="standard">Standard</option><option value="flexible">Flexible</option><option value="strict">Strict</option></select><span className={s.muted} style={{ fontSize: '.78rem' }}>{cancelText[g.cancel]}</span></div>
            <div className={s.field}><label htmlFor="p4">Security deposit</label><select id="p4" className={s.input} value={g.security} onChange={(e) => set({ security: +e.target.value })}><option value={0}>None</option><option value={250}>£250</option><option value={500}>£500</option><option value={1000}>£1,000</option></select></div>
            <label className={s.rowBetween}><span>Send contract now (date held once the deposit is paid)</span><input type="checkbox" checked={g.contract} onChange={(e) => set({ contract: e.target.checked })} className={s.check} /></label>
            {!g.contract && <p className={s.muted} style={{ fontSize: '.78rem' }}>Saved as <b>Deposit paid</b> — use this if they&rsquo;ve already signed and paid you directly.</p>}
          </div>
        </>
      ) : (
        <div className={s.card}>
          <b className={s.h3}>Notes</b>
          <textarea className={s.input} placeholder="e.g. Friend of the family, invoice sent separately" value={g.note} onChange={(e) => set({ note: e.target.value })} />
          <p className={s.muted}>The dates are blocked on your calendar. Add a quote later if you want Asteria to track payments.</p>
        </div>
      )}
      <div className={s.sticky}><button className={s.btn} disabled={!valid} onClick={save}>{withQuote ? (g.contract ? 'Create booking & send contract' : 'Create booking') : 'Create booking'}</button>{!valid && <span className={s.muted} style={{ textAlign: 'center', fontSize: '.78rem' }}>First and last name are required</span>}</div>
    </Sheet>
  );
}

/* ---------------- listing ---------------- */
type Patch = (patch: Partial<Supplier>, msg?: string) => void;

function Listing({ persona, onSwitch, brochure, setBrochure, addons, update, extras, setExtras }: { persona: Persona; onSwitch: () => void; brochure: { name: string; size: number } | null; setBrochure: (b: { name: string; size: number } | null) => void; addons: Addons; update: Patch; extras: Extra[]; setExtras: (x: Extra[]) => void }) {
  const web = useWeb();
  const sup = persona.sup;
  const [editProfile, setEditProfile] = useState(false);
  const [pkgEdit, setPkgEdit] = useState<Package | 'new' | null>(null);
  const views = 600 + sup.reviews * 9;
  const stats = [['Profile views', views.toLocaleString('en-GB'), 'this month'], ['Saved by couples', String(Math.round(views / 11)), 'tapped ♥ this month'], ['Enquiries', String(Math.round(views / 48)), 'this month']];
  const photos = sup.gallery;
  const addPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    const urls = [...files].filter((f) => f.type.startsWith('image/')).map((f) => URL.createObjectURL(f));
    update({ gallery: [...photos, ...urls] }, `${urls.length} photo${urls.length === 1 ? '' : 's'} added`);
  };
  const savePkg = (p: Package) => {
    const exists = sup.packages.some((x) => x.id === p.id);
    update({ packages: exists ? sup.packages.map((x) => (x.id === p.id ? p : x)) : [...sup.packages, p] }, exists ? `${p.name} updated` : `${p.name} added to your listing`);
    setPkgEdit(null);
  };
  const setExtra = (i: number, patch: Partial<Extra>) => setExtras(extras.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <>
      <Top title="Your listing" kicker={web ? 'Edit what couples see — photos, details, packages and extras' : undefined} right={web ? <span style={{ display: 'flex', gap: 6 }}>{addons.featured && <span className={`${s.tag} ${s.tagFeat}`}>★ Featured</span>}{addons.spotlight && <span className={`${s.tag} ${s.tagFeat}`}>Spotlight</span>}<span className={s.tag}>Live on Asteria</span></span> : undefined} />
      <div className={`${s.body} ${s.listGrid}`}>
        <div className={s.autoNote} style={web ? { gridColumn: '1 / -1' } : undefined}><Icon name="edit" size={16} /><span>Preview — edit anything here to see how it works. Changes aren&rsquo;t saved and reset when you reload; saving comes with the full platform.</span></div>
        <div className={s.listMain}>
          <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(sup.img)} alt="" style={{ width: '100%', height: web ? 240 : 150, objectFit: 'cover' }} />
            <div style={{ padding: '0 16px 16px', display: 'grid', gap: 6 }}>
              <div className={s.rowBetween} style={{ alignItems: 'flex-start' }}>
                <b className={s.h3}>{sup.name}{addons.featured && <span className={s.featBadge}>★ Featured</span>}</b>
                <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} style={{ width: 'auto' }} onClick={() => setEditProfile(true)}><Icon name="edit" />Edit details</button>
              </div>
              <span className={s.muted}>{sup.category} · {sup.town}, {sup.region}{sup.capacity ? ` · up to ${sup.capacity} guests` : ''}{sup.travels ? ' · travels UK-wide' : ''} · <span className={s.stars}>★ {sup.rating}</span> ({sup.reviews})</span>
              <p style={{ fontSize: '.9rem', whiteSpace: 'pre-line' }}>{sup.about}</p>
              {!web && <span className={s.tag}>Live on Asteria</span>}
            </div>
          </div>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Photos</b><span className={s.muted} style={{ fontSize: '.76rem' }}>{photos.length} photo{photos.length === 1 ? '' : 's'} · first one is your cover</span></div>
            <div className={s.photoGrid}>
              {photos.map((src, i) => (
                <div key={src + i} className={s.photo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(src)} alt="" />
                  {i === 0 ? <span className={s.coverTag}>Cover</span> : <button className={s.coverBtn} onClick={() => update({ gallery: [src, ...photos.filter((_, k) => k !== i)] }, 'Cover photo changed')}>Make cover</button>}
                  <button className={s.photoX} onClick={() => update({ gallery: photos.filter((_, k) => k !== i) }, 'Photo removed')} aria-label="Remove photo"><Icon name="close" size={14} /></button>
                </div>
              ))}
              <label className={s.photoAdd}>
                <Icon name="plus" size={22} /><span>Add photos</span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
              </label>
            </div>
          </div>
          <div className={s.kpis} style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            {stats.map(([l, v, d]) => <div key={l} className={s.card} style={{ gap: 2, padding: 12 }}><span className={s.muted} style={{ fontSize: '.74rem' }}>{l}</span><b className={s.big} style={{ fontSize: '1.3rem' }}>{v}</b><span className={s.muted} style={{ fontSize: '.7rem' }}>{d}</span></div>)}
          </div>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Brochure</b><span className={s.muted} style={{ fontSize: '.76rem' }}>PDF · up to 20 MB</span></div>
            {brochure ? (
              <div className={s.docRow} style={{ borderTop: 0, padding: 0 }}>
                <span className={s.docIc}><Icon name="layers" size={18} /></span>
                <span className={s.mgmtInfo}><b>{brochure.name}</b><small>{(brochure.size / 1_000_000).toFixed(1)} MB · couples can download it from your listing</small></span>
                <button className={s.link} onClick={() => setBrochure(null)}>Remove</button>
              </div>
            ) : <p className={s.muted}>Add a brochure so couples can download your full prices and details.</p>}
            <label className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} style={{ cursor: 'pointer' }}>
              <Icon name="plus" />{brochure ? 'Replace brochure' : 'Upload brochure'}
              <input type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setBrochure({ name: f.name, size: f.size }); e.target.value = ''; }} />
            </label>
          </div>
          {!web && <button className={`${s.btn} ${s.btnGhost}`} onClick={onSwitch}><Icon name="users" />Preview as another supplier</button>}
        </div>
        <div className={s.listSide}>
          <div className={s.rowBetween}><b className={s.h3}>Packages</b><button className={s.link} onClick={() => setPkgEdit('new')}><Icon name="plus" size={14} /> Add package</button></div>
          {sup.packages.map((p) => (
            <button key={p.id} className={`${s.card} ${s.pkgRow}`} onClick={() => setPkgEdit(p)}>
              <div className={s.rowBetween}><b className={s.h3}>{p.name}</b><span className={s.link}><Icon name="edit" size={15} />Edit</span></div>
              <div className={s.rowBetween}><span className={s.muted}>{p.summary}</span><span className={s.price}>{gbp(p.price)}{p.perGuest ? ' pp' : ''}</span></div>
              <span className={s.muted}>Deposit {p.deposit}%{p.maxGuests ? ` · up to ${p.maxGuests} guests` : ''}{p.hours ? ` · ${p.hours}` : ''} · {p.includes.length} inclusion{p.includes.length === 1 ? '' : 's'}</span>
            </button>
          ))}
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Extras</b><span className={s.muted} style={{ fontSize: '.76rem' }}>Add-ons couples can tick</span></div>
            {extras.map((x, i) => (
              <div key={x.id} className={s.extraEdit}>
                <input className={s.input} value={x.name} onChange={(e) => setExtra(i, { name: e.target.value })} aria-label="Extra name" />
                <input className={s.input} inputMode="numeric" value={gbp(x.price)} onChange={(e) => setExtra(i, { price: +e.target.value.replace(/\D/g, '') || 0 })} aria-label="Price" />
                <label className={s.ppTick}><input type="checkbox" className={s.check} checked={!!x.perGuest} onChange={(e) => setExtra(i, { perGuest: e.target.checked })} />pp</label>
                <button className={s.photoXInline} onClick={() => setExtras(extras.filter((_, k) => k !== i))} aria-label={`Remove ${x.name}`}><Icon name="close" size={14} /></button>
              </div>
            ))}
            <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setExtras([...extras, { id: `x-${Date.now()}`, name: 'New extra', price: 100 }])}><Icon name="plus" />Add an extra</button>
          </div>
        </div>
      </div>
      {editProfile && <ProfileForm sup={sup} onClose={() => setEditProfile(false)} onSave={(patch) => { update(patch, 'Listing details updated'); setEditProfile(false); }} />}
      {pkgEdit && <PackageForm pkg={pkgEdit === 'new' ? null : pkgEdit} sup={sup} canDelete={sup.packages.length > 1} onClose={() => setPkgEdit(null)} onSave={savePkg}
        onDelete={(p) => { update({ packages: sup.packages.filter((x) => x.id !== p.id) }, `${p.name} removed`); setPkgEdit(null); }} />}
    </>
  );
}

function ProfileForm({ sup, onClose, onSave }: { sup: Supplier; onClose: () => void; onSave: (p: Partial<Supplier>) => void }) {
  const [f, setF] = useState({ name: sup.name, town: sup.town, region: sup.region, style: sup.style, capacity: sup.capacity ?? 0, travels: !!sup.travels, about: sup.about });
  const set = (x: Partial<typeof f>) => setF((o) => ({ ...o, ...x }));
  const venue = sup.category === 'Venues';
  return (
    <Sheet title="Edit listing details" onClose={onClose}>
      <div className={s.field}><label htmlFor="pf-n">Business name</label><input id="pf-n" className={s.input} value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="pf-t">Town</label><input id="pf-t" className={s.input} value={f.town} onChange={(e) => set({ town: e.target.value })} /></div>
        <div className={s.field}><label htmlFor="pf-r">Region</label><select id="pf-r" className={s.input} value={f.region} onChange={(e) => set({ region: e.target.value })}>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
      </div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="pf-s">Style</label><select id="pf-s" className={s.input} value={f.style} onChange={(e) => set({ style: e.target.value })}>{styles.map((x) => <option key={x}>{x}</option>)}</select></div>
        {venue
          ? <div className={s.field}><label htmlFor="pf-c">Max guests</label><input id="pf-c" inputMode="numeric" className={s.input} value={f.capacity || ''} onChange={(e) => set({ capacity: +e.target.value.replace(/\D/g, '') || 0 })} /></div>
          : <label className={s.rowBetween} style={{ alignSelf: 'end', minHeight: 48 }}><span>Travel UK-wide</span><input type="checkbox" className={s.check} checked={f.travels} onChange={(e) => set({ travels: e.target.checked })} /></label>}
      </div>
      <div className={s.field}><label htmlFor="pf-a">About — what you offer</label><textarea id="pf-a" className={s.input} style={{ minHeight: 150 }} value={f.about} onChange={(e) => set({ about: e.target.value })} /><span className={s.muted} style={{ fontSize: '.74rem' }}>{f.about.length} characters · shown at the top of your listing</span></div>
      <div className={s.sticky}><button className={s.btn} disabled={!f.name.trim()} onClick={() => onSave({ name: f.name.trim(), town: f.town.trim(), region: f.region, style: f.style, about: f.about.trim(), ...(venue ? { capacity: f.capacity || undefined } : { travels: f.travels }) })}>Save details</button></div>
    </Sheet>
  );
}

function PackageForm({ pkg, sup, canDelete, onClose, onSave, onDelete }: { pkg: Package | null; sup: Supplier; canDelete: boolean; onClose: () => void; onSave: (p: Package) => void; onDelete: (p: Package) => void }) {
  const base = pkg ?? { id: `${sup.id}-p${Date.now()}`, name: '', price: 0, perGuest: !!sup.packages[0]?.perGuest, summary: '', includes: [], deposit: sup.packages[0]?.deposit ?? 25 };
  const [f, setF] = useState({ ...base, includesText: base.includes.join('\n') });
  const [confirm, setConfirm] = useState(false);
  const set = (x: Partial<typeof f>) => setF((o) => ({ ...o, ...x }));
  const valid = f.name.trim() && f.price > 0;
  const save = () => { const { includesText, ...rest } = f; onSave({ ...rest, name: f.name.trim(), summary: f.summary.trim(), includes: includesText.split('\n').map((l) => l.trim()).filter(Boolean), hours: f.hours?.trim() || undefined, maxGuests: f.maxGuests || undefined }); };
  return (
    <Sheet title={pkg ? `Edit ${pkg.name}` : 'Add a package'} onClose={onClose}>
      <div className={s.field}><label htmlFor="pk-n">Package name</label><input id="pk-n" className={s.input} value={f.name} placeholder="e.g. Midweek Package" onChange={(e) => set({ name: e.target.value })} /></div>
      <div className={s.field}><label htmlFor="pk-s">Short description</label><input id="pk-s" className={s.input} value={f.summary} placeholder="e.g. Mon–Thu exclusive use" onChange={(e) => set({ summary: e.target.value })} /></div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="pk-p">Price</label><input id="pk-p" inputMode="numeric" className={s.input} value={f.price ? gbp(f.price) : ''} placeholder="£" onChange={(e) => set({ price: +e.target.value.replace(/\D/g, '') || 0 })} /></div>
        <div className={s.field}><label>Charged</label><div className={s.seg}><button type="button" className={!f.perGuest ? s.on : ''} onClick={() => set({ perGuest: false })}>Flat price</button><button type="button" className={f.perGuest ? s.on : ''} onClick={() => set({ perGuest: true })}>Per guest</button></div></div>
      </div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="pk-d">Deposit to book</label><select id="pk-d" className={s.input} value={f.deposit} onChange={(e) => set({ deposit: +e.target.value })}>{[10, 20, 25, 30, 50].map((x) => <option key={x} value={x}>{x}%</option>)}</select></div>
        <div className={s.field}><label htmlFor="pk-g">Max guests <small className={s.muted}>(optional)</small></label><input id="pk-g" inputMode="numeric" className={s.input} value={f.maxGuests || ''} onChange={(e) => set({ maxGuests: +e.target.value.replace(/\D/g, '') || undefined })} /></div>
      </div>
      <div className={s.field}><label htmlFor="pk-h">Hours / coverage <small className={s.muted}>(optional)</small></label><input id="pk-h" className={s.input} value={f.hours ?? ''} placeholder="e.g. 11am – midnight" onChange={(e) => set({ hours: e.target.value })} /></div>
      <div className={s.field}><label htmlFor="pk-i">What&rsquo;s included <small className={s.muted}>(one per line)</small></label><textarea id="pk-i" className={s.input} style={{ minHeight: 130 }} value={f.includesText} placeholder={'Ceremony room\nTables, chairs & linen\nWedding coordinator'} onChange={(e) => set({ includesText: e.target.value })} /></div>
      {confirm && pkg && (
        <div className={`${s.card} ${s.overCard}`}>
          <b>Remove {pkg.name}?</b>
          <p className={s.muted}>Couples won&rsquo;t see it any more. Existing bookings keep their package.</p>
          <div className={s.btnRow}><button className={`${s.btn} ${s.btnGhost}`} onClick={() => setConfirm(false)}>Keep</button><button className={`${s.btn} ${s.btnDanger}`} onClick={() => onDelete(pkg)}>Remove package</button></div>
        </div>
      )}
      <div className={s.sticky}>
        <button className={s.btn} disabled={!valid} onClick={save}>{pkg ? 'Save changes' : 'Add package'}</button>
        {pkg && canDelete && !confirm && <button className={`${s.btn} ${s.btnGhost} ${s.btnDangerGhost}`} onClick={() => setConfirm(true)}>Remove package</button>}
        {!valid && <span className={s.muted} style={{ textAlign: 'center', fontSize: '.78rem' }}>Add a name and a price</span>}
      </div>
    </Sheet>
  );
}
