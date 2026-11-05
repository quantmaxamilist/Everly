import type { Metadata } from 'next';
import A from '@/components/A';
import Icon from '@/components/Icon';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Join early access', description: 'Join the Asteria early access list — free for couples. Wedding suppliers can register as Founding Partners.' };

const choices = [
  { to: '/couples#early-access', icon: 'heart', t: 'We’re a couple', d: 'Join the early access list and be first to build your wedding.', cta: 'Join as a couple' },
  { to: '/suppliers#founding', icon: 'users', t: 'I’m a supplier', d: 'Become a Founding Partner — 12 months free from launch.', cta: 'Register as a supplier' },
];

export default function Page() {
  return (
    <section className={`sage ${s.auth}`}>
      <div className={s.chooseWrap}>
        <p className="eyebrow">Early access</p>
        <h1>Are you<em>…</em></h1>
        <div className={s.choose}>
          {choices.map((c) => (
            <A key={c.to} to={c.to} className={s.choice}>
              <span className={s.choiceIc}><Icon name={c.icon} size={26} /></span>
              <b>{c.t}</b>
              <small>{c.d}</small>
              <span className={s.choiceCta}>{c.cta} <Icon name="arrow" size={16} /></span>
            </A>
          ))}
        </div>
        <p className={s.authAlt}>Just looking? <A to="/start">Use the demo</A></p>
      </div>
    </section>
  );
}
