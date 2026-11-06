'use client';
import { useState } from 'react';
import A from './A';
import Icon from './Icon';
import s from './Form.module.css';

/**
 * Couples' early-access list. Each sign-up is emailed to Asteria's inbox through Web3Forms
 * (NEXT_PUBLIC_WEB3FORMS_KEY — the key made for Asteria's own email address). No account is created.
 */
// Web3Forms access key (public — safe in client code). Sends to hello@asteria-events.com.
const KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || '216c8b28-3c5e-40b2-9383-e7db963e0139';

export default function EarlyAccessForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error' | 'off'>('idle');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get('botcheck')) return;
    if (!KEY) { setState('off'); return; }
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    const date = v('wedding_date');
    setState('sending');
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: `New early access sign-up (couple) — ${v('name')}${v('partner') ? ` & ${v('partner')}` : ''}`,
          from_name: 'Asteria — couples early access',
          replyto: v('email'),
          Name: v('name'),
          "Partner's name": v('partner') || '—',
          Email: v('email'),
          'Wedding date': date ? new Date(`${date}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Not decided',
          'Where they are thinking': v('location') || '—',
          'Planning tips & news': fd.get('marketing') ? 'Yes — opted in' : 'No',
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
        <h2>You&rsquo;re on the list</h2>
        <p>Thank you! We&rsquo;ll email you as soon as Asteria opens, so you can start building your wedding.</p>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit}>
      <div className={s.two}>
        <div className="field"><label htmlFor="ea-name">Your name</label><input id="ea-name" name="name" className="input" required autoComplete="name" /></div>
        <div className="field"><label htmlFor="ea-partner">Partner&rsquo;s name <small>(optional)</small></label><input id="ea-partner" name="partner" className="input" /></div>
      </div>
      <div className="field"><label htmlFor="ea-email">Email</label><input id="ea-email" name="email" type="email" className="input" required autoComplete="email" /></div>
      <div className={s.two}>
        <div className="field"><label htmlFor="ea-date">Wedding date <small>(if you know it)</small></label><input id="ea-date" name="wedding_date" type="month" className="input" /></div>
        <div className="field"><label htmlFor="ea-where">Where <small>(optional)</small></label><input id="ea-where" name="location" className="input" placeholder="e.g. Cotswolds" /></div>
      </div>
      <label className={s.tick}>
        <input type="checkbox" name="marketing" value="yes" />
        <span>Send me wedding planning tips and Asteria news by email. <small>Optional — you can unsubscribe at any time.</small></span>
      </label>
      <input type="checkbox" name="botcheck" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className={`btn ${s.submit}`} disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Join early access'} <Icon name="arrow" />
      </button>
      <p className={s.legal}>By joining you agree to our <A to="/privacy">Privacy Policy</A>. We&rsquo;ll use your details to tell you when Asteria opens.</p>
      {state === 'error' && <p className={s.err} role="alert">Something went wrong — please try again.</p>}
      {state === 'off' && <p className={s.err} role="alert">The early access list isn&rsquo;t switched on yet — please try again soon.</p>}
    </form>
  );
}
