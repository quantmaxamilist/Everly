import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import Split from '@/components/Split';
import Features from '@/components/Features';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = { title: 'About', description: 'Everly was created to make wedding planning feel like building something you love — clear, simple and all in one place.' };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="About Everly" title={<>Thoughtful planning for a <em>more meaningful day</em></>} lead="Planning a wedding usually means dozens of tabs, quotes and spreadsheets. Everly was created to bring it all together — so you can see your whole day, and what it costs, in one place." img="/images/gardens.jpg" />
      <section className="section sand">
        <div className="container">
          <Split eyebrow="Why we built it" title={<>Your wedding should feel <em>built, not chased</em></>} text="We wanted planning to feel more like designing something you love: pick the pieces, see how they fit together, change your mind freely, and book with confidence when it is right." img="/images/arch.jpg" alt="Floral arch at an outdoor ceremony" />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="sh"><p className="eyebrow">What we believe</p><h2 className="rv">Simple, honest, <em>all in one place</em></h2></div>
          <Features items={[
            { icon: 'leaf', t: 'Clarity first', d: 'Clear packages, clear prices and no surprises later.' },
            { icon: 'heart', t: 'Your day, your way', d: 'Build as many versions as you like. There is no single right wedding.' },
            { icon: 'shield', t: 'Trust on both sides', d: 'Secure payments, signed contracts and verified suppliers.' },
          ]} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
