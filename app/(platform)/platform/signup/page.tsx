import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConfigured } from '@/platform/db';
import { currentUser, hasGate, homeFor } from '@/platform/auth';
import { signupAction } from '@/platform/actions/auth';
import { AuthPage, Flash, s } from '@/platform/ui';
import { Submit } from '@/platform/client';
import { CATEGORIES, REGIONS } from '@/platform/util';

export const metadata = { title: 'Create an account' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  if (!dbConfigured() || !(await hasGate())) redirect('/platform');
  const u = await currentUser();
  if (u) redirect(homeFor(u.role));
  const role = sp.role === 'supplier' ? 'supplier' : 'couple';
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  return (
    <AuthPage>
      <div><p className={s.kicker}>Create your account</p><h1>{role === 'supplier' ? 'List your business' : 'Start planning'}</h1></div>
      <div className={s.roleSeg}>
        <Link href="/platform/signup?role=couple" className={role === 'couple' ? s.on : ''}>We’re a couple</Link>
        <Link href="/platform/signup?role=supplier" className={role === 'supplier' ? s.on : ''}>I’m a supplier</Link>
      </div>
      <Flash sp={sp} />
      <form action={signupAction} className={s.form}>
        <input type="hidden" name="role" value={role} />
        <div className={s.field}><label htmlFor="nm">{role === 'supplier' ? 'Your name' : 'Your names'}</label><input id="nm" name="name" className={s.input} required defaultValue={v('name')} placeholder={role === 'couple' ? 'e.g. Sophie & James' : ''} autoComplete="name" /></div>
        {role === 'supplier' && (
          <>
            <div className={s.field}><label htmlFor="bz">Business name</label><input id="bz" name="business" className={s.input} required /></div>
            <div className={s.f2}>
              <div className={s.field}><label htmlFor="ct">Category</label><select id="ct" name="category" className={s.input} required defaultValue=""><option value="" disabled>Choose…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className={s.field}><label htmlFor="rg">Region</label><select id="rg" name="region" className={s.input} defaultValue=""><option value="">Choose…</option>{REGIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div className={s.field}><label htmlFor="tw">Town</label><input id="tw" name="town" className={s.input} /></div>
          </>
        )}
        <div className={s.field}><label htmlFor="em">Email</label><input id="em" name="email" type="email" className={s.input} required defaultValue={v('email')} autoComplete="email" /></div>
        <div className={s.field}><label htmlFor="pw">Password <small>(at least 8 characters)</small></label><input id="pw" name="password" type="password" className={s.input} required minLength={8} autoComplete="new-password" /></div>
        <label className={s.check}><input type="checkbox" name="terms" required /><span>I agree to the Asteria <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.</span></label>
        <Submit className={s.full} pending="Creating account…">Create account</Submit>
      </form>
      <p className={s.muted}>Already have an account? <Link href="/platform/login">Log in</Link></p>
    </AuthPage>
  );
}
