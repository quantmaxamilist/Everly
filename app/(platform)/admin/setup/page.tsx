import { redirect } from 'next/navigation';
import { dbConfigured } from '@/platform/db';
import { adminExists } from '@/platform/auth';
import { setupAction } from '@/platform/actions/auth';
import { AuthPage, Flash, s } from '@/platform/ui';
import { Submit } from '@/platform/client';

export const metadata = { title: 'Set up Asteria' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  if (!dbConfigured()) redirect('/platform');
  if (await adminExists()) redirect('/admin/login');
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  return (
    <AuthPage>
      <div><p className={s.kicker}>One-time setup</p><h1>Set up Asteria</h1></div>
      <p className={s.muted}>Create the admin account, and choose the password that keeps the platform private until launch.</p>
      <Flash sp={sp} />
      <form action={setupAction} className={s.form}>
        <div className={s.field}><label htmlFor="nm">Admin name</label><input id="nm" name="name" className={s.input} defaultValue={v('name')} /></div>
        <div className={s.field}><label htmlFor="em">Admin email</label><input id="em" name="email" type="email" className={s.input} required defaultValue={v('email')} /></div>
        <div className={s.field}><label htmlFor="pw">Admin password <small>(at least 10 characters)</small></label><input id="pw" name="password" type="password" className={s.input} required minLength={10} autoComplete="new-password" /></div>
        <div className={s.field}><label htmlFor="gt">Platform password <small>(what testers type to get in)</small></label><input id="gt" name="gate" className={s.input} required minLength={6} /></div>
        <Submit className={s.full} pending="Setting up…">Finish setup</Submit>
      </form>
    </AuthPage>
  );
}
