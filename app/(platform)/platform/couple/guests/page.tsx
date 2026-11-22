import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { weddingFor } from '@/platform/data';
import { addGuest, updateGuest, deleteGuest, sendInvites } from '@/platform/actions/couple';
import { mailConfigured } from '@/platform/mail';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { fmtDate } from '@/platform/util';

export const metadata = { title: 'Guest list' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type Guest = { id: string; name: string; side: string; plus_ones: number; rsvp: string; plus_coming: number; dietary: string; email: string; phone: string; invited: boolean };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const sql = await db();
  const all = await sql<Guest[]>`select id, name, side, plus_ones, rsvp, plus_coming, dietary, email, phone, invited from guests where wedding_id = ${w.id} order by created_at`;
  const f = typeof sp.f === 'string' ? sp.f : 'all';
  const shown = all.filter((g) => f === 'all' || g.rsvp === f);
  const attending = all.filter((g) => g.rsvp === 'yes').reduce((t, g) => t + 1 + g.plus_coming, 0);
  const awaiting = all.filter((g) => g.rsvp === 'awaiting').reduce((t, g) => t + 1 + g.plus_ones, 0);
  const declined = all.filter((g) => g.rsvp === 'no').length;
  const dietary = all.filter((g) => g.dietary && g.rsvp !== 'no').length;
  const withEmail = all.filter((g) => g.email);
  const opts = (g: Guest) => [['awaiting', 'Awaiting reply'], ['yes-0', 'Attending'], ...Array.from({ length: g.plus_ones }, (_, i) => [`yes-${i + 1}`, `Attending with +${i + 1}`]), ['no', 'Not able to attend']];
  const val = (g: Guest) => (g.rsvp === 'yes' ? `yes-${g.plus_coming}` : g.rsvp);
  return (
    <Shell user={u} active="guests">
      <Head title="Guest list" kicker={`${all.length} invitations · planning for ${w.guests}`} />
      <Flash sp={sp} />
      <div className={s.grid4}>
        <div className={`${s.card} ${s.kpi}`}><span>Attending</span><b>{attending}</b><span>guests incl. +1s</span></div>
        <div className={`${s.card} ${s.kpi}`}><span>Awaiting reply</span><b>{awaiting}</b><span>could still come</span></div>
        <div className={`${s.card} ${s.kpi}`}><span>Can’t attend</span><b>{declined}</b><span>invitations</span></div>
        <div className={`${s.card} ${s.kpi}`}><span>Dietary needs</span><b>{dietary}</b><span>to tell your caterer</span></div>
      </div>
      <div className={s.split}>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.chips}>{[['all', 'Everyone'], ['yes', 'Attending'], ['awaiting', 'Awaiting'], ['no', 'Can’t attend']].map(([k, l]) => <Link key={k} href={`?f=${k}`} className={`${s.chip} ${f === k ? s.on : ''}`}>{l}</Link>)}</div>
          <div className={s.card}>
            <div className={s.list}>
              {shown.map((g) => (
                <div key={g.id} className={s.li}>
                  <span><b>{g.name}</b><small>{[g.side, g.plus_ones ? `+${g.plus_ones} allowed` : 'no +1', g.dietary, g.email].filter(Boolean).join(' · ')}{g.invited ? ' · invited' : ''}</small></span>
                  <span className={s.btnRow}>
                    <form action={updateGuest} className={s.btnRow}>
                      <input type="hidden" name="id" value={g.id} /><input type="hidden" name="f" value={f} />
                      <select name="rsvp" className={s.input} defaultValue={val(g)} aria-label={`RSVP for ${g.name}`} style={{ minHeight: 36, padding: '4px 10px', fontSize: '.8rem', width: 'auto' }}>{opts(g).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      <Submit className={`${s.ghost} ${s.sm}`} pending="…">Update</Submit>
                    </form>
                    <form action={deleteGuest}><input type="hidden" name="id" value={g.id} /><button className={`${s.btn} ${s.ghost} ${s.sm}`} aria-label={`Remove ${g.name}`}>✕</button></form>
                  </span>
                </div>
              ))}
              {!shown.length && <p className={s.empty}>No guests here yet.</p>}
            </div>
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          <form action={addGuest} className={`${s.card} ${s.form}`}>
            <b className={s.h3}>Add a guest</b>
            <div className={s.field}><label htmlFor="g-n">Name</label><input id="g-n" name="name" className={s.input} required /></div>
            <div className={s.f2}>
              <div className={s.field}><label htmlFor="g-s">Side</label><input id="g-s" name="side" className={s.input} placeholder="e.g. Sophie’s family" /></div>
              <div className={s.field}><label htmlFor="g-p">Plus-ones</label><select id="g-p" name="plus_ones" className={s.input}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n ? `+${n}` : 'None'}</option>)}</select></div>
              <div className={s.field}><label htmlFor="g-e">Email</label><input id="g-e" name="email" type="email" className={s.input} /></div>
              <div className={s.field}><label htmlFor="g-ph">Mobile</label><input id="g-ph" name="phone" className={s.input} /></div>
            </div>
            <div className={s.field}><label htmlFor="g-d">Dietary requirements</label><input id="g-d" name="dietary" className={s.input} placeholder="e.g. Vegetarian" /></div>
            <Submit className={s.sm}>Add guest</Submit>
          </form>
          <form action={sendInvites} className={`${s.card} ${s.form}`}>
            <b className={s.h3}>Send e-invites</b>
            {!mailConfigured() && <p className={s.notice}>Email sending is switched on before launch.</p>}
            <p className={s.muted}>{withEmail.length} guest{withEmail.length === 1 ? '' : 's'} with an email address.</p>
            <div className={s.field}><label htmlFor="inv-m">Your message</label><textarea id="inv-m" name="message" className={s.input} defaultValue={`Together with their families, ${w.names || 'we'} request the pleasure of your company at their wedding${w.date ? ` on ${fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : ''}${w.place ? ` in ${w.place}` : ''}.`} /></div>
            <div className={s.stack} style={{ maxHeight: 200, overflowY: 'auto' }}>{withEmail.map((g) => <label key={g.id} className={s.check}><input type="checkbox" name="ids" value={g.id} defaultChecked={!g.invited} />{g.name} <span className={s.muted}>{g.email}{g.invited ? ' · already invited' : ''}</span></label>)}</div>
            <Submit className={s.sm} pending="Sending…">Send invites</Submit>
          </form>
        </div>
      </div>
    </Shell>
  );
}
