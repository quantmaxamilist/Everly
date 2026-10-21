import A from '@/components/A';
import Icon from '@/components/Icon';
import Img from '@/components/Img';
import Builder from '@/components/Builder';
import Phone from '@/components/Phone';
import CtaBand from '@/components/CtaBand';
import { categories, faqs } from '@/lib/site';
import s from './home.module.css';

const steps = [
  { icon: 'user', t: 'Tell us about your day', d: 'Add your date, location, guest numbers and style. A budget is optional.' },
  { icon: 'layers', t: 'Build your wedding', d: 'Choose a venue, add suppliers and packages, and watch your total update live.' },
  { icon: 'compare', t: 'Compare your builds', d: 'Save different versions and compare them side by side until one feels right.' },
  { icon: 'card', t: 'Book & pay in one place', d: 'Request bookings, sign contracts and pay deposits securely through Everly.' },
];

const wedding = [
  { icon: 'checkbox', t: 'Every booking in one place', d: 'Confirmed suppliers, dates and details, all in My Wedding.' },
  { icon: 'card', t: 'Deposits & balances', d: 'See what is paid and what is due, with reminders before each payment.' },
  { icon: 'sign', t: 'Contracts, signed online', d: 'Read and sign supplier contracts without the printing and scanning.' },
  { icon: 'sparkle', t: 'Smart budget help', d: 'Suggestions to keep your build on budget, from real listings and prices.' },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className={s.hero}>
        <div className={`container ${s.heroIn}`}>
          <div className={s.heroCopy}>
            <p className="eyebrow">Wedding planning, rebuilt</p>
            <h1>Don&rsquo;t just plan your wedding. <em>Build&nbsp;it.</em></h1>
            <p className="lead">Choose your venue, add your suppliers and see the full cost as you go. Build a few versions, compare them, then book and pay in one place.</p>
            <div className={s.ctas}>
              <A to="/signup" className="btn">Start building <Icon name="arrow" /></A>
              <a href="#builder" className="btn btn--ghost">Try the builder</a>
            </div>
            <ul className={s.ticks}>
              <li><Icon name="check" size={16} /> Free for couples</li>
              <li><Icon name="check" size={16} /> Compare builds side by side</li>
              <li><Icon name="check" size={16} /> Secure payments</li>
            </ul>
          </div>
          <div className={s.heroArt}>
            <div className={s.heroArch}><Img src="/images/hero.jpg" alt="Villas among cypress trees in the Italian countryside" fill priority sizes="(min-width: 1000px) 460px, 86vw" /></div>
            <div className={`${s.float} ${s.f1}`}>
              <p className={s.fLbl}>Summer villa build</p>
              <p className={s.fBig}>£21,840</p>
              <div className={s.fBar}><span style={{ width: '87%' }} /></div>
              <p className={s.fSmall}>£3,160 left of £25,000</p>
            </div>
            <div className={`${s.float} ${s.f2}`}>
              <span className={s.fIcon}><Icon name="checkbox" size={18} /></span>
              <div><p className={s.fT}>Photographer booked</p><p className={s.fSmall}>Deposit paid · Contract signed</p></div>
            </div>
          </div>
        </div>
        <div className={s.cats} aria-label="Supplier categories">
          <div className={s.catsTrack}>
            {[0, 1].map((k) => (
              <ul key={k} aria-hidden={k === 1}>
                {categories.map((c) => <li key={c} className="pill"><Icon name="leaf" />{c}</li>)}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* ALL IN ONE PLACE */}
      <section className="section sage">
        <div className={`container ${s.one}`}>
          <h2 className={`${s.oneH} rv`}>Ideas.<br />Suppliers.<br />Bookings.<br /><em>All in one place.</em></h2>
          <div className={s.oneGrid}>
            {[
              { img: '/images/table.jpg', t: 'Find your people', d: 'Venues and suppliers with clear packages, prices and what is included — no chasing quotes.' },
              { img: '/images/bouquet.jpg', t: 'Make it yours', d: 'Mix and match packages and extras to build the day you actually want.' },
              { img: '/images/setting.jpg', t: 'Know the real cost', d: 'Your total updates with every choice, so there are no surprises later.' },
            ].map((c, i) => (
              <article key={c.t} className={`${s.oneCard} rv`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={s.oneImg}><Img src={c.img} alt="" fill sizes="(min-width: 900px) 260px, 90vw" /></div>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BUILDER */}
      <section className="section" id="builder">
        <div className="container">
          <div className={`sh ${s.bHead}`}>
            <p className="eyebrow">The Wedding Builder</p>
            <h2 className="rv">Build it like you&rsquo;re <em>speccing a dream car.</em></h2>
            <p className="lead">Pick a venue, add the extras, and see exactly what it costs. Have a play — this is how building works on Everly.</p>
          </div>
          <div className="rv"><Builder /></div>
          <p className={s.note}>Example venues and prices for illustration.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section sand">
        <div className="container">
          <div className="sh sh--center">
            <p className="eyebrow">How it works</p>
            <h2 className="rv">From first idea to <em>booked</em></h2>
          </div>
          <ol className={s.steps}>
            {steps.map((st, i) => (
              <li key={st.t} className={`${s.step} rv`} style={{ transitionDelay: `${i * 80}ms` }}>
                <span className={s.stepN}>0{i + 1}</span>
                <span className={s.stepI}><Icon name={st.icon} /></span>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </li>
            ))}
          </ol>
          <div className={s.center}><A to="/how-it-works" className="btn btn--ghost">See how it works <Icon name="arrow" /></A></div>
        </div>
      </section>

      {/* MY WEDDING */}
      <section className="section">
        <div className={`container ${s.mw}`}>
          <div className={s.mwArt}>
            <div className={s.mwBlob} />
            <div className="rv"><Phone /></div>
          </div>
          <div className={s.mwCopy}>
            <p className="eyebrow">My Wedding</p>
            <h2 className="rv">Booked, signed and paid — <em>all in one place.</em></h2>
            <p className="lead">Once you have chosen your build, everything you book lives in My Wedding. No spreadsheets, no lost emails.</p>
            <ul className={s.feat}>
              {wedding.map((w) => (
                <li key={w.t} className="rv"><span><Icon name={w.icon} /></span><div><h3>{w.t}</h3><p>{w.d}</p></div></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="section sage">
        <div className="container">
          <div className="sh sh--center">
            <p className="eyebrow">Made for both sides</p>
            <h2 className="rv">One place for couples <em>and suppliers</em></h2>
          </div>
          <div className={s.aud}>
            <A to="/couples" className={`${s.audCard} rv`}>
              <div className={s.audImg}><Img src="/images/field.jpg" alt="Bride and groom walking through a tree-lined field" fill sizes="(min-width: 900px) 560px, 92vw" /></div>
              <div className={s.audBody}>
                <p className="eyebrow">For couples</p>
                <h3>Plan less. Enjoy more.</h3>
                <p>Build, compare and book your whole wedding — and keep every detail in one place.</p>
                <span className={s.audLink}>Explore for couples <Icon name="arrow" size={18} /></span>
              </div>
            </A>
            <A to="/suppliers" className={`${s.audCard} rv`}>
              <div className={s.audImg}><Img src="/images/table2.jpg" alt="Wedding reception table with white flowers outdoors" fill sizes="(min-width: 900px) 560px, 92vw" /></div>
              <div className={s.audBody}>
                <p className="eyebrow">For suppliers</p>
                <h3>Get booked, get paid.</h3>
                <p>List your packages and availability, take enquiries and deposits, and see how your listing performs.</p>
                <span className={s.audLink}>Explore for suppliers <Icon name="arrow" size={18} /></span>
              </div>
            </A>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className={s.quote}>
        <Img src="/images/hills.jpg" alt="" fill sizes="100vw" />
        <div className={`container ${s.quoteIn}`}>
          <p className={`${s.quoteT} rv`}>Thoughtful planning for a more meaningful day.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className={`container ${s.faq}`}>
          <div className="sh">
            <p className="eyebrow">Questions</p>
            <h2 className="rv">Good to <em>know</em></h2>
            <A to="/faq" className="btn btn--ghost" style={{ justifySelf: 'start' }}>All FAQs <Icon name="arrow" /></A>
          </div>
          <div className={s.faqList}>
            {faqs.slice(0, 5).map((f) => (
              <details key={f.q} className="qa">
                <summary>{f.q}<Icon name="plus" size={20} /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
