import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/platform/db';
import { currentUser, homeFor } from '@/platform/auth';
import { setNewPasswordAction } from '@/platform/actions/auth';
import { AuthPage, Flash, s } from '@/platform/ui';
import { Submit } from '@/platform/client';

export const metadata = { title: 'Set a new password' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await currentUser();
  if (!u) redirect('/platform/login');
  const sql = await db();
  const [r] = await sql<{ ok: boolean }[]>`select coalesce(reset_allowed_until > now(), false) as ok from users where id = ${u.id}`;
  if (!r?.ok) redirect(homeFor(u.role));
  const min = u.role === 'admin' ? 10 : 8;
  return (
    <AuthPage>
      <div><p className={s.kicker}>You&rsquo;re signed in</p><h1>Set a new password</h1></div>
      <p className={s.muted}>Choose a new password for <b>{u.email}</b> so you can log in normally next time.</p>
      <Flash sp={sp} />
      <form action={setNewPasswordAction} className={s.form}>
        <div className={s.field}><label htmlFor="np">New password <small>(at least {min} characters)</small></label><input id="np" name="next" type="password" className={s.input} required minLength={min} autoComplete="new-password" autoFocus /></div>
        <div className={s.field}><label htmlFor="cp">Type it again</label><input id="cp" name="confirm" type="password" className={s.input} required minLength={min} autoComplete="new-password" /></div>
        <Submit className={s.full} pending="Saving…">Save new password</Submit>
      </form>
      <p className={s.muted}><Link href={homeFor(u.role)}>Skip for now</Link></p>
    </AuthPage>
  );
}
