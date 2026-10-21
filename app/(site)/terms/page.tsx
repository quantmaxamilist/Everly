import type { Metadata } from 'next';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Terms of use', robots: { index: false } };

export default function Page() {
  return (
    <section className="section">
      <div className={`container ${s.narrow} ${s.prose}`}>
        <p className="eyebrow">Legal</p>
        <h1>Terms of use</h1>
        <p>This page will hold Everly&rsquo;s terms of use, prepared by a solicitor before launch.</p>
      </div>
    </section>
  );
}
