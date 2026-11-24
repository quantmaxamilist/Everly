import Link from 'next/link';
import Icon from '@/components/Icon';
import { requireUser } from '@/platform/auth';
import { bookingsForCouple, weddingFor } from '@/platform/data';
import { deletePlan, newPlan, removeFromPlan, renamePlan, swapInPlan } from '@/platform/actions/couple';
import { ConfirmSubmit, Submit } from '@/platform/client';
import { findSavings, isPlus, itemTotal, planItems, plansFor } from '@/platform/plus';
import { Flash, Head, Shell, StatusTag, s } from '@/platform/ui';
import { CATEGORIES, CAT_ICON, gbp } from '@/platform/util';

export const metadata = { title: 'My plan' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('couple');
  const w = (await weddingFor(u.id))!;
  const [plans, plus, allBookings] = await Promise.all([plansFor(w.id), isPlus(u.id), bookingsForCouple(u.id)]);
  const bookings = allBookings.filter((b) => b.status !== 'declined' && b.status !== 'cancelled');
  const bookedTotal = bookings.reduce((t, b) => t + b.total, 0);
  const compare = sp.compare === '1' && plus && plans.length > 1;
  const plan = plans.find((p) => p.id === sp.p) ?? plans[0];
  const items = await planItems(plan.id);
  const total = items.reduce((t, i) => t + itemTotal(i, w.guests), 0) + bookedTotal;
  const over = total > w.budget;
  const savings = await findSavings(w, items);
  const potential = savings.reduce((t, x) => t + x.save, 0);
  const have = new Set([...items.map((i) => i.category), ...bookings.map((b) => b.category)]);
  const missing = CATEGORIES.filter((c) => !have.has(c)).slice(0, 8);

  // compare view: totals per category across all plans
  const all = compare ? await Promise.all(plans.map(async (p) => ({ p, items: await planItems(p.id) }))) : [];
  const cats = compare ? CATEGORIES.filter((c) => all.some((x) => x.items.some((i) => i.category === c))) : [];

  return (
    <Shell user={u} active="plan">
      <Head title="My plan" kicker={`${w.guests} guests · budget ${gbp(w.budget)}`}><Link href="/platform/couple/explore" className={`${s.btn} ${s.sm}`}>Add suppliers</Link></Head>
      <Flash sp={sp} />

      <div className={s.row}>
        <div className={s.chips}>
          {plans.map((p) => <Link key={p.id} href={`?p=${p.id}`} className={`${s.chip} ${!compare && p.id === plan.id ? s.on : ''}`}>{p.name}</Link>)}
          {plus && plans.length > 1 && <Link href="?compare=1" className={`${s.chip} ${compare ? s.on : ''}`}><Icon name="compare" />Compare</Link>}
        </div>
        {plus ? (
          <form action={newPlan} className={s.btnRow}>
            <input type="hidden" name="copy" value={plan.id} />
            <input name="name" className={s.input} placeholder="New plan name" aria-label="New plan name" style={{ width: 170, minHeight: 36, padding: '4px 12px' }} />
            <Submit className={`${s.ghost} ${s.sm}`} pending="…">+ Copy this plan</Submit>
          </form>
        ) : <Link href="/platform/couple/plus" className={`${s.btn} ${s.ghost} ${s.sm}`}><span className={s.plusBadge}>Plus</span>Make more plans</Link>}
      </div>

      {compare ? (
        <div className={`${s.card} ${s.tableWrap}`}>
          <table className={s.table}>
            <thead><tr><th>Category</th>{all.map(({ p }) => <th key={p.id}><Link href={`?p=${p.id}`}>{p.name}</Link></th>)}</tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c}><td>{c}</td>{all.map(({ p, items: it }) => { const i = it.find((x) => x.category === c); return <td key={p.id}>{i ? <><b>{gbp(itemTotal(i, w.guests))}</b><br /><small className={s.muted}>{i.supplier_name}</small></> : <span className={s.muted}>—</span>}</td>; })}</tr>
              ))}
              {bookedTotal > 0 && <tr><td>Already booked</td>{all.map(({ p }) => <td key={p.id}>{gbp(bookedTotal)}</td>)}</tr>}
              <tr><td><b>Total</b></td>{all.map(({ p, items: it }) => { const t = it.reduce((a, i) => a + itemTotal(i, w.guests), 0) + bookedTotal; return <td key={p.id}><b>{gbp(t)}</b><br /><small className={t > w.budget ? s.over : s.muted}>{t > w.budget ? `${gbp(t - w.budget)} over` : `${gbp(w.budget - t)} under`}</small></td>; })}</tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className={s.split}>
          <div className={s.stack} style={{ gap: 16 }}>
            <div className={s.card}>
              <div className={s.row}><b className={s.h3}>{plan.name}</b>
                {plus && (
                  <span className={s.btnRow}>
                    <form action={renamePlan} className={s.btnRow}><input type="hidden" name="plan" value={plan.id} /><input name="name" defaultValue={plan.name} className={s.input} aria-label="Plan name" style={{ width: 150, minHeight: 34, padding: '4px 10px' }} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Rename</Submit></form>
                    {plans.length > 1 && <form action={deletePlan}><input type="hidden" name="plan" value={plan.id} /><ConfirmSubmit className={`${s.ghost} ${s.sm}`} confirm="Delete plan">Delete</ConfirmSubmit></form>}
                  </span>
                )}
              </div>
              <div className={s.list}>
                {items.map((i) => (
                  <div key={i.id} className={s.li}>
                    <span><b><Link href={`/platform/couple/s/${i.supplier_id}`}>{i.supplier_name}</Link></b><small>{i.category} · {i.pkg_name}{i.extras?.length ? ` + ${i.extras.map((x) => x.name).join(', ')}` : ''} · {gbp(itemTotal(i, w.guests))}</small></span>
                    <span className={s.btnRow}>
                      <Link href={`/platform/couple/s/${i.supplier_id}#enquire`} className={`${s.btn} ${s.sm}`}>Send request</Link>
                      <form action={removeFromPlan}><input type="hidden" name="id" value={i.id} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Remove</Submit></form>
                    </span>
                  </div>
                ))}
                {!items.length && <p className={s.empty}>Nothing in this plan yet. On a supplier’s page choose a package and tap “Add to my plan”.</p>}
              </div>
            </div>

            {/* savings finder */}
            {items.length > 0 && (
              <div className={s.card}>
                <div className={s.row}><b className={s.h3}><Icon name="sparkle" /> Savings finder</b><span className={s.plusBadge}>Plus</span></div>
                {!savings.length ? (
                  <p className={s.muted}>No cheaper matches right now for your date, region and {w.guests} guests. We check again every time you open this page.</p>
                ) : plus ? (
                  <div className={s.list}>
                    {savings.map((x) => (
                      <div key={x.item_id} className={s.li}>
                        <span><b>Save {gbp(x.save)} on {x.category.toLowerCase()}</b><small><Link href={`/platform/couple/s/${x.alt_supplier_id}`}>{x.alt_name}</Link> · {x.alt_package} · {gbp(x.alt_total)} instead of {x.current} at {gbp(x.current_total)}</small></span>
                        <form action={swapInPlan}><input type="hidden" name="item" value={x.item_id} /><input type="hidden" name="sid" value={x.alt_supplier_id} /><input type="hidden" name="package_id" value={x.alt_package_id} /><Submit className={`${s.ghost} ${s.sm}`} pending="…">Swap</Submit></form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={s.notice} style={{ display: 'grid', gap: 8 }}>
                    <b>We found up to {gbp(potential)} of possible savings across {savings.length} {savings.length === 1 ? 'supplier' : 'suppliers'}.</b>
                    <span className={s.muted}>Asteria Plus shows you which suppliers, and lets you swap them into your plan in one tap.</span>
                    <Link href="/platform/couple/plus" className={`${s.btn} ${s.sm}`} style={{ justifySelf: 'start' }}>See Asteria Plus</Link>
                  </div>
                )}
              </div>
            )}

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
              <span className={s.muted}>{plan.name} · {w.guests} guests</span>
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
      )}
    </Shell>
  );
}
