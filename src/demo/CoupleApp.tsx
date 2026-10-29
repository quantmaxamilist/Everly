'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import A from '@/components/A';
import { asset } from '@/lib/site';
import { Shell, Top, Sheet, Toast, Stars, GuestSlider, saveEnquiry, useWeb } from './ui';
import { suppliers, categories, catIcon, catOne, regions, styles, sampleWeddings, boards, gbp, fmtDate, pkgTotal, unavailable, reviewsFor, daysBetween, TODAY, type Category, type Supplier, type Package, type Wedding, type Board } from './data';
import s from './app.module.css';

type Tab = 'home' | 'explore' | 'inspo' | 'saved' | 'plan' | 'settings';
type Ref = { sid: string; pid: string };
type PlanItem = Ref & { status: 'Shortlisted' | 'Enquiry sent' };
type Plan = { id: string; name: string; items: PlanItem[] };
type Filters = { region: string; maxPrice: number; style: string; fits: boolean; available: boolean };
type Suggestion = { from: PlanItem; to: Ref; total: number; saving: number; rating: number; same: boolean };

const find = (r: Ref) => { const sup = suppliers.find((x) => x.id === r.sid)!; return { sup, pkg: sup.packages.find((p) => p.id === r.pid)! }; };
const isFree = (x: Supplier, date: string) => !unavailable(x).has(date);
const planTotal = (p: Plan, guests: number) => p.items.reduce((t, i) => t + pkgTotal(find(i).pkg, guests), 0);
const keywordCats: [RegExp, Category][] = [[/venue|house|barn|hall/i, 'Venues'], [/photo/i, 'Photographers'], [/food|cater|menu|dinner/i, 'Catering'], [/flower|florist|floral/i, 'Florists'], [/band|dj|music|quartet/i, 'Music'], [/cake/i, 'Cakes'], [/hair|make-?up/i, 'Hair & make-up']];
let planSeq = 2;

