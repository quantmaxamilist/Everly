import Link from 'next/link';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { setUserStatus, resetUserPassword } from '@/platform/actions/admin';
import { ConfirmSubmit, Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { fmtDate } from '@/platform/util';

export const metadata = { title: 'Users' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('admin');
  const role = typeof sp.r === 'string' && ['couple', 'supplier', 'admin'].includes(sp.r) ? sp.r : 'all';
  const q = typeof sp.q === 'string' ? sp.q : '';
  const sql = await db();
  const rows = await sql<{ id: string; email: string; name: string; role: string; status: string; created_at: Date; last_login: Date | null }[]>`
    select id, email, name, role, status, created_at, last_login from users
    where (${role} = 'all' or role = ${role}) and (${q} = '' or email ilike ${'%' + q + '%'} or name ilike ${'%' + q + '%'})
    order by created_at desc limit 500`;
  return (
    <Shell user={u} active="users">
      <Head title="Users" kicker={`${rows.length} shown`} />
      <Flash sp={sp} />
      <div className={s.row}>
        <div className={s.chips}>{[['all', 'All'], ['couple', 'Couples'], ['supplier', 'Suppliers'], ['admin', 'Admins']].map(([k, l]) => <Link key={k} href={`?r=${k}`} className={`${s.chip} ${role === k ? s.on : ''}`}>{l}</Link>)}</div>
        <form className={s.btnRow}><input type="hidden" name="r" value={role} /><input name="q" defaultValue={q} className={s.input} placeholder="Search name or email" style={{ width: 220 }} /><button className={`${s.btn} ${s.ghost} ${s.sm}`}>Search</button></form>
      </div>
      <div className={`${s.card} ${s.tableWrap}`}>
        <table className={s.table}>
          <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Last log-in</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name || '—'}<br /><small className={s.muted}>{r.email}</small></td>
                <td style={{ textTransform: 'capitalize' }}>{r.role}</td><td>{fmtDate(r.created_at)}</td><td>{r.last_login ? fmtDate(r.last_login) : '—'}</td>
                <td><span className={`${s.tag} ${r.status === 'active' ? s.t_ok : s.t_warn}`}>{r.status}</span></td>
                <td>
                  <div className={s.btnRow} style={{ flexWrap: 'nowrap' }}>
                    <form action={resetUserPassword}><input type="hidden" name="id" value={r.id} /><ConfirmSubmit className={`${s.ghost} ${s.sm}`} confirm="Reset password">Reset password</ConfirmSubmit></form>
                    {r.id !== u.id && <form action={setUserStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={r.status === 'active' ? 'suspended' : 'active'} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">{r.status === 'active' ? 'Suspend' : 'Re-activate'}</Submit></form>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
