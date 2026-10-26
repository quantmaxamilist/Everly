import type { Metadata } from 'next';
import A from '@/components/A';
import Icon from '@/components/Icon';
import { BRAND, asset } from '@/lib/site';
import s from './start.module.css';
export const metadata: Metadata = { title: 'Get started', robots: { index: false } };

export default function Start() {
  return (
    <main className={s.wrap}>
      <A to="/" className={s.home} aria-label={`${BRAND} home`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('/brand/everly-logo-white.png')} alt={BRAND} width={120} height={50} />
      </A>
      <div className={s.center}>
        <h1 className={s.q}>Are you<em>…</em></h1>
        <div className={s.bubbles}>
          <A to="/couple-preview" className={s.bubble}>
            <span className={s.ic}><Icon name="heart" size={30} /></span>
            <b>A couple</b>
            <small>Plan &amp; build your wedding</small>
          </A>
          <A to="/supplier-preview" className={`${s.bubble} ${s.b2}`}>
            <span className={s.ic}><Icon name="users" size={30} /></span>
            <b>A supplier</b>
            <small>Venues, photographers &amp; more</small>
          </A>
        </div>
      </div>
      <p className={s.note}>Preview — sample data, nothing is saved.</p>
    </main>
  );
}
