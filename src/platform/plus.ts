import { db } from './db';
import { notify, type Wedding } from './data';
import { sendMail, wrap, escapeHtml } from './mail';
import { extraTotal, gbp, pkgTotal } from './util';

/* ---------------- Asteria Plus (Wedding Pass) ---------------- */
export async function isPlus(userId: string) {
  const sql = await db();
  const [r] = await sql<{ plus: boolean }[]>`select plus from users where id = ${userId}`;
  return !!r?.plus;
}

/* ---------------- plans ---------------- */
export type WPlan = { id: string; name: string };
/** The couple's plans (always at least one). */
export async function plansFor(weddingId: string): Promise<WPlan[]> {
  const sql = await db();
  let rows = await sql<WPlan[]>`select id, name from wedding_plans where wedding_id = ${weddingId} order by created_at`;
  if (!rows.length) {
    await sql`insert into wedding_plans (wedding_id, name) values (${weddingId}, 'My plan')`;
    rows = await sql<WPlan[]>`select id, name from wedding_plans where wedding_id = ${weddingId} order by created_at`;
  }
  return rows;
}

export type PlanItem = { id: string; supplier_id: string; supplier_name: string; category: string; region: string; package_id: string; pkg_name: string; price: number; per_guest: boolean; extras: { name: string; price: number; per_guest: boolean }[] | null };
export async function planItems(planId: string): Promise<PlanItem[]> {
  const sql = await db();
  return sql<PlanItem[]>`
    select i.id, s.id as supplier_id, s.name as supplier_name, s.category, s.region, k.id as package_id, k.name as pkg_name, k.price, k.per_guest,
      (select json_agg(json_build_object('name', e.name, 'price', e.price, 'per_guest', e.per_guest)) from extras e where e.id = any(i.extras)) as extras
    from plan_items i join suppliers s on s.id = i.supplier_id join packages k on k.id = i.package_id
    where i.plan_id = ${planId} order by s.category, s.name`;
}
export const itemTotal = (i: PlanItem, guests: number) => pkgTotal(i, guests) + (i.extras ?? []).reduce((t, x) => t + extraTotal(x, guests), 0);

/* ---------------- savings finder ---------------- */
export type Saving = { item_id: string; category: string; current: string; current_total: number; alt_supplier_id: string; alt_name: string; alt_package_id: string; alt_package: string; alt_total: number; save: number };

/**
 * For each supplier in a plan, the cheapest other approved supplier in the same category that
 * covers the couple's region, fits their guests and is free on their date. Uses Asteria's own data only.
 */
export async function findSavings(w: Wedding, items: PlanItem[], minSave = 50): Promise<Saving[]> {
  if (!items.length) return [];
  const sql = await db();
  const out: Saving[] = [];
  for (const i of items) {
    const cur = itemTotal(i, w.guests);
    const [alt] = await sql<{ supplier_id: string; name: string; package_id: string; package: string; total: number }[]>`
      select s.id as supplier_id, s.name, k.id as package_id, k.name as package,
        (case when k.per_guest then k.price * ${w.guests} else k.price end)::int as total
      from suppliers s join packages k on k.supplier_id = s.id and k.active
      where s.status = 'approved' and s.category = ${i.category} and s.id <> ${i.supplier_id}
        and (${w.region} = '' or s.region = ${w.region} or s.travels)
        and (s.capacity is null or s.capacity >= ${w.guests})
        and (k.max_guests is null or k.max_guests >= ${w.guests})
        ${w.date ? sql`and not exists (select 1 from closed_dates c where c.supplier_id = s.id and c.date = ${w.date})
          and not exists (select 1 from bookings b where b.supplier_id = s.id and b.status in ('deposit','paid') and ${w.date}::date between b.date and coalesce(b.end_date, b.date))` : sql``}
      order by total asc limit 1`;
    if (alt && cur - alt.total >= minSave) {
      out.push({ item_id: i.id, category: i.category, current: i.supplier_name, current_total: cur, alt_supplier_id: alt.supplier_id, alt_name: alt.name, alt_package_id: alt.package_id, alt_package: alt.package, alt_total: alt.total, save: cur - alt.total });
    }
  }
  return out.sort((a, b) => b.save - a.save);
}

/* ---------------- price watch ---------------- */
/** Tells Plus couples who saved or planned this supplier about a price change or new package. */
export async function priceWatch(supplierId: string, supplierName: string, text: string) {
  const sql = await db();
  const people = await sql<{ id: string; email: string; name: string }[]>`
    select distinct u.id, u.email, u.name from users u
    where u.plus and u.role = 'couple' and u.status = 'active' and (
      exists (select 1 from saved v where v.user_id = u.id and v.supplier_id = ${supplierId})
      or exists (select 1 from plan_items i join weddings w on w.id = i.wedding_id where w.user_id = u.id and i.supplier_id = ${supplierId}))`;
  for (const p of people) {
    await notify(p.id, `Price watch: ${supplierName} — ${text}`, `/platform/couple/s/${supplierId}`);
    await sendMail(p.email, `Price watch: ${supplierName}`, wrap(`${supplierName} updated their prices`,
      `<p>${escapeHtml(text)}.</p><p>You're seeing this because you saved ${escapeHtml(supplierName)} and have Asteria Plus.</p>`,
      { href: `https://www.asteria-events.com/platform/couple/s/${supplierId}`, label: 'See their packages' }));
  }
  return people.length;
}
export const priceText = (name: string, before: number | null, after: number, perGuest: boolean) =>
  before == null ? `new package “${name}” from ${gbp(after)}${perGuest ? ' per guest' : ''}`
    : `“${name}” is now ${gbp(after)}${perGuest ? ' per guest' : ''} (was ${gbp(before)})`;
