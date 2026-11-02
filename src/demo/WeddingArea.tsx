'use client';
/** "My wedding" area — unlocks once enquiries are sent. Preview only: sample data, nothing is saved or sent. */
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { asset } from '@/lib/site';
import { Top, Sheet, useWeb } from './ui';
import { categories, catIcon, gbp, fmtDate, daysBetween, TODAY, type Wedding } from './data';
import {
  find, itemTotal, depositOf, extraNames, paymentsFor, guestTotals, rsvpLabel, buildTasks, timelineGroup, whenLabel, MGMT_LABEL,
  type PlanItem, type ItemStatus, type Threads, type Guest, type Rsvp, type Task,
} from './couple';
import s from './app.module.css';

const stCls = (st: ItemStatus) => (st === 'Booked' ? s.stBooked : st === 'Contract sent' ? s.stNew : st === 'Enquiry sent' ? s.stHeld : st === 'Cancelled' ? s.stCancelled : s.stDeclined);
export function StatusPill({ st }: { st: ItemStatus }) { return <span className={`${s.status} ${stCls(st)}`}>{MGMT_LABEL[st]}</span>; }

/* ---------------- My wedding (dashboard) ---------------- */
type Filter = 'all' | ItemStatus;
export function WeddingHome({ w, items, tasks, threads, guests, unread, onTab, onMessage, onCancel, plusCard }: {
  w: Wedding; items: PlanItem[]; tasks: Task[]; threads: Threads; guests: Guest[]; unread: Record<string, number>;
  onTab: (t: 'tasks' | 'budget' | 'guests' | 'docs' | 'messages' | 'explore' | 'plan' | 'home' | 'inspo' | 'saved' | 'settings') => void; onMessage: (sid: string) => void; onCancel: (sid: string) => void; plusCard: React.ReactNode;
}) {
  const web = useWeb();
  const [f, setF] = useState<Filter>('all');
  const [confirm, setConfirm] = useState<string | null>(null);
  const days = Math.max(0, daysBetween(TODAY, w.date));
  const live = items.filter((i) => i.status !== 'Cancelled');
  const committed = live.filter((i) => i.status === 'Booked').reduce((t, i) => t + itemTotal(i, w.guests), 0);
  const paid = items.reduce((t, i) => t + (i.paid ?? 0), 0);
  const gt = guestTotals(guests);
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due < TODAY).length;
  const counts = (st: ItemStatus) => items.filter((i) => i.status === st).length;
  const shown = items.filter((i) => f === 'all' || i.status === f);
  const pays = paymentsFor(items, w).filter((p) => !p.paid).slice(0, 3);
  const recent = Object.entries(threads).map(([sid, t]) => ({ sid, last: t[t.length - 1] })).filter((x) => x.last).slice(0, 3);
  const tiles = [
    { l: 'Suppliers booked', v: `${counts('Booked')} of ${categories.length}`, d: `${counts('Enquiry sent') + counts('Contract sent')} in progress`, t: 'plan' as const },
    { l: 'Paid so far', v: gbp(paid), d: `of ${gbp(committed)} booked`, t: 'budget' as const },
    { l: 'RSVPs', v: `${gt.attending} attending`, d: `${gt.awaiting} awaiting reply`, t: 'guests' as const },
    { l: 'Checklist', v: `${tasks.length - open.length} of ${tasks.length} done`, d: overdue ? `${overdue} overdue` : 'All on track', t: 'tasks' as const, warn: overdue > 0 },
  ];
  return (
    <>
      <Top title={web ? 'My wedding' : undefined} kicker={web ? `${w.names} · ${fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : undefined} />
      <div className={s.body}>
        {!web && <div><p className={s.muted}>My wedding</p><h2 className={s.pageTitle}>{w.names}</h2></div>}
        <div className={s.wedTop}>
          <div className={s.cardDark}>
            <span className={s.muted}>{fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <p className={s.big}>{days} days to go</p>
            <span className={s.muted}>{w.place || w.region} · {w.guests} guests</span>
          </div>
          <div className={s.kpis}>
            {tiles.map((k) => (
              <button key={k.l} className={`${s.card} ${s.tileBtn}`} onClick={() => onTab(k.t)}>
                <span className={s.muted}>{k.l}</span>
                <b className={s.big} style={{ fontSize: '1.3rem' }}>{k.v}</b>
                <span className={k.warn ? s.overTxt : s.muted} style={{ fontSize: '.76rem' }}>{k.d}</span>
              </button>
            ))}
          </div>
        </div>
        {!web && (
          <div className={s.quick}>
            {([['tasks', 'checkbox', 'Checklist'], ['budget', 'card', 'Budget'], ['docs', 'sign', 'Documents'], ['home', 'home', 'Planning'], ['inspo', 'sparkle', 'Inspiration'], ['saved', 'heart', 'Saved'], ['settings', 'edit', 'Settings']] as const).map(([t, ic, l]) => (
              <button key={t} onClick={() => onTab(t)}><span><Icon name={ic} size={18} /></span>{l}</button>
            ))}
          </div>
        )}
        <div className={s.card}>
          <div className={s.rowBetween} style={{ flexWrap: 'wrap' }}><b className={s.h3}>Your suppliers</b><button className={s.link} onClick={() => onTab('explore')}>Find more →</button></div>
          <div className={s.chips} style={{ flexWrap: web ? 'wrap' : undefined }}>
            {(['all', 'Booked', 'Enquiry sent', 'Contract sent', 'Cancelled'] as Filter[]).map((k) => (
              <button key={k} className={`${s.chip} ${f === k ? s.chipOn : ''}`} onClick={() => setF(k)}>{k === 'all' ? 'All' : MGMT_LABEL[k as ItemStatus]} <span className={s.chipN}>{k === 'all' ? items.length : counts(k as ItemStatus)}</span></button>
            ))}
          </div>
          {shown.map((i) => {
            const { sup, pkg } = find(i);
            return (
              <div key={i.sid} className={s.mgmtRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(sup.img)} alt="" />
                <span className={s.mgmtInfo}><b>{sup.name}</b><small>{sup.category} · {pkg.name}{extraNames(i).length ? ` + ${extraNames(i).length} extras` : ''} · {gbp(itemTotal(i, w.guests))}</small></span>
                <StatusPill st={i.status} />
                <span className={s.mgmtActs}>
                  <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} onClick={() => onMessage(i.sid)}><Icon name="message" />{unread[i.sid] ? `${unread[i.sid]} new` : 'Message'}</button>
                  {(i.status === 'Booked' || i.status === 'Contract sent' || i.status === 'Enquiry sent') && <button className={`${s.btn} ${s.btnSm} ${s.btnGhost} ${s.btnDangerGhost}`} onClick={() => setConfirm(i.sid)}>Cancel</button>}
                </span>
                {confirm === i.sid && (
                  <div className={`${s.card} ${s.overCard}`} style={{ gridColumn: '1 / -1' }}>
                    <b>Cancel {sup.name}?</b>
                    <p className={s.muted}>{(i.paid ?? 0) > 0 ? `You've paid ${gbp(i.paid ?? 0)}. Their cancellation policy decides what's refunded.` : 'Nothing has been paid yet.'}</p>
                    <div className={s.btnRow}><button className={`${s.btn} ${s.btnGhost}`} onClick={() => setConfirm(null)}>Keep</button><button className={`${s.btn} ${s.btnDanger}`} onClick={() => { onCancel(i.sid); setConfirm(null); }}>Cancel booking</button></div>
                  </div>
                )}
              </div>
            );
          })}
          {!shown.length && <p className={s.muted}>No suppliers here.</p>}
        </div>
        <div className={s.dashGrid}>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Next payments</b><button className={s.link} onClick={() => onTab('budget')}>All →</button></div>
            <ul className={s.lines}>{pays.map((p) => <li key={p.sid + p.label}><span>{find({ sid: p.sid, pid: '' }).sup.name}<br /><small className={s.muted}>{p.label} · {whenLabel(p.due)}</small></span><b>{gbp(p.amount)}</b></li>)}{!pays.length && <li className={s.muted}>Nothing due.</li>}</ul>
          </div>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Next on your checklist</b><button className={s.link} onClick={() => onTab('tasks')}>All →</button></div>
            <ul className={s.lines}>{open.slice(0, 4).map((t) => <li key={t.id}><span>{t.title}{t.state && <><br /><small className={s.muted}>{t.state}</small></>}</span><small className={t.due < TODAY ? s.overTxt : s.muted}>{whenLabel(t.due)}</small></li>)}</ul>
          </div>
          <div className={s.card}>
            <div className={s.rowBetween}><b className={s.h3}>Messages</b><button className={s.link} onClick={() => onTab('messages')}>Inbox →</button></div>
            <ul className={s.lines}>{recent.map((x) => <li key={x.sid}><button className={s.linkRow} onClick={() => onMessage(x.sid)}><b>{find({ sid: x.sid, pid: '' }).sup.name}{unread[x.sid] ? <span className={s.dotInline}>{unread[x.sid]}</span> : null}</b><small className={s.muted}>{x.last.text.slice(0, 70)}{x.last.text.length > 70 ? '…' : ''}</small></button></li>)}</ul>
          </div>
        </div>
        {plusCard}
      </div>
    </>
  );
}

/* ---------------- checklist & timeline ---------------- */
export function Checklist({ w, tasks, toggle, onExplore }: { w: Wedding; tasks: Task[]; toggle: (id: string) => void; onExplore: (cat: string) => void }) {
  const [view, setView] = useState<'timeline' | 'todo'>('timeline');
  const done = tasks.filter((t) => t.done).length;
  const groups = new Map<string, Task[]>();
  (view === 'todo' ? tasks.filter((t) => !t.done) : tasks).forEach((t) => { const g = timelineGroup(t.due, w.date); groups.set(g, [...(groups.get(g) ?? []), t]); });
  return (
    <>
      <Top title="Checklist & timeline" kicker={`Built from your wedding date and what you've booked · ${done} of ${tasks.length} done`} />
      <div className={s.body}>
        <div className={s.card} style={{ gap: 8 }}>
          <div className={s.rowBetween}><b>{Math.round((done / Math.max(1, tasks.length)) * 100)}% complete</b><span className={s.muted}>{tasks.filter((t) => !t.done && t.due < TODAY).length} overdue</span></div>
          <div className={s.bar}><span style={{ width: `${(done / Math.max(1, tasks.length)) * 100}%` }} /></div>
          <p className={s.muted} style={{ fontSize: '.8rem' }}>Supplier tasks tick themselves off when you book. New tasks appear as you add suppliers and payments.</p>
        </div>
        <div className={s.seg}><button className={view === 'timeline' ? s.on : ''} onClick={() => setView('timeline')}>Full timeline</button><button className={view === 'todo' ? s.on : ''} onClick={() => setView('todo')}>Still to do</button></div>
        {[...groups.entries()].map(([g, ts]) => (
          <div key={g} className={s.tlGroup}>
            <span className={s.tlHead}>{g}</span>
            {ts.map((t) => {
              const late = !t.done && t.due < TODAY;
              return (
                <div key={t.id} className={`${s.card} ${s.task} ${t.done ? s.taskDone : ''} ${late ? s.taskLate : ''}`}>
                  <button className={s.taskTick} disabled={t.auto || !!t.cat} onClick={() => toggle(t.id)} aria-label={t.done ? 'Mark not done' : 'Mark done'} aria-pressed={t.done}>{t.done ? <Icon name="check" size={14} /> : null}</button>
                  <span className={s.taskTxt}><b>{t.title}</b><small>{t.state || (t.auto && t.done ? 'Done automatically' : t.cat ? 'Not booked yet' : '')}</small></span>
                  <span className={s.taskDue}>{t.done ? <small className={s.muted}>{fmtDate(t.due, { month: 'short', year: 'numeric' })}</small> : <small className={late ? s.overTxt : s.muted}>{whenLabel(t.due)}</small>}{t.cat && !t.done && <button className={s.link} onClick={() => onExplore(t.cat!)}>Find {t.cat.toLowerCase()} →</button>}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- budget & payments ---------------- */
export function Budget({ w, items, pay, onSettings }: { w: Wedding; items: PlanItem[]; pay: (sid: string, amount: number) => void; onSettings: () => void }) {
  const web = useWeb();
  const live = items.filter((i) => i.status !== 'Cancelled');
  const committed = live.filter((i) => i.status === 'Booked').reduce((t, i) => t + itemTotal(i, w.guests), 0);
  const pending = live.filter((i) => i.status !== 'Booked').reduce((t, i) => t + itemTotal(i, w.guests), 0);
  const paid = items.reduce((t, i) => t + (i.paid ?? 0), 0);
  const pays = paymentsFor(items, w);
  const over = committed + pending > w.budget;
  const tiles = [['Budget', gbp(w.budget)], ['Booked', gbp(committed)], ['Paid so far', gbp(paid)], ['Still to pay', gbp(committed - paid)]];
  return (
    <>
      <Top title="Budget & payments" kicker="Spending, deposits, balances and due dates" right={web ? <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} style={{ width: 'auto' }} onClick={onSettings}>Change budget</button> : undefined} />
      <div className={s.body}>
        <div className={s.kpis}>{tiles.map(([l, v]) => <div key={l} className={s.card} style={{ gap: 4 }}><span className={s.muted}>{l}</span><b className={s.big} style={{ fontSize: '1.35rem' }}>{v}</b></div>)}</div>
        <div className={`${s.card} ${over ? s.overCard : ''}`} style={{ gap: 8 }}>
          <div className={s.rowBetween}><b>Booked + in progress: {gbp(committed + pending)}</b><span className={over ? s.overTxt : s.muted}>{over ? `${gbp(committed + pending - w.budget)} over budget` : `${gbp(w.budget - committed - pending)} left`}</span></div>
          <div className={s.stackBar}>
            <i style={{ width: `${Math.min(100, (paid / w.budget) * 100)}%`, background: 'var(--olive)' }} title="Paid" />
            <i style={{ width: `${Math.min(100, ((committed - paid) / w.budget) * 100)}%`, background: 'var(--accent)' }} title="Booked, not yet paid" />
            <i style={{ width: `${Math.min(100, (pending / w.budget) * 100)}%`, background: 'var(--taupe)' }} title="In progress" />
          </div>
          <div className={s.legendRow}><span><i style={{ background: 'var(--olive)' }} />Paid</span><span><i style={{ background: 'var(--accent)' }} />Booked, to pay</span><span><i style={{ background: 'var(--taupe)' }} />Enquiries in progress</span></div>
        </div>
        <div className={s.dashGrid}>
          <div className={`${s.card} ${s.span2}`}>
            <b className={s.h3}>By supplier</b>
            <div className={s.budTable}>
              {web && <div className={`${s.budRow} ${s.advHead}`}><span>Supplier</span><span>Status</span><span>Total</span><span>Paid</span><span>Outstanding</span></div>}
              {items.map((i) => {
                const { sup } = find(i); const t = i.status === 'Cancelled' ? 0 : itemTotal(i, w.guests); const p = i.paid ?? 0;
                return (
                  <div key={i.sid} className={s.budRow}>
                    <span><b>{sup.name}</b><small className={s.muted}>{sup.category}</small></span>
                    <span><StatusPill st={i.status} /></span>
                    <span>{i.status === 'Cancelled' ? '—' : gbp(t)}</span>
                    <span>{gbp(p)}</span>
                    <span><b>{i.status === 'Booked' ? gbp(Math.max(0, t - p)) : i.status === 'Cancelled' ? '—' : 'Not booked'}</b></span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Payment schedule</b>
            <ul className={s.dueList}>
              {pays.map((p) => (
                <li key={p.sid + p.label}>
                  <div className={s.payRow}>
                    <span><b>{find({ sid: p.sid, pid: '' }).sup.name}</b><small>{p.label} · {p.paid ? 'Paid' : whenLabel(p.due)}</small></span>
                    <span className={s.dueAmt}><b>{gbp(p.amount)}</b>{p.paid ? <small className={s.okTxt}>Paid ✓</small> : <button className={s.link} onClick={() => pay(p.sid, p.amount)}>Pay now</button>}</span>
                  </div>
                </li>
              ))}
              {!pays.length && <li className={s.muted}>Payments appear here once suppliers send contracts.</li>}
            </ul>
            <p className={s.muted} style={{ fontSize: '.74rem' }}>Card payments go straight to each supplier through Stripe. Preview — nothing is charged.</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- guest list + e-invites ---------------- */
const RSVP_OPTS: { v: string; l: string }[] = [{ v: 'awaiting', l: 'Awaiting reply' }, { v: 'yes-0', l: 'Attending' }, { v: 'yes-1', l: 'Attending with +1' }, { v: 'yes-2', l: 'Attending with +2' }, { v: 'yes-3', l: 'Attending with +3' }, { v: 'no', l: 'Not able to attend' }];
export function Guests({ w, guests, setGuests, invitesSent, onInvitesSent, useCount }: { w: Wedding; guests: Guest[]; setGuests: (g: Guest[]) => void; invitesSent: boolean; onInvitesSent: (n: number) => void; useCount: (n: number) => void }) {
  const web = useWeb();
  const [f, setF] = useState<'all' | Rsvp>('all');
  const [add, setAdd] = useState(false);
  const [invite, setInvite] = useState(false);
  const t = guestTotals(guests);
  const shown = guests.filter((g) => f === 'all' || g.rsvp === f);
  const sides = [...new Set(guests.map((g) => g.side))];
  const update = (id: string, patch: Partial<Guest>) => setGuests(guests.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const setRsvp = (g: Guest, v: string) => { if (v === 'awaiting' || v === 'no') update(g.id, { rsvp: v as Rsvp, plusComing: 0 }); else { const n = +v.split('-')[1]; update(g.id, { rsvp: 'yes', plusComing: Math.min(n, g.plusOnes) }); } };
  const expected = t.attending + t.awaiting;
  return (
    <>
      <Top title="Guest list" kicker="Invites, plus-ones, RSVPs and dietary needs" right={web ? <div className={s.btnRow3}><button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} onClick={() => setAdd(true)}><Icon name="plus" />Add guest</button><button className={`${s.btn} ${s.btnSm}`} onClick={() => setInvite(true)}><Icon name="mail" />Design & send e-invites</button></div> : undefined} />
      <div className={s.body}>
        <div className={s.kpis} style={web ? { gridTemplateColumns: 'repeat(5, minmax(0,1fr))' } : undefined}>
          {[['Invited', t.invited, `${t.people} invitations incl. +1s`], ['Attending', t.attending, 'guests incl. +1s'], ['Awaiting reply', t.awaiting, 'could still come'], ['Can’t attend', t.declined, 'invitations'], ['Dietary needs', t.dietary, 'to tell your caterer']].map(([l, v, d]) => (
            <div key={l as string} className={s.card} style={{ gap: 2 }}><span className={s.muted}>{l}</span><b className={s.big} style={{ fontSize: '1.5rem' }}>{v}</b><small className={s.muted}>{d}</small></div>
          ))}
        </div>
        <div className={`${s.card} ${s.guestNote}`}>
          <span>Planning for <b>{w.guests}</b> guests · your list could bring <b>{expected}</b> (attending + awaiting).</span>
          {expected !== w.guests && <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} style={{ width: 'auto' }} onClick={() => useCount(expected)}>Use {expected} for prices</button>}
        </div>
        {!web && <div className={s.btnRow}><button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} onClick={() => setAdd(true)}><Icon name="plus" />Add guest</button><button className={`${s.btn} ${s.btnSm}`} onClick={() => setInvite(true)}><Icon name="mail" />E-invites</button></div>}
        <div className={s.chips} style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
          {([['all', 'Everyone'], ['yes', 'Attending'], ['awaiting', 'Awaiting'], ['no', 'Can’t attend']] as const).map(([k, l]) => <button key={k} className={`${s.chip} ${f === k ? s.chipOn : ''}`} onClick={() => setF(k)}>{l}</button>)}
        </div>
        <div className={s.card} style={{ gap: 0, padding: web ? '6px 20px' : '4px 14px' }}>
          {web && <div className={`${s.gRow} ${s.advHead}`}><span>Name</span><span>Side</span><span>+1s</span><span>RSVP</span><span>Dietary</span><span>Contact</span></div>}
          {shown.map((g) => (
            <div key={g.id} className={s.gRow}>
              <span className={s.gName}><b>{g.name}</b>{!web && <small className={s.muted}>{g.side} · {g.plusOnes ? `+${g.plusOnes} allowed` : 'no +1'}{g.dietary ? ` · ${g.dietary}` : ''}</small>}</span>
              {web && <span className={s.muted}>{g.side}</span>}
              {web && <span>{g.plusOnes ? `+${g.plusOnes}` : '—'}</span>}
              <span>
                <select className={`${s.rsvpSel} ${g.rsvp === 'yes' ? s.rsvpYes : g.rsvp === 'no' ? s.rsvpNo : ''}`} value={g.rsvp === 'yes' ? `yes-${g.plusComing}` : g.rsvp} onChange={(e) => setRsvp(g, e.target.value)} aria-label={`RSVP for ${g.name}`}>
                  {RSVP_OPTS.filter((o) => !o.v.startsWith('yes-') || +o.v.split('-')[1] <= g.plusOnes).map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </span>
              {web && <span className={s.muted}>{g.dietary || '—'}</span>}
              {web && <span className={s.gContact}>{g.email && <Icon name="mail" size={15} />}{g.phone && <Icon name="phone" size={15} />}{g.invited ? <small className={s.okTxt}>Invited</small> : <small className={s.muted}>Not invited</small>}</span>}
            </div>
          ))}
        </div>
        <div className={`${s.card} ${s.siteTeaser}`}>
          <div className={s.sitePrev}>
            <span>{w.names}</span><small>{fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })} · {w.place || w.region}</small><i>RSVP</i>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className={s.tag}>Coming soon</span>
            <b className={s.h3}>Your wedding website</b>
            <p className={s.muted}>A page for your guests with the day&rsquo;s details, travel and RSVP — replies drop straight into this list.</p>
          </div>
        </div>
      </div>
      {add && <AddGuest sides={sides} onClose={() => setAdd(false)} onAdd={(g) => { setGuests([...guests, g]); setAdd(false); }} />}
      {invite && <InviteDesigner w={w} guests={guests} invitesSent={invitesSent} onClose={() => setInvite(false)} onSend={(ids) => { setGuests(guests.map((g) => (ids.includes(g.id) ? { ...g, invited: true } : g))); onInvitesSent(ids.length); setInvite(false); }} />}
    </>
  );
}

function AddGuest({ sides, onClose, onAdd }: { sides: string[]; onClose: () => void; onAdd: (g: Guest) => void }) {
  const [g, setG] = useState({ name: '', side: sides[0] ?? 'Both', plusOnes: 0, email: '', phone: '', dietary: '' });
  return (
    <Sheet title="Add a guest" onClose={onClose}>
      <div className={s.field}><label htmlFor="gn">Name</label><input id="gn" className={s.input} value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="e.g. Sarah Jones" /></div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="gs">Side</label><select id="gs" className={s.input} value={g.side} onChange={(e) => setG({ ...g, side: e.target.value })}>{[...new Set([...sides, 'Both'])].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className={s.field}><label htmlFor="gp">Plus-ones allowed</label><select id="gp" className={s.input} value={g.plusOnes} onChange={(e) => setG({ ...g, plusOnes: +e.target.value })}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n ? `+${n}` : 'None'}</option>)}</select></div>
      </div>
      <div className={s.btnRow}>
        <div className={s.field}><label htmlFor="ge">Email</label><input id="ge" type="email" className={s.input} value={g.email} onChange={(e) => setG({ ...g, email: e.target.value })} /></div>
        <div className={s.field}><label htmlFor="gph">Mobile</label><input id="gph" inputMode="tel" className={s.input} value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} /></div>
      </div>
      <div className={s.field}><label htmlFor="gd">Dietary requirements</label><input id="gd" className={s.input} value={g.dietary} onChange={(e) => setG({ ...g, dietary: e.target.value })} placeholder="e.g. Vegetarian, nut allergy" /></div>
      <div className={s.sticky}><button className={s.btn} disabled={!g.name.trim()} onClick={() => onAdd({ id: `g${Date.now()}`, name: g.name.trim(), side: g.side, plusOnes: g.plusOnes, rsvp: 'awaiting', plusComing: 0, dietary: g.dietary.trim(), email: g.email.trim() || undefined, phone: g.phone.trim() || undefined, invited: false })}>Add to guest list</button></div>
    </Sheet>
  );
}

const TEMPLATES = [{ id: 'classic', name: 'Classic' }, { id: 'botanical', name: 'Botanical' }, { id: 'modern', name: 'Modern' }];
const INK = [{ id: 'olive', c: '#58583f', bg: '#f4efe8' }, { id: 'sage', c: '#5f6048', bg: '#e4e4d5' }, { id: 'taupe', c: '#6e5a42', bg: '#eae1d5' }, { id: 'night', c: '#f4efe8', bg: '#43432f' }];
function InviteDesigner({ w, guests, invitesSent, onClose, onSend }: { w: Wedding; guests: Guest[]; invitesSent: boolean; onClose: () => void; onSend: (ids: string[]) => void }) {
  const [tpl, setTpl] = useState('classic');
  const [ink, setInk] = useState(INK[0]);
  const [head, setHead] = useState('Together with their families');
  const [msg, setMsg] = useState('request the pleasure of your company at their wedding');
  const [via, setVia] = useState<'email' | 'text'>('email');
  const reach = guests.filter((g) => (via === 'email' ? g.email : g.phone));
  const [pick, setPick] = useState<string[]>(() => reach.filter((g) => !g.invited).map((g) => g.id));
  useEffect(() => { setPick(reach.filter((g) => !g.invited).map((g) => g.id)); }, [via]); // eslint-disable-line react-hooks/exhaustive-deps
  const [a, b] = w.names.split(/\s*&\s*/);
  return (
    <Sheet title="Design your e-invite" onClose={onClose} wide>
      <div className={s.invGrid}>
        <div className={`${s.invite} ${s[`inv_${tpl}`]}`} style={{ color: ink.c, background: ink.bg }}>
          {tpl === 'botanical' && <span className={s.invLeaf}><Icon name="leaf" size={34} /></span>}
          <small>{head}</small>
          <b>{a}<em>&amp;</em>{b}</b>
          <p>{msg}</p>
          <span className={s.invDate}>{fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>{w.place || w.region}</span>
          <i className={s.invBtn} style={{ borderColor: ink.c }}>RSVP</i>
        </div>
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <div className={s.field}><label>Style</label><div className={s.seg}>{TEMPLATES.map((x) => <button key={x.id} className={tpl === x.id ? s.on : ''} onClick={() => setTpl(x.id)}>{x.name}</button>)}</div></div>
          <div className={s.field}><label>Colour</label><div className={s.swRow}>{INK.map((x) => <button key={x.id} className={ink.id === x.id ? s.swOn : ''} style={{ background: x.bg, color: x.c }} onClick={() => setInk(x)} aria-label={x.id}>Aa</button>)}</div></div>
          <div className={s.field}><label htmlFor="ih">Opening line</label><input id="ih" className={s.input} value={head} onChange={(e) => setHead(e.target.value)} /></div>
          <div className={s.field}><label htmlFor="im">Wording</label><textarea id="im" className={s.input} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
        </div>
      </div>
      <div className={s.card} style={{ gap: 10 }}>
        <div className={s.rowBetween} style={{ flexWrap: 'wrap' }}><b className={s.h3}>Send to</b><div className={s.seg} style={{ minWidth: 200 }}><button className={via === 'email' ? s.on : ''} onClick={() => setVia('email')}>Email</button><button className={via === 'text' ? s.on : ''} onClick={() => setVia('text')}>Text message</button></div></div>
        <label className={s.rowBetween}><span>Select everyone with {via === 'email' ? 'an email' : 'a mobile number'} ({reach.length})</span><input type="checkbox" className={s.check} checked={pick.length === reach.length && reach.length > 0} onChange={(e) => setPick(e.target.checked ? reach.map((g) => g.id) : [])} /></label>
        <div className={s.invList}>
          {reach.map((g) => <label key={g.id}><input type="checkbox" className={s.check} checked={pick.includes(g.id)} onChange={() => setPick((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))} /><span>{g.name}<small>{via === 'email' ? g.email : g.phone}{g.invited ? ' · already invited' : ''}</small></span></label>)}
        </div>
        <p className={s.muted} style={{ fontSize: '.76rem' }}>{guests.length - reach.length} guest{guests.length - reach.length === 1 ? '' : 's'} without {via === 'email' ? 'an email' : 'a mobile'} — add it on the guest list. {invitesSent ? 'You’ve sent invites before; already-invited guests are unticked.' : ''}</p>
      </div>
      <div className={s.sticky}><button className={s.btn} disabled={!pick.length} onClick={() => onSend(pick)}><Icon name="mail" />Send {pick.length} invite{pick.length === 1 ? '' : 's'} by {via === 'email' ? 'email' : 'text'}</button></div>
    </Sheet>
  );
}

/* ---------------- documents ---------------- */
export function Documents({ w, items, onMessage, onToast }: { w: Wedding; items: PlanItem[]; onMessage: (sid: string) => void; onToast: (m: string) => void }) {
  const docs: { sid: string; name: string; kind: string; state: string; action?: 'sign' }[] = [];
  for (const i of items) {
    const { sup, pkg } = find(i); const total = itemTotal(i, w.guests); const dep = depositOf(i, w.guests);
    if (i.status === 'Contract sent') docs.push({ sid: i.sid, name: `${sup.name} — contract`, kind: 'Contract', state: 'Waiting for your signature', action: 'sign' });
    if (i.status === 'Booked' || (i.status === 'Cancelled' && (i.paid ?? 0) > 0)) {
      docs.push({ sid: i.sid, name: `${sup.name} — signed contract`, kind: 'Contract', state: 'Signed by both' });
      docs.push({ sid: i.sid, name: `${sup.name} — deposit receipt`, kind: 'Invoice', state: `${gbp(dep)} paid` });
      docs.push({ sid: i.sid, name: `${sup.name} — booking confirmation`, kind: 'Confirmation', state: `${pkg.name} · ${gbp(total)}` });
      if ((i.paid ?? 0) >= total) docs.push({ sid: i.sid, name: `${sup.name} — final payment receipt`, kind: 'Invoice', state: `${gbp(total - dep)} paid` });
    }
  }
  const brochures = items.filter((i) => i.status !== 'Cancelled');
  return (
    <>
      <Top title="Documents" kicker="Contracts, invoices and booking confirmations from your suppliers" />
      <div className={s.body}>
        <div className={s.card} style={{ gap: 0, padding: '4px 16px' }}>
          {docs.map((d, k) => (
            <div key={d.name + k} className={s.docRow}>
              <span className={s.docIc}><Icon name={d.kind === 'Invoice' ? 'card' : d.kind === 'Contract' ? 'sign' : 'checkbox'} size={18} /></span>
              <span className={s.mgmtInfo}><b>{d.name}</b><small>{d.kind} · {d.state}</small></span>
              {d.action === 'sign' ? <button className={`${s.btn} ${s.btnSm}`} style={{ width: 'auto' }} onClick={() => onMessage(d.sid)}>Review & sign</button> : <button className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} style={{ width: 'auto' }} onClick={() => onToast('Preview — the PDF downloads here in the live platform')}>Download</button>}
            </div>
          ))}
          {!docs.length && <p className={s.muted} style={{ padding: '14px 0' }}>Contracts and receipts appear here as suppliers send them.</p>}
        </div>
        <b className={s.h3}>Supplier brochures</b>
        <div className={s.card} style={{ gap: 0, padding: '4px 16px' }}>
          {brochures.map((i) => { const { sup } = find(i); return (
            <div key={i.sid} className={s.docRow}>
              <span className={s.docIc}><Icon name="layers" size={18} /></span>
              <span className={s.mgmtInfo}><b>{sup.name} brochure</b><small>PDF · uploaded by {sup.name}</small></span>
              <a className={`${s.btn} ${s.btnSm} ${s.btnGhost}`} style={{ width: 'auto' }} href={asset('/brochures/asteria-sample-brochure.pdf')} download={`${sup.name} brochure.pdf`}>Download</a>
            </div>
          ); })}
        </div>
      </div>
    </>
  );
}

/* ---------------- messages ---------------- */
export function Messages({ threads, unread, active, setActive, send, sign }: { threads: Threads; unread: Record<string, number>; active: string | null; setActive: (sid: string | null) => void; send: (sid: string, text: string) => void; sign: (sid: string) => void }) {
  const web = useWeb();
  const ids = Object.keys(threads);
  const cur = active && threads[active] ? active : web ? ids[0] ?? null : null;
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [cur, cur ? threads[cur]?.length : 0]);
  const list = (
    <div className={s.msgList}>
      {ids.map((sid) => { const t = threads[sid]; const last = t[t.length - 1]; const { sup } = find({ sid, pid: '' }); return (
        <button key={sid} className={`${s.msgItem} ${cur === sid ? s.msgOn : ''}`} onClick={() => setActive(sid)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(sup.img)} alt="" />
          <span className={s.mgmtInfo}><b>{sup.name}{unread[sid] ? <span className={s.dotInline}>{unread[sid]}</span> : null}</b><small>{last.from === 'you' ? 'You: ' : ''}{last.text}</small></span>
          <small className={s.muted}>{last.at}</small>
        </button>
      ); })}
      {!ids.length && <p className={s.muted} style={{ padding: 16 }}>Messages with suppliers appear here once you send an enquiry.</p>}
    </div>
  );
  const thread = cur && (
    <div className={s.thread}>
      <div className={s.threadHead}>
        {!web && <button className={s.back} onClick={() => setActive(null)} aria-label="Back"><Icon name="arrow" /></button>}
        <b>{find({ sid: cur, pid: '' }).sup.name}</b><small className={s.muted}>{find({ sid: cur, pid: '' }).sup.category}</small>
      </div>
      <div className={s.threadBody}>
        {threads[cur].map((m, k) => m.from === 'note'
          ? <p key={k} className={s.msgNote}>{m.text} · {m.at}</p>
          : (
            <div key={k} className={`${s.bubble} ${m.from === 'you' ? s.bubbleMe : ''}`}>
              <p>{m.text}</p>
              {m.action === 'contract' && (
                <div className={s.contractCard}>
                  <Icon name="sign" size={20} />
                  <span><b>Contract ready to sign</b><small>Sign online, then pay your deposit to secure the date</small></span>
                  <button className={`${s.btn} ${s.btnSm}`} style={{ width: 'auto' }} onClick={() => sign(cur)}>Sign & pay deposit</button>
                </div>
              )}
              <small>{m.at}</small>
            </div>
          ))}
        <div ref={end} />
      </div>
      <form className={s.composer} onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { send(cur, draft.trim()); setDraft(''); } }}>
        <input className={s.input} placeholder="Write a message…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className={`${s.btn} ${s.btnSm}`} style={{ width: 'auto' }} disabled={!draft.trim()}>Send</button>
      </form>
    </div>
  );
  if (web) {
    return (
      <>
        <Top title="Messages" kicker="Every supplier conversation in one inbox" />
        <div className={s.msgWrap}>{list}{thread || <div className={s.card}><p className={s.muted}>Pick a conversation.</p></div>}</div>
      </>
    );
  }
  return cur ? <div className={s.msgApp}>{thread}</div> : (<><Top title="Messages" /><div className={s.body}>{list}</div></>);
}

export const CATS = categories;
export { catIcon };
