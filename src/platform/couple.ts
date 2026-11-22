import type postgres from 'postgres';
import { db } from './db';

export type Card = { id: string; name: string; category: string; town: string; region: string; capacity: number | null; travels: boolean; featured: boolean; cover: string | null; from_price: number | null; from_pg: boolean | null };

const CARD = (sql: postgres.Sql) => sql`s.id, s.name, s.category, s.town, s.region, s.capacity, s.travels, s.featured,
  (select url from photos p where p.supplier_id = s.id order by position, created_at limit 1) as cover,
  (select price from packages k where k.supplier_id = s.id and k.active order by price limit 1) as from_price,
  (select per_guest from packages k where k.supplier_id = s.id and k.active order by price limit 1) as from_pg`;

export type Filters = { cat?: string; q?: string; region?: string; style?: string; max?: number; guests?: number; fits?: boolean; date?: string; free?: boolean };

export async function searchSuppliers(f: Filters): Promise<Card[]> {
  const sql = await db();
  const q = f.q ? `%${f.q.replace(/[%_]/g, '')}%` : null;
  return sql<Card[]>`
    select ${CARD(sql)} from suppliers s
    where s.status = 'approved'
      ${f.cat ? sql`and s.category = ${f.cat}` : sql``}
      ${f.region ? sql`and (s.region = ${f.region} or s.travels)` : sql``}
      ${q ? sql`and (s.town ilike ${q} or s.region ilike ${q} or s.name ilike ${q})` : sql``}
      ${f.style ? sql`and s.style = ${f.style}` : sql``}
      ${f.fits && f.guests ? sql`and (s.capacity is null or s.capacity >= ${f.guests})` : sql``}
      ${f.max ? sql`and exists (select 1 from packages k where k.supplier_id = s.id and k.active and (case when k.per_guest then k.price * ${f.guests || 100} else k.price end) <= ${f.max})` : sql``}
      ${f.free && f.date ? sql`and not exists (select 1 from closed_dates c where c.supplier_id = s.id and c.date = ${f.date})
                              and not exists (select 1 from bookings b where b.supplier_id = s.id and b.status in ('deposit','paid') and ${f.date}::date between b.date and coalesce(b.end_date, b.date))` : sql``}
    order by s.featured desc, s.created_at
    limit 120`;
}

export async function cardsByIds(ids: string[]): Promise<Card[]> {
  if (!ids.length) return [];
  const sql = await db();
  return sql<Card[]>`select ${CARD(sql)} from suppliers s where s.id = any(${ids}) and s.status = 'approved'`;
}

export async function savedIds(userId: string): Promise<Set<string>> {
  const sql = await db();
  const r = await sql<{ supplier_id: string }[]>`select supplier_id from saved where user_id = ${userId}`;
  return new Set(r.map((x) => x.supplier_id));
}
