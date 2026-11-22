import { requireUser } from '@/platform/auth';
import { weddingFor } from '@/platform/data';
import { saveWedding } from '@/platform/actions/couple';
import { changePasswordAction } from '@/platform/actions/auth';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { REGIONS } from '@/platform/util';

export const metadata = { title: 'Wedding details' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const welcome = sp.welcome === '1';
  return (
    <Shell user={u} active="settings">
      <Head title={welcome ? 'Tell us about your wedding' : 'Wedding details'} kicker={welcome ? 'Welcome to Asteria' : 'Prices, availability and your checklist update from these'} />
      <Flash sp={sp} />
      <div className={s.split}>
        <form action={saveWedding} className={`${s.card} ${s.form}`}>
          {welcome && <input type="hidden" name="welcome" value="1" />}
          <div className={s.field}><label htmlFor="w-n">Your names</label><input id="w-n" name="names" className={s.input} defaultValue={w.names} placeholder="e.g. Sophie & James" /></div>
          <div className={s.f2}>
            <div className={s.field}><label htmlFor="w-d">Wedding date <small>(if you know it)</small></label><input id="w-d" name="date" type="date" className={s.input} defaultValue={w.date ?? ''} /></div>
            <div className={s.field}><label htmlFor="w-r">Region</label><select id="w-r" name="region" className={s.input} defaultValue={w.region}><option value="">Not decided</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
            <div className={s.field}><label htmlFor="w-p">Town or venue area</label><input id="w-p" name="place" className={s.input} defaultValue={w.place} placeholder="e.g. Bath" /></div>
            <div className={s.field}><label htmlFor="w-g">Guests</label><input id="w-g" name="guests" inputMode="numeric" className={s.input} defaultValue={w.guests} /></div>
          </div>
          <div className={s.field}><label htmlFor="w-b">Total budget (£)</label><input id="w-b" name="budget" inputMode="numeric" className={s.input} defaultValue={w.budget} /></div>
          <Submit>{welcome ? 'Save & find suppliers' : 'Save details'}</Submit>
        </form>
        <form action={changePasswordAction} className={`${s.card} ${s.form}`}>
          <input type="hidden" name="back" value="/platform/couple/settings" />
          <b className={s.h3}>Account</b>
          <p className={s.muted}>{u.email}</p>
          <div className={s.field}><label htmlFor="cp1">Current password</label><input id="cp1" name="current" type="password" className={s.input} required autoComplete="current-password" /></div>
          <div className={s.field}><label htmlFor="cp2">New password</label><input id="cp2" name="next" type="password" className={s.input} required minLength={8} autoComplete="new-password" /></div>
          <Submit className={`${s.ghost} ${s.sm}`}>Change password</Submit>
        </form>
      </div>
    </Shell>
  );
}
