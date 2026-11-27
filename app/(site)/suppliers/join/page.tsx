import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import A from '@/components/A';
import Icon from '@/components/Icon';
import s from './join.module.css';

export const metadata: Metadata = {
  title: 'How to join Asteria — supplier guide',
  description: 'Join Asteria as a wedding supplier in a few steps: create your account, build your listing, get approved and start taking bookings. Founding Partners pay no subscription for 12 months.',
  alternates: { canonical: '/suppliers/join' },
};

const SIGNUP = '/platform/signup?role=supplier';

const steps = [
  { t: 'Create your account', d: 'Takes about two minutes. You’ll need:', list: ['Your name and business name', 'Your category (venue, photographer, florist…), region and town', 'An email address and a password', 'To accept the Supplier Terms'] },
  { t: 'Build your listing', d: 'This is what couples see. From “My listing” you can add:', list: ['Photos — up to 30, with one as your cover', 'A few lines about your business and style', 'Packages: a price (fixed or per guest), your deposit %, the most guests you cater for and what’s included', 'Extras and add-ons, and a PDF brochure if you have one'] },
  { t: 'We approve your listing', d: 'The Asteria team checks every supplier before couples can see them. You can keep editing while you wait, and you’ll get a notification as soon as you’re live.' },
  { t: 'Take enquiries and bookings', d: 'Couples send you a booking request with the package and date they want. From “Enquiries & bookings” you:', list: ['Reply to the couple and agree the details', 'Send your contract, with your deposit % and when the balance is due', 'Let the couple sign online — paying the deposit holds the date in your calendar'] },
  { t: 'Get paid', d: 'Record payments couples make to you directly, or switch on card payments from “Account & plan”. Card payments go into your own Stripe account and out to your bank.', when: 'Card payments: switching on soon' },
  { t: 'Keep your calendar up to date', d: 'Close dates you can’t do, and add bookings you take outside Asteria so you’re never double-booked. Those direct bookings are never charged commission.' },
];

const tips = [
  { t: 'Add at least 3 photos', d: 'Your cover photo is the first thing couples see in search. Use your best, brightest shot.' },
  { t: 'Show real prices', d: 'Couples can see what a package costs for their guest numbers, so the enquiries you get are serious ones.' },
  { t: 'Say what’s included', d: 'List what each package covers, one item per line. It saves back-and-forth later.' },
  { t: 'Keep dates current', d: 'Couples can filter by suppliers free on their date. An up-to-date calendar gets you seen.' },
];

const faqs = [
  { q: 'What does it cost?', a: 'Founding Partners pay no subscription for 12 months from when their listing is approved, and 3% commission on bookings paid through Asteria. Direct bookings you add yourself are never charged. Full details are in the Fee Schedule.' },
  { q: 'What happens after the 12 months?', a: 'We’ll tell you before anything changes — the plan, price and first charge date — and nothing is charged without your authorisation. You can choose a plan or cancel.' },
  { q: 'Who is my contract with?', a: 'Your bookings are between you and the couple, on your own contract. Asteria provides the platform that brings you together and handles the paperwork.' },
  { q: 'Can I still take bookings elsewhere?', a: 'Yes. You can advertise and sell anywhere. Just add those bookings to your Asteria calendar so your availability stays accurate.' },
  { q: 'Can I get Featured?', a: 'Yes — once you’re approved you can add Featured (a badge and a place at the top of search) or Spotlight (a promoted spot on Explore) from “Account & plan”.' },
  { q: 'I’m stuck — who do I contact?', a: 'Email hello@asteria-events.com and we’ll help you get set up.' },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Supplier guide" title={<>How to join <em>Asteria</em></>} lead="Everything you need to get your business listed, approved and taking bookings. Most suppliers are set up in under 20 minutes." img="/images/table.jpg">
        <A to={SIGNUP} className="btn">Create your supplier account <Icon name="arrow" /></A>
        <A to="/fee-schedule" className="btn btn--ghost">See the Fee Schedule</A>
      </PageHero>

      <section className="section sand">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className={s.head}><p className="eyebrow">Step by step</p><h2>From sign-up to <em>first booking</em></h2></div>
          <ol className={s.steps}>
            {steps.map((st) => (
              <li key={st.t} className={s.step}>
                <div>
                  <h3>{st.t}</h3>
                  <p>{st.d}</p>
                  {st.list && <ul>{st.list.map((x) => <li key={x}>{x}</li>)}</ul>}
                  {st.when && <span className={s.when}>{st.when}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={s.head}><p className="eyebrow">Tips</p><h2>Make your listing <em>stand out</em></h2></div>
          <div className={s.grid}>{tips.map((t) => <div key={t.t} className={s.tip}><b>{t.t}</b><span>{t.d}</span></div>)}</div>
        </div>
      </section>

      <section className="section dark">
        <div className="container">
          <div className={s.head}><p className="eyebrow">Founding Partners</p><h2>What it <em>costs</em></h2></div>
          <div className={s.cost}>
            <div className={s.costItem}><b>£0</b><span>subscription for your first 12 months from approval</span></div>
            <div className={s.costItem}><b>3%</b><span>commission on bookings paid through Asteria</span></div>
            <div className={s.costItem}><b>£0</b><span>on direct bookings you add yourself</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className={s.head}><p className="eyebrow">Questions</p><h2>Good to <em>know</em></h2></div>
          <div className={s.faq}>{faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
          <div className={s.cta} style={{ marginTop: '2rem' }}>
            <A to={SIGNUP} className="btn">Create your supplier account <Icon name="arrow" /></A>
            <span style={{ color: 'var(--muted)' }}>Questions? <a href="mailto:hello@asteria-events.com">hello@asteria-events.com</a></span>
          </div>
        </div>
      </section>
    </>
  );
}
