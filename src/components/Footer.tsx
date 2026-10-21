import A from './A';
import Logo from './Logo';
import { nav, site } from '@/lib/site';
import s from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={`dark ${s.ft}`}>
      <div className={`container ${s.top}`}>
        <div className={s.brand}>
          <Logo white height={46} />
          <p>{site.tagline}</p>
        </div>
        <div className={s.cols}>
          <div>
            <p className={s.h}>Everly</p>
            <ul>{nav.map((n) => <li key={n.path}><A to={n.path}>{n.label}</A></li>)}<li><A to="/contact">Contact</A></li></ul>
          </div>
          <div>
            <p className={s.h}>Get started</p>
            <ul>
              <li><A to="/signup">Start building</A></li>
              <li><A to="/signup?role=supplier">List your business</A></li>
              <li><A to="/login">Log in</A></li>
            </ul>
          </div>
          <div>
            <p className={s.h}>Say hello</p>
            <ul><li><a href={`mailto:${site.email}`}>{site.email}</a></li></ul>
          </div>
        </div>
      </div>
      <div className={`container ${s.bot}`}>
        <p>© {new Date().getFullYear()} Everly. All rights reserved.</p>
        <p><A to="/privacy">Privacy</A> · <A to="/terms">Terms</A></p>
      </div>
    </footer>
  );
}
