import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConfigured } from '@/platform/db';
import { currentUser, gateConfigured, hasGate, homeFor, safeNext } from '@/platform/auth';
import { unlockAction } from '@/platform/actions/auth';
import { AuthPage, Flash, s } from '@/platform/ui';
import { Submit } from '@/platform/client';

type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  if (!dbConfigured()) {
    return (
      <AuthPage>
        <h1>Almost ready</h1>
        <p className={s.muted}>The Asteria platform needs its database connecting. In Vercel, open the project → <b>Storage</b> → create a <b>Postgres (Neon)</b> database and connect it, then redeploy.</p>
      </AuthPage>
    );
  }
  if (!(await gateConfigured())) {
    return (
      <AuthPage>
        <h1>Set up Asteria</h1>
        <p className={s.muted}>The platform hasn’t been set up yet. Create the admin account and the platform password to get started.</p>
        <Link href="/admin/setup" className={`${s.btn} ${s.full}`}>Start setup</Link>
      </AuthPage>
    );
  }
  if (!(await hasGate())) {
    return (
      <AuthPage>
        <div><p className={s.kicker}>Private preview</p><h1>The Asteria platform</h1></div>
        <p className={s.muted}>Asteria isn’t open to the public yet. Enter the platform password to continue.</p>
        <Flash sp={sp} />
        <form action={unlockAction} className={s.form}>
          <input type="hidden" name="next" value={safeNext(sp.next)} />
          <div className={s.field}><label htmlFor="pw">Platform password</label><input id="pw" name="password" type="password" className={s.input} required autoFocus autoComplete="current-password" /></div>
          <Submit className={s.full} pending="Checking…">Continue</Submit>
        </form>
        <p className={s.muted}>Looking for early access? <Link href="/signup">Join the list</Link></p>
      </AuthPage>
    );
  }
  const next = safeNext(sp.next);
  if (next) redirect(next);
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  return (
    <AuthPage>
      <div><p className={s.kicker}>Welcome to</p><h1>Asteria</h1></div>
      <p className={s.muted}>Plan your wedding, or run your wedding business — all in one place.</p>
      <div className={s.stack}>
        <Link href="/platform/signup?role=couple" className={`${s.btn} ${s.full}`}>We’re getting married</Link>
        <Link href="/platform/signup?role=supplier" className={`${s.btn} ${s.ghost} ${s.full}`}>I’m a wedding supplier</Link>
      </div>
      <p className={s.muted}>Already have an account? <Link href="/platform/login">Log in</Link></p>
      <p className={s.muted} style={{ fontSize: '.78rem' }}>Asteria team? <Link href="/admin/login">Admin log in</Link></p>
    </AuthPage>
  );
}
