'use client';
import { useState } from 'react';
import A from './A';
import Icon from './Icon';
import s from './Form.module.css';

/**
 * Founding Partner early-access registration.
 * Sends each sign-up to Asteria's inbox through Web3Forms (NEXT_PUBLIC_WEB3FORMS_KEY,
 * the access key created for Asteria's own email address). No payment, no account.
 */
const KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
const CATEGORIES = ['Venue', 'Photographer', 'Videographer', 'Catering', 'Florist', 'Music / DJ / band', 'Cakes', 'Hair & make-up', 'Bridalwear', 'Cars & transport', 'Stationery', 'Styling & decor', 'Other'];

export default function FoundingForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error' | 'off'>('idle');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get('botcheck')) return;
    if (!KEY) { setState('off'); return; }
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    setState('sending');
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: `New Founding Partner registration — ${v('business')}`,
          from_name: 'Asteria — Founding Partner sign-ups',
          replyto: v('email'),
          'Business name': v('business'),
          'Contact name': v('name'),
          Email: v('email'),
          'Supplier category': v('category'),
          'Location / areas covered': v('areas'),
          'Website / social': v('website') || '—',
          'Marketing & launch updates': fd.get('marketing') ? 'Yes — opted in' : 'No',
          'Privacy notice': 'Shown on the form',
          Registered: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
        }),
      });
      const j = await r.json().catch(() => ({}));
      setState(r.ok && j.success !== false ? 'done' : 'error');
    } catch { setState('error'); }
  }

  if (state === 'done') {
    return (
      <div className={s.done} role="status">
        <span><Icon name="check" /></span>
        <h2>You&rsquo;re registered as a Founding Partner</h2>
        <p>Thank you — we&rsquo;ve got your details. We&rsquo;ll be in touch before launch to help set up your listing. Nothing is charged and no subscription has started.</p>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit}>
      <div className={s.two}>
        <div className="field"><label htmlFor="fp-biz">Business name</label><input id="fp-biz" name="business" className="input" required autoComplete="organization" /></div>
        <div className="field"><label htmlFor="fp-name">Contact name</label><input id="fp-name" name="name" className="input" required autoComplete="name" /></div>
      </div>
      <div className={s.two}>
        <div className="field"><label htmlFor="fp-email">Email</label><input id="fp-email" name="email" type="email" className="input" required autoComplete="email" /></div>
        <div className="field"><label htmlFor="fp-cat">Supplier category</label>
          <select id="fp-cat" name="category" className="input" required defaultValue=""><option value="" disabled>Choose…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
      </div>
      <div className="field"><label htmlFor="fp-areas">Location / areas covered</label><input id="fp-areas" name="areas" className="input" required placeholder="e.g. Based in Bath — cover the Cotswolds & South West" /></div>
      <div className="field"><label htmlFor="fp-web">Website or social <small>(optional)</small></label><input id="fp-web" name="website" className="input" placeholder="e.g. www.yourbusiness.co.uk or @yourbusiness" /></div>
      <label className={s.tick}>
        <input type="checkbox" name="marketing" value="yes" />
        <span>Send me launch updates and occasional Asteria news by email. <small>Optional — you can unsubscribe at any time.</small></span>
      </label>
      <input type="checkbox" name="botcheck" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className={`btn ${s.submit}`} disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Become a Founding Partner'} <Icon name="arrow" />
      </button>
      <p className={s.legal}>By registering you agree to our <A to="/privacy">Privacy Policy</A>. We use your details to manage your Founding Partner registration and contact you about it. No payment is taken and no subscription is activated.</p>
      {state === 'error' && <p className={s.err} role="alert">Something went wrong — please try again.</p>}
      {state === 'off' && <p className={s.err} role="alert">Registration isn&rsquo;t switched on yet — please try again soon.</p>}
    </form>
  );
}
