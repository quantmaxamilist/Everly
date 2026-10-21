import type { Metadata } from 'next';
import Form from '@/components/Form';
import A from '@/components/A';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Start building', description: 'Get early access to Everly — free for couples, and open to wedding suppliers.' };

export default function Page() {
  return (
    <section className={`sage ${s.auth}`}>
      <div className={s.authCard}>
        <p className="eyebrow">Early access</p>
        <h1>Start <em>building</em></h1>
        <p>Everly opens soon. Join the list and you&rsquo;ll be first in.</p>
        <Form kind="signup" />
        <p className={s.authAlt}>Already have an account? <A to="/login">Log in</A></p>
      </div>
    </section>
  );
}
