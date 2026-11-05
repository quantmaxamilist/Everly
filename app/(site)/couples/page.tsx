import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import Features from '@/components/Features';
import Split from '@/components/Split';
import CtaBand from '@/components/CtaBand';
import A from '@/components/A';
import Icon from '@/components/Icon';
import EarlyAccessForm from '@/components/EarlyAccessForm';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'For couples', description: 'Build your wedding with real venues and suppliers, compare options, and book and pay in one place. Free for couples.' };

const items = [
  { icon: 'search', t: 'Find venues & suppliers', d: 'Search by location, date, budget, guest numbers and style. Save favourites and shortlists.' },
  { icon: 'layers', t: 'Build your wedding', d: 'Add a venue, suppliers, packages and extras. See your total update as you go.' },
  { icon: 'compare', t: 'Compare builds', d: 'Create as many versions as you like and compare them side by side.' },
  { icon: 'users', t: 'Plan together', d: 'Invite your partner so you are both building the same wedding.' },
  { icon: 'card', t: 'Pay securely', d: 'Pay deposits and balances by card, with receipts and reminders.' },
  { icon: 'calendar', t: 'Checklist & timeline', d: 'Stay on track with a planning checklist, deadlines and your wedding-day timeline.' },
];

const perks = [
  { t: 'First in', d: 'We’ll email you the moment Asteria opens, so you can start building straight away.' },
  { t: 'Free for couples', d: 'Planning, building and comparing your wedding costs you nothing.' },
  { t: 'Help shape it', d: 'Tell us what you need — early couples help decide what we build next.' },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="For couples" title={<>Plan less. <em>Enjoy more.</em></>} lead="Asteria brings your venue, suppliers, budget and bookings together, so you can spend less time on spreadsheets and more time looking forward to the day." img="/images/couple.jpg">
        <A to="#early-access" className="btn">Join early access <Icon name="arrow" /></A>
        <A to="/couple-preview" className="btn btn--ghost">Use demo</A>
      </PageHero>
      <section id="early-access" className={`section dark ${s.founding}`}>
        <div className={`container ${s.formWrap}`}>
          <div className={s.formSide}>
            <p className="eyebrow">Early access</p>
            <h2>Be first to <em>build your wedding</em></h2>
            <p className="lead">Asteria opens soon. Join the early access list and we&rsquo;ll let you know as soon as you can start planning.</p>
            <ul className={s.offer}>
              {perks.map((o) => <li key={o.t}><Icon name="check" /><span><b>{o.t}</b>{o.d}</span></li>)}
            </ul>
          </div>
          <div className={s.formCard}>
            <h3 className={s.formTitle}>Join the early access list</h3>
            <EarlyAccessForm />
          </div>
        </div>
      </section>
      <section className="section sand">
        <div className="container">
          <div className="sh"><p className="eyebrow">What you get</p><h2 className="rv">Everything you need, <em>nothing you don&rsquo;t</em></h2></div>
          <Features items={items} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Split eyebrow="Your budget, your way" title={<>Always know <em>the real cost</em></>} text="Add a budget and Asteria shows what is allocated and what is left with every choice. No budget? No problem — just build and see where you land." points={['Live totals as you build', 'Spend breakdown by supplier', 'Smart suggestions to save money']} img="/images/bouquet2.jpg" alt="Bride holding a white bouquet" />
        </div>
      </section>
      <CtaBand title="Be first to build your wedding" text="Join the early access list and we’ll email you as soon as Asteria opens." primary={{ to: '#early-access', label: 'Join early access' }} secondary={{ to: '/couple-preview', label: 'Use demo' }} />
    </>
  );
}
