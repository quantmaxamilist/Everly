import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConfigured } from '@/platform/db';
import { currentUser, hasGate, homeFor } from '@/platform/auth';
import { loginAction, logoutAction } from '@/platform/actions/auth';
import { AuthPage, Flash, s } from '@/platform/ui';
import { Submit } from '@/platform/client';

export async function LoginView({ sp, admin }: { sp: Record<string, string | string[] | undefined>; admin?: boolean }) {
  if (!dbConfigured() || !(await hasGate())) redirect(admin ? '/platform?next=/admin/login' : '/platform');
  const u = await currentUser();
  if (u && admin && u.role !== 'admin') {
    return (
      <AuthPage>
        <div><p className={s.kicker}>Asteria admin</p><h1>Switch account</h1></div>
        <p className={s.muted}>This browser is signed in as <b>{u.name || u.email}</b> ({u.role}). Log out to sign in to the admin panel.</p>
        <form action={logoutAction}><input type="hidden" name="to" value="admin" /><Submit className={s.full} pending="Logging out…">Log out and continue to admin</Submit></form>
        <Link href={homeFor(u.role)} className={`${s.btn} ${s.ghost} ${s.full}`}>Stay in my {u.role} account</Link>
      </AuthPage>
    );
  }
  if (u) redirect(homeFor(u.role));
  return (
    <AuthPage>
      <div><p className={s.kicker}>{admin ? 'Asteria admin' : 'Welcome back'}</p><h1>Log in</h1></div>
      <Flash sp={sp} />
      <form action={loginAction} className={s.form}>
        <input type="hidden" name="back" value={admin ? 'admin' : ''} />
        <div className={s.field}><label htmlFor="em">Email</label><input id="em" name="email" type="email" className={s.input} required autoComplete="email" defaultValue={typeof sp.email === 'string' ? sp.email : ''} /></div>
        <div className={s.field}><label htmlFor="pw">Password</label><input id="pw" name="password" type="password" className={s.input} required autoComplete="current-password" /></div>
        <Submit className={s.full} pending="Logging in…">Log in</Submit>
      </form>
      {!admin && <p className={s.muted}>New to Asteria? <Link href="/platform/signup?role=couple">Create a couple account</Link> or <Link href="/platform/signup?role=supplier">list your business</Link>.</p>}
      <p className={s.muted} style={{ fontSize: '.78rem' }}>Forgotten your password? Email hello@asteria-events.com and we’ll reset it.</p>
    </AuthPage>
  );
}

