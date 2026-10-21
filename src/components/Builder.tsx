'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Img from './Img';
import Icon from './Icon';
import A from './A';
import { venues, options } from '@/lib/site';
import s from './Builder.module.css';

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB');

function useTween(value: number) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current, d = 520;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / d), e = 1 - Math.pow(1 - p, 3);
      const n = a + (value - a) * e; setV(n); from.current = n;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return v;
}

type Saved = { name: string; venue: string; total: number; items: number; guests: number };
const groups = Array.from(new Set(options.map((o) => o.group)));

export default function Builder() {
  const [guests, setGuests] = useState(90);
  const [budget, setBudget] = useState(25000);
  const [venueId, setVenueId] = useState(venues[0].id);
  const [picked, setPicked] = useState<string[]>(['cat-a', 'pho-a', 'flo-a']);
  const [saved, setSaved] = useState<Saved[]>([]);

  const venue = venues.find((v) => v.id === venueId)!;
  const lines = useMemo(() => [
    { label: venue.name, sub: 'Venue hire', amount: venue.price },
    ...options.filter((o) => picked.includes(o.id)).map((o) => ({ label: o.name, sub: o.perGuest ? `${guests} guests × ${gbp(o.price)}` : o.group, amount: o.perGuest ? o.price * guests : o.price })),
  ], [venue, picked, guests]);
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const shown = useTween(total);
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const left = budget - total;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const save = () => setSaved((sv) => [...sv.slice(-2), { name: `Build ${String.fromCharCode(65 + (sv.length % 26))}`, venue: venue.name, total, items: lines.length, guests }]);

  return (
    <div className={s.wrap}>
      <div className={s.left}>
        <div className={s.mTotal} aria-hidden="true"><span>Your build · {lines.length} items</span><b>{gbp(shown)}</b></div>
        <div className={s.row2}>
          <div className={s.ctrl}>
            <label htmlFor="b-guests">Guests <b>{guests}</b></label>
            <input id="b-guests" type="range" min={30} max={180} step={5} value={guests} onChange={(e) => setGuests(+e.target.value)} className={s.range} style={{ ['--p' as string]: `${((guests - 30) / 150) * 100}%` }} />
          </div>
          <div className={s.ctrl}>
            <label htmlFor="b-budget">Budget <span className={s.opt}>optional</span></label>
            <div className={s.money}><span>£</span><input id="b-budget" inputMode="numeric" value={budget ? budget.toLocaleString('en-GB') : ''} onChange={(e) => setBudget(+e.target.value.replace(/\D/g, '') || 0)} /></div>
          </div>
        </div>

        <fieldset className={s.fs}>
          <legend><span className={s.n}>1</span>Choose a venue</legend>
          <div className={s.venues}>
            {venues.map((v) => (
              <label key={v.id} className={`${s.venue} ${v.id === venueId ? s.on : ''}`}>
                <input type="radio" name="venue" value={v.id} checked={v.id === venueId} onChange={() => setVenueId(v.id)} className="sr-only" />
                <span className={s.vimg}><Img src={v.img} alt="" fill sizes="(min-width: 1000px) 200px, 33vw" /></span>
                <span className={s.vname}>{v.name}</span>
                <span className={s.vmeta}>{v.tag} · up to {v.capacity}</span>
                <span className={s.vprice}>{gbp(v.price)}</span>
                <span className={s.tick} aria-hidden="true"><Icon name="check" size={14} /></span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={s.fs}>
          <legend><span className={s.n}>2</span>Add suppliers &amp; packages</legend>
          <div className={s.groups}>
            {groups.map((g) => (
              <div key={g} className={s.group}>
                <p className={s.gname}>{g}</p>
                {options.filter((o) => o.group === g).map((o) => {
                  const on = picked.includes(o.id);
                  return (
                    <label key={o.id} className={`${s.opt2} ${on ? s.on : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(o.id)} className="sr-only" />
                      <span className={s.box} aria-hidden="true">{on && <Icon name="check" size={14} />}</span>
                      <span className={s.otext}><b>{o.name}</b><small>{o.detail}</small></span>
                      <span className={s.oprice}>{gbp(o.price)}{o.perGuest && <small>/guest</small>}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className={s.right} aria-live="polite">
        <div className={s.sum}>
          <div className={s.sumHead}>
            <p className={s.lbl}>Your build</p>
            <span className={s.badge}>{lines.length} items</span>
          </div>
          <p className={s.total}>{gbp(shown)}</p>
          {budget > 0 && (
            <div className={s.budget}>
              <div className={s.bar}><span style={{ width: `${pct}%` }} className={left < 0 ? s.over : undefined} /></div>
              <p>{left >= 0 ? <><b>{gbp(left)}</b> left of {gbp(budget)}</> : <><b className={s.overT}>{gbp(-left)} over</b> your {gbp(budget)} budget</>}</p>
            </div>
          )}
          <ul className={s.lines}>
            {lines.map((l) => (
              <li key={l.label}><span><b>{l.label}</b><small>{l.sub}</small></span><span>{gbp(l.amount)}</span></li>
            ))}
          </ul>
          <div className={s.sumCta}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={save}><Icon name="plus" /> Save &amp; compare</button>
            <A to="/signup" className="btn btn--sm">Build yours <Icon name="arrow" /></A>
          </div>
        </div>
        {saved.length > 0 && (
          <div className={s.compare}>
            <p className={s.lbl}>Compare builds</p>
            <ul>
              {saved.map((b, i) => (
                <li key={i}>
                  <span className={s.cname}>{b.name}</span>
                  <span className={s.cmeta}>{b.venue} · {b.guests} guests · {b.items} items</span>
                  <span className={s.ctotal}>{gbp(b.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
