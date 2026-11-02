import type { Metadata } from 'next';
import A from '@/components/A';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Privacy policy', description: 'How Asteria collects and uses your personal data.' };

// TODO before launch: add the registered company name, address and privacy contact email, and have the full policy reviewed.
export default function Page() {
  return (
    <section className="section">
      <div className={`container ${s.narrow} ${s.prose}`}>
        <p className="eyebrow">Legal</p>
        <h1>Privacy policy</h1>
        <p>Last updated: November 2026. This notice explains how Asteria (&ldquo;we&rdquo;) uses the personal data you give us through this website, in line with UK data protection law (UK GDPR and the Data Protection Act 2018). Asteria is not open yet; we will publish a full policy covering the platform before launch.</p>

        <h2>What we collect</h2>
        <p><b>Founding Partner registrations:</b> your business name, contact name, email address, supplier category, location or areas covered and, if you give it, your website or social media link. We also record whether you opted in to launch updates.</p>
        <p><b>Early access and contact forms:</b> your name, email address and anything you choose to tell us (such as your wedding date, location or message).</p>

        <h2>Why we use it</h2>
        <p>To manage your registration or enquiry and contact you about it, to help suppliers set up their listing before launch, and to tell you when Asteria opens. Our lawful basis is <b>legitimate interests</b> (responding to a request you made) or, for Founding Partners, <b>steps before entering into a contract</b>.</p>
        <p><b>Launch updates and news:</b> we only send these if you tick the optional box, and our lawful basis is your <b>consent</b>. You can withdraw it at any time by replying to any email or contacting us.</p>

        <h2>Who we share it with</h2>
        <p>Form submissions are delivered to our inbox by our form provider, Web3Forms, acting on our behalf. We do not sell your data or share it with suppliers, couples or advertisers.</p>

        <h2>How long we keep it</h2>
        <p>Registrations and enquiries are kept until launch and for up to 12 months afterwards, or for as long as you have an account with us. We delete them sooner if you ask.</p>

        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete your data, object to how we use it, or withdraw consent. To do so, <A to="/contact">contact us</A>. If you&rsquo;re unhappy with how we handle your data you can complain to the Information Commissioner&rsquo;s Office at ico.org.uk.</p>
      </div>
    </section>
  );
}
