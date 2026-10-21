import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import CtaBand from '@/components/CtaBand';
import Icon from '@/components/Icon';
import { faqs } from '@/lib/site';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'FAQs', description: 'Answers to common questions about Everly for couples and suppliers.' };

export default function Page() {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <>
      <PageHero eyebrow="FAQs" title={<>Questions, <em>answered</em></>} lead="Everything you might want to know about building your wedding on Everly. Can't find it? Get in touch." />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className={`container ${s.narrow}`}>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {faqs.map((f, i) => (
              <details key={f.q} className="qa" open={i === 0}>
                <summary>{f.q}<Icon name="plus" size={20} /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <CtaBand />
    </>
  );
}