export default function CoupleApp() {
  const [created, setCreated] = useState(false);
  const [w, setW] = useState<Wedding>(sampleWeddings[0]);
  const [tab, setTab] = useState<Tab>('home');
  const [cat, setCat] = useState<Category>('Venues');
  const [f, setF] = useState<Filters>({ region: 'Cotswolds', maxPrice: 10000, style: '', fits: true, available: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [cmp, setCmp] = useState<Ref[]>([]);
  const [plans, setPlans] = useState<Plan[]>([{ id: 'p1', name: 'Our wedding plan', items: [] }]);
  const [activePlan, setActivePlan] = useState('p1');
  const [picker, setPicker] = useState<Ref | null>(null);
  const [enq, setEnq] = useState<Ref | null>(null);
  const [sent, setSent] = useState<Ref | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [flags, setFlags] = useState({ filtered: false, compared: false, ai: false });

  useEffect(() => { window.scrollTo(0, 0); }, [created, tab, view, sent, board]);

  const matches = (x: Supplier, c: Category, ff: Filters) => x.category === c
    && (!ff.region || x.region === ff.region || !!x.travels)
    && x.fromPrice <= (x.packages[0].perGuest ? ff.maxPrice / 50 : ff.maxPrice)
    && (!ff.style || x.style === ff.style)
    && (!ff.fits || !x.capacity || x.capacity >= w.guests)
    && (!ff.available || isFree(x, w.date));
  const results = useMemo(() => suppliers.filter((x) => matches(x, cat, f)).sort((a, b) => b.rating - a.rating), [cat, f, w]); // eslint-disable-line react-hooks/exhaustive-deps

  const plan = plans.find((p) => p.id === activePlan) ?? plans[0];
  const total = planTotal(plan, w.guests);
  const days = Math.max(0, daysBetween(TODAY, w.date));
  const inCmp = (r: Ref) => cmp.some((c) => c.pid === r.pid);
  const plansWith = (pid: string) => plans.filter((p) => p.items.some((i) => i.pid === pid));
  const toggleCmp = (r: Ref) => {
    if (inCmp(r)) { setCmp((c) => c.filter((x) => x.pid !== r.pid)); return; }
    const next = [...cmp.slice(-1), r];
    setCmp(next);
    setToast(next.length === 2 ? 'Two packages ready to compare' : 'Added to compare — pick one more');
  };
  const toggleSaved = (id: string) => {
    const on = saved.includes(id);
    setSaved((x) => (on ? x.filter((y) => y !== id) : [...x, id]));
    setToast(on ? 'Removed from saved' : `${suppliers.find((x) => x.id === id)!.name} saved ♥`);
  };
  const togglePlanItem = (planId: string, r: Ref) => {
    const p = plans.find((x) => x.id === planId)!;
    const has = p.items.some((i) => i.pid === r.pid);
    setPlans((ps) => ps.map((x) => (x.id !== planId ? x : has
      ? { ...x, items: x.items.filter((i) => i.pid !== r.pid) }
      : { ...x, items: [...x.items.filter((i) => find(i).sup.category !== find(r).sup.category), { ...r, status: 'Shortlisted' }] })));
    setToast(has ? `Removed from ${p.name}` : `${find(r).pkg.name} added to ${p.name}`);
  };
  const removeItem = (planId: string, pid: string) => setPlans((ps) => ps.map((x) => (x.id === planId ? { ...x, items: x.items.filter((i) => i.pid !== pid) } : x)));
  const newPlan = (name?: string) => {
    const id = `p${planSeq++}`;
    setPlans((ps) => [...ps, { id, name: name || `Plan ${String.fromCharCode(64 + ps.length + 1)}`, items: [] }]);
    setActivePlan(id);
    return id;
  };
  const swap = (from: PlanItem, to: Ref) => {
    setPlans((ps) => ps.map((x) => (x.id === plan.id ? { ...x, items: x.items.map((i) => (i.pid === from.pid ? { ...to, status: 'Shortlisted' } : i)) } : x)));
    setFlags((x) => ({ ...x, ai: true }));
  };
  const loadExample = () => {
    const items: PlanItem[] = [];
    for (const c of categories) {
      const opts = suppliers.filter((x) => x.category === c && (x.region === w.region || x.travels) && (!x.capacity || x.capacity >= w.guests) && isFree(x, w.date))
        .flatMap((x) => x.packages.filter((p) => !p.maxGuests || p.maxGuests >= w.guests).map((p) => ({ sid: x.id, pid: p.id, t: pkgTotal(p, w.guests) })));
      const top = opts.sort((a, b) => b.t - a.t)[0];
      if (top) items.push({ sid: top.sid, pid: top.pid, status: 'Shortlisted' });
    }
    setPlans((ps) => ps.map((x) => (x.id === plan.id ? { ...x, name: x.items.length ? x.name : 'Dream wedding', items } : x)));
    setToast('Example plan loaded — every top-tier package');
  };
  const goTab = (t: Tab) => { setView(null); setSent(null); setBoard(null); setTab(t); };
  const explore = (c: Category) => { setCat(c); goTab('explore'); };
  const applyFilters = (ff: Filters) => { setF(ff); setFlags((x) => ({ ...x, filtered: true })); };
  const openCompare = () => { goTab('saved'); if (cmp.length === 2) setFlags((x) => ({ ...x, compared: true })); };

  const anyPlanned = plans.some((p) => p.items.length > 0);
  const steps = [
    { label: 'Create a sample wedding — date, location & budget', done: created },
    { label: 'Browse suppliers and filter by your needs', done: flags.filtered },
    { label: 'Save a favourite with the ♥', done: saved.length > 0 },
    { label: 'Compare two packages side by side', done: flags.compared },
    { label: 'Add a package to one of your plans', done: anyPlanned },
    { label: 'Ask AI to find savings in a plan', done: flags.ai },
    { label: 'Send a booking request', done: !!sent || plans.some((p) => p.items.some((i) => i.status === 'Enquiry sent')) },
  ];

  const viewSup = view ? suppliers.find((x) => x.id === view)! : null;
  const viewBoard = board ? boards.find((b) => b.id === board)! : null;
  const recommended = categories.slice(1).map((c) => suppliers.filter((x) => matches(x, c, { ...f, region: w.region, style: '', available: false })).sort((a, b) => b.rating - a.rating)[0]).filter(Boolean).slice(0, 4) as Supplier[];
  const initials = w.names.split(/\s*&\s*/).map((n) => n.trim()[0] || '').join('');
  const card = (x: Supplier, showCat?: boolean) => <SupplierCard key={x.id} x={x} w={w} onClick={() => setView(x.id)} saved={saved.includes(x.id)} onSave={() => toggleSaved(x.id)} showCat={showCat} />;
  const avatar = <button className={s.avatar} style={{ border: 0, cursor: 'pointer' }} onClick={() => goTab('settings')} aria-label="Wedding settings">{initials}</button>;

  return (
    <Shell<Tab>
      side="Couple" title="Build your wedding" intro="Try the couple side: set up a sample wedding, save and compare suppliers, build plans and send a booking request." steps={steps}
      other={{ label: 'Switch to the supplier preview', to: '/supplier-preview' }}
      search="Search venues, photographers, florists…"
      account={{ initials: created ? initials : '·', name: created ? w.names : 'New wedding', sub: created ? fmtDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' }) : undefined }}
      toolbar={created ? <GuestSlider value={w.guests} onChange={(g) => setW({ ...w, guests: g })} /> : undefined}
      nav={{
        items: [
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'explore', label: 'Explore', icon: 'search' },
          { id: 'inspo', label: 'Inspiration', icon: 'sparkle' },
          { id: 'saved', label: 'Saved & compare', appLabel: 'Saved', icon: 'heart', count: saved.length || undefined },
          { id: 'plan', label: 'My plans', icon: 'checkbox', count: plan.items.length || undefined },
          { id: 'settings', label: 'Settings', icon: 'edit', appHidden: true },
        ],
        active: sent ? null : viewSup ? 'explore' : tab, onChange: goTab, hideInApp: !created || !!sent, disabled: !created,
      }}
    >
      {!created ? (
        <Setup w={w} setW={setW} onDone={() => { setCreated(true); setF((x) => ({ ...x, region: w.region })); }} />
      ) : sent ? (
        <Sent r={sent} w={w} onBack={() => goTab('plan')} />
      ) : viewSup ? (
        <SupplierView key={viewSup.id} sup={viewSup} w={w} cat={cat} onCat={explore} onBack={() => setView(null)}
          saved={saved.includes(viewSup.id)} onSave={() => toggleSaved(viewSup.id)}
          inCmp={inCmp} toggleCmp={toggleCmp} cmpCount={cmp.length} onCompare={openCompare}
          plansWith={plansWith} onPlan={setPicker} onEnquire={setEnq} />
      ) : (
        <>
          {tab === 'home' && <Home w={w} days={days} plan={plan} plans={plans} total={total} recommended={recommended} card={card} avatar={avatar} onPlan={() => goTab('plan')} onExplore={explore} onInspo={(id) => { setTab('inspo'); setBoard(id); }} onAI={() => { goTab('plan'); setAiOpen(true); }} />}
          {tab === 'explore' && <Explore cat={cat} setCat={setCat} f={f} w={w} results={results} card={card} onFilters={() => setFilterOpen(true)} applyFilters={applyFilters} count={(c) => suppliers.filter((x) => matches(x, c, f)).length} />}
          {tab === 'inspo' && (viewBoard
            ? <BoardView b={viewBoard} w={w} card={card} onBack={() => setBoard(null)} onExplore={(b) => { setCat('Venues'); applyFilters({ ...f, region: b.match.region, style: b.match.style, fits: true }); goTab('explore'); }} />
            : <Inspo onOpen={setBoard} />)}
          {tab === 'saved' && <Saved saved={saved} card={card} cmp={cmp} w={w} onRemoveCmp={(r) => setCmp((c) => c.filter((x) => x.pid !== r.pid))} onPlan={setPicker} plansWith={plansWith} onExplore={() => goTab('explore')} onSeenCompare={() => setFlags((x) => ({ ...x, compared: true }))} />}
          {tab === 'plan' && <Plans plans={plans} plan={plan} w={w} total={total} setActive={setActivePlan} newPlan={() => newPlan()}
            rename={(name) => setPlans((ps) => ps.map((x) => (x.id === plan.id ? { ...x, name } : x)))}
            remove={() => { if (plans.length > 1) { setPlans((ps) => ps.filter((x) => x.id !== plan.id)); setActivePlan(plans.find((x) => x.id !== plan.id)!.id); setToast(`${plan.name} deleted`); } }}
            removeItem={(pid) => { removeItem(plan.id, pid); setToast('Removed from plan'); }} onEnquire={setEnq} onExplore={explore} onAI={() => setAiOpen(true)} onExample={loadExample} onSettings={() => goTab('settings')} />}
          {tab === 'settings' && <Settings w={w} setW={setW} onReset={() => { setCreated(false); setPlans([{ id: 'p1', name: 'Our wedding plan', items: [] }]); setActivePlan('p1'); setSaved([]); setCmp([]); setTab('home'); }} />}
        </>
      )}

      {filterOpen && (
        <Sheet title="Filters" onClose={() => setFilterOpen(false)}>
          <FilterForm f={f} w={w} onChange={setF} />
          <button className={s.btn} onClick={() => { setFilterOpen(false); applyFilters(f); }}>Show {results.length} results</button>
        </Sheet>
      )}
      {picker && <PlanPicker r={picker} plans={plans} w={w} toggle={(id) => togglePlanItem(id, picker)} onNew={(name) => { const id = newPlan(name); setPlans((ps) => ps.map((x) => (x.id === id ? { ...x, items: [{ ...picker, status: 'Shortlisted' }] } : x))); setToast(`Added to ${name || 'new plan'}`); }} onClose={() => setPicker(null)} />}
      {aiOpen && <AISavings plan={plan} w={w} total={total} onSwap={(from, to) => { swap(from, to); setToast(`Swapped to ${find(to).sup.name}`); }} onApply={(list) => { list.forEach((x) => swap(x.from, x.to)); setAiOpen(false); setToast(`${list.length} swap${list.length > 1 ? 's' : ''} applied to ${plan.name}`); }} onClose={() => setAiOpen(false)} />}
      {enq && <Enquiry r={enq} w={w} onClose={() => setEnq(null)} onSend={(payload) => {
        saveEnquiry(payload);
        setPlans((ps) => ps.map((p) => (p.id === plan.id && !p.items.some((x) => x.pid === enq.pid)
          ? { ...p, items: [...p.items.filter((i) => find(i).sup.category !== find(enq).sup.category), { ...enq, status: 'Enquiry sent' }] }
          : { ...p, items: p.items.map((x) => (x.pid === enq.pid ? { ...x, status: 'Enquiry sent' } : x)) })));
        setSent(enq); setEnq(null); setView(null);
      }} />}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </Shell>
  );
}

/* ---------------- setup & settings ---------------- */
function WeddingForm({ w, setW }: { w: Wedding; setW: (v: Wedding) => void }) {
  return (
    <>
      <div className={s.field}><label htmlFor="n">Your names</label><input id="n" className={s.input} value={w.names} onChange={(e) => setW({ ...w, names: e.target.value })} /></div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="d">Wedding date</label><input id="d" type="date" className={s.input} value={w.date} onChange={(e) => setW({ ...w, date: e.target.value })} /></div>
        <div className={s.field}><label htmlFor="r">Location</label><select id="r" className={s.input} value={w.region} onChange={(e) => setW({ ...w, region: e.target.value })}>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
      </div>
      <div className={s.field}><label htmlFor="g">Guests: <b>{w.guests}</b></label><input id="g" type="range" className={s.range} min={20} max={250} step={5} value={w.guests} onChange={(e) => setW({ ...w, guests: +e.target.value })} /></div>
      <div className={s.field}>
        <label htmlFor="b">Budget: <b>{gbp(w.budget)}</b></label>
        <input id="bs" type="range" className={s.range} min={5000} max={100000} step={500} value={w.budget} onChange={(e) => setW({ ...w, budget: +e.target.value })} aria-label="Budget slider" />
        <input id="b" inputMode="numeric" className={s.input} value={gbp(w.budget)} onChange={(e) => setW({ ...w, budget: +e.target.value.replace(/\D/g, '') || 0 })} />
      </div>
    </>
  );
}

function Setup({ w, setW, onDone }: { w: Wedding; setW: (v: Wedding) => void; onDone: () => void }) {
  const web = useWeb();
  const presets = (
    <div className={s.presetWrap}>
      <span className={s.muted}>Start from a sample wedding</span>
      <div className={s.presets}>
        {sampleWeddings.map((x) => (
          <button key={x.names} className={`${s.preset} ${w.names === x.names && w.date === x.date ? s.presetOn : ''}`} onClick={() => setW({ names: x.names, date: x.date, region: x.region, guests: x.guests, budget: x.budget })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(x.img)} alt="" />
            <span><b>{x.names}</b><small>{x.blurb}</small><small>{x.region} · {x.guests} guests · {gbp(x.budget)}</small></span>
          </button>
        ))}
      </div>
    </div>
  );
  if (web) {
    return (
      <div className={s.setupWeb}>
        <div className={s.setupArt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('/images/hero.jpg')} alt="" />
          <div><p className={s.kicker}>Welcome</p><h1>Let&rsquo;s set up <em>your wedding</em></h1><p>Pick a sample wedding or enter your own details. You can change any of this later in Settings.</p></div>
        </div>
        <div className={s.card} style={{ padding: 28, gap: 18 }}>
          {presets}
          <div className={s.hr} />
          <WeddingForm w={w} setW={setW} />
          <button className={s.btn} onClick={onDone}>Create our wedding <Icon name="arrow" /></button>
        </div>
      </div>
    );
  }
  return (
    <>
      <Top />
      <div className={s.body}>
        <div><h2 style={{ fontSize: '1.9rem' }}>Let&rsquo;s set up <em>your wedding</em></h2><p className={s.muted}>Pick a sample or enter your own. You can change any of this later.</p></div>
        {presets}
        <WeddingForm w={w} setW={setW} />
        <div className={s.sticky}><button className={s.btn} onClick={onDone}>Create our wedding <Icon name="arrow" /></button></div>
      </div>
    </>
  );
}

function Settings({ w, setW, onReset }: { w: Wedding; setW: (v: Wedding) => void; onReset: () => void }) {
  return (
    <>
      <Top title="Settings" kicker="Your wedding details — changes update prices and budgets everywhere" />
      <div className={`${s.body} ${s.narrow}`}>
        <div className={s.card} style={{ gap: 16 }}>
          <b className={s.h3}>Wedding details</b>
          <WeddingForm w={w} setW={setW} />
        </div>
        <div className={s.card}>
          <b className={s.h3}>Notifications</b>
          {['New messages from suppliers', 'Payment reminders', 'Price drops on saved suppliers'].map((l, i) => (
            <label key={l} className={s.rowBetween}><span>{l}</span><input type="checkbox" defaultChecked={i < 2} className={s.check} /></label>
          ))}
        </div>
        <button className={`${s.btn} ${s.btnGhost}`} onClick={onReset}>Start the preview again</button>
      </div>
    </>
  );
}

/* ---------------- home ---------------- */
function Home({ w, days, plan, plans, total, recommended, card, avatar, onPlan, onExplore, onInspo, onAI }: { w: Wedding; days: number; plan: Plan; plans: Plan[]; total: number; recommended: Supplier[]; card: (x: Supplier, showCat?: boolean) => React.ReactNode; avatar: React.ReactNode; onPlan: () => void; onExplore: (c: Category) => void; onInspo: (id: string) => void; onAI: () => void }) {
  const web = useWeb();
  const next = categories.find((c) => !plan.items.some((p) => find(p).sup.category === c));
  const over = total > w.budget;
  return (
    <>
      <Top right={avatar} />
      <div className={s.body}>
        <div>
          <p className={s.muted}>Your wedding</p>
          <h2 className={s.pageTitle}>{w.names}</h2>
        </div>
        <div className={s.homeTop}>
          <div className={s.cardDark}>
            <div className={s.rowBetween}><span className={s.muted}>{fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><span className={s.tag}>{w.region}</span></div>
            <p className={s.big}>{days} days to go</p>
            <p className={s.muted}>{w.guests} guests</p>
          </div>
          <BudgetCard total={total} budget={w.budget} label={plan.name} onAI={onAI} />
          {web && next && (
            <div className={s.card}>
              <span className={s.h3}>Next step</span>
              <p className={s.muted}>Find your {catOne[next]} for {plan.name}.</p>
              <button className={s.btn} onClick={() => onExplore(next)}><Icon name={catIcon[next]} />Find {next.toLowerCase()}</button>
            </div>
          )}
        </div>
        {over && !web && <button className={`${s.btn} ${s.btnWarn}`} onClick={onAI}><Icon name="sparkle" />Find savings with AI</button>}
        <div className={s.card}>
          <div className={s.rowBetween}><span className={s.h3}>{plan.name}{plans.length > 1 ? <span className={s.muted} style={{ fontFamily: 'var(--f-body)', fontSize: '.8rem' }}> · 1 of {plans.length} plans</span> : null}</span><button className={s.link} onClick={onPlan}>Open plans</button></div>
          <div className={s.planCats}>
            {categories.map((c) => {
              const item = plan.items.find((p) => find(p).sup.category === c);
              return (
                <button key={c} className={`${s.planCat} ${item ? s.planCatOn : ''}`} onClick={() => onExplore(c)}>
                  <span className={s.planIc}><Icon name={item ? 'check' : catIcon[c]} size={18} /></span>
                  <span className={s.planTxt}><b>{item ? find(item).sup.name : c}</b><small>{item ? item.status : 'Explore →'}</small></span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={s.rowBetween}><span className={s.h3}>Get inspired</span></div>
        <div className={s.boardStrip}>
          {boards.map((b) => (
            <button key={b.id} className={s.boardMini} onClick={() => onInspo(b.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(b.imgs[0])} alt="" /><span>{b.name}</span>
            </button>
          ))}
        </div>
        {recommended.length > 0 && (
          <>
            <div className={s.rowBetween}><span className={s.h3}>Popular for {w.region} weddings</span></div>
            <div className={s.resGrid}>{recommended.map((x) => card(x, true))}</div>
          </>
        )}
      </div>
    </>
  );
}

function BudgetCard({ total, budget, label, onAI }: { total: number; budget: number; label: string; onAI?: () => void }) {
  const over = total > budget;
  return (
    <div className={`${s.card} ${over ? s.overCard : ''}`}>
      <div className={s.rowBetween}><span className={s.h3}>Budget</span>{over ? <span className={`${s.tag} ${s.tagOver}`}>Over budget</span> : <span className={s.muted}>{label}</span>}</div>
      <p className={s.big} style={{ fontSize: '1.7rem' }}>{gbp(total)} <span className={s.muted} style={{ fontFamily: 'var(--f-body)', fontSize: '.85rem' }}>of {gbp(budget)}</span></p>
      <div className={`${s.bar} ${over ? s.barOver : ''}`}><span style={{ width: `${Math.min(100, (total / Math.max(1, budget)) * 100)}%` }} /></div>
      {over
        ? <p className={s.overTxt}><Icon name="down" size={14} /> {gbp(total - budget)} over budget{onAI && <> · <button className={s.link} onClick={onAI}>Find savings with AI</button></>}</p>
        : <p className={s.muted}>{total ? `${gbp(budget - total)} left to allocate` : 'Add suppliers to see your budget build up.'}</p>}
    </div>
  );
}

/* ---------------- explore ---------------- */
function FilterForm({ f, w, onChange }: { f: Filters; w: Wedding; onChange: (f: Filters) => void }) {
  return (
    <>
      <div className={s.field}><label htmlFor="fr">Location</label>
        <select id="fr" className={s.input} value={f.region} onChange={(e) => onChange({ ...f, region: e.target.value })}><option value="">Anywhere</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
      <div className={s.field}><label htmlFor="fp">Max price {gbp(f.maxPrice)}</label>
        <input id="fp" type="range" className={s.range} min={1000} max={12000} step={250} value={f.maxPrice} onChange={(e) => onChange({ ...f, maxPrice: +e.target.value })} /></div>
      <div className={s.field}><label>Style</label>
        <div className={s.chips} style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>{['', ...styles].map((st) => <button key={st || 'any'} className={`${s.chip} ${f.style === st ? s.chipOn : ''}`} onClick={() => onChange({ ...f, style: st })}>{st || 'Any'}</button>)}</div></div>
      <label className={s.rowBetween}><span>Fits my {w.guests} guests</span><input type="checkbox" checked={f.fits} onChange={(e) => onChange({ ...f, fits: e.target.checked })} className={s.check} /></label>
      <label className={s.rowBetween}><span>Available on {fmtDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span><input type="checkbox" checked={f.available} onChange={(e) => onChange({ ...f, available: e.target.checked })} className={s.check} /></label>
    </>
  );
}

function CatBar({ cat, onCat, count, back }: { cat: Category | null; onCat: (c: Category) => void; count?: (c: Category) => number; back?: () => void }) {
  const web = useWeb();
  return (
    <div className={s.chips}>
      {back && <button className={s.chip} onClick={back}><Icon name="arrow" size={15} className={s.flip} />Results</button>}
      {categories.map((c) => <button key={c} className={`${s.chip} ${c === cat ? s.chipOn : ''}`} onClick={() => onCat(c)}><Icon name={catIcon[c]} />{c}{web && count && <span className={s.chipN}>{count(c)}</span>}</button>)}
    </div>
  );
}

function Explore({ cat, setCat, f, w, results, card, onFilters, applyFilters, count }: { cat: Category; setCat: (c: Category) => void; f: Filters; w: Wedding; results: Supplier[]; card: (x: Supplier) => React.ReactNode; onFilters: () => void; applyFilters: (f: Filters) => void; count: (c: Category) => number }) {
  const web = useWeb();
  const label = `${results.length} ${results.length === 1 ? catOne[cat] : cat.toLowerCase()} match${results.length === 1 ? 'es' : ''} your wedding`;
  const list = (
    <>
      <div className={s.resGrid}>{results.map((x) => card(x))}</div>
      {!results.length && <div className={s.card}><p>No matches — try widening your filters.</p><button className={`${s.btn} ${s.btnGhost}`} onClick={() => applyFilters({ region: '', maxPrice: 12000, style: '', fits: false, available: false })}>Clear filters</button></div>}
    </>
  );
  if (web) {
    return (
      <>
        <Top title="Explore suppliers" kicker={`${w.names} · ${w.region} · ${w.guests} guests`} />
        <CatBar cat={cat} onCat={setCat} count={count} />
        <div className={s.explore}>
          <aside className={`${s.card} ${s.filterPanel}`}>
            <div className={s.rowBetween}><b className={s.h3}>Filters</b><button className={s.link} onClick={() => applyFilters({ region: w.region, maxPrice: 10000, style: '', fits: true, available: false })}>Reset</button></div>
            <FilterForm f={f} w={w} onChange={applyFilters} />
          </aside>
          <div className={s.body}><p className={s.muted}>{label}</p>{list}</div>
        </div>
      </>
    );
  }
  return (
    <>
      <Top title="Explore" right={<button className={s.chip} onClick={onFilters}><Icon name="filter" />Filters</button>} />
      <div className={s.body}>
        <CatBar cat={cat} onCat={setCat} />
        <div className={s.chips}>
          <span className={s.chip}><Icon name="pin" />{f.region || 'Anywhere'}</span>
          {f.fits && <span className={s.chip}><Icon name="users" />{w.guests}+ guests</span>}
          {f.available && <span className={s.chip}><Icon name="calendar" />Free {fmtDate(w.date, { day: 'numeric', month: 'short' })}</span>}
          {f.style && <span className={s.chip}>{f.style}</span>}
        </div>
        <p className={s.muted}>{label}</p>
        {list}
      </div>
    </>
  );
}

function Heart({ on, onClick, big }: { on: boolean; onClick: () => void; big?: boolean }) {
  return (
    <button className={`${s.heart} ${on ? s.heartOn : ''} ${big ? s.heartBig : ''}`} onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={on ? 'Remove from saved' : 'Save'} aria-pressed={on}>
      <svg viewBox="0 0 24 24" width={big ? 20 : 17} height={big ? 20 : 17} aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" /></svg>
    </button>
  );
}

function SupplierCard({ x, w, onClick, showCat, saved, onSave }: { x: Supplier; w: { date: string; guests: number }; onClick: () => void; showCat?: boolean; saved: boolean; onSave: () => void }) {
  const booked = !isFree(x, w.date);
  return (
    <div className={s.sCard} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className={s.sImg}><img src={asset(x.img)} alt="" /><Heart on={saved} onClick={onSave} /></span>
      <span className={s.sInfo}>
        {showCat && <span className={s.sMeta} style={{ textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '.66rem' }}>{x.category}</span>}
        <b>{x.name}</b>
        <span className={s.sMeta}>{x.town}, {x.region}{x.capacity ? ` · up to ${x.capacity}` : ''}{x.travels ? ' · travels UK-wide' : ''}</span>
        <span className={s.stars}>★ {x.rating.toFixed(1)} <span className={s.sMeta}>({x.reviews})</span></span>
        <span className={s.price}>From {gbp(x.fromPrice)}{x.packages[0].perGuest ? ' / guest' : ''}</span>
        {booked ? <span className={`${s.tag} ${s.tagWarn}`}>Booked on your date</span> : <span className={s.tag}>Available {fmtDate(w.date, { day: 'numeric', month: 'short' })}</span>}
      </span>
    </div>
  );
}

/* ---------------- supplier page ---------------- */
function SupplierView({ sup, w, cat, onCat, onBack, saved, onSave, inCmp, toggleCmp, cmpCount, onCompare, plansWith, onPlan, onEnquire }: { sup: Supplier; w: Wedding; cat: Category; onCat: (c: Category) => void; onBack: () => void; saved: boolean; onSave: () => void; inCmp: (r: Ref) => boolean; toggleCmp: (r: Ref) => void; cmpCount: number; onCompare: () => void; plansWith: (pid: string) => Plan[]; onPlan: (r: Ref) => void; onEnquire: (r: Ref) => void }) {
  const web = useWeb();
  const [pick, setPick] = useState(sup.packages[0].id);
  const picked = sup.packages.find((p) => p.id === pick)!;
  const free = isFree(sup, w.date);
  const reviews = reviewsFor(sup, 3);
  const head = (
    <div className={s.rowBetween} style={{ alignItems: 'flex-start' }}>
      <div>
        <span className={s.tag}>{sup.category}</span>
        <h2 className={s.pageTitle} style={{ marginTop: 8 }}>{sup.name}</h2>
        <p className={s.muted}>{sup.town}, {sup.region} · <span className={s.stars}>★ {sup.rating.toFixed(1)}</span> ({sup.reviews} reviews){sup.capacity ? ` · up to ${sup.capacity} guests` : ''}{sup.travels ? ' · travels UK-wide' : ''}</p>
      </div>
      <Heart on={saved} onClick={onSave} big />
    </div>
  );
  const pkgs = (
    <>
      <div className={s.rowBetween}><span className={s.h3}>Packages</span><span className={s.muted}>Prices for {w.guests} guests</span></div>
      <div className={s.pkgGrid}>
        {sup.packages.map((p) => (
          <PackageCard key={p.id} p={p} w={w} selected={pick === p.id} onSelect={() => setPick(p.id)} cmp={inCmp({ sid: sup.id, pid: p.id })} onCmp={() => toggleCmp({ sid: sup.id, pid: p.id })} inPlans={plansWith(p.id)} onPlan={() => onPlan({ sid: sup.id, pid: p.id })} />
        ))}
      </div>
    </>
  );
  const revs = (
    <div className={s.card}>
      <div className={s.rowBetween}><span className={s.h3}>Reviews</span><span className={s.stars}>★ {sup.rating.toFixed(1)} · {sup.reviews}</span></div>
      {reviews.map((r) => (
        <div key={r.text} className={s.review}>
          <div className={s.rowBetween}><b>{r.by}</b><span className={s.muted}>{r.when}</span></div>
          <Stars n={r.stars} />
          <p>“{r.text}”</p>
        </div>
      ))}
    </div>
  );
  const avail = free ? <span className={s.tag}>Available {fmtDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className={`${s.tag} ${s.tagWarn}`}>Booked on {fmtDate(w.date, { day: 'numeric', month: 'short' })} — ask about other dates</span>;
  const bar = <CatBar cat={sup.category === cat ? cat : sup.category} onCat={onCat} back={onBack} />;

  if (web) {
    return (
      <>
        {bar}
        <div className={s.gallery}>
          {sup.gallery.slice(0, 3).map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={g + i} src={asset(g)} alt="" />
          ))}
        </div>
        <div className={s.svGrid}>
          <div className={s.body}>
            {head}
            <p>{sup.about}</p>
            {pkgs}
            {revs}
          </div>
          <aside className={`${s.card} ${s.svAside}`}>
            <span className={s.muted}>Selected package</span>
            <b className={s.h3}>{picked.name}</b>
            <span className={s.big} style={{ fontSize: '2rem' }}>{gbp(pkgTotal(picked, w.guests))}</span>
            <span className={s.muted}>{picked.perGuest ? `${gbp(picked.price)} per guest × ${w.guests}` : picked.summary} · {picked.deposit}% deposit</span>
            {avail}
            <button className={s.btn} onClick={() => onEnquire({ sid: sup.id, pid: pick })}>Send booking request <Icon name="arrow" /></button>
            <button className={`${s.btn} ${s.btnGhost}`} onClick={() => onPlan({ sid: sup.id, pid: pick })}><Icon name="plus" />{plansWith(pick).length ? `In ${plansWith(pick).map((x) => x.name).join(', ')}` : 'Add to a plan'}</button>
            {cmpCount > 0 && <button className={`${s.btn} ${s.btnGhost}`} onClick={onCompare}><Icon name="compare" />Compare ({cmpCount}/2)</button>}
            <p className={s.muted} style={{ fontSize: '.78rem' }}>Nothing is charged until {sup.name} accepts and you sign the contract.</p>
          </aside>
        </div>
      </>
    );
  }
  return (
    <>
      <div className={s.svBar}>{bar}</div>
      <div className={s.body} style={{ paddingTop: 0 }}>
        <div style={{ margin: '0 -20px', height: 200, position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(sup.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {head}
        {avail}
        <p style={{ fontSize: '.92rem' }}>{sup.about}</p>
        {pkgs}
        {revs}
        <div className={s.sticky}>
          {cmpCount > 0 && <button className={`${s.btn} ${s.btnGhost}`} onClick={onCompare}><Icon name="compare" />Compare ({cmpCount}/2)</button>}
          <button className={s.btn} onClick={() => onEnquire({ sid: sup.id, pid: pick })}>Enquire about {picked.name} <Icon name="arrow" /></button>
        </div>
      </div>
    </>
  );
}

function PackageCard({ p, w, selected, onSelect, cmp, onCmp, inPlans, onPlan }: { p: Package; w: { guests: number }; selected: boolean; onSelect: () => void; cmp: boolean; onCmp: () => void; inPlans: Plan[]; onPlan: () => void }) {
  const added = inPlans.length > 0;
  return (
    <div className={s.card} style={{ border: `1.5px solid ${selected ? 'var(--olive)' : 'transparent'}`, cursor: 'pointer' }} onClick={onSelect}>
      <div className={s.rowBetween}><b className={s.h3}>{p.name}</b><span className={s.price}>{gbp(pkgTotal(p, w.guests))}</span></div>
      <p className={s.muted}>{p.summary}{p.perGuest ? ` · ${gbp(p.price)} per guest` : ''}</p>
      <ul className={s.ticks}>{p.includes.map((i) => <li key={i}><Icon name="check" />{i}</li>)}</ul>
      <div className={s.btnRow}>
        <button className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} style={cmp ? { background: 'var(--sage)' } : undefined} onClick={(e) => { e.stopPropagation(); onCmp(); }}><Icon name={cmp ? 'check' : 'compare'} />{cmp ? 'Comparing' : 'Compare'}</button>
        <button className={`${s.btn} ${s.btnSm} ${added ? s.btnGhost : ''}`} style={added ? { background: 'var(--sage)' } : undefined} onClick={(e) => { e.stopPropagation(); onPlan(); }}><Icon name={added ? 'check' : 'plus'} />{added ? (inPlans.length > 1 ? `In ${inPlans.length} plans` : 'In plan') : 'Add to plan'}</button>
      </div>
    </div>
  );
}

/* ---------------- plan picker ---------------- */
function PlanPicker({ r, plans, w, toggle, onNew, onClose }: { r: Ref; plans: Plan[]; w: Wedding; toggle: (planId: string) => void; onNew: (name: string) => void; onClose: () => void }) {
  const { sup, pkg } = find(r);
  const [name, setName] = useState('');
  return (
    <Sheet title="Add to which plan?" onClose={onClose}>
      <div className={s.card} style={{ gridTemplateColumns: '56px 1fr', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(sup.img)} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
        <div><b className={s.h3}>{pkg.name}</b><p className={s.muted}>{sup.name} · {gbp(pkgTotal(pkg, w.guests))}</p></div>
      </div>
      <p className={s.muted}>Tick a plan to add it, untick to take it out.</p>
      {plans.map((p) => {
        const on = p.items.some((i) => i.pid === r.pid);
        const clash = !on && p.items.find((i) => find(i).sup.category === sup.category);
        return (
          <label key={p.id} className={`${s.card} ${s.pickRow} ${on ? s.pickOn : ''}`}>
            <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className={s.check} />
            <span><b>{p.name}</b><small>{gbp(planTotal(p, w.guests))} · {p.items.length} supplier{p.items.length === 1 ? '' : 's'}{clash ? ` · replaces ${find(clash).sup.name}` : ''}</small></span>
          </label>
        );
      })}
      <div className={s.btnRow} style={{ gridTemplateColumns: '1fr auto' }}>
        <input className={s.input} placeholder="New plan name, e.g. Country house wedding" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={`${s.btn} ${s.btnGhost}`} style={{ width: 'auto' }} onClick={() => { onNew(name.trim()); setName(''); }}><Icon name="plus" />New plan</button>
      </div>
      <button className={s.btn} onClick={onClose}>Done</button>
    </Sheet>
  );
}

/* ---------------- inspiration ---------------- */
function Inspo({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <>
      <Top title="Inspiration" kicker="Mood boards to find your style — tap one to see suppliers that fit" />
      <div className={s.body}>
        <div className={s.boardGrid}>
          {boards.map((b) => (
            <button key={b.id} className={s.boardCard} onClick={() => onOpen(b.id)}>
              <span className={s.boardCollage}>
                {b.imgs.slice(0, 3).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src + i} src={asset(src)} alt="" />
                ))}
              </span>
              <span className={s.boardSw}>{b.palette.map(([n, c]) => <i key={n} style={{ background: c }} title={n} />)}</span>
              <b>{b.name}</b>
              <small>{b.blurb}</small>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function BoardView({ b, w, card, onBack, onExplore }: { b: Board; w: Wedding; card: (x: Supplier, showCat?: boolean) => React.ReactNode; onBack: () => void; onExplore: (b: Board) => void }) {
  const fits = categories.map((c) => suppliers.filter((x) => x.category === c && (b.match.regions.includes(x.region) || (x.travels && b.match.styles.includes(x.style))) && b.match.styles.includes(x.style)).sort((a, z) => z.rating - a.rating)[0]).filter(Boolean) as Supplier[];
  return (
    <>
      <Top onBack={onBack} title={`${b.name} wedding`} kicker="Mood board" />
      <div className={s.body}>
        <p className={s.muted}>{b.blurb}</p>
        <div className={s.mood}>
          {b.imgs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src + i} src={asset(src)} alt="" className={s[`m${i}`]} />
          ))}
          <div className={s.moodPal}>{b.palette.map(([n, c]) => <span key={n}><i style={{ background: c }} />{n}<small>{c}</small></span>)}</div>
          <div className={s.moodWords}>{b.words.map((x) => <span key={x}>{x}</span>)}</div>
        </div>
        <div className={s.card}>
          <b className={s.h3}>Ideas to steal</b>
          <ul className={s.ticks}>{b.ideas.map((i) => <li key={i}><Icon name="sparkle" />{i}</li>)}</ul>
        </div>
        <button className={s.btn} onClick={() => onExplore(b)}>Find {b.name.toLowerCase()} venues <Icon name="arrow" /></button>
        <div className={s.rowBetween}><span className={s.h3}>Suppliers that fit this style</span><span className={s.muted}>Prices for {w.guests} guests</span></div>
        <div className={s.resGrid}>{fits.map((x) => card(x, true))}</div>
      </div>
    </>
  );
}

/* ---------------- saved & compare ---------------- */
function Saved({ saved, card, cmp, w, onRemoveCmp, onPlan, plansWith, onExplore, onSeenCompare }: { saved: string[]; card: (x: Supplier, showCat?: boolean) => React.ReactNode; cmp: Ref[]; w: Wedding; onRemoveCmp: (r: Ref) => void; onPlan: (r: Ref) => void; plansWith: (pid: string) => Plan[]; onExplore: () => void; onSeenCompare: () => void }) {
  const web = useWeb();
  const [seg, setSeg] = useState<'saved' | 'compare'>(cmp.length === 2 ? 'compare' : 'saved');
  useEffect(() => { if (seg === 'compare' && cmp.length === 2) onSeenCompare(); }, [seg, cmp.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const segs = <div className={s.seg}><button className={seg === 'saved' ? s.on : ''} onClick={() => setSeg('saved')}>Saved ({saved.length})</button><button className={seg === 'compare' ? s.on : ''} onClick={() => setSeg('compare')}>Compare ({cmp.length}/2)</button></div>;
  return (
    <>
      <Top title={web ? 'Saved & compare' : 'Saved'} right={web ? <div style={{ minWidth: 280 }}>{segs}</div> : undefined} kicker="Your favourites, and two packages side by side" />
      <div className={s.body}>
        {!web && segs}
        {seg === 'saved' ? (
          saved.length ? <div className={s.resGrid}>{saved.map((id) => card(suppliers.find((x) => x.id === id)!, true))}</div>
            : <div className={s.card}><p className={s.h3}>Nothing saved yet</p><p className={s.muted}>Tap the ♥ on any supplier to save it here and compare later.</p><button className={s.btn} onClick={onExplore}>Explore suppliers</button></div>
        ) : <Compare cmp={cmp} w={w} onRemove={onRemoveCmp} onPlan={onPlan} plansWith={plansWith} onExplore={onExplore} />}
      </div>
    </>
  );
}

function Compare({ cmp, w, onRemove, onPlan, plansWith, onExplore }: { cmp: Ref[]; w: Wedding; onRemove: (r: Ref) => void; onPlan: (r: Ref) => void; plansWith: (pid: string) => Plan[]; onExplore: () => void }) {
  const items = cmp.map(find);
  if (items.length < 2) {
    return (
      <div className={`${s.card} ${s.narrow}`}>
        <p className={s.h3}>Pick two packages to compare</p>
        <p className={s.muted}>Open any supplier and tap <b>Compare</b> on two packages — from the same supplier or two different ones.</p>
        <p className={s.muted}>{items.length}/2 selected{items[0] ? `: ${items[0].sup.name} — ${items[0].pkg.name}` : ''}</p>
        <button className={s.btn} onClick={onExplore}>Explore suppliers</button>
      </div>
    );
  }
  const totals = items.map((x) => pkgTotal(x.pkg, w.guests));
  const diff = Math.abs(totals[0] - totals[1]);
  const cheaper = totals[0] <= totals[1] ? 0 : 1;
  const L = ['A', 'B'];
  return (
    <>
      <div className={s.cmpSummary}>{diff ? <>Option {L[cheaper]} is <b>{gbp(diff)} cheaper</b> than Option {L[1 - cheaper]}</> : <>Both options cost the same</>}</div>
      <div className={s.cmpGrid}>
        {items.map(({ sup, pkg }, i) => {
          const t = totals[i];
          const inP = plansWith(pkg.id);
          const rows: [string, string][] = [
            ['Price', gbp(t)], ['Deposit to book', `${pkg.deposit}% · ${gbp((t * pkg.deposit) / 100)}`], ['Coverage', pkg.hours || '—'],
            ['Max guests', pkg.maxGuests ? String(pkg.maxGuests) : sup.capacity ? String(sup.capacity) : '—'], ['Share of budget', `${Math.round((t / w.budget) * 100)}%`],
            ['Your date', isFree(sup, w.date) ? 'Available' : 'Booked'],
          ];
          return (
            <div key={pkg.id} className={`${s.card} ${s.cmpCol} ${i ? s.cmpB : s.cmpA}`}>
              <span className={s.cmpLabel}>Option {L[i]}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(sup.img)} alt="" className={s.cmpImg} />
              <span className={s.muted} style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>{sup.category}</span>
              <b className={s.h3} style={{ lineHeight: 1.2 }}>{sup.name}</b>
              <span className={s.muted}>{pkg.name}</span>
              <span className={s.big} style={{ fontSize: '1.6rem' }}>{gbp(t)}</span>
              {i === cheaper && diff > 0 && <span className={s.tag}>Lower price</span>}
              <ul className={s.cmpRows}>{rows.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}</ul>
              <span className={s.muted} style={{ fontWeight: 500 }}>What&rsquo;s included</span>
              <ul className={s.ticks}>{pkg.includes.map((inc) => <li key={inc}><Icon name="check" />{inc}</li>)}</ul>
              <div className={s.cmpFoot}>
                <button className={`${s.btn} ${inP.length ? s.btnGhost : ''}`} onClick={() => onPlan({ sid: sup.id, pid: pkg.id })}><Icon name={inP.length ? 'check' : 'plus'} />{inP.length ? `Option ${L[i]} in ${inP.length > 1 ? `${inP.length} plans` : inP[0].name}` : `Add Option ${L[i]} to a plan`}</button>
                <button className={s.link} onClick={() => onRemove({ sid: sup.id, pid: pkg.id })}>Remove from compare</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- plans ---------------- */
function Plans({ plans, plan, w, total, setActive, newPlan, rename, remove, removeItem, onEnquire, onExplore, onAI, onExample, onSettings }: { plans: Plan[]; plan: Plan; w: Wedding; total: number; setActive: (id: string) => void; newPlan: () => void; rename: (n: string) => void; remove: () => void; removeItem: (pid: string) => void; onEnquire: (r: Ref) => void; onExplore: (c: Category) => void; onAI: () => void; onExample: () => void; onSettings: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(plan.name);
  useEffect(() => { setDraft(plan.name); setEditing(false); }, [plan.id, plan.name]);
  const missing = categories.filter((c) => !plan.items.some((p) => find(p).sup.category === c));
  const over = total > w.budget;
  const save = () => { if (draft.trim()) rename(draft.trim()); setEditing(false); };
  return (
    <>
      <Top title="My plans" kicker={`${w.names} · ${fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      <div className={s.body}>
        <div className={s.planTabs}>
          {plans.map((p) => <button key={p.id} className={`${s.planTab} ${p.id === plan.id ? s.planTabOn : ''}`} onClick={() => setActive(p.id)}>{p.name}<small>{gbp(planTotal(p, w.guests))}</small></button>)}
          <button className={`${s.planTab} ${s.planTabNew}`} onClick={newPlan}><Icon name="plus" size={16} />New plan</button>
        </div>
        <div className={s.planHead}>
          {editing ? (
            <form className={s.renameRow} onSubmit={(e) => { e.preventDefault(); save(); }}>
              <input className={s.input} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus aria-label="Plan name" />
              <button className={s.btn} style={{ width: 'auto' }}>Save</button>
            </form>
          ) : (
            <h2 className={s.pageTitle} style={{ fontSize: '1.7rem' }}>{plan.name} <button className={s.iconBtn} onClick={() => setEditing(true)} aria-label="Rename plan"><Icon name="edit" size={16} /></button></h2>
          )}
          {plans.length > 1 && !editing && <button className={s.link} onClick={remove}>Delete plan</button>}
        </div>
        <div className={s.planGrid}>
          <div className={s.planSum}>
            <div className={`${s.cardDark} ${over ? s.cardOver : ''}`}>
              <div className={s.rowBetween}><span className={s.muted}>Plan total · {w.guests} guests</span>{over && <span className={`${s.tag} ${s.tagOver}`}>Over budget</span>}</div>
              <p className={s.big}>{gbp(total)}</p>
              <div className={s.bar}><span style={{ width: `${Math.min(100, (total / Math.max(1, w.budget)) * 100)}%` }} /></div>
              {over ? <b className={s.overBig}>{gbp(total - w.budget)} over your {gbp(w.budget)} budget</b> : <span className={s.muted}>{gbp(w.budget - total)} left of {gbp(w.budget)}</span>}
              <button className={s.linkLight} onClick={onSettings}>Change budget</button>
              {plan.items.length > 0 && (
                <ul className={s.lines} style={{ marginTop: 6 }}>
                  {plan.items.map((p) => { const { sup, pkg } = find(p); return <li key={p.pid}><span>{sup.category}</span><span>{gbp(pkgTotal(pkg, w.guests))}</span></li>; })}
                </ul>
              )}
            </div>
            {plan.items.length > 0 && (
              <div className={`${s.card} ${s.aiCard} ${over ? s.aiHot : ''}`}>
                <b className={s.h3}><Icon name="sparkle" size={18} /> Find savings with AI</b>
                <p className={s.muted}>{over ? `Tell us what you love and AI will suggest swaps to get you back under budget.` : 'See where cheaper suppliers could free up budget — keep the things you love.'}</p>
                <button className={`${s.btn} ${over ? s.btnWarn : ''}`} onClick={onAI}><Icon name="sparkle" />Find savings</button>
              </div>
            )}
          </div>
          <div className={s.planList}>
            {!plan.items.length && (
              <div className={s.card}>
                <p className={s.h3}>Nothing in {plan.name} yet</p>
                <p className={s.muted}>Add packages from any supplier page, or load an example plan to try the budget tools.</p>
                <div className={s.btnRow}><button className={s.btn} onClick={() => onExplore('Venues')}>Explore suppliers</button><button className={`${s.btn} ${s.btnGhost}`} onClick={onExample}>Load example plan</button></div>
              </div>
            )}
            {plan.items.map((p) => {
              const { sup, pkg } = find(p);
              return (
                <div key={p.pid} className={`${s.card} ${s.planItem}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(sup.img)} alt="" />
                  <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                    <div className={s.rowBetween}><span className={s.tag}>{sup.category}</span><span className={`${s.status} ${p.status === 'Enquiry sent' ? s.stNew : s.stHeld}`}>{p.status}</span></div>
                    <b className={s.h3}>{sup.name}</b>
                    <div className={s.rowBetween}><span className={s.muted}>{pkg.name}</span><span className={s.price}>{gbp(pkgTotal(pkg, w.guests))}</span></div>
                  </div>
                  <div className={s.planItemActs}>
                    {p.status === 'Shortlisted' && <button className={`${s.btn} ${s.btnSm}`} onClick={() => onEnquire({ sid: p.sid, pid: p.pid })}>Send enquiry</button>}
                    <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} onClick={() => removeItem(p.pid)}><Icon name="close" />Remove</button>
                  </div>
                </div>
              );
            })}
            {missing.length > 0 && plan.items.length > 0 && (
              <div className={s.card}>
                <span className={s.h3}>Still to find</span>
                <div className={s.chips} style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
                  {missing.map((c) => <button key={c} className={s.chip} onClick={() => onExplore(c)}><Icon name={catIcon[c]} />{c}</button>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- AI savings (preview — rule-based on sample data) ---------------- */
function alternatives(item: PlanItem, w: Wedding): Suggestion[] {
  const { sup, pkg } = find(item);
  const cur = pkgTotal(pkg, w.guests);
  const out: Suggestion[] = [];
  for (const x of suppliers) {
    if (x.category !== sup.category || !(x.region === w.region || x.travels || x.id === sup.id) || (x.capacity && x.capacity < w.guests) || !isFree(x, w.date)) continue;
    for (const p of x.packages) {
      if (p.id === pkg.id || (p.maxGuests && p.maxGuests < w.guests)) continue;
      const t = pkgTotal(p, w.guests);
      if (t < cur * 0.95) out.push({ from: item, to: { sid: x.id, pid: p.id }, total: t, saving: cur - t, rating: x.rating, same: x.id === sup.id });
    }
  }
  const byRating = [...out].sort((a, b) => b.rating - a.rating || b.saving - a.saving);
  const biggest = [...out].sort((a, b) => b.saving - a.saving)[0];
  const picks = [byRating[0], biggest].filter(Boolean) as Suggestion[];
  return picks.filter((x, i) => picks.findIndex((y) => y.to.pid === x.to.pid) === i);
}

function AISavings({ plan, w, total, onSwap, onApply, onClose }: { plan: Plan; w: Wedding; total: number; onSwap: (from: PlanItem, to: Ref) => void; onApply: (list: Suggestion[]) => void; onClose: () => void }) {
  const [keep, setKeep] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState<'ask' | 'thinking' | 'done'>('ask');
  const noted = keywordCats.filter(([re]) => re.test(note)).map(([, c]) => c);
  const kept = (i: PlanItem) => keep.includes(i.pid) || noted.includes(find(i).sup.category);
  const over = total - w.budget;
  const [res, setRes] = useState<{ per: Suggestion[][]; best: Suggestion[] }>({ per: [], best: [] });
  const run = () => {
    setPhase('thinking');
    const per = plan.items.filter((i) => !kept(i)).map((i) => alternatives(i, w)).filter((x) => x.length);
    const firsts = per.map((x) => [...x].sort((a, b) => (b.rating >= 4.7 ? 1 : 0) - (a.rating >= 4.7 ? 1 : 0) || b.saving - a.saving)[0]).sort((a, b) => b.saving - a.saving);
    const best: Suggestion[] = [];
    let left = over;
    for (const sgg of firsts) { if (over > 0 && left <= 0) break; best.push(sgg); left -= sgg.saving; if (over <= 0 && best.length >= 2) break; }
    setRes({ per, best });
    setTimeout(() => setPhase('done'), 1100);
  };
  const bestSaving = res.best.reduce((t, x) => t + x.saving, 0);
  return (
    <Sheet title="Find savings with AI" onClose={onClose} wide>
      {phase === 'ask' && (
        <>
          <div className={`${s.card} ${over > 0 ? s.overCard : ''}`}>
            <b className={s.h3}>{plan.name}: {gbp(total)} of {gbp(w.budget)}</b>
            <p className={over > 0 ? s.overTxt : s.muted}>{over > 0 ? `${gbp(over)} over budget` : `${gbp(-over)} under budget`}</p>
          </div>
          <b className={s.h3}>What do you want to keep?</b>
          <p className={s.muted}>Tap the things you love — AI won&rsquo;t touch them.</p>
          {plan.items.map((i) => {
            const { sup, pkg } = find(i);
            const on = kept(i);
            return (
              <button key={i.pid} className={`${s.card} ${s.keepRow} ${on ? s.keepOn : ''}`} onClick={() => setKeep((k) => (k.includes(i.pid) ? k.filter((x) => x !== i.pid) : [...k, i.pid]))}>
                <span className={s.keepIc}><Icon name={on ? 'heart' : 'plus'} size={16} /></span>
                <span><b>{sup.name}</b><small>{sup.category} · {pkg.name} · {gbp(pkgTotal(pkg, w.guests))}</small></span>
                <span className={s.muted}>{on ? 'Keep' : 'Can change'}</span>
              </button>
            );
          })}
          <div className={s.field}><label htmlFor="ain">Anything else that matters to you?</label><textarea id="ain" className={s.input} placeholder="e.g. We love the venue and the photographer, happy to compromise on flowers" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {noted.length > 0 && <p className={s.muted}>Got it — keeping your {noted.map((c) => catOne[c]).join(', ')}.</p>}
          <div className={s.sticky}><button className={s.btn} onClick={run}><Icon name="sparkle" />Find savings</button></div>
        </>
      )}
      {phase === 'thinking' && (
        <div className={s.thinking}><span className={s.spinner} /><b>Comparing {suppliers.length} suppliers for {fmtDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' })}…</b><p className={s.muted}>Checking prices for {w.guests} guests, availability and reviews</p></div>
      )}
      {phase === 'done' && (
        <>
          {res.best.length ? (
            <div className={`${s.cardDark} ${over > bestSaving ? s.cardOver : ''}`}>
              <span className={s.muted}>AI suggestion</span>
              <b style={{ fontFamily: 'var(--f-display)', fontSize: '1.35rem', lineHeight: 1.25 }}>
                Swap {res.best.length} supplier{res.best.length > 1 ? 's' : ''} to save {gbp(bestSaving)}{over > 0 ? (bestSaving >= over ? ` — you'd be ${gbp(bestSaving - over)} under budget` : ` — still ${gbp(over - bestSaving)} over`) : ''}
              </b>
              <ul className={s.lines}>{res.best.map((x) => <li key={x.to.pid}><span>{find(x.from).sup.name} → {find(x.to).sup.name}{x.same ? ` (${find(x.to).pkg.name})` : ''}</span><b>−{gbp(x.saving)}</b></li>)}</ul>
              <button className={`${s.btn} ${s.btnLight}`} onClick={() => onApply(res.best)}>Apply these swaps</button>
            </div>
          ) : <div className={s.card}><b className={s.h3}>No cheaper matches found</b><p className={s.muted}>Try un-keeping something, or widen your location in Settings.</p></div>}
          {res.per.map((opts) => {
            const { sup, pkg } = find(opts[0].from);
            return (
              <div key={opts[0].from.pid} className={s.card}>
                <span className={s.muted}>Instead of <b>{sup.name}</b> · {pkg.name} · {gbp(pkgTotal(pkg, w.guests))}</span>
                {opts.map((o) => {
                  const t = find(o.to);
                  return (
                    <div key={o.to.pid} className={s.altRow}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset(t.sup.img)} alt="" />
                      <span><b>{o.same ? `${t.pkg.name} (same supplier)` : t.sup.name}</b><small>{t.pkg.name} · ★ {o.rating.toFixed(1)} · free on your date</small></span>
                      <span className={s.altSave}>−{gbp(o.saving)}<small>{gbp(o.total)}</small></span>
                      <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} style={{ width: 'auto' }} onClick={() => { onSwap(o.from, o.to); onClose(); }}>Swap</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <p className={s.muted} style={{ fontSize: '.76rem' }}>Preview: suggestions use the sample suppliers in this demo. The live version will use real prices and availability.</p>
          <button className={`${s.btn} ${s.btnGhost}`} onClick={() => setPhase('ask')}>Change what to keep</button>
        </>
      )}
    </Sheet>
  );
}

/* ---------------- enquiry ---------------- */
export type EnquiryPayload = { couple: string; date: string; guests: number; supplier: string; sid: string; pkg: string; pid: string; total: number; deposit: number; message: string; phone: string; sentAt: string };

function Enquiry({ r, w, onClose, onSend }: { r: Ref; w: Wedding; onClose: () => void; onSend: (p: EnquiryPayload) => void }) {
  const { sup } = find(r);
  const [pid, setPid] = useState(r.pid);
  const pkg = sup.packages.find((p) => p.id === pid)!;
  const [guests, setGuests] = useState(w.guests);
  const [date, setDate] = useState(w.date);
  const [phone, setPhone] = useState('07700 900123');
  const [msg, setMsg] = useState(`Hi ${sup.name}! We're getting married on ${fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })} with around ${w.guests} guests and love the ${pkg.name} package. Is the date available, and could we arrange a call?`);
  const total = pkgTotal(pkg, guests);
  return (
    <Sheet title="Booking request" onClose={onClose}>
      <div className={s.card} style={{ gridTemplateColumns: '64px 1fr', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(sup.img)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }} />
        <div><b className={s.h3}>{sup.name}</b><p className={s.muted}>{sup.town}, {sup.region}</p></div>
      </div>
      <div className={s.field}><label htmlFor="ep">Package</label><select id="ep" className={s.input} value={pid} onChange={(e) => setPid(e.target.value)}>{sup.packages.map((p) => <option key={p.id} value={p.id}>{p.name} — {gbp(pkgTotal(p, guests))}</option>)}</select></div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="ed">Date</label><input id="ed" type="date" className={s.input} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className={s.field}><label htmlFor="eg">Guests</label><input id="eg" inputMode="numeric" className={s.input} value={guests} onChange={(e) => setGuests(+e.target.value.replace(/\D/g, '') || 0)} /></div>
      </div>
      <div className={s.field}><label htmlFor="eph">Phone</label><input id="eph" className={s.input} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className={s.field}><label htmlFor="em">Message</label><textarea id="em" className={s.input} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
      <div className={s.card}>
        <ul className={s.lines}>
          <li><span>{pkg.name}</span><b>{gbp(total)}</b></li>
          <li className={s.muted}><span>Deposit when you sign ({pkg.deposit}%)</span><span>{gbp((total * pkg.deposit) / 100)}</span></li>
        </ul>
        <p className={s.muted}>Nothing is charged now. {sup.name} will hold the date and send their contract; you pay the deposit when you sign.</p>
      </div>
      <div className={s.sticky}><button className={s.btn} onClick={() => onSend({ couple: w.names, date, guests, supplier: sup.name, sid: sup.id, pkg: pkg.name, pid: pkg.id, total, deposit: pkg.deposit, message: msg, phone, sentAt: new Date().toISOString() })}>Send request <Icon name="arrow" /></button></div>
    </Sheet>
  );
}

function Sent({ r, w, onBack }: { r: Ref; w: Wedding; onBack: () => void }) {
  const { sup, pkg } = find(r);
  const steps = [['Request sent', 'Just now', true], [`${sup.name} holds the date & sends a contract`, 'Usually within 48 hours', false], ['Sign & pay your deposit', `${pkg.deposit}% to secure the date`, false], ['Pay the balance', '8 weeks before the wedding', false]] as const;
  return (
    <>
      <Top />
      <div className={`${s.body} ${s.narrow}`}>
        <div className={s.cardDark} style={{ justifyItems: 'start' }}>
          <span className={s.avatar} style={{ background: 'var(--champagne)', color: 'var(--olive-ink)' }}><Icon name="check" size={18} /></span>
          <p className={s.big} style={{ fontSize: '1.7rem' }}>Request sent to {sup.name}</p>
          <p className={s.muted}>{pkg.name} · {fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className={s.card}>
          {steps.map(([t, d, done], i) => (
            <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span className={s.avatar} style={{ width: 28, height: 28, flexShrink: 0, background: done ? 'var(--olive)' : 'var(--sage)', color: done ? '#fff' : 'var(--olive-dark)', fontSize: '.75rem' }}>{done ? <Icon name="check" size={14} /> : i + 1}</span>
              <div><b style={{ fontWeight: 500 }}>{t}</b><p className={s.muted}>{d}</p></div>
            </div>
          ))}
        </div>
        <div className={s.btnRow}>
          <button className={`${s.btn} ${s.btnGhost}`} onClick={onBack}>Back to my plans</button>
          <A to={`/supplier-preview?as=${sup.id}`} className={s.btn}>See what {sup.name.length > 18 ? 'the supplier' : sup.name} sees <Icon name="arrow" /></A>
        </div>
      </div>
    </>
  );
}
