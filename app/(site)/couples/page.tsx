import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import Features from '@/components/Features';
import Split from '@/components/Split';
import CtaBand from '@/components/CtaBand';
import A from '@/components/A';
import Icon from '@/components/Icon';

export const metadata: Metadata = { title: 'For couples', description: 'Build your wedding with real venues and suppliers, compare options, and book and pay in one place. Free for couples.' };

const items = [
  { icon: 'search', t: 'Find venues & suppliers', d: 'Search by location, date, budget, guest numbers and style. Save favourites and shortlists.' },
  { icon: 'layers', t: 'Build your wedding', d: 'Add a venue, suppliers, packages and extras. See your total update as you go.' },
  { icon: 'compare', t: 'Compare builds', d: 'Create as many versions as you like and compare them side by side.' },
  { icon: 'users', t: 'Plan together', d: 'Invite your partner so you are both building the same wedding.' },
  { icon: 'card', t: 'Pay securely', d: 'Pay deposits and balances by card, with receipts and reminders.' },
  { icon: 'calendar', t: 'Checklist & timeline', d: 'Stay on track with a planning checklist, deadlines and your wedding-day timeline.' },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="For couples" title={<>Plan less. <em>Enjoy more.</em></>} lead="Everly brings your venue, suppliers, budget and bookings together, so you can spend less time on spreadsheets and more time looking forward to the day." img="/images/couple.jpg">
        <A to="/start" className="btn">Start building — it&rsquo;s free <Icon name="arrow" /></A>
      </PageHero>
      <section className="section sand">
        <div className="container">
          <div className="sh"><p className="eyebrow">What you get</p><h2 className="rv">Everything you need, <em>nothing you don&rsquo;t</em></h2></div>
          <Features items={items} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Split eyebrow="Your budget, your way" title={<>Always know <em>the real cost</em></>} text="Add a budget and Everly shows what is allocated and what is left with every choice. No budget? No problem — just build and see where you land." points={['Live totals as you build', 'Spend breakdown by supplier', 'Smart suggestions to save money']} img="/images/bouquet2.jpg" alt="Bride holding a white bouquet" />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
