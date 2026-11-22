import Link from 'next/link';
import Icon from '@/components/Icon';
import { toggleSaved } from './actions/couple';
import type { Card } from './couple';
import { CAT_ICON, gbp } from './util';
import { s } from './ui';

export function SupplierCards({ cards, saved, back, guests }: { cards: Card[]; saved: Set<string>; back: string; guests: number }) {
  return (
    <div className={s.sGrid}>
      {cards.map((c) => (
        <div key={c.id} className={s.sCard} style={{ position: 'relative' }}>
          <Link href={`/platform/couple/s/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'grid' }}>
            <span className={s.sImg}>
              {c.cover ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={c.cover} alt="" loading="lazy" />) : <span className={s.noImg}><Icon name={CAT_ICON[c.category] ?? 'sparkle'} size={34} /></span>}
              {c.featured && <span className={`${s.tag} ${s.t_feat}`}>★ Featured</span>}
            </span>
            <span className={s.sInfo}>
              <span className={s.muted} style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{c.category}</span>
              <b>{c.name}</b>
              <span className={s.muted}>{[c.town, c.region].filter(Boolean).join(', ')}{c.capacity ? ` · up to ${c.capacity}` : ''}{c.travels ? ' · travels UK-wide' : ''}</span>
              {c.from_price != null && <span style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--olive-dark)' }}>From {gbp(c.from_price)}{c.from_pg ? ` pp · ${gbp(c.from_price * guests)} for ${guests}` : ''}</span>}
            </span>
          </Link>
          <form action={toggleSaved} style={{ position: 'absolute', top: 10, right: 10 }}>
            <input type="hidden" name="sid" value={c.id} /><input type="hidden" name="back" value={back} />
            <button aria-label={saved.has(c.id) ? 'Remove from saved' : 'Save'} aria-pressed={saved.has(c.id)} style={{ width: 36, height: 36, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: saved.has(c.id) ? '#c4553a' : 'var(--olive-ink)' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill={saved.has(c.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" /></svg>
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
