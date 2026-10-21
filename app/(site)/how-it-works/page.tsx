import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import Split from '@/components/Split';
import Phone from '@/components/Phone';
import CtaBand from '@/components/CtaBand';
import A from '@/components/A';
import Icon from '@/components/Icon';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'How it works', description: 'Set up your wedding, build it with real venues and suppliers, compare your builds, then book and pay in one place.' };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="How it works" title={<>Four steps from idea <em>to booked</em></>} lead="Everly turns wedding planning into something you build. Here is how it works, from your first idea to your final payment." img="/images/aisle.jpg">
        <A to="/signup" className="btn">Start building <Icon name="arrow" /></A>
      </PageHero>
      <section className="section sand">
        <div className={`container ${s.stack}`}>
          <Split eyebrow="Step 01" title={<>Tell us about <em>your day</em></>} text="Add your date (or rough season), location, guest numbers and the style you love. Add a budget if you have one — it is optional." points={['Invite your partner to the same wedding', 'Change anything later', 'Budget is optional']}>
            <div className={s.phoneWrap}><Phone variant="plan" /></div>
          </Split>
          <Split reverse eyebrow="Step 02" title={<>Build your <em>wedding</em></>} text="Choose a venue, then add suppliers, packages and extras. Your total updates with every choice, so you always know where you stand." points={['Clear package inclusions and extra costs', 'Per-guest and seasonal pricing worked out for you', 'Budget allocated vs remaining, live']} img="/images/table.jpg" alt="Wedding table with white flowers" />
          <Split eyebrow="Step 03" title={<>Compare <em>your builds</em></>} text="Make a summer villa wedding and a winter manor wedding. Duplicate a build, swap a supplier, and compare them side by side." points={['Unlimited builds', 'Side-by-side cost comparison', 'Save and come back any time']} img="/images/villa.jpg" alt="Stone villa wedding venue" />
          <Split reverse eyebrow="Step 04" title={<>Book, sign <em>&amp; pay</em></>} text="Request to book each supplier, sign their contract online and pay your deposit securely. Confirmed bookings move into My Wedding." points={['Secure card payments via Stripe', 'Contracts signed online', 'Payment reminders before balances are due']}>
            <div className={s.phoneWrap}><Phone /></div>
          </Split>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
