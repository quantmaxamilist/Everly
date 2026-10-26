import type { Metadata } from 'next';
import Form from '@/components/Form';
import A from '@/components/A';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

export default function Page() {
  return (
    <section className={`sage ${s.auth}`}>
      <div className={s.authCard}>
        <p className="eyebrow">Welcome back</p>
        <h1>Log <em>in</em></h1>
        <Form kind="login" />
        <p className={s.authAlt}>New to Everly? <A to="/start">Start building</A></p>
      </div>
    </section>
  );
}
