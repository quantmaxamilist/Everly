'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { requireUser } from '../auth';
import { supplierFor, notify } from '../data';
import { storeFile, deleteFile } from '../storage';
import { priceText, priceWatch } from '../plus';
import { CATEGORIES, REGIONS, clean, num, qs } from '../util';

async function me() {
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  return { u, sup };
}
const L = '/platform/supplier/listing';
const back = (path: string, k: 'm' | 'e', msg: string) => { const [p, h] = path.split('#'); return redirect(p + qs({ [k]: msg }) + (h ? '#' + h : '')); };

export async function saveDetails(fd: FormData) {
  const { sup } = await me();
  const name = clean(fd.get('name'), 120);
  const category = clean(fd.get('category'), 60);
  if (!name) back(L, 'e', 'Business name can’t be empty');
  const sql = await db();
  await sql`update suppliers set
    name = ${name},
    category = ${(CATEGORIES as readonly string[]).includes(category) ? category : sup.category},
    town = ${clean(fd.get('town'), 80)},
    region = ${REGIONS.includes(clean(fd.get('region'), 60)) ? clean(fd.get('region'), 60) : sup.region},
    style = ${clean(fd.get('style'), 60)},
    about = ${clean(fd.get('about'), 4000)},
    capacity = ${num(fd.get('capacity')) || null},
    travels = ${fd.get('travels') === 'on'},
    phone = ${clean(fd.get('phone'), 40)},
    website = ${clean(fd.get('website'), 200)}
    where id = ${sup.id}`;
  revalidatePath(L);
  back(L, 'm', 'Details saved');
}

