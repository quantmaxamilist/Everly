import type { Metadata } from 'next';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Privacy policy', robots: { index: false } };

export default function Page() {
  return (
    <section className="section">
      <div className={`container ${s.narrow} ${s.prose}`}>
        <p className="eyebrow">Legal</p>
        <h1>Privacy policy</h1>
        <p>This page will hold Everly&rsquo;s privacy policy, prepared by a solicitor before launch.</p>
      </div>
    </section>
  );
}
