import Link from 'next/link';
import Icon from '@/components/Icon';
import { requireUser } from '@/platform/auth';
import { weddingFor } from '@/platform/data';
import { searchSuppliers, savedIds } from '@/platform/couple';
import { SupplierCards } from '@/platform/Cards';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { CATEGORIES, CAT_ICON, REGIONS, STYLES, fmtDate } from '@/platform/util';

export const metadata = { title: 'Explore suppliers' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = await weddingFor(u.id);
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const touched = 'cat' in sp || 'region' in sp || 'q' in sp;
  const f = {
    cat: v('cat'), q: v('q'), region: touched ? v('region') : w?.region || '', style: v('style'),
    max: parseInt(v('max'), 10) || 0, guests: w?.guests ?? 100, fits: v('fits') === '1', date: w?.date ?? '', free: v('free') === '1',
  };
  const [cards, saved] = await Promise.all([searchSuppliers(f), savedIds(u.id)]);
  const link = (patch: Record<string, string>) => '?' + new URLSearchParams({ cat: f.cat, region: f.region, q: f.q, style: f.style, max: f.max ? String(f.max) : '', fits: f.fits ? '1' : '', free: f.free ? '1' : '', ...patch }).toString();
  const back = '/platform/couple/explore' + link({});

  return (
    <Shell user={u} active="explore">
      <Head title="Explore suppliers" kicker={w?.date ? `For ${fmtDate(w.date)} · ${w.guests} guests` : 'Add your date in Wedding details to check availability'} />
      <Flash sp={sp} />
      <div className={s.chips}>
        <Link href={link({ cat: '' })} className={`${s.chip} ${!f.cat ? s.on : ''}`}>All</Link>
        {CATEGORIES.map((c) => <Link key={c} href={link({ cat: c })} className={`${s.chip} ${f.cat === c ? s.on : ''}`}><Icon name={CAT_ICON[c]} />{c}</Link>)}
      </div>
      <form className={`${s.card} ${s.form}`} method="get">
        <input type="hidden" name="cat" value={f.cat} />
        <div className={s.f2} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <div className={s.field}><label htmlFor="fq">Town or name</label><input id="fq" name="q" className={s.input} defaultValue={f.q} placeholder="e.g. Bath" /></div>
          <div className={s.field}><label htmlFor="fr">Region</label><select id="fr" name="region" className={s.input} defaultValue={f.region}><option value="">Anywhere in the UK</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className={s.field}><label htmlFor="fs">Style</label><select id="fs" name="style" className={s.input} defaultValue={f.style}><option value="">Any style</option>{STYLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className={s.field}><label htmlFor="fm">Max price (£)</label><input id="fm" name="max" inputMode="numeric" className={s.input} defaultValue={f.max || ''} placeholder="Any" /></div>
        </div>
        <div className={s.btnRow}>
          <label className={s.check}><input type="checkbox" name="fits" value="1" defaultChecked={f.fits} />Fits my {f.guests} guests</label>
          {w?.date && <label className={s.check}><input type="checkbox" name="free" value="1" defaultChecked={f.free} />Free on {fmtDate(w.date, { day: 'numeric', month: 'short' })}</label>}
          <span style={{ flex: 1 }} />
          <Link href="?cat=&region=" className={`${s.btn} ${s.ghost} ${s.sm}`}>Clear</Link>
          <button className={`${s.btn} ${s.sm}`}>Search</button>
        </div>
      </form>
      <p className={s.muted}>{cards.length} {cards.length === 1 ? 'supplier' : 'suppliers'}{f.region ? ` in ${f.region}` : ''} · featured listings first</p>
      {cards.length ? <SupplierCards cards={cards} saved={saved} back={back} guests={f.guests} /> : <div className={`${s.card} ${s.empty}`}>No suppliers match yet — try widening your search. New suppliers are joining all the time.</div>}
    </Shell>
  );
}
