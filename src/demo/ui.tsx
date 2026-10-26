'use client';
import { useEffect } from 'react';
import Icon from '@/components/Icon';
import A from '@/components/A';
import { BRAND, asset } from '@/lib/site';
import s from './app.module.css';

export type Step = { label: string; done: boolean };

/** Desktop: guide | phone app | notes. Mobile: just the app. */
export function Shell({ side, title, intro, steps, children, other }: { side: 'Couple' | 'Supplier'; title: string; intro: string; steps: Step[]; children: React.ReactNode; other: { label: string; to: string } }) {
  const now = steps.findIndex((x) => !x.done);
  return (
    <div className={s.stage}>
      <aside className={s.guide}>
        <span className={s.badge}>{BRAND} preview · {side}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <ol className={s.steps}>
          {steps.map((st, i) => (
            <li key={st.label} className={st.done ? s.done : i === now ? s.now : ''}>
              <span>{st.done ? <Icon name="check" size={14} /> : i + 1}</span>{st.label}
            </li>
          ))}
        </ol>
        <A to={other.to} className={s.switch}>{other.label} →</A>
      </aside>
      <div className={s.app}>{children}</div>
      <div className={s.side} aria-hidden="true">
        <p>This is a clickable preview with sample data — nothing is saved or sent.</p>
      </div>
    </div>
  );
}

export function Logo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={s.logo} src={asset('/brand/everly-logo.png')} alt={BRAND} width={62} height={26} />;
}

export function Top({ title, onBack, right }: { title?: React.ReactNode; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className={s.top}>
      {onBack && <button className={s.back} onClick={onBack} aria-label="Back"><Icon name="arrow" /></button>}
      {title ? <h2>{title}</h2> : <div style={{ flex: 1 }}><Logo /></div>}
      {right}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <div className={s.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.sheetHandle} />
        <div className={s.sheetHead}><h3>{title}</h3><button className={s.close} onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        <div className={s.body}>{children}</div>
      </div>
    </>
  );
}

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [msg, onDone]);
  return <div className={s.toast} role="status"><Icon name="check" />{msg}</div>;
}

export function Tabs<T extends string>({ items, active, onChange }: { items: { id: T; label: string; icon: string; count?: number }[]; active: T; onChange: (t: T) => void }) {
  return (
    <nav className={s.tabs}>
      {items.map((t) => (
        <button key={t.id} className={active === t.id ? s.on : ''} onClick={() => onChange(t.id)} aria-current={active === t.id ? 'page' : undefined}>
          <Icon name={t.icon} />{t.label}{t.count ? <span className={s.dot}>{t.count}</span> : null}
        </button>
      ))}
    </nav>
  );
}

/** shared-origin handoff: the couple's enquiry shows up on the supplier side in the same browser */
export const ENQ_KEY = 'demo-enquiry';
export function saveEnquiry(v: unknown) { try { localStorage.setItem(ENQ_KEY, JSON.stringify(v)); } catch {} }
export function loadEnquiry<T>(): T | null { try { const v = localStorage.getItem(ENQ_KEY); return v ? (JSON.parse(v) as T) : null; } catch { return null; } }
