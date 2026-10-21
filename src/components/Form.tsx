'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import s from './Form.module.css';

type Kind = 'signup' | 'login' | 'contact';
const KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

export default function Form({ kind }: { kind: Kind }) {
  const [role, setRole] = useState<'couple' | 'supplier'>('couple');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  useEffect(() => { if (new URLSearchParams(window.location.search).get('role') === 'supplier') setRole('supplier'); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (kind === 'login') { setState('done'); return; }
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (!KEY) { setState('done'); return; } // preview / not yet configured
    setState('sending');
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: KEY, subject: kind === 'signup' ? `Everly early access — ${role}` : 'Everly website enquiry', from_name: 'Everly website', role, ...data }),
      });
      setState(r.ok ? 'done' : 'error');
    } catch { setState('error'); }
  }

  if (state === 'done') {
    return (
      <div className={s.done} role="status">
        <span><Icon name="check" /></span>
        <h2>{kind === 'login' ? 'Accounts open at launch' : kind === 'signup' ? 'You’re on the list' : 'Thanks — message sent'}</h2>
        <p>{kind === 'login' ? 'Everly is opening soon. Register for early access and we’ll let you know when you can log in.' : kind === 'signup' ? 'We’ll email you as soon as Everly opens, so you can start building.' : 'We’ll get back to you as soon as we can.'}</p>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit}>
      {kind === 'signup' && (
        <div className={s.seg} role="radiogroup" aria-label="I am a">
          {(['couple', 'supplier'] as const).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} className={role === r ? s.on : ''} onClick={() => setRole(r)}>
              <Icon name={r === 'couple' ? 'heart' : 'users'} size={18} />{r === 'couple' ? 'We’re getting married' : 'I’m a supplier'}
            </button>
          ))}
        </div>
      )}
      {kind !== 'login' && (
        <div className="field"><label htmlFor="f-name">{role === 'supplier' && kind === 'signup' ? 'Your name' : 'Name'}</label><input id="f-name" name="name" className="input" required autoComplete="name" /></div>
      )}
      {kind === 'signup' && role === 'supplier' && (
        <div className={s.two}>
          <div className="field"><label htmlFor="f-biz">Business name</label><input id="f-biz" name="business" className="input" required /></div>
          <div className="field"><label htmlFor="f-type">What you do</label>
            <select id="f-type" name="category" className="input" defaultValue=""><option value="" disabled>Choose…</option>{['Venue', 'Photographer', 'Catering', 'Florist', 'Music / DJ', 'Cakes', 'Hair & makeup', 'Cars', 'Stationery', 'Decor', 'Other'].map((c) => <option key={c}>{c}</option>)}</select>
          </div>
        </div>
      )}
      <div className="field"><label htmlFor="f-email">Email</label><input id="f-email" name="email" type="email" className="input" required autoComplete="email" /></div>
      {kind === 'login' && <div className="field"><label htmlFor="f-pw">Password</label><input id="f-pw" name="password" type="password" className="input" required autoComplete="current-password" /></div>}
      {kind === 'signup' && role === 'couple' && (
        <div className={s.two}>
          <div className="field"><label htmlFor="f-date">Wedding date <small>(if you know it)</small></label><input id="f-date" name="wedding_date" type="month" className="input" /></div>
          <div className="field"><label htmlFor="f-where">Where</label><input id="f-where" name="location" className="input" placeholder="e.g. Cotswolds" /></div>
        </div>
      )}
      {kind === 'contact' && <div className="field"><label htmlFor="f-msg">Message</label><textarea id="f-msg" name="message" className="input" required /></div>}
      <input type="checkbox" name="botcheck" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className={`btn ${s.submit}`} disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : kind === 'signup' ? 'Get early access' : kind === 'login' ? 'Log in' : 'Send message'} <Icon name="arrow" />
      </button>
      {state === 'error' && <p className={s.err} role="alert">Something went wrong — please try again.</p>}
    </form>
  );
}
