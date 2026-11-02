import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import Features from '@/components/Features';
import Split from '@/components/Split';
import CtaBand from '@/components/CtaBand';
import FoundingForm from '@/components/FoundingForm';
import A from '@/components/A';
import Icon from '@/components/Icon';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'For suppliers', description: 'Become an Asteria Founding Partner: 12 months free from launch and 3% commission on Asteria bookings. Packages, availability, enquiries, contracts and deposits in one dashboard.' };

const offer = [
  { t: '12 months free', d: 'No subscription for your first 12 months from official launch.' },
  { t: '3% commission', d: 'On qualifying Asteria bookings during your Founding Partner period.' },
  { t: 'Full platform access', d: 'Every supplier feature as it becomes available.' },
];

const items = [
  { icon: 'layers', t: 'Packages & pricing', d: 'Create packages, extras and upgrades, with seasonal, day-of-week and per-guest pricing.' },
  { icon: 'calendar', t: 'Your availability', d: 'Manage your own calendar. Double bookings are prevented automatically.' },
  { icon: 'message', t: 'Enquiries & bookings', d: 'Accept, decline or hold dates, and send custom quotes when you need to.' },
  { icon: 'card', t: 'Deposits paid to you', d: 'Set your own deposit. Payments go straight to your account through Stripe.' },
  { icon: 'sign', t: 'Contracts signed online', d: 'Share your contract and get it signed without printing or chasing.' },
  { icon: 'chart', t: 'See what is working', d: 'Track views, enquiries, bookings and revenue from your dashboard.' },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="For suppliers" title={<>Get booked. <em>Get paid.</em></>} lead="Show couples exactly what you offer and what it costs. Asteria handles the enquiries, contracts and deposits, so you can focus on the weddings." img="/images/setting.jpg">
        <A to="#founding" className="btn">Become a Founding Partner <Icon name="arrow" /></A>
        <A to="/supplier-preview" className="btn btn--ghost">See the supplier preview</A>
      </PageHero>
      <section id="founding" className={`section dark ${s.founding}`}>
        <div className={`container ${s.formWrap}`}>
          <div className={s.formSide}>
            <p className="eyebrow">Early access</p>
            <h2>Become a <em>Founding Partner</em></h2>
            <p className="lead">Register now to be one of the first suppliers on Asteria. We&rsquo;ll help you set up your listing ahead of launch.</p>
            <ul className={s.offer}>
              {offer.map((o) => <li key={o.t}><Icon name="check" /><span><b>{o.t}</b>{o.d}</span></li>)}
            </ul>
            <p className={s.offerSmall}>After your Founding Partner period you move to <b>Starter — £29/month + 5% commission</b>, unless you choose another plan or cancel. Registering is free: no payment is taken and no subscription is activated.</p>
          </div>
          <div className={s.formCard}>
            <h3 className={s.formTitle}>Register for early access</h3>
            <FoundingForm />
          </div>
        </div>
      </section>
      <section className="section sand">
        <div className="container">
          <div className="sh"><p className="eyebrow">Your dashboard</p><h2 className="rv">Run your bookings <em>in one place</em></h2></div>
          <Features items={items} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Split eyebrow="Built into every build" title={<>Couples add you <em>straight to their wedding</em></>} text="When a couple adds your package to their build, they see exactly what is included and what it costs — so the enquiries you get are serious ones." points={['Clear inclusions and extra costs', 'Booking requests for your available dates', 'Verified supplier badge']}>
            <div className={`${s.dash} rv`} aria-hidden="true">
              <div className={s.dashHead}><p>This month</p><span>Example</span></div>
              <div className={s.stats}>
                <div className={s.tile}><small>Profile views</small><b>1,284</b><em>+18%</em></div>
                <div className={s.tile}><small>Enquiries</small><b>36</b><em>+9</em></div>
                <div className={s.tile}><small>Bookings</small><b>7</b><em>3 deposits paid</em></div>
              </div>
              <div className={s.chart}>{[30, 45, 38, 52, 48, 60, 58, 72, 66, 80, 76, 92].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
              <ul className={s.enq}>
                <li>Sophie &amp; Tom · Sat 14 Aug 2027<em>New enquiry</em></li>
                <li>Priya &amp; Sam · Fri 3 Sep 2027<em>Deposit paid</em></li>
              </ul>
            </div>
          </Split>
        </div>
      </section>
      <CtaBand title="Be one of the first on Asteria" text="Founding Partners get 12 months free from launch and 3% commission on Asteria bookings." primary={{ to: '#founding', label: 'Become a Founding Partner' }} secondary={{ to: '/supplier-preview', label: 'See the supplier preview' }} />
    </>
  );
}
