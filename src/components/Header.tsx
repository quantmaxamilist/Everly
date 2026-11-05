'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import A from './A';
import Logo from './Logo';
import Icon from './Icon';
import { nav } from '@/lib/site';
import s from './Header.module.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { document.documentElement.style.overflow = open ? 'hidden' : ''; }, [open]);
  const isActive = (p: string) => path === p || path === p + '.html' || path.endsWith(p.slice(1) + '.html');

  return (
    <header className={`${s.hdr} ${scrolled ? s.scrolled : ''} ${open ? s.isOpen : ''}`}>
      <div className={`container ${s.in}`}>
        <A to="/" className={s.logo} aria-label="Asteria home"><Logo height={28} /></A>
        <nav className={s.nav} aria-label="Main">
          {nav.map((n) => (
            <A key={n.path} to={n.path} className={isActive(n.path) ? s.active : undefined} aria-current={isActive(n.path) ? 'page' : undefined}>{n.label}</A>
          ))}
        </nav>
        <div className={s.actions}>
          <A to="/start" className={s.login}>Use demo</A>
          <A to="/signup" className="btn btn--sm">Join early access</A>
        </div>
        <button className={s.toggle} type="button" aria-expanded={open} aria-controls="mnav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      <div id="mnav" className={s.mnav} hidden={!open}>
        <nav aria-label="Mobile">
          <A to="/">Home</A>
          {nav.map((n) => <A key={n.path} to={n.path}>{n.label}</A>)}
          <A to="/contact">Contact</A>
        </nav>
        <div className={s.mcta}>
          <A to="/signup" className="btn">Join early access <Icon name="arrow" /></A>
          <A to="/start" className="btn btn--ghost">Use demo</A>
        </div>
      </div>
    </header>
  );
}
