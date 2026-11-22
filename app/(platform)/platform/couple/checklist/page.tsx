import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { bookingsForCouple, weddingFor } from '@/platform/data';
import { toggleTask } from '@/platform/actions/couple';
import { buildTasks, groupOf, type Task } from '@/platform/tasks';
import { Head, Shell, s } from '@/platform/ui';
import { fmtDate, isBooked, todayISO } from '@/platform/util';

export const metadata = { title: 'Checklist' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const sql = await db();
  const [bookings, ticks, gs] = await Promise.all([
    bookingsForCouple(u.id),
    sql<{ key: string }[]>`select key from tasks_done where wedding_id = ${w.id}`,
    sql<{ invited: boolean }[]>`select invited from guests where wedding_id = ${w.id}`,
  ]);
  const tasks = buildTasks(w.date, new Set(bookings.filter((b) => isBooked(b.status)).map((b) => b.category)), new Set(ticks.map((t) => t.key)), { guests: gs.length, invitesSent: gs.some((g) => g.invited), hasBudget: w.budget > 0 });
  const v = sp.v === 'todo' ? 'todo' : 'all';
  const list = v === 'todo' ? tasks.filter((t) => !t.done) : tasks;
  const groups = new Map<string, Task[]>();
  for (const t of list) { const g = groupOf(t.due, w.date); groups.set(g, [...(groups.get(g) ?? []), t]); }
  const done = tasks.filter((t) => t.done).length;
  const today = todayISO();
  return (
    <Shell user={u} active="checklist">
      <Head title="Checklist & timeline" kicker={w.date ? `Built from your date, ${fmtDate(w.date)}, and what you’ve booked` : 'Add your wedding date to set the timeline'} />
      <div className={s.card}>
        <div className={s.row}><b>{Math.round((done / tasks.length) * 100)}% complete</b><span className={s.muted}>{tasks.filter((t) => !t.done && t.due < today).length} overdue</span></div>
        <div className={s.bar}><span style={{ width: `${(done / tasks.length) * 100}%` }} /></div>
        <p className={s.muted} style={{ fontSize: '.8rem' }}>Supplier tasks tick themselves off when you book.</p>
      </div>
      <div className={s.chips}><Link href="?v=all" className={`${s.chip} ${v === 'all' ? s.on : ''}`}>Full timeline</Link><Link href="?v=todo" className={`${s.chip} ${v === 'todo' ? s.on : ''}`}>Still to do</Link></div>
      {[...groups.entries()].map(([g, ts]) => (
        <div key={g} className={s.card}>
          <b className={s.h3}>{g}</b>
          <div className={s.list}>
            {ts.map((t) => (
              <div key={t.key} className={s.li}>
                <span><b style={t.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{t.title}</b>
                  <small className={!t.done && t.due < today ? s.over : ''}>{t.note || (t.done ? 'Done' : `By ${fmtDate(t.due, { month: 'short', year: 'numeric' })}`)}{t.cat && !t.done ? <> · <Link href={`/platform/couple/explore?cat=${encodeURIComponent(t.cat)}`}>find {t.cat.toLowerCase()}</Link></> : null}</small></span>
                {t.auto ? <span className={`${s.tag} ${s.t_ok}`}>✓ Auto</span> : (
                  <form action={toggleTask}><input type="hidden" name="key" value={t.key} /><input type="hidden" name="v" value={v} /><button className={`${s.btn} ${t.done ? s.ghost : ''} ${s.sm}`}>{t.done ? 'Undo' : 'Done'}</button></form>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Shell>
  );
}
