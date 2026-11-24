import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { extrasOf, packagesOf, photosOf, supplierById, supplierFree, weddingFor } from '@/platform/data';
import { savedIds } from '@/platform/couple';
import { plansFor } from '@/platform/plus';
import { sendEnquiry, addToPlan, toggleSaved } from '@/platform/actions/couple';
import { EnquiryTotal, Submit } from '@/platform/client';
import { Flash, Shell, StatusTag, s } from '@/platform/ui';
import { CAT_ICON, fmtDate, gbp, pkgTotal } from '@/platform/util';

export const metadata = { title: 'Supplier' };
type P = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ params, searchParams }: P) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const u = await requireUser(['couple', 'supplier', 'admin']);
  const sup = await supplierById(id);
  if (!sup || (sup.status !== 'approved' && u.role !== 'admin' && sup.user_id !== u.id)) notFound();
  const w = u.role === 'couple' ? await weddingFor(u.id) : null;
  const guests = w?.guests ?? 100;
  const [photos, pkgs, extras, saved] = await Promise.all([photosOf(sup.id), packagesOf(sup.id), extrasOf(sup.id), savedIds(u.id)]);
  const sql = await db();
  const [open] = u.role === 'couple' ? await sql<{ id: string; status: string }[]>`select id, status from bookings where supplier_id = ${sup.id} and couple_user_id = ${u.id} and status in ('enquiry','contract','deposit','paid') limit 1` : [];
  const free = w?.date ? await supplierFree(sup.id, w.date) : null;
  const plans = w ? await plansFor(w.id) : [];
  const isCouple = u.role === 'couple';
  const back = `/platform/couple/s/${sup.id}`;

  return (
    <Shell user={u} active={isCouple ? 'explore' : u.role === 'supplier' ? 'listing' : 'suppliers'}>
      <Link href={isCouple ? '/platform/couple/explore' : '/platform'} className={s.muted}>← Back</Link>
      <Flash sp={sp} />
      {photos.length ? (
        <div className={s.gallery}>{photos.slice(0, 3).map((p) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={p.id} src={p.url} alt="" />))}</div>
      ) : <div className={s.card} style={{ minHeight: 160, placeItems: 'center' }}><Icon name={CAT_ICON[sup.category] ?? 'sparkle'} size={40} /></div>}
      <div className={s.split}>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.row} style={{ alignItems: 'flex-start' }}>
            <div>
              <div className={s.btnRow}><span className={s.tag}>{sup.category}</span>{sup.featured && <span className={`${s.tag} ${s.t_feat}`}>★ Featured</span>}</div>
              <h1 style={{ fontSize: 'clamp(1.9rem, 1.5rem + 1.5vw, 2.6rem)', marginTop: 8 }}>{sup.name}</h1>
              <p className={s.muted}>{[sup.town, sup.region].filter(Boolean).join(', ')}{sup.capacity ? ` · up to ${sup.capacity} guests` : ''}{sup.travels ? ' · travels UK-wide' : ''}{sup.style ? ` · ${sup.style}` : ''}</p>
            </div>
            {isCouple && (
              <form action={toggleSaved}><input type="hidden" name="sid" value={sup.id} /><input type="hidden" name="back" value={back} />
                <button className={`${s.btn} ${s.ghost} ${s.sm}`}>{saved.has(sup.id) ? '♥ Saved' : '♡ Save'}</button></form>
            )}
          </div>
          {sup.about && <p style={{ whiteSpace: 'pre-line' }}>{sup.about}</p>}
          {sup.brochure_url && <a href={sup.brochure_url} target="_blank" rel="noreferrer" className={`${s.btn} ${s.ghost} ${s.sm}`} style={{ justifySelf: 'start' }}><Icon name="layers" />Download brochure</a>}
          <div className={s.row}><b className={s.h3}>Packages</b><span className={s.muted}>Prices for {guests} guests</span></div>
          {pkgs.map((p) => (
            <div key={p.id} className={s.card}>
              <div className={s.row}><b className={s.h3}>{p.name}</b><b>{gbp(pkgTotal(p, guests))}</b></div>
              <span className={s.muted}>{p.summary}{p.per_guest ? ` · ${gbp(p.price)} per guest` : ''} · {p.deposit}% deposit{p.max_guests ? ` · up to ${p.max_guests} guests` : ''}{p.hours ? ` · ${p.hours}` : ''}</span>
              {p.includes.length > 0 && <ul className={s.ticks}>{p.includes.map((x) => <li key={x}><Icon name="check" />{x}</li>)}</ul>}
            </div>
          ))}
          {!pkgs.length && <p className={s.muted}>This supplier hasn’t added packages yet — send them a message to ask for prices.</p>}
          {extras.length > 0 && (
            <div className={s.card}>
              <b className={s.h3}>Extras</b>
              <ul className={s.lines}>{extras.map((x) => <li key={x.id}><span>{x.name}</span><span>{gbp(x.price)}{x.per_guest ? ' pp' : ''}</span></li>)}</ul>
            </div>
          )}
        </div>

        {isCouple && (
          <div className={s.stack} style={{ gap: 16 }} id="enquire">
            {open ? (
              <div className={s.card}>
                <b className={s.h3}>You’re talking to {sup.name}</b>
                <StatusTag status={open.status} side="couple" />
                <Link href={`/platform/couple/bookings/${open.id}`} className={s.btn}>Open messages</Link>
              </div>
            ) : pkgs.length > 0 && (
              <form id="enquiry" action={sendEnquiry} className={`${s.card} ${s.form}`}>
                <input type="hidden" name="sid" value={sup.id} />
                <b className={s.h3}>Send a booking request</b>
                {free === false && <p className={s.alert}>{sup.name} is shown as unavailable on {fmtDate(w!.date)}. You can still ask about other dates.</p>}
                {free === true && <span className={`${s.tag} ${s.t_ok}`} style={{ justifySelf: 'start' }}>Available {fmtDate(w!.date)}</span>}
                <div className={s.field}><label htmlFor="eq-p">Package</label><select id="eq-p" name="package_id" className={s.input} defaultValue={pkgs[0].id}>{pkgs.map((p) => <option key={p.id} value={p.id}>{p.name} — {gbp(pkgTotal(p, guests))}</option>)}</select></div>
                {extras.length > 0 && (
                  <div className={s.field}><span className={s.label}>Extras</span>
                    {extras.map((x) => <label key={x.id} className={s.check}><input type="checkbox" name="extras" value={x.id} />{x.name} <span className={s.muted}>+{gbp(x.price)}{x.per_guest ? ' pp' : ''}</span></label>)}
                  </div>
                )}
                <div className={s.f2}>
                  <div className={s.field}><label htmlFor="eq-d">Date</label><input id="eq-d" name="date" type="date" className={s.input} defaultValue={w?.date ?? ''} required /></div>
                  <div className={s.field}><label htmlFor="eq-g">Guests</label><input id="eq-g" name="guests" inputMode="numeric" className={s.input} defaultValue={guests} /></div>
                </div>
                <div className={s.field}><label htmlFor="eq-ph">Phone <small>(optional)</small></label><input id="eq-ph" name="phone" className={s.input} /></div>
                <div className={s.field}><label htmlFor="eq-m">Message</label><textarea id="eq-m" name="message" className={s.input} defaultValue={`Hi ${sup.name}! We’re getting married${w?.date ? ` on ${fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' })}` : ''} with around ${guests} guests. Is the date available?`} /></div>
                <EnquiryTotal pkgs={pkgs} extras={extras} guests={guests} />
                <p className={s.muted} style={{ fontSize: '.78rem' }}>Nothing is charged now. {sup.name} will reply with their contract; your date is secured once you sign and pay the deposit.</p>
                <Submit pending="Sending…">Send request</Submit>
                {plans.length > 1 && <div className={s.field}><label htmlFor="eq-pl">Plan</label><select id="eq-pl" name="plan" className={s.input}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
                <button formAction={addToPlan} formNoValidate className={`${s.btn} ${s.ghost}`}>Add to {plans.length > 1 ? 'a plan' : 'my plan'} instead</button>
              </form>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
