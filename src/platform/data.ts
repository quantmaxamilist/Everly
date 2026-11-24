import { db } from './db';
import type { Extra, Pkg } from './util';

export type Supplier = {
  id: string; user_id: string; name: string; category: string; town: string; region: string; style: string; about: string;
  capacity: number | null; travels: boolean; phone: string; website: string; status: 'pending' | 'approved' | 'suspended';
  plan: string; featured: boolean; spotlight: boolean; brochure_url: string | null; brochure_name: string | null; created_at: Date;
  approved_at: Date | null; stripe_account: string | null; stripe_account_mode: string | null; payouts_ready: boolean;
  stripe_customer: string | null; stripe_customer_mode: string | null; plan_sub: string | null; featured_sub: string | null; spotlight_sub: string | null;
};
export type Photo = { id: string; url: string; position: number };
export type Booking = {
  id: string; ref_no: string; supplier_id: string; wedding_id: string | null; couple_user_id: string | null; couple_name: string; couple_email: string; couple_phone: string;
  date: string; end_date: string | null; guests: number; package_id: string | null; package_name: string; extras: { name: string; price: number }[];
  total: number; deposit_pct: number; balance_weeks: number; status: string; source: string; message: string; note: string; contract_terms: string;
  contract_sent_at: Date | null; contract_signed_at: Date | null; paid: number; created_at: Date; updated_at: Date;
};
export type Wedding = { id: string; user_id: string; names: string; date: string | null; region: string; place: string; guests: number; budget: number };
export type Msg = { id: string; booking_id: string; sender_id: string | null; kind: 'text' | 'note'; body: string; created_at: Date };

/* dates come back as strings so they're safe to render anywhere */
import type postgres from 'postgres';
const B = (sql: postgres.Sql) => sql`b.*, b.ref_no::text as ref_no, b.date::text as date, b.end_date::text as end_date`;

export async function supplierFor(userId: string): Promise<Supplier | null> {
  const sql = await db();
  const [r] = await sql<Supplier[]>`select * from suppliers where user_id = ${userId}`;
  return r ?? null;
}
export async function supplierById(id: string): Promise<Supplier | null> {
  const sql = await db();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [r] = await sql<Supplier[]>`select * from suppliers where id = ${id}`;
  return r ?? null;
}
export async function photosOf(supplierId: string): Promise<Photo[]> {
  const sql = await db();
  return sql<Photo[]>`select id, url, position from photos where supplier_id = ${supplierId} order by position, created_at`;
}
export async function packagesOf(supplierId: string, all = false): Promise<Pkg[]> {
  const sql = await db();
  return all
    ? sql<Pkg[]>`select id, name, summary, price, per_guest, deposit, max_guests, hours, includes from packages where supplier_id = ${supplierId} order by position, created_at`
    : sql<Pkg[]>`select id, name, summary, price, per_guest, deposit, max_guests, hours, includes from packages where supplier_id = ${supplierId} and active order by position, created_at`;
}
export async function extrasOf(supplierId: string): Promise<Extra[]> {
  const sql = await db();
  return sql<Extra[]>`select id, name, price, per_guest from extras where supplier_id = ${supplierId} order by position, name`;
}
export async function weddingFor(userId: string): Promise<Wedding | null> {
  const sql = await db();
  const [w] = await sql<Wedding[]>`select id, user_id, names, date::text as date, region, place, guests, budget from weddings where user_id = ${userId}`;
  return w ?? null;
}
export async function bookingsForSupplier(supplierId: string): Promise<Booking[]> {
  const sql = await db();
  return sql<Booking[]>`select ${B(sql)} from bookings b where b.supplier_id = ${supplierId} order by b.date`;
}
export async function bookingsForCouple(userId: string): Promise<(Booking & { supplier_name: string; category: string; cover: string | null })[]> {
  const sql = await db();
  return sql`select ${B(sql)}, s.name as supplier_name, s.category,
      (select url from photos p where p.supplier_id = s.id order by position, created_at limit 1) as cover
    from bookings b join suppliers s on s.id = b.supplier_id where b.couple_user_id = ${userId} order by b.created_at desc`;
}
export async function bookingById(id: string): Promise<Booking | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = await db();
  const [b] = await sql<Booking[]>`select ${B(sql)} from bookings b where id = ${id}`;
  return b ?? null;
}
export async function messagesOf(bookingId: string): Promise<(Msg & { sender_name: string | null })[]> {
  const sql = await db();
  return sql`select m.*, u.name as sender_name from messages m left join users u on u.id = m.sender_id where booking_id = ${bookingId} order by m.created_at`;
}
export async function notificationsFor(userId: string, limit = 6) {
  const sql = await db();
  return sql<{ id: string; body: string; link: string; read: boolean; created_at: Date }[]>`select id, body, link, read, created_at from notifications where user_id = ${userId} order by created_at desc limit ${limit}`;
}
export async function notify(userId: string | null | undefined, body: string, link = '') {
  if (!userId) return;
  const sql = await db();
  await sql`insert into notifications (user_id, body, link) values (${userId}, ${body}, ${link})`;
}
/** Is the supplier free on a date? (closed days and booked weddings block it) */
export async function supplierFree(supplierId: string, date: string, ignoreBooking?: string) {
  const sql = await db();
  const [c] = await sql`select 1 from closed_dates where supplier_id = ${supplierId} and date = ${date}`;
  if (c) return false;
  const [b] = await sql`select 1 from bookings where supplier_id = ${supplierId} and status in ('deposit','paid') and ${date}::date between date and coalesce(end_date, date) and id <> ${ignoreBooking ?? '00000000-0000-0000-0000-000000000000'}`;
  return !b;
}
export async function markRead(bookingId: string, side: 'supplier' | 'couple') {
  const sql = await db();
  if (side === 'supplier') await sql`update messages set read_supplier = true where booking_id = ${bookingId} and not read_supplier`;
  else await sql`update messages set read_couple = true where booking_id = ${bookingId} and not read_couple`;
}
