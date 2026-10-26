'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import A from '@/components/A';
import { asset } from '@/lib/site';
import { Shell, Top, Sheet, Toast, Tabs, saveEnquiry } from './ui';
import { suppliers, categories, regions, styles, gbp, fmtDate, pkgTotal, type Category, type Supplier, type Package } from './data';
import s from './app.module.css';

type Tab = 'home' | 'explore' | 'compare' | 'plan';
type PlanItem = { sid: string; pid: string; status: 'Shortlisted' | 'Enquiry sent' };
type Ref = { sid: string; pid: string };
const find = (r: Ref) => { const sup = suppliers.find((x) => x.id === r.sid)!; return { sup, pkg: sup.packages.find((p) => p.id === r.pid)! }; };
const catIcon: Record<Category, string> = { Venues: 'home', Photographers: 'sparkle', Catering: 'layers', Florists: 'leaf', Music: 'bell' };

export default function CoupleApp() {
  const [created, setCreated] = useState(false);
  const [w, setW] = useState({ names: 'Sophie & James', date: '2027-06-12', region: 'Cotswolds', guests: 110, budget: 25000 });
  const [tab, setTab] = useState<Tab>('home');
  const [cat, setCat] = useState<Category>('Venues');
  const [f, setF] = useState({ region: 'Cotswolds', maxPrice: 10000, style: '', fits: true, available: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [cmp, setCmp] = useState<Ref[]>([]);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [enq, setEnq] = useState<Ref | null>(null);
  const [sent, setSent] = useState<Ref | null>(null);
  const [toast, setToast] = useState('');
  const [flags, setFlags] = useState({ filtered: false, compared: false });

  const results = useMemo(() => suppliers.filter((x) => x.category === cat
    && (!f.region || x.region === f.region || cat === 'Music')
    && x.fromPrice <= (x.packages[0].perGuest ? f.maxPrice / 50 : f.maxPrice)
    && (!f.style || x.style === f.style)
    && (!f.fits || !x.capacity || x.capacity >= w.guests)
    && (!f.available || !(x.unavailable || []).includes(w.date))), [cat, f, w]);

  const planTotal = plan.reduce((t, i) => t + pkgTotal(find(i).pkg, w.guests), 0);
  const days = Math.max(0, Math.round((new Date(w.date).getTime() - new Date('2026-10-26').getTime()) / 864e5));
  const inCmp = (r: Ref) => cmp.some((c) => c.pid === r.pid);
  const toggleCmp = (r: Ref) => {
    setCmp((c) => (inCmp(r) ? c.filter((x) => x.pid !== r.pid) : [...c.slice(-1), r]));
    if (!inCmp(r)) setToast(cmp.length >= 1 ? 'Two packages ready to compare' : 'Added to compare — pick one more');
  };
  const addToPlan = (r: Ref) => {
    setPlan((p) => [...p.filter((x) => find(x).sup.category !== find(r).sup.category), { ...r, status: 'Shortlisted' }]);
    setToast(`${find(r).pkg.name} added to your plan`);
  };
  const steps = [
    { label: 'Create a sample wedding — date, location & budget', done: created },
    { label: 'Browse suppliers and filter by your needs', done: flags.filtered },
    { label: 'Compare two packages and their prices', done: flags.compared },
    { label: 'Add your favourite to the wedding plan', done: plan.length > 0 },
    { label: 'Send an enquiry / booking request', done: !!sent || plan.some((p) => p.status === 'Enquiry sent') },
  ];

  const viewSup = view ? suppliers.find((x) => x.id === view)! : null;

  return (
    <Shell side="Couple" title="Build your wedding" intro="Try the couple side: set up a sample wedding, find and compare suppliers, then send a booking request." steps={steps} other={{ label: 'Switch to the supplier preview', to: '/supplier-preview' }}>
      {!created ? (
        <Setup w={w} setW={setW} onDone={() => { setCreated(true); setF((x) => ({ ...x, region: w.region })); }} />
      ) : sent ? (
        <Sent r={sent} w={w} onBack={() => { setSent(null); setTab('plan'); }} />
      ) : viewSup ? (
        <SupplierView sup={viewSup} w={w} inCmp={inCmp} toggleCmp={toggleCmp} cmpCount={cmp.length} onCompare={() => { setView(null); setTab('compare'); if (cmp.length === 2) setFlags((x) => ({ ...x, compared: true })); }} addToPlan={addToPlan} inPlan={(pid) => plan.some((p) => p.pid === pid)} onEnquire={(r) => setEnq(r)} onBack={() => setView(null)} />
      ) : (
        <>
          {tab === 'home' && (
            <>
              <Top right={<span className={s.avatar}>{w.names.split(/\s*&\s*/).map((n) => n[0]).join('')}</span>} />
              <div className={s.body}>
                <div>
                  <p className={s.muted}>Your wedding</p>
                  <h2 style={{ fontSize: '1.9rem' }}>{w.names}</h2>
                </div>
                <div className={s.cardDark}>
                  <div className={s.rowBetween}><span className={s.muted}>{fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><span className={s.tag}>{w.region}</span></div>
                  <p className={s.big}>{days} days to go</p>
                  <p className={s.muted}>{w.guests} guests</p>
                </div>
                <div className={s.card}>
                  <div className={s.rowBetween}><span className={s.h3}>Budget</span><span className={s.muted}>{gbp(planTotal)} of {gbp(w.budget)}</span></div>
                  <div className={s.bar}><span style={{ width: `${Math.min(100, (planTotal / w.budget) * 100)}%` }} /></div>
                  <p className={s.muted}>{plan.length ? `${gbp(w.budget - planTotal)} left to allocate` : 'Add suppliers to see your budget build up.'}</p>
                </div>
                <div className={s.card}>
                  <div className={s.rowBetween}><span className={s.h3}>Your plan</span><button className={s.link} onClick={() => setTab('plan')}>View all</button></div>
                  {categories.map((c) => {
                    const item = plan.find((p) => find(p).sup.category === c);
                    return (
                      <button key={c} className={s.rowBetween} style={{ border: 0, background: 'none', padding: '6px 0', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setCat(c); setTab('explore'); }}>
                        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name={item ? 'checkbox' : catIcon[c]} size={20} />{item ? find(item).sup.name : `Find ${c.toLowerCase()}`}</span>
                        <span className={s.muted}>{item ? item.status : 'Explore →'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'explore' && (
            <>
              <Top title="Explore" right={<button className={s.chip} onClick={() => setFilterOpen(true)}><Icon name="filter" />Filters</button>} />
              <div className={s.body}>
                <div className={s.chips}>{categories.map((c) => <button key={c} className={`${s.chip} ${c === cat ? s.chipOn : ''}`} onClick={() => setCat(c)}><Icon name={catIcon[c]} />{c}</button>)}</div>
                <div className={s.chips}>
                  <span className={s.chip}><Icon name="pin" />{f.region || 'Anywhere'}</span>
                  {f.fits && <span className={s.chip}><Icon name="users" />{w.guests}+ guests</span>}
                  {f.available && <span className={s.chip}><Icon name="calendar" />Free {fmtDate(w.date, { day: 'numeric', month: 'short' })}</span>}
                  {f.style && <span className={s.chip}>{f.style}</span>}
                </div>
                <p className={s.muted}>{results.length} {results.length === 1 ? cat.toLowerCase().replace(/s$/, '') : cat.toLowerCase()} match{results.length === 1 ? 'es' : ''} your wedding</p>
                {results.map((x) => <SupplierCard key={x.id} x={x} w={w} onClick={() => setView(x.id)} />)}
                {!results.length && <div className={s.card}><p>No matches — try widening your filters.</p><button className={`${s.btn} ${s.btnGhost}`} onClick={() => setF({ region: '', maxPrice: 10000, style: '', fits: false, available: false })}>Clear filters</button></div>}
              </div>
            </>
          )}

          {tab === 'compare' && <Compare cmp={cmp} w={w} onRemove={(r) => setCmp((c) => c.filter((x) => x.pid !== r.pid))} addToPlan={addToPlan} inPlan={(pid) => plan.some((p) => p.pid === pid)} onExplore={() => setTab('explore')} />}

          {tab === 'plan' && (
            <>
              <Top title="My wedding plan" />
              <div className={s.body}>
                <div className={s.cardDark}>
                  <span className={s.muted}>Plan total for {w.guests} guests</span>
                  <p className={s.big}>{gbp(planTotal)}</p>
                  <div className={s.bar}><span style={{ width: `${Math.min(100, (planTotal / w.budget) * 100)}%` }} /></div>
                  <span className={s.muted}>{gbp(w.budget - planTotal)} left of {gbp(w.budget)}</span>
                </div>
                {!plan.length && <div className={s.card}><p>Nothing in your plan yet.</p><button className={s.btn} onClick={() => setTab('explore')}>Explore suppliers</button></div>}
                {plan.map((p) => {
                  const { sup, pkg } = find(p);
                  return (
                    <div key={p.pid} className={s.card}>
                      <div className={s.rowBetween}><span className={s.tag}>{sup.category}</span><span className={`${s.status} ${p.status === 'Enquiry sent' ? s.stNew : s.stHeld}`}>{p.status}</span></div>
                      <b className={s.h3}>{sup.name}</b>
                      <div className={s.rowBetween}><span className={s.muted}>{pkg.name}</span><span className={s.price}>{gbp(pkgTotal(pkg, w.guests))}</span></div>
                      {p.status === 'Shortlisted' && <button className={s.btn} onClick={() => setEnq({ sid: p.sid, pid: p.pid })}>Send enquiry</button>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Tabs<Tab> items={[{ id: 'home', label: 'Home', icon: 'home' }, { id: 'explore', label: 'Explore', icon: 'search' }, { id: 'compare', label: 'Compare', icon: 'compare', count: cmp.length || undefined }, { id: 'plan', label: 'My plan', icon: 'heart', count: plan.length || undefined }]} active={tab} onChange={(t) => { setTab(t); if (t === 'compare' && cmp.length === 2) setFlags((x) => ({ ...x, compared: true })); }} />
        </>
      )}

      {filterOpen && (
        <Sheet title="Filters" onClose={() => setFilterOpen(false)}>
          <div className={s.field}><label htmlFor="fr">Location</label>
            <select id="fr" className={s.input} value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })}><option value="">Anywhere</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className={s.field}><label htmlFor="fp">Max price {gbp(f.maxPrice)}</label>
            <input id="fp" type="range" className={s.range} min={1000} max={12000} step={250} value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: +e.target.value })} /></div>
          <div className={s.field}><label>Style</label>
            <div className={s.chips} style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>{['', ...styles].map((st) => <button key={st || 'any'} className={`${s.chip} ${f.style === st ? s.chipOn : ''}`} onClick={() => setF({ ...f, style: st })}>{st || 'Any'}</button>)}</div></div>
          <label className={s.rowBetween}><span>Fits my {w.guests} guests</span><input type="checkbox" checked={f.fits} onChange={(e) => setF({ ...f, fits: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--olive)' }} /></label>
          <label className={s.rowBetween}><span>Available on {fmtDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span><input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--olive)' }} /></label>
          <button className={s.btn} onClick={() => { setFilterOpen(false); setFlags((x) => ({ ...x, filtered: true })); }}>Show {results.length} results</button>
        </Sheet>
      )}

      {enq && <Enquiry r={enq} w={w} onClose={() => setEnq(null)} onSend={(payload) => {
        saveEnquiry(payload);
        setPlan((p) => { const has = p.some((x) => x.pid === enq.pid); return has ? p.map((x) => (x.pid === enq.pid ? { ...x, status: 'Enquiry sent' } : x)) : [...p, { ...enq, status: 'Enquiry sent' }]; });
        setSent(enq); setEnq(null); setView(null);
      }} />}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </Shell>
  );
}

function Setup({ w, setW, onDone }: { w: { names: string; date: string; region: string; guests: number; budget: number }; setW: (v: typeof w) => void; onDone: () => void }) {
  return (
    <>
      <Top />
      <div className={s.body}>
        <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('/images/hero.jpg')} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
        </div>
        <div><h2 style={{ fontSize: '1.9rem' }}>Let&rsquo;s set up <em>your wedding</em></h2><p className={s.muted}>You can change any of this later.</p></div>
        <div className={s.field}><label htmlFor="n">Your names</label><input id="n" className={s.input} value={w.names} onChange={(e) => setW({ ...w, names: e.target.value })} /></div>
        <div className={s.field}><label htmlFor="d">Wedding date</label><input id="d" type="date" className={s.input} value={w.date} onChange={(e) => setW({ ...w, date: e.target.value })} /></div>
        <div className={s.field}><label htmlFor="r">Location</label><select id="r" className={s.input} value={w.region} onChange={(e) => setW({ ...w, region: e.target.value })}>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className={s.field}><label htmlFor="g">Guests: <b>{w.guests}</b></label><input id="g" type="range" className={s.range} min={20} max={200} step={5} value={w.guests} onChange={(e) => setW({ ...w, guests: +e.target.value })} /></div>
        <div className={s.field}><label htmlFor="b">Budget</label><input id="b" inputMode="numeric" className={s.input} value={gbp(w.budget)} onChange={(e) => setW({ ...w, budget: +e.target.value.replace(/\D/g, '') || 0 })} /></div>
        <div className={s.sticky}><button className={s.btn} onClick={onDone}>Create our wedding <Icon name="arrow" /></button></div>
      </div>
    </>
  );
}

function SupplierCard({ x, w, onClick }: { x: Supplier; w: { date: string; guests: number }; onClick: () => void }) {
  const booked = (x.unavailable || []).includes(w.date);
  return (
    <button className={s.sCard} onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className={s.sImg}><img src={asset(x.img)} alt="" /></span>
      <span className={s.sInfo}>
        <b>{x.name}</b>
        <span className={s.sMeta}>{x.town}, {x.region}{x.capacity ? ` · up to ${x.capacity}` : ''}</span>
        <span className={s.stars}>★ {x.rating.toFixed(1)} <span className={s.sMeta}>({x.reviews})</span></span>
        <span className={s.price}>From {gbp(x.fromPrice)}{x.packages[0].perGuest ? ' / guest' : ''}</span>
        {booked ? <span className={`${s.tag} ${s.tagWarn}`}>Booked on your date</span> : <span className={s.tag}>Available {fmtDate(w.date, { day: 'numeric', month: 'short' })}</span>}
      </span>
    </button>
  );
}

function SupplierView({ sup, w, inCmp, toggleCmp, cmpCount, onCompare, addToPlan, inPlan, onEnquire, onBack }: { sup: Supplier; w: { date: string; guests: number }; inCmp: (r: Ref) => boolean; toggleCmp: (r: Ref) => void; cmpCount: number; onCompare: () => void; addToPlan: (r: Ref) => void; inPlan: (pid: string) => boolean; onEnquire: (r: Ref) => void; onBack: () => void }) {
  const [pick, setPick] = useState(sup.packages[0].id);
  return (
    <>
      <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(sup.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 16, left: 16 }}><button className={s.back} onClick={onBack} aria-label="Back"><Icon name="arrow" /></button></div>
      </div>
      <div className={s.body} style={{ paddingTop: 16 }}>
        <div>
          <span className={s.tag}>{sup.category}</span>
          <h2 style={{ fontSize: '1.7rem', marginTop: 8 }}>{sup.name}</h2>
          <p className={s.muted}>{sup.town}, {sup.region} · <span className={s.stars}>★ {sup.rating.toFixed(1)}</span> ({sup.reviews} reviews){sup.capacity ? ` · up to ${sup.capacity} guests` : ''}</p>
        </div>
        <p style={{ fontSize: '.92rem' }}>{sup.about}</p>
        <div className={s.rowBetween}><span className={s.h3}>Packages</span><span className={s.muted}>Prices for {w.guests} guests</span></div>
        {sup.packages.map((p) => (
          <PackageCard key={p.id} p={p} w={w} selected={pick === p.id} onSelect={() => setPick(p.id)} cmp={inCmp({ sid: sup.id, pid: p.id })} onCmp={() => toggleCmp({ sid: sup.id, pid: p.id })} added={inPlan(p.id)} onAdd={() => addToPlan({ sid: sup.id, pid: p.id })} />
        ))}
        <div className={s.sticky}>
          {cmpCount > 0 && <button className={`${s.btn} ${s.btnGhost}`} onClick={onCompare}><Icon name="compare" />Compare ({cmpCount}/2)</button>}
          <button className={s.btn} onClick={() => onEnquire({ sid: sup.id, pid: pick })}>Enquire about {sup.packages.find((p) => p.id === pick)!.name} <Icon name="arrow" /></button>
        </div>
      </div>
    </>
  );
}

function PackageCard({ p, w, selected, onSelect, cmp, onCmp, added, onAdd }: { p: Package; w: { guests: number }; selected: boolean; onSelect: () => void; cmp: boolean; onCmp: () => void; added: boolean; onAdd: () => void }) {
  return (
    <div className={s.card} style={{ border: `1.5px solid ${selected ? 'var(--olive)' : 'transparent'}` }} onClick={onSelect}>
      <div className={s.rowBetween}><b className={s.h3}>{p.name}</b><span className={s.price}>{gbp(pkgTotal(p, w.guests))}</span></div>
      <p className={s.muted}>{p.summary}{p.perGuest ? ` · ${gbp(p.price)} per guest` : ''}</p>
      <ul className={s.ticks}>{p.includes.map((i) => <li key={i}><Icon name="check" />{i}</li>)}</ul>
      <div className={s.btnRow}>
        <button className={`${s.btn} ${s.btnGhost}`} style={cmp ? { background: 'var(--sage)' } : undefined} onClick={(e) => { e.stopPropagation(); onCmp(); }}><Icon name={cmp ? 'check' : 'compare'} />{cmp ? 'Comparing' : 'Compare'}</button>
        <button className={`${s.btn} ${added ? s.btnGhost : ''}`} onClick={(e) => { e.stopPropagation(); onAdd(); }}><Icon name={added ? 'check' : 'plus'} />{added ? 'In plan' : 'Add to plan'}</button>
      </div>
    </div>
  );
}

function Compare({ cmp, w, onRemove, addToPlan, inPlan, onExplore }: { cmp: Ref[]; w: { guests: number }; onRemove: (r: Ref) => void; addToPlan: (r: Ref) => void; inPlan: (pid: string) => boolean; onExplore: () => void }) {
  const items = cmp.map(find);
  const allInc = [...new Set(items.flatMap((i) => i.pkg.includes))];
  const cheaper = items.length === 2 ? (pkgTotal(items[0].pkg, w.guests) <= pkgTotal(items[1].pkg, w.guests) ? 0 : 1) : -1;
  return (
    <>
      <Top title="Compare" />
      <div className={s.body}>
        {items.length < 2 ? (
          <div className={s.card}>
            <p className={s.h3}>Pick two packages to compare</p>
            <p className={s.muted}>Open any supplier and tap <b>Compare</b> on two packages — from the same supplier or two different ones.</p>
            <p className={s.muted}>{items.length}/2 selected{items[0] ? `: ${items[0].sup.name} — ${items[0].pkg.name}` : ''}</p>
            <button className={s.btn} onClick={onExplore}>Explore suppliers</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {items.map(({ sup, pkg }, i) => (
                <div key={pkg.id} className={s.card} style={{ padding: 10, gap: 6, alignContent: 'start' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(sup.img)} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12 }} />
                  <b style={{ fontFamily: 'var(--f-display)', color: 'var(--olive-ink)', lineHeight: 1.2 }}>{sup.name}</b>
                  <span className={s.muted}>{pkg.name}</span>
                  <span className={s.big} style={{ fontSize: '1.5rem' }}>{gbp(pkgTotal(pkg, w.guests))}</span>
                  {i === cheaper && <span className={s.tag}>Lower price</span>}
                  <button className={s.link} onClick={() => onRemove({ sid: sup.id, pid: pkg.id })}>Remove</button>
                </div>
              ))}
            </div>
            <div className={s.card}>
              {[
                ['Price', (p: Package) => gbp(pkgTotal(p, w.guests))],
                ['Price difference', (p: Package) => { const d = pkgTotal(p, w.guests) - Math.min(...items.map((x) => pkgTotal(x.pkg, w.guests))); return d ? `+${gbp(d)}` : '—'; }],
                ['Deposit to book', (p: Package) => `${p.deposit}% · ${gbp((pkgTotal(p, w.guests) * p.deposit) / 100)}`],
                ['Coverage', (p: Package) => p.hours || '—'],
                ['Max guests', (p: Package) => (p.maxGuests ? String(p.maxGuests) : '—')],
              ].map(([label, fn]) => (
                <div key={label as string} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '.86rem' }}>
                  <span className={s.muted} style={{ gridColumn: '1 / -1' }}>{label as string}</span>
                  {items.map((x) => <b key={x.pkg.id} style={{ fontWeight: 500 }}>{(fn as (p: Package) => string)(x.pkg)}</b>)}
                </div>
              ))}
              <div className={s.hr} />
              <span className={s.muted}>What&rsquo;s included</span>
              {allInc.map((inc) => (
                <div key={inc} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '.82rem', alignItems: 'start' }}>
                  {items.map((x) => <span key={x.pkg.id} style={{ display: 'flex', gap: 6, color: x.pkg.includes.includes(inc) ? 'var(--ink)' : '#b7b0a3' }}><Icon name={x.pkg.includes.includes(inc) ? 'check' : 'close'} size={14} />{inc}</span>)}
                </div>
              ))}
            </div>
            <div className={s.btnRow}>
              {items.map(({ sup, pkg }) => <button key={pkg.id} className={`${s.btn} ${inPlan(pkg.id) ? s.btnGhost : ''}`} onClick={() => addToPlan({ sid: sup.id, pid: pkg.id })}>{inPlan(pkg.id) ? 'In plan' : 'Choose this'}</button>)}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export type EnquiryPayload = { couple: string; date: string; guests: number; supplier: string; sid: string; pkg: string; pid: string; total: number; deposit: number; message: string; phone: string; sentAt: string };

function Enquiry({ r, w, onClose, onSend }: { r: Ref; w: { names: string; date: string; guests: number }; onClose: () => void; onSend: (p: EnquiryPayload) => void }) {
  const { sup } = find(r);
  const [pid, setPid] = useState(r.pid);
  const pkg = sup.packages.find((p) => p.id === pid)!;
  const [guests, setGuests] = useState(w.guests);
  const [date, setDate] = useState(w.date);
  const [phone, setPhone] = useState('07700 900123');
  const [msg, setMsg] = useState(`Hi ${sup.name}! We're getting married on ${fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })} with around ${w.guests} guests and love the ${pkg.name} package. Is the date available, and could we arrange a visit?`);
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
          <li className={s.muted}><span>Deposit if accepted ({pkg.deposit}%)</span><span>{gbp((total * pkg.deposit) / 100)}</span></li>
        </ul>
        <p className={s.muted}>Nothing is charged now. {sup.name} will confirm availability, then send their contract and deposit request.</p>
      </div>
      <div className={s.sticky}><button className={s.btn} onClick={() => onSend({ couple: w.names, date, guests, supplier: sup.name, sid: sup.id, pkg: pkg.name, pid: pkg.id, total, deposit: pkg.deposit, message: msg, phone, sentAt: new Date().toISOString() })}>Send request <Icon name="arrow" /></button></div>
    </Sheet>
  );
}

function Sent({ r, w, onBack }: { r: Ref; w: { date: string }; onBack: () => void }) {
  const { sup, pkg } = find(r);
  const steps = [['Request sent', 'Just now', true], [`${sup.name} reviews it`, 'Usually within 48 hours', false], ['Contract & e-signature', 'Signed in the app', false], ['Pay your deposit', `${pkg.deposit}% to secure the date`, false]] as const;
  return (
    <>
      <Top />
      <div className={s.body}>
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
        <A to="/supplier-preview" className={s.btn}>See what the supplier sees <Icon name="arrow" /></A>
        <button className={`${s.btn} ${s.btnGhost}`} onClick={onBack}>Back to my plan</button>
      </div>
    </>
  );
}
