import Link from 'next/link';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import { db } from './db';
import type { User } from './auth';
import { logoutAction } from './actions/auth';
import { STATUS } from './util';
import { LiveUpdates, RefreshButton } from './client';
import s from './p.module.css';

type Nav = { href: string; key: string; label: string; short?: string; icon: string; count?: number; tab?: boolean };

async function navFor(u: User): Promise<Nav[]> {
  const sql = await db();
  if (u.role === 'couple') {
    const [m] = await sql<{ n: number }[]>`select count(*)::int as n from messages m join bookings b on b.id = m.booking_id where b.couple_user_id = ${u.id} and not m.read_couple and (m.sender_id is null or m.sender_id <> ${u.id})`;
    return [
      { href: '/platform/couple', key: 'home', label: 'My wedding', short: 'Home', icon: 'home', tab: true },
      { href: '/platform/couple/explore', key: 'explore', label: 'Explore suppliers', short: 'Explore', icon: 'search', tab: true },
      { href: '/platform/couple/plan', key: 'plan', label: 'My plan', short: 'Plan', icon: 'compare', tab: true },
      { href: '/platform/couple/messages', key: 'messages', label: 'Messages', icon: 'message', count: m.n, tab: true },
      { href: '/platform/couple/guests', key: 'guests', label: 'Guest list', short: 'Guests', icon: 'users', tab: true },
      { href: '/platform/couple/checklist', key: 'checklist', label: 'Checklist', icon: 'checkbox' },
      { href: '/platform/couple/budget', key: 'budget', label: 'Budget & payments', icon: 'card' },
      { href: '/platform/couple/saved', key: 'saved', label: 'Saved', icon: 'heart' },
      { href: '/platform/couple/settings', key: 'settings', label: 'Wedding details', icon: 'edit' },
    ];
  }
  if (u.role === 'supplier') {
    const [c] = await sql<{ n: number; m: number }[]>`
      select (select count(*)::int from bookings b join suppliers s on s.id = b.supplier_id where s.user_id = ${u.id} and b.status = 'enquiry') as n,
             (select count(*)::int from messages m join bookings b on b.id = m.booking_id join suppliers s on s.id = b.supplier_id where s.user_id = ${u.id} and not m.read_supplier and (m.sender_id is null or m.sender_id <> ${u.id})) as m`;
    return [
      { href: '/platform/supplier', key: 'dash', label: 'Dashboard', icon: 'grid', tab: true },
      { href: '/platform/supplier/enquiries', key: 'enquiries', label: 'Enquiries & bookings', short: 'Enquiries', icon: 'inbox', count: c.n + c.m, tab: true },
      { href: '/platform/supplier/calendar', key: 'calendar', label: 'Calendar', icon: 'calendar', tab: true },
      { href: '/platform/supplier/listing', key: 'listing', label: 'My listing', short: 'Listing', icon: 'layers', tab: true },
      { href: '/platform/supplier/account', key: 'account', label: 'Account & plan', short: 'Account', icon: 'user', tab: true },
    ];
  }
  const [a] = await sql<{ n: number }[]>`select count(*)::int as n from suppliers where status = 'pending'`;
  return [
    { href: '/admin', key: 'overview', label: 'Overview', icon: 'grid', tab: true },
    { href: '/admin/suppliers', key: 'suppliers', label: 'Suppliers', icon: 'layers', count: a.n, tab: true },
    { href: '/admin/bookings', key: 'bookings', label: 'Bookings', icon: 'inbox', tab: true },
    { href: '/admin/users', key: 'users', label: 'Users', icon: 'users', tab: true },
    { href: '/admin/settings', key: 'settings', label: 'Settings', icon: 'edit', tab: true },
  ];
}

const initials = (n: string, e: string) => (n || e).split(/[\s&@.]+/).filter(Boolean).slice(0, 2).map((x) => x[0]!.toUpperCase()).join('');
const ROLE = { couple: 'Couple', supplier: 'Supplier', admin: 'Admin' };

export async function Shell({ user, active, children }: { user: User; active: string; children: React.ReactNode }) {
  const nav = await navFor(user);
  const settingsHref = user.role === 'couple' ? '/platform/couple/settings' : user.role === 'supplier' ? '/platform/supplier/account' : '/admin/settings';
  return (
    <div className={s.shell}>
      <aside className={s.side}>
        <div className={s.brand}><Logo height={24} /><span className={s.roleTag}>{ROLE[user.role]}</span></div>
        <nav className={s.nav} aria-label="Main">
          {nav.map((n) => (
            <Link key={n.key} href={n.href} className={active === n.key ? s.on : ''} aria-current={active === n.key ? 'page' : undefined}>
              <Icon name={n.icon} size={19} />{n.label}{n.count ? <span className={s.count}>{n.count}</span> : null}
            </Link>
          ))}
        </nav>
        <LiveUpdates />
        <div className={s.me}>
          <div><b>{user.name || user.email}</b><small>{user.email}</small></div>
          <form action={logoutAction}>{user.role === 'admin' && <input type="hidden" name="to" value="admin" />}<button className={s.linkBtn}>Log out</button></form>
        </div>
      </aside>
      <div className={s.main}>
        <header className={`${s.topbar} ${s.phoneOnly}`}>
          <span className={s.topLogo}><Logo height={22} /></span>
          <span className={s.roleTag}>{ROLE[user.role]}</span>
          <span className={s.spacer} />
          <RefreshButton />
          <Link href={settingsHref} className={s.avatar} aria-label="Account">{initials(user.name, user.email)}</Link>
        </header>
        <main className={s.content}>{children}</main>
        <nav className={s.tabs} aria-label="Tabs">
          {nav.filter((n) => n.tab).map((n) => (
            <Link key={n.key} href={n.href} className={active === n.key ? s.on : ''}>
              <Icon name={n.icon} />{n.short ?? n.label}
              {n.count ? <span className={s.badge}>{n.count}</span> : null}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function Head({ title, kicker, children }: { title: React.ReactNode; kicker?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className={s.head}>
      <div>{kicker && <p className={s.kicker}>{kicker}</p>}<h1>{title}</h1></div>
      {children && <div className={s.headActs}>{children}</div>}
    </div>
  );
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const e = typeof sp.e === 'string' ? sp.e : ''; const m = typeof sp.m === 'string' ? sp.m : '';
  return <>{e && <div className={s.alert} role="alert">{e}</div>}{m && <div className={s.ok} role="status">{m}</div>}</>;
}

export function StatusTag({ status, side }: { status: string; side: 'supplier' | 'couple' }) {
  const st = STATUS[status] ?? STATUS.enquiry;
  return <span className={`${s.tag} ${s['t_' + st.tone]}`}>{side === 'couple' ? st.couple : st.label}</span>;
}

/** Simple centred card page (gate, login, sign-up, setup). */
export function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.authWrap}>
      <div className={s.authCard}>
        <Link href="/" aria-label="Asteria home" style={{ justifySelf: 'start' }}><Logo height={26} /></Link>
        {children}
      </div>
    </div>
  );
}

export { s };
