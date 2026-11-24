import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConfigured } from '@/platform/db';
import { currentUser, hasGate, homeFor } from '@/platform/auth';
import { sendCodeAction, verifyCodeAction } from '@/platform/actions/auth';
import { mailConfigured } from '@/platform/mail';
import { AuthPage, Flash, s } from '@/platform/ui';
import { Submit } from '@/platform/client';

/** "Email me a sign-in code" — step 1 asks for the email, step 2 takes the 6-digit code. */
export async function CodeLoginView({ sp, admin }: { sp: Record<string, string | string[] | undefined>; admin?: boolean }) {
  const self = admin ? '/admin/login/code' : '/platform/login/code';
  if (!dbConfigured() || !(await hasGate())) redirect('/platform?next=' + self);
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  const email = typeof sp.email === 'string' ? sp.email : '';
  const sent = sp.sent === '1' && !!email;
  const back = admin ? '/admin/login' : '/platform/login';
  return (
    <AuthPage>
      <div><p className={s.kicker}>{admin ? 'Asteria admin' : 'Forgotten your password?'}</p><h1>{sent ? 'Check your email' : 'Sign in with a code'}</h1></div>
      <Flash sp={sp} />
      {!mailConfigured() ? (
        <p className={s.muted}>Email sign-in isn&rsquo;t switched on yet. Contact <a href="mailto:hello@asteria-events.com">hello@asteria-events.com</a> and we&rsquo;ll reset your password.</p>
      ) : sent ? (
        <>
          <p className={s.muted}>If <b>{email}</b> has an Asteria account, we&rsquo;ve sent it a 6-digit code. It expires in 10 minutes. Check your junk folder if it doesn&rsquo;t arrive.</p>
          <form action={verifyCodeAction} className={s.form}>
            <input type="hidden" name="back" value={admin ? 'admin' : ''} />
            <input type="hidden" name="email" value={email} />
            <div className={s.field}><label htmlFor="cd">Sign-in code</label><input id="cd" name="code" className={s.input} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="123456" autoFocus style={{ letterSpacing: '.3em', fontSize: '1.2rem' }} /></div>
            <Submit className={s.full} pending="Checking…">Sign in</Submit>
          </form>
          <form action={sendCodeAction}>
            <input type="hidden" name="back" value={admin ? 'admin' : ''} />
            <input type="hidden" name="email" value={email} />
            <p className={s.muted}>No email? <button className={s.linkBtn}>Send a new code</button></p>
          </form>
        </>
      ) : (
        <>
          <p className={s.muted}>Enter the email you use for Asteria and we&rsquo;ll send you a 6-digit sign-in code. You can then set a new password.</p>
          <form action={sendCodeAction} className={s.form}>
            <input type="hidden" name="back" value={admin ? 'admin' : ''} />
            <div className={s.field}><label htmlFor="em">Email</label><input id="em" name="email" type="email" className={s.input} required autoComplete="email" defaultValue={email} autoFocus /></div>
            <Submit className={s.full} pending="Sending…">Email me a code</Submit>
          </form>
        </>
      )}
      <p className={s.muted}><Link href={back}>← Back to log in with a password</Link></p>
    </AuthPage>
  );
}
