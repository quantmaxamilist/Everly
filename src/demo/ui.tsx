'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import A from '@/components/A';
import { BRAND, asset } from '@/lib/site';
import s from './app.module.css';

export type Step = { label: string; done: boolean };
export type Mode = 'web' | 'app';
export type NavItem<T extends string> = { id: T; label: string; icon: string; count?: number; appHidden?: boolean; appLabel?: string };

/** Which layout the preview is drawn in. Web = laptop/desktop platform, App = phone app. */
const ModeCtx = createContext<Mode>('app');
export const useWeb = () => useContext(ModeCtx) === 'web';

const VIEW_KEY = 'demo-view';
const WIDE = '(min-width: 980px)';

type ShellProps<T extends string> = {
  side: 'Couple' | 'Supplier';
  title: string;
  intro: string;
  steps: Step[];
  other: { label: string; to: string };
  nav: { items: NavItem<T>[]; active: T | null; onChange: (t: T) => void; hideInApp?: boolean; disabled?: boolean };
  account: { initials: string; name: string; sub?: string };
  search: string;
  /** extra controls shown in the guide / sidebar (e.g. supplier "Preview as" switcher) */
  extra?: React.ReactNode;
  /** always-visible control (e.g. guest slider): web top bar / app strip above the tabs */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Laptop/desktop: the web platform by default, with a small Web / App toggle.
 * Phones: always the app.
 */
export function Shell<T extends string>({ side, title, intro, steps, other, nav, account, search, extra, toolbar, children }: ShellProps<T>) {
  const [wide, setWide] = useState<boolean | null>(null);
  const [pref, setPref] = useState<Mode>('web');

  useEffect(() => {
    const mq = matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    try {
      const v = new URLSearchParams(location.search).get('view') || localStorage.getItem(VIEW_KEY);
      if (v === 'app' || v === 'web') setPref(v);
    } catch {}
    return () => mq.removeEventListener('change', on);
  }, []);

  const choose = (m: Mode) => { setPref(m); try { localStorage.setItem(VIEW_KEY, m); } catch {} window.scrollTo(0, 0); };

  if (wide === null) return <div className={s.stage} />;
  const mode: Mode = wide ? pref : 'app';
  const toggle = wide ? <ViewToggle mode={mode} onChange={choose} /> : null;

  if (mode === 'web') {
    return (
      <ModeCtx.Provider value="web">
        <div className={`${s.web} preview-web`}>
          <aside className={s.wSide}>
            <div className={s.wBrand}><Logo /><span className={s.wSideTag}>{side}</span></div>
            {extra}
            <nav className={s.wNav} aria-label={`${side} menu`}>
              {nav.items.map((t) => (
                <button key={t.id} disabled={nav.disabled} className={nav.active === t.id ? s.on : ''} onClick={() => nav.onChange(t.id)} aria-current={nav.active === t.id ? 'page' : undefined}>
                  <Icon name={t.icon} size={20} />{t.label}{t.count ? <span className={s.wCount}>{t.count}</span> : null}
                </button>
              ))}
            </nav>
            <div className={s.wGuide}>
              <span className={s.badge}>{BRAND} preview</span>
              <b>{title}</b>
              <Steps steps={steps} />
              <A to={other.to} className={s.switch}>{other.label} →</A>
            </div>
          </aside>
          <div className={s.wMain}>
            <header className={s.wBar}>
              <div className={s.wSearch}><Icon name="search" size={18} /><span>{search}</span></div>
              {toolbar}
              <span className={s.spacer} />
              {toggle}
              <span className={s.wIcon} aria-hidden="true"><Icon name="bell" size={18} /></span>
              <span className={s.wAcct}>
                <span className={s.avatar}>{account.initials}</span>
                <span><b>{account.name}</b>{account.sub && <small>{account.sub}</small>}</span>
              </span>
            </header>
            <div className={s.wContent}>{children}</div>
          </div>
        </div>
      </ModeCtx.Provider>
    );
  }

  return (
    <ModeCtx.Provider value="app">
      <div className={s.stage}>
        {toggle && <div className={s.toggleFixed}>{toggle}</div>}
        <aside className={s.guide}>
          <span className={s.badge}>{BRAND} preview · {side}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          {extra}
          <Steps steps={steps} />
          <A to={other.to} className={s.switch}>{other.label} →</A>
        </aside>
        <div className={s.app}>
          {children}
          {toolbar && !nav.hideInApp && <div className={s.appStrip}>{toolbar}</div>}
          {!nav.hideInApp && <Tabs<T> items={nav.items.filter((x) => !x.appHidden)} active={nav.active} onChange={nav.onChange} />}
        </div>
        <div className={s.side} aria-hidden="true">
          <p>This is a clickable preview with sample data — nothing is saved or sent.</p>
          {wide && <p>Use the <b>Web</b> / <b>App</b> switch at the top to see the laptop version.</p>}
        </div>
      </div>
    </ModeCtx.Provider>
  );
}

function ViewToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className={s.viewToggle} role="group" aria-label="Preview layout">
      <button className={mode === 'web' ? s.on : ''} aria-pressed={mode === 'web'} onClick={() => onChange('web')}><Icon name="monitor" size={15} />Web</button>
      <button className={mode === 'app' ? s.on : ''} aria-pressed={mode === 'app'} onClick={() => onChange('app')}><Icon name="phone" size={15} />App</button>
    </div>
  );
}

