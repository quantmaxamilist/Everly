import Link from 'next/link';
import Icon from '@/components/Icon';
import { db } from '@/platform/db';
import { requireUser } from '@/platform/auth';
import { bookingsForCouple, weddingFor } from '@/platform/data';
import { removeFromPlan } from '@/platform/actions/couple';
import { Submit } from '@/platform/client';
import { Flash, Head, Shell, StatusTag, s } from '@/platform/ui';
import { CATEGORIES, CAT_ICON, extraTotal, gbp, pkgTotal } from '@/platform/util';

export const metadata = { title: 'My plan' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const sql = await db();
  const items = await sql<{ id: string; supplier_id: string; supplier_name: string; category: string; cover: string | null; pkg_name: string; price: number; per_guest: boolean; extras: { name: string; price: number; per_guest: boolean }[] | null }[]>`
    select i.id, s.id as supplier_id, s.name as supplier_name, s.category,
      (select url from photos p where p.supplier_id = s.id order by position, created_at limit 1) as cover,
      k.name as pkg_name, k.price, k.per_guest,
      (select json_agg(json_build_object('name', e.name, 'price', e.price, 'per_guest', e.per_guest)) from extras e where e.id = any(i.extras)) as extras
    from plan_items i join suppliers s on s.id = i.supplier_id join packages k on k.id = i.package_id where i.wedding_id = ${w.id} order by s.category`;
  const bookings = (await bookingsForCouple(u.id)).filter((b) => b.status !== 'declined' && b.status !== 'cancelled');
  const itemTotal = (i: (typeof items)[number]) => pkgTotal(i, w.guests) + (i.extras ?? []).reduce((t, x) => t + extraTotal(x, w.guests), 0);
  const total = items.reduce((t, i) => t + itemTotal(i), 0) + bookings.reduce((t, b) => t + b.total, 0);
  const over = total > w.budget;
  const have = new Set([...items.map((i) => i.category), ...bookings.map((b) => b.category)]);
  const missing = CATEGORIES.filter((c) => !have.has(c)).slice(0, 8);
  return (
    <Shell user={u} active="plan">
      <Head title="My plan" kicker={`${w.guests} guests · budget ${gbp(w.budget)}`}><Link href="/platform/couple/explore" className={`${s.btn} ${s.sm}`}>Add suppliers</Link></Head>
      <Flash sp={sp} />
      <div className={s.split}>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.card}>
            <b className={s.h3}>Shortlisted</b>
            <div className={s.list}>
              {items.map((i) => (
                <div key={i.id} className={s.li}>
                  <span><b><Link href={`/platform/couple/s/${i.supplier_id}`}>{i.supplier_name}</Link></b><small>{i.category} · {i.pkg_name}{i.extras?.length ? ` + ${i.extras.map((x) => x.name).join(', ')}` : ''} · {gbp(itemTotal(i))}</small></span>
                  <span className={s.btnRow}>
                    <Link href={`/platform/couple/s/${i.supplier_id}#enquire`} className={`${s.btn} ${s.sm}`}>Send request</Link>
                    <form action={removeFromPlan}><input type="hidden" name="id" value={i.id} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Remove</Submit></form>
                  </span>
                </div>
              ))}
              {!items.length && <p className={s.empty}>Nothing shortlisted. On a supplier’s page choose a package and tap “Add to my plan”.</p>}
            </div>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Requests & bookings</b>
            <div className={s.list}>
              {bookings.map((b) => (
                <Link key={b.id} href={`/platform/couple/bookings/${b.id}`} className={s.li}>
                  <span><b>{b.supplier_name}</b><small>{b.category} · {b.package_name} · {gbp(b.total)}</small></span>
                  <StatusTag status={b.status} side="couple" />
                </Link>
              ))}
              {!bookings.length && <p className={s.empty}>No requests sent yet.</p>}
            </div>
          </div>
        </div>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.cardDark}>
            <span className={s.muted}>Plan total · {w.guests} guests</span>
            <b className={s.big}>{gbp(total)}</b>
            <div className={s.bar}><span style={{ width: `${Math.min(100, (total / Math.max(1, w.budget)) * 100)}%` }} /></div>
            <span className={over ? s.over : s.muted} style={over ? { color: '#f0b9a6' } : undefined}>{over ? `${gbp(total - w.budget)} over your ${gbp(w.budget)} budget` : `${gbp(w.budget - total)} left of ${gbp(w.budget)}`}</span>
            <Link href="/platform/couple/settings" className={s.muted} style={{ textDecoration: 'underline' }}>Change budget or guests</Link>
          </div>
          {missing.length > 0 && (
            <div className={s.card}>
              <b className={s.h3}>Still to find</b>
              <div className={s.chips}>{missing.map((c) => <Link key={c} href={`/platform/couple/explore?cat=${encodeURIComponent(c)}`} className={s.chip}><Icon name={CAT_ICON[c]} />{c}</Link>)}</div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
