import type { Metadata } from 'next';
import EarlyAccessForm from '@/components/EarlyAccessForm';
import A from '@/components/A';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Join early access', description: 'Join the Asteria early access list — free for couples. Wedding suppliers can register as Founding Partners.' };

export default function Page() {
  return (
    <section className={`sage ${s.auth}`}>
      <div className={s.authCard}>
        <p className="eyebrow">Early access</p>
        <h1>Join <em>early access</em></h1>
        <p>Asteria opens soon. Join the list and you&rsquo;ll be first in — free for couples.</p>
        <EarlyAccessForm />
        <p className={s.authAlt}>Wedding supplier? <A to="/suppliers#founding">Become a Founding Partner</A></p>
      </div>
    </section>
  );
}