function Steps({ steps }: { steps: Step[] }) {
  const now = steps.findIndex((x) => !x.done);
  return (
    <ol className={s.steps}>
      {steps.map((st, i) => (
        <li key={st.label} className={st.done ? s.done : i === now ? s.now : ''}>
          <span>{st.done ? <Icon name="check" size={14} /> : i + 1}</span>{st.label}
        </li>
      ))}
    </ol>
  );
}

export function Logo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={s.logo} src={asset('/brand/everly-logo.png')} alt={BRAND} width={62} height={26} />;
}

/** Screen header. App: compact top bar (logo when no title). Web: page heading. */
export function Top({ title, onBack, right, kicker }: { title?: React.ReactNode; onBack?: () => void; right?: React.ReactNode; kicker?: string }) {
  const web = useWeb();
  if (web) {
    if (!title && !onBack) return null;
    return (
      <div className={s.wTop}>
        {onBack && <button className={s.wBack} onClick={onBack}><Icon name="arrow" size={16} />Back</button>}
        {title && <div className={s.wTopRow}><div>{kicker && <p className={s.muted}>{kicker}</p>}<h1>{title}</h1></div>{right && <div className={s.wTopRight}>{right}</div>}</div>}
      </div>
    );
  }
  return (
    <div className={s.top}>
      {onBack && <button className={s.back} onClick={onBack} aria-label="Back"><Icon name="arrow" /></button>}
      {title ? <h2>{title}</h2> : <div style={{ flex: 1 }}><Logo /></div>}
      {right}
    </div>
  );
}

/** Bottom sheet in the app; centred dialog on the web. */
export function Sheet({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <div className={`${s.sheet} ${wide ? s.sheetWide : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
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

export function Tabs<T extends string>({ items, active, onChange }: { items: NavItem<T>[]; active: T | null; onChange: (t: T) => void }) {
  return (
    <nav className={s.tabs}>
      {items.map((t) => (
        <button key={t.id} className={active === t.id ? s.on : ''} onClick={() => onChange(t.id)} aria-current={active === t.id ? 'page' : undefined}>
          <Icon name={t.icon} />{t.appLabel ?? t.label}{t.count ? <span className={s.dot}>{t.count}</span> : null}
        </button>
      ))}
    </nav>
  );
}

/** Guest-number slider shown on every couple screen. */
export function GuestSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label className={s.guestSlider}>
      <Icon name="users" size={17} />
      <input type="range" min={20} max={250} step={5} value={value} onChange={(e) => onChange(+e.target.value)} aria-label="Guest numbers" />
      <b>{value}</b><span>guests</span>
    </label>
  );
}

export function Stars({ n }: { n: number }) {
  return <span className={s.stars} aria-label={`${n} out of 5`}>{'★'.repeat(n)}<span style={{ opacity: 0.3 }}>{'★'.repeat(5 - n)}</span></span>;
}

/** shared-origin handoff: the couple's enquiry shows up on the supplier side in the same browser */
export const ENQ_KEY = 'demo-enquiry';
export function saveEnquiry(v: unknown) { try { localStorage.setItem(ENQ_KEY, JSON.stringify(v)); } catch {} }
export function loadEnquiry<T>(): T | null { try { const v = localStorage.getItem(ENQ_KEY); return v ? (JSON.parse(v) as T) : null; } catch { return null; } }