export async function addPhoto(fd: FormData): Promise<{ error?: string }> {
  const { sup } = await me();
  const f = fd.get('file');
  if (!(f instanceof File) || !f.type.startsWith('image/')) return { error: 'Please choose an image file' };
  const sql = await db();
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from photos where supplier_id = ${sup.id}`;
  if (n >= 30) return { error: 'You can have up to 30 photos' };
  try {
    const url = await storeFile(f, `suppliers/${sup.id}`);
    await sql`insert into photos (supplier_id, url, position) values (${sup.id}, ${url}, ${n})`;
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath(L);
  return {};
}

export async function removePhoto(fd: FormData) {
  const { sup } = await me();
  const sql = await db();
  const [p] = await sql<{ url: string }[]>`delete from photos where id = ${clean(fd.get('id'), 40)} and supplier_id = ${sup.id} returning url`;
  if (p) await deleteFile(p.url);
  revalidatePath(L);
  back(L, 'm', 'Photo removed');
}

export async function makeCover(fd: FormData) {
  const { sup } = await me();
  const sql = await db();
  const id = clean(fd.get('id'), 40);
  await sql`update photos set position = case when id = ${id} then 0 else position + 1 end where supplier_id = ${sup.id}`;
  revalidatePath(L);
  back(L, 'm', 'Cover photo updated');
}

export async function savePackage(fd: FormData) {
  const { sup } = await me();
  const id = clean(fd.get('id'), 40);
  const name = clean(fd.get('name'), 120);
  const price = num(fd.get('price'));
  if (!name || price <= 0) back(L + '#packages', 'e', 'A package needs a name and a price');
  const includes = clean(fd.get('includes'), 4000).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 30);
  const vals = {
    name, summary: clean(fd.get('summary'), 200), price, per_guest: fd.get('per_guest') === 'on',
    deposit: Math.min(100, Math.max(0, num(fd.get('deposit')) || 25)), max_guests: num(fd.get('max_guests')) || null,
    hours: clean(fd.get('hours'), 80), includes,
  };
  const sql = await db();
  const [old] = id ? await sql<{ price: number; per_guest: boolean }[]>`select price, per_guest from packages where id = ${id} and supplier_id = ${sup.id}` : [];
  if (id) {
    await sql`update packages set name = ${vals.name}, summary = ${vals.summary}, price = ${vals.price}, per_guest = ${vals.per_guest}, deposit = ${vals.deposit},
      max_guests = ${vals.max_guests}, hours = ${vals.hours}, includes = ${vals.includes} where id = ${id} and supplier_id = ${sup.id}`;
  } else {
    await sql`insert into packages (supplier_id, name, summary, price, per_guest, deposit, max_guests, hours, includes, position)
      values (${sup.id}, ${vals.name}, ${vals.summary}, ${vals.price}, ${vals.per_guest}, ${vals.deposit}, ${vals.max_guests}, ${vals.hours}, ${vals.includes},
      (select coalesce(max(position), 0) + 1 from packages where supplier_id = ${sup.id}))`;
  }
  // price watch for couples with Asteria Plus
  if (sup.status === 'approved' && (!old || old.price !== vals.price || old.per_guest !== vals.per_guest)) {
    await priceWatch(sup.id, sup.name, priceText(vals.name, old ? old.price : null, vals.price, vals.per_guest));
  }
  revalidatePath(L);
  back(L + '#packages', 'm', id ? `${name} updated` : `${name} added`);
}

export async function deletePackage(fd: FormData) {
  const { sup } = await me();
  const sql = await db();
  await sql`delete from packages where id = ${clean(fd.get('id'), 40)} and supplier_id = ${sup.id}`;
  revalidatePath(L);
  back(L + '#packages', 'm', 'Package removed');
}

export async function saveExtra(fd: FormData) {
  const { sup } = await me();
  const id = clean(fd.get('id'), 40);
  const name = clean(fd.get('name'), 120);
  if (!name) back(L + '#extras', 'e', 'An extra needs a name');
  const price = num(fd.get('price')); const pg = fd.get('per_guest') === 'on';
  const sql = await db();
  if (id) await sql`update extras set name = ${name}, price = ${price}, per_guest = ${pg} where id = ${id} and supplier_id = ${sup.id}`;
  else await sql`insert into extras (supplier_id, name, price, per_guest, position) values (${sup.id}, ${name}, ${price}, ${pg}, (select coalesce(max(position), 0) + 1 from extras where supplier_id = ${sup.id}))`;
  revalidatePath(L);
  back(L + '#extras', 'm', id ? 'Extra updated' : 'Extra added');
}

export async function deleteExtra(fd: FormData) {
  const { sup } = await me();
  const sql = await db();
  await sql`delete from extras where id = ${clean(fd.get('id'), 40)} and supplier_id = ${sup.id}`;
  revalidatePath(L);
  back(L + '#extras', 'm', 'Extra removed');
}

export async function uploadBrochure(fd: FormData): Promise<{ error?: string }> {
  const { sup } = await me();
  const f = fd.get('file');
  if (!(f instanceof File) || f.type !== 'application/pdf') return { error: 'Please choose a PDF' };
  try {
    const url = await storeFile(f, `brochures/${sup.id}`);
    const sql = await db();
    await deleteFile(sup.brochure_url);
    await sql`update suppliers set brochure_url = ${url}, brochure_name = ${f.name.slice(0, 120)} where id = ${sup.id}`;
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath(L);
  return {};
}

export async function removeBrochure() {
  const { sup } = await me();
  const sql = await db();
  await deleteFile(sup.brochure_url);
  await sql`update suppliers set brochure_url = null, brochure_name = null where id = ${sup.id}`;
  revalidatePath(L);
  back(L, 'm', 'Brochure removed');
}

/* ---------------- calendar ---------------- */
const C = '/platform/supplier/calendar';
export async function toggleClosed(fd: FormData) {
  const { sup } = await me();
  const date = clean(fd.get('date'), 10); const month = clean(fd.get('month'), 7);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(C, 'e', 'Pick a date');
  const sql = await db();
  const [had] = await sql`delete from closed_dates where supplier_id = ${sup.id} and date = ${date} returning 1`;
  if (!had) await sql`insert into closed_dates (supplier_id, date, reason) values (${sup.id}, ${date}, ${clean(fd.get('reason'), 80) || 'Closed'})`;
  revalidatePath(C);
  redirect(C + qs({ month, m: had ? 'Date re-opened' : 'Date closed — couples can’t enquire for it' }));
}

export async function addDirectBooking(fd: FormData) {
  const { sup } = await me();
  const date = clean(fd.get('date'), 10);
  const couple = clean(fd.get('couple'), 120);
  if (!couple || !/^\d{4}-\d{2}-\d{2}$/.test(date)) back(C, 'e', 'A booking needs the couple’s names and a date');
  const total = num(fd.get('total')); const paid = Math.min(total || Infinity, num(fd.get('paid')));
  const status = total > 0 && paid >= total ? 'paid' : 'deposit';
  const sql = await db();
  const [b] = await sql<{ id: string }[]>`insert into bookings (supplier_id, couple_name, couple_email, couple_phone, date, guests, package_name, total, paid, deposit_pct, status, source, note)
    values (${sup.id}, ${couple}, ${clean(fd.get('email'), 200)}, ${clean(fd.get('phone'), 40)}, ${date}, ${num(fd.get('guests'))}, ${clean(fd.get('package'), 120) || 'Direct booking'},
    ${total}, ${paid}, ${num(fd.get('deposit_pct')) || 25}, ${status}, 'direct', ${clean(fd.get('note'), 1000)}) returning id`;
  revalidatePath(C);
  redirect(`/platform/supplier/enquiries/${b.id}` + qs({ m: 'Direct booking added — the date is now held on your calendar' }));
}

/* ---------------- account ---------------- */
export async function requestPlan(fd: FormData) {
  const { u, sup } = await me();
  const plan = clean(fd.get('plan'), 20);
  const sql = await db();
  const admins = await sql<{ id: string }[]>`select id from users where role = 'admin'`;
  for (const a of admins) await notify(a.id, `${sup.name} asked to switch plan to ${plan}`, '/admin/suppliers');
  void u;
  back('/platform/supplier/account', 'm', 'Request sent — Asteria will confirm your plan change by email');
}
